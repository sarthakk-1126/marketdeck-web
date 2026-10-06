// One native-scroll controller for intro, pointer response, hero and product handoff.
const clamp = x => Math.max(0,Math.min(1,x));
const smooth = x => {x=clamp(x);return x*x*(3-2*x);};
export function startExperience() {
  const hero=document.querySelector('.hero'), scene=document.querySelector('.earth-scene');
  const button=document.querySelector('.motion-toggle');
  const charge=document.querySelector('.market-block-charge');
  if(charge&&matchMedia('(pointer:coarse)').matches)charge.querySelector('.market-charge-hint').textContent='Tap to reveal · Pull sideways to charge';
  const meter=charge?.querySelector('[role="progressbar"]'),segments=charge?[...charge.querySelectorAll('.market-charge-segment')]:[];
  function updateCharge({count,total=5,revealing=false}){
    if(!charge)return;
    charge.dataset.charge=String(count);
    meter.setAttribute('aria-valuenow',String(count));
    meter.setAttribute('aria-valuetext',revealing?'Quote revealed':`${count} of ${total}. ${total-count} more interactions to reveal a quote.`);
    charge.querySelector('.market-charge-count').textContent=String(count);
    segments.forEach((segment,i)=>segment.classList.toggle('is-filled',i<count));
    charge.querySelector('[role="status"]').textContent=revealing?'Quote revealed':count?`${count} of ${total} charged.`:'';
  }
  const reduce=matchMedia('(prefers-reduced-motion: reduce)'),desktop=matchMedia('(min-width: 1000px) and (min-height: 650px)');
  const canvas=document.createElement('canvas');canvas.className='earth-canvas';canvas.setAttribute('aria-hidden','true');scene.append(canvas);
  let paused=false,seen=false;
  try{seen=sessionStorage.getItem('marketdeck:intro-seen')==='true';}catch{}
  let globe,raf=0,visible=true,dead=false,dirty=true,start=0,interrupted=scrollY>12||!!location.hash;
  let revealDialog=null,revealActive=false,revealFocus=null,revealOrigin=null;
  function reveal(event,state){
    if(event==='start'){
      const rect=scene.getBoundingClientRect();
      if(off()||rect.bottom<0||rect.top>innerHeight)return null;
      cancelGesture(true);
      revealFocus=document.activeElement;revealActive=true;
      revealDialog=document.createElement('dialog');revealDialog.className='market-block-reveal';
      revealDialog.setAttribute('aria-label','A moment of market perspective');
      revealDialog.innerHTML='<div class="market-reveal-light" aria-hidden="true"></div><div class="market-reveal-wave" aria-hidden="true"></div><figure class="market-reveal-quote"><span class="market-reveal-rule" aria-hidden="true"></span><blockquote></blockquote><figcaption><span class="market-reveal-author"></span><a target="_blank" rel="noopener noreferrer"></a></figcaption></figure><button type="button" class="market-reveal-close" aria-label="Return to MarketDeck"><span aria-hidden="true">×</span></button>';
      revealDialog.dataset.quoteId=state.id;
      revealDialog.dataset.quoteLength=state.text.length>90?'long':'short';
      revealDialog.querySelector('blockquote').textContent=`“${state.text}”`;
      revealDialog.querySelector('.market-reveal-author').textContent=state.author;
      const source=revealDialog.querySelector('figcaption a');source.href=state.sourceUrl;source.textContent=state.sourceLabel;
      revealDialog.style.setProperty('--wave-x',`${rect.left+rect.width*.5}px`);
      revealDialog.style.setProperty('--wave-y',`${rect.top+rect.height*.65}px`);
      revealDialog.querySelector('button').addEventListener('click',()=>globe?.returnReveal());
      revealDialog.querySelector('button').autofocus=true;
      revealDialog.addEventListener('cancel',e=>{e.preventDefault();globe?.returnReveal();request();});
      document.body.append(revealDialog);
      requestAnimationFrame(()=>{
        if(!revealActive)return;
        revealDialog.querySelector('.market-reveal-light').after(canvas);revealDialog.showModal();measure();request();
      });
      revealOrigin=rect.toJSON();return revealOrigin;
    }
    if(event==='frame'&&revealDialog){
      revealDialog.style.setProperty('--reveal',state.amount.toFixed(4));
      revealDialog.style.setProperty('--quote',state.quote.toFixed(4));
      revealDialog.style.setProperty('--burst',state.burst.toFixed(4));
      revealDialog.style.setProperty('--launch',state.launch.toFixed(4));
      revealDialog.dataset.phase=state.phase;
      revealDialog.dataset.age=state.age.toFixed(3);
    }
    if(event==='end'){
      revealActive=false;scene.append(canvas);
      revealDialog?.close();revealDialog?.remove();revealDialog=null;revealOrigin=null;
      if(revealFocus?.isConnected)revealFocus.focus({preventScroll:true});
      dirty=true;measure();request();
    }
    return null;
  }
  let targetX=0,targetY=0,x=0,y=0,last=0,progress=0,bounds={top:0,height:1,width:1};
  const started=performance.now();
  // The OS accessibility preference is authoritative, even after a visitor has
  // explicitly enabled ambient motion in this session.
  const off=()=>reduce.matches||paused===true;
  const story=document.querySelector('.market-story'),gallery=document.querySelector('.story-gallery');
  const cards=[...gallery.querySelectorAll('.product-tab')];
  const heading=gallery.querySelector('.section-heading'),copy=hero.querySelector('.hero-content');
  let storyTop=0,travel=1,positions=[],storyEnabled=false,galleryWidth=1;
  function configureStory(){
    const previousHeight=story.offsetHeight,top=story.getBoundingClientRect().top+scrollY,previousScroll=scrollY;
    storyEnabled=desktop.matches&&!off();
    story.classList.toggle('story-enabled',storyEnabled);
    if(!storyEnabled){cards.forEach(c=>{c.style.transform='';c.style.opacity='';});gallery.inert=false;gallery.style.opacity='';heading.style.opacity='';copy.style.transform='';copy.style.opacity='';scene.style.opacity='';if(charge)charge.style.opacity='';hero.querySelector('.hero-bottom').style.opacity='';
      if(previousScroll>top+previousHeight-innerHeight)window.scrollBy({top:story.offsetHeight-previousHeight,behavior:'instant'});
      else if(progress>.2)gallery.scrollIntoView({behavior:'instant',block:'start'});
    }
    dirty=true;request();
  }
  function measure(){
    if(revealActive&&revealOrigin)Object.assign(revealOrigin,scene.getBoundingClientRect().toJSON());
    bounds={top:hero.getBoundingClientRect().top+scrollY,height:hero.offsetHeight,width:hero.offsetWidth};globe?.resize(revealActive?innerWidth:scene.clientWidth,revealActive?innerHeight:scene.clientHeight);
    storyTop=story.getBoundingClientRect().top+scrollY;travel=Math.max(1,story.offsetHeight-innerHeight);
    positions=cards.map(c=>({x:c.offsetLeft,y:c.offsetTop,w:c.offsetWidth,h:c.offsetHeight}));galleryWidth=gallery.clientWidth;dirty=false;
  }
  function paintStory(){
    progress=storyEnabled?clamp((scrollY-storyTop)/travel):0;
    story.dataset.progress=progress.toFixed(3);
    if(!storyEnabled)return;
    copy.style.transform=`translateY(${-progress*innerHeight*2}px)`;
    copy.style.opacity=String(1-smooth(progress/.23));
    hero.querySelector('.hero-bottom').style.opacity=String(1-smooth(progress/.18));
    scene.style.opacity=String(1-smooth((progress-.55)/.43)*.96);
    if(charge)charge.style.opacity=String(1-smooth(progress/.22));
    heading.style.opacity=String(smooth((progress-.58)/.25));
    gallery.inert=progress<.70;
    const dock=smooth((progress-.55)/.45);
    const emerge=smooth((progress-.19)/.36);
    const offsets=[[-.22,-.06,12], [.03,-.12,-8], [.22,.00,8],[-.13,.17,-10],[.14,.22,10]];
    cards.forEach((card,i)=>{
      const p=positions[i],o=offsets[i],appear=smooth((progress-.2-i*.035)/.2);
      const tx=(galleryWidth/2-p.x-p.w/2+o[0]*galleryWidth)*(1-dock);
      const ty=(150-p.y+o[1]*innerHeight)*(1-dock)+(1-emerge)*100;
      card.style.transform=progress>=.999?'none':`translate3d(${tx}px,${ty}px,0) perspective(1100px) rotateY(${o[2]*(1-dock)}deg) rotateX(${7*(1-dock)}deg) scale(${(.60+i*.025)+(1-(.60+i*.025))*dock})`;
      card.style.opacity=String(appear);
    });
  }
  function frame(time){
    raf=0;if(dead||document.hidden||!visible&&!revealActive)return;
    if(!dirty&&time-last<15){request();return;}
    if(dirty)measure();
    paintStory();
    const dt=Math.min(50,time-last||16);last=time;
    const damp=1-Math.exp(-dt/160);x+=(targetX-x)*damp;y+=(targetY-y)*damp;
    const intro=off()||seen||interrupted||!start?1:clamp((time-start)/2400);
    hero.dataset.entrance=intro<1?'playing':'settled';
    if(globe)globe.render({progress,entrance:intro,time,x:off()?0:x,y:off()?0:y,moving:!off()});
    if(!off()&&globe)request();
  }
  function request(){if(!raf&&!dead&&!document.hidden&&(visible||revealActive))raf=requestAnimationFrame(frame);}
  function interrupt(){interrupted=true;hero.dataset.interrupted='true';request();}
  function apply(){
    cancelGesture(true);
    if(off())globe?.returnReveal(true);
    if(charge)charge.hidden=off()||!globe;
    scene.tabIndex=off()?-1:0;
    document.body.classList.toggle('motion-paused',off());document.body.classList.toggle('motion-enabled',!off());
    button.hidden=false;button.setAttribute('aria-pressed',String(off()));button.setAttribute('aria-label',off()?'Enable motion':'Disable motion');
    button.querySelector('span').textContent=off()?'Resume motion':'Pause motion';
    hero.dispatchEvent(new CustomEvent('motionchange',{detail:{off:off()}}));interrupt();request();
    configureStory();
  }
  button.addEventListener('click',()=>{paused=!off();apply();});
  reduce.addEventListener('change',apply);
  desktop.addEventListener('change',configureStory);
  hero.addEventListener('pointermove',e=>{if(off()||e.pointerType==='touch')return;targetX=e.clientX/bounds.width-.5;targetY=(e.clientY-(bounds.top-scrollY))/bounds.height-.5;request();},{passive:true});
  hero.addEventListener('pointerleave',()=>{targetX=targetY=0;request();});
  // Resolve input from the hero so the decorative canvas never covers links.
  // CSS allows native vertical panning and pinch zoom; horizontal touch pulls
  // capture the pointer only after the visitor deliberately starts dragging.
  const scenePoint=e=>{
    const rect=scene.getBoundingClientRect();
    return {x:(e.clientX-rect.left)/rect.width*2-1,y:1-(e.clientY-rect.top)/rect.height*2};
  };
  const artPoint=e=>{
    if(e.target.closest('a,button,input,select,textarea')||off()||revealActive)return null;
    const point=scenePoint(e);
    return Math.abs(point.x)<=1&&Math.abs(point.y)<=1?point:null;
  };
  let gesture=null;
  function cancelGesture(immediate=false){
    const previous=gesture;gesture=null;
    if(previous||immediate)globe?.cancelPull(immediate);
    hero.classList.remove('is-pulling');
    if(previous&&hero.hasPointerCapture(previous.id))hero.releasePointerCapture(previous.id);
    request();
  }
  hero.addEventListener('pointermove',e=>{
    if(gesture?.id===e.pointerId){
      const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y,distance=Math.hypot(dx,dy);
      gesture.distance=Math.max(gesture.distance,distance);
      if(off()||revealActive||Math.abs(scrollY-gesture.scroll)>3){cancelGesture();return;}
      if(!gesture.dragging&&distance>10){
        if(!gesture.prepared||e.pointerType==='touch'&&Math.abs(dy)>Math.abs(dx)*.85){cancelGesture();return;}
        gesture.dragging=true;hero.setPointerCapture(e.pointerId);hero.classList.add('is-pulling');
      }
      if(gesture.dragging){globe?.movePull(scenePoint(e));request();return;}
    }
    if(e.pointerType==='touch'||off())return;
    globe?.setPointer(artPoint(e));request();
  },{passive:true});
  hero.addEventListener('pointerleave',()=>globe?.setPointer(null));
  hero.addEventListener('pointerdown',e=>{
    if(!e.isPrimary){cancelGesture();return;}
    const point=artPoint(e);
    if(e.button!==0||!point)return;
    if(gesture)cancelGesture();
    gesture={id:e.pointerId,x:e.clientX,y:e.clientY,scroll:scrollY,at:performance.now(),distance:0,dragging:false,prepared:!!globe?.beginPull(point)};
  },{passive:true});
  window.addEventListener('pointerup',e=>{
    if(!gesture||gesture.id!==e.pointerId)return;
    const finished=gesture;gesture=null;hero.classList.remove('is-pulling');
    if(hero.hasPointerCapture(e.pointerId))hero.releasePointerCapture(e.pointerId);
    const distance=Math.hypot(e.clientX-finished.x,e.clientY-finished.y),scrolled=Math.abs(scrollY-finished.scroll)>3;
    if(finished.dragging){globe?.endPull(!scrolled&&!off()&&finished.distance>=24);request();return;}
    globe?.endPull(false);
    if(distance>10||scrolled||performance.now()-finished.at>600)return;
    const point=artPoint(e);if(point){globe?.tap(point);request();}
  },{passive:true});
  window.addEventListener('pointercancel',e=>{if(gesture?.id===e.pointerId)cancelGesture();},{passive:true});
  hero.addEventListener('lostpointercapture',e=>{if(gesture?.id===e.pointerId)cancelGesture();},{passive:true});
  hero.addEventListener('dragstart',e=>{if(gesture)e.preventDefault();});
  scene.addEventListener('keydown',e=>{
    if(off()||!['Enter',' '].includes(e.key)||e.repeat)return;
    e.preventDefault();globe?.press();request();
  });
  window.addEventListener('scroll',()=>{if(gesture)cancelGesture();if(scrollY>12)interrupt();if(revealActive)globe?.returnReveal();request();},{passive:true});
  document.addEventListener('pointerdown',interrupt,{passive:true});
  document.addEventListener('keydown',interrupt);
  window.addEventListener('resize',()=>{cancelGesture();dirty=true;request();},{passive:true});
  window.addEventListener('blur',()=>cancelGesture());
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelGesture();cancelAnimationFrame(raf);raf=0;}else{last=0;request();}});
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible||revealActive)request();else{cancelAnimationFrame(raf);raf=0;}},{rootMargin:'100px'}).observe(hero);
  function fail(reason){cancelGesture(true);if(revealActive)globe?.returnReveal(true);if(charge)charge.hidden=true;hero.dataset.renderer=reason;scene.classList.remove('globe-ready');scene.tabIndex=-1;scene.setAttribute('aria-hidden','true');globe?.dispose();globe=null;canvas.remove();cancelAnimationFrame(raf);raf=0;}
  // Essentials are painted first. A static sculpture serves data-saving connections.
  hero.dataset.renderer='poster';
  document.body.classList.toggle('motion-paused',off());document.body.classList.toggle('motion-enabled',!off());button.hidden=false;
  button.setAttribute('aria-pressed',String(off()));button.setAttribute('aria-label',off()?'Enable motion':'Disable motion');button.querySelector('span').textContent=off()?'Resume motion':'Pause motion';
  configureStory();
  const bypass=()=>{if(storyEnabled){window.scrollTo({top:storyTop+travel,behavior:'instant'});progress=1;paintStory();request();}};
  document.querySelectorAll('a[href="#products"]').forEach(a=>a.addEventListener('click',e=>{if(storyEnabled){e.preventDefault();interrupt();history.pushState(null,'','#products');bypass();gallery.tabIndex=-1;gallery.focus({preventScroll:true});}}));
  gallery.addEventListener('focusin',()=>{if(storyEnabled)bypass();});
  if(location.hash==='#products')requestAnimationFrame(bypass);
  window.addEventListener('hashchange',()=>{if(location.hash==='#products')bypass();});
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    if(navigator.connection?.saveData){canvas.remove();return;}
    // Skip the 3D download on browsers without WebGL2; keep the sculpture poster.
    try{if(!canvas.getContext('webgl2',{alpha:true,antialias:true,powerPreference:'low-power'})){canvas.remove();return;}}
    catch{canvas.remove();return;}
    hero.dataset.renderer='loading';
    let abandoned=false;
    const timeout=setTimeout(()=>{abandoned=true;fail('timeout');},12000);
    import('/assets/market-block.js?v=elastic-pull-20261006').then(m=>m.createMarketBlock(canvas,fail,reveal,updateCharge)).then(instance=>{
      clearTimeout(timeout);if(dead||abandoned){instance.dispose();return;}globe=instance;measure();
      if(performance.now()-started>1800)interrupted=true;
      start=performance.now();hero.dataset.intro=seen?'return':interrupted?'skipped':'fresh';
      try{sessionStorage.setItem('marketdeck:intro-seen','true');}catch{}
      globe.render({entrance:seen||interrupted||off()?1:0,moving:!off()});
      hero.dataset.renderer='webgl';scene.classList.add('globe-ready');request();
      if(charge)charge.hidden=off();
      scene.removeAttribute('aria-hidden');scene.setAttribute('role','button');scene.tabIndex=off()?-1:0;scene.setAttribute('aria-label','Interactive market sculpture. Press five times to reveal an investor quote. You can also pull individual blocks.');
    }).catch(()=>{clearTimeout(timeout);fail('failed');});
  }));
  window.addEventListener('pagehide',e=>{cancelGesture();cancelAnimationFrame(raf);raf=0;if(!e.persisted){dead=true;globe?.dispose();}});
  window.addEventListener('pageshow',()=>{dirty=true;request();});
  return {setProgress(p){progress=p;request();},request,off,desktop};
}
