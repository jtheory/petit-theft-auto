// Renders storyboard frames from docs/storyboard/frames.html to PNGs.
// Usage: node tools/render-storyboard.js [outDir]
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const FRAMES = ['establish', 'phone', 'repair', 'porch', 'passed'];
const src = 'file://' + path.resolve(__dirname, '../docs/storyboard/frames.html');
const out = path.resolve(process.argv[2] || path.join(__dirname, '../docs/storyboard/beat1'));

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 2 });
  for (const [i, f] of FRAMES.entries()) {
    await page.goto(src + '#' + f);
    await page.reload();
    await page.waitForFunction(() => document.title === 'ready');
    await page.locator('#frame').screenshot({ path: path.join(out, `${i + 1}-${f}.png`) });
  }
  await browser.close();
  console.log('wrote', FRAMES.length, 'frames to', out);
})();
