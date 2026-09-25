#!/usr/bin/env python3
"""Aggregate privacy-minimized verified crawler analytics from MarketDeck Caddy logs.

The report keeps crawler identity, URL family, response status, response bytes,
latency, and first/last-seen timestamps observable without emitting source IPs.

Crawler identity reuses the SG-01 verifier:
- Cloudflare direct-peer trust boundary;
- provider CIDR verification for Google/OpenAI/Anthropic/Perplexity;
- Bing forward-confirmed reverse DNS.

This script is read-only with respect to site/application state. When --output is
used, the report is written atomically with mode 0600.
"""
from __future__ import annotations

import argparse
import collections
import importlib.util
import json
import math
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable

HERE = Path(__file__).resolve().parent
AUDIT_PATH = HERE / "audit_crawler_access_log.py"
_spec = importlib.util.spec_from_file_location("marketdeck_crawler_audit", AUDIT_PATH)
audit_mod = importlib.util.module_from_spec(_spec)
assert _spec.loader is not None
_spec.loader.exec_module(audit_mod)

DEFAULT_LOG = audit_mod.DEFAULT_LOG
SEARCH_RETRIEVAL_AGENTS = audit_mod.SEARCH_RETRIEVAL_AGENTS
TRAINING_AGENTS = audit_mod.TRAINING_AGENTS


def utc_iso(epoch: float | int | None) -> str | None:
    if not isinstance(epoch, (int, float)) or not math.isfinite(float(epoch)):
        return None
    return (
        datetime.fromtimestamp(float(epoch), tz=timezone.utc)
        .isoformat(timespec="seconds")
        .replace("+00:00", "Z")
    )


def url_family(uri: str) -> str:
    path = audit_mod.uri_without_query(uri or "")
    lower = path.lower()

    if path == "/robots.txt":
        return "robots"
    if path == "/sitemap.xml" or lower.startswith("/sitemap-"):
        return "sitemap"
    if path == "/" or lower.startswith("/credits/"):
        return "web"
    if lower.startswith("/intelligence/"):
        return "intelligence"
    if lower.startswith("/screener/"):
        return "stockproof"
    if lower.startswith("/charts/"):
        return "charting"
    if lower.startswith("/futures-and-options/"):
        return "fo"
    if lower.startswith("/commentary/"):
        return "commentary"
    if lower.startswith("/crypto/"):
        return "crypto"
    if (
        lower.startswith("/assets/")
        or lower.startswith("/licenses/")
        or lower.endswith(
            (
                ".css",
                ".js",
                ".mjs",
                ".svg",
                ".webp",
                ".png",
                ".jpg",
                ".jpeg",
                ".gif",
                ".ico",
                ".woff",
                ".woff2",
                ".pdf",
            )
        )
    ):
        return "asset"
    return "other"


def crawler_role(agent: str) -> str:
    if agent in SEARCH_RETRIEVAL_AGENTS:
        return "search_retrieval"
    if agent in TRAINING_AGENTS:
        return "training"
    return "other"


