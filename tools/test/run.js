// Autoplay tests: each one plays part of the game in headless Chromium and checks where it ends up.
//   node tools/test/run.js            run everything (a few minutes; tests run 3 at a time)
//   node tools/test/run.js m5 chase   run tests whose name starts with any of these
// Needs Playwright (npm i -g playwright, then npx playwright install chromium). Serves app/ itself on a free port.
// Screenshots of failures land in tools/test/out/.

const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');

const APP = path.join(__dirname, '../../app'), OUT = path.join(__dirname, 'out');
const M2_FLAGS = { roofFixed: true, porchPainted: true, grouted: true, ma: 'honest' };

// name → what to run. Mission tests: picks = which choice to tap each time one comes up (0 = first).
const TESTS = {
  m1:        { n: 1, picks: [1, 0, 0] },
  m2:        { n: 2, picks: [0], flags: M2_FLAGS },
  m3:        { n: 3, picks: [2, 0, 0] },
  m4:        { n: 4, picks: [0], flags: { roofFixed: true } },
  'm5-yes':  { n: 5, picks: [0, 0] },
  'm5-ignore': { n: 5, picks: [2, 0] },
  m6:        { n: 6, picks: [] },
  'm7-lucita': { n: 7, picks: [0, 0], expect: { 'flags.trusted': 'lucita', 'flags.take': 1050000 } },
  'm7-pay':  { n: 7, picks: [1, 1, 1, 1, 1, 1], expect: { 'flags.trusted': 'pay', 'flags.take': 700000 } },
  'm7-jump': { n: 7, picks: [2, 2, 2, 2, 2, 2], expect: { 'flags.take': 700000 } },  // the autoplayer is too slow to win the struggle
  m8:        { n: 8, picks: [], flags: { ring: 'got', trusted: 'lucita', take: 1050000 }, money: 1050000 },
  chase:     { scenario: 'chase' },
  continue:  { page: 'continue' },
};

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
function serve() {
  const server = http.createServer((req, res) => {
    const u = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const file = u.startsWith('/__test/') ? path.join(__dirname, u.slice(8)) : path.join(APP, u === '/' ? 'index.html' : u);
    fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
      res.end(data);
    });
  });
  return new Promise(r => server.listen(0, '127.0.0.1', () => r(server)));
}

// The title screen offers Continue / New game for a save past Mission 1.
async function continueTest(browser, base) {
  const out = [];
  for (const pick of ['continue', 'new']) {
    const p = await browser.newPage({ viewport: { width: 360, height: 640 } });
    await p.goto(base + '/sfx.html');
    await p.evaluate(() => localStorage.setItem('pta-save-v1', JSON.stringify({ mission: 3, hearts: 1, money: 196, flags: { porchPainted: true } })));
    await p.goto(base + '/index.html?desktop');
    const tap = async ms => { await p.waitForTimeout(ms); await p.mouse.click(180, 320); };
    await tap(800); await tap(1400); await tap(5000);   // desktop gate, warning, shaders → title
    await p.waitForSelector('[data-choice="continue"]', { timeout: 8000 });
    await p.click(`[data-choice="${pick}"]`);
    await p.waitForTimeout(2500);
    out.push([pick, await p.evaluate(() => game.state.mission)]);
    await p.close();
  }
  const [[, cont], [, fresh]] = out;
  return { ok: cont === 3 && fresh === 1, summary: `continue → mission ${cont}, new game → mission ${fresh}` };
}

async function runOne(browser, base, name, t) {
  if (t.page === 'continue') return continueTest(browser, base);
  const p = await browser.newPage({ viewport: { width: 360, height: 640 } });
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  const [scenario, o] = t.scenario ? [t.scenario, {}] : ['mission', t];
  await p.goto(`${base}/__test/page.html?s=${scenario}&o=${encodeURIComponent(JSON.stringify(o))}`);
  let r;
  try { r = await (await p.waitForFunction(() => window.result, null, { timeout: 300000, polling: 500 })).jsonValue(); }
  catch (e) { r = { ok: false, summary: String(e.message).split('\n')[0] }; }
  if (errors.length) r = { ok: false, summary: `${r.summary} · page errors: ${errors.join(' | ')}` };
  if (!r.ok) { fs.mkdirSync(OUT, { recursive: true }); await p.screenshot({ path: path.join(OUT, name + '.png') }).catch(() => {}); }
  await p.close();
  return r;
}

(async () => {
  const want = process.argv.slice(2);
  const names = Object.keys(TESTS).filter(n => !want.length || want.some(w => n.startsWith(w)));
  const server = await serve(), base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const queue = [...names], results = {};
  const t0 = Date.now();
  await Promise.all([0, 1, 2].map(async () => {
    while (queue.length) {
      const name = queue.shift();
      const r = await runOne(browser, base, name, TESTS[name]);
      results[name] = r;
      console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${name.padEnd(10)} ${r.summary}`);
    }
  }));
  await browser.close(); server.close();
  const failed = names.filter(n => !results[n].ok);
  console.log(`\n${names.length - failed.length}/${names.length} passed in ${Math.round((Date.now() - t0) / 1000)}s${failed.length ? ' · failed: ' + failed.join(', ') : ''}`);
  process.exit(failed.length ? 1 : 0);
})();
