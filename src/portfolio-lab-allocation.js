// Input interaction only. Authoritative money/scenario calculations live in Django.
export function adjustWeight(spec, id, next) {
 const result=structuredClone(spec);
 if(!Object.hasOwn(result.weights,id)||!Number.isInteger(next)||next<0||next>10000)throw Error('Enter a weight from 0% to 100%.');
 if(result.locked.includes(id))throw Error('Unlock this holding before changing its weight.');
 const old=result.weights[id],delta=next-old;
 if(result.transfer_mode==='cash'){
  if(delta>result.cash_bps)throw Error('This change needs more hypothetical cash. Reduce another holding or choose redistribution.');
  result.weights[id]=next;result.cash_bps-=delta;return result;
 }
 const others=Object.keys(result.weights).filter(k=>k!==id&&!result.locked.includes(k)&&result.weights[k]>0);
 const pool=others.reduce((sum,k)=>sum+result.weights[k],0),remaining=pool-delta;
 if(remaining<0)throw Error('Locked holdings and cash leave insufficient allocation for this change.');
 if(!others.length&&delta!==0)throw Error('There is no other allocated, unlocked holding. Choose cash transfer.');
 if(pool){
  const raw=others.map(k=>({key:k,value:result.weights[k]/pool*remaining}));
  let assigned=0;for(const item of raw){result.weights[item.key]=Math.floor(item.value);assigned+=result.weights[item.key];}
  raw.sort((a,b)=>(b.value-Math.floor(b.value))-(a.value-Math.floor(a.value))||a.key.localeCompare(b.key));
  for(let i=0;i<remaining-assigned;i++)result.weights[raw[i].key]++;
 }
 result.weights[id]=next;return result;
}
export function setShocks(spec,ids,pct){
 if(!Number.isFinite(pct)||pct<-100||pct>100)throw Error('Choose a price shock from −100% to +100%.');
 const next=structuredClone(spec);for(const id of ids){if(!Object.hasOwn(next.weights,id))throw Error('Choose holdings in this snapshot.');next.shocks[id]=String(pct);}return next;
}

// Rebalance only the unlocked input weights; cash and locked rows stay fixed.
export function remix(spec, mode, samples=[]) {
 const next=structuredClone(spec),ids=Object.keys(next.weights).filter(id=>!next.locked.includes(id));
 if(!ids.length)throw Error('Unlock an asset before changing the mix.');
 const pool=ids.reduce((sum,id)=>sum+next.weights[id],0);
 if(!pool)throw Error('Move some hypothetical cash into the basket before remixing.');
 if(!['equal','shuffle'].includes(mode))throw Error('Choose equal or shuffled weights.');
 const scores=ids.map((id,i)=>mode==='equal'?1:samples[i]);
 if(scores.some(v=>!Number.isFinite(v)||v<=0))throw Error('Shuffling requires positive finite samples.');
 const total=scores.reduce((a,b)=>a+b,0),raw=scores.map(v=>v/total*pool),weights=raw.map(Math.floor);
 const order=raw.map((v,i)=>({i,remainder:v-weights[i]})).sort((a,b)=>b.remainder-a.remainder||a.i-b.i);
 const remainder=pool-weights.reduce((a,b)=>a+b,0);
 for(let i=0;i<remainder;i++)weights[order[i].i]++;
 ids.forEach((id,i)=>next.weights[id]=weights[i]);return next;
}
