// Renders storyboard frames from docs/storyboard/frames.html to PNGs, plus one contact sheet per beat.
// Frame names look like "b2-drive"; output goes to docs/storyboard/beat2/1-drive.png and beat2-sheet.png.
// Usage: node tools/render-storyboard.js [beatPrefix]   e.g. "b2" to render only Beat 2
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const dir = path.resolve(__dirname, '../docs/storyboard');
const src = 'file://' + path.join(dir, 'frames.html');
const only = process.argv[2];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 2 });
  await page.goto(src);
  await page.waitForFunction(() => document.title === 'ready');
  const names = (await page.evaluate(() => window.FRAME_NAMES)).filter(n => !only || n.startsWith(only + '-'));

  const beats = {};
  for (const n of names) (beats[n.split('-')[0]] ||= []).push(n);

  for (const [beat, frames] of Object.entries(beats)) {
    const num = beat.slice(1), outDir = path.join(dir, 'beat' + num);
    fs.mkdirSync(outDir, { recursive: true });
    const files = [];
    for (const [i, f] of frames.entries()) {
      await page.goto(src + '#' + f);
      await page.reload();
      await page.waitForFunction(() => document.title === 'ready');
      const file = path.join(outDir, `${i + 1}-${f.slice(beat.length + 1)}.png`);
      await page.locator('#frame').screenshot({ path: file });
      files.push(file);
    }
    // contact sheet
    const sheet = await browser.newPage({ deviceScaleFactor: 1 });
    await sheet.setContent(`<body style="margin:0;background:#1a1a1a;display:inline-flex;gap:24px;padding:24px">${
      files.map(f => `<img src="data:image/png;base64,${fs.readFileSync(f).toString('base64')}" width="720" height="1280">`).join('')}</body>`);
    await sheet.locator('body').screenshot({ path: path.join(dir, `beat${num}-sheet.png`) });
    await sheet.close();
    console.log(`beat ${num}: ${files.length} frames`);
  }
  await browser.close();
})();
