javascript:(()=>{
'use strict';
const PANEL_ID='capitan-sell-like-clone';
const MODAL_ID='capitan-pricing-modal';
const PATCH_ID='capitan-settings-ui-patch-v1';
if(document.getElementById(PATCH_ID))return;
const marker=document.createElement('span');marker.id=PATCH_ID;marker.style.display='none';document.documentElement.appendChild(marker);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const clean=v=>String(v??'').replace(/\s+/g,' ').trim();

function styleHeaderControls(){
  const panel=document.getElementById(PANEL_ID);if(!panel)return false;
  const header=panel.querySelector('.h');if(!header)return false;
  const close=header.querySelector('[data-close]');
  const gear=panel.querySelector('#capitan-pricing-open');
  if(!close||!gear)return false;

  let controls=header.querySelector('#capitan-header-controls');
  if(!controls){
    controls=document.createElement('div');controls.id='capitan-header-controls';controls.style.cssText='display:flex;align-items:center;gap:7px;margin-left:auto';
    header.appendChild(controls);
  }
  controls.appendChild(gear);
  controls.appendChild(close);

  const common='width:34px;height:34px;padding:0;border:1px solid #b9b9b9;border-radius:8px;background:#fff;color:#333;display:flex;align-items:center;justify-content:center;cursor:pointer;line-height:1;box-sizing:border-box';
  gear.style.cssText=common+';font-size:21px;font-family:Arial,sans-serif;font-weight:400';
  gear.title='Impostazioni';gear.setAttribute('aria-label','Impostazioni');
  close.style.cssText=common+';font-size:18px;font-family:Arial,sans-serif;font-weight:400';

  const breakRow=panel.querySelector('#capitan-break-even-row');
  if(breakRow){breakRow.style.justifyContent='flex-start';breakRow.style.gap='6px'}
  return true;
}

function decorateSettingsModal(){
  const overlay=document.getElementById(MODAL_ID);if(!overlay||overlay.dataset.tabsReady==='1')return false;
  const card=overlay.firstElementChild;if(!card)return false;
  overlay.dataset.tabsReady='1';

  const header=card.firstElementChild;
  if(header){
    const title=[...header.querySelectorAll('div')].find(x=>/Sell Like This v1\.4/i.test(clean(x.textContent||'')));
    if(title)title.textContent='Sell Like This v1.4 - Impostazioni';
  }

  const body=card.children[1];
  if(!body)return true;

  const tabs=document.createElement('div');
  tabs.id='capitan-settings-tabs';
  tabs.style.cssText='display:flex;gap:6px;padding:12px 18px 0;border-bottom:1px solid #e5e7eb;background:#fafafa';
  const tab=document.createElement('button');
  tab.type='button';tab.textContent='Aggiorna tariffe';tab.setAttribute('aria-selected','true');
  tab.style.cssText='border:0;border-bottom:3px solid #1668e8;background:transparent;color:#1668e8;font-weight:700;font-size:13px;padding:10px 14px 9px;cursor:default';
  tabs.appendChild(tab);
  card.insertBefore(tabs,body);

  const sectionTitle=document.createElement('div');
  sectionTitle.style.cssText='font-size:16px;font-weight:700;color:#111;margin:0 0 7px';
  sectionTitle.textContent='Aggiorna tariffe';
  body.insertBefore(sectionTitle,body.firstChild);
  return true;
}

(async()=>{
  for(let i=0;i<80;i++){if(styleHeaderControls())break;await sleep(100)}
  const panel=document.getElementById(PANEL_ID);if(!panel)return;
  const gear=panel.querySelector('#capitan-pricing-open');
  if(gear){gear.addEventListener('click',async()=>{for(let i=0;i<30;i++){await sleep(40);if(decorateSettingsModal())break}},true)}
  const observer=new MutationObserver(()=>{styleHeaderControls();decorateSettingsModal()});
  observer.observe(document.body,{childList:true,subtree:true});
})();
})();