javascript:(()=>{
'use strict';
const PANEL_ID='capitan-sell-like-clone';
const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
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
    discountRow.innerHTML='<b>Riduzione prezzo:</b> <span class="ok">16%</span>';
    sourceRow.insertAdjacentElement('afterend',discountRow);
  }else if(discountRow){
    const span=discountRow.querySelector('span');
    if(span){span.textContent='16%';span.className='ok';}
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
window.addEventListener('capitan-pricing-saved',cleanup);
cleanup();
})();