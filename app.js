/* ==========================================================================
   BLOCKBIT INK — MASTER INTERACTIVE APP ENGINE
   ========================================================================== */

// === AMBIENT CANVAS PARTICLES (Light Cyber Aesthetic) ===
class AmbientScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.clouds = [];
    this.lastTime = performance.now();
    this.time = 0;
    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());

    // Ambient floating mist / clouds
    for (let i = 0; i < 6; i++) {
      this.clouds.push({
        x: Math.random() * this.canvas.width,
        y: 20 + Math.random() * (this.canvas.height * 0.45),
        w: 140 + Math.random() * 200,
        h: 45 + Math.random() * 55,
        speed: 0.15 + Math.random() * 0.25,
        opacity: 0.12 + Math.random() * 0.16
      });
    }

    // Glowing energy sparks (Electric Blue & Royal Purple)
    for (let i = 0; i < 40; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        r: 1.5 + Math.random() * 2.5,
        speedY: 0.2 + Math.random() * 0.5,
        speedX: (Math.random() - 0.5) * 0.3,
        phase: Math.random() * Math.PI * 2,
        color: Math.random() > 0.5 ? 'rgba(124, 58, 237, ' : 'rgba(2, 132, 199, '
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

    this.clouds.forEach(c => {
      c.x += c.speed * dt * 60;
      if (c.x > this.canvas.width + 250) {
        c.x = -250;
        c.y = 20 + Math.random() * (this.canvas.height * 0.45);
      }
    });

    this.particles.forEach(p => {
      p.y -= p.speedY * dt * 60;
      p.x += Math.sin(p.phase + this.time * 1.5) * 0.5;
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

    // Luminous subtle mist
    this.clouds.forEach(c => {
      const grad = ctx.createRadialGradient(c.x + c.w/2, c.y + c.h/2, 10, c.x + c.w/2, c.y + c.h/2, c.w/2);
      grad.addColorStop(0, `rgba(124, 58, 237, ${c.opacity})`);
      grad.addColorStop(0.6, `rgba(2, 132, 199, ${c.opacity * 0.5})`);
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(c.x + c.w/2, c.y + c.h/2, c.w/2, c.h/2, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    // Glowing energy sparks
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

// === LIVE WARRIOR FORGE RENDERER ===
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
    console.log('Renderer init notice:', e);
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
    document.getElementById('forgeName').textContent = 'Warrior #' + String(randomId).padStart(4, '0');
    document.getElementById('forgeRank').textContent = (traits.Rank || 'Epic') + ' Tier';
    document.getElementById('traitClan').textContent = traits.Clan || 'Honoo (Fire)';
    document.getElementById('traitWeapon').textContent = traits.Weapon || 'Katana of Ink';
    document.getElementById('traitAura').textContent = traits.Aura || 'Cyber Plasma';
    document.getElementById('traitOutfit').textContent = traits.Outfit || 'Cyber Kimono';
  } else {
    // Fallback preview
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
  initScrollAnimations();
  initFAQ();
  initCountUp();
  initTiltCards();
  initForge();
});

// === Navigation Scroll Glass ===
function initNav() {
  const nav = document.getElementById('nav');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  });
}

// === Scroll Reveal Animations ===
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.fade-in, .scale-in, .stagger').forEach(el => {
    observer.observe(el);
  });
}

// === FAQ Accordion ===
function initFAQ() {
  document.querySelectorAll('.faq-item').forEach(item => {
    const btn = item.querySelector('.faq-question');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const wasActive = item.classList.contains('active');
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
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
        const increment = target / 45;
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
  document.querySelectorAll('.gallery-card, .feature-card, .clan-item, .roadmap-item').forEach(card => {
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
