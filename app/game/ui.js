// The full-resolution UI layer over the pixel world: mission cards, subtitles, HUD, prompts,
// toasts, the phone, the radio card. Coordinates are in a 360x640 design space (the stage scales).
// Rule from the storyboard: the words are AAA, the world is not.

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const sleep = ms => new Promise(r => setTimeout(r, ms));

export class UI {
  constructor(root) {
    this.root = root;
    this.els = {};
  }

  // Create (or reuse) a named element; it fades in via the .show class.
  el(name, cls, html = '') {
    let e = this.els[name];
    if (!e) {
      e = document.createElement('div');
      e.className = 'ui ' + cls;
      this.root.append(e);
      this.els[name] = e;
    }
    e.innerHTML = html;
    requestAnimationFrame(() => requestAnimationFrame(() => e.classList.add('show')));
    return e;
  }

  hide(name) {
    const e = this.els[name];
    if (!e) return;
    delete this.els[name];
    e.classList.remove('show');
    setTimeout(() => e.remove(), 450);
  }

  clear() { Object.keys(this.els).forEach(n => this.hide(n)); }

  letterbox(on) {
    if (on) { this.el('lbTop', 'letterbox top'); this.el('lbBottom', 'letterbox bottom'); }
    else { this.hide('lbTop'); this.hide('lbBottom'); }
  }

  dim(on, alpha = 0.5) {
    if (on) this.el('dim', 'dim').style.setProperty('--a', alpha); else this.hide('dim');
  }

  async coldOpen(text, ms = 3800) {
    this.el('cold', 'cold', esc(text));
    await sleep(ms);
    this.hide('cold');
    await sleep(500);
  }

  async card(kicker, title, ms = 3200, opts = {}) {
    const e = this.el('card', 'mission' + (opts.top ? ' top' : ''),
      `<div class="kicker">${esc(kicker)}</div><div class="title">${esc(title).replace(/\n/g, '<br>')}</div><div class="rule"></div>`);
    await sleep(ms);
    this.hide('card');
    await sleep(400);
    return e;
  }

  hud(state) {
    if (!state) return this.hide('hud');
    const hearts = [0, 1, 2, 3].map(i => `<span class="heart${i < state.hearts ? ' on' : ''}"></span>`).join('');
    const stars = state.wanted ? `<div class="wanted">${[0, 1, 2, 3, 4].map(i => `<span class="${i < state.wanted ? 'on' : ''}">★</span>`).join('')}</div>` : '';
    this.el('hud', 'hud', `<div class="hearts">${hearts}</div><div class="money">$${state.money.toLocaleString('en-US')}</div><div class="time">${esc(state.time)}</div>${stars}
      <div class="minimap"><i class="road h"></i><i class="road v"></i><i class="blk a"></i><i class="blk b"></i><i class="blk c"></i><i class="you"></i><i class="goal"></i></div>`);
  }

  // A gesture prompt. Returns a setter for its fill (0..1), used by hold/swipe/taps.
  prompt(btn, label) {
    if (!btn) { this.hide('prompt'); return () => {}; }
    const e = this.el('prompt', 'prompt', `<span class="fill"></span><span class="btn">${esc(btn)}</span><span>${esc(label)}</span>`);
    return p => e.style.setProperty('--p', p);
  }

  progress(label, pct) {
    if (label === false) return this.hide('progress');
    this.el('progress', 'progress', `<div class="lbl"><span>${esc(label)}</span><span>${Math.round(pct)}%</span></div><div class="bar"><div style="width:${pct}%"></div></div>`);
  }

  // Tappable options (resolve them with input.pick()). opts: [[key, label]]
  choices(title, opts) {
    if (!title) return this.hide('choices');
    this.el('choices', 'choice', `<div class="ct">${esc(title)}</div>` +
      opts.map(([k, label]) => `<div class="co" data-choice="${esc(k)}">${esc(label)}</div>`).join(''));
  }

  // Labels pinned to world positions (world px -> 2x UI px). tags: [{ x, y, text, off }]
  tags(list) {
    if (!list) return this.hide('tags');
    this.el('tags', 'tags', list.map(t =>
      `<div class="tag${t.off ? ' off' : ''}" style="left:${t.x * 2}px;top:${t.y * 2 - 34}px">${esc(t.text)}</div>`).join(''));
  }

  async toast(title, body, color = '#9be37a', ms = 2800) {
    const e = this.el('toast', 'toast', `<div class="t">${esc(title)}</div>${esc(body)}`);
    e.style.setProperty('--c', color);
    await sleep(ms);
    if (this.els.toast === e) this.hide('toast');
  }

  radio(station, nowPlaying) {
    if (!station) return this.hide('radio');
    this.el('radio', 'radio', `<div class="st">${esc(station)}</div><div class="np">${esc(nowPlaying)}</div>`);
  }

  phone(name, status) {
    if (!name) return this.hide('phone');
    const e = this.el('phone', 'phone', `<div class="scr"><div class="av">${esc(name[0])}</div><div class="nm">${esc(name)}</div><div class="st2">${esc(status)}</div>
      <div class="row"><div></div><div class="${status === 'incoming call' ? 'ans' : 'end'}"></div><div></div></div></div>`);
    return e;
  }

  // Subtitle with a live-revealed line. Returns an updater.
  subtitle(who, opts = {}) {
    const e = this.el('sub', 'sub' + (opts.italic ? ' italic' : ''), '');
    return (said, done) => {
      e.innerHTML = (who ? `<b>${esc(who)}:</b> ` : '') + `<span>${esc(said)}</span>` + (done ? '<span class="next">▸</span>' : '');
    };
  }

  async passed(big, mission, fx, fx2, tapPromise) {
    this.el('passed', 'passed', `<div class="big">${esc(big)}</div><div class="mn">${esc(mission)}</div>
      ${fx ? `<div class="fx">${esc(fx)}</div>` : ''}${fx2 ? `<div class="fx2">${esc(fx2)}</div>` : ''}<div class="cont">Tap to continue</div>`);
    await sleep(1200);
    await tapPromise();
    this.hide('passed');
    await sleep(400);
  }
}
