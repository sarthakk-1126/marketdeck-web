"""CEO-authorized bounded admission: accepted generation plus exactly one note.

This is NOT a fresh enumeration of the whole editorial source registry. Existing
accepted records and their original source snapshots are retained unchanged.
Central schema/admission validation remains mandatory in the installed publisher.
"""
import argparse
import copy
import hashlib
import json
import re
from datetime import datetime, timezone
from pathlib import Path

VAR = "https://marketdeck.in/intelligence/notes/when-var-methods-disagree/"
BASE_DIGEST = "8826ce3f6d9f67c703bd598d23b0c4345a498243a09fd3942ebf2f3a8bd86ec6"

def encoded(value):
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False, allow_nan=False).encode("utf-8")

def digest(value):
    return hashlib.sha256(encoded(value)).hexdigest()

def order(row):
    url, identity = row["canonical_url"], row["public_record_identifier"]
    return (url is None, url or "", row["repository"], row["route_name"], identity is not None, identity or "")

def candidate(baseline, new_record, revision, timestamp):
    if baseline["producer"] != "marketdeck-web" or digest(baseline["records"]) != BASE_DIGEST or baseline["records_sha256"] != BASE_DIGEST:
        raise ValueError("accepted_web_generation_changed")
    if len(baseline["records"]) != 32 or sum(r["sitemap_eligible"] for r in baseline["records"]) != 28:
        raise ValueError("accepted_web_population_changed")
    if not re.fullmatch(r"[0-9a-f]{40}", revision):
        raise ValueError("invalid_source_revision")
    required = {"canonical_url": VAR, "declared_canonical": VAR, "repository": "marketdeck-web", "route_name": "intelligence:note", "page_family": "INT-03 authored_note", "public_record_identifier": "when-var-methods-disagree", "classification": "A", "sitemap_eligible": True, "content_eligibility_status": "eligible", "expected_http_status": 200, "intended_indexing_policy": "index", "robots_policy": "index_follow"}
    if any(new_record.get(k) != v for k, v in required.items()):
        raise ValueError("unapproved_research_record")
    if any(r["canonical_url"] == VAR for r in baseline["records"]):
        raise ValueError("research_already_accepted")
    result = copy.deepcopy(baseline)
    result.update(run_id="sg09-var-only-" + revision[:12] + "-" + timestamp.replace(":", ""), generated_at=timestamp, source_revision=revision)
    result["source_snapshots"].append({"name": "SG09 bounded accepted-generation retention + approved VaR note; docs/research/var-only-release.md", "version": revision})
    result["records"].append(copy.deepcopy(new_record))
    result["records"].sort(key=order)
    result["record_count"] = len(result["records"])
    result["records_sha256"] = digest(result["records"])
    retained = [r for r in result["records"] if r["canonical_url"] != VAR]
    if encoded(retained) != encoded(baseline["records"]):
        raise ValueError("unrelated_record_movement")
    return result

if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("baseline"); p.add_argument("record"); p.add_argument("revision"); p.add_argument("output")
    a = p.parse_args()
    result = candidate(json.loads(Path(a.baseline).read_text()), json.loads(Path(a.record).read_text()), a.revision, datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"))
    Path(a.output).write_bytes(encoded(result) + b"\n")
    print(json.dumps({"retained_records": 32, "added": [VAR], "eligible_records": 29, "records_sha256": result["records_sha256"]}))
