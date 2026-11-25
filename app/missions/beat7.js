// Mission 7 (Mission 6 in-game): The Job. The bank, with a crew.
// See docs/storyboard.md, Beat 7.
//
//   approach   The Smart Way: TAP only while the camera light is green (red = +1 star)
//              The Loud Way:  RAPID TAP to yell. 3 stars, no subtlety.
//              Through the Ceiling Tiles: HOLD to crawl; the creak meter fills while you move. Full = you fall through (+1 star).
//   betrayal   Who do you trust? Lucita (+1 heart) / Rudy (he leaves with half; -1 heart)
//   getaway    the chase from Mission 3, in daylight, with your stars (difficulty capped at 3)

import { sfx } from '../audio/sfx.js';
import { playLoop } from '../audio/music.js';
import { chase } from './beat3.js';

export default async function theJob(game, radio) {
  const { ui, say, input, state } = game;
  const f = state.flags;
  let stars = 0;
  const crewSprites = (a, masked, xs) => {
    const s = masked ? [a.RUDY_MASK, a.TINA_MASK, a.LUCITA_MASK, a.JASE_MASK] : [a.RUDY, a.TINA, a.LUCITA_CASUAL, a.JASE];
    s.forEach((sp, i) => a.sprite(sp, Math.round(xs[i]), i === 0 || i === 3 ? 190 : 194));
  };

  // ---------------- The crew ----------------
  game.setScene(a => { a.blueprintRoom(); crewSprites(a, false, [24, 56, 108, 134]); a.R(70, 212, 12, 8, '#9aa0aa'); });
  ui.letterbox(true);
  sfx.play('card');
  await ui.card('Mission 6  ·  The Big One', 'The Job', 3200, { top: true });
  await say('LUCITA', 'Everybody in this room is gonna be tempted. Be tempted somewhere else.', 'lucita');
  await say('RUDY', "I'm just here for the snacks.", 'rudy');
  await say('TINA', 'Vault is on a 90-second timer. Cameras loop every 40. The guard is named Doug and he is going through a divorce.', 'tina');
  ui.letterbox(false);
  ui.dim(true, 0.4);
  ui.choices('Choose your approach', [['smart', 'The Smart Way'], ['loud', 'The Loud Way'], ['ceiling', 'Through the Ceiling Tiles']]);
  f.jobApproach = await input.pick();
  sfx.play('click');
  ui.choices(null);
  ui.dim(false);
  if (f.jobApproach === 'smart') await say('TINA', 'Finally.', 'tina');
  if (f.jobApproach === 'loud') await say('RUDY', 'Now we are talking.', 'rudy');
  if (f.jobApproach === 'ceiling') await say('LUCITA', 'Why is it always the ceiling with you.', 'lucita');
  ui.dim(true, 1);
  await game.wait(500);

  // ---------------- Walk-in ----------------
  const wk = { x: -60 };
  game.setScene(a => {
    a.bankExterior();
    const sp = [a.RUDY_MASK, a.TINA_MASK, a.LUCITA_MASK, a.JASE_MASK];
    sp.forEach((s, i) => a.sprite(s, Math.round(wk.x + i * 30), 220 + (i % 2) * 4 - (Math.floor(game.t * 4 + i) % 2)));
  });
  ui.dim(false);
  ui.letterbox(true);
  ui.radio('11:58 AM', 'First Bank of Port Mangrove');
  sfx.play('drone');
  await game.tween(wk, 'x', 40, 4200, 'linear');
  ui.radio(null);
  ui.letterbox(false);
  ui.dim(true, 1);
  await game.wait(500);

  // ---------------- The approach ----------------
  const v = { xs: [10, 34, 58, 82], green: true, creak: 0, fell: false, ceiling: f.jobApproach === 'ceiling' };
  window.__job = v;   // for tests and the console
  game.setScene((a, t) => {
    a.vault(false);
    // the camera
    a.R(150, 30, 14, 8, '#3a3a40'); a.R(160, 38, 4, 4, '#3a3a40');
    a.R(152, 32, 3, 3, v.green ? '#4cff6a' : '#ff3b3b');
    if (v.ceiling && !v.fell) {
      a.R(0, 140, 180, 4, '#8a8f96');                       // ceiling line; the crew is above it
      [a.RUDY_MASK, a.TINA_MASK, a.LUCITA_MASK, a.JASE_MASK].forEach((s, i) => a.sprite(s.slice(0, 8), Math.round(v.xs[i]), 120));
    } else {
      [a.RUDY_MASK, a.TINA_MASK, a.LUCITA_MASK, a.JASE_MASK].forEach((s, i) => a.sprite(s, Math.round(v.xs[i]), i % 2 ? 218 : 214));
    }
  });
  ui.dim(false);
  const hud = (time = '12:00 PM') => ui.hud({ hearts: state.hearts, money: state.money, time, wanted: stars, minimap: false });

  if (f.jobApproach === 'smart') {
    stars = 1;
    hud();
    ui.prompt('TAP', 'Move while the light is green', 'high');
    let moves = 0, reds = 0, cycle = 0;
    const blink = setInterval(() => { cycle++; v.green = cycle % 5 < 3; }, 450);
    await new Promise(resolve => {
      input.waiter = {
        down() {
          if (v.green) {
            moves++;
            sfx.play('click');
            v.xs = v.xs.map(x => x + 14);
            if (moves >= 4) { input.waiter = null; resolve(); }
          } else {
            reds++;
            stars = Math.min(5, stars + 1);
            hud();
            sfx.play('heartDown');
            ui.toast('The camera saw you', 'Doug did not. Doug is on his phone.', '#ff5a4a', 2000);
          }
        }, up() {}, move() {}, done() {},
      };
    });
    clearInterval(blink);
    v.green = true;
    f.redLights = reds;
  } else if (f.jobApproach === 'loud') {
    stars = 3;
    hud();
    const fillY = ui.prompt('RAPID TAP', 'Yell', 'high');
    await input.taps(14, p => { fillY(p); sfx.play('hammer'); });
    await say('JASE', 'EVERYBODY DOWN!', 'jase');
    await say('DOUG', '...Okay.', 'doug');
  } else {
    stars = 1;
    hud();
    ui.prompt('HOLD', 'Crawl  ·  let go if it creaks', 'high');
    let progress = 0, holding = false;
    input.waiter = { down() { holding = true; }, up() { holding = false; }, move() {}, done() {} };
    await new Promise(resolve => {
      let last = performance.now(), lastCreak = 0;
      const step = now => {
        const dt = Math.min(0.05, (now - last) / 1000); last = now;
        if (holding && !v.fell) {
          progress += dt / 4.5;
          v.creak += dt / 2.2;
          v.xs = v.xs.map(x => x + dt * 12);
          if (now - lastCreak > 500 && v.creak > 0.5) { lastCreak = now; sfx.play('drip'); }
          if (v.creak >= 1) {
            v.fell = true;
            stars = Math.min(5, stars + 1);
            hud();
            sfx.play('crash');
            ui.toast('You fell through the ceiling', 'Doug looks up.', '#ff5a4a', 2400);
          }
        } else v.creak = Math.max(0, v.creak - dt / 1.2);
        ui.el('heat', 'heat', `<span>Creak</span><div><i style="width:${Math.min(100, v.creak * 100)}%"></i></div>`);
        ui.progress('Crawl', progress * 100, 'left');
        if (progress >= 1 || v.fell) return resolve();
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
    input.waiter = null;
    ui.hide('heat');
    ui.progress(false);
    if (v.fell) { await game.wait(1200); await say('DOUG', 'Hi.', 'doug'); await say('RUDY', 'Hey, Doug.', 'rudy'); }
    else { v.ceiling = false; sfx.play('whoosh'); }
    f.fellThrough = v.fell;
  }
  ui.prompt(null);

  // ---------------- The vault ----------------
  const vt = { rudyX: 120, rudyGun: false, gone: false };
  game.setScene(a => {
    a.vault(true);
    a.sprite(a.TINA_MASK, 20, 214); a.R(34, 230, 12, 8, '#9aa0aa');
    a.sprite(a.LUCITA_MASK, 46, 218);
    a.sprite(a.JASE_MASK, 74, 214); a.duffel(92, 236);
    if (!vt.gone) { a.sprite(a.RUDY_MASK, Math.round(vt.rudyX), 214); if (vt.rudyGun) { a.duffel(136, 236); a.pistol(116, 230); a.pistol(64, 234); } }
  });
  sfx.play('register');
  hud('12:01 PM');
  ui.toast('Vault cracked', 'Estimated take: $4,200,000', '#f2c14e');
  await say('JASE', "...It's bigger than I thought.", 'jase');
  await say('LUCITA', "Everything's bigger than you thought.", 'lucita');

  // ---------------- Betrayal ----------------
  vt.rudyGun = true;
  sfx.play('hammer');
  ui.dim(true, 0.3);
  await say('RUDY', "Nothing personal. I've got a timeshare. Eternal Shores. The maintenance fees are spiritual AND financial.", 'rudy');
  await say('LUCITA', 'Rudy. Put it down.', 'lucita', { keep: true, hold: 300 });
  ui.choices('Who do you trust?', [['lucita', 'Lucita'], ['rudy', 'Rudy']]);
  f.trusted = await input.pick();
  sfx.play('click');
  ui.choices(null);
  ui.hide('sub');
  ui.dim(false);
  let take = 4200000;
  if (f.trusted === 'lucita') {
    await say('JASE', 'Put it down, Rudy.', 'jase');
    await say('RUDY', "...Yeah, okay. That's fair.", 'rudy');
    vt.rudyGun = false;
    state.hearts = Math.min(4, state.hearts + 1);
    sfx.play('heartUp');
    hud('12:02 PM');
    ui.toast('Relationship ↑', 'You picked her. Out loud.', '#ff5d8f');
    await game.wait(1800);
  } else {
    await say('JASE', "...Rudy's got a point.", 'jase');
    await say('RUDY', 'Thanks, man. Half seems fair.', 'rudy');
    take = 2100000;
    vt.gone = true;
    sfx.play('carDoor');
    state.hearts = Math.max(0, state.hearts - 1);
    sfx.play('heartDown');
    hud('12:02 PM');
    ui.toast('Relationship ↓', 'Lucita is not talking to you.', '#ff5d8f');
    await game.wait(2200);
  }
  f.take = take;

  // ---------------- Getaway ----------------
  sfx.play('siren');
  stars = Math.min(5, stars + 2);
  if (f.trusted === 'lucita') await say('LUCITA', 'Drive like you mean it.', 'lucita');
  if (f.trusted === 'lucita') await say('JASE', 'I always mean it.', 'jase');
  ui.dim(true, 1);
  await game.wait(500);
  state.money += take;
  const music = await playLoop('chase', { vol: 0.9 });
  f.jobBusts = 0;
  for (;;) {
    const r = await chase(game, stars, 0.72 + f.jobBusts * 0.12, f.jobBusts, { day: true, time: '12:04 PM', intro: false, difficulty: Math.min(3, stars) });
    if (r === 'escaped') break;
    f.jobBusts++;
    music.stop(0.2);
    sfx.play('busted');
    ui.hud(null);
    ui.dim(true, 0.55);
    ui.el('busted', 'passed busted', `<div class="big">BUSTED</div><div class="mn">The Job</div>
      <div class="fx">Tina (from the van): "I can loop cameras, not this."</div><div class="cont">Tap to retry the getaway</div>`);
    await game.wait(1200);
    await input.tap();
    ui.hide('busted');
    ui.dim(false);
    Object.assign(music, await playLoop('chase', { vol: 0.9 }));
  }
  music.stop(1.5);
  ui.hud(null);
  await game.wait(600);

  ui.dim(true, 0.6);
  sfx.play('passed');
  await ui.passed('MISSION PASSED', 'The Job', `$${take.toLocaleString('en-US')}`,
    f.trusted === 'lucita' ? 'Rudy is fine. Rudy has snacks.' : 'Rudy is at Eternal Shores.', () => input.tap());
  ui.dim(false);
  state.mission = 8;
  game.save();
}
