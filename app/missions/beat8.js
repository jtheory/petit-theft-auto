// The ending, chosen by relationship level, then very long credits with your story in them.
// See docs/storyboard.md, Beat 8.
//
//   Level 4    Ride Home: the causeway at sunset, no dialogue, then the SwampFeed post
//   Level 3    Still Here: the porch at night. "We can't stay." / "I know." Neither moves.
//   Level 0-2  Walking Away: she leaves with the same paper bag from release day.

import { sfx } from '../audio/sfx.js';
import { playLoop } from '../audio/music.js';
import { LEVEL_NAMES } from './beat2.js';

export default async function ending(game, radio) {
  const { ui, say, input, state, art } = game;
  const f = state.flags;
  const level = state.hearts;
  const houseState = () => ({ roof: f.roofFixed ? 1 : 0, porch: f.porchPainted ? 1 : 0, lit: true, boarded: !f.grouted, patched: !!f.grouted });
  const LUCITA_SIT = art.LUCITA_HEAD.concat(['.wwwwww..', 'kwwwwWwk.', 'kwwwwWwk.', 'k.wwww.k.', '..ddddDD.', '..ddddDD.', '......kk.', '......kk.', '......bb.']);
  let ending;

  if (level >= 4) {
    // ---------------- A: Ride Home ----------------
    ending = 'Ride Home';
    const r = { scroll: 0, heartY: 206 };
    game.setScene((a, t, dt) => {
      r.scroll += dt * 60;
      a.causeway(r.scroll, 150 + Math.min(40, t * 2));
      a.convertible(46, 258 + (Math.floor(t * 8) % 2), true);
      a.pixelHeart(80, Math.round(r.heartY - Math.sin(t * 2) * 2));
    });
    const theme = await playLoop('theme', { vol: 0.9, fadeIn: 3 });
    ui.letterbox(true);
    await game.wait(2500);
    sfx.play('card');
    await ui.card(`Ending  ·  Relationship: Level 4`, 'Ride Home', 6000, { top: true });
    await game.wait(3000);
    ui.letterbox(false);
    ui.dim(true, 0.45);
    sfx.play('textPing');
    const comments = [['gatorgirl88', 'honestly goals']];
    if (f.robbedStore) comments.push(['benny_littleleague', `I've known him since he was 9 and he still owes me ${f.jerky === 'original' ? 'teriyaki' : 'jerky'}`]);
    if (f.porchPainted) comments.push(['porthoa_president', 'that porch color was NOT approved']);
    if (f.date?.manatee) comments.push(['save_the_manatees', 'they were very respectful of the manatee']);
    ui.el('feed', 'feed', `<div class="fh">SwampFeed</div><div class="post">
      <div class="who"><span class="dot">7</span>Action 7 Eyewitness Swamp News <span class="ver">✓</span></div><div class="pic"></div>
      <div class="hd">LOCAL COUPLE STILL AT LARGE; NEIGHBORS DESCRIBE THEM AS "GENUINELY KIND"</div>
      <div class="meta">♥ 2.4M &nbsp; 💬 81K &nbsp; ↗ 600K</div>
      ${comments.map(([u, c]) => `<div class="cm"><b>${u}</b> ${c}</div>`).join('')}</div>`);
    await game.wait(1500);
    await input.tap();
    ui.hide('feed');
    ui.dim(false);
    theme.stop(2);
  } else if (level === 3) {
    // ---------------- B: Still Here ----------------
    ending = 'Still Here';
    game.setScene(a => {
      a.nightSky(40); a.ground(); a.house(houseState()); a.palm(10, 214); a.palm(166, 206);
      a.g.fillStyle = 'rgba(10,12,40,.35)'; a.g.fillRect(0, 0, 180, 320);
      a.sprite(a.JASE_SIT, 70, 194); a.sprite(LUCITA_SIT, 96, 196); a.duffel(86, 210);
    });
    await radio.turnOn('seniors', { segment: 0, quiet: true });
    radio.volume(0);
    radio.volume(0.4, 3);
    ui.letterbox(true);
    await game.wait(2500);
    await say('LUCITA', "We can't stay.", 'lucita');
    await say('JASE', 'I know.', 'jase');
    if (f.skippedDate) await say('LUCITA', 'You never take me anywhere.', 'lucita');
    await game.wait(5000);
    sfx.play('card');
    await ui.card('Ending  ·  Relationship: Level 3', 'Still Here', 5000, { top: true });
    await game.wait(2000);
    radio.volume(0, 3);
    setTimeout(() => radio.turnOff(), 3100);
    ui.letterbox(false);
  } else {
    // ---------------- C: Walking Away ----------------
    ending = 'Walking Away';
    const w = { lx: 120 };
    game.setScene(a => {
      a.sky(190); a.ground(); a.house(houseState()); a.palm(10, 214); a.palm(166, 206);
      a.convertible(4, 286);
      a.sprite(a.JASE, 52, 214);
      a.sprite(a.LUCITA_CASUAL, Math.round(w.lx), 236 - (Math.floor(game.t * 6) % 2)); a.sprite(a.BAG, Math.round(w.lx) + 16, 252);
    });
    const pad = await playLoop('pad', { vol: 0.8, fadeIn: 3 });
    ui.letterbox(true);
    await game.wait(2000);
    if (f.skippedDate) await say('LUCITA', 'You never take me anywhere.', 'lucita');
    await say('LUCITA', 'I needed you to show up, Jase. Not just for the jobs.', 'lucita');
    if (f.oatMilk === 'unresolved') {
      game.tween(w, 'lx', 150, 2000, 'linear');
      await game.wait(1200);
      await say('LUCITA', 'And it was the green cap.', 'lucita');
    }
    await game.tween(w, 'lx', 200, 3500, 'linear');
    sfx.play('card');
    await ui.card(`Ending  ·  Relationship: Level ${level}`, 'Walking Away', 5000, { top: true });
    pad.stop(3);
    ui.letterbox(false);
  }

  f.ending = ending;
  game.save();
  ui.dim(true, 1);
  await game.wait(1200);
  await credits(game, ending);
}

