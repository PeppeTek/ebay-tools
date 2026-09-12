javascript:(async()=>{
'use strict';
const PANEL_ID='capitan-sell-like-clone';
const MARK='capitan-condition-helper-v1';
if(document.getElementById(MARK))return;
const marker=document.createElement('span');marker.id=MARK;marker.style.display='none';document.documentElement.appendChild(marker);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
const visible=e=>!!(e&&e.getClientRects&&e.getClientRects().length);
function labelOf(el){if(!el)return'';if(el.tagName==='OPTION')return clean(el.textContent);if(el.matches?.('input[type="radio"]')){const id=el.id;let lab=null;try{lab=id?document.querySelector('label[for="'+CSS.escape(id)+'"]'):null}catch(_){}lab=lab||el.closest('label');return clean(lab?.innerText||lab?.textContent||el.getAttribute('aria-label')||el.value||'')}return clean(el.innerText||el.textContent||el.getAttribute?.('aria-label')||el.value||'')}
function score(v){v=clean(v).toLowerCase();if(v==='new')return 100;if(v==='brand new')return 99;if(/^new with tags\b/.test(v))return 98;if(/^new without tags\b/.test(v))return 96;if(/^new with box\b/.test(v))return 94;if(/^new without box\b/.test(v))return 92;if(/^new\b/.test(v))return 80;return-1}
function best(nodes){return nodes.map(el=>({el,label:labelOf(el),score:score(labelOf(el))})).filter(x=>x.score>=0).sort((a,b)=>b.score-a.score)[0]||null}
function conditionRow(){const p=document.getElementById(PANEL_ID);if(!p)return null;return [...p.querySelectorAll('.row')].find(r=>/^Condizione\s*:/i.test(clean(r.innerText||r.textContent||'')))||null}
function updateRow(label){const row=conditionRow();if(!row)return;const span=row.querySelector('span');if(span){span.className='ok';span.textContent=label}else row.innerHTML='<b>Condizione:</b> <span class="ok">'+label.replace(/[&<>]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]))+'</span>'}
function findConditionSection(){return [...document.querySelectorAll('section,div')].filter(x=>!x.closest('#'+PANEL_ID)).find(x=>{const h=clean(x.querySelector('h2,h3,label,legend')?.textContent||'');const t=clean(x.innerText||'');return /^condition$/i.test(h)&&t.length<1800})||null}
function findConditionControl(){for(const l of [...document.querySelectorAll('label')].filter(x=>!x.closest('#'+PANEL_ID))){if(!/^condition$/i.test(clean(l.innerText||l.textContent||'')))continue;let c=l.htmlFor?document.getElementById(l.htmlFor):null;c=c||l.querySelector('select,[role="combobox"],button,input');if(c)return c;let p=l.parentElement;for(let i=0;i<4&&p;i++,p=p.parentElement){c=p.querySelector('select,[role="combobox"],button,input');if(c)return c}}
return [...document.querySelectorAll('select,[role="combobox"],button')].filter(x=>!x.closest('#'+PANEL_ID)&&visible(x)).find(x=>/condition/i.test(clean([x.id,x.name,x.getAttribute('aria-label'),x.innerText].join(' '))))||null}
async function choose(){
  const existing=conditionRow();if(existing&&/class="ok"/i.test(existing.innerHTML)&&!/controlla manualmente/i.test(existing.innerText||''))return false;
  const control=findConditionControl();
  if(control&&control.tagName==='SELECT'){
    const pick=best([...control.options].filter(o=>!o.disabled));
    if(!pick)return false;
    control.value=pick.el.value;control.dispatchEvent(new Event('input',{bubbles:true}));control.dispatchEvent(new Event('change',{bubbles:true}));await sleep(250);updateRow(pick.label);return true;
  }
  const section=findConditionSection();
  if(control&&control.tagName!=='SELECT'){try{control.click();await sleep(300)}catch(_){}}
  else if(section){const opener=[...section.querySelectorAll('button,[role="button"]')].find(x=>visible(x));if(opener){opener.click();await sleep(300)}}
  const dialogs=[...document.querySelectorAll('[role="dialog"]')].filter(visible);
  const scope=dialogs.find(d=>/condition/i.test(clean(d.innerText||d.textContent)))||document;
  const nodes=[...scope.querySelectorAll('[role="option"],[role="radio"],input[type="radio"],label,button')].filter(x=>visible(x)&&!x.disabled&&!x.closest('#'+PANEL_ID));
  const pick=best(nodes);if(!pick)return false;
  pick.el.click();await sleep(250);
  const dialog=pick.el.closest('[role="dialog"]')||dialogs.find(d=>d.contains(pick.el));
  if(dialog){const done=[...dialog.querySelectorAll('button,[role="button"]')].find(x=>/^(done|save|apply|confirm)$/i.test(clean((x.innerText||x.textContent||'')+' '+(x.getAttribute('aria-label')||''))));if(done){done.click();await sleep(350)}}
  updateRow(pick.label);return true;
}
for(let i=0;i<12;i++){if(await choose())break;await sleep(350)}
})();