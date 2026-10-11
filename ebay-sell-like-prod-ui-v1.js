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
let lastStatus='',seenClicks=new WeakSet(),shippingFallbackPromise=null,fxInflight=null,lastFxCurrency='';
const FX_CACHE_KEY='capitan-sell-like-fx-usd-cache-v1';

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
#${PANEL_ID} .capitan-dual-money{display:inline-flex;flex-direction:column;align-items:flex-end;justify-content:center;line-height:1.05;white-space:nowrap;text-align:right}
#${PANEL_ID} .capitan-dual-money .capitan-usd-line{display:block;font-size:10px;line-height:1.05;margin-top:2px;color:#555;font-weight:600}
#${PANEL_ID} .capitan-dual-money .capitan-fx-pending{color:#888}
`;
document.head.appendChild(style);

function panel(){return document.getElementById(PANEL_ID)}
function currency(){return String(window.__capitanSellLikeCurrency||window.__capitanSellLikeCloneData?.currency||'USD').toUpperCase()}
function fmt(n,c){return isFinite(Number(n))?Number(n).toFixed(2)+' '+String(c||'USD').toUpperCase():'—'}
function parseMoneyText(v){const m=clean(v).match(/(-?\d+(?:[.,]\d+)?)/);return m?Number(String(m[1]).replace(',','.')):null}
function fxCacheRead(){try{const x=JSON.parse(localStorage.getItem(FX_CACHE_KEY)||'{}');return x&&typeof x==='object'?x:{}}catch(_){return{}}}
function fxCacheWrite(x){try{localStorage.setItem(FX_CACHE_KEY,JSON.stringify(x||{}))}catch(_){} }
function getFxSync(cur){
  cur=String(cur||'USD').toUpperCase();
  if(cur==='USD')return 1;
  if(Number(window.__capitanSellLikeFxCurrencyRateToUsd)>0&&String(window.__capitanSellLikeFxCurrency||'').toUpperCase()===cur)return Number(window.__capitanSellLikeFxCurrencyRateToUsd);
  const hit=fxCacheRead()[cur];
  if(hit&&Number(hit.rate)>0&&Date.now()-Number(hit.at||0)<12*60*60*1000){window.__capitanSellLikeFxCurrency=cur;window.__capitanSellLikeFxCurrencyRateToUsd=Number(hit.rate);return Number(hit.rate)}
  loadFx(cur);
  return null
}
async function loadFx(cur){
  cur=String(cur||currency()||'USD').toUpperCase();
  if(cur==='USD'||fxInflight&&lastFxCurrency===cur)return fxInflight;
  lastFxCurrency=cur;
  fxInflight=(async()=>{
    try{
      const r=await fetch('https://api.frankfurter.dev/v2/rates?base='+encodeURIComponent(cur)+'&quotes=USD',{mode:'cors',credentials:'omit',cache:'no-store'});
      if(!r.ok)throw Error('FX HTTP '+r.status);
      const d=await r.json();
      let rate=Number(Array.isArray(d)?d.find(x=>String(x.quote||'').toUpperCase()==='USD')?.rate:(d?.rates?.USD||d?.rate));
      if(!isFinite(rate)||rate<=0)throw Error('FX rate non disponibile');
      window.__capitanSellLikeFxCurrency=cur;window.__capitanSellLikeFxCurrencyRateToUsd=rate;
      const cache=fxCacheRead();cache[cur]={rate,at:Date.now()};fxCacheWrite(cache);
      dualCurrencyRefresh();
      log('Cambio '+cur+'/USD aggiornato: '+rate.toFixed(4),'ok');
      return rate
    }catch(e){console.warn('Sell Like FX',e);log('Cambio '+cur+'/USD non disponibile: USD secondario in attesa','warn');return null}
    finally{fxInflight=null}
  })();
  return fxInflight
}
function dualMoneyHtml(value,cur){
  cur=String(cur||currency()||'USD').toUpperCase();
  if(!isFinite(Number(value)))return '—';
  const local=fmt(value,cur);
  if(cur==='USD')return esc(local);
  const rate=getFxSync(cur);
  const usd=isFinite(rate)?fmt(Number(value)*rate,'USD'):'USD …';
  const cls=isFinite(rate)?'':' capitan-fx-pending';
  return '<span class="capitan-dual-money"><span>'+esc(local)+'</span><span class="capitan-usd-line'+cls+'">'+esc(usd)+'</span></span>'
}
function setDual(el,value,cur){
  if(!el||!isFinite(Number(value)))return false;
  el.dataset.capitanDualValue=String(Number(value));
  el.dataset.capitanDualCurrency=String(cur||currency()||'USD').toUpperCase();
  el.innerHTML=dualMoneyHtml(Number(value),el.dataset.capitanDualCurrency);
  el.style.whiteSpace='normal';el.style.lineHeight='1.05';el.style.textAlign='right';
  return true
}
function findSaleSpan(){const p=panel();const row=p?.querySelector('#capitan-sale-price-row');if(!row)return null;return [...row.querySelectorAll('span')].find(x=>x.id!=='capitan-sale-price-editor')||null}
function dualCurrencyRefresh(){
  const p=panel();if(!p)return;
  const cur=currency();
  const map=[
    ['#capitan-competitor-price',Number(window.__capitanSellLikeSourcePrice||window.__capitanSellLikeCloneData?.sourcePrice)],
    ['#capitan-break-even-value',null],
    ['#capitan-margin-break [data-value]',null],
    ['#capitan-margin-source [data-value]',null],
    ['#capitan-margin-delta [data-value]',null]
  ];
  map.forEach(([sel,forced])=>{const el=p.querySelector(sel);if(!el)return;let n=isFinite(Number(forced))?Number(forced):Number(el.dataset.capitanDualValue);if(!isFinite(n))n=parseMoneyText(el.textContent||'');if(isFinite(n))setDual(el,n,cur)});
  const sale=findSaleSpan();
  if(sale){let n=Number(window.__capitanSellLikeSalePrice);if(!isFinite(n)||n<=0)n=Number(sale.dataset.capitanDualValue);if(!isFinite(n))n=parseMoneyText(sale.textContent||'');if(isFinite(n))setDual(sale,n,cur)}
}
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
  dualCurrencyRefresh();
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
window.addEventListener('capitan-sale-price-updated',e=>{const value=Number(e.detail?.value||0);log('Prezzo di vendita aggiornato: '+fmt(value,currency()),'ok');setTimeout(dualCurrencyRefresh,0)});
window.addEventListener('capitan-break-even-updated',()=>setTimeout(dualCurrencyRefresh,0));
window.addEventListener('capitan-discount-updated',()=>setTimeout(dualCurrencyRefresh,0));
window.addEventListener('capitan-sell-like-ui-ready',()=>{ensureUi();wireButtons();observeStatus();dualCurrencyRefresh();log('UI pronta','ok')});

document.addEventListener('change',e=>{
  if(e.target?.matches('input.capitan-amazon-choice,input.capitan-aliexpress-choice'))log('Prodotto sourcing '+(e.target.checked?'selezionato':'deselezionato'),'ok')
},true);

const obs=new MutationObserver(()=>{ensureUi();wireButtons();observeStatus();dualCurrencyRefresh()});
obs.observe(document.body,{childList:true,subtree:true});
ensureUi();wireButtons();observeStatus();dualCurrencyRefresh();
})();