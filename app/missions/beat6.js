// Mission 6 (Mission 5 in-game): Wake. A borrowed speedboat, a helicopter, a mangrove channel.
// See docs/storyboard.md, Beat 6.
//
//   hotwire     RAPID TAP
//   searchlight DRAG left/right to keep the boat out of the helicopter's light. Detection fills while lit;
//               full = BUSTED, retry. Survive about 25 seconds.
//   channel     SWIPE ↑ for "hard left" into the channel (miss it and you get yelled at, nothing worse)
//   lost them   +1 heart ("That felt fun.")

import { sfx } from '../audio/sfx.js';
import { playLoop } from '../audio/music.js';

const SURVIVE = 25;

export default async function wake(game, radio) {
  const { ui, say, input, state } = game;
  const f = state.flags;

  // ---------------- The marina ----------------
  const mk = { bx: 70 };
  game.setScene(a => { a.marina(); a.speedboat(Math.round(mk.bx), 236, true); });
  ui.letterbox(true);
  sfx.play('card');
  await ui.card('Mission 5  ·  Bayside Yacht Club', 'Wake', 3000);
  ui.letterbox(false);
  await say('JASE', "It's not stealing. It's a test drive.", 'jase');
  await say('LUCITA', "It has a name, Jase. It's called Reel Estate.", 'lucita');
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
    ui.el('busted', 'passed busted', `<div class="big">BUSTED</div><div class="mn">Wake</div>
      <div class="fx">Lucita: "${lines[Math.min(f.boatBusts - 1, 2)]}"</div><div class="cont">Tap to retry</div>`);
    await game.wait(1200);
    await input.tap();
    ui.hide('busted');
    ui.dim(false);
    Object.assign(music, await playLoop('chase', { vol: 0.8 }));
  }

  // ---------------- Hard left ----------------
  const ch = { scroll: 0, boatX: 50 };
  game.setScene((a, t, dt) => {
    ch.scroll += dt * 80;
    a.channel(ch.scroll);
    a.speedboat(Math.round(ch.boatX), 252, true);
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
  if (turned) { sfx.play('whoosh'); await game.tween(ch, 'boatX', 50, 300); }
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
  ui.el('lost', 'passed', '<div class="big" style="font-size:22px;color:#9be37a;text-shadow:0 2px 0 #1b3a12;margin-top:-100px">WANTED LEVEL LOST</div>');
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
  await ui.passed('MISSION PASSED', 'Wake', 'Boats returned: 0', f.boatBusts ? `Helicopter encounters: ${f.boatBusts + 1}` : 'Reel Estate is in a better place.', () => input.tap());
  ui.dim(false);
  state.mission = 7;
  game.save();
}

// Keep the boat out of the light. Resolves true if you last SURVIVE seconds.
async function searchlight(game, busts) {
  const { ui, say, input, state } = game;
  const s = { boatX: 50, spotX: 230, heliX: 220, det: 0, t: 0, x0: 50, scroll: 0 };   // the light sweeps in from off-screen
  window.__boat = s;   // for tests and the console
  const HALF = 22, BOAT_W = 80;
  game.setScene((a, t) => {
    a.nightWater();
    for (let i = 0; i < 12; i++) a.R((((i * 41 - Math.round(s.scroll)) % 200) + 200) % 200 - 10, 190 + (i * 29) % 110, 8, 1, '#3a6a9a');
    a.policeBoat(Math.round(s.boatX - 70), 296);
    a.spotlight(s.spotX, 68, 240, HALF);
    a.speedboat(Math.round(s.boatX), 246, true);
    a.helicopter(Math.round(s.heliX), 52);
    a.sirenGlow();
    if (s.det > 0) { a.g.fillStyle = `rgba(255,80,60,${s.det * 0.18})`; a.g.fillRect(0, 0, 180, 320); }
  });
  ui.dim(false);
  ui.hud({ hearts: state.hearts, money: state.money, time: '9:41 PM', wanted: 3, minimap: false });
  ui.prompt('DRAG', 'Stay out of the light', 'high');
  setTimeout(() => ui.prompt(null), 3000);
  let talk = Promise.resolve();
  const line = (who, t, v) => { talk = talk.then(() => say(who, t, v, { passive: true, hold: 500 })); };
  if (busts === 0) line('LUCITA', "They've got a chopper on us!", 'lucita');
  const k = () => game.canvas.getBoundingClientRect().width / 180;
  input.waiter = {
    down() { s.x0 = s.boatX; },
    move(g) { s.boatX = Math.max(-10, Math.min(110, s.x0 + g.dx / k())); },
    up() {}, done() {},
  };
  const said = new Set();
  const ok = await new Promise(resolve => {
    let last = performance.now();
    const step = now => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      s.t += dt;
      s.scroll += dt * 60;
      // the light hunts for the boat, with a lag and a sway; it gets quicker over time
      const target = s.boatX + BOAT_W / 2 + Math.sin(s.t * 1.3) * 26;
      const speed = 26 + s.t * 1.4 - busts * 3;
      const dx = target - s.spotX;
      s.spotX += Math.sign(dx) * Math.min(Math.abs(dx), speed * dt);
      s.heliX += (s.spotX - 14 - s.heliX) * Math.min(1, dt * 1.5);
      const center = s.boatX + BOAT_W / 2;
      const lit = s.t > 2.5 && Math.abs(s.spotX - center) < HALF + BOAT_W / 2 - 18;   // a moment's grace at the start
      s.det = Math.max(0, Math.min(1, s.det + (lit ? 0.32 : -0.25) * dt));
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
