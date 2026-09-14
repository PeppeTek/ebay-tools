javascript:(()=>{
'use strict';
const PANEL_ID='capitan-sell-like-clone';
const EXT_ID='capitan-aliexpress-match-ext';
const ENDPOINT=String(window.__capitanSellLikeBackendEndpoint||'').replace(/\/+$/,'');
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

function render(list,sourceImage){
  lastMatches=(Array.isArray(list)?list:[]).slice(0,10);
  results.innerHTML='';
  if(!lastMatches.length){
    results.innerHTML='<div style="padding:6px 0;color:#a15c00;font-size:12px;font-weight:700">Nessun match AliExpress trovato.</div>';
    return
  }

  const source=clean(sourceImage||window.__capitanSellLikeCloneData?.images?.[0]||window.__capitanSellLikeCloneData?.mainImage||'');
  const box=document.createElement('div');
  box.style.cssText='margin-top:8px;border:1px solid #ddd;border-radius:8px;overflow:hidden';

  lastMatches.forEach((x,i)=>{
    const r=document.createElement('label');
    r.style.cssText='display:grid;grid-template-columns:24px 72px 18px 72px 1fr auto;gap:8px;align-items:center;padding:8px 9px;border-bottom:'+(i===lastMatches.length-1?'0':'1px solid #eee')+';cursor:pointer;font-size:12px';
    const price=x.price==null||x.price===''?'—':Number(x.price).toFixed(2)+' '+esc(x.currency||'USD');
    const url=esc(x.url||('https://www.aliexpress.us/item/'+(x.productId||'')+'.html'));
    const aliImage=clean(x.image||'');
    const sourceImg=source?'<img src="'+esc(source)+'" alt="eBay" style="width:72px;height:72px;object-fit:contain;border:1px solid #ddd;border-radius:7px;background:#fff">':'<div style="width:72px;height:72px;border:1px solid #ddd;border-radius:7px;display:grid;place-items:center;color:#999">—</div>';
    const aliImg=aliImage?'<img src="'+esc(aliImage)+'" alt="AliExpress" style="width:72px;height:72px;object-fit:contain;border:1px solid #ddd;border-radius:7px;background:#fff">':'<div style="width:72px;height:72px;border:1px solid #ddd;border-radius:7px;display:grid;place-items:center;color:#999">—</div>';
    r.innerHTML='<input type="checkbox" class="capitan-aliexpress-choice" value="'+esc(x.productId||'')+'" '+(i===0?'checked':'')+' style="width:16px;height:16px;border-radius:0;accent-color:#ff4747">'+sourceImg+'<span style="text-align:center;color:#999">→</span>'+aliImg+'<a href="'+url+'" target="_blank" rel="noopener" style="color:#111;text-decoration:none"><b>'+esc(x.productId||'')+'</b></a><span style="white-space:nowrap">'+price+'</span>';
    box.appendChild(r)
  });
  results.appendChild(box)
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

findBtn.addEventListener('click',async()=>{
  findBtn.disabled=true;
  status.textContent='Ricerca AliExpress in corso…';
  results.innerHTML='';
  try{
    const data=await jsonp();
    if(!data||!data.ok)throw Error(data?.error||'Risposta AliExpress non valida');
    render(data.matches||[],data.sourceImage||'');
    status.innerHTML=lastMatches.length
      ?'<span style="color:#137333;font-weight:700">Match AliExpress completato.</span> Risultati ordinati con la logica EBAY_IMPORT.'
      :'<span style="color:#a15c00;font-weight:700">Ricerca completata.</span> Nessun match AliExpress trovato.'
  }catch(e){
    console.error(e);
    status.innerHTML='<span style="color:#b42318;font-weight:700">Errore AliExpress:</span> '+esc(e.message||e)
  }finally{
    findBtn.disabled=false
  }
});
})();