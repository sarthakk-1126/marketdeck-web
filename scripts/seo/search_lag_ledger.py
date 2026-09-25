#!/usr/bin/env python3
"""Private MarketDeck discovery/crawl/index/ranking/citation observation ledger.

This tool deliberately keeps search lifecycle stages separate. It does not infer
one stage from another and does not contact search engines.

Stages:
- published
- notified
- first_verified_crawl
- search_discovered
- indexed
- first_impression
- first_ai_citation

The ledger is private operational state and should be stored mode 0600.
"""
from __future__ import annotations

import argparse
import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urlsplit

HOST = "marketdeck.in"
STAGES = (
    "published",
    "notified",
    "first_verified_crawl",
    "search_discovered",
    "indexed",
    "first_impression",
    "first_ai_citation",
)
ENGINE_REQUIRED = {
    "search_discovered",
    "indexed",
    "first_impression",
    "first_ai_citation",
}
ISO_Z = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$")


class LedgerError(RuntimeError):
    pass


def canonical_json_bytes(value: Any) -> bytes:
    return json.dumps(
        value,
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
        allow_nan=False,
    ).encode("utf-8")


def parse_ts(value: str) -> datetime:
    if not isinstance(value, str) or not ISO_Z.fullmatch(value):
        raise LedgerError("invalid_timestamp")
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as exc:
        raise LedgerError("invalid_timestamp") from exc


