/**
 * Blockbit Ink — Client Application Controller
 * Handles 3D World Scene, Audio Synthesizer, 3D Showroom,
 * Random NFT Summoner, Trait Inspector, and UI Interactions
 */

let world3D = null;
let soundEngine = null;

// ==========================================
// PROCEDURAL WEB AUDIO SYNTHESIZER
// ==========================================
class Web3AudioEngine {
  constructor() {
    this.ctx = null;
    this.isPlaying = false;
    this.masterGain = null;
    this.ambientOsc1 = null;
    this.ambientOsc2 = null;
  }

  init() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);
  }

  toggleAmbient() {
    this.init();
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (this.isPlaying) {
      if (this.ambientGain) {
        this.ambientGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 1.0);
        setTimeout(() => {
          if (this.ambientOsc1) this.ambientOsc1.stop();
          if (this.ambientOsc2) this.ambientOsc2.stop();
          this.isPlaying = false;
        }, 1000);
      }
      return false;
    } else {
      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
      this.ambientGain.gain.exponentialRampToValueAtTime(0.08, this.ctx.currentTime + 1.5);
      this.ambientGain.connect(this.masterGain);

      // Warm fantasy pad chord (C# minor pentatonic)
      this.ambientOsc1 = this.ctx.createOscillator();
      this.ambientOsc1.type = 'sine';
      this.ambientOsc1.frequency.setValueAtTime(138.59, this.ctx.currentTime); // C#3

      this.ambientOsc2 = this.ctx.createOscillator();
      this.ambientOsc2.type = 'triangle';
      this.ambientOsc2.frequency.setValueAtTime(207.65, this.ctx.currentTime); // G#3

      this.ambientOsc1.connect(this.ambientGain);
      this.ambientOsc2.connect(this.ambientGain);

      this.ambientOsc1.start();
      this.ambientOsc2.start();
      this.isPlaying = true;
      return true;
    }
  }

  playClick() {
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(580, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.09);
    } catch (e) {}
  }

  playSummon() {
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.35);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.36);
    } catch (e) {}
  }
}

// ==========================================
// SHOWROOM DATA & MANAGER
// ==========================================
const SHOWROOM_ITEMS = [
  { id: 1, name: 'Sylvan Ronin #1', rarity: 'Legendary', class: 'Ronin', power: '99', image: 'nft-preview/1.png' },
  { id: 42, name: 'Spirit Shinobi #42', rarity: 'Epic', class: 'Shinobi', power: '88', image: 'nft-preview/42.png' },
  { id: 100, name: 'River Knight #100', rarity: 'Rare', class: 'Knight', power: '76', image: 'nft-preview/100.png' },
  { id: 200, name: 'Forest Scout #200', rarity: 'Common', class: 'Scout', power: '62', image: 'nft-preview/200.png' },
  { id: 300, name: 'Shadow Mage #300', rarity: 'Epic', class: 'Mage', power: '85', image: 'nft-preview/300.png' },
  { id: 500, name: 'Grove Berserker #500', rarity: 'Rare', class: 'Berserker', power: '79', image: 'nft-preview/500.png' },
  { id: 700, name: 'Canopy Hunter #700', rarity: 'Legendary', class: 'Hunter', power: '95', image: 'nft-preview/700.png' },
  { id: 1000, name: 'Spirit Druid #1000', rarity: 'Rare', class: 'Druid', power: '74', image: 'nft-preview/1000.png' }
];

// ==========================================
// INITIALIZATION ON DOM READY
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize 3D Village World
  if (typeof ThreeVillageWorld !== 'undefined') {
    world3D = new ThreeVillageWorld('three-canvas-container');
  }

  // 2. Initialize Audio Engine
  soundEngine = new Web3AudioEngine();

  // 3. UI Component Initializations
  initNav();
  initHUDControls();
  initShowroom();
  initSummoner();
  initFAQ();
  initCountdown();
  initCountUp();
  initModal();
});

// ==========================================
// NAVIGATION & HUD CONTROLS
// ==========================================
function initNav() {
  const nav = document.getElementById('nav');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });
}

