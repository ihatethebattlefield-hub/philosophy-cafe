'use strict';
/*
 * The two leads, built from one body plan (16×34 px ≈ 1.7 m, so 1 m ≈ 20 px):
 * head 15 rows, torso 11, legs 10 (rows overlap by one outline). Heads and
 * torsos are pixel grids built here once — outline, hair, face, clothes — so
 * every view and expression shares the same shapes. Legs and arms are drawn per
 * frame as outlined limbs from hip → knee → ankle and shoulder → elbow → hand,
 * which keeps walking, sitting, tapping, giving and reaching believable.
 *
 *   A 阿程  messy dark hair, pencil behind the ear · deep green jacket over a cream
 *          tee · ink-blue trousers · brown shoes. Taps rhythms; folds paper corners.
 *   B 小满  dark-brown bob under a brick-red beret · sage sweater, cream collar ·
 *          ink-blue skirt · dark tights · brown loafers · canvas tote.
 */
const KEYS = {
  common: { k: P.ink, s: P.skin0, S: P.skin1, e: P.ink, w: P.white, q: P.blush, m: P.brick2, n: P.skin2 },
  A: { h: P.hairA0, H: P.hairA2, b: P.hairA0, j: '#3b5b54', J: '#2b433f', L: '#56796e', t: P.cream1, T: P.cream2, y: P.honey1, Y: P.honey3,
    p: P.ink1, P: P.ink0, o: P.wood2, O: P.wood1, z: P.cream3 },
  C: { h: P.stone3, H: P.stone4, b: P.stone2, j: P.wood2, J: P.wood1, L: P.wood3, t: P.cream2, T: P.cream3, y: P.stone3, Y: P.stone2,
    p: P.stone1, P: P.stone0, o: P.ink0, O: P.ink, z: P.stone2 },
  D: { h: P.ink, H: P.ink1, b: P.ink, r: '#7a3b3f', R: '#93504f', d: '#5c2b30', v: '#8a9478', V: '#6f7a60', x: '#a4ad91', c: P.stone4, C: P.stone3, u: P.stone2,
    p: P.stone1, P: P.stone0, T: P.stone0, o: P.ink0, O: P.ink, z: P.ink },
  B: { h: P.hairB0, H: P.hairB2, b: P.hairB0, r: P.brick1, R: P.brick0, d: P.brick2, v: P.sage2, V: P.sage3, x: P.sage1, c: P.cream0, C: P.cream2, u: P.cream2,
    p: P.ink1, P: P.ink0, T: P.ink0, o: P.wood2, O: P.wood1, z: P.wood0 },
};
const LOOK = {
  A: { sleeve: '#3b5b54', sleeveDark: '#2b433f', cuff: '#56796e', leg: P.ink1, legDark: P.ink0, shoe: P.wood2, shoeDark: P.wood1, sole: P.cream3 },
  C: { sleeve: P.wood2, sleeveDark: P.wood1, cuff: P.wood3, leg: P.stone1, legDark: P.stone0, shoe: P.ink0, shoeDark: P.ink, sole: P.stone2 },
  D: { sleeve: '#8a9478', sleeveDark: '#6f7a60', cuff: P.stone4, leg: P.stone0, legDark: P.ink, shoe: P.ink0, shoeDark: P.ink, sole: P.ink, skirt: P.stone1, skirtDark: P.stone0 },
  B: { sleeve: P.sage2, sleeveDark: P.sage3, cuff: P.cream0, leg: P.ink0, legDark: '#191d33', shoe: P.wood2, shoeDark: P.wood1, sole: P.wood0, skirt: P.ink1, skirtDark: P.ink0 },
};
const BODY = { w: 16, h: 34, torsoY: 14, legsY: 24, hipY: 25 };
const SHAPE = { A: 'A', B: 'B', C: 'A', D: 'B' }; // C, D: passers-by built on the two body plans

