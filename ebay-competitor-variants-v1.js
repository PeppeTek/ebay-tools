/* PriceMatch Pro · automatic variants detector · isolated from official Sell Like Clone */
(function(root){
'use strict';
const clean=x=>String(x==null?'':x).replace(/\s+/g,' ').trim();
const realPrice=value=>{if(value===null||value===undefined||value==='')return null;const n=Number(value);return Number.isFinite(n)&&n>0?n:null};
function normalize(payload,fallbackCurrency,sourceId){
 if(!payload||payload.ok!==true)throw Error(String(payload?.error||'Risposta varianti non valida'));
 if(payload.itemId!==undefined&&payload.itemId!==null&&String(payload.itemId)!==String(sourceId))throw Error('ID prodotto diverso nella risposta varianti');
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
// Conservative fallback when the active eBay layout exposes selectors but the
// legacy Sell Like Clone backend does not return a complete variant payload.
function inspectPage(doc,href,selectedPrice,fallbackCurrency,itemId){
 const selectors=[...doc.querySelectorAll('select')],parts=[];
 const allowHint=/\b(msku|variation|variant|plug(?:\s*types?)?|colo(?:u)?r|size|capacity|style|material|pattern|type|model|option)\b/i;
 const rejectHint=/\b(sort|search|quantity|qty|shipping|country|currency|language|category|condition|order by)\b/i;
 for(const select of selectors){
  const options=[...select.options||[]].filter(o=>!o.disabled&&clean(o.textContent||o.label)&&!/^select(?:\s+(?:an?|one))?(?:\s+option)?$|^choose(?:\s+(?:an?|one))?/i.test(clean(o.textContent||o.label)));
  if(options.length<2||options.length>100)continue;
  const identifier=clean([select.id,select.name,select.getAttribute('aria-label'),select.getAttribute('data-testid')].join(' '));
  const parent=select.closest('label')||select.parentElement;
  const surrounding=clean((parent?.textContent||'').slice(0,180));
  const hint=clean(identifier+' '+surrounding);
  if(rejectHint.test(identifier)||(!allowHint.test(hint)&&!/(?:\d{9,15}|plug)/i.test(options.map(o=>o.value).join(' '))))continue;
  let name=clean(select.getAttribute('aria-label')||'');
  if(!name)name=clean(parent?.querySelector('label,legend,.ux-labels-values__labels,.x-msku__label')?.textContent||'');
  if(!name){
   const m=surrounding.match(/(?:^|\s)(plug\s*types?|colo(?:u)?r|size|capacity|style|material|pattern|model|type)\s*:/i);
   name=m?m[1]:clean(identifier.replace(/[_-]+/g,' ').replace(/\b(?:msku|variation|select|selector)\b/gi,''));
  }
  name=name.replace(/:\s*$/,'').trim();
  if(!name||rejectHint.test(name)||!allowHint.test(name))continue;
  const choices=options.map(o=>({text:clean(o.textContent||o.label).replace(/\s+(?:most popular|out of stock)$/i,'').trim(),
      option:o,value:String(o.value||'')}));
  if(choices.some(o=>!o.text))continue;
  parts.push({name,choices,select})
 }
 // Current eBay item pages also use eBay Skin listbox-button components,
 // not native <select>. Scope strictly to the MSKU area to avoid search/sort menus.
 let foundMskuListbox=false;
 if(!parts.length){
  const widgets=[...doc.querySelectorAll('.x-msku-evo .listbox-button, .x-msku .listbox-button, .x-msku-evo [aria-haspopup="listbox"], .x-msku [aria-haspopup="listbox"]')];
  foundMskuListbox=widgets.length>0;
  const seenWidgets=new Set();
  for(const widget of widgets){
   const container=widget.matches?.('.listbox-button')?widget:widget.closest?.('.listbox-button');
   const box=container||widget;
   if(seenWidgets.has(box))continue;seenWidgets.add(box);
   const button=box.querySelector?.('button[aria-haspopup="listbox"],.listbox-button__control')||
     (widget.matches?.('button[aria-haspopup="listbox"]')?widget:null);
   if(!button)continue;
   const group=box.closest?.('.x-sku, .x-msku__select, .x-msku__box')||box.parentElement||box;
   const heading=clean(group.querySelector?.('label,.ux-labels-values__labels,.x-msku__label')?.textContent||'');
   const buttonText=clean(button.textContent||button.getAttribute?.('aria-label')||'');
   const aria=clean(button.getAttribute?.('aria-label')||'');
   const labelled=(heading||buttonText||aria);
   const match=(heading+' '+buttonText+' '+aria).match(/(?:^|\\s)(plug\\s*types?|colo(?:u)?r|size|capacity|style|material|pattern|model|type)\\s*:/i);
   let name=clean((match&&match[1])||heading.split(':')[0]||buttonText.split(':')[0]).replace(/:$/,'');
   if(!name||rejectHint.test(name)||(!allowHint.test(name)&&!allowHint.test(labelled)))continue;
   const list=box.querySelector?.('.listbox-button__listbox, [role="listbox"]')||box;
   const raw=[...(list.querySelectorAll?.('.listbox__option, [role="option"]')||[])];
   const choices=raw.filter(o=>!o.disabled&&o.getAttribute?.('aria-disabled')!=='true').map(o=>{
    const label=clean(o.querySelector?.('.listbox__value, .listbox__option-text, .btn__text')?.textContent||o.textContent||'')
      .replace(/\\s+(?:most popular|out of stock)$/i,'').trim();
    return {text:label,option:o,value:clean(o.getAttribute?.('data-value')||o.getAttribute?.('value')||label),
     selected:o.getAttribute?.('aria-selected')==='true'||o.classList?.contains?.('listbox__option--selected')||false};
   }).filter(x=>x.text&&!/^select(?:\\s+(?:an?|one))?(?:\\s+option)?$|^choose(?:\\s+(?:an?|one))?/i.test(x.text));
   if(choices.length<2||choices.length>100)continue;
   const selected=choices.find(o=>o.selected)||choices.find(o=>
     buttonText.toLowerCase().endsWith(o.text.toLowerCase())||aria.toLowerCase().endsWith(o.text.toLowerCase()));
   parts.push({name,choices,select:{value:selected?.value||'',__priceMatchCustom:true}})
  }
 }
 // A native or Skin dropdown can confirm its displayed choices, but multiple
 // independent selectors cannot establish valid combinations without backend data.
 if(parts.length!==1)return {hasSelects:parts.length>0||foundMskuListbox,hasVariations:false,reason:parts.length>1?'Attributi multipli: le combinazioni richiedono dati verificati da eBay':foundMskuListbox?'Menu varianti eBay trovato, opzioni non ancora caricate':'Nessun selettore variante compatibile'};
 const part=parts[0],used=new Set(),variants=[];
 const requested=(String(href||'').match(/[?&]var=(\d+)/)||[])[1]||'';
 const selected=part.choices.find(x=>x.selected||x.option.selected)||part.choices.find(x=>x.value===part.select.value);
 const active=part.choices.find(x=>requested&&x.value===requested)||selected;
 for(const option of part.choices){
  const label=option.text;
  if(used.has(label.toLowerCase()))continue;
  used.add(label.toLowerCase());
  const isActive=!!(active&&option.value===active.value&&option.text===active.text);
  // Only the currently selected option can safely use the visible listing price.
  // Others retain null until the backend provides an individual price or user enters one.
  variants.push({
   key:part.name.toLowerCase()+'='+label.toLowerCase(),
   label:part.name+': '+label,
   specifics:[{name:part.name,value:label}],
   sourcePrice:isActive?realPrice(selectedPrice):null,
   sourceCurrency:String(fallbackCurrency||'USD').toUpperCase(),
   sale:null,discount:0,manualSale:false,images:[],verifiedUpc:null,
   selected:isActive
  })
 }
 if(variants.length<2)return {hasSelects:true,hasVariations:false,reason:'Meno di due opzioni variante distinte'};
 return{hasSelects:true,hasVariations:true,partial:true,sourceItemId:String(itemId),selectedKey:active?part.name.toLowerCase()+'='+active.text.toLowerCase():null,
   dimensions:[{name:part.name,values:variants.map(v=>v.specifics[0].value)}],variants}
}
root.__priceMatchVariantTools={normalize,probe,marketPrice,inspectPage};
if(typeof module==='object'&&module.exports)module.exports=root.__priceMatchVariantTools;
})(typeof globalThis==='object'?globalThis:this);
