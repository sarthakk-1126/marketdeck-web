import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync,statSync} from 'node:fs';
import {
  MARKETDECK,
  canonicalUrl,
  compactOrganization,
  homepageIdentityGraph,
  organizationNode,
  webPageNode,
  websiteNode,
} from '../scripts/structured-identity.mjs';

const FORBIDDEN_KEYS=new Set(['aggregateRating','review','founder','employee','numberOfEmployees','telephone','address','offers','price','award','sameAs']);
const FORBIDDEN_TYPES=new Set(['SearchAction','SoftwareApplication','Dataset','FAQPage','FinancialProduct','Product','Offer','AggregateRating','Review','Person','Corporation']);

function walk(value,visit){
  if(Array.isArray(value)){for(const item of value)walk(item,visit);return;}
  if(!value||typeof value!=='object')return;
  visit(value);
  for(const child of Object.values(value))walk(child,visit);
}

test('identity helper emits one stable, canonical and truthful homepage graph',()=>{
  const graph=homepageIdentityGraph(),organization=organizationNode(),website=websiteNode();
  assert.deepEqual(graph['@graph'],[organization,website]);
  assert.equal(organization['@id'],MARKETDECK.organizationId);
  assert.equal(website['@id'],MARKETDECK.websiteId);
  assert.deepEqual(website.publisher,{'@id':MARKETDECK.organizationId});
  assert.equal(organization.logo['@id'],MARKETDECK.logoId);
  assert.equal(organization.logo.url,MARKETDECK.logoUrl);
  assert.equal(organization.logo.contentUrl,MARKETDECK.logoUrl);
  assert.equal(organization.logo.width,2048);
  assert.equal(organization.logo.height,2048);
  assert.ok(existsSync('public/assets/marketdeck-logo.png'));
  assert.ok(statSync('public/assets/marketdeck-logo.png').size>100000);
  assert.equal(organization.publishingPrinciples,'https://marketdeck.in/research-standards/');
});

test('article publisher is self-describing while references use the same identity',()=>{
  const organization=compactOrganization(),page=webPageNode('https://marketdeck.in/intelligence/notes/example/');
  assert.equal(organization['@type'],'Organization');
  assert.equal(organization['@id'],MARKETDECK.organizationId);
  assert.equal(organization.name,MARKETDECK.name);
  assert.equal(organization.url,MARKETDECK.url);
  assert.equal(organization.logo['@id'],MARKETDECK.logoId);
  assert.deepEqual(page.isPartOf,{'@id':MARKETDECK.websiteId});
});

test('canonical identity URLs cannot become environment dependent',()=>{
  assert.equal(canonicalUrl('/intelligence/'),'https://marketdeck.in/intelligence/');
  for(const value of ['http://localhost/','https://marketdeck.in/x/','//internal/x','/x','/x/../y/','/x/?redirect=https://bad'])assert.throws(()=>canonicalUrl(value));
});

test('all generated JSON-LD stays focused and contains no prohibited authority claims',()=>{
  const pages=[];
  const samples=['public/index.html','public/intelligence/index.html','public/intelligence/equities/index.html','public/intelligence/notes/read-nse-company-announcements-results/index.html'];
  for(const file of samples){
    const html=readFileSync(file,'utf8');
    for(const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g))pages.push({file,data:JSON.parse(match[1])});
  }
  assert.equal(pages.length,samples.length);
  for(const {file,data} of pages){
    walk(data,node=>{
      for(const key of Object.keys(node))assert.ok(!FORBIDDEN_KEYS.has(key),`${file}: forbidden ${key}`);
      const types=Array.isArray(node['@type'])?node['@type']:[node['@type']];
      for(const type of types.filter(Boolean))assert.ok(!FORBIDDEN_TYPES.has(type),`${file}: forbidden ${type}`);
      for(const [key,value] of Object.entries(node))if(['@id','url','contentUrl','item','image','publishingPrinciples'].includes(key)&&typeof value==='string'&&value.startsWith('http'))assert.ok(value.startsWith(MARKETDECK.origin+'/'),`${file}: noncanonical ${value}`);
      if(node['@type']==='Organization')assert.equal(node['@id'],MARKETDECK.organizationId,`${file}: anonymous organization`);
    });
  }
});
