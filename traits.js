/**
 * Blockbit Ink — Trait System v2
 * 1,999 unique generative anime/pixel NFTs
 * Solid color backgrounds with color harmony system
 */

const COLLECTION = {
  name: "Blockbit Ink",
  description: "1,999 unique generative anime/pixel NFTs. Each one is Algorithmically Generated and utterly unique. Slight variations in color, hat, chain, eyes, and background make every single Blockbit Ink one-of-a-kind.",
  totalSupply: 1999,
  symbol: "DINK",
  website: "https://blockbitink.xyz",
  image: "https://blockbitink.xyz/collection.png",
  // Set BLOCKBIT_CREATOR_ADDRESS in env before running generate.js to override.
  creatorAddress: (typeof process !== "undefined" && process.env && process.env.BLOCKBIT_CREATOR_ADDRESS)
    || "0x0000000000000000000000000000000000000000",
};

// Rarity tiers
const RARITY = {
  COMMON: { name: "Common", color: "#9CA3AF", weight: 50, multiplier: 1 },
  RARE: { name: "Rare", color: "#3B82F6", weight: 30, multiplier: 2 },
  EPIC: { name: "Epic", color: "#A855F7", weight: 15, multiplier: 3 },
  LEGENDARY: { name: "Legendary", color: "#F59E0B", weight: 5, multiplier: 5 },
};

// === COLOR UTILITIES ===

/**
 * Convert HSL to Hex
 * @param {number} h - Hue (0-360)
 * @param {number} s - Saturation (0-100)
 * @param {number} l - Lightness (0-100)
 * @returns {string} Hex color string
 */
