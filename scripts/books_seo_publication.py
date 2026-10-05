"""Bounded Books & Investor Methods sitemap publication.

This gate preserves every accepted producer record, imports exactly the
approved Learning identities from a fresh StockProof export, and refuses to
publish if any unrelated sitemap URL changes. It uses the central publisher;
it never writes sitemap XML directly.
"""
from __future__ import annotations

import argparse
import copy
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path


ORIGIN = "https://marketdeck.in"
HUB = f"{ORIGIN}/screener/learning/books/"
BOOK_SLUGS = (
    "intelligent-investor", "one-up", "uncommon-profits",
    "still-beats-market", "little-valuation", "common-sense", "random-walk",
    "psychology-money", "most-important", "thinking", "fooled", "black-swan",
    "buffett-essays", "builds-wealth", "superforecasting",
    "behavioral-investor", "behavioral-little", "narrative-numbers",
    "investment-valuation", "expected-returns", "antifragile", "mutual-funds",
    "safe-money", "laws-wealth", "beating-street",
)
TOPIC_PATHS = (
    "methods/magic-formula", "methods/margin-of-safety",
    "methods/peter-lynch-stock-categories", "methods/economic-moats",
    "methods/index-investing-costs", "methods/valuation-story-to-numbers",
    "paths/beginner-investing-books", "paths/value-investing-books",
    "paths/valuation-books", "compare/graham-vs-housel",
    "compare/lynch-vs-graham", "compare/damodaran-valuation-books",
)
URLS = frozenset(
    (HUB,)
    + tuple(f"{HUB}{slug}/" for slug in BOOK_SLUGS)
    + tuple(f"{ORIGIN}/screener/learning/{path}/" for path in TOPIC_PATHS)
)
assert len(URLS) == 38


def encoded(value):
    return json.dumps(
        value, sort_keys=True, separators=(",", ":"), ensure_ascii=False,
        allow_nan=False,
    ).encode("utf-8")


def digest(value):
    import hashlib
    return hashlib.sha256(encoded(value)).hexdigest()


def order(row):
    url, identity = row["canonical_url"], row["public_record_identifier"]
    return (
        url is None, url or "", row["repository"], row["route_name"],
        identity is not None, identity or "",
    )


def _valid_source(envelope, producer, revision=None):
    if envelope.get("producer") != producer:
        raise ValueError("wrong_producer")
    if envelope.get("enumeration_status") != "complete":
        raise ValueError("incomplete_inventory")
    if digest(envelope.get("records")) != envelope.get("records_sha256"):
        raise ValueError("inventory_digest_mismatch")
    if revision is not None and envelope.get("source_revision") != revision:
        raise ValueError("source_revision_mismatch")


def candidate(baseline, source, revision, timestamp):
    if not re.fullmatch(r"[a-f0-9]{40}", revision):
        raise ValueError("invalid_revision")
    _valid_source(baseline, "stockproof")
    _valid_source(source, "stockproof", revision)

    existing = {row.get("canonical_url") for row in baseline["records"]}
    overlap = URLS & existing
    if overlap:
        raise ValueError("approved_url_already_present:" + sorted(overlap)[0])

    selected = [
        copy.deepcopy(row) for row in source["records"]
        if row.get("canonical_url") in URLS
    ]
    if len({row["canonical_url"] for row in selected}) != len(selected):
        raise ValueError("duplicate_approved_identity")
    if len(selected) != len(URLS):
        found = {row.get("canonical_url") for row in selected}
        raise ValueError("missing_approved_url:" + sorted(URLS - found)[0])

    required = {
        "repository": "stockproof",
        "classification": "A",
        "sitemap_eligible": True,
        "content_eligibility_status": "eligible",
        "expected_http_status": 200,
        "intended_indexing_policy": "index",
        "robots_policy": "index_follow",
    }
    for row in selected:
        url = row["canonical_url"]
        if row.get("declared_canonical") != url:
            raise ValueError("canonical_mismatch:" + url)
        if any(row.get(key) != value for key, value in required.items()):
            raise ValueError("unapproved_record_state:" + url)
        if row.get("enumeration_source", {}).get("source_revision") != revision:
            raise ValueError("record_revision_mismatch:" + url)
        if url == HUB:
            identity = ("screener:learning_books", "SP-17 learning_books")
        elif url.startswith(HUB):
            identity = ("screener:learning_book", "SP-17 learning_book_guide")
        else:
            route = {
                "/methods/": ("screener:learning_method", "SP-17 learning_methods"),
                "/paths/": ("screener:learning_path", "SP-17 learning_paths"),
                "/compare/": ("screener:learning_comparison", "SP-17 learning_compare"),
            }
            identity = next(value for marker, value in route.items() if marker in url)
        if (row.get("route_name"), row.get("page_family")) != identity:
            raise ValueError("unexpected_route_identity:" + url)

    result = copy.deepcopy(baseline)
    result.update(
        run_id="books-seo-" + revision[:12],
        generated_at=timestamp,
        source_revision=revision,
    )
    result["source_snapshots"].append({
        "name": (
            "Bounded accepted-generation retention plus 38 freshly exported "
            "Books & Investor Methods identities"
        ),
        "version": revision,
    })
    original_bytes = encoded(result["records"])
    result["records"].extend(selected)
    result["records"].sort(key=order)
    result["record_count"] = len(result["records"])
    result["records_sha256"] = digest(result["records"])
    retained = [row for row in result["records"] if row["canonical_url"] not in URLS]
    if encoded(retained) != original_bytes:
        raise ValueError("unrelated_record_movement")
    return result


