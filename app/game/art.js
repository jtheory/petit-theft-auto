// Pixel art for the game world, drawn onto a 180x320 canvas.
// Extracted from the storyboard (docs/storyboard/frames.html) so the game and the storyboards look the same.
// makeArt(g) returns every drawing function bound to that canvas context.

export const W = 180, H = 320;

export function makeArt(g) {
  const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };

  // ---------- palette ----------
  const P = {
    sky: ['#2a1b4d', '#46205f', '#6e2a6a', '#9b3a6b', '#c94e69', '#e8705f', '#f59a5a', '#f9c66b'],
    grass: '#3f8a3a', grassD: '#2f6d2d', grassL: '#56a447',
    walk: '#a9a290', walkD: '#8c8574', road: '#3a3a42', roadL: '#f2d45c',
    wall: '#b08a5a', wallD: '#8a6a42', wallL: '#c9a36f',
    roof: '#6a4634', roofD: '#4f3326', roofNew: '#7c4b30', roofNewD: '#5e3722',
    porchOld: '#857463', porchOldD: '#675a4c', blue: '#4aa3df', blueD: '#2f7fb8',
    win: '#2b2f45', winLit: '#ffd97a', board: '#9c7a4a',
    trunk: '#8a6a3a', trunkD: '#6a4f2a', frond: '#2f9a4a', frondD: '#1f7036',
    sun: '#ffe08a',
  };

  // ---------- sprites (each char = one game pixel, drawn at scale) ----------
  const PAL = {
    h: '#3a2416', s: '#d9a066', e: '#1a1010', B: '#4a2e1c', t: '#9a6844', // Jase: hair, skin, eyes, beard, stubble
    g: '#9a9a96', G: '#7c7c78', x: '#34506a',                          // gray tank, shade, tattoo ink
    j: '#3a5a9a', J: '#2a4478', b: '#222',                             // jeans, shoes
    c: '#1e1412', k: '#b97a4e', o: '#ffd23f',                          // Lucita: curls, skin, gold hoops
    r: '#f07a1e', R: '#c85e10',                                        // orange jumpsuit
    w: '#f4f1ea', W: '#d6d1c6', d: '#4f74b8', D: '#3a5a94',            // white tank, jean shorts
    p: '#ff5d8f',                                                      // heart pink
  };
  // Jase: brown hair, short beard, gray tank, tattoo sleeve on his right arm (left of sprite)
  const JASE = [
    '..hhhh..',
    '.hhhhhh.',
    '.hsesse.',
    '.hssssh.',
    '.tsssst.',
    '..tttt..',
    '...ss...',
    '.gggggg.',
    'xggggGgs',
    'xggggGgs',
    'x.gggG.s',
    '..gggg..',
    '..jjjJ..',
    '..jj.J..',
    '..j..J..',
    '..b..b..',
  ];
  const JASE_SIT = [
    '..hhhh..',
    '.hhhhhh.',
    '.hsesse.',
    '.hssssh.',
    '.tsssst.',
    '..tttt..',
    '...ss...',
    '.gggggg.',
    'xggggGgs',
    'xggggGgs',
    'x.gggG.s',
    '..jjjjJJ',
    '..jjjjJJ',
    '......jJ',
    '......jJ',
    '......bb',
  ];
  // Lucita: dark curls in a high ponytail, gold hoops
  const LUCITA_HEAD = [
    '....ccc..',
    '..cccccc.',
    '.cccccccc',
    '.cckekkc.',
    '.okkkkko.',
    '..kkkk...',
    '...kk....',
  ];
  const LUCITA_JUMP = LUCITA_HEAD.concat([
    '.rrrrrr..',
    'krrrrRrk.',
    'krrrrRrk.',
    'k.rrRr.k.',
    '..rrrr...',
    '..rr.R...',
    '..rr.R...',
    '..r..R...',
    '..b..b...',
  ]);
  const LUCITA_CASUAL = LUCITA_HEAD.concat([
    '.wwwwww..',
    'kwwwwWwk.',
    'kwwwwWwk.',
    'k.ddDd.k.',
    '..dddD...',
    '..kk.k...',
    '..kk.k...',
    '..k..k...',
    '..b..b...',
  ]);
  const BAG = ['WWWW', 'WWWW', 'WwwW', 'WWWW', 'WWWW'];  // paper bag of belongings
  function sprite(rows, x, y, sc = 2, pal = PAL) {
    rows.forEach((row, ry) => [...row].forEach((ch, rx) => {
      if (pal[ch]) R(x + rx * sc, y + ry * sc, sc, sc, pal[ch]);
    }));
  }

  // ---------- scene pieces ----------
  function sky(sunY = 150) {
    const bands = P.sky, bh = 22;
    bands.forEach((c, i) => R(0, i * bh, W, bh, c));
    R(0, bands.length * bh, W, 210 - bands.length * bh, bands[bands.length - 1]);
    // stepped sun
    const cx = 150, r = 16;
    for (let dy = -r; dy <= r; dy += 2) {
      const hw = Math.floor(Math.sqrt(r * r - dy * dy) / 2) * 2;
      R(cx - hw, sunY + dy, hw * 2, 2, P.sun);
    }
    // cloud streaks
    R(10, 120, 60, 2, '#f7b37a'); R(24, 124, 40, 2, '#f7b37a');
    R(110, 98, 50, 2, '#d8667a'); R(120, 102, 30, 2, '#d8667a');
  }
  function ground() {
    R(0, 200, W, 52, P.grass);
    for (let x = 0; x < W; x += 6) R(x + ((x / 6) % 2) * 3, 204 + (x % 4), 2, 2, P.grassD);
    for (let x = 3; x < W; x += 9) R(x, 230 + (x % 5), 2, 2, P.grassL);
    R(0, 252, W, 12, P.walk); for (let x = 0; x < W; x += 20) R(x, 252, 1, 12, P.walkD);
    R(0, 264, W, 56, P.road);
    for (let x = 4; x < W; x += 24) R(x, 290, 12, 2, P.roadL);
  }
  function palm(x, y) {
    for (let i = 0; i < 46; i += 2) {
      const off = Math.round(Math.sin(i / 14) * 4);
      R(x + off, y - i, 4, 2, i % 4 ? P.trunk : P.trunkD);
    }
    const tx = x + Math.round(Math.sin(44 / 14) * 4) + 2, ty = y - 46;
    const fr = [[-1, 0], [1, 0], [-1, 1], [1, 1], [0, -1]];
    fr.forEach(([dx, dy]) => {
      for (let k = 0; k < 9; k++) {
        const px = tx + dx * k * 2, py = ty + dy * k + (k > 4 ? (k - 4) : 0) * (dy === -1 ? -1 : 1);
        R(px, py, 3, 2, k % 3 ? P.frond : P.frondD);
      }
    });
  }
  // house('old' | 'fixed') or house({ roof, porch, lit, boarded, patched }):
  //   roof 0..1 = share of shingle rows replaced (top down), porch 0..1 = share painted blue (left to right)
  function house(state) {
    const o = typeof state === 'string'
      ? (state === 'fixed' ? { roof: 1, porch: 1, lit: true, boarded: false, patched: true } : { roof: 0, porch: 0, lit: false, boarded: true, patched: false })
      : { roof: 0, porch: 0, lit: false, boarded: true, patched: false, ...state };
    const x0 = 34, x1 = 146, wy = 142, gy = 200;
    // roof (stepped triangle), replaced rows in the slightly different brown
    const newRows = Math.round(o.roof * 18);
    for (let i = 0; i < 18; i++) {
      const y = 106 + i * 2, inset = 56 - i * 3.3;
      const c = i < newRows ? (i % 3 ? P.roofNew : P.roofNewD) : (i % 3 ? P.roof : P.roofD);
      R(Math.round(x0 - 6 + inset), y, Math.round((x1 - x0 + 12) - inset * 2), 2, c);
    }
    if (o.roof < 1) { // holes + a tarp, until the roof is done
      if (newRows < 9) R(72, 122, 8, 4, P.sky[6]);
      R(110, 132, 6, 4, P.sky[6]);
      if (newRows < 6) { R(90, 116, 14, 8, '#3d6fb6'); R(90, 116, 14, 2, '#5d8fd6'); }
    }
    // walls with planks
    R(x0, wy, x1 - x0, gy - wy, P.wall);
    for (let y = wy + 4; y < gy; y += 6) R(x0, y, x1 - x0, 1, P.wallD);
    if (!o.patched) { R(x0 + 6, wy + 10, 10, 14, '#9a7a4e'); R(x1 - 20, wy + 30, 12, 10, '#9a7a4e'); }
    // door
    R(82, 164, 16, 32, o.lit ? '#7a3b2a' : '#5a4232'); R(94, 180, 2, 2, '#f3c98b');
    // windows
    const lit = o.lit ? P.winLit : P.win;
    R(46, 156, 22, 18, '#e8dcc2'); R(48, 158, 18, 14, lit); R(56, 158, 2, 14, '#e8dcc2');
    R(112, 156, 22, 18, '#e8dcc2'); R(114, 158, 18, 14, lit); R(122, 158, 2, 14, '#e8dcc2');
    if (o.boarded) { R(110, 160, 26, 3, P.board); R(110, 166, 26, 3, P.board); R(110, 160, 2, 12, P.board); }
    // porch: old paint, then the blue clipped to how far it has been painted
    const porch = (pc, pd, broken) => {
      R(26, 196, 128, 6, pc); R(26, 201, 128, 1, pd);
      R(26, 202, 128, 4, pd);
      R(80, 202, 20, 3, pc); R(78, 205, 24, 3, pc);
      [28, 62, 112, 148].forEach(px => R(px, 150, 3, 46, pc));
      R(26, 148, 128, 3, pc);
      R(28, 182, 50, 2, pc); R(104, 182, 48, 2, pc);
      for (let px = 32; px < 78; px += 6) R(px, 184, 2, 12, pd);
      for (let px = 106; px < 150; px += 6) R(px, 184, 2, 12, pd);
      if (broken) { R(40, 184, 4, 12, P.wall); R(126, 184, 2, 12, P.wall); R(120, 182, 8, 2, P.wall); }
    };
    porch(P.porchOld, P.porchOldD, o.porch < 1);
    if (o.porch > 0) {
      g.save(); g.beginPath(); g.rect(0, 0, 26 + Math.round(128 * o.porch), H); g.clip();
      porch(P.blue, P.blueD, false);
      g.restore();
    }
    // mailbox
    R(160, 222, 2, 18, '#555'); R(156, 216, 10, 7, o.porch >= 1 ? P.blue : '#8a8a8a');
  }
  function hotspot(x, y, label) {
    // pulsing ring (drawn static at "peak")
    g.fillStyle = 'rgba(255,224,138,0.35)'; g.fillRect(x - 6, y - 6, 12, 12);
    R(x - 6, y - 6, 12, 2, '#ffe08a'); R(x - 6, y + 4, 12, 2, '#ffe08a');
    R(x - 6, y - 6, 2, 12, '#ffe08a'); R(x + 4, y - 6, 2, 12, '#ffe08a');
    R(x - 1, y - 1, 2, 2, '#fff');
  }


  // red convertible, top down, sun-faded, one primer-gray door. (x, y) = left end, wheel bottom.
  function convertible(x, y, riders = false) {
    const red = '#c9443f', redD = '#9a2f2c', redL = '#e8716a', chrome = '#d9dde2';
    if (riders) {
      sprite(LUCITA_CASUAL.slice(0, 9), x + 22, y - 38);   // passenger, head and shoulders
      sprite(JASE.slice(0, 9), x + 42, y - 38);            // driver
    }
    R(x + 2, y - 20, 84, 12, red);                  // body
    R(x + 2, y - 20, 84, 2, redL);                  // shoulder highlight
    R(x + 6, y - 24, 22, 4, red); R(x + 60, y - 24, 22, 4, red);   // rear deck + hood
    R(x + 36, y - 20, 20, 10, '#8a8f94');           // mismatched primer door
    R(x + 37, y - 15, 4, 1, '#666');                // door handle
    R(x + 66, y - 34, 2, 10, chrome); R(x + 68, y - 34, 2, 2, chrome);  // windshield frame
    R(x + 68, y - 32, 2, 8, 'rgba(190,225,245,.55)');
    R(x, y - 12, 4, 4, chrome); R(x + 84, y - 12, 6, 4, chrome);       // bumpers
    R(x + 86, y - 18, 3, 3, '#ffe9a8'); R(x, y - 18, 3, 3, '#ff4a3a'); // lights
    R(x + 2, y - 8, 84, 2, redD);
    [18, 70].forEach(cx => {                         // wheels
      R(x + cx - 5, y - 10, 10, 2, '#1b1b1f'); R(x + cx - 7, y - 8, 14, 8, '#1b1b1f');
      R(x + cx - 3, y - 6, 6, 4, '#a9adb3');
    });
  }
  // midday sky for the prison: flat, harsh, bright
  function daySky() {
    ['#3d8fd6', '#5aa3e0', '#78b8e8', '#98ccef', '#b9def5', '#d7ecf8'].forEach((c, i) => R(0, i * 26, W, 26, c));
    R(0, 156, W, 60, '#e6f2f9');
    const cx = 30, cy = 40, r = 12;
    for (let dy = -r; dy <= r; dy += 2) { const hw = Math.floor(Math.sqrt(r * r - dy * dy) / 2) * 2; R(cx - hw, cy + dy, hw * 2, 2, '#fff6cf'); }
  }
  function prison() {
    R(0, 140, W, 66, '#a3a39c');                                     // wall
    for (let y = 146; y < 206; y += 8) R(0, y, W, 1, '#8b8b84');
    for (let x = 0; x < W; x += 16) for (let y = 146; y < 206; y += 16) R(x + ((y / 8) % 2) * 8, y, 1, 8, '#8b8b84');
    for (let x = 0; x < W; x += 6) { R(x, 132 + (x % 12 ? 0 : 2), 4, 2, '#c8c8c8'); R(x + 2, 135, 2, 2, '#888'); }  // razor wire
    R(0, 138, W, 2, '#6e6e68');
    R(8, 88, 26, 118, '#8f8f88'); R(4, 80, 34, 10, '#6e6e68'); R(10, 90, 22, 8, '#2b2f45');   // guard tower
    R(14, 90, 4, 8, '#ffe08a');
    R(70, 158, 52, 48, '#4a4c52');                                   // gate
    for (let x = 72; x < 122; x += 6) R(x, 160, 2, 46, '#2e3035');
    R(66, 154, 60, 4, '#6e6e68');
    R(128, 150, 40, 14, '#2f5a3a'); R(130, 152, 36, 10, '#3f7a4c');  // sign
    for (let i = 0; i < 4; i++) R(133 + i * 8, 156, 6, 2, '#e8e8e0');
    R(0, 206, W, 60, '#7b7b80');                                     // parking lot
    for (let x = 10; x < W; x += 34) R(x, 226, 2, 26, '#e8e8e0');
    R(0, 266, W, 54, P.road); for (let x = 4; x < W; x += 24) R(x, 292, 12, 2, P.roadL);
    palm(150, 206);
  }
  // overseas highway: causeway over shallow teal water
  // scroll: world pixels travelled (moves the road, rail and pilings; the far key drifts slowly)
  function causeway(scroll = 0, sunY = 120) {
    const m = (v, n) => ((v % n) + n) % n;
    sky(sunY);
    R(0, 176, W, 24, '#2f8fa0');                                      // far water
    const kx = 20 - Math.round(m(scroll * 0.08, W + 80));
    R(kx, 170, 60, 8, '#3a7a4a'); palmSmall(kx + 20, 172); palmSmall(kx + 38, 172);   // distant key
    R(kx + W + 80, 170, 60, 8, '#3a7a4a'); palmSmall(kx + W + 100, 172);
    R(0, 200, W, 120, '#3fb3b8');                                     // near water
    for (let i = 0; i < 40; i++) R(m((i * 37) - scroll * 0.5, W), 204 + (i * 23) % 110, 6, 1, '#8fe3df');
    R(0, 232, W, 30, '#5a5a62'); R(0, 232, W, 2, '#c9c9c2'); R(0, 260, W, 2, '#c9c9c2');  // road deck
    for (let x = -24; x < W + 24; x += 24) R(x - m(scroll, 24) + 4, 246, 12, 2, P.roadL);
    for (let x = -20; x < W + 20; x += 20) R(x - m(scroll, 20), 262, 6, 16, '#8f8f88');      // pilings
    R(0, 226, W, 2, '#d8d8d0'); for (let x = -8; x < W + 8; x += 8) R(x - m(scroll, 8), 226, 2, 6, '#d8d8d0');  // rail
  }
  // falling rain over everything; t in seconds
  function rain(t, n = 70) {
    g.fillStyle = 'rgba(20,24,40,.35)'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < n; i++) {
      const x = (i * 53 + Math.floor(t * 40) * 3) % (W + 20) - 10, y = ((i * 97) + t * 260) % (H + 20) - 10;
      R(Math.round(x - (y % 20) * 0.2), Math.round(y), 1, 5, 'rgba(190,210,235,.55)');
    }
  }
  // a cooking pot, catching a drip
  function pot(x, y, t = 0) {
    R(x, y, 10, 6, '#9aa0a8'); R(x - 1, y, 12, 1, '#c8ccd2'); R(x - 3, y + 1, 2, 2, '#6a7078'); R(x + 11, y + 1, 2, 2, '#6a7078');
    const d = (t * 1.6) % 1;
    if (d < 0.8) R(x + 4, y - 30 + Math.round(d * 34), 1, 2, '#bfe6ff');
  }
  function palmSmall(x, y) {
    for (let i = 0; i < 14; i += 2) R(x, y - i, 2, 2, P.trunkD);
    [[-1, 0], [1, 0], [-1, 1], [1, 1]].forEach(([dx, dy]) => { for (let k = 0; k < 4; k++) R(x + dx * k * 2, y - 14 + dy * k, 2, 2, '#1f6a3a'); });
  }
  function pixelHeart(x, y) {
    ['.xx.xx.', 'xxxxxxx', 'xxxxxxx', '.xxxxx.', '..xxx..', '...x...'].forEach((r, ry) =>
      [...r].forEach((c, rx) => { if (c === 'x') R(x + rx * 2, y + ry * 2, 2, 2, PAL.p); }));
  }


  // ===================== shared pieces for beats 3-8 =====================
  Object.assign(PAL, {
    y: '#f2c14e', Y: '#d19a2a',          // Rudy's loud shirt
    n: '#2a2a30', N: '#18181c',          // Tina's black hoodie
    v: '#8a5cc0',                        // Tina's purple hair
    a: '#c8313a', A: '#9a2028',          // store uniform red
    m: '#2b2b2b',                        // ski mask
    K: '#1b1b1f',                        // duffel bag
  });
  const recolor = (rows, map) => rows.map(r => [...r].map(c => map[c] ?? c).join(''));
  const masked = rows => rows.map((r, i) => i < 7 ? [...r].map(c => 'hsBtckov'.includes(c) ? 'm' : c).join('') : r);
  const CLERK = recolor(JASE, { B: 's', t: 's', g: 'a', G: 'A', x: 's' });
  const RUDY = recolor(JASE, { h: 'c', B: 'c', t: 'c', s: 'k', g: 'y', G: 'Y', x: 'k' });
  const TINA = recolor(LUCITA_CASUAL, { c: 'v', w: 'n', W: 'N', d: 'j', D: 'J', o: 'k' });
  const LUCITA_MASK = masked(LUCITA_CASUAL), JASE_MASK = masked(JASE);
  const RUDY_MASK = masked(RUDY), TINA_MASK = masked(TINA);
  const pistol = (x, y) => { R(x, y, 5, 2, '#3a3a40'); R(x, y + 2, 2, 2, '#3a3a40'); };
  const duffel = (x, y) => { R(x, y + 2, 14, 8, PAL.K); R(x + 3, y, 8, 2, PAL.K); R(x + 2, y + 5, 10, 1, '#3a3a44'); };

  // variable-width 5px-tall pixel font for signs
  const FONT = {"A": [".#.", "#.#", "###", "#.#", "#.#"], "B": ["##.", "#.#", "##.", "#.#", "##."], "C": [".##", "#..", "#..", "#..", ".##"], "D": ["##.", "#.#", "#.#", "#.#", "##."], "E": ["###", "#..", "##.", "#..", "###"], "F": ["###", "#..", "##.", "#..", "#.."], "G": [".###", "#...", "#.##", "#..#", ".###"], "H": ["#.#", "#.#", "###", "#.#", "#.#"], "I": ["###", ".#.", ".#.", ".#.", "###"], "J": ["..#", "..#", "..#", "#.#", ".#."], "K": ["#.#", "#.#", "##.", "#.#", "#.#"], "L": ["#..", "#..", "#..", "#..", "###"], "M": ["#...#", "##.##", "#.#.#", "#...#", "#...#"], "N": ["#..#", "##.#", "#.##", "#..#", "#..#"], "O": [".##.", "#..#", "#..#", "#..#", ".##."], "P": ["##.", "#.#", "##.", "#..", "#.."], "Q": [".##.", "#..#", "#..#", "#.#.", ".#.#"], "R": ["##.", "#.#", "##.", "#.#", "#.#"], "S": [".##", "#..", ".#.", "..#", "##."], "T": ["###", ".#.", ".#.", ".#.", ".#."], "U": ["#.#", "#.#", "#.#", "#.#", "###"], "V": ["#.#", "#.#", "#.#", "#.#", ".#."], "W": ["#...#", "#...#", "#.#.#", "##.##", "#...#"], "X": ["#.#", "#.#", ".#.", "#.#", "#.#"], "Y": ["#.#", "#.#", ".#.", ".#.", ".#."], "Z": ["###", "..#", ".#.", "#..", "###"], "0": ["###", "#.#", "#.#", "#.#", "###"], "1": [".#.", "##.", ".#.", ".#.", "###"], "2": ["##.", "..#", ".#.", "#..", "###"], "3": ["##.", "..#", ".#.", "..#", "##."], "4": ["#.#", "#.#", "###", "..#", "..#"], "5": ["###", "#..", "##.", "..#", "##."], "6": [".##", "#..", "###", "#.#", "###"], "7": ["###", "..#", ".#.", ".#.", ".#."], "8": ["###", "#.#", "###", "#.#", "###"], "9": ["###", "#.#", "###", "..#", "##."], ".": [".", ".", ".", ".", "#"], "-": ["...", "...", "###", "...", "..."], "!": ["#", "#", "#", ".", "#"], "'": ["#", "#", ".", ".", "."], "$": [".##", "##.", ".#.", ".##", "##."], " ": ["..", "..", "..", "..", ".."]};
  function text(str, x, y, c, sc = 1) {
    let cx = x;
    for (const ch of str.toUpperCase()) {
      const rows = FONT[ch] || FONT[' '];
      rows.forEach((r, ry) => [...r].forEach((p, rx) => { if (p === '#') R(cx + rx * sc, y + ry * sc, sc, sc, c); }));
      cx += (rows[0].length + 1) * sc;
    }
  }
  const textW = (str, sc = 1) => [...str.toUpperCase()].reduce((w, ch) => w + ((FONT[ch] || FONT[' '])[0].length + 1) * sc, -sc);

  function nightSky(stars = 30) {
    ['#0b0d24', '#11153a', '#181d48', '#202656', '#283063', '#313a70'].forEach((c, i) => R(0, i * 34, W, 34, c));
    for (let i = 0; i < stars; i++) R((i * 53) % W, (i * 29) % 150, 1, 1, i % 3 ? '#cfd6ff' : '#fff');
    const cx = 150, cy = 84, r = 8;
    for (let dy = -r; dy <= r; dy += 2) { const hw = Math.floor(Math.sqrt(r * r - dy * dy) / 2) * 2; R(cx - hw, cy + dy, hw * 2, 2, '#f4f1d0'); }
    R(cx + 2, cy - 6, 6, 10, '#11153a');
  }
  function policeCar(x, y, flip = false) {
    R(x + 2, y - 18, 72, 10, '#f2f2f2'); R(x + 16, y - 26, 38, 8, '#f2f2f2'); R(x + 20, y - 24, 30, 5, '#8fb7d6');
    R(x + 2, y - 10, 72, 4, '#1b1b1f'); R(x + 30, y - 30, 6, 4, '#ff3b3b'); R(x + 36, y - 30, 6, 4, '#3b7bff');
    text('POLICE', x + 26, y - 16, '#1b2a5a');
    [16, 60].forEach(cx => { R(x + cx - 6, y - 8, 12, 8, '#111'); R(x + cx - 2, y - 6, 4, 4, '#999'); });
    R(flip ? x + 72 : x, y - 16, 3, 3, flip ? '#ffe9a8' : '#ff4a3a');
  }
  function sirenGlow() { g.fillStyle = 'rgba(255,40,60,.10)'; g.fillRect(0, 0, W / 2, H); g.fillStyle = 'rgba(40,90,255,.10)'; g.fillRect(W / 2, 0, W / 2, H); }
  function helicopter(x, y, beamTo = null) {
    if (beamTo) for (let i = 0; i < beamTo; i += 2) { const hw = 3 + i * 0.35; g.fillStyle = 'rgba(255,245,190,.18)'; g.fillRect(Math.round(x + 14 - hw), y + 8 + i, Math.round(hw * 2), 2); }
    R(x - 10, y - 4, 50, 1, '#9aa0aa');                      // rotor
    R(x + 13, y - 3, 2, 3, '#2a2d35');
    R(x + 4, y, 22, 8, '#2a2d35'); R(x + 18, y + 1, 6, 4, '#7fb0d6'); // body + canopy
    R(x - 14, y + 2, 18, 2, '#2a2d35'); R(x - 16, y - 1, 2, 6, '#2a2d35'); // tail
    R(x + 6, y + 9, 18, 1, '#2a2d35');                         // skids
  }
  function speedboat(x, y, riders = true) {
    // y = waterline
    if (riders) { sprite(LUCITA_CASUAL.slice(0, 8), x + 30, y - 26); sprite(JASE.slice(0, 8), x + 46, y - 26); }
    for (let i = 0; i < 8; i++) R(x + i * 2, y - 12 + i, 76 - i * 3, 1, i < 3 ? '#f4f4f0' : '#dcdcd4');
    R(x, y - 14, 70, 4, '#f4f4f0'); R(x + 6, y - 10, 60, 2, '#d8333a');
    R(x + 54, y - 20, 2, 6, '#cfd8e0'); R(x + 56, y - 20, 8, 1, '#cfd8e0');
    R(x + 70, y - 14, 10, 4, '#f4f4f0'); R(x + 78, y - 12, 4, 2, '#f4f4f0');
    for (let i = 0; i < 6; i++) R(x - 10 - i * 12, y - 2 + (i % 2), 10 - i, 2, '#e8fbff');   // wake
  }
  function policeBoat(x, y) {
    R(x, y - 12, 60, 8, '#3c4a5a'); R(x + 4, y - 4, 52, 3, '#2a3440'); R(x + 20, y - 22, 20, 10, '#e8e8e8');
    R(x + 22, y - 20, 16, 4, '#7fb0d6'); R(x + 24, y - 26, 5, 4, '#ff3b3b'); R(x + 30, y - 26, 5, 4, '#3b7bff');
    text('POLICE', x + 6, y - 10, '#fff');
    for (let i = 0; i < 4; i++) R(x - 8 - i * 12, y - 2, 9 - i, 2, '#e8fbff');
  }
  function mangroves(y0, density = 1) {
    for (let i = 0; i < 9 * density; i++) {
      const x = (i * 41) % (W + 20) - 10, h = 18 + (i * 7) % 14;
      R(x, y0 - h - 10, 34, 14, i % 2 ? '#1f5a32' : '#2a6e3c'); R(x + 4, y0 - h - 16, 24, 8, '#2f7a44');
      for (let k = 0; k < 4; k++) { R(x + 4 + k * 8, y0 - h + 2, 2, h - 2, '#5a4632'); R(x + 2 + k * 8, y0 - 2, 6, 2, '#5a4632'); }
    }
  }
  function kayak(x, y, riders = true) {
    if (riders) { sprite(LUCITA_CASUAL.slice(0, 10), x + 16, y - 26); sprite(JASE.slice(0, 10), x + 40, y - 26); }
    else { R(x + 18, y - 11, 14, 3, '#6a3a12'); R(x + 42, y - 11, 14, 3, '#6a3a12'); }   // empty seats
    for (let i = 0; i < 5; i++) R(x + i * 3, y - 8 + i, 80 - i * 6, 1, '#f08a2a');
    R(x - 4, y - 9, 88, 2, '#f08a2a'); R(x + 2, y - 10, 76, 1, '#ffb15c'); R(x - 6, y - 8, 4, 1, '#f08a2a'); R(x + 84, y - 8, 4, 1, '#f08a2a');
    if (riders) { for (let i = 0; i < 12; i++) R(x + 58 + i * 2, y - 24 + i * 2, 2, 2, '#c8c8c0'); R(x + 80, y - 2, 6, 3, '#c8c8c0'); }   // paddle
    else R(x + 10, y - 12, 60, 2, '#c8c8c0');   // paddle lying across
  }
  function manatee(x, y) {
    R(x, y - 4, 30, 6, '#8a96a0'); R(x + 4, y - 6, 22, 2, '#9aa6b0'); R(x + 28, y - 3, 6, 4, '#8a96a0');
    R(x + 31, y - 2, 1, 1, '#222'); R(x - 6, y - 2, 8, 3, '#7a8690');
  }
  function storeExterior() {
    nightSky();
    R(0, 200, W, 120, '#2b2b33'); for (let x = 6; x < W; x += 30) R(x, 236, 2, 30, '#c8c8b0');
    R(0, 266, W, 54, P.road); for (let x = 4; x < W; x += 24) R(x, 292, 12, 2, P.roadL);
    R(30, 132, 140, 70, '#d9d0bc'); R(30, 128, 140, 6, '#9a3a3a'); R(30, 196, 140, 4, '#8a8478');
    R(38, 150, 58, 40, '#fff3c2'); R(118, 150, 44, 40, '#fff3c2');
    for (let x = 42; x < 92; x += 10) { R(x, 162, 6, 4, '#c94e69'); R(x + 2, 174, 6, 4, '#4aa3df'); R(x, 184, 6, 4, '#7dc46a'); }
    R(100, 154, 14, 42, '#7d8a8f'); R(102, 156, 10, 38, '#bfe6ff');
    R(36, 104, 104, 20, '#151515'); R(36, 104, 104, 1, '#7dff8a'); R(36, 123, 104, 1, '#7dff8a');
    text('GAS N GATOR', 88 - textW('GAS N GATOR', 2) / 2, 109, '#7dff8a', 2);
    R(8, 170, 14, 30, '#c8c8c0'); R(10, 174, 10, 8, '#222'); text('419', 10, 175, '#ff5a4a');   // pump
    g.fillStyle = 'rgba(255,240,180,.08)'; g.fillRect(30, 200, 140, 40);
  }
  function storeInterior() {
    R(0, 0, W, 214, '#d9d4c0'); for (let y = 0; y < 214; y += 24) R(0, y, W, 1, '#c8c2ac');
    for (let y = 214; y < H; y += 10) for (let x = 0; x < W; x += 10) R(x, y, 10, 10, ((x + y) / 10) % 2 ? '#cfcfc8' : '#b8b8b0');
    R(0, 30, W, 6, '#f6f6ea'); R(0, 36, W, 2, '#9a9a8a');                          // fluorescent strip
    for (let s = 0; s < 3; s++) {                                                 // shelves (left)
      const y = 90 + s * 36; R(4, y, 70, 3, '#8a8478');
      for (let x = 6; x < 72; x += 8) R(x, y - 12, 6, 12, ['#c94e69', '#4aa3df', '#f2c14e', '#7dc46a', '#e8705f'][(x / 8 + s) % 5]);
    }
    R(140, 70, 30, 60, '#8a96a0'); R(144, 76, 10, 22, '#ff5a8a'); R(156, 76, 10, 22, '#5ad1ff'); text('SLUSH', 141, 104, '#fff');
    R(96, 60, 40, 40, '#5a4a3a'); for (let y = 64; y < 98; y += 6) for (let x = 98; x < 134; x += 5) R(x, y, 4, 4, '#e8e0d0');   // rack behind counter
  }
  function counter() { R(90, 200, 90, 40, '#7a5a3a'); R(90, 198, 90, 4, '#a07a52'); R(120, 186, 18, 14, '#3a3a40'); R(122, 188, 14, 6, '#7dff8a'); }
  function pawnRoom() {
    R(0, 0, W, 230, '#4a433b'); for (let y = 0; y < 230; y += 12) R(0, y, W, 1, '#3e382f');
    R(0, 230, W, 90, '#2e2a26');
    R(10, 60, 60, 3, '#6a5a48'); R(10, 120, 60, 3, '#6a5a48');
    [[14, 30], [30, 26], [46, 32]].forEach(([x, h]) => { R(x, 60 - h, 4, h, '#8a5a2a'); R(x - 3, 60 - 10, 10, 10, '#b5763a'); });  // guitars
    R(14, 100, 18, 20, '#222'); R(16, 102, 14, 14, '#3a5a6a'); R(38, 104, 24, 16, '#d8c890');       // tv, boxes
    R(100, 150, 64, 84, '#3e4a52'); R(104, 154, 56, 76, '#4e5a62');                                  // safe
    for (let dy = -8; dy <= 8; dy += 2) { const hw = Math.floor(Math.sqrt(64 - dy * dy) / 2) * 2; R(132 - hw, 192 + dy, hw * 2, 2, '#aab4bc'); }
    R(130, 184, 4, 8, '#333'); R(150, 170, 6, 30, '#8a949c');
    R(8, 132, textW('CASH 4 GOLD') + 8, 11, '#1b1b1f'); text('CASH 4 GOLD', 12, 135, '#f2c14e');
  }
  // the front-window display case in the pawn shop, with Marisol's ring (gold, little green stone)
  function windowCase(ring = true, glint = false) {
    R(6, 186, 52, 26, '#5a4a38'); R(6, 186, 52, 2, '#7a6a52');
    R(8, 176, 48, 10, 'rgba(180,220,230,.28)'); R(8, 176, 48, 1, 'rgba(220,240,245,.6)');
    R(14, 182, 6, 4, '#c8c0b0'); R(42, 181, 8, 5, '#8a8a90');                 // a watch, a lighter
    if (ring) { R(28, 182, 5, 4, '#f2c14e'); R(29, 183, 3, 2, '#5a4a38'); R(30, 181, 2, 1, '#3fdc7a'); }
    if (ring && glint) { R(33, 178, 1, 3, '#fff'); R(32, 179, 3, 1, '#fff'); }
  }
  function sparks(x, y) { [[0, 0], [3, -4], [6, -1], [-3, -5], [5, 3], [-4, 2], [8, -6]].forEach(([dx, dy], i) => R(x + dx, y + dy, i % 2 ? 1 : 2, i % 2 ? 1 : 2, i % 3 ? '#ffe08a' : '#fff')); }
  function alley() {
    nightSky(12);
    R(0, 60, W, 200, '#3a3438'); for (let y = 66; y < 260; y += 8) for (let x = (y / 8 % 2) * 8; x < W; x += 16) R(x, y, 14, 6, '#443d42');
    R(20, 150, 30, 50, '#2a2a2e'); R(22, 152, 26, 48, '#5a3a2a'); R(24, 140, 22, 6, '#ffe08a');   // back door + light
    g.fillStyle = 'rgba(255,224,138,.12)'; g.fillRect(10, 146, 50, 80);
    R(130, 170, 30, 30, '#2f5a3a'); R(128, 168, 34, 4, '#244a2f');                              // dumpster
    R(0, 200, W, 120, '#26252a'); R(0, 266, W, 54, P.road);
  }
  function marina() {
    ['#2a1b4d', '#46205f', '#6e2a6a', '#9b3a6b', '#c94e69', '#e8705f'].forEach((c, i) => R(0, i * 28, W, 28, c));
    R(0, 168, W, 30, '#e8705f');
    [[10, 40], [60, 52], [120, 46]].forEach(([x, w]) => { R(x, 180, w, 10, '#2a2238'); R(x + 8, 172, w - 20, 8, '#2a2238'); R(x + w / 2, 150, 2, 22, '#2a2238'); });
    R(0, 196, W, 124, '#1d3e66'); for (let i = 0; i < 30; i++) R((i * 37) % W, 200 + (i * 19) % 110, 8, 1, '#3a6a9a');
    R(0, 220, 120, 8, '#7a5a3a'); for (let x = 4; x < 120; x += 20) R(x, 228, 4, 20, '#5a4030');
    R(4, 120, 70, 16, '#f4f4f0'); text('YACHT CLUB', 39 - textW('YACHT CLUB') / 2, 126, '#1d3e66');
  }
  function nightWater() {
    nightSky(24);
    R(0, 170, W, 6, '#0e1230'); for (let x = 0; x < W; x += 14) R(x, 162 + (x % 5), 12, 8, '#0a0d22');   // far shore
    R(0, 176, W, 144, '#132a4a'); for (let i = 0; i < 40; i++) R((i * 43) % W, 180 + (i * 17) % 140, 6, 1, '#24466e');
  }
  function blueprintRoom() {
    R(0, 0, W, 220, '#2e3a34'); R(0, 220, W, 100, '#3a2e26');
    R(10, 40, 70, 56, '#a87a4a'); R(12, 42, 66, 52, '#c8a070');                                   // corkboard
    [[16, 46], [36, 50], [56, 46], [24, 70], [50, 72]].forEach(([x, y]) => { R(x, y, 12, 14, '#eee'); R(x + 2, y + 2, 8, 8, '#777'); R(x + 5, y - 1, 2, 2, '#d8333a'); });
    for (let i = 0; i < 20; i++) { R(22 + i * 1.6, 52 + i * 1.2, 1, 1, '#d8333a'); R(42 + i * 0.6, 56 + i * 1, 1, 1, '#d8333a'); }
    R(100, 30, 4, 40, '#555'); R(92, 70, 20, 8, '#e8c86a'); g.fillStyle = 'rgba(255,230,160,.12)'; g.fillRect(40, 78, 130, 160);
    R(30, 170, 130, 40, '#5a4030'); R(34, 160, 122, 14, '#2f5fa8');                              // table + blueprint
    for (let x = 38; x < 156; x += 8) R(x, 160, 1, 14, '#5f8fd8'); for (let y = 162; y < 174; y += 4) R(34, y, 122, 1, '#5f8fd8');
    R(70, 162, 40, 10, 'transparent'); R(72, 163, 36, 8, '#e8f0ff'); R(74, 165, 32, 4, '#2f5fa8');
  }
  function bankExterior() {
    daySky();
    R(0, 210, W, 110, '#b8b2a4'); R(0, 266, W, 54, P.road); for (let x = 4; x < W; x += 24) R(x, 292, 12, 2, P.roadL);
    R(20, 100, 140, 110, '#ece6d6'); R(14, 92, 152, 10, '#d8d0bc'); for (let i = 0; i < 12; i++) R(30 + i * 5, 80 + i, 120 - i * 10, 1, '#d8d0bc');
    for (let x = 30; x < 160; x += 22) { R(x, 104, 10, 96, '#f8f4ea'); R(x + 8, 104, 2, 96, '#d8d0bc'); }
    R(80, 150, 22, 50, '#3a3a40'); R(10, 200, 160, 4, '#d8d0bc'); R(4, 204, 172, 4, '#cfc8b8');
    R(40, 94, 100, 8, '#ece6d6'); text('FIRST BANK', 90 - textW('FIRST BANK') / 2, 95, '#6a5a3a');
  }
  function vault(open = true) {
    R(0, 0, W, 230, '#6a7078'); for (let x = 0; x < W; x += 20) R(x, 0, 1, 230, '#5a6068');
    R(0, 230, W, 90, '#4a4e54');
    R(40, 50, 100, 130, '#2a2e34');                                                              // vault interior
    for (let s = 0; s < 4; s++) { const y = 72 + s * 28; R(44, y + 14, 92, 2, '#8a8f96');
      for (let x = 46; x < 134; x += 12) R(x, y + 6, 10, 8, s % 2 ? '#f2c14e' : '#6fbf73'); }
    if (open) {                                                                                  // door swung open
      for (let dy = -46; dy <= 46; dy += 2) { const hw = Math.floor(Math.sqrt(46 * 46 - dy * dy) / 2) * 2; R(146, 116 + dy, Math.max(4, hw / 3), 2, '#9aa2aa'); }
      R(150, 110, 8, 12, '#d0d6dc');
    }
  }
  function citySt() {
    daySky();
    [[0, 90, 40], [40, 70, 36], [76, 110, 44], [120, 80, 30], [150, 100, 30]].forEach(([x, top, w], i) => {
      R(x, top, w, 210 - top, ['#d8a07a', '#c8d0d8', '#e8d0a0', '#a8c0c8', '#e0b0b0'][i]);
      for (let y = top + 8; y < 200; y += 14) for (let wx = x + 4; wx < x + w - 6; wx += 10) R(wx, y, 6, 8, '#5a7a9a');
    });
    R(0, 210, W, 56, '#9a9488'); R(0, 236, W, 84, P.road); for (let x = 4; x < W; x += 24) R(x, 276, 12, 2, P.roadL);
  }


  // ---- Mission 3: traffic, a street that scrolls, a car wash ----
  function sedan(x, y, body = '#5a7a9a') {   // closed car, side view; y = wheel bottom
    R(x + 2, y - 18, 68, 10, body); R(x + 14, y - 27, 40, 9, body);
    R(x + 18, y - 25, 14, 6, '#9fc3dc'); R(x + 34, y - 25, 16, 6, '#9fc3dc');
    R(x + 2, y - 10, 68, 3, '#222');
    [14, 56].forEach(cx => { R(x + cx - 6, y - 8, 12, 8, '#111'); R(x + cx - 2, y - 6, 4, 4, '#999'); });
    R(x + 68, y - 16, 3, 3, '#ffe9a8'); R(x, y - 16, 3, 3, '#ff4a3a');
  }
  function cone(x, y) { R(x + 3, y - 14, 4, 3, '#ff7a1a'); R(x + 2, y - 11, 6, 3, '#fff'); R(x + 1, y - 8, 8, 4, '#ff7a1a'); R(x - 2, y - 4, 14, 4, '#d0601a'); }
  function gator(x, y) {
    R(x, y - 6, 30, 5, '#3f6a3a'); R(x + 26, y - 5, 12, 3, '#3f6a3a'); R(x + 4, y - 8, 20, 2, '#4f7f48');
    for (let i = 0; i < 5; i++) R(x + 4 + i * 5, y - 9, 2, 1, '#2f5a2a');
    R(x + 30, y - 6, 2, 1, '#ffe08a'); R(x + 4, y - 1, 3, 2, '#2f5a2a'); R(x + 20, y - 1, 3, 2, '#2f5a2a'); R(x - 8, y - 4, 8, 2, '#3f6a3a');
  }
  // variant: a different street after each turn (other buildings, other colors)
  const STREETS_DAY = [['#d8c8a8', '#c8d0d8'], ['#e0b0a0', '#a8c0c8'], ['#c8d8b0', '#e8d0a0'], ['#d0b8d8', '#b8c8b0']];
  const STREETS_NIGHT = [['#1e2236', '#252a40'], ['#2a1e30', '#3a2438'], ['#1a2a2a', '#223636'], ['#2a2a1e', '#36321f']];
  function chaseStreet(scroll, day = false, variant = 0) {
    const m = (v, n) => ((v % n) + n) % n;
    if (day) daySky(); else nightSky(18);
    const bs = scroll * 0.35, first = Math.floor(bs / 40), pal = (day ? STREETS_DAY : STREETS_NIGHT)[variant % 4];
    for (let i = -1; i < 6; i++) {
      const idx = first + i, bx = i * 40 - m(bs, 40), h = 50 + ((idx * 7919 + variant * 3) % 5 + 5) % 5 * 16;
      R(bx, 200 - h, 38, h, pal[idx % 2 ? 0 : 1]);
      for (let wy = 200 - h + 6; wy < 194; wy += 12) for (let wx = 4; wx < 34; wx += 10)
        if (day ? (wx + wy) % 3 === 0 : ((idx * 31 + wx * 7 + wy * 3) % 5) === 0) R(bx + wx, wy, 5, 6, day ? '#7a9ab8' : '#ffd97a');
    }
    R(0, 200, W, 36, '#2b2b33'); R(0, 234, W, 2, '#55555e');
    for (let x = -60; x < W + 60; x += 60) {
      const lx = x - m(scroll * 0.9, 60);
      R(lx + 10, 120, 3, 80, '#555'); R(lx + 6, 118, 12, 3, '#888');
      g.fillStyle = 'rgba(255,240,180,.07)'; g.fillRect(lx - 2, 121, 28, 115);
    }
    R(0, 236, W, 84, P.road);
    for (let x = -24; x < W + 24; x += 24) R(x - m(scroll, 24) + 4, 276, 12, 2, P.roadL);
  }
  // A painted road marking, seen from above: a straight-ahead arrow (pointing right, the way you drive)
  // with a turn branch curving off it, up for a left turn, down for a right. (x, y) = tail of the shaft.
  function roadArrow(x, y, dir) {
    const c = 'rgba(236,236,226,.82)', wear = 'rgba(58,58,66,.7)', s = dir === 'up' ? -1 : 1;
    x = Math.round(x);
    const P = (px, py, w = 1, h = 1) => R(x + px, y + py, w, h, c);
    P(0, -1, 30, 3);                                                   // shaft
    for (let i = 0; i < 7; i++) P(30 + i, -6 + i, 1, 13 - i * 2);      // head, pointing ahead
    for (let k = 0; k <= 8; k++) {                                     // the branch: a quarter curve...
      const a = (k / 8) * Math.PI / 2, bx = 10 + Math.round(Math.sin(a) * 9), by = Math.round((1 - Math.cos(a)) * 9);
      R(x + bx, y + s * by - 1, 3, 3, c);
    }
    P(19, s > 0 ? 9 : -12, 3, 4);                                      // ...then straight out
    for (let i = 0; i < 6; i++) R(x + 15 + i, s > 0 ? y + 13 + i : y - 14 - i, 11 - i * 2, 1, c);   // and its head
    R(x + 6, y, 2, 1, wear); R(x + 22, y - 1, 1, 1, wear); R(x + 33, y + 2, 1, 1, wear);             // worn paint
  }
  function carWash(t, foam = 0) {
    nightSky(10);
    R(0, 200, W, 66, '#2b2b33'); R(0, 266, W, 54, P.road);
    for (let x = 4; x < W; x += 24) R(x, 292, 12, 2, P.roadL);
    R(16, 116, 148, 100, '#e8eef4'); R(16, 116, 148, 8, '#3a8fd8'); R(16, 130, 148, 3, '#3a8fd8');
    R(40, 146, 100, 70, '#1c2430');
    for (let k = 0; k < 4; k++) R(48 + k * 24, 148, 6, 64, (Math.floor(t * 10) + k) % 2 ? '#4aa3df' : '#2f7fb8');
    R(52, 96, 76, 16, '#151515'); R(52, 96, 76, 1, '#5ad1ff'); R(52, 111, 76, 1, '#5ad1ff');
    text('CAR WASH', 90 - textW('CAR WASH', 2) / 2 + 1, 99, '#5ad1ff', 2);
    for (let i = 0; i < Math.round(60 * foam); i++) {
      const fx = 40 + ((i * 53) % 100), fy = 150 + ((i * 37 + Math.floor(t * 20)) % 64);
      R(fx, fy, 3, 2, '#ffffff');
    }
  }

  // ---- Mission 4: a lagoon that scrolls past ----
  function lagoon(scroll, sunY = 110) {
    const m = (v, n) => ((v % n) + n) % n;
    sky(sunY);
    R(0, 176, W, 144, '#2f8f8a');
    for (let i = 0; i < 40; i++) R(m((i * 37) - scroll * 0.7, W), 182 + (i * 23) % 130, 6, 1, '#7fd6cc');
    const ms = scroll * 0.4, first = Math.floor(ms / 41);
    for (let i = -1; i < 7; i++) {
      const idx = first + i, x = i * 41 - m(ms, 41) - 10, h = 18 + ((idx * 7) % 14 + 14) % 14, y0 = 180;
      R(x, y0 - h - 10, 34, 14, idx % 2 ? '#1f5a32' : '#2a6e3c'); R(x + 4, y0 - h - 16, 24, 8, '#2f7a44');
      for (let k = 0; k < 4; k++) { R(x + 4 + k * 8, y0 - h + 2, 2, h - 2, '#5a4632'); R(x + 2 + k * 8, y0 - 2, 6, 2, '#5a4632'); }
    }
  }
  function dock(x, y) {
    R(x, y, 70, 6, '#8a6a42'); R(x, y, 70, 1, '#a8885a');
    for (let k = 0; k < 4; k++) R(x + 4 + k * 20, y + 6, 4, 22, '#5a4632');
  }

  // ---- Mission 6: a searchlight, and the channel ----
  function spotlight(x, topY, bottomY, half) {
    for (let y = topY; y < bottomY; y += 2) {
      const k = (y - topY) / (bottomY - topY), hw = Math.round(2 + k * half);
      g.fillStyle = 'rgba(255,245,190,.2)'; g.fillRect(Math.round(x) - hw, y, hw * 2, 2);
    }
    g.fillStyle = 'rgba(255,245,190,.38)'; g.fillRect(Math.round(x) - half - 2, bottomY, (half + 2) * 2, 5);
  }
  // ---- Mission 6, top-down: open water, the boat, the police boat, the helicopter's light ----
  function waterTop(scroll) {
    const m = (v, n) => ((v % n) + n) % n;
    R(0, 0, W, H, '#10284a');
    for (let i = 0; i < 46; i++) R((i * 41) % W, m((i * 67) + scroll, H + 10) - 10, 6 + (i % 3) * 2, 1, i % 4 ? '#1d3c66' : '#2a5080');
    for (let y = -20; y < H + 20; y += 20) {   // mangrove banks on both sides
      const yy = m(y + scroll * 0.9, H + 40) - 20, w1 = 8 + ((Math.floor((y + 200) / 20) * 7) % 5) * 2, w2 = 6 + ((Math.floor((y + 200) / 20) * 11) % 5) * 2;
      R(0, yy, w1, 20, '#163a24'); R(w1, yy + 4, 3, 12, '#1f5a32');
      R(W - w2, yy, w2, 20, '#163a24'); R(W - w2 - 3, yy + 6, 3, 10, '#1f5a32');
    }
  }
  // speedboat from above, pointing up; (x, y) = center
  function speedboatTop(x, y, t = 0) {
    const hull = [[0, 2], [2, 4], [4, 6], [6, 7], [8, 8], [10, 8], [12, 8], [14, 8], [16, 8], [18, 8], [20, 8], [22, 8], [24, 8], [26, 7], [28, 7]];
    for (let k = 0; k < 5; k++) R(x - 3 - k * 2 + (Math.floor(t * 10 + k) % 2), y + 16 + k * 4, 6 + k * 4, 2, k < 2 ? '#e8fbff' : 'rgba(232,251,255,.45)');   // wake
    hull.forEach(([dy, hw]) => R(x - hw, y - 15 + dy, hw * 2, 2, '#f4f4f0'));
    R(x - 7, y - 3, 14, 1, '#d8333a'); R(x - 6, y - 7, 12, 3, 'rgba(160,210,240,.8)');   // stripe, windshield
    R(x - 5, y - 1, 4, 4, PAL.c); R(x + 1, y - 1, 4, 4, PAL.h);                          // two heads: Lucita, Jase
    R(x - 6, y + 1, 1, 1, PAL.o);
    R(x - 4, y + 9, 8, 4, '#3a3a40');                                                    // motor
  }
  function policeBoatTop(x, y, t = 0) {
    for (let k = 0; k < 3; k++) R(x - 4 - k * 3, y + 16 + k * 4, 8 + k * 6, 2, 'rgba(232,251,255,.4)');
    R(x - 9, y - 12, 18, 28, '#3c4a5a'); R(x - 7, y - 16, 14, 4, '#3c4a5a'); R(x - 4, y - 18, 8, 2, '#3c4a5a');
    R(x - 6, y - 4, 12, 10, '#e8e8e8'); text('PD', x - 3, y - 2, '#1b2a5a');
    const on = Math.floor(t * 6) % 2;
    R(x - 6, y - 7, 5, 3, on ? '#ff3b3b' : '#6a1a1a'); R(x + 1, y - 7, 5, 3, on ? '#3b4b8a' : '#3b7bff');
  }
  function searchCircle(x, y, r) {
    for (let k = 3; k >= 0; k--) {
      const rr = r + k * 3;
      g.fillStyle = `rgba(255,245,190,${k ? 0.05 : 0.22})`;
      g.beginPath(); g.arc(Math.round(x), Math.round(y), rr, 0, Math.PI * 2); g.fill();
    }
  }
  function headlightCone(x, y, len, half) {
    for (let i = 0; i < len; i += 2) { const hw = Math.round(3 + (i / len) * half); g.fillStyle = 'rgba(255,245,190,.12)'; g.fillRect(Math.round(x) - hw, Math.round(y) - i, hw * 2, 2); }
  }
  function heliTop(x, y, t = 0) {
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(Math.round(x) - 5, Math.round(y) + 8, 12, 6);   // shadow-ish
    R(x - 4, y - 6, 8, 14, '#2a2d35'); R(x - 3, y - 5, 6, 4, '#7fb0d6'); R(x - 1, y + 8, 2, 12, '#2a2d35'); R(x - 3, y + 18, 6, 2, '#2a2d35');
    const a = t * 18;
    g.strokeStyle = 'rgba(200,205,215,.7)'; g.lineWidth = 1.5; g.beginPath();
    for (const o of [0, Math.PI / 2]) { g.moveTo(x + Math.cos(a + o) * 16, y + Math.sin(a + o) * 16); g.lineTo(x - Math.cos(a + o) * 16, y - Math.sin(a + o) * 16); }
    g.stroke();
  }
  function channel(scroll, gapY = null, gapH = 60) {
    const m = (v, n) => ((v % n) + n) % n;
    nightSky(20);
    R(0, 120, W, 200, '#132a4a');
    for (let i = 0; i < 30; i++) R((i * 43) % W, m(130 + (i * 17) % 180 + scroll * 0.6, 190) + 120, 6, 1, '#24466e');
    for (let y = 120; y < 320; y += 20) {
      const w = 40 - (y - 120) / 10, j = m(scroll * 0.6 + y, 40) < 20 ? 2 : 0;
      R(0, y, w + j, 20, '#163a24'); R(W - w - j, y, w + j, 20, '#163a24');
      R(w, y + 18, 4, 2, '#4a3a2a'); R(W - w - 4, y + 18, 4, 2, '#4a3a2a');
    }
    if (gapY !== null) {   // a side channel opening off to the left
      const gy = Math.round(gapY);
      R(0, gy, 50, gapH, '#132a4a');
      for (let i = 0; i < 6; i++) R((i * 13) % 44, gy + 6 + (i * 17) % (gapH - 12), 6, 1, '#24466e');
      R(0, gy - 4, 46, 4, '#1f5a32'); R(0, gy + gapH, 46, 4, '#1f5a32');
      for (let k = 0; k < 4; k++) { R(6 + k * 11, gy - 2, 2, 3, '#4a3a2a'); R(4 + k * 11, gy + gapH + 1, 2, 3, '#4a3a2a'); }
    }
  }

  const SIT_Y = 176;   // a JASE_SIT / LUCITA_SIT drawn at this y sits on the porch's top step
  return { g, R, SIT_Y, spotlight, waterTop, speedboatTop, policeBoatTop, searchCircle, headlightCone, heliTop, channel, lagoon, dock, rain, pot, sedan, cone, gator, chaseStreet, roadArrow, carWash, JASE_MASK, TINA_MASK, BAG, CLERK, FONT, JASE, JASE_SIT, LUCITA_CASUAL, LUCITA_HEAD, LUCITA_JUMP, LUCITA_MASK, P, PAL, RUDY, RUDY_MASK, TINA, alley, bankExterior, blueprintRoom, causeway, citySt, convertible, counter, daySky, duffel, ground, helicopter, hotspot, house, kayak, manatee, mangroves, marina, masked, nightSky, nightWater, palm, palmSmall, pawnRoom, windowCase, pistol, pixelHeart, policeBoat, policeCar, prison, recolor, sirenGlow, sky, sparks, speedboat, sprite, storeExterior, storeInterior, text, textW, vault };
}
