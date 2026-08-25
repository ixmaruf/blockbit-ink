/**
 * Blockbit Ink — Ultra-Detailed 3D Stylized Cartoon Gaming World Engine
 * Built with Three.js (r128)
 * 
 * Features:
 * - High-Detail Procedural Textures (Roof Shingles, Wood Planks, Cobblestone, Foliage, Grass)
 * - Intricately Detailed Cottages (Timber Frames, Balconies, Flower Boxes, Chimneys, Roof Tiles)
 * - Animated Windmill with Detailed Lattice Sails & Mechanism
 * - Animated Water River with Ripples, Caustics, Water Lily Clusters & Stepping Stones
 * - Lush Multi-Tiered Trees, Flowering Bushes, Tall Grass Tufts, Mushrooms & Street Lanterns
 * - Japanese Torii Shrine with Glowing Stone Lanterns & Floating Magic Crystal
 * - Floating Fantasy Sky Islands with Waterfalls
 * - Crisp High-Contrast Lighting (Day, Sunset, Cyber-Night)
 * - Cinematic Scroll Journey & 360° Free Orbit Explore Mode
 * - 60 FPS Optimized with Instancing & Memory Efficient Procedural Materials
 */

class ThreeVillageWorld {
  constructor(canvasContainerId) {
    this.container = document.getElementById(canvasContainerId) || document.body;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = new THREE.Clock();

    // Scene groups
    this.worldGroup = new THREE.Group();
    this.terrainGroup = new THREE.Group();
    this.waterGroup = new THREE.Group();
    this.buildingsGroup = new THREE.Group();
    this.foliageGroup = new THREE.Group();
    this.charactersGroup = new THREE.Group();
    this.particlesGroup = new THREE.Group();
    this.cloudsGroup = new THREE.Group();

    // Animated objects
    this.windmillBlades = null;
    this.magicCrystal = null;
    this.smokeParticles = [];
    this.fireflies = [];
    this.floatingClouds = [];
    this.floatingIslands = [];
    this.characterPedestals = [];
    this.lanternLights = [];
    this.waterMesh = null;
    this.waterCaustics = null;

    // Lighting
    this.dirLight = null;
    this.hemiLight = null;
    this.ambientLight = null;
    this.crystalLight = null;
    this.currentMode = 'night';

    // Camera & Scroll State
    this.scrollProgress = 0;
    this.targetScrollProgress = 0;
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.isExploreMode = false;
    this.exploreAngle = { theta: 0.85, phi: 1.15, radius: 46 };
    this.isDragging = false;
    this.prevMouse = { x: 0, y: 0 };

    // Waypoints for Cinematic Scroll Path
    this.waypoints = [
      { pos: new THREE.Vector3(0, 19, 44), target: new THREE.Vector3(0, 3.5, 0) },      // Hero: Grand Village Overview
      { pos: new THREE.Vector3(-15, 9, 22), target: new THREE.Vector3(-4, 3.5, -2) },   // Lore: Cozy Library & Ancient Shrine
      { pos: new THREE.Vector3(12, 7.5, 18), target: new THREE.Vector3(0, 3, -3) },     // Showroom: Central Marketplace Bridge
      { pos: new THREE.Vector3(19, 15, 26), target: new THREE.Vector3(6, 7.5, -6) },    // Roadmap: Mountain Path & Windmill
      { pos: new THREE.Vector3(0, 6.5, 16), target: new THREE.Vector3(0, 4.5, -8) }     // Sanctuary: Glowing Magic Portal
    ];

    this.currentCamPos = new THREE.Vector3().copy(this.waypoints[0].pos);
    this.currentCamTarget = new THREE.Vector3().copy(this.waypoints[0].target);
    this.targetCamPos = new THREE.Vector3().copy(this.waypoints[0].pos);
    this.targetCamTarget = new THREE.Vector3().copy(this.waypoints[0].target);

    // Procedural Textures Cache
    this.textures = {};

    this.init();
  }

