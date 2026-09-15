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
wrap.style.cssText='display:none;padding:0 14px 0;background:#fff';
wrap.innerHTML='<div id="capitan-aliexpress-status" style="display:none"></div><div id="capitan-aliexpress-results"></div>';
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
  insertBtn.id='capitan-aliexpress-best-match';
  insertBtn.textContent='Best Match AliExpress';
  insertBtn.style.cssText='height:42px;border:1px solid #b52a00;border-radius:0 22px 22px 0;background:#fff;color:#ff4747;font-size:14px;cursor:pointer;width:100%';

  slot.appendChild(findBtn);
  slot.appendChild(insertBtn);
}else{
  findBtn=document.createElement('button');
  findBtn.id='capitan-aliexpress-find';
  findBtn.textContent='Trova su AliExpress';
  findBtn.style.cssText='width:100%;height:42px;border:1px solid #b52a00;border-radius:22px;background:#ff4747;color:#fff;font-size:14px;cursor:pointer;margin-top:8px';

  insertBtn=document.createElement('button');
  insertBtn.id='capitan-aliexpress-best-match';
  insertBtn.textContent='Best Match AliExpress';
  insertBtn.style.cssText='width:100%;height:42px;border:1px solid #b52a00;border-radius:22px;background:#fff;color:#ff4747;font-size:14px;cursor:pointer;margin-top:8px';

  wrap.insertBefore(insertBtn,wrap.firstChild);
  wrap.insertBefore(findBtn,insertBtn);
}

const status=wrap.querySelector('#capitan-aliexpress-status');
const historyBox=null;
const results=wrap.querySelector('#capitan-aliexpress-results');
let lastMatches=[],matchPage=0;

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
  if(!historyBox)return;
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
    .map(el=>lastMatches.find(x=>aliKey(x)===el.value))
    .filter(Boolean)
}
function selectedProductIds(){return selectedRows().map(x=>aliKey(x)).filter(Boolean)}

