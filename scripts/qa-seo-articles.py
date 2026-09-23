"""Read-only article and library QA; static-server mode never changes production."""
from pathlib import Path
import argparse,json,os,subprocess,time
from playwright.sync_api import sync_playwright,expect
p=argparse.ArgumentParser();p.add_argument('--base');p.add_argument('--out',default='.preview/seo');p.add_argument('--axe');p.add_argument('--widths',default='320,390,768,1440');args=p.parse_args()
out=Path(args.out);out.mkdir(parents=True,exist_ok=True)
meta=json.loads(Path('content/articles/metadata.json').read_text());reports=[];axes=[];server=None
if not args.base:
 server=subprocess.Popen(['node','scripts/dev.mjs','--port','4175'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);args.base='http://127.0.0.1:4175';time.sleep(.4)
try:
 with sync_playwright() as pw:
  exe=os.getenv('CHROMIUM_EXECUTABLE','/usr/bin/chromium')
  browser=pw.chromium.launch(**({'executable_path':exe} if Path(exe).exists() else {'channel':'chrome'}),args=['--no-sandbox','--enable-unsafe-swiftshader'])
  for width in map(int,args.widths.split(',')):
   ctx=browser.new_context(viewport={'width':width,'height':1000 if width>700 else 844},reduced_motion='reduce')
   for a in meta:
    page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    r=page.goto(args.base+'/intelligence/notes/'+a['slug']+'/',wait_until='load');assert r.status==200
    page.locator('h1').wait_for();assert page.locator('h1').inner_text()==a['title']
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),(a['slug'],width,'overflow')
    expect(page.locator('.a-body')).to_be_visible();page.locator('.a-figure').scroll_into_view_if_needed()
    page.wait_for_function('Array.from(document.querySelectorAll(".a-figure img,.a-cover img")).every(i=>i.complete&&i.naturalWidth>0)')
    assert page.locator('.a-body').inner_text().split().__len__()>1500
    page.locator('.a-toc a').first.click();assert page.url.endswith('#'+page.locator('.a-toc a').first.get_attribute('href').lstrip('#'))
    page.locator('.a-cite').first.click();assert '#source-S' in page.url
    assert page.locator('script[type="application/ld+json"]').count()==1
    page.locator('.a-related').scroll_into_view_if_needed();assert page.locator('.a-related a').count()==3
    if args.axe and width in (390,1440):
     page.add_script_tag(path=args.axe)
     result=page.evaluate('async()=>await axe.run(document,{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21aa"]}})')
     violations=[{'id':v['id'],'impact':v['impact'],'nodes':[n['target'] for n in v['nodes']]} for v in result['violations']]
     axes.append({'slug':a['slug'],'width':width,'violations':violations});assert not violations,(a['slug'],width,violations)
    if width in (390,1440):
     page.evaluate('window.scrollTo({top:0,behavior:"instant"})');page.wait_for_timeout(80)
     page.screenshot(path=str(out/f'{a["slug"]}-{width}.png'),full_page=False)
     if a['slug'] in ('iv-rank-vs-iv-percentile-nifty-options','crypto-fundamentals-fees-revenue-token-value','a-chart-is-a-question'):
      page.locator('.a-figure').screenshot(path=str(out/f'figure-{a["slug"]}-{width}.png'))
    assert not errors,errors;reports.append({'slug':a['slug'],'width':width,'status':'PASS','articleWords':len(page.locator('.a-body').inner_text().split()),'pageErrors':errors});page.close()
   page=ctx.new_page();r=page.goto(args.base+'/intelligence/',wait_until='load');assert r.status==200
   expect(page.locator('[data-intel-entry]:visible')).to_have_count(8)
   for topic in ['ai-quant','equities','fno','markets','india','crypto','research-craft']:
    page.locator('[data-intel-library] [data-intel-topic="'+topic+'"]').click();assert page.locator('[data-intel-entry]:visible').count()>0
   page.locator('[data-intel-library] [data-intel-topic="all"]').click()
   page.locator('[data-intel-search]').fill('IV rank');expect(page.locator('[data-intel-entry]:visible')).to_have_count(1)
   page.locator('[data-intel-reset]').click();expect(page.locator('[data-intel-entry]:visible')).to_have_count(8)
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
   if width in (390,1440):page.screenshot(path=str(out/f'library-{width}.png'),full_page=True)
   ctx.close()
  ctx=browser.new_context(viewport={'width':390,'height':844},java_script_enabled=False)
  page=ctx.new_page();page.goto(args.base+'/intelligence/notes/a-chart-is-a-question/',wait_until='load');assert len(page.locator('.a-body').inner_text().split())>1500
  page.goto(args.base+'/intelligence/',wait_until='load');expect(page.locator('[data-intel-entry]:visible')).to_have_count(8)
  ctx.close();browser.close()
 result={'articleChecks':reports,'accessibility':axes,'noJavaScript':'PASS','libraryFilters':'all seven topics PASS','publicationScope':'HTML articles; existing magazine preserved'}
 (out/'qa-report.json').write_text(json.dumps(result,indent=2));print(json.dumps({'articleChecks':len(reports),'accessibilityScans':len(axes),'status':'PASS'}))
finally:
 if server:server.terminate();server.wait(timeout=5)
