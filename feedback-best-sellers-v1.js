/*
 * eBay Feedback Best Sellers — Last Month / Positive
 * --------------------------------------------------
 * Apri una pagina Feedback Profile eBay già filtrata:
 *   Rating type: Positive
 *   Period: 1 Month
 *
 * Lo script:
 * - legge automaticamente tutte le pagine;
 * - considera ogni feedback distinto come 1 vendita stimata;
 * - se lo stesso Item ID compare più volte, ogni feedback aggiunge +1;
 * - raggruppa per Item ID;
 * - ordina dal più venduto al meno venduto;
 * - permette di scaricare un CSV.
 */

(async () => {
  "use strict";

  const VERSION = "1.0.0";
  const PANEL_ID = "peppe-ebay-feedback-best-sellers";
  const STYLE_ID = `${PANEL_ID}-style`;
  const FRAME_ID = `${PANEL_ID}-frame`;

  const CONFIG = {
    LOAD_TIMEOUT_MS: 30000,
    PAGE_CHANGE_TIMEOUT_MS: 25000,
    PAGE_SETTLE_MS: 900,
    BETWEEN_PAGES_MS: 700,
    MAX_PAGES: 1000
  };

  document.getElementById(PANEL_ID)?.remove();
  document.getElementById(STYLE_ID)?.remove();
  document.getElementById(FRAME_ID)?.remove();

  const state = {
    seller: "",
    stopped: false,
    pagesRead: 0,
    feedbacksRead: 0,
    positiveLastMonthRead: 0,
    skippedRows: 0,
    seenFeedbackIds: new Set(),
    products: new Map()
  };

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  const clean = value =>
    String(value ?? "")
      .replace(/\u00a0/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const normalize = value =>
    clean(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

  const escapeHtml = value =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  function extractSeller() {
    const match = location.pathname.match(
      /\/fdbk\/feedback_profile\/([^/?#]+)/i
    );

    return match ? decodeURIComponent(match[1]) : "ebay_seller";
  }

  function extractItemId(href) {
    const match = String(href || "").match(
      /\/itm\/(?:[^/?#]+\/)?(\d{9,15})(?:[/?#]|$)/i
    );

    return match ? match[1] : "";
  }

  function canonicalItemUrl(itemId) {
    return itemId ? `https://www.ebay.com/itm/${itemId}` : "";
  }

  state.seller = extractSeller();

  function isFeedbackPage() {
    return /\/fdbk\/feedback_profile\//i.test(location.pathname);
  }

  function currentFiltersLookCorrect(doc = document) {
    const ratingButton = doc.querySelector(
      '[data-testid="details-rating-dropdown-input"] button'
    );

    const periodButton = doc.querySelector(
      '[data-testid="details-duration-dropdown-input"] button'
    );

    const ratingText = clean(
      ratingButton?.innerText ||
      ratingButton?.textContent ||
      ratingButton?.value
    );

    const periodText = clean(
      periodButton?.innerText ||
      periodButton?.textContent ||
      periodButton?.value
    );

    return {
      ratingOk: /\bpositive\b|\bpositivo\b/i.test(ratingText),
      periodOk:
        /\b1 month\b|\bone month\b|\b1 mese\b|\bun mese\b/i.test(periodText),
      ratingText,
      periodText
    };
  }

  function createPanel() {
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #${PANEL_ID} {
        position: fixed;
        top: 16px;
        right: 16px;
        z-index: 2147483647;
        width: min(980px, calc(100vw - 32px));
        max-height: calc(100vh - 32px);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        border: 1px solid #b7b7b7;
        border-radius: 14px;
        background: #fff;
        color: #111;
        box-shadow: 0 12px 42px rgba(0,0,0,.30);
        font: 14px/1.35 Arial, Helvetica, sans-serif;
      }
      #${PANEL_ID} * { box-sizing: border-box; }
      #${PANEL_ID} .p-head {
        display:flex; align-items:center; justify-content:space-between;
        gap:12px; padding:13px 15px; border-bottom:1px solid #ddd;
      }
      #${PANEL_ID} .p-title { font-size:17px; font-weight:700; }
      #${PANEL_ID} .p-close {
        padding:0; border:0; background:transparent; color:#111;
        font-size:28px; line-height:1; cursor:pointer;
      }
      #${PANEL_ID} .p-body { padding:13px; overflow:auto; }
      #${PANEL_ID} .p-note {
        margin:8px 0; padding:9px 10px; border-left:4px solid #3665f3;
        background:#f4f7ff; font-size:12px;
      }
      #${PANEL_ID} .p-status { min-height:38px; margin-top:6px; }
      #${PANEL_ID} .p-progress {
        height:10px; margin:9px 0; overflow:hidden;
        border-radius:999px; background:#e7e7e7;
      }
      #${PANEL_ID} .p-bar {
        width:0%; height:100%; background:#3665f3; transition:width .2s ease;
      }
      #${PANEL_ID} .p-stats {
        display:grid; grid-template-columns:repeat(5,minmax(0,1fr));
        gap:8px; margin:10px 0;
      }
      #${PANEL_ID} .p-stat {
        padding:9px; border:1px solid #ddd; border-radius:9px; background:#fafafa;
      }
      #${PANEL_ID} .p-stat span { display:block; font-size:12px; }
      #${PANEL_ID} .p-stat b { display:block; margin-top:2px; font-size:18px; }
      #${PANEL_ID} .p-table-wrap {
        max-height:390px; overflow:auto; border:1px solid #ccc; border-radius:9px;
      }
      #${PANEL_ID} table { width:100%; border-collapse:collapse; font-size:12px; }
      #${PANEL_ID} th, #${PANEL_ID} td {
        padding:7px 8px; border-bottom:1px solid #e5e5e5;
        text-align:left; vertical-align:top;
      }
      #${PANEL_ID} th {
        position:sticky; top:0; z-index:2; background:#f0f2f4; white-space:nowrap;
      }
      #${PANEL_ID} .num { text-align:right; white-space:nowrap; }
      #${PANEL_ID} .p-log {
        width:100%; height:105px; margin-top:10px; padding:8px; resize:vertical;
        border:1px solid #ccc; border-radius:8px; background:#fafafa; color:#111;
        font:12px/1.35 Consolas, monospace;
      }
      #${PANEL_ID} .p-actions {
        display:flex; flex-wrap:wrap; justify-content:flex-end;
        gap:8px; margin-top:10px;
      }
      #${PANEL_ID} .p-actions button {
        padding:9px 13px; border:1px solid #aaa; border-radius:8px;
        background:#fff; color:#111; cursor:pointer; font-weight:700;
      }
      #${PANEL_ID} .p-actions button.primary {
        border-color:#3665f3; background:#3665f3; color:#fff;
      }
      #${PANEL_ID} button:disabled { opacity:.45; cursor:not-allowed; }
      #${PANEL_ID} a { color:#0654ba; text-decoration:none; }
      #${PANEL_ID} a:hover { text-decoration:underline; }
      @media (max-width:850px) {
        #${PANEL_ID} .p-stats {
          grid-template-columns:repeat(2,minmax(0,1fr));
        }
      }
    `;

    const panel = document.createElement("div");
    panel.id = PANEL_ID;
    panel.innerHTML = `
      <div class="p-head">
        <div class="p-title">
          eBay Best Sellers da Feedback — 1 Month / Positive
        </div>
        <button class="p-close" id="peppe-close" title="Chiudi">×</button>
      </div>

      <div class="p-body">
        <div>
          <b>Venditore:</b> ${escapeHtml(state.seller)}
          &nbsp;·&nbsp;
          <b>Versione:</b> ${VERSION}
        </div>

        <div class="p-note">
          Ogni feedback positivo distinto dell’ultimo mese vale
          <b>1 vendita stimata</b>. Se lo stesso Item ID compare più volte,
          ogni occorrenza incrementa il conteggio.
        </div>

        <div class="p-status" id="peppe-status">Preparazione...</div>

        <div class="p-progress">
          <div class="p-bar" id="peppe-bar"></div>
        </div>

        <div class="p-stats">
          <div class="p-stat">
            <span>Pagine lette</span>
            <b id="peppe-pages">0</b>
          </div>
          <div class="p-stat">
            <span>Feedback unici letti</span>
            <b id="peppe-feedbacks">0</b>
          </div>
          <div class="p-stat">
            <span>Positivi ultimo mese</span>
            <b id="peppe-positive">0</b>
          </div>
          <div class="p-stat">
            <span>Prodotti unici</span>
            <b id="peppe-products">0</b>
          </div>
          <div class="p-stat">
            <span>Righe ignorate</span>
            <b id="peppe-skipped">0</b>
          </div>
        </div>

        <div class="p-table-wrap">
          <table>
            <thead>
              <tr>
                <th class="num">#</th>
                <th class="num">Vendite stimate</th>
                <th>Item ID</th>
                <th>Prodotto</th>
                <th>Link</th>
              </tr>
            </thead>
            <tbody id="peppe-table-body">
              <tr><td colspan="5">Lettura in corso...</td></tr>
            </tbody>
          </table>
        </div>

        <textarea class="p-log" id="peppe-log" readonly></textarea>

        <div class="p-actions">
          <button id="peppe-stop">Ferma</button>
          <button id="peppe-download" class="primary" disabled>Scarica CSV</button>
        </div>
      </div>
    `;

    document.head.appendChild(style);
    document.body.appendChild(panel);
    return panel;
  }

  const panel = createPanel();
  const $ = selector => panel.querySelector(selector);

  function setStatus(message) {
    $("#peppe-status").textContent = message;
  }

  function setProgress(percent) {
    $("#peppe-bar").style.width =
      `${Math.max(0, Math.min(100, percent))}%`;
  }

  function log(message) {
    console.log("[eBay Feedback Best Sellers]", message);
    const box = $("#peppe-log");
    box.value += `[${new Date().toLocaleTimeString()}] ${message}\n`;
    box.scrollTop = box.scrollHeight;
  }

  function getProductRows() {
    return [...state.products.values()].sort(
      (a, b) =>
        b.sales - a.sales ||
        a.title.localeCompare(b.title)
    );
  }

  function updatePanel() {
    $("#peppe-pages").textContent =
      state.pagesRead.toLocaleString("it-IT");

    $("#peppe-feedbacks").textContent =
      state.feedbacksRead.toLocaleString("it-IT");

    $("#peppe-positive").textContent =
      state.positiveLastMonthRead.toLocaleString("it-IT");

    $("#peppe-products").textContent =
      state.products.size.toLocaleString("it-IT");

    $("#peppe-skipped").textContent =
      state.skippedRows.toLocaleString("it-IT");

    const products = getProductRows();
    $("#peppe-download").disabled = products.length === 0;

    if (!products.length) {
      $("#peppe-table-body").innerHTML =
        `<tr><td colspan="5">Nessun prodotto ancora rilevato.</td></tr>`;
      return;
    }

    const visible = products.slice(0, 500);

    $("#peppe-table-body").innerHTML = visible
      .map((row, index) => `
        <tr>
          <td class="num">${index + 1}</td>
          <td class="num"><b>${row.sales}</b></td>
          <td>${escapeHtml(row.itemId)}</td>
          <td>${escapeHtml(row.title)}</td>
          <td>
            <a href="${escapeHtml(row.url)}"
               target="_blank"
               rel="noopener noreferrer">Apri</a>
          </td>
        </tr>
      `)
      .join("");
  }

  function createHiddenFrame() {
    document.getElementById(FRAME_ID)?.remove();

    const frame = document.createElement("iframe");
    frame.id = FRAME_ID;

    Object.assign(frame.style, {
      position: "fixed",
      left: "-12000px",
      top: "0",
      width: "1500px",
      height: "1200px",
      opacity: "0.01",
      pointerEvents: "none",
      zIndex: "-1"
    });

    document.body.appendChild(frame);
    return frame;
  }

  function loadFrame(frame, url) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error("Timeout caricamento pagina feedback.")),
        CONFIG.LOAD_TIMEOUT_MS
      );

      frame.addEventListener(
        "load",
        () => {
          clearTimeout(timer);
          resolve();
        },
        { once: true }
      );

      frame.src = url;
    });
  }

  async function waitForDocument(frame) {
    const startedAt = Date.now();

    while (
      Date.now() - startedAt <
      CONFIG.LOAD_TIMEOUT_MS
    ) {
      if (state.stopped) {
        throw new Error("Interrotto dall'utente.");
      }

      const doc = frame.contentDocument;

      if (
        doc &&
        doc.readyState === "complete" &&
        doc.body
      ) {
        return doc;
      }

      await sleep(250);
    }

    throw new Error("Documento feedback non disponibile.");
  }

  function isBlocked(doc) {
    const text = normalize(doc.body?.innerText || "");

    return /pardon our interruption|verify you are human|robot check|captcha|security measure/.test(
      text
    );
  }

  function getFeedbackRows(doc) {
    return [
      ...doc.querySelectorAll(
        '#feedback-cards tbody tr[data-feedback-id]'
      )
    ];
  }

  function isPositiveFeedback(row) {
    return Boolean(
      row.querySelector(
        'svg[data-test-type="positive"], ' +
        'svg[aria-label*="Positive feedback"], ' +
        '[aria-label*="Positive feedback rating"]'
      )
    );
  }

  function isPastMonth(row) {
    const whenCell =
      row.querySelector("td:last-child") ||
      row;

    const ariaText = [
      ...whenCell.querySelectorAll("[aria-label]")
    ]
      .map(node => node.getAttribute("aria-label"))
      .join(" ");

    const text = normalize(
      `${ariaText} ${whenCell.innerText || whenCell.textContent || ""}`
    );

    return /\bpast month\b|\blast month\b|\b1 month\b|\bultimo mese\b|\b1 mese\b/.test(
      text
    );
  }

  function extractProductFromRow(row) {
    const itemContainer =
      row.querySelector(".card__item") ||
      row;

    const link =
      itemContainer.querySelector('a[href*="/itm/"]') ||
      row.querySelector('a[href*="/itm/"]');

    if (!link) {
      return null;
    }

    const itemId = extractItemId(link.href);

    if (!itemId) {
      return null;
    }

    let title = "";

    const itemText = clean(
      itemContainer.innerText ||
      itemContainer.textContent ||
      ""
    );

    if (itemText) {
      title = itemText
        .replace(/\s*\(#\s*\d{9,15}\s*\)\s*$/i, "")
        .replace(/\s*\(#\s*$/i, "")
        .trim();
    }

    if (!title) {
      title = clean(
        link.getAttribute("aria-label") ||
        link.getAttribute("title") ||
        link.innerText ||
        link.textContent
      );
    }

    if (!title) {
      title = `Item ${itemId}`;
    }

    return {
      itemId,
      title,
      url: canonicalItemUrl(itemId)
    };
  }

  function processCurrentPage(doc) {
    const rows = getFeedbackRows(doc);

    let newFeedbacks = 0;
    let accepted = 0;

    for (const row of rows) {
      const feedbackId =
        clean(row.getAttribute("data-feedback-id"));

      if (!feedbackId) {
        state.skippedRows++;
        continue;
      }

      if (state.seenFeedbackIds.has(feedbackId)) {
        continue;
      }

      state.seenFeedbackIds.add(feedbackId);
      state.feedbacksRead++;
      newFeedbacks++;

      // Doppio controllo di sicurezza anche se la pagina è già filtrata.
      if (!isPositiveFeedback(row) || !isPastMonth(row)) {
        state.skippedRows++;
        continue;
      }

      const product = extractProductFromRow(row);

      if (!product) {
        state.skippedRows++;
        continue;
      }

      state.positiveLastMonthRead++;
      accepted++;

      if (!state.products.has(product.itemId)) {
        state.products.set(product.itemId, {
          ...product,
          sales: 0
        });
      }

      // Ogni feedback distinto dello stesso Item ID vale +1 vendita stimata.
      state.products.get(product.itemId).sales += 1;
    }

    return {
      rowCount: rows.length,
      newFeedbacks,
      accepted
    };
  }

  function pageSignature(doc) {
    return getFeedbackRows(doc)
      .slice(0, 10)
      .map(row =>
        clean(row.getAttribute("data-feedback-id"))
      )
      .filter(Boolean)
      .join("|");
  }

  function findNextButton(doc) {
    const candidates = [
      ...doc.querySelectorAll("button, a")
    ];

    return (
      candidates.find(element => {
        const label = normalize(
          element.getAttribute("aria-label") ||
          element.getAttribute("title") ||
          element.innerText ||
          element.textContent
        );

        const disabled =
          element.disabled ||
          element.getAttribute("aria-disabled") === "true" ||
          element.classList.contains("disabled");

        return (
          !disabled &&
          /^(next|next page|pagina successiva|successiva|avanti)$/.test(label)
        );
      }) || null
    );
  }

  async function waitForPageChange(
    doc,
    previousSignature
  ) {
    const startedAt = Date.now();

    while (
      Date.now() - startedAt <
      CONFIG.PAGE_CHANGE_TIMEOUT_MS
    ) {
      if (state.stopped) {
        throw new Error("Interrotto dall'utente.");
      }

      await sleep(300);

      const currentSignature =
        pageSignature(doc);

      if (
        currentSignature &&
        currentSignature !== previousSignature
      ) {
        await sleep(CONFIG.PAGE_SETTLE_MS);
        return true;
      }
    }

    return false;
  }

  function csvCell(value, allowFormula = false) {
    let text = String(value ?? "");

    if (
      !allowFormula &&
      /^[=+\-@]/.test(text)
    ) {
      text = `'${text}`;
    }

    return `"${text.replace(/"/g, '""')}"`;
  }

  function itemIdForExcel(itemId) {
    return `="${String(itemId).replace(/"/g, "")}"`;
  }

  function downloadCsv() {
    const products = getProductRows();

    if (!products.length) {
      alert("Nessun prodotto da scaricare.");
      return;
    }

    const headers = [
      "Rank",
      "Estimated Sales from Positive Feedback - Last Month",
      "Item ID",
      "Product Title",
      "Product URL"
    ];

    const csv = [
      headers.map(h => csvCell(h)).join(";"),

      ...products.map((row, index) =>
        [
          csvCell(index + 1),
          csvCell(row.sales),
          csvCell(itemIdForExcel(row.itemId), true),
          csvCell(row.title),
          csvCell(row.url)
        ].join(";")
      )
    ].join("\r\n");

    const blob = new Blob(
      ["\uFEFFsep=;\r\n" + csv],
      { type: "text/csv;charset=utf-8" }
    );

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    const safeSeller = state.seller.replace(
      /[^\w.-]+/g,
      "_"
    );

    anchor.href = url;
    anchor.download =
      `ebay_${safeSeller}_best_sellers_feedback_ultimo_mese.csv`;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    setTimeout(
      () => URL.revokeObjectURL(url),
      3000
    );

    log(
      `CSV scaricato: ${products.length} prodotti unici.`
    );
  }

  $("#peppe-download").addEventListener(
    "click",
    downloadCsv
  );

  $("#peppe-stop").addEventListener(
    "click",
    () => {
      state.stopped = true;
      $("#peppe-stop").disabled = true;

      setStatus(
        "Interruzione richiesta. Puoi scaricare i dati già raccolti."
      );

      log("Interruzione richiesta dall'utente.");
    }
  );

  $("#peppe-close").addEventListener(
    "click",
    () => {
      state.stopped = true;
      document.getElementById(FRAME_ID)?.remove();
      panel.remove();
      document.getElementById(STYLE_ID)?.remove();
    }
  );

  async function run() {
    if (!isFeedbackPage()) {
      setStatus(
        "ERRORE: apri prima una pagina eBay Feedback Profile."
      );

      log(
        "La pagina corrente non è /fdbk/feedback_profile/..."
      );

      return;
    }

    const filters =
      currentFiltersLookCorrect(document);

    if (!filters.ratingOk || !filters.periodOk) {
      setStatus(
        "Filtri non corretti. Imposta Rating = Positive e Period = 1 Month, poi rilancia."
      );

      log(
        `Filtro rating rilevato: "${filters.ratingText || "non rilevato"}".`
      );

      log(
        `Filtro periodo rilevato: "${filters.periodText || "non rilevato"}".`
      );

      return;
    }

    setStatus(
      "Avvio. Lo script leggerà automaticamente tutte le pagine."
    );

    setProgress(3);

    log(
      `Venditore: ${state.seller}. Filtri verificati: Positive / 1 Month.`
    );

    const frame = createHiddenFrame();

    try {
      // Il frame usa esattamente la pagina già filtrata dall'utente.
      await loadFrame(frame, location.href);
      const doc = await waitForDocument(frame);

      if (isBlocked(doc)) {
        throw new Error(
          "eBay ha mostrato CAPTCHA/verifica."
        );
      }

      await sleep(CONFIG.PAGE_SETTLE_MS);

      for (
        let page = 1;
        page <= CONFIG.MAX_PAGES;
        page++
      ) {
        if (state.stopped) {
          break;
        }

        state.pagesRead = page;

        setStatus(
          `Lettura pagina ${page}... ` +
          `${state.positiveLastMonthRead} feedback validi trovati.`
        );

        const result =
          processCurrentPage(doc);

        log(
          `Pagina ${page}: ${result.rowCount} righe, ` +
          `${result.newFeedbacks} feedback nuovi, ` +
          `${result.accepted} positivi ultimo mese accettati.`
        );

        updatePanel();

        setProgress(
          Math.min(95, 5 + page * 3)
        );

        const nextButton =
          findNextButton(doc);

        if (!nextButton) {
          log(
            "Pulsante Next page non presente: ultima pagina raggiunta."
          );
          break;
        }

        const beforeSignature =
          pageSignature(doc);

        if (!beforeSignature) {
          log(
            "Impossibile creare la firma della pagina corrente. Fine."
          );
          break;
        }

        log(
          "Passaggio automatico alla pagina successiva..."
        );

        nextButton.click();

        const changed =
          await waitForPageChange(
            doc,
            beforeSignature
          );

        if (!changed) {
          log(
            "La pagina non è cambiata dopo Next: considero conclusa la paginazione."
          );
          break;
        }

        await sleep(
          CONFIG.BETWEEN_PAGES_MS
        );
      }

      updatePanel();

      if (
        state.positiveLastMonthRead > 0
      ) {
        setProgress(100);

        setStatus(
          `Completato: ${state.pagesRead} pagine, ` +
          `${state.positiveLastMonthRead} feedback positivi dell’ultimo mese, ` +
          `${state.products.size} prodotti unici.`
        );

        log(
          "Analisi completata. I prodotti sono ordinati dal più venduto."
        );
      } else {
        setProgress(0);

        setStatus(
          "Completato, ma non sono stati trovati feedback positivi dell’ultimo mese."
        );
      }

      window.__PEPPE_EBAY_FEEDBACK_BEST_SELLERS__ = {
        seller: state.seller,
        pagesRead: state.pagesRead,
        feedbacksRead: state.feedbacksRead,
        positiveLastMonthRead:
          state.positiveLastMonthRead,
        products: getProductRows()
      };
    } catch (error) {
      console.error(
        "[eBay Feedback Best Sellers]",
        error
      );

      setStatus(
        `Interrotto: ${error.message}. ` +
        "Puoi scaricare gli eventuali dati già raccolti."
      );

      log(
        `ERRORE: ${error.message}`
      );

      updatePanel();
    } finally {
      $("#peppe-stop").disabled = true;
      frame.remove();
    }
  }

  updatePanel();
  run();
})();
