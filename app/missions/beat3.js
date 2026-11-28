// Mission 3: Late Night Special. A convenience-store hold-up, done as a couple.
// See docs/storyboard.md, Beat 3.
//
// Choices and skill:
//   approach  Loud (2 stars) / Quiet (1 star) / Buy something first (1 star, costs $3, confuses Benny)
//   hold-up   HOLD to keep Benny calm while he empties the register. Let go too long: silent alarm, +1 star.
//   jerky     Teriyaki (as requested) / Original / Leave it
//   chase     the first real fail state. Swipe up/down to change lanes; get in the called lane and swipe again
//             to turn. If the cruiser closes the gap: BUSTED. Hit two cars: WRECKED. Either way, retry the chase.

import { sfx } from '../audio/sfx.js';
import { makeChatter } from '../game/say.js';
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
  game.setScene(a => { a.storeExterior(); a.convertible(Math.round(ex.cx), 262, true); });
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
    if (state.money >= 3) {
      state.money -= 3;
      sfx.play('register');
      hud();
    } else {
      await say('JASE', `I have ${state.money ? '$' + state.money : 'nothing'}.`, 'jase');
      await say('BENNY', "...It's fine. It's on me.", 'benny');
      f.slushieOnBenny = true;
    }
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
  await say('BENNY', '...You know I gotta tell my mom.', 'benny');
  ui.toast('Witness', 'Benny is telling his mom.', '#f2c14e');
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
    const lines = result === 'wrecked' ? ['You hit two cars, Jase.', 'Cars are not cones.', 'We are not insured.']
      : ['We are not doing this again.', 'We are doing this again.', "Jase. Left is the one on the left."];
    ui.el('busted', 'passed busted', `<div class="big">${result === 'wrecked' ? 'WRECKED' : 'BUSTED'}</div><div class="mn">Late Night Special</div>
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
  ui.el('lost', 'passed', '<div class="big" style="margin-top:110px;font-size:24px;color:#9be37a;text-shadow:0 2px 0 #1b3a12">WANTED: you&rsquo;re clear</div>');
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
  await ui.passed('MISSION PASSED', 'Late Night Special', `$${haul}  ·  ${jerky}`, 'Benny is telling his mom.', () => input.tap());
  ui.dim(false);
  state.mission = 4;
  game.save();
}

// The chase: returns 'escaped', 'busted' (the cruiser caught up) or 'wrecked' (too many cars hit).
// gap 1 = far ahead, 0 = caught.
//   traffic   cones and gators are bumps (a little lead lost). Cars are serious: a big hit, a rebound,
//             and the second one ends the chase. Traffic never walls off both lanes at once.
//   turns     Lucita calls them. Be in that lane (left = top, right = bottom) and swipe that way again
//             to take it. The turn lane is kept clear for a few seconds before she calls it.
// opts: { day, time, intro, difficulty } so other missions can reuse the chase
const KINDS = {
  sedan: { w: 70, slow: 35, lead: 0.16 },
  cone:  { w: 10, slow: 0,  lead: 0.03 },
  gator: { w: 38, slow: 0,  lead: 0.06 },
};
const CAR_HITS = 2;
const APPROVE = [['LUCITA', 'Yes! Like that.'], ['LUCITA', 'Okay. Okay, that was good.'], ['LUCITA', 'Who taught you to drive like that?']];

export async function chase(game, stars, startGap, busts, opts = {}) {
  const { ui, say, input, state } = game;
  const c = { scroll: 0, lane: 0, y: LANES[0], gap: startGap, obs: [], t: 0, flash: 0, shake: 0, copY: LANES[0],
    knock: 0, tilt: 0, street: 0, copBack: 0, hits: 0 };
  window.__chase = c;   // for tests and the console
  const diff = opts.difficulty ?? stars;   // the HUD shows `stars`; the traffic follows `diff`
  const speed = 84 + diff * 8, spawnEvery = Math.max(0.8, 1.35 - diff * 0.15);
  const drift = 0.009 + diff * 0.004;   // how fast the cruiser closes in on its own (per second)
  const turns = [{ at: 7, dir: 'up' }, { at: 15, dir: 'down' }, { at: 23, dir: 'up' }];
  const CLEAR = 3.2, WINDOW = 3.4;      // turn lane kept clear this long before the call; time to make it
  const END = 30;
  let seed = 7 + busts * 13;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  let nextSpawn = 1.2, turn = null, turnIdx = 0, turning = false, saidGator = false;
  const chat = makeChatter(say, { hold: 500 }), line = chat.line;
  const laneOf = dir => dir === 'up' ? 0 : 1;

  game.setScene((a, t, dt) => {
    const sx = c.shake > 0 ? Math.round((Math.random() - 0.5) * 4 * c.shake) : 0;
    a.g.save(); a.g.translate(sx, 0);
    a.chaseStreet(c.scroll, opts.day, c.street);
    if (turn) {   // turn arrows painted in the turn lane; they're on the road, so they scroll with it
      const ay = turn.lane === 0 ? 260 : 294;
      for (let k = 0; k < 3; k++) a.roadArrow(196 + k * 80 - (c.scroll - turn.scroll0), ay, turn.dir);
    }
    for (const o of c.obs) {
      const y = LANES[o.lane];
      if (o.x > 176) { if (Math.floor(t * 8) % 2) { a.R(172, y - 20, 4, 9, '#ffd23f'); a.R(172, y - 9, 4, 3, '#ffd23f'); } continue; }   // incoming
      a.g.save();
      if (o.fly) {   // knocked aside: off the road, spinning, fading
        const dir = o.lane === 0 ? -1 : 1, cx = o.x + KINDS[o.kind].w / 2;
        a.g.globalAlpha = Math.max(0, 1 - o.fly);
        a.g.translate(cx, y - 8 + dir * o.fly * (o.kind === 'sedan' ? 30 : 60));
        a.g.rotate(dir * o.fly * (o.kind === 'sedan' ? 0.5 : 6));
        a.g.translate(-cx, -(y - 8));
      }
      if (o.kind === 'sedan') a.sedan(Math.round(o.x), y, o.color);
      else if (o.kind === 'cone') a.cone(Math.round(o.x), y - 4);
      else a.gator(Math.round(o.x), y - 2);
      a.g.restore();
    }
    // our car: knocked back after a hit, slanted through a turn
    const px = Math.round(PX - c.knock * 14), py = Math.round(c.y);
    a.g.save();
    if (c.tilt) { a.g.translate(px + 45, py - 14); a.g.rotate(c.tilt * 0.38); a.g.translate(-(px + 45), -(py - 14)); }
    a.convertible(px, py, true);
    if (c.tilt) for (let k = 0; k < 4; k++) a.R(px - 6 - k * 10, py - 4 + (k % 2), 8, 2, 'rgba(40,40,44,.8)');   // skid marks
    a.g.restore();
    // the cruiser is always in your mirror: a full lead still leaves its nose on screen
    a.policeCar(Math.round(PX - 78 - c.gap * 26 - c.copBack * 100), Math.round(c.copY), true);
    a.sirenGlow();
    a.g.restore();
    if (c.flash > 0) { a.g.fillStyle = `rgba(255,255,255,${c.flash * 0.6})`; a.g.fillRect(0, 0, 180, 320); }
  });
  ui.dim(false);
  const hud = () => ui.hud({ hearts: state.hearts, money: state.money, time: opts.time ?? '11:55 PM', wanted: stars, minimap: false });
  const damage = () => ui.el('dmg', 'dmg', `<span>Car</span>${[...Array(CAR_HITS).keys()].map(i => `<i class="${i < CAR_HITS - c.hits ? 'on' : ''}"></i>`).join('')}`);
  hud();
  damage();
  ui.prompt('SWIPE ↑↓', 'Change lanes', 'high');
  setTimeout(() => { if (!turn) ui.prompt(null); }, 2500);
  if (busts === 0 && opts.intro !== false) line('LUCITA', 'Drive. DRIVE.', 'lucita');

  const turnPrompt = () => {
    if (!turn) return;
    const word = turn.dir === 'up' ? 'left' : 'right', arrow = turn.dir === 'up' ? 'SWIPE ↑' : 'SWIPE ↓';
    ui.prompt(arrow, c.lane === turn.lane ? `Turn ${word} now` : `Get in the ${word} lane`, 'high');
  };
  // You can't merge into a car that's right beside you: a bump and a honk, and you stay put.
  let bumping = false;
  const changeLane = async to => {
    if (to === c.lane || bumping) return;
    const beside = c.obs.find(o => !o.hit && o.kind === 'sedan' && o.lane === to && o.x < PX + 92 && o.x + KINDS.sedan.w > PX - 2);
    if (beside) {
      bumping = true;
      sfx.play('thud');
      c.shake = 0.5;
      const y0 = LANES[c.lane];
      await game.tween(c, 'y', y0 + (LANES[to] - y0) * 0.25, 90, 'out');
      await game.tween(c, 'y', y0, 140, 'out');
      bumping = false;
      if (!c.saidBeside) { c.saidBeside = true; line('LUCITA', "There's a car there!", 'lucita'); }
      return;
    }
    c.lane = to;
    sfx.play('whoosh');
    game.tween(c, 'y', LANES[to], 180, 'out');
  };
  // Taking the turn: screech, the car slants, a flash, and a different street. The cruiser has to find you again.
  const takeTurn = async () => {
    const tn = turn, n = turnIdx;
    turn = null;
    turning = true;
    ui.prompt(null);
    sfx.play('screech');
    const sign = tn.dir === 'up' ? -1 : 1;
    await game.tween(c, 'tilt', sign, 260, 'out');
    c.flash = 1;
    c.street++;
    c.obs = [];
    c.scroll += 37;
    c.gap = Math.min(1, c.gap + 0.12);
    c.copBack = 1;
    game.tween(c, 'copBack', 0, 2600, 'inOut');
    nextSpawn = 1.4;
    await game.tween(c, 'tilt', 0, 380, 'out');
    turning = false;
    const [who, text] = APPROVE[Math.min(n - 1, APPROVE.length - 1)];
    line(who, text, 'lucita');
  };
  input.waiter = {
    up(g) {
      if (turning || Math.abs(g.dy) < 35 || Math.abs(g.dy) < Math.abs(g.dx)) return;
      const dir = g.dy < 0 ? 'up' : 'down';
      if (turn && c.lane === turn.lane && dir === turn.dir) return takeTurn();
      if (turn && c.lane === turn.lane && dir !== turn.dir) line('LUCITA', 'Other way!', 'lucita');
      changeLane(laneOf(dir));
      turnPrompt();
    },
    down() {}, move() {}, done() {},
  };

  // When does a thing at x occupy the car's stretch of road? [enter, leave] in seconds from now.
  const span = (x, kind) => { const k = KINDS[kind], v = speed - k.slow; return [(x - (PX + 86)) / v, (x + k.w - (PX + 6)) / v]; };
  // Would a new `kind` in `lane` overlap (with time to change lanes) something in the other lane?
  const walls = (lane, kind) => {
    const [a2, b2] = span(250, kind);
    return c.obs.some(o => !o.fly && o.lane !== lane && (([a1, b1]) => a2 < b1 + 0.75 && a1 < b2 + 0.75)(span(o.x, o.kind)));
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
      c.knock = Math.max(0, c.knock - dt * 2.5);
      c.gap -= drift * dt;
      c.copY += (c.y - c.copY) * Math.min(1, dt * 2.5);
      // traffic
      nextSpawn -= dt;
      const upcoming = turns[turnIdx], clearLane = turn ? turn.lane : upcoming && upcoming.at - c.t < CLEAR ? laneOf(upcoming.dir) : null;
      if (nextSpawn <= 0 && c.t < END - 2 && !turn && !turning) {
        nextSpawn = spawnEvery * (0.7 + rnd() * 0.6);
        const r = rnd(), kind = r < 0.55 ? 'sedan' : r < 0.85 ? 'cone' : 'gator';
        let lane = rnd() < 0.5 ? 0 : 1;
        if (clearLane !== null) lane = 1 - clearLane;
        else if (walls(lane, kind)) lane = 1 - lane;
        if (walls(lane, kind)) nextSpawn = 0.3;   // nowhere safe right now; try again shortly
        else c.obs.push({ x: 250, lane, kind, color: ['#5a7a9a', '#8a5a9a', '#9a8a5a', '#5a9a7a'][Math.floor(rnd() * 4)], hit: false, fly: 0 });
      }
      for (const o of c.obs) {
        o.x -= (speed - KINDS[o.kind].slow) * dt;
        if (o.hit) { o.fly = Math.min(1, o.fly + dt * (o.kind === 'sedan' ? 1.6 : 2.2)); continue; }
        if (turning || o.lane !== c.lane || Math.abs(c.y - LANES[o.lane]) > 16) continue;
        if (o.x < PX + 86 && o.x + KINDS[o.kind].w > PX + 6) {
          o.hit = true;
          c.gap -= KINDS[o.kind].lead;
          if (o.kind === 'sedan') {
            c.hits++;
            c.shake = 1.4;
            c.knock = 1;
            c.flash = 0.5;
            sfx.play('crash');
            damage();
            if (c.hits === 1) line('LUCITA', 'Jase! She can NOT take another one of those.', 'lucita');
          } else {
            c.shake = 0.4;
            sfx.play('thud');
            if (o.kind === 'gator' && !saidGator) { saidGator = true; line('LUCITA', 'Was that a gator?', 'lucita'); }
          }
        }
      }
      c.obs = c.obs.filter(o => o.x > -90 && o.fly < 1);
      // called turns
      if (!turn && !turning && turnIdx < turns.length && c.t >= turns[turnIdx].at) {
        const tn = turns[turnIdx++];
        turn = { dir: tn.dir, lane: laneOf(tn.dir), start: c.t, until: c.t + WINDOW, scroll0: c.scroll };
        sfx.play('prompt');
        turnPrompt();
        line('LUCITA', tn.dir === 'up' ? (turnIdx === 1 ? 'Left up here! Get over!' : 'Left! Left at the light!') : 'Right! Take the right!', 'lucita');
      }
      if (turn && c.t > turn.until) {
        turn = null;
        c.gap -= 0.15;
        ui.prompt(null);
        sfx.play('heartDown');
        line('LUCITA', 'That was the turn!', 'lucita');
      }
      ui.progress('Lead', Math.max(0, c.gap) * 100, 'left');
      if (c.hits >= CAR_HITS) return resolve('wrecked');
      if (c.gap <= 0) return resolve('busted');
      if (c.t >= END) return resolve('escaped');
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
  c.over = true;   // (for tests)
  input.waiter = null;
  ui.prompt(null);
  ui.progress(false);
  ui.hide('dmg');
  if (result !== 'escaped') { c.gap = Math.max(0, c.gap); await game.wait(400); }
  else { await chat.idle(); ui.dim(true, 1); await game.wait(500); }
  return result;
}
