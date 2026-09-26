import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MODULE = ROOT / "scripts" / "seo" / "ai_citation_ledger.py"
spec = importlib.util.spec_from_file_location("ai_citation_ledger", MODULE)
mod = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(mod)


PANEL = {
    "schema_version": "1.0",
    "prompts": [
        {"id": "p1", "topic": "x", "intent": "educational", "prompt": "Question?"}
    ],
}


class CitationLedgerTests(unittest.TestCase):
    def test_empty_ledger_is_private(self):
        with tempfile.TemporaryDirectory() as td:
            p = Path(td) / "ledger.json"
            mod.atomic_private_write(p, mod.empty_ledger(PANEL))
            self.assertEqual(oct(p.stat().st_mode & 0o777), "0o600")

    def test_valid_marketdeck_citation(self):
        obs = {
            "date": "2026-09-26",
            "engine": "chatgpt",
            "prompt_id": "p1",
            "cited_urls": ["https://marketdeck.in/intelligence/"],
            "marketdeck_cited_urls": ["https://marketdeck.in/intelligence/"],
            "citation_accuracy": "accurate",
        }
        self.assertEqual(mod.validate_observation(obs, {"p1"}), obs)

    def test_uncited_answer_is_not_forced_inaccurate(self):
        obs = {
            "date": "2026-09-26",
            "engine": "perplexity",
            "prompt_id": "p1",
            "cited_urls": [],
            "marketdeck_cited_urls": [],
            "citation_accuracy": "not_applicable",
        }
        self.assertEqual(mod.validate_observation(obs, {"p1"}), obs)

    def test_rejects_fake_accuracy_without_marketdeck_citation(self):
        obs = {
            "date": "2026-09-26",
            "engine": "chatgpt",
            "prompt_id": "p1",
            "cited_urls": ["https://example.com/"],
            "marketdeck_cited_urls": [],
            "citation_accuracy": "accurate",
        }
        with self.assertRaisesRegex(mod.CitationLedgerError, "accuracy_without"):
            mod.validate_observation(obs, {"p1"})

    def test_duplicate_engine_date_prompt_is_rejected(self):
        with tempfile.TemporaryDirectory() as td:
            td = Path(td)
            panel = td / "panel.json"
            ledger = td / "ledger.json"
            obs = td / "obs.json"
            panel.write_text(json.dumps(PANEL))
            row = {
                "date": "2026-09-26",
                "engine": "claude",
                "prompt_id": "p1",
                "cited_urls": [],
                "marketdeck_cited_urls": [],
                "citation_accuracy": "not_applicable",
            }
            obs.write_text(json.dumps(row))
            mod.append(panel, ledger, obs)
            with self.assertRaisesRegex(mod.CitationLedgerError, "duplicate_observation"):
                mod.append(panel, ledger, obs)


if __name__ == "__main__":
    unittest.main(verbosity=2)
