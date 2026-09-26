import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MODULE = ROOT / "scripts" / "seo" / "url_inspection_runner.py"
spec = importlib.util.spec_from_file_location("url_inspection_runner", MODULE)
runner = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(runner)


def plan(urls):
    return {
        "schema_version": "1.0",
        "site_url": "sc-domain:marketdeck.in",
        "sample_day": "2026-09-26",
        "selected_count": len(urls),
        "requests": [
            {
                "url": url,
                "cohort": "stratified_coverage",
                "reasons": ["stratified_coverage"],
                "producer": "marketdeck-web",
                "group": "web",
                "page_family": "WEB-01 platform_home",
                "route_name": "web:home",
                "inspection_request": {
                    "inspectionUrl": url,
                    "siteUrl": "sc-domain:marketdeck.in",
                    "languageCode": "en-IN",
                },
            }
            for url in urls
        ],
    }


def google_response(url, verdict="PASS", google_canonical=None):
    return {
        "inspectionResult": {
            "inspectionResultLink": "https://search.google.com/search-console/inspect",
            "indexStatusResult": {
                "verdict": verdict,
                "coverageState": (
                    "Submitted and indexed"
                    if verdict == "PASS"
                    else "Discovered - currently not indexed"
                ),
                "robotsTxtState": "ALLOWED",
                "indexingState": "INDEXING_ALLOWED",
                "lastCrawlTime": "2026-09-25T12:00:00Z",
                "pageFetchState": "SUCCESSFUL",
                "googleCanonical": google_canonical or url,
                "userCanonical": url,
                "crawledAs": "MOBILE",
                "sitemap": ["https://marketdeck.in/sitemap.xml"],
                "referringUrls": ["https://marketdeck.in/"],
            },
            "richResultsResult": {
                "verdict": "PASS",
                "detectedItems": [
                    {"richResultType": "Breadcrumbs", "items": []}
                ],
            },
        }
    }


class UrlInspectionRunnerTests(unittest.TestCase):
    def test_normalizes_google_result_without_referring_urls(self):
        url = "https://marketdeck.in/intelligence/"
        row = plan([url])["requests"][0]
        value = runner.normalized_result(
            row,
            google_response(url),
            "2026-09-26T00:00:00Z",
        )
        self.assertEqual(value["index_state"], "indexed")
        self.assertTrue(value["canonical_match"])
        self.assertEqual(value["referring_url_count"], 1)
        self.assertNotIn("referringUrls", value)
        self.assertEqual(value["rich_result_types"], ["Breadcrumbs"])

    def test_resumable_execution_skips_completed_urls(self):
        urls = [
            "https://marketdeck.in/",
            "https://marketdeck.in/intelligence/",
        ]
        with tempfile.TemporaryDirectory() as td:
            td = Path(td)
            plan_path = td / "plan.json"
            results_path = td / "results.json"
            plan_path.write_text(json.dumps(plan(urls)), encoding="utf-8")
            calls = []

            def inspect(body, token, timeout):
                calls.append(body["inspectionUrl"])
                return google_response(body["inspectionUrl"])

            first = runner.execute(
                plan_path=plan_path,
                results_path=results_path,
                token="x" * 30,
                max_requests=1,
                requests_per_minute=600,
                timeout=1,
                retries=0,
                inspect_func=inspect,
                sleep_func=lambda _: None,
            )
            self.assertEqual(first["completed_total"], 1)
            self.assertEqual(first["remaining"], 1)

            second = runner.execute(
                plan_path=plan_path,
                results_path=results_path,
                token="x" * 30,
                max_requests=None,
                requests_per_minute=600,
                timeout=1,
                retries=0,
                inspect_func=inspect,
                sleep_func=lambda _: None,
            )
            self.assertEqual(second["completed_total"], 2)
            self.assertEqual(second["remaining"], 0)
            self.assertEqual(calls, urls)
            self.assertEqual(
                oct(results_path.stat().st_mode & 0o777),
                "0o600",
            )

    def test_canonical_mismatch_and_not_indexed_are_separate(self):
        urls = [
            "https://marketdeck.in/",
            "https://marketdeck.in/intelligence/",
        ]
        with tempfile.TemporaryDirectory() as td:
            td = Path(td)
            plan_path = td / "plan.json"
            results_path = td / "results.json"
            plan_path.write_text(json.dumps(plan(urls)), encoding="utf-8")

            def inspect(body, token, timeout):
                url = body["inspectionUrl"]
                if url.endswith("/intelligence/"):
                    return google_response(url, verdict="NEUTRAL")
                return google_response(
                    url,
                    google_canonical="https://marketdeck.in/canonical-other/",
                )

            summary = runner.execute(
                plan_path=plan_path,
                results_path=results_path,
                token="x" * 30,
                max_requests=None,
                requests_per_minute=600,
                timeout=1,
                retries=0,
                inspect_func=inspect,
                sleep_func=lambda _: None,
            )
            self.assertEqual(
                summary["by_index_state"],
                {"indexed": 1, "not_indexed": 1},
            )
            self.assertEqual(summary["canonical_mismatch_count"], 1)

    def test_plan_hash_change_is_refused(self):
        url = "https://marketdeck.in/"
        with tempfile.TemporaryDirectory() as td:
            td = Path(td)
            plan_path = td / "plan.json"
            results_path = td / "results.json"
            plan_path.write_text(json.dumps(plan([url])), encoding="utf-8")
            ledger = runner.empty_ledger(plan_path, plan([url]))
            runner.atomic_private_write(results_path, ledger)
            plan_path.write_text(
                json.dumps(plan([url, "https://marketdeck.in/intelligence/"])),
                encoding="utf-8",
            )
            with self.assertRaisesRegex(
                runner.InspectionError,
                "ledger_plan_mismatch",
            ):
                runner.load_or_create_ledger(
                    results_path,
                    plan_path,
                    plan([url]),
                )

    def test_private_token_permissions(self):
        with tempfile.TemporaryDirectory() as td:
            path = Path(td) / "token.txt"
            path.write_text("x" * 30, encoding="utf-8")
            path.chmod(0o644)
            with self.assertRaisesRegex(
                runner.InspectionError,
                "token_permissions_too_open",
            ):
                runner.read_private_token(path)
            path.chmod(0o600)
            self.assertEqual(runner.read_private_token(path), "x" * 30)


if __name__ == "__main__":
    unittest.main(verbosity=2)
