/**
 * Sell Like Item clone helper for the dedicated CapitanShop bookmarklet.
 *
 * Contract:
 * - source listing is read by eBay Item ID through the existing eBay fetch/parsing stack;
 * - title/category/item specifics are NOT changed by this helper;
 * - description is rewritten conservatively by AI using ONLY facts present in the source;
 * - output uses the existing DESCRIPTION_TEMPLATE_HTML;
 * - price is source price -2%; quantity is always 3; condition target is New;
 * - images are returned in original eBay order for browser-side upload.
 */
const SELL_LIKE_CLONE = Object.freeze({
  backendVersion: 'v2.4-clean-specs-location',
  action: 'clone_prepare',
  defaultModel: 'gpt-5.6-luna',
  quantity: 3,
  discountRate: 0.02,
  maxDescriptionChars: 28000,
  callbackPattern: /^[A-Za-z_$][A-Za-z0-9_$\.]{0,120}$/
});

// Override web-app GET while preserving the existing status page.
function doGet(e) {
  const action = String(e && e.parameter && e.parameter.action || '').trim();
  if (action === SELL_LIKE_CLONE.action) return sellLikeCloneJsonp_(e);

  try {
    const ss = SpreadsheetApp.openById(BOOKMARKLET_EBAY_IMPORT_CONFIG.spreadsheetId);
    const sheet = ss.getSheetByName(BOOKMARKLET_EBAY_IMPORT_CONFIG.sheetName);
    if (!sheet) throw new Error('Scheda EBAY_IMPORT non trovata.');
    const map = getBookmarkletHeaderMap_(sheet);
    const missing = BOOKMARKLET_EBAY_IMPORT_CONFIG.requiredHeaders.filter(function(h) { return !map[h]; });
    if (missing.length) throw new Error('Colonne mancanti: ' + missing.join(', '));
    return HtmlService.createHtmlOutput(
      '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<title>CapitanShop Bookmarklet Import</title></head><body style="font-family:Arial,sans-serif;padding:28px;line-height:1.45">' +
      '<h2 style="margin-top:0">CapitanShop eBay Import</h2><p><b>Endpoint attivo.</b></p>' +
      '<p>Destinazione verificata: <b>EBAY_IMPORT</b>.</p><p>Questa pagina di controllo non modifica il foglio.</p></body></html>'
    );
  } catch (error) { return renderBookmarkletImportError_(error); }
}

