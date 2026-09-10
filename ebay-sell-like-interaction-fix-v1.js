javascript:(()=>{
'use strict';
const PANEL_ID='capitan-sell-like-clone';
const PATCH_ID='capitan-interaction-fix-v1';
if(document.getElementById(PATCH_ID))return;
const marker=document.createElement('span');marker.id=PATCH_ID;marker.style.display='none';document.documentElement.appendChild(marker);
const panel=document.getElementById(PANEL_ID);if(!panel)return;

function actionButtons(){return [...panel.querySelectorAll('[data-ebay-actions] button,#capitan-amazon-insert,#capitan-amazon-find')];}
function normalize(){
  const actions=panel.querySelector('[data-ebay-actions]');
  if(actions){actions.style.position='sticky';actions.style.bottom='0';actions.style.zIndex='100';actions.style.pointerEvents='auto';}
  actionButtons().forEach(b=>{b.disabled=false;b.style.pointerEvents='auto';b.style.position='relative';b.style.zIndex='101';b.style.cursor='pointer';});
  const ext=panel.querySelector('#capitan-amazon-match-ext');if(ext){ext.style.pointerEvents='auto';ext.style.position='relative';ext.style.zIndex='99';}
}
normalize();

// Fallback robusto: se un layer trasparente intercetta il puntatore,
// individua comunque il pulsante visivamente sotto le coordinate e ne esegue il click.
document.addEventListener('pointerup',e=>{
  if(!document.body.contains(panel))return;
  const x=e.clientX,y=e.clientY;
  const btn=actionButtons().find(b=>{const r=b.getBoundingClientRect();return x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom;});
  if(!btn)return;
  if(e.target===btn||btn.contains(e.target))return; // il click normale funzionera da solo
  e.preventDefault();e.stopPropagation();
  setTimeout(()=>btn.click(),0);
},true);

// eBay puo ridisegnare parti del form: mantieni solo gli stili d'interazione,
// senza osservatori DOM aggressivi.
let n=0;const t=setInterval(()=>{normalize();if(++n>=40)clearInterval(t)},250);
})();