"""Pure SEO-008F inventory admission, sitemap generation and atomic publication.

This module deliberately imports no MarketDeck application code and performs no
network or database access. Diagnostics use stable codes and never echo records.
"""
from __future__ import annotations

import contextlib
import copy
import hashlib
import json
import os
import re
import sys
import uuid
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable, Iterable, Mapping
from urllib.parse import parse_qsl, urlsplit
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "docs" / "seo"))
from inventory_protocol_reference import (  # noqa: E402
    ProtocolError, canonical_json_bytes, parse_inventory_json, validate_integrity,
)

try:  # Optional extra validation; the exact v1 validator below is dependency-free.
    from jsonschema import Draft202012Validator, FormatChecker
except ImportError:  # pragma: no cover - exercised in the local acceptance host
    Draft202012Validator = FormatChecker = None

ORIGIN = "https://marketdeck.in"
SCHEMA_VERSION = "1.0.0"
PRODUCERS = (
    "marketdeck-web", "stockproof", "charting-v1", "fo-analytics-v1",
    "market-commentary-v1", "crypto-tools-v1",
)
GROUPS = (
    "web", "intelligence", "stockproof-catalog", "stockproof-companies",
    "stockproof-funds", "charting", "fo", "commentary", "crypto-pages",
    "crypto-coins",
)
MAX_URLS = 10_000
MAX_BYTES = 10_000_000
NS = "http://www.sitemaps.org/schemas/sitemap/0.9"
XML_DECL = b'<?xml version="1.0" encoding="UTF-8"?>'


class PublicationError(ValueError):
    """Sanitized publication failure code."""


def _fail(code: str) -> None:
    raise PublicationError(code)


SCHEMA = json.loads((ROOT / "docs" / "seo" / "inventory-v1.schema.json").read_text(encoding="utf-8"))
SCHEMA_VALIDATOR = Draft202012Validator(SCHEMA, format_checker=FormatChecker()) if Draft202012Validator else None

ENVELOPE_FIELDS = set(SCHEMA["required"])
RECORD_FIELDS = set(SCHEMA["$defs"]["record"]["required"])
SHA_PATTERN = re.compile(r"^(?:[a-f0-9]{40}|sha256:[a-f0-9]{64})$")
PUBLIC_URL_PATTERN = re.compile(r"^https://marketdeck\.in/[^\s#]*$")
DATE_PATTERN = re.compile(r"^\d{4}-\d{2}-\d{2}$")
DATETIME_PATTERN = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$")
DATETIME_Z_PATTERN = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$")


def _is_string(value: Any) -> bool:
    return isinstance(value, str) and bool(value) and not value.isspace()


def _is_public_url(value: Any) -> bool:
    return isinstance(value, str) and len(value) <= 2048 and bool(PUBLIC_URL_PATTERN.fullmatch(value))


def _is_date(value: Any) -> bool:
    if not isinstance(value, str) or not DATE_PATTERN.fullmatch(value):
        return False
    try:
        return datetime.fromisoformat(value).date().isoformat() == value
    except ValueError:
        return False


def _is_datetime(value: Any, require_z: bool = False) -> bool:
    pattern = DATETIME_Z_PATTERN if require_z else DATETIME_PATTERN
    if not isinstance(value, str) or not pattern.fullmatch(value):
        return False
    try:
        datetime.fromisoformat(value.replace("Z", "+00:00"))
        return "T" in value
    except ValueError:
        return False


