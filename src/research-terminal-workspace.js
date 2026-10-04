import {createTerminal} from './research-terminal.js';
import {finite,sameBasis,chartSeries,peerPoints,businessScenario,earningsScenario,compound,rangeOf} from './research-desk-math.js';

const bootElement=document.querySelector('#rd-bootstrap');
if(bootElement){
const boot=JSON.parse(bootElement.textContent);
const $=selector=>document.querySelector(selector), $$=selector=>[...document.querySelectorAll(selector)];
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const palette=['var(--rd-blue)','var(--rd-cyan)','var(--rd-violet)'];
const metricIcons={revenue:'▥',net_profit:'↗',cfo:'≋',ebit:'⌁',net_margin:'%',diluted_eps:'◇'};
const lensInfo={business:{title:'Business preview',copy:'Start with revenue and profit from stored annual filings.',metrics:['revenue','net_profit']},growth:{title:'Growth preview',copy:'Compare how revenue and profit changed over the same periods.',metrics:['revenue','net_profit']},cash:{title:'Cash flow preview',copy:'Explore operating cash alongside reported net profit.',metrics:['cfo','net_profit']},value:{title:'Valuation preview',copy:'Inspect filed EPS, then explore your own earnings and multiple assumptions.',metrics:['diluted_eps']},price:{title:'Price perspective',copy:'Explore this company’s stored price history and technical research inside the terminal.',metrics:[]}};
let data=boot.company, compareData=null, desks=[], current=null, metrics=['revenue','net_profit'], period=data?.points.at(-1)?.period??null, mode='indexed', view='explore', preview='growth', pins=[], dirty=false, loading=false, highlighted=period;
let editRevision=0,peerSequence=0,searchPurpose='company',searchSequence=0,dataSequence=0,searchAbort=null,dataAbort=null,saveInFlight=null,pendingNavigation=null,toastTimer=null;
let calculator='business',scenario={growth:8,margin:15,years:3,multiple:20,principal:100000,rate:8},scenarioSeed=null;
const loaded=new Map();if(data)loaded.set(data.company.ticker,data);
const csrf=$('[data-csrf] input')?.value;

function url(value){try{const candidate=new URL(value,location.origin);if(candidate.origin===location.origin)return candidate.pathname+candidate.search+candidate.hash;if(candidate.protocol==='https:'&&(candidate.hostname==='nseindia.com'||candidate.hostname.endsWith('.nseindia.com')))return candidate.href;}catch{}return '#';}
function fmt(value,unit='INR',compact=true){
 if(!finite(value))return 'Not disclosed';
 if(unit==='%')return `${value.toLocaleString('en-IN',{maximumFractionDigits:2})}%`;
 if(unit==='index')return value.toLocaleString('en-IN',{maximumFractionDigits:1});
 if(unit==='INR/share')return `₹${value.toLocaleString('en-IN',{maximumFractionDigits:2})} / share`;
 if(compact&&Math.abs(value)>=1e7)return `₹${(value/1e7).toLocaleString('en-IN',{maximumFractionDigits:1})} Cr`;
 return `₹${value.toLocaleString('en-IN',{maximumFractionDigits:compact?0:2})}`;
}
function dateLabel(value){if(!value)return 'Not recorded';const date=new Date(value);return Number.isNaN(date.valueOf())?'Not recorded':new Intl.DateTimeFormat('en-IN',{day:'numeric',month:'short',year:'numeric',timeZone:'Asia/Kolkata'}).format(date);}
function currentPoint(){return data?.points.find(p=>p.period===period)||null;}
function notice(message){$('[data-notice]').textContent=message||'';$('[data-notice]').hidden=!message;}
function toast(message){const box=$('[data-toast]');box.textContent=message;box.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>box.hidden=true,4300);}
function markDirty(){editRevision++;dirty=true;$('[data-save-status]').textContent=boot.authenticated?'Unsaved changes':'Explore · sign in to save';$('[data-save-status]').dataset.saved='false';}
async function request(href,options={}){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
 const external=options.signal;
 if(external?.aborted)controller.abort();
 const abort=()=>controller.abort();external?.addEventListener('abort',abort,{once:true});
 try{
  const response=await fetch(href,{credentials:'same-origin',cache:'no-store',redirect:'manual',...options,signal:controller.signal});
  if(response.type==='opaqueredirect'||(response.status>=300&&response.status<400))throw new Error('Your session needs refreshing. Sign in again.');
  let payload;try{payload=await response.json();}catch{throw new Error('This view is temporarily unavailable. Please try again.');}
  if(!response.ok){const error=new Error(payload.error||'This view is temporarily unavailable.');error.status=response.status;throw error;}
  return payload;
 }catch(error){if(error.name==='AbortError')throw new Error('The request timed out or was replaced. Please try again.');throw error;}
 finally{clearTimeout(timer);external?.removeEventListener('abort',abort);}
}
async function loadCompany(ticker,signal){if(loaded.has(ticker))return loaded.get(ticker);const result=await request(boot.data_url.replace('SYMBOL',encodeURIComponent(ticker)),{signal});if(result?.version!==1||!Array.isArray(result.points)||!result.company)throw new Error('Company data is incomplete. Open the original company view.');loaded.set(ticker,result);while(loaded.size>4)loaded.delete(loaded.keys().next().value);return result;}
function metricNames(keys=metrics){return keys.map(key=>data?.metrics[key]?.label||key).join(' & ');}
function setLinks(){if(!data)return;for(const a of $$('[data-price-link]'))a.href=url(data.links.chart);$('[data-company-link]').href=url(data.links.company);$('[data-peer-link]').href=url(data.links.peers);$('[data-calculator-link]').href=url(data.links.calculators);}
function defaultMetrics(){const available=Object.keys(data?.metrics||{}).filter(key=>data.points.some(p=>finite(p.values[key])));return ['revenue','net_profit'].filter(key=>available.includes(key)).length?['revenue','net_profit'].filter(key=>available.includes(key)):available.slice(0,1).length?available.slice(0,1):['net_profit'];}
function renderDesks(){
 const list=$('[data-desks-list]');list.replaceChildren();
 const temporary=document.createElement('button');temporary.type='button';temporary.className='rd-desk-open';temporary.setAttribute('aria-current',String(!current?.id));temporary.textContent=current?.title||`${data?.company.ticker.replace(/\.NS$/,'')||'New'} research`;
 if(!current?.id){const wrap=document.createElement('div');wrap.className='rd-desk-item';wrap.append(temporary);list.append(wrap);}
 for(const desk of desks){const row=document.createElement('div');row.className='rd-desk-item';const open=document.createElement('button');open.type='button';open.className='rd-desk-open';open.setAttribute('aria-current',String(current?.id===desk.id));open.append(document.createTextNode(desk.title));const sub=document.createElement('span');sub.textContent=desk.company.replace(/\.NS$/,'');open.append(sub);open.addEventListener('click',()=>navigate(()=>openDesk(desk)));const remove=document.createElement('button');remove.type='button';remove.className='rd-icon-button rd-desk-delete';remove.textContent='×';remove.setAttribute('aria-label',`Delete ${desk.title}`);remove.addEventListener('click',()=>deleteDesk(desk,remove));row.append(open,remove);list.append(row);}
 if(!boot.authenticated){const p=document.createElement('p');p.className='rd-sidebar-hint';p.textContent='Sign in to reopen saved desks.';list.append(p);}
}
function renderMetrics(){
 const list=$('[data-metrics]');list.replaceChildren();
 for(const [key,spec] of Object.entries(data?.metrics||{})){const button=document.createElement('button');button.type='button';button.className='rd-metric-button';button.setAttribute('aria-pressed',String(metrics.includes(key)));button.dataset.metric=key;const available=data.points.some(p=>finite(p.values[key]));button.disabled=!available;button.innerHTML=`<span class="rd-metric-icon" aria-hidden="true">${metricIcons[key]||'·'}</span><span>${esc(spec.label)}${available?'':'<small>Not on file</small>'}</span><span class="rd-check" aria-hidden="true">${metrics.includes(key)?'✓':''}</span>`;button.addEventListener('click',()=>toggleMetric(key));list.append(button);}
 $('[data-metric-count]').textContent=`${metrics.length} / 3`;
}
function toggleMetric(key){
 if(metrics.includes(key)){if(metrics.length===1)return toast('Keep one metric in view.');metrics=metrics.filter(item=>item!==key);}
 else{if(key==='net_margin'){metrics=[key];mode='raw';toast('Net margin uses its own actual percentage scale.');}else{if(metrics.includes('net_margin')){metrics=[];mode='indexed';}if(metrics.length>=3)return toast('Mix up to three metrics. Remove one to add another.');metrics.push(key);}}
 markDirty();renderMetrics();setView('explore');renderChart();
}
function miniChart(keys){
 if(!data)return '';
 const result=chartSeries(data,keys,period,'indexed');const values=result.series.flatMap(s=>s.values).filter(finite);const range=rangeOf(values);
 if(!range)return '<p>This metric is not available at the selected period.</p>';
 const width=180,height=49,pad=4;const x=index=>pad+index*(width-pad*2)/Math.max(result.points.length-1,1),y=value=>height-pad-(value-range.min)/(range.max-range.min)*(height-pad*2);
 return `<svg viewBox="0 0 ${width} ${height}" aria-hidden="true">${result.series.map((s,si)=>{let parts='',active=false;s.values.forEach((v,i)=>{if(!finite(v)){active=false;return;}parts+=`${active?'L':'M'}${x(i).toFixed(1)},${y(v).toFixed(1)} `;active=true;});return `<path d="${parts}" fill="none" stroke="${palette[si]}" stroke-width="1.6"/>`;}).join('')}</svg>`;
}
function renderPreview(key=preview){
 preview=key;const info=lensInfo[key];if(!info)return;
 for(const el of $$('[data-lens]'))el.dataset.active=String(el.dataset.lens===key);
 const panel=$('[data-preview]');panel.classList.remove('rd-preview-swap');panel.innerHTML=`<strong>${esc(info.title)}</strong><p>${esc(info.copy)}</p>${info.metrics.length?miniChart(info.metrics):'<p>Price history, indicators and technical context.</p>'}${key==='price'?`<button class="rd-text-link" type="button" data-open-lens="price">Open Charting →</button>`:`<button type="button" class="rd-text-link" data-open-lens="${key}">Open ${key==='value'?'valuation':key==='cash'?'cash flow':key} view →</button>`}`;void panel.offsetWidth;panel.classList.add('rd-preview-swap');
}
function activateLens(key){
 const info=lensInfo[key];if(!info)return;if(key==='price'){setView('charts');return;}
 metrics=info.metrics.filter(metric=>data.points.some(p=>finite(p.values[metric])));if(!metrics.length)metrics=info.metrics.slice(0,1);
 mode='indexed';markDirty();renderMetrics();setView(key==='value'?'valuation':'explore');if(key!=='value')renderChart();renderPreview(key);
}
function combinedChart(){
 let result=chartSeries(data,metrics,period,mode),comparisonMessage='';
 if(!compareData||result.error)return {...result,comparisonMessage};
 const ownEnd=currentPoint(),otherEnd=compareData.points.find(p=>p.period===period);
 if(!sameBasis(ownEnd,otherEnd))return {...result,comparisonMessage:'The comparison has no matching reporting period and basis. Its data is omitted.'};
 let ownPoints=data.points,otherPoints=data.points.map(p=>compareData.points.find(q=>q.period===p.period&&sameBasis(p,q))||{...p,basis:'Unknown',format:'Unknown',values:{}});
 if(mode==='indexed'){
  const start=ownPoints.find(p=>p.period<=period&&sameBasis(p,ownEnd)&&otherPoints.some(q=>q.period===p.period&&sameBasis(p,q)&&metrics.every(key=>finite(q.values[key])&&q.values[key]>0))&&metrics.every(key=>finite(p.values[key])&&p.values[key]>0));
  if(!start)return {...result,comparisonMessage:'No common positive starting period is available for this comparison.'};
  ownPoints=ownPoints.filter(p=>p.period>=start.period);otherPoints=otherPoints.filter(p=>p.period>=start.period);
 }
 result=chartSeries({...data,points:ownPoints},metrics,period,mode);
 const other=chartSeries({...compareData,points:otherPoints},metrics,period,mode);
 if(other.error)return {...result,comparisonMessage:other.error};
 return {...result,series:[...result.series.map(s=>({...s,company:data.company.ticker})),...other.series.map(s=>({...s,company:compareData.company.ticker,comparison:true,label:`${compareData.company.ticker.replace(/\.NS$/,'')} · ${s.label}`}))],comparisonMessage};
}
function renderChart(){
 if(!data)return;
 const result=combinedChart();$('[data-chart-title]').textContent=metricNames();$('[data-chart-caption]').textContent=mode==='indexed'?'Indexed comparison · a common start at 100':`Actual values · ${data.metrics[metrics[0]]?.unit||'filed figures'}`;
 for(const el of $$('[data-mode]'))el.setAttribute('aria-pressed',String(el.dataset.mode===mode));
 $('[data-legend]').innerHTML=result.series.map((s,i)=>`<span><i style="--series-color:${palette[i%3]}"></i>${esc(s.label)}${s.comparison?' · dashed':''}</span>`).join('');
 const range=rangeOf(result.series.flatMap(s=>s.values));const chart=$('[data-chart]');
 if(result.error||!range||!result.points.length){chart.innerHTML=`<div class="rd-empty"><strong>A little more context is needed.</strong><span>${esc(result.error||'No disclosed values are available for these metrics and period.')}</span></div>`;$('[data-readout]').innerHTML='';$('[data-chart-footnote]').textContent='Missing figures stay missing. Choose another metric or reporting period.';return;}
 const W=640,H=218,L=62,R=18,T=15,B=30;const x=i=>L+(W-L-R)*i/Math.max(result.points.length-1,1),y=v=>T+(range.max-v)/(range.max-range.min)*(H-T-B);
 let paths='';result.series.forEach((s,si)=>{let d='',prior=null;s.values.forEach((value,i)=>{const point=result.points[i];if(!finite(value)){prior=null;return;}const connect=prior!==null&&sameBasis(result.points[prior],point);d+=`${connect?'L':'M'}${x(i).toFixed(2)},${y(value).toFixed(2)} `;prior=i;});paths+=`<path class="rd-chart-line" d="${d}" stroke="${palette[si%3]}"${s.comparison?' stroke-dasharray="5 5"':''}/>`;s.values.forEach((value,i)=>{if(finite(value))paths+=`<circle cx="${x(i)}" cy="${y(value)}" r="3" fill="${palette[si%3]}"/>`;});});
 const unit=mode==='indexed'?'index':data.metrics[metrics[0]]?.unit;
 const grid=Array.from({length:4},(_,i)=>{const value=range.min+(range.max-range.min)*i/3;return `<line class="rd-chart-grid" x1="${L}" y1="${y(value)}" x2="${W-R}" y2="${y(value)}"/><text class="rd-chart-label" x="${L-9}" y="${y(value)+3}" text-anchor="end">${esc(fmt(value,unit))}</text>`;}).join('');
 const step=Math.max(1,Math.ceil(result.points.length/6));const labels=result.points.map((p,i)=>i%step===0||i===result.points.length-1?`<text class="rd-chart-label" x="${x(i)}" y="${H-8}" text-anchor="middle">${esc(p.label.replace('FY ending ','').replace(/^FY\d{4}-/,'FY'))}</text>`:'').join('');
 const hits=result.points.map((p,i)=>`<rect class="rd-chart-hit" data-chart-period="${p.period}" x="${x(i)-Math.max((W-L-R)/result.points.length/2,10)}" y="${T}" width="${Math.max((W-L-R)/result.points.length,20)}" height="${H-T-B}" tabindex="0" role="button" aria-label="Inspect ${esc(p.label)}; activate to select this period"/>`).join('');
 chart.innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="group" aria-label="${esc(metricNames())} annual chart">${grid}${labels}${paths}<line class="rd-chart-crosshair" data-crosshair x1="${x(result.points.length-1)}" x2="${x(result.points.length-1)}" y1="${T}" y2="${H-B}"/>${hits}</svg>`;
 const inspect=(selected)=>{const index=result.points.findIndex(p=>p.period===selected);if(index<0)return;highlighted=selected;const line=chart.querySelector('[data-crosshair]');line.setAttribute('x1',x(index));line.setAttribute('x2',x(index));renderReadout(selected);};
 for(const hit of chart.querySelectorAll('[data-chart-period]')){hit.addEventListener('pointerenter',()=>inspect(hit.dataset.chartPeriod));hit.addEventListener('focus',()=>inspect(hit.dataset.chartPeriod));hit.addEventListener('click',()=>selectPeriod(hit.dataset.chartPeriod));hit.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();selectPeriod(hit.dataset.chartPeriod);}});}
 inspect(period);
 $('[data-chart-footnote]').textContent=[result.base?`Base: ${result.base.label} · ${result.base.basis}.`:'Values retain their stated units.', 'Gaps and reporting-basis changes break the line.',result.comparisonMessage].filter(Boolean).join(' ');
 if(compareData){const row=document.createElement('div');row.className='rd-comparison-row';row.append(document.createTextNode(`Comparing ${compareData.company.name}`));const remove=document.createElement('button');remove.className='rd-icon-button';remove.type='button';remove.textContent='×';remove.setAttribute('aria-label','Remove comparison');remove.addEventListener('click',()=>{compareData=null;markDirty();renderChart();});row.append(remove);$('[data-legend]').append(row);}
}
function renderReadout(selected){const p=data.points.find(item=>item.period===selected);if(!p)return;$('[data-readout]').innerHTML=`<strong>${esc(p.label)}</strong>${metrics.map((key,i)=>`<span class="rd-readout-value"><i style="--series-color:${palette[i]}"></i>${esc(data.metrics[key].label)} <b>${esc(fmt(p.values[key],data.metrics[key].unit))}</b></span>`).join('')}`;}
function scatter(target,large=false){
 const xKey=$('[data-peer-x]').value,yKey=$('[data-peer-y]').value,result=peerPoints(data,period,xKey,yKey);const xr=rangeOf(result.points.map(p=>p.x)),yr=rangeOf(result.points.map(p=>p.y));
 if(!xr||!yr){target.innerHTML='<div class="rd-empty"><strong>No comparable peer points.</strong><span>The selected period needs matching reporting basis and disclosed metrics.</span></div>';return result;}
 const W=large?640:265,H=large?280:190,L=large?60:34,R=18,T=17,B=34,x=v=>L+(v-xr.min)/(xr.max-xr.min)*(W-L-R),y=v=>H-B-(v-yr.min)/(yr.max-yr.min)*(H-T-B);
 const ticks=Array.from({length:4},(_,i)=>{const xv=xr.min+(xr.max-xr.min)*i/3,yv=yr.min+(yr.max-yr.min)*i/3;return `<line class="rd-chart-grid" x1="${x(xv)}" y1="${T}" x2="${x(xv)}" y2="${H-B}"/><line class="rd-chart-grid" x1="${L}" y1="${y(yv)}" x2="${W-R}" y2="${y(yv)}"/>${large?`<text class="rd-chart-label" x="${x(xv)}" y="${H-B+15}" text-anchor="middle">${xv.toFixed(1)}%</text><text class="rd-chart-label" x="${L-6}" y="${y(yv)+3}" text-anchor="end">${yv.toFixed(1)}%</text>`:''}`;}).join('');
 target.innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="group" aria-label="Sector peer comparison">${ticks}${result.points.map(p=>{const own=p.ticker===data.company.ticker;return `<circle class="rd-peer-point" data-peer="${esc(p.ticker)}" data-primary="${own}" cx="${x(p.x)}" cy="${y(p.y)}" r="${own?6:4.5}" tabindex="0" role="button" aria-label="Compare ${esc(p.name)}: horizontal ${p.x.toFixed(2)} percent; vertical ${p.y.toFixed(2)} percent"><title>${esc(p.name)} · ${p.x.toFixed(2)}% / ${p.y.toFixed(2)}%</title></circle>${own?`<text class="rd-chart-label" x="${Math.min(x(p.x)+9,W-55)}" y="${y(p.y)-9}" fill="#b2d7ff">${esc(p.ticker.replace(/\.NS$/,''))}</text>`:''}`;}).join('')}<text class="rd-chart-label" x="${(L+W-R)/2}" y="${H-3}" text-anchor="middle">${xKey==='revenue_growth'?'Revenue growth':'Net margin'} (%)</text></svg>`;
 for(const dot of target.querySelectorAll('[data-peer]')){const p=result.points.find(item=>item.ticker===dot.dataset.peer);const hover=()=>{const label=$('[data-peer-subtitle]');label.textContent=`${p.ticker.replace(/\.NS$/,'')} · ${p.x.toFixed(1)}% / ${p.y.toFixed(1)}%`;};dot.addEventListener('pointerenter',hover);dot.addEventListener('focus',hover);dot.addEventListener('click',()=>choosePeer(p.ticker));dot.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();choosePeer(p.ticker);}});}
 return result;
}
function renderPeers(){if(!data)return;$('[data-peer-title]').textContent=data.company.sector||'Sector peers';$('[data-peer-subtitle]').textContent='Click a peer to compare';const result=scatter($('[data-peer-chart]'));scatter($('[data-peer-large]'),true);$('[data-peer-coverage]').textContent=`${result.points.length} comparable companies · ${result.omitted} omitted for missing or incompatible data. ${currentPoint()?.label||'No period'}; ${currentPoint()?.basis||'unknown basis'}.${data.peer_total>data.peer_limit?` Sample: ${data.peer_limit} peers; open the full peer table for all ${data.peer_total}.`:''}`;
 const list=$('[data-peer-list]');list.replaceChildren();for(const p of result.points){const button=document.createElement('button');button.type='button';button.textContent=p.ticker.replace(/\.NS$/,'');button.addEventListener('click',()=>choosePeer(p.ticker));list.append(button);}
}
async function choosePeer(ticker){const sequence=++peerSequence,company=data?.company.ticker,generation=dataSequence;if(!company||loading)return;if(ticker===company)return toast('This is the company already in your desk.');try{const peer=await loadCompany(ticker);if(sequence!==peerSequence||generation!==dataSequence||company!==data?.company.ticker)return;compareData=peer;markDirty();setView('explore');renderChart();toast(`${peer.company.name} added to your comparison.`);}catch(error){toast(error.message);}}
function renderTimeline(){const track=$('[data-timeline]');track.replaceChildren();for(const p of data?.points||[]){const button=document.createElement('button');button.type='button';button.className='rd-period';button.textContent=p.label;button.setAttribute('aria-pressed',String(p.period===period));button.addEventListener('click',()=>selectPeriod(p.period));track.append(button);}const slider=$('[data-timeline-slider]');slider.max=String(Math.max((data?.points.length||1)-1,0));slider.value=String(Math.max(data?.points.findIndex(p=>p.period===period)||0,0));slider.disabled=!data?.points.length;slider.setAttribute('aria-valuetext',currentPoint()?.label||'No stored periods');const p=currentPoint();$('[data-period-detail]').textContent=p?`${p.basis} · period ending ${dateLabel(p.period)} · published ${dateLabel(p.published_at)} · stored ${dateLabel(p.fetched_at)}${p.publication_source==='xbrl-board-date'?' · publication date recovered from board approval':''}`:'No annual filing history is stored for this company.';}
function selectPeriod(selected){if(selected===period)return;period=selected;highlighted=selected;scenarioSeed=null;markDirty();renderTimeline();renderChart();renderPeers();renderPreview();if(view==='scenarios')renderScenario();terminal.onData();}
function capturePin(){if(pins.length>=8)return toast('A desk holds up to eight observations. Remove one to pin another.');const point=data.points.find(p=>p.period===(highlighted||period));if(!point)return toast('Choose a disclosed reporting period first.');const pin={id:globalThis.crypto?.randomUUID?.()||`pin-${Date.now()}-${Math.random().toString(16).slice(2)}`,period:point.period,metrics:[...metrics],values:Object.fromEntries(metrics.map(k=>[k,point.values[k]])),sources:Object.fromEntries(metrics.map(k=>[k,point.sources[k]])),basis:point.basis,published_at:point.published_at,fetched_at:point.fetched_at,captured_at:new Date().toISOString()};pins.push(pin);markDirty();renderPins();toast('Observation pinned. Save the desk to keep it.');}
function renderPins(){const list=$('[data-pins]');list.replaceChildren();$('[data-pin-count]').textContent=String(pins.length);if(!pins.length){const empty=document.createElement('p');empty.className='rd-pin-empty';empty.textContent='Something worth keeping? Inspect a chart period and pin your observation here.';list.append(empty);}
 pins.forEach(pin=>{const card=document.createElement('article');card.className='rd-pin';card.innerHTML=`<div class="rd-pin-header"><button class="rd-pin-open" type="button"><span>${esc(metricNames(pin.metrics))}</span><small>${esc(pin.period)} · ${esc(pin.basis)}</small></button><button class="rd-icon-button rd-pin-remove" type="button" aria-label="Remove pinned ${esc(metricNames(pin.metrics))}">×</button></div><div class="rd-pin-values">${pin.metrics.map(key=>`<span>${esc(data.metrics[key]?.label||key)} · ${esc(fmt(pin.values?.[key],data.metrics[key]?.unit))}</span>`).join('')}</div><p class="rd-pin-source">Captured ${esc(dateLabel(pin.captured_at))} · filed sources retained</p>`;card.querySelector('.rd-pin-open').addEventListener('click',()=>openSources(pin));card.querySelector('.rd-pin-remove').addEventListener('click',()=>{pins=pins.filter(p=>p.id!==pin.id);markDirty();renderPins();});list.append(card);});$('[data-private-caption]').textContent=boot.authenticated?'Saved desks and notes are private to your account.':'Temporary evidence · sign in to keep your research.';}
