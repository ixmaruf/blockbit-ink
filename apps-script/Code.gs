/**
 * Blockbit Ink — Whitelist collector (Google Apps Script)
 *
 * Setup:
 *   1. Open https://sheets.google.com → create a new blank sheet.
 *   2. Rename "Sheet1" to "Submissions" (or update SHEET_NAME below).
 *   3. From the Sheet: Extensions → Apps Script.
 *   4. Delete the default `function myFunction(){}` and paste this whole file.
 *   5. (Optional) Run `setupSheet()` once to auto-create the header row.
 *   6. Click "Deploy" → "New deployment":
 *        - Type: Web app
 *        - Execute as: Me
 *        - Who has access: Anyone   (or "Anyone with Google account" for soft spam protection)
 *      Click "Deploy" and copy the Web App URL.
 *   7. In your project's `whitelist-config.js` (copy from `whitelist-config.example.js`),
 *      paste the URL into `window.BLOCKBIT_CONFIG.sheetEndpoint`.
 *
 * Verification:
 *   - The web app URL must end with `/exec`.
 *   - Anyone with that URL can POST. Rate limiting is enforced in this script.
 *   - To rotate the URL: Deploy → Manage deployments → pencil icon → New version.
 */

/** Sheet name inside the bound spreadsheet. */
const SHEET_NAME = 'Submissions';

/** Settings sheet name for dynamic config (post link, timer, whitelist state). */
const SETTINGS_SHEET = 'Settings';

/** Default settings used when Settings sheet is missing or incomplete. */
const DEFAULT_SETTINGS = {
  postUrl: 'https://x.com/BlockbitInk',
  timerStart: Utilities.formatDate(new Date(), 'Asia/Dhaka', 'yyyy-MM-dd HH:mm'),
  timerDuration: '48',
  whitelistOpen: 'true'
};

/** Header row written by setupSheet(). Order MUST match the column order in appendRow(). */
const HEADERS = [
  'Timestamp',
  'Twitter Handle',
  'Wallet Address',
  'Serial',
  'User Agent',
  'IP Hint'
];

/** Minimum milliseconds between two successful submissions from the same wallet address. */
const MIN_INTERVAL_MS = 30 * 1000;

/** Hard cap on submissions per wallet across the lifetime of the sheet. */
const MAX_PER_WALLET = 1;

/**
 * Strict EVM address validator (same shape as client-side check).
 * Accepts both lowercase and checksummed 0x…40-hex addresses.
 */
function isValidEvmAddress(addr) {
  return typeof addr === 'string' && /^0x[a-fA-F0-9]{40}$/.test(addr.trim());
}

function isValidTwitterHandle(handle) {
  if (typeof handle !== 'string') return false;
  const v = handle.replace(/^@/, '').trim();
  return /^[A-Za-z0-9_]{1,15}$/.test(v);
}

function isValidSerial(serial) {
  return typeof serial === 'string' && /^BBI-\d{4}-[0-9A-F]{6}$/.test(serial);
}

/** Health check or settings endpoint. Usage: ?action=settings */
function doGet(e) {
  if (e && e.parameter && e.parameter.action === 'settings') {
    const settings = getSettings_();
    return jsonResponse_({
      ok: true,
      settings: settings
    });
  }
  return jsonResponse_({
    ok: true,
    service: 'Blockbit Ink Whitelist API',
    version: 3,
    timestamp: new Date().toISOString()
  });
}

/** Read settings from the Settings sheet. */
function getSettings_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SETTINGS_SHEET);
  if (!sheet) {
    setupSettingsSheet();
    sheet = ss.getSheetByName(SETTINGS_SHEET);
  }
  const last = sheet.getLastRow();
  if (last < 2) return DEFAULT_SETTINGS;
  const settings = {};
  const values = sheet.getRange(2, 1, last - 1, 2).getValues();
  for (const row of values) {
    if (row[0]) {
      // If it's a date object, format it to YYYY-MM-DD
      if (row[0] === 'timerStartDate' && row[1] instanceof Date) {
        settings[row[0]] = Utilities.formatDate(row[1], 'Asia/Dhaka', 'yyyy-MM-dd');
      } else {
        settings[row[0]] = String(row[1]);
      }
    }
  }

  const finalSettings = Object.assign({}, DEFAULT_SETTINGS, settings);
  
  // Assemble timerStart if separated fields exist
  if (finalSettings.timerStartDate && finalSettings.timerStartHour && finalSettings.timerStartMinute && finalSettings.timerStartAMPM) {
    let hh = parseInt(finalSettings.timerStartHour, 10);
    if (finalSettings.timerStartAMPM === 'PM' && hh < 12) hh += 12;
    if (finalSettings.timerStartAMPM === 'AM' && hh === 12) hh = 0;
    
    let hhStr = hh < 10 ? '0' + hh : String(hh);
    let mmStr = finalSettings.timerStartMinute;
    
    finalSettings.timerStart = finalSettings.timerStartDate + ' ' + hhStr + ':' + mmStr;
  }
  
  return finalSettings;
}

