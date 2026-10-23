/* PriceMatch Pro · automatic variants detector · isolated from official Sell Like Clone */
(function(root){
'use strict';
const clean=x=>String(x==null?'':x).replace(/\s+/g,' ').trim();
const realPrice=value=>{if(value===null||value===undefined||value==='')return null;const n=Number(value);return Number.isFinite(n)&&n>0?n:null};
function normalize(payload,fallbackCurrency,sourceId){
 if(!payload||payload.ok!==true)throw Error(String(payload?.error||'Risposta varianti non valida'));
 if(String(payload.itemId||'')!==String(sourceId))throw Error('ID prodotto diverso nella risposta varianti');
 if(!payload.hasVariations)return{hasVariations:false,variants:[],dimensions:[]};
 const dimensions=Array.isArray(payload.dimensions)?payload.dimensions.map(d=>({
   name:clean(d?.name),values:Array.isArray(d?.values)?d.values.map(clean).filter(Boolean):[]
 })).filter(d=>d.name):[];
 const seen=new Set(),variants=[];
 for(const [index,v] of (Array.isArray(payload.variants)?payload.variants:[]).entries()){
  const specifics=(Array.isArray(v?.specifics)?v.specifics:[]).map(s=>({name:clean(s?.name),value:clean(s?.value)})).filter(s=>s.name&&s.value);
  const identity=specifics.map(s=>s.name.toLowerCase()+'='+s.value.toLowerCase()).sort().join('|');
  if(!identity||seen.has(identity))continue;
  seen.add(identity);
  const name=specifics.map(s=>s.name+': '+s.value).join(' · ');
  const sourcePrice=realPrice(v?.sourcePrice);
  const sourceCurrency=clean(v?.sourceCurrency||v?.priceCurrency||payload.currency||payload.sourceCurrency||fallbackCurrency).toUpperCase();
  const key=identity;
  variants.push({key,index,label:name,specifics,sourcePrice,sourceCurrency,
    sale:null,discount:0,manualSale:false,
    images:Array.isArray(v.images)?v.images:[],
    verifiedUpc: null});
 }
 if(!dimensions.length||!variants.length)throw Error('Varianti confermate, ma attributi/combinazioni incompleti: non invento dati');
 // Reject incomplete combinations; they cannot be represented safely as eBay children.
 for(const v of variants)for(const d of dimensions)
  if(!v.specifics.some(s=>s.name.toLowerCase()===d.name.toLowerCase()&&s.value))throw Error('Variante '+v.label+' priva dell’attributo '+d.name);
 return{hasVariations:true,dimensions,variants,sourceItemId:String(sourceId)};
}
function jsonp(endpoint,action,params,timeout=35000){
 return new Promise((resolve,reject)=>{
  if(!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(endpoint))return reject(Error('Endpoint Sell Like Clone non disponibile'));
  const callback='__priceMatchVariants_'+Date.now()+'_'+Math.floor(Math.random()*1000000);
  const script=document.createElement('script');let doneAlready=false;
  const timer=setTimeout(()=>finish(Error('Timeout recupero attributi e varianti')),timeout);
  function finish(error,value){
   if(doneAlready)return;doneAlready=true;clearTimeout(timer);
   try{delete window[callback]}catch(_){window[callback]=undefined}
   script.remove();if(error)reject(error);else resolve(value)
  }
  window[callback]=r=>finish(null,r);
  script.onerror=()=>finish(Error('Errore collegamento al recupero varianti eBay'));
  script.src=endpoint+'?'+new URLSearchParams({action,callback,_:String(Date.now()),...params});
  document.head.appendChild(script);
 })
}
async function probe({itemId,endpoint,fallbackCurrency}){
 const raw=await jsonp(endpoint,'sell_like_variants_get',{itemId:String(itemId)});
 return normalize(raw,fallbackCurrency,itemId);
}
function marketPrice(v,fx,targetCurrency,round){
 if(v.sourcePrice===null)return null;
 if(v.sourceCurrency===targetCurrency)return round(v.sourcePrice);
 const from=Number(fx?.[v.sourceCurrency]),to=Number(fx?.[targetCurrency]);
 return from>0&&to>0?round(v.sourcePrice*from/to):null;
}
root.__priceMatchVariantTools={normalize,probe,marketPrice};
if(typeof module==='object'&&module.exports)module.exports=root.__priceMatchVariantTools;
})(typeof globalThis==='object'?globalThis:this);