class Metrics:
    def __init__(self) -> None:
        self.requests = 0
        self.first_seen: float | None = None
        self.last_seen: float | None = None
        self.statuses = collections.Counter()
        self.bytes_total = 0
        self.bytes_max = 0
        self.bytes_values: list[float] = []
        self.duration_values: list[float] = []
        self.paths = set()
        self.path_counts = collections.Counter()

    def add(self, record: dict[str, Any], path: str) -> None:
        self.requests += 1
        self.paths.add(path)
        self.path_counts[path] += 1

        ts = record.get("ts")
        if isinstance(ts, (int, float)) and math.isfinite(float(ts)):
            ts = float(ts)
            self.first_seen = ts if self.first_seen is None else min(self.first_seen, ts)
            self.last_seen = ts if self.last_seen is None else max(self.last_seen, ts)

        status = record.get("status")
        if isinstance(status, int):
            self.statuses[str(status)] += 1
        elif isinstance(status, float) and status.is_integer():
            self.statuses[str(int(status))] += 1
        elif status is not None:
            self.statuses[str(status)] += 1

        size = record.get("size")
        if isinstance(size, (int, float)) and math.isfinite(float(size)) and size >= 0:
            value = float(size)
            self.bytes_values.append(value)
            self.bytes_total += int(value)
            self.bytes_max = max(self.bytes_max, int(value))

        duration = record.get("duration")
        if (
            isinstance(duration, (int, float))
            and math.isfinite(float(duration))
            and duration >= 0
        ):
            self.duration_values.append(float(duration))

    def summary(self, top_paths: int) -> dict[str, Any]:
        byte_count = len(self.bytes_values)
        duration_count = len(self.duration_values)
        return {
            "requests": self.requests,
            "unique_paths": len(self.paths),
            "first_seen": utc_iso(self.first_seen),
            "last_seen": utc_iso(self.last_seen),
            "status_counts": dict(sorted(self.statuses.items())),
            "bytes": {
                "samples": byte_count,
                "total": self.bytes_total,
                "average": (
                    self.bytes_total / byte_count if byte_count else None
                ),
                "max": self.bytes_max if byte_count else None,
                "p95": audit_mod.percentile(self.bytes_values, 0.95),
            },
            "latency_seconds": {
                "samples": duration_count,
                "average": (
                    sum(self.duration_values) / duration_count
                    if duration_count
                    else None
                ),
                "p50": audit_mod.percentile(self.duration_values, 0.50),
                "p95": audit_mod.percentile(self.duration_values, 0.95),
                "p99": audit_mod.percentile(self.duration_values, 0.99),
                "max": max(self.duration_values) if duration_count else None,
            },
            "top_paths": [
                {"path": path, "requests": count}
                for path, count in self.path_counts.most_common(top_paths)
            ],
        }


def _group_summary(
    groups: dict[str, Metrics],
    top_paths: int,
) -> dict[str, Any]:
    return {
        key: groups[key].summary(top_paths)
        for key in sorted(groups)
    }


def analyze_records(
    rows: Iterable[tuple[Path, dict[str, Any]]],
    *,
    cloudflare_ranges,
    registry,
    top_paths: int = 10,
    verify_func=None,
) -> dict[str, Any]:
    verify_func = verify_func or audit_mod.verify_claim

    claims = collections.defaultdict(collections.Counter)
    roles = collections.Counter()
    by_agent: dict[str, Metrics] = collections.defaultdict(Metrics)
    by_family: dict[str, Metrics] = collections.defaultdict(Metrics)
    by_agent_family: dict[str, Metrics] = collections.defaultdict(Metrics)
    overall = Metrics()
    verification_cache: dict[tuple[str, str], tuple[bool, str]] = {}

    records_seen = 0
    claimed_requests = 0
    verified_requests = 0

    for _, record in rows:
        records_seen += 1
        ua = str(record.get("user_agent") or "")
        agent = audit_mod.claimed_agent(ua)
        if not agent:
            continue

        claimed_requests += 1
        claims[agent]["claimed"] += 1

        req = record.get("request") or {}
        direct_peer = audit_mod.normalize_ip(req.get("remote_ip"))
        forwarded = audit_mod.normalize_ip(record.get("cf_connecting_ip"))

        if not audit_mod.in_ranges(direct_peer, cloudflare_ranges):
            claims[agent]["unverified_non_cloudflare_peer"] += 1
            continue

        if forwarded is None:
            claims[agent]["unverified_missing_cf_connecting_ip"] += 1
            continue

        cache_key = (agent, str(forwarded))
        if cache_key not in verification_cache:
            verification_cache[cache_key] = verify_func(
                agent,
                forwarded,
                registry,
            )

        verified, reason = verification_cache[cache_key]

        if not verified:
            if str(reason).startswith("verification_source_error:"):
                claims[agent]["unverified_source_error"] += 1
            else:
                claims[agent]["unverified_or_spoofed"] += 1
            continue

        claims[agent]["verified"] += 1
        verified_requests += 1
        role = crawler_role(agent)
        roles[role] += 1

        uri = str(req.get("uri") or "")
        path = audit_mod.uri_without_query(uri)
        family = url_family(uri)

        overall.add(record, path)
        by_agent[agent].add(record, path)
        by_family[family].add(record, path)
        by_agent_family[f"{agent}|{family}"].add(record, path)

    return {
        "schema_version": "1.0",
        "records_seen": records_seen,
        "claimed_crawler_requests": claimed_requests,
        "verified_crawler_requests": verified_requests,
        "verified_role_counts": dict(sorted(roles.items())),
        "crawler_claims": {
            agent: dict(sorted(counts.items()))
            for agent, counts in sorted(claims.items())
        },
        "overall_verified": overall.summary(top_paths),
        "by_agent": _group_summary(by_agent, top_paths),
        "by_family": _group_summary(by_family, top_paths),
        "by_agent_family": _group_summary(by_agent_family, top_paths),
    }


