javascript:(async()=>{
'use strict';
const PANEL_ID='capitan-sell-like-clone';
const EXT_ID='capitan-test-ui-v1';
if(document.getElementById(EXT_ID))return;
const marker=document.createElement('span');marker.id=EXT_ID;marker.style.display='none';document.documentElement.appendChild(marker);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

let panel=null,logBody=null,alertChip=null;
const lastStatus=new Map();
const logSeen=new Set();
let warnCount=0;

function now(){
  try{return new Intl.DateTimeFormat('it-IT',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(new Date())}
  catch(_){return new Date().toLocaleTimeString()}
}
function levelColor(level){
  return level==='bad'?'#b42318':level==='warn'?'#a15c00':level==='ok'?'#137333':'#444'
}
function ensureAlertChip(){
  if(!panel)return null;
  const brand=panel.querySelector('.brand');if(!brand)return null;
  if(alertChip&&alertChip.isConnected)return alertChip;
  alertChip=document.createElement('span');
  alertChip.id='capitan-header-alert';
  alertChip.style.cssText='display:none;margin-left:6px;padding:2px 6px;border-radius:10px;background:#fff4e5;color:#a15c00;font:700 10px Arial,sans-serif;white-space:nowrap';
  brand.appendChild(alertChip);
  return alertChip
}
function markAlert(){
  warnCount++;
  const chip=ensureAlertChip();if(!chip)return;
  chip.textContent='⚠ '+warnCount;
  chip.style.display='inline-block'
}
function ensureLog(){
  if(!panel)return false;
  const actions=panel.querySelector('[data-ebay-actions]');
  if(!actions)return false;
  let box=panel.querySelector('#capitan-oplog');
  if(!box){
    box=document.createElement('div');
    box.id='capitan-oplog';
    box.style.cssText='margin-top:4px;border:1px solid #ddd;border-radius:7px;background:#fafafa;overflow:hidden';
    box.innerHTML='<div style="display:grid;grid-template-columns:72px 1fr;padding:4px 7px;border-bottom:1px solid #e5e5e5;color:#666;font:700 10px ui-monospace,SFMono-Regular,Consolas,monospace"><span>ORA</span><span>LOG OPERAZIONI</span></div><div id="capitan-oplog-body" style="height:74px;overflow-y:auto;padding:2px 0;font:10px/1.25 ui-monospace,SFMono-Regular,Consolas,monospace"></div>';
    actions.appendChild(box)
  }
  logBody=box.querySelector('#capitan-oplog-body');
  return !!logBody
}
function log(msg,level='info'){
  msg=clean(msg);if(!msg)return;
  const key=level+'|'+msg;
  if(logSeen.has(key))return;
  logSeen.add(key);
  if(logSeen.size>160){const first=logSeen.values().next().value;logSeen.delete(first)}
  if(!ensureLog())return;
  const row=document.createElement('div');
  row.style.cssText='display:grid;grid-template-columns:72px 1fr;gap:0;padding:3px 7px;border-bottom:1px solid #eee;color:'+levelColor(level);
  row.innerHTML='<span>'+esc(now())+'</span><span>'+esc(msg)+'</span>';
  logBody.appendChild(row);
  logBody.scrollTop=logBody.scrollHeight;
  if(level==='warn'||level==='bad')markAlert()
}
window.__capitanLog=log;

function compactHeader(){
  if(!panel)return;
  panel.style.height='calc(100vh - 24px)';
  panel.style.maxHeight='calc(100vh - 24px)';
  panel.style.overflow='hidden';

  const brand=panel.querySelector('.brand');
  const img=brand&&brand.querySelector('img');
  const h=panel.querySelector('.h');
  const title=h&&h.querySelector('.title');
  const timer=panel.querySelector('#capitan-process-timer');
  const badge=panel.querySelector('#capitan-test-badge');

  if(brand){
    brand.style.cssText='position:relative;display:flex;flex-direction:column;align-items:flex-start;width:max-content;padding:8px 14px 0';
  }
  if(img){
    img.style.maxHeight='48px';img.style.maxWidth='176px';img.style.height='auto';
  }
  if(timer&&brand&&timer.parentNode!==brand){
    brand.appendChild(timer)
  }
  if(timer){
    timer.style.cssText='align-self:flex-end;margin-top:-2px;margin-right:2px;border:0;background:transparent;color:#555;font:700 10px/15px ui-monospace,SFMono-Regular,Consolas,monospace;padding:0;min-width:0;height:15px;letter-spacing:0';
  }
  if(h){
    h.style.cssText='display:flex;align-items:center;gap:7px;padding:5px 76px 7px 14px;border-bottom:1px solid #ddd;min-height:32px;font-weight:700;font-size:16px';
  }
  if(title){
    title.style.cssText='font-weight:700;font-size:16px;line-height:1.1;white-space:nowrap';
  }
  if(badge&&h){
    if(badge.parentNode!==h)h.insertBefore(badge,title?title.nextSibling:h.firstChild);
    badge.style.cssText='display:inline-flex;margin:0;padding:2px 6px;border:1px solid #d38b28;border-radius:9px;background:#fff7e6;color:#8a4b00;font:700 9px/14px Arial,sans-serif;letter-spacing:.25px;white-space:nowrap';
    badge.textContent='TEST'
  }
  const b=panel.querySelector('.b');
  if(b)b.style.padding='7px 14px 5px';
}

function routineRows(){
  if(!panel)return;
  const hidden=/^(Quantità|Condizione|Item Location|Descrizione|Foto):/i;
  [...panel.querySelectorAll('#steps .row')].forEach(r=>{
    const t=clean(r.innerText||r.textContent);
    if(!hidden.test(t))return;
    const isProblem=!!r.querySelector('.warn,.bad')||/controlla|errore|non recuper|non trovato|fallit|impossibile/i.test(t);
    if(isProblem){
      log(t,r.querySelector('.bad')?'bad':'warn')
    }
    r.style.display='none'
  });
  const st=panel.querySelector('#st');
  if(st)st.style.display='none'
}
function classifyStatus(t){
  if(/errore|fallit|non disponibile|non recuper|attenzione/i.test(t))return 'warn';
  if(/completat|pronto|inserit|salvat|trov|caricat|generat/i.test(t))return 'ok';
  return 'info'
}
function scanStatuses(){
  if(!panel)return;
  ['#st','#capitan-aliexpress-status','#capitan-amazon-status'].forEach(sel=>{
    const el=panel.querySelector(sel);if(!el)return;
    const t=clean(el.innerText||el.textContent);
    if(!t||lastStatus.get(sel)===t)return;
    lastStatus.set(sel,t);
    if(sel==='#st'||/completat|errore|fallit|non disponibile|aggiunt|inserit|aperta|pronto/i.test(t)){
      log(t,classifyStatus(t))
    }
  })
}
function placeLog(){
  ensureLog()
}
function apply(){
  panel=document.getElementById(PANEL_ID);if(!panel)return false;
  compactHeader();routineRows();placeLog();scanStatuses();
  return true
}
for(let i=0;i<100&&!apply();i++)await sleep(50);
if(!panel)return;

log('Ambiente TEST avviato','info');
const obs=new MutationObserver(()=>{compactHeader();routineRows();placeLog();scanStatuses()});
obs.observe(panel,{subtree:true,childList:true,characterData:true});

window.addEventListener('capitan-ai-description-updated',()=>log('Template AI-HTML incluso','ok'));
window.addEventListener('capitan-sale-price-updated',e=>{
  const v=Number(e&&e.detail&&e.detail.value);
  if(isFinite(v))log('Prezzo di vendita aggiornato: '+v.toFixed(2)+' USD','ok')
});
})();