function openSources(pin=null){const point=pin||data?.points.find(p=>p.period===(highlighted||period));const keys=pin?.metrics||metrics;const content=$('[data-source-content]');if(!point){content.innerHTML='<p>No stored annual filing is available for this company.</p>';showDialog($('[data-source-dialog]'));return;}
 content.innerHTML=`<p><strong>${esc(data.company.name)}</strong> · period ending ${esc(point.period)} · ${esc(point.basis)}</p><p>Published: ${esc(dateLabel(point.published_at))}. Stored: ${esc(dateLabel(point.fetched_at))}.${point.publication_source==='xbrl-board-date'?' Publication date recovered from board approval.':''}</p>${pin?`<p>Saved observation captured ${esc(dateLabel(pin.captured_at))}; it keeps the values stored when this pin was first saved.</p>`:''}${keys.map(key=>`<section class="rd-source-entry"><h3>${esc(data.metrics[key]?.label||key)} · ${esc(fmt(point.values?.[key],data.metrics[key]?.unit,false))}</h3><p>Source trace: ${esc(point.sources?.[key]||'Not disclosed')}</p><a href="${esc(url(data.links[data.metrics[key]?.group]||data.links.company))}">Open the filing table and source trace ↗</a></section>`).join('')}${!pin&&data.links.original&&point.period===data.points.at(-1)?.period?`<a class="rd-text-link" target="_blank" rel="noopener noreferrer" href="${esc(url(data.links.original))}">Original NSE filing ↗</a>`:''}<p>${esc(data.coverage)}</p>${(point.corrections||[]).map(line=>`<p>${esc(line)}</p>`).join('')}`;showDialog($('[data-source-dialog]'));}
