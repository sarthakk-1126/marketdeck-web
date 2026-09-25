import importlib.util
import ipaddress
import json
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MODULE = ROOT / "scripts" / "seo" / "crawler_log_analytics.py"
spec = importlib.util.spec_from_file_location("crawler_log_analytics", MODULE)
analytics = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(analytics)


class DummyRegistry:
    pass


def verified(agent, ip, registry):
    allowed = {
        ("Googlebot", "66.249.66.1"),
        ("OAI-SearchBot", "20.1.2.3"),
        ("ClaudeBot", "216.73.216.10"),
    }
    return (
        (agent, str(ip)) in allowed,
        "fixture_verified" if (agent, str(ip)) in allowed else "fixture_rejected",
    )


def record(ts, uri, ua, source, status=200, size=1000, duration=0.2):
    return (
        Path("fixture.log"),
        {
            "ts": ts,
            "request": {
                "remote_ip": "173.245.48.5",
                "uri": uri,
            },
            "status": status,
            "size": size,
            "duration": duration,
            "user_agent": ua,
            "cf_connecting_ip": source,
        },
    )


class CrawlerLogAnalyticsTests(unittest.TestCase):
    def setUp(self):
        self.cf = [ipaddress.ip_network("173.245.48.0/20")]

    def test_url_family_classification(self):
        cases = {
            "/": "web",
            "/credits/": "web",
            "/robots.txt": "robots",
            "/sitemap.xml": "sitemap",
            "/sitemap-charting-x.xml": "sitemap",
            "/intelligence/notes/a/": "intelligence",
            "/screener/company/ABC/": "stockproof",
            "/charts/ITI/": "charting",
            "/futures-and-options/nifty/": "fo",
            "/commentary/coverage/": "commentary",
            "/crypto/coin/abc/": "crypto",
            "/assets/x.webp": "asset",
            "/unknown/": "other",
        }
        for path, expected in cases.items():
            self.assertEqual(
                analytics.url_family(path + "?x=1"),
                expected,
                path,
            )

    def test_only_verified_claims_enter_analytics(self):
        rows = [
            record(
                100,
                "/screener/company/ABC/?x=1",
                "Googlebot/2.1",
                "66.249.66.1",
                size=100,
                duration=0.1,
            ),
            record(
                200,
                "/screener/company/XYZ/",
                "Googlebot/2.1",
                "66.249.66.1",
                status=304,
                size=0,
                duration=0.05,
            ),
            record(
                300,
                "/intelligence/",
                "OAI-SearchBot/1.0",
                "20.1.2.3",
                size=300,
                duration=0.4,
            ),
            record(
                400,
                "/robots.txt",
                "ClaudeBot/1.0",
                "216.73.216.10",
                size=50,
                duration=0.02,
            ),
            record(
                500,
                "/crypto/",
                "Googlebot/2.1",
                "203.0.113.7",
            ),
            record(
                600,
                "/charts/",
                "curl/8.0",
                "66.249.66.1",
            ),
        ]

        report = analytics.analyze_records(
            rows,
            cloudflare_ranges=self.cf,
            registry=DummyRegistry(),
            top_paths=5,
            verify_func=verified,
        )

        self.assertEqual(report["records_seen"], 6)
        self.assertEqual(report["claimed_crawler_requests"], 5)
        self.assertEqual(report["verified_crawler_requests"], 4)
        self.assertEqual(
            report["verified_role_counts"],
            {"search_retrieval": 3, "training": 1},
        )

        google = report["by_agent"]["Googlebot"]
        self.assertEqual(google["requests"], 2)
        self.assertEqual(google["unique_paths"], 2)
        self.assertEqual(google["status_counts"], {"200": 1, "304": 1})
        self.assertEqual(google["bytes"]["total"], 100)
        self.assertEqual(google["first_seen"], "1970-01-01T00:01:40Z")
        self.assertEqual(google["last_seen"], "1970-01-01T00:03:20Z")

        stock = report["by_family"]["stockproof"]
        self.assertEqual(stock["requests"], 2)
        self.assertEqual(stock["bytes"]["total"], 100)
        self.assertEqual(stock["latency_seconds"]["p50"], 0.07500000000000001)

        self.assertEqual(
            report["by_agent_family"]["OAI-SearchBot|intelligence"]["requests"],
            1,
        )
        self.assertEqual(
            report["crawler_claims"]["Googlebot"]["unverified_or_spoofed"],
            1,
        )

        encoded = json.dumps(report)
        self.assertNotIn("66.249.66.1", encoded)
        self.assertNotIn("20.1.2.3", encoded)
        self.assertNotIn("216.73.216.10", encoded)

    def test_non_cloudflare_peer_is_never_verified(self):
        row = record(
            100,
            "/",
            "Googlebot/2.1",
            "66.249.66.1",
        )
        row[1]["request"]["remote_ip"] = "192.0.2.10"

        called = []

        def should_not_run(agent, ip, registry):
            called.append(True)
            return True, "bad"

        report = analytics.analyze_records(
            [row],
            cloudflare_ranges=self.cf,
            registry=DummyRegistry(),
            verify_func=should_not_run,
        )

        self.assertFalse(called)
        self.assertEqual(report["verified_crawler_requests"], 0)
        self.assertEqual(
            report["crawler_claims"]["Googlebot"][
                "unverified_non_cloudflare_peer"
            ],
            1,
        )

    def test_private_output_is_mode_600(self):
        with tempfile.TemporaryDirectory() as td:
            path = Path(td) / "crawler-analytics.json"
            value = {
                "schema_version": "1.0",
                "verified_crawler_requests": 0,
            }
            analytics.atomic_private_write(path, value)
            self.assertEqual(oct(path.stat().st_mode & 0o777), "0o600")
            self.assertEqual(json.loads(path.read_text()), value)


if __name__ == "__main__":
    unittest.main(verbosity=2)
