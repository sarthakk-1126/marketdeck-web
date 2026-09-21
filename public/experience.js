// One native-scroll controller for intro, pointer response, globe and product handoff.
const clamp = x => Math.max(0,Math.min(1,x));
const smooth = x => {x=clamp(x);return x*x*(3-2*x);};
export function startExperience() {
  const hero=document.querySelector('.hero'), scene=document.querySelector('.earth-scene');
  const button=document.querySelector('.motion-toggle');
  document.body.append(button);
  const reduce=matchMedia('(prefers-reduced-motion: reduce)'),desktop=matchMedia('(min-width: 1000px) and (min-height: 650px)');
  const canvas=document.createElement('canvas');canvas.className='earth-canvas';canvas.setAttribute('aria-hidden','true');scene.append(canvas);
  let paused=null,seen=false;
  try{const preference=sessionStorage.getItem('marketdeck:motion-paused');paused=preference===null?null:preference==='true';seen=sessionStorage.getItem('marketdeck:intro-seen')==='true';}catch{}
  let globe,raf=0,visible=true,dead=false,dirty=true,start=0,interrupted=scrollY>12||!!location.hash;
  let targetX=0,targetY=0,x=0,y=0,last=0,progress=0,bounds={top:0,height:1,width:1};
  const started=performance.now();
  const off=()=>paused??reduce.matches;
  const story=document.querySelector('.market-story'),gallery=document.querySelector('.story-gallery');
  const cards=[...gallery.querySelectorAll('.product-tab')];
  const heading=gallery.querySelector('.section-heading'),copy=hero.querySelector('.hero-content');
  let storyTop=0,travel=1,positions=[],storyEnabled=false,galleryWidth=1;
  function configureStory(){
    const previousHeight=story.offsetHeight,top=story.getBoundingClientRect().top+scrollY,previousScroll=scrollY;
    storyEnabled=desktop.matches&&!off();
    story.classList.toggle('story-enabled',storyEnabled);
    if(!storyEnabled){cards.forEach(c=>{c.style.transform='';c.style.opacity='';});gallery.inert=false;gallery.style.opacity='';heading.style.opacity='';copy.style.transform='';copy.style.opacity='';scene.style.opacity='';hero.querySelector('.hero-bottom').style.opacity='';
      if(previousScroll>top+previousHeight-innerHeight)window.scrollBy({top:story.offsetHeight-previousHeight,behavior:'instant'});
      else if(progress>.2)gallery.scrollIntoView({behavior:'instant',block:'start'});
    }
    dirty=true;request();
  }
  function measure(){
    bounds={top:hero.getBoundingClientRect().top+scrollY,height:hero.offsetHeight,width:hero.offsetWidth};globe?.resize(bounds.width,bounds.height);
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
    heading.style.opacity=String(smooth((progress-.58)/.25));
    gallery.inert=progress<.92;
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
    raf=0;if(dead||document.hidden||!visible)return;
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
  function request(){if(!raf&&!dead&&!document.hidden&&visible)raf=requestAnimationFrame(frame);}
  function interrupt(){interrupted=true;hero.dataset.interrupted='true';request();}
  function apply(){
    document.body.classList.toggle('motion-paused',off());document.body.classList.toggle('motion-enabled',!off());
    button.hidden=false;button.setAttribute('aria-pressed',String(off()));button.setAttribute('aria-label',off()?'Enable motion':'Disable motion');
    button.querySelector('span').textContent=off()?'Motion off':'Motion on';
    hero.dispatchEvent(new CustomEvent('motionchange',{detail:{off:off()}}));interrupt();request();
    configureStory();
  }
  button.addEventListener('click',()=>{paused=!off();try{sessionStorage.setItem('marketdeck:motion-paused',String(paused));}catch{}apply();});
  reduce.addEventListener('change',apply);
  desktop.addEventListener('change',configureStory);
  hero.addEventListener('pointermove',e=>{if(off()||e.pointerType==='touch')return;targetX=e.clientX/bounds.width-.5;targetY=(e.clientY-(bounds.top-scrollY))/bounds.height-.5;request();},{passive:true});
  hero.addEventListener('pointerleave',()=>{targetX=targetY=0;request();});
  window.addEventListener('scroll',()=>{if(scrollY>12)interrupt();request();},{passive:true});
  document.addEventListener('pointerdown',interrupt,{passive:true});
  document.addEventListener('keydown',interrupt);
  window.addEventListener('resize',()=>{dirty=true;request();},{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else{last=0;request();}});
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)request();else{cancelAnimationFrame(raf);raf=0;}},{rootMargin:'100px'}).observe(hero);
  function fail(reason){hero.dataset.renderer=reason;scene.classList.remove('globe-ready');globe?.dispose();globe=null;canvas.remove();cancelAnimationFrame(raf);raf=0;}
  // Essentials are painted first. No WebGL module on small screens or data-saving connections.
  hero.dataset.renderer='poster';
  document.body.classList.toggle('motion-paused',off());document.body.classList.toggle('motion-enabled',!off());button.hidden=false;
  button.setAttribute('aria-pressed',String(off()));button.setAttribute('aria-label',off()?'Enable motion':'Disable motion');button.querySelector('span').textContent=off()?'Motion off':'Motion on';
  configureStory();
  const bypass=()=>{if(storyEnabled){window.scrollTo({top:storyTop+travel,behavior:'instant'});progress=1;paintStory();request();}};
  document.querySelectorAll('a[href="#products"]').forEach(a=>a.addEventListener('click',e=>{if(storyEnabled){e.preventDefault();interrupt();history.pushState(null,'','#products');bypass();gallery.tabIndex=-1;gallery.focus({preventScroll:true});}}));
  gallery.addEventListener('focusin',()=>{if(storyEnabled)bypass();});
  if(location.hash==='#products')requestAnimationFrame(bypass);
  window.addEventListener('hashchange',()=>{if(location.hash==='#products')bypass();});
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    if(innerWidth<800||navigator.connection?.saveData){canvas.remove();return;}
    hero.dataset.renderer='loading';
    let abandoned=false;
    const timeout=setTimeout(()=>{abandoned=true;fail('timeout');},12000);
    import('/assets/globe.js').then(m=>m.createGlobe(canvas,fail)).then(instance=>{
      clearTimeout(timeout);if(dead||abandoned){instance.dispose();return;}globe=instance;measure();
      if(performance.now()-started>1800)interrupted=true;
      start=performance.now();hero.dataset.intro=seen?'return':interrupted?'skipped':'fresh';
      try{sessionStorage.setItem('marketdeck:intro-seen','true');}catch{}
      globe.render({entrance:seen||interrupted||off()?1:0,moving:!off()});
      hero.dataset.renderer='webgl';scene.classList.add('globe-ready');request();
    }).catch(()=>{clearTimeout(timeout);fail('failed');});
  }));
  window.addEventListener('pagehide',e=>{cancelAnimationFrame(raf);raf=0;if(!e.persisted){dead=true;globe?.dispose();}});
  window.addEventListener('pageshow',()=>{dirty=true;request();});
  return {setProgress(p){progress=p;request();},request,off,desktop};
}
