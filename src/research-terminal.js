import {valuation,returnTable,sensitivity,impliedGrowth,filingChanges} from './research-valuation.js';
import {createValueLab} from './research-value-lab.js';

export function terminalToolSource(value,origin){
 if(typeof value!=='string'||!value.trim()||value==='#')return null;
 try{const source=new URL(value,origin);return ['http:','https:'].includes(source.protocol)&&!source.username&&!source.password&&source.origin===new URL(origin).origin?source.href:null;}catch{return null;}
}

export function createTerminal(api){
 const {$,$$,esc,fmt,dateLabel,changed,toast,getData,getPoint,getPins,getDesk,setView,request,url,showSources}=api;
 const defaults=()=>({version:1,preset:'investing',view:'explore',inspector:true,inspectorWidth:300,split:false,valuation:{model:'earnings',base:null,growth:10,discount:12,terminal:3,years:5,multiple:20,dividend:0,shares:null,cash:null,debt:null,marginSafety:20,price:null,rates:[10,12,15,18]},scenarios:[],thesis:[]});
 let state=defaults(),foMode='history',review=false,focus=false,renderFrame=null,ratesValid=true,lab=null;
 const labels={earnings:'Earnings & exit',equity:'Equity cash flow',firm:'Firm DCF',dividend:'Dividends'};
 const safeSource=value=>terminalToolSource(value,location.origin);
 let valueEvidenceOpen=false;
 const valueLab=createValueLab({...api,getState:()=>state,setValuation:value=>{state.valuation=value;},defaults:()=>defaults().valuation});
 function restore(raw){state={...defaults(),...(raw||{}),valuation:{...defaults().valuation,...(raw?.valuation||{})}};review=false;ratesValid=true;valueEvidenceOpen=false;valueLab?.resetUI();if(!raw)valueLab?.seedFresh();renderValueControls();renderThesis();renderLayout();}
 function reset(){const layout={preset:state.preset,inspector:state.inspector,inspectorWidth:state.inspectorWidth,split:state.split};restore({...defaults(),...layout});}
 function exportState(){const result=structuredClone(state),ids=new Set(getPins().map(p=>p.id));result.thesis=result.thesis.map(t=>({...t,evidence:t.evidence.filter(id=>ids.has(id))}));return result;}
 function renderLayout(){
  const workspace=$('[data-workspace]');workspace.dataset.inspector=String(state.inspector);workspace.dataset.valueEvidence=String(valueEvidenceOpen&&state.view==='valuation');workspace.style.setProperty('--rt-inspector-width',state.inspectorWidth+'px');
  $('[data-inspector-toggle]').setAttribute('aria-pressed',String(valueLab&&state.view==='valuation'?valueEvidenceOpen:state.inspector));$('[data-split-toggle]').setAttribute('aria-pressed',String(state.split));$('[data-workspace-preset]').value=state.preset;
  $('[data-inspector-resize]').setAttribute('aria-valuenow',state.inspectorWidth);
  const split=state.split&&!['charts','derivatives'].includes(state.view);$('[data-split-panel]').hidden=!split;$('.rt-stage').dataset.split=String(split);
  if(split)loadFrame($('[data-split-frame]'),getData()?.links.chart_embed);
  else $('[data-split-frame]').removeAttribute('src');
 }
 function loadFrame(frame,source){
  const href=safeSource(source);if(!href){frame.removeAttribute('src');frame.parentElement.dataset.unavailable='true';return false;}
  frame.parentElement.dataset.unavailable='false';if(frame.getAttribute('src')!==href)frame.src=href;return true;
 }
 function fullLink(selector,href){const a=$(selector),s=safeSource(href);a.hidden=!s;if(s){const u=new URL(s,location.origin);u.searchParams.delete('embed');a.href=u.pathname+u.search;}}
 function renderEngines(){
  const data=getData();if(!data)return;
  const ticker=data.company.ticker.replace(/\.NS$/,'');
  $('[data-engine-chart-title]').textContent=ticker+' · price research';fullLink('[data-chart-full]',data.links.chart_embed);
  if(state.view==='charts'){
   const ok=loadFrame($('[data-chart-frame]'),data.links.chart_embed);
   $('[data-chart-status]').textContent=ok?'Stored price history · date, coverage and source context are shown inside Charting.':'Embedded Charting is unavailable for this deployment. Open the existing Charting product.';
  }else $('[data-chart-frame]').removeAttribute('src');
  $('[data-engine-fo-title]').textContent=ticker+' · options research';
  const key={history:'derivatives_history',strategy:'derivatives_strategy',calculator:'derivatives_calculator'}[foMode];
  const source=data.links[key];fullLink('[data-fo-full]',source);
  for(const b of $$('[data-fo-mode]'))b.setAttribute('aria-pressed',String(b.dataset.foMode===foMode));
  if(state.view==='derivatives'){
   const ok=loadFrame($('[data-fo-frame]'),source);
   $('[data-fo-status]').textContent=ok?(foMode==='calculator'?'Manual inputs · deterministic option pricing and Greeks. No market quote is implied.':foMode==='history'?'Historical snapshots · select an available expiry and stored trading date inside the tool.':'Manual/historical strategy analysis · the existing engine displays its market-data availability and pricing assumptions.'):'This company is outside the supported historical stock-options universe. The manual option calculator remains available.';
   $('[data-fo-frame]').hidden=!ok;
  }else $('[data-fo-frame]').removeAttribute('src');
 }
 const fields={
  base:['Base EPS / share',0,1e7,.01],growth:['Growth per year (%)',-90,100,.5],discount:['Required return (%)',.1,100,.1],terminal:['Terminal growth (%)',-90,99,.5],years:['Forecast years',1,20,1],multiple:['Exit P/E multiple',.1,200,.1],dividend:['Current dividend / share',0,1e7,.01],shares:['Diluted shares (crore)',.000001,1e8,.01],cash:['Cash & nonoperating assets (₹ Cr)',0,1e12,1],debt:['Debt & other claims (₹ Cr)',0,1e12,1],marginSafety:['Assumed safety buffer (%)',0,80,1]
 };
 function renderValueControls(){
  if(valueLab){valueLab.renderControls();return;}
  const a=state.valuation;
  $('[data-model-tabs]').innerHTML=Object.entries(labels).map(([key,label])=>`<button type="button" data-value-model="${key}" aria-pressed="${a.model===key}">${label}</button>`).join('');
  let names=['base','growth','discount','years'];
  if(a.model==='earnings')names.push('multiple','dividend');else names.push('terminal');
  if(a.model==='firm')names.push('shares','cash','debt');names.push('marginSafety');
  const target=$('[data-value-controls]');
  target.innerHTML=names.map(key=>{let [label,min,max,step]=fields[key];if(key==='base'){label={earnings:'Base EPS / share (₹)',equity:'Equity cash flow / share (₹)',firm:'Base firm free cash flow (₹ Cr)',dividend:'Current dividend / share (₹)'}[a.model];max=a.model==='firm'?1e12:1e7;}if(key==='discount')label=a.model==='firm'?'Firm discount rate / WACC (%)':'Required equity return (%)';const slider=['growth','discount','years','multiple','marginSafety'].includes(key);return `<label class="rt-field">${esc(label)}<input type="number" data-value-input="${key}" value="${a[key]??''}" min="${min}" max="${max}" step="${step}" placeholder="Enter your assumption">${slider?`<input type="range" data-value-slider="${key}" min="${min}" max="${max}" step="${step}" value="${a[key]??min}" aria-label="${esc(label)} slider">`:''}</label>`;}).join('');
  $('[data-value-rates]').value=a.rates.join(', ');$('[data-value-price]').value=a.price??'';
  $('[data-value-seed]').hidden=a.model!=='earnings';if($('[data-value-source]'))$('[data-value-source]').hidden=a.model!=='earnings';
  $('[data-value-origin]').textContent=a.model==='firm'?'FCFF, cash and debt use ₹ crore; shares use crore. All inputs are your assumptions.':'Per-share inputs are your assumptions. Filed EPS can seed the earnings model when available.';
  renderValue();
 }
 function renderValue(){
  if(valueLab){valueLab.render();return;}
  const a=state.valuation,result=valuation(a),target=$('[data-value-result]');
  const formula={earnings:'EPS grows at your assumed rate. Future sale value = forecast EPS × exit multiple. Dividends grow at the same rate. Both dividends and the assumed sale value are discounted at your required equity return.',equity:'Discount free cash flow to equity per share at the required equity return. Terminal value = final-year equity cash flow × (1 + terminal growth) ÷ (required return − terminal growth). No debt is subtracted again.',firm:'Discount free cash flow to the firm (FCFF) at WACC. Equity value per share = (enterprise value + cash/nonoperating assets − debt/other non-equity claims) ÷ diluted shares. All aggregate inputs use crore units.',dividend:'Discount projected dividends per share at the required equity return, including a perpetual dividend-growth terminal value. Dividend growth is your assumption.'}[a.model];
  $('[data-value-formula]').textContent=formula+' Illustrative assumption model; tax, transaction costs and future dilution are excluded. Invalid terminal growth is refused.';
  if(result.error){target.innerHTML=`<div class="rt-value-empty"><span class="rd-eyebrow">START WITH YOUR INPUTS</span><h3>A model you can inspect.</h3><p>${esc(result.error)}</p><p>Enter the base figure in the assumptions panel. Every output updates as you explore.</p></div>`;$('[data-return-table]').replaceChildren();$('[data-value-sensitivity]').replaceChildren();$('[data-value-cashflows]').replaceChildren();}
  else{
   target.innerHTML=`<div class="rt-value-hero"><span class="rd-eyebrow">${a.model==='earnings'?'DISCOUNTED EARNINGS SCENARIO':'ASSUMED INTRINSIC VALUE'} · PER SHARE</span><strong>${esc(fmt(result.value,'INR',false))}</strong><span class="rt-value-model">${esc(labels[a.model])} · ${a.years} years · ${a.discount}% discount rate</span><div class="rt-value-detail"><div><small>With your ${a.marginSafety}% buffer</small><b>${esc(fmt(result.adjusted,'INR',false))}</b></div><div><small>Terminal contribution</small><b>${result.terminalShare?.toFixed(1)??'—'}%</b></div></div>${result.value<0?'<p class="rt-value-warning">This model implies negative equity value. Review the cash flows and equity bridge.</p>':''}</div>`;
   const rows=returnTable(a,a.rates);
   $('[data-return-table]').innerHTML=`<div class="rt-output-heading"><h3>Different returns. Different values.</h3><p>${a.model==='firm'?'Discount rates are WACC assumptions.':'Compare your required equity returns.'}</p></div><div class="rt-rate-cards">${rows.map(r=>`<button type="button" data-value-return="${r.discount}" aria-pressed="${r.discount===a.discount}"><span>${r.discount}%</span><strong>${r.error?'Unavailable':esc(fmt(r.value,'INR',false))}</strong><small>${r.error?esc(r.error):'per share'}</small></button>`).join('')}</div>`;
   const grid=sensitivity(a);const max=Math.max(...grid.cells.flat().filter(c=>!c.error).map(c=>Math.abs(c.value)),1);
   $('[data-value-sensitivity]').innerHTML=`<div class="rt-output-heading"><h3>Explore the sensitivity</h3><p>Choose a cell to apply its growth and discount assumptions.</p></div><div class="rt-table-scroll"><table class="rt-sensitivity"><caption class="rd-sr">Value per share by growth and discount rate</caption><thead><tr><th scope="col">Return ↓ / growth →</th>${grid.growths.map(g=>`<th scope="col">${g.toFixed(1)}%</th>`).join('')}</tr></thead><tbody>${grid.rates.map((rate,i)=>`<tr><th scope="row">${rate.toFixed(1)}%</th>${grid.cells[i].map((cell,j)=>`<td><button type="button" data-sensitivity-rate="${rate}" data-sensitivity-growth="${grid.growths[j]}" ${cell.error?'disabled':''} style="--rt-cell:${cell.error?0:Math.min(.35,Math.abs(cell.value)/max*.35)}" title="${esc(cell.error||`Growth ${grid.growths[j]}%; discount ${rate}%; value ₹${cell.value.toFixed(2)}`)}">${cell.error?'—':esc(fmt(cell.value,'INR',true))}</button></td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
   $('[data-value-cashflows]').innerHTML=`<details class="rt-flow-details"><summary>Inspect the calculation, year by year</summary><div class="rt-table-scroll"><table><thead><tr><th>Year</th><th>${a.model==='earnings'?'Dividends':'Cash flow'} ${a.model==='firm'?'(₹ Cr)':'/ share'}</th><th>Discounted value</th></tr></thead><tbody>${result.flows.map(f=>`<tr><th>${f.year}</th><td>${esc(fmt(f.amount,'INR',false))}</td><td>${esc(fmt(f.pv,'INR',false))}</td></tr>`).join('')}<tr><th>Terminal</th><td>${esc(fmt(result.terminalValue,'INR',false))}</td><td>${esc(fmt(result.terminalPV,'INR',false))}</td></tr></tbody></table></div></details>`;
  }
  const reverse=impliedGrowth(a,a.price);
  $('[data-value-reverse]').innerHTML=reverse.error?`<p>${esc(reverse.error)}</p>`:`<strong>${reverse.growth.toFixed(2)}%<small>implied annual growth</small></strong><p>At ${a.discount}% discount over ${a.years} years, holding the other inputs fixed. This is a solved assumption, not a forecast.</p>`;
  renderScenarios();
 }
 function renderScenarios(){
  if(valueLab){valueLab.renderScenarios();return;}
  $('[data-value-scenarios]').innerHTML=state.scenarios.length?`<div class="rt-output-heading"><h3>Kept scenarios</h3><p>Save the desk to keep these with your account.</p></div><div class="rt-saved-scenarios">${state.scenarios.map((s,i)=>{const v=valuation(s.inputs);return `<div><button type="button" data-scenario-restore="${i}"><strong>${esc(s.label)}</strong><span>${esc(labels[s.inputs.model])} · ${v.error?'Incomplete':esc(fmt(v.value,'INR',false))}</span></button><button type="button" data-scenario-remove="${i}" aria-label="Remove ${esc(s.label)}">×</button></div>`;}).join('')}</div>`:'';
 }
 function renderChanges(){
  const desk=getDesk(),data=getData();if(!data)return;const baseline=desk?.baseline,changes=filingChanges(baseline,data);
  const target=$('[data-changes-content]');
  if(changes.first){target.innerHTML='<div class="rt-value-empty"><h3>Your next visit starts here.</h3><p>Save this desk to capture a server-verified filing baseline. When you reopen it, this view compares the latest stored figures with that snapshot.</p></div>';}
  else{
   const changesHTML=changes.items.map(c=>{let detail;if(c.kind==='value')detail=`${data.metrics[c.metric].label}: ${fmt(c.before,data.metrics[c.metric].unit)} → ${fmt(c.after,data.metrics[c.metric].unit)}`;else if(c.kind==='new')detail='New reporting period now available in the store.';else if(c.kind==='basis')detail=`Reporting basis changed: ${c.before} → ${c.after}.`;else if(c.kind==='publication')detail=`Publication date: ${dateLabel(c.before)} → ${dateLabel(c.after)}.`;else if(c.kind==='removed')detail='This period is outside the current stored history window or no longer available.';else detail=`Stored filing refreshed: ${dateLabel(c.after)}. Figures shown above identify numeric changes.`;return `<li><span class="rt-change-kind">${esc(c.kind)}</span><div><strong>${esc(c.label)}</strong><p>${esc(detail)}</p>${c.kind==='new'?`<small>Published ${dateLabel(c.point.published_at)} · stored ${dateLabel(c.point.fetched_at)}</small>`:''}</div></li>`;}).join('');
   target.innerHTML=`<p class="rt-baseline-date">Compared with your review snapshot from ${dateLabel(baseline.reviewed_at)}. Latest desk data assembled ${dateLabel(data.assembled_at)}.</p>${changes.items.length?`<ul class="rt-change-list">${changesHTML}</ul>`:'<div class="rt-value-empty"><h3>No stored filing changes detected.</h3><p>Values, reporting bases and recorded dates match your saved baseline.</p></div>'}<p class="rt-model-note">This compares the stored annual filing window. It does not monitor market prices, future announcements or personal assumptions.</p>`;
  }
  $('[data-review-changes]').disabled=!api.authenticated();
 }
 function renderThesis(){
  const pins=getPins();const target=$('[data-thesis-entries]');
  target.innerHTML=state.thesis.length?state.thesis.map((t,i)=>`<article class="rt-thesis-entry"><div class="rt-thesis-heading"><span>RESEARCH QUESTION ${i+1}</span><button type="button" class="rd-icon-button" data-thesis-remove="${i}" aria-label="Remove research question ${i+1}">×</button></div><div class="rt-thesis-grid">${[['claim','My claim or question'],['support','Evidence supporting it'],['counter','Counter-evidence / what is unknown'],['invalidate','What would change my mind?']].map(([key,label])=>`<label class="rt-field">${label}<textarea rows="3" maxlength="500" data-thesis-index="${i}" data-thesis-field="${key}">${esc(t[key])}</textarea></label>`).join('')}</div><fieldset class="rt-evidence-picks"><legend>Link pinned filing evidence</legend>${pins.length?pins.map(p=>`<label><input type="checkbox" data-thesis-index="${i}" data-thesis-pin="${esc(p.id)}" ${t.evidence.includes(p.id)?'checked':''}>${esc(p.period)} · ${esc(p.metrics.map(k=>getData()?.metrics[k]?.label||k).join(', '))}</label>`).join(''):'<p>Inspect a Research chart period and pin an observation to link evidence here.</p>'}</fieldset></article>`).join(''):'<div class="rt-value-empty"><h3>Give your research a question.</h3><p>Add a claim, collect evidence and keep a counterargument beside it.</p></div>';
  $('[data-thesis-add]').disabled=state.thesis.length>=4;
 }
 function onView(view){state.view=view;renderLayout();renderEngines();if(view==='valuation')renderValue();if(view==='changes')renderChanges();if(view==='thesis')renderThesis();if(view==='lab'&&api.labURL){const path=$('[data-lab-panel]')?.dataset.slSchema==='2'?'/assets/strategy-lab-experience.js?v=baskets2':'/assets/strategy-lab.js?v=lab1';import(path).then(module=>{lab??=module.createStrategyLab(api);if(state.view==='lab')return lab?.activate();}).catch(e=>toast(e.message));}else lab?.pause();}
 function onData(){renderEngines();renderChanges();renderThesis();if(state.view==='valuation')renderValue();}
 document.addEventListener('input',event=>{
  const input=event.target;
  if(valueLab&&(input.closest('[data-valuation-panel]')||input.closest('[data-value-dialog]')))return;
  if(input.matches('[data-value-input],[data-value-slider]')){
   const key=input.dataset.valueInput||input.dataset.valueSlider;state.valuation[key]=input.value===''?null:Number(input.value);
   if(key==='base')$('[data-value-origin]').textContent='Base figure edited by you. All model inputs are your assumptions.';
   const partner=$(`[data-${input.dataset.valueInput?'value-slider':'value-input'}="${key}"]`);if(partner)partner.value=input.value;
   changed();cancelAnimationFrame(renderFrame);renderFrame=requestAnimationFrame(renderValue);
  }
  if(input.matches('[data-value-price]')){state.valuation.price=input.value===''?null:Number(input.value);changed();renderValue();}
  if(input.matches('[data-value-rates]')){
   const values=input.value.split(',').map(v=>v.trim()).filter(Boolean).map(Number);
   ratesValid=values.length>=1&&values.length<=6&&new Set(values).size===values.length&&values.every(v=>Number.isFinite(v)&&v>=.1&&v<=100);
   $('[data-value-rates-error]').textContent=ratesValid?'':'Use one to six distinct rates from 0.1% to 100%.';
   if(ratesValid){state.valuation.rates=values;changed();renderValue();}
  }
  if(input.matches('[data-thesis-field]')){state.thesis[Number(input.dataset.thesisIndex)][input.dataset.thesisField]=input.value;changed();}
 });
 document.addEventListener('change',event=>{
  const input=event.target;
  if(input.matches('[data-thesis-pin]')){const t=state.thesis[Number(input.dataset.thesisIndex)];t.evidence=input.checked?[...new Set([...t.evidence,input.dataset.thesisPin])]:t.evidence.filter(id=>id!==input.dataset.thesisPin);changed();}
  if(input.matches('[data-workspace-preset]')){state.preset=input.value;state.split=false;state.inspector=input.value==='investing';changed();setView({investing:'explore',charts:'charts',options:'derivatives'}[input.value]);renderLayout();}
 });
 document.addEventListener('click',async event=>{
  const button=event.target.closest('button');if(!button)return;
  if(valueLab&&(button.closest('[data-valuation-panel]')||button.closest('[data-value-dialog]')))return;
  if(button.hasAttribute('data-inspector-toggle')){if(valueLab&&state.view==='valuation'){valueEvidenceOpen=!valueEvidenceOpen;renderLayout();if(valueEvidenceOpen)$('[data-value-evidence-close]').focus();}else{state.inspector=!state.inspector;changed();renderLayout();}}
  if(button.hasAttribute('data-value-evidence-close')){valueEvidenceOpen=false;renderLayout();$('[data-inspector-toggle]').focus();}
  if(button.hasAttribute('data-split-toggle')){state.split=!state.split;changed();renderLayout();}
  if(button.hasAttribute('data-terminal-fullscreen')){focus=!focus;document.body.classList.toggle('rt-focus',focus);button.setAttribute('aria-pressed',String(focus));button.textContent=focus?'Exit focus':'Focus';}
  if(button.dataset.valueModel){state.valuation.model=button.dataset.valueModel;state.valuation.base=null;state.valuation.price=null;changed();renderValueControls();}
  if(button.hasAttribute('data-value-source'))showSources?.(['diluted_eps']);
  if(button.hasAttribute('data-value-seed')){const point=getPoint(),eps=point?.values.diluted_eps;if(!Number.isFinite(eps)||eps<=0)return toast('A positive diluted EPS is not available in this selected filing. Enter your own assumption.');state.valuation.base=eps;changed();renderValueControls();$('[data-value-origin]').textContent=`Seeded from filed EPS: ${point.label} · ${point.basis} · published ${dateLabel(point.published_at)}. Source: diluted EPS in the selected annual filing. You can edit this assumption.`;}
  if(button.dataset.valueReturn){state.valuation.discount=Number(button.dataset.valueReturn);changed();renderValueControls();}
  if(button.hasAttribute('data-sensitivity-rate')){state.valuation.discount=Number(button.dataset.sensitivityRate);state.valuation.growth=Number(button.dataset.sensitivityGrowth);changed();renderValueControls();}
  if(button.hasAttribute('data-value-save')){
   if(valuation(state.valuation).error)return toast('Complete a valid model before keeping a scenario.');
   if(state.scenarios.length>=3)return toast('Keep up to three scenarios. Remove one to add another.');
   const label=$('[data-scenario-name]');if(label){const name=label.value.trim();if(!name)return label.focus();state.scenarios.push({label:name.slice(0,40),inputs:structuredClone(state.valuation)});label.closest('.rt-scenario-name').remove();changed();renderScenarios();toast('Scenario kept. Save the desk to persist it.');}
   else{const wrap=document.createElement('div');wrap.className='rt-scenario-name';wrap.innerHTML='<label class="rt-field">Scenario name<input data-scenario-name maxlength="40" placeholder="e.g. Slower growth"></label><small>Enter a name, then choose Keep scenario again.</small>';$('[data-value-scenarios]').before(wrap);wrap.querySelector('input').focus();}
  }
  if(button.hasAttribute('data-scenario-restore')){state.valuation=structuredClone(state.scenarios[Number(button.dataset.scenarioRestore)].inputs);changed();renderValueControls();}
  if(button.hasAttribute('data-scenario-remove')){state.scenarios.splice(Number(button.dataset.scenarioRemove),1);changed();renderScenarios();}
  if(button.dataset.foMode){foMode=button.dataset.foMode;renderEngines();}
  if(button.hasAttribute('data-thesis-add')){if(state.thesis.length>=4)return;state.thesis.push({claim:'',support:'',counter:'',invalidate:'',evidence:[]});changed();renderThesis();}
  if(button.hasAttribute('data-thesis-remove')){state.thesis.splice(Number(button.dataset.thesisRemove),1);changed();renderThesis();}
  if(button.hasAttribute('data-refresh-research')){button.disabled=true;try{await api.refresh();onData();toast('Latest stored company filings checked.');}catch(e){toast(e.message);}finally{button.disabled=false;}}
  if(button.hasAttribute('data-review-changes')){review=true;changed();if(!await api.save())review=false;else{review=false;renderChanges();}}
 });
 const resize=$('[data-inspector-resize]');let drag=null;
 resize.addEventListener('pointerdown',e=>{if(e.button!==0)return;drag={x:e.clientX,width:state.inspectorWidth};resize.setPointerCapture(e.pointerId);});
 resize.addEventListener('pointermove',e=>{if(!drag)return;state.inspectorWidth=Math.round(Math.min(480,Math.max(240,drag.width+drag.x-e.clientX)));renderLayout();});
 const endDrag=()=>{if(drag){drag=null;changed();}};resize.addEventListener('pointerup',endDrag);resize.addEventListener('pointercancel',endDrag);
 resize.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();state.inspectorWidth=e.key==='Home'?240:e.key==='End'?480:Math.min(480,Math.max(240,state.inspectorWidth+(e.key==='ArrowLeft'?20:-20)));changed();renderLayout();}});
 window.addEventListener('message',event=>{
  if(event.origin!==location.origin||event.data?.type!=='marketdeck:embed-ready')return;
  const frames=[$('[data-chart-frame]'),$('[data-fo-frame]'),$('[data-split-frame]')];const frame=frames.find(f=>f.contentWindow===event.source);if(!frame)return;
  const symbol=String(event.data.symbol||'').slice(0,30),company=getData()?.company.ticker;
  if(symbol&&symbol!==company&&symbol!==company?.replace(/\.NS$/,'')){
   const status=frame===$('[data-fo-frame]')?$('[data-fo-status]'):$('[data-chart-status]');status.textContent=`This tool is displaying ${symbol}. Select the matching company above to reconnect your research context.`;
  }
 });
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&valueEvidenceOpen&&!document.querySelector('dialog[open]')){valueEvidenceOpen=false;renderLayout();$('[data-inspector-toggle]').focus();}if(e.key==='Escape'&&focus){focus=false;document.body.classList.remove('rt-focus');$('[data-terminal-fullscreen]').textContent='Focus';$('[data-terminal-fullscreen]').setAttribute('aria-pressed','false');}});
 return {reset,restore,exportState,onView,onData,renderValueControls,renderChanges,labDirty:()=>lab?.isDirty()??false,saveLabDraft:()=>lab?.saveDraft()??true,showInspector:()=>{if(valueLab&&state.view==='valuation'){valueEvidenceOpen=true;renderLayout();}else if(!state.inspector){state.inspector=true;changed();renderLayout();}},reviewRequested:()=>review,ratesValid:()=>valueLab?valueLab.ratesValid():ratesValid};
}
