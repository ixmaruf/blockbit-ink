/**
 * Blockbit Ink — Generative Art Renderer v2
 * Draws anime/pixel-style characters using HTML5 Canvas
 * Enhanced: larger anime proportions, multi-layer eyes, textured hair,
 * detailed outfits, ambient lighting, glow effects for rare traits
 */

const BLOCK_SIZE = 20;
const CANVAS_SIZE = 2000;
const GRID = CANVAS_SIZE / BLOCK_SIZE; // 100x100 grid
const PX = BLOCK_SIZE / 4; // pixel scale factor for hardcoded values (5x at 2000px)

class NFTRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.canvas.width = CANVAS_SIZE;
    this.canvas.height = CANVAS_SIZE;
    this.ctx.imageSmoothingEnabled = false;
  }

  clear() {
    this.ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  }

  // Draw a pixel at grid coordinates
  px(x, y, color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
  }

  // Draw a filled rectangle in grid coords
  rect(x, y, w, h, color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, w * BLOCK_SIZE, h * BLOCK_SIZE);
  }

  // Draw from a pattern array
  drawPattern(pattern, offsetX, offsetY, palette) {
    for (let y = 0; y < pattern.length; y++) {
      for (let x = 0; x < pattern[y].length; x++) {
        const c = pattern[y][x];
        if (c !== "." && palette[c]) {
          this.px(offsetX + x, offsetY + y, palette[c]);
        }
      }
    }
  }

  // Darken a hex color by percentage
  darken(hex, pct) {
    if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return hex || '#888888';
    const r = Math.max(0, parseInt(hex.slice(1, 3), 16) || 0);
    const g = Math.max(0, parseInt(hex.slice(3, 5), 16) || 0);
    const b = Math.max(0, parseInt(hex.slice(5, 7), 16) || 0);
    return `rgb(${Math.round(r * (1 - pct))},${Math.round(g * (1 - pct))},${Math.round(b * (1 - pct))})`;
  }

  // Lighten a hex color by percentage
  lighten(hex, pct) {
    if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return hex || '#cccccc';
    const r = Math.min(255, (parseInt(hex.slice(1, 3), 16) || 0) + (255 - (parseInt(hex.slice(1, 3), 16) || 0)) * pct);
    const g = Math.min(255, (parseInt(hex.slice(3, 5), 16) || 0) + (255 - (parseInt(hex.slice(3, 5), 16) || 0)) * pct);
    const b = Math.min(255, (parseInt(hex.slice(5, 7), 16) || 0) + (255 - (parseInt(hex.slice(5, 7), 16) || 0)) * pct);
    return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
  }

  // Parse hex to RGB object
  hexToRgb(hex) {
    return {
      r: parseInt(hex.slice(1, 3), 16),
      g: parseInt(hex.slice(3, 5), 16),
      b: parseInt(hex.slice(5, 7), 16)
    };
  }

  // === RARITY MULTIPLIER ===
  // Returns 0-1 scale for rarity-based visual enhancements
  // Common=0 (baseline), Rare=0.35, Epic=0.7, Legendary=1.0
  getRarityMultiplier(rarityName) {
    switch (rarityName) {
      case "Legendary": return 1.0;
      case "Epic":      return 0.7;
      case "Rare":      return 0.35;
      default:          return 0;   // Common
    }
  }

  // Rarity tier color palette for visual accents
  getRarityAccentColor(rarityName) {
    switch (rarityName) {
      case "Legendary": return "#FFD700";
      case "Epic":      return "#A855F7";
      case "Rare":      return "#3B82F6";
      default:          return null; // Common = no accent
    }
  }

  // Convert hex color to {r, g, b} object
  _hexToRGB(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
  }

  // Convert hex color to "r,g,b" string for rgba() usage
  _hexToRGBStr(hex) {
    const c = this._hexToRGB(hex);
    return `${c.r},${c.g},${c.b}`;
  }

  // === BACKGROUND (solid color, unique per NFT) ===
  drawBackground(trait, rarityName, seed) {
    const ctx = this.ctx;
    const hex = trait.value;
    const rm = this.getRarityMultiplier(rarityName);

    // Solid color fill — no gradients, no effects
    ctx.fillStyle = hex;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Rare+: very subtle sparkle overlay (kept for rarity distinction)
    if (rm >= 0.35 && seed) {
      const bgRng = seededRandom(seed + 70000);
      const sparkleCount = Math.floor(5 + rm * 20);
      ctx.save();
      for (let i = 0; i < sparkleCount; i++) {
        const sx = bgRng() * CANVAS_SIZE;
        const sy = bgRng() * CANVAS_SIZE;
        const sSize = bgRng() * 2 + 1;
        const alpha = 0.1 + rm * 0.15;
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.beginPath();
        ctx.arc(sx, sy, sSize, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // === BACKGROUND EFFECT (enhanced) ===
  drawEffect(trait, seed, rarityName = "Common") {
    const rng = seededRandom(seed + 9999);
    const ctx = this.ctx;
    const rm = this.getRarityMultiplier(rarityName);

    switch (trait.value) {
      case "particles": {
        const particleCount = Math.floor(45 * (1 + rm * 2));
        for (let i = 0; i < particleCount; i++) {
          const x = rng() * CANVAS_SIZE;
          const y = rng() * CANVAS_SIZE;
          const size = rng() * (4 + rm * 3) + 1;
          const alpha = rng() * 0.5 + 0.1 + rm * 0.15;
          const grad = ctx.createRadialGradient(x, y, 0, x, y, size);
          grad.addColorStop(0, `rgba(255,255,255,${alpha})`);
          grad.addColorStop(1, `rgba(255,255,255,0)`);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }
        // Rarity accent glow particles (Rare+)
        if (rm > 0 && this._rarityAccent) {
          const accentParticles = Math.floor(12 * rm);
          for (let i = 0; i < accentParticles; i++) {
            const x = rng() * CANVAS_SIZE;
            const y = rng() * CANVAS_SIZE;
            const size = rng() * 8 + 3;
            const grad = ctx.createRadialGradient(x, y, 0, x, y, size);
            grad.addColorStop(0, `rgba(${this._rarityAccentRGB.r},${this._rarityAccentRGB.g},${this._rarityAccentRGB.b},${0.35 * rm})`);
            grad.addColorStop(1, `rgba(${this._rarityAccentRGB.r},${this._rarityAccentRGB.g},${this._rarityAccentRGB.b},0)`);
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        break;
      }

      case "rays": {
        ctx.save();
        ctx.globalAlpha = 0.18 + rm * 0.12;
        const rayCenterX = CANVAS_SIZE * 0.4;
        const rayCenterY = CANVAS_SIZE * 0.35;
        const rayCount = Math.floor(12 * (1 + rm * 0.8));
        const hueShift = rm * 60; // Rare+=blue shift, Epic+=purple, Legendary+=gold
        for (let i = 0; i < rayCount; i++) {
          const angle = (i / rayCount) * Math.PI * 2 + rng() * 0.2;
          const hue = rng() * 40 + 30 + hueShift;
          ctx.fillStyle = `hsl(${hue}, 85%, ${75 + rm * 10}%)`;
          ctx.beginPath();
          ctx.moveTo(rayCenterX, rayCenterY);
          ctx.lineTo(rayCenterX + Math.cos(angle) * (320 + rm * 80), rayCenterY + Math.sin(angle) * (320 + rm * 80));
          ctx.lineTo(rayCenterX + Math.cos(angle + 0.1) * (320 + rm * 80), rayCenterY + Math.sin(angle + 0.1) * (320 + rm * 80));
          ctx.fill();
        }
        ctx.restore();
        break;
      }

      case "smoke":
        ctx.save();
        ctx.globalAlpha = 0.14 + rm * 0.1;
        const smokeCount = Math.floor(18 * (1 + rm * 1.5));
        for (let i = 0; i < smokeCount; i++) {
          const x = rng() * CANVAS_SIZE;
          const y = rng() * CANVAS_SIZE * 0.6 + CANVAS_SIZE * 0.35;
          const size = (rng() * 50 + 25) * (1 + rm * 0.8);
          const grad = ctx.createRadialGradient(x, y, 0, x, y, size);
          const accent = rm > 0.5 ? this._rarityAccentRGBStr || "163,123,255" : "180,180,185";
          grad.addColorStop(0, `rgba(${rm > 0.5 ? accent : "210,210,215"},0.45)`);
          grad.addColorStop(0.6, `rgba(${accent},0.2)`);
          grad.addColorStop(1, `rgba(${accent},0)`);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }
        // Rare+: wispy accent streaks
        if (rm > 0.35) {
          ctx.globalAlpha = rm * 0.25;
          for (let i = 0; i < Math.floor(rm * 12); i++) {
            const sx = rng() * CANVAS_SIZE;
            const sy = rng() * CANVAS_SIZE;
            ctx.fillStyle = `rgba(${this._rarityAccentRGBStr || "163,123,255"},${rng() * 0.3 + 0.1})`;
            ctx.beginPath();
            ctx.ellipse(sx, sy, rng() * 80 + 30, rng() * 8 + 3, rng() * Math.PI, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();
        break;

      case "fire":
        ctx.save();
        ctx.globalAlpha = 0.3 + rm * 0.15;
        const fireCount = Math.floor(30 * (1 + rm * 1.2));
        for (let i = 0; i < fireCount; i++) {
          const x = rng() * CANVAS_SIZE;
          const y = CANVAS_SIZE - rng() * CANVAS_SIZE * 0.65;
          const size = (rng() * 18 + 6) * (1 + rm * 0.6);
          const grad = ctx.createRadialGradient(x, y, 0, x, y, size);
          // Rare+: shift fire toward purple/accent; Legendary gets gold-ember
          if (rm >= 1) {
            grad.addColorStop(0, "rgba(255,215,0,0.8)");
            grad.addColorStop(0.5, `rgba(${this._rarityAccentRGBStr || "255,100,0"},0.4)`);
            grad.addColorStop(1, "rgba(120,0,0,0)");
          } else if (rm > 0.5) {
            grad.addColorStop(0, `rgba(${this._rarityAccentRGBStr || "168,85,247"},0.75)`);
            grad.addColorStop(0.5, "rgba(255,80,0,0.35)");
            grad.addColorStop(1, "rgba(150,0,0,0)");
          } else {
            grad.addColorStop(0, "rgba(255,140,0,0.7)");
            grad.addColorStop(0.5, "rgba(255,60,0,0.3)");
            grad.addColorStop(1, "rgba(200,0,0,0)");
          }
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }
        // Epic+: ember ring effect
        if (rm > 0.7) {
          ctx.globalAlpha = rm * 0.2;
          for (let i = 0; i < Math.floor(rm * 20); i++) {
            const angle = rng() * Math.PI * 2;
            const dist = rng() * 120 + 60;
            const ex = 200 + Math.cos(angle) * dist;
            const ey = 230 + Math.sin(angle) * dist;
            ctx.fillStyle = `rgba(255,${Math.floor(rng() * 120 + 100)},0,${rng() * 0.5 + 0.3})`;
            ctx.beginPath();
            ctx.arc(ex, ey, rng() * 3 + 1, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();
        break;

      case "lightning":
        ctx.save();
        const lightningCount = Math.floor(4 * (1 + rm * 1.5));
        for (let i = 0; i < lightningCount; i++) {
          let x = rng() * CANVAS_SIZE;
          let y = 0;
          const hue = rm > 0.5 ? (280 + rm * 80) : (rng() * 30 + 200); // Rare+: purple/accent shift
          ctx.strokeStyle = `hsla(${hue}, 85%, ${80 + rm * 5}%, ${0.7 + rm * 0.15})`;
          ctx.lineWidth = (rng() * 2 + 1) * (1 + rm * 0.5);
          ctx.shadowColor = `hsl(${hue}, 85%, 80%)`;
          ctx.shadowBlur = (12 + rm * 12) * PX;
          ctx.beginPath();
          ctx.moveTo(x, y);
          while (y < CANVAS_SIZE * 0.75) {
            x += (rng() - 0.5) * 45;
            y += rng() * 35 + 12;
            ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
        // Epic+: secondary glow branches
        if (rm > 0.7) {
          ctx.globalAlpha = rm * 0.35;
          for (let i = 0; i < Math.floor(rm * 8); i++) {
            let bx = rng() * CANVAS_SIZE;
            let by = rng() * CANVAS_SIZE * 0.5;
            ctx.strokeStyle = `rgba(${this._rarityAccentRGBStr || "168,85,247"},${rng() * 0.4 + 0.2})`;
            ctx.lineWidth = rng() * 1.5 + 0.5;
            ctx.beginPath();
            ctx.moveTo(bx, by);
            for (let s = 0; s < 5; s++) {
              bx += (rng() - 0.5) * 30;
              by += rng() * 20 + 5;
              ctx.lineTo(bx, by);
            }
            ctx.stroke();
          }
        }
        ctx.shadowBlur = 0;
        ctx.restore();
        break;

      case "sakura":
        ctx.save();
        const sakuraCount = Math.floor(35 * (1 + rm * 1.5));
        for (let i = 0; i < sakuraCount; i++) {
          const x = rng() * CANVAS_SIZE;
          const y = rng() * CANVAS_SIZE;
          const size = (rng() * 7 + 3) * (1 + rm * 0.5);
          const rot = rng() * Math.PI * 2;
          const alpha = rng() * 0.45 + 0.2 + rm * 0.1;
          // Rare+: petals shift toward purple/accent
          let pink;
          if (rm >= 1) {
            pink = rng() > 0.5 ? "255,215,0" : this._rarityAccentRGBStr || "168,85,247";
          } else if (rm > 0.5) {
            pink = rng() > 0.5 ? "200,150,255" : "255,150,220";
          } else {
            pink = rng() > 0.5 ? "255,183,197" : "255,150,180";
          }
          ctx.fillStyle = `rgba(${pink},${alpha})`;
          ctx.beginPath();
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(rot);
          for (let p = 0; p < 5; p++) {
            const angle = (p / 5) * Math.PI * 2;
            const px2 = Math.cos(angle) * size;
            const py2 = Math.sin(angle) * size;
            ctx.beginPath();
            ctx.ellipse(px2, py2, size * 0.5, size * 0.3, angle, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }
        // Epic+: golden petal sparkles
        if (rm > 0.7) {
          ctx.globalAlpha = rm * 0.4;
          for (let i = 0; i < Math.floor(rm * 15); i++) {
            const gx = rng() * CANVAS_SIZE;
            const gy = rng() * CANVAS_SIZE;
            ctx.fillStyle = `rgba(255,215,0,${rng() * 0.5 + 0.2})`;
            ctx.beginPath();
            ctx.arc(gx, gy, rng() * 2 + 0.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();
        break;

      case "dragonaura": {
        const _drm = this.getRarityMultiplier(rarityName);
        ctx.save();
        // Dragon aura rings — more rings and brighter for higher rarity
        const ringCount = Math.round(6 + _drm * 6);
        ctx.globalAlpha = 0.22 + _drm * 0.18;
        for (let i = 0; i < ringCount; i++) {
          const r = (70 + i * 28) * (1 + _drm * 0.3);
          const grad = ctx.createRadialGradient(CANVAS_SIZE / 2, CANVAS_SIZE * 0.575, r * 0.25, CANVAS_SIZE / 2, CANVAS_SIZE * 0.575, r);
          grad.addColorStop(0, "rgba(255,100,0,0.35)");
          grad.addColorStop(0.5, "rgba(255,40,0,0.15)");
          grad.addColorStop(1, "rgba(200,0,0,0)");
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE * 0.575, r, 0, Math.PI * 2);
          ctx.fill();
        }
        // Ember particles — more particles + bigger for higher rarity
        const emberCount = Math.round(15 + _drm * 20);
        for (let i = 0; i < emberCount; i++) {
          const x = rng() * CANVAS_SIZE;
          const y = rng() * CANVAS_SIZE * 0.7 + CANVAS_SIZE * 0.2;
          const sz = (rng() * 2 + 1) * (1 + _drm * 1.5);
          ctx.fillStyle = `rgba(255,${Math.floor(rng() * 100 + 80)},0,${rng() * 0.6 + 0.2 + _drm * 0.15})`;
          ctx.beginPath();
          ctx.arc(x, y, sz, 0, Math.PI * 2);
          ctx.fill();
        }
        // Rarity accent glow overlay
        if (_drm > 0 && this._rarityAccent) {
          ctx.globalAlpha = _drm * 0.15;
          const accentGrad = ctx.createRadialGradient(CANVAS_SIZE / 2, CANVAS_SIZE * 0.575, 0, CANVAS_SIZE / 2, CANVAS_SIZE * 0.575, CANVAS_SIZE * 0.45);
          accentGrad.addColorStop(0, this._rarityAccent);
          accentGrad.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = accentGrad;
          ctx.beginPath();
          ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE * 0.575, CANVAS_SIZE * 0.45, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
        break;
      }

      case "voidrift": {
        ctx.save();
        // Rarity-scaled intensity
        const vrI = 0.45 + rm * 0.3; // base alpha
        const vg = ctx.createLinearGradient(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        if (rm > 0) {
          // Shift hue toward accent color for Rare+
          const { r: ar, g: ag, b: ab } = this._rarityAccentRGB;
          vg.addColorStop(0, `rgba(${Math.round(120 + ar * 0.3)},${Math.round(ag * 0.3)},${Math.round(220 + ab * 0.3)},${vrI})`);
          vg.addColorStop(0.3, "rgba(0,0,60,0)");
          vg.addColorStop(0.7, "rgba(0,0,60,0)");
          vg.addColorStop(1, `rgba(${Math.round(180 + ar * 0.3)},${Math.round(ag * 0.3)},${Math.round(255)},${vrI})`);
        } else {
          vg.addColorStop(0, `rgba(120,0,220,${vrI})`);
          vg.addColorStop(0.3, "rgba(0,0,60,0)");
          vg.addColorStop(0.7, "rgba(0,0,60,0)");
          vg.addColorStop(1, `rgba(180,0,255,${vrI})`);
        }
        ctx.fillStyle = vg;
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        // Void orbs — count & size scale with rarity
        const orbCount = Math.floor(8 + rm * 12);
        for (let i = 0; i < orbCount; i++) {
          const x = rng() * CANVAS_SIZE;
          const y = rng() * CANVAS_SIZE;
          const r = (rng() * 15 + 5 + rm * 12) * PX;
          const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
          if (rm > 0.6) {
            // Legendary: gold-purple rift
            grad.addColorStop(0, "rgba(255,215,0,0.55)");
            grad.addColorStop(0.5, "rgba(180,100,255,0.3)");
            grad.addColorStop(1, "rgba(50,0,100,0)");
          } else if (rm > 0.3) {
            // Epic: purple-accent
            grad.addColorStop(0, `rgba(${this._rarityAccentRGB.r},${this._rarityAccentRGB.g},${this._rarityAccentRGB.b},0.5)`);
            grad.addColorStop(1, "rgba(50,0,100,0)");
          } else if (rm > 0) {
            // Rare: subtle accent tint
            grad.addColorStop(0, "rgba(150,50,255,0.5)");
            grad.addColorStop(0.6, `rgba(${this._rarityAccentRGB.r},${this._rarityAccentRGB.g},${this._rarityAccentRGB.b},0.2)`);
            grad.addColorStop(1, "rgba(50,0,100,0)");
          } else {
            grad.addColorStop(0, "rgba(150,50,255,0.4)");
            grad.addColorStop(1, "rgba(50,0,100,0)");
          }
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
        // Swirling portal rings for Rare+
        if (rm > 0) {
          const ringCount = Math.floor(2 + rm * 6);
          ctx.globalAlpha = 0.15 + rm * 0.2;
          for (let i = 0; i < ringCount; i++) {
            const cx = CANVAS_SIZE / 2 + (rng() - 0.5) * CANVAS_SIZE * 0.6;
            const cy = CANVAS_SIZE / 2 + (rng() - 0.5) * CANVAS_SIZE * 0.6;
            const rr = (rng() * 40 + 20 + rm * 30) * PX;
            ctx.strokeStyle = rm > 0.6 ? "#FFD700" : this._rarityAccent;
            ctx.lineWidth = (1 + rm * 2) * PX;
            ctx.beginPath();
            ctx.ellipse(cx, cy, rr, rr * 0.4, rng() * Math.PI, 0, Math.PI * 2);
            ctx.stroke();
          }
          ctx.globalAlpha = 1;
        }
        // Sparkle particles Epic+
        if (rm > 0.3) {
          const sparkCount = Math.floor(rm * 25);
          for (let i = 0; i < sparkCount; i++) {
            const sx = rng() * CANVAS_SIZE;
            const sy = rng() * CANVAS_SIZE;
            const sr = (rng() * 2 + 0.5) * PX;
            ctx.fillStyle = rm > 0.6 ? "rgba(255,215,0,0.8)" : `rgba(${this._rarityAccentRGB.r},${this._rarityAccentRGB.g},${this._rarityAccentRGB.b},0.7)`;
            ctx.beginPath();
            ctx.arc(sx, sy, sr, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();
        break;
      }

      case "cosmicstorm": {
        ctx.save();
        // Rarity-scaled base alpha
        const csBaseAlpha = 0.3 + rm * 0.2;
        ctx.globalAlpha = csBaseAlpha;
        // Stars — count & size scale with rarity
        const starCount = Math.floor(60 + rm * 80);
        for (let i = 0; i < starCount; i++) {
          const x = rng() * CANVAS_SIZE;
          const y = rng() * CANVAS_SIZE;
          const size = (rng() * 3 + 0.5 + rm * 1.5) * PX;
          if (rm > 0.6) {
            // Legendary: gold & white stars
            ctx.fillStyle = rng() > 0.4
              ? `rgba(255,215,0,${0.6 + rng() * 0.4})`
              : `rgba(255,255,255,${0.6 + rng() * 0.4})`;
          } else if (rm > 0) {
            // Rare+: accent-tinted stars
            ctx.fillStyle = rng() > 0.6
              ? `rgba(${this._rarityAccentRGB.r},${this._rarityAccentRGB.g},${this._rarityAccentRGB.b},${0.6 + rng() * 0.4})`
              : `hsl(${rng() * 360}, 85%, 80%)`;
          } else {
            ctx.fillStyle = `hsl(${rng() * 360}, 85%, 80%)`;
          }
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }
        // Nebula clouds — count & size scale
        const nebCount = Math.floor(7 + rm * 10);
        for (let i = 0; i < nebCount; i++) {
          const x = rng() * CANVAS_SIZE;
          const y = rng() * CANVAS_SIZE;
          const size = (rng() * 60 + 30 + rm * 50) * PX;
          let hue = rng() * 360;
          const nebAlpha = 0.25 + rm * 0.15;
          if (rm > 0.6) {
            // Legendary: shift nebulas to gold-purple
            hue = 270 + rng() * 60; // purple-gold range
          } else if (rm > 0) {
            // Rare+: bias hue toward accent
            hue = 250 + rng() * 80; // purple range
          }
          const grad = ctx.createRadialGradient(x, y, 0, x, y, size);
          grad.addColorStop(0, `hsla(${hue}, 75%, 55%, ${nebAlpha})`);
          grad.addColorStop(0.5, `hsla(${hue + 30}, 65%, 45%, ${nebAlpha * 0.4})`);
          grad.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }
        // Accent glow core Rare+
        if (rm > 0) {
          const glowR = (100 + rm * 60) * PX;
          const glowGrad = ctx.createRadialGradient(
            CANVAS_SIZE / 2, CANVAS_SIZE / 2, 0,
            CANVAS_SIZE / 2, CANVAS_SIZE / 2, glowR
          );
          const gAlpha = 0.08 + rm * 0.12;
          if (rm > 0.6) {
            glowGrad.addColorStop(0, `rgba(255,215,0,${gAlpha})`);
          } else {
            glowGrad.addColorStop(0, `rgba(${this._rarityAccentRGB.r},${this._rarityAccentRGB.g},${this._rarityAccentRGB.b},${gAlpha})`);
          }
          glowGrad.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = glowGrad;
          ctx.beginPath();
          ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, glowR, 0, Math.PI * 2);
          ctx.fill();
        }
        // Cosmic lightning bolts Epic+
        if (rm > 0.3) {
          const boltCount = Math.floor(3 + rm * 8);
          ctx.strokeStyle = rm > 0.6 ? "rgba(255,215,0,0.5)" : `rgba(${this._rarityAccentRGB.r},${this._rarityAccentRGB.g},${this._rarityAccentRGB.b},0.4)`;
          ctx.lineWidth = (1 + rm * 2) * PX;
          for (let b = 0; b < boltCount; b++) {
            let bx = rng() * CANVAS_SIZE;
            let by = 0;
            ctx.beginPath();
            ctx.moveTo(bx, by);
            const segments = Math.floor(6 + rm * 8);
            for (let s = 0; s < segments; s++) {
              bx += (rng() - 0.5) * 60 * PX;
              by += (rng() * 40 + 10) * PX;
              ctx.lineTo(bx, by);
            }
            ctx.stroke();
          }
        }
        ctx.restore();
        break;
      }
    }
  }

  // === CHARACTER BODY (enhanced proportions with shading) ===
  drawSkin(skinColor) {
    const headX = 32;
    const headY = 18;
    const headW = 36;
    const headH = 34;
    const ctx = this.ctx;

    // Neck shadow
    this.rect(45, headY + headH + 4, 10, 4, this.darken(skinColor, 0.12));

    // Neck
    this.rect(44, headY + headH + 2, 12, 10, skinColor);

    // Head - larger anime proportions
    this.rect(headX, headY, headW, headH, skinColor);

    // Chin taper
    this.rect(headX + 3, headY + headH, headW - 6, 5, skinColor);
    this.rect(headX + 5, headY + headH + 5, headW - 10, 3, skinColor);

    // Face shading - left side darker (light from right)
    this.rect(headX, headY + 3, 4, headH - 6, this.darken(skinColor, 0.08));
    // Face shadow bottom
    this.rect(headX, headY + headH - 3, headW, 3, this.darken(skinColor, 0.1));
    // Face shadow under hair
    this.rect(headX, headY, headW, 3, this.darken(skinColor, 0.06));

    // Cheek blush (subtle pink)
    const blushColor = this.lighten(skinColor, 0.15);
    this.rect(headX + 4, headY + 18, 5, 3, blushColor);
    this.rect(headX + headW - 9, headY + 18, 5, 3, blushColor);

    // Nose shadow
    this.rect(headX + 15, headY + 16, 2, 4, this.darken(skinColor, 0.12));

    // Body
    this.rect(30, headY + headH + 12, 40, 30, skinColor);

    // Body shading - left side
    this.rect(30, headY + headH + 12, 5, 30, this.darken(skinColor, 0.08));
    // Body shadow bottom
    this.rect(30, headY + headH + 36, 40, 6, this.darken(skinColor, 0.1));
    // Body highlight center
    this.rect(48, headY + headH + 14, 12, 10, this.lighten(skinColor, 0.06));
  }

  // === HAIR (enhanced with highlights/shadows) ===
  drawHair(style, color, seed, rarityName) {
    const rng = seededRandom(seed + 500);
    const ctx = this.ctx;
    const headX = 32;
    const headY = 18;
    const headW = 36;
    const hairHighlight = this.lighten(color, 0.25);
    const hairShadow = this.darken(color, 0.2);
    const rn = rarityName || "Common";
    const rm = this.getRarityMultiplier(rn);
    const rarityAccent = this._rarityAccent;
    const rarityAccentRGB = this._rarityAccentRGB;

    switch (style.value) {
      case "bob":
        // Top volume
        this.rect(headX - 3, headY - 5, headW + 6, 10, color);
        this.rect(headX - 1, headY - 7, headW + 2, 4, color);
        // Sides
        this.rect(headX - 5, headY - 2, 8, 24, color);
        this.rect(headX + headW - 3, headY - 2, 8, 24, color);
        // Bottom edges
        this.rect(headX - 3, headY + 20, 6, 10, color);
        this.rect(headX + headW - 3, headY + 20, 6, 10, color);
        // Highlights
        this.rect(headX - 2, headY - 4, 4, 3, hairHighlight);
        this.rect(headX + headW - 2, headY - 4, 4, 3, hairHighlight);
        // Shadow layer
        this.rect(headX - 4, headY + 16, 6, 4, hairShadow);
        this.rect(headX + headW - 2, headY + 16, 6, 4, hairShadow);
        break;

      case "spiky":
        // Base
        this.rect(headX - 3, headY - 6, headW + 6, 10, color);
        // Spikes with varying heights
        for (let i = 0; i < 9; i++) {
          const spikeH = rng() * 12 + 5;
          const sx = headX + i * 4 - 3;
          this.rect(sx, headY - 6 - spikeH, 6, spikeH, color);
          // Spike highlight edge
          this.rect(sx, headY - 6 - spikeH, 2, spikeH, hairHighlight);
          // Spike shadow edge
          this.rect(sx + 4, headY - 6 - spikeH, 2, spikeH, hairShadow);
        }
        // Side hair
        this.rect(headX - 5, headY, 6, 14, color);
        this.rect(headX + headW - 1, headY, 6, 14, color);
        break;

      case "ponytail":
        // Base
        this.rect(headX - 3, headY - 5, headW + 6, 10, color);
        this.rect(headX - 5, headY - 2, 8, 18, color);
        this.rect(headX + headW - 3, headY - 2, 8, 18, color);
        // Ponytail with flow
        this.rect(headX + headW - 1, headY - 3, 10, 6, color);
        this.rect(headX + headW + 5, headY - 1, 8, 6, color);
        this.rect(headX + headW + 7, headY + 5, 8, 8, color);
        this.rect(headX + headW + 5, headY + 13, 8, 8, color);
        this.rect(headX + headW + 3, headY + 21, 6, 10, color);
        // Highlights
        this.rect(headX - 2, headY - 4, 5, 4, hairHighlight);
        this.rect(headX + headW + 6, headY, 4, 5, hairHighlight);
        // Shadow
        this.rect(headX + headW + 4, headY + 18, 6, 6, hairShadow);
        break;

      case "crop":
        this.rect(headX - 3, headY - 5, headW + 6, 8, color);
        this.rect(headX - 5, headY - 2, 8, 12, color);
        this.rect(headX + headW - 3, headY - 2, 8, 12, color);
        // Texture lines
        for (let i = 0; i < 4; i++) {
          this.rect(headX + i * 8, headY - 3, 3, 1, hairHighlight);
        }
        break;

      case "long":
        this.rect(headX - 3, headY - 5, headW + 6, 10, color);
        this.rect(headX - 7, headY - 2, 10, 40, color);
        this.rect(headX + headW - 3, headY - 2, 10, 40, color);
        this.rect(headX - 5, headY + 36, 8, 12, color);
        this.rect(headX + headW - 3, headY + 36, 8, 12, color);
        // Hair tips taper
        this.rect(headX - 3, headY + 46, 4, 6, color);
        this.rect(headX + headW + 1, headY + 46, 4, 6, color);
        // Highlights
        this.rect(headX - 6, headY, 3, 20, hairHighlight);
        this.rect(headX + headW + 2, headY, 3, 20, hairHighlight);
        // Shadow
        this.rect(headX - 5, headY + 30, 6, 10, hairShadow);
        this.rect(headX + headW - 1, headY + 30, 6, 10, hairShadow);
        break;

      case "mohawk":
        this.rect(headX - 3, headY - 5, headW + 6, 8, color);
        // Central mohawk with gradient
        for (let i = 0; i < 7; i++) {
          const spikeH = rng() * 16 + 8;
          const sx = headX + 14;
          this.rect(sx, headY - 5 - spikeH + i * 2, 8, spikeH - i * 2, color);
          // Highlight
          this.rect(sx, headY - 5 - spikeH + i * 2, 3, spikeH - i * 2, hairHighlight);
        }
        // Shaved sides (darker)
        this.rect(headX - 4, headY - 2, 8, 10, this.darken(color, 0.35));
        this.rect(headX + headW - 4, headY - 2, 8, 10, this.darken(color, 0.35));
        break;

      case "bun":
        this.rect(headX - 3, headY - 5, headW + 6, 8, color);
        this.rect(headX - 5, headY - 2, 8, 12, color);
        this.rect(headX + headW - 3, headY - 2, 8, 12, color);
        // Bun
        this.rect(headX + 10, headY - 16, 16, 14, color);
        this.rect(headX + 8, headY - 14, 20, 10, color);
        this.rect(headX + 12, headY - 18, 12, 6, color);
        // Bun highlights
        this.rect(headX + 12, headY - 15, 4, 4, hairHighlight);
        // Bun shadow
        this.rect(headX + 10, headY - 6, 16, 3, hairShadow);
        break;

      case "twintails":
        this.rect(headX - 3, headY - 5, headW + 6, 10, color);
        // Left tail
        this.rect(headX - 6, headY + 2, 8, 8, color);
        this.rect(headX - 8, headY + 10, 8, 20, color);
        this.rect(headX - 6, headY + 30, 6, 14, color);
        this.rect(headX - 4, headY + 42, 4, 8, color);
        // Right tail
        this.rect(headX + headW - 2, headY + 2, 8, 8, color);
        this.rect(headX + headW, headY + 10, 8, 20, color);
        this.rect(headX + headW + 2, headY + 30, 6, 14, color);
        this.rect(headX + headW + 2, headY + 42, 4, 8, color);
        // Hair ties
        this.rect(headX - 5, headY + 8, 6, 3, "#FF6B9D");
        this.rect(headX + headW - 1, headY + 8, 6, 3, "#FF6B9D");
        // Highlights
        this.rect(headX - 5, headY + 12, 3, 10, hairHighlight);
        this.rect(headX + headW + 1, headY + 12, 3, 10, hairHighlight);
        break;

      case "dragon":
        this.rect(headX - 3, headY - 10, headW + 6, 14, color);
        // Large central horn
        for (let i = 0; i < 5; i++) {
          const spikeH = rng() * 16 + 10;
          const sx = headX + i * 7 - 2;
          this.rect(sx, headY - 10 - spikeH, 8, spikeH, color);
          // Horn gradient
          this.rect(sx, headY - 10 - spikeH, 3, spikeH, hairHighlight);
          this.rect(sx + 5, headY - 10 - spikeH, 3, spikeH, hairShadow);
        }
        // Side horns
        this.rect(headX - 10, headY + 4, 8, 8, color);
        this.rect(headX - 12, headY + 2, 4, 6, hairHighlight);
        this.rect(headX + headW + 2, headY + 4, 8, 8, color);
        this.rect(headX + headW + 6, headY + 2, 4, 6, hairHighlight);
        break;

      case "crown":
        this.rect(headX - 3, headY - 5, headW + 6, 8, color);
        // Crown spikes
        for (let i = 0; i < 7; i++) {
          const pointH = rng() * 12 + 10;
          const sx = headX + i * 5 - 2;
          this.rect(sx, headY - 5 - pointH, 5, pointH, color);
          this.rect(sx, headY - 5 - pointH, 2, pointH, hairHighlight);
        }
        this.rect(headX - 5, headY - 2, 8, 12, color);
        this.rect(headX + headW - 3, headY - 2, 8, 12, color);
        break;

      case "halo":
        this.rect(headX - 3, headY - 5, headW + 6, 8, color);
        this.rect(headX - 5, headY - 2, 8, 14, color);
        this.rect(headX + headW - 3, headY - 2, 8, 14, color);
        // Halo glow ring
        ctx.save();
        ctx.shadowColor = "#FFD700";
        ctx.shadowBlur = 18 * (BLOCK_SIZE / 4);
        ctx.strokeStyle = "#FFD700";
        ctx.lineWidth = 3 * (BLOCK_SIZE / 4);
        ctx.beginPath();
        ctx.ellipse(50 * (BLOCK_SIZE / 4), (headY - 10) * (BLOCK_SIZE / 4), 20 * (BLOCK_SIZE / 4), 6 * (BLOCK_SIZE / 4), 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = "#FFF8DC";
        ctx.lineWidth = 1.5 * (BLOCK_SIZE / 4);
        ctx.beginPath();
        ctx.ellipse(50 * (BLOCK_SIZE / 4), (headY - 10) * (BLOCK_SIZE / 4), 18 * (BLOCK_SIZE / 4), 5 * (BLOCK_SIZE / 4), 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        break;
    }

    // === GLOBAL HAIR TEXTURE ENHANCEMENT ===
    // Add hair strand lines for texture
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.strokeStyle = hairShadow;
    ctx.lineWidth = PX * 0.8;
    for (let i = 0; i < 12; i++) {
      const strandX = headX + rng() * headW;
      const strandY = headY + rng() * 30;
      const strandH = 8 + rng() * 16;
      ctx.beginPath();
      ctx.moveTo(strandX * BLOCK_SIZE, strandY * BLOCK_SIZE);
      ctx.lineTo(strandX * BLOCK_SIZE + (rng() - 0.5) * 4, (strandY + strandH) * BLOCK_SIZE);
      ctx.stroke();
    }
    ctx.restore();

    // Hair shine line (top highlight streak)
    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = hairHighlight;
    ctx.fillRect((headX + 4) * BLOCK_SIZE, (headY - 3) * BLOCK_SIZE, 6 * BLOCK_SIZE, 2 * BLOCK_SIZE);
    ctx.fillRect((headX + 14) * BLOCK_SIZE, (headY - 5) * BLOCK_SIZE, 8 * BLOCK_SIZE, 2 * BLOCK_SIZE);
    ctx.restore();

    // === RARITY TIER VISUAL ENHANCEMENTS: Hair shimmer overlays ===
    if (rm >= 0.35) {
      // Rare+ : iridescent shimmer overlay
      ctx.save();
      ctx.globalAlpha = rm * 0.15;
      const shimmerGrad = ctx.createLinearGradient(5 * PX, 15 * PX, 45 * PX, 65 * PX);
      shimmerGrad.addColorStop(0, rarityAccent);
      shimmerGrad.addColorStop(0.5, '#ffffff');
      shimmerGrad.addColorStop(1, rarityAccent);
      ctx.fillStyle = shimmerGrad;
      ctx.fillRect(5 * PX, 15 * PX, 40 * PX, 50 * PX);
      ctx.restore();
    }

    if (rm >= 0.7) {
      // Epic+ : accent color glow sweep
      ctx.save();
      ctx.globalAlpha = (rm - 0.7) * 0.8;
      ctx.shadowColor = rarityAccent;
      ctx.shadowBlur = 18 * PX;
      ctx.fillStyle = rarityAccent;
      ctx.fillRect(12 * PX, 20 * PX, 28 * PX, 40 * PX);
      ctx.restore();
    }

    if (rm >= 1.0) {
      // Legendary: gold shimmer flicker
      ctx.save();
      ctx.globalAlpha = 0.12;
      for (let i = 0; i < 6; i++) {
        const sparkX = 10 + Math.sin(seed + i * 2.7) * 16;
        const sparkY = 20 + Math.cos(seed + i * 1.3) * 22;
        ctx.beginPath();
        ctx.arc(sparkX * PX, sparkY * PX, 2 * PX, 0, Math.PI * 2);
        ctx.fillStyle = i % 2 === 0 ? '#FFD700' : '#ffffff';
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // === EYES (enhanced: multi-layer iris, light reflections, detailed pupils) ===
  drawEyes(style, color, seed, rarityName) {
    const rng = seededRandom(seed + 7000);
    const eyeY = 32;
    const leftEyeX = 38;
    const rightEyeX = 54;
    const eyeW = 8;
    const eyeH = 7;
    const ctx = this.ctx;
    const rn = rarityName || 'common';
    const rm = this.getRarityMultiplier(rn);
    const rarityAccent = this.getRarityAccentColor(rn);
    const rarityAccentRGB = rarityAccent ? this._hexToRGB(rarityAccent) : null;

    // Resolve special eye color types
    const fallbackColors = ["#4682B4", "#2ECC71", "#FFBF00", "#9B59B6", "#FFD700"];
    let leftColor = color;
    let rightColor = color;
    if (color === "hetero") {
      leftColor = fallbackColors[Math.floor(rng() * fallbackColors.length)];
      rightColor = fallbackColors[Math.floor(rng() * fallbackColors.length)];
      color = leftColor;
    } else if (color === "nebula") {
      color = "#9B59B6";
      leftColor = color;
      rightColor = color;
    } else if (!color || !color.startsWith("#")) {
      color = fallbackColors[Math.floor(rng() * fallbackColors.length)];
      leftColor = color;
      rightColor = color;
    }

    // Eye white with depth
    this.rect(leftEyeX, eyeY, eyeW, eyeH, "#FFFFFF");
    this.rect(rightEyeX, eyeY, eyeW, eyeH, "#FFFFFF");
    // Eye shadow (top lid cast)
    this.rect(leftEyeX, eyeY, eyeW, 2, "#E8E8EC");
    this.rect(rightEyeX, eyeY, eyeW, 2, "#E8E8EC");
    // Eye bottom shadow
    this.rect(leftEyeX, eyeY + eyeH - 1, eyeW, 1, "#F0F0F4");
    this.rect(rightEyeX, eyeY + eyeH - 1, eyeW, 1, "#F0F0F4");
    // Upper eyelid line (thicker, more anime)
    this.rect(leftEyeX - 1, eyeY - 1, eyeW + 2, 2, "#2A2A3E");
    this.rect(rightEyeX - 1, eyeY - 1, eyeW + 2, 2, "#2A2A3E");
    // Eyelash tips
    this.px(leftEyeX - 2, eyeY - 1, "#2A2A3E");
    this.px(rightEyeX + eyeW + 1, eyeY - 1, "#2A2A3E");

    switch (style.value) {
      case "determined":
        // Angled eyebrows
        this.rect(leftEyeX - 1, eyeY - 3, 9, 2, "#1A1A2E");
        this.rect(rightEyeX + 0, eyeY - 3, 9, 2, "#1A1A2E");
        this.px(leftEyeX + 7, eyeY - 4, "#1A1A2E");
        this.px(rightEyeX, eyeY - 4, "#1A1A2E");
        // Iris base
        this.rect(leftEyeX + 1, eyeY + 1, 5, 5, color);
        this.rect(rightEyeX + 2, eyeY + 1, 5, 5, color);
        // Iris dark ring
        this.rect(leftEyeX + 1, eyeY + 1, 5, 1, this.darken(color, 0.3));
        this.rect(rightEyeX + 2, eyeY + 1, 5, 1, this.darken(color, 0.3));
        // Pupil
        this.rect(leftEyeX + 2, eyeY + 2, 3, 3, "#000000");
        this.rect(rightEyeX + 3, eyeY + 2, 3, 3, "#000000");
        // Light reflection
        this.px(leftEyeX + 3, eyeY + 2, "#FFFFFF");
        this.px(rightEyeX + 4, eyeY + 2, "#FFFFFF");
        this.px(leftEyeX + 4, eyeY + 3, "rgba(255,255,255,0.6)");
        this.px(rightEyeX + 5, eyeY + 3, "rgba(255,255,255,0.6)");
        break;

      case "sharp":
        // Narrowed eyebrows
        this.rect(leftEyeX - 1, eyeY - 2, 10, 2, "#1A1A2E");
        this.rect(rightEyeX - 1, eyeY - 2, 10, 2, "#1A1A2E");
        // Iris
        this.rect(leftEyeX + 1, eyeY + 1, 6, 5, color);
        this.rect(rightEyeX + 1, eyeY + 1, 6, 5, color);
        // Iris gradient
        this.rect(leftEyeX + 1, eyeY + 4, 6, 2, this.darken(color, 0.2));
        this.rect(rightEyeX + 1, eyeY + 4, 6, 2, this.darken(color, 0.2));
        // Pupil
        this.rect(leftEyeX + 3, eyeY + 2, 2, 3, "#000000");
        this.rect(rightEyeX + 3, eyeY + 2, 2, 3, "#000000");
        // Reflections
        this.px(leftEyeX + 4, eyeY + 2, "#FFFFFF");
        this.px(rightEyeX + 4, eyeY + 2, "#FFFFFF");
        break;

      case "gentle":
        // Soft eyebrows
        this.rect(leftEyeX, eyeY - 2, 6, 2, "#1A1A2E");
        this.rect(rightEyeX + 1, eyeY - 2, 6, 2, "#1A1A2E");
        // Round iris
        this.rect(leftEyeX + 1, eyeY + 1, 5, 5, color);
        this.rect(rightEyeX + 2, eyeY + 1, 5, 5, color);
        // Inner iris highlight
        this.rect(leftEyeX + 2, eyeY + 2, 3, 2, this.lighten(color, 0.3));
        this.rect(rightEyeX + 3, eyeY + 2, 3, 2, this.lighten(color, 0.3));
        // Pupil
        this.rect(leftEyeX + 2, eyeY + 3, 3, 2, "#000000");
        this.rect(rightEyeX + 3, eyeY + 3, 3, 2, "#000000");
        // Double sparkle
        this.px(leftEyeX + 3, eyeY + 2, "#FFFFFF");
        this.px(rightEyeX + 4, eyeY + 2, "#FFFFFF");
        this.px(leftEyeX + 2, eyeY + 1, "rgba(255,255,255,0.7)");
        this.px(rightEyeX + 3, eyeY + 1, "rgba(255,255,255,0.7)");
        break;

      case "focused":
        // Thick brows
        this.rect(leftEyeX - 1, eyeY - 3, 10, 3, "#1A1A2E");
        this.rect(rightEyeX, eyeY - 3, 10, 3, "#1A1A2E");
        // Large iris
        this.rect(leftEyeX, eyeY, 7, 6, color);
        this.rect(rightEyeX + 1, eyeY, 7, 6, color);
        // Iris ring
        ctx.save();
        ctx.strokeStyle = this.darken(color, 0.25);
        ctx.lineWidth = PX;
        ctx.strokeRect(leftEyeX * BLOCK_SIZE + 2, eyeY * BLOCK_SIZE + 2, 5 * BLOCK_SIZE, 4 * BLOCK_SIZE);
        ctx.strokeRect((rightEyeX + 1) * BLOCK_SIZE + 2, eyeY * BLOCK_SIZE + 2, 5 * BLOCK_SIZE, 4 * BLOCK_SIZE);
        ctx.restore();
        // Pupil
        this.rect(leftEyeX + 2, eyeY + 1, 3, 4, "#000000");
        this.rect(rightEyeX + 3, eyeY + 1, 3, 4, "#000000");
        // Light
        this.px(leftEyeX + 3, eyeY + 1, "#FFFFFF");
        this.px(rightEyeX + 4, eyeY + 1, "#FFFFFF");
        break;

      case "fierce":
        // Angry brows
        this.rect(leftEyeX - 2, eyeY - 4, 10, 3, "#1A1A2E");
        this.rect(rightEyeX + 0, eyeY - 4, 10, 3, "#1A1A2E");
        this.px(leftEyeX + 8, eyeY - 5, "#1A1A2E");
        this.px(rightEyeX - 1, eyeY - 5, "#1A1A2E");
        // Iris
        this.rect(leftEyeX, eyeY, 7, 6, color);
        this.rect(rightEyeX + 1, eyeY, 7, 6, color);
        // Narrowed pupil
        this.rect(leftEyeX + 3, eyeY + 1, 2, 4, "#000000");
        this.rect(rightEyeX + 4, eyeY + 1, 2, 4, "#000000");
        // Red tint
        this.px(leftEyeX + 5, eyeY + 4, "rgba(255,0,0,0.4)");
        this.px(rightEyeX + 2, eyeY + 4, "rgba(255,0,0,0.4)");
        break;

      case "mystic":
        // Full color iris
        this.rect(leftEyeX, eyeY, eyeW, eyeH, color);
        this.rect(rightEyeX, eyeY, eyeW, eyeH, color);
        // Iris detail
        const mystGrad = ctx.createRadialGradient(
          (leftEyeX + 4) * BLOCK_SIZE, (eyeY + 3) * BLOCK_SIZE, 2,
          (leftEyeX + 4) * BLOCK_SIZE, (eyeY + 3) * BLOCK_SIZE, 16
        );
        mystGrad.addColorStop(0, this.lighten(color, 0.4));
        mystGrad.addColorStop(0.5, color);
        mystGrad.addColorStop(1, this.darken(color, 0.4));
        ctx.fillStyle = mystGrad;
        ctx.fillRect(leftEyeX * BLOCK_SIZE, eyeY * BLOCK_SIZE, eyeW * BLOCK_SIZE, eyeH * BLOCK_SIZE);
        ctx.fillRect(rightEyeX * BLOCK_SIZE, eyeY * BLOCK_SIZE, eyeW * BLOCK_SIZE, eyeH * BLOCK_SIZE);
        // Pupil
        this.rect(leftEyeX + 3, eyeY + 2, 2, 3, "#000000");
        this.rect(rightEyeX + 4, eyeY + 2, 2, 3, "#000000");
        // Glowing ring
        ctx.save();
        ctx.strokeStyle = "rgba(255,255,255,0.8)";
        ctx.lineWidth = PX;
        ctx.beginPath();
        ctx.arc((leftEyeX + 4) * BLOCK_SIZE, (eyeY + 3) * BLOCK_SIZE, 14, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc((rightEyeX + 4) * BLOCK_SIZE, (eyeY + 3) * BLOCK_SIZE, 14, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        // Sparkles
        this.px(leftEyeX + 5, eyeY + 2, "#FFFFFF");
        this.px(rightEyeX + 6, eyeY + 2, "#FFFFFF");
        break;

      case "cyber":
        // Cybernetic eye
        ctx.save();
        const cyberGrad = ctx.createLinearGradient(leftEyeX * BLOCK_SIZE, eyeY * BLOCK_SIZE, (leftEyeX + eyeW) * BLOCK_SIZE, (eyeY + eyeH) * BLOCK_SIZE);
        cyberGrad.addColorStop(0, "#00FFFF");
        cyberGrad.addColorStop(0.5, "#0088FF");
        cyberGrad.addColorStop(1, "#0044AA");
        ctx.fillStyle = cyberGrad;
        ctx.fillRect(leftEyeX * BLOCK_SIZE, eyeY * BLOCK_SIZE, eyeW * BLOCK_SIZE, eyeH * BLOCK_SIZE);
        ctx.fillRect(rightEyeX * BLOCK_SIZE, eyeY * BLOCK_SIZE, eyeW * BLOCK_SIZE, eyeH * BLOCK_SIZE);
        // Scan lines
        for (let i = 0; i < 4; i++) {
          ctx.fillStyle = "rgba(0,0,30,0.3)";
          ctx.fillRect(leftEyeX * BLOCK_SIZE, (eyeY + i * 2) * BLOCK_SIZE, eyeW * BLOCK_SIZE, 2);
          ctx.fillRect(rightEyeX * BLOCK_SIZE, (eyeY + i * 2) * BLOCK_SIZE, eyeW * BLOCK_SIZE, 2);
        }
        // Pupil crosshair
        ctx.strokeStyle = "#00FFFF";
        ctx.lineWidth = PX;
        ctx.beginPath();
        ctx.moveTo((leftEyeX + 4) * BLOCK_SIZE, eyeY * BLOCK_SIZE);
        ctx.lineTo((leftEyeX + 4) * BLOCK_SIZE, (eyeY + eyeH) * BLOCK_SIZE);
        ctx.moveTo(leftEyeX * BLOCK_SIZE, (eyeY + 3) * BLOCK_SIZE);
        ctx.lineTo((leftEyeX + eyeW) * BLOCK_SIZE, (eyeY + 3) * BLOCK_SIZE);
        ctx.stroke();
        // Glow
        ctx.shadowColor = "#00FFFF";
        ctx.shadowBlur = 12 * PX;
        this.px(leftEyeX + 4, eyeY + 3, "#00FFFF");
        this.px(rightEyeX + 4, eyeY + 3, "#00FFFF");
        ctx.shadowBlur = 0;
        ctx.restore();
        break;

      case "dragon":
        // Reptilian eye
        this.rect(leftEyeX, eyeY, eyeW, eyeH, color);
        this.rect(rightEyeX, eyeY, eyeW, eyeH, color);
        // Vertical slit pupil
        this.rect(leftEyeX + 3, eyeY, 2, eyeH, "#000000");
        this.rect(rightEyeX + 3, eyeY, 2, eyeH, "#000000");
        // Iris glow
        this.rect(leftEyeX + 1, eyeY + 2, 2, 3, this.lighten(color, 0.3));
        this.rect(rightEyeX + 5, eyeY + 2, 2, 3, this.lighten(color, 0.3));
        // Eye ridge shadow
        this.rect(leftEyeX - 1, eyeY - 1, eyeW + 2, 2, this.darken(color, 0.4));
        this.rect(rightEyeX - 1, eyeY - 1, eyeW + 2, 2, this.darken(color, 0.4));
        break;

      case "galaxy": {
        ctx.save();
        // Galaxy gradient iris
        const gEyeL = ctx.createRadialGradient(
          (leftEyeX + 4) * BLOCK_SIZE, (eyeY + 3) * BLOCK_SIZE, 0,
          (leftEyeX + 4) * BLOCK_SIZE, (eyeY + 3) * BLOCK_SIZE, 18
        );
        gEyeL.addColorStop(0, "#FFFFFF");
        gEyeL.addColorStop(0.15, "#E0C3FC");
        gEyeL.addColorStop(0.4, "#6A0DAD");
        gEyeL.addColorStop(0.7, "#1A0A3E");
        gEyeL.addColorStop(1, "#000033");
        ctx.fillStyle = gEyeL;
        ctx.fillRect(leftEyeX * BLOCK_SIZE, eyeY * BLOCK_SIZE, eyeW * BLOCK_SIZE, eyeH * BLOCK_SIZE);

        const gEyeR = ctx.createRadialGradient(
          (rightEyeX + 4) * BLOCK_SIZE, (eyeY + 3) * BLOCK_SIZE, 0,
          (rightEyeX + 4) * BLOCK_SIZE, (eyeY + 3) * BLOCK_SIZE, 18
        );
        gEyeR.addColorStop(0, "#FFFFFF");
        gEyeR.addColorStop(0.15, "#E0C3FC");
        gEyeR.addColorStop(0.4, "#6A0DAD");
        gEyeR.addColorStop(0.7, "#1A0A3E");
        gEyeR.addColorStop(1, "#000033");
        ctx.fillStyle = gEyeR;
        ctx.fillRect(rightEyeX * BLOCK_SIZE, eyeY * BLOCK_SIZE, eyeW * BLOCK_SIZE, eyeH * BLOCK_SIZE);

        // Star specks in iris
        for (let i = 0; i < 6; i++) {
          const sx = leftEyeX + 1 + rng() * 6;
          const sy = eyeY + 1 + rng() * 5;
          ctx.fillStyle = `rgba(255,255,255,${rng() * 0.7 + 0.3})`;
          ctx.beginPath();
          ctx.arc(sx * BLOCK_SIZE, sy * BLOCK_SIZE, 1, 0, Math.PI * 2);
          ctx.fill();
        }
        // Central bright point
        this.px(leftEyeX + 3, eyeY + 2, "#FFFFFF");
        this.px(rightEyeX + 5, eyeY + 2, "#FFFFFF");
        ctx.restore();
        break; }

      case "void":
        this.rect(leftEyeX, eyeY, eyeW, eyeH, "#050510");
        this.rect(rightEyeX, eyeY, eyeW, eyeH, "#050510");
        // Single white dot pupil
        this.px(leftEyeX + 3, eyeY + 3, "#FFFFFF");
        this.px(rightEyeX + 4, eyeY + 3, "#FFFFFF");
        // Dark aura
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = "#050510";
        ctx.beginPath();
        ctx.arc((leftEyeX + 4) * BLOCK_SIZE, (eyeY + 3) * BLOCK_SIZE, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc((rightEyeX + 4) * BLOCK_SIZE, (eyeY + 3) * BLOCK_SIZE, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        break;
    }

    // === RARITY TIER VISUAL ENHANCEMENTS: Eye glow overlays ===
    if (rm >= 0.35) {
      // Rare+ : iris glow overlay
      ctx.save();
      ctx.globalAlpha = rm * 0.2;
      const irisGlow = ctx.createRadialGradient(
        (leftEyeX + 4) * BLOCK_SIZE, (eyeY + 3) * BLOCK_SIZE, 1 * PX,
        (leftEyeX + 4) * BLOCK_SIZE, (eyeY + 3) * BLOCK_SIZE, 5 * PX
      );
      irisGlow.addColorStop(0, rarityAccent);
      irisGlow.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = irisGlow;
      ctx.fillRect((leftEyeX + 1) * BLOCK_SIZE, (eyeY + 1) * BLOCK_SIZE, 7 * BLOCK_SIZE, 6 * BLOCK_SIZE);
      // Right eye glow
      const irisGlowR = ctx.createRadialGradient(
        (rightEyeX + 4) * BLOCK_SIZE, (eyeY + 3) * BLOCK_SIZE, 1 * PX,
        (rightEyeX + 4) * BLOCK_SIZE, (eyeY + 3) * BLOCK_SIZE, 5 * PX
      );
      irisGlowR.addColorStop(0, rarityAccent);
      irisGlowR.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = irisGlowR;
      ctx.fillRect((rightEyeX + 1) * BLOCK_SIZE, (eyeY + 1) * BLOCK_SIZE, 7 * BLOCK_SIZE, 6 * BLOCK_SIZE);
      ctx.restore();
    }

    if (rm >= 0.7) {
      // Epic+ : enhanced sparkle reflections
      ctx.save();
      ctx.globalAlpha = (rm - 0.7) * 0.6;
      for (let i = 0; i < 3; i++) {
        const sx = leftEyeX + 2 + Math.sin(seed + i * 4.1) * 3;
        const sy = eyeY + 2 + Math.cos(seed + i * 2.3) * 2;
        ctx.beginPath();
        ctx.arc(sx * BLOCK_SIZE, sy * BLOCK_SIZE, 1.5 * PX, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        const sx2 = rightEyeX + 2 + Math.sin(seed + i * 3.7) * 3;
        ctx.beginPath();
        ctx.arc(sx2 * BLOCK_SIZE, sy * BLOCK_SIZE, 1.5 * PX, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    if (rm >= 1.0) {
      // Legendary: prismatic eye sheen
      ctx.save();
      ctx.globalAlpha = 0.1;
      const prismGrad = ctx.createLinearGradient(leftEyeX * BLOCK_SIZE, eyeY * BLOCK_SIZE, rightEyeX * BLOCK_SIZE, (eyeY + eyeH) * BLOCK_SIZE);
      prismGrad.addColorStop(0, '#FF0000');
      prismGrad.addColorStop(0.25, '#FF8C00');
      prismGrad.addColorStop(0.5, '#FFD700');
      prismGrad.addColorStop(0.75, '#00FF00');
      prismGrad.addColorStop(1, '#8B00FF');
      ctx.fillStyle = prismGrad;
      ctx.fillRect((leftEyeX - 1) * BLOCK_SIZE, eyeY * BLOCK_SIZE, (eyeW + 2) * BLOCK_SIZE, eyeH * BLOCK_SIZE);
      ctx.fillRect((rightEyeX - 1) * BLOCK_SIZE, eyeY * BLOCK_SIZE, (eyeW + 2) * BLOCK_SIZE, eyeH * BLOCK_SIZE);
      ctx.restore();
      // Gold sparkle dots
      ctx.save();
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = '#FFD700';
      for (let i = 0; i < 4; i++) {
        const gkx = 38 + Math.sin(seed + i * 5.3) * 18;
        const gky = 32 + Math.cos(seed + i * 3.1) * 4;
        ctx.beginPath();
        ctx.arc(gkx * PX, gky * PX, 1 * PX, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // === MOUTH (enhanced) ===
  drawMouth(trait) {
    const mouthY = 44;
    const mouthX = 44;
    const ctx = this.ctx;

    switch (trait.value) {
      case "smirk":
        this.rect(mouthX, mouthY, 4, 1, "#8B4513");
        this.rect(mouthX + 4, mouthY - 1, 1, 1, "#8B4513");
        this.px(mouthX + 1, mouthY + 1, "rgba(139,69,19,0.3)");
        break;
      case "grin":
        this.rect(mouthX, mouthY, 8, 1, "#8B4513");
        this.rect(mouthX + 1, mouthY + 1, 6, 1, "#FFFFFF");
        this.rect(mouthX + 2, mouthY + 1, 1, 1, "#F5F5F5");
        this.rect(mouthX, mouthY + 2, 8, 1, "#8B4513");
        break;
      case "neutral":
        this.rect(mouthX + 1, mouthY, 6, 1, "#8B4513");
        this.px(mouthX + 2, mouthY + 1, "rgba(139,69,19,0.2)");
        break;
      case "pout":
        this.rect(mouthX + 1, mouthY, 6, 1, "#8B4513");
        this.rect(mouthX + 2, mouthY + 1, 4, 1, "#FF6B6B");
        this.px(mouthX + 3, mouthY + 2, "rgba(255,107,107,0.5)");
        break;
      case "teeth":
        this.rect(mouthX, mouthY, 8, 2, "#8B4513");
        this.rect(mouthX + 1, mouthY, 6, 1, "#FFFFFF");
        this.rect(mouthX + 2, mouthY, 1, 1, "#F0F0F0");
        break;
      case "smoke":
        this.rect(mouthX, mouthY, 3, 1, "#8B4513");
        // Smoke wisps
        ctx.save();
        ctx.globalAlpha = 0.4;
        for (let i = 0; i < 4; i++) {
          const wx = (mouthX + 5 + i * 2) * BLOCK_SIZE;
          const wy = (mouthY - 2 - i * 2) * BLOCK_SIZE;
          const wr = 4 + i * 3;
          const grad = ctx.createRadialGradient(wx, wy, 0, wx, wy, wr);
          grad.addColorStop(0, "rgba(200,200,210,0.4)");
          grad.addColorStop(1, "rgba(200,200,210,0)");
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(wx, wy, wr, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
        break;
      case "fang":
        this.rect(mouthX, mouthY, 8, 2, "#8B4513");
        this.rect(mouthX + 1, mouthY, 2, 1, "#FFFFFF");
        this.rect(mouthX + 5, mouthY, 2, 1, "#FFFFFF");
        // Fang tips
        this.px(mouthX + 1, mouthY + 2, "#FFFFFF");
        this.px(mouthX + 5, mouthY + 2, "#FFFFFF");
        break;
      case "lollipop":
        this.rect(mouthX, mouthY, 3, 1, "#8B4513");
        // Stick
        ctx.fillStyle = "#DEB887";
        ctx.fillRect((mouthX + 4) * BLOCK_SIZE, (mouthY - 1) * BLOCK_SIZE, 2 * PX, 10 * PX);
        // Candy
        const candyGrad = ctx.createRadialGradient(
          (mouthX + 5) * BLOCK_SIZE, (mouthY - 3) * BLOCK_SIZE, 0,
          (mouthX + 5) * BLOCK_SIZE, (mouthY - 3) * BLOCK_SIZE, 8
        );
        candyGrad.addColorStop(0, "#FF69B4");
        candyGrad.addColorStop(0.5, "#FF1493");
        candyGrad.addColorStop(1, "#C71585");
        ctx.fillStyle = candyGrad;
        ctx.beginPath();
        ctx.arc((mouthX + 5) * BLOCK_SIZE, (mouthY - 3) * BLOCK_SIZE, 7, 0, Math.PI * 2);
        ctx.fill();
        // Swirl
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = PX;
        ctx.beginPath();
        ctx.arc((mouthX + 5) * BLOCK_SIZE, (mouthY - 3) * BLOCK_SIZE, 4, 0, Math.PI * 1.5);
        ctx.stroke();
        break;
      case "grill":
        this.rect(mouthX, mouthY, 8, 2, "#8B4513");
        // Gold grill
        ctx.fillStyle = "#FFD700";
        ctx.fillRect((mouthX + 1) * BLOCK_SIZE, mouthY * BLOCK_SIZE, 6 * BLOCK_SIZE, 2 * BLOCK_SIZE);
        // Grill lines
        ctx.strokeStyle = "#DAA520";
        ctx.lineWidth = PX;
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.moveTo((mouthX + 1 + i * 2) * BLOCK_SIZE, mouthY * BLOCK_SIZE);
          ctx.lineTo((mouthX + 1 + i * 2) * BLOCK_SIZE, (mouthY + 2) * BLOCK_SIZE);
          ctx.stroke();
        }
        break;
      case "void":
        this.rect(mouthX + 1, mouthY, 6, 2, "#050510");
        this.rect(mouthX + 2, mouthY + 2, 4, 1, "#050510");
        break;
    }
  }

  // === OUTFIT (enhanced with textures and details) ===
  drawOutfit(style, color, seed, rarityName) {
    const bodyY = 58;
    const bodyX = 30;
    const ctx = this.ctx;
    const rng = seededRandom(seed + 2000);
    const outfitShadow = this.darken(color, 0.15);
    const outfitHighlight = this.lighten(color, 0.15);
    const rn = rarityName || 'common';
    const rm = this.getRarityMultiplier(rn);
    const rarityAccent = this.getRarityAccentColor(rn);
    const rarityAccentRGB = rarityAccent ? this._hexToRGB(rarityAccent) : null;

    switch (style.value) {
      case "tee":
        this.rect(bodyX, bodyY, 40, 30, color);
        // Collar
        this.rect(bodyX + 13, bodyY - 1, 14, 3, this.darken(color, 0.2));
        this.rect(bodyX + 14, bodyY + 1, 12, 2, this.darken(color, 0.1));
        // Shirt shadow
        this.rect(bodyX, bodyY + 26, 40, 4, outfitShadow);
        // Sleeve lines
        this.rect(bodyX + 2, bodyY + 2, 2, 24, outfitShadow);
        this.rect(bodyX + 36, bodyY + 2, 2, 24, outfitShadow);
        // Fabric fold lines
        this.rect(bodyX + 8, bodyY + 6, 2, 18, this.darken(color, 0.06));
        this.rect(bodyX + 30, bodyY + 6, 2, 18, this.darken(color, 0.06));
        // Center highlight
        this.rect(bodyX + 16, bodyY + 4, 8, 14, outfitHighlight);
        break;

      case "hoodie":
        this.rect(bodyX - 3, bodyY, 46, 32, color);
        // Hood
        this.rect(bodyX + 10, bodyY - 3, 20, 8, color);
        this.rect(bodyX + 8, bodyY - 1, 24, 4, outfitShadow);
        // Hood inner shadow
        this.rect(bodyX + 12, bodyY - 2, 16, 3, this.darken(color, 0.12));
        // Pocket
        this.rect(bodyX + 10, bodyY + 16, 20, 10, outfitShadow);
        this.rect(bodyX + 12, bodyY + 18, 16, 6, this.darken(color, 0.08));
        // Pocket opening
        this.rect(bodyX + 14, bodyY + 16, 12, 1, this.darken(color, 0.18));
        // Drawstrings
        this.rect(bodyX + 17, bodyY + 5, 1, 10, "#FFFFFF");
        this.rect(bodyX + 22, bodyY + 5, 1, 10, "#FFFFFF");
        this.px(bodyX + 17, bodyY + 15, "#FFFFFF");
        this.px(bodyX + 22, bodyY + 15, "#FFFFFF");
        // Fabric folds
        this.rect(bodyX + 5, bodyY + 8, 2, 16, this.darken(color, 0.06));
        this.rect(bodyX + 33, bodyY + 8, 2, 16, this.darken(color, 0.06));
        // Center highlight
        this.rect(bodyX + 16, bodyY + 4, 10, 12, outfitHighlight);
        // Shadow
        this.rect(bodyX - 2, bodyY + 28, 44, 4, outfitShadow);
        break;

      case "tank":
        this.rect(bodyX + 5, bodyY, 30, 30, color);
        // Straps
        this.rect(bodyX + 2, bodyY, 6, 6, color);
        this.rect(bodyX + 32, bodyY, 6, 6, color);
        // Collar detail
        this.rect(bodyX + 12, bodyY - 1, 16, 3, outfitShadow);
        // Shadow
        this.rect(bodyX + 5, bodyY + 26, 30, 4, outfitShadow);
        // Muscle definition shadow
        this.rect(bodyX + 14, bodyY + 8, 12, 2, outfitShadow);
        break;

      case "jacket":
        this.rect(bodyX - 3, bodyY, 46, 32, color);
        // Collar
        this.rect(bodyX + 4, bodyY - 3, 14, 5, color);
        this.rect(bodyX + 22, bodyY - 3, 14, 5, color);
        this.rect(bodyX + 6, bodyY - 2, 10, 3, outfitHighlight);
        this.rect(bodyX + 24, bodyY - 2, 10, 3, outfitHighlight);
        // Zipper
        ctx.fillStyle = "#C0C0C0";
        ctx.fillRect((bodyX + 19) * BLOCK_SIZE, bodyY * BLOCK_SIZE, 2 * BLOCK_SIZE, 30 * BLOCK_SIZE);
        // Zipper teeth
        for (let i = 0; i < 15; i++) {
          this.px(bodyX + 19, bodyY + i * 2, "#DAA520");
          this.px(bodyX + 20, bodyY + i * 2, "#DAA520");
        }
        // Pockets
        this.rect(bodyX + 4, bodyY + 18, 12, 8, outfitShadow);
        this.rect(bodyX + 24, bodyY + 18, 12, 8, outfitShadow);
        // Shadow
        this.rect(bodyX - 2, bodyY + 28, 44, 4, outfitShadow);
        break;

      case "kimono":
        this.rect(bodyX - 3, bodyY, 46, 34, color);
        // Cross front
        ctx.strokeStyle = this.darken(color, 0.2);
        ctx.lineWidth = 2 * PX;
        ctx.beginPath();
        ctx.moveTo((bodyX + 5) * BLOCK_SIZE, bodyY * BLOCK_SIZE);
        ctx.lineTo((bodyX + 22) * BLOCK_SIZE, (bodyY + 30) * BLOCK_SIZE);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo((bodyX + 35) * BLOCK_SIZE, bodyY * BLOCK_SIZE);
        ctx.lineTo((bodyX + 18) * BLOCK_SIZE, (bodyY + 30) * BLOCK_SIZE);
        ctx.stroke();
        // Inner layer
        this.rect(bodyX + 14, bodyY + 1, 12, 6, "#FFFFFF");
        // Obi belt
        this.rect(bodyX - 1, bodyY + 16, 42, 5, "#DAA520");
        this.rect(bodyX + 1, bodyY + 17, 38, 3, "#C9960E");
        // Belt pattern
        for (let i = 0; i < 8; i++) {
          this.px(bodyX + 3 + i * 5, bodyY + 18, "#FFD700");
        }
        // Fabric folds
        this.rect(bodyX + 2, bodyY + 22, 3, 10, outfitShadow);
        this.rect(bodyX + 35, bodyY + 22, 3, 10, outfitShadow);
        break;

      case "leather":
        this.rect(bodyX - 3, bodyY, 46, 32, color);
        // Leather texture
        for (let i = 0; i < 6; i++) {
          this.rect(bodyX + 2 + i * 7, bodyY + 4, 5, 1, outfitHighlight);
        }
        // Zipper
        ctx.fillStyle = "#C0C0C0";
        ctx.fillRect((bodyX + 19) * BLOCK_SIZE, (bodyY + 4) * BLOCK_SIZE, 2 * BLOCK_SIZE, 26 * BLOCK_SIZE);
        // Buckles
        this.rect(bodyX + 6, bodyY + 6, 8, 3, "#DAA520");
        this.rect(bodyX + 26, bodyY + 6, 8, 3, "#DAA520");
        this.px(bodyX + 9, bodyY + 7, "#FFD700");
        this.px(bodyX + 29, bodyY + 7, "#FFD700");
        // Collar
        this.rect(bodyX + 8, bodyY - 2, 8, 4, outfitShadow);
        this.rect(bodyX + 24, bodyY - 2, 8, 4, outfitShadow);
        // Shadow
        this.rect(bodyX - 2, bodyY + 28, 44, 4, outfitShadow);
        break;

      case "suit":
        this.rect(bodyX - 3, bodyY, 46, 32, color);
        // Lapels
        ctx.fillStyle = outfitHighlight;
        ctx.beginPath();
        ctx.moveTo((bodyX + 8) * BLOCK_SIZE, bodyY * BLOCK_SIZE);
        ctx.lineTo((bodyX + 18) * BLOCK_SIZE, (bodyY + 16) * BLOCK_SIZE);
        ctx.lineTo((bodyX + 4) * BLOCK_SIZE, (bodyY + 16) * BLOCK_SIZE);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo((bodyX + 32) * BLOCK_SIZE, bodyY * BLOCK_SIZE);
        ctx.lineTo((bodyX + 22) * BLOCK_SIZE, (bodyY + 16) * BLOCK_SIZE);
        ctx.lineTo((bodyX + 36) * BLOCK_SIZE, (bodyY + 16) * BLOCK_SIZE);
        ctx.fill();
        // Shirt
        this.rect(bodyX + 14, bodyY + 2, 12, 14, "#FFFFFF");
        // Tie
        this.rect(bodyX + 18, bodyY + 2, 4, 18, "#DC143C");
        this.rect(bodyX + 19, bodyY + 2, 2, 2, "#FF2020");
        // Buttons
        for (let i = 0; i < 4; i++) {
          this.px(bodyX + 20, bodyY + 8 + i * 4, "#1A1A2E");
        }
        // Shadow
        this.rect(bodyX - 2, bodyY + 28, 44, 4, outfitShadow);
        break;

      case "armor":
        this.rect(bodyX - 3, bodyY, 46, 32, "#4A4A5A");
        // Chest plates
        this.rect(bodyX + 4, bodyY + 4, 16, 12, "#5A5A6A");
        this.rect(bodyX + 20, bodyY + 4, 16, 12, "#5A5A6A");
        // Plate highlights
        this.rect(bodyX + 5, bodyY + 5, 14, 2, "#7A7A8A");
        this.rect(bodyX + 21, bodyY + 5, 14, 2, "#7A7A8A");
        // Belt
        this.rect(bodyX + 2, bodyY + 18, 36, 4, "#3A3A4A");
        // Belt buckle
        this.rect(bodyX + 17, bodyY + 18, 6, 4, "#DAA520");
        // Lower plate
        this.rect(bodyX + 2, bodyY + 24, 36, 6, "#4A4A5A");
        this.rect(bodyX + 3, bodyY + 25, 34, 2, "#5A5A6A");
        // Rivets
        const rivetPositions = [
          [6, 6], [32, 6], [6, 22], [32, 22],
          [14, 6], [24, 6], [14, 22], [24, 22]
        ];
        rivetPositions.forEach(([rx, ry]) => {
          this.px(bodyX + rx, bodyY + ry, "#DAA520");
          this.px(bodyX + rx + 1, bodyY + ry + 1, "#B8860B");
        });
        // Shadow
        this.rect(bodyX - 2, bodyY + 28, 44, 4, "#3A3A4A");
        break;

      case "dragonrobe":
        this.rect(bodyX - 5, bodyY, 50, 34, color);
        // Inner layer
        this.rect(bodyX + 10, bodyY + 2, 20, 8, this.darken(color, 0.3));
        // Dragon emblem (detailed)
        ctx.save();
        ctx.fillStyle = "#FFD700";
        ctx.shadowColor = "#FFD700";
        ctx.shadowBlur = 6 * PX;
        // Dragon body
        ctx.beginPath();
        ctx.moveTo((bodyX + 16) * BLOCK_SIZE, (bodyY + 18) * BLOCK_SIZE);
        ctx.bezierCurveTo(
          (bodyX + 20) * BLOCK_SIZE, (bodyY + 12) * BLOCK_SIZE,
          (bodyX + 28) * BLOCK_SIZE, (bodyY + 12) * BLOCK_SIZE,
          (bodyX + 24) * BLOCK_SIZE, (bodyY + 20) * BLOCK_SIZE
        );
        ctx.bezierCurveTo(
          (bodyX + 22) * BLOCK_SIZE, (bodyY + 26) * BLOCK_SIZE,
          (bodyX + 14) * BLOCK_SIZE, (bodyY + 26) * BLOCK_SIZE,
          (bodyX + 16) * BLOCK_SIZE, (bodyY + 18) * BLOCK_SIZE
        );
        ctx.fill();
        // Dragon eye
        this.px(bodyX + 19, bodyY + 16, "#FF0000");
        ctx.restore();
        // Gold sash
        this.rect(bodyX - 2, bodyY + 14, 44, 4, "#FFD700");
        this.rect(bodyX, bodyY + 15, 40, 2, "#C9960E");
        // Fabric flow
        this.rect(bodyX - 4, bodyY + 20, 4, 12, outfitShadow);
        this.rect(bodyX + 40, bodyY + 20, 4, 12, outfitShadow);
        break;

      case "celestial":
        this.rect(bodyX - 3, bodyY, 46, 34, color);
        // Star patterns with glow
        ctx.save();
        ctx.shadowColor = "#FFD700";
        ctx.shadowBlur = 4 * PX;
        for (let i = 0; i < 12; i++) {
          const sx = bodyX + 4 + Math.floor(rng() * 32);
          const sy = bodyY + 2 + Math.floor(rng() * 28);
          const starSize = rng() * 2 + 1;
          ctx.fillStyle = `rgba(255,215,0,${rng() * 0.5 + 0.5})`;
          ctx.beginPath();
          ctx.arc(sx * BLOCK_SIZE, sy * BLOCK_SIZE, starSize, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
        // Glowing trim
        ctx.save();
        ctx.shadowColor = "#FFD700";
        ctx.shadowBlur = 10 * PX;
        ctx.strokeStyle = "#FFD700";
        ctx.lineWidth = 2 * PX;
        ctx.strokeRect(bodyX * BLOCK_SIZE, bodyY * BLOCK_SIZE, 40 * BLOCK_SIZE, 32 * BLOCK_SIZE);
        // Inner trim
        ctx.strokeStyle = "rgba(255,215,0,0.3)";
        ctx.lineWidth = PX;
        ctx.strokeRect((bodyX + 2) * BLOCK_SIZE, (bodyY + 2) * BLOCK_SIZE, 36 * BLOCK_SIZE, 28 * BLOCK_SIZE);
        ctx.restore();
        // Collar glow
        ctx.save();
        ctx.shadowColor = "#FFD700";
        ctx.shadowBlur = 8 * PX;
        ctx.fillStyle = "#FFD700";
        ctx.fillRect((bodyX + 14) * BLOCK_SIZE, (bodyY - 1) * BLOCK_SIZE, 12 * BLOCK_SIZE, 3 * BLOCK_SIZE);
        ctx.restore();
        break;
    }

    // === GLOBAL OUTFIT TEXTURE ENHANCEMENT ===
    // Add subtle fabric fold lines for texture
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.strokeStyle = outfitShadow;
    ctx.lineWidth = PX * 0.6;
    for (let i = 0; i < 6; i++) {
      const foldX = bodyX + 4 + rng() * 32;
      const foldY = bodyY + 2 + rng() * 24;
      const foldH = 6 + rng() * 12;
      ctx.beginPath();
      ctx.moveTo(foldX * BLOCK_SIZE, foldY * BLOCK_SIZE);
      ctx.lineTo(foldX * BLOCK_SIZE + (rng() - 0.5) * 8, (foldY + foldH) * BLOCK_SIZE);
      ctx.stroke();
    }
    ctx.restore();

    // === Rarity-tier outfit enhancements ===
    if (rm > 0 && rarityAccentRGB) {
      ctx.save();
      // 3D depth overlay for Rare+
      const depthGrad = ctx.createLinearGradient(
        bodyX * BLOCK_SIZE, bodyY * BLOCK_SIZE,
        (bodyX + 40) * BLOCK_SIZE, (bodyY + 30) * BLOCK_SIZE
      );
      depthGrad.addColorStop(0, `rgba(${rarityAccentRGB.r}, ${rarityAccentRGB.g}, ${rarityAccentRGB.b}, ${0.08 * rm})`);
      depthGrad.addColorStop(0.5, `rgba(${rarityAccentRGB.r}, ${rarityAccentRGB.g}, ${rarityAccentRGB.b}, ${0.03 * rm})`);
      depthGrad.addColorStop(1, `rgba(0, 0, 0, ${0.12 * rm})`);
      ctx.fillStyle = depthGrad;
      ctx.fillRect(bodyX * BLOCK_SIZE, bodyY * BLOCK_SIZE, 40 * BLOCK_SIZE, 30 * BLOCK_SIZE);
      ctx.restore();
    }
    if (rm >= 0.7 && rarityAccentRGB) {
      // Metallic shimmer band for Epic+
      ctx.save();
      ctx.globalAlpha = 0.18;
      for (let i = 0; i < 3; i++) {
        const bandY = bodyY + 8 + i * 6;
        ctx.strokeStyle = `rgba(${rarityAccentRGB.r}, ${rarityAccentRGB.g}, ${rarityAccentRGB.b}, 0.6)`;
        ctx.lineWidth = 1.5 * PX;
        ctx.shadowColor = `rgb(${rarityAccentRGB.r}, ${rarityAccentRGB.g}, ${rarityAccentRGB.b})`;
        ctx.shadowBlur = 4 * PX;
        ctx.beginPath();
        ctx.moveTo((bodyX + 2) * BLOCK_SIZE, bandY * BLOCK_SIZE);
        ctx.lineTo((bodyX + 38) * BLOCK_SIZE, bandY * BLOCK_SIZE);
        ctx.stroke();
      }
      ctx.restore();
      // Fabric sheen for Legendary
      if (rn === "Legendary") {
        ctx.save();
        ctx.globalAlpha = 0.12;
        const sheenGrad = ctx.createLinearGradient(
          bodyX * BLOCK_SIZE, bodyY * BLOCK_SIZE,
          (bodyX + 40) * BLOCK_SIZE, (bodyY + 10) * BLOCK_SIZE
        );
        sheenGrad.addColorStop(0, "rgba(255, 215, 0, 0)");
        sheenGrad.addColorStop(0.4, "rgba(255, 215, 0, 0.5)");
        sheenGrad.addColorStop(0.6, "rgba(255, 255, 255, 0.6)");
        sheenGrad.addColorStop(1, "rgba(255, 215, 0, 0)");
        ctx.fillStyle = sheenGrad;
        ctx.fillRect(bodyX * BLOCK_SIZE, bodyY * BLOCK_SIZE, 40 * BLOCK_SIZE, 30 * BLOCK_SIZE);
        ctx.restore();
      }
    }
  }

  // === ACCESSORIES (enhanced) ===
  drawAccessory(trait, seed) {
    const rng = seededRandom(seed + 3000);
    const headX = 32;
    const headY = 18;
    const headW = 36;
    const ctx = this.ctx;

    switch (trait.value) {
      case "glasses":
        ctx.save();
        ctx.strokeStyle = "#C0C0C0";
        ctx.lineWidth = 2 * PX;
        // Left lens
        ctx.strokeRect(36 * BLOCK_SIZE, 31 * BLOCK_SIZE, 10 * BLOCK_SIZE, 7 * BLOCK_SIZE);
        // Right lens
        ctx.strokeRect(52 * BLOCK_SIZE, 31 * BLOCK_SIZE, 10 * BLOCK_SIZE, 7 * BLOCK_SIZE);
        // Bridge
        ctx.beginPath();
        ctx.moveTo(46 * BLOCK_SIZE, 34 * BLOCK_SIZE);
        ctx.lineTo(52 * BLOCK_SIZE, 34 * BLOCK_SIZE);
        ctx.stroke();
        // Arms
        ctx.beginPath();
        ctx.moveTo(36 * BLOCK_SIZE, 34 * BLOCK_SIZE);
        ctx.lineTo(32 * BLOCK_SIZE, 33 * BLOCK_SIZE);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(62 * BLOCK_SIZE, 34 * BLOCK_SIZE);
        ctx.lineTo(66 * BLOCK_SIZE, 33 * BLOCK_SIZE);
        ctx.stroke();
        // Lens reflection
        ctx.fillStyle = "rgba(255,255,255,0.15)";
        ctx.fillRect(38 * BLOCK_SIZE, 32 * BLOCK_SIZE, 3 * BLOCK_SIZE, 2 * BLOCK_SIZE);
        ctx.fillRect(54 * BLOCK_SIZE, 32 * BLOCK_SIZE, 3 * BLOCK_SIZE, 2 * BLOCK_SIZE);
        ctx.restore();
        break;

      case "headband":
        this.rect(headX - 3, headY + 8, headW + 6, 4, "#DC143C");
        // Headband detail
        this.rect(headX - 2, headY + 9, headW + 4, 1, "#FF2020");
        // Knot
        this.rect(headX + headW + 1, headY + 7, 6, 3, "#DC143C");
        this.rect(headX + headW + 3, headY + 10, 4, 6, "#DC143C");
        break;

      case "bandana":
        this.rect(headX - 3, headY + 6, headW + 6, 5, "#1E90FF");
        // Pattern
        for (let i = 0; i < 8; i++) {
          this.px(headX + i * 4 + 1, headY + 7, "#4169E1");
        }
        // Knot at back
        this.rect(headX + headW, headY + 5, 8, 4, "#1E90FF");
        this.rect(headX + headW + 4, headY + 9, 6, 10, "#1E90FF");
        this.rect(headX + headW + 2, headY + 17, 6, 8, "#1565C0");
        break;

      case "chain":
        ctx.save();
        ctx.strokeStyle = "#FFD700";
        ctx.lineWidth = 2 * PX;
        ctx.shadowColor = "#FFD700";
        ctx.shadowBlur = 3 * PX;
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
          const x = (headX + 12 + i * 3) * BLOCK_SIZE;
          const y = (57 + Math.sin(i * 0.7) * 2) * BLOCK_SIZE;
          ctx.moveTo(x + 3, y);
          ctx.arc(x, y, 4, 0, Math.PI * 2);
        }
        ctx.stroke();
        // Pendant
        ctx.fillStyle = "#FFD700";
        ctx.beginPath();
        ctx.arc((headX + 24) * BLOCK_SIZE, 62 * BLOCK_SIZE, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#DC143C";
        ctx.beginPath();
        ctx.arc((headX + 24) * BLOCK_SIZE, 62 * BLOCK_SIZE, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        break;

      case "earbuds":
        // Earbuds
        ctx.save();
        ctx.fillStyle = "#FFFFFF";
        ctx.shadowColor = "#FFFFFF";
        ctx.shadowBlur = 4 * PX;
        ctx.beginPath();
        ctx.arc(32 * BLOCK_SIZE, 35 * BLOCK_SIZE, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(66 * BLOCK_SIZE, 35 * BLOCK_SIZE, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        // Wires
        ctx.strokeStyle = "#E0E0E0";
        ctx.lineWidth = 1.5 * PX;
        ctx.beginPath();
        ctx.moveTo(32 * BLOCK_SIZE, 38 * BLOCK_SIZE);
        ctx.quadraticCurveTo(38 * BLOCK_SIZE, 48 * BLOCK_SIZE, 44 * BLOCK_SIZE, 58 * BLOCK_SIZE);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(66 * BLOCK_SIZE, 38 * BLOCK_SIZE);
        ctx.quadraticCurveTo(60 * BLOCK_SIZE, 48 * BLOCK_SIZE, 54 * BLOCK_SIZE, 58 * BLOCK_SIZE);
        ctx.stroke();
        break;

      case "mask":
        // Face mask
        this.rect(headX + 6, headY + 14, 24, 12, "#1A1A2E");
        this.rect(headX + 8, headY + 15, 20, 10, "#252540");
        // Mask details
        this.rect(headX + 12, headY + 16, 6, 4, "#DC143C");
        this.rect(headX + 20, headY + 16, 6, 4, "#DC143C");
        // Eye holes
        this.rect(headX + 10, headY + 17, 4, 2, "#0A0A15");
        this.rect(headX + 22, headY + 17, 4, 2, "#0A0A15");
        // Mask strap
        this.rect(headX + 4, headY + 18, 4, 2, "#333355");
        this.rect(headX + 28, headY + 18, 4, 2, "#333355");
        break;

      case "horns":
        ctx.save();
        // Left horn
        const hornGrad1 = ctx.createLinearGradient(
          (headX + 2) * BLOCK_SIZE, (headY + 10) * BLOCK_SIZE,
          (headX - 8) * BLOCK_SIZE, (headY - 4) * BLOCK_SIZE
        );
        hornGrad1.addColorStop(0, "#8B0000");
        hornGrad1.addColorStop(0.5, "#B22222");
        hornGrad1.addColorStop(1, "#DC143C");
        ctx.fillStyle = hornGrad1;
        ctx.beginPath();
        ctx.moveTo((headX + 4) * BLOCK_SIZE, (headY + 10) * BLOCK_SIZE);
        ctx.lineTo((headX - 8) * BLOCK_SIZE, (headY - 6) * BLOCK_SIZE);
        ctx.lineTo((headX + 8) * BLOCK_SIZE, (headY + 10) * BLOCK_SIZE);
        ctx.fill();
        // Right horn
        const hornGrad2 = ctx.createLinearGradient(
          (headX + headW - 4) * BLOCK_SIZE, (headY + 10) * BLOCK_SIZE,
          (headX + headW + 8) * BLOCK_SIZE, (headY - 4) * BLOCK_SIZE
        );
        hornGrad2.addColorStop(0, "#8B0000");
        hornGrad2.addColorStop(0.5, "#B22222");
        hornGrad2.addColorStop(1, "#DC143C");
        ctx.fillStyle = hornGrad2;
        ctx.beginPath();
        ctx.moveTo((headX + headW - 6) * BLOCK_SIZE, (headY + 10) * BLOCK_SIZE);
        ctx.lineTo((headX + headW + 8) * BLOCK_SIZE, (headY - 6) * BLOCK_SIZE);
        ctx.lineTo((headX + headW - 2) * BLOCK_SIZE, (headY + 10) * BLOCK_SIZE);
        ctx.fill();
        // Horn ridges
        ctx.strokeStyle = "rgba(0,0,0,0.3)";
        ctx.lineWidth = PX;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo((headX + 2 + i) * BLOCK_SIZE, (headY + 6 - i * 3) * BLOCK_SIZE);
          ctx.lineTo((headX + 6 + i) * BLOCK_SIZE, (headY + 6 - i * 3) * BLOCK_SIZE);
          ctx.stroke();
        }
        ctx.restore();
        break;

      case "crown":
        ctx.save();
        ctx.shadowColor = "#FFD700";
        ctx.shadowBlur = 8 * PX;
        // Crown base
        this.rect(headX + 1, headY - 8, headW - 2, 6, "#FFD700");
        this.rect(headX + 3, headY - 7, headW - 6, 4, "#C9960E");
        // Crown points
        const pointPositions = [4, 12, 20, 28, 34];
        pointPositions.forEach((px2, i) => {
          const pointH = rng() * 8 + 10;
          this.rect(headX + px2, headY - 8 - pointH, 5, pointH, "#FFD700");
          this.rect(headX + px2 + 1, headY - 8 - pointH, 2, pointH, "#FFF8DC");
        });
        // Gems
        this.px(headX + 6, headY - 6, "#DC143C");
        this.px(headX + 14, headY - 6, "#1E90FF");
        this.px(headX + 22, headY - 6, "#228B22");
        this.px(headX + 30, headY - 6, "#FFD700");
        ctx.restore();
        break;

      case "halo":
        ctx.save();
        ctx.shadowColor = "#FFD700";
        ctx.shadowBlur = 20 * PX;
        ctx.strokeStyle = "#FFD700";
        ctx.lineWidth = 3 * PX;
        ctx.beginPath();
        ctx.ellipse(50 * BLOCK_SIZE, (headY - 8) * BLOCK_SIZE, 22 * PX, 7 * PX, 0, 0, Math.PI * 2);
        ctx.stroke();
        // Inner glow
        ctx.strokeStyle = "#FFF8DC";
        ctx.lineWidth = 1.5 * PX;
        ctx.beginPath();
        ctx.ellipse(50 * BLOCK_SIZE, (headY - 8) * BLOCK_SIZE, 19 * PX, 5.5 * PX, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        break;
    }
  }

  // === HEADWEAR (enhanced) ===
  drawHeadwear(trait, seed, rarityName) {
    const headX = 32;
    const headY = 18;
    const headW = 36;
    const ctx = this.ctx;
    const rng = seededRandom(seed);
    const rn = rarityName || 'common';
    const rm = this.getRarityMultiplier(rn);
    const rarityAccent = this.getRarityAccentColor(rn);
    const rarityAccentRGB = rarityAccent ? this._hexToRGB(rarityAccent) : null;

    switch (trait.value) {
      case "beanie":
        this.rect(headX - 3, headY - 5, headW + 6, 8, "#DC143C");
        this.rect(headX + 8, headY - 14, 20, 12, "#DC143C");
        this.rect(headX + 10, headY - 18, 16, 8, "#DC143C");
        // Ribbed texture
        for (let i = 0; i < 6; i++) {
          this.rect(headX + i * 6, headY - 4, 4, 1, "#C01030");
        }
        // Pom pom
        this.rect(headX + 15, headY - 22, 6, 6, "#FFFFFF");
        this.rect(headX + 13, headY - 20, 10, 4, "#F5F5F5");
        break;

      case "snapback":
        this.rect(headX - 5, headY - 7, headW + 10, 8, "#1A1A2E");
        // Brim
        this.rect(headX + headW - 2, headY - 5, 18, 5, "#1A1A2E");
        this.rect(headX + headW, headY - 4, 16, 3, "#252540");
        // Logo
        this.rect(headX + 14, headY - 6, 8, 4, "#DC143C");
        // Button
        this.px(headX + 17, headY - 7, "#FFFFFF");
        break;

      case "bucket":
        this.rect(headX - 5, headY - 7, headW + 10, 10, "#228B22");
        this.rect(headX - 7, headY, headW + 14, 5, "#1B7A1B");
        // Brim shadow
        this.rect(headX - 6, headY + 3, headW + 12, 2, "#166B16");
        // Band
        this.rect(headX - 4, headY - 2, headW + 8, 2, "#2E8B2E");
        break;

      case "tophat":
        this.rect(headX + 2, headY - 24, 28, 20, "#1A1A2E");
        this.rect(headX - 3, headY - 6, headW + 6, 5, "#1A1A2E");
        // Band
        this.rect(headX + 4, headY - 10, 24, 3, "#DAA520");
        // Shine
        this.rect(headX + 8, headY - 22, 4, 12, "#252540");
        break;

      case "beret":
        this.rect(headX + 1, headY - 10, 30, 8, "#DC143C");
        this.rect(headX - 3, headY - 4, headW + 6, 5, "#DC143C");
        // Nub
        this.px(headX + 15, headY - 12, "#C01030");
        // Shadow
        this.rect(headX + 3, headY - 8, 26, 2, "#C01030");
        break;

      case "samurai":
        this.rect(headX - 3, headY - 10, headW + 6, 12, "#8B0000");
        this.rect(headX + 2, headY - 18, 28, 12, "#8B0000");
        this.rect(headX + 4, headY - 22, 24, 8, "#A00000");
        // Face plate
        this.rect(headX + 8, headY - 4, 20, 8, "#6B0000");
        this.rect(headX + 10, headY - 2, 16, 4, "#5A0000");
        // Gold horns
        this.rect(headX - 5, headY - 8, 5, 12, "#FFD700");
        this.rect(headX - 7, headY - 10, 3, 8, "#C9960E");
        this.rect(headX + headW, headY - 8, 5, 12, "#FFD700");
        this.rect(headX + headW + 2, headY - 10, 3, 8, "#C9960E");
        // Mon (crest)
        this.px(headX + 17, headY - 20, "#FFD700");
        break;

      case "phoenix":
        this.rect(headX, headY - 10, 32, 8, "#FF6B35");
        this.rect(headX + 4, headY - 16, 24, 10, "#FF6B35");
        this.rect(headX + 8, headY - 22, 16, 10, "#FFD700");
        // Flames
        ctx.save();
        for (let i = 0; i < 7; i++) {
          const fx = headX + 8 + i * 4;
          const flameH = rng() * 10 + 8;
          const hue = 20 + rng() * 30;
          ctx.fillStyle = `hsl(${hue}, 100%, 55%)`;
          ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
          ctx.shadowBlur = 6 * PX;
          ctx.beginPath();
          ctx.moveTo(fx * BLOCK_SIZE, (headY - 20) * BLOCK_SIZE);
          ctx.lineTo((fx + 2) * BLOCK_SIZE, (headY - 20 - flameH) * BLOCK_SIZE);
          ctx.lineTo((fx + 4) * BLOCK_SIZE, (headY - 20) * BLOCK_SIZE);
          ctx.fill();
        }
        ctx.restore();
        break;

      case "divine":
        this.rect(headX, headY - 10, 32, 8, "#FFD700");
        this.rect(headX + 4, headY - 16, 24, 10, "#FFD700");
        this.rect(headX + 8, headY - 22, 16, 10, "#FFD700");
        // Divine glow
        ctx.save();
        ctx.shadowColor = "#FFD700";
        ctx.shadowBlur = 25 * PX;
        ctx.fillStyle = "#FFD700";
        ctx.beginPath();
        ctx.arc(50 * BLOCK_SIZE, (headY - 18) * BLOCK_SIZE, 8, 0, Math.PI * 2);
        ctx.fill();
        // Inner glow
        ctx.shadowBlur = 15 * PX;
        ctx.fillStyle = "#FFF8DC";
        ctx.beginPath();
        ctx.arc(50 * BLOCK_SIZE, (headY - 18) * BLOCK_SIZE, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        // Rays
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.strokeStyle = "#FFD700";
        ctx.lineWidth = PX;
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(50 * BLOCK_SIZE, (headY - 18) * BLOCK_SIZE);
          ctx.lineTo(
            50 * BLOCK_SIZE + Math.cos(angle) * 40,
            (headY - 18) * BLOCK_SIZE + Math.sin(angle) * 40
          );
          ctx.stroke();
        }
        ctx.restore();
        break;
    }

    // === Rarity-tier headwear enhancements ===
    if (rm > 0 && rarityAccentRGB) {
      // Gem / accent glow for Rare+
      const headCX = headX + headW / 2;
      ctx.save();
      ctx.globalAlpha = 0.2 * rm;
      const gemGrad = ctx.createRadialGradient(
        headCX * BLOCK_SIZE, (headY - 6) * BLOCK_SIZE, 2 * PX,
        headCX * BLOCK_SIZE, (headY - 6) * BLOCK_SIZE, 18 * PX
      );
      gemGrad.addColorStop(0, `rgba(${rarityAccentRGB.r}, ${rarityAccentRGB.g}, ${rarityAccentRGB.b}, 0.7)`);
      gemGrad.addColorStop(0.5, `rgba(${rarityAccentRGB.r}, ${rarityAccentRGB.g}, ${rarityAccentRGB.b}, 0.3)`);
      gemGrad.addColorStop(1, `rgba(${rarityAccentRGB.r}, ${rarityAccentRGB.g}, ${rarityAccentRGB.b}, 0)`);
      ctx.fillStyle = gemGrad;
      ctx.beginPath();
      ctx.arc(headCX * BLOCK_SIZE, (headY - 6) * BLOCK_SIZE, 18 * PX, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    if (rm >= 0.7 && rarityAccentRGB) {
      // Metallic material shimmer for Epic+
      ctx.save();
      ctx.globalAlpha = 0.15;
      const metalGrad = ctx.createLinearGradient(
        headX * BLOCK_SIZE, (headY - 18) * BLOCK_SIZE,
        (headX + headW) * BLOCK_SIZE, (headY + 5) * BLOCK_SIZE
      );
      metalGrad.addColorStop(0, `rgba(${rarityAccentRGB.r}, ${rarityAccentRGB.g}, ${rarityAccentRGB.b}, 0)`);
      metalGrad.addColorStop(0.3, `rgba(${rarityAccentRGB.r}, ${rarityAccentRGB.g}, ${rarityAccentRGB.b}, 0.4)`);
      metalGrad.addColorStop(0.5, "rgba(255,255,255,0.5)");
      metalGrad.addColorStop(0.7, `rgba(${rarityAccentRGB.r}, ${rarityAccentRGB.g}, ${rarityAccentRGB.b}, 0.4)`);
      metalGrad.addColorStop(1, `rgba(${rarityAccentRGB.r}, ${rarityAccentRGB.g}, ${rarityAccentRGB.b}, 0)`);
      ctx.fillStyle = metalGrad;
      ctx.fillRect(headX * BLOCK_SIZE, (headY - 18) * BLOCK_SIZE, headW * BLOCK_SIZE, 24 * BLOCK_SIZE);
      ctx.restore();
    }
  }

  // === MAIN RENDER ===
  render(nftData, options = {}) {
    this.clear();
    const { traits, seed, rarity, colorData } = nftData;
    const ctx = this.ctx;
    const rn = rarity.name;         // "Common" | "Rare" | "Epic" | "Legendary"
    const rm = this.getRarityMultiplier(rn);  // 0 | 0.35 | 0.7 | 1.0
    const transparent = !!options.transparent;

    // Cache rarity accent for drawEffect and other methods
    const accentHex = this.getRarityAccentColor(rn);
    this._rarityAccent = accentHex;
    this._rarityAccentRGB = accentHex ? this._hexToRGB(accentHex) : null;
    this._rarityAccentRGBStr = accentHex ? this._hexToRGBStr(accentHex) : null;

    // Use harmonious colors from colorData if available
    if (colorData) {
      this._harmoniousColors = colorData;
    }

    const _calls = [];
    if (!transparent) {
      _calls.push(["drawBackground",   () => this.drawBackground(traits.background, rn, seed)]);
      _calls.push(["drawEffect",       () => this.drawEffect(traits.backgroundEffect, seed, rn)]);
    }
    _calls.push(
      ["drawSkin",         () => this.drawSkin(colorData ? colorData.skinHex : traits.skin.value)],
      ["drawOutfit",       () => this.drawOutfit(traits.outfit, colorData ? colorData.outfitHex : traits.outfitColor.value, seed, rn)],
      ["drawHair",         () => this.drawHair(traits.hair, colorData ? colorData.hairHex : traits.hairColor.value, seed, rn)],
      ["drawEyes",         () => this.drawEyes(traits.eyes, colorData ? colorData.eyeHex : traits.eyeColor.value, seed, rn)],
      ["drawMouth",        () => this.drawMouth(traits.mouth)],
      ["drawHeadwear",     () => this.drawHeadwear(traits.headwear, seed, rn)],
      ["drawAccessory",    () => this.drawAccessory(traits.accessory, seed)]
    );
    if (!transparent) {
      _calls.push(["drawAmbientLight", () => this.drawAmbientLight(seed, rn)]);
    }
    for (const [label, fn] of _calls) {
      try { fn(); } catch (e) { console.error(`[RENDER] ${label} FAILED:`, e.message, e); }
    }

    if (transparent) {
      // Return early for clean transparent sprite rendering
      return;
    }

    // === OVERALL QUALITY ENHANCEMENT ===
    // Subtle vignette for depth
    ctx.save();
    ctx.globalAlpha = 0.12;
    const vigGrad = ctx.createRadialGradient(
      CANVAS_SIZE * 0.5, CANVAS_SIZE * 0.45, CANVAS_SIZE * 0.2,
      CANVAS_SIZE * 0.5, CANVAS_SIZE * 0.45, CANVAS_SIZE * 0.7
    );
    vigGrad.addColorStop(0, "rgba(255,255,255,0.1)");
    vigGrad.addColorStop(1, "rgba(0,0,0,0.2)");
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.restore();

    // Subtle top-left light source
    ctx.save();
    ctx.globalAlpha = 0.06;
    const lightGrad = ctx.createRadialGradient(
      CANVAS_SIZE * 0.25, CANVAS_SIZE * 0.15, 0,
      CANVAS_SIZE * 0.25, CANVAS_SIZE * 0.15, CANVAS_SIZE * 0.6
    );
    lightGrad.addColorStop(0, "rgba(255,255,255,0.4)");
    lightGrad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = lightGrad;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.restore();

    // Rarity post-processing — clean border glow for solid backgrounds
    if (rarity.name === "Rare") {
      // Subtle rarity border glow for Rare
      ctx.save();
      ctx.globalAlpha = 0.15;
      const rareGlow = this._rarityAccentRGB || { r: 168, g: 85, b: 247 };
      ctx.shadowColor = `rgb(${rareGlow.r}, ${rareGlow.g}, ${rareGlow.b})`;
      ctx.shadowBlur = 15 * PX;
      ctx.strokeStyle = `rgb(${rareGlow.r}, ${rareGlow.g}, ${rareGlow.b})`;
      ctx.lineWidth = 2 * PX;
      ctx.strokeRect(8, 8, CANVAS_SIZE - 16, CANVAS_SIZE - 16);
      ctx.restore();
    }
    if (rarity.name === "Epic") {
      // Purple border glow for Epic
      ctx.save();
      ctx.globalAlpha = 0.18;
      const epicGlow = this._rarityAccentRGB || { r: 168, g: 85, b: 247 };
      ctx.shadowColor = `rgb(${epicGlow.r}, ${epicGlow.g}, ${epicGlow.b})`;
      ctx.shadowBlur = 25 * PX;
      ctx.strokeStyle = `rgb(${epicGlow.r}, ${epicGlow.g}, ${epicGlow.b})`;
      ctx.lineWidth = 3 * PX;
      ctx.strokeRect(6, 6, CANVAS_SIZE - 12, CANVAS_SIZE - 12);
      ctx.restore();

      // Epic floating particles
      ctx.save();
      const rngEpic = seededRandom(seed + 7777);
      for (let i = 0; i < 10; i++) {
        const px = rngEpic() * CANVAS_SIZE;
        const py = rngEpic() * CANVAS_SIZE;
        const size = (1.5 + rngEpic() * 2) * PX;
        const alpha = 0.2 + rngEpic() * 0.25;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = `rgb(${epicGlow.r}, ${epicGlow.g}, ${epicGlow.b})`;
        ctx.shadowColor = `rgb(${epicGlow.r}, ${epicGlow.g}, ${epicGlow.b})`;
        ctx.shadowBlur = 5 * PX;
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    if (rarity.name === "Legendary") {
      // Gold border glow for Legendary
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.shadowColor = "#FFD700";
      ctx.shadowBlur = 40 * PX;
      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 4 * PX;
      ctx.strokeRect(4, 4, CANVAS_SIZE - 8, CANVAS_SIZE - 8);
      ctx.restore();

      // Legendary floating gold particles
      ctx.save();
      const rngLegendary = seededRandom(seed + 7777);
      for (let i = 0; i < 15; i++) {
        const px = rngLegendary() * CANVAS_SIZE;
        const py = rngLegendary() * CANVAS_SIZE;
        const size = (1.5 + rngLegendary() * 3) * PX;
        const alpha = 0.2 + rngLegendary() * 0.3;
        const isGold = rngLegendary() > 0.4;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = isGold
          ? `rgb(255, ${210 + Math.floor(rngLegendary() * 45)}, ${50 + Math.floor(rngLegendary() * 100)})`
          : "#FFD700";
        ctx.shadowColor = "#FFD700";
        ctx.shadowBlur = 8 * PX;
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Legendary corner accents
      ctx.save();
      ctx.globalAlpha = 0.3;
      const cornerSize = 35 * PX;
      const cornerGrad = ctx.createLinearGradient(0, 0, cornerSize, cornerSize);
      cornerGrad.addColorStop(0, "rgba(255,215,0,0.8)");
      cornerGrad.addColorStop(1, "rgba(255,215,0,0)");
      // Top-left
      ctx.fillStyle = cornerGrad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(cornerSize, 0);
      ctx.lineTo(0, cornerSize);
      ctx.closePath();
      ctx.fill();
      // Top-right
      ctx.save();
      ctx.translate(CANVAS_SIZE, 0);
      ctx.scale(-1, 1);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(cornerSize, 0);
      ctx.lineTo(0, cornerSize);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      // Bottom-left
      ctx.save();
      ctx.translate(0, CANVAS_SIZE);
      ctx.scale(1, -1);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(cornerSize, 0);
      ctx.lineTo(0, cornerSize);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      // Bottom-right
      ctx.save();
      ctx.translate(CANVAS_SIZE, CANVAS_SIZE);
      ctx.scale(-1, -1);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(cornerSize, 0);
      ctx.lineTo(0, cornerSize);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      ctx.restore();
    }

    // Solid rarity border (always)
    ctx.strokeStyle = rarity.color;
    ctx.lineWidth = 4 * PX;
    ctx.strokeRect(2, 2, CANVAS_SIZE - 4, CANVAS_SIZE - 4);
  }

  // === AMBIENT LIGHTING ===
  drawAmbientLight(seed, rarityName) {
    const rng = seededRandom(seed + 8888);
    const ctx = this.ctx;
    const rn = rarityName || 'common';
    const rm = this.getRarityMultiplier(rn);
    const rarityAccent = this.getRarityAccentColor(rn);
    const rarityAccentRGB = rarityAccent ? this._hexToRGB(rarityAccent) : null;

    // Character drop shadow for depth
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.ellipse(50 * BLOCK_SIZE, 92 * BLOCK_SIZE, 22 * BLOCK_SIZE, 4 * BLOCK_SIZE, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Subtle top-left light source (intensity scales with rarity)
    ctx.save();
    ctx.globalAlpha = 0.06 + 0.04 * rm;
    const lightGrad = ctx.createRadialGradient(
      CANVAS_SIZE * 0.2, CANVAS_SIZE * 0.15, 0,
      CANVAS_SIZE * 0.2, CANVAS_SIZE * 0.15, CANVAS_SIZE * 0.7
    );
    lightGrad.addColorStop(0, "rgba(255,255,255,0.4)");
    lightGrad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = lightGrad;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.restore();

    // Subtle bottom-right shadow (lighter for higher rarity)
    ctx.save();
    ctx.globalAlpha = 0.05 - 0.02 * rm;
    const shadowGrad = ctx.createRadialGradient(
      CANVAS_SIZE * 0.85, CANVAS_SIZE * 0.9, 0,
      CANVAS_SIZE * 0.85, CANVAS_SIZE * 0.9, CANVAS_SIZE * 0.6
    );
    shadowGrad.addColorStop(0, "rgba(0,0,0,0.3)");
    shadowGrad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = shadowGrad;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.restore();

    // === Rarity-tier ambient enhancements ===
    if (rm > 0 && rarityAccentRGB) {
      // Colored rim lighting for Rare+
      ctx.save();
      ctx.globalAlpha = 0.06 + 0.04 * rm;
      const rimGrad = ctx.createRadialGradient(
        CANVAS_SIZE * 0.5, CANVAS_SIZE * 0.45, CANVAS_SIZE * 0.15,
        CANVAS_SIZE * 0.5, CANVAS_SIZE * 0.45, CANVAS_SIZE * 0.55
      );
      rimGrad.addColorStop(0, "rgba(0,0,0,0)");
      rimGrad.addColorStop(0.7, `rgba(${rarityAccentRGB.r}, ${rarityAccentRGB.g}, ${rarityAccentRGB.b}, 0.15)`);
      rimGrad.addColorStop(1, `rgba(${rarityAccentRGB.r}, ${rarityAccentRGB.g}, ${rarityAccentRGB.b}, 0.08)`);
      ctx.fillStyle = rimGrad;
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      ctx.restore();
    }
    if (rm >= 0.7) {
      // Ambient floating particles for Epic+
      ctx.save();
      const particleCount = rn === "Legendary" ? 18 : 10;
      for (let i = 0; i < particleCount; i++) {
        const px = rng() * CANVAS_SIZE;
        const py = rng() * CANVAS_SIZE;
        const size = (1 + rng() * 2) * PX;
        const alpha = 0.15 + rng() * 0.25;
        const isGold = rn === "Legendary" && rng() > 0.5;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = isGold
          ? `rgb(255, ${200 + Math.floor(rng() * 55)}, ${50 + Math.floor(rng() * 100)})`
          : `rgb(${rarityAccentRGB.r}, ${rarityAccentRGB.g}, ${rarityAccentRGB.b})`;
        ctx.shadowColor = isGold ? "#FFD700" : `rgb(${rarityAccentRGB.r}, ${rarityAccentRGB.g}, ${rarityAccentRGB.b})`;
        ctx.shadowBlur = 6 * PX;
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }
}

// Export
if (typeof module !== "undefined" && module.exports) {
  module.exports = { NFTRenderer };
}

