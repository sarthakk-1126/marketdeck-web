#!/usr/bin/env python3
"""Audit MarketDeck Caddy access logs for verified crawler traffic and response-size risks.

Standard-library only. The verifier treats Cloudflare as the outer trust boundary:
a forwarded CF-Connecting-IP value is considered only when the direct peer IP belongs
to Cloudflare's current official ranges.

Provider verification:
- Googlebot: Google's published common-crawler CIDRs.
- bingbot: reverse DNS -> *.search.msn.com plus forward confirmation.
- OpenAI: provider-published JSON ranges for each documented agent.
- Anthropic: provider-published crawler JSON ranges.
- Perplexity: provider-published JSON ranges for each documented agent.

This tool does not modify Caddy, the site, firewall rules, robots.txt, or application data.
"""

from __future__ import annotations

import argparse
import collections
import gzip
import ipaddress
import json
import os
import re
import socket
import sys
import time
import urllib.request
from pathlib import Path
from typing import Iterable

DEFAULT_LOG = Path(
    "/var/lib/docker/volumes/factory_caddy_data/_data/marketdeck-access.json"
)

CLOUDFLARE_V4 = "https://www.cloudflare.com/ips-v4"
CLOUDFLARE_V6 = "https://www.cloudflare.com/ips-v6"

GOOGLE_COMMON = (
    "https://developers.google.com/static/crawling/ipranges/common-crawlers.json"
)

OPENAI_RANGE_URLS = {
    "OAI-SearchBot": "https://openai.com/searchbot.json",
    "GPTBot": "https://openai.com/gptbot.json",
    "ChatGPT-User": "https://openai.com/chatgpt-user.json",
}

ANTHROPIC_RANGES = "https://claude.com/crawling/bots.json"

PERPLEXITY_RANGE_URLS = {
    "PerplexityBot": "https://www.perplexity.com/perplexitybot.json",
    "Perplexity-User": "https://www.perplexity.com/perplexity-user.json",
}

CLAIM_PATTERNS = [
    ("OAI-SearchBot", re.compile(r"\bOAI-SearchBot(?:/|\b)", re.I)),
    ("ChatGPT-User", re.compile(r"\bChatGPT-User(?:/|\b)", re.I)),
    ("GPTBot", re.compile(r"\bGPTBot(?:/|\b)", re.I)),
    ("Claude-SearchBot", re.compile(r"\bClaude-SearchBot(?:/|\b)", re.I)),
    ("Claude-User", re.compile(r"\bClaude-User(?:/|\b)", re.I)),
    ("ClaudeBot", re.compile(r"\bClaudeBot(?:/|\b)", re.I)),
    ("PerplexityBot", re.compile(r"\bPerplexityBot(?:/|\b)", re.I)),
    ("Perplexity-User", re.compile(r"\bPerplexity-User(?:/|\b)", re.I)),
    ("Googlebot", re.compile(r"\bGooglebot(?:/|\b)", re.I)),
    ("bingbot", re.compile(r"\bbingbot(?:/|\b)", re.I)),
]

SEARCH_RETRIEVAL_AGENTS = {
    "Googlebot",
    "bingbot",
    "OAI-SearchBot",
    "ChatGPT-User",
    "Claude-SearchBot",
    "Claude-User",
    "PerplexityBot",
    "Perplexity-User",
}

TRAINING_AGENTS = {"GPTBot", "ClaudeBot"}

OFFICIAL_SOURCES = {
    "cloudflare": "https://www.cloudflare.com/ips/",
    "google": (
        "https://developers.google.com/crawling/docs/"
        "crawlers-fetchers/verify-google-requests"
    ),
    "bing": "https://www.bing.com/webmasters/help/how-to-verify-bingbot-3905dc26",
    "openai": "https://developers.openai.com/api/docs/bots",
    "anthropic": (
        "https://support.claude.com/en/articles/"
        "8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler"
    ),
    "perplexity": "https://docs.perplexity.ai/docs/resources/perplexity-crawlers",
}

FETCH_UA = (
    "Mozilla/5.0 (compatible; MarketDeck-SEO-CrawlerVerifier/1.0; "
    "+https://marketdeck.in/)"
)


