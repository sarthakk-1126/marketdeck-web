const operand = (kind, period, field='close', value) => kind==='constant'?{kind,value}:{kind,field,...(period?{period}: {})};
const row = (left,op,right) => ({left,op,right});
const group = conditions => ({mode:'all',conditions});
export function recipe(name='momentum') {
 const fast=operand('sma',20),slow=operand('sma',50);
 if(name==='breakout')return {schema:1,entry:group([row(operand('price'), 'above', operand('high',20)),row(operand('volume',null,'volume'),'above',operand('sma',20,'volume'))]),exit:group([row(operand('price'),'below',operand('low',10))])};
 return {schema:1,entry:group([row(fast,'crosses_above',slow),...(name==='momentum'?[row(operand('rsi',14),'above',operand('constant',null,null,50))]:[])]),exit:group([row(fast,'crosses_below',slow)])};
}
// PostgreSQL JSONB and different clients need not preserve object key order.
export function canonical(value){return JSON.stringify(normalize(value));}
function normalize(value){return Array.isArray(value)?value.map(normalize):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(k=>[k,normalize(value[k])])):value;}
export const matched = (a,b) => a.dataset===b.dataset && canonical(a.assumptions)===canonical(b.assumptions);
export function highlightPython(source){
 const escape=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const tokens=/(#[^\n]*|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|\b(?:def|return|if|elif|else|for|in|while|import|from|as|class|True|False|None|and|or|not|try|except|raise|with|lambda)\b|\b\d+(?:\.\d+)?\b)/g;
 let out='',begin=0;for(const token of source.matchAll(tokens)){out+=escape(source.slice(begin,token.index));const value=token[0],kind=value.startsWith('#')?'comment':/^["']/.test(value)?'string':'keyword';out+=`<span class="sl-code-${kind}">${escape(value)}</span>`;begin=token.index+value.length;}return out+escape(source.slice(begin))+'\n';
}
export function replayPrefix(run, cursor) {
 const day=run.dataset.bars[cursor]?.date;
 if(!day)return {bars:[],curve:[],events:[],trades:[],decisions:[]};
 const result=run.result;
 return {bars:run.dataset.bars.slice(0,cursor+1),curve:result.curve.filter(p=>p.date<=day),
  decisions:result.decisions.filter(p=>p.date<=day),trades:result.trades.filter(p=>p.exit_date<=day),
  events:result.events.filter(p=>p.date<=day).map(p=>(p.resolved_date||p.fill_date)>day?{id:p.id,date:p.date,side:p.side,conditions:p.conditions,status:'unfilled',reason:'Awaiting next supported session open'}:{...p})};
}

export function createStrategyLab(api) {
 const {$,$$,esc,toast,getData,getDesk,request,labURL,csrf}=api;
 const root=$('[data-lab-panel]');if(!root)return null;
 let company=null,project=null,versions=[],runRecords=[],datasets=[],data=null,run=null,version=null,comparison=null;
 let rules=recipe(),mode='build',editor='visual',cursor=0,dirty=true,touched=false,assumptionsDirty=false,busy=false,playing=null,selectedEvent=null,generation=0;
 const pending=new Map();
 const q=s=>root.querySelector(s), qa=s=>[...root.querySelectorAll(s)];
 const money=v=>Number.isFinite(v)?'₹'+v.toLocaleString('en-IN',{maximumFractionDigits:2}):'Unavailable';
 const pct=v=>Number.isFinite(v)?v.toFixed(2)+'%':'Unavailable';
 const num=v=>Number.isFinite(v)?v.toLocaleString('en-IN',{maximumFractionDigits:4}):'Unavailable';
 const status=message=>{q('[data-sl-status]').textContent=message;};
 const field=(key)=>q('[data-sl-assumption="'+key+'"]');
 const highlightCode=()=>q('[data-sl-code-highlight]').innerHTML=highlightPython(q('[data-sl-code]').value);
 function config(){return Object.fromEntries(qa('[data-sl-assumption]').map(el=>[el.dataset.slAssumption,el.type==='date'?el.value:el.value===''?null:Number(el.value)]));}
 function stale(){return dirty||assumptionsDirty||!run||run.version!==version?.id||canonical(run.result.strategy)!==canonical(rules)||canonical(run.result.config)!==canonical(config());}
 function changed(){dirty=true;touched=true;pause();saveState();}
 function saveState(){highlightCode();q('[data-sl-save-status]').textContent=dirty?'Draft · unsaved changes':`Version ${version?.number??'draft'} · saved`;q('[data-sl-result-state]').textContent=!run?'Run a test to compare with buy & hold.':stale()?'Outdated results · run a new test for this configuration.':'Results match this configuration · replay follows the cursor.';q('[data-sl-result-state]').dataset.stale=String(!!run&&stale());}
 async function post(operation,body,id=project?.id){
  const key=operation+JSON.stringify(body),requestId=pending.get(key)||crypto.randomUUID();pending.set(key,requestId);
  const href=operation==='create'?labURL+'projects/':operation==='dataset'?labURL+'dataset/':labURL+'project/'+id+'/'+operation+'/';
  const result=await request(href,{method:'POST',headers:{'Content-Type':'application/json','X-CSRFToken':csrf},body:JSON.stringify({...body,request_id:requestId})});pending.delete(key);return result;
 }
 const kinds={price:'Price',volume:'Volume',sma:'SMA',ema:'EMA',rsi:'RSI',high:'Previous high',low:'Previous low',constant:'Number'};
 const ops={above:'above',below:'below',crosses_above:'crosses above',crosses_below:'crosses below'};
 const name=o=>o.kind==='constant'?String(o.value):kinds[o.kind]+(o.period?' '+o.period:'')+(o.field==='volume'&&o.kind!=='volume'?' (volume)':'');
 function operandForm(o,side,index,part){const attr=`data-sl-rule="${side}" data-index="${index}" data-part="${part}"`;
  return `<div class="sl-operand"><select ${attr} data-key="kind" aria-label="${side} condition ${index+1} ${part} indicator">${Object.entries(kinds).map(([k,v])=>`<option value="${k}" ${o.kind===k?'selected':''}>${v}</option>`).join('')}</select>${o.kind==='constant'?`<input ${attr} data-key="value" type="number" step="any" value="${o.value}" aria-label="${part} threshold">`:['sma','ema','rsi','high','low'].includes(o.kind)?`<input ${attr} data-key="period" type="number" min="2" max="250" value="${o.period}" aria-label="${part} indicator period">`:''}${['sma','ema'].includes(o.kind)?`<select ${attr} data-key="field" aria-label="${part} source field"><option value="close" ${o.field!=='volume'?'selected':''}>Close</option><option value="volume" ${o.field==='volume'?'selected':''}>Volume</option></select>`:''}</div>`;
 }
 function renderRules(){for(const side of ['entry','exit']){q('[data-sl-'+side+']').innerHTML=`<fieldset class="sl-group"><legend>${side.toUpperCase()}</legend><label class="sl-group-mode">Match<select data-sl-group="${side}" aria-label="${side} condition grouping"><option value="all" ${rules[side].mode==='all'?'selected':''}>All conditions</option><option value="any" ${rules[side].mode==='any'?'selected':''}>Any condition</option></select></label>${rules[side].conditions.map((c,i)=>`<div class="sl-condition" data-sl-highlight="${esc(JSON.stringify(c.left))}">${operandForm(c.left,side,i,'left')}<div class="sl-comparison"><select data-sl-op="${side}" data-index="${i}" aria-label="${side} condition ${i+1} comparison">${Object.entries(ops).map(([k,v])=>`<option value="${k}" ${c.op===k?'selected':''}>${v}</option>`).join('')}</select><button type="button" class="rd-icon-button" data-sl-remove="${side}" data-index="${i}" aria-label="Remove ${side} condition ${i+1}" ${rules[side].conditions.length===1?'disabled':''}>×</button></div>${operandForm(c.right,side,i,'right')}</div>`).join('')}<button type="button" class="rd-text-link" data-sl-add="${side}" ${rules[side].conditions.length>=6?'disabled':''}>+ Add condition</button></fieldset>`;}
  summary();
 }
 function summary(){q('[data-sl-summary]').textContent=['entry','exit'].map(side=>`${side==='entry'?'Enter':'Exit'} when ${rules[side].conditions.map(c=>name(c.left)+' '+ops[c.op]+' '+name(c.right)).join(rules[side].mode==='all'?' and ':' or ')}.`).join(' ');}
 function renderProjects(items){q('[data-sl-project]').innerHTML='<option value="">New project</option>'+items.map(p=>`<option value="${p.id}" ${p.id===project?.id?'selected':''}>${esc(p.name)}</option>`).join('');}
 function renderVersions(){q('[data-sl-version]').innerHTML='<option value="">Draft</option>'+versions.map(v=>`<option value="${v.id}" ${v.id===version?.id?'selected':''}>Version ${v.number}</option>`).join('');q('[data-sl-compare]').innerHTML='<option value="">Choose a matching run</option>'+runRecords.filter(r=>r.id!==run?.id).map(r=>`<option value="${r.id}">v${versions.find(v=>v.id===r.version)?.number??'?'} · ${r.created_at.slice(0,10)}</option>`).join('');}
 function applyProject(p){project=p;q('[data-sl-name]').value=p.name;q('[data-sl-hypothesis]').value=p.hypothesis;q('[data-sl-code]').value=p.python_source;rules=structuredClone(p.draft);dirty=false;renderRules();saveState();}
 async function openProject(id){
  const g=++generation;pause();const response=await request(labURL+'project/'+id+'/');if(g!==generation)return;
  applyProject(response.project);q('[data-sl-project]').value=project.id;versions=response.versions;runRecords=response.runs;version=versions.find(v=>canonical(v.strategy)===canonical(project.draft)&&v.python_source===project.python_source)||null;renderVersions();
  run=comparison=null;data=null;selectedEvent=null;const params=new URLSearchParams(location.search),requestedRun=runRecords.find(r=>r.id===params.get('lab_run'))||runRecords[0];if(requestedRun){const saved=await request(labURL+'run/'+requestedRun.id+'/');if(g!==generation)return;run=saved;data=saved.dataset;setConfig(run.result.config);cursor=data.bars.findIndex(b=>b.date===run.result.actual_end);const eventId=params.get('lab_event');if(eventId!==null){const ev=run.result.events.find(e=>e.id===Number(eventId));if(ev){selectedEvent=ev.id;cursor=data.bars.findIndex(b=>b.date===ev.date);}}}
  if(response.monitors?.length)renderMonitor(response.monitors.find(m=>m.version===version?.id)||response.monitors[0]);updateURL();render();
 }
 function updateURL(){const u=new URL(location.href);if(getDesk()?.id)u.searchParams.set('desk',getDesk().id);if(project)u.searchParams.set('lab_project',project.id);else u.searchParams.delete('lab_project');history.replaceState(null,'',u.pathname+u.search);}
 async function save(){
  const body={name:q('[data-sl-name]').value,hypothesis:q('[data-sl-hypothesis]').value,strategy:rules,python_source:q('[data-sl-code]').value};
  if(!project){const result=await post('create',{...body,company,desk:getDesk()?.id??null});project=result.project;}
  const result=await post('save_version',{...body,revision:project.revision});project=result.project;version=result.version;rules=structuredClone(version.strategy);versions=[version,...versions];dirty=false;renderRules();renderVersions();renderProjects((await request(labURL+'projects/?company='+encodeURIComponent(company))).projects);updateURL();saveState();status(`Version ${version.number} saved privately.`);return version;
 }
 async function saveDraft(){const body={name:q('[data-sl-name]').value,hypothesis:q('[data-sl-hypothesis]').value,strategy:rules,python_source:q('[data-sl-code]').value};try{const result=project?await post('update',{...body,revision:project.revision}):await post('create',{...body,company,desk:getDesk()?.id??null});project=result.project;dirty=false;touched=false;updateURL();saveState();return true;}catch(error){status(error.message);return false;}}
 function setConfig(c){for(const [k,v] of Object.entries(c))if(field(k))field(k).value=v;assumptionsDirty=false;}
 function selectDataset(d){data=d;cursor=data.bars.length-1;selectedEvent=null;const startIndex=Math.max(Math.min(250,Math.floor(data.bars.length/4)),data.bars.length-750),start=data.bars[startIndex].date;setConfig({...config(),start,end:data.actual_end,reserved_start:data.bars[Math.max(startIndex,Math.floor(data.bars.length*.8))].date});run=null;comparison=null;render();}
 async function sources(){q('[data-sl-source-dialog]').showModal();if(!api.authenticated()){q('[data-sl-readiness]').textContent='Sign in to import and test private research data.';return;}const g=generation;const response=await request(labURL+'datasets/?company='+encodeURIComponent(company));if(g!==generation)return;datasets=response.datasets;q('[data-sl-readiness]').innerHTML=`<p><strong>Stored coverage</strong> · ${response.stored_readiness.count} bars · ${esc(response.stored_readiness.start??'No start')} → ${esc(response.stored_readiness.end??'No end')}</p><p>${esc(response.stored_readiness.reason)}</p>`;q('[data-sl-dataset]').innerHTML='<option value="">Choose a dataset</option>'+datasets.map(d=>`<option value="${d.id}" ${d.id===data?.id?'selected':''}>${esc(d.metadata.source)} · ${d.bar_count} bars · ${d.actual_start} → ${d.actual_end}</option>`).join('');}
 async function execute(){
  if(editor==='python')throw Error('Python execution is unavailable. Export your code or choose Visual to test structured rules.');
  if(!data)throw Error('Import a consistent daily dataset in Sources & dates first.');
  if(dirty||!version)await save();const g=generation;
  const response=await post('run',{version:version.id,dataset:data.id,assumptions:config()});if(g!==generation)return;
  run=response.run;comparison=null;q('[data-sl-comparison]').replaceChildren();data=run.dataset;cursor=data.bars.findIndex(b=>b.date===run.result.actual_end);selectedEvent=null;assumptionsDirty=false;
  runRecords=[{id:run.id,version:version.id,dataset:data.id,assumptions:run.result.config,summary:run.result.summary,created_at:new Date().toISOString()},...runRecords];
  setMode('test');renderVersions();render();status(`Test recorded on ${run.result.actual_start} → ${run.result.actual_end}. ${run.result.summary.completed_trades<5?'Small completed-trade sample; inspect the records.':''}`);
 }
 function chart(){
  if(!data?.bars.length)return;
  const visible=run?replayPrefix(run,cursor):{bars:data.bars.slice(0,cursor+1),events:[]},all=visible.bars,offset=Math.max(0,all.length-(matchMedia('(max-width:820px)').matches?60:100)),bars=all.slice(offset);
  q('[data-sl-chart-caption]').textContent=`Daily · ${data.metadata.source} · ${data.metadata.basis} · through ${all.at(-1)?.date}`;
  q('[data-sl-data-note]').textContent=`${data.metadata.source} · ${data.metadata.basis}. Content ${data.fingerprint.slice(0,12)}. Completed cutoff ${data.metadata.completed_through}. ${data.provenance}. Imported inventory includes ${data.bar_count} supplied sessions. No filing conditions are evaluated.`;
  const valid=bars.filter(b=>b.close!==null);if(!valid.length){q('[data-sl-chart]').textContent='No completed price in this replay prefix.';return;}
  const W=Math.max(290,Math.min(900,q('[data-sl-chart]').clientWidth-16)),H=350,L=12,R=65,T=28,B=32,x=i=>L+(W-L-R)*(i+.5)/bars.length;
  const priceKeys=run?Object.keys(run.result.indicators).filter(k=>{const o=JSON.parse(k);return o.kind!=='constant'&&o.kind!=='rsi'&&o.field!=='volume';}):[];
  const ext=priceKeys.flatMap(k=>run.result.indicators[k].slice(offset,cursor+1).filter(Number.isFinite));
  const min=Math.min(...valid.map(b=>b.low??b.close),...ext),max=Math.max(...valid.map(b=>b.high??b.close),...ext),span=(max-min)||max*.05||1;
  const y=v=>H-B-((v-min)/span)*(H-B-T),cw=Math.min(7,(W-L-R)/bars.length*.65);
  let svg=Array.from({length:5},(_,i)=>{const v=min+span*i/4;return `<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" class="sl-grid"/><text x="${W-R+9}" y="${y(v)+4}">${v.toLocaleString('en-IN',{maximumFractionDigits:2})}</text>`;}).join('');
  svg+=bars.map((b,i)=>b.close===null?'':`<g class="sl-candle ${b.close>=(b.open??b.close)?'sl-up':'sl-down'}"><line x1="${x(i)}" x2="${x(i)}" y1="${y(b.high??b.close)}" y2="${y(b.low??b.close)}"/><rect x="${x(i)-cw/2}" y="${Math.min(y(b.open??b.close),y(b.close))}" width="${cw}" height="${Math.max(1,Math.abs(y(b.close)-y(b.open??b.close)))}"/></g>`).join('');
  priceKeys.forEach((k,j)=>{let path='',known=false;run.result.indicators[k].slice(offset,cursor+1).forEach((v,i)=>{if(v===null){known=false;return;}path+=(known?'L':'M')+x(i)+','+y(v)+' ';known=true;});svg+=`<path data-sl-line="${esc(k)}" d="${path}" class="sl-indicator sl-line-${j%3}"/>`;});
  for(const ev of visible.events){const i=bars.findIndex(b=>b.date===ev.date);if(i<0)continue;const cy=y(bars[i].close)+ (ev.side==='entry'?16:-16);svg+=`<g role="button" tabindex="0" data-sl-event="${ev.id}" aria-label="Inspect ${ev.side} decision ${ev.date}"><circle cx="${x(i)}" cy="${cy}" r="7" class="sl-marker"/><text x="${x(i)}" y="${cy+3}" text-anchor="middle">${ev.side==='entry'?'+':'−'}</text></g>`;}
  svg+=`<text x="${L}" y="${H-8}">${bars[0].date}</text><text x="${W-R}" y="${H-8}" text-anchor="end">${bars.at(-1).date}</text>`;
  q('[data-sl-chart]').innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="group" aria-label="Historical daily candles through ${bars.at(-1).date}; future bars excluded">${svg}</svg>`;
  q('[data-sl-legend]').innerHTML=priceKeys.map((k,j)=>`<span class="sl-key sl-line-${j%3}">${esc(name(JSON.parse(k)))}</span>`).join('')+`<span class="sl-tag">Future bars hidden</span>`;
  const slider=q('[data-sl-cursor]');slider.disabled=false;slider.max=lastCursor();slider.min=run?Math.max(0,data.bars.findIndex(b=>b.date===run.result.actual_start)):0;slider.value=cursor;slider.setAttribute('aria-valuetext',all.at(-1).date);q('[data-sl-cursor-date]').textContent=all.at(-1).date;
 }
 function inspector(){
  if(!run){q('[data-sl-inspector]').innerHTML='<p>Run the saved visual rules to see exact completed-bar evaluations.</p>';return;}
  const prefix=replayPrefix(run,cursor),day=data.bars[cursor].date;
  const event=prefix.events.find(e=>e.id===selectedEvent);
  const decision=prefix.decisions.at(-1);if(!decision){q('[data-sl-inspector]').textContent='Indicator warm-up precedes the tradable test window.';return;}
  const side=event?.side||decision.side,rows=event?.conditions||decision[side].conditions;
  q('[data-sl-inspector]').innerHTML=`<p>Decision ${esc(event?.date||day)} · replay through ${esc(day)} · ${side==='entry'?'Entry':'Exit'} evaluation</p><ul class="sl-explanations">${rows.map(c=>`<li><span class="sl-check">${c.passed===null?'?':c.passed?'✓':'○'}</span><div><strong>${esc(name(c.left)+' '+ops[c.op]+' '+name(c.right))}</strong><p>${esc(num(c.left_value))} ${esc(ops[c.op])} ${esc(num(c.right_value))}</p>${c.op.startsWith('crosses')?`<p>Previous: ${num(c.previous_left)} / ${num(c.previous_right)}</p>`:''}<small>${esc(c.reason)}</small></div></li>`).join('')}</ul><div class="sl-execution"><strong>Signal at close · simulated fill next session</strong><p>${event?event.fill_date?`${event.status} ${event.fill_date} · ${money(event.fill_price)} · ${num(event.shares)} shares · fee ${money(event.fee)}`:esc(event.reason):'No new order at this close.'}</p><p>Fee ${run.result.config.fee_bps} bps + ${money(run.result.config.fixed_fee)} / fill. Slippage ${run.result.config.slippage_bps} bps / side.</p></div><p class="sl-note">${esc(data.metadata.source)} · ${esc(data.metadata.basis)}. ${run.warmup_bars??run.result.warmup_bars} preceding bars. Future filings and financial conditions are excluded.</p>`;
 }
 function curveSVG(points,benchmark){if(!points.length)return '';const values=[...points.map(p=>p.equity),...benchmark.map(p=>p.equity)],lo=Math.min(...values),span=Math.max(...values)-lo||1,x=i=>10+i*630/Math.max(points.length-1,1),y=v=>115-(v-lo)/span*95;const line=rows=>rows.map((p,i)=>(i?'L':'M')+x(i)+','+y(p.equity)).join(' ');return `<svg viewBox="0 0 660 170" role="img" aria-label="Strategy equity, matched buy and hold, and drawdown through the replay cursor"><path class="sl-indicator sl-line-0" d="${line(points)}"/><path class="sl-indicator sl-line-1" d="${line(benchmark)}"/><path class="sl-drawdown" d="${points.map((p,i)=>(i?'L':'M')+x(i)+','+(138+p.drawdown_pct/100*20)).join(' ')}"/><text x="10" y="165">Equity · strategy / buy &amp; hold · drawdown below</text></svg>`;}
 function results(){if(!run){q('[data-sl-results]').innerHTML='<p class="sl-note">Your explicit test will record its dataset, version and assumptions.</p>';q('[data-sl-equity]').replaceChildren();q('[data-sl-trades]').replaceChildren();return;}
  const p=replayPrefix(run,cursor),day=data.bars[cursor].date,curve=p.curve,last=curve.at(-1),fees=p.events.filter(e=>e.status==='filled').reduce((s,e)=>s+e.fee,0),dd=Math.max(0,...curve.map(c=>c.drawdown_pct));
  const bh=run.result.benchmark.curve.filter(c=>c.date<=day),returnPct=last?(last.equity/run.result.config.capital-1)*100:0;
  q('[data-sl-results]').innerHTML=`<dl class="sl-metrics"><div><dt>Net return</dt><dd>${pct(returnPct)}</dd><small>Buy &amp; hold ${pct(bh.at(-1)?(bh.at(-1).equity/run.result.config.capital-1)*100:0)}</small></div><div><dt>Max drawdown</dt><dd>${pct(dd)}</dd></div><div><dt>Completed trades</dt><dd>${p.trades.length}</dd></div><div><dt>Estimated fees</dt><dd>${money(fees)}</dd><small>Slippage is included in fill prices</small></div></dl><p class="sl-note">Through ${day} · ${data.provenance} · ${data.metadata.basis} · ${last?.mark_available===false?'Closing mark unavailable; carrying the previous known close.':'Remaining positions marked; no forced sale.'}</p>`;
  q('[data-sl-equity]').innerHTML=curveSVG(curve,bh);
  q('[data-sl-trades]').innerHTML=p.trades.length?`<table><caption>Completed trades visible at the replay cursor</caption><thead><tr><th>Entry</th><th>Exit</th><th>Shares</th><th>P&amp;L</th><th>Return</th></tr></thead><tbody>${p.trades.map(t=>`<tr><td><button type="button" class="rd-text-link" data-sl-trade="${t.signal_date}">${t.entry_date}</button></td><td>${t.exit_date}</td><td>${num(t.shares)}</td><td>${money(t.pnl)}</td><td>${pct(t.return_pct)}</td></tr>`).join('')}</tbody></table>`:'<p class="sl-note">No completed trades through this cursor. Inspect unfilled orders and any open position.</p>';
  q('[data-sl-details]').innerHTML=`<p>Run ${esc(run.id)} · ${esc(run.result.engine)} · ${esc(run.provenance)}</p><p>Immutable dataset ${esc(data.fingerprint)}.</p><p>${esc(run.result.warnings.join(' '))}</p><pre>${esc(JSON.stringify(run.result.config,null,2))}</pre>`;
 }
 function render(){if(!comparison||!run)q('[data-sl-comparison]').replaceChildren();chart();inspector();results();if(comparison&&run)q('[data-sl-comparison]').innerHTML=curveSVG(replayPrefix(run,cursor).curve,replayPrefix(comparison,cursor).curve)+`<p>Two immutable versions on identical inputs through ${data.bars[cursor].date}. Compared rules: <code>${esc(JSON.stringify(comparison.result.strategy))}</code></p>`;saveState();}
 function setMode(next){mode=next;pause();q('[data-sl-layout]').dataset.slLayoutMode=mode;for(const el of qa('[data-sl-mode]')){if(el.dataset.slMode===mode)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');}q('.sl-monitor').hidden=mode!=='monitor';}
 function pause(){clearInterval(playing);playing=null;q('[data-sl="play"]').textContent='▶';q('[data-sl="play"]').setAttribute('aria-label','Play historical replay');}
 function lastCursor(){return run?data.bars.findIndex(b=>b.date===run.result.actual_end):data.bars.length-1;}
 function step(){if(!data)return;if(cursor>=lastCursor()){pause();return;}cursor++;render();}
 function download(content,filename,type='text/plain'){const href=URL.createObjectURL(new Blob([content],{type})),a=document.createElement('a');a.href=href;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(href),1000);}
 function example(){download(JSON.stringify({schema:1,symbol:company,source:'Replace with your consistent authorized source',basis:'raw',timezone:'Asia/Kolkata',timeframe:'1d',completed_through:'2025-01-03',display_permission:'owner_private',actions_complete:true,sessions:['2025-01-01','2025-01-02','2025-01-03'],bars:[{date:'2025-01-01',open:100,high:102,low:99,close:101,volume:1000},{date:'2025-01-02',open:101,high:103,low:100,close:102,volume:1200},{date:'2025-01-03',open:102,high:104,low:101,close:103,volume:900}]},null,2),'dataset-format-example.json','application/json');status('Format example downloaded. Example numbers are educational; replace them with your source data.');}
 async function activate(){
  const next=getData()?.company.ticker;if(!next)return;if(company===next)return;
  company=next;generation++;pause();project=version=data=run=comparison=null;versions=[];runRecords=[];datasets=[];dirty=true;rules=recipe();renderRules();q('[data-sl-results]').replaceChildren();q('[data-sl-chart]').innerHTML='<div class="sl-empty"><strong>Start with trustworthy data.</strong><p>Open Sources &amp; dates to inspect readiness and import private daily OHLC.</p></div>';q('[data-sl-chart-caption]').textContent='Daily · no supported dataset selected';q('[data-sl-inspector]').textContent='Select a historical decision after running a test.';q('[data-sl-name]').value='Trend crossover';q('[data-sl-code]').value='';q('[data-sl-legend]').replaceChildren();q('[data-sl-equity]').replaceChildren();q('[data-sl-trades]').replaceChildren();q('[data-sl-details]').replaceChildren();q('[data-sl-comparison]').replaceChildren();q('[data-sl-monitor-result]').replaceChildren();
  if(!api.authenticated()){status('Sign in to save versions, import private data and run tests.');return;}
  const g=generation;const response=await request(labURL+'projects/?company='+encodeURIComponent(company));if(g!==generation)return;renderProjects(response.projects);renderVersions();const id=new URLSearchParams(location.search).get('lab_project');if(id&&response.projects.some(p=>p.id===id))await openProject(id);saveState();
 }
 function renderMonitor(m){q('[data-sl-monitor-result]').innerHTML=`<p><strong>${m.enabled?'On-demand check saved':'Check disabled'}</strong> · last successful evaluation ${esc(m.last_success_at??'None')}</p><p>Completed data ${esc(m.evaluation.date??'Unavailable')}</p><p>Entry: ${esc(String(m.evaluation.entry?.passed??'Unavailable'))} · Exit: ${esc(String(m.evaluation.exit?.passed??'Unavailable'))}</p><p>${esc(m.evaluation.preview??'No evaluation')}</p><p>Delivery: ${esc(m.delivery_status)} · background inactive.</p>`;}
 async function guard(fn){if(busy)return;busy=true;qa('[data-sl="run"],[data-sl="save"],[data-sl="check"]').forEach(b=>b.disabled=true);try{await fn();}catch(error){status(error.message);}finally{busy=false;qa('[data-sl="run"],[data-sl="save"],[data-sl="check"]').forEach(b=>b.disabled=editor==='python'&&b.dataset.sl==='run');}}
 root.addEventListener('click',event=>{const button=event.target.closest('button,[data-sl-event]');if(!button)return;
  const action=button.dataset.sl;
  if(button.dataset.slMode)setMode(button.dataset.slMode);
  if(button.dataset.slArea){q('[data-sl-layout]').dataset.area=button.dataset.slArea;qa('[data-sl-area]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));}
  if(button.dataset.slEditor){editor=button.dataset.slEditor;q('[data-sl-visual]').hidden=editor!=='visual';q('[data-sl-python]').hidden=editor!=='python';qa('[data-sl-editor]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));q('[data-sl="run"]').disabled=editor==='python';}
  if(button.dataset.slAdd){rules[button.dataset.slAdd].conditions.push(row(operand('rsi',14),'above',operand('constant',null,null,50)));changed();renderRules();}
  if(button.dataset.slRemove){rules[button.dataset.slRemove].conditions.splice(Number(button.dataset.index),1);changed();renderRules();}
  if(button.dataset.slEvent!==undefined){selectedEvent=Number(button.dataset.slEvent);const ev=run.result.events.find(e=>e.id===selectedEvent);cursor=data.bars.findIndex(b=>b.date===ev.date);q('[data-sl-layout]').dataset.area='inspector';render();}
  if(button.dataset.slTrade){cursor=data.bars.findIndex(b=>b.date===button.dataset.slTrade);selectedEvent=run.result.events.find(e=>e.date===button.dataset.slTrade)?.id;q('[data-sl-layout]').dataset.area='inspector';render();}
  if(action==='save')guard(save);if(action==='run')guard(execute);if(action==='sources')guard(sources);if(action==='close-sources')q('[data-sl-source-dialog]').close();
  if(action==='first'&&data){cursor=Number(q('[data-sl-cursor]').min);selectedEvent=null;render();}if(action==='step')step();
  if(action==='play'&&data){if(playing)pause();else{if(cursor>=lastCursor())cursor=Number(q('[data-sl-cursor]').min);playing=setInterval(step,Number(q('[data-sl-speed]').value));button.textContent='Ⅱ';button.setAttribute('aria-label','Pause historical replay');render();}}
  if(action==='new'){if(dirty&&project){status('Save the current draft before switching projects.');return;}project=version=run=comparison=null;versions=[];runRecords=[];rules=recipe();dirty=true;q('[data-sl-name]').value='New research idea';renderRules();renderVersions();updateURL();render();}
  if(action==='duplicate'){version=null;dirty=true;q('[data-sl-version]').value='';status('Version duplicated into the draft. Change its parameters, then save a new version.');saveState();}
  if(action?.startsWith('focus-')){const target=action.slice(6);q('[data-sl-layout]').dataset.focus=q('[data-sl-layout]').dataset.focus===target?'':target;button.setAttribute('aria-pressed',String(q('[data-sl-layout]').dataset.focus===target));}
  if(action==='example')example();if(action==='export-code')download(q('[data-sl-code]').value,'marketdeck-strategy.py');
  if(action==='template')guard(async()=>{if(dirty||!version)await save();const r=await request(labURL+'project/'+project.id+'/export/?version='+version.id);q('[data-sl-code]').value=r.source;changed();download(r.source,'marketdeck-visual-strategy.py');status('Standalone standard-library Python exported. It contains the same visual execution contract. Browser Python execution remains unavailable.');});
  if(action==='csv'&&run){const p=replayPrefix(run,cursor);const keys=['entry_date','exit_date','shares','entry_price','exit_price','entry_fee','exit_fee','dividends','pnl','return_pct'];download([keys.join(','),...p.trades.map(t=>keys.map(k=>t[k]).join(','))].join('\n'),'strategy-trades.csv','text/csv');}
  if(action==='check'||action==='disable')guard(async()=>{if(!version||dirty)throw Error('Save a version before checking its conditions.');if(!data)throw Error('Choose a completed private dataset first.');const r=await post('monitor',{version:version.id,dataset:data.id,enabled:action==='check'});q('[data-sl-monitor-result]').innerHTML=`<p><strong>${r.monitor.enabled?'On-demand check saved':'Check disabled'}</strong> · last successful evaluation ${esc(r.monitor.last_success_at??'None')}</p><p>Completed data ${esc(r.monitor.evaluation.date??'Unavailable')}</p><p>Entry: ${esc(String(r.monitor.evaluation.entry?.passed??'Unavailable'))} · Exit: ${esc(String(r.monitor.evaluation.exit?.passed??'Unavailable'))}</p><p>${esc(r.monitor.evaluation.preview??'No evaluation')}</p><p>Delivery: ${esc(r.monitor.delivery_status)} · background inactive.</p>`;});
  if(action==='pin')guard(async()=>{if(!run||selectedEvent===null)throw Error('Select a historical signal marker first.');if(!getDesk()?.id)throw Error('Save this research desk first, then pin the finding.');const desk=getDesk();const r=await post('pin',{run:run.id,event:selectedEvent,desk:desk.id,updated_at:desk.updated_at});api.onLabPin?.(r.desk);status('Run event pinned to your company research evidence.');});
 });
 root.addEventListener('keydown',event=>{if((event.key==='Enter'||event.key===' ')&&event.target.matches('[data-sl-event]')){event.preventDefault();event.target.dispatchEvent(new MouseEvent('click',{bubbles:true}));}if(event.key==='Escape'){pause();q('[data-sl-layout]').dataset.focus='';}});
 root.addEventListener('input',event=>{const el=event.target;
  if(el.matches('[data-sl-cursor]')){pause();cursor=Number(el.value);selectedEvent=null;render();return;}
  if(el.matches('[data-sl-name],[data-sl-hypothesis],[data-sl-code]'))changed();
  if(el.matches('[data-sl-assumption]')){assumptionsDirty=true;pause();saveState();}
  if(el.dataset.slRule){const o=rules[el.dataset.slRule].conditions[Number(el.dataset.index)][el.dataset.part];if(el.dataset.key==='period'||el.dataset.key==='value'){o[el.dataset.key]=el.value===''?null:Number(el.value);changed();summary();}}
 });
 root.addEventListener('change',event=>{const el=event.target;
  if(el.dataset.slGroup){rules[el.dataset.slGroup].mode=el.value;changed();summary();}
  if(el.dataset.slOp){rules[el.dataset.slOp].conditions[Number(el.dataset.index)].op=el.value;changed();summary();}
  if(el.dataset.slRule&&['kind','field'].includes(el.dataset.key)){const c=rules[el.dataset.slRule].conditions[Number(el.dataset.index)],o=c[el.dataset.part];c[el.dataset.part]=el.dataset.key==='field'?{...o,field:el.value}:operand(el.value,['sma','ema','rsi','high','low'].includes(el.value)?14:null,el.value==='volume'?'volume':'close',50);changed();renderRules();}
  if(el.matches('[data-sl-recipe]')){rules=recipe(el.value);q('[data-sl-hypothesis]').value={momentum:'A sustained trend may persist when momentum agrees.',crossover:'A faster moving average crossing a slower one may identify a trend.',breakout:'A prior-period breakout with unusual volume may indicate continuation.'}[el.value];changed();renderRules();}
  if(el.matches('[data-sl-project]'))guard(async()=>{if(dirty&&project){el.value=project.id;throw Error('Save the current draft before switching projects.');}if(el.value)await openProject(el.value);});
  if(el.matches('[data-sl-version]')){if(dirty){el.value=version?.id??'';status('Save or duplicate the current draft before switching versions.');return;}version=versions.find(v=>v.id===el.value)||null;if(version){rules=structuredClone(version.strategy);q('[data-sl-code]').value=version.python_source;q('[data-sl-hypothesis]').value=version.hypothesis;dirty=false;renderRules();saveState();}}
  if(el.matches('[data-sl-import]'))guard(async()=>{const file=el.files[0];if(!file)return;if(file.size>1500000)throw Error('Dataset file exceeds 1.5 MB.');const content=JSON.parse(await file.text());if(content.symbol!==company)throw Error('The dataset symbol must match the selected company.');const r=await post('dataset',{dataset:content});selectDataset(r.dataset);q('[data-sl-import-status]').textContent=`Imported ${r.dataset.bar_count} sessions · ${r.dataset.actual_start} → ${r.dataset.actual_end}.`;await sources();});
  if(el.matches('[data-sl-dataset]')&&el.value)guard(async()=>{const d=datasets.find(d=>d.id===el.value);if(!d)return;const r=await request(labURL+'dataset/?id='+d.id);selectDataset(r.dataset);q('[data-sl-source-dialog]').close();});
  if(el.matches('[data-sl-compare]'))guard(async()=>{comparison=null;q('[data-sl-comparison]').replaceChildren();if(!el.value||!run)return;const other=await request(labURL+'run/'+el.value+'/');const thisRecord={dataset:data.id,assumptions:run.result.config},otherRecord={dataset:other.dataset.id,assumptions:other.result.config};if(!matched(thisRecord,otherRecord))throw Error('Comparison refused: dataset identity, dates and execution assumptions must match.');comparison=other;const p=replayPrefix(other,Math.min(cursor,other.dataset.bars.length-1));q('[data-sl-comparison]').innerHTML=curveSVG(replayPrefix(run,cursor).curve,p.curve)+`<p>Two immutable versions on identical inputs. Rule changes: <code>${esc(JSON.stringify(other.result.strategy))}</code></p>`;});
  if(el.matches('[data-sl-speed]')&&playing){pause();status('Replay paused. Press play to resume at the selected speed.');}
 });
 function highlight(el){const key=el.closest('[data-sl-highlight]')?.dataset.slHighlight;for(const line of qa('[data-sl-line]'))line.classList.toggle('sl-highlighted',!!key&&canonical(JSON.parse(line.dataset.slLine))===canonical(JSON.parse(key)));}
 root.addEventListener('pointerover',event=>highlight(event.target));root.addEventListener('focusin',event=>highlight(event.target));
 q('[data-sl-code]').addEventListener('scroll',event=>{q('[data-sl-code-highlight]').scrollTop=event.target.scrollTop;q('[data-sl-code-highlight]').scrollLeft=event.target.scrollLeft;});
 let resizeFrame;window.addEventListener('resize',()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(chart);});
 window.addEventListener('beforeunload',event=>{if(dirty&&(project||touched)){event.preventDefault();event.returnValue='';}});
 renderRules();saveState();return {activate,pause,saveDraft,isDirty:()=>dirty&&(!!project||touched)};
}
