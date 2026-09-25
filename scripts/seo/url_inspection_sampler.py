#!/usr/bin/env python3
"""Build a deterministic stratified Google URL Inspection sampling plan.

This tool does not call Google. It reads MarketDeck's accepted canonical
inventories plus optional change/inspection state and emits a quota-safe plan.

Priority cohorts:
1. problematic
2. newly_published
3. recently_changed
4. high_value
5. stratified_coverage

The default daily plan is intentionally conservative (200 URLs) even though the
official URL Inspection API per-site limit is currently 2,000 queries/day.
"""
from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import re
import sys
from collections import defaultdict
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Iterable

HERE = Path(__file__).resolve().parent
PUBLISHER_PATH = HERE / "publisher.py"
_spec = importlib.util.spec_from_file_location("marketdeck_publisher", PUBLISHER_PATH)
publisher = importlib.util.module_from_spec(_spec)
assert _spec.loader is not None
_spec.loader.exec_module(publisher)

ORIGIN = "https://marketdeck.in"
DOMAIN_PROPERTY = "sc-domain:marketdeck.in"
OFFICIAL_SITE_QPD = 2000
OFFICIAL_SITE_QPM = 600
DEFAULT_DAILY_BUDGET = 200
MAX_DAILY_BUDGET = 2000
DEFAULT_LOOKBACK_DAYS = 14
PROBLEM_STATES = {
    "not_indexed",
    "blocked",
    "error",
    "canonical_mismatch",
}

HIGH_VALUE_DEFAULT = (
    Path(__file__).resolve().parents[2]
    / "docs"
    / "seo"
    / "url-inspection-high-value.json"
)


class SamplingError(RuntimeError):
    pass


def parse_utc(value: str) -> datetime:
    if not isinstance(value, str):
        raise SamplingError("invalid_datetime")
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as exc:
        raise SamplingError("invalid_datetime") from exc
    if parsed.tzinfo is None:
        raise SamplingError("invalid_datetime")
    return parsed.astimezone(timezone.utc)


def canonical_url(value: Any) -> str:
    if not isinstance(value, str):
        raise SamplingError("invalid_url")
    if not re.fullmatch(r"https://marketdeck\.in/[^\s#]*", value):
        raise SamplingError("invalid_url")
    return value


def group_for_record(record: dict[str, Any]) -> str:
    family = record.get("page_family")
    if not isinstance(family, str) or not family:
        raise SamplingError("invalid_page_family")
    code = family.split(" ", 1)[0]
    try:
        return publisher.FAMILY_GROUP[code]
    except KeyError as exc:
        raise SamplingError("unknown_page_family") from exc


def eligible_records(
    inventories: dict[str, dict[str, Any]],
) -> dict[str, dict[str, Any]]:
    result: dict[str, dict[str, Any]] = {}
    for owner in publisher.PRODUCERS:
        envelope = inventories.get(owner)
        if not isinstance(envelope, dict):
            raise SamplingError("missing_inventory")
        records = envelope.get("records")
        if not isinstance(records, list):
            raise SamplingError("invalid_inventory")
        for record in records:
            if not isinstance(record, dict):
                raise SamplingError("invalid_inventory")
            if not record.get("sitemap_eligible"):
                continue
            url = canonical_url(record.get("canonical_url"))
            if url in result:
                raise SamplingError("duplicate_canonical")
            result[url] = {
                "url": url,
                "producer": owner,
                "group": group_for_record(record),
                "page_family": record.get("page_family"),
                "route_name": record.get("route_name"),
                "content_updated_at": record.get("content_updated_at"),
                "inventory_inspection_state": record.get(
                    "google_inspection_state",
                    "not_checked",
                ),
            }
    return result


def load_change_events(
    directory: Path,
    *,
    now: datetime,
    lookback_days: int,
) -> list[dict[str, Any]]:
    if not directory.exists():
        return []
    cutoff = now - timedelta(days=lookback_days)
    values: list[dict[str, Any]] = []
    for path in sorted(directory.glob("*.json")):
        try:
            event = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, UnicodeError, json.JSONDecodeError) as exc:
            raise SamplingError("change_event_corrupt") from exc
        if not isinstance(event, dict) or event.get("schema_version") != "1.0":
            raise SamplingError("change_event_corrupt")
        generated = parse_utc(event.get("generated_at"))
        if generated < cutoff or generated > now + timedelta(minutes=5):
            continue
        for key in ("created", "updated", "withdrawn"):
            if not isinstance(event.get(key), list):
                raise SamplingError("change_event_corrupt")
            for url in event[key]:
                canonical_url(url)
        values.append(event)
    return values


