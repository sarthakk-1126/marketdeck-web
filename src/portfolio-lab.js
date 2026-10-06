import {adjustWeight,setShocks} from './portfolio-lab-allocation.js';

export function createPortfolioLab(api,root) {
 const {esc,request,csrf}=api;
 const base=new URL('../portfolio-lab/',new URL(api.labURL,location.origin)).pathname;
 let snapshot=null,token=null,spec=null,result=null,experiment=null,versions=[],selected=null,dirty=false,
     view='mix',sequence=0,draftRevision=0,sourceSequence=0,loadPromise=null,loaded=false,timer=null,pending=false,saving=false;
 const q=s=>root.querySelector(s),qa=s=>[...root.querySelectorAll(s)];
 const pct=bps=>(bps/100).toLocaleString('en-IN',{maximumFractionDigits:2})+'%';
 const money=value=>{const match=String(value).match(/^(-?)(\d+)(?:\.(\d+))?$/);if(!match)return 'Unavailable';return match[1]+'₹'+BigInt(match[2]).toLocaleString('en-IN')+(match[3]?'.'+match[3].slice(0,2).padEnd(2,'0'):'');};
 const colours=['var(--rd-blue)','var(--rd-cyan)','var(--rd-violet)','var(--rd-text)'];
 const colour=i=>colours[i%colours.length];
 const say=text=>{q('[data-pl-status]').textContent=text;};
 root.innerHTML=`<div class="pl-head"><div><span class="pl-eyebrow">PORTFOLIO PLAYGROUND</span><h2>Make room for a new idea.</h2><p>Change the mix. Follow the effect. Keep the evidence.</p></div><span class="pl-private" data-pl-badge>Research copy · no orders</span></div>
 <div class="pl-source"><label>Saved portfolio<select data-pl-source aria-label="Saved portfolio"><option value="">Choose your portfolio</option></select></label><button type="button" data-pl-action="load">Load a copy</button><span>or</span><button type="button" data-pl-action="practice">Try a practice basket</button><a href="/screener/portfolio/">Open Portfolio ↗</a></div>
 <p class="pl-status" data-pl-status role="status" aria-live="polite">Start with your holdings, or explore with fictional practice inputs.</p>
 <div class="pl-reopen" data-pl-reopen hidden><label>Resume saved research<select data-pl-experiment><option value="">Choose saved research</option></select></label><span>Private experiments keep their original valuation snapshot.</span></div>
 <div class="pl-empty" data-pl-empty><div class="pl-orbits" aria-hidden="true"><i></i><i></i><i></i><span>↗</span></div><h3>A portfolio is a mix of possibilities.</h3><p>Explore allocation and price shocks without changing your recorded holdings.</p><button type="button" data-pl-action="practice">Explore the practice basket →</button></div>
 <section data-pl-workspace hidden><div class="pl-context"><strong data-pl-source-name></strong><span data-pl-scope></span><button type="button" data-pl-action="reset">Reset mix</button></div>
 <div class="pl-tabs" role="group" aria-label="Portfolio research view"><button type="button" data-pl-view="mix" aria-pressed="true">01 · Mix</button><button type="button" data-pl-view="shocks" aria-pressed="false">02 · What if?</button><button type="button" data-pl-view="compare" aria-pressed="false">03 · Compare</button></div>
 <div class="pl-layout"><section class="pl-card pl-editor"><div class="pl-card-head"><h3>Your proposed mix</h3><span data-pl-total>100% allocated</span></div><label class="pl-transfer">When a weight changes<select data-pl-transfer><option value="cash">Transfer to / from hypothetical cash</option><option value="redistribute">Redistribute other unlocked holdings</option></select></label><p class="pl-help" data-pl-transfer-help>Other holdings stay fixed. Increases use available hypothetical cash.</p><div data-pl-holdings></div><div class="pl-cash"><span><i></i>Hypothetical cash</span><strong data-pl-cash>0%</strong></div><p class="pl-help">Cash is an unallocated portion of this research mix. Your account cash balance is not supplied.</p></section>
 <section class="pl-card pl-canvas"><div class="pl-card-head"><div><span class="pl-eyebrow" data-pl-chart-label>ALLOCATION CANVAS</span><h3 data-pl-chart-title>Same holdings. New balance.</h3></div><span class="pl-live" data-pl-update>Ready</span></div><div data-pl-chart></div><div class="pl-legend"><span><i class="pl-baseline-key"></i>Frozen baseline</span><span><i class="pl-proposed-key"></i>Proposed mix</span></div><div class="pl-readings" data-pl-readings><div><span>Largest stock holding</span><strong data-pl-largest></strong><small data-pl-largest-before></small></div><div><span>Hypothetical cash</span><strong data-pl-cash-value></strong><small>Unallocated; no assumed interest</small></div></div><div data-pl-shock-controls hidden><label>Apply a price shock to<select data-pl-target><option value="all">All stock holdings</option></select></label><div class="pl-shock-label"><label for="pl-shock-slider">Your assumed price move</label><output data-pl-shock-output>−20%</output></div><input id="pl-shock-slider" type="range" min="-100" max="100" step="1" value="-20" data-pl-shock><div class="pl-shock-numeric"><label>Exact shock %<input type="number" min="-100" max="100" step="1" value="-20" data-pl-shock-number></label><button type="button" data-pl-action="apply-shock">Apply assumption</button><button type="button" data-pl-action="clear-shocks">Clear shocks</button></div><p class="pl-help">A hypothetical price change. Cash is unchanged. Fees, taxes and execution are excluded.</p></div><div class="pl-sector-list" data-pl-sectors></div></section>
 <aside class="pl-card pl-inspector"><span class="pl-eyebrow">FOLLOW THE EFFECT</span><h3 data-pl-inspector-title>Select a holding</h3><div data-pl-inspector></div><div class="pl-notebook"><label>Experiment name<input data-pl-name maxlength="100" value="My portfolio experiment"></label><label>Research note<textarea data-pl-note maxlength="2000" rows="3" placeholder="What are you trying to understand?"></textarea></label><label class="pl-partial" data-pl-partial hidden><input type="checkbox" data-pl-ack> I understand this covers only priced holdings.</label><button type="button" data-pl-action="save">Save private version</button><small data-pl-save-help>Practice inputs cannot be saved as real portfolio research.</small></div></aside></div>
 <section class="pl-card pl-compare" data-pl-compare hidden><div class="pl-card-head"><h3>Keep your research trail.</h3><span>Same frozen valuation snapshot</span></div><div data-pl-versions></div></section>
 <details class="pl-basis"><summary>Sources, dates &amp; what these results mean</summary><p data-pl-basis></p><div data-pl-sources></div><p>These are allocation and arithmetic shock experiments. Historical volatility, drawdowns and strategy returns need separately supported data and are not calculated in this release.</p></details></section>`;
 function setPending(value){pending=value;q('[data-pl-update]').textContent=value?'Updating…':'Ready';root.dataset.pending=String(value);q('[data-pl-readings]').hidden=value;qa('[data-pl-action="save"]').forEach(b=>b.disabled=value||saving||!snapshot||snapshot.practice||!api.authenticated());}
 async function post(operation,body){return request(base+operation+'/',{method:'POST',headers:{'Content-Type':'application/json','X-CSRFToken':csrf},body:JSON.stringify(body)});}
 async function lists(){
  if(!api.authenticated()){q('[data-pl-source]').disabled=true;q('[data-pl-action="load"]').disabled=true;say('Sign in to load private holdings. The practice basket is available to explore.');return;}
  const [portfolios,experiments]=await Promise.all([request(base),request(base+'experiments/')]);
  const sourceID=q('[data-pl-source]').value;
  q('[data-pl-source]').innerHTML='<option value="">Choose your portfolio</option>'+portfolios.portfolios.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('');
  q('[data-pl-source]').value=portfolios.portfolios.some(p=>String(p.id)===sourceID)?sourceID:portfolios.portfolios.length===1?portfolios.portfolios[0].id:'';
  q('[data-pl-experiment]').innerHTML='<option value="">Choose saved research</option>'+experiments.experiments.map(e=>`<option value="${e.id}" ${experiment?.id===e.id?'selected':''}>${esc(e.name)} · v${e.revision}</option>`).join('');
  q('[data-pl-reopen]').hidden=!experiments.experiments.length;
  if(!portfolios.portfolios.length)say('No saved portfolio yet. Try the practice basket or add holdings in Portfolio.');
 }
 function selectSource(r,keep=false){
  sequence++;clearTimeout(timer);snapshot=r.snapshot;token=r.token;result=r.preview;spec=result?structuredClone(result.specification):null;
  selected=snapshot.assets[0]?.id??null;dirty=false;
  if(!keep){experiment=null;versions=[];q('[data-pl-name]').value=snapshot.practice?'Practice experiment':snapshot.source_name+' · what if';q('[data-pl-note]').value='';}
  q('[data-pl-empty]').hidden=!!snapshot.assets.length;q('[data-pl-workspace]').hidden=!snapshot.assets.length;
  if(!snapshot.assets.length){q('[data-pl-empty]').innerHTML=`<h3>No priced holdings available.</h3><p>${esc(snapshot.excluded.map(a=>a.ticker+': '+a.reason).join(' · ')||'This portfolio has no currently held stocks.')}</p><a href="/screener/portfolio/">Inspect Portfolio ↗</a><button type="button" data-pl-action="practice">Try a practice basket</button>`;say('No priced holdings are available. Exclusions are shown below.');return;}
  q('[data-pl-chart]').replaceChildren();q('[data-pl-action="reset"]').textContent=experiment?'Discard edits':'Reset mix';
  q('[data-pl-source-name]').textContent=snapshot.source_name;
  q('[data-pl-badge]').textContent=snapshot.practice?'FICTIONAL PRACTICE · NOT MARKET DATA':'Private research copy · no orders';
  q('[data-pl-scope]').textContent=snapshot.practice?'Illustrative amounts':`${snapshot.coverage.priced}/${snapshot.coverage.held} holdings priced · frozen copy`;
  q('[data-pl-partial]').hidden=!snapshot.excluded.length;q('[data-pl-ack]').checked=false;
  q('[data-pl-basis]').textContent=snapshot.basis+' Snapshot captured '+snapshot.captured_at+'.';
  q('[data-pl-sources]').innerHTML=snapshot.assets.map(a=>`<p><strong>${esc(a.ticker)}</strong> · ${esc(a.source)} · ${esc(a.price_as_of??'Illustrative; no market date')}</p>`).join('')+snapshot.excluded.map(a=>`<p><strong>${esc(a.ticker)} excluded:</strong> ${esc(a.reason)}</p>`).join('');
  q('[data-pl-target]').innerHTML='<option value="all">All stock holdings</option>'+[...new Set(snapshot.assets.map(a=>a.sector))].map(s=>`<option value="sector:${esc(s)}">${esc(s)} sector</option>`).join('')+snapshot.assets.map(a=>`<option value="holding:${a.id}">${esc(a.ticker)}</option>`).join('');
  renderHoldings();setPending(false);render();say(snapshot.practice?'Fictional practice basket loaded. Try moving an allocation, then explore a shock.':snapshot.excluded.length?'Loaded the priced portion only. Inspect excluded holdings in Sources & dates.':'Snapshot loaded. Change the research mix; recorded holdings stay unchanged.');
 }
 function renderHoldings(){q('[data-pl-holdings]').innerHTML=snapshot.assets.map((a,i)=>`<div class="pl-holding" data-pl-row="${a.id}"><div class="pl-holding-head"><button type="button" data-pl-select="${a.id}" aria-pressed="${selected===a.id}"><i style="background:${colour(i)}"></i><span><strong>${esc(a.ticker.replace(/\.NS$/,''))}</strong><small>${esc(a.name)}</small></span></button><label class="pl-lock"><input type="checkbox" data-pl-lock="${a.id}" ${spec.locked.includes(a.id)?'checked':''}>Lock</label></div><div class="pl-weight"><input type="range" min="0" max="10000" step="25" value="${spec.weights[a.id]}" data-pl-weight="${a.id}" aria-label="${esc(a.ticker)} proposed weight" ${spec.locked.includes(a.id)?'disabled':''}><label><input type="number" min="0" max="100" step="0.01" value="${spec.weights[a.id]/100}" data-pl-number="${a.id}" aria-label="${esc(a.ticker)} exact weight percent" ${spec.locked.includes(a.id)?'disabled':''}><span>%</span></label></div><span class="pl-baseline-note">Baseline <span data-pl-before="${a.id}">${pct(result.holdings.find(h=>h.id===a.id).baseline_bps)}</span></span></div>`).join('');}
 function syncInputs(){
  for(const input of qa('[data-pl-weight]')){input.value=spec.weights[input.dataset.plWeight];input.disabled=spec.locked.includes(input.dataset.plWeight);}
  for(const input of qa('[data-pl-number]')){input.value=spec.weights[input.dataset.plNumber]/100;input.disabled=spec.locked.includes(input.dataset.plNumber);}
  for(const input of qa('[data-pl-lock]'))input.checked=spec.locked.includes(input.dataset.plLock);
  q('[data-pl-cash]').textContent=pct(spec.cash_bps);q('[data-pl-transfer]').value=spec.transfer_mode;
  q('[data-pl-transfer-help]').textContent=spec.transfer_mode==='cash'?'Other holdings stay fixed. Increases use available hypothetical cash.':'Other allocated, unlocked holdings adjust proportionally. Hypothetical cash stays fixed.';
  for(const el of qa('[data-pl-row]'))el.dataset.selected=String(el.dataset.plRow===selected);
  for(const el of qa('[data-pl-select]'))el.setAttribute('aria-pressed',String(el.dataset.plSelect===selected));
 }
 function ring(weights,cash,radius,width){
  const circumference=2*Math.PI*radius;let offset=0;
  return snapshot.assets.map((a,i)=>{const fraction=weights[a.id]/10000,segment=`<circle cx="180" cy="180" r="${radius}" fill="none" stroke="${colour(i)}" stroke-width="${width}" stroke-dasharray="${fraction*circumference} ${circumference}" stroke-dashoffset="${-offset*circumference}" transform="rotate(-90 180 180)" class="pl-arc" ${width>7?`data-pl-select="${a.id}"`:""} opacity="${selected===a.id?1:.55}"/>`;offset+=fraction;return segment;}).join('')+(cash?`<circle cx="180" cy="180" r="${radius}" fill="none" stroke="var(--rd-muted)" stroke-width="${width}" stroke-dasharray="${cash/10000*circumference} ${circumference}" stroke-dashoffset="${-offset*circumference}" transform="rotate(-90 180 180)" opacity=".4"/>`:'');
 }
 function canvas(){
  const before=Object.fromEntries(result.holdings.map(h=>[h.id,h.baseline_bps]));
  if(view==='shocks'){
   q('[data-pl-chart-title]').textContent='Give the mix a stress test.';q('[data-pl-chart-label]').textContent='YOUR ASSUMPTIONS · NO FORECAST';
   if(pending){q('[data-pl-chart]').innerHTML='<div class="pl-chart-wait">Updating the scenario for your latest mix…</div>';return;}
   const entries=[['Frozen baseline',result.scenario.baseline_after,result.scenario.baseline_impact,'baseline'],['Proposed mix',result.scenario.proposed_after,result.scenario.proposed_impact,'proposed']];
   const maximum=Math.max(Number(result.priced_value),...entries.map(e=>Number(e[1])),1);
   q('[data-pl-chart]').innerHTML=`<div class="pl-shock-chart">${entries.map(e=>`<div><span>${e[0]}</span><strong>${money(e[1])}</strong><div class="pl-value-track"><i class="pl-${e[3]}-fill" style="width:${Number(e[1])/maximum*100}%"></i></div><small>${Number(e[2])>0?'+':''}${money(e[2])} assumed value change</small></div>`).join('')}<p>At the frozen priced value of ${money(result.priced_value)}. The proposed mix assumes continuous allocation, not executed trades.</p></div>`;
  }else{
   q('[data-pl-chart-title]').textContent='Same holdings. New balance.';q('[data-pl-chart-label]').textContent='ALLOCATION CANVAS';
   const a=snapshot.assets.find(a=>a.id===selected),circumference=2*Math.PI*137;
   if(!q('.pl-allocation-map'))q('[data-pl-chart]').innerHTML=`<svg class="pl-allocation-map" viewBox="0 0 360 360" role="img" aria-label="Allocation comparison. Inner ring is baseline; outer ring is proposed. Exact weights are in the editor."><circle cx="180" cy="180" r="137" fill="none" stroke="var(--rd-border)" stroke-width="25"/><circle cx="180" cy="180" r="103" fill="none" stroke="var(--rd-border)" stroke-width="7"/>${ring(before,0,103,7)}${ring(spec.weights,0,137,25)}<circle data-pl-cash-arc cx="180" cy="180" r="137" fill="none" stroke="var(--rd-muted)" stroke-width="25" transform="rotate(-90 180 180)" opacity=".4" class="pl-arc"/><text x="180" y="158" text-anchor="middle" class="pl-map-label" data-pl-map-name></text><text x="180" y="197" text-anchor="middle" class="pl-map-number" data-pl-map-weight></text><text x="180" y="224" text-anchor="middle" class="pl-map-label">proposed allocation</text></svg>`;
   let offset=0;for(const asset of snapshot.assets){const arc=q(`circle[data-pl-select="${asset.id}"]`),fraction=spec.weights[asset.id]/10000;arc.setAttribute('stroke-dasharray',`${fraction*circumference} ${circumference}`);arc.setAttribute('stroke-dashoffset',-offset*circumference);arc.setAttribute('opacity',selected===asset.id?1:.55);offset+=fraction;}
   const cashArc=q('[data-pl-cash-arc]');cashArc.setAttribute('stroke-dasharray',`${spec.cash_bps/10000*circumference} ${circumference}`);cashArc.setAttribute('stroke-dashoffset',-offset*circumference);
   q('[data-pl-map-name]').textContent=a?.ticker.replace(/\.NS$/,'')??'Selected holding';q('[data-pl-map-weight]').textContent=pct(spec.weights[selected]??0);
  }
 }
 function render(){if(!spec||!result)return;q('[data-pl-action="reset"]').textContent=experiment?'Discard edits':'Reset mix';syncInputs();canvas();
  q('[data-pl-largest]').textContent=pct(result.proposed.largest_holding_bps);q('[data-pl-largest-before]').textContent='Baseline '+pct(result.baseline.largest_holding_bps);
  q('[data-pl-cash-value]').textContent=money(result.scenario.cash_value);
  q('[data-pl-sectors]').innerHTML=pending?'':`<span class="pl-eyebrow">PROPOSED SECTOR MIX</span>${result.proposed.sectors.filter(s=>s.weight_bps).map(s=>`<div><span>${esc(s.name)}</span><i><b style="width:${s.weight_bps/100}%"></b></i><strong>${pct(s.weight_bps)}</strong></div>`).join('')}`;
  const a=snapshot.assets.find(a=>a.id===selected),h=result.holdings.find(h=>h.id===selected);
  q('[data-pl-inspector-title]').textContent=a?.name??'Select a holding';
  q('[data-pl-inspector]').innerHTML=`<p class="pl-inspector-sector">${esc(a?.sector)}</p><div class="pl-change"><span>${pct(h?.baseline_bps??0)}<small>baseline</small></span><i aria-hidden="true">→</i><span>${pct(spec.weights[selected]??0)}<small>proposed</small></span></div>${pending?'<p>Results are updating for your latest edit.</p>':`<p>${view==='shocks'?`${esc(a.ticker)} has a ${esc(h.shock_pct)}% assumed price move. Its proposed value change is ${money(h.proposed_impact)}.`:`This holding is ${pct(h.proposed_bps)} of your research mix, compared with ${pct(h.baseline_bps)} in the frozen baseline.`}</p><div class="pl-effect"><small>${view==='shocks'?'Portfolio shock impact difference':'Proposed allocation value'}</small><strong>${money(view==='shocks'?result.scenario.impact_difference:h.proposed_value)}</strong><span>${view==='shocks'?'Proposed minus baseline; under your assumptions.':'Hypothetical allocation; no transaction created.'}</span></div>`}`;
  q('[data-pl-save-help]').textContent=snapshot.practice?'Fictional practice inputs cannot be saved as real portfolio research.':experiment?`Private experiment · ${dirty?'unsaved edits':'saved v'+experiment.revision}`:'Save a private experiment and keep its frozen baseline.';
 }
 function edited(){dirty=true;draftRevision++;sequence++;setPending(true);render();clearTimeout(timer);const id=sequence;timer=setTimeout(()=>calculate(id),160);}
 async function calculate(id){
  const body=JSON.stringify(spec);
  try{const r=await post('preview',{token,specification:spec});if(id!==sequence||body!==JSON.stringify(spec))return;result=r.preview;spec=structuredClone(result.specification);setPending(false);render();say('Updated for your assumptions. Recorded holdings are unchanged.');}
  catch(error){if(id!==sequence)return;setPending(true);q('[data-pl-update]').textContent='Needs attention';say(error.message);}
 }
 function setView(next){view=next;qa('[data-pl-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.plView===view)));q('[data-pl-shock-controls]').hidden=view!=='shocks';q('[data-pl-compare]').hidden=view!=='compare';if(result)render();}
 async function load(kind){
  if(saving){say('Wait for the save to finish before loading another source.');return;}
  if(dirty&&!snapshot?.practice){say('Save or reset the current research copy before loading another source.');return;}
  const id=++sourceSequence;sequence++;clearTimeout(timer);say('Loading a frozen copy…');root.setAttribute('aria-busy','true');
  try{const selectedID=q('[data-pl-source]').value;if(kind!=='practice'&&!selectedID)throw Error('Choose a saved portfolio first.');const r=await request(base+(kind==='practice'?'practice/':'snapshot/?portfolio='+encodeURIComponent(selectedID)));if(id!==sourceSequence)return;selectSource(r);setView('mix');}
  catch(error){if(id===sourceSequence)say(error.message);}finally{if(id===sourceSequence)root.removeAttribute('aria-busy');}
 }
 async function open(id){
  if(!id)return;if(saving){say('Wait for the save to finish before opening research.');return;}if(dirty&&!snapshot?.practice){say('Save or reset your current edits before opening another experiment.');q('[data-pl-experiment]').value=experiment?.id??'';return;}
  const generation=++sourceSequence;sequence++;clearTimeout(timer);say('Opening saved research…');
  try{const r=await request(base+'experiment/'+encodeURIComponent(id)+'/');if(generation!==sourceSequence)return;experiment=r.experiment;versions=r.versions;const latest=versions[0];selectSource({snapshot:latest.snapshot,token:r.token,preview:latest.result},true);q('[data-pl-name]').value=experiment.name;q('[data-pl-note]').value=latest.note;renderVersions();setView('compare');say(r.source_state==='current'?'Opened a saved version with its frozen baseline.':r.source_state==='source_deleted'?'The source portfolio was deleted. Your saved research copy remains private.':'The source portfolio has changed. This experiment keeps its frozen baseline.');}
  catch(error){if(generation===sourceSequence)say(error.message);}
 }
 function renderVersions(){q('[data-pl-versions]').innerHTML=versions.length?`<div class="pl-version-scroll"><table><caption>Saved versions · priced value and allocation assumptions</caption><thead><tr><th scope="col">Version</th><th scope="col">Largest stock</th><th scope="col">Cash</th><th scope="col">Shock change</th><th scope="col">Inspect</th></tr></thead><tbody>${versions.map(v=>`<tr><th scope="row">v${v.number}</th><td>${pct(v.result.proposed.largest_holding_bps)}</td><td>${pct(v.specification.cash_bps)}</td><td>${money(v.result.scenario.proposed_impact)}</td><td><button type="button" data-pl-version="${v.number}">Use this mix</button></td></tr>`).join('')}</tbody></table></div>`:'<p>Save a private version to begin a comparison trail.</p>';}
 async function save(){
  if(saving||pending){say('Wait for the latest edit or save to finish.');return false;}if(!snapshot||snapshot.practice){say('Load a real saved portfolio before saving private research.');return false;}if(!api.authenticated()){say('Sign in to save private research.');return false;}
  const savedDraftRevision=draftRevision,body={token,specification:structuredClone(spec),name:q('[data-pl-name]').value,note:q('[data-pl-note]').value,acknowledge_partial:q('[data-pl-ack]').checked,...(experiment?{expected_revision:experiment.revision}:{})};
  saving=true;setPending(pending);say('Saving a private version…');
  try{const r=await post(experiment?'experiment/'+experiment.id:'experiments',body);experiment=r.experiment;versions.unshift(r.version);if(savedDraftRevision===draftRevision)dirty=false;renderVersions();render();await lists();say('Saved private version '+r.version.number+'. Its valuation baseline stays frozen.');return !dirty;}
  catch(error){say(error.message);return false;}
  finally{saving=false;setPending(pending);}
 }
 root.addEventListener('click',event=>{
  const select=event.target.closest('[data-pl-select]');if(select){selected=select.dataset.plSelect;render();return;}
  const tab=event.target.closest('[data-pl-view]');if(tab){setView(tab.dataset.plView);return;}
  const revision=event.target.closest('[data-pl-version]');if(revision){if(saving){say('Wait for the save to finish before switching versions.');return;}draftRevision++;const v=versions.find(v=>v.number===Number(revision.dataset.plVersion));spec=structuredClone(v.specification);result=v.result;q('[data-pl-note]').value=v.note;dirty=true;sequence++;clearTimeout(timer);setPending(false);renderHoldings();render();say('Loaded the saved mix as a new draft; earlier versions remain unchanged.');return;}
  const action=event.target.closest('[data-pl-action]')?.dataset.plAction;if(!action)return;
  Promise.resolve().then(async()=>{
   if(action==='practice'||action==='load')return load(action);
   if(action==='save')return save();
   if(action==='reset'){if(!snapshot)return;if(saving){say('Wait for the save to finish before discarding edits.');return;}if(experiment&&versions.length){sequence++;clearTimeout(timer);result=versions[0].result;spec=structuredClone(versions[0].specification);q('[data-pl-name]').value=experiment.name;q('[data-pl-note]').value=versions[0].note;dirty=false;setPending(false);renderHoldings();render();say('Unsaved edits discarded. Restored the latest saved version.');}else{spec={weights:Object.fromEntries(result.holdings.map(h=>[h.id,h.baseline_bps])),cash_bps:0,shocks:{},transfer_mode:'cash',locked:[]};renderHoldings();edited();dirty=false;}return;}
   if(action==='apply-shock'){if(q('[data-pl-shock-number]').value==='')throw Error('Enter your assumed price move before applying it.');const target=q('[data-pl-target]').value,ids=snapshot.assets.filter(a=>target==='all'||target==='holding:'+a.id||target==='sector:'+a.sector).map(a=>a.id);spec=setShocks(spec,ids,Number(q('[data-pl-shock-number]').value));edited();}
   if(action==='clear-shocks'){spec=setShocks(spec,snapshot.assets.map(a=>a.id),0);edited();}
  }).catch(error=>say(error.message));
 });
 root.addEventListener('input',event=>{const el=event.target;
  if(el.matches('[data-pl-weight],[data-pl-number]')){try{selected=el.dataset.plWeight??el.dataset.plNumber;const value=Number(el.value),next=el.matches('[data-pl-number]')?Math.round(value*100):value;if(el.value===''||!Number.isFinite(value))throw Error('Enter a numeric allocation.');if(el.matches('[data-pl-number]')&&Math.abs(value*100-next)>1e-7)throw Error('Use at most two decimal places for allocation percentages.');spec=adjustWeight(spec,selected,next);edited();}catch(error){syncInputs();say(error.message);}return;}
  if(el.matches('[data-pl-shock],[data-pl-shock-number]')){const value=el.value;q('[data-pl-shock]').value=value;q('[data-pl-shock-number]').value=value;q('[data-pl-shock-output]').textContent=value+'%';return;}
  if(el.matches('[data-pl-name],[data-pl-note]')&&snapshot&&!snapshot.practice){dirty=true;draftRevision++;render();}
 });
 root.addEventListener('change',event=>{const el=event.target;if(el.matches('[data-pl-transfer]')){spec.transfer_mode=el.value;edited();}if(el.matches('[data-pl-lock]')){const id=el.dataset.plLock;spec.locked=el.checked?[...new Set([...spec.locked,id])]:spec.locked.filter(k=>k!==id);edited();}if(el.matches('[data-pl-experiment]'))open(el.value);});
 window.addEventListener('beforeunload',event=>{if(dirty&&!snapshot?.practice){event.preventDefault();event.returnValue='';}});
 return {activate(){if(loaded)return;loadPromise??=lists().then(()=>loaded=true).catch(error=>{loadPromise=null;say(error.message);});return loadPromise;},isDirty:()=>dirty&&!snapshot?.practice,save,render,isActive:()=>!root.hidden};
}
