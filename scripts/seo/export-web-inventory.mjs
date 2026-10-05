#!/usr/bin/env node
import {createHash,randomUUID} from 'node:crypto';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {canonicalJsonBytes} from './inventory-protocol.mjs';
import {failedWebInventory,produceWebInventory} from './web-inventory.mjs';

function args(argv){
  const out={};for(let i=0;i<argv.length;i++){if(!argv[i].startsWith('--'))throw new Error('invalid_argument');const key=argv[i].slice(2);if(i+1>=argv.length||argv[i+1].startsWith('--'))throw new Error('missing_argument_value');out[key]=argv[++i];}return out;
}

function fallbackRevision(){
  const h=createHash('sha256');
  for(const path of ['content/briefs.json','content/articles/metadata.json','scripts/intelligence.mjs'])h.update(path).update('\0').update(readFileSync(path)).update('\0');
  return 'sha256:'+h.digest('hex');
}

export function sourceRevision(explicit){
  const git=spawnSync('git',['rev-parse','HEAD'],{encoding:'utf8'});
  const actual=git.status===0?git.stdout.trim():fallbackRevision();
  if(explicit&&explicit!==actual)throw new Error('source_revision_conflict');
  return actual;
}

export function run(argv=process.argv.slice(2)){
  const options=args(argv),output=options.output;
  if(!output)throw new Error('missing_output');
  const generatedAt=options['generated-at']??new Date().toISOString().replace(/\.\d{3}Z$/,'Z');
  const runId=options['run-id']??randomUUID();
  const revision=sourceRevision(options['source-revision']);
  let inventory;
  try{inventory=produceWebInventory({runId,generatedAt,environment:options.environment??'production',sourceRevision:revision});}
  catch(error){
    const code=/^[a-z0-9_]+$/.test(error?.message??'')?error.message:'source_invalid';
    inventory=failedWebInventory({runId,generatedAt,environment:options.environment??'production',sourceRevision:revision,code});
  }
  const target=resolve(output);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,Buffer.concat([canonicalJsonBytes(inventory),Buffer.from('\n')]));
  return inventory;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  try{const result=run();if(result.enumeration_status!=='complete')process.exitCode=2;}
  catch(error){console.error(/^[a-z0-9_]+$/.test(error?.message??'')?error.message:'export_failed');process.exitCode=1;}
}
