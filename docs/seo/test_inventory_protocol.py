"""Offline integrity tests; use synthetic records, never production exports."""
import copy
import hashlib
import json
import unittest

from inventory_protocol_reference import (
    MAX_SAFE_INTEGER, ProtocolError, canonical_json_bytes, finalize_inventory,
    parse_inventory_json, records_digest, validate_integrity,
)
from test_inventory_schema import VALIDATOR, example


class WireIntegrityTests(unittest.TestCase):
    def reject(self, envelope, code):
        with self.assertRaises(ProtocolError) as caught:
            validate_integrity(envelope)
        self.assertEqual(str(caught.exception), code)

    def test_saved_schema_example_passes_both_layers(self):
        x = example()
        VALIDATOR.validate(x)
        validate_integrity(x)

    def test_count_and_hash_tampering_are_rejected(self):
        for field, value, code in (
            ("record_count", 2, "record_count_mismatch"),
            ("record_count", True, "record_count_mismatch"),
            ("records_sha256", "0" * 64, "records_digest_mismatch"),
        ):
            with self.subTest(field=field, value=value):
                x = example(); x[field] = value
                self.reject(x, code)

    def test_record_change_requires_new_digest(self):
        x = example(); x["records"][0]["title_not_a_schema_field"] = "changed"
        self.reject(x, "records_digest_mismatch")

    def test_order_is_checked_even_when_wrong_order_was_hashed(self):
        x = example(); second = copy.deepcopy(x["records"][0])
        second.update(canonical_url="https://marketdeck.in/screener/", declared_canonical="https://marketdeck.in/screener/", route_name="screener:home")
        x["records"].append(second); x["record_count"] = 2
        x["records_sha256"] = records_digest(x["records"])
        self.reject(x, "records_not_sorted")
        original = copy.deepcopy(x)
        fixed = finalize_inventory(x)
        self.assertEqual(x, original)
        self.assertEqual(fixed["records"][0]["route_name"], "screener:home")
        VALIDATOR.validate(fixed)

    def test_null_canonical_records_sort_last(self):
        x = example(); exclusion = copy.deepcopy(x["records"][0])
        exclusion.update(canonical_url=None, declared_canonical=None, classification="D", sitemap_eligible=False)
        x["records"] = [exclusion, x["records"][0]]
        self.assertIsNone(finalize_inventory(x)["records"][-1]["canonical_url"])

    def test_duplicate_record_identity_is_rejected(self):
        x = example(); x["records"] *= 2; x["record_count"] = 2
        x["records_sha256"] = records_digest(x["records"])
        self.reject(x, "duplicate_record_identity")

    def test_distinct_sources_cannot_admit_one_canonical_twice(self):
        x = example(); other = copy.deepcopy(x["records"][0])
        other["route_name"] += "_other"; x["records"].append(other)
        with self.assertRaisesRegex(ProtocolError, "^duplicate_eligible_canonical$"):
            finalize_inventory(x)

    def test_b_representation_can_point_to_existing_a_canonical(self):
        x = example(); alias = copy.deepcopy(x["records"][0])
        alias.update(route_name="screener:representation_alias", classification="B", sitemap_eligible=False, expected_http_status=301)
        x["records"].append(alias)
        validate_integrity(finalize_inventory(x))

    def test_schema_valid_canonical_mismatch_is_caught(self):
        x = example(); x["records"][0]["declared_canonical"] = "https://marketdeck.in/"
        x["records_sha256"] = records_digest(x["records"])
        VALIDATOR.validate(x)
        self.reject(x, "canonical_mismatch")

    def test_producer_owns_records(self):
        x = example(); x["producer"] = "crypto-tools-v1"
        self.reject(x, "record_owner_mismatch")

    def test_empty_is_distinct_from_failed(self):
        x = example(); x["records"] = []
        complete = finalize_inventory(x); VALIDATOR.validate(complete)
        failed = dict(complete, enumeration_status="failed", enumeration_errors=[{"family":"SP-21", "code":"source_unavailable"}])
        VALIDATOR.validate(failed); validate_integrity(failed)
        bad = dict(complete, enumeration_status="failed")
        self.reject(bad, "invalid_failed_generation")
        self.assertEqual(complete["records_sha256"], hashlib.sha256(b"[]").hexdigest())

    def test_json_parser_rejects_duplicate_keys_and_nonfinite_values(self):
        for text, code in (
            ('{"records":[],"records":[]}', "duplicate_json_key"),
            ('{"nested":{"a":1,"a":2}}', "duplicate_json_key"),
            ('{"number":NaN}', "nonfinite_json_number"),
            ('{"number":Infinity}', "nonfinite_json_number"),
            ('[]', "envelope_not_object"),
            ('{"unclosed":', "invalid_json"),
        ):
            with self.subTest(code=code):
                with self.assertRaises(ProtocolError) as caught:
                    parse_inventory_json(text)
                self.assertEqual(str(caught.exception), code)

    def test_numeric_cross_language_bounds_and_types(self):
        for number in (MAX_SAFE_INTEGER, -MAX_SAFE_INTEGER, 0):
            self.assertEqual(canonical_json_bytes(number), str(number).encode())
        for value, code in ((MAX_SAFE_INTEGER + 1, "integer_out_of_range"), (1.0, "unsupported_json_type"), (float("nan"), "unsupported_json_type")):
            with self.subTest(code=code):
                with self.assertRaisesRegex(ProtocolError, "^" + code + "$"):
                    canonical_json_bytes(value)

    def test_canonical_unicode_encoding_vector(self):
        value = {"z":"₹ & < >", "a":["हिंदी", "😀", "line\nnext"]}
        expected = '{"a":["हिंदी","😀","line\\nnext"],"z":"₹ & < >"}'.encode("utf-8")
        self.assertEqual(canonical_json_bytes(value), expected)
        self.assertEqual(canonical_json_bytes({"value":"é"}), b'{"value":"\xc3\xa9"}')
        self.assertNotEqual(canonical_json_bytes("é"), canonical_json_bytes("e\u0301"))
        with self.assertRaisesRegex(ProtocolError, "^invalid_unicode$"):
            canonical_json_bytes("\ud800")
        with self.assertRaisesRegex(ProtocolError, "^non_ascii_object_key$"):
            canonical_json_bytes({"é": "value"})

    def test_no_observation_or_eligibility_is_fabricated(self):
        x = example(); out = finalize_inventory(x)
        self.assertIsNone(out["records"][0]["deployed_sha"])
        self.assertIsNone(out["records"][0]["last_verified_at"])
        self.assertEqual(out["records"][0]["google_inspection_state"], "not_checked")
        self.assertEqual(x, out)
        self.assertIsNot(x, out)
        self.assertIsNot(x["records"], out["records"])

    def test_diagnostics_never_echo_record_data(self):
        x = example(); x["records"][0]["repository"] = "PRIVATE-MARKER-DO-NOT-LOG"
        x["records_sha256"] = records_digest(x["records"])
        self.reject(x, "record_owner_mismatch")

    def test_wire_integrity_is_not_url_approval(self):
        # A structurally correct URL can still be a forbidden route. The
        # publisher MUST additionally apply the source-owned family allowlist.
        x = example(); private = "https://marketdeck.in/screener/accounts/"
        x["records"][0].update(canonical_url=private, declared_canonical=private)
        final = finalize_inventory(x)
        VALIDATOR.validate(final); validate_integrity(final)


if __name__ == "__main__":
    unittest.main(verbosity=2)