class SourceError(RuntimeError):
    pass


def fetch_text(url: str, timeout: float = 15.0) -> str:
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": FETCH_UA,
            "Accept": "application/json,text/plain,*/*",
        },
    )
    with urllib.request.urlopen(req, timeout=timeout) as response:
        return response.read().decode("utf-8")


def fetch_json(url: str, timeout: float = 15.0) -> dict:
    try:
        return json.loads(fetch_text(url, timeout=timeout))
    except Exception as exc:
        raise SourceError(f"failed to fetch/parse {url}: {exc}") from exc


def parse_prefix_json(payload: dict) -> list[ipaddress._BaseNetwork]:
    out = []
    for item in payload.get("prefixes", []):
        if not isinstance(item, dict):
            continue
        value = item.get("ipv4Prefix") or item.get("ipv6Prefix")
        if value:
            out.append(ipaddress.ip_network(value, strict=False))
    if not out:
        raise SourceError("official prefix payload contained no usable CIDRs")
    return out


def parse_plain_cidrs(text: str) -> list[ipaddress._BaseNetwork]:
    out = []
    for raw in text.splitlines():
        value = raw.strip()
        if not value or value.startswith("#"):
            continue
        out.append(ipaddress.ip_network(value, strict=False))
    if not out:
        raise SourceError("official CIDR source contained no usable ranges")
    return out


def normalize_ip(value) -> ipaddress._BaseAddress | None:
    if value is None:
        return None
    if isinstance(value, list):
        value = value[0] if value else None
    if not value:
        return None
    text = str(value).strip()
    if not text:
        return None

    # Caddy normally logs remote_ip without a port, but tolerate common
    # address:port and [IPv6]:port forms.
    try:
        return ipaddress.ip_address(text)
    except ValueError:
        pass

    if text.startswith("[") and "]" in text:
        host = text[1 : text.index("]")]
        try:
            return ipaddress.ip_address(host)
        except ValueError:
            return None

    if text.count(":") == 1 and "." in text:
        host = text.rsplit(":", 1)[0]
        try:
            return ipaddress.ip_address(host)
        except ValueError:
            return None

    return None


def in_ranges(ip, networks: Iterable[ipaddress._BaseNetwork]) -> bool:
    if ip is None:
        return False
    return any(ip.version == net.version and ip in net for net in networks)


def claimed_agent(user_agent: str) -> str | None:
    for name, pattern in CLAIM_PATTERNS:
        if pattern.search(user_agent or ""):
            return name
    return None


def verify_forward_confirmed_dns(
    ip: ipaddress._BaseAddress,
    required_suffix: str,
) -> tuple[bool, str]:
    """Return (verified, reason) using reverse then forward DNS confirmation."""
    try:
        hostname, _, _ = socket.gethostbyaddr(str(ip))
    except Exception as exc:
        return False, f"reverse_dns_failed:{type(exc).__name__}"

    hostname = hostname.rstrip(".").lower()
    suffix = required_suffix.lower()

    if not (hostname == suffix.lstrip(".") or hostname.endswith(suffix)):
        return False, f"reverse_dns_suffix_mismatch:{hostname}"

    try:
        infos = socket.getaddrinfo(hostname, None)
    except Exception as exc:
        return False, f"forward_dns_failed:{type(exc).__name__}"

    forward_ips = {
        normalize_ip(info[4][0])
        for info in infos
        if info and len(info) >= 5 and info[4]
    }
    forward_ips.discard(None)

    if ip not in forward_ips:
        return False, "forward_dns_did_not_confirm_source"

    return True, f"fcrdns:{hostname}"


