import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
MODULE=ROOT/'scripts'/'seo'/'search_lag_ledger.py'
spec=importlib.util.spec_from_file_location('search_lag_ledger',MODULE)
ledger_mod=importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(ledger_mod)


class SearchLagLedgerTests(unittest.TestCase):
    def test_first_observation_semantics_and_separate_lags(self):
        ledger=ledger_mod.empty_ledger()
        url='https://marketdeck.in/intelligence/notes/a/'
        self.assertTrue(ledger_mod.record_observation(
            ledger,url=url,stage='published',at='2026-09-25T10:00:00Z'))
        self.assertTrue(ledger_mod.record_observation(
            ledger,url=url,stage='notified',at='2026-09-25T10:02:00Z'))
        self.assertTrue(ledger_mod.record_observation(
            ledger,url=url,stage='first_verified_crawl',at='2026-09-25T10:05:00Z',agent='Googlebot'))
        self.assertTrue(ledger_mod.record_observation(
            ledger,url=url,stage='search_discovered',at='2026-09-25T10:08:00Z',engine='google'))
        self.assertTrue(ledger_mod.record_observation(
            ledger,url=url,stage='indexed',at='2026-09-25T10:20:00Z',engine='google'))
        self.assertTrue(ledger_mod.record_observation(
            ledger,url=url,stage='first_impression',at='2026-09-25T11:00:00Z',engine='google'))
        self.assertTrue(ledger_mod.record_observation(
            ledger,url=url,stage='first_ai_citation',at='2026-09-26T10:00:00Z',engine='bing-ai'))

        metrics=ledger_mod.metrics_for_url(ledger['urls'][url])
        self.assertEqual(metrics['notification_lag_seconds'],120)
        self.assertEqual(metrics['crawl_lag_seconds'],300)
        self.assertEqual(metrics['engines']['google']['discovery_lag_seconds'],480)
        self.assertEqual(metrics['engines']['google']['index_lag_seconds'],720)
        self.assertEqual(metrics['engines']['google']['ranking_signal_lag_seconds'],2400)
        self.assertEqual(metrics['engines']['bing-ai']['citation_lag_seconds'],86400)

    def test_later_duplicate_does_not_replace_first_seen_but_earlier_does(self):
        ledger=ledger_mod.empty_ledger();url='https://marketdeck.in/a/'
        self.assertTrue(ledger_mod.record_observation(
            ledger,url=url,stage='indexed',at='2026-09-25T12:00:00Z',engine='bing'))
        self.assertFalse(ledger_mod.record_observation(
            ledger,url=url,stage='indexed',at='2026-09-25T13:00:00Z',engine='bing'))
        self.assertTrue(ledger_mod.record_observation(
            ledger,url=url,stage='indexed',at='2026-09-25T11:00:00Z',engine='bing'))
        self.assertEqual(
            ledger['urls'][url]['observations']['indexed:bing']['at'],
            '2026-09-25T11:00:00Z',
        )

    def test_dimensions_and_urls_fail_closed(self):
        ledger=ledger_mod.empty_ledger()
        with self.assertRaisesRegex(ledger_mod.LedgerError,'engine_required'):
            ledger_mod.record_observation(
                ledger,url='https://marketdeck.in/a/',stage='indexed',at='2026-09-25T10:00:00Z')
        with self.assertRaisesRegex(ledger_mod.LedgerError,'agent_required'):
            ledger_mod.record_observation(
                ledger,url='https://marketdeck.in/a/',stage='first_verified_crawl',at='2026-09-25T10:00:00Z')
        with self.assertRaisesRegex(ledger_mod.LedgerError,'invalid_url'):
            ledger_mod.record_observation(
                ledger,url='https://evil.example/a/',stage='published',at='2026-09-25T10:00:00Z')

    def test_atomic_private_ledger(self):
        with tempfile.TemporaryDirectory() as td:
            path=Path(td)/'ledger.json'
            ledger=ledger_mod.empty_ledger()
            ledger_mod.record_observation(
                ledger,url='https://marketdeck.in/a/',stage='published',at='2026-09-25T10:00:00Z')
            ledger_mod.atomic_write(path,ledger)
            self.assertEqual(oct(path.stat().st_mode & 0o777),'0o600')
            loaded=ledger_mod.load_ledger(path)
            self.assertEqual(loaded,ledger)
            self.assertEqual(json.loads(path.read_text()),ledger)


if __name__=='__main__':
    unittest.main(verbosity=2)
