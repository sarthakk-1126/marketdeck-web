"""MarketDeck Fieldnotes 03: AI in Indian Finance.
Deterministic 12-page PDF renderer. No network calls or PDF JavaScript.
"""
from __future__ import annotations
import argparse, json, math, re
from pathlib import Path
from html import escape
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph
from reportlab.pdfbase.pdfmetrics import stringWidth
import fitz
from PIL import Image

W,H=595.28,841.89
M=40; CW=W-2*M; GAP=24; COL=(CW-GAP)/2
NAVY='#07101b'; SURFACE='#102032'; INK='#152333'; MUTED='#526373'; BLUE='#2877d4'; ICE='#93c5fd'
PAPER='#f5f5f1'; LINE='#d1dbe4'; WHITE='#eff5fb'; SOFT='#e8eef5'; GREEN='#1f8b72'; AMBER='#b87516'
SANS='Helvetica'; BOLD='Helvetica-Bold'; SERIF='Times-Roman'; ITALIC='Times-Italic'
TOC=[
 ('The value map',3),('Customer service',4),('Fraud and surveillance',5),('Lending and credit',6),
 ('Research, advice and compliance',7),('Operations',8),("India's governance direction",9),
 ('Model risk and human oversight',10),('Practical control checklist',11),('Sources and methodology',12)
]

