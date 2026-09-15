javascript:(()=>{
'use strict';
const PANEL_ID='capitan-sell-like-clone';
const PATCH_ID='capitan-loading-ui-v1';
if(document.getElementById(PATCH_ID))return;
const marker=document.createElement('span');marker.id=PATCH_ID;marker.style.display='none';document.documentElement.appendChild(marker);
const panel=document.getElementById(PANEL_ID);if(!panel)return;
panel.classList.add('capitan-preparing');
const style=document.createElement('style');
style.id='capitan-loading-style';
style.textContent=`
#${PANEL_ID}.capitan-preparing #steps,
#${PANEL_ID}.capitan-preparing #st,
#${PANEL_ID}.capitan-preparing [data-ebay-actions],
#${PANEL_ID}.capitan-preparing #capitan-amazon-match-ext,
#${PANEL_ID}.capitan-preparing .b > .row:not(#capitan-source-row):not(#capitan-loading-row){display:none!important}
`;
document.head.appendChild(style);
const clean=v=>String(v==null?'':v).replace(/\s+/g,' ').trim();
const source=[...panel.querySelectorAll('.row')].find(r=>/^Source Item ID:/i.test(clean(r.innerText||r.textContent||'')));
if(source)source.id='capitan-source-row';
let row=document.getElementById('capitan-loading-row');
if(!row){
  row=document.createElement('div');row.id='capitan-loading-row';row.className='row';
  row.style.cssText='padding:7px 0 10px;background:#fff';
  row.innerHTML='<div style="font-size:12px;color:#555;margin-bottom:7px">Preparazione inserzione in corso…</div><div style="height:7px;border-radius:999px;background:#eceff3;overflow:hidden"><div id="capitan-loading-bar" style="height:100%;width:8%;background:#1668e8;border-radius:999px;transition:width .35s ease"></div></div>';
  if(source)source.insertAdjacentElement('afterend',row);else (panel.querySelector('.b')||panel).prepend(row);
}
let pct=8;
const bar=row.querySelector('#capitan-loading-bar');
const timer=setInterval(()=>{pct=Math.min(92,pct+(pct<55?7:pct<80?3:1));if(bar)bar.style.width=pct+'%'},320);
function finish(){
  clearInterval(timer);
  if(bar)bar.style.width='100%';
  setTimeout(()=>{
    panel.classList.remove('capitan-preparing');
    row?.remove();
    style.remove();
  },220);
}
window.addEventListener('capitan-sell-like-ui-ready',finish,{once:true});
window.addEventListener('capitan-sell-like-ui-error',finish,{once:true});
})();