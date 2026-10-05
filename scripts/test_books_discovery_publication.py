import copy,unittest
from books_seo_publication import candidate,URLS,HUB,digest,encoded,order
from editorial_discovery_publication import candidate as editorial_candidate,IDENTITIES
REV='a'*40
TIME='2026-10-05T00:00:00Z'
def row(url,route,family,identity=None,producer='stockproof'):
 return dict(canonical_url=url,declared_canonical=url,repository=producer,route_name=route,page_family=family,public_record_identifier=identity,classification='A',sitemap_eligible=True,content_eligibility_status='eligible',expected_http_status=200,intended_indexing_policy='index',robots_policy='index_follow',enumeration_source={'source_revision':REV})
def envelope(rows,producer='stockproof'):
 rows=sorted(rows,key=order)
 return dict(producer=producer,enumeration_status='complete',source_revision=REV,records=rows,records_sha256=digest(rows),record_count=len(rows),source_snapshots=[dict(name='source registry',version=REV)])
def bookrows():
 rows=[]
 for u in URLS:
  if u==HUB:route,family='screener:learning_books','SP-17 learning_books'
  elif u.startswith(HUB):route,family='screener:learning_book','SP-17 learning_book_guide'
  elif '/methods/' in u:route,family='screener:learning_method','SP-17 learning_methods'
  elif '/paths/' in u:route,family='screener:learning_path','SP-17 learning_paths'
  else:route,family='screener:learning_comparison','SP-17 learning_compare'
  rows.append(row(u,route,family,u.rstrip('/').split('/')[-1]))
 return rows
class PublicationTests(unittest.TestCase):
 def setUp(self):
  self.base=envelope([row('https://marketdeck.in/screener/portfolio-analysis/','screener:portfolio_analysis_landing','SP-01 product_landing')]);self.source=envelope(bookrows())
 def test_real_family_names_admit_exactly_38_and_preserve_unrelated(self):
  result=candidate(self.base,self.source,REV,TIME);self.assertEqual(result['record_count'],39)
  self.assertEqual(encoded([r for r in result['records'] if r['canonical_url'] not in URLS]),encoded(self.base['records']))
 def test_wrong_generic_family_rejected(self):
  rows=bookrows();rows[0]['page_family']='SP-17 learning_topic_guide'
  with self.assertRaisesRegex(ValueError,'unexpected_route_identity'):candidate(self.base,envelope(rows),REV,TIME)
 def test_missing_duplicate_private_and_stale_records_rejected(self):
  mutations=[lambda rows:rows.pop(),lambda rows:rows.append(copy.deepcopy(rows[0])),lambda rows:rows[0].update(robots_policy='noindex_follow'),lambda rows:rows[0]['enumeration_source'].update(source_revision='b'*40)]
  for mutate in mutations:
   rows=bookrows();mutate(rows)
   with self.subTest(mutate=mutate),self.assertRaises(ValueError):candidate(self.base,envelope(rows),REV,TIME)
 def test_editorial_exact_delta_and_extra_source_rows_ignored(self):
  base=envelope([row('https://marketdeck.in/','web:home','WEB-01 home',producer='marketdeck-web')],'marketdeck-web')
  rows=[row(u,*identity,producer='marketdeck-web') for u,identity in IDENTITIES.items()]
  rows.append(row('https://marketdeck.in/unreviewed/','web:other','WEB-99 other',producer='marketdeck-web'))
  result=editorial_candidate(base,envelope(rows,'marketdeck-web'),REV,TIME)
  self.assertEqual(result['record_count'],4);self.assertNotIn('https://marketdeck.in/unreviewed/',[r['canonical_url'] for r in result['records']])
  rows[0]['sitemap_eligible']=False
  with self.assertRaises(ValueError):editorial_candidate(base,envelope(rows,'marketdeck-web'),REV,TIME)
if __name__=='__main__':unittest.main()
