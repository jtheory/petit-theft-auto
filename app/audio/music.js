// Game score (not radio). Same text format as stations.js; looped by playLoop().
// The title theme is the one piece allowed to be longer than 4 seconds: it's the "prestige" moment.

import { parseSong } from './synth.js';
import { audioCore } from './core.js';

export const SCORE = {
  // D minor, i-VI-III-VII. Big, earnest, slightly too much.
  theme: {
    title: 'Petit Theft Auto (Main Theme)', bpm: 92,
    tracks: {
      lead:  { wave: 'pulse25',  vol: 0.085, notes:
        'D5 - - - A4 - D5 E5 | F5 - - - E5 - D5 - | C5 - - - A4 - C5 D5 | E5 - - - - - . . |' +
        'D5 - - - A4 - D5 E5 | F5 - - - G5 - A5 - | Bb5 - - - A5 - F5 - | E5 - - - - - - - ' },
      arp:   { wave: 'pulse12',  vol: 0.04, gate: 0.6, notes:
        'D4 F4 A4 F4 D4 F4 A4 F4 | Bb3 D4 F4 D4 Bb3 D4 F4 D4 | F3 A3 C4 A3 F3 A3 C4 A3 | C4 E4 G4 E4 C4 E4 G4 E4 |' +
        'D4 F4 A4 F4 D4 F4 A4 F4 | Bb3 D4 F4 D4 Bb3 D4 F4 D4 | G3 Bb3 D4 Bb3 G3 Bb3 D4 Bb3 | A3 C#4 E4 C#4 A3 C#4 E4 C#4' },
      bass:  { wave: 'triangle', vol: 0.32, notes:
        'D2 - D2 - D2 - D2 D3 | Bb1 - Bb1 - Bb1 - Bb1 Bb2 | F2 - F2 - F2 - F2 F3 | C2 - C2 - C2 - E2 - |' +
        'D2 - D2 - D2 - D2 D3 | Bb1 - Bb1 - Bb1 - Bb1 Bb2 | G1 - G1 - G1 - G1 G2 | A1 - A1 - A1 - C#2 E2' },
      drums: { wave: 'drums',    vol: 0.9, notes:
        'c . h . s . h . | k . h . s . h k | k . h . s . h . | k . h k s s s s |' +
        'c . h . s . h . | k . h . s . h k | k . h . s . h . | k k s k s s c .' },
    },
  },
  // The chase. A minor, fast, mostly bass and panic.
  chase: {
    title: 'Pursuit', bpm: 168,
    tracks: {
      lead:  { wave: 'pulse25',  vol: 0.07, gate: 0.6, notes: 'A4 . A4 C5 . A4 D5 . | E5 . E5 D5 C5 . A4 . | A4 . A4 C5 . A4 D5 . | G5 . F5 E5 D5 . E5 .' },
      stab:  { wave: 'pulse12',  vol: 0.04, gate: 0.3, notes: 'A3 . . A3 . . A3 . | F3 . . F3 . E3 . . | A3 . . A3 . . A3 . | G3 . . G3 . E3 . .' },
      bass:  { wave: 'triangle', vol: 0.34, notes: 'A2 A2 A3 A2 A2 A2 G2 G3 | F2 F2 F3 F2 E2 E2 E3 E2 | A2 A2 A3 A2 A2 A2 G2 G3 | G2 G2 G3 G2 E2 E2 E3 E2' },
      drums: { wave: 'drums',    vol: 1.0,  notes: 'k h s h k k s h | k h s h k s s s | k h s h k k s h | k h s k k s s c' },
    },
  },
  // Under the warning screen and shader bar: one held chord, very serious.
  pad: {
    title: 'Loading', bpm: 60,
    tracks: {
      a:    { wave: 'pulse12',  vol: 0.03, notes: 'D4 - - - - - - - | C4 - - - - - - -' },
      b:    { wave: 'pulse12',  vol: 0.03, notes: 'A4 - - - - - - - | G4 - - - - - - -' },
      bass: { wave: 'triangle', vol: 0.22, notes: 'D2 - - - - - - - | C2 - - - - - - -' },
    },
  },
};

const parsed = {};

// Loop a score piece on the music bus until stop(). Schedules a few seconds ahead.
export async function playLoop(id, { vol = 1, fadeIn = 0 } = {}) {
  const core = await audioCore().start();
  const { ctx, synth } = core;
  const song = parsed[id] ??= parseSong(SCORE[id]);
  const gain = ctx.createGain();
  gain.connect(core.buses.music);
  const t0 = ctx.currentTime + 0.05;
  gain.gain.setValueAtTime(fadeIn ? 0 : vol, t0);
  if (fadeIn) gain.gain.linearRampToValueAtTime(vol, t0 + fadeIn);
  let until = t0, timer = 0, stopped = false;
  const fill = () => {
    if (stopped) return;
    while (until < ctx.currentTime + 4) {
      synth.playSong(gain, song, until, 0, until + song.len);
      until += song.len;
    }
    timer = setTimeout(fill, 1000);
  };
  fill();
  return {
    stop(fade = 1) {
      stopped = true;
      clearTimeout(timer);
      const t = ctx.currentTime;
      gain.gain.cancelScheduledValues(t);
      gain.gain.setValueAtTime(gain.gain.value, t);
      gain.gain.linearRampToValueAtTime(0, t + fade);
      setTimeout(() => gain.disconnect(), fade * 1000 + 200);
    },
  };
}
