const { chromium } = require('playwright');

const TOKENS = {
  COMMON: [1001, 1002],
  RARE: [1, 100],
  EPIC: [10, 1003],
  LEGENDARY: [124, 1093]
};

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 2200, height: 2200 },
    deviceScaleFactor: 1
  });

  for (const [tier, ids] of Object.entries(TOKENS)) {
    for (const tokenId of ids) {
      const page = await context.newPage();
      const url = `http://localhost:3456/render-preview.html?id=${tokenId}&t=${Date.now()}`;
      console.log(`Rendering ${tier} #${tokenId}...`);
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.waitForFunction(() => {
        const c = document.getElementById('nft-canvas');
        if (!c) return false;
        const ctx = c.getContext('2d');
        const d = ctx.getImageData(0, 0, 1, 1).data;
        return d[3] > 0;
      }, { timeout: 15000 });

      const outPath = `C:\\Users\\maruf\\AppData\\Local\\Temp\\opencode\\nft-${tier.toLowerCase()}-${tokenId}.png`;
      const canvas = page.locator('#nft-canvas');
      await canvas.screenshot({ path: outPath });
      console.log(`  Saved: ${outPath}`);
      await page.close();
    }
  }

  await browser.close();
  console.log('Done!');
})();