def _schema_valid_record(record: Any) -> bool:
    if not isinstance(record, dict) or set(record) != RECORD_FIELDS:
        return False
    nullable_url = lambda value: value is None or _is_public_url(value)
    if not nullable_url(record["canonical_url"]) or not nullable_url(record["declared_canonical"]):
        return False
    if not _is_string(record["repository"]) or not _is_string(record["route_name"]):
        return False
    if not isinstance(record["page_family"], str) or not re.fullmatch(r"[A-Z]{2,3}-[0-9]{2} [a-z][a-z0-9_]*", record["page_family"]):
        return False
    if record["public_record_identifier"] is not None and not _is_string(record["public_record_identifier"]):
        return False
    if record["classification"] not in {"A", "B", "C", "D", "E", "F"}:
        return False
    if record["intended_indexing_policy"] not in {"index", "noindex", "non_html", "not_applicable", "pending_repair"}:
        return False
    if not _is_string(record["policy_reason"]) or not (_is_string(record["enumeration_source"]) or isinstance(record["enumeration_source"], dict) and bool(record["enumeration_source"])):
        return False
    if record["content_eligibility_status"] not in {"eligible", "ineligible", "pending", "not_applicable"} or not _is_string(record["eligibility_reason"]):
        return False
    status = record["expected_http_status"]
    if type(status) is int:
        if not 100 <= status <= 599:
            return False
    elif not isinstance(status, list) or not status or len(status) != len(set(status)) or any(type(item) is not int or not 100 <= item <= 599 for item in status):
        return False
    if record["robots_policy"] not in {"index_follow", "noindex_follow", "noindex_nofollow", "non_html", "not_applicable"}:
        return False
    if type(record["sitemap_eligible"]) is not bool or record["sitemap_membership"] not in {"present", "absent", "not_applicable", "unknown"}:
        return False
    inbound = record["internal_inbound_link"]
    if not isinstance(inbound, dict) or set(inbound) != {"state", "source_url", "discovery_source"} or inbound["state"] not in {"present", "absent", "unknown"}:
        return False
    if inbound["source_url"] is not None and not _is_public_url(inbound["source_url"]):
        return False
    if inbound["discovery_source"] is not None and not _is_string(inbound["discovery_source"]):
        return False
    if inbound["state"] == "present" and (not _is_public_url(inbound["source_url"]) or not _is_string(inbound["discovery_source"])):
        return False
    updated = record["content_updated_at"]
    if updated is not None and not (_is_date(updated) or _is_datetime(updated)):
        return False
    deployed = record["deployed_sha"]
    if deployed is not None and (not isinstance(deployed, str) or not SHA_PATTERN.fullmatch(deployed)):
        return False
    verified = record["last_verified_at"]
    if verified is not None and not _is_datetime(verified, require_z=True):
        return False
    if verified is not None and deployed is None:
        return False
    if record["google_inspection_state"] not in {"not_checked", "unknown", "indexed", "not_indexed", "blocked", "error"}:
        return False
    inspection = record["google_inspection_date"]
    if inspection is not None and not (_is_date(inspection) or _is_datetime(inspection)):
        return False
    if record["google_inspection_state"] == "not_checked" and inspection is not None:
        return False
    if record["google_inspection_state"] in {"indexed", "not_indexed", "blocked", "error"} and inspection is None:
        return False
    if record["next_action"] is not None and not _is_string(record["next_action"]):
        return False
    if not _is_string(record["owner"]):
        return False
    if (record["classification"] == "F" or record["content_eligibility_status"] == "pending" or deployed is None) and not _is_string(record["next_action"]):
        return False
    if record["sitemap_eligible"]:
        required = {"classification": "A", "intended_indexing_policy": "index", "content_eligibility_status": "eligible", "expected_http_status": 200, "robots_policy": "index_follow"}
        if any(record[key] != value for key, value in required.items()) or not _is_public_url(record["canonical_url"]) or not _is_public_url(record["declared_canonical"]):
            return False
    return True


