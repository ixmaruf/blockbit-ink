/**
 * Dudes Craft Genesis Whitelist — Military-Grade Anti-Bot & Whitelist Backend
 * Version: 8.0 (Cloudflare Turnstile Enterprise AI Shield + Cryptographic Handshake + 5-Zero PoW)
 */

/** Sheet names inside the bound spreadsheet. */
const SHEET_NAME = 'Submissions';
const SETTINGS_SHEET = 'Settings';
const SPREADSHEET_ID = '1XMew79sWhhgRVoJitYh14MvRxI_V9_AL2pCfjjcNS-s';

/**
 * CLOUDFLARE TURNSTILE SECRET KEY
 * NEVER exposed to client-side code. Verified directly with Cloudflare Servers.
 */
const CLOUDFLARE_TURNSTILE_SECRET = '0x4AAAAAAEktxo5Iuq069Dd5JtqvYezTEZs';

/** 
 * PRIVATE SERVER SECRET FOR INTERNAL HMAC
 */
const PRIVATE_SERVER_SECRET = 'DUDES_CRAFT_ROBINHOOD_PRIVATE_VAULT_KEY_984729104812_SECURE';

/** Minimum real elapsed time on Google Server (in milliseconds) from challenge issue to submission */
const MIN_SERVER_TIME_MS = 4000; // 4.0 seconds on real server clock

/** Maximum validity window for a server challenge (10 minutes) */
const MAX_CHALLENGE_AGE_MS = 10 * 60 * 1000;

/** Required Proof-of-Work prefix (5 leading zeros) */
const REQUIRED_POW_DIFFICULTY = '00000';

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

/** Helper to reliably get the exact spreadsheet */
function getSpreadsheet_() {
  try {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  } catch (_) {
    return SpreadsheetApp.getActiveSpreadsheet();
  }
}

/** Strict EVM address validator (0x followed by 40 hex chars). */
function isValidEvmAddress(addr) {
  return typeof addr === 'string' && /^0x[a-fA-F0-9]{40}$/.test(addr.trim());
}

/** Strict Twitter username validator (1-15 chars, alphanumeric + underscores). */
function isValidTwitterHandle(handle) {
  if (typeof handle !== 'string') return false;
  const v = handle.replace(/^@/, '').trim();
  return /^[A-Za-z0-9_]{1,15}$/.test(v);
}

/** Strict serial format validator. */
function isValidSerial(serial) {
  return typeof serial === 'string' && /^(DC|BBI)-[0-9A-F]{4}-[0-9A-F]{4,6}$/i.test(serial.trim());
}

/** SHA-256 hash helper. */
function sha256Hex(str) {
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, str, Utilities.Charset.UTF_8);
  return digest.map(function(b) {
    const val = (b < 0 ? b + 256 : b).toString(16);
    return val.length === 1 ? '0' + val : val;
  }).join('');
}

/** HMAC-SHA256 signature helper. */
function computeServerHmac(str) {
  const signature = Utilities.computeHmacSha256Signature(str, PRIVATE_SERVER_SECRET);
  return signature.map(function(b) {
    const val = (b < 0 ? b + 256 : b).toString(16);
    return val.length === 1 ? '0' + val : val;
  }).join('');
}

/**
 * Verify Cloudflare Turnstile token directly with Cloudflare API.
 */
function verifyCloudflareTurnstile(token, ip) {
  if (!token || typeof token !== 'string') {
    return { ok: false, error: 'Cloudflare human verification token missing. Please complete the check.' };
  }

  try {
    const url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
    const payload = {
      secret: CLOUDFLARE_TURNSTILE_SECRET,
      response: token
    };
    if (ip && ip.length > 5 && ip !== 'Verified Web3' && ip !== 'Verified Client') {
      payload.remoteip = ip;
    }

    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(url, options);
    const json = JSON.parse(response.getContentText());

    if (json && json.success) {
      return { ok: true };
    } else {
      const errCodes = (json && json['error-codes']) ? json['error-codes'].join(', ') : 'Verification rejected';
      Logger.log('Turnstile Rejected: ' + errCodes);
      return { ok: false, error: 'Cloudflare Turnstile verification failed (' + errCodes + '). Please refresh.' };
    }
  } catch (err) {
    Logger.log('Turnstile Fetch Exception: ' + err.message);
    // If external call temporary network error, log and allow if other checks pass
    return { ok: true, warn: err.message };
  }
}

/** Build JSON response. */
function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** 
 * doGet Endpoint: Settings, Ping, and Handshake Challenge.
 */
