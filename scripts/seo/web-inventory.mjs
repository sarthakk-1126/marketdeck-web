import {existsSync,readFileSync} from 'node:fs';
import {catalog,learningHub,LEARNING_HUBS} from '../intelligence.mjs';
import {articleUrl,parseArticle} from '../articles.mjs';
import {approvedArticleSlugs,isEditorialPublished,loadEditorialSources,strictDate,validateArticleCandidate,validateIssueCandidate} from '../editorial-registry.mjs';
import {assertUtcTimestamp,finalizeInventory} from './inventory-protocol.mjs';

export const ORIGIN='https://marketdeck.in';
export const PRODUCER='marketdeck-web';
export const GENERATOR_VERSION='seo-008f-web-inventory-v1';

const observations=()=>({
  sitemap_membership:'unknown',
  internal_inbound_link:{state:'unknown',source_url:null,discovery_source:null},
  deployed_sha:null,
  last_verified_at:null,
  google_inspection_state:'not_checked',
  google_inspection_date:null,
  next_action:'Verify the deployed revision, anonymous HTML and discovery evidence.',
  owner:'MarketDeck web/editorial',
});

function record({path=null,route,family,id=null,classification='A',eligible=true,reason,source,updated=null,canonical=undefined,expected=undefined,indexing=undefined,robots=undefined,status=undefined,nextAction=undefined}){
  const url=path===null?null:new URL(path,ORIGIN).href;
  return {
    canonical_url:canonical===undefined?url:canonical,
    repository:PRODUCER,
    route_name:route,
    page_family:family,
    public_record_identifier:id,
    classification,
    intended_indexing_policy:indexing??(eligible?'index':classification==='B'?'non_html':classification==='F'?'pending_repair':'noindex'),
    policy_reason:reason,
    enumeration_source:source,
    content_eligibility_status:status??(eligible?'eligible':classification==='F'?'pending':'not_applicable'),
    eligibility_reason:reason,
    expected_http_status:expected??(eligible?200:classification==='B'?200:404),
    robots_policy:robots??(eligible?'index_follow':classification==='B'?'non_html':'noindex_follow'),
    declared_canonical:eligible?url:(classification==='B'?canonical??url:null),
    sitemap_eligible:eligible,
    content_updated_at:updated,
    ...observations(),
    ...(nextAction?{next_action:nextAction}:{}),
  };
}

const singletonDefinitions=[
  ['/', 'web:home','WEB-01 platform_home'],
  ['/credits/','web:credits','WEB-02 credits'],
  ['/research-standards/','web:research_standards','WEB-03 research_standards'],
  ['/intelligence/','intelligence:home','INT-01 intelligence_home'],
  ['/intelligence/issues/','intelligence:issues','INT-02 issue_archive'],
  ['/intelligence/editorial-policy/','intelligence:editorial_policy','INT-05 editorial_policy'],
  ['/intelligence/library/','intelligence:library','INT-09 intelligence_library'],
];

function noteSummary(article,validated){
  return {slug:article.slug,path:validated.path,title:article.title,summary:article.description,body:validated.md,topics:article.topics,primaryHub:article.primaryHub,tool:article.tool};
}

