javascript:(async()=>{
'use strict';
const PATCH_ID='capitan-variants-csv-v5';
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
  const c=findControlByLabel(/^title$/i)||[...document.querySelectorAll('input,textarea')].find(x=>/title/i.test(clean([x.name,x.id,x.placeholder,x.getAttribute('aria-label')].join(' '))));
  const live=clean(controlValue(c)).slice(0,80);
  if(live)return live;
  const d=cloneData()||{};
  return clean(d.title).slice(0,80)
}
function currentDescription(){
  const candidates=[...document.querySelectorAll('textarea,[contenteditable="true"]')];
  const descCandidates=candidates.filter(e=>{
    let p=e,depth=0;
    while(p&&depth<7){
      const h=p.querySelector&&p.querySelector('h2,h3,legend,label');
      const t=clean(h&&h.textContent||'');
      if(/^description$/i.test(t)||/\bdescription\b/i.test(clean([e.name,e.id,e.placeholder,e.getAttribute&&e.getAttribute('aria-label')].join(' '))))return true;
      p=p.parentElement;depth++
    }
    return false
  });
  const ordered=(descCandidates.length?descCandidates:candidates).sort((a,b)=>(b.clientWidth*b.clientHeight)-(a.clientWidth*a.clientHeight));
  for(const e of ordered){
    if(e.matches('[contenteditable="true"]')){const html=String(e.innerHTML||'').trim();if(html&&html!=='<br>')return html}
    else{const v=String(e.value||'').trim();if(v)return v}
  }
  const d=cloneData()||{};
  return String(d.descriptionHtml||'').trim()
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
  const labelText={shipping:'Shipping policy',payment:'Payment policy',return:'Return policy'}[kind]||kind+' policy';
  const escaped=labelText.replace(/[-\/\\^$*+?.()|[\]{}]/g,'\\$&');
  const labelRe=new RegExp('^'+escaped+'$','i');
  const sectionRe=kind==='return'?/\breturns?\b/i:kind==='payment'?/\bpayment\b/i:/\bshipping\b/i;
  const good=v=>{v=normalizePolicyName(v);if(!v||labelRe.test(v)||/^(edit|change|select|add|help|done|\.\.\.|shipping|payment|returns?|policy)$/i.test(v)||v.length>180)return'';return v};

  // Most reliable eBay pattern: selected business-policy controls contain '(N listings)' or '[N listings]'.
  const listingControls=[...document.querySelectorAll('input,textarea,select,button,[role="combobox"],[role="button"]')];

  // First classify directly from the selected text itself.
  for(const e of listingControls){
    const raw=controlValue(e);
    if(!/\b\d+\s+listings?\b/i.test(raw))continue;
    const txt=clean(raw);
    const matchesKind=kind==='shipping'?(/shipping|business\s+days?|economy|standard|expedited|fedex|ups|usps/i.test(txt)):
      kind==='return'?(/return|refund/i.test(txt)):
      (/payment|managed\s+payments?/i.test(txt));
    if(matchesKind){const v=good(raw);if(v)return v}
  }
  for(const e of listingControls){
    const raw=controlValue(e);
    if(!/\b\d+\s+listings?\b/i.test(raw))continue;
    let p=e,scope='';
    for(let depth=0;depth<7&&p;depth++,p=p.parentElement){scope=clean((p.innerText||p.textContent||'')+' '+(p.getAttribute&&p.getAttribute('aria-label')||''));if(sectionRe.test(scope))break}
    if(sectionRe.test(scope)){const v=good(raw);if(v)return v}
  }

  // Exact visible/hidden labeled field.
  for(const l of document.querySelectorAll('label')){
    if(!labelRe.test(clean(l.innerText||l.textContent||'')))continue;
    const linked=l.htmlFor?document.getElementById(l.htmlFor):null;
    for(const e of [linked,l.querySelector('input,textarea,select,[role="combobox"],button'),l.parentElement&&l.parentElement.querySelector('input,textarea,select,[role="combobox"],button')]){const v=good(controlValue(e));if(v)return v}
  }

  // Metadata fallback.
  const metaRe=new RegExp(kind+'.*(policy|profile)|(policy|profile).*'+kind,'i');
  for(const e of listingControls){const meta=clean([e.name,e.id,e.placeholder,e.getAttribute&&e.getAttribute('aria-label'),e.getAttribute&&e.getAttribute('data-testid'),e.getAttribute&&e.getAttribute('data-field')].join(' '));if(metaRe.test(meta)){const v=good(controlValue(e));if(v)return v}}

  // Search the smallest DOM block around the exact label, including hidden mounted settings.
  const labels=[...document.querySelectorAll('label,h2,h3,h4,legend,div,span,p')].filter(x=>labelRe.test(clean(x.innerText||x.textContent||'')));
  for(const l of labels){let p=l.parentElement;for(let depth=0;depth<7&&p;depth++,p=p.parentElement){for(const e of p.querySelectorAll('input,textarea,select,[role="combobox"],button,[role="button"],span,div,p')){const v=good(controlValue(e));if(v&&!/\b(?:shipping|payment|return)\s+policy\b/i.test(v))return v}}}

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
function currentItemSpecifics(){
  const clone=cloneData()||{},out={};
  for(const [k,v] of Object.entries(clone.aspects||{})){const n=clean(k),val=clean(v);if(n&&val)out[n]=val}
  const headings=[...document.querySelectorAll('h2,h3,h4,legend,div,span')].filter(x=>/^item specifics$/i.test(clean(x.innerText||x.textContent||'')));
  let section=null;
  for(const h of headings){let p=h.parentElement;for(let depth=0;depth<6&&p;depth++,p=p.parentElement){const fields=p.querySelectorAll('input,textarea,select,[role="combobox"]');if(fields.length>=2&&fields.length<=80){section=p;break}}if(section)break}
  if(section){
    for(const l of section.querySelectorAll('label')){
      const name=clean(l.innerText||l.textContent||'');if(!name||name.length>80)continue;
      let e=l.htmlFor?document.getElementById(l.htmlFor):l.querySelector('input,textarea,select,[role="combobox"]');
      if(!e){let p=l.parentElement;for(let i=0;i<3&&p&&!e;i++,p=p.parentElement)e=p.querySelector('input,textarea,select,[role="combobox"]')}
      const val=clean(controlValue(e));if(val&&!/^(select|choose|add)$/i.test(val))out[name]=val
    }
  }
  return out
}
function dynamicAspectHeaders(dims){
  const source=currentItemSpecifics();
  const blocked=new Set(dims.map(d=>clean(d.name).toLowerCase()));
  const out=[];
  for(const k of Object.keys(source)){const name=clean(k),val=clean(source[k]);if(!name||!val||blocked.has(name.toLowerCase()))continue;if(/^(title|description|price|quantity|condition|shipping policy|payment policy|return policy)$/i.test(name))continue;out.push({header:'C:'+name,value:val})}
  return out.slice(0,60)
}
function locationValue(clone){
  const p=clone.itemLocationParts||{};
  const city=clean(p.city),state=clean(p.stateOrProvince);
  if(city&&state)return city+', '+state;
  return clean(clone.itemLocation||'')
}
function sourceValueMap(clone){
  const out={};
  const put=(k,v)=>{const key=clean(k);const val=clean(v);if(key&&val&&!out[key.toLowerCase()])out[key.toLowerCase()]=val};
  for(const [k,v] of Object.entries(clone||{})){if(v==null||typeof v==='object')continue;put(k,v)}
  for(const [k,v] of Object.entries(clone.aspects||{}))put(k,v);
  return out
}
function findAspectHeader(headers,name){
  const exact='C:'+clean(name);
  let i=headers.findIndex(h=>clean(h).toLowerCase()===exact.toLowerCase());
  if(i>=0)return headers[i];
  const nk=clean(name).toLowerCase().replace(/colour/g,'color').replace(/[^a-z0-9]/g,'');
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

  const headers=listingsExportHeaders();
  const idx=Object.fromEntries(headers.map((h,i)=>[h,i]));
  const actionHeader=headers.find(h=>/^\*Action\(/i.test(h));
  const row=()=>Array(headers.length).fill('');

  const title=currentTitle(),categoryId=currentCategoryId(),categoryName=clean(clone.categoryName||data.categoryName||'');
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
    const upc=identifier(v,['upc','UPC']);
    if(upc)r[idx['P:UPC']]=upc;

    if(photoDim){
      const pv=firstSpecificValue(v,photoDim),key=pv.toLowerCase();
      if(pv&&!photoDone.has(key)){
        const urls=(v.images||[]).map(safeUrl).filter(Boolean).slice(0,12);
        if(urls.length){r[idx['Item photo URL']]=pv+'='+urls.join('|');photoDone.add(key)}
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
        setStatus('CSV eBay pronto: '+res.rows+' varianti, '+res.columns+' colonne compatibili Listings.');
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