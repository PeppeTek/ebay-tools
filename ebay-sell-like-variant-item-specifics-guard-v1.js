javascript:(async()=>{
'use strict';
const PATCH_ID='capitan-variant-item-specifics-guard-v1';
const STATE_KEY='capitan-sell-like-variants-state-v1';
if(document.getElementById(PATCH_ID))return;
const marker=document.createElement('span');marker.id=PATCH_ID;marker.style.display='none';document.documentElement.appendChild(marker);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const clean=v=>String(v==null?'':v).replace(/\s+/g,' ').trim();
const visible=e=>!!(e&&e.getClientRects&&e.getClientRects().length);
function state(){try{return window.__capitanSellLikeVariants||JSON.parse(localStorage.getItem(STATE_KEY)||'null')}catch(_){return null}}
function specificsSection(){
  const heads=[...document.querySelectorAll('h1,h2,h3,h4,legend,div,span')].filter(visible).filter(x=>/^item specifics$/i.test(clean(x.innerText||x.textContent||'')));
  for(const h of heads){let p=h;for(let i=0;i<7&&p;i++,p=p.parentElement){const t=clean(p.innerText||p.textContent||'');if(t.length<14000&&/item specifics/i.test(t))return p}}
  return null
}
function nativeSet(el,value){
  if(!el)return false;
  const proto=el instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
  const setter=Object.getOwnPropertyDescriptor(proto,'value')&&Object.getOwnPropertyDescriptor(proto,'value').set;
  const old=el.value;el.focus();if(setter)setter.call(el,String(value));else el.value=String(value);
  if(el._valueTracker&&typeof el._valueTracker.setValue==='function')el._valueTracker.setValue(old);
  try{el.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'deleteContentBackward',data:null}))}catch(_){el.dispatchEvent(new Event('input',{bubbles:true}))}
  el.dispatchEvent(new Event('change',{bubbles:true}));el.blur?.();return true
}
function clearDimension(root,name){
  const low=clean(name).toLowerCase();if(!low)return;
  // Suggested-item-specific checkboxes such as "Color: Black"
  for(const cb of root.querySelectorAll('input[type="checkbox"]')){
    const label=cb.labels&&cb.labels.length?[...cb.labels].map(l=>clean(l.innerText||l.textContent||'')).join(' '):clean(cb.closest('label')?.innerText||'');
    if(label.toLowerCase().startsWith(low+':')&&cb.checked)cb.click();
  }
  // Exact Item Specific field labelled with the same variation dimension.
  for(const label of root.querySelectorAll('label')){
    if(clean(label.innerText||label.textContent||'').toLowerCase()!==low)continue;
    let el=label.htmlFor?document.getElementById(label.htmlFor):label.querySelector('select,input,textarea,[role="combobox"]');
    let p=label.parentElement;for(let i=0;i<5&&!el&&p;i++,p=p.parentElement)el=p.querySelector('select,input,textarea,[role="combobox"]');
    if(!el)continue;
    if(el.tagName==='SELECT'){
      const blank=[...el.options].find(o=>!clean(o.value)&&!/^(yes|no)$/i.test(clean(o.textContent||'')))||[...el.options].find(o=>/select|choose|--|^$/i.test(clean(o.textContent||'')));
      if(blank){el.value=blank.value;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))}
    }else if('value'in el&&clean(el.value))nativeSet(el,'');
  }
}
async function run(){
  let s=null;
  for(let i=0;i<50&&!s;i++){s=state();if(!s)await sleep(100)}
  if(!s||!s.data||!s.data.hasVariations)return;
  const names=(s.data.dimensions||[]).map(d=>clean(d.name)).filter(Boolean);if(!names.length)return;
  for(let i=0;i<30;i++){
    const root=specificsSection();
    if(root){for(const n of names)clearDimension(root,n)}
    await sleep(200);
  }
}
run();
})();