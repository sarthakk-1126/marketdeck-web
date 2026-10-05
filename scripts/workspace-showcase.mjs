// Homepage discovery only. Keep the live-workspace registry truthful.
export const LIVE_WORKSPACES = Object.freeze([
  { id: 'research-terminal', label: 'Research Terminal', landing: '/screener/research-terminal/', workspace: '/screener/research-desk/' },
  { id: 'books', label: 'Books & Investor Methods', landing: '/screener/learning/books/' }
]);
const arrow = '<svg class="icon" aria-hidden="true"><use href="/assets/icons.svg#arrow"></use></svg>';
const chevron = '<svg class="icon" aria-hidden="true"><use href="/assets/icons.svg#chevron"></use></svg>';
const artwork = '/assets/research-folio.webp';
const image = cls => `<img class="${cls}" src="${artwork}" width="1721" height="914" loading="lazy" decoding="async" alt="" draggable="false">`;
const atlas = '/assets/books-method-atlas.webp';
const atlasImage = cls => `<img class="${cls}" src="${atlas}" width="1700" height="680" loading="lazy" decoding="async" alt="" draggable="false">`;
export function workspaceShowcase() {
  return `<section class="aws-shell" id="research-terminal" role="region" aria-roledescription="carousel" aria-label="Research and Learning" tabindex="0" data-advanced-workspaces data-workspace-count="2">
    <div class="container aws-frame">
      <div class="aws-track" data-aws-track>
      <article class="aws-slide is-active" role="group" aria-roledescription="slide" aria-label="Research Terminal, 1 of 2" data-workspace-slide="research-terminal" aria-labelledby="aws-title">
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
      <article class="aws-slide aws-books" role="group" aria-roledescription="slide" aria-label="Books and Investor Methods, 2 of 2" data-workspace-slide="books" aria-labelledby="aws-books-title">
        <div class="aws-copy">
          <div class="aws-kicker"><span>ADVANCED WORKSPACES</span><span>Books &amp; Investor Methods</span></div>
          <h2 id="aws-books-title">Read the idea.<br><em>Test the thinking.</em></h2>
          <p>Original book guides, worked examples and investor methods.<br>Take a better question into your research.</p>
          <div class="aws-actions">
            <a class="aws-primary" href="/screener/learning/books/">Explore the bookshelf ${arrow}</a>
            <a class="aws-secondary" href="/screener/learning/">Open Learning ${arrow}</a>
          </div>
          <small>25 book guides. Original MarketDeck interpretations.</small>
        </div>
        <figure class="aws-learning-atlas" data-aws-holo aria-label="Original MarketDeck illustration of an open investment guide connecting an idea to testing and application.">
          <div class="aws-atlas-stage" data-aws-holo-stage aria-hidden="true">
            <div class="aws-atlas-art">
              ${atlasImage('aws-atlas-base')}
              ${atlasImage('aws-atlas-page')}
              ${atlasImage('aws-atlas-trace')}
              ${atlasImage('aws-atlas-node aws-atlas-idea')}
              ${atlasImage('aws-atlas-node aws-atlas-test')}
              ${atlasImage('aws-atlas-node aws-atlas-apply')}
            </div>
          </div>
          <figcaption>Idea → test → apply · original MarketDeck illustration</figcaption>
        </figure>
      </article>
      </div>
      <div class="aws-controls" data-aws-controls aria-label="Carousel controls">
        <div class="aws-pagination" aria-label="Choose feature">
          <button type="button" data-aws-dot="0" aria-label="Show Research Terminal" aria-current="true" disabled><span>Research Terminal</span></button>
          <button type="button" data-aws-dot="1" aria-label="Show Books and Investor Methods" disabled><span>Books</span></button>
        </div>
        <span class="aws-count" aria-hidden="true"><strong data-aws-current>01</strong><i>/</i><span>02</span></span>
        <button type="button" class="aws-arrow aws-prev" data-aws-prev aria-label="Previous feature" disabled>${chevron}</button>
        <button type="button" class="aws-arrow aws-next" data-aws-next aria-label="Next feature" disabled>${chevron}</button>
        <span class="sr-only" role="status" data-aws-status aria-live="polite"></span>
      </div>
    </div>
  </section>`;
}
