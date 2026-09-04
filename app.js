/* ==========================================================================
   DUDES CRAFT — APP.JS
   Animations, Ambient Canvas, Voxel Shards, DNA Forge, FAQ, Scroll-reveal
   ========================================================================== */

// Clean .html extension from URL bar
if (window.location.pathname.endsWith('.html')) {
  var clean = window.location.pathname.replace(/(?:index)?\.html$/, '');
  if (!clean || clean.endsWith('/')) clean = clean || '/';
  window.history.replaceState(null, '', clean + window.location.search + window.location.hash);
}

// ── GLOBAL CACHE-BUST & AUTO-UPDATE SYSTEM ──
(function enforceLatestAppVersion() {
  const CURRENT_APP_VERSION = 'v8.0_20260902';
  try {
    const storedVer = localStorage.getItem('dudescraft_app_version');
    if (storedVer !== CURRENT_APP_VERSION) {
      localStorage.setItem('dudescraft_app_version', CURRENT_APP_VERSION);
      // Clear legacy storage items to prevent stale UI state
      localStorage.removeItem('bbi_wl_settings');
      localStorage.removeItem('blockbit_settings');
      localStorage.removeItem('dudescraft_settings_v3');
    }
  } catch (_) {}

  // Force update any active ServiceWorker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function (registrations) {
      for (let reg of registrations) {
        reg.update().catch(function () {});
      }
    }).catch(function () {});
  }
})();

