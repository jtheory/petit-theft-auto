// Mission 2: Coming Home. Jase picks Lucita up on release day.
// See docs/storyboard.md, Beat 2.
//
// Pays off Mission 1:
//   roofFixed = false  -> it's raining; put a pot out (and she sees it later)
//   ma = 'ignored'     -> another voicemail
//   porchPainted       -> "You remembered." and the first heart. Without it: "It's still standing." No heart.
// New: the drive. HOLD to drive, SWIPE to change station. If you never touch the radio, Lucita puts on
// The Gator. Change away from her pick twice and she turns the radio off (f.drive.radioOff).

import { sfx } from '../audio/sfx.js';
import { makeChatter } from '../game/say.js';

export const LEVEL_NAMES = ["It's Been a While", 'Complicated', 'Seeing Where It Goes', 'Something Real', 'All In'];

const REACTIONS = {
  neon:    [['LUCITA', 'Fine. The sunset one.', 'lucita']],
  gator:   [['LUCITA', '...Fine.', 'lucita']],
  seniors: [['LUCITA', 'Are we old now? Is that what happened?', 'lucita']],
  viral:   [['LUCITA', 'Absolutely not.', 'lucita']],
  talk:    [['LUCITA', 'No news. Not today.', 'lucita']],
};

export default async function comingHome(game, radio) {
  const { ui, say, input, state, art } = game;
  const f = state.flags;
  const houseState = () => ({ roof: f.roofFixed ? 1 : 0, porch: f.porchPainted ? 1 : 0, lit: false, boarded: !f.grouted, patched: !!f.grouted });

  // ---------------- Morning ----------------
  const m = { raining: !f.roofFixed, potOut: false, jx: 120, bob: false, gull: -20 };
  const morning = (a, t) => {
    a.sky(132);
    if (!m.raining && m.gull > -20 && m.gull < 200) a.R(Math.round(m.gull), 64 + Math.round(Math.sin(t * 3) * 3), 5, 1, '#2a1b2d');
    a.ground();
    a.house(houseState());
    a.palm(10, 214); a.palm(166, 206);
    if (m.potOut) a.pot(102, 190, t);
    a.convertible(84, 286);
    a.sprite(a.JASE, Math.round(m.jx), 214 - (m.bob && Math.floor(t * 8) % 2 ? 1 : 0));
    if (m.raining) a.rain(t);
    if (m.spot) { a.g.globalAlpha = 0.55 + 0.45 * Math.sin(t * 6); a.hotspot(...m.spot); a.g.globalAlpha = 1; }
  };
  const walk = async (obj, key, to, k = 18) => { obj.bob = true; await game.tween(obj, key, to, Math.abs(to - obj[key]) * k, 'linear'); obj.bob = false; };

  game.setScene(a => a.R(0, 0, 180, 320, '#000'));
  await ui.coldOpen('Release day.', 2600);
  game.setScene(morning);

  if (m.raining) {
    sfx.play('rain');
    const rainTimer = setInterval(() => sfx.play('rain'), 6000);
    await game.wait(1200);
    await say('', 'It rained in the night. It rained inside, too.', 'jaseInner', { italic: true });
    m.spot = [104, 186];
    ui.prompt('TAP', 'Put out a pot');
    await input.pick([{ key: 'pot', x: 104, y: 186, r: 26 }]);
    ui.prompt(null);
    m.spot = null;
    await walk(m, 'jx', 96);
    m.potOut = true;
    sfx.play('drip');
    const drips = setInterval(() => sfx.play('drip'), 900);
    ui.toast('Pot deployed', 'Leak contained. Mostly.', '#5ad1ff');
    await game.wait(2200);
    clearInterval(drips);
    clearInterval(rainTimer);
    m.raining = false;
  } else {
    sfx.play('seagull');
    game.tween(m, 'gull', 200, 6000, 'linear');
    await game.wait(1600);
  }

  if (f.ma === 'ignored') {
    sfx.play('textPing');
    ui.dim(true, 0.3);
    ui.phone('Ma', 'voicemail');
    await game.wait(400);
    await say('MA', "You didn't call me back. I'm not mad. I'm calling your aunt.", 'ma');
    ui.phone(null);
    ui.dim(false);
    await game.wait(400);
  } else if (f.ma === 'honest') {
    sfx.play('textPing');
    ui.toast('Ma', 'did u buy a vegetable', '#9be37a');
    await game.wait(2000);
  }

  await walk(m, 'jx', 118);
  let fill = ui.prompt('HOLD', 'Start the car');
  await input.hold(800, p => fill(p));
  ui.prompt(null);
  sfx.play('engine');
  ui.dim(true, 1);
  await game.wait(1400);

  // ---------------- Release ----------------
  const r = { ly: 180, lvis: false, gate: false, bob: false };
  game.setScene(a => {
    a.daySky(); a.prison();
    if (r.gate) { a.R(72, 160, 48, 46, '#26272c'); a.R(72, 160, 48, 2, '#1a1b1f'); }
    a.convertible(70, 290);
    a.sprite(a.JASE, 40, 252);
    if (r.lvis) {
      const y = Math.round(r.ly) - (r.bob && Math.floor(game.t * 7) % 2 ? 1 : 0);
      a.sprite(a.LUCITA_JUMP, 88, y);
      a.sprite(a.BAG, 106, y + 16);
    }
  });
  ui.letterbox(true);
  ui.dim(false);
  await game.wait(800);
  sfx.play('gateBuzz');
  await game.wait(900);
  r.gate = true;
  r.lvis = true;
  walk(r, 'ly', 214, 90);
  sfx.play('card');
  await ui.card('Mission 2  ·  Release Day', 'Coming\nHome', 3400);
  ui.letterbox(false);
  await game.wait(600);
  await say('LUCITA', "You kept your father's car.", 'lucita');
  await say('JASE', 'It kept me.', 'jase');
  fill = ui.prompt('HOLD', 'Open her door');
  await input.hold(700, p => fill(p));
  ui.prompt(null);
  sfx.play('carDoor');
  f.openedDoor = true;
  await game.wait(600);
  ui.dim(true, 1);
  await game.wait(700);

  // ---------------- The drive ----------------
  const d = { dist: 0, speed: 0, scroll: 0, holding: false };
  game.setScene((a, t, dt) => {
    a.causeway(d.scroll, 112 + Math.round(d.dist * 30));
    a.convertible(46, 258 + (d.speed > 0.2 && Math.floor(t * 10) % 2 ? 1 : 0), true);
  });
  ui.dim(false);
  ui.hud({ hearts: state.hearts, money: state.money, time: '4:18 PM' });
  await radio.turnOn('neon', { segment: 0, quiet: true });
  radio.volume(0.8, 0.5);
  ui.prompt('HOLD', 'Drive   ·   Swipe: radio');

  // The radio is a small negotiation. Leave it alone and Lucita puts on The Gator ("I missed this one").
  // Change away from her pick once and she puts it back; do it again and the radio goes off for good.
  // Viral and Talk get vetoed on sight.
  const chat = makeChatter(say), lines = chat.lines;
  let touchedRadio = false, lucitaPicked = false, lucitaWaiting = false, overrides = 0, radioOff = false, swipes = 0;
  const reacted = new Set(['neon']);
  // She's patient with ads, up to a point: she lets one play most of the way through, then changes it.
  let driving = true;
  const patience = () => new Promise(resolve => {
    const t0 = performance.now();
    const check = () => {
      const st = radio.status();
      if (!driving || st.kind !== 'ad' || st.elapsed / st.dur > 0.8 || performance.now() - t0 > 14000) return resolve();
      requestAnimationFrame(check);
    };
    check();
  });
  const lucitaTunes = async id => {
    await patience();
    if (radioOff || !radio.on) return;
    reacted.add(id); radio.tune(id); ui.toast('Lucita changed the station.', '', '#ff8fb1', 2000);
  };
  const onStation = () => {
    const id = radio.stations[radio.index].id;
    if (lucitaPicked && id !== 'gator') {
      overrides++;
      if (overrides === 1) {
        lines([['LUCITA', 'I was listening to that.', 'lucita']]).then(() => { if (!radioOff) lucitaTunes('gator'); });
      } else {
        radioOff = true;
        lines([['LUCITA', 'Okay. No radio.', 'lucita']]).then(() => {
          radio.volume(0, 0.3);
          setTimeout(() => radio.turnOff(), 350);
          ui.toast('Lucita turned off the radio.', '', '#ff8fb1', 2400);
        });
      }
      return;
    }
    if (swipes === 6) lines([['LUCITA', 'Pick one, Jase.', 'lucita']]);
    if (!reacted.has(id)) {
      reacted.add(id);
      lines(REACTIONS[id]).then(() => {
        if ((id === 'viral' || id === 'talk') && !radioOff && radio.stations[radio.index].id === id) return lucitaTunes(lucitaPicked ? 'gator' : 'neon');
      });
    }
  };

  input.waiter = {
    down() { d.holding = true; },
    up(g) {
      d.holding = false;
      if (radioOff) return;
      if (Math.abs(g.dx) > 50 && Math.abs(g.dx) > Math.abs(g.dy)) {
        touchedRadio = true;
        swipes++;
        g.dx < 0 ? radio.next() : radio.prev();
        onStation();
      }
    },
    move() {},
    done() {},
  };

  const DRIVE_SECS = 24;
  let saidClassic = false;
  await new Promise(resolve => {
    let last = performance.now();
    const step = now => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const target = d.holding ? 1 : 0;
      d.speed += (target - d.speed) * Math.min(1, dt * 1.8);
      d.dist = Math.min(1, d.dist + (d.speed * dt) / DRIVE_SECS);
      d.scroll += d.speed * dt * 70;
      ui.progress('Home', d.dist * 100, 'left');
      const rs = radio.status();
      ui.radioLive(rs);
      // only when a song is actually playing (not an ad, not the DJ)
      if (!saidClassic && d.dist > 0.3 && d.dist < 0.6 && rs.on && rs.kind === 'song') {
        saidClassic = true;
        lines([['LUCITA', "Three years and they're still playing this song.", 'lucita'], ['JASE', "It's a classic.", 'jase']]);
      }
      if (!touchedRadio && !lucitaWaiting && d.dist > 0.62) {
        lucitaWaiting = true;
        chat.after(speak => {
          if (touchedRadio) return;   // you got there first
          lucitaPicked = true;
          return lucitaTunes('gator').then(() => speak('LUCITA', 'This one. I missed this one.', 'lucita'));
        });
      }
      if (d.dist >= 1) return resolve();
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
  input.waiter = null;
  driving = false;
  ui.prompt(null);
  await chat.idle();
  ui.progress(false);
  ui.radio(null);
  f.drive = { touchedRadio, station: radioOff ? 'off' : radio.stations[radio.index].id, lucitaPicked, radioOff };

  // ---------------- The porch ----------------
  ui.hud(null);
  ui.dim(true, 1);
  radio.volume(0, 1.5);
  setTimeout(() => radio.turnOff(), 1600);
  await game.wait(800);
  const h = { lx: 60, jx: 132, bob: false, heartY: null };
  game.setScene((a, t) => {
    a.sky(168); a.ground(); a.house({ ...houseState(), lit: true });
    a.palm(10, 214); a.palm(166, 206);
    if (!f.roofFixed) a.pot(102, 190, t);
    a.convertible(84, 286);
    a.sprite(a.LUCITA_JUMP, Math.round(h.lx), 216 - (h.bob && Math.floor(t * 7) % 2 ? 1 : 0));
    a.sprite(a.JASE, Math.round(h.jx), 214);
    if (h.heartY !== null) a.pixelHeart(98, Math.round(h.heartY));
  });
  ui.dim(false);
  ui.letterbox(true);
  await walk(h, 'lx', 84, 40);
  await game.wait(900);
  if (f.porchPainted) {
    await say('LUCITA', '...You painted the porch.', 'lucita');
    await game.wait(1800);
    await say('LUCITA', 'Jase. You remembered.', 'lucita');
  } else {
    await say('LUCITA', "...It's still standing.", 'lucita');
  }
  if (!f.roofFixed) {
    await say('LUCITA', 'Is that a pot?', 'lucita');
    await say('JASE', "It's load-bearing.", 'jase');
  }
  ui.letterbox(false);
  ui.hud({ hearts: state.hearts, money: state.money, time: '7:03 PM' });
  await walk(h, 'jx', 104);
  fill = ui.prompt('HOLD', 'Take her hand');
  await input.hold(900, p => fill(p));
  ui.prompt(null);

  if (f.porchPainted) {
    state.hearts = Math.min(4, state.hearts + 1);
    h.heartY = 206;
    game.tween(h, 'heartY', 190, 1400, 'out');
    sfx.play('heartUp');
    ui.hud({ hearts: state.hearts, money: state.money, time: '7:03 PM' });
    ui.toast('Relationship ↑', 'Lucita noticed the effort.', '#ff5d8f');
  } else {
    sfx.play('toast');
    ui.toast('Relationship unchanged', "She let you. She's thinking about it.", '#aaaaaa');
  }
  await game.wait(2800);

  // ---------------- Mission passed ----------------
  ui.hud(null);
  ui.dim(true, 0.45);
  sfx.play('passed');
  await ui.passed('MISSION PASSED', 'Coming Home', `Relationship: Level ${state.hearts}`, `"${LEVEL_NAMES[state.hearts]}"`, () => input.tap());
  ui.dim(false);
  state.mission = 3;
  game.save();
}