class RangeRegistry:
    def __init__(self, timeout: float = 15.0):
        self.timeout = timeout
        self._cache = {}

    def _get(self, key, loader):
        if key not in self._cache:
            self._cache[key] = loader()
        return self._cache[key]

    def cloudflare(self):
        def load():
            return (
                parse_plain_cidrs(fetch_text(CLOUDFLARE_V4, self.timeout))
                + parse_plain_cidrs(fetch_text(CLOUDFLARE_V6, self.timeout))
            )

        return self._get("cloudflare", load)

    def googlebot(self):
        return self._get(
            "googlebot",
            lambda: parse_prefix_json(fetch_json(GOOGLE_COMMON, self.timeout)),
        )

    def openai(self, agent: str):
        url = OPENAI_RANGE_URLS[agent]
        return self._get(
            f"openai:{agent}",
            lambda: parse_prefix_json(fetch_json(url, self.timeout)),
        )

    def anthropic(self):
        return self._get(
            "anthropic",
            lambda: parse_prefix_json(fetch_json(ANTHROPIC_RANGES, self.timeout)),
        )

    def perplexity(self, agent: str):
        url = PERPLEXITY_RANGE_URLS[agent]
        return self._get(
            f"perplexity:{agent}",
            lambda: parse_prefix_json(fetch_json(url, self.timeout)),
        )


def verify_claim(
    agent: str,
    source_ip: ipaddress._BaseAddress,
    registry: RangeRegistry,
) -> tuple[bool, str]:
    if agent == "Googlebot":
        try:
            ok = in_ranges(source_ip, registry.googlebot())
            return ok, "google_common_cidr" if ok else "not_in_google_common_cidrs"
        except SourceError as exc:
            return False, f"verification_source_error:{exc}"

    if agent == "bingbot":
        return verify_forward_confirmed_dns(source_ip, ".search.msn.com")

    if agent in OPENAI_RANGE_URLS:
        try:
            ok = in_ranges(source_ip, registry.openai(agent))
            return ok, f"openai_{agent}_cidr" if ok else "not_in_openai_agent_cidrs"
        except SourceError as exc:
            return False, f"verification_source_error:{exc}"

    if agent in {"Claude-SearchBot", "ClaudeBot", "Claude-User"}:
        try:
            ok = in_ranges(source_ip, registry.anthropic())
            return ok, "anthropic_crawler_cidr" if ok else "not_in_anthropic_crawler_cidrs"
        except SourceError as exc:
            return False, f"verification_source_error:{exc}"

    if agent in PERPLEXITY_RANGE_URLS:
        try:
            ok = in_ranges(source_ip, registry.perplexity(agent))
            return ok, f"perplexity_{agent}_cidr" if ok else "not_in_perplexity_agent_cidrs"
        except SourceError as exc:
            return False, f"verification_source_error:{exc}"

    return False, "unsupported_agent"


def iter_log_paths(base: Path) -> list[Path]:
    parent = base.parent
    stem = base.name
    candidates = [p for p in parent.glob(f"{stem}*") if p.is_file()]
    if base.exists() and base not in candidates:
        candidates.append(base)
    return sorted(set(candidates), key=lambda p: (p.stat().st_mtime, str(p)))


def open_log(path: Path):
    if path.suffix == ".gz":
        return gzip.open(path, "rt", encoding="utf-8", errors="replace")
    return path.open("r", encoding="utf-8", errors="replace")


def percentile(values: list[float], pct: float) -> float | None:
    if not values:
        return None
    data = sorted(values)
    if len(data) == 1:
        return data[0]
    rank = (len(data) - 1) * pct
    lo = int(rank)
    hi = min(lo + 1, len(data) - 1)
    frac = rank - lo
    return data[lo] * (1 - frac) + data[hi] * frac


def uri_without_query(uri: str) -> str:
    return (uri or "").split("?", 1)[0]


def load_records(paths: list[Path], since_epoch: float | None):
    for path in paths:
        try:
            fh = open_log(path)
        except OSError:
            continue
        with fh:
            for raw in fh:
                raw = raw.strip()
                if not raw:
                    continue
                try:
                    record = json.loads(raw)
                except json.JSONDecodeError:
                    continue
                ts = record.get("ts")
                if since_epoch is not None and isinstance(ts, (int, float)) and ts < since_epoch:
                    continue
                yield path, record


