const path = require('path');
const os = require('os');
const { chromium } = require('playwright');

const TOKENS = {
  COMMON: [1001, 1002],
  RARE: [1, 100],
  EPIC: [10, 1003],
  LEGENDARY: [124, 1093]
};

const PAGE_URL = process.env.PAGE_URL || 'http://localhost:3456/render-preview.html';
const OUT_DIR = process.env.OUT_DIR || path.join(os.tmpdir(), 'blockbit-samples');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 2200, height: 2200 },
    deviceScaleFactor: 1
  });

  for (const [tier, ids] of Object.entries(TOKENS)) {
    for (const tokenId of ids) {
      const page = await context.newPage();
      const url = `${PAGE_URL}?id=${tokenId}&t=${Date.now()}`;
      console.log(`Rendering ${tier} #${tokenId}...`);
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.waitForFunction(() => {
        const c = document.getElementById('nft-canvas');
        if (!c) return false;
        const ctx = c.getContext('2d');
        const d = ctx.getImageData(0, 0, 1, 1).data;
        return d[3] > 0;
      }, { timeout: 15000 });

      const outPath = path.join(OUT_DIR, `nft-${tier.toLowerCase()}-${tokenId}.png`);
      const canvas = page.locator('#nft-canvas');
      await canvas.screenshot({ path: outPath });
      console.log(`  Saved: ${outPath}`);
      await page.close();
    }
  }

  await browser.close();
  console.log('Done!');
})();
