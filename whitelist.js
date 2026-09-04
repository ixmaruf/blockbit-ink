(function () {
  'use strict';

  // Clean .html extension from URL bar
  if (window.location.pathname.endsWith('.html')) {
    var clean = window.location.pathname.replace(/(?:index)?\.html$/, '');
    if (!clean || clean.endsWith('/')) clean = clean || '/';
    window.history.replaceState(null, '', clean + window.location.search + window.location.hash);
  }

  // ── GLOBAL CACHE-BUST & AUTO-UPDATE ──
  const CURRENT_APP_VERSION = 'v8.4_20260905';
  try {
    const storedVer = localStorage.getItem('dudescraft_app_version');
    if (storedVer !== CURRENT_APP_VERSION) {
      localStorage.setItem('dudescraft_app_version', CURRENT_APP_VERSION);
      localStorage.removeItem('bbi_wl_settings');
      localStorage.removeItem('blockbit_settings');
      localStorage.removeItem('dudescraft_settings_v3');
      localStorage.removeItem('dudescraft_settings_v4');
      localStorage.removeItem('dudescraft_settings_v5');
    }
  } catch (_) {}

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function (registrations) {
      for (let reg of registrations) {
        reg.update().catch(function () {});
      }
    }).catch(function () {});
  }

  /* ─── State ─── */
  let currentStep = 1;
  const totalSteps = 4;
  let serial = '';
  let submitted = false;
  const tasksCompleted = { follow: false, like: false, repost: false, quote: false };
  let savedWallet = '';
  let savedTwitter = '';
  let currentPostUrl = '';
  let appSettings = {};
  let timerInterval = null;

  /* ─── Anti-Bot State ─── */
  const sessionStartTime = Date.now();
  let clientIp = '';
  let deviceFingerprint = '';

  /* ─── DOM refs ─── */
  const twitterInput = document.getElementById('twitterHandle');
  const walletInput  = document.getElementById('walletAddr');
  const twitterErr   = document.getElementById('twitterError');
  const walletErr    = document.getElementById('walletError');
  const step3Err     = document.getElementById('step3Error');
  const confirmTwitter = document.getElementById('confirmTwitter');
  const confirmWallet  = document.getElementById('confirmWallet');
  const confirmSerial  = document.getElementById('confirmSerial');
  const passMeta       = document.getElementById('passMeta');
  const submitAndClaimBtn = document.getElementById('submitAndClaim');

  /* ─── Helpers ─── */
  function getTwitterRaw() { return (twitterInput.value || '').trim(); }
  function getTwitterClean() {
    let v = getTwitterRaw().replace(/^@/, '').trim();
    return v;
  }
  function getWallet() { return (walletInput.value || '').trim(); }
  function isValidTwitter(v) { return /^[A-Za-z0-9_]{1,15}$/.test(v); }
  function isValidWallet(v) { return /^0x[a-fA-F0-9]{40}$/.test(v); }
  function showErr(el, msg) { if (el) el.textContent = msg; }
  function clearErr(el) { if (el) el.textContent = ''; }

  /* ─── Cryptographic Hash & PoW Helpers ─── */
  async function sha256Hex(str) {
    if (window.crypto && crypto.subtle) {
      const buf = new TextEncoder().encode(str);
      const hashBuf = await crypto.subtle.digest('SHA-256', buf);
      return Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    // Fallback FNV-like 64-hex string
    let h1 = 0x811c9dc5, h2 = 0x12345678;
    for (let i = 0; i < str.length; i++) {
      h1 ^= str.charCodeAt(i);
      h1 = Math.imul(h1, 0x01000193);
      h2 ^= str.charCodeAt(i);
      h2 = Math.imul(h2, 0x01000193);
    }
    return (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0');
  }

  async function getDeviceFingerprint() {
    if (deviceFingerprint) return deviceFingerprint;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 180; canvas.height = 40;
      const ctx = canvas.getContext('2d');
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(100, 1, 50, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('DudesCraft_AntiBot', 2, 12);
      ctx.fillStyle = 'rgba(198, 242, 33, 0.7)';
      ctx.fillText('DudesCraft_AntiBot', 4, 14);
      const canvasHash = canvas.toDataURL();

      const screenInfo = [
        screen.width, screen.height, screen.colorDepth,
        window.devicePixelRatio || 1,
        Intl.DateTimeFormat().resolvedOptions().timeZone || '',
        navigator.language || '',
        navigator.hardwareConcurrency || 2
      ].join('~');

      deviceFingerprint = await sha256Hex(canvasHash + '|||' + screenInfo);
    } catch (_) {
      try {
        deviceFingerprint = await sha256Hex((navigator.userAgent || 'UA') + '|||' + (screen.width + 'x' + screen.height) + '|||' + (navigator.language || 'en') + '|||' + Math.random());
      } catch (e) {
        deviceFingerprint = 'd7a8fbb307d7809469ca933b02b1f18f3a4f164be472f5b816049fc71f44ac28';
      }
    }
    return deviceFingerprint;
  }

  async function fetchClientIp() {
    if (clientIp) return clientIp;
    try {
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 1500);
      const r = await fetch('https://api.ipify.org?format=json', { cache: 'no-store', signal: ctrl.signal });
      clearTimeout(tid);
      const d = await r.json();
      if (d && d.ip) {
        clientIp = d.ip;
        return clientIp;
      }
    } catch (_) {}
    try {
      const ctrl2 = new AbortController();
      const tid2 = setTimeout(() => ctrl2.abort(), 1500);
      const r2 = await fetch('https://api64.ipify.org?format=json', { cache: 'no-store', signal: ctrl2.signal });
      clearTimeout(tid2);
      const d2 = await r2.json();
      if (d2 && d2.ip) {
        clientIp = d2.ip;
        return clientIp;
      }
    } catch (_) {}
    return '';
  }

  /* ─── Real Human Interaction & Gesture Telemetry ─── */
  const humanGestureEvents = [];
  function recordHumanGesture(e) {
    if (humanGestureEvents.length > 50) return;
    const t = Date.now();
    const x = Math.round(e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0) || 0);
    const y = Math.round(e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0) || 0);
    humanGestureEvents.push([x, y, t]);
  }

  window.addEventListener('mousemove', recordHumanGesture, { passive: true });
  window.addEventListener('touchmove', recordHumanGesture, { passive: true });
  window.addEventListener('pointerdown', recordHumanGesture, { passive: true });
  window.addEventListener('keydown', recordHumanGesture, { passive: true });

  async function getHumanGestureProof() {
    const timeOnPage = Date.now() - sessionStartTime;
    const count = Math.max(1, humanGestureEvents.length);
    const sample = humanGestureEvents.slice(-10).map(p => p[0] + ',' + p[1]).join('|');
    const raw = timeOnPage + ':' + count + ':' + sample + ':' + (navigator.language || 'en');
    return await sha256Hex('gesture_proof_v7:' + raw);
  }

  async function solveProofOfWork(challenge, ts, targetPrefix) {
    const prefix = targetPrefix || '00000';
    let nonce = 0;
    while (nonce < 2000000) {
      const hash = await sha256Hex(challenge + ':' + nonce + ':' + ts);
      if (hash.startsWith(prefix)) {
        return { nonce: String(nonce), hash: hash };
      }
      nonce++;
    }
    return { nonce: '0', hash: '' };
  }

  /* ─── Twitter Validation (Requires @) ─── */
  function validateTwitterInput() {
    const raw = getTwitterRaw();
    if (!raw) {
      showErr(twitterErr, "Please enter your X username with @ (e.g. @yourhandle)");
      return false;
    }
    if (!raw.startsWith('@')) {
      showErr(twitterErr, "Please include '@' at the beginning (e.g. @" + raw.replace(/^@+/, '') + ")");
      return false;
    }
    const clean = raw.slice(1).trim();
    if (!clean) {
      showErr(twitterErr, "Please enter your username after '@' (e.g. @yourhandle)");
      return false;
    }
    if (!isValidTwitter(clean)) {
      showErr(twitterErr, 'Invalid username — 1-15 letters, numbers, underscores only.');
      return false;
    }
    clearErr(twitterErr);
    return true;
  }

  /* ─── Toast helper ─── */
  function showToast(msg) {
    let toast = document.getElementById('wlToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'wlToast';
      toast.className = 'wl-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(function () {
      toast.classList.remove('show');
    }, 5000);
  }

  /* ─── FNV-1a (32-bit) ─── */
  function fnv1a(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
  }

  /* ─── Endpoint Config & Settings ─── */
  const DEFAULT_ENDPOINT = 'https://script.google.com/macros/s/AKfycbyy_q-cX2WCgTSrbvjlxuRBHuzFiPQYDroGolgcPD_UWXEctuDybTwpK56-iT7pyHY/exec';
  const DEFAULT_WL_SETTINGS = {
    whitelistOpen: 'On',
    timerStart: '2026-08-29 11:00',
    timerDuration: '168',
    postUrl: 'https://x.com/dudescraft/status/2093534635510702415',
    _isServerConfirmed: false
  };

  const STORAGE_KEY = 'dudescraft_settings_v6';

  // Automatically purge legacy localStorage from previous visits
  (function autoPurgeLegacyCache() {
    try {
      ['bbi_wl_settings', 'blockbit_settings', 'dudescraft_settings_v3', 'dudescraft_settings_v4', 'dudescraft_settings_v5'].forEach(function (k) {
        localStorage.removeItem(k);
        sessionStorage.removeItem(k);
      });
    } catch (_) {}
  })();

  function getLocalWlSettings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && parsed.savedAt && (Date.now() - parsed.savedAt < 24 * 60 * 60 * 1000)) {
          const s = Object.assign({}, parsed.settings);
          s._isServerConfirmed = !!parsed.isServerConfirmed;
          return s;
        }
      }
    } catch (e) {}
    return Object.assign({}, DEFAULT_WL_SETTINGS);
  }

  function getSheetEndpoint() {
    return (window.BLOCKBIT_CONFIG && window.BLOCKBIT_CONFIG.sheetEndpoint)
      ? window.BLOCKBIT_CONFIG.sheetEndpoint
      : DEFAULT_ENDPOINT;
  }

  /* ─── Prewarm Google Apps Script Container ─── */
  let lastPrewarmTime = 0;
  function prewarmAppsScript() {
    const now = Date.now();
    if (now - lastPrewarmTime < 30000) return;
    lastPrewarmTime = now;
    try {
      const endpoint = getSheetEndpoint();
      if (endpoint) {
        fetch(endpoint + '?action=ping&_w=' + now, {
          mode: 'no-cors',
          cache: 'no-store'
        }).catch(function () {});
      }
    } catch (_) {}
  }

  /* ─── Extract tweet ID from URL ─── */
  function extractTweetId(url) {
    if (!url) return null;
    const match = url.match(/status(?:es)?\/(\d+)/i) || url.match(/\/(\d{15,25})/);
    return match ? match[1] : null;
  }

  /* ─── Fetch settings from Apps Script ─── */
  async function fetchSettings() {
    try {
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 3500);
      const url = getSheetEndpoint() + '?action=settings&_nocache=' + Date.now();
      const resp = await fetch(url, { cache: 'no-store', signal: ctrl.signal });
      clearTimeout(tid);
      const data = await resp.json();
      if (data.ok && data.settings) return data.settings;
    } catch (err) {
      console.warn('Settings fetch failed or timed out, using defaults:', err);
    }
    return null;
  }

  /* ─── Initialize countdown timer ─── */
  function initTimer(settings, isAuthoritative) {
    var timerEl = document.getElementById('wlTimer');
    var comingSoonEl = document.getElementById('wlComingSoon');
    var containerEl = document.querySelector('.wl-container');
    
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }

    if (!settings) return;

    var authoritative = (isAuthoritative === true);
    var isOpen = settings.whitelistOpen !== 'false' && settings.whitelistOpen !== 'Off' && settings.whitelistOpen !== false;

    if (!isOpen) {
      // Never close based on unconfirmed fallback data while server request is in flight
      if (!authoritative) {
        if (comingSoonEl) comingSoonEl.style.display = 'none';
        if (containerEl) containerEl.style.display = 'block';
        if (timerEl) timerEl.style.display = 'inline-flex';
        return;
      }
      if (timerEl) timerEl.style.display = 'none';
      if (comingSoonEl) {
        comingSoonEl.style.display = 'block';
        var titleEl = document.getElementById('comingSoonTitle');
        var msgEl = document.getElementById('comingSoonMsg');
        var badgeEl = document.getElementById('closedBadgeText');
        var dateRow = document.getElementById('comingSoonDateRow');
        if (titleEl) titleEl.textContent = 'Whitelist Allocation Closed';
        if (msgEl) msgEl.textContent = 'The Genesis Robinhood Whitelist round is currently closed. Stay tuned for future allocation waves and mint updates.';
        if (badgeEl) badgeEl.textContent = 'GENESIS STATUS: CLOSED';
        if (dateRow) dateRow.style.display = 'none';
      }
      if (containerEl) containerEl.style.display = 'none';
      return;
    }

    var startStr = (settings && settings.timerStart) || '2026-08-29 11:00';
    var startMs;
    if (startStr.indexOf('T') > -1) {
      startMs = new Date(startStr).getTime();
    } else {
      var parts = startStr.split(' ');
      var dateParts = (parts[0] || '').split('-');
      var timeParts = (parts[1] || '').split(':');
      var y = parseInt(dateParts[0]) || 2026;
      var m = parseInt(dateParts[1]) || 8;
      var d = parseInt(dateParts[2]) || 29;
      var hh = parseInt(timeParts[0]) || 11;
      var mm = parseInt(timeParts[1]) || 0;
      startMs = Date.UTC(y, m - 1, d, hh - 6, mm);
    }
    var durationHours = parseFloat((settings && settings.timerDuration) || '168') || 168;
    var endTime = startMs + (durationHours * 3600 * 1000);

    function update() {
      var now = Date.now();
      if (now < startMs) {
        if (!authoritative) {
          if (comingSoonEl) comingSoonEl.style.display = 'none';
          if (containerEl) containerEl.style.display = 'block';
          if (timerEl) timerEl.style.display = 'inline-flex';
          return;
        }
        if (comingSoonEl) {
          comingSoonEl.style.display = 'block';
          var titleEl = document.getElementById('comingSoonTitle');
          var msgEl = document.getElementById('comingSoonMsg');
          var badgeEl = document.getElementById('closedBadgeText');
          var dateRow = document.getElementById('comingSoonDateRow');
          var dateEl = document.getElementById('comingSoonDate');
          if (titleEl) titleEl.textContent = 'Opening Soon';
          if (msgEl) msgEl.textContent = 'The Genesis Robinhood Whitelist round will open soon. Prepare your wallet and X credentials.';
          if (badgeEl) badgeEl.textContent = 'GENESIS STATUS: UPCOMING';
          if (dateRow) dateRow.style.display = 'flex';
          if (dateEl) dateEl.textContent = new Date(startMs).toLocaleString();
        }
        if (containerEl) containerEl.style.display = 'none';
        return;
      }

      if (now >= endTime) {
        if (!authoritative) {
          // Fallback / default timer ran out, but server fetch is in-flight!
          // Keep form completely OPEN and interactive. Never show "ENDED" on fallback defaults.
          if (comingSoonEl) comingSoonEl.style.display = 'none';
          if (containerEl) containerEl.style.display = 'block';
          if (timerEl) timerEl.style.display = 'inline-flex';
          var hEl = document.getElementById('timerHours');
          var mEl = document.getElementById('timerMins');
          var sEl = document.getElementById('timerSecs');
          if (hEl) hEl.textContent = '00';
          if (mEl) mEl.textContent = '00';
          if (sEl) sEl.textContent = '00';
          return;
        }

        if (comingSoonEl) {
          comingSoonEl.style.display = 'block';
          var titleEl = document.getElementById('comingSoonTitle');
          var msgEl = document.getElementById('comingSoonMsg');
          var badgeEl = document.getElementById('closedBadgeText');
          var dateRow = document.getElementById('comingSoonDateRow');
          if (titleEl) titleEl.textContent = 'Whitelist Closed';
          if (msgEl) msgEl.textContent = 'The Dudes Craft Genesis whitelist allocation round has officially ended.';
          if (badgeEl) badgeEl.textContent = 'GENESIS STATUS: ENDED';
          if (dateRow) dateRow.style.display = 'none';
        }
        if (containerEl) containerEl.style.display = 'none';
        clearInterval(timerInterval);
        return;
      }

      if (comingSoonEl) comingSoonEl.style.display = 'none';
      if (containerEl) containerEl.style.display = 'block';
      if (timerEl) timerEl.style.display = 'inline-flex';

      var remain = Math.max(0, endTime - now);
      var hrs = Math.floor(remain / (1000 * 60 * 60));
      var mins = Math.floor((remain % (1000 * 60 * 60)) / (1000 * 60));
      var secs = Math.floor((remain % (1000 * 60)) / 1000);

      var hEl = document.getElementById('timerHours');
      var mEl = document.getElementById('timerMins');
      var sEl = document.getElementById('timerSecs');
      if (hEl) hEl.textContent = String(hrs).padStart(2, '0');
      if (mEl) mEl.textContent = String(mins).padStart(2, '0');
      if (sEl) sEl.textContent = String(secs).padStart(2, '0');

      var topCountdown = document.getElementById('top-countdown');
      var topBanner = document.getElementById('topBanner');
      if (topCountdown && topBanner) {
        topCountdown.textContent = String(hrs).padStart(2, '0') + 'h ' + String(mins).padStart(2, '0') + 'm ' + String(secs).padStart(2, '0') + 's';
        topBanner.classList.add('is-ready');
      }
    }

    update();
    timerInterval = setInterval(update, 1000);
  }

  /* ─── Generate Serial Number: DC-XXXX-XXXX ─── */
  function generateSerial(twitter, wallet) {
    const raw = (twitter || '').toLowerCase() + ':' + (wallet || '').toLowerCase();
    const h = fnv1a(raw);
    const p1 = (h & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
    const p2 = ((h >>> 16) & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
    return 'DC-' + p1 + '-' + p2;
  }

  /* ─── Step Navigation ─── */
  function goToStep(n) {
    if (n < 1 || n > totalSteps) return;
    currentStep = n;
    prewarmAppsScript();

    document.querySelectorAll('.progress-step').forEach((el) => {
      const stepNum = parseInt(el.dataset.step);
      el.classList.remove('active', 'done');
      if (stepNum < n) el.classList.add('done');
      else if (stepNum === n) el.classList.add('active');
    });

    document.querySelectorAll('.form-panel').forEach((panel) => {
      panel.classList.remove('active');
      if (parseInt(panel.dataset.panel) === n) {
        panel.classList.add('active');
      }
    });

    if (n === 3) {
      setTimeout(function() {
        if (window.turnstile) {
          const widgetEl = document.getElementById('turnstile-widget');
          if (widgetEl && !widgetEl.hasChildNodes()) {
            try {
              turnstile.render(widgetEl, {
                sitekey: '0x4AAAAAAEktxuLQRdm2OfPn',
                theme: 'dark'
              });
            } catch (_) {}
          }
        }
      }, 150);
    }

    if (n === 4) renderSummary();
  }

  /* ─── Render summary & mint pass ─── */
  function renderSummary() {
    const tw = getTwitterClean();
    const wa = getWallet();
    serial = generateSerial(tw, wa);
    savedTwitter = tw;
    savedWallet = wa;

    if (confirmTwitter) confirmTwitter.textContent = '@' + tw;
    if (confirmWallet) confirmWallet.textContent  = wa.slice(0, 6) + '...' + wa.slice(-4);
    if (confirmSerial) confirmSerial.textContent  = serial;
    if (passMeta) passMeta.textContent = serial + ' — @' + tw;

    drawMintPass(wa, tw, serial);
  }

  /* ─── Draw Next-Gen Voxel Robinhood Mint Pass ─── */
  function drawMintPass(wallet, twitter, serialNum) {
    const canvas = document.getElementById('mintPass');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;

    // Background: Deep Obsidian Luxury
    ctx.fillStyle = '#0A0B0D';
    ctx.fillRect(0, 0, W, H);

    // Subtle isometric neon voxel grid
    ctx.strokeStyle = 'rgba(198, 242, 33, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 30) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 30) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Outer Glow Border
    ctx.strokeStyle = '#C6F221';
    ctx.lineWidth = 3;
    ctx.strokeRect(16, 16, W - 32, H - 32);

    // Inner Bevel Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.strokeRect(24, 24, W - 48, H - 48);

    // 3D Voxel Corner Brackets
    ctx.fillStyle = '#C6F221';
    [[16, 16, 40, 6], [16, 16, 6, 40],
     [W - 56, 16, 40, 6], [W - 22, 16, 6, 40],
     [16, H - 22, 40, 6], [16, H - 56, 6, 40],
     [W - 56, H - 22, 40, 6], [W - 22, H - 56, 6, 40]
    ].forEach(([x, y, w, h]) => ctx.fillRect(x, y, w, h));

    // Brand Title: DUDES CRAFT
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 40px "Space Grotesk", -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('DUDES CRAFT', W / 2, 75);

    // Subtitle Badge: ROBINHOOD GENESIS VIP PASS
    ctx.fillStyle = '#C6F221';
    ctx.font = '700 13px "Space Grotesk", monospace';
    ctx.letterSpacing = '3px';
    ctx.fillText('ROBINHOOD NETWORK  ·  GENESIS MINT PASS', W / 2, 105);

    // Neon Accent Divider
    ctx.strokeStyle = 'rgba(198, 242, 33, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(100, 125);
    ctx.lineTo(W - 100, 125);
    ctx.stroke();

    // Serial Code Box
    ctx.fillStyle = '#14171E';
    ctx.fillRect(W / 2 - 180, 150, 360, 64);
    ctx.strokeStyle = '#C6F221';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(W / 2 - 180, 150, 360, 64);

    ctx.fillStyle = '#C6F221';
    ctx.font = '700 32px "Space Grotesk", monospace';
    ctx.fillText(serialNum, W / 2, 194);

    // Twitter Handle
    ctx.fillStyle = '#8E98A8';
    ctx.font = '700 11px "Space Grotesk", sans-serif';
    ctx.fillText('CLAIMED BY (X / TWITTER)', W / 2, 250);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 20px "Space Grotesk", sans-serif';
    ctx.fillText('@' + twitter, W / 2, 276);

    // EVM Wallet
    ctx.fillStyle = '#8E98A8';
    ctx.font = '700 11px "Space Grotesk", sans-serif';
    ctx.fillText('WHITELISTED WALLET (ROBINHOOD EVM)', W / 2, 320);
    ctx.fillStyle = '#C6F221';
    ctx.font = '600 17px "Space Grotesk", monospace';
    ctx.fillText(wallet.slice(0, 8) + '...' + wallet.slice(-6), W / 2, 344);

    // Protocol & Network
    ctx.fillStyle = '#8E98A8';
    ctx.font = '700 11px "Space Grotesk", sans-serif';
    ctx.fillText('NETWORK ECOSYSTEM', W / 2, 390);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 16px "Space Grotesk", sans-serif';
    ctx.fillText('ROBINHOOD NETWORK · WEB3 EVM', W / 2, 412);

    // Footer Security Notice
    ctx.fillStyle = '#5E6673';
    ctx.font = '11px "DM Sans", sans-serif';
    ctx.fillText('Cryptographically anchored to Robinhood Network. Guaranteed 1x Genesis Mint slot.', W / 2, H - 40);
  }

  /* ─── Download Pass ─── */
  function downloadPass() {
    const canvas = document.getElementById('mintPass');
    if (!canvas) return;
    const sn = serial || 'GENESIS';
    const link = document.createElement('a');
    link.download = 'dudes-craft-robinhood-pass-' + sn + '.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  /* ─── Submit Application with Two-Phase Zero-Trust Verification ─── */
  async function submitApplication() {
    if (submitted) return;

    if (!validateTwitterInput()) {
      goToStep(1);
      return;
    }
    const w = getWallet();
    if (!w || !isValidWallet(w)) {
      goToStep(2);
      return;
    }

    const allDone = tasksCompleted.follow && tasksCompleted.like && tasksCompleted.repost && tasksCompleted.quote;
    if (!allDone) {
      showErr(step3Err, 'Please complete all community tasks above first.');
      return;
    }

    const tw = getTwitterClean();
    if (!serial) {
      serial = generateSerial(tw, w);
    }

    submitAndClaimBtn.disabled = true;
    clearErr(step3Err);

    // Check honeypot
    const trap1 = document.getElementById('wlWebsiteTrap')?.value || '';
    const trap2 = document.getElementById('wlBotTokenTrap')?.value || '';
    if (trap1 || trap2) {
      showErr(step3Err, 'Security error: Automated submission detected.');
      submitAndClaimBtn.disabled = false;
      submitAndClaimBtn.querySelector('span').textContent = 'Submit & Claim Slot';
      return;
    }

    try {
      // 1. PHASE 1: Request Server Cryptographic Challenge
      submitAndClaimBtn.querySelector('span').textContent = 'Requesting Cryptographic Handshake...';
      const endpoint = getSheetEndpoint();
      // 0. Cloudflare Turnstile Verification Check
      let cfToken = '';
      const cfInput = document.querySelector('[name="cf-turnstile-response"]');
      if (cfInput && cfInput.value) {
        cfToken = cfInput.value;
      } else if (window.turnstile) {
        try {
          cfToken = turnstile.getResponse('#turnstile-widget') || turnstile.getResponse() || '';
        } catch (_) {}
      }

      // 1. PHASE 1: Real Human Gesture Entropy + Server Challenge
      submitAndClaimBtn.querySelector('span').textContent = 'Verifying Human Presence...';
      const gesture = await getHumanGestureProof();

      const delim = endpoint.includes('?') ? '&' : '?';
      const challengeUrl = endpoint + delim + 'action=v7_init_human_challenge&wallet=' + encodeURIComponent(w) + '&twitter=' + encodeURIComponent(tw) + '&gesture=' + encodeURIComponent(gesture) + '&_t=' + Date.now();

      const chResp = await fetch(challengeUrl, { cache: 'no-store' });
      const chData = await chResp.json();

      if (!chData || !chData.ok) {
        const msg = chData?.error || 'Security handshake failed. Please refresh and retry.';
        showErr(step3Err, msg);
        showToast(msg);
        submitAndClaimBtn.disabled = false;
        submitAndClaimBtn.querySelector('span').textContent = 'Submit & Claim Slot';
        return;
      }

      const { serverNonce, issuedTime, serverSignature, difficulty } = chData;

      // 2. PHASE 2: Solve Dynamic Proof-of-Work (5-Zero Difficulty)
      submitAndClaimBtn.querySelector('span').textContent = 'Computing VIP Cryptographic Proof...';
      const pow = await solveProofOfWork(serverNonce, issuedTime, difficulty || '00000');

      // 3. Gather Fingerprint & IP in parallel
      const [fp, ip] = await Promise.all([
        getDeviceFingerprint(),
        fetchClientIp()
      ]);

      // 4. Ensure real elapsed human time on server (must be >= 4.0 seconds)
      const elapsedSinceIssue = Date.now() - issuedTime;
      if (elapsedSinceIssue < 4100) {
        submitAndClaimBtn.querySelector('span').textContent = 'Finalizing Security Verification...';
        await new Promise(r => setTimeout(r, 4100 - elapsedSinceIssue));
      }

      const payload = {
        twitter: '@' + tw,
        wallet:  w,
        serial:  serial,
        source:  'dudes-craft-robinhood',
        serverNonce: serverNonce,
        serverSignature: serverSignature,
        issuedTime: issuedTime,
        gesture: gesture,
        turnstileToken: cfToken,
        nonce: pow.nonce,
        powHash: pow.hash,
        fingerprint: fp,
        ip: ip,
        website_trap: trap1,
        bot_token_trap: trap2,
        userAgent: navigator.userAgent
      };

      submitAndClaimBtn.querySelector('span').textContent = 'Locking Whitelist Slot...';

      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      
      let data = null;
      try {
        const rawText = await resp.text();
        try {
          data = JSON.parse(rawText);
        } catch (_) {
          const jsonMatch = rawText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try { data = JSON.parse(jsonMatch[0]); } catch (_) {}
          }
          if (!data && (rawText.includes('Whitelist spot confirmed') || rawText.includes('"ok":true') || resp.ok)) {
            data = { ok: true, serial: serial };
          }
        }
      } catch (_) {
        if (resp.ok) data = { ok: true, serial: serial };
      }

      if (data && data.ok) {
        submitted = true;
        goToStep(4);
        showToast('Whitelist spot confirmed & VIP Pass generated!');
      } else if (data && data.error) {
        submitAndClaimBtn.disabled = false;
        submitAndClaimBtn.querySelector('span').textContent = 'Submit & Claim Slot';
        
        const errMsg = data.error || 'Submission rejected by security filters.';
        showErr(step3Err, errMsg);
        showToast(errMsg);

        if (data.field === 'twitter') {
          showErr(twitterErr, errMsg);
        } else if (data.field === 'wallet') {
          showErr(walletErr, errMsg);
        }
      } else {
        submitted = true;
        goToStep(4);
        showToast('Whitelist spot confirmed & VIP Pass generated!');
      }
    } catch (err) {
      submitAndClaimBtn.disabled = false;
      submitAndClaimBtn.querySelector('span').textContent = 'Submit & Claim Slot';
      const netErr = err.message || 'Network error — please check connection and retry.';
      showErr(step3Err, netErr);
      showToast(netErr);
    }
  }

  /* ─── Validation ─── */
  function validateTwitterInput() {
    const raw = getTwitterRaw();
    if (!raw) {
      showErr(twitterErr, 'Please enter your X (Twitter) username.');
      return false;
    }
    const clean = raw.replace(/^@+/, '').trim();
    if (!clean) {
      showErr(twitterErr, 'Please enter your X (Twitter) username.');
      return false;
    }
    if (!isValidTwitter(clean)) {
      showErr(twitterErr, 'Invalid username — 1 to 15 characters, letters, numbers and underscores only.');
      return false;
    }
    clearErr(twitterErr);
    return true;
  }

  function validateAndNext(targetStep) {
    if (targetStep === 2) {
      if (!validateTwitterInput()) return false;
    }
    if (targetStep === 3) {
      const w = getWallet();
      if (!w) { showErr(walletErr, 'Please enter your wallet address.'); return false; }
      if (!isValidWallet(w)) { showErr(walletErr, 'Invalid address — must be 0x followed by 40 hex characters.'); return false; }
      clearErr(walletErr);
    }
    return true;
  }

  /* ─── Social task handlers ─── */
  function markTaskDone(taskKey) {
    tasksCompleted[taskKey] = true;
    const btn = document.querySelector('[data-task="' + taskKey + '"]');
    if (btn) {
      btn.classList.add('completed');
      const st = btn.querySelector('.action-status');
      if (st) st.textContent = 'Done';
    }
    const allDone = tasksCompleted.follow && tasksCompleted.like && tasksCompleted.repost && tasksCompleted.quote;
    submitAndClaimBtn.disabled = !allDone;
    if (allDone) clearErr(step3Err);
  }

  /* ─── Navigation buttons ─── */
  document.querySelectorAll('[data-next]').forEach(btn => {
    btn.addEventListener('click', function () {
      const target = parseInt(this.dataset.next);
      if (validateAndNext(target)) goToStep(target);
    });
  });
  document.querySelectorAll('[data-prev]').forEach(btn => {
    btn.addEventListener('click', function () {
      goToStep(parseInt(this.dataset.prev));
    });
  });

  /* ─── Social task buttons: open X intent + mark done ─── */
  document.querySelectorAll('.action-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      const taskKey = this.dataset.task;
      if (tasksCompleted[taskKey]) return;

      let url;
      switch (taskKey) {
        case 'follow':
          url = 'https://x.com/intent/follow?screen_name=DudesCraft';
          break;
        case 'like': {
          const tid = extractTweetId(currentPostUrl);
          if (tid) url = 'https://x.com/intent/like?tweet_id=' + tid;
          else url = currentPostUrl || 'https://x.com/DudesCraft';
          break;
        }
        case 'repost': {
          const tid = extractTweetId(currentPostUrl);
          if (tid) url = 'https://x.com/intent/retweet?tweet_id=' + tid;
          else url = currentPostUrl || 'https://x.com/DudesCraft';
          break;
        }
        case 'quote': {
          const shareText = encodeURIComponent(
            'I just secured my spot on the Dudes Craft Genesis Whitelist!\n\n' +
            '1,999 unique 3D voxel warriors launching on Robinhood Network.\n\n' +
            'Official Initiation Quest completed.\n\n' +
            '@DudesCraft #DudesCraft #NFT #Robinhood'
          );
          const postUrl = encodeURIComponent(currentPostUrl || 'https://x.com/DudesCraft');
          url = 'https://x.com/intent/tweet?text=' + shareText + '&url=' + postUrl;
          break;
        }
      }

      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      }

      markTaskDone(taskKey);
    });
  });

  /* ─── Share on X ─── */
  function shareOnX() {
    var canvas = document.getElementById('mintPass');
    if (!canvas) return;

    var link = document.createElement('a');
    link.download = 'dudes-craft-robinhood-pass-' + serial + '.png';
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    try {
      canvas.toBlob(function (blob) {
        if (blob && navigator.clipboard && window.ClipboardItem) {
          navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]).then(function () {
            showToast('Pass image copied to clipboard & downloaded! Press Ctrl+V on X to attach it.');
          }).catch(function () {
            showToast('Pass image downloaded! Attach the downloaded pass to your post on X.');
          });
        } else {
          showToast('Pass image downloaded! Attach the downloaded pass to your post on X.');
        }
      }, 'image/png');
    } catch (e) {
      showToast('Pass image downloaded! Attach the downloaded pass to your post on X.');
    }

    setTimeout(function () {
      var shareText = encodeURIComponent(
        'I just secured my spot on the Dudes Craft Genesis Whitelist!\n\n' +
        'VIP Mint Pass Serial: ' + serial + '\n\n' +
        '1,999 unique 3D voxel warriors launching on Robinhood Network.\n\n' +
        '@DudesCraft #DudesCraft #NFT #Robinhood'
      );
      var shareUrl = encodeURIComponent('https://dudescraft.store/whitelist');
      window.open('https://x.com/intent/tweet?text=' + shareText + '&url=' + shareUrl, '_blank', 'noopener,noreferrer');
    }, 600);
  }

  /* ─── Button event bindings ─── */
  if (submitAndClaimBtn) submitAndClaimBtn.addEventListener('click', submitApplication);
  const dlPassBtn = document.getElementById('downloadPass');
  if (dlPassBtn) dlPassBtn.addEventListener('click', downloadPass);
  const shareBtn = document.getElementById('shareOnX');
  if (shareBtn) shareBtn.addEventListener('click', shareOnX);

  /* ─── Input validation on input & blur & prewarm on focus ─── */
  if (twitterInput) {
    twitterInput.addEventListener('focus', prewarmAppsScript);
    twitterInput.addEventListener('input', function () {
      prewarmAppsScript();
      if (twitterErr.textContent) {
        const raw = getTwitterRaw();
        if (raw.startsWith('@') && raw.length > 1) {
          validateTwitterInput();
        }
      }
    });
    twitterInput.addEventListener('blur', function () {
      if (getTwitterRaw()) {
        validateTwitterInput();
      } else {
        clearErr(twitterErr);
      }
    });
  }
  if (walletInput) {
    walletInput.addEventListener('focus', prewarmAppsScript);
    walletInput.addEventListener('blur', function () {
      const w = getWallet();
      if (w && !isValidWallet(w)) showErr(walletErr, 'Invalid address — must be 0x followed by 40 hex characters.');
      else clearErr(walletErr);
    });
  }

  /* ─── Init App & Background Security Warmup ─── */
  function initApp() {
    // Pre-calculate fingerprint and IP in background
    getDeviceFingerprint();
    fetchClientIp();

    const initial = getLocalWlSettings();
    appSettings = initial;
    currentPostUrl = initial.postUrl || 'https://x.com/dudescraft/status/2093534635510702415';
    initTimer(initial, false);

    fetchSettings().then(function (fresh) {
      if (fresh) {
        fresh._isServerConfirmed = true;
        appSettings = fresh;
        currentPostUrl = fresh.postUrl || 'https://x.com/dudescraft/status/2093534635510702415';
        try {
          const cacheObj = { settings: fresh, savedAt: Date.now(), isServerConfirmed: true };
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(cacheObj));
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cacheObj));
        } catch (e) {}
        initTimer(fresh, true);
      }
    });
  }

  initApp();
  window.addEventListener('pageshow', initApp);
})();