def load_high_value(path: Path) -> list[str]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        raise SamplingError("high_value_registry_corrupt") from exc
    if not isinstance(value, dict) or value.get("schema_version") != "1.0":
        raise SamplingError("high_value_registry_corrupt")
    urls = value.get("urls")
    if not isinstance(urls, list) or not urls:
        raise SamplingError("high_value_registry_corrupt")
    result = []
    for item in urls:
        url = canonical_url(item)
        if url in result:
            raise SamplingError("duplicate_high_value_url")
        result.append(url)
    return result


def load_inspection_ledger(path: Path | None) -> dict[str, dict[str, Any]]:
    if path is None or not path.exists():
        return {}
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        raise SamplingError("inspection_ledger_corrupt") from exc
    if not isinstance(value, dict) or value.get("schema_version") != "1.0":
        raise SamplingError("inspection_ledger_corrupt")
    urls = value.get("urls")
    if not isinstance(urls, dict):
        raise SamplingError("inspection_ledger_corrupt")
    result = {}
    for raw_url, row in urls.items():
        url = canonical_url(raw_url)
        if not isinstance(row, dict):
            raise SamplingError("inspection_ledger_corrupt")
        result[url] = row
    return result


def stable_rank(url: str, sample_day: date) -> str:
    return hashlib.sha256(
        f"{sample_day.isoformat()}\0{url}".encode("utf-8")
    ).hexdigest()


def _event_sets(events: Iterable[dict[str, Any]]) -> tuple[set[str], set[str], set[str]]:
    created: set[str] = set()
    updated: set[str] = set()
    withdrawn: set[str] = set()
    for event in events:
        created.update(event["created"])
        updated.update(event["updated"])
        withdrawn.update(event["withdrawn"])
    created -= withdrawn
    updated -= withdrawn
    return created, updated, withdrawn


def _problematic_urls(
    records: dict[str, dict[str, Any]],
    ledger: dict[str, dict[str, Any]],
) -> set[str]:
    problems = set()
    for url, record in records.items():
        state = record.get("inventory_inspection_state")
        if state in {"not_indexed", "blocked", "error"}:
            problems.add(url)
        ledger_state = ledger.get(url, {}).get("state")
        if ledger_state in PROBLEM_STATES:
            problems.add(url)
    return problems


def _round_robin_coverage(
    records: dict[str, dict[str, Any]],
    *,
    exclude: set[str],
    sample_day: date,
) -> list[str]:
    buckets: dict[str, list[str]] = defaultdict(list)
    for url, record in records.items():
        if url in exclude:
            continue
        buckets[record["group"]].append(url)
    for group in buckets:
        buckets[group].sort(key=lambda url: stable_rank(url, sample_day))

    ordered = []
    groups = sorted(buckets)
    index = 0
    while groups:
        next_groups = []
        for group in groups:
            values = buckets[group]
            if index < len(values):
                ordered.append(values[index])
            if index + 1 < len(values):
                next_groups.append(group)
        groups = next_groups
        index += 1
    return ordered


