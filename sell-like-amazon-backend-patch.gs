/* Sell Like Clone - Amazon Match extension.
   Reuses existing CapitanShop Amazon Creators API functions; does not alter the official clone_prepare flow. */
const SELL_LIKE_AMAZON_MATCH = Object.freeze({
  action: 'amazon_match',
  maxCandidates: 10,
  maxResults: 5,
  callbackPattern: /^[A-Za-z_$][A-Za-z0-9_$\.]{0,120}$/
});

/* Add this route near the top of the existing doGet(e), immediately after clone_prepare:
   if (action === SELL_LIKE_AMAZON_MATCH.action) return sellLikeAmazonMatchJsonp_(e);
*/

function sellLikeAmazonMatchJsonp_(e) {
  const callback = String(e && e.parameter && e.parameter.callback || 'capitanAmazonMatchCallback').trim();
  if (!SELL_LIKE_AMAZON_MATCH.callbackPattern.test(callback)) {
    return ContentService.createTextOutput('/* callback non valido */').setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  let payload;
  try {
    const itemId = ebayCanonicalExtractItemId_(e && e.parameter && e.parameter.itemId || '');
    if (!itemId) throw new Error('eBay Item ID mancante/non valido.');
    payload = sellLikeAmazonMatchPrepare_(itemId);
  } catch (err) {
    payload = {ok:false,error:String(err && err.message || err)};
  }
  return ContentService.createTextOutput(callback + '(' + JSON.stringify(payload).replace(/<\//g,'<\\/') + ');').setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function sellLikeAmazonMatchPrepare_(itemId) {
  if (typeof ebayImportAmazonSearchItems_ !== 'function') throw new Error('Funzione Amazon Best Match non disponibile.');
  const fetched = ebayImportFetchItemWithFallback_(itemId);
  const parsed = ebayCanonicalParseFetched_(fetched, itemId);
  const query = sellLikeAmazonMatchBuildQuery_(parsed);
  if (!query) throw new Error('Dati eBay insufficienti per la ricerca Amazon.');
  const items = (ebayImportAmazonSearchItems_(query) || []).slice(0, SELL_LIKE_AMAZON_MATCH.maxCandidates);
  const normalized = items.map(function(item){ return sellLikeAmazonMatchNormalize_(item, parsed); }).filter(function(x){ return x.asin; });
  normalized.sort(function(a,b){ return b.score-a.score; });
  return {ok:true,itemId:String(itemId),query:query,matches:normalized.slice(0,SELL_LIKE_AMAZON_MATCH.maxResults)};
}

function sellLikeAmazonMatchBuildQuery_(p) {
  const strong = [p.upc,p.ean,p.mpn,p.model].map(function(x){return String(x||'').trim();}).filter(Boolean);
  if (strong.length) return strong.slice(0,2).join(' ');
  const brand = String(p.brand||'').trim();
  const title = String(p.title||'').replace(/\s+/g,' ').trim();
  return (brand+' '+title).replace(/\s+/g,' ').trim().slice(0,220);
}

function sellLikeAmazonMatchNormalize_(item, ebay) {
  const asin = String(item && item.asin || '').trim();
  const title = String(getNestedEbay_(item,['itemInfo','title','displayValue']) || '').trim();
  const brand = String(getNestedEbay_(item,['itemInfo','byLineInfo','brand','displayValue']) || '').trim();
  const amount = getNestedEbay_(item,['offersV2','listings',0,'price','money','amount']);
  const price = amount === null || amount === undefined || amount === '' ? null : Number(amount);
  const currency = String(getNestedEbay_(item,['offersV2','listings',0,'price','money','currency']) || 'USD');
  return {asin:asin,price:isFinite(price)?price:null,currency:currency,title:title,brand:brand,url:buildEbayImportAmazonCleanUrl_(asin),score:sellLikeAmazonMatchScore_(ebay,{title:title,brand:brand})};
}

function sellLikeAmazonMatchScore_(ebay, amz) {
  function norm(v){return String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();}
  function tokens(v){return norm(v).split(/\s+/).filter(function(x){return x.length>1;});}
  let score = 0;
  const eb = norm(ebay && ebay.brand), ab = norm(amz.brand);
  if (eb && ab && eb === ab) score += 25;
  const et = tokens((ebay&&ebay.title)||''), at = new Set(tokens(amz.title||''));
  if (et.length) score += 60 * et.filter(function(x){return at.has(x);}).length / et.length;
  const identifiers=[ebay&&ebay.upc,ebay&&ebay.ean,ebay&&ebay.mpn,ebay&&ebay.model].map(norm).filter(Boolean);
  identifiers.forEach(function(id){ if (norm(amz.title).indexOf(id)>=0) score += 20; });
  return Math.round(score*100)/100;
}
