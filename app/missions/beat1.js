// Mission 1: Where the Heart Is. Lucita is still inside; Jase fixes up the house.
// See docs/storyboard.md, Beat 1.
//
// You can't fail it, but you can do it badly:
//   - Ma's call: ignore it, lie, get smart, or tell the truth (only the truth gets you $10).
//   - $12 doesn't cover all three repairs (Shingles $8, Grout $3, Paint $9). With Ma's $10 it does.
//   - Results are saved as flags for later missions; the porch is what Lucita notices in Mission 2.

import { sfx } from '../audio/sfx.js';

const REPAIRS = {
  roof:  { label: 'Shingles', cost: 8, x: 76,  y: 124, pct: 34 },
  grout: { label: 'Grout',    cost: 3, x: 124, y: 168, pct: 33 },
  porch: { label: 'Paint',    cost: 9, x: 44,  y: 190, pct: 33 },
};

export default async function whereTheHeartIs(game, radio) {
  const { ui, say, input, state } = game;
  state.money = 12;
  const f = state.flags = { ...state.flags, roofFixed: false, grouted: false, porchPainted: false, ma: null };

  // Everything the scene draws lives here; the script below just changes it.
  const s = {
    sunY: 150, roof: 0, porch: 0, lit: false, boarded: true, patched: false,
    jx: 134, jy: 214, bob: false, sitting: false, gull: -20,
    spots: [],
  };

  const scene = (a, t) => {
    a.sky(Math.round(s.sunY));
    if (s.gull > -20 && s.gull < 200) {
      const gx = Math.round(s.gull), gy = 70 + Math.round(Math.sin(t * 3) * 3), up = Math.floor(t * 6) % 2;
      a.R(gx, gy + up, 2, 1, '#2a1b2d'); a.R(gx + 2, gy + 1 - up, 1, 1, '#2a1b2d'); a.R(gx + 3, gy + up, 2, 1, '#2a1b2d');
    }
    a.ground();
    a.house({ roof: s.roof, porch: s.porch, lit: s.lit, boarded: s.boarded, patched: s.patched });
    a.palm(10, 214); a.palm(166, 206);
    if (s.sitting) a.sprite(a.JASE_SIT, 82, 194);
    else a.sprite(a.JASE, Math.round(s.jx), s.jy - (s.bob && Math.floor(t * 8) % 2 ? 1 : 0));
    const pulse = 0.55 + 0.45 * Math.sin(t * 6);
    for (const [x, y] of s.spots) { a.g.globalAlpha = pulse; a.hotspot(x, y); a.g.globalAlpha = 1; }
  };

  const walkTo = async x => {
    s.bob = true;
    await game.tween(s, 'jx', x, Math.abs(x - s.jx) * 18, 'linear');
    s.bob = false;
  };
  const hud = (time = '6:42 PM') => ui.hud({ hearts: state.hearts, money: state.money, time });

  // --- Cold open ---
  game.setScene(a => a.R(0, 0, 180, 320, '#000'));
  sfx.play('drone');
  await ui.coldOpen('Port Mangrove. 1,094 days since Lucita went inside.');

  // --- Establishing shot ---
  game.setScene(scene);
  ui.letterbox(true);
  sfx.play('seagull');
  game.tween(s, 'gull', 200, 7000, 'linear');
  await game.wait(900);
  sfx.play('card');
  await ui.card('Mission 1  ·  Port Mangrove', 'Where the\nHeart Is', 3400);
  ui.letterbox(false);
  await game.wait(500);

  // --- Ma calls. You have about 8 seconds. ---
  ui.dim(true, 0.35);
  ui.phone('Ma', 'incoming call');
  ui.prompt('TAP', 'Answer');
  let answered = false;
  for (let ring = 0; ring < 4 && !answered; ring++) {
    sfx.play('ring');
    answered = await input.tapWithin(2000);
  }
  ui.prompt(null);

  if (!answered) {
    f.ma = 'ignored';
    ui.phone('Ma', 'voicemail');
    await game.wait(500);
    await say('MA', "It's your mother. Call me back. I know you're not eating.", 'ma');
    ui.phone(null);
    ui.dim(false);
    ui.toast('Missed call', 'Ma (1)', '#ff5a4a');
    await game.wait(900);
  } else {
    sfx.play('click');
    ui.phone('Ma', '00:01');
    await game.wait(400);
    await say('MA', 'You eating, baby?', 'ma', { keep: true, hold: 250 });
    ui.choices('Reply', [['lie', 'Yes, Ma.'], ['honest', 'No, Ma.'], ['smart', 'Define eating.']]);
    f.ma = await input.pick();
    sfx.play('click');
    ui.choices(null);
    ui.hide('sub');
    const line = { lie: 'Yes, Ma.', honest: 'No, Ma.', smart: 'Define eating.' }[f.ma];
    await say('JASE', line, 'jase');
    if (f.ma === 'lie') await say('MA', 'Mm-hm.', 'ma');
    if (f.ma === 'smart') await say('MA', "Don't you get smart with me.", 'ma');
    if (f.ma === 'honest') await say('MA', "I knew it. I'm sending you ten dollars. Buy a vegetable.", 'ma');
    await say('JASE', "I'm fixing up the house, Ma. Before she gets out.", 'jase');
    await say('MA', 'That house has been falling down since your daddy.', 'ma');
    await say('JASE', "Then it's about time somebody picked it up.", 'jase');
    sfx.play('click');
    ui.phone(null);
    ui.dim(false);
    await game.wait(500);
  }

  hud();
  if (f.ma === 'honest') {
    await game.wait(400);
    sfx.play('textPing');
    state.money += 10;
    hud();
    ui.toast('Ma sent you $10', 'Note: "FOR FOOD"', '#9be37a');
    await game.wait(1400);
  }

  // --- Repairs, on a budget. Tap a job to buy supplies and do it. ---
  ui.progress('Home Restoration', 0);
  const left = new Set(Object.keys(REPAIRS));
  let pct = 0;
  const affordable = () => [...left].filter(k => REPAIRS[k].cost <= state.money);
  const showTags = () => {
    s.spots = [...left].map(k => [REPAIRS[k].x, REPAIRS[k].y]);
    ui.tags([...left].map(k => ({ x: REPAIRS[k].x, y: REPAIRS[k].y, text: `${REPAIRS[k].label} $${REPAIRS[k].cost}`, off: REPAIRS[k].cost > state.money })));
  };

  while (affordable().length) {
    showTags();
    sfx.play('prompt');
    ui.prompt('TAP', 'Choose a repair');
    let key;
    for (;;) {
      key = await input.pick([...left].map(k => ({ key: k, x: REPAIRS[k].x, y: REPAIRS[k].y, r: 20 })));
      if (REPAIRS[key].cost <= state.money) break;
      sfx.play('heartDown');
      ui.toast('Insufficient funds', `${REPAIRS[key].label}: $${REPAIRS[key].cost}. You have $${state.money}.`, '#ff5a4a', 2000);
    }
    ui.prompt(null);
    ui.tags(null);
    left.delete(key);
    s.spots = [[REPAIRS[key].x, REPAIRS[key].y]];
    state.money -= REPAIRS[key].cost;
    sfx.play('register');
    hud();
    await walkTo({ roof: 64, grout: 112, porch: 40 }[key]);

    if (key === 'roof') {
      const fill = ui.prompt('HOLD', 'Re-shingle the roof');
      let lastHit = 0;
      await input.hold(2200, p => {
        fill(p);
        s.roof = p;
        if (performance.now() - lastHit > 230) { lastHit = performance.now(); sfx.play('hammer'); }
      });
      f.roofFixed = true;
    } else if (key === 'grout') {
      const fill = ui.prompt('RAPID TAP', 'Re-grout the bathroom');
      await input.taps(10, p => { fill(p); sfx.play('grout'); });
      s.boarded = false;
      s.patched = true;
      f.grouted = true;
      sfx.play('toast');
      ui.toast('Skill increased', 'Grout: Professional Grade');
    } else {
      const fill = ui.prompt('SWIPE', 'Paint the porch');
      await input.swipe(p => fill(p));
      ui.prompt(null);
      sfx.play('paint');
      await game.tween(s, 'porch', 1, 900, 'out');
      f.porchPainted = true;
    }
    ui.prompt(null);
    s.spots = [];
    pct += REPAIRS[key].pct;
    ui.progress('Home Restoration', pct);
    await game.wait(900);
  }

  if (left.size) {
    // out of money with work left over
    const missing = [...left].map(k => REPAIRS[k].label.toLowerCase()).join(' or ');
    ui.toast('Out of money', `Couldn't afford ${missing}.`, '#ff5a4a', 2600);
    await game.wait(2600);
  } else {
    sfx.play('drumroll');
    await game.wait(1600);
  }
  ui.progress(false);
  f.restoration = pct;

  // --- Quiet moment ---
  ui.hud(null);
  ui.letterbox(true);
  game.tween(s, 'sunY', 176, 4000);
  await game.wait(600);
  s.lit = true;
  await walkTo(84);
  const fill = ui.prompt('HOLD', 'Sit on the porch steps');
  await input.hold(700, p => fill(p));
  ui.prompt(null);
  s.sitting = true;
  await game.wait(800);

  await radio.turnOn('seniors', { segment: 1, quiet: true });
  radio.volume(0);
  radio.volume(0.55, 2.5);
  ui.radio('SMOOTH SENIORS 101.1', 'DJ Merle');
  await game.wait(9000);
  ui.radio(null);
  await say('', 'She used to say the porch was the only part of this house that was hers.', 'jaseInner', { italic: true });
  if (f.porchPainted) await say('', 'Three years. I hope blue is still her color.', 'jaseInner', { italic: true });
  else await say('', "Three years. I couldn't afford the blue. I hope she still likes gray.", 'jaseInner', { italic: true });
  if (!f.roofFixed) await say('', "And I hope it doesn't rain.", 'jaseInner', { italic: true });
  await game.wait(800);

  // --- Mission passed (always). How well is another matter. ---
  ui.letterbox(false);
  ui.dim(true, 0.45);
  radio.volume(0.25, 1);
  sfx.play('passed');
  const fx = `Home Restoration ${pct}%`;
  const fx2 = f.porchPainted ? 'Hidden effect logged. Someone will notice.'
    : f.ma === 'ignored' ? 'Missed calls (Ma): 1'
    : 'The porch is still gray.';
  await ui.passed('MISSION PASSED', 'Where the Heart Is', fx, fx2, () => input.tap());
  radio.volume(0, 1.5);
  setTimeout(() => radio.turnOff(), 1600);
  ui.dim(false);
  state.mission = 2;
  game.save();
}
