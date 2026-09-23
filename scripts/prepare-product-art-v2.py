"""Prepare MarketDeck's editorial product artwork from reviewed original PNGs.
Usage: python scripts/prepare-product-art-v2.py ORIGINAL_DIRECTORY [--output DIRECTORY]
Requires Pillow 12.3.0. No network, generation calls, deployment or source-code edits.
"""
from __future__ import annotations
import argparse, hashlib, json
from pathlib import Path
from PIL import Image, ImageOps, ImageFilter

IDS=('stockproof','charting','fno','commentary','crypto')
TASKS=('c9d94c93-2f99-432b-bed7-26c3a47de591','864e1da7-c63a-4d42-bc17-54ed72208c94','23333671-267c-4f94-a3b4-2c9cebde5f78','8071caaa-e62b-4fff-bd8a-b4a5226394ee','684cb2ec-8a04-46c4-9713-83a6c1f3109c')


def stage(image: Image.Image, size: tuple[int,int], fraction: float) -> Image.Image:
    """Extend photographic edge tones around an unwarped, centrally framed scene.
    The safe central band is intended for the site's shallow desktop card crop.
    No figures, text, objects or market data are synthesized by this operation.
    """
    w,h=size
    scene=ImageOps.contain(image,(int(w*.99),int(h*fraction)),Image.Resampling.LANCZOS)
    sw,sh=scene.size; x=(w-sw)//2;y=(h-sh)//2
    def column(left: bool) -> Image.Image:
        box=(0,0,12,sh) if left else (sw-12,0,sw,sh)
        edge=scene.crop(box).resize((1,sh),Image.Resampling.BOX)
        col=Image.new('RGB',(1,h));col.paste(edge,(0,y))
        if y: col.paste(edge.getpixel((0,0)),(0,0,1,y))
        col.paste(edge.getpixel((0,sh-1)),(0,y+sh,1,h))
        return col.resize((w,h))
    gradient=Image.linear_gradient('L').rotate(90).resize((w,h))
    background=Image.composite(column(False),column(True),gradient)
    mask=Image.new('L',(sw,sh),0)
    inset=max(4,round(w*.012))
    mask.paste(255,(inset,inset,sw-inset,sh-inset))
    mask=mask.filter(ImageFilter.GaussianBlur(inset/2))
    background.paste(scene,(x,y),mask)
    return background


def main() -> None:
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('originals',type=Path)
    parser.add_argument('--output',type=Path,default=Path('public/assets/products/editorial-v2'))
    args=parser.parse_args();args.output.mkdir(parents=True,exist_ok=True)
    manifest={'edition':'editorial-v2','createdAt':'2026-09-23','purpose':'Original conceptual product illustrations; not real market data or interface screenshots.','files':{}}
    for name,task in zip(IDS,TASKS):
        original=args.originals/f'{name}.png'
        raw=original.read_bytes()
        with Image.open(original) as opened:
            opened.load();image=ImageOps.exif_transpose(opened).convert('RGB')
        assert image.width>=1400 and image.height>=800, f'Insufficient source resolution: {name}'
        full=ImageOps.fit(image,(1400,800),Image.Resampling.LANCZOS) if image.width/image.height<2 else stage(image,(1400,800),.94)
        retina=stage(image,(1040,580),.68)
        small=retina.resize((520,290),Image.Resampling.LANCZOS)
        for suffix,img in [('',full),('-small',small),('-small@2x',retina)]:
            file=args.output/f'{name}{suffix}.webp'
            img.save(file,'WEBP',quality=93,method=6)
            limit=160000 if not suffix else 100000 if suffix.endswith('@2x') else 35000
            assert file.stat().st_size<=limit, f'Asset budget exceeded: {file}'
            manifest['files'][file.name]={'size':list(img.size),'bytes':file.stat().st_size,'sha256':hashlib.sha256(file.read_bytes()).hexdigest(),'sourceSHA256':hashlib.sha256(raw).hexdigest(),'generationTask':task}
    manifest['totalBytes']=sum(x['bytes'] for x in manifest['files'].values())
    (args.output/'asset-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    print(json.dumps({'images':len(manifest['files']),'bytes':manifest['totalBytes']},indent=2))

if __name__=='__main__': main()
