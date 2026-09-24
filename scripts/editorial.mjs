import {buildArticles} from './articles.mjs';
import {catalog,shelf,hub,libraryPage,archivePage,learningHub,LEARNING_HUBS} from './intelligence.mjs';
import {readFileSync,writeFileSync,mkdirSync,copyFileSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {assertNoOrphanedEditorialOutput,isEditorialPublished,loadEditorialSources,validateIssueCandidate} from './editorial-registry.mjs';
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const isPublished=isEditorialPublished;
const refText=v=>esc(v).replace(/\[(S\d+)\]/g,'<a href="#$1">[$1]</a>');
export function writeEditorialSitemap({root,urls,origin,owner=process.env.MARKETDECK_SITEMAP_OWNER??'legacy'}){
  if(!['legacy','publisher'].includes(owner))throw new Error('invalid_sitemap_owner');
  if(owner==='publisher')return false;
  writeFileSync(resolve(root,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(u=>`<url><loc>${new URL(u,origin).href}</loc></url>`).join('')}</urlset>`);
  return true;
}
export function buildEditorial({data,template,root,review}) {
  const sitemapOwner=process.env.MARKETDECK_SITEMAP_OWNER??'legacy';
  if(!['legacy','publisher'].includes(sitemapOwner))throw new Error('invalid_sitemap_owner');
  const sources=loadEditorialSources({manifestPath:data.editorial.manifest});
  const manifest=sources.manifest;
  const urls=['/','/intelligence/','/intelligence/library/','/intelligence/issues/','/credits/'];
  if(!review)assertNoOrphanedEditorialOutput({root,sources});
  const page=(title,summary,path,body,draft=false)=>`<!doctype html><html lang="en-IN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} | MarketDeck Intelligence</title><meta name="description" content="${esc(summary)}">${draft||review?'<meta name="robots" content="noindex, nofollow">':`<link rel="canonical" href="${esc(new URL(path,data.brand.url).href)}">`}<link rel="icon" href="/assets/favicon.svg"><link rel="stylesheet" href="/home.css"><link rel="stylesheet" href="/reading.css"></head><body><a class="skip-link" href="#reading">Skip to reading</a><header class="reading-header"><a class="brand" href="/">MarketDeck<span class="brand-period">.</span></a><nav aria-label="Reading navigation"><a href="/intelligence/">Intelligence</a><a href="/intelligence/library/">Library</a><a href="/intelligence/issues/">Magazine archive</a><a href="/#products">The suite</a></nav></header><main id="reading" class="reading-main">${draft?'<p class="draft-banner">EDITORIAL DRAFT · Local owner review · Not published</p>':''}${body}</main><footer class="reading-footer">MarketDeck · Research and education. Not investment advice.<a href="/">Return to MarketDeck</a></footer></body></html>`;
  function write(path,html){const f=resolve(root,`.${path}index.html`);mkdirSync(dirname(f),{recursive:true});writeFileSync(f,html);}
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
    const {source}=validateIssueCandidate(issue);
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
  writeEditorialSitemap({root,urls,origin:data.brand.url,owner:sitemapOwner});
  const brief=shelf(collection);
  template=template.replace(/    <section class="brief-section"[\s\S]*?<\/section>/,`<section class="brief-section"><div class="container">${brief}${data.newsletter.url?`<p class="newsletter-note"><a href="${esc(data.newsletter.url)}">Newsletter updates →</a></p>`:''}</div></section>`);
  template=template.replace('</head>','<link rel="stylesheet" href="/intelligence-shelf-v2.css"><script src="/intelligence-shelf-v2.js" defer></script></head>');
  template=template.replace(/  <dialog class="article-dialog"[\s\S]*?<\/dialog>/,'');
  if(review)template=template.replace('<meta name="theme-color"','<meta name="robots" content="noindex, nofollow"><meta name="theme-color"');
  return template;
}