/** Run once to create Settings sheet with default values and Data Validations. */
function setupSettingsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SETTINGS_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(SETTINGS_SHEET);
  } else {
    // Clear everything to apply the new format
    sheet.clear();
  }
  
  // Header row
  sheet.appendRow(['Key', 'Value', 'Instructions']);
  sheet.getRange(1, 1, 1, 3).setFontWeight('bold').setBackground('#7C3AED').setFontColor('#FFFFFF');
  
  // Helper for Data Validation
  const addDropdown = (row, options) => {
    const rule = SpreadsheetApp.newDataValidation().requireValueInList(options, true).build();
    sheet.getRange(row, 2).setDataValidation(rule);
  };
  const addDateValidation = (row) => {
    const rule = SpreadsheetApp.newDataValidation().requireDate().build();
    sheet.getRange(row, 2).setDataValidation(rule);
    sheet.getRange(row, 2).setNumberFormat('yyyy-MM-dd');
  };

  // Settings rows
  const now = new Date();
  
  // row 2
  sheet.appendRow(['postUrl', 'https://x.com/BlockbitInk', 'Tweet URL for Like/Repost/Quote']);
  // row 3
  sheet.appendRow(['whitelistOpen', 'On', 'Status of Whitelist (On or Off)']);
  addDropdown(3, ['On', 'Off']);
  // row 4
  sheet.appendRow(['timerStartDate', now, 'Double-click to open Date Picker calendar']);
  addDateValidation(4);
  // row 5
  sheet.appendRow(['timerStartHour', '12', 'Hour (1 to 12)']);
  addDropdown(5, ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']);
  // row 6
  sheet.appendRow(['timerStartMinute', '00', 'Minute']);
  addDropdown(6, ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']);
  // row 7
  sheet.appendRow(['timerStartAMPM', 'AM', 'AM or PM']);
  addDropdown(7, ['AM', 'PM']);
  // row 8
  sheet.appendRow(['timerDuration', '48', 'Duration in hours (e.g. 24, 35, 48, 72)']);
  addDropdown(8, ['12', '24', '35', '48', '72', '96', '120', '144', '168']);

  sheet.setColumnWidth(1, 140);
  sheet.setColumnWidth(2, 300);
  sheet.setColumnWidth(3, 420);
  
  // Style instruction column
  sheet.getRange(2, 3, 7, 1).setFontColor('#666666').setFontStyle('italic');
  
  return 'Settings sheet ready with Dropdowns. Edit the Value column to control whitelist.';
}

/** Run once after pasting this code to create the header row automatically. */
function setupSheet() {
  const sheet = getOrCreateSheet_();
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length)
      .setFontWeight('bold')
      .setBackground('#7C3AED')
      .setFontColor('#FFFFFF')
      .setHorizontalAlignment('center');
    sheet.setFrozenRows(1);
    // Reasonable default column widths
    sheet.setColumnWidth(1, 180); // Timestamp
    sheet.setColumnWidth(2, 160); // Twitter Handle
    sheet.setColumnWidth(3, 360); // Wallet Address
    sheet.setColumnWidth(4, 180); // Serial
    sheet.setColumnWidth(5, 280); // User Agent
    sheet.setColumnWidth(6, 120); // IP Hint
  }
  return 'Sheet ready. Headers written: ' + sheet.getName();
}

function getOrCreateSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  return sheet;
}

/** Map columns → objects keyed by header name. */
function rowToObject_(row) {
  if (!row || row.length === 0) return null;
  const obj = {};
  for (let i = 0; i < HEADERS.length; i++) {
    obj[HEADERS[i]] = row[i] || '';
  }
  return obj;
}

