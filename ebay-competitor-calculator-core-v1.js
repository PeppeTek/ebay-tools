/* Dropper Analytics · Competitor calculator core · isolated from Sell Like Clone */
(function(root){
'use strict';
const HOST_CURRENCY={'ebay.com':'USD','ebay.ca':'CAD','ebay.com.au':'AUD','ebay.co.uk':'GBP','ebay.it':'EUR','ebay.de':'EUR','ebay.fr':'EUR','ebay.es':'EUR','ebay.ie':'EUR','ebay.ch':'CHF','ebay.com.sg':'SGD','ebay.com.my':'MYR','ebay.com.hk':'HKD'};
const MARKETS={US:{currency:'USD',amazon:'www.amazon.com'},CA:{currency:'CAD',amazon:'www.amazon.ca'},AU:{currency:'AUD',amazon:'www.amazon.com.au'}};
const DEFAULT_FEES={ebayFee:0.136,internationalFee:0.016,marketingFee:0.02,vatOnFees:0.22,salesTaxEstimate:0.06,fixedFee:0.40};
const round=n=>Math.round((n+Number.EPSILON)*100)/100;
const clean=v=>String(v==null?'':v).replace(/\s+/g,' ').trim();
function num(raw){
 let s=clean(raw).replace(/[^\d,.\-]/g,'');
 if(!s)return null;
 const comma=s.lastIndexOf(','),dot=s.lastIndexOf('.');
 if(comma>=0&&dot>=0)s=comma>dot?s.replace(/\./g,'').replace(',','.'):s.replace(/,/g,'');
 else if(comma>=0)s=/,\d{1,2}$/.test(s)?s.replace(',','.'):s.replace(/,/g,'');
 else if(dot>=0&&/^\d{1,3}(?:\.\d{3})+$/.test(s))s=s.replace(/\./g,'');
 const n=Number(s);
 return Number.isFinite(n)?n:null;
}
function countryFromHost(host){const h=String(host||'').toLowerCase().replace(/^www\./,'');return h==='ebay.com.au'?'AU':h==='ebay.ca'?'CA':'US'}
function currencyFromHost(host){return HOST_CURRENCY[String(host||'').toLowerCase().replace(/^www\./,'')]||'USD'}
function money(raw, fallback='USD'){
 const s=clean(raw).replace(/\u00a0/g,' ');
 if(!s)return null;
 let currency=/(?:\bCAD\b|C\s*\$|CA\s*\$)/i.test(s)?'CAD':/(?:\bAUD\b|A\s*\$|AU\s*\$)/i.test(s)?'AUD':/(?:\bUSD\b|US\s*\$)/i.test(s)?'USD':/(?:\bGBP\b|£)/i.test(s)?'GBP':/(?:\bEUR\b|€)/i.test(s)?'EUR':/(?:\bCHF\b)/i.test(s)?'CHF':/(?:\bSGD\b)/i.test(s)?'SGD':/(?:\bHKD\b)/i.test(s)?'HKD':/(?:\bMYR\b)/i.test(s)?'MYR':fallback;
 const m=s.match(/-?\d[\d.,]*/);
 if(!m)return null;
 const value=num(m[0]);return value!==null&&value>0?{value,currency}:null;
}
function fees(price, rates, toUsd, purchaseUsd){
 const p=Number(price);if(!Number.isFinite(p)||p<=0)return null;
 const r={...DEFAULT_FEES,...(rates||{})};
 if(Object.keys(DEFAULT_FEES).some(k=>!Number.isFinite(Number(r[k]))||Number(r[k])<0))return null;
 const variable=(1+Number(r.salesTaxEstimate))*(Number(r.ebayFee)+Number(r.internationalFee)+Number(r.marketingFee))*(1+Number(r.vatOnFees));
 const fixed=Number(r.fixedFee)*(1+Number(r.vatOnFees));
 if(!Number.isFinite(variable)||variable>=1)return null;
 const fee=round(p*variable+fixed),net=round(p-fee);
 const fx=Number(toUsd)>0?Number(toUsd):null;
 const c=purchaseUsd==null||purchaseUsd===''?null:Number(purchaseUsd);
 const validCost=c!==null&&Number.isFinite(c)&&c>=0;
 const breakEven=validCost&&fx?round((c/fx+fixed)/(1-variable)):null;
 const profitUSD=validCost&&fx?round(net*fx-c):null;
 return {sale:p,fee,net,netUsd:fx?round(net*fx):null,costLocal:validCost&&fx?round(c/fx):null,costUsd:validCost?c:null,profitUSD,profitLocal:profitUSD!==null&&fx?round(profitUSD/fx):null,breakEven,variableRate:variable,marginPct:profitUSD!==null&&net>0&&fx?round(100*profitUSD/(p*fx)):null};
}
function adjusted(source,discountPct){const n=Number(source),d=Number(discountPct);return Number.isFinite(n)&&n>0&&Number.isFinite(d)&&d>-100&&d<=1000?round(n*(1+d/100)):null;}
function readDocument(doc,host,href){
 const id=(String(href||'').match(/\/itm\/(?:[^/?#]+\/)?(\d{9,12})(?=[/?#]|$)/i)||[])[1]||'';
 if(!id)return {id:'',title:'',price:null,error:'URL eBay non contiene un Item ID valido'};
 const meta=(selector,attr='content')=>clean(doc.querySelector(selector)?.getAttribute(attr)||'');
 const sourceCurrency=currencyFromHost(host);
 const h1=doc.querySelector('h1.x-item-title__mainTitle, h1[data-testid="x-item-title"], h1 span.ux-textspans, h1');
 const title=clean(h1?.innerText||h1?.textContent||meta('meta[property="og:title"]')).replace(/^Details about\s*/i,'').replace(/\s*\|\s*eBay.*$/i,'').slice(0,255);
 const candidates=[];
 const add=(raw,source,forcedCurrency)=>{const v=money(raw,forcedCurrency||sourceCurrency);if(v)candidates.push({...v,source})};
 const pri=doc.querySelector('.x-price-primary, [data-testid="x-price-primary"], .mainPrice, #prcIsum, #mm-saleDscPrc, [itemprop="price"]');
 if(pri)add(pri.innerText||pri.textContent||pri.getAttribute('content'),'prezzo principale');
 const mp=meta('meta[property="product:price:amount"]')||meta('meta[itemprop="price"]');
 const mc=meta('meta[property="product:price:currency"]')||meta('meta[itemprop="priceCurrency"]');
 if(mp)add(mp,'metadati eBay',mc||sourceCurrency);
 for(const script of [...doc.querySelectorAll('script[type="application/ld+json"]')].slice(0,12)){
   try{
     const obj=JSON.parse(script.textContent||'null');
     const nodes=Array.isArray(obj)?obj:[obj];
     for(const node of nodes){const values=[node,...(Array.isArray(node?.['@graph'])?node['@graph']:[])];for(const x of values){
       if(!x||typeof x!=='object')continue;const offers=Array.isArray(x.offers)?x.offers[0]:x.offers;
       if(offers&&offers.price)add(String(offers.price),'dati strutturati',String(offers.priceCurrency||sourceCurrency));
     }}
   }catch(_){}
 }
 // Never use eBay's secondary "Approximately" conversion as the listing's original price.
 const price=candidates[0]||null;
 return {id,title,price,sourceCurrency,hasPriceVariants:!!doc.querySelector('[id*="msku"],select[name*="variation"],.msku-sel,select[id*="msku"]'),error:price?null:'Prezzo non identificato: inseriscilo manualmente'};
}
root.DropperCalculatorCore={MARKETS,DEFAULT_FEES,round,num,clean,money,fees,adjusted,countryFromHost,currencyFromHost,readDocument};
if(typeof module==='object'&&module.exports)module.exports=root.DropperCalculatorCore;
})(typeof globalThis==='object'?globalThis:this);
