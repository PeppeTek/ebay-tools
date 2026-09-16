javascript:(async()=>{
"use strict";

const V="v6.6-AU";
const ID="pep-ebay-bs-v6";
const FB=ID+"-fb";
const PF=ID+"-pf-";
const GSKEY=ID+"-google-url";

const S=m=>new Promise(r=>setTimeout(r,m));
const C=v=>String(v??"").replace(/\u00a0/g," ").replace(/\s+/g," ").trim();
const N=v=>C(v).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const E=v=>String(v??"")
  .replace(/&/g,"&amp;")
  .replace(/</g,"&lt;")
  .replace(/>/g,"&gt;")
  .replace(/"/g,"&quot;")
  .replace(/'/g,"&#039;");
const NUM=v=>{
  const n=Number(String(v??"").replace(/[^\d]/g,""));
  return Number.isFinite(n)?n:null;
};

const seller=decodeURIComponent(
  location.pathname.match(/\/fdbk\/feedback_profile\/([^/?#]+)/i)?.[1]||"ebay_seller"
);
const OR=location.origin;

if(!/\/fdbk\/feedback_profile\//i.test(location.pathname)){
  alert("Apri prima la pagina Feedback Profile del venditore eBay.");
  return;
}

document.getElementById(ID)?.remove();
document.getElementById(FB)?.remove();
for(const x of document.querySelectorAll(`[id^="${PF}"]`))x.remove();

let stop=0;
let pages=0;
let mapped=0;
let unmapped=0;
let textIds=0;
let soldDone=0;
let soldFound=0;
let soldErrors=0;
let trackedWindowSeen=0;
let sortKey="sold";
let sortDir="desc";

const seen=new Set();
const products=new Map();

function officialPositivePeriods(d=document){
  for(const tr of d.querySelectorAll("tr")){
    const t=N(tr.innerText||tr.textContent);
    if(!/\bpositive\b/.test(t))continue;

    const cells=[...tr.querySelectorAll("td,th")].map(x=>C(x.innerText||x.textContent));
    const nums=[];
    for(let i=1;i<cells.length;i++){
      const n=NUM(cells[i]);
      if(Number.isFinite(n))nums.push(n);
      if(nums.length>=3)break;
    }
    if(nums.length){
      return {
        month:nums[0]??null,
        six:nums[1]??null,
        year:nums[2]??null
      };
    }
  }

  const txt=C(d.body?.innerText);
  const m=txt.match(/Positive\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)/i);
  return m
    ? {month:NUM(m[1]),six:NUM(m[2]),year:NUM(m[3])}
    : {month:null,six:null,year:null};
}

const official=officialPositivePeriods(document);

function xid(v){
  v=String(v||"");
  for(const re of[
    /\/itm\/(?:[^/?#]+\/)?(\d{9,15})(?:[/?#]|$)/i,
    /\(#\s*(\d{9,15})\s*\)/i,
    /\bitem\s*(?:id|number|no\.?)?\s*[:#-]?\s*(\d{9,15})\b/i,
    /#\s*(\d{9,15})\b/
  ]){
    const m=v.match(re);
    if(m)return m[1];
  }
  return"";
}

function period(r){
  const t=N(r.innerText||r.textContent);

  if(/\bpast month\b|\bwithin the past month\b|\blast month\b|\b1 month\b|\bone month\b|\bultimo mese\b|\b1 mese\b/.test(t)){
    return"month";
  }

  if(/\bpast 6 months\b|\bwithin the past 6 months\b|\b6 months\b|\b6 mesi\b|\bsei mesi\b/.test(t)){
    return"six";
  }

  if(/\bpast year\b|\bwithin the past year\b|\blast year\b|\b1 year\b|\bone year\b|\bpast 12 months\b|\b12 months\b|\b12 mesi\b|\bultimo anno\b|\b1 anno\b/.test(t)){
    return"year";
  }

  if(/\bmore than a year\b|\bover a year\b|\bmore than 1 year\b|\bover 1 year\b|\bpiu di un anno\b|\boltre un anno\b|\banni? fa\b/.test(t)){
    return"older";
  }

  return"unknown";
}

function positive(r){
  const a=[...r.querySelectorAll('[aria-label],[data-test-type]')]
    .map(x=>(x.getAttribute("aria-label")||"")+" "+(x.getAttribute("data-test-type")||""))
    .join(" ");
  const t=N(r.innerText);
  return !/negative|neutral|negativo|neutro/.test(t) &&
    (/positive/.test(N(a+t))||!!r.querySelector('svg[data-test-type="positive"]'));
}

function mk(r,id,source){
  let t=C((r.querySelector(".card__item")||r).innerText);
  const m=t.match(new RegExp(`(.+?)\\\\s*\\\\(#\\\\s*${id}\\\\s*\\\\)`,"i"));
  if(m)t=C(m[1]);

  t=t
    .replace(/\bPast\s+(?:month|6 months|year).*$/i,"")
    .replace(/\bMore than a year.*$/i,"")
    .replace(/\bAU\s*\$[\d,.]+.*$/i,"")
    .replace(/\bUS\s*\$[\d,.]+.*$/i,"");

  return{
    id,
    title:C(t)||`Item ${id}`,
    url:`${OR}/itm/${id}`,
    source
  };
}

function prod(r){
  for(const a of r.querySelectorAll("a[href]")){
    const id=xid(a.href);
    if(id)return mk(r,id,"Link");
  }

  const id=xid(C(r.innerText));
  return id?mk(r,id,"Text"):null;
}

function fbRows(d){
  return [...d.querySelectorAll(
    '#feedback-cards tbody tr[data-feedback-id],#feedback-cards tbody tr,[data-feedback-id]'
  )].filter(r=>C(r.innerText).length>20);
}

function sig(d){
  return fbRows(d)
    .slice(0,8)
    .map(r=>r.getAttribute("data-feedback-id")||C(r.innerText).slice(0,120))
    .join("|");
}

function getOrCreateProduct(q){
  if(!products.has(q.id)){
    products.set(q.id,{
      ...q,
      monthCount:0,
      sixCount:0,
      yearCount:0,
      sold:null,
      soldState:"pending"
    });
  }
  return products.get(q.id);
}

function totalItemSold(){
  let total=0;
  for(const x of products.values()){
    if(Number.isFinite(x.sold))total+=x.sold;
  }
  return total;
}

function periodTotals(){
  let month=0,six=0,year=0;
  for(const x of products.values()){
    month+=x.monthCount||0;
    six+=x.sixCount||0;
    year+=x.yearCount||0;
  }
  return{month,six,year};
}

const st=document.createElement("style");
st.textContent=`
#${ID}{
  position:fixed;top:10px;right:10px;z-index:2147483647;
  width:min(1240px,calc(100vw - 20px));
  max-height:calc(100vh - 20px);
  background:#fff;color:#111;
  border:1px solid #d9dee7;border-radius:14px;
  box-shadow:0 16px 44px rgba(0,0,0,.18);
  font:13px Arial,Helvetica,sans-serif;
  overflow:hidden
}
#${ID} *{box-sizing:border-box}
#${ID} .h{
  display:flex;justify-content:space-between;align-items:center;gap:12px;
  padding:13px 15px;border-bottom:1px solid #e4e8ef;
  background:#f8fafc
}
#${ID} .title{font-size:18px;font-weight:700;color:#172033}
#${ID} .sub{margin-top:3px;font-size:11px;color:#697386;font-weight:400}
#${ID} .close{
  width:30px;height:30px;padding:0;border:1px solid #cfd6e0;border-radius:8px;
  background:#fff;color:#344054;font-size:18px;cursor:pointer
}
#${ID} .b{
  padding:12px 14px 14px;overflow:auto;max-height:calc(100vh - 63px)
}
#${ID} .seller{
  display:flex;flex-wrap:wrap;gap:8px 18px;
  margin-bottom:9px;color:#344054
}
#${ID} .status{
  padding:9px 11px;margin-bottom:10px;
  border:1px solid #dbe3ef;border-radius:9px;
  background:#f7f9fc;color:#344054
}
#${ID} .official{
  display:flex;flex-wrap:wrap;gap:7px;margin-bottom:10px
}
#${ID} .chip{
  padding:5px 9px;border:1px solid #dce3ec;border-radius:999px;
  background:#fff;color:#475467;font-size:11px
}
#${ID} .chip b{color:#172033}
#${ID} .stats{
  display:grid;grid-template-columns:repeat(7,minmax(0,1fr));
  gap:7px;margin:0 0 11px
}
#${ID} .s{
  min-height:70px;padding:9px 10px;
  border:1px solid #dfe4ea;border-radius:10px;background:#fbfcfd
}
#${ID} .s span{
  display:block;min-height:29px;font-size:11px;line-height:1.25;color:#667085
}
#${ID} .s b{
  display:block;margin-top:3px;font-size:22px;line-height:1;color:#101828
}
#${ID} .tw{
  max-height:350px;overflow:auto;border:1px solid #dfe4ea;border-radius:10px
}
#${ID} table{width:100%;border-collapse:collapse;font-size:11px}
#${ID} th,#${ID} td{
  padding:7px 8px;border-bottom:1px solid #edf0f4;text-align:left;vertical-align:middle
}
#${ID} th{
  position:sticky;top:0;z-index:2;background:#f5f7fa;color:#475467;font-weight:700
}
#${ID} th[data-sort]{cursor:pointer;user-select:none;transition:background .15s,color .15s}
#${ID} th[data-sort]:hover{background:#eaf0f7;color:#172033}
#${ID} th[data-sort].active-sort{background:#e8eef8;color:#172033}
#${ID} .sort-arrow{display:inline-block;min-width:12px;margin-left:4px;font-size:9px;vertical-align:1px;color:#667085}
#${ID} th[data-sort].active-sort .sort-arrow{color:#172033}
#${ID} td.num,#${ID} th.num{text-align:center;white-space:nowrap}
#${ID} tbody tr:hover{background:#fafbfc}
#${ID} .loading{color:#777;font-style:italic}
#${ID} .ok{font-weight:700;color:#137333}
#${ID} .bad{color:#b3261e}
#${ID} textarea{
  width:100%;height:88px;margin-top:10px;padding:8px 9px;
  border:1px solid #dfe4ea;border-radius:9px;background:#fbfcfd;
  font:11px Consolas,monospace;color:#475467
}
#${ID} .a{
  display:flex;justify-content:flex-end;gap:8px;margin-top:10px;flex-wrap:wrap
}
#${ID} button{
  padding:8px 11px;border:1px solid #c9d1dc;border-radius:8px;
  background:#fff;color:#344054;cursor:pointer
}
#${ID} button:disabled{opacity:.5;cursor:not-allowed}
#${ID} .p{background:#3665f3;color:#fff;border-color:#3665f3}
@media(max-width:1100px){
  #${ID} .stats{grid-template-columns:repeat(4,minmax(0,1fr))}
}
`;
document.head.appendChild(st);

const p=document.createElement("div");
p.id=ID;
p.innerHTML=`
<div class="h">
  <div>
    <div class="title">eBay Best Sellers — Positive Feedback</div>
    <div class="sub">Analisi 1 / 6 / 12 mesi · ${V}</div>
  </div>
  <button class="close" id="x">×</button>
</div>
<div class="b">
  <div class="seller">
    <div><b>Venditore:</b> ${E(seller)}</div>
    <div><b>Marketplace:</b> ${E(location.hostname)}</div>
  </div>

  <div class="official">
    <span class="chip">Positive 1 month: <b>${Number.isFinite(official.month)?official.month:"—"}</b></span>
    <span class="chip">Positive 6 months: <b>${Number.isFinite(official.six)?official.six:"—"}</b></span>
    <span class="chip">Positive 12 months: <b>${Number.isFinite(official.year)?official.year:"—"}</b></span>
  </div>

  <div id="status" class="status">
    Preparazione analisi feedback…
  </div>

  <div class="stats">
    <div class="s"><span>Feedback associati a un prodotto</span><b id="mapped">0</b></div>
    <div class="s"><span>Feedback senza Item ID</span><b id="unmapped">0</b></div>
    <div class="s"><span>Prodotti unici trovati</span><b id="products">0</b></div>
    <div class="s"><span>Pagine feedback analizzate</span><b id="pages">0</b></div>
    <div class="s"><span>Inserzioni Item sold lette</span><b id="soldDone">0</b></div>
    <div class="s"><span>Item sold valorizzati</span><b id="soldFound">0</b></div>
    <div class="s"><span>Totale Item sold</span><b id="totalSold">0</b></div>
  </div>

  <div class="tw">
    <table>
      <thead>
        <tr>
          <th class="num">#</th>
          <th class="num" data-sort="sold" title="Ordina per Item sold">Item sold <span class="sort-arrow"></span></th>
          <th class="num" data-sort="month" title="Ordina per 1 month">1 month <span class="sort-arrow"></span></th>
          <th class="num" data-sort="six" title="Ordina per 6 months">6 months <span class="sort-arrow"></span></th>
          <th class="num" data-sort="year" title="Ordina per 12 months">12 months <span class="sort-arrow"></span></th>
          <th data-sort="id" title="Ordina per Item ID">Item ID <span class="sort-arrow"></span></th>
          <th data-sort="title" title="Ordina Titolo A-Z / Z-A">Titolo <span class="sort-arrow"></span></th>
          <th>Link</th>
          <th data-sort="source" title="Ordina Source A-Z / Z-A">Source <span class="sort-arrow"></span></th>
        </tr>
      </thead>
      <tbody id="tb"></tbody>
    </table>
  </div>

  <textarea id="log" readonly></textarea>

  <div class="a">
    <button id="stop">Ferma</button>
    <button id="google" disabled>Esporta Google Sheet</button>
    <button id="csv" class="p" disabled>Esporta XLS</button>
  </div>
</div>
`;

document.body.appendChild(p);

const $=s=>p.querySelector(s);

for(const th of p.querySelectorAll("th[data-sort]")){
  th.onclick=()=>{
    const key=th.dataset.sort;

    if(sortKey===key){
      sortDir=sortDir==="asc"?"desc":"asc";
    }else{
      sortKey=key;
      sortDir=(key==="title"||key==="source")?"asc":"desc";
    }

    render();
  };
}

const log=m=>{
  $("#log").value+=`[${new Date().toLocaleTimeString()}] ${m}\\n`;
  $("#log").scrollTop=1e9;
};

const SORTERS={
  sold:x=>Number.isFinite(x.sold)?x.sold:null,
  month:x=>Number(x.monthCount)||0,
  six:x=>Number(x.sixCount)||0,
  year:x=>Number(x.yearCount)||0,
  id:x=>Number(x.id)||0,
  title:x=>N(x.title),
  source:x=>N(x.source)
};

const sorted=()=>{
  const a=[...products.values()];
  const getter=SORTERS[sortKey]||SORTERS.sold;

  return a.sort((x,y)=>{
    const av=getter(x),bv=getter(y);

    if(av===null||av===undefined){
      if(bv===null||bv===undefined)return N(x.title).localeCompare(N(y.title));
      return 1;
    }
    if(bv===null||bv===undefined)return -1;

    let cmp;
    if(typeof av==="string"||typeof bv==="string"){
      cmp=String(av).localeCompare(String(bv),undefined,{numeric:true,sensitivity:"base"});
    }else{
      cmp=Number(av)-Number(bv);
    }

    if(sortDir==="desc")cmp=-cmp;
    return cmp||N(x.title).localeCompare(N(y.title));
  });
};

function updateSortHeaders(){
  for(const th of p.querySelectorAll("th[data-sort]")){
    const active=th.dataset.sort===sortKey;
    th.classList.toggle("active-sort",active);
    const arrow=th.querySelector(".sort-arrow");
    if(arrow)arrow.textContent=active?(sortDir==="asc"?"▲":"▼"):"↕";
    th.setAttribute("aria-sort",active?(sortDir==="asc"?"ascending":"descending"):"none");
  }
}

function soldCell(x){
  if(x.soldState==="loading")return'<span class="loading">Lettura…</span>';
  if(Number.isFinite(x.sold))return`<span class="ok">${x.sold}</span>`;
  if(x.soldState==="error")return'<span class="bad">Errore</span>';
  return"—";
}

function render(){
  const a=sorted();
  updateSortHeaders();

  $("#mapped").textContent=mapped;
  $("#unmapped").textContent=unmapped;
  $("#products").textContent=a.length;
  $("#pages").textContent=pages;
  $("#soldDone").textContent=soldDone;
  $("#soldFound").textContent=soldFound;
  $("#totalSold").textContent=totalItemSold();

  $("#csv").disabled=!a.length;
  $("#google").disabled=!a.length;

  $("#tb").innerHTML=a.length
    ? a.map((x,i)=>`
      <tr>
        <td class="num">${i+1}</td>
        <td class="num">${soldCell(x)}</td>
        <td class="num"><b>${x.monthCount}</b></td>
        <td class="num">${x.sixCount}</td>
        <td class="num">${x.yearCount}</td>
        <td><a target="_blank" href="${E(x.url)}">${E(x.id)}</a></td>
        <td>${E(x.title)}</td>
        <td><a target="_blank" href="${E(x.url)}">Apri</a></td>
        <td>${E(x.source)}</td>
      </tr>
    `).join("")
    : '<tr><td colspan="9">Nessun prodotto rilevato.</td></tr>';
}

function process(d){
  let monthRows=0,sixRows=0,yearRows=0,olderRows=0,unknownRows=0;
  let posMonth=0,posSix=0,posYear=0;

  for(const r of fbRows(d)){
    const fid=C(r.getAttribute("data-feedback-id")||r.innerText).slice(0,500);
    if(!fid||seen.has(fid))continue;
    seen.add(fid);

    const per=period(r);

    if(per==="month")monthRows++;
    else if(per==="six")sixRows++;
    else if(per==="year")yearRows++;
    else if(per==="older")olderRows++;
    else unknownRows++;

    if(!positive(r)||!["month","six","year"].includes(per))continue;

    if(per==="month")posMonth++;
    if(per==="six")posSix++;
    if(per==="year")posYear++;

    const q=prod(r);
    if(!q){
      unmapped++;
      continue;
    }

    mapped++;
    if(q.source==="Text")textIds++;

    const x=getOrCreateProduct(q);
    if(per==="month")x.monthCount++;
    else if(per==="six")x.sixCount++;
    else if(per==="year")x.yearCount++;
  }

  render();

  return{
    monthRows,sixRows,yearRows,olderRows,unknownRows,
    posMonth,posSix,posYear,
    total:fbRows(d).length
  };
}

function next(d){
  return d.querySelector(
    'button[aria-label="Next page"]:not([disabled]):not([aria-disabled="true"]),a[aria-label="Next page"]:not([aria-disabled="true"])'
  ) || [...d.querySelectorAll("button,a")].find(b=>
    !b.disabled &&
    b.getAttribute("aria-disabled")!=="true" &&
    /^(next page|next|pagina successiva|successiva|avanti)$/.test(
      N(b.getAttribute("aria-label")||b.getAttribute("title")||b.innerText)
    )
  );
}

async function changed(d,b,t=18000){
  const x=Date.now();
  while(Date.now()-x<t&&!stop){
    await S(250);
    const s=sig(d);
    if(s&&s!==b){
      await S(500);
      return 1;
    }
  }
  return 0;
}

function frame(id,w=1500,h=1200){
  document.getElementById(id)?.remove();
  const f=document.createElement("iframe");
  f.id=id;
  Object.assign(f.style,{
    position:"fixed",
    left:"-12000px",
    top:"0",
    width:w+"px",
    height:h+"px",
    opacity:".01",
    pointerEvents:"none",
    zIndex:"-1"
  });
  document.body.appendChild(f);
  return f;
}

function load(f,u,t=30000){
  return new Promise((res,rej)=>{
    const z=setTimeout(()=>rej(Error("timeout")),t);
    f.onload=()=>{clearTimeout(z);res()};
    f.onerror=()=>{clearTimeout(z);rej(Error("load"))};
    f.src=u;
  });
}

async function waitDoc(f,t=30000){
  const x=Date.now();
  while(Date.now()-x<t&&!stop){
    const d=f.contentDocument;
    if(d?.body&&d.readyState==="complete")return d;
    await S(200);
  }
  throw Error("feedback non disponibile");
}

function buildFeedback(){
  const u=new URL(location.href);
  u.searchParams.set("filter","feedback_page:RECEIVED_AS_SELLER");
  u.searchParams.set("sort","RECENTV2");
  u.hash="";
  return u.toString();
}

async function set200(d){
  const before=sig(d);
  const old=fbRows(d).length;

  const exact=[...d.querySelectorAll("a,button")]
    .filter(e=>C(e.textContent)==="200"&&!e.disabled&&e.getAttribute("aria-disabled")!=="true");

  let pick=exact.find(e=>{
    let a=e;
    for(let i=0;i<5&&a;i++,a=a.parentElement){
      if(/items per page|results per page|per page/.test(N(a.innerText)))return 1;
    }
    return 0;
  })||exact[0];

  if(pick){
    pick.click();
    log("Items per page: selezionato 200.");
    const x=Date.now();

    while(Date.now()-x<15000&&!stop){
      await S(250);
      const nr=fbRows(d).length;
      if(nr!==old||sig(d)!==before){
        await S(600);
        log(`Items per page attivi: ${nr} righe visibili.`);
        return 1;
      }
    }
  }

  for(const s of d.querySelectorAll("select")){
    const o=[...s.options].find(o=>C(o.textContent)==="200"||C(o.value)==="200");
    if(o){
      s.value=o.value;
      s.dispatchEvent(new Event("change",{bubbles:true}));
      log("Items per page: 200 da select.");
      await changed(d,before,12000);
      return 1;
    }
  }

  log(`ATTENZIONE: non ho confermato 200; righe visibili ${fbRows(d).length}.`);
  return 0;
}

function parseSoldHtml(html){
  if(/pardon our interruption|verify you are human|robot check|captcha|security measure/i.test(html)){
    return{sold:null,status:"captcha"};
  }

  const d=new DOMParser().parseFromString(html,"text/html");
  const t=C(
    d.querySelector("#qtyAvailability,.x-quantity__availability,[data-testid*='quantity']")?.textContent||""
  );

  let m=t.match(/([\d,.]+)\s+sold\b/i);
  if(!m)m=html.match(/\b([\d,.]+)\s+sold\b/i);

  return m
    ? {sold:NUM(m[1]),status:"ok"}
    : {sold:null,status:"missing"};
}

function soldFromDoc(d){
  if(!d?.body)return null;

  const t=C(d.body.innerText);
  if(/captcha|verify you are human|pardon our interruption|security measure/i.test(t)){
    throw Error("CAPTCHA");
  }

  const q=C(
    d.querySelector("#qtyAvailability,.x-quantity__availability,[data-testid*='quantity']")?.innerText||""
  );

  let m=q.match(/([\d,.]+)\s+sold\b/i);
  if(!m)m=t.match(/\b([\d,.]+)\s+sold\b/i);

  return m?NUM(m[1]):null;
}

async function fetchSold(x){
  try{
    const ac=new AbortController();
    const timer=setTimeout(()=>ac.abort(),4500);

    const r=await fetch(x.url,{
      credentials:"include",
      cache:"no-store",
      redirect:"follow",
      signal:ac.signal
    });

    clearTimeout(timer);

    if(r.ok){
      const z=parseSoldHtml(await r.text());
      if(Number.isFinite(z.sold))return z.sold;
      if(z.status==="captcha")throw Error("CAPTCHA");
    }
  }catch(e){
    if(e.message==="CAPTCHA")throw e;
  }

  return null;
}

async function iframeSold(x,f){
  f.src="about:blank";
  await S(30);

  let loaded=0;
  f.onload=()=>loaded=1;
  f.src=x.url;

  const start=Date.now();

  while(Date.now()-start<9000&&!stop){
    await S(180);

    try{
      const n=soldFromDoc(f.contentDocument);
      if(Number.isFinite(n))return n;
    }catch(e){
      if(e.message==="CAPTCHA")throw e;
    }

    if(loaded&&Date.now()-start>6500)break;
  }

  return null;
}

async function soldOne(x,f){
  x.soldState="loading";
  render();

  try{
    let n=await fetchSold(x);
    if(!Number.isFinite(n))n=await iframeSold(x,f);

    x.sold=n;
    x.soldState="done";

    if(Number.isFinite(n)){
      soldFound++;
      log(`${x.id}: ${n} sold`);
    }else{
      log(`${x.id}: Item sold non visibile`);
    }
  }catch(e){
    x.sold=null;
    x.soldState="error";
    soldErrors++;
    log(`${x.id}: ${e.message}`);
    if(e.message==="CAPTCHA")stop=1;
  }finally{
    soldDone++;
    render();
  }
}

async function enrich(){
  const a=sorted();
  if(!a.length)return;

  let ix=0;

  async function worker(k){
    const f=frame(PF+k,1400,1000);

    while(!stop){
      const i=ix++;
      if(i>=a.length)break;

      const x=a[i];
      $("#status").textContent=
        `Fase 2 · Item sold ${Math.min(soldDone+1,a.length)}/${a.length} · ${x.id}`;

      await soldOne(x,f);
      await S(120);
    }

    f.remove();
  }

  await Promise.all([worker(1),worker(2)]);
  log(`Item sold completato: ${soldFound}/${soldDone}, errori ${soldErrors}.`);
}

$("#x").onclick=()=>{
  stop=1;
  p.remove();
  st.remove();
  document.getElementById(FB)?.remove();
  for(const x of document.querySelectorAll(`[id^="${PF}"]`))x.remove();
};

$("#stop").onclick=()=>{
  stop=1;
  $("#status").textContent="Interrotto";
};

$("#google").onclick=()=>{
  const a=sorted();
  if(!a.length)return;

  let u=localStorage.getItem(GSKEY)||"";

  if(!u){
    u=prompt(
      "Incolla l'URL della Web App Google Apps Script che creeremo per l'esportazione in Google Sheets:",
      ""
    )||"";
    u=C(u);
    if(!u)return;
    localStorage.setItem(GSKEY,u);
  }

  const t=periodTotals();

  const payload={
    seller,
    marketplace:location.hostname,
    positiveMonth:Number.isFinite(official.month)?official.month:t.month,
    positiveSixMonths:Number.isFinite(official.six)?official.six:t.six,
    positiveTwelveMonths:Number.isFinite(official.year)?official.year:t.year,
    totalItemSold:totalItemSold(),
    generatedAt:new Date().toISOString(),
    rows:a.map((x,i)=>({
      rank:i+1,
      itemSold:Number.isFinite(x.sold)?x.sold:null,
      oneMonth:x.monthCount,
      sixMonths:x.sixCount,
      twelveMonths:x.yearCount,
      feedbackSales:x.monthCount,
      itemId:x.id,
      title:x.title,
      url:x.url,
      source:x.source
    }))
  };

  const form=document.createElement("form");
  form.method="POST";
  form.action=u;
  form.target="_blank";
  form.style.display="none";

  const input=document.createElement("input");
  input.type="hidden";
  input.name="payload";
  input.value=JSON.stringify(payload);

  form.appendChild(input);
  document.body.appendChild(form);
  form.submit();
  form.remove();

  log(`Esportazione Google Sheet inviata: ${a.length} righe.`);
};

$("#csv").onclick=()=>{
  const a=sorted();

  const rows=a.map((x,i)=>`
    <tr>
      <td>${i+1}</td>
      <td>${Number.isFinite(x.sold)?x.sold:""}</td>
      <td>${x.monthCount}</td>
      <td>${x.sixCount}</td>
      <td>${x.yearCount}</td>
      <td style="mso-number-format:'\\\\@';"><a href="${E(x.url)}">${E(x.id)}</a></td>
      <td>${E(x.title)}</td>
      <td><a href="${E(x.url)}">Apri</a></td>
      <td>${E(x.source)}</td>
    </tr>
  `).join("");

  const html=`
  <html xmlns:o="urn:schemas-microsoft-com:office:office"
        xmlns:x="urn:schemas-microsoft-com:office:excel"
        xmlns="http://www.w3.org/TR/REC-html40">
  <head>
    <meta charset="UTF-8">
    <!--[if gte mso 9]>
    <xml>
      <x:ExcelWorkbook>
        <x:ExcelWorksheets>
          <x:ExcelWorksheet>
            <x:Name>Best Sellers</x:Name>
            <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
          </x:ExcelWorksheet>
        </x:ExcelWorksheets>
      </x:ExcelWorkbook>
    </xml>
    <![endif]-->
  </head>
  <body>
    <table border="1">
      <thead>
        <tr>
          <th>Rank</th>
          <th>Item sold</th>
          <th>1 month</th>
          <th>6 months</th>
          <th>12 months</th>
          <th>Item ID</th>
          <th>Title</th>
          <th>Link</th>
          <th>Source</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </body>
  </html>`;

  const u=URL.createObjectURL(
    new Blob(["\uFEFF"+html],{type:"application/vnd.ms-excel;charset=utf-8"})
  );

  const l=document.createElement("a");
  l.href=u;
  l.download=`ebay_${seller}_best_sellers_${location.hostname}.xls`;
  l.click();

  setTimeout(()=>URL.revokeObjectURL(u),1000);
};

render();

const f=frame(FB);

try{
  $("#status").textContent="Fase 1 · preparo 200 feedback per pagina…";

  await load(f,buildFeedback());

  const d=await waitDoc(f);
  await set200(d);

  for(let i=1;i<=150&&!stop;i++){
    pages=i;

    const r=process(d);

    if(r.monthRows>0||r.sixRows>0||r.yearRows>0){
      trackedWindowSeen=1;
    }

    log(
      `Pagina ${i}: +${r.posMonth} Positive 1m · +${r.posSix} Positive 6m · +${r.posYear} Positive 12m · ${products.size} prodotti.`
    );

    $("#status").textContent=
      `Fase 1 · pagina ${i} · prodotti ${products.size} · 1m ${periodTotals().month} · 6m ${periodTotals().six} · 12m ${periodTotals().year}`;

    if(trackedWindowSeen&&r.olderRows>0){
      log(`Superati i 12 mesi alla pagina ${i}. Stop feedback.`);
      break;
    }

    const b=next(d);

    if(!b){
      log("Ultima pagina feedback raggiunta.");
      break;
    }

    const s=sig(d);
    b.click();

    if(!await changed(d,s)){
      log("La pagina feedback non è cambiata dopo Next.");
      break;
    }
  }

  f.remove();

  if(stop)return;

  $("#status").textContent=
    `Fase 2 · lettura Item sold su ${products.size} prodotti…`;

  await enrich();
  render();

  const t=periodTotals();

  $("#status").textContent=stop
    ? "Interrotto / verifica eBay"
    : `Completato · ${products.size} prodotti · 1m ${t.month} · 6m ${t.six} · 12m ${t.year} · Item sold ${soldFound}/${soldDone} · totale ${totalItemSold()}`;

  log(`Completato. Source Text ${textIds}; Link ${mapped-textIds}.`);
}catch(e){
  f.remove();
  $("#status").textContent=`Interrotto: ${e.message}`;
  log(`ERRORE: ${e.message}`);
}
})();