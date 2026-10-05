import {createHash} from 'node:crypto';

export const MAX_SAFE_INTEGER=Number.MAX_SAFE_INTEGER;

export class ProtocolError extends Error {
  constructor(code){super(code);this.name='ProtocolError';}
}

function fail(code){throw new ProtocolError(code);}

export function checkJson(value){
  if(value===null||typeof value==='boolean'||typeof value==='string'){
    if(typeof value==='string')for(let i=0;i<value.length;i++){
      const n=value.charCodeAt(i);
      if(n>=0xd800&&n<=0xdbff){const next=value.charCodeAt(++i);if(!(next>=0xdc00&&next<=0xdfff))fail('invalid_unicode');}
      else if(n>=0xdc00&&n<=0xdfff)fail('invalid_unicode');
    }
    return;
  }
  if(typeof value==='number'){
    if(!Number.isInteger(value))fail('unsupported_json_type');
    if(!Number.isSafeInteger(value))fail('integer_out_of_range');
    return;
  }
  if(Array.isArray(value)){for(const item of value)checkJson(item);return;}
  if(typeof value==='object'){
    for(const [key,item] of Object.entries(value)){
      if(!/^[\x00-\x7f]*$/.test(key))fail('non_ascii_object_key');
      checkJson(item);
    }
    return;
  }
  fail('unsupported_json_type');
}

function serialize(value){
  if(value===null)return 'null';
  if(typeof value==='boolean'||typeof value==='number')return String(value);
  if(typeof value==='string')return JSON.stringify(value);
  if(Array.isArray(value))return `[${value.map(serialize).join(',')}]`;
  return `{${Object.keys(value).sort().map(k=>`${JSON.stringify(k)}:${serialize(value[k])}`).join(',')}}`;
}

export function canonicalJsonBytes(value){checkJson(value);return Buffer.from(serialize(value),'utf8');}
export const sha256=value=>createHash('sha256').update(value).digest('hex');
export const recordsDigest=records=>sha256(canonicalJsonBytes(records));

function compareCodePoints(a,b){
  const aa=[...a].map(c=>c.codePointAt(0)),bb=[...b].map(c=>c.codePointAt(0));
  for(let i=0;i<Math.min(aa.length,bb.length);i++)if(aa[i]!==bb[i])return aa[i]-bb[i];
  return aa.length-bb.length;
}

export function recordOrderKey(record){
  if(!record||typeof record!=='object'||Array.isArray(record))fail('record_not_object');
  const {canonical_url:url,repository:repo,route_name:route,public_record_identifier:identity}=record;
  if(url!==null&&(typeof url!=='string'||!url)||typeof repo!=='string'||!repo||typeof route!=='string'||!route||identity!==null&&(typeof identity!=='string'||!identity) )fail('invalid_record_identity');
  return [url===null,url??'',repo,route,identity!==null,identity??''];
}

function compareKeys(a,b){
  for(let i=0;i<a.length;i++){
    if(typeof a[i]==='boolean'){if(a[i]!==b[i])return a[i]?1:-1;}
    else {const d=compareCodePoints(a[i],b[i]);if(d)return d;}
  }
  return 0;
}

export function validateIntegrity(envelope){
  if(!envelope||typeof envelope!=='object'||!Array.isArray(envelope.records))fail('invalid_envelope');
  checkJson(envelope);
  const keys=envelope.records.map(recordOrderKey);
  for(let i=1;i<keys.length;i++){
    const order=compareKeys(keys[i-1],keys[i]);
    if(order>0)fail('records_not_sorted');
    if(order===0)fail('duplicate_record_identity');
  }
  if(!Number.isInteger(envelope.record_count)||envelope.record_count!==envelope.records.length)fail('record_count_mismatch');
  if(envelope.records_sha256!==recordsDigest(envelope.records))fail('records_digest_mismatch');
  if(envelope.enumeration_status==='complete'){if(!Array.isArray(envelope.enumeration_errors)||envelope.enumeration_errors.length)fail('complete_with_errors');}
  else if(envelope.enumeration_status==='failed'){if(envelope.records.length||!Array.isArray(envelope.enumeration_errors)||!envelope.enumeration_errors.length)fail('invalid_failed_generation');}
  else fail('invalid_enumeration_status');
  const admitted=new Set();
  for(const record of envelope.records){
    if(record.repository!==envelope.producer)fail('record_owner_mismatch');
    if(record.sitemap_eligible===true){
      const url=record.canonical_url;
      if(!url||record.classification!=='A'||record.content_eligibility_status!=='eligible'||record.intended_indexing_policy!=='index'||record.robots_policy!=='index_follow'||record.expected_http_status!==200)fail('inconsistent_eligible_record');
      if(record.declared_canonical!==url)fail('canonical_mismatch');
      if(admitted.has(url))fail('duplicate_eligible_canonical');
      admitted.add(url);
    }
  }
}

