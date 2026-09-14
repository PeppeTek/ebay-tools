javascript:(async()=>{
'use strict';
const PANEL_ID='capitan-sell-like-clone';
const EXT_ID='capitan-test-ui-v2';
if(document.getElementById(EXT_ID))return;
const marker=document.createElement('span');marker.id=EXT_ID;marker.style.display='none';document.documentElement.appendChild(marker);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
let panel=null,logBody=null,alertChip=null;
const seen=new Set();
const lastStatus=new Map();
let alertCount=0;

function stamp(){try{return new Intl.DateTimeFormat('it-IT',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(new Date())}catch(_){return new Date().toLocaleTimeString()}}
function levelColor(l){return l==='bad'?'#b42318':l==='warn'?'#a15c00':l==='ok'?'#137333':'#444'}

function header(){
  if(!panel)return;
  const brand=panel.querySelector('.brand');
  const logo=brand&&brand.querySelector('img');
  const titleRow=panel.querySelector('.h');
  const title=titleRow&&titleRow.querySelector('.title,span');
  const badge=panel.querySelector('#capitan-test-badge');
  const timer=panel.querySelector('#capitan-process-timer');

  if(brand){
    brand.style.padding='7px 14px 0';
    brand.style.margin='0';
    brand.style.position='relative';
    brand.style.minHeight='52px';
    brand.style.display='block'
  }
  if(logo){
    logo.style.maxWidth='176px';
    logo.style.maxHeight='48px';
    logo.style.height='auto'
  }
  if(timer&&brand&&timer.parentNode!==brand)brand.appendChild(timer);
  if(timer){
    timer.style.cssText='position:absolute;right:2px;bottom:0;border:0;background:transparent;color:#555;font:700 10px/14px ui-monospace,SFMono-Regular,Consolas,monospace;padding:0;margin:0;min-width:0;height:14px;box-shadow:none'
  }
  if(titleRow){
    titleRow.style.cssText='display:flex;align-items:center;gap:7px;padding:4px 76px 7px 14px;border-bottom:1px solid #ddd;min-height:31px'
  }
  if(title){
    title.style.fontSize='16px';
    title.style.fontWeight='700';
    title.style.lineHeight='1.1';
    title.style.whiteSpace='nowrap'
  }
  if(badge&&titleRow){
    if(badge.parentNode!==titleRow){
      if(title&&title.nextSibling)titleRow.insertBefore(badge,title.nextSibling);
      else titleRow.appendChild(badge)
    }
    badge.textContent='TEST';
    badge.style.cssText='display:inline-flex;margin:0;padding:1px 6px;border:1px solid #d38b28;border-radius:9px;background:#fff7e6;color:#8a4b00;font:700 9px/14px Arial,sans-serif;letter-spacing:.2px;white-space:nowrap'
  }
  const body=panel.querySelector('.b');
  if(body){body.style.paddingTop='6px';body.style.paddingBottom='4px'}
}
function ensureAlert(){
  if(!panel)return null;
  const brand=panel.querySelector('.brand');if(!brand)return null;
  if(alertChip&&alertChip.isConnected)return alertChip;
  alertChip=document.createElement('span');
  alertChip.id='capitan-header-alert';
  alertChip.style.cssText='display:none;position:absolute;left:183px;bottom:2px;padding:1px 5px;border-radius:9px;background:#fff4e5;color:#a15c00;font:700 9px/13px Arial,sans-serif';
  brand.appendChild(alertChip);
  return alertChip
}
function alert(){
  alertCount++;
  const x=ensureAlert();if(!x)return;
  x.textContent='⚠ '+alertCount;x.style.display='inline-flex'
}
function ensureLog(){
  const actions=panel&&panel.querySelector('[data-ebay-actions]');
  if(!actions)return false;
  let box=panel.querySelector('#capitan-oplog');
  if(!box){
    box=document.createElement('div');
    box.id='capitan-oplog';
    box.style.cssText='margin-top:4px;border:1px solid #ddd;border-radius:7px;background:#fafafa;overflow:hidden';
    box.innerHTML='<div style="display:grid;grid-template-columns:68px 1fr;padding:3px 7px;border-bottom:1px solid #e5e5e5;color:#666;font:700 9px ui-monospace,SFMono-Regular,Consolas,monospace"><span>ORA</span><span>LOG OPERAZIONI</span></div><div id="capitan-oplog-body" style="height:68px;overflow-y:auto;padding:1px 0;font:9px/1.25 ui-monospace,SFMono-Regular,Consolas,monospace"></div>';
    actions.appendChild(box)
  }
  logBody=box.querySelector('#capitan-oplog-body');
  return !!logBody
}
function log(msg,level='info'){
  msg=clean(msg);if(!msg)return;
  const key=level+'|'+msg;if(seen.has(key))return;seen.add(key);
  if(!ensureLog())return;
  const row=document.createElement('div');
  row.style.cssText='display:grid;grid-template-columns:68px 1fr;padding:2px 7px;border-bottom:1px solid #eee;color:'+levelColor(level);
  row.innerHTML='<span>'+esc(stamp())+'</span><span>'+esc(msg)+'</span>';
  logBody.appendChild(row);logBody.scrollTop=logBody.scrollHeight;
  if(level==='warn'||level==='bad')alert()
}
window.__capitanLog=log;

function hideRoutineRows(){
  if(!panel)return;
  const re=/^(Quantità|Condizione|Item Location|Descrizione|Foto):/i;
  [...panel.querySelectorAll('#steps .row')].forEach(r=>{
    const t=clean(r.innerText||r.textContent);if(!re.test(t))return;
    const bad=!!r.querySelector('.warn,.bad')||/errore|fallit|non recuper|non trovato|controlla|impossibile/i.test(t);
    if(bad)log(t,r.querySelector('.bad')?'bad':'warn');
    r.style.display='none'
  })
}
function statusLevel(t){
  if(/errore|fallit|non disponibile|non recuper|attenzione|warning/i.test(t))return'warn';
  if(/completat|pronto|inserit|salvat|aggiunt|generat|caricat/i.test(t))return'ok';
  return'info'
}
function scan(){
  if(!panel)return;
  const sels=['#st','#capitan-aliexpress-status','#capitan-amazon-status','#capitan-variants-auto-status'];
  sels.forEach(sel=>{
    const el=panel.querySelector(sel);if(!el)return;
    const t=clean(el.innerText||el.textContent);if(!t||lastStatus.get(sel)===t)return;
    lastStatus.set(sel,t);
    if(/completat|pronto|errore|fallit|non disponibile|aggiunt|inserit|generat/i.test(t))log(t,statusLevel(t));
    if(sel==='#st')el.style.display='none'
  })
}
function apply(){
  panel=document.getElementById(PANEL_ID);if(!panel)return false;
  header();ensureLog();hideRoutineRows();scan();
  return true
}
for(let i=0;i<80&&!apply();i++)await sleep(75);
if(!panel)return;
log('Ambiente TEST pronto','ok');
const obs=new MutationObserver(()=>{header();ensureLog();hideRoutineRows();scan()});
obs.observe(panel,{subtree:true,childList:true,characterData:true});
window.addEventListener('capitan-ai-description-updated',()=>log('Template AI-HTML incluso','ok'));
window.addEventListener('capitan-sale-price-updated',e=>{const v=Number(e&&e.detail&&e.detail.value);if(isFinite(v))log('Prezzo di vendita aggiornato: '+v.toFixed(2)+' USD','ok')});
})();