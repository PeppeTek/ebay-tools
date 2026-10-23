javascript:(async()=>{
'use strict';
const PANEL_ID='capitan-sell-like-clone';
const ENDPOINT_KEY='pep-ebay-bs-v6-google-url';
const PATCH_ID='capitan-variants-preview-v9';
const VAR_STATE_KEY='capitan-sell-like-variants-state-v1';
if(document.getElementById(PATCH_ID))return;
const marker=document.createElement('span');marker.id=PATCH_ID;marker.style.display='none';document.documentElement.appendChild(marker);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const visible=e=>!!(e&&e.getClientRects&&e.getClientRects().length);
let currentData=null,currentRates=null,currentDiscount=.02;
function endpoint(){return String(localStorage.getItem(ENDPOINT_KEY)||'').replace(/\/+$/,'')}
function itemId(){const p=document.getElementById(PANEL_ID);const t=clean(p?.innerText||'');const m=t.match(/Source Item ID:\s*(\d{9,12})/i);return m?m[1]:String(localStorage.getItem('capitan-sell-like-last-source-item')||'')}
function jsonp(action,params){const ep=endpoint();return new Promise((resolve,reject)=>{if(!ep)return reject(Error('Endpoint Apps Script non configurato'));const cb='__capitanVariantsCb_'+Date.now()+'_'+Math.floor(Math.random()*1e6),s=document.createElement('script'),timer=setTimeout(()=>done(Error('Timeout backend')),45000);function done(err,val){clearTimeout(timer);try{delete window[cb]}catch(_){window[cb]=undefined}s.remove();err?reject(err):resolve(val)}window[cb]=v=>done(null,v);s.onerror=()=>done(Error('Backend non raggiungibile'));const q=new URLSearchParams({action,callback:cb,_:String(Date.now()),...(params||{})});s.src=ep+(ep.includes('?')?'&':'?')+q.toString();document.head.appendChild(s)})}
function calcBreakEven(s,r){s=Number(s);if(!isFinite(s)||s<=0||!r||typeof r!=='object')return null;const feeRate=Number(r.ebayFee||0)+Number(r.internationalFee||0)+Number(r.marketingFee||0);const variable=(1+Number(r.salesTaxEstimate||0))*feeRate*(1+Number(r.vatOnFees||0));const fixed=Number(r.fixedFee||0)*(1+Number(r.vatOnFees||0));const v=s*(1-variable)-fixed;return isFinite(v)?Math.round(v*100)/100:null}
function money(v,c){return v==null||!isFinite(Number(v))?'—':Number(v).toFixed(2)+' '+(c||'USD')}
function targetContainer(){const p=document.getElementById(PANEL_ID),steps=p?.querySelector('#steps');if(!steps)return null;return {p,steps}}
function saveVariantState(){
  if(!currentData)return null;
  const st={data:currentData,rates:currentRates,discountRate:currentDiscount,savedAt:Date.now()};
  window.__capitanSellLikeVariants=st;
  try{localStorage.setItem(VAR_STATE_KEY,JSON.stringify(st))}catch(_){}
  return st
}
function closePreopenedHelper(){
  try{const w=window.__capitanPreopenedVariantWindow;if(w&&!w.closed)w.close()}catch(_){}
}
function applyVariantActionUi(){
  // Keep every existing action in exactly its original position and styling.
  const p=document.getElementById(PANEL_ID),list=p&&p.querySelector('[data-ebay-action="list"]');
  if(!list||list.dataset.capitanVariantTestListGuard==='1')return;
  list.dataset.capitanVariantTestListGuard='1';
  list.addEventListener('click',e=>{
    if(!variantMode)return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    if(!currentData||!currentData.pricesConfirmed){
      alert('Varianti: conferma prima i prezzi e le quantità nella tabella Dropper Analytics.');
      return
    }
    if(typeof window.__capitanOpenVariantsWindow!=='function'){
      alert('Editor varianti non pronto. Riapri Sell Like Clone TEST e riprova.');
      return
    }
    // List it on a variant item first opens the existing native eBay variations editor.
    // It must not publish an incomplete single-item listing.
    void window.__capitanOpenVariantsWindow().then(ok=>{
      if(!ok)alert('Editor eBay Variations non aperto: '+String(window.__capitanVariantsLastError||'controlla popup eBay'));
    }).catch(err=>alert('Errore editor varianti: '+String(err&&err.message||err)))
  },true)
}
async function startAutomaticVariantFlow(){
  saveVariantState();
  applyVariantActionUi();
  const s=document.querySelector('#capitan-variants-auto-status');
  if(s)s.textContent=currentData&&currentData.pricesConfirmed?'Prezzi e quantità confermati':'Conferma i prezzi e le quantità prima di aggiungere al catalogo'
}
let variantMode=false;
function enforceVariantMode(){
  if(!variantMode)return;
  applyVariantActionUi();
}
function variantPanelWidth(data){
  const maxLen=Math.max(0,...(data.variants||[]).map(v=>clean(v.title||'').length));
  if(maxLen>55)return 'min(820px,calc(100vw - 24px))';
  if(maxLen>32)return 'min(720px,calc(100vw - 24px))';
  return 'min(620px,calc(100vw - 24px))';
}
function adjustedPrice(v,discountRate){
  const n=Number(v&&v.sourcePrice);
  return Number.isFinite(n)&&n>0?(Math.round(n*(1+discountRate)*100)/100).toFixed(2):'';
}
function ensureVariantDraft(data,discountRate){
  if(!data||!Array.isArray(data.variants))return;
  for(const v of data.variants){
    if(v.targetPrice===undefined)v.targetPrice=adjustedPrice(v,discountRate);
    if(v.targetQuantity===undefined)v.targetQuantity=3;
    if(v.priceOverridden===undefined)v.priceOverridden=false;
  }
  if(data.pricesConfirmed===undefined)data.pricesConfirmed=false
}
function markVariantDraft(){
  if(!currentData)return;
  currentData.pricesConfirmed=false;
  window.__capitanVariantCsv=null;
  saveVariantState();
  const status=document.getElementById('capitan-variants-auto-status');
  if(status){status.textContent='Modifiche non confermate: controlla prezzi, quantità e immagini prima del catalogo.';status.style.color='#ac6500'}
}
function render(data,rates,discountRate){
  const ctx=targetContainer();if(!ctx||!data||!data.hasVariations||!Array.isArray(data.variants)||!data.variants.length)return;
  ensureVariantDraft(data,discountRate);
  variantMode=true;
  enforceVariantMode();
  ctx.p.querySelector('#capitan-variants-preview')?.remove();
  const wrap=document.createElement('div');wrap.id='capitan-variants-preview';wrap.className='row';wrap.style.padding='7px 0';
  const rows=data.variants.map((v,i)=>{
    const price=Number(String(v.targetPrice??'').replace(',','.'));
    const be=Number.isFinite(price)&&price>0?calcBreakEven(price,rates):null;
    const image=Array.isArray(v.images)&&v.images.find(u=>/^https:\/\//i.test(String(u)))||'';
    return '<tr><td style="padding:6px;border-bottom:1px solid #eee;overflow-wrap:anywhere">'+(image?'<img src="'+esc(image)+'" alt="Foto variante" style="width:33px;height:33px;object-fit:contain;vertical-align:middle;margin-right:5px">':'<span style="color:#b45309">Foto n.d. </span>')+esc(v.title||('Variante '+(i+1)))+'</td>'+
      '<td style="padding:6px;border-bottom:1px solid #eee;text-align:right">'+esc(money(v.sourcePrice,data.currency))+'</td>'+
      '<td style="padding:6px;border-bottom:1px solid #eee"><input data-var-price="'+i+'" aria-label="Prezzo variante '+(i+1)+'" value="'+esc(v.targetPrice??'')+'" style="width:100%;box-sizing:border-box;padding:5px 3px;border:1px solid #999;border-radius:4px;font-size:11px"></td>'+
      '<td style="padding:6px;border-bottom:1px solid #eee"><input data-var-qty="'+i+'" type="number" min="1" step="1" aria-label="Quantità variante '+(i+1)+'" value="'+esc(v.targetQuantity??3)+'" style="width:100%;box-sizing:border-box;padding:5px 3px;border:1px solid #999;border-radius:4px;font-size:11px"></td>'+
      '<td data-variant-break-even="'+i+'" style="padding:6px;border-bottom:1px solid #eee;text-align:right">'+esc(money(be,data.currency))+'</td></tr>'
  }).join('');
  wrap.innerHTML='<div style="font-weight:700;padding:1px 0 8px;color:#111">Varianti: <span style="color:#137333">'+data.variants.length+' rilevate</span></div>'+
    '<div style="display:flex;gap:6px;align-items:center;margin-bottom:8px"><label style="font-size:11px">Modifica tutte (%) <input id="capitan-variant-discount" type="text" value="'+esc((Number(discountRate)*100).toFixed(2))+'" style="width:64px;padding:5px;border:1px solid #999;border-radius:4px"></label><button id="capitan-variant-apply-all" style="padding:6px 9px;border:1px solid #999;border-radius:6px;cursor:pointer">Applica a tutte</button></div>'+
    '<div style="max-height:300px;overflow:auto;border:1px solid #e2e5e9;border-radius:8px"><table style="width:100%;table-layout:fixed;border-collapse:collapse;font-size:11px"><colgroup><col style="width:39%"><col style="width:16%"><col style="width:17%"><col style="width:11%"><col style="width:17%"></colgroup><thead><tr style="position:sticky;top:0;background:#fafafa;z-index:1"><th style="padding:6px;text-align:left">Variante / foto</th><th>Concorrente</th><th>Mio prezzo</th><th>Q.tà</th><th>Break Even</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+
    '<button id="capitan-variant-confirm" style="width:100%;margin-top:8px;padding:8px;border:0;border-radius:6px;background:#1668e8;color:#fff;font-weight:700;cursor:pointer">Conferma prezzi e quantità</button>'+
    '<div id="capitan-variants-auto-status" style="font-size:11px;padding:6px 1px 0;color:#ac6500">'+(data.pricesConfirmed?'Prezzi e quantità confermati':'Conferma i prezzi e le quantità prima di aggiungere al catalogo')+'</div>';
  const discount=ctx.p.querySelector('#capitan-discount-row');
  if(discount)discount.insertAdjacentElement('afterend',wrap);
  else ctx.steps.prepend(wrap);
  wrap.querySelectorAll('[data-var-price]').forEach(input=>input.addEventListener('input',()=>{
    const i=Number(input.dataset.varPrice);data.variants[i].targetPrice=clean(input.value).replace(',','.');
    data.variants[i].priceOverridden=true;markVariantDraft();
  }));
  wrap.querySelectorAll('[data-var-qty]').forEach(input=>input.addEventListener('input',()=>{
    const i=Number(input.dataset.varQty);data.variants[i].targetQuantity=clean(input.value);
    markVariantDraft();
  }));
  wrap.querySelector('#capitan-variant-apply-all').addEventListener('click',()=>{
    const raw=clean(wrap.querySelector('#capitan-variant-discount').value).replace(',','.');
    const pct=Number(raw);
    if(!raw||!Number.isFinite(pct)||pct<=-100||pct>1000){alert('Percentuale non valida. Usa -2 per diminuire o +2 per aumentare.');return}
    currentDiscount=pct/100;
    for(const v of data.variants){v.targetPrice=adjustedPrice(v,currentDiscount);v.priceOverridden=false}
    markVariantDraft();render(data,rates,currentDiscount);
  });
  wrap.querySelector('#capitan-variant-confirm').addEventListener('click',()=>{
    const bad=data.variants.find(v=>{
      const price=Number(String(v.targetPrice??'').replace(',','.'));
      const quantity=Number(v.targetQuantity);
      return !Number.isFinite(price)||price<=0||!Number.isInteger(quantity)||quantity<=0
    });
    if(bad){alert('Prezzo o quantità non validi per la variante: '+(bad.title||bad.index));return}
    data.pricesConfirmed=true;saveVariantState();
    const status=wrap.querySelector('#capitan-variants-auto-status');
    status.textContent='Prezzi e quantità confermati. Puoi aggiungere il prodotto al catalogo.';
    status.style.color='#137333';
    try{window.dispatchEvent(new CustomEvent('capitan-variant-prices-confirmed',{detail:window.__capitanSellLikeVariants}))}catch(_){}
  });
  const obs=new MutationObserver(()=>enforceVariantMode());
  obs.observe(ctx.steps,{childList:true,subtree:true,characterData:true});
  let n=0;const timer=setInterval(()=>{n++;enforceVariantMode();if(n>120){clearInterval(timer);obs.disconnect()}},125);
}

window.addEventListener('capitan-pricing-saved',e=>{
  if(e.detail?.rates){
    currentRates=e.detail.rates;
    if(isFinite(Number(e.detail.rates.discountRate)))currentDiscount=Number(e.detail.rates.discountRate);
    if(currentData){
      for(const v of currentData.variants||[])if(!v.priceOverridden)v.targetPrice=adjustedPrice(v,currentDiscount);
      currentData.pricesConfirmed=false;
      render(currentData,currentRates,currentDiscount);saveVariantState();
    }
  }
});
// TEST only: fallback when Apps Script does not expose source variation details.
function variantDiagnostic(msg,bad=false){
  try{
    if(typeof window.__capitanTestLog==='function')window.__capitanTestLog('Varianti: '+msg,bad?'bad':'warn');
    else (window.__capitanPendingTestLogs=window.__capitanPendingTestLogs||[]).push({message:'Varianti: '+msg,state:bad?'bad':'warn'});
  }catch(_){}
}
function parseSourceSelects(doc){
  const found=[];
  for(const sel of doc.querySelectorAll('select')){
    const opts=[...sel.options].filter(o=>!o.disabled).map(o=>clean(o.textContent||o.label||o.value)).filter(v=>v&&!/^(?:select|choose|please select|pick one|select an option|[-–—]+)$/i.test(v));
    const values=[...new Set(opts)];
    if(values.length<2||values.length>120)continue;
    const id=clean(sel.id||'');
    const label=id?[...doc.querySelectorAll('label[for]')].find(l=>l.getAttribute('for')===id):null;
    const area=sel.closest('[data-testid*="variation"],[data-testid*="msku"],[id*="msku"],[class*="msku"],[class*="variation"]');
    const heading=clean(label&&label.textContent||sel.getAttribute('aria-label')||sel.getAttribute('data-label')||'');
    const field=clean(sel.getAttribute('name')||id||'');
    const isVariant=!!area||/msku|variation/i.test(field)||/^(?:colo(?:u)?r|size|style|material|pattern|model|type|length|width|capacity|pack size)\b/i.test(heading);
    if(!isVariant)continue;
    let name=heading.replace(/:\s*(?:select|choose).*$/i,'').replace(/:\s*$/,'').trim();
    if(!name||/^(?:select|choose|variation)$/i.test(name)){
      const title=area&&area.querySelector('label,legend,h3,h4');
      name=clean(title&&title.textContent||'')||field.replace(/^.*(?:msku|variation)[_-]*/i,'').replace(/[-_0-9]+/g,' ').trim();
    }
    if(!name)continue;
    name=name.replace(/:\s*(?:select|choose).*$/i,'').replace(/:\s*$/,'').trim();
    if(name.length>55)continue;
    if(found.some(x=>x.name.toLowerCase()===name.toLowerCase()))continue;
    found.push({name,values});
  }
  return found;
}
async function recoverSourceVariations(id,backend){
  const own=clean(window.__capitanSellLikeSourceOrigin||location.origin).replace(/\/+$/,'');
  const origins=[own];
  // When the source and editor use different eBay marketplaces, try the original US listing.
  if(own!=='https://www.ebay.com')origins.push('https://www.ebay.com');
  let dimensions=[],warning='';
  for(const origin of origins){
    const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),10000);
    try{
      const res=await fetch(origin+'/itm/'+encodeURIComponent(id),{credentials:origin===location.origin?'include':'omit',cache:'no-store',signal:ctl.signal});
      if(!res.ok)throw Error('HTTP '+res.status);
      const html=await res.text();
      if(html.length<3000)throw Error('HTML pagina insufficiente');
      dimensions=parseSourceSelects(new DOMParser().parseFromString(html,'text/html'));
      if(dimensions.length)break;
      warning='Nessun selettore varianti riconosciuto nella pagina sorgente';
    }catch(e){warning=String(e&&e.message||e)}
    finally{clearTimeout(timer)}
  }
  if(!dimensions.length){variantDiagnostic('verifica pagina sorgente non riuscita ('+warning+'). Risposta backend: '+(backend&&backend.ok?'nessuna variante':'non disponibile'));return null}
  // Combinations from independent dropdowns are not necessarily all purchasable: do not invent them.
  if(dimensions.length!==1){variantDiagnostic('trovati '+dimensions.length+' attributi ma non le combinazioni reali; verifica backend necessaria',true);return null}
  const dim=dimensions[0];
  const clone=window.__capitanSellLikeCloneData||{};
  // Listing-level price is not a verified price for each option.
  const currency=clean(backend&&backend.currency||clone.currency||window.__capitanSellLikeCurrency||'USD');
  const variants=dim.values.map((value,i)=>({
    index:i+1,title:dim.name+': '+value,
    specifics:[{name:dim.name,value}],
    sourcePrice:null, // unknown per-variant source price: never copy the common listing price
    targetPrice:'',targetQuantity:3,priceOverridden:false,images:[]
  }));
  variantDiagnostic('recuperate '+variants.length+' opzioni '+dim.name+' dalla pagina eBay. Prezzi per variante da verificare e inserire manualmente.');
  return {...(backend&&backend.ok?backend:{}),ok:true,itemId:id,currency,hasVariations:true,dimensions,variants,variationPictures:[],pricesConfirmed:false,source:'listing-html-fallback',sourcePriceIsCommon:true};
}

function readStoredVariantStateForProbe_(){try{return JSON.parse(localStorage.getItem(VAR_STATE_KEY)||'null')}catch(_){return null}}
window.addEventListener('capitan-discount-updated',e=>{
  if(isFinite(Number(e.detail?.discountRate))){
    currentDiscount=Number(e.detail.discountRate);
    if(currentData){
      for(const v of currentData.variants||[])if(!v.priceOverridden)v.targetPrice=adjustedPrice(v,currentDiscount);
      currentData.pricesConfirmed=false;
      render(currentData,currentRates,currentDiscount);saveVariantState();
    }
  }
});

try{
  const id=itemId();if(!/^\d{9,12}$/.test(id)){window.__capitanVariantProbe={mode:'unknown',reason:'item-id'};variantDiagnostic('ID sorgente non riconosciuto: controllo interrotto',true);return}
  variantDiagnostic('avvio verifica sorgente ID '+id+' · marketplace '+location.hostname);
  try{
    const old=readStoredVariantStateForProbe_();
    if(old&&old.data&&String(old.data.itemId||'')!==String(id)){
      localStorage.removeItem(VAR_STATE_KEY);
      if(window.__capitanSellLikeVariants&&String(window.__capitanSellLikeVariants.data&&window.__capitanSellLikeVariants.data.itemId||'')!==String(id))delete window.__capitanSellLikeVariants
    }
  }catch(_){}
  let data=null;
  const pre=window.__capitanSellLikePreflight;
  if(pre&&pre.ok&&String(pre.itemId||'')===String(id))data=pre;
  if(!data){
    try{const mi=window.__capitanSellLikeModePromise?await window.__capitanSellLikeModePromise:null;if(mi&&mi.data&&mi.data.ok&&String(mi.data.itemId||'')===String(id))data=mi.data}catch(_){}
  }
  // Pricing is optional for rendering. Never wait up to 45 seconds before showing detected variants.
  const pricingPromise=jsonp('sell_like_pricing_get').catch(e=>({ok:false,error:String(e&&e.message||e)}));
  const pricingWindow=Promise.race([pricingPromise,sleep(2500).then(()=>({ok:false,timeout:true}))]);
  if(!data){try{data=await jsonp('sell_like_variants_get',{itemId:id})}catch(e){variantDiagnostic('backend varianti non raggiungibile: '+String(e&&e.message||e))}}
  if(data&&data.ok&&Array.isArray(data.variants)&&data.variants.length&&Array.isArray(data.dimensions)&&data.dimensions.length)data.hasVariations=true;
  variantDiagnostic('backend ID '+id+' → '+(!data||!data.ok?'risposta assente/errore':data.hasVariations?'varianti '+(Array.isArray(data.variants)?data.variants.length:'non dettagliate'):'prodotto singolo')+'; controllo finale sorgente');
  if(!data||!data.ok||!data.hasVariations){
    const recovered=await recoverSourceVariations(id,data);
    if(recovered)data=recovered;
  }
  const pricing=await pricingWindow;
  if(!data||!data.ok){variantDiagnostic('nessun dato eBay attendibile per le varianti · ID '+id,true);window.__capitanVariantProbe={mode:'unknown',error:'Dati varianti sorgente non disponibili'};return}
  if(!data.hasVariations){
    variantDiagnostic('ID '+id+': nessuna variante confermata. Tabella non mostrata per evitare dati inventati.');
    window.__capitanVariantProbe={mode:'mono',data:data};
    try{window.dispatchEvent(new CustomEvent('capitan-variants-probed',{detail:window.__capitanVariantProbe}))}catch(_){}
    closePreopenedHelper();
    return;
  }
  variantDiagnostic('ID '+id+': rilevate '+(Array.isArray(data.variants)?data.variants.length:0)+' varianti da '+String(data.source||'backend'));
  window.__capitanVariantProbe={mode:'variants',data:data};
  try{window.dispatchEvent(new CustomEvent('capitan-variants-probed',{detail:window.__capitanVariantProbe}))}catch(_){}
  if(data.source==='listing-html-fallback')window.__capitanSellLikeMode='variants';
  currentData=data;currentRates=pricing&&pricing.ok?pricing.rates:null;
  if(!currentRates)variantDiagnostic('tariffe non pronte: break-even sospeso, campi prezzi comunque disponibili');
  pricingPromise.then(late=>{if(late&&late.ok&&late.rates&&currentData===data&&!currentRates){currentRates=late.rates;const table=document.getElementById('capitan-variants-preview');if(table)table.querySelectorAll('[data-variant-break-even]').forEach(cell=>{const v=data.variants[Number(cell.dataset.variantBreakEven)];if(v){const price=Number(String(v.targetPrice??'').replace(',','.'));cell.textContent=money(Number.isFinite(price)&&price>0?calcBreakEven(price,currentRates):null,data.currency)}});variantDiagnostic('tariffe ricevute: break-even aggiornato')}});
  if(currentRates&&isFinite(Number(currentRates.discountRate)))currentDiscount=Number(currentRates.discountRate);else if(isFinite(Number(data.discountRate)))currentDiscount=Number(data.discountRate);
  ensureVariantDraft(currentData,currentDiscount);
  render(currentData,currentRates,currentDiscount);
  const savedState=saveVariantState();
  window.dispatchEvent(new CustomEvent('capitan-variants-ready',{detail:savedState}));
  startAutomaticVariantFlow();
}catch(err){window.__capitanVariantProbe={mode:'unknown',error:String(err&&err.message||err)};variantDiagnostic('errore verifica: '+String(err&&err.message||err),true);try{window.dispatchEvent(new CustomEvent('capitan-variants-probed',{detail:window.__capitanVariantProbe}))}catch(_){}console.warn('Sell Like variants preview',err)}
})();