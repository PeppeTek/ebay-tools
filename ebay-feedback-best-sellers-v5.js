(async () => {
  "use strict";

  const VERSION = "5.0-AU";
  const IDS = {
    panel: "pep-ebay-bs-v5",
    style: "pep-ebay-bs-v5-style",
    frame: "pep-ebay-bs-v5-frame"
  };

  [IDS.panel, IDS.style, IDS.frame].forEach(id => document.getElementById(id)?.remove());

  if (!/\/fdbk\/feedback_profile\//i.test(location.pathname)) {
    alert("Apri prima la pagina Feedback Profile del venditore eBay.");
    return;
  }

  const CFG = {
    MAX_PAGES: 150,
    PAGE_SETTLE_MS: 900,
    CHANGE_TIMEOUT_MS: 22000,
    ITEM_TIMEOUT_MS: 22000,
    ITEM_DOM_WAIT_MS: 12000,
    ITEM_DELAY_MIN_MS: 450,
    ITEM_DELAY_MAX_MS: 850,
    ITEM_RETRIES: 1,
    MAX_ITEMS_TO_SCAN: 1200
  };

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const clean = v => String(v ?? "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
  const norm = v => clean(v).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const esc = v => String(v ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  const csv = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const randomDelay = () => CFG.ITEM_DELAY_MIN_MS + Math.floor(Math.random() * (CFG.ITEM_DELAY_MAX_MS - CFG.ITEM_DELAY_MIN_MS + 1));

  const host = location.hostname;
  const origin = location.origin;
  const seller = decodeURIComponent(location.pathname.match(/\/fdbk\/feedback_profile\/([^/?#]+)/i)?.[1] || "ebay_seller");
  const canonicalItemUrl = id => `${origin}/itm/${id}`;

  function extractItemId(value) {
    const text = String(value || "");
    const patterns = [
      /\/itm\/(?:[^/?#]+\/)?(\d{9,15})(?:[/?#]|$)/i,
      /[?&](?:item|itemid|itemId)=(\d{9,15})(?:&|$)/i,
      /\(#\s*(\d{9,15})\s*\)/i,
      /\bitem\s*(?:id|number|no\.?)?\s*[:#-]?\s*(\d{9,15})\b/i,
      /#\s*(\d{9,15})\b/
    ];
    for (const p of patterns) {
      const m = text.match(p);
      if (m) return m[1];
    }
    return "";
  }

  function extractIdFromRow(row) {
    for (const a of row.querySelectorAll('a[href]')) {
      const id = extractItemId(a.href || a.getAttribute("href"));
      if (id) return { id, source: "link" };
    }

    for (const el of row.querySelectorAll("*")) {
      for (const attr of [...el.attributes]) {
        if (!/(href|item|listing|id|data)/i.test(attr.name)) continue;
        const id = extractItemId(attr.value);
        if (id) return { id, source: `attr:${attr.name}` };
      }
    }

    const rowText = clean(row.innerText || row.textContent);
    const id = extractItemId(rowText);
    if (id) return { id, source: "text" };

    return { id: "", source: "none" };
  }

  function extractTitleFromRow(row, itemId) {
    const selectors = [
      ".card__item",
      "[class*='card__item']",
      "[data-testid*='item']",
      "[class*='item-title']",
      "[class*='itemTitle']",
      "a[href*='/itm/']",
      "h3", "h2"
    ];

    const candidates = [];
    for (const sel of selectors) {
      for (const node of row.querySelectorAll(sel)) {
        const t = clean(node.innerText || node.textContent);
        if (t) candidates.push(t);
      }
    }

    const rowText = clean(row.innerText || row.textContent);
    if (rowText) candidates.push(rowText);

    const idEsc = itemId ? itemId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") : "";
    const cleaned = candidates
      .map(t => {
        let x = t;
        if (idEsc) {
          const before = x.match(new RegExp(`(.+?)\\s*\\(#\\s*${idEsc}\\s*\\)`, "i"));
          if (before?.[1]) x = before[1];
          x = x.replace(new RegExp(`\\s*\\(#\\s*${idEsc}\\s*\\)\\s*`, "ig"), " ");
        }
        return clean(x
          .replace(/\bBuyer:\s*.*$/i, "")
          .replace(/\bPast\s+(?:month|6 months|year).*$/i, "")
          .replace(/\bAU\s*\$[\d,.]+.*$/i, "")
          .replace(/\bUS\s*\$[\d,.]+.*$/i, "")
        );
      })
      .filter(t => t.length >= 4 && t.length <= 400)
      .sort((a, b) => a.length - b.length);

    return cleaned[0] || `Item ${itemId}`;
  }

  function getFeedbackRows(doc = document) {
    const selectors = [
      "#feedback-cards tbody tr[data-feedback-id]",
      "#feedback-cards tbody tr",
      "[data-feedback-id]",
      "tr[class*='feedback']",
      "[class*='feedback-card']"
    ];
    const set = new Set();
    for (const sel of selectors) {
      for (const row of doc.querySelectorAll(sel)) {
        const t = clean(row.innerText || row.textContent);
        if (t.length > 20) set.add(row);
      }
      if (set.size) break;
    }
    return [...set];
  }

  function feedbackFingerprint(row) {
    return clean(
      row.getAttribute("data-feedback-id") ||
      row.getAttribute("id") ||
      row.innerText ||
      row.textContent
    ).slice(0, 500);
  }

  function isPositive(row) {
    if (row.querySelector(
      'svg[data-test-type="positive"],' +
      'svg[aria-label*="Positive" i],' +
      '[aria-label*="Positive feedback" i],' +
      '[data-testid*="positive" i]'
    )) return true;

    const t = norm(row.innerText || row.textContent);
    if (/\bnegative\b|\bneutral\b|\bnegativo\b|\bneutro\b/.test(t)) return false;
    return /\bpositive\b|\bpositivo\b/.test(t) || !!row.querySelector("svg");
  }

  function isLastMonth(row) {
    const t = norm(row.innerText || row.textContent);
    return /\bpast month\b|\blast month\b|\b1 month\b|\bone month\b|\bultimo mese\b|\b1 mese\b/.test(t);
  }

  function pageSignature() {
    return getFeedbackRows().slice(0, 10).map(feedbackFingerprint).join("|");
  }

  function filterCheck() {
    const rating = clean(
      document.querySelector('[data-testid="details-rating-dropdown-input"] button')?.innerText ||
      document.querySelector('[data-testid*="rating"] button')?.innerText
    );
    const period = clean(
      document.querySelector('[data-testid="details-duration-dropdown-input"] button')?.innerText ||
      document.querySelector('[data-testid*="duration"] button')?.innerText
    );
    const ratingOk = !rating || /positive|positivo/i.test(rating);
    const periodOk = !period || /1 month|one month|1 mese|un mese/i.test(period);
    return { rating, period, ok: ratingOk && periodOk };
  }

  function find200Button() {
    return [...document.querySelectorAll("button")].find(b => {
      if (b.disabled || b.getAttribute("aria-disabled") === "true") return false;
      const t = clean(b.innerText || b.textContent);
      const a = clean(b.getAttribute("aria-label"));
      return t === "200" || /(?:show|display|mostra)\s*200/i.test(`${t} ${a}`);
    });
  }

  function findNextButton() {
    const els = [...document.querySelectorAll("button,a")];
    return els.find(el => {
      if (el.disabled || el.getAttribute("aria-disabled") === "true") return false;
      const t = norm(
        el.getAttribute("aria-label") ||
        el.getAttribute("title") ||
        el.innerText ||
        el.textContent
      );
      return /^(next page|next|pagina successiva|successiva|avanti)$/.test(t) ||
        /\bnext page\b/.test(t);
    });
  }

  async function waitForPageChange(before) {
    const start = Date.now();
    while (Date.now() - start < CFG.CHANGE_TIMEOUT_MS && !state.stopped) {
      await sleep(300);
      const after = pageSignature();
      if (after && after !== before) {
        await sleep(CFG.PAGE_SETTLE_MS);
        return true;
      }
    }
    return false;
  }

  async function choose200() {
    const button = find200Button();
    if (!button || getFeedbackRows().length > 25) return;
    const old = pageSignature();
    const count = getFeedbackRows().length;
    log("Imposto 200 feedback per pagina...");
    button.click();
    const start = Date.now();
    while (Date.now() - start < 15000 && !state.stopped) {
      await sleep(300);
      if (getFeedbackRows().length !== count || pageSignature() !== old) {
        await sleep(CFG.PAGE_SETTLE_MS);
        log(`Ora sono visibili ${getFeedbackRows().length} feedback.`);
        return;
      }
    }
    log("Il comando 200 non ha modificato la pagina; continuo con il layout corrente.");
  }

  function parseTargetCount(doc = document) {
    const body = clean(doc.body?.innerText || "");
    const candidates = [];
    const patterns = [
      /([\d,.]+)\s+positive feedback/i,
      /positive feedback\s*[:\-]?\s*([\d,.]+)/i,
      /([\d,.]+)\s+feedback/i
    ];
    for (const p of patterns) {
      const m = body.match(p);
      if (m) {
        const n = Number(m[1].replace(/[,.](?=\d{3}\b)/g, "").replace(",", "."));
        if (Number.isFinite(n) && n > 0) candidates.push(n);
      }
    }
    return candidates.length ? Math.max(...candidates) : null;
  }

  const state = {
    stopped: false,
    phase: "feedback",
    pages: 0,
    target: null,
    positiveFound: 0,
    feedbackSeen: new Set(),
    products: new Map(),
    withoutProduct: 0,
    fallbackTextIds: 0,
    itemResults: [],
    itemScanned: 0
  };

  function addFeedback(row) {
    const fp = feedbackFingerprint(row);
    if (!fp || state.feedbackSeen.has(fp)) return false;
    state.feedbackSeen.add(fp);

    if (!isPositive(row) || !isLastMonth(row)) return false;

    state.positiveFound++;
    const { id, source } = extractIdFromRow(row);

    if (!id) {
      state.withoutProduct++;
      return true;
    }

    if (source === "text") state.fallbackTextIds++;

    const title = extractTitleFromRow(row, id);
    if (!state.products.has(id)) {
      state.products.set(id, {
        itemId: id,
        title,
        feedbackSales: 0,
        url: canonicalItemUrl(id),
        idSource: source
      });
    }
    const p = state.products.get(id);
    p.feedbackSales++;
    if (title && title.length > p.title.length && title.length < 250) p.title = title;
    return true;
  }

  function processCurrentPage() {
    const rows = getFeedbackRows();
    let accepted = 0;
    for (const r of rows) if (addFeedback(r)) accepted++;
    return { rows: rows.length, accepted };
  }

  function parseNumber(text, word) {
    const n = norm(text);
    const re = new RegExp(`(?:^|\\s)([\\d,.]+)\\s+${word}\\b`, "i");
    const m = n.match(re);
    if (!m) return null;
    const value = Number(m[1].replace(/,/g, ""));
    return Number.isFinite(value) ? value : null;
  }

  function blocked(doc) {
    return /pardon our interruption|verify you are human|captcha|robot check|security measure/i
      .test(clean(doc.body?.innerText || doc.body?.textContent));
  }

  function parseItemDocument(doc, product) {
    const bodyText = clean(doc.body?.innerText || doc.body?.textContent);
    if (blocked(doc)) {
      return { ...product, soldCount: null, status: "CAPTCHA", audit: "Verifica eBay/CAPTCHA" };
    }

    const availability =
      clean(doc.querySelector("#qtyAvailability")?.innerText) ||
      clean(doc.querySelector(".x-quantity__availability")?.innerText) ||
      clean(doc.querySelector("[data-testid*='quantity']")?.innerText);

    let soldCount = parseNumber(availability, "sold");
    if (!Number.isFinite(soldCount)) soldCount = parseNumber(bodyText, "sold");

    const title =
      clean(doc.querySelector("h1.x-item-title__mainTitle")?.innerText) ||
      clean(doc.querySelector("[data-testid='x-item-title']")?.innerText) ||
      clean(doc.querySelector("h1")?.innerText) ||
      product.title;

    const ended = /this listing has ended|this item is no longer available|listing ended|no longer available/i.test(norm(bodyText));

    return {
      ...product,
      title: title.replace(/\s*\|\s*eBay\s*$/i, "") || product.title,
      soldCount: Number.isFinite(soldCount) ? soldCount : null,
      status: Number.isFinite(soldCount) ? "OK" : ended ? "ENDED" : "NOT_SHOWN",
      audit: Number.isFinite(soldCount) ? "Sold letto" : ended ? "Inserzione terminata" : "eBay non mostra sold"
    };
  }

  function createFrame() {
    document.getElementById(IDS.frame)?.remove();
    const f = document.createElement("iframe");
    f.id = IDS.frame;
    Object.assign(f.style, {
      position: "fixed", left: "-12000px", top: "0",
      width: "1450px", height: "1100px", opacity: "0.01",
      pointerEvents: "none", zIndex: "-1"
    });
    document.body.appendChild(f);
    return f;
  }

  function loadFrame(f, url, timeout = CFG.ITEM_TIMEOUT_MS) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("timeout")), timeout);
      f.onload = () => { clearTimeout(timer); resolve(); };
      f.onerror = () => { clearTimeout(timer); reject(new Error("load error")); };
      f.src = url;
    });
  }

  async function waitItemDom(f) {
    const start = Date.now();
    while (Date.now() - start < CFG.ITEM_DOM_WAIT_MS && !state.stopped) {
      const doc = f.contentDocument;
      if (doc?.body) {
        const t = clean(doc.body.innerText || "");
        if (
          doc.querySelector("#qtyAvailability") ||
          doc.querySelector(".x-quantity__availability") ||
          doc.querySelector("h1") ||
          /captcha|verify you are human|this listing has ended|no longer available/i.test(t)
        ) return doc;
      }
      await sleep(300);
    }
    return f.contentDocument;
  }

  async function inspectProduct(product) {
    let last = null;
    for (let attempt = 0; attempt <= CFG.ITEM_RETRIES; attempt++) {
      const f = createFrame();
      try {
        await loadFrame(f, product.url);
        const doc = await waitItemDom(f);
        if (!doc?.body) throw new Error("DOM non accessibile");
        return parseItemDocument(doc, product);
      } catch (e) {
        last = e;
        if (attempt < CFG.ITEM_RETRIES) await sleep(900);
      } finally {
        f.remove();
      }
    }
    return { ...product, soldCount: null, status: "LOAD_ERROR", audit: `Errore caricamento: ${last?.message || "sconosciuto"}` };
  }

  function sortedResults() {
    const byId = new Map(state.itemResults.map(r => [r.itemId, r]));
    return [...state.products.values()]
      .map(p => byId.get(p.itemId) || { ...p, soldCount: null, status: "PENDING", audit: "" })
      .sort((a, b) => b.feedbackSales - a.feedbackSales || (b.soldCount ?? -1) - (a.soldCount ?? -1) || a.title.localeCompare(b.title));
  }

  function render() {
    const results = sortedResults();
    $("#target").textContent = state.target ?? "—";
    $("#positive").textContent = state.positiveFound;
    $("#withprod").textContent = [...state.products.values()].reduce((n, p) => n + p.feedbackSales, 0);
    $("#without").textContent = state.withoutProduct;
    $("#unique").textContent = state.products.size;
    $("#pages").textContent = state.pages;
    $("#soldread").textContent = state.itemScanned;
    $("#soldfound").textContent = state.itemResults.filter(x => Number.isFinite(x.soldCount)).length;
    $("#csv").disabled = !results.length;

    const mismatch = Number.isFinite(state.target) && state.target !== state.positiveFound;
    $("#warn").textContent = mismatch
      ? `⚠ Feedback NON riconciliati: eBay ${state.target}, trovati ${state.positiveFound}. Il conteggio prodotti resta valido sui feedback realmente letti.`
      : state.fallbackTextIds
        ? `✓ Recuperati ${state.fallbackTextIds} Item ID dal testo (fallback AU: prodotto non linkato).`
        : "";

    $("#tb").innerHTML = results.length
      ? results.slice(0, 800).map((x, i) => `
        <tr>
          <td>${i + 1}</td>
          <td><b>${x.feedbackSales}</b></td>
          <td>${Number.isFinite(x.soldCount) ? x.soldCount : "—"}</td>
          <td>${esc(x.idSource || "")}</td>
          <td>${esc(x.itemId)}</td>
          <td>${esc(x.title)}</td>
          <td><a href="${esc(x.url)}" target="_blank" rel="noopener">Apri</a></td>
          <td>${esc(x.audit || "")}</td>
        </tr>`).join("")
      : `<tr><td colspan="8">Nessun prodotto rilevato.</td></tr>`;
  }

  function setStatus(s) { $("#status").textContent = s; }
  function setProgress(n) { $("#bar").style.width = `${Math.max(0, Math.min(100, n))}%`; }
  function log(s) {
    const line = `[${new Date().toLocaleTimeString()}] ${s}`;
    console.log("[eBay Best Sellers v5]", s);
    $("#log").value += line + "\n";
    $("#log").scrollTop = $("#log").scrollHeight;
  }

  const style = document.createElement("style");
  style.id = IDS.style;
  style.textContent = `
  #${IDS.panel}{position:fixed;z-index:2147483647;top:12px;right:12px;width:min(1120px,calc(100vw - 24px));max-height:calc(100vh - 24px);background:#fff;color:#111;border:1px solid #aaa;border-radius:14px;box-shadow:0 14px 45px #0005;font:13px Arial,sans-serif;overflow:hidden}
  #${IDS.panel} *{box-sizing:border-box} #${IDS.panel} .h{display:flex;justify-content:space-between;align-items:center;padding:13px;border-bottom:1px solid #ddd;font-size:17px;font-weight:700}
  #${IDS.panel} .h button{border:0;background:transparent;font-size:25px;cursor:pointer} #${IDS.panel} .b{padding:11px;overflow:auto;max-height:calc(100vh - 70px)}
  #${IDS.panel} .note{background:#f4f7ff;border-left:4px solid #3665f3;padding:8px 10px;margin:7px 0;font-size:12px}
  #${IDS.panel} .prog{height:9px;background:#e5e7eb;border-radius:99px;overflow:hidden;margin:8px 0} #${IDS.panel} .bar{height:100%;width:1%;background:#3665f3;transition:.2s}
  #${IDS.panel} .stats{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:6px;margin:8px 0} #${IDS.panel} .stat{border:1px solid #ddd;border-radius:8px;padding:7px;background:#fafafa} #${IDS.panel} .stat b{display:block;font-size:17px;margin-top:2px}
  #${IDS.panel} .warn{font-size:11px;color:#555;margin:5px 0;min-height:14px}
  #${IDS.panel} .tw{border:1px solid #ccc;border-radius:8px;overflow:auto;max-height:300px} #${IDS.panel} table{width:100%;border-collapse:collapse;font-size:11px} #${IDS.panel} th,#${IDS.panel} td{padding:6px;border-bottom:1px solid #e5e5e5;text-align:left;vertical-align:top} #${IDS.panel} th{position:sticky;top:0;background:#f1f3f5;z-index:2}
  #${IDS.panel} .log{width:100%;height:95px;margin-top:8px;border:1px solid #ccc;border-radius:8px;padding:7px;background:#fafafa;font:11px Consolas,monospace}
  #${IDS.panel} .a{display:flex;justify-content:flex-end;gap:8px;margin-top:8px} #${IDS.panel} .a button{padding:8px 12px;border:1px solid #aaa;border-radius:8px;background:#fff;font-weight:700;cursor:pointer} #${IDS.panel} .a .p{background:#3665f3;color:#fff;border-color:#3665f3} #${IDS.panel} button:disabled{opacity:.45}
  @media(max-width:900px){#${IDS.panel} .stats{grid-template-columns:repeat(4,minmax(0,1fr))}}
  `;
  document.head.appendChild(style);

  const panel = document.createElement("div");
  panel.id = IDS.panel;
  panel.innerHTML = `
    <div class="h"><span>eBay Best Sellers — Positive / Last Month v5 · Multi-country</span><button id="x">×</button></div>
    <div class="b">
      <div><b>Venditore:</b> ${esc(seller)} &nbsp; <b>Marketplace:</b> ${esc(host)}</div>
      <div class="note">Fase 1: legge i feedback positivi dell’ultimo mese. Se il prodotto non è linkato (caso eBay Australia), recupera l’Item ID dal testo <b>(#123...)</b>. Fase 2: apre le inserzioni sullo stesso marketplace e legge il valore pubblico <b>sold</b>.</div>
      <div id="status">Preparazione...</div>
      <div class="prog"><div class="bar" id="bar"></div></div>
      <div class="stats">
        <div class="stat">Target eBay 1M<b id="target">—</b></div>
        <div class="stat">Positivi trovati<b id="positive">0</b></div>
        <div class="stat">Con prodotto<b id="withprod">0</b></div>
        <div class="stat">Senza prodotto<b id="without">0</b></div>
        <div class="stat">Prodotti unici<b id="unique">0</b></div>
        <div class="stat">Pagine feedback<b id="pages">0</b></div>
        <div class="stat">Item sold letti<b id="soldread">0</b></div>
        <div class="stat">Item sold trovati<b id="soldfound">0</b></div>
      </div>
      <div class="warn" id="warn"></div>
      <div class="tw"><table><thead><tr><th>#</th><th>Vendite feedback</th><th>Item sold</th><th>Auto</th><th>Item ID</th><th>Titolo</th><th>Link</th><th>Audit</th></tr></thead><tbody id="tb"><tr><td colspan="8">Lettura in corso...</td></tr></tbody></table></div>
      <textarea class="log" id="log" readonly></textarea>
      <div class="a"><button id="stop">Ferma</button><button id="csv" class="p" disabled>Scarica CSV</button></div>
    </div>`;
  document.body.appendChild(panel);

  const $ = s => panel.querySelector(s);

  function downloadCsv() {
    const rows = sortedResults();
    const data = [
      ["Rank","Feedback Sales Last Month","Item Sold","Item ID Source","Item ID","Product Title","Product URL","Status","Audit"].map(csv).join(";"),
      ...rows.map((x, i) => [
        i + 1, x.feedbackSales, Number.isFinite(x.soldCount) ? x.soldCount : "",
        x.idSource, `="${x.itemId}"`, x.title, x.url, x.status, x.audit
      ].map(csv).join(";"))
    ].join("\r\n");
    const blob = new Blob(["\uFEFFsep=;\r\n" + data], { type: "text/csv;charset=utf-8" });
    const u = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = u;
    a.download = `ebay_${seller}_best_sellers_last_month_${host.replace(/\./g,"_")}_v5.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(u), 2500);
  }

  $("#csv").onclick = downloadCsv;
  $("#stop").onclick = () => {
    state.stopped = true;
    $("#stop").disabled = true;
    setStatus("Interrotto. Puoi scaricare i dati già raccolti.");
  };
  $("#x").onclick = () => {
    state.stopped = true;
    panel.remove();
    style.remove();
    document.getElementById(IDS.frame)?.remove();
  };

  const filters = filterCheck();
  if (!filters.ok) {
    setStatus(`Imposta Rating = Positive e Period = 1 Month. Rilevati: "${filters.rating || "?"}" / "${filters.period || "?"}"`);
    log("Filtri non corretti; script fermato.");
    return;
  }

  state.target = parseTargetCount();
  render();
  setStatus("Fase 1: lettura feedback positivi dell'ultimo mese...");
  log(`Avvio su ${host}. Fallback AU attivo: Item ID da testo anche senza link.`);
  await choose200();

  for (let page = 1; page <= CFG.MAX_PAGES && !state.stopped; page++) {
    state.pages = page;
    const result = processCurrentPage();
    render();
    log(`Pagina ${page}: ${result.rows} righe, ${result.accepted} positivi ultimo mese nuovi. Totale ${state.positiveFound}. Prodotti ${state.products.size}.`);
    setProgress(Math.min(48, 3 + page * 3));

    const next = findNextButton();
    if (!next) {
      log("Nessuna pagina successiva: fine fase feedback.");
      break;
    }
    const before = pageSignature();
    next.click();
    const changed = await waitForPageChange(before);
    if (!changed) {
      log("La pagina non è cambiata dopo Next: fine paginazione.");
      break;
    }
  }

  render();

  if (state.stopped) return;

  if (!state.products.size) {
    setStatus("Fase 1 completata, ma nessun Item ID è stato ricavato. Controlla il log.");
    setProgress(100);
    log(`Feedback positivi: ${state.positiveFound}; senza prodotto: ${state.withoutProduct}.`);
    return;
  }

  const products = [...state.products.values()].slice(0, CFG.MAX_ITEMS_TO_SCAN);
  setStatus(`Fase 2: lettura sold per ${products.length} prodotti unici...`);
  log(`Fase 2: apro ${products.length} inserzioni su ${host}.`);

  for (let i = 0; i < products.length && !state.stopped; i++) {
    const p = products[i];
    setStatus(`Fase 2: ${i + 1}/${products.length} — ${p.itemId}`);
    const result = await inspectProduct(p);
    state.itemResults.push(result);
    state.itemScanned++;
    render();
    setProgress(50 + Math.round((i + 1) / products.length * 50));
    log(`${p.itemId}: ${Number.isFinite(result.soldCount) ? result.soldCount + " sold" : result.audit}`);
    if (result.status === "CAPTCHA") {
      state.stopped = true;
      setStatus("eBay ha richiesto una verifica. Completa il CAPTCHA e riesegui lo script; il CSV parziale è disponibile.");
      break;
    }
    if (i < products.length - 1) await sleep(randomDelay());
  }

  render();
  setProgress(100);

  if (!state.stopped) {
    setStatus(`Completato: ${state.positiveFound} feedback positivi, ${state.products.size} prodotti unici, ${state.itemResults.filter(x => Number.isFinite(x.soldCount)).length} valori sold trovati.`);
    log(`Completato. Fallback Item ID da testo usato ${state.fallbackTextIds} volte.`);
  }
})();