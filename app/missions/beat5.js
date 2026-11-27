// Mission 5: Cash for Gold. A pawn-shop safe; Lucita is lookout, and she spots something in the window.
// See docs/storyboard.md, Beat 5.
//
//   drill   HOLD to drill. The drill heats up while held; let go to cool it. Overheat and it jams.
//   patrol  a real timer. If the patrol arrives before the safe opens: BUSTED, retry the drill.
//   text    arrives halfway: her sister Marisol's stolen quinceañera ring is in the front window. Can you grab it?
//           You can't drill while you're on your phone, and the timer keeps running.
//   ring    only if the safe opens with RING_SECS or more left on the patrol clock. Then it's your call.
//           Got it: +1 heart. Promised and didn't: -1. Said "no time" and didn't: no change. Ignored her: -1.

import { sfx } from '../audio/sfx.js';
import { playLoop } from '../audio/music.js';

const PATROL_SECS = 45;
const DRILL_SECS = 20;
const RING_SECS = 8;   // time you need left on the patrol clock to get the ring out of the window case

export default async function cashForGold(game, radio) {
  const { ui, say, input, state } = game;
  const f = state.flags;

  // ---------------- Drop-off ----------------
  game.setScene(a => {
    a.alley();
    a.convertible(84, 262);
    a.sprite(a.LUCITA_CASUAL.slice(0, 9), 140, 224);
    a.sprite(a.JASE, 54, 228);
  });
  ui.letterbox(true);
  if (f.robbedStore) {
    sfx.play('textPing');
    ui.phone('Ma', 'voicemail');
    await game.wait(400);
    await say('MA', "Benny's mother called me. We'll talk about it.", 'ma');
    ui.phone(null);
    await game.wait(300);
  }
  await say('LUCITA', "I'll be out front. I'll text you.", 'lucita');
  await say('JASE', "It's a pawn shop. What could happen.", 'jase');
  sfx.play('card');
  await ui.card('Mission 4  ·  Lucita is lookout', 'Cash for\nGold', 3200, { top: true });
  ui.letterbox(false);
  ui.dim(true, 1);
  await game.wait(500);

  // ---------------- The safe ----------------
  let reply = null, ring = null, busts = 0;
  for (;;) {
    const result = await drill(game, reply, busts);
    if (result.text !== undefined) reply = result.text;
    if (result.ok) { ring = result.ring; break; }
    busts++;
    sfx.play('busted');
    ui.hud(null);
    ui.dim(true, 0.55);
    ui.el('busted', 'passed busted', `<div class="big">BUSTED</div><div class="mn">Cash for Gold</div>
      <div class="fx">Lucita (text): "i said patrol was coming"</div><div class="cont">Tap to retry the safe</div>`);
    await game.wait(1200);
    await input.tap();
    ui.hide('busted');
    ui.dim(false);
  }
  f.text = reply;
  f.ring = ring === 'got' ? 'got' : { yes: 'promised', no: 'declined', ignore: 'ignored' }[reply];
  f.safeBusts = busts;

  // ---------------- Escape ----------------
  const es = { ring: false, heartY: null };
  game.setScene(a => {
    a.alley();
    a.convertible(84, 262);
    a.sprite(a.LUCITA_CASUAL.slice(0, 9), 140, 224);
    a.sprite(a.JASE_MASK, 54, 228); a.duffel(40, 246);
    if (es.ring) { a.R(128, 236, 4, 3, '#f2c14e'); a.R(129, 235, 2, 1, '#3fdc7a'); }
    if (es.heartY !== null) a.pixelHeart(132, Math.round(es.heartY));
  });
  state.money += 2340;
  const hud = () => ui.hud({ hearts: state.hearts, money: state.money, time: '2:16 AM', wanted: 1 });
  hud();
  ui.dim(false);
  sfx.play('carDoor');
  await say('LUCITA', 'Did you get it?', 'lucita');
  await say('JASE', 'The safe? Yeah.', 'jase');
  await say('LUCITA', 'Jase.', 'lucita');
  if (f.ring === 'got') {
    await say('JASE', '...And this.', 'jase');
    es.ring = true;
    sfx.play('toast');
    await game.wait(900);
    await say('LUCITA', "That's hers. That's really hers.", 'lucita');
    state.hearts = Math.min(4, state.hearts + 1);
    es.heartY = 222;
    game.tween(es, 'heartY', 206, 1400, 'out');
    sfx.play('heartUp');
    hud();
    ui.toast('Relationship ↑', "You got Marisol's ring back.", '#ff5d8f');
    await game.wait(2400);
  } else if (f.ring === 'promised') {
    await say('JASE', "There wasn't time.", 'jase');
    await say('LUCITA', "You said you were on it.", 'lucita');
    state.hearts = Math.max(0, state.hearts - 1);
    sfx.play('heartDown');
    hud();
    ui.toast('Relationship ↓', 'You promised.', '#ff5d8f');
    await game.wait(2200);
  } else if (f.ring === 'declined') {
    await say('JASE', 'I told you. No time.', 'jase');
    await say('LUCITA', 'I know. You told me.', 'lucita');
    sfx.play('toast');
    ui.toast('Relationship unchanged', 'She understands. Mostly.', '#aaaaaa');
    await game.wait(2200);
  } else {
    await say('LUCITA', "You didn't even answer me.", 'lucita');
    state.hearts = Math.max(0, state.hearts - 1);
    sfx.play('heartDown');
    hud();
    ui.toast('Relationship ↓', 'Lucita felt ignored.', '#ff5d8f');
    await game.wait(2200);
  }
  sfx.play('engine');
  await game.wait(800);

  ui.hud(null);
  ui.dim(true, 0.45);
  sfx.play('passed');
  await ui.passed('MISSION PASSED', 'Cash for Gold', '$2,340', f.ring === 'got' ? "Marisol's ring: recovered." : "Marisol's ring: still in the window.", () => input.tap());
  ui.dim(false);
  state.mission = 6;
  game.save();
}

