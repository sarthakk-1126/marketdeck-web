// Presentation bridge only. Existing engines, permissions and data gates stay
// inside their product. The host receives no private records or price payloads.
if(document.body.classList.contains('md-desk-embed')){
  const symbol=document.body.dataset.mdDeskSymbol||'';
  const send=()=>{if(parent!==window)parent.postMessage({type:'marketdeck:embed-ready',symbol,title:document.title},location.origin);};
  send();
  // Keep calculations submitted to this embedded view; account/product links
  // open the full surface when the user explicitly follows them.
  for(const form of document.forms){
    if(form.method.toLowerCase()==='get'&&!form.querySelector('[name=embed]')){
      const input=document.createElement('input');input.type='hidden';input.name='embed';input.value='desk';form.append(input);
    }
    // A terminal has one company context. The outer company navigator owns it.
    for(const select of form.querySelectorAll('select[name="symbol"]')){
      if(!symbol)continue;
      select.value=symbol;select.disabled=true;
      const input=document.createElement('input');input.type='hidden';input.name='symbol';input.value=symbol;form.append(input);
      select.closest('.symbol-picker')?.querySelector('input')?.setAttribute('disabled','');
      select.title='Change the company in the Research Terminal navigator.';
    }
  }
  for(const a of document.querySelectorAll('a[href]')){
    const u=new URL(a.href,location.origin);
    if(a.hasAttribute('download'))continue;
    const targetSymbol=u.searchParams.get('symbol');
    if(u.origin===location.origin&&u.pathname===location.pathname&&(!targetSymbol||targetSymbol===symbol)){
      u.searchParams.set('embed','desk');a.href=u.pathname+u.search+u.hash;
    }else{
      a.target='_blank';a.rel='noopener noreferrer';
    }
  }
  // Nested companion buttons would otherwise cover the active chart.
  document.querySelector('.lens-launcher')?.setAttribute('hidden','');
}
