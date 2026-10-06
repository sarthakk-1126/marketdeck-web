import test from 'node:test';
import assert from 'node:assert/strict';
import {createComparisonState,copyComparisonIdea,undoComparisonAction,comparisonSamples,comparisonChart,renderComparisonCards} from '../src/portfolio-lab-comparison.js';
const current=()=>({snapshot:{fingerprint:'frozen',assets:[{id:'a'}]},token:'signed-owner-snapshot',specification:{weights:{a:10000},projection:{years:5,monthly:'0',rates:{a:'0'}}},preview:{priced_value:'1000.00'},dirty:false});
test('editing, duplicating and resetting experiments never change the starting snapshot',()=>{
 const original=current(),state=createComparisonState(original);state.slots[1].specification.projection.monthly='1000';state.slots[1].snapshot.assets.push({id:'b'});
 assert.deepEqual(state.slots[0],original);assert.deepEqual(state.slots[2],original);assert.deepEqual(original,current());
 const copied=copyComparisonIdea(state,1,2);copied.slots[2].specification.weights.a=5000;
 assert.equal(copied.slots[1].specification.weights.a,10000);assert.equal(state.slots[2].specification.projection.monthly,'0');
 assert.deepEqual(copyComparisonIdea(copied,0,2).slots[2].snapshot,original.snapshot);
 assert.throws(()=>copyComparisonIdea(state,1,0));
});
test('inflation-adjusted comparison headlines use the same server measure as the chart',()=>{
 const state=createComparisonState(current());
 state.slots.forEach(s=>{s.specification.projection.inflation_pct='5';s.specification.projection.monthly='0';s.snapshot.assets[0].ticker='A';s.snapshot.assets[0].source='Dated reference';});
 state.response={previews:state.slots.map(()=>({projection:{points:[{value:'1250.00',today_value:'1000.00',contributed:'800.00',growth:'450.00'}]}})),differences:[]};
 const cards=renderComparisonCards(state,{esc:x=>String(x??''),money:x=>'₹'+x,pct:x=>x+'bps',year:0,pending:false,measure:'today_value'});
 assert.equal((cards.match(/class="pl-idea-value">₹1000.00/g)??[]).length,3);
 assert.equal((cards.match(/in today’s rupees/g)??[]).length,3);
 assert.doesNotMatch(cards,/class="pl-idea-value">₹1250.00/);
 assert.match(cards,/Money added<\/dt><dd>₹800.00/);
 assert.match(cards,/Assumed growth<\/dt><dd>₹450.00/);
});
test('undo restores the overwritten idea with its token, inputs and selection',()=>{
 const state=createComparisonState(current());state.slots[2].token='different-signed-context';state.slots[2].specification.weights={b:10000};
 const changed=copyComparisonIdea(state,1,2),restored=undoComparisonAction(changed);
 assert.deepEqual(restored.slots,state.slots);assert.equal(restored.active,state.active);assert.equal(restored.response,null);
 assert.equal(comparisonSamples(restored)[2].token,'different-signed-context');
 const payload=comparisonSamples(restored);payload[1].specification.weights.a=0;assert.equal(restored.slots[1].specification.weights.a,10000);
});
test('presentation draws each supported path only to its own dated endpoint',()=>{
 const p=(month,value)=>({month,value,contributed:value,growth:'0.00',today_value:value});
 const result={years:10,previews:[{projection:{points:[p(0,'1000.00'),p(12,'1100.00')]}},{projection:{points:[p(0,'1000.00'),p(120,'2000.00')]}},{projection:{points:[p(0,'1000.00'),p(24,'1200.00')]}}]};
 const chart=comparisonChart(result,{money:x=>'₹'+x,year:8});
 const endpoints=[0,1,2].map(i=>Number(chart.match(new RegExp('pl-idea-line-'+i+'" d="[^\"]*L([^,]+),'))[1]));
 endpoints.forEach((x,i)=>assert.ok(Math.abs(x-[97.8,546,147.6][i])<1e-9));
 assert.doesNotMatch(chart,/pl-idea-dot/);assert.match(chart,/not a forecast/);
});
