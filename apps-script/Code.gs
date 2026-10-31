/**
 * HW Error Book — Google Apps Script Web App
 *
 * Sheet tab: ErrorLog
 * Columns: timestamp, class, student_id, student_name, homework_id,
 *          wrong_ids, wrong_types, lang, source
 *
 * Deploy: Deploy → New deployment → Web app
 *   Execute as: Me
 *   Who has access: Anyone
 * Then paste the /exec URL into web/config.js → webAppUrl
 */

var SHEET_NAME = 'ErrorLog';
var HEADERS = [
  'timestamp',
  'class',
  'student_id',
  'student_name',
  'homework_id',
  'wrong_ids',
  'wrong_types',
  'lang',
  'source'
];

function doGet(e) {
  return json_({
    ok: true,
    service: 'hw-error-book',
    sheet: SHEET_NAME,
    message: 'POST JSON to append one aggregated error row.'
  });
}

function doPost(e) {
  try {
    var raw = '';
    if (e && e.postData && e.postData.contents) {
      raw = e.postData.contents;
    } else if (e && e.parameter && e.parameter.payload) {
      raw = e.parameter.payload;
    }
    if (!raw) {
      return json_({ ok: false, error: 'empty body' }, 400);
    }
    var data = JSON.parse(raw);
    var row = normalize_(data);
    if (!row.student_id) {
      return json_({ ok: false, error: 'student_id required' }, 400);
    }
    if (!row.wrong_ids) {
      return json_({ ok: false, error: 'wrong_ids required' }, 400);
    }
    var sheet = ensureSheet_();
    sheet.appendRow([
      row.timestamp,
      row.class,
      row.student_id,
      row.student_name,
      row.homework_id,
      row.wrong_ids,
      row.wrong_types,
      row.lang,
      row.source
    ]);
    var last = sheet.getLastRow();
    return json_({
      ok: true,
      row: last,
      student_id: row.student_id,
      wrong_ids: row.wrong_ids
    });
  } catch (err) {
    return json_({ ok: false, error: String(err) }, 500);
  }
}

function normalize_(data) {
  data = data || {};
  var wrongIds = data.wrong_ids;
  if (Array.isArray(wrongIds)) {
    wrongIds = wrongIds.join(';');
  }
  var wrongTypes = data.wrong_types;
  if (Array.isArray(wrongTypes)) {
    wrongTypes = wrongTypes.join(';');
  }
  return {
    timestamp: new Date().toISOString(),
    class: str_(data.class || data.class_name || ''),
    student_id: str_(data.student_id || ''),
    student_name: str_(data.student_name || ''),
    homework_id: str_(data.homework_id || ''),
    wrong_ids: str_(wrongIds || ''),
    wrong_types: str_(wrongTypes || ''),
    lang: str_(data.lang || 'zh'),
    source: str_(data.source || 'web')
  };
}

function str_(v) {
  return String(v == null ? '' : v).trim();
}

function ensureSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error('No active spreadsheet. Bind this script to a Google Sheet.');
  }
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  } else {
    var first = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
    var missing = !first || String(first[0]).toLowerCase() !== 'timestamp';
    if (missing) {
      sheet.insertRowBefore(1);
      sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
      sheet.setFrozenRows(1);
    }
  }
  return sheet;
}

function json_(obj, _statusUnused) {
  // Apps Script ContentService does not set HTTP status reliably for Web Apps;
  // clients should check body.ok.
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Manual smoke test in the Apps Script editor:
 *   testAppendSample();
 */
function testAppendSample() {
  var fake = {
    postData: {
      contents: JSON.stringify({
        class: '2A',
        student_id: 'S001',
        student_name: '陳大文',
        homework_id: 'demo_ws1',
        wrong_ids: 'HW-F2-INEQ-BASIC-Q01;HW-F2-INEQ-BASIC-Q03',
        wrong_types: '一元不等式-基本',
        lang: 'zh',
        source: 'testAppendSample'
      })
    }
  };
  var out = doPost(fake);
  Logger.log(out.getContent());
}