def schema_v1_valid(envelope: Any) -> bool:
    if not isinstance(envelope, dict) or set(envelope) != ENVELOPE_FIELDS:
        return False
    if envelope["schema_version"] != SCHEMA_VERSION or not _is_string(envelope["run_id"]) or not _is_datetime(envelope["generated_at"], require_z=True):
        return False
    if not _is_string(envelope["generator_version"]) or envelope["environment"] not in {"test", "local", "review", "staging", "production"}:
        return False
    if envelope["preferred_origin"] != ORIGIN or envelope["producer"] not in PRODUCERS:
        return False
    if not isinstance(envelope["source_revision"], str) or not SHA_PATTERN.fullmatch(envelope["source_revision"]):
        return False
    snapshots = envelope["source_snapshots"]
    if not isinstance(snapshots, list) or not snapshots or any(not isinstance(item, dict) or set(item) != {"name", "version"} or not _is_string(item["name"]) or not _is_string(item["version"]) for item in snapshots):
        return False
    if envelope["enumeration_status"] not in {"complete", "failed"} or not isinstance(envelope["enumeration_errors"], list):
        return False
    for item in envelope["enumeration_errors"]:
        if not isinstance(item, dict) or set(item) != {"family", "code"} or not _is_string(item["family"]) or not _is_string(item["code"]):
            return False
    records = envelope["records"]
    if not isinstance(records, list) or any(not _schema_valid_record(item) for item in records):
        return False
    if type(envelope["record_count"]) is not int or envelope["record_count"] < 0:
        return False
    if not isinstance(envelope["records_sha256"], str) or not re.fullmatch(r"[a-f0-9]{64}", envelope["records_sha256"]):
        return False
    if envelope["enumeration_status"] == "complete" and envelope["enumeration_errors"]:
        return False
    if envelope["enumeration_status"] == "failed" and (not envelope["enumeration_errors"] or records or envelope["record_count"] != 0):
        return False
    if SCHEMA_VALIDATOR is not None and list(SCHEMA_VALIDATOR.iter_errors(envelope)):
        return False
    return True

GENERATOR_POLICY = {
    "marketdeck-web": {"seo-008f-web-inventory-v1"},
    "stockproof": {"stockproof-seo-inventory-v1"},
    "charting-v1": {"charting-seo-inventory-v1"},
    "fo-analytics-v1": {"seo-008c-r2"},
    "market-commentary-v1": {"commentary-inventory-v1"},
    "crypto-tools-v1": {"crypto-seo-inventory-v1"},
}

FAMILY_GROUP = {
    "WEB-01": "web", "WEB-02": "web",
    "INT-01": "intelligence", "INT-02": "intelligence", "INT-03": "intelligence",
    "INT-04": "intelligence", "INT-05": "intelligence", "INT-08": "intelligence",
    "INT-09": "intelligence",
    "SP-01": "stockproof-catalog", "SP-02": "stockproof-catalog",
    "SP-03": "stockproof-companies", "SP-04": "stockproof-companies",
    "SP-05": "stockproof-companies", "SP-06": "stockproof-companies",
    "SP-07": "stockproof-catalog", "SP-08": "stockproof-catalog",
    "SP-09": "stockproof-funds",
    "SP-10": "stockproof-funds", "SP-11": "stockproof-funds",
    "SP-12": "stockproof-catalog", "SP-13": "stockproof-catalog",
    "SP-14": "stockproof-catalog", "SP-15": "stockproof-catalog",
    "SP-16": "stockproof-catalog", "SP-17": "stockproof-catalog",
    "SP-21": "stockproof-catalog",
    "CH-01": "charting", "CH-04": "charting", "CH-05": "charting", "CH-06": "charting",
    **{f"FO-{number:02d}": "fo" for number in range(1, 10)},
    "COM-01": "commentary", "COM-02": "commentary", "COM-03": "commentary",
    **{f"CR-{number:02d}": "crypto-pages" for number in range(1, 12)},
    "CR-12": "crypto-coins", "CR-13": "crypto-pages", "CR-14": "crypto-pages",
    "CR-15": "crypto-pages", "CR-16": "crypto-pages", "CR-18": "crypto-pages",
}

OWNER_CODES = {
    "marketdeck-web": {"WEB", "INT"}, "stockproof": {"SP"}, "charting-v1": {"CH"},
    "fo-analytics-v1": {"FO"}, "market-commentary-v1": {"COM"}, "crypto-tools-v1": {"CR"},
}
OWNER_MOUNTS = {
    "stockproof": "/screener/", "charting-v1": "/charts/",
    "fo-analytics-v1": "/futures-and-options/", "market-commentary-v1": "/commentary/",
    "crypto-tools-v1": "/crypto/",
}


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def load_inventory(path: str | Path, expected_producer: str) -> dict[str, Any]:
    try:
        envelope = parse_inventory_json(Path(path).read_text(encoding="utf-8"))
    except (OSError, UnicodeError, ProtocolError):
        _fail("inventory_parse_failed")
    if not schema_v1_valid(envelope):
        _fail("inventory_schema_mismatch")
    try:
        validate_integrity(envelope)
    except ProtocolError:
        _fail("inventory_integrity_failed")
    if envelope["producer"] != expected_producer:
        _fail("producer_identity_mismatch")
    return envelope


