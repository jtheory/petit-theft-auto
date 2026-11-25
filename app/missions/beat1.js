// Mission 1: Where the Heart Is. Lucita is still inside; Jase fixes up the house.
// See docs/storyboard.md, Beat 1.

import { sfx } from '../audio/sfx.js';

export default async function whereTheHeartIs(game, radio) {
  const { ui, say, input, art, state } = game;

  // Everything the scene draws lives here; the script below just changes it.
  const s = {
    sunY: 150, roof: 0, porch: 0, lit: false, boarded: true, patched: false,
    jx: 134, jy: 214, bob: false, sitting: false, gull: -20,
    spots: [],
  };

  const scene = (a, t) => {
    a.sky(Math.round(s.sunY));
    // the seagull: one bird, crossing once
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

  // --- Phone call ---
  sfx.play('ring');
  ui.dim(true, 0.35);
  ui.phone('Ma', 'incoming call');
  let fill = ui.prompt('TAP', 'Answer');
  await input.tap();
  ui.prompt(null);
  sfx.play('click');
  ui.phone('Ma', '00:01');
  await game.wait(400);
  await say('MA', 'You eating, baby?', 'ma');
  await say('JASE', "I'm fixing up the house, Ma. Before she gets out.", 'jase');
  await say('MA', "That house has been falling down since your daddy.", 'ma');
  await say('JASE', "Then it's about time somebody picked it up.", 'jase');
  sfx.play('click');
  ui.phone(null);
  ui.dim(false);
  await game.wait(500);

  // --- Repairs ---
  ui.hud({ hearts: state.hearts, money: state.money, time: '6:42 PM' });
  ui.progress('Home Restoration', 0);

  // roof: hold to hammer
  s.spots = [[76, 124]];
  await walkTo(64);
  sfx.play('prompt');
  fill = ui.prompt('HOLD', 'Re-shingle the roof');
  let lastHit = 0;
  await input.hold(2200, p => {
    fill(p);
    s.roof = p;
    if (performance.now() - lastHit > 230) { lastHit = performance.now(); sfx.play('hammer'); }
  });
  ui.prompt(null);
  s.spots = [];
  ui.progress('Home Restoration', 34);
  await game.wait(500);

  // bathroom: rapid tap to re-grout (nothing visible changes)
  s.spots = [[124, 168]];
  await walkTo(112);
  sfx.play('prompt');
  fill = ui.prompt('RAPID TAP', 'Re-grout the bathroom');
  await input.taps(10, p => { fill(p); sfx.play('grout'); });
  ui.prompt(null);
  s.spots = [];
  s.boarded = false;
  s.patched = true;
  ui.progress('Home Restoration', 67);
  sfx.play('toast');
  ui.toast('Skill increased', 'Grout: Professional Grade');
  await game.wait(900);

  // porch: swipe to paint
  s.spots = [[44, 190]];
  await walkTo(40);
  sfx.play('prompt');
  fill = ui.prompt('SWIPE', 'Paint the porch');
  await input.swipe(p => fill(p));
  ui.prompt(null);
  s.spots = [];
  sfx.play('paint');
  await game.tween(s, 'porch', 1, 900, 'out');
  state.flags.porchPainted = true;
  sfx.play('drumroll');
  ui.progress('Home Restoration', 100);
  await game.wait(1600);
  ui.progress(false);

  // --- Quiet moment ---
  ui.hud(null);
  ui.letterbox(true);
  game.tween(s, 'sunY', 176, 4000);
  await game.wait(600);
  s.lit = true;
  await walkTo(84);
  fill = ui.prompt('HOLD', 'Sit on the porch steps');
  await input.hold(700, p => fill(p));
  ui.prompt(null);
  s.sitting = true;
  await game.wait(800);

  // the radio comes on inside the house: Smooth Seniors, the Gloria dedication
  await radio.turnOn('seniors', { segment: 1, quiet: true });
  radio.volume(0);
  radio.volume(0.55, 2.5);
  ui.radio('SMOOTH SENIORS 101.1', 'DJ Merle');
  await game.wait(9000);
  ui.radio(null);
  await say('', 'She used to say the porch was the only part of this house that was hers.', 'jaseInner', { italic: true });
  await say('', 'Three years. I hope blue is still her color.', 'jaseInner', { italic: true });
  await game.wait(800);

  // --- Mission passed ---
  ui.letterbox(false);
  ui.dim(true, 0.45);
  radio.volume(0.25, 1);
  sfx.play('passed');
  await ui.passed('MISSION PASSED', 'Where the Heart Is', 'Hidden effect logged', 'Someone will notice.', () => input.tap());
  radio.volume(0, 1.5);
  setTimeout(() => radio.turnOff(), 1600);
  ui.dim(false);
  state.mission = 2;
  game.save();
}
