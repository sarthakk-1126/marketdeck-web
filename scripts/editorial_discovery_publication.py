"""Admit exactly the three reviewed Books/Research editorial URLs.

Fresh records come from the installed source-owned web inventory exporter.
Existing accepted records remain byte-equivalent. Publication uses the existing
central publisher, with identical dry-run/activation and unrelated-URL gates.
"""
import argparse
import copy
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from books_seo_publication import digest, encoded, order, _valid_source, publication

ORIGIN='https://marketdeck.in'
IDENTITIES={
    ORIGIN+'/intelligence/notes/investing-book-to-research-workflow/': ('intelligence:note','INT-03 authored_note','investing-book-to-research-workflow'),
    ORIGIN+'/intelligence/notes/strategy-backtest-research-checklist/': ('intelligence:note','INT-03 authored_note','strategy-backtest-research-checklist'),
    ORIGIN+'/intelligence/issues/investing-research-workbook/': ('intelligence:issue','INT-04 html_issue','investing-research-workbook-05'),
}
URLS=frozenset(IDENTITIES)

def candidate(baseline,source,revision,timestamp):
    if not re.fullmatch(r'[a-f0-9]{40}',revision):raise ValueError('invalid_revision')
    _valid_source(baseline,'marketdeck-web');_valid_source(source,'marketdeck-web',revision)
    if URLS & {r.get('canonical_url') for r in baseline['records']}:raise ValueError('already_accepted')
    selected=[copy.deepcopy(r) for r in source['records'] if r.get('canonical_url') in URLS and r.get('route_name') in {'intelligence:note','intelligence:issue'}]
    if len(selected)!=3 or {r['canonical_url'] for r in selected}!=URLS:raise ValueError('missing_or_duplicate_identity')
    required=dict(repository='marketdeck-web',classification='A',sitemap_eligible=True,content_eligibility_status='eligible',expected_http_status=200,intended_indexing_policy='index',robots_policy='index_follow')
    for row in selected:
        url=row['canonical_url']
        if any(row.get(k)!=v for k,v in required.items()) or row.get('declared_canonical')!=url:raise ValueError('unapproved_record_state')
        if tuple(row.get(k) for k in ('route_name','page_family','public_record_identifier'))!=IDENTITIES[url]:raise ValueError('unexpected_route_identity')
    if not source.get('source_snapshots') or any(s.get('version')!=revision for s in source['source_snapshots']):raise ValueError('source_snapshot_revision_mismatch')
    result=copy.deepcopy(baseline)
    result.update(run_id='editorial-discovery-'+revision[:12],generated_at=timestamp,source_revision=revision)
    result['source_snapshots'].append(dict(name='Bounded Books/Research editorial release: two articles and one workbook',version=revision))
    result['records']=sorted(result['records']+selected,key=order)
    result['record_count']=len(result['records']);result['records_sha256']=digest(result['records'])
    if encoded([r for r in result['records'] if r.get('canonical_url') not in URLS])!=encoded(baseline['records']):raise ValueError('unrelated_record_movement')
    return result

if __name__=='__main__':
    p=argparse.ArgumentParser();sub=p.add_subparsers(dest='action',required=True)
    c=sub.add_parser('candidate')
    for name in ('baseline','source','revision','output'):c.add_argument(name)
    q=sub.add_parser('publish')
    for name in ('tools','candidate','evidence','release_id','publisher_revision'):q.add_argument(name)
    q.add_argument('--activate',action='store_true')
    q.add_argument('--state',default='/opt/factory/seo-state');q.add_argument('--public',default='/opt/factory/seo-public');q.add_argument('--staging',default='/opt/factory/seo-staging/editorial-discovery')
    a=p.parse_args()
    if a.action=='publish':publication(a,'marketdeck-web',URLS)
    else:
        r=candidate(json.loads(Path(a.baseline).read_text()),json.loads(Path(a.source).read_text()),a.revision,datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'))
        Path(a.output).write_bytes(encoded(r)+b'\n');print(json.dumps(dict(added=sorted(URLS),record_count=r['record_count'],records_sha256=r['records_sha256'])))
