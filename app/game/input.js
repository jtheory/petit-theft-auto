// Touch/mouse gestures as promises, so mission scripts read top to bottom:
//   await input.tap();  await input.hold(1500, p => ...);  await input.taps(8, n => ...);  await input.swipe(p => ...)
// Only one gesture is awaited at a time.

export class Input {
  constructor(el) {
    this.el = el;
    this.waiter = null;
    this.downAt = null;
    el.addEventListener('pointerdown', e => {
      e.preventDefault();
      this.downAt = { x: e.clientX, y: e.clientY, t: performance.now() };
      this.waiter?.down?.(e);
    });
    const up = e => {
      if (!this.downAt) return;
      const d = this.downAt;
      this.downAt = null;
      const dx = e.clientX - d.x, dy = e.clientY - d.y, dt = performance.now() - d.t;
      this.waiter?.up?.({ dx, dy, dt, tap: Math.hypot(dx, dy) < 14 && dt < 400 });
    };
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('pointermove', e => {
      if (this.downAt) this.waiter?.move?.({ dx: e.clientX - this.downAt.x, dy: e.clientY - this.downAt.y });
    });
    el.addEventListener('contextmenu', e => e.preventDefault());
  }

  get held() { return this.downAt !== null; }

  wait(w) {
    return new Promise(resolve => {
      this.waiter = { ...w, done: v => { this.waiter = null; resolve(v); } };
    });
  }

  tap() { return this.wait({ up(g) { if (g.tap) this.done(); } }); }

  // Hold for `ms` in total. Letting go pauses progress; it doesn't reset.
  hold(ms, onProgress = () => {}) {
    let acc = 0, last = null, raf = 0;
    return this.wait({
      down() {
        last = performance.now();
        const step = now => {
          if (last === null) return;
          acc += now - last; last = now;
          const p = Math.min(1, acc / ms);
          onProgress(p);
          if (p >= 1) { last = null; this.done(); return; }
          raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
      },
      up() { last = null; cancelAnimationFrame(raf); },
    });
  }

  taps(n, onTap = () => {}) {
    let c = 0;
    return this.wait({ down() { c++; onTap(c / n, c); if (c >= n) this.done(); } });
  }

  // Any direction; resolves once the finger has travelled far enough.
  swipe(onProgress = () => {}, dist = 90) {
    return this.wait({
      move(g) { const p = Math.min(1, Math.hypot(g.dx, g.dy) / dist); onProgress(p); if (p >= 1) this.done(); },
      up() { onProgress(0); },
    });
  }
}
