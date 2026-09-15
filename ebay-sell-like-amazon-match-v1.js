javascript:(()=>{
'use strict';
const PANEL_ID='capitan-sell-like-clone';
const ENDPOINT_KEY='pep-ebay-bs-v6-google-url';
const AMAZON_MATCH_ENDPOINT=String(window.__capitanSellLikeBackendEndpoint||'').replace(/\/+$/,'');
const AMAZON_MAX_NEGATIVE_MARGIN=2;
const EXT_ID='capitan-amazon-match-ext';
const MODAL_ID='capitan-pricing-modal';
const SEARCH_HISTORY_KEY='capitan-sell-like-amazon-search-history-v1';
const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const panel=document.getElementById(PANEL_ID);if(!panel||document.getElementById(EXT_ID))return;
const sourceText=clean(panel.innerText||'');
const itemId=(sourceText.match(/Source Item ID:\s*(\d{9,12})/i)||[])[1]||'';
if(!itemId)return;
const priceMatch=sourceText.match(/Prezzo(?: di vendita)?(?: \(-\d+(?:[.,]\d+)?%\))?:\s*([0-9]+(?:[.,][0-9]+)?)/i);
let currentSalePrice=priceMatch?Number(String(priceMatch[1]).replace(',','.')):(isFinite(Number(window.__capitanSellLikeSalePrice))?Number(window.__capitanSellLikeSalePrice):null);
const actions=panel.querySelector('[data-ebay-actions]');
const wrap=document.createElement('div');wrap.id=EXT_ID;wrap.style.cssText='display:none;padding:0 14px 0;background:#fff';wrap.innerHTML='<div id="capitan-amazon-status" style="display:none"></div><div id="capitan-amazon-results"></div>';
if(actions)panel.insertBefore(wrap,actions);else (panel.querySelector('.b')||panel).appendChild(wrap);
let findBtn=null,insertBtn=null;
if(actions){
  insertBtn=document.createElement('button');insertBtn.id='capitan-amazon-best-match';insertBtn.textContent='Best Match Amazon';insertBtn.style.cssText='height:42px;border:1px solid #111;border-radius:0 22px 22px 0;background:#ffd814;color:#111;font-size:14px;cursor:pointer;width:100%';
  findBtn=document.createElement('button');findBtn.id='capitan-amazon-find';findBtn.textContent='Trova su Amazon';findBtn.style.cssText='height:42px;border:1px solid #111;border-radius:22px 0 0 22px;background:#ffa41c;color:#111;font-size:14px;cursor:pointer;width:100%';
  const slot=actions.querySelector('[data-amazon-actions-slot]');
  if(slot){slot.appendChild(findBtn);slot.appendChild(insertBtn)}else{actions.insertBefore(insertBtn,actions.firstChild);actions.insertBefore(findBtn,insertBtn)}
}else{
  insertBtn=document.createElement('button');insertBtn.id='capitan-amazon-best-match';insertBtn.textContent='Best Match Amazon';insertBtn.style.cssText='width:100%;height:42px;border:1px solid #d5a500;border-radius:22px;background:#ffd814;color:#111;font-size:14px;cursor:pointer;margin-top:8px';
  findBtn=document.createElement('button');findBtn.id='capitan-amazon-find';findBtn.textContent='Trova su Amazon';findBtn.style.cssText='width:100%;height:42px;border:1px solid #ff8f00;border-radius:22px;background:#ffa41c;color:#111;font-size:14px;cursor:pointer;margin-top:8px';
  wrap.insertBefore(findBtn,wrap.firstChild);wrap.insertBefore(insertBtn,findBtn);
}
const status=wrap.querySelector('#capitan-amazon-status'),historyBox=null,results=wrap.querySelector('#capitan-amazon-results');
let lastMatches=[],matchPage=0;
let pricingRates={ebayFee:.136,internationalFee:.016,marketingFee:.02,vatOnFees:.22,salesTaxEstimate:.06,fixedFee:.40};

function readSearchHistory(){try{const a=JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY)||'[]');return Array.isArray(a)?a:[]}catch(_){return[]}}
function writeSearchHistory(a){try{localStorage.setItem(SEARCH_HISTORY_KEY,JSON.stringify((a||[]).slice(0,10)))}catch(_){}}
function rememberSearch(title,url){
  const now=Date.now(),key=clean(itemId+'|'+title).toLowerCase(),old=readSearchHistory().find(x=>clean((x.itemId||'')+'|'+(x.title||'')).toLowerCase()===key);
  const next=[{itemId,title:clean(title),url:clean(url),shipping:clean(old&&old.shipping||''),at:now},...readSearchHistory().filter(x=>clean((x.itemId||'')+'|'+(x.title||'')).toLowerCase()!==key)].slice(0,10);
  writeSearchHistory(next);renderSearchHistory(next);resolveSearchShipping(itemId,title,url)
}
async function resolveSearchShipping(sourceItemId,title,url){
  if(typeof window.__capitanReadSourceShippingLabel!=='function')return;
  try{
    const shipping=await window.__capitanReadSourceShippingLabel(sourceItemId);
    if(!shipping)return;
    const key=clean(sourceItemId+'|'+title).toLowerCase();
    const next=readSearchHistory().map(x=>clean((x.itemId||'')+'|'+(x.title||'')).toLowerCase()===key?{...x,shipping,url:clean(url)||x.url}:x);
    writeSearchHistory(next);renderSearchHistory(next)
  }catch(e){console.warn('Amazon shipping history',e)}
}
function renderSearchHistory(list){
  if(!historyBox)return;
  const a=Array.isArray(list)?list:readSearchHistory();
  historyBox.innerHTML='';
  if(!a.length)return;
  const box=document.createElement('div');box.style.cssText='margin-top:7px;border:1px solid #e2e2e2;border-radius:8px;overflow:hidden;background:#fff';
  const head=document.createElement('div');head.style.cssText='padding:6px 9px;background:#fafafa;border-bottom:1px solid #eee;font-size:11px;font-weight:700;color:#555';head.textContent='Ultime ricerche Amazon';box.appendChild(head);
  a.forEach((x,i)=>{
    const row=document.createElement('a');row.href=x.url||'#';row.target='_blank';row.rel='noopener';row.style.cssText='display:block;padding:7px 9px;border-bottom:'+(i===a.length-1?'0':'1px solid #eee')+';color:#111;text-decoration:none;font-size:11px;line-height:1.3';
    const ship=clean(x.shipping||'');
    row.innerHTML='<b>'+esc(x.itemId||'')+'</b>'+(x.itemId?' · ':'')+esc(x.title||'')+(ship?'<div style="margin-top:3px;color:#555"><b>Spedizione:</b> '+esc(ship)+'</div>':'');
    box.appendChild(row);
    if(!ship&&x.itemId&&typeof window.__capitanReadSourceShippingLabel==='function')resolveSearchShipping(x.itemId,x.title||'',x.url||'')
  });
  historyBox.appendChild(box)
}
function endpoint(){let u=String(window.__capitanSellLikeBackendEndpoint||'').trim();if(u)return u.replace(/\/+$/,'');try{return (localStorage.getItem(ENDPOINT_KEY)||'').replace(/\/+$/,'')}catch(_){return''}}
function jsonpAction(action,params){const ep=action==='amazon_match'?AMAZON_MATCH_ENDPOINT:endpoint();return new Promise((resolve,reject)=>{if(!ep)return reject(Error('Endpoint Apps Script non configurato'));const cb='__capitanCb_'+Date.now()+'_'+Math.floor(Math.random()*1e6),s=document.createElement('script'),t=setTimeout(()=>done(Error('Timeout backend')),90000);function done(err,val){clearTimeout(t);try{delete window[cb]}catch(_){window[cb]=undefined}s.remove();err?reject(err):resolve(val)}window[cb]=v=>done(null,v);s.onerror=()=>done(Error('Backend non raggiungibile'));const q=new URLSearchParams({action,callback:cb,_:Date.now().toString(),...(params||{})});s.src=ep+(ep.includes('?')?'&':'?')+q.toString();document.head.appendChild(s)})}