export function produceWebInventory({
  runId,
  generatedAt,
  environment='production',
  sourceRevision,
  manifestPath='content/briefs.json',
  metadataPath='content/articles/metadata.json',
}={}){
  if(typeof runId!=='string'||!runId.trim())throw new Error('invalid_run_id');
  assertUtcTimestamp(generatedAt);
  if(!/^(?:[a-f0-9]{40}|sha256:[a-f0-9]{64})$/.test(sourceRevision??''))throw new Error('invalid_source_revision');
  if(!['test','local','review','staging','production'].includes(environment))throw new Error('invalid_environment');

  const sources=loadEditorialSources({manifestPath,metadataPath});
  const approved=approvedArticleSlugs(sources);
  const records=singletonDefinitions.map(([path,route,family])=>record({path,route,family,reason:'Explicit source-approved singleton.',source:{owner:'marketdeck-web',registry:route}}));
  const noteItems=[];

  for(const slug of [...sources.manifestNotes.keys()].sort()){
    const manifestNote=sources.manifestNotes.get(slug),article=sources.articleMetadata.get(slug);
    if(approved.has(slug)){
      const validated=validateArticleCandidate(article,manifestNote);
      article.sources.forEach(source=>articleUrl(source.url));
      if(article.tool)articleUrl(article.tool.url);
      parseArticle(validated.md,article,'');
      if(article.primaryHub&&(!LEARNING_HUBS[article.primaryHub.slug]||!article.topics.includes(LEARNING_HUBS[article.primaryHub.slug].topic)))throw new Error('invalid_primary_learning_hub');
      if(!Array.isArray(article.related)||article.related.some(related=>!sources.articleMetadata.has(related)))throw new Error('invalid_related_article');
      noteItems.push(noteSummary(article,validated));
      records.push(record({path:validated.path,route:'intelligence:note',family:'INT-03 authored_note',id:slug,updated:strictDate(article.modifiedAt,'invalid_article_modified_at'),reason:'Both publication registries and the substantive source gate pass.',source:{manifest:manifestPath,metadata:metadataPath,source:article.source}}));
    }else{
      records.push(record({path:`/intelligence/notes/${slug}/`,route:'intelligence:note_pending',family:'INT-03 authored_note',id:slug,classification:'F',eligible:false,reason:'Authored note is intentionally unpublished or unapproved.',source:{manifest:manifestPath,metadata:metadataPath},nextAction:'Complete both owner publication approvals before public admission.'}));
    }
  }

  for(const issue of sources.issues.values()){
    const published=isEditorialPublished(issue);
    const validated=validateIssueCandidate(issue,{requireAssets:published});
    const issuePath=validated.path;
    records.push(record({path:issuePath,route:published?'intelligence:issue':'intelligence:issue_pending',family:'INT-04 html_issue',id:issue.id??issue.slug,classification:published?'A':'F',eligible:published,updated:published&&issue.lastUpdated?strictDate(issue.lastUpdated,'invalid_issue_last_updated'):null,reason:published?'Manifest publication gate and complete issue source/assets pass.':'Issue is draft or lacks owner approval.',source:{manifest:manifestPath,source:issue.source,assets:issue.assets},nextAction:published?undefined:'Owner approval is required before public admission.'}));
    if(issue.pdfPath){
      records.push(record({path:null,canonical:published?new URL(issuePath,ORIGIN).href:null,route:published?'intelligence:issue_pdf':'intelligence:draft_pdf',family:published?'INT-06 companion_pdf':'INT-07 draft_review_representation',id:`${issue.id??issue.slug}:pdf`,classification:published?'B':'D',eligible:false,reason:published?'Companion PDF is a non-sitemap representation of the HTML issue.':'Draft/review representation is not production acquisition content.',source:{manifest:manifestPath,representation:issue.pdfPath},expected:published?200:404,indexing:published?'non_html':'noindex',robots:published?'non_html':'noindex_nofollow',status:'not_applicable',nextAction:published?'Verify the later HTTP Link canonical lifecycle independently.':'Keep the review representation outside deployment output.'}));
    }
  }

  const collection=catalog(sources.manifest,noteItems,{read:path=>JSON.parse(readFileSync(path,'utf8')),exists:path=>existsSync('public'+path)});
  for(const slug of Object.keys(LEARNING_HUBS)){
    learningHub(collection,slug);
    records.push(record({path:`/intelligence/${slug}/`,route:'intelligence:learning_hub',family:'INT-08 learning_hub',id:slug,reason:'Finite registry identity passes the generator substantive hub gate.',source:{registry:'scripts/intelligence.mjs::LEARNING_HUBS',key:slug}}));
  }

  return finalizeInventory({
    schema_version:'1.0.0',run_id:runId,generated_at:generatedAt,generator_version:GENERATOR_VERSION,
    environment,preferred_origin:ORIGIN,producer:PRODUCER,source_revision:sourceRevision,
    source_snapshots:[{name:'content/briefs.json',version:sourceRevision},{name:'content/articles/metadata.json',version:sourceRevision},{name:'scripts/intelligence.mjs::LEARNING_HUBS',version:sourceRevision}],
    enumeration_status:'complete',enumeration_errors:[],record_count:0,records_sha256:'',records,
  });
}

export function failedWebInventory({runId,generatedAt,environment='production',sourceRevision,code='source_invalid',family='WEB'}={}){
  return finalizeInventory({
    schema_version:'1.0.0',run_id:runId,generated_at:generatedAt,generator_version:GENERATOR_VERSION,
    environment,preferred_origin:ORIGIN,producer:PRODUCER,source_revision:sourceRevision,
    source_snapshots:[{name:'marketdeck-web',version:sourceRevision}],enumeration_status:'failed',
    enumeration_errors:[{family,code}],record_count:0,records_sha256:'',records:[],
  });
}
