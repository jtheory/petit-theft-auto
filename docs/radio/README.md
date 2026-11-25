# Radio

**Try it:** the prototype is `src/radio.html` (also published at https://claude.ai/artifact/B4LwEVPvKPVaxYYiSsCMNb).
To run locally, serve `src/` (ES modules need http, not file://):

```bash
python3 -m http.server -d src 8000
```

Then open http://localhost:8000/radio.html.

The living audio plan (tools, ads, decisions) is a shared doc: https://claude.ai/artifact/HtwKpv6WFCeiTbmSqNwYLq

## How it works

All first-version audio is generated in code. No audio files.

| File | What it does |
|---|---|
| `src/audio/synth.js` | NES-style synth: pulse 12/25/50%, triangle, noise drums. Parses text songs. |
| `src/audio/babble.js` | Babble voices: a blip every two letters, pauses at punctuation, deterministic per line. |
| `src/audio/radio.js` | Stations on their own clocks; tune in mid-song or mid-sentence; status for the display. |
| `src/audio/stations.js` | All content: voices, songs, ads, station programs. Edit this, not the engine. |

## Song format

One token per eighth note. Notes `C4 F#3 Bb2`, rest `.`, hold `-`, bar `|` (ignored). Drums: `k` kick, `s` snare, `h` hat, `c` crash.

```js
midnight: {
  title: 'Midnight Coastline', artist: 'The Velvet Tides', bpm: 100,
  tracks: {
    lead:  { wave: 'pulse25',  vol: 0.09, notes: 'E5 - - D5 C5 - A4 - | C5 - D5 - E5 - G5 -' },
    bass:  { wave: 'triangle', vol: 0.30, notes: 'A2 - A2 - F2 - F2 - | C3 - C3 - G2 - G2 -' },
    drums: { wave: 'drums',    vol: 0.9,  notes: 'k . h . s . h . | k . h k s . h h' },
  },
},
```

Optional per track: `gate` (0–1, note length; lower is more staccato).

## Stations

Each station has exactly one song, and the DJ announces it every time.

| Preset | Station | Song | DJ |
|---|---|---|---|
| 1 | Neon 88.8 | "Midnight Coastline" · The Velvet Tides | Nova (sunset metaphors) |
| 2 | WGTR "The Gator" 97.3 | "Mud Flap Heart" · Cypress Knee | Boone (fishing reports) |
| 3 | Smooth Seniors 101.1 | "Gloria's Song (For Gloria)" · The Sunset Isles Quartet | DJ Merle (dedications) |
| 4 | WVIRAL 104.9 | "Lowkey Highkey" · Brayden Vibez | Brayden (is Brayden Vibez) |
| 5 | Talk 1490 AM | Action 7 news theme | Dana Reyes + callers |

Ads in rotation: Eternal Shores, Chuck Brannigan, Primal Glow, Call of Obligation.

## Upgrade path

1. Replace any song's `notes` by hand, or (next tool to build) convert a MIDI / BeepBox export into this format.
2. Later, a track or a line can point at a recorded file instead. Game code never changes: it only tunes stations.