def publication(args, producer="stockproof", approved_urls=URLS):
    sys.path.insert(0, args.tools)
    from publisher import (
        PRODUCERS, admit_inventories, build_xml_release, load_inventory,
        publish_release, sha256,
    )

    state, public, evidence = map(Path, (args.state, args.public, args.evidence))
    current = json.loads((state / "current.json").read_text())
    inventories = {
        owner: load_inventory(
            state / "accepted-inventories" / f"{owner}.json", owner
        )
        for owner in PRODUCERS
    }
    before = admit_inventories(inventories, ())
    candidate_inventory = load_inventory(args.candidate, producer)
    inventories[producer] = candidate_inventory
    after = admit_inventories(inventories, ())

    old_urls = {row["url"] for rows in before.values() for row in rows}
    new_urls = {row["url"] for rows in after.values() for row in rows}
    if new_urls - old_urls != approved_urls or old_urls - new_urls:
        raise ValueError("unexpected_canonical_delta")
    for group in before:
        if [row for row in after[group] if row["url"] not in approved_urls] != before[group]:
            raise ValueError("unrelated_family_change:" + group)

    root_before = sha256((public / "sitemap.xml").read_bytes())
    if root_before != current["root_sha256"]:
        raise ValueError("public_private_root_mismatch")
    if sum(current["admitted_counts_by_group"].values()) != len(old_urls):
        raise ValueError("current_count_mismatch")

    expected = build_xml_release(after)
    if args.activate:
        dry = json.loads((evidence / "publisher-dry-run.json").read_text())
        if (
            dry.get("validation_result") != "passed"
            or dry.get("mode") != "dry-run"
            or dry.get("root_sha256") != expected["root_sha256"]
            or dry.get("previous_root_sha256") != root_before
        ):
            raise ValueError("dry_run_activation_mismatch")

    result = publish_release(
        inventories,
        staging=args.staging,
        public=public,
        private=state,
        publisher_revision=args.publisher_revision,
        activate=args.activate,
        release_id=args.release_id,
    )
    output = evidence / (
        "publisher-activation.json" if args.activate else "publisher-dry-run.json"
    )
    output.write_bytes(encoded(result) + b"\n")
    if not args.activate and sha256((public / "sitemap.xml").read_bytes()) != root_before:
        raise ValueError("dry_run_changed_public_root")
    print(json.dumps({
        "release_id": result["release_id"],
        "mode": result["mode"],
        "validation_result": result["validation_result"],
        "previous_url_count": len(old_urls),
        "new_url_count": len(new_urls),
        "added": sorted(approved_urls),
        "root_sha256": result["root_sha256"],
    }))


def main():
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="action", required=True)
    make = sub.add_parser("candidate")
    make.add_argument("baseline")
    make.add_argument("source")
    make.add_argument("revision")
    make.add_argument("output")
    publish = sub.add_parser("publish")
    publish.add_argument("tools")
    publish.add_argument("candidate")
    publish.add_argument("evidence")
    publish.add_argument("release_id")
    publish.add_argument("publisher_revision")
    publish.add_argument("--activate", action="store_true")
    publish.add_argument("--state", default="/opt/factory/seo-state")
    publish.add_argument("--public", default="/opt/factory/seo-public")
    publish.add_argument(
        "--staging", default="/opt/factory/seo-staging/books-seo"
    )
    args = parser.parse_args()
    if args.action == "publish":
        publication(args)
        return
    baseline = json.loads(Path(args.baseline).read_text())
    source = json.loads(Path(args.source).read_text())
    result = candidate(
        baseline, source, args.revision,
        datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    )
    Path(args.output).write_bytes(encoded(result) + b"\n")
    print(json.dumps({
        "retained": len(baseline["records"]),
        "added": sorted(URLS),
        "record_count": result["record_count"],
        "records_sha256": result["records_sha256"],
    }))


if __name__ == "__main__":
    main()
