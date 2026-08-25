/* Blockbit Ink - Village Scene Engine */

class VillageScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.characters = [];
    this.clouds = [];
    this.trees = [];
    this.fish = [];
    this.particles = [];
    this.lastTime = 0;
    this.time = 0;
    this.scrollX = 0;
    this.scrollSpeed = 0.3;
    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());

    // Create clouds
    for (let i = 0; i < 8; i++) {
      this.clouds.push({
        x: Math.random() * this.canvas.width * 2,
        y: 30 + Math.random() * 80,
        w: 60 + Math.random() * 80,
        h: 25 + Math.random() * 20,
        speed: 0.2 + Math.random() * 0.3,
        opacity: 0.6 + Math.random() * 0.3
      });
    }

    // Create trees at different depths
    for (let i = 0; i < 15; i++) {
      this.trees.push({
        x: i * 180 + Math.random() * 60,
        type: Math.floor(Math.random() * 3),
        size: 60 + Math.random() * 40,
        depth: Math.random() < 0.4 ? 'back' : (Math.random() < 0.5 ? 'mid' : 'front'),
        swayOffset: Math.random() * Math.PI * 2
      });
    }

    // Create fish
    for (let i = 0; i < 5; i++) {
      this.fish.push({
        x: Math.random() * this.canvas.width,
        y: this.canvas.height * 0.7 + Math.random() * 30,
        size: 6 + Math.random() * 4,
        speed: 0.5 + Math.random() * 0.5,
        direction: Math.random() > 0.5 ? 1 : -1,
        bobOffset: Math.random() * Math.PI * 2
      });
    }

    // Create particles (fireflies/embers)
    for (let i = 0; i < 30; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height * 0.8,
        r: 1 + Math.random() * 2,
        speed: 0.3 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
        alpha: 0.4 + Math.random() * 0.4
      });
    }

    // Create walking characters
    this.createCharacters();
  }

  createCharacters() {
    if (typeof generateTraits === 'undefined') return;

    // Pre-render NFT character sprites
    const positions = [
      { x: 200, groundY: 0.85, speed: 0.4, token: 1 },
      { x: 450, groundY: 0.85, speed: -0.3, token: 42 },
      { x: 700, groundY: 0.87, speed: 0.5, token: 100 },
      { x: 950, groundY: 0.85, speed: -0.4, token: 200 },
      { x: 1200, groundY: 0.86, speed: 0.35, token: 300 },
      { x: 1450, groundY: 0.85, speed: -0.45, token: 500 },
    ];

    positions.forEach((pos) => {
      try {
        const seed = pos.token * 7919 + 31337;
        const nftData = generateTraits(seed);

        // Render to offscreen canvas
        const offCanvas = document.createElement('canvas');
        offCanvas.width = 80;
        offCanvas.height = 80;
        if (typeof _renderer !== 'undefined') {
          _renderer.render(nftData);
          const offCtx = offCanvas.getContext('2d');
          offCtx.drawImage(_hiddenCanvas, 0, 0, 80, 80);
        }

        this.characters.push({
          sprite: offCanvas,
          x: pos.x,
          y: this.canvas.height * pos.groundY,
          baseY: this.canvas.height * pos.groundY,
          speed: pos.speed,
          size: 90,
          frame: 0,
          frameTime: 0,
          direction: pos.speed > 0 ? 1 : -1,
          bobPhase: Math.random() * Math.PI * 2,
          tokenId: pos.token
        });
      } catch (e) {}
    });
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    if (this.trees) {
      this.trees.forEach(t => { /* trees use relative positions */ });
    }
  }

  update(dt) {
    this.time += dt;
    this.scrollX += this.scrollSpeed * dt * 60;

    // Update clouds
    this.clouds.forEach(cloud => {
      cloud.x -= cloud.speed * dt * 60;
      if (cloud.x + cloud.w < -200) cloud.x = this.canvas.width + 200;
      if (cloud.x > this.canvas.width + 200) cloud.x = -cloud.w - 200;
    });

    // Update fish
    this.fish.forEach(fish => {
      fish.x += fish.speed * fish.direction * dt * 60;
      if (fish.x > this.canvas.width + 50) fish.x = -50;
      if (fish.x < -50) fish.x = this.canvas.width + 50;
    });

    // Update particles (floating embers)
    this.particles.forEach(p => {
      p.y -= p.speed * dt * 60;
      p.x += Math.sin(p.phase + this.time * 2) * 0.5;
      if (p.y < 0) {
        p.y = this.canvas.height * 0.8;
        p.x = Math.random() * this.canvas.width;
      }
    });

    // Update characters - walking animation
    this.characters.forEach(char => {
      char.x += char.speed * dt * 60;
      char.bobPhase += dt * 4;

      // Walking bounce
      char.y = char.baseY + Math.sin(char.bobPhase) * 4;

      // Frame animation (walk cycle)
      char.frameTime += dt;
      if (char.frameTime > 0.15) {
        char.frame = (char.frame + 1) % 4;
        char.frameTime = 0;
      }

      // Wrap around
      if (char.speed > 0 && char.x > this.canvas.width + 100) char.x = -100;
      if (char.speed < 0 && char.x < -100) char.x = this.canvas.width + 100;
    });
  }

  draw() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0, '#1a0a3e');
    skyGrad.addColorStop(0.3, '#3d1b6e');
    skyGrad.addColorStop(0.5, '#6b2d8e');
    skyGrad.addColorStop(0.7, '#9a4d8e');
    skyGrad.addColorStop(1, '#d96b7e');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Stars
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    for (let i = 0; i < 50; i++) {
      const sx = (i * 137) % w;
      const sy = (i * 53) % (h * 0.3);
      const sr = 0.5 + Math.sin(this.time * 2 + i) * 0.5;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }

    // Sun
    const sunX = w * 0.7;
    const sunY = h * 0.25;
    const sunGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 100);
    sunGrad.addColorStop(0, 'rgba(255,220,100,1)');
    sunGrad.addColorStop(0.3, 'rgba(255,180,80,0.8)');
    sunGrad.addColorStop(0.7, 'rgba(255,120,100,0.3)');
    sunGrad.addColorStop(1, 'rgba(255,100,100,0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 100, 0, Math.PI * 2);
    ctx.fill();

    // Sun core
    ctx.fillStyle = '#ffeb8a';
    ctx.beginPath();
    ctx.arc(sunX, sunY, 30, 0, Math.PI * 2);
    ctx.fill();

    // Clouds
    this.clouds.forEach(cloud => {
      this.drawCloud(cloud.x, cloud.y, cloud.w, cloud.h, cloud.opacity);
    });

    // Distant mountains
    this.drawMountains(w, h);

    // Mid trees
    this.drawTreeLayer(w, h, 'mid');

    // River/water
    this.drawWater(w, h);

    // Front trees
    this.drawTreeLayer(w, h, 'front');

    // Characters walking
    this.characters.forEach(char => {
      this.drawCharacter(char);
    });

    // Foreground grass
    this.drawGrass(w, h);

    // Particles
    this.particles.forEach(p => {
      const alpha = p.alpha * (0.5 + 0.5 * Math.sin(this.time * 2 + p.phase));
      ctx.fillStyle = `rgba(255,200,100,${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  drawCloud(x, y, w, h, opacity) {
    const ctx = this.ctx;
    ctx.fillStyle = `rgba(220,200,240,${opacity * 0.4})`;
    ctx.beginPath();
    ctx.arc(x, y, h * 1.5, 0, Math.PI * 2);
    ctx.arc(x + w * 0.3, y - h * 0.3, h * 1.2, 0, Math.PI * 2);
    ctx.arc(x + w * 0.6, y, h * 1.4, 0, Math.PI * 2);
    ctx.arc(x + w * 0.9, y - h * 0.2, h * 1.1, 0, Math.PI * 2);
    ctx.fill();
  }

  drawMountains(w, h) {
    const ctx = this.ctx;
    const offset = (this.scrollX * 0.2) % 400;

    // Far mountains
    ctx.fillStyle = '#4a2870';
    for (let i = -1; i < 6; i++) {
      const mx = i * 300 - offset;
      const mh = 100 + (i % 3) * 30;
      ctx.beginPath();
      ctx.moveTo(mx, h * 0.5);
      ctx.lineTo(mx + 150, h * 0.5 - mh);
      ctx.lineTo(mx + 300, h * 0.5);
      ctx.closePath();
      ctx.fill();
    }

    // Near mountains
    ctx.fillStyle = '#2d1a4d';
    for (let i = -1; i < 6; i++) {
      const mx = i * 350 - offset * 1.5;
      const mh = 80 + (i % 2) * 40;
      ctx.beginPath();
      ctx.moveTo(mx, h * 0.6);
      ctx.lineTo(mx + 175, h * 0.6 - mh);
      ctx.lineTo(mx + 350, h * 0.6);
      ctx.closePath();
      ctx.fill();
    }
  }

  drawTreeLayer(w, h, layer) {
    const ctx = this.ctx;
    const offset = (this.scrollX * (layer === 'back' ? 0.3 : 0.7)) % 400;
    const yBase = layer === 'back' ? h * 0.65 : h * 0.82;
    const baseSize = layer === 'back' ? 40 : 70;
    const baseHue = layer === 'back' ? '#2a4a2a' : '#1a3a1a';
    const baseHueLight = layer === 'back' ? '#3a5a3a' : '#2a4a2a';

    for (let i = -1; i < 8; i++) {
      const tx = i * 150 - offset + 75;
      const treeH = baseSize + Math.sin(i * 2.3) * 15;
      const treeW = baseSize * 0.7;

      // Trunk
      ctx.fillStyle = '#3a2a1a';
      ctx.fillRect(tx - 3, yBase - treeH * 0.3, 6, treeH * 0.3);

      // Foliage layers
      ctx.fillStyle = baseHue;
      ctx.beginPath();
      ctx.moveTo(tx, yBase - treeH);
      ctx.lineTo(tx - treeW, yBase - treeH * 0.3);
      ctx.lineTo(tx + treeW, yBase - treeH * 0.3);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = baseHueLight;
      ctx.beginPath();
      ctx.moveTo(tx, yBase - treeH * 0.8);
      ctx.lineTo(tx - treeW * 0.8, yBase - treeH * 0.3);
      ctx.lineTo(tx + treeW * 0.8, yBase - treeH * 0.3);
      ctx.closePath();
      ctx.fill();
    }
  }

  drawWater(w, h) {
    const ctx = this.ctx;
    const waterY = h * 0.7;

    // Water gradient
    const waterGrad = ctx.createLinearGradient(0, waterY, 0, h);
    waterGrad.addColorStop(0, 'rgba(80,120,200,0.7)');
    waterGrad.addColorStop(1, 'rgba(30,60,120,0.9)');
    ctx.fillStyle = waterGrad;
    ctx.fillRect(0, waterY, w, h * 0.15);

    // Water ripples
    for (let i = 0; i < 6; i++) {
      const rx = ((i * 200 + this.scrollX * 0.5) % (w + 200)) - 100;
      const ry = waterY + 20 + i * 6;
      ctx.strokeStyle = `rgba(150,200,255,${0.4 - i * 0.05})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.bezierCurveTo(rx + 20, ry - 3, rx + 40, ry + 3, rx + 60, ry);
      ctx.stroke();
    }

    // Fish
    this.fish.forEach(fish => {
      ctx.save();
      ctx.translate(fish.x, fish.y + Math.sin(this.time * 3 + fish.bobOffset) * 3);
      ctx.scale(fish.direction, 1);
      ctx.fillStyle = '#4a6a9a';
      ctx.beginPath();
      ctx.ellipse(0, 0, fish.size, fish.size * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(fish.size, 0);
      ctx.lineTo(fish.size * 1.5, -fish.size * 0.5);
      ctx.lineTo(fish.size * 1.5, fish.size * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });
  }

  drawGrass(w, h) {
    const ctx = this.ctx;
    ctx.fillStyle = '#1a3a1a';
    ctx.fillRect(0, h * 0.82, w, h * 0.18);

    // Grass blades
    const offset = (this.scrollX * 1) % 30;
    for (let i = -1; i < w / 8 + 2; i++) {
      const gx = i * 8 - offset;
      const gh = 4 + Math.sin(i * 1.3) * 2;
      ctx.strokeStyle = '#2a5a2a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(gx, h * 0.82);
      ctx.lineTo(gx + 1, h * 0.82 - gh);
      ctx.stroke();
    }
  }

  drawCharacter(char) {
    const ctx = this.ctx;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(char.x, char.baseY + 4, char.size * 0.4, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Draw character sprite
    const size = char.size;
    const x = char.x - size / 2;
    const y = char.y - size;

    ctx.save();
    if (char.direction < 0) {
      ctx.translate(char.x, y + size);
      ctx.scale(-1, 1);
      ctx.translate(-char.x, -(y + size));
    }

    // Glow effect
    ctx.shadowColor = 'rgba(168,85,247,0.6)';
    ctx.shadowBlur = 15;
    ctx.drawImage(char.sprite, x, y, size, size);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  start() {
    this.lastTime = performance.now();
    const loop = (time) => {
      const dt = Math.min((time - this.lastTime) / 1000, 0.05);
      this.lastTime = time;
      this.update(dt);
      this.draw();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}
