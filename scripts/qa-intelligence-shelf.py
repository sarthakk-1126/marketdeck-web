"""Read-only browser QA against a temporary static server, or published HTTPS.
Run: python scripts/qa-intelligence-shelf.py --base http://127.0.0.1:4173
Create local fixtures with node tests/shelf-fixtures.mjs; remove public/__shelf-qa
before publishing. --public omits fixture requests. Requires Playwright 1.56.0.
"""
import argparse,json,os,re,time
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
p=argparse.ArgumentParser();p.add_argument('--base',default='http://127.0.0.1:4173');p.add_argument('--out',default='.preview/intel');p.add_argument('--public',action='store_true');args=p.parse_args()
out=Path(args.out);out.mkdir(parents=True,exist_ok=True);results=[]
def load(page,path):
 r=page.goto(args.base+path,wait_until='networkidle');assert r.status==200,(path,r.status)
def visible(root):return root.locator('[data-intel-slide]:visible')
def swipe(page,el,dx,dy=0):
 box=el.bounding_box();x=box['x']+box['width']*.7;y=box['y']+min(box['height']*.4,100)
 cdp=page.context.new_cdp_session(page)
 cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]})
 for n in range(1,7):
  cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x+dx*n/6,'y':y+dy*n/6}]});time.sleep(.025)
 cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});cdp.detach();page.wait_for_timeout(100)