function sellLikeCloneJsonp_(e) {
  const callback = String(e && e.parameter && e.parameter.callback || 'capitanSellLikeCallback').trim();
  if (!SELL_LIKE_CLONE.callbackPattern.test(callback)) {
    return ContentService.createTextOutput('/* callback non valido */').setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  const started = Date.now();
  let payload;
  try {
    const itemId = ebayCanonicalExtractItemId_(e && e.parameter && e.parameter.itemId || '');
    if (!itemId) throw new Error('eBay Item ID mancante/non valido.');
    payload = sellLikeClonePrepare_(itemId);
    try {
      ebayCanonicalLog_('Sell Like Clone', payload.country || '-', itemId, 'OK',
        'Pacchetto clone preparato: immagini, descrizione AI/template, prezzo -2%, New, quantita 3.',
        Date.now() - started, 'images=' + payload.images.length + '; model=' + payload.aiModel);
    } catch (ignored) {}
  } catch (err) {
    payload = {ok:false, error:String(err && err.message || err)};
    try {
      ebayCanonicalLog_('Sell Like Clone', '-', e && e.parameter && e.parameter.itemId || '-', 'WARNING IN LOG',
        'Preparazione clone non riuscita: ' + payload.error, Date.now() - started, String(err && err.stack || err));
    } catch (ignored) {}
  }

  return ContentService
    .createTextOutput(callback + '(' + JSON.stringify(payload).replace(/<\//g, '<\\/') + ');')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function sellLikeClonePrepare_(itemId) {
  const fetched = ebayImportFetchItemWithFallback_(itemId);
  const parsed = ebayCanonicalParseFetched_(fetched, itemId);
  const price = Number(parsed.price);
  if (!isFinite(price) || price <= 0) throw new Error('Prezzo sorgente non disponibile o non valido.');

  const images = (parsed.images || [])
    .map(function(x){ return String(x || '').trim(); })
    .filter(function(x){ return /^https?:\/\//i.test(x); });
  if (!images.length) throw new Error('Nessuna immagine sorgente disponibile.');

  const originalDescription = sellLikeClonePlainText_(parsed.description || '')
    .slice(0, SELL_LIKE_CLONE.maxDescriptionChars);
  if (!originalDescription) throw new Error('Descrizione sorgente non disponibile.');

  const aspects = sellLikeCloneAspectsFromParsed_(parsed);
  const technicalRows = sellLikeCloneTechnicalRows_(parsed, aspects);
  const ai = sellLikeCloneRewriteDescription_(
    String(parsed.title || ''),
    originalDescription,
    aspects
  );

  const html = sellLikeCloneBuildTemplate_(
    String(parsed.title || ''),
    images[0],
    ai,
    technicalRows
  );

  const country = String(parsed.country || '').toUpperCase() || 'US';
  const locationParts = sellLikeCloneLocationParts_(fetched, parsed);

  return {
    ok: true,
    backendVersion: SELL_LIKE_CLONE.backendVersion,
    itemId: String(itemId),
    country: country,
    sourcePrice: Number(price.toFixed(2)),
    targetPrice: Number((price * (1 - SELL_LIKE_CLONE.discountRate)).toFixed(2)),
    quantity: SELL_LIKE_CLONE.quantity,
    condition: 'New',
    images: images,
    descriptionHtml: html,
    aiModel: ai.model,
    itemLocation: locationParts.display,
    itemLocationParts: locationParts,
    technicalSpecsCount: technicalRows.length,
    untouched: ['Title','Category','Item Specifics','Policies'],
    source: fetched && fetched.source || ''
  };
}

function sellLikeCloneAspectsFromParsed_(parsed) {
  const out = {};

  function put(k, v) {
    k = String(k || '').trim();
    if (!k) return;
    if (Array.isArray(v)) v = v.join(', ');
    if (v && typeof v === 'object') return;
    v = String(v == null ? '' : v).replace(/\s+/g, ' ').trim();
    if (v && !out[k]) out[k] = v;
  }

  function absorb(obj) {
    if (!obj) return;
    if (typeof obj === 'string') {
      const s = obj.trim();
      if (!s) return;
      try { return absorb(JSON.parse(s)); } catch (ignored) { return; }
    }
    if (Array.isArray(obj)) {
      obj.forEach(function(x) {
        if (x && typeof x === 'object') {
          const name = x.name || x.label || x.key || x.aspectName;
          const value = x.value || x.values || x.val || x.aspectValue;
          if (name) put(name, value);
          else absorb(x);
        }
      });
      return;
    }
    if (typeof obj === 'object') {
      Object.keys(obj).forEach(function(k) {
        const v = obj[k];
        if (v && typeof v === 'object' && !Array.isArray(v)) {
          const name = v.name || v.label || v.key || v.aspectName;
          const value = v.value || v.values || v.val || v.aspectValue;
          if (name) put(name, value);
          else if (/aspect|specific/i.test(k)) absorb(v);
        } else {
          put(k, v);
        }
      });
    }
  }

  [
    parsed && parsed.aspectsJson,
    parsed && parsed.allAspectsJson,
    parsed && parsed.aspects,
    parsed && parsed.allAspects,
    parsed && parsed.itemSpecifics,
    parsed && parsed.itemSpecificsJson,
    parsed && parsed.specifics
  ].forEach(absorb);

  Object.keys(parsed || {}).forEach(function(k) {
    if (/aspect|specific/i.test(k)) absorb(parsed[k]);
  });

  const fallback = {
    'Brand': parsed && parsed.brand,
    'Type': parsed && parsed.type,
    'Color': parsed && parsed.color,
    'Size': parsed && parsed.size,
    'Material': parsed && parsed.material,
    'Model': parsed && parsed.model,
    'MPN': parsed && parsed.mpn,
    'UPC': parsed && parsed.upc,
    'EAN': parsed && parsed.ean,
    'Item Length': parsed && parsed.itemLength,
    'Item Width': parsed && parsed.itemWidth,
    'Item Height': parsed && parsed.itemHeight,
    'Item Weight': parsed && parsed.itemWeight,
    'Dimensions': parsed && parsed.dimensions,
    'Technical Details': parsed && parsed.technicalDetails
  };
  Object.keys(fallback).forEach(function(k) { put(k, fallback[k]); });

  return out;
}

function sellLikeCloneTechnicalRows_(parsed, aspects) {
  aspects = aspects || {};
  const rows = [];
  const seen = {};

  const blockedLabels = {
    'Condition':1,
    'Category':1,
    'Category ID':1,
    'Category Name':1,
    'Category Path':1,
    'Seller Username':1,
    'Seller Feedback %':1,
    'Seller Feedback Score':1,
    'Shipping Policy':1,
    'Return Policy':1,
    'Item Location':1,
    'Technical Details':1,
    'Dimensions':1
  };

  function isMeaninglessValue(value) {
    const v = String(value == null ? '' : value)
      .replace(/[’]/g, "'")
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();

    return v === "doesn't apply" ||
      v === 'does not apply' ||
      v === 'do not apply' ||
      v === 'unbranded';
  }

  function add(label, value) {
    label = String(label || '').trim();
    value = String(value == null ? '' : value).replace(/\s+/g, ' ').trim();

    if (!label || !value || blockedLabels[label] || isMeaninglessValue(value)) return;

    const key = label.toLowerCase() + '|' + value.toLowerCase();
    if (seen[key]) return;

    seen[key] = true;
    rows.push({label: label, value: value});
  }

  Object.keys(aspects).forEach(function(k) { add(k, aspects[k]); });

  add('Item Length', parsed && parsed.itemLength);
  add('Item Width', parsed && parsed.itemWidth);
  add('Item Height', parsed && parsed.itemHeight);
  add('Item Weight', parsed && parsed.itemWeight);

  return rows.slice(0, 40);
}

function sellLikeCloneTechnicalHtml_(rows) {
  if (!rows || !rows.length) return '';
  return '<div style="display:block;">' + rows.map(function(r) {
    return '<div style="padding:4px 0;border-bottom:1px solid #eef3f9;">' +
      '<b>' + sellLikeCloneEscapeHtml_(r.label) + ':</b> ' +
      sellLikeCloneEscapeHtml_(r.value) +
      '</div>';
  }).join('') + '</div>';
}

function sellLikeCloneRemoveTechnicalSection_(html) {
  html = String(html || '');

  const patterns = [
    /<div\b[^>]*>\s*<h2\b[^>]*>\s*Technical Specifications\s*<\/h2>\s*<div\b[^>]*>\s*(?:<p\b[^>]*>\s*<\/p>\s*)*<\/div>\s*<\/div>/i,
    /<section\b[^>]*>\s*<h2\b[^>]*>\s*Technical Specifications\s*<\/h2>[\s\S]*?<\/section>/i,
    /<div\b[^>]*>\s*<h2\b[^>]*>\s*Technical Specifications\s*<\/h2>[\s\S]*?<\/div>\s*(?=<div\b[^>]*>\s*<h2\b[^>]*>\s*Shop Detail)/i
  ];
  patterns.forEach(function(re) { html = html.replace(re, ''); });

  html = html.replace(
    /<h2\b[^>]*>\s*Technical Specifications\s*<\/h2>\s*<div\b[^>]*>\s*<\/div>/i,
    ''
  );
  return html;
}

function sellLikeCloneLocationParts_(fetched, parsed) {
  const out = {display:'', city:'', stateOrProvince:'', postalCode:'', country:''};

  function clean(v) {
    return String(v == null ? '' : v).replace(/\s+/g, ' ').trim();
  }

  function merge(loc) {
    if (!loc || typeof loc !== 'object') return;
    out.city = out.city || clean(loc.city || loc.locality || loc.town);
    out.stateOrProvince = out.stateOrProvince || clean(loc.stateOrProvince || loc.state || loc.region);
    out.postalCode = out.postalCode || clean(loc.postalCode || loc.zipCode || loc.zip);
    out.country = out.country || clean(loc.country || loc.countryCode);
  }

  if (fetched && fetched.item) {
    merge(fetched.item.itemLocation);
    merge(fetched.item.location);
  }

  if (fetched && fetched.xmlText) {
    const xml = String(fetched.xmlText || '');
    function tag(name) {
      const m = xml.match(new RegExp('<' + name + '(?:\\s[^>]*)?>([\\s\\S]*?)<\\/' + name + '>', 'i'));
      return m && m[1] ? clean(m[1].replace(/<[^>]+>/g, ' ')) : '';
    }
    out.city = out.city || tag('Location');
    out.postalCode = out.postalCode || tag('PostalCode');
    out.country = out.country || tag('Country');
  }

  const parsedDisplay = clean(parsed && parsed.itemLocation);
  if (parsedDisplay) {
    out.display = parsedDisplay;
    const parts = parsedDisplay.split(',').map(clean).filter(Boolean);
    if (!out.city && parts.length) out.city = parts[0] || '';
    if (!out.country && parts.length >= 2) out.country = parts[parts.length - 1] || '';
    if (!out.postalCode && parts.length >= 3) out.postalCode = parts[parts.length - 2] || '';
    if (!out.stateOrProvince && parts.length >= 4) out.stateOrProvince = parts[1] || '';
  }

  if (!out.display) {
    out.display = [out.city, out.stateOrProvince, out.postalCode, out.country].filter(Boolean).join(', ');
  }

  return out;
}

function sellLikeClonePlainText_(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>|<\/li>|<\/div>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim();
}

function sellLikeCloneGroqKey_() {
  const p = PropertiesService.getScriptProperties();
  const keys = ['GROQ_API_KEY','ALI_GROQ_API_KEY'];
  for (let i = 0; i < keys.length; i++) {
    const v = String(p.getProperty(keys[i]) || '').trim();
    if (v) return v;
  }
  throw new Error('Chiave Groq non configurata nelle Script Properties.');
}

function sellLikeCloneRewriteDescription_(title, sourceText, aspects) {
  const props = PropertiesService.getScriptProperties();
  const apiKey = sellLikeCloneGroqKey_();
  const model = String(
    props.getProperty('GROQ_MODEL') ||
    props.getProperty('ALI_GROQ_MODEL') ||
    'openai/gpt-oss-120b'
  ).trim();

  const aspectsText = Object.keys(aspects || {}).map(function(k) {
    const v = String(aspects[k] == null ? '' : aspects[k]).replace(/\s+/g, ' ').trim();
    return v ? (k + ': ' + v) : '';
  }).filter(Boolean).join('\n');

  const system = [
    'You prepare factual eBay product descriptions for a clone/reformat workflow.',
    'Preserve ALL distinct factual product information present in SOURCE DESCRIPTION and ITEM SPECIFICS.',
    'Do not summarize away useful facts. Do not arbitrarily reduce a long feature list to 4 or 5 items.',
    'You may remove only exact duplicates, seller-specific language, external links, competitor shop names, contact details, and generic boilerplate.',
    'Do NOT invent, infer, embellish, or add facts not present in the supplied source data.',
    'Do not add certifications, dimensions, materials, quantities, warranty, compatibility, shipping, returns, origin, brand, identifiers, performance claims, or accessories unless explicitly present.',
    'The description should reorganize and lightly clean the source, not rewrite it into a materially different product description.',
    'For bullets, preserve every distinct useful product feature from the source. Return up to 12 bullets when the source contains that many distinct features.',
    'Return STRICT JSON only with exactly these keys: {"bullets":["..."],"description":"..."}'
  ].join(' ');

  const user =
    'TITLE (context only; do not create new facts):\n' + title +
    '\n\nSOURCE DESCRIPTION:\n' + sourceText +
    '\n\nITEM SPECIFICS / SOURCE ATTRIBUTES:\n' + (aspectsText || '(none available)');

  const payload = {
    model: model,
    messages: [
      { role:'system', content:system },
      { role:'user', content:user }
    ],
    temperature: 0.1,
    max_completion_tokens: 2600,
    response_format: { type:'json_object' }
  };

  const response = UrlFetchApp.fetch('https://api.groq.com/openai/v1/chat/completions', {
    method:'post',
    contentType:'application/json',
    headers:{Authorization:'Bearer ' + apiKey},
    payload:JSON.stringify(payload),
    muteHttpExceptions:true
  });

  const code = response.getResponseCode();
  const raw = response.getContentText();

  if (code < 200 || code >= 300) {
    throw new Error('Groq HTTP ' + code + ': ' + raw.slice(0, 500));
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    throw new Error('Risposta Groq non JSON valida.');
  }

  let out = String(
    ((((data.choices || [])[0] || {}).message || {}).content) || ''
  ).trim();

  out = out
    .replace(/^```(?:json)?\s*/i,'')
    .replace(/\s*```$/,'');

  let parsed;
  try {
    parsed = JSON.parse(out);
  } catch (err) {
    throw new Error('Risposta AI non JSON valida.');
  }

  const bullets = (Array.isArray(parsed.bullets) ? parsed.bullets : [])
    .map(function(x){ return String(x || '').trim(); })
    .filter(Boolean)
    .slice(0,12);

  const description = String(parsed.description || '').trim();
  if (!description) throw new Error('AI non ha restituito una descrizione valida.');

  return {bullets: bullets, description: description, model: model};
}

function sellLikeCloneEscapeHtml_(v) {
  return String(v == null ? '' : v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function sellLikeCloneTextToHtml_(v) {
  return sellLikeCloneEscapeHtml_(v).split(/\n+/).map(function(p){ return p.trim(); }).filter(Boolean).map(function(p){ return '<p style="margin:0 0 10px 0;">' + p + '</p>'; }).join('');
}

function sellLikeCloneBuildTemplate_(title, mainImage, ai, technicalRows) {
  if (typeof DESCRIPTION_TEMPLATE_HTML === 'undefined') {
    throw new Error('Template HTML CapitanShop non disponibile.');
  }

  const hero = typeof getDescriptionImageProperty_ === 'function'
    ? getDescriptionImageProperty_('HERO_IMG','https://beatmixlab.com/wp-content/uploads/2026/06/hero_market.webp')
    : 'https://beatmixlab.com/wp-content/uploads/2026/06/hero_market.webp';

  const footer = typeof getDescriptionImageProperty_ === 'function'
    ? getDescriptionImageProperty_('FOOTER_IMG','https://beatmixlab.com/wp-content/uploads/2026/06/footer_market.webp')
    : 'https://beatmixlab.com/wp-content/uploads/2026/06/footer_market.webp';

  const bullets = (ai.bullets || []).map(function(b) {
    return '<li>✔ ' + sellLikeCloneEscapeHtml_(b) + '</li>';
  }).join('');

  let html = DESCRIPTION_TEMPLATE_HTML;
  html = html.replaceAll('[TITLE]', sellLikeCloneEscapeHtml_(title));
  html = html.replaceAll('[MAIN_IMAGE]', sellLikeCloneEscapeHtml_(mainImage));
  html = html.replaceAll('[HERO_IMG]', sellLikeCloneEscapeHtml_(hero));
  html = html.replaceAll('[FOOTER_IMG]', sellLikeCloneEscapeHtml_(footer));
  html = html.replaceAll('[BULLET_LIST]', bullets);
  html = html.replaceAll('[DESCRIPTION]', sellLikeCloneTextToHtml_(ai.description));

  const technicalHtml = sellLikeCloneTechnicalHtml_(technicalRows || []);
  if (technicalHtml) {
    html = html.replaceAll('[ITEM_DESCRIPTION]', technicalHtml);
    html = html.replaceAll('[PRODUCT_DIMENSION]', '');
  } else {
    html = sellLikeCloneRemoveTechnicalSection_(html);
    html = html.replaceAll('[ITEM_DESCRIPTION]', '');
    html = html.replaceAll('[PRODUCT_DIMENSION]', '');
  }

  return typeof minifyDescriptionHtml_ === 'function'
    ? minifyDescriptionHtml_(html)
    : html;
}
