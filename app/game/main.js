import { Game } from './engine.js';
import { audioCore } from '../audio/core.js';
import { sfx } from '../audio/sfx.js';
import { Radio } from '../audio/radio.js';
import { playLoop } from '../audio/music.js';
import stations from '../audio/stations.js';
import beat1 from '../missions/beat1.js';
import beat2 from '../missions/beat2.js';
import beat3 from '../missions/beat3.js';
import beat4 from '../missions/beat4.js';
import beat5 from '../missions/beat5.js';
import beat6 from '../missions/beat6.js';
import beat7 from '../missions/beat7.js';
import beat8 from '../missions/beat8.js';

const game = new Game(document.getElementById('stage'));
const radio = new Radio(stations);
window.game = game; // for poking at from the console

const TIPS = [
  'TIP: Partners appreciate thoughtful gestures. Remember birthdays.',
  'TIP: Grout is load-bearing emotionally.',
  'TIP: The radio plays one song per station. This is intentional.',
  'TIP: Answer your mother.',
];

const MISSIONS = [beat1, beat2, beat3, beat4, beat5, beat6, beat7, beat8];
// How each one is labelled in the game (the date is unnumbered, so the in-game numbers lag behind after it)
const MISSION_NAMES = [['Mission 1', 'Where the Heart Is'], ['Mission 2', 'Coming Home'], ['Mission 3', 'Late Night Special'],
  ['Date', 'Low Tide'], ['Mission 4', 'Cash for Gold'], ['Mission 5', 'In Deep Water'], ['Mission 6', 'The Job'], ['Finale', 'The Ending']];
const NEXT_UP = { 6: ['Mission 5', 'In Deep Water', 'In development. A yacht named Reel Estate.'] };

// Dev shortcuts: ?mission=2 jumps to a mission (with Mission 1's flags as given), ?skip skips the intro screens.
const params = new URLSearchParams(location.search);
if (params.has('mission')) {
  game.state.mission = Number(params.get('mission')) || 1;
  game.state.flags = { roofFixed: false, grouted: true, porchPainted: true, ma: 'ignored', ...game.state.flags };
}

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
  ui.el('title', 'title', `<div class="logo">Petit<br>Theft<br>Auto</div><div class="press">Tap to start</div><a class="host" href="https://www.netlify.com" target="_blank" rel="noopener">Powered by Netlify</a>`);
  await game.input.tap();
  sfx.play('click');
  // A save past Mission 1: pick it up, or start over
  const st = game.state;
  if (st.mission > 1 && MISSION_NAMES[st.mission - 1] && !params.has('mission')) {
    const [k, name] = MISSION_NAMES[st.mission - 1];
    ui.hide('title');
    ui.choices('Welcome back', [
      ['continue', 'Continue', `${k}: ${name}  ·  Relationship level ${st.hearts}  ·  $${st.money.toLocaleString('en-US')}`],
      ['new', 'New game', 'Start over from Mission 1. Your save is replaced.'],
    ]);
    const c = await game.input.pick();
    sfx.play('click');
    ui.choices(null);
    if (c === 'new') game.reset();
  }
  theme.stop(2);
  ui.hide('title');
  await game.wait(1200);
}

async function comingSoon() {
  const ui = game.ui;
  const [k, t, d] = NEXT_UP[game.state.mission] ?? [`Mission ${game.state.mission}`, 'Coming soon', 'In development.'];
  game.setScene(a => { a.sky(182); a.ground(); a.house('fixed'); a.palm(10, 214); a.palm(166, 206); a.sprite(a.JASE_SIT, 82, a.SIT_Y); });
  ui.dim(true, 0.55);
  ui.el('soon', 'soon', `<div class="k">${k}</div><div class="t">${t}</div><div class="d">${d}</div>
    <div class="b">Tap to start over from Mission 1</div>`);
  await game.input.tap();
  ui.hide('soon');
  ui.dim(false);
  await game.wait(400);
  game.reset();
}

async function run() {
  await gate();
  if (params.has('skip')) await audioCore().start().catch(() => {});
  else {
    const pad = await warning();
    await shaders();
    await title(pad);
  }
  while (true) {
    const m = MISSIONS[game.state.mission - 1];
    radio.setContext(game.state.flags);
    if (m) await m(game, radio);
    else await comingSoon();
  }
}

run();

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js').catch(() => { /* offline play just won't be available */ });
}
