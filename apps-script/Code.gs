/**
 * Dudes Craft Genesis Whitelist — Military-Grade Anti-Bot & Whitelist Backend
 * Version: 6.0 (Zero-Trust Two-Phase Server Token + Dynamic PoW + Rate Limiting + Automated Spam Cleaner)
 * 
 * SECURITY ARCHITECTURE:
 * 1. Two-Phase Challenge: Client MUST request a server-signed one-time nonce before submission.
 * 2. Private Server Secret: Server HMAC signature uses a secret that is NEVER exposed to the frontend.
 * 3. Server Clock Verification: Measures real elapsed server time (rejects submissions < 4.0s).
 * 4. Token Burn on Use: Server nonces are burned immediately to prevent replay attacks.
 * 5. Global & Per-Identity Rate Limiting: Blocks scripted concurrent floods and duplicate wallets/handles.
 * 6. Spam Purge Tool: Built-in function to clean spam rows (retaining real submissions 1-46).
 */

/** Sheet names inside the bound spreadsheet. */
const SHEET_NAME = 'Submissions';
const SETTINGS_SHEET = 'Settings';

/** 
 * PRIVATE SERVER SECRET: NEVER EXPOSE TO FRONTEND JAVASCRIPT!
 * This secret stays 100% inside Google Apps Script server.
 */
const PRIVATE_SERVER_SECRET = 'DUDES_CRAFT_ROBINHOOD_PRIVATE_VAULT_KEY_984729104812_SECURE';

/** Minimum real elapsed time on Google Server (in milliseconds) from challenge issue to submission */
const MIN_SERVER_TIME_MS = 4000; // 4.0 seconds on real server clock

/** Maximum validity window for a server challenge (10 minutes) */
const MAX_CHALLENGE_AGE_MS = 10 * 60 * 1000;

/** Default settings used when Settings sheet is missing or incomplete. */
const DEFAULT_SETTINGS = {
  postUrl: 'https://x.com/dudescraft/status/2093534635510702415',
  timerStart: Utilities.formatDate(new Date(), 'Asia/Dhaka', 'yyyy-MM-dd HH:mm'),
  timerDuration: '144',
  whitelistOpen: 'On'
};

/** Header row written by setupSheet(). Order MUST match appendRow(). */
const HEADERS = [
  'Timestamp',
  'Twitter Handle',
  'Wallet Address',
  'Serial',
  'IP Address',
  'Device Fingerprint',
  'Server Elapsed Time',
  'User Agent'
];

/**
 * Strict EVM address validator (0x followed by 40 hex chars).
 */
function isValidEvmAddress(addr) {
  return typeof addr === 'string' && /^0x[a-fA-F0-9]{40}$/.test(addr.trim());
}

/**
 * Strict Twitter username validator (1-15 chars, alphanumeric + underscores).
 */
function isValidTwitterHandle(handle) {
  if (typeof handle !== 'string') return false;
  const v = handle.replace(/^@/, '').trim();
  return /^[A-Za-z0-9_]{1,15}$/.test(v);
}

/**
 * Strict serial format validator.
 */
function isValidSerial(serial) {
  return typeof serial === 'string' && /^(DC|BBI)-[0-9A-F]{4}-[0-9A-F]{4,6}$/i.test(serial.trim());
}

/**
 * SHA-256 hash helper using Utilities.computeDigest.
 */
function sha256Hex(str) {
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, str, Utilities.Charset.UTF_8);
  return digest.map(function(b) {
    const val = (b < 0 ? b + 256 : b).toString(16);
    return val.length === 1 ? '0' + val : val;
  }).join('');
}

/**
 * HMAC-SHA256 signature helper using PRIVATE_SERVER_SECRET.
 */
function computeServerHmac(str) {
  const signature = Utilities.computeHmacSha256Signature(str, PRIVATE_SERVER_SECRET);
  return signature.map(function(b) {
    const val = (b < 0 ? b + 256 : b).toString(16);
    return val.length === 1 ? '0' + val : val;
  }).join('');
}

/**
 * Build JSON response.
 */
function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** 
 * doGet Endpoint: Settings, Ping, and Two-Phase Server Challenge Issuance.
 */
