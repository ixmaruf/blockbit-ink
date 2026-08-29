/**
 * Dudes Craft Genesis Whitelist — Military-Grade Anti-Bot & Whitelist Backend
 * Version: 5.0 (Advanced PoW + IP Limiter + Device Fingerprint + Honeypot + Deduplication)
 */

/** Sheet names inside the bound spreadsheet. */
const SHEET_NAME = 'Submissions';
const SETTINGS_SHEET = 'Settings';

/** Secret Key for HMAC & PoW Verification (Synced with Frontend) */
const ANTI_BOT_SECRET = 'DUDES_CRAFT_ROBINHOOD_GENESIS_2026_SECURE_KEY';

/** Minimum human completion time (in milliseconds) required from page load to submission */
const MIN_HUMAN_TIME_MS = 3500; // 3.5 seconds

/** Maximum validity window for a submission challenge (15 minutes) */
const MAX_CHALLENGE_AGE_MS = 15 * 60 * 1000;

/** Default settings used when Settings sheet is missing or incomplete. */
const DEFAULT_SETTINGS = {
  postUrl: 'https://x.com/DudesCraft',
  timerStart: Utilities.formatDate(new Date(), 'Asia/Dhaka', 'yyyy-MM-dd HH:mm'),
  timerDuration: '72',
  whitelistOpen: 'true'
};

/** Header row written by setupSheet(). Order MUST match appendRow(). */
const HEADERS = [
  'Timestamp',
  'Twitter Handle',
  'Wallet Address',
  'Serial',
  'IP Address',
  'Device Fingerprint',
  'Elapsed Time',
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
 * Simple SHA-256 hash helper using Utilities.computeDigest.
 */
function sha256Hex(str) {
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, str, Utilities.Charset.UTF_8);
  return digest.map(function(b) {
    const val = (b < 0 ? b + 256 : b).toString(16);
    return val.length === 1 ? '0' + val : val;
  }).join('');
}

/**
 * Verify Proof-of-Work (PoW) and Time-Locked Signature from client.
 */
function verifyAntiBotProof(payload) {
  const challenge = String(payload.challenge || '').trim();
  const nonce = String(payload.nonce || '').trim();
  const timestamp = parseInt(payload.challengeTime, 10);
  const elapsedMs = parseInt(payload.elapsedMs, 10);
  const powHash = String(payload.powHash || '').toLowerCase().trim();
  const signature = String(payload.signature || '').toLowerCase().trim();

  // 1. Honeypot check (Bots fill hidden fields automatically)
  if (payload.website_trap || payload.bot_token_trap) {
    return { ok: false, error: 'Spam activity detected (Trap triggered).' };
  }

  // 2. Timing check: Humans must take at least 3.5 seconds
  if (isNaN(elapsedMs) || elapsedMs < MIN_HUMAN_TIME_MS) {
    return { ok: false, error: 'Submission rejected: Automated submission detected (Speed violation).' };
  }

  // 3. Challenge freshness check (Must be generated within 15 minutes)
  const now = Date.now();
  if (isNaN(timestamp) || (now - timestamp) > MAX_CHALLENGE_AGE_MS || timestamp > (now + 60000)) {
    return { ok: false, error: 'Session expired. Please refresh the page and try again.' };
  }

  // 4. Verify HMAC Signature
  const expectedSig = sha256Hex(challenge + ':' + timestamp + ':' + payload.wallet.toLowerCase() + ':' + ANTI_BOT_SECRET);
  if (signature !== expectedSig) {
    return { ok: false, error: 'Cryptographic signature verification failed.' };
  }

  // 5. Verify Proof-of-Work Hash (Must start with "000" or "0000")
  const expectedPow = sha256Hex(challenge + ':' + nonce + ':' + timestamp);
  if (powHash !== expectedPow || !powHash.startsWith('000')) {
    return { ok: false, error: 'Anti-bot Proof-of-Work puzzle verification failed.' };
  }

  return { ok: true };
}

/** 
 * doGet Endpoint: Settings and Pre-warm Ping.
 */
