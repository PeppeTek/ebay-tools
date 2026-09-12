javascript:(async()=>{
'use strict';
const PANEL_ID='capitan-sell-like-clone';
const PATCH_ID='capitan-variants-editor-v1';
if(document.getElementById(PATCH_ID))return;
const marker=document.createElement('span');marker.id=PATCH_ID;marker.style.display='none';document.documentElement.appendChild(marker);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const clean=v=>String(v==null?'':v).replace(/\s+/g,' ').trim();
const visible=e=>!!(e&&e.getClientRects&&e.getClientRects().length);
function payload(){return window.__capitanSellLikeVariants&&window.__capitanSellLikeVariants.data||null}
function saleFor(v){const state=window.__capitanSellLikeVariants||{};const d=Number(state.discountRate);const discount=isFinite(d)?d:.02;const source=Number(v&&v.sourcePrice);return isFinite(source)&&source>0?Math.round(source*(1-discount)*100)/100:null}
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
  const heads=[...document.querySelectorAll('h1,h2,h3,legend')].filter(visible).filter(x=>/^variations?$/i.test(clean(x.textContent)));
  for(const h of heads){let p=h.parentElement;for(let i=0;i<5&&p;i++,p=p.parentElement){if(!p.closest('#'+PANEL_ID)&&clean(p.innerText||'').length<8000)return p}}
  return null
}
function variationDialog(){
  return[...document.querySelectorAll('[role="dialog"],dialog')].filter(visible).find(x=>/variation/i.test(clean(x.innerText||x.textContent)))||null
}
async function openEditor(){
  let dlg=variationDialog();if(dlg)return dlg;
  const sec=variationSection();
  if(sec){
    const edit=[...sec.querySelectorAll('button,[role="button"],a')].filter(visible).find(x=>/^edit$/i.test(clean(x.innerText||x.textContent||''))||/edit.*variation|variation.*edit/i.test(clean((x.innerText||x.textContent||'')+' '+(x.getAttribute('aria-label')||''))));
    if(edit){edit.click();for(let i=0;i<28;i++){await sleep(250);dlg=variationDialog();if(dlg)return dlg;const s=variationSection();if(s&&s.querySelector('input,[role="combobox"]'))return s}}
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
  const cards=[...root.querySelectorAll('[data-testid*="variation" i],[class*="variation" i]')].filter(visible);
  return [...new Set(rows.concat(cards))];
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
  const scope=await openEditor();if(!scope){console.warn('Variations editor non trovato');return}
  await createDimensions(scope,data);
  let active=variationDialog()||scope;
  for(let i=0;i<20;i++){if(fillRows(active,data)>0)break;await sleep(250);active=variationDialog()||active}
  await assignImages(active,data);
  const dlg=variationDialog();
  if(dlg){const save=[...dlg.querySelectorAll('button,[role="button"]')].filter(visible).find(x=>/^(save|done|apply|confirm)$/i.test(clean(x.innerText||x.textContent||''))||/save.*variation/i.test(clean(x.innerText||x.textContent||'')));if(save){save.click();await sleep(500)}}
}
async function start(){
  for(let i=0;i<40;i++){const d=payload();if(d){await run(d);return}await sleep(200)}
}
window.addEventListener('capitan-variants-ready',e=>{if(e.detail&&e.detail.data)run(e.detail.data)});
start();
})();