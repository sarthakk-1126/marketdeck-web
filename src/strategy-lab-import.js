// Import is deliberately explicit: no inferred adjustment, licence or calendar.
export const columns = ['date','open','high','low','close','volume','split_ratio','dividend'];
const aliases = {date:['date','timestamp','tradingdate','session'],open:['open','openprice'],high:['high','highprice'],low:['low','lowprice'],close:['close','closeprice'],volume:['volume','vol','totaltradedquantity','tottrdqty'],split_ratio:['splitratio'],dividend:['dividend','cashdividend']};
export function parseCSV(source) {
 if(typeof source!=='string'||source.length>1500000)throw Error('CSV exceeds 1.5 MB.');
 const text=source.replace(/^\uFEFF/,'');
 const first=text.split(/\r?\n/,1)[0],delimiter=first.includes('\t')?'\t':first.includes(';')?';':',';
 let cell='',row=[],quoted=false,closed=false,line=1,start=1;const records=[];
 function endCell(){row.push(cell);cell='';closed=false;}
 function endRow(){endCell();if(row.some(s=>s.trim()!==''))records.push({cells:row,line:start});row=[];start=line+1;}
 for(let i=0;i<text.length;i++){
  const c=text[i];
  if(quoted){if(c==='"'){if(text[i+1]==='"'){cell+='"';i++;}else{quoted=false;closed=true;}}else{cell+=c;if(c==='\n')line++;}continue;}
  if(c==='"'){if(cell||closed)throw Error(`Row ${line}: quote must begin a field.`);quoted=true;}
  else if(c===delimiter)endCell();
  else if(c==='\r'||c==='\n'){if(c==='\r'&&text[i+1]==='\n')i++;endRow();line++;}
  else {if(closed&&!/\s/.test(c))throw Error(`Row ${line}: unexpected text after a quoted field.`);if(!closed)cell+=c;}
 }
 if(quoted)throw Error(`Row ${start}: unclosed quoted field.`);
 if(cell||row.length)endRow();
 const headers=records.shift()?.cells.map(s=>s.trim());
 if(!headers?.length||records.length<2||records.length>5000)throw Error('Provide a header and 2–5,000 supplied sessions.');
 if(new Set(headers.map(s=>s.toLowerCase())).size!==headers.length||headers.some(s=>!s))throw Error('Column names must be non-empty and unique.');
 for(const r of records)if(r.cells.length!==headers.length)throw Error(`Row ${r.line}: expected ${headers.length} columns; received ${r.cells.length}.`);
 const normalized=headers.map(s=>s.toLowerCase().replace(/[^a-z0-9]/g,'')),mapping={};
 for(const key of columns){const found=normalized.flatMap((s,i)=>aliases[key].includes(s)?[i]:[]);mapping[key]=found.length===1?found[0]:-1;}
 const symbolIndex=normalized.findIndex(s=>['symbol','ticker','tradingsymbol'].includes(s));
 return {headers,records,mapping,symbolIndex};
}
export function sessionDate(value,format='iso') {
 const v=value.trim();let y,m,d;
 if(format==='iso'){if(!/^\d{4}-\d{2}-\d{2}$/.test(v))throw Error('Use YYYY-MM-DD dates, or select the matching date format.');[y,m,d]=v.split('-').map(Number);}
 else if(format==='dmy'){if(!/^\d{2}[/-]\d{2}[/-]\d{4}$/.test(v))throw Error('Use DD/MM/YYYY or DD-MM-YYYY.');[d,m,y]=v.split(/[/-]/).map(Number);}
 else if(format==='month'){const a=/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/.exec(v);if(!a)throw Error('Use DD-Mon-YYYY.');d=Number(a[1]);m=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'].indexOf(a[2].toLowerCase())+1;y=Number(a[3]);}
 else throw Error('Select a supported date format.');
 const date=new Date(Date.UTC(y,m-1,d));if(y<1900||date.getUTCFullYear()!==y||date.getUTCMonth()!==m-1||date.getUTCDate()!==d)throw Error('Invalid calendar date.');
 return date.toISOString().slice(0,10);
}
export function csvBars(parsed,mapping,format='iso',symbol=null) {
 for(const key of ['date','open','high','low','close'])if(!(mapping[key]>=0))throw Error(`Map the ${key} column.`);
 const chosen=columns.filter(k=>mapping[k]>=0).map(k=>mapping[k]);if(new Set(chosen).size!==chosen.length)throw Error('Use a different column for each field.');
 let previous='';return parsed.records.map(r=>{
  try{
   if(symbol&&parsed.symbolIndex>=0){const ticker=r.cells[parsed.symbolIndex].trim().toUpperCase();if(ticker!==symbol.toUpperCase()&&ticker!==symbol.toUpperCase().replace(/\.NS$/,''))throw Error(`Symbol ${ticker||'(blank)'} does not match selected company ${symbol}.`);}
   const bar={date:sessionDate(r.cells[mapping.date],format)};
   if(bar.date<=previous)throw Error('Dates must increase without duplicates; sort your source file first.');previous=bar.date;
   for(const key of columns.slice(1)){
    const s=mapping[key]>=0?r.cells[mapping[key]].trim():'';
    if(!s||/^(null|na|n\/a)$/i.test(s)){bar[key]=key==='split_ratio'?1:key==='dividend'?0:null;continue;}
    if(!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(s))throw Error(`${key}: use an unformatted finite number or a blank observation.`);
    const v=Number(s),lo=key==='volume'||key==='dividend'?0:key==='split_ratio'?.001:.000000001,hi=key==='split_ratio'?1000:key==='dividend'?1e9:1e15;
    if(!Number.isFinite(v)||v<lo||v>hi)throw Error(`${key}: value must be between ${lo} and ${hi}.`);bar[key]=v;
   }
   if(bar.high!==null&&bar.low!==null&&bar.high<bar.low)throw Error('High must be at least low.');
   if([bar.open,bar.close].some(v=>v!==null&&((bar.high!==null&&v>bar.high)||(bar.low!==null&&v<bar.low))))throw Error('Open and close must lie within high and low.');
   return bar;
  }catch(e){throw Error(`Row ${r.line}: ${e.message}`);}
 });
}
export function csvEnvelope(bars,{symbol,source,basis,completed_through,actions,confirmed}) {
 if(!source?.trim())throw Error('Name the source and export you are authorised to use.');
 if(!['raw','split_adjusted','total_return_adjusted'].includes(basis))throw Error('Choose the price adjustment basis.');
 if(!confirmed)throw Error('Confirm private-use permission and the complete source session inventory.');
 if(!['none','columns','adjusted'].includes(actions))throw Error('Declare how corporate actions are covered.');
 if(basis==='raw'&&actions==='adjusted'||basis!=='raw'&&actions!=='adjusted')throw Error('Action treatment must match the price basis.');
 if(actions!=='columns'&&bars.some(b=>b.split_ratio!==1||b.dividend!==0))throw Error('Action columns contain events; use raw prices and “Events in CSV”.');
 const cutoff=sessionDate(completed_through);if(bars.some(b=>b.date>cutoff))throw Error('The completed cutoff precedes a supplied session.');
 return {schema:1,symbol,source:source.trim(),basis,timezone:'Asia/Kolkata',timeframe:'1d',completed_through:cutoff,display_permission:'owner_private',actions_complete:true,sessions:bars.map(b=>b.date),bars};
}
