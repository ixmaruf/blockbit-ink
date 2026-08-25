/**
 * Blockbit Ink — Whitelist Application Controller
 * Handles 4-Step Wizard, 3D Digital Ticket Canvas Generation,
 * Viral Twitter Share, Status Lookup, and Admin Raffle Winner Picker
 */

const STORAGE_KEY = 'blockbit_ink_whitelist_entries';

// Initial Mock Seed Data
const DEFAULT_ENTRIES = [
  { ticketId: 'INK-WL-1042', wallet: '0x71C84513643B6EC59a4253eEb73b4d45d9472A80', twitter: '@cyber_ninja', discord: 'ninja#8842', tribe: 'Cyber Ronin', status: 'Winner', timestamp: '2026-08-25 10:15' },
  { ticketId: 'INK-WL-1089', wallet: '0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5', twitter: '@pixel_samurai', discord: 'samurai#1099', tribe: 'Ink Shinobi', status: 'Submitted', timestamp: '2026-08-25 11:20' },
  { ticketId: 'INK-WL-1124', wallet: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', twitter: '@ink_warrior', discord: 'warrior#4321', tribe: 'Pixel Knight', status: 'Winner', timestamp: '2026-08-25 12:45' },
  { ticketId: 'INK-WL-1205', wallet: '0x90F79bf6EB2c4f870365E785982E1f101E93b906', twitter: '@crypto_knight', discord: 'knight#7711', tribe: 'Neon Scout', status: 'Submitted', timestamp: '2026-08-25 14:05' }
];

let currentApplication = {
  wallet: '',
  twitter: '',
  discord: '',
  tribe: 'Cyber Ronin',
  ticketId: ''
};

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  initAmbientCanvas();
  initStorage();
  initWizard();
  initSocialTasks();
  initTribeSelection();
  initStatusLookup();
  initAdminDashboard();
});

// ==========================================
// AMBIENT PARTICLES
// ==========================================
function initAmbientCanvas() {
  const canvas = document.getElementById('ambient-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let particles = [];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  for (let i = 0; i < 40; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2 + 1,
      speed: Math.random() * 0.4 + 0.2,
      phase: Math.random() * Math.PI * 2,
      color: Math.random() > 0.5 ? 'rgba(139, 92, 246, 0.4)' : 'rgba(6, 182, 212, 0.4)'
    });
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.y -= p.speed;
      p.x += Math.sin(p.phase + p.y * 0.01) * 0.4;
      if (p.y < 0) p.y = canvas.height;

      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    requestAnimationFrame(render);
  }
  render();
}

// ==========================================
// LOCAL STORAGE MANAGEMENT
// ==========================================
function initStorage() {
  if (!localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ENTRIES));
  }
  updateSpotsMeter();
}