function parseMaybeJson(v){
  if(!v)return null;if(typeof v==='object')return v;
  const s=String(v).trim();if(!s||!(/^[\[{]/.test(s)))return null;
  try{return JSON.parse(s)}catch(_){try{return JSON.parse(s.replace(/""/g,'"'))}catch(__){return null}}
}
function cleanImage(v){
  let s=clean(v||'');if(!s)return'';
  s=s.replace(/\\u002F/gi,'/').replace(/\\\//g,'/').replace(/&amp;/g,'&');
  if(/^\/\//.test(s))s='https:'+s;
  return /^https?:\/\//i.test(s)?s:''
}
function productImage(x){
  x=x||{};
  // Historical working path first, then exact ALI_RESULTS / ALI_IMPORT fields.
  for(const k of ['image','main_image','sku_image','mainImage','skuImage','imageUrl','imageURL','thumbnail','thumbnailUrl']){
    const direct=cleanImage(x[k]);if(direct)return direct
  }
  const raw=parseMaybeJson(x.product_raw||x.productRaw||x.rawProduct||x.raw);
  const skuList=raw?.ae_item_sku_info_dtos?.ae_item_sku_info_d_t_o||raw?.aeItemSkuInfoDtos?.aeItemSkuInfoDto||[];
  const arr=Array.isArray(skuList)?skuList:[skuList].filter(Boolean);
  const wanted=clean(x.skuId||x.sku_id||'');
  const ordered=wanted?[...arr.filter(s=>clean(s?.sku_id||s?.skuId)===wanted),...arr.filter(s=>clean(s?.sku_id||s?.skuId)!==wanted)]:arr;
  for(const sku of ordered){
    const props=sku?.ae_sku_property_dtos?.ae_sku_property_d_t_o||sku?.aeSkuPropertyDtos?.aeSkuPropertyDto||[];
    for(const p of (Array.isArray(props)?props:[props])){const u=cleanImage(p?.sku_image||p?.skuImage);if(u)return u}
  }
  const multimedia=raw?.ae_multimedia_info_dto||raw?.aeMultimediaInfoDto||{};
  const rawImages=multimedia?.image_urls||multimedia?.imageUrls||'';
  if(typeof rawImages==='string'){for(const v of rawImages.split(/[;|,\n]/)){const u=cleanImage(v);if(u)return u}}
  const images=x.images||x.all_images||x.allImages;
  if(Array.isArray(images)){for(const v of images){const u=cleanImage(v);if(u)return u}}
  if(typeof images==='string'){for(const v of images.split(/[;|,\n]/)){const u=cleanImage(v);if(u)return u}}
  return''
}
function aliKey(x){return clean(x&&x.productId||x?.product_id||'')}
function num(v){
  if(v==null||v==='')return NaN;
  if(typeof v==='number')return v;
  const s=String(v).trim().replace(/\s/g,'').replace(/[^0-9,.\-]/g,'');
  if(!s)return NaN;
  let normalized=s;
  if(s.includes(',')&&!s.includes('.'))normalized=s.replace(',','.');
  else if(s.includes(',')&&s.includes('.'))normalized=s.lastIndexOf(',')>s.lastIndexOf('.')?s.replace(/\./g,'').replace(',','.'):s.replace(/,/g,'');
  const n=Number(normalized);return isFinite(n)?n:NaN
}
function productRaw(x){return parseMaybeJson(x?.product_raw||x?.productRaw||x?.rawProduct||x?.raw)||{}}
function freightRaw(x){return parseMaybeJson(x?.freight_raw||x?.freightRaw||x?.shippingRaw||x?.freight)||{}}
function skuRows(x){
  const raw=productRaw(x);
  const v=raw?.ae_item_sku_info_dtos?.ae_item_sku_info_d_t_o||raw?.aeItemSkuInfoDtos?.aeItemSkuInfoDto||[];
  return Array.isArray(v)?v:[v].filter(Boolean)
}
function aliProductPrice(x){
  x=x||{};
  for(const k of ['sale_price','salePrice','offer_sale_price','offerSalePrice','discountedPrice','discountPrice','currentPrice']){
    const n=num(x[k]);if(isFinite(n)&&n>0)return n
  }
  const wanted=clean(x.skuId||x.sku_id||'');
  const rows=skuRows(x);
  const ordered=wanted?[...rows.filter(s=>clean(s?.sku_id||s?.skuId)===wanted),...rows.filter(s=>clean(s?.sku_id||s?.skuId)!==wanted)]:rows;
  for(const s of ordered){
    for(const k of ['offer_sale_price','offerSalePrice','offer_bulk_sale_price']){
      const n=num(s?.[k]);if(isFinite(n)&&n>0)return n
    }
  }
  for(const k of ['price','sku_price','skuPrice','minPrice']){const n=num(x[k]);if(isFinite(n)&&n>0)return n}
  return NaN
}
function freightOptions(x){
  const raw=freightRaw(x);
  let v=raw?.delivery_option_d_t_o||raw?.deliveryOptionDto||raw?.delivery_options||raw?.deliveryOptions||[];
  if(v&&v.delivery_option_d_t_o)v=v.delivery_option_d_t_o;
  return Array.isArray(v)?v:[v].filter(Boolean)
}
function aliFreight(x,price){
  x=x||{};price=Number(price);
  let cost=num(x.shipping_cost??x.shippingCost??x.shipping_fee_cent??x.shippingFee);
  let min=num(x.delivery_days_min??x.deliveryDaysMin??x.minDeliveryDays);
  let max=num(x.delivery_days_max??x.deliveryDaysMax??x.maxDeliveryDays);
  let threshold=num(x.free_shipping_threshold??x.freeShippingThreshold);
  let free=x.free_shipping??x.freeShipping;
  let option=null;
  const options=freightOptions(x);
  if(options.length){
    option=options.find(o=>{
      const fee=num(o?.shipping_fee_cent??o?.shippingFeeCent??o?.shipping_fee);
      return isFinite(fee)
    })||options[0];
    const fee=num(option?.shipping_fee_cent??option?.shippingFeeCent??option?.shipping_fee);
    if(isFinite(fee))cost=fee;
    const omin=num(option?.min_delivery_days??option?.minDeliveryDays);
    const omax=num(option?.max_delivery_days??option?.maxDeliveryDays);
    if(isFinite(omin)&&omin>0)min=omin;if(isFinite(omax)&&omax>0)max=omax;
    const oth=num(option?.free_shipping_threshold??option?.freeShippingThreshold);
    if(isFinite(oth)&&oth>0)threshold=oth;
    if(option?.free_shipping!=null)free=option.free_shipping;
    if(option?.freeShipping!=null)free=option.freeShipping
  }
  const rawText=clean([x.shippingLabel,x.shippingText,x.shipping,x.deliveryText,option&&JSON.stringify(option)].filter(Boolean).join(' | '));
  if(!(isFinite(threshold)&&threshold>0)){
    const m=rawText.match(/free\s+shipping(?:\s+on\s+orders)?\s+(?:over|above)\s*(?:US\s*)?\$\s*([0-9]+(?:[.,][0-9]{1,2})?)/i);
    if(m)threshold=num(m[1])
  }
  const freeBool=free===true||String(free).toLowerCase()==='true'||String(free).toUpperCase()==='YES';
  let label='';
  if(isFinite(threshold)&&threshold>0){
    if(isFinite(price)&&price>=threshold){cost=0;label='Free Shipping'}
    else{if(!(isFinite(cost)&&cost>0))cost=1.99;label='Shipping fee: $'+cost.toFixed(2)}
  }else if(isFinite(cost)&&cost>0){
    label='Shipping fee: $'+cost.toFixed(2)
  }else if((isFinite(cost)&&cost===0)||freeBool){
    cost=0;label='Free Shipping'
  }else{
    cost=null;label=''
  }
  const delivery=(isFinite(min)&&min>0&&isFinite(max)&&max>0)?(Math.round(min)===Math.round(max)?Math.round(min)+'gg':Math.round(min)+'-'+Math.round(max)+'gg'):(isFinite(max)&&max>0?Math.round(max)+'gg':(isFinite(min)&&min>0?Math.round(min)+'gg':''));
  const total=isFinite(price)&&price>0?price+(isFinite(cost)?cost:0):null;
  return {cost,total,threshold,label,delivery}
}
function aliHasRichData(x){
  const price=aliProductPrice(x),freight=aliFreight(x,price);
  return !!productImage(x)&&isFinite(price)&&price>0&&(isFinite(freight.cost)||!!freight.label)&&!!freight.delivery
}
async function enrichAliOne(x){
  const pid=aliKey(x);if(!pid||aliHasRichData(x))return x;
  try{
    const d=await jsonp({
      itemId:'',
      productId:pid,
      product_id:pid,
      query:pid,
      searchMode:'product',
      exactProduct:'1',
      limit:'5',
      includeImages:'1',includeShipping:'1',includeDelivery:'1',includeDetails:'1',
      includeFreightRaw:'1',includeProductRaw:'1',shipTo:'US',currency:'USD'
    });
    const pools=[d?.matches,d?.results,d?.items,d?.products].filter(Array.isArray).flat();
    for(const obj of [d?.product,d?.item,d?.detail])if(obj&&typeof obj==='object')pools.push(obj);
    const exact=pools.find(y=>aliKey(y)===pid);
    return exact?{...x,...exact}:x
  }catch(_){return x}
}
async function enrichAliVisible(){
  const selected=new Set([...results.querySelectorAll('input.capitan-aliexpress-choice:checked')].map(x=>x.value));
  const source=lastMatches.slice(0,20);
  const out=[];
  for(let i=0;i<source.length;i+=4){
    const settled=await Promise.allSettled(source.slice(i,i+4).map(enrichAliOne));
    settled.forEach((r,j)=>out.push(r.status==='fulfilled'?r.value:source[i+j]))
  }
  let changed=false;
  const map=new Map(lastMatches.map(x=>[aliKey(x),x]));
  out.forEach(x=>{const k=aliKey(x);if(!k)return;const old=map.get(k);if(old&&JSON.stringify(old)!==JSON.stringify(x)){map.set(k,x);changed=true}});
  if(changed){lastMatches=[...map.values()];render(lastMatches,selected);window.__capitanTestLog?.('AliExpress: dettagli prodotto arricchiti','ok')}
}
function queryVariant(title,page){
  const t=clean(title),parts=t.split(' ').filter(Boolean);
  if(!parts.length)return t;
  const useful=parts.filter(w=>!/^(the|a|an|for|with|and|or|of|to|in|on|new|set|pack)$/i.test(w));
  const variants=[
    t,
    parts.slice(1).join(' '),
    parts.slice(0,-1).join(' '),
    parts.slice(0,Math.min(parts.length,8)).join(' '),
    parts.slice(Math.max(0,parts.length-8)).join(' '),
    useful.join(' '),
    useful.slice(0,Math.min(useful.length,6)).join(' '),
    useful.slice(Math.max(0,useful.length-6)).join(' '),
    parts.filter((_,i)=>i%2===0).join(' '),
    parts.filter((_,i)=>i%2===1).join(' ')
  ].map(clean).filter(Boolean);
  return variants[Math.abs(Number(page)||0)%variants.length]||t
}
function mergeMatches(list){
  const selected=new Set([...results.querySelectorAll('input.capitan-aliexpress-choice:checked')].map(x=>x.value));
  const map=new Map(lastMatches.map(x=>[aliKey(x),x]));
  (Array.isArray(list)?list:[]).forEach(x=>{const k=aliKey(x);if(k&&!map.has(k))map.set(k,x)});
  lastMatches=[...map.values()].slice(0,100);
  render(lastMatches,selected)
}
function render(list,selectedIds){
  lastMatches=(Array.isArray(list)?list:[]).slice(0,100);
  results.innerHTML='';
  if(!lastMatches.length){wrap.style.display='none';return}
  wrap.style.display='block';
  const selected=selectedIds instanceof Set?selectedIds:new Set();
  const box=document.createElement('div');
  box.style.cssText='margin-top:0;display:grid;gap:7px';
  lastMatches.forEach((x,i)=>{
    const pid=aliKey(x),price=aliProductPrice(x),freight=aliFreight(x,price);
    const r=document.createElement('label');
    r.dataset.sourcePrice=isFinite(price)?String(price):'';
    r.dataset.shippingCost=isFinite(freight.cost)?String(freight.cost):'';
    r.dataset.totalCost=isFinite(freight.total)?String(freight.total):'';
    r.style.cssText='display:grid;grid-template-columns:24px 76px minmax(0,1fr);gap:9px;align-items:start;padding:9px 10px;border:1px solid #e1e4e8;border-radius:10px;background:#fff;cursor:pointer;font-size:12.5px;line-height:1.28';
    const url=esc(x.url||x.product_url||('https://www.aliexpress.us/item/'+pid+'.html'));
    const img=productImage(x);
    const shippingLabel=esc((freight.delivery?freight.delivery+' | ':'')+(freight.label||''));
    const priceText=isFinite(price)?price.toFixed(2)+' '+esc(x.currency||'USD'):'—';
    const checked=selected.has(pid)||(selected.size===0&&i===0);
    const preview=img?'<img src="'+esc(img)+'" alt="AliExpress product" loading="lazy" style="width:76px;height:76px;object-fit:contain;border:1px solid #e5e7eb;border-radius:7px;background:#fff" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'grid\'"><div style="display:none;width:76px;height:76px;border:1px solid #e5e7eb;border-radius:7px;place-items:center;color:#999;font-size:10px">No image</div>':'<div style="width:76px;height:76px;border:1px solid #e5e7eb;border-radius:7px;display:grid;place-items:center;color:#999;font-size:10px">No image</div>';
    const brand='<span aria-label="AliExpress" style="margin-left:auto;font-weight:800;font-size:16px;color:#ff4747;opacity:.86;white-space:nowrap;text-align:right">AliExpress</span>';
    r.innerHTML='<input type="checkbox" class="capitan-aliexpress-choice" value="'+esc(pid)+'" '+(checked?'checked':'')+' style="width:16px;height:16px;margin-top:28px;border-radius:0;accent-color:#ff4747">'+preview+
      '<div style="min-width:0;align-self:start;margin-top:-1px"><div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin:0 0 5px"><a href="'+url+'" target="_blank" rel="noopener" style="color:#111;text-decoration:none;font-weight:800;font-size:13px;line-height:1">'+esc(pid)+'</a>'+brand+'</div>'+
      '<div style="color:#444;font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:8px" title="'+esc(x.title||'')+'">'+esc(x.title||'')+'</div>'+
      '<div style="display:flex;align-items:flex-end;justify-content:space-between;gap:10px;font-size:12px"><span data-card-shipping style="color:#555">'+(shippingLabel||'—')+'</span><span data-card-price style="margin-left:auto;white-space:nowrap;font-size:12.5px;font-weight:800;color:#111">'+priceText+'</span></div></div>';
    box.appendChild(r)
  });
  results.appendChild(box);
  window.__capitanTestLog?.('AliExpress: '+lastMatches.length+' card visibili','ok')
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

insertBtn.addEventListener('click',async e=>{
  e.preventDefault();e.stopPropagation();
  const title=currentEbayTitle();
  if(!title){status.innerHTML='<span style="color:#b42318;font-weight:700">Titolo eBay non trovato.</span>';return}
  insertBtn.disabled=true;
  const nextPage=matchPage;
  status.textContent='';window.__capitanTestLog?.(nextPage===0?'Best Match AliExpress in corso…':'Ricerca di altri Best Match AliExpress…','warn');
  try{
    const before=new Set(lastMatches.map(aliKey));
    let collected=[],attemptsUsed=0,successfulQueries=0,cursor=0;
    while(cursor<8){
      const batchSize=(cursor===0&&nextPage===0)?1:Math.min(3,8-cursor);
      const attempts=Array.from({length:batchSize},(_,i)=>cursor+i);
      const settled=await Promise.allSettled(attempts.map(attempt=>{
        const page=nextPage+attempt;
        const exploratory=nextPage>0||attempt>=2;
        const params={
          query:queryVariant(title,page),
          page:String(page+1),
          offset:String(page*10),
          limit:'10',
          exclude:[...before].join(','),
          searchMode:exploratory?'query':'match',
          forceRefresh:exploratory?'1':'0',
          seed:String(page),
          includeImages:'1',includeShipping:'1',includeDelivery:'1',includeDetails:'1',includeFreightRaw:'1',includeProductRaw:'1',shipTo:'US',currency:'USD'
        };
        if(exploratory&&attempt%2===1)params.itemId='';
        return jsonp(params)
      }));
      cursor+=batchSize;attemptsUsed=cursor;
      settled.forEach(r=>{if(r.status==='fulfilled'&&r.value&&r.value.ok){successfulQueries++;collected=collected.concat(r.value.matches||[])}});
      const uniq=new Map();
      collected.forEach(x=>{const k=aliKey(x);if(k&&!before.has(k)&&!uniq.has(k))uniq.set(k,x)});
      if(uniq.size>=10)break
    }
    const freshMap=new Map();
    collected.forEach(x=>{const k=aliKey(x);if(k&&!before.has(k)&&!freshMap.has(k))freshMap.set(k,x)});
    mergeMatches([...freshMap.values()].slice(0,10));
    setTimeout(()=>enrichAliVisible(),0);
    const added=lastMatches.filter(x=>!before.has(aliKey(x))).length;
    matchPage=nextPage+Math.max(1,attemptsUsed);
    status.textContent='';
    window.__capitanTestLog?.(added?('Best Match AliExpress: +'+added+' · totale '+lastMatches.length):('Best Match AliExpress: nessun nuovo prodotto dopo '+successfulQueries+' ricerche alternative'),added?'ok':'warn')
  }catch(err){
    console.error(err);status.textContent='';window.__capitanTestLog?.('Errore Best Match AliExpress: '+String(err.message||err),'bad')
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
renderSearchHistory();
findBtn.addEventListener('click',()=>{
  const title=currentEbayTitle();
  if(!title){status.innerHTML='<span style="color:#b42318;font-weight:700">Titolo eBay non trovato.</span>';return}
  const slug=title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,120);
  const url='https://www.aliexpress.us/w/wholesale-'+encodeURIComponent(slug)+'.html?SearchText='+encodeURIComponent(title);
  rememberSearch(title,url);
  window.open(url,'_blank','noopener');
  status.textContent='';
  window.__capitanTestLog?.('SERP AliExpress aperta per titolo','ok')
});
})();