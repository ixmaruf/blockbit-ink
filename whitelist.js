/* Blockbit Ink — Whitelist flow controller
   4-step form: Social → Wallet → Clan → Mint Pass → Submit
   - Real EVM address + Twitter handle validation
   - localStorage persistence (re-open picks up where you left off)
   - Holographic mint pass canvas with download
   - Submissions POSTed to a Google Apps Script Web App (configured in
     whitelist-config.js) which appends to a private Google Sheet.
*/

(function () {
  'use strict';

  const STORAGE_KEY = 'blockbit-ink:whitelist';
  const ALLOWED_CLANS = ['Kaze', 'Honoo', 'Mizu', 'Tsuchi', 'Hikari', 'Kage'];

  // ---------------------------------------------------------------------------
  // Validation helpers
  // ---------------------------------------------------------------------------
  function stripTwitter(input) {
    if (!input) return '';
    let v = String(input).trim();
    if (v.startsWith('@')) v = v.slice(1);
    if (v.startsWith('https://twitter.com/')) v = v.slice('https://twitter.com/'.length);
    if (v.startsWith('https://x.com/')) v = v.slice('https://x.com/'.length);
    if (v.endsWith('/')) v = v.slice(0, -1);
    return v.replace(/[^a-zA-Z0-9_]/g, '');
  }

  function looksLikeTwitterHandle(raw) {
    if (!raw) return false;
    return /^@?[A-Za-z0-9_]{1,15}$/.test(String(raw).trim());
  }

  function isValidTwitterHandle(handle) {
    if (!handle) return false;
    return /^[A-Za-z0-9_]{1,15}$/.test(handle);
  }

  function isValidEvmAddress(addr) {
    if (!addr) return false;
    return /^0x[a-fA-F0-9]{40}$/.test(addr.trim());
  }

  function showFieldError(el, message) {
    if (!el) return;
    if (message) {
      el.textContent = message;
      el.classList.add('show');
    } else {
      el.textContent = '';
      el.classList.remove('show');
    }
  }

  function setFieldInvalid(input, invalid) {
    if (!input) return;
    input.classList.toggle('invalid', !!invalid);
  }

  // ---------------------------------------------------------------------------
  // State persistence (localStorage)
  // ---------------------------------------------------------------------------
  function loadState() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
    catch (_) { return {}; }
  }

  function saveState(s) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }
    catch (_) { /* quota / private mode */ }
  }

  function clearState() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
  }

  function markSubmitted(serial) {
    try { localStorage.setItem(STORAGE_KEY + ':submitted', JSON.stringify({ serial, at: Date.now() })); }
    catch (_) {}
  }

  function alreadySubmitted() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY + ':submitted') || 'null'); }
    catch (_) { return null; }
  }

  // ---------------------------------------------------------------------------
  // Progress + step navigation
  // ---------------------------------------------------------------------------
  function showStep(step) {
    document.querySelectorAll('.form-panel').forEach(p => p.classList.remove('active'));
    const target = document.querySelector(`[data-panel="${step}"]`);
    if (target) target.classList.add('active');

    document.querySelectorAll('.progress-step').forEach(s => {
      const sn = parseInt(s.dataset.step, 10);
      s.classList.remove('active', 'done');
      if (sn < step) s.classList.add('done');
      else if (sn === step) s.classList.add('active');
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function gotoStep(step, state) {
    saveState(Object.assign({}, state, { step }));
    showStep(step);
  }

  // ---------------------------------------------------------------------------
  // Submission status (UI states)
  // ---------------------------------------------------------------------------
  function showSubmitStatus(message, type) {
    const el = document.getElementById('submitStatus');
    if (!el) return;
    el.className = 'submit-status show ' + (type || '');
    el.textContent = message;
  }

  function clearSubmitStatus() {
    const el = document.getElementById('submitStatus');
    if (!el) return;
    el.className = 'submit-status';
    el.textContent = '';
  }

  function setSubmitButtonState(disabled) {
    const btn = document.getElementById('submitFinal');
    if (!btn) return;
    btn.disabled = !!disabled;
  }

  // ---------------------------------------------------------------------------
  // Step handlers
  // ---------------------------------------------------------------------------
  function nextStep(current, state) {
    if (current === 1) {
      const raw = document.getElementById('twitterHandle').value;
      if (!looksLikeTwitterHandle(raw)) {
        showFieldError(document.getElementById('twitterError'), 'Enter a valid Twitter handle (1–15 letters, digits, or underscores, with or without @).');
        setFieldInvalid(document.getElementById('twitterHandle'), true);
        return;
      }
      const handle = stripTwitter(raw);
      setFieldInvalid(document.getElementById('twitterHandle'), false);
      showFieldError(document.getElementById('twitterError'), null);
      state.twitter = handle;
      document.getElementById('twitterHandle').value = '@' + handle;
      gotoStep(2, state);
    } else if (current === 2) {
      const wallet = document.getElementById('walletAddr').value.trim();
      if (!isValidEvmAddress(wallet)) {
        showFieldError(document.getElementById('walletError'), 'Enter a valid 0x… Ethereum / Ink address (42 chars, hex).');
        setFieldInvalid(document.getElementById('walletAddr'), true);
        return;
      }
      setFieldInvalid(document.getElementById('walletAddr'), false);
      showFieldError(document.getElementById('walletError'), null);
      state.wallet = wallet;
      gotoStep(3, state);
    } else if (current === 3) {
      const selected = document.querySelector('input[name="clan"]:checked');
      if (!selected) {
        showFieldError(document.getElementById('clanError'), 'Pick one of the six clans.');
        return;
      }
      showFieldError(document.getElementById('clanError'), null);
      state.clan = selected.value;
      state.serial = generateSerial(state);
      saveState(state);
      renderMintPass(state);
      gotoStep(4, state);
    } else if (current === 4) {
      // Final submit — handled by submitFinal().
      submitFinal(state);
    }
  }

  function prevStep(current, state) {
    if (current > 1) gotoStep(current - 1, state);
  }

  // ---------------------------------------------------------------------------
  // Deterministic serial from a hash of inputs — so the same wallet + handle
  // always produces the same serial (for re-issuing lost passes).
  // ---------------------------------------------------------------------------
  function generateSerial(state) {
    const seedStr = `${state.twitter}|${state.wallet}|${state.clan}|blockbit-ink-2026`;
    let h = 2166136261 >>> 0;
    for (let i = 0; i < seedStr.length; i++) {
      h ^= seedStr.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    const block = (h >>> 0) % 1999 + 1;
    return `BBI-${String(block).padStart(4, '0')}-${(h >>> 0).toString(16).slice(0, 6).toUpperCase().padStart(6, '0')}`;
  }

  // ---------------------------------------------------------------------------
  // Submission transport
  // ---------------------------------------------------------------------------
  function getConfig() {
    return window.BLOCKBIT_CONFIG || {};
  }

  function buildPayload(state) {
    return {
      twitter: state.twitter,
      wallet: state.wallet,
      clan: state.clan,
      serial: state.serial,
      userAgent: navigator.userAgent || '',
      ipHint: '' // Apps Script cannot read the client IP directly.
    };
  }

  /**
   * Submit the final application.
   *
   * Apps Script Web Apps do not support custom request headers, and they
   * respond with CORS headers only when the request content type is
   * `text/plain`. We follow the documented pattern of POSTing JSON
   * encoded as text/plain.
   */
  async function postToSheet(state, attempt) {
    attempt = attempt || 0;
    const cfg = getConfig();
    if (!cfg.sheetEndpoint) {
      return { ok: false, error: 'Whitelist endpoint not configured. Ask the site admin to copy whitelist-config.example.js → whitelist-config.js and add the Apps Script URL.' };
    }
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), cfg.timeoutMs || 10000);

    try {
      const res = await fetch(cfg.sheetEndpoint, {
        method: 'POST',
        // Apps Script ignores CORS preflight when content-type is text/plain.
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(buildPayload(state)),
        signal: ctrl.signal,
        redirect: 'follow'
      });
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); }
      catch (_) { data = { ok: false, error: 'Server returned non-JSON: ' + text.slice(0, 120) }; }
      return data;
    } catch (err) {
      if (attempt < (cfg.maxRetries || 2)) {
        await new Promise(r => setTimeout(r, 600 * (attempt + 1)));
        return postToSheet(state, attempt + 1);
      }
      return { ok: false, error: 'Network error: ' + (err.message || 'request failed') };
    } finally {
      clearTimeout(t);
    }
  }

  async function submitFinal(state) {
    clearSubmitStatus();
    if (!state.twitter || !state.wallet || !state.clan || !state.serial) {
      showSubmitStatus('Missing required fields. Please restart from the beginning.', 'error');
      return;
    }

    setSubmitButtonState(true);
    showSubmitStatus('Recording your application to the secure ledger…', 'pending');

    const result = await postToSheet(state);

    setSubmitButtonState(false);

    if (result && result.ok) {
      showSubmitStatus('Application recorded on the ledger.', 'info');
      markSubmitted(state.serial);
      saveState(Object.assign({}, state, { submitted: true, submittedAt: Date.now() }));
      // Jump to success panel
      const successMsg = document.getElementById('successMessage');
      if (successMsg) {
        successMsg.textContent =
          'Your VIP Mint Pass has been generated and your whitelist application has been recorded. ' +
          'Keep your serial number (' + state.serial + ') safe — you will need it to claim your mint slot.';
      }
      gotoStep('success', state);
    } else {
      const msg = (result && result.error) ? result.error : 'Could not record your application. Please retry.';
      const status = document.getElementById('submitStatus');
      if (status) {
        status.innerHTML = '';
        const text = document.createTextNode(msg + ' ');
        status.appendChild(text);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'retry-btn';
        btn.textContent = 'Retry';
        btn.addEventListener('click', () => submitFinal(state));
        status.appendChild(btn);
        status.className = 'submit-status show error';
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Holographic mint pass — pure canvas, deterministic for a given state.
  // ---------------------------------------------------------------------------
  function renderMintPass(state) {
    const canvas = document.getElementById('mintPass');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, '#0B0A12');
    grad.addColorStop(0.5, '#1E1B2E');
    grad.addColorStop(1, '#0B0A12');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Holographic overlay
    const holo = ctx.createLinearGradient(0, 0, W, 0);
    holo.addColorStop(0,   'rgba(124, 58, 237, 0.10)');
    holo.addColorStop(0.3, 'rgba(14, 165, 233, 0.10)');
    holo.addColorStop(0.6, 'rgba(168, 85, 247, 0.10)');
    holo.addColorStop(1,   'rgba(255, 215, 0, 0.10)');
    ctx.fillStyle = holo;
    ctx.fillRect(0, 0, W, H);

    // Border
    ctx.strokeStyle = 'rgba(124, 58, 237, 0.6)';
    ctx.lineWidth = 4;
    ctx.strokeRect(8, 8, W - 16, H - 16);
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(20, 20, W - 40, H - 40);

    // Watermark ink logo (top-right)
    ctx.fillStyle = 'rgba(124, 58, 237, 0.12)';
    ctx.font = 'bold 110px serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText('BLOCKBIT', W - 40, 32);
    ctx.font = 'bold 80px serif';
    ctx.fillStyle = 'rgba(245, 215, 0, 0.4)';
    ctx.fillText('INK', W - 40, 130);

    // Header
    ctx.fillStyle = '#7C3AED';
    ctx.font = 'bold 14px "DM Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('VIP MINT PASS · GENESIS DROP · INK SUPERCHAIN', 40, 40);

    ctx.fillStyle = '#FAF8F5';
    ctx.font = 'bold 38px "Cormorant Garamond", serif';
    ctx.fillText('Blockbit Ink', 40, 64);

    // Clan badge
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    roundRect(ctx, 40, 120, 220, 50, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 12px "DM Sans", sans-serif';
    ctx.fillText('CLAN AFFILIATION', 56, 132);
    ctx.fillStyle = '#FAF8F5';
    ctx.font = 'bold 22px "Cormorant Garamond", serif';
    ctx.fillText(state.clan.toUpperCase(), 56, 150);

    // Twitter handle
    ctx.fillStyle = '#FAF8F5';
    ctx.font = 'bold 11px "DM Sans", sans-serif';
    ctx.fillText('TWITTER / X', 40, 200);
    ctx.font = '500 18px "DM Sans", sans-serif';
    ctx.fillText('@' + state.twitter, 40, 218);

    // Wallet
    ctx.fillStyle = '#FAF8F5';
    ctx.font = 'bold 11px "DM Sans", sans-serif';
    ctx.fillText('WALLET (INK / EVM)', 40, 256);
    ctx.font = '500 16px "DM Sans", sans-serif';
    const walletShort = state.wallet.slice(0, 10) + '…' + state.wallet.slice(-8);
    ctx.fillText(walletShort, 40, 274);

    // Serial — the big one
    ctx.fillStyle = 'rgba(124, 58, 237, 0.08)';
    roundRect(ctx, 40, 320, W - 80, 90, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(124, 58, 237, 0.6)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#7C3AED';
    ctx.font = 'bold 11px "DM Sans", sans-serif';
    ctx.fillText('SERIAL NUMBER', 56, 332);
    ctx.fillStyle = '#FAF8F5';
    ctx.font = 'bold 36px "Courier New", monospace';
    ctx.fillText(state.serial, 56, 350);

    // Footer
    ctx.fillStyle = 'rgba(250, 248, 245, 0.5)';
    ctx.font = '10px "DM Sans", sans-serif';
    ctx.fillText('Blockbit Ink · 1,999 warriors · blockbitink.xyz', 40, H - 40);
    ctx.textAlign = 'right';
    ctx.fillText('Issued ' + new Date().toISOString().slice(0, 10), W - 40, H - 40);

    // Update meta
    const meta = document.getElementById('passMeta');
    if (meta) {
      meta.innerHTML =
        '<strong>Serial:</strong> ' + state.serial + '<br>' +
        '<strong>Clan:</strong> ' + state.clan + '<br>' +
        '<strong>Holder:</strong> @' + state.twitter + '<br>' +
        '<strong>Wallet:</strong> <code>' + walletShort + '</code>';
    }
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function downloadPass() {
    const canvas = document.getElementById('mintPass');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'blockbit-ink-mint-pass.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  // ---------------------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------------------
  function init() {
    const state = loadState();
    const submitted = alreadySubmitted();

    if (state.twitter) {
      const t = document.getElementById('twitterHandle');
      if (t) t.value = '@' + state.twitter;
    }
    if (state.wallet) {
      const w = document.getElementById('walletAddr');
      if (w) w.value = state.wallet;
    }
    if (state.clan) {
      const radio = document.querySelector('input[name="clan"][value="' + state.clan + '"]');
      if (radio) radio.checked = true;
    }

    // Decide which step to land on
    if (submitted && submitted.serial) {
      // They already submitted. Show the success screen.
      const successMsg = document.getElementById('successMessage');
      if (successMsg) {
        successMsg.textContent =
          'You have already submitted your whitelist application (serial: ' + submitted.serial + '). ' +
          'If you need to update your details, please contact the project admin.';
      }
      showStep('success');
    } else if (state.step) {
      if (state.step === 4 || state.step === 'success') renderMintPass(state);
      showStep(state.step);
    }

    // Wire nav buttons
    document.querySelectorAll('[data-next]').forEach(btn => {
      btn.addEventListener('click', () => {
        const current = parseInt(document.querySelector('.form-panel.active').dataset.panel, 10);
        nextStep(current, state);
      });
    });
    document.querySelectorAll('[data-prev]').forEach(btn => {
      btn.addEventListener('click', () => {
        const current = parseInt(document.querySelector('.form-panel.active').dataset.panel, 10);
        prevStep(current, state);
      });
    });

    // Final submit button
    const submitBtn = document.getElementById('submitFinal');
    if (submitBtn) submitBtn.addEventListener('click', () => submitFinal(state));

    // Clan radio highlight
    document.querySelectorAll('input[name="clan"]').forEach(r => {
      r.addEventListener('change', () => {
        document.querySelectorAll('.clan-option').forEach(opt => opt.classList.remove('selected'));
        r.closest('.clan-option').classList.add('selected');
      });
    });

    // Download (step 4 + success)
    const dl = document.getElementById('downloadPass');
    if (dl) dl.addEventListener('click', downloadPass);
    const dlSuccess = document.getElementById('downloadSuccess');
    if (dlSuccess) dlSuccess.addEventListener('click', downloadPass);

    // Mobile menu
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenuBtn && mobileMenu) {
      mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('open');
        mobileMenuBtn.innerHTML = mobileMenu.classList.contains('open')
          ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>'
          : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>';
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose a tiny debug surface so QA tools can verify serial determinism
  window.__blockbitWhitelist = {
    generateSerial, loadState, saveState, clearState,
    markSubmitted, alreadySubmitted, ALLOWED_CLANS
  };
})();