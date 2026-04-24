// ============================================================
// Job Application Tracker — Google Apps Script Backend
// Paste this entire file into your Apps Script editor
// ============================================================

const SHEET_NAME = "Applications";
const HEADERS = [
  "ID", "Date", "Company", "Role", "Recruiter Email",
  "Location", "Portal", "Status", "Interview Date",
  "Salary Range", "Job Description", "Created At"
];

// ── Entry point for all requests ────────────────────────────
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    if (action === "add")    return respond(addRow(data.payload));
    if (action === "update") return respond(updateRow(data.payload));
    if (action === "delete") return respond(deleteRow(data.payload.id));
    if (action === "getAll") return respond(getAllRows());

    return respond({ error: "Unknown action: " + action });
  } catch (err) {
    return respond({ error: err.message });
  }
}

function doGet(e) {
  // Allow GET for getAll (easier debugging)
  return respond(getAllRows());
}

// ── Helpers ──────────────────────────────────────────────────
function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length)
      .setFontWeight("bold")
      .setBackground("#f3f3f3");
    sheet.setColumnWidth(1, 120);   // ID
    sheet.setColumnWidth(3, 160);   // Company
    sheet.setColumnWidth(4, 180);   // Role
    sheet.setColumnWidth(5, 200);   // Email
    sheet.setColumnWidth(11, 300);  // Job Description
  }
  return sheet;
}

function respond(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function rowToObj(row) {
  return {
    id:            row[0],
    date:          row[1],
    company:       row[2],
    role:          row[3],
    email:         row[4],
    location:      row[5],
    portal:        row[6],
    status:        row[7],
    interviewDate: row[8],
    salary:        row[9],
    jd:            row[10],
    createdAt:     row[11]
  };
}

// ── CRUD ─────────────────────────────────────────────────────
function addRow(payload) {
  const sheet = getSheet();
  const id = "app_" + Date.now();
  const now = new Date().toISOString();
  sheet.appendRow([
    id,
    payload.date          || "",
    payload.company       || "",
    payload.role          || "",
    payload.email         || "",
    payload.location      || "",
    payload.portal        || "",
    payload.status        || "Applied",
    payload.interviewDate || "",
    payload.salary        || "",
    payload.jd            || "",
    now
  ]);
  return { success: true, id };
}

function updateRow(payload) {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === payload.id) {
      const row = i + 1;
      sheet.getRange(row, 2).setValue(payload.date          || "");
      sheet.getRange(row, 3).setValue(payload.company       || "");
      sheet.getRange(row, 4).setValue(payload.role          || "");
      sheet.getRange(row, 5).setValue(payload.email         || "");
      sheet.getRange(row, 6).setValue(payload.location      || "");
      sheet.getRange(row, 7).setValue(payload.portal        || "");
      sheet.getRange(row, 8).setValue(payload.status        || "Applied");
      sheet.getRange(row, 9).setValue(payload.interviewDate || "");
      sheet.getRange(row, 10).setValue(payload.salary       || "");
      sheet.getRange(row, 11).setValue(payload.jd           || "");
      return { success: true };
    }
  }
  return { error: "Row not found: " + payload.id };
}

function deleteRow(id) {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { error: "Row not found: " + id };
}

function getAllRows() {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { apps: [] };
  const rows = data.slice(1).map(rowToObj).reverse(); // newest first
  return { apps: rows };
}