function initHUDControls() {
  const exploreBtn = document.getElementById('btn-explore-mode');
  const audioBtn = document.getElementById('btn-audio-toggle');

  if (exploreBtn && world3D) {
    exploreBtn.addEventListener('click', () => {
      const active = world3D.toggleExploreMode();
      exploreBtn.classList.toggle('active', active);
      exploreBtn.innerHTML = active
        ? '<svg class="pixel-icon" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg> <span>Exit Orbit</span>'
        : '<svg class="pixel-icon" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.46z"/></svg> <span>3D Free Orbit</span>';
      if (soundEngine) soundEngine.playClick();
    });
  }

  if (audioBtn) {
    audioBtn.addEventListener('click', () => {
      const isPlaying = soundEngine.toggleAmbient();
      audioBtn.classList.toggle('active', isPlaying);
      audioBtn.innerHTML = isPlaying
        ? '<svg class="pixel-icon" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg> <span>Audio: ON</span>'
        : '<svg class="pixel-icon" viewBox="0 0 24 24"><path d="M4.34 2.93L2.93 4.34 7.29 8.7 7 9H3v6h4l5 5v-6.59l4.18 4.18c-.65.49-1.38.88-2.18 1.11v2.06c1.34-.3 2.57-.92 3.61-1.75l2.05 2.05 1.41-1.41L4.34 2.93zM12 4L9.91 6.09 12 8.18V4z"/></svg> <span>Audio: OFF</span>';
    });
  }
}

// ==========================================
// 3D SHOWROOM & RARITY FILTER
// ==========================================
function initShowroom() {
  const grid = document.getElementById('showroom-grid');
  const filterBtns = document.querySelectorAll('.filter-btn');
  if (!grid) return;

  renderShowroomCards(SHOWROOM_ITEMS, 'all');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      renderShowroomCards(SHOWROOM_ITEMS, filter);
      if (soundEngine) soundEngine.playClick();
    });
  });
}

