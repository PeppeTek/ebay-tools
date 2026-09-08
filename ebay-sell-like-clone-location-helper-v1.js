(async()=>{
'use strict';
const ID='capitan-sell-like-clone';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
const visible=e=>!!(e&&e.getClientRects&&e.getClientRects().length);
const panel=()=>document.getElementById(ID);

function patchUi(){
  const p=panel(); if(!p) return false;
  const title=p.querySelector('.h span'); if(title) title.textContent='Sell Like This v1.4';
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
function nativeButtons(){const p=panel();return [...document.querySelectorAll('button,a,[role="button"]')].filter(x=>visible(x)&&(!p||!p.contains(x)));}
function triggerNativeAction(kind){const map={list:/^list it$/i,save:/^save for later$/i,preview:/^preview$/i};const btn=nativeButtons().find(x=>map[kind].test(clean(x.innerText||x.textContent||x.getAttribute('aria-label')||'')));if(btn){btn.click();return true}alert('Pulsante eBay non trovato: '+kind);return false;}

function getLocationRow(){const p=panel();if(!p)return null;return [...p.querySelectorAll('#steps .row')].find(r=>/^Item Location:/i.test(clean(r.innerText||r.textContent)))||null;}
function parseDisplayFromRow(row){if(!row)return'';const t=clean(row.innerText||row.textContent).replace(/^Item Location:\s*/i,'');const m=t.match(/sorgente:\s*(.*?)(?:\s+—|$)/i);return clean(m?m[1]:t.replace(/campo eBay.*$/i,''));}
function partsFromDisplay(display){const a=display.split(',').map(clean).filter(Boolean);return {display,city:a[0]||'',stateOrProvince:a[1]||'',postalCode:a[2]||'',country:a[3]||''};}
function maskedPostal(v){return /[*xX]/.test(String(v||''));}
function countryDisplay(v){const n={US:'United States',USA:'United States',GB:'United Kingdom',UK:'United Kingdom',AU:'Australia',CA:'Canada'};return n[String(v||'').toUpperCase()]||v;}
const US_STATES={'alabama':'AL','alaska':'AK','arizona':'AZ','arkansas':'AR','california':'CA','colorado':'CO','connecticut':'CT','delaware':'DE','florida':'FL','georgia':'GA','hawaii':'HI','idaho':'ID','illinois':'IL','indiana':'IN','iowa':'IA','kansas':'KS','kentucky':'KY','louisiana':'LA','maine':'ME','maryland':'MD','massachusetts':'MA','michigan':'MI','minnesota':'MN','mississippi':'MS','missouri':'MO','montana':'MT','nebraska':'NE','nevada':'NV','new hampshire':'NH','new jersey':'NJ','new mexico':'NM','new york':'NY','north carolina':'NC','north dakota':'ND','ohio':'OH','oklahoma':'OK','oregon':'OR','pennsylvania':'PA','rhode island':'RI','south carolina':'SC','south dakota':'SD','tennessee':'TN','texas':'TX','utah':'UT','vermont':'VT','virginia':'VA','washington':'WA','west virginia':'WV','wisconsin':'WI','wyoming':'WY','district of columbia':'DC'};
function stateAbbr(v){v=clean(v);return /^[A-Za-z]{2}$/.test(v)?v.toUpperCase():(US_STATES[v.toLowerCase()]||'');}
async function resolveMaskedUsPostal(parts){
  if(!maskedPostal(parts.postalCode)||!/^US(?:A)?$/i.test(clean(parts.country))||!parts.city||!parts.stateOrProvince)return'';
  const prefix=String(parts.postalCode||'').replace(/\D/g,'');
  const st=stateAbbr(parts.stateOrProvince);if(!st)return'';
  try{
    const url='https://api.zippopotam.us/us/'+encodeURIComponent(st)+'/'+encodeURIComponent(parts.city);
    const r=await fetch(url,{mode:'cors',credentials:'omit',cache:'no-store'});if(!r.ok)return'';
    const data=await r.json();
    const places=Array.isArray(data.places)?data.places:[];
    const exact=places.find(p=>clean(p['place name']).toLowerCase()===clean(parts.city).toLowerCase()&&(!prefix||String(p['post code']||'').startsWith(prefix)));
    const pref=places.find(p=>!prefix||String(p['post code']||'').startsWith(prefix));
    return clean((exact||pref||places[0]||{})['post code']||'');
  }catch(e){console.warn('ZIP resolve failed',e);return'';}
}
function controlsIn(root){return [...root.querySelectorAll('input,textarea,select,[role="combobox"]')].filter(visible);}
function fieldByCaption(re,root=document){
  for(const l of [...root.querySelectorAll('label')].filter(visible)){
    if(!re.test(clean(l.innerText||l.textContent)))continue;
    let c=l.htmlFor?document.getElementById(l.htmlFor):null;if(c&&visible(c))return c;
    c=l.querySelector('input,textarea,select,[role="combobox"]');if(c&&visible(c))return c;
  }
  const captions=[...root.querySelectorAll('div,span,p,strong')].filter(visible).filter(x=>{const t=clean(x.innerText||x.textContent);return t.length<80&&re.test(t);});
  for(const cap of captions){let p=cap.parentElement;for(let i=0;i<5&&p;i++,p=p.parentElement){const cs=controlsIn(p);if(cs.length===1)return cs[0];if(cs.length>1){const r=cap.getBoundingClientRect();const below=cs.filter(c=>c.getBoundingClientRect().top>=r.top-4).sort((a,b)=>Math.abs(a.getBoundingClientRect().top-r.bottom)-Math.abs(b.getBoundingClientRect().top-r.bottom));if(below[0])return below[0];}}}
  return controlsIn(root).find(c=>re.test(clean([c.name,c.id,c.getAttribute('aria-label'),c.getAttribute('placeholder')].join(' '))))||null;
}
function nativeValueSetter(el,value){
  const proto=el instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
  const setter=Object.getOwnPropertyDescriptor(proto,'value')?.set;if(!setter)return false;
  const old=el.value;setter.call(el,String(value));
  if(el._valueTracker&&typeof el._valueTracker.setValue==='function')el._valueTracker.setValue(old);
  el.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:String(value)}));
  el.dispatchEvent(new Event('change',{bubbles:true}));return true;
}
async function typeLikeUser(el,value){
  if(!el||value==null||value==='')return false;value=String(value);el.focus();
  try{el.setSelectionRange(0,String(el.value||'').length)}catch(_){}
  nativeValueSetter(el,value);
  el.dispatchEvent(new KeyboardEvent('keydown',{bubbles:true,key:'Tab',code:'Tab',keyCode:9,which:9}));
  el.dispatchEvent(new KeyboardEvent('keyup',{bubbles:true,key:'Tab',code:'Tab',keyCode:9,which:9}));
  el.blur();await sleep(250);return clean(el.value)===clean(value);
}
async function setChoice(el,value,isCountry=false){
  if(!el||!value)return false;const wanted=isCountry?countryDisplay(value):value;
  if(el.tagName==='SELECT'){
    const a=clean(wanted).toLowerCase(),b=clean(value).toLowerCase();const o=[...el.options].find(x=>[a,b].includes(clean(x.textContent).toLowerCase())||[a,b].includes(clean(x.value).toLowerCase()));if(!o)return false;
    const old=el.value;el.value=o.value;if(el._valueTracker&&typeof el._valueTracker.setValue==='function')el._valueTracker.setValue(old);el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));return true;
  }
  if(el instanceof HTMLInputElement||el instanceof HTMLTextAreaElement){if(clean(el.value).toLowerCase()===clean(wanted).toLowerCase())return true;return await typeLikeUser(el,wanted);}
  el.click?.();await sleep(250);const targets=[clean(value).toLowerCase(),clean(wanted).toLowerCase()];const option=[...document.querySelectorAll('[role="option"],li,button')].filter(visible).find(x=>targets.includes(clean(x.innerText||x.textContent).toLowerCase()));if(option){option.click();await sleep(250);return true}return false;
}
function locationAnchor(){const all=[...document.querySelectorAll('h1,h2,h3,h4,label,legend,span,div')].filter(visible);return all.find(x=>/^(item location|located in)$/i.test(clean(x.innerText||x.textContent)))||all.find(x=>/item location/i.test(clean(x.innerText||x.textContent))&&clean(x.innerText||x.textContent).length<120)||null;}
function settingsRoot(){const heads=[...document.querySelectorAll('h1,h2,h3,div,span')].filter(visible).filter(x=>/^your settings$/i.test(clean(x.innerText||x.textContent)));for(const h of heads){let p=h;for(let i=0;i<8&&p;i++,p=p.parentElement){if(/item location/i.test(clean(p.innerText||p.textContent))&&controlsIn(p).length>=2)return p}}return document.querySelector('[role="dialog"]')||document;}
async function waitForLocationForm(){for(let i=0;i<40;i++){const root=settingsRoot();if(fieldByCaption(/^city\s*,\s*state$/i,root)||fieldByCaption(/^zip code$/i,root)||fieldByCaption(/^country or region$/i,root))return root;await sleep(120)}return settingsRoot();}
async function openLocationEditor(){const anchor=locationAnchor();if(anchor){let p=anchor;for(let i=0;i<8&&p;i++,p=p.parentElement){const btn=[...p.querySelectorAll('button,a,[role="button"]')].filter(visible).find(x=>/edit|change|update/i.test(clean((x.getAttribute('aria-label')||'')+' '+(x.innerText||x.textContent||''))));if(btn){btn.click();break}}}return await waitForLocationForm();}
function findDoneButton(root=document){return [...document.querySelectorAll('button,a,[role="button"]')].filter(visible).find(x=>/^done$/i.test(clean(x.innerText||x.textContent||x.getAttribute('aria-label')||'')))||[...root.querySelectorAll('button,a,[role="button"]')].filter(visible).find(x=>/^(done|save|apply|confirm|update)$/i.test(clean(x.innerText||x.textContent||x.getAttribute('aria-label')||'')))||null;}
function summaryText(){
  const p=panel();
  const nodes=[...document.querySelectorAll('div,section,p,span')].filter(visible).filter(x=>!p||!p.contains(x));
  const candidates=nodes.filter(x=>/item location/i.test(clean(x.innerText||x.textContent))&&clean(x.innerText||x.textContent).length<300);
  return candidates.map(x=>clean(x.innerText||x.textContent)).join(' | ');
}
function summaryMatches(parts,postal){
  const t=summaryText().toLowerCase();
  const city=clean(parts.city).toLowerCase(),state=clean(parts.stateOrProvince).toLowerCase(),zip=clean(postal).toLowerCase();
  return (!city||t.includes(city))&&(!state||t.includes(state))&&(!zip||t.includes(zip));
}
async function saveAndVerify(root,parts,postal){
  const done=findDoneButton(root);if(!done)return false;done.click();
  for(let i=0;i<30;i++){await sleep(180);if(summaryMatches(parts,postal))return true;}
  return false;
}
async function applyLocation(parts){
  const resolvedPostal=maskedPostal(parts.postalCode)?await resolveMaskedUsPostal(parts):clean(parts.postalCode);
  if(maskedPostal(parts.postalCode)&&!resolvedPostal)return {ok:false,reason:'ZIP sorgente mascherato e impossibile ricavare un CAP valido'};
  let root=await openLocationEditor();
  const country=fieldByCaption(/^country\s+or\s+region$/i,root)||fieldByCaption(/^country$/i,root);
  const city=fieldByCaption(/^city\s*,\s*state$/i,root);
  const zip=fieldByCaption(/^zip code$/i,root)||fieldByCaption(/^(zip|postal code|postcode)$/i,root);
  const cityState=[parts.city,parts.stateOrProvince].filter(Boolean).join(', ');

  if(country&&parts.country)await setChoice(country,parts.country,true);
  // ZIP prima: eBay usa il CAP per validare/normalizzare City, State.
  if(zip&&resolvedPostal)await typeLikeUser(zip,resolvedPostal);
  await sleep(450);
  if(city&&cityState)await typeLikeUser(city,cityState);
  await sleep(450);

  const cityOk=!city||!cityState||clean(city.value).toLowerCase()===clean(cityState).toLowerCase();
  const zipOk=!zip||!resolvedPostal||clean(zip.value)===clean(resolvedPostal);
  if(!(cityOk&&zipOk))return {ok:false,reason:'i campi eBay non hanno mantenuto i nuovi valori'};

  const ok=await saveAndVerify(root,parts,resolvedPostal);
  return {ok:ok,postal:resolvedPostal,reason:ok?'':'eBay ha ripristinato la location precedente dopo Done'};
}
function writeLocation(row,state,msg){if(!row)return;row.innerHTML='<b>Item Location:</b> <span class="'+state+'">'+String(msg||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</span>';}

for(let i=0;i<40&&!patchUi();i++)await sleep(100);
let row=null;for(let i=0;i<900;i++){row=getLocationRow();if(row)break;await sleep(100)}
if(!row)return;
const display=parseDisplayFromRow(row);if(!display)return;
const parts=partsFromDisplay(display);
try{
  const result=await applyLocation(parts);
  if(result.ok)writeLocation(row,'ok',parts.city+', '+parts.stateOrProvince+', '+result.postal+', '+parts.country+' — location salvata e verificata');
  else writeLocation(row,'warn','sorgente: '+display+' — '+result.reason);
}catch(e){console.warn('Sell Like This location',e);writeLocation(row,'warn','sorgente: '+display+' — copia automatica non riuscita');}
})();