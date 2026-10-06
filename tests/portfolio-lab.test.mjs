import test from 'node:test';
import assert from 'node:assert/strict';
import {adjustWeight,setShocks,remix} from '../src/portfolio-lab-allocation.js';
const base=()=>({weights:{a:5000,b:3000,c:2000},cash_bps:0,shocks:{},transfer_mode:'cash',locked:[]});
test('cash mode moves exact basis points and leaves other holdings untouched',()=>{
 const initial=base(),s=adjustWeight(initial,'a',3000);
 assert.deepEqual(s.weights,{a:3000,b:3000,c:2000});assert.equal(s.cash_bps,2000);
 assert.deepEqual(initial,base());assert.equal(adjustWeight(s,'a',4000).cash_bps,1000);
 assert.throws(()=>adjustWeight(s,'b',6000),/more hypothetical cash/);
});
test('redistribution reconciles integer weights with independent reference',()=>{
 const s=base();s.transfer_mode='redistribute';
 const r=adjustWeight(s,'a',6000);assert.deepEqual(r.weights,{a:6000,b:2400,c:1600});assert.equal(r.cash_bps,0);
 const equal={...s,weights:{a:4000,b:3000,c:3000}};
 const odd=adjustWeight(equal,'a',4001);assert.deepEqual(odd.weights,{a:4001,b:3000,c:2999});
});
test('locks cannot be edited or used as hidden funding',()=>{
 const s=base();s.transfer_mode='redistribute';s.locked=['b'];
 assert.throws(()=>adjustWeight(s,'b',1000),/Unlock/);
 assert.deepEqual(adjustWeight(s,'a',6000).weights,{a:6000,b:3000,c:1000});
 assert.throws(()=>adjustWeight(s,'a',8000),/Locked/);
});
test('zero allocations and a single holding do not invent redistribution recipients',()=>{
 const s={...base(),weights:{a:10000,b:0,c:0},transfer_mode:'redistribute'};
 assert.throws(()=>adjustWeight(s,'a',9000),/no other/);
 s.transfer_mode='cash';assert.equal(adjustWeight(s,'a',0).cash_bps,10000);
});
test('many edits conserve allocation and locked rows',()=>{
 let s=base();s.transfer_mode='redistribute';s.locked=['c'];
 for(const value of [2500,5000,1234,6789,4000,0]){
  s=adjustWeight(s,'a',value);assert.equal(Object.values(s.weights).reduce((a,b)=>a+b,0)+s.cash_bps,10000);
  assert.equal(s.weights.c,2000);assert.ok(Object.values(s.weights).every(Number.isInteger));
 }
});
test('shocks affect only chosen known holdings, without mutating the input',()=>{
 const s=base(),r=setShocks(s,['a','c'],-20);assert.deepEqual(r.shocks,{a:'-20',c:'-20'});assert.deepEqual(s.shocks,{});
 assert.throws(()=>setShocks(s,['foreign'],10));assert.throws(()=>setShocks(s,['a'],NaN));assert.throws(()=>setShocks(s,['a'],-101));
});
test('equal and random experiments preserve cash and locked weights exactly',()=>{
 const s=base();s.cash_bps=1000;s.weights.a=4000;s.locked=['c'];
 assert.deepEqual(remix(s,'equal').weights,{a:3500,b:3500,c:2000});
 assert.deepEqual(remix(s,'shuffle',[3,1]).weights,{a:5250,b:1750,c:2000});
 assert.deepEqual(s.weights,{a:4000,b:3000,c:2000});
 assert.equal(remix(s,'shuffle',[3,1]).cash_bps,1000);
});
test('remix includes unlocked zero weights and handles integer remainders',()=>{
 const s={...base(),weights:{a:10000,b:0,c:0}};
 assert.deepEqual(remix(s,'equal').weights,{a:3334,b:3333,c:3333});
 assert.deepEqual(remix(s,'shuffle',[1,2,3]).weights,{a:1667,b:3333,c:5000});
 for(let i=1;i<=20;i++){
  const r=remix(s,'shuffle',[i,21-i,i*3]);
  assert.equal(Object.values(r.weights).reduce((a,b)=>a+b,0),10000);
  assert.ok(Object.values(r.weights).every(n=>Number.isInteger(n)&&n>=0));
 }
});
test('remix rejects all locks, empty pools, invalid scores and unknown modes',()=>{
 const s=base();s.locked=['a','b','c'];assert.throws(()=>remix(s,'equal'),/Unlock/);
 s.locked=[];assert.throws(()=>remix(s,'shuffle',[1,0,1]));assert.throws(()=>remix(s,'shuffle',[1,NaN,1]));
 assert.throws(()=>remix(s,'unknown'));s.weights={a:0,b:0,c:0};s.cash_bps=10000;assert.throws(()=>remix(s,'equal'),/cash/);
});
