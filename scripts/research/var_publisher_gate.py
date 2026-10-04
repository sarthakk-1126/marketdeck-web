"""Bounded wrapper for the unchanged installed central publisher (dry-run first).

Run from a private release evidence directory. No exporter/registry/producer
repair. Fail before publication if central lifecycle changes beyond VaR.
"""
import argparse
import json
import sys
from pathlib import Path

def main():
    p = argparse.ArgumentParser()
    p.add_argument("tools"); p.add_argument("candidate"); p.add_argument("evidence"); p.add_argument("release_id")
    p.add_argument("--activate", action="store_true")
    a = p.parse_args()
    sys.path.insert(0, a.tools)
    from publisher import PRODUCERS, load_inventory, publish_release, admit_inventories, build_xml_release, sha256
    state = Path("/opt/factory/seo-state")
    public = Path("/opt/factory/seo-public")
    current = json.loads((state / "current.json").read_text())
    if current["release_id"] != "portfolio-intelligence-20261001-v1" or sum(current["admitted_counts_by_group"].values()) != 12888:
        raise ValueError("accepted_central_baseline_changed")
    inventories = {owner: load_inventory(state / "accepted-inventories" / (owner + ".json"), owner) for owner in PRODUCERS}
    before = admit_inventories(inventories, ())
    inventories["marketdeck-web"] = load_inventory(a.candidate, "marketdeck-web")
    after = admit_inventories(inventories, ())
    var = "https://marketdeck.in/intelligence/notes/when-var-methods-disagree/"
    before_urls = {r["url"] for rows in before.values() for r in rows}
    after_urls = {r["url"] for rows in after.values() for r in rows}
    if len(before_urls) != 12888 or len(after_urls) != 12889 or after_urls - before_urls != {var} or before_urls - after_urls:
        raise ValueError("unrelated_canonical_movement")
    for group in before:
        if group != "intelligence" and before[group] != after[group]:
            raise ValueError("unrelated_family_movement")
    if [r for r in after["intelligence"] if r["url"] != var] != before["intelligence"]:
        raise ValueError("unrelated_editorial_movement")
    root_before = sha256((public / "sitemap.xml").read_bytes())
    if root_before != current["root_sha256"]:
        raise ValueError("public_private_root_mismatch")
    expected = build_xml_release(after)
    evidence = Path(a.evidence)
    if a.activate:
        dry = json.loads((evidence / "publisher-dry-run.json").read_text())
        if dry["validation_result"] != "passed" or dry["mode"] != "dry-run" or dry["root_sha256"] != expected["root_sha256"] or dry["previous_root_sha256"] != root_before:
            raise ValueError("dry_run_activation_mismatch")
    result = publish_release(inventories, staging="/opt/factory/seo-staging/sg09-var-only", public=public, private=state, publisher_revision="1c0160f2604c4a062ea25c6422cb68ce600b6cc3", activate=a.activate, release_id=a.release_id)
    (evidence / ("publisher-activation.json" if a.activate else "publisher-dry-run.json")).write_text(json.dumps(result, sort_keys=True) + "\n")
    if not a.activate and sha256((public / "sitemap.xml").read_bytes()) != root_before:
        raise ValueError("dry_run_mutated_public_root")
    print(json.dumps({k: result[k] for k in ("release_id", "mode", "timestamp", "validation_result", "root_sha256", "admitted_counts_by_group", "change_event")}))

if __name__ == "__main__": main()
