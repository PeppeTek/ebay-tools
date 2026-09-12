javascript:(()=>{
'use strict';
const PATCH_ID='capitan-ai-usage-ui-v3';
const MODAL_ID='capitan-pricing-modal';
const ENDPOINT_KEY='pep-ebay-bs-v6-google-url';
document.getElementById('capitan-ai-usage-ui-v2')?.remove();if(document.getElementById(PATCH_ID))return;
const marker=document.createElement('span');marker.id=PATCH_ID;marker.style.display='none';document.documentElement.appendChild(marker);
const esc=v=>String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const fmt=n=>Number(n||0).toLocaleString('it-IT');
const euro=n=>Number(n||0).toLocaleString('it-IT',{style:'currency',currency:'EUR',minimumFractionDigits:4,maximumFractionDigits:4});
function endpoint(){return String(localStorage.getItem(ENDPOINT_KEY)||'').replace(/\/+$/,'')}
function jsonp(action){const ep=endpoint();return new Promise((resolve,reject)=>{if(!ep)return reject(Error('Endpoint non configurato'));const cb='__capitanAiUsage_'+Date.now()+'_'+Math.floor(Math.random()*1e6);const s=document.createElement('script');const timer=setTimeout(()=>finish(Error('Timeout backend')),30000);function finish(err,val){clearTimeout(timer);try{delete window[cb]}catch(_){window[cb]=undefined}s.remove();err?reject(err):resolve(val)}window[cb]=v=>finish(null,v);s.onerror=()=>finish(Error('Backend non raggiungibile'));const q=new URLSearchParams({action:action,callback:cb,_:String(Date.now())});s.src=ep+(ep.includes('?')?'&':'?')+q.toString();document.head.appendChild(s)})}
function costText(a){a=a||{};return Number(a.requests||0)>0&&Number(a.pricedRequests||0)!==Number(a.requests||0)?'N/D':euro(a.costEur||0)}
function card(label,value,sub){return '<div style="border:1px solid #e2e5e9;border-radius:10px;padding:12px;background:#fff"><div style="font-size:11px;color:#666;margin-bottom:5px">'+esc(label)+'</div><div style="font-size:18px;font-weight:700;color:#111">'+esc(value)+'</div>'+(sub?'<div style="font-size:10px;color:#777;margin-top:4px">'+esc(sub)+'</div>':'')+'</div>'}
async function render(body){
  body.innerHTML='<div style="font-size:12px;color:#666">Caricamento utilizzo AI...</div>';
  try{
    const d=await jsonp('sell_like_ai_usage_get');if(!d||!d.ok)throw Error(d&&d.error?d.error:'Dati AI non disponibili');
    const t=d.today||{},m=d.month||{};
    const recent=(d.recent||[]).map(r=>'<tr><td style="padding:7px 5px;border-bottom:1px solid #eee">'+esc(new Date(r.at).toLocaleString('it-IT',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}))+'</td><td style="padding:7px 5px;border-bottom:1px solid #eee">'+esc(r.feature||'AI')+'</td><td style="padding:7px 5px;border-bottom:1px solid #eee;max-width:165px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="'+esc(r.model||'')+'">'+esc(r.model||'-')+'</td><td style="padding:7px 5px;border-bottom:1px solid #eee;text-align:right">'+fmt(r.totalTokens)+'</td><td style="padding:7px 5px;border-bottom:1px solid #eee;text-align:right">'+(r.costEur==null?'N/D':euro(r.costEur))+'</td></tr>').join('');
    body.innerHTML=
      '<div style="font-size:16px;font-weight:700;margin-bottom:12px">AI Usage</div>'+
      '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px">'+
      card('Richieste oggi',fmt(t.requests),'')+
      card('Token oggi',fmt(t.totalTokens),'Input '+fmt(t.promptTokens)+' - Output '+fmt(t.completionTokens))+
      card('Costo stimato oggi',costText(t),'EUR')+
      card('Richieste mese',fmt(m.requests),'')+
      card('Token mese',fmt(m.totalTokens),'Input '+fmt(m.promptTokens)+' - Output '+fmt(m.completionTokens))+
      card('Costo stimato mese',costText(m),'EUR')+
      '</div>'+
      '<div style="font-size:13px;font-weight:700;margin:18px 0 8px">Ultime chiamate AI</div>'+
      '<div id="capitan-ai-usage-table-scroll" style="overflow:auto;border:1px solid #e5e7eb;border-radius:9px;flex:0 1 340px;min-height:180px;max-height:340px;margin-bottom:28px"><table style="width:100%;border-collapse:collapse;font-size:11px"><thead style="position:sticky;top:0;background:#fafafa;z-index:1"><tr style="background:#fafafa"><th style="padding:7px 5px;text-align:left">Data</th><th style="padding:7px 5px;text-align:left">Funzione</th><th style="padding:7px 5px;text-align:left">Modello</th><th style="padding:7px 5px;text-align:right">Token</th><th style="padding:7px 5px;text-align:right">Costo</th></tr></thead><tbody>'+(recent||'<tr><td colspan="5" style="padding:14px;text-align:center;color:#777">Nessuna chiamata registrata.</td></tr>')+'</tbody></table></div>'+
      '<div style="font-size:11px;color:#666;line-height:1.4;margin:0 0 8px">Cambio USD/EUR usato: '+esc(Number(d.usdEurRate||0).toFixed(4))+'. Se il modello non ha un prezzo configurato il costo viene indicato come N/D.</div>'+
      '<div style="font-size:10px;color:#777;line-height:1.4">Il pannello registra solo le chiamate effettuate dopo la sua attivazione. Il saldo o la fattura Groq non sono disponibili tramite questo endpoint pubblico.</div>';
  }catch(err){body.innerHTML='<div style="color:#b42318;font-weight:700;font-size:12px">'+esc(err.message||err)+'</div>'}
}
function patch(){
  const modal=document.getElementById(MODAL_ID);if(!modal||modal.dataset.aiUsageV3==='1')return;
  const rateTab=[...modal.querySelectorAll('button')].find(b=>/Aggiorna tariffe/i.test(b.textContent||''));
  const rateBody=modal.querySelector('#capitan-settings-body');if(!rateTab||!rateBody)return;
  delete modal.dataset.aiUsageV2;modal.dataset.aiUsageV3='1';
  const tabs=rateTab.parentElement;
  [...tabs.querySelectorAll('button')].filter(b=>/AI Usage/i.test(b.textContent||'')).forEach(b=>b.remove());
  modal.querySelector('#capitan-ai-usage-body')?.remove();
  const aiTab=document.createElement('button');aiTab.type='button';aiTab.textContent='AI Usage';aiTab.style.cssText='border:0;border-bottom:3px solid transparent;background:transparent;color:#555;font-weight:700;font-size:13px;padding:10px 14px 9px;cursor:pointer';tabs.appendChild(aiTab);
  const aiBody=document.createElement('div');aiBody.id='capitan-ai-usage-body';aiBody.style.cssText='display:none;padding:18px 22px 34px;min-height:0;overflow:hidden;flex:1;flex-direction:column';rateBody.insertAdjacentElement('afterend',aiBody);
  rateTab.style.cursor='pointer';
  rateTab.addEventListener('click',()=>{rateBody.style.display='block';rateBody.style.overflow='auto';aiBody.style.display='none';rateTab.style.borderBottomColor='#1668e8';rateTab.style.color='#1668e8';aiTab.style.borderBottomColor='transparent';aiTab.style.color='#555'});
  aiTab.addEventListener('click',()=>{rateBody.style.display='none';aiBody.style.display='flex';rateTab.style.borderBottomColor='transparent';rateTab.style.color='#555';aiTab.style.borderBottomColor='#1668e8';aiTab.style.color='#1668e8';render(aiBody)});
}
const obs=new MutationObserver(patch);obs.observe(document.body,{childList:true,subtree:true});patch();
})();