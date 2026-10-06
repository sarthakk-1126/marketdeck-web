import {adjustWeight,setShocks,remix} from './portfolio-lab-allocation.js';
import {createPortfolioGuide} from './portfolio-lab-guide.js';
import {createPortfolioUsability} from './portfolio-lab-usability.js';
import {ideaNames,createComparisonState,copyComparisonIdea,undoComparisonAction,comparisonSamples,renderComparisonCards,comparisonChart} from './portfolio-lab-comparison.js';

export function createPortfolioLab(api,root) {
 const {esc,request,csrf}=api;
 const base=new URL('../portfolio-lab/',new URL(api.labURL,location.origin)).pathname;
 let snapshot=null,token=null,spec=null,result=null,experiment=null,versions=[],selected=null,dirty=false,
     view='mix',sequence=0,draftRevision=0,sourceSequence=0,loadPromise=null,loaded=false,timer=null,pending=false,saving=false,
     basketItems=[],catalogItems=[],catalogSequence=0,catalogTimer=null,undo=null,year=5,comparison=null,comparisonMeasure='value';
 const basketsEnabled=!!root.closest('[data-portfolio-baskets-enabled]');
 const comparisonEnabled=basketsEnabled&&!!root.closest('[data-portfolio-comparison-enabled]');
 const q=s=>root.querySelector(s),qa=s=>[...root.querySelectorAll(s)];
 const pct=bps=>(bps/100).toLocaleString('en-IN',{maximumFractionDigits:2})+'%';
 const money=value=>{const match=String(value).match(/^(-?)(\d+)(?:\.(\d+))?$/);if(!match)return 'Unavailable';return match[1]+'₹'+BigInt(match[2]).toLocaleString('en-IN')+(match[3]?'.'+match[3].slice(0,2).padEnd(2,'0'):'');};
 const colours=['var(--rd-blue)','var(--rd-cyan)','var(--rd-violet)','var(--rd-text)'];
 const colour=i=>colours[i%colours.length];
 const say=text=>{q('[data-pl-status]').textContent=text;};
 root.innerHTML=`<div class="pl-head"><div><span class="pl-eyebrow">PORTFOLIO PLAYGROUND</span><h2>Understand your mix. Try one change.</h2><p>Choose assets, change an input, and see what it means for your experiment.</p></div><span class="pl-private" data-pl-badge>Research copy · no orders</span></div>
 <div class="pl-source"><button type="button" class="pl-build" data-pl-action="builder" ${basketsEnabled?'':'hidden'}>＋ Build a basket</button><label>Saved portfolio<select data-pl-source aria-label="Saved portfolio"><option value="">Choose your portfolio</option></select></label><button type="button" data-pl-action="load">Load a copy</button><span>or</span><button type="button" data-pl-action="practice">Try a practice basket</button><a href="/screener/portfolio/">Open Portfolio ↗</a></div>
 <section class="pl-builder pl-card" data-pl-builder hidden aria-label="Build a custom basket"><div class="pl-card-head"><div><span class="pl-eyebrow">YOUR IDEAS · REAL INSTRUMENTS</span><h3>What would you put together?</h3></div><button type="button" data-pl-action="close-builder" aria-label="Close basket builder">×</button></div><div class="pl-search-row"><label>Asset type<select data-pl-kind><option value="all">All assets</option><option value="stock">Stocks</option><option value="fund">Mutual funds</option><option value="etf">ETFs</option></select></label><label class="pl-search-label">Find an instrument<input type="search" data-pl-search maxlength="100" placeholder="Name, ticker or scheme code" autocomplete="off"></label><label>Starting budget · ₹<input type="number" data-pl-budget min="1" max="100000000" step="1" value="100000" aria-label="Hypothetical starting budget"></label></div><p class="pl-help" data-pl-search-status role="status">Type at least two characters. Funds show their exact plan and option.</p><div class="pl-search-results" data-pl-search-results></div><div class="pl-picked" data-pl-picked></div><div class="pl-builder-footer"><button type="button" data-pl-action="apply-basket">Create basket</button><p class="pl-help">1–25 assets. Equal starting weights; change the mix afterward. No portfolio entry or purchase.</p></div></section>
 <p class="pl-status" data-pl-status role="status" aria-live="polite">Start with your holdings, or explore with fictional practice inputs.</p>
 <div class="pl-reopen" data-pl-reopen hidden><label>Resume saved research<select data-pl-experiment><option value="">Choose saved research</option></select></label><span>Private experiments keep their original valuation snapshot.</span></div>
 <div class="pl-empty" data-pl-empty><span class="pl-eyebrow">NEW HERE?</span><h3>Start with a basket. Ask one question.</h3><p>A basket is a group of assets you want to explore together. Try a fictional example first, or build one with real instrument names and a hypothetical budget.</p><ol class="pl-first-steps"><li>Choose your assets</li><li>Change one input</li><li>Read the effect</li></ol><button type="button" data-pl-action="practice">Explore the practice basket →</button><p class="pl-help">Explore without signing in. Your Portfolio holdings and transactions stay unchanged.</p></div>
 <section data-pl-workspace hidden><div class="pl-context"><strong data-pl-source-name></strong><span data-pl-scope></span><button type="button" data-pl-action="reset">Reset mix</button></div>
 <div class="pl-tabs" role="group" aria-label="Portfolio research view"><button type="button" data-pl-view="mix" aria-pressed="true">01 · Mix</button><button type="button" data-pl-view="shocks" aria-pressed="false">02 · What if?</button><button type="button" data-pl-view="growth" aria-pressed="false" ${basketsEnabled?'':'hidden'}>03 · Grow an idea</button><button type="button" data-pl-view="compare" aria-pressed="false">${basketsEnabled?'04':'03'} · Compare</button></div>
 <div class="pl-layout"><section class="pl-card pl-editor"><div class="pl-card-head"><h3>Your proposed mix</h3><span data-pl-total>100% allocated</span></div><label class="pl-transfer">When a weight changes<select data-pl-transfer><option value="cash">Transfer to / from hypothetical cash</option><option value="redistribute">Redistribute other unlocked holdings</option></select></label><p class="pl-help" data-pl-transfer-help>Other holdings stay fixed. Increases use available hypothetical cash.</p><div data-pl-holdings></div><div class="pl-cash"><span><i></i>Hypothetical cash</span><strong data-pl-cash>0%</strong></div><p class="pl-help">Cash is an unallocated portion of this research mix. Your account cash balance is not supplied.</p></section>
 <section class="pl-card pl-canvas"><div class="pl-card-head"><div><span class="pl-eyebrow" data-pl-chart-label>ALLOCATION CANVAS</span><h3 data-pl-chart-title>Same holdings. New balance.</h3></div><span class="pl-live" data-pl-update>Ready</span></div><div data-pl-chart></div><div class="pl-legend" data-pl-mix-legend><span><i class="pl-baseline-key"></i>Frozen baseline</span><span><i class="pl-proposed-key"></i>Proposed mix</span></div><div class="pl-readings" data-pl-readings><div><span>Largest position</span><strong data-pl-largest></strong><small data-pl-largest-before></small></div><div><span>Hypothetical cash</span><strong data-pl-cash-value></strong><small>Unallocated; no assumed interest</small></div></div><div data-pl-shock-controls hidden><label>Apply a price shock to<select data-pl-target><option value="all">All assets</option></select></label><div class="pl-shock-label"><label for="pl-shock-slider">Your assumed price move</label><output data-pl-shock-output>−20%</output></div><input id="pl-shock-slider" type="range" min="-100" max="100" step="any" value="-20" data-pl-shock><div class="pl-shock-numeric"><label>Exact shock %<input type="number" min="-100" max="100" step="any" value="-20" data-pl-shock-number></label><button type="button" data-pl-action="apply-shock">Apply assumption</button><button type="button" data-pl-action="clear-shocks">Clear shocks</button></div><p class="pl-help">A hypothetical price change. Cash is unchanged. Fees, taxes and execution are excluded.</p></div><div class="pl-sector-list" data-pl-sectors></div></section>
 <aside class="pl-card pl-inspector"><span class="pl-eyebrow">FOLLOW THE EFFECT</span><h3 data-pl-inspector-title>Select a holding</h3><div data-pl-inspector></div><div class="pl-notebook"><label>Experiment name<input data-pl-name maxlength="100" value="My portfolio experiment"></label><label>Research note<textarea data-pl-note maxlength="2000" rows="3" placeholder="What are you trying to understand?"></textarea></label><label class="pl-partial" data-pl-partial hidden><input type="checkbox" data-pl-ack> I understand this covers only priced holdings.</label><button type="button" data-pl-action="save">Save private version</button><small data-pl-save-help>Practice inputs cannot be saved as real portfolio research.</small></div></aside></div>
 <section class="pl-card pl-compare" data-pl-compare hidden><div class="pl-card-head"><h3>Keep your research trail.</h3><span>Each version keeps its own baseline and assumptions</span></div><div data-pl-versions></div></section>
 <details class="pl-basis"><summary>Sources, dates &amp; what these results mean</summary><p data-pl-basis></p><div data-pl-sources></div><p>These are allocation and arithmetic shock experiments. Historical volatility, drawdowns and strategy returns need separately supported data and are not calculated in this release.</p></details></section>`;
 const guide=basketsEnabled?createPortfolioGuide(root):null;
 q('.pl-layout').insertAdjacentHTML('beforebegin',`<section class="pl-live-compare" data-pl-live-compare hidden aria-label="Live idea comparison"><div class="pl-card-head"><div><span class="pl-eyebrow">ONE STARTING IDEA · TWO EXPERIMENTS</span><h3>What would you change?</h3><p class="pl-help">Choose an experiment, then use the editor below. Save each idea as a private version; the three-card workspace stays in this tab.</p></div></div><div class="pl-idea-cards" data-pl-idea-cards></div><div class="pl-comparison-actions"><button type="button" data-pl-comparison-action="duplicate">Duplicate to Experiment 2</button><button type="button" data-pl-comparison-action="reset">Reset selected idea</button><button type="button" data-pl-comparison-action="undo" disabled>Undo comparison action</button><button type="button" data-pl-comparison-action="clear">Discard experiments</button><label>Chart shows<select data-pl-comparison-measure aria-label="Comparison chart measure"><option value="value">Assumed value</option><option value="today_value">Today’s rupees</option></select></label></div><p class="pl-help" data-pl-comparison-help role="status"></p></section>`);
 q('.pl-editor').insertAdjacentHTML('afterbegin',`<div class="pl-remix" ${basketsEnabled?'':'hidden'}><button type="button" data-pl-action="equal">Equal weights</button><button type="button" data-pl-action="shuffle">Shuffle weights</button><button type="button" data-pl-action="undo" disabled>Undo mix</button></div><p class="pl-help" ${basketsEnabled?'':'hidden'}>Remix unlocked assets; cash stays fixed. Random weights are experiments, not recommendations.</p>`);
 q('[data-pl-sectors]').insertAdjacentHTML('beforebegin',`<div class="pl-growth-controls" data-pl-growth-controls hidden><div class="pl-growth-inputs"><label>Monthly contribution · ₹<input type="number" data-pl-monthly min="0" max="1000000" step="100" value="0"></label><label>Assumed inflation · %<input type="number" data-pl-inflation min="0" max="20" step="0.1" value="0"></label></div><label>Time horizon <output data-pl-horizon-output>5 years</output><input type="range" data-pl-horizon min="1" max="30" step="1" value="5" aria-label="Time horizon in years"></label><div class="pl-growth-inputs"><label>Assumed net annual return · %<input type="number" data-pl-all-rate min="-100" max="100" step="0.5" value="0"></label><button type="button" data-pl-action="all-rate">Apply to all assets</button></div><p class="pl-help">Set a different return beside each asset if you wish. Returns are your assumptions, after fund expenses and including distributions. Monthly additions occur at month end; cash earns 0%. No rebalancing or purchases are simulated.</p><label>Inspect year <output data-pl-year-output>5</output><input type="range" data-pl-year min="0" max="5" step="1" value="5" aria-label="Inspect projected year"></label><div data-pl-growth-readout aria-live="polite"></div></div>`);
 const usability=basketsEnabled&&comparisonEnabled?createPortfolioUsability(root,{esc,say,videoGuide:guide,
  state:()=>({loaded:!!snapshot?.assets.length,view,pending,saving,locked:!!spec?.locked.length,idea:ideaNames[comparison?.active??1]}),
  navigate:setView}):null;
 const comparing=()=>view==='compare'&&comparisonEnabled;
 function setPending(value){pending=value;q('[data-pl-update]').textContent=value?'Updating…':'Ready';root.dataset.pending=String(value);q('[data-pl-readings]').hidden=value||view==='growth'||comparing();q('[data-pl-growth-readout]').hidden=value||comparing();qa('[data-pl-action="save"]').forEach(b=>b.disabled=value||saving||!snapshot||snapshot.practice||!api.authenticated());}
 async function post(operation,body){return request(base+operation+'/',{method:'POST',headers:{'Content-Type':'application/json','X-CSRFToken':csrf},body:JSON.stringify(body)});}
 const privateDirty=()=>api.authenticated()&&((dirty&&!snapshot?.practice)||comparison?.slots.slice(1).some(s=>s.dirty&&!s.snapshot.practice));
 const captureIdea=()=>structuredClone({snapshot,token,specification:spec,preview:result,dirty,undo,name:q('[data-pl-name]').value,note:q('[data-pl-note]').value,ack:q('[data-pl-ack]').checked});
 function syncIdea(){if(comparison)comparison.slots[comparison.active]=captureIdea();}
 function renderComparison(){
  q('[data-pl-growth-readout]').hidden=pending||comparing();
  q('[data-pl-live-compare]').hidden=!comparing()||!comparison;if(!comparing()||!comparison)return;
  syncIdea();const expanded=[...q('[data-pl-idea-cards]').querySelectorAll('details[open]')].map(d=>d.dataset.plIdeaMore);
  q('[data-pl-idea-cards]').innerHTML=renderComparisonCards(comparison,{esc,money,pct,year,pending,measure:comparisonMeasure});
  for(const id of expanded){const details=q('[data-pl-idea-more="'+id+'"]');if(details)details.open=true;}
  const target=comparison.active===1?2:1;
  q('[data-pl-comparison-action="duplicate"]').textContent='Duplicate to '+ideaNames[target];
  for(const button of qa('[data-pl-comparison-action]'))button.disabled=saving||(pending&&!(['retry','clear'].includes(button.dataset.plComparisonAction)&&comparison.error))||(button.dataset.plComparisonAction==='undo'&&!comparison.undo);
  q('[data-pl-comparison-help]').textContent='Editing '+ideaNames[comparison.active]+'. The starting idea stays fixed. Returns are your assumptions, not a forecast.';
  q('.pl-editor .pl-card-head h3').textContent=ideaNames[comparison.active]+' · your mix';
  q('[data-pl-save-help]').textContent=snapshot.practice?'Fictional practice ideas cannot be saved.':!api.authenticated()?'Sign in to save this idea privately.':'Save '+ideaNames[comparison.active]+' as a private version. Other ideas stay in this tab.';
 }
 function chooseIdea(index){
  if(![1,2].includes(index))return;
  if(pending||saving){say('Wait for the latest calculation or save before switching ideas.');return;}
  syncIdea();comparison.active=index;restoreIdea();q('[data-pl-idea="'+index+'"]').focus({preventScroll:true});q('[data-pl-idea="'+index+'"]').closest('article').scrollIntoView({block:'nearest',inline:'nearest'});
 }
 function restoreIdea(){
  const slot=structuredClone(comparison.slots[comparison.active]);
  selectSource({snapshot:slot.snapshot,token:slot.token,preview:slot.preview},true,true);
  dirty=slot.dirty;undo=slot.undo;draftRevision++;q('[data-pl-name]').value=slot.name;q('[data-pl-note]').value=slot.note;q('[data-pl-ack]').checked=slot.ack;q('[data-pl-action="undo"]').disabled=!undo;render();
 }
 function remember(){undo=structuredClone(spec);q('[data-pl-action="undo"]').disabled=false;}
 function picked(){q('[data-pl-picked]').innerHTML=basketItems.map(a=>`<div><span><strong>${esc(a.ticker)}</strong><small>${esc(a.name)}</small></span><button type="button" data-pl-remove="${a.id}" aria-label="Remove ${esc(a.ticker)} from basket" ${spec?.locked.includes(a.id)?'disabled':''}>×</button></div>`).join('');q('[data-pl-action="apply-basket"]').disabled=!basketItems.length;q('[data-pl-action="apply-basket"]').textContent=snapshot?.source_kind==='basket'?'Update basket':'Create basket';}
 function catalogRender(){q('[data-pl-search-results]').innerHTML=catalogItems.map(a=>`<button type="button" data-pl-add="${a.id}" ${!a.eligible||basketItems.some(b=>b.id===a.id)?'disabled':''}><span class="pl-asset-kind">${esc(a.kind==='fund'?'Mutual fund':a.kind.toUpperCase())}</span><strong>${esc(a.ticker)}</strong><span>${esc(a.name)}</span><small>${esc(a.reason||a.category||a.sector)}</small><i aria-hidden="true">${basketItems.some(b=>b.id===a.id)?'✓':'＋'}</i></button>`).join('');}
 async function searchCatalog(){
  const id=++catalogSequence,query=q('[data-pl-search]').value.trim(),kind=q('[data-pl-kind]').value;
  if(query.length<2){catalogItems=[];catalogRender();q('[data-pl-search-status]').textContent='Type at least two characters.';return;}
  q('[data-pl-search-status]').textContent='Searching supported instruments…';
  try{const r=await request(base+'catalog/?q='+encodeURIComponent(query)+'&kind='+kind);if(id!==catalogSequence)return;catalogItems=r.instruments;catalogRender();q('[data-pl-search-status]').textContent=r.instruments.length?r.hint:'No matching instruments in the supported catalog. Try a ticker, fund name or scheme code.';}
  catch(error){if(id===catalogSequence){catalogItems=[];catalogRender();q('[data-pl-search-status]').textContent=error.message;}}
 }
 function showBuilder(){
  q('[data-pl-builder]').hidden=false;basketItems=snapshot?.source_kind==='basket'?snapshot.assets.map(a=>({...a})):[];
  q('[data-pl-budget]').value=snapshot?.source_kind==='basket'?snapshot.budget:'100000';picked();catalogRender();q('[data-pl-search]').focus();
 }
 async function applyBasket(){
  if(saving){say('Wait for the save to finish before changing the basket.');return;}
  const keep=snapshot?.source_kind==='basket';
  if(privateDirty()&&!keep){say('Save or reset your current holdings experiment before creating a basket.');return;}
  if(!basketItems.length){say('Add at least one instrument first.');return;}
  const id=++sourceSequence;sequence++;clearTimeout(timer);root.setAttribute('aria-busy','true');
  try{
   const r=await post('basket',{assets:basketItems.map(a=>a.id),budget:q('[data-pl-budget]').value});if(id!==sourceSequence)return;
   if(keep&&spec){
    const previous=structuredClone(spec),ids=r.snapshot.assets.map(a=>a.id);
    previous.cash_bps+=Object.entries(previous.weights).filter(([key])=>!ids.includes(key)).reduce((sum,[,value])=>sum+value,0);
    previous.weights=Object.fromEntries(ids.map(key=>[key,previous.weights[key]??0]));previous.locked=previous.locked.filter(key=>ids.includes(key));
    previous.shocks=Object.fromEntries(ids.map(key=>[key,previous.shocks[key]??'0']));
    if(previous.projection)previous.projection.rates=Object.fromEntries(ids.map(key=>[key,previous.projection.rates[key]??'0']));
    r.preview=(await post('preview',{token:r.token,specification:previous})).preview;if(id!==sourceSequence)return;
   }
   const retainComparison=!!comparison&&keep;
   selectSource(r,keep,retainComparison);dirty=true;draftRevision++;if(retainComparison)comparison.response=null;q('[data-pl-builder]').hidden=true;setView(retainComparison?'compare':'mix');
   say('Custom basket ready. Reference prices are dated information; your budget, weights and returns are hypothetical. New assets in an edited basket start at 0%; use Equal weights or fund them from cash.');
  }catch(error){if(id===sourceSequence)say(error.message);}finally{if(id===sourceSequence)root.removeAttribute('aria-busy');}
 }
 function ensureProjection(){spec.projection??={years:5,monthly:'0',inflation_pct:'0',rates:Object.fromEntries(snapshot.assets.map(a=>[a.id,'0']))};}
 function growthReadout(){
  if(comparing()){renderComparison();q('[data-pl-year-output]').textContent=String(year);canvas();return;}
  const p=result?.projection;if(!p||pending){q('[data-pl-growth-readout]').innerHTML='';return;}
  const point=p.points[Math.min(year,p.points.length-1)];
  q('[data-pl-growth-readout]').innerHTML=`<div class="pl-growth-summary"><span>YEAR ${point.month/12} · UNDER YOUR ASSUMPTIONS</span><strong>${money(point.value)}</strong><div><span>Money added <b>${money(point.contributed)}</b></span><span>Assumed growth <b>${money(point.growth)}</b></span><span>In today’s rupees <b>${money(point.today_value)}</b></span></div></div>`;
  q('[data-pl-year-output]').textContent=String(year);
  for(const dot of qa('[data-pl-year-dot]'))dot.setAttribute('r',Number(dot.dataset.plYearDot)===year?'6':'3');
 }
 function growthCanvas(){
  q('[data-pl-chart-title]').textContent='Give your idea time.';q('[data-pl-chart-label]').textContent='YOUR ASSUMPTIONS · NOT A FORECAST';
  if(pending||!result.projection){q('[data-pl-chart]').innerHTML='<div class="pl-chart-wait">Updating your assumed growth path…</div>';return;}
  const points=result.projection.points,max=Math.max(...points.flatMap(p=>[Number(p.value),Number(p.contributed),Number(p.today_value)]),1);
  const coord=(p,i,key)=>[30+i/(points.length-1)*520,260-Number(p[key])/max*220];
  const path=key=>points.map((p,i)=>(i?'L':'M')+coord(p,i,key).join(',')).join(' ');
  q('[data-pl-chart]').innerHTML=`<svg class="pl-growth-chart" viewBox="0 0 580 305" role="img" aria-label="Hypothetical growth and contributions under your assumptions; not historical performance or a forecast."><path class="pl-growth-grid" d="M30 40H550 M30 150H550 M30 260H550"/><path class="pl-growth-area" d="${path('value')} L550,260 L30,260 Z"/><path class="pl-growth-line" d="${path('value')}"/><path class="pl-contribution-line" d="${path('contributed')}"/>${Number(spec.projection.inflation_pct)>0?`<path class="pl-today-line" d="${path('today_value')}"/>`:''}${points.map((p,i)=>{const [x,y]=coord(p,i,'value');return `<circle cx="${x}" cy="${y}" r="${i===year?6:3}" class="pl-growth-dot" data-pl-year-dot="${i}"/><text x="${x}" y="285" text-anchor="middle">${i===0||i===points.length-1||i%5===0?'Y'+i:''}</text>`;}).join('')}</svg><div class="pl-growth-legend"><span>Assumed value</span><span>Money added</span>${Number(spec.projection.inflation_pct)>0?'<span>Today’s rupees</span>':''}</div><p class="pl-help">Move the year slider or hover a chart point. The smooth path follows constant assumed returns; real markets fluctuate.</p>`;
  growthReadout();
 }
 async function lists(){
  if(!api.authenticated()){q('[data-pl-source]').disabled=true;q('[data-pl-source]').closest('label').hidden=true;q('[data-pl-action="load"]').disabled=true;q('[data-pl-action="load"]').hidden=true;say(basketsEnabled?'Build a custom basket or try practice. Sign in to load holdings and save private experiments.':'Sign in to load private holdings. The practice basket is available to explore.');return;}
  const [portfolios,experiments]=await Promise.all([request(base),request(base+'experiments/')]);
  const sourceID=q('[data-pl-source]').value;
  q('[data-pl-source]').innerHTML='<option value="">Choose your portfolio</option>'+portfolios.portfolios.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('');
  q('[data-pl-source]').value=portfolios.portfolios.some(p=>String(p.id)===sourceID)?sourceID:portfolios.portfolios.length===1?portfolios.portfolios[0].id:'';
  q('[data-pl-experiment]').innerHTML='<option value="">Choose saved research</option>'+experiments.experiments.map(e=>`<option value="${e.id}" ${experiment?.id===e.id?'selected':''}>${esc(e.name)} · v${e.revision}</option>`).join('');
  q('[data-pl-reopen]').hidden=!experiments.experiments.length;
  if(!portfolios.portfolios.length)say('No saved portfolio yet. Try the practice basket or add holdings in Portfolio.');
 }
 function selectSource(r,keep=false,preserveComparison=false){
  if(!preserveComparison){comparison=null;comparisonMeasure='value';q('[data-pl-comparison-measure]').value='value';}
  sequence++;clearTimeout(timer);snapshot=r.snapshot;token=r.token;result=r.preview;spec=result?structuredClone(result.specification):null;
  selected=snapshot.assets[0]?.id??null;dirty=false;undo=null;q('[data-pl-action="undo"]').disabled=true;
  if(!keep){experiment=null;versions=[];q('[data-pl-name]').value=snapshot.practice?'Practice experiment':snapshot.source_name+' · what if';q('[data-pl-note]').value='';}
  q('[data-pl-empty]').hidden=!!snapshot.assets.length;q('[data-pl-workspace]').hidden=!snapshot.assets.length;
  if(!snapshot.assets.length){q('[data-pl-empty]').innerHTML=`<h3>No priced holdings available.</h3><p>${esc(snapshot.excluded.map(a=>a.ticker+': '+a.reason).join(' · ')||'This portfolio has no currently held stocks.')}</p><a href="/screener/portfolio/">Inspect Portfolio ↗</a><button type="button" data-pl-action="practice">Try a practice basket</button>`;say('No priced holdings are available. Exclusions are shown below.');usability?.sync();return;}
  q('[data-pl-chart]').replaceChildren();q('[data-pl-action="reset"]').textContent=experiment?'Discard edits':'Reset mix';
  q('[data-pl-source-name]').textContent=snapshot.source_name;
  q('[data-pl-badge]').textContent=snapshot.practice?'FICTIONAL PRACTICE · NOT MARKET DATA':snapshot.source_kind==='basket'?'REAL INSTRUMENTS · HYPOTHETICAL BUDGET':'Private research copy · no orders';
  q('[data-pl-scope]').textContent=snapshot.practice?'Illustrative amounts':snapshot.source_kind==='basket'?`${snapshot.assets.length} assets · ${money(snapshot.budget)} starting budget · ${snapshot.coverage.priced} dated reference prices`:`${snapshot.coverage.priced}/${snapshot.coverage.held} holdings priced · frozen copy`;
  q('[data-pl-partial]').hidden=!snapshot.excluded.length;q('[data-pl-ack]').checked=false;
  q('[data-pl-basis]').textContent=snapshot.basis+' Snapshot captured '+snapshot.captured_at+'.';
  q('[data-pl-sources]').innerHTML=snapshot.assets.map(a=>`<p><strong>${esc(a.ticker)}</strong> · ${esc(a.source)} · ${esc(a.price_as_of??(snapshot.practice?'Illustrative; no market date':'Reference price unavailable'))}${a.price_reason?' · '+esc(a.price_reason):''}${a.url?` · <a href="${esc(a.url)}">Instrument details ↗</a>`:''}</p>`).join('')+snapshot.excluded.map(a=>`<p><strong>${esc(a.ticker)} excluded:</strong> ${esc(a.reason)}</p>`).join('');
  q('[data-pl-target]').innerHTML='<option value="all">All assets</option>'+[...new Set(snapshot.assets.map(a=>a.sector))].map(s=>`<option value="sector:${esc(s)}">${esc(s)} group</option>`).join('')+snapshot.assets.map(a=>`<option value="holding:${a.id}">${esc(a.ticker)}</option>`).join('');
  if(snapshot.source_kind==='basket'){basketItems=snapshot.assets.map(a=>({...a}));picked();}
  renderHoldings();setPending(false);render();say(snapshot.practice?'Fictional practice basket loaded. Try moving an allocation, then explore a shock.':snapshot.excluded.length?'Loaded the priced portion only. Inspect excluded holdings in Sources & dates.':'Snapshot loaded. Change the research mix; recorded holdings stay unchanged.');
 }
 function renderHoldings(){q('[data-pl-holdings]').innerHTML=snapshot.assets.map((a,i)=>`<div class="pl-holding" data-pl-row="${a.id}"><div class="pl-holding-head"><button type="button" data-pl-select="${a.id}" aria-pressed="${selected===a.id}"><i style="background:${colour(i)}"></i><span><strong>${esc(a.ticker.replace(/\.NS$/,''))}</strong><small>${esc(a.name)}</small></span></button><label class="pl-lock"><input type="checkbox" data-pl-lock="${a.id}" ${spec.locked.includes(a.id)?'checked':''}>Lock</label></div><div class="pl-weight"><input type="range" min="0" max="10000" step="1" value="${spec.weights[a.id]}" data-pl-weight="${a.id}" aria-label="${esc(a.ticker)} proposed weight" ${spec.locked.includes(a.id)?'disabled':''}><label><input type="number" min="0" max="100" step="0.01" value="${spec.weights[a.id]/100}" data-pl-number="${a.id}" aria-label="${esc(a.ticker)} exact weight percent" ${spec.locked.includes(a.id)?'disabled':''}><span>%</span></label></div><span class="pl-baseline-note">Baseline <span data-pl-before="${a.id}">${pct(result.holdings.find(h=>h.id===a.id).baseline_bps)}</span></span><label class="pl-return-input" data-pl-return-row ${view==='growth'?'':'hidden'}>Your assumed net annual return · %<input type="number" data-pl-return="${a.id}" aria-label="${esc(a.ticker)} assumed annual return percent" min="-100" max="100" step="0.5" value="${esc(spec.projection?.rates[a.id]??'0')}"></label></div>`).join('');}
 function syncInputs(){
  for(const input of qa('[data-pl-weight]')){input.value=spec.weights[input.dataset.plWeight];input.disabled=spec.locked.includes(input.dataset.plWeight);}
  for(const input of qa('[data-pl-number]')){input.value=spec.weights[input.dataset.plNumber]/100;input.disabled=spec.locked.includes(input.dataset.plNumber);}
  for(const input of qa('[data-pl-lock]'))input.checked=spec.locked.includes(input.dataset.plLock);
  for(const el of qa('[data-pl-return-row]'))el.hidden=view!=='growth'&&!comparing();
  if(spec.projection){q('[data-pl-monthly]').value=spec.projection.monthly;q('[data-pl-inflation]').value=spec.projection.inflation_pct;q('[data-pl-horizon]').value=spec.projection.years;q('[data-pl-horizon-output]').textContent=spec.projection.years+(spec.projection.years===1?' year':' years');const horizon=comparing()&&comparison?Math.max(...comparison.slots.map(s=>s.specification.projection.years)):spec.projection.years;q('[data-pl-year]').max=horizon;year=Math.min(year,horizon);q('[data-pl-year]').value=year;q('[data-pl-year-output]').textContent=String(year);for(const el of qa('[data-pl-return]'))el.value=spec.projection.rates[el.dataset.plReturn];}
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
  if(comparing()){
   q('[data-pl-chart-title]').textContent='Three ideas. One clear view.';q('[data-pl-chart-label]').textContent='YOUR ASSUMPTIONS · NOT A FORECAST';
   if(comparison?.error){q('[data-pl-chart]').innerHTML='<div class="pl-chart-wait">We couldn’t update the comparison.<br><button type="button" data-pl-comparison-action="retry">Try again</button></div>';return;}
   q('[data-pl-chart]').innerHTML=pending||!comparison?.response?'<div class="pl-chart-wait">Checking all three ideas…</div>':comparisonChart(comparison.response,{money,year,measure:comparisonMeasure});return;
  }
  const before=Object.fromEntries(result.holdings.map(h=>[h.id,h.baseline_bps]));
  if(view==='growth'){growthCanvas();return;}
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
   q('[data-pl-map-name]').textContent=a?.kind==='fund'?a.name.split(' · ')[0].slice(0,24):a?.ticker.replace(/\.NS$/,'')??'Selected holding';q('[data-pl-map-weight]').textContent=pct(spec.weights[selected]??0);
  }
 }
 function render(){if(!spec||!result)return;syncIdea();q('.pl-editor .pl-card-head h3').textContent='Your proposed mix';q('[data-pl-action="reset"]').textContent=experiment?'Discard edits':'Reset mix';syncInputs();canvas();
  q('[data-pl-largest]').textContent=pct(result.proposed.largest_holding_bps);q('[data-pl-largest-before]').textContent='Baseline '+pct(result.baseline.largest_holding_bps);
  q('[data-pl-cash-value]').textContent=money(result.scenario.cash_value);
  q('[data-pl-sectors]').innerHTML=pending||view==='growth'||comparing()?'':`<span class="pl-eyebrow">${snapshot.source_kind==='basket'?'ASSET GROUPS · NO LOOK-THROUGH':'PROPOSED SECTOR MIX'}</span>${result.proposed.sectors.filter(s=>s.weight_bps).map(s=>`<div><span>${esc(s.name)}</span><i><b style="width:${s.weight_bps/100}%"></b></i><strong>${pct(s.weight_bps)}</strong></div>`).join('')}`;
  const a=snapshot.assets.find(a=>a.id===selected),h=result.holdings.find(h=>h.id===selected);
  q('[data-pl-inspector-title]').textContent=a?.name??'Select a holding';
  q('[data-pl-inspector]').innerHTML=`<p class="pl-inspector-sector">${esc(a?.sector)}</p><div class="pl-change"><span>${pct(h?.baseline_bps??0)}<small>baseline</small></span><i aria-hidden="true">→</i><span>${pct(spec.weights[selected]??0)}<small>proposed</small></span></div>${pending?'<p>Results are updating for your latest edit.</p>':`<p>${view==='shocks'?`${esc(a.ticker)} has a ${esc(h.shock_pct)}% assumed price move. Its proposed value change is ${money(h.proposed_impact)}.`:`This holding is ${pct(h.proposed_bps)} of your research mix, compared with ${pct(h.baseline_bps)} in the frozen baseline.`}</p><div class="pl-effect"><small>${view==='shocks'?'Portfolio shock impact difference':'Proposed allocation value'}</small><strong>${money(view==='shocks'?result.scenario.impact_difference:h.proposed_value)}</strong><span>${view==='shocks'?'Proposed minus baseline; under your assumptions.':'Hypothetical allocation; no transaction created.'}</span></div>`}`;
  if(snapshot.source_kind==='basket')q('[data-pl-inspector]').insertAdjacentHTML('beforeend',`<div class="pl-reference"><small>${a.kind==='fund'?'Stored NAV':a.kind==='etf'?'Stored exchange close':'Stored reference price'}</small><strong>${a.price===null?'Unavailable':money(a.price)}</strong><span>${esc(a.price_as_of??a.price_reason)}${a.age_days!==undefined?' · '+a.age_days+' '+(a.age_days===1?'day':'days')+' old':''}</span><p>${esc(a.kind==='fund'?[a.plan,a.option].filter(Boolean).join(' · '):a.kind==='etf'?'ETF exchange price; NAV is a different measure.':'Reference information, not a live executable quote.')}</p></div>`);
  if(view==='growth'&&!pending&&result.projection){const asset=result.projection.assets.find(v=>v.id===selected);q('[data-pl-inspector]').insertAdjacentHTML('beforeend',`<div class="pl-reference"><small>At year ${spec.projection.years} · your ${esc(asset.annual_pct)}% assumption</small><strong>${money(asset.value)}</strong><span>Includes this asset’s share of monthly contributions. Not a forecast.</span></div>`);growthReadout();}
  q('[data-pl-save-help]').textContent=snapshot.practice?'Fictional practice inputs cannot be saved as real portfolio research.':!api.authenticated()?'Sign in to save this custom basket privately.':experiment?`Private experiment · ${dirty?'unsaved edits':'saved v'+experiment.revision}`:'Save a private experiment and keep its frozen baseline.';renderComparison();usability?.sync();
 }
 function edited(){dirty=true;draftRevision++;sequence++;if(comparison){comparison.response=null;comparison.error=null;}setPending(true);render();clearTimeout(timer);const id=sequence;timer=setTimeout(()=>calculate(id),160);}
 async function calculate(id){
  syncIdea();const body=JSON.stringify(spec),live=comparing()&&comparison;
  try{
   const r=await post(live?'compare':'preview',live?{ideas:comparisonSamples(comparison)}:{token,specification:spec});
   if(id!==sequence||body!==JSON.stringify(spec))return;
   if(live){comparison.response=r.comparison;for(let i=0;i<3;i++){comparison.slots[i].preview=r.comparison.previews[i];comparison.slots[i].specification=structuredClone(r.comparison.previews[i].specification);}result=r.comparison.previews[comparison.active];}
   else result=r.preview;
   spec=structuredClone(result.specification);setPending(false);render();say('Updated for your assumptions. Recorded holdings are unchanged.');
  }
  catch(error){if(id!==sequence)return;setPending(true);q('[data-pl-update]').textContent='Needs attention';if(comparing()&&comparison){comparison.error=error.message;render();}say(error.message);}
 }
 function setView(next){
  view=next;qa('[data-pl-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.plView===view)));
  q('[data-pl-shock-controls]').hidden=view!=='shocks';q('[data-pl-growth-controls]').hidden=view!=='growth'&&!comparing();q('[data-pl-mix-legend]').hidden=view==='growth'||comparing();q('[data-pl-readings]').hidden=pending||view==='growth'||comparing();q('[data-pl-compare]').hidden=view!=='compare';
  if(comparing()&&spec){
   if(!spec.projection){ensureProjection();dirty=true;draftRevision++;}
   comparison??=createComparisonState(captureIdea());comparison.error=null;syncIdea();
   sequence++;clearTimeout(timer);setPending(true);render();const id=sequence;timer=setTimeout(()=>calculate(id),160);
  }else if(view==='growth'&&spec&&!spec.projection){ensureProjection();edited();}else if(result)render();usability?.viewChanged();
 }
 async function load(kind){
  if(saving){say('Wait for the save to finish before loading another source.');return;}
  if(privateDirty()){say('Save or reset the current research copy before loading another source.');return;}
  const id=++sourceSequence;sequence++;clearTimeout(timer);say('Loading a frozen copy…');root.setAttribute('aria-busy','true');
  try{const selectedID=q('[data-pl-source]').value;if(kind!=='practice'&&!selectedID)throw Error('Choose a saved portfolio first.');const r=await request(base+(kind==='practice'?'practice/':'snapshot/?portfolio='+encodeURIComponent(selectedID)));if(id!==sourceSequence)return;selectSource(r);setView('mix');}
  catch(error){if(id===sourceSequence)say(error.message);}finally{if(id===sourceSequence)root.removeAttribute('aria-busy');}
 }
 async function open(id){
  if(!id)return;if(saving){say('Wait for the save to finish before opening research.');return;}if(privateDirty()){say('Save or reset your current edits before opening another experiment.');q('[data-pl-experiment]').value=experiment?.id??'';return;}
  const generation=++sourceSequence;sequence++;clearTimeout(timer);say('Opening saved research…');
  try{const r=await request(base+'experiment/'+encodeURIComponent(id)+'/');if(generation!==sourceSequence)return;experiment=r.experiment;versions=r.versions;const latest=versions[0];selectSource({snapshot:latest.snapshot,token:r.token,preview:latest.result},true);q('[data-pl-name]').value=experiment.name;q('[data-pl-note]').value=latest.note;renderVersions();setView('compare');say(r.source_state==='current'?'Opened a saved version with its frozen baseline.':r.source_state==='custom_basket'?'Opened your saved basket. Every version keeps its own instruments, budget and assumptions.':r.source_state==='source_deleted'?'The source portfolio was deleted. Your saved research copy remains private.':'The source portfolio has changed. This experiment keeps its frozen baseline.');}
  catch(error){if(generation===sourceSequence)say(error.message);}
 }
 function renderVersions(){q('[data-pl-versions]').innerHTML=versions.length?`<div class="pl-version-scroll"><table><caption>Saved versions · different budgets, instruments or assumptions are distinct experiments, not relative performance</caption><thead><tr><th scope="col">Version / assets</th><th scope="col">Starting value</th><th scope="col">Largest position</th><th scope="col">Cash</th><th scope="col">Shock change</th><th scope="col">Assumed future value</th><th scope="col">Inspect</th></tr></thead><tbody>${versions.map(v=>`<tr><th scope="row">v${v.number}<small class="pl-version-assets">${esc(v.snapshot.assets.map(a=>a.ticker).join(' · '))}</small></th><td>${money(v.result.priced_value)}</td><td>${pct(v.result.proposed.largest_holding_bps)}</td><td>${pct(v.specification.cash_bps)}</td><td>${money(v.result.scenario.proposed_impact)}</td><td>${v.result.projection?money(v.result.projection.final.value)+' · '+v.specification.projection.years+'y':'Not modelled'}</td><td><button type="button" data-pl-version="${v.number}">Use this mix</button></td></tr>`).join('')}</tbody></table></div>`:'<p>Save a private version to begin a comparison trail.</p>';}
 async function useVersion(number){
  if(saving){say('Wait for the save to finish before switching versions.');return;}
  const generation=++sourceSequence;sequence++;clearTimeout(timer);
  try{const r=await request(base+'experiment/'+experiment.id+'/?version='+number);if(generation!==sourceSequence)return;const v=r.versions.find(v=>v.number===number);experiment=r.experiment;versions=r.versions;selectSource({snapshot:v.snapshot,token:r.token,preview:v.result},true);q('[data-pl-note]').value=v.note;dirty=true;draftRevision++;renderVersions();setView(view);say('Loaded saved version '+number+' as a new draft, including its original instruments and baseline. Earlier versions remain unchanged.');}
  catch(error){if(generation===sourceSequence)say(error.message);}
 }
 async function save(){
  if(saving||pending){say('Wait for the latest edit or save to finish.');return false;}if(!snapshot||snapshot.practice){say('Load a real saved portfolio before saving private research.');return false;}if(!api.authenticated()){say('Sign in to save private research.');return false;}
  const savedDraftRevision=draftRevision,body={token,specification:structuredClone(spec),name:q('[data-pl-name]').value,note:q('[data-pl-note]').value,acknowledge_partial:q('[data-pl-ack]').checked,...(experiment?{expected_revision:experiment.revision}:{})};
  saving=true;setPending(pending);say('Saving a private version…');
  try{const r=await post(experiment?'experiment/'+experiment.id:'experiments',body);experiment=r.experiment;versions.unshift(r.version);if(savedDraftRevision===draftRevision)dirty=false;renderVersions();render();await lists();say('Saved private version '+r.version.number+'. Its valuation baseline stays frozen.');return !dirty;}
  catch(error){say(error.message);return false;}
  finally{saving=false;setPending(pending);render();}
 }
 root.addEventListener('click',event=>{
  const idea=event.target.closest('[data-pl-idea]');if(idea&&comparison){chooseIdea(Number(idea.dataset.plIdea));return;}
  const compareAction=event.target.closest('[data-pl-comparison-action]')?.dataset.plComparisonAction;
  if(compareAction&&comparison){
   if(saving||(pending&&!(compareAction==='retry'||compareAction==='clear') )){say('Wait for the latest calculation or save.');return;}
   if(compareAction==='retry'){comparison.error=null;sequence++;clearTimeout(timer);setPending(true);render();calculate(sequence);return;}
   syncIdea();
   if(compareAction==='clear'){
    const starting=structuredClone(comparison.slots[0]);comparison=null;
    selectSource({snapshot:starting.snapshot,token:starting.token,preview:starting.preview},true);
    dirty=starting.dirty;q('[data-pl-name]').value=starting.name;q('[data-pl-note]').value=starting.note;setView('growth');say('Local comparison drafts discarded. Saved versions are unchanged.');return;
   }
   comparison=compareAction==='undo'?undoComparisonAction(comparison):copyComparisonIdea(comparison,compareAction==='reset'?0:comparison.active,compareAction==='reset'?comparison.active:comparison.active===1?2:1);
   restoreIdea();setView('compare');return;
  }
  const add=event.target.closest('[data-pl-add]');if(add){if(basketItems.length>=25){say('A basket supports at most 25 assets.');return;}const asset=catalogItems.find(a=>a.id===add.dataset.plAdd);if(asset?.eligible&&!basketItems.some(a=>a.id===asset.id)){basketItems.push({...asset});picked();catalogRender();}return;}
  const remove=event.target.closest('[data-pl-remove]');if(remove){if(spec?.locked.includes(remove.dataset.plRemove)){say('Unlock this asset before removing it.');return;}basketItems=basketItems.filter(a=>a.id!==remove.dataset.plRemove);picked();catalogRender();return;}
  const select=event.target.closest('[data-pl-select]');if(select){selected=select.dataset.plSelect;render();return;}
  const tab=event.target.closest('[data-pl-view]');if(tab){setView(tab.dataset.plView);return;}
  const revision=event.target.closest('[data-pl-version]');if(revision){useVersion(Number(revision.dataset.plVersion));return;}
  const action=event.target.closest('[data-pl-action]')?.dataset.plAction;if(!action)return;
  Promise.resolve().then(async()=>{
   if(action==='builder'){showBuilder();return;}
   if(action==='close-builder'){q('[data-pl-builder]').hidden=true;q('[data-pl-action="builder"]').focus();return;}
   if(action==='apply-basket')return applyBasket();
   if(action==='equal'||action==='shuffle'){const random=new Uint32Array(Object.keys(spec.weights).length);crypto.getRandomValues(random);const next=remix(spec,action,Array.from(random,v=>v+1));remember();spec=next;edited();say(action==='shuffle'?'Random allocation experiment. Locks and cash are preserved.':'Equal weights applied to unlocked assets. Locks and cash are preserved.');return;}
   if(action==='undo'){if(!undo)return;spec=undo;undo=null;q('[data-pl-action="undo"]').disabled=true;edited();return;}
   if(action==='all-rate'){ensureProjection();const value=q('[data-pl-all-rate]').value;if(value===''||!Number.isFinite(Number(value))||Number(value)<-100||Number(value)>100)throw Error('Enter an assumed annual return from −100% to +100%.');remember();spec.projection.rates=Object.fromEntries(snapshot.assets.map(a=>[a.id,value]));edited();return;}
   if(action==='practice'||action==='load')return load(action);
   if(action==='save')return save();
   if(action==='reset'){if(!snapshot)return;if(saving){say('Wait for the save to finish before discarding edits.');return;}if(experiment&&versions.length){const id=++sourceSequence;sequence++;clearTimeout(timer);const r=await request(base+'experiment/'+experiment.id+'/');if(id!==sourceSequence)return;experiment=r.experiment;versions=r.versions;const latest=versions[0];selectSource({snapshot:latest.snapshot,token:r.token,preview:latest.result},true);q('[data-pl-name]').value=experiment.name;q('[data-pl-note]').value=latest.note;renderVersions();setPending(false);renderHoldings();setView(view);say('Unsaved edits discarded. Restored the latest saved version.');}else{remember();spec={weights:Object.fromEntries(result.holdings.map(h=>[h.id,h.baseline_bps])),cash_bps:0,shocks:{},transfer_mode:'cash',locked:[],...(spec.projection?{projection:structuredClone(spec.projection)}:{})};renderHoldings();edited();dirty=false;}return;}
   if(action==='apply-shock'){if(q('[data-pl-shock-number]').value==='')throw Error('Enter your assumed price move before applying it.');const target=q('[data-pl-target]').value,ids=snapshot.assets.filter(a=>target==='all'||target==='holding:'+a.id||target==='sector:'+a.sector).map(a=>a.id);spec=setShocks(spec,ids,Number(q('[data-pl-shock-number]').value));edited();}
   if(action==='clear-shocks'){spec=setShocks(spec,snapshot.assets.map(a=>a.id),0);edited();}
  }).catch(error=>say(error.message));
 });
 root.addEventListener('input',event=>{const el=event.target;
  if(el.matches('[data-pl-search]')){catalogItems=[];catalogRender();q('[data-pl-search-status]').textContent=el.value.trim().length<2?'Type at least two characters.':'Searching supported instruments…';catalogSequence++;clearTimeout(catalogTimer);catalogTimer=setTimeout(searchCatalog,200);return;}
  if(el.matches('[data-pl-year]')){year=Number(el.value);growthReadout();return;}
  if(el.matches('[data-pl-monthly],[data-pl-inflation],[data-pl-horizon],[data-pl-return]')){try{ensureProjection();const val=Number(el.value),low=el.matches('[data-pl-horizon]')?1:el.matches('[data-pl-return]')?-100:0,high=el.matches('[data-pl-monthly]')?1000000:el.matches('[data-pl-inflation]')?20:el.matches('[data-pl-horizon]')?30:100;if(el.value===''||!Number.isFinite(val)||val<low||val>high)throw Error('Enter a value within the range shown by this control.');remember();if(el.matches('[data-pl-return]'))spec.projection.rates[el.dataset.plReturn]=el.value;else if(el.matches('[data-pl-monthly]'))spec.projection.monthly=el.value;else if(el.matches('[data-pl-inflation]'))spec.projection.inflation_pct=el.value;else{spec.projection.years=val;year=val;}edited();}catch(error){render();say(error.message);}return;}
  if(el.matches('[data-pl-weight],[data-pl-number]')){try{selected=el.dataset.plWeight??el.dataset.plNumber;const value=Number(el.value),next=el.matches('[data-pl-number]')?Math.round(value*100):value;if(el.value===''||!Number.isFinite(value))throw Error('Enter a numeric allocation.');if(el.matches('[data-pl-number]')&&Math.abs(value*100-next)>1e-7)throw Error('Use at most two decimal places for allocation percentages.');const nextSpec=adjustWeight(spec,selected,next);remember();spec=nextSpec;edited();}catch(error){render();say(error.message);}return;}
  if(el.matches('[data-pl-shock],[data-pl-shock-number]')){const value=el.value;q('[data-pl-shock]').value=value;q('[data-pl-shock-number]').value=value;q('[data-pl-shock-output]').textContent=value+'%';return;}
  if(el.matches('[data-pl-name],[data-pl-note]')&&snapshot&&!snapshot.practice){dirty=true;draftRevision++;render();}
 });
 root.addEventListener('change',event=>{const el=event.target;if(el.matches('[data-pl-kind]')){catalogItems=[];catalogRender();catalogSequence++;clearTimeout(catalogTimer);searchCatalog();}if(el.matches('[data-pl-comparison-measure]')){comparisonMeasure=el.value;renderComparison();canvas();}if(el.matches('[data-pl-transfer]')){remember();spec.transfer_mode=el.value;edited();}if(el.matches('[data-pl-lock]')){remember();const id=el.dataset.plLock;spec.locked=el.checked?[...new Set([...spec.locked,id])]:spec.locked.filter(k=>k!==id);edited();}if(el.matches('[data-pl-experiment]'))open(el.value);});
 root.addEventListener('pointerover',event=>{const dot=event.target.closest('[data-pl-year-dot]');if(dot&&!pending){year=Number(dot.dataset.plYearDot);q('[data-pl-year]').value=year;growthReadout();}});
 window.addEventListener('beforeunload',event=>{if(privateDirty()){event.preventDefault();event.returnValue='';}});
 return {pause:()=>{guide?.close();usability?.pause();},activate(){usability?.sync();if(loaded)return;loadPromise??=lists().then(()=>loaded=true).catch(error=>{loadPromise=null;say(error.message);});return loadPromise;},isDirty:privateDirty,save,render,isActive:()=>!root.hidden};
}