def _family_code(record: Mapping[str, Any]) -> str:
    return record["page_family"].split(" ", 1)[0]


def _validate_query(code: str, query: str) -> None:
    if not query:
        return
    try:
        pairs = parse_qsl(query, keep_blank_values=True, strict_parsing=True)
    except ValueError:
        _fail("unapproved_query_identity")
    if len({key for key, _ in pairs}) != len(pairs):
        _fail("unapproved_query_identity")
    keys = [key for key, _ in pairs]
    if code == "SP-07":
        if keys not in (["screen"], ["screen", "page"]):
            _fail("unapproved_query_identity")
        values = dict(pairs)
        # StockProof PRESET_SCREENS keys are source-owned snake_case
        # identifiers (for example magic_formula and rsi_14).  The central
        # publisher validates only that canonical key grammar; source
        # membership itself remains the producer's responsibility.
        if not re.fullmatch(r"[a-z0-9]+(?:_[a-z0-9]+)*", values["screen"]):
            _fail("unapproved_query_identity")
        if "page" in values and not re.fullmatch(r"(?:[2-9]|[1-9]\d+)", values["page"]):
            _fail("unapproved_query_identity")
        return
    if (
        code in {"SP-02", "SP-09", "SP-11"}
        and keys == ["page"]
        and re.fullmatch(r"(?:[2-9]|[1-9]\d+)", pairs[0][1])
    ):
        return
    _fail("unapproved_query_identity")


def _validate_mount(owner: str, code: str, url: str) -> None:
    parsed = urlsplit(url)
    if parsed.scheme != "https" or parsed.netloc != "marketdeck.in" or parsed.username or parsed.password or parsed.fragment:
        _fail("foreign_or_unsafe_origin")
    if parsed.path != "/" and (not parsed.path.startswith("/") or not parsed.path.endswith("/")):
        _fail("invalid_canonical_path")
    prefix = code.split("-", 1)[0]
    if prefix not in OWNER_CODES[owner]:
        _fail("cross_owner_family")
    if owner == "marketdeck-web":
        if code == "WEB-01" and parsed.path != "/":
            _fail("invalid_owner_mount")
        if code == "WEB-02" and parsed.path != "/credits/":
            _fail("invalid_owner_mount")
        if code.startswith("INT-") and not parsed.path.startswith("/intelligence/"):
            _fail("invalid_owner_mount")
    elif not parsed.path.startswith(OWNER_MOUNTS[owner]):
        _fail("invalid_owner_mount")
    _validate_query(code, parsed.query)


def validate_envelope(envelope: Mapping[str, Any], expected_producer: str) -> None:
    if not schema_v1_valid(envelope):
        _fail("inventory_schema_mismatch")
    try:
        validate_integrity(dict(envelope))
    except ProtocolError:
        _fail("inventory_integrity_failed")
    if envelope.get("producer") != expected_producer:
        _fail("producer_identity_mismatch")
    if envelope.get("schema_version") != SCHEMA_VERSION:
        _fail("schema_version_mismatch")
    if envelope.get("generator_version") not in GENERATOR_POLICY[expected_producer]:
        _fail("generator_policy_mismatch")
    if envelope.get("enumeration_status") != "complete":
        _fail("producer_generation_failed")
    if envelope.get("preferred_origin") != ORIGIN:
        _fail("preferred_origin_mismatch")


def admit_inventories(
    inventories: Mapping[str, Mapping[str, Any]], revocations: Iterable[str] = ()
) -> dict[str, list[dict[str, Any]]]:
    if set(inventories) != set(PRODUCERS):
        _fail("incomplete_producer_set")
    revoked = set(revocations)
    admitted: dict[str, list[dict[str, Any]]] = {group: [] for group in GROUPS}
    seen: set[str] = set()
    for owner in PRODUCERS:
        envelope = inventories[owner]
        validate_envelope(envelope, owner)
        for record in envelope["records"]:
            if not record["sitemap_eligible"]:
                continue
            if record["classification"] != "A" or record["content_eligibility_status"] != "eligible" or record["intended_indexing_policy"] != "index":
                _fail("ineligible_class_leakage")
            code = _family_code(record)
            group = FAMILY_GROUP.get(code)
            if group is None:
                _fail("unknown_eligible_family")
            url = record["canonical_url"]
            if url in seen:
                _fail("duplicate_cross_owner_canonical")
            seen.add(url)
            _validate_mount(owner, code, url)
            if url in revoked:
                continue
            admitted[group].append({"url": url, "family": code, "content_updated_at": record["content_updated_at"]})
    for rows in admitted.values():
        rows.sort(key=lambda row: row["url"])
    return admitted


