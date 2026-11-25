// Mission 3: Late Night Special. A convenience-store hold-up, done as a couple.
// See docs/storyboard.md, Beat 3.
//
// Choices and skill:
//   approach  Loud (2 stars) / Quiet (1 star) / Buy something first (1 star, costs $3, confuses Benny)
//   hold-up   HOLD to keep Benny calm while he empties the register. Let go too long: silent alarm, +1 star.
//   jerky     Teriyaki (as requested) / Original / Leave it
//   chase     the first real fail state. Swipe up/down to change lanes; swipe on the called turns.
//             If the cruiser closes the gap: BUSTED, retry the chase.

import { sfx } from '../audio/sfx.js';
import { playLoop } from '../audio/music.js';

const LANES = [262, 296];
const PX = 56;   // the convertible's x during the chase (cruiser comes from the left, traffic from the right)

export default async function lateNightSpecial(game, radio) {
  const { ui, say, input, state, art } = game;
  const f = state.flags;
  const hud = (extra = {}) => ui.hud({ hearts: state.hearts, money: state.money, time: '11:52 PM', ...extra });
  const walk = async (obj, key, to, k = 18) => { obj.bob = true; await game.tween(obj, key, to, Math.abs(to - obj[key]) * k, 'linear'); obj.bob = false; };
  let stars = 0;

  // ---------------- Arrival ----------------
  const ex = { cx: -100 };
  game.setScene(a => { a.storeExterior(); a.convertible(Math.round(ex.cx), 250, ex.cx < 20); });
  ui.letterbox(true);
  sfx.play('engine');
  await game.tween(ex, 'cx', 20, 2400, 'out');
  sfx.play('card');
  await ui.card('Mission 3  ·  Route 9', 'Late Night\nSpecial', 3400);
  ui.letterbox(false);

  // ---------------- The plan ----------------
  game.setScene(a => { a.storeExterior(); a.convertible(46, 262, true); });
  await say('LUCITA', 'In and out. Nobody gets hurt.', 'lucita');
  await say('JASE', 'And we get the good jerky.', 'jase');
  ui.dim(true, 0.35);
  ui.choices('Choose your approach', [['loud', 'Loud'], ['quiet', 'Quiet'], ['buy', 'Buy something first']]);
  f.approach = await input.pick();
  sfx.play('click');
  ui.choices(null);
  ui.dim(false);
  if (f.approach === 'quiet') await say('LUCITA', 'Quiet means quiet, Jase.', 'lucita');
  if (f.approach === 'loud') await say('LUCITA', "...Fine. But I'm not yelling.", 'lucita');
  if (f.approach === 'buy') await say('LUCITA', 'Why.', 'lucita');
  ui.dim(true, 1);
  await game.wait(600);

  // ---------------- Inside ----------------
  const st = { masks: f.approach !== 'buy', guns: false, blush: false };
  game.setScene(a => {
    a.storeInterior();
    a.sprite(a.CLERK, 128, 166); a.counter();
    a.sprite(st.masks ? a.LUCITA_MASK : a.LUCITA_CASUAL, 44, 222);
    a.sprite(st.masks ? a.JASE_MASK : a.JASE, 70, 226);
    if (st.guns) { a.pistol(62, 238); a.pistol(86, 242); }
    if (st.blush) a.R(78, 226, 4, 4, '#ff5d8f');
  });
  ui.dim(false);
  sfx.play('textPing');   // the door chime
  await game.wait(700);

  if (f.approach === 'buy') {
    await say('JASE', 'One slushie, please. Blue.', 'jase');
    await say('BENNY', "...That's three dollars.", 'benny');
    state.money -= 3;
    sfx.play('register');
    hud();
    await game.wait(700);
    st.masks = true;
    st.guns = true;
    sfx.play('hammer');
    stars = 1;
    hud({ wanted: stars });
    await say('BENNY', 'Do you still want the slushie?', 'benny');
    await say('JASE', '...Yes.', 'jase');
    await say('LUCITA', 'Jase.', 'lucita');
  } else {
    st.guns = true;
    sfx.play('hammer');
    stars = f.approach === 'loud' ? 2 : 1;
    hud({ wanted: stars });
    if (f.approach === 'loud') {
      await say('JASE', 'EVERYBODY DOWN!', 'jase');
      await say('BENNY', "It's just me, man.", 'benny');
    }
    await say('JASE', "Hands where I can see them, Benny. Nobody's gotta be a hero tonight.", 'jase');
  }
  await say('BENNY', 'Jase? From Little League?', 'benny');
  st.blush = true;
  sfx.play('toast');
  ui.toast('Witness', 'Benny will tell your mother.', '#f2c14e');
  await say('BENNY', "Man, your mom's gonna hear about this.", 'benny');
  await say('LUCITA', 'Register. Now. And the teriyaki.', 'lucita');

  // HOLD to keep him calm while he empties the register. Let go for too long and he hits the alarm.
  let fill = ui.prompt('HOLD', 'Keep Benny calm');
  let lastProgress = performance.now() + 1500, alarmed = false;   // a moment's grace before he gets ideas
  const watch = setInterval(() => {
    if (!alarmed && !input.held && performance.now() - lastProgress > 1200 && lastProgress > 0) {
      alarmed = true;
      stars += 1;
      hud({ wanted: stars });
      sfx.play('heartDown');
      ui.toast('Silent alarm', 'Benny pressed it with his knee.', '#ff5a4a');
    }
  }, 100);
  let lastBeep = 0;
  await input.hold(3200, p => {
    fill(p);
    lastProgress = performance.now();
    ui.progress('Register', p * 100);
    if (performance.now() - lastBeep > 400) { lastBeep = performance.now(); sfx.play('grout'); }
  });
  clearInterval(watch);
  f.alarm = alarmed;
  ui.prompt(null);
  ui.progress(false);
  const haul = 186;
  state.money += haul;
  sfx.play('register');
  hud({ wanted: stars });
  await game.wait(600);

  ui.choices('Grab the jerky', [['teriyaki', 'Teriyaki'], ['original', 'Original'], ['none', 'Leave it']]);
  f.jerky = await input.pick();
  sfx.play('click');
  ui.choices(null);
  if (f.jerky === 'original') await say('LUCITA', 'I said teriyaki.', 'lucita');
  if (f.jerky === 'none') await say('LUCITA', 'Jase.', 'lucita');
  sfx.play('siren');
  await say('BENNY', 'Take a slushie. For the road. I already called them.', 'benny', { hold: 1200 });
  fill = ui.prompt('TAP', 'Run');
  await input.tap();
  ui.prompt(null);
  ui.dim(true, 1);
  await game.wait(500);
  f.robbedStore = true;
  radio.setContext(f);

  // ---------------- The chase ----------------
  const music = await playLoop('chase', { vol: 0.9 });
  f.busts = 0;
  let result;
  for (;;) {
    result = await chase(game, stars, 0.62 + f.busts * 0.12, f.busts);
    if (result === 'escaped') break;
    f.busts++;
    music.stop(0.2);
    sfx.play('busted');
    ui.hud(null);
    ui.prompt(null);
    ui.progress(false);
    ui.dim(true, 0.55);
    const lines = ['We are not doing this again.', 'We are doing this again.', "Jase. Left is the one on the left."];
    ui.el('busted', 'passed busted', `<div class="big">BUSTED</div><div class="mn">Late Night Special</div>
      <div class="fx">Lucita: "${lines[Math.min(f.busts - 1, 2)]}"</div><div class="cont">Tap to retry the chase</div>`);
    await game.wait(1200);
    await input.tap();
    ui.hide('busted');
    ui.dim(false);
    Object.assign(music, await playLoop('chase', { vol: 0.9 }));
  }
  music.stop(1.5);

  // ---------------- The car wash ----------------
  const w = { cx: -100, foam: 0, px: 200 };
  game.setScene((a, t) => {
    a.carWash(t, w.foam);
    a.convertible(Math.round(w.cx), 214, true);
    if (w.px < 190) a.policeCar(Math.round(w.px), 300);
    if (w.px < 190) a.sirenGlow();
  });
  ui.hud({ hearts: state.hearts, money: state.money, time: '11:58 PM', wanted: stars, minimap: false });
  ui.dim(false);
  sfx.play('whoosh');
  await game.tween(w, 'cx', 46, 1400, 'out');
  sfx.play('wash');
  game.tween(w, 'foam', 1, 1500);
  await game.wait(600);
  w.px = 190;
  sfx.play('siren');
  await game.tween(w, 'px', -90, 2400, 'linear');
  ui.hud({ hearts: state.hearts, money: state.money, time: '11:58 PM', minimap: false });
  ui.el('lost', 'passed', '<div style="margin-top:110px" class="big" style="font-size:24px;color:#9be37a;text-shadow:0 2px 0 #1b3a12">WANTED LEVEL LOST</div>');
  await game.wait(1800);
  ui.hide('lost');
  await say('LUCITA', '...Did we just get the car washed?', 'lucita');
  await say('JASE', 'Two birds.', 'jase');
  await say('LUCITA', 'The top was down, Jase.', 'lucita');
  await game.wait(500);

  // ---------------- Mission passed ----------------
  ui.hud(null);
  ui.dim(true, 0.45);
  sfx.play('passed');
  const jerky = { teriyaki: '1 Beef Jerky (Teriyaki)', original: '1 Beef Jerky (Original)', none: 'No jerky' }[f.jerky];
  await ui.passed('MISSION PASSED', 'Late Night Special', `$${haul}  ·  ${jerky}`, 'Benny has called your mother.', () => input.tap());
  ui.dim(false);
  state.mission = 4;
  game.save();
}

