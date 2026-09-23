"""Release boundary: compare against the base approved when this branch was created."""
from pathlib import Path
import subprocess,json
BASE='a3a9f30dbec2d37ae3906fd169e5184e41533d31'
def old(p):return subprocess.check_output(['git','show',BASE+':'+p])
paths=subprocess.check_output(['git','ls-tree','-r','--name-only',BASE],text=True).splitlines()
protected=[p for p in paths if p.startswith(('public/assets/products/','public/assets/earth','content/issues/','public/intelligence/issues/')) or p in ['public/home.css','public/home.js','public/experience.js','public/intelligence-shelf-v1.js','src/index.template.html','src/site-data.json','src/globe.js','src/earth-shaders.js','public/assets/globe.js','.github/workflows/deploy.yml','package.json','package-lock.json','public/robots.txt']]
for p in protected:assert Path(p).read_bytes()==old(p),'Protected content changed: '+p
for p in ['public/intelligence-shelf-v1.css','public/intelligence-article-v1.css']:assert Path(p).read_bytes().startswith(old(p).rstrip()),'Existing CSS modified: '+p
before=old('public/index.html').decode();after=Path('public/index.html').read_text()
def mask(s):
 start=s.index('<section class="brief-section');end=s.index('    <section id="contact"',start)
 return s[:start]+'[EDITORIAL SHELF]'+s[end:]
assert mask(before)==mask(after),'Homepage changed outside shelf'
assert json.loads(old('content/briefs.json'))['issues']==json.loads(Path('content/briefs.json').read_text())['issues']
print(json.dumps({'status':'PASS','protectedFiles':len(protected),'homepageOutsideShelf':'identical','existingCSS':'unchanged prefix','magazinesPDFs':'identical'}))
