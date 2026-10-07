import test from 'node:test';
import assert from 'node:assert/strict';
import {guidedProjectionInputs} from '../src/portfolio-lab-guided-contract.js';

test('a selected zero or negative return produces the existing typed projection request',()=>{
 const ids=['stock:TCS.NS','fund:123'];
 const zero=guidedProjectionInputs({monthly:'5000',inflation:'0',years:'5',rate:'0'},ids);
 assert.deepEqual(zero,{years:5,monthly:'5000',inflation_pct:'0',rates:{'stock:TCS.NS':'0','fund:123':'0'}});
 const falling=guidedProjectionInputs({monthly:'0',inflation:'4.5',years:'1',rate:'-20'},ids);
 assert.equal(falling.rates['stock:TCS.NS'],'-20');
 assert.equal(falling.inflation_pct,'4.5');
});

test('an unchosen return, unsupported bounds or ambiguous basket cannot be submitted',()=>{
 const base={monthly:'5000',inflation:'0',years:'5',rate:'8'};
 assert.throws(()=>guidedProjectionInputs({...base,rate:''},['a']),/Annual return/);
 assert.throws(()=>guidedProjectionInputs({...base,rate:' '},['a']),/Annual return/);
 assert.throws(()=>guidedProjectionInputs({...base,rate:'101'},['a']),/Annual return/);
 assert.throws(()=>guidedProjectionInputs({...base,monthly:'1000001'},['a']),/Monthly addition/);
 assert.throws(()=>guidedProjectionInputs({...base,inflation:'-1'},['a']),/Inflation/);
 assert.throws(()=>guidedProjectionInputs({...base,years:'3.5'},['a']),/whole years/);
 assert.throws(()=>guidedProjectionInputs(base,[]),/starting basket/);
 assert.throws(()=>guidedProjectionInputs(base,['a','a']),/starting basket/);
});