def build_report(
    *,
    log_path: Path,
    hours: float,
    timeout: float,
    top_paths: int,
) -> dict[str, Any]:
    since = None if hours <= 0 else time.time() - hours * 3600
    paths = audit_mod.iter_log_paths(log_path)
    registry = audit_mod.RangeRegistry(timeout=timeout)
    cloudflare_ranges = registry.cloudflare()

    report = analyze_records(
        audit_mod.load_records(paths, since),
        cloudflare_ranges=cloudflare_ranges,
        registry=registry,
        top_paths=max(1, top_paths),
    )
    report.update(
        {
            "generated_at": utc_iso(time.time()),
            "window_hours": hours,
            "log_files": [str(path) for path in paths],
            "official_sources": audit_mod.OFFICIAL_SOURCES,
        }
    )
    return report


def atomic_private_write(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_name(f".{path.name}.{os.getpid()}.tmp")
    data = (
        json.dumps(
            value,
            sort_keys=True,
            separators=(",", ":"),
            ensure_ascii=False,
            allow_nan=False,
        )
        + "\n"
    ).encode("utf-8")

    with temp.open("wb") as handle:
        handle.write(data)
        handle.flush()
        os.fsync(handle.fileno())

    os.chmod(temp, 0o600)
    os.replace(temp, path)


def print_human(report: dict[str, Any]) -> None:
    print("MarketDeck verified crawler analytics")
    print(f"generated_at={report['generated_at']}")
    print(f"window_hours={report['window_hours']}")
    print(f"records_seen={report['records_seen']}")
    print(
        "claimed_crawler_requests="
        f"{report['claimed_crawler_requests']}"
    )
    print(
        "verified_crawler_requests="
        f"{report['verified_crawler_requests']}"
    )

    print()
    print("Verified roles")
    if not report["verified_role_counts"]:
        print("  none")
    else:
        for role, count in report["verified_role_counts"].items():
            print(f"  {role}={count}")

    print()
    print("Verified crawlers")
    if not report["by_agent"]:
        print("  none")
    else:
        for agent, row in report["by_agent"].items():
            print(
                f"  {agent}: requests={row['requests']} "
                f"unique_paths={row['unique_paths']} "
                f"first_seen={row['first_seen']} "
                f"last_seen={row['last_seen']}"
            )

    print()
    print("URL families")
    if not report["by_family"]:
        print("  none")
    else:
        for family, row in report["by_family"].items():
            print(
                f"  {family}: requests={row['requests']} "
                f"unique_paths={row['unique_paths']} "
                f"statuses={row['status_counts']} "
                f"bytes_total={row['bytes']['total']} "
                f"latency_p95={row['latency_seconds']['p95']}"
            )


def main(argv=None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--log", type=Path, default=DEFAULT_LOG)
    parser.add_argument("--hours", type=float, default=24.0)
    parser.add_argument("--timeout", type=float, default=15.0)
    parser.add_argument("--top-paths", type=int, default=10)
    parser.add_argument("--json", action="store_true")
    parser.add_argument(
        "--output",
        type=Path,
        help="optional private JSON snapshot; written mode 0600",
    )
    args = parser.parse_args(argv)

    try:
        report = build_report(
            log_path=args.log,
            hours=args.hours,
            timeout=args.timeout,
            top_paths=max(1, args.top_paths),
        )
    except audit_mod.SourceError as exc:
        print(f"CRAWLER_ANALYTICS_SOURCE_ERROR {exc}", file=sys.stderr)
        return 2

    if args.output:
        atomic_private_write(args.output, report)

    if args.json:
        print(json.dumps(report, indent=2, sort_keys=True))
    else:
        print_human(report)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
