javascript:(()=>{
'use strict';
const PANEL_ID='capitan-sell-like-clone';
const PATCH_ID='capitan-interaction-fix-v4';
if(document.getElementById(PATCH_ID))return;
for(const id of ['capitan-interaction-fix-v1','capitan-interaction-fix-v2','capitan-interaction-fix-v3'])document.getElementById(id)?.remove();
const marker=document.createElement('span');marker.id=PATCH_ID;marker.style.display='none';document.documentElement.appendChild(marker);
const panel=document.getElementById(PANEL_ID);if(!panel)return;

function actionButtons(){
  return [...panel.querySelectorAll('[data-ebay-actions] button,#capitan-amazon-best-match,#capitan-aliexpress-best-match,#capitan-amazon-find,#capitan-aliexpress-find')];
}
function normalize(){
  panel.style.pointerEvents='auto';
  panel.style.isolation='isolate';
  const actions=panel.querySelector('[data-ebay-actions]');
  if(actions){
    const sticky=!window.__capitanSellLikeTestMode;
    actions.style.position=sticky?'sticky':'relative';
    actions.style.bottom=sticky?'0':'auto';
    actions.style.zIndex='1000';
    actions.style.pointerEvents='auto';
    actions.style.isolation='isolate';
  }
  const ext=panel.querySelector('#capitan-amazon-match-ext');
  if(ext){
    ext.style.pointerEvents='auto';
    ext.style.position='relative';
    ext.style.zIndex='999';
  }
  actionButtons().forEach(b=>{
    const csvPending=b.dataset&&b.dataset.ebayAction==='csv'&&typeof window.__capitanDownloadVariantCsv!=='function';
    b.disabled=!!csvPending;
    b.style.pointerEvents=csvPending?'none':'auto';
    b.style.position='relative';
    b.style.zIndex='1001';
    b.style.cursor=csvPending?'default':'pointer';
    b.style.userSelect='none';
  });
}
function buttonAt(x,y){
  return actionButtons().find(b=>{
    const r=b.getBoundingClientRect();
    return r.width>0&&r.height>0&&x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom;
  })||null;
}
normalize();

// Gestione diretta: intercettiamo SEMPRE il pointerup nell'area di uno dei 5 pulsanti
// e generiamo noi il click sul vero elemento. Non dipende da eventuali layer eBay.
document.addEventListener('pointerup',e=>{
  if(!document.body.contains(panel))return;
  const btn=buttonAt(e.clientX,e.clientY);
  if(!btn)return;

  // Amazon/AliExpress search buttons already have their own native click handler.
  // Let that click fire once; synthesizing another click here opens two identical tabs.
  if(btn.id==='capitan-amazon-find'||btn.id==='capitan-aliexpress-find')return;

  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
  setTimeout(()=>{
    if(document.body.contains(btn)&&!btn.disabled)btn.click();
  },0);
},true);

// Mantiene gli stili dopo piccoli rerender eBay senza osservatori DOM continui.
let n=0;const t=setInterval(()=>{normalize();if(++n>=80)clearInterval(t)},250);
})();