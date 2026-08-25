/* ==========================================================================
   Blockbit Ink — Ambient 2D Canvas Scene Engine (Light Theme & Particles)
   ========================================================================== */

class VillageScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.clouds = [];
    this.particles = [];
    this.lastTime = performance.now();
    this.time = 0;
    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());

    // Ambient floating clouds / mist
    for (let i = 0; i < 6; i++) {
      this.clouds.push({
        x: Math.random() * this.canvas.width,
        y: 20 + Math.random() * (this.canvas.height * 0.4),
        w: 120 + Math.random() * 180,
        h: 40 + Math.random() * 50,
        speed: 0.15 + Math.random() * 0.25,
        opacity: 0.15 + Math.random() * 0.2
      });
    }

    // Glowing energy motes (Electric Blue & Royal Purple)
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

    // Move clouds
    this.clouds.forEach(c => {
      c.x += c.speed * dt * 60;
      if (c.x > this.canvas.width + 250) {
        c.x = -250;
        c.y = 20 + Math.random() * (this.canvas.height * 0.4);
      }
    });

    // Move floating motes
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

    // Clear with transparency
    ctx.clearRect(0, 0, w, h);

    // Draw soft luminous clouds
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

    // Draw glowing particles
    this.particles.forEach(p => {
      const alpha = 0.3 + Math.sin(p.phase + this.time * 2) * 0.25;
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

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('village-canvas') || document.getElementById('ambient-canvas');
  if (canvas) {
    new VillageScene(canvas);
  }
});