def normalize_ts(value: str) -> str:
    parsed = parse_ts(value)
    return parsed.astimezone(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def validate_url(url: str) -> str:
    if not isinstance(url, str) or not url:
        raise LedgerError("invalid_url")
    parsed = urlsplit(url)
    if (
        parsed.scheme != "https"
        or parsed.netloc != HOST
        or parsed.username
        or parsed.password
        or parsed.fragment
    ):
        raise LedgerError("invalid_url")
    return url


def empty_ledger() -> dict[str, Any]:
    return {"schema_version": "1.0", "urls": {}}


def load_ledger(path: Path) -> dict[str, Any]:
    if not path.exists():
        return empty_ledger()
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        raise LedgerError("ledger_corrupt") from exc
    if (
        not isinstance(value, dict)
        or value.get("schema_version") != "1.0"
        or not isinstance(value.get("urls"), dict)
    ):
        raise LedgerError("ledger_corrupt")
    return value


def atomic_write(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_name(f".{path.name}.{os.getpid()}.tmp")
    data = canonical_json_bytes(value) + b"\n"
    with temp.open("wb") as handle:
        handle.write(data)
        handle.flush()
        os.fsync(handle.fileno())
    os.chmod(temp, 0o600)
    os.replace(temp, path)
    try:
        fd = os.open(path.parent, os.O_RDONLY)
        try:
            os.fsync(fd)
        finally:
            os.close(fd)
    except OSError:
        pass


def _slot_key(stage: str, engine: str | None, agent: str | None) -> str:
    if stage in ENGINE_REQUIRED:
        if not engine:
            raise LedgerError("engine_required")
        return f"{stage}:{engine.lower()}"
    if stage == "first_verified_crawl":
        if not agent:
            raise LedgerError("agent_required")
        return f"{stage}:{agent}"
    if engine or agent:
        raise LedgerError("unexpected_dimension")
    return stage


def record_observation(
    ledger: dict[str, Any],
    *,
    url: str,
    stage: str,
    at: str,
    engine: str | None = None,
    agent: str | None = None,
    evidence: str | None = None,
) -> bool:
    url = validate_url(url)
    if stage not in STAGES:
        raise LedgerError("invalid_stage")
    timestamp = normalize_ts(at)
    key = _slot_key(stage, engine, agent)

    rows = ledger.setdefault("urls", {})
    item = rows.setdefault(url, {"observations": {}})
    observations = item.setdefault("observations", {})
    existing = observations.get(key)

    row = {
        "stage": stage,
        "at": timestamp,
        "engine": engine.lower() if engine else None,
        "agent": agent,
        "evidence": evidence,
    }

    if existing is None:
        observations[key] = row
        return True

    old = parse_ts(existing["at"])
    new = parse_ts(timestamp)

    # First-observation semantics. Never move a first-seen timestamp later.
    if new < old:
        observations[key] = row
        return True
    return False


def seconds_between(start: str | None, end: str | None) -> float | None:
    if not start or not end:
        return None
    seconds = (parse_ts(end) - parse_ts(start)).total_seconds()
    return seconds if seconds >= 0 else None


def _find(obs: dict[str, Any], key: str) -> str | None:
    row = obs.get(key)
    return row.get("at") if isinstance(row, dict) else None


def metrics_for_url(item: dict[str, Any]) -> dict[str, Any]:
    obs = item.get("observations", {})
    published = _find(obs, "published")
    notified = _find(obs, "notified")

    crawl_times = [
        row.get("at")
        for key, row in obs.items()
        if key.startswith("first_verified_crawl:") and isinstance(row, dict)
    ]
    first_crawl = min(crawl_times, key=parse_ts) if crawl_times else None

    engines = sorted({
        key.split(":", 1)[1]
        for key in obs
        if ":" in key and key.split(":", 1)[0] in ENGINE_REQUIRED
    })

    engine_metrics = {}
    for engine in engines:
        discovered = _find(obs, f"search_discovered:{engine}")
        indexed = _find(obs, f"indexed:{engine}")
        impression = _find(obs, f"first_impression:{engine}")
        citation = _find(obs, f"first_ai_citation:{engine}")
        engine_metrics[engine] = {
            "discovery_lag_seconds": seconds_between(published, discovered),
            "index_lag_seconds": seconds_between(discovered or published, indexed),
            "ranking_signal_lag_seconds": seconds_between(indexed or published, impression),
            "citation_lag_seconds": seconds_between(published, citation),
        }

    return {
        "notification_lag_seconds": seconds_between(published, notified),
        "crawl_lag_seconds": seconds_between(published, first_crawl),
        "engines": engine_metrics,
    }


def report(ledger: dict[str, Any]) -> dict[str, Any]:
    rows = {}
    for url, item in sorted(ledger.get("urls", {}).items()):
        rows[url] = metrics_for_url(item)
    return {"schema_version": "1.0", "urls": rows}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--ledger", required=True, type=Path)
    sub = parser.add_subparsers(dest="command", required=True)

    add = sub.add_parser("record")
    add.add_argument("--url", required=True)
    add.add_argument("--stage", required=True, choices=STAGES)
    add.add_argument("--at", required=True)
    add.add_argument("--engine")
    add.add_argument("--agent")
    add.add_argument("--evidence")

    show = sub.add_parser("report")
    show.add_argument("--json", action="store_true")

    args = parser.parse_args()

    try:
        ledger = load_ledger(args.ledger)

        if args.command == "record":
            changed = record_observation(
                ledger,
                url=args.url,
                stage=args.stage,
                at=args.at,
                engine=args.engine,
                agent=args.agent,
                evidence=args.evidence,
            )
            if changed:
                atomic_write(args.ledger, ledger)
            print(json.dumps({"changed": changed}, sort_keys=True))
            return 0

        value = report(ledger)
        if args.json:
            print(json.dumps(value, indent=2, sort_keys=True))
        else:
            print(f"urls={len(value['urls'])}")
            for url, metrics in value["urls"].items():
                print(url)
                print(
                    "  notification_lag_seconds="
                    f"{metrics['notification_lag_seconds']}"
                )
                print(
                    "  crawl_lag_seconds="
                    f"{metrics['crawl_lag_seconds']}"
                )
                for engine, row in metrics["engines"].items():
                    print(f"  engine={engine}")
                    for key, result in row.items():
                        print(f"    {key}={result}")
        return 0
    except LedgerError as exc:
        print(f"LAG_LEDGER_ERROR {exc}", file=os.sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
