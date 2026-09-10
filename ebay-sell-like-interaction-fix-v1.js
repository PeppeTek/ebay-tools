javascript:(()=>{
'use strict';
const PANEL_ID='capitan-sell-like-clone';
const PATCH_ID='capitan-interaction-fix-v2';
if(document.getElementById(PATCH_ID))return;
const old=document.getElementById('capitan-interaction-fix-v1');if(old)old.remove();
const marker=document.createElement('span');marker.id=PATCH_ID;marker.style.display='none';document.documentElement.appendChild(marker);
const panel=document.getElementById(PANEL_ID);if(!panel)return;

function actionButtons(){
  return [...panel.querySelectorAll('[data-ebay-actions] button,#capitan-amazon-insert,#capitan-amazon-find')];
}
function normalize(){
  panel.style.pointerEvents='auto';
  panel.style.isolation='isolate';
  const actions=panel.querySelector('[data-ebay-actions]');
  if(actions){
    actions.style.position='sticky';
    actions.style.bottom='0';
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
    b.disabled=false;
    b.style.pointerEvents='auto';
    b.style.position='relative';
    b.style.zIndex='1001';
    b.style.cursor='pointer';
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