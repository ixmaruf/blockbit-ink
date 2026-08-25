const pw = require('playwright');
(async () => {
  const b = await pw.chromium.launch();
  const p = await b.newPage();
  
  // 2000x2000 render
  await p.setViewportSize({ width: 2000, height: 2000 });
  await p.goto('file:///C:/Users/maruf/Downloads/NFT/profile-picture.html?v=' + Date.now());
  await p.waitForTimeout(2000);
  await p.screenshot({ path: 'C:/Users/maruf/AppData/Local/Temp/opencode/pp-check.png', fullPage: false });
  
  // Full output 2000x2000
  await p.setViewportSize({ width: 2000, height: 2000 });
  await p.goto('file:///C:/Users/maruf/Downloads/NFT/profile-picture.html?v=' + Date.now());
  await p.waitForTimeout(2000);
  await p.screenshot({ path: 'C:/Users/maruf/Downloads/NFT/output/blockbit-ink-profile.png', fullPage: false });
  
  // 400x400 version
  await p.setViewportSize({ width: 400, height: 400 });
  await p.goto('file:///C:/Users/maruf/Downloads/NFT/profile-picture.html?v=' + Date.now());
  await p.waitForTimeout(2000);
  await p.screenshot({ path: 'C:/Users/maruf/Downloads/NFT/output/blockbit-ink-profile-400.png', fullPage: false });
  
  await b.close();
  console.log('DONE');
})();

