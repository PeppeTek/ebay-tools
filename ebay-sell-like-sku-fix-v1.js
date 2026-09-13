javascript:(()=>{
'use strict';
const PANEL_ID='capitan-sell-like-clone';
const PATCH_ID='capitan-sku-fix-v6';
const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const visible=el=>!!(el&&el.getClientRects&&el.getClientRects().length);
if(document.getElementById(PATCH_ID))return;
for(const id of ['capitan-sku-fix-v3','capitan-sku-fix-v4','capitan-sku-fix-v5'])document.getElementById(id)?.remove();
const marker=document.createElement('span');marker.id=PATCH_ID;marker.style.display='none';document.documentElement.appendChild(marker);
const panel=document.getElementById(PANEL_ID);if(!panel)return;

function selectedAsins(){
  return [...panel.querySelectorAll('input.capitan-amazon-choice:checked')].map(x=>clean(x.value)).filter(Boolean)
}
function setStatus(html){
  const s=panel.querySelector('#capitan-amazon-status');if(s)s.innerHTML=html
}
function setNative(el,value){
  if(!el)return false;
  el.focus?.();
  if(el.isContentEditable||el.getAttribute?.('contenteditable')==='true'){
    el.textContent=String(value);
    try{el.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:String(value)}))}catch(_){el.dispatchEvent(new Event('input',{bubbles:true}))}
    el.dispatchEvent(new Event('change',{bubbles:true}));return true
  }
  const proto=el instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
  const setter=Object.getOwnPropertyDescriptor(proto,'value')?.set;
  const old=el.value;
  if(setter)setter.call(el,String(value));else el.value=String(value);
  if(el._valueTracker&&typeof el._valueTracker.setValue==='function')el._valueTracker.setValue(old);
  try{el.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:String(value)}))}catch(_){el.dispatchEvent(new Event('input',{bubbles:true}))}
  el.dispatchEvent(new Event('change',{bubbles:true}));
  return true
}
function itemSpecificsRoot(){
  const heads=[...document.querySelectorAll('h1,h2,h3,h4,legend,div,span')].filter(visible).filter(x=>/^item specifics$/i.test(clean(x.innerText||x.textContent||'')));
  for(const h of heads){
    let p=h;
    for(let i=0;i<8&&p;i++,p=p.parentElement){
      const t=clean(p.innerText||p.textContent||'');
      if(/add custom item specific/i.test(t)&&t.length<18000)return p
    }
  }
  const add=[...document.querySelectorAll('button,[role="button"]')].filter(visible).find(x=>/^add custom item specific$/i.test(clean(x.innerText||x.textContent||'')));
  return add?add.parentElement:document
}
function exactAddCustomButton(root=itemSpecificsRoot()){
  return [...root.querySelectorAll('button,[role="button"]')].filter(visible).find(x=>/^add custom item specific$/i.test(clean(x.innerText||x.textContent||'')))||null
}
function dialogByTitle(){
  const ds=[...document.querySelectorAll('[role="dialog"],dialog')].filter(visible);
  return ds.find(d=>/^add custom item specific\b/i.test(clean(d.innerText||d.textContent||'')))||null
}
function fieldByExactLabel(root,labelText){
  const low=clean(labelText).toLowerCase();
  const labels=[...root.querySelectorAll('label')].filter(visible).filter(l=>clean(l.innerText||l.textContent||'').toLowerCase()===low);
  for(const l of labels){
    let el=l.htmlFor?document.getElementById(l.htmlFor):null;
    if(el&&visible(el))return el;
    el=l.querySelector('input,textarea,[role="textbox"],[contenteditable="true"]');
    if(el&&visible(el))return el;
    let p=l.parentElement;
    for(let i=0;i<4&&p;i++,p=p.parentElement){
      el=[...p.querySelectorAll('input,textarea,[role="textbox"],[contenteditable="true"]')].find(visible);
      if(el)return el
    }
  }
  const captions=[...root.querySelectorAll('div,span,p,strong')].filter(visible).filter(x=>clean(x.innerText||x.textContent||'').toLowerCase()===low);
  for(const cap of captions){
    let p=cap.parentElement;
    for(let i=0;i<4&&p;i++,p=p.parentElement){
      const els=[...p.querySelectorAll('input,textarea,[role="textbox"],[contenteditable="true"]')].filter(visible);
      if(els.length===1)return els[0]
    }
  }
  return null
}
async function waitDialog(ms=2500){
  const end=Date.now()+ms;
  while(Date.now()<end){const d=dialogByTitle();if(d)return d;await sleep(100)}
  return null
}
function existingSkuField(root=itemSpecificsRoot()){
  const labels=[...root.querySelectorAll('label,div,span,p,strong')].filter(visible).filter(x=>/^sku$/i.test(clean(x.innerText||x.textContent||'')));
  for(const l of labels){
    let p=l.parentElement;
    for(let i=0;i<5&&p;i++,p=p.parentElement){
      const el=[...p.querySelectorAll('input,textarea,[role="textbox"],[contenteditable="true"]')].filter(visible)[0];
      if(el)return el
    }
  }
  return null
}
async function saveDialog(dlg){
  const save=[...dlg.querySelectorAll('button,[role="button"]')].filter(visible).find(x=>/^save$/i.test(clean(x.innerText||x.textContent||'')));
  if(!save)return false;
  save.click();
  for(let i=0;i<20;i++){await sleep(120);if(!dlg.isConnected||!visible(dlg))return true}
  return true
}
function verifySku(value){
  const root=itemSpecificsRoot();
  const t=clean(root.innerText||root.textContent||'');
  return /\bSKU\b/i.test(t)&&t.includes(clean(value))
}
async function writeSkuCustomSpecific(value){
  const root=itemSpecificsRoot();
  const existing=existingSkuField(root);
  if(existing){
    setNative(existing,value);existing.blur?.();await sleep(350);
    if(verifySku(value))return {ok:true,mode:'existing'}
  }
  const add=exactAddCustomButton(root);
  if(!add)return {ok:false,reason:'Pulsante "Add custom item specific" non trovato'};
  add.click();
  const dlg=await waitDialog();
  if(!dlg)return {ok:false,reason:'Finestra "Add custom item specific" non aperta'};
  const name=fieldByExactLabel(dlg,'Name');
  const val=fieldByExactLabel(dlg,'Value');
  if(!name||!val)return {ok:false,reason:'Campi Name/Value non trovati nella finestra custom item specific'};
  setNative(name,'SKU');await sleep(120);
  setNative(val,value);await sleep(180);
  const saved=await saveDialog(dlg);
  if(!saved)return {ok:false,reason:'Pulsante Save non trovato nella finestra custom item specific'};
  for(let i=0;i<20;i++){await sleep(150);if(verifySku(value))return {ok:true,mode:'created'}}
  return {ok:false,reason:'SKU creato ma valore non verificato negli Item Specifics'}
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
  setStatus('<span style="color:#555">Creazione Item Specific SKU…</span>');
  try{
    const r=await writeSkuCustomSpecific(value);
    if(!r.ok)throw Error(r.reason);
    setStatus('<span style="color:#137333;font-weight:700">SKU creato negli Item Specifics:</span> '+value)
  }catch(err){
    setStatus('<span style="color:#b42318;font-weight:700">'+String(err.message||err)+'</span>')
  }finally{
    btn.disabled=false
  }
},true);
})();