function renderScenario(){
 const point=currentPoint();if(!point){$('[data-scenario-controls]').replaceChildren();$('[data-scenario-result]').innerHTML='<p class="rd-empty">No stored annual filing is available to anchor a company scenario.</p>';return;}
 if(scenarioSeed!==point.period){if(finite(point.values.net_margin))scenario.margin=Math.max(-20,Math.min(60,Math.round(point.values.net_margin)));scenarioSeed=point.period;}
 for(const button of $$('[data-calculator]'))button.setAttribute('aria-pressed',String(button.dataset.calculator===calculator));
 const controls=$('[data-scenario-controls]');const spec=calculator==='business'?[['growth','Revenue growth per year',-30,40,1,'%'],['margin','Net margin assumption',-20,60,1,'%'],['years','Years to explore',1,10,1,' years']]:calculator==='earnings'?[['growth','EPS growth per year',-30,40,1,'%'],['multiple','Assumed P/E multiple',1,60,1,'×'],['years','Years to explore',1,10,1,' years']]:[['principal','Starting amount',1000,1000000,1000,''],['rate','Annual rate assumption',-20,30,1,'%'],['years','Years to explore',1,10,1,' years']];
 controls.innerHTML=spec.map(([key,label,min,max,step,suffix])=>`<div class="rd-scenario-control"><label for="rd-assumption-${key}">${label}<output data-output="${key}">${key==='principal'?esc(fmt(scenario[key])):esc(scenario[key]+suffix)}</output></label><input id="rd-assumption-${key}" data-assumption="${key}" type="range" min="${min}" max="${max}" step="${step}" value="${scenario[key]}" aria-label="${label}"><small>${min}${suffix} to ${max}${suffix}</small></div>`).join('');
 for(const input of controls.querySelectorAll('[data-assumption]'))input.addEventListener('input',()=>{scenario[input.dataset.assumption]=Number(input.value);const item=spec.find(s=>s[0]===input.dataset.assumption);controls.querySelector(`[data-output="${input.dataset.assumption}"]`).textContent=item[0]==='principal'?fmt(Number(input.value)):input.value+item[5];renderScenarioResult();});
 renderScenarioResult();
}
function renderScenarioResult(){
 const point=currentPoint(),target=$('[data-scenario-result]');if(!point)return;
 let pair='',formula='',curve='';
 if(calculator==='business'){
  const result=businessScenario(point.values.revenue,scenario.growth,scenario.margin,scenario.years);
  if(!result){target.innerHTML='<div class="rd-empty"><strong>No comparable revenue is on file.</strong><span>Try a company with disclosed Revenue from Operations, or use the compound-growth calculator.</span></div>';return;}
  const last=result.at(-1);pair=`<div><small>Scenario revenue · year ${scenario.years}</small><strong>${esc(fmt(last.revenue))}</strong></div><div><small>Scenario net profit</small><strong>${esc(fmt(last.profit))}</strong></div>`;formula=`Base: ${fmt(point.values.revenue)} revenue · ${point.label} · ${point.basis}. Revenue = base × (1 + growth/100)^years. Net profit = scenario revenue × assumed net margin/100.`;
  const range=rangeOf(result.flatMap(p=>[p.revenue,p.profit]));if(range){const y=v=>125-(v-range.min)/(range.max-range.min)*110,x=i=>30+i*490/scenario.years;curve=`<svg viewBox="0 0 550 150" role="img" aria-label="Illustrative revenue and profit under your assumptions">${['revenue','profit'].map((key,i)=>`<path d="${result.map((p,j)=>`${j?'L':'M'}${x(j)},${y(p[key])}`).join(' ')}" fill="none" stroke="${palette[i]}" stroke-width="2" stroke-dasharray="5 4"/>`).join('')}<text class="rd-chart-label" x="30" y="147">Base</text><text class="rd-chart-label" x="470" y="147">Year ${scenario.years}</text></svg>`;}
 }else if(calculator==='earnings'){
  const result=earningsScenario(point.values.diluted_eps,scenario.growth,scenario.multiple,scenario.years);
  if(!result){target.innerHTML='<div class="rd-empty"><strong>A positive filed EPS is needed.</strong><span>This period has no usable EPS for this earnings-multiple scenario.</span></div>';return;}
  pair=`<div><small>Scenario EPS · year ${scenario.years}</small><strong>${esc(fmt(result.futureEps,'INR/share'))}</strong></div><div><small>EPS × your assumed multiple</small><strong>${esc(fmt(result.value,'INR',false))}</strong></div>`;formula=`Base EPS: ${fmt(point.values.diluted_eps,'INR/share')} · ${point.label} · ${point.basis}. Scenario EPS = base EPS × (1 + growth/100)^years. Scenario value = scenario EPS × your P/E multiple. No current market price or target return is used.`;
 }else{
  const result=compound(scenario.principal,scenario.rate,scenario.years);
  if(!result){target.innerHTML='<p>Enter valid assumptions.</p>';return;}
  pair=`<div><small>Scenario amount · ${scenario.years} years</small><strong>${esc(fmt(result.amount))}</strong></div><div><small>Change from your starting amount</small><strong>${esc(fmt(result.interest))}</strong></div>`;formula='Amount = principal × (1 + rate/100)^years. Annual compounding. Your rate is an assumption; tax, fees and inflation are excluded.';
 }
 target.innerHTML=`<div class="rd-result-pair">${pair}</div>${curve}<p class="rd-scenario-formula">${esc(formula)}</p><button class="rd-text-link rd-scenario-save" type="button" data-keep-scenario>Keep these assumptions in my notes →</button>`;
 target.querySelector('[data-keep-scenario]').addEventListener('click',()=>{if(!boot.authenticated)return requireSignIn();const note=$('[data-note-input]');const addition=`\n\n${calculator==='compound'?'Compound growth':'Company scenario'} · ${point.label}\n${formula}\nMy assumptions: ${JSON.stringify(scenario)}`;if(note.value.length+addition.length>6000)return toast('Your notes are near the 6,000-character limit.');note.value+=addition;markDirty();syncNotes();setView('notes');});
}
function syncNotes(){$('[data-note-count]').textContent=`${$('[data-note-input]').value.length.toLocaleString('en-IN')} / 6,000`;}
function setView(next){const previous=view;view=next;if(previous!==next)markDirty();for(const button of $$('[data-view]')){if(button.dataset.view===view)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');}for(const name of ['explore','peers','scenarios','notes','charts','valuation','derivatives','changes','thesis'])$(`[data-${name}-panel]`).hidden=name!==view;if(view==='scenarios')renderScenario();if(view==='peers')renderPeers();terminal.onView(view);$('.rd-timeline').hidden=!['explore','peers','scenarios'].includes(view);if(view==='notes'&&boot.authenticated)setTimeout(()=>$('[data-note-input]').focus({preventScroll:true}),0);}
function renderAll(){
 const has=!!data;$('[data-workspace]').hidden=!has;if(!has){notice(`No stored company matches “${boot.requested_ticker}”. Choose another company to begin.`);return;}
 $('[data-company-heading]').textContent=`${data.company.ticker.replace(/\.NS$/,'')} research`;$('[data-company-name]').textContent=data.company.name;$('[data-company-button]').textContent=`${data.company.ticker.replace(/\.NS$/,'')} ⌄`;$('[data-company-monogram]').textContent=data.company.ticker.replace(/\.NS$/,'').slice(0,4);$('[data-coverage]').textContent=data.coverage;
 setLinks();renderDesks();renderMetrics();renderPreview();renderChart();renderPeers();renderTimeline();renderPins();syncNotes();
 $('[data-title-input]').disabled=!boot.authenticated;$('[data-note-input]').disabled=!boot.authenticated;
 $('[data-note-auth]').innerHTML=boot.authenticated?'':`<a href="${esc(url(boot.login_url))}">Sign in to write private notes and save this desk.</a>`;
 notice(!data.points.length?'No annual filing history is stored for this company. Original company and Charting links remain available.':null);
 setView(view);
}
function resetDesk(company){const previousView=view;data=company;terminal.reset();compareData=null;current=null;pins=[];metrics=defaultMetrics();period=data.points.at(-1)?.period??null;highlighted=period;mode=metrics.includes('net_margin')?'raw':'indexed';view=previousView;scenarioSeed=null;dirty=false;$('[data-title-input]').value=`${data.company.ticker.replace(/\.NS$/,'')} research`;$('[data-note-input]').value='';$('[data-save-status]').textContent=boot.authenticated?'New desk':'Explore · sign in to save';$('[data-save-status]').dataset.saved='false';renderAll();updateLocation();}
async function openDesk(desk){
 const sequence=++dataSequence;loading=true;$('[data-workspace]').classList.add('rd-loading');
 try{const company=await loadCompany(desk.company);const comparison=desk.compare?await loadCompany(desk.compare).catch(()=>null):null;if(sequence!==dataSequence)return;data=company;compareData=comparison;current=desk;terminal.restore(desk.terminal);view=desk.terminal?.view||'explore';pins=structuredClone(desk.pins||[]);metrics=desk.metrics.filter(key=>data.metrics[key]);if(!metrics.length)metrics=defaultMetrics();period=data.points.some(p=>p.period===desk.period)?desk.period:data.points.at(-1)?.period??null;highlighted=period;mode=desk.mode;scenarioSeed=null;dirty=false;$('[data-title-input]').value=desk.title;$('[data-note-input]').value=desk.note||'';$('[data-save-status]').textContent='Saved';$('[data-save-status]').dataset.saved='true';renderAll();updateLocation();closeSidebar();}catch(error){toast(error.message);}finally{if(sequence===dataSequence){loading=false;$('[data-workspace]').classList.remove('rd-loading');}}
}
function updateLocation(){if(!data)return;const query=new URLSearchParams({company:data.company.ticker});if(current?.id)query.set('desk',current.id);history.replaceState(null,'',`${location.pathname}?${query}`);boot.login_url=boot.login_url.split('?next=')[0]+'?next='+encodeURIComponent(location.pathname+'?'+query);}
function requireSignIn(){toast('Sign in to save private desks and notes.');const box=$('[data-note-auth]');box.innerHTML=`<a href="${esc(url(boot.login_url))}">Sign in to save your research →</a>`;setView('notes');}
async function saveDesk(){
 if(!boot.authenticated){requireSignIn();return false;}if(!data||loading)return false;if(!terminal.ratesValid()){toast('Correct the comparison discount rates before saving.');return false;}if(saveInFlight)return saveInFlight;
 const revision=editRevision;const buttons=$$('[data-action="save"]');buttons.forEach(button=>button.disabled=true);$('[data-save-status]').textContent='Saving…';
 const payload={id:current?.id??null,updated_at:current?.updated_at??null,company:data.company.ticker,title:$('[data-title-input]').value.trim()||`${data.company.ticker.replace(/\.NS$/,'')} research`,note:$('[data-note-input]').value,metrics,period,mode,compare:compareData?.company.ticker??null,pins,terminal:terminal.exportState(),review_baseline:terminal.reviewRequested()};
 saveInFlight=(async()=>{try{const result=await request(boot.state_url,{method:'POST',headers:{'Content-Type':'application/json','X-CSRFToken':csrf},body:JSON.stringify(payload)});current=result.desk;if(editRevision===revision)pins=structuredClone(current.pins);else pins=pins.map(pin=>current.pins.find(saved=>saved.id===pin.id)||pin);desks=[current,...desks.filter(d=>d.id!==current.id)];dirty=editRevision!==revision;$('[data-save-status]').textContent=dirty?'Unsaved changes':'Saved';$('[data-save-status]').dataset.saved=String(!dirty);renderDesks();renderPins();terminal.renderChanges();updateLocation();toast(dirty?'Snapshot saved. Your newer edits still need saving.':'Desk saved to your account.');return !dirty;}catch(error){$('[data-save-status]').textContent='Not saved';$('[data-save-status]').dataset.saved='false';notice(error.message);if(error.status===401){boot.authenticated=false;desks=[];current=null;renderDesks();$('[data-note-input]').disabled=true;$('[data-title-input]').disabled=true;}return false;}finally{buttons.forEach(button=>button.disabled=false);saveInFlight=null;}})();return saveInFlight;
}
function navigate(action){if(loading||saveInFlight)return;if(!dirty){action();return;}pendingNavigation=action;showDialog($('[data-unsaved-dialog]'));}
async function deleteDesk(desk,button){
 if(button.dataset.confirm!=='true'){button.dataset.confirm='true';button.textContent='✓';button.setAttribute('aria-label',`Confirm deletion of ${desk.title}`);toast('Click the check mark again to delete this saved desk.');setTimeout(()=>{if(button.isConnected){button.dataset.confirm='false';button.textContent='×';button.setAttribute('aria-label',`Delete ${desk.title}`);}},5000);return;}
 try{await request(boot.state_url,{method:'POST',headers:{'Content-Type':'application/json','X-CSRFToken':csrf},body:JSON.stringify({action:'delete',id:desk.id,updated_at:desk.updated_at})});desks=desks.filter(item=>item.id!==desk.id);if(current?.id===desk.id)resetDesk(data);else renderDesks();toast('Desk deleted.');}catch(error){toast(error.message);}
}
function showDialog(dialog){if(!dialog.open)dialog.showModal();}
function closeSidebar(){$('.rd-sidebar').dataset.open='false';$('[data-action="sidebar"]').setAttribute('aria-expanded','false');}
function openSearch(purpose='company'){searchPurpose=purpose;$('#rd-search-title').textContent=purpose==='compare'?'Add a comparison.':'Choose a company.';$('[data-search-input]').value='';showDialog($('[data-search-dialog]'));$('[data-search-input]').focus();searchCompanies('');}
async function searchCompanies(query){const sequence=++searchSequence;searchAbort?.abort();searchAbort=new AbortController();$('[data-search-status]').textContent='Finding companies…';try{const result=await request(boot.search_url+'?q='+encodeURIComponent(query),{signal:searchAbort.signal});if(sequence!==searchSequence)return;const list=$('[data-search-results]');list.replaceChildren();for(const company of result.companies){const button=document.createElement('button');button.type='button';button.className='rd-search-result';button.innerHTML=`<strong>${esc(company.ticker.replace(/\.NS$/,''))}</strong><small>${esc(company.name)} · ${esc(company.sector||'Sector not recorded')}</small>`;button.addEventListener('click',()=>{if(searchPurpose==='compare'){choosePeer(company.ticker);$('[data-search-dialog]').close();}else{$('[data-search-dialog]').close();navigate(()=>switchCompany(company.ticker));}});list.append(button);}$('[data-search-status]').textContent=result.companies.length?'Choose a company to explore.':'No matching company. Try its NSE symbol or full name.';}catch(error){if(sequence===searchSequence)$('[data-search-status]').textContent=error.message;}}
async function switchCompany(ticker){const sequence=++dataSequence;dataAbort?.abort();dataAbort=new AbortController();loading=true;$('[data-workspace]').classList.add('rd-loading');try{const company=await loadCompany(ticker,dataAbort.signal);if(sequence!==dataSequence)return;resetDesk(company);closeSidebar();}catch(error){if(sequence===dataSequence)toast(error.message);}finally{if(sequence===dataSequence){loading=false;$('[data-workspace]').classList.remove('rd-loading');}}}


const terminal=createTerminal({$,$$,esc,fmt,dateLabel,changed:markDirty,toast,getData:()=>data,getPoint:currentPoint,getPins:()=>pins,getDesk:()=>current,setView,request,url,authenticated:()=>boot.authenticated,save:saveDesk,refresh:async()=>{const company=data?.company.ticker,generation=dataSequence;if(!company)return;const latest=await request(boot.data_url.replace('SYMBOL',encodeURIComponent(company)));if(company!==data?.company.ticker||generation!==dataSequence)return;data=latest;loaded.set(company,latest);renderAll();}});
terminal.restore(null);
for(const link of $$('[data-lens=price]'))link.addEventListener('click',event=>{event.preventDefault();setView('charts');});

document.addEventListener('click',event=>{
 const action=event.target.closest('[data-action]')?.dataset.action;
 if(action==='search')openSearch();if(action==='compare')openSearch('compare');if(action==='save')saveDesk();if(action==='new')navigate(()=>{if(data)resetDesk(data);else openSearch();});if(action==='source')openSources();if(action==='pin')capturePin();if(action==='notes')setView('notes');if(action==='peers')setView('peers');
 if(action==='sidebar'){const sidebar=$('.rd-sidebar');const open=sidebar.dataset.open!=='true';sidebar.dataset.open=String(open);$('[data-action="sidebar"]').setAttribute('aria-expanded',String(open));}
 if(action==='navigator'){const panel=$('.rd-navigator');const collapsed=panel.dataset.collapsed!=='true';panel.dataset.collapsed=String(collapsed);const button=event.target.closest('button');button.textContent=collapsed?'+':'−';button.setAttribute('aria-expanded',String(!collapsed));button.setAttribute('aria-label',collapsed?'Expand company navigator':'Collapse company navigator');}
 const selectedView=event.target.closest('[data-view]')?.dataset.view;if(selectedView)setView(selectedView);
 const selectedMode=event.target.closest('[data-mode]')?.dataset.mode;if(selectedMode){mode=selectedMode;markDirty();renderChart();}
 const selectedCalc=event.target.closest('[data-calculator]')?.dataset.calculator;if(selectedCalc){calculator=selectedCalc;renderScenario();}
 const lens=event.target.closest('[data-open-lens]')?.dataset.openLens;if(lens)activateLens(lens);
 const close=event.target.closest('[data-close-dialog]');if(close)close.closest('dialog').close();
});
for(const control of $$('[data-lens]')){control.addEventListener('pointerenter',()=>renderPreview(control.dataset.lens));control.addEventListener('focus',()=>renderPreview(control.dataset.lens));if(control.tagName==='BUTTON')control.addEventListener('click',()=>activateLens(control.dataset.lens));}
const orbit=$('[data-orbit]');let frame=null;orbit.addEventListener('pointermove',event=>{if(!matchMedia('(hover:hover) and (pointer:fine)').matches||matchMedia('(prefers-reduced-motion:reduce)').matches)return;cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{const bounds=orbit.getBoundingClientRect();const dx=(event.clientX-bounds.left)/bounds.width-.5,dy=(event.clientY-bounds.top)/bounds.height-.5;orbit.style.setProperty('--rd-tilt-y',`${Math.max(-14,Math.min(4,dx*12-6))}deg`);orbit.style.setProperty('--rd-tilt-x',`${-dy*5}deg`);});});orbit.addEventListener('pointerleave',()=>{cancelAnimationFrame(frame);orbit.style.setProperty('--rd-tilt-y','-10deg');orbit.style.setProperty('--rd-tilt-x','0deg');});
for(const select of $$('[data-peer-x],[data-peer-y]'))select.addEventListener('change',renderPeers);
$('[data-timeline-slider]').addEventListener('input',event=>{const point=data?.points[Number(event.target.value)];if(point)selectPeriod(point.period);});
$('[data-note-input]').addEventListener('input',()=>{markDirty();syncNotes();});$('[data-title-input]').addEventListener('input',markDirty);
let searchTimer;$('[data-search-input]').addEventListener('input',event=>{clearTimeout(searchTimer);const query=event.target.value;searchTimer=setTimeout(()=>searchCompanies(query),180);});
for(const button of $$('[data-unsaved]'))button.addEventListener('click',async()=>{const choice=button.dataset.unsaved;const action=pendingNavigation;pendingNavigation=null;$('[data-unsaved-dialog]').close();if(choice==='discard'){dirty=false;action?.();}else if(choice==='save'&&await saveDesk())action?.();});
document.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();openSearch();}if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='s'){event.preventDefault();saveDesk();}});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&$('.rd-sidebar').dataset.open==='true'){closeSidebar();$('[data-action="sidebar"]').focus();}});
window.addEventListener('beforeunload',event=>{if(dirty&&boot.authenticated){event.preventDefault();event.returnValue='';}});
document.addEventListener('pointerdown',event=>{if(matchMedia('(max-width:700px)').matches&&$('.rd-sidebar').dataset.open==='true'&&!event.target.closest('.rd-sidebar,[data-action="sidebar"]'))closeSidebar();});
async function init(){
 if(data){metrics=defaultMetrics();$('[data-title-input]').value=`${data.company.ticker.replace(/\.NS$/,'')} research`;renderAll();}
 else renderAll();
 if(boot.authenticated){try{const result=await request(boot.state_url);desks=result.desks;renderDesks();const id=Number(new URLSearchParams(location.search).get('desk'));const requested=desks.find(d=>d.id===id);if(requested&&!dirty)await openDesk(requested);else if(id)notice('That saved desk is not available in this account.');}catch(error){notice(error.message);}}
}
init();
}
