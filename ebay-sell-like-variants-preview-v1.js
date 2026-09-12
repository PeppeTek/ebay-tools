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
function render(data,rates){
  const ctx=targetContainer();if(!ctx||!data||!data.hasVariations||!Array.isArray(data.variants)||!data.variants.length)return;
  variantMode=true;
  ctx.p.style.width=variantPanelWidth(data);
  enforceVariantMode();
  ctx.p.querySelector('#capitan-variants-preview')?.remove();
  const wrap=document.createElement('div');wrap.id='capitan-variants-preview';wrap.className='row';wrap.style.padding='7px 0';
  const rows=data.variants.map(v=>{const be=calcBreakEven(v.salePrice,rates);return '<tr><td style="padding:7px 6px;border-bottom:1px solid #eee;vertical-align:top;overflow-wrap:anywhere;word-break:break-word">'+esc(v.title||('Variante '+v.index))+'</td><td style="padding:7px 6px;border-bottom:1px solid #eee;text-align:right;white-space:nowrap;color:#137333;font-weight:700">'+esc(money(v.salePrice,data.currency))+'</td><td style="padding:7px 6px;border-bottom:1px solid #eee;text-align:right;white-space:nowrap;color:#1668e8;font-weight:700">'+esc(money(be,data.currency))+'</td></tr>'}).join('');
  wrap.innerHTML='<div style="font-weight:700;color:#111;padding:1px 0 8px">Varianti: <span style="color:#137333">'+data.variants.length+' rilevate</span></div><div style="max-height:300px;overflow-y:auto;overflow-x:hidden;border:1px solid #e2e5e9;border-radius:8px"><table style="width:100%;table-layout:fixed;border-collapse:collapse;font-size:11px"><colgroup><col style="width:52%"><col style="width:24%"><col style="width:24%"></colgroup><thead><tr style="position:sticky;top:0;background:#fafafa;z-index:1"><th style="padding:7px 6px;text-align:left">Variante</th><th style="padding:7px 6px;text-align:right">Prezzo di vendita</th><th style="padding:7px 6px;text-align:right">Break Even Price</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
  const discount=ctx.p.querySelector('#capitan-discount-row');
  if(discount)discount.insertAdjacentElement('afterend',wrap);
  else ctx.steps.prepend(wrap);
  const obs=new MutationObserver(()=>enforceVariantMode());
  obs.observe(ctx.steps,{childList:true,subtree:true,characterData:true});
  let n=0;const timer=setInterval(()=>{n++;enforceVariantMode();if(n>120){clearInterval(timer);obs.disconnect()}},125);
}
function nativeSet(el,value){if(!el)return false;const proto=el instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;const setter=Object.getOwnPropertyDescriptor(proto,'value')?.set;el.focus();setter?setter.call(el,String(value)):el.value=String(value);el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));el.blur?.();return true}
function variationEditorScope(){const dialogs=[...document.querySelectorAll('[role="dialog"]')].filter(visible);return dialogs.find(d=>/variation/i.test(clean(d.innerText||d.textContent)))||[...document.querySelectorAll('section,div')].filter(x=>!x.closest('#'+PANEL_ID)&&visible(x)).find(x=>/^variations?$/i.test(clean(x.querySelector('h2,h3,legend')?.textContent||''))&&clean(x.innerText||'').length<10000)||null}
async function openVariationEditor(){
  let scope=variationEditorScope();if(scope)return scope;
  const buttons=[...document.querySelectorAll('button,[role="button"],a')].filter(x=>visible(x)&&!x.closest('#'+PANEL_ID));
  const opener=buttons.find(x=>/create variations|add variations|edit variations/i.test(clean((x.innerText||x.textContent||'')+' '+(x.getAttribute('aria-label')||''))))||buttons.find(x=>/^variations?$/i.test(clean(x.innerText||x.textContent||'')));
  if(!opener)return null;opener.click();
  for(let i=0;i<20;i++){await sleep(250);scope=variationEditorScope();if(scope)return scope}
  return null;
}
function inputByLabel(scope,re){
  for(const l of scope.querySelectorAll('label')){if(!re.test(clean(l.innerText||l.textContent||'')))continue;let el=l.htmlFor?document.getElementById(l.htmlFor):l.querySelector('input,textarea');if(el)return el;let p=l.parentElement;for(let i=0;i<4&&p;i++,p=p.parentElement){el=p.querySelector('input,textarea');if(el)return el}}
  return [...scope.querySelectorAll('input,textarea')].find(x=>re.test(clean([x.name,x.id,x.placeholder,x.getAttribute('aria-label')].join(' '))))||null
}
async function configureDimensions(scope,data){
  if(!Array.isArray(data.dimensions)||!data.dimensions.length)return false;
  let changed=false;
  for(const dim of data.dimensions){
    const text=clean(scope.innerText||scope.textContent||'');
    if(text.includes(dim.name)&&dim.values.every(v=>text.includes(v)))continue;
    const add=[...scope.querySelectorAll('button,[role="button"],a')].filter(visible).find(x=>/add variation|add attribute|add option|create variation/i.test(clean((x.innerText||x.textContent||'')+' '+(x.getAttribute('aria-label')||''))));
    if(add){add.click();await sleep(250)}
    const nameInput=inputByLabel(scope,/variation name|attribute name|option name|^name$/i);
    const valuesInput=inputByLabel(scope,/values?|options?|choices?/i);
    if(nameInput&&valuesInput){
      nativeSet(nameInput,dim.name);
      nativeSet(valuesInput,dim.values.join(', '));
      valuesInput.dispatchEvent(new KeyboardEvent('keydown',{bubbles:true,key:'Enter',code:'Enter'}));
      valuesInput.dispatchEvent(new KeyboardEvent('keyup',{bubbles:true,key:'Enter',code:'Enter'}));
      await sleep(250);changed=true;
    }
  }
  if(changed){
    const next=[...scope.querySelectorAll('button,[role="button"]')].filter(visible).find(x=>/^(continue|next|create|save|apply|done)$/i.test(clean(x.innerText||x.textContent||'')));
    if(next){next.click();await sleep(600)}
  }
  return changed;
}
function variantKey(v){return (v.specifics||[]).map(s=>clean(s.value).toLowerCase()).filter(Boolean)}
function fillVariantGrid(data){
  const rows=[...document.querySelectorAll('tr,[role="row"],div')].filter(x=>visible(x)&&!x.closest('#'+PANEL_ID)&&clean(x.innerText||x.textContent).length<1500);
  let done=0;
  for(const v of data.variants||[]){
    const keys=variantKey(v);if(!keys.length)continue;
    const row=rows.find(r=>{const t=clean(r.innerText||r.textContent||'').toLowerCase();return keys.every(k=>t.includes(k))});
    if(!row)continue;
    const inputs=[...row.querySelectorAll('input')].filter(visible);
    const price=inputs.find(x=>/price/i.test(clean([x.name,x.id,x.placeholder,x.getAttribute('aria-label')].join(' '))))||inputs.find(x=>/\$|usd|price/i.test(clean(x.closest('td,div')?.innerText||'')));
    if(price&&v.salePrice!=null){nativeSet(price,Number(v.salePrice).toFixed(2));done++}
    const qty=inputs.find(x=>/quantity|qty/i.test(clean([x.name,x.id,x.placeholder,x.getAttribute('aria-label')].join(' '))));
    if(qty){nativeSet(qty,'3')}
  }
  return done;
}
async function applyVariantsToEditor(data){
  try{
    let scope=await openVariationEditor();if(!scope)return false;
    await configureDimensions(scope,data);
    for(let i=0;i<12;i++){const n=fillVariantGrid(data);if(n>=Math.min((data.variants||[]).length,1))return true;await sleep(350)}
    return false;
  }catch(err){console.warn('Sell Like variants editor update',err);return false}
}
try{
  const id=itemId();if(!/^\d{9,12}$/.test(id))return;
  const results=await Promise.all([jsonp('sell_like_variants_get',{itemId:id}),jsonp('sell_like_pricing_get')]);
  const data=results[0],pricing=results[1];
  if(!data||!data.ok)throw Error(data&&data.error?data.error:'Varianti non disponibili');
  if(!data.hasVariations)return;
  render(data,pricing&&pricing.ok?pricing.rates:null);
  await applyVariantsToEditor(data);
}catch(err){console.warn('Sell Like variants preview',err)}
})();