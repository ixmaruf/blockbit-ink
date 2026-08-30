# Dudes Craft — 1,999 3D Voxel Warriors & Whitelist Portal

[![Robinhood Network](https://img.shields.io/badge/Blockchain-Robinhood%20Network-C6F221?style=for-the-badge)](https://dudescraft.store)
[![HTML5 Canvas](https://img.shields.io/badge/Engine-HTML5%20Canvas-0ea5e9?style=for-the-badge)](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
[![License: MIT](https://img.shields.io/badge/License-MIT-10b981?style=for-the-badge)](#license)
[![GitHub Pages Ready](https://img.shields.io/badge/GitHub%20Pages-Ready%20to%20Deploy-f59e0b?style=for-the-badge)](#github-pages-deployment)

**Dudes Craft** is a generative 3D voxel NFT collection of 1,999 warriors on the **Robinhood Network**. This repository contains the complete editorial landing page, procedural voxel DNA forge, rarity showroom, anti-bot multi-step whitelist application, OpenSea-compatible batch generator, and metadata collection.

---

## Key Features

### 1. Landing Page & Editorial Showroom (`index.html`)
- **Editorial cyber-fantasy design system**: Cormorant Garamond (serif) + DM Sans (sans) over a parchment + violet + azure palette.
- **Ambient layer**: fixed-position canvas with 60 drifting particles, 30 falling petals, and a subtle grain overlay.
- **Sections**: top countdown banner, hero with stats counter, animated text + image marquees, lore editorial, **DNA Forge** (randomises a procedural pixel warrior), showcase gallery, utility, six elemental clans, roadmap, FAQ, CTA, footer.
- **Interactive counters** and **IntersectionObserver scroll-reveal** throughout.
- **Live DNA Forge canvas** renders a 2000x2000 procedural warrior with full trait DNA breakdown using `traits.js` + `generator.js`.

### 2. Whitelist Application (`whitelist.html`)
- **4-step interactive flow**: Social handle, Wallet verification (EVM/Ink `0x...` regex), Clan selection (Kaze / Honoo / Mizu / Tsuchi / Hikari / Kage), Mint Ticket generation.
- **Real client-side validation**: Twitter handle pattern, EVM address checksum, required-field guards.
- **Holographic Mint Pass generator**: HTML5 Canvas with serial number, clan sigil, QR placeholder, and 1-click PNG download.
- **Local storage queue** so applicants can re-open the page without losing progress. **No backend yet** — wire to your preferred store (Supabase / Cloudflare KV / Formspree) before going live.

### 3. NFT Renderer (`generator.js` + `traits.js`)
- **Deterministic seeded PRNG** (Park-Miller / Lehmer, `16807 mod 2^31-1`) — same `seed` always yields the same NFT.
- **12 trait categories**: skin, hair style, hair color, eyes, eye color, mouth, accessory, headwear, outfit, outfit color, background, background effect.
- **Color harmony engine**: complementary / triadic HSL math + WCAG 2.1 contrast checks so character pixels always pop against the background.
- **Rarity tiers**: Common → Rare → Epic → Legendary, each with its own visual multiplier (extra particles, glow rings, gold border, etc.).
- **Solid-color unique backgrounds**: 1,999 HSL triplets spread via golden-ratio distribution.

### 4. Batch Generator (`generate.js`)
- Playwright-driven Chromium pipeline that renders all 1,999 NFTs + OpenSea-compatible metadata into `output/{common,rare,epic,legendary}/`.
- Each folder holds paired `tokenId.png` + `tokenId.json` + a top-level `manifest.json` with statistics.

### 5. Renderer Sandbox (`render-preview.html` + `profile-picture.html`)
- `render-preview.html?id=N` renders a single warrior for sharing/QA.
- `profile-picture.html` is a self-contained 2000x2000 anime-profile banner generator (no external deps).

---

## Repository Structure

```
├── index.html              # Landing page, DNA forge, showcase, roadmap, FAQ
├── whitelist.html          # 4-step application + canvas mint pass
├── style.css               # Editorial design system + responsive styles
├── app.js                  # Page UI, nav, ambient canvas, petals, forge renderer, countdown
├── whitelist.js            # Whitelist step-controller (loaded by whitelist.html)
├── traits.js               # Trait system, PRNG, color harmony, rarity, metadata
├── generator.js            # NFTRenderer — draws every pixel-art layer onto <canvas>
├── generate.js             # Playwright batch generator (1,999 NFTs + metadata)
├── profile-picture.html    # Standalone 2000x2000 PFP banner sandbox
├── render-preview.html     # Single-NFT render sandbox (?id=N)
├── capture-samples.js      # QA script — captures one NFT per rarity tier
├── screenshot-pp.js        # QA script — screenshots profile-picture.html
├── server.js               # Lightweight local development web server
├── package.json            # Scripts & metadata
├── .gitignore              # Skips heavy build folders (output/, node_modules/)
├── logo-purple.jpg         # Primary brand logo
├── logo-white.jpg          # Secondary white logo
├── ink-logo.webp           # Ink Superchain badge
└── nft-preview/            # Sample warrior previews (1, 42, 100, 200, ..., 1999)
```

---

## How to Run Locally

### Option 1 — Built-in Node server (Recommended)
```bash
npm install            # installs Playwright only
npx playwright install chromium   # one-time browser download
npm start              # launches server.js on http://localhost:3456
```

### Option 2 — Direct browser
Double-click `index.html` or `whitelist.html`, or use the **Live Server** extension in VS Code. (The dynamic features work best when served over HTTP rather than `file://`.)

### Regenerate the full collection
```bash
npm run generate       # requires the local server to be running on :3456
```

---

## Deploy to GitHub Pages

```bash
git init            # if not already a repo
git add .
git commit -m "Initial commit: Blockbit Ink"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

Then in GitHub: **Settings → Pages → Build and deployment → Source: `main`, Folder: `/ (root)` → Save.**

Your site will be live at `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/` within ~1 minute.

> Note: the `output/` folder is gitignored (it can grow to several GB). For NFT metadata hosting use IPFS / Arweave / a static CDN after running `npm run generate`.

---

## License

This project is open source under the [MIT License](LICENSE).