def audit(
    log_path: Path,
    hours: float,
    warn_bytes: int,
    critical_bytes: int,
    slow_seconds: float,
    timeout: float,
    top_n: int,
) -> dict:
    since = None if hours <= 0 else time.time() - hours * 3600
    paths = iter_log_paths(log_path)
    registry = RangeRegistry(timeout=timeout)

    try:
        cloudflare_ranges = registry.cloudflare()
        cloudflare_source_error = None
    except SourceError as exc:
        cloudflare_ranges = []
        cloudflare_source_error = str(exc)

    totals = collections.Counter()
    claims = collections.defaultdict(collections.Counter)
    response_sizes = []
    durations = []
    page_stats = {}
    verification_examples = []

    for path, record in load_records(paths, since):
        totals["records"] += 1

        req = record.get("request") or {}
        uri = req.get("uri") or ""
        status = record.get("status")
        size = record.get("size")
        duration = record.get("duration")
        ua = str(record.get("user_agent") or "")
        direct_peer = normalize_ip(req.get("remote_ip"))
        forwarded = normalize_ip(record.get("cf_connecting_ip"))

        if isinstance(size, (int, float)):
            response_sizes.append(float(size))
        if isinstance(duration, (int, float)):
            durations.append(float(duration))

        path_key = uri_without_query(uri)
        stat = page_stats.setdefault(
            path_key,
            {
                "requests": 0,
                "max_size": 0,
                "max_duration": 0.0,
                "last_status": None,
            },
        )
        stat["requests"] += 1
        if isinstance(size, (int, float)):
            stat["max_size"] = max(stat["max_size"], int(size))
        if isinstance(duration, (int, float)):
            stat["max_duration"] = max(stat["max_duration"], float(duration))
        stat["last_status"] = status

        agent = claimed_agent(ua)
        if not agent:
            continue

        claims[agent]["claimed"] += 1

        if cloudflare_source_error:
            claims[agent]["unverified_edge_source_error"] += 1
            reason = "cloudflare_range_source_error"
        elif not in_ranges(direct_peer, cloudflare_ranges):
            claims[agent]["unverified_non_cloudflare_peer"] += 1
            reason = "direct_peer_not_in_cloudflare_ranges"
        elif forwarded is None:
            claims[agent]["unverified_missing_cf_connecting_ip"] += 1
            reason = "missing_cf_connecting_ip"
        else:
            verified, reason = verify_claim(agent, forwarded, registry)
            if verified:
                claims[agent]["verified"] += 1
            else:
                if reason.startswith("verification_source_error:"):
                    claims[agent]["unverified_source_error"] += 1
                else:
                    claims[agent]["unverified_or_spoofed"] += 1

        if len(verification_examples) < 50:
            verification_examples.append(
                {
                    "agent": agent,
                    "uri": path_key,
                    "status": status,
                    "verified": bool(
                        cloudflare_source_error is None
                        and in_ranges(direct_peer, cloudflare_ranges)
                        and forwarded is not None
                        and claims[agent]["verified"] > 0
                        and reason not in {
                            "direct_peer_not_in_cloudflare_ranges",
                            "missing_cf_connecting_ip",
                            "cloudflare_range_source_error",
                        }
                    ),
                    "reason": reason,
                }
            )

    large_pages = []
    slow_pages = []
    for uri, stat in page_stats.items():
        if stat["max_size"] >= warn_bytes:
            level = "critical" if stat["max_size"] >= critical_bytes else "warning"
            large_pages.append({"uri": uri, "level": level, **stat})
        if stat["max_duration"] >= slow_seconds:
            slow_pages.append({"uri": uri, **stat})

    largest = sorted(
        (
            {"uri": uri, **stat}
            for uri, stat in page_stats.items()
            if stat["max_size"] > 0
        ),
        key=lambda x: x["max_size"],
        reverse=True,
    )[:top_n]

    slowest = sorted(
        (
            {"uri": uri, **stat}
            for uri, stat in page_stats.items()
            if stat["max_duration"] > 0
        ),
        key=lambda x: x["max_duration"],
        reverse=True,
    )[:top_n]

    return {
        "generated_at_epoch": time.time(),
        "window_hours": hours,
        "log_files": [str(p) for p in paths],
        "records": totals["records"],
        "cloudflare_range_source_ok": cloudflare_source_error is None,
        "cloudflare_range_source_error": cloudflare_source_error,
        "crawler_claims": {k: dict(v) for k, v in sorted(claims.items())},
        "verification_examples": verification_examples,
        "response_monitoring": {
            "warn_bytes": warn_bytes,
            "critical_bytes": critical_bytes,
            "slow_seconds": slow_seconds,
            "response_size_p50": percentile(response_sizes, 0.50),
            "response_size_p95": percentile(response_sizes, 0.95),
            "response_size_p99": percentile(response_sizes, 0.99),
            "duration_p50": percentile(durations, 0.50),
            "duration_p95": percentile(durations, 0.95),
            "duration_p99": percentile(durations, 0.99),
            "large_pages": sorted(
                large_pages, key=lambda x: x["max_size"], reverse=True
            ),
            "slow_pages": sorted(
                slow_pages, key=lambda x: x["max_duration"], reverse=True
            ),
            "largest_pages": largest,
            "slowest_pages": slowest,
        },
        "official_sources": OFFICIAL_SOURCES,
    }


