javascript:(()=>{
'use strict';
const PANEL_ID='capitan-sell-like-clone';
const PATCH_ID='capitan-margin-metrics-v2';
if(document.getElementById(PATCH_ID))return;
const marker=document.createElement('span');marker.id=PATCH_ID;marker.style.display='none';document.documentElement.appendChild(marker);
const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
const money=n=>isFinite(n)?`${n.toFixed(2)} USD`:'—';

function panel(){return document.getElementById(PANEL_ID)}
function rows(){const p=panel();return p?[...p.querySelectorAll('#steps .row')]:[]}
function parseNumber(text,re){const m=clean(text).match(re);return m?Number(String(m[1]).replace(',','.')):null}
function salePrice(){const r=rows().find(x=>/^Prezzo(?: di vendita \(-2%\))?:/i.test(clean(x.innerText||x.textContent)));return r?parseNumber(r.innerText||r.textContent,/Prezzo(?: di vendita \(-2%\))?:\s*([0-9]+(?:[.,][0-9]+)?)/i):null}
function breakEven(){const p=panel();const el=p?.querySelector('#capitan-break-even-value');if(!el)return null;return parseNumber(el.textContent||'',/([0-9]+(?:[.,][0-9]+)?)/)}
function selectedAmazonCost(){const p=panel();if(!p)return null;const vals=[...p.querySelectorAll('input.capitan-amazon-choice:checked')].map(ch=>{const label=ch.closest('label');if(!label)return null;const spans=[...label.querySelectorAll('span')];const txt=clean((spans[spans.length-1]?.textContent)||label.textContent||'');const m=txt.match(/([0-9]+(?:[.,][0-9]+)?)\s*(?:USD|EUR|GBP|CAD|AUD)?\s*$/i);return m?Number(String(m[1]).replace(',','.')):null}).filter(v=>isFinite(v));return vals.length?Math.min(...vals):null}
function ensureRows(){
  const p=panel();const steps=p?.querySelector('#steps');if(!steps)return null;
  const priceRow=rows().find(r=>/^Prezzo:/i.test(clean(r.innerText||r.textContent))||/^Prezzo di vendita \(-2%\):/i.test(clean(r.innerText||r.textContent)));
  if(priceRow){const b=priceRow.querySelector('b');if(b&&b.textContent!=='Prezzo di vendita (-2%):')b.textContent='Prezzo di vendita (-2%):'}
  let be=p.querySelector('#capitan-break-even-row');if(!be)return null;
  const defs=[
    ['capitan-margin-break','Margine netto rispetto break price'],
    ['capitan-margin-amazon','Margine netto rispetto al costo di acquisto'],
    ['capitan-margin-delta','Delta fra i due margini']
  ];
  let anchor=be;
  defs.forEach(([id,label])=>{let r=p.querySelector('#'+id);if(!r){r=document.createElement('div');r.id=id;r.className='row';r.innerHTML=`<b>${label}:</b> <span data-value>—</span>`;anchor.insertAdjacentElement('afterend',r)}anchor=r});
  return p;
}
function setMetric(p,id,val,dynamic=false){
  const el=p.querySelector('#'+id+' [data-value]');if(!el)return;
  const nextText=money(val), nextWeight=(dynamic&&val==null)?'400':'700', nextColor=isFinite(val)?(val<0?'#b42318':'#137333'):'';
  if(el.textContent!==nextText)el.textContent=nextText;
  if(el.style.fontWeight!==nextWeight)el.style.fontWeight=nextWeight;
  if(el.style.color!==nextColor)el.style.color=nextColor;
}
function refresh(){
  const p=ensureRows();if(!p)return false;
  const sale=salePrice(),be=breakEven(),cost=selectedAmazonCost();
  const mBreak=(isFinite(sale)&&isFinite(be))?sale-be:null;
  const mAmazon=(isFinite(cost)&&isFinite(sale))?cost-sale:null;
  const delta=(isFinite(mBreak)&&isFinite(mAmazon))?mBreak-mAmazon:null;
  setMetric(p,'capitan-margin-break',mBreak);
  setMetric(p,'capitan-margin-amazon',mAmazon,true);
  setMetric(p,'capitan-margin-delta',delta,true);
  return isFinite(sale)&&isFinite(be);
}

document.addEventListener('change',e=>{if(e.target&&e.target.matches('input.capitan-amazon-choice'))setTimeout(refresh,0)},true);
window.addEventListener('capitan-pricing-saved',()=>setTimeout(refresh,0));
window.addEventListener('capitan-amazon-matches-rendered',()=>setTimeout(refresh,0));
let tries=0;const timer=setInterval(()=>{tries++;refresh();if(tries>250)clearInterval(timer)},150);
refresh();
})();