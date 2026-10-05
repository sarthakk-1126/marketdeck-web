// Valuation display helpers. Source references and user scenarios stay distinct.
import {valuation} from './research-valuation.js';
export const REFERENCE_KEYS={earnings:'eps',firm:'fcff',equity:'fcfe',dividend:'dividend'};
export const finite=v=>typeof v==='number'&&Number.isFinite(v);
export function referencePoints(data){
 if(data?.valuation_reference?.version===1)return data.valuation_reference.points;
 // Compatible with the previous public endpoint during the staged deployment.
 return (data?.points||[]).map(p=>({...p,facts:{eps:{label:'Diluted EPS',value:p.values.diluted_eps,source:p.sources.diluted_eps,unit:'INR/share',kind:'filed'},cfo:{label:'Operating cash flow',value:finite(p.values.cfo)?p.values.cfo/1e7:null,source:p.sources.cfo,unit:'INR crore',kind:'filed'}}}));
}
const compatible=(a,b)=>a&&b&&a.basis&&a.basis!=='Unknown'&&a.format&&a.format!=='Unknown'&&a.basis===b.basis&&a.format===b.format;
export function baseReference(data,model,mode='latest'){
 const points=referencePoints(data),latest=points.at(-1),key=REFERENCE_KEYS[model];
 if(!latest)return {value:null,reason:'No stored annual filing is available.',points:[]};
 const rows=mode==='average3'?points.slice(-3):[latest];
 if(mode==='average3'&&(rows.length!==3||rows.some((p,i)=>!compatible(p,latest)||(i>0&&((Date.parse(p.period)-Date.parse(rows[i-1].period))/86400000<300||(Date.parse(p.period)-Date.parse(rows[i-1].period))/86400000>430)))))return {value:null,reason:'Three consecutive annual periods on the same reporting basis are required.',points:rows};
 const values=rows.map(p=>p.facts[key]?.value);
 if(values.some(v=>!finite(v)))return {value:null,reason:latest.facts[key]?.reason||'This per-share cash flow is unavailable in the stored filings.',points:rows};
 const value=values.reduce((sum,v)=>sum+v,0)/values.length;
 if(!compatible(latest,latest))return {value:null,reason:'The filing reporting basis is unknown.',points:rows};
 return {value,points:rows,kind:mode==='average3'?'derived':latest.facts[key]?.kind||'filed',reason:value<=0?'This constant-growth model requires a positive base. Review the figure or use another model.':null};
}
export function fcffFromComponents(a){
 if(!a||['ebit','tax','da','capex','workingCapital'].some(k=>!finite(a[k])))return {error:'Complete EBIT, tax rate, depreciation, capital expenditure and the change in non-cash working capital.'};
 if(a.tax<0||a.tax>100||a.da<0||a.capex<0||Object.values(a).some(v=>Math.abs(v)>1e15))return {error:'Use a 0–100% tax rate and nonnegative depreciation and capital expenditure.'};
 const value=a.ebit*(1-a.tax/100)+a.da-a.capex-a.workingCapital;
 return finite(value)?{value}:{error:'The inputs exceed the supported numeric range.'};
}
export function forecast(a){
 if(!finite(a.base)||a.base<=0||!finite(a.growth)||a.growth<=-100||a.growth>100||!Number.isInteger(a.years)||a.years<1||a.years>20)return [];
 const points=Array.from({length:a.years+1},(_,year)=>({year,value:a.base*(1+a.growth/100)**year}));
 return points.every(p=>finite(p.value))?points:[];
}
export function bridge(a,result=valuation(a)){
 if(result.error)return [];
 const divisor=a.model==='firm'?a.shares:1;
 const flows=result.flows.reduce((sum,f)=>sum+f.pv,0)/divisor;
 const items=[{label:a.model==='earnings'?'Discounted dividends':'Forecast cash flows',value:flows},{label:a.model==='earnings'?'Discounted exit value':'Terminal value',value:result.terminalPV/divisor}];
 if(a.model==='firm')items.push({label:'+ Cash / assets',value:a.cash/divisor},{label:'− Debt / claims',value:-a.debt/divisor});
 return items;
}
export function comparisonScenarios(a,scenarios){
 return scenarios.map((s,index)=>({...s,index,result:valuation(s.inputs)})).filter(s=>s.inputs.model===a.model&&!s.result.error);
}
