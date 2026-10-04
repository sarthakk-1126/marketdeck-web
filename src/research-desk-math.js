export const finite = value => typeof value === 'number' && Number.isFinite(value);
export const sameBasis = (a,b) => !!a && !!b && !!a.basis && !!a.format && a.basis !== 'Unknown' && a.format !== 'Unknown' && a.basis === b.basis && a.format === b.format;
export function chartSeries(data, metrics, through, mode='indexed') {
  const end = data.points.find(p=>p.period===through) || data.points.at(-1);
  const points = data.points.filter(p=>!end || p.period<=end.period);
  const selected = metrics.filter(key=>data.metrics[key]);
  const units = new Set(selected.map(key=>data.metrics[key].unit));
  if (mode==='raw' && units.size>1) return {points,series:[],error:'These metrics have different units. Choose one unit or use an indexed comparison.'};
  let base = null;
  if (mode==='indexed') {
    if(selected.some(key=>data.metrics[key].unit==='%')) return {points,series:[],error:'Percentage metrics use actual values so percentage-point changes remain clear.'};
    base = points.find(p=>sameBasis(p,end) && selected.every(key=>finite(p.values[key]) && p.values[key]>0));
    if(!base) return {points,series:[],error:'No common positive starting period is available. Try actual values or another metric.'};
  }
  const series=selected.map(key=>({key,label:data.metrics[key].label,unit:mode==='indexed'?'index':data.metrics[key].unit,values:points.map(p=>{
    const value=p.values[key];
    if(!finite(value))return null;
    if(mode==='indexed' && (!sameBasis(p,end) || p.period<base.period))return null;
    const result=mode==='indexed'?value/base.values[key]*100:value;
    return finite(result)?result:null;
  })}));
  return {points,series,base,error:null};
}
export function peerPoints(data,period,x='revenue_growth',y='net_margin') {
  const own=data.points.find(p=>p.period===period);
  if(!own)return {points:[],omitted:data.peers.length+1};
  const candidates=[{...data.company,points:data.points},...data.peers];
  const get=(p,key)=>key==='revenue_growth'?p.revenue_growth:p.values[key];
  const points=[];
  for(const company of candidates){
    const p=company.points.find(item=>item.period===period);
    if(!sameBasis(p,own))continue;
    const xv=get(p,x),yv=get(p,y);
    if(finite(xv)&&finite(yv))points.push({ticker:company.ticker,name:company.name,x:xv,y:yv,period,basis:p.basis,point:p});
  }
  return {points,omitted:candidates.length-points.length};
}
export function businessScenario(revenue,growthPct,marginPct,years) {
  if(![revenue,growthPct,marginPct,years].every(finite)||revenue<=0||growthPct<=-100||Math.abs(growthPct)>100||marginPct < -100||marginPct>100||!Number.isInteger(years)||years<1||years>10)return null;
  const result=Array.from({length:years+1},(_,year)=>{const sales=revenue*(1+growthPct/100)**year;return {year,revenue:sales,profit:sales*marginPct/100};});
  return result.every(p=>finite(p.revenue)&&finite(p.profit))?result:null;
}
export function earningsScenario(eps,growthPct,multiple,years) {
  if(![eps,growthPct,multiple,years].every(finite)||eps<=0||growthPct<=-100||Math.abs(growthPct)>100||multiple<=0||multiple>100||!Number.isInteger(years)||years<1||years>10)return null;
  const futureEps=eps*(1+growthPct/100)**years;
  const value=futureEps*multiple;
  return finite(value)?{futureEps,value}:null;
}
export function compound(principal,ratePct,years) {
  if(![principal,ratePct,years].every(finite)||principal<=0||principal>1e12||ratePct<=-100||Math.abs(ratePct)>100||!Number.isInteger(years)||years<0||years>50)return null;
  const amount=principal*(1+ratePct/100)**years;
  return finite(amount)?{amount,interest:amount-principal}:null;
}
export function rangeOf(values){
  const valid=values.filter(finite);
  if(!valid.length)return null;
  let min=Math.min(...valid),max=Math.max(...valid);
  if(min===max){const pad=Math.max(Math.abs(min)*.1,1);min-=pad;max+=pad;}
  else {const pad=(max-min)*.12;min-=pad;max+=pad;}
  return {min,max};
}