function doGet(e) {
  if (e && e.parameter) {
    if (e.parameter.action === 'ping') {
      try {
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        const sheet = ss.getSheetByName(SHEET_NAME);
        if (sheet) sheet.getLastRow();
      } catch (_) {}
      return ContentService.createTextOutput('PONG').setMimeType(ContentService.MimeType.TEXT);
    }
    if (e.parameter.action === 'settings') {
      const settings = getSettings_();
      return jsonResponse_({
        ok: true,
        settings: settings
      });
    }
    if (e.parameter.action === 'challenge') {
      // Issue a fresh challenge for client-side PoW
      const challenge = Utilities.getUuid().replace(/-/g, '').slice(0, 16);
      const ts = Date.now();
      return jsonResponse_({
        ok: true,
        challenge: challenge,
        timestamp: ts
      });
    }
  }
  return jsonResponse_({
    ok: true,
    service: 'Dudes Craft Whitelist Security API',
    version: '5.0-AntiBot',
    timestamp: new Date().toISOString()
  });
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

/** Build JSON response. */
function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * doPost — Ultra-Secure Whitelist Submission Endpoint.
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) {
    return jsonResponse_({ ok: false, error: 'Server busy processing queue, please retry in 5 seconds.' });
  }

  try {
    let payload;
    try {
      payload = JSON.parse(e.postData && e.postData.contents ? e.postData.contents : '{}');
    } catch (_) {
      return jsonResponse_({ ok: false, error: 'Invalid payload.' });
    }

    const twitter = String(payload.twitter || '').replace(/^@/, '').trim();
    const wallet = String(payload.wallet || '').trim();
    const serial = String(payload.serial || '').trim();
    const ip = String(payload.ip || payload.ipHint || '').trim();
    const fingerprint = String(payload.fingerprint || '').trim();
    const elapsedSec = (parseInt(payload.elapsedMs, 10) / 1000).toFixed(1) + 's';
    const userAgent = String(payload.userAgent || '').slice(0, 200);

    // 1. Regex checks
    if (!isValidTwitterHandle(twitter)) {
      return jsonResponse_({ ok: false, error: 'Invalid X (Twitter) username.', field: 'twitter' });
    }
    if (!isValidEvmAddress(wallet)) {
      return jsonResponse_({ ok: false, error: 'Invalid EVM wallet address.', field: 'wallet' });
    }
    if (!isValidSerial(serial)) {
      return jsonResponse_({ ok: false, error: 'Invalid VIP pass serial.' });
    }

    // 2. Anti-Bot Cryptographic PoW & Timing Verification
    const antiBotCheck = verifyAntiBotProof(payload);
    if (!antiBotCheck.ok) {
      return jsonResponse_({ ok: false, error: antiBotCheck.error, isBot: true });
    }

    const twitterNorm = twitter.toLowerCase();
    const walletNorm = wallet.toLowerCase();
    const ipHash = ip ? sha256Hex(ip) : '';
    const fpHash = fingerprint ? sha256Hex(fingerprint) : '';

    const cache = CacheService.getScriptCache();

    // 3. Fast RAM Cache Check for Duplicates & IP Spam
    if (cache.get('tw_' + twitterNorm)) {
      return jsonResponse_({
        ok: false,
        error: 'This X username (@' + twitter + ') is already registered on the whitelist.',
        field: 'twitter',
        duplicate: true
      });
    }
    if (cache.get('wl_' + walletNorm)) {
      return jsonResponse_({
        ok: false,
        error: 'This wallet address (' + wallet.slice(0, 6) + '...' + wallet.slice(-4) + ') is already registered.',
        field: 'wallet',
        duplicate: true
      });
    }
    if (ipHash && cache.get('ip_' + ipHash)) {
      return jsonResponse_({
        ok: false,
        error: 'An application has already been submitted from this IP address / network. Duplicate submissions are strictly blocked.',
        duplicate: true
      });
    }
    if (fpHash && cache.get('fp_' + fpHash)) {
      return jsonResponse_({
        ok: false,
        error: 'An application has already been submitted from this device. Multiple accounts from the same device are prohibited.',
        duplicate: true
      });
    }

    // 4. Open Sheet and check database
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow(HEADERS);
    }

    const lastRow = sheet.getLastRow();

    // 5. Database Multi-Column Check (Twitter, Wallet, IP, Fingerprint)
    if (lastRow > 1) {
      const data = sheet.getRange(2, 2, lastRow - 1, 5).getValues();
      for (let i = 0; i < data.length; i++) {
        const rowTw = String(data[i][0] || '').toLowerCase().replace(/^@/, '').trim();
        const rowWl = String(data[i][1] || '').toLowerCase().trim();
        const rowIp = String(data[i][3] || '').trim();
        const rowFp = String(data[i][4] || '').trim();

        if (rowTw === twitterNorm) {
          cache.put('tw_' + twitterNorm, '1', 21600);
          return jsonResponse_({
            ok: false,
            error: 'This X username (@' + twitter + ') is already registered.',
            field: 'twitter',
            duplicate: true
          });
        }

        if (rowWl === walletNorm) {
          cache.put('wl_' + walletNorm, '1', 21600);
          return jsonResponse_({
            ok: false,
            error: 'This wallet address is already registered.',
            field: 'wallet',
            duplicate: true
          });
        }

        // IP Duplicate Check across sheet
        if (ip && rowIp && rowIp === ip) {
          cache.put('ip_' + ipHash, '1', 21600);
          return jsonResponse_({
            ok: false,
            error: 'An application has already been submitted from this IP network.',
            duplicate: true
          });
        }

        // Device Fingerprint Check across sheet
        if (fingerprint && rowFp && rowFp === fingerprint) {
          cache.put('fp_' + fpHash, '1', 21600);
          return jsonResponse_({
            ok: false,
            error: 'An application has already been submitted from this browser / device.',
            duplicate: true
          });
        }
      }
    }

    // 6. Append verified real submission
    sheet.appendRow([
      new Date(),
      '@' + twitter,
      wallet,
      serial,
      ip || 'N/A',
      fingerprint || 'N/A',
      elapsedSec,
      userAgent
    ]);

    // 7. Update 6-hour cache
    try {
      cache.put('tw_' + twitterNorm, '1', 21600);
      cache.put('wl_' + walletNorm, '1', 21600);
      if (ipHash) cache.put('ip_' + ipHash, '1', 21600);
      if (fpHash) cache.put('fp_' + fpHash, '1', 21600);
    } catch (_) {}

    return jsonResponse_({
      ok: true,
      message: 'Whitelist spot confirmed & Verified!',
      serial: serial
    });

  } catch (err) {
    return jsonResponse_({ ok: false, error: 'Server error: ' + err.message });
  } finally {
    lock.releaseLock();
  }
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
    .setBackground('#7C3AED')
    .setFontColor('#FFFFFF')
    .setHorizontalAlignment('center');
  sheet.setFrozenRows(1);
  
  sheet.setColumnWidth(1, 180); // Timestamp
  sheet.setColumnWidth(2, 160); // Twitter Handle
  sheet.setColumnWidth(3, 360); // Wallet Address
  sheet.setColumnWidth(4, 150); // Serial
  sheet.setColumnWidth(5, 140); // IP Address
  sheet.setColumnWidth(6, 220); // Device Fingerprint
  sheet.setColumnWidth(7, 100); // Elapsed Time
  sheet.setColumnWidth(8, 220); // User Agent
  
  return 'Submissions sheet headers configured with Anti-Bot columns!';
}

/**
 * Cleanup function to purge automated bot spam rows from Google Sheet.
 * Retains authentic early submissions and wipes out continuous automated spam.
 */
function cleanBotSpam() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) return 'No Submissions sheet found.';

  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return 'No rows to clean.';

  // Headers update
  setupSheet();

  // If there are spam rows from row 10 to lastRow, delete them
  // Keep rows 2 to 9 (legitimate test/early users before 18:09)
  if (lastRow > 9) {
    sheet.deleteRows(10, lastRow - 9);
    return 'Cleaned ' + (lastRow - 9) + ' spam bot rows! Only authentic entries (rows 1-9) remain.';
  }

  return 'No spam rows needed deletion (total rows: ' + lastRow + ').';
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
  sheet.getRange(1, 1, 1, 3).setFontWeight('bold').setBackground('#7C3AED').setFontColor('#FFFFFF');
  
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
  sheet.appendRow(['postUrl', 'https://x.com/DudesCraft', 'Tweet URL for Like/Repost/Quote']);
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
  sheet.appendRow(['timerDuration', '72', 'Duration in hours (e.g. 24, 48, 72, 120)']);
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