// ------------------------------------------------------------- grid helpers
const grid = (w, h, c = '.') => Array.from({ length: h }, () => Array(w).fill(c));
const put = (g, x, y, c) => { if (y >= 0 && y < g.length && x >= 0 && x < g[0].length) g[y][x] = c; };
const get = (g, x, y) => (y >= 0 && y < g.length && x >= 0 && x < g[0].length ? g[y][x] : '.');
// Fill a mask, then turn every masked pixel with an unmasked 4-neighbour into outline.
function outlined(mask, fill = 's') {
  const h = mask.length, w = mask[0].length, g = grid(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (mask[y][x]) {
    const edge = !(mask[y - 1] && mask[y - 1][x]) || !(mask[y + 1] && mask[y + 1][x]) || !mask[y][x - 1] || !mask[y][x + 1];
    g[y][x] = edge ? 'k' : fill;
  }
  return g;
}
const inside = (g, x, y) => get(g, x, y) !== '.' && get(g, x, y) !== 'k';
const rowsOf = g => g.map(r => r.join(''));

// ------------------------------------------------------------- heads
// Head mask: a soft oval, 16 wide; B's bob adds hair below the jaw on both sides.
const HEAD_SPAN = [[5, 10], [3, 12], [2, 13], [1, 14], [1, 14], [1, 14], [1, 14], [1, 14], [1, 14], [1, 14], [1, 14], [1, 14], [2, 13], [3, 12], [5, 10]];
function headMask(who, view) {
  who = SHAPE[who];
  const m = HEAD_SPAN.map(([a, b]) => Array.from({ length: 16 }, (_, x) => x >= a && x <= b));
  if (who === 'B') { // bob: hair falls to the jaw line on both sides (front/back), behind (side)
    for (const y of [12, 13, 14]) for (let x = 0; x < 16; x++) {
      if (view === 'side' ? x >= 1 && x <= 8 : (x >= 1 && x <= 4) || (x >= 11 && x <= 14)) m[y][x] = true;
    }
    for (let x = 0; x < 16; x++) if (x >= 2 && x <= 13) m[0][x] = true; // beret crown is flatter and wider
  }
  if (view === 'side') m[10][15] = true; // the nose
  return m;
}
function buildHead(who0, view, face) {
  const who = SHAPE[who0];
  const g = outlined(headMask(who0, view));
  const set = (x, y, c) => { if (get(g, x, y) !== '.') put(g, x, y, c); };
  const fillIf = (fn, c) => { for (let y = 0; y < 15; y++) for (let x = 0; x < 16; x++) if (inside(g, x, y) && fn(x, y)) put(g, x, y, c); };
  if (who === 'A') {
    if (view === 'front') {
      fillIf((x, y) => y <= 6 || (y === 7 && [1, 2, 3, 4, 6, 7, 10, 11, 13, 14].includes(x)) || ((x <= 2 || x >= 13) && y <= 9), 'h');
      for (const [x, y] of [[6, 2], [7, 2], [8, 2], [5, 3], [9, 3], [11, 5]]) set(x, y, 'H');
      put(g, 8, 0, 'k'); put(g, 9, 0, 'k'); // a cowlick sticking up past the crown line
    } else if (view === 'back') {
      fillIf((x, y) => y <= 11 || (y === 12 && (x < 5 || x > 10)), 'h');
      for (const [x, y] of [[6, 3], [7, 3], [8, 3], [5, 4], [9, 4], [7, 8], [8, 9]]) set(x, y, 'H');
      set(1, 10, 'S'); set(14, 10, 'S'); set(1, 11, 'S'); set(14, 11, 'S');
    } else {
      fillIf((x, y) => y <= 6 || (y === 7 && x <= 11) || (x <= 7 && y <= 12), 'h');
      for (const [x, y] of [[5, 2], [6, 2], [7, 2], [4, 3], [8, 3], [3, 7]]) set(x, y, 'H');
      set(8, 9, 'S'); set(8, 10, 'S'); put(g, 7, 9, 'k'); put(g, 7, 10, 'k'); // ear
      if (who0 === 'A') { set(9, 8, 'y'); set(10, 8, 'y'); set(11, 8, 'Y'); } // the pencil tucked behind the ear
      put(g, 8, 0, 'k');
    }
  } else {
    if (view === 'front') {
      fillIf((x, y) => y <= 3, 'r');
      fillIf((x, y) => y > 3 && (y <= 6 || x <= 3 || x >= 12), 'h');
      for (let x = 2; x <= 13; x++) set(x, 3, 'd');
      for (const [x, y] of [[6, 1], [7, 1], [8, 1], [5, 2]]) set(x, y, 'R');
      for (const [x, y] of [[4, 5], [5, 5], [11, 6], [2, 10], [13, 11]]) set(x, y, 'H');
      put(g, 7, -1, 'k');
    } else if (view === 'back') {
      fillIf((x, y) => y <= 3, 'r'); fillIf((x, y) => y > 3, 'h');
      for (let x = 1; x <= 14; x++) set(x, 3, 'd');
      for (const [x, y] of [[6, 1], [7, 1], [8, 1]]) set(x, y, 'R');
      for (const [x, y] of [[6, 7], [7, 8], [9, 7], [4, 11], [11, 11]]) set(x, y, 'H');
    } else {
      fillIf((x, y) => y <= 3 && x <= 13, 'r');
      fillIf((x, y) => y > 3 && (y <= 6 || x <= 8), 'h');
      for (let x = 1; x <= 13; x++) set(x, 3, 'd');
      for (const [x, y] of [[4, 1], [5, 1], [6, 1], [3, 2]]) set(x, y, 'R');
      for (const [x, y] of [[3, 6], [4, 7], [5, 11]]) set(x, y, 'H');
      set(9, 9, 'S'); put(g, 9, 10, 'k'); // ear peeking out of the bob
    }
  }
  if (view === 'back') return rowsOf(g);
  // ---- face
  const F = face || '';
  if (view === 'front') {
    const ey = F === 'up' ? 8 : 9, by = ey - 1;
    for (const x0 of [4, 10]) {
      if (F !== 'blink' && F !== 'smile') { set(x0, by, 'b'); set(x0 + 1, by, 'b'); }
      if (F === 'blink' || F === 'smile') { set(x0, ey + 1, 'k'); set(x0 + 1, ey + 1, 'k'); if (F === 'smile') { set(x0, ey, 's'); set(x0 + 1, ey + 1, 'k'); set(x0 + (x0 === 4 ? 0 : 1), ey + 1, 's'); set(x0 + (x0 === 4 ? 1 : 0), ey, 'k'); } }
      else if (F === 'down' || F === 'shy') { set(x0, ey + 1, 'e'); set(x0 + 1, ey + 1, 'e'); set(x0, ey, 'S'); set(x0 + 1, ey, 'S'); }
      else { set(x0, ey, 'e'); set(x0 + 1, ey, x0 === 4 ? 'w' : 'w'); set(x0, ey + 1, 'e'); set(x0 + 1, ey + 1, 'e'); }
    }
    if (who === 'B' && F !== 'blink' && F !== 'smile') { set(3, ey, 'k'); set(12, ey, 'k'); } // lashes
    const shy = F === 'shy' || F === 'smile';
    for (const x of shy ? [2, 3, 4, 11, 12, 13] : [3, 4, 11, 12]) set(x, 11, 'q');
    if (F === 'talk') { set(7, 12, 'k'); set(8, 12, 'k'); set(7, 13, 'm'); set(8, 13, 'm'); } else if (F === 'smile') { set(6, 12, 'm'); set(7, 12, 'm'); set(8, 12, 'm'); set(9, 12, 'm'); set(6, 11, 's'); } else { set(7, 12, 'm'); set(8, 12, 'm'); }
  } else {
    const ey = F === 'up' ? 8 : 9;
    if (F === 'blink' || F === 'smile') { set(11, ey + 1, 'k'); set(12, ey + 1, 'k'); if (F === 'smile') set(12, ey, 'k'); }
    else if (F === 'down' || F === 'shy') { set(11, ey + 1, 'e'); set(12, ey + 1, 'e'); }
    else { set(11, ey, 'e'); set(12, ey, 'w'); set(11, ey + 1, 'e'); set(12, ey + 1, 'e'); set(11, ey - 1, 'b'); set(12, ey - 1, 'b'); }
    if (who === 'B' && F !== 'blink' && F !== 'smile') set(13, ey, 'k');
    set(12, 11, 'q'); if (F === 'shy' || F === 'smile') set(11, 11, 'q');
    set(14, 10, 's'); set(14, 11, 'S');
    if (F === 'talk') { set(13, 12, 'k'); set(13, 13, 'm'); } else set(13, 12, 'm');
  }
  return rowsOf(g);
}

// ------------------------------------------------------------- torsos
function torsoMask(view) {
  return Array.from({ length: 11 }, (_, y) => Array.from({ length: 16 }, (_, x) => {
    if (view === 'side') return y === 0 ? x >= 6 && x <= 9 : x >= 4 && x <= 11;
    if (y === 0) return x >= 5 && x <= 10;
    if (y === 1) return x >= 3 && x <= 12;
    return x >= 2 && x <= 13;
  }));
}
function buildTorso(who0, view) {
  const who = SHAPE[who0];
  const g = outlined(torsoMask(view), who === 'A' ? 'j' : 'v');
  const set = (x, y, c) => { if (inside(g, x, y)) put(g, x, y, c); };
  if (who === 'A') {
    if (view === 'front') {
      for (let y = 0; y <= 8; y++) for (let x = 6; x <= 9; x++) set(x, y, x === 9 ? 'T' : 't');
      for (let y = 1; y <= 4; y++) { set(5, y, 'L'); set(10, y, 'L'); }
      for (let y = 5; y <= 9; y++) { set(5, y, 'J'); set(10, y, 'J'); }
      for (let y = 2; y <= 9; y++) set(12, y, 'J');
      for (let x = 3; x <= 12; x++) set(x, 9, 'J');
      set(3, 7, 'J'); set(4, 7, 'J'); set(11, 7, 'J'); // pocket lines
    } else if (view === 'back') {
      for (let x = 3; x <= 12; x++) set(x, 3, 'J'); for (let y = 2; y <= 9; y++) set(12, y, 'J'); for (let x = 3; x <= 12; x++) set(x, 9, 'J');
      set(5, 0, 'L'); set(6, 0, 'L'); set(9, 0, 'L'); set(10, 0, 'L');
    } else {
      for (let y = 1; y <= 7; y++) { set(10, y, 't'); }
      set(9, 1, 'L'); set(9, 2, 'L'); for (let y = 3; y <= 9; y++) set(5, y, 'J'); for (let x = 5; x <= 10; x++) set(x, 9, 'J'); set(9, 7, 'J');
    }
  } else {
    if (view === 'front') {
      for (let x = 5; x <= 10; x++) set(x, 0, 'c'); set(5, 1, 'c'); set(6, 1, 'C'); set(9, 1, 'C'); set(10, 1, 'c');
      for (let y = 2; y <= 9; y++) set(12, y, 'V'); for (let x = 3; x <= 12; x++) set(x, 9, 'V');
      for (const [x, y] of [[4, 4], [8, 5], [6, 7], [10, 3]]) set(x, y, 'x'); // knit flecks
      for (let k = 0; k < 9; k++) set(4 + k, 1 + k, 'u'); // tote strap across the chest
    } else if (view === 'back') {
      for (let x = 5; x <= 10; x++) set(x, 0, 'c'); for (let y = 2; y <= 9; y++) set(12, y, 'V'); for (let x = 3; x <= 12; x++) set(x, 9, 'V');
      for (let k = 0; k < 9; k++) set(11 - k, 1 + k, 'u');
    } else {
      set(9, 0, 'c'); set(10, 1, 'c'); set(10, 2, 'C'); for (let y = 3; y <= 9; y++) set(5, y, 'V'); for (let x = 5; x <= 10; x++) set(x, 9, 'V');
      for (let y = 1; y <= 9; y++) set(7, y, 'u'); set(8, 4, 'x');
    }
  }
  return rowsOf(g);
}

function initSprites() {
  for (const who of ['A', 'B', 'C', 'D']) {
    const keys = { ...KEYS.common, ...KEYS[who] };
    for (const view of ['front', 'back', 'side']) {
      for (const f of ['', 'blink', 'smile', 'up', 'down', 'shy', 'talk']) {
        if (view === 'back' && f) continue;
        const rows = buildHead(who, view, f);
        sprite(`${who}_head_${view}${f ? '_' + f : ''}`, rows, keys);
      }
      sprite(`${who}_torso_${view}`, buildTorso(who, view), keys);
    }
  }
  initProps();
}

// ------------------------------------------------------------- limbs
// An outlined limb: ink first (4 px wide), then the 2-px fill with a shaded edge.
function limb(x, pts, fill, dark, w = 2) {
  const seg = (ax, ay, bx, by, fn) => { const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay))); for (let k = 0; k <= n; k++) fn(ri(ax + (bx - ax) * k / n), ri(ay + (by - ay) * k / n)); };
  for (let i = 0; i < pts.length - 1; i++) seg(...pts[i], ...pts[i + 1], (px, py) => rect(x, px - 1, py - 1, w + 2, w + 2, P.ink));
  for (let i = 0; i < pts.length - 1; i++) seg(...pts[i], ...pts[i + 1], (px, py) => { rect(x, px, py, w, w, fill); pset(x, px + w - 1, py + w - 1, dark); });
}
function handAt(x, hx, hy, open) { rect(x, hx - 1, hy - 1, 4, 4, P.ink); rect(x, hx, hy, 2, 2, P.skin0); pset(x, hx + 1, hy + 1, P.skin1); if (open) { pset(x, hx + 2, hy - 1, P.ink); pset(x, hx + 2, hy, P.skin0); } }
function arm(x, who, s, e, h, o = {}) {
  const L = LOOK[who];
  limb(x, [s, e, h], o.far ? L.sleeveDark : L.sleeve, L.sleeveDark);
  rect(x, h[0] - 1, h[1] - 1, 2, 2, L.cuff); // cuff
  handAt(x, h[0], h[1], o.open);
  if (o.finger) { rect(x, h[0] + 1, h[1] - 3, 3, 3, P.ink); pset(x, h[0] + 2, h[1] - 2, P.skin0); } // a raised finger (tapping)
}
// Side-view walk: hip → knee → ankle offsets for six poses (near leg; far leg is half a cycle later).
const STRIDE = [[[2, 4], [4, 9]], [[1, 4], [2, 9]], [[0, 4], [0, 9]], [[-1, 4], [-3, 9]], [[-2, 4], [-4, 8]], [[1, 3], [0, 7]]];
function legSide(x, who, hx, hy, pose, near) {
  const L = LOOK[who], [kn, an] = pose;
  const knee = [hx + kn[0], hy + kn[1]], ank = [hx + an[0], hy + an[1]];
  limb(x, [[hx, hy], knee, ank], near ? L.leg : L.legDark, L.legDark);
  // shoe pointing forward (right)
  rect(x, ank[0] - 2, ank[1], 7, 3, P.ink); rect(x, ank[0] - 1, ank[1], 5, 1, near ? L.shoe : L.shoeDark); rect(x, ank[0] - 1, ank[1] + 1, 5, 1, L.sole);
}
/*
 * Draws a lead with feet at (fx, fy) (bottom centre).
 *   dir: 'front' | 'back' | 'left' | 'right'
 *   walk: phase in [0,1) or null · sit: bool · face: expression
 *   pose: arm pose (see armsFor) · t: time for breathing and blinks
 */