  init() {
    // 1. Scene & Renderer
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x0a0518, 0.014);

    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 350);
    this.camera.position.copy(this.waypoints[0].pos);
    this.camera.lookAt(this.waypoints[0].target);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.renderer.domElement.id = 'three-canvas';
    this.renderer.domElement.style.position = 'fixed';
    this.renderer.domElement.style.top = '0';
    this.renderer.domElement.style.left = '0';
    this.renderer.domElement.style.width = '100vw';
    this.renderer.domElement.style.height = '100vh';
    this.renderer.domElement.style.zIndex = '0';
    this.renderer.domElement.style.pointerEvents = 'none';
    this.container.appendChild(this.renderer.domElement);

    // Add Groups
    this.scene.add(this.worldGroup);
    this.worldGroup.add(this.terrainGroup);
    this.worldGroup.add(this.waterGroup);
    this.worldGroup.add(this.buildingsGroup);
    this.worldGroup.add(this.foliageGroup);
    this.worldGroup.add(this.charactersGroup);
    this.worldGroup.add(this.particlesGroup);
    this.worldGroup.add(this.cloudsGroup);

    // 2. Generate Detailed Textures
    this.generateProceduralTextures();

    // 3. Build Detailed World Components
    this.setupLighting();
    this.buildTerrain();
    this.buildMeadowDetails();
    this.buildRiverAndBridge();
    this.buildCottages();
    this.buildWindmill();
    this.buildToriiShrineAndTower();
    this.buildGrandProjectBillboard();
    this.buildFoliage();
    this.buildVillageDetails();
    this.buildFloatingIslands();
    this.buildCharacterPedestals();
    this.buildSkyAndClouds();
    this.buildParticles();

    // 4. Set Atmosphere (Exclusive Master Sunset Mode)
    this.setAtmosphere('sunset');

    // 5. Events & Animation
    this.bindEvents();
    this.animate();
  }

  // ==========================================
  // PROCEDURAL TEXTURE GENERATOR
  // ==========================================
  generateProceduralTextures() {
    // 1. Roof Shingles (Red Terracotta)
    this.textures.roofRed = this.createShingleTexture('#ef4444', '#b91c1c', '#f87171');
    // 2. Roof Shingles (Purple Slate)
    this.textures.roofPurple = this.createShingleTexture('#8b5cf6', '#5b21b6', '#c084fc');
    // 3. Roof Shingles (Cyan Slate)
    this.textures.roofCyan = this.createShingleTexture('#06b6d4', '#0e7490', '#67e8f9');
    // 4. Roof Shingles (Gold Clay)
    this.textures.roofGold = this.createShingleTexture('#f59e0b', '#b45309', '#fde047');

    // 5. Timber Wood Planks
    this.textures.woodPlanks = this.createWoodTexture('#854d0e', '#582c06', '#a16207');
    this.textures.woodDark = this.createWoodTexture('#451a03', '#270e02', '#78350f');

    // 6. Cobblestone Masonry
    this.textures.cobblestone = this.createCobbleTexture('#64748b', '#334155', '#94a3b8');
    this.textures.stoneDark = this.createCobbleTexture('#334155', '#1e293b', '#475569');

    // 7. Plaster Wall with Timber Half-Framing
    this.textures.wallCream = this.createWallTexture('#fef08a', '#eab308', '#78350f');
    this.textures.wallWhite = this.createWallTexture('#f8fafc', '#cbd5e1', '#451a03');
    this.textures.wallCyan = this.createWallTexture('#e0f2fe', '#38bdf8', '#075985');

    // 8. Ultra-Detailed Foliage Leaves (Pointed Anime Leaves with Veins & Rim Highlights)
    this.textures.leavesGreen = this.createDetailedLeavesTexture('#16a34a', '#14532d', '#4ade80', '#fbbf24');
    this.textures.leavesCherry = this.createDetailedLeavesTexture('#ec4899', '#9d174d', '#fbcfe8', '#fef08a');
    this.textures.leavesAutumn = this.createDetailedLeavesTexture('#ea580c', '#7c2d12', '#fbbf24', '#fde047');
    this.textures.leavesPine = this.createDetailedPineNeedleTexture('#15803d', '#052e16', '#86efac');

    // 9. Ultra-Detailed Organic Tree Bark
    this.textures.barkOak = this.createDetailedBarkTexture('#451a03', '#1c0800', '#78350f', '#166534');
    this.textures.barkSakura = this.createDetailedBarkTexture('#2e1065', '#0f051d', '#4c1d95', '#831843');
    this.textures.barkBirch = this.createDetailedBarkTexture('#e2e8f0', '#334155', '#ffffff', '#15803d');
  }

  createShingleTexture(baseHex, darkHex, lightHex) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = baseHex;
    ctx.fillRect(0, 0, 512, 512);

    const rows = 16;
    const cols = 16;
    const rh = 512 / rows;
    const cw = 512 / cols;

    for (let r = 0; r < rows; r++) {
      const offsetX = (r % 2) * (cw / 2);
      for (let c = -1; c <= cols; c++) {
        const x = c * cw + offsetX;
        const y = r * rh;

        // Tile base
        ctx.fillStyle = baseHex;
        ctx.fillRect(x + 1, y + 1, cw - 2, rh - 2);

        // Tile bevel highlight & shadow
        ctx.fillStyle = lightHex;
        ctx.fillRect(x + 1, y + 1, cw - 2, 3);

        ctx.fillStyle = darkHex;
        ctx.fillRect(x + 1, y + rh - 4, cw - 2, 4);
        ctx.fillRect(x + cw - 2, y + 1, 2, rh - 2);

        // Subtle gradient shading
        const grad = ctx.createLinearGradient(x, y, x, y + rh);
        grad.addColorStop(0, 'rgba(255,255,255,0.15)');
        grad.addColorStop(1, 'rgba(0,0,0,0.35)');
        ctx.fillStyle = grad;
        ctx.fillRect(x + 1, y + 1, cw - 2, rh - 2);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    return texture;
  }

  createWoodTexture(baseHex, darkHex, lightHex) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = baseHex;
    ctx.fillRect(0, 0, 512, 512);

    const plankCount = 8;
    const pw = 512 / plankCount;

    for (let i = 0; i < plankCount; i++) {
      const x = i * pw;
      // Plank seam
      ctx.fillStyle = darkHex;
      ctx.fillRect(x, 0, 3, 512);

      // Wood grain lines
      for (let g = 0; g < 12; g++) {
        const gx = x + 4 + Math.random() * (pw - 8);
        ctx.strokeStyle = (g % 2 === 0) ? lightHex : darkHex;
        ctx.lineWidth = 1 + Math.random() * 1.5;
        ctx.globalAlpha = 0.25;
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.bezierCurveTo(gx + 6, 170, gx - 6, 340, gx, 512);
        ctx.stroke();
      }
      ctx.globalAlpha = 1.0;

      // Iron Nails / Rivets
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.arc(x + pw / 2, 24, 4, 0, Math.PI * 2);
      ctx.arc(x + pw / 2, 488, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  createCobbleTexture(baseHex, mortarHex, lightHex) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Mortar background
    ctx.fillStyle = mortarHex;
    ctx.fillRect(0, 0, 512, 512);

    // Irregular rounded cobblestones
    const rows = 12;
    const cols = 12;
    const rw = 512 / cols;
    const rh = 512 / rows;

    for (let r = 0; r < rows; r++) {
      const offsetX = (r % 2) * (rw * 0.45);
      for (let c = -1; c <= cols; c++) {
        const cx = c * rw + offsetX + (Math.sin(r + c) * 4);
        const cy = r * rh + (Math.cos(r * 2) * 4);
        const stoneW = rw * 0.85;
        const stoneH = rh * 0.8;

        // Base stone shape
        ctx.fillStyle = baseHex;
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(cx + 2, cy + 2, stoneW, stoneH, 6) : ctx.rect(cx + 2, cy + 2, stoneW, stoneH);
        ctx.fill();

        // 3D Highlight & Shadow
        ctx.fillStyle = lightHex;
        ctx.fillRect(cx + 4, cy + 4, stoneW - 8, 3);

        const grad = ctx.createRadialGradient(cx + stoneW * 0.4, cy + stoneH * 0.3, 2, cx + stoneW * 0.5, cy + stoneH * 0.5, stoneW * 0.6);
        grad.addColorStop(0, 'rgba(255,255,255,0.2)');
        grad.addColorStop(1, 'rgba(0,0,0,0.4)');
        ctx.fillStyle = grad;
        ctx.fill();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    return texture;
  }

  createWallTexture(plasterHex, shadeHex, timberHex) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Plaster fill
    ctx.fillStyle = plasterHex;
    ctx.fillRect(0, 0, 512, 512);

    // Subtle plaster texture
    ctx.fillStyle = shadeHex;
    ctx.globalAlpha = 0.15;
    for (let i = 0; i < 400; i++) {
      ctx.fillRect(Math.random() * 512, Math.random() * 512, 3 + Math.random() * 8, 2);
    }
    ctx.globalAlpha = 1.0;

    // Exposed Timber Half-Framing (Outer Beams)
    ctx.fillStyle = timberHex;
    ctx.fillRect(0, 0, 24, 512);       // Left beam
    ctx.fillRect(488, 0, 24, 512);     // Right beam
    ctx.fillRect(0, 0, 512, 24);       // Top beam
    ctx.fillRect(0, 488, 512, 24);     // Bottom beam
    ctx.fillRect(0, 244, 512, 20);     // Mid horizontal beam

    // Diagonal Cross Beams
    ctx.beginPath();
    ctx.moveTo(24, 24);
    ctx.lineTo(44, 24);
    ctx.lineTo(488, 244);
    ctx.lineTo(468, 244);
    ctx.closePath();
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  createDetailedLeavesTexture(baseHex, darkHex, lightHex, rimHex) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = darkHex;
    ctx.fillRect(0, 0, 512, 512);

    // Layered pointed anime leaf silhouettes with veins
    for (let i = 0; i < 140; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const angle = Math.random() * Math.PI * 2;
      const length = 18 + Math.random() * 22;
      const width = 8 + Math.random() * 10;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // Leaf body (oval with pointed tip)
      ctx.beginPath();
      ctx.moveTo(0, -length);
      ctx.bezierCurveTo(width, -length * 0.4, width, length * 0.4, 0, length);
      ctx.bezierCurveTo(-width, length * 0.4, -width, -length * 0.4, 0, -length);
      ctx.closePath();

      ctx.fillStyle = (i % 3 === 0) ? lightHex : (i % 2 === 0 ? baseHex : darkHex);
      ctx.globalAlpha = 0.85;
      ctx.fill();

      // Leaf rim highlight (sunset glint)
      ctx.strokeStyle = rimHex;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.4;
      ctx.stroke();

      // Leaf center vein
      ctx.beginPath();
      ctx.moveTo(0, -length * 0.85);
      ctx.lineTo(0, length * 0.85);
      ctx.strokeStyle = darkHex;
      ctx.lineWidth = 1.0;
      ctx.globalAlpha = 0.6;
      ctx.stroke();

      ctx.restore();
    }
    ctx.globalAlpha = 1.0;

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  createDetailedPineNeedleTexture(baseHex, darkHex, lightHex) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = darkHex;
    ctx.fillRect(0, 0, 512, 512);

    // Radiating pine needle clusters
    for (let r = 0; r < 200; r++) {
      const cx = Math.random() * 512;
      const cy = Math.random() * 512;

      for (let n = 0; n < 8; n++) {
        const angle = (n / 8) * Math.PI - Math.PI / 2 + (Math.random() - 0.5) * 0.4;
        const len = 14 + Math.random() * 16;
        ctx.strokeStyle = (n % 2 === 0) ? lightHex : baseHex;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len);
        ctx.stroke();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  createDetailedBarkTexture(baseHex, darkHex, lightHex, mossHex) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = baseHex;
    ctx.fillRect(0, 0, 512, 512);

    // Deep vertical bark fissures
    for (let f = 0; f < 32; f++) {
      const x = (f / 32) * 512 + (Math.random() - 0.5) * 12;
      ctx.strokeStyle = darkHex;
      ctx.lineWidth = 3 + Math.random() * 4;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.bezierCurveTo(x + 12, 170, x - 12, 340, x + 6, 512);
      ctx.stroke();

      // Ridge highlight
      ctx.strokeStyle = lightHex;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.moveTo(x + 4, 0);
      ctx.bezierCurveTo(x + 16, 170, x - 8, 340, x + 10, 512);
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    }

    // Moss patches in crevices
    ctx.fillStyle = mossHex;
    ctx.globalAlpha = 0.35;
    for (let m = 0; m < 40; m++) {
      ctx.beginPath();
      ctx.arc(Math.random() * 512, 250 + Math.random() * 260, 10 + Math.random() * 20, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 2);
    return texture;
  }

  // ==========================================
  // LIGHTING & ATMOSPHERE
  // ==========================================
  setupLighting() {
    this.ambientLight = new THREE.AmbientLight(0x381e6e, 1.4);
    this.scene.add(this.ambientLight);

    this.hemiLight = new THREE.HemisphereLight(0x9d4edd, 0x110728, 1.2);
    this.scene.add(this.hemiLight);

    // Directional Sun / Moonlight
    this.dirLight = new THREE.DirectionalLight(0xfff1db, 2.2);
    this.dirLight.position.set(28, 42, 22);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 130;
    const d = 38;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.dirLight.shadow.bias = -0.0004;
    this.scene.add(this.dirLight);

    // Magic Crystal Glow
    this.crystalLight = new THREE.PointLight(0xa855f7, 4.0, 30);
    this.crystalLight.position.set(0, 10, -10);
    this.scene.add(this.crystalLight);
  }

  setAtmosphere(mode = 'sunset') {
    this.currentMode = 'sunset';

    // Rich Twilight Purple Fog
    this.scene.fog.color.setHex(0x2d0b3b);
    this.scene.fog.density = 0.007;

    // Ambient Lighting: Soft Twilight Violet (No blown-out glare)
    this.ambientLight.color.setHex(0x9d4edd);
    this.ambientLight.intensity = 1.35;

    // Hemisphere: Warm Sunset Sky & Deep Forest Purple Shadow Bounce
    this.hemiLight.color.setHex(0xfb923c);
    this.hemiLight.groundColor.setHex(0x3b0764);
    this.hemiLight.intensity = 1.25;

    // Low-Angle Setting Sun: Warm Amber-Coral with Long Dramatic Shadows
    this.dirLight.color.setHex(0xff7a36);
    this.dirLight.intensity = 2.9;
    this.dirLight.position.set(36, 18, 14);

    // Glistening Crystal Azure Blue River Water
    if (this.waterMesh) {
      this.waterMesh.material.color.setHex(0x0284c7);
      this.waterMesh.material.emissive.setHex(0x0369a1);
    }

    if (this.skyDomeMesh) {
      this.skyDomeMesh.material.color.setHex(0xffffff);
    }
  }

  getGroundElevation(x, z) {
    // 1. Arched Wooden Bridge Deck Elevation (Crossing between x: -5.8 to +5.8, z: -2.3 to 2.3)
    if (Math.abs(x) <= 5.8 && Math.abs(z) <= 2.3) {
      const u = x / 5.76;
      return 0.65 + Math.cos(u * Math.PI * 0.45) * 2.0;
    }

    // 2. Sacred Torii Shrine Elevated Stone Sanctuary (x: -6 to 6, z: -19 to -9.5)
    if (Math.abs(x) <= 6.5 && z >= -19.5 && z <= -9.5) {
      return 1.4; // Solid flat stone shrine platform above river
    }

    // 3. River Depression Profile
    const distFromRiver = Math.abs(x - Math.sin(z * 0.1) * 6.5);
    if (distFromRiver < 5.8) {
      return -1.9 + Math.pow(distFromRiver / 5.8, 2) * 1.6;
    }

    // 4. Rolling Hillside & Mountain Terrain
    let y = Math.sin(x * 0.08) * 1.6 + Math.cos(z * 0.07) * 1.9 + Math.sin((x + z) * 0.05) * 1.2;
    if (z < -22) y += Math.pow(Math.abs(z + 22) * 0.28, 1.6);
    if (x < -24) y += Math.pow(Math.abs(x + 24) * 0.24, 1.5);
    if (x > 24) y += Math.pow(Math.abs(x - 24) * 0.24, 1.5);
    return y;
  }

  // ==========================================
  // DETAILED TERRAIN & FLORA
  // ==========================================
  buildTerrain() {
    const size = 96;
    const segments = 64;
    const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
    geometry.rotateX(-Math.PI / 2);

    const pos = geometry.attributes.position;
    const colors = [];
    const colorGrassLush = new THREE.Color(0x22c55e);
    const colorGrassDeep = new THREE.Color(0x15803d);
    const colorSand = new THREE.Color(0xd97706);
    const colorCobble = new THREE.Color(0x64748b);
    const colorDarkRock = new THREE.Color(0x334155);

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);

      // River depression curve
      const distFromRiver = Math.abs(x - Math.sin(z * 0.1) * 6.5);
      let y = 0;

      if (distFromRiver < 5.8) {
        y = -1.9 + Math.pow(distFromRiver / 5.8, 2) * 1.6;
      } else {
        y = Math.sin(x * 0.08) * 1.6 + Math.cos(z * 0.07) * 1.9 + Math.sin((x + z) * 0.05) * 1.2;
        if (z < -22) y += Math.pow(Math.abs(z + 22) * 0.28, 1.6);
        if (x < -24) y += Math.pow(Math.abs(x + 24) * 0.24, 1.5);
        if (x > 24) y += Math.pow(Math.abs(x - 24) * 0.24, 1.5);
      }

      pos.setY(i, y);

      let vColor = colorGrassLush.clone();
      if (distFromRiver < 6.8) {
        vColor.lerp(colorSand, 0.75);
      } else if (Math.abs(z - Math.cos(x * 0.1) * 4.5) < 3.2 && y > 0) {
        vColor.lerp(colorCobble, 0.7);
      } else if (y > 4.5) {
        vColor.lerp(colorDarkRock, 0.65);
      } else if (y > 2.0) {
        vColor.lerp(colorGrassDeep, 0.6);
      }

      colors.push(vColor.r, vColor.g, vColor.b);
    }

    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.75,
      metalness: 0.1,
      flatShading: true
    });

    const terrainMesh = new THREE.Mesh(geometry, mat);
    terrainMesh.receiveShadow = true;
    this.terrainGroup.add(terrainMesh);
  }

  // ==========================================
  // HIGH-DETAIL MEADOW: 3D GRASS TUFTS, WILDFLOWERS & STONE PATH
  // ==========================================
  buildMeadowDetails() {
    // 1. 3D Crossed Grass Blade Tufts
    const grassBladeGeo = new THREE.PlaneGeometry(0.75, 0.65);
    grassBladeGeo.translate(0, 0.32, 0);

    const grassColors = [0x22c55e, 0x16a34a, 0x4ade80, 0x84cc16];
    const grassMats = grassColors.map(c => new THREE.MeshStandardMaterial({
      color: c,
      roughness: 0.6,
      side: THREE.DoubleSide
    }));

    for (let g = 0; g < 160; g++) {
      const x = (Math.random() - 0.5) * 60;
      const z = (Math.random() - 0.5) * 60;
      if (Math.abs(x - Math.sin(z * 0.1) * 6.5) < 6.2) continue; // Skip river

      const tuft = new THREE.Group();
      tuft.position.set(x, 0.3 + Math.random() * 0.4, z);
      const s = 0.7 + Math.random() * 0.6;
      tuft.scale.set(s, s * (0.8 + Math.random() * 0.5), s);

      const mat = grassMats[g % grassMats.length];

      // Two crossed blades
      const b1 = new THREE.Mesh(grassBladeGeo, mat);
      b1.rotation.y = Math.random() * Math.PI;
      b1.rotation.x = (Math.random() - 0.5) * 0.2;
      const b2 = new THREE.Mesh(grassBladeGeo, mat);
      b2.rotation.y = b1.rotation.y + Math.PI / 2 + (Math.random() - 0.5) * 0.3;
      b2.rotation.z = (Math.random() - 0.5) * 0.2;

      tuft.add(b1);
      tuft.add(b2);
      this.foliageGroup.add(tuft);
    }

    // 2. High-Detail Blooming Wildflower Clusters
    const flowerColors = [
      { name: 'poppy', color: 0xef4444 },
      { name: 'dandelion', color: 0xf59e0b },
      { name: 'lavender', color: 0xa855f7 },
      { name: 'daisy', color: 0xffffff },
      { name: 'cherry', color: 0xf472b6 }
    ];

    const stemGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.55, 5);
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x15803d });

    for (let f = 0; f < 100; f++) {
      const x = (Math.random() - 0.5) * 55;
      const z = (Math.random() - 0.5) * 55;
      if (Math.abs(x - Math.sin(z * 0.1) * 6.5) < 6.4) continue; // Skip river

      const flowerGroup = new THREE.Group();
      flowerGroup.position.set(x, 0.35 + Math.random() * 0.3, z);

      const fType = flowerColors[f % flowerColors.length];
      const petalMat = new THREE.MeshStandardMaterial({
        color: fType.color,
        roughness: 0.4,
        side: THREE.DoubleSide
      });

      // Stem
      const stem = new THREE.Mesh(stemGeo, stemMat);
      stem.position.y = 0.27;
      stem.rotation.z = (Math.random() - 0.5) * 0.15;
      flowerGroup.add(stem);

      // Petal blossom head (5 petals around center)
      const head = new THREE.Group();
      head.position.set(0, 0.55, 0);

      const center = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 6, 6),
        new THREE.MeshBasicMaterial({ color: 0xfde047 })
      );
      head.add(center);

      for (let p = 0; p < 5; p++) {
        const petal = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, 0.18), petalMat);
        const ang = (p / 5) * Math.PI * 2;
        petal.position.set(Math.cos(ang) * 0.12, 0, Math.sin(ang) * 0.12);
        petal.rotation.y = -ang;
        head.add(petal);
      }

      flowerGroup.add(head);
      this.foliageGroup.add(flowerGroup);
    }

    // 3. Winding Flagstone Walkway Pavers
    const flagstoneMat = new THREE.MeshStandardMaterial({
      map: this.textures.cobblestone,
      roughness: 0.85
    });

    for (let st = -18; st <= 18; st++) {
      if (Math.abs(st) < 4) continue; // Skip under bridge
      const slab = new THREE.Mesh(
        new THREE.BoxGeometry(1.2 + (st % 3) * 0.2, 0.14, 1.1 + (st % 2) * 0.2),
        flagstoneMat
      );
      const curveX = Math.sin(st * 0.15) * 4.2;
      slab.position.set(curveX + (st > 0 ? 8 : -8), 0.35, st * 1.8);
      slab.rotation.y = (st * 0.1) + (Math.random() - 0.5) * 0.2;
      slab.receiveShadow = true;
      this.terrainGroup.add(slab);
    }

    // 4. Smooth Riverbank Boulders & Wet Pebbles
    const stoneDark = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.4,
      metalness: 0.3
    });

    for (let r = 0; r < 28; r++) {
      const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.45 + Math.random() * 0.65, 1),
        stoneDark
      );
      const side = (r % 2 === 0) ? -5.8 : 5.8;
      rock.position.set(
        side + (Math.random() - 0.5) * 1.5,
        -0.3 + Math.random() * 0.4,
        -38 + r * 2.8
      );
      rock.scale.set(1.2, 0.7, 1.0);
      rock.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.terrainGroup.add(rock);
    }
  }

  // ==========================================
  // DETAILED 3D RIVER & ARCH BRIDGE
  // ==========================================
  buildRiverAndBridge() {
    // 1. Shimmering Crystal Azure Blue Water Surface
    const waterGeo = new THREE.PlaneGeometry(18, 96, 48, 96);
    waterGeo.rotateX(-Math.PI / 2);

    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,          // Vibrant Azure Blue
      emissive: 0x0369a1,       // Luminous River Depth
      emissiveIntensity: 0.42,
      roughness: 0.03,          // Super Glossy & Shiny
      metalness: 0.32,          // Specular Glint Refinement
      transparent: true,
      opacity: 0.90,
      flatShading: true
    });

    this.waterMesh = new THREE.Mesh(waterGeo, waterMat);
    this.waterMesh.position.set(0, -0.65, 0);
    this.waterGroup.add(this.waterMesh);

    // 2. Shoreline White Foam Ripples along Banks
    const foamMat = new THREE.MeshBasicMaterial({
      color: 0xe0f2fe,
      transparent: true,
      opacity: 0.45
    });
    const foamL = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 96), foamMat);
    foamL.rotateX(-Math.PI / 2);
    foamL.position.set(-6.2, -0.58, 0);
    this.waterGroup.add(foamL);

    const foamR = foamL.clone();
    foamR.position.set(6.2, -0.58, 0);
    this.waterGroup.add(foamR);

    // 2. High-Detail Arched Bridge
    const bridgeGroup = new THREE.Group();
    bridgeGroup.position.set(0, 0.5, 0);

    const woodPlankMat = new THREE.MeshStandardMaterial({
      map: this.textures.woodPlanks,
      roughness: 0.7
    });
    const stonePillarMat = new THREE.MeshStandardMaterial({
      map: this.textures.cobblestone,
      roughness: 0.8
    });

    // Arch Deck Planks
    for (let i = -8; i <= 8; i++) {
      const u = i / 8;
      const x = i * 0.72;
      const y = Math.cos(u * Math.PI * 0.45) * 2.0;

      const plank = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.28, 4.6), woodPlankMat);
      plank.position.set(x, y, 0);
      plank.rotation.z = -Math.sin(u * Math.PI * 0.45) * 0.38;
      plank.castShadow = true;
      plank.receiveShadow = true;
      bridgeGroup.add(plank);

      // Ornate Railing Posts with Brass Caps
      if (Math.abs(i) % 2 === 0) {
        const postL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.3, 0.16), woodPlankMat);
        postL.position.set(x, y + 0.65, 2.2);
        postL.castShadow = true;

        // Brass Top Cap
        const cap = new THREE.Mesh(
          new THREE.SphereGeometry(0.12, 8, 8),
          new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.2 })
        );
        cap.position.y = 0.7;
        postL.add(cap);

        const postR = postL.clone();
        postR.position.set(x, y + 0.65, -2.2);

        bridgeGroup.add(postL);
        bridgeGroup.add(postR);
      }
    }

    // Heavy Handrails
    const railL = new THREE.Mesh(new THREE.BoxGeometry(12.5, 0.18, 0.22), woodPlankMat);
    railL.position.set(0, 2.5, 2.2);
    railL.castShadow = true;
    const railR = railL.clone();
    railR.position.set(0, 2.5, -2.2);
    bridgeGroup.add(railL);
    bridgeGroup.add(railR);

    // Stone Pillars & Arch Vault
    const pillar1 = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.95, 4.2, 8), stonePillarMat);
    pillar1.position.set(-3.8, -0.2, 0);
    pillar1.castShadow = true;
    pillar1.receiveShadow = true;
    const pillar2 = pillar1.clone();
    pillar2.position.set(3.8, -0.2, 0);
    bridgeGroup.add(pillar1);
    bridgeGroup.add(pillar2);

    // Lanterns on Bridge
    const bridgeLanternL = this.createOrnateLantern(0xffaa44);
    bridgeLanternL.position.set(-3.8, 3.2, 2.2);
    const bridgeLanternR = this.createOrnateLantern(0xffaa44);
    bridgeLanternR.position.set(3.8, 3.2, -2.2);
    bridgeGroup.add(bridgeLanternL);
    bridgeGroup.add(bridgeLanternR);

    this.waterGroup.add(bridgeGroup);

    // 3. Water Lilies & Stepping Stones
    for (let k = 0; k < 15; k++) {
      const lily = new THREE.Mesh(
        new THREE.CylinderGeometry(0.45 + Math.random() * 0.35, 0.45, 0.04, 8),
        new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.6 })
      );
      lily.position.set(
        (Math.random() - 0.5) * 8.5,
        -0.62,
        -34 + k * 4.5 + Math.random() * 3
      );
      this.waterGroup.add(lily);

      if (k % 2 === 0) {
        const lotus = new THREE.Mesh(
          new THREE.ConeGeometry(0.22, 0.3, 6),
          new THREE.MeshStandardMaterial({ color: (k % 4 === 0) ? 0xf472b6 : 0xec4899, roughness: 0.5 })
        );
        lotus.position.set(lily.position.x, -0.46, lily.position.z);
        this.waterGroup.add(lotus);
      }
    }
  }

  // ==========================================
  // INTRICATELY DETAILED COTTAGES
  // ==========================================
  buildCottages() {
    const cottageConfigs = [
      { x: -14, z: 6, rot: 0.25, roofMat: this.textures.roofRed, wallMat: this.textures.wallCream, scale: 1.25 },
      { x: -10, z: -8, rot: -0.2, roofMat: this.textures.roofPurple, wallMat: this.textures.wallWhite, scale: 1.1 },
      { x: 13, z: 8, rot: -0.35, roofMat: this.textures.roofCyan, wallMat: this.textures.wallCream, scale: 1.2 },
      { x: 17, z: -4, rot: 0.45, roofMat: this.textures.roofGold, wallMat: this.textures.wallWhite, scale: 1.35 },
      { x: -18, z: -18, rot: 0.15, roofMat: this.textures.roofPurple, wallMat: this.textures.wallCyan, scale: 1.4 },
      { x: 14, z: -16, rot: -0.28, roofMat: this.textures.roofRed, wallMat: this.textures.wallWhite, scale: 1.15 }
    ];

    cottageConfigs.forEach(cfg => {
      const house = this.createDetailedCottage(cfg.roofMat, cfg.wallMat);
      house.position.set(cfg.x, 0.8 * cfg.scale, cfg.z);
      house.rotation.y = cfg.rot;
      house.scale.setScalar(cfg.scale);
      this.buildingsGroup.add(house);
    });
  }

  createDetailedCottage(roofTexture, wallTexture) {
    const cottage = new THREE.Group();

    const stoneMat = new THREE.MeshStandardMaterial({ map: this.textures.cobblestone, roughness: 0.8 });
    const wallMat = new THREE.MeshStandardMaterial({ map: wallTexture, roughness: 0.7 });
    const roofMat = new THREE.MeshStandardMaterial({ map: roofTexture, roughness: 0.65 });
    const woodMat = new THREE.MeshStandardMaterial({ map: this.textures.woodPlanks, roughness: 0.7 });
    const glassMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

    // 1. Cobblestone Foundation
    const foundation = new THREE.Mesh(new THREE.BoxGeometry(4.8, 1.0, 4.8), stoneMat);
    foundation.position.y = 0.5;
    foundation.castShadow = true;
    foundation.receiveShadow = true;
    cottage.add(foundation);

    // 2. Timber Half-Framed Walls (Level 1)
    const wallsL1 = new THREE.Mesh(new THREE.BoxGeometry(4.4, 2.8, 4.4), wallMat);
    wallsL1.position.y = 2.4;
    wallsL1.castShadow = true;
    wallsL1.receiveShadow = true;
    cottage.add(wallsL1);

    // 3. Overhanging Second Floor / Attic
    const floorDivide = new THREE.Mesh(new THREE.BoxGeometry(4.7, 0.25, 4.7), woodMat);
    floorDivide.position.y = 3.85;
    floorDivide.castShadow = true;
    cottage.add(floorDivide);

    // 4. Detailed Pitched Shingle Roof with Overhangs
    const roof = new THREE.Mesh(new THREE.ConeGeometry(3.9, 2.8, 4), roofMat);
    roof.position.y = 5.35;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    cottage.add(roof);

    // Roof Wooden Rafters / Fascia Trim
    const trim = new THREE.Mesh(new THREE.ConeGeometry(4.0, 0.3, 4), woodMat);
    trim.position.y = 4.05;
    trim.rotation.y = Math.PI / 4;
    cottage.add(trim);

    // 5. Masonry Chimney with Stone Cap
    const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.6, 0.8), stoneMat);
    chimney.position.set(1.3, 5.4, 0.9);
    chimney.castShadow = true;
    cottage.add(chimney);

    const chimneyCap = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.2, 1.05), stoneMat);
    chimneyCap.position.set(1.3, 6.7, 0.9);
    cottage.add(chimneyCap);

    // 6. Windows with Wooden Lattices & Flower Boxes
    const windowPositions = [
      { x: 0.8, y: 2.6, z: 2.22 },
      { x: -0.8, y: 2.6, z: 2.22 }
    ];

    windowPositions.forEach(wPos => {
      // Glass pane
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.95, 0.1), glassMat);
      win.position.set(wPos.x, wPos.y, wPos.z);
      cottage.add(win);

      // Wooden Frame
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.05, 0.12), woodMat);
      frame.position.set(wPos.x, wPos.y, wPos.z - 0.02);
      cottage.add(frame);

      // Flower Box
      const flowerBox = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.28, 0.35), woodMat);
      flowerBox.position.set(wPos.x, wPos.y - 0.58, wPos.z + 0.15);
      cottage.add(flowerBox);

      // Colorful Flowers inside box
      const flowerColors = [0xef4444, 0xf472b6, 0xfde047, 0x38bdf8];
      for (let f = 0; f < 3; f++) {
        const blossom = new THREE.Mesh(
          new THREE.SphereGeometry(0.1, 6, 6),
          new THREE.MeshBasicMaterial({ color: flowerColors[(f + wPos.x > 0 ? 1 : 0) % 4] })
        );
        blossom.position.set(wPos.x - 0.3 + f * 0.3, wPos.y - 0.42, wPos.z + 0.18);
        cottage.add(blossom);
      }
    });

    // 7. Ornate Wooden Door with Arch & Handle
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.0, 0.15), woodMat);
    door.position.set(-1.1, 1.8, 2.22);
    door.castShadow = true;
    cottage.add(door);

    const doorArch = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.16, 8, 1, false, 0, Math.PI), stoneMat);
    doorArch.position.set(-1.1, 2.8, 2.22);
    doorArch.rotation.z = -Math.PI / 2;
    cottage.add(doorArch);

    // 8. Hanging Porch Lantern
    const porchLantern = this.createOrnateLantern(0xffaa44);
    porchLantern.position.set(0.1, 3.2, 2.4);
    cottage.add(porchLantern);

    // 9. Water Barrel & Crate near corner
    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.45, 0.9, 8),
      woodMat
    );
    barrel.position.set(2.0, 1.0, 1.8);
    barrel.castShadow = true;
    cottage.add(barrel);

    return cottage;
  }

  createOrnateLantern(glowColorHex) {
    const lantern = new THREE.Group();

    // Black iron bracket
    const ironMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.2 });
    const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 0.35), ironMat);
    bracket.position.set(0, 0.15, -0.15);
    lantern.add(bracket);

    // Glass lamp housing
    const lampMat = new THREE.MeshBasicMaterial({ color: glowColorHex });
    const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.12, 0.35, 6), lampMat);
    lamp.position.y = 0;
    lantern.add(lamp);

    // Iron cap & base
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.18, 6), ironMat);
    cap.position.y = 0.24;
    lantern.add(cap);

    // Soft PointLight
    const pLight = new THREE.PointLight(glowColorHex, 1.4, 8);
    pLight.position.set(0, 0, 0);
    lantern.add(pLight);

    return lantern;
  }

  // ==========================================
  // DETAILED 3D WINDMILL
  // ==========================================
  buildWindmill() {
    const windmill = new THREE.Group();
    windmill.position.set(23, 3.5, -10);

    const stoneMat = new THREE.MeshStandardMaterial({ map: this.textures.cobblestone, roughness: 0.8 });
    const woodMat = new THREE.MeshStandardMaterial({ map: this.textures.woodPlanks, roughness: 0.7 });
    const roofMat = new THREE.MeshStandardMaterial({ map: this.textures.roofPurple, roughness: 0.65 });
    const clothMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9 });

    // Tower Body (Octagonal masonry cone)
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 3.6, 9.0, 8), stoneMat);
    tower.position.y = 4.5;
    tower.castShadow = true;
    tower.receiveShadow = true;
    windmill.add(tower);

    // Wooden Observation Balcony
    const balcony = new THREE.Mesh(new THREE.CylinderGeometry(3.1, 3.1, 0.25, 8), woodMat);
    balcony.position.y = 7.0;
    balcony.castShadow = true;
    windmill.add(balcony);

    // Balcony Railing Posts
    for (let r = 0; r < 8; r++) {
      const angle = (r * Math.PI) / 4;
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.9, 0.12), woodMat);
      post.position.set(Math.cos(angle) * 3.0, 7.5, Math.sin(angle) * 3.0);
      windmill.add(post);
    }

    // Cone Shingle Roof
    const roof = new THREE.Mesh(new THREE.ConeGeometry(3.0, 3.0, 8), roofMat);
    roof.position.y = 10.5;
    roof.castShadow = true;
    windmill.add(roof);

    // Center Rotor Hub & Axle
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 1.0, 8), woodMat);
    hub.position.set(0, 8.4, 2.6);
    hub.rotation.x = Math.PI / 2;
    windmill.add(hub);

    // 4 Animated Detailed Lattice Blades
    this.windmillBlades = new THREE.Group();
    this.windmillBlades.position.set(0, 8.4, 3.1);

    for (let b = 0; b < 4; b++) {
      const blade = new THREE.Group();
      blade.rotation.z = (b * Math.PI) / 2;

      // Heavy timber spar
      const spar = new THREE.Mesh(new THREE.BoxGeometry(0.24, 7.2, 0.18), woodMat);
      spar.position.y = 3.6;
      blade.add(spar);

      // Lattice crossbars
      for (let c = 1; c <= 5; c++) {
        const crossbar = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.08), woodMat);
        crossbar.position.set(0.7, c * 1.2, 0.08);
        blade.add(crossbar);
      }

      // White cloth sail stretched over lattice
      const sail = new THREE.Mesh(new THREE.BoxGeometry(1.5, 6.0, 0.04), clothMat);
      sail.position.set(0.75, 3.8, 0.06);
      blade.add(sail);

      this.windmillBlades.add(blade);
    }

    windmill.add(this.windmillBlades);
    this.buildingsGroup.add(windmill);
  }

  // ==========================================
  // JAPANESE TORII SHRINE & WATCHTOWER
  // ==========================================
  buildToriiShrineAndTower() {
    // 1. Ancient Japanese Torii Gate & Magic Crystal Shrine
    const shrine = new THREE.Group();
    shrine.position.set(0, 1.5, -13);

    const redLacquer = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3, metalness: 0.2 });
    const blackLacquer = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 });
    const stoneDark = new THREE.MeshStandardMaterial({ map: this.textures.stoneDark, roughness: 0.8 });

    // Multi-tier stone dais
    const base1 = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.8, 0.9, 8), stoneDark);
    base1.position.y = 0.45;
    const base2 = new THREE.Mesh(new THREE.CylinderGeometry(3.8, 4.2, 0.8, 8), stoneDark);
    base2.position.y = 1.3;
    shrine.add(base1);
    shrine.add(base2);

    // Torii Gate Pillars
    const toriiPillarL = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.42, 6.0, 10), redLacquer);
    toriiPillarL.position.set(-3.2, 3.5, 0);
    toriiPillarL.castShadow = true;
    const toriiPillarR = toriiPillarL.clone();
    toriiPillarR.position.set(3.2, 3.5, 0);
    shrine.add(toriiPillarL);
    shrine.add(toriiPillarR);

    // Torii Crossbeams (Kasagi & Nuki)
    const upperBeam = new THREE.Mesh(new THREE.BoxGeometry(8.8, 0.45, 0.5), blackLacquer);
    upperBeam.position.set(0, 6.4, 0);
    upperBeam.castShadow = true;
    const lowerBeam = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.35, 0.35), redLacquer);
    lowerBeam.position.set(0, 5.4, 0);
    shrine.add(upperBeam);
    shrine.add(lowerBeam);

    // Floating Rotating Crystal (Octahedron with inner core)
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0xc084fc,
      emissive: 0x9333ea,
      emissiveIntensity: 1.0,
      roughness: 0.05,
      metalness: 0.9,
      flatShading: true
    });
    this.magicCrystal = new THREE.Mesh(new THREE.OctahedronGeometry(1.6, 0), crystalMat);
    this.magicCrystal.position.set(0, 4.0, 0);
    this.magicCrystal.castShadow = true;
    shrine.add(this.magicCrystal);

    // 4 Traditional Stone Lanterns (Toro)
    for (let t = 0; t < 4; t++) {
      const angle = (t * Math.PI) / 2 + Math.PI / 4;
      const toro = this.createStoneToro();
      toro.position.set(Math.cos(angle) * 4.2, 1.7, Math.sin(angle) * 4.2);
      shrine.add(toro);
    }

    this.buildingsGroup.add(shrine);

    // 2. High Watchtower on Mountain Ridge
    const towerGroup = new THREE.Group();
    towerGroup.position.set(-23, 5.5, -20);
    const towerMesh = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.9, 13, 8), stoneDark);
    towerMesh.position.y = 6.5;
    towerMesh.castShadow = true;
    towerGroup.add(towerMesh);

    const battlement = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 2.2, 1.4, 8), stoneDark);
    battlement.position.y = 13.5;
    towerGroup.add(battlement);

    this.buildingsGroup.add(towerGroup);
  }

  createStoneToro() {
    const toro = new THREE.Group();
    const stoneMat = new THREE.MeshStandardMaterial({ map: this.textures.stoneDark, roughness: 0.8 });
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });

    // Base & Post
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.25, 0.7), stoneMat);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 1.2, 6), stoneMat);
    post.position.y = 0.65;
    toro.add(base);
    toro.add(post);

    // Firebox with Glowing Aperture
    const firebox = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.5, 0.65), glowMat);
    firebox.position.y = 1.35;
    toro.add(firebox);

    // Roof & Jewel Finial
    const roof = new THREE.Mesh(new THREE.ConeGeometry(0.65, 0.35, 4), stoneMat);
    roof.position.y = 1.75;
    roof.rotation.y = Math.PI / 4;
    toro.add(roof);

    return toro;
  }

  // ==========================================
  // ULTRA-DETAILED FOLIAGE (BRANCHING TREES, LEAF CLUSTERS & WILLOW VINES)
  // ==========================================
  buildFoliage() {
    // 1. Grand Branching Anime Trees (Lush Green, Autumn Orange, and Cherry Blossom)
    const grandTreePositions = [
      { x: -14, z: 12, type: 'green', scale: 1.35 },
      { x: 13, z: 14, type: 'cherry', scale: 1.4 },
      { x: -16, z: -6, type: 'autumn', scale: 1.3 },
      { x: 16, z: -10, type: 'green', scale: 1.25 },
      { x: -6, z: 10, type: 'cherry', scale: 1.15 },
      { x: 7, z: 8, type: 'green', scale: 1.2 },
      { x: -8, z: -8, type: 'autumn', scale: 1.1 },
      { x: 9, z: -16, type: 'cherry', scale: 1.3 },
      { x: -18, z: 22, type: 'green', scale: 1.45 },
      { x: 18, z: 24, type: 'autumn', scale: 1.4 }
    ];

    grandTreePositions.forEach(cfg => {
      const tree = this.createDetailedBranchingTree(cfg.type);
      tree.position.set(cfg.x, 0.4, cfg.z);
      tree.scale.setScalar(cfg.scale);
      this.foliageGroup.add(tree);
    });

    // 2. Weeping Willow Spirit Trees along the Riverbank
    const willowPositions = [
      { x: -7.8, z: -2, scale: 1.3 },
      { x: 7.8, z: 4, scale: 1.35 },
      { x: -7.5, z: 18, scale: 1.25 },
      { x: 7.5, z: -18, scale: 1.25 }
    ];

    willowPositions.forEach(pos => {
      const willow = this.createWeepingWillowTree();
      willow.position.set(pos.x, 0.3, pos.z);
      willow.scale.setScalar(pos.scale);
      this.foliageGroup.add(willow);
    });

    // 3. Multi-Tier Mountain Evergreen Pines with Branch Struts
    const pinePositions = [
      [-22, 2.5, 8], [-24, 3.5, -4], [-12, 1.5, 22], [22, 3.0, 4],
      [24, 4.0, -14], [-26, 6.0, -18], [26, 6.5, -16], [-10, 2.0, -22],
      [10, 2.5, -24], [-6, 1.0, 28], [6, 1.0, 28], [20, 3.5, 18]
    ];

    pinePositions.forEach((pos, idx) => {
      const pine = this.createDetailedPineTree();
      pine.position.set(pos[0], pos[1], pos[2]);
      const s = 0.9 + (idx % 4) * 0.15;
      pine.scale.setScalar(s);
      this.foliageGroup.add(pine);
    });

    // 4. Flowering Garden Bushes with Detailed Leaf Clumps
    const bushGreenMat = new THREE.MeshStandardMaterial({ map: this.textures.leavesGreen, roughness: 0.65 });
    const flowerPink = new THREE.MeshStandardMaterial({ color: 0xf472b6 });
    const flowerGold = new THREE.MeshStandardMaterial({ color: 0xfbbf24 });

    for (let b = 0; b < 20; b++) {
      const bush = new THREE.Group();
      const bx = (Math.random() - 0.5) * 44;
      const bz = (Math.random() - 0.5) * 44;
      if (Math.abs(bx) < 6.0) continue; // Skip river

      bush.position.set(bx, 0.4, bz);

      // Multi-sphere organic bush clump
      for (let bc = 0; bc < 4; bc++) {
        const clump = new THREE.Mesh(
          new THREE.DodecahedronGeometry(0.5 + Math.random() * 0.35, 1),
          bushGreenMat
        );
        clump.position.set((Math.random() - 0.5) * 0.7, 0.35 + Math.random() * 0.3, (Math.random() - 0.5) * 0.7);
        clump.castShadow = true;
        bush.add(clump);
      }

      // Blossoms on bush
      for (let fl = 0; fl < 6; fl++) {
        const blossom = new THREE.Mesh(
          new THREE.SphereGeometry(0.09, 5, 5),
          (fl % 2 === 0) ? flowerPink : flowerGold
        );
        blossom.position.set(
          (Math.random() - 0.5) * 1.1,
          0.5 + Math.random() * 0.4,
          (Math.random() - 0.5) * 1.1
        );
        bush.add(blossom);
      }

      this.foliageGroup.add(bush);
    }
  }

  // ==========================================
  // DETAILED BRANCHING ANIME TREE BUILDER
  // ==========================================
  createDetailedBranchingTree(type = 'green') {
    const tree = new THREE.Group();

    // Select textures based on tree species
    let leafTexture = this.textures.leavesGreen;
    let barkTexture = this.textures.barkOak;
    if (type === 'cherry') {
      leafTexture = this.textures.leavesCherry;
      barkTexture = this.textures.barkSakura;
    } else if (type === 'autumn') {
      leafTexture = this.textures.leavesAutumn;
      barkTexture = this.textures.barkOak;
    }

    const barkMat = new THREE.MeshStandardMaterial({
      map: barkTexture,
      roughness: 0.82
    });

    const leafMat = new THREE.MeshStandardMaterial({
      map: leafTexture,
      roughness: 0.65,
      alphaTest: 0.2
    });

    // 1. Flaring Organic Tree Roots at Base
    for (let r = 0; r < 4; r++) {
      const rootAng = (r / 4) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
      const root = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.28, 1.2, 6),
        barkMat
      );
      root.position.set(Math.cos(rootAng) * 0.55, 0.2, Math.sin(rootAng) * 0.55);
      root.rotation.x = Math.sin(rootAng) * 0.45;
      root.rotation.z = -Math.cos(rootAng) * 0.45;
      root.castShadow = true;
      tree.add(root);
    }

    // 2. Thick Gnarled Main Trunk
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.62, 3.4, 8),
      barkMat
    );
    trunk.position.y = 1.7;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    tree.add(trunk);

    // 3. Spreading Bough Branches
    const branchConfigs = [
      { y: 2.3, rotZ: 0.52, rotY: 0.2, len: 2.2, thick: 0.24 },
      { y: 2.7, rotZ: -0.58, rotY: 1.9, len: 2.0, thick: 0.22 },
      { y: 3.1, rotX: 0.54, rotY: 3.5, len: 1.9, thick: 0.20 },
      { y: 3.4, rotX: -0.48, rotY: 5.1, len: 1.8, thick: 0.19 },
      { y: 3.6, rotZ: 0.22, rotY: 0.8, len: 1.6, thick: 0.18 }
    ];

    branchConfigs.forEach(b => {
      const boughGroup = new THREE.Group();
      boughGroup.position.set(0, b.y, 0);
      boughGroup.rotation.y = b.rotY;

      // Limb arm
      const limb = new THREE.Mesh(
        new THREE.CylinderGeometry(b.thick * 0.7, b.thick, b.len, 6),
        barkMat
      );
      limb.position.set(b.len * 0.4, b.len * 0.35, 0);
      limb.rotation.z = -b.rotZ;
      limb.castShadow = true;
      boughGroup.add(limb);

      // Sub-twig fork
      const subTwig = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.14, 1.1, 5),
        barkMat
      );
      subTwig.position.set(b.len * 0.75, b.len * 0.65, 0.3);
      subTwig.rotation.z = -b.rotZ * 1.3;
      subTwig.rotation.y = 0.4;
      subTwig.castShadow = true;
      boughGroup.add(subTwig);

      // Rich Canopy Leaf Clump on Branch Tip
      const tipX = b.len * 0.85;
      const tipY = b.len * 0.75;

      for (let c = 0; c < 3; c++) {
        const clump = new THREE.Mesh(
          new THREE.DodecahedronGeometry(1.1 + Math.random() * 0.5, 1),
          leafMat
        );
        clump.position.set(
          tipX + (Math.random() - 0.5) * 0.8,
          tipY + (Math.random() - 0.5) * 0.6,
          (Math.random() - 0.5) * 0.8
        );
        clump.castShadow = true;
        boughGroup.add(clump);
      }

      tree.add(boughGroup);
    });

    // 4. Central High Canopy Crown
    const crownMat = leafMat;
    const mainCrown = new THREE.Mesh(
      new THREE.DodecahedronGeometry(2.1, 1),
      crownMat
    );
    mainCrown.position.y = 4.8;
    mainCrown.castShadow = true;
    tree.add(mainCrown);

    for (let cr = 0; cr < 4; cr++) {
      const subClump = new THREE.Mesh(
        new THREE.DodecahedronGeometry(1.3 + Math.random() * 0.4, 1),
        crownMat
      );
      const ang = (cr / 4) * Math.PI * 2;
      subClump.position.set(
        Math.cos(ang) * 1.2,
        4.6 + (Math.random() - 0.5) * 0.5,
        Math.sin(ang) * 1.2
      );
      subClump.castShadow = true;
      tree.add(subClump);
    }

    // 5. Floating Leaf Silhouette Quads around Perimeter (Clear Visible Leaf Shapes!)
    const leafQuadGeo = new THREE.PlaneGeometry(0.55, 0.45);
    for (let lq = 0; lq < 16; lq++) {
      const leafQuad = new THREE.Mesh(leafQuadGeo, leafMat);
      const qAng = (lq / 16) * Math.PI * 2;
      const qDist = 2.1 + (lq % 3) * 0.4;
      leafQuad.position.set(
        Math.cos(qAng) * qDist,
        3.6 + Math.sin(lq * 1.7) * 1.4,
        Math.sin(qAng) * qDist
      );
      leafQuad.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
      tree.add(leafQuad);
    }

    return tree;
  }

  // ==========================================
  // WEEPING WILLOW SPIRIT TREE (DROOPING VINES)
  // ==========================================
  createWeepingWillowTree() {
    const willow = new THREE.Group();
    const barkMat = new THREE.MeshStandardMaterial({ map: this.textures.barkBirch, roughness: 0.8 });
    const leafMat = new THREE.MeshStandardMaterial({ map: this.textures.leavesGreen, roughness: 0.65 });

    // Curved Trunk
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.55, 3.8, 8), barkMat);
    trunk.position.y = 1.9;
    trunk.rotation.z = 0.08;
    trunk.castShadow = true;
    willow.add(trunk);

    // High Canopy Umbrella
    const dome = new THREE.Mesh(new THREE.SphereGeometry(2.4, 8, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), leafMat);
    dome.position.y = 3.9;
    dome.castShadow = true;
    willow.add(dome);

    // 14 Hanging Willow Foliage Tendrils (Drooping to near ground)
    for (let v = 0; v < 14; v++) {
      const ang = (v / 14) * Math.PI * 2;
      const rad = 1.6 + (v % 3) * 0.35;
      const vine = new THREE.Group();
      vine.position.set(Math.cos(ang) * rad, 3.8, Math.sin(ang) * rad);

      // Strand of 4-6 leaf segments
      const segCount = 4 + (v % 3);
      for (let s = 0; s < segCount; s++) {
        const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.18 - s * 0.02, 0.22 - s * 0.02, 0.6, 5), leafMat);
        seg.position.y = -s * 0.55;
        seg.rotation.z = (Math.random() - 0.5) * 0.15;
        vine.add(seg);
      }
      willow.add(vine);
    }

    return willow;
  }

  // ==========================================
  // MULTI-TIER MOUNTAIN PINE TREE WITH BRANCH STRUTS
  // ==========================================
  createDetailedPineTree() {
    const pine = new THREE.Group();
    const trunkMat = new THREE.MeshStandardMaterial({ map: this.textures.barkOak, roughness: 0.85 });
    const needleMat = new THREE.MeshStandardMaterial({ map: this.textures.leavesPine, roughness: 0.7 });

    // Tall Tapered Trunk
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.48, 5.5, 6), trunkMat);
    trunk.position.y = 2.75;
    trunk.castShadow = true;
    pine.add(trunk);

    // 5 Tiered Serrated Cone Skirts with Branch Struts underneath
    const tiers = [
      { r: 2.2, h: 1.5, y: 2.6 },
      { r: 1.85, h: 1.4, y: 3.6 },
      { r: 1.5, h: 1.3, y: 4.5 },
      { r: 1.15, h: 1.2, y: 5.3 },
      { r: 0.75, h: 1.1, y: 6.0 }
    ];

    tiers.forEach((t, idx) => {
      // Needle cone skirt
      const cone = new THREE.Mesh(new THREE.ConeGeometry(t.r, t.h, 7), needleMat);
      cone.position.y = t.y;
      cone.castShadow = true;
      pine.add(cone);

      // Wooden branch struts visible underneath skirt
      for (let s = 0; s < 4; s++) {
        const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.07, t.r * 0.9, 4), trunkMat);
        const sAng = (s / 4) * Math.PI * 2;
        strut.position.set(Math.cos(sAng) * t.r * 0.4, t.y - t.h * 0.35, Math.sin(sAng) * t.r * 0.4);
        strut.rotation.x = Math.sin(sAng) * 0.4;
        strut.rotation.z = -Math.cos(sAng) * 0.4;
        pine.add(strut);
      }
    });

    return pine;
  }

  // ==========================================
  // VILLAGE STREET DETAILS & PROPS
  // ==========================================
  buildVillageDetails() {
    // 1. Street Lantern Poles along paths
    const lanternPositions = [
      [-5.5, 0.5, 3], [5.5, 0.5, 1], [-9, 1.0, -1], [9, 1.0, -3],
      [-2.5, 0.5, 11], [2.5, 0.5, 11]
    ];

    lanternPositions.forEach(pos => {
      const pole = this.createStreetPoleLantern();
      pole.position.set(pos[0], pos[1], pos[2]);
      this.buildingsGroup.add(pole);
    });

    // 2. Wooden Fences along paths
    for (let f = -3; f <= 3; f++) {
      if (Math.abs(f) < 1) continue;
      const fence = this.createWoodenFence();
      fence.position.set(f * 3.2, 0.5, 9);
      this.buildingsGroup.add(fence);
    }
  }

  createStreetPoleLantern() {
    const poleGroup = new THREE.Group();
    const ironMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.2 });

    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 3.4, 6), ironMat);
    post.position.y = 1.7;
    post.castShadow = true;
    poleGroup.add(post);

    const crossArm = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.08), ironMat);
    crossArm.position.set(0.3, 3.2, 0);
    poleGroup.add(crossArm);

    const lantern = this.createOrnateLantern(0xffaa44);
    lantern.position.set(0.65, 2.9, 0);
    poleGroup.add(lantern);

    return poleGroup;
  }

  createWoodenFence() {
    const fence = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({ map: this.textures.woodPlanks, roughness: 0.7 });

    const post1 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.1, 0.18), woodMat);
    post1.position.set(-1.0, 0.55, 0);
    const post2 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.1, 0.18), woodMat);
    post2.position.set(1.0, 0.55, 0);
    fence.add(post1);
    fence.add(post2);

    const rail1 = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.12, 0.08), woodMat);
    rail1.position.set(0, 0.4, 0);
    const rail2 = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.12, 0.08), woodMat);
    rail2.position.set(0, 0.8, 0);
    fence.add(rail1);
    fence.add(rail2);

    return fence;
  }

  // ==========================================
  // FLOATING FANTASY ISLANDS WITH WATERFALLS
  // ==========================================
  buildFloatingIslands() {
    const islandConfigs = [
      { x: -26, y: 17, z: -16, scale: 1.7, color: 0x8b5cf6 },
      { x: 27, y: 19, z: -19, scale: 1.9, color: 0x06b6d4 },
      { x: 0, y: 23, z: -32, scale: 2.4, color: 0xf59e0b }
    ];

    islandConfigs.forEach(cfg => {
      const island = new THREE.Group();
      island.position.set(cfg.x, cfg.y, cfg.z);
      island.scale.setScalar(cfg.scale);

      const topGeo = new THREE.CylinderGeometry(3.6, 3.3, 0.9, 8);
      const topMat = new THREE.MeshStandardMaterial({
        map: this.textures.leavesGreen,
        roughness: 0.7
      });
      const top = new THREE.Mesh(topGeo, topMat);
      top.position.y = 0.45;
      island.add(top);

      // Inverted rock cone with cobblestone texture
      const rockGeo = new THREE.ConeGeometry(3.5, 4.8, 8);
      rockGeo.rotateX(Math.PI);
      const rockMat = new THREE.MeshStandardMaterial({
        map: this.textures.stoneDark,
        roughness: 0.8
      });
      const rock = new THREE.Mesh(rockGeo, rockMat);
      rock.position.y = -2.4;
      island.add(rock);

      // Mini Waterfall cascading down the island edge
      const fallGeo = new THREE.PlaneGeometry(0.8, 4.0);
      const fallMat = new THREE.MeshBasicMaterial({
        color: 0x67e8f9,
        transparent: true,
        opacity: 0.75,
        side: THREE.DoubleSide
      });
      const waterfall = new THREE.Mesh(fallGeo, fallMat);
      waterfall.position.set(3.4, -1.2, 0);
      island.add(waterfall);

      // Fantasy glowing tree & beacon
      const islandTree = new THREE.Mesh(
        new THREE.DodecahedronGeometry(1.3, 1),
        new THREE.MeshStandardMaterial({ color: cfg.color, roughness: 0.6 })
      );
      islandTree.position.set(0.9, 2.1, 0);
      island.add(islandTree);

      island.userData = {
        baseY: cfg.y,
        phase: Math.random() * Math.PI * 2,
        rotSpeed: 0.12
      };

      this.floatingIslands.push(island);
      this.foliageGroup.add(island);
    });
  }

  // ==========================================
  // MASTER SUNSET SKY DOME, ANIME CLOUDS & GOLDEN PARTICLES
  // ==========================================
  buildSkyAndClouds() {
    // 1. Rich Sunset Anime Sky Dome Canvas Texture
    const skyCanvas = document.createElement('canvas');
    skyCanvas.width = 512;
    skyCanvas.height = 512;
    const sCtx = skyCanvas.getContext('2d');

    const skyGrad = sCtx.createLinearGradient(0, 0, 0, 512);
    skyGrad.addColorStop(0.0, '#1a0833');  // Deep Midnight Twilight Violet Top
    skyGrad.addColorStop(0.3, '#3b0764');  // Royal Indigo
    skyGrad.addColorStop(0.55, '#86198f'); // Rich Magenta / Plum
    skyGrad.addColorStop(0.75, '#c2410c'); // Sunset Crimson Orange
    skyGrad.addColorStop(0.90, '#f97316'); // Vibrant Amber Sunset
    skyGrad.addColorStop(1.0, '#fbbf24');  // Glowing Golden Horizon
    sCtx.fillStyle = skyGrad;
    sCtx.fillRect(0, 0, 512, 512);

    const skyTexture = new THREE.CanvasTexture(skyCanvas);

    // Giant Sunset Sky Dome Hemisphere (fog: false ensures sky is always vivid)
    const skyGeo = new THREE.SphereGeometry(150, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.52);
    const skyMat = new THREE.MeshBasicMaterial({
      map: skyTexture,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false
    });
    this.skyDomeMesh = new THREE.Mesh(skyGeo, skyMat);
    this.skyDomeMesh.position.set(0, -5, 0);
    this.scene.add(this.skyDomeMesh);

    // 2. Radiant Setting Anime Sun (Low on Horizon)
    const sunGeo = new THREE.SphereGeometry(5.8, 24, 24);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffedd5, fog: false });
    const sun = new THREE.Mesh(sunGeo, sunMat);
    sun.position.set(36, 18, -45);
    this.scene.add(sun);

    // Warm Sun Halo Corona
    const haloGeo = new THREE.RingGeometry(6.0, 16.0, 32);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xf97316,
      transparent: true,
      opacity: 0.52,
      side: THREE.DoubleSide,
      fog: false
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.position.copy(sun.position);
    this.scene.add(halo);

    // 3. Sunset-Lit Fluffy Anime Clouds
    for (let c = 0; c < 14; c++) {
      const cloud = new THREE.Group();
      const cloudMat = new THREE.MeshStandardMaterial({
        color: 0xfda4af,
        emissive: 0x831843,
        emissiveIntensity: 0.25,
        transparent: true,
        opacity: 0.90,
        roughness: 0.7,
        flatShading: true
      });

      const sphereCount = 7 + Math.floor(Math.random() * 4);
      for (let s = 0; s < sphereCount; s++) {
        const sphere = new THREE.Mesh(
          new THREE.DodecahedronGeometry(2.6 + Math.random() * 2.0, 1),
          cloudMat
        );
        sphere.position.set(
          (s - sphereCount / 2) * 2.8 + (Math.random() - 0.5) * 1.2,
          (Math.random() - 0.5) * 1.0,
          (Math.random() - 0.5) * 2.0
        );
        cloud.add(sphere);
      }

      cloud.position.set(
        (Math.random() - 0.5) * 150,
        22 + Math.random() * 18,
        -55 + Math.random() * 95
      );
      cloud.userData = { speed: 0.22 + Math.random() * 0.32 };

      this.floatingClouds.push(cloud);
      this.cloudsGroup.add(cloud);
    }
  }

  buildParticles() {
    // Floating Forest Spores, Green Leaves & Pink Sakura Petals
    const leafCount = 70;
    const leafGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(leafCount * 3);
    const colors = new Float32Array(leafCount * 3);

    for (let i = 0; i < leafCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 65;
      positions[i * 3 + 1] = 0.5 + Math.random() * 18;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 65;

      const rType = Math.random();
      if (rType < 0.4) {
        // Emerald Forest Leaf
        colors[i * 3] = 0.13;
        colors[i * 3 + 1] = 0.77;
        colors[i * 3 + 2] = 0.37;
      } else if (rType < 0.7) {
        // Pink Sakura Blossom Petal
        colors[i * 3] = 0.98;
        colors[i * 3 + 1] = 0.55;
        colors[i * 3 + 2] = 0.75;
      } else {
        // Golden Sun Sparkle
        colors[i * 3] = 0.98;
        colors[i * 3 + 1] = 0.85;
        colors[i * 3 + 2] = 0.25;
      }

      this.fireflies.push({
        idx: i,
        baseY: positions[i * 3 + 1],
        speed: 0.35 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2
      });
    }

    leafGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    leafGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const leafMat = new THREE.PointsMaterial({
      size: 0.65,
      vertexColors: true,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending
    });

    this.fireflyPoints = new THREE.Points(leafGeo, leafMat);
    this.particlesGroup.add(this.fireflyPoints);
  }

  // ==========================================
  // EVENT BINDINGS & CONTROLS
  // ==========================================
  bindEvents() {
    window.addEventListener('scroll', () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      this.targetScrollProgress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
    }, { passive: true });

    window.addEventListener('mousemove', (e) => {
      this.mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      this.mouse.targetY = (e.clientY / window.innerHeight - 0.5) * 2;

      if (this.isExploreMode && this.isDragging) {
        const deltaX = e.clientX - this.prevMouse.x;
        const deltaY = e.clientY - this.prevMouse.y;
        this.exploreAngle.theta -= deltaX * 0.008;
        this.exploreAngle.phi = Math.max(0.2, Math.min(Math.PI / 2 - 0.05, this.exploreAngle.phi - deltaY * 0.008));
        this.prevMouse = { x: e.clientX, y: e.clientY };
      }
    });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        this.mouse.targetX = (e.touches[0].clientX / window.innerWidth - 0.5) * 2;
        this.mouse.targetY = (e.touches[0].clientY / window.innerHeight - 0.5) * 2;
      }
    }, { passive: true });

    const canvas = this.renderer.domElement;
    canvas.addEventListener('mousedown', (e) => {
      if (this.isExploreMode) {
        this.isDragging = true;
        this.prevMouse = { x: e.clientX, y: e.clientY };
      }
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    canvas.addEventListener('wheel', (e) => {
      if (this.isExploreMode) {
        this.exploreAngle.radius = Math.max(15, Math.min(80, this.exploreAngle.radius + e.deltaY * 0.05));
        e.preventDefault();
      }
    }, { passive: false });

    window.addEventListener('resize', () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });
  }

  toggleExploreMode() {
    this.isExploreMode = !this.isExploreMode;
    const canvas = this.renderer.domElement;
    canvas.style.pointerEvents = this.isExploreMode ? 'auto' : 'none';
    canvas.style.cursor = this.isExploreMode ? 'grab' : 'default';
    return this.isExploreMode;
  }

  // ==========================================
  // ANIMATION LOOP (60 FPS)
  // ==========================================
  animate() {
    requestAnimationFrame(() => this.animate());

    const dt = Math.min(this.clock.getDelta(), 0.1);
    const time = this.clock.getElapsedTime();

    this.scrollProgress += (this.targetScrollProgress - this.scrollProgress) * 0.06;
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

    if (!this.isExploreMode) {
      this.updateScrollCamera(time);
    } else {
      this.updateExploreCamera();
    }

    // 1. Windmill Rotation
    if (this.windmillBlades) {
      this.windmillBlades.rotation.z += 0.85 * dt;
    }

    // 2. Floating Magic Crystal
    if (this.magicCrystal) {
      this.magicCrystal.rotation.y += 1.3 * dt;
      this.magicCrystal.rotation.x = Math.sin(time * 1.5) * 0.15;
      this.magicCrystal.position.y = 4.0 + Math.sin(time * 2.0) * 0.28;
      if (this.crystalLight) {
        this.crystalLight.intensity = 3.2 + Math.sin(time * 3.0) * 1.2;
      }
    }

    // 3. Floating Islands Hover
    this.floatingIslands.forEach(island => {
      const u = island.userData;
      island.position.y = u.baseY + Math.sin(time * u.rotSpeed + u.phase) * 0.65;
      island.rotation.y += 0.05 * dt;
    });

    // 4. Animated 20 Patrolling Warriors (Walking Movement & Accurate Grounding)
    this.characterPedestals.forEach(charGroup => {
      const u = charGroup.userData;
      // Calculate smooth patrol interpolation between point A and point B
      const cycle = (Math.sin(time * u.speed + u.phase) + 1) / 2;
      const t = cycle * cycle * (3 - 2 * cycle);

      const posX = THREE.MathUtils.lerp(u.pA.x, u.pB.x, t);
      const posZ = THREE.MathUtils.lerp(u.pA.z, u.pB.z, t);
      // Dynamically match exact ground / bridge elevation at current (x, z)
      const groundY = this.getGroundElevation(posX, posZ);

      charGroup.position.set(posX, groundY, posZ);

      // Dynamic walking step bounce & stride tilt
      const stepBounce = Math.abs(Math.sin(time * u.walkFreq)) * 0.16;
      const strideTilt = Math.sin(time * u.walkFreq) * 0.08;

      if (u.shadowMesh) {
        u.shadowMesh.position.y = 0.03;
      }
      u.charPlane.position.y = u.baseY + stepBounce;
      u.charPlane.rotation.z = strideTilt;
      u.charPlane.lookAt(this.camera.position);
    });

    // 5. Dynamic Azure River Waves & Specular Ripple Animation
    if (this.waterMesh) {
      const pos = this.waterMesh.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        // Multi-frequency wave calculation for natural fluid river motion
        const wave = Math.sin(x * 1.3 + time * 3.4) * 0.16
                   + Math.cos(z * 1.1 + time * 2.5) * 0.12
                   + Math.sin((x * 0.8 + z * 0.8) + time * 4.2) * 0.07
                   + Math.cos(x * 2.4 - time * 2.0) * 0.04;
        pos.setY(i, wave);
      }
      this.waterMesh.geometry.computeVertexNormals();
      this.waterMesh.geometry.attributes.position.needsUpdate = true;
    }

    // 6. Floating Clouds
    this.floatingClouds.forEach(cloud => {
      cloud.position.x += cloud.userData.speed * dt * 3.2;
      if (cloud.position.x > 75) cloud.position.x = -75;
    });

    // 7. Rising Fireflies
    if (this.fireflyPoints) {
      const pos = this.fireflyPoints.geometry.attributes.position;
      this.fireflies.forEach(f => {
        let y = pos.getY(f.idx) + f.speed * dt;
        let x = pos.getX(f.idx) + Math.sin(time * 2.2 + f.phase) * 0.035;
        if (y > 16) y = 0.5;
        pos.setY(f.idx, y);
        pos.setX(f.idx, x);
      });
      pos.needsUpdate = true;
    }

    this.renderer.render(this.scene, this.camera);
  }

  updateScrollCamera(time) {
    const totalSegments = this.waypoints.length - 1;
    const progress = Math.max(0, Math.min(0.9999, this.scrollProgress));
    const segment = Math.floor(progress * totalSegments);
    const segmentT = (progress * totalSegments) - segment;

    const wpA = this.waypoints[segment];
    const wpB = this.waypoints[segment + 1];

    const easeT = segmentT * segmentT * (3 - 2 * segmentT);

    this.targetCamPos.lerpVectors(wpA.pos, wpB.pos, easeT);
    this.targetCamTarget.lerpVectors(wpA.target, wpB.target, easeT);

    const parallaxX = this.mouse.x * 2.6;
    const parallaxY = -this.mouse.y * 1.6;
    const idleBob = Math.sin(time * 1.2) * 0.25;

    this.currentCamPos.lerp(this.targetCamPos, 0.08);
    this.currentCamTarget.lerp(this.targetCamTarget, 0.08);

    this.camera.position.set(
      this.currentCamPos.x + parallaxX,
      this.currentCamPos.y + parallaxY + idleBob,
      this.currentCamPos.z
    );
    this.camera.lookAt(this.currentCamTarget.x, this.currentCamTarget.y, this.currentCamTarget.z);
  }

  updateExploreCamera() {
    const phi = this.exploreAngle.phi;
    const theta = this.exploreAngle.theta;
    const r = this.exploreAngle.radius;

    const x = r * Math.sin(phi) * Math.sin(theta);
    const y = r * Math.cos(phi);
    const z = r * Math.sin(phi) * Math.cos(theta);

    this.camera.position.set(x, y, z);
    this.camera.lookAt(0, 3.5, 0);
  }
}

window.ThreeVillageWorld = ThreeVillageWorld;