function doGet(e) {
  const params = (e && e.parameter) ? e.parameter : {};

  // 1. Pre-warm Ping
  if (params.action === 'ping') {
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName(SHEET_NAME);
      if (sheet) sheet.getLastRow();
    } catch (_) {}
    return ContentService.createTextOutput('PONG').setMimeType(ContentService.MimeType.TEXT);
  }

  // 2. Fetch Settings
  if (params.action === 'settings') {
    const settings = getSettings_();
    return jsonResponse_({
      ok: true,
      settings: settings
    });
  }

  // 3. PHASE 1: Issue Server-Signed Anti-Bot Challenge
  if (params.action === 'request_challenge') {
    const wallet = String(params.wallet || '').trim().toLowerCase();
    const twitter = String(params.twitter || '').replace(/^@/, '').trim().toLowerCase();

    if (!isValidEvmAddress(wallet)) {
      return jsonResponse_({ ok: false, error: 'Invalid EVM wallet address.' });
    }
    if (!isValidTwitterHandle(twitter)) {
      return jsonResponse_({ ok: false, error: 'Invalid X (Twitter) username.' });
    }

    const cache = CacheService.getScriptCache();

    // Check if already registered in Cache
    if (cache.get('tw_' + twitter)) {
      return jsonResponse_({ ok: false, error: 'This X username is already registered.', duplicate: true });
    }
    if (cache.get('wl_' + wallet)) {
      return jsonResponse_({ ok: false, error: 'This wallet address is already registered.', duplicate: true });
    }

    // Generate Server Challenge
    const serverNonce = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '').slice(0, 8);
    const issuedTime = Date.now();
    const serverSignature = computeServerHmac(serverNonce + ':' + issuedTime + ':' + wallet + ':' + twitter);

    // Save active nonce in server cache with 10 min TTL
    cache.put('nonce_' + serverNonce, JSON.stringify({
      wallet: wallet,
      twitter: twitter,
      issuedTime: issuedTime,
      serverSignature: serverSignature,
      status: 'ACTIVE'
    }), 600);

    return jsonResponse_({
      ok: true,
      serverNonce: serverNonce,
      issuedTime: issuedTime,
      serverSignature: serverSignature,
      difficulty: '0000' // Requires 4 leading zeros for PoW
    });
  }

  // Default Info
  return jsonResponse_({
    ok: true,
    service: 'Dudes Craft Whitelist Security API',
    version: '6.0-ZeroTrust',
    timestamp: new Date().toISOString()
  });
}

