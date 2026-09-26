import importlib.util
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MODULE = ROOT / "scripts" / "seo" / "first_party_measurement_snapshot.py"
spec = importlib.util.spec_from_file_location("first_party_measurement_snapshot", MODULE)
mod = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(mod)


class FirstPartyMeasurementTests(unittest.TestCase):
    def test_genai_is_subset_not_additive(self):
        out = mod.build(
            {"clicks": 10, "impressions": 100, "avg_position": 8.5},
            search_genai={"state": "observed", "impressions": 25},
        )
        self.assertEqual(out["accounting"]["headline_search_impressions"], 100)
        self.assertEqual(
            out["accounting"]["search_non_genai_impressions_estimate"], 75
        )
        self.assertEqual(out["search_genai_subset"]["share_of_parent"], 0.25)

    def test_subset_cannot_exceed_parent(self):
        with self.assertRaisesRegex(mod.SnapshotError, "subset_exceeds_parent"):
            mod.build(
                {"clicks": 0, "impressions": 10},
                search_genai={"state": "observed", "impressions": 11},
            )

    def test_missing_ai_report_is_not_silently_zero(self):
        out = mod.build({"clicks": 0, "impressions": 0})
        self.assertEqual(out["search_genai_subset"]["state"], "not_observed")
        self.assertIsNone(out["search_genai_subset"]["impressions"])

    def test_zero_state_must_not_hold_nonzero_value(self):
        with self.assertRaisesRegex(mod.SnapshotError, "zero_state_nonzero_value"):
            mod.build(
                {"clicks": 0, "impressions": 10},
                search_genai={"state": "zero", "impressions": 1},
            )

    def test_private_output_mode(self):
        with tempfile.TemporaryDirectory() as td:
            p = Path(td) / "snapshot.json"
            mod.atomic_private_write(p, {"schema_version": "1.0"})
            self.assertEqual(oct(p.stat().st_mode & 0o777), "0o600")


if __name__ == "__main__":
    unittest.main(verbosity=2)
