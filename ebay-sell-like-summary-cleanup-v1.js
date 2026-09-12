javascript:(()=>{
'use strict';
const PANEL_ID='capitan-sell-like-clone';
const ENDPOINT_KEY='pep-ebay-bs-v6-google-url';
let discountRate=.02;
const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
function endpoint(){return String(localStorage.getItem(ENDPOINT_KEY)||'').replace(/\/+$/,'')}
function jsonpAction(action){const ep=endpoint();return new Promise((resolve,reject)=>{if(!ep)return reject(Error('Endpoint Apps Script non configurato'));const cb='__capitanDiscountCb_'+Date.now()+'_'+Math.floor(Math.random()*1e6),s=document.createElement('script'),t=setTimeout(()=>done(Error('Timeout backend')),30000);function done(err,val){clearTimeout(t);try{delete window[cb]}catch(_){window[cb]=undefined}s.remove();err?reject(err):resolve(val)}window[cb]=v=>done(null,v);s.onerror=()=>done(Error('Backend non raggiungibile'));const q=new URLSearchParams({action,callback:cb,_:Date.now().toString()});s.src=ep+(ep.includes('?')?'&':'?')+q.toString();document.head.appendChild(s)})}
function discountText(){const n=Number(discountRate||0)*100;return (Math.round(n*100)/100).toLocaleString('it-IT',{minimumFractionDigits:Number.isInteger(n)?0:2,maximumFractionDigits:2})+'%'}
function cleanup(){
  const p=document.getElementById(PANEL_ID);if(!p)return false;
  const rows=[...p.querySelectorAll('#steps .row')];
  rows.forEach(r=>{
    const t=clean(r.innerText||r.textContent||'');
    if(/^(Titolo\s*\/\s*Item Specifics|Titolo|Title|Categoria|Category|Item Specifics|Policy|Policies)\b/i.test(t))r.remove();
  });

  // Keep discount percentage on its own static row, for mono and variant layouts.
  let discountRow=p.querySelector('#capitan-discount-row');
  const sourceRow=[...p.querySelectorAll('.b > .row, .row')].find(r=>/^Source Item ID:/i.test(clean(r.innerText||r.textContent||'')));
  if(!discountRow&&sourceRow){
    discountRow=document.createElement('div');
    discountRow.id='capitan-discount-row';
    discountRow.className='row';
    discountRow.innerHTML='<b>Riduzione prezzo rispetto alla concorrenza:</b> <span class="ok">'+discountText()+'</span>';
    sourceRow.insertAdjacentElement('afterend',discountRow);
  }else if(discountRow){
    const span=discountRow.querySelector('span');
    if(span){span.textContent=discountText();span.className='ok';}
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
window.addEventListener('capitan-pricing-saved',e=>{if(e.detail?.rates&&isFinite(Number(e.detail.rates.discountRate)))discountRate=Number(e.detail.rates.discountRate);cleanup();window.dispatchEvent(new CustomEvent('capitan-discount-updated',{detail:{discountRate}}))});
cleanup();
(async()=>{try{const d=await jsonpAction('sell_like_pricing_get');if(d&&d.ok&&d.rates&&isFinite(Number(d.rates.discountRate)))discountRate=Number(d.rates.discountRate)}catch(e){console.warn('Sell Like discount load',e)}cleanup();window.dispatchEvent(new CustomEvent('capitan-discount-updated',{detail:{discountRate}}))})();
})();