def _valid_lastmod(row: Mapping[str, Any]) -> str | None:
    value = row.get("content_updated_at")
    if row.get("family") not in {"INT-03", "INT-04"} or value is None:
        return None
    if not isinstance(value, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2}))?", value):
        _fail("invalid_lastmod")
    try:
        datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        _fail("invalid_lastmod")
    return value


def _url_row(row: Mapping[str, Any]) -> bytes:
    loc = escape(row["url"])
    lastmod = _valid_lastmod(row)
    tail = f"<lastmod>{escape(lastmod)}</lastmod>" if lastmod else ""
    return f"<url><loc>{loc}</loc>{tail}</url>".encode("utf-8")


URLSET_PREFIX = XML_DECL + f'<urlset xmlns="{NS}">'.encode()
URLSET_SUFFIX = b"</urlset>"


def split_group(rows: list[dict[str, Any]], max_urls: int = MAX_URLS, max_bytes: int = MAX_BYTES) -> list[bytes]:
    if max_urls < 1 or max_bytes < len(URLSET_PREFIX) + len(URLSET_SUFFIX):
        _fail("invalid_split_threshold")
    parts: list[bytes] = []
    current: list[bytes] = []
    current_size = len(URLSET_PREFIX) + len(URLSET_SUFFIX)
    for row in rows:
        encoded = _url_row(row)
        if len(URLSET_PREFIX) + len(encoded) + len(URLSET_SUFFIX) > max_bytes:
            _fail("single_url_exceeds_byte_limit")
        if current and (len(current) >= max_urls or current_size + len(encoded) > max_bytes):
            parts.append(URLSET_PREFIX + b"".join(current) + URLSET_SUFFIX)
            current, current_size = [], len(URLSET_PREFIX) + len(URLSET_SUFFIX)
        current.append(encoded)
        current_size += len(encoded)
    if current:
        parts.append(URLSET_PREFIX + b"".join(current) + URLSET_SUFFIX)
    return parts


def _parse_xml(data: bytes, expected: str) -> ET.Element:
    try:
        root = ET.fromstring(data)
    except ET.ParseError:
        _fail("invalid_generated_xml")
    if root.tag != f"{{{NS}}}{expected}":
        _fail("unexpected_xml_root")
    return root


def build_xml_release(
    admitted: Mapping[str, list[dict[str, Any]]], max_urls: int = MAX_URLS,
    max_bytes: int = MAX_BYTES,
) -> dict[str, Any]:
    children: list[dict[str, Any]] = []
    files: dict[str, bytes] = {}
    for group in GROUPS:
        rows = admitted.get(group, [])
        if not rows:
            continue
        parts = split_group(rows, max_urls=max_urls, max_bytes=max_bytes)
        offset = 0
        for number, data in enumerate(parts, 1):
            digest = sha256(data)
            filename = f"sitemap-{group}-{number:04d}-{digest}.xml"
            root = _parse_xml(data, "urlset")
            count = len(root.findall(f"{{{NS}}}url"))
            if count == 0 or count != len(rows[offset:offset + count]):
                _fail("child_count_mismatch")
            offset += count
            files[filename] = data
            children.append({"group": group, "filename": filename, "sha256": digest, "count": count, "bytes": len(data)})
        if offset != len(rows):
            _fail("group_count_mismatch")
    index_rows = "".join(f"<sitemap><loc>{ORIGIN}/{escape(child['filename'])}</loc></sitemap>" for child in children)
    root_bytes = XML_DECL + f'<sitemapindex xmlns="{NS}">{index_rows}</sitemapindex>'.encode()
    root = _parse_xml(root_bytes, "sitemapindex")
    locs = [node.text for node in root.findall(f"{{{NS}}}sitemap/{{{NS}}}loc")]
    expected_locs = [f"{ORIGIN}/{child['filename']}" for child in children]
    if locs != expected_locs or root.findall(f".//{{{NS}}}sitemapindex"):
        _fail("non_flat_sitemap_index")
    if sum(child["count"] for child in children) != sum(len(rows) for rows in admitted.values()):
        _fail("release_count_mismatch")
    for child in children:
        data = files[child["filename"]]
        if sha256(data) != child["sha256"] or child["sha256"] not in child["filename"]:
            _fail("child_hash_mismatch")
    return {"root": root_bytes, "root_sha256": sha256(root_bytes), "children": children, "files": files}


