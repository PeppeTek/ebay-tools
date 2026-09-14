javascript:(()=>{
'use strict';
const PANEL_ID='capitan-sell-like-clone';
const EXT_ID='capitan-aliexpress-match-ext';
const ENDPOINT=String(window.__capitanSellLikeBackendEndpoint||'').replace(/\/+$/,'');
const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const panel=document.getElementById(PANEL_ID);if(!panel||document.getElementById(EXT_ID))return;
panel.style.height='calc(100vh - 24px)';panel.style.maxHeight='calc(100vh - 24px)';panel.style.overflow='hidden';
const sourceText=clean(panel.innerText||'');
const itemId=(sourceText.match(/Source Item ID:\s*(\d{9,12})/i)||[])[1]||'';
if(!itemId)return;

const actions=panel.querySelector('[data-ebay-actions]');
const amazonWrap=panel.querySelector('#capitan-amazon-match-ext');
const wrap=document.createElement('div');
wrap.id=EXT_ID;
wrap.style.cssText='padding:0 14px 8px;background:#fff';
wrap.innerHTML='<div id="capitan-aliexpress-status" style="padding:7px 0 0;font-size:12px"></div><div id="capitan-aliexpress-results"></div>';
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
const results=wrap.querySelector('#capitan-aliexpress-results');
let lastMatches=[];
let accumulatedMatches=[];
let searchBatch=0;

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

function aliLogoSvg(){
  return '<svg viewBox="0 0 92 24" width="58" height="16" aria-label="AliExpress" style="display:block"><defs><linearGradient id="aliG" x1="0" x2="1"><stop offset="0" stop-color="#ff8a00"/><stop offset=".55" stop-color="#ff4747"/><stop offset="1" stop-color="#d71920"/></linearGradient></defs><text x="1" y="17" font-family="Arial,sans-serif" font-size="15" font-weight="700" fill="url(#aliG)">AliExpress</text></svg>'
}
function shippingNumeric(v){
  const t=clean(v||'');
  if(!t||/free\s+shipping/i.test(t))return 0;
  const m=t.match(/(?:USD|US\s*\$|\$)?\s*([0-9]+(?:[.,][0-9]+)?)/i);
  return m?Number(String(m[1]).replace(',','.')):0
}
function cardTotal(x){
  const base=Number(x&&x.price);
  if(!isFinite(base))return null;
  const ship=clean(x&&x.shipping||'');
  if(/free\s+shipping\s+over/i.test(ship))return Math.round((base+1.99)*100)/100;
  const explicit=Number(x&&x.shippingAmount);
  if(isFinite(explicit)&&explicit>0)return Math.round((base+explicit)*100)/100;
  const parsed=shippingNumeric(ship);
  return Math.round((base+(isFinite(parsed)?parsed:0))*100)/100
}
function render(list,append=false){
  const incoming=(Array.isArray(list)?list:[]).filter(x=>{
    return !!clean(x&&x.image||'') && !!clean(x&&x.shipping||'')
  });
  if(!append)accumulatedMatches=[];

  const existingIds=new Set(accumulatedMatches.map(x=>String(x&&x.productId||'')));
  const fresh=[];
  incoming.forEach(x=>{
    const id=String(x&&x.productId||'');
    if(id&&!existingIds.has(id)){existingIds.add(id);fresh.push(x)}
  });

  accumulatedMatches=append?fresh.concat(accumulatedMatches):fresh;
  lastMatches=accumulatedMatches.slice();
  results.innerHTML='';

  if(!lastMatches.length){
    results.innerHTML='<div style="padding:6px 0;color:#a15c00;font-size:12px;font-weight:700">Nessun risultato AliExpress completo trovato.</div>';
    return
  }

  results.style.cssText='max-height:420px;overflow-y:auto;overflow-x:hidden;margin-top:6px;padding-right:2px';
  const box=document.createElement('div');
  box.style.cssText='border:1px solid #ddd;border-radius:8px;overflow:hidden;background:#fff';

  lastMatches.forEach((x,i)=>{
    const r=document.createElement('label');
    r.style.cssText='position:relative;display:grid;grid-template-columns:24px 72px minmax(0,1fr);gap:8px;align-items:center;padding:7px 8px;border-bottom:'+(i===lastMatches.length-1?'0':'1px solid #eee')+';cursor:pointer;font-size:12px;min-height:82px';

    const total=cardTotal(x);
    const totalText=total==null?'—':Number(total).toFixed(2)+' '+esc(x.currency||'USD');
    const url=esc(x.url||('https://www.aliexpress.us/item/'+(x.productId||'')+'.html'));
    const image=clean(x.image||'');
    const img='<img src="'+esc(image)+'" referrerpolicy="no-referrer" alt="AliExpress" style="width:72px;height:72px;object-fit:contain;border:1px solid #ddd;border-radius:7px;background:#fff">';

    const title=clean(x.title||'');
    const shortTitle=title.length>72?title.slice(0,69)+'…':title;
    const sold=clean(x.orders||'');
    const deliveryRaw=clean(x.delivery||'');
    const delivery=deliveryRaw&&!/\b(?:gg|giorn|day|days)\b/i.test(deliveryRaw)?deliveryRaw+' gg':deliveryRaw;
    const shipping=clean(x.shipping||'');
    const stock=clean(x.stock||'');

    const line3=[];
    if(sold)line3.push('Venduti: '+esc(sold));
    if(delivery)line3.push('Consegna: '+esc(delivery));
    const line4='Spedizione: '+esc(shipping)+(stock?' · Stock: '+esc(stock):'');

    const info='<div style="min-width:0;line-height:1.12;padding-right:68px">'+
      '<a href="'+url+'" target="_blank" rel="noopener" style="display:block;color:#111;text-decoration:none;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(shortTitle||x.productId||'')+'</a>'+
      '<div style="margin-top:2px;color:#666;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(x.productId||'')+'</div>'+
      (line3.length?'<div style="margin-top:2px;color:#444;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+line3.join(' · ')+'</div>':'')+
      '<div style="margin-top:2px;color:#444;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-right:68px">'+line4+'</div>'+
      '</div>';

    r.innerHTML='<input type="checkbox" class="capitan-aliexpress-choice" value="'+esc(x.productId||'')+'" '+(i===0?'checked':'')+' style="width:16px;height:16px;border-radius:0;accent-color:#ff4747">'+img+info+
      '<span style="position:absolute;top:6px;right:7px;opacity:.95">'+aliLogoSvg()+'</span>'+
      '<span title="Totale prodotto + spedizione" style="position:absolute;right:8px;bottom:7px;white-space:nowrap;font-weight:700">'+totalText+'</span>';

    box.appendChild(r)
  });

  results.appendChild(box);
  if(append)results.scrollTop=0
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
findBtn.addEventListener('click',async()=>{
  findBtn.disabled=true;
  status.textContent=searchBatch===0?'Ricerca AliExpress tramite main image eBay…':'Cerco altri risultati AliExpress tramite la stessa immagine…';
  try{
    const excludeIds=accumulatedMatches.map(x=>String(x&&x.productId||'')).filter(Boolean).join(',');
    const data=await jsonp({batch:String(searchBatch),excludeIds});
    if(!data||!data.ok)throw Error(data?.error||'Risposta AliExpress non valida');

    const before=accumulatedMatches.length;
    render(data.matches||[],searchBatch>0);
    const added=accumulatedMatches.length-before;

    if(data.searchMode==='IMAGE'||data.searchMode==='IMAGE_PLUS_TITLE'){
      status.innerHTML='<span style="color:#137333;font-weight:700">'+(data.searchMode==='IMAGE_PLUS_TITLE'?'Ricerca immagine + titolo completata.':'Ricerca per immagine completata.')+'</span> '+
        (searchBatch>0?(added?('Aggiunti '+added+' nuovi risultati in cima.'):'Nessun nuovo risultato in questa ricerca.'):'Risultati ottenuti dalla main image eBay.');
    }else{
      const reason=clean(data.imageSearchError||'errore non specificato');
      status.innerHTML='<span style="color:#a15c00;font-weight:700">Image search non disponibile.</span> '+esc(reason)+'<br><span style="color:#555">Fallback per titolo EBAY_IMPORT visualizzato sotto.</span>';
      if(data.imageSearchError)status.title=data.imageSearchError
    }
    searchBatch++;
  }catch(e){
    console.error(e);
    status.innerHTML='<span style="color:#b42318;font-weight:700">Errore AliExpress:</span> '+esc(e.message||e)
  }finally{
    findBtn.disabled=false
  }
});
})();