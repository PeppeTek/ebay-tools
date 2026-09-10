javascript:(()=>{
'use strict';
const PANEL_ID='capitan-sell-like-clone';
const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
function cleanup(){
  const p=document.getElementById(PANEL_ID);if(!p)return false;
  const rows=[...p.querySelectorAll('#steps .row')];
  rows.forEach(r=>{
    const t=clean(r.innerText||r.textContent||'');
    if(/^(Titolo|Title|Categoria|Category|Item Specifics|Policy|Policies)\s*:/i.test(t))r.remove();
  });
  return true;
}
let n=0;const t=setInterval(()=>{n++;cleanup();if(n>80)clearInterval(t)},125);
cleanup();
})();