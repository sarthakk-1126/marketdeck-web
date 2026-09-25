import importlib.util
import json
import tempfile
import unittest
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MODULE = ROOT / "scripts" / "seo" / "url_inspection_sampler.py"
spec = importlib.util.spec_from_file_location("url_inspection_sampler", MODULE)
sampler = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(sampler)

PRODUCERS = sampler.publisher.PRODUCERS


def record(url, family, state="not_checked"):
    return {
        "canonical_url": url,
        "sitemap_eligible": True,
        "page_family": family,
        "route_name": family,
        "google_inspection_state": state,
        "content_updated_at": None,
    }


def inventories():
    values = {
        owner: {"records": []}
        for owner in PRODUCERS
    }
    values["marketdeck-web"]["records"] = [
        record("https://marketdeck.in/", "WEB-01 platform_home"),
        record("https://marketdeck.in/intelligence/", "INT-01 intelligence_home"),
    ]
    values["stockproof"]["records"] = [
        record("https://marketdeck.in/screener/", "SP-01 screener_home"),
        record("https://marketdeck.in/screener/company/A/", "SP-03 company"),
        record(
            "https://marketdeck.in/screener/company/B/",
            "SP-03 company",
            "not_indexed",
        ),
    ]
    values["charting-v1"]["records"] = [
        record("https://marketdeck.in/charts/", "CH-01 chart_home"),
    ]
    values["fo-analytics-v1"]["records"] = [
        record("https://marketdeck.in/futures-and-options/", "FO-01 home"),
    ]
    values["market-commentary-v1"]["records"] = [
        record("https://marketdeck.in/commentary/", "COM-01 home"),
    ]
    values["crypto-tools-v1"]["records"] = [
        record("https://marketdeck.in/crypto/", "CR-01 home"),
        record("https://marketdeck.in/crypto/coin/A/", "CR-12 coin"),
    ]
    return values


class UrlInspectionSamplerTests(unittest.TestCase):
    def test_priority_and_stratified_coverage(self):
        inv = inventories()
        events = [{
            "schema_version": "1.0",
            "created": ["https://marketdeck.in/crypto/coin/A/"],
            "updated": ["https://marketdeck.in/screener/company/A/"],
            "withdrawn": [],
        }]
        ledger = {
            "https://marketdeck.in/charts/": {
                "state": "canonical_mismatch",
            }
        }
        high = [
            "https://marketdeck.in/",
            "https://marketdeck.in/screener/",
            "https://marketdeck.in/charts/",
            "https://marketdeck.in/futures-and-options/",
            "https://marketdeck.in/commentary/",
            "https://marketdeck.in/crypto/",
            "https://marketdeck.in/intelligence/",
        ]

        plan = sampler.build_plan(
            inventories=inv,
            events=events,
            high_value_urls=high,
            inspection_ledger=ledger,
            daily_budget=9,
            sample_day=date(2026, 9, 26),
            lookback_days=14,
        )

        self.assertEqual(plan["selected_count"], 9)
        self.assertEqual(plan["requests"][0]["cohort"], "problematic")
        problem_urls = {
            row["url"]
            for row in plan["requests"]
            if row["cohort"] == "problematic"
        }
        self.assertEqual(
            problem_urls,
            {
                "https://marketdeck.in/charts/",
                "https://marketdeck.in/screener/company/B/",
            },
        )
        self.assertTrue(
            any(
                row["cohort"] == "newly_published"
                and row["url"] == "https://marketdeck.in/crypto/coin/A/"
                for row in plan["requests"]
            )
        )
        self.assertTrue(
            any(
                row["cohort"] == "recently_changed"
                and row["url"] == "https://marketdeck.in/screener/company/A/"
                for row in plan["requests"]
            )
        )
        self.assertEqual(plan["site_url"], "sc-domain:marketdeck.in")
        self.assertEqual(
            plan["official_quota_reference"]["per_site_qpd"],
            2000,
        )

    def test_daily_budget_hard_cap(self):
        with self.assertRaisesRegex(
            sampler.SamplingError,
            "invalid_daily_budget",
        ):
            sampler.build_plan(
                inventories=inventories(),
                events=[],
                high_value_urls=["https://marketdeck.in/"],
                inspection_ledger={},
                daily_budget=2001,
                sample_day=date(2026, 9, 26),
                lookback_days=14,
            )

    def test_high_value_must_be_approved_canonical(self):
        with self.assertRaisesRegex(
            sampler.SamplingError,
            "high_value_not_eligible",
        ):
            sampler.build_plan(
                inventories=inventories(),
                events=[],
                high_value_urls=["https://marketdeck.in/not-approved/"],
                inspection_ledger={},
                daily_budget=10,
                sample_day=date(2026, 9, 26),
                lookback_days=14,
            )

    def test_deterministic_daily_rotation(self):
        kwargs = dict(
            inventories=inventories(),
            events=[],
            high_value_urls=["https://marketdeck.in/"],
            inspection_ledger={},
            daily_budget=5,
            lookback_days=14,
        )
        one = sampler.build_plan(
            **kwargs,
            sample_day=date(2026, 9, 26),
        )
        two = sampler.build_plan(
            **kwargs,
            sample_day=date(2026, 9, 26),
        )
        self.assertEqual(one["requests"], two["requests"])

    def test_private_output_mode(self):
        with tempfile.TemporaryDirectory() as td:
            path = Path(td) / "plan.json"
            sampler.atomic_private_write(
                path,
                {"schema_version": "1.0"},
            )
            self.assertEqual(
                oct(path.stat().st_mode & 0o777),
                "0o600",
            )
            self.assertEqual(
                json.loads(path.read_text()),
                {"schema_version": "1.0"},
            )


if __name__ == "__main__":
    unittest.main(verbosity=2)
