/* Blockbit Ink - Game Style Animations */

let _hiddenCanvas, _renderer;
try {
  _hiddenCanvas = document.createElement('canvas');
  _renderer = new NFTRenderer(_hiddenCanvas);
} catch (e) {
  _renderer = { render: () => {} };
}

function renderNFTTo(targetCanvas, nftData, size) {
  try {
    targetCanvas.width = size;
    targetCanvas.height = size;
    _renderer.render(nftData);
    const tCtx = targetCanvas.getContext('2d');
    tCtx.drawImage(_hiddenCanvas, 0, 0, size, size);
  } catch (e) {}
}

document.addEventListener('DOMContentLoaded', () => {
  // Initialize the village scene
  if (typeof VillageScene !== 'undefined') {
    const canvas = document.getElementById('village-canvas');
    if (canvas) {
      const scene = new VillageScene(canvas);
      scene.start();
    }
  }

  initNav();
  initScrollAnimations();
  initFAQ();
  initCountUp();
  initMagneticButtons();
  initTiltCards();
  initStagger();
});

// === Navigation ===
function initNav() {
  const nav = document.getElementById('nav');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 50);
  });
}

// === Scroll Animations ===
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
  document.querySelectorAll('.fade-in, .slide-left, .slide-right, .scale-in, .stagger').forEach(el => {
    observer.observe(el);
  });
}

// === FAQ ===
function initFAQ() {
  document.querySelectorAll('.faq-item').forEach(item => {
    item.querySelector('.faq-question').addEventListener('click', () => {
      const wasActive = item.classList.contains('active');
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
      if (!wasActive) item.classList.add('active');
    });
  });
}

// === Count Up ===
function initCountUp() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.count);
        let current = 0;
        const increment = target / 60;
        const timer = setInterval(() => {
          current += increment;
          if (current >= target) { current = target; clearInterval(timer); }
          el.textContent = Math.floor(current).toLocaleString();
        }, 25);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('[data-count]').forEach(el => observer.observe(el));
}

// === Magnetic Buttons ===
function initMagneticButtons() {
  document.querySelectorAll('.btn-wood').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });
}

// === Tilt Cards ===
function initTiltCards() {
  document.querySelectorAll('.gallery-card, .feature-card, .roadmap-item').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const tiltX = (y - 0.5) * 10;
      const tiltY = (x - 0.5) * -10;
      card.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-6px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

function initStagger() {}