def _fsync_directory(path: Path) -> None:
    try:
        descriptor = os.open(path, os.O_RDONLY)
    except OSError:
        return
    try:
        os.fsync(descriptor)
    except OSError:
        pass
    finally:
        os.close(descriptor)


def _write_fsync(path: Path, data: bytes, exclusive: bool = False) -> None:
    mode = "xb" if exclusive else "wb"
    with path.open(mode) as handle:
        handle.write(data)
        handle.flush()
        os.fsync(handle.fileno())


def _separate_paths(staging: Path, public: Path, private: Path) -> None:
    paths = [path.resolve() for path in (staging, public, private)]
    if len(set(paths)) != 3:
        _fail("storage_paths_not_distinct")
    for left in paths:
        for right in paths:
            if left != right and (left in right.parents or right in left.parents):
                _fail("storage_paths_not_isolated")


@contextlib.contextmanager
def publisher_lock(private: Path):
    private.mkdir(parents=True, exist_ok=True)
    lock = private / ".publisher.lock"
    try:
        descriptor = os.open(lock, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    except FileExistsError:
        _fail("publisher_already_running")
    try:
        os.write(descriptor, str(os.getpid()).encode("ascii"))
        os.fsync(descriptor)
        os.close(descriptor)
        yield
    finally:
        with contextlib.suppress(FileNotFoundError):
            lock.unlink()


def _read_json(path: Path) -> dict[str, Any] | None:
    if not path.exists():
        return None
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError):
        _fail("private_state_corrupt")
    if not isinstance(value, dict):
        _fail("private_state_corrupt")
    return value


def load_private_state(private: str | Path) -> dict[str, Any] | None:
    return _read_json(Path(private) / "current.json")


def load_accepted_inventories(private: str | Path) -> dict[str, dict[str, Any]]:
    directory = Path(private) / "accepted-inventories"
    result: dict[str, dict[str, Any]] = {}
    for owner in PRODUCERS:
        path = directory / f"{owner}.json"
        if not path.exists():
            _fail("accepted_generation_missing")
        try:
            envelope = parse_inventory_json(path.read_text(encoding="utf-8"))
        except (OSError, UnicodeError, ProtocolError):
            _fail("accepted_generation_corrupt")
        validate_envelope(envelope, owner)
        result[owner] = envelope
    return result


def recover_active_release(private: str | Path, public: str | Path) -> dict[str, Any] | None:
    root = Path(public) / "sitemap.xml"
    if not root.exists():
        return None
    root_hash = sha256(root.read_bytes())
    current = load_private_state(private)
    if current and current.get("root_sha256") == root_hash and current.get("mode") == "activated":
        return current
    candidates = []
    releases = Path(private) / "releases"
    if releases.exists():
        for path in releases.glob("*.json"):
            value = _read_json(path)
            if value and value.get("mode") == "activated" and value.get("root_sha256") == root_hash:
                candidates.append(value)
    if not candidates:
        _fail("active_release_state_missing")
    return sorted(candidates, key=lambda value: (value.get("timestamp", ""), value.get("release_id", "")))[-1]