// The chase: returns 'escaped' or 'busted'. gap 1 = far ahead, 0 = caught.
// opts: { day, time, intro } so other missions can reuse the chase
export async function chase(game, stars, startGap, busts, opts = {}) {
  const { ui, say, input, state } = game;
  const c = { scroll: 0, lane: 0, y: LANES[0], gap: startGap, obs: [], t: 0, flash: 0, shake: 0, copY: LANES[0] };
  window.__chase = c;   // for tests and the console
  const diff = opts.difficulty ?? stars;   // the HUD shows `stars`; the traffic follows `diff`
  const speed = 80 + diff * 8, spawnEvery = Math.max(0.9, 1.5 - diff * 0.15);
  const drift = 0.006 + diff * 0.003;   // how fast the cruiser closes in on its own (per second)
  const turns = [{ at: 7, dir: 'up' }, { at: 15, dir: 'down' }, { at: 23, dir: 'up' }];
  const END = 30;
  let seed = 7 + busts * 13;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  let nextSpawn = 1.2, turn = null, turnIdx = 0, talk = Promise.resolve();
  const line = (who, text, v) => { talk = talk.then(() => say(who, text, v, { passive: true, hold: 500 })); };

  game.setScene((a, t, dt) => {
    const sx = c.shake > 0 ? Math.round((Math.random() - 0.5) * 4 * c.shake) : 0;
    a.g.save(); a.g.translate(sx, 0);
    a.chaseStreet(c.scroll, opts.day);
    for (const o of c.obs) {
      const y = LANES[o.lane];
      if (o.x > 176) { if (Math.floor(t * 8) % 2) { a.R(172, y - 20, 4, 9, '#ffd23f'); a.R(172, y - 9, 4, 3, '#ffd23f'); } continue; }   // incoming
      if (o.kind === 'sedan') a.sedan(Math.round(o.x), y, o.color);
      else if (o.kind === 'cone') a.cone(Math.round(o.x), y - 4);
      else a.gator(Math.round(o.x), y - 2);
    }
    a.convertible(PX, Math.round(c.y), true);
    a.policeCar(Math.round(PX - 76 - c.gap * 120), Math.round(c.copY), true);
    a.sirenGlow();
    a.g.restore();
    if (c.flash > 0) { a.g.fillStyle = `rgba(255,255,255,${c.flash * 0.6})`; a.g.fillRect(0, 0, 180, 320); }
  });
  ui.dim(false);
  const hud = () => ui.hud({ hearts: state.hearts, money: state.money, time: opts.time ?? '11:55 PM', wanted: stars, minimap: false });
  hud();
  ui.prompt('SWIPE ↑↓', 'Change lanes', 'high');
  setTimeout(() => { if (!turn) ui.prompt(null); }, 2500);
  if (busts === 0 && opts.intro !== false) line('LUCITA', 'Drive. DRIVE.', 'lucita');

  const changeLane = to => {
    if (to === c.lane) return;
    c.lane = to;
    sfx.play('whoosh');
    game.tween(c, 'y', LANES[to], 180, 'out');
  };
  input.waiter = {
    up(g) {
      if (Math.abs(g.dy) < 35 || Math.abs(g.dy) < Math.abs(g.dx)) return;
      const dir = g.dy < 0 ? 'up' : 'down';
      if (turn) {
        const ok = dir === turn.dir;
        turn.done = true;
        if (ok) {
          c.gap = Math.min(1, c.gap + 0.12);
          c.flash = 1;
          c.obs = [];
          sfx.play('whoosh');
          if (turnIdx === 1) line('JASE', "I'm going left!", 'jase');
        } else {
          c.gap -= 0.15;
          sfx.play('heartDown');
          line('LUCITA', 'Other left!', 'lucita');
        }
        turn = null;
        ui.prompt(null);
      } else changeLane(dir === 'up' ? 0 : 1);
    },
    down() {}, move() {}, done() {},
  };

  c.turnState = () => turn;
  const result = await new Promise(resolve => {
    let last = performance.now();
    const step = now => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      c.t += dt;
      c.scroll += speed * dt;
      c.flash = Math.max(0, c.flash - dt * 3);
      c.shake = Math.max(0, c.shake - dt * 3);
      c.gap -= drift * dt;
      c.copY += (c.y - c.copY) * Math.min(1, dt * 2.5);
      // traffic
      nextSpawn -= dt;
      if (nextSpawn <= 0 && c.t < END - 2 && !turn) {
        nextSpawn = spawnEvery * (0.7 + rnd() * 0.6);
        const r = rnd(), prev = c.obs[c.obs.length - 1];
        // never wall off both lanes: if the last one is still close to the edge, use its lane
        const lane = prev && prev.x > 165 ? prev.lane : (rnd() < 0.5 ? 0 : 1);
        c.obs.push({ x: 250, lane, kind: r < 0.55 ? 'sedan' : r < 0.85 ? 'cone' : 'gator', color: ['#5a7a9a', '#8a5a9a', '#9a8a5a', '#5a9a7a'][Math.floor(rnd() * 4)], hit: false });
      }
      for (const o of c.obs) {
        o.x -= (speed + (o.kind === 'sedan' ? -35 : 0)) * dt;
        const wdt = o.kind === 'sedan' ? 70 : o.kind === 'cone' ? 10 : 38;
        if (!o.hit && o.lane === c.lane && o.x < PX + 86 && o.x + wdt > PX + 6) {
          o.hit = true;
          c.gap -= 0.12;
          c.shake = 1;
          sfx.play('crash');
          if (o.kind === 'gator') line('LUCITA', 'Was that a gator?', 'lucita');
          else if (rnd() < 0.5) line('LUCITA', 'Jase!', 'lucita');
        }
      }
      c.obs = c.obs.filter(o => o.x > -90);
      // called turns
      if (!turn && turnIdx < turns.length && c.t >= turns[turnIdx].at) {
        const tn = turns[turnIdx++];
        turn = { dir: tn.dir, until: c.t + 2.3 };
        sfx.play('prompt');
        ui.prompt(tn.dir === 'up' ? 'SWIPE ↑' : 'SWIPE ↓', tn.dir === 'up' ? 'Turn left' : 'Turn right', 'high');
        line('LUCITA', tn.dir === 'up' ? (turnIdx === 1 ? 'Left! LEFT!' : 'Left!') : 'Right! Right here!', 'lucita');
      }
      if (turn && c.t > turn.until) {
        turn = null;
        c.gap -= 0.15;
        ui.prompt(null);
        sfx.play('heartDown');
        line('LUCITA', 'That was the turn!', 'lucita');
      }
      ui.progress('Lead', Math.max(0, c.gap) * 100, 'left');
      if (c.gap <= 0) return resolve('busted');
      if (c.t >= END) return resolve('escaped');
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
  input.waiter = null;
  ui.prompt(null);
  ui.progress(false);
  if (result === 'busted') { c.gap = 0; await game.wait(400); }
  else { await talk; ui.dim(true, 1); await game.wait(500); }
  return result;
}
