"""Bounded discovery release. Never treat retained records as a fresh full census.

Candidate comes from the real Screener exporter; exactly one record is admitted.
Existing accepted records and all other producer envelopes are preserved.
"""
import argparse
import copy
import hashlib
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

URL = 'https://marketdeck.in/screener/research-terminal/'
BASE_DIGEST = 'f3a5b75530375e392e6c2f44e14a56d54fc646c00e7679efb3ec1a2293a47bbc'
BASE_COUNT = 17705
BASE_RELEASE = 'sg09-var-only-20261004-live1'
PUBLISHER_REVISION = '1c0160f2604c4a062ea25c6422cb68ce600b6cc3'

def encoded(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':'), ensure_ascii=False, allow_nan=False).encode('utf-8')

def digest(value):
    return hashlib.sha256(encoded(value)).hexdigest()

def order(row):
    url, identity = row['canonical_url'], row['public_record_identifier']
    return (url is None, url or '', row['repository'], row['route_name'], identity is not None, identity or '')

def candidate(baseline, source, revision, timestamp, *, expected_digest, expected_count):
    if baseline['producer'] != 'stockproof' or baseline['enumeration_status'] != 'complete':
        raise ValueError('invalid_accepted_source')
    if digest(baseline['records']) != expected_digest or baseline['records_sha256'] != expected_digest or len(baseline['records']) != expected_count:
        raise ValueError('accepted_generation_changed')
    if not re.fullmatch('[a-f0-9]{40}', revision):
        raise ValueError('invalid_revision')
    if source['producer'] != 'stockproof' or source['enumeration_status'] != 'complete' or source['source_revision'] != revision or digest(source['records']) != source['records_sha256']:
        raise ValueError('invalid_fresh_source')
    selected = [r for r in source['records'] if r.get('canonical_url') == URL]
    if len(selected) != 1:
        raise ValueError('source_identity_not_unique')
    record = copy.deepcopy(selected[0])
    required = {'declared_canonical': URL, 'route_name': 'screener:research_terminal_landing', 'repository': 'stockproof', 'page_family': 'SP-01 product_landing', 'classification': 'A', 'sitemap_eligible': True, 'content_eligibility_status': 'eligible', 'expected_http_status': 200, 'intended_indexing_policy': 'index', 'robots_policy': 'index_follow'}
    if any(record.get(k) != v for k, v in required.items()):
        raise ValueError('unapproved_source_identity')
    if record['enumeration_source'].get('source_revision') != revision:
        raise ValueError('record_revision_mismatch')
    if any(r.get('canonical_url') == URL for r in baseline['records']):
        raise ValueError('already_admitted')
    result = copy.deepcopy(baseline)
    result.update(run_id='terminal-discovery-'+revision[:12], generated_at=timestamp, source_revision=revision)
    result['source_snapshots'].append({'name': 'Bounded accepted-generation retention plus one freshly exported Research Terminal landing; not a full-registry refresh', 'version': revision})
    result['records'].append(record)
    result['records'].sort(key=order)
    result['record_count'] = len(result['records'])
    result['records_sha256'] = digest(result['records'])
    if encoded([r for r in result['records'] if r['canonical_url'] != URL]) != encoded(baseline['records']):
        raise ValueError('unrelated_record_movement')
    return result

def publication(args):
    sys.path.insert(0, args.tools)
    from publisher import PRODUCERS, load_inventory, admit_inventories, publish_release, build_xml_release, sha256
    state, public, evidence = Path(args.state), Path(args.public), Path(args.evidence)
    current = json.loads((state/'current.json').read_text())
    if current['release_id'] != BASE_RELEASE or sum(current['admitted_counts_by_group'].values()) != 12889:
        raise ValueError('central_baseline_changed')
    inventories = {owner: load_inventory(state/'accepted-inventories'/(owner+'.json'), owner) for owner in PRODUCERS}
    baseline = inventories['stockproof']
    before = admit_inventories(inventories, ())
    new = load_inventory(args.candidate, 'stockproof')
    if encoded([r for r in new['records'] if r['canonical_url'] != URL]) != encoded(baseline['records']):
        raise ValueError('unrelated_source_record_movement')
    inventories['stockproof'] = new
    after = admit_inventories(inventories, ())
    old_urls = {r['url'] for rows in before.values() for r in rows}
    new_urls = {r['url'] for rows in after.values() for r in rows}
    if len(old_urls) != 12889 or len(new_urls) != 12890 or new_urls-old_urls != {URL} or old_urls-new_urls:
        raise ValueError('unexpected_canonical_delta')
    for group in before:
        filtered = [r for r in after[group] if r['url'] != URL]
        if filtered != before[group]:
            raise ValueError('unrelated_family_change:'+group)
    root_before = sha256((public/'sitemap.xml').read_bytes())
    if root_before != current['root_sha256']:
        raise ValueError('public_private_root_mismatch')
    expected = build_xml_release(after)
    if args.activate:
        dry = json.loads((evidence/'publisher-dry-run.json').read_text())
        if dry['validation_result'] != 'passed' or dry['mode'] != 'dry-run' or dry['root_sha256'] != expected['root_sha256'] or dry['previous_root_sha256'] != root_before:
            raise ValueError('dry_run_activation_mismatch')
    result = publish_release(inventories, staging=args.staging, public=public, private=state, publisher_revision=PUBLISHER_REVISION, activate=args.activate, release_id=args.release_id)
    (evidence/('publisher-activation.json' if args.activate else 'publisher-dry-run.json')).write_bytes(encoded(result)+b'\n')
    if not args.activate and sha256((public/'sitemap.xml').read_bytes()) != root_before:
        raise ValueError('dry_run_changed_public_root')
    print(json.dumps({k:result[k] for k in ['release_id','mode','validation_result','root_sha256','admitted_counts_by_group','change_event']}))

def main():
    p=argparse.ArgumentParser();sub=p.add_subparsers(dest='action',required=True)
    c=sub.add_parser('candidate');c.add_argument('baseline');c.add_argument('source');c.add_argument('revision');c.add_argument('output')
    r=sub.add_parser('publish');r.add_argument('tools');r.add_argument('candidate');r.add_argument('evidence');r.add_argument('release_id');r.add_argument('--activate',action='store_true')
    r.add_argument('--state',default='/opt/factory/seo-state');r.add_argument('--public',default='/opt/factory/seo-public');r.add_argument('--staging',default='/opt/factory/seo-staging/research-terminal-discovery')
    a=p.parse_args()
    if a.action=='publish':publication(a);return
    result=candidate(json.loads(Path(a.baseline).read_text()),json.loads(Path(a.source).read_text()),a.revision,datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),expected_digest=BASE_DIGEST,expected_count=BASE_COUNT)
    Path(a.output).write_bytes(encoded(result)+b'\n')
    print(json.dumps({'retained':BASE_COUNT,'added':[URL],'record_count':result['record_count'],'records_sha256':result['records_sha256']}))

if __name__=='__main__':main()
