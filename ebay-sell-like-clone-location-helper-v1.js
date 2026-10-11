(async()=>{
'use strict';
const ID='capitan-sell-like-clone';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
const visible=e=>!!(e&&e.getClientRects&&e.getClientRects().length);
const panel=()=>document.getElementById(ID);
const FIXED_ITEM_LOCATION=Object.freeze({city:'Fort Pierce',stateOrProvince:'Florida',postalCode:'34981',country:'US'});
const POLICY_TARGETS=Object.freeze({returns:'No Return Accepted',shipping:'UPS 3 Day Select United States',payment:'Payment Policy'});
function reportSetting(message,state='warn'){
  const t=String(message||'');
  if(typeof window.__capitanTestLog==='function')window.__capitanTestLog(t,state);
  else (window.__capitanPendingTestLogs=window.__capitanPendingTestLogs||[]).push({message:t,state});
}

function patchUi(){
  const p=panel(); if(!p) return false;
  const title=p.querySelector('.h span'); if(title) title.textContent='Sell Like This v1.4';
  [...p.querySelectorAll('.row.muted')].forEach(x=>x.remove());

  // Remove the redundant publication row from the summary.
  [...p.querySelectorAll('#steps .row')].forEach(r=>{
    if(/^Pubblicazione:/i.test(clean(r.innerText||r.textContent))) r.remove();
  });

  if(!p.querySelector('[data-ebay-actions]')){
    const box=document.createElement('div');
    box.setAttribute('data-ebay-actions','1');
    box.style.cssText='padding:12px 14px;border-top:1px solid #ddd;display:grid;gap:8px;background:#fff;position:sticky;bottom:0;';
    box.innerHTML='<div data-amazon-actions-slot style="display:grid;grid-template-columns:1fr 1fr;gap:4px"></div><button data-ebay-action="list" style="height:44px;border:0;border-radius:24px;background:#1668e8;color:#fff;font-weight:700;font-size:14px;">List it</button><div data-ebay-secondary-pair style="display:grid;grid-template-columns:1fr 1fr;gap:4px"><button data-ebay-action="save" style="height:42px;border:1px solid #111;border-radius:22px 0 0 22px;background:#fff;color:#111;font-size:14px;">Save for later</button><button data-ebay-action="preview" style="height:42px;border:1px solid #111;border-radius:0 22px 22px 0;background:#f1f3f4;color:#111;font-size:14px;">Preview</button></div>';
    p.appendChild(box);
    box.addEventListener('click',async e=>{const b=e.target.closest('button[data-ebay-action]');if(!b)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();const kind=b.dataset.ebayAction;const needsAi=kind==='preview';if(needsAi&&typeof window.__capitanEnsureAiTemplate==='function'){if(b.dataset.aiBusy==='1')return;const label=b.textContent;b.dataset.aiBusy='1';b.disabled=true;b.textContent='Preparazione AI…';try{window.__capitanTestLog?.('AI richiesta prima di '+kind,'warn');await window.__capitanEnsureAiTemplate();if(kind==='csv'){if(typeof window.__capitanDownloadVariantCsv==='function')window.__capitanDownloadVariantCsv();else throw Error('CSV varianti non ancora pronto.')}else{triggerNativeAction(kind)}window.__capitanTestLog?.((kind==='csv'?'CSV':kind==='list'?'List it':'Preview')+' avviato dopo AI','ok')}catch(err){console.warn('Sell Like action AI',err);const st=panel()?.querySelector('#st');if(st)st.innerHTML='<span class="bad">Azione non avviata.</span> '+String(err&&err.message||err);window.__capitanTestLog?.('Azione '+kind+' bloccata: '+String(err&&err.message||err),'bad')}finally{b.dataset.aiBusy='0';b.disabled=false;b.textContent=label}return}if(kind==='csv'){if(typeof window.__capitanDownloadVariantCsv==='function')window.__capitanDownloadVariantCsv();else alert('CSV varianti non ancora pronto.');return}triggerNativeAction(kind);},true);
  }

  // Move the completion message to the bottom, immediately before the action buttons.
  const actions=p.querySelector('[data-ebay-actions]');
  const status=p.querySelector('#st');
  if(actions&&status&&status.nextElementSibling!==actions){
    status.style.cssText='padding:9px 14px;border-top:1px solid #eee;border-bottom:0;background:#fff;line-height:1.35';
    actions.parentNode.insertBefore(status,actions);
  }
  return true;
}
function nativeButtons(){const p=panel();return [...document.querySelectorAll('button,a,[role="button"]')].filter(x=>visible(x)&&(!p||!p.contains(x)));}
function triggerNativeAction(kind){const map={list:/^list it$/i,save:/^save for later$/i,preview:/^preview$/i};const btn=nativeButtons().find(x=>map[kind].test(clean(x.innerText||x.textContent||x.getAttribute('aria-label')||'')));if(btn){btn.click();return true}alert('Pulsante eBay non trovato: '+kind);return false;}

function getLocationRow(){const p=panel();if(!p)return null;return [...p.querySelectorAll('#steps .row')].find(r=>/^Item Location:/i.test(clean(r.innerText||r.textContent)))||null;}
function parseDisplayFromRow(row){if(!row)return'';const t=clean(row.innerText||row.textContent).replace(/^Item Location:\s*/i,'');const m=t.match(/sorgente:\s*(.*?)(?:\s+—|$)/i);return clean(m?m[1]:t.replace(/campo eBay.*$/i,''));}
function partsFromDisplay(display){const a=display.split(',').map(clean).filter(Boolean);if(a.length===3&&/^(?:US|USA|United States|United States of America)$/i.test(a[2]))return {display,city:a[0]||'',stateOrProvince:a[1]||'',postalCode:'',country:a[2]||''};return {display,city:a[0]||'',stateOrProvince:a[1]||'',postalCode:a[2]||'',country:a[3]||''};}
function cloneData(){try{return window.__capitanSellLikeCloneData||JSON.parse(localStorage.getItem('capitan-sell-like-clone-data-v1')||'null')}catch(_){return window.__capitanSellLikeCloneData||null}}
function locationParts(display){
  const parsed=partsFromDisplay(clean(display));
  const d=cloneData()||{},p=d.itemLocationParts||{};
  const pc=clean(p.city),ps=clean(p.stateOrProvince),pz=clean(p.postalCode),pco=clean(p.country);
  const sameCity=!parsed.city||!pc||parsed.city.toLowerCase()===pc.toLowerCase();
  const sameState=!parsed.stateOrProvince||!ps||parsed.stateOrProvince.toLowerCase()===ps.toLowerCase();
  if(sameCity&&sameState){
    return {
      display:clean(display),
      city:parsed.city||pc,
      stateOrProvince:parsed.stateOrProvince||ps,
      postalCode:parsed.postalCode||pz,
      country:parsed.country||pco
    }
  }
  return parsed
}
function maskedPostal(v){return /[*xX]/.test(String(v||''));}
function countryDisplay(v){
  const raw=clean(v),code=raw.toUpperCase();
  if(/^[A-Z]{2}$/.test(code)){
    try{
      const dn=new Intl.DisplayNames(['en'],{type:'region'});
      const name=clean(dn.of(code));
      if(name&&name!==code)return name
    }catch(_){}
  }
  const n={US:'United States',USA:'United States',GB:'United Kingdom',UK:'United Kingdom',AU:'Australia',CA:'Canada',PK:'Pakistan'};
  return n[code]||raw
}
function locationDisplay(parts,postal){
  return [clean(parts.city),clean(parts.stateOrProvince),clean(postal),countryDisplay(parts.country)].filter(Boolean).join(', ')
}
const US_STATES={'alabama':'AL','alaska':'AK','arizona':'AZ','arkansas':'AR','california':'CA','colorado':'CO','connecticut':'CT','delaware':'DE','florida':'FL','georgia':'GA','hawaii':'HI','idaho':'ID','illinois':'IL','indiana':'IN','iowa':'IA','kansas':'KS','kentucky':'KY','louisiana':'LA','maine':'ME','maryland':'MD','massachusetts':'MA','michigan':'MI','minnesota':'MN','mississippi':'MS','missouri':'MO','montana':'MT','nebraska':'NE','nevada':'NV','new hampshire':'NH','new jersey':'NJ','new mexico':'NM','new york':'NY','north carolina':'NC','north dakota':'ND','ohio':'OH','oklahoma':'OK','oregon':'OR','pennsylvania':'PA','rhode island':'RI','south carolina':'SC','south dakota':'SD','tennessee':'TN','texas':'TX','utah':'UT','vermont':'VT','virginia':'VA','washington':'WA','west virginia':'WV','wisconsin':'WI','wyoming':'WY','district of columbia':'DC'};
function stateAbbr(v){v=clean(v);return /^[A-Za-z]{2}$/.test(v)?v.toUpperCase():(US_STATES[v.toLowerCase()]||'');}
async function resolveMaskedUsPostal(parts){
  const country=clean(parts.country);const needsZip=maskedPostal(parts.postalCode)||!clean(parts.postalCode);
  if(!needsZip||!/^(?:US|USA|United States|United States of America)$/i.test(country)||!parts.city||!parts.stateOrProvince)return'';
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
  const setter=Object.getOwnPropertyDescriptor(proto,'value')?.set;
  if(!setter)return false;
  const old=el.value;setter.call(el,String(value));
  if(el._valueTracker&&typeof el._valueTracker.setValue==='function')el._valueTracker.setValue(old);
  try{el.dispatchEvent(new InputEvent('beforeinput',{bubbles:true,inputType:'insertText',data:String(value)}))}catch(_){}
  try{el.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:String(value)}))}catch(_){el.dispatchEvent(new Event('input',{bubbles:true}))}
  el.dispatchEvent(new Event('change',{bubbles:true}));
  return true
}
function setTextControl(el,value){
  if(!el||value==null||value==='')return false;value=String(value);
  if(!(el instanceof HTMLInputElement||el instanceof HTMLTextAreaElement))return false;
  el.focus();
  try{el.setSelectionRange(0,String(el.value||'').length)}catch(_){}
  nativeValueSetter(el,value);
  el.dispatchEvent(new KeyboardEvent('keydown',{bubbles:true,key:'Tab',code:'Tab',keyCode:9,which:9}));
  el.dispatchEvent(new KeyboardEvent('keyup',{bubbles:true,key:'Tab',code:'Tab',keyCode:9,which:9}));
  el.blur();
  return clean(el.value)===clean(value)
}
async function typeLikeUser(el,value){
  if(!el||value==null||value==='')return false;
  el.focus();
  try{el.select?.()}catch(_){}
  let ok=false;
  try{ok=document.execCommand('insertText',false,String(value))}catch(_){}
  if(!ok||clean(el.value)!==clean(value))ok=setTextControl(el,value);
  await sleep(220);
  return !!ok&&clean(el.value)===clean(value)
}
async function setChoice(el,value,isCountry=false){
  if(!el||!value)return false;const wanted=isCountry?countryDisplay(value):value;
  if(el.tagName==='SELECT'){
    const a=clean(wanted).toLowerCase(),b=clean(value).toLowerCase();const o=[...el.options].find(x=>[a,b].includes(clean(x.textContent).toLowerCase())||[a,b].includes(clean(x.value).toLowerCase()));if(!o)return false;
    const old=el.value;el.value=o.value;if(el._valueTracker&&typeof el._valueTracker.setValue==='function')el._valueTracker.setValue(old);el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));return true;
  }
  if(el instanceof HTMLInputElement||el instanceof HTMLTextAreaElement){
    if(clean(el.value).toLowerCase()===clean(wanted).toLowerCase())return true;
    if(isCountry){
      if(el.disabled)return false;
      el.click();await sleep(220);
      const options=[...document.querySelectorAll('[role="option"],li,button')].filter(visible);
      const match=options.find(x=>clean(x.innerText||x.textContent).toLowerCase()===clean(wanted).toLowerCase());
      if(match){match.click();await sleep(280);return clean(el.value).toLowerCase()===clean(wanted).toLowerCase()}
      if(el.readOnly)return false;
    }
    return await typeLikeUser(el,wanted)
  }
  el.click?.();await sleep(250);const targets=[clean(value).toLowerCase(),clean(wanted).toLowerCase()];const option=[...document.querySelectorAll('[role="option"],li,button')].filter(visible).find(x=>targets.includes(clean(x.innerText||x.textContent).toLowerCase()));if(option){option.click();await sleep(250);return true}return false;
}
function locationAnchor(){const all=[...document.querySelectorAll('h1,h2,h3,h4,label,legend,span,div')].filter(visible);return all.find(x=>/^(item location|located in)$/i.test(clean(x.innerText||x.textContent)))||all.find(x=>/item location/i.test(clean(x.innerText||x.textContent))&&clean(x.innerText||x.textContent).length<120)||null;}
function settingsRoot(){const heads=[...document.querySelectorAll('h1,h2,h3,div,span')].filter(visible).filter(x=>/^your settings$/i.test(clean(x.innerText||x.textContent)));for(const h of heads){let p=h;for(let i=0;i<8&&p;i++,p=p.parentElement){if(/item location/i.test(clean(p.innerText||p.textContent))&&controlsIn(p).length>=2)return p}}return document.querySelector('[role="dialog"]')||document;}
async function waitForLocationForm(){for(let i=0;i<40;i++){const root=settingsRoot();if(fieldByCaption(/^city\s*,\s*state$/i,root)||fieldByCaption(/^zip code$/i,root)||fieldByCaption(/^country or region$/i,root))return root;await sleep(120)}return settingsRoot();}
let __capitanLocationDialog=null;
function normalizePageAfterLocation(){
  try{
    for(const el of [document.documentElement,document.body].filter(Boolean)){
      el.style.removeProperty('pointer-events');
      el.style.removeProperty('touch-action');
      if(getComputedStyle(el).overflow==='hidden'){
        el.style.removeProperty('overflow');
        el.style.removeProperty('overflow-y');
      }
    }
  }catch(_){}
}
async function closeLocationDialog(){
  const dlg=__capitanLocationDialog;
  if(!dlg){normalizePageAfterLocation();return}
  for(let i=0;i<15;i++){
    if(!dlg.isConnected||!visible(dlg)){__capitanLocationDialog=null;normalizePageAfterLocation();return}
    await sleep(100);
  }
  try{
    const close=[...dlg.querySelectorAll('button,a,[role="button"]')].filter(visible).find(x=>{
      const t=clean((x.innerText||x.textContent||'')+' '+(x.getAttribute('aria-label')||'')+' '+(x.getAttribute('title')||''));
      return /^(close|cancel|x|×|done)$/i.test(t)||/close dialog|dismiss/i.test(t);
    });
    if(close){close.click();await sleep(250)}
  }catch(_){}
  __capitanLocationDialog=null;
  normalizePageAfterLocation();
}
async function openLocationEditor(){
  const anchor=locationAnchor();
  if(anchor){
    let p=anchor;
    for(let i=0;i<8&&p;i++,p=p.parentElement){
      const buttons=[...p.querySelectorAll('button,a,[role="button"]')].filter(visible);
      const btn=buttons.find(x=>/edit|change|update/i.test(clean((x.getAttribute('aria-label')||'')+' '+(x.getAttribute('title')||'')+' '+(x.innerText||x.textContent||''))))||(buttons.length===1?buttons[0]:null);
      if(btn){btn.click();break}
    }
  }
  const root=await waitForLocationForm();
  try{
    const dlg=(root&&root.closest&&root.closest('[role="dialog"],dialog'))||document.querySelector('[role="dialog"],dialog')||null;
    __capitanLocationDialog=dlg||((root&&root!==document&&root!==document.body)?root:null)
  }catch(_){__capitanLocationDialog=(root&&root!==document&&root!==document.body)?root:null}
  return root;
}
function restoreHiddenLocationEditor(){closeLocationDialog();}
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
  let done=[...root.querySelectorAll('button,a,[role="button"]')].filter(visible).find(x=>/^(done|save|apply|confirm|update)$/i.test(clean(x.innerText||x.textContent||x.getAttribute('aria-label')||'')));
  if(!done)done=findDoneButton(root);
  if(!done){await closeLocationDialog();return false}
  done.click();
  await sleep(350);
  await closeLocationDialog();
  return true
}
async function fillLocationForm(root,parts,resolvedPostal){
  const country=fieldByCaption(/^country\s+or\s+region$/i,root)||fieldByCaption(/^country$/i,root);
  if(!country||!await setChoice(country,parts.country,true))return false;
  // React may remount the city/ZIP fields after a country change.
  await sleep(350);
  const activeRoot=settingsRoot();
  const city=fieldByCaption(/^city\s*,\s*(?:state|province)$/i,activeRoot);
  const zip=fieldByCaption(/^zip code$/i,activeRoot)||fieldByCaption(/^(zip|postal code|postcode)$/i,activeRoot);
  const cityState=[parts.city,stateAbbr(parts.stateOrProvince)||parts.stateOrProvince].filter(Boolean).join(', ');
  if(!city||!zip)return false;
  const zipOk=await typeLikeUser(zip,resolvedPostal);
  await sleep(300);
  const cityOk=await typeLikeUser(city,cityState);
  await sleep(650);
  return !!(zipOk&&cityOk&&clean(zip.value)===clean(resolvedPostal))
}

