// Blockbit Ink — One-time output cleanup
// 1. Removes duplicate tokenIds across common/rare/epic/legendary (keeps the first occurrence).
// 2. Rebrands all existing JSON metadata: "Dudes Ink" → "Blockbit Ink", "dudesink.xyz" → "blockbitink.xyz".
// 3. Regenerates manifest.json with accurate stats.
//
// Run with: node cleanup-output.js
// Idempotent — safe to re-run.

const fs = require('fs');
const path = require('path');

const OUTPUT = path.join(__dirname, 'output');
const TIERS = ['common', 'rare', 'epic', 'legendary'];

function walk(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const fp = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(fp));
    else if (ent.isFile()) out.push(fp);
  }
  return out;
}

function rebrandText(s) {
  return s
    .replace(/Dudes Ink/g, 'Blockbit Ink')
    .replace(/dudesink\.xyz/g, 'blockbitink.xyz');
}

function rebrandJsonFile(fp) {
  let raw = fs.readFileSync(fp, 'utf8');
  const before = raw;
  raw = rebrandText(raw);
  if (raw !== before) {
    fs.writeFileSync(fp, raw, 'utf8');
    return true;
  }
  return false;
}

// 1. Find duplicates — same tokenId in multiple folders.
const seen = new Map(); // tokenId -> first folder path
const toDelete = []; // [{fp, reason}]
for (const tier of TIERS) {
  const dir = path.join(OUTPUT, tier);
  if (!fs.existsSync(dir)) continue;
  for (const file of fs.readdirSync(dir)) {
    const m = file.match(/^(\d+)\.(png|json)$/);
    if (!m) continue;
    const id = parseInt(m[1], 10);
    const ext = m[2];
    const key = `${id}.${ext}`;
    if (seen.has(key)) {
      toDelete.push({ fp: path.join(dir, file), reason: `duplicate of ${seen.get(key)}` });
    } else {
      seen.set(key, path.join(dir, file));
    }
  }
}

console.log(`Found ${toDelete.length} duplicate files.`);
let removed = 0;
for (const d of toDelete) {
  try {
    fs.unlinkSync(d.fp);
    removed++;
  } catch (e) {
    console.error(`Failed to remove ${d.fp}: ${e.message}`);
  }
}
console.log(`Removed ${removed} duplicate files.`);

// 2. Rebrand all JSON files in place.
let rebranded = 0;
const allFiles = walk(OUTPUT);
for (const fp of allFiles) {
  if (fp.endsWith('.json')) {
    if (rebrandJsonFile(fp)) rebranded++;
  }
}
console.log(`Rebranded ${rebranded} JSON files.`);

// 3. Rebuild manifest.json with accurate counts.
const stats = { common: 0, rare: 0, epic: 0, legendary: 0 };
const ids = new Set();
for (const tier of TIERS) {
  const dir = path.join(OUTPUT, tier);
  if (!fs.existsSync(dir)) continue;
  const pngs = fs.readdirSync(dir).filter(f => f.endsWith('.png'));
  stats[tier] = pngs.length;
  for (const f of pngs) {
    const m = f.match(/^(\d+)\.png$/);
    if (m) ids.add(parseInt(m[1], 10));
  }
}

const manifest = {
  name: 'Blockbit Ink',
  description: '1,999 unique generative anime/pixel NFTs forged on Ink Superchain by Kraken.',
  website: 'https://blockbitink.xyz',
  totalSupply: 1999,
  uniqueTokens: ids.size,
  generatedAt: new Date().toISOString(),
  statistics: {
    common: stats.common,
    rare: stats.rare,
    epic: stats.epic,
    legendary: stats.legendary
  },
  rarityDistribution: {
    common: stats.common,
    rare: stats.rare,
    epic: stats.epic,
    legendary: stats.legendary
  }
};
fs.writeFileSync(path.join(OUTPUT, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`Manifest rebuilt: ${JSON.stringify(stats)}, unique tokens = ${ids.size}.`);