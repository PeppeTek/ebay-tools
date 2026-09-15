javascript:(()=>{
'use strict';
const PANEL_ID='capitan-sell-like-clone';
const ENDPOINT_KEY='pep-ebay-bs-v6-google-url';
const DISCOUNT_KEY='capitan-sell-like-discount-rate-v1';
let discountRate=.02,reverseSaveTimer=null;
const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
function endpoint(){return String(localStorage.getItem(ENDPOINT_KEY)||'').replace(/\/+$/,'')}
function jsonpAction(action,params){const ep=endpoint();return new Promise((resolve,reject)=>{if(!ep)return reject(Error('Endpoint Apps Script non configurato'));const cb='__capitanDiscountCb_'+Date.now()+'_'+Math.floor(Math.random()*1e6),s=document.createElement('script'),t=setTimeout(()=>done(Error('Timeout backend')),30000);function done(err,val){clearTimeout(t);try{delete window[cb]}catch(_){window[cb]=undefined}s.remove();err?reject(err):resolve(val)}window[cb]=v=>done(null,v);s.onerror=()=>done(Error('Backend non raggiungibile'));const q=new URLSearchParams({action,callback:cb,_:Date.now().toString(),...(params||{})});s.src=ep+(ep.includes('?')?'&':'?')+q.toString();document.head.appendChild(s)})}
function discountText(){const n=Number(discountRate||0)*100;return (Math.round(n*100)/100).toLocaleString('it-IT',{minimumFractionDigits:Number.isInteger(n)?0:2,maximumFractionDigits:2})+'%'}
function discountNumber(){return Math.round(Number(discountRate||0)*10000)/100}
function storeDiscount(){try{localStorage.setItem(DISCOUNT_KEY,String(discountRate))}catch(_){}}
function emitDiscount(){storeDiscount();window.dispatchEvent(new CustomEvent('capitan-discount-updated',{detail:{discountRate}}))}
async function persistDiscount(){
  try{
    const d=await jsonpAction('sell_like_pricing_get');const r=d&&d.rates||{};
    const params={
      discountRate:String(discountRate),
      ebayFee:String(Number(r.ebayFee??.136)),
      internationalFee:String(Number(r.internationalFee??.016)),
      marketingFee:String(Number(r.marketingFee??.02)),
      vatOnFees:String(Number(r.vatOnFees??.22)),
      salesTaxEstimate:String(Number(r.salesTaxEstimate??.06)),
      fixedFee:String(Number(r.fixedFee??.40))
    };
    const saved=await jsonpAction('sell_like_pricing_save',params);
    if(saved&&saved.ok&&saved.rates)window.dispatchEvent(new CustomEvent('capitan-pricing-saved',{detail:{rates:saved.rates}}))
  }catch(e){console.warn('Discount save',e)}
}
function numericDiscountInput(v){return Number(String(v??'').replace('%','').replace(',','.').trim())}
function applyDiscountPct(v,persist){
  const pct=numericDiscountInput(v);
  if(!isFinite(pct)||pct<=-1000||pct>=100)return false;
  discountRate=pct/100;emitDiscount();cleanup();if(persist)persistDiscount();return true
}
function formatDiscountField(){const n=discountNumber();const s=String(Math.abs(n)).replace('.',',');return (n>0?'+':n<0?'-':'')+s+'%'}
function cleanup(){
  const p=document.getElementById(PANEL_ID);if(!p)return false;
  const rows=[...p.querySelectorAll('#steps .row')];
  rows.forEach(r=>{
    const t=clean(r.innerText||r.textContent||'');
    if(/^(Titolo\s*\/\s*Item Specifics|Titolo|Title|Categoria|Category|Item Specifics|Policy|Policies)\b/i.test(t))r.remove();
  });
  [...p.querySelectorAll('.row.muted,.row')].forEach(r=>{
    const t=clean(r.innerText||r.textContent||'');
    if(/^Titolo, categoria, Item Specifics e policy non vengono toccati\. Il pulsante [“"]List it[”"] resta manuale\.?$/i.test(t))r.remove();
  });

  // Dynamic discount control in the main console.
  let discountRow=p.querySelector('#capitan-discount-row');
  const sourceRow=[...p.querySelectorAll('.b > .row, .row')].find(r=>/^Source Item ID:/i.test(clean(r.innerText||r.textContent||'')));
  if(!discountRow&&sourceRow){
    discountRow=document.createElement('div');
    discountRow.id='capitan-discount-row';
    discountRow.className='row';
    discountRow.style.cssText='display:grid;grid-template-columns:minmax(0,1fr) 82px 104px;align-items:center;gap:8px;min-height:38px';
    discountRow.innerHTML='<b>Riduzione prezzo rispetto alla concorrenza:</b><input id="capitan-discount-manual" type="text" inputmode="decimal" aria-label="Riduzione prezzo percentuale" placeholder="%" style="width:82px;height:28px;box-sizing:border-box;border:1px solid #c5c9cf;border-radius:7px;padding:0 7px;text-align:right;font-size:12px;background:#fff;color:#111"><span id="capitan-competitor-price" style="justify-self:end;text-align:right;white-space:nowrap;color:#7a1f2b;font-weight:700">—</span>';
    sourceRow.insertAdjacentElement('afterend',discountRow);
    const input=discountRow.querySelector('#capitan-discount-manual');
    input.value=formatDiscountField();
    input.addEventListener('focus',()=>{input.value=String(discountNumber()).replace('.',',');input.select()});
    input.addEventListener('change',()=>{if(applyDiscountPct(input.value,true))input.value=formatDiscountField()});
    input.addEventListener('blur',()=>{if(applyDiscountPct(input.value,true))input.value=formatDiscountField();else input.value=formatDiscountField()});
    input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();input.blur()}});
    input.addEventListener('click',e=>e.stopPropagation());
  }else if(discountRow){
    const input=discountRow.querySelector('#capitan-discount-manual');
    if(input&&document.activeElement!==input)input.value=formatDiscountField();
  }

  const competitor=p.querySelector('#capitan-competitor-price');
  if(competitor){
    const source=Number(window.__capitanSellLikeSourcePrice||window.__capitanSellLikeCloneData?.sourcePrice);
    competitor.textContent=isFinite(source)&&source>0?source.toFixed(2)+' USD':'—';
  }

  // Sale-price row: percentage is no longer repeated in the label/value.
  const priceRow=[...p.querySelectorAll('#steps .row')].find(r=>/^Prezzo(?: di vendita)?(?: \(-\d+(?:[.,]\d+)?%\))?:/i.test(clean(r.innerText||r.textContent||'')));
  if(priceRow){
    const b=priceRow.querySelector('b');
    if(b)b.textContent='Prezzo di vendita:';
    const spans=[...priceRow.querySelectorAll('span')];
    const value=spans.find(s=>/\d/.test(clean(s.textContent||'')))||spans[0];
    if(value){
      let t=clean(value.textContent||'').replace(/\s*\(-\d+(?:[.,]\d+)?%\)\s*$/i,'');
      if(/^\d+(?:[.,]\d+)?$/i.test(t))t=t+' USD';
      value.textContent=' '+t;
    }
  }

  // Break Even value: blue and bold.
  const be=p.querySelector('#capitan-break-even-value');
  if(be){be.style.color='#1668e8';be.style.fontWeight='700';}

  // Completion message: compact vertical spacing, aligned with the other rows.
  const status=p.querySelector('#st');
  if(status){
    status.style.borderTop='0';
    status.style.padding='4px 14px';
    status.style.margin='0';
    status.style.lineHeight='1.3';
  }

  return true;
}
let n=0;const t=setInterval(()=>{n++;cleanup();if(n>120)clearInterval(t)},125);
window.addEventListener('capitan-break-even-updated',cleanup);
window.addEventListener('capitan-pricing-saved',e=>{
  const dr=Number(e.detail?.rates?.discountRate);
  if(isFinite(dr)&&dr>-10&&dr<1)discountRate=dr;
  emitDiscount();cleanup()
});
window.addEventListener('capitan-discount-reverse-updated',e=>{
  const dr=Number(e.detail?.discountRate);
  if(!isFinite(dr)||dr<=-10||dr>=1)return;
  discountRate=dr;storeDiscount();cleanup();
  clearTimeout(reverseSaveTimer);reverseSaveTimer=setTimeout(()=>persistDiscount(),700)
});
cleanup();
(async()=>{try{
  const d=await jsonpAction('sell_like_pricing_get');
  const remote=Number(d?.rates?.discountRate),local=Number(localStorage.getItem(DISCOUNT_KEY));
  if(d&&d.ok&&isFinite(remote)&&remote>-10&&remote<1)discountRate=remote;
  else if(isFinite(local)&&local>-10&&local<1)discountRate=local;
  else discountRate=.02
}catch(e){
  console.warn('Sell Like discount load',e);
  try{const local=Number(localStorage.getItem(DISCOUNT_KEY));discountRate=isFinite(local)&&local>-10&&local<1?local:.02}catch(_){discountRate=.02}
}
emitDiscount();cleanup()})();
})();