javascript:(async()=>{
'use strict';
const PATCH_ID='capitan-variants-csv-v7';
const STATE_KEY='capitan-sell-like-variants-state-v1';
const CLONE_KEY='capitan-sell-like-clone-data-v1';
const LISTINGS_TEMPLATE_HEADERS=[
'*Action(SiteID=US|Country=US|Currency=USD|Version=1193)','Custom label (SKU)','Category ID','Category name','CATEGORY_SELECT','Title','Schedule Time','Item photo URL','Description','Buy It Now price','Start price','Relationship','Relationship details','Quantity','P:UPC','Shipping profile name','Return profile name','Payment profile name','Condition ID','Format','Duration','Location','C:Compatible Brand','C:Compatible Model','C:Features','C:Cord Type','C:Included Accessories','C:Charge Time','C:For','C:Form','C:Number in Pack','C:Scent','C:Suitable For','C:Power Source','C:Game','C:MPN','C:Brand','C:Type','C:Color','C:Item Height','C:Item Length','C:Item Width','C:Stove Type Compatibility','C:Model','C:Dosage','C:Expiration Date','C:Product','ASPECTS_REQUIRED_STATUS','ASPECTS_REQUIRED_FIELDS','IMG_WRITE_STATUS ','P:EPID','VideoID','C:EPA Registration Number','TakeBackPolicyID','Regional TakeBackPolicies','ProductCompliancePolicyID','Regional ProductCompliancePolicies','Hazmat Pictograms','Hazmat SignalWord','Hazmat Statements','Hazmat Component','EcoParticipationFee','Product Safety Pictograms','Product Safety Statements','Product Safety Component','Regulatory Document Ids','Manufacturer Name','Manufacturer AddressLine1','Manufacturer AddressLine2','Manufacturer City','Manufacturer Country','Manufacturer PostalCode','Manufacturer StateOrProvince','Manufacturer Phone','Manufacturer Email','Manufacturer ContactURL','Responsible Person 1','Responsible Person 1 Type','Responsible Person 1 AddressLine1','Responsible Person 1 AddressLine2','Responsible Person 1 City','Responsible Person 1 Country','Responsible Person 1 PostalCode','Responsible Person 1 StateOrProvince','Responsible Person 1 Phone','Responsible Person 1 Email','Responsible Person 1 ContactURL','C:Smart Home Compatibility','C:Smart Home Protocol','Shipping service 1 option','Shipping service 1 cost','Shipping service 1 priority','Shipping service 2 option','Shipping service 2 cost','Shipping service 2 priority','Max dispatch time','Returns accepted option','Returns within option','Refund option','Return shipping cost paid by','Best Offer Enabled','Best Offer Auto Accept Price','Minimum Best Offer Price','Immediate pay required','C:Style','C: Size','C:Department','C:Body Area','C:Material','C:Part Type','C:Number of Shelves','C:Ink Color','C:For Instrument','C:Insect Repellent Treated','C:Bait Type','C:Connectivity','C:Colour','C:Manufacturer Part Number','C:Author','C:Book Title','C:Language','C:Exterior Material','C:Exterior Colour','C:Size','C:Chipset Manufacturer','C:Chipset/GPU Model','C:Compatible Mattress Size','C:Frame Material','C:Playable Media Format','C:Set','C:Golf Club Type','C:Handedness','C:Format','C:Movie/TV Title','C:Shade','C:Artist','C:Release Title','C:Installation'
];
const LISTINGS_INTERNAL_HEADERS=new Set(['CATEGORY_SELECT','ASPECTS_REQUIRED_STATUS','ASPECTS_REQUIRED_FIELDS','IMG_WRITE_STATUS','VARIATION_VALIDATION_STATUS','VARIATION_VALIDATION_DETAILS']);
function listingsExportHeaders(){return LISTINGS_TEMPLATE_HEADERS.filter(h=>!LISTINGS_INTERNAL_HEADERS.has(clean(h)))}

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
function normalizePolicyName(v){return String(v==null?'':v)
  .replace(/[\u200B-\u200D\uFEFF]/g,'')
  .replace(/\u00A0/g,' ')
  .replace(/\s*[\(\[][^\)\]]*listings?[^\)\]]*[\)\]]\s*/ig,' ')
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
  const source=clean(d.title).slice(0,80);
  if(source)return source;
  const input=[...document.querySelectorAll('input[type="text"],textarea')]
    .find(x=>/^title$/i.test(clean(x.getAttribute('aria-label')||x.name||x.id||'')));
  return clean(input&&input.value).slice(0,80)
}
function currentDescription(){
  const d=cloneData()||{};
  const prepared=String(d.descriptionHtml||'').trim();
  if(prepared)return prepared;

  const candidates=[...document.querySelectorAll('textarea,[contenteditable="true"]')];
  const descCandidates=candidates.filter(e=>{
    const meta=clean([e.name,e.id,e.placeholder,e.getAttribute&&e.getAttribute('aria-label')].join(' '));
    if(/\bdescription\b/i.test(meta))return true;
    let p=e,depth=0;
    while(p&&depth<6){
      const h=p.querySelector&&p.querySelector('h2,h3,legend,label');
      if(/^description$/i.test(clean(h&&h.textContent||'')))return true;
      p=p.parentElement;depth++
    }
    return false
  });
  for(const e of descCandidates){
    if(e.matches('[contenteditable="true"]')){const html=String(e.innerHTML||'').trim();if(html&&html!=='<br>')return html}
    else{const v=String(e.value||'').trim();if(v)return v}
  }
  return''
}
function currentConditionId(){
  const direct=findControlByLabel(/condition/i);
  if(direct){
    if(direct.tagName==='SELECT'){const o=direct.options&&direct.options[direct.selectedIndex];for(const v of [o&&o.value,direct.value,o&&o.getAttribute&&o.getAttribute('data-condition-id')]){if(/^\d{3,5}$/.test(clean(v)))return clean(v)}}
    for(const v of [direct.value,direct.getAttribute&&direct.getAttribute('data-condition-id'),direct.getAttribute&&direct.getAttribute('data-value')]){if(/^\d{3,5}$/.test(clean(v)))return clean(v)}
  }
  for(const e of document.querySelectorAll('[data-condition-id],[data-testid*="condition"],input,select,button')){
    const meta=clean([e.name,e.id,e.getAttribute&&e.getAttribute('aria-label'),e.getAttribute&&e.getAttribute('data-testid')].join(' '));
    if(!/condition/i.test(meta)&&!(e.hasAttribute&&e.hasAttribute('data-condition-id')))continue;
    for(const v of [e.getAttribute&&e.getAttribute('data-condition-id'),e.value,e.getAttribute&&e.getAttribute('data-value')]){if(/^\d{3,5}$/.test(clean(v)))return clean(v)}
  }
  return '1000'
}
function currentCategoryId(){
  const d=cloneData()||{},st=variantState()||{},vd=st.data||{};
  for(const v of [d.categoryId,d.categoryID,vd.categoryId,vd.categoryID]){
    if(/^\d{2,12}$/.test(clean(v)))return clean(v)
  }
  for(const e of document.querySelectorAll('[data-category-id],[data-categoryid]')){
    for(const v of [e.getAttribute('data-category-id'),e.getAttribute('data-categoryid')]){
      if(/^\d{2,12}$/.test(clean(v)))return clean(v)
    }
  }
  const categoryHeads=[...document.querySelectorAll('h2,h3,h4,div,section')].filter(e=>/^item category$/i.test(clean(e.innerText||e.textContent||'')));
  for(const h of categoryHeads){
    let p=h.parentElement;
    for(let depth=0;depth<4&&p;depth++,p=p.parentElement){
      for(const a of p.querySelectorAll('a[href]')){
        const href=String(a.href||'');
        const m=href.match(/(?:categoryId=|cat=|\/b\/[^/?#]+\/)(\d{2,12})(?:[/?#&]|$)/i);
        if(m)return m[1]
      }
    }
  }
  const html=String(document.documentElement&&document.documentElement.innerHTML||'');
  const m=html.match(/["']category(?:Id|ID)["']\s*[:=]\s*["']?(\d{2,12})/);
  return m?m[1]:''
}
function currentCategoryName(){
  const bad=v=>!v||/learn more|opens in a new window|^edit$/i.test(clean(v));
  const heads=[...document.querySelectorAll('h1,h2,h3,h4,div,span')].filter(e=>/^item category$/i.test(clean(e.innerText||e.textContent||'')));
  for(const h of heads){
    let p=h.parentElement;
    for(let depth=0;depth<5&&p;depth++,p=p.parentElement){
      const links=[...p.querySelectorAll('a[href]')].map(a=>clean(a.innerText||a.textContent||'')).filter(v=>!bad(v));
      if(links.length){const name=links[0];return name.startsWith('/')?name:'/'+name}
    }
  }
  const d=cloneData()||{},st=variantState()||{},vd=st.data||{};
  let name=clean(d.categoryName||vd.categoryName||'');
  if(bad(name))return'';
  return name?(name.startsWith('/')?name:'/'+name):''
}
function policyName(kind){
  const label={shipping:'Shipping policy',return:'Return policy',payment:'Payment policy'}[kind];
  const good=v=>{v=normalizePolicyName(v);if(!v||v.length>180)return'';if(/^(edit|change|select|add|help|done|\.\.\.)$/i.test(v))return'';return v};
  let bodyText='';
  try{
    const copy=document.body.cloneNode(true);
    const panel=copy.querySelector('#capitan-sell-like-clone');if(panel)panel.remove();
    copy.querySelectorAll('script,style,noscript').forEach(x=>x.remove());
    bodyText=String(copy.innerText||copy.textContent||'')
  }catch(_){bodyText=String(document.body&&document.body.innerText||'')}
  const lines=bodyText.split(/\r?\n/).map(clean).filter(Boolean);
  const escaped=label.replace(/[.*+?^$()|[\]\\]/g,'\\$&');
  const inlineRe=new RegExp('^'+escaped+'\\s*[\\[(]\\s*\\d+\\s+listings?','i');
  for(const line of lines){if(inlineRe.test(line)){const v=good(line);if(v)return v}}
  for(let i=0;i<lines.length;i++){
    if(lines[i].toLowerCase()!==label.toLowerCase())continue;
    for(let j=i+1;j<Math.min(lines.length,i+7);j++){
      if(/^(shipping policy|return policy|payment policy)$/i.test(lines[j]))break;
      if(/^(shipping|returns?|payment|item location|listing details|preferences)$/i.test(lines[j]))break;
      const v=good(lines[j]);
      if(!v)continue;
      if(/\b\d+\s+listings?\b/i.test(lines[j])||j===i+1)return v
    }
  }
  const labels=[...document.querySelectorAll('label,div,span,p')].filter(x=>clean(x.innerText||x.textContent||'').toLowerCase()===label.toLowerCase());
  for(const l of labels){
    let p=l.parentElement;
    for(let depth=0;depth<4&&p;depth++,p=p.parentElement){
      const vals=[...p.querySelectorAll('input,textarea,select,[role="combobox"],button,[role="button"],div,span')].map(e=>controlValue(e)).filter(v=>/\b\d+\s+listings?\b/i.test(v));
      if(vals.length){const v=good(vals[0]);if(v)return v}
    }
  }
  return''
}
function currentSkuBase(){
  let value='';
  for(const l of document.querySelectorAll('label')){
    if(!/custom\s*label|sku/i.test(clean(l.innerText||l.textContent||'')))continue;
    let e=l.htmlFor?document.getElementById(l.htmlFor):null;
    if(!e&&l.parentElement)e=l.parentElement.querySelector('input[type="text"],input:not([type])');
    if(e&&/^(text|search|)$/i.test(e.type||'')){value=clean(e.value);if(value)break}
  }
  if(!value||/^(on|off|true|false|yes|no)$/i.test(value)){
    const st=variantState()||{},d=cloneData()||{};
    value='EBAY-'+clean(st.data&&st.data.itemId||d.itemId||window.__capitanSellLikeSourceItemId||'SLV')
  }
  return value.replace(/[^A-Za-z0-9._-]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'').slice(0,36)
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
function technicalSpecsFromDescription(){
  const out={};
  const clone=cloneData()||{};
  const html=String(clone.descriptionHtml||'').trim();
  if(!html)return out;
  try{
    const doc=new DOMParser().parseFromString(html,'text/html');
    const heading=[...doc.querySelectorAll('h1,h2,h3,h4')].find(h=>/^technical specifications$/i.test(clean(h.textContent||'')));
    if(!heading)return out;
    const section=heading.parentElement||doc.body;
    for(const node of section.querySelectorAll('div,p,li')){
      const strong=node.querySelector('b,strong');
      if(!strong)continue;
      const name=clean(strong.textContent||'').replace(/:$/,'');
      if(!name||name.length>90)continue;
      const full=clean(node.textContent||'');
      const label=clean(strong.textContent||'');
      const pos=full.indexOf(label);
      const value=clean(pos>=0?full.slice(pos+label.length):'').replace(/^:\s*/,'');
      if(value&&!out[name])out[name]=value
    }
  }catch(_){ }
  return out
}

function currentItemSpecifics(){
  const clone=cloneData()||{},out={};
  const reserved=/^(title|description|category|item category|price|pricing|quantity|condition|shipping|shipping policy|payment|payment policy|returns?|return policy|location|item location|custom label|custom label \(sku\)|schedule time|format|duration|photos?|variations?)$/i;
  const badValue=(name,value)=>{
    const n=clean(name).toLowerCase(),v=clean(value);
    if(!v)return true;
    if(v.toLowerCase()===n)return true;
    if(/search(?: or enter your own)?\.?\s*(?:search results|results) appear below/i.test(v))return true;
    if(/^(enter your own|select|choose|add)$/i.test(v))return true;
    return false
  };
  const put=(name,value)=>{
    name=clean(name).replace(/[?*:]+$/,'').trim();value=clean(value);
    if(!name||!value||reserved.test(name)||name.length>90||value.length>1000)return;
    if(badValue(name,value))return;
    if(!out[name])out[name]=value
  };
  for(const [k,v] of Object.entries(clone.aspects||{}))put(k,v);
  for(const [k,v] of Object.entries(technicalSpecsFromDescription()))put(k,v);

  const markers=[...document.querySelectorAll('h2,h3,h4,h5,legend,div,span')].filter(x=>/^(required|optional)$/i.test(clean(x.innerText||x.textContent||'')));
  const roots=[];
  for(const marker of markers){
    let p=marker.parentElement;
    for(let depth=0;depth<7&&p;depth++,p=p.parentElement){
      const count=p.querySelectorAll('input,textarea,select,[role="combobox"],[role="radio"],button').length;
      if(count>=3&&count<=140){roots.push(p);break}
    }
  }
  const root=roots.sort((a,b)=>a.querySelectorAll('*').length-b.querySelectorAll('*').length)[0]||null;
  if(root){
    for(const l of root.querySelectorAll('label')){
      const name=clean(l.innerText||l.textContent||'').replace(/[?*]+$/,'').trim();
      if(!name||reserved.test(name))continue;
      let row=l.parentElement;
      for(let depth=0;depth<3&&row;depth++,row=row.parentElement){
        const exact=l.htmlFor?document.getElementById(l.htmlFor):null;
        if(exact){
          if((exact.type==='radio'||exact.type==='checkbox')&&!exact.checked)continue;
          put(name,controlValue(exact));break
        }
        const textInput=row.querySelector('input[type="text"],input[type="search"],input:not([type]),textarea');
        if(textInput&&clean(textInput.value)){put(name,textInput.value);break}
        const select=row.querySelector('select');
        if(select&&clean(controlValue(select))){put(name,controlValue(select));break}
        const combo=row.querySelector('[role="combobox"]');
        if(combo&&clean(controlValue(combo))){put(name,controlValue(combo));break}
        const checked=row.querySelector('input[type="radio"]:checked,input[type="checkbox"]:checked,[role="radio"][aria-checked="true"],button[aria-pressed="true"],[data-state="checked"]');
        if(checked){const v=clean(checked.value||checked.innerText||checked.textContent||checked.getAttribute('aria-label')||'');put(name,v);break}
      }
    }
  }
  return out
}
function dynamicAspectHeaders(dims,baseHeaders){
  const source=currentItemSpecifics();
  const blocked=new Set((dims||[]).map(d=>clean(d.name).toLowerCase().replace(/colour/g,'color')));
  const existing=new Set((baseHeaders||[]).map(h=>clean(h).toLowerCase()));
  const out=[];
  for(const [k,v] of Object.entries(source)){
    const name=clean(k),val=clean(v),nk=name.toLowerCase().replace(/colour/g,'color');
    if(!name||!val||blocked.has(nk))continue;
    if(/^(upc|ean|isbn|epid)$/i.test(name))continue;
    const header='C:'+name;
    if(!existing.has(header.toLowerCase())){out.push(header);existing.add(header.toLowerCase())}
  }
  return out
}
function locationValue(clone){
  const p=clone.itemLocationParts||{};
  const city=clean(p.city),state=clean(p.stateOrProvince);
  if(city&&state)return city+', '+state;
  const raw=clean(clone.itemLocation||'');
  const parts=raw.split(',').map(clean).filter(Boolean);
  if(parts.length>=2)return parts[0]+', '+parts[1];
  return raw.replace(/,?\s*\d[\d*\- ]{2,}\s*(?:,\s*[A-Z]{2})?$/i,'').trim()
}
function sourceValueMap(clone){
  const out={};
  const put=(k,v)=>{const key=clean(k);const val=clean(v);if(key&&val&&!out[key.toLowerCase()])out[key.toLowerCase()]=val};
  for(const [k,v] of Object.entries(clone||{})){if(v==null||typeof v==='object')continue;put(k,v)}
  for(const [k,v] of Object.entries(clone.aspects||{}))put(k,v);
  return out
}
function findAspectHeader(headers,name){
  const raw=clean(name);
  const exact='C:'+raw;
  let i=headers.findIndex(h=>clean(h).toLowerCase()===exact.toLowerCase());
  if(i>=0)return headers[i];
  const nk=raw.toLowerCase().replace(/colour/g,'color').replace(/[^a-z0-9]/g,'');
  i=headers.findIndex(h=>{
    if(!/^C:/i.test(h))return false;
    const hk=clean(h.slice(2)).toLowerCase().replace(/colour/g,'color').replace(/[^a-z0-9]/g,'');
    return hk===nk
  });
  return i>=0?headers[i]:''
}
function fillAspects(row,idx,headers,clone,dims){
  const aspects=currentItemSpecifics();
  const blocked=new Set((dims||[]).map(d=>clean(d.name).toLowerCase().replace(/colour/g,'color')));
  for(const [name,val] of Object.entries(aspects)){
    const key=clean(name).toLowerCase().replace(/colour/g,'color');
    if(blocked.has(key))continue;
    const h=findAspectHeader(headers,name);
    if(h&&idx[h]!=null&&!row[idx[h]])row[idx[h]]=clean(val)
  }
}
function fillDirectTemplateFields(row,idx,headers,clone){
  const src=sourceValueMap(clone);
  const aliases={
    'P:EPID':['epid','ePID'],
    'VideoID':['videoid','video id'],
    'Manufacturer Name':['manufacturer name','manufacturer'],
    'Manufacturer AddressLine1':['manufacturer addressline1','manufacturer address 1'],
    'Manufacturer AddressLine2':['manufacturer addressline2','manufacturer address 2'],
    'Manufacturer City':['manufacturer city'],
    'Manufacturer Country':['manufacturer country'],
    'Manufacturer PostalCode':['manufacturer postalcode','manufacturer postal code'],
    'Manufacturer StateOrProvince':['manufacturer stateorprovince','manufacturer state','manufacturer province'],
    'Manufacturer Phone':['manufacturer phone'],
    'Manufacturer Email':['manufacturer email'],
    'Manufacturer ContactURL':['manufacturer contacturl','manufacturer url'],
    'Responsible Person 1':['responsible person 1'],
    'Responsible Person 1 Type':['responsible person 1 type'],
    'Responsible Person 1 AddressLine1':['responsible person 1 addressline1'],
    'Responsible Person 1 AddressLine2':['responsible person 1 addressline2'],
    'Responsible Person 1 City':['responsible person 1 city'],
    'Responsible Person 1 Country':['responsible person 1 country'],
    'Responsible Person 1 PostalCode':['responsible person 1 postalcode'],
    'Responsible Person 1 StateOrProvince':['responsible person 1 stateorprovince'],
    'Responsible Person 1 Phone':['responsible person 1 phone'],
    'Responsible Person 1 Email':['responsible person 1 email'],
    'Responsible Person 1 ContactURL':['responsible person 1 contacturl'],
    'TakeBackPolicyID':['takebackpolicyid','take back policy id'],
    'Regional TakeBackPolicies':['regional takebackpolicies','regional take back policies'],
    'ProductCompliancePolicyID':['productcompliancepolicyid','product compliance policy id'],
    'Regional ProductCompliancePolicies':['regional productcompliancepolicies','regional product compliance policies'],
    'Hazmat Pictograms':['hazmat pictograms'],'Hazmat SignalWord':['hazmat signalword','hazmat signal word'],
    'Hazmat Statements':['hazmat statements'],'Hazmat Component':['hazmat component'],
    'EcoParticipationFee':['ecoparticipationfee','eco participation fee'],
    'Product Safety Pictograms':['product safety pictograms'],'Product Safety Statements':['product safety statements'],
    'Product Safety Component':['product safety component'],'Regulatory Document Ids':['regulatory document ids']
  };
  for(const [header,names] of Object.entries(aliases)){
    if(idx[header]==null)continue;
    for(const n of names){const v=src[String(n).toLowerCase()];if(v){row[idx[header]]=v;break}}
  }
}

function buildCsv(){
  const st=variantState(),clone=cloneData();
  if(!st||!st.data||!st.data.hasVariations)throw Error('Dati varianti non disponibili');
  if(!clone||!clone.ok)throw Error('Dati listing non ancora pronti');

  const data=st.data,dims=Array.isArray(data.dimensions)?data.dimensions:[],variants=Array.isArray(data.variants)?data.variants:[];
  if(!dims.length||!variants.length)throw Error('Varianti incomplete nel payload');

  const baseHeaders=listingsExportHeaders();
  const dynamicHeaders=dynamicAspectHeaders(dims,baseHeaders);
  const extraHeaders=['Condition','PicURL'].filter(h=>!baseHeaders.includes(h));
  const headers=[...baseHeaders,...dynamicHeaders,...extraHeaders];
  const idx=Object.fromEntries(headers.map((h,i)=>[h,i]));
  const actionHeader=headers.find(h=>/^\*Action\(/i.test(h));
  const row=()=>Array(headers.length).fill('');

  const title=currentTitle(),categoryId=currentCategoryId(),categoryName=currentCategoryName();
  const description=String(currentDescription()||'').slice(0,32700);
  const shipping=normalizePolicyName(policyName('shipping'));
  const returns=normalizePolicyName(policyName('return'));
  const payment=normalizePolicyName(policyName('payment'));
  const conditionId=currentConditionId();
  const location=locationValue(clone);
  const qty=Number(clone.quantity||3)||3;
  const discount=isFinite(Number(st.discountRate))?Number(st.discountRate):.02;
  const skuBase=currentSkuBase();
  const commonImages=defaultPhotos(data,clone).join('|');

  const missing=[];
  if(!title)missing.push('Title');
  if(!categoryId)missing.push('Category ID');
  if(!description)missing.push('Description');
  if(!shipping)missing.push('Shipping profile name');
  if(!returns)missing.push('Return profile name');
  if(!payment)missing.push('Payment profile name');
  if(!conditionId)missing.push('Condition ID');
  if(!location)missing.push('Location');
  if(missing.length)throw Error('Dati obbligatori CSV mancanti: '+missing.join(', '));

  const parent=row();
  parent[idx[actionHeader]]='Add';
  parent[idx['Custom label (SKU)']]=skuBase;
  parent[idx['Category ID']]=categoryId;
  if(idx['Category name']!=null)parent[idx['Category name']]=categoryName;
  parent[idx['Title']]=title;
  parent[idx['Item photo URL']]=commonImages;
  parent[idx['Description']]=description;
  parent[idx['Relationship details']]=relationshipParent(dims);
  parent[idx['Shipping profile name']]=shipping;
  parent[idx['Return profile name']]=returns;
  parent[idx['Payment profile name']]=payment;
  parent[idx['Condition ID']]=conditionId;
  parent[idx['Format']]='FixedPrice';
  parent[idx['Duration']]='GTC';
  parent[idx['Location']]=location;
  if(idx['Condition']!=null)parent[idx['Condition']]=clean(clone.condition||'New');
  if(idx['PicURL']!=null)parent[idx['PicURL']]=commonImages;
  fillAspects(parent,idx,headers,clone,dims);
  fillDirectTemplateFields(parent,idx,headers,clone);

  const rows=[parent];
  const photoDim=dims[0]&&clean(dims[0].name);
  const photoDone=new Set();

  variants.forEach((v,i)=>{
    const r=row();
    r[idx[actionHeader]]='Add';
    r[idx['Custom label (SKU)']]=(skuBase+'-'+String(i+1).padStart(2,'0')).slice(0,50);
    r[idx['Relationship']]='Variation';
    r[idx['Relationship details']]=relationshipChild(v);
    r[idx['Quantity']]=qty;
    r[idx['Start price']]=salePrice(v,discount);
    r[idx['Location']]=location;
    const upc=identifier(v,['upc','UPC']);
    if(upc)r[idx['P:UPC']]=upc;
    const mpn=identifier(v,['mpn','MPN']);
    if(mpn&&idx['C:MPN']!=null)r[idx['C:MPN']]=mpn;

    if(photoDim){
      const pv=firstSpecificValue(v,photoDim),key=pv.toLowerCase();
      if(pv&&!photoDone.has(key)){
        const urls=(v.images||[]).map(safeUrl).filter(Boolean).slice(0,12);
        if(urls.length&&idx['PicURL']!=null){r[idx['PicURL']]=pv+'='+urls.join('|');photoDone.add(key)}
      }
    }
    rows.push(r)
  });

  const info1=row(),info2=row(),info3=row();
  info1[0]='#INFO';
  if(info1.length>1)info1[1]='Created='+Date.now();
  info2[0]='#INFO';
  if(info2.length>1)info2[1]='Version=1.0';
  if(info2.length>3)info2[3]='Template=fx_category_template_EBAY_US';
  info3[0]='#INFO';
  if(idx['Schedule Time']!=null)info3[idx['Schedule Time']]='YYYY-MM-DD HH:MM:SS';

  const output=[info1,info2,info3,headers,...rows];
  const csv=output.map(r=>r.map(escCsv).join(',')).join('\r\n');
  return {
    csv,
    fileName:'sell-like-variants-'+clean(data.itemId||window.__capitanSellLikeSourceItemId||Date.now())+'.csv',
    rows:variants.length,
    columns:headers.length,
    policies:{shipping,payment,returns},
    required:{title,categoryId,description,conditionId,location}
  }
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
        const mainStatus=document.querySelector('#capitan-sell-like-clone #st');
        if(mainStatus)mainStatus.innerHTML='<span class="ok">Preparazione completata.</span> CSV eBay pronto.';
        setStatus('CSV eBay pronto: '+res.rows+' varianti, '+res.columns+' colonne mappate.');
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