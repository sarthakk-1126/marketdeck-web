import copy
import json
import subprocess
import sys
import tempfile
import unittest
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'/'seo'))
sys.path.insert(0,str(ROOT/'docs'/'seo'))
from inventory_protocol_reference import finalize_inventory
from publisher import (
    GENERATOR_POLICY, GROUPS, MAX_BYTES, NS, PRODUCERS, PublicationError, admit_inventories,
    assert_rollback_safe, build_xml_release, load_accepted_inventories, load_inventory,
    load_private_state, publish_release, publisher_lock, reconcile_sets,
    recover_active_release, select_generations, sha256, split_group,
)

REV='1'*40
NOW='2026-09-24T00:00:00Z'
OWNER_FIXTURES={
    'marketdeck-web':('WEB-01 platform_home','https://marketdeck.in/'),
    'stockproof':('SP-01 product_home','https://marketdeck.in/screener/'),
    'charting-v1':('CH-01 charting_home','https://marketdeck.in/charts/'),
    'fo-analytics-v1':('FO-01 fo_home','https://marketdeck.in/futures-and-options/'),
    'market-commentary-v1':('COM-01 commentary_home','https://marketdeck.in/commentary/'),
    'crypto-tools-v1':('CR-01 crypto_home','https://marketdeck.in/crypto/'),
}
ACCEPTED_GENERATORS={
    'marketdeck-web':'seo-008f-web-inventory-v1',
    'stockproof':'stockproof-seo-inventory-v1',
    'charting-v1':'charting-seo-inventory-v1',
    'fo-analytics-v1':'seo-008c-r2',
    'market-commentary-v1':'commentary-inventory-v1',
    'crypto-tools-v1':'crypto-seo-inventory-v1',
}

def row(owner,family,url,*,eligible=True,classification='A',updated=None,route='fixture:route',identity=None):
    return {
      'canonical_url':url,'repository':owner,'route_name':route,'page_family':family,
      'public_record_identifier':identity,'classification':classification,
      'intended_indexing_policy':'index' if eligible else ('non_html' if classification=='B' else 'noindex'),
      'policy_reason':'Synthetic offline acceptance fixture.','enumeration_source':{'fixture':'seo-008f'},
      'content_eligibility_status':'eligible' if eligible else 'not_applicable','eligibility_reason':'Synthetic offline acceptance fixture.',
      'expected_http_status':200,'robots_policy':'index_follow' if eligible else ('non_html' if classification=='B' else 'noindex_follow'),
      'declared_canonical':url if eligible or classification=='B' else None,'sitemap_eligible':eligible,
      'sitemap_membership':'unknown','internal_inbound_link':{'state':'unknown','source_url':None,'discovery_source':None},
      'content_updated_at':updated,'deployed_sha':None,'last_verified_at':None,'google_inspection_state':'not_checked',
      'google_inspection_date':None,'next_action':'Verify synthetic fixture.','owner':'Fixture owner',
    }

def envelope(owner,records=None):
    family,url=OWNER_FIXTURES[owner]
    value={'schema_version':'1.0.0','run_id':'fixture-'+owner,'generated_at':NOW,'generator_version':ACCEPTED_GENERATORS[owner],'environment':'test','preferred_origin':'https://marketdeck.in','producer':owner,'source_revision':REV,'source_snapshots':[{'name':'fixture','version':'v1'}],'enumeration_status':'complete','enumeration_errors':[],'record_count':0,'records_sha256':'','records':records if records is not None else [row(owner,family,url)]}
    return finalize_inventory(value)

def six():return {owner:envelope(owner) for owner in PRODUCERS}

