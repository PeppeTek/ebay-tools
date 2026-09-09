javascript:(()=>{
'use strict';
const PANEL_ID='capitan-sell-like-clone';
const MODAL_ID='capitan-pricing-modal';
const PATCH_ID='capitan-settings-ui-patch-v2';
const ENDPOINT_KEY='pep-ebay-bs-v6-google-url';
if(document.getElementById(PATCH_ID))return;
const marker=document.createElement('span');marker.id=PATCH_ID;marker.style.display='none';document.documentElement.appendChild(marker);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
let rates={ebayFee:.136,internationalFee:.016,marketingFee:.02,vatOnFees:.22,salesTaxEstimate:.06,fixedFee:.40};

function endpoint(){return (localStorage.getItem(ENDPOINT_KEY)||'').replace(/\/+$/,'')}
function jsonpAction(action,params){const ep=endpoint();return new Promise((resolve,reject)=>{if(!ep)return reject(Error('Endpoint Apps Script non configurato'));const cb='__capitanSettingsCb_'+Date.now()+'_'+Math.floor(Math.random()*1e6),s=document.createElement('script'),t=setTimeout(()=>done(Error('Timeout backend')),30000);function done(err,val){clearTimeout(t);try{delete window[cb]}catch(_){window[cb]=undefined}s.remove();err?reject(err):resolve(val)}window[cb]=v=>done(null,v);s.onerror=()=>done(Error('Backend non raggiungibile'));const q=new URLSearchParams({action,callback:cb,_:Date.now().toString(),...(params||{})});s.src=ep+(ep.includes('?')?'&':'?')+q.toString();document.head.appendChild(s)})}

function ensureHeaderControls(){
  const panel=document.getElementById(PANEL_ID);if(!panel)return false;
  const close=panel.querySelector('[data-close]');if(!close)return false;
  panel.style.position='fixed';
  let controls=panel.querySelector('#capitan-header-controls');
  if(!controls){controls=document.createElement('div');controls.id='capitan-header-controls';controls.style.cssText='position:absolute;top:12px;right:12px;z-index:5;display:flex;align-items:center;gap:7px';panel.appendChild(controls)}
  let gear=controls.querySelector('#capitan-settings-open');
  if(!gear){gear=document.createElement('button');gear.type='button';gear.id='capitan-settings-open';gear.textContent='⚙';gear.title='Impostazioni';gear.setAttribute('aria-label','Impostazioni');gear.addEventListener('click',openSettingsDashboard);controls.appendChild(gear)}
  if(close.parentElement!==controls)controls.appendChild(close);
  const common='width:34px;height:34px;padding:0;border:1px solid #b9b9b9;border-radius:8px;background:#fff;color:#333;display:flex;align-items:center;justify-content:center;cursor:pointer;line-height:1;box-sizing:border-box';
  gear.style.cssText=common+';font-size:20px;font-family:Arial,sans-serif;font-weight:400';
  close.style.cssText=common+';font-size:18px;font-family:Arial,sans-serif;font-weight:400';
  const old=panel.querySelector('#capitan-pricing-open');if(old&&old!==gear)old.remove();
  return true;
}

async function loadRates(){try{const d=await jsonpAction('sell_like_pricing_get');if(d&&d.ok&&d.rates)rates=d.rates}catch(e){console.warn('Sell Like settings rates',e)}return rates}

async function openSettingsDashboard(){
  document.getElementById(MODAL_ID)?.remove();
  const panel=document.getElementById(PANEL_ID);if(!panel)return;
  const logo=panel.querySelector('.brand img')?.src||panel.querySelector('img')?.src||'';
  const overlay=document.createElement('div');overlay.id=MODAL_ID;overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.42);z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:20px;font-family:Arial,sans-serif';
  overlay.innerHTML=`<div style="width:min(620px,94vw);max-height:90vh;overflow:auto;background:#fff;border-radius:14px;box-shadow:0 18px 60px rgba(0,0,0,.28);border:1px solid #d9d9d9"><div style="padding:18px 22px 14px;border-bottom:1px solid #e7e7e7;position:relative">${logo?`<img src="${esc(logo)}" alt="Dropper Analytics" style="display:block;max-width:190px;max-height:58px;object-fit:contain;margin-bottom:12px">`:''}<div style="font-size:19px;font-weight:700;color:#111">Sell Like This v1.4 - Impostazioni</div><button data-close style="position:absolute;right:16px;top:16px;width:32px;height:32px;border:1px solid #bbb;border-radius:8px;background:#fff;cursor:pointer;font-size:18px">×</button></div><div style="display:flex;gap:6px;padding:10px 18px 0;border-bottom:1px solid #e5e7eb;background:#fafafa"><button type="button" aria-selected="true" style="border:0;border-bottom:3px solid #1668e8;background:transparent;color:#1668e8;font-weight:700;font-size:13px;padding:10px 14px 9px;cursor:default">Aggiorna tariffe</button></div><div id="capitan-settings-body" style="padding:18px 22px"><div style="font-size:16px;font-weight:700;color:#111;margin:0 0 7px">Aggiorna tariffe</div><div style="font-size:12px;color:#5f6368;margin-bottom:16px;line-height:1.45">Tariffe utilizzate per il calcolo del Break Even Price. La formula è la stessa utilizzata nella scheda AMAZON_IMPORT.</div><div id="capitan-settings-loading" style="font-size:12px;color:#666">Caricamento tariffe…</div></div></div>`;
  document.body.appendChild(overlay);
  const close=()=>overlay.remove();overlay.querySelector('[data-close]').onclick=close;overlay.addEventListener('click',e=>{if(e.target===overlay)close()});
  await loadRates();if(!document.body.contains(overlay))return;
  const pct=v=>(Number(v||0)*100).toFixed(2);
  const body=overlay.querySelector('#capitan-settings-body');
  body.innerHTML=`<div style="font-size:16px;font-weight:700;color:#111;margin:0 0 7px">Aggiorna tariffe</div><div style="font-size:12px;color:#5f6368;margin-bottom:16px;line-height:1.45">Tariffe utilizzate per il calcolo del Break Even Price. La formula è la stessa utilizzata nella scheda AMAZON_IMPORT.</div><div style="display:grid;grid-template-columns:1fr 150px;gap:11px 14px;align-items:center;font-size:13px"><label>eBay Fee %</label><input data-rate="ebayFee" value="${pct(rates.ebayFee)}"><label>International Fee %</label><input data-rate="internationalFee" value="${pct(rates.internationalFee)}"><label>Marketing Fee %</label><input data-rate="marketingFee" value="${pct(rates.marketingFee)}"><label>VAT on Fees %</label><input data-rate="vatOnFees" value="${pct(rates.vatOnFees)}"><label>Sales Tax Estimate %</label><input data-rate="salesTaxEstimate" value="${pct(rates.salesTaxEstimate)}"><label>eBay Fixed Fee</label><input data-rate="fixedFee" value="${Number(rates.fixedFee||0).toFixed(2)}"></div><div id="capitan-settings-msg" style="min-height:18px;margin-top:14px;font-size:12px"></div><button data-save style="width:100%;height:44px;margin-top:8px;border:0;border-radius:24px;background:#1668e8;color:#fff;font-weight:700;font-size:14px;cursor:pointer">Salva</button>`;
  body.querySelectorAll('input').forEach(i=>i.style.cssText='height:36px;border:1px solid #b9b9b9;border-radius:8px;padding:0 10px;font-size:13px;box-sizing:border-box;width:100%');
  body.querySelector('[data-save]').addEventListener('click',async()=>{const msg=body.querySelector('#capitan-settings-msg');try{const vals={};body.querySelectorAll('[data-rate]').forEach(i=>vals[i.dataset.rate]=Number(String(i.value).replace(',','.')));for(const k of ['ebayFee','internationalFee','marketingFee','vatOnFees','salesTaxEstimate'])if(!isFinite(vals[k])||vals[k]<0||vals[k]>=100)throw Error('Controlla le percentuali inserite.');if(!isFinite(vals.fixedFee)||vals.fixedFee<0)throw Error('Controlla eBay Fixed Fee.');const params={ebayFee:String(vals.ebayFee/100),internationalFee:String(vals.internationalFee/100),marketingFee:String(vals.marketingFee/100),vatOnFees:String(vals.vatOnFees/100),salesTaxEstimate:String(vals.salesTaxEstimate/100),fixedFee:String(vals.fixedFee)};msg.textContent='Salvataggio…';const d=await jsonpAction('sell_like_pricing_save',params);if(!d||!d.ok)throw Error(d?.error||'Salvataggio non riuscito');rates=d.rates||rates;window.dispatchEvent(new CustomEvent('capitan-pricing-saved',{detail:{rates}}));msg.innerHTML='<span style="color:#137333;font-weight:700">Tariffe salvate.</span>'}catch(e){msg.innerHTML='<span style="color:#b42318;font-weight:700">'+esc(e.message||e)+'</span>'}});
}

(async()=>{for(let i=0;i<100;i++){if(ensureHeaderControls())break;await sleep(40)}const obs=new MutationObserver(()=>ensureHeaderControls());obs.observe(document.body,{childList:true,subtree:true})})();
})();