/* Dropper Analytics - Calcolatore su pagina concorrente. Nessuna modifica a Sell Like Clone. */
(async function(){
'use strict';
const C=globalThis.DropperCalculatorCore;
if(!C){alert('Dropper Calculator: motore non caricato.');return;}
const hostname=location.hostname.toLowerCase().replace(/^www\./,'');
const m=location.pathname.match(/^\/itm\/(?:[^/?#]+\/)?(\d{9,12})(?:[/?#]|$)/);
if(!/^ebay\./.test(hostname)||!m){alert('Apri una pagina prodotto eBay, con indirizzo /itm/ID.');return;}
const id=m[1],panelId='dropper-competitor-calculator-v1',styleId=panelId+'-style';
document.getElementById(panelId)?.remove();document.getElementById(styleId)?.remove();
const esc=x=>String(x??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const saved=k=>{try{return JSON.parse(localStorage.getItem(k)||'null')||{}}catch(_){return {}}};
const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const data=C.readDocument(document,hostname,location.href);
const fields=Object.keys(C.DEFAULT_FEES),tierKeys=['fixedFeeLow','fixedFeeHigh','fixedFeeThreshold'];
const feeKey='dropper-competitor-calculator-fees-v1',catalogKey='dropper-quick-catalog-v1';
// Exact Apps Script endpoint already used by the official Sell Like Clone catalog upload.
const existingSellLikeEndpoint='https://script.google.com/macros/s/AKfycbzMOURNMR4bFzR0yTbjlTZ1IUJqmTo5Ep0K0Gg0yvNhUbcdKNwSDgiXhAbhnQ6i2UHu/exec';
const savedFees=saved(feeKey),oldFees=saved('capitan-sell-like-market-pricing-v1');
const S={market:C.countryFromHost(hostname),title:data.title,sourcePrice:data.price?.value??null,
 sourceCur:data.price?.currency||C.currencyFromHost(hostname),sourceMethod:data.price?.source||'manuale',
 discount:-2,sale:null,manualSale:false,purchaseUsd:null,quantity:1,shipping:0,fx:{USD:1},fxAtStartup:null,fees:{},provisional:{},fxInfo:'',fxSequence:0,variants:[],dimensions:[],masterKey:null,variantRequest:0,variantMode:false};
const priorDiscountText=localStorage.getItem('capitan-sell-like-discount-rate-v1');
const prevDisc=priorDiscountText===null?NaN:Number(priorDiscountText);
if(Number.isFinite(prevDisc)&&prevDisc>-1&&prevDisc<10)S.discount=C.round(prevDisc*100);
for(const mk of Object.keys(C.MARKETS)){
 const preset=C.MARKET_FEES[mk],savedLocal=savedFees[mk],oldProfile=oldFees[mk];
 const r=savedLocal||oldProfile;
 const valid=!!r&&fields.every(k=>Number.isFinite(Number(r[k]))&&Number(r[k])>=0);
 // Preserve previous percentage choices; replace the old copied 0.40 USD placeholder with local fixed-fee rules.
 // A new manually saved V2 profile may override the preset fee tiers.
 const customV2=!!savedLocal&&Number(savedLocal.feePresetVersion)>=2;
 const percentages=valid?Object.fromEntries(fields.filter(k=>k!=='fixedFee').map(k=>[k,Number(r[k])])):{};
 S.fees[mk]={...preset,...percentages,sellerDiscountPct:Number(savedLocal?.sellerDiscountPct??0),shippingCharge:Number(savedLocal?.shippingCharge??0)};
 if(customV2){
   S.fees[mk].fixedFee=Number(savedLocal.fixedFee);
   for(const k of tierKeys)if(savedLocal[k]!==undefined)S.fees[mk][k]=Number(savedLocal[k]);
 }
 S.provisional[mk]=!customV2;
}
S.shipping=S.fees[S.market].shippingCharge;
const style=document.createElement('style');style.id=styleId;style.textContent=
'#'+panelId+'{position:fixed;top:12px;right:12px;z-index:2147483647;width:500px;max-width:calc(100vw - 16px);max-height:calc(100vh - 24px);overflow:auto;background:#fff;color:#111;font:12px Arial,sans-serif;border:1px solid #bbb;border-radius:12px;box-shadow:0 10px 32px #0004;box-sizing:border-box}'+
'#'+panelId+' *{box-sizing:border-box}#'+panelId+' .hd{padding:12px;border-bottom:1px solid #ddd;display:flex;align-items:center;gap:7px}'+
'#'+panelId+' .hd b{flex:1;min-width:0}#'+panelId+' .hd button{width:32px;height:30px;border:1px solid #bbb;border-radius:7px;background:#fff;font-size:18px;cursor:pointer;flex:0 0 32px}'+
'#'+panelId+' .hd select{flex:0 1 138px;width:138px;min-width:110px;height:30px;padding:0 7px;border:1px solid #bbb;border-radius:7px;background:#fff;color:#111;font:11px Arial,sans-serif;cursor:pointer}'+
'#'+panelId+' .dc-source-id{margin:3px 0 11px;line-height:1.4}#'+panelId+' .dc-title-label{display:block;margin-bottom:12px}#'+panelId+' .dc-title-label input{display:block;margin-top:5px}'+
'#'+panelId+' .main{padding:9px 14px}#'+panelId+' input,#'+panelId+' select{width:100%;min-width:0;border:1px solid #c5c9cf;background:#fff;color:#111;border-radius:7px;padding:6px;font:12px Arial,sans-serif}'+
'#'+panelId+' label{font-weight:700}#'+panelId+' .split{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:10px 0}'+
'#'+panelId+' .source{display:grid;grid-template-columns:1fr 115px 70px;gap:8px;align-items:center;margin:7px 0}'+
'#'+panelId+' .row{display:grid;grid-template-columns:minmax(0,1fr) 84px 106px;gap:8px;align-items:center;min-height:40px;border-bottom:1px solid #e8e8e8;padding:4px 0}'+
'#'+panelId+' .row .val{text-align:right;font-weight:bold;color:#16813f}#'+panelId+' .row .val small{display:block;font-weight:400;font-size:10px;color:#777;margin-top:3px}'+
'#'+panelId+' .hint{font-size:10px;color:#666;line-height:1.4;margin:8px 0}#'+panelId+' .buttons{display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:10px 14px}'+
'#'+panelId+' .buttons button{height:42px;border:1px solid #aaa;border-radius:21px;cursor:pointer;font-size:13px;font-weight:700}'+
'#'+panelId+' .span2{grid-column:1/-1}#'+panelId+' .settings{display:none;background:#fafafa;padding:12px 14px;border-top:1px solid #ddd}'+
'#'+panelId+' .settings.open{display:block}#'+panelId+' .feegrid{display:grid;grid-template-columns:1fr 90px;gap:7px;align-items:center}'+
'#'+panelId+' .dc-tier-details{margin:5px 0;padding:8px;border:1px solid #e1e5ec;border-radius:7px;background:#fff}#'+panelId+' .dc-tier-details summary{font-size:11px;font-weight:700;line-height:1.5;cursor:pointer;list-style:revert}#'+panelId+' .dc-tier-details .feegrid{margin-top:9px}'+
'#'+panelId+' .dc-fee-table{border:1px solid #e1e5ec;border-radius:7px;padding:9px 10px;margin:9px 0;background:#f8fafc;font-size:11px;line-height:1.45}#'+panelId+' .dc-fee-table summary{cursor:pointer;list-style:revert;color:#111;font-weight:700}#'+panelId+' .dc-fee-table[open] summary{margin-bottom:5px}#'+panelId+' .dc-fee-table .dc-fee-line{display:flex;justify-content:space-between;gap:14px;padding:4px 0;border-bottom:1px solid #e7ebf0}#'+panelId+' .dc-fee-table .dc-fee-line:last-child{border-bottom:0}#'+panelId+' .dc-fee-table .dc-fee-line b{text-align:right;white-space:nowrap}#'+panelId+' .dc-fee-table .dc-fee-emphasis{font-weight:700;color:#1d4ed8}'+
'#'+panelId+' .dc-variants{margin:10px 0 12px}#'+panelId+' .dc-variants-head{font-weight:700;margin:0 0 7px}'+
'#'+panelId+' .dc-variant-list{max-height:270px;overflow-y:auto;border:1px solid #e1e5ec;border-radius:7px;background:#fff}'+
'#'+panelId+' .dc-variant-item{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr) 76px minmax(0,1fr);gap:6px;align-items:center;padding:8px 7px;border-bottom:1px solid #e7ebf0;font-size:11px}'+
'#'+panelId+' .dc-variant-item:last-child{border-bottom:0}#'+panelId+' .dc-variant-item.active{background:#eef5ff}'+
'#'+panelId+' .dc-variant-item .dc-label{display:flex;align-items:flex-start;gap:5px;font-weight:600;min-width:0;overflow-wrap:anywhere;cursor:pointer}'+
'#'+panelId+' .dc-variant-item .dc-label input{width:14px;min-width:14px;height:14px;padding:0;margin:1px 0 0}'+
'#'+panelId+' .dc-variant-item .dc-price{text-align:right;font-weight:600;overflow-wrap:anywhere}'+
'#'+panelId+' .dc-variant-item .dc-price small{display:block;font-size:10px;color:#777;font-weight:400}'+
'#'+panelId+' .dc-variant-item .dc-sale-input{width:100%;text-align:right}'+
'#'+panelId+' .dc-variant-item .dc-sale-input:disabled{background:#f2f3f5;color:#6b7280}'+
'#'+panelId+' .dc-variant-headings{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr) 76px minmax(0,1fr);gap:6px;font-size:10px;color:#666;padding:5px 7px}'+
'#'+panelId+' .message{margin:0 14px 12px;padding:9px;border:1px solid #e2e5ec;background:#f8f9fb;border-radius:7px;font-size:11px;line-height:1.5;white-space:pre-wrap}'+
'#'+panelId+' .message[data-status="bad"]{color:#b42318}#'+panelId+' .message[data-status="warn"]{color:#986000}#'+panelId+' .message[data-status="ok"]{color:#137333}'+
'@media(max-width:420px){#'+panelId+' .row{grid-template-columns:minmax(0,1fr) 70px 90px;gap:4px}#'+panelId+' .main{padding:8px 10px}#'+panelId+' .hd{flex-wrap:wrap}#'+panelId+' .hd b{flex:1 0 100%}#'+panelId+' .hd select{flex:1 1 auto}}';
document.head.appendChild(style);
const panel=document.createElement('section');panel.id=panelId;
panel.innerHTML='<div class="hd"><b><span style="color:#0cbcae">◩</span> DROPPER ANALYTICS<br><small>PriceMatch Pro</small></b><select data-el="market" aria-label="Paese di vendita" title="Paese di vendita"><option value="US">USA (USD)</option><option value="CA">Canada (CAD)</option><option value="AU">Australia (AUD)</option></select><button data-el="refresh" title="Aggiorna prezzo dalla pagina">↻</button><button data-el="gear" title="Tariffe">⚙</button><button data-el="close" title="Chiudi">×</button></div>'+
'<div class="main"><p class="dc-source-id"><b>Source Item ID:</b> '+esc(id)+'</p><label class="dc-title-label">Titolo per catalogo<input data-el="title" maxlength="255" placeholder="Titolo eBay"></label>'+

// Hidden state fields preserve eBay price detection, currency conversions and Refresh without showing the removed original-price section.
'<div style="display:none" aria-hidden="true"><span data-el="source-label"></span><input type="number" data-el="source" min=".01" step=".01"><select data-el="source-currency"><option>USD</option><option>CAD</option><option>AUD</option><option>EUR</option><option>GBP</option><option>CHF</option><option>SGD</option><option>HKD</option><option>MYR</option></select></div>'+
'<section class="dc-variants" data-el="variants-block" style="display:none"><div class="dc-variants-head">ATTRIBUTI E VARIANTI <span data-el="variants-count"></span></div><div class="dc-variant-headings"><span>Variante / Master</span><span>Prezzo rilevato</span><span>Modifica</span><span>Prezzo attivato</span></div><div class="dc-variant-list" data-el="variants-list"></div></section>'+
'<div class="split"><label>Spedizione cliente per unità (<span data-el="shipping-currency">'+C.MARKETS[S.market].currency+'</span>)<input data-el="shipping" type="number" step=".01" min="0" placeholder="0.00"></label><label>Quantità vendute per ordine<input data-el="quantity" type="number" step="1" min="1" max="1000" value="1"></label></div>'+ 
'<div class="row"><label>Riduzione rispetto al prezzo rilevato:</label><input data-el="discount" type="number" step=".01"><div class="val" data-el="source-local">—</div></div>'+
'<div class="row"><label>Prezzo di vendita:</label><input data-el="sale" type="number" min=".01" step=".01"><div class="val" data-el="sale-view">—</div></div>'+
'<div class="row"><label>Incasso al netto delle commissioni:</label><span></span><div class="val" data-el="net" style="color:#d97706">—</div></div>'+
'<div class="row"><label>Costo d’acquisto (USD):</label><input type="number" data-el="cost" step=".01" min="0" title="Inserisci costo acquisto in USD" placeholder="—"><div class="val" data-el="cost-view" style="color:#e3342f">—</div></div>'+
'<div class="row"><label>Il mio utile netto:</label><span></span><div class="val" data-el="profit">—</div></div>'+
'<div class="row"><label>Prezzo minimo di pareggio:</label><span></span><div class="val" data-el="break-even" style="color:#2563eb">—</div></div>'+
'<div class="hint" data-el="fee-details"></div><div class="hint" data-el="fx-status"></div></div>'+
'<div class="settings" data-el="settings"><b>Tariffe per paese selezionato</b><p class="hint">Le tariffe fisse US e CA sono espresse direttamente nella valuta del paese, non convertite da 0,40 USD. L\'Australia usa il valore osservato nel tuo estratto, modificabile.</p><div class="feegrid" data-el="feegrid" style="margin-top:9px"></div><button data-el="save-rates" style="margin-top:9px;padding:8px;background:#2563eb;color:white;border:0;border-radius:7px;cursor:pointer">Salva tariffe per questo paese</button></div>'+
'<div class="buttons"><button data-el="ali" style="background:#ff4747;color:white">Trova su AliExpress</button><button data-el="amazon" style="background:#ffa41c;color:#111">Trova su Amazon</button>'+
'<button data-el="save" style="background:#16a34a;color:white">Aggiungi a catalogo</button>'+
'<button data-el="export" style="background:white;color:#333">Esporta catalogo CSV</button></div>'+
'<div class="message" data-el="message">Avvio calcolatore…</div>';
document.body.appendChild(panel);
const el=k=>panel.querySelector('[data-el="'+k+'"]');
const cur=()=>C.MARKETS[S.market].currency;
function message(t,kind='info'){el('message').textContent=t;el('message').dataset.status=kind}
function textMoney(k,value,us){
 const e=el(k),span=document.createElement('span');e.replaceChildren();span.textContent=value===null||value===undefined||!Number.isFinite(Number(value))?'—':Number(value).toFixed(2)+' '+cur();e.appendChild(span);
 if(us!==null&&us!==undefined&&Number.isFinite(Number(us))&&cur()!=='USD'){const small=document.createElement('small');small.textContent=Number(us).toFixed(2)+' USD';e.appendChild(small)}
}

const variantTools=globalThis.__priceMatchVariantTools;
function masterVariant(){return S.variants.find(v=>v.key===S.masterKey)||null}
function variantMarketState(v,market=S.market){
 if(!v.byMarket)v.byMarket={};
 if(!v.byMarket[market])v.byMarket[market]={sale:null,discount:0,manualSale:false};
 return v.byMarket[market]
}
function derivedVariantPrice(v,market=S.market){
 const state=variantMarketState(v,market),target=C.MARKETS[market].currency;
 const observed=variantTools.marketPrice(v,S.fx,target,C.round);
 return state.manualSale?state.sale:observed===null?null:C.adjusted(observed,state.discount)
}
function saveMasterState(){
 if(!S.variantMode)return;
 const v=masterVariant();if(!v)return;
 v.byMarket[S.market]={discount:S.discount,manualSale:S.manualSale,sale:S.sale};
}
function chooseMaster(key,savePrevious=true){
 if(savePrevious)saveMasterState();
 const variant=S.variants.find(v=>v.key===key);
 if(!variant)return;
 S.masterKey=key;
 const current=variantMarketState(variant);
 S.sourcePrice=variant.sourcePrice;
 S.sourceCur=variant.sourceCurrency;
 S.sourceMethod='variante eBay';
 S.discount=current.discount;
 S.manualSale=current.manualSale;
 S.sale=current.sale;
 el('source').value=S.sourcePrice??'';
 // All source currencies from the probe remain usable even when not in the static currency list.
 const select=el('source-currency');
 if(![...select.options].some(o=>o.value===S.sourceCur)){
  const opt=document.createElement('option');opt.value=S.sourceCur;opt.textContent=S.sourceCur;select.appendChild(opt);
 }
 select.value=S.sourceCur;
 el('discount').value=S.discount;
 el('sale').value=S.sale??'';
 recalc();
}
function renderVariantRows(){
 if(!S.variantMode)return;
 const list=el('variants-list');
 list.replaceChildren();
 const target=cur(),rate=Number(S.fx[target]);
 function cellAmount(local,sourceCurrency){
  const node=document.createElement('div');node.className='dc-price';
  const heading=document.createElement('span');
  heading.textContent=local===null?'n.d.':local.toFixed(2)+' '+target;
  node.appendChild(heading);
  if(target!=='USD'&&local!==null&&rate>0){
   const small=document.createElement('small');small.textContent=C.round(local*rate).toFixed(2)+' USD';node.appendChild(small);
  }else if(local===null&&sourceCurrency){
   const small=document.createElement('small');small.textContent=sourceCurrency;node.appendChild(small)
  }
  return node
 }
 for(const v of S.variants){
  const selected=v.key===S.masterKey,state=variantMarketState(v);
  const base=variantTools.marketPrice(v,S.fx,target,C.round);
  const price=selected?S.sale:derivedVariantPrice(v);
  const row=document.createElement('div');row.className='dc-variant-item'+(selected?' active':'');
  const label=document.createElement('label');label.className='dc-label';
  const radio=document.createElement('input');radio.type='radio';radio.name='dc-price-match-master';radio.checked=selected;radio.title='Seleziona variante Master';
  radio.addEventListener('change',()=>{if(radio.checked)chooseMaster(v.key)});
  const name=document.createElement('span');name.textContent=v.label;
  label.append(radio,name);row.appendChild(label);
  row.appendChild(cellAmount(base,v.sourceCurrency));
  const edit=document.createElement('input');edit.className='dc-sale-input';edit.type='number';edit.min='.01';edit.step='.01';
  edit.title=selected?'Prezzo della variante Master':'Seleziona prima la variante Master';
  edit.disabled=!selected;
  edit.value=price===null?'':String(price);
  edit.addEventListener('change',()=>{
   if(!selected)return;
   const val=C.num(edit.value);
   if(val===null||val<=0){message('Prezzo Master non valido, modifica annullata.','warn');renderVariantRows();return}
   S.sale=C.round(val);S.manualSale=true;
   const reference=localBase();
   if(reference>0){S.discount=C.round((S.sale/reference-1)*100);el('discount').value=S.discount}
   el('sale').value=S.sale;recalc()
  });
  row.appendChild(edit);
  row.appendChild(cellAmount(price,v.sourceCurrency));
  list.appendChild(row);
 }
}
async function probeVariants(reload=false){
 if(!variantTools||typeof variantTools.probe!=='function'){
  if(data.hasPriceVariants)message('Modulo varianti non caricato: prezzo corrente preservato.','warn');
  return
 }
 const seq=++S.variantRequest;
 let remoteFailure=null;
 const domResult=()=>{
  if(typeof variantTools.inspectPage!=='function')return {hasSelects:false,hasVariations:false};
  return variantTools.inspectPage(document,location.href,data.price?.value??null,data.price?.currency||C.currencyFromHost(hostname),id)
 };
 try{
  let result,origin='backend';
  try{result=await variantTools.probe({itemId:id,endpoint:existingSellLikeEndpoint,fallbackCurrency:data.price?.currency||C.currencyFromHost(hostname)})}
  catch(error){remoteFailure=error}
  if(seq!==S.variantRequest||!panel.isConnected)return;
  if(!result?.hasVariations){
   const available=domResult();
   if(available.hasVariations){result=available;origin='pagina'}
   else if(available.hasSelects){
    message('La pagina mostra selettori varianti, ma non è possibile ricostruire combinazioni e prezzi in modo affidabile: '+(available.reason||'dati insufficienti')+'.','warn');return
   }else if(remoteFailure){
    message('Verifica varianti non completata: '+String(remoteFailure?.message||remoteFailure)+'. Nessun prezzo inventato.','warn');return
   }else if(S.variantMode){
    message('Il backend non conferma più le varianti: mantengo le modifiche fino al prossimo caricamento.','warn');return
   }else return;
  }
  const previous=new Map(S.variants.map(v=>[v.key,v]));
  const variants=result.variants.map(v=>{
   const was=previous.get(v.key);
   return {...v,byMarket:was?.byMarket||{}}
  });
  if(!variants.length)throw Error('Nessuna combinazione variante valida');
  if(S.variantMode)saveMasterState();
  const oldMaster=S.masterKey;
  const first=variants.find(v=>v.key===oldMaster)||variants.find(v=>v.key===result.selectedKey)||variants.find(v=>v.selected)||variants.find(v=>v.sourcePrice!==null)||variants[0];
  if(!S.variantMode){
   const initial=variantMarketState(first);
   initial.discount=S.discount;initial.manualSale=S.manualSale;
   if(S.manualSale&&S.sale>0)initial.sale=S.sale;
  }
  S.variants=variants;S.dimensions=result.dimensions;S.variantMode=true;S.variantStatus=origin==='pagina'?'partial':'confirmed';
  el('variants-block').style.display='block';el('variants-count').textContent='('+variants.length+' rilevate)';
  chooseMaster(first.key,false);
  if(!(Number(S.fx[S.sourceCur])>0))void fxUpdate();
  const missing=variants.filter(v=>v.sourcePrice===null).length;
  const note=origin==='pagina'?'Rilevate dalla pagina: '+variants.length+' varianti. '+missing+' prezzi non disponibili (n.d.); seleziona la Master e imposta il prezzo prima di salvare.':'Varianti confermate: '+variants.length+'. Modifica Riduzione e Prezzo soltanto sulla Master selezionata.';
  message(note,origin==='pagina'?'warn':'ok');
 }catch(err){
  if(seq!==S.variantRequest||!panel.isConnected)return;
  console.warn('PriceMatch Pro probe varianti',err);
  message('Rilevamento varianti non verificato: '+String(err?.message||err)+'. Prezzi e calcoli correnti preservati.','warn')
 }
}
function variantCatalogEntry(entry){
 if(!S.variantMode)return entry;
 saveMasterState();
 if(!S.dimensions.length||!S.variants.length)throw Error('Varianti incomplete, catalogo non aggiornato');
 const variants=S.variants.map(v=>({
  specifics:v.specifics.map(x=>({name:x.name,value:x.value})),
  price:derivedVariantPrice(v)
 }));
 if(variants.some(v=>v.price===null||!(v.price>0)))throw Error('Completa i prezzi di tutte le varianti prima di esportare/salvare il catalogo');
 return {...entry,dimensions:S.dimensions.map(d=>({name:d.name,values:d.values.slice()})),variants};
}
function localBase(){const a=S.fx[S.sourceCur],b=S.fx[cur()];if(S.sourcePrice===null)return null;if(S.sourceCur===cur())return S.sourcePrice;return a>0&&b>0?C.round(S.sourcePrice*a/b):null}
function recalc(){
 const b=localBase();
 if(!S.manualSale){S.sale=b===null?null:C.adjusted(b,S.discount);el('sale').value=S.sale??''}
 const fx=S.fx[cur()]||null,st=C.fees(S.sale,S.fees[S.market],fx,S.purchaseUsd,{shipping:S.shipping,quantity:S.quantity});
 textMoney('source-local',b,b!==null&&fx?C.round(b*fx):null);
 textMoney('sale-view',S.sale,S.sale!==null&&fx?C.round(S.sale*fx):null);
 textMoney('net',st?.net??null,st&&fx?C.round(st.net*fx):null);
 textMoney('cost-view',st?.costLocal??null,st?.costUsd??null);
 textMoney('profit',st?.profitLocal??null,st?.profitUSD??null);
 el('profit').style.color=st?.profitUSD<0?'#b42318':'#16803d';
 textMoney('break-even',st?.breakEven??null,st?.breakEven!=null&&fx?C.round(st.breakEven*fx):null);
 const ratesAtOpening=S.fxAtStartup;
 el('fx-status').textContent=ratesAtOpening?('Cambio caricato all’avvio (Frankfurter · cache max 24 ore): 1 USD = '+(1/ratesAtOpening.CAD).toFixed(4)+' CAD · 1 USD = '+(1/ratesAtOpening.AUD).toFixed(4)+' AUD'):'Cambio all’avvio: in attesa di CAD e AUD';
 renderFeeDetails(st);
 el('source-label').textContent=S.sourceMethod==='manuale'?'Modificabile':'Letto: '+S.sourceMethod;
 if(S.variantMode){saveMasterState();renderVariantRows()}
}
function renderFeeDetails(st){
 const box=el('fee-details');
 // Keep the detail open/closed state across recalc, country selection and cost edits.
 const previous=box.querySelector('details.dc-fee-table');
 const wasOpen=!!(previous&&previous.open);
 box.replaceChildren();
 if(!st){box.textContent='Commissioni da calcolare: controlla quantità, prezzo e spedizione.';return}
 const wrapper=document.createElement('details');wrapper.className='dc-fee-table';wrapper.open=wasOpen;
 const header=document.createElement('summary');
 header.textContent='CALCOLO DETTAGLIATO DELLE TARIFFE';wrapper.appendChild(header);
 function line(label,amount,strong=false){
  const row=document.createElement('div');row.className='dc-fee-line'+(strong?' dc-fee-emphasis':'');
  const left=document.createElement('span');left.textContent=label;
  const right=document.createElement('b');right.textContent=Number(amount).toFixed(2)+' '+cur();
  row.append(left,right);wrapper.appendChild(row)
 }
 line('Prezzo articolo / unità',st.itemPrice);
 line('Sconto venditore / unità (−'+st.discountPct+'%)',-st.discount);
 line('Spedizione cliente / unità',st.shipping);
 line('Sales Tax / unità',st.tax);
 line('Base commissionabile / unità',st.masterPerUnit,true);
 const q=document.createElement('div');q.className='dc-fee-line';
 const label=document.createElement('span');label.textContent='Quantità';
 const val=document.createElement('b');val.textContent=String(st.quantity);
 q.append(label,val);wrapper.appendChild(q);
 line('Master Total ordine',st.masterTotal,true);
 line('Final Value Fee ('+C.round(S.fees[S.market].ebayFee*100)+'%)',st.fvf);
 line('International Fee ('+C.round(S.fees[S.market].internationalFee*100)+'%)',st.intl);
 line('Tariffa fissa per ordine',st.fixedLocal);
 line('Marketing General Ads ('+C.round(S.fees[S.market].marketingFee*100)+'%)',st.ads);
 line('Commissioni prima IVA',st.feeSubtotal,true);
 line('IVA sulle commissioni ('+C.round(S.fees[S.market].vatOnFees*100)+'%)',st.vat);
 line('TOTALE COMMISSIONI',st.fee,true);
 box.appendChild(wrapper)
}
function renderComparison(){
 const target=el('market-compare');if(!target)return;
 const fx=S.fx[cur()],usd=S.sale!==null&&Number.isFinite(S.sale)&&fx>0?C.round(S.sale*fx):null;
 if(usd===null){target.textContent='Confronto US / CA / AU: prezzo di vendita e cambio necessari.';return}
 const outcome=[];
 for(const mk of ['US','CA','AU']){
   const cc=C.MARKETS[mk].currency,rate=S.fx[cc];
   if(!(rate>0)){target.textContent='Confronto US / CA / AU in attesa dei cambi CAD e AUD.';return}
   const candidate=C.fees(C.round(usd/rate),{...S.fees[mk],salesTaxEstimate:0},rate,S.purchaseUsd,{quantity:S.quantity,shipping:Number(S.fees[mk].shippingCharge||0)});
   if(!candidate){target.textContent='Confronto non disponibile: verifica le tariffe.';return}
   outcome.push({mk,amount:S.purchaseUsd===null?candidate.netUsd:candidate.profitUSD});
 }
 const best=[...outcome].sort((a,b)=>b.amount-a.amount)[0];
 target.textContent='Confronto indicativo su '+usd.toFixed(2)+' USD (stesso prezzo, tax 0% per confronto, ads configurate): '+
 outcome.map(o=>o.mk+' '+o.amount.toFixed(2)+' USD').join(' · ')+
 ' · migliore per questa ipotesi: '+best.mk+
 (S.purchaseUsd===null?' (netto prima acquisto).':' (utile netto).');
}
function readEdits(){
 const x=C.num(el('source').value);S.sourcePrice=x>0?x:null;
 S.sourceCur=el('source-currency').value;
 S.title=C.clean(el('title').value);
 const y=C.num(el('cost').value);S.purchaseUsd=el('cost').value.trim()===''?null:y;
 const ship=C.num(el('shipping').value),q=C.num(el('quantity').value);
 S.shipping=ship===null?NaN:ship;S.quantity=q===null?NaN:q;
}
async function getToUSD(code){
 if(code==='USD')return 1;
 const cacheKey='dropper-calculator-fx-to-usd-v1-'+code,cache=saved(cacheKey);
 if(Number(cache.value)>0&&Date.now()-Number(cache.at)<86400000)return Number(cache.value);
 const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),8000);
 try{
 const res=await fetch('https://api.frankfurter.dev/v2/rate/'+code+'/USD',{cache:'no-store',credentials:'omit',mode:'cors',signal:ctl.signal});
 if(!res.ok)throw Error('HTTP '+res.status);
 const json=await res.json(),rate=Number(json.rate);
 if(String(json.base).toUpperCase()!==code||String(json.quote).toUpperCase()!=='USD'||!Number.isFinite(rate)||rate<=0)throw Error('Payload valuta non valido');
 try{write(cacheKey,{value:rate,at:Date.now(),date:json.date})}catch(_){}
 return rate
 }finally{clearTimeout(timer)}
}
async function fxUpdate(){
 const seq=++S.fxSequence, needed=[...new Set(['USD','CAD','AUD',cur(),S.sourceCur])];S.fxInfo='Recupero cambi…';recalc();
 const results=await Promise.allSettled(needed.map(async currency=>[currency,await getToUSD(currency)]));
 if(seq!==S.fxSequence||!panel.isConnected)return;
 const errors=[];
 results.forEach((r,i)=>{if(r.status==='fulfilled')S.fx[r.value[0]]=r.value[1];else{delete S.fx[needed[i]];errors.push(needed[i]+': '+String(r.reason?.message||r.reason))}});
 S.fxInfo=errors.length?'Cambio non disponibile: '+errors.join(', '):'Cambio da Frankfurter (cache max 24 ore)';
 if(!S.fxAtStartup&&Number(S.fx.CAD)>0&&Number(S.fx.AUD)>0)S.fxAtStartup={CAD:S.fx.CAD,AUD:S.fx.AUD};
 recalc();
 if(errors.length)message('Cambio mancante: utile e pareggio restano vuoti, senza inventare il tasso.','warn');
 else if(!data.price)message('Prezzo concorrente non rilevato. Inserisci prezzo e valuta manualmente.','warn');
 else if(S.variantMode)message(S.variantStatus==='partial'?'Attributi rilevati sulla pagina. I prezzi non disponibili restano n.d. finché non vengono impostati.':'Varianti confermate: '+S.variants.length+'. È attiva soltanto la Master selezionata.',S.variantStatus==='partial'?'warn':'ok');
 else if(data.hasPriceVariants)message('Prodotto con possibili varianti: controlla il prezzo selezionato e usa ↻ per aggiornarlo.','warn');
 else message('Calcolatore pronto: verifica prezzo e valuta originali prima del salvataggio.','ok')
}
const labels={ebayFee:'Tariffa eBay (%)',internationalFee:'Tariffa internazionale (%)',marketingFee:'Marketing (%)',vatOnFees:'IVA sulle tariffe (%)',salesTaxEstimate:'Sales Tax stimata (%)',sellerDiscountPct:'Discount from seller (%)'};
function feeLabel(key){
 if(key==='fixedFee')return 'Tariffa fissa ('+cur()+')';
 if(key==='shippingCharge')return 'Shipping and handling ('+cur()+')';
 if(key==='fixedFeeLow')return 'Tariffa fissa fino a '+S.fees[S.market].fixedFeeThreshold+' '+cur();
 if(key==='fixedFeeHigh')return 'Tariffa fissa oltre '+S.fees[S.market].fixedFeeThreshold+' '+cur();
 if(key==='fixedFeeThreshold')return 'Soglia tariffa fissa ('+cur()+')';
 return labels[key]||key;
}
function renderSettings(){
 const box=el('feegrid');box.replaceChildren();
 function makeFeeField(key,container){
  const label=document.createElement('label'),input=document.createElement('input');
  const absolute=key==='fixedFee'||key==='shippingCharge'||key==='sellerDiscountPct'||tierKeys.includes(key);
  label.textContent=feeLabel(key);
  input.dataset.rate=key;input.type='number';input.min='0';input.step='.01';
  input.value=String(C.round(absolute?S.fees[S.market][key]:S.fees[S.market][key]*100));
  if(key==='fixedFee'&&S.market!=='AU'){
   label.textContent='Tariffa fissa ('+cur()+')';
   input.type='text';input.value=Number(S.fees[S.market].fixedFeeLow).toFixed(2)+' / '+Number(S.fees[S.market].fixedFeeHigh).toFixed(2);
   input.readOnly=true;input.disabled=true;
   input.title='Modifica i valori in Scaglioni tariffa fissa qui sotto';
  }
  container.append(label,input);
 }
 for(const key of [...fields,'sellerDiscountPct','shippingCharge'])makeFeeField(key,box);
 if(S.market!=='AU'){
  const details=document.createElement('details');details.className='dc-tier-details';
  details.style.gridColumn='1 / -1';
  const summary=document.createElement('summary');
  summary.textContent='Tariffa fissa · '+S.fees[S.market].fixedFeeLow.toFixed(2)+' / '+S.fees[S.market].fixedFeeHigh.toFixed(2)+' '+cur()+' (soglia '+S.fees[S.market].fixedFeeThreshold.toFixed(2)+' '+cur()+')';
  details.appendChild(summary);
  const group=document.createElement('div');group.className='feegrid';
  for(const key of tierKeys)makeFeeField(key,group);
  details.appendChild(group);box.appendChild(details);
 }
}
el('gear').addEventListener('click',()=>{el('settings').classList.toggle('open');if(el('settings').classList.contains('open'))renderSettings()});
el('save-rates').addEventListener('click',()=>{
 const rates={...S.fees[S.market]};
 for(const input of el('feegrid').querySelectorAll('input')){
   if(input.disabled)continue; // US/CA fixed-fee range summary is read-only; tiers are the editable source.
   const key=input.dataset.rate,v=C.num(input.value),abs=key==='fixedFee'||tierKeys.includes(key)||key==='shippingCharge'||key==='sellerDiscountPct';
   if(v===null||v<0||(!abs&&v>=100)||(key==='sellerDiscountPct'&&v>=100)||(key==='fixedFeeThreshold'&&v<=0)){message('Tariffa non valida: '+key,'bad');return}
   rates[key]=abs?v:v/100;
 }
 if(!C.fees(100,rates,1,0)){message('Tariffe incoerenti, verifica le percentuali.','bad');return}
 const all=saved(feeKey);all[S.market]={...rates,feePresetVersion:3};
 try{write(feeKey,all)}catch(e){message('Errore memoria browser: '+e.message,'bad');return}
 S.fees[S.market]=rates;S.provisional[S.market]=false;S.shipping=rates.shippingCharge;el('shipping').value=S.shipping;recalc();el('settings').classList.remove('open');message('Tariffe '+S.market+' salvate.','ok')
});
el('market').addEventListener('change',()=>{readEdits();if(S.variantMode)saveMasterState();S.market=el('market').value;S.shipping=Number(S.fees[S.market].shippingCharge||0);el('shipping').value=S.shipping;el('shipping-currency').textContent=cur();if(S.variantMode)chooseMaster(S.masterKey,false);else{S.manualSale=false;recalc()}if(el('settings').classList.contains('open'))renderSettings();void fxUpdate()});
el('source').addEventListener('input',()=>{readEdits();S.sourceMethod='manuale';S.manualSale=false;recalc()});
el('source-currency').addEventListener('change',()=>{readEdits();S.sourceMethod='manuale';S.manualSale=false;recalc();void fxUpdate()});
el('title').addEventListener('input',()=>{S.title=C.clean(el('title').value)});
el('cost').addEventListener('input',()=>{readEdits();recalc()});
el('shipping').addEventListener('input',()=>{readEdits();recalc()});
el('quantity').addEventListener('input',()=>{readEdits();recalc()});
el('discount').addEventListener('input',()=>{const x=C.num(el('discount').value);if(x===null||x<=-100||x>1000){message('Percentuale non valida: -2 diminuisce, +2 aumenta.','warn');return}S.discount=x;S.manualSale=false;recalc()});
el('sale').addEventListener('input',()=>{const x=C.num(el('sale').value);S.sale=x>0?x:null;S.manualSale=true;const b=localBase();if(b>0&&S.sale>0){S.discount=C.round((S.sale/b-1)*100);el('discount').value=S.discount}recalc()});
el('refresh').addEventListener('click',()=>{if(S.variantMode){void probeVariants(true);return}const again=C.readDocument(document,hostname,location.href);if(!again.price){message('Prezzo eBay non disponibile. Il valore manuale resta invariato.','warn');return}S.sourcePrice=again.price.value;S.sourceCur=again.price.currency;S.sourceMethod=again.price.source;el('source').value=S.sourcePrice;el('source-currency').value=S.sourceCur;S.manualSale=false;recalc();void fxUpdate()});
function search(kind){
 const title=C.clean(el('title').value);if(!title){message('Titolo mancante, ricerca non avviata.','bad');return}
 const slug=title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,120);
 const url=kind==='ali'?'https://www.aliexpress.us/w/wholesale-'+encodeURIComponent(slug)+'.html?SearchText='+encodeURIComponent(title):'https://'+C.MARKETS[S.market].amazon+'/s?k='+encodeURIComponent(title);
 window.open(url,'_blank','noopener,noreferrer');message('Ricerca '+(kind==='ali'?'AliExpress':'Amazon')+' aperta in una nuova scheda.','ok')
}
el('ali').addEventListener('click',()=>search('ali'));el('amazon').addEventListener('click',()=>search('amazon'));
async function ensureCatalogTransport(){
 const loaded=globalThis.__dropperCompetitorCatalogTransport;
 if(loaded&&typeof loaded.save==='function'&&typeof loaded.buildPackage==='function')return loaded;
 // Older TEST bookmarklets may load only Core + UI, omitting the newly added transport.
 // Load this module only when necessary; no Apps Script/API request or AI tokens used here.
 const base='https://raw.githubusercontent.com/PeppeTek/ebay-tools/feature/competitor-calculator-2026-10-23/';
 const file='ebay-competitor-catalog-transport-v1.js';
 let response;
 try{response=await fetch(base+file+'?ts='+Date.now(),{cache:'no-store'})}
 catch(error){throw Error('Impossibile scaricare '+file+': '+String(error&&error.message||error))}
 if(!response.ok)throw Error(file+' HTTP '+response.status+' (controlla accesso GitHub)');
 const code=String(await response.text()).replace(/^\s*javascript\s*:/i,'');
 try{(0,eval)(code)}catch(error){throw Error('Errore caricamento '+file+': '+String(error&&error.message||error))}
 const ready=globalThis.__dropperCompetitorCatalogTransport;
 if(!ready||typeof ready.save!=='function'||typeof ready.buildPackage!=='function')
  throw Error(file+' scaricato ma non inizializzato; controlla la console browser');
 return ready
}
function catalogRows(){const all=saved(catalogKey);return Array.isArray(all[S.market])?all[S.market]:[]}
el('save').addEventListener('click',async()=>{
 readEdits();
 const title=C.clean(el('title').value),price=S.sale,market=S.market;
 if(!title||!Number.isFinite(price)||price<=0){message('Non salvato: Title o Start price non valido.','bad');return}
 if(!S.fx[cur()]&&S.sourceCur!==cur()){message('Non salvato: cambio valuta non disponibile.','bad');return}
 let entry={itemId:id,title,price:C.round(price)};
 if(S.variantMode){
  try{
   entry=variantCatalogEntry(entry);
   const transport=await ensureCatalogTransport();
   if(typeof transport.buildVariantPackage!=='function')throw Error('Modulo CSV varianti non disponibile');
   transport.buildVariantPackage(entry,market);
  }catch(err){message('Catalogo varianti non salvato: '+String(err?.message||err),'bad');return}
 }
 // Preserve the existing local quick list / CSV, but never confuse that with online confirmation.
 const all=saved(catalogKey),rows=Array.isArray(all[market])?all[market]:[];
 const previous=rows.findIndex(r=>String(r.itemId)===id);
 if(previous>=0){
  const old=rows[previous];
  if((old.title!==entry.title||Number(old.price)!==entry.price)&&!confirm('Item ID già presente nella lista locale '+market+'. Aggiornare la copia locale e provare il catalogo online?'))return;
  rows[previous]=entry;
 }
 else rows.push(entry);
 all[market]=rows;
 try{write(catalogKey,all)}catch(e){message('Salvataggio locale fallito: '+String(e&&e.message||e),'bad');return}
 const check=saved(catalogKey)[market]||[];
 if(!check.some(r=>String(r.itemId)===id&&r.title===title&&r.price===entry.price)){
  message('Salvataggio locale non confermato.','bad');return
 }
 const btn=el('save'),oldLabel=btn.textContent;btn.disabled=true;btn.textContent='Salvataggio catalogo…';
 try{
  const transport=await ensureCatalogTransport();
  const result=await transport.save(entry,market,existingSellLikeEndpoint);
  if(result.duplicate===true){
   message('Item ID già presente nel catalogo '+market+' · '+id+'. Backend segnala duplicato: aggiornamento dei prezzi varianti NON confermato.','warn')
  }else{
   message('Catalogo '+market+': backend conferma '+(S.variantMode?'padre e '+entry.variants.length+' righe varianti':'SKU + Title + Start price')+' · Item ID '+id+' · riga '+result.rowStart+'.','ok')
  }
 }catch(e){console.error('Dropper catalogo concorrente',e);message('Copia LOCALE salvata, catalogo ONLINE non confermato: '+String(e&&e.message||e),'bad')}
 finally{btn.disabled=false;btn.textContent=oldLabel}
});
const csvEscape=x=>{const s=String(x??'');return /[,"\r\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s};
el('export').addEventListener('click',async()=>{
 if(S.variantMode){
  try{
   readEdits();
   const entry=variantCatalogEntry({itemId:id,title:C.clean(el('title').value),price:C.round(S.sale)});
   const transport=await ensureCatalogTransport();
   if(typeof transport.buildVariantPackage!=='function'||typeof transport.toCsv!=='function')throw Error('Modulo CSV varianti non caricato');
   const pkg=transport.buildVariantPackage(entry,S.market);
   const blob=new Blob([transport.toCsv(pkg)],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
   a.href=url;a.download='pricematch-pro-varianti-'+S.market.toLowerCase()+'-'+id+'.csv';
   panel.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2500);
   message('CSV eBay padre + '+entry.variants.length+' varianti generato. Prima dell’importazione completare categoria, quantità, condizione, profili e ogni altro campo obbligatorio.','warn')
  }catch(err){message('CSV varianti non generato: '+String(err?.message||err),'bad')}
  return
 }
 const rows=catalogRows();if(!rows.length){message('Catalogo rapido '+S.market+' vuoto.','warn');return}
 const content=['Item ID,Title,Price',...rows.map(r=>[r.itemId,r.title,r.price].map(csvEscape).join(','))].join('\r\n');
 const blob=new Blob(['\uFEFF'+content],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='dropper-catalogo-rapido-'+S.market.toLowerCase()+'.csv';panel.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2500);
 message('CSV generato: '+rows.length+' prodotti, solo Item ID, titolo e prezzo.','ok')
});
el('close').addEventListener('click',()=>{S.fxSequence++;S.variantRequest++;panel.remove();style.remove()});
el('title').value=S.title;el('market').value=S.market;el('source').value=S.sourcePrice??'';el('source-currency').value=S.sourceCur;el('discount').value=S.discount;el('shipping').value=S.shipping;el('quantity').value=S.quantity;
recalc();void fxUpdate();void probeVariants(false);
})();
