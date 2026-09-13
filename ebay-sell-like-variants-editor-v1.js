javascript:(async()=>{
'use strict';
const PANEL_ID='capitan-sell-like-clone';
const PATCH_ID='capitan-variants-editor-v10';
const VAR_STATE_KEY='capitan-sell-like-variants-state-v1';
if(document.getElementById(PATCH_ID))return;
const marker=document.createElement('span');marker.id=PATCH_ID;marker.style.display='none';document.documentElement.appendChild(marker);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const clean=v=>String(v==null?'':v).replace(/\s+/g,' ').trim();
const visible=e=>!!(e&&e.getClientRects&&e.getClientRects().length);
function userClick(el){
  if(!el)return false;
  try{el.scrollIntoView({block:'center',inline:'center'})}catch(_){}
  for(const type of ['pointerdown','mousedown','pointerup','mouseup']){
    try{el.dispatchEvent(new MouseEvent(type,{bubbles:true,cancelable:true,view:window,button:0}))}catch(_){}
  }
  try{el.click()}catch(_){}
  return true
}
function state(){
  if(window.__capitanSellLikeVariants&&window.__capitanSellLikeVariants.data)return window.__capitanSellLikeVariants;
  try{const raw=localStorage.getItem(VAR_STATE_KEY);if(raw){const s=JSON.parse(raw);if(s&&s.data)return s}}catch(_){}
  return null
}
function payload(){const s=state();return s&&s.data||null}
function saleFor(v){const st=state()||{};const d=Number(st.discountRate);const discount=isFinite(d)?d:.02;const source=Number(v&&v.sourcePrice);return isFinite(source)&&source>0?Math.round(source*(1-discount)*100)/100:null}
function setNative(el,value){
  if(!el)return false;
  const proto=el instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
  const setter=Object.getOwnPropertyDescriptor(proto,'value')&&Object.getOwnPropertyDescriptor(proto,'value').set;
  const old=el.value;
  el.focus();
  if(setter)setter.call(el,String(value));else el.value=String(value);
  if(el._valueTracker&&typeof el._valueTracker.setValue==='function')el._valueTracker.setValue(old);
  try{el.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:String(value)}))}catch(_){el.dispatchEvent(new Event('input',{bubbles:true}))}
  el.dispatchEvent(new Event('change',{bubbles:true}));
  return true
}
function keyText(v){return(v.specifics||[]).map(s=>clean(s.value).toLowerCase()).filter(Boolean)}
function variationSection(){
  const heads=[...document.querySelectorAll('h1,h2,h3,h4,legend,span,div')].filter(visible).filter(x=>/^variations?$/i.test(clean(x.textContent||'')));
  for(const h of heads){
    let p=h;
    for(let i=0;i<8&&p;i++,p=p.parentElement){
      if(p.closest&&p.closest('#'+PANEL_ID))continue;
      const txt=clean(p.innerText||p.textContent||'');
      if(txt.length>12000)continue;
      const hasEdit=[...p.querySelectorAll('button,[role="button"],a')].some(x=>visible(x)&&/^edit$/i.test(clean(x.innerText||x.textContent||'')));
      if(hasEdit||/save time and money by listing multiple variations/i.test(txt))return p;
    }
  }
  return null
}
function variationDialog(){
  const overlays=[...document.querySelectorAll('[role="dialog"],dialog,[aria-modal="true"]')].filter(visible);
  return overlays.find(x=>/variation|options|attributes/i.test(clean(x.innerText||x.textContent||'')))||null
}
function variationEditorSurface(data){
  const dlg=variationDialog();if(dlg)return dlg;
  const dims=(data&&data.dimensions||[]).map(d=>clean(d.name).toLowerCase()).filter(Boolean);
  const candidates=[...document.querySelectorAll('main,section,form,div')].filter(x=>visible(x)&&!x.closest('#'+PANEL_ID)).filter(x=>{
    const t=clean(x.innerText||x.textContent||'').toLowerCase();
    if(t.length<20||t.length>14000)return false;
    if(/create variations|add variations|variation details|variation name|variation values|custom variation|add your own/i.test(t))return true;
    return dims.length&&dims.some(d=>t.includes(d))&&[...x.querySelectorAll('input,[role="combobox"],button')].some(visible);
  });
  return candidates.sort((a,b)=>(a.innerText||'').length-(b.innerText||'').length)[0]||null
}
async function openEditor(data){
  let scope=variationEditorSurface(data);if(scope&&scope.querySelector('input,[role="combobox"]'))return scope;
  const sec=variationSection();
  let edit=null;
  if(sec){
    edit=[...sec.querySelectorAll('button,[role="button"],a')].filter(visible).find(x=>/^edit$/i.test(clean(x.innerText||x.textContent||''))||/edit.*variation|variation.*edit/i.test(clean((x.innerText||x.textContent||'')+' '+(x.getAttribute('aria-label')||''))));
  }
  if(!edit){
    const all=[...document.querySelectorAll('button,[role="button"],a')].filter(x=>visible(x)&&!x.closest('#'+PANEL_ID));
    edit=all.find(x=>{
      const t=clean(x.innerText||x.textContent||'');
      if(!/^edit$/i.test(t)&&!/edit.*variation|variation.*edit/i.test(clean(t+' '+(x.getAttribute('aria-label')||''))))return false;
      let p=x.parentElement;for(let i=0;i<6&&p;i++,p=p.parentElement){if(/variations?/i.test(clean(p.innerText||p.textContent||'')))return true}
      return false;
    });
  }
  if(!edit)return null;
  edit.click();
  for(let i=0;i<40;i++){
    await sleep(250);
    scope=variationEditorSurface(data);
    if(scope&&(scope.querySelector('input,[role="combobox"]')||/add your own|create variations|variation values/i.test(clean(scope.innerText||''))))return scope;
  }
  return null
}
function clickNamed(scope,name){
  const low=clean(name).toLowerCase();
  const els=[...scope.querySelectorAll('button,[role="button"],label,[role="option"],[role="checkbox"],[role="radio"]')].filter(visible);
  const x=els.find(e=>clean(e.innerText||e.textContent||e.getAttribute('aria-label')||'').toLowerCase()===low);
  if(x){x.click();return true}return false
}
function findInput(scope,re){
  for(const l of scope.querySelectorAll('label')){
    if(!re.test(clean(l.innerText||l.textContent||'')))continue;
    let e=l.htmlFor?document.getElementById(l.htmlFor):l.querySelector('input,textarea,[role="combobox"]');
    if(e)return e;
    let p=l.parentElement;for(let i=0;i<4&&p;i++,p=p.parentElement){e=p.querySelector('input,textarea,[role="combobox"]');if(e)return e}
  }
  return[...scope.querySelectorAll('input,textarea,[role="combobox"]')].find(e=>re.test(clean([e.name,e.id,e.placeholder,e.getAttribute('aria-label')].join(' '))))||null
}
async function submitToken(input,value){
  if(!input)return false;setNative(input,value);await sleep(80);
  input.dispatchEvent(new KeyboardEvent('keydown',{bubbles:true,key:'Enter',code:'Enter'}));
  input.dispatchEvent(new KeyboardEvent('keyup',{bubbles:true,key:'Enter',code:'Enter'}));
  await sleep(120);return true
}
async function ensureDimension(scope,dim){
  let text=clean(scope.innerText||scope.textContent||'');
  if(text.toLowerCase().includes(clean(dim.name).toLowerCase())&&dim.values.every(v=>text.toLowerCase().includes(clean(v).toLowerCase())))return true;
  clickNamed(scope,dim.name);await sleep(150);
  const addBtn=[...scope.querySelectorAll('button,[role="button"],a')].filter(visible).find(x=>/add.*variation|add.*attribute|add.*option|create.*variation|add your own/i.test(clean((x.innerText||x.textContent||'')+' '+(x.getAttribute('aria-label')||''))));
  if(addBtn){addBtn.click();await sleep(200)}
  const nameInput=findInput(scope,/variation.*name|attribute.*name|option.*name|variation.*type|^name$/i);
  if(nameInput)await submitToken(nameInput,dim.name);
  let valueInput=findInput(scope,/variation.*value|values?|options?|choices?|add.*value/i);
  if(!valueInput){
    const inputs=[...scope.querySelectorAll('input[type="text"],input:not([type]),textarea')].filter(visible);
    valueInput=inputs.find(x=>x!==nameInput)||null
  }
  if(valueInput){for(const value of dim.values||[])await submitToken(valueInput,value)}
  text=clean(scope.innerText||scope.textContent||'').toLowerCase();
  return clean(dim.name)&&text.includes(clean(dim.name).toLowerCase())
}
function isCreateVariationsPage(){
  const t=clean(document.body.innerText||document.body.textContent||'');
  return /create your variations/i.test(t)&&/attributes/i.test(t)&&/options/i.test(t)&&/continue/i.test(t)
}
function wizardRoot(){
  const all=[...document.querySelectorAll('main,form,section,div')].filter(visible).filter(x=>{
    const t=clean(x.innerText||x.textContent||'');
    return /Create your variations/i.test(t)&&/\bAttributes\b/i.test(t)&&/\bOptions\b/i.test(t)&&/\bContinue\b/i.test(t)&&t.length<12000;
  });
  return all.sort((a,b)=>clean(a.innerText||a.textContent||'').length-clean(b.innerText||b.textContent||'').length)[0]||document.body
}
function exactText(root,text){
  const wanted=clean(text).toLowerCase();
  return [...root.querySelectorAll('button,[role="button"],a,span,div,label,li,[role="option"]')].filter(visible).find(x=>clean(x.innerText||x.textContent||'').toLowerCase()===wanted)||null
}
function clickExact(root,text){
  const x=exactText(root,text);if(!x)return false;
  const clickable=x.closest('button,[role="button"],a,label,[role="option"],li')||x;
  clickable.click();return true
}
async function waitUntil(fn,ms=4000,step=100){
  const end=Date.now()+ms;
  while(Date.now()<end){const v=fn();if(v)return v;await sleep(step)}
  return null
}
function selectedPanel(root){
  const labels=[...root.querySelectorAll('h1,h2,h3,h4,div,span')].filter(visible).filter(x=>/attributes and options you(?:'|’)ve selected/i.test(clean(x.innerText||x.textContent||'')));
  for(const label of labels){
    const lr=label.getBoundingClientRect();
    const candidates=[];
    let p=label;
    for(let i=0;i<6&&p;i++,p=p.parentElement){
      const t=clean(p.innerText||p.textContent||'');
      const r=p.getBoundingClientRect();
      if(!/attributes and options you(?:'|’)ve selected/i.test(t))continue;
      if(/\+\s*Create your own/i.test(t))continue;
      if(/\bOptions\b/i.test(t)&&/\bAttributes\b/i.test(t))continue;
      if(r.width>0&&r.width<Math.max(900,window.innerWidth*.62)&&t.length<5000)candidates.push(p);
    }
    if(candidates.length)return candidates.sort((a,b)=>{
      const ar=a.getBoundingClientRect(),br=b.getBoundingClientRect();
      const as=(ar.width*ar.height)||Infinity,bs=(br.width*br.height)||Infinity;
      return as-bs;
    })[0];
    if(lr.width>0)return label.parentElement;
  }
  return null
}
function selectedText(root){const p=selectedPanel(root);return clean(p&&p.innerText||p&&p.textContent||'').toLowerCase()}
function selectedHeaderRect(root){
  const h=[...root.querySelectorAll('h1,h2,h3,h4,div,span')].filter(visible).find(x=>/attributes and options you(?:'|’)ve selected/i.test(clean(x.innerText||x.textContent||'')));
  return h&&h.getBoundingClientRect? h.getBoundingClientRect():null
}
function selectedOptionExists(root,value){
  const low=clean(value).toLowerCase();if(!low)return false;
  const hr=selectedHeaderRect(root);if(!hr)return selectedText(root).includes(low);
  const minX=hr.left-8;
  const nodes=[...root.querySelectorAll('button,[role="button"],a,label,div,span,li')].filter(visible).filter(x=>clean(x.innerText||x.textContent||'').toLowerCase()===low);
  const rr=root.getBoundingClientRect();const split=Math.max(minX,rr.left+rr.width*.52);
  return nodes.some(x=>{const r=x.getBoundingClientRect();return r.left>=split&&r.top>=hr.top-8})
}
function optionsZone(root){
  const labels=[...root.querySelectorAll('div,span,h3,h4,label')].filter(visible).filter(x=>/^options$/i.test(clean(x.innerText||x.textContent||'')));
  for(const l of labels){
    let p=l.parentElement;
    for(let i=0;i<5&&p;i++,p=p.parentElement){
      const t=clean(p.innerText||p.textContent||'');
      if(t.length<7000&&/create your own/i.test(t))return p;
    }
  }
  return root
}
async function removeExistingAttributes(root,data){
  const wanted=new Set((data.dimensions||[]).map(d=>clean(d.name).toLowerCase()));
  for(const unwanted of ['MPN','Theme']){
    if(wanted.has(unwanted.toLowerCase()))continue;
    const matches=[...root.querySelectorAll('button,[role="button"],div,span')].filter(visible).filter(x=>{
      const t=clean(x.innerText||x.textContent||'');
      return new RegExp('^'+unwanted+'(?:\\s*[x×])?$','i').test(t);
    }).sort((a,b)=>a.childElementCount-b.childElementCount);
    let removed=false;
    for(const chip of matches){
      const holder=chip.parentElement||chip;const controls=[...holder.querySelectorAll('button,[role="button"],a,[aria-label],span,div')].filter(visible).sort((a,b)=>a.childElementCount-b.childElementCount);
      const x=controls.find(el=>{
        const t=clean((el.innerText||el.textContent||'')+' '+(el.getAttribute&&el.getAttribute('aria-label')||'')).toLowerCase();
        return t==='x'||t==='×'||/remove|delete|close/.test(t);
      });
      if(x){userClick(x);removed=true;break}
      const t=clean(chip.innerText||chip.textContent||'');
      if(chip.matches('button,[role="button"]')&&/[x×]\s*$/i.test(t)){userClick(chip);removed=true;break}
    }
    if(removed)await sleep(250);
  }
}
async function chooseAttribute(root,dim){
  const wanted=clean(dim.name);if(!wanted)return false;
  const chipExists=()=>[...root.querySelectorAll('button,[role="button"],div,span')].filter(visible).some(x=>{
    const t=clean(x.innerText||x.textContent||'').replace(/\s*[x×]\s*$/i,'');
    return t.toLowerCase()===wanted.toLowerCase();
  });
  if(chipExists())return true;
  let add=[...root.querySelectorAll('button,[role="button"],a')].filter(visible).find(x=>/^\+\s*Add$/i.test(clean(x.innerText||x.textContent||'')));
  if(!add)add=[...root.querySelectorAll('button,[role="button"],a')].filter(visible).find(x=>/^Add$/i.test(clean(x.innerText||x.textContent||'')));
  if(!add)return false;
  add.click();await sleep(200);
  let option=await waitUntil(()=>[...document.querySelectorAll('[role="option"],li,button,label,div,span')].filter(visible).find(x=>clean(x.innerText||x.textContent||'').toLowerCase()===wanted.toLowerCase()),2500);
  if(option){(option.closest('[role="option"],button,label,li,a')||option).click();await sleep(250)}
  else{
    const input=[...document.querySelectorAll('input[type="text"],input:not([type]),textarea')].filter(visible).find(x=>/attribute|search|variation/i.test(clean([x.placeholder,x.getAttribute('aria-label'),x.name,x.id].join(' '))));
    if(!input)return false;
    setNative(input,wanted);await sleep(150);
    input.dispatchEvent(new KeyboardEvent('keydown',{bubbles:true,key:'Enter',code:'Enter'}));
    input.dispatchEvent(new KeyboardEvent('keyup',{bubbles:true,key:'Enter',code:'Enter'}));
    await sleep(250);
  }
  return chipExists()
}
function isOptionSelected(root,value){
  return selectedOptionExists(root,value)
}
async function selectSuggestedOption(root,value){
  const val=clean(value),low=val.toLowerCase();if(!val)return false;
  if(isOptionSelected(root,val))return true;
  const zone=optionsZone(root);
  const hr=selectedHeaderRect(root);
  const candidates=[...zone.querySelectorAll('button,[role="button"],a,label,div,span')].filter(visible).filter(x=>{
    if(clean(x.innerText||x.textContent||'').toLowerCase()!==low)return false;
    if(!hr)return true;
    return x.getBoundingClientRect().left<hr.left-8;
  });
  if(!candidates.length)return false;
  const x=candidates.sort((a,b)=>a.childElementCount-b.childElementCount)[0];
  userClick(x.closest('button,[role="button"],a,label')||x);
  for(let i=0;i<20;i++){await sleep(100);if(isOptionSelected(root,val))return true}
  return false
}
async function addCustomOption(root,value){
  const val=clean(value);if(!val)return false;
  if(isOptionSelected(root,val))return true;
  const zone=optionsZone(root);
  const create=zone.querySelector('#msku-custom-option-link')||[...zone.querySelectorAll('a,button,[role="button"],span,div')].filter(visible).find(x=>/create your own/i.test(clean(x.innerText||x.textContent||'')));
  if(!create)return false;

  const beforeInputs=new Set([...document.querySelectorAll('input[type="text"],input:not([type]),textarea')].filter(visible));
  userClick(create.closest('button,[role="button"],a')||create);

  let input=null;
  for(let i=0;i<30&&!input;i++){
    await sleep(100);
    const known=document.getElementById('msku-custom-option-input');
    if(known&&visible(known))input=known;
    const candidates=[...document.querySelectorAll('input[type="text"],input:not([type]),textarea')].filter(visible).filter(x=>!beforeInputs.has(x));
    if(!input)input=candidates.find(x=>/option|custom|create|value|variation/i.test(clean([x.placeholder,x.getAttribute('aria-label'),x.name,x.id].join(' '))))||candidates[0]||null;
    if(!input){
      const overlays=[...document.querySelectorAll('[role="dialog"],[role="menu"],[role="listbox"],[aria-modal="true"],div')].filter(visible).filter(x=>/create your own|custom|option/i.test(clean(x.innerText||x.textContent||''))&&clean(x.innerText||x.textContent||'').length<2500);
      for(const ov of overlays){
        input=[...ov.querySelectorAll('input[type="text"],input:not([type]),textarea')].filter(visible)[0]||null;
        if(input)break;
      }
    }
  }
  if(!input)return false;

  setNative(input,val);await sleep(120);

  let container=input;
  let add=null;
  for(let i=0;i<6&&container;i++,container=container.parentElement){
    add=[...container.querySelectorAll('button,[role="button"],a')].filter(visible).find(x=>/^(Add|Create|Save|Done)$/i.test(clean(x.innerText||x.textContent||'')))||null;
    if(add)break;
  }
  if(!add){
    const r=input.getBoundingClientRect();
    add=[...document.querySelectorAll('button,[role="button"],a')].filter(visible).filter(x=>/^(Add|Create|Save|Done)$/i.test(clean(x.innerText||x.textContent||''))).sort((a,b)=>{
      const ar=a.getBoundingClientRect(),br=b.getBoundingClientRect();
      const ad=Math.abs((ar.top+ar.height/2)-(r.top+r.height/2))+Math.abs(ar.left-r.right);
      const bd=Math.abs((br.top+br.height/2)-(r.top+r.height/2))+Math.abs(br.left-r.right);
      return ad-bd
    })[0]||null;
  }

  if(add)userClick(add);
  else{
    input.dispatchEvent(new KeyboardEvent('keydown',{bubbles:true,key:'Enter',code:'Enter'}));
    input.dispatchEvent(new KeyboardEvent('keyup',{bubbles:true,key:'Enter',code:'Enter'}));
  }

  for(let i=0;i<35;i++){
    await sleep(120);
    if(isOptionSelected(root,val))return true
  }
  return false
}
async function ensureOption(root,value){
  if(isOptionSelected(root,value))return true;
  if(await selectSuggestedOption(root,value))return true;
  return await addCustomOption(root,value)
}
async function handleCreateVariationsPage(data){
  if(!isCreateVariationsPage())return false;
  const root=wizardRoot();
  await removeExistingAttributes(root,data);
  for(const dim of data.dimensions||[]){
    const attrOk=await chooseAttribute(root,dim);
    if(!attrOk){console.warn('Variant attribute not added',dim.name);return false}
    for(const value of dim.values||[]){
      const ok=await ensureOption(root,value);
      if(!ok){console.warn('Variant option not selected/added',dim.name,value);return false}
    }
  }
  const expected=(data.dimensions||[]).flatMap(d=>d.values||[]).map(v=>clean(v).toLowerCase()).filter(Boolean);
  const missing=expected.filter(v=>!selectedOptionExists(root,v));
  if(missing.length){console.warn('Not all expected options are in selected panel; Continue skipped',missing);return false}
  const cont=[...root.querySelectorAll('button,[role="button"],a')].filter(visible).find(x=>/^Continue$/i.test(clean(x.innerText||x.textContent||'')));
  if(cont){userClick(cont);await sleep(1200);return true}
  return false
}

async function createDimensions(scope,data){
  let touched=false;
  for(const dim of data.dimensions||[]){if(await ensureDimension(scope,dim))touched=true}
  if(touched){
    const action=[...scope.querySelectorAll('button,[role="button"]')].filter(visible).find(x=>/^(continue|next|create|generate|apply)$/i.test(clean(x.innerText||x.textContent||''))||/create.*variation|generate.*variation/i.test(clean(x.innerText||x.textContent||'')));
    if(action){action.click();await sleep(900)}
  }
}
function candidateRows(scope){
  const root=scope||document;
  const rows=[...root.querySelectorAll('tr,[role="row"]')].filter(visible);
  const cards=[...root.querySelectorAll('[data-testid*="variation" i],[class*="variation" i],[data-testid*="option" i],[class*="option" i]')].filter(visible);
  const compact=[...root.querySelectorAll('div,li')].filter(x=>visible(x)&&clean(x.innerText||x.textContent||'').length<1200).filter(x=>x.querySelector('input,button,[role="button"],input[type="file"]'));
  return [...new Set(rows.concat(cards,compact))];
}
function findRow(scope,v){
  const keys=keyText(v);if(!keys.length)return null;
  return candidateRows(scope).find(r=>{const t=clean(r.innerText||r.textContent||'').toLowerCase();return keys.every(k=>t.includes(k))})||null
}
function fillRows(scope,data){
  let prices=0;
  for(const v of data.variants||[]){
    const row=findRow(scope,v);if(!row)continue;
    const inputs=[...row.querySelectorAll('input')].filter(visible);
    const price=inputs.find(x=>/price/i.test(clean([x.name,x.id,x.placeholder,x.getAttribute('aria-label')].join(' '))))||inputs.find(x=>/price|usd|\$/i.test(clean(x.closest('td,div')&&x.closest('td,div').innerText||'')));
    const sale=saleFor(v);if(price&&sale!=null){setNative(price,sale.toFixed(2));prices++}
    const qty=inputs.find(x=>/quantity|qty/i.test(clean([x.name,x.id,x.placeholder,x.getAttribute('aria-label')].join(' '))));if(qty)setNative(qty,'3')
  }
  return prices
}
async function filesFromUrls(urls,prefix){
  const dt=new DataTransfer();let n=0;
  for(const u of urls||[]){try{const r=await fetch(u,{mode:'cors',credentials:'omit',cache:'no-store'});if(!r.ok)continue;const blob=await r.blob();const mime=blob.type||'image/jpeg';const ext=/png/i.test(mime)?'png':/webp/i.test(mime)?'webp':'jpg';dt.items.add(new File([blob],prefix+'-'+(++n)+'.'+ext,{type:mime,lastModified:Date.now()}))}catch(e){console.warn('Variant image fetch failed',u,e)}}
  return dt.files
}
async function setRowImages(scope,v){
  if(!v.images||!v.images.length)return false;
  const row=findRow(scope,v);if(!row)return false;
  let input=[...row.querySelectorAll('input[type="file"]')].find(x=>x.multiple||/image/i.test(x.accept||''))||row.querySelector('input[type="file"]');
  if(!input){
    const b=[...row.querySelectorAll('button,[role="button"],a')].filter(visible).find(x=>/photo|image|picture|upload|add media/i.test(clean((x.innerText||x.textContent||'')+' '+(x.getAttribute('aria-label')||''))));
    if(b){b.click();await sleep(300);const dlg=[...document.querySelectorAll('[role="dialog"],dialog')].filter(visible).find(x=>/photo|image|picture|variation/i.test(clean(x.innerText||x.textContent)));input=dlg&&dlg.querySelector('input[type="file"]')||null}
  }
  if(!input)return false;
  const files=await filesFromUrls(v.images,'variant-'+v.index);if(!files.length)return false;
  try{input.files=files}catch(_){return false}
  input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));await sleep(500);return true
}
async function assignImages(scope,data){let n=0;for(const v of data.variants||[]){if(await setRowImages(scope,v))n++}return n}
function isCombinationsPage(){
  const t=clean(document.body.innerText||document.body.textContent||'');
  return /Variation combinations\s*\(/i.test(t)&&/Add variation photos/i.test(t)&&/Save and close/i.test(t)
}
function exactVisible(root,re,selector='button,[role="button"],a'){
  return [...root.querySelectorAll(selector)].filter(visible).find(x=>re.test(clean((x.innerText||x.textContent||'')+' '+(x.getAttribute&&x.getAttribute('aria-label')||''))))||null
}
function selectOptionNative(sel,value){
  if(!sel)return false;
  const wanted=clean(value).toLowerCase();
  const opt=[...sel.options].find(o=>clean(o.textContent||o.label||'').toLowerCase()===wanted)||[...sel.options].find(o=>clean(o.textContent||o.label||'').toLowerCase().includes(wanted));
  if(!opt)return false;
  sel.value=opt.value;sel.dispatchEvent(new Event('input',{bubbles:true}));sel.dispatchEvent(new Event('change',{bubbles:true}));return true
}
async function ensurePhotoAttribute(data){
  const dim=clean((data.dimensions&&data.dimensions[0]&&data.dimensions[0].name)||'Color');
  const labels=[...document.querySelectorAll('div,span,h2,h3,h4,label')].filter(visible).filter(x=>/Add variation photos/i.test(clean(x.innerText||x.textContent||'')));
  let root=labels[0]||document.body;
  for(let i=0;i<5&&root;i++,root=root.parentElement){
    const sel=root.querySelector&&root.querySelector('select');
    if(sel&&selectOptionNative(sel,dim)){await sleep(500);return true}
  }
  const sel=[...document.querySelectorAll('select')].filter(visible).find(s=>[...s.options].some(o=>clean(o.textContent||'').toLowerCase()===dim.toLowerCase()));
  if(sel){selectOptionNative(sel,dim);await sleep(500);return true}
  return false
}
function combinationRows(){
  const rows=[...document.querySelectorAll('tr,[role="row"]')].filter(visible).filter(r=>{
    const t=clean(r.innerText||r.textContent||'');
    return t.length<2000&&(/\bPrice\b/i.test(t)||r.querySelector('input[type="checkbox"]'))&&!/Actions\s+Photos\s+SKU/i.test(t);
  });
  return rows
}
function rowForVariant(v){
  const keys=keyText(v);
  return combinationRows().find(r=>{const t=clean(r.innerText||r.textContent||'').toLowerCase();return keys.length&&keys.every(k=>t.includes(k))})||null
}
async function commitBulkValue(buttonLabel,value){
  const btn=exactVisible(document.body,new RegExp('^'+buttonLabel.replace(/[.*+?^$()|[\]\\]/g,'\\$&')+'$','i'));
  if(!btn)return false;
  const before=new Set([...document.querySelectorAll('input,textarea')].filter(visible));
  btn.click();await sleep(220);
  const scope=variationDialog()||document.body;
  let input=await waitUntil(()=>{
    const now=[...scope.querySelectorAll('input,textarea')].filter(visible);
    return now.find(x=>!before.has(x))||now.find(x=>/price|quantity|qty|value/i.test(clean([x.placeholder,x.getAttribute('aria-label'),x.name,x.id].join(' '))))||null
  },2000);
  if(!input)return false;
  setNative(input,value);await sleep(80);
  const action=[...scope.querySelectorAll('button,[role="button"],a')].filter(visible).find(x=>/^(save|apply|done|enter|set|confirm|ok)$/i.test(clean(x.innerText||x.textContent||'')));
  if(action){action.click();await sleep(250)}else{
    input.dispatchEvent(new KeyboardEvent('keydown',{bubbles:true,key:'Enter',code:'Enter'}));input.dispatchEvent(new KeyboardEvent('keyup',{bubbles:true,key:'Enter',code:'Enter'}));await sleep(220)
  }
  return true
}
async function fillCombination(v){
  const row=rowForVariant(v);if(!row)return false;
  const inputs=[...row.querySelectorAll('input')].filter(visible);
  const sale=saleFor(v);
  const price=inputs.find(x=>/price/i.test(clean([x.name,x.id,x.placeholder,x.getAttribute('aria-label')].join(' '))));
  const qty=inputs.find(x=>/quantity|qty/i.test(clean([x.name,x.id,x.placeholder,x.getAttribute('aria-label')].join(' '))));
  if(price&&sale!=null)setNative(price,sale.toFixed(2));
  if(qty)setNative(qty,'3');
  if(price&&qty)return true;

  const check=row.querySelector('input[type="checkbox"]');
  if(!check)return !!price;
  if(!check.checked){check.click();await sleep(120)}
  let ok=true;
  if(!price&&sale!=null)ok=(await commitBulkValue('Enter price',sale.toFixed(2)))&&ok;
  if(!qty)ok=(await commitBulkValue('Enter quantity','3'))&&ok;
  if(check.checked){check.click();await sleep(80)}
  return ok
}
async function setAllCombinationValues(data){
  let done=0;
  for(const v of data.variants||[]){if(await fillCombination(v))done++}
  return done
}
function photoOptionsRoot(){
  const label=[...document.querySelectorAll('div,span,h2,h3,h4')].filter(visible).find(x=>/Add variation photos/i.test(clean(x.innerText||x.textContent||'')));
  if(!label)return document.body;
  let p=label;
  for(let i=0;i<6&&p;i++,p=p.parentElement){
    const t=clean(p.innerText||p.textContent||'');
    if(/Upload from computer|Upload from web/i.test(t)&&t.length<12000)return p;
  }
  return document.body
}
async function clickPhotoVariant(value){
  const root=photoOptionsRoot(),low=clean(value).toLowerCase();
  const xs=[...root.querySelectorAll('button,[role="button"],a,div,span,li')].filter(visible).filter(x=>clean(x.innerText||x.textContent||'').toLowerCase()===low);
  if(!xs.length)return false;
  const x=xs.sort((a,b)=>a.childElementCount-b.childElementCount)[0];
  (x.closest('button,[role="button"],a,li')||x).click();await sleep(180);return true
}
async function uploadUrlsFromWeb(urls){
  urls=(urls||[]).filter(Boolean).slice(0,12);if(!urls.length)return false;
  const root=photoOptionsRoot();
  const btn=exactVisible(root,/^Upload from web$/i);if(!btn)return false;
  btn.click();await sleep(250);
  const scope=variationDialog()||document.body;
  let input=await waitUntil(()=>[...scope.querySelectorAll('textarea,input[type="text"],input[type="url"],input:not([type])')].filter(visible).find(x=>/url|web|link|address|image/i.test(clean([x.placeholder,x.getAttribute('aria-label'),x.name,x.id].join(' '))))||[...scope.querySelectorAll('textarea,input[type="text"],input[type="url"],input:not([type])')].filter(visible)[0]||null,1800);
  if(!input)return false;
  if(input.tagName==='TEXTAREA')setNative(input,urls.join('\n'));
  else setNative(input,urls[0]);
  const add=[...scope.querySelectorAll('button,[role="button"],a')].filter(visible).find(x=>/^(add|upload|save|done|import|confirm)$/i.test(clean(x.innerText||x.textContent||'')));
  if(add){add.click();await sleep(500)}
  return true
}
async function uploadFilesFallback(urls,prefix){
  const root=photoOptionsRoot();
  const input=[...root.querySelectorAll('input[type="file"]')].find(x=>x.multiple||/image/i.test(x.accept||''))||root.querySelector('input[type="file"]');
  if(!input)return false;
  const files=await filesFromUrls(urls,prefix);if(!files.length)return false;
  try{input.files=files}catch(_){return false}
  input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));await sleep(500);return true
}
async function assignVariationPhotosDedicated(data){
  await ensurePhotoAttribute(data);
  let done=0;
  for(const v of data.variants||[]){
    if(!v.images||!v.images.length)continue;
    const label=(v.specifics&&v.specifics[0]&&v.specifics[0].value)||clean(v.title).replace(/^.*?:\s*/,'');
    if(!await clickPhotoVariant(label))continue;
    let ok=await uploadUrlsFromWeb(v.images);
    if(!ok)ok=await uploadFilesFallback(v.images,'variant-'+v.index);
    if(ok)done++;
  }
  return done
}
async function handleCombinationsPage(data){
  if(!isCombinationsPage())return false;
  await ensurePhotoAttribute(data);
  await setAllCombinationValues(data);
  await assignVariationPhotosDedicated(data);
  const save=exactVisible(document.body,/^Save and close$/i)||exactVisible(document.body,/^Save and preview$/i);
  if(save){save.click();await sleep(900);return true}
  return false
}

async function run(data){
  if(!data||!data.hasVariations)return;
  if(isCombinationsPage()){await handleCombinationsPage(data);return}
  if(isCreateVariationsPage()){
    const moved=await handleCreateVariationsPage(data);
    if(moved)return;
  }
  const scope=variationEditorSurface(data)||await openEditor(data);if(!scope){console.warn('Variations editor non trovato');return}
  await createDimensions(scope,data);
  let active=variationEditorSurface(data)||variationDialog()||scope;
  let prices=0;
  for(let i=0;i<28;i++){
    prices=fillRows(active,data);
    if(prices>0)break;
    await sleep(250);
    active=variationEditorSurface(data)||variationDialog()||active;
  }
  await assignImages(active,data);
  active=variationEditorSurface(data)||variationDialog()||active;
  const save=[...active.querySelectorAll('button,[role="button"]')].filter(visible).find(x=>/^(save|done|apply|confirm|continue)$/i.test(clean(x.innerText||x.textContent||''))||/save.*variation|apply.*variation|done.*variation/i.test(clean((x.innerText||x.textContent||'')+' '+(x.getAttribute('aria-label')||''))));
  if(save){save.click();await sleep(700)}
}
async function start(){
  for(let i=0;i<60;i++){const d=payload();if(d){await run(d);return}await sleep(200)}
}
window.addEventListener('capitan-variants-ready',e=>{if(e.detail&&e.detail.data)run(e.detail.data)});
start();
})();