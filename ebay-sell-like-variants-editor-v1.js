javascript:(async()=>{
'use strict';
const PANEL_ID='capitan-sell-like-clone';
const PATCH_ID='capitan-variants-editor-v6';
const VAR_STATE_KEY='capitan-sell-like-variants-state-v1';
if(document.getElementById(PATCH_ID))return;
const marker=document.createElement('span');marker.id=PATCH_ID;marker.style.display='none';document.documentElement.appendChild(marker);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const clean=v=>String(v==null?'':v).replace(/\s+/g,' ').trim();
const visible=e=>!!(e&&e.getClientRects&&e.getClientRects().length);
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
  const label=[...root.querySelectorAll('h1,h2,h3,h4,div,span')].filter(visible).find(x=>/attributes and options you(?:'|’)ve selected/i.test(clean(x.innerText||x.textContent||'')));
  if(!label)return null;
  let p=label;
  for(let i=0;i<5&&p;i++,p=p.parentElement){
    const t=clean(p.innerText||p.textContent||'');
    if(t.length<5000&&/attributes and options you(?:'|’)ve selected/i.test(t))return p;
  }
  return label.parentElement
}
function selectedText(root){const p=selectedPanel(root);return clean(p&&p.innerText||p&&p.textContent||'').toLowerCase()}
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
  const chips=[...root.querySelectorAll('button,[role="button"],div,span')].filter(visible).filter(x=>{
    const t=clean(x.innerText||x.textContent||'');
    return /^(MPN|Theme)\s*[x×]?$/i.test(t);
  });
  for(const chip of chips){
    const name=clean(chip.innerText||chip.textContent||'').replace(/\s*[x×]\s*$/i,'');
    if(wanted.has(name.toLowerCase()))continue;
    let done=false;
    const local=[...chip.querySelectorAll('button,[role="button"],a,[aria-label]')].filter(visible).find(x=>/remove|delete|close|\bx\b|×/i.test(clean((x.innerText||x.textContent||'')+' '+(x.getAttribute('aria-label')||''))));
    if(local){local.click();done=true}
    if(!done){
      const descendants=[...chip.querySelectorAll('span,div')].filter(visible).filter(x=>/^[x×]$/i.test(clean(x.innerText||x.textContent||'')));
      if(descendants[0]){descendants[0].click();done=true}
    }
    if(!done&&chip.matches('button,[role="button"]')){chip.click();done=true}
    if(done)await sleep(220);
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
  const low=clean(value).toLowerCase();if(!low)return false;
  return selectedText(root).includes(low)
}
async function selectSuggestedOption(root,value){
  const val=clean(value),low=val.toLowerCase();if(!val)return false;
  if(isOptionSelected(root,val))return true;
  const zone=optionsZone(root);
  const candidates=[...zone.querySelectorAll('button,[role="button"],a,label,div,span')].filter(visible).filter(x=>clean(x.innerText||x.textContent||'').toLowerCase()===low);
  if(!candidates.length)return false;
  const x=candidates.sort((a,b)=>a.childElementCount-b.childElementCount)[0];
  (x.closest('button,[role="button"],a,label')||x).click();
  for(let i=0;i<20;i++){await sleep(100);if(isOptionSelected(root,val))return true}
  return false
}
async function addCustomOption(root,value){
  const val=clean(value);if(!val)return false;
  if(isOptionSelected(root,val))return true;
  const zone=optionsZone(root);
  const create=[...zone.querySelectorAll('a,button,[role="button"],span,div')].filter(visible).find(x=>/create your own/i.test(clean(x.innerText||x.textContent||'')));
  if(!create)return false;
  let container=create;
  let input=null,add=null;
  for(let i=0;i<5&&container;i++,container=container.parentElement){
    input=[...container.querySelectorAll('input[type="text"],input:not([type]),textarea')].filter(visible)[0]||null;
    add=[...container.querySelectorAll('button,[role="button"],a')].filter(visible).find(x=>/^Add$/i.test(clean(x.innerText||x.textContent||'')))||null;
    if(input&&add)break;
  }
  if(!input){
    (create.closest('button,[role="button"],a')||create).click();await sleep(180);
    input=[...zone.querySelectorAll('input[type="text"],input:not([type]),textarea')].filter(visible)[0]||null;
    add=[...zone.querySelectorAll('button,[role="button"],a')].filter(visible).find(x=>/^Add$/i.test(clean(x.innerText||x.textContent||'')))||null;
  }
  if(!input)return false;
  setNative(input,val);await sleep(80);
  if(add)add.click();
  else{
    input.dispatchEvent(new KeyboardEvent('keydown',{bubbles:true,key:'Enter',code:'Enter'}));
    input.dispatchEvent(new KeyboardEvent('keyup',{bubbles:true,key:'Enter',code:'Enter'}));
  }
  for(let i=0;i<25;i++){await sleep(100);if(isOptionSelected(root,val))return true}
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
  const chosen=selectedText(root);
  if(expected.length&&!expected.every(v=>chosen.includes(v))){console.warn('Not all expected options are in selected panel; Continue skipped',expected,chosen);return false}
  const cont=[...root.querySelectorAll('button,[role="button"],a')].filter(visible).find(x=>/^Continue$/i.test(clean(x.innerText||x.textContent||'')));
  if(cont){cont.click();await sleep(1000);return true}
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
async function run(data){
  if(!data||!data.hasVariations)return;
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