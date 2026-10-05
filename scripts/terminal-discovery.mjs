// Product-discovery preview only. No prices, filing payloads, accounts or APIs.
export const TERMINAL_LANDING = '/screener/research-terminal/';
export const TERMINAL_WORKSPACE = '/screener/research-desk/';
export const PREVIEW_VERSION = '20261005-1';
const views = [
 ['fundamentals','Fundamentals','Read the financial history.','Mix metrics and keep the reporting basis and source in view.'],
 ['valuation','Value Lab','Change the assumption.','Compare required returns, valuation models and sensitivities—not price targets.'],
 ['peers','Peers','Compare like with like.','Keep the reporting period, basis and missing-data limits beside the comparison.'],
 ['thesis','Thesis','Keep the evidence with the idea.','Bring observations, counter-evidence and source pins into your private notes.']
];
export function terminalPreview(id='rt-home') {
 if(!/^[a-z][a-z0-9-]+$/.test(id)) throw Error('Unsafe preview identifier');
 return `<div class="rtd-preview" data-rtd-preview data-rtd-mode="fundamentals" data-rtd-period="2">
 <div class="rtd-console">
  <div class="rtd-console-top"><span class="rtd-logo-mark" aria-hidden="true">M</span><strong>Research Terminal</strong><span class="rtd-demo-badge">INTERACTIVE PREVIEW</span></div>
  <div class="rtd-context"><span class="rtd-context-icon" aria-hidden="true">↳</span><div><small>ONE COMPANY CONTEXT</small><strong>Company research</strong></div><span class="rtd-context-link">Connected views</span></div>
  <div class="rtd-controls" role="group" aria-label="Preview a research view">
   ${views.map(([key,label],i)=>`<button type="button" data-rtd-select="${key}" aria-pressed="${i===0}" aria-controls="${id}-canvas" disabled><span aria-hidden="true">0${i+1}</span>${label}</button>`).join('')}
  </div>
  <div class="rtd-workplane" id="${id}-canvas">
   <div class="rtd-layer rtd-layer-back" aria-hidden="true"><span>SOURCE TRACE</span><i></i><i></i><i></i></div>
   <div class="rtd-layer rtd-layer-middle" aria-hidden="true"><span>REPORTING CONTEXT</span><i></i><i></i><i></i></div>
   <div class="rtd-layer rtd-layer-front">
    <div class="rtd-panel" data-rtd-panel="fundamentals"><div class="rtd-panel-heading"><strong>Revenue <span>&amp; Net profit</span></strong><small>Financial history</small></div>
     <svg class="rtd-chart" viewBox="0 0 420 150" aria-hidden="true" focusable="false"><g class="rtd-grid"><path d="M10 30H410M10 70H410M10 110H410M85 12V130M205 12V130M325 12V130"/></g><path class="rtd-line-secondary" d="M12 118 69 111 125 114 181 90 239 95 295 76 352 82 408 55"/><path class="rtd-line-primary" d="M12 102 69 94 125 98 181 67 239 76 295 44 352 53 408 22"/><g class="rtd-cursor"><path d="M352 10V131"/><circle cx="352" cy="53" r="5"/></g></svg>
     <div class="rtd-panel-bottom"><span><i></i>Revenue</span><span><i></i>Net profit</span><small>Reporting history →</small></div>
    </div>
    <div class="rtd-panel" data-rtd-panel="valuation" hidden><div class="rtd-panel-heading"><strong>Value Lab <span>/ assumptions first</span></strong><small>Not a forecast</small></div><div class="rtd-value-models"><span>Earnings</span><span>Cash flow</span><span>Dividends</span></div><div class="rtd-sensitivity"><span>Lower required return</span><i style="--rtd-bar:82%"></i><span>Higher required return</span><i style="--rtd-bar:48%"></i></div><p class="rtd-panel-note">Change the inputs. Inspect the calculation.</p></div>
    <div class="rtd-panel" data-rtd-panel="peers" hidden><div class="rtd-panel-heading"><strong>Peer context <span>/ same reporting basis</span></strong><small>Comparable periods</small></div><svg class="rtd-chart" viewBox="0 0 420 150" aria-hidden="true" focusable="false"><g class="rtd-grid"><path d="M20 25H410M20 65H410M20 105H410M85 12V130M205 12V130M325 12V130"/></g><g class="rtd-peer-dots"><circle cx="80" cy="97" r="5"/><circle cx="136" cy="52" r="5"/><circle cx="183" cy="94" r="5"/><circle cx="270" cy="46" r="5"/><circle cx="334" cy="76" r="5"/><circle cx="362" cy="27" r="5"/></g><circle class="rtd-peer-focus" cx="222" cy="62" r="7"/><circle class="rtd-peer-ring" cx="222" cy="62" r="17"/></svg><p class="rtd-panel-note">A comparison with explicit coverage and exclusions.</p></div>
    <div class="rtd-panel" data-rtd-panel="thesis" hidden><div class="rtd-panel-heading"><strong>Thesis <span>/ keep the thread</span></strong><small>Private when saved</small></div><div class="rtd-thesis-lines"><p><span>01</span> What changed in the business?</p><p><span>02</span> What would challenge this view?</p><p><span>03</span> Which filing supports the observation?</p></div><p class="rtd-panel-note">Example prompts—not a saved user desk.</p></div>
   </div>
   <div class="rtd-source-chip"><span class="rtd-source-dot" aria-hidden="true"></span><span>Source trace <b data-rtd-source-period>Latest filing</b></span><span aria-hidden="true">↗</span></div>
  </div>
  <div class="rtd-timeline" role="group" aria-label="Preview reporting-period context"><span>REPORTING<br>CONTEXT</span>${['Earlier filing','Previous filing','Latest filing'].map((label,i)=>`<button type="button" data-rtd-period-select="${i}" aria-pressed="${i===2}" disabled><i aria-hidden="true"></i>${label}</button>`).join('')}</div>
 </div>
 <div class="rtd-preview-readout" aria-live="polite" aria-atomic="true"><strong data-rtd-title>${views[0][2]}</strong><p data-rtd-detail>${views[0][3]}</p></div>
 <p class="rtd-preview-disclosure">Illustrative interface. No live market values or private notes.</p>
 </div>`;
}
export function terminalHomepage() {
 return `<section class="rtd-home rtd-surface" id="research-terminal" aria-labelledby="rtd-home-title"><div class="container rtd-home-inner"><div class="rtd-home-copy"><p class="rtd-eyebrow">RESEARCH TERMINAL / COMPANY WORKSPACE</p><h2 id="rtd-home-title">One company.<br><span>Keep the whole story.</span></h2><p class="rtd-lede">Financials, charts, valuation, peers and your thesis. Move between them without losing the company you came to understand.</p><div class="rtd-actions"><a class="rtd-primary" href="${TERMINAL_LANDING}">Explore Research Terminal <span aria-hidden="true">↗</span></a><a class="rtd-secondary" href="${TERMINAL_WORKSPACE}">Open the desk <span aria-hidden="true">→</span></a></div><p class="rtd-access">Explore first. Sign in to save a private desk.</p><div class="rtd-connected"><span>Financial history</span><i aria-hidden="true">↔</i><span>Value Lab</span><i aria-hidden="true">↔</i><span>Evidence</span></div></div>${terminalPreview()}</div></section>`;
}
