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

/** Header row written by setupSheet(). Order MUST match the column order in appendRow(). */
const HEADERS = [
  'Timestamp',
  'Twitter Handle',
  'Wallet Address',
  'Clan',
  'Serial',
  'User Agent',
  'IP Hint'
];

/** Allowed clans — anything else is rejected. */
const ALLOWED_CLANS = ['Kaze', 'Honoo', 'Mizu', 'Tsuchi', 'Hikari', 'Kage'];

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

/** Simple health check — confirms the web app is live. */
function doGet() {
  return jsonResponse_({
    ok: true,
    service: 'Blockbit Ink Whitelist API',
    version: 2,
    timestamp: new Date().toISOString()
  });
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
    sheet.setColumnWidth(1, 180);
    sheet.setColumnWidth(2, 160);
    sheet.setColumnWidth(3, 360);
    sheet.setColumnWidth(4, 90);
    sheet.setColumnWidth(5, 180);
    sheet.setColumnWidth(6, 280);
    sheet.setColumnWidth(7, 120);
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
 * Expected body: { twitter, wallet, clan, serial }
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
    const clan = String(payload.clan || '').trim();
    const serial = String(payload.serial || '').trim();
    const userAgent = String(payload.userAgent || e?.parameters?.userAgent || '').slice(0, 240);

    // Validate
    if (!isValidTwitterHandle(twitter)) {
      return jsonResponse_({ ok: false, error: 'Invalid Twitter handle.' });
    }
    if (!isValidEvmAddress(wallet)) {
      return jsonResponse_({ ok: false, error: 'Invalid wallet address.' });
    }
    if (ALLOWED_CLANS.indexOf(clan) === -1) {
      return jsonResponse_({ ok: false, error: 'Invalid clan.' });
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
      clan,
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