function drawChar(x, who, fx, fy, o = {}) {
  const dir = o.dir || 'front', side = dir === 'left' || dir === 'right', flip = dir === 'left';
  const view = side ? 'side' : dir, t = o.t || 0, L = LOOK[who];
  const walking = o.walk !== undefined && o.walk !== null;
  const wf = walking ? Math.floor(mod(o.walk, 1) * 6) : 0;
  const breathe = !walking && !o.still && mod(t + (who === 'B' ? 1.3 : 0), 3.6) > 1.8 ? 1 : 0;
  const bob = walking && (wf === 2 || wf === 5) ? -1 : 0;
  const blink = !o.still && mod(t + (o.seed || 0) + (who === 'B' ? 1.9 : 0), 4.1) < 0.12;
  const sitDrop = o.sit ? 8 : 0;
  const X = ri(fx) - 8, Y = ri(fy) - BODY.h + sitDrop + bob;
  x.save();
  if (flip) { x.translate(ri(fx) * 2, 0); x.scale(-1, 1); }
  const hip = [X + 8, Y + BODY.hipY - (o.sit ? 1 : 0)];
  // ---- legs
  if (side) {
    if (o.sit) {
      const knee = [hip[0] + 6, hip[1]], ank = [hip[0] + 6, hip[1] + 7];
      limb(x, [hip, knee, ank], L.legDark, L.legDark); limb(x, [[hip[0] - 1, hip[1] + 1], [knee[0] - 1, knee[1] + 1], [ank[0] - 1, ank[1] + 1]], L.leg, L.legDark);
      rect(x, ank[0] - 3, ank[1] + 1, 7, 3, P.ink); rect(x, ank[0] - 2, ank[1] + 1, 5, 1, L.shoe); rect(x, ank[0] - 2, ank[1] + 2, 5, 1, L.sole);
      if (SHAPE[who] === 'B') { rect(x, hip[0] - 4, hip[1] - 3, 13, 5, P.ink); rect(x, hip[0] - 3, hip[1] - 2, 11, 3, L.skirt); hline(x, hip[0] - 3, hip[0] + 7, hip[1], L.skirtDark); }
    } else {
      const pn = walking ? STRIDE[wf] : [[0, 4], [0, 9]], pf = walking ? STRIDE[(wf + 3) % 6] : [[0, 4], [-1, 9]];
      legSide(x, who, hip[0] - 1, hip[1], pf, false);
      legSide(x, who, hip[0], hip[1], pn, true);
      if (SHAPE[who] === 'B') { const sw = walking ? [0, 1, 1, 0, -1, -1][wf] : 0; rect(x, hip[0] - 5, hip[1] - 4, 11, 4, P.ink); rect(x, hip[0] - 6 + sw, hip[1], 13, 5, P.ink); rect(x, hip[0] - 4, hip[1] - 3, 9, 4, L.skirt); rect(x, hip[0] - 5 + sw, hip[1], 11, 4, L.skirt); hline(x, hip[0] - 5 + sw, hip[0] + 5 + sw, hip[1] + 3, L.skirtDark); pset(x, hip[0] + sw, hip[1] + 1, L.skirtDark); pset(x, hip[0] + 3 + sw, hip[1] + 1, L.skirtDark); }
    }
  } else if (!o.sit) {
    const lift = walking ? [0, 1, 2, 0, 0, 0][wf] : 0, liftR = walking ? [0, 0, 0, 0, 1, 2][wf] : 0;
    for (const [lx, lf] of [[X + 5, lift], [X + 10, liftR]]) {
      const top = Y + BODY.legsY, bot = Y + BODY.h - 3 - lf;
      rect(x, lx - 2, top, 5, bot - top + 1, P.ink); rect(x, lx - 1, top, 3, bot - top, L.leg); vline(x, lx + 1, top, bot - 1, L.legDark);
      rect(x, lx - 2 - (lx < X + 8 ? 1 : 0), bot, 6, 3, P.ink); rect(x, lx - 1 - (lx < X + 8 ? 1 : 0), bot, 4, 1, L.shoe); rect(x, lx - 1 - (lx < X + 8 ? 1 : 0), bot + 1, 4, 1, L.sole);
    }
    if (SHAPE[who] === 'B') { rect(x, X + 2, Y + BODY.legsY - 1, 12, 7, P.ink); rect(x, X + 3, Y + BODY.legsY - 1, 10, 6, L.skirt); vline(x, X + 12, Y + BODY.legsY, Y + BODY.legsY + 4, L.skirtDark); for (const k of [5, 8, 11]) vline(x, X + k, Y + BODY.legsY + 2, Y + BODY.legsY + 4, L.skirtDark); }
    else { rect(x, X + 3, Y + BODY.legsY - 1, 10, 3, P.ink); rect(x, X + 4, Y + BODY.legsY - 1, 8, 2, L.leg); }
  } else if (dir === 'front') { // seated, facing us: knees forward, shins down
    for (const lx of [X + 5, X + 10]) { rect(x, lx - 2, Y + BODY.legsY - 1, 5, 9, P.ink); rect(x, lx - 1, Y + BODY.legsY, 3, 7, L.leg); rect(x, lx - 2, Y + BODY.legsY + 7, 6, 3, P.ink); rect(x, lx - 1, Y + BODY.legsY + 7, 4, 1, L.shoe); }
    if (SHAPE[who] === 'B') { rect(x, X + 2, Y + BODY.legsY - 2, 12, 5, P.ink); rect(x, X + 3, Y + BODY.legsY - 1, 10, 3, L.skirt); }
  }
  // ---- arms (far arm behind the torso in side view)
  const arms = armsFor(o.pose || 'down', side, t, o);
  const sh = side ? [X + 8, Y + BODY.torsoY + 2] : null;
  const swing = walking ? [1, 1, 0, -1, -1, 0][wf] : 0;
  if (side && arms.far) { const [e, h] = arms.far; arm(x, who, [sh[0] - 1, sh[1]], [sh[0] - 1 + e[0] - swing, sh[1] + e[1]], [sh[0] - 1 + h[0] - swing * 2, sh[1] + h[1]], { far: true }); }
  blit(x, `${who}_torso_${view}`, X, Y + BODY.torsoY);
  // ---- head (breathing lifts it a pixel; the face can be fixed or blink on its own)
  const face = o.face && o.face !== 'auto' ? o.face : (blink ? 'blink' : '');
  blit(x, `${who}_head_${view}${face && view !== 'back' ? '_' + face : ''}`, X, Y - breathe + (o.nod ? 1 : 0));
  // ---- near arm(s)
  if (side) {
    const [e, h] = arms.near;
    arm(x, who, sh, [sh[0] + e[0] + swing, sh[1] + e[1]], [sh[0] + h[0] + swing * 2, sh[1] + h[1]], { finger: arms.finger, open: arms.open });
    if (o.holding) { const s = SPR.get(o.holding); blit(x, o.holding, sh[0] + h[0] + swing * 2 - (s.w >> 1) + 1, sh[1] + h[1] - s.h + 1); }
  } else {
    const sy = Y + BODY.torsoY + 2, ls = [X + 2, sy], rs = [X + 13, sy];
    const [L1, R1] = arms.front;
    arm(x, who, ls, [ls[0] + L1[0][0] - swing, ls[1] + L1[0][1]], [ls[0] + L1[1][0] - swing, ls[1] + L1[1][1]]);
    arm(x, who, rs, [rs[0] + R1[0][0] + swing, rs[1] + R1[0][1]], [rs[0] + R1[1][0] + swing, rs[1] + R1[1][1]], { finger: arms.finger });
    if (o.holding) { const s = SPR.get(o.holding); blit(x, o.holding, X + 8 - (s.w >> 1), sy + 7 - s.h); }
  }
  x.restore();
}
/*
 * Arm poses. Side view: [elbow, hand] offsets from the shoulder (facing right),
 * near and far arm. Front view: [[elbow],[hand]] for left and right arm.
 */
