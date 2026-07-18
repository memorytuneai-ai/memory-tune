/**
 * Memory Tune sales tracker for a fresh Google Sheet.
 *
 * How to use:
 * 1. Create a new Google Sheet.
 * 2. Open Extensions > Apps Script.
 * 3. Replace the default code with this file.
 * 4. Update CONFIG.secret with the same value used in GOOGLE_SHEETS_WEBHOOK_SECRET.
 * 5. Deploy as a Web App with access set to "Anyone with the link".
 * 6. Put the deployed URL into GOOGLE_SHEETS_WEBHOOK_URL.
 */

const CONFIG = {
  secret: 'memorytune-sales-2026',
  sheets: {
    orders: "Pedidos",
    paid: "Pagos",
    pending: "Pendentes",
    summary: "Resumo",
  },
};

const HEADERS = [
  "session_id",
  "status",
  "mes_ano_pedido",
  "value_gbp",
  "value_number",
  "client_name",
  "customer_phone",
  "customer_email",
  "occasion",
  "style",
  "voice_gender",
  "customer_key",
  "payment_id",
  "payment_status",
  "created_at",
  "paid_at",
  "updated_at",
  "expires_at",
  "download_url_1",
  "download_url_2",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "gclid",
  "fbclid",
  "landing_page",
  "traffic_captured_at",
  "last_synced_at",
];

const HEADER_LABELS = {
  session_id: "ID da sessao",
  status: "Status",
  mes_ano_pedido: "Mes/Ano do pedido",
  value_gbp: "Valor (GBP)",
  value_number: "Valor numerico",
  client_name: "Nome de quem fez o pedido",
  customer_phone: "Telefone",
  customer_email: "Email",
  occasion: "Ocasião",
  style: "Estilo",
  voice_gender: "Voz",
  customer_key: "Chave do cliente",
  payment_id: "ID do pagamento",
  payment_status: "Status do pagamento",
  created_at: "Criado em",
  paid_at: "Pago em",
  updated_at: "Atualizado em",
  expires_at: "Expira em",
  download_url_1: "Link de download 1",
  download_url_2: "Link de download 2",
  utm_source: "UTM source",
  utm_medium: "UTM medium",
  utm_campaign: "UTM campaign",
  utm_content: "UTM content",
  utm_term: "UTM term",
  gclid: "GCLID",
  fbclid: "FBCLID",
  landing_page: "Pagina de entrada",
  traffic_captured_at: "Trafego capturado em",
  last_synced_at: "Ultima sincronizacao",
};

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, message: "Memory Tune sales tracker is running." }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ ok: false, error: "Missing request body." });
    }

    const payload = JSON.parse(e.postData.contents);
    if (payload.secret !== CONFIG.secret) {
      return jsonResponse({ ok: false, error: "Invalid secret." });
    }

    const order = normalizeOrder(payload.order || {});
    if (!order.session_id) {
      return jsonResponse({ ok: false, error: "session_id is required." });
    }

    ensureWorkbookStructure_();
    upsertOrderRow_(order);
    syncFilteredSheets_();
    syncSummarySheet_();

    return jsonResponse({ ok: true, session_id: order.session_id });
  } catch (error) {
    return jsonResponse({ ok: false, error: error.message || "Unexpected error." });
  }
}

function ensureWorkbookStructure_() {
  const ordersSheet = getOrCreateSheet_(CONFIG.sheets.orders);
  ensureHeaders_(ordersSheet, HEADERS);

  const paidSheet = getOrCreateSheet_(CONFIG.sheets.paid);
  ensureHeaders_(paidSheet, HEADERS);

  const pendingSheet = getOrCreateSheet_(CONFIG.sheets.pending);
  ensureHeaders_(pendingSheet, HEADERS);

  const summarySheet = getOrCreateSheet_(CONFIG.sheets.summary);
  setupSummarySheet_(summarySheet);
}

function normalizeOrder(order) {
  const normalizedStatus = normalizeStatus_(order.status, order.payment_status);
  const createdAt = stringValue_(order.created_at);
  const paidAt = stringValue_(order.paid_at);
  return {
    session_id: stringValue_(order.session_id),
    status: normalizedStatus,
    mes_ano_pedido: formatOrderMonthYear_(createdAt || paidAt),
    value_gbp: stringValue_(order.valor),
    value_number: numberValue_(order.valor_numero),
    client_name: stringValue_(order.client_name),
    customer_phone: stringValue_(order.customer_phone),
    customer_email: stringValue_(order.customer_email),
    occasion: stringValue_(order.occasion),
    style: stringValue_(order.style),
    voice_gender: normalizeVoice_(order.voice_gender),
    customer_key: stringValue_(order.customer_key),
    payment_id: stringValue_(order.payment_id),
    payment_status: normalizePaymentStatus_(order.payment_status),
    created_at: createdAt,
    paid_at: paidAt,
    updated_at: stringValue_(order.updated_at),
    expires_at: stringValue_(order.expires_at),
    download_url_1: stringValue_(order.download_url_1),
    download_url_2: stringValue_(order.download_url_2),
    utm_source: stringValue_(order.utm_source),
    utm_medium: stringValue_(order.utm_medium),
    utm_campaign: stringValue_(order.utm_campaign),
    utm_content: stringValue_(order.utm_content),
    utm_term: stringValue_(order.utm_term),
    gclid: stringValue_(order.gclid),
    fbclid: stringValue_(order.fbclid),
    landing_page: stringValue_(order.landing_page),
    traffic_captured_at: stringValue_(order.traffic_captured_at),
    last_synced_at: new Date(),
  };
}

