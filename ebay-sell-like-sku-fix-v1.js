javascript:(()=>{
'use strict';
const PANEL_ID='capitan-sell-like-clone';
const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const visible=el=>!!(el&&el.getClientRects&&el.getClientRects().length);
const panel=document.getElementById(PANEL_ID);if(!panel)return;
function selectedAsins(){return [...panel.querySelectorAll('input.capitan-amazon-choice:checked')].map(x=>clean(x.value)).filter(Boolean)}
function fieldCandidates(){
  const selectors=['input[name*="sku" i]','textarea[name*="sku" i]','input[id*="sku" i]','textarea[id*="sku" i]','input[aria-label*="custom label" i]','textarea[aria-label*="custom label" i]','input[placeholder*="custom label" i]','textarea[placeholder*="custom label" i]','input[data-testid*="sku" i]','textarea[data-testid*="sku" i]'];
  const out=[];selectors.forEach(s=>{try{document.querySelectorAll(s).forEach(x=>out.push(x))}catch(_){}});return [...new Set(out)];
}
function byCaption(){
  const re=/custom\s*label(?:\s*\(\s*sku\s*\))?|seller\s*sku|merchant\s*sku|^sku$/i;
  for(const l of document.querySelectorAll('label')){
    const t=clean(l.innerText||l.textContent||'');if(!re.test(t))continue;
    let el=l.htmlFor?document.getElementById(l.htmlFor):null;if(el&&/^(INPUT|TEXTAREA)$/.test(el.tagName))return el;
    el=l.querySelector('input,textarea');if(el)return el;
    let p=l.parentElement;for(let i=0;i<7&&p;i++,p=p.parentElement){el=p.querySelector('input,textarea');if(el)return el}
  }
  for(const n of document.querySelectorAll('span,div,p,strong')){
    const t=clean(n.innerText||n.textContent||'');if(t.length>70||!re.test(t))continue;
    let p=n.parentElement;for(let i=0;i<7&&p;i++,p=p.parentElement){const els=[...p.querySelectorAll('input,textarea')];if(els.length===1)return els[0];const sku=els.find(x=>/sku|custom.?label/i.test(clean([x.name,x.id,x.getAttribute('aria-label'),x.placeholder].join(' '))));if(sku)return sku}
  }
  return null;
}
function findSkuField(){const direct=fieldCandidates();return direct.find(visible)||byCaption()||direct[0]||null}
async function revealSku(){
  const re=/custom\s*label|seller\s*sku|merchant\s*sku|\bsku\b/i;
  const clickable=[...document.querySelectorAll('button,[role="button"],summary,a')].filter(visible).filter(x=>re.test(clean((x.innerText||x.textContent||'')+' '+(x.getAttribute('aria-label')||''))));
  for(const b of clickable){try{b.click();await sleep(180);const f=findSkuField();if(f)return f}catch(_){}}
  const more=[...document.querySelectorAll('button,[role="button"],summary,a')].filter(visible).find(x=>/show more|more options|optional|additional/i.test(clean((x.innerText||x.textContent||'')+' '+(x.getAttribute('aria-label')||''))));
  if(more){try{more.click();await sleep(250)}catch(_){}}
  return findSkuField();
}
function setNative(el,value){
  const proto=el instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
  const setter=Object.getOwnPropertyDescriptor(proto,'value')?.set;const old=el.value;
  el.focus();if(setter)setter.call(el,value);else el.value=value;
  if(el._valueTracker&&typeof el._valueTracker.setValue==='function')el._valueTracker.setValue(old);
  try{el.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:value}))}catch(_){el.dispatchEvent(new Event('input',{bubbles:true}))}
  el.dispatchEvent(new Event('change',{bubbles:true}));
  el.dispatchEvent(new Event('blur',{bubbles:true}));el.blur();
}
async function writeSku(value){
  let field=findSkuField();if(!field)field=await revealSku();if(!field)return {ok:false,reason:'Campo Custom label (SKU) non trovato'};
  for(let i=0;i<3;i++){setNative(field,value);await sleep(220);if(clean(field.value)===clean(value))return {ok:true,field}}
  return {ok:false,reason:'eBay non ha mantenuto il valore SKU'};
}
function setStatus(html){const s=panel.querySelector('#capitan-amazon-status');if(s)s.innerHTML=html}
document.addEventListener('click',async e=>{
  const btn=e.target.closest('#capitan-amazon-insert');if(!btn)return;
  e.preventDefault();e.stopImmediatePropagation();
  const asins=selectedAsins();if(!asins.length){setStatus('<span style="color:#b42318;font-weight:700">Seleziona almeno un ASIN.</span>');return}
  const value=asins.join(' - ');btn.disabled=true;setStatus('<span style="color:#555">Inserimento ASIN nel Custom label (SKU)…</span>');
  try{const r=await writeSku(value);if(!r.ok)throw Error(r.reason);setStatus('<span style="color:#137333;font-weight:700">ASIN inseriti nel Custom label (SKU):</span> '+value);try{r.field.scrollIntoView({block:'center',behavior:'smooth'})}catch(_){}}
  catch(err){setStatus('<span style="color:#b42318;font-weight:700">'+String(err.message||err)+'</span>')}
  finally{btn.disabled=false}
},true);
})();