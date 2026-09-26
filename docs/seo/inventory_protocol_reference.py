"""Offline wire-integrity reference for the SEO-008 inventory protocol.

Run JSON Schema validation first, then validate_integrity(). Neither proves
route approval, privacy, eligibility, deployed behavior, or Google indexing.
No network, database, application import, or filesystem write occurs here.
Errors contain stable codes only: do not echo inventory values into logs.
"""
from __future__ import annotations

import copy
import hashlib
import json
from typing import Any

MAX_SAFE_INTEGER = (1 << 53) - 1


class ProtocolError(ValueError):
    """A safe diagnostic code, with no source record embedded in the message."""


def _check_json(value: Any) -> None:
    if value is None or type(value) is bool:
        return
    if type(value) is str:
        try:
            value.encode("utf-8")
        except UnicodeEncodeError:
            raise ProtocolError("invalid_unicode") from None
        return
    if type(value) is int:
        if abs(value) > MAX_SAFE_INTEGER:
            raise ProtocolError("integer_out_of_range")
        return
    if type(value) is list:
        for item in value:
            _check_json(item)
        return
    if type(value) is dict:
        for key, item in value.items():
            if type(key) is not str or not key.isascii():
                raise ProtocolError("non_ascii_object_key")
            _check_json(item)
        return
    raise ProtocolError("unsupported_json_type")


def _unique_object(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for key, value in pairs:
        if key in result:
            raise ProtocolError("duplicate_json_key")
        result[key] = value
    return result


def _reject_constant(_value: str) -> None:
    raise ProtocolError("nonfinite_json_number")


def parse_inventory_json(text: str) -> dict[str, Any]:
    """Parse strictly; reject duplicate keys, floats and unsafe Unicode."""
    try:
        payload = json.loads(
            text, object_pairs_hook=_unique_object, parse_constant=_reject_constant
        )
    except (json.JSONDecodeError, TypeError, RecursionError):
        raise ProtocolError("invalid_json") from None
    if type(payload) is not dict:
        raise ProtocolError("envelope_not_object")
    try:
        _check_json(payload)
    except RecursionError:
        raise ProtocolError("json_too_deep") from None
    return payload


def canonical_json_bytes(value: Any) -> bytes:
    """V1 encoding: ASCII keys sorted, literal Unicode, no floats or spaces.

    String values are NOT normalized: two distinct source IDs must stay
    distinct. Arrays retain their supplied order. Record sorting is explicit.
    """
    try:
        _check_json(value)
        return json.dumps(
            value, sort_keys=True, separators=(",", ":"),
            ensure_ascii=False, allow_nan=False,
        ).encode("utf-8")
    except RecursionError:
        raise ProtocolError("json_too_deep") from None


def record_order_key(record: dict[str, Any]) -> tuple[Any, ...]:
    """Unicode-code-point order; canonical null last, identifier null first."""
    if type(record) is not dict:
        raise ProtocolError("record_not_object")
    try:
        url = record["canonical_url"]
        repo = record["repository"]
        route = record["route_name"]
        identity = record["public_record_identifier"]
    except KeyError:
        raise ProtocolError("missing_record_identity") from None
    if url is not None and (type(url) is not str or not url):
        raise ProtocolError("invalid_record_identity")
    if any(type(value) is not str or not value for value in (repo, route)):
        raise ProtocolError("invalid_record_identity")
    if identity is not None and (type(identity) is not str or not identity):
        raise ProtocolError("invalid_record_identity")
    return (url is None, url or "", repo, route, identity is not None, identity or "")


def records_digest(records: list[dict[str, Any]]) -> str:
    """Hash exact supplied order; validate_integrity separately checks sorting."""
    if type(records) is not list:
        raise ProtocolError("records_not_array")
    return hashlib.sha256(canonical_json_bytes(records)).hexdigest()


def finalize_inventory(envelope: dict[str, Any]) -> dict[str, Any]:
    """Copy, order and hash; never manufacture eligibility or observations."""
    if type(envelope) is not dict or type(envelope.get("records")) is not list:
        raise ProtocolError("invalid_envelope")
    result = copy.deepcopy(envelope)
    result["records"] = sorted(result["records"], key=record_order_key)
    result["record_count"] = len(result["records"])
    result["records_sha256"] = records_digest(result["records"])
    validate_integrity(result)
    return result


def validate_integrity(envelope: dict[str, Any]) -> None:
    """Complement schema checks; deliberately not a sitemap admission gate."""
    if type(envelope) is not dict or type(envelope.get("records")) is not list:
        raise ProtocolError("invalid_envelope")
    canonical_json_bytes(envelope)
    records = envelope["records"]
    keys = [record_order_key(record) for record in records]
    if keys != sorted(keys):
        raise ProtocolError("records_not_sorted")
    if len(keys) != len(set(keys)):
        raise ProtocolError("duplicate_record_identity")
    if type(envelope.get("record_count")) is not int or envelope["record_count"] != len(records):
        raise ProtocolError("record_count_mismatch")
    if envelope.get("records_sha256") != records_digest(records):
        raise ProtocolError("records_digest_mismatch")
    status = envelope.get("enumeration_status")
    errors = envelope.get("enumeration_errors")
    if status == "complete":
        if errors != []:
            raise ProtocolError("complete_with_errors")
    elif status == "failed":
        if records or type(errors) is not list or not errors:
            raise ProtocolError("invalid_failed_generation")
    else:
        raise ProtocolError("invalid_enumeration_status")
    admitted: set[str] = set()
    for record in records:
        if record["repository"] != envelope.get("producer"):
            raise ProtocolError("record_owner_mismatch")
        if record.get("sitemap_eligible") is True:
            url = record["canonical_url"]
            expected = {
                "classification": "A", "content_eligibility_status": "eligible",
                "intended_indexing_policy": "index", "robots_policy": "index_follow",
                "expected_http_status": 200,
            }
            if not url or any(record.get(key) != value for key, value in expected.items()):
                raise ProtocolError("inconsistent_eligible_record")
            if record.get("declared_canonical") != url:
                raise ProtocolError("canonical_mismatch")
            if url in admitted:
                raise ProtocolError("duplicate_eligible_canonical")
            admitted.add(url)
