// Babble voices: a pitched blip every two letters, pauses at punctuation.
// planLine() is deterministic (seeded by the text), so a line always sounds the same
// and its length is known before it plays.

function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// voice: { wave, pitch (Hz), range (octaves of random spread), rate (s per letter), blip (s), vol }
export function planLine(text, voice) {
  const r = rng(hash(text));
  const events = [], reveal = new Array(text.length);
  let c = 0, n = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (/[\p{L}\p{N}]/u.test(ch)) {
      if (n++ % 2 === 0) events.push({ t: c, f: voice.pitch * 2 ** ((r() - 0.5) * voice.range) });
      c += voice.rate;
    } else if (ch === ' ') c += voice.rate * 0.7;
    else if (/[,;:]/.test(ch)) c += 0.16;
    else if (/[.!?…]/.test(ch)) c += 0.3;
    else if (/[—–-]/.test(ch)) c += 0.12;
    reveal[i] = c;
  }
  if (/\?["']?\s*$/.test(text)) events.slice(-3).forEach((e, k) => { e.f *= 1.12 + k * 0.08; });
  return { events, reveal, dur: c };
}

// Schedule a planned line starting at `lineStart`; skip blips before `notBefore` (for tuning in mid-line).
export function playLine(synth, bus, plan, voice, lineStart, notBefore = 0) {
  for (const e of plan.events) {
    const t = lineStart + e.t;
    if (t < notBefore - 1e-3) continue;
    synth.tone(bus, voice.wave, e.f, t, voice.blip, voice.vol ?? 0.1, 0.06);
  }
}

// How much of the line has been "said" `elapsed` seconds in.
export function revealed(plan, text, elapsed) {
  let i = 0;
  while (i < text.length && plan.reveal[i] <= elapsed) i++;
  return text.slice(0, i);
}
