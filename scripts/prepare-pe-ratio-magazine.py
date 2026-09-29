from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import math

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'content/issues/pe-ratio-valuation-india-2026'
OUT.mkdir(parents=True,exist_ok=True)
W,H=1200,675
NAVY=(7,18,36); PANEL=(13,31,58); BLUE=(45,135,255); CYAN=(48,202,255)
WHITE=(244,248,253); MUTED=(165,181,202); LINE=(39,67,103)
FONT_BOLD='C:/Windows/Fonts/arialbd.ttf'; FONT='C:/Windows/Fonts/arial.ttf'

def f(size,bold=False):
    return ImageFont.truetype(FONT_BOLD if bold else FONT,size)
def base(title,kicker):
    im=Image.new('RGB',(W,H),NAVY); d=ImageDraw.Draw(im)
    d.rectangle((0,0,W,7),fill=BLUE)
    d.text((55,42),kicker,font=f(18,True),fill=CYAN)
    d.text((55,78),title,font=f(38,True),fill=WHITE)
    d.text((55,625),'MarketDeck · Evidence-first valuation research',font=f(18),fill=MUTED)
    return im,d
def box(d,xy,fill=PANEL,outline=LINE,r=18,w=2):
    d.rounded_rectangle(xy,radius=r,fill=fill,outline=outline,width=w)
def center(d,xy,text,font,fill=WHITE):
    bb=d.textbbox((0,0),text,font=font); x=(xy[0]+xy[2]-bb[2]+bb[0])/2; y=(xy[1]+xy[3]-bb[3]+bb[1])/2
    d.text((x,y),text,font=font,fill=fill)
def save(im,name):
    im.save(OUT/name,'WEBP',quality=90,method=6)
def figure04():
    im,d=base('What does 12× forward P/E require?','03 / WORKED EXAMPLE')
    cards=[('Forward P/E','12×'),('ROE','18%'),('Required return','12%')]
    x=55
    for label,val in cards:
        box(d,(x,180,x+300,365))
        d.text((x+28,208),label,font=f(22,True),fill=MUTED)
        d.text((x+28,258),val,font=f(58,True),fill=BLUE)
        x+=330
    d.text((80,405),'Reverse the multiple',font=f(22,True),fill=MUTED)
    d.line((80,448,1120,448),fill=LINE,width=3)
    box(d,(260,480,940,590),fill=(9,38,74),outline=BLUE,w=3)
    center(d,(260,480,940,528),'IMPLIED SUSTAINABLE GROWTH',f(21,True),MUTED)
    center(d,(260,518,940,590),'≈ 6.83%',f(52,True),CYAN)
    save(im,'figure-04.webp')

def figure05():
    im,d=base('The growth burden moves with the required return','04 / SENSITIVITY')
    rates=[10,12,14,16]; growth=[3.1,6.8,10.6,14.3]
    left,bottom,right,top=130,555,1125,180
    d.line((left,bottom,right,bottom),fill=LINE,width=2); d.line((left,bottom,left,top),fill=LINE,width=2)
    for yv in [0,5,10,15]:
        y=bottom-int((yv/15)*(bottom-top))
        d.line((left,y,right,y),fill=(26,49,78),width=1)
        d.text((70,y-12),f'{yv}%',font=f(18),fill=MUTED)
    pts=[]
    for i,(r,g) in enumerate(zip(rates,growth)):
        x=left+int(i*(right-left)/3); y=bottom-int((g/15)*(bottom-top)); pts.append((x,y))
        d.text((x-20,bottom+18),f'{r}%',font=f(18,True),fill=WHITE)
    d.line(pts,fill=BLUE,width=6)
    for x,y in pts:
        d.ellipse((x-10,y-10,x+10,y+10),fill=CYAN)
    for (x,y),g in zip(pts,growth):
        d.text((x-25,y-45),f'{g}%',font=f(18,True),fill=WHITE)
    d.text((130,592),'Required return →',font=f(19,True),fill=MUTED)
    save(im,'figure-05.webp')
def figure06():
    im,d=base('Growth is valuable only when returns clear the hurdle','05 / ROE & VALUE CREATION')
    rows=[('ROE > required return','Growth can create value',BLUE),
          ('ROE ≈ required return','Growth is roughly value-neutral',WHITE),
          ('ROE < required return','Growth can destroy value',MUTED)]
    y=180
    for lhs,rhs,color in rows:
        box(d,(75,y,1125,y+118))
        d.text((105,y+30),lhs,font=f(28,True),fill=color)
        d.text((610,y+33),rhs,font=f(26,True),fill=WHITE)
        y+=145
    d.text((75,598),'The quality of growth matters more than the headline growth rate.',font=f(22,True),fill=CYAN)
    save(im,'figure-06.webp')

def figure08():
    im,d=base('Five reasons a low P/E can mislead','07 / LOW-P/E TRAPS')
    items=[
        ('01','Peak-cycle earnings','Current EPS may be above normalized earning power.'),
        ('02','Buyback-driven EPS','Fewer shares can lift EPS without operating growth.'),
        ('03','Leverage','ROE can rise while shareholder risk rises too.'),
        ('04','Intangible accounting','R&D treatment can alter earnings and capital bases.'),
        ('05','Recurring “one-offs”','Adjustments need evidence, not convenience.')
    ]
    y=160
    for num,title,desc in items:
        d.text((60,y),num,font=f(22,True),fill=BLUE)
        d.text((120,y-2),title,font=f(25,True),fill=WHITE)
        d.text((420,y+2),desc,font=f(20),fill=MUTED)
        d.line((60,y+72,1140,y+72),fill=LINE,width=1)
        y+=88
    save(im,'figure-08.webp')

if __name__=='__main__':
    figure04(); figure05(); figure06(); figure08()
    print('Created',', '.join(p.name for p in sorted(OUT.glob('figure-*.webp'))))
