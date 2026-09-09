/*
 * Sell Like Clone - Amazon Match extension
 * Reuses the existing EBAY_IMPORT Amazon Creators API functions already present
 * in the Apps Script project. It does not change clone_prepare.
 *
 * IMPORTANT: in the existing doGet(e), add ONLY this route immediately after
 * the clone_prepare route:
 *
 *   if (action === SELL_LIKE_AMAZON_MATCH.action) return sellLikeAmazonMatchJsonp_(e);
 */
const SELL_LIKE_AMAZON_MATCH = Object.freeze({
  action: 'amazon_match',
  maxCandidates: 10,
  maxResults: 5,
  maxSourceDescriptionChars: 10000,
  callbackPattern: /^[A-Za-z_$][A-Za-z0-9_$\.]{0,120}$/
});

function sellLikeAmazonMatchJsonp_(e) {
  const callback = String(e && e.parameter && e.parameter.callback || 'capitanAmazonMatchCallback').trim();
  if (!SELL_LIKE_AMAZON_MATCH.callbackPattern.test(callback)) {
    return ContentService.createTextOutput('/* callback non valido */').setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  const started = Date.now();
  let payload;
  try {
    const itemId = ebayCanonicalExtractItemId_(e && e.parameter && e.parameter.itemId || '');
    if (!itemId) throw new Error('eBay Item ID mancante/non valido.');

    payload = sellLikeAmazonMatchPrepare_(itemId);

    try {
      ebayCanonicalLog_('Sell Like Amazon Match', payload.country || '-', itemId, 'OK',
        'Ricerca Amazon completata: ' + payload.matches.length + ' candidati.',
        Date.now() - started,
        'query=' + payload.query + '; ai=' + payload.aiUsed);
    } catch (ignored) {}
  } catch (err) {
    payload = {ok:false,error:String(err && err.message || err)};
    try {
      ebayCanonicalLog_('Sell Like Amazon Match', '-', e && e.parameter && e.parameter.itemId || '-', 'WARNING IN LOG',
        'Ricerca Amazon non riuscita: ' + payload.error,
        Date.now() - started,
        String(err && err.stack || err));
    } catch (ignored) {}
  }

  return ContentService
    .createTextOutput(callback + '(' + JSON.stringify(payload).replace(/<\//g,'<\\/') + ');')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function sellLikeAmazonMatchPrepare_(itemId) {
  if (typeof ebayImportAmazonSearchItems_ !== 'function') {
    throw new Error('Funzione esistente ebayImportAmazonSearchItems_ non disponibile nel progetto Apps Script.');
  }

  const fetched = ebayImportFetchItemWithFallback_(itemId);
  const parsed = ebayCanonicalParseFetched_(fetched, itemId);
  const ebay = sellLikeAmazonMatchBuildEbayContext_(parsed);
  const query = sellLikeAmazonMatchBuildQuery_(ebay);
  if (!query) throw new Error('Dati eBay insufficienti per la ricerca Amazon.');

  const items = (ebayImportAmazonSearchItems_(query) || []).slice(0, SELL_LIKE_AMAZON_MATCH.maxCandidates);
  if (!items.length) {
    return {ok:true,itemId:String(itemId),country:ebay.country,query:query,aiUsed:false,matches:[]};
  }

  let candidates = items.map(function(item){
    return sellLikeAmazonMatchNormalizeCandidate_(item, ebay);
  }).filter(function(x){ return !!x.asin; });

  // Ranking deterministico prima dell'AI. Identificatori e specifiche pesano più del titolo SEO.
  candidates.sort(function(a,b){ return b.baseScore - a.baseScore; });

  // AI usata come reranker dei candidati, mai come sorgente di dati prodotto.
  const aiRank = sellLikeAmazonMatchAiRank_(ebay, candidates);
  let aiUsed = false;
  if (aiRank && aiRank.length) {
    const order = {};
    aiRank.forEach(function(x,i){ order[String(x.asin || '').trim()] = {rank:i,confidence:Number(x.confidence || 0)}; });
    candidates.forEach(function(c){
      const a = order[c.asin];
      if (a) {
        c.aiConfidence = isFinite(a.confidence) ? a.confidence : null;
        c.aiRank = a.rank;
      } else {
        c.aiConfidence = null;
        c.aiRank = 999;
      }
    });
    candidates.sort(function(a,b){
      if (a.aiRank !== b.aiRank) return a.aiRank - b.aiRank;
      return b.baseScore - a.baseScore;
    });
    aiUsed = true;
  }

  const out = candidates.slice(0, SELL_LIKE_AMAZON_MATCH.maxResults).map(function(c){
    return {
      asin:c.asin,
      price:c.price,
      currency:c.currency,
      url:c.url,
      title:c.title,
      brand:c.brand,
      score:c.baseScore,
      aiConfidence:c.aiConfidence
    };
  });

  return {
    ok:true,
    itemId:String(itemId),
    country:ebay.country,
    query:query,
    aiUsed:aiUsed,
    matches:out
  };
}

function sellLikeAmazonMatchBuildEbayContext_(p) {
  const aspects = p && (p.aspects || p.itemSpecifics || p.allAspects || p.allAspectsJson) || '';
  return {
    title:String(p && p.title || '').trim(),
    description:sellLikeClonePlainText_(p && p.description || '').slice(0, SELL_LIKE_AMAZON_MATCH.maxSourceDescriptionChars),
    brand:String(p && p.brand || '').trim(),
    model:String(p && p.model || '').trim(),
    mpn:String(p && p.mpn || '').trim(),
    upc:String(p && p.upc || '').trim(),
    ean:String(p && p.ean || '').trim(),
    color:String(p && p.color || '').trim(),
    size:String(p && p.size || '').trim(),
    material:String(p && p.material || '').trim(),
    type:String(p && p.type || '').trim(),
    dimensions:String(p && (p.dimensions || p.itemDimensions) || '').trim(),
    technicalDetails:String(p && p.technicalDetails || '').trim(),
    aspects:typeof aspects === 'string' ? aspects : JSON.stringify(aspects || {}),
    country:String(p && p.country || '').toUpperCase() || 'US'
  };
}

function sellLikeAmazonMatchBuildQuery_(p) {
  const ids = [p.upc,p.ean,p.mpn,p.model].map(function(x){return String(x||'').trim();}).filter(Boolean);
  if (ids.length) return ids.slice(0,2).join(' ').slice(0,220);

  const important = [p.brand,p.type,p.title].map(function(x){return String(x||'').trim();}).filter(Boolean).join(' ');
  return important.replace(/\s+/g,' ').trim().slice(0,220);
}

function sellLikeAmazonMatchNormalizeCandidate_(item, ebay) {
  const asin = String(item && item.asin || '').trim();
  const title = String(getNestedEbay_(item,['itemInfo','title','displayValue']) || '').trim();
  const brand = String(getNestedEbay_(item,['itemInfo','byLineInfo','brand','displayValue']) || '').trim();
  const featuresRaw = getNestedEbay_(item,['itemInfo','features','displayValues']) || [];
  const features = Array.isArray(featuresRaw) ? featuresRaw.map(function(x){ return String(x || '').trim(); }).filter(Boolean) : [];
  const classifications = getNestedEbay_(item,['itemInfo','classifications']) || {};
  const amount = getNestedEbay_(item,['offersV2','listings',0,'price','money','amount']);
  const price = amount === null || amount === undefined || amount === '' ? null : Number(amount);
  const currency = String(getNestedEbay_(item,['offersV2','listings',0,'price','money','currency']) || 'USD');

  const candidate = {
    asin:asin,
    title:title,
    brand:brand,
    features:features,
    classifications:classifications,
    price:isFinite(price) ? price : null,
    currency:currency,
    url:typeof buildEbayImportAmazonCleanUrl_ === 'function' ? buildEbayImportAmazonCleanUrl_(asin) : ('https://www.amazon.com/dp/' + asin)
  };
  candidate.baseScore = sellLikeAmazonMatchBaseScore_(ebay, candidate);
  candidate.aiConfidence = null;
  candidate.aiRank = 999;
  return candidate;
}

function sellLikeAmazonMatchNorm_(v) {
  return String(v || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
}

function sellLikeAmazonMatchTokens_(v) {
  return sellLikeAmazonMatchNorm_(v).split(/\s+/).filter(function(x){ return x.length > 1; });
}

function sellLikeAmazonMatchContainsExact_(haystack, needle) {
  const h = sellLikeAmazonMatchNorm_(haystack);
  const n = sellLikeAmazonMatchNorm_(needle);
  return !!(h && n && (' ' + h + ' ').indexOf(' ' + n + ' ') >= 0);
}

function sellLikeAmazonMatchBaseScore_(ebay, amz) {
  let score = 0;
  const amazonText = [amz.title,amz.brand,(amz.features || []).join(' '),JSON.stringify(amz.classifications || {})].join(' ');

  // Exact identifiers dominate the ranking.
  [ebay.upc,ebay.ean].filter(Boolean).forEach(function(id){ if (sellLikeAmazonMatchContainsExact_(amazonText,id)) score += 100; });
  [ebay.mpn,ebay.model].filter(Boolean).forEach(function(id){ if (sellLikeAmazonMatchContainsExact_(amazonText,id)) score += 70; });

  const eb = sellLikeAmazonMatchNorm_(ebay.brand), ab = sellLikeAmazonMatchNorm_(amz.brand);
  if (eb && ab) score += eb === ab ? 25 : -12;

  // Title intentionally has limited weight because SEO titles differ.
  const et = sellLikeAmazonMatchTokens_(ebay.title);
  const at = new Set(sellLikeAmazonMatchTokens_(amz.title));
  if (et.length) score += 28 * et.filter(function(x){ return at.has(x); }).length / et.length;

  // Specs/content carry more weight than SEO wording.
  const specText = [ebay.type,ebay.color,ebay.size,ebay.material,ebay.dimensions,ebay.technicalDetails,ebay.aspects].join(' ');
  const st = sellLikeAmazonMatchTokens_(specText);
  const amazonTokens = new Set(sellLikeAmazonMatchTokens_(amazonText));
  if (st.length) score += 35 * st.filter(function(x){ return amazonTokens.has(x); }).length / Math.min(st.length,20);

  return Math.round(score * 100) / 100;
}

function sellLikeAmazonMatchAiRank_(ebay, candidates) {
  try {
    if (!candidates || !candidates.length) return [];
    const apiKey = sellLikeCloneOpenAiKey_();
    const props = PropertiesService.getScriptProperties();
    const model = String(props.getProperty('OPENAI_MODEL') || SELL_LIKE_CLONE.defaultModel).trim();

    const compactCandidates = candidates.map(function(c){
      return {
        asin:c.asin,
        title:c.title,
        brand:c.brand,
        features:(c.features || []).slice(0,8),
        baseScore:c.baseScore
      };
    });

    const system = [
      'You rank Amazon search candidates against one eBay source product.',
      'Use only supplied facts. Goal: identical product first; if none is exact, rank the closest real product.',
      'Identifiers UPC/EAN/MPN/model and technical specifications are more important than SEO title wording.',
      'Do not use price as a matching signal.',
      'Different quantity, size, voltage, connector, model, color or package count can make a candidate non-identical.',
      'Return STRICT JSON only: {"ranking":[{"asin":"...","confidence":0-100}, ...]} with every supplied ASIN exactly once, best first.'
    ].join(' ');

    const source = {
      title:ebay.title,
      description:ebay.description,
      brand:ebay.brand,
      model:ebay.model,
      mpn:ebay.mpn,
      upc:ebay.upc,
      ean:ebay.ean,
      type:ebay.type,
      color:ebay.color,
      size:ebay.size,
      material:ebay.material,
      dimensions:ebay.dimensions,
      technicalDetails:ebay.technicalDetails,
      aspects:ebay.aspects
    };

    const body = {
      model:model,
      reasoning:{effort:'low'},
      input:[
        {role:'system',content:[{type:'input_text',text:system}]},
        {role:'user',content:[{type:'input_text',text:'EBAY SOURCE:\n'+JSON.stringify(source)+'\n\nAMAZON CANDIDATES:\n'+JSON.stringify(compactCandidates)}]}
      ],
      max_output_tokens:1600
    };

    const response = UrlFetchApp.fetch('https://api.openai.com/v1/responses',{
      method:'post',
      contentType:'application/json',
      headers:{Authorization:'Bearer ' + apiKey},
      payload:JSON.stringify(body),
      muteHttpExceptions:true
    });

    const code = response.getResponseCode();
    if (code < 200 || code >= 300) return [];
    const data = JSON.parse(response.getContentText());
    let text = '';
    (data.output || []).forEach(function(o){
      (o.content || []).forEach(function(c){ if (c.type === 'output_text' && c.text) text += c.text; });
    });
    text = String(text || '').trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');
    const parsed = JSON.parse(text);
    return Array.isArray(parsed.ranking) ? parsed.ranking : [];
  } catch (err) {
    // AI is optional: deterministic ranking remains available.
    return [];
  }
}
