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

  // Remove the duplicated trailing "(-2%)" from the displayed price value.
  const priceRow=[...p.querySelectorAll('#steps .row')].find(r=>/^Prezzo di vendita \(-2%\):/i.test(clean(r.innerText||r.textContent||'')));
  if(priceRow){
    const spans=[...priceRow.querySelectorAll('span')];
    const value=spans.find(s=>/\d/.test(clean(s.textContent||'')))||spans[0];
    if(value){
      const t=clean(value.textContent||'').replace(/\s*\(-2%\)\s*$/i,'');
      value.textContent=' '+t;
    } else {
      [...priceRow.childNodes].filter(n=>n.nodeType===3).forEach(n=>{n.textContent=n.textContent.replace(/\s*\(-2%\)\s*$/i,'');});
    }
  }

  // Break Even value: blue and bold.
  const be=p.querySelector('#capitan-break-even-value');
  if(be){be.style.color='#1668e8';be.style.fontWeight='700';}

  // Remove the separator line above the completion message.
  const status=p.querySelector('#st');
  if(status){status.style.borderTop='0';}

  return true;
}
let n=0;const t=setInterval(()=>{n++;cleanup();if(n>120)clearInterval(t)},125);
window.addEventListener('capitan-break-even-updated',cleanup);
window.addEventListener('capitan-pricing-saved',cleanup);
cleanup();
})();