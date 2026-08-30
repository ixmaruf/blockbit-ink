const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, 'output');
const PREVIEW_DIR = path.join(__dirname, 'nft-preview');
const LEGENDARY_DIR = path.join(OUTPUT_DIR, 'legendary');

// The 25 flawless royal tokens with crowns properly resting on the head & rich background FX:
const FLAWLESS_25_IDS = [
  129, 350, 356, 415, 438, 
  475, 503, 594, 682, 719, 
  849, 963, 1088, 1134, 1158, 
  1313, 1492, 1576, 1644, 1671, 
  1765, 1820, 1826, 1878, 1944
].sort((a, b) => a - b);

console.log('Rendering Flawless 25 Royal Legendary NFTs:', FLAWLESS_25_IDS);

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 2200, height: 2200 } });

  await page.goto('http://localhost:8000/?v=flawless_gen', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);

  // Setup 2000x2000 canvas
  await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 2000;
    canvas.height = 2000;
    canvas.id = '_royalCanvas';
    canvas.style.display = 'none';
    document.body.appendChild(canvas);
    window._royalRenderer = new NFTRenderer(canvas);
  });

  // Clean legendary directory
  if (!fs.existsSync(LEGENDARY_DIR)) fs.mkdirSync(LEGENDARY_DIR, { recursive: true });
  const existingFiles = fs.readdirSync(LEGENDARY_DIR);
  for (const f of existingFiles) {
    fs.unlinkSync(path.join(LEGENDARY_DIR, f));
  }

  for (const tid of FLAWLESS_25_IDS) {
    const seed = tid * 7919 + 31337;

    const res = await page.evaluate((args) => {
      const { tokenId, seed } = args;
      const nftData = generateNFT(seed);

      // Set Rarity to Legendary
      nftData.rarity = RARITY.LEGENDARY;

      window._royalRenderer.clear();
      window._royalRenderer.render(nftData);

      const canvas = document.getElementById('_royalCanvas');
      const imageData = canvas.toDataURL('image/png');

      const metadata = generateMetadata(tokenId, nftData);
      metadata.image = `images/legendary/${tokenId}.png`;
      metadata.properties.files = [
        {
          uri: `images/legendary/${tokenId}.png`,
          type: "image/png"
        }
      ];

      return {
        imageData,
        metadata
      };
    }, { tokenId: tid, seed });

    // Save PNG
    const base64Data = res.imageData.replace(/^data:image\/png;base64,/, '');
    const pngPath = path.join(LEGENDARY_DIR, `${tid}.png`);
    fs.writeFileSync(pngPath, base64Data, 'base64');

    // Save JSON
    const jsonPath = path.join(LEGENDARY_DIR, `${tid}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(res.metadata, null, 2));

    console.log(`[OK] Rendered Royal Legendary #${tid}`);
  }

  await browser.close();
  console.log('All 25 Royal Legendary NFTs generated flawlessly!');
}

main().catch(console.error);
