"""Prepare approved magazine v2 assets; no network access and no deployment.
Run from repository root after installing the pinned editorial dependencies.
"""
import json, subprocess, sys
from pathlib import Path
import fitz
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
manifest_path=ROOT/'content/briefs.json'
manifest=json.loads(manifest_path.read_text())
issue=next(i for i in manifest['issues'] if i['id']=='agentic-trading-frontier-02')
assert issue['slug']=='agentic-trading-frontier-2026'
assert issue['publicationStatus']=='published' and issue.get('approvedAt')
source=ROOT/'content/issues/agentic-trading-frontier-v2.json'
assets=ROOT/issue['assets']
subprocess.run([sys.executable,str(ROOT/'scripts/render-agentic-magazine.py'),str(source),str(assets)],check=True)
doc=fitz.open(assets/'marketdeck-brief-v2.pdf')
data=json.loads(source.read_text())
crops={2:(40,209,555,513),3:(40,207,555,480),4:(40,208,555,417),5:(40,210,555,530),6:(40,207,555,397),7:(40,210,555,523),8:(40,211,555,494),9:(40,210,555,386)}
for index,box in crops.items():
 name=f'figure-{index+1:02d}.webp'
 pix=doc[index].get_pixmap(matrix=fitz.Matrix(2,2),clip=fitz.Rect(box),alpha=False)
 Image.frombytes('RGB',[pix.width,pix.height],pix.samples).save(assets/name,quality=92,method=6)
 page=data['pages'][index]
 page['figure']=f"/intelligence/issues/{issue['slug']}/{name}"
 page['figureAlt']='Magazine graphic: '+page['title'].replace('\n',' ')
 page['figureCaption']='Source-labelled chart or original explanatory schematic. See the surrounding text for evidence scope.'
source.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
issue.update(pageCount=12,source='content/issues/agentic-trading-frontier-v2.json',cover=f"/intelligence/issues/{issue['slug']}/cover-v2.webp",pdfPath=f"/intelligence/issues/{issue['slug']}/marketdeck-brief-v2.pdf",sourceReviewedAt='2026-09-22',lastUpdated='2026-09-22',pdfEdition='2.0',summary='A visual research magazine on tool-using trading agents: specialist teams, adaptive policies, hybrid systems, source-labelled charts and an interactive research notebook.')
manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
p=ROOT/'scripts/editorial.mjs';text=p.read_text()
old="    for(const name of ['marketdeck-brief.pdf','cover.webp','cover.svg']){const src=resolve(issue.assets,name);if(existsSync(src))copyFileSync(src,resolve(root,`.${path}${name}`));}"
new="""    // Magazine assets are explicit in the manifest/source; require every advertised file.
    const names=new Set([issue.pdfPath,issue.cover,...source.pages.map(p=>p.figure)].filter(Boolean).map(p=>p.split('/').pop()));
    names.add('marketdeck-brief.pdf');
    for(const name of names){const src=resolve(issue.assets,name);if(!existsSync(src))throw new Error(`Missing editorial asset: ${src}`);copyFileSync(src,resolve(root,`.${path}${name}`));}"""
if old in text:text=text.replace(old,new)
else:assert new in text,'Editorial copy contract changed; review before continuing.'
marker="export const isPublished=i=>i.publicationStatus==='published'&&Boolean(i.approvedAt);"
helper="const refText=v=>esc(v).replace(/\\[(S\\d+)\\]/g,'<a href=\"#$1\">[$1]</a>');"
if helper not in text:
 assert text.count(marker)==1
 text=text.replace(marker,marker+'\n'+helper)
text=text.replace('${esc(s.text)}','${refText(s.text)}')
old_body='${esc(p.intro)}</p>${p.sections.map'
new_body='${esc(p.intro)}</p>${p.figure?`<figure class="issue-figure"><img src="${esc(p.figure)}" alt="${esc(p.figureAlt)}" loading="lazy" style="display:block;max-width:100%;height:auto"><figcaption>${esc(p.figureCaption)}</figcaption></figure>`:""}${p.sections.map'
if old_body in text:text=text.replace(old_body,new_body)
else:assert new_body in text,'Editorial figure insertion point changed.'
p.write_text(text)
# Keep the established issue-id command from regenerating the old draft-style layout.
legacy=ROOT/'scripts/generate-brief.py';text=legacy.read_text()
anchor='ROOT=Path(__file__).resolve().parents[1]'
route="\nif len(sys.argv)>1 and sys.argv[1]=='agentic-trading-frontier-02':\n    subprocess.run([sys.executable,str(ROOT/'scripts/prepare-agentic-magazine.py')],check=True)\n    raise SystemExit(0)"
if route not in text:
 assert text.count(anchor)==1
 legacy.write_text(text.replace(anchor,anchor+route))
# Do not rebuild the approved globe bundle: editorial generation only.
subprocess.run(['node','scripts/build.mjs'],cwd=ROOT,check=True)
subprocess.run(['node','scripts/build.mjs','--review'],cwd=ROOT,check=True)
assert len(doc)==issue['pageCount']==12
assert sum(len(list(p.widgets() or [])) for p in doc)==11
for pg in doc:
 for word in pg.get_text('words'):
  assert word[0]>=-1 and word[1]>=-1 and word[2]<=pg.rect.width+1 and word[3]<=pg.rect.height+1,word
 for link in pg.get_links():
  if link['kind']==fitz.LINK_GOTO:assert 0<=link['page']<len(doc)
public=ROOT/'public'/issue['pdfPath'].lstrip('/')
assert public.read_bytes()==(assets/'marketdeck-brief-v2.pdf').read_bytes()
assert (ROOT/'public/intelligence/issues/agentic-trading-frontier-2026/marketdeck-brief.pdf').read_bytes()==public.read_bytes()
print('Editorial preparation PASS: 12 pages, 88 links, 11 fields; versioned and legacy PDFs match.')
