javascript:(()=>{
'use strict';
const PANEL_ID='capitan-sell-like-clone';
const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const visible=el=>!!(el&&el.getClientRects&&el.getClientRects().length);
const PATCH_ID='capitan-sku-fix-v5';if(document.getElementById(PATCH_ID))return;const marker=document.createElement('span');marker.id=PATCH_ID;marker.style.display='none';document.documentElement.appendChild(marker);const panel=document.getElementById(PANEL_ID);if(!panel)return;
function selectedAsins(){return [...panel.querySelectorAll('input.capitan-amazon-choice:checked')].map(x=>clean(x.value)).filter(Boolean)}
function fieldCandidates(){
  const selectors=['input[name*="sku" i]','textarea[name*="sku" i]','input[id*="sku" i]','textarea[id*="sku" i]','input[aria-label*="custom label" i]','textarea[aria-label*="custom label" i]','input[placeholder*="custom label" i]','textarea[placeholder*="custom label" i]','input[data-testid*="sku" i]','textarea[data-testid*="sku" i]','[role="textbox"][aria-label*="custom label" i]','[contenteditable="true"][aria-label*="custom label" i]','[role="textbox"][data-testid*="sku" i]'];
  const out=[];selectors.forEach(s=>{try{document.querySelectorAll(s).forEach(x=>out.push(x))}catch(_){}});return [...new Set(out)];
}
function byCaption(){
  const re=/custom\s*label(?:\s*\(\s*sku\s*\))?|seller\s*sku|merchant\s*sku|^sku$/i;
  for(const l of document.querySelectorAll('label')){
    const t=clean(l.innerText||l.textContent||'');if(!re.test(t))continue;
    let el=l.htmlFor?document.getElementById(l.htmlFor):null;if(el&&(/^(INPUT|TEXTAREA)$/.test(el.tagName)||el.getAttribute('role')==='textbox'||el.isContentEditable))return el;
    el=l.querySelector('input,textarea,[role="textbox"],[contenteditable="true"]');if(el)return el;
    let p=l.parentElement;for(let i=0;i<8&&p;i++,p=p.parentElement){el=p.querySelector('input,textarea,[role="textbox"],[contenteditable="true"]');if(el)return el}
  }
  for(const n of document.querySelectorAll('span,div,p,strong')){
    const t=clean(n.innerText||n.textContent||'');if(t.length>70||!re.test(t))continue;
    let p=n.parentElement;for(let i=0;i<8&&p;i++,p=p.parentElement){const els=[...p.querySelectorAll('input,textarea,[role="textbox"],[contenteditable="true"]')];if(els.length===1)return els[0];const sku=els.find(x=>/sku|custom.?label/i.test(clean([x.name,x.id,x.getAttribute&&x.getAttribute('aria-label'),x.placeholder,x.getAttribute&&x.getAttribute('data-testid')].join(' '))));if(sku)return sku}
  }
  return null;
}
function findSkuField(){const direct=fieldCandidates();const exact=direct.find(x=>visible(x)&&/^sku$/i.test(clean([x.name,x.id,x.getAttribute&&x.getAttribute('aria-label'),x.placeholder].join(' '))));return exact||direct.find(visible)||byCaption()||direct[0]||null}
function skuHeaderCell(){
  const re=/custom\s*label(?:\s*\(\s*sku\s*\))?|seller\s*sku|merchant\s*sku|^sku$/i;
  const cells=[...document.querySelectorAll('th,[role="columnheader"],td,[role="cell"],div,span')].filter(visible).filter(x=>{
    const t=clean(x.innerText||x.textContent||'');return t.length<80&&re.test(t);
  });
  return cells.sort((a,b)=>a.childElementCount-b.childElementCount)[0]||null;
}
function pencilFromSkuColumn(){
  const head=skuHeaderCell();if(!head)return null;
  const th=head.closest('th,[role="columnheader"]')||head;
  const row=th.closest('tr,[role="row"]');
  if(row){
    const cols=[...row.children];
    const idx=cols.indexOf(th);
    const table=row.closest('table,[role="table"],[role="grid"]');
    if(idx>=0&&table){
      const rows=[...table.querySelectorAll('tr,[role="row"]')].filter(visible).filter(r=>r!==row);
      for(const r of rows){
        const cells=[...r.children];const cell=cells[idx];if(!cell)continue;
        const edit=[...cell.querySelectorAll('button,[role="button"],[aria-label],[title]')].filter(visible).find(x=>{
          const t=clean((x.innerText||x.textContent||'')+' '+(x.getAttribute('aria-label')||'')+' '+(x.getAttribute('title')||''));
          return /edit|modify|change|custom label|sku/i.test(t);
        });
        if(edit)return edit;
      }
    }
  }
  let p=head.parentElement;
  for(let i=0;i<8&&p;i++,p=p.parentElement){
    const edit=[...p.querySelectorAll('button,[role="button"],[aria-label],[title]')].filter(visible).find(x=>{
      const t=clean((x.innerText||x.textContent||'')+' '+(x.getAttribute('aria-label')||'')+' '+(x.getAttribute('title')||''));
      return /edit|modify|change|custom label|sku/i.test(t);
    });
    if(edit)return edit;
  }
  return null;
}
function safeEditorClick(el){
  if(!el)return false;
  try{el.scrollIntoView({block:'center'})}catch(_){}
  const a=el.closest&&el.closest('a[href]');
  let stop=null;
  if(a){stop=e=>e.preventDefault();a.addEventListener('click',stop,true)}
  try{
    el.dispatchEvent(new MouseEvent('mousedown',{bubbles:true,cancelable:true,button:0}));
    el.dispatchEvent(new MouseEvent('mouseup',{bubbles:true,cancelable:true,button:0}));
    el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,button:0}));
  }catch(_){try{el.click()}catch(__){}}
  if(a&&stop)setTimeout(()=>a.removeEventListener('click',stop,true),0);
  return true
}
async function waitSkuField(ms=3500){
  const end=Date.now()+ms;while(Date.now()<end){const f=findSkuField();if(f&&visible(f))return f;await sleep(120)}return findSkuField();
}
async function revealSku(){
  let field=findSkuField();if(field&&visible(field))return field;
  const pencil=pencilFromSkuColumn();
  if(pencil){try{safeEditorClick(pencil);field=await waitSkuField();if(field)return field}catch(_){}}
  return findSkuField();
}
async function commitSkuEditor(field){
  let scope=field&&field.closest&&field.closest('[role="dialog"],dialog,form,[role="menu"],[role="group"]');
  if(!scope)scope=field&&field.parentElement;
  for(let i=0;i<6&&scope;i++,scope=scope.parentElement){
    const save=[...scope.querySelectorAll('button,[role="button"],a')].filter(visible).find(x=>/^(save|done|apply|confirm|update|ok)$/i.test(clean(x.innerText||x.textContent||'')));
    if(save){save.click();await sleep(350);return true}
  }
  field?.blur?.();await sleep(250);return true;
}
function setNative(el,value){
  el.focus?.();
  if(el.isContentEditable||el.getAttribute?.('contenteditable')==='true'){
    el.textContent=value;
    try{el.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:value}))}catch(_){el.dispatchEvent(new Event('input',{bubbles:true}))}
    el.dispatchEvent(new Event('change',{bubbles:true}));el.blur?.();return;
  }
  const proto=el instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
  const setter=Object.getOwnPropertyDescriptor(proto,'value')?.set;const old=el.value;
  if(setter)setter.call(el,value);else el.value=value;
  if(el._valueTracker&&typeof el._valueTracker.setValue==='function')el._valueTracker.setValue(old);
  try{el.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:value}))}catch(_){el.dispatchEvent(new Event('input',{bubbles:true}))}
  el.dispatchEvent(new Event('change',{bubbles:true}));
  el.dispatchEvent(new KeyboardEvent('keydown',{bubbles:true,key:'Tab',code:'Tab'}));
  el.dispatchEvent(new KeyboardEvent('keyup',{bubbles:true,key:'Tab',code:'Tab'}));
  el.dispatchEvent(new Event('blur',{bubbles:true}));el.blur?.();
}
function skuContextContains(value){
  const wanted=clean(value);if(!wanted)return false;
  const field=findSkuField();
  if(field&&visible(field)){
    const v=field.isContentEditable?clean(field.textContent):clean(field.value);
    if(v===wanted)return true;
  }
  const head=skuHeaderCell();
  if(!head)return false;
  let p=head;
  for(let i=0;i<8&&p;i++,p=p.parentElement){
    const t=clean(p.innerText||p.textContent||'');
    if(t.includes(wanted))return true;
    if(t.length>2500)break;
  }
  return false;
}
async function writeSku(value){
  let field=findSkuField();if(!field||!visible(field))field=await revealSku();
  if(!field)return {ok:false,reason:'Campo SKU / Custom label (SKU) non trovato nell’editor eBay'};
  for(let i=0;i<4;i++){
    setNative(field,value);await sleep(220);
    const now=field.isContentEditable?clean(field.textContent):clean(field.value);
    if(now!==clean(value))continue;
    await commitSkuEditor(field);
    for(let j=0;j<12;j++){
      await sleep(180);
      if(skuContextContains(value))return {ok:true,field};
    }
  }
  return {ok:false,reason:'Valore scritto ma non confermato da eBay nel campo SKU'};
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