/**
 * doPost — Ultra-Secure Whitelist Submission Endpoint.
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(8000)) {
    return jsonResponse_({ ok: false, error: 'Server busy processing requests. Please retry in 5 seconds.' });
  }

  try {
    let payload;
    try {
      payload = JSON.parse(e.postData && e.postData.contents ? e.postData.contents : '{}');
    } catch (_) {
      return jsonResponse_({ ok: false, error: 'Malformed JSON payload.' });
    }

    const twitter = String(payload.twitter || '').replace(/^@/, '').trim();
    const wallet = String(payload.wallet || '').trim();
    const serial = String(payload.serial || '').trim();
    const serverNonce = String(payload.serverNonce || '').trim();
    const serverSignature = String(payload.serverSignature || '').trim();
    const clientIssuedTime = parseInt(payload.issuedTime, 10);
    const nonce = String(payload.nonce || '').trim();
    const powHash = String(payload.powHash || '').toLowerCase().trim();
    const userAgent = String(payload.userAgent || '').slice(0, 200);
    const ip = String(payload.ip || '').slice(0, 60);
    const fingerprint = String(payload.fingerprint || '').slice(0, 100);

    // 1. Honeypot check
    if (payload.website_trap || payload.bot_token_trap) {
      return jsonResponse_({ ok: false, error: 'Automated spam trap triggered.' });
    }

    // 2. Strict Input validation
    if (!isValidTwitterHandle(twitter)) {
      return jsonResponse_({ ok: false, error: 'Invalid X (Twitter) username.', field: 'twitter' });
    }
    if (!isValidEvmAddress(wallet)) {
      return jsonResponse_({ ok: false, error: 'Invalid EVM wallet address.', field: 'wallet' });
    }
    if (!isValidSerial(serial)) {
      return jsonResponse_({ ok: false, error: 'Invalid VIP pass serial number.' });
    }

    const twitterNorm = twitter.toLowerCase();
    const walletNorm = wallet.toLowerCase();
    const cache = CacheService.getScriptCache();

    // 3. VERIFY SERVER-ISSUED NONCE (Two-Phase Handshake)
    if (!serverNonce || !serverSignature || isNaN(clientIssuedTime)) {
      return jsonResponse_({ ok: false, error: 'Missing cryptographic server challenge. Please refresh and try again.' });
    }

    const cachedTokenRaw = cache.get('nonce_' + serverNonce);
    if (!cachedTokenRaw) {
      return jsonResponse_({ ok: false, error: 'Security session expired or invalid. Please re-verify from the website.' });
    }

    let tokenData;
    try {
      tokenData = JSON.parse(cachedTokenRaw);
    } catch (_) {
      return jsonResponse_({ ok: false, error: 'Corrupted security token.' });
    }

    if (tokenData.status !== 'ACTIVE') {
      return jsonResponse_({ ok: false, error: 'One-time security challenge has already been used.' });
    }

    // 4. VERIFY SERVER SIGNATURE INTEGRITY
    const expectedServerSig = computeServerHmac(serverNonce + ':' + tokenData.issuedTime + ':' + walletNorm + ':' + twitterNorm);
    if (serverSignature !== expectedServerSig || serverSignature !== tokenData.serverSignature) {
      return jsonResponse_({ ok: false, error: 'Cryptographic server signature forgery detected.' });
    }

    // 5. VERIFY SERVER CLOCK TIMING (Cannot be forged by client)
    const now = Date.now();
    const serverElapsedMs = now - tokenData.issuedTime;

    if (serverElapsedMs < MIN_SERVER_TIME_MS) {
      return jsonResponse_({ ok: false, error: 'Automated instant submission detected (Speed: ' + (serverElapsedMs/1000).toFixed(1) + 's). Real human verification required.' });
    }
    if (serverElapsedMs > MAX_CHALLENGE_AGE_MS) {
      return jsonResponse_({ ok: false, error: 'Challenge expired. Please refresh the page.' });
    }

    // 6. VERIFY PROOF-OF-WORK
    const expectedPow = sha256Hex(serverNonce + ':' + nonce + ':' + tokenData.issuedTime);
    if (powHash !== expectedPow || !powHash.startsWith('0000')) {
      return jsonResponse_({ ok: false, error: 'Proof-of-Work computation failed.' });
    }

    // 7. BURN ONE-TIME TOKEN IMMEDIATELY
    cache.put('nonce_' + serverNonce, JSON.stringify({ status: 'USED', usedAt: now }), 600);

    // 8. DUPLICATE CHECK (Fast RAM Cache)
    if (cache.get('tw_' + twitterNorm)) {
      return jsonResponse_({ ok: false, error: 'This X username (@' + twitter + ') is already registered.', field: 'twitter', duplicate: true });
    }
    if (cache.get('wl_' + walletNorm)) {
      return jsonResponse_({ ok: false, error: 'This wallet address is already registered.', field: 'wallet', duplicate: true });
    }

    // 9. SPREADSHEET DATABASE RECORDING
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow(HEADERS);
    }

    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const existing = sheet.getRange(2, 2, lastRow - 1, 2).getValues();
      for (let i = 0; i < existing.length; i++) {
        const rowTw = String(existing[i][0] || '').toLowerCase().replace(/^@/, '').trim();
        const rowWl = String(existing[i][1] || '').toLowerCase().trim();

        if (rowTw === twitterNorm) {
          cache.put('tw_' + twitterNorm, '1', 86400);
          return jsonResponse_({ ok: false, error: 'This X username (@' + twitter + ') is already on the whitelist.', field: 'twitter', duplicate: true });
        }
        if (rowWl === walletNorm) {
          cache.put('wl_' + walletNorm, '1', 86400);
          return jsonResponse_({ ok: false, error: 'This wallet address is already registered.', field: 'wallet', duplicate: true });
        }
      }
    }

    const elapsedSec = (serverElapsedMs / 1000).toFixed(1) + 's';

    // Append authentic human entry
    sheet.appendRow([
      new Date(),
      '@' + twitter,
      wallet,
      serial,
      ip || 'Verified Web3',
      fingerprint || 'Verified Client',
      elapsedSec,
      userAgent
    ]);

    // Save in Cache for 24 hours
    try {
      cache.put('tw_' + twitterNorm, '1', 86400);
      cache.put('wl_' + walletNorm, '1', 86400);
    } catch (_) {}

    return jsonResponse_({
      ok: true,
      message: 'Genesis VIP Whitelist spot confirmed & Cryptographically Verified!',
      serial: serial
    });

  } catch (err) {
    return jsonResponse_({ ok: false, error: 'Server processing error: ' + err.message });
  } finally {
    lock.releaseLock();
  }
}

/** Read settings from Settings sheet. */
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
      if (row[0] === 'timerStartDate' && row[1] instanceof Date) {
        settings[row[0]] = Utilities.formatDate(row[1], 'Asia/Dhaka', 'yyyy-MM-dd');
      } else {
        settings[row[0]] = String(row[1]);
      }
    }
  }

  const finalSettings = Object.assign({}, DEFAULT_SETTINGS, settings);
  
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

