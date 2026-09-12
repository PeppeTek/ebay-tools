javascript:(async()=>{
'use strict';
const PANEL_ID='capitan-sell-like-clone';
const ENDPOINT_KEY='pep-ebay-bs-v6-google-url';
const PATCH_ID='capitan-variants-preview-v2';
if(document.getElementById(PATCH_ID))return;
const marker=document.createElement('span');marker.id=PATCH_ID;marker.style.display='none';document.documentElement.appendChild(marker);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const visible=e=>!!(e&&e.getClientRects&&e.getClientRects().length);
let currentData=null,currentRates=null,currentDiscount=.02;
function endpoint(){return String(localStorage.getItem(ENDPOINT_KEY)||'').replace(/\/+$/,'')}
function itemId(){const p=document.getElementById(PANEL_ID);const t=clean(p?.innerText||'');const m=t.match(/Source Item ID:\s*(\d{9,12})/i);return m?m[1]:String(localStorage.getItem('capitan-sell-like-last-source-item')||'')}
function jsonp(action,params){const ep=endpoint();return new Promise((resolve,reject)=>{if(!ep)return reject(Error('Endpoint Apps Script non configurato'));const cb='__capitanVariantsCb_'+Date.now()+'_'+Math.floor(Math.random()*1e6),s=document.createElement('script'),timer=setTimeout(()=>done(Error('Timeout backend')),45000);function done(err,val){clearTimeout(timer);try{delete window[cb]}catch(_){window[cb]=undefined}s.remove();err?reject(err):resolve(val)}window[cb]=v=>done(null,v);s.onerror=()=>done(Error('Backend non raggiungibile'));const q=new URLSearchParams({action,callback:cb,_:String(Date.now()),...(params||{})});s.src=ep+(ep.includes('?')?'&':'?')+q.toString();document.head.appendChild(s)})}
function calcBreakEven(s,r){s=Number(s);if(!isFinite(s)||s<=0)return null;r=r||{};const feeRate=Number(r.ebayFee||0)+Number(r.internationalFee||0)+Number(r.marketingFee||0);const variable=(1+Number(r.salesTaxEstimate||0))*feeRate*(1+Number(r.vatOnFees||0));const fixed=Number(r.fixedFee||0)*(1+Number(r.vatOnFees||0));const v=s*(1-variable)-fixed;return isFinite(v)?Math.round(v*100)/100:null}
function money(v,c){return v==null||!isFinite(Number(v))?'—':Number(v).toFixed(2)+' '+(c||'USD')}
function targetContainer(){const p=document.getElementById(PANEL_ID),steps=p?.querySelector('#steps');if(!steps)return null;return {p,steps}}
let variantMode=false;
function enforceVariantMode(){
  if(!variantMode)return;
  const ctx=targetContainer();if(!ctx)return;
  [...ctx.steps.querySelectorAll('.row')].forEach(r=>{
    const t=clean(r.innerText||r.textContent||'');
    if(/^Prezzo(?: di vendita)?(?: \(-\d+(?:[.,]\d+)?%\))?:/i.test(t)&&r.id!=='capitan-variants-preview')r.style.display='none';
  });
  const be=ctx.p.querySelector('#capitan-break-even-row');if(be)be.style.display='none';
}
function variantPanelWidth(data){
  const maxLen=Math.max(0,...(data.variants||[]).map(v=>clean(v.title||'').length));
  if(maxLen>55)return 'min(820px,calc(100vw - 24px))';
  if(maxLen>32)return 'min(720px,calc(100vw - 24px))';
  return 'min(620px,calc(100vw - 24px))';
}
function render(data,rates,discountRate){
  const ctx=targetContainer();if(!ctx||!data||!data.hasVariations||!Array.isArray(data.variants)||!data.variants.length)return;
  variantMode=true;
  ctx.p.style.width=variantPanelWidth(data);
  enforceVariantMode();
  ctx.p.querySelector('#capitan-variants-preview')?.remove();
  const wrap=document.createElement('div');wrap.id='capitan-variants-preview';wrap.className='row';wrap.style.padding='7px 0';
  const rows=data.variants.map(v=>{const source=Number(v.sourcePrice),sale=isFinite(source)&&source>0?Math.round(source*(1-Number(discountRate||0))*100)/100:null,be=calcBreakEven(sale,rates);return '<tr><td style="padding:7px 6px;border-bottom:1px solid #eee;vertical-align:top;overflow-wrap:anywhere;word-break:break-word">'+esc(v.title||('Variante '+v.index))+'</td><td style="padding:7px 6px;border-bottom:1px solid #eee;text-align:right;white-space:nowrap;color:#137333;font-weight:700">'+esc(money(sale,data.currency))+'</td><td style="padding:7px 6px;border-bottom:1px solid #eee;text-align:right;white-space:nowrap;color:#1668e8;font-weight:700">'+esc(money(be,data.currency))+'</td></tr>'}).join('');
  wrap.innerHTML='<div style="font-weight:700;color:#111;padding:1px 0 8px">Varianti: <span style="color:#137333">'+data.variants.length+' rilevate</span></div><div style="max-height:300px;overflow-y:auto;overflow-x:hidden;border:1px solid #e2e5e9;border-radius:8px"><table style="width:100%;table-layout:fixed;border-collapse:collapse;font-size:11px"><colgroup><col style="width:52%"><col style="width:24%"><col style="width:24%"></colgroup><thead><tr style="position:sticky;top:0;background:#fafafa;z-index:1"><th style="padding:7px 6px;text-align:left">Variante</th><th style="padding:7px 6px;text-align:right">Prezzo di vendita</th><th style="padding:7px 6px;text-align:right">Break Even Price</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
  const discount=ctx.p.querySelector('#capitan-discount-row');
  if(discount)discount.insertAdjacentElement('afterend',wrap);
  else ctx.steps.prepend(wrap);
  const obs=new MutationObserver(()=>enforceVariantMode());
  obs.observe(ctx.steps,{childList:true,subtree:true,characterData:true});
  let n=0;const timer=setInterval(()=>{n++;enforceVariantMode();if(n>120){clearInterval(timer);obs.disconnect()}},125);
}
window.addEventListener('capitan-pricing-saved',e=>{
  if(e.detail?.rates){
    currentRates=e.detail.rates;
    if(isFinite(Number(e.detail.rates.discountRate)))currentDiscount=Number(e.detail.rates.discountRate);
    if(currentData)render(currentData,currentRates,currentDiscount);
  }
});
window.addEventListener('capitan-discount-updated',e=>{
  if(isFinite(Number(e.detail?.discountRate))){
    currentDiscount=Number(e.detail.discountRate);
    if(currentData)render(currentData,currentRates,currentDiscount);
  }
});

try{
  const id=itemId();if(!/^\d{9,12}$/.test(id))return;
  const results=await Promise.all([jsonp('sell_like_variants_get',{itemId:id}),jsonp('sell_like_pricing_get')]);
  const data=results[0],pricing=results[1];
  if(!data||!data.ok)throw Error(data&&data.error?data.error:'Varianti non disponibili');
  if(!data.hasVariations)return;
  currentData=data;currentRates=pricing&&pricing.ok?pricing.rates:null;
  if(currentRates&&isFinite(Number(currentRates.discountRate)))currentDiscount=Number(currentRates.discountRate);else if(isFinite(Number(data.discountRate)))currentDiscount=Number(data.discountRate);
  render(currentData,currentRates,currentDiscount);
  window.dispatchEvent(new CustomEvent('capitan-variants-ready',{detail:{data:currentData,rates:currentRates,discountRate:currentDiscount}}));
}catch(err){console.warn('Sell Like variants preview',err)}
})();