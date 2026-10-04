import test from 'node:test';
import assert from 'node:assert/strict';
import {chartSeries,peerPoints,businessScenario,earningsScenario,compound,sameBasis} from '../src/research-desk-math.js';

const point=(year,revenue,profit,cfo=null,basis='Consolidated')=>({period:`${year}-03-31`,label:`FY${year}`,basis,format:'nonfinancial',values:{revenue,net_profit:profit,cfo,net_margin:profit/revenue*100},revenue_growth:10});
const fixture=()=>({company:{ticker:'A',name:'A'},metrics:{revenue:{label:'Revenue',unit:'INR'},net_profit:{label:'Profit',unit:'INR'},cfo:{label:'Cash flow',unit:'INR'},net_margin:{label:'Margin',unit:'%'}},points:[point(2023,100,10),point(2024,120,18,20),point(2025,144,24,30)],peers:[]});

test('indexed mixer uses one shared positive base and preserves gaps',()=>{
 const data=fixture();const result=chartSeries(data,['revenue','cfo'],'2025-03-31');
 assert.equal(result.base.period,'2024-03-31');assert.deepEqual(result.series[0].values,[null,100,120]);assert.deepEqual(result.series[1].values,[null,100,150]);
 data.points[1].values.cfo=null;assert.deepEqual(chartSeries(data,['cfo'],'2025-03-31').series[0].values,[null,null,100]);
});
test('basis changes and unknown basis never create an indexed comparison',()=>{
 const data=fixture();data.points[0].basis='Standalone';
 assert.equal(chartSeries(data,['revenue'],'2025-03-31').series[0].values[0],null);
 assert.equal(sameBasis({},{}),false);data.points.at(-1).basis='Unknown';assert.ok(chartSeries(data,['revenue'],'2025-03-31').error);
});
test('percentages cannot share raw currency scales or an index',()=>{
 assert.ok(chartSeries(fixture(),['revenue','net_margin'],'2025-03-31','raw').error);
 assert.ok(chartSeries(fixture(),['net_margin'],'2025-03-31','indexed').error);
 assert.equal(chartSeries(fixture(),['net_margin'],'2025-03-31','raw').series[0].values[0],10);
});
test('peers require exact period, basis and finite comparable axes',()=>{
 const data=fixture();data.peers=[{ticker:'B',points:[point(2025,150,30)]},{ticker:'C',points:[point(2024,100,10)]},{ticker:'D',points:[point(2025,100,10,null,'Standalone')]},{ticker:'E',points:[{...point(2025,100,10),revenue_growth:null}]}];
 const result=peerPoints(data,'2025-03-31');assert.deepEqual(result.points.map(p=>p.ticker),['A','B']);assert.equal(result.omitted,3);
});
test('scenario equations and invalid inputs are independently checked',()=>{
 const rows=businessScenario(100,10,20,2);assert.ok(Math.abs(rows[2].revenue-121)<1e-9);assert.ok(Math.abs(rows[2].profit-24.2)<1e-9);
 assert.equal(businessScenario(null,10,20,2),null);assert.equal(businessScenario(100,-100,20,2),null);
 const earnings=earningsScenario(5,20,15,2);assert.ok(Math.abs(earnings.futureEps-7.2)<1e-9);assert.ok(Math.abs(earnings.value-108)<1e-9);
 assert.equal(earningsScenario(0,10,20,2),null);assert.equal(earningsScenario(5,10,0,2),null);
 assert.equal(compound(100,10,2).amount,121.00000000000001);assert.equal(compound(100,-10,1).amount,90);
 assert.equal(compound(100,10,0).amount,100);assert.equal(compound(Infinity,10,2),null);
});
