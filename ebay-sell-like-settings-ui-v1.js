javascript:(()=>{
'use strict';
const PANEL_ID='capitan-sell-like-clone';
const MODAL_ID='capitan-settings-dashboard';
const ENDPOINT_KEY='pep-ebay-bs-v6-google-url';
const PATCH_ID='capitan-settings-ui-patch-v4';
if(document.getElementById(PATCH_ID))return;
for(const id of ['capitan-settings-ui-patch-v1','capitan-settings-ui-patch-v2','capitan-settings-ui-patch-v3'])document.getElementById(id)?.remove();
const marker=document.createElement('span');marker.id=PATCH_ID;marker.style.display='none';document.documentElement.appendChild(marker);

const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
let rates={ebayFee:.136,internationalFee:.016,marketingFee:.02,vatOnFees:.22,salesTaxEstimate:.06,fixedFee:.40,discountRate:.02};

function endpoint(){
  let u=String(window.__capitanSellLikeBackendEndpoint||'').trim();
  if(u)return u.replace(/\/+$/,'');
  try{return String(localStorage.getItem(ENDPOINT_KEY)||'').replace(/\/+$/,'')}catch(_){return''}
}
function jsonpAction(action,params,timeoutMs=45000){
  const ep=endpoint();
  return new Promise((resolve,reject)=>{
    if(!ep)return reject(Error('Endpoint Apps Script non configurato'));
    const cb='__capitanSettingsCb_'+Date.now()+'_'+Math.floor(Math.random()*1e6);
    const s=document.createElement('script');
    const t=setTimeout(()=>done(Error('Timeout backend')),timeoutMs);
    function done(err,val){clearTimeout(t);try{delete window[cb]}catch(_){window[cb]=undefined}s.remove();err?reject(err):resolve(val)}
    window[cb]=v=>done(null,v);
    s.onerror=()=>done(Error('Backend non raggiungibile'));
    const q=new URLSearchParams({action,callback:cb,_:String(Date.now()),...(params||{})});
    s.src=ep+(ep.includes('?')?'&':'?')+q.toString();
    document.head.appendChild(s)
  })
}
function inputCss(){return'height:36px;border:1px solid #c5c9cf;border-radius:8px;padding:0 10px;font-size:13px;box-sizing:border-box;width:100%;background:#fff;color:#111'}
function buttonCss(primary){
  return 'height:38px;border:'+(primary?'0':'1px solid #b9b9b9')+';border-radius:20px;background:'+(primary?'#1668e8':'#fff')+';color:'+(primary?'#fff':'#111')+';font-weight:700;font-size:12px;padding:0 16px;cursor:pointer'
}
function ensureHeaderControls(){
  const panel=document.getElementById(PANEL_ID);if(!panel)return false;
  const close=panel.querySelector('[data-close]');if(!close)return false;
  panel.style.position='fixed';
  let controls=panel.querySelector('#capitan-header-controls');
  if(!controls){controls=document.createElement('div');controls.id='capitan-header-controls';panel.appendChild(controls)}
  controls.style.cssText='position:absolute;top:12px;right:12px;z-index:5;width:75px;display:grid;grid-template-columns:34px 34px;gap:7px;align-items:center';
  let gear=controls.querySelector('#capitan-settings-open');
  if(!gear){
    gear=document.createElement('button');gear.type='button';gear.id='capitan-settings-open';gear.textContent='⚙';gear.title='Impostazioni';gear.setAttribute('aria-label','Impostazioni');gear.addEventListener('click',openSettingsDashboard);controls.appendChild(gear)
  }
  if(close.parentElement!==controls)controls.appendChild(close);
  const common='width:34px;height:34px;padding:0;border:1px solid #b9b9b9;border-radius:8px;background:#fff;color:#333;display:flex;align-items:center;justify-content:center;cursor:pointer;line-height:1;box-sizing:border-box';
  gear.style.cssText=common+';font-size:20px;font-family:Arial,sans-serif;font-weight:400';
  close.style.cssText=common+';font-size:18px;font-family:Arial,sans-serif;font-weight:400';
  const timer=panel.querySelector('#capitan-process-timer');
  if(timer){
    if(timer.parentElement!==controls)controls.appendChild(timer);
    timer.style.cssText='grid-column:1 / -1;width:75px;height:24px;padding:0;border:0;border-radius:0;background:transparent;color:#555;text-align:center;font:700 11px/24px ui-monospace,SFMono-Regular,Consolas,monospace;box-sizing:border-box;white-space:nowrap;box-shadow:none'
  }
  const old=panel.querySelector('#capitan-pricing-open');if(old&&old!==gear)old.remove();
  return true
}
async function loadRates(){
  try{const d=await jsonpAction('sell_like_pricing_get');if(d&&d.ok&&d.rates)rates=d.rates}catch(e){console.warn('Sell Like settings rates',e)}
  return rates
}
async function loadAliStatus(){
  const d=await jsonpAction('sell_like_aliexpress_auth_status',{},30000);
  if(!d||!d.ok)throw Error(d?.error||'Stato token AliExpress non disponibile');
  return d
}
function statusBadge(ok,label){
  return '<span style="display:inline-flex;align-items:center;height:24px;padding:0 9px;border-radius:999px;border:1px solid '+(ok?'#b7dfc3':'#f2c0bc')+';background:'+(ok?'#eef9f1':'#fff1f0')+';color:'+(ok?'#137333':'#b42318')+';font-size:11px;font-weight:700">'+esc(label)+'</span>'
}
function formatSeconds(v){
  const n=Number(v||0);if(!isFinite(n)||n<=0)return'—';
  const d=Math.floor(n/86400),h=Math.floor((n%86400)/3600);
  return d?d+'g '+h+'h':Math.floor(n/3600)+'h'
}
async function renderPricing(body){
  body.innerHTML='<div style="font-size:16px;font-weight:700;color:#111;margin:0 0 14px">Aggiorna tariffe</div><div id="capitan-settings-loading" style="font-size:12px;color:#666">Caricamento tariffe…</div>';
  await loadRates();
  if(!document.body.contains(body))return;
  const pct=v=>(Number(v||0)*100).toFixed(2);
  body.innerHTML='<div style="font-size:16px;font-weight:700;color:#111;margin:0 0 14px">Aggiorna tariffe</div>'+
    '<div style="display:grid;grid-template-columns:1fr 150px;gap:11px 14px;align-items:center;font-size:13px">'+
    '<label>Riduzione prezzo %</label><input data-rate="discountRate" value="'+pct(rates.discountRate)+'">'+
    '<label>eBay Fee %</label><input data-rate="ebayFee" value="'+pct(rates.ebayFee)+'">'+
    '<label>International Fee %</label><input data-rate="internationalFee" value="'+pct(rates.internationalFee)+'">'+
    '<label>Marketing Fee %</label><input data-rate="marketingFee" value="'+pct(rates.marketingFee)+'">'+
    '<label>VAT on Fees %</label><input data-rate="vatOnFees" value="'+pct(rates.vatOnFees)+'">'+
    '<label>Sales Tax Estimate %</label><input data-rate="salesTaxEstimate" value="'+pct(rates.salesTaxEstimate)+'">'+
    '<label>eBay Fixed Fee</label><input data-rate="fixedFee" value="'+Number(rates.fixedFee||0).toFixed(2)+'"></div>'+
    '<div id="capitan-settings-msg" style="min-height:18px;margin-top:14px;font-size:12px"></div>'+
    '<button data-save style="'+buttonCss(true)+';width:100%;height:44px;margin-top:8px">Salva</button>';
  body.querySelectorAll('input').forEach(i=>i.style.cssText=inputCss());
  body.querySelector('[data-save]').addEventListener('click',async()=>{
    const msg=body.querySelector('#capitan-settings-msg');
    try{
      const vals={};body.querySelectorAll('[data-rate]').forEach(i=>vals[i.dataset.rate]=Number(String(i.value).replace(',','.')));
      for(const k of ['discountRate','ebayFee','internationalFee','marketingFee','vatOnFees','salesTaxEstimate'])if(!isFinite(vals[k])||vals[k]<-999||vals[k]>=100)throw Error('Controlla le percentuali inserite.');
      if(!isFinite(vals.fixedFee)||vals.fixedFee<0)throw Error('Controlla eBay Fixed Fee.');
      const params={discountRate:String(vals.discountRate/100),ebayFee:String(vals.ebayFee/100),internationalFee:String(vals.internationalFee/100),marketingFee:String(vals.marketingFee/100),vatOnFees:String(vals.vatOnFees/100),salesTaxEstimate:String(vals.salesTaxEstimate/100),fixedFee:String(vals.fixedFee)};
      msg.textContent='Salvataggio…';
      const d=await jsonpAction('sell_like_pricing_save',params);
      if(!d||!d.ok)throw Error(d?.error||'Salvataggio non riuscito');
      rates=d.rates||rates;window.dispatchEvent(new CustomEvent('capitan-pricing-saved',{detail:{rates}}));
      msg.innerHTML='<span style="color:#137333;font-weight:700">Tariffe salvate.</span>'
    }catch(e){msg.innerHTML='<span style="color:#b42318;font-weight:700">'+esc(e.message||e)+'</span>'}
  })
}
async function renderAli(body){
  body.innerHTML='<div style="font-size:16px;font-weight:700;color:#111;margin:0 0 14px">AliExpress Token</div><div style="font-size:12px;color:#666">Verifica configurazione in corso…</div>';
  let st;
  try{st=await loadAliStatus()}catch(e){
    body.innerHTML='<div style="font-size:16px;font-weight:700;color:#111;margin:0 0 14px">AliExpress Token</div><div style="color:#b42318;font-size:12px">'+esc(e.message||e)+'</div>';
    return
  }
  if(!document.body.contains(body))return;
  const updated=st.updatedAt?new Date(st.updatedAt).toLocaleString('it-IT'):'Mai';
  body.innerHTML=
    '<div style="font-size:16px;font-weight:700;color:#111;margin:0 0 8px">AliExpress Token</div>'+
    '<div style="font-size:12px;line-height:1.45;color:#5f6368;margin-bottom:14px">Da qui puoi controllare e rigenerare i token usati dal Best Match AliExpress. Se il refresh token è scaduto, serve una nuova autorizzazione AliExpress.</div>'+
    '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px">'+
      statusBadge(st.appConfigured&&st.secretConfigured,'App '+(st.appConfigured&&st.secretConfigured?'OK':'non configurata'))+
      statusBadge(st.accessConfigured,'Access token '+(st.accessConfigured?'OK':'mancante'))+
      statusBadge(st.refreshConfigured,'Refresh token '+(st.refreshConfigured?'OK':'mancante'))+
    '</div>'+
    '<div style="border:1px solid #e2e5e9;border-radius:9px;background:#fafafa;padding:10px 12px;font-size:11.5px;line-height:1.55;margin-bottom:14px">'+
      '<div><b>Ultimo aggiornamento:</b> '+esc(updated)+'</div>'+
      '<div><b>Account:</b> '+esc(st.account||'—')+'</div>'+
      '<div><b>Durata access token:</b> '+esc(formatSeconds(st.accessExpiresIn))+'</div>'+
      '<div><b>Durata refresh token:</b> '+esc(formatSeconds(st.refreshExpiresIn))+'</div>'+
      '<div style="word-break:break-all"><b>Callback:</b> '+esc(st.redirectUri||'—')+'</div>'+
    '</div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">'+
      '<button data-refresh style="'+buttonCss(false)+'">Rinnova access token</button>'+
      '<button data-reauth style="'+buttonCss(true)+'">Rigenera token</button>'+
    '</div>'+
    '<div style="border-top:1px solid #e5e7eb;padding-top:14px">'+
      '<div style="font-size:12px;font-weight:700;margin-bottom:6px">Inserimento manuale del code</div>'+
      '<div style="font-size:11.5px;color:#666;line-height:1.4;margin-bottom:8px">Se AliExpress ti restituisce un URL con <b>code=...</b>, puoi incollare qui l’URL completo oppure solo il code.</div>'+
      '<textarea data-code rows="3" placeholder="Incolla code o URL callback" style="width:100%;box-sizing:border-box;border:1px solid #c5c9cf;border-radius:8px;padding:9px 10px;font:12px/1.35 Arial,sans-serif;resize:vertical"></textarea>'+
      '<button data-code-save style="'+buttonCss(false)+';width:100%;margin-top:8px">Genera token dal code</button>'+
    '</div>'+
    '<div data-ali-msg style="min-height:20px;margin-top:12px;font-size:12px"></div>';

  const msg=body.querySelector('[data-ali-msg]');
  async function refreshView(note){
    try{
      const latest=await loadAliStatus();
      if(note)msg.innerHTML='<span style="color:#137333;font-weight:700">'+esc(note)+'</span>';
      const current=body.closest('#'+MODAL_ID);
      if(current)setTimeout(()=>renderAli(body),650)
    }catch(e){msg.innerHTML='<span style="color:#b42318;font-weight:700">'+esc(e.message||e)+'</span>'}
  }

  body.querySelector('[data-refresh]').addEventListener('click',async e=>{
    const btn=e.currentTarget;btn.disabled=true;msg.textContent='Rinnovo token in corso…';
    try{
      const d=await jsonpAction('sell_like_aliexpress_auth_refresh',{},60000);
      if(!d||!d.ok)throw Error(d?.error||'Rinnovo token non riuscito');
      await refreshView('Access token rinnovato.')
    }catch(err){msg.innerHTML='<span style="color:#b42318;font-weight:700">'+esc(err.message||err)+'</span>'}
    finally{btn.disabled=false}
  });

  body.querySelector('[data-reauth]').addEventListener('click',async e=>{
    const btn=e.currentTarget;btn.disabled=true;msg.textContent='Preparazione autorizzazione AliExpress…';
    const popup=window.open('about:blank','capitan-aliexpress-auth');
    try{
      const before=st.updatedAt||'';
      const d=await jsonpAction('sell_like_aliexpress_auth_url',{},30000);
      if(!d||!d.ok||!d.url)throw Error(d?.error||'URL autorizzazione non disponibile');
      if(popup)popup.location.href=d.url;else window.open(d.url,'_blank','noopener');
      msg.innerHTML='<span style="color:#a15c00;font-weight:700">Completa l’autorizzazione nella nuova finestra.</span>';
      let tries=0;
      const poll=setInterval(async()=>{
        tries++;
        try{
          const latest=await loadAliStatus();
          if(latest.updatedAt&&latest.updatedAt!==before){
            clearInterval(poll);await refreshView('Nuovo token AliExpress salvato.');
          }else if(tries>=40){clearInterval(poll)}
        }catch(_){if(tries>=40)clearInterval(poll)}
      },3000)
    }catch(err){
      try{if(popup&&!popup.closed)popup.close()}catch(_){}
      msg.innerHTML='<span style="color:#b42318;font-weight:700">'+esc(err.message||err)+'</span>'
    }finally{btn.disabled=false}
  });

  body.querySelector('[data-code-save]').addEventListener('click',async e=>{
    const btn=e.currentTarget;const value=clean(body.querySelector('[data-code]').value);
    if(!value){msg.innerHTML='<span style="color:#b42318;font-weight:700">Incolla il code o l’URL callback.</span>';return}
    btn.disabled=true;msg.textContent='Generazione token in corso…';
    try{
      const d=await jsonpAction('sell_like_aliexpress_auth_code',{code:value},60000);
      if(!d||!d.ok)throw Error(d?.error||'Generazione token non riuscita');
      await refreshView('Nuovo token AliExpress salvato.')
    }catch(err){msg.innerHTML='<span style="color:#b42318;font-weight:700">'+esc(err.message||err)+'</span>'}
    finally{btn.disabled=false}
  })
}
async function openSettingsDashboard(){
  document.getElementById(MODAL_ID)?.remove();
  const panel=document.getElementById(PANEL_ID);if(!panel)return;
  const logo=panel.querySelector('.brand img')?.src||panel.querySelector('img')?.src||'';
  const overlay=document.createElement('div');overlay.id=MODAL_ID;
  overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.42);z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:20px;font-family:Arial,sans-serif;pointer-events:none';
  overlay.innerHTML='<div id="capitan-settings-shell" style="width:min(650px,94vw);height:min(780px,90vh);max-height:90vh;overflow:hidden;background:#fff;border-radius:14px;box-shadow:0 18px 60px rgba(0,0,0,.28);border:1px solid #d9d9d9;display:flex;flex-direction:column;pointer-events:auto">'+
    '<div style="padding:18px 22px 14px;border-bottom:1px solid #e7e7e7;position:relative">'+
      (logo?'<img src="'+esc(logo)+'" alt="Dropper Analytics" style="display:block;width:auto;height:38px;max-width:180px;object-fit:contain;margin-bottom:12px">':'')+
      '<div style="font-size:19px;font-weight:700;color:#111">Sell Like This v1.4 - Impostazioni</div>'+
      '<button data-close style="position:absolute;right:16px;top:16px;width:32px;height:32px;border:1px solid #bbb;border-radius:8px;background:#fff;cursor:pointer;font-size:18px">×</button>'+
    '</div>'+
    '<div data-tabs style="display:flex;gap:4px;padding:10px 18px 0;border-bottom:1px solid #e5e7eb;background:#fafafa">'+
      '<button type="button" data-tab="pricing">Aggiorna tariffe</button>'+
      '<button type="button" data-tab="ali">AliExpress Token</button>'+
    '</div>'+
    '<div id="capitan-settings-body" style="padding:18px 22px;overflow:auto;min-height:0;flex:1"></div>'+
  '</div>';
  document.body.appendChild(overlay);
  const close=()=>overlay.remove();overlay.querySelector('[data-close]').onclick=close;
  const body=overlay.querySelector('#capitan-settings-body');
  const tabs=[...overlay.querySelectorAll('[data-tab]')];
  function select(name){
    tabs.forEach(t=>{
      const active=t.dataset.tab===name;
      t.style.cssText='border:0;border-bottom:3px solid '+(active?'#1668e8':'transparent')+';background:transparent;color:'+(active?'#1668e8':'#555')+';font-weight:'+(active?'700':'600')+';font-size:13px;padding:10px 14px 9px;cursor:pointer'
    });
    if(name==='ali')renderAli(body);else renderPricing(body)
  }
  tabs.forEach(t=>t.addEventListener('click',()=>select(t.dataset.tab)));
  select('pricing')
}
let n=0;const t=setInterval(()=>{n++;if(ensureHeaderControls()||n>100)clearInterval(t)},100);
ensureHeaderControls();
})();