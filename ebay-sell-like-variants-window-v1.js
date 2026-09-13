javascript:(async()=>{
'use strict';
const PANEL_ID='capitan-sell-like-clone';
const PATCH_ID='capitan-variants-window-v10';
const STATE_KEY='capitan-sell-like-variants-state-v1';
if(document.getElementById(PATCH_ID))return;
const m=document.createElement('span');m.id=PATCH_ID;m.style.display='none';document.documentElement.appendChild(m);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const clean=v=>String(v==null?'':v).replace(/\s+/g,' ').trim();
const visible=e=>!!(e&&e.getClientRects&&e.getClientRects().length);
function state(){try{return window.__capitanSellLikeVariants||JSON.parse(localStorage.getItem(STATE_KEY)||'null')}catch(_){return null}}
function variationHeading(doc){
  const nodes=[...doc.querySelectorAll('h1,h2,h3,h4,legend,span,div')].filter(visible).filter(x=>/^variations?$/i.test(clean(x.innerText||x.textContent||'')));
  return nodes.sort((a,b)=>{
    const ta=clean(a.innerText||a.textContent||'').length,tb=clean(b.innerText||b.textContent||'').length;
    return ta-tb;
  })[0]||null
}
function section(doc){
  const h=variationHeading(doc);if(!h)return null;
  const candidates=[];
  let p=h;
  for(let i=0;i<8&&p;i++,p=p.parentElement){
    if(p.closest&&p.closest('#'+PANEL_ID))continue;
    const t=clean(p.innerText||p.textContent||'');
    if(/Save time and money by listing multiple variations/i.test(t)&&t.length<4500)candidates.push(p);
  }
  if(!candidates.length)return null;
  return candidates.sort((a,b)=>clean(a.innerText||a.textContent||'').length-clean(b.innerText||b.textContent||'').length)[0]
}
function editButton(doc){
  const sec=section(doc),h=variationHeading(doc);if(!sec||!h)return null;
  const edits=[...sec.querySelectorAll('button,[role="button"],a')].filter(visible).filter(x=>/^edit$/i.test(clean(x.innerText||x.textContent||''))||/edit.*variation|variation.*edit/i.test(clean((x.innerText||x.textContent||'')+' '+(x.getAttribute('aria-label')||''))));
  if(!edits.length)return null;
  const hr=h.getBoundingClientRect(),hy=(hr.top+hr.bottom)/2;
  return edits.sort((a,b)=>{
    const ar=a.getBoundingClientRect(),br=b.getBoundingClientRect();
    const ay=(ar.top+ar.bottom)/2,by=(br.top+br.bottom)/2;
    return Math.abs(ay-hy)-Math.abs(by-hy);
  })[0]
}
async function waitDoc(win,re,ms=15000){
  const end=Date.now()+ms;
  while(Date.now()<end){
    try{const t=(win.document&&win.document.body&&win.document.body.innerText)||'';if(re.test(t))return true}catch(_){}
    await sleep(200);
  }
  return false
}
async function injectEditor(win){
  try{
    try{const old=win.document&&win.document.querySelector('[id^="capitan-variants-editor-v"]');if(old)old.remove()}catch(_){}
    const src='https://raw.githubusercontent.com/PeppeTek/ebay-tools/main/ebay-sell-like-variants-editor-v1.js?ts='+Date.now();
    const r=await fetch(src,{cache:'no-store'});if(!r.ok)throw Error('GitHub HTTP '+r.status);
    let code=(await r.text()).replace(/^\s*javascript\s*:/i,'');
    win.eval(code);
    return true;
  }catch(e){console.warn('Variant child inject failed',e);return false}
}
async function automateChild(win){
  if(!win)return false;
  try{
    const ready=await waitDoc(win,/VARIATIONS|Save time and money by listing multiple variations|Create your variations|Attributes and options you(?:'|’)ve selected/i,15000);
    if(!ready)return false;

    const body=()=>((win.document&&win.document.body&&win.document.body.innerText)||'');
    if(/Create your variations|Attributes and options you(?:'|’)ve selected/i.test(body())){
      return await injectEditor(win);
    }

    const b=editButton(win.document);
    if(!b)return false;
    b.click();

    const wizard=await waitDoc(win,/Create your variations|Attributes and options you(?:'|’)ve selected/i,15000);
    if(!wizard)return false;
    return await injectEditor(win);
  }catch(e){console.warn('Variant child automation failed',e);return false}
}
async function monitorAndReinject(win,ms=180000){
  const end=Date.now()+ms;let lastHref='',lastWizard=false;
  while(Date.now()<end){
    try{
      if(!win||win.closed)return false;
      const href=String(win.location.href||'');
      const body=(win.document&&win.document.body&&win.document.body.innerText)||'';
      const wizard=/Create your variations|Attributes and options you(?:'|’)ve selected/i.test(body);
      const postWizard=/variation|price|quantity|sku|photos?/i.test(body)&&!/Create your variations/i.test(body);
      const marker=win.document&&win.document.querySelector('[id^="capitan-variants-editor-v"]');
      if((wizard||postWizard)&&(!marker||href!==lastHref||wizard!==lastWizard)){
        await injectEditor(win);
      }
      lastHref=href;lastWizard=wizard;
      if(postWizard&&/save|done|apply|back to listing|return to listing/i.test(body))return true;
    }catch(_){}
    await sleep(400);
  }
  return true
}
function nativeVariationEdit(doc){
  const direct=editButton(doc);if(direct)return direct;
  const edits=[...doc.querySelectorAll('button,[role="button"],a')].filter(visible).filter(x=>{
    const txt=clean(x.innerText||x.textContent||'');
    const aria=clean(x.getAttribute&&x.getAttribute('aria-label')||'');
    return /^edit$/i.test(txt)||/^edit$/i.test(aria)||/edit.*variations?|variations?.*edit/i.test(clean(txt+' '+aria))
  });
  const scored=[];
  for(const b of edits){
    let p=b,depth=0;
    while(p&&depth<10){
      if(p.closest&&p.closest('#'+PANEL_ID))break;
      const t=clean(p.innerText||p.textContent||'');
      if(/\bvariations?\b/i.test(t)&&t.length<12000){
        const r=p.getBoundingClientRect();
        scored.push({b,score:(r.width*r.height||99999999)+(depth*100000)});
        break
      }
      p=p.parentElement;depth++
    }
  }
  if(scored.length)return scored.sort((a,b)=>a.score-b.score)[0].b;
  const h=variationHeading(doc);
  if(h){
    const hr=h.getBoundingClientRect(),hy=(hr.top+hr.bottom)/2;
    const nearby=edits.filter(b=>{const r=b.getBoundingClientRect();const by=(r.top+r.bottom)/2;return Math.abs(by-hy)<220});
    if(nearby.length)return nearby.sort((a,b)=>{
      const ar=a.getBoundingClientRect(),br=b.getBoundingClientRect();
      return Math.abs(((ar.top+ar.bottom)/2)-hy)-Math.abs(((br.top+br.bottom)/2)-hy)
    })[0]
  }
  return null
}
async function openInNewWindow(){
  const st=state();window.__capitanVariantsLastError='';
  if(!st||!st.data||!st.data.hasVariations){
    window.__capitanVariantsLastError='Dati varianti non disponibili.';
    return false
  }

  let win=window.__capitanPreopenedVariantWindow||null;
  try{
    if(win&&!win.closed)win.close();
  }catch(_){}
  try{
    win=window.open('about:blank','capitanVariantsHelper','popup=yes,width=1100,height=820,left=30,top=30');
  }catch(_){}
  if(!win){
    window.__capitanVariantsLastError='Popup bloccato dal browser.';
    return false
  }
  window.__capitanPreopenedVariantWindow=win;

  const transfer=()=>{
    try{
      win.name='capitan-sell-like-variants:'+JSON.stringify(st);
      return true
    }catch(_){return false}
  };
  if(!transfer()){
    try{win.close()}catch(_){}
    window.__capitanVariantsLastError='Trasferimento dati varianti non riuscito.';
    return false
  }

  try{win.resizeTo(1100,820);win.moveTo(30,30)}catch(_){}
  try{win.location.replace(location.href)}catch(_){
    try{win.location.href=location.href}catch(__){
      try{win.close()}catch(___){}
      window.__capitanVariantsLastError='Impossibile aprire una copia della pagina eBay.';
      return false
    }
  }

  let edit=null;
  for(let i=0;i<100&&!edit;i++){
    if(!win||win.closed){
      window.__capitanVariantsLastError='La finestra Variations è stata chiusa.';
      return false
    }
    try{
      if(!/^(?:www\.)?ebay\.com$/i.test(win.location.hostname)){
        await sleep(200);
        continue
      }
      edit=nativeVariationEdit(win.document);
    }catch(_){}
    if(!edit)await sleep(200)
  }

  if(!edit){
    try{win.close()}catch(_){}
    window.__capitanVariantsLastError='Pulsante Edit della sezione Variations non trovato nella finestra secondaria.';
    return false
  }

  transfer();
  try{
    edit.scrollIntoView({block:'center',inline:'center'});
    edit.click();
  }catch(_){
    try{win.close()}catch(__){}
    window.__capitanVariantsLastError='Click su Edit Variations non riuscito nella finestra secondaria.';
    return false
  }

  for(let i=0;i<100;i++){
    if(!win||win.closed){
      window.__capitanVariantsLastError='La finestra Variations è stata chiusa.';
      return false
    }
    try{
      const bulkFrame=[...win.document.querySelectorAll('iframe')].find(el=>/bulkedit\.ebay\.com\/msku/i.test(String(el.src||el.getAttribute('src')||'')))||null;
      if(bulkFrame){
        const target=String(bulkFrame.src||bulkFrame.getAttribute('src')||'');
        transfer();
        try{win.location.replace(target)}catch(_){try{win.location.href=target}catch(__){}}
        try{win.focus()}catch(_){}
        return true
      }
      const href=String(win.location.href||'');
      if(/bulkedit\.ebay\.com\/msku/i.test(href)){
        try{win.focus()}catch(_){}
        return true
      }
    }catch(_){
      try{win.focus()}catch(__){}
      return true
    }
    await sleep(200)
  }

  try{win.close()}catch(_){}
  window.__capitanVariantsLastError='La finestra secondaria non ha raggiunto l’editor bulkedit/msku.';
  return false
}
window.__capitanOpenVariantsWindow=openInNewWindow;
window.__capitanAutoConfigureVariants=openInNewWindow;
function bindFallback(){
  document.addEventListener('click',async e=>{
    const b=e.target.closest('button,[role="button"],a');if(!b)return;
    const sec=section(document);if(!sec||!sec.contains(b))return;
    if(!/^edit$/i.test(clean(b.innerText||b.textContent||''))&&!/edit.*variation|variation.*edit/i.test(clean((b.innerText||b.textContent||'')+' '+(b.getAttribute('aria-label')||''))))return;
    const st=state();if(!st||!st.data||!st.data.hasVariations)return;if(window.__capitanOpeningVariants)return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    const ok=await openInNewWindow();
    if(!ok)alert('Impossibile aprire l\'editor Variations. Usa il pulsante “Aggiungi varianti al prodotto” nel pannello Sell Like Clone.');
  },true);
}
bindFallback();
})();