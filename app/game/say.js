// Dialogue: a subtitle that reveals in step with the speaker's babble voice.
// Tap while it's still talking to finish the line; tap again (or wait) to move on.

import { planLine, playLine, revealed } from '../audio/babble.js';
import { audioCore } from '../audio/core.js';

export const VOICES = {
  jase:     { wave: 'pulse25',  pitch: 150, range: 0.30, rate: 0.055, blip: 0.055, vol: 0.09 },
  jaseInner:{ wave: 'triangle', pitch: 140, range: 0.20, rate: 0.068, blip: 0.08,  vol: 0.16 },
  lucita:   { wave: 'pulse50',  pitch: 215, range: 0.25, rate: 0.050, blip: 0.05,  vol: 0.08 },
  ma:       { wave: 'triangle', pitch: 265, range: 0.45, rate: 0.058, blip: 0.06,  vol: 0.2 },
  benny:    { wave: 'pulse12',  pitch: 240, range: 0.50, rate: 0.048, blip: 0.045, vol: 0.08 },
};

export function makeSay(ui, input) {
  return async function say(who, text, voiceName, opts = {}) {
    const core = await audioCore().start();
    const voice = VOICES[voiceName] ?? VOICES.jase;
    const plan = planLine(text, voice);
    const bus = core.ctx.createGain();
    bus.connect(core.buses.voice);
    const start = core.ctx.currentTime + 0.05;
    playLine(core.synth, bus, plan, voice, start);
    const show = ui.subtitle(who, opts);
    let finished = false, skip = false;

    await new Promise(resolve => {
      const tick = () => {
        const el = core.ctx.currentTime - start;
        if (skip || el >= plan.dur) { finished = true; show(text, true); resolve(); return; }
        show(revealed(plan, text, el), false);
        requestAnimationFrame(tick);
      };
      tick();
      // a tap during the line finishes it (and silences the rest of the babble)
      input.tap().then(() => {
        if (finished) return;
        skip = true;
        const t = core.ctx.currentTime;
        bus.gain.setValueAtTime(1, t);
        bus.gain.linearRampToValueAtTime(0, t + 0.05);
      });
    });
    // after the line: wait for a tap, or move on by itself
    const pause = opts.hold ?? Math.max(1800, text.length * 35);
    await Promise.race([input.tap(), new Promise(r => setTimeout(r, pause))]);
    input.waiter = null;
    setTimeout(() => bus.disconnect(), 300);
    if (!opts.keep) ui.hide('sub');
  };
}