async function credits(game, ending) {
  const { ui, input, state } = game;
  const f = state.flags;
  const theme = await playLoop('theme', { vol: 0.7, fadeIn: 2 });
  const row = (k, v) => `<div class="cr"><span>${k}</span>${v}</div>`;
  const ma = { honest: 'Told the truth', lie: 'Lied ("Yes, Ma.")', smart: 'Got smart', ignored: 'Let it ring' }[f.ma] ?? '—';
  const text = { heart: '❤️ (it was not in the fridge)', thumbs: '👍', ignore: 'Ignored' }[f.text] ?? '—';
  const busts = (f.busts ?? 0) + (f.safeBusts ?? 0) + (f.boatBusts ?? 0) + (f.jobBusts ?? 0);
  ui.el('credits', 'credits', `<div class="roll" style="--dur:46s">
    <div class="cr-t">Petit Theft Auto</div><div class="cr-s">A VERY SMALL CRIME EPIC</div>
    ${row('Lead Rectangle Artist', '—')}${row('Senior Slightly Different Brown', '—')}${row('Seagull', 'Recorded on location')}
    ${row('Shader Compilation Consultant', '—')}${row('Grout Consultant', 'Professional Grade')}${row('Hand-Holding Animation Team', '(14)')}
    ${row('Manatee Wrangler', '—')}${row('Doug', 'Doug')}
    <div class="cr-h">Music</div>
    ${row('"Midnight Coastline" (4 sec.)', 'The Velvet Tides')}${row('"Mud Flap Heart"', 'Cypress Knee')}
    ${row('"Gloria\'s Song (For Gloria)"', 'The Sunset Isles Quartet')}${row('"Lowkey Highkey"', 'Brayden Vibez (link in bio)')}
    <div class="cr-h">Legal</div>
    ${row('Ad copy reviewed by', 'Chuck Brannigan, Attorney at Law')}${row('Alligators served', '0')}
    ${row('Vacation ownership', 'Cannot be exited in this life or the next')}
    <div class="cr-h">Your story</div>
    ${row('Home restoration', `${f.restoration ?? 0}%`)}${row('Ma', ma)}${row('Jerky', f.jerky ? f.jerky[0].toUpperCase() + f.jerky.slice(1) : '—')}
    ${row('The date', f.skippedDate ? 'Skipped' : f.date?.manatee ? 'Manatee (1 of 1)' : 'Mangroves, no manatee')}
    ${row('The text', text)}${row('Trusted', f.trusted === 'lucita' ? 'Lucita' : f.trusted === 'rudy' ? 'Rudy' : '—')}
    ${row('Times busted', String(busts))}${row('Final take', `$${(f.take ?? 0).toLocaleString('en-US')}`)}
    ${row('Oat milk', f.oatMilk === 'unresolved' ? 'Unresolved' : 'Resolved')}
    ${row('Relationship', `Level ${state.hearts}, "${LEVEL_NAMES[state.hearts]}"`)}${row('Ending', ending)}
    <div class="cr-n">...and 400 more names</div>
    <div class="cr-end">Thanks for playing.</div></div><div class="skip">HOLD to skip</div>`);
  await Promise.race([game.wait(46000), input.hold(1200)]);
  input.waiter = null;
  ui.hide('credits');
  theme.stop(3);
  await game.wait(800);
  ui.el('end', 'theend', '<div class="t">The End</div><div class="cont">Tap to start over</div>');
  await game.wait(1500);
  await input.tap();
  game.reset();
  location.reload();
}