function renderShowroomCards(items, filter) {
  const grid = document.getElementById('showroom-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const filtered = filter === 'all'
    ? items
    : items.filter(item => item.rarity.toLowerCase() === filter.toLowerCase());

  filtered.forEach(item => {
    const card = document.createElement('div');
    card.className = 'nft-3d-card';
    card.dataset.id = item.id;

    card.innerHTML = `
      <div class="nft-image-wrap">
        <img src="${item.image}" alt="${item.name}" loading="lazy">
        <span class="rarity-badge ${item.rarity.toLowerCase()}">${item.rarity}</span>
      </div>
      <div class="nft-card-info">
        <div style="width: 100%;">
          <div class="nft-card-name">${item.name}</div>
          <div class="nft-card-sub" style="font-size: 0.78rem; color: var(--text-muted); font-family: var(--font-mono);">${item.class} • PWR ${item.power}</div>
        </div>
        <div class="nft-card-chain">
          <img src="ink-logo.webp" alt="Ink" style="width:14px;height:14px;">
          <span>Ink L2</span>
        </div>
      </div>
    `;

    card.addEventListener('click', () => openTraitInspector(item));
    grid.appendChild(card);
  });
}

// ==========================================
// RANDOM NFT SUMMONER
// ==========================================
function initSummoner() {
  const summonBtn = document.getElementById('btn-summon-warrior');
  if (!summonBtn) return;

  summonBtn.addEventListener('click', () => {
    if (soundEngine) soundEngine.playSummon();

    const randomId = Math.floor(Math.random() * 1999) + 1;
    const seed = randomId * 7919 + 31337;

    let nftData = null;
    if (typeof generateTraits !== 'undefined') {
      nftData = generateTraits(seed);
    }

    const rarityTier = nftData ? nftData.rarity.tier : (['Common', 'Rare', 'Epic', 'Legendary'][Math.floor(Math.random() * 4)]);
    const newItem = {
      id: randomId,
      name: `Ink Champion #${randomId}`,
      rarity: rarityTier,
      class: 'Warrior',
      power: (Math.floor(Math.random() * 40) + 60).toString(),
      image: `nft-preview/${[1, 42, 100, 200, 300, 500, 700, 1000][Math.floor(Math.random() * 8)]}.png`
    };

    SHOWROOM_ITEMS.unshift(newItem);
    renderShowroomCards(SHOWROOM_ITEMS, 'all');

    // Trigger visual notification
    summonBtn.innerHTML = '<svg class="pixel-icon" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> <span>Warrior Summoned!</span>';
    setTimeout(() => {
      summonBtn.innerHTML = '<svg class="pixel-icon" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg> <span>Summon Random Warrior</span>';
    }, 1800);
  });
}

// ==========================================
// TRAIT INSPECTOR MODAL
// ==========================================
function initModal() {
  const modal = document.getElementById('trait-modal');
  const closeBtn = document.getElementById('modal-close-btn');
  if (!modal || !closeBtn) return;

  closeBtn.addEventListener('click', () => {
    modal.classList.remove('active');
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });
}

function openTraitInspector(item) {
  const modal = document.getElementById('trait-modal');
  const body = document.getElementById('modal-body');
  if (!modal || !body) return;

  const seed = item.id * 7919 + 31337;
  let traits = [];
  if (typeof generateTraits !== 'undefined') {
    try {
      const data = generateTraits(seed);
      if (data && data.traits) {
        traits = Object.entries(data.traits).map(([cat, val]) => ({
          name: cat,
          value: typeof val === 'object' ? val.name || val.value : val
        }));
      }
    } catch (e) {}
  }

  if (traits.length === 0) {
    traits = [
      { name: 'Tribe', value: item.class },
      { name: 'Rarity Tier', value: item.rarity },
      { name: 'Power Rating', value: item.power + ' / 100' },
      { name: 'Blockchain', value: 'Ink Superchain L2' },
      { name: 'Storage', value: 'Permanently On-Chain' }
    ];
  }

  body.innerHTML = `
    <div style="display: flex; gap: 24px; flex-wrap: wrap; align-items: center; margin-bottom: 24px;">
      <img src="${item.image}" alt="${item.name}" style="width: 160px; height: 160px; border-radius: 12px; border: 2px solid var(--accent-purple); box-shadow: var(--glow-purple);">
      <div>
        <span class="rarity-badge ${item.rarity.toLowerCase()}" style="position: static; display: inline-block; margin-bottom: 8px;">${item.rarity}</span>
        <h2 style="font-size: 1.8rem; font-weight: 800;">${item.name}</h2>
        <p style="color: var(--text-secondary); font-size: 0.9rem;">Token ID: #${item.id} • Seed: ${seed}</p>
      </div>
    </div>

    <h4 style="font-size: 1.1rem; margin-bottom: 14px; color: var(--accent-cyan);">Genetic Traits & Attributes</h4>
    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
      ${traits.map(t => `
        <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 10px 14px;">
          <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">${t.name}</div>
          <div style="font-weight: 700; color: #fff; font-size: 0.95rem;">${t.value}</div>
        </div>
      `).join('')}
    </div>
  `;

  modal.classList.add('active');
  if (soundEngine) soundEngine.playClick();
}

// ==========================================
// COUNTDOWN & STATS COUNT-UP
// ==========================================
function initCountdown() {
  const daysEl = document.getElementById('count-days');
  const hoursEl = document.getElementById('count-hours');
  const minsEl = document.getElementById('count-mins');
  const secsEl = document.getElementById('count-secs');
  if (!daysEl) return;

  // 3 Days Whitelist Countdown
  let targetTime = Date.now() + 3 * 24 * 60 * 60 * 1000;

  function update() {
    const diff = Math.max(0, targetTime - Date.now());
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const m = Math.floor((diff / (1000 * 60)) % 60);
    const s = Math.floor((diff / 1000) % 60);

    daysEl.textContent = String(d).padStart(2, '0');
    hoursEl.textContent = String(h).padStart(2, '0');
    minsEl.textContent = String(m).padStart(2, '0');
    secsEl.textContent = String(s).padStart(2, '0');
  }

  update();
  setInterval(update, 1000);
}

function initCountUp() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.count, 10) || 0;
        let current = 0;
        const step = target / 40;
        const timer = setInterval(() => {
          current += step;
          if (current >= target) {
            current = target;
            clearInterval(timer);
          }
          el.textContent = Math.floor(current).toLocaleString();
        }, 30);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('[data-count]').forEach(el => observer.observe(el));
}

// ==========================================
// FAQ ACCORDION
// ==========================================
function initFAQ() {
  document.querySelectorAll('.faq-item').forEach(item => {
    const btn = item.querySelector('.faq-question');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const wasActive = item.classList.contains('active');
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
      if (!wasActive) item.classList.add('active');
      if (soundEngine) soundEngine.playClick();
    });
  });
}
