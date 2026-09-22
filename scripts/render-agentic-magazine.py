"""MarketDeck Fieldnotes 02: deterministic, interactive magazine renderer.
Usage: python scripts/render-agentic-magazine.py source.json output-directory
The PDF has no JavaScript or network submission actions. Assets are vector-first.
"""
from __future__ import annotations
import argparse, json, math, re
from pathlib import Path
from html import escape
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, Color
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph
from reportlab.pdfbase.pdfmetrics import stringWidth
import fitz
from PIL import Image

W,H=595.28,841.89
M=40; CW=W-2*M; GAP=24; COL=(CW-GAP)/2
NAVY='#080c12'; SURFACE='#101b2a'; INK='#152333'; MUTED='#526373'; BLUE='#286fca'; ICE='#91bff8'; PAPER='#f5f5f1'; LINE='#d3dce4'; WHITE='#edf3fa'; SOFT='#e8eef5'
SANS='Helvetica'; BOLD='Helvetica-Bold'; SERIF='Times-Roman'; ITALIC='Times-Italic'
TOC=[('The 2026 research map',3),('Specialist teams',4),('Self-evolving policies',5),('The hybrid pattern',6),('Benchmark reality',7),('Production evidence',8),('Execution and exits',9),('Trustworthy autonomy',10),('Your interactive notebook',11),('Sources and methodology',12)]
class Magazine:
 def __init__(self, data:dict, out:Path):
  self.d=data; self.out=out; self.n=len(data['pages']); self.i=0; self.drawn=[]
  out.mkdir(parents=True,exist_ok=True)
  self.path=out/'marketdeck-brief-v2.pdf'
  self.c=canvas.Canvas(str(self.path),pagesize=(W,H),pageCompression=1,invariant=1)
  self.c.setTitle('The agentic trading frontier | MarketDeck Brief | September 2026 | Edition 2.0')
  self.c.setAuthor('MarketDeck'); self.c.setSubject('Source-checked research, vector charts and an interactive research notebook')
  self.c.setKeywords('MarketDeck, agentic trading, AI research, multi-agent systems, September 2026')
  self.c.setViewerPreference('DisplayDocTitle','true')
  self.c.setPageCompression(1)
 def rect(self,x,t,w,h,fill,stroke=None,r=0):
  c=self.c; c.setFillColor(HexColor(fill)); c.setStrokeColor(HexColor(stroke or fill)); c.setLineWidth(.6)
  if r:c.roundRect(x,H-t-h,w,h,r,fill=1,stroke=bool(stroke))
  else:c.rect(x,H-t-h,w,h,fill=1,stroke=bool(stroke))
 def line(self,x,t,x2,t2,color=LINE,width=.6):
  c=self.c;c.setStrokeColor(HexColor(color));c.setLineWidth(width);c.line(x,H-t,x2,H-t2)
 def text(self,s,x,t,size=10,color=INK,font=SANS,align='left'):
  c=self.c;c.setFillColor(HexColor(color));c.setFont(font,size)
  f={'left':c.drawString,'right':c.drawRightString,'center':c.drawCentredString}[align];f(x,H-t-size*.8,s)
 def p(self,s,x,t,w,size=11,lead=None,color=INK,font=SERIF,max_bottom=784):
  s=escape(s).replace('\n','<br/>')
  s=re.sub(r'\[(S\d+)\]',lambda m:f'<link href="#source-{m[1]}" color="{BLUE}">[{m[1]}]</link>',s)
  p=Paragraph(s,ParagraphStyle('text',fontName=font,fontSize=size,leading=lead or size*1.38,textColor=HexColor(color),allowWidows=0,allowOrphans=0))
  _,h=p.wrap(w,900)
  if t+h>max_bottom: raise ValueError(f'Page {self.i}: paragraph overflow {t+h:.1f}>{max_bottom}: {s[:80]}')
  p.drawOn(self.c,x,H-t-h);self.drawn.append((self.i,x,t,w,h));return t+h
 def link(self,label,dest,x,t,w=None,size=8,color=BLUE):
  self.text(label,x,t,size,color,BOLD);w=w or stringWidth(label,BOLD,size)
  rect=(x,H-t-size-4,x+w,H-t+4)
  if dest.startswith('http'):self.c.linkURL(dest,rect,relative=0,thickness=0)
  else:self.c.linkRect('',dest,rect,relative=0,thickness=0)
 def start(self,page,dark=False):
  self.i+=1; self.dark=dark
  self.c.bookmarkPage(f'page-{self.i}');self.c.addOutlineEntry(page['title'],f'page-{self.i}',level=0,closed=False)
  self.rect(0,0,W,H,NAVY if dark else PAPER)
  if self.i==1:return
  color=WHITE if dark else INK;mut=ICE if dark else MUTED
  self.text('MarketDeck.',M,29,12,color,BOLD)
  self.text('THE BRIEF / 02',W-M,32,8,mut,SANS,'right')
  self.line(M,53,W-M,53,'#24364a' if dark else LINE)
  self.text(page['kicker'],M,73,8.4,BLUE if not dark else ICE,BOLD)
  end=self.p(page['title'],M,96,CW,size=33,lead=36,color=color,font=BOLD,max_bottom=180)
  self.p(page['intro'],M,end+14,CW,size=12.1,lead=16.5,color=mut,font=SANS,max_bottom=210)
 def footer(self):
  if self.i==1:return
  self.line(M,799,W-M,799,LINE)
  self.link('CONTENTS','page-2',M,811,size=7.5)
  self.link('SOURCES','page-12',M+68,811,size=7.5)
  self.link('WEB EDITION','https://marketdeck.in/intelligence/issues/agentic-trading-frontier-2026/',M+133,811,size=7.5)
  if self.i>2:self.link('< PREV',f'page-{self.i-1}',W-M-127,811,size=7.3)
  if self.i<self.n:self.link('NEXT >',f'page-{self.i+1}',W-M-80,811,size=7.3)
  self.text(f'{self.i:02d} / {self.n:02d}',W-M,811,8,MUTED,SANS,'right')
 def end(self):self.footer();self.c.showPage()
 def callout(self,text,t=744,h=40):
  self.rect(M,t,CW,h,SOFT); self.rect(M,t,3,h,BLUE)
  self.p(text,M+13,t+9,CW-25,9.3,12,color=INK,font=SANS,max_bottom=t+h-5)
 def blocks(self,sections,t,bottom=735):
  queue=[]
  for s in sections:
   for kind,txt in [('head',s['title']),('body',s.get('text',''))]+[('body',v) for v in s.get('items',[])]:
    if not txt:continue
    txt=escape(txt)
    txt=re.sub(r'\[(S\d+)\]',lambda m:f'<link href="#source-{m[1]}" color="{BLUE}">[{m[1]}]</link>',txt)
    p=Paragraph(txt,ParagraphStyle('flow',fontName=BOLD if kind=='head' else SERIF,fontSize=11 if kind=='head' else 10.75,leading=14 if kind=='head' else 14.1,textColor=HexColor(INK),allowWidows=0,allowOrphans=0))
    queue.append([kind,p,7 if kind=='head' else 12])
  total=sum(v[1].wrap(COL,900)[1]+v[2] for v in queue)
  available=bottom-t
  if total>available*2+12:raise ValueError(f'Page {self.i}: columns need {total:.1f}, have {2*available:.1f}')
  target=min(available,total/2+14)
  for col in range(2):
   x=M+col*(COL+GAP);y=t;limit=bottom if col else t+target
   while queue:
    kind,p,space=queue[0];_,h=p.wrap(COL,900);room=limit-y
    if kind=='head' and room<h+35:break
    if h<=room:
     p.drawOn(self.c,x,H-y-h);self.drawn.append((self.i,x,y,COL,h));y+=h+space;queue.pop(0)
    elif kind=='body' and col==0:
     parts=p.split(COL,room)
     if not parts:break
     first=parts[0];_,hh=first.wrap(COL,room);first.drawOn(self.c,x,H-y-hh)
     queue.pop(0)
     queue[0:0]=[['body',q,space if k==len(parts)-2 else 0] for k,q in enumerate(parts[1:])]
     break
    else:break
  if queue:raise ValueError(f'Page {self.i}: unplaced column content')
 def figlabel(self,label,t,sub=None,dark=False):
  self.text(label,M+13 if dark else M,t,8,ICE if dark else BLUE,BOLD)
  if sub:self.text(sub,W-M-13 if dark else W-M,t,7.5,'#afc2d7' if dark else MUTED,SANS,'right')
 def arrow(self,x,t,x2,t2,color=BLUE,width=1):
  self.line(x,t,x2,t2,color,width)
  ang=math.atan2(t2-t,x2-x); a=5
  for d in [-.5,.5]:self.line(x2,t2,x2-a*math.cos(ang+d),t2-a*math.sin(ang+d),color,width)
 def box(self,x,t,w,h,label,detail='',dark=False):
  self.rect(x,t,w,h,SURFACE if dark else '#ffffff', '#284159' if dark else LINE,r=4)
  end=self.p(label,x+10,t+8,w-20,10.1,12.5,color=WHITE if dark else INK,font=BOLD,max_bottom=t+h)
  if detail:self.p(detail,x+10,end+4,w-20,8.3,11,color='#b1c4d9' if dark else MUTED,font=SANS,max_bottom=t+h-3)
 def cover(self,p):
  c=self.c
  self.text('MarketDeck.',M,39,24,WHITE,BOLD);self.text('FIELDNOTES 02',W-M,49,9,ICE,BOLD,'right')
  self.line(M,79,W-M,79,'#31465e')
  self.text('SEPTEMBER 2026 / EDITION 2.0',M,105,8.5,ICE,BOLD)
  for s,t in [('The agentic',141),('trading',196),('frontier.',251)]:self.text(s,M,t,54,WHITE if s!='frontier.' else ICE,BOLD)
  self.text('Smarter agents. Harder questions.',M,324,16,'#c6d4e3',ITALIC)
  cx,cy,r=353,501,137
  c.saveState();path=c.beginPath();path.circle(cx,H-cy,r);c.clipPath(path,stroke=0)
  for j in range(13):
   a=j/12;rr=r*math.sin(a*math.pi)
   self.line(cx-r,cy-r+2*r*a,cx+r,cy-r+2*r*a,'#1c3756',.6)
   c.setStrokeColor(HexColor('#234a77'));c.setLineWidth(.7)
   c.ellipse(cx-max(4,rr*.7),H-cy-r,cx+max(4,rr*.7),H-cy+r,stroke=1,fill=0)
  c.restoreState();c.setStrokeColor(HexColor('#426b9a'));c.setLineWidth(1);c.circle(cx,H-cy,r,fill=0,stroke=1)
  nodes=[(258,439),(335,404),(429,442),(446,529),(366,598),(281,548),(354,489)]
  for a,b in [(0,1),(1,2),(2,3),(3,4),(4,5),(5,0),(0,6),(1,6),(2,6),(3,6),(4,6),(5,6)]:self.line(*nodes[a],*nodes[b],'#559bea',1.1)
  for k,(x,t) in enumerate(nodes):
   c.setFillColor(HexColor('#1e3e64'));c.circle(x,H-t,9,fill=1,stroke=0)
   c.setFillColor(HexColor('#b3d5ff'));c.circle(x,H-t,3.4,fill=1,stroke=0)
  for label,x,t in [('EVIDENCE',52,420),('POLICY',57,491),('TOOLS',62,562)]:
   self.text(label,x,t,9.5,ICE,BOLD);self.line(x,t+20,218,t+20,'#36547a')
  self.text('ILLUSTRATIVE DECISION NETWORK',353,652,7.4,'#8ba4c0',SANS,'center')
  y=686
  for k,(head,sub,num) in enumerate([('THE STRATEGY','Teams and evolving policies','04'),('THE EVIDENCE','What the experiments show','06'),('THE CONTROL','Bounded, auditable authority','10')]):
   x=M+k*(CW/3);self.line(x,y,x+CW/3-15,y,'#30435a')
   self.text(head,x,y+15,8,ICE,BOLD);self.p(sub,x,y+34,CW/3-23,11.5,15,color=WHITE,font=SANS,max_bottom=766)
   self.link('READ '+num,f'page-{int(num)}',x,y+74,size=8,color=ICE)
  self.text('RESEARCH AND EDUCATION. NOT INVESTMENT ADVICE.',M,809,7.4,'#8b9eb4')
  self.text('12 PAGES / CLICK TO EXPLORE',W-M,809,7.4,'#8b9eb4',SANS,'right')
 def contents(self,p):
  y=226
  for s in p['sections']:
   y=self.p(s['title'],M,y,COL,12,15,font=BOLD)+8
   y=self.p(s['text'],M,y,COL,11,15)+19
  x=M+COL+GAP
  for j,(title,n) in enumerate(TOC):
   t=222+j*43
   self.line(x,t,x+COL,t,LINE)
   self.text(f'{n:02d}',x,t+13,13,BLUE,BOLD)
   self.p(title,x+35,t+13,COL-35,10.5,13,font=SANS,max_bottom=t+41)
   self.c.linkRect('',f'page-{n}',(x,H-t-42,x+COL,H-t),relative=0,thickness=0)
  self.callout(p['callout'],727,56)
 def timeline(self,p):
  entries=[('26 FEB','Task decomposition','Explicit analytical tasks instead of vague analyst roles. [S6]'),('27 MAY','Leakage-aware evaluation','Mask historical identifiers; attribute sources of return. [S4]'),('14 JUL','Hybrid systems','Specialists and deterministic rules in one research design. [S5]'),('15 SEP','Policy refinement','Update the procedure while keeping the backbone fixed. [S1]'),('17 SEP','Adversarial robustness','Test how poisoned evidence propagates through a team. [S3]')]
  self.line(M+71,222,M+71,497,BLUE,1.5)
  for i,(date,title,desc) in enumerate(entries):
   t=220+i*57;self.text(date,M,t+5,9.5,BLUE,BOLD)
   self.c.setFillColor(HexColor(BLUE));self.c.circle(M+71,H-t-10,3,fill=1,stroke=0)
   self.text(title,M+91,t,12,INK,BOLD);self.p(desc,M+91,t+21,CW-91,10.5,14,font=SANS,max_bottom=t+55)
  self.blocks(p['sections'],534);self.callout(p['callout'])
 def architecture(self,p):
  self.figlabel('SCHEMATIC 01 / AN AUDITABLE RESEARCH TEAM',211)
  self.box(M,235,CW,42,'Evidence with an address','Source, instrument, timestamp, units and availability cutoff')
  w=(CW-27)/4
  for i,(a,b) in enumerate([('Retrieve','Find the exact source'),('Calculate','Use validated code'),('Interpret','Compare hypotheses'),('Challenge','Look for contradiction')]):
   x=M+i*(w+9);self.box(x,305,w,63,a,b);self.arrow(x+w/2,277,x+w/2,303)
   self.line(x+w/2,368,x+w/2,388,BLUE)
  self.line(M+w/2,388,W-M-w/2,388,BLUE);self.arrow(W/2,388,W/2,407)
  self.box(M+130,407,CW-260,42,'Coordinator','Synthesize; retain uncertainty')
  self.text('OUTPUT: A RESEARCH RECORD, NOT AN UNRESTRICTED ORDER',W/2,468,8,BLUE,BOLD,'center')
  self.blocks(p['sections'],505);self.callout(p['callout'])
 def policy(self,p):
  self.rect(M,209,CW,207,NAVY,r=5);self.figlabel('SCHEMATIC 02 / A VERSIONED POLICY LOOP',223,dark=True)
  bw=(CW-48)/3
  data=[('1 / Accepted policy','Run one decision batch'),('2 / Trace + outcome','Record what happened'),('3 / Candidate revision','Propose a new procedure'),('6 / Next batch','Use the accepted version'),('5 / Review gate','Accept or reject change'),('4 / Replay + holdout','Evaluate away from tuning')]
  for i,(a,b) in enumerate(data):
   row=i//3;j=i%3;x=M+12+j*(bw+12);t=248+row*91
   self.box(x,t,bw,60,a,b,True)
  for t in [278,369]:
   if t==278:
    for j in range(2):self.arrow(M+12+bw+j*(bw+12),t,M+24+bw+j*(bw+12),t,ICE)
   else:
    for j in range(2):self.arrow(M+24+bw+j*(bw+12),t,M+12+bw+j*(bw+12),t,ICE)
  self.arrow(W-M-12-bw/2,308,W-M-12-bw/2,337,ICE)
  self.blocks(p['sections'],447);self.callout(p['callout'])
 def ablation(self,p):
  f=self.d['figures']['ablation'];self.figlabel('CHART 01 / WHAT CHANGES WHEN A SPECIALIST IS REMOVED?',214)
  plotx=177;pw=350;mn=-35;mx=5;px=lambda v:plotx+(v-mn)/(mx-mn)*pw
  for tick in [-30,-20,-10,0]:
   self.line(px(tick),250,px(tick),442,LINE if tick else '#8498ad',.65 if tick else 1.1)
   self.text(str(tick),px(tick),453,8,MUTED,SANS,'center')
  for i,(name,v) in enumerate(f['rows']):
   t=255+i*37
   self.text(name,M,t+7,9.6,INK,SANS)
   x0=px(min(v,0));width=abs(px(v)-px(0))
   self.rect(x0,t,width,21,BLUE if v<0 else '#7b8fa6')
   label=f'{v:+.2f}';x=px(v)-5 if v<0 else px(v)+5
   self.text(label,x,t+5,8.8,INK,BOLD,'right' if v<0 else 'left')
  self.text('Change in cumulative return vs full system (percentage points)',plotx,479,8.1,MUTED)
  self.p('Reported data: S5, Table 6. Offline TSLA ablation, 2025-08-01 to 2026-05-10. Negative = worse after removal; effects are not additive.',M,498,CW,8.7,11.5,color=MUTED,font=SANS,max_bottom=529)
  self.blocks(p['sections'],548,734);self.callout(p['callout'],747,39)
 def benchmark(self,p):
  self.figlabel('SCHEMATIC 03 / EACH STAGE ANSWERS A DIFFERENT QUESTION',213)
  bw=(CW-27)/4
  for i,(a,b) in enumerate([('Historical','Can it be replayed?'),('Holdout','Does it generalize?'),('Paper','Does the system work?'),('Capital','Separately authorized')]):
   x=M+i*(bw+9);self.box(x,241,bw,78,a,b)
   if i<3:self.arrow(x+bw,280,x+bw+9,280)
  self.rect(M,341,CW,52,SOFT)
  self.p('ATTRIBUTION: market exposure / style exposure / selection / costs',M+13,351,CW-26,11.3,15,color=BLUE,font=BOLD,max_bottom=389)
  self.blocks(p['sections'],423,733);self.callout(p['callout'])
 def leverage(self,p):
  self.rect(M,212,CW,269,NAVY,r=5);self.figlabel('CHART 02 / MEDIAN LEVERAGE BY VOLATILITY SEXTILE',226,dark=True)
  x0=M+37;pw=288;top=267;ph=137
  for v in [0,2,4,6]:
   y=top+ph-(v/6)*ph;self.line(x0,y,x0+pw,y,'#294055',.6);self.text(str(v)+'x',x0-11,y-4,8,ICE,SANS,'right')
  pts=[]
  for i in range(6):
   x=x0+i*pw/5;y=top+ph-5/6*ph;pts.append((x,y));self.text(str(i+1),x,top+ph+12,8,ICE,SANS,'center')
  for a,b in zip(pts,pts[1:]):self.line(*a,*b,'#97c8ff',2)
  for x,y in pts:self.c.setFillColor(HexColor(ICE));self.c.circle(x,H-y,3.7,fill=1,stroke=0)
  self.text('Lower volatility                 Sextile                 Higher volatility',x0,439,7.2,'#b6c8d9')
  self.text('5.0x',M+CW-83,283,33,WHITE,BOLD,'center')
  self.p('Same median in all six groups',M+CW-139,326,113,10,14,color='#c0d2e5',font=SANS,max_bottom=375)
  self.text('5.7x spread in volatility',M+13,461,8,'#b6c8d9')
  self.p('Source: S2, research companion / Figure 4 description. Reported group medians; not a recommended leverage setting.',M,489,CW,8.6,11.5,color=MUTED,font=SANS,max_bottom=520)
  self.blocks(p['sections'],539,735);self.callout(p['callout'])
 def ring(self,x,t,r,pct):
  c=self.c;c.setFillColor(HexColor('#dce5ef'));c.circle(x,H-t,r,fill=1,stroke=0)
  c.setFillColor(HexColor(BLUE));c.wedge(x-r,H-t-r,x+r,H-t+r,startAng=90,extent=-3.6*pct,stroke=0,fill=1)
  c.setFillColor(HexColor(PAPER));c.circle(x,H-t,r-12,fill=1,stroke=0)
  self.text(f'{pct:.1f}%',x,t-11,24,INK,BOLD,'center')
 def capture(self,p):
  self.figlabel('CHART 03 / TWO PERCENTAGES, TWO DENOMINATORS',215)
  self.ring(157,314,67,43.2);self.ring(438,314,67,49.3)
  self.arrow(244,314,350,314,BLUE,1.4)
  self.text('WITHIN THAT GROUP',297,294,7.1,BLUE,BOLD,'center')
  self.p('Of measured positions touched +3% open profit within 24 hours.',M+18,397,208,11,14,font=SANS,max_bottom=442)
  self.p('Of that qualifying subset still closed with a negative return.',M+291,397,208,11,14,font=SANS,max_bottom=442)
  self.p('Source: S2, reported exit aggregates. Different cohorts: the right-hand percentage is conditional on the left-hand group.',M,461,CW,8.6,11.5,color=MUTED,font=SANS,max_bottom=490)
  self.blocks(p['sections'],513,734);self.callout(p['callout'])
 def controls(self,p):
  self.rect(M,215,CW,170,NAVY,r=5);self.figlabel('SCHEMATIC 04 / SEPARATE REASONING FROM AUTHORITY',229,dark=True)
  for x,w,a,b in [(M+12,143,'External evidence','Untrusted, source-labelled'),(M+183,145,'Model + tools','Propose bounded intent'),(M+355,148,'Independent checks','Reject / approve / escalate')]:self.box(x,256,w,62,a,b,True)
  self.arrow(M+155,287,M+181,287,ICE);self.arrow(M+328,287,M+353,287,ICE)
  self.line(M+342,248,M+342,335,ICE,1.2)
  self.p('Reconciled state + explicit limits + incident recovery',M+13,348,CW-26,11.6,15,color=WHITE,font=SANS,max_bottom=376)
  self.blocks(p['sections'],417,733);self.callout(p['callout'])
 def worksheet(self,p):
  self.blocks(p['sections'],219,355)
  c=self.c
  def field(name,label,x,t,w,h):
   self.text(label,x,t,8.9,BLUE,BOLD)
   c.acroForm.textfield(name=name,tooltip=label,x=x,y=H-t-19-h,width=w,height=h,fontName='Helvetica',fontSize=10,textColor=HexColor(INK),borderColor=HexColor('#a7b9cb'),fillColor=HexColor('#ffffff'),borderWidth=.65,borderStyle='solid',forceBorder=True,fieldFlags='multiline',maxlen=1400)
  field('question','RESEARCH QUESTION',M,365,CW,42)
  field('source','DATA / SOURCE / CUTOFF',M,441,COL,40)
  field('baseline','BASELINE / FAILURE CRITERION',M+COL+GAP,441,COL,40)
  field('observations','OBSERVATION - SEPARATE FROM INTERPRETATION',M,515,CW,46)
  field('next_test','NEXT VERIFICATION STEP',M,595,CW,35)
  checks=['Source and time preserved','Untouched comparison set','Costs and missing data noted','Authority limits explicit','Failure cases recorded','Rollback path reviewed']
  for i,label in enumerate(checks):
   x=M+(i%2)*(COL+GAP);t=669+(i//2)*23
   c.acroForm.checkbox(name=f'check_{i+1}',tooltip=label,x=x,y=H-t-11,size=11,buttonStyle='check',borderWidth=.65,borderColor=HexColor('#7f97ae'),fillColor=HexColor('#ffffff'),textColor=HexColor(BLUE),forceBorder=True)
   self.text(label,x+20,t+1,9,INK)
  self.callout(p['callout'],746,40)
 def sources(self,p):
  y=210
  for s in self.d['sources']:
   self.c.bookmarkHorizontalAbsolute('source-'+s['id'],H-y)
   self.text(s['id'],M,y+1,12,BLUE,BOLD)
   x=M+31;w=CW-31
   title=f'{s["title"]}'
   para=Paragraph(f'<link href="{escape(s["url"],quote=True)}" color="{BLUE}">{escape(title)}</link>',ParagraphStyle('ref',fontName=BOLD,fontSize=9.1,leading=11.1,textColor=HexColor(INK)))
   _,h=para.wrap(w,100);para.drawOn(self.c,x,H-y-h)
   y+=h+3
   y=self.p(s['publicationDate']+' / '+s['note'],x,y,w,8.35,10.5,color=MUTED,font=SANS,max_bottom=651)+12
  self.line(M,y,W-M,y,LINE);y+=16
  self.blocks(p['sections'][:2],y,729)
  self.p(p['sections'][2]['text'],M,750,CW,8.5,11,color=MUTED,font=SANS,max_bottom=786)
 def run(self):
  for p in self.d['pages']:
   self.start(p,p['kind']=='cover');getattr(self,p['kind'])(p);self.end()
  self.c.save()
  doc=fitz.open(self.path)
  if len(doc)!=12:raise RuntimeError('Expected 12 magazine pages')
  for i,p in enumerate(doc):
   if len(p.get_text().strip())<180:raise RuntimeError(f'Unexpected sparse text on page {i+1}')
  nlinks=sum(len(p.get_links()) for p in doc);nfields=sum(len(list(p.widgets() or [])) for p in doc)
  if nlinks<50 or nfields!=11:raise RuntimeError(f'Interactive preflight failed: links={nlinks}, fields={nfields}')
  pix=doc[0].get_pixmap(matrix=fitz.Matrix(1.6,1.6),alpha=False)
  image=Image.frombytes('RGB',[pix.width,pix.height],pix.samples)
  image.save(self.out/'cover-v2.webp',quality=91,method=6)
  (self.out/'marketdeck-brief.pdf').write_bytes(self.path.read_bytes())
  qa={'pages':len(doc),'links':nlinks,'formFields':nfields,'bytes':self.path.stat().st_size,'outlineEntries':len(doc.get_toc()),'pageWords':[len(p.get_text().split()) for p in doc]}
  (self.out/'pdf-qa.json').write_text(json.dumps(qa,indent=2)+'\n')
  print(json.dumps(qa));doc.close()

def main():
 ap=argparse.ArgumentParser();ap.add_argument('source',type=Path);ap.add_argument('output',type=Path);a=ap.parse_args()
 data=json.loads(a.source.read_text(encoding='utf-8'));Magazine(data,a.output).run()
if __name__=='__main__':main()