def _release_metadata(
    release_id: str, publisher_revision: str, inventories: Mapping[str, Mapping[str, Any]],
    admitted: Mapping[str, list[dict[str, Any]]], xml: Mapping[str, Any], previous: Mapping[str, Any] | None,
    activated: bool, revocations: Iterable[str], statuses: Mapping[str, str], timestamp: str,
) -> dict[str, Any]:
    admitted_urls = sorted(row["url"] for rows in admitted.values() for row in rows)
    return {
        "release_id": release_id, "publisher_code_revision": publisher_revision,
        "producers": {owner: {
            "source_revision": inventories[owner]["source_revision"], "run_id": inventories[owner]["run_id"],
            "records_sha256": inventories[owner]["records_sha256"], "status": statuses.get(owner, "fresh"),
        } for owner in PRODUCERS},
        "admitted_counts_by_group": {group: len(admitted.get(group, [])) for group in GROUPS},
        "children": list(xml["children"]), "root_sha256": xml["root_sha256"],
        "previous_root_sha256": previous.get("root_sha256") if previous else None,
        "previous_release_id": previous.get("release_id") if previous else None,
        "timestamp": timestamp, "mode": "activated" if activated else "dry-run",
        "revocation_inputs": sorted(set(revocations)), "validation_result": "passed",
        "admitted_url_sha256": [sha256(url.encode("utf-8")) for url in admitted_urls],
    }


def _commit_private(private: Path, metadata: Mapping[str, Any], *, activate: bool, inventories: Mapping[str, Mapping[str, Any]] | None = None) -> None:
    releases = private / "releases"
    releases.mkdir(parents=True, exist_ok=True)
    data = canonical_json_bytes(dict(metadata)) + b"\n"
    release_path = releases / f"{metadata['release_id']}.json"
    if release_path.exists() and release_path.read_bytes() != data:
        _fail("release_metadata_collision")
    if not release_path.exists():
        _write_fsync(release_path, data, exclusive=True)
    if activate:
        if inventories is None:
            _fail("accepted_generation_missing")
        accepted = private / "accepted-inventories"
        accepted.mkdir(parents=True, exist_ok=True)
        for owner in PRODUCERS:
            inventory_data = canonical_json_bytes(dict(inventories[owner])) + b"\n"
            inventory_temp = accepted / f".{owner}.{metadata['release_id']}.tmp"
            _write_fsync(inventory_temp, inventory_data)
            os.replace(inventory_temp, accepted / f"{owner}.json")
        _fsync_directory(accepted)
    pointer = "current.json" if activate else "last-dry-run.json"
    temp = private / f".{pointer}.{metadata['release_id']}.tmp"
    _write_fsync(temp, data)
    os.replace(temp, private / pointer)
    _fsync_directory(private)


def publish_release(
    inventories: Mapping[str, Mapping[str, Any]], *, staging: str | Path, public: str | Path,
    private: str | Path, publisher_revision: str, activate: bool = False,
    revocations: Iterable[str] = (), statuses: Mapping[str, str] | None = None,
    release_id: str | None = None, timestamp: str | None = None,
    inject: Callable[[str], None] | None = None,
) -> dict[str, Any]:
    staging_path, public_path, private_path = map(Path, (staging, public, private))
    _separate_paths(staging_path, public_path, private_path)
    statuses = statuses or {}
    if not SHA_PATTERN.fullmatch(publisher_revision):
        _fail("invalid_publisher_revision")
    revocations = tuple(revocations)
    for revoked in revocations:
        parsed = urlsplit(revoked)
        if parsed.scheme != "https" or parsed.netloc != "marketdeck.in" or parsed.username or parsed.password or parsed.fragment:
            _fail("invalid_revocation_input")
    release_id = release_id or str(uuid.uuid4())
    if not re.fullmatch(r"[a-zA-Z0-9._-]+", release_id):
        _fail("invalid_release_id")
    timestamp = timestamp or datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    hook = inject or (lambda _step: None)
    with publisher_lock(private_path):
        previous = load_private_state(private_path)
        admitted = admit_inventories(inventories, revocations)
        xml = build_xml_release(admitted)
        workspace = staging_path / release_id
        workspace.mkdir(parents=True, exist_ok=False)
        for name, data in xml["files"].items():
            _write_fsync(workspace / name, data, exclusive=True)
        _write_fsync(workspace / "sitemap.xml", xml["root"], exclusive=True)
        hook("after_staging")
        metadata = _release_metadata(release_id, publisher_revision, inventories, admitted, xml, previous, activate, revocations, statuses, timestamp)
        if not activate:
            _commit_private(private_path, metadata, activate=False)
            return metadata
        public_path.mkdir(parents=True, exist_ok=True)
        hook("before_child_copies")
        for child in xml["children"]:
            name = child["filename"]
            source = workspace / name
            target = public_path / name
            if target.exists():
                if target.read_bytes() != source.read_bytes():
                    _fail("immutable_child_collision")
            else:
                _write_fsync(target, source.read_bytes(), exclusive=True)
            if sha256(target.read_bytes()) != child["sha256"]:
                _fail("child_copy_verification_failed")
        _fsync_directory(public_path)
        hook("after_child_copies")
        root_temp = public_path / f".sitemap.{release_id}.tmp"
        try:
            _write_fsync(root_temp, xml["root"])
            hook("before_root_switch")
            os.replace(root_temp, public_path / "sitemap.xml")
        finally:
            with contextlib.suppress(FileNotFoundError):
                root_temp.unlink()
        _fsync_directory(public_path)
        if sha256((public_path / "sitemap.xml").read_bytes()) != xml["root_sha256"]:
            _fail("root_copy_verification_failed")
        _commit_private(private_path, metadata, activate=True, inventories=inventories)
        return metadata


