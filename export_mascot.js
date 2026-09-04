const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 2200, height: 2200 } });
  
  await page.goto('https://dudescraft.store/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  // Render 1: Royal Crown King (Flawless Mascot)
  const base64Data = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 2000;
    canvas.height = 2000;
    const renderer = new NFTRenderer(canvas);
    
    // Generate NFT
    const nftData = generateNFT(1820 * 7919 + 31337);
    nftData.rarity = RARITY.LEGENDARY;
    // Remove detached floating accessory to make mascot perfectly centered
    if (nftData.traits) {
      nftData.traits.accessory = { name: "None", value: "none" };
    }
    
    renderer.clear();
    renderer.render(nftData, { transparent: true });
    
    const ctx = canvas.getContext('2d');
    const imgData = ctx.getImageData(0, 0, 2000, 2000);
    const data = imgData.data;
    let minX = 2000, minY = 2000, maxX = 0, maxY = 0;
    for (let y = 0; y < 2000; y++) {
      for (let x = 0; x < 2000; x++) {
        const idx = (y * 2000 + x) * 4;
        if (data[idx + 3] > 0) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    
    const pad = 20;
    minX = Math.max(0, minX - pad);
    minY = Math.max(0, minY - pad);
    maxX = Math.min(1999, maxX + pad);
    maxY = Math.min(1999, maxY + pad);
    
    const w = maxX - minX + 1;
    const h = maxY - minY + 1;
    
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = w;
    cropCanvas.height = h;
    const cropCtx = cropCanvas.getContext('2d');
    cropCtx.imageSmoothingEnabled = false;
    cropCtx.drawImage(canvas, minX, minY, w, h, 0, 0, w, h);
    
    return cropCanvas.toDataURL('image/png').split(',')[1];
  });

  const buffer = Buffer.from(base64Data, 'base64');
  fs.writeFileSync(path.join(__dirname, 'mascot_transparent.png'), buffer);
  console.log('Saved clean mascot_transparent.png');

  // Render 2: Cyber Visor Voxel Warrior
  const base64Data2 = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 2000;
    canvas.height = 2000;
    const renderer = new NFTRenderer(canvas);
    
    const nftData = generateNFT(1765 * 7919 + 31337);
    nftData.rarity = RARITY.LEGENDARY;
    if (nftData.traits) {
      nftData.traits.accessory = { name: "None", value: "none" };
    }
    
    renderer.clear();
    renderer.render(nftData, { transparent: true });
    
    const ctx = canvas.getContext('2d');
    const imgData = ctx.getImageData(0, 0, 2000, 2000);
    const data = imgData.data;
    let minX = 2000, minY = 2000, maxX = 0, maxY = 0;
    for (let y = 0; y < 2000; y++) {
      for (let x = 0; x < 2000; x++) {
        const idx = (y * 2000 + x) * 4;
        if (data[idx + 3] > 0) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    
    const pad = 20;
    minX = Math.max(0, minX - pad);
    minY = Math.max(0, minY - pad);
    maxX = Math.min(1999, maxX + pad);
    maxY = Math.min(1999, maxY + pad);
    
    const w = maxX - minX + 1;
    const h = maxY - minY + 1;
    
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = w;
    cropCanvas.height = h;
    const cropCtx = cropCanvas.getContext('2d');
    cropCtx.imageSmoothingEnabled = false;
    cropCtx.drawImage(canvas, minX, minY, w, h, 0, 0, w, h);
    
    return cropCanvas.toDataURL('image/png').split(',')[1];
  });

  const buffer2 = Buffer.from(base64Data2, 'base64');
  fs.writeFileSync(path.join(__dirname, 'mascot_cyber_transparent.png'), buffer2);
  console.log('Saved clean mascot_cyber_transparent.png');

  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
