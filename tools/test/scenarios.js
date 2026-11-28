// Scenarios run inside page.html. Each resolves to { ok, summary }.
// The autoplayer plays like a reasonable (not perfect) player: taps through dialogue, takes the choices it's told
// to, taps hotspots, dodges cars and takes turns in the chase, keeps away from the light in the boat chase, and
// swipes into the channel. It reads game state through the window.__chase / __boat / __chan / __job hooks.

const sleep = ms => new Promise(r => setTimeout(r, ms));
const stage = () => document.getElementById('stage');
const fire = (type, x, y) => stage().dispatchEvent(new PointerEvent(type, { clientX: x, clientY: y, bubbles: true }));
const tapAt = (x, y) => { fire('pointerdown', x, y); fire('pointerup', x, y); };
const swipe = (game, dx, dy) => game.input.waiter?.up?.({ dx, dy, dt: 120, tap: false });

// Chase: take the turn when it's offered, otherwise move out of the way of the next car in your lane.
function steerChase(game, c) {
  const t = c.turnState?.();
  if (t) return swipe(game, 0, t.dir === 'up' ? -60 : 60);
  const car = c.obs.find(o => !o.hit && o.lane === c.lane && o.kind === 'sedan' && o.x < 200 && o.x > 20);
  if (car) swipe(game, 0, c.lane === 0 ? 60 : -60);
}
// Searchlight: head away from the helicopter's light, off the walls, out of the police boat's headlight.
function steerBoat(s) {
  let ax = s.bx - s.sx, ay = s.by - s.sy;
  const d = Math.hypot(ax, ay) || 1; ax /= d; ay /= d;
  const wall = (v, lo, hi) => (v < lo + 30 ? (lo + 30 - v) / 30 : 0) - (v > hi - 30 ? (v - hi + 30) / 30 : 0);
  ax += wall(s.bx, 22, 158) * 1.5;
  ay += wall(s.by, 60, 262) * 1.5 - (Math.abs(s.bx - s.px) < 24 && s.by > 190 ? 1 : 0);
  if (d > 90) { ax *= 0.2; ay *= 0.2; }
  s.tx = s.bx + ax * 40; s.ty = s.by + ay * 40;
}

function autoplay(game, picks = []) {
  let stop = false, side = 0, beat = 0, pickN = 0;
  const log = [];
  (async () => {
    while (!stop) {
      const w = game.input.waiter;
      const c = window.__chase, b = window.__boat, ch = window.__chan;
      if (c && !c.over && c.t > 0 && w?.up) { steerChase(game, c); await sleep(200); continue; }
      if (b && b.t > 0 && b.t < 25 && !b.over) { steerBoat(b); await sleep(100); continue; }
      if (ch && ch.gapY > 175 && ch.gapY < 222 && w?.up) { swipe(game, -60, 0); await sleep(150); continue; }
      const opts = [...document.querySelectorAll('[data-choice]')];
      if (opts.length) {
        const el = opts[Math.min(opts.length - 1, picks[pickN++] ?? 0)];
        const r = el.getBoundingClientRect();
        log.push(el.dataset.choice);
        tapAt(r.x + r.width / 2, r.y + r.height / 2);
        await sleep(400); continue;
      }
      if (w?.regions?.length) {
        const q = w.regions[0], r = game.canvas.getBoundingClientRect();
        tapAt(r.left + (q.x / 180) * r.width, r.top + (q.y / 320) * r.height);
        await sleep(300); continue;
      }
      if (w?.move && document.querySelector('.prompt.show .btn')?.textContent === 'SWIPE') {
        fire('pointerdown', 90, 360);
        for (let x = 90; x <= 290; x += 20) { fire('pointermove', x, 360); await sleep(16); }
        fire('pointerup', 290, 360);
        await sleep(300); continue;
      }
      // anything else: alternate left/right taps, with a long hold every third one (holds, taps, paddling, credits)
      const x = side++ % 2 ? 270 : 90;
      fire('pointerdown', x, 320);
      await sleep(beat++ % 3 === 2 ? 1800 : 60);
      fire('pointerup', x, 320);
      await sleep(120);
    }
  })();
  return { stop: () => { stop = true; }, log };
}

const timeout = (ms, what) => sleep(ms).then(() => { throw new Error(`timed out after ${ms / 1000}s ${what}`); });

export const scenarios = {
  // Play mission n start to finish. o: { n, picks, flags, hearts, money, expect: { flagPath: value } }
  async mission(game, radio, o) {
    const mod = await import(`../missions/beat${o.n}.js`);
    game.state = { mission: o.n, hearts: o.hearts ?? 2, money: o.money ?? 12, flags: o.flags ?? {} };
    radio.setContext(game.state.flags);
    const ap = autoplay(game, o.picks);
    const t0 = performance.now();
    // the finale ends by reloading the page: count reaching "The End" as done
    const theEnd = (async () => { while (!document.querySelector('.theend')) await sleep(250); })();
    try { await Promise.race([mod.default(game, radio), theEnd, timeout(240000, 'in mission ' + o.n)]); }
    finally { ap.stop(); }
    const s = game.state, secs = ((performance.now() - t0) / 1000).toFixed(0);
    const wrong = Object.entries(o.expect ?? {}).filter(([k, v]) => JSON.stringify(k.split('.').reduce((x, p) => x?.[p], s)) !== JSON.stringify(v));
    const next = o.n === 8 || s.mission === o.n + 1;
    return {
      ok: next && !wrong.length,
      summary: `${secs}s, picked [${ap.log}] → mission=${s.mission} hearts=${s.hearts} money=${s.money}`
        + (wrong.length ? ` · expected ${wrong.map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(', ')}` : '')
        + ` · flags ${JSON.stringify(s.flags)}`,
    };
  },

  // The car chase at each heat level, with a good driver: should always escape, with lead to spare.
  async chase(game) {
    const { chase } = await import('../missions/beat3.js');
    const out = [];
    let ok = true;
    for (const stars of [1, 2, 3]) {
      window.__chase = null;
      let minGap = 1;
      const ap = setInterval(() => { const c = window.__chase; if (c && !c.over && game.input.waiter?.up) steerChase(game, c); }, 250);
      const mon = setInterval(() => { if (window.__chase) minGap = Math.min(minGap, window.__chase.gap); }, 100);
      const r = await Promise.race([chase(game, stars, stars === 3 ? 0.72 : 0.62, 0, stars === 3 ? { day: true } : {}), timeout(90000, 'in chase')]);
      clearInterval(ap); clearInterval(mon);
      ok = ok && r === 'escaped';
      out.push(`${stars}🚨 ${r} (min lead ${minGap.toFixed(2)}, hits ${window.__chase.hits})`);
    }
    return { ok, summary: out.join(' · ') };
  },
};
