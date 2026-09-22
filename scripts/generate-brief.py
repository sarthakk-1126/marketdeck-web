"""Editorial-time generator. python scripts/generate-brief.py [issue-id]"""
import json, sys, os, shutil, subprocess
from pathlib import Path
from html import escape
from reportlab.pdfgen.canvas import Canvas
from reportlab.lib.colors import HexColor
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from pypdf import PdfReader
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
if len(sys.argv)>1 and sys.argv[1]=='agentic-trading-frontier-02':
    subprocess.run([sys.executable,str(ROOT/'scripts/prepare-agentic-magazine.py')],check=True)
    raise SystemExit(0)
manifest=json.loads((ROOT/'content/briefs.json').read_text(encoding='utf-8'))
issue=next(i for i in manifest['issues'] if i['id']==(sys.argv[1] if len(sys.argv)>1 else 'research-foundations-01'))
content=json.loads((ROOT/issue['source']).read_text(encoding='utf-8'))
out=ROOT/issue['assets'];out.mkdir(parents=True,exist_ok=True)
target=out/'marketdeck-brief.pdf'
c=Canvas(str(target),pagesize=(595.28,841.89),pageCompression=1)
c.setTitle('The MarketDeck Brief - '+issue['title']+' - '+issue['publicationStatus'].upper())
c.setAuthor('MarketDeck')
sources={s['id']:s for s in content['sources']}
for index,page in enumerate(content['pages']):
    cover=index==0
    bg='#080c12' if cover else '#f4f2ed'; fg='#edf1f6' if cover else '#15202c'; muted='#b5c0cc' if cover else '#455463'
    c.setFillColor(HexColor(bg));c.rect(0,0,595.28,841.89,fill=1,stroke=0)
    c.setFillColor(HexColor('#3997f2'));c.rect(40,792,29,3,fill=1,stroke=0)
    c.setFillColor(HexColor(muted));c.setFont('Helvetica',8);c.drawString(80,791,page['kicker'])
    c.setFont('Helvetica',7.5);c.drawRightString(554,791,'EDITORIAL DRAFT')
    y=760
    def para(text,size=11,leading=16,color=fg,font='Helvetica',space=10):
        global y
        p=Paragraph(text,ParagraphStyle('p',fontName=font,fontSize=size,leading=leading,textColor=HexColor(color),spaceAfter=space))
        _,h=p.wrap(515,800)
        if y-h<58:raise ValueError(f'Page {index+1} overflow: {text[:60]}')
        p.drawOn(c,40,y-h);y-=h+space
    para(escape(page['title']),32 if cover else 29,36 if cover else 33,font='Helvetica-Bold',space=17)
    para(escape(page['intro']),13,19,color=muted,space=22)
    if cover:
        c.saveState()
        crop=c.beginPath();crop.rect(40,y-155,515,155);c.clipPath(crop,stroke=0)
        c.drawImage(str(ROOT/'public/assets/india-earth-small.webp'),40,y-240,width=515,height=322,mask='auto')
        c.restoreState()
        y-=179
    for section in page['sections']:
        para(escape(section['title']),12,16,font='Helvetica-Bold',space=7)
        if 'text' in section:para(escape(section['text']),10.5 if index!=5 else 10,15 if index!=5 else 14,space=14)
        for item in section.get('items',[]):para('&#8226; '+escape(item),10.5 if index!=5 else 10,15 if index!=5 else 14,space=6)
    if index==5:
        for sid in page['sourceIds']:
            s=sources[sid]
            para(f'<b>{sid}</b> / <link href="{escape(s["url"])}" color="#225e90">{escape(s["title"])}</link>',8,11,space=3)
    else:
        para('Sources: '+(', '.join(f'<link href="{escape(sources[s]["url"])}">{s}</link>' for s in page['sourceIds']) or 'Original editorial introduction')+'. Reviewed '+issue['sourceReviewedAt']+'.',8,11,color=muted,space=10)
    para(escape(page['callout']),9,13,color=muted,space=0)
    c.setStrokeColor(HexColor('#293846'));c.line(40,43,555,43)
    c.setFillColor(HexColor(muted));c.setFont('Helvetica',8);c.drawString(40,27,'MARKETDECK / RESEARCH FOUNDATIONS / DRAFT');c.drawRightString(555,27,f'{index+1:02d} / {len(content["pages"]):02d}')
    c.showPage()
c.save()
count=len(PdfReader(target).pages)
if count!=issue['pageCount']:raise ValueError(f'Manifest pageCount {issue["pageCount"]} != PDF {count}')
print(f'Created {target}: {count} pages')
poppler=os.environ.get('PDFTOPPM') or shutil.which('pdftoppm')
if not poppler:
    bundled=Path.home()/'.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdftoppm.exe'
    if bundled.exists():poppler=str(bundled)
if not poppler:raise RuntimeError('Set PDFTOPPM to the Poppler pdftoppm executable to regenerate the cover.')
temp=ROOT/'.preview/brief-cover';temp.parent.mkdir(exist_ok=True)
subprocess.run([poppler,'-f','1','-singlefile','-r','90','-png',str(target),str(temp)],check=True)
Image.open(str(temp)+'.png').convert('RGB').resize((420,594),Image.Resampling.LANCZOS).save(out/'cover.webp',quality=88)
print(f'Updated {out / "cover.webp"}')
