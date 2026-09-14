javascript:(()=>{
'use strict';
const PANEL_ID='capitan-sell-like-clone';
const PATCH_ID='capitan-margin-metrics-v6';
if(document.getElementById(PATCH_ID))return;
const marker=document.createElement('span');marker.id=PATCH_ID;marker.style.display='none';document.documentElement.appendChild(marker);
const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
const money=n=>isFinite(n)?`${n.toFixed(2)} USD`:'—';

function panel(){return document.getElementById(PANEL_ID)}
function rows(){const p=panel();return p?[...p.querySelectorAll('#steps .row')]:[]}
function parseNumber(text,re){const m=clean(text).match(re);return m?Number(String(m[1]).replace(',','.')):null}
function salePrice(){const r=rows().find(x=>/^Prezzo(?: di vendita)?(?: \(-\d+(?:[.,]\d+)?%\))?:/i.test(clean(x.innerText||x.textContent)));return r?parseNumber(r.innerText||r.textContent,/Prezzo(?: di vendita)?(?: \(-\d+(?:[.,]\d+)?%\))?:\s*([0-9]+(?:[.,][0-9]+)?)/i):null}
function breakEven(){const p=panel();const el=p?.querySelector('#capitan-break-even-value');if(!el)return null;return parseNumber(el.textContent||'',/([0-9]+(?:[.,][0-9]+)?)/)}
function selectedSourcingCost(){
  const p=panel();if(!p)return null;
  const checked=[...p.querySelectorAll('input.capitan-amazon-choice:checked,input.capitan-aliexpress-choice:checked')];
  const vals=checked.map(ch=>{
    const label=ch.closest('label');if(!label)return null;
    const spans=[...label.querySelectorAll('span')];
    const txt=clean((spans[spans.length-1]?.textContent)||label.textContent||'');
    const m=txt.match(/([0-9]+(?:[.,][0-9]+)?)\s*(?:USD|EUR|GBP|CAD|AUD)?\s*$/i);
    return m?Number(String(m[1]).replace(',','.')):null
  }).filter(v=>isFinite(v));
  return vals.length?Math.min(...vals):null
}
function hasSourcingResults(){
  const p=panel();
  return !!p?.querySelector('input.capitan-amazon-choice,input.capitan-aliexpress-choice')
}
function colorValue(el,val){if(!el)return;el.style.fontWeight=isFinite(val)?'700':'400';el.style.color=isFinite(val)?(val<0?'#b42318':'#137333'):''}
function findEbayPriceField(){
  const labelRe=/^(price|buy it now price|fixed price)$/i;
  for(const l of document.querySelectorAll('label')){
    const t=clean(l.innerText||l.textContent);
    if(!labelRe.test(t))continue;
    let el=l.htmlFor?document.getElementById(l.htmlFor):l.querySelector('input');
    if(el)return el;
    let p=l.parentElement;
    for(let i=0;i<4&&p;i++,p=p.parentElement){el=p.querySelector('input');if(el)return el}
  }
  return [...document.querySelectorAll('input')].find(el=>/(^|\b)(price|binprice|startprice)(\b|$)/i.test(clean([el.name,el.id,el.getAttribute('aria-label'),el.placeholder].join(' '))))||null
}
function setNativeInputValue(el,value){
  if(!el)return false;
  const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')?.set;
  const old=el.value;
  if(setter)setter.call(el,String(value));else el.value=String(value);
  if(el._valueTracker&&typeof el._valueTracker.setValue==='function')el._valueTracker.setValue(old);
  el.dispatchEvent(new Event('input',{bubbles:true}));
  el.dispatchEvent(new Event('change',{bubbles:true}));
  el.blur?.();
  return true
}
function applyManualSalePrice(value,row,span,input){
  const n=Number(String(value).replace(',','.'));
  if(!isFinite(n)||n<=0)return false;
  const rounded=Math.round(n*100)/100;
  if(span){span.textContent=' '+rounded.toFixed(2)+' USD';colorValue(span,rounded)}
  if(input&&document.activeElement!==input)input.value=rounded.toFixed(2);
  const field=findEbayPriceField();
  if(field)setNativeInputValue(field,rounded.toFixed(2));
  window.__capitanSellLikeSalePrice=rounded;
  try{window.dispatchEvent(new CustomEvent('capitan-sale-price-updated',{detail:{value:rounded}}))}catch(_){}
  setTimeout(refresh,0);
  return true
}
function updateSalePriceLabel(){
  const r=rows().find(x=>/^Prezzo(?: di vendita)?(?: \(-\d+(?:[.,]\d+)?%\))?:/i.test(clean(x.innerText||x.textContent)));
  if(!r)return;
  const b=r.querySelector('b');if(b)b.textContent='Prezzo di vendita:';
  let span=[...r.querySelectorAll('span')].find(x=>x.id!=='capitan-sale-price-editor')||null;
  if(!span){
    const nodes=[...r.childNodes].filter(n=>n.nodeType===3&&clean(n.textContent));
    if(nodes.length){span=document.createElement('span');span.textContent=' '+clean(nodes.map(n=>n.textContent).join(' '));nodes.forEach(n=>n.remove());r.appendChild(span)}
  }
  let current=null;
  if(span){
    let t=clean(span.textContent||'').replace(/\s*\(-\d+(?:[.,]\d+)?%\)\s*$/i,'');
    current=parseNumber(t,/([0-9]+(?:[.,][0-9]+)?)/);
    if(isFinite(current)){span.textContent=' '+Number(current).toFixed(2)+' USD';colorValue(span,current)}
  }
  r.style.display='flex';r.style.alignItems='center';r.style.gap='8px';
  let input=r.querySelector('#capitan-sale-price-manual');
  if(!input){
    input=document.createElement('input');
    input.id='capitan-sale-price-manual';
    input.type='text';
    input.inputMode='decimal';
    input.title='Modifica manualmente il prezzo di vendita';
    input.style.cssText='margin-left:auto;width:82px;height:28px;box-sizing:border-box;border:1px solid #b7b7b7;border-radius:7px;padding:0 7px;text-align:right;font-size:12px;background:#fff;color:#111';
    if(isFinite(current))input.value=Number(current).toFixed(2);
    input.addEventListener('input',()=>applyManualSalePrice(input.value,r,span,input));
    input.addEventListener('change',()=>{if(applyManualSalePrice(input.value,r,span,input))input.value=Number(String(input.value).replace(',','.')).toFixed(2)});
    input.addEventListener('click',e=>e.stopPropagation());
    r.appendChild(input)
  }else if(isFinite(current)&&document.activeElement!==input){
    input.value=Number(current).toFixed(2)
  }
}
function removeMetricRows(){const p=panel();['capitan-margin-break','capitan-margin-amazon','capitan-margin-delta'].forEach(id=>p?.querySelector('#'+id)?.remove())}
function ensureRows(){
  const p=panel();const steps=p?.querySelector('#steps');if(!steps)return null;
  updateSalePriceLabel();
  p.querySelector('#capitan-margin-amazon')?.remove();
  if(!hasSourcingResults()){removeMetricRows();return p}
  const be=p.querySelector('#capitan-break-even-row');if(!be)return p;
  const defs=[
    ['capitan-margin-break','Costo tariffe stimato'],
    ['capitan-margin-delta','Utile netto rispetto al Break Even Price']
  ];
  let anchor=be;
  defs.forEach(([id,label])=>{let r=p.querySelector('#'+id);if(!r){r=document.createElement('div');r.id=id;r.className='row';r.innerHTML=`<b>${label}:</b> <span data-value>—</span>`;anchor.insertAdjacentElement('afterend',r)}else{const b=r.querySelector('b');if(b)b.textContent=label+':'}anchor=r});
  return p;
}
function setMetric(p,id,val){const el=p.querySelector('#'+id+' [data-value]');if(!el)return;el.textContent=money(val);colorValue(el,val)}
function refresh(){
  const p=ensureRows();if(!p||!hasSourcingResults())return false;
  const sale=salePrice(),be=breakEven(),cost=selectedSourcingCost();
  const estimatedFees=(isFinite(sale)&&isFinite(be))?sale-be:null;
  const netVsBreakEven=(isFinite(be)&&isFinite(cost))?be-cost:null;
  setMetric(p,'capitan-margin-break',estimatedFees);
  setMetric(p,'capitan-margin-delta',netVsBreakEven);
  return isFinite(sale)&&isFinite(be)&&isFinite(cost);
}

document.addEventListener('change',e=>{if(e.target&&e.target.matches('input.capitan-amazon-choice,input.capitan-aliexpress-choice'))setTimeout(refresh,0)},true);
document.addEventListener('click',e=>{if(e.target&&e.target.closest('#capitan-amazon-find,#capitan-aliexpress-find')){removeMetricRows();let n=0;const t=setInterval(()=>{n++;if(hasSourcingResults()){refresh();clearInterval(t)}else if(n>120)clearInterval(t)},250)}},true);
window.addEventListener('capitan-pricing-saved',()=>setTimeout(refresh,0));
window.addEventListener('capitan-break-even-updated',()=>setTimeout(refresh,0));
removeMetricRows();updateSalePriceLabel();
})();