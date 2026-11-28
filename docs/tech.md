# Tech

Plain ES modules and a canvas. No build step, no framework, no dependencies at runtime.
`app/` is the whole deployable site (Netlify publishes it as-is to https://petittheftauto.netlify.app; see `netlify.toml`).

## Run it

```bash
python3 -m http.server -d app 8000
```

Open http://localhost:8000 on your phone (same Wi-Fi, use the computer's IP) or in a desktop browser.
On desktop the game shows a "please steal a phone" gate; tap through it, or add `?desktop` to the URL.
Progress is saved in `localStorage`; run `game.reset()` in the console to start over.

Other pages: `/radio.html` (radio prototype), `/sfx.html` (sound board).

## Layout

| Path | What |
|---|---|
| `app/index.html`, `style.css` | Game shell and all UI styles |
| `app/manifest.webmanifest`, `sw.js`, `icons/` | PWA: installable, offline after first load |
| `app/game/engine.js` | Stage scaling, render loop, tweens, save/load |
| `app/game/art.js` | All pixel art (extracted from the storyboard renderer) |
| `app/game/ui.js` | AAA-fidelity UI layer: cards, subtitles, HUD, prompts, toasts, phone, radio card |
| `app/game/input.js` | Gestures as promises: `tap`, `hold`, `taps`, `swipe` |
| `app/game/say.js` | Dialogue: subtitles revealed in step with babble voices; character voices; `makeChatter` for lines said while the player is busy |
| `app/game/main.js` | Boot: phone gate, fake shader compile, title, mission runner |
| `app/missions/beat1.js` … `beat8.js` | One mission each, as a readable async script (the car chase in `beat3.js` is reused by The Job) |
| `tools/test/` | Autoplay tests (see below) |
| `app/audio/core.js` | One AudioContext; music / voice / sfx buses |
| `app/audio/synth.js`, `babble.js`, `radio.js`, `stations.js` | Radio (see docs/radio/README.md) |
| `app/audio/sfx.js` | Procedural sound effects |

## How a mission is written

A mission is an async function. The scene draws from a plain state object every frame; the script
changes that state and awaits gestures, lines and tweens:

```js
s.spots = [[76, 124]];                       // show a hotspot
await walkTo(64);                            // Jase walks over
const fill = ui.prompt('HOLD', 'Re-shingle the roof');
await input.hold(2200, p => { fill(p); s.roof = p; });
await say('JASE', "Then it's about time somebody picked it up.", 'jase');
```

While the player is driving, paddling or steering, lines go through a chatter queue instead, so they don't block
the game loop and don't overlap:

```js
const chat = makeChatter(say);               // from game/say.js
chat.line('LUCITA', 'Pick one, Jase.', 'lucita');
chat.after(speak => speak('LUCITA', 'This one.', 'lucita'));   // decide what to say when its turn comes
await chat.idle();                           // before the scene ends
```

Inside `chat.after`, talk with `speak`, never `chat.line`: the queue is busy running that step, so a queued line
would wait on itself (this froze Mission 2 once).

## Tests

```bash
node tools/test/run.js          # everything, ~5 minutes
node tools/test/run.js m7 chase # just these
```

Each test autoplays a mission (or the chase, or the title's Continue / New game) in headless Chromium and checks
where it ends up: the next mission, and flags like who Jase trusted in The Job. The autoplayer taps through
dialogue, takes the choices the test lists, taps hotspots, dodges cars, and keeps the boat out of the light.
It needs Playwright (`npm i -g playwright && npx playwright install chromium`). Failures get a screenshot in
`tools/test/out/`. Missions expose their live state for it as `window.__chase`, `__boat`, `__chan`, `__job`.

## Screen

The world is 180×320 pixels, scaled crisp. The UI layer uses a 360×640 design space on top.
Both scale together to fit the screen (`--k` on `#stage`); taller phones get black bars top and bottom.

## Publishing a playable copy as an artifact

`tools/artifact-play.html` is `index.html` without its document wrapper; it is published with the
files under `app/` mapped by their relative paths. Service workers don't run there, so it's online-only.

## Storyboard art vs game art

`docs/storyboard/frames.html` still has its own copy of the drawing code (it's rendered from `file://`,
where modules can't load). Game art lives in `app/game/art.js`; if the two drift, the game wins.
