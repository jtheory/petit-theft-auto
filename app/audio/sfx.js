// Procedural sound effects, NES-flavoured to match the radio. No audio files.
// Usage: sfx.play('hammer').  Every sound is a small function of (ctx, out, t, synth).
// The one deliberate exception to the low-fi rule is the seagull, which is supposed to be
// "the only realistic sound in the game" (a recording can replace it later).

import { audioCore } from './core.js';
import { noteFreq } from './synth.js';

const n = noteFreq;

function env(ctx, out, t, peak, attack, decay, hold = 0) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  if (hold) g.gain.setValueAtTime(peak, t + attack + hold);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + hold + decay);
  g.connect(out);
  return g;
}

function noise(ctx, synth, out, t, dur, type, freq, q = 0.8) {
  const s = ctx.createBufferSource(), f = ctx.createBiquadFilter();
  s.buffer = synth.noise;
  f.type = type;
  f.frequency.setValueAtTime(freq, t);
  f.Q.value = q;
  s.connect(f).connect(out);
  s.start(t, Math.random() * 0.5);
  s.stop(t + dur + 0.05);
  return f;
}

function osc(ctx, synth, out, wave, freq, t, dur) {
  const o = synth.osc(wave);
  o.frequency.setValueAtTime(freq, t);
  o.connect(out);
  o.start(t);
  o.stop(t + dur + 0.05);
  return o;
}

// notes: [[note, beats]] at `step` seconds per beat
function melody(ctx, synth, out, wave, t, step, notes, vol) {
  let c = t;
  for (const [note, beats] of notes) {
    if (note !== '.') synth.tone(out, wave, n(note), c, step * beats * 0.92, vol);
    c += step * beats;
  }
  return c - t;
}