def build_plan(
    *,
    inventories: dict[str, dict[str, Any]],
    events: list[dict[str, Any]],
    high_value_urls: list[str],
    inspection_ledger: dict[str, dict[str, Any]],
    daily_budget: int,
    sample_day: date,
    lookback_days: int,
) -> dict[str, Any]:
    if not 1 <= daily_budget <= MAX_DAILY_BUDGET:
        raise SamplingError("invalid_daily_budget")

    records = eligible_records(inventories)
    eligible = set(records)
    created, updated, withdrawn = _event_sets(events)

    created &= eligible
    updated &= eligible

    unknown_high_value = sorted(set(high_value_urls) - eligible)
    if unknown_high_value:
        raise SamplingError("high_value_not_eligible")

    problematic = _problematic_urls(records, inspection_ledger)

    reasons: dict[str, set[str]] = defaultdict(set)
    for url in problematic:
        reasons[url].add("problematic")
    for url in created:
        reasons[url].add("newly_published")
    for url in updated:
        reasons[url].add("recently_changed")
    for url in high_value_urls:
        reasons[url].add("high_value")

    priorities = [
        (
            "problematic",
            sorted(
                problematic,
                key=lambda url: stable_rank(url, sample_day),
            ),
        ),
        (
            "newly_published",
            sorted(
                created,
                key=lambda url: stable_rank(url, sample_day),
            ),
        ),
        (
            "recently_changed",
            sorted(
                updated - created,
                key=lambda url: stable_rank(url, sample_day),
            ),
        ),
        (
            "high_value",
            [
                url
                for url in high_value_urls
                if url not in problematic
                and url not in created
                and url not in updated
            ],
        ),
    ]

    selected: list[dict[str, Any]] = []
    selected_urls: set[str] = set()

    def admit(cohort: str, urls: Iterable[str]) -> None:
        for url in urls:
            if len(selected) >= daily_budget:
                return
            if url in selected_urls:
                continue
            record = records[url]
            selected_urls.add(url)
            selected.append(
                {
                    "url": url,
                    "cohort": cohort,
                    "reasons": sorted(reasons[url] or {cohort}),
                    "producer": record["producer"],
                    "group": record["group"],
                    "page_family": record["page_family"],
                    "route_name": record["route_name"],
                }
            )

    for cohort, urls in priorities:
        admit(cohort, urls)

    coverage = _round_robin_coverage(
        records,
        exclude=selected_urls,
        sample_day=sample_day,
    )
    for url in coverage:
        reasons[url].add("stratified_coverage")
    admit("stratified_coverage", coverage)

    counts = defaultdict(int)
    group_counts = defaultdict(int)
    for row in selected:
        counts[row["cohort"]] += 1
        group_counts[row["group"]] += 1

    return {
        "schema_version": "1.0",
        "site_url": DOMAIN_PROPERTY,
        "sample_day": sample_day.isoformat(),
        "lookback_days": lookback_days,
        "daily_budget": daily_budget,
        "official_quota_reference": {
            "per_site_qpd": OFFICIAL_SITE_QPD,
            "per_site_qpm": OFFICIAL_SITE_QPM,
        },
        "eligible_canonical_count": len(records),
        "change_event_counts_in_window": {
            "created": len(created),
            "updated": len(updated),
            "withdrawn": len(withdrawn),
        },
        "candidate_problematic_count": len(problematic),
        "high_value_registry_count": len(high_value_urls),
        "selected_count": len(selected),
        "selected_by_cohort": dict(sorted(counts.items())),
        "selected_by_group": dict(sorted(group_counts.items())),
        "requests": [
            {
                **row,
                "inspection_request": {
                    "inspectionUrl": row["url"],
                    "siteUrl": DOMAIN_PROPERTY,
                    "languageCode": "en-IN",
                },
            }
            for row in selected
        ],
    }


def atomic_private_write(path: Path, value: dict[str, Any]) -> None:
    import os

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


def main(argv=None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--private", type=Path, required=True)
    parser.add_argument(
        "--high-value",
        type=Path,
        default=HIGH_VALUE_DEFAULT,
    )
    parser.add_argument("--inspection-ledger", type=Path)
    parser.add_argument(
        "--daily-budget",
        type=int,
        default=DEFAULT_DAILY_BUDGET,
    )
    parser.add_argument(
        "--lookback-days",
        type=int,
        default=DEFAULT_LOOKBACK_DAYS,
    )
    parser.add_argument(
        "--sample-day",
        help="UTC YYYY-MM-DD; defaults to current UTC day",
    )
    parser.add_argument("--output", type=Path)
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args(argv)

    if args.lookback_days < 1 or args.lookback_days > 365:
        print("URL_INSPECTION_SAMPLER_ERROR invalid_lookback_days", file=sys.stderr)
        return 2

    try:
        sample_day = (
            date.fromisoformat(args.sample_day)
            if args.sample_day
            else datetime.now(timezone.utc).date()
        )
        now = datetime.combine(
            sample_day,
            datetime.max.time(),
            tzinfo=timezone.utc,
        )
        inventories = publisher.load_accepted_inventories(args.private)
        events = load_change_events(
            args.private / "change-events",
            now=now,
            lookback_days=args.lookback_days,
        )
        high_value = load_high_value(args.high_value)
        ledger = load_inspection_ledger(args.inspection_ledger)
        plan = build_plan(
            inventories=inventories,
            events=events,
            high_value_urls=high_value,
            inspection_ledger=ledger,
            daily_budget=args.daily_budget,
            sample_day=sample_day,
            lookback_days=args.lookback_days,
        )
    except (SamplingError, publisher.PublicationError, ValueError) as exc:
        print(f"URL_INSPECTION_SAMPLER_ERROR {exc}", file=sys.stderr)
        return 2

    if args.output:
        atomic_private_write(args.output, plan)

    if args.json:
        print(json.dumps(plan, indent=2, sort_keys=True))
    else:
        print("MarketDeck URL Inspection sampling plan")
        print(f"site_url={plan['site_url']}")
        print(f"sample_day={plan['sample_day']}")
        print(f"eligible_canonical_count={plan['eligible_canonical_count']}")
        print(f"daily_budget={plan['daily_budget']}")
        print(f"selected_count={plan['selected_count']}")
        print(f"selected_by_cohort={plan['selected_by_cohort']}")
        print(f"selected_by_group={plan['selected_by_group']}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
