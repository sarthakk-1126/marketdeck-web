import { confirmedDestinations } from './community.mjs';
import { readFileSync, writeFileSync, cpSync, mkdirSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildEditorial } from './editorial.mjs';
import { injectAnalytics, stripAnalytics } from './analytics.mjs';
import { homepageIdentityGraph } from './structured-identity.mjs';
import { productPreview } from './product-previews.mjs';

export const escapeHtml = (value) => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const safeUrl = (value) => {
  if (value == null) return null;
  if (typeof value !== 'string' || /[\s<>"'\\]/.test(value)) throw new Error(`Invalid destination: ${value}`);
  if (/^\/(?!\/)/.test(value) || /^https:\/\/[^/]+/.test(value) || /^mailto:[^@]+@[^@]+\.[^@]+/.test(value)) return escapeHtml(value);
  throw new Error(`Unsupported destination: ${value}`);
};
const data = JSON.parse(readFileSync(new URL('../src/site-data.json', import.meta.url)));
const review=process.argv.includes('--review');
const output=resolve(review?'.preview/review':'public');
mkdirSync(output,{recursive:true});
if(review)cpSync('public',output,{recursive:true});
const icon = (name, cls = '') => `<svg class="icon ${cls}" aria-hidden="true"><use href="/assets/icons.svg#${escapeHtml(name)}"></use></svg>`;
const arrow = icon('arrow');
const external = url => url.startsWith('https:') ? ' target="_blank" rel="noopener noreferrer"' : '';
const destination = (url, label, cls = 'text-link', pending = 'Link coming soon') => url
  ? `<a class="${cls}" href="${safeUrl(url)}"${external(url)}>${escapeHtml(label)}${arrow}</a>`
  : `<span class="pending">${icon('clock')} ${pending}</span>`;

const productTabs = data.products.map((p) => `<a href="${safeUrl(p.url)}" class="product-tab ${p.color}" id="tab-${p.id}" data-product="${p.id}"><img src="${safeUrl(p.thumbnail)}" srcset="${safeUrl(p.thumbnail)} 1x, ${safeUrl(p.thumbnail2x)} 2x" width="520" height="290" loading="lazy" alt=""><span class="product-tab-caption">${icon(p.icon)}<span>${escapeHtml(p.name)}<small>${escapeHtml(p.category)}</small></span>${arrow}</span></a>`).join('');
const productOverview = data.products.map((p) => `<article class="suite-overview-card ${p.color}" data-overview-product="${p.id}"><div class="suite-overview-art" aria-hidden="true"><img src="${safeUrl(p.thumbnail)}" srcset="${safeUrl(p.thumbnail)} 1x, ${safeUrl(p.thumbnail2x)} 2x" width="520" height="290" loading="lazy" decoding="async" alt=""></div><div class="suite-overview-card-content"><span class="suite-overview-icon">${icon(p.icon)}</span><p class="suite-overview-category">${escapeHtml(p.category)}</p><h3>${escapeHtml(p.name)}</h3><p class="suite-overview-lead">${escapeHtml(p.headline)}</p><ul class="suite-overview-chips">${p.features.map(f => `<li>${escapeHtml(f)}</li>`).join('')}</ul>${productPreview(p.id)}${destination(p.url, p.action, 'suite-overview-link', 'Destination link pending')}</div></article>`).join('');
const communityTabs='';
const communityPanels = data.community.map(g=>`<section class="channel-group" aria-labelledby="community-${g.id}"><div class="channel-group-label"><h3 id="community-${g.id}">${escapeHtml(g.name)}</h3><span>0${data.community.indexOf(g)+1}</span></div><ul class="channel-grid">${g.platforms.map(p=>{const active=p.confirmed&&p.enabled&&p.url;const body=`${p.icon?`<img src="/assets/platforms/${p.icon}.svg" width="24" height="24" alt="" loading="lazy">`:'<span class="channel-text-mark" aria-hidden="true">·</span>'}<span>${escapeHtml(p.name)}</span>${!active?'<span class="sr-only"> — planned, not linked</span>':arrow}`;return `<li data-status="${active?'available':'planned'}">${active?`<a href="${safeUrl(p.url)}"${external(p.url)}>${body}</a>`:`<span class="platform-unavailable">${body}</span>`}</li>`;}).join('')}</ul></section>`).join('');
const communityCount=confirmedDestinations(data.community).length;
const communityLegend=communityCount?`${communityCount} confirmed community destinations. Muted entries are planned.`:'Our community channels are taking shape. Muted entries are planned and not yet linked.';
const contacts=data.contact.map(c=>c.url?`<a href="${safeUrl(c.url)}">${escapeHtml(c.name)}${arrow}</a>`:`<span>${escapeHtml(c.name)} <small>Link pending</small></span>`).join('');
const footerProducts = data.products.map(p => `<li>${p.url ? `<a href="${safeUrl(p.url)}">${escapeHtml(p.name)}</a>` : `<span>${escapeHtml(p.name)}<small>Link pending</small></span>`}</li>`).join('');
const legal = Object.entries(data.legal).map(([key, url]) => url ? `<a href="${safeUrl(url)}">${key === 'privacy' ? 'Privacy' : 'Terms'}</a>` : `<span>${key === 'privacy' ? 'Privacy' : 'Terms'} <small>(soon)</small></span>`).join('');
const newsletter = data.newsletter.url ? `<a class="button button-primary" href="${safeUrl(data.newsletter.url)}"${external(data.newsletter.url)}>Join the MarketDeck Brief${arrow}</a>` : `<span class="coming-soon-pill">${icon('clock')} The Brief is coming soon</span>`;
const newsletterNote = data.newsletter.url ? '<span>Research and learning, delivered thoughtfully.</span>' : '<span>No subscriptions are being collected yet.</span>';
const schema = homepageIdentityGraph();
const companionSection = readFileSync(new URL('../src/companion-section.html', import.meta.url), 'utf8');
let html = readFileSync(new URL('../src/index.template.html', import.meta.url), 'utf8');
html=buildEditorial({data,template:html,root:output,review});
for (const [key, value] of Object.entries({ LENS_PANEL: readFileSync('src/lens-panel.html', 'utf8'), PRODUCT_TABS: productTabs, PRODUCT_OVERVIEW: productOverview, COMPANION_SECTION: companionSection, COMMUNITY_TABS: communityTabs, COMMUNITY_PANELS: communityPanels, COMMUNITY_LEGEND: communityLegend, CONTACTS: contacts, FOOTER_PRODUCTS: footerProducts, LEGAL: legal, NEWSLETTER: newsletter, NEWSLETTER_NOTE: newsletterNote, SCHEMA: JSON.stringify(schema).replace(/</g, '\\u003c') })) html = html.replaceAll(`{{${key}}}`, value);
if (/\{\{\w+\}\}/.test(html)) throw new Error('Unresolved template token');
writeFileSync(resolve(output,'index.html'), html);

function rewriteHtmlTree(root, transform) {
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = resolve(root, entry.name);
    if (entry.isDirectory()) {
      rewriteHtmlTree(path, transform);
      continue;
    }
    if (!entry.isFile() || !entry.name.endsWith('.html')) continue;
    const before = readFileSync(path, 'utf8');
    const after = transform(before);
    if (after !== before) writeFileSync(path, after);
  }
}

rewriteHtmlTree(output, review ? stripAnalytics : injectAnalytics);
rewriteHtmlTree(output, page => page.includes('/assets/lens.js') ? page : page.replace('</body>', '<link rel="stylesheet" href="/lens.css?v=20261004-suite1"><script type="module" src="/assets/lens.js?v=20261004-suite1"></script></body>'));
console.log(`Built ${output} (${review?'local editorial review':'production; drafts excluded'})`);