// One attempt at the safe. Returns { ok, text, ring } (text = the reply, if the text arrived this attempt;
// ring = 'got' | 'late' | 'left' once the safe is open and she asked).
async function drill(game, reply, busts) {
  const { ui, input, state } = game;
  const withText = reply === null;
  const d = { progress: 0, heat: 0, jam: 0, left: PATROL_SECS + busts * 6, holding: false, text: undefined, phone: false, jx: 70, drillOut: true, ringGone: false, glint: false, bob: false };
  game.setScene((a, t) => {
    a.pawnRoom();
    a.windowCase(!d.ringGone, d.glint && Math.floor(t * 4) % 2 === 0);
    a.sprite(a.JASE_MASK, Math.round(d.jx), 200 - (d.bob && Math.floor(t * 8) % 2 ? 1 : 0));
    if (!d.drillOut) return;
    const hot = Math.min(1, d.heat);
    a.R(86, 214, 12, 4, hot > 0.75 ? '#e0502a' : hot > 0.45 ? '#e08a20' : '#e0a020');
    a.R(96, 215, 6, 2, '#aaa');
    if (d.holding && d.jam <= 0 && !d.phone) a.sparks(104, 214);
    if (d.jam > 0) for (let i = 0; i < 6; i++) a.R(88 + ((i * 5 + Math.floor(t * 12)) % 10), 204 - ((i * 7 + Math.floor(t * 20)) % 16), 3, 3, 'rgba(200,200,200,.6)');
  });
  ui.dim(false);
  const hud = () => ui.hud({ hearts: state.hearts, money: state.money, time: '2:14 AM' });
  hud();
  const music = await playLoop('chase', { vol: 0.35 });
  ui.prompt('HOLD', 'Drill  ·  let go to cool it', 'high');
  setTimeout(() => { if (!d.phone) ui.prompt(null); }, 3500);

  input.waiter = { down() { d.holding = true; }, up() { d.holding = false; }, move() {}, done() {} };
  let drillSound = 0, textShown = false;

  const outcome = await new Promise(resolve => {
    let last = performance.now();
    const step = async now => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      d.left -= dt;
      const drilling = d.holding && d.jam <= 0 && !d.phone;
      if (d.jam > 0) { d.jam -= dt; if (d.jam <= 0) d.heat = 0.6; }   // a jammed drill doesn't cool; it restarts warm
      if (drilling) {
        d.progress = Math.min(1, d.progress + dt / DRILL_SECS);
        d.heat += dt / 3.5;
        if (now - drillSound > 1300) { drillSound = now; sfx.play('drill'); }
        if (d.heat >= 1) {
          d.jam = 3;
          d.heat = 1;
          sfx.play('crash');
          ui.toast('Drill jammed', 'Overheated. Give it a second.', '#ff5a4a', 2000);
        }
      } else if (d.jam <= 0) d.heat = Math.max(0, d.heat - dt / 1.6);
      ui.progress('Drilling', d.progress * 100, 'left');
      const secs = Math.max(0, Math.ceil(d.left));
      ui.el('timer', 'timer' + (secs <= 10 ? ' urgent' : ''), `<span>Patrol arrives in</span> 0:${String(secs).padStart(2, '0')}`);
      ui.el('heat', 'heat', `<span>Heat</span><div><i style="width:${Math.min(100, d.heat * 100)}%"></i></div>`);

      if (withText && !textShown && d.progress >= 0.5) {
        textShown = true;
        d.phone = true;
        d.holding = false;
        input.waiter = null;
        handleText().then(reply => {
          d.text = reply;
          d.phone = false;
          input.waiter = { down() { d.holding = true; }, up() { d.holding = false; }, move() {}, done() {} };
        });
      }
      if (d.progress >= 1) return resolve(true);
      if (d.left <= 0) return resolve(false);
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });

  // The text: read it, reply (or don't). The patrol clock doesn't stop for this.
  async function handleText() {
    sfx.play('textPing');
    const msgs = [['them', 'all clear out here']];
    ui.thread('Lucita', msgs);
    await game.wait(900);
    d.glint = true;
    for (const m of ['jase. front window. gold ring w the little green stone', "that's marisol's. her quince ring. somebody stole it in march", 'can u grab it??']) {
      sfx.play('textPing');
      msgs.push(['them', m]);
      ui.thread('Lucita', msgs, m.endsWith('??') ? [['yes', '❤️ "On it"'], ['no', '"No time, babe"'], ['ignore', 'Ignore']] : null);
      if (!m.endsWith('??')) await game.wait(1100);
    }
    const r = await input.pick();
    sfx.play('click');
    if (r === 'ignore') ui.thread(null);
    else {
      msgs.push(['me', r === 'yes' ? '❤️ On it' : 'No time, babe']);
      ui.thread('Lucita', msgs);
      await game.wait(700);
      ui.thread(null);
    }
    if (r === 'ignore') setTimeout(() => { if (!d.done) { sfx.play('textPing'); ui.toast('Lucita', 'ok.', '#aaaaaa', 2200); } }, 4000);
    return r;
  }

  d.done = true;
  input.waiter = null;
  music.stop(0.5);
  ui.prompt(null);
  ui.thread(null);
  ui.progress(false);
  ui.hide('timer');
  ui.hide('heat');
  let ring = null;
  if (outcome) {
    sfx.play('register');
    ui.el('lost', 'passed', '<div class="big" style="font-size:26px;color:#9be37a;text-shadow:0 2px 0 #1b3a12;margin-top:40px">SAFE OPEN</div>');
    await game.wait(1500);
    ui.hide('lost');
    d.drillOut = false;
    // The ring: only if she asked, and only if there's time left on the clock.
    const asked = reply ?? d.text;
    if (asked) {
      const secs = Math.max(0, Math.floor(d.left));
      ui.el('timer', 'timer' + (secs < RING_SECS ? ' urgent' : ''), `<span>Patrol arrives in</span> 0:${String(secs).padStart(2, '0')}`);
      if (secs < RING_SECS) {
        sfx.play('heartDown');
        await ui.toast('No time for the window', `The ring case takes ${RING_SECS} seconds. You have ${secs}.`, '#ff5a4a', 2600);
        ring = 'late';
      } else {
        ui.choices(`The ring  ·  ${secs}s left`, [['grab', 'Grab the ring (front window)'], ['leave', 'Leave it']]);
        const c = await input.pick();
        sfx.play('click');
        ui.choices(null);
        if (c === 'grab') {
          d.bob = true;
          await game.tween(d, 'jx', 34, 700, 'linear');
          d.bob = false;
          const fill = ui.prompt('HOLD', 'Pop the case', 'high');
          await input.hold(1200, p => fill(p));
          ui.prompt(null);
          sfx.play('grout');
          d.ringGone = true;
          d.glint = false;
          ui.toast('Got it', "Marisol's ring", '#f2c14e', 1800);
          await game.wait(900);
          ring = 'got';
        } else ring = 'left';
      }
      ui.hide('timer');
    }
  } else {
    sfx.play('siren');
    await game.wait(900);
  }
  ui.hud(null);
  return { ok: outcome, text: d.text, ring };
}
