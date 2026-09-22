"""Build self-hosted globe maps from licensed sources; see docs/GLOBE_POLISH.md.

python scripts/prepare-earth.py <source-directory>
Sources: day.jpg, clouds.jpg, specular.tif, normal.tif. Night maps are retained.
"""
from pathlib import Path
import sys
from PIL import Image

source = Path(sys.argv[1])
output = Path(__file__).resolve().parents[1] / 'public/assets/earth'
day = Image.open(source / 'day.jpg').convert('RGB')
cloud = Image.open(source / 'clouds.jpg').convert('L')
water = Image.open(source / 'specular.tif').convert('L')
for tier, width in [('4k', 4096), ('2k', 2048)]:
    size = (width, width // 2)
    day.resize(size, Image.Resampling.LANCZOS).save(output / f'day-{tier}.webp', quality=92, method=6)
    coverage = cloud.resize(size, Image.Resampling.LANCZOS)
    ocean = water.resize(size, Image.Resampling.LANCZOS)
    # Two unrelated scalar maps share a fetch/file. Keep this texture in linear space.
    packed = Image.merge('RGB', (coverage, ocean, Image.new('L', size)))
    packed.save(output / f'cloud-ocean-{tier}.webp', quality=78, method=6)
Image.open(source / 'normal.tif').convert('RGB').save(output / 'normal.webp', lossless=True, method=6)
for path in output.glob('*.webp'):
    print(path.name, path.stat().st_size)