with sync_playwright() as pw:
 exe=os.environ.get('CHROMIUM_EXECUTABLE')
 browser=pw.chromium.launch(**({'executable_path':exe} if exe else {}),args=['--no-sandbox','--enable-unsafe-swiftshader'])
 configs=[(320,800,'reduce'),(390,844,'reduce'),(768,1024,'reduce'),(1024,900,'reduce'),(1440,1000,'reduce'),(1920,1080,'reduce'),(2560,1440,'reduce'),(1280,720,'no-preference')]
 for width,height,motion in configs:
  print('Testing',width,motion,flush=True)
  ctx=browser.new_context(viewport={'width':width,'height':height},device_scale_factor=1,reduced_motion=motion,has_touch=True)
  page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  load(page,'/');root=page.locator('[data-intel-shelf]');root.scroll_into_view_if_needed();page.wait_for_timeout(120)
  expect(root).to_have_class(re.compile('is-enhanced'));expect(visible(root)).to_have_count(1)
  assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1')
  first=visible(root).get_attribute('data-title')
  root.locator('[data-intel-next]').click();expect(visible(root)).not_to_have_attribute('data-title',first)
  assert page.evaluate('document.activeElement.hasAttribute("data-intel-next")')
  root.locator('[data-intel-prev]').click();expect(visible(root)).to_have_attribute('data-title',first)
  root.locator('[data-intel-index="2"]').click();expect(root.locator('[data-intel-index="2"]')).to_have_attribute('aria-pressed','true')
  root.locator('[data-intel-index="2"]').press('ArrowRight');expect(root.locator('[data-intel-index="3"]')).to_be_focused()
  root.locator('[data-intel-index="3"]').press('Home');expect(root.locator('[data-intel-index="0"]')).to_be_focused()
  root.locator('[data-intel-topic="equities"]').click();expect(visible(root)).to_have_attribute('data-topic',re.compile('equities'));expect(root.locator('[data-intel-next]')).to_be_disabled()
  root.locator('[data-intel-topic="all"]').click();root.locator('[data-intel-index="0"]').click()
  root.screenshot(path=str(out/f'shelf-{width}.png'),animations='disabled')
  if width==390:
   stage=visible(root).locator('.intel-cover-stage');stage.scroll_into_view_if_needed();page.wait_for_timeout(120)
   swipe(page,stage,-125);expect(root.locator('[data-intel-index="1"]')).to_have_attribute('aria-pressed','true')
   selected=visible(root).get_attribute('data-title');stage=visible(root).locator('.intel-summary');stage.scroll_into_view_if_needed();swipe(page,stage,10,100);expect(visible(root)).to_have_attribute('data-title',selected)
   root.screenshot(path=str(out/'shelf-note-mobile.png'),animations='disabled')
  load(page,'/intelligence/');lib=page.locator('[data-intel-library]');expect(lib.locator('[data-intel-entry]:visible')).to_have_count(4)
  search=lib.locator('[data-intel-search]');search.fill('zzznomatch');expect(lib.locator('[data-intel-empty]')).to_be_visible()
  lib.locator('[data-intel-reset]').click();expect(search).to_be_focused();expect(lib.locator('[data-intel-entry]:visible')).to_have_count(4)
  lib.locator('[data-intel-kind]').select_option('magazine');expect(lib.locator('[data-intel-entry]:visible')).to_have_count(1)
  lib.locator('[data-intel-reset]').click();search.fill('business');expect(lib.locator('[data-intel-entry]:visible')).to_have_count(1)
  lib.locator('[data-intel-reset]').click()
  assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1')
  if width in (390,1440):
   page.mouse.click(2,2);page.screenshot(path=str(out/f'hub-{width}.png'),full_page=True,animations='disabled')
  load(page,'/intelligence/issues/');lib=page.locator('[data-intel-library]');expect(lib.locator('[data-intel-entry]:visible')).to_have_count(1)
  assert '/intelligence/issues/agentic-trading-frontier-2026/'==lib.locator('h3 a').get_attribute('href')
  assert lib.locator('a[download]').get_attribute('href').endswith('marketdeck-brief-v2.pdf')
  assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1')
  if width in (390,1440):page.screenshot(path=str(out/f'archive-{width}.png'),full_page=True,animations='disabled')
  assert not errors,errors;results.append({'width':width,'motion':motion,'status':'PASS','horizontalOverflow':False,'pageErrors':errors})
  ctx.close()
 ctx=browser.new_context(java_script_enabled=False,viewport={'width':390,'height':844});page=ctx.new_page()
 load(page,'/');expect(page.locator('[data-intel-slide]:visible')).to_have_count(4);expect(page.locator('[data-intel-navigation]')).to_be_hidden()
 load(page,'/intelligence/');expect(page.locator('[data-intel-entry]:visible')).to_have_count(4);expect(page.locator('[data-intel-library-tools]')).to_be_hidden();ctx.close()
 if not args.public:
  ctx=browser.new_context(viewport={'width':1440,'height':1000});page=ctx.new_page()
  for count in (0,1,25):
   load(page,f'/__shelf-qa/{count}.html')
   if count==0:expect(page.locator('[data-intel-navigation]')).to_have_count(0)
   if count==1:expect(page.locator('[data-intel-navigation]')).to_be_hidden()
   if count==25:
    lib=page.locator('[data-intel-library]');expect(lib.locator('[data-intel-entry]:visible')).to_have_count(12)
    lib.locator('[data-intel-more]').click();expect(lib.locator('[data-intel-entry]:visible')).to_have_count(24)
    lib.locator('[data-intel-more]').click();expect(lib.locator('[data-intel-entry]:visible')).to_have_count(25);expect(lib.locator('[data-intel-more]')).to_be_hidden()
    page.locator('[data-intel-index="7"]').click();page.locator('[data-intel-next]').click();expect(page.locator('[data-intel-index="0"]')).to_have_attribute('aria-pressed','true')
    assert 'noindex' in page.locator('meta[name=robots]').get_attribute('content')
  ctx.close()
 browser.close()
(out/'browser-report.json').write_text(json.dumps({'mode':'public HTTPS' if args.public else 'integration HTTP','viewports':results,'noJavaScript':'PASS','fixtures':'not applicable' if args.public else '0/1/25 PASS'},indent=2))
print('PASS: eight viewport/motion cases; arrows, thumbnails, keyboard, touch swipe, vertical scroll, filters, search, no-JS and fixture edge states.')
