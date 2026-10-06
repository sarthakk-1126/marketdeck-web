// Snapshot copies and chart presentation only. All money and differences come from Django.
export const ideaNames=['Starting idea','Experiment 1','Experiment 2'];
export function createComparisonState(current){
 return {active:1,slots:ideaNames.map((_,i)=>({...structuredClone(current),dirty:i===2?false:current.dirty})),response:null,undo:null};
}
export function copyComparisonIdea(state,from,to){
 if(![0,1,2].includes(from)||![1,2].includes(to)||from===to)throw Error('Choose an editable experiment.');
 const next=structuredClone(state);
 next.undo={slots:structuredClone(state.slots),active:state.active};
 next.slots[to]=structuredClone(state.slots[from]);next.slots[to].dirty=true;next.active=to;next.response=null;
 return next;
}
export function undoComparisonAction(state){
 if(!state.undo)return state;
 return {...state,slots:structuredClone(state.undo.slots),active:state.undo.active,response:null,undo:null};
}
export function comparisonSamples(state){
 return state.slots.map(s=>({token:s.token,specification:structuredClone(s.specification)}));
}
export function renderComparisonCards(state,{esc,money,pct,year,pending,measure='value'}){
 return state.slots.map((slot,i)=>{
  const p=state.response?.previews[i]?.projection?.points[year],diff=state.response?.differences[i],d=diff?.points[year],projection=slot.specification.projection;
  const rates=Object.values(projection.rates),rateLabel=rates.every(r=>Number(r)===Number(rates[0]))?esc(rates[0])+'% per asset':'Different returns per asset';
  const heading=i?`<button type="button" data-pl-idea="${i}" aria-pressed="${state.active===i}" ${pending?'disabled':''}><i aria-hidden="true"></i>${ideaNames[i]} <span>${state.active===i?'Editing ↓':'Edit this idea →'}</span></button>`:`<h3><i aria-hidden="true"></i>Starting idea <span>Fixed reference</span></h3>`;
  return `<article class="pl-idea pl-idea-${i}" data-active="${i===state.active}">${heading}<div class="pl-idea-value">${pending?(state.error?'Needs attention':'Updating…'):p?money(p[measure]):'Outside this horizon'}</div><p class="pl-idea-time">${pending?'Checking all three ideas':p?'At year '+year+(measure==='today_value'?' · in today’s rupees':' · assumed value'):'Ends at year '+projection.years}</p><dl><div><dt>Money added</dt><dd>${pending?'—':p?money(p.contributed):'Not modelled'}</dd></div><div><dt>Assumed growth</dt><dd>${pending?'—':p?money(p.growth):'Not modelled'}</dd></div><div><dt>Today’s rupees</dt><dd>${pending?'—':p?money(p.today_value):'Not modelled'}</dd></div></dl><p class="pl-idea-assumptions">${projection.years} years · ${money(projection.monthly)}/month · ${esc(projection.inflation_pct)}% inflation · ${pct(slot.specification.cash_bps)} cash · Assumed return: ${rateLabel}</p><details data-pl-idea-more="${i}"><summary>More information · differences &amp; sources</summary><p class="pl-idea-assets">${esc(slot.snapshot.assets.map(a=>a.ticker).join(' · '))} · Starting ${money(slot.preview.priced_value)}</p>${i?`<p class="pl-idea-difference">${pending?'Differences update with your inputs.':!d?'Choose a year covered by both ideas to compare.':`${money(d.contributed)} change in money added; ${money(d.growth)} change in assumed growth versus the starting idea.${!diff.same_inflation?' Inflation assumptions differ.':''}${!diff.same_starting_value?' Starting amounts differ.':''}${!diff.same_snapshot?' Input snapshots differ; check sources below.':''}`}</p>`:'<p class="pl-idea-difference">Captured when you opened Compare. Your recorded portfolio stays unchanged.</p>'}<h4>Sources &amp; dates</h4>${slot.snapshot.assets.map(a=>`<p><strong>${esc(a.ticker)}</strong> · ${pct(slot.specification.weights[a.id])} allocation · ${esc(projection.rates[a.id])}% assumed annual return<br>${esc(a.source)} · ${esc(a.price_as_of??(slot.snapshot.practice?'Fictional example; no market date':'Reference unavailable'))}${a.url?` · <a href="${esc(a.url)}">Details ↗</a>`:''}</p>`).join('')}</details></article>`;
 }).join('');
}
export function comparisonChart(response,{money,year,measure='value'}){
 const arrays=response.previews.map(p=>p.projection.points),values=arrays.flatMap(ps=>ps.map(p=>p[measure]));
 const peak=values.reduce((a,b)=>Number(a)>Number(b)?a:b,'0'),maximum=Math.max(Number(peak),1),years=response.years;
 const coord=p=>[48+p.month/(years*12)*498,252-Number(p[measure])/maximum*211];
 const paths=arrays.map((points,i)=>`<path class="pl-idea-line pl-idea-line-${i}" d="${points.map((p,n)=>(n?'L':'M')+coord(p).join(',')).join(' ')}"/>`).join('');
 const markers=arrays.map((ps,i)=>ps[year]?`<circle class="pl-idea-dot pl-idea-dot-${i}" cx="${coord(ps[year])[0]}" cy="${coord(ps[year])[1]}" r="5"/>`:'').join('');
 return `<svg class="pl-growth-chart pl-comparison-chart" viewBox="0 0 580 305" role="img" aria-label="Three user-defined ${measure==='today_value'?'inflation-adjusted':'assumed value'} paths. Each ends at its own horizon. Exact values and money added are in the comparison cards; not a forecast."><path class="pl-growth-grid" d="M48 41H546 M48 146H546 M48 252H546"/><text x="48" y="25">${money(peak)} · chart maximum</text>${paths}<path class="pl-comparison-cursor" d="M${48+year/years*498} 41V252"/>${markers}${Array.from({length:years+1},(_,i)=>i===0||i===years||i%5===0?`<text x="${48+i/years*498}" y="285" text-anchor="middle">Y${i}</text>`:'').join('')}</svg><div class="pl-comparison-legend">${ideaNames.map((name,i)=>`<span class="pl-idea-key-${i}"><i></i>${name}</span>`).join('')}</div><p class="pl-help">${measure==='today_value'?'Each path uses that idea’s own inflation assumption. ':'Values include money added; larger contributions can produce a larger balance. '}Paths stop at the chosen horizon. Move the year slider to inspect the same year. Price shocks are a separate experiment and do not change these growth paths.</p>`;
}
