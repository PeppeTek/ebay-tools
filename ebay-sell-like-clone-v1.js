javascript:(async()=>{
'use strict';
const V='v1.0';
const ID='capitan-sell-like-clone';
const ENDPOINT_KEY='pep-ebay-bs-v6-google-url';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const visible=e=>!!(e&&e.getClientRects&&e.getClientRects().length);
const itemId=(new URL(location.href)).searchParams.get('itemId')||((location.href.match(/[?&]itemId=(\d{9,15})/i)||[])[1]||'');
if(!/\/sl\/list/i.test(location.pathname)||!/^\d{9,15}$/.test(itemId)){
  alert('Apri prima eBay con “Sell one like this”. Non modifico titolo o Item Specifics.');
  return;
}
document.getElementById(ID)?.remove();
const style=document.createElement('style');
style.textContent=`#${ID}{position:fixed;top:12px;right:12px;z-index:2147483647;width:430px;max-height:calc(100vh - 24px);overflow:auto;background:#fff;color:#111;border:1px solid #bbb;border-radius:12px;box-shadow:0 12px 40px #0004;font:13px Arial,sans-serif}#${ID} *{box-sizing:border-box}#${ID} .h{display:flex;justify-content:space-between;align-items:center;padding:12px 14px;border-bottom:1px solid #ddd;font-weight:700;font-size:16px}#${ID} .b{padding:12px 14px}#${ID} .row{padding:7px 0;border-bottom:1px solid #eee}#${ID} .ok{color:#137333;font-weight:700}#${ID} .warn{color:#b06000;font-weight:700}#${ID} .bad{color:#b3261e;font-weight:700}#${ID} .muted{color:#666}#${ID} button{padding:7px 10px;border:1px solid #aaa;border-radius:7px;background:#fff;cursor:pointer}`;
document.head.appendChild(style);
const panel=document.createElement('div');panel.id=ID;panel.innerHTML=`<div class="h"><span>CapitanShop · Sell Like Clone ${V}</span><button data-close>×</button></div><div class="b"><div class="row"><b>Source Item ID:</b> ${esc(itemId)}</div><div class="row" id="st">Preparazione…</div><div id="steps"></div><div class="row muted">Titolo, categoria, Item Specifics e policy non vengono toccati. Il pulsante “List it” resta manuale.</div></div>`;document.body.appendChild(panel);panel.querySelector('[data-close]').onclick=()=>panel.remove();
const steps=panel.querySelector('#steps'),status=panel.querySelector('#st');
const add=(name,state,msg)=>{const d=document.createElement('div');d.className='row';d.innerHTML=`<b>${esc(name)}:</b> <span class="${state}">${esc(msg)}</span>`;steps.appendChild(d)};
function endpoint(){let u=localStorage.getItem(ENDPOINT_KEY)||'';if(!/^https:\/\/script\.google\.com\/macros\/s\//i.test(u)){u=prompt('Incolla l’URL Web App Apps Script già usato dal bookmarklet eBay:','')||'';u=u.trim();if(u)localStorage.setItem(ENDPOINT_KEY,u)}return u.replace(/\/+$/,'');}
function jsonp(u){return new Promise((resolve,reject)=>{const cb='__capitanCloneCb_'+Date.now()+'_'+Math.floor(Math.random()*1e6),s=document.createElement('script'),t=setTimeout(()=>done(Error('Timeout backend')),90000);function done(err,val){clearTimeout(t);try{delete window[cb]}catch(_){window[cb]=undefined}s.remove();err?reject(err):resolve(val)}window[cb]=v=>done(null,v);s.onerror=()=>done(Error('Backend non raggiungibile'));s.src=u+(u.includes('?')?'&':'?')+'action=clone_prepare&itemId='+encodeURIComponent(itemId)+'&callback='+encodeURIComponent(cb)+'&_='+Date.now();document.head.appendChild(s)})}
function labelControl(re){for(const l of document.querySelectorAll('label')){const txt=clean(l.innerText||l.textContent);if(!re.test(txt))continue;let c=l.htmlFor?document.getElementById(l.htmlFor):l.querySelector('input,textarea,select,[role="combobox"]');if(c)return c;let p=l.parentElement;for(let i=0;i<4&&p;i++,p=p.parentElement){c=p.querySelector('input,textarea,select,[role="combobox"]');if(c)return c}}return null}
function candidates(sel,re){return [...document.querySelectorAll(sel)].filter(e=>!e.disabled).sort((a,b)=>(visible(b)?1:0)-(visible(a)?1:0)).find(e=>re.test(clean([e.name,e.id,e.getAttribute('aria-label'),e.placeholder].join(' '))))||null}
function nativeSet(el,value){if(!el)return false;const proto=el instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;const set=Object.getOwnPropertyDescriptor(proto,'value')?.set;set?set.call(el,String(value)):el.value=String(value);el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));el.blur?.();return true}
function setPrice(v){const el=labelControl(/^(price|buy it now price|fixed price)$/i)||candidates('input',/(^|\b)(price|binprice|startprice)(\b|$)/i);return !!(el&&nativeSet(el,Number(v).toFixed(2)))}
function setQuantity(v){const el=labelControl(/^quantity$/i)||candidates('input',/(^|\b)(quantity|qty)(\b|$)/i);return !!(el&&nativeSet(el,String(v)))}
async function setConditionNew(){const c=labelControl(/condition/i)||candidates('select,[role="combobox"]',/condition/i);if(c&&c.tagName==='SELECT'){const o=[...c.options].find(o=>/^new$/i.test(clean(o.textContent))||/^1000$/.test(String(o.value)));if(o){c.value=o.value;c.dispatchEvent(new Event('change',{bubbles:true}));return true}}
  const section=[...document.querySelectorAll('section,div')].find(x=>/\bcondition\b/i.test(clean(x.querySelector('h2,h3,label')?.textContent||''))&&clean(x.innerText).length<1500);
  if(section){const btn=[...section.querySelectorAll('button,[role="option"],[role="radio"]')].find(x=>/^new$/i.test(clean(x.innerText||x.textContent)));if(btn){btn.click();await sleep(300);return true}}
  return false;
}
function descriptionSection(){return [...document.querySelectorAll('section,div')].find(x=>/^description$/i.test(clean(x.querySelector('h2,h3,legend')?.textContent||'')))||document.body}
async function enableHtmlMode(){const sec=descriptionSection();const items=[...sec.querySelectorAll('button,label,input[type="checkbox"],[role="checkbox"]')];for(const x of items){const txt=clean((x.innerText||x.textContent||'')+' '+(x.getAttribute?.('aria-label')||''));if(/show html code|html code/i.test(txt)){if(x.matches('input[type="checkbox"]')){if(!x.checked)x.click()}else{x.click()}await sleep(500);return true}}return false}
function setDescription(html){const sec=descriptionSection();let ta=[...sec.querySelectorAll('textarea')].sort((a,b)=>(b.clientWidth*b.clientHeight)-(a.clientWidth*a.clientHeight))[0];if(!ta)ta=[...document.querySelectorAll('textarea')].sort((a,b)=>(b.clientWidth*b.clientHeight)-(a.clientWidth*a.clientHeight))[0];if(ta)return nativeSet(ta,html);const ed=[...sec.querySelectorAll('[contenteditable="true"]')].sort((a,b)=>(b.clientWidth*b.clientHeight)-(a.clientWidth*a.clientHeight))[0];if(ed){ed.focus();ed.innerHTML=html;ed.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:null}));ed.dispatchEvent(new Event('change',{bubbles:true}));return true}return false}
function photoInput(){return [...document.querySelectorAll('input[type="file"]')].find(x=>x.multiple||/image/i.test(x.accept||''))||document.querySelector('input[type="file"]')}
async function uploadImages(urls){const input=photoInput();if(!input)throw Error('Input foto eBay non trovato');const dt=new DataTransfer();let ok=0;for(let i=0;i<urls.length;i++){const u=urls[i];try{const r=await fetch(u,{mode:'cors',credentials:'omit',cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);const blob=await r.blob();const mime=blob.type||'image/jpeg';const ext=/png/i.test(mime)?'png':/webp/i.test(mime)?'webp':'jpg';dt.items.add(new File([blob],`${itemId}-${String(i+1).padStart(2,'0')}.${ext}`,{type:mime,lastModified:Date.now()}));ok++}catch(e){console.warn('Image fetch failed',u,e)}}if(!ok)throw Error('Nessuna foto scaricabile dal browser');input.files=dt.files;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));return ok}
try{
  const ep=endpoint();if(!ep)throw Error('URL backend mancante.');status.textContent='Recupero listing sorgente e preparazione descrizione AI…';
  const data=await jsonp(ep);if(!data||!data.ok)throw Error(data?.error||'Risposta backend non valida');
  add('Titolo / Item Specifics','ok','lasciati invariati');
  const priceOk=setPrice(data.targetPrice);add('Prezzo',priceOk?'ok':'warn',priceOk?`${Number(data.targetPrice).toFixed(2)} (-2%)`:'campo non trovato');
  const qtyOk=setQuantity(data.quantity);add('Quantità',qtyOk?'ok':'warn',qtyOk?String(data.quantity):'campo non trovato');
  const conditionOk=await setConditionNew();add('Condizione',conditionOk?'ok':'warn',conditionOk?'New':'controlla manualmente');
  await enableHtmlMode();
  const descOk=setDescription(data.descriptionHtml);add('Descrizione',descOk?'ok':'warn',descOk?'template HTML + AI inserito':'editor HTML non trovato');
  status.textContent='Caricamento foto nello stesso ordine…';
  try{const n=await uploadImages(data.images||[]);add('Foto','ok',`${n}/${(data.images||[]).length} inviate all’uploader eBay`)}catch(e){add('Foto','warn',e.message+' — lascia la pagina aperta e verifica manualmente')}
  add('Policy','ok','non modificate');
  add('Pubblicazione','ok','List it lasciato manuale');
  status.innerHTML='<span class="ok">Preparazione completata.</span> Verifica foto, prezzo e descrizione prima di cliccare List it.';
}catch(e){console.error(e);status.innerHTML='<span class="bad">Errore:</span> '+esc(e.message||e);}
})();