// The radio: stations run on their own clocks like live radio. Tuning in starts mid-song or
// mid-sentence; tuning back later picks up wherever that station has got to.
// Game code only needs: power() / turnOn() / turnOff(), tune(i or id, { segment }), next(), prev(),
// and status() for the display.

import { parseSong } from './synth.js';
import { planLine, playLine, revealed } from './babble.js';
import { audioCore } from './core.js';

export class Radio {
  constructor(data, core = audioCore()) {
    this.core = core;
    this.data = data;
    this.songs = Object.fromEntries(Object.entries(data.songs).map(([id, s]) => [id, { id, ...parseSong(s) }]));
    this.flags = {};
    this.stations = data.stations.map(st => this.build(st));
    this.index = 0;
    this.on = false;
    this.current = null;
  }

  // Story flags decide which program items play (items marked before/after a flag).
  setContext(flags = {}) {
    this.flags = flags;
    const phases = Object.fromEntries(this.stations.map(st => [st.id, st.phase]));
    this.stations = this.data.stations.map(st => {
      const built = this.build(st);
      built.phase = (phases[st.id] ?? built.phase) % built.cycle;
      return built;
    });
  }

  build(st) {
    const items = st.program.filter(it => (!it.after || this.flags[it.after]) && (!it.before || !this.flags[it.before]));
    // Any ad can turn up in any ad break, so over a few plays you hear them all.
    const pool = Object.keys(this.data.ads).sort(() => Math.random() - 0.5);
    let nextAd = 0;
    items.forEach((it, i) => { if (it.ad) items[i] = { ...it, ad: pool[nextAd++ % pool.length] }; });
    const segs = items.map(item => {
      if (item.song) {
        const song = this.songs[item.song];
        return { kind: 'song', song, dur: song.len * (item.loops ?? 2) };
      }
      const ad = item.ad ? this.data.ads[item.ad] : null;
      const lines = (ad ? ad.lines : item.lines).map(([who, v, text]) => {
        const voice = this.data.voices[v];
        return { who, voice, text, plan: planLine(text, voice) };
      });
      let t = 0.3;
      for (const l of lines) { l.start = t; t += l.plan.dur + 0.45; }
      const bedId = ad ? ad.bed : item.bed === undefined ? st.bed : item.bed;
      return {
        kind: ad ? 'ad' : 'talk', ad, label: item.label, lines, dur: t + 0.3,
        bed: bedId ? this.songs[bedId] : null, bedVol: ad ? 0.55 : 0.3,
      };
    });
    const cycle = segs.reduce((a, s) => a + s.dur, 0);
    return { ...st, segs, cycle, phase: Math.random() * cycle };
  }

  async ensureAudio() {
    await this.core.start();
    if (!this.ctx) {
      this.ctx = this.core.ctx;
      this.synth = this.core.synth;
      this.master = this.ctx.createGain();
      this.master.connect(this.core.buses.music);
    }
  }

  async power() { return this.on ? this.turnOff() : this.turnOn(); }

  async turnOn(station = this.index, opts = {}) {
    await this.ensureAudio();
    this.on = true;
    this.tune(station, opts);
  }

  turnOff() {
    this.on = false;
    this.stop();
  }

  // Radio-only volume (the music bus also has its own fader in the audio core).
  volume(v, secs = 0.5) {
    if (!this.master) return;
    const g = this.master.gain, t = this.ctx.currentTime;
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(v, t + secs);
  }

  stop() {
    clearTimeout(this.timer);
    if (this.bus) {
      const b = this.bus, t = this.ctx.currentTime;
      b.gain.setValueAtTime(1, t);
      b.gain.linearRampToValueAtTime(0, t + 0.05);
      setTimeout(() => b.disconnect(), 150);
    }
    this.bus = null;
    this.current = null;
  }

  next() { this.tune(this.index + 1); }
  prev() { this.tune(this.index - 1); }

  // i: station index or id. opts.segment: start that program segment from its beginning
  // (the station's clock is moved so it stays consistent afterwards). opts.quiet: no static.
  tune(i, opts = {}) {
    if (typeof i === 'string') i = this.stations.findIndex(s => s.id === i);
    this.index = (i + this.stations.length) % this.stations.length;
    if (!this.on) return;
    this.stop();
    const now = this.ctx.currentTime;
    const sb = this.ctx.createGain();
    sb.connect(this.master);
    if (!opts.quiet) this.synth.staticBurst(sb, now, 0.22);
    setTimeout(() => sb.disconnect(), 600);
    const st = this.stations[this.index];
    if (opts.segment !== undefined) {
      const k = opts.segment, before = st.segs.slice(0, k).reduce((a, s) => a + s.dur, 0);
      st.phase = (((before - (now + 0.2)) % st.cycle) + st.cycle) % st.cycle;
      this.play(st, k, now + 0.2, 0);
      return;
    }
    let t = (now + st.phase) % st.cycle, k = 0;
    while (t >= st.segs[k].dur) { t -= st.segs[k].dur; k++; }
    this.play(st, k, now + 0.2, t);
  }

  play(st, k, at, offset) {
    const seg = st.segs[k], ctx = this.ctx;
    const bus = ctx.createGain();
    bus.connect(this.master);
    this.bus = bus;
    const end = at + seg.dur - offset;
    if (seg.kind === 'song') {
      this.synth.playSong(bus, seg.song, at, offset, end);
    } else {
      if (seg.bed) {
        const bed = ctx.createGain();
        bed.gain.value = seg.bedVol;
        bed.connect(bus);
        this.synth.playSong(bed, seg.bed, at, offset % seg.bed.len, end);
      }
      for (const l of seg.lines) {
        const start = at - offset + l.start;
        if (start + l.plan.dur < at) continue;
        playLine(this.synth, bus, l.plan, l.voice, start, at);
      }
    }
    this.current = { st, seg, at, offset };
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      if (this.current?.seg !== seg) return;
      const old = this.bus;
      this.play(st, (k + 1) % st.segs.length, end, 0);
      setTimeout(() => old.disconnect(), 500);
    }, Math.max(0, (end - ctx.currentTime - 0.25) * 1000));
  }

  // Everything the display needs, computed from the audio clock.
  status() {
    const st = this.stations[this.index];
    const base = { on: this.on, index: this.index, station: st };
    if (!this.on || !this.current) return base;
    const { seg, at, offset } = this.current;
    const elapsed = this.ctx.currentTime - at + offset;
    if (elapsed < 0) return { ...base, kind: 'tuning' };
    if (seg.kind === 'song') return { ...base, kind: 'song', song: seg.song, elapsed, dur: seg.dur };
    let line = null;
    for (const l of seg.lines) if (l.start <= elapsed) line = l;
    const out = { ...base, kind: seg.kind, ad: seg.ad, label: seg.label, bed: seg.bed, elapsed, dur: seg.dur };
    if (line) Object.assign(out, { who: line.who, said: revealed(line.plan, line.text, elapsed - line.start), full: line.text });
    return out;
  }
}