export function finalizeInventory(envelope){
  if(!envelope||typeof envelope!=='object'||!Array.isArray(envelope.records))fail('invalid_envelope');
  const result=structuredClone(envelope);
  result.records.sort((a,b)=>compareKeys(recordOrderKey(a),recordOrderKey(b)));
  result.record_count=result.records.length;
  result.records_sha256=recordsDigest(result.records);
  validateIntegrity(result);
  return result;
}

// A small strict parser is kept here because JSON.parse silently accepts duplicate keys.
export function parseJsonValueStrict(text,{protocol=true}={}){
  if(typeof text!=='string')fail('invalid_json');
  let at=0;
  const ws=()=>{while(/[\x20\t\r\n]/.test(text[at]??''))at++;};
  const value=()=>{
    ws();const c=text[at];
    if(c==='"')return string();
    if(c==='{')return object();
    if(c==='[')return array();
    for(const [literal,result] of [['true',true],['false',false],['null',null]])if(text.startsWith(literal,at)){at+=literal.length;return result;}
    if(text.startsWith('NaN',at)||text.startsWith('Infinity',at)||text.startsWith('-Infinity',at))fail('nonfinite_json_number');
    const match=text.slice(at).match(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/);
    if(match){at+=match[0].length;const number=Number(match[0]);if(!Number.isFinite(number))fail('nonfinite_json_number');if(protocol&&!Number.isInteger(number))fail('unsupported_json_type');if(protocol&&!Number.isSafeInteger(number))fail('integer_out_of_range');return number;}
    fail('invalid_json');
  };
  const string=()=>{
    const start=at++;
    while(at<text.length){
      if(text[at]==='"'){at++;try{return JSON.parse(text.slice(start,at));}catch{fail('invalid_json');}}
      if(text[at]==='\\'){at+=2;}else at++;
    }
    fail('invalid_json');
  };
  const array=()=>{
    const out=[];at++;ws();if(text[at]===']'){at++;return out;}
    while(true){out.push(value());ws();if(text[at]===']'){at++;return out;}if(text[at++]!==',')fail('invalid_json');}
  };
  const object=()=>{
    const out=Object.create(null);at++;ws();if(text[at]==='}'){at++;return out;}
    while(true){ws();if(text[at]!=='"')fail('invalid_json');const key=string();if(Object.hasOwn(out,key))fail('duplicate_json_key');ws();if(text[at++]!==':')fail('invalid_json');out[key]=value();ws();if(text[at]==='}'){at++;return out;}if(text[at++]!==',')fail('invalid_json');}
  };
  let result;try{result=value();ws();if(at!==text.length)fail('invalid_json');}catch(error){if(error instanceof ProtocolError)throw error;fail('invalid_json');}
  if(protocol)checkJson(result);return result;
}

export function parseInventoryJson(text){
  const result=parseJsonValueStrict(text);
  if(!result||typeof result!=='object'||Array.isArray(result))fail('envelope_not_object');
  return result;
}

export function assertUtcTimestamp(value){
  if(typeof value!=='string'||!/^(?:\d{4}-\d{2}-\d{2})T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\dZ$/.test(value))fail('invalid_generated_at');
  if(new Date(value).toISOString().replace('.000','')!==value)fail('invalid_generated_at');
  return value;
}
