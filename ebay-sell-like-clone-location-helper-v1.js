(async()=>{
'use strict';
const ID='capitan-sell-like-clone';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
const visible=e=>!!(e&&e.getClientRects&&e.getClientRects().length);
const panel=()=>document.getElementById(ID);

function patchUi(){
  const p=panel(); if(!p) return false;
  const title=p.querySelector('.h span'); if(title) title.textContent='Sell Like This v1.5';
  [...p.querySelectorAll('.row.muted')].forEach(x=>x.remove());
  if(!p.querySelector('[data-ebay-actions]')){
    const box=document.createElement('div');
    box.setAttribute('data-ebay-actions','1');
    box.style.cssText='padding:12px 14px;border-top:1px solid #ddd;display:grid;gap:8px;background:#fff;position:sticky;bottom:0;';
    box.innerHTML='<button data-ebay-action="list" style="height:44px;border:0;border-radius:24px;background:#1668e8;color:#fff;font-weight:700;font-size:14px;">List it</button><button data-ebay-action="save" style="height:42px;border:1px solid #111;border-radius:22px;background:#fff;color:#111;font-size:14px;">Save for later</button><button data-ebay-action="preview" style="height:42px;border:1px solid #111;border-radius:22px;background:#fff;color:#111;font-size:14px;">Preview</button>';
    p.appendChild(box);
    box.addEventListener('click',e=>{const b=e.target.closest('button[data-ebay-action]');if(!b)return;triggerNativeAction(b.dataset.ebayAction);});
  }
  return true;
}

function nativeButtons(){
  const p=panel();
  return [...document.querySelectorAll('button,a,[role="button"]')].filter(x=>visible(x)&&(!p||!p.contains(x)));
}
function triggerNativeAction(kind){
  const map={list:/^list it$/i,save:/^save for later$/i,preview:/^preview$/i};
  const btn=nativeButtons().find(x=>map[kind].test(clean(x.innerText||x.textContent||x.getAttribute('aria-label')||'')));
  if(btn){btn.click();return true}
  alert('Pulsante eBay non trovato: '+kind);return false;
}

function getLocationRow(){
  const p=panel();if(!p)return null;
  return [...p.querySelectorAll('#steps .row')].find(r=>/^Item Location:/i.test(clean(r.innerText||r.textContent)))||null;
}
function parseDisplayFromRow(row){
  if(!row)return'';
  const t=clean(row.innerText||row.textContent).replace(/^Item Location:\s*/i,'');
  const m=t.match(/sorgente:\s*(.*?)(?:\s+—|$)/i);
  return clean(m?m[1]:t.replace(/campo eBay.*$/i,''));
}
function partsFromDisplay(display){
  const a=display.split(',').map(clean).filter(Boolean);
  return {display,city:a[0]||'',stateOrProvince:a[1]||'',postalCode:a[2]||'',country:a[3]||''};
}
function maskedPostal(v){return /[*xX]/.test(String(v||''));}
function countryDisplay(v){const n={US:'United States',USA:'United States',GB:'United Kingdom',UK:'United Kingdom',AU:'Australia',CA:'Canada'};return n[String(v||'').toUpperCase()]||v;}
function labelControl(re,root=document){
  for(const l of root.querySelectorAll('label')){
    const txt=clean(l.innerText||l.textContent);if(!re.test(txt))continue;
    let c=l.htmlFor?document.getElementById(l.htmlFor):l.querySelector('input,textarea,select,[role="combobox"]');if(c)return c;
    let p=l.parentElement;for(let i=0;i<6&&p;i++,p=p.parentElement){c=p.querySelector('input,textarea,select,[role="combobox"]');if(c)return c}
  }
  for(const c of root.querySelectorAll('input,textarea,select,[role="combobox"]')){
    const txt=clean([c.name,c.id,c.getAttribute('aria-label'),c.getAttribute('placeholder')].join(' '));if(re.test(txt))return c;
  }
  return null;
}
function setControl(el,value){
  if(!el||value==null||value==='')return false; value=String(value);
  if(el.tagName==='SELECT'){
    const wanted=clean(value).toLowerCase(),alt=clean(countryDisplay(value)).toLowerCase();
    const o=[...el.options].find(x=>clean(x.value).toLowerCase()===wanted||clean(x.textContent).toLowerCase()===wanted||clean(x.textContent).toLowerCase()===alt);if(!o)return false;
    el.value=o.value;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));return true;
  }
  if(el.getAttribute('role')==='combobox'){el.click();return false}
  if(!(el instanceof HTMLInputElement||el instanceof HTMLTextAreaElement))return false;
  const proto=el instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
  const setter=Object.getOwnPropertyDescriptor(proto,'value')?.set;setter?setter.call(el,value):el.value=value;
  el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));el.dispatchEvent(new KeyboardEvent('keyup',{bubbles:true,key:'Tab'}));el.blur?.();return true;
}
async function setCombo(re,value,root=document,isCountry=false){
  if(!value)return false;const c=labelControl(re,root);if(!c)return false;
  const wanted=isCountry?countryDisplay(value):value;
  if(c.tagName==='SELECT'||c instanceof HTMLInputElement||c instanceof HTMLTextAreaElement)return setControl(c,wanted);
  c.click();await sleep(250);
  const targets=[clean(value).toLowerCase(),clean(wanted).toLowerCase()];
  const o=[...document.querySelectorAll('[role="option"],li,button')].filter(visible).find(x=>targets.includes(clean(x.innerText||x.textContent).toLowerCase()));
  if(o){o.click();await sleep(150);return true}return false;
}
function locationAnchor(){
  const all=[...document.querySelectorAll('h1,h2,h3,h4,label,legend,span,div')].filter(visible);
  return all.find(x=>/^(item location|located in)$/i.test(clean(x.innerText||x.textContent)))||all.find(x=>/item location/i.test(clean(x.innerText||x.textContent))&&clean(x.innerText||x.textContent).length<120)||null;
}
async function waitForLocationForm(){
  for(let i=0;i<25;i++){
    const root=document.querySelector('[role="dialog"]')||document;
    const city=labelControl(/^(city\s*,\s*state|city|town|suburb)$/i,root);
    const zip=labelControl(/^(zip|zip code|postal code|postcode)$/i,root);
    const country=labelControl(/^(country|country\s+or\s+region|country\/region)$/i,root);
    if(city||zip||country)return root;
    await sleep(120);
  }
  return document.querySelector('[role="dialog"]')||document;
}
async function openLocationEditor(){
  const anchor=locationAnchor();
  if(anchor){
    let p=anchor;for(let i=0;i<7&&p;i++,p=p.parentElement){
      const btn=[...p.querySelectorAll('button,a,[role="button"]')].filter(visible).find(x=>/edit|change|update/i.test(clean((x.getAttribute('aria-label')||'')+' '+(x.innerText||x.textContent||''))));
      if(btn){btn.click();break}
    }
  }
  return await waitForLocationForm();
}
function findDoneButton(root=document){
  const scopes=[root,document].filter(Boolean);
  for(const scope of scopes){
    const btn=[...scope.querySelectorAll('button,a,[role="button"]')].filter(visible).find(x=>/^(done|save|apply|confirm|update)$/i.test(clean((x.innerText||x.textContent||'')+' '+(x.getAttribute('aria-label')||''))));
    if(btn)return btn;
  }
  return null;
}
async function applyLocation(parts){
  const root=await openLocationEditor();let changed=0;
  changed+=await setCombo(/^(country|country\s+or\s+region|country\/region)$/i,parts.country,root,true)?1:0;
  const cityState=[parts.city,parts.stateOrProvince].filter(Boolean).join(', ');
  const combined=labelControl(/^city\s*,\s*state$/i,root);
  if(combined&&cityState) changed+=setControl(combined,cityState)?1:0;
  else {
    changed+=setControl(labelControl(/^(city|town|suburb)$/i,root),parts.city)?1:0;
    changed+=await setCombo(/^(state|province|state\/province|region)$/i,parts.stateOrProvince,root)?1:0;
  }
  if(parts.postalCode&&!maskedPostal(parts.postalCode))changed+=setControl(labelControl(/^(zip|zip code|postal code|postcode)$/i,root),parts.postalCode)?1:0;
  if(!changed&&parts.display)changed+=setControl(labelControl(/^(item location|located in|location)$/i,root),parts.display)?1:0;
  if(changed){
    await sleep(350);
    const done=findDoneButton(root);
    if(done){done.click();await sleep(450)}
  }
  return changed>0;
}
function writeLocation(row,state,msg){if(!row)return;row.innerHTML='<b>Item Location:</b> <span class="'+state+'">'+String(msg||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</span>';}

for(let i=0;i<40&&!patchUi();i++)await sleep(100);
let row=null;for(let i=0;i<900;i++){row=getLocationRow();if(row)break;await sleep(100)}
if(!row)return;
const display=parseDisplayFromRow(row);if(!display)return;
const parts=partsFromDisplay(display);
try{
  const ok=await applyLocation(parts);
  if(ok)writeLocation(row,'ok',display+(maskedPostal(parts.postalCode)?' — ZIP sorgente mascherato; copiati Country e City/State, poi Done':' — copiato dalla sorgente e confermato con Done'));
  else writeLocation(row,'warn','sorgente: '+display+' — campi Item Location non modificabili automaticamente');
}catch(e){console.warn('Sell Like This location',e);writeLocation(row,'warn','sorgente: '+display+' — copia automatica non riuscita');}
})();