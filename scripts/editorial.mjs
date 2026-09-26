import {buildArticles} from './articles.mjs';
import {catalog,shelf,hub,libraryPage,archivePage,learningHub,LEARNING_HUBS} from './intelligence.mjs';
import {readFileSync,writeFileSync,mkdirSync,copyFileSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const isPublished=i=>i.publicationStatus==='published'&&Boolean(i.approvedAt);
const refText=v=>esc(v).replace(/\[(S\d+)\]/g,'<a href="#$1">[$1]</a>');
export function buildEditorial({data,template,root,review}) {
  const manifest=JSON.parse(readFileSync(data.editorial.manifest,'utf8'));
  const urls=['/','/intelligence/','/intelligence/library/','/intelligence/issues/','/intelligence/methodology/','/credits/','/research-standards/'];
  // Fail closed if a previously published issue is changed back to draft. Never silently retain it.
  if(!review) for(const issue of manifest.issues) if(!isPublished(issue)&&existsSync(resolve(root,`intelligence/issues/${issue.slug}`))) throw new Error(`Unpublished issue remains in public output: ${issue.slug}. Remove its generated directory before building.`);
  const page=(title,summary,path,body,draft=false)=>`<!doctype html><html lang="en-IN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} | MarketDeck Intelligence</title><meta name="description" content="${esc(summary)}">${draft||review?'<meta name="robots" content="noindex, nofollow">':`<link rel="canonical" href="${esc(new URL(path,data.brand.url).href)}">`}<link rel="icon" href="/favicon.png" type="image/png" sizes="192x192"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="stylesheet" href="/home.css"><link rel="stylesheet" href="/reading.css"></head><body><a class="skip-link" href="#reading">Skip to reading</a><header class="reading-header"><a class="brand" href="/">MarketDeck<span class="brand-period">.</span></a><nav aria-label="Reading navigation"><a href="/intelligence/">Intelligence</a><a href="/intelligence/library/">Library</a><a href="/intelligence/issues/">Magazine archive</a><a href="/#products">The suite</a></nav></header><main id="reading" class="reading-main">${draft?'<p class="draft-banner">EDITORIAL DRAFT · Local owner review · Not published</p>':''}${body}</main><footer class="reading-footer">MarketDeck · Research and education. Not investment advice.<a href="/intelligence/methodology/">Calculation methodology</a><a href="/">Return to MarketDeck</a></footer></body></html>`;
  function write(path,html){const f=resolve(root,`.${path}index.html`);mkdirSync(dirname(f),{recursive:true});writeFileSync(f,html);}
  const researchStandards = `
    <p class="eyebrow">MARKETDECK / RESEARCH STANDARDS</p>
    <h1>Research you can interrogate.</h1>
    <p class="reading-lead">How MarketDeck handles sources, data freshness, calculations, AI assistance, uncertainty and the boundary between research tools and investment advice.</p>
    <article class="reading-body">
      <h2>Publisher and scope</h2>
      <p>MarketDeck is the publisher of this product suite and MarketDeck Intelligence. We do not invent analyst identities, review boards, qualifications or first-hand trading records. Where a named author, credential or external reviewer is not real and documented, we do not claim one.</p>

      <h2>Sources and provenance</h2>
      <p>Different products use different evidence. StockProof traces material company research back to stored filing evidence where available. Charting uses stored market history. F&amp;O distinguishes live market data, stored snapshots and historical archives. Commentary links back to the underlying third-party video/commentary source. Crypto World identifies material third-party market-data providers on the pages that use them. Intelligence links its research sources directly.</p>
      <p>A provider name does not mean MarketDeck independently verified every upstream observation. Source labels explain origin; they are not a guarantee that upstream data is error-free.</p>
      <p>Public provenance uses the narrowest accurate class: primary source, company filing, exchange record, provider observation, MarketDeck-derived output or historical archive. A MarketDeck formula applied to an exchange or provider input remains MarketDeck-derived. Attribution does not imply endorsement, ownership, unrestricted redistribution rights or authority the source did not grant.</p>

      <h2>Live, stored, snapshot, historical, stale and unavailable</h2>
      <p>MarketDeck does not use “live” as a decorative label. Public products use a shared data-state vocabulary so the same word means the same thing across the suite.</p>
      <h3 id="data-state-live">Live</h3>
      <p>Obtained from an active provider, request or stream and current under that product’s stated freshness contract. When material, the source/provider and observation time should be visible. “Real time” is a factual latency claim and is not used unless it can be substantiated.</p>
      <h3 id="data-state-stored">Stored</h3>
      <p>Persisted by MarketDeck from an identified source. Stored does not mean current. The relevant source period or observation time should remain visible when it affects interpretation.</p>
      <h3 id="data-state-snapshot">Snapshot</h3>
      <p>A point-in-time capture of a market or product state. A snapshot must not be presented as live.</p>
      <h3 id="data-state-historical">Historical</h3>
      <p>Past observations, filings, results or replay data used descriptively. The relevant date or period belongs with the result.</p>
      <h3 id="data-state-stale">Stale</h3>
      <p>The latest available stored observation is older than the product’s acceptable freshness boundary, or the source has stopped updating. The last known observation or period should be shown rather than implying current data.</p>
      <h3 id="data-state-unavailable">Unavailable</h3>
      <p>No reliable value is available. MarketDeck should not silently substitute zero, an estimate or a nearby observation.</p>
      <p>For persisted user-visible data, MarketDeck prefers “stored” over the technical word “cached”. Derived values inherit the time-state and limitations of their inputs.</p>

      <h2>Calculations, definitions and denominators</h2>
      <p>Material calculations should be reproducible from their stated inputs. A ratio is only interpretable when its numerator, denominator, reporting period and units are understood. Where assumptions materially change an output—such as a return window, confidence level, premium, strike, tax rule, or value basis—those assumptions belong next to the result or in a directly linked methodology.</p>
      <p>MarketDeck does not treat a redeploy as a methodological change. When a methodology meaningfully changes, the relevant method receives a stable version identifier and the change is documented.</p>

      <h2 id="methodology-versioning">Methodology versioning and change history</h2>
      <p>Public method identifiers use <code>PRODUCT-METHOD-major.minor</code>. A major change alters interpretation—such as a formula, denominator, model basis, eligibility rule or core assumption. A minor change adds an interpretation-sensitive method or materially clarifies scope without redefining existing results. Copy edits, styling, tests, infrastructure changes and ordinary deploys do not change a public method version.</p>
      <p>The stable methodology URL does not change when its version changes. Affected outputs expose the current identifier where it materially helps interpretation. Historical outputs retain the method version that produced them when the product stores that relationship; they are not silently relabelled.</p>
      <h3>Current public method history</h3>
      <ul>
        <li><code>SP-METHOD-1.0</code> — StockProof calculation definitions; effective 26 September 2026.</li>
        <li><code>FO-METHOD-1.0</code> — F&amp;O calculation and model definitions; effective 26 September 2026.</li>
        <li><code>CH-METHOD-1.0</code> — Charting indicators, breadth and evaluation definitions; effective 26 September 2026.</li>
        <li><code>CR-METHOD-1.0</code> — Crypto World market, derivatives, tax and portfolio definitions; effective 26 September 2026.</li>
        <li><code>INT-METHOD-1.0</code> — Intelligence worked-example definitions; effective 26 September 2026.</li>
      </ul>
      <p>This list is the public change-history baseline. A future interpretation-sensitive revision adds a dated entry describing what changed and why; prior entries remain visible.</p>

      <h2>Historical results are descriptive</h2>
      <p>Backtests, historical matches, seasonality, prior price moves and paper-trading records describe what happened under stated rules and available data. They are not forecasts, recommendations or promises of future returns. A single historical outcome is not a win rate or expectancy.</p>

      <h2>AI assistance</h2>
      <p>AI is used only where the product explicitly says so. MarketDeck Intelligence discloses AI assistance in its editorial policy. Commentary labels AI-generated interpretation separately from source-attributed commentary. StockProof AI Mode is bounded to general financial concepts and is designed to refuse security-specific or personalized advice-shaped requests. Deterministic financial figures do not become “AI generated” merely because AI helped write surrounding software or editorial copy.</p>

      <h2>Research, not personalized investment advice</h2>
      <p>MarketDeck provides research, education and analytical tools. It does not provide individualized buy, sell or hold instructions, price targets tailored to a user, or portfolio advice. Product-specific disclaimers remain in place where the domain needs more precise wording, including tax calculations, market-data snapshots, backtests and AI-generated interpretation.</p>

      <h2>Dates and freshness</h2>
      <p>Publication dates, substantive modified dates, filing periods, market/data as-of timestamps and source-review dates mean different things and are not substituted for one another. A publication date records first publication. A modified date changes only for substantive content or method changes. A source-review date records when a cited source was checked; it does not make the source newly published. A market/data as-of time belongs to the observation itself.</p>
      <p>Canonical metadata and structured data must agree with the visible publication and modified dates they describe. Sitemap and Atom dates follow their own documented content-event rules and must not be advanced by a cosmetic build. An “updated” date is not a deployment timestamp, and no date is advanced merely to imply fresh research.</p>

      <h2>Corrections and limitations</h2>
      <p>When MarketDeck identifies a material error, the correction should be made at the affected source or methodology and the relevant date/version updated when that change affects interpretation. We do not claim an always-staffed research desk, guaranteed response time or independent professional review where none exists.</p>
      <p>For long-form editorial standards and AI-assistance disclosure, see <a href="/intelligence/editorial-policy/">MarketDeck Intelligence editorial standards</a>.</p>
    </article>`;

  write('/research-standards/', page(
    'Research Standards & Methodology',
    'How MarketDeck handles sources, data freshness, calculations, AI assistance, uncertainty and the boundary between research tools and investment advice.',
    '/research-standards/',
    researchStandards
  ));
  const intelligenceMethodology = `
    <p class="eyebrow">MARKETDECK INTELLIGENCE / METHODOLOGY</p>
    <h1>Definitions behind the worked examples.</h1>
    <p class="reading-lead">How MarketDeck Intelligence handles calculations, periods, units, sources, hypothetical inputs and unavailable evidence.</p>
    <article class="reading-body">
      <p><strong>Method version:</strong> <code>INT-METHOD-1.0</code> · effective and method-reviewed <time datetime="2026-09-26">26 September 2026</time>. It changes only for interpretation-sensitive calculation or evidence rules, not for an ordinary deploy.</p>
      <h2>Scope and provenance</h2>
      <p>Intelligence articles are educational research. A calculation in an article is either reproduced from values in a linked source, derived from explicitly cited market or filing data, or a labelled hypothetical worked example. A hypothetical value is not live, stored or historical market data. When an article links to a MarketDeck product output, that product's methodology and data-state label govern the output.</p>

      <h2>Source and provenance register</h2>
      <p><strong>Primary sources and filings</strong> support claims drawn from official company, regulator, exchange or standards documents. <strong>Exchange and provider observations</strong> retain their named source and observation period. <strong>Research papers</strong> are attributed findings, not claims that MarketDeck independently replicated the study. <strong>MarketDeck-derived</strong> labels cover arithmetic, diagrams and interpretations created from stated inputs. <strong>Historical archives</strong> retain the period they describe. Each article's source list, scope note and reviewed date remain the specific evidence record.</p>
      <p>Links and limited quotations respect the source's access and licensing boundary; the article does not become a substitute data feed or imply endorsement by the source.</p>

      <h2>Returns, growth and drawdowns</h2>
      <p>Simple return (%) = (ending value ÷ beginning value − 1) × 100. The beginning value is the denominator. CAGR (%) = [(ending value ÷ beginning value)^(1 ÷ years) − 1] × 100, using the stated number of years. Drawdown (%) = (current value ÷ prior peak − 1) × 100; the prior peak is the denominator. Price return excludes distributions unless the article explicitly uses an adjusted or total-return series.</p>

      <h2>Company and valuation ratios</h2>
      <p>Margin (%) = the named profit measure ÷ the named revenue measure × 100. ROE = profit attributable to ordinary equity holders ÷ average ordinary equity × 100. ROCE = operating profit after the article's stated adjustments ÷ average capital employed × 100. Debt-to-equity = interest-bearing debt ÷ shareholder equity. Cash conversion is the named cash-flow measure ÷ the named profit measure. P/E = price per share ÷ earnings per share; earnings yield is its inverse, earnings per share ÷ price per share × 100. EV/EBITDA = enterprise value ÷ EBITDA. Articles must keep standalone/consolidated scope, currency, lakhs/crores conversion and reporting periods comparable.</p>

      <h2>Options examples</h2>
      <p>Intrinsic value is max(spot − strike, 0) for a call and max(strike − spot, 0) for a put. Time value = premium − intrinsic value. Expiry payoff is intrinsic value less premium paid for a long option, or premium received less intrinsic value for a short option, multiplied by the stated quantity where applicable. IV rank = (current IV − lookback minimum) ÷ (lookback maximum − lookback minimum) × 100. IV percentile = observations below the current IV ÷ valid lookback observations × 100; the article states its tie convention. A zero range or insufficient comparable history is unavailable.</p>

      <h2>Crypto and portfolio examples</h2>
      <p>India premium (%) = [Indian INR price ÷ (global USD price × USD/INR rate) − 1] × 100. DCA average cost = total acquisition cost ÷ total acquired quantity. Portfolio weight = position value ÷ total eligible portfolio value × 100. Correlation means Pearson correlation of the named paired return series over the stated window; volatility is the standard deviation of named returns with the stated annualisation factor.</p>

      <h2>Windows, units and rounding</h2>
      <p>Each worked calculation must name its observation dates or reporting periods and its currency, percentage, multiple, index-point or quantity units. Percentages and percentage points are not interchangeable. Values are computed before display rounding; the article states material rounding where a worked example cannot be reproduced from the displayed digits alone.</p>

      <h2>Missing and unavailable evidence</h2>
      <p>A missing source value, non-comparable period, zero or invalid denominator, insufficient history or unresolved definition remains unavailable. It is not replaced by zero, a nearby observation or an estimate unless the article explicitly labels a separate hypothetical assumption. Editorial prose must not turn an unavailable calculation into an authoritative claim.</p>

      <h2>Sources, assumptions and corrections</h2>
      <p>Primary filings, exchange documents, statutes, standards and provider definitions are preferred. Source dates and retrieval limitations belong with time-sensitive claims. Assumptions must be visible beside the example or linked directly from it. Material corrections update the affected article and its substantive update date; they do not create an invented authority or review signal.</p>
      <h2>Date and freshness semantics</h2>
      <p>Article publication and modified dates come from the same editorial metadata used by structured data. Source-review dates belong to individual citations. Market/data as-of dates belong beside the observation or worked calculation. Sitemap and Atom dates follow publication/content-change events. A cosmetic release changes none of these and does not imply refreshed research.</p>
      <p>See also <a href="/intelligence/editorial-policy/">Editorial standards</a> and <a href="/research-standards/">MarketDeck Research Standards</a>, including the <a href="/research-standards/#methodology-versioning">public methodology change-history policy</a>.</p>
    </article>`;
  write('/intelligence/methodology/', page(
    'Intelligence Calculation Methodology',
    'Formulas, periods, units, sources and unavailable-data treatment for calculations in MarketDeck Intelligence.',
    '/intelligence/methodology/',
    intelligenceMethodology
  ));
  write('/credits/',page('Asset credits','Image and open-source credits for the MarketDeck homepage.','/credits/',`<p class="eyebrow">MARKETDECK</p><h1>Asset credits.</h1><article class="reading-body"><h2>Earth</h2><p>Earth surface, night lights, normal, cloud and ocean-specular maps: <a href="https://ftp.solarsystemscope.com/textures/">Solar System Scope</a>, used under <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>. Resized and converted to self-hosted WebP; cloud coverage and ocean reflectivity are packed into separate channels of one map. The material uses restrained color grading and illustrative twilight lighting. Network geometry is decorative and does not depict live market data. Textures are representative global maps, not current weather imagery.</p><h2>Interface and editorial artwork</h2><p>The five product-card images are original AI-assisted editorial illustrations created for MarketDeck. They depict research concepts, not application interfaces or live market data. They are cropped and exported as self-hosted WebP assets. The immediate Earth poster and editorial illustrations were created for MarketDeck using Image Gen; they are illustrations, not satellite measurements.</p><h2>Open-source software and platform marks</h2><p>3D rendering: <a href="/licenses/three.txt">Three.js, MIT license</a>. Platform icons: <a href="https://simpleicons.org/">Simple Icons</a>, <a href="/licenses/simple-icons.txt">CC0</a>; brands retain their trademarks. Platform names and marks identify planned channels and imply no partnership or endorsement.</p></article>`));
  const noteSlugs=['business-before-the-stock','a-chart-is-a-question','five-research-lenses'];
  const notes=[];
  template=template.replace(/<details class="editorial-card reveal"><summary>([\s\S]*?)<\/summary><div class="article-body">([\s\S]*?)<\/div><\/details>/g,(_,card,body)=>{
    const path=`/intelligence/notes/${noteSlugs[notes.length]}/`;
    const title=card.match(/<h3>([\s\S]*?)<\/h3>/)[1].replace(/<br\s*\/?\s*>/g,' ').replace(/<[^>]*>/g,'');
    const summary=card.match(/<p>([\s\S]*?)<\/p>/)[1];notes.push({path,title,summary,slug:noteSlugs[notes.length],body});urls.push(path);
    write(path,page(title,summary,path,`<p class="eyebrow">MARKETDECK INTELLIGENCE / LEARNING NOTE</p><h1>${title}</h1><p class="reading-lead">${summary}</p><article class="reading-body">${body.replaceAll('<h4>','<h2>').replaceAll('</h4>','</h2>')}</article><a class="text-link" href="/intelligence/">All learning notes →</a>`));
    return `<article class="editorial-card reveal"><a href="${path}">${card}</a></article>`;
  });
  const visible=manifest.issues.filter(i=>isPublished(i)||review);
  function issueCard(i){const draft=!isPublished(i);return `<article class="issue-feature"><a class="issue-cover" href="/intelligence/issues/${i.slug}/"><img src="${esc(i.cover)}" width="420" height="594" loading="lazy" alt="The MarketDeck Brief: ${esc(i.title)}${draft?' — editorial draft':''}"></a><div><p class="eyebrow">THE MARKETDECK BRIEF ${draft?' / EDITORIAL DRAFT':''}</p><h2>${esc(i.title)}</h2><p class="issue-meta">${esc(i.edition)} · ${i.pageCount} pages</p><p>${esc(i.summary)}</p><div class="issue-actions"><a class="button button-primary" href="/intelligence/issues/${i.slug}/">Read the issue →</a><a class="text-link" href="${esc(i.pdfPath)}">PDF · ${i.pageCount} pages ↗</a></div><a class="issue-archive" href="/intelligence/issues/">Browse the issue archive →</a>${draft?'<p class="draft-note">Local editorial review. Pending owner approval; excluded from the production build.</p>':''}</div></article>`;}
  for(const issue of visible){
    const draft=!isPublished(issue),path=`/intelligence/issues/${issue.slug}/`;
    const source=JSON.parse(readFileSync(issue.source,'utf8'));
    const contents=source.pages.map((p,i)=>`<li><a href="#page-${i+1}">${String(i+1).padStart(2,'0')} / ${esc(p.title)}</a></li>`).join('');
    const body=source.pages.map((p,i)=>`<section class="issue-chapter" id="page-${i+1}"><p class="eyebrow">${esc(p.kicker)} / PAGE ${i+1}</p><h2>${esc(p.title)}</h2><p class="reading-lead">${esc(p.intro)}</p>${p.figure?`<figure class="issue-figure"><img src="${esc(p.figure)}" alt="${esc(p.figureAlt)}" loading="lazy" style="display:block;max-width:100%;height:auto"><figcaption>${esc(p.figureCaption)}</figcaption></figure>`:""}${p.sections.map(s=>`<h3>${esc(s.title)}</h3>${s.text?`<p>${refText(s.text)}</p>`:''}${s.items?`<ul>${s.items.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}`).join('')}<aside>${esc(p.callout)}</aside></section>`).join('');
    const refs=source.sources.map(s=>`<li id="${s.id}"><a href="${esc(s.url)}">${s.id} / ${esc(s.title)}</a><p>Source date: ${esc(s.publicationDate)}. Reviewed ${esc(s.reviewedAt)}.</p></li>`).join('');
    write(path,page(issue.title,issue.summary,path,`<p class="eyebrow">THE MARKETDECK BRIEF</p><h1>${esc(issue.title)}</h1><p class="reading-lead">${esc(issue.summary)}</p><p>${esc(issue.edition)} · ${issue.pageCount} pages · Sources reviewed ${issue.sourceReviewedAt}</p><div class="issue-actions"><a class="button button-primary" href="${esc(issue.pdfPath)}">Open PDF · ${issue.pageCount} pages ↗</a><a href="#contents">Read in HTML ↓</a></div><nav id="contents" class="issue-contents" aria-label="Issue contents"><h2>In this issue</h2><ol>${contents}</ol></nav><article class="reading-body">${body}<section class="issue-chapter"><h2>Primary source references</h2><ol class="source-list">${refs}</ol></section></article>`,draft));
    // Magazine assets are explicit in the manifest/source; require every advertised file.
    const names=new Set([issue.pdfPath,issue.cover,...source.pages.map(p=>p.figure)].filter(Boolean).map(p=>p.split('/').pop()));
    names.add('marketdeck-brief.pdf');
    for(const name of names){const src=resolve(issue.assets,name);if(!existsSync(src))throw new Error(`Missing editorial asset: ${src}`);copyFileSync(src,resolve(root,`.${path}${name}`));}
    if(!draft)urls.push(path);
  }
  const expanded=buildArticles({root,review,baseNotes:notes});
  notes.splice(0,notes.length,...expanded);
  for(const n of notes)if(!urls.includes(n.path))urls.push(n.path);
  urls.push('/intelligence/editorial-policy/');
  const collection=catalog(manifest,notes);
  write('/intelligence/',hub(collection,{review}));
  write('/intelligence/library/',libraryPage(collection,{review}));
  write('/intelligence/issues/',archivePage(collection,{review}));
  for(const slug of Object.keys(LEARNING_HUBS)){
    const path=`/intelligence/${slug}/`;
    write(path,learningHub(collection,slug,{review}));
    urls.push(path);
  }
  writeFileSync(resolve(root,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(u=>`<url><loc>${new URL(u,data.brand.url).href}</loc></url>`).join('')}</urlset>`);
  const brief=shelf(collection);
  template=template.replace(/    <section class="brief-section"[\s\S]*?<\/section>/,`<section class="brief-section"><div class="container">${brief}${data.newsletter.url?`<p class="newsletter-note"><a href="${esc(data.newsletter.url)}">Newsletter updates →</a></p>`:''}</div></section>`);
  template=template.replace('</head>','<link rel="stylesheet" href="/intelligence-shelf-v2.css"><script src="/intelligence-shelf-v2.js" defer></script></head>');
  template=template.replace(/  <dialog class="article-dialog"[\s\S]*?<\/dialog>/,'');
  if(review)template=template.replace('<meta name="theme-color"','<meta name="robots" content="noindex, nofollow"><meta name="theme-color"');
  return template;
}
