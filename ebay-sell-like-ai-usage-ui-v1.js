javascript:(()=>{
'use strict';
const MODAL_ID='capitan-pricing-modal';
const ENDPOINT_KEY='pep-ebay-bs-v6-google-url';
const PATCH='capitan-ai-usage-ui-v1';
if(document.getElementById(PATCH))return;
const marker=document.createElement('span');marker.id=PATCH;marker.style.display='none';document.documentElement.appendChild(marker);
const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const fmt=n=>Number(n||0).toLocaleString('it-IT');
const eur=n=>Number(n||0).toLocaleString('it-IT',{style:'currency',currency:'EUR',minimumFractionDigits:4,maximumFractionDigits:4});
function endpoint(){return (localStorage.getItem(ENDPOINT_KEY)||'').replace(/\/+$/,'')}
function jsonp(action,params){const ep=endpoint();return new Promise((resolve,reject)=>{if(!ep)return reject(Error('Endpoint Apps Script non configurato'));const cb='__capitanAiUsage_'+Date.now()+'_'+Math.floor(Math.random()*1e6),s=document.createElement('script'),t=setTimeout(()=>done(Error('Timeout backend')),30000);function done(err,val){clearTimeout(t);try{delete window[cb]}catch(_){window[cb]=undefined}s.remove();err?reject(err):resolve(val)}window[cb]=v=>done(null,v);s.onerror=()=>done(Error('Backend non raggiungibile'));const q=new URLSearchParams(Object.assign({action:action,callback:cb,_:Date.now().toString()},params||{}));s.src=ep+(ep.includes('?')?'&':'?')+q.toString();document.head.appendChild(s)})}
function card(label,value,sub){return '<div style="border:1px solid #e2e5e9;border-radius:10px;padding:12px;background:#fff"><div style="font-size:11px;color:#666;margin-bottom:5px">'+esc(label)+'</div><div style="font-size:18px;font-weight:700;color:#111">'+esc(value)+'</div>'+(sub?'<div style="font-size:10px;color:#777;margin-top:4px">'+esc(sub)+'</div>':'')+'</div>'}
async function render(aiBody){
  aiBody.innerHTML='<div style="font-size:12px;color:#666">Caricamento utilizzo AI…</div>';
  try{
    const d=await jsonp('sell_like_ai_usage_get');
    if(!d||!d.ok)throw Error((d&&d.error)||'Dati AI non disponibili');
    const today=d.today||{}, month=d.month||{};
    const rows=(d.recent||[]).map(r=>'<tr><td style="padding:7px 5px;border-bottom:1px solid #eee">'+esc(new Date(r.at).toLocaleString('it-IT',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}))+'</td><td style="padding:7px 5px;border-bottom:1px solid #eee">'+esc(r.feature||'AI')+'</td><td style="padding:7px 5px;border-bottom:1px solid #eee;max-width:170px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="'+esc(r.model||'')+'">'+esc(r.model||'—')+'</td><td style="padding:7px 5px;border-bottom:1px solid #eee;text-align:right">'+fmt(r.totalTokens)+'</td><td style="padding:7px 5px;border-bottom:1px solid #eee;text-align:right">'+(r.costEur==null?'N/D':eur(r.costEur))+'</td></tr>').join('');
    aiBody.innerHTML=
      '<div style="font-size:16px;font-weight:700;color:#111;margin-bottom:12px">AI Usage</div>'+
      '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-bottom:14px">'+
      card('Richieste oggi',fmt(today.requests),'')+
      card('Token oggi',fmt(today.totalTokens),'Input '+fmt(today.promptTokens)+' · Output '+fmt(today.completionTokens))+
      card('Costo stimato oggi',eur(today.costEur),'EUR')+
      card('Costo stimato mese',eur(month.costEur),'EUR')+
      card('Richieste mese',fmt(month.requests),'')+
      card('Token mese',fmt(month.totalTokens),'Input '+fmt(month.promptTokens)+' · Output '+fmt(month.completionTokens))+
      '</div>'+
      '<div style="display:flex;align-items:center;gap:8px;padding:10px 0 14px;border-top:1px solid #eee"><label style="font-size:12px;flex:1">Cambio USD → EUR usato per la stima</label><input id="capitan-ai-fx" value="'+Number(d.usdEurRate||0).toFixed(4)+'" style="width:90px;height:32px;border:1px solid #bbb;border-radius:7px;padding:0 8px"><button id="capitan-ai-fx-save" style="height:32px;border:0;border-radius:17px;background:#1668e8;color:#fff;padding:0 14px;font-weight:700;cursor:pointer">Salva</button></div>'+
      '<div id="capitan-ai-msg" style="min-height:16px;font-size:11px;margin-bottom:8px"></div>'+
      '<div style="font-size:13px;font-weight:700;margin:4px 0 8px">Ultime chiamate AI</div>'+
      '<div style="overflow:auto;border:1px solid #e5e7eb;border-radius:9px"><table style="width:100%;border-collapse:collapse;font-size:11px"><thead><tr style="background:#fafafa"><th style="padding:7px 5px;text-align:left">Data</th><th style="padding:7px 5px;text-align:left">Funzione</th><th style="padding:7px 5px;text-align:left">Modello</th><th style="padding:7px 5px;text-align:right">Token</th><th style="padding:7px 5px;text-align:right">Costo €</th></tr></thead><tbody>'+(rows||'<tr><td colspan="5" style="padding:14px;text-align:center;color:#777">Nessuna chiamata registrata ancora.</td></tr>')+'</tbody></table></div>'+
      '<div style="font-size:10px;color:#777;margin-top:12px;line-height:1.4">Il costo è una stima calcolata dai token restituiti da Groq. Il saldo/fattura effettiva Groq non è disponibile tramite l\\'API pubblica usata dallo script.</div>';
    const save=aiBody.querySelector('#capitan-ai-fx-save');
    if(save)save.addEventListener('click',async()=>{
      const msg=aiBody.querySelector('#capitan-ai-msg');
      const v=Number(String(aiBody.querySelector('#capitan-ai-fx').value).replace(',','.'));
      if(!isFinite(v)||v<=0||v>=2){msg.innerHTML='<span style="color:#b42318;font-weight:700">Cambio non valido.</span>';return}
      try{
        msg.textContent='Salvataggio…';
        const x=await jsonp('sell_like_ai_usage_fx_save',{usdEurRate:String(v)});
        if(!x||!x.ok)throw Error((x&&x.error)||'Salvataggio non riuscito');
        msg.innerHTML='<span style="color:#137333;font-weight:700">Cambio salvato.</span>';
        setTimeout(()=>render(aiBody),350);
      }catch(e){msg.innerHTML='<span style="color:#b42318;font-weight:700">'+esc(e.message||e)+'</span>'}
    });
  }catch(e){aiBody.innerHTML='<div style="color:#b42318;font-weight:700;font-size:12px">'+esc(e.message||e)+'</div>'}
}
function patchModal(){
  const modal=document.getElementById(MODAL_ID);if(!modal||modal.dataset.aiUsageReady==='1')return;
  const rateTab=[...modal.querySelectorAll('button')].find(b=>/Aggiorna tariffe/i.test(b.textContent||''));
  const rateBody=modal.querySelector('#capitan-settings-body');if(!rateTab||!rateBody)return;
  modal.dataset.aiUsageReady='1';
  const tabsBar=rateTab.parentElement;
  const aiTab=document.createElement('button');aiTab.type='button';aiTab.textContent='AI Usage';aiTab.style.cssText='border:0;border-bottom:3px solid transparent;background:transparent;color:#555;font-weight:700;font-size:13px;padding:10px 14px 9px;cursor:pointer';tabsBar.appendChild(aiTab);
  const aiBody=document.createElement('div');aiBody.id='capitan-ai-usage-body';aiBody.style.cssText='display:none;padding:18px 22px';rateBody.insertAdjacentElement('afterend',aiBody);
  function showRates(){rateBody.style.display='block';aiBody.style.display='none';rateTab.setAttribute('aria-selected','true');rateTab.style.borderBottomColor='#1668e8';rateTab.style.color='#1668e8';aiTab.setAttribute('aria-selected','false');aiTab.style.borderBottomColor='transparent';aiTab.style.color='#555'}
  function showAi(){rateBody.style.display='none';aiBody.style.display='block';rateTab.setAttribute('aria-selected','false');rateTab.style.borderBottomColor='transparent';rateTab.style.color='#555';aiTab.setAttribute('aria-selected','true');aiTab.style.borderBottomColor='#1668e8';aiTab.style.color='#1668e8';render(aiBody)}
  rateTab.style.cursor='pointer';rateTab.addEventListener('click',showRates);aiTab.addEventListener('click',showAi);
}
const obs=new MutationObserver(patchModal);obs.observe(document.body,{childList:true,subtree:true});patchModal();
})();