import {portfolioGuide} from './portfolio-lab-guide-content.js';

// A local, user-opened guide. It never changes research inputs or calls a provider.
export function createPortfolioGuide(root) {
 const card=document.createElement('section');card.className='pl-guide-start';
 card.setAttribute('aria-label','Portfolio playground guide');
 card.innerHTML='<div class="pl-guide-orb" aria-hidden="true">▷</div><div><span class="pl-eyebrow">A GOOD PLACE TO START</span><h3>Turn a question into an experiment.</h3><p>A short walkthrough and clear steps. Explore at your own pace.</p></div><div class="pl-guide-entry"><button type="button" data-pl-guide-open="watch">▷ Watch the guide <span>1 min</span></button><button type="button" data-pl-guide-open="read">Read quick steps ↗</button></div>';
 root.querySelector('.pl-source').before(card);
 const dialog=document.createElement('dialog');dialog.className='pl-guide-dialog';
 dialog.setAttribute('aria-labelledby','pl-guide-title');dialog.setAttribute('aria-describedby','pl-guide-description');
 dialog.innerHTML=`<div class="pl-guide-heading"><div><span class="pl-eyebrow">PORTFOLIO PLAYGROUND · START HERE</span><h2 id="pl-guide-title">${portfolioGuide.title}</h2><p id="pl-guide-description">Small changes. Clear assumptions. A research trail you can reopen.</p></div><button type="button" data-pl-guide-close aria-label="Close portfolio guide" autofocus>×</button></div><div class="pl-guide-modes" role="group" aria-label="Guide format"><button type="button" data-pl-guide-mode="watch" aria-pressed="false">Watch the walkthrough</button><button type="button" data-pl-guide-mode="read" aria-pressed="false">Read quick steps</button></div><section data-pl-guide-watch hidden aria-label="Video walkthrough"><video controls playsinline preload="none" width="1280" height="720" aria-label="Portfolio playground walkthrough" data-pl-guide-video><track kind="captions" srclang="en" label="English instructions" data-pl-guide-track>Use the written steps below if your browser cannot play this video.</video><p class="pl-guide-media-note">Fully captioned · works without sound · fictional guide example</p><p class="pl-guide-error" data-pl-guide-error role="status" hidden>The video could not load. The complete written guide is available in Read quick steps.</p><nav class="pl-guide-chapters" aria-label="Video chapters">${portfolioGuide.steps.map(s=>`<button type="button" data-pl-guide-chapter="${s.start}"><span>${String(Math.floor(s.start/60)).padStart(2,'0')}:${String(s.start%60).padStart(2,'0')}</span>${s.short}</button>`).join('')}</nav></section><section class="pl-guide-steps" data-pl-guide-read hidden aria-label="Written walkthrough">${portfolioGuide.steps.map((s,i)=>`<article><span class="pl-guide-step-number">${String(i+1).padStart(2,'0')}</span><div><h3>${s.title}</h3><p>${s.body}</p><p class="pl-guide-tip">${s.note}</p></div></article>`).join('')}</section><footer class="pl-guide-footer"><p>Your inputs describe a hypothetical experiment. Real markets fluctuate.</p><button type="button" data-pl-guide-try>Back to my playground ↗</button></footer>`;
 root.append(dialog);
 const video=dialog.querySelector('video');let opener=null,seekHandler=null,mediaLoaded=false;
 const clearSeek=()=>{if(seekHandler)video.removeEventListener('loadedmetadata',seekHandler);seekHandler=null;};
 const show=mode=>{
  const watch=mode==='watch';dialog.querySelector('[data-pl-guide-watch]').hidden=!watch;dialog.querySelector('[data-pl-guide-read]').hidden=watch;
  for(const button of dialog.querySelectorAll('[data-pl-guide-mode]'))button.setAttribute('aria-pressed',String(button.dataset.plGuideMode===mode));
  if(watch&&!mediaLoaded){
   mediaLoaded=true;
   video.poster='/assets/guides/portfolio-playground-v1.webp';
   dialog.querySelector('[data-pl-guide-track]').src='/assets/guides/portfolio-playground-v1.vtt';
   const formats=[['mp4','video/mp4; codecs="avc1.64001f"'],['webm','video/webm; codecs="vp9"']].filter(([,type])=>video.canPlayType(type));let failures=0;
   if(!formats.length)dialog.querySelector('[data-pl-guide-error]').hidden=false;
   for(const [extension,type] of formats){const source=document.createElement('source');source.src='/assets/guides/portfolio-playground-v1.'+extension;source.type=type;source.addEventListener('error',()=>{failures++;if(failures>=formats.length&&video.readyState<1)dialog.querySelector('[data-pl-guide-error]').hidden=false;});video.insertBefore(source,video.querySelector('track'));}
  }else if(!watch){video.pause();clearSeek();}
 };
 const close=()=>{if(dialog.open)dialog.close();};
 root.addEventListener('click',event=>{
  const open=event.target.closest('[data-pl-guide-open]');if(open){opener=open;show(open.dataset.plGuideOpen);if(!dialog.open)dialog.showModal();return;}
  if(event.target.closest('[data-pl-guide-close],[data-pl-guide-try]')){close();return;}
  const mode=event.target.closest('[data-pl-guide-mode]');if(mode){show(mode.dataset.plGuideMode);return;}
  const chapter=event.target.closest('[data-pl-guide-chapter]');if(chapter){clearSeek();const time=Number(chapter.dataset.plGuideChapter);video.pause();if(video.readyState>=1)video.currentTime=time;else{seekHandler=()=>{video.currentTime=time;clearSeek();};video.addEventListener('loadedmetadata',seekHandler,{once:true});video.preload='metadata';video.load();}}
 });
 video.addEventListener('loadedmetadata',()=>{dialog.querySelector('[data-pl-guide-error]').hidden=true;});
 video.addEventListener('error',()=>{dialog.querySelector('[data-pl-guide-error]').hidden=false;});
 dialog.addEventListener('close',()=>{video.pause();clearSeek();opener?.focus();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)video.pause();});
 return {close,open(mode='read',button=null){opener=button;show(mode);if(!dialog.open)dialog.showModal();}};
}