function armsFor(pose, side, t, o) {
  const tap = o.tapUp ? 1 : 0;
  const S = {
    down: { near: [[0, 5], [0, 10]], far: [[0, 5], [0, 10]] },
    table: { near: [[3, 5], [8, 7 - tap]], far: [[3, 5], [7, 8]], finger: !!o.tapUp },        // forearms resting on a table
    write: { near: [[3, 6], [8, 8]], far: [[3, 5], [7, 8]] },
    reach: { near: [[5, 1], [11, 0]], far: [[0, 5], [0, 10]], open: true },
    give: { near: [[4, 5], [9, 4]], far: [[3, 5], [8, 5]] },
    hold: { near: [[2, 6], [6, 5]], far: [[2, 6], [5, 6]] },                                   // a cup or a sheet at the chest
    book: { near: [[2, 6], [6, 4]], far: [[2, 6], [6, 5]] },
    cuff: { near: [[2, 6], [3, 9]], far: [[1, 6], [4, 9]] },                                   // fixing a sleeve
    raise: { near: [[2, -4], [3, -10]], far: [[0, 5], [0, 10]], open: true },
    point: { near: [[4, 2], [10, 1]], far: [[0, 5], [0, 10]] },
    pocket: { near: [[1, 5], [2, 8]], far: [[1, 5], [2, 8]] },
    bag: { near: [[1, 5], [1, 9]], far: [[0, 5], [0, 10]] },
  };
  const F = {
    down: [[[-1, 5], [-1, 10]], [[1, 5], [1, 10]]],
    hold: [[[0, 6], [3, 6]], [[0, 6], [-3, 6]]],
    book: [[[0, 6], [3, 5]], [[0, 6], [-3, 5]]],
    raise: [[[-1, 5], [-1, 10]], [[2, -3], [2, -9]]],
    wave: [[[-1, 5], [-1, 10]], [[3, -2], [3 + (mod(t * 4, 1) < 0.5 ? 1 : -1), -8]]],
    cuff: [[[1, 6], [4, 8]], [[-1, 6], [-3, 8]]],
    pocket: [[[0, 5], [1, 8]], [[0, 5], [-1, 8]]],
    table: [[[0, 5], [2, 8 - tap]], [[0, 5], [-2, 8]]],
  };
  if (side) return S[pose] || S.down;
  return { front: F[pose] || F.down, finger: pose === 'table' && !!o.tapUp };
}
function charShadow(x, fx, fy, w = 9, a = 0.26) { x.save(); x.globalAlpha = a; ellipse(x, fx, fy, w, 1, P.ink); x.globalAlpha = a * 0.7; ellipse(x, fx, fy, w - 3, 1, P.ink); x.restore(); }

