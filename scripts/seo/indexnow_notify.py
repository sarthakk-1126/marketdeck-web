#!/usr/bin/env python3
"""Submit MarketDeck canonical-change events to IndexNow.

The central publisher emits immutable private change-event files. This notifier:
- submits only created / substantively updated / withdrawn canonical URLs;
- never bulk-submits the historical baseline;
- batches at the IndexNow protocol maximum of 10,000 URLs;
- stores private per-event/per-chunk idempotency and retry state;
- treats HTTP 200 and 202 as accepted;
- retries 429 and 5xx responses with bounded exponential backoff;
- never couples notification success to sitemap publication.

Standard-library only.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any, Callable, Iterable
from urllib.parse import urlsplit

ORIGIN = "https://marketdeck.in"
HOST = "marketdeck.in"
DEFAULT_ENDPOINT = "https://api.indexnow.org/indexnow"
MAX_URLS_PER_POST = 10_000
KEY_PATTERN = re.compile(r"^[A-Za-z0-9-]{8,128}$")


class NotificationError(RuntimeError):
    pass


def canonical_json_bytes(value: Any) -> bytes:
    return json.dumps(
        value,
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
        allow_nan=False,
    ).encode("utf-8")


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def validate_key(value: str) -> str:
    key = value.strip()
    if not KEY_PATTERN.fullmatch(key):
        raise NotificationError("invalid_indexnow_key")
    return key


def validate_url(url: str) -> str:
    if not isinstance(url, str) or not url:
        raise NotificationError("invalid_event_url")
    parsed = urlsplit(url)
    if (
        parsed.scheme != "https"
        or parsed.netloc != HOST
        or parsed.username
        or parsed.password
        or parsed.fragment
    ):
        raise NotificationError("invalid_event_url")
    return url


def load_event(path: Path) -> tuple[dict[str, Any], str]:
    try:
        raw = path.read_bytes()
        event = json.loads(raw.decode("utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        raise NotificationError("invalid_change_event") from exc
    if not isinstance(event, dict):
        raise NotificationError("invalid_change_event")
    if event.get("schema_version") != "1.0":
        raise NotificationError("unsupported_change_event_schema")
    if event.get("release_id") != path.stem:
        raise NotificationError("change_event_release_mismatch")
    for field in ("created", "updated", "withdrawn"):
        values = event.get(field)
        if not isinstance(values, list):
            raise NotificationError("invalid_change_event")
        for url in values:
            validate_url(url)
    return event, sha256_bytes(canonical_json_bytes(event))


def event_urls(event: dict[str, Any]) -> list[str]:
    ordered: list[str] = []
    seen: set[str] = set()
    for field in ("created", "updated", "withdrawn"):
        for url in event.get(field, []):
            url = validate_url(url)
            if url not in seen:
                seen.add(url)
                ordered.append(url)
    return ordered


def chunks(values: list[str], size: int = MAX_URLS_PER_POST) -> list[list[str]]:
    if size < 1 or size > MAX_URLS_PER_POST:
        raise NotificationError("invalid_chunk_size")
    return [values[i:i + size] for i in range(0, len(values), size)]


def chunk_id(urls: list[str]) -> str:
    return sha256_bytes(canonical_json_bytes(urls))


def load_state(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {"schema_version": "1.0", "events": {}}
    try:
        state = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        raise NotificationError("indexnow_state_corrupt") from exc
    if not isinstance(state, dict) or state.get("schema_version") != "1.0":
        raise NotificationError("indexnow_state_corrupt")
    events = state.get("events")
    if not isinstance(events, dict):
        raise NotificationError("indexnow_state_corrupt")
    return state


def atomic_write_state(path: Path, state: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    data = canonical_json_bytes(state) + b"\n"
    temp = path.with_name(f".{path.name}.{os.getpid()}.tmp")
    with temp.open("wb") as handle:
        handle.write(data)
        handle.flush()
        os.fsync(handle.fileno())
    os.chmod(temp, 0o600)
    os.replace(temp, path)
    try:
        descriptor = os.open(path.parent, os.O_RDONLY)
        try:
            os.fsync(descriptor)
        finally:
            os.close(descriptor)
    except OSError:
        pass


def post_indexnow(
    endpoint: str,
    key: str,
    key_location: str,
    urls: list[str],
    timeout: float,
) -> int:
    payload = {
        "host": HOST,
        "key": key,
        "keyLocation": key_location,
        "urlList": urls,
    }
    request = urllib.request.Request(
        endpoint,
        data=canonical_json_bytes(payload),
        method="POST",
        headers={
            "Content-Type": "application/json; charset=utf-8",
            "User-Agent": "MarketDeck-IndexNow/1.0 (+https://marketdeck.in/)",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            return int(response.status)
    except urllib.error.HTTPError as exc:
        # Status only. Do not copy arbitrary response bodies into private state.
        return int(exc.code)


def _event_sort_key(item: tuple[Path, dict[str, Any], str]) -> tuple[str, str]:
    path, event, _digest = item
    return str(event.get("generated_at", "")), path.name


def read_events(events_dir: Path) -> list[tuple[Path, dict[str, Any], str]]:
    if not events_dir.exists():
        return []
    result = []
    for path in events_dir.glob("*.json"):
        event, digest = load_event(path)
        result.append((path, event, digest))
    return sorted(result, key=_event_sort_key)


def process_events(
    *,
    events_dir: Path,
    state_path: Path,
    key: str,
    key_location: str,
    endpoint: str = DEFAULT_ENDPOINT,
    timeout: float = 15.0,
    retries: int = 3,
    dry_run: bool = False,
    sender: Callable[[str, str, str, list[str], float], int] = post_indexnow,
    sleep_fn: Callable[[float], None] = time.sleep,
) -> dict[str, Any]:
    key = validate_key(key)
    validate_url(key_location)
    if retries < 1:
        raise NotificationError("invalid_retry_count")

    state = load_state(state_path)
    state.setdefault("events", {})
    state["endpoint"] = endpoint
    state["key_location"] = key_location
    state["key_sha256"] = sha256_bytes(key.encode("utf-8"))

    summary = {
        "events_seen": 0,
        "events_completed": 0,
        "events_skipped": 0,
        "chunks_submitted": 0,
        "chunks_already_accepted": 0,
        "urls_submitted": 0,
        "dry_run": dry_run,
    }

    for _path, event, event_digest in read_events(events_dir):
        summary["events_seen"] += 1
        release_id = event["release_id"]
        urls = event_urls(event)

        existing = state["events"].get(release_id)
        if existing and existing.get("event_sha256") != event_digest:
            raise NotificationError("change_event_mutated")

        record = existing or {
            "event_sha256": event_digest,
            "generated_at": event.get("generated_at"),
            "initial_baseline": bool(event.get("initial_baseline")),
            "chunks": {},
            "status": "pending",
        }

        if not urls:
            record["status"] = (
                "baseline_no_submission"
                if event.get("initial_baseline")
                else "no_changes"
            )
            record["completed_at_epoch"] = time.time()
            state["events"][release_id] = record
            summary["events_completed"] += 1
            if not dry_run:
                atomic_write_state(state_path, state)
            continue

        all_complete = True
        for batch in chunks(urls):
            digest = chunk_id(batch)
            prior = record["chunks"].get(digest, {})
            if prior.get("status") in {"accepted", "accepted_pending_validation"}:
                summary["chunks_already_accepted"] += 1
                continue

            if dry_run:
                summary["chunks_submitted"] += 1
                summary["urls_submitted"] += len(batch)
                continue

            accepted = False
            for attempt in range(1, retries + 1):
                status = sender(endpoint, key, key_location, batch, timeout)
                chunk_state = {
                    "status_code": status,
                    "attempts": attempt,
                    "url_count": len(batch),
                    "last_attempt_epoch": time.time(),
                }
                if status == 200:
                    chunk_state["status"] = "accepted"
                    accepted = True
                elif status == 202:
                    chunk_state["status"] = "accepted_pending_validation"
                    accepted = True
                elif status == 429 or 500 <= status <= 599:
                    chunk_state["status"] = "retryable_failure"
                else:
                    chunk_state["status"] = "hard_failure"

                record["chunks"][digest] = chunk_state
                state["events"][release_id] = record
                atomic_write_state(state_path, state)

                if accepted:
                    summary["chunks_submitted"] += 1
                    summary["urls_submitted"] += len(batch)
                    break
                if chunk_state["status"] == "hard_failure":
                    raise NotificationError(f"indexnow_http_{status}")
                if attempt < retries:
                    sleep_fn(float(2 ** (attempt - 1)))

            if not accepted:
                all_complete = False
                break

        if dry_run:
            summary["events_skipped"] += 1
            continue

        if all_complete:
            record["status"] = "complete"
            record["completed_at_epoch"] = time.time()
            state["events"][release_id] = record
            atomic_write_state(state_path, state)
            summary["events_completed"] += 1
        else:
            raise NotificationError("indexnow_retry_exhausted")

    return summary


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--events-dir", required=True, type=Path)
    parser.add_argument("--state", required=True, type=Path)
    parser.add_argument("--key-file", required=True, type=Path)
    parser.add_argument("--key-location", required=True)
    parser.add_argument("--endpoint", default=DEFAULT_ENDPOINT)
    parser.add_argument("--timeout", type=float, default=15.0)
    parser.add_argument("--retries", type=int, default=3)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    try:
        key = validate_key(args.key_file.read_text(encoding="utf-8"))
        summary = process_events(
            events_dir=args.events_dir,
            state_path=args.state,
            key=key,
            key_location=args.key_location,
            endpoint=args.endpoint,
            timeout=args.timeout,
            retries=args.retries,
            dry_run=args.dry_run,
        )
    except (OSError, UnicodeError, NotificationError) as exc:
        print(f"INDEXNOW_ERROR {exc}", file=os.sys.stderr)
        return 2

    print(json.dumps(summary, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