function ensureBreakEvenRow(){
  const steps=panel.querySelector('#steps');if(!steps)return null;
  let row=panel.querySelector('#capitan-break-even-row');if(row)return row;
  const priceRow=[...steps.querySelectorAll('.row')].find(r=>/^Prezzo(?: di vendita)?:/i.test(clean(r.innerText||r.textContent)));
  const fee=panel.querySelector('#capitan-margin-break');
  row=document.createElement('div');row.id='capitan-break-even-row';row.className='row';
  row.innerHTML='<b>Break Even Price:</b> <span id="capitan-break-even-value">—</span>';
  const anchor=fee||priceRow;
  if(anchor)anchor.insertAdjacentElement('afterend',row);else steps.prepend(row);
  return row
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

function normalizeImageUrl(v){
  if(v&&typeof v==='object'){
    for(const k of ['url','src','image','imageUrl','imageURL','mainImage','mainImageUrl','thumbnail','thumbnailUrl','large','medium']){
      const got=normalizeImageUrl(v[k]);if(got)return got
    }
    return''
  }
  let s=String(v||'').trim();
  if(!s)return'';
  s=s.replace(/\\u002F/gi,'/').replace(/\\\//g,'/').replace(/&amp;/g,'&').replace(/&quot;/g,'"');
  let direct=s;
  if(/^\/\//.test(direct))direct='https:'+direct;
  if(/^https?:\/\//i.test(direct))return direct;
  let m=s.match(/(?:src|url|imageUrl|mainImage)["'=: \\]+((?:https?:)?\/\/[^"'<>\\s]+)/i);
  if(!m)m=s.match(/((?:https?:)?\/\/[^"'<>\\s]*(?:m\\.media-amazon\\.com|images-na\\.ssl-images-amazon\\.com)[^"'<>\\s]*)/i);
  if(!m)m=s.match(/((?:https?:)?\/\/[^"'<>\\s]+\.(?:jpg|jpeg|png|webp)(?:\?[^"'<>\\s]*)?)/i);
  if(!m)return'';
  direct=String(m[1]||'').replace(/\\\//g,'/');
  if(/^\/\//.test(direct))direct='https:'+direct;
  return /^https?:\/\//i.test(direct)?direct:''
}
function productImage(x){
  x=x||{};
  for(const k of ['image','main_image','mainImage','imageUrl','imageURL','thumbnail','thumbnailUrl','primaryImage','picture','pictureUrl']){
    const got=normalizeImageUrl(x[k]);if(got)return got
  }
  const images=x.images||x.all_images||x.allImages;
  if(Array.isArray(images)){for(const v of images){const got=normalizeImageUrl(v);if(got)return got}}
  if(typeof images==='string'){for(const v of images.split(/[;|,\n]/)){const got=normalizeImageUrl(v);if(got)return got}}
  return''
}
function amazonKey(x){return clean(x&&x.asin||'').toUpperCase()}
async function enrichAmazonOne(x){
  const asin=amazonKey(x);if(!asin||productImage(x))return x;
  try{
    const d=await jsonpAction('amazon_match',{
      itemId,
      query:asin,
      asin,
      exactAsin:'1',
      searchMode:'product',
      limit:'5',
      includeImages:'1',includeShipping:'1',includeDetails:'1'
    });
    const pools=[d?.matches,d?.results,d?.items,d?.products].filter(Array.isArray).flat();
    for(const obj of [d?.product,d?.item,d?.detail])if(obj&&typeof obj==='object')pools.push(obj);
    const exact=pools.find(y=>amazonKey(y)===asin);
    return exact?{...x,...exact}:x
  }catch(_){return x}
}
async function enrichAmazonVisible(){
  const selected=new Set([...results.querySelectorAll('input.capitan-amazon-choice:checked')].map(x=>x.value));
  const source=lastMatches.slice(0,20);
  const out=[];
  for(let i=0;i<source.length;i+=4){
    const settled=await Promise.allSettled(source.slice(i,i+4).map(enrichAmazonOne));
    settled.forEach((r,j)=>out.push(r.status==='fulfilled'?r.value:source[i+j]))
  }
  let changed=false;const map=new Map(lastMatches.map(x=>[amazonKey(x),x]));
  out.forEach(x=>{const k=amazonKey(x);if(!k)return;const old=map.get(k);if(old&&JSON.stringify(old)!==JSON.stringify(x)){map.set(k,x);changed=true}});
  if(changed){lastMatches=[...map.values()];render(lastMatches,selected);window.__capitanTestLog?.('Amazon: immagini/dettagli arricchiti','ok')}
}
function queryVariant(title,page){
  const t=clean(title),parts=t.split(' ').filter(Boolean);
  if(page<=0||parts.length<5)return t;
  const mode=page%4;
  if(mode===1)return parts.slice(1).join(' ');
  if(mode===2)return parts.slice(0,-1).join(' ');
  if(mode===3)return parts.filter((_,i)=>i!==Math.min(parts.length-1,2)).join(' ');
  return parts.slice(0,Math.min(parts.length,8)).join(' ')
}
function mergeMatches(list){
  const selected=new Set([...results.querySelectorAll('input.capitan-amazon-choice:checked')].map(x=>x.value));
  const map=new Map(lastMatches.map(x=>[amazonKey(x),x]));
  (Array.isArray(list)?list:[]).filter(amazonEconomicsAllowed).forEach(x=>{const k=amazonKey(x);if(k&&!map.has(k))map.set(k,x)});
  lastMatches=[...map.values()].slice(0,100);
  render(lastMatches,selected)
}
function amazonShippingMeta(x){
  x=x||{};
  const price=Number(x.price);
  const raw=clean(x.shippingLabel||x.shippingText||x.shipping||x.delivery||x.deliveryText||x.shippingInfo||'');
  let cost=Number(x.shippingCost??x.shippingPrice??x.deliveryCost);
  if(!isFinite(cost)||cost<0)cost=null;
  let label='',threshold=null;
  let m=raw.match(/free\s+shipping(?:\s+on\s+orders)?\s+(?:over|above)\s*(?:US\s*)?\$\s*([0-9]+(?:[.,][0-9]{1,2})?)/i);
  if(m){
    threshold=Number(String(m[1]).replace(',','.'));
    label='Free shipping over $ '+threshold.toFixed(2);
    if(isFinite(price)&&price>=threshold)cost=0;
    else if(cost==null||cost===0)cost=1.99;
  }else if(/\bfree\s+shipping\b/i.test(raw)||x.freeShipping===true||Number(cost)===0){
    label='Free shipping';cost=0;
  }else{
    if(cost==null){
      m=raw.match(/(?:US\s*)?\$\s*([0-9]+(?:[.,][0-9]{1,2})?)/i);
      if(m)cost=Number(String(m[1]).replace(',','.'))
    }
    if(cost!=null&&isFinite(cost)&&cost>0)label='$ '+cost.toFixed(2)
  }
  const total=isFinite(price)&&price>0?price+(isFinite(cost)?cost:0):null;
  return {label,cost,total,threshold}
}
function amazonEconomicsAllowed(x){
  const be=calcMaxBreakEvenCostFromSalePrice(currentSalePrice,pricingRates);
  const price=Number(x&&x.price);
  if(be==null||!isFinite(be))return isFinite(price)&&price>0;
  if(!isFinite(price)||price<=0)return false;
  const net=Math.round((be-price)*100)/100;
  if(net>=0)return true;
  const verySimilar=!!(x&&x.verySimilar)||!!(x&&x.strongIdentifierMatch)||Number(x&&x.titleCoverage||0)>=.72||Number(x&&x.aiConfidence||0)>=85;
  return net>=-AMAZON_MAX_NEGATIVE_MARGIN&&verySimilar;
}
function render(list,selectedIds){
  lastMatches=(Array.isArray(list)?list:[]).slice(0,100);results.innerHTML='';
  if(!lastMatches.length){wrap.style.display='none';return}
  wrap.style.display='block';
  const selected=selectedIds instanceof Set?selectedIds:new Set();
  const box=document.createElement('div');box.style.cssText='margin-top:0;display:grid;gap:7px';
  lastMatches.forEach((x,i)=>{
    const price=Number(x.price),ship=amazonShippingMeta(x),url=esc(x.url||('https://www.amazon.com/dp/'+(x.asin||''))),detected=productImage(x);
    const asin=clean(x.asin||'');
    const legacy=asin?'https://images-na.ssl-images-amazon.com/images/P/'+encodeURIComponent(asin)+'.01.LZZZZZZZ.jpg':'';
    const img=detected||legacy;
    const r=document.createElement('label');
    r.dataset.sourcePrice=isFinite(price)?String(price):'';
    r.dataset.shippingCost=isFinite(ship.cost)?String(ship.cost):'';
    r.dataset.totalCost=isFinite(ship.total)?String(ship.total):'';
    r.style.cssText='display:grid;grid-template-columns:24px 76px minmax(0,1fr);gap:9px;align-items:start;padding:9px 10px;border:1px solid #e1e4e8;border-radius:10px;background:#fff;cursor:pointer;font-size:12.5px;line-height:1.28';
    const shipping=ship.label?'<span style="color:#555">'+esc(ship.label)+'</span>':'<span style="color:#999">—</span>';
    const priceText=isFinite(price)?price.toFixed(2)+' '+esc(x.currency||'USD'):'—';
    const checked=selected.has(String(x.asin||''))||(selected.size===0&&i===0);
    const preview=img?'<img src="'+esc(img)+'" data-fallback="'+esc(legacy)+'" alt="Amazon product" loading="lazy" style="width:76px;height:76px;object-fit:contain;border:1px solid #e5e7eb;border-radius:7px;background:#fff" onerror="if(this.dataset.fallback&&this.src!==this.dataset.fallback){const f=this.dataset.fallback;this.dataset.fallback=\'\';this.src=f}else{this.style.display=\'none\';this.nextElementSibling.style.display=\'grid\'}"><div style="display:none;width:76px;height:76px;border:1px solid #e5e7eb;border-radius:7px;place-items:center;color:#999;font-size:10px">No image</div>':'<div style="width:76px;height:76px;border:1px solid #e5e7eb;border-radius:7px;display:grid;place-items:center;color:#999;font-size:10px">No image</div>';
    const brand='<span aria-label="Amazon" style="display:inline-flex;flex-direction:column;align-items:flex-end;justify-content:center;flex:0 0 auto;margin-left:auto;opacity:.84;line-height:1;text-align:right;transform:translateY(-1px)"><span style="font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:600;letter-spacing:-.25px;color:#111;line-height:16px">amazon</span><svg viewBox="0 0 52 8" width="46" height="6" preserveAspectRatio="xMidYMid meet" style="display:block;margin-top:1px"><path d="M2 1.5 C15 7,34 7,47 2" fill="none" stroke="#f59b23" stroke-width="1.6" stroke-linecap="round"/><path d="M43.5 1 L49 1.4 L46.4 5.5" fill="none" stroke="#f59b23" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';
    r.innerHTML='<input type="checkbox" class="capitan-amazon-choice" value="'+esc(x.asin||'')+'" '+(checked?'checked':'')+' style="width:16px;height:16px;margin-top:28px;border-radius:0;accent-color:#111">'+preview+
      '<div style="min-width:0;align-self:start;margin-top:-1px"><div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;min-height:23px;margin:0 0 4px"><a href="'+url+'" target="_blank" rel="noopener" style="color:#111;text-decoration:none;font-weight:600;font-size:12.5px;line-height:20px">'+esc(x.asin||'')+'</a>'+brand+'</div>'+
      '<div style="color:#444;font-size:12.5px;line-height:16px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:32px;margin-bottom:7px" title="'+esc(x.title||'')+'">'+esc(x.title||'')+'</div>'+
      '<div style="display:flex;align-items:flex-end;justify-content:space-between;gap:10px;font-size:12px"><span data-card-shipping>'+shipping+'</span><span data-card-price style="margin-left:auto;white-space:nowrap;font-size:12.5px;font-weight:600;color:#111">'+priceText+'</span></div></div>';
    box.appendChild(r)
  });
  results.appendChild(box);
  window.__capitanTestLog?.('Amazon: '+lastMatches.length+' card visibili','ok')
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

insertBtn.addEventListener('click',async e=>{
  e.preventDefault();e.stopPropagation();
  const title=currentEbayTitle();
  if(!title){status.innerHTML='<span style="color:#b42318;font-weight:700">Titolo eBay non trovato.</span>';return}
  insertBtn.disabled=true;
  const nextPage=matchPage;
  status.textContent='';window.__capitanTestLog?.(nextPage===0?'Best Match Amazon in corso…':'Ricerca di altri Best Match Amazon…','warn');
  try{
    const before=new Set(lastMatches.map(amazonKey));
    const breakEven=calcMaxBreakEvenCostFromSalePrice(currentSalePrice,pricingRates);
    let collected=[],attemptsUsed=0,cursor=0;
    while(cursor<6){
      const batchSize=(cursor===0&&nextPage===0)?1:Math.min(3,6-cursor);
      const pages=Array.from({length:batchSize},(_,i)=>nextPage+cursor+i);
      const settled=await Promise.allSettled(pages.map(page=>jsonpAction('amazon_match',{
        itemId,
        query:queryVariant(title,page),
        page:String(page+1),
        offset:String(page*10),
        limit:'10',
        exclude:[...before].join(','),
        breakEven:breakEven==null?'':String(breakEven),
        maxLoss:String(AMAZON_MAX_NEGATIVE_MARGIN),
        includeImages:'1',includeShipping:'1',includeDetails:'1'
      })));
      cursor+=batchSize;attemptsUsed=cursor;
      settled.forEach(r=>{if(r.status==='fulfilled'&&r.value&&r.value.ok)collected=collected.concat(r.value.matches||[])});
      const uniq=new Map();
      collected.filter(amazonEconomicsAllowed).forEach(x=>{const k=amazonKey(x);if(k&&!before.has(k)&&!uniq.has(k))uniq.set(k,x)});
      if(uniq.size>=10)break
    }
    const freshMap=new Map();
    collected.filter(amazonEconomicsAllowed).forEach(x=>{const k=amazonKey(x);if(k&&!before.has(k)&&!freshMap.has(k))freshMap.set(k,x)});
    mergeMatches([...freshMap.values()].slice(0,10));
    setTimeout(()=>enrichAmazonVisible(),0);
    const added=lastMatches.filter(x=>!before.has(amazonKey(x))).length;
    matchPage=nextPage+Math.max(1,attemptsUsed);
    status.textContent='';
    window.__capitanTestLog?.(added?('Best Match Amazon: +'+added+' · totale '+lastMatches.length):'Best Match Amazon: nessun nuovo prodotto',added?'ok':'warn')
  }catch(err){
    console.error(err);status.textContent='';window.__capitanTestLog?.('Errore Best Match Amazon: '+String(err.message||err),'bad')
  }finally{insertBtn.disabled=false}
});
function currentEbayTitle(){
  for(const l of document.querySelectorAll('label')){
    const t=clean(l.innerText||l.textContent);
    if(!/^(item title|title)$/i.test(t))continue;
    let el=l.htmlFor?document.getElementById(l.htmlFor):l.querySelector('input,textarea');
    if(el&&clean(el.value))return clean(el.value);
    let p=l.parentElement;
    for(let i=0;i<4&&p;i++,p=p.parentElement){
      el=p.querySelector('input,textarea');
      if(el&&clean(el.value))return clean(el.value)
    }
  }
  const candidate=[...document.querySelectorAll('input,textarea')].find(el=>/(^|\b)(title|itemtitle)(\b|$)/i.test(clean([el.name,el.id,el.getAttribute('aria-label'),el.placeholder].join(' ')))&&clean(el.value));
  if(candidate)return clean(candidate.value);
  return clean(window.__capitanSellLikeCloneData?.title||'')
}
findBtn.addEventListener('click',()=>{
  const title=currentEbayTitle();
  if(!title){status.innerHTML='<span style="color:#b42318;font-weight:700">Titolo eBay non trovato.</span>';return}
  const url='https://www.amazon.com/s?k='+encodeURIComponent(title);
  rememberSearch(title,url);
  window.open(url,'_blank','noopener');
  status.textContent='';
  window.__capitanTestLog?.('SERP Amazon aperta per titolo','ok')
});
window.addEventListener('capitan-sale-price-updated',e=>{
  const v=Number(e&&e.detail&&e.detail.value);
  if(isFinite(v)&&v>0){
    currentSalePrice=v;
    recalcBreakEven();
    try{window.dispatchEvent(new CustomEvent('capitan-break-even-updated',{detail:{value:calcMaxBreakEvenCostFromSalePrice(currentSalePrice,pricingRates)}}))}catch(_){}
  }
});
renderSearchHistory();ensureBreakEvenRow();loadPricing();
})();