/**
 * Look up the most recent submission row for a wallet (case-insensitive).
 * Returns the row object or null.
 */
function findLatestByWallet_(wallet) {
  const sheet = getOrCreateSheet_();
  const last = sheet.getLastRow();
  if (last < 2) return null;
  const walletNorm = wallet.toLowerCase();
  // Scan top-to-bottom in reverse to find the latest match.
  for (let r = last; r >= 2; r--) {
    const walletCell = String(sheet.getRange(r, 3).getValue() || '').toLowerCase();
    if (walletCell === walletNorm) {
      return {
        rowNumber: r,
        data: rowToObject_(sheet.getRange(r, 1, 1, HEADERS.length).getValues()[0])
      };
    }
  }
  return null;
}

/** Build a JSON response that supports CORS preflight for any origin. */
function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * doPost — main endpoint hit by whitelist.js on step 4 submission.
 * Expected body: { twitter, wallet, serial }
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) {
    return jsonResponse_({ ok: false, error: 'Server is busy, please retry.' });
  }

  try {
    let payload;
    try {
      payload = JSON.parse(e.postData && e.postData.contents ? e.postData.contents : '{}');
    } catch (_) {
      return jsonResponse_({ ok: false, error: 'Invalid JSON body.' });
    }

    const twitter = String(payload.twitter || '').replace(/^@/, '').trim();
    const wallet = String(payload.wallet || '').trim();
    const serial = String(payload.serial || '').trim();
    const userAgent = String(payload.userAgent || e?.parameters?.userAgent || '').slice(0, 240);

    // Validate
    if (!isValidTwitterHandle(twitter)) {
      return jsonResponse_({ ok: false, error: 'Invalid Twitter handle.' });
    }
    if (!isValidEvmAddress(wallet)) {
      return jsonResponse_({ ok: false, error: 'Invalid wallet address.' });
    }
    if (!isValidSerial(serial)) {
      return jsonResponse_({ ok: false, error: 'Invalid serial.' });
    }

    // Duplicate / rate-limit check
    const existing = findLatestByWallet_(wallet);
    if (existing) {
        const count = countByWallet_(wallet);
        if (count >= MAX_PER_WALLET) {
          return jsonResponse_({
            ok: false,
            error: 'This wallet has already been registered.',
            alreadyRegistered: true
          });
        }
        const lastTs = new Date(existing.data.Timestamp).getTime();
        if (Date.now() - lastTs < MIN_INTERVAL_MS) {
          return jsonResponse_({
            ok: false,
            error: 'Please wait a moment before resubmitting.'
          });
        }
      }

    // Append the row
    const sheet = getOrCreateSheet_();
    sheet.appendRow([
      new Date(),
      '@' + twitter,
      wallet,
      serial,
      userAgent,
      // Apps Script cannot directly read the client IP from a Web App POST,
      // so we just leave a hint placeholder. Real IPs require a proxy.
      payload.ipHint || ''
    ]);

    return jsonResponse_({
      ok: true,
      message: 'Whitelist submission recorded.',
      serial: serial
    });
  } catch (err) {
    return jsonResponse_({ ok: false, error: 'Server error: ' + err.message });
  } finally {
    lock.releaseLock();
  }
}

/** Count total submissions for a wallet (case-insensitive). */
function countByWallet_(wallet) {
  const sheet = getOrCreateSheet_();
  const last = sheet.getLastRow();
  if (last < 2) return 0;
  const walletNorm = wallet.toLowerCase();
  const values = sheet.getRange(2, 3, last - 1, 1).getValues();
  let count = 0;
  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0] || '').toLowerCase() === walletNorm) count++;
  }
  return count;
}

/**
 * Handle CORS preflight. Apps Script Web Apps respond to OPTIONS automatically
 * only when ContentService is used, but exposing doOptions keeps things explicit.
 */
function doOptions() {
  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT);
}

/** Convenience: list all submissions as JSON for an admin tool (keep this URL private). */
function adminList() {
  const sheet = getOrCreateSheet_();
  const last = sheet.getLastRow();
  if (last < 2) return [];
  return sheet.getRange(2, 1, last - 1, HEADERS.length).getValues().map(rowToObject_);
}