class PublisherTests(unittest.TestCase):
    def code(self,expected,fn):
        with self.assertRaises(PublicationError) as caught:fn()
        self.assertEqual(str(caught.exception),expected)

    def test_six_producer_happy_path_and_empty_groups(self):
        values=six();self.assertEqual({owner:value['generator_version'] for owner,value in values.items()},ACCEPTED_GENERATORS)
        self.assertEqual(GENERATOR_POLICY,{owner:{version} for owner,version in ACCEPTED_GENERATORS.items()})
        admitted=admit_inventories(values);xml=build_xml_release(admitted)
        self.assertEqual(sum(map(len,admitted.values())),6)
        self.assertEqual(sum(c['count'] for c in xml['children']),6)
        self.assertFalse(any(c['group'] in {'stockproof-companies','stockproof-funds','crypto-coins'} for c in xml['children']))

    def test_missing_and_failed_producer_rejected(self):
        values=six();del values['stockproof'];self.code('incomplete_producer_set',lambda:admit_inventories(values))
        values=six();bad=copy.deepcopy(values['stockproof']);bad.update(records=[],enumeration_status='failed',enumeration_errors=[{'family':'SP-01','code':'source_failed'}]);values['stockproof']=finalize_inventory(bad)
        self.code('producer_generation_failed',lambda:admit_inventories(values))

    def test_schema_and_generator_mismatch(self):
        values=six();values['stockproof']['schema_version']='2.0.0';self.code('inventory_schema_mismatch',lambda:admit_inventories(values))
        values=six();values['stockproof']['records_sha256']='0'*64;self.code('inventory_integrity_failed',lambda:admit_inventories(values))

    def test_unknown_and_stale_generator_versions_fail_closed(self):
        for owner in PRODUCERS:
            for rejected in ('future-v9','seo-008-inventory-v1'):
                with self.subTest(owner=owner,generator_version=rejected):
                    values=six();values[owner]['generator_version']=rejected
                    self.code('generator_policy_mismatch',lambda:admit_inventories(values))

    def test_fo_prior_stale_and_future_generator_versions_fail_closed(self):
        for rejected in ('seo-008c-r1','seo-008-inventory-v1','future-v9'):
            with self.subTest(generator_version=rejected):
                values=six();values['fo-analytics-v1']['generator_version']=rejected
                self.code('generator_policy_mismatch',lambda:admit_inventories(values))

    def test_sp08_clean_screener_is_admitted_but_result_state_is_not(self):
        clean=row('stockproof','SP-08 screener_landing','https://marketdeck.in/screener/screener/',route='screener:screener')
        result=row('stockproof','SP-08 screener_result_state','https://marketdeck.in/screener/screener/?q=bank',eligible=False,classification='C',route='screener:screener',identity='q=bank')
        values=six();values['stockproof']=envelope('stockproof',[clean,result])
        admitted=admit_inventories(values)
        self.assertEqual(admitted['stockproof-catalog'],[{'url':clean['canonical_url'],'family':'SP-08','content_updated_at':None}])
        self.assertFalse(result['sitemap_eligible'])
        self.assertNotIn(result['canonical_url'],[record['url'] for records in admitted.values() for record in records])
        values=six();values['stockproof']=envelope('stockproof',[row('stockproof','SP-08 screener_landing','https://marketdeck.in/screener/screener/?q=bank')])
        self.code('unapproved_query_identity',lambda:admit_inventories(values))

    def test_stockproof_approved_query_identities_match_real_source_grammar(self):
        valid = [
            ('SP-02 company_directory','https://marketdeck.in/screener/companies/?page=2'),
            ('SP-09 fund_directory','https://marketdeck.in/screener/funds/?page=10'),
            ('SP-11 etf_directory','https://marketdeck.in/screener/etfs/?page=100'),
            ('SP-07 curated_screen','https://marketdeck.in/screener/screener/?screen=magic_formula'),
            ('SP-07 curated_screen','https://marketdeck.in/screener/screener/?screen=rsi_14&page=2'),
            ('SP-07 curated_screen','https://marketdeck.in/screener/screener/?screen=delivery_percentage&page=10'),
        ]
        for family,url in valid:
            with self.subTest(valid=url):
                values=six();values['stockproof']=envelope('stockproof',[row('stockproof',family,url)])
                admitted=admit_inventories(values)
                self.assertEqual(sum(map(len,admitted.values())),6)

        invalid = [
            ('SP-02 company_directory','https://marketdeck.in/screener/companies/?page=1'),
            ('SP-09 fund_directory','https://marketdeck.in/screener/funds/?page=01'),
            ('SP-11 etf_directory','https://marketdeck.in/screener/etfs/?page=0'),
            ('SP-07 curated_screen','https://marketdeck.in/screener/screener/?screen=magic-formula'),
            ('SP-07 curated_screen','https://marketdeck.in/screener/screener/?screen=magic__formula'),
            ('SP-07 curated_screen','https://marketdeck.in/screener/screener/?screen=magic_formula&page=1'),
            ('SP-07 curated_screen','https://marketdeck.in/screener/screener/?page=2&screen=magic_formula'),
            ('SP-07 curated_screen','https://marketdeck.in/screener/screener/?screen=magic_formula&foo=x'),
        ]
        for family,url in invalid:
            with self.subTest(invalid=url):
                values=six();values['stockproof']=envelope('stockproof',[row('stockproof',family,url)])
                self.code('unapproved_query_identity',lambda:admit_inventories(values))

    def test_duplicate_cross_owner_canonical_is_not_deduplicated(self):
        values=six();original=values['stockproof']['records'][0]['canonical_url'];duplicate=values['marketdeck-web']['records'][0]['canonical_url']
        changed=copy.deepcopy(values['stockproof']['records'][0]);changed.update(canonical_url=duplicate,declared_canonical=duplicate)
        values['stockproof']=envelope('stockproof',[changed]);self.code('duplicate_cross_owner_canonical',lambda:admit_inventories(values))

    def test_foreign_origin_invalid_mount_query_and_unknown_family(self):
        cases=[]
        changed=row('stockproof','SP-01 product_home','https://evil.example/screener/');cases.append(('inventory_schema_mismatch',changed))
        cases.append(('invalid_owner_mount',row('stockproof','SP-01 product_home','https://marketdeck.in/crypto/')))
        cases.append(('unapproved_query_identity',row('stockproof','SP-01 product_home','https://marketdeck.in/screener/?q=x')))
        cases.append(('unknown_eligible_family',row('stockproof','SP-99 unknown','https://marketdeck.in/screener/unknown/')))
        for code,changed in cases:
            with self.subTest(code=code):
                values=six();values['stockproof']=envelope('stockproof',[changed]);self.code(code,lambda:admit_inventories(values))

    def test_xml_escaping_determinism_hashes_parse_and_flat_index(self):
        admitted={group:[] for group in GROUPS};admitted['stockproof-catalog']=[{'url':'https://marketdeck.in/screener/screener/?screen=a&label=b','family':'SP-07','content_updated_at':None}]
        first=build_xml_release(admitted);second=build_xml_release(copy.deepcopy(admitted));self.assertEqual(first,second)
        child=first['children'][0];data=first['files'][child['filename']]
        self.assertIn(b'&amp;',data);self.assertEqual(sha256(data),child['sha256']);self.assertIn(child['sha256'],child['filename'])
        self.assertEqual(ET.fromstring(data).tag,f'{{{NS}}}urlset');root=ET.fromstring(first['root']);self.assertEqual(root.tag,f'{{{NS}}}sitemapindex')
        self.assertFalse(root.findall(f'.//{{{NS}}}sitemapindex'))

    def test_10000_url_and_byte_boundaries(self):
        rows=[{'url':f'https://marketdeck.in/screener/company/T{i:05d}/','family':'SP-03','content_updated_at':None} for i in range(10001)]
        self.assertEqual([len(ET.fromstring(p).findall(f'{{{NS}}}url')) for p in split_group(rows)],[10000,1])
        two=rows[:2];exact=len(split_group(two,max_bytes=MAX_BYTES)[0])
        self.assertEqual(len(split_group(two,max_bytes=exact)),1);self.assertEqual(len(split_group(two,max_bytes=exact-1)),2)
        self.assertEqual(MAX_BYTES,10_000_000)
        large=[{'url':f"https://marketdeck.in/screener/company/{i:05d}-"+'x'*1940+'/','family':'SP-03','content_updated_at':None} for i in range(5100)]
        parts=split_group(large);self.assertGreater(len(parts),1);self.assertTrue(all(len(part)<=10_000_000 for part in parts));self.assertEqual(sum(len(ET.fromstring(part).findall(f'{{{NS}}}url')) for part in parts),len(large))

    def test_honest_lastmod_and_no_non_a_leakage(self):
        admitted={group:[] for group in GROUPS};admitted['intelligence']=[
          {'url':'https://marketdeck.in/intelligence/notes/a/','family':'INT-03','content_updated_at':'2026-09-23'},
          {'url':'https://marketdeck.in/intelligence/','family':'INT-01','content_updated_at':'2026-09-23'},]
        data=build_xml_release(admitted)['files'];xml=next(iter(data.values())).decode();self.assertEqual(xml.count('<lastmod>'),1);self.assertIn('<lastmod>2026-09-23</lastmod>',xml)
        values=six();extras=[]
        for classification in 'BCDEF':
            extra=row('marketdeck-web',f'INT-07 audit_{classification.lower()}','https://marketdeck.in/intelligence/issues/a/',eligible=False,classification=classification,identity=classification)
            if classification=='B':extra.update(page_family='INT-06 companion_pdf',intended_indexing_policy='non_html',robots_policy='non_html',declared_canonical='https://marketdeck.in/intelligence/issues/a/')
            if classification=='F':extra.update(content_eligibility_status='pending',intended_indexing_policy='pending_repair')
            extras.append(extra)
        values['marketdeck-web']=envelope('marketdeck-web',values['marketdeck-web']['records']+extras)
        self.assertEqual(sum(map(len,admit_inventories(values).values())),6)

    def test_atomic_failures_leave_old_root_and_collision_refuses(self):
        for step in ('after_staging','before_child_copies','after_child_copies','before_root_switch'):
            with self.subTest(step=step),tempfile.TemporaryDirectory() as td:
                base=Path(td);public=base/'public';public.mkdir();old=b'old-root';(public/'sitemap.xml').write_bytes(old)
                def inject(name):
                    if name==step:raise RuntimeError('injected')
                with self.assertRaises(RuntimeError):publish_release(six(),staging=base/'staging',public=public,private=base/'private',publisher_revision=REV,activate=True,release_id='r-'+step,inject=inject)
                self.assertEqual((public/'sitemap.xml').read_bytes(),old)
                self.assertIsNone(load_private_state(base/'private'))
        with tempfile.TemporaryDirectory() as td:
            base=Path(td);public=base/'public';public.mkdir();xml=build_xml_release(admit_inventories(six()));name=xml['children'][0]['filename'];(public/name).write_bytes(b'corrupt');(public/'sitemap.xml').write_bytes(b'old')
            self.code('immutable_child_collision',lambda:publish_release(six(),staging=base/'stage',public=public,private=base/'private',publisher_revision=REV,activate=True,release_id='collision'))
            self.assertEqual((public/'sitemap.xml').read_bytes(),b'old')

    def test_dry_run_and_public_private_separation(self):
        with tempfile.TemporaryDirectory() as td:
            base=Path(td);meta=publish_release(six(),staging=base/'stage',public=base/'public',private=base/'private',publisher_revision=REV,release_id='dry')
            self.assertEqual(meta['mode'],'dry-run');self.assertFalse((base/'public'/'sitemap.xml').exists());self.assertTrue((base/'private'/'last-dry-run.json').exists())
        with tempfile.TemporaryDirectory() as td:
            base=Path(td);meta=publish_release(six(),staging=base/'stage',public=base/'public',private=base/'private',publisher_revision=REV,activate=True,release_id='active')
            self.assertEqual(load_private_state(base/'private')['release_id'],'active')
            self.assertEqual(set(load_accepted_inventories(base/'private')),set(PRODUCERS))
            (base/'private'/'current.json').unlink();self.assertEqual(recover_active_release(base/'private',base/'public')['release_id'],'active')
            self.assertTrue(all(p.suffix=='.xml' for p in (base/'public').iterdir()));self.assertTrue(any(p.suffix=='.json' for p in (base/'private').rglob('*') if p.is_file()))

    def test_storage_paths_must_be_isolated(self):
        with tempfile.TemporaryDirectory() as td:
            base=Path(td);self.code('storage_paths_not_isolated',lambda:publish_release(six(),staging=base/'state'/'stage',public=base/'public',private=base/'state',publisher_revision=REV,release_id='bad-paths'))

    def test_node_export_is_accepted_cross_language(self):
        with tempfile.TemporaryDirectory() as td:
            target=Path(td)/'web.json'
            result=subprocess.run(['node','scripts/seo/export-web-inventory.mjs','--output',str(target),'--environment','test','--generated-at',NOW,'--run-id','cross-language'],cwd=ROOT,capture_output=True,text=True)
            self.assertEqual(result.returncode,0,result.stderr)
            exported=load_inventory(target,'marketdeck-web');self.assertEqual(exported['record_count'],23);self.assertEqual(sum(r['sitemap_eligible'] for r in exported['records']),20)

    def test_safe_retention_revocation_and_stale_rollback_prohibition(self):
        accepted=six();incoming=six();failed=copy.deepcopy(incoming['stockproof']);failed.update(records=[],enumeration_status='failed',enumeration_errors=[{'family':'SP-01','code':'source_failed'}]);incoming['stockproof']=finalize_inventory(failed)
        selected,status=select_generations(incoming,accepted);self.assertEqual(selected['stockproof']['run_id'],accepted['stockproof']['run_id']);self.assertEqual(status['stockproof'],'stale_degraded')
        revoked='https://marketdeck.in/screener/';self.assertNotIn(revoked,[r['url'] for rows in admit_inventories(selected,[revoked]).values() for r in rows])
        manifest={'admitted_url_sha256':[sha256(revoked.encode())]};self.code('revoked_release_rollback_forbidden',lambda:assert_rollback_safe(manifest,[revoked]))

    def test_concurrent_run_is_refused(self):
        with tempfile.TemporaryDirectory() as td:
            private=Path(td)
            with publisher_lock(private):self.code('publisher_already_running',lambda:publisher_lock(private).__enter__())

    def test_all_eight_reconciliations_and_zero_denominator(self):
        result=reconcile_sets({'a','b'},{'b','c'},{'b','d'},{'a','c','e'},{'b','f'})
        self.assertEqual(len(result['differences']),8);self.assertEqual(result['differences']['candidate_not_approved'],['a']);self.assertEqual(result['differences']['approved_not_candidate'],['c'])
        empty=reconcile_sets([],[],[],[],[]);self.assertEqual(empty['coverage']['sitemap']['status'],'not_applicable');self.assertIsNone(empty['coverage']['sitemap']['percentage'])

if __name__=='__main__':unittest.main(verbosity=2)
