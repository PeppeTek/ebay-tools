javascript:(async()=>{
'use strict';
const PATCH_ID='capitan-variants-csv-v2';
const STATE_KEY='capitan-sell-like-variants-state-v1';
const CLONE_KEY='capitan-sell-like-clone-data-v1';
if(document.getElementById(PATCH_ID))return;
const marker=document.createElement('span');marker.id=PATCH_ID;marker.style.display='none';document.documentElement.appendChild(marker);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const clean=v=>String(v==null?'':v).replace(/\s+/g,' ').trim();
const visible=e=>!!(e&&e.getClientRects&&e.getClientRects().length);
const escCsv=v=>{const s=String(v==null?'':v);return /[",\r\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s};
function readJson(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch(_){return null}}
function variantState(){return window.__capitanSellLikeVariants||readJson(STATE_KEY)}
function cloneData(){return window.__capitanSellLikeCloneData||readJson(CLONE_KEY)}
function setStatus(msg,bad=false){
  const s=document.querySelector('#capitan-variants-auto-status');
  if(s){s.textContent=msg;s.style.color=bad?'#b3261e':'#137333'}
}
function findControlByLabel(re){
  for(const l of document.querySelectorAll('label')){
    const t=clean(l.innerText||l.textContent||'');
    if(!re.test(t))continue;
    let c=l.htmlFor?document.getElementById(l.htmlFor):l.querySelector('input,textarea,select,[role="combobox"],button');
    if(c)return c;
    let p=l.parentElement;
    for(let i=0;i<4&&p;i++,p=p.parentElement){c=p.querySelector('input,textarea,select,[role="combobox"],button');if(c)return c}
  }
  return null
}
function normalizePolicyName(v){return clean(v)
  .replace(/\s*[\(\[]\s*\d+\s+listings?\s*[\)\]]\s*/ig,' ')
  .replace(/\s+/g,' ')
  .trim()}
function controlValue(el){
  if(!el)return'';
  if(el.tagName==='SELECT'){const o=el.options&&el.options[el.selectedIndex];return clean(o&&o.textContent||el.value)}
  if('value' in el&&clean(el.value))return clean(el.value);
  return clean(el.innerText||el.textContent||el.getAttribute&&el.getAttribute('aria-label')||'')
}
function currentTitle(){
  const d=cloneData()||{};
  if(clean(d.title))return clean(d.title).slice(0,80);
  const c=findControlByLabel(/^title$/i)||[...document.querySelectorAll('input,textarea')].find(x=>/title/i.test(clean([x.name,x.id,x.placeholder,x.getAttribute('aria-label')].join(' '))));
  return clean(controlValue(c)).slice(0,80)
}
function currentCategoryId(){
  const d=cloneData()||{},st=variantState()||{},vd=st.data||{};
  const vals=[d.categoryId,vd.categoryId,vd.categoryID];
  for(const v of vals){if(/^\d{1,10}$/.test(clean(v)))return clean(v)}
  const all=[...document.querySelectorAll('input,[data-category-id],[data-categoryid]')];
  for(const e of all){
    for(const v of [e.value,e.getAttribute('data-category-id'),e.getAttribute('data-categoryid')]){
      if(/^\d{1,10}$/.test(clean(v)))return clean(v)
    }
  }
  const m=(document.body&&document.body.innerHTML||'').match(/(?:categoryId|categoryID|category_id)["'=:\s]+(\d{1,10})/i);
  return m?m[1]:''
}
function policyName(kind){
  const re=new RegExp(kind+'.*(policy|profile)|(policy|profile).*'+kind,'i');
  const controls=[...document.querySelectorAll('select,input,[role="combobox"],button')].filter(visible);
  for(const e of controls){
    const meta=clean([e.name,e.id,e.placeholder,e.getAttribute('aria-label')].join(' '));
    if(re.test(meta)){
      const v=controlValue(e);
      if(v&&!/^(edit|change|select|add)$/i.test(v))return normalizePolicyName(v)
    }
  }
  const labels=[...document.querySelectorAll('label,h2,h3,h4,legend,div,span')].filter(visible).filter(x=>re.test(clean(x.innerText||x.textContent||'')));
  for(const l of labels){
    let p=l;
    for(let i=0;i<5&&p;i++,p=p.parentElement){
      const candidates=[...p.querySelectorAll('select,[role="combobox"],button,input')].filter(visible);
      for(const e of candidates){
        const v=controlValue(e);
        if(v&&!/^(edit|change|select|add|shipping|returns?|payment)$/i.test(v)&&v.length<=120)return normalizePolicyName(v)
      }
    }
  }
  return''
}
function currentSkuBase(){
  const c=findControlByLabel(/custom label|sku/i)||[...document.querySelectorAll('input')].find(x=>/sku|custom.?label/i.test(clean([x.name,x.id,x.placeholder,x.getAttribute('aria-label')].join(' '))));
  const v=clean(controlValue(c));
  const st=variantState()||{};
  return (v||clean(st.data&&st.data.itemId)||clean(window.__capitanSellLikeSourceItemId)||'SLV').replace(/[^A-Za-z0-9._-]+/g,'-').slice(0,36)
}
function relationshipParent(dims){
  return dims.map(d=>clean(d.name)+'='+(d.values||[]).map(clean).filter(Boolean).join(';')).join('|')
}
function relationshipChild(v){
  return (v.specifics||[]).map(s=>clean(s.name)+'='+clean(s.value)).filter(x=>!/=$/.test(x)).join('|')
}
function firstSpecificValue(v,name){
  const low=clean(name).toLowerCase();
  const s=(v.specifics||[]).find(x=>clean(x.name).toLowerCase()===low);
  return clean(s&&s.value)
}
function salePrice(v,discount){
  const n=Number(v&&v.sourcePrice);if(!isFinite(n)||n<=0)return'';
  return (Math.round(n*(1-discount)*100)/100).toFixed(2)
}
function identifier(v,names){
  for(const n of names){
    if(v&&v[n]!=null&&clean(v[n]))return clean(v[n]);
    const s=(v&&v.specifics||[]).find(x=>clean(x.name).toLowerCase()===String(n).toLowerCase());
    if(s&&clean(s.value))return clean(s.value)
  }
  return''
}
function safeUrl(u){u=clean(u).replace(/\s/g,'%20');return /^https?:\/\//i.test(u)?u:''}
function defaultPhotos(data,clone){
  const out=[];
  for(const u of [...(clone.images||[]),...(data.images||[])]){
    const x=safeUrl(u);if(x&&!out.includes(x))out.push(x)
  }
  return out.slice(0,12)
}
function dynamicAspectHeaders(clone,dims){
  const blocked=new Set(['upc','ean','isbn','epid','mpn',...dims.map(d=>clean(d.name).toLowerCase())]);
  const out=[];
  for(const k of Object.keys(clone.aspects||{})){
    const name=clean(k),val=clean(clone.aspects[k]);
    if(!name||!val||blocked.has(name.toLowerCase()))continue;
    out.push({header:'C:'+name,value:val})
  }
  return out.slice(0,35)
}
function locationFields(clone){
  const p=clone.itemLocationParts||{};
  const postal=clean(p.postalCode);
  if(postal)return {header:'PostalCode',value:postal};
  const city=clean(p.city),state=clean(p.stateOrProvince);
  const loc=[city,state].filter(Boolean).join(', ');
  return {header:'Location',value:loc||clean(clone.itemLocation)}
}
function buildCsv(){
  const st=variantState(),clone=cloneData();
  if(!st||!st.data||!st.data.hasVariations)throw Error('Dati varianti non disponibili');
  if(!clone||!clone.ok)throw Error('Dati listing non ancora pronti');
  const data=st.data,dims=Array.isArray(data.dimensions)?data.dimensions:[],variants=Array.isArray(data.variants)?data.variants:[];
  if(!dims.length||!variants.length)throw Error('Varianti incomplete nel payload');
  const title=currentTitle(),categoryId=currentCategoryId();
  if(!title)throw Error('Titolo non trovato');
  if(!categoryId)throw Error('Category ID non trovato');
  const shipping=policyName('shipping'),returns=policyName('return'),payment=policyName('payment');
  const missing=[];if(!shipping)missing.push('Shipping policy');if(!returns)missing.push('Return policy');if(!payment)missing.push('Payment policy');
  if(missing.length)throw Error('Policy non lette automaticamente: '+missing.join(', '));
  const country=clean(clone.country||'US').toUpperCase()||'US';
  const currency=clean(data.currency||'USD').toUpperCase()||'USD';
  const site=country==='US'?'US':country;
  const action='*Action(SiteID='+site+'|Country='+country+'|Currency='+currency+'|Version=1193)';
  const loc=locationFields(clone);
  const aspects=dynamicAspectHeaders(clone,dims);
  const headers=[action,'Category ID','Custom label (SKU)','Title','Relationship','Relationship details','P:UPC','Start price','Quantity','Item photo URL','Condition ID','Description','Format','Duration',loc.header,'Shipping profile name','Payment profile name','Return profile name',...aspects.map(x=>x.header)];
  const idx=Object.fromEntries(headers.map((h,i)=>[h,i]));
  const row=()=>Array(headers.length).fill('');
  const parent=row();
  parent[idx[action]]='Add';
  parent[idx['Category ID']]=categoryId;
  parent[idx['Custom label (SKU)']]=currentSkuBase();
  parent[idx['Title']]=title;
  parent[idx['Relationship details']]=relationshipParent(dims);
  parent[idx['Item photo URL']]=defaultPhotos(data,clone).join('|');
  parent[idx['Condition ID']]='1000';
  parent[idx['Description']]=String(clone.descriptionHtml||'').slice(0,32700);
  parent[idx['Format']]='FixedPrice';
  parent[idx['Duration']]='GTC';
  parent[idx[loc.header]]=loc.value;
  parent[idx['Shipping profile name']]=shipping;
  parent[idx['Payment profile name']]=payment;
  parent[idx['Return profile name']]=returns;
  aspects.forEach(a=>{parent[idx[a.header]]=a.value});
  const rows=[parent];
  const qty=Number(clone.quantity||3)||3,discount=isFinite(Number(st.discountRate))?Number(st.discountRate):.02;
  const skuBase=currentSkuBase();
  const photoDim=dims[0]&&clean(dims[0].name);
  const photoDone=new Set();
  variants.forEach((v,i)=>{
    const r=row();
    r[idx['Custom label (SKU)']]=(skuBase+'-'+String(i+1).padStart(2,'0')).slice(0,50);
    r[idx['Relationship']]='Variation';
    r[idx['Relationship details']]=relationshipChild(v);
    r[idx['P:UPC']]=identifier(v,['upc','UPC']);
    r[idx['Start price']]=salePrice(v,discount);
    r[idx['Quantity']]=qty;
    if(photoDim){
      const pv=firstSpecificValue(v,photoDim),key=pv.toLowerCase();
      if(pv&&!photoDone.has(key)){
        const urls=(v.images||[]).map(safeUrl).filter(Boolean).slice(0,12);
        if(urls.length){r[idx['Item photo URL']]=pv+'='+urls.join('|');photoDone.add(key)}
      }
    }
    rows.push(r)
  });
  const csv=[headers,...rows].map(r=>r.map(escCsv).join(',')).join('\r\n');
  return {csv,fileName:'sell-like-variants-'+clean(data.itemId||window.__capitanSellLikeSourceItemId||Date.now())+'.csv',rows:rows.length-1,policies:{shipping,payment,returns}}
}
function download(res){
  const blob=new Blob(['\ufeff'+res.csv],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=res.fileName;document.body.appendChild(a);a.click();setTimeout(()=>{a.remove();URL.revokeObjectURL(url)},500)
}
async function run(){
  for(let i=0;i<120;i++){
    const st=variantState(),cl=cloneData();
    if(st&&st.data&&st.data.hasVariations&&cl&&cl.ok){
      try{
        const res=buildCsv();
        window.__capitanVariantCsv=res;
        const panel=document.getElementById('capitan-sell-like-clone');
        const b=panel&&panel.querySelector('[data-ebay-action="csv"],[data-ebay-action="save"]');
        window.__capitanDownloadVariantCsv=()=>download(res);
        if(b){
          b.dataset.ebayAction='csv';
          b.textContent='Scarica CSV';
          b.style.background='#16a34a';
          b.style.color='#fff';
          b.style.border='1px solid #12813a';
          b.style.fontWeight='700';
          b.style.cursor='pointer';
          b.onclick=null
        }
        const list=panel&&panel.querySelector('[data-ebay-action="list"]');
        if(list)list.style.display='none';
        setStatus('CSV varianti pronto: '+res.rows+' varianti.');
        try{if(typeof window.__capitanStopProcessTimer==='function')window.__capitanStopProcessTimer()}catch(_){};
      }catch(e){
        console.warn('Variant CSV',e);
        setStatus('CSV varianti non generato: '+(e&&e.message?e.message:e),true);
        try{if(typeof window.__capitanStopProcessTimer==='function')window.__capitanStopProcessTimer()}catch(_){};
      }
      return
    }
    await sleep(250)
  }
  setStatus('CSV varianti non generato: dati non pronti.',true);
  try{if(typeof window.__capitanStopProcessTimer==='function')window.__capitanStopProcessTimer()}catch(_){};
}
run();
})();