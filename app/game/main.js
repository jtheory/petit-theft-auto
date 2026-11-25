import { Game } from './engine.js';
import { audioCore } from '../audio/core.js';
import { sfx } from '../audio/sfx.js';
import { Radio } from '../audio/radio.js';
import { playLoop } from '../audio/music.js';
import stations from '../audio/stations.js';
import beat1 from '../missions/beat1.js';

const game = new Game(document.getElementById('stage'));
const radio = new Radio(stations);
window.game = game; // for poking at from the console

const TIPS = [
  'TIP: Partners appreciate thoughtful gestures. Remember birthdays.',
  'TIP: Grout is load-bearing emotionally.',
  'TIP: The radio plays one song per station. This is intentional.',
  'TIP: Answer your mother.',
];

const MISSIONS = [beat1];

function isPhone() {
  return matchMedia('(pointer: coarse)').matches || new URLSearchParams(location.search).has('desktop');
}

async function gate() {
  if (isPhone()) return;
  const ui = game.ui;
  game.setScene(a => a.R(0, 0, 180, 320, '#0e0f16'));
  ui.el('gate', 'gate', `<div class="gt">Petit Theft Auto is a mobile game.</div><div class="gs">Please steal a phone.</div>
    <div class="gb">Tap anywhere to play on this computer anyway</div>`);
  await game.input.tap();
  ui.hide('gate');
  await game.wait(400);
}

// Phones only allow sound after a tap, so the first screen asks for one. It's also very serious.
async function warning() {
  const ui = game.ui;
  game.setScene(a => a.R(0, 0, 180, 320, '#000'));
  ui.el('warning', 'warning', `<div class="wh">WARNING</div>
    <div class="wt">This game contains scenes of crime, romance, and home improvement. Player discretion is advised.</div>
    <div class="wp">Headphones recommended.</div><div class="cont">Tap to continue</div>`);
  await game.input.tap();
  await audioCore().start();
  const pad = await playLoop('pad', { vol: 0.9, fadeIn: 2 });
  ui.hide('warning');
  await game.wait(500);
  return pad;
}

async function shaders() {
  const ui = game.ui;
  game.setScene(a => a.R(0, 0, 180, 320, '#000'));
  const tip = TIPS[Math.floor(Math.random() * TIPS.length)];
  const total = 2048, ms = 2600, t0 = performance.now();
  while (true) {
    const p = Math.min(1, (performance.now() - t0) / ms);
    ui.el('shaders', 'shaders', `<div class="sl">Compiling shaders</div><div class="sn">${Math.round(p * total).toLocaleString('en-US')} / ${total.toLocaleString('en-US')}</div>
      <div class="bar"><div style="width:${(p * 100).toFixed(1)}%"></div></div><div class="tip">${tip}</div>`);
    if (p >= 1) break;
    await game.wait(50);
  }
  await game.wait(500);
  ui.hide('shaders');
  await game.wait(400);
}

async function title(pad) {
  const ui = game.ui;
  pad?.stop(0.3);
  const theme = await playLoop('theme', { vol: 1 });
  let x = -100;
  game.setScene((a, t, dt) => {
    a.causeway();
    x += dt * 18;
    if (x > 190) x = -100;
    a.convertible(Math.round(x), 258, true);
  });
  ui.el('title', 'title', `<div class="logo">Petit<br>Theft<br>Auto</div><div class="press">Tap to start</div>`);
  await game.input.tap();
  sfx.play('click');
  theme.stop(2);
  ui.hide('title');
  await game.wait(1200);
}

async function comingSoon() {
  const ui = game.ui;
  game.setScene(a => { a.sky(182); a.ground(); a.house('fixed'); a.palm(10, 214); a.palm(166, 206); a.sprite(a.JASE_SIT, 82, 194); });
  ui.dim(true, 0.55);
  ui.el('soon', 'soon', `<div class="k">Mission 2</div><div class="t">Coming Home</div><div class="d">In development. Lucita gets out soon.</div>
    <div class="b">Tap to replay Mission 1</div>`);
  await game.input.tap();
  ui.hide('soon');
  ui.dim(false);
  await game.wait(400);
  game.reset();
}

async function run() {
  await gate();
  const pad = await warning();
  await shaders();
  await title(pad);
  while (true) {
    const m = MISSIONS[game.state.mission - 1];
    if (m) await m(game, radio);
    else await comingSoon();
  }
}

run();

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js').catch(() => { /* offline play just won't be available */ });
}