function exactPolicyName(text,target){
  return clean(text).replace(/\s*[\[(]\s*\d+\s+listings\s*[)\]]\s*$/i,'').toLowerCase()===clean(target).toLowerCase()
}
function policyField(caption,root){
  const re=caption==='Return policy'?/^return policy$/i:caption==='Shipping policy'?/^shipping policy$/i:/^payment policy$/i;
  const f=fieldByCaption(re,root);
  return f&&visible(f)&&!panel()?.contains(f)?f:null
}
function policySelected(field,target){
  const values=[field.value,field.getAttribute?.('aria-valuetext'),field.getAttribute?.('data-value')];
  if(field.tagName==='SELECT')values.push(field.options?.[field.selectedIndex]?.textContent||'');
  return values.some(v=>exactPolicyName(v||'',target))
}
function policyOption(target){
  const matches=[...document.querySelectorAll('[role="option"],[role="menuitem"],li,button,[data-testid*="option"],[class*="suggestion"],div,span')]
    .filter(e=>visible(e)&&!panel()?.contains(e)&&clean(e.innerText||e.textContent).length<130&&exactPolicyName(e.innerText||e.textContent,target));
  matches.sort((a,b)=>a.querySelectorAll('*').length-b.querySelectorAll('*').length);
  for(const e of matches){
    const opt=e.closest('[role="option"],[role="menuitem"],li,button,[data-testid*="option"]')||e;
    if(visible(opt)&&!panel()?.contains(opt))return opt
  }
  return null
}
async function selectPolicy(caption,target,root=document,{allowSearch=true}={}){
  let field=null;
  for(let i=0;i<12&&!field;i++){field=policyField(caption,root);if(!field)await sleep(160)}
  if(!field)return {ok:false,reason:'campo '+caption+' non trovato'};
  if(policySelected(field,target))return {ok:true,already:true};
  if(field.disabled)return {ok:false,reason:'campo '+caption+' disabilitato'};
  if(field.tagName==='SELECT'){
    const option=[...field.options].find(x=>exactPolicyName(x.textContent||'',target));
    if(!option)return {ok:false,reason:'policy '+target+' non presente nelle opzioni'};
    field.value=option.value;
    field.dispatchEvent(new Event('input',{bubbles:true}));
    field.dispatchEvent(new Event('change',{bubbles:true}));
    await sleep(180);
    return policySelected(field,target)?{ok:true}:{ok:false,reason:'eBay non ha accettato '+target}
  }
  try{field.scrollIntoView({block:'center'})}catch(_){}
  field.click?.();field.focus?.();
  let option=null;
  for(let i=0;i<9&&!option;i++){option=policyOption(target);if(!option)await sleep(120)}
  if(!option&&allowSearch&&!field.readOnly&&(field instanceof HTMLInputElement||field instanceof HTMLTextAreaElement)){
    nativeValueSetter(field,target);
    await sleep(250);
    for(let i=0;i<12&&!option;i++){option=policyOption(target);if(!option)await sleep(120)}
  }
  if(!option)return {ok:false,reason:'opzione '+target+' non presente nel menu'};
  option.click();
  for(let i=0;i<12;i++){await sleep(140);if(policySelected(field,target))return {ok:true}}
  return {ok:false,reason:'eBay non ha confermato '+target}
}

