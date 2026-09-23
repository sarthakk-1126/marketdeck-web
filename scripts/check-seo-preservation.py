"""Compare protected production content with the fixed approved base commit."""
import subprocess,json,re,hashlib
from pathlib import Path
BASE='556ecc6e9ad02ae777d3c9746faf874f22658db8'
def old(path):return subprocess.check_output(['git','show',BASE+':'+path])
paths=subprocess.check_output(['git','ls-tree','-r','--name-only',BASE],text=True).splitlines()
protected=[p for p in paths if p.startswith(('public/assets/products/','public/assets/earth','content/issues/','public/intelligence/issues/agentic-trading-frontier-2026/')) or p in ['public/home.css','public/home.js','public/experience.js','public/intelligence-shelf-v1.css','public/intelligence-shelf-v1.js','src/index.template.html','src/globe.js','src/earth-shaders.js','public/assets/globe.js','.github/workflows/deploy.yml','package.json','package-lock.json']]
for path in protected:assert old(path)==Path(path).read_bytes(),'Protected content changed: '+path
before=old('public/index.html').decode();after=Path('public/index.html').read_text()
def mask(s):
 start=s.index('<section class="brief-section');end=s.index('    <section id="contact"',start)
 return s[:start]+'[EDITORIAL SHELF]'+s[end:]
assert mask(before)==mask(after),'Homepage changed outside editorial shelf'
bm=json.loads(old('content/briefs.json'));am=json.loads(Path('content/briefs.json').read_text());assert bm['issues']==am['issues'],'Magazine manifest changed'
for path in ['public/intelligence/notes/business-before-the-stock/index.html','public/intelligence/notes/a-chart-is-a-question/index.html','public/intelligence/notes/five-research-lenses/index.html']:assert Path(path).exists()
print(json.dumps({'protectedFiles':len(protected),'homepageOutsideShelf':'identical','magazineManifest':'identical','status':'PASS'}))