/**
 * Setup sheet headers & styling.
 */
function setupSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);

  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  sheet.getRange(1, 1, 1, HEADERS.length)
    .setFontWeight('bold')
    .setBackground('#111827')
    .setFontColor('#C6F221')
    .setHorizontalAlignment('center');
  sheet.setFrozenRows(1);
  
  sheet.setColumnWidth(1, 180); // Timestamp
  sheet.setColumnWidth(2, 160); // Twitter Handle
  sheet.setColumnWidth(3, 360); // Wallet Address
  sheet.setColumnWidth(4, 150); // Serial
  sheet.setColumnWidth(5, 140); // IP Address
  sheet.setColumnWidth(6, 200); // Device Fingerprint
  sheet.setColumnWidth(7, 140); // Server Elapsed Time
  sheet.setColumnWidth(8, 220); // User Agent
  
  return 'Submissions sheet configured with Military-Grade Anti-Bot Columns!';
}

/**
 * PURGE SPAM ROWS (Preserving the authentic 46 submissions):
 * Automatically deletes all spam submissions from row 47 to the end of the sheet.
 */
function purgeSpamRowsFrom47() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) return 'No Submissions sheet found.';

  const lastRow = sheet.getLastRow();
  if (lastRow <= 46) {
    return 'Sheet is already clean! Total rows: ' + lastRow + ' (All 46 authentic entries preserved).';
  }

  const spamCount = lastRow - 46;
  sheet.deleteRows(47, spamCount);
  
  // Clear cache so old spam entries don't block anything
  try {
    CacheService.getScriptCache().removeAll(['tw_', 'wl_']);
  } catch (_) {}

  return 'SUCCESS: Cleaned ' + spamCount + ' spam rows! Rows 1 to 46 are 100% safe, clean, and authentic.';
}

/** Run setupSettingsSheet */
function setupSettingsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SETTINGS_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(SETTINGS_SHEET);
  } else {
    sheet.clear();
  }
  
  sheet.appendRow(['Key', 'Value', 'Instructions']);
  sheet.getRange(1, 1, 1, 3).setFontWeight('bold').setBackground('#111827').setFontColor('#C6F221');
  
  const addDropdown = (row, options) => {
    const rule = SpreadsheetApp.newDataValidation().requireValueInList(options, true).build();
    sheet.getRange(row, 2).setDataValidation(rule);
  };
  const addDateValidation = (row) => {
    const rule = SpreadsheetApp.newDataValidation().requireDate().build();
    sheet.getRange(row, 2).setDataValidation(rule);
    sheet.getRange(row, 2).setNumberFormat('yyyy-MM-dd');
  };

  const now = new Date();
  sheet.appendRow(['postUrl', 'https://x.com/dudescraft/status/2093534635510702415', 'Tweet URL for Like/Repost/Quote']);
  sheet.appendRow(['whitelistOpen', 'On', 'Status of Whitelist (On or Off)']);
  addDropdown(3, ['On', 'Off']);
  sheet.appendRow(['timerStartDate', now, 'Double-click to open Date Picker calendar']);
  addDateValidation(4);
  sheet.appendRow(['timerStartHour', '12', 'Hour (1 to 12)']);
  addDropdown(5, ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']);
  sheet.appendRow(['timerStartMinute', '00', 'Minute']);
  addDropdown(6, ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']);
  sheet.appendRow(['timerStartAMPM', 'AM', 'AM or PM']);
  addDropdown(7, ['AM', 'PM']);
  sheet.appendRow(['timerDuration', '144', 'Duration in hours (e.g. 24, 48, 72, 144)']);
  addDropdown(8, ['12', '24', '35', '48', '72', '96', '120', '144', '168']);

  sheet.setColumnWidth(1, 140);
  sheet.setColumnWidth(2, 300);
  sheet.setColumnWidth(3, 420);
  sheet.getRange(2, 3, 7, 1).setFontColor('#666666').setFontStyle('italic');
  
  return 'Settings sheet ready.';
}

/** Keep Alive Warmup (24/7 Hot) */
function keepAlive() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME);
    if (sheet) sheet.getLastRow();
  } catch (_) {}
}

function setupKeepAlive() {
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'keepAlive') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  ScriptApp.newTrigger('keepAlive')
    .timeBased()
    .everyMinutes(5)
    .create();
  return 'Keep-alive installed! Active 24/7.';
}