function getStoredEntries() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveEntry(entry) {
  const entries = getStoredEntries();
  entries.unshift(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  updateSpotsMeter();
}

function updateSpotsMeter() {
  const count = getStoredEntries().length;
  const total = 1000;
  const claimed = 680 + count;
  const remaining = Math.max(0, total - claimed);
  const pct = Math.min(100, (claimed / total) * 100);

  const textEl = document.getElementById('spots-claimed-text');
  const fillEl = document.getElementById('progress-bar-fill');
  if (textEl) textEl.textContent = `${claimed} / ${total} Claimed (${remaining} Left)`;
  if (fillEl) fillEl.style.width = `${pct}%`;
}

// ==========================================
// 4-STEP WIZARD NAVIGATION
// ==========================================
function initWizard() {
  // Step 1 -> Step 2
  const nextBtn1 = document.getElementById('btn-step-1-next');
  const walletInput = document.getElementById('input-wallet');
  const walletError = document.getElementById('wallet-error');
  const connectBtn = document.getElementById('btn-connect-wallet');

  if (connectBtn) {
    connectBtn.addEventListener('click', async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          if (accounts && accounts.length > 0) {
            walletInput.value = accounts[0];
            walletError.style.display = 'none';
          }
        } catch (e) {
          alert('Wallet connection cancelled or rejected.');
        }
      } else {
        // Mock connection
        walletInput.value = '0x' + Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join('');
        walletError.style.display = 'none';
      }
    });
  }

  if (nextBtn1) {
    nextBtn1.addEventListener('click', () => {
      const val = walletInput.value.trim();
      if (!val || val.length < 10) {
        walletError.style.display = 'block';
        return;
      }
      walletError.style.display = 'none';
      currentApplication.wallet = val;
      goToStep(2);
    });
  }

  // Step 2 Back & Next
  const backBtn2 = document.getElementById('btn-step-2-back');
  const nextBtn2 = document.getElementById('btn-step-2-next');
  if (backBtn2) backBtn2.addEventListener('click', () => goToStep(1));
  if (nextBtn2) {
    nextBtn2.addEventListener('click', () => {
      currentApplication.twitter = document.getElementById('input-twitter').value.trim() || '@champion';
      currentApplication.discord = document.getElementById('input-discord').value.trim() || 'champion#0001';
      goToStep(3);
    });
  }

  // Step 3 Back & Submit
  const backBtn3 = document.getElementById('btn-step-3-back');
  const submitBtn = document.getElementById('btn-submit-application');
  if (backBtn3) backBtn3.addEventListener('click', () => goToStep(2));
  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      // Generate Ticket ID
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      currentApplication.ticketId = `INK-WL-${randomNum}`;

      // Save to local storage
      const now = new Date();
      const timeStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

      saveEntry({
        ticketId: currentApplication.ticketId,
        wallet: currentApplication.wallet,
        twitter: currentApplication.twitter,
        discord: currentApplication.discord,
        tribe: currentApplication.tribe,
        status: 'Submitted',
        timestamp: timeStr
      });

      // Generate Ticket Canvas
      generatePassCanvas(currentApplication);
      goToStep(4);
    });
  }

  // Step 4 Buttons
  const downloadBtn = document.getElementById('btn-download-pass');
  const shareBtn = document.getElementById('btn-share-twitter');

  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      const canvas = document.getElementById('passCanvas');
      if (!canvas) return;
      const link = document.createElement('a');
      link.download = `Blockbit-Ink-Whitelist-Pass-${currentApplication.ticketId}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    });
  }

  if (shareBtn) {
    shareBtn.addEventListener('click', () => {
      const text = encodeURIComponent(`[BLOCKBIT INK] Just claimed my official Whitelist Pass for @BlockbitInk on @inkonchain!\n\nTicket: #${currentApplication.ticketId}\nClan: ${currentApplication.tribe}\n\nJoin the 3D realm & enter the raffle:\nhttps://blockbitink.xyz`);
      window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
    });
  }
}

function goToStep(stepNum) {
  // Update step panels
  document.querySelectorAll('.wizard-step').forEach(step => step.classList.remove('active'));
  const targetStep = document.getElementById(`step-1`) ? document.getElementById(`step-${stepNum}`) : null;
  if (targetStep) targetStep.classList.add('active');

  // Update indicators
  for (let s = 1; s <= 4; s++) {
    const ind = document.getElementById(`step-ind-${s}`);
    if (!ind) continue;
    ind.classList.remove('active', 'completed');
    if (s < stepNum) ind.classList.add('completed');
    if (s === stepNum) ind.classList.add('active');
  }
}

// ==========================================
// SOCIAL TASKS VERIFICATION
// ==========================================
function initSocialTasks() {
  document.querySelectorAll('.task-action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.innerHTML = '<span style="color: var(--emerald); font-weight: 800;">[ VERIFIED ]</span>';
      btn.style.borderColor = 'var(--emerald)';
      btn.style.background = 'rgba(0, 255, 136, 0.12)';
    });
  });
}

// ==========================================
// TRIBE SELECTION
// ==========================================
function initTribeSelection() {
  const choices = document.querySelectorAll('.tribe-choice');
  choices.forEach(choice => {
    choice.addEventListener('click', () => {
      choices.forEach(c => c.classList.remove('selected'));
      choice.classList.add('selected');
      currentApplication.tribe = choice.dataset.tribe;
    });
  });
}

