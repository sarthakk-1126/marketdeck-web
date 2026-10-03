"""Offline checks for the proposed SEO-008 schema. No network or project DB.

Run with Python and jsonschema available. This does not test a Django app,
production inventory, or a deployed sitemap.
"""
import copy
import hashlib
import json
import unittest
from pathlib import Path
from jsonschema import Draft202012Validator, FormatChecker

ROOT=Path(__file__).resolve().parent
SCHEMA=json.loads((ROOT/'inventory-v1.schema.json').read_text(encoding='utf-8'))
VALIDATOR=Draft202012Validator(SCHEMA,format_checker=FormatChecker())

def example():
    record={
      'canonical_url':'https://marketdeck.in/screener/compare/',
      'repository':'stockproof','route_name':'screener:multiples_comparison',
      'page_family':'SP-21 multiples_comparison','public_record_identifier':None,
      'classification':'A','intended_indexing_policy':'index',
      'policy_reason':'Reviewed clean explanatory landing.',
      'enumeration_source':{'owner':'screener.seo.PAGE_SEO','snapshot':'synthetic-test-v1'},
      'content_eligibility_status':'eligible','eligibility_reason':'Synthetic fixture passes its gate.',
      'expected_http_status':200,'robots_policy':'index_follow',
      'declared_canonical':'https://marketdeck.in/screener/compare/',
      'sitemap_eligible':True,'sitemap_membership':'unknown',
      'internal_inbound_link':{'state':'unknown','source_url':None,'discovery_source':None},
      'content_updated_at':None,'deployed_sha':None,'last_verified_at':None,
      'google_inspection_state':'not_checked','google_inspection_date':None,
      'next_action':'Verify the deployed revision and anonymous production HTML.',
      'owner':'MarketDeck SEO lead',
    }
    records=[record]
    encoded=json.dumps(records,sort_keys=True,separators=(',',':'),ensure_ascii=False,allow_nan=False).encode('utf-8')
    return {
      'schema_version':'1.0.0','run_id':'offline-example-only',
      'generated_at':'2026-09-24T00:00:00Z','generator_version':'schema-example-v1',
      'environment':'test','preferred_origin':'https://marketdeck.in','producer':'stockproof',
      'source_revision':'ec954c5b284f530e76b7f9bc9583ec29aa8cb949',
      'source_snapshots':[{'name':'fixture','version':'synthetic-test-v1'}],
      'enumeration_status':'complete','enumeration_errors':[],
      'record_count':1,'records_sha256':hashlib.sha256(encoded).hexdigest(),'records':records,
    }