function doGet(e) {
  const params = (e && e.parameter) ? e.parameter : {};

  // 1. Pre-warm Ping
  if (params.action === 'ping') {
    try {
      const ss = getSpreadsheet_();
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

  // 3. Handshake Challenge
  if (params.action === 'v7_init_human_challenge' || params.action === 'request_challenge_v7') {
    const wallet = String(params.wallet || '').trim().toLowerCase();
    const twitter = String(params.twitter || '').replace(/^@/, '').trim().toLowerCase();
    const gestureProof = String(params.gesture || '').trim();

    if (!isValidEvmAddress(wallet)) {
      return jsonResponse_({ ok: false, error: 'Invalid EVM wallet address.' });
    }
    if (!isValidTwitterHandle(twitter)) {
      return jsonResponse_({ ok: false, error: 'Invalid X (Twitter) username.' });
    }

    const cache = CacheService.getScriptCache();

    if (cache.get('tw_' + twitter)) {
      return jsonResponse_({ ok: false, error: 'This X username (@' + twitter + ') is already registered.', duplicate: true });
    }
    if (cache.get('wl_' + wallet)) {
      return jsonResponse_({ ok: false, error: 'This wallet address is already registered.', duplicate: true });
    }

    const serverNonce = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '').slice(0, 8);
    const issuedTime = Date.now();
    const serverSignature = computeServerHmac(serverNonce + ':' + issuedTime + ':' + wallet + ':' + twitter);

    cache.put('nonce_' + serverNonce, JSON.stringify({
      wallet: wallet,
      twitter: twitter,
      issuedTime: issuedTime,
      serverSignature: serverSignature,
      gestureProof: gestureProof,
      status: 'ACTIVE'
    }), 600);

    return jsonResponse_({
      ok: true,
      serverNonce: serverNonce,
      issuedTime: issuedTime,
      serverSignature: serverSignature,
      difficulty: REQUIRED_POW_DIFFICULTY
    });
  }

  // Deprecated Old Bot Endpoints
  if (params.action === 'request_challenge') {
    return jsonResponse_({
      ok: false,
      error: 'Security endpoint deprecated. Cloudflare Turnstile human verification required.'
    });
  }

  return jsonResponse_({
    ok: true,
    service: 'Dudes Craft Whitelist Security API',
    version: '8.0-CloudflareTurnstile-EnterpriseShield',
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
    const turnstileToken = String(payload.turnstileToken || '').trim();

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

    // 3. CLOUDFLARE TURNSTILE DIRECT SERVER VERIFICATION
    const cfCheck = verifyCloudflareTurnstile(turnstileToken, ip);
    if (!cfCheck.ok) {
      return jsonResponse_({ ok: false, error: cfCheck.error, isBot: true });
    }

    const twitterNorm = twitter.toLowerCase();
    const walletNorm = wallet.toLowerCase();
    const cache = CacheService.getScriptCache();

    // 4. VERIFY SERVER-ISSUED NONCE
    if (!serverNonce || !serverSignature || isNaN(clientIssuedTime)) {
      return jsonResponse_({ ok: false, error: 'Missing cryptographic server challenge. Please refresh and try again.' });
    }

    const cachedTokenRaw = cache.get('nonce_' + serverNonce);
    if (!cachedTokenRaw) {
      return jsonResponse_({ ok: false, error: 'Security session expired. Please re-verify from the website.' });
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

    // 5. VERIFY SERVER SIGNATURE
    const expectedServerSig = computeServerHmac(serverNonce + ':' + tokenData.issuedTime + ':' + walletNorm + ':' + twitterNorm);
    if (serverSignature !== expectedServerSig || serverSignature !== tokenData.serverSignature) {
      return jsonResponse_({ ok: false, error: 'Cryptographic server signature forgery detected.' });
    }

    // 6. SERVER TIMING VERIFICATION
    const now = Date.now();
    const serverElapsedMs = now - tokenData.issuedTime;

    if (serverElapsedMs < MIN_SERVER_TIME_MS) {
      return jsonResponse_({ ok: false, error: 'Automated instant submission detected. Real human verification required.' });
    }
    if (serverElapsedMs > MAX_CHALLENGE_AGE_MS) {
      return jsonResponse_({ ok: false, error: 'Challenge expired. Please refresh the page.' });
    }

    // 7. VERIFY PROOF-OF-WORK (5 ZEROS)
    const expectedPow = sha256Hex(serverNonce + ':' + nonce + ':' + tokenData.issuedTime);
    if (powHash !== expectedPow || !powHash.startsWith(REQUIRED_POW_DIFFICULTY)) {
      return jsonResponse_({ ok: false, error: 'Proof-of-Work computation failed.' });
    }

    // 8. BURN ONE-TIME TOKEN IMMEDIATELY
    cache.put('nonce_' + serverNonce, JSON.stringify({ status: 'USED', usedAt: now }), 600);

    // 9. DUPLICATE CHECK (Fast RAM Cache)
    if (cache.get('tw_' + twitterNorm)) {
      return jsonResponse_({ ok: false, error: 'This X username (@' + twitter + ') is already registered.', field: 'twitter', duplicate: true });
    }
    if (cache.get('wl_' + walletNorm)) {
      return jsonResponse_({ ok: false, error: 'This wallet address is already registered.', field: 'wallet', duplicate: true });
    }

    // 10. SPREADSHEET DATABASE RECORDING
    const ss = getSpreadsheet_();
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

    // Append authentic human entry verified by Cloudflare
    sheet.appendRow([
      new Date(),
      '@' + twitter,
      wallet,
      serial,
      ip || 'Cloudflare Verified',
      fingerprint || 'Cloudflare Verified',
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
      message: 'Genesis VIP Whitelist spot confirmed & Cloudflare Verified!',
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
  const ss = getSpreadsheet_();
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

/** Keep Alive Warmup (24/7 Hot) */
function keepAlive() {
  try {
    const ss = getSpreadsheet_();
    const sheet = ss.getSheetByName(SHEET_NAME);
    if (sheet) sheet.getLastRow();
  } catch (_) {}
}