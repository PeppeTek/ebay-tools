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
const fields=Object.keys(C.DEFAULT_FEES);
const feeKey='dropper-competitor-calculator-fees-v1',catalogKey='dropper-quick-catalog-v1';
const savedFees=saved(feeKey),oldFees=saved('capitan-sell-like-market-pricing-v1');
const S={market:C.countryFromHost(hostname),title:data.title,sourcePrice:data.price?.value??null,
 sourceCur:data.price?.currency||C.currencyFromHost(hostname),sourceMethod:data.price?.source||'manuale',
 discount:-2,sale:null,manualSale:false,purchaseUsd:null,fx:{USD:1},fees:{},provisional:{},fxInfo:'',fxSequence:0};
const prevDisc=Number(localStorage.getItem('capitan-sell-like-discount-rate-v1'));
if(Number.isFinite(prevDisc)&&prevDisc>-1&&prevDisc<10)S.discount=C.round(prevDisc*100);
for(const mk of Object.keys(C.MARKETS)){
 const r=savedFees[mk]||oldFees[mk],valid=!!r&&fields.every(k=>Number.isFinite(Number(r[k]))&&Number(r[k])>=0);
 S.fees[mk]=valid?Object.fromEntries(fields.map(k=>[k,Number(r[k])])):{...C.DEFAULT_FEES};
 S.provisional[mk]=!valid;
}
const style=document.createElement('style');style.id=styleId;style.textContent=
'#'+panelId+'{position:fixed;top:12px;right:12px;z-index:2147483647;width:500px;max-width:calc(100vw - 16px);max-height:calc(100vh - 24px);overflow:auto;background:#fff;color:#111;font:12px Arial,sans-serif;border:1px solid #bbb;border-radius:12px;box-shadow:0 10px 32px #0004;box-sizing:border-box}'+
'#'+panelId+' *{box-sizing:border-box}#'+panelId+' .hd{padding:12px;border-bottom:1px solid #ddd;display:flex;align-items:center;gap:7px}'+
'#'+panelId+' .hd b{flex:1}#'+panelId+' .hd button{width:32px;height:30px;border:1px solid #bbb;border-radius:7px;background:#fff;font-size:18px;cursor:pointer}'+
'#'+panelId+' .main{padding:9px 14px}#'+panelId+' input,#'+panelId+' select{width:100%;min-width:0;border:1px solid #c5c9cf;background:#fff;color:#111;border-radius:7px;padding:6px;font:12px Arial,sans-serif}'+
'#'+panelId+' label{font-weight:700}#'+panelId+' .split{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:10px 0}'+
'#'+panelId+' .source{display:grid;grid-template-columns:1fr 115px 70px;gap:8px;align-items:center;margin:7px 0}'+
'#'+panelId+' .row{display:grid;grid-template-columns:minmax(0,1fr) 84px 106px;gap:8px;align-items:center;min-height:40px;border-bottom:1px solid #e8e8e8;padding:4px 0}'+
'#'+panelId+' .row .val{text-align:right;font-weight:bold;color:#16813f}#'+panelId+' .row .val small{display:block;font-weight:400;font-size:10px;color:#777;margin-top:3px}'+
'#'+panelId+' .hint{font-size:10px;color:#666;line-height:1.4;margin:8px 0}#'+panelId+' .buttons{display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:10px 14px}'+
'#'+panelId+' .buttons button{height:42px;border:1px solid #aaa;border-radius:21px;cursor:pointer;font-size:13px;font-weight:700}'+
'#'+panelId+' .span2{grid-column:1/-1}#'+panelId+' .settings{display:none;background:#fafafa;padding:12px 14px;border-top:1px solid #ddd}'+
'#'+panelId+' .settings.open{display:block}#'+panelId+' .feegrid{display:grid;grid-template-columns:1fr 90px;gap:7px;align-items:center}'+
'#'+panelId+' .message{margin:0 14px 12px;padding:9px;border:1px solid #e2e5ec;background:#f8f9fb;border-radius:7px;font-size:11px;line-height:1.5;white-space:pre-wrap}'+
'#'+panelId+' .message[data-status="bad"]{color:#b42318}#'+panelId+' .message[data-status="warn"]{color:#986000}#'+panelId+' .message[data-status="ok"]{color:#137333}'+
'@media(max-width:420px){#'+panelId+' .row{grid-template-columns:minmax(0,1fr) 70px 90px;gap:4px}#'+panelId+' .main{padding:8px 10px}}';
document.head.appendChild(style);
const panel=document.createElement('section');panel.id=panelId;
panel.innerHTML='<div class="hd"><b><span style="color:#0cbcae">◩</span> DROPPER ANALYTICS<br><small>Calcolatore concorrente</small></b><button data-el="refresh" title="Aggiorna prezzo dalla pagina">↻</button><button data-el="gear" title="Tariffe">⚙</button><button data-el="close" title="Chiudi">×</button></div>'+
'<div class="main"><p><b>Source Item ID:</b> '+esc(id)+'</p><label> Titolo per catalogo <input data-el="title" maxlength="255" placeholder="Titolo eBay"></label>'+
'<div class="split"><label>Paese di vendita<select data-el="market"><option value="US">USA (USD)</option><option value="CA">Canada (CAD)</option><option value="AU">Australia (AUD)</option></select></label><label>Costo acquisto (USD)<input type="number" data-el="cost" step=".01" min="0" placeholder="—"></label></div>'+
'<label>Prezzo originale concorrente</label><div class="source"><span class="hint" data-el="source-label">Da pagina eBay</span><input type="number" data-el="source" min=".01" step=".01" placeholder="Prezzo"><select data-el="source-currency"><option>USD</option><option>CAD</option><option>AUD</option><option>EUR</option><option>GBP</option><option>CHF</option><option>SGD</option><option>HKD</option><option>MYR</option></select></div>'+
'<div class="row"><label>Riduzione rispetto alla concorrenza:</label><input data-el="discount" type="number" step=".01"><div class="val" data-el="source-local">—</div></div>'+
'<div class="row"><label>Prezzo di vendita:</label><input data-el="sale" type="number" min=".01" step=".01"><div class="val" data-el="sale-view">—</div></div>'+
'<div class="row"><label>Tariffe sul prezzo di vendita:</label><span></span><div class="val" data-el="fees" style="color:#e3342f">—</div></div>'+
'<div class="row"><label>Costo totale d’acquisto:</label><span></span><div class="val" data-el="cost-view">—</div></div>'+
'<div class="row"><label>Il mio utile netto:</label><span></span><div class="val" data-el="profit">—</div></div>'+
'<div class="row"><label>Prezzo minimo di pareggio:</label><span></span><div class="val" data-el="break-even" style="color:#2563eb">—</div></div>'+
'<div class="hint" data-el="fx-status"></div></div>'+
'<div class="settings" data-el="settings"><b>Tariffe per paese selezionato</b><div class="feegrid" data-el="feegrid" style="margin-top:9px"></div><button data-el="save-rates" style="margin-top:9px;padding:8px;background:#2563eb;color:white;border:0;border-radius:7px;cursor:pointer">Salva tariffe per questo paese</button><p class="hint">Le tariffe sono stime modificabili, separate dalle impostazioni Sell Like Clone.</p></div>'+
'<div class="buttons"><button data-el="ali" style="background:#ff4747;color:white">Trova su AliExpress</button><button data-el="amazon" style="background:#ffa41c;color:#111">Trova su Amazon</button>'+
'<button class="span2" data-el="save" style="background:#16a34a;color:white">Aggiungi a catalogo</button>'+
'<button class="span2" data-el="export" style="background:white;color:#333;height:31px">Esporta catalogo rapido CSV (3 colonne)</button></div>'+
'<div class="message" data-el="message">Avvio calcolatore…</div><p class="hint" style="padding:0 14px 12px">Catalogo rapido locale nel browser. Separato dal Google Sheet di importazione eBay; nessuna pubblicazione.</p>';
document.body.appendChild(panel);
const el=k=>panel.querySelector('[data-el="'+k+'"]');
const cur=()=>C.MARKETS[S.market].currency;
function message(t,kind='info'){el('message').textContent=t;el('message').dataset.status=kind}
function textMoney(k,value,us){
 const e=el(k),span=document.createElement('span');e.replaceChildren();span.textContent=value===null||value===undefined||!Number.isFinite(Number(value))?'—':Number(value).toFixed(2)+' '+cur();e.appendChild(span);
 if(us!==null&&us!==undefined&&Number.isFinite(Number(us))&&cur()!=='USD'){const small=document.createElement('small');small.textContent=Number(us).toFixed(2)+' USD';e.appendChild(small)}
}
function localBase(){const a=S.fx[S.sourceCur],b=S.fx[cur()];if(S.sourcePrice===null)return null;if(S.sourceCur===cur())return S.sourcePrice;return a>0&&b>0?C.round(S.sourcePrice*a/b):null}
function recalc(){
 const b=localBase();
 if(!S.manualSale){S.sale=b===null?null:C.adjusted(b,S.discount);el('sale').value=S.sale??''}
 const fx=S.fx[cur()]||null,st=C.fees(S.sale,S.fees[S.market],fx,S.purchaseUsd);
 textMoney('source-local',b,b!==null&&fx?C.round(b*fx):null);
 textMoney('sale-view',S.sale,S.sale!==null&&fx?C.round(S.sale*fx):null);
 textMoney('fees',st?.fee??null,st&&fx?C.round(st.fee*fx):null);
 textMoney('cost-view',st?.costLocal??null,S.purchaseUsd);
 textMoney('profit',st?.profitLocal??null,st?.profitUSD??null);
 el('profit').style.color=st?.profitUSD<0?'#b42318':'#16803d';
 textMoney('break-even',st?.breakEven??null,st?.breakEven!=null&&fx?C.round(st.breakEven*fx):null);
 el('fx-status').textContent=(S.fxInfo||'Conversioni da verificare')+(S.provisional[S.market]?' · Tariffe '+S.market+' provvisorie USA: controlla ⚙':'');
 el('source-label').textContent=S.sourceMethod==='manuale'?'Modificabile':'Letto: '+S.sourceMethod;
}
function readEdits(){
 const x=C.num(el('source').value);S.sourcePrice=x>0?x:null;
 S.sourceCur=el('source-currency').value;
 S.title=C.clean(el('title').value);
 const y=C.num(el('cost').value);S.purchaseUsd=el('cost').value.trim()===''?null:y;
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
 const seq=++S.fxSequence, needed=[...new Set([cur(),S.sourceCur])];S.fxInfo='Recupero cambi…';recalc();
 const results=await Promise.allSettled(needed.map(async currency=>[currency,await getToUSD(currency)]));
 if(seq!==S.fxSequence||!panel.isConnected)return;
 const errors=[];
 results.forEach((r,i)=>{if(r.status==='fulfilled')S.fx[r.value[0]]=r.value[1];else{delete S.fx[needed[i]];errors.push(needed[i]+': '+String(r.reason?.message||r.reason))}});
 S.fxInfo=errors.length?'Cambio non disponibile: '+errors.join(', '):'Cambio da Frankfurter (cache max 24 ore)';
 recalc();
 if(errors.length)message('Cambio mancante: utile e pareggio restano vuoti, senza inventare il tasso.','warn');
 else if(!data.price)message('Prezzo concorrente non rilevato. Inserisci prezzo e valuta manualmente.','warn');
 else if(data.hasPriceVariants)message('Prodotto con possibili varianti: controlla il prezzo selezionato e usa ↻ per aggiornarlo.','warn');
 else message('Calcolatore pronto: verifica prezzo e valuta originali prima del salvataggio.','ok')
}
const labels={ebayFee:'Tariffa eBay (%)',internationalFee:'Tariffa internazionale (%)',marketingFee:'Marketing (%)',vatOnFees:'IVA sulle tariffe (%)',salesTaxEstimate:'Sales Tax stimata (%)',fixedFee:'Tariffa fissa ('+cur()+')'};
function renderSettings(){
 const box=el('feegrid');box.replaceChildren();
 for(const key of fields){const l=document.createElement('label'),v=document.createElement('input');l.textContent=key==='fixedFee'?'Tariffa fissa ('+cur()+')':labels[key];v.dataset.rate=key;v.type='number';v.min='0';v.step='.01';v.value=String(C.round(key==='fixedFee'?S.fees[S.market][key]:S.fees[S.market][key]*100));box.append(l,v)}
}
el('gear').addEventListener('click',()=>{el('settings').classList.toggle('open');if(el('settings').classList.contains('open'))renderSettings()});
el('save-rates').addEventListener('click',()=>{
 const rates={};for(const input of el('feegrid').querySelectorAll('input')){const key=input.dataset.rate,v=C.num(input.value);
 if(v===null||v<0||(key!=='fixedFee'&&v>=100)){message('Tariffa non valida: '+key,'bad');return}rates[key]=key==='fixedFee'?v:v/100}
 if(!C.fees(100,rates,1,0)){message('Tariffe incoerenti, verifica le percentuali.','bad');return}
 const all=saved(feeKey);all[S.market]=rates;
 try{write(feeKey,all)}catch(e){message('Errore memoria browser: '+e.message,'bad');return}
 S.fees[S.market]=rates;S.provisional[S.market]=false;recalc();message('Tariffe '+S.market+' salvate senza modificare quelle di Sell Like Clone.','ok')
});
el('market').addEventListener('change',()=>{readEdits();S.market=el('market').value;S.manualSale=false;recalc();if(el('settings').classList.contains('open'))renderSettings();void fxUpdate()});
el('source').addEventListener('input',()=>{readEdits();S.sourceMethod='manuale';S.manualSale=false;recalc()});
el('source-currency').addEventListener('change',()=>{readEdits();S.sourceMethod='manuale';S.manualSale=false;recalc();void fxUpdate()});
el('title').addEventListener('input',()=>{S.title=C.clean(el('title').value)});
el('cost').addEventListener('input',()=>{readEdits();recalc()});
el('discount').addEventListener('input',()=>{const x=C.num(el('discount').value);if(x===null||x<=-100||x>1000){message('Percentuale non valida: -2 diminuisce, +2 aumenta.','warn');return}S.discount=x;S.manualSale=false;recalc()});
el('sale').addEventListener('input',()=>{const x=C.num(el('sale').value);S.sale=x>0?x:null;S.manualSale=true;const b=localBase();if(b>0&&S.sale>0){S.discount=C.round((S.sale/b-1)*100);el('discount').value=S.discount}recalc()});
el('refresh').addEventListener('click',()=>{const again=C.readDocument(document,hostname,location.href);if(!again.price){message('Prezzo eBay non disponibile. Il valore manuale resta invariato.','warn');return}S.sourcePrice=again.price.value;S.sourceCur=again.price.currency;S.sourceMethod=again.price.source;el('source').value=S.sourcePrice;el('source-currency').value=S.sourceCur;S.manualSale=false;recalc();void fxUpdate()});
function search(kind){
 const title=C.clean(el('title').value);if(!title){message('Titolo mancante, ricerca non avviata.','bad');return}
 const slug=title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,120);
 const url=kind==='ali'?'https://www.aliexpress.us/w/wholesale-'+encodeURIComponent(slug)+'.html?SearchText='+encodeURIComponent(title):'https://'+C.MARKETS[S.market].amazon+'/s?k='+encodeURIComponent(title);
 window.open(url,'_blank','noopener,noreferrer');message('Ricerca '+(kind==='ali'?'AliExpress':'Amazon')+' aperta in una nuova scheda.','ok')
}
el('ali').addEventListener('click',()=>search('ali'));el('amazon').addEventListener('click',()=>search('amazon'));
function catalogRows(){const o=saved(catalogKey);return Array.isArray(o[S.market])?o[S.market]:[]}
el('save').addEventListener('click',()=>{
 readEdits();if(!S.title||!Number.isFinite(S.sale)||S.sale<=0){message('Non salvato: titolo o prezzo mancante.','bad');return}
 if(!S.fx[cur()]&&S.sourceCur!==cur()){message('Cambio mancante: non salvo un prezzo non verificato.','bad');return}
 const all=saved(catalogKey),rows=catalogRows(),existing=rows.findIndex(x=>x.itemId===id),entry={itemId:id,title:S.title,price:C.round(S.sale)};
 if(existing>=0){if(!confirm('Item ID già salvato per '+S.market+'. Aggiornare titolo e prezzo?'))return;rows[existing]=entry}else rows.push(entry);
 all[S.market]=rows;try{write(catalogKey,all)}catch(e){message('Salvataggio locale fallito: '+e.message,'bad');return}
 const ok=catalogRows().some(x=>x.itemId===entry.itemId&&x.title===entry.title&&x.price===entry.price);
 message(ok?'Salvato nel catalogo RAPIDO LOCALE '+S.market+': '+id+' · '+C.round(S.sale).toFixed(2)+' '+cur()+' · '+rows.length+' record. Non ancora nel Google Sheet online.':'Salvataggio non verificato.',ok?'ok':'bad')
});
const csvEscape=x=>{const s=String(x??'');return /[,"\r\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s};
el('export').addEventListener('click',()=>{
 const rows=catalogRows();if(!rows.length){message('Catalogo rapido '+S.market+' vuoto.','warn');return}
 const content=['Item ID,Title,Price',...rows.map(r=>[r.itemId,r.title,r.price].map(csvEscape).join(','))].join('\r\n');
 const blob=new Blob(['\uFEFF'+content],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='dropper-catalogo-rapido-'+S.market.toLowerCase()+'.csv';panel.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2500);
 message('CSV generato: '+rows.length+' prodotti, solo Item ID, titolo e prezzo.','ok')
});
el('close').addEventListener('click',()=>{S.fxSequence++;panel.remove();style.remove()});
el('title').value=S.title;el('market').value=S.market;el('source').value=S.sourcePrice??'';el('source-currency').value=S.sourceCur;el('discount').value=S.discount;
recalc();void fxUpdate();
})();
