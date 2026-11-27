// Tiny NES-style synth: pulse waves (12/25/50% duty), triangle, and a noise-based drum kit.
// Songs are text: one token per step (an eighth note).
//   note   C4, F#3, Bb2      rest  .      hold previous note  -      bar line (ignored)  |
//   drums  k = kick, s = snare, h = hat, c = crash

const NOTE_RE = /^([A-Ga-g])(#|b)?(-?\d)$/;
const SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

export function noteFreq(tok) {
  const m = NOTE_RE.exec(tok);
  if (!m) return null;
  const midi = (Number(m[3]) + 1) * 12 + SEMI[m[1].toUpperCase()] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  return 440 * 2 ** ((midi - 69) / 12);
}

export function parseSong(song) {
  const stepDur = 60 / song.bpm / 2;
  const tracks = Object.entries(song.tracks).map(([name, t]) => {
    const toks = t.notes.replace(/\|/g, ' ').trim().split(/\s+/);
    const events = [];
    toks.forEach((tok, i) => {
      if (tok === '.' || tok === '-') return;
      let len = 1;
      while (toks[i + len] === '-') len++;
      events.push({ step: i, len, tok });
    });
    return { name, ...t, length: toks.length, events };
  });
  const steps = Math.max(...tracks.map(t => t.length));
  return { ...song, stepDur, steps, len: steps * stepDur, tracks };
}

export class Synth {
  constructor(ctx, out) {
    this.ctx = ctx;
    this.out = out;
    this.waves = {};
    this.noise = this.makeNoise();
  }

  makeNoise() {
    const c = this.ctx, b = c.createBuffer(1, c.sampleRate, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }

  // Band-limited pulse wave for a given duty cycle, from its cosine series.
  pulse(duty) {
    if (!this.waves[duty]) {
      const n = 48, re = new Float32Array(n), im = new Float32Array(n);
      for (let k = 1; k < n; k++) re[k] = (2 * Math.sin(Math.PI * k * duty)) / (Math.PI * k);
      this.waves[duty] = this.ctx.createPeriodicWave(re, im);
    }
    return this.waves[duty];
  }

  osc(wave) {
    const o = this.ctx.createOscillator();
    if (wave.startsWith('pulse')) o.setPeriodicWave(this.pulse(Number(wave.slice(5)) / 100));
    else o.type = wave;
    return o;
  }

  tone(bus, wave, freq, t, dur, vol, glide = 0) {
    const c = this.ctx, o = this.osc(wave), g = c.createGain();
    o.frequency.setValueAtTime(freq * (1 + glide), t);
    if (glide) o.frequency.exponentialRampToValueAtTime(freq, t + Math.min(0.05, dur));
    const atk = 0.006, rel = Math.min(0.03, dur / 3);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + atk);
    g.gain.setValueAtTime(vol, t + Math.max(atk, dur - rel));
    g.gain.linearRampToValueAtTime(0, t + dur);
    o.connect(g).connect(bus);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  drum(bus, kind, t, vol = 1) {
    const c = this.ctx;
    if (kind === 'k') {
      const o = c.createOscillator(), g = c.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(170, t);
      o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
      g.gain.setValueAtTime(0.8 * vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      o.connect(g).connect(bus);
      o.start(t);
      o.stop(t + 0.18);
      return;
    }
    const spec = { s: [1400, 0.3, 0.13], h: [7000, 0.1, 0.035], c: [4000, 0.16, 0.6] }[kind];
    if (!spec) return;
    const [freq, v, d] = spec;
    const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noise;
    f.type = 'highpass';
    f.frequency.value = freq;
    g.gain.setValueAtTime(v * vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + d);
    s.connect(f).connect(g).connect(bus);
    s.start(t, Math.random() * 0.5);
    s.stop(t + d + 0.02);
  }

  // Schedule every note of a looping song that starts inside [at, until).
  // `offset` is how far into the song (seconds) playback begins.
  playSong(bus, song, at, offset, until) {
    const loops = Math.ceil((until - at + offset) / song.len) + 1;
    for (let L = 0; L < loops; L++) {
      for (const tr of song.tracks) {
        for (const ev of tr.events) {
          const t = at - offset + L * song.len + ev.step * song.stepDur;
          if (t < at - 1e-3 || t >= until) continue;
          if (tr.wave === 'drums') { this.drum(bus, ev.tok, t, tr.vol ?? 1); continue; }
          const f = noteFreq(ev.tok) * (song.pitch ?? 1);
          if (!f) continue;
          const dur = Math.min(ev.len * song.stepDur * (tr.gate ?? 0.9), until - t);
          this.tone(bus, tr.wave, f, t, dur, tr.vol ?? 0.1);
        }
      }
    }
  }

  // The hiss between stations.
  staticBurst(bus, t, d = 0.25) {
    const c = this.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noise;
    f.type = 'bandpass';
    f.frequency.value = 1800;
    f.Q.value = 0.7;
    g.gain.setValueAtTime(0.22, t);
    g.gain.linearRampToValueAtTime(0, t + d);
    s.connect(f).connect(g).connect(bus);
    s.start(t, Math.random() * 0.5);
    s.stop(t + d + 0.02);
  }
}
