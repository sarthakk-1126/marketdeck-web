// Homepage discovery only. Keep the live-workspace registry truthful.
export const LIVE_WORKSPACES = Object.freeze([
  { id: 'research-terminal', label: 'Research Terminal', landing: '/screener/research-terminal/', workspace: '/screener/research-desk/' }
]);
const arrow = '<svg class="icon" aria-hidden="true"><use href="/assets/icons.svg#arrow"></use></svg>';
const artwork = '/assets/research-folio.webp';
const image = cls => `<img class="${cls}" src="${artwork}" width="1721" height="914" loading="lazy" decoding="async" alt="" draggable="false">`;
export function workspaceShowcase() {
  return `<section class="aws-shell" id="research-terminal" aria-labelledby="aws-title" data-advanced-workspaces data-workspace-count="1">
    <div class="container aws-frame">
      <article class="aws-slide is-active" data-workspace-slide="research-terminal">
        <div class="aws-copy">
          <div class="aws-kicker"><span>ADVANCED WORKSPACES</span><span>Research Terminal</span></div>
          <h2 id="aws-title">One company.<br><em>Keep the whole story.</em></h2>
          <p>Financials, charts, valuation and your thesis.<br>Connected in one research desk.</p>
          <div class="aws-actions">
            <a class="aws-primary" href="/screener/research-terminal/">Explore Research Terminal ${arrow}</a>
            <a class="aws-secondary" href="/screener/research-desk/">Open the desk ${arrow}</a>
          </div>
          <small>Explore first. Sign in to save.</small>
        </div>
        <figure class="aws-folio" data-aws-holo aria-label="Illustrative research folio connecting company context, fundamentals, valuation and a thesis. No live data.">
          <div class="aws-folio-stage" data-aws-holo-stage aria-hidden="true">
            <div class="aws-folio-art">
              ${image('aws-folio-base')}
              ${image('aws-folio-page')}
              ${image('aws-folio-light')}
              ${image('aws-folio-station aws-folio-fundamentals')}
              ${image('aws-folio-station aws-folio-value')}
              ${image('aws-folio-station aws-folio-thesis')}
            </div>
          </div>
          <figcaption>Illustrative research system</figcaption>
        </figure>
      </article>
    </div>
  </section>`;
}
