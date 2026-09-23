/* Progressive enhancement only. Static HTML is the complete reading fallback. */
(()=>{
  'use strict';
  const $$=(root,sel)=>Array.from(root.querySelectorAll(sel));
  const reduce=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const matches=(el,topic)=>topic==='all'||el.dataset.topic.split(' ').includes(topic);
  const announce=(root,message)=>{root.querySelector('[data-intel-status]').textContent=message;};
  for(const root of $$ (document,'[data-intel-shelf]')){
    const slides=$$(root,'[data-intel-slide]'),thumbs=$$(root,'[data-intel-index]');
    if(!slides.length)continue;
    const prev=root.querySelector('[data-intel-prev]'),next=root.querySelector('[data-intel-next]');
    const filters=$$(root,'[data-intel-topic]'),count=root.querySelector('[data-intel-count]');
    let active=0,visible=slides.map((_,i)=>i),topic='all',start=null,suppressedUntil=0;
    function select(index,speak=true){
      if(!visible.includes(index))index=visible[0]??-1;
      const old=slides[active];
      const wouldHideFocus=old&&old!==slides[index]&&old.contains(document.activeElement);
      active=index;
      for(const [i,slide] of slides.entries()){
        slide.hidden=i!==index;
        thumbs[i].hidden=!visible.includes(i);
        thumbs[i].setAttribute('aria-pressed',String(i===index));
      }
      count.textContent=visible.length?`${String(visible.indexOf(index)+1).padStart(2,'0')} / ${String(visible.length).padStart(2,'0')}`:'00 / 00';
      prev.disabled=next.disabled=visible.length<2;
      root.querySelector('[data-intel-empty]').hidden=visible.length>0;
      if(wouldHideFocus)(thumbs[index]??filters[0]).focus({preventScroll:true});
      if(speak)announce(root,visible.length?`${slides[index].dataset.title}. Item ${visible.indexOf(index)+1} of ${visible.length}.`:'No published entries in this topic.');
      if(speak&&index>=0){
        const rail=thumbs[index].parentElement,rect=thumbs[index].getBoundingClientRect(),box=rail.getBoundingClientRect();
        if(rect.left<box.left||rect.right>box.right)rail.scrollTo({left:thumbs[index].offsetLeft-rail.offsetLeft-4,behavior:reduce()?'instant':'smooth'});
      }
    }
    const move=delta=>{if(visible.length>1)select(visible[(visible.indexOf(active)+delta+visible.length)%visible.length]);};
    root.querySelector('[data-intel-filters]').hidden=false;
    root.querySelector('[data-intel-navigation]').hidden=slides.length<2;
    root.querySelector('[data-intel-rail-wrap]').hidden=slides.length<2;
    root.classList.add('is-enhanced');
    root.setAttribute('aria-roledescription','carousel');
    for(const [n,s] of slides.entries()){s.setAttribute('role','group');s.setAttribute('aria-roledescription','slide');s.setAttribute('aria-label',`${n+1} of ${slides.length}`);}
    prev.addEventListener('click',()=>move(-1));next.addEventListener('click',()=>move(1));
    thumbs.forEach((button,n)=>button.addEventListener('click',()=>select(n)));
    filters.forEach(button=>button.addEventListener('click',()=>{
      topic=button.dataset.intelTopic;visible=slides.map((s,i)=>matches(s,topic)?i:-1).filter(i=>i>=0);
      filters.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
      select(visible.includes(active)?active:visible[0]);
    }));
    root.addEventListener('keydown',event=>{
      if(event.altKey||event.metaKey||event.ctrlKey||event.target.closest('input,select,textarea,[contenteditable], [data-intel-filters]'))return;
      const rail=event.target.closest('.intel-rail');
      if(!rail&&!event.target.closest('[data-intel-navigation]'))return;
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
      event.preventDefault();
      if(event.key==='Home')select(visible[0]);else if(event.key==='End')select(visible.at(-1));else move(event.key==='ArrowRight'?1:-1);
      if(rail&&active>=0)thumbs[active].focus({preventScroll:true});
    });
    const stage=root.querySelector('.intel-slides');
    stage.addEventListener('pointerdown',event=>{
      start=event.isPrimary&&event.pointerType!=='mouse'&&!event.target.closest('button,input,select,textarea')?{id:event.pointerId,x:event.clientX,y:event.clientY}:null;
    },{passive:true});
    stage.addEventListener('pointerup',event=>{
      if(!start||start.id!==event.pointerId)return;
      const dx=event.clientX-start.x,dy=event.clientY-start.y;start=null;
      if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.8){suppressedUntil=performance.now()+400;move(dx<0?1:-1);}
    },{passive:true});
    stage.addEventListener('pointercancel',()=>{start=null;},{passive:true});
    stage.addEventListener('click',event=>{if(performance.now()<suppressedUntil){event.preventDefault();event.stopPropagation();}},true);
    select(0,false);
  }
  for(const root of $$(document,'[data-intel-library]')){
    const entries=$$(root,'[data-intel-entry]'),search=root.querySelector('[data-intel-search]');
    const topicButtons=$$(root,'[data-intel-topic]'),kindButtons=$$(root,'[data-intel-kind]');
    const more=root.querySelector('[data-intel-more]');
    let topic='all',kind='all',limit=12,timer;
    const normalize=value=>value.normalize('NFKC').toLocaleLowerCase().trim();
    const haystacks=entries.map(el=>normalize(el.dataset.search));
    function apply(speak=true){
      const query=normalize(search.value);
      let total=0;
      for(const [index,entry] of entries.entries()){
        const found=matches(entry,topic)&&(kind==='all'||entry.dataset.kind===kind)&&haystacks[index].includes(query);
        if(found)total++;
        entry.hidden=!found||total>limit;
      }
      root.querySelector('[data-intel-results]').textContent=`${total} ${total===1?'entry':'entries'}${total>limit?` · showing ${limit}`:''}`;
      root.querySelector('[data-intel-empty]').hidden=total>0;
      const hidingFocusedMore=total<=limit&&document.activeElement===more;
      if(hidingFocusedMore){const shown=entries.filter(e=>!e.hidden);shown[Math.min(limit-12,shown.length-1)]?.querySelector('h3 a')?.focus({preventScroll:true});}
      more.hidden=total<=limit;
      if(speak)announce(root,`${total} matching ${total===1?'entry':'entries'}. Showing ${Math.min(total,limit)}.`);
    }
    root.querySelector('[data-intel-library-tools]').hidden=false;
    root.querySelector('[data-intel-filters]').hidden=false;
    root.querySelector('[data-intel-kind-filters]')?.removeAttribute('hidden');
    topicButtons.forEach(button=>button.addEventListener('click',()=>{
      topic=button.dataset.intelTopic;limit=12;
      topicButtons.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
      apply();
    }));
    kindButtons.forEach(button=>button.addEventListener('click',()=>{
      kind=button.dataset.intelKind;limit=12;
      kindButtons.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
      apply();
    }));
    search.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(()=>{limit=12;apply();},120);});
    root.querySelector('[data-intel-reset]').addEventListener('click',()=>{
      clearTimeout(timer);topic='all';kind='all';search.value='';limit=12;
      topicButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.intelTopic==='all')));
      kindButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.intelKind==='all')));
      apply();search.focus();
    });
    more.addEventListener('click',()=>{limit+=12;apply();});
    apply(false);
  }
})();
