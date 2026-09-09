javascript:(()=>{
'use strict';
const PANEL_ID='capitan-sell-like-clone';
const ENDPOINT_KEY='pep-ebay-bs-v6-google-url';
const EXT_ID='capitan-amazon-match-ext';
const MODAL_ID='capitan-pricing-modal';
const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const panel=document.getElementById(PANEL_ID);if(!panel||document.getElementById(EXT_ID))return;
const sourceText=clean(panel.innerText||'');
const itemId=(sourceText.match(/Source Item ID:\s*(\d{9,12})/i)||[])[1]||'';
if(!itemId)return;
const priceMatch=sourceText.match(/Prezzo:\s*([0-9]+(?:[.,][0-9]+)?)/i);
const currentSalePrice=priceMatch?Number(String(priceMatch[1]).replace(',','.')):null;
const actions=panel.querySelector('[data-ebay-actions]');
const wrap=document.createElement('div');wrap.id=EXT_ID;wrap.style.cssText='padding:0 14px 10px;background:#fff';wrap.innerHTML='<div id="capitan-amazon-status" style="padding:7px 0 0;font-size:12px"></div><div id="capitan-amazon-results"></div>';
if(actions)panel.insertBefore(wrap,actions);else (panel.querySelector('.b')||panel).appendChild(wrap);
let findBtn=null,insertBtn=null;
if(actions){
  insertBtn=document.createElement('button');insertBtn.id='capitan-amazon-insert';insertBtn.textContent='Inserisci ASIN';insertBtn.style.cssText='height:42px;border:1px solid #d5a500;border-radius:22px;background:#ffd814;color:#111;font-size:14px;cursor:pointer';
  findBtn=document.createElement('button');findBtn.id='capitan-amazon-find';findBtn.textContent='Trova su Amazon';findBtn.style.cssText='height:42px;border:1px solid #ff8f00;border-radius:22px;background:#ffa41c;color:#111;font-size:14px;cursor:pointer';
  actions.insertBefore(findBtn,actions.firstChild);actions.insertBefore(insertBtn,findBtn);
}else{
  insertBtn=document.createElement('button');insertBtn.id='capitan-amazon-insert';insertBtn.textContent='Inserisci ASIN';insertBtn.style.cssText='width:100%;height:42px;border:1px solid #d5a500;border-radius:22px;background:#ffd814;color:#111;font-size:14px;cursor:pointer;margin-top:8px';
  findBtn=document.createElement('button');findBtn.id='capitan-amazon-find';findBtn.textContent='Trova su Amazon';findBtn.style.cssText='width:100%;height:42px;border:1px solid #ff8f00;border-radius:22px;background:#ffa41c;color:#111;font-size:14px;cursor:pointer;margin-top:8px';
  wrap.insertBefore(findBtn,wrap.firstChild);wrap.insertBefore(insertBtn,findBtn);
}
const status=wrap.querySelector('#capitan-amazon-status'),results=wrap.querySelector('#capitan-amazon-results');
let lastMatches=[];
let pricingRates={ebayFee:.136,internationalFee:.016,marketingFee:.02,vatOnFees:.22,salesTaxEstimate:.06,fixedFee:.40};

function endpoint(){return (localStorage.getItem(ENDPOINT_KEY)||'').replace(/\/+$/,'')}
function jsonpAction(action,params){const ep=endpoint();return new Promise((resolve,reject)=>{if(!ep)return reject(Error('Endpoint Apps Script non configurato'));const cb='__capitanCb_'+Date.now()+'_'+Math.floor(Math.random()*1e6),s=document.createElement('script'),t=setTimeout(()=>done(Error('Timeout backend')),90000);function done(err,val){clearTimeout(t);try{delete window[cb]}catch(_){window[cb]=undefined}s.remove();err?reject(err):resolve(val)}window[cb]=v=>done(null,v);s.onerror=()=>done(Error('Backend non raggiungibile'));const q=new URLSearchParams({action,callback:cb,_:Date.now().toString(),...(params||{})});s.src=ep+(ep.includes('?')?'&':'?')+q.toString();document.head.appendChild(s)})}

function ensureBreakEvenRow(){
  const steps=panel.querySelector('#steps');if(!steps)return null;
  let row=panel.querySelector('#capitan-break-even-row');if(row)return row;
  const priceRow=[...steps.querySelectorAll('.row')].find(r=>/^Prezzo:/i.test(clean(r.innerText||r.textContent)));
  row=document.createElement('div');row.id='capitan-break-even-row';row.className='row';row.style.cssText='display:flex;align-items:center;justify-content:space-between;gap:10px';
  row.innerHTML='<span><b>Break Even Price:</b> <span id="capitan-break-even-value">—</span></span><button type="button" id="capitan-pricing-open" title="Aggiorna tariffe" aria-label="Aggiorna tariffe" style="margin-left:auto;width:28px;height:28px;padding:0;border:0;background:transparent;color:#3665f3;font-size:18px;line-height:28px;cursor:pointer;border-radius:50%">⚙</button>';
  if(priceRow)priceRow.insertAdjacentElement('afterend',row);else steps.prepend(row);
  row.querySelector('#capitan-pricing-open').addEventListener('click',e=>{e.preventDefault();openPricingModal()});
  return row;
}
function breakEvenValueEl(){ensureBreakEvenRow();return panel.querySelector('#capitan-break-even-value')}
function selectedRows(){return [...results.querySelectorAll('input.capitan-amazon-choice:checked')].map(el=>lastMatches.find(x=>x.asin===el.value)).filter(Boolean)}
function selectedAsins(){return selectedRows().map(x=>x.asin).filter(Boolean)}
function calcMaxBreakEvenCostFromSalePrice(salePrice,r){
  salePrice=Number(salePrice);if(!isFinite(salePrice)||salePrice<=0)return null;
  const feeRate=(r.ebayFee||0)+(r.internationalFee||0)+(r.marketingFee||0);
  const variableFeeMultiplier=(1+(r.salesTaxEstimate||0))*feeRate*(1+(r.vatOnFees||0));
  const fixedFeeWithVat=(r.fixedFee||0)*(1+(r.vatOnFees||0));
  const value=(salePrice*(1-variableFeeMultiplier))-fixedFeeWithVat;
  return value>0?Math.round(value*100)/100:null;
}
function recalcBreakEven(){
  const el=breakEvenValueEl();if(!el)return;
  const value=calcMaxBreakEvenCostFromSalePrice(currentSalePrice,pricingRates);
  el.textContent=value==null?'—':`${value.toFixed(2)} USD`;
  const danger=value!=null&&isFinite(currentSalePrice)&&value>currentSalePrice;
  el.style.color=danger?'#b42318':'';
  el.style.fontWeight=danger?'700':'';
}

function render(list){
  lastMatches=Array.isArray(list)?list.slice(0,5):[];results.innerHTML='';
  if(!lastMatches.length){results.innerHTML='<div style="padding:6px 0;color:#a15c00;font-size:12px;font-weight:700">Nessun match Amazon sufficientemente affidabile.</div>';return}
  const box=document.createElement('div');box.style.cssText='margin-top:8px;border:1px solid #ddd;border-radius:8px;overflow:hidden';
  lastMatches.forEach((x,i)=>{const r=document.createElement('label');r.style.cssText='display:grid;grid-template-columns:24px 1fr auto;gap:8px;align-items:center;padding:8px 9px;border-bottom:'+(i===lastMatches.length-1?'0':'1px solid #eee')+';cursor:pointer;font-size:12px';const price=x.price==null||x.price===''?'—':`${Number(x.price).toFixed(2)} ${esc(x.currency||'USD')}`;r.innerHTML=`<input type="checkbox" class="capitan-amazon-choice" value="${esc(x.asin||'')}" ${i===0?'checked':''} style="width:16px;height:16px;border-radius:0;accent-color:#111"><a href="${esc(x.url||('https://www.amazon.com/dp/'+(x.asin||'')))}" target="_blank" rel="noopener" style="color:#111;text-decoration:none"><b>${esc(x.asin||'')}</b></a><span>${price}</span>`;box.appendChild(r)});
  results.appendChild(box);
}

function findSkuField(){
  const re=/^\*?\s*custom\s+label\s*\(sku\)\s*$/i;
  for(const l of document.querySelectorAll('label')){const t=clean(l.innerText||l.textContent);if(!re.test(t))continue;let el=l.htmlFor?document.getElementById(l.htmlFor):l.querySelector('input,textarea');if(el)return el;let p=l.parentElement;for(let i=0;i<5&&p;i++,p=p.parentElement){el=p.querySelector('input,textarea');if(el)return el}}
  return [...document.querySelectorAll('input,textarea')].find(el=>re.test(clean([el.name,el.id,el.getAttribute('aria-label'),el.placeholder].join(' '))))||null;
}
function setNativeValue(el,value){if(!el)return false;const proto=el instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;const setter=Object.getOwnPropertyDescriptor(proto,'value')?.set;const old=el.value;if(setter)setter.call(el,String(value));else el.value=String(value);if(el._valueTracker&&typeof el._valueTracker.setValue==='function')el._valueTracker.setValue(old);el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));el.blur?.();return true}

