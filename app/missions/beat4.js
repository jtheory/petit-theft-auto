// Mission 4 (optional date): Low Tide. Kayaking at dawn; a manatee.
// See docs/storyboard.md, Beat 4.
//
//   asking    "kayak tomorrow? i found a spot" / "u up" ("ask me properly") / don't ask (date skipped, remembered)
//   coffee    she said bring coffee: a short window to grab it on the way out
//   paddling  tap LEFT and RIGHT sides in turn. Same side twice: a slow circle.
//   manatee   HOLD to sit still and it stays (+1 heart). Fidget and it leaves.

import { sfx } from '../audio/sfx.js';
import { LEVEL_NAMES } from './beat2.js';

export default async function lowTide(game, radio) {
  const { ui, say, input, state } = game;
  const f = state.flags;
  const date = f.date = { asked: null, coffee: false, circles: 0, manatee: false };
  const houseState = () => ({ roof: f.roofFixed ? 1 : 0, porch: f.porchPainted ? 1 : 0, lit: true, boarded: !f.grouted, patched: !!f.grouted });

  // ---------------- Asking ----------------
  game.setScene(a => {
    a.sky(170); a.ground(); a.house(houseState()); a.palm(10, 214); a.palm(166, 206);
    if (!f.roofFixed) a.pot(102, 190, game.t);
    a.sprite(a.JASE, 40, 214);
  });
  ui.dim(true, 0.4);
  const msgs = [];
  const text = async (who, t, gap = 900) => { msgs.push([who, t]); ui.thread('Lucita', msgs); if (who === 'them') sfx.play('textPing'); else sfx.play('click'); await game.wait(gap); };
  ui.thread('Lucita', msgs, [['kayak', 'kayak tomorrow? i found a spot'], ['uup', 'u up'], ['skip', "Don't ask"]]);
  let ask = await input.pick();
  if (ask === 'uup') {
    await text('me', 'u up');
    await text('them', "it's 7pm jase");
    await text('them', 'ask me properly', 600);
    ui.thread('Lucita', msgs, [['kayak', 'kayak tomorrow? i found a spot'], ['skip', 'Never mind']]);
    ask = await input.pick();
    date.asked = 'uup';
  }
  if (ask === 'skip') {
    if (msgs.length) await text('me', 'never mind');
    await text('them', 'ok', 1600);
    ui.thread(null);
    ui.dim(false);
    f.skippedDate = true;
    ui.el('lost', 'passed', '<div class="big" style="font-size:24px;color:#aaa;text-shadow:none">DATE SKIPPED</div><div class="mn">Low Tide</div><div class="fx2">She said "ok."</div>');
    await game.wait(3200);
    ui.hide('lost');
    state.mission = 5;
    game.save();
    return;
  }
  date.asked = date.asked ?? 'kayak';
  await text('me', 'kayak tomorrow? i found a spot');
  await text('them', 'who is this');
  await text('them', 'lol');
  await text('them', 'ok. 6am. bring coffee', 2200);
  ui.thread(null);
  ui.dim(false);
  sfx.play('card');
  await ui.card('Date  ·  Optional', 'Low Tide', 3000);

  // ---------------- 5:48 AM. Coffee. ----------------
  const morning = { cup: false };
  game.setScene(a => {
    a.sky(150); a.ground(); a.house({ ...houseState(), lit: true }); a.palm(10, 214); a.palm(166, 206);
    a.convertible(84, 286);
    a.sprite(a.JASE, 118, 214);
    if (morning.cup) { a.R(134, 230, 4, 5, '#f4f1ea'); a.R(134, 229, 4, 1, '#6a4a3a'); }
  });
  ui.hud({ hearts: state.hearts, money: state.money, time: '5:48 AM' });
  ui.prompt('TAP', 'Grab the coffee');
  date.coffee = await input.tapWithin(3500);
  ui.prompt(null);
  if (date.coffee) { morning.cup = true; sfx.play('click'); }
  sfx.play('engine');
  await game.wait(900);
  ui.dim(true, 1);
  await game.wait(700);

  // ---------------- The dock ----------------
  const k = { scroll: 0, v: 0, spin: 0, boarded: false, manY: null, heartY: null, flip: 1 };
  game.setScene((a, t) => {
    a.lagoon(k.scroll, 112);
    if (!k.boarded) {
      a.dock(6, 238);
      a.sprite(a.LUCITA_CASUAL, 24, 206);
      a.sprite(a.JASE, 48, 206);
      a.kayak(80, 266, false);
    } else {
      const bob = Math.round(Math.sin(t * 2) * 1.5);
      if (k.manY !== null) a.manatee(40, Math.round(k.manY));
      a.g.save();
      if (k.spin > 0) { a.g.translate(86, 0); a.g.scale(Math.cos(k.spin * Math.PI * 2) >= 0 ? 1 : -1, 1); a.g.translate(-86, 0); }
      a.kayak(46, 250 + bob);
      a.g.restore();
    }
    if (k.heartY !== null) a.pixelHeart(78, Math.round(k.heartY));
  });
  ui.hud({ hearts: state.hearts, money: state.money, time: '6:04 AM' });
  ui.dim(false);
  if (date.coffee) await say('LUCITA', 'You brought coffee.', 'lucita');
  else await say('LUCITA', 'No coffee.', 'lucita');
  let fill = ui.prompt('HOLD', 'Get in');
  await input.hold(700, p => fill(p));
  ui.prompt(null);
  sfx.play('whoosh');
  k.boarded = true;

  await radio.turnOn('gator', { quiet: true });
  radio.volume(0.3, 1);
  const speaker = () => ui.radioLive(radio.status(), { name: 'Bluetooth speaker', sub: 'The Gator' });

  // ---------------- Paddling ----------------
  const STROKES = 26;
  let progress = 0, last = null, talk = Promise.resolve();
  const line = (who, t, v) => { talk = talk.then(() => say(who, t, v, { passive: true, hold: 900 })); };
  const hint = next => ui.el('side', 'side-hint', `<div class="${next !== 'R' ? 'go' : ''}">L</div><div class="${next !== 'L' ? 'go' : ''}">R</div>`);
  hint(null);
  ui.prompt('TAP', 'Left, right, left, right');
  setTimeout(() => ui.prompt(null), 3000);
  const said = new Set();

  const paddleTo = target => new Promise(resolve => {
    input.waiter = {
      down(e) {
        const r = game.canvas.getBoundingClientRect();
        const side = e.clientX < r.left + r.width / 2 ? 'L' : 'R';
        if (side === last) {
          date.circles++;
          k.spin = 1;
          game.tween(k, 'spin', 0, 900, 'out');
          progress = Math.max(0, progress - 0.02);
          sfx.play('paint');
          if (date.circles === 1) line('LUCITA', "We're going in circles.", 'lucita');
          else if (date.circles === 4) line('LUCITA', 'Other side, Jase.', 'lucita');
          last = null;
          hint(null);
          return;
        }
        last = side;
        hint(side === 'L' ? 'R' : 'L');
        progress = Math.min(target, progress + 1 / STROKES);
        k.v = Math.min(70, k.v + 28);
        sfx.play('paint');
        if (progress >= target) { this.done(); resolve(); }
      },
      up() {}, move() {}, done() { input.waiter = null; },
    };
  });

  // scroll and story beats run on their own clock while you paddle
  let running = true;
  (function tick(prev) {
    requestAnimationFrame(now => {
      const dt = Math.min(0.05, (now - (prev ?? now)) / 1000);
      k.v *= Math.pow(0.35, dt);
      k.scroll += k.v * dt;
      ui.progress('Mangroves', progress * 100, 'left');
      if (progress > 0.25 && !said.has('chickens')) {
        said.add('chickens');
        line('LUCITA', "Do you ever think about just... not going back? A little place in the Keys. Chickens.", 'lucita');
        line('JASE', "You'd hate chickens.", 'jase');
      }
      if (running) { speaker(); tick(now); }
    });
  })();

  await paddleTo(0.72);
  ui.hide('side');
  await talk;

  // ---------------- The manatee ----------------
  k.manY = 282;
  game.tween(k, 'manY', 272, 1200, 'out');
  sfx.play('drip');
  fill = ui.prompt('HOLD', 'Sit very still', 'high');
  const stayed = await Promise.race([input.hold(2600, p => fill(p)).then(() => true), game.wait(7000).then(() => false)]);
  input.waiter = null;
  ui.prompt(null);
  date.manatee = stayed;
  if (stayed) {
    sfx.play('toast');
    ui.toast('Wildlife spotted', 'West Indian Manatee (1 of 1)', '#5ad1ff');
    await game.wait(1200);
    await say('LUCITA', "I'd hate them with you.", 'lucita');
    state.hearts = Math.min(4, state.hearts + 1);
    k.heartY = 206;
    game.tween(k, 'heartY', 190, 1400, 'out');
    sfx.play('heartUp');
    ui.hud({ hearts: state.hearts, money: state.money, time: '6:19 AM' });
    ui.toast('Relationship ↑', 'A manatee was involved.', '#ff5d8f');
    await game.wait(2200);
    k.heartY = null;
  } else {
    await game.tween(k, 'manY', 290, 900);
    await say('LUCITA', 'It left.', 'lucita');
    await say('LUCITA', 'You have to be still sometimes, Jase.', 'lucita');
  }
  k.manY = null;

  // ---------------- Back to the dock ----------------
  hint(last === 'L' ? 'R' : last === 'R' ? 'L' : null);
  await paddleTo(1);
  running = false;
  ui.hide('side');
  ui.progress(false);
  ui.radio(null);
  if (radio.on) { radio.volume(0, 1); setTimeout(() => radio.turnOff(), 1100); }
  await talk;
  await game.wait(600);

  // ---------------- Date complete ----------------
  ui.hud(null);
  ui.dim(true, 0.45);
  sfx.play('passed');
  await ui.passed('DATE COMPLETE', 'Low Tide', 'Mangroves paddled: 1 of 1',
    `Relationship: Level ${state.hearts}, "${LEVEL_NAMES[state.hearts]}"`, () => input.tap());
  ui.dim(false);
  state.mission = 5;
  game.save();
}
