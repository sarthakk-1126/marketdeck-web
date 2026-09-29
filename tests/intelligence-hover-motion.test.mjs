import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css=readFileSync('public/intelligence-shelf-v2.css','utf8');
const intelligence=readFileSync('scripts/intelligence.mjs','utf8');
const editorial=readFileSync('scripts/editorial.mjs','utf8');

test('Intelligence covers retain subtle desktop hover motion',()=>{
  assert.match(css,/\.intel-cover:hover/);
  assert.match(css,/translateY\(-7px\).*scale\(1\.018\)/);
  assert.match(css,/\.intel-thumb:hover \.intel-thumb-cover/);
  assert.match(css,/prefers-reduced-motion:no-preference/);
});

test('hover motion stylesheet is cache-busted on generated Intelligence surfaces',()=>{
  assert.match(intelligence,/intelligence-shelf-v2\.css\?v=hover-20260929/);
  assert.match(editorial,/intelligence-shelf-v2\.css\?v=hover-20260929/);
});