document.addEventListener('DOMContentLoaded', () => {
  // ── NAV SCROLL ──
  const nav = document.getElementById('nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 30);
    }, { passive: true });
  }

  // Mobile Menu Toggle
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  
  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('is-active');
      const isOpen = mobileMenu.classList.contains('is-active');
      
      mobileMenuBtn.innerHTML = isOpen 
        ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>`
        : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>`;
    });
    
    const mobileLinks = mobileMenu.querySelectorAll('a');
    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('is-active');
        mobileMenuBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>`;
      });
    });
  }

  // ── STAT COUNTER ──
  document.querySelectorAll('[data-count]').forEach(el => {
    const target = parseInt(el.dataset.count);
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      let current = 0;
      const step = Math.ceil(target / 60);
      const tick = () => {
        current = Math.min(current + step, target);
        el.textContent = current.toLocaleString();
        if (current < target) requestAnimationFrame(tick);
      };
      tick();
    }, { threshold: 0.5 });
    io.observe(el);
  });

  // ── FAQ ACCORDION ──
  document.querySelectorAll('.faq-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const isActive = item.classList.contains('active');
      document.querySelectorAll('.faq-item.active').forEach(i => i.classList.remove('active'));
      if (!isActive) item.classList.add('active');
    });
  });

  // ── SCROLL-REVEAL ──
  const revealEls = document.querySelectorAll('.reveal-el');
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  revealEls.forEach(el => {
    revealObs.observe(el);
  });

  // ── AMBIENT CANVAS (Cyber Lemon Particles & Voxel Lines) ──
  const ac = document.getElementById('ambient-canvas');
  if (ac) {
    const ctx = ac.getContext('2d');
    let w, h;
    const particles = [];
    const PARTICLE_COUNT = 45;

    function resizeAc() {
      w = ac.width = window.innerWidth;
      h = ac.height = window.innerHeight;
    }
    resizeAc();
    window.addEventListener('resize', resizeAc);

    class Particle {
      constructor() { this.reset(); }
      reset() {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.r = Math.random() * 2 + 1;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.alpha = Math.random() * 0.35 + 0.1;
        this.color = `rgba(198, 242, 33, ${this.alpha})`;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > w || this.y < 0 || this.y > h) this.reset();
      }
      draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.r, this.r); // Square voxel particles
      }
    }
    for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle());

    function animateAc() {
      ctx.clearRect(0, 0, w, h);
      particles.forEach(p => { p.update(); p.draw(); });
      
      // subtle connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = dx * dx + dy * dy;
          if (d < 16000) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(198, 242, 33, ${0.08 * (1 - d / 16000)})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(animateAc);
    }
    animateAc();
  }

  // ── VOXEL SHARDS CANVAS ──
  const pc = document.getElementById('petals-canvas');
  if (pc) {
    const ctx2 = pc.getContext('2d');
    let pw, ph;
    const shards = [];
    const SHARD_COUNT = 24;

    function resizePc() {
      pw = pc.width = window.innerWidth;
      ph = pc.height = window.innerHeight;
    }
    resizePc();
    window.addEventListener('resize', resizePc);

    class VoxelShard {
      constructor() { this.reset(true); }
      reset(randomY = false) {
        this.x = Math.random() * pw;
        this.y = randomY ? Math.random() * ph : -20;
        this.size = Math.random() * 8 + 4;
        this.vx = (Math.random() - 0.5) * 1.2;
        this.vy = Math.random() * 1.2 + 0.6;
        this.rotation = Math.random() * Math.PI * 2;
        this.rs = (Math.random() - 0.5) * 0.04;
        this.alpha = Math.random() * 0.35 + 0.15;
        this.color = Math.random() > 0.5 ? `rgba(198, 242, 33, ${this.alpha})` : `rgba(10, 11, 13, ${this.alpha * 0.5})`;
      }
      update() {
        this.rotation += this.rs;
        this.x += this.vx;
        this.y += this.vy;
        if (this.y > ph + 20 || this.x > pw + 20 || this.x < -20) {
          this.reset();
        }
      }
      draw() {
        ctx2.save();
        ctx2.translate(this.x, this.y);
        ctx2.rotate(this.rotation);
        ctx2.fillStyle = this.color;
        ctx2.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        ctx2.restore();
      }
    }
    
    for (let i = 0; i < SHARD_COUNT; i++) shards.push(new VoxelShard());
    
    function animatePc() {
      ctx2.clearRect(0, 0, pw, ph);
      shards.forEach(p => { p.update(); p.draw(); });
      requestAnimationFrame(animatePc);
    }
    animatePc();
  }

  // ── DNA FORGE (Lazy Init on scroll) ──
  const forgeSection = document.getElementById('forge');
  if (forgeSection) {
    const forgeObs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        initForge();
        forgeObs.disconnect();
      }
    }, { rootMargin: '200px' });
    forgeObs.observe(forgeSection);
  }

  // ── SMOOTH ANCHOR SCROLL ──
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
});

/* ── DNA FORGE RENDERER ── */
let forgeRenderer;

function initForge() {
  const canvas = document.getElementById('forgeCanvas');
  if (!canvas) return;
  
  canvas.width = 2000;
  canvas.height = 2000;
  
  if (typeof NFTRenderer !== 'undefined') {
    forgeRenderer = new NFTRenderer(canvas);
    randomizeForgeWarrior();
  }
}

function randomizeForgeWarrior() {
  if (!forgeRenderer || typeof generateNFT === 'undefined') return;
  
  const tokenId = Math.floor(Math.random() * 1999) + 1;
  const seed = tokenId * 7919 + 31337;
  
  try {
    const nftData = generateNFT(seed);
    forgeRenderer.render(nftData);
    
    const nameEl = document.getElementById('forgeName');
    const rankEl = document.getElementById('forgeRank');
    const traitsGrid = document.getElementById('forgeTraitsGrid');
    
    if (nameEl) nameEl.textContent = `Dude #${String(tokenId).padStart(4, '0')}`;
    
    if (rankEl && nftData.rarity) {
      rankEl.textContent = nftData.rarity.name || nftData.rarity.tier || 'Common';
      rankEl.style.color = '#0A0B0D';
      rankEl.style.backgroundColor = '#C6F221';
    }
    
    if (traitsGrid && nftData.traits) {
      const traitsToShow = ['Outfit', 'Hair Style', 'Eyes', 'Accessory'];
      traitsGrid.innerHTML = '';
      
      for (const tName of traitsToShow) {
        if (nftData.traits[tName]) {
          const tVal = nftData.traits[tName].name;
          traitsGrid.innerHTML += `
            <div class="trait-card">
              <span class="trait-type">${tName}</span>
              <span class="trait-val">${tVal}</span>
            </div>
          `;
        }
      }
    }
  } catch (e) {
    console.error("Error generating Forge Dude:", e);
  }
}
window.randomizeForgeWarrior = randomizeForgeWarrior;

/* ── TOP BANNER WHITELIST SYNC ── */
const DEFAULT_WL_SETTINGS = {
  whitelistOpen: 'On',
  timerStart: '2026-09-04 12:00',
  timerDuration: '144',
  postUrl: 'https://x.com/dudescraft/status/2093534635510702415',
  _isServerConfirmed: false
};

const STORAGE_KEY = 'dudescraft_settings_v5';

