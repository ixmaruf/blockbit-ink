/* ==========================================================================
   BLOCKBIT INK — APP.JS
   Animations, Ambient Canvas, Petals Canvas, DNA Forge, FAQ, Scroll-reveal
   ========================================================================== */

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
      mobileMenu.classList.toggle('open');
      const isOpen = mobileMenu.classList.contains('open');
      
      // Change icon
      mobileMenuBtn.innerHTML = isOpen 
        ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>`
        : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>`;
    });
    
    // Close menu when a link is clicked
    const mobileLinks = mobileMenu.querySelectorAll('a');
    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
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
  }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

  revealEls.forEach(el => {
    revealObs.observe(el);
  });

  // ── AMBIENT CANVAS (Particles & Lines) ──
  const ac = document.getElementById('ambient-canvas');
  if (ac) {
    const ctx = ac.getContext('2d');
    let w, h;
    const particles = [];
    const PARTICLE_COUNT = 60;

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
        this.r = Math.random() * 1.5 + 0.5;
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = (Math.random() - 0.5) * 0.3;
        this.alpha = Math.random() * 0.25 + 0.05;
        this.color = `rgba(124,58,237,${this.alpha})`;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > w || this.y < 0 || this.y > h) this.reset();
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
      }
    }
    for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle());

    function animateAc() {
      ctx.clearRect(0, 0, w, h);
      particles.forEach(p => { p.update(); p.draw(); });
      // draw subtle connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = dx * dx + dy * dy;
          if (d < 18000) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(124,58,237,${0.03 * (1 - d / 18000)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(animateAc);
    }
    animateAc();
  }

  // ── PETALS CANVAS (Falling Leaves/Petals) ──
  const pc = document.getElementById('petals-canvas');
  if (pc) {
    const ctx2 = pc.getContext('2d');
    let pw, ph;
    const petals = [];
    const PETAL_COUNT = 30; // Not too dense to keep it elegant

    function resizePc() {
      pw = pc.width = window.innerWidth;
      ph = pc.height = window.innerHeight;
    }
    resizePc();
    window.addEventListener('resize', resizePc);

    class Petal {
      constructor() { this.reset(true); }
      reset(randomY = false) {
        this.x = Math.random() * pw;
        this.y = randomY ? Math.random() * ph : -20;
        this.z = Math.random() * 0.8 + 0.2; // depth scale
        this.width = (Math.random() * 8 + 4) * this.z;
        this.height = (Math.random() * 12 + 6) * this.z;
        this.vx = (Math.random() - 0.5) * 1.5;
        this.vy = (Math.random() * 1.5 + 1) * this.z;
        this.rotation = Math.random() * Math.PI * 2;
        this.rs = (Math.random() - 0.5) * 0.05; // rotation speed
        this.oscillationSpeed = Math.random() * 0.02 + 0.01;
        this.oscillationOffset = Math.random() * Math.PI * 2;
        
        // Deep purple to soft purple
        const r = 124, g = 58, b = 237;
        const opacity = Math.random() * 0.4 + 0.2;
        this.color = `rgba(${r},${g},${b},${opacity})`;
      }
      update() {
        this.rotation += this.rs;
        this.x += this.vx + Math.sin(Date.now() * this.oscillationSpeed + this.oscillationOffset) * 0.5;
        this.y += this.vy;
        
        if (this.y > ph + 20 || this.x > pw + 20 || this.x < -20) {
          this.reset();
        }
      }
      draw() {
        ctx2.save();
        ctx2.translate(this.x, this.y);
        ctx2.rotate(this.rotation);
        
        // Draw petal shape
        ctx2.beginPath();
        ctx2.moveTo(0, -this.height/2);
        ctx2.bezierCurveTo(this.width/2, -this.height/4, this.width/2, this.height/4, 0, this.height/2);
        ctx2.bezierCurveTo(-this.width/2, this.height/4, -this.width/2, -this.height/4, 0, -this.height/2);
        
        ctx2.fillStyle = this.color;
        ctx2.fill();
        ctx2.restore();
      }
    }
    
    for (let i = 0; i < PETAL_COUNT; i++) petals.push(new Petal());
    
    function animatePc() {
      ctx2.clearRect(0, 0, pw, ph);
      petals.forEach(p => { p.update(); p.draw(); });
      requestAnimationFrame(animatePc);
    }
    animatePc();
  }

  // ── DNA FORGE ──
  initForge();

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
  
  // Set to internal rendering size (2000x2000) for high quality
  canvas.width = 2000;
  canvas.height = 2000;
  
  // Create renderer instance from generator.js
  if (typeof NFTRenderer !== 'undefined') {
    forgeRenderer = new NFTRenderer(canvas);
    randomizeForgeWarrior();
  }
}

function randomizeForgeWarrior() {
  if (!forgeRenderer || typeof generateNFT === 'undefined') return;
  
  // Generate a random seed
  const seed = Math.floor(Math.random() * 1999) + 1;
  
  try {
    // Generate traits from traits.js
    const nftData = generateNFT(seed);
    
    // Render the pixel art character onto the canvas
    forgeRenderer.render(nftData);
    
    // Update UI Elements
    const nameEl = document.getElementById('forgeName');
    const rankEl = document.getElementById('forgeRank');
    const traitsGrid = document.getElementById('forgeTraitsGrid');
    
    if (nameEl) nameEl.textContent = `Blockbit #${String(seed).padStart(4, '0')}`;
    
    if (rankEl && nftData.rarity) {
      rankEl.textContent = nftData.rarity.name || nftData.rarity.tier || 'Common';
      rankEl.style.color = nftData.rarity.color || 'var(--violet)';
      rankEl.style.borderColor = nftData.rarity.color || 'var(--violet)';
    }
    
    if (traitsGrid && nftData.traits) {
      // Pick up to 4 interesting traits to display
      const traitsToShow = ['Outfit', 'Hair Style', 'Eyes', 'Accessory'];
      traitsGrid.innerHTML = '';
      
      for (const tName of traitsToShow) {
        if (nftData.traits[tName]) {
          const tVal = nftData.traits[tName].name;
          traitsGrid.innerHTML += `
            <div class="trait-cell">
              <div class="trait-key">${tName}</div>
              <div class="trait-val">${tVal}</div>
            </div>
          `;
        }
      }
    }
  } catch (e) {
    console.error("Error generating Forge NFT:", e);
  }
}
window.randomizeForgeWarrior = randomizeForgeWarrior;

/* ── TOP BANNER WHITELIST SYNC ── */
function initTopBanner() {
  const labelEl = document.getElementById('top-banner-label');
  const countEl = document.getElementById('top-countdown');
  const pulseEl = document.getElementById('bannerPulse');
  if (!labelEl || !countEl) return;

  let bannerInterval = null;

  function applySettings(settings) {
    if (!settings) return;

    const isOpen = settings.whitelistOpen !== 'false' && settings.whitelistOpen !== 'Off';

    if (!isOpen) {
      if (bannerInterval) {
        clearInterval(bannerInterval);
        bannerInterval = null;
      }
      labelEl.textContent = 'WHITELIST OPENS SOON';
      countEl.textContent = 'Stay tuned for Genesis Initiation';
      if (pulseEl) {
        pulseEl.style.backgroundColor = '#F59E0B';
        pulseEl.style.boxShadow = '0 0 0 rgba(245, 158, 11, 0.7)';
      }
      return;
    }

    // When Open: Parse Bangladesh time (UTC+6)
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
    const durationHours = parseInt(settings.timerDuration || '48', 10);
    const durationMs = (isNaN(durationHours) ? 48 : durationHours) * 60 * 60 * 1000;
    const endTime = startMs + durationMs;

    if (pulseEl) {
      pulseEl.style.backgroundColor = '#10B981';
      pulseEl.style.boxShadow = '0 0 0 rgba(16, 185, 129, 0.7)';
    }

    function updateBannerTimer() {
      const now = Date.now();
      const remaining = endTime - now;

      if (remaining <= 0) {
        labelEl.textContent = 'WHITELIST CLOSED';
        countEl.textContent = 'Allocations Filled';
        if (pulseEl) {
          pulseEl.style.backgroundColor = '#94A3B8';
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

      labelEl.textContent = 'WHITELIST ENDING IN:';
      countEl.textContent = totalHours.toString().padStart(2, '0') + 'h ' +
                            mins.toString().padStart(2, '0') + 'm ' +
                            secs.toString().padStart(2, '0') + 's';
    }

    if (bannerInterval) clearInterval(bannerInterval);
    updateBannerTimer();
    bannerInterval = setInterval(updateBannerTimer, 1000);
  }

  // Clear old localStorage cache
  try {
    localStorage.removeItem('blockbit_wl_settings');
  } catch (e) {}

  // Fetch live settings directly from Google Apps Script
  if (window.BLOCKBIT_CONFIG && window.BLOCKBIT_CONFIG.sheetEndpoint) {
    fetch(BLOCKBIT_CONFIG.sheetEndpoint + '?action=settings&_nocache=' + Date.now(), { cache: 'no-store' })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data && data.ok && data.settings) {
          applySettings(data.settings);
        }
      })
      .catch(function (err) {
        console.warn('Banner settings fetch failed:', err);
      });
  }
}

document.addEventListener('DOMContentLoaded', initTopBanner);
