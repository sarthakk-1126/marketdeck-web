import test from 'node:test';
import assert from 'node:assert/strict';
import {valuation,returnTable,impliedGrowth,sensitivity,filingChanges} from '../src/research-valuation.js';
const base={model:'equity',base:100,growth:0,discount:10,terminal:0,years:5,multiple:20,dividend:0,shares:10,cash:50,debt:300,marginSafety:20};
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
test('constant equity cash flow and dividends equal their perpetuity independently of horizon',()=>{
 for(const years of [1,5,20]){close(valuation({...base,years}).value,1000);close(valuation({...base,model:'dividend',base:5,years}).value,50);}
});
test('enterprise cash-flow value bridges cash, debt and shares exactly once',()=>{
 const result=valuation({...base,model:'firm'});close(result.present,1000);close(result.value,75);close(result.adjusted,60);
 close(valuation({...base,model:'equity'}).value,1000);
});
test('earnings scenario discounts the sale value and every dividend',()=>{
 close(valuation({...base,model:'earnings',growth:10}).value,2000);
 close(valuation({...base,model:'earnings',growth:10,dividend:10}).value,2050);
 const results=returnTable({...base,model:'earnings',growth:10},[10,12,15,18]);
 close(results[1].value,100*1.1**5*20/1.12**5);assert.ok(results.every((r,i)=>!i||r.value<results[i-1].value));
});
test('reverse growth solves an independently constructed price for all supported models',()=>{
 for(const model of ['equity','firm','earnings','dividend']){
  const a={...base,model,growth:8.25};const target=valuation(a).value;const solved=impliedGrowth({...a,growth:0},target);close(solved.growth,8.25);close(solved.value,target);
 }
 assert.ok(impliedGrowth(base,1e40).error);assert.ok(impliedGrowth(base,0).error);
});
test('invalid rates, horizons, nonfinite input and terminal growth fail honestly',()=>{
 for(const changes of [{base:null},{base:0},{growth:-100},{discount:0},{years:1.5},{years:21},{terminal:10},{base:Infinity},{marginSafety:-1},{model:'firm',shares:0}])assert.ok(valuation({...base,...changes}).error,JSON.stringify(changes));
 assert.ok(sensitivity({...base,discount:2,terminal:3}).cells[0].every(c=>c.error));
});
test('negative equity bridge stays negative and does not become a zero-valued asset',()=>{
 close(valuation({...base,model:'firm',debt:1200,cash:0}).value,-20);
});
test('filing changes distinguish new periods, revised values, missing values and removed coverage',()=>{
 const p={period:'2025-03-31',basis:'Consolidated',format:'nonfinancial',published_at:'2025-04-01',fetched_at:'2025-04-02',values:{revenue:100,cfo:20}};
 const data={metrics:{revenue:{},cfo:{}},points:[{...p,label:'FY25',values:{revenue:120,cfo:null}},{...p,period:'2026-03-31',label:'FY26'}]};
 const result=filingChanges({points:[p,{...p,period:'2024-03-31'}]},data);
 assert.equal(result.items.filter(i=>i.kind==='value').length,2);assert.ok(result.items.some(i=>i.kind==='new'));assert.ok(result.items.some(i=>i.kind==='removed'));
 assert.equal(filingChanges(null,data).first,true);assert.equal(filingChanges({points:data.points},data).items.length,0);
});