// ------------------------------------------------------------- props
function initProps() {
  const K = { k: P.ink, w: P.white, c: P.cream0, C: P.cream1, n: P.cream2, N: P.cream3, h: P.honey1, H: P.honey2, y: P.honey0, r: P.brick1, R: P.brick0, d: P.brick2,
    g: P.sage2, G: P.sage3, b: P.ink2, B: P.ink1, s: P.stone3, S: P.stone2, t: P.wood3, T: P.wood2, a: P.amber, A: P.amber2 };
  sprite('pencil', ['kkkkkkkkk.', 'krhhhhhhNk', 'kkkkkkkkk.'], K);                       // eraser, body, tip
  sprite('paper', ['kkkkkkkkk', 'kcccccc.k'.replace('.', 'n'), 'kcbbbccnk', 'kcccccc.k'.replace('.', 'c'), 'kcbbbbcck', 'kccccccck', 'kkkkkkkkk'], K);
  sprite('sketchbook', ['kkkkkkkkkk', 'kGgggggggk', 'kgcccccccG', 'kgcbbccccG', 'kgccccbccG', 'kgcccccccG', 'kkkkkkkkkk'], K);
  sprite('cup', ['kkkkkk..', 'kccccck.', 'kcnnnckk', 'kccccck.', '.kkkkk..'], K);       // handle to the right
  sprite('cupL', ['..kkkkkk', '.kccccck', 'kkcnnnck', '.kccccck', '..kkkkk.'], K);      // handle to the left
  sprite('tote', ['..kkkk..', '.kn..nk.', 'kkkkkkkk', 'kccccCck', 'kcrccCck', 'kccccCck', 'kkkkkkkk'], K);
  sprite('sock', ['.kkk', 'kRRk', 'kRRk', 'kRRkk', 'kRRRRk', '.kkkk.'], K);
  sprite('note', ['...kk', '...kak', '...kAk', '.kkk.', 'kaak.', 'kaak.', '.kk..'], K);
  sprite('bird', ['..kk..', '.kbbk.', 'kbbbbkk', '.kbbbk.', '..k.k..'], K);
}
