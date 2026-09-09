javascript:(()=>{
'use strict';
const PANEL_ID='capitan-sell-like-clone';
const ENDPOINT_KEY='pep-ebay-bs-v6-google-url';
const PATCH_ID='capitan-break-even-fix-v1';
if(document.getElementById(PATCH_ID))return;
const marker=document.createElement('span');marker.id=PATCH_ID;marker.style.display='none';document.documentElement.appendChild(marker);
const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
let rates={ebayFee:.136,internationalFee:.016,marketingFee:.02,vatOnFees:.22,salesTaxEstimate:.06,fixedFee:.40};
function endpoint(){return (localStorage.getItem(ENDPOINT_KEY)||'').replace(/\/+$/,'')}
function jsonpAction(action){const ep=endpoint();return new Promise((resolve,reject)=>{if(!ep)return reject(Error('Endpoint Apps Script non configurato'));const cb='__capitanBeCb_'+Date.now()+'_'+Math.floor(Math.random()*1e6),s=document.createElement('script'),t=setTimeout(()=>done(Error('Timeout backend')),30000);function done(err,val){clearTimeout(t);try{delete window[cb]}catch(_){window[cb]=undefined}s.remove();err?reject(err):resolve(val)}window[cb]=v=>done(null,v);s.onerror=()=>done(Error('Backend non raggiungibile'));const q=new URLSearchParams({action,callback:cb,_:Date.now().toString()});s.src=ep+(ep.includes('?')?'&':'?')+q.toString();document.head.appendChild(s)})}
function salePrice(){const p=document.getElementById(PANEL_ID);if(!p)return null;const row=[...p.querySelectorAll('#steps .row')].find(r=>/^Prezzo:/i.test(clean(r.innerText||r.textContent)));const t=clean(row?.innerText||row?.textContent||p.innerText||'');const m=t.match(/Prezzo:\s*([0-9]+(?:[.,][0-9]+)?)/i);return m?Number(m[1].replace(',','.')):null}
function calc(s,r){s=Number(s);if(!isFinite(s)||s<=0)return null;const feeRate=(r.ebayFee||0)+(r.internationalFee||0)+(r.marketingFee||0);const variable=(1+(r.salesTaxEstimate||0))*feeRate*(1+(r.vatOnFees||0));const fixed=(r.fixedFee||0)*(1+(r.vatOnFees||0));const v=(s*(1-variable))-fixed;return v>0?Math.round(v*100)/100:null}
function ensureRow(){const p=document.getElementById(PANEL_ID);const steps=p?.querySelector('#steps');if(!steps)return null;let row=p.querySelector('#capitan-break-even-row');if(!row){const pr=[...steps.querySelectorAll('.row')].find(r=>/^Prezzo:/i.test(clean(r.innerText||r.textContent)));row=document.createElement('div');row.id='capitan-break-even-row';row.className='row';row.innerHTML='<b>Break Even Price:</b> <span id="capitan-break-even-value">—</span>';if(pr)pr.insertAdjacentElement('afterend',row);else steps.prepend(row)}const old=row.querySelector('#capitan-pricing-open');if(old)old.remove();return row.querySelector('#capitan-break-even-value')}
function refresh(){const el=ensureRow();if(!el)return false;const sp=salePrice();const v=calc(sp,rates);el.textContent=v==null?'—':`${v.toFixed(2)} USD`;const danger=v!=null&&isFinite(sp)&&v>sp;el.style.color=danger?'#b42318':'';el.style.fontWeight=danger?'700':'';return v!=null}
async function load(){refresh();try{const d=await jsonpAction('sell_like_pricing_get');if(d&&d.ok&&d.rates)rates=d.rates}catch(e){console.warn('Break Even pricing',e)}refresh()}
window.addEventListener('capitan-pricing-saved',e=>{if(e.detail?.rates)rates=e.detail.rates;refresh()});
let tries=0;const timer=setInterval(()=>{tries++;if(refresh()||tries>200)clearInterval(timer)},100);
load();
})();