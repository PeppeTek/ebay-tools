javascript:(()=>{
'use strict';
const PANEL_ID='capitan-sell-like-clone';
const PATCH_ID='capitan-sku-fix-v7';
const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const visible=el=>!!(el&&el.getClientRects&&el.getClientRects().length);

for(const id of ['capitan-sku-fix-v3','capitan-sku-fix-v4','capitan-sku-fix-v5','capitan-sku-fix-v6'])document.getElementById(id)?.remove();
if(document.getElementById(PATCH_ID))return;
const marker=document.createElement('span');marker.id=PATCH_ID;marker.style.display='none';document.documentElement.appendChild(marker);
const panel=document.getElementById(PANEL_ID);if(!panel)return;

function selectedAsins(){
  return [...panel.querySelectorAll('input.capitan-amazon-choice:checked')].map(x=>clean(x.value)).filter(Boolean)
}
function setStatus(html){
  const s=panel.querySelector('#capitan-amazon-status');if(s)s.innerHTML=html
}
function userClick(el){
  if(!el)return false;
  try{el.scrollIntoView({block:'center',inline:'nearest'})}catch(_){}
  try{
    el.dispatchEvent(new MouseEvent('mousedown',{bubbles:true,cancelable:true,button:0,view:window}));
    el.dispatchEvent(new MouseEvent('mouseup',{bubbles:true,cancelable:true,button:0,view:window}));
    el.click();
  }catch(_){try{el.click()}catch(__){return false}}
  return true
}
function setNative(el,value){
  if(!el)return false;
  const v=String(value);
  el.focus?.();
  if(el.isContentEditable||el.getAttribute?.('contenteditable')==='true'){
    el.textContent=v;
    try{el.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:v}))}catch(_){el.dispatchEvent(new Event('input',{bubbles:true}))}
    el.dispatchEvent(new Event('change',{bubbles:true}));
    el.blur?.();
    return true
  }
  const proto=el instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
  const setter=Object.getOwnPropertyDescriptor(proto,'value')?.set;
  const old=el.value;
  if(setter)setter.call(el,v);else el.value=v;
  if(el._valueTracker&&typeof el._valueTracker.setValue==='function')el._valueTracker.setValue(old);
  try{el.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:v}))}catch(_){el.dispatchEvent(new Event('input',{bubbles:true}))}
  el.dispatchEvent(new Event('change',{bubbles:true}));
  el.dispatchEvent(new Event('blur',{bubbles:true}));
  el.blur?.();
  return true
}
function exactText(root,re,selector='button,[role="button"],a,span,div'){
  return [...root.querySelectorAll(selector)].filter(visible).find(x=>re.test(clean(x.innerText||x.textContent||'')))||null
}
function titleOptionsButton(){
  return exactText(document,/^See title options$/i,'button,[role="button"],a')||
    [...document.querySelectorAll('button,[role="button"],a')].filter(visible).find(x=>/title options/i.test(clean((x.innerText||x.textContent||'')+' '+(x.getAttribute('aria-label')||''))))||null
}
function titleOptionsPanel(){
  const labels=[...document.querySelectorAll('div,section,[role="dialog"],[role="menu"],[role="group"]')].filter(visible).filter(x=>/Custom label\s*\(SKU\)/i.test(clean(x.innerText||x.textContent||'')));
  return labels.sort((a,b)=>a.getBoundingClientRect().width*a.getBoundingClientRect().height-b.getBoundingClientRect().width*b.getBoundingClientRect().height)[0]||null
}
function customLabelRow(root){
  const nodes=[...root.querySelectorAll('div,section,li,label')].filter(visible).filter(x=>{
    const t=clean(x.innerText||x.textContent||'');
    return /Custom label\s*\(SKU\)/i.test(t)&&t.length<600
  });
  return nodes.sort((a,b)=>a.getBoundingClientRect().width*a.getBoundingClientRect().height-b.getBoundingClientRect().width*b.getBoundingClientRect().height)[0]||null
}
function rowToggle(row){
  if(!row)return null;
  return row.querySelector('input[type="checkbox"],input[type="switch"],button[role="switch"],[role="switch"],button[aria-checked],[aria-checked]')||
    [...row.querySelectorAll('button,[role="button"]')].filter(visible).find(x=>/custom label|sku/i.test(clean((x.getAttribute('aria-label')||'')+' '+(x.getAttribute('title')||''))))||null
}
function toggleOn(el){
  if(!el)return false;
  if(el.matches('input[type="checkbox"],input[type="switch"]'))return !!el.checked;
  const ac=el.getAttribute('aria-checked');if(ac!=null)return ac==='true';
  const ap=el.getAttribute('aria-pressed');if(ap!=null)return ap==='true';
  return false
}
function skuFieldCandidates(){
  const sels=[
    'input[aria-label*="custom label" i]','textarea[aria-label*="custom label" i]',
    'input[placeholder*="custom label" i]','textarea[placeholder*="custom label" i]',
    'input[name*="custom" i][name*="label" i]','input[id*="custom" i][id*="label" i]',
    'input[name*="sku" i]','textarea[name*="sku" i]','input[id*="sku" i]','textarea[id*="sku" i]',
    '[role="textbox"][aria-label*="custom label" i]','[contenteditable="true"][aria-label*="custom label" i]'
  ];
  const out=[];for(const s of sels){try{document.querySelectorAll(s).forEach(x=>out.push(x))}catch(_){}}
  return [...new Set(out)]
}
function skuFieldByLabel(){
  const labs=[...document.querySelectorAll('label,div,span,p,strong')].filter(visible).filter(x=>{
    const t=clean(x.innerText||x.textContent||'');return /^(Custom label\s*\(SKU\)|Custom label|SKU)$/i.test(t)
  });
  for(const lab of labs){
    let el=lab.htmlFor?document.getElementById(lab.htmlFor):null;
    if(el&&visible(el)&&(/^(INPUT|TEXTAREA)$/.test(el.tagName)||el.getAttribute('role')==='textbox'||el.isContentEditable))return el;
    let p=lab.parentElement;
    for(let i=0;i<6&&p;i++,p=p.parentElement){
      el=[...p.querySelectorAll('input,textarea,[role="textbox"],[contenteditable="true"]')].filter(visible)[0];
      if(el)return el
    }
  }
  return null
}
function findSkuField(){
  return skuFieldCandidates().find(visible)||skuFieldByLabel()||null
}
async function waitSkuField(ms=3500){
  const end=Date.now()+ms;
  while(Date.now()<end){const f=findSkuField();if(f)return f;await sleep(100)}
  return null
}
async function enableCustomLabel(){
  let field=findSkuField();if(field)return field;
  let pop=titleOptionsPanel();
  if(!pop){
    const btn=titleOptionsButton();
    if(!btn)return null;
    userClick(btn);
    for(let i=0;i<20&&!pop;i++){await sleep(100);pop=titleOptionsPanel()}
  }
  if(!pop)return null;
  const row=customLabelRow(pop);
  if(!row)return null;
  const toggle=rowToggle(row);
  if(!toggle)return null;
  if(!toggleOn(toggle)){userClick(toggle);await sleep(350)}
  field=await waitSkuField(3500);
  return field
}
function fieldValue(field){
  return field&&(field.isContentEditable?clean(field.textContent):clean(field.value))
}
async function writeAndVerify(value){
  let field=findSkuField();
  if(!field)field=await enableCustomLabel();
  if(!field)return {ok:false,reason:'Campo Custom label (SKU) non disponibile dopo See title options'};
  for(let i=0;i<4;i++){
    setNative(field,value);
    await sleep(250);
    if(fieldValue(field)!==clean(value))continue;
    field.dispatchEvent(new KeyboardEvent('keydown',{bubbles:true,key:'Tab',code:'Tab'}));
    field.dispatchEvent(new KeyboardEvent('keyup',{bubbles:true,key:'Tab',code:'Tab'}));
    field.blur?.();
    await sleep(450);
    const again=findSkuField();
    if(again&&fieldValue(again)===clean(value))return {ok:true,field:again}
  }
  return {ok:false,reason:'eBay non ha mantenuto il valore nel Custom label (SKU)'}
}

document.addEventListener('click',async e=>{
  const btn=e.target.closest('#capitan-amazon-insert');if(!btn)return;
  e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
  const asins=selectedAsins();
  if(!asins.length){
    setStatus('<span style="color:#b42318;font-weight:700">Seleziona almeno un ASIN.</span>');
    return
  }
  const value=asins.join(' - ');
  btn.disabled=true;
  setStatus('<span style="color:#555">Attivazione Custom label (SKU) e inserimento ASIN…</span>');
  try{
    const r=await writeAndVerify(value);
    if(!r.ok)throw Error(r.reason);
    setStatus('<span style="color:#137333;font-weight:700">ASIN inseriti nel Custom label (SKU):</span> '+value)
  }catch(err){
    setStatus('<span style="color:#b42318;font-weight:700">'+String(err.message||err)+'</span>')
  }finally{
    btn.disabled=false
  }
},true);
})();