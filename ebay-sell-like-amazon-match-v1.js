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
const wrap=document.createElement('div');wrap.id=EXT_ID;wrap.className='row';wrap.innerHTML='<button id="capitan-amazon-find" style="width:100%;padding:9px 10px;border:1px solid #aaa;border-radius:7px;background:#fff;cursor:pointer;font-weight:700">Trova su Amazon</button><div id="capitan-amazon-status" class="muted" style="padding-top:7px"></div><div id="capitan-amazon-results"></div>';
const body=panel.querySelector('.b')||panel;body.appendChild(wrap);
const btn=wrap.querySelector('#capitan-amazon-find'),status=wrap.querySelector('#capitan-amazon-status'),results=wrap.querySelector('#capitan-amazon-results');
function endpoint(){return (localStorage.getItem(ENDPOINT_KEY)||'').replace(/\/+$/,'')}
function jsonp(ep){return new Promise((resolve,reject)=>{const cb='__capitanAmazonCb_'+Date.now()+'_'+Math.floor(Math.random()*1e6),s=document.createElement('script'),t=setTimeout(()=>done(Error('Timeout backend Amazon')),90000);function done(err,val){clearTimeout(t);try{delete window[cb]}catch(_){window[cb]=undefined}s.remove();err?reject(err):resolve(val)}window[cb]=v=>done(null,v);s.onerror=()=>done(Error('Backend Amazon non raggiungibile'));s.src=ep+(ep.includes('?')?'&':'?')+'action=amazon_match&itemId='+encodeURIComponent(itemId)+'&callback='+encodeURIComponent(cb)+'&_='+Date.now();document.head.appendChild(s)})}
function render(list){results.innerHTML='';if(!Array.isArray(list)||!list.length){results.innerHTML='<div class="row warn">Nessun match Amazon trovato.</div>';return}const box=document.createElement('div');box.style.cssText='margin-top:8px;border:1px solid #ddd;border-radius:8px;overflow:hidden';list.slice(0,5).forEach((x,i)=>{const r=document.createElement('label');r.style.cssText='display:grid;grid-template-columns:24px 1fr auto;gap:8px;align-items:center;padding:8px 9px;border-bottom:'+(i===Math.min(list.length,5)-1?'0':'1px solid #eee')+';cursor:pointer';const price=x.price==null||x.price===''?'—':`${Number(x.price).toFixed(2)} ${esc(x.currency||'USD')}`;r.innerHTML=`<input type="radio" name="capitan-amazon-choice" value="${esc(x.asin||'')}" ${i===0?'checked':''}><a href="${esc(x.url||('https://www.amazon.com/dp/'+(x.asin||'')))}" target="_blank" rel="noopener" style="color:#111;text-decoration:none"><b>${esc(x.asin||'')}</b></a><span>${price}</span>`;box.appendChild(r)});results.appendChild(box)}
btn.addEventListener('click',async()=>{const ep=endpoint();if(!ep){status.innerHTML='<span class="bad">Endpoint Apps Script non configurato.</span>';return}btn.disabled=true;status.textContent='Analisi eBay + ricerca Amazon in corso…';results.innerHTML='';try{const data=await jsonp(ep);if(!data||!data.ok)throw Error(data?.error||'Risposta Amazon non valida');render(data.matches||[]);status.innerHTML='<span class="ok">Match completato.</span> Risultati ordinati dal più probabile.'}catch(e){console.error(e);status.innerHTML='<span class="bad">Errore:</span> '+esc(e.message||e)}finally{btn.disabled=false}});
})();