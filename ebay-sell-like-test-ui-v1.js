javascript:(()=>{
'use strict';
if(!window.__capitanSellLikeTestMode)return;
const PANEL_ID='capitan-sell-like-clone';
const PATCH_ID='capitan-test-ui-v1';
if(document.getElementById(PATCH_ID))return;
const marker=document.createElement('span');marker.id=PATCH_ID;marker.style.display='none';document.documentElement.appendChild(marker);
const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const now=()=>new Date().toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
let lastStatus='',seenClicks=new WeakSet(),shippingFallbackPromise=null;

const style=document.createElement('style');
style.id='capitan-test-ui-style';
style.textContent=`
#${PANEL_ID} .h{padding:6px 72px 5px 12px!important;min-height:36px!important;gap:7px!important;font-size:13px!important}
#${PANEL_ID} .h .title{font-size:13px!important}
#${PANEL_ID} .brand{padding:7px 12px 0!important}
#${PANEL_ID} .brand img{max-height:38px!important;opacity:.94}
#${PANEL_ID} #capitan-test-badge{display:inline-flex;align-items:center;height:19px;padding:0 7px;border-radius:999px;background:#fff3cd;color:#7a5200;border:1px solid #f1d27a;font:700 10px/19px Arial,sans-serif;letter-spacing:.5px}
#${PANEL_ID} #capitan-analytics-strip{display:flex;align-items:center;gap:5px;margin-top:3px;color:#777;font:600 10px/20px Arial,sans-serif}
#${PANEL_ID} #capitan-process-timer{border:0!important;border-radius:0!important;background:transparent!important;min-width:0!important;width:auto!important;height:auto!important;line-height:20px!important;padding:0!important;color:#555!important;box-shadow:none!important}
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

function shippingCostFromLabel(label,price){
  label=clean(label);price=Number(price);
  let m=label.match(/free\s+shipping\s+(?:over|above)\s*\$\s*([0-9]+(?:[.,][0-9]{1,2})?)/i);
  if(m){const t=Number(String(m[1]).replace(',','.'));return isFinite(price)&&price>=t?0:1.99}
  if(/^free\s+shipping$/i.test(label))return 0;
  m=label.match(/\$\s*([0-9]+(?:[.,][0-9]{1,2})?)/);
  return m?Number(String(m[1]).replace(',','.')):null
}
function hydrateShippingCards(){
  const p=panel();if(!p||typeof window.__capitanReadSourceShippingLabel!=='function')return;
  const pending=[...p.querySelectorAll('[data-card-shipping]')].filter(el=>/lettura shipping/i.test(clean(el.textContent||'')));
  if(!pending.length)return;
  const source=(clean(p.innerText||'').match(/Source Item ID:\s*(\d{9,12})/i)||[])[1]||'';
  if(!source)return;
  if(!shippingFallbackPromise)shippingFallbackPromise=window.__capitanReadSourceShippingLabel(source).finally(()=>{shippingFallbackPromise=null});
  shippingFallbackPromise.then(label=>{
    if(!label)return;
    pending.forEach(el=>{
      el.innerHTML='<span style="color:#555">'+esc(label)+'</span>';
      const card=el.closest('label');if(!card)return;
      const price=Number(card.dataset.sourcePrice),cost=shippingCostFromLabel(label,price);
      if(isFinite(cost)&&cost>=0){card.dataset.shippingCost=String(cost);if(isFinite(price)&&price>0)card.dataset.totalCost=String(price+cost)}
      const ch=card.querySelector('input[type="checkbox"]');if(ch&&ch.checked)ch.dispatchEvent(new Event('change',{bubbles:true}))
    });
    log('Shipping card completato: '+label,'ok')
  }).catch(err=>log('Shipping card non leggibile: '+String(err&&err.message||err),'warn'))
}
function hideOkRows(){
  const p=panel();if(!p)return;
  const re=/^(Quantit[aà]|Condizione|Item Location|Descrizione|Foto):/i;
  [...p.querySelectorAll('#steps .row')].forEach(r=>{
    const t=clean(r.innerText||r.textContent||'');
    if(!re.test(t))return;
    const span=r.querySelector('span');
    const ok=!!(span&&span.classList.contains('ok'));
    r.style.display=ok?'none':''
  })
}
function ensureUi(){
  const p=panel();if(!p)return false;
  const header=p.querySelector('.h');
  const title=header?.querySelector('.title')||header?.querySelector('span');
  if(title&&!p.querySelector('#capitan-test-badge')){
    const b=document.createElement('span');b.id='capitan-test-badge';b.textContent='TEST';title.insertAdjacentElement('afterend',b)
  }
  const brand=p.querySelector('.brand'),timer=p.querySelector('#capitan-process-timer');
  if(brand&&timer&&!p.querySelector('#capitan-analytics-strip')){
    const strip=document.createElement('div');strip.id='capitan-analytics-strip';
    const label=document.createElement('span');label.textContent='Analytics ·';
    strip.appendChild(label);strip.appendChild(timer);brand.appendChild(strip)
  }
  const actions=p.querySelector('[data-ebay-actions]');
  if(actions&&!p.querySelector('#capitan-test-log')){
    const wrap=document.createElement('div');wrap.id='capitan-test-log';
    wrap.innerHTML='<div id="capitan-test-log-title"><span>Operational log</span><span>TEST</span></div><div id="capitan-test-log-body"></div>';
    actions.appendChild(wrap);
    log('Ambiente TEST inizializzato','warn')
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
    if(t&&t!==lastStatus){lastStatus=t;log(t,/errore|fallit|non avviata/i.test(t)?'bad':/attesa|corso|verifica|warn/i.test(t)?'warn':'ok')}
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