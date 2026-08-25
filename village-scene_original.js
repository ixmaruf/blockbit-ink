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