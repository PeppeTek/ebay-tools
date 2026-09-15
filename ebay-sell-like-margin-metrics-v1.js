javascript:(()=>{
'use strict';
const PANEL_ID='capitan-sell-like-clone';
const PATCH_ID='capitan-margin-metrics-v6';
if(document.getElementById(PATCH_ID))return;
const marker=document.createElement('span');marker.id=PATCH_ID;marker.style.display='none';document.documentElement.appendChild(marker);
const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
const money=n=>isFinite(n)?`${n.toFixed(2)} USD`:'—';
let manualPurchaseCost=null;

function panel(){return document.getElementById(PANEL_ID)}
function rows(){const p=panel();return p?[...p.querySelectorAll('#steps .row')]:[]}
function parseNumber(text,re){const m=clean(text).match(re);return m?Number(String(m[1]).replace(',','.')):null}
function salePrice(){const r=rows().find(x=>/^Prezzo(?: di vendita)?(?: \(-\d+(?:[.,]\d+)?%\))?:/i.test(clean(x.innerText||x.textContent)));const dom=r?parseNumber(r.innerText||r.textContent,/Prezzo(?: di vendita)?(?: \(-\d+(?:[.,]\d+)?%\))?:\s*([0-9]+(?:[.,][0-9]+)?)/i):null;const global=Number(window.__capitanSellLikeSalePrice);return isFinite(dom)&&dom>0?dom:(isFinite(global)&&global>0?global:null)}
function breakEven(){const p=panel();const el=p?.querySelector('#capitan-break-even-value');if(!el)return null;return parseNumber(el.textContent||'',/([0-9]+(?:[.,][0-9]+)?)/)}
function selectedSourcingCost(){
  if(isFinite(manualPurchaseCost)&&manualPurchaseCost>0)return manualPurchaseCost;
  const p=panel();if(!p)return null;
  const checked=[...p.querySelectorAll('input.capitan-amazon-choice:checked,input.capitan-aliexpress-choice:checked')];
  const totals=checked.map(ch=>{
    const label=ch.closest('label');if(!label)return null;
    const total=Number(label.dataset.totalCost);
    if(isFinite(total)&&total>0)return total;
    const price=Number(label.dataset.sourcePrice),shipping=Number(label.dataset.shippingCost);
    if(isFinite(price)&&price>0&&isFinite(shipping)&&shipping>=0)return price+shipping;
    const spans=[...label.querySelectorAll('span')];
    const txt=clean((spans[spans.length-1]?.textContent)||label.textContent||'');
    const m=txt.match(/([0-9]+(?:[.,][0-9]+)?)\s*(?:USD|EUR|GBP|CAD|AUD)?\s*$/i);
    return m?Number(String(m[1]).replace(',','.')):null
  }).filter(v=>isFinite(v));
  return totals.length?Math.min(...totals):null
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
  if(span){span.textContent=rounded.toFixed(2)+' USD';colorValue(span,rounded)}
  const field=findEbayPriceField();
  if(field)setNativeInputValue(field,rounded.toFixed(2));
  window.__capitanSellLikeSalePrice=rounded;
  const source=Number(window.__capitanSellLikeSourcePrice||window.__capitanSellLikeCloneData?.sourcePrice);
  let reverseDiscount=null;
  if(isFinite(source)&&source>0){
    const dr=(rounded/source)-1;
    if(isFinite(dr)&&dr>-10&&dr<1)reverseDiscount=dr
  }
  try{window.dispatchEvent(new CustomEvent('capitan-sale-price-updated',{detail:{value:rounded,sourcePrice:source,discountRate:reverseDiscount,origin:'manual'}}))}catch(_){}
  if(reverseDiscount!=null){
    try{window.dispatchEvent(new CustomEvent('capitan-discount-reverse-updated',{detail:{discountRate:reverseDiscount,salePrice:rounded,sourcePrice:source}}))}catch(_){}
  }
  setTimeout(refresh,0);
  return true
}
function updateSalePriceLabel(){
  const r=rows().find(x=>/^Prezzo(?: di vendita)?(?: \(-?\d+(?:[.,]\d+)?%\))?:/i.test(clean(x.innerText||x.textContent)));
  if(!r)return;
  r.id='capitan-sale-price-row';
  const b=r.querySelector('b');if(b)b.textContent='Prezzo di vendita:';
  let span=[...r.querySelectorAll('span')].find(x=>x.id!=='capitan-sale-price-editor')||null;
  if(!span){
    const nodes=[...r.childNodes].filter(n=>n.nodeType===3&&clean(n.textContent));
    if(nodes.length){span=document.createElement('span');span.textContent=clean(nodes.map(n=>n.textContent).join(' '));nodes.forEach(n=>n.remove());r.appendChild(span)}
  }
  let current=null;
  if(span){
    const t=clean(span.textContent||'').replace(/\s*\(-?\d+(?:[.,]\d+)?%\)\s*$/i,'');
    current=parseNumber(t,/([0-9]+(?:[.,][0-9]+)?)/);
    if(isFinite(current)){span.textContent=Number(current).toFixed(2)+' USD';colorValue(span,current)}
    span.style.gridColumn='3';span.style.justifySelf='end';span.style.textAlign='right';span.style.whiteSpace='nowrap'
  }
  r.style.display='grid';r.style.gridTemplateColumns='minmax(0,1fr) 82px 104px';r.style.alignItems='center';r.style.gap='8px';r.style.minHeight='38px';
  if(b)b.style.gridColumn='1';
  let input=r.querySelector('#capitan-sale-price-manual');
  if(!input){
    input=document.createElement('input');
    input.id='capitan-sale-price-manual';
    input.type='text';input.inputMode='decimal';
    input.title='Modifica manualmente il prezzo di vendita';
    input.style.cssText='grid-column:2;width:82px;height:28px;box-sizing:border-box;border:1px solid #111;border-radius:7px;padding:0 7px;text-align:right;font-size:12px;background:#fff;color:#111';
    if(isFinite(current))input.value=Number(current).toFixed(2);
    input.addEventListener('focus',()=>input.select());
    input.addEventListener('change',()=>{if(applyManualSalePrice(input.value,r,span,input))input.value=Number(String(input.value).replace(',','.')).toFixed(2)});
    input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();input.blur()}});
    input.addEventListener('click',e=>e.stopPropagation());
    if(span)r.insertBefore(input,span);else r.appendChild(input)
  }else{
    input.style.gridColumn='2';
    if(isFinite(current)&&document.activeElement!==input)input.value=Number(current).toFixed(2)
  }
}
function removeMetricRows(){return}
function styleMetricRow(r){
  if(!r)return;
  r.style.display='grid';r.style.gridTemplateColumns='minmax(0,1fr) 82px 104px';r.style.alignItems='center';r.style.gap='8px';r.style.minHeight='38px';
  const b=r.querySelector('b');if(b)b.style.gridColumn='1';
  const val=r.querySelector('[data-value],#capitan-break-even-value');
  if(val){val.style.gridColumn='3';val.style.justifySelf='end';val.style.textAlign='right';val.style.whiteSpace='nowrap'}
}
function ensureRows(){
  const p=panel();const steps=p?.querySelector('#steps');if(!steps)return null;
  updateSalePriceLabel();
  p.querySelector('#capitan-margin-amazon')?.remove();
  const be=p.querySelector('#capitan-break-even-row');if(!be)return p;
  let fee=p.querySelector('#capitan-margin-break');
  if(!fee){fee=document.createElement('div');fee.id='capitan-margin-break';fee.className='row';fee.innerHTML='<b>Costo stimato delle tariffe:</b> <span data-value>—</span>'}
  const priceRow=p.querySelector('#capitan-sale-price-row');
  if(priceRow&&fee.previousElementSibling!==priceRow)priceRow.insertAdjacentElement('afterend',fee);
  if(fee.nextElementSibling!==be)fee.insertAdjacentElement('afterend',be);

  let purchase=p.querySelector('#capitan-margin-source');
  if(!purchase){
    purchase=document.createElement('div');purchase.id='capitan-margin-source';purchase.className='row';
    purchase.innerHTML='<b>Costo totale d\'acquisto:</b><input id="capitan-purchase-cost-manual" type="text" inputmode="decimal" placeholder="manuale" title="Costo totale d\'acquisto manuale"><span data-value>—</span>';
    const input=purchase.querySelector('#capitan-purchase-cost-manual');
    input.style.cssText='grid-column:2;width:82px;height:28px;box-sizing:border-box;border:1px solid #111;border-radius:7px;padding:0 7px;text-align:right;font-size:12px;background:#fff;color:#111';
    const commit=()=>{
      const raw=String(input.value||'').trim();
      if(!raw){manualPurchaseCost=null;input.dataset.manual='0';refresh();return}
      const n=Number(raw.replace(',','.'));
      if(!isFinite(n)||n<=0){input.value='';manualPurchaseCost=null;input.dataset.manual='0';refresh();return}
      manualPurchaseCost=Math.round(n*100)/100;input.dataset.manual='1';input.value=manualPurchaseCost.toFixed(2);refresh()
    };
    input.addEventListener('change',commit);input.addEventListener('blur',commit);
    input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();input.blur()}});
    input.addEventListener('click',e=>e.stopPropagation())
  }
  if(be.nextElementSibling!==purchase)be.insertAdjacentElement('afterend',purchase);

  let profit=p.querySelector('#capitan-margin-delta');
  if(!profit){profit=document.createElement('div');profit.id='capitan-margin-delta';profit.className='row';profit.innerHTML='<b>Il mio utile netto:</b> <span data-value>—</span>'}
  if(purchase.nextElementSibling!==profit)purchase.insertAdjacentElement('afterend',profit);

  const pb=profit.querySelector('b');if(pb)pb.textContent='Il mio utile netto:';
  const fb=fee.querySelector('b');if(fb)fb.textContent='Costo stimato delle tariffe:';
  const cb=purchase.querySelector('b');if(cb)cb.textContent="Costo totale d'acquisto:";
  [fee,be,purchase,profit].forEach(styleMetricRow);
  return p
}
function setMetric(p,id,val){
  const row=p.querySelector('#'+id),el=row?.querySelector('[data-value]');if(!el)return;
  el.textContent=money(val);el.style.justifySelf='end';el.style.textAlign='right';el.style.fontWeight=isFinite(val)?'700':'400';
  if(id==='capitan-margin-break'||id==='capitan-margin-source')el.style.color=isFinite(val)?'#ff4747':'';
  else colorValue(el,val);
  if(id==='capitan-margin-source'){
    const input=row.querySelector('#capitan-purchase-cost-manual');
    if(input&&input.dataset.manual!=='1'&&document.activeElement!==input)input.value=isFinite(val)&&val>0?Number(val).toFixed(2):''
  }
}
function refresh(){
  const p=ensureRows();if(!p)return false;
  const sale=salePrice(),be=breakEven(),cost=selectedSourcingCost();
  const estimatedFees=(isFinite(sale)&&sale>0&&isFinite(be))?sale-be:null;
  const netVsBreakEven=(isFinite(be)&&isFinite(cost))?be-cost:null;
  setMetric(p,'capitan-margin-break',estimatedFees);
  setMetric(p,'capitan-margin-source',cost);
  setMetric(p,'capitan-margin-delta',netVsBreakEven);
  return isFinite(sale)&&sale>0&&isFinite(be);
}

document.addEventListener('change',e=>{if(e.target&&e.target.matches('input.capitan-amazon-choice,input.capitan-aliexpress-choice'))setTimeout(refresh,0)},true);
document.addEventListener('click',e=>{if(e.target&&e.target.closest('#capitan-amazon-best-match,#capitan-aliexpress-best-match')){let n=0;const t=setInterval(()=>{n++;refresh();if(n>120)clearInterval(t)},250)}},true);
window.addEventListener('capitan-pricing-saved',()=>setTimeout(refresh,0));
window.addEventListener('capitan-break-even-updated',()=>setTimeout(refresh,0));
updateSalePriceLabel();
let metricTries=0;const metricTimer=setInterval(()=>{metricTries++;if(refresh()||metricTries>160)clearInterval(metricTimer)},100);
})();