class ContractTests(unittest.TestCase):
    def test_schema_is_valid_and_retains_24_required_fields(self):
        Draft202012Validator.check_schema(SCHEMA)
        self.assertEqual(len(SCHEMA['$defs']['record']['required']),24)
        self.assertEqual(set(SCHEMA['$defs']['record']['required']),set(SCHEMA['$defs']['record']['properties']))

    def test_source_only_example_is_valid_and_not_live_claimed(self):
        x=example(); VALIDATOR.validate(x)
        self.assertIsNone(x['records'][0]['deployed_sha'])
        self.assertIsNone(x['records'][0]['last_verified_at'])
        self.assertEqual(x['records'][0]['google_inspection_state'],'not_checked')

    def test_each_of_24_record_fields_is_required(self):
        for field in SCHEMA['$defs']['record']['required']:
            with self.subTest(field=field):
                x=example(); del x['records'][0][field]
                self.assertTrue(list(VALIDATOR.iter_errors(x)))

    def test_publication_boundary_rejects_inconsistent_records(self):
        cases=[('classification','B'),('classification','C'),('classification','D'),('classification','E'),('classification','F'),('content_eligibility_status','ineligible'),('content_eligibility_status','pending'),('robots_policy','noindex_follow'),('intended_indexing_policy','noindex'),('expected_http_status',301),('expected_http_status',404),('expected_http_status',[200,503]),('canonical_url',None),('declared_canonical',None)]
        for key,value in cases:
            with self.subTest(key=key,value=value):
                x=example();x['records'][0][key]=value
                self.assertTrue(list(VALIDATOR.iter_errors(x)))

    def test_untrusted_origins_and_fragments_rejected(self):
        for url in ('http://marketdeck.in/','https://www.marketdeck.in/','https://platform.marketdeck.in/','https://marketdeck.in.attacker.example/','https://attacker.example/','https://marketdeck.in/#fragment','https://user:password@marketdeck.in/'):
            with self.subTest(url=url):
                x=example();x['records'][0]['canonical_url']=url
                self.assertTrue(list(VALIDATOR.iter_errors(x)))

    def test_audit_only_b_and_f_records_remain_representable(self):
        x=example();r=x['records'][0]
        r.update(classification='B',sitemap_eligible=False,expected_http_status=301,intended_indexing_policy='not_applicable')
        VALIDATOR.validate(x)
        r.update(classification='F',content_eligibility_status='pending',intended_indexing_policy='pending_repair',expected_http_status=200,declared_canonical=None,robots_policy='noindex_follow')
        VALIDATOR.validate(x)

    def test_private_exclusion_does_not_need_a_real_identifier(self):
        x=example();r=x['records'][0]
        r.update(canonical_url=None,declared_canonical=None,public_record_identifier=None,classification='D',intended_indexing_policy='noindex',content_eligibility_status='not_applicable',expected_http_status=[302,403,404],robots_policy='noindex_follow',sitemap_eligible=False,sitemap_membership='not_applicable')
        VALIDATOR.validate(x)

    def test_null_live_revision_requires_owned_action(self):
        x=example();x['records'][0]['next_action']=None
        self.assertTrue(list(VALIDATOR.iter_errors(x)))

    def test_live_verification_cannot_lack_deployed_identity(self):
        x=example();x['records'][0]['last_verified_at']='2026-09-24T00:00:00Z'
        self.assertTrue(list(VALIDATOR.iter_errors(x)))
        x['records'][0]['deployed_sha']='sha256:'+'a'*64
        VALIDATOR.validate(x)

    def test_google_indexed_requires_actual_inspection_date(self):
        for state in ('indexed','not_indexed','blocked','error'):
            with self.subTest(state=state):
                x=example();x['records'][0]['google_inspection_state']=state
                self.assertTrue(list(VALIDATOR.iter_errors(x)))
                x['records'][0]['google_inspection_date']='2026-09-24'
                VALIDATOR.validate(x)

    def test_unchecked_google_cannot_have_fabricated_date(self):
        x=example();x['records'][0]['google_inspection_date']='2026-09-24'
        self.assertTrue(list(VALIDATOR.iter_errors(x)))

    def test_inbound_link_present_requires_evidence(self):
        x=example();x['records'][0]['internal_inbound_link']['state']='present'
        self.assertTrue(list(VALIDATOR.iter_errors(x)))
        x['records'][0]['internal_inbound_link'].update(source_url='https://marketdeck.in/screener/',discovery_source='Synthetic public-anchor fixture')
        VALIDATOR.validate(x)

    def test_failures_cannot_masquerade_as_complete_or_partial_inventory(self):
        x=example();x['enumeration_errors']=[{'family':'SP-21','code':'source_unavailable'}]
        self.assertTrue(list(VALIDATOR.iter_errors(x)))
        x['enumeration_status']='failed'
        self.assertTrue(list(VALIDATOR.iter_errors(x)))
        x['records']=[];x['record_count']=0;x['records_sha256']=hashlib.sha256(b'[]').hexdigest()
        VALIDATOR.validate(x)

    def test_extra_record_fields_are_rejected(self):
        x=example();x['records'][0]['raw_upload_filename']='not-permitted'
        self.assertTrue(list(VALIDATOR.iter_errors(x)))

    def test_invalid_timestamp_format_is_rejected(self):
        x=example();x['generated_at']='today'
        self.assertTrue(list(VALIDATOR.iter_errors(x)))

    def test_schema_is_not_a_semantic_or_privacy_proof(self):
        # Explicitly preserve this limitation: equality, checksum, route
        # allowlists, secret scanning and approval require application checks.
        x=example();x['records'][0]['declared_canonical']='https://marketdeck.in/'
        VALIDATOR.validate(x)
        self.assertNotEqual(x['records'][0]['canonical_url'],x['records'][0]['declared_canonical'])

if __name__=='__main__':
    unittest.main(verbosity=2)
