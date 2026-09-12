javascript:(async()=>{
'use strict';
const PANEL_ID='capitan-sell-like-clone';
const PATCH_ID='capitan-variants-window-v2';
const STATE_KEY='capitan-sell-like-variants-state-v1';
if(document.getElementById(PATCH_ID))return;
const m=document.createElement('span');m.id=PATCH_ID;m.style.display='none';document.documentElement.appendChild(m);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const clean=v=>String(v==null?'':v).replace(/\s+/g,' ').trim();
const visible=e=>!!(e&&e.getClientRects&&e.getClientRects().length);
function state(){try{return window.__capitanSellLikeVariants||JSON.parse(localStorage.getItem(STATE_KEY)||'null')}catch(_){return null}}
function section(doc){
  const nodes=[...doc.querySelectorAll('section,div')];
  return nodes.filter(x=>!x.closest?.('#'+PANEL_ID)).find(x=>{
    const t=clean(x.innerText||x.textContent||'');
    return /\bVARIATIONS\b/i.test(t)&&/Save time and money by listing multiple variations/i.test(t)&&t.length<5000;
  })||null
}
function editButton(doc){
  const sec=section(doc);if(!sec)return null;
  return [...sec.querySelectorAll('button,[role="button"],a')].filter(visible).find(x=>/^edit$/i.test(clean(x.innerText||x.textContent||''))||/edit.*variation|variation.*edit/i.test(clean((x.innerText||x.textContent||'')+' '+(x.getAttribute('aria-label')||''))))||null
}
async function waitDoc(win,re,ms=15000){
  const end=Date.now()+ms;
  while(Date.now()<end){
    try{const t=(win.document&&win.document.body&&win.document.body.innerText)||'';if(re.test(t))return true}catch(_){}
    await sleep(200);
  }
  return false
}
async function injectEditor(win){
  try{
    const src='https://raw.githubusercontent.com/PeppeTek/ebay-tools/main/ebay-sell-like-variants-editor-v1.js?ts='+Date.now();
    const r=await fetch(src,{cache:'no-store'});if(!r.ok)throw Error('GitHub HTTP '+r.status);
    let code=(await r.text()).replace(/^\s*javascript\s*:/i,'');
    win.eval(code);
    return true;
  }catch(e){console.warn('Variant child inject failed',e);return false}
}
async function automateChild(win){
  if(!win)return false;
  try{
    const ok=await waitDoc(win,/VARIATIONS|Save time and money by listing multiple variations/i,15000);if(!ok)return false;
    const b=editButton(win.document);if(!b)return false;
    b.click();
    const wizard=await waitDoc(win,/Create your variations|Attributes and options you(?:'|’)ve selected/i,15000);if(!wizard)return false;
    return await injectEditor(win);
  }catch(e){console.warn('Variant child automation failed',e);return false}
}
async function openInNewWindow(){
  const st=state();if(!st||!st.data||!st.data.hasVariations){alert('Varianti non disponibili nel contesto corrente.');return false}
  let win=null;
  try{win=window.open(location.href,'_blank')}catch(_){}
  if(!win){alert('Il browser ha bloccato la nuova finestra. Consenti i popup per ebay.com e riprova.');return false}
  try{win.focus()}catch(_){}
  return await automateChild(win);
}
window.__capitanOpenVariantsWindow=openInNewWindow;
function bindFallback(){
  document.addEventListener('click',async e=>{
    const b=e.target.closest('button,[role="button"],a');if(!b)return;
    const sec=section(document);if(!sec||!sec.contains(b))return;
    if(!/^edit$/i.test(clean(b.innerText||b.textContent||''))&&!/edit.*variation|variation.*edit/i.test(clean((b.innerText||b.textContent||'')+' '+(b.getAttribute('aria-label')||''))))return;
    const st=state();if(!st||!st.data||!st.data.hasVariations)return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    let win=null;try{win=window.open(location.href,'_blank')}catch(_){}
    if(!win){alert('Il browser ha bloccato la nuova finestra. Consenti i popup per ebay.com e riprova.');return}
    await automateChild(win);
  },true);
}
bindFallback();
})();