def print_human(result: dict) -> None:
    print("MarketDeck crawler/access-log audit")
    print(f"window_hours={result['window_hours']}")
    print(f"records={result['records']}")
    print(
        "cloudflare_range_source_ok="
        f"{str(result['cloudflare_range_source_ok']).lower()}"
    )

    print()
    print("Crawler claims")
    if not result["crawler_claims"]:
        print("  none observed in window")
    else:
        for agent, counts in result["crawler_claims"].items():
            parts = " ".join(f"{k}={v}" for k, v in sorted(counts.items()))
            print(f"  {agent}: {parts}")

    monitor = result["response_monitoring"]
    print()
    print("Response monitoring")
    for key in (
        "response_size_p50",
        "response_size_p95",
        "response_size_p99",
        "duration_p50",
        "duration_p95",
        "duration_p99",
    ):
        print(f"  {key}={monitor[key]}")

    print()
    print("Largest pages")
    for row in monitor["largest_pages"]:
        print(
            f"  {row['max_size']:>10} bytes "
            f"{row['max_duration']:.3f}s {row['uri']}"
        )

    print()
    print("Threshold findings")
    if not monitor["large_pages"]:
        print("  no response-size warnings")
    else:
        for row in monitor["large_pages"]:
            print(
                f"  {row['level']} size={row['max_size']} "
                f"duration={row['max_duration']:.3f}s {row['uri']}"
            )

    if not monitor["slow_pages"]:
        print("  no slow-response warnings")
    else:
        for row in monitor["slow_pages"][:20]:
            print(
                f"  slow duration={row['max_duration']:.3f}s "
                f"size={row['max_size']} {row['uri']}"
            )


def main(argv=None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--log", type=Path, default=DEFAULT_LOG)
    parser.add_argument("--hours", type=float, default=24.0)
    parser.add_argument(
        "--warn-mib",
        type=float,
        default=10.0,
        help="response-size warning threshold; default 10 MiB",
    )
    parser.add_argument(
        "--critical-mib",
        type=float,
        default=14.0,
        help="response-size critical threshold; default 14 MiB",
    )
    parser.add_argument(
        "--slow-seconds",
        type=float,
        default=8.0,
        help="slow-response threshold; default 8 seconds",
    )
    parser.add_argument("--timeout", type=float, default=15.0)
    parser.add_argument("--top", type=int, default=20)
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args(argv)

    result = audit(
        log_path=args.log,
        hours=args.hours,
        warn_bytes=int(args.warn_mib * 1024 * 1024),
        critical_bytes=int(args.critical_mib * 1024 * 1024),
        slow_seconds=args.slow_seconds,
        timeout=args.timeout,
        top_n=max(1, args.top),
    )

    if args.json:
        print(json.dumps(result, indent=2, sort_keys=True))
    else:
        print_human(result)

    # Nonzero only for operational source failure, not because a bot was
    # unverified/spoofed or a page crossed a monitoring threshold.
    return 2 if not result["cloudflare_range_source_ok"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
