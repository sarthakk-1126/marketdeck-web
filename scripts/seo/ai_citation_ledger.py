#!/usr/bin/env python3
"""Maintain a private SG-03H AI citation observation ledger."""
from __future__ import annotations

import argparse
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ALLOWED_ENGINES = {
    "chatgpt",
    "perplexity",
    "copilot",
    "gemini",
    "claude",
    "google_ai_overview",
    "google_ai_mode",
}
ACCURACY = {"accurate", "partly_accurate", "inaccurate", "not_reviewed", "not_applicable"}


class CitationLedgerError(RuntimeError):
    pass


def load_json(path: Path) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        raise CitationLedgerError(f"invalid_json:{path}") from exc


def load_panel(path: Path) -> dict[str, Any]:
    panel = load_json(path)
    if not isinstance(panel, dict) or panel.get("schema_version") != "1.0":
        raise CitationLedgerError("invalid_panel")
    prompts = panel.get("prompts")
    if not isinstance(prompts, list) or not prompts:
        raise CitationLedgerError("invalid_prompt_list")
    ids = [row.get("id") for row in prompts if isinstance(row, dict)]
    if len(ids) != len(prompts) or len(ids) != len(set(ids)) or any(not x for x in ids):
        raise CitationLedgerError("invalid_prompt_ids")
    return panel


def validate_observation(obs: dict[str, Any], prompt_ids: set[str]) -> dict[str, Any]:
    if obs.get("prompt_id") not in prompt_ids:
        raise CitationLedgerError("unknown_prompt_id")
    if obs.get("engine") not in ALLOWED_ENGINES:
        raise CitationLedgerError("invalid_engine")
    date = obs.get("date")
    if not isinstance(date, str) or len(date) != 10:
        raise CitationLedgerError("invalid_date")
    cited = obs.get("cited_urls")
    if not isinstance(cited, list) or any(not isinstance(u, str) or not u.startswith("http") for u in cited):
        raise CitationLedgerError("invalid_cited_urls")
    md = obs.get("marketdeck_cited_urls")
    if not isinstance(md, list) or any(not isinstance(u, str) or not u.startswith("https://marketdeck.in/") for u in md):
        raise CitationLedgerError("invalid_marketdeck_urls")
    if any(u not in cited for u in md):
        raise CitationLedgerError("marketdeck_url_not_in_citations")
    accuracy = obs.get("citation_accuracy")
    if accuracy not in ACCURACY:
        raise CitationLedgerError("invalid_accuracy")
    if not md and accuracy not in {"not_applicable", "not_reviewed"}:
        raise CitationLedgerError("accuracy_without_marketdeck_citation")
    return obs


def empty_ledger(panel: dict[str, Any]) -> dict[str, Any]:
    return {
        "schema_version": "1.0",
        "created_at": datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z"),
        "prompt_panel_schema_version": panel["schema_version"],
        "observations": [],
    }


def atomic_private_write(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(f".{path.name}.{os.getpid()}.tmp")
    tmp.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    os.chmod(tmp, 0o600)
    os.replace(tmp, path)


def append(panel_path: Path, ledger_path: Path, obs_path: Path) -> dict[str, Any]:
    panel = load_panel(panel_path)
    prompt_ids = {row["id"] for row in panel["prompts"]}
    obs = load_json(obs_path)
    if not isinstance(obs, dict):
        raise CitationLedgerError("invalid_observation")
    obs = validate_observation(obs, prompt_ids)

    ledger = load_json(ledger_path) if ledger_path.exists() else empty_ledger(panel)
    if not isinstance(ledger, dict) or not isinstance(ledger.get("observations"), list):
        raise CitationLedgerError("invalid_ledger")

    key = (obs["date"], obs["engine"], obs["prompt_id"])
    for existing in ledger["observations"]:
        if (existing.get("date"), existing.get("engine"), existing.get("prompt_id")) == key:
            raise CitationLedgerError("duplicate_observation")

    ledger["observations"].append(obs)
    ledger["updated_at"] = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    atomic_private_write(ledger_path, ledger)
    return ledger


def main(argv=None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--panel", type=Path, required=True)
    parser.add_argument("--ledger", type=Path, required=True)
    parser.add_argument("--init", action="store_true")
    parser.add_argument("--observation", type=Path)
    args = parser.parse_args(argv)

    try:
        panel = load_panel(args.panel)
        if args.init:
            if args.ledger.exists():
                raise CitationLedgerError("ledger_already_exists")
            ledger = empty_ledger(panel)
            atomic_private_write(args.ledger, ledger)
        elif args.observation:
            ledger = append(args.panel, args.ledger, args.observation)
        else:
            raise CitationLedgerError("choose_init_or_observation")
    except CitationLedgerError as exc:
        print(f"AI_CITATION_LEDGER_ERROR {exc}")
        return 2

    print(json.dumps({
        "prompt_count": len(panel["prompts"]),
        "observation_count": len(ledger["observations"]),
        "ledger": str(args.ledger),
    }, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
