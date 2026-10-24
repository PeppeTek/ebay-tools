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
// The eBay MSKU widget can embed an authoritative price per variation. Read
// inert JSON data only; do not execute page scripts, click the buyer's dropdown,
// request unauthenticated third-party APIs, or infer sibling prices from the Master.
function readMskuJson(doc){
 const scripts=doc.querySelectorAll?.('script:not([src])')||[];
 for(const el of scripts){
  const body=String(el.textContent||'');
  if(!body.includes('"MSKU"')||!body.includes('"variationsMap"'))continue;
  const begin=/"MSKU"\s*:\s*\{/g;
  let match;
  while((match=begin.exec(body))){
   const start=body.indexOf('{',match.index),limit=Math.min(body.length,start+3000000);
   let level=0,quoted=false,escape=false;
   for(let i=start;i<limit;i++){
    const ch=body[i];
    if(quoted){if(escape)escape=false;else if(ch==='\\')escape=true;else if(ch==='"')quoted=false}
    else if(ch==='"')quoted=true;
    else if(ch==='{')level++;
    else if(ch==='}'&&--level===0){
     try{
      const state=JSON.parse(body.slice(start,i+1));
      if(state&&typeof state.variationsMap==='object'&&typeof state.menuItemMap==='object'&&typeof state.variationCombinations==='object'&&Array.isArray(state.selectMenus))return state
     }catch(_){}
     break
    }
   }
  }
 }
 return null
}
function mskuPrice(value,fallbackCurrency){
 if(!value||typeof value!=='object')return null;
 const bin=value.binModel?.price;
 const raw=bin?.textSpans?.map(v=>clean(v?.text)).join('')||'';
 // Only explicit money tokens from the variation price object are accepted.
 // Ignore eBay strikethrough prices, ranges and extra price descriptions.
 let price=null;
 const amount=clean(raw);
 if(/^(?:US|CA|AU|C|A|USD|CAD|AUD)?\s*(?:[$€£]\s*)?\d[\d,.]*$/.test(amount)){
  const token=amount.match(/(\d[\d,.]*)$/)?.[1]||'';
  const decimal=token.lastIndexOf('.')>token.lastIndexOf(',')?'.':',';
  const normalized=decimal===','?token.replace(/\./g,'').replace(',','.'):token.replace(/,/g,'');
  price=realPrice(normalized)
 }
 if(price===null)return null;
 const explicit=clean(value.currency||value.currencyID||bin?.currency||bin?.currencyID||'').toUpperCase();
 const prefix=amount.match(/^(US|CA|AU|USD|CAD|AUD|C|A)(?=\s*\$|\s*\d)/i)?.[1]?.toUpperCase();
 const code=explicit||({US:'USD',CA:'CAD',C:'CAD',AU:'AUD',A:'AUD'}[prefix]||prefix)||fallbackCurrency;
 return {price,currency:String(code||fallbackCurrency).toUpperCase()}
}
function getMskuPrices(doc,fallbackCurrency){
 const msku=readMskuJson(doc);
 if(!msku)return null;
 const combinations=msku.variationCombinations,items=msku.menuItemMap,menus=msku.selectMenus,variations=msku.variationsMap,found=new Map();
 for(const [combination,idValue] of Object.entries(combinations)){
  const id=(idValue&&typeof idValue==='object')?(idValue.variationId||idValue.id):idValue;
  const variation=variations?.[String(id)];
  const data=mskuPrice(variation,fallbackCurrency);
  if(!data)continue;
  const specifics=[];
  for(const menuId of combination.split('_')){
   const item=items?.[menuId];
   if(!item||!clean(item.displayName))continue;
   const matching=menus.filter(menu=>Array.isArray(menu.menuItemValueIds)&&menu.menuItemValueIds.map(String).includes(String(item.valueId)));
   if(matching.length!==1)continue;
   specifics.push({name:clean(matching[0].displayLabel),value:clean(item.displayName)});
  }
  if(!specifics.length)continue;
  const key=specifics.map(x=>x.name.toLowerCase()+'='+x.value.toLowerCase()).sort().join('|');
  if(found.has(key))found.delete(key); // ambiguous combination: never assign a price
  else found.set(key,data)
 }
 return found
}
function enrichVariantsFromPage(doc,variants,fallbackCurrency){
 const prices=getMskuPrices(doc,fallbackCurrency);
 if(!prices)return variants;
 return variants.map(v=>{
  const key=(v.specifics||[]).map(x=>clean(x.name).toLowerCase()+'='+clean(x.value).toLowerCase()).sort().join('|');
  const p=prices.get(key);
  if(!p||v.sourcePrice!==null&&v.sourcePrice!==undefined)return v;
  return {...v,sourcePrice:p.price,sourceCurrency:p.currency,priceSource:'ebay-msku'}
 })
}

function optionText(raw){
 // eBay Skin sometimes joins the state-badge text directly: "Selectselected".
 let value=clean(raw);
 for(let i=0;i<3;i++){
  const next=value.replace(/\s*(?:most popular|out of stock|selected)\s*$/i,'').trim();
  if(next===value)break;value=next
 }
 return value
}
function isPlaceholder(value){
 return /^(?:select|select one|select an option|choose|choose one|choose an option|please select|[-–—]+)$/i.test(clean(value))
}
function mskuVariants(doc,href,visiblePrice,fallbackCurrency,itemId){
 const msku=readMskuJson(doc);
 if(!msku)return null;
 const menus=msku.selectMenus.filter(m=>clean(m?.displayLabel)&&Array.isArray(m?.menuItemValueIds));
 if(!menus.length)return null;
 const definitions=menus.map(menu=>({
  name:clean(menu.displayLabel),
  ids:new Set(menu.menuItemValueIds.map(String)),
  values:[]
 }));
 const entries=[],seen=new Set();
 const requested=(String(href||'').match(/[?&]var=(\d+)/)||[])[1]||'';
 for(const [combination,ref] of Object.entries(msku.variationCombinations)){
  const variantId=String(ref&&typeof ref==='object'?(ref.variationId||ref.id||''):ref);
  const data=msku.variationsMap[variantId];
  if(!data||typeof data!=='object')continue;
  const specifics=[];
  for(const partId of combination.split('_')){
   const item=msku.menuItemMap[String(partId)];
   const value=optionText(item?.displayName);
   if(!item||!value||isPlaceholder(value))continue;
   const match=definitions.filter(d=>d.ids.has(String(item.valueId)));
   if(match.length!==1)continue;
   specifics.push({name:match[0].name,value})
  }
  // Every child must have exactly one value for every dimension.
  if(specifics.length!==definitions.length||
     definitions.some(d=>specifics.filter(p=>p.name.toLowerCase()===d.name.toLowerCase()).length!==1))continue;
  const key=specifics.map(p=>p.name.toLowerCase()+'='+p.value.toLowerCase()).sort().join('|');
  if(seen.has(key))continue;seen.add(key);
  const money=mskuPrice(data,fallbackCurrency);
  const selected=!!requested&&variantId===requested;
  const sourcePrice=money?.price??(selected?realPrice(visiblePrice):null);
  const sourceCurrency=money?.currency||String(fallbackCurrency||'USD').toUpperCase();
  const outOfStock=data.quantity?.outOfStock===true;
  const label=specifics.map(p=>p.name+': '+p.value).join(' · ');
  entries.push({key,label,specifics,sourcePrice,sourceCurrency,variationId:variantId,
   selected,outOfStock,sale:null,discount:0,manualSale:false,images:[],verifiedUpc:null})
  for(const p of specifics){
   const dim=definitions.find(d=>d.name.toLowerCase()===p.name.toLowerCase());
   if(dim&&!dim.values.some(v=>v.toLowerCase()===p.value.toLowerCase()))dim.values.push(p.value)
  }
 }
 if(entries.length<2||definitions.some(d=>!d.values.length))return null;
 const selected=entries.find(e=>e.selected);
 return {
  hasSelects:true,hasVariations:true,complete:true,source:'msku',sourceItemId:String(itemId),
  selectedKey:selected?.key||null,
  dimensions:definitions.map(d=>({name:d.name,values:d.values})),
  variants:entries
 }
}

// Conservative fallback when the active eBay layout exposes selectors but the
// legacy Sell Like Clone backend does not return a complete variant payload.
function inspectPage(doc,href,selectedPrice,fallbackCurrency,itemId){
 const complete=mskuVariants(doc,href,selectedPrice,fallbackCurrency,itemId);
 if(complete)return complete;
 const selectors=[...doc.querySelectorAll('select')],parts=[];
 const allowHint=/\b(msku|variation|variant|plug(?:\s*types?)?|colo(?:u)?r|size|capacity|style|material|pattern|type|model|option|length|qty|unit)\b/i;
 const rejectHint=/\b(sort|search|quantity|qty|shipping|country|currency|language|category|condition|order by)\b/i;
 for(const select of selectors){
  const options=[...select.options||[]].filter(o=>!o.disabled&&!isPlaceholder(optionText(o.textContent||o.label)));
  if(options.length<2||options.length>100)continue;
  const identifier=clean([select.id,select.name,select.getAttribute('aria-label'),select.getAttribute('data-testid')].join(' '));
  const parent=select.closest('label')||select.parentElement;
  const surrounding=clean((parent?.textContent||'').slice(0,180));
  const hint=clean(identifier+' '+surrounding);
  if((rejectHint.test(identifier)&&!select.closest?.('.x-msku-evo,.x-msku'))||(!allowHint.test(hint)&&!/(?:\d{9,15}|plug)/i.test(options.map(o=>o.value).join(' '))))continue;
  let name=clean(select.getAttribute('aria-label')||'');
  if(!name)name=clean(parent?.querySelector('label,legend,.ux-labels-values__labels,.x-msku__label')?.textContent||'');
  if(!name){
   const m=surrounding.match(/(?:^|\s)(plug\s*types?|colo(?:u)?r|size|capacity|style|material|pattern|model|type)\s*:/i);
   name=m?m[1]:clean(identifier.replace(/[_-]+/g,' ').replace(/\b(?:msku|variation|select|selector)\b/gi,''));
  }
  name=name.replace(/:\s*$/,'').trim();
  if(!name||rejectHint.test(name)||!allowHint.test(name))continue;
  const choices=options.map(o=>({text:optionText(o.textContent||o.label),
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
   const match=(heading+' '+buttonText+' '+aria).match(/(?:^|\s)(plug\s*types?|colo(?:u)?r|size|capacity|style|material|pattern|model|type|unit\s*type|item\s*length|qty)\s*:/i);
   let name=clean((match&&match[1])||heading.split(':')[0]||buttonText.split(':')[0]).replace(/:$/,'');
   if(!name||(rejectHint.test(name)&&!/^qty\b/i.test(name))||(!allowHint.test(name)&&!allowHint.test(labelled)))continue;
   const list=box.querySelector?.('.listbox-button__listbox, [role="listbox"]')||box;
   const raw=[...(list.querySelectorAll?.('.listbox__option, [role="option"]')||[])];
   const choices=raw.filter(o=>!o.disabled&&o.getAttribute?.('aria-disabled')!=='true').map(o=>{
    const label=clean(o.querySelector?.('.listbox__value, .listbox__option-text, .btn__text')?.textContent||o.textContent||'')
      .replace(/\s*(?:(?:most popular|out of stock|selected)\s*)+$/i,'').trim();
    return {text:label,option:o,value:clean(o.getAttribute?.('data-value')||o.getAttribute?.('value')||label),
     selected:o.getAttribute?.('aria-selected')==='true'||o.classList?.contains?.('listbox__option--selected')||false};
   }).filter(x=>x.text&&!isPlaceholder(x.text));
   if(choices.length<2||choices.length>100)continue;
   const selected=choices.find(o=>o.selected)||choices.find(o=>
     buttonText.toLowerCase().endsWith(o.text.toLowerCase())||aria.toLowerCase().endsWith(o.text.toLowerCase()));
   parts.push({name,choices,select:{value:selected?.value||'',__priceMatchCustom:true}})
  }
 }
 // Multiple eBay MSKU controls may load their options at different times.
 // Seeing one populated list must not be mistaken for the full product.
 const widgetRoots=new Set([...doc.querySelectorAll('.x-msku-evo .listbox-button,.x-msku .listbox-button')]
  .map(w=>w.closest?.('.listbox-button')||w));
 if(widgetRoots.size>1||parts.length>1){
  return {hasSelects:true,hasVariations:false,reason:'Attributi multipli eBay: attendo combinazioni MSKU complete; nessuna combinazione inventata'}
 }
 if(parts.length!==1)return {hasSelects:parts.length>0||foundMskuListbox,hasVariations:false,reason:foundMskuListbox?'Menu varianti eBay trovato, opzioni non ancora caricate':'Nessun selettore variante compatibile'};
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
   dimensions:[{name:part.name,values:variants.map(v=>v.specifics[0].value)}],variants:enrichVariantsFromPage(doc,variants,fallbackCurrency)}
}
// Only verified category breadcrumbs from the CURRENT item page are exported.
// Category names are labels, not inferred from the product title or keywords.
function readItemCategory(doc){
 const hrefId=url=>{
  const match=String(url||'').match(/\/b\/[^/?#]+\/(\d{2,12})(?=\/|[?#]|$)|[?&](?:_sacat|categoryId|cat)=(\d{2,12})(?=&|$)/i);
  return match?match[1]||match[2]:''
 };
 const candidates=[];
 const add=(id,name)=>{
  id=clean(id);name=clean(name);
  if(/^\d{2,12}$/.test(id)&&name&&name.length<=120&&!/^(home|shop by category|all categories|see all|more)$/i.test(name))
   candidates.push({categoryId:id,categoryName:name})
 };
 const links=doc.querySelectorAll?.(
  'nav[aria-label*="readcrumb"] a[href],.breadcrumbs a[href],.x-breadcrumbs a[href],.seo-breadcrumbs a[href],.vi-breadcrumb a[href],[data-testid*="breadcrumb"] a[href]')||[];
 for(const link of links)add(hrefId(link.href||link.getAttribute?.('href')),link.textContent||link.innerText);
 const scripts=doc.querySelectorAll?.('script[type="application/ld+json"]')||[];
 function collect(node){
  if(!node||typeof node!=='object')return;
  if(Array.isArray(node)){for(const part of node)collect(part);return}
  if(String(node['@type']||'').includes('BreadcrumbList')&&Array.isArray(node.itemListElement)){
   for(const item of node.itemListElement){
    const url=item?.item?.['@id']||item?.item?.url||item?.item||'';
    add(hrefId(url),item?.name||item?.item?.name||'')
   }
  }
  if(Array.isArray(node['@graph']))collect(node['@graph'])
 }
 for(const script of scripts){
  try{collect(JSON.parse(script.textContent||''))}catch(_){}
 }
 // Prefer the most specific (last) breadcrumb. No category is fabricated when
 // the product page does not expose one with BOTH a name and numeric id.
 return candidates.length?candidates[candidates.length-1]:{categoryId:'',categoryName:''}
}
root.__priceMatchVariantTools={normalize,probe,marketPrice,inspectPage,enrichVariantsFromPage,getMskuPrices,readItemCategory,mskuVariants,optionText,isPlaceholder};
if(typeof module==='object'&&module.exports)module.exports=root.__priceMatchVariantTools;
})(typeof globalThis==='object'?globalThis:this);
