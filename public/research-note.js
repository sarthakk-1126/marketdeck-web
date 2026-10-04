// Public overview handoff only. No account, portfolio, query or user identifiers.
document.addEventListener('click',event=>{
  const link=event.target.closest?.('a[href="/screener/portfolio-analysis/"]');
  if(!link||typeof window.gtag!=='function')return;
  window.gtag('event','research_product_handoff',{
    research_id:'var_simulation',method_version:'INT-VAR-SIM-1.0',
    destination:'portfolio_analysis_overview'
  });
});