// ==========================================
// MASTER SUNSET DIGITAL VIP PASS GENERATOR
// ==========================================
function generatePassCanvas(data) {
  const canvas = document.getElementById('passCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  // 1. Deep Sunset Twilight Velvet Gradient Background
  const bgGrad = ctx.createLinearGradient(0, 0, w, h);
  bgGrad.addColorStop(0, '#120720');
  bgGrad.addColorStop(0.5, '#0c0416');
  bgGrad.addColorStop(1, '#1a0a2a');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // 2. Sunset Grid & Runes
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.12)';
  ctx.lineWidth = 1;
  for (let x = 25; x < w; x += 25) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 25; y < h; y += 25) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // 3. Sharp Rectangular Gold & Amber Frame
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2;
  ctx.strokeRect(8, 8, w - 16, h - 16);

  // Corner Bracket Accents
  ctx.fillStyle = '#f97316';
  ctx.fillRect(4, 4, 16, 4);
  ctx.fillRect(4, 4, 4, 16);
  ctx.fillRect(w - 20, 4, 16, 4);
  ctx.fillRect(w - 8, 4, 4, 16);
  ctx.fillRect(4, h - 8, 16, 4);
  ctx.fillRect(4, h - 20, 4, 16);
  ctx.fillRect(w - 20, h - 8, 16, 4);
  ctx.fillRect(w - 8, h - 20, 4, 16);

  // 4. Header Bar
  ctx.fillStyle = 'rgba(245, 158, 11, 0.18)';
  ctx.fillRect(8, 8, w - 16, 60);

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 24px sans-serif';
  ctx.fillText('BLOCKBIT INK // SUNSET VIP PASS', 28, 46);

  ctx.fillStyle = '#fbbf24';
  ctx.font = '700 14px monospace';
  ctx.textAlign = 'right';
  ctx.fillText('INK L2 // SUPERCHAIN', w - 28, 44);
  ctx.textAlign = 'left';

  // 5. Ticket ID & Access Rank
  ctx.fillStyle = '#fbbf24';
  ctx.font = '900 38px monospace';
  ctx.fillText(data.ticketId, 28, 130);

  ctx.fillStyle = '#f97316';
  ctx.font = '700 14px monospace';
  ctx.fillText('[ SUNSET REALM ALLOCATION CONFIRMED ]', 28, 160);

  // 6. Data Fields (Wallet & Clan)
  const truncWallet = data.wallet.length > 22
    ? data.wallet.substring(0, 12) + '...' + data.wallet.substring(data.wallet.length - 10)
    : data.wallet;

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '700 12px monospace';
  ctx.fillText('REGISTERED WALLET ADDRESS:', 28, 215);
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 17px monospace';
  ctx.fillText(truncWallet, 28, 240);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '700 12px monospace';
  ctx.fillText('ASSIGNED WARRIOR CLAN:', 28, 290);
  ctx.fillStyle = '#c084fc';
  ctx.font = '900 22px sans-serif';
  ctx.fillText(data.tribe.toUpperCase(), 28, 318);

  // 7. Right Side Gold Sunset Seal
  const sealX = w - 150;
  const sealY = 220;

  ctx.fillStyle = 'rgba(245, 158, 11, 0.18)';
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2;
  ctx.fillRect(sealX - 60, sealY - 60, 120, 120);
  ctx.strokeRect(sealX - 60, sealY - 60, 120, 120);

  ctx.fillStyle = '#fbbf24';
  ctx.font = '900 13px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('SACRED', sealX, sealY - 20);
  ctx.fillText('WARRIOR', sealX, sealY);
  ctx.font = 'bold 16px monospace';
  ctx.fillText('[ VERIFIED ]', sealX, sealY + 28);
  ctx.font = '11px monospace';
  ctx.fillText('INK CHAIN', sealX, sealY + 45);

  // Barcode Lines at Bottom Right
  ctx.fillStyle = '#ffffff';
  for (let b = 0; b < 24; b++) {
    const bw = (b % 3 === 0) ? 4 : 2;
    ctx.fillRect(w - 240 + b * 9, h - 50, bw, 30);
  }

  // 8. Footer Strip
  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('SUPPLY: 1,999 • MINT: 0.05 ETH • OPENSEA ALLOWLIST VERIFIED', 28, h - 25);
}

// ==========================================
// STATUS LOOKUP MODAL
// ==========================================
function initStatusLookup() {
  const modal = document.getElementById('status-modal');
  const openBtn = document.getElementById('btn-check-status-nav');
  const closeBtn = document.getElementById('btn-close-status-modal');
  const lookupBtn = document.getElementById('btn-lookup-wallet');
  const input = document.getElementById('input-check-wallet');
  const resultWrap = document.getElementById('status-result-wrap');

  if (openBtn && modal) {
    openBtn.addEventListener('click', () => modal.classList.add('active'));
  }
  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => modal.classList.remove('active'));
  }

  if (lookupBtn && input && resultWrap) {
    lookupBtn.addEventListener('click', () => {
      const q = input.value.trim().toLowerCase();
      const entries = getStoredEntries();
      const match = entries.find(e => e.wallet.toLowerCase() === q);

      resultWrap.style.display = 'block';
      if (match) {
        resultWrap.innerHTML = `
          <div style="background: rgba(0, 255, 136, 0.12); border: 1px solid var(--emerald); padding: 16px;">
            <div style="color: var(--emerald); font-family: var(--font-pixel); font-weight: 700; font-size: 1.3rem; margin-bottom: 6px;">[ APPLICATION FOUND ]</div>
            <div style="font-family: var(--font-pixel-mono); font-size: 0.85rem; color: #ffffff;">
              <div><strong>Ticket:</strong> #${match.ticketId}</div>
              <div><strong>Clan:</strong> ${match.tribe}</div>
              <div><strong>Status:</strong> <span style="color: ${match.status === 'Winner' ? 'var(--gold)' : 'var(--cyan)'}; font-weight: bold;">${match.status.toUpperCase()}</span></div>
            </div>
          </div>
        `;
      } else {
        resultWrap.innerHTML = `
          <div style="background: rgba(255, 42, 109, 0.15); border: 1px solid var(--rose); padding: 16px; color: var(--rose); font-family: var(--font-pixel-mono); font-size: 0.85rem;">
            [ ERROR: No submission found for this wallet address. Please submit your application! ]
          </div>
        `;
      }
    });
  }
}