function upsertOrderRow_(order) {
  const sheet = getOrCreateSheet_(CONFIG.sheets.orders);
  const sessionColumn = 1;
  const lastRow = Math.max(sheet.getLastRow(), 1);
  const sessionValues = lastRow > 1
    ? sheet.getRange(2, sessionColumn, lastRow - 1, 1).getValues().flat()
    : [];

  const rowIndex = sessionValues.findIndex((value) => String(value).trim() === order.session_id);
  const rowValues = HEADERS.map((header) => formatCellValue_(order[header]));

  if (rowIndex >= 0) {
    sheet.getRange(rowIndex + 2, 1, 1, HEADERS.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }

  formatOrdersSheet_(sheet);
}

function syncFilteredSheets_() {
  const orders = getOrdersData_();
  writeSheetData_(CONFIG.sheets.paid, orders.filter((order) => order.status === "paid"));
  writeSheetData_(CONFIG.sheets.pending, orders.filter((order) => order.status === "pending"));
}

function syncSummarySheet_() {
  const sheet = getOrCreateSheet_(CONFIG.sheets.summary);
  const orders = getOrdersData_();
  const paid = orders.filter((order) => order.status === "paid");
  const pending = orders.filter((order) => order.status === "pending");

  const paidRevenue = paid.reduce((sum, row) => sum + numberValue_(row.value_number), 0);
  const pendingRevenue = pending.reduce((sum, row) => sum + numberValue_(row.value_number), 0);

  sheet.clear();
  sheet.getRange("A1").setValue("Resumo de vendas Memory Tune");
  sheet.getRange("A3:B8").setValues([
    ["Pedidos pagos", paid.length],
    ["Pedidos pendentes", pending.length],
    ["Total de pedidos", orders.length],
    ["Receita paga (GBP)", paidRevenue],
    ["Receita pendente (GBP)", pendingRevenue],
    ["Ultima sincronizacao", new Date()],
  ]);

  sheet.getRange("A1").setFontSize(16).setFontWeight("bold");
  sheet.getRange("A3:A8").setFontWeight("bold");
  sheet.autoResizeColumns(1, 2);
}

function getOrdersData_() {
  const sheet = getOrCreateSheet_(CONFIG.sheets.orders);
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];

  const values = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();
  return values.map((row) => {
    const entry = {};
    HEADERS.forEach((header, index) => {
      entry[header] = row[index];
    });
    return entry;
  });
}

function writeSheetData_(sheetName, rows) {
  const sheet = getOrCreateSheet_(sheetName);
  sheet.clear();
  ensureHeaders_(sheet, HEADERS);

  if (!rows.length) {
    formatOrdersSheet_(sheet);
    return;
  }

  const values = rows.map((row) => HEADERS.map((header) => formatCellValue_(row[header])));
  sheet.getRange(2, 1, values.length, HEADERS.length).setValues(values);
  formatOrdersSheet_(sheet);
}

function ensureHeaders_(sheet, headers) {
  const labels = headers.map((header) => HEADER_LABELS[header] || header);
  const currentHeaders = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const matches = labels.every((header, index) => currentHeaders[index] === header);
  if (!matches) {
    sheet.getRange(1, 1, 1, headers.length).setValues([labels]);
  }

  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight("bold")
    .setBackground("#121212")
    .setFontColor("#FFFFFF");
}

function setupSummarySheet_(sheet) {
  sheet.clear();
  sheet.getRange("A1").setValue("Resumo de vendas Memory Tune");
  sheet.getRange("A1").setFontSize(16).setFontWeight("bold");
  sheet.autoResizeColumns(1, 2);
}

function formatOrdersSheet_(sheet) {
  const lastColumn = HEADERS.length;
  sheet.autoResizeColumns(1, lastColumn);
  if (sheet.getLastRow() > 1) {
    const range = sheet.getRange(2, 1, sheet.getLastRow() - 1, lastColumn);
    range.setVerticalAlignment("middle");
  }
}

function getOrCreateSheet_(name) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  return spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name);
}

function normalizeStatus_(status, paymentStatus) {
  const base = String(status || "").trim().toLowerCase();
  const pay = String(paymentStatus || "").trim().toLowerCase();
  if (["paid", "pago", "approved", "completed"].includes(base) || ["approved", "completed"].includes(pay)) {
    return "paid";
  }
  return "pending";
}

function normalizePaymentStatus_(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return "";
  if (normalized === "approved" || normalized === "completed") return "approved";
  return normalized;
}

function normalizeVoice_(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (["male", "masculina", "masculine", "man"].includes(normalized)) return "Male";
  if (["female", "feminina", "feminine", "woman"].includes(normalized)) return "Female";
  return String(value || "");
}

function stringValue_(value) {
  return value == null ? "" : String(value).trim();
}

function numberValue_(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCellValue_(value) {
  return value instanceof Date ? value : value == null ? "" : value;
}

function formatOrderMonthYear_(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return Utilities.formatDate(date, Session.getScriptTimeZone(), "MM/yyyy");
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