class Magazine:
 def __init__(self,data,out):
  self.d=data; self.out=out; self.n=len(data['pages']); self.i=0
  out.mkdir(parents=True,exist_ok=True)
  self.path=out/'marketdeck-brief-v1.pdf'
  self.c=canvas.Canvas(str(self.path),pagesize=(W,H),pageCompression=1,invariant=1)
  self.c.setTitle('AI in Indian Finance - Where It Is Actually Creating Value | MarketDeck Brief')
  self.c.setAuthor('MarketDeck')
  self.c.setSubject('Evidence-first research on AI use cases, governance and model risk in Indian finance')
  self.c.setKeywords('MarketDeck, AI, Indian finance, RBI, SEBI, model risk, fintech, September 2026')
  self.c.setViewerPreference('DisplayDocTitle','true')

 def rect(self,x,t,w,h,fill,stroke=None,r=0):
  c=self.c;c.setFillColor(HexColor(fill));c.setStrokeColor(HexColor(stroke or fill));c.setLineWidth(.6)
  if r:c.roundRect(x,H-t-h,w,h,r,fill=1,stroke=bool(stroke))
  else:c.rect(x,H-t-h,w,h,fill=1,stroke=bool(stroke))

 def line(self,x,t,x2,t2,color=LINE,width=.6):
  c=self.c;c.setStrokeColor(HexColor(color));c.setLineWidth(width);c.line(x,H-t,x2,H-t2)

 def text(self,s,x,t,size=10,color=INK,font=SANS,align='left'):
  c=self.c;c.setFillColor(HexColor(color));c.setFont(font,size)
  {'left':c.drawString,'right':c.drawRightString,'center':c.drawCentredString}[align](x,H-t-size*.8,s)

 def p(self,s,x,t,w,size=10.6,lead=None,color=INK,font=SERIF,max_bottom=786):
  s=escape(str(s)).replace('\n','<br/>')
  s=re.sub(r'\[(S\d+)\]',lambda m:f'<link href="#source-{m[1]}" color="{BLUE}">[{m[1]}]</link>',s)
  p=Paragraph(s,ParagraphStyle('p',fontName=font,fontSize=size,leading=lead or size*1.38,textColor=HexColor(color),allowWidows=0,allowOrphans=0))
  _,h=p.wrap(w,900)
  if t+h>max_bottom:raise ValueError(f'Page {self.i}: overflow {t+h:.1f}>{max_bottom}: {s[:80]}')
  p.drawOn(self.c,x,H-t-h);return t+h

 def link(self,label,dest,x,t,w=None,size=7.7,color=BLUE):
  self.text(label,x,t,size,color,BOLD);w=w or stringWidth(label,BOLD,size)
  box=(x,H-t-size-4,x+w,H-t+4)
  if dest.startswith('http'):self.c.linkURL(dest,box,relative=0,thickness=0)
  else:self.c.linkRect('',dest,box,relative=0,thickness=0)

 def start(self,page,dark=False):
  self.i+=1;self.dark=dark
  self.c.bookmarkPage(f'page-{self.i}');self.c.addOutlineEntry(page['title'],f'page-{self.i}',level=0,closed=False)
  self.rect(0,0,W,H,NAVY if dark else PAPER)
  if self.i==1:return
  color=WHITE if dark else INK;mut=ICE if dark else MUTED
  self.text('MarketDeck.',M,28,12,color,BOLD)
  self.text('THE BRIEF / 03',W-M,31,8,mut,SANS,'right')
  self.line(M,53,W-M,53,'#26394d' if dark else LINE)
  self.text(page['kicker'],M,73,8.2,ICE if dark else BLUE,BOLD)
  y=self.p(page['title'],M,96,CW,29,32,color=color,font=BOLD,max_bottom=180)
  self.p(page['intro'],M,y+11,CW,11.2,15,color=mut,font=SANS,max_bottom=208)

 def footer(self):
  if self.i==1:return
  self.line(M,798,W-M,798,LINE)
  self.link('CONTENTS','page-2',M,810)
  self.link('SOURCES','page-12',M+68,810)
  self.link('WEB EDITION','https://marketdeck.in/intelligence/issues/ai-in-indian-finance-2026/',M+133,810)
  if self.i>2:self.link('< PREV',f'page-{self.i-1}',W-M-127,810,size=7.2)
  if self.i<self.n:self.link('NEXT >',f'page-{self.i+1}',W-M-80,810,size=7.2)
  self.text(f'{self.i:02d} / {self.n:02d}',W-M,810,7.8,MUTED,SANS,'right')

 def end(self): self.footer(); self.c.showPage()

 def callout(self,text,t=744,h=40):
  self.rect(M,t,CW,h,SOFT);self.rect(M,t,3,h,BLUE)
  self.p(text,M+13,t+8,CW-26,9.1,12,color=INK,font=SANS,max_bottom=t+h-4)

 def figlabel(self,label,t,sub=None,dark=False):
  self.text(label,M+12 if dark else M,t,7.9,ICE if dark else BLUE,BOLD)
  if sub:self.text(sub,W-M-12 if dark else W-M,t,7.3,'#aec5dd' if dark else MUTED,SANS,'right')

 def box(self,x,t,w,h,label,detail='',dark=False,accent=None):
  self.rect(x,t,w,h,SURFACE if dark else '#ffffff','#29425b' if dark else LINE,r=4)
  if accent:self.rect(x,t,3,h,accent)
  y=self.p(label,x+10,t+8,w-20,10,12,color=WHITE if dark else INK,font=BOLD,max_bottom=t+h)
  if detail:self.p(detail,x+10,y+4,w-20,8.2,10.7,color='#b8cadc' if dark else MUTED,font=SANS,max_bottom=t+h-4)

 def arrow(self,x,t,x2,t2,color=BLUE,width=1):
  self.line(x,t,x2,t2,color,width)
  ang=math.atan2(t2-t,x2-x);a=5
  for d in [-.5,.5]:self.line(x2,t2,x2-a*math.cos(ang+d),t2-a*math.sin(ang+d),color,width)

 def flow_blocks(self,sections,t,bottom=733):
  queue=[]
  for s in sections:
   vals=[('head',s['title'])]
   if s.get('text'):vals.append(('body',s['text']))
   vals += [('bullet',v) for v in s.get('items',[])]
   for kind,txt in vals:
    safe=escape(txt);safe=re.sub(r'\[(S\d+)\]',lambda m:f'<link href="#source-{m[1]}" color="{BLUE}">[{m[1]}]</link>',safe)
    if kind=='bullet':safe='&#8226; '+safe
    p=Paragraph(safe,ParagraphStyle('flow',fontName=BOLD if kind=='head' else SERIF,fontSize=10.9 if kind=='head' else 10.3,leading=13.5 if kind=='head' else 13.6,textColor=HexColor(INK),allowWidows=0,allowOrphans=0))
    queue.append([kind,p,7 if kind=='head' else (6 if kind=='bullet' else 11)])
  available=bottom-t;total=sum(q[1].wrap(COL,900)[1]+q[2] for q in queue)
  if total>available*2+15:raise ValueError(f'Page {self.i}: too much text {total:.1f} > {available*2:.1f}')
  target=min(available,total/2+15)
  for col in range(2):
   x=M+col*(COL+GAP);y=t;limit=bottom if col else t+target
   while queue:
    kind,p,space=queue[0];_,h=p.wrap(COL,900);room=limit-y
    if kind=='head' and room<h+28:break
    if h<=room:
     p.drawOn(self.c,x,H-y-h);y+=h+space;queue.pop(0)
    elif kind in ('body','bullet') and col==0:
     parts=p.split(COL,room)
     if not parts:break
     first=parts[0];_,hh=first.wrap(COL,room);first.drawOn(self.c,x,H-y-hh)
     queue.pop(0)
     for q in reversed(parts[1:]):queue.insert(0,[kind,q,space])
     break
    else:break
  if queue:raise ValueError(f'Page {self.i}: unplaced text')

 def cover(self,p):
  self.text('MarketDeck.',M,39,24,WHITE,BOLD);self.text('FIELDNOTES 03',W-M,49,9,ICE,BOLD,'right')
  self.line(M,79,W-M,79,'#31465e')
  self.text('SEPTEMBER 2026 / EDITION 1.0',M,105,8.5,ICE,BOLD)
  self.text('AI in',M,146,55,WHITE,BOLD);self.text('Indian Finance',M,205,55,ICE,BOLD)
  self.p('Where it is actually creating value',M,276,CW,18,22,color='#cedbea',font=ITALIC,max_bottom=312)
  # central network + five workflow nodes
  cx,cy=370,470
  self.c.setStrokeColor(HexColor('#31567c'));self.c.setLineWidth(.8);self.c.circle(cx,H-cy,104,fill=0,stroke=1)
  labels=[('SERVICE',cx,cy-105),('FRAUD',cx+105,cy-28),('LENDING',cx+65,cy+92),('RESEARCH',cx-65,cy+92),('OPS',cx-105,cy-28)]
  for label,x,t in labels:
   self.line(cx,cy,x,t,'#4e84bd',1);self.c.setFillColor(HexColor('#17395c'));self.c.circle(x,H-t,19,fill=1,stroke=0)
   self.text(label,x,t-4,6.9,ICE,BOLD,'center')
  self.c.setFillColor(HexColor('#245d92'));self.c.circle(cx,H-cy,37,fill=1,stroke=0);self.text('AI',cx,cy-11,28,WHITE,BOLD,'center')
  self.text('THE QUESTION',M,399,8,ICE,BOLD)
  self.p('How much authority should the model have?',M,421,176,16,19,color=WHITE,font=BOLD,max_bottom=486)
  self.p('The higher the consequence of a wrong decision, the stronger the case for provenance, human review and clear accountability.',M,501,182,11,15,color='#b8cadc',font=SANS,max_bottom=582)
  y=670
  for i,(head,sub,n) in enumerate([('VALUE','5 workflow lanes','03'),('EVIDENCE','Regulators + annual reports','09'),('CONTROL','Model risk + oversight','10')]):
   x=M+i*(CW/3);self.line(x,y,x+CW/3-14,y,'#31465e')
   self.text(head,x,y+14,8,ICE,BOLD);self.p(sub,x,y+33,CW/3-20,10.8,14,color=WHITE,font=SANS,max_bottom=752);self.link('READ '+n,f'page-{int(n)}',x,y+72,size=7.5,color=ICE)
  self.text('RESEARCH AND EDUCATION. NOT INVESTMENT ADVICE.',M,809,7.3,'#8ea5bd')
  self.text('12 PAGES / SOURCE-LINKED',W-M,809,7.3,'#8ea5bd',SANS,'right')

 def contents(self,p):
  y=225
  for s in p['sections']:
   y=self.p(s['title'],M,y,COL,11.7,14.5,font=BOLD)+7
   if s.get('text'):y=self.p(s['text'],M,y,COL,10.5,14)+16
   for item in s.get('items',[]):y=self.p('• '+item,M,y,COL,9.9,13,font=SANS)+5
  x=M+COL+GAP
  for j,(title,n) in enumerate(TOC):
   t=218+j*44
   self.line(x,t,x+COL,t,LINE);self.text(f'{n:02d}',x,t+13,12.5,BLUE,BOLD)
   self.p(title,x+35,t+13,COL-35,10.3,13,font=SANS,max_bottom=t+41)
   self.c.linkRect('',f'page-{n}',(x,H-t-42,x+COL,H-t),relative=0,thickness=0)
  self.callout(p['callout'],726,57)

 def value_map(self,p):
  self.figlabel('MAP 01 / WHERE PRIMARY SOURCES SHOW AI AT WORK',211,'NOT A MARKET-SIZE ESTIMATE')
  labels=[('SERVICE','chatbots / routing'),('FRAUD','surveillance / mule detection'),('LENDING','documents / underwriting support'),('RESEARCH','review / compliance / support'),('OPERATIONS','claims / voice / copilots')]
  y=244
  for i,(a,b) in enumerate(labels):
   x=M+(i%3)*171;t=y+(i//3)*86;w=156 if i<3 else 242
   if i>=3:x=M+(i-3)*257
   self.box(x,t,w,66,a,b,accent=[BLUE,GREEN,AMBER,'#6c62c7','#2c7b9e'][i])
  self.line(M+16,407,W-M-16,407,'#9eb0c0',1)
  for x,label in [(M+40,'LOWER CONSEQUENCE'),(W/2,'DECISION SUPPORT'),(W-M-45,'HIGHER CONSEQUENCE')]:self.text(label,x,423,7.4,MUTED,BOLD,'center' if x==W/2 else ('left' if x<M+100 else 'right'))
  self.flow_blocks(p['sections'],465,733);self.callout(p['callout'])

 def service(self,p):
  self.figlabel('CHART 01 / COMPANY-REPORTED SERVICE METRICS',211,'FY2026 · DIFFERENT BUSINESSES / DENOMINATORS')
  cards=[('65%','Bajaj Finance','customer servicing via AI voice/text bots'),('~55%','Bajaj Finserv Health','queries resolved by agentic AI')]
  for i,(n,a,b) in enumerate(cards):
   x=M+i*(COL+GAP);self.rect(x,241,COL,117,'#ffffff',LINE,r=5);self.text(n,x+15,257,34,BLUE,BOLD);self.text(a,x+15,302,10,INK,BOLD);self.p(b,x+15,320,COL-30,9.2,12,color=MUTED,font=SANS,max_bottom=353)
  self.box(M,380,CW,57,'RBI complaint management','Phase I: conversational AI chatbot for complainants. Phase II: more advanced complaint processing.',accent=GREEN)
  self.flow_blocks(p['sections'],467,733);self.callout(p['callout'])

 def fraud(self,p):
  self.figlabel('SCHEMATIC 01 / DETECTION IS NOT ADJUDICATION',211)
  nodes=[('TRANSACTION\nDATA','signals'),('MODEL','score / flag'),('TRIAGE','prioritise'),('REVIEW','context'),('ACTION','bounded outcome')]
  w=90
  for i,(a,b) in enumerate(nodes):
   x=M+i*(w+16);self.box(x,250,w,65,a.replace('\n',' '),b,accent=BLUE if i<2 else (GREEN if i<4 else AMBER))
   if i<4:self.arrow(x+w,282,x+w+15,282)
  self.rect(M,341,CW,64,SOFT);self.text('FALSE POSITIVE COSTS',M+13,355,8,AMBER,BOLD)
  self.p('Blocked payments · delayed access · extra verification · customer distress',M+13,374,CW-26,11,14,color=INK,font=SANS,max_bottom=401)
  self.flow_blocks(p['sections'],443,733);self.callout(p['callout'])

 def lending(self,p):
  self.figlabel('CHART 02 / TWO OPERATING SIGNALS FROM BAJAJ FINANCE',211,'COMPANY-REPORTED · FY2026')
  self.rect(M,240,COL,122,'#ffffff',LINE,r=5);self.text('Rs 5,520 cr',M+15,259,29,BLUE,BOLD);self.p('Conversational-AI-enabled loan disbursals',M+15,303,COL-30,10,13,color=MUTED,font=SANS,max_bottom=352)
  x=M+COL+GAP;self.rect(x,240,COL,122,'#ffffff',LINE,r=5);self.text('69m+',x+15,259,31,BLUE,BOLD);self.p('Application documents processed using Vision AI',x+15,303,COL-30,10,13,color=MUTED,font=SANS,max_bottom=352)
  self.line(M,397,W-M,397,LINE)
  self.text('DOCUMENT PROCESSING',M,413,7.7,GREEN,BOLD);self.text('CREDIT JUDGMENT',W-M,413,7.7,AMBER,BOLD,'right')
  self.arrow(M+116,435,W-M-116,435,BLUE,1.2)
  self.text('consequence rises →',W/2,449,8,MUTED,SANS,'center')
  self.flow_blocks(p['sections'],478,733);self.callout(p['callout'])

 def research(self,p):
  self.figlabel('MATRIX 01 / DOCUMENTED SECURITIES-MARKET USE CASES',211,'SEBI PRIMARY SOURCES')
  rows=[('EXCHANGES','surveillance · cyber security · member support · data automation'),
        ('BROKERS','KYC/docs · recommendations · chatbots · AML · order execution'),
        ('MUTUAL FUNDS','customer support · surveillance · cyber security · segmentation')]
  for i,(a,b) in enumerate(rows):
   t=241+i*59;self.rect(M,t,112,46,NAVY if i==0 else '#ffffff',NAVY if i==0 else LINE,r=3)
   self.text(a,M+12,t+16,8.5,WHITE if i==0 else INK,BOLD)
   self.rect(M+123,t,CW-123,46,'#ffffff',LINE,r=3);self.p(b,M+136,t+13,CW-149,9.6,12,color=INK,font=SANS,max_bottom=t+42)
  self.rect(M,430,CW,45,SOFT);self.p('Regulated activity → responsibility for data, output and compliance remains with the regulated person.',M+13,442,CW-26,10.5,14,color=INK,font=BOLD,max_bottom=470)
  self.flow_blocks(p['sections'],503,733);self.callout(p['callout'])

 def operations(self,p):
  self.figlabel('CHART 03 / OPERATING SCALE, NOT INVESTMENT PERFORMANCE',211)
  vals=[('52m','voice-to-data\nconversions'),('69m+','application\ndocuments'),('5,500+','Axis branches\nwith ADI'),('100k+','Axis employees\nsupported')]
  w=(CW-30)/4
  for i,(n,label) in enumerate(vals):
   x=M+i*(w+10);self.rect(x,242,w,109,'#ffffff',LINE,r=5);self.text(n,x+w/2,259,24,BLUE,BOLD,'center')
   self.p(label.replace('\n','<br/>'),x+10,301,w-20,8.8,11,color=MUTED,font=SANS,max_bottom=344)
  self.rect(M,381,CW,49,SOFT);self.text('~67% EXPECTED',M+14,394,15,AMBER,BOLD);self.p('motor-claims TAT reduction through automated invoice processing - an expectation, not an achieved result.',M+143,392,CW-158,9.5,12,color=INK,font=SANS,max_bottom=425)
  self.flow_blocks(p['sections'],461,733);self.callout(p['callout'])

 def governance(self,p):
  self.figlabel('FRAMEWORK 01 / FREE-AI: ENABLE + GOVERN',211,'7 SUTRAS · 6 PILLARS · 26 RECOMMENDATIONS')
  # two halves: enabling / safeguards
  self.rect(M,242,COL,157,'#ffffff',LINE,r=5);self.text('ENABLE',M+15,259,12,GREEN,BOLD)
  for i,s in enumerate(['Infrastructure','Policy','Capacity']):self.box(M+15,286+i*34,COL-30,27,s,'',accent=GREEN)
  x=M+COL+GAP;self.rect(x,242,COL,157,'#ffffff',LINE,r=5);self.text('GOVERN',x+15,259,12,AMBER,BOLD)
  for i,s in enumerate(['Governance','Protection','Assurance']):self.box(x+15,286+i*34,COL-30,27,s,'',accent=AMBER)
  sutras=['Trust','People first','Innovation','Fairness','Accountability','Understandable','Resilience']
  for i,s in enumerate(sutras):
   xx=M+i*(CW/7)+CW/14;self.c.setFillColor(HexColor('#dbe9f8'));self.c.circle(xx,H-433,18,fill=1,stroke=0);self.text(str(i+1),xx,423,9,BLUE,BOLD,'center');self.text(s,xx,456,6.2,MUTED,SANS,'center')
  self.flow_blocks(p['sections'],490,733);self.callout(p['callout'])

 def modelrisk(self,p):
  self.figlabel('LADDER 01 / MATCH CONTROL TO DECISION AUTHORITY',211,'MARKETDECK EDITORIAL FRAME')
  levels=[('1','ASSIST','retrieve · classify · draft',GREEN),('2','RECOMMEND','score · rank · propose',BLUE),('3','ACT IN BOUNDS','pre-set limits · logs · override','#6c62c7'),('4','HIGH IMPACT','strongest review + redress',AMBER)]
  for i,(n,a,b,c) in enumerate(levels):
   x=M+i*(CW/4);t=255-i*12;h=62+i*24;self.rect(x,t,CW/4-8,h,'#ffffff',LINE,r=3);self.rect(x,t,4,h,c);self.text(n,x+13,t+10,12,c,BOLD);self.text(a,x+13,t+30,8,INK,BOLD);self.p(b,x+13,t+44,CW/4-32,7.7,9.8,color=MUTED,font=SANS,max_bottom=t+h-5)
  self.text('MORE AUTHORITY / LOWER REVERSIBILITY →',W/2,388,8,AMBER,BOLD,'center')
  self.flow_blocks(p['sections'],425,733);self.callout(p['callout'])

 def worksheet(self,p):
  self.rect(M,214,CW,116,SOFT,LINE,r=5)
  self.text('CONTROL THE WHOLE DECISION LOOP',M+14,229,10,BLUE,BOLD)
  self.p(p['sections'][1]['text'],M+14,250,CW-28,10.1,13.7,color=INK,font=SANS,max_bottom=310)
  self.p('Use the fields below to make task, data, consequence, ownership, explanation and recovery explicit before deployment.',M+14,293,CW-28,9.2,12.3,color=MUTED,font=SANS,max_bottom=325)
  c=self.c
  def field(name,label,x,t,w,h):
   self.text(label,x,t,8.5,BLUE,BOLD)
   c.acroForm.textfield(name=name,tooltip=label,x=x,y=H-t-18-h,width=w,height=h,fontName='Helvetica',fontSize=9,textColor=HexColor(INK),borderColor=HexColor('#9fb2c4'),fillColor=HexColor('#ffffff'),borderWidth=.65,borderStyle='solid',forceBorder=True,fieldFlags='multiline',maxlen=1200)
  field('use_case','1 / USE CASE + MODEL TASK',M,376,CW,35)
  field('data','2 / DATA SOURCE + FRESHNESS',M,445,COL,34)
  field('impact','3 / WRONG-OUTPUT CONSEQUENCE',M+COL+GAP,445,COL,34)
  field('owner','4 / DECISION OWNER + OVERRIDE',M,512,COL,34)
  field('explanation','5 / REQUIRED EXPLANATION',M+COL+GAP,512,COL,34)
  field('monitoring','6 / MONITORING + ROLLBACK TRIGGER',M,579,CW,34)
  checks=[('bias','Bias / subgroup tests'),('drift','Drift / edge-case tests'),('human','Human review path'),('redress','Customer redress path')]
  for i,(name,label) in enumerate(checks):
   x=M+(i%2)*(COL+GAP);t=661+(i//2)*28
   c.acroForm.checkbox(name=name,tooltip=label,x=x,y=H-t-11,size=11,buttonStyle='check',borderWidth=.65,borderColor=HexColor('#7f97ae'),fillColor=HexColor('#ffffff'),textColor=HexColor(BLUE),forceBorder=True)
   self.text(label,x+20,t+1,8.8,INK)
  self.callout(p['callout'],744,40)

 def sources(self,p):
  self.figlabel('PRIMARY SOURCE REGISTER',208,'REGULATORS FIRST · COMPANY METRICS LABELLED')
  columns=[self.d['sources'][:5],self.d['sources'][5:]]
  for col,sources in enumerate(columns):
   x=M+col*(COL+GAP);y=232
   for s in sources:
    self.c.bookmarkHorizontalAbsolute('source-'+s['id'],H-y)
    self.text(s['id'],x,y+1,10.5,BLUE,BOLD)
    pp=Paragraph(f'<link href="{escape(s["url"],quote=True)}" color="{BLUE}">{escape(s["title"])}</link>',ParagraphStyle('ref',fontName=BOLD,fontSize=8.4,leading=10.2,textColor=HexColor(INK)))
    _,hh=pp.wrap(COL-27,90);pp.drawOn(self.c,x+27,H-y-hh);y+=hh+3
    y=self.p(s['publicationDate']+' / '+s['note'],x+27,y,COL-27,7.4,9.3,color=MUTED,font=SANS,max_bottom=667)+11
  self.line(M,681,W-M,681,LINE)
  y=695
  for sec in p['sections']:
   lp=Paragraph(escape(sec['title']),ParagraphStyle('method-head',fontName=BOLD,fontSize=8.2,leading=10,textColor=HexColor(INK)))
   rp=Paragraph(escape(sec['text']),ParagraphStyle('method-body',fontName=SANS,fontSize=7.4,leading=9.4,textColor=HexColor(MUTED)))
   _,lh=lp.wrap(145,80);_,rh=rp.wrap(CW-165,80);row=max(lh,rh)
   if y+row>783:raise ValueError('Source methodology footer overflow')
   lp.drawOn(self.c,M,H-y-lh);rp.drawOn(self.c,M+165,H-y-rh);y+=row+8

 def run(self):
  for p in self.d['pages']:
   self.start(p,p['kind']=='cover')
   getattr(self,p['kind'])(p)
   self.end()
  self.c.save()
  doc=fitz.open(self.path)
  if len(doc)!=12:raise RuntimeError(f'Expected 12 pages, got {len(doc)}')
  for i,p in enumerate(doc):
   if len(p.get_text().strip())<150:raise RuntimeError(f'Sparse text on page {i+1}')
   for word in p.get_text('words'):
    if word[0]<-1 or word[1]<-1 or word[2]>p.rect.width+1 or word[3]>p.rect.height+1:raise RuntimeError(f'Out-of-bounds word page {i+1}: {word}')
  nlinks=sum(len(p.get_links()) for p in doc);nfields=sum(len(list(p.widgets() or [])) for p in doc)
  if nlinks<45 or nfields!=10:raise RuntimeError(f'Interactive preflight failed: links={nlinks}, fields={nfields}')
  pix=doc[0].get_pixmap(matrix=fitz.Matrix(1.6,1.6),alpha=False)
  Image.frombytes('RGB',[pix.width,pix.height],pix.samples).save(self.out/'cover-v1.webp',quality=91,method=6)
  (self.out/'marketdeck-brief.pdf').write_bytes(self.path.read_bytes())
  qa={'pages':len(doc),'links':nlinks,'formFields':nfields,'bytes':self.path.stat().st_size,'outlineEntries':len(doc.get_toc()),'pageWords':[len(p.get_text().split()) for p in doc]}
  (self.out/'pdf-qa.json').write_text(json.dumps(qa,indent=2)+'\n')
  print(json.dumps(qa));doc.close()

def main():
 ap=argparse.ArgumentParser();ap.add_argument('source',type=Path);ap.add_argument('output',type=Path);a=ap.parse_args()
 data=json.loads(a.source.read_text(encoding='utf-8'));Magazine(data,a.output).run()
if __name__=='__main__':main()
