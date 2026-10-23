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
const MARKET_FEES={
 US:{ebayFee:.136,internationalFee:.016,marketingFee:.02,vatOnFees:.22,salesTaxEstimate:.07,fixedFee:.40,fixedFeeLow:.30,fixedFeeHigh:.40,fixedFeeThreshold:10,feeSource:'US screenshot + official eBay USD fee tiers'},
 CA:{ebayFee:.136,internationalFee:.016,marketingFee:.02,vatOnFees:.22,salesTaxEstimate:.06,fixedFee:.40,fixedFeeLow:.30,fixedFeeHigh:.40,fixedFeeThreshold:10,feeSource:'Canada official CAD fee tiers; international/tax estimates'},
 AU:{ebayFee:.1218,internationalFee:.016,marketingFee:0,vatOnFees:.22,salesTaxEstimate:.09,fixedFee:.27,feeSource:'Actual AU screenshot, category-specific and account-specific'}
};
function perOrderFee(price,rates){
 const r={...DEFAULT_FEES,...(rates||{})},p=Number(price);
 const base=p*(1+Number(r.salesTaxEstimate||0));
 const hasTiers=Number.isFinite(Number(r.fixedFeeLow))&&Number.isFinite(Number(r.fixedFeeHigh))&&Number.isFinite(Number(r.fixedFeeThreshold))&&r.fixedFeeLow!==undefined;
 return hasTiers?(base<=Number(r.fixedFeeThreshold)+1e-9?Number(r.fixedFeeLow):Number(r.fixedFeeHigh)):Number(r.fixedFee);
}
function feeItems(price,rates){
 const p=Number(price),r={...DEFAULT_FEES,...(rates||{})};
 if(!Number.isFinite(p)||p<=0||Object.keys(DEFAULT_FEES).some(k=>!Number.isFinite(Number(r[k]))||Number(r[k])<0))return null;
 const base=round(p*(1+Number(r.salesTaxEstimate))),fixedLocal=perOrderFee(p,r);
 const fvf=round(base*Number(r.ebayFee)),intl=round(base*Number(r.internationalFee)),ads=round(base*Number(r.marketingFee));
 const subtotal=round(fvf+intl+ads+fixedLocal),vat=round(subtotal*Number(r.vatOnFees)),total=round(subtotal+vat);
 const variable=(1+Number(r.salesTaxEstimate))*(Number(r.ebayFee)+Number(r.internationalFee)+Number(r.marketingFee))*(1+Number(r.vatOnFees));
 if(variable>=1||!Number.isFinite(total))return null;
 return {base,fvf,intl,ads,fixedLocal,vat,fee:total,net:round(p-total),variableRate:variable};
}
function breakEvenPrice(costUsd,fx,rates){
 if(!Number.isFinite(costUsd)||costUsd<0||!Number.isFinite(fx)||fx<=0)return null;
 const r={...DEFAULT_FEES,...(rates||{})},target=costUsd/fx;
 const valid=p=>{const f=feeItems(p,r);return !!f&&f.net+1e-8>=target;};
 const tier=Number(r.fixedFeeThreshold),tax=1+Number(r.salesTaxEstimate);
 function bisect(minCents,maxCents){
   if(minCents>maxCents||!valid(maxCents/100))return null;
   let lo=minCents,hi=maxCents;
   while(lo<hi){const mid=Math.floor((lo+hi)/2);if(valid(mid/100))hi=mid;else lo=mid+1;}
   return round(lo/100);
 }
 if(r.fixedFeeLow!==undefined&&Number.isFinite(tier)&&tier>0&&tax>0){
   const limit=Math.floor((tier/tax)*100+1e-8),below=bisect(1,limit);
   if(below!==null)return below;
   return bisect(limit+1,100000000);
 }
 return bisect(1,100000000);
}
function fees(price, rates, toUsd, purchaseUsd){
 const p=Number(price),parts=feeItems(p,rates);if(!parts)return null;
 const fx=Number(toUsd)>0?Number(toUsd):null;
 const c=purchaseUsd==null||purchaseUsd===''?null:Number(purchaseUsd);
 const validCost=c!==null&&Number.isFinite(c)&&c>=0;
 const be=validCost&&fx?breakEvenPrice(c,fx,rates):null;
 const profitUSD=validCost&&fx?round(parts.net*fx-c):null;
 return {sale:p,...parts,netUsd:fx?round(parts.net*fx):null,costLocal:validCost&&fx?round(c/fx):null,costUsd:validCost?c:null,profitUSD,profitLocal:profitUSD!==null&&fx?round(profitUSD/fx):null,breakEven:be,marginPct:profitUSD!==null&&parts.net>0&&fx?round(100*profitUSD/(p*fx)):null};
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
root.DropperCalculatorCore={MARKETS,DEFAULT_FEES,MARKET_FEES,round,num,clean,money,perOrderFee,feeItems,fees,adjusted,countryFromHost,currencyFromHost,readDocument};
if(typeof module==='object'&&module.exports)module.exports=root.DropperCalculatorCore;
})(typeof globalThis==='object'?globalThis:this);
