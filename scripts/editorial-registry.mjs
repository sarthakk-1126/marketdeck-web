import {existsSync,readFileSync,readdirSync} from 'node:fs';
import {basename,resolve} from 'node:path';
import {TOPICS,localPath} from './intelligence.mjs';
import {parseJsonValueStrict} from './seo/inventory-protocol.mjs';

const SLUG=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE=/^\d{4}-\d{2}-\d{2}$/;

export function editorialSlug(value) {
  if(typeof value!=='string'||!SLUG.test(value))throw new Error('invalid_editorial_slug');
  return value;
}

export function strictDate(value,code='invalid_content_date') {
  if(typeof value!=='string'||!DATE.test(value))throw new Error(code);
  const d=new Date(value+'T00:00:00Z');
  if(Number.isNaN(d.valueOf())||d.toISOString().slice(0,10)!==value)throw new Error(code);
  return value;
}

export const isEditorialPublished=value=>value?.publicationStatus==='published'&&typeof value.approvedAt==='string'&&value.approvedAt.trim()!=='';

export function readJsonFile(path) {
  return parseJsonValueStrict(readFileSync(path,'utf8'),{protocol:false});
}

function uniqueBySlug(rows,code) {
  if(!Array.isArray(rows))throw new Error(code);
  const map=new Map();
  for(const row of rows){
    const slug=editorialSlug(row?.slug);
    if(map.has(slug))throw new Error(code);
    map.set(slug,row);
  }
  return map;
}

export function loadEditorialSources({manifestPath='content/briefs.json',metadataPath='content/articles/metadata.json',readJson=readJsonFile}={}) {
  const manifest=readJson(manifestPath),metadata=readJson(metadataPath);
  if(!manifest||typeof manifest!=='object')throw new Error('invalid_editorial_manifest');
  return {
    manifest,
    issues:uniqueBySlug(manifest.issues,'duplicate_issue_slug'),
    manifestNotes:uniqueBySlug(manifest.notes??[],'duplicate_manifest_note_slug'),
    articleMetadata:uniqueBySlug(metadata,'duplicate_article_metadata_slug'),
  };
}

export function validateArticleCandidate(article,manifestNote,{exists=existsSync,readText=path=>readFileSync(path,'utf8'),assetRoot='public'}={}) {
  const slug=editorialSlug(article?.slug);
  if(!manifestNote||editorialSlug(manifestNote.slug)!==slug)throw new Error('article_manifest_mismatch');
  const expected=`content/articles/${slug}.md`;
  if(article.source!==expected||manifestNote.source!==expected)throw new Error('invalid_article_source_path');
  if(!Array.isArray(article.topics)||article.topics.length===0||article.topics.some(t=>!Object.hasOwn(TOPICS,t)))throw new Error('invalid_article_topic');
  if(!Array.isArray(manifestNote.topics)||JSON.stringify(manifestNote.topics)!==JSON.stringify(article.topics))throw new Error('article_topic_drift');
  if(article.coverArt!==manifestNote.coverArt)throw new Error('article_artwork_drift');
  localPath(article.coverArt);
  if(!exists(resolve(assetRoot,'.'+article.coverArt)))throw new Error('missing_article_artwork');
  if(!exists(resolve(article.source)))throw new Error('missing_article_source');
  if(!Array.isArray(article.sources)||new Set(article.sources.map(s=>s?.id)).size!==article.sources.length)throw new Error('duplicate_article_sources');
  const md=readText(article.source),words=md.replace(/\[([^\]]+)\]\([^)]+\)/g,'$1').split(/\s+/).filter(Boolean).length;
  if(words<1500)throw new Error('article_below_approved_depth');
  strictDate(article.modifiedAt,'invalid_article_modified_at');
  return {slug,md,words,path:`/intelligence/notes/${slug}/`};
}

export function validateIssueCandidate(issue,{exists=existsSync,readJson=readJsonFile,requireAssets=true}={}) {
  const slug=editorialSlug(issue?.slug);
  if(typeof issue.source!=='string'||!/^content\/issues\/[a-z0-9]+(?:-[a-z0-9]+)*\.json$/.test(issue.source)||issue.source.includes('..'))throw new Error('invalid_issue_source_path');
  if(typeof issue.assets!=='string'||basename(issue.assets)!==slug)throw new Error('invalid_issue_assets_path');
  localPath(issue.cover);localPath(issue.pdfPath);
  if(!Number.isInteger(issue.pageCount)||issue.pageCount<1)throw new Error('invalid_issue_page_count');
  if(!exists(resolve(issue.source)))throw new Error('missing_issue_source');
  const source=readJson(issue.source);
  if(!source||!Array.isArray(source.pages)||source.pages.length!==issue.pageCount||source.pages.some(p=>!p||typeof p.title!=='string'||typeof p.intro!=='string'||!Array.isArray(p.sections)))throw new Error('invalid_issue_content');
  if(!Array.isArray(source.sources))throw new Error('invalid_issue_sources');
  if(requireAssets){
    const names=new Set([issue.pdfPath,issue.cover,...source.pages.map(p=>p.figure)].filter(Boolean).map(p=>p.split('/').pop()));
    names.add('marketdeck-brief.pdf');
    for(const name of names)if(!exists(resolve(issue.assets,name)))throw new Error('missing_editorial_asset');
  }
  if(issue.lastUpdated!=null)strictDate(issue.lastUpdated,'invalid_issue_last_updated');
  return {slug,source,path:`/intelligence/issues/${slug}/`};
}

export function approvedArticleSlugs(sources) {
  const approved=new Set();
  const all=new Set([...sources.manifestNotes.keys(),...sources.articleMetadata.keys()]);
  for(const slug of all){
    const manifest=sources.manifestNotes.get(slug),metadata=sources.articleMetadata.get(slug);
    if(!manifest||!metadata)throw new Error('article_registry_drift');
    if(isEditorialPublished(manifest)&&isEditorialPublished(metadata))approved.add(slug);
  }
  return approved;
}

function generatedSlugs(root,family) {
  const dir=resolve(root,`intelligence/${family}`);
  if(!existsSync(dir))return [];
  return readdirSync(dir,{withFileTypes:true}).filter(e=>e.isDirectory()&&existsSync(resolve(dir,e.name,'index.html'))).map(e=>e.name);
}

export function assertNoOrphanedEditorialOutput({root,sources}) {
  const issueSlugs=new Set([...sources.issues.values()].filter(isEditorialPublished).map(i=>editorialSlug(i.slug)));
  const noteSlugs=approvedArticleSlugs(sources);
  for(const [family,allowed,code] of [['issues',issueSlugs,'INT-04'],['notes',noteSlugs,'INT-03']]){
    for(const raw of generatedSlugs(root,family)){
      const safe=SLUG.test(raw)?raw:'invalid-slug';
      if(!allowed.has(raw))throw new Error(`orphaned_generated_${code}_${safe}`);
    }
  }
}
