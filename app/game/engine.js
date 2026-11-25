// Stage, render loop, tweens and saves. The world is a 180x320 canvas scaled up crisp;
// the UI layer sits on top in a 360x640 design space. Both scale together to fit the screen.

import { makeArt, W, H } from './art.js';
import { Input } from './input.js';
import { UI } from './ui.js';
import { makeSay } from './say.js';

const SAVE_KEY = 'pta-save-v1';
const ease = { linear: x => x, inOut: x => x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2, out: x => 1 - (1 - x) ** 3 };

export class Game {
  constructor(stage) {
    this.stage = stage;
    this.canvas = stage.querySelector('canvas');
    this.canvas.width = W;
    this.canvas.height = H;
    this.g = this.canvas.getContext('2d');
    this.art = makeArt(this.g);
    this.ui = new UI(stage.querySelector('.layer'));
    this.input = new Input(stage);
    this.say = makeSay(this.ui, this.input);
    this.scene = null;
    this.state = this.load();
    this.fit();
    addEventListener('resize', () => this.fit());
    requestAnimationFrame(t => this.frame(t));
  }

  fit() {
    const k = Math.min(innerWidth / 360, innerHeight / 640);
    this.stage.style.setProperty('--k', k);
  }

  frame(now) {
    const t = now / 1000;
    this.dt = Math.min(0.05, t - (this.t ?? t));
    this.t = t;
    if (this.scene) {
      this.g.clearRect(0, 0, W, H);
      this.scene(this.art, t - this.sceneStart, this.dt);
    }
    requestAnimationFrame(n => this.frame(n));
  }

  setScene(fn) {
    this.scene = fn;
    this.sceneStart = this.t ?? 0;
  }

  wait(ms) { return new Promise(r => setTimeout(r, ms)); }

  // Animate obj[key] to `to` over ms.
  tween(obj, key, to, ms, how = 'inOut') {
    const from = obj[key], t0 = performance.now(), f = ease[how];
    return new Promise(resolve => {
      const step = now => {
        const p = Math.min(1, (now - t0) / ms);
        obj[key] = from + (to - from) * f(p);
        if (p < 1) requestAnimationFrame(step); else resolve();
      };
      requestAnimationFrame(step);
    });
  }

  load() {
    const fresh = { mission: 1, hearts: 0, money: 12, flags: {} };
    try { return { ...fresh, ...JSON.parse(localStorage.getItem(SAVE_KEY) || '{}') }; } catch { return fresh; }
  }

  save() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.state)); } catch { /* private mode: progress lasts this session */ }
  }

  reset() {
    this.state = { mission: 1, hearts: 0, money: 12, flags: {} };
    this.save();
  }
}
