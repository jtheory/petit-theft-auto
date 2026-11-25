// One AudioContext for the whole game, with three buses so each can be faded on its own:
//   music (radio), voice (babble), sfx.
// The context can only start after a tap, so call start() from an input handler.

import { Synth } from './synth.js';

let core = null;

export function audioCore() {
  if (core) return core;
  core = {
    ctx: null, synth: null, buses: {},
    async start() {
      if (!this.ctx) {
        try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch { /* older browsers */ }
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const comp = ctx.createDynamicsCompressor();
        const master = ctx.createGain();
        master.gain.value = 0.8;
        master.connect(comp).connect(ctx.destination);
        for (const [name, vol] of [['music', 0.8], ['voice', 1], ['sfx', 0.9]]) {
          const g = ctx.createGain();
          g.gain.value = vol;
          g.connect(master);
          this.buses[name] = g;
        }
        this.ctx = ctx;
        this.master = master;
        this.synth = new Synth(ctx, master);
      }
      if (this.ctx.state !== 'running') await this.ctx.resume();
      return this;
    },
    // Fade a bus to a volume over `secs`.
    fade(bus, vol, secs = 0.4) {
      if (!this.ctx) return;
      const g = this.buses[bus].gain, t = this.ctx.currentTime;
      g.cancelScheduledValues(t);
      g.setValueAtTime(g.value, t);
      g.linearRampToValueAtTime(vol, t + secs);
    },
  };
  return core;
}
