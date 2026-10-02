import test from 'node:test';
import assert from 'node:assert/strict';
import {MARKET_QUOTES,createQuotePicker} from '../src/market-quotes.js';

test('the reveal has exactly fifty unique, short quotes with attribution and source links',()=>{
  assert.equal(MARKET_QUOTES.length,50);
  assert.equal(new Set(MARKET_QUOTES.map(q=>q.id)).size,50);
  assert.equal(new Set(MARKET_QUOTES.map(q=>q.text)).size,50);
  for(const q of MARKET_QUOTES){
    assert.ok(q.text.length>15&&q.text.length<=140,q.id);
    assert.ok(q.author&&q.sourceLabel,q.id);
    assert.equal(new URL(q.sourceUrl).protocol,'https:');
    assert.ok(!/[<>]/.test(q.text),q.id);
  }
});

test('every quote gets a turn, and bag boundaries never immediately repeat a quote',()=>{
  for(const random of [()=>0,()=>.999999,Math.random]){
    const pick=createQuotePicker(random);let last=null;
    for(let round=0;round<10;round++){
      const ids=[];
      for(let i=0;i<50;i++){
        const q=pick();assert.notEqual(q.id,last);assert.ok(MARKET_QUOTES.includes(q));
        last=q.id;ids.push(q.id);
      }
      assert.equal(new Set(ids).size,50);
    }
  }
});

test('different shuffle choices produce different first selections',()=>{
  assert.notEqual(createQuotePicker(()=>0)().id,createQuotePicker(()=>.999999)().id);
});
