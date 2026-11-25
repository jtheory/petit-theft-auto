// Mission 5: Cash for Gold. A pawn-shop safe; Lucita is lookout and texts about oat milk mid-drill.
// See docs/storyboard.md, Beat 5.
//
//   drill   HOLD to drill. The drill heats up while held; let go to cool it. Overheat and it jams.
//   patrol  a real timer. If the patrol arrives before the safe opens: BUSTED, retry the drill.
//   text    arrives halfway. You can't drill while you're on your phone, and the timer keeps running.
//           ❤️ "Already in the fridge, babe" keeps the heart; 👍 or ignoring it costs one.

import { sfx } from '../audio/sfx.js';
import { playLoop } from '../audio/music.js';

const PATROL_SECS = 45;
const DRILL_SECS = 20;

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
    await say('MA', "Benny's mother called my mother. We'll talk about it.", 'ma');
    ui.phone(null);
    await game.wait(300);
  }
  await say('LUCITA', "I'll be out here. Text me.", 'lucita');
  await say('JASE', "It's a pawn shop. What could happen.", 'jase');
  sfx.play('card');
  await ui.card('Mission 4  ·  Lucita is lookout', 'Cash for\nGold', 3200, { top: true });
  ui.letterbox(false);
  ui.dim(true, 1);
  await game.wait(500);

  // ---------------- The safe ----------------
  let textAnswered = null, busts = 0;
  for (;;) {
    const result = await drill(game, textAnswered === null, busts);
    if (result.text !== undefined) textAnswered = result.text;
    if (result.ok) break;
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
  f.text = textAnswered;
  f.oatMilk = 'unresolved';
  f.safeBusts = busts;

  // ---------------- Escape ----------------
  game.setScene(a => {
    a.alley();
    a.convertible(84, 262);
    a.sprite(a.LUCITA_CASUAL.slice(0, 9), 140, 224);
    a.sprite(a.JASE_MASK, 54, 228); a.duffel(40, 246);
  });
  state.money += 2340;
  ui.hud({ hearts: state.hearts, money: state.money, time: '2:16 AM', wanted: 1 });
  ui.dim(false);
  sfx.play('carDoor');
  await say('LUCITA', 'Did you get it or not.', 'lucita');
  await say('JASE', 'The safe? Yeah.', 'jase');
  await say('LUCITA', 'The milk, Jase.', 'lucita');
  if (textAnswered === 'heart') await say('LUCITA', "You said it was in the fridge.", 'lucita');
  sfx.play('engine');
  await game.wait(800);

  ui.hud(null);
  ui.dim(true, 0.45);
  sfx.play('passed');
  await ui.passed('MISSION PASSED', 'Cash for Gold', '$2,340', 'Oat milk: unresolved.', () => input.tap());
  ui.dim(false);
  state.mission = 6;
  game.save();
}

// One attempt at the safe. Returns { ok, text } (text = the reply, if the text arrived this attempt).
async function drill(game, withText, busts) {
  const { ui, input, state } = game;
  const d = { progress: 0, heat: 0, jam: 0, left: PATROL_SECS + busts * 6, holding: false, text: undefined, phone: false };
  game.setScene((a, t) => {
    a.pawnRoom();
    a.sprite(a.JASE_MASK, 70, 200);
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
    sfx.play('textPing');
    msgs.push(['them', 'also did u get the oat milk']);
    ui.thread('Lucita', msgs);
    await game.wait(900);
    sfx.play('textPing');
    msgs.push(['them', 'not the vanilla one. the one with the green cap']);
    ui.thread('Lucita', msgs, [['heart', '❤️ "Already in the fridge, babe"'], ['thumbs', '👍'], ['ignore', 'Ignore']]);
    const reply = await input.pick();
    sfx.play('click');
    if (reply === 'ignore') { ui.thread(null); }
    else {
      msgs.push(['me', reply === 'heart' ? '❤️ Already in the fridge, babe' : '👍']);
      ui.thread('Lucita', msgs);
      await game.wait(700);
      ui.thread(null);
    }
    if (reply === 'heart') {
      sfx.play('toast');
      ui.toast('Relationship holds', "She'll check the fridge.", '#ff5d8f');
    } else {
      state.hearts = Math.max(0, state.hearts - 1);
      hud();
      sfx.play('heartDown');
      ui.toast('Relationship ↓', reply === 'thumbs' ? 'Lucita felt dismissed.' : 'Lucita felt ignored.', '#ff5d8f');
      if (reply === 'ignore') setTimeout(() => { if (!d.done) { sfx.play('textPing'); ui.toast('Lucita', 'ok.', '#aaaaaa', 2200); } }, 4000);
    }
    return reply;
  }

  d.done = true;
  input.waiter = null;
  music.stop(0.5);
  ui.prompt(null);
  ui.thread(null);
  ui.progress(false);
  ui.hide('timer');
  ui.hide('heat');
  if (outcome) {
    sfx.play('register');
    ui.el('lost', 'passed', '<div class="big" style="font-size:26px;color:#9be37a;text-shadow:0 2px 0 #1b3a12;margin-top:40px">SAFE OPEN</div>');
    await game.wait(1500);
    ui.hide('lost');
  } else {
    sfx.play('siren');
    await game.wait(900);
  }
  ui.hud(null);
  return { ok: outcome, text: d.text };
}
