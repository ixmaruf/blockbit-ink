(function () {
  'use strict';

  /* ─── State ─── */
  let currentStep = 1;
  const totalSteps = 4;
  let serial = '';
  let submitted = false;
  const tasksCompleted = { follow: false, like: false };
  let savedWallet = '';
  let savedTwitter = '';

  /* ─── DOM refs ─── */
  const twitterInput = document.getElementById('twitterHandle');
  const walletInput  = document.getElementById('walletAddr');
  const twitterErr   = document.getElementById('twitterError');
  const walletErr    = document.getElementById('walletError');
  const submitStatus = document.getElementById('submitStatus');
  const confirmTwitter = document.getElementById('confirmTwitter');
  const confirmWallet  = document.getElementById('confirmWallet');
  const confirmSerial  = document.getElementById('confirmSerial');
  const passMeta       = document.getElementById('passMeta');
  const continueBtn    = document.getElementById('continueStep3');

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

  /* ─── FNV-1a (32-bit) ─── */
  function fnv1a(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
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

  /* ─── Draw mint pass ─── */
  function drawMintPass(wallet, twitter, serialNum) {
    const canvas = document.getElementById('mintPass');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;

    ctx.fillStyle = '#0b0b0f';
    ctx.fillRect(0, 0, W, H);

    // Border glow
    ctx.strokeStyle = 'rgba(200, 170, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, W - 20, H - 20);

    // Corner accents
    ctx.fillStyle = 'rgba(168, 130, 255, 0.6)';
    [[12,12,30,3],[12,12,3,30],[W-42,12,30,3],[W-15,12,3,30],
     [12,H-15,30,3],[12,H-42,3,30],[W-42,H-15,30,3],[W-15,H-42,3,30]
    ].forEach(([x,y,w,h]) => ctx.fillRect(x,y,w,h));

    // Title
    ctx.fillStyle = '#e0d5ff';
    ctx.font = 'bold 36px "Silkscreen", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('BLOCKBIT INK', W/2, 70);
    ctx.fillStyle = '#8a7abb';
    ctx.font = '16px "Silkscreen", monospace';
    ctx.fillText('WHITELIST PASS — GENESIS COLLECTION', W/2, 100);

    // Divider
    ctx.strokeStyle = 'rgba(168, 130, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(80,120); ctx.lineTo(W-80,120); ctx.stroke();

    // Serial
    ctx.fillStyle = '#bba8ff';
    ctx.font = 'bold 42px "Silkscreen", monospace';
    ctx.fillText(serialNum, W/2, 180);

    // Twitter
    ctx.fillStyle = '#8a7abb';
    ctx.font = '14px "Silkscreen", monospace';
    ctx.fillText('TWITTER', W/2, 230);
    ctx.fillStyle = '#e0d5ff';
    ctx.font = '18px "Silkscreen", monospace';
    ctx.fillText('@' + twitter, W/2, 255);

    // Wallet
    ctx.fillStyle = '#8a7abb';
    ctx.font = '14px "Silkscreen", monospace';
    ctx.fillText('WALLET', W/2, 300);
    ctx.fillStyle = '#e0d5ff';
    ctx.font = '16px "Silkscreen", monospace';
    ctx.fillText(wallet.slice(0,6) + '...' + wallet.slice(-4), W/2, 325);

    // Network
    ctx.fillStyle = '#8a7abb';
    ctx.font = '14px "Silkscreen", monospace';
    ctx.fillText('NETWORK', W/2, 370);
    ctx.fillStyle = '#e0d5ff';
    ctx.font = '18px "Silkscreen", monospace';
    ctx.fillText('INK (EVM)', W/2, 395);

    // Footer
    ctx.fillStyle = '#5a4f7a';
    ctx.font = '11px "Silkscreen", monospace';
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

  /* ─── Submit to Google Sheets ─── */
  async function submitApplication() {
    if (submitted) return;
    submitted = true;

    const btn = document.getElementById('submitFinal');
    btn.disabled = true;
    btn.querySelector('span').textContent = 'Submitting...';
    submitStatus.textContent = '';
    submitStatus.className = 'submit-status';

    const payload = {
      twitter: '@' + getTwitterClean(),
      wallet:  getWallet(),
      serial:  serial,
      source:  'blockbit-ink-site',
      ts:      new Date().toISOString()
    };

    try {
      const resp = await fetch(BLOCKBIT_CONFIG.sheetEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      const data = await resp.json();

      if (data.ok) {
        submitted = true;
        localStorage.setItem('blockbit-whitelisted', '1');
        localStorage.setItem('blockbit-serial', serial);
        document.querySelectorAll('.form-panel').forEach(p => p.classList.remove('active'));
        document.querySelector('[data-panel="success"]').classList.add('active');
        document.getElementById('successMessage').textContent =
          data.duplicate
            ? 'This wallet has already been whitelisted. Your serial is ' + serial + '.'
            : 'Your whitelist application has been recorded. Your serial is ' + serial + '. Keep it safe — you will need it to claim your mint slot.';
      } else {
        throw new Error(data.error || 'Submission failed');
      }
    } catch (err) {
      submitted = false;
      btn.disabled = false;
      btn.querySelector('span').textContent = 'Submit & Claim Slot';
      submitStatus.textContent = err.message || 'Network error — please try again.';
      submitStatus.className = 'submit-status error';
    }
  }

  /* ─── Validation ─── */
  function validateAndNext(targetStep) {
    if (targetStep === 2) {
      const v = getTwitterClean();
      if (!v) { showErr(twitterErr, 'Please enter your X username.'); return false; }
      if (!isValidTwitter(v)) { showErr(twitterErr, 'Invalid username — 1-15 letters, numbers, underscores only.'); return false; }
      clearErr(twitterErr);
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
    continueBtn.disabled = !(tasksCompleted.follow && tasksCompleted.like);
  }

  /* ─── Init: restore from localStorage ─── */
  if (localStorage.getItem('blockbit-whitelisted') === '1') {
    document.querySelectorAll('.form-panel').forEach(p => p.classList.remove('active'));
    document.querySelector('[data-panel="success"]').classList.add('active');
    const savedSerial = localStorage.getItem('blockbit-serial') || '';
    document.getElementById('successMessage').textContent =
      'You have already submitted your whitelist application. Your serial is ' + savedSerial + '.';
    serial = savedSerial;
    return;
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

  /* ─── Social task buttons: open X tab + mark done ─── */
  document.querySelectorAll('.action-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      const taskKey = this.dataset.task;
      if (tasksCompleted[taskKey]) return; // already done

      // Open X in new tab
      if (taskKey === 'follow') {
        window.open('https://x.com/BlockbitInk', '_blank', 'noopener,noreferrer');
      } else if (taskKey === 'like') {
        window.open('https://x.com/BlockbitInk', '_blank', 'noopener,noreferrer');
      }

      // Mark done client-side (like minibroker pattern)
      markTaskDone(taskKey);
    });
  });

  /* ─── Confirm step buttons ─── */
  document.getElementById('downloadPass').addEventListener('click', downloadPass);
  document.getElementById('downloadSuccess').addEventListener('click', downloadPass);
  document.getElementById('submitFinal').addEventListener('click', submitApplication);

  /* ─── Input validation on blur ─── */
  twitterInput.addEventListener('blur', function () {
    const v = getTwitterClean();
    if (v && !isValidTwitter(v)) showErr(twitterErr, 'Invalid username — 1-15 letters, numbers, underscores only.');
    else clearErr(twitterErr);
  });
  walletInput.addEventListener('blur', function () {
    const w = getWallet();
    if (w && !isValidWallet(w)) showErr(walletErr, 'Invalid address — must be 0x followed by 40 hex characters.');
    else clearErr(walletErr);
  });
})();
