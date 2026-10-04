import copy
import unittest
from unittest.mock import patch
import var_only_inventory as v

class BoundedAdmission(unittest.TestCase):
    def setUp(self):
        self.rows = [{"canonical_url": "https://marketdeck.in/retained/%02d/" % n, "repository": "marketdeck-web", "route_name": "retained", "public_record_identifier": str(n), "sitemap_eligible": n < 28} for n in range(32)]
        self.base = {"producer": "marketdeck-web", "records": self.rows, "records_sha256": v.digest(self.rows), "source_snapshots": [{"name": "historical source", "version": "unchanged"}]}
        self.row = {"canonical_url": v.VAR, "declared_canonical": v.VAR, "repository": "marketdeck-web", "route_name": "intelligence:note", "page_family": "INT-03 authored_note", "public_record_identifier": "when-var-methods-disagree", "classification": "A", "sitemap_eligible": True, "content_eligibility_status": "eligible", "expected_http_status": 200, "intended_indexing_policy": "index", "robots_policy": "index_follow"}
        self.guard = patch.object(v, "BASE_DIGEST", self.base["records_sha256"]); self.guard.start(); self.addCleanup(self.guard.stop)
    def run_candidate(self, row=None):
        return v.candidate(self.base, row or self.row, "a" * 40, "2026-10-04T15:59:00Z")
    def test_retains_exact_records_and_historical_provenance(self):
        original = copy.deepcopy(self.base)
        result = self.run_candidate()
        self.assertEqual(self.base, original)
        self.assertEqual([r for r in result["records"] if r["canonical_url"] != v.VAR], self.rows)
        self.assertEqual(result["source_snapshots"][0], self.base["source_snapshots"][0])
        self.assertEqual(result["record_count"], 33)
        self.assertEqual(sum(r["sitemap_eligible"] for r in result["records"]), 29)
        self.assertEqual(result["records_sha256"], v.digest(result["records"]))
    def test_rejects_pe_or_other_canonical(self):
        row = dict(self.row, canonical_url="https://marketdeck.in/intelligence/issues/pe-ratio-valuation-india-2026/")
        with self.assertRaisesRegex(ValueError, "unapproved_research_record"): self.run_candidate(row)
    def test_rejects_baseline_drift(self):
        self.base["records"][0]["sitemap_eligible"] = False
        with self.assertRaisesRegex(ValueError, "accepted_web_generation_changed"): self.run_candidate()
    def test_rejects_population_drift(self):
        self.base["records"].pop(); self.base["records_sha256"] = v.digest(self.base["records"])
        with patch.object(v, "BASE_DIGEST", self.base["records_sha256"]):
            with self.assertRaisesRegex(ValueError, "accepted_web_population_changed"): self.run_candidate()
    def test_rejects_indexing_or_family_drift(self):
        for key, value in [("sitemap_eligible", False), ("page_family", "INT-04 magazine_issue"), ("declared_canonical", v.VAR + "?x=1"), ("expected_http_status", 404)]:
            with self.assertRaisesRegex(ValueError, "unapproved_research_record"): self.run_candidate(dict(self.row, **{key: value}))
    def test_rejects_invalid_revision(self):
        with self.assertRaisesRegex(ValueError, "invalid_source_revision"): v.candidate(self.base, self.row, "unknown", "2026-10-04T15:59:00Z")

if __name__ == "__main__": unittest.main()
