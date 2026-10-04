// Deterministic assumption models. Cash-flow units and discount conventions
// are explicit; this module never obtains prices or estimates from a provider.
export const MODELS=['earnings','equity','firm','dividend'];
const finite=v=>typeof v==='number'&&Number.isFinite(v);
export function valuation(a) {
  if(!a||!MODELS.includes(a.model))return {error:'Choose a valuation model.'};
  const required=['base','growth','discount','years','marginSafety'];
  if(required.some(k=>!finite(a[k])))return {error:'Complete the base value, growth, discount rate and horizon.'};
  if(a.base<=0||a.base>1e15||a.growth<=-100||a.growth>100||a.discount<=0||a.discount>100||!Number.isInteger(a.years)||a.years<1||a.years>20||a.marginSafety<0||a.marginSafety>80)return {error:'Use a positive base, growth above −100%, a discount rate above zero and a 1–20 year horizon.'};
  const g=a.growth/100,r=a.discount/100;
  let flows=[],terminalValue,present;
  if(a.model==='earnings'){
    if(!finite(a.multiple)||a.multiple<=0||a.multiple>200||!finite(a.dividend)||a.dividend<0||a.dividend>1e7)return {error:'Enter a positive exit multiple and a nonnegative current dividend per share.'};
    for(let y=1;y<=a.years;y++)flows.push({year:y,amount:a.dividend*(1+g)**y,pv:a.dividend*(1+g)**y/(1+r)**y});
    terminalValue=a.base*(1+g)**a.years*a.multiple;
    present=flows.reduce((s,f)=>s+f.pv,0)+terminalValue/(1+r)**a.years;
  }else{
    if(!finite(a.terminal)||a.terminal<=-100||a.terminal>=a.discount)return {error:'Terminal growth must be below the discount rate and above −100%.'};
    for(let y=1;y<=a.years;y++){
      const amount=a.base*(1+g)**y;flows.push({year:y,amount,pv:amount/(1+r)**y});
    }
    terminalValue=flows.at(-1).amount*(1+a.terminal/100)/(r-a.terminal/100);
    present=flows.reduce((s,f)=>s+f.pv,0)+terminalValue/(1+r)**a.years;
  }
  let value=present;
  if(a.model==='firm'){
    if(!finite(a.shares)||a.shares<=0||a.shares>1e15||!finite(a.cash)||a.cash<0||a.cash>1e15||!finite(a.debt)||a.debt<0||a.debt>1e15)return {error:'Enter positive diluted shares, cash/nonoperating assets and debt/non-equity claims in matching units.'};
    value=(present+a.cash-a.debt)/a.shares;
  }
  const terminalPV=terminalValue/(1+r)**a.years;
  if(![value,present,terminalPV,...flows.flatMap(f=>[f.amount,f.pv])].every(finite))return {error:'These assumptions exceed the supported numeric range.'};
  return {value,present,terminalValue,terminalPV,terminalShare:present!==0?terminalPV/present*100:null,adjusted:value*(1-a.marginSafety/100),flows};
}
export function returnTable(a,rates) {return rates.map(discount=>({discount,...valuation({...a,discount})}));}
export function sensitivity(a) {
  const growths=Array.from({length:5},(_,i)=>a.growth+(i-2)*2);
  const rates=Array.from({length:5},(_,i)=>a.discount+(i-2)*2);
  return {growths,rates,cells:rates.map(discount=>growths.map(growth=>valuation({...a,discount,growth})))};
}
// Solve a bounded monotonic growth problem; a missing solution is not a forecast.
export function impliedGrowth(a,price) {
  if(!finite(price)||price<=0)return {error:'Enter a positive comparison price per share.'};
  let lo=-90,hi=100;
  const low=valuation({...a,growth:lo}),high=valuation({...a,growth:hi});
  if(low.error||high.error)return {error:low.error||high.error};
  if(price<low.value||price>high.value)return {error:'No growth solution between −90% and 100% for these assumptions.'};
  for(let i=0;i<90;i++){
    const mid=(lo+hi)/2,v=valuation({...a,growth:mid});
    if(v.error)return v;
    if(v.value<price)lo=mid;else hi=mid;
  }
  const growth=(lo+hi)/2;
  return {growth,...valuation({...a,growth})};
}
export function filingChanges(baseline,data) {
  if(!baseline?.points)return {first:true,items:[]};
  const old=new Map(baseline.points.map(p=>[p.period,p]));
  const items=[];
  for(const point of data.points){
    const prior=old.get(point.period);
    if(!prior){items.push({kind:'new',period:point.period,label:point.label,point});continue;}
    if(prior.basis!==point.basis||prior.format!==point.format)items.push({kind:'basis',period:point.period,label:point.label,before:prior.basis,after:point.basis});
    for(const key of Object.keys(data.metrics)){
      const before=prior.values[key]??null,after=point.values[key]??null;
      if(before!==after)items.push({kind:'value',period:point.period,label:point.label,metric:key,before,after});
    }
    if(prior.published_at!==point.published_at)items.push({kind:'publication',period:point.period,label:point.label,before:prior.published_at,after:point.published_at});
    else if(prior.fetched_at!==point.fetched_at)items.push({kind:'stored',period:point.period,label:point.label,before:prior.fetched_at,after:point.fetched_at});
  }
  for(const prior of baseline.points)if(!data.points.some(p=>p.period===prior.period))items.push({kind:'removed',period:prior.period,label:prior.period});
  return {first:false,items};
}
