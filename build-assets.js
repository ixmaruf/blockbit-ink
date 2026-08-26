const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log('--- Step 1: Processing Logo & Avatar ---');
  const avatarPath = path.resolve('photo_2026-08-27_01-33-36 (2).jpg');
  const avatarBase64 = fs.readFileSync(avatarPath).toString('base64');
  const avatarDataUrl = `data:image/jpeg;base64,${avatarBase64}`;

  // Process Logo, Favicon, Avatar
  const logoDataUrls = await page.evaluate(async (dataUrl) => {
    const img = new Image();
    await new Promise((resolve) => {
      img.onload = resolve;
      img.src = dataUrl;
    });

    function getWebp(size, round = false) {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      
      if (round) {
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
      }

      // Draw image centered and square cropped
      const minDim = Math.min(img.width, img.height);
      const sx = (img.width - minDim) / 2;
      const sy = (img.height - minDim) / 2;
      ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
      return canvas.toDataURL('image/webp', 0.95);
    }

    return {
      logo512: getWebp(512, false),
      logo256: getWebp(256, false),
      favicon64: getWebp(64, true),
      favicon32: getWebp(32, true)
    };
  }, avatarDataUrl);

  function saveBase64Webp(dataUrl, destPath) {
    const base64Data = dataUrl.replace(/^data:image\/webp;base64,/, '');
    fs.writeFileSync(destPath, Buffer.from(base64Data, 'base64'));
    console.log(`Saved ${destPath} (${(fs.statSync(destPath).size / 1024).toFixed(1)} KB)`);
  }

  saveBase64Webp(logoDataUrls.logo512, path.resolve('logo.webp'));
  saveBase64Webp(logoDataUrls.logo256, path.resolve('avatar.webp'));
  saveBase64Webp(logoDataUrls.favicon64, path.resolve('favicon.webp'));
  saveBase64Webp(logoDataUrls.favicon32, path.resolve('favicon-32.webp'));
  saveBase64Webp(logoDataUrls.logo512, path.resolve('logo-purple.webp')); // overwrite old
  saveBase64Webp(logoDataUrls.logo512, path.resolve('logo-white.webp')); // overwrite old

  console.log('\n--- Step 2: Processing Top Curated NFT Characters from output/ ---');
  const previewDir = path.resolve('nft-preview');
  if (!fs.existsSync(previewDir)) fs.mkdirSync(previewDir, { recursive: true });

  const sampleFiles = [
    { folder: 'legendary', file: '1938.png', out: '1.webp' },
    { folder: 'legendary', file: '1375.png', out: '2.webp' },
    { folder: 'legendary', file: '1105.png', out: '3.webp' },
    { folder: 'legendary', file: '1533.png', out: '4.webp' },
    { folder: 'epic', file: '1070.png', out: '5.webp' },
    { folder: 'epic', file: '1793.png', out: '6.webp' },
    { folder: 'epic', file: '1311.png', out: '7.webp' },
    { folder: 'epic', file: '1003.png', out: '8.webp' },
    { folder: 'epic', file: '1996.png', out: '9.webp' },
    { folder: 'epic', file: '1691.png', out: '10.webp' },
    { folder: 'epic', file: '1484.png', out: '11.webp' },
    { folder: 'epic', file: '1518.png', out: '12.webp' }
  ];

  for (const item of sampleFiles) {
    const srcPath = path.resolve('output', item.folder, item.file);
    if (!fs.existsSync(srcPath)) {
      console.warn(`File missing: ${srcPath}`);
      continue;
    }
    const b64 = fs.readFileSync(srcPath).toString('base64');
    const dataUrl = `data:image/png;base64,${b64}`;

    const webpUrl = await page.evaluate(async (dUrl) => {
      const img = new Image();
      await new Promise(r => { img.onload = r; img.src = dUrl; });
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, 600, 600);
      return canvas.toDataURL('image/webp', 0.90);
    }, dataUrl);

    const dest = path.resolve('nft-preview', item.out);
    saveBase64Webp(webpUrl, dest);
  }

  // Create Robinhood Logo badge
  const robinhoodBadge = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    
    // Background Lemon Circle
    ctx.fillStyle = '#C6F221';
    ctx.beginPath();
    ctx.arc(100, 100, 95, 0, Math.PI * 2);
    ctx.fill();

    // Dark sleek Robinhood feather geometry
    ctx.fillStyle = '#0A0B0D';
    ctx.beginPath();
    ctx.moveTo(100, 30);
    ctx.quadraticCurveTo(155, 75, 140, 140);
    ctx.quadraticCurveTo(125, 165, 100, 175);
    ctx.quadraticCurveTo(75, 165, 60, 140);
    ctx.quadraticCurveTo(45, 75, 100, 30);
    ctx.fill();

    // Lemon feather slit
    ctx.strokeStyle = '#C6F221';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(100, 45);
    ctx.lineTo(100, 150);
    ctx.stroke();

    return canvas.toDataURL('image/webp', 0.95);
  });

  saveBase64Webp(robinhoodBadge, path.resolve('robinhood-logo.webp'));

  await browser.close();
  console.log('All assets processed successfully!');
})();
