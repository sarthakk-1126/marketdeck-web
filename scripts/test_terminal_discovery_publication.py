import copy
import unittest
from terminal_discovery_publication import candidate, digest, encoded, order, URL

REV='a'*40
TIME='2026-10-05T00:00:00Z'

def row(url, route):
    return {'canonical_url':url,'declared_canonical':url,'repository':'stockproof','route_name':route,'page_family':'SP-01 product_landing','classification':'A','sitemap_eligible':True,'content_eligibility_status':'eligible','expected_http_status':200,'intended_indexing_policy':'index','robots_policy':'index_follow','enumeration_source':{'source_revision':REV},'public_record_identifier':None}

def envelope(rows):
    rows=sorted(rows,key=order)
    return {'producer':'stockproof','enumeration_status':'complete','source_revision':REV,'records':rows,'records_sha256':digest(rows),'record_count':len(rows),'source_snapshots':[{'name':'original accepted snapshot','version':'older revision'}]}

class BoundedAdmissionTests(unittest.TestCase):
    def setUp(self):
        self.base=envelope([row('https://marketdeck.in/screener/','screener:home'),row('https://marketdeck.in/screener/portfolio-analysis/','screener:portfolio_analysis_landing')])
        self.source=envelope([row(URL,'screener:research_terminal_landing')])
    def build(self,base=None,source=None,revision=REV):
        return candidate(self.base if base is None else base,self.source if source is None else source,revision,TIME,expected_digest=self.base['records_sha256'],expected_count=2)
    def test_exactly_one_new_identity_and_retained_records_are_byte_equivalent(self):
        before=encoded(self.base); result=self.build()
        self.assertEqual(result['record_count'],3)
        self.assertEqual(encoded([r for r in result['records'] if r['canonical_url']!=URL]),encoded(self.base['records']))
        self.assertEqual(encoded(self.base),before)
        self.assertEqual(result['records_sha256'],digest(result['records']))
        self.assertEqual(result['source_snapshots'][0],self.base['source_snapshots'][0])
    def test_changed_accepted_generation_fails_closed(self):
        base=copy.deepcopy(self.base);base['records'][0]['declared_canonical']='https://marketdeck.in/changed/'
        with self.assertRaisesRegex(ValueError,'accepted_generation_changed'):self.build(base=base)
    def test_unreviewed_source_rows_are_not_admitted(self):
        source=copy.deepcopy(self.source);source['records'].append(row('https://marketdeck.in/screener/unrelated/','screener:unrelated'));source['records_sha256']=digest(source['records'])
        self.assertEqual(self.build(source=source)['record_count'],3)
    def test_private_or_ineligible_record_cannot_be_admitted(self):
        for field,value in [('sitemap_eligible',False),('robots_policy','noindex_follow'),('route_name','screener:research_desk'),('page_family','SP-99 arbitrary')]:
            source=copy.deepcopy(self.source);source['records'][0][field]=value;source['records_sha256']=digest(source['records'])
            with self.subTest(field=field),self.assertRaisesRegex(ValueError,'unapproved_source_identity'):self.build(source=source)
    def test_missing_and_duplicate_source_identity_are_rejected(self):
        for rows in [[],self.source['records']*2]:
            source=envelope(rows)
            with self.assertRaisesRegex(ValueError,'source_identity_not_unique'):self.build(source=source)
    def test_revision_and_integrity_mismatch_are_rejected(self):
        source=copy.deepcopy(self.source);source['source_revision']='b'*40
        with self.assertRaisesRegex(ValueError,'invalid_fresh_source'):self.build(source=source)
        with self.assertRaisesRegex(ValueError,'invalid_revision'):self.build(revision='invalid')
        source=copy.deepcopy(self.source);source['records_sha256']='0'*64
        with self.assertRaisesRegex(ValueError,'invalid_fresh_source'):self.build(source=source)
    def test_failed_census_is_not_accepted(self):
        source=copy.deepcopy(self.source);source['enumeration_status']='failed'
        with self.assertRaisesRegex(ValueError,'invalid_fresh_source'):self.build(source=source)

if __name__=='__main__':unittest.main()