function openPricingModal(){
  document.getElementById(MODAL_ID)?.remove();
  const logo=panel.querySelector('.brand img')?.src||panel.querySelector('img')?.src||'';
  const overlay=document.createElement('div');overlay.id=MODAL_ID;overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.42);z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:20px;font-family:Arial,sans-serif';
  const pct=v=>(Number(v||0)*100).toFixed(2);
  overlay.innerHTML=`<div style="width:min(520px,94vw);max-height:90vh;overflow:auto;background:#fff;border-radius:14px;box-shadow:0 18px 60px rgba(0,0,0,.28);border:1px solid #d9d9d9"><div style="padding:20px 22px 14px;border-bottom:1px solid #e7e7e7;position:relative">${logo?`<img src="${esc(logo)}" alt="Dropper Analytics" style="display:block;max-width:190px;max-height:58px;object-fit:contain;margin-bottom:14px">`:''}<div style="font-size:19px;font-weight:700;color:#111">Sell Like This v1.4 - Aggiorna le tariffe</div><button data-close style="position:absolute;right:16px;top:16px;width:30px;height:30px;border:1px solid #bbb;border-radius:8px;background:#fff;cursor:pointer;font-size:18px">×</button></div><div style="padding:18px 22px"><div style="font-size:12px;color:#5f6368;margin-bottom:16px;line-height:1.45">Tariffe utilizzate per il calcolo del Break Even Price. La formula è la stessa utilizzata nella scheda AMAZON_IMPORT.</div><div style="display:grid;grid-template-columns:1fr 150px;gap:11px 14px;align-items:center;font-size:13px"><label>eBay Fee %</label><input data-rate="ebayFee" value="${pct(pricingRates.ebayFee)}" inputmode="decimal"><label>International Fee %</label><input data-rate="internationalFee" value="${pct(pricingRates.internationalFee)}" inputmode="decimal"><label>Marketing Fee %</label><input data-rate="marketingFee" value="${pct(pricingRates.marketingFee)}" inputmode="decimal"><label>VAT on Fees %</label><input data-rate="vatOnFees" value="${pct(pricingRates.vatOnFees)}" inputmode="decimal"><label>Sales Tax Estimate %</label><input data-rate="salesTaxEstimate" value="${pct(pricingRates.salesTaxEstimate)}" inputmode="decimal"><label>eBay Fixed Fee</label><input data-rate="fixedFee" value="${Number(pricingRates.fixedFee||0).toFixed(2)}" inputmode="decimal"></div><div id="capitan-pricing-msg" style="min-height:18px;margin-top:14px;font-size:12px"></div><button data-save style="width:100%;height:44px;margin-top:8px;border:0;border-radius:24px;background:#1668e8;color:#fff;font-weight:700;font-size:14px;cursor:pointer">Salva</button></div></div>`;
  overlay.querySelectorAll('input').forEach(i=>i.style.cssText='height:36px;border:1px solid #b9b9b9;border-radius:8px;padding:0 10px;font-size:13px;box-sizing:border-box;width:100%');
  document.body.appendChild(overlay);
  const close=()=>overlay.remove();overlay.querySelector('[data-close]').onclick=close;overlay.addEventListener('click',e=>{if(e.target===overlay)close()});
  overlay.querySelector('[data-save]').addEventListener('click',async()=>{
    const msg=overlay.querySelector('#capitan-pricing-msg');
    try{
      const vals={};overlay.querySelectorAll('[data-rate]').forEach(i=>vals[i.dataset.rate]=Number(String(i.value).replace(',','.')));
      for(const k of ['ebayFee','internationalFee','marketingFee','vatOnFees','salesTaxEstimate'])if(!isFinite(vals[k])||vals[k]<0||vals[k]>=100)throw Error('Controlla le percentuali inserite.');
      if(!isFinite(vals.fixedFee)||vals.fixedFee<0)throw Error('Controlla eBay Fixed Fee.');
      const params={ebayFee:String(vals.ebayFee/100),internationalFee:String(vals.internationalFee/100),marketingFee:String(vals.marketingFee/100),vatOnFees:String(vals.vatOnFees/100),salesTaxEstimate:String(vals.salesTaxEstimate/100),fixedFee:String(vals.fixedFee)};
      msg.innerHTML='<span style="color:#555">Salvataggio…</span>';const data=await jsonpAction('sell_like_pricing_save',params);if(!data||!data.ok)throw Error(data?.error||'Salvataggio non riuscito');pricingRates=data.rates||pricingRates;recalcBreakEven();msg.innerHTML='<span style="color:#137333;font-weight:700">Tariffe salvate.</span>';setTimeout(close,650);
    }catch(e){msg.innerHTML='<span style="color:#b42318;font-weight:700">'+esc(e.message||e)+'</span>'}
  });
}

