// Mission 6 (Mission 5 in-game): In Deep Water. A borrowed speedboat, a helicopter, a mangrove channel.
// See docs/storyboard.md, Beat 6.
//
//   hotwire     RAPID TAP
//   searchlight top-down. DRAG anywhere to steer the boat (it follows your finger, at a boat's speed).
//               Keep out of the helicopter's roving light, and out of the police boat's headlight at the
//               bottom. "Spotted" fills while lit; full = BUSTED, retry. Survive about 25 seconds.
//   channel     SWIPE ↑ for "hard left" into the channel (miss it and you get yelled at, nothing worse)
//   lost them   +1 heart ("That felt fun.")

import { sfx } from '../audio/sfx.js';
import { playLoop } from '../audio/music.js';

const SURVIVE = 25;

export default async function inDeepWater(game, radio) {
  const { ui, say, input, state } = game;
  const f = state.flags;

  // ---------------- The marina ----------------
  const mk = { bx: 70 };
  game.setScene(a => { a.marina(); a.speedboat(Math.round(mk.bx), 236, true); });
  ui.letterbox(true);
  sfx.play('card');
  await ui.card('Mission 5  ·  Bayside Yacht Club', 'In Deep Water', 3000);
  ui.letterbox(false);
  await say('JASE', "It's not stealing. It's a test drive.", 'jase');
  await say('LUCITA', "Hey. It's called Reel Estate.", 'lucita');
  await say('LUCITA', "...That's clever. I hate that that's clever.", 'lucita');
  let fill = ui.prompt('RAPID TAP', 'Hotwire it');
  await input.taps(8, p => { fill(p); sfx.play('grout'); });
  ui.prompt(null);
  sfx.play('engine');
  await game.wait(600);
  ui.dim(true, 1);
  await game.wait(500);

  // ---------------- The searchlight ----------------
  const music = await playLoop('chase', { vol: 0.8 });
  f.boatBusts = 0;
  for (;;) {
    const ok = await searchlight(game, f.boatBusts);
    if (ok) break;
    f.boatBusts++;
    music.stop(0.2);
    sfx.play('busted');
    ui.hud(null);
    ui.dim(true, 0.55);
    const lines = ['They have a helicopter, Jase.', 'Stay. Out. Of. The. Light.', 'It is a very big light.'];
    ui.el('busted', 'passed busted', `<div class="big">BUSTED</div><div class="mn">In Deep Water</div>
      <div class="fx">Lucita: "${lines[Math.min(f.boatBusts - 1, 2)]}"</div><div class="cont">Tap to retry</div>`);
    await game.wait(1200);
    await input.tap();
    ui.hide('busted');
    ui.dim(false);
    Object.assign(music, await playLoop('chase', { vol: 0.8 }));
  }

  // ---------------- Hard left ----------------
  const ch = { scroll: 0, boatX: 90 };
  game.setScene((a, t, dt) => {
    ch.scroll += dt * 80;
    a.channel(ch.scroll);
    a.speedboatTop(Math.round(ch.boatX), 230, t);
  });
  ui.hud({ hearts: state.hearts, money: state.money, time: '9:43 PM', wanted: 3, minimap: false });
  await say('JASE', 'Hard left into the channel. Tide is too low for the cutters.', 'jase', { passive: true, hold: 200 });
  sfx.play('prompt');
  ui.prompt('SWIPE ↑', 'Hard left', 'high');
  const turned = await Promise.race([
    new Promise(r => { input.waiter = { up(g) { if (g.dy < -35) { input.waiter = null; r(true); } }, down() {}, move() {}, done() {} }; }),
    game.wait(3500).then(() => false),
  ]);
  input.waiter = null;
  ui.prompt(null);
  f.hardLeft = turned;
  if (turned) { sfx.play('screech'); await game.tween(ch, 'boatX', 40, 500, 'out'); }
  else await say('LUCITA', 'LEFT, Jase. The channel was on the LEFT.', 'lucita');
  await say('LUCITA', 'Jase, if we die out here—', 'lucita');
  await say('JASE', "We're not dying out here. We still have that coupon for the escape room.", 'jase');
  music.stop(2.5);

  // ---------------- Lost them ----------------
  const lo = { heartY: null };
  game.setScene((a, t) => {
    a.nightWater();
    for (let i = 0; i < 60; i++) a.R((i * 31) % 180, (i * 13) % 160, 1, 1, '#fff');
    a.speedboat(46, 240 + Math.round(Math.sin(t * 1.5)), true);
    if (lo.heartY !== null) a.pixelHeart(80, Math.round(lo.heartY));
  });
  ui.hud({ hearts: state.hearts, money: state.money, time: '10:02 PM', minimap: false });
  ui.el('lost', 'passed', '<div class="big" style="font-size:22px;color:#9be37a;text-shadow:0 2px 0 #1b3a12;margin-top:-100px">WANTED: you&rsquo;re clear</div>');
  await game.wait(2200);
  ui.hide('lost');
  await say('LUCITA', '...Was that fun? That felt fun.', 'lucita');
  await say('JASE', 'That felt fun.', 'jase');
  state.hearts = Math.min(4, state.hearts + 1);
  lo.heartY = 206;
  game.tween(lo, 'heartY', 190, 1400, 'out');
  sfx.play('heartUp');
  ui.hud({ hearts: state.hearts, money: state.money, time: '10:02 PM', minimap: false });
  ui.toast('Relationship ↑', 'Shared near-death experience.', '#ff5d8f');
  await game.wait(2600);

  ui.hud(null);
  ui.dim(true, 0.45);
  sfx.play('passed');
  await ui.passed('MISSION PASSED', 'In Deep Water', 'Boats returned: 0', f.boatBusts ? `Helicopter encounters: ${f.boatBusts + 1}` : 'Reel Estate is in a better place.', () => input.tap());
  ui.dim(false);
  state.mission = 7;
  game.save();
}

