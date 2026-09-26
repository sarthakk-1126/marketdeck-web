#!/usr/bin/env python3
"""Run MarketDeck Google URL Inspection plans with a private resumable ledger.

Read-only: this calls URL Inspection index.inspect only. It never requests
indexing and never mutates Search Console.

Authentication is supplied at runtime through a private bearer-token file.
The token is never written into the results ledger or logs.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import stat
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable

ENDPOINT = "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect"
SITE_URL = "sc-domain:marketdeck.in"
MAX_OFFICIAL_QPD = 2000
MAX_OFFICIAL_QPM = 600
DEFAULT_RPM = 240


class InspectionError(RuntimeError):
    pass


def canonical_json_bytes(value: Any) -> bytes:
    return json.dumps(
        value,
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
        allow_nan=False,
    ).encode("utf-8")


def sha256_file(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def utc_now() -> str:
    return (
        datetime.now(timezone.utc)
        .isoformat(timespec="seconds")
        .replace("+00:00", "Z")
    )


def load_json(path: Path) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        raise InspectionError("json_read_failed") from exc
    if not isinstance(value, dict):
        raise InspectionError("json_invalid")
    return value


def load_plan(path: Path) -> dict[str, Any]:
    plan = load_json(path)
    if plan.get("schema_version") != "1.0":
        raise InspectionError("plan_schema_mismatch")
    if plan.get("site_url") != SITE_URL:
        raise InspectionError("plan_site_mismatch")
    requests = plan.get("requests")
    if not isinstance(requests, list) or not requests:
        raise InspectionError("plan_requests_invalid")
    if len(requests) > MAX_OFFICIAL_QPD:
        raise InspectionError("plan_exceeds_daily_quota")
    urls = []
    for row in requests:
        if not isinstance(row, dict):
            raise InspectionError("plan_requests_invalid")
        url = row.get("url")
        req = row.get("inspection_request")
        if (
            not isinstance(url, str)
            or not url.startswith("https://marketdeck.in/")
            or not isinstance(req, dict)
            or req.get("inspectionUrl") != url
            or req.get("siteUrl") != SITE_URL
        ):
            raise InspectionError("plan_requests_invalid")
        urls.append(url)
    if len(urls) != len(set(urls)):
        raise InspectionError("plan_duplicate_url")
    return plan


def read_private_token(path: Path) -> str:
    try:
        mode = stat.S_IMODE(path.stat().st_mode)
    except OSError as exc:
        raise InspectionError("token_missing") from exc
    if mode & 0o077:
        raise InspectionError("token_permissions_too_open")
    try:
        token = path.read_text(encoding="utf-8").strip()
    except (OSError, UnicodeError) as exc:
        raise InspectionError("token_read_failed") from exc
    if len(token) < 20 or any(ch.isspace() for ch in token):
        raise InspectionError("token_invalid")
    return token


def empty_ledger(plan_path: Path, plan: dict[str, Any]) -> dict[str, Any]:
    return {
        "schema_version": "1.0",
        "plan_sha256": sha256_file(plan_path),
        "site_url": SITE_URL,
        "sample_day": plan.get("sample_day"),
        "created_at": utc_now(),
        "updated_at": utc_now(),
        "results": {},
    }


def load_or_create_ledger(
    path: Path,
    plan_path: Path,
    plan: dict[str, Any],
) -> dict[str, Any]:
    expected_hash = sha256_file(plan_path)
    if not path.exists():
        return empty_ledger(plan_path, plan)
    value = load_json(path)
    if (
        value.get("schema_version") != "1.0"
        or value.get("plan_sha256") != expected_hash
        or value.get("site_url") != SITE_URL
        or not isinstance(value.get("results"), dict)
    ):
        raise InspectionError("ledger_plan_mismatch")
    return value


def atomic_private_write(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_name(f".{path.name}.{os.getpid()}.tmp")
    data = canonical_json_bytes(value) + b"\n"
    with temp.open("wb") as handle:
        handle.write(data)
        handle.flush()
        os.fsync(handle.fileno())
    os.chmod(temp, 0o600)
    os.replace(temp, path)


def http_inspect(
    body: dict[str, Any],
    token: str,
    *,
    timeout: float,
) -> dict[str, Any]:
    payload = canonical_json_bytes(body)
    request = urllib.request.Request(
        ENDPOINT,
        data=payload,
        method="POST",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json; charset=utf-8",
            "Accept": "application/json",
            "User-Agent": "MarketDeck-SEO-URLInspection/1.0",
        },
    )
    with urllib.request.urlopen(request, timeout=timeout) as response:
        raw = response.read().decode("utf-8")
        if response.status != 200:
            raise InspectionError(f"unexpected_http_{response.status}")
    try:
        value = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise InspectionError("google_response_invalid_json") from exc
    if not isinstance(value, dict) or not isinstance(
        value.get("inspectionResult"), dict
    ):
        raise InspectionError("google_response_invalid")
    return value


def normalized_result(
    row: dict[str, Any],
    response: dict[str, Any],
    inspected_at: str,
) -> dict[str, Any]:
    result = response["inspectionResult"]
    index = result.get("indexStatusResult") or {}
    if not isinstance(index, dict):
        index = {}

    verdict = index.get("verdict")
    state = {
        "PASS": "indexed",
        "NEUTRAL": "not_indexed",
        "FAIL": "error",
    }.get(verdict, "unknown")

    user_canonical = index.get("userCanonical")
    google_canonical = index.get("googleCanonical")
    canonical_match = (
        user_canonical == google_canonical == row["url"]
        if user_canonical and google_canonical
        else None
    )

    rich = result.get("richResultsResult") or {}
    if not isinstance(rich, dict):
        rich = {}
    detected = rich.get("detectedItems") or []
    rich_types = sorted(
        {
            item.get("richResultType")
            for item in detected
            if isinstance(item, dict)
            and isinstance(item.get("richResultType"), str)
        }
    )

    sitemaps = index.get("sitemap") or []
    if not isinstance(sitemaps, list):
        sitemaps = []

    referring = index.get("referringUrls") or []
    if not isinstance(referring, list):
        referring = []

    return {
        "status": "ok",
        "inspected_at": inspected_at,
        "cohort": row.get("cohort"),
        "reasons": row.get("reasons") or [],
        "producer": row.get("producer"),
        "group": row.get("group"),
        "page_family": row.get("page_family"),
        "route_name": row.get("route_name"),
        "index_state": state,
        "verdict": verdict,
        "coverage_state": index.get("coverageState"),
        "robots_txt_state": index.get("robotsTxtState"),
        "indexing_state": index.get("indexingState"),
        "page_fetch_state": index.get("pageFetchState"),
        "last_crawl_time": index.get("lastCrawlTime"),
        "crawled_as": index.get("crawledAs"),
        "user_canonical": user_canonical,
        "google_canonical": google_canonical,
        "canonical_match": canonical_match,
        "known_sitemaps": sorted(
            str(value) for value in sitemaps if isinstance(value, str)
        ),
        "referring_url_count": len(referring),
        "rich_results_verdict": rich.get("verdict"),
        "rich_result_types": rich_types,
        "inspection_result_link": result.get("inspectionResultLink"),
    }


def execute(
    *,
    plan_path: Path,
    results_path: Path,
    token: str,
    max_requests: int | None,
    requests_per_minute: int,
    timeout: float,
    retries: int,
    inspect_func: Callable[..., dict[str, Any]] = http_inspect,
    sleep_func: Callable[[float], None] = time.sleep,
) -> dict[str, Any]:
    if not 1 <= requests_per_minute <= MAX_OFFICIAL_QPM:
        raise InspectionError("invalid_rate_limit")
    if max_requests is not None and max_requests < 1:
        raise InspectionError("invalid_max_requests")
    if retries < 0 or retries > 8:
        raise InspectionError("invalid_retries")

    plan = load_plan(plan_path)
    ledger = load_or_create_ledger(results_path, plan_path, plan)
    results = ledger["results"]
    interval = 60.0 / requests_per_minute

    attempted = 0
    completed_now = 0
    skipped = 0

    for row in plan["requests"]:
        url = row["url"]
        existing = results.get(url)
        if isinstance(existing, dict) and existing.get("status") == "ok":
            skipped += 1
            continue
        if max_requests is not None and attempted >= max_requests:
            break

        attempted += 1
        last_error: Exception | None = None

        for attempt in range(retries + 1):
            try:
                response = inspect_func(
                    row["inspection_request"],
                    token,
                    timeout=timeout,
                )
                result = normalized_result(row, response, utc_now())
                results[url] = result
                ledger["updated_at"] = utc_now()
                atomic_private_write(results_path, ledger)
                completed_now += 1
                last_error = None
                break
            except urllib.error.HTTPError as exc:
                last_error = exc
                code = int(exc.code)
                if code in {401, 403}:
                    raise InspectionError(f"google_auth_http_{code}") from exc
                if code == 429 or 500 <= code <= 599:
                    if attempt < retries:
                        sleep_func(min(2 ** attempt, 16))
                        continue
                raise InspectionError(f"google_http_{code}") from exc
            except urllib.error.URLError as exc:
                last_error = exc
                if attempt < retries:
                    sleep_func(min(2 ** attempt, 16))
                    continue
                raise InspectionError("google_network_error") from exc

        if last_error is not None:
            raise InspectionError("google_request_failed") from last_error

        if interval > 0:
            sleep_func(interval)

    summary = summarize(plan, ledger)
    summary.update(
        {
            "attempted_now": attempted,
            "completed_now": completed_now,
            "skipped_existing": skipped,
        }
    )
    return summary


def summarize(
    plan: dict[str, Any],
    ledger: dict[str, Any],
) -> dict[str, Any]:
    results = ledger.get("results") or {}
    by_state: dict[str, int] = {}
    by_group: dict[str, dict[str, int]] = {}
    canonical_mismatches = 0

    for url, value in results.items():
        if not isinstance(value, dict) or value.get("status") != "ok":
            continue
        state = value.get("index_state", "unknown")
        by_state[state] = by_state.get(state, 0) + 1
        group = value.get("group") or "unknown"
        group_row = by_group.setdefault(group, {})
        group_row[state] = group_row.get(state, 0) + 1
        if value.get("canonical_match") is False:
            canonical_mismatches += 1

    return {
        "plan_selected_count": int(plan.get("selected_count", 0)),
        "completed_total": sum(by_state.values()),
        "remaining": max(
            0,
            int(plan.get("selected_count", 0)) - sum(by_state.values()),
        ),
        "by_index_state": dict(sorted(by_state.items())),
        "by_group": {
            key: dict(sorted(value.items()))
            for key, value in sorted(by_group.items())
        },
        "canonical_mismatch_count": canonical_mismatches,
    }


def main(argv=None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--plan", type=Path, required=True)
    parser.add_argument("--results", type=Path, required=True)
    parser.add_argument("--access-token-file", type=Path, required=True)
    parser.add_argument("--max-requests", type=int)
    parser.add_argument(
        "--requests-per-minute",
        type=int,
        default=DEFAULT_RPM,
    )
    parser.add_argument("--timeout", type=float, default=20.0)
    parser.add_argument("--retries", type=int, default=3)
    args = parser.parse_args(argv)

    try:
        token = read_private_token(args.access_token_file)
        summary = execute(
            plan_path=args.plan,
            results_path=args.results,
            token=token,
            max_requests=args.max_requests,
            requests_per_minute=args.requests_per_minute,
            timeout=args.timeout,
            retries=args.retries,
        )
    except InspectionError as exc:
        print(f"URL_INSPECTION_RUNNER_ERROR {exc}", file=sys.stderr)
        return 2

    print(json.dumps(summary, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