async function loadPricing(){try{const data=await jsonpAction('sell_like_pricing_get');if(data&&data.ok&&data.rates)pricingRates=data.rates}catch(e){console.warn('Pricing config',e)}recalcBreakEven()}

insertBtn.addEventListener('click',()=>{const asins=selectedAsins();if(!asins.length){status.innerHTML='<span style="color:#b42318;font-weight:700">Seleziona almeno un ASIN.</span>';return}const field=findSkuField();if(!field){status.innerHTML='<span style="color:#b42318;font-weight:700">Campo Custom label (SKU) non trovato.</span>';return}const value=asins.join(' - ');if(setNativeValue(field,value))status.innerHTML='<span style="color:#137333;font-weight:700">ASIN inseriti:</span> '+esc(value)});
findBtn.addEventListener('click',async()=>{const ep=endpoint();if(!ep){status.innerHTML='<span style="color:#b42318;font-weight:700">Endpoint Apps Script non configurato.</span>';return}findBtn.disabled=true;status.textContent='Analisi titolo e ricerca Amazon in corso…';results.innerHTML='';try{const data=await jsonpAction('amazon_match',{itemId});if(!data||!data.ok)throw Error(data?.error||'Risposta Amazon non valida');render(data.matches||[]);status.innerHTML='<span style="color:#137333;font-weight:700">Match completato.</span> Sono mostrati solo candidati compatibili.'}catch(e){console.error(e);status.innerHTML='<span style="color:#b42318;font-weight:700">Errore:</span> '+esc(e.message||e)}finally{findBtn.disabled=false}});
ensureBreakEvenRow();loadPricing();
})();