async function applyLocation(parts){
  const needsZip=maskedPostal(parts.postalCode)||(!clean(parts.postalCode)&&/^(?:US|USA|United States|United States of America)$/i.test(clean(parts.country)));
  const resolvedPostal=needsZip?await resolveMaskedUsPostal(parts):clean(parts.postalCode);
  if(needsZip&&!resolvedPostal)return {ok:false,reason:'ZIP sorgente non disponibile e impossibile ricavare un CAP valido'};

  const root=await openLocationEditor();
  const locationOk=await fillLocationForm(root,parts,resolvedPostal);
  // Return policy lives in the same eBay "Your settings" modal.
  const activeRoot=settingsRoot();
  const returns=await selectPolicy('Return policy',POLICY_TARGETS.returns,activeRoot,{allowSearch:false});
  if(!returns.ok)reportSetting('Return policy: '+returns.reason,'warn');
  if(!locationOk&&!returns.ok){await closeLocationDialog();return {ok:false,postal:resolvedPostal,returns,reason:'campi Item Location non aggiornabili'}}
  const saved=await saveAndVerify(activeRoot,parts,resolvedPostal);
  if(!saved)returns.ok=false;
  return {ok:locationOk&&saved,postal:resolvedPostal,returns,reason:!locationOk?'Item Location non impostata':saved?'':'salvataggio Item Location non riuscito'}
}
function writeLocation(row,state,msg){if(!row)return;row.innerHTML='<b>Item Location:</b> <span class="'+state+'">'+String(msg||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</span>';}

for(let i=0;i<40&&!patchUi();i++)await sleep(100);
let row=null;for(let i=0;i<130;i++){row=getLocationRow();if(row)break;await sleep(100)}
const parts=FIXED_ITEM_LOCATION;
try{
  const result=await applyLocation(parts);
  if(result.ok){writeLocation(row,'ok',locationDisplay(parts,result.postal));reportSetting('Item Location inviata: '+locationDisplay(parts,result.postal),'ok')}
  else{writeLocation(row,'warn','Fort Pierce (FL) 34981 non confermata — '+result.reason);reportSetting('Item Location: '+result.reason,'warn')}
  if(result.returns?.ok)reportSetting('Return policy selezionata: '+POLICY_TARGETS.returns,'ok');
}catch(e){
  await closeLocationDialog();
  console.warn('Sell Like This location',e);
  writeLocation(row,'warn','Item Location Fort Pierce (FL) 34981 non applicata');
  reportSetting('Item Location: '+String(e&&e.message||e),'warn');
}
for(const spec of [['Shipping policy',POLICY_TARGETS.shipping],['Payment policy',POLICY_TARGETS.payment]]){
  try{
    const res=await selectPolicy(spec[0],spec[1],document,{allowSearch:true});
    reportSetting(spec[0]+': '+(res.ok?'selezionata '+spec[1]:res.reason),res.ok?'ok':'warn');
  }catch(e){reportSetting(spec[0]+': '+String(e&&e.message||e),'warn')}
}
patchUi();
})();