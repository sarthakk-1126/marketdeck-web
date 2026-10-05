// Compact homepage showcase for live advanced workspaces.
// Keep this list truthful. Future workspaces join the same carousel instead of
// receiving another full-height homepage section.
export const LIVE_WORKSPACES = Object.freeze([
  {
    id: 'research-terminal',
    label: 'Research Terminal',
    landing: '/screener/research-terminal/',
    workspace: '/screener/research-desk/'
  }
]);

export function workspaceShowcase() {
  return [
    '<section class="aws-shell" id="research-terminal" aria-labelledby="aws-title" data-advanced-workspaces data-workspace-count="1">',
      '<div class="container aws-frame">',
        '<div class="aws-track" data-workspace-track>',
          '<article class="aws-slide is-active" data-workspace-slide="research-terminal">',
            '<div class="aws-copy">',
              '<div class="aws-kicker"><span>ADVANCED WORKSPACE / 01</span><b>LIVE</b></div>',
              '<h2 id="aws-title">One company.<br><em>Keep the whole story.</em></h2>',
              '<p>Financials, charts, valuation, peers and your thesis&mdash;kept in one company context.</p>',
              '<div class="aws-actions">',
                '<a class="aws-primary" href="/screener/research-terminal/">Explore Research Terminal <span aria-hidden="true">&#8599;</span></a>',
                '<a class="aws-secondary" href="/screener/research-desk/">Open the desk <span aria-hidden="true">&#8594;</span></a>',
              '</div>',
              '<small>Explore first. Sign in only when you want to save a private desk.</small>',
            '</div>',
            '<div class="aws-holo" data-aws-holo aria-hidden="true">',
              '<div class="aws-holo-stage" data-aws-holo-stage>',
                '<div class="aws-holo-grid"></div>',
                '<svg class="aws-links" viewBox="0 0 760 330" focusable="false">',
                  '<path d="M233 88 334 138M565 73 474 135M201 244 324 206M575 242 485 204M373 262 389 224"/>',
                  '<circle cx="334" cy="138" r="3"/><circle cx="474" cy="135" r="3"/><circle cx="324" cy="206" r="3"/><circle cx="485" cy="204" r="3"/><circle cx="389" cy="224" r="3"/>',
                '</svg>',
                '<div class="aws-platform"><span>DATA</span><i></i><span>ANALYSIS</span><i></i><span>CONTEXT</span><i></i><span>CONVICTION</span></div>',
                '<div class="aws-card aws-core">',
                  '<div class="aws-core-head"><span>RESEARCH TERMINAL</span><b>COMPANY RESEARCH</b></div>',
                  '<div class="aws-core-tabs"><span class="is-active">Fundamentals</span><span>Value Lab</span><span>Peers</span><span>Thesis</span></div>',
                  '<div class="aws-core-body">',
                    '<div class="aws-chart">',
                      '<small>Revenue &amp; net profit</small>',
                      '<svg viewBox="0 0 330 112" focusable="false">',
                        '<g class="aws-chart-grid"><path d="M5 25H325M5 57H325M5 89H325M70 8V104M150 8V104M230 8V104M310 8V104"/></g>',
                        '<path class="aws-chart-muted" d="M8 89 52 82 96 85 140 67 184 71 228 54 272 59 322 39"/>',
                        '<path class="aws-chart-accent" d="M8 78 52 69 96 74 140 49 184 57 228 31 272 40 322 17"/>',
                        '<circle cx="272" cy="40" r="4"/>',
                      '</svg>',
                    '</div>',
                    '<div class="aws-metrics">',
                      '<span><small>Reporting basis</small><b>Visible</b></span>',
                      '<span><small>Source trace</small><b>Attached</b></span>',
                    '</div>',
                  '</div>',
                '</div>',
                '<div class="aws-card aws-satellite aws-fundamentals"><b>Fundamentals</b><span>Income statement</span><span>Cash flow</span><span>Key metrics</span></div>',
                '<div class="aws-card aws-satellite aws-value"><b>Value Lab</b><span>DCF assumptions</span><span>Sensitivity</span><span>Scenarios</span></div>',
                '<div class="aws-card aws-satellite aws-peers"><b>Peers</b><span>Comparable periods</span><span>Coverage checks</span></div>',
                '<div class="aws-card aws-satellite aws-thesis"><b>Thesis</b><span>Evidence</span><span>Counter-case</span><span>Private notes</span></div>',
                '<div class="aws-card aws-source"><span class="aws-dot"></span><div><small>SOURCE TRACE</small><b>Latest filing</b></div><span>&#8599;</span></div>',
              '</div>',
            '</div>',
          '</article>',
        '</div>',
        '<div class="aws-footer" aria-label="Advanced workspace carousel status">',
          '<div><span>01</span><b>Research Terminal</b></div>',
          '<div class="aws-progress" aria-hidden="true"><i class="is-active"></i></div>',
          '<span>01 / 01</span>',
        '</div>',
      '</div>',
    '</section>'
  ].join('');
}
