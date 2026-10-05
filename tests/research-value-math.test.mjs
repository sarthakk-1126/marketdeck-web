import test from 'node:test';
import assert from 'node:assert/strict';
import {baseReference,fcffFromComponents,bridge,comparisonScenarios,forecast,referencePoints} from '../src/research-value-math.js';
import {valuation} from '../src/research-valuation.js';
const row=(year,value,basis='Consolidated')=>({period:`${year}-03-31`,label:`FY${year}`,basis,format:'nonfinancial',facts:{eps:{value,kind:'filed'}}});
const data={valuation_reference:{version:1,points:[row(2024,80),row(2025,100),row(2026,120)]}};
test('latest EPS and the comparable three-year average preserve exact units',()=>{
 assert.equal(baseReference(data,'earnings').value,120);assert.equal(baseReference(data,'earnings','average3').value,100);
 assert.equal(baseReference(data,'firm').value,null);
});
test('missing figures, changed bases and irregular years never become a usable average',()=>{
 for(const points of [[row(2024,80),row(2025,null),row(2026,120)],[row(2024,80),row(2025,100,'Standalone'),row(2026,120)],[row(2022,80),row(2025,100),row(2026,120)]])assert.equal(baseReference({valuation_reference:{version:1,points}},'earnings','average3').value,null);
 assert.equal(baseReference({valuation_reference:{version:1,points:[row(2026,null)]}},'earnings').value,null);
 assert.ok(baseReference({valuation_reference:{version:1,points:[row(2026,0)]}},'earnings').reason);
});
test('FCFF helper matches an independent operating-income and reinvestment calculation',()=>{
 const components={ebit:200,tax:25,da:30,capex:60,workingCapital:20};assert.equal(fcffFromComponents(components).value,100);
 assert.equal(fcffFromComponents({...components,workingCapital:-20}).value,140);
 for(const change of [{tax:null},{da:-1},{capex:NaN},{ebit:Infinity},{tax:101}])assert.ok(fcffFromComponents({...components,...change}).error);
 assert.equal(fcffFromComponents({...components,capex:300}).value,-140);
});
test('the displayed per-share bridge reconciles each model including negative debt adjustments',()=>{
 const a={model:'firm',base:100,growth:0,discount:10,terminal:0,years:5,shares:10,cash:50,debt:300,marginSafety:20,dividend:10,multiple:20};
 for(const model of ['firm','earnings','equity','dividend']){const input={...a,model};const result=valuation(input);const parts=bridge(input,result);assert.ok(Math.abs(parts.reduce((sum,p)=>sum+p.value,0)-result.value)<1e-8);}
 assert.equal(bridge(a).at(-1).value,-30);assert.equal(bridge({...a,shares:null}).length,0);
});
test('forecast uses the correct base concept and never invents a valid horizon',()=>{
 assert.deepEqual(forecast({base:100,growth:10,years:2}).map(p=>Math.round(p.value)),[100,110,121]);
 for(const changes of [{base:null},{years:1.5},{years:21},{growth:Infinity},{base:0}])assert.equal(forecast({base:100,growth:10,years:5,...changes}).length,0);
});
test('scenario comparisons only overlay valid cases of the same model',()=>{
 const a={model:'equity',base:100,growth:0,discount:10,terminal:0,years:5,marginSafety:20};
 const scenarios=[{label:'Same model',inputs:a},{label:'Different unit',inputs:{...a,model:'firm'}},{label:'Invalid case',inputs:{...a,base:null}}];
 assert.deepEqual(comparisonScenarios(a,scenarios).map(s=>s.label),['Same model']);
});
test('the staged endpoint fallback converts operating cash flow once and preserves missing values',()=>{
 const points=referencePoints({points:[{values:{diluted_eps:10,cfo:20000000},sources:{diluted_eps:'EPS',cfo:'CFO'}},{values:{diluted_eps:null,cfo:null},sources:{}}]});
 assert.equal(points[0].facts.cfo.value,2);assert.equal(points[1].facts.cfo.value,null);assert.equal(points[0].facts.eps.value,10);
});
