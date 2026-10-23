/* Dropper Analytics · Competitor calculator core · isolated from Sell Like Clone */
(function(root){
'use strict';
const HOST_CURRENCY={'ebay.com':'USD','ebay.ca':'CAD','ebay.com.au':'AUD','ebay.co.uk':'GBP','ebay.it':'EUR','ebay.de':'EUR','ebay.fr':'EUR','ebay.es':'EUR','ebay.ie':'EUR','ebay.ch':'CHF','ebay.com.sg':'SGD','ebay.com.my':'MYR','ebay.com.hk':'HKD'};
const MARKETS={US:{currency:'USD',amazon:'www.amazon.com'},CA:{currency:'CAD',amazon:'www.amazon.ca'},AU:{currency:'AUD',amazon:'www.amazon.com.au'}};
const DEFAULT_FEES={ebayFee:0.136,internationalFee:0.016,marketingFee:0.02,vatOnFees:0.22,salesTaxEstimate:0.06,fixedFee:0.40};
// Decimal shift avoids common IEEE-754 half-cent errors (e.g. 8.075 -> 8.08).
const round=n=>{
 const value=Number(n);if(!Number.isFinite(value))return NaN;
 const scaled=Number(Math.abs(value)+'e2');
 return Math.sign(value)*Math.round(Number.isFinite(scaled)?scaled:Math.abs(value)*100)/100;
};
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

function transactionTotals(price,rates,options={}){
 const p=Number(price),r={...DEFAULT_FEES,...(rates||{})};
 const quantity=options.quantity===undefined?1:Number(options.quantity);
 const shipping=options.shipping===undefined?Number(r.shippingCharge||0):Number(options.shipping);
 const discountPct=options.sellerDiscountPct===undefined?Number(r.sellerDiscountPct||0):Number(options.sellerDiscountPct);
 if(!Number.isFinite(p)||p<=0||!Number.isInteger(quantity)||quantity<1||quantity>1000||
    !Number.isFinite(shipping)||shipping<0||!Number.isFinite(discountPct)||discountPct<0||discountPct>=100||
    Object.keys(DEFAULT_FEES).some(k=>!Number.isFinite(Number(r[k]))||Number(r[k])<0))return null;
 const discount=round(p*discountPct/100),itemNet=round(p-discount);
 const beforeTax=round(itemNet+shipping);
 // Default: destination taxes both discounted item and buyer-paid shipping.
 // Optional future policy: {taxShipping:false} leaves shipping outside the tax base,
 // but never removes it from the eBay fee base or seller revenue.
 const taxableBase=options.taxShipping===false?itemNet:beforeTax;
 const tax=round(taxableBase*Number(r.salesTaxEstimate));
 const masterPerUnit=round(beforeTax+tax),masterTotal=round(masterPerUnit*quantity);
 return {quantity,itemPrice:p,discountPct,discount,shipping,itemNet,beforeTax,tax,taxableBase,masterPerUnit,masterTotal,
    buyerRevenue:round(beforeTax*quantity),salesTaxTotal:round(tax*quantity)};
}
function perOrderFee(price,rates,options={}){
 const r={...DEFAULT_FEES,...(rates||{})};
 const t=transactionTotals(price,r,options);
 if(!t)return null;
 const hasTiers=r.fixedFeeLow!==undefined&&Number.isFinite(Number(r.fixedFeeLow))&&
   Number.isFinite(Number(r.fixedFeeHigh))&&Number.isFinite(Number(r.fixedFeeThreshold));
 return hasTiers?(t.masterTotal<=Number(r.fixedFeeThreshold)+.000001?Number(r.fixedFeeLow):Number(r.fixedFeeHigh)):Number(r.fixedFee);
}
function feeItems(price,rates,options={}){
 const r={...DEFAULT_FEES,...(rates||{})},t=transactionTotals(price,r,options);
 if(!t)return null;
 const fixedLocal=perOrderFee(price,r,options);
 const fvfPerUnit=round(t.masterPerUnit*Number(r.ebayFee));
 const intlPerUnit=round(t.masterPerUnit*Number(r.internationalFee));
 const adsPerUnit=round(t.masterPerUnit*Number(r.marketingFee));
 const fvf=round(fvfPerUnit*t.quantity),intl=round(intlPerUnit*t.quantity),ads=round(adsPerUnit*t.quantity);
 const subtotal=round(fvf+intl+ads+fixedLocal),vat=round(subtotal*Number(r.vatOnFees));
 const total=round(subtotal+vat),net=round(t.buyerRevenue-total);
 const variable=(1+Number(r.salesTaxEstimate))*(1-t.discountPct/100)*
     (Number(r.ebayFee)+Number(r.internationalFee)+Number(r.marketingFee))*(1+Number(r.vatOnFees));
 if(variable>=1||!Number.isFinite(total))return null;
 return {...t,base:t.masterPerUnit,fvf,intl,ads,fixedLocal,vat,fee:total,net,variableRate:variable,
    feeSubtotal:subtotal,fvfPerUnit,intlPerUnit,adsPerUnit};
}
function breakEvenPrice(costUsd,fx,rates,options={}){
 const c=Number(costUsd),fxn=Number(fx);
 if(!Number.isFinite(c)||c<0||!Number.isFinite(fxn)||fxn<=0)return null;
 const r={...DEFAULT_FEES,...(rates||{})},qty=options.quantity===undefined?1:Number(options.quantity);
 if(!Number.isInteger(qty)||qty<1||qty>1000)return null;
 const target=c*qty/fxn;
 const f=cent=>feeItems(cent/100,r,options);
 const positive=cent=>{const x=f(cent);return !!x&&x.net+0.000001>=target};
 const MAX=100000000;
 function bisect(lo,hi){
   if(lo>hi||!positive(hi))return null;
   while(lo<hi){const mid=Math.floor((lo+hi)/2);if(positive(mid))hi=mid;else lo=mid+1;}
   return round(lo/100);
 }
 // Per-order fixed-fee thresholds create a small non-monotonic discontinuity.
 // Search the low and high tier separately to find the true minimum price.
 if(r.fixedFeeLow!==undefined&&Number.isFinite(Number(r.fixedFeeThreshold))){
   const threshold=Number(r.fixedFeeThreshold);
   let lo=1,hi=MAX,boundary=0;
   while(lo<=hi){
     const mid=Math.floor((lo+hi)/2),t=transactionTotals(mid/100,r,options);
     if(t&&t.masterTotal<=threshold){boundary=mid;lo=mid+1}else hi=mid-1;
   }
   const low=bisect(1,boundary);
   if(low!==null)return low;
   return bisect(boundary+1,MAX);
 }
 return bisect(1,MAX);
}
function fees(price,rates,toUsd,purchaseUsd,options={}){
 const p=Number(price),parts=feeItems(p,rates,options);if(!parts)return null;
 const fx=Number(toUsd)>0?Number(toUsd):null;
 const c=purchaseUsd==null||purchaseUsd===''?null:Number(purchaseUsd);
 const validCost=c!==null&&Number.isFinite(c)&&c>=0,extendedCost=validCost?round(c*parts.quantity):null;
 const be=validCost&&fx?breakEvenPrice(c,fx,rates,options):null;
 const profitUSD=validCost&&fx?round(parts.net*fx-extendedCost):null;
 return {sale:p,...parts,netUsd:fx?round(parts.net*fx):null,costLocal:validCost&&fx?round(extendedCost/fx):null,
   costUsd:extendedCost,profitUSD,profitLocal:profitUSD!==null&&fx?round(profitUSD/fx):null,
   breakEven:be,marginPct:profitUSD!==null&&parts.buyerRevenue>0&&fx?round(100*profitUSD/(parts.buyerRevenue*fx)):null};
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
root.DropperCalculatorCore={MARKETS,DEFAULT_FEES,MARKET_FEES,round,num,clean,money,transactionTotals,perOrderFee,feeItems,fees,adjusted,countryFromHost,currencyFromHost,readDocument};
if(typeof module==='object'&&module.exports)module.exports=root.DropperCalculatorCore;
})(typeof globalThis==='object'?globalThis:this);
