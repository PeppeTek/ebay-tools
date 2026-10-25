/* PriceMatch Pro - UI display corrections. Does not change pricing calculations. */
(function(){
 'use strict';
 const panel=document.getElementById('dropper-competitor-calculator-v1');
 const core=globalThis.DropperCalculatorCore;
 if(!panel||!core)return;
 const load=key=>{try{return JSON.parse(localStorage.getItem(key)||'{}')||{}}catch(_){return {}}};
 const fraction=()=>{
  const market=panel.querySelector('[data-el="market"]')?.value||'US';
  const local=load('dropper-competitor-calculator-fees-v1')[market];
  const prior=load('capitan-sell-like-market-pricing-v1')[market];
  const r=local||prior;
  const valid=r&&Object.keys(core.DEFAULT_FEES).every(k=>Number.isFinite(Number(r[k]))&&Number(r[k])>=0);
  return Number(valid?r.salesTaxEstimate:core.MARKET_FEES[market]?.salesTaxEstimate)||0;
 };
 function update(){
  const details=panel.querySelector('details.dc-fee-table');
  if(!details)return;
  const rate=core.round(fraction()*100);
  for(const row of details.querySelectorAll('.dc-fee-line')){
   const left=row.querySelector('span');
   if(!left)continue;
   const label=left.textContent.trim();
   if(/^Sales Tax \/ unità(?: \([^)]*\))?$/.test(label)){
    const target='Sales Tax / unità ('+rate+'%)';
    if(label!==target)left.textContent=target;
   }
   if(/^Incidenza sul margine(?: \(.*\))?$/.test(label)){
    if(label!=='Incidenza sul margine')left.textContent='Incidenza sul margine';
    const value=row.querySelector('b');
    if(value&&/p\.p\./i.test(value.textContent)){
     const next=value.textContent.replace(/\s*p\.p\./ig,'%').replace(/^—%$/,'— %');
     if(value.textContent!==next)value.textContent=next;
    }
   }
  }
  const header=[...details.querySelectorAll('b')].find(x=>/^CONVERSIONE VALUTARIA \(/.test(x.textContent.trim()));
  if(header){
   const section=header.parentElement;
   section.style.setProperty('color','#000','important');
   for(const el of section.querySelectorAll('*'))el.style.setProperty('color','#000','important');
  }
 }
 update();
 const observer=new MutationObserver(update);
 observer.observe(panel,{childList:true,subtree:true});
 panel.addEventListener('change',update);
})();