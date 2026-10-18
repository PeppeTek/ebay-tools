javascript:(async()=>{
'use strict';
const PATCH_ID='capitan-sell-like-catalog-v1';
const PANEL_ID='capitan-sell-like-clone';
const ENDPOINT_KEY='pep-ebay-bs-v6-google-url';
if(document.getElementById(PATCH_ID))return;
const marker=document.createElement('span');marker.id=PATCH_ID;marker.style.display='none';document.documentElement.appendChild(marker);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const clean=v=>String(v==null?'':v).replace(/\s+/g,' ').trim();
function log(msg,state='ok'){
  try{
    if(typeof window.__capitanTestLog==='function')window.__capitanTestLog(String(msg||''),state);
    else (window.__capitanPendingTestLogs=window.__capitanPendingTestLogs||[]).push({message:String(msg||''),state})
  }catch(_){}
}
function endpoint(){
  let u=clean(window.__capitanSellLikeBackendEndpoint||'').replace(/\/+$/,'');
  if(/^https:\/\/script\.google\.com\/macros\/s\//i.test(u))return u;
  try{u=clean(localStorage.getItem(ENDPOINT_KEY)||'').replace(/\/+$/,'')}catch(_){u=''}
  return /^https:\/\/script\.google\.com\/macros\/s\//i.test(u)?u:''
}
function jsonp(action,params,timeoutMs=30000){
  return new Promise((resolve,reject)=>{
    const ep=endpoint();if(!ep)return reject(Error('Backend Apps Script non configurato'));
    const cb='__capitanCatalogCb_'+Date.now()+'_'+Math.floor(Math.random()*1e6);
    const script=document.createElement('script');
    const timer=setTimeout(()=>done(Error('Timeout backend catalogo')),timeoutMs);
    function done(err,val){
      clearTimeout(timer);
      try{delete window[cb]}catch(_){window[cb]=undefined}
      script.remove();
      err?reject(err):resolve(val)
    }
    window[cb]=v=>done(null,v);
    script.onerror=()=>done(Error('Backend catalogo non raggiungibile'));
    const q=new URLSearchParams({action,callback:cb,_:String(Date.now()),...(params||{})});
    script.src=ep+'?'+q.toString();
    document.head.appendChild(script)
  })
}
function utf8Base64Url(text){
  const bytes=new TextEncoder().encode(String(text||''));
  let binary='';
  const block=0x8000;
  for(let i=0;i<bytes.length;i+=block)binary+=String.fromCharCode(...bytes.subarray(i,i+block));
  return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')
}
async function savePackage(pkg){
  if(!pkg||!Array.isArray(pkg.headers)||!Array.isArray(pkg.dataRows))throw Error('Snapshot CSV non disponibile');
  if(!/^(US|CA|AU)$/.test(String(pkg.marketplace||'')))throw Error('Marketplace non supportato');
  if(!/^\d{9,12}$/.test(String(pkg.sourceItemId||'')))throw Error('Source Item ID non valido');
  const raw=JSON.stringify({
    version:1,
    marketplace:pkg.marketplace,
    sheetName:pkg.sheetName,
    sourceItemId:String(pkg.sourceItemId),
    groupId:String(pkg.groupId||''),
    hasVariations:!!pkg.hasVariations,
    currency:String(pkg.currency||''),
    headers:pkg.headers,
    rows:pkg.dataRows
  });
  const encoded=utf8Base64Url(raw);
  const chunkSize=4200;
  const total=Math.ceil(encoded.length/chunkSize);
  if(total<1||total>120)throw Error('Payload catalogo troppo grande ('+total+' parti)');
  const requestId='cat_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,12);
  for(let i=0;i<total;i++){
    const part=encoded.slice(i*chunkSize,(i+1)*chunkSize);
    const r=await jsonp('sell_like_catalog_chunk',{requestId,index:String(i),total:String(total),data:part},30000);
    if(!r||!r.ok)throw Error(r&&r.error||('Upload catalogo fallito alla parte '+(i+1)))
  }
  const result=await jsonp('sell_like_catalog_commit',{requestId,total:String(total)},60000);
  if(!result||!result.ok)throw Error(result&&result.error||'Scrittura catalogo non confermata');
  return result
}
async function getSnapshot(){
  for(let i=0;i<80;i++){
    if(typeof window.__capitanBuildSellLikeCsv==='function')return window.__capitanBuildSellLikeCsv();
    await sleep(100)
  }
  throw Error('Generatore CSV non pronto')
}
async function downloadCurrent(btn){
  try{
    btn.disabled=true;
    const pkg=await getSnapshot();
    if(typeof window.__capitanDownloadSellLikeCsv!=='function')throw Error('Download CSV non disponibile');
    window.__capitanDownloadSellLikeCsv();
    log('CSV '+pkg.marketplace+' scaricato: '+pkg.rows+' riga'+(pkg.rows===1?'':'he')+'.','ok')
  }catch(e){console.error(e);log('Scarica CSV: '+String(e&&e.message||e),'bad')}
  finally{btn.disabled=false}
}
async function addCurrent(btn){
  const old=btn.textContent;
  try{
    btn.disabled=true;btn.textContent='Salvataggio…';
    const pkg=await getSnapshot();
    log('Catalogo '+pkg.marketplace+': controllo duplicato e salvataggio…','warn');
    const result=await savePackage(pkg);
    if(result.duplicate){
      log('Catalogo '+pkg.marketplace+': Source Item ID '+pkg.sourceItemId+' già presente · riga '+result.rowStart+'.','warn')
    }else{
      log('Catalogo '+pkg.marketplace+': '+pkg.sourceItemId+' aggiunto · '+result.rowCount+' riga'+(result.rowCount===1?'':'he')+' · da riga '+result.rowStart+'.','ok')
    }
  }catch(e){console.error(e);log('Aggiungi a catalogo: '+String(e&&e.message||e),'bad')}
  finally{btn.disabled=false;btn.textContent=old}
}
function replaceButton(oldBtn,kind){
  if(!oldBtn||oldBtn.dataset.catalogAction)return null;
  const btn=oldBtn.cloneNode(true);
  btn.dataset.catalogAction=kind;
  btn.removeAttribute('onclick');
  btn.disabled=false;
  if(kind==='csv'){
    btn.textContent='Scarica CSV';
    btn.style.background='#2563eb';btn.style.color='#fff';btn.style.borderColor='#1d4ed8';btn.style.fontWeight='700'
  }else{
    btn.textContent='Aggiungi a catalogo';
    btn.style.background='#16a34a';btn.style.color='#fff';btn.style.borderColor='#12813a';btn.style.fontWeight='700'
  }
  oldBtn.replaceWith(btn);
  btn.addEventListener('click',e=>{
    e.preventDefault();e.stopPropagation();
    kind==='csv'?downloadCurrent(btn):addCurrent(btn)
  });
  return btn
}
for(let i=0;i<100;i++){
  const panel=document.getElementById(PANEL_ID);
  const ali=panel&&panel.querySelector('#capitan-aliexpress-best-match');
  const amazon=panel&&panel.querySelector('#capitan-amazon-best-match');
  if(panel&&ali&&amazon){
    replaceButton(ali,'csv');
    replaceButton(amazon,'catalog');
    // Keep the original left-side source buttons untouched; only the two right-side Best Match buttons are replaced.
    const list=panel.querySelector('[data-ebay-action="list"]');if(list)list.style.display='';
    const save=panel.querySelector('[data-ebay-action="csv"]');
    if(save){
      save.dataset.ebayAction='save';
      if(/^Scarica CSV$/i.test(clean(save.textContent)))save.textContent='Save for later';
      save.style.background='';save.style.color='';save.style.borderColor='';save.style.fontWeight=''
    }
    log('Catalogo online pronto.','ok');
    return
  }
  await sleep(100)
}
log('Catalogo online: pulsanti destri non trovati.','warn')
})();