# 🌸 Blockbit Ink — Enchanted 3D Anime NFT Realm & Whitelist Portal

[![Ink Superchain](https://img.shields.io/badge/Blockchain-Ink%20L2%20(Kraken)-8b5cf6?style=for-the-badge)](https://inkonchain.com)
[![Three.js](https://img.shields.io/badge/3D%20Engine-Three.js-0ea5e9?style=for-the-badge)](https://threejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-10b981?style=for-the-badge)](#license)
[![GitHub Pages Ready](https://img.shields.io/badge/GitHub%20Pages-Ready%20to%20Deploy-f59e0b?style=for-the-badge)](#github-pages-deployment)

**Blockbit Ink** is an anime-themed generative NFT collection of 1,999 warriors on the **Ink Superchain L2** (powered by Kraken & Optimism OP Stack). This repository contains the complete interactive 3D WebGL website, rarity showroom, multi-step whitelist quest ritual, procedural canvas pass generator, and automated admin raffle management system.

---

## 🌟 Key Features

### ⛩️ 1. Living 3D WebGL Enchanted Village (`index.html`)
- **Procedural 3D Environment**: Built with Three.js featuring Japanese pagoda houses, glowing paper lanterns, sakura blossom trees, cascading rivers, bridges, waterfalls, and floating firefly particle systems.
- **Dynamic Sunset Atmosphere**: Volumetric fog, soft sunset lighting, floating glowing runes, and customizable day/night shaders.
- **Interactive Orbit Camera & Ambient Audio**: 360° free orbit camera controls and a real-time web audio procedural ambient sound synthesizer.
- **Sacred 3D Showroom**: Rarity filters (`Legendary`, `Epic`, `Rare`, `Common`), trait inspector modal, live 3D character preview, and full trait DNA matrix breakdown.

### 📜 2. Whitelist Ritual & Quest Portal (`whitelist.html`)
- **Multi-Step Guided Application**: 4-step interactive flow (Wallet Verification, Social Quests, Clan Selection, Mint Ticket Generation).
- **Ink / EVM Address Validation**: Regex verification for standard Ethereum/Ink wallet addresses (`0x...`).
- **Interactive Clan Selection**: Choose between 4 sacred warrior clans (*Sylvan Ronin*, *Spirit Shinobi*, *River Guardians*, *Shadow Mages*).
- **Holographic Mint Pass Generator**: Dynamically renders a custom Japanese cyberpunk mint pass on an HTML5 Canvas with custom serial numbers, holographic badges, and 1-click **PNG Download**.
- **Admin Raffle Manager & OpenSea Exporter**:
  - Hidden Admin Console (Press `Ctrl + Shift + A` / `Cmd + Shift + A` or click "Admin Console" in footer).
  - Fair Random Winner Picker with rolling roulette animation.
  - 1-click export to **OpenSea Allowlist CSV** and **JSON** format.

---

## 📁 Repository Structure

```
├── index.html              # 🏠 Main Landing Page, 3D WebGL Realm & Showroom
├── whitelist.html          # 📜 Whitelist Application & Mint Pass Ritual
├── style.css               # 🎨 Cyber-Fantasy Design System & Responsive Styles
├── three-village-world.js  # 🌸 3D Procedural Village World Simulation (Three.js)
├── app.js                  # ⚡ Main Page UI Logic, Showroom Filters & Modals
├── whitelist.js            # 🎫 Whitelist Form Logic, Canvas Pass & Admin Raffle
├── traits.js               # 🧬 100+ Trait Definitions & Rarity DNA Matrix
├── generator.js            # 🖼️ Generative Character Rendering Engine
├── profile-picture.html    # 🖼️ Standalone Avatar & PFP Visualizer Sandbox
├── render-preview.html     # 🔍 Single NFT Render Sandbox
├── server.js               # 🚀 Lightweight Local Development Web Server
├── package.json            # 📦 Project Scripts & Metadata
├── .gitignore              # 🛡️ Git Ignore Configuration (skips heavy build folders)
├── logo-purple.jpg         # 🔮 Primary Brand Logo
├── logo-white.jpg          # ⚪ Secondary White Logo
├── ink-logo.webp           # 🐙 Ink Blockchain Superchain Badge
└── nft-preview/            # 🎴 Sample High-Resolution Character Previews
    ├── 1.png
    ├── 42.png
    ├── 100.png
    ├── 200.png
    ├── 300.png
    ├── 500.png
    ├── 700.png
    └── 1000.png
```

---

## 🚀 How to Run Locally

### Option 1: Using the Built-in Node Server (Recommended)
```bash
# 1. Start the local server
npm start
# or
node server.js

# 2. Open in your browser:
http://localhost:3456
```

### Option 2: Direct Browser Launch
Simply double-click `index.html` or `whitelist.html` in your file explorer, or use the **Live Server** extension in VS Code.

---

## 🌐 How to Upload to GitHub & Deploy Live (GitHub Pages)

### Step 1: Initialize Git and Commit
Open a terminal (PowerShell / Command Prompt / Git Bash) inside this folder:

```bash
# 1. Initialize Git repository
git init

# 2. Add all clean project files
git add .

# 3. Create your initial commit
git commit -m "Initial commit: Blockbit Ink 3D NFT Realm & Whitelist"

# 4. Set main branch
git branch -M main

# 5. Connect to your GitHub repository (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# 6. Push to GitHub
git push -u origin main
```

### Step 2: Enable Free Live Hosting on GitHub Pages
1. Go to your repository on **GitHub.com**.
2. Click **Settings** (⚙️) at the top.
3. In the left sidebar, click **Pages**.
4. Under **Build and deployment** > **Source**, select `Deploy from a branch`.
5. Under **Branch**, select `main` and folder `/ (root)`, then click **Save**.
6. After 1 minute, your website will be live at:
   `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`

---

## 🔐 Admin Console Shortcut
On `whitelist.html`, press:
- **Windows / Linux**: `Ctrl + Shift + A`
- **Mac**: `Cmd + Shift + A`

Or scroll to the footer and click `[ ⚙️ Admin Console ]` to manage applicants, spin the raffle, and export CSVs for OpenSea.

---

## 📄 License
This project is open source and available under the [MIT License](LICENSE).
