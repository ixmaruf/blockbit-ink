/* ==========================================================================
   BLOCKBIT INK — MASTER INTERACTIVE APP ENGINE
   Ambient Particles, Live Procedural DNA Forge, 3D Card Tilts, FAQ Drawer
   ========================================================================== */

// === AMBIENT PARTICLES (Electric Azure & Royal Violet) ===
class AmbientScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.lastTime = performance.now();
    this.time = 0;
    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());

    for (let i = 0; i < 45; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        r: 1.5 + Math.random() * 2.5,
        speedY: 0.2 + Math.random() * 0.45,
        speedX: (Math.random() - 0.5) * 0.25,
        phase: Math.random() * Math.PI * 2,
        color: Math.random() > 0.5 ? 'rgba(124, 58, 237, ' : 'rgba(14, 165, 233, '
      });
    }

    this.animate();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  update(dt) {
    this.time += dt;

    this.particles.forEach(p => {
      p.y -= p.speedY * dt * 60;
      p.x += Math.sin(p.phase + this.time * 1.5) * 0.4;
      if (p.y < -20) {
        p.y = this.canvas.height + 20;
        p.x = Math.random() * this.canvas.width;
      }
    });
  }

  draw() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    this.particles.forEach(p => {
      const alpha = 0.35 + Math.sin(p.phase + this.time * 2) * 0.25;
      ctx.fillStyle = p.color + Math.max(0.1, alpha) + ')';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  animate() {
    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    this.update(dt);
    this.draw();

    requestAnimationFrame(() => this.animate());
  }
}

// === LIVE WARRIOR DNA FORGE RENDERER ===
let _forgeRenderer = null;

function initForge() {
  const canvas = document.getElementById('forgeCanvas');
  if (!canvas) return;
  try {
    if (typeof NFTRenderer !== 'undefined') {
      _forgeRenderer = new NFTRenderer(canvas);
      randomizeForgeWarrior();
    }
  } catch (e) {
    console.log('Renderer note:', e);
  }
}

function randomizeForgeWarrior() {
  const canvas = document.getElementById('forgeCanvas');
  if (!canvas) return;

  const randomId = Math.floor(1 + Math.random() * 1999);
  const seed = randomId * 7919 + 31337;

  let traits = null;
  if (typeof generateTraits === 'function') {
    traits = generateTraits(seed);
  }

  if (traits) {
    if (_forgeRenderer) {
      _forgeRenderer.render(traits);
    }
    const nameEl = document.getElementById('forgeName');
    const rankEl = document.getElementById('forgeRank');
    const clanEl = document.getElementById('traitClan');
    const weaponEl = document.getElementById('traitWeapon');
    const auraEl = document.getElementById('traitAura');
    const outfitEl = document.getElementById('traitOutfit');

    if (nameEl) nameEl.textContent = 'Warrior #' + String(randomId).padStart(4, '0');
    if (rankEl) rankEl.textContent = (traits.Rank || 'Epic') + ' Rank';
    if (clanEl) clanEl.textContent = traits.Clan || 'Honoo (Flame)';
    if (weaponEl) weaponEl.textContent = traits.Weapon || 'Katana of Ink';
    if (auraEl) auraEl.textContent = traits.Aura || 'Cyber Plasma';
    if (outfitEl) outfitEl.textContent = traits.Outfit || 'Cyber Kimono';
  } else {
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = 'nft-preview/' + [1, 42, 100, 200, 300, 500, 700, 1000][Math.floor(Math.random() * 8)] + '.png';
    img.onload = () => {
      ctx.clearRect(0, 0, 400, 400);
      ctx.drawImage(img, 0, 0, 400, 400);
    };
  }
}

// === DOM READY ===
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('ambient-canvas');
  if (canvas) {
    new AmbientScene(canvas);
  }

  initNav();
  initFAQ();
  initCountUp();
  initTiltCards();
  initForge();
});

// === Navigation Scroll Effect ===
function initNav() {
  const nav = document.getElementById('nav');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  });
}

// === FAQ Accordion ===
function initFAQ() {
  document.querySelectorAll('.faq-accordion-card').forEach(item => {
    const trigger = item.querySelector('.faq-toggle-trigger');
    if (!trigger) return;
    trigger.addEventListener('click', () => {
      const wasActive = item.classList.contains('active');
      document.querySelectorAll('.faq-accordion-card').forEach(i => i.classList.remove('active'));
      if (!wasActive) item.classList.add('active');
    });
  });
}

// === Number Counters ===
function initCountUp() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.count);
        let current = 0;
        const increment = target / 40;
        const timer = setInterval(() => {
          current += increment;
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

// === 3D Perspective Tilt on Hover ===
function initTiltCards() {
  document.querySelectorAll('.roster-card, .elemental-clan-card, .architecture-card, .roadmap-phase-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const tiltX = (y - 0.5) * 8;
      const tiltY = (x - 0.5) * -8;
      card.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-6px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}