export const SOUNDS = {
  // --- UI ---
  click: (ctx, out, t, s) => s.tone(out, 'pulse50', 1320, t, 0.025, 0.08),
  toast: (ctx, out, t, s) => melody(ctx, s, out, 'pulse25', t, 0.06, [['E6', 1], ['B6', 2]], 0.07),
  card: (ctx, out, t, s) => { const f = noise(ctx, s, env(ctx, out, t, 0.25, 0.05, 0.35), t, 0.45, 'bandpass', 400, 1.2); f.frequency.exponentialRampToValueAtTime(3000, t + 0.4); },
  prompt: (ctx, out, t, s) => melody(ctx, s, out, 'pulse12', t, 0.05, [['C6', 1], ['G6', 1]], 0.05),
  heartUp: (ctx, out, t, s) => melody(ctx, s, out, 'pulse25', t, 0.07, [['C5', 1], ['E5', 1], ['G5', 1], ['C6', 3]], 0.08),
  heartDown: (ctx, out, t, s) => { const g = env(ctx, out, t, 0.08, 0.01, 0.5, 0.1); const o = osc(ctx, s, g, 'pulse25', n('G4'), t, 0.6); o.frequency.exponentialRampToValueAtTime(n('C4'), t + 0.55); },
  passed: (ctx, out, t, s) => {
    melody(ctx, s, out, 'pulse25', t, 0.11, [['C5', 1], ['E5', 1], ['G5', 1], ['C6', 6]], 0.09);
    melody(ctx, s, out, 'pulse12', t, 0.11, [['E4', 1], ['G4', 1], ['C5', 1], ['E5', 6]], 0.05);
    melody(ctx, s, out, 'triangle', t, 0.11, [['C3', 3], ['C3', 6]], 0.3);
    s.drum(out, 'c', t + 0.33, 1.2);
  },
  // --- world ---
  seagull: (ctx, out, t, s) => {
    for (const [dt, len] of [[0, 0.34], [0.42, 0.22], [0.7, 0.5]]) {
      const g = env(ctx, out, t + dt, 0.12, 0.02, len, 0.05);
      const o = ctx.createOscillator(), lfo = ctx.createOscillator(), depth = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(1900, t + dt);
      o.frequency.exponentialRampToValueAtTime(1150, t + dt + len);
      lfo.frequency.value = 34; depth.gain.value = 90;
      lfo.connect(depth).connect(o.frequency);
      const h = ctx.createBiquadFilter(); h.type = 'bandpass'; h.frequency.value = 1500; h.Q.value = 0.6;
      o.connect(h).connect(g);
      for (const x of [o, lfo]) { x.start(t + dt); x.stop(t + dt + len + 0.1); }
    }
  },
  ring: (ctx, out, t, s) => {
    for (let r = 0; r < 2; r++) for (let i = 0; i < 12; i++) s.tone(out, 'pulse50', i % 2 ? 1700 : 1400, t + r * 0.9 + i * 0.045, 0.04, 0.05);
  },
  textPing: (ctx, out, t, s) => melody(ctx, s, out, 'triangle', t, 0.07, [['C6', 1], ['G6', 2]], 0.18),
  hammer: (ctx, out, t, s) => {
    noise(ctx, s, env(ctx, out, t, 0.5, 0.002, 0.08), t, 0.1, 'lowpass', 900);
    const o = osc(ctx, s, env(ctx, out, t, 0.6, 0.002, 0.12), 'triangle', 150, t, 0.14);
    o.frequency.exponentialRampToValueAtTime(60, t + 0.12);
  },
  grout: (ctx, out, t, s) => { const f = noise(ctx, s, env(ctx, out, t, 0.18, 0.005, 0.06), t, 0.08, 'bandpass', 2500, 6); f.frequency.exponentialRampToValueAtTime(5200, t + 0.06); },
  paint: (ctx, out, t, s) => { const f = noise(ctx, s, env(ctx, out, t, 0.3, 0.08, 0.35, 0.1), t, 0.6, 'bandpass', 700, 1.5); f.frequency.exponentialRampToValueAtTime(1600, t + 0.5); },
  drumroll: (ctx, out, t, s) => {
    let c = t;
    for (let i = 0; i < 18; i++) { s.drum(out, 's', c, 0.4 + i * 0.03); c += Math.max(0.035, 0.09 - i * 0.004); }
    s.drum(out, 'k', c + 0.05, 1); s.drum(out, 'c', c + 0.05, 1.3);
  },
  siren: (ctx, out, t, s) => {
    const g = env(ctx, out, t, 0.07, 0.05, 0.3, 1.8);
    const o = osc(ctx, s, g, 'pulse25', 650, t, 2.2);
    for (let i = 0; i < 4; i++) {
      o.frequency.linearRampToValueAtTime(1150, t + i * 0.55 + 0.27);
      o.frequency.linearRampToValueAtTime(650, t + i * 0.55 + 0.55);
    }
  },
  drill: (ctx, out, t, s) => {
    const g = env(ctx, out, t, 0.08, 0.05, 0.15, 1.2);
    const o = osc(ctx, s, g, 'pulse12', 95, t, 1.4);
    const lfo = ctx.createOscillator(), d = ctx.createGain();
    lfo.frequency.value = 22; d.gain.value = 14;
    lfo.connect(d).connect(o.frequency); lfo.start(t); lfo.stop(t + 1.45);
    noise(ctx, s, env(ctx, out, t, 0.05, 0.05, 0.15, 1.2), t, 1.4, 'highpass', 5000);
  },
  register: (ctx, out, t, s) => {
    noise(ctx, s, env(ctx, out, t, 0.2, 0.002, 0.05), t, 0.06, 'highpass', 3000);
    s.tone(out, 'pulse25', 2100, t + 0.08, 0.35, 0.05);
    s.tone(out, 'pulse12', 3150, t + 0.08, 0.45, 0.03);
  },
  gateBuzz: (ctx, out, t, s) => {
    s.tone(out, 'pulse50', 110, t, 0.7, 0.07);
    const g = env(ctx, out, t + 0.75, 0.4, 0.002, 0.25);
    noise(ctx, s, g, t + 0.75, 0.3, 'lowpass', 500);
    osc(ctx, s, env(ctx, out, t + 0.75, 0.4, 0.002, 0.2), 'triangle', 80, t + 0.75, 0.22);
  },
  static: (ctx, out, t, s) => s.staticBurst(out, t, 0.3),
  engine: (ctx, out, t, s) => {
    const g = env(ctx, out, t, 0.12, 0.05, 0.6, 1.1);
    const o = osc(ctx, s, g, 'pulse12', 38, t, 1.8);
    o.frequency.setValueAtTime(38, t); o.frequency.linearRampToValueAtTime(70, t + 0.35);
    o.frequency.linearRampToValueAtTime(52, t + 0.8); o.frequency.linearRampToValueAtTime(58, t + 1.7);
    noise(ctx, s, env(ctx, out, t, 0.15, 0.01, 0.2), t, 0.25, 'lowpass', 600);
  },
  carDoor: (ctx, out, t, s) => {
    noise(ctx, s, env(ctx, out, t, 0.5, 0.002, 0.12), t, 0.15, 'lowpass', 700);
    osc(ctx, s, env(ctx, out, t, 0.5, 0.002, 0.1), 'triangle', 90, t, 0.12);
    s.tone(out, 'pulse50', 2400, t + 0.02, 0.03, 0.03);
  },
  drip: (ctx, out, t, s) => { const g = env(ctx, out, t, 0.18, 0.002, 0.12); const o = osc(ctx, s, g, 'sine', 1400, t, 0.14); o.frequency.exponentialRampToValueAtTime(700, t + 0.1); },
  rain: (ctx, out, t, s) => noise(ctx, s, env(ctx, out, t, 0.06, 0.8, 1.5, 4), t, 6.4, 'bandpass', 2600, 0.4),
  drone: (ctx, out, t, s) => {
    const g = env(ctx, out, t, 0.12, 1.2, 2.5, 2);
    for (const f of [55, 82.4]) osc(ctx, s, g, 'triangle', f, t, 5.8);
    melody(ctx, s, out, 'pulse50', t + 1.2, 0.6, [['A4', 1], ['G4', 1], ['E4', 3]], 0.035);
  },
};

export const sfx = {
  async play(name) {
    const core = await audioCore().start();
    const fn = SOUNDS[name];
    if (!fn) return console.warn('unknown sound', name);
    fn(core.ctx, core.buses.sfx, core.ctx.currentTime + 0.01, core.synth);
  },
  names: Object.keys(SOUNDS),
};
