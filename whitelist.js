(function () {
  'use strict';

  // Clean .html extension from URL bar
  if (window.location.pathname.endsWith('.html')) {
    var clean = window.location.pathname.replace(/(?:index)?\.html$/, '');
    if (!clean || clean.endsWith('/')) clean = clean || '/';
    window.history.replaceState(null, '', clean + window.location.search + window.location.hash);
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
  function showErr(el, msg) { el.textContent = msg; }
  function clearErr(el) { el.textContent = ''; }

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

  /* ─── Endpoint Config & Settings with built-in fallback ─── */
  const DEFAULT_ENDPOINT = 'https://script.google.com/macros/s/AKfycbyy_q-cX2WCgTSrbvjlxuRBHuzFiPQYDroGolgcPD_UWXEctuDybTwpK56-iT7pyHY/exec';
  const DEFAULT_WL_SETTINGS = {
    whitelistOpen: 'On',
    timerStart: '2026-08-26 05:40',
    timerDuration: '12',
    postUrl: 'https://x.com/BlockbitInk'
  };

  function getLocalWlSettings() {
    try {
      const raw = localStorage.getItem('bbi_wl_settings') || sessionStorage.getItem('bbi_wl_settings');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch (e) {}
    return DEFAULT_WL_SETTINGS;
  }

  function getSheetEndpoint() {
    return (window.BLOCKBIT_CONFIG && window.BLOCKBIT_CONFIG.sheetEndpoint)
      ? window.BLOCKBIT_CONFIG.sheetEndpoint
      : DEFAULT_ENDPOINT;
  }

  /* ─── Extract tweet ID from URL ─── */
  function extractTweetId(url) {
    if (!url) return null;
    const match = url.match(/status(?:es)?\/(\d+)/i) || url.match(/\/(\d{15,25})/);
    return match ? match[1] : null;
  }

  /* ─── Fetch settings from Apps Script (Always Fresh) ─── */
  async function fetchSettings() {
    try {
      const url = getSheetEndpoint() + '?action=settings&_nocache=' + Date.now();
      const resp = await fetch(url, { cache: 'no-store' });
      const data = await resp.json();
      if (data.ok && data.settings) return data.settings;
    } catch (err) {
      console.warn('Settings fetch failed, using defaults:', err);
    }
    return null;
  }

  /* ─── Initialize countdown timer ─── */
  function initTimer(settings) {
    var timerEl = document.getElementById('wlTimer');
    var comingSoonEl = document.getElementById('wlComingSoon');
    var containerEl = document.querySelector('.wl-container');
    
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    
    // Check if explicitly closed
    var isOpen = settings.whitelistOpen !== 'false' && settings.whitelistOpen !== 'Off';
    
    // Parse Bangladesh time format (YYYY-MM-DD HH:mm) as UTC+6
    var startStr = settings.timerStart || '';
    var startMs;
    if (startStr.indexOf('T') > -1) {
      startMs = new Date(startStr).getTime();
    } else {
      // Bangladesh time (UTC+6): "2026-08-26 01:50" → treat as UTC+6
      var parts = startStr.split(' ');
      var dateParts = (parts[0] || '').split('-');
      var timeParts = (parts[1] || '').split(':');
      var y = parseInt(dateParts[0]) || 2026;
      var m = parseInt(dateParts[1]) || 1;
      var d = parseInt(dateParts[2]) || 1;
      var hh = parseInt(timeParts[0]) || 0;
      var mm = parseInt(timeParts[1]) || 0;
      // Convert from Bangladesh (UTC+6) to UTC
      startMs = Date.UTC(y, m - 1, d, hh - 6, mm);
    }
    var durationMs = parseInt(settings.timerDuration || '12') * 60 * 60 * 1000;
    var endTime = startMs + durationMs;

    function updateTimer() {
      var now = Date.now();
      var remaining = endTime - now;

      if (!isOpen || remaining <= 0) {
        if (timerEl) timerEl.style.display = 'none';
        if (containerEl) containerEl.style.display = 'none';
        if (comingSoonEl) {
          comingSoonEl.classList.add('active');
          const titleEl = document.getElementById('comingSoonTitle');
          const msgEl = document.getElementById('comingSoonMsg');
          if (!isOpen) {
            if (titleEl) titleEl.textContent = 'Whitelist Closed';
            if (msgEl) msgEl.textContent = 'The whitelist is currently paused or closed.';
          } else {
            if (titleEl) titleEl.textContent = 'Coming Soon';
            const dateEl = document.getElementById('comingSoonDate');
            if (dateEl) {
              const openDate = new Date(endTime);
              dateEl.textContent = openDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            }
          }
        }
        return;
      }

      var hours = Math.floor(remaining / (1000 * 60 * 60));
      var mins = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      var secs = Math.floor((remaining % (1000 * 60)) / 1000);

      var hrEl = document.getElementById('timerHours');
      var minEl = document.getElementById('timerMins');
      var secEl = document.getElementById('timerSecs');

      if (hrEl) hrEl.textContent = hours.toString().padStart(2, '0');
      if (minEl) minEl.textContent = mins.toString().padStart(2, '0');
      if (secEl) secEl.textContent = secs.toString().padStart(2, '0');
    }

    updateTimer();
    if (timerEl) timerEl.classList.add('loaded');
    if (isOpen) {
      timerInterval = setInterval(updateTimer, 1000);
    }
  }

  /* ─── Serial (no clan) ─── */
  function generateSerial(twitter, wallet) {
    const h = fnv1a(twitter + '|' + wallet + '|blockbit-ink-2026');
    const block = (h % 1999) + 1;
    const hex   = (h >>> 0).toString(16).slice(0, 6).toUpperCase().padStart(6, '0');
    return 'BBI-' + String(block).padStart(4, '0') + '-' + hex;
  }

  /* ─── Progress bar ─── */
  function updateProgress() {
    document.querySelectorAll('.progress-step').forEach(s => {
      const step = parseInt(s.dataset.step);
      s.classList.toggle('active', step === currentStep);
      s.classList.toggle('done', step < currentStep);
    });
  }

  /* ─── Step navigation ─── */
  function goToStep(n) {
    if (n < 1 || n > totalSteps) return;
    currentStep = n;
    document.querySelectorAll('.form-panel').forEach(p => p.classList.remove('active'));
    const target = document.querySelector('[data-panel="' + n + '"]');
    if (target) target.classList.add('active');
    updateProgress();
    if (n === 4) renderSummary();
  }

  /* ─── Render summary & mint pass ─── */
  function renderSummary() {
    const tw = getTwitterClean();
    const wa = getWallet();
    serial = generateSerial(tw, wa);
    savedTwitter = tw;
    savedWallet = wa;

    confirmTwitter.textContent = '@' + tw;
    confirmWallet.textContent  = wa.slice(0, 6) + '...' + wa.slice(-4);
    confirmSerial.textContent  = serial;
    passMeta.textContent       = serial + ' — ' + tw;

    drawMintPass(wa, tw, serial);
  }

  /* ─── Draw mint pass (light theme) ─── */
  function drawMintPass(wallet, twitter, serialNum) {
    const canvas = document.getElementById('mintPass');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;

    // Light background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, W, H);

    // Subtle grid pattern
    ctx.strokeStyle = 'rgba(14, 165, 233, 0.08)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < W; x += 20) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 20) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Border
    ctx.strokeStyle = 'rgba(124, 58, 237, 0.2)';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, W - 20, H - 20);

    // Corner accents
    ctx.fillStyle = 'rgba(124, 58, 237, 0.5)';
    [[12,12,30,3],[12,12,3,30],[W-42,12,30,3],[W-15,12,3,30],
     [12,H-15,30,3],[12,H-42,3,30],[W-42,H-15,30,3],[W-15,H-42,3,30]
    ].forEach(([x,y,w,h]) => ctx.fillRect(x,y,w,h));

    // Title
    ctx.fillStyle = '#0B0A12';
    ctx.font = 'bold 36px "Cormorant Garamond", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('BLOCKBIT INK', W/2, 70);
    ctx.fillStyle = '#475569';
    ctx.font = '600 13px "DM Sans", system-ui, sans-serif';
    ctx.letterSpacing = '3px';
    ctx.fillText('WHITELIST PASS  ·  GENESIS COLLECTION', W/2, 100);

    // Divider
    ctx.strokeStyle = 'rgba(124, 58, 237, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(80,120); ctx.lineTo(W-80,120); ctx.stroke();

    // Serial
    ctx.fillStyle = '#7C3AED';
    ctx.font = 'bold 42px "Cormorant Garamond", Georgia, serif';
    ctx.fillText(serialNum, W/2, 180);

    // Twitter
    ctx.fillStyle = '#94A3B8';
    ctx.font = '600 11px "DM Sans", system-ui, sans-serif';
    ctx.fillText('TWITTER', W/2, 230);
    ctx.fillStyle = '#0B0A12';
    ctx.font = '600 18px "DM Sans", system-ui, sans-serif';
    ctx.fillText('@' + twitter, W/2, 255);

    // Wallet
    ctx.fillStyle = '#94A3B8';
    ctx.font = '600 11px "DM Sans", system-ui, sans-serif';
    ctx.fillText('WALLET', W/2, 300);
    ctx.fillStyle = '#0B0A12';
    ctx.font = '500 16px "DM Sans", system-ui, sans-serif';
    ctx.fillText(wallet.slice(0,6) + '...' + wallet.slice(-4), W/2, 325);

    // Network
    ctx.fillStyle = '#94A3B8';
    ctx.font = '600 11px "DM Sans", system-ui, sans-serif';
    ctx.fillText('NETWORK', W/2, 370);
    ctx.fillStyle = '#0B0A12';
    ctx.font = '600 18px "DM Sans", system-ui, sans-serif';
    ctx.fillText('INK (EVM)', W/2, 395);

    // Footer
    ctx.fillStyle = '#94A3B8';
    ctx.font = '11px "DM Sans", system-ui, sans-serif';
    ctx.fillText('This pass guarantees an allocation slot for the Blockbit Ink genesis mint.', W/2, H-40);
  }

  /* ─── Download ─── */
  function downloadPass() {
    const canvas = document.getElementById('mintPass');
    if (!canvas) return;
    const tw = savedTwitter || getTwitterClean();
    const sn = serial || localStorage.getItem('blockbit-serial') || 'unknown';
    const link = document.createElement('a');
    link.download = 'blockbit-ink-pass-' + sn + '.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  /* ─── Submit to Google Sheets (Directly on Step 3) ─── */
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
      showErr(step3Err, 'Please complete all social tasks above first.');
      return;
    }

    const tw = getTwitterClean();
    if (!serial) {
      serial = generateSerial(tw, w);
    }

    submitAndClaimBtn.disabled = true;
    submitAndClaimBtn.querySelector('span').textContent = 'Submitting & Verifying...';
    clearErr(step3Err);

    const payload = {
      twitter: '@' + tw,
      wallet:  w,
      serial:  serial,
      source:  'blockbit-ink-site',
      ts:      new Date().toISOString()
    };

    try {
      const resp = await fetch(getSheetEndpoint(), {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      const data = await resp.json();

      if (data.ok) {
        submitted = true;
        goToStep(4);
        showToast('Whitelist spot confirmed & Pass generated!');
      } else {
        submitAndClaimBtn.disabled = false;
        submitAndClaimBtn.querySelector('span').textContent = 'Submit & Claim Slot';
        
        const errMsg = data.error || 'Submission failed. Please try again.';
        showErr(step3Err, errMsg);
        showToast(errMsg);

        if (data.field === 'twitter') {
          showErr(twitterErr, errMsg);
        } else if (data.field === 'wallet') {
          showErr(walletErr, errMsg);
        }
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
      btn.querySelector('.action-status').textContent = 'Done';
    }
    const allDone = tasksCompleted.follow && tasksCompleted.like && tasksCompleted.repost && tasksCompleted.quote;
    submitAndClaimBtn.disabled = !allDone;
    if (allDone) clearErr(step3Err);
  }

  /* ─── Clear any old legacy cache on device ─── */
  try {
    localStorage.removeItem('blockbit_wl_settings');
    localStorage.removeItem('blockbit-whitelisted');
    localStorage.removeItem('blockbit-serial');
  } catch (e) {}

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
          url = 'https://x.com/intent/follow?screen_name=BlockbitInk';
          break;
        case 'like': {
          const tid = extractTweetId(currentPostUrl);
          if (tid) url = 'https://x.com/intent/like?tweet_id=' + tid;
          else url = currentPostUrl || 'https://x.com/BlockbitInk';
          break;
        }
        case 'repost': {
          const tid = extractTweetId(currentPostUrl);
          if (tid) url = 'https://x.com/intent/retweet?tweet_id=' + tid;
          else url = currentPostUrl || 'https://x.com/BlockbitInk';
          break;
        }
        case 'quote': {
          const shareText = encodeURIComponent(
            'I just secured my spot on the Blockbit Ink Whitelist.\n\n' +
            '1,999 unique pixel warriors forged on Ink Blockchain by Kraken.\n\n' +
            'Official Initiation Quest completed.\n\n' +
            '@BlockbitInk #BlockbitInk #NFT #InkBlockchain -'
          );
          const postUrl = encodeURIComponent(currentPostUrl || 'https://x.com/BlockbitInk');
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

  /* ─── Share on X (Auto copy image + download + intent) ─── */
  function shareOnX() {
    var canvas = document.getElementById('mintPass');
    if (!canvas) return;

    // 1. Download pass image
    var link = document.createElement('a');
    link.download = 'blockbit-ink-pass-' + serial + '.png';
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // 2. Attempt copying pass image directly to clipboard
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

    // 3. Open Twitter intent with URL parameter for automatic Large Card image preview
    setTimeout(function () {
      var shareText = encodeURIComponent(
        'I just secured my spot on the Blockbit Ink Whitelist.\n\n' +
        'Mint Pass Serial: ' + serial + '\n\n' +
        '1,999 unique pixel warriors forged on Ink Blockchain by Kraken.\n\n' +
        '@BlockbitInk #BlockbitInk #NFT #InkBlockchain -'
      );
      var shareUrl = encodeURIComponent('https://blockbit.ink/whitelist');
      window.open('https://x.com/intent/tweet?text=' + shareText + '&url=' + shareUrl, '_blank', 'noopener,noreferrer');
    }, 600);
  }

  /* ─── Button event bindings ─── */
  if (submitAndClaimBtn) submitAndClaimBtn.addEventListener('click', submitApplication);
  const dlPassBtn = document.getElementById('downloadPass');
  if (dlPassBtn) dlPassBtn.addEventListener('click', downloadPass);
  const shareBtn = document.getElementById('shareOnX');
  if (shareBtn) shareBtn.addEventListener('click', shareOnX);

  /* ─── Input validation on input & blur ─── */
  twitterInput.addEventListener('input', function () {
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
  walletInput.addEventListener('blur', function () {
    const w = getWallet();
    if (w && !isValidWallet(w)) showErr(walletErr, 'Invalid address — must be 0x followed by 40 hex characters.');
    else clearErr(walletErr);
  });

  /* ─── Init: 0ms Instant Render + Background Fresh Sync ─── */
  function initApp() {
    const initial = getLocalWlSettings();
    appSettings = initial;
    currentPostUrl = initial.postUrl || 'https://x.com/BlockbitInk';
    initTimer(initial);

    // Background fetch from Google Apps Script (non-blocking)
    fetchSettings().then(function (fresh) {
      if (fresh) {
        appSettings = fresh;
        currentPostUrl = fresh.postUrl || 'https://x.com/BlockbitInk';
        try {
          sessionStorage.setItem('bbi_wl_settings', JSON.stringify(fresh));
          localStorage.setItem('bbi_wl_settings', JSON.stringify(fresh));
        } catch (e) {}
        initTimer(fresh);
      }
    });
  }

  initApp();
  window.addEventListener('pageshow', initApp);
})();