function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r, g, b;
  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }

  const toHex = (v) => {
    const hex = Math.round((v + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Convert Hex to HSL
 * @param {string} hex - Hex color string
 * @returns {{h: number, s: number, l: number}}
 */
function hexToHsl(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }

  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  const l = (max + min) / 2;

  let h = 0, s = 0;

  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (max === g) h = ((b - r) / d + 2) * 60;
    else h = ((r - g) / d + 4) * 60;
  }

  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

/**
 * Convert Hex to RGB object
 */
function hexToRgb(hex) {
  hex = hex.replace('#', '');
  return {
    r: parseInt(hex.substring(0, 2), 16),
    g: parseInt(hex.substring(2, 4), 16),
    b: parseInt(hex.substring(4, 6), 16)
  };
}

/**
 * Calculate relative luminance (WCAG 2.1)
 */
function relativeLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors (WCAG 2.1)
 * @returns {number} Contrast ratio (1-21)
 */
function contrastRatio(hex1, hex2) {
  const c1 = hexToRgb(hex1);
  const c2 = hexToRgb(hex2);
  const l1 = relativeLuminance(c1.r, c1.g, c1.b);
  const l2 = relativeLuminance(c2.r, c2.g, c2.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if foreground color has sufficient contrast against background
 * WCAG AA requires 4.5:1 for normal text
 */
function hasGoodContrast(fgHex, bgHex, minRatio = 4.0) {
  return contrastRatio(fgHex, bgHex) >= minRatio;
}

/**
 * Adjust lightness to ensure contrast
 */
function ensureContrast(fgHex, bgHex, minRatio = 4.0) {
  if (hasGoodContrast(fgHex, bgHex, minRatio)) return fgHex;

  const fgHsl = hexToHsl(fgHex);
  const bgLum = relativeLuminance(...Object.values(hexToRgb(bgHex)));

  // Try making foreground darker or lighter
  for (let i = 1; i <= 50; i++) {
    // Try darker
    const darkL = Math.max(0, fgHsl.l - i);
    const darkHex = hslToHex(fgHsl.h, fgHsl.s, darkL);
    if (hasGoodContrast(darkHex, bgHex, minRatio)) return darkHex;

    // Try lighter
    const lightL = Math.min(100, fgHsl.l + i);
    const lightHex = hslToHex(fgHsl.h, fgHsl.s, lightL);
    if (hasGoodContrast(lightHex, bgHex, minRatio)) return lightHex;
  }

  // Fallback: use high-contrast color
  return bgLum > 0.5 ? '#1A1A2E' : '#F0F0FF';
}

/**
 * Generate complementary color (180 degrees apart)
 */
function complementary(h) {
  return (h + 180) % 360;
}

/**
 * Generate split-complementary (150 and 210 degrees)
 */
function splitComplementary(h) {
  return [(h + 150) % 360, (h + 210) % 360];
}

/**
 * Generate triadic colors (120 degrees apart)
 */
function triadic(h) {
  return [(h + 120) % 360, (h + 240) % 360];
}

// === UNIQUE BACKGROUND GENERATION ===

/**
 * Golden ratio for distributing hues evenly
 */
const PHI = (1 + Math.sqrt(5)) / 2;

/**
 * Generate 1999 unique solid background colors using golden ratio distribution
 * Each color is distinct with varied saturation and lightness
 */
function generateUniqueBackgrounds(count) {
  const backgrounds = [];
  const usedColors = new Set();

  for (let i = 0; i < count; i++) {
    // Golden ratio distribution for hue - ensures even spread around color wheel
    const hue = (i * PHI * 137.508) % 360;

    // Vary saturation and lightness more aggressively for variety
    // Use different multipliers for each to avoid patterns
    const satMult = (i * PHI * 31.7) % 1;
    const litMult = (i * PHI * 47.3) % 1;

    // Saturation: 25-60% (muted, not too vibrant)
    const sat = Math.round(25 + satMult * 35);
    // Lightness: 35-65% (medium range)
    const lit = Math.round(35 + litMult * 30);

    // Convert to hex
    const hex = hslToHex(hue, sat, lit);

    // Ensure unique color
    let finalHex = hex;
    let attempts = 0;
    while (usedColors.has(finalHex) && attempts < 100) {
      const newHue = (hue + attempts * 2) % 360;
      finalHex = hslToHex(newHue, sat, lit);
      attempts++;
    }
    usedColors.add(finalHex);

    // Generate a name based on hue
    const name = getBackgroundName(hue, sat, lit);

    backgrounds.push({
      name: name,
      value: finalHex,
      rarity: "COMMON",
      weight: 1
    });
  }

  return backgrounds;
}

/**
 * Generate background name based on hue
 */
function getBackgroundName(hue, sat, lit) {
  const hueNames = [
    [15, 'Crimson'],
    [35, 'Amber'],
    [55, 'Gold'],
    [75, 'Lime'],
    [105, 'Emerald'],
    [135, 'Jade'],
    [165, 'Teal'],
    [195, 'Cyan'],
    [225, 'Azure'],
    [255, 'Blue'],
    [285, 'Indigo'],
    [315, 'Violet'],
    [345, 'Rose'],
    [360, 'Crimson']
  ];

  let hueName = 'Unknown';
  for (let i = 0; i < hueNames.length; i++) {
    if (hue <= hueNames[i][0]) {
      hueName = hueNames[i][1];
      break;
    }
  }

  const litPrefix = lit < 35 ? 'Deep' : lit < 50 ? '' : 'Light';
  const satSuffix = sat < 50 ? 'Muted' : '';

  return `${litPrefix} ${hueName} ${satSuffix}`.trim();
}

// Generate backgrounds once
const GENERATED_BACKGROUNDS = generateUniqueBackgrounds(COLLECTION.totalSupply);

// === COLOR HARMONY PALETTES ===

/**
 * Rarity-specific color palette ranges
 * These ensure each rarity tier has a distinct visual feel
 */
const RARITY_PALETTES = {
  COMMON: {
    // Muted, earthy tones
    skinTones: ['#FDE8D0', '#E8C39E', '#D4A574', '#C4915A', '#A67843', '#8B6330'],
    hairColors: ['#1A1A2E', '#2D2D3E', '#4A4A5A', '#6B6B7B', '#8B8B9B', '#3D3D4D'],
    outfitColors: ['#2D3748', '#4A5568', '#718096', '#A0AEC0', '#5A6577', '#3D4B5F'],
    eyeColors: ['#4682B4', '#5F9EA0', '#6B8E9B', '#7B8E9E', '#4A7B8C', '#5D8A9E'],
  },
  RARE: {
    // Vibrant cool tones (blues, teals)
    skinTones: ['#FDE8D0', '#E8C39E', '#D4A574', '#C4915A', '#A8D8C8'],
    hairColors: ['#1E90FF', '#00CED1', '#20B2AA', '#4169E1', '#00BFFF', '#4682B4'],
    outfitColors: ['#1E3A5F', '#0D4F6E', '#1A5276', '#2E4057', '#1B4F72', '#154360'],
    eyeColors: ['#00BFFF', '#4169E1', '#1E90FF', '#00CED1', '#4682B4', '#5DADE2'],
  },
  EPIC: {
    // Rich purples, magentas
    skinTones: ['#FDE8D0', '#E8C39E', '#D4A574', '#C8C8D8', '#A8D8C8'],
    hairColors: ['#8A2BE2', '#9B59B6', '#6A0DAD', '#7B2FBE', '#9370DB', '#BA55D3'],
    outfitColors: ['#4B0082', '#6A0DAD', '#7B2FBE', '#5B2C8E', '#4A235A', '#6C3483'],
    eyeColors: ['#9B59B6', '#8A2BE2', '#BA55D3', '#7B2FBE', '#6A0DAD', '#A569BD'],
  },
  LEGENDARY: {
    // Warm golds, reds, premium
    skinTones: ['#FDE8D0', '#E8C39E', '#D4A574', '#C8C8D8', '#A8D8C8'],
    hairColors: ['#FFD700', '#FFA500', '#FF8C00', '#DAA520', '#CD853F', '#D4AF37'],
    outfitColors: ['#8B0000', '#B22222', '#A0522D', '#8B4513', '#6B3A2E', '#7B3F00'],
    eyeColors: ['#FFD700', '#FFA500', '#DAA520', '#CD853F', '#B8860B', '#D4AF37'],
  }
};

// === TRAIT CATEGORIES ===

const TRAITS = {
  background: {
    name: "Background",
    options: [
      { name: "Solid", value: "#888888", rarity: "COMMON", weight: 1 },
    ],
  },

  skin: {
    name: "Skin Tone",
    options: [
      { name: "Porcelain", value: "#FDE8D0", rarity: "COMMON", weight: 20 },
      { name: "Warm Beige", value: "#E8C39E", rarity: "COMMON", weight: 20 },
      { name: "Honey", value: "#D4A574", rarity: "COMMON", weight: 20 },
      { name: "Sun-Kissed", value: "#C4915A", rarity: "COMMON", weight: 15 },
      { name: "Caramel", value: "#A67843", rarity: "RARE", weight: 12 },
      { name: "Bronze", value: "#8B6330", rarity: "RARE", weight: 8 },
      { name: "Obsidian", value: "#5C3D1E", rarity: "EPIC", weight: 5 },
      { name: "Midnight", value: "#3A2510", rarity: "EPIC", weight: 3 },
      { name: "Jade Frost", value: "#A8D8C8", rarity: "LEGENDARY", weight: 1 },
      { name: "Lunar Silver", value: "#C8C8D8", rarity: "LEGENDARY", weight: 1 },
    ],
  },

  hair: {
    name: "Hair Style",
    options: [
      { name: "Classic Bob", value: "bob", rarity: "COMMON", weight: 18 },
      { name: "Spiky", value: "spiky", rarity: "COMMON", weight: 18 },
      { name: "Ponytail", value: "ponytail", rarity: "COMMON", weight: 16 },
      { name: "Short Crop", value: "crop", rarity: "COMMON", weight: 15 },
      { name: "Long Flowing", value: "long", rarity: "RARE", weight: 12 },
      { name: "Mohawk", value: "mohawk", rarity: "RARE", weight: 10 },
      { name: "Bun", value: "bun", rarity: "RARE", weight: 8 },
      { name: "Twin Tails", value: "twintails", rarity: "EPIC", weight: 6 },
      { name: "Dragon Mane", value: "dragon", rarity: "EPIC", weight: 4 },
      { name: "Phantom Crown", value: "crown", rarity: "LEGENDARY", weight: 2 },
      { name: "Halo Weave", value: "halo", rarity: "LEGENDARY", weight: 1 },
    ],
  },

  hairColor: {
    name: "Hair Color",
    options: [
      { name: "Jet Black", value: "#1A1A2E", rarity: "COMMON", weight: 22 },
      { name: "Snow White", value: "#E8E8F0", rarity: "COMMON", weight: 20 },
      { name: "Scarlet", value: "#DC143C", rarity: "COMMON", weight: 18 },
      { name: "Ocean Blue", value: "#1E90FF", rarity: "COMMON", weight: 15 },
      { name: "Violet Storm", value: "#8A2BE2", rarity: "RARE", weight: 10 },
      { name: "Emerald Glow", value: "#00FF7F", rarity: "RARE", weight: 8 },
      { name: "Cherry Blossom", value: "#FFB7C5", rarity: "EPIC", weight: 5 },
      { name: "Golden Flame", value: "#FFD700", rarity: "EPIC", weight: 4 },
      { name: "Void Purple", value: "#4B0082", rarity: "LEGENDARY", weight: 2 },
      { name: "Prismatic", value: "prismatic", rarity: "LEGENDARY", weight: 1 },
    ],
  },

  eyes: {
    name: "Eyes",
    options: [
      { name: "Determined", value: "determined", rarity: "COMMON", weight: 20 },
      { name: "Sharp", value: "sharp", rarity: "COMMON", weight: 20 },
      { name: "Gentle", value: "gentle", rarity: "COMMON", weight: 18 },
      { name: "Focused", value: "focused", rarity: "COMMON", weight: 15 },
      { name: "Fierce", value: "fierce", rarity: "RARE", weight: 12 },
      { name: "Mystic", value: "mystic", rarity: "RARE", weight: 8 },
      { name: "Cybernetic", value: "cyber", rarity: "EPIC", weight: 5 },
      { name: "Dragon Eye", value: "dragon", rarity: "EPIC", weight: 4 },
      { name: "Galaxy Gaze", value: "galaxy", rarity: "LEGENDARY", weight: 2 },
      { name: "Void Sight", value: "void", rarity: "LEGENDARY", weight: 1 },
    ],
  },

  eyeColor: {
    name: "Eye Color",
    options: [
      { name: "Steel Blue", value: "#4682B4", rarity: "COMMON", weight: 22 },
      { name: "Emerald", value: "#2ECC71", rarity: "COMMON", weight: 20 },
      { name: "Amber", value: "#FFBF00", rarity: "COMMON", weight: 18 },
      { name: "Crimson", value: "#E74C3C", rarity: "COMMON", weight: 15 },
      { name: "Violet", value: "#9B59B6", rarity: "RARE", weight: 12 },
      { name: "Silver", value: "#C0C0C0", rarity: "RARE", weight: 8 },
      { name: "Heterochromia", value: "hetero", rarity: "EPIC", weight: 5 },
      { name: "Golden Iris", value: "#FFD700", rarity: "EPIC", weight: 4 },
      { name: "Void Black", value: "#050510", rarity: "LEGENDARY", weight: 2 },
      { name: "Nebula", value: "nebula", rarity: "LEGENDARY", value2: "#FF00FF", weight: 1 },
    ],
  },

  accessory: {
    name: "Accessory",
    options: [
      { name: "None", value: "none", rarity: "COMMON", weight: 25 },
      { name: "Glasses", value: "glasses", rarity: "COMMON", weight: 18 },
      { name: "Headband", value: "headband", rarity: "COMMON", weight: 15 },
      { name: "Bandana", value: "bandana", rarity: "COMMON", weight: 12 },
      { name: "Gold Chain", value: "chain", rarity: "RARE", weight: 10 },
      { name: "Earbuds", value: "earbuds", rarity: "RARE", weight: 8 },
      { name: "Mask", value: "mask", rarity: "EPIC", weight: 5 },
      { name: "Horns", value: "horns", rarity: "EPIC", weight: 4 },
      { name: "Crown", value: "crown", rarity: "LEGENDARY", weight: 2 },
      { name: "Halo", value: "halo", rarity: "LEGENDARY", weight: 1 },
    ],
  },

  headwear: {
    name: "Headwear",
    options: [
      { name: "None", value: "none", rarity: "COMMON", weight: 30 },
      { name: "Beanie", value: "beanie", rarity: "COMMON", weight: 18 },
      { name: "Snapback", value: "snapback", rarity: "COMMON", weight: 15 },
      { name: "Bucket Hat", value: "bucket", rarity: "COMMON", weight: 12 },
      { name: "Top Hat", value: "tophat", rarity: "RARE", weight: 8 },
      { name: "Beret", value: "beret", rarity: "RARE", weight: 6 },
      { name: "Horns", value: "horns", rarity: "EPIC", weight: 5 },
      { name: "Samurai Helm", value: "samurai", rarity: "EPIC", weight: 3 },
      { name: "Phoenix Crest", value: "phoenix", rarity: "LEGENDARY", weight: 2 },
      { name: "Divine Crown", value: "divine", rarity: "LEGENDARY", weight: 1 },
    ],
  },

  outfit: {
    name: "Outfit",
    options: [
      { name: "Street Tee", value: "tee", rarity: "COMMON", weight: 20 },
      { name: "Hoodie", value: "hoodie", rarity: "COMMON", weight: 18 },
      { name: "Tank Top", value: "tank", rarity: "COMMON", weight: 15 },
      { name: "Jacket", value: "jacket", rarity: "COMMON", weight: 12 },
      { name: "Kimono", value: "kimono", rarity: "RARE", weight: 10 },
      { name: "Leather Jacket", value: "leather", rarity: "RARE", weight: 8 },
      { name: "Suit", value: "suit", rarity: "EPIC", weight: 7 },
      { name: "Armor", value: "armor", rarity: "EPIC", weight: 5 },
      { name: "Dragon Robe", value: "dragonrobe", rarity: "LEGENDARY", weight: 3 },
      { name: "Celestial Garb", value: "celestial", rarity: "LEGENDARY", weight: 2 },
    ],
  },

  outfitColor: {
    name: "Outfit Color",
    options: [
      { name: "Midnight Black", value: "#1A1A2E", rarity: "COMMON", weight: 20 },
      { name: "Arctic White", value: "#E8E8F0", rarity: "COMMON", weight: 18 },
      { name: "Crimson Red", value: "#DC143C", rarity: "COMMON", weight: 16 },
      { name: "Navy Blue", value: "#1E3A5F", rarity: "COMMON", weight: 14 },
      { name: "Forest Green", value: "#228B22", rarity: "RARE", weight: 12 },
      { name: "Royal Purple", value: "#6A0DAD", rarity: "RARE", weight: 10 },
      { name: "Sunset Orange", value: "#FF6B35", rarity: "EPIC", weight: 6 },
      { name: "Neon Pink", value: "#FF1493", rarity: "EPIC", weight: 4 },
      { name: "Liquid Gold", value: "#FFD700", rarity: "LEGENDARY", weight: 2 },
      { name: "Void Silver", value: "#C0C0C0", rarity: "LEGENDARY", weight: 1 },
    ],
  },

  mouth: {
    name: "Mouth",
    options: [
      { name: "Smirk", value: "smirk", rarity: "COMMON", weight: 25 },
      { name: "Grin", value: "grin", rarity: "COMMON", weight: 22 },
      { name: "Neutral", value: "neutral", rarity: "COMMON", weight: 20 },
      { name: "Pout", value: "pout", rarity: "COMMON", weight: 15 },
      { name: "Teeth Show", value: "teeth", rarity: "RARE", weight: 10 },
      { name: "Smoke", value: "smoke", rarity: "RARE", weight: 8 },
      { name: "Sharp Fang", value: "fang", rarity: "EPIC", weight: 5 },
      { name: "Lollipop", value: "lollipop", rarity: "EPIC", weight: 4 },
      { name: "Golden Grill", value: "grill", rarity: "LEGENDARY", weight: 2 },
      { name: "Void Whisper", value: "void", rarity: "LEGENDARY", weight: 1 },
    ],
  },

  backgroundEffect: {
    name: "Background Effect",
    options: [
      { name: "None", value: "none", rarity: "COMMON", weight: 35 },
      { name: "Particles", value: "particles", rarity: "COMMON", weight: 20 },
      { name: "Light Rays", value: "rays", rarity: "COMMON", weight: 15 },
      { name: "Smoke", value: "smoke", rarity: "RARE", weight: 12 },
      { name: "Fire", value: "fire", rarity: "RARE", weight: 8 },
      { name: "Lightning", value: "lightning", rarity: "EPIC", weight: 5 },
      { name: "Sakura Petals", value: "sakura", rarity: "EPIC", weight: 4 },
      { name: "Dragon Aura", value: "dragonaura", rarity: "LEGENDARY", weight: 3 },
      { name: "Void Rift", value: "voidrift", rarity: "LEGENDARY", weight: 2 },
      { name: "Cosmic Storm", value: "cosmicstorm", rarity: "LEGENDARY", weight: 1 },
    ],
  },
};

// === SEED-BASED PRNG ===

function seededRandom(seed) {
  let s = seed;
  return function () {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// === WEIGHTED RANDOM SELECTION ===

function weightedSelect(options, rng) {
  const totalWeight = options.reduce((sum, o) => sum + o.weight, 0);
  let r = rng() * totalWeight;
  for (const option of options) {
    r -= option.weight;
    if (r <= 0) return option;
  }
  return options[options.length - 1];
}

// === COLOR HARMONY GENERATION ===

/**
 * Generate harmonious character colors based on background color
 * Uses color theory to ensure characters pop against backgrounds
 */
function generateHarmoniousColors(bgHex, rarityName, rng) {
  const bgHsl = hexToHsl(bgHex);
  const palette = RARITY_PALETTES[rarityName] || RARITY_PALETTES.COMMON;
  
  // Determine if background is warm or cool
  const isBgWarm = (bgHsl.h >= 0 && bgHsl.h < 60) || (bgHsl.h >= 300 && bgHsl.h < 360);
  const isBgLight = bgHsl.l > 55;
  
  // Select skin tone based on background - always ensure visibility
  // Light backgrounds get darker skin, dark backgrounds get lighter skin
  let skinColor;
  if (isBgLight) {
    // Light background - use darker skin tones
    const darkSkins = ['#8B6330', '#A67843', '#C4915A', '#D4A574'];
    skinColor = darkSkins[Math.floor(rng() * darkSkins.length)];
  } else {
    // Dark background - use lighter skin tones
    const lightSkins = ['#FDE8D0', '#E8C39E', '#D4A574', '#C4915A'];
    skinColor = lightSkins[Math.floor(rng() * lightSkins.length)];
  }
  
  // Generate hair color that contrasts with background
  // Use complementary or triadic colors - make them vibrant
  let hairColor;
  const compHue = complementary(bgHsl.h);
  const triadicHues = triadic(bgHsl.h);
  
  if (rarityName === 'LEGENDARY') {
    // Legendary: gold, warm tones - very vibrant
    hairColor = ensureContrast(hslToHex(45, 90, 60), bgHex, 4.0);
  } else if (rarityName === 'EPIC') {
    // Epic: rich purples, magentas - very vibrant
    hairColor = ensureContrast(hslToHex(280, 80, 55), bgHex, 4.0);
  } else if (rarityName === 'RARE') {
    // Rare: vibrant complementary
    hairColor = ensureContrast(hslToHex(compHue, 75, 55), bgHex, 4.0);
  } else {
    // Common: choose from a safe palette based on background - more vibrant
    const safeHues = [compHue, triadicHues[0], triadicHues[1], (compHue + 40) % 360];
    const chosenHue = safeHues[Math.floor(rng() * safeHues.length)];
    hairColor = ensureContrast(hslToHex(chosenHue, 65, 50), bgHex, 3.5);
  }
  
  // Generate outfit color - use triadic for harmony - more vibrant
  let outfitColor;
  const outfitHue = triadicHues[Math.floor(rng() * 2)];
  outfitColor = ensureContrast(hslToHex(outfitHue, 60, 45), bgHex, 3.5);
  
  // Generate eye color - vibrant, always visible
  const eyeHue = (bgHsl.h + 180 + rng() * 60 - 30) % 360;
  let eyeColor = ensureContrast(hslToHex(eyeHue, 80, 60), bgHex, 4.0);
  
  return {
    hairColor,
    skinColor,
    outfitColor,
    eyeColor
  };
}

// === GENERATE TRAITS ===

function generateTraits(seed) {
  const rng = seededRandom(seed);
  const traits = {};

  // First, determine rarity tier from trait weights
  const tempTraits = {};
  for (const [category, trait] of Object.entries(TRAITS)) {
    tempTraits[category] = weightedSelect(trait.options, rng);
  }

  // Calculate rarity score
  const rarityCounts = {};
  for (const [category, selected] of Object.entries(tempTraits)) {
    const rarity = selected.rarity;
    rarityCounts[rarity] = (rarityCounts[rarity] || 0) + 1;
  }

  // Determine overall rarity
  let overallRarity;
  if (rarityCounts["LEGENDARY"] >= 3 || (rarityCounts["LEGENDARY"] >= 2 && rarityCounts["EPIC"] >= 3)) {
    overallRarity = RARITY.LEGENDARY;
  } else if (rarityCounts["LEGENDARY"] >= 1 || rarityCounts["EPIC"] >= 3 || (rarityCounts["EPIC"] >= 2 && rarityCounts["RARE"] >= 3)) {
    overallRarity = RARITY.EPIC;
  } else if (rarityCounts["EPIC"] >= 1 || rarityCounts["RARE"] >= 3) {
    overallRarity = RARITY.RARE;
  } else {
    overallRarity = RARITY.COMMON;
  }

  // Assign unique background from generated pool
  const bgIndex = (seed % COLLECTION.totalSupply);
  const bgOption = GENERATED_BACKGROUNDS[bgIndex];

  // Use background index to seed color harmony
  const colorRng = seededRandom(seed * 13 + 7);
  const harmoniousColors = generateHarmoniousColors(bgOption.value, overallRarity.name, colorRng);

  // Now assign all traits with color harmony
  for (const [category, trait] of Object.entries(TRAITS)) {
    if (category === 'hairColor') {
      // Use harmonious hair color
      traits[category] = {
        name: "Harmonized",
        value: harmoniousColors.hairColor,
        rarity: overallRarity.name,
        weight: 1
      };
    } else if (category === 'outfitColor') {
      // Use harmonious outfit color
      traits[category] = {
        name: "Harmonized",
        value: harmoniousColors.outfitColor,
        rarity: overallRarity.name,
        weight: 1
      };
    } else if (category === 'eyeColor') {
      // Use harmonious eye color
      traits[category] = {
        name: "Harmonized",
        value: harmoniousColors.eyeColor,
        rarity: overallRarity.name,
        weight: 1
      };
    } else if (category === 'background') {
      // Use generated unique background
      traits[category] = bgOption;
    } else {
      // Use weighted selection for other categories
      traits[category] = weightedSelect(trait.options, rng);
    }
  }

  // Add skin color from harmonious palette
  traits.skin = {
    name: "Harmonized",
    value: harmoniousColors.skinColor,
    rarity: overallRarity.name,
    weight: 1
  };

  // Add color harmony metadata
  const colorData = {
    bgHex: bgOption.value,
    bgHsl: hexToHsl(bgOption.value),
    hairHex: harmoniousColors.hairColor,
    hairHsl: hexToHsl(harmoniousColors.hairColor),
    skinHex: harmoniousColors.skinColor,
    outfitHex: harmoniousColors.outfitColor,
    eyeHex: harmoniousColors.eyeColor,
    contrastRatio: contrastRatio(harmoniousColors.hairColor, bgOption.value)
  };

  // Calculate numerical rarity score (higher = rarer)
  const score = Object.values(traits).reduce((sum, t) => {
    return sum + (1 / (t.weight / 100));
  }, 0);

  return {
    traits,
    rarity: overallRarity,
    rarityScore: Math.round(score * 100) / 100,
    seed,
    colorData
  };
}

// === GENERATE METADATA ===

function generateMetadata(tokenId, nftData) {
  const attributes = [];

  for (const [category, trait] of Object.entries(nftData.traits)) {
    attributes.push({
      trait_type: TRAITS[category].name,
      value: trait.name,
    });
  }

  attributes.push({
    trait_type: "Rarity",
    value: nftData.rarity.name,
  });

  attributes.push({
    trait_type: "Rarity Score",
    value: nftData.rarityScore,
    display_type: "number",
  });

  return {
    name: `Blockbit Ink #${tokenId}`,
    description: COLLECTION.description,
    image: `images/${tokenId}.png`,
    external_url: COLLECTION.website,
    attributes,
properties: {
      category: "image",
      creators: [
        {
          address: COLLECTION.creatorAddress,
          share: 100,
        },
      ],
    },
  };
}

// === GENERATE COLLECTION ===

function generateCollection() {
  const collection = [];
  const usedCombinations = new Set();

  for (let i = 1; i <= COLLECTION.totalSupply; i++) {
    let seed = i * 7919 + 31337;
    let data = generateTraits(seed);
    let comboKey = JSON.stringify(Object.values(data.traits).map((t) => t.name));

    // Ensure unique combinations
    let attempts = 0;
    while (usedCombinations.has(comboKey) && attempts < 1000) {
      seed += 1;
      data = generateTraits(seed);
      comboKey = JSON.stringify(Object.values(data.traits).map((t) => t.name));
      attempts++;
    }

    usedCombinations.add(comboKey);
    data.metadata = generateMetadata(i, data);
    collection.push(data);
  }

  return collection;
}

// === COMPATIBILITY ALIASES ===

function generateSeed() {
  return Math.floor(Math.random() * 999999) + 1;
}

function generateNFT(seed) {
  return generateTraits(seed);
}

function getRarityTier(nftData) {
  return nftData.rarity.name.toLowerCase();
}

function getRarityLabel(nftData) {
  return nftData.rarity.name;
}

function getRarityColor(nftData) {
  return nftData.rarity.color;
}

const COLLECTION_SIZE = COLLECTION.totalSupply;

// === EXPORTS ===

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    TRAITS, RARITY, COLLECTION,
    generateTraits, generateMetadata, generateCollection,
    seededRandom, generateSeed, generateNFT,
    getRarityTier, getRarityLabel, getRarityColor,
    COLLECTION_SIZE,
    // Color utilities
    hslToHex, hexToHsl, hexToRgb,
    contrastRatio, hasGoodContrast, ensureContrast,
    complementary, splitComplementary, triadic,
    generateHarmoniousColors,
    GENERATED_BACKGROUNDS
  };
}


