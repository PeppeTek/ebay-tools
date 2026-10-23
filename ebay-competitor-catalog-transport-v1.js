/* Dropper competitor quick save: same chunk+commit protocol as existing Sell Like Clone. */
(function(root){
'use strict';
const HEADERS=["*Action(SiteID=US|Country=US|Currency=USD|Version=1193)","Custom label (SKU)","Category ID","Category name","Title","Schedule Time","Item photo URL","Description","Buy It Now price","Start price","Relationship","Relationship details","Quantity","P:UPC","Shipping profile name","Return profile name","Payment profile name","Condition ID","Format","Duration","Location","C:Compatible Brand","C:Compatible Model","C:Features","C:Cord Type","C:Included Accessories","C:Charge Time","C:For","C:Form","C:Number in Pack","C:Scent","C:Suitable For","C:Power Source","C:Game","C:MPN","C:Brand","C:Type","C:Color","C:Item Height","C:Item Length","C:Item Width","C:Stove Type Compatibility","C:Model","C:Dosage","C:Expiration Date","C:Product","P:EPID","VideoID","C:EPA Registration Number","TakeBackPolicyID","Regional TakeBackPolicies","ProductCompliancePolicyID","Regional ProductCompliancePolicies","Hazmat Pictograms","Hazmat SignalWord","Hazmat Statements","Hazmat Component","EcoParticipationFee","Product Safety Pictograms","Product Safety Statements","Product Safety Component","Regulatory Document Ids","Manufacturer Name","Manufacturer AddressLine1","Manufacturer AddressLine2","Manufacturer City","Manufacturer Country","Manufacturer PostalCode","Manufacturer StateOrProvince","Manufacturer Phone","Manufacturer Email","Manufacturer ContactURL","Responsible Person 1","Responsible Person 1 Type","Responsible Person 1 AddressLine1","Responsible Person 1 AddressLine2","Responsible Person 1 City","Responsible Person 1 Country","Responsible Person 1 PostalCode","Responsible Person 1 StateOrProvince","Responsible Person 1 Phone","Responsible Person 1 Email","Responsible Person 1 ContactURL","C:Smart Home Compatibility","C:Smart Home Protocol","Shipping service 1 option","Shipping service 1 cost","Shipping service 1 priority","Shipping service 2 option","Shipping service 2 cost","Shipping service 2 priority","Max dispatch time","Returns accepted option","Returns within option","Refund option","Return shipping cost paid by","Best Offer Enabled","Best Offer Auto Accept Price","Minimum Best Offer Price","Immediate pay required","C:Style","C: Size","C:Department","C:Body Area","C:Material","C:Part Type","C:Number of Shelves","C:Ink Color","C:For Instrument","C:Insect Repellent Treated","C:Bait Type","C:Connectivity","C:Colour","C:Manufacturer Part Number","C:Author","C:Book Title","C:Language","C:Exterior Material","C:Exterior Colour","C:Size","C:Chipset Manufacturer","C:Chipset/GPU Model","C:Compatible Mattress Size","C:Frame Material","C:Playable Media Format","C:Set","C:Golf Club Type","C:Handedness","C:Format","C:Movie/TV Title","C:Shade","C:Artist","C:Release Title","C:Installation","PicURL"];
const ACTION={US:'*Action(SiteID=US|Country=US|Currency=USD|Version=1193)',CA:'*Action(SiteID=Canada|Country=US|Currency=CAD|Version=1193|CC=UTF-8)',AU:'*Action(SiteID=Australia|Country=US|Currency=AUD|Version=1193)'};
const CURRENCY={US:'USD',CA:'CAD',AU:'AUD'};
function buildPackage(entry,marketplace){
 const mk=String(marketplace||'').toUpperCase(),id=String(entry?.itemId||'').trim();
 const title=String(entry?.title||'').replace(/\s+/g,' ').trim(),price=Number(entry?.price);
 if(!Object.prototype.hasOwnProperty.call(ACTION,mk))throw Error('Marketplace catalogo non valido');
 if(!/^\d{9,12}$/.test(id))throw Error('Item ID catalogo non valido');
 if(!title||title.length>255)throw Error('Titolo catalogo mancante o troppo lungo');
 if(!Number.isFinite(price)||price<=0||price>10000000)throw Error('Prezzo catalogo non valido');
 const headers=HEADERS.slice();headers[0]=ACTION[mk];
 const row=Array(headers.length).fill('');
 row[headers.indexOf('Custom label (SKU)')]=id;
 row[headers.indexOf('Title')]=/^[=+\-@]/.test(title)?"'"+title:title;
 row[headers.indexOf('Start price')]=price.toFixed(2);
 if(row.filter(x=>x!=='').length!==3)throw Error('Il catalogo rapido deve valorizzare solo tre campi');
 return {version:1,marketplace:mk,sheetName:'Catalogo '+(mk==='US'?'USA':mk),sourceItemId:id,
  groupId:mk+'-'+id+'-QUICK',hasVariations:false,currency:CURRENCY[mk],headers,rows:[row]};
}

function buildVariantPackage(entry,marketplace){
 if(!Array.isArray(entry?.variants)||entry.variants.length<1)throw Error('Varianti assenti dal catalogo');
 const pkg=buildPackage(entry,marketplace),clean=x=>String(x==null?'':x).replace(/\s+/g,' ').trim();
 const safe=x=>{const v=clean(x);if(!v||/[|;=\r\n]/.test(v))throw Error('Attributo non adatto al CSV eBay: '+v);return v};
 const dims=(Array.isArray(entry.dimensions)?entry.dimensions:[]).map(d=>({name:safe(d.name),values:(Array.isArray(d.values)?d.values:[]).map(safe)}));
 if(!dims.length||dims.some(d=>!d.values.length))throw Error('Attributi e opzioni non completi');
 const header=pkg.headers,idx=k=>header.indexOf(k),rows=pkg.rows;
 rows[0][idx('Relationship details')]=dims.map(d=>d.name+'='+d.values.join(';')).join('|');
 const seen=new Set();
 for(const [i,v] of entry.variants.entries()){
  const price=Number(v?.price),specifics=Array.isArray(v?.specifics)?v.specifics:[];
  if(!Number.isFinite(price)||price<=0)throw Error('Prezzo mancante nella variante '+(i+1));
  const rel=dims.map(d=>{
   const sp=specifics.find(x=>clean(x.name).toLowerCase()===d.name.toLowerCase());
   const val=safe(sp?.value);
   if(!d.values.some(t=>t.toLowerCase()===val.toLowerCase()))throw Error('Opzione non prevista: '+d.name+'='+val);
   return d.name+'='+val;
  }).join('|');
  if(seen.has(rel))throw Error('Variante duplicata: '+rel);
  seen.add(rel);
  const child=Array(header.length).fill('');
  child[idx('Custom label (SKU)')]=(String(entry.itemId)+'-'+String(i+1).padStart(2,'0')).slice(0,50);
  child[idx('Relationship')]='Variation';
  child[idx('Relationship details')]=rel;
  child[idx('Start price')]=price.toFixed(2);
  // Do NOT manufacture Quantity, category, policies, condition, or UPC.
  rows.push(child);
 }
 pkg.hasVariations=true;pkg.groupId=pkg.marketplace+'-'+pkg.sourceItemId+'-QUICK-VARIANTS';
 return pkg
}
function toCsv(pkg){
 const esc=x=>{const t=String(x==null?'':x);return /[,"\r\n]/.test(t)?'"'+t.replace(/"/g,'""')+'"':t};
 const info=[0,1,2].map(()=>Array(pkg.headers.length).fill(''));
 info[0][0]='#INFO';info[0][1]='Created='+Date.now();
 info[1][0]='#INFO';info[1][1]='Version=1.0';
 info[2][0]='#INFO';
 const schedule=pkg.headers.indexOf('Schedule Time');
 if(schedule>=0)info[2][schedule]='YYYY-MM-DD HH:MM:SS';
 return '\uFEFF'+[...info,pkg.headers,...pkg.rows].map(r=>r.map(esc).join(',')).join('\r\n');
}
function utf8Base64Url(txt){
 const bytes=new TextEncoder().encode(String(txt));let bin='';
 for(let i=0;i<bytes.length;i+=0x8000)bin+=String.fromCharCode(...bytes.subarray(i,i+0x8000));
 return btoa(bin).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function jsonp(endpoint,action,params,timeoutMs){
 return new Promise((resolve,reject)=>{
  const cb='__dropperCatalogCb_'+Date.now()+'_'+Math.floor(Math.random()*1000000);
  const script=document.createElement('script');let finished=false;
  const timer=setTimeout(()=>done(Error('Timeout backend catalogo: '+action)),timeoutMs);
  function done(err,val){
   if(finished)return;finished=true;clearTimeout(timer);
   try{delete window[cb]}catch(_){window[cb]=undefined}
   script.remove();err?reject(err):resolve(val);
  }
  window[cb]=val=>done(null,val);script.onerror=()=>done(Error('Backend catalogo non raggiungibile'));
  const q=new URLSearchParams({action,callback:cb,_:String(Date.now()),...(params||{})});
  script.src=endpoint+'?'+q.toString();document.head.appendChild(script)
 })
}
async function save(entry,marketplace,endpoint){
 const ep=String(endpoint||'').replace(/\/+$/,'');
 if(!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(ep))
  throw Error('Endpoint Apps Script non configurato');
 const pkg=Array.isArray(entry?.variants)&&entry.variants.length?buildVariantPackage(entry,marketplace):buildPackage(entry,marketplace);
 const data=utf8Base64Url(JSON.stringify(pkg)),chunkSize=1400,total=Math.ceil(data.length/chunkSize);
 if(total<1||total>600)throw Error('Dimensione catalogo non valida');
 const requestId='cat_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,12);
 for(let i=0;i<total;i++){
  const r=await jsonp(ep,'sell_like_catalog_chunk',{requestId,index:String(i),total:String(total),data:data.slice(i*chunkSize,(i+1)*chunkSize)},30000);
  if(!r||r.ok!==true)throw Error(r&&r.error||'Trasferimento catalogo fallito ('+(i+1)+'/'+total+')');
 }
 const result=await jsonp(ep,'sell_like_catalog_commit',{requestId,total:String(total)},60000);
 if(!result||result.ok!==true)throw Error(result&&result.error||'Scrittura catalogo non confermata');
 if(result.duplicate!==true&&(!(Number(result.rowStart)>0)||!(Number(result.rowCount)>0)))
  throw Error('Il backend non ha confermato le coordinate della riga');
 return {...result,marketplace:pkg.marketplace,sourceItemId:pkg.sourceItemId};
}
root.__dropperCompetitorCatalogTransport={buildPackage,buildVariantPackage,toCsv,save};
if(typeof module==='object'&&module.exports)module.exports={buildPackage,buildVariantPackage,toCsv,save};
})(typeof globalThis==='object'?globalThis:this);
