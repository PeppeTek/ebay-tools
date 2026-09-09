javascript:(()=>{
'use strict';
const PANEL_ID='capitan-sell-like-clone';
const ENDPOINT_KEY='pep-ebay-bs-v6-google-url';
const EXT_ID='capitan-amazon-match-ext';
const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const panel=document.getElementById(PANEL_ID);if(!panel||document.getElementById(EXT_ID))return;
const sourceText=clean(panel.innerText||'');
const itemId=(sourceText.match(/Source Item ID:\s*(\d{9,12})/i)||[])[1]||'';
if(!itemId)return;
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
function endpoint(){return (localStorage.getItem(ENDPOINT_KEY)||'').replace(/\/+$/,'')}
function jsonp(ep){return new Promise((resolve,reject)=>{const cb='__capitanAmazonCb_'+Date.now()+'_'+Math.floor(Math.random()*1e6),s=document.createElement('script'),t=setTimeout(()=>done(Error('Timeout backend Amazon')),90000);function done(err,val){clearTimeout(t);try{delete window[cb]}catch(_){window[cb]=undefined}s.remove();err?reject(err):resolve(val)}window[cb]=v=>done(null,v);s.onerror=()=>done(Error('Backend Amazon non raggiungibile'));s.src=ep+(ep.includes('?')?'&':'?')+'action=amazon_match&itemId='+encodeURIComponent(itemId)+'&callback='+encodeURIComponent(cb)+'&_='+Date.now();document.head.appendChild(s)})}
function render(list){results.innerHTML='';if(!Array.isArray(list)||!list.length){results.innerHTML='<div style="padding:6px 0;color:#a15c00;font-size:12px;font-weight:700">Nessun match Amazon sufficientemente affidabile.</div>';return}const box=document.createElement('div');box.style.cssText='margin-top:8px;border:1px solid #ddd;border-radius:8px;overflow:hidden';list.slice(0,5).forEach((x,i)=>{const r=document.createElement('label');r.style.cssText='display:grid;grid-template-columns:24px 1fr auto;gap:8px;align-items:center;padding:8px 9px;border-bottom:'+(i===Math.min(list.length,5)-1?'0':'1px solid #eee')+';cursor:pointer;font-size:12px';const price=x.price==null||x.price===''?'—':`${Number(x.price).toFixed(2)} ${esc(x.currency||'USD')}`;r.innerHTML=`<input type="checkbox" class="capitan-amazon-choice" value="${esc(x.asin||'')}" ${i===0?'checked':''} style="width:16px;height:16px;border-radius:0;accent-color:#111"><a href="${esc(x.url||('https://www.amazon.com/dp/'+(x.asin||'')))}" target="_blank" rel="noopener" style="color:#111;text-decoration:none"><b>${esc(x.asin||'')}</b></a><span>${price}</span>`;box.appendChild(r)});results.appendChild(box)}
function selectedAsins(){return [...results.querySelectorAll('input.capitan-amazon-choice:checked')].map(x=>clean(x.value)).filter(Boolean)}
function findSkuField(){
  const re=/^\*?\s*custom\s+label\s*\(sku\)\s*$/i;
  for(const l of document.querySelectorAll('label')){const t=clean(l.innerText||l.textContent);if(!re.test(t))continue;let el=l.htmlFor?document.getElementById(l.htmlFor):l.querySelector('input,textarea');if(el)return el;let p=l.parentElement;for(let i=0;i<5&&p;i++,p=p.parentElement){el=p.querySelector('input,textarea');if(el)return el}}
  return [...document.querySelectorAll('input,textarea')].find(el=>re.test(clean([el.name,el.id,el.getAttribute('aria-label'),el.placeholder].join(' '))))||null;
}
function setNativeValue(el,value){if(!el)return false;const proto=el instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;const setter=Object.getOwnPropertyDescriptor(proto,'value')?.set;const old=el.value;if(setter)setter.call(el,String(value));else el.value=String(value);if(el._valueTracker&&typeof el._valueTracker.setValue==='function')el._valueTracker.setValue(old);el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));el.blur?.();return true}
insertBtn.addEventListener('click',()=>{const asins=selectedAsins();if(!asins.length){status.innerHTML='<span style="color:#b42318;font-weight:700">Seleziona almeno un ASIN.</span>';return}const field=findSkuField();if(!field){status.innerHTML='<span style="color:#b42318;font-weight:700">Campo Custom label (SKU) non trovato.</span>';return}const value=asins.join(' - ');if(setNativeValue(field,value))status.innerHTML='<span style="color:#137333;font-weight:700">ASIN inseriti:</span> '+esc(value)});
findBtn.addEventListener('click',async()=>{const ep=endpoint();if(!ep){status.innerHTML='<span style="color:#b42318;font-weight:700">Endpoint Apps Script non configurato.</span>';return}findBtn.disabled=true;status.textContent='Analisi titolo e ricerca Amazon in corso…';results.innerHTML='';try{const data=await jsonp(ep);if(!data||!data.ok)throw Error(data?.error||'Risposta Amazon non valida');render(data.matches||[]);status.innerHTML='<span style="color:#137333;font-weight:700">Match completato.</span> Sono mostrati solo candidati compatibili.'}catch(e){console.error(e);status.innerHTML='<span style="color:#b42318;font-weight:700">Errore:</span> '+esc(e.message||e)}finally{findBtn.disabled=false}});
})();