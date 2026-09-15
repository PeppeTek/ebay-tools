javascript:(async()=>{
'use strict';
const V='v1.7.2';
const AI_RECOVERY_ENDPOINT='https://script.google.com/macros/s/AKfycbxPSCamhPhs1fvkikx0KyJFk6wfJDCxC2XqaBbRqDIqOrLN9D_QibphbRB8QenovCY5/exec';
const LOGO_SRC='data:image/webp;base64,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';
const ID='capitan-sell-like-clone';
const ENDPOINT_KEY='pep-ebay-bs-v6-google-url';
const SOURCE_KEY='capitan-sell-like-last-source-item';
const SHIPPING_CACHE_KEY='capitan-sell-like-source-shipping-cache-v1';
const SOURCE_PRICE_CACHE_KEY='capitan-sell-like-source-price-cache-v1';
const DISCOUNT_KEY='capitan-sell-like-discount-rate-v1';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function shippingCacheRead(){
  try{const x=JSON.parse(localStorage.getItem(SHIPPING_CACHE_KEY)||'{}');return x&&typeof x==='object'?x:{}}catch(_){return{}}
}
function shippingCacheWrite(x){try{localStorage.setItem(SHIPPING_CACHE_KEY,JSON.stringify(x||{}))}catch(_){}}
const shippingInflight={};
function formatShippingAmount(v,currency){
  const n=Number(String(v??'').replace(',','.'));if(!isFinite(n)||n<0)return'';
  const sym=/^USD$/i.test(String(currency||'USD'))?'$ ':String(currency||'USD').trim()+' ';
  return sym+n.toFixed(2)
}
function parseSourceShippingLabel(html){
  html=String(html||'');if(!html)return'';
  const raw=html.replace(/\\u0024/gi,'$').replace(/&dollar;|&#36;/gi,'$');
  let m;
  const structured=[
    /["']shippingCost["']\s*:\s*\{[^{}]{0,260}?["']value["']\s*:\s*["']?([0-9]+(?:[.,][0-9]{1,2})?)["']?[^{}]{0,180}?["']currency["']\s*:\s*["']([A-Z]{3})["']/i,
    /["']value["']\s*:\s*["']?([0-9]+(?:[.,][0-9]{1,2})?)["']?[^{}]{0,180}?["']currency["']\s*:\s*["']([A-Z]{3})["'][^{}]{0,220}?["']shipping/i
  ];
  for(const re of structured){
    m=raw.match(re);
    if(m){
      const n=Number(String(m[1]).replace(',','.'));
      if(isFinite(n)&&n===0)return'Free shipping';
      if(isFinite(n)&&n>0)return formatShippingAmount(n,m[2])
    }
  }
  let text='';
  try{
    const doc=new DOMParser().parseFromString(raw,'text/html');
    text=String(doc.body&&doc.body.innerText||'').replace(/\s+/g,' ').trim()
  }catch(_){text=raw.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim()}
  text=text.replace(/[–—]/g,'-');
  m=text.match(/free\s+shipping(?:\s+on\s+orders)?\s+(?:over|above)\s*(?:US\s*)?\$\s*([0-9]+(?:[.,][0-9]{1,2})?)/i);
  if(m)return'Free shipping over $ '+Number(String(m[1]).replace(',','.')).toFixed(2);
  m=text.match(/free\s+shipping\s+(?:over|above)\s*([0-9]+(?:[.,][0-9]{1,2})?)\s*USD/i);
  if(m)return'Free shipping over $ '+Number(String(m[1]).replace(',','.')).toFixed(2);
  if(/\bfree\s+shipping\b/i.test(text))return'Free shipping';
  const paid=[
    /(?:shipping|delivery)(?:\s+(?:cost|fee))?\s*[:+]?\s*(?:US\s*)?\$\s*([0-9]+(?:[.,][0-9]{1,2})?)/i,
    /(?:US\s*)?\$\s*([0-9]+(?:[.,][0-9]{1,2})?)\s*(?:shipping|delivery)/i,
    /\+\s*(?:US\s*)?\$\s*([0-9]+(?:[.,][0-9]{1,2})?)(?:\s*(?:shipping|delivery))?/i
  ];
  for(const re of paid){
    m=text.match(re);
    if(m){
      const n=Number(String(m[1]).replace(',','.'));
      if(isFinite(n)&&n===0)return'Free shipping';
      if(isFinite(n)&&n>0)return'$ '+n.toFixed(2)
    }
  }
  return''
}
async function readSourceShippingLabel(sourceItemId){
  sourceItemId=String(sourceItemId||'').trim();
  if(!/^\d{9,12}$/.test(sourceItemId))throw Error('Item ID sorgente non valido per la spedizione');
  const cache=shippingCacheRead(),hit=cache[sourceItemId];
  if(hit&&hit.label&&Date.now()-Number(hit.at||0)<12*60*60*1000)return hit.label;
  if(shippingInflight[sourceItemId])return shippingInflight[sourceItemId];
  shippingInflight[sourceItemId]=(async()=>{
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),7000);
    try{
      const r=await fetch('https://www.ebay.com/itm/'+encodeURIComponent(sourceItemId),{credentials:'include',cache:'no-store',signal:controller.signal});
      if(!r.ok)throw Error('eBay HTTP '+r.status);
      const label=parseSourceShippingLabel(await r.text());
      if(!label)throw Error('Spedizione non riconosciuta nella listing sorgente');
      const latest=shippingCacheRead();latest[sourceItemId]={label,at:Date.now()};shippingCacheWrite(latest);
      return label
    }finally{clearTimeout(timer)}
  })();
  try{return await shippingInflight[sourceItemId]}finally{delete shippingInflight[sourceItemId]}
}
window.__capitanReadSourceShippingLabel=readSourceShippingLabel;
function sourcePriceCacheRead(){try{const x=JSON.parse(localStorage.getItem(SOURCE_PRICE_CACHE_KEY)||'{}');return x&&typeof x==='object'?x:{}}catch(_){return{}}}
function sourcePriceCacheWrite(x){try{localStorage.setItem(SOURCE_PRICE_CACHE_KEY,JSON.stringify(x||{}))}catch(_){}}
function parseSourcePrice(html){
  const raw=String(html||'').replace(/\\u0024/gi,'$').replace(/&dollar;|&#36;/gi,'$');
  if(!raw)return null;
  try{
    const doc=new DOMParser().parseFromString(raw,'text/html');
    for(const script of doc.querySelectorAll('script[type="application/ld+json"]')){
      try{
        const json=JSON.parse(script.textContent||'null');
        const stack=Array.isArray(json)?json.slice():[json];
        while(stack.length){
          const x=stack.shift();if(!x||typeof x!=='object')continue;
          const type=String(x['@type']||'').toLowerCase();
          if(type==='product'||x.offers){
            const offers=Array.isArray(x.offers)?x.offers:[x.offers];
            for(const o of offers){const n=Number(o&&o.price);if(isFinite(n)&&n>0)return n}
          }
          for(const v of Object.values(x))if(v&&typeof v==='object')Array.isArray(v)?stack.push(...v):stack.push(v)
        }
      }catch(_){}
    }
    const sels=['meta[itemprop="price"]','meta[property="product:price:amount"]','meta[property="og:price:amount"]','[itemprop="price"]'];
    for(const sel of sels){
      const el=doc.querySelector(sel);if(!el)continue;
      const v=el.getAttribute('content')||el.getAttribute('value')||el.textContent||'';
      const n=Number(String(v).replace(/[^0-9.,]/g,'').replace(',','.'));if(isFinite(n)&&n>0)return n
    }
  }catch(_){}
  const regs=[
    /["']price["']\s*:\s*\{[^{}]{0,180}["']value["']\s*:\s*["']?([0-9]+(?:[.,][0-9]{1,2})?)/i,
    /["']price["']\s*:\s*["']([0-9]+(?:[.,][0-9]{1,2})?)["']/i,
    /["']convertedFromValue["']\s*:\s*["']?([0-9]+(?:[.,][0-9]{1,2})?)/i
  ];
  for(const re of regs){const m=raw.match(re);if(m){const n=Number(String(m[1]).replace(',','.'));if(isFinite(n)&&n>0)return n}}
  return null
}
async function readSourcePrice(sourceItemId){
  sourceItemId=String(sourceItemId||'').trim();
  const cache=sourcePriceCacheRead(),hit=cache[sourceItemId];
  if(hit&&isFinite(Number(hit.price))&&Number(hit.price)>0&&Date.now()-Number(hit.at||0)<12*60*60*1000)return Number(hit.price);
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
  try{
    const r=await fetch('https://www.ebay.com/itm/'+encodeURIComponent(sourceItemId),{credentials:'include',cache:'no-store',signal:controller.signal});
    if(!r.ok)throw Error('eBay HTTP '+r.status);
    const price=parseSourcePrice(await r.text());
    if(!isFinite(price)||price<=0)throw Error('Prezzo sorgente non riconosciuto');
    const latest=sourcePriceCacheRead();latest[sourceItemId]={price,at:Date.now()};sourcePriceCacheWrite(latest);
    return price
  }finally{clearTimeout(timer)}
}
window.__capitanReadSourcePrice=readSourcePrice;
const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;');
const visible=e=>!!(e&&e.getClientRects&&e.getClientRects().length);
function readDiscountLocal(){try{const n=Number(localStorage.getItem(DISCOUNT_KEY));return isFinite(n)&&n>-10&&n<1?n:.02}catch(_){return .02}}
let currentDiscountRate=readDiscountLocal();
function setDiscountLocal(v){v=Number(v);if(!isFinite(v)||v<=-10||v>=1)return false;currentDiscountRate=v;try{localStorage.setItem(DISCOUNT_KEY,String(v))}catch(_){}return true}
function targetFromSource(source){source=Number(source);return isFinite(source)&&source>0?Math.round(source*(1+currentDiscountRate)*100)/100:null}
function discountLabel(){const n=Math.round(currentDiscountRate*10000)/100;return Number.isInteger(n)?String(n):String(n).replace('.',',')}
function operationalLog(message,state='ok'){if(typeof window.__capitanTestLog==='function')window.__capitanTestLog(message,state);else{window.__capitanPendingTestLogs=window.__capitanPendingTestLogs||[];window.__capitanPendingTestLogs.push({message:String(message||''),state})}}
function idFromTrustedText(v){const s=String(v||'');for(const re of[/[?&](?:itemId|itemid|sourceItemId|originalItemId)=(\d{9,12})/i,/\/itm\/(?:[^/?#]+\/)?(\d{9,12})(?:[/?#]|$)/i]){const m=s.match(re);if(m)return m[1]}return''}
function idFromManual(v){const s=String(v||'');return idFromTrustedText(s)||((s.match(/\b(\d{9,12})\b/)||[])[1]||'')}
function detectSourceItemId(){const u=new URL(location.href);for(const k of['itemId','itemid','sourceItemId','originalItemId']){const v=u.searchParams.get(k);if(/^\d{9,12}$/.test(String(v||'')))return String(v)}let id=idFromTrustedText(location.href);if(id)return id;id=idFromTrustedText(document.referrer);if(id)return id;return''}
const isEbay=/^(?:www\.)?ebay\.[a-z.]{2,20}$/i.test(location.hostname);
const pageText=clean((document.querySelector('h1')?.innerText||'')+' '+(document.body?.innerText||'').slice(0,6000));
const looksLikeEditor=/\/sl\/list|\/sell\//i.test(location.pathname)||/complete your listing|list it|photos & video|item specifics/i.test(pageText);
if(!isEbay||!looksLikeEditor){alert('Questa non sembra la pagina di modifica eBay aperta da “Sell one like this”.');return}
let itemId=detectSourceItemId();
if(!/^\d{9,12}$/.test(itemId)){
  const previous=localStorage.getItem(SOURCE_KEY)||'';
  const entered=prompt('eBay non ha mantenuto un Item ID sorgente affidabile nella URL. Incolla qui il link della listing originale oppure il suo Item ID:',previous)||'';
  itemId=idFromManual(entered);
  if(!/^\d{9,12}$/.test(itemId)){alert('Item ID sorgente non valido. Incolla il link della listing originale oppure un Item ID eBay valido.');return}
}
localStorage.setItem(SOURCE_KEY,itemId);window.__capitanSellLikeSourceItemId=itemId;try{window.dispatchEvent(new CustomEvent('capitan-source-item-ready',{detail:{itemId}}))}catch(_){}
document.getElementById(ID)?.remove();
const style=document.createElement('style');
style.textContent=`#${ID}{position:fixed;top:12px;right:12px;z-index:2147483647;width:500px;max-width:none;max-height:calc(100vh - 24px);overflow:auto;background:#fff;color:#111;border:1px solid #bbb;border-radius:12px;box-shadow:0 12px 40px #0004;font:13px Arial,sans-serif}#${ID} *{box-sizing:border-box}#${ID} .h{display:flex;justify-content:flex-start;align-items:center;gap:10px;padding:12px 92px 12px 14px;border-bottom:1px solid #ddd;font-weight:700;font-size:16px;min-height:54px}#${ID} .title{font-weight:700;font-size:16px;line-height:1.2;white-space:nowrap}#${ID} #capitan-process-timer{min-width:75px;text-align:center;padding:0;border:1px solid #b9b9b9;border-radius:8px;background:#fff;color:#333;font:700 11px/28px ui-monospace,SFMono-Regular,Consolas,monospace;letter-spacing:0;box-sizing:border-box}#${ID} .brand{padding:12px 14px 0}#${ID} .brand img{display:block;max-width:100%;height:auto;max-height:56px}#${ID} .b{padding:12px 14px}#${ID} .row{padding:7px 0;border-bottom:1px solid #eee}#${ID} .ok{color:#137333;font-weight:700}#${ID} .warn{color:#b06000;font-weight:700}#${ID} .bad{color:#b3261e;font-weight:700}#${ID} .muted{color:#666}#${ID} button{padding:7px 10px;border:1px solid #aaa;border-radius:7px;background:#fff;cursor:pointer}`;
document.head.appendChild(style);
const panel=document.createElement('div');panel.id=ID;panel.innerHTML=`<div class="brand"><img src="${LOGO_SRC}" alt="Dropper Analytics"></div><div class="h"><span class="title">Sell Like This ${V}</span><span id="capitan-process-timer" title="Tempo di preparazione">00:00</span><button data-close>×</button></div><div class="b"><div class="row"><b>Source Item ID:</b> ${esc(itemId)}</div><div class="row" id="st">Preparazione…</div><div id="steps"></div></div>`;document.body.appendChild(panel);
const processTimerEl=panel.querySelector('#capitan-process-timer');
const processStartedAt=Date.now();
let processTimerId=null,processTimerStopped=false;
function formatProcessElapsed(ms){ms=Math.max(0,Math.floor(ms));const total=Math.floor(ms/1000),h=Math.floor(total/3600),m=Math.floor((total%3600)/60),s=total%60,milli=ms%1000;const hh=String(h).padStart(2,'0'),mm=String(m).padStart(2,'0'),ss=String(s).padStart(2,'0'),mmm=String(milli).padStart(3,'0');return h>0?hh+':'+mm+':'+ss+'.'+mmm:mm+':'+ss+'.'+mmm}
function refreshProcessTimer(){if(processTimerEl)processTimerEl.textContent=formatProcessElapsed(Date.now()-processStartedAt)}
function stopProcessTimer(){if(processTimerStopped)return;processTimerStopped=true;if(processTimerId){clearInterval(processTimerId);processTimerId=null}refreshProcessTimer();if(processTimerEl){processTimerEl.style.borderColor='#b9b9b9';processTimerEl.style.color='#333'}}
window.__capitanStopProcessTimer=stopProcessTimer;
refreshProcessTimer();processTimerId=setInterval(refreshProcessTimer,25);
panel.querySelector('[data-close]').onclick=()=>{stopProcessTimer();panel.remove()};
const steps=panel.querySelector('#steps'),status=panel.querySelector('#st');
const add=(name,state,msg)=>{const d=document.createElement('div');d.className='row';d.innerHTML=`<b>${esc(name)}:</b> <span class="${state}">${esc(msg)}</span>`;steps.appendChild(d);return d};
function endpoint(){let u=String(window.__capitanSellLikeBackendEndpoint||'').trim();if(!/^https:\/\/script\.google\.com\/macros\/s\//i.test(u)){try{u=localStorage.getItem(ENDPOINT_KEY)||''}catch(_){u=''}}if(!/^https:\/\/script\.google\.com\/macros\/s\//i.test(u)){u=prompt('Incolla l’URL Web App Apps Script già usato dal bookmarklet eBay:','')||'';u=u.trim();try{if(u)localStorage.setItem(ENDPOINT_KEY,u)}catch(_){}}return u.replace(/\/+$/,'');}
function jsonp(u){return new Promise((resolve,reject)=>{const cb='__capitanCloneCb_'+Date.now()+'_'+Math.floor(Math.random()*1e6),s=document.createElement('script'),t=setTimeout(()=>done(Error('Timeout backend')),90000);function done(err,val){clearTimeout(t);try{delete window[cb]}catch(_){window[cb]=undefined}s.remove();err?reject(err):resolve(val)}window[cb]=v=>done(null,v);s.onerror=()=>done(Error('Backend non raggiungibile'));s.src=u+(u.includes('?')?'&':'?')+'action=clone_prepare&itemId='+encodeURIComponent(itemId)+'&callback='+encodeURIComponent(cb)+'&_='+Date.now();document.head.appendChild(s)})}
function jsonpAction(u,action,params,timeoutMs=90000){return new Promise((resolve,reject)=>{const cb='__capitanActionCb_'+Date.now()+'_'+Math.floor(Math.random()*1e6),s=document.createElement('script'),t=setTimeout(()=>done(Error('Timeout backend')),timeoutMs);function done(err,val){clearTimeout(t);try{delete window[cb]}catch(_){window[cb]=undefined}s.remove();err?reject(err):resolve(val)}window[cb]=v=>done(null,v);s.onerror=()=>done(Error('Backend non raggiungibile'));const q=new URLSearchParams({action,callback:cb,_:String(Date.now()),...(params||{})});s.src=u+(u.includes('?')?'&':'?')+q.toString();document.head.appendChild(s)})}
function isAiDescriptionError(v){return /groq|descrizione\s+valida|risposta\s+ai|risposta\s+groq|description/i.test(clean(v))}
function labelControl(re){for(const l of document.querySelectorAll('label')){const txt=clean(l.innerText||l.textContent);if(!re.test(txt))continue;let c=l.htmlFor?document.getElementById(l.htmlFor):l.querySelector('input,textarea,select,[role="combobox"]');if(c)return c;let p=l.parentElement;for(let i=0;i<4&&p;i++,p=p.parentElement){c=p.querySelector('input,textarea,select,[role="combobox"]');if(c)return c}}return null}
function candidates(sel,re){return [...document.querySelectorAll(sel)].filter(e=>!e.disabled).sort((a,b)=>(visible(b)?1:0)-(visible(a)?1:0)).find(e=>re.test(clean([e.name,e.id,e.getAttribute('aria-label'),e.placeholder].join(' '))))||null}
function nativeSet(el,value){if(!el)return false;const proto=el instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;const set=Object.getOwnPropertyDescriptor(proto,'value')?.set;set?set.call(el,String(value)):el.value=String(value);el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));el.blur?.();return true}
function setPrice(v){const el=labelControl(/^(price|buy it now price|fixed price)$/i)||candidates('input',/(^|\b)(price|binprice|startprice)(\b|$)/i);return !!(el&&nativeSet(el,Number(v).toFixed(2)))}
function readEditorPrice(){const el=labelControl(/^(price|buy it now price|fixed price)$/i)||candidates('input',/(^|\b)(price|binprice|startprice)(\b|$)/i);if(!el)return null;const n=Number(String(el.value||el.getAttribute('value')||'').replace(/[^0-9.,]/g,'').replace(',','.'));return isFinite(n)&&n>0?n:null}
function setQuantity(v){const el=labelControl(/^quantity$/i)||candidates('input',/(^|\b)(quantity|qty)(\b|$)/i);return !!(el&&nativeSet(el,String(v)))}
function setItemLocation(v){v=clean(v);if(!v)return false;let el=labelControl(/^(item location|located in|location)$/i)||candidates('input,textarea',/(item.?location|located.?in|location)/i);if(el&&nativeSet(el,v))return true;const sections=[...document.querySelectorAll('section,div')].filter(x=>/item location|located in/i.test(clean(x.querySelector('h2,h3,label,legend')?.textContent||''))&&clean(x.innerText).length<2000);for(const sec of sections){el=sec.querySelector('input,textarea');if(el&&nativeSet(el,v))return true}return false}
async function setConditionNew(){const c=labelControl(/condition/i)||candidates('select,[role="combobox"]',/condition/i);if(c&&c.tagName==='SELECT'){const o=[...c.options].find(o=>/^new$/i.test(clean(o.textContent))||/^1000$/.test(String(o.value)));if(o){c.value=o.value;c.dispatchEvent(new Event('change',{bubbles:true}));return true}}const section=[...document.querySelectorAll('section,div')].find(x=>/\bcondition\b/i.test(clean(x.querySelector('h2,h3,label')?.textContent||''))&&clean(x.innerText).length<1500);if(section){const btn=[...section.querySelectorAll('button,[role="option"],[role="radio"]')].find(x=>/^new$/i.test(clean(x.innerText||x.textContent)));if(btn){btn.click();await sleep(300);return true}}return false}
function descriptionSection(){return [...document.querySelectorAll('section,div')].find(x=>/^description$/i.test(clean(x.querySelector('h2,h3,legend')?.textContent||'')))||document.body}
async function enableHtmlMode(){const sec=descriptionSection();const items=[...sec.querySelectorAll('button,label,input[type="checkbox"],[role="checkbox"]')];for(const x of items){const txt=clean((x.innerText||x.textContent||'')+' '+(x.getAttribute?.('aria-label')||''));if(/show html code|html code/i.test(txt)){if(x.matches('input[type="checkbox"]')){if(!x.checked)x.click()}else{x.click()}await sleep(500);return true}}return false}
function setDescription(html){const sec=descriptionSection();let ta=[...sec.querySelectorAll('textarea')].sort((a,b)=>(b.clientWidth*b.clientHeight)-(a.clientWidth*a.clientHeight))[0];if(!ta)ta=[...document.querySelectorAll('textarea')].sort((a,b)=>(b.clientWidth*b.clientHeight)-(a.clientWidth*a.clientHeight))[0];if(ta)return nativeSet(ta,html);const ed=[...sec.querySelectorAll('[contenteditable="true"]')].sort((a,b)=>(b.clientWidth*b.clientHeight)-(a.clientWidth*a.clientHeight))[0];if(ed){ed.focus();ed.innerHTML=html;ed.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:null}));ed.dispatchEvent(new Event('change',{bubbles:true}));return true}return false}
function attachAiRetry(row,data){
  if(!row||!data)return;
  const span=row.querySelector('span');
  if(!span)return;
  span.className='warn';
  span.textContent='Descrizione originale usata — AI non disponibile · ';
  const a=document.createElement('a');
  a.href='#';
  a.textContent='Riprova AI';
  a.style.cssText='color:#b26a00;text-decoration:underline;font-weight:700;cursor:pointer';
  a.onclick=async e=>{
    e.preventDefault();e.stopPropagation();
    if(a.dataset.busy==='1')return;
    a.dataset.busy='1';
    a.textContent='Riprovo AI…';
    a.style.pointerEvents='none';
    try{
      const r=await jsonpAction(AI_RECOVERY_ENDPOINT,'sell_like_ai_retry',{itemId},90000);
      if(!r||!r.ok)throw Error(r&&r.error||'Retry AI non riuscito');
      await enableHtmlMode();
      if(!setDescription(r.descriptionHtml))throw Error('editor HTML non trovato');
      data.descriptionHtml=r.descriptionHtml;
      data.aiModel=r.aiModel||data.aiModel;
      data.aiFallback=false;
      data.aiError='';
      window.__capitanSellLikeCloneData=data;
      try{localStorage.setItem('capitan-sell-like-clone-data-v1',JSON.stringify(data))}catch(_){}
      span.className='ok';
      span.textContent='Template AI-HTML incluso';
      try{window.dispatchEvent(new CustomEvent('capitan-ai-description-updated',{detail:{itemId,descriptionHtml:r.descriptionHtml}}))}catch(_){}
    }catch(err){
      span.className='warn';
      span.textContent='Retry AI fallito — descrizione originale mantenuta · ';
      a.dataset.busy='0';
      a.textContent='Riprova AI';
      a.style.pointerEvents='';
      span.appendChild(a);
      console.warn('Sell Like AI retry',err)
    }
  };
  span.appendChild(a)
}
function photoInput(){return [...document.querySelectorAll('input[type="file"]')].find(x=>x.multiple||/image/i.test(x.accept||''))||document.querySelector('input[type="file"]')}
async function uploadImages(urls){const input=photoInput();if(!input)throw Error('Input foto eBay non trovato');const dt=new DataTransfer();let ok=0;for(let i=0;i<urls.length;i++){const u=urls[i];try{const r=await fetch(u,{mode:'cors',credentials:'omit',cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);const blob=await r.blob();const mime=blob.type||'image/jpeg';const ext=/png/i.test(mime)?'png':/webp/i.test(mime)?'webp':'jpg';dt.items.add(new File([blob],`${itemId}-${String(i+1).padStart(2,'0')}.${ext}`,{type:mime,lastModified:Date.now()}));ok++}catch(e){console.warn('Image fetch failed',u,e)}}if(!ok)throw Error('Nessuna foto scaricabile dal browser');input.files=dt.files;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));return ok}
let previewPreparePromise=null,previewReady=false,uploadedImageSignature='';
const stepRows={};
function setStep(name,state,msg){
  let row=stepRows[name];
  if(!row){row=add(name,state,msg);stepRows[name]=row;return row}
  const span=row.querySelector('span');
  if(span){span.className=state;span.textContent=msg}
  return row
}
function uniqUrls(values){
  const out=[],seen=new Set();
  (values||[]).flat(Infinity).forEach(v=>{
    const u=clean(typeof v==='string'?v:(v&&typeof v==='object'?(v.url||v.imageUrl||v.src||''):''));
    if(/^https?:\/\//i.test(u)&&!seen.has(u)){seen.add(u);out.push(u)}
  });
  return out
}
function dataFromPreflight(pre){
  pre=pre&&pre.ok?pre:{};
  const source=Number(pre.sourcePrice??pre.price);
  const target=Number(pre.targetPrice);
  let images=uniqUrls([pre.images,pre.sourceImages,pre.imageUrls,pre.photos]);
  if(!images.length&&Array.isArray(pre.variants)){
    images=uniqUrls(pre.variants.map(v=>[v&&v.images,v&&v.imageUrls,v&&v.image,v&&v.imageUrl]))
  }
  return {
    ok:true,
    itemId:String(pre.itemId||itemId),
    title:clean(pre.title||''),
    categoryId:clean(pre.categoryId||pre.categoryID||''),
    categoryName:clean(pre.categoryName||''),
    aspects:pre.aspects||{},
    sourcePrice:isFinite(source)&&source>0?source:null,
    targetPrice:isFinite(source)&&source>0?targetFromSource(source):(isFinite(target)&&target>0?target:null),
    quantity:3,
    condition:'New',
    images,
    itemLocation:clean(pre.itemLocation||pre.itemLocationText||pre.location||''),
    descriptionHtml:'',
    aiDeferred:true,
    descriptionReady:false
  }
}
async function initialNonAiData(){
  try{
    const ep=endpoint();
    if(ep){const pricing=await jsonpAction(ep,'sell_like_pricing_get',{},25000);const dr=Number(pricing&&pricing.rates&&pricing.rates.discountRate);if(isFinite(dr)&&dr>-10&&dr<1)setDiscountLocal(dr)}
  }catch(e){console.warn('Discount pricing preload',e)}
  let mi=null;
  try{mi=window.__capitanSellLikeModePromise?await Promise.race([window.__capitanSellLikeModePromise,sleep(12000).then(()=>null)]):null}catch(_){}
  const pre=(mi&&mi.data&&mi.data.ok?mi.data:null)||(window.__capitanSellLikePreflight&&window.__capitanSellLikePreflight.ok?window.__capitanSellLikePreflight:null);
  const data=dataFromPreflight(pre);
  if(!isFinite(Number(data.sourcePrice))||Number(data.sourcePrice)<=0){
    const editorPrice=readEditorPrice();
    if(isFinite(editorPrice)&&editorPrice>0)data.sourcePrice=editorPrice;
    else try{data.sourcePrice=await readSourcePrice(itemId)}catch(e){console.warn('Source price fallback',e)}
  }
  if(isFinite(Number(data.sourcePrice))&&Number(data.sourcePrice)>0){
    window.__capitanSellLikeSourcePrice=Number(data.sourcePrice);
    data.targetPrice=targetFromSource(data.sourcePrice)
  }
  return {mode:(mi&&mi.mode==='variants')||(pre&&pre.hasVariations)?'variants':'mono',data}
}
async function ensurePreviewFullData(){
  if(previewReady)return true;
  if(previewPreparePromise)return previewPreparePromise;
  previewPreparePromise=(async()=>{
    const ep=endpoint();if(!ep)throw Error('URL backend mancante.');
    status.textContent='Generazione Template AI-HTML in corso…';
    let data=await jsonp(ep);
    if((!data||!data.ok)&&isAiDescriptionError(data&&data.error)){
      try{const recovered=await jsonpAction(AI_RECOVERY_ENDPOINT,'clone_prepare',{itemId},90000);if(recovered&&recovered.ok)data=recovered}catch(recoveryError){console.warn('Sell Like AI fallback endpoint',recoveryError)}
    }
    if(!data||!data.ok)throw Error(data&&data.error||'Risposta backend non valida');
    if(data.aiFallback||!clean(data.descriptionHtml)){
      try{
        const ai=await jsonpAction(AI_RECOVERY_ENDPOINT,'sell_like_ai_retry',{itemId},90000);
        if(ai&&ai.ok&&clean(ai.descriptionHtml)){
          data={...data,descriptionHtml:ai.descriptionHtml,aiModel:ai.aiModel||data.aiModel,aiFallback:false,aiError:''}
        }
      }catch(aiErr){console.warn('Sell Like Preview AI retry',aiErr)}
    }
    if(data.aiFallback||!clean(data.descriptionHtml))throw Error('Template AI-HTML non disponibile: Preview non avviata.');
    let fullSource=Number(data.sourcePrice);
    if(!isFinite(fullSource)||fullSource<=0)fullSource=Number(window.__capitanSellLikeSourcePrice);
    if(!isFinite(fullSource)||fullSource<=0){try{fullSource=await readSourcePrice(itemId)}catch(_){}}
    if(isFinite(fullSource)&&fullSource>0){data.sourcePrice=fullSource;window.__capitanSellLikeSourcePrice=fullSource;data.targetPrice=targetFromSource(fullSource)}

    window.__capitanSellLikeCloneData=data;
    try{localStorage.setItem('capitan-sell-like-clone-data-v1',JSON.stringify(data))}catch(_){}

    const sellMode=window.__capitanSellLikeMode==='variants'?'variants':'mono';
    if(sellMode==='mono'){
      const sale=Number(data.targetPrice);
      if(isFinite(sale)&&sale>0){
        window.__capitanSellLikeSalePrice=sale;
        const ok=setPrice(sale);
        setStep('Prezzo',ok?'ok':'warn',ok?sale.toFixed(2)+' (-'+discountLabel()+'%)':'campo non trovato')
      }
      const q=Number(data.quantity||3);
      const qtyOk=setQuantity(q);
      setStep('Quantità',qtyOk?'ok':'warn',qtyOk?String(q):'campo non trovato')
    }
    const conditionOk=await setConditionNew();
    setStep('Condizione',conditionOk?'ok':'warn',conditionOk?'New':'controlla manualmente');

    if(clean(data.itemLocation)){
      const locOk=setItemLocation(data.itemLocation);
      setStep('Item Location',locOk?'ok':'warn',locOk?clean(data.itemLocation):'sorgente: '+clean(data.itemLocation)+' — campo eBay non trovato, controlla manualmente')
    }

    await enableHtmlMode();
    const descOk=setDescription(data.descriptionHtml);
    if(!descOk)throw Error('Template AI generato ma editor HTML eBay non trovato');
    setStep('Descrizione','ok','Template AI-HTML incluso');

    const imgs=uniqUrls(data.images||[]);
    if(imgs.length){
      const sig=imgs.join('|');
      if(sig!==uploadedImageSignature){
        status.textContent='Caricamento foto nello stesso ordine…';
        try{
          const n=await uploadImages(imgs);
          uploadedImageSignature=sig;
          operationalLog('Foto: '+n+'/'+imgs.length+' caricate su eBay','ok')
        }catch(imgErr){
          operationalLog('Foto: '+imgErr.message+' — verifica manualmente','bad');
          throw imgErr
        }
      }
    }
    data.aiDeferred=false;data.descriptionReady=true;
    window.__capitanSellLikeCloneData=data;
    try{localStorage.setItem('capitan-sell-like-clone-data-v1',JSON.stringify(data))}catch(_){}
    try{window.dispatchEvent(new CustomEvent('capitan-ai-description-updated',{detail:{itemId,descriptionHtml:data.descriptionHtml,aiModel:data.aiModel||''}}))}catch(_){}
    previewReady=true;
    status.innerHTML='<span class="ok">Template AI-HTML pronto.</span>';
    return true
  })();
  try{return await previewPreparePromise}finally{if(!previewReady)previewPreparePromise=null}
}
window.__capitanPrepareAiForPreview=ensurePreviewFullData;
window.__capitanEnsureAiTemplate=ensurePreviewFullData;
window.addEventListener('capitan-discount-reverse-updated',e=>{
  const dr=Number(e&&e.detail&&e.detail.discountRate);
  const sale=Number(e&&e.detail&&e.detail.salePrice);
  const source=Number(e&&e.detail&&e.detail.sourcePrice);
  if(!setDiscountLocal(dr))return;
  const data=window.__capitanSellLikeCloneData||{};
  if(isFinite(source)&&source>0){data.sourcePrice=source;window.__capitanSellLikeSourcePrice=source}
  if(isFinite(sale)&&sale>0){data.targetPrice=sale;window.__capitanSellLikeSalePrice=sale}
  window.__capitanSellLikeCloneData=data;
  try{localStorage.setItem('capitan-sell-like-clone-data-v1',JSON.stringify(data))}catch(_){}
});
window.addEventListener('capitan-discount-updated',e=>{
  const dr=Number(e&&e.detail&&e.detail.discountRate);
  if(!setDiscountLocal(dr))return;
  const data=window.__capitanSellLikeCloneData||{};
  const source=Number(data.sourcePrice||window.__capitanSellLikeSourcePrice);
  if(!isFinite(source)||source<=0)return;
  const sale=targetFromSource(source);
  data.sourcePrice=source;data.targetPrice=sale;
  window.__capitanSellLikeSourcePrice=source;window.__capitanSellLikeSalePrice=sale;window.__capitanSellLikeCloneData=data;
  try{localStorage.setItem('capitan-sell-like-clone-data-v1',JSON.stringify(data))}catch(_){}
  const ok=setPrice(sale);setStep('Prezzo',ok?'ok':'warn',ok?sale.toFixed(2)+' (-'+discountLabel()+'%)':'campo non trovato');
  try{window.dispatchEvent(new CustomEvent('capitan-sale-price-updated',{detail:{value:sale,sourcePrice:source,discountRate:currentDiscountRate}}))}catch(_){}
  operationalLog('Riduzione prezzo aggiornata a '+discountLabel()+'% · nuovo prezzo '+sale.toFixed(2)+' USD','ok')
});

try{
  const ep=endpoint();if(!ep)throw Error('URL backend mancante.');
  status.textContent='Preparazione dati sorgente — AI disattivata fino a Preview…';
  const initial=await initialNonAiData();
  const sellMode=initial.mode||'mono',data=initial.data||dataFromPreflight(null);
  window.__capitanSellLikeMode=sellMode;
  window.__capitanSellLikeCloneData=data;
  try{localStorage.setItem('capitan-sell-like-clone-data-v1',JSON.stringify(data))}catch(_){}

  setStep('Titolo / Item Specifics','ok','lasciati invariati');
  if(sellMode==='mono'){
    const sale=Number(data.targetPrice);
    if(isFinite(sale)&&sale>0){
      window.__capitanSellLikeSalePrice=sale;
      const priceOk=setPrice(sale);
      setStep('Prezzo',priceOk?'ok':'warn',priceOk?sale.toFixed(2)+' (-'+discountLabel()+'%)':'campo non trovato');
      try{window.dispatchEvent(new CustomEvent('capitan-sale-price-updated',{detail:{value:sale,sourcePrice:Number(data.sourcePrice),discountRate:currentDiscountRate}}))}catch(_){}
    }else setStep('Prezzo','warn','prezzo sorgente non disponibile');
    const qtyOk=setQuantity(3);
    setStep('Quantità',qtyOk?'ok':'warn',qtyOk?'3':'campo non trovato')
  }else setStep('Quantità','ok','3');

  const conditionOk=await setConditionNew();
  setStep('Condizione',conditionOk?'ok':'warn',conditionOk?'New':'controlla manualmente');

  if(data.itemLocation){
    const locOk=setItemLocation(data.itemLocation);
    setStep('Item Location',locOk?'ok':'warn',locOk?data.itemLocation:'sorgente: '+data.itemLocation+' — campo eBay non trovato, controlla manualmente')
  }else setStep('Item Location','warn','in attesa di Preview');

  setStep('Descrizione','ok','Template AI-HTML in attesa di Preview');

  if(data.images&&data.images.length){
    status.textContent='Caricamento foto sorgente senza AI…';
    try{
      const n=await uploadImages(data.images);
      uploadedImageSignature=data.images.join('|');
      operationalLog('Foto: '+n+'/'+data.images.length+' caricate su eBay','ok')
    }catch(imgErr){operationalLog('Foto: '+imgErr.message+' — ritento prima della Preview','warn')}
  }else operationalLog('Foto: nessuna immagine disponibile nella preparazione iniziale; ritento in Preview','warn');

  setStep('Policy','ok','non modificate');
  setStep('Pubblicazione','ok','List it lasciato manuale');
  status.textContent='';
  if(sellMode==='mono')stopProcessTimer()
}catch(e){
  console.error(e);
  status.innerHTML='<span class="bad">Errore:</span> '+esc(e.message||e);
  stopProcessTimer()
}
})();