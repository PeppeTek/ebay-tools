javascript:(()=>{
'use strict';
const PANEL_ID='capitan-sell-like-clone';
const EXT_ID='capitan-aliexpress-match-ext';
const ENDPOINT=String(window.__capitanSellLikeBackendEndpoint||'').replace(/\/+$/,'');
const SEARCH_HISTORY_KEY='capitan-sell-like-aliexpress-search-history-v1';
const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const panel=document.getElementById(PANEL_ID);if(!panel||document.getElementById(EXT_ID))return;
const sourceText=clean(panel.innerText||'');
const itemId=(sourceText.match(/Source Item ID:\s*(\d{9,12})/i)||[])[1]||'';
if(!itemId)return;

const actions=panel.querySelector('[data-ebay-actions]');
const amazonWrap=panel.querySelector('#capitan-amazon-match-ext');
const wrap=document.createElement('div');
wrap.id=EXT_ID;
wrap.style.cssText='padding:0 14px 8px;background:#fff';
wrap.innerHTML='<div id="capitan-aliexpress-status" style="padding:7px 0 0;font-size:12px"></div><div id="capitan-aliexpress-history"></div><div id="capitan-aliexpress-results"></div>';
if(actions){
  if(amazonWrap&&amazonWrap.parentNode===actions.parentNode)amazonWrap.parentNode.insertBefore(wrap,amazonWrap);
  else panel.insertBefore(wrap,actions);
}else (panel.querySelector('.b')||panel).appendChild(wrap);

let findBtn=null,insertBtn=null;
if(actions){
  let slot=actions.querySelector('[data-aliexpress-actions-slot]');
  if(!slot){
    slot=document.createElement('div');
    slot.setAttribute('data-aliexpress-actions-slot','1');
    slot.style.cssText='display:grid;grid-template-columns:1fr 1fr;gap:4px';
    const amazonSlot=actions.querySelector('[data-amazon-actions-slot]');
    if(amazonSlot)actions.insertBefore(slot,amazonSlot);else actions.insertBefore(slot,actions.firstChild);
  }

  findBtn=document.createElement('button');
  findBtn.id='capitan-aliexpress-find';
  findBtn.textContent='Trova su AliExpress';
  findBtn.style.cssText='height:42px;border:1px solid #b52a00;border-radius:22px 0 0 22px;background:#ff4747;color:#fff;font-size:14px;cursor:pointer;width:100%';

  insertBtn=document.createElement('button');
  insertBtn.id='capitan-aliexpress-insert';
  insertBtn.textContent='Inserisci Product ID';
  insertBtn.style.cssText='height:42px;border:1px solid #b52a00;border-radius:0 22px 22px 0;background:#fff;color:#ff4747;font-size:14px;cursor:pointer;width:100%';

  slot.appendChild(findBtn);
  slot.appendChild(insertBtn);
}else{
  findBtn=document.createElement('button');
  findBtn.id='capitan-aliexpress-find';
  findBtn.textContent='Trova su AliExpress';
  findBtn.style.cssText='width:100%;height:42px;border:1px solid #b52a00;border-radius:22px;background:#ff4747;color:#fff;font-size:14px;cursor:pointer;margin-top:8px';

  insertBtn=document.createElement('button');
  insertBtn.id='capitan-aliexpress-insert';
  insertBtn.textContent='Inserisci Product ID';
  insertBtn.style.cssText='width:100%;height:42px;border:1px solid #b52a00;border-radius:22px;background:#fff;color:#ff4747;font-size:14px;cursor:pointer;margin-top:8px';

  wrap.insertBefore(insertBtn,wrap.firstChild);
  wrap.insertBefore(findBtn,insertBtn);
}

const status=wrap.querySelector('#capitan-aliexpress-status');
const historyBox=wrap.querySelector('#capitan-aliexpress-history');
const results=wrap.querySelector('#capitan-aliexpress-results');
let lastMatches=[];

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
  }catch(e){console.warn('AliExpress shipping history',e)}
}
function renderSearchHistory(list){
  const a=Array.isArray(list)?list:readSearchHistory();
  historyBox.innerHTML='';
  if(!a.length)return;
  const box=document.createElement('div');box.style.cssText='margin-top:7px;border:1px solid #e2e2e2;border-radius:8px;overflow:hidden;background:#fff';
  const head=document.createElement('div');head.style.cssText='padding:6px 9px;background:#fafafa;border-bottom:1px solid #eee;font-size:11px;font-weight:700;color:#555';head.textContent='Ultime ricerche AliExpress';box.appendChild(head);
  a.forEach((x,i)=>{
    const row=document.createElement('a');row.href=x.url||'#';row.target='_blank';row.rel='noopener';row.style.cssText='display:block;padding:7px 9px;border-bottom:'+(i===a.length-1?'0':'1px solid #eee')+';color:#111;text-decoration:none;font-size:11px;line-height:1.3';
    const ship=clean(x.shipping||'');
    row.innerHTML='<b>'+esc(x.itemId||'')+'</b>'+(x.itemId?' · ':'')+esc(x.title||'')+(ship?'<div style="margin-top:3px;color:#555"><b>Spedizione:</b> '+esc(ship)+'</div>':'');
    box.appendChild(row);
    if(!ship&&x.itemId&&typeof window.__capitanReadSourceShippingLabel==='function')resolveSearchShipping(x.itemId,x.title||'',x.url||'')
  });
  historyBox.appendChild(box)
}
function jsonp(params){
  return new Promise((resolve,reject)=>{
    const cb='__capitanAliCb_'+Date.now()+'_'+Math.floor(Math.random()*1e6);
    const s=document.createElement('script');
    const t=setTimeout(()=>done(Error('Timeout backend AliExpress')),90000);
    function done(err,val){
      clearTimeout(t);
      try{delete window[cb]}catch(_){window[cb]=undefined}
      s.remove();
      err?reject(err):resolve(val)
    }
    window[cb]=v=>done(null,v);
    s.onerror=()=>done(Error('Backend AliExpress non raggiungibile'));
    const q=new URLSearchParams({
      action:'amazon_match',
      provider:'aliexpress',
      itemId,
      callback:cb,
      _:Date.now().toString(),
      ...(params||{})
    });
    s.src=ENDPOINT+'?'+q.toString();
    document.head.appendChild(s)
  })
}

function selectedRows(){
  return [...results.querySelectorAll('input.capitan-aliexpress-choice:checked')]
    .map(el=>lastMatches.find(x=>x.productId===el.value))
    .filter(Boolean)
}
function selectedProductIds(){return selectedRows().map(x=>x.productId).filter(Boolean)}

function aliShippingMeta(x){
  x=x||{};
  const price=Number(x.price);
  const raw=clean(x.shippingLabel||x.shippingText||x.shipping||x.delivery||x.deliveryText||x.shippingInfo||'');
  let cost=Number(x.shippingCost??x.shippingPrice??x.deliveryCost);
  if(!isFinite(cost)||cost<0)cost=null;
  let label='',threshold=null,m=raw.match(/free\s+shipping(?:\s+on\s+orders)?\s+(?:over|above)\s*(?:US\s*)?\$\s*([0-9]+(?:[.,][0-9]{1,2})?)/i);
  if(m){
    threshold=Number(String(m[1]).replace(',','.'));
    label='Free shipping over $ '+threshold.toFixed(2);
    if(cost==null)cost=isFinite(price)&&price>=threshold?0:1.99;
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

function render(list,sourceImage){
  lastMatches=(Array.isArray(list)?list:[]).slice(0,10);
  results.innerHTML='';
  if(!lastMatches.length){
    results.innerHTML='<div style="padding:6px 0;color:#a15c00;font-size:12px;font-weight:700">Nessun match AliExpress trovato.</div>';
    return
  }
  const source=clean(sourceImage||window.__capitanSellLikeCloneData?.images?.[0]||window.__capitanSellLikeCloneData?.mainImage||'');
  const box=document.createElement('div');
  box.style.cssText='margin-top:8px;display:grid;gap:7px';
  lastMatches.forEach((x,i)=>{
    const price=Number(x.price),ship=aliShippingMeta(x);
    const r=document.createElement('label');
    r.dataset.sourcePrice=isFinite(price)?String(price):'';
    r.dataset.shippingCost=isFinite(ship.cost)?String(ship.cost):'';
    r.dataset.totalCost=isFinite(ship.total)?String(ship.total):'';
    r.style.cssText='display:grid;grid-template-columns:24px 58px 16px 58px 1fr;gap:7px;align-items:center;padding:8px 9px;border:1px solid #e1e4e8;border-radius:10px;background:#fff;cursor:pointer;font-size:11px';
    const url=esc(x.url||('https://www.aliexpress.us/item/'+(x.productId||'')+'.html'));
    const aliImage=clean(x.image||x.imageUrl||x.mainImage||'');
    const sourceImg=source?'<img src="'+esc(source)+'" alt="eBay" style="width:58px;height:58px;object-fit:contain;border:1px solid #eee;border-radius:7px;background:#fff">':'<div style="width:58px;height:58px;border:1px solid #eee;border-radius:7px;display:grid;place-items:center;color:#aaa">—</div>';
    const aliImg=aliImage?'<img src="'+esc(aliImage)+'" alt="AliExpress" style="width:58px;height:58px;object-fit:contain;border:1px solid #eee;border-radius:7px;background:#fff">':'<div style="width:58px;height:58px;border:1px solid #eee;border-radius:7px;display:grid;place-items:center;color:#aaa">—</div>';
    const shipping=ship.label?'<span style="color:#555">'+esc(ship.label)+'</span>':'<span style="color:#999">lettura shipping…</span>';
    const priceText=isFinite(price)?price.toFixed(2)+' '+esc(x.currency||'USD'):'—';
    r.innerHTML='<input type="checkbox" class="capitan-aliexpress-choice" value="'+esc(x.productId||'')+'" '+(i===0?'checked':'')+' style="width:16px;height:16px;border-radius:0;accent-color:#ff4747">'+sourceImg+
      '<span style="text-align:center;color:#aaa">→</span>'+aliImg+
      '<div style="min-width:0"><div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:4px"><span style="font-weight:800;color:#ff4747;opacity:.70">AliExpress</span><a href="'+url+'" target="_blank" rel="noopener" style="color:#111;text-decoration:none;font-weight:700">'+esc(x.productId||'')+'</a></div>'+
      '<div style="color:#555;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:7px" title="'+esc(x.title||'')+'">'+esc(x.title||'')+'</div>'+
      '<div style="display:flex;align-items:flex-end;justify-content:space-between;gap:10px"><span data-card-shipping>'+shipping+'</span><span data-card-price style="margin-left:auto;white-space:nowrap;font-weight:700;color:#111">'+priceText+'</span></div></div>';
    box.appendChild(r)
  });
  results.appendChild(box);
  window.__capitanTestLog?.('AliExpress: '+lastMatches.length+' card caricate','ok')
}
function findSkuField(){
  const re=/^\*?\s*custom\s+label\s*\(sku\)\s*$/i;
  for(const l of document.querySelectorAll('label')){
    const t=clean(l.innerText||l.textContent);
    if(!re.test(t))continue;
    let el=l.htmlFor?document.getElementById(l.htmlFor):l.querySelector('input,textarea');
    if(el)return el;
    let p=l.parentElement;
    for(let i=0;i<5&&p;i++,p=p.parentElement){
      el=p.querySelector('input,textarea');
      if(el)return el
    }
  }
  return [...document.querySelectorAll('input,textarea')].find(el=>re.test(clean([el.name,el.id,el.getAttribute('aria-label'),el.placeholder].join(' '))))||null
}
function setNativeValue(el,value){
  if(!el)return false;
  const proto=el instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
  const setter=Object.getOwnPropertyDescriptor(proto,'value')?.set;
  const old=el.value;
  if(setter)setter.call(el,String(value));else el.value=String(value);
  if(el._valueTracker&&typeof el._valueTracker.setValue==='function')el._valueTracker.setValue(old);
  el.dispatchEvent(new Event('input',{bubbles:true}));
  el.dispatchEvent(new Event('change',{bubbles:true}));
  el.blur?.();
  return true
}

insertBtn.addEventListener('click',()=>{
  const ids=selectedProductIds();
  if(!ids.length){
    status.innerHTML='<span style="color:#b42318;font-weight:700">Seleziona almeno un Product ID.</span>';
    return
  }
  const field=findSkuField();
  if(!field){
    status.innerHTML='<span style="color:#b42318;font-weight:700">Campo Custom label (SKU) non trovato.</span>';
    return
  }
  const value=ids.join(' - ');
  if(setNativeValue(field,value)){
    status.innerHTML='<span style="color:#137333;font-weight:700">Product ID inseriti:</span> '+esc(value)
  }
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
renderSearchHistory();
findBtn.addEventListener('click',async()=>{
  const title=currentEbayTitle();
  if(!title){status.innerHTML='<span style="color:#b42318;font-weight:700">Titolo eBay non trovato.</span>';return}
  const slug=title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,120);
  const url='https://www.aliexpress.us/w/wholesale-'+encodeURIComponent(slug)+'.html?SearchText='+encodeURIComponent(title);
  rememberSearch(title,url);
  window.open(url,'_blank','noopener');
  status.innerHTML='<span style="color:#137333;font-weight:700">Ricerca AliExpress aperta.</span> Titolo eBay inviato direttamente alla SERP.';
  window.__capitanTestLog?.('Ricerca AliExpress per titolo: '+title,'ok');
  findBtn.disabled=true;results.innerHTML='<div style="padding:6px 0;color:#666;font-size:11px">Caricamento card AliExpress…</div>';
  try{
    const data=await jsonp({query:title});
    if(data&&data.ok)render(data.matches||[],data.sourceImage||'');
    else results.innerHTML=''
  }catch(e){console.warn('AliExpress card enrichment',e);results.innerHTML='';window.__capitanTestLog?.('Card AliExpress non disponibili: '+String(e.message||e),'warn')}
  finally{findBtn.disabled=false}
});
})();