// Keep the boat out of the light. Resolves true if you last SURVIVE seconds. Top-down.
async function searchlight(game, busts) {
  const { ui, say, input, state } = game;
  const s = { bx: 90, by: 190, tx: 90, ty: 190, sx: 90, sy: -40, det: 0, t: 0, scroll: 0, px: 90, dash: null, nextDash: 6, x0: 0, y0: 0 };
  window.__boat = s;   // for tests and the console
  const R = 24, COP_Y = 296, BOAT_SPEED = 120;
  const AREA = { x0: 22, x1: 158, y0: 60, y1: 262 };
  game.setScene((a, t) => {
    a.waterTop(s.scroll);
    a.headlightCone(s.px, COP_Y - 20, 70, 20);
    a.policeBoatTop(Math.round(s.px), COP_Y, t);
    a.searchCircle(s.sx, s.sy, R);
    a.speedboatTop(Math.round(s.bx), Math.round(s.by), t);
    a.heliTop(Math.round(s.sx + 10), Math.round(s.sy - 30), t);
    a.sirenGlow();
    if (s.det > 0) { a.g.fillStyle = `rgba(255,80,60,${s.det * 0.18})`; a.g.fillRect(0, 0, 180, 320); }
  });
  ui.dim(false);
  ui.hud({ hearts: state.hearts, money: state.money, time: '9:41 PM', wanted: 3, minimap: false });
  ui.prompt('DRAG', 'Steer · stay out of the light', 'high');
  setTimeout(() => ui.prompt(null), 3000);
  let talk = Promise.resolve();
  const line = (who, t, v) => { talk = talk.then(() => say(who, t, v, { passive: true, hold: 500 })); };
  if (busts === 0) line('LUCITA', "They've got a chopper on us!", 'lucita');
  const k = () => game.canvas.getBoundingClientRect().width / 180;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  input.waiter = {
    down() { s.x0 = s.tx = s.bx; s.y0 = s.ty = s.by; },
    move(g) { s.tx = clamp(s.x0 + g.dx / k(), AREA.x0, AREA.x1); s.ty = clamp(s.y0 + g.dy / k(), AREA.y0, AREA.y1); },
    up() {}, done() {},
  };
  const said = new Set();
  let seed = 11 + busts * 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const ok = await new Promise(resolve => {
    let last = performance.now();
    const step = now => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      s.t += dt;
      s.scroll += dt * 70;
      // the boat goes where your finger points, at a boat's speed
      const dx = s.tx - s.bx, dy = s.ty - s.by, dist = Math.hypot(dx, dy), mv = Math.min(dist, BOAT_SPEED * dt);
      if (dist > 0.01) { s.bx += dx / dist * mv; s.by += dy / dist * mv; }
      // the light hunts you with a lag and a wander; every few seconds it lunges at a spot near you
      const hunt = 26 + s.t * 1.3 - busts * 3;
      let gx = s.bx + Math.sin(s.t * 1.1) * 26, gy = s.by + Math.cos(s.t * 0.8) * 20, sp = hunt;
      if (s.t > s.nextDash && !s.dash) { s.dash = { x: s.bx + (rnd() - 0.5) * 50, y: s.by + (rnd() - 0.5) * 50, until: s.t + 1 }; if (!said.has('dash')) { said.add('dash'); line('LUCITA', 'Here it comes!', 'lucita'); } }
      if (s.dash) { gx = s.dash.x; gy = s.dash.y; sp = 100; if (s.t > s.dash.until) { s.dash = null; s.nextDash = s.t + 5 + rnd() * 3; } }
      const lx = gx - s.sx, ly = gy - s.sy, ld = Math.hypot(lx, ly), lm = Math.min(ld, sp * dt);
      if (ld > 0.01) { s.sx += lx / ld * lm; s.sy += ly / ld * lm; }
      // the police boat chugs along the bottom, drifting under you
      s.px += clamp(s.bx - s.px, -1, 1) * 14 * dt;
      const inLight = s.t > 2.5 && Math.hypot(s.sx - s.bx, s.sy - s.by) < R + 4;
      const inHeadlight = s.by > COP_Y - 90 && Math.abs(s.bx - s.px) < 8 + (COP_Y - 20 - s.by) / 70 * 20;
      const lit = inLight || inHeadlight;
      s.det = clamp(s.det + (lit ? (inLight ? 0.3 : 0.45) : -0.25) * dt, 0, 1);
      if (inHeadlight && !said.has('cop')) { said.add('cop'); line('LUCITA', 'Not toward the cops, Jase!', 'lucita'); }
      if (lit && s.det > 0.5 && !said.has('half')) { said.add('half'); line('LUCITA', 'Get out of the light!', 'lucita'); }
      ui.progress('Spotted', s.det * 100, 'left');
      ui.el('timer', 'timer', `<span>Reach the channel</span> 0:${String(Math.max(0, Math.ceil(SURVIVE - s.t))).padStart(2, '0')}`);
      if (s.det >= 1) return resolve(false);
      if (s.t >= SURVIVE) return resolve(true);
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
  input.waiter = null;
  ui.prompt(null);
  ui.progress(false);
  ui.hide('timer');
  if (ok) await talk;
  else await game.wait(400);
  return ok;
}
