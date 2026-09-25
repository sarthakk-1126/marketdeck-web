import importlib.util
import ipaddress
import json
import tempfile
import unittest
from pathlib import Path

MODULE_PATH = (
    Path(__file__).resolve().parents[1]
    / "scripts"
    / "seo"
    / "audit_crawler_access_log.py"
)

spec = importlib.util.spec_from_file_location("crawler_audit", MODULE_PATH)
crawler_audit = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(crawler_audit)


class FakeRegistry:
    def cloudflare(self):
        return [ipaddress.ip_network("173.245.48.0/20")]

    def googlebot(self):
        return [ipaddress.ip_network("66.249.64.0/19")]

    def openai(self, agent):
        return [ipaddress.ip_network("20.0.0.0/8")]

    def anthropic(self):
        return [ipaddress.ip_network("216.73.216.0/22")]

    def perplexity(self, agent):
        return [ipaddress.ip_network("44.0.0.0/8")]


class CrawlerAuditTests(unittest.TestCase):
    def test_claimed_agent(self):
        self.assertEqual(
            crawler_audit.claimed_agent(
                "Mozilla/5.0 compatible; OAI-SearchBot/1.4"
            ),
            "OAI-SearchBot",
        )
        self.assertEqual(
            crawler_audit.claimed_agent("Claude-SearchBot"),
            "Claude-SearchBot",
        )
        self.assertEqual(
            crawler_audit.claimed_agent(
                "Mozilla/5.0 compatible; Googlebot/2.1"
            ),
            "Googlebot",
        )
        self.assertIsNone(crawler_audit.claimed_agent("curl/8.0"))

    def test_normalize_ip(self):
        self.assertEqual(
            str(crawler_audit.normalize_ip("192.0.2.10:443")),
            "192.0.2.10",
        )
        self.assertEqual(
            str(crawler_audit.normalize_ip("[2001:db8::1]:443")),
            "2001:db8::1",
        )
        self.assertEqual(
            str(crawler_audit.normalize_ip("2001:db8::1")),
            "2001:db8::1",
        )

    def test_parse_prefix_json(self):
        payload = {
            "prefixes": [
                {"ipv4Prefix": "192.0.2.0/24"},
                {"ipv6Prefix": "2001:db8::/32"},
            ]
        }
        nets = crawler_audit.parse_prefix_json(payload)
        self.assertTrue(
            crawler_audit.in_ranges(
                ipaddress.ip_address("192.0.2.5"), nets
            )
        )
        self.assertTrue(
            crawler_audit.in_ranges(
                ipaddress.ip_address("2001:db8::5"), nets
            )
        )

    def test_log_loading_and_privacy_minimized_shape(self):
        record = {
            "ts": 9999999999,
            "request": {
                "remote_ip": "173.245.48.5",
                "client_ip": "173.245.48.5",
                "method": "GET",
                "host": "marketdeck.in",
                "uri": "/screener/company/ABC/",
            },
            "status": 200,
            "size": 12345,
            "duration": 0.25,
            "user_agent": "OAI-SearchBot/1.4",
            "cf_connecting_ip": "20.10.10.10",
            "cf_ray": "fixture",
        }

        with tempfile.TemporaryDirectory() as td:
            path = Path(td) / "marketdeck-access.json"
            path.write_text(json.dumps(record) + "\n", encoding="utf-8")
            rows = list(crawler_audit.load_records([path], None))

        self.assertEqual(len(rows), 1)
        _, loaded = rows[0]
        self.assertNotIn("headers", loaded["request"])
        self.assertNotIn("resp_headers", loaded)
        self.assertEqual(loaded["size"], 12345)

    def test_percentile(self):
        self.assertEqual(crawler_audit.percentile([1, 2, 3], 0.5), 2)
        self.assertIsNone(crawler_audit.percentile([], 0.95))


if __name__ == "__main__":
    unittest.main()
