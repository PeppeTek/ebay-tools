/**
 * Dropper Analytics Quick Catalog · existing Sell Like Clone Apps Script deployment.
 *
 * Add this helper as a separate .gs file INSIDE the existing active Apps Script project.
 * The only doGet() routing change required is:
 * if (action === 'quick_catalog_upsert') return dropperQuickCatalogHandleGet_(e);
 * Do not replace existing doGet() routes or other catalog handlers.
 * Uses the same deployed /exec URL and JSONP transport as Sell Like Clone.
 * Requires a separate Script Property:
 *   DROPPER_QUICK_CATALOG_TOKEN = long random secret chosen by the owner.
 *
 * This writes ONLY [Item ID, Title, Price] to one of three dedicated quick tabs.
 */
const DROPPER_QUICK_CATALOG = Object.freeze({
  spreadsheetId: '1cUfx_0gckyBSc5eWpqqIfVlUfzjHxDx-c3bTCQCf8s4',
  sheets: {US:'Catalogo Rapido US',CA:'Catalogo Rapido CA',AU:'Catalogo Rapido AU'},
  headers: ['Item ID','Title','Price'],
  authKey: 'DROPPER_QUICK_CATALOG_TOKEN'
});
function dropperQuickCatalogHandleGet_(e) {
  const q=(e&&e.parameter)||{};
  const callback=String(q.callback||'').trim();
  if(!/^[A-Za-z_$][\w$]{0,90}$/.test(callback)){
    return ContentService.createTextOutput('/* Invalid JSONP callback */').setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  let payload;
  try{
    if(q.action!=='quick_catalog_upsert')throw Error('Azione non supportata');
    const secret=String(PropertiesService.getScriptProperties().getProperty(DROPPER_QUICK_CATALOG.authKey)||'');
    if(secret.length<32||String(q.token||'')!==secret)throw Error('Autorizzazione catalogo non valida');
    payload=quickCatalogUpsert_(q);
  }catch(err){payload={ok:false,error:String(err&&err.message||err)}}
  const serialized=JSON.stringify(payload).replace(/<\//g,'<\\/');
  return ContentService.createTextOutput(callback+'('+serialized+');').setMimeType(ContentService.MimeType.JAVASCRIPT);
}
function quickCatalogUpsert_(q){
 const market=String(q.market||'').toUpperCase();
 if(!Object.prototype.hasOwnProperty.call(DROPPER_QUICK_CATALOG.sheets,market))throw Error('Marketplace non supportato');
 const itemId=String(q.itemId||'').trim();
 if(!/^\d{9,12}$/.test(itemId))throw Error('Item ID non valido');
 const title=String(q.title||'').trim().replace(/\s+/g,' ');
 if(!title||title.length>255)throw Error('Titolo mancante o troppo lungo');
 const price=Number(q.price);
 if(!Number.isFinite(price)||price<=0||price>1e7||Math.abs(price*100-Math.round(price*100))>1e-6)throw Error('Prezzo non valido');
 const lock=LockService.getScriptLock();
 if(!lock.tryLock(20000))throw Error('Catalogo occupato: riprovare');
 try{
  const ss=SpreadsheetApp.openById(DROPPER_QUICK_CATALOG.spreadsheetId);
  const sheet=ss.getSheetByName(DROPPER_QUICK_CATALOG.sheets[market]);
  if(!sheet)throw Error('Scheda catalogo rapido non trovata: '+market);
  const current=sheet.getRange(1,1,1,3).getDisplayValues()[0];
  if(current.join('|')!==DROPPER_QUICK_CATALOG.headers.join('|'))throw Error('Intestazioni catalogo non corrispondenti');
  const end=sheet.getLastRow();
  let row=end+1,updated=false;
  if(end>1){
    const match=sheet.getRange(2,1,end-1,1).createTextFinder(itemId).matchEntireCell(true).findNext();
    if(match){row=match.getRow();updated=true}
  }
  if(row>sheet.getMaxRows())sheet.insertRowsAfter(sheet.getMaxRows(),Math.max(100,row-sheet.getMaxRows()));
  const range=sheet.getRange(row,1,1,3);
  range.setNumberFormats([['@','@','0.00']]);
  // Text-formatting and apostrophe prefix protect against formula-like titles.
  const safeTitle=/^[=+\-@]/.test(title)?"'"+title:title;
  range.setValues([[itemId,safeTitle,Math.round(price*100)/100]]);
  SpreadsheetApp.flush();
  const actual=range.getDisplayValues()[0];
  const storedId=String(actual[0]).replace(/^'/,'');
  const verifiedPrice=Number(range.getValues()[0][2]);
  if(storedId!==itemId||!Number.isFinite(verifiedPrice)||Math.abs(verifiedPrice-price)>.001)throw Error('Verifica scrittura non riuscita');
  return {ok:true,market,itemId,row,updated,price:Math.round(price*100)/100,sheetName:sheet.getName(),stored:true};
 }finally{lock.releaseLock()}
}
