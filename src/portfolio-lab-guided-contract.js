// Presentation adapter only. The Django Portfolio service validates and calculates every result.
export function guidedProjectionInputs({monthly,inflation,years,rate},assetIds){
 const number=(value,label,low,high)=>{
  if(typeof value!=='string'||!value.trim()||!Number.isFinite(Number(value))||Number(value)<low||Number(value)>high)
   throw new Error(`${label} must be between ${low} and ${high}.`);
  return value;
 };
 number(monthly,'Monthly addition',0,1000000);
 number(inflation,'Inflation assumption',0,20);
 number(rate,'Annual return assumption',-100,100);
 const count=Number(years);
 if(typeof years!=='string'||!years.trim()||!Number.isInteger(count)||count<1||count>30)
  throw new Error('Choose 1 to 30 whole years.');
 if(!Array.isArray(assetIds)||!assetIds.length||new Set(assetIds).size!==assetIds.length)
  throw new Error('Choose a valid starting basket.');
 return {years:count,monthly,inflation_pct:inflation,rates:Object.fromEntries(assetIds.map(id=>[id,rate]))};
}
