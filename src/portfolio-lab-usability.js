import {portfolioTasks,portfolioTour,portfolioHelp,matchingHelp} from './portfolio-lab-help-content.js';

// Navigation and disclosure only. Django still supplies every financial result.
export function createPortfolioUsability(root,{esc,state,navigate,say,money,videoGuide,selectTask}) {
 const q=s=>root.querySelector(s);
 let detailed=false,tour=-1,lastLoaded=false,lastSnapshot=null,helpTopic='start',opener=null;
 root.dataset.detailed='false';
 const picker=document.createElement('section');picker.className='pl-question-picker';picker.hidden=true;
 picker.innerHTML='<span class="pl-eyebrow">PORTFOLIO QUESTIONS</span><h2 tabindex="-1">What would you like to try?</h2><p>Choose one question. Each opens with the relevant controls.</p><div class="pl-question-rows"><button type="button" data-pl-question="growth"><strong>What if I keep saving?</strong><small>Explore monthly additions and a return assumption you choose.</small><span>Guided experience →</span></button><button type="button" data-pl-question="mix"><strong>How is my money split?</strong><small>Change asset weights and hypothetical cash.</small><span>Current workspace →</span></button><button type="button" data-pl-question="shocks"><strong>What if prices changed?</strong><small>Apply an explicit one-time price change.</small><span>Current workspace →</span></button><button type="button" data-pl-question="compare"><strong>Compare my ideas</strong><small>Start with a basket and explore three local drafts.</small><span>Current workspace →</span></button></div><p class="pl-question-foot">Other Portfolio tasks keep their current controls during this first guided release.</p>';
 root.prepend(picker);
 const guidedHeader=document.createElement('section');guidedHeader.className='pl-guided-header';guidedHeader.hidden=true;
 guidedHeader.innerHTML='<span class="pl-eyebrow">YOUR SAVING QUESTION</span><h2 tabindex="-1">What could my savings look like under my assumptions?</h2><p>Choose a starting basket, then set an addition, a time horizon and your own return assumption. Nothing here places a trade or predicts a return.</p><p class="pl-guided-source" data-pl-guided-source>First choose a starting basket.</p>';
 q('.pl-head').before(guidedHeader);
 const support=document.createElement('details');support.className='pl-support';
 support.innerHTML='<summary>Video &amp; quick reference</summary>';
 q('.pl-guide-start')?.before(support);if(q('.pl-guide-start'))support.append(q('.pl-guide-start'));
 const tools=document.createElement('div');tools.className='pl-learning-tools';
 tools.innerHTML='<button type="button" data-pl-learn="tour">Walk me through</button><button type="button" data-pl-learn="help">Help &amp; glossary</button><label class="pl-detail-toggle"><input type="checkbox" data-pl-detailed> Show detailed workspace</label>';
 q('.pl-head').after(tools);
 const source=document.createElement('details');source.className='pl-source-disclosure';source.open=true;
 source.innerHTML='<summary data-pl-source-summary>Choose your starting basket</summary>';
 q('.pl-source').before(source);source.append(q('.pl-source'),q('[data-pl-reopen]'));
 const brief=document.createElement('section');brief.className='pl-task-brief';brief.setAttribute('aria-label','Current question and walkthrough');
 brief.innerHTML='<div><span class="pl-eyebrow" data-pl-task-label>YOUR QUESTION</span><h3 data-pl-task-title tabindex="-1"></h3><p data-pl-task-body></p><p class="pl-tour-status" data-pl-tour-status role="status" hidden></p></div><div class="pl-task-actions"><button type="button" data-pl-task-next></button><button type="button" data-pl-tour-focus hidden>Show the control</button><button type="button" data-pl-tour-back hidden>Back</button><button type="button" data-pl-tour-next hidden>Next</button><button type="button" data-pl-tour-exit hidden>Exit walkthrough</button></div>';
 q('.pl-tabs').after(brief);
 const startBrief=brief.cloneNode(true);startBrief.dataset.plStartBrief='';startBrief.hidden=true;source.after(startBrief);
 // Retain one visible walkthrough banner: before source when empty, before editor when loaded.
 const banner=()=>state().loaded?brief:startBrief;
 const lookup=s=>banner().querySelector(s);
 const notebook=q('.pl-notebook');const saveDetails=document.createElement('details');saveDetails.className='pl-save-details';saveDetails.dataset.plSaveDetails='';
 saveDetails.innerHTML='<summary>Save &amp; notes <span>Keep the idea you are editing</span></summary>';saveDetails.append(notebook);q('.pl-layout').after(saveDetails);saveDetails.after(support);
 const inspect=q('.pl-inspector');const inspectDetails=document.createElement('details');inspectDetails.className='pl-inspect-details';inspectDetails.dataset.plInspectDetails='';
 inspectDetails.innerHTML='<summary>Selected asset &amp; reference details</summary>';inspect.before(inspectDetails);inspectDetails.append(inspect);
 const holdings=q('[data-pl-holdings]'),mix=document.createElement('details');mix.className='pl-mix-details';mix.dataset.plMixDetails='';mix.open=true;
 mix.innerHTML='<summary>Edit asset weights &amp; individual returns</summary>';holdings.before(mix);
 mix.append(q('.pl-transfer'),q('[data-pl-transfer-help]'),holdings,q('.pl-cash'));
 const extras=document.createElement('details');extras.className='pl-extra-mix';extras.dataset.plExtraMix='';extras.innerHTML='<summary>Extra mix tools · locks, equal weights &amp; shuffle</summary>';
 const oldMixHelp=q('.pl-remix+.pl-help');mix.append(extras);extras.append(q('.pl-remix'));extras.insertAdjacentHTML('beforeend','<p class="pl-help">Locks keep weights fixed. Equal and shuffled weights preserve locks and cash. Random mixes are experiments, not recommendations.</p>');
 oldMixHelp?.remove();
 q('.pl-editor .pl-card-head').after(q('[data-pl-growth-controls]'),q('[data-pl-shock-controls]'));
 q('[data-pl-growth-controls]').prepend(q('[data-pl-all-rate]').closest('.pl-growth-inputs'));
 q('[data-pl-chart]').before(q('[data-pl-growth-readout]'));
 const growth=q('[data-pl-growth-controls]'),inflation=q('[data-pl-inflation]').closest('label');
 inflation.closest('.pl-growth-inputs').after(Object.assign(document.createElement('details'),{className:'pl-guided-inflation'}));
 const inflationDetails=q('.pl-guided-inflation');inflationDetails.innerHTML='<summary>See purchasing power (optional)</summary><p>Enter your own inflation assumption to show the amount in today’s rupees. It is not estimated for you.</p>';inflationDetails.append(inflation);
 q('[data-pl-monthly]').closest('label').firstChild.textContent='Add each month · ₹';
 growth.querySelector('[data-pl-all-rate]').closest('label').firstChild.textContent='Assume a net annual return · %';
 q('[data-pl-action="all-rate"]').textContent='Show this scenario';
 const horizon=q('[data-pl-horizon]').closest('label'),rateGroup=q('[data-pl-all-rate]').closest('.pl-growth-inputs');
 horizon.after(rateGroup);rateGroup.after(inflationDetails);
 horizon.insertAdjacentHTML('afterend','<label class="pl-guided-horizon">or enter years <input type="number" data-pl-horizon-number min="1" max="30" step="1" value="5"></label>');
 growth.insertAdjacentHTML('beforeend','<div class="pl-guided-choice"><button type="button" data-pl-zero>Use 0% to see deposits alone</button><p>An annual return is your assumption after fund expenses and distributions. You may choose a negative value. Cash earns 0%.</p></div><p class="pl-guided-prompt" data-pl-guided-prompt role="status">Choose a return to see a calculated result. No return has been selected.</p><button type="button" data-pl-change-monthly hidden>Try changing the monthly addition ↗</button>');
 const meaning=document.createElement('p');meaning.className='pl-result-meaning';meaning.dataset.plMeaning='';q('[data-pl-chart]').after(meaning);
 const dialog=document.createElement('dialog');dialog.className='pl-guide-dialog pl-help-dialog';dialog.setAttribute('aria-labelledby','pl-help-title');
 dialog.innerHTML='<div class="pl-guide-heading"><div><span class="pl-eyebrow">HELP WHEN YOU NEED IT</span><h2 id="pl-help-title">Understand the Portfolio playground</h2><p>Choose a topic or search a word. Your inputs stay as they are.</p></div><button type="button" data-pl-help-close aria-label="Close help and glossary" autofocus>×</button></div><div class="pl-help-search"><label>Find an explanation<input type="search" data-pl-help-search placeholder="Try cash, inflation, save or compare" maxlength="100"></label><label>Help topic<select data-pl-help-topic></select></label></div><p data-pl-help-count role="status"></p><article data-pl-help-article></article><footer class="pl-guide-footer"><button type="button" data-pl-help-target>Take me to this control</button><button type="button" data-pl-help-watch>Watch the 1-minute introduction</button></footer>';
 root.append(dialog);
 function clearHighlight(){for(const el of root.querySelectorAll('[data-pl-tour-highlight]'))el.removeAttribute('data-pl-tour-highlight');}
 function reveal(target,focus=false){
  const element=q(target);if(!element)return;
  if(element.closest('.pl-source-disclosure'))source.open=true;
  const parent=element.closest('details');if(parent)parent.open=true;
  if(element.matches('details'))element.open=true;
  clearHighlight();element.dataset.plTourHighlight='';
  if(focus){element.scrollIntoView({block:'center',behavior:'auto'});const control=element.querySelector('input:not([disabled]),select:not([disabled]),button:not([disabled]),summary')??element; if(!control.hasAttribute('tabindex')&&!control.matches('input,select,button,summary'))control.tabIndex=-1;control.focus({preventScroll:true});}
 }
 function renderHelp(){
  const query=q('[data-pl-help-search]').value,topics=matchingHelp(query);
  if(!topics.some(t=>t.id===helpTopic))helpTopic=topics[0]?.id??'';
  q('[data-pl-help-topic]').innerHTML=topics.map(t=>`<option value="${t.id}">${esc(t.title)}</option>`).join('');q('[data-pl-help-topic]').value=helpTopic;q('[data-pl-help-topic]').disabled=!topics.length;
  const topic=topics.find(t=>t.id===helpTopic);q('[data-pl-help-count]').textContent=topics.length?topics.length+' matching topics':'No matching explanation. Try cash, inflation, return or save.';
  const term=query.trim().toLocaleLowerCase();const sections=topic?.sections.filter(s=>!term||topic.title.toLocaleLowerCase().includes(term)||[s.title,s.body].some(v=>v.toLocaleLowerCase().includes(term)))??[];
  q('[data-pl-help-article]').innerHTML=topic?`<h3>${esc(topic.title)}</h3>${sections.map(s=>`<section><h4>${esc(s.title)}</h4><p>${esc(s.body)}</p></section>`).join('')}`:'';
  q('[data-pl-help-target]').hidden=!topic?.target;
 }
 function openHelp(button){opener=button;renderHelp();if(!dialog.open)dialog.showModal();}
 function tourStep(index){
  if(index<0||index>=portfolioTour.length)return;
  const s=state();if(index>0&&!s.loaded){say('Choose a basket first, or try fictional practice.');return;}
  if(s.pending||s.saving){lookup('[data-pl-tour-status]').hidden=false;lookup('[data-pl-tour-status]').textContent='Wait for the latest calculation or save. You can exit the walkthrough at any time.';return;}
  tour=index;if(index>0)source.open=false;const step=portfolioTour[tour];if(step.view&&step.view!==s.view)navigate(step.view);sync();reveal(step.target);banner().scrollIntoView({block:'start',behavior:'auto'});lookup('[data-pl-task-title]').focus({preventScroll:true});
 }
 function finishTour(){tour=-1;clearHighlight();sync();say('Walkthrough closed. Your research inputs and edits are kept. Help & glossary is always available.');}
 function showTasks(){if(tour>=0)finishTour();picker.hidden=false;root.dataset.taskChooser='true';root.dataset.guided='false';picker.querySelector('h2').focus({preventScroll:true});}
 function startTask(task){
  if(tour>=0)finishTour();picker.hidden=true;root.dataset.taskChooser='false';root.dataset.guided=task==='growth'?'growth':'false';root.dataset.guidedTaskSelected=String(task==='growth');lastSnapshot={};
  root.dataset.guidedRateDraft='false';guidedHeader.hidden=task!=='growth';
  selectTask(task);
  const u=new URL(location.href);if(task==='growth')u.searchParams.set('lab_task','saving');else u.searchParams.delete('lab_task');history.replaceState(null,'',u);
  (task==='growth'?guidedHeader:root.querySelector('.pl-head')).querySelector('h2').focus({preventScroll:true});sync();
 }
 function sync(){
  const s=state();if(!s.pending&&!s.saving)lookup('[data-pl-tour-status]').hidden=true;root.dataset.uiView=s.view;root.dataset.allocationTools=String(detailed||extras.open||s.locked);
  if(s.snapshot!==lastSnapshot){
   lastSnapshot=s.snapshot;root.dataset.guidedRateDraft='false';
   if(root.dataset.guided==='growth'){
    const rates=Object.values(s.projection?.rates??{}),shared=rates.length&&rates.every(v=>String(v)===String(rates[0]));
    q('[data-pl-all-rate]').value=s.rateChosen&&shared?rates[0]:'';
    if(!s.rateChosen){q('[data-pl-monthly]').value='0';q('[data-pl-horizon]').value='5';q('[data-pl-horizon-output]').textContent='5 years';q('[data-pl-inflation]').value='0';inflationDetails.open=false;}
    else inflationDetails.open=Number(s.projection.inflation_pct)>0;
   }
  }
  if(root.dataset.guided==='growth'){
   guidedHeader.hidden=false;
   root.dataset.guidedUnpriced=String(!!s.snapshot&&!s.loaded);root.dataset.guidedResult=String(s.rateChosen&&!!s.result);
   q('[data-pl-guided-source]').textContent=!s.loaded?'First choose a starting basket.':s.snapshot.practice?`Fictional practice basket · ${money(s.startingValue)} illustrative starting amount · no market data.`:`Start with ${money(s.startingValue)} · ${s.snapshot.source_name} · ${s.snapshot.basis} · captured ${s.snapshot.captured_at}. ${s.snapshot.excluded.length?s.snapshot.excluded.length+' asset(s) excluded.':''}`;
   q('[data-pl-horizon-number]').value=q('[data-pl-horizon]').value;
   const shown=s.rateChosen&&!s.pending&&!!s.result&&root.dataset.guidedRateDraft!=='true';
   q('[data-pl-guided-prompt]').textContent=s.pending?'Checking your latest inputs…':root.dataset.guidedRateDraft==='true'?'The return field changed. Show the scenario to update the result.':!s.rateChosen?'Choose a return to see a calculated result. No return has been selected.':s.result?'The result uses your chosen inputs. Money added and assumed growth are shown separately.':'The current result is unavailable. Review the status and try again.';
   q('[data-pl-change-monthly]').hidden=!shown;
   q('[data-pl-growth-readout]').hidden=!shown;
   if(root.dataset.guidedRateDraft==='true'&&!s.pending)q('[data-pl-chart]').innerHTML='<div class="pl-chart-wait">Show this scenario to update the result for your new return assumption.</div>';
  }
  if(lastLoaded!==s.loaded){source.open=!s.loaded;lastLoaded=s.loaded;if(s.loaded)brief.scrollIntoView({block:'start',behavior:'auto'});}
  q('[data-pl-source-summary]').textContent=s.loaded?'Change basket / reopen research':'Choose your starting basket';
  brief.hidden=!s.loaded;startBrief.hidden=s.loaded||tour<0;
  const task=portfolioTasks[s.view]??portfolioTasks.mix;
  // Free navigation during learning follows the selected question rather than leaving stale instructions.
  if(tour>0&&portfolioTour[tour].view&&portfolioTour[tour].view!==s.view){const match=portfolioTour.findIndex(t=>t.view===s.view);if(match>0)tour=match;}
  const active=tour>=0,step=active?portfolioTour[tour]:null;
  lookup('[data-pl-task-label]').textContent=active?'WALKTHROUGH · STEP '+(tour+1)+' OF '+portfolioTour.length:'YOUR QUESTION';
  lookup('[data-pl-task-title]').textContent=step?.title??task.title;
  lookup('[data-pl-task-body]').textContent=step?.body??task.body;
  lookup('[data-pl-task-next]').textContent=task.next;lookup('[data-pl-task-next]').hidden=active;
  for(const name of ['focus','back','next','exit'])lookup('[data-pl-tour-'+name+']').hidden=!active;
  lookup('[data-pl-tour-focus]').textContent=step?.action??'Show the control';
  lookup('[data-pl-tour-next]').textContent=tour===portfolioTour.length-1?'Finish walkthrough':'Next';
  lookup('[data-pl-tour-next]').disabled=!s.loaded||s.pending||s.saving;
  lookup('[data-pl-tour-back]').disabled=tour<=0||s.pending||s.saving;
  lookup('[data-pl-task-next]').disabled=s.pending||s.saving;
  if(active)reveal(step.target);
  q('.pl-editor .pl-card-head h3').textContent=s.view==='mix'?'Change the percentages':s.view==='shocks'?'Your price-change inputs':s.view==='compare'?'Inputs for '+s.idea:'Your growth inputs';
  if(s.view==='mix')mix.open=true;
  q('[data-pl-meaning]').textContent=s.pending?'Checking the latest inputs. Previous figures are hidden.':s.view==='mix'?'One slice represents one asset. The inner ring keeps the starting mix; the outer ring follows your edits.':s.view==='shocks'?'The bars compare the same price changes on two allocations. Cash does not move; this does not simulate trades.':s.view==='growth'?'Money added is your starting amount plus deposits. Assumed growth comes from your return inputs. Today’s rupees adjusts purchasing power for your inflation input.':'Compare the same year, and check money added before judging differences. The paths stop at each idea’s chosen horizon.';
 }
 root.addEventListener('click',event=>{
  const question=event.target.closest('[data-pl-question]');if(question){startTask(question.dataset.plQuestion);return;}
  if(event.target.closest('[data-pl-zero]')){q('[data-pl-all-rate]').value='0';q('[data-pl-action="all-rate"]').click();return;}
  if(event.target.closest('[data-pl-change-monthly]')){q('[data-pl-monthly]').focus();q('[data-pl-monthly]').select();return;}
  const learn=event.target.closest('[data-pl-learn]');if(learn){if(learn.dataset.plLearn==='help')openHelp(learn);else tourStep(0);return;}
  if(event.target.closest('[data-pl-help-close]')){dialog.close();return;}
  if(event.target.closest('[data-pl-help-watch]')){opener=null;dialog.close();videoGuide?.open('watch',q('[data-pl-learn="help"]'));return;}
  if(event.target.closest('[data-pl-help-target]')){const topic=portfolioHelp.find(t=>t.id===helpTopic);opener=null;dialog.close();if(!state().loaded){source.open=true;reveal('.pl-source',true);say('Choose a basket first, then open this question.');return;}if(topic?.view)navigate(topic.view);if(topic?.target)reveal(topic.target,true);return;}
  if(event.target.closest('[data-pl-tour-exit]')){finishTour();q('[data-pl-learn="tour"]').focus();return;}
  if(event.target.closest('[data-pl-tour-next]')){if(tour===portfolioTour.length-1)finishTour();else tourStep(tour+1);return;}
  if(event.target.closest('[data-pl-tour-back]')){tourStep(tour-1);return;}
  if(event.target.closest('[data-pl-tour-focus]')){reveal(portfolioTour[tour].target,true);return;}
  if(event.target.closest('[data-pl-task-next]')){const task=portfolioTasks[state().view];if(task.nextView==='save')reveal('[data-pl-save-details]',true);else {navigate(task.nextView);brief.scrollIntoView({block:'nearest',behavior:'auto'});}return;}
 });
 root.addEventListener('change',event=>{
  if(event.target.matches('[data-pl-horizon-number]')){const value=Number(event.target.value);if(event.target.value===''||!Number.isInteger(value)||value<1||value>30){say('Choose 1 to 30 whole years.');return;}q('[data-pl-horizon]').value=String(value);q('[data-pl-horizon]').dispatchEvent(new Event('input',{bubbles:true}));return;}
  if(event.target.matches('[data-pl-detailed]')){detailed=event.target.checked;root.dataset.detailed=String(detailed);if(root.dataset.guidedTaskSelected==='true'&&state().view==='growth'){root.dataset.guided=detailed?'false':'growth';selectTask('growth',{detailed});}mix.open=detailed||state().view==='mix';extras.open=detailed;inspectDetails.open=detailed;sync();}
  if(event.target.matches('[data-pl-help-topic]')){helpTopic=event.target.value;renderHelp();}
 });
 root.addEventListener('input',event=>{if(event.target.matches('[data-pl-help-search]'))renderHelp();if(root.dataset.guided==='growth'&&event.target.matches('[data-pl-all-rate]')){root.dataset.guidedRateDraft='true';sync();}});
 extras.addEventListener('toggle',()=>{root.dataset.allocationTools=String(detailed||extras.open||state().locked);});
 dialog.addEventListener('close',()=>{opener?.focus();});
 root.addEventListener('keydown',event=>{if(event.key==='Escape'&&tour>=0&&!dialog.open&&!event.target.closest('dialog')){finishTour();q('[data-pl-learn="tour"]').focus();}});
 sync();
 return {sync,showTasks,startTask,viewChanged(){mix.open=detailed||state().view==='mix';sync();},pause(){if(dialog.open)dialog.close();clearHighlight();}};
}
