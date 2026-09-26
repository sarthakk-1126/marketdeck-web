#!/usr/bin/env python3
"""Build a private first-party search/AI measurement snapshot.

Important accounting rule:
Google Search generative-AI impressions are a SUBSET of normal Web Search
impressions. They must never be added to Web impressions to form a total.
"""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
from typing import Any


class SnapshotError(RuntimeError):
    pass


VALID_STATES = {"observed", "zero", "unavailable", "not_observed"}


def load(path: Path | None) -> dict[str, Any] | None:
    if path is None:
        return None
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        raise SnapshotError(f"invalid_json:{path.name}") from exc
    if not isinstance(value, dict):
        raise SnapshotError(f"invalid_object:{path.name}")
    return value


def integer(value: Any, name: str) -> int:
    if isinstance(value, bool) or not isinstance(value, int) or value < 0:
        raise SnapshotError(f"invalid_nonnegative_int:{name}")
    return value


def normalize_web(data: dict[str, Any]) -> dict[str, Any]:
    impressions = integer(data.get("impressions"), "web.impressions")
    clicks = integer(data.get("clicks", 0), "web.clicks")
    if clicks > impressions:
        raise SnapshotError("web_clicks_exceed_impressions")
    return {
        "clicks": clicks,
        "impressions": impressions,
        "ctr": (clicks / impressions) if impressions else 0.0,
        "avg_position": data.get("avg_position"),
        "settled_through": data.get("settled_through"),
        "source": data.get("source", "google_search_console"),
    }


def normalize_subset(
    data: dict[str, Any] | None,
    *,
    name: str,
    parent_impressions: int | None,
) -> dict[str, Any]:
    if data is None:
        return {
            "state": "not_observed",
            "impressions": None,
            "share_of_parent": None,
            "source": None,
        }
    state = data.get("state", "observed")
    if state not in VALID_STATES:
        raise SnapshotError(f"invalid_state:{name}")
    raw = data.get("impressions")
    impressions = None if raw is None else integer(raw, f"{name}.impressions")
    if state == "zero" and impressions not in (0, None):
        raise SnapshotError(f"zero_state_nonzero_value:{name}")
    if state == "observed" and impressions is None:
        raise SnapshotError(f"observed_state_missing_value:{name}")
    if (
        impressions is not None
        and parent_impressions is not None
        and impressions > parent_impressions
    ):
        raise SnapshotError(f"subset_exceeds_parent:{name}")
    share = (
        impressions / parent_impressions
        if impressions is not None and parent_impressions not in (None, 0)
        else None
    )
    return {
        "state": state,
        "impressions": impressions,
        "share_of_parent": share,
        "source": data.get("source"),
        "settled_through": data.get("settled_through"),
        "dimensions_available": data.get("dimensions_available") or [],
        "note": data.get("note"),
    }


def build(
    web: dict[str, Any],
    *,
    search_genai: dict[str, Any] | None = None,
    discover: dict[str, Any] | None = None,
    discover_genai: dict[str, Any] | None = None,
    multimodal: dict[str, Any] | None = None,
) -> dict[str, Any]:
    web_norm = normalize_web(web)
    discover_norm = None
    if discover is not None:
        discover_norm = {
            "impressions": integer(discover.get("impressions"), "discover.impressions"),
            "clicks": integer(discover.get("clicks", 0), "discover.clicks"),
            "source": discover.get("source", "google_search_console"),
            "settled_through": discover.get("settled_through"),
        }

    search_ai = normalize_subset(
        search_genai,
        name="search_genai",
        parent_impressions=web_norm["impressions"],
    )
    discover_ai = normalize_subset(
        discover_genai,
        name="discover_genai",
        parent_impressions=(
            discover_norm["impressions"] if discover_norm is not None else None
        ),
    )
    mm = normalize_subset(
        multimodal,
        name="multimodal",
        parent_impressions=web_norm["impressions"],
    )

    search_non_genai = None
    if search_ai["impressions"] is not None:
        search_non_genai = web_norm["impressions"] - search_ai["impressions"]

    return {
        "schema_version": "1.0",
        "accounting": {
            "headline_search_impressions": web_norm["impressions"],
            "rule": "search_genai_and_multimodal_are_subsets_not_additive_totals",
            "search_non_genai_impressions_estimate": search_non_genai,
        },
        "web": web_norm,
        "search_genai_subset": search_ai,
        "discover": discover_norm,
        "discover_genai_subset": discover_ai,
        "multimodal_subset": mm,
    }


def atomic_private_write(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(f".{path.name}.{os.getpid()}.tmp")
    tmp.write_text(
        json.dumps(value, indent=2, sort_keys=True, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    os.chmod(tmp, 0o600)
    os.replace(tmp, path)


def main(argv=None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--web", type=Path, required=True)
    parser.add_argument("--search-genai", type=Path)
    parser.add_argument("--discover", type=Path)
    parser.add_argument("--discover-genai", type=Path)
    parser.add_argument("--multimodal", type=Path)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args(argv)

    try:
        snapshot = build(
            load(args.web) or {},
            search_genai=load(args.search_genai),
            discover=load(args.discover),
            discover_genai=load(args.discover_genai),
            multimodal=load(args.multimodal),
        )
        atomic_private_write(args.output, snapshot)
    except SnapshotError as exc:
        print(f"MEASUREMENT_SNAPSHOT_ERROR {exc}", file=sys.stderr)
        return 2

    print(json.dumps(snapshot, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    import sys
    raise SystemExit(main())