// ==========================================
// ADMIN DASHBOARD & RAFFLE PICKER
// ==========================================
function initAdminDashboard() {
  const modal = document.getElementById('admin-modal');
  const openBtn = document.getElementById('btn-admin-portal');
  const closeBtn = document.getElementById('btn-close-admin-modal');

  if (openBtn && modal) {
    openBtn.addEventListener('click', () => {
      modal.classList.add('active');
      renderAdminTable();
    });
  }
  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => modal.classList.remove('active'));
  }

  // Keyboard shortcut Ctrl + Shift + W
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'w') {
      if (modal) {
        modal.classList.toggle('active');
        if (modal.classList.contains('active')) renderAdminTable();
      }
    }
  });

  // Admin Actions
  const raffleBtn = document.getElementById('btn-run-raffle');
  const exportCsvBtn = document.getElementById('btn-export-csv');
  const exportJsonBtn = document.getElementById('btn-export-json');
  const seedBtn = document.getElementById('btn-seed-data');

  if (seedBtn) {
    seedBtn.addEventListener('click', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ENTRIES));
      updateSpotsMeter();
      renderAdminTable();
      alert('Seeded test whitelist entries successfully!');
    });
  }

  if (raffleBtn) {
    raffleBtn.addEventListener('click', () => runRaffleAnimation());
  }

  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', () => {
      const entries = getStoredEntries();
      // OpenSea Allowlist CSV format: address,quantity
      let csv = 'address,quantity\n';
      entries.forEach(e => {
        csv += `${e.wallet},1\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `opensea_allowlist_blockbit_ink.csv`;
      a.click();
    });
  }

  if (exportJsonBtn) {
    exportJsonBtn.addEventListener('click', () => {
      const entries = getStoredEntries();
      const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `whitelist_blockbit_ink.json`;
      a.click();
    });
  }
}

function renderAdminTable() {
  const tbody = document.getElementById('admin-table-body');
  const countEl = document.getElementById('admin-entry-count');
  if (!tbody) return;

  const entries = getStoredEntries();
  if (countEl) countEl.textContent = entries.length;

  tbody.innerHTML = '';
  entries.forEach(e => {
    const tr = document.createElement('tr');
    tr.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
    tr.innerHTML = `
      <td style="padding: 8px; color: var(--accent-purple-light); font-weight: 700;">#${e.ticketId}</td>
      <td style="padding: 8px; font-family: monospace;">${e.wallet}</td>
      <td style="padding: 8px;">${e.tribe}</td>
      <td style="padding: 8px; font-weight: bold; color: ${e.status === 'Winner' ? 'var(--accent-gold)' : '#34d399'};">${e.status}</td>
    `;
    tbody.appendChild(tr);
  });
}

function runRaffleAnimation() {
  const rollingBox = document.getElementById('raffle-rolling-display');
  const rollingAddr = document.getElementById('rolling-address');
  const entries = getStoredEntries();
  if (entries.length === 0) {
    alert('No entries to raffle!');
    return;
  }

  rollingBox.style.display = 'block';

  let count = 0;
  const interval = setInterval(() => {
    const randomEntry = entries[Math.floor(Math.random() * entries.length)];
    rollingAddr.textContent = randomEntry.wallet;
    count++;

    if (count > 25) {
      clearInterval(interval);
      // Pick random winner
      const winner = entries[Math.floor(Math.random() * entries.length)];
      winner.status = 'Winner';
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
      rollingAddr.innerHTML = `🎉 WINNER CHOSEN: <span style="color: var(--accent-gold);">${winner.wallet}</span> (${winner.ticketId})`;
      renderAdminTable();
    }
  }, 80);
}
