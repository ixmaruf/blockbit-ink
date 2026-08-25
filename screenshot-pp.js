const path = require('path');
const os = require('os');
const pw = require('playwright');

const PROJECT_DIR = __dirname;
const OUT_DIR = process.env.OUT_DIR || PROJECT_DIR;
const TMP_DIR = process.env.TMP_DIR || os.tmpdir();

(async () => {
  const b = await pw.chromium.launch();
  const p = await b.newPage();

  const url = 'file:///' + path.join(PROJECT_DIR, 'profile-picture.html').replace(/\\/g, '/') + '?v=' + Date.now();

  // 2000x2000 render — verify path
  await p.setViewportSize({ width: 2000, height: 2000 });
  await p.goto(url);
  await p.waitForTimeout(2000);
  await p.screenshot({ path: path.join(TMP_DIR, 'pp-check.png'), fullPage: false });

  // Full output 2000x2000
  await p.setViewportSize({ width: 2000, height: 2000 });
  await p.goto(url);
  await p.waitForTimeout(2000);
  await p.screenshot({ path: path.join(OUT_DIR, 'blockbit-ink-profile.png'), fullPage: false });

  // 400x400 version
  await p.setViewportSize({ width: 400, height: 400 });
  await p.goto(url);
  await p.waitForTimeout(2000);
  await p.screenshot({ path: path.join(OUT_DIR, 'blockbit-ink-profile-400.png'), fullPage: false });

  await b.close();
  console.log('DONE');
})();
