// Renders the app icons (Jase's head over a pixel sunset) to app/icons/.
// Usage: node tools/make-icons.js
const path = require('path');
const { chromium } = require('playwright');

const html = `<canvas id="c" width="32" height="32"></canvas><script>
const g = document.getElementById('c').getContext('2d');
const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
['#2a1b4d', '#6e2a6a', '#c94e69', '#e8705f', '#f59a5a', '#f9c66b'].forEach((c, i) => R(0, i * 4, 32, 4, c));
R(0, 24, 32, 8, '#3f8a3a');
for (let dy = -5; dy <= 5; dy++) { const hw = Math.round(Math.sqrt(25 - dy * dy)); R(23 - hw, 13 + dy, hw * 2, 1, '#ffe08a'); }
const PAL = { h: '#3a2416', s: '#d9a066', e: '#1a1010', B: '#4a2e1c', g: '#9a9a96', G: '#7c7c78' };
const HEAD = ['..hhhh..', '.hhhhhh.', '.hsesse.', '.hssssh.', '.sBBBBs.', '..BBBB..', '...ss...', '.gggggg.', 'ggggggGg', 'ggggggGg'];
HEAD.forEach((row, y) => [...row].forEach((ch, x) => { if (PAL[ch]) R(4 + x * 2, 10 + y * 2, 2, 2, PAL[ch]); }));
</script>`;

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.setContent(html);
  const data = await p.evaluate(() => document.getElementById('c').toDataURL());
  for (const [name, size] of [['icon-192', 192], ['icon-512', 512], ['apple-touch-icon', 180]]) {
    const q = await b.newPage({ viewport: { width: size, height: size } });
    await q.setContent(`<body style="margin:0"><img src="${data}" style="width:${size}px;height:${size}px;image-rendering:pixelated;display:block">`);
    await q.screenshot({ path: path.join(__dirname, '../app/icons', name + '.png') });
    await q.close();
  }
  await b.close();
  console.log('icons written');
})();