def select_generations(
    incoming: Mapping[str, Mapping[str, Any] | None],
    accepted: Mapping[str, Mapping[str, Any]],
) -> tuple[dict[str, Mapping[str, Any]], dict[str, str]]:
    selected: dict[str, Mapping[str, Any]] = {}
    statuses: dict[str, str] = {}
    for owner in PRODUCERS:
        candidate = incoming.get(owner)
        try:
            if candidate is None:
                raise PublicationError("missing")
            validate_envelope(candidate, owner)
        except PublicationError:
            prior = accepted.get(owner)
            if prior is None:
                _fail("no_compatible_generation")
            validate_envelope(prior, owner)
            selected[owner], statuses[owner] = prior, "stale_degraded"
        else:
            selected[owner], statuses[owner] = candidate, "fresh"
    return selected, statuses


def assert_rollback_safe(release: Mapping[str, Any], revoked_urls: Iterable[str]) -> None:
    revoked = {sha256(url.encode("utf-8")) for url in revoked_urls}
    if revoked.intersection(release.get("admitted_url_sha256", [])):
        _fail("revoked_release_rollback_forbidden")


DIFFERENCE_NAMES = (
    "candidate_not_approved", "approved_not_candidate", "approved_not_sitemap",
    "sitemap_not_approved", "approved_not_linked", "linked_not_candidate",
    "approved_not_live", "live_not_approved",
)


def reconcile_sets(
    expected_candidate_public: Iterable[str], approved_eligible_canonical: Iterable[str],
    sitemap_urls: Iterable[str], crawlable_internal_link_targets: Iterable[str],
    live_verified_canonicals: Iterable[str],
) -> dict[str, Any]:
    expected, approved, sitemap, linked, live = map(set, (
        expected_candidate_public, approved_eligible_canonical, sitemap_urls,
        crawlable_internal_link_targets, live_verified_canonicals,
    ))
    differences = {
        "candidate_not_approved": sorted(expected - approved),
        "approved_not_candidate": sorted(approved - expected),
        "approved_not_sitemap": sorted(approved - sitemap),
        "sitemap_not_approved": sorted(sitemap - approved),
        "approved_not_linked": sorted(approved - linked),
        "linked_not_candidate": sorted(linked - expected),
        "approved_not_live": sorted(approved - live),
        "live_not_approved": sorted(live - approved),
    }
    denominator = len(approved)
    def coverage(observed: set[str]) -> dict[str, Any]:
        numerator = len(approved & observed)
        return {"numerator": numerator, "denominator": denominator, "percentage": None if denominator == 0 else numerator / denominator * 100, "status": "not_applicable" if denominator == 0 else "applicable"}
    return {"differences": differences, "coverage": {
        "technical_eligibility": coverage(live), "sitemap": coverage(sitemap),
        "internal_discovery": coverage(linked),
    }}
