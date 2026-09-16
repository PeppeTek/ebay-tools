javascript:(()=>{
'use strict';
if(!window.__capitanSellLikeProdMode)return;
const PANEL_ID='capitan-sell-like-clone';
const PATCH_ID='capitan-prod-ui-v1';
if(document.getElementById(PATCH_ID))return;
const marker=document.createElement('span');marker.id=PATCH_ID;marker.style.display='none';document.documentElement.appendChild(marker);
const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const now=()=>new Date().toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
let lastStatus='',seenClicks=new WeakSet(),shippingFallbackPromise=null;

const style=document.createElement('style');
style.id='capitan-prod-ui-style';
style.textContent=`
#${PANEL_ID}{width:500px!important;min-width:500px!important;max-width:none!important;overflow:hidden!important}
#${PANEL_ID} #capitan-sourcing-scroll{display:none;grid-template-columns:1fr;gap:7px;max-height:min(330px,calc(100vh - 470px));overflow-y:auto;overflow-x:hidden;padding:0 0 10px;margin:0 0 8px;scrollbar-gutter:stable;scroll-padding-bottom:12px}
#${PANEL_ID} #capitan-sourcing-scroll>#capitan-aliexpress-match-ext,#${PANEL_ID} #capitan-sourcing-scroll>#capitan-amazon-match-ext{margin:0!important;padding:0 14px!important}
#${PANEL_ID} #capitan-aliexpress-results>div,#${PANEL_ID} #capitan-amazon-results>div{gap:7px!important}
#${PANEL_ID} #capitan-aliexpress-results label>div:last-child,#${PANEL_ID} #capitan-amazon-results label>div:last-child{align-self:start!important;margin:0!important;padding-top:0!important;position:relative!important;top:-1px!important}
#${PANEL_ID} #capitan-aliexpress-match-ext+#capitan-amazon-match-ext{margin-top:0!important}
#${PANEL_ID} .h{padding:6px 72px 5px 12px!important;min-height:36px!important;gap:7px!important;font-size:13px!important}
#${PANEL_ID} #capitan-discount-row,#${PANEL_ID} #capitan-sale-price-row,#${PANEL_ID} #capitan-margin-break,#${PANEL_ID} #capitan-break-even-row,#${PANEL_ID} #capitan-margin-source,#${PANEL_ID} #capitan-margin-delta{min-height:38px!important;padding:5px 0!important}
#${PANEL_ID} .h .title{font-size:13px!important}
#${PANEL_ID} .brand{padding:7px 12px 0!important}
#${PANEL_ID} .brand img{height:38px!important;width:auto!important;max-width:180px!important;max-height:38px!important;object-fit:contain!important;animation:none!important;transition:none!important;opacity:.94}
#${PANEL_ID} #capitan-process-timer{color:#555!important;box-shadow:none!important}
${PANEL_ID} [data-ebay-actions]{position:relative!important;bottom:auto!important}
${PANEL_ID} #capitan-discount-manual,${PANEL_ID} #capitan-sale-price-manual,${PANEL_ID} #capitan-purchase-cost-manual{border-color:#c5c9cf!important;box-shadow:none!important}
${PANEL_ID} #capitan-amazon-results [data-product-body],${PANEL_ID} #capitan-aliexpress-results [data-product-body]{height:76px!important;max-height:76px!important;overflow:hidden!important}
${PANEL_ID} #capitan-amazon-results [data-card-title],${PANEL_ID} #capitan-aliexpress-results [data-card-title]{overflow:hidden!important}
${PANEL_ID} #capitan-amazon-results [data-card-shipping],${PANEL_ID} #capitan-aliexpress-results [data-card-shipping]{min-width:0!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}
#${PANEL_ID} #st{display:none!important}
#${PANEL_ID} #capitan-test-log{margin-top:2px;border-top:1px solid #e7e7e7;padding-top:7px}
#${PANEL_ID} #capitan-test-log-title{display:flex;align-items:center;justify-content:space-between;font-size:10px;font-weight:700;color:#666;margin-bottom:5px}
#${PANEL_ID} #capitan-test-log-body{max-height:115px;overflow:auto;border:1px solid #e5e7eb;border-radius:7px;background:#fafafa;padding:5px 7px;font:10px/1.35 ui-monospace,SFMono-Regular,Consolas,monospace}
#${PANEL_ID} .capitan-log-row{padding:2px 0;border-bottom:1px dotted #e2e2e2;color:#555}
#${PANEL_ID} .capitan-log-row:last-child{border-bottom:0}
#${PANEL_ID} .capitan-log-ok{color:#137333}
#${PANEL_ID} .capitan-log-warn{color:#a15c00}
#${PANEL_ID} .capitan-log-bad{color:#b42318}
`;
document.head.appendChild(style);

function panel(){return document.getElementById(PANEL_ID)}
function log(message,state='ok'){
  const p=panel();if(!p)return;
  ensureUi();
  const body=p.querySelector('#capitan-test-log-body');if(!body)return;
  const msg=clean(message);if(!msg)return;
  const row=document.createElement('div');row.className='capitan-log-row capitan-log-'+state;
  row.innerHTML='<span style="color:#888">['+esc(now())+']</span> '+esc(msg);
  body.appendChild(row);
  while(body.children.length>80)body.firstElementChild?.remove();
  body.scrollTop=body.scrollHeight
}
window.__capitanTestLog=log;
try{
  const pending=Array.isArray(window.__capitanPendingTestLogs)?window.__capitanPendingTestLogs.splice(0):[];
  pending.forEach(x=>log(x&&x.message||'',x&&x.state||'ok'))
}catch(_){};

function shippingCostFromLabel(label,price){
  label=clean(label);price=Number(price);
  let m=label.match(/free\s+shipping\s+(?:over|above)\s*\$\s*([0-9]+(?:[.,][0-9]{1,2})?)/i);
  if(m){const t=Number(String(m[1]).replace(',','.'));return isFinite(price)&&price>=t?0:1.99}
  if(/^free\s+shipping$/i.test(label))return 0;
  m=label.match(/\$\s*([0-9]+(?:[.,][0-9]{1,2})?)/);
  return m?Number(String(m[1]).replace(',','.')):null
}
function hydrateShippingCards(){
  return
}
function hideOkRows(){
  const p=panel();if(!p)return;
  const re=/^(Quantit[aà]|Condizione|Item Location|Descrizione|Foto):/i;
  [...p.querySelectorAll('#steps .row')].forEach(r=>{
    const t=clean(r.innerText||r.textContent||'');
    if(!re.test(t))return;
    if(t&&r.dataset.prodLogText!==t){
      r.dataset.prodLogText=t;
      const span=r.querySelector('span');
      const state=span?.classList.contains('bad')?'bad':span?.classList.contains('warn')?'warn':'ok';
      log(t,state)
    }
    r.style.display='none'
  })
}
function ensureUi(){
  const p=panel();if(!p)return false;
  p.style.width='500px';p.style.minWidth='500px';p.style.maxWidth='none';
  const sourceRow=[...p.querySelectorAll('.b > .row,.row')].find(r=>/^Source Item ID:/i.test(clean(r.innerText||r.textContent||'')));
  if(sourceRow){sourceRow.style.minHeight='38px';sourceRow.style.display='flex';sourceRow.style.alignItems='center';sourceRow.style.padding='5px 0'}
  const timer=p.querySelector('#capitan-process-timer');
  p.querySelector('#capitan-analytics-strip')?.remove();
  const controls=p.querySelector('#capitan-header-controls');
  if(timer&&controls&&timer.parentElement!==controls)controls.appendChild(timer);
  const actions=p.querySelector('[data-ebay-actions]');
  if(actions&&!p.querySelector('#capitan-test-log')){
    const wrap=document.createElement('div');wrap.id='capitan-test-log';
    wrap.innerHTML='<div id="capitan-test-log-title"><span>Operational log</span><span></span></div><div id="capitan-test-log-body"></div>';
    actions.appendChild(wrap);
    log('Ambiente PROD inizializzato','ok')
  }
  const ali=p.querySelector('#capitan-aliexpress-match-ext'),amz=p.querySelector('#capitan-amazon-match-ext');
  if((ali||amz)&&actions){
    let sc=p.querySelector('#capitan-sourcing-scroll');
    if(!sc){sc=document.createElement('div');sc.id='capitan-sourcing-scroll';actions.parentNode.insertBefore(sc,actions)}
    if(ali&&ali.parentElement!==sc)sc.appendChild(ali);
    if(amz&&amz.parentElement!==sc)sc.appendChild(amz);
    const hasAli=!!ali?.querySelector('.capitan-aliexpress-choice');
    const hasAmz=!!amz?.querySelector('.capitan-amazon-choice');
    sc.style.display=(hasAli||hasAmz)?'grid':'none'
  }
  hideOkRows();
  return true
}

function wireButtons(){
  const p=panel();if(!p)return;
  p.querySelectorAll('button').forEach(btn=>{
    if(seenClicks.has(btn))return;seenClicks.add(btn);
    btn.addEventListener('click',()=>{
      const txt=clean(btn.textContent||btn.getAttribute('aria-label')||'azione');
      if(txt)log('Click: '+txt,'ok')
    },true)
  })
}

function observeStatus(){
  const p=panel(),st=p?.querySelector('#st');if(!st||st.dataset.testObserved==='1')return;
  st.dataset.testObserved='1';
  const read=()=>{
    const t=clean(st.innerText||st.textContent||'');
    if(t&&t!==lastStatus){
      lastStatus=t;
      log(t,/errore|fallit|non avviata/i.test(t)?'bad':/attesa|corso|verifica|warn/i.test(t)?'warn':'ok');
      st.textContent=''
    }
  };
  new MutationObserver(read).observe(st,{childList:true,subtree:true,characterData:true});read()
}

window.addEventListener('capitan-ai-description-updated',()=>log('Template AI-HTML generato','ok'));
window.addEventListener('capitan-pricing-saved',()=>log('Tariffe aggiornate','ok'));
window.addEventListener('capitan-shipping-policy-updated',e=>log('Shipping aggiornato: '+clean(e.detail?.target||e.detail?.shipping||''),'ok'));
window.addEventListener('capitan-sale-price-updated',e=>log('Prezzo di vendita aggiornato: '+Number(e.detail?.value||0).toFixed(2)+' USD','ok'));
window.addEventListener('capitan-sell-like-ui-ready',()=>{ensureUi();wireButtons();observeStatus();log('UI pronta','ok')});

document.addEventListener('change',e=>{
  if(e.target?.matches('input.capitan-amazon-choice,input.capitan-aliexpress-choice'))log('Prodotto sourcing '+(e.target.checked?'selezionato':'deselezionato'),'ok')
},true);

const obs=new MutationObserver(()=>{ensureUi();wireButtons();observeStatus()});
obs.observe(document.body,{childList:true,subtree:true});
ensureUi();wireButtons();observeStatus();
})();