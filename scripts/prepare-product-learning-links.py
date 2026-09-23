"""Isolated product learning-link release preparation. No data, auth or application writes."""
from pathlib import Path
import os,subprocess,json,re
from django.template import Engine,Context
repo=os.environ['GITHUB_REPOSITORY'].split('/')[-1]
config={
 'stockproof':('screener/templates/screener/home.html','screener/templates/screener/_intelligence_links.html','screener/_intelligence_links.html','sp-section','/screener/','equities','Understand the figures before using a screen.','Equities learning path','business-before-the-stock','How to screen Indian stocks','pe-ratio-vs-earnings-yield','P/E versus earnings yield'),
 'charting-v1':('accounts/templates/accounts/home.html','accounts/templates/accounts/_intelligence_links.html','accounts/_intelligence_links.html','workspace-footer','/charts/','technical-analysis','Read the chart with a clear question, timeframe and context.','Technical Analysis learning path','a-chart-is-a-question','How to read stock charts','support-vs-resistance-stock-charts','Support versus resistance'),
 'fo-analytics-v1':('templates/home.html','templates/_intelligence_links.html','_intelligence_links.html','home-shell','/futures-and-options/','futures-options','Understand contract terms, premium loss and expiry risk before interpreting analytics.','Futures & Options learning path','call-option-vs-put-option-india','Calls versus puts','iv-rank-vs-iv-percentile-nifty-options','IV rank versus IV percentile')
}
template,fragment,include,wrapper,path,hub,intro,label,a,at,b,bt=config[repo]
base=os.environ['LEARNING_BASE_SHA']
assert subprocess.check_output(['git','rev-parse','origin/master'],text=True).strip()==base,'Production moved; rebase before release'
p=Path(template);before=p.read_bytes();text=before.decode();assert 'md-learning-links' not in text and include not in text
start=re.search(r'{%\s*block content\s*%}',text);assert start
end=text.index('{% endblock %}',start.end())
marker='{% include "'+include+'" %}\n'
p.write_text(text[:end]+marker+text[end:])
from html import escape
frag=f'''<section class="{wrapper}" id="md-learning-links" aria-label="Related learning guides">
  <details>
    <summary>Learn with MarketDeck Intelligence</summary>
    <p>{escape(intro)}</p>
    <p><a href="https://marketdeck.in/intelligence/{hub}/">{escape(label)}</a></p>
    <p><a href="https://marketdeck.in/intelligence/notes/{a}/">{escape(at)}</a></p>
    <p><a href="https://marketdeck.in/intelligence/notes/{b}/">{escape(bt)}</a></p>
  </details>
</section>
'''
Path(fragment).write_text(frag)
assert p.read_text().replace(marker,'',1)==text,'Homepage outside include changed'
Engine(libraries={'static':'django.templatetags.static'}).from_string(p.read_text())
engine=Engine(dirs=[str(Path(fragment).parent.parent if '/' in include else Path(fragment).parent)])
rendered=engine.from_string(marker).render(Context())
assert 'md-learning-links' in rendered and rendered.count('href=')==3
paths=subprocess.check_output(['git','ls-tree','-r','--name-only',base],text=True).splitlines()
for old in paths:
 if old==template:continue
 expected=subprocess.check_output(['git','show',base+':'+old]);assert Path(old).read_bytes()==expected,'Unrelated file changed: '+old
out=Path('.preview/learning-links');out.mkdir(parents=True,exist_ok=True)
(out/'fragment.html').write_text(rendered)
report={'repo':repo,'base':base,'template':template,'fragment':fragment,'include':include,'route':path,'protectedFiles':len(paths)-1,'unchangedHomepageOutsideInclude':True,'djangoTemplateSyntax':'PASS','djangoIncludeRender':'PASS','scope':'Template-only release. Full application test suite is not rerun; every existing code/config/asset file is byte-preserved.'}
(out/'preservation.json').write_text(json.dumps(report,indent=2))
from playwright.sync_api import sync_playwright
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True)
 results=[]
 for width in [320,390,768,1440,1920]:
  context=browser.new_context(viewport={'width':width,'height':900},reduced_motion='reduce')
  page=context.new_page();response=page.goto('https://marketdeck.in'+path,wait_until='networkidle',timeout=60000);assert response.status==200
  assert page.locator('main').count()==1
  original=page.evaluate("[...document.querySelectorAll('h1,body')].map(e=>[getComputedStyle(e).fontFamily,getComputedStyle(e).color])")
  page.locator('main').evaluate('(el,html)=>el.insertAdjacentHTML("beforeend",html)',rendered)
  box=page.locator('#md-learning-links');box.scroll_into_view_if_needed();box.locator('summary').focus();page.keyboard.press('Enter');assert box.locator('details').get_attribute('open') is not None
  assert page.evaluate("[...document.querySelectorAll('h1,body')].map(e=>[getComputedStyle(e).fontFamily,getComputedStyle(e).color])")==original
  bounds=box.bounding_box();assert bounds['x']>=-1 and bounds['x']+bounds['width']<=width+1
  page.add_script_tag(path='/tmp/learning-qa/node_modules/axe-core/axe.min.js')
  violations=page.evaluate("async()=> (await axe.run(document.querySelector('#md-learning-links'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}})).violations")
  results.append({'width':width,'status':response.status,'violations':violations,'originalFontAndColor':'unchanged','preview':'isolated addition to live HTML; not a production mutation'})
  if width in [390,1440]:page.screenshot(path=str(out/f'{repo}-{width}.png'))
  context.close()
 browser.close()
(out/'browser-results.json').write_text(json.dumps(results,indent=2));assert not any(x['violations'] for x in results),results
check=Path('scripts/check_intelligence_links.py');check.parent.mkdir(exist_ok=True)
check.write_text('from pathlib import Path\nimport unittest\nclass LearningLinks(unittest.TestCase):\n def test_published_fragment_and_include(self):\n  source=Path('+repr(template)+').read_text()\n  fragment=Path('+repr(fragment)+').read_text()\n  self.assertEqual(source.count('+repr(marker.strip())+'),1)\n  self.assertEqual(fragment.count("href="),3)\n  self.assertIn("<summary>",fragment)\n  self.assertNotIn("<script",fragment)\n  self.assertNotIn("<style",fragment)\n  self.assertNotIn("<form",fragment)\n  self.assertIn('+repr('https://marketdeck.in/intelligence/'+hub+'/')+',fragment)\nif __name__=="__main__":unittest.main()\n')
(out/'changed-files.json').write_text(json.dumps([template,fragment,str(check)]))
print(json.dumps({'status':'PASS',**report,'viewportChecks':len(results),'newLinkCount':3}))