// Automatically purge legacy localStorage from previous visits
(function autoPurgeLegacyCache() {
  try {
    ['bbi_wl_settings', 'blockbit_settings', 'dudescraft_settings_v3', 'dudescraft_settings_v4'].forEach(function (k) {
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

let bannerInterval = null;

function initTopBanner() {
  const bannerEl = document.getElementById('topBanner');
  const labelEl = document.getElementById('top-banner-label');
  const countEl = document.getElementById('top-countdown');
  const pulseEl = document.getElementById('bannerPulse');
  if (!labelEl || !countEl) return;

  function applySettings(settings, isAuthoritative) {
    if (!settings) return;

    const authoritative = (isAuthoritative === true);
    const isOpen = settings.whitelistOpen !== 'false' && settings.whitelistOpen !== 'Off';

    if (!isOpen) {
      if (!authoritative) {
        return;
      }
      if (bannerInterval) {
        clearInterval(bannerInterval);
        bannerInterval = null;
      }
      labelEl.textContent = 'WHITELIST OPENS SOON';
      countEl.textContent = '';
      if (pulseEl) {
        pulseEl.style.backgroundColor = '#F59E0B';
      }
      if (bannerEl) bannerEl.classList.add('is-ready');
      return;
    }

    const startStr = settings.timerStart || '';
    let startMs;
    if (startStr.indexOf('T') > -1) {
      startMs = new Date(startStr).getTime();
    } else {
      const parts = startStr.split(' ');
      const dateParts = (parts[0] || '').split('-');
      const timeParts = (parts[1] || '').split(':');
      const y = parseInt(dateParts[0]) || 2026;
      const m = parseInt(dateParts[1]) || 1;
      const d = parseInt(dateParts[2]) || 1;
      const hh = parseInt(timeParts[0]) || 0;
      const mm = parseInt(timeParts[1]) || 0;
      startMs = Date.UTC(y, m - 1, d, hh - 6, mm);
    }
    const durationHours = parseInt(settings.timerDuration || '168', 10);
    const durationMs = (isNaN(durationHours) ? 168 : durationHours) * 60 * 60 * 1000;
    const endTime = startMs + durationMs;

    if (pulseEl) {
      pulseEl.style.backgroundColor = '#C6F221';
    }

    function updateBannerTimer() {
      const now = Date.now();
      const remaining = endTime - now;

      if (remaining <= 0) {
        if (!authoritative) {
          labelEl.textContent = 'WHITELIST CLOSING SOON:';
          countEl.textContent = 'Allocations Wave';
          if (bannerEl) bannerEl.classList.add('is-ready');
          return;
        }
        labelEl.textContent = 'WHITELIST CLOSED';
        countEl.textContent = 'Allocations Filled';
        if (pulseEl) {
          pulseEl.style.backgroundColor = '#8E98A8';
          pulseEl.style.boxShadow = 'none';
        }
        if (bannerInterval) {
          clearInterval(bannerInterval);
          bannerInterval = null;
        }
        return;
      }

      const totalHours = Math.floor(remaining / (1000 * 60 * 60));
      const mins = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((remaining % (1000 * 60)) / 1000);

      labelEl.textContent = 'WHITELIST CLOSING IN:';
      countEl.textContent = totalHours.toString().padStart(2, '0') + 'h ' +
                            mins.toString().padStart(2, '0') + 'm ' +
                            secs.toString().padStart(2, '0') + 's';
    }

    if (bannerInterval) clearInterval(bannerInterval);
    updateBannerTimer();
    if (bannerEl) bannerEl.classList.add('is-ready');
    bannerInterval = setInterval(updateBannerTimer, 1000);
  }

  const local = getLocalWlSettings();
  applySettings(local, false);

  const DEFAULT_ENDPOINT = 'https://script.google.com/macros/s/AKfycbyy_q-cX2WCgTSrbvjlxuRBHuzFiPQYDroGolgcPD_UWXEctuDybTwpK56-iT7pyHY/exec';
  const endpoint = (window.BLOCKBIT_CONFIG && window.BLOCKBIT_CONFIG.sheetEndpoint)
    ? window.BLOCKBIT_CONFIG.sheetEndpoint
    : DEFAULT_ENDPOINT;

  fetch(endpoint + '?action=settings&_nocache=' + Date.now(), { cache: 'no-store' })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (data && data.ok && data.settings) {
        try {
          const cacheObj = { settings: data.settings, savedAt: Date.now(), isServerConfirmed: true };
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(cacheObj));
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cacheObj));
        } catch (e) {}
        data.settings._isServerConfirmed = true;
        applySettings(data.settings, true);
      }
    })
    .catch(function (err) {
      console.warn('Background banner sync failed:', err);
    });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTopBanner);
} else {
  initTopBanner();
}
window.addEventListener('pageshow', initTopBanner);
