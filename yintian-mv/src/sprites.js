'use strict';
/*
 * The two people, built from one adult body plan: 16×44 px (≈3.3 heads tall, so
 * shoulders, neck, arms and weight read), 1 m ≈ 26 px. Head 13 rows, neck 1,
 * torso 14, legs 17. Heads and torsos are pixel grids built here once; legs and
 * arms are drawn each frame as outlined limbs (hip → knee → ankle, shoulder →
 * elbow → hand), so sitting, reaching, holding a cup and walking stay in contact.
 *
 *   W 她  shoulder-length dark hair, side-swept · loose grey-blue top · beige trousers · grey socks
 *   M 他  short dark hair · brown-green jacket over a cream collar · dark trousers · brown shoes
 */
const KEYS = {
  common: { k: P.ink, s: P.skin0, S: P.skin1, n: P.skin2, e: P.ink, w: P.white, m: P.lip },
  W: { h: P.hairW0, H: P.hairW2, b: P.hairW0, t: P.blue1, T: P.blue2, U: P.blue3, l: P.blue0, c: P.skin0 },
  M: { h: P.hairM0, H: P.hairM1, b: P.hairM0, t: P.olive1, T: P.olive2, U: P.olive3, l: P.olive0, c: P.cream1 },
};
const LOOK = {
  W: { sleeve: P.blue1, sleeveDark: P.blue2, cuff: P.blue0, leg: P.beige0, legDark: P.beige1, shoe: P.slate3, shoeDark: P.slate2, sole: P.slate4 },
  M: { sleeve: P.olive1, sleeveDark: P.olive2, cuff: P.olive0, leg: P.dark0, legDark: P.dark1, shoe: P.wood2, shoeDark: P.wood1, sole: P.wood3 },
};
const BODY = { w: 16, h: 44, neckY: 13, torsoY: 13, hipY: 27, thigh: 8, shin: 9, upper: 7, fore: 7 };

const grid = (w, h, c = '.') => Array.from({ length: h }, () => Array(w).fill(c));
const put = (g, x, y, c) => { if (y >= 0 && y < g.length && x >= 0 && x < g[0].length) g[y][x] = c; };
const get = (g, x, y) => (y >= 0 && y < g.length && x >= 0 && x < g[0].length ? g[y][x] : '.');
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

// ------------------------------------------------------------- heads (16 wide grid, face 10 wide)
const HSPAN = [[5, 10], [4, 11], [3, 12], [3, 12], [3, 12], [3, 12], [3, 12], [3, 12], [3, 12], [3, 12], [4, 11], [4, 11], [5, 10], [6, 9]];
function headMask(who, view) {
  const H = who === 'W' ? 18 : 14;
  const m = Array.from({ length: H }, (_, y) => Array.from({ length: 16 }, (_, x) => y < HSPAN.length && x >= HSPAN[y][0] && x <= HSPAN[y][1]));
  if (who === 'W') for (let y = 3; y < 18; y++) for (let x = 0; x < 16; x++) { // hair to the shoulders
    const front = view !== 'side' ? (x >= 2 && x <= 4) || (x >= 11 && x <= 13) : x >= 2 && x <= 8;
    if (front && y <= (view === 'back' ? 17 : 16)) m[y][x] = true;
    if (view === 'back' && x >= 2 && x <= 13 && y <= 17) m[y][x] = true;
  }
  if (view === 'side') { m[8][13] = true; m[9][13] = true; } // nose
  return m;
}
function buildHead(who, view, face) {
  const g = outlined(headMask(who, view));
  const set = (x, y, c) => { if (get(g, x, y) !== '.') put(g, x, y, c); };
  const fill = (fn, c) => { for (let y = 0; y < g.length; y++) for (let x = 0; x < 16; x++) if (inside(g, x, y) && fn(x, y)) put(g, x, y, c); };
  if (who === 'W') {
    if (view === 'front') {
      fill((x, y) => y <= 4 || (y === 5 && x <= 8) || (y === 6 && x <= 5) || x <= 4 || x >= 11, 'h');
      for (const [x, y] of [[6, 1], [7, 1], [8, 2], [5, 2], [3, 9], [12, 11], [3, 13]]) set(x, y, 'H');
    } else if (view === 'back') { fill(() => true, 'h'); for (const [x, y] of [[6, 2], [7, 2], [8, 2], [5, 3], [7, 9], [8, 12], [5, 14], [10, 14]]) set(x, y, 'H'); }
    else { fill((x, y) => y <= 4 || (y <= 6 && x <= 10) || x <= 8, 'h'); for (const [x, y] of [[5, 1], [6, 1], [7, 2], [4, 6], [5, 12]]) set(x, y, 'H'); set(9, 7, 'S'); set(9, 8, 'S'); }
  } else {
    if (view === 'front') {
      fill((x, y) => y <= 4 || (y === 5 && [4, 5, 6, 8, 9, 11].includes(x)) || ((x <= 3 || x >= 12) && y <= 7), 'h');
      for (const [x, y] of [[6, 1], [7, 1], [8, 1], [5, 2], [10, 3]]) set(x, y, 'H');
    } else if (view === 'back') { fill((x, y) => y <= 9 || (y === 10 && (x < 6 || x > 9)), 'h'); for (const [x, y] of [[6, 2], [7, 2], [8, 2], [7, 6]]) set(x, y, 'H'); set(3, 7, 'S'); set(12, 7, 'S'); }
    else { fill((x, y) => y <= 4 || (y === 5 && x <= 10) || (x <= 7 && y <= 9), 'h'); for (const [x, y] of [[5, 1], [6, 1], [7, 1], [4, 2]]) set(x, y, 'H'); set(8, 7, 'S'); set(8, 8, 'S'); put(g, 7, 7, 'k'); put(g, 7, 8, 'k'); }
  }
  if (view === 'back') return rowsOf(g);
  const F = face || '';
  if (view === 'front') {
    const ey = F === 'up' ? 6 : 7;
    for (const x0 of [5, 9]) {
      if (F !== 'blink' && F !== 'closed') { set(x0, ey - 1, 'b'); set(x0 + 1, ey - 1, x0 === 5 ? 'b' : 'b'); }
      if (F === 'blink' || F === 'closed') { set(x0, ey + 1, 'k'); set(x0 + 1, ey + 1, 'k'); }
      else if (F === 'down') { set(x0, ey + 1, 'e'); set(x0 + 1, ey + 1, 'e'); set(x0, ey, 'S'); set(x0 + 1, ey, 'S'); }
      else if (F === 'smile') { set(x0, ey + 1, 'k'); set(x0 + 1, ey + 1, 'k'); set(x0 + (x0 === 5 ? 0 : 1), ey, 'k'); }
      else { set(x0, ey, 'e'); set(x0 + 1, ey, 'e'); set(x0, ey + 1, 'e'); set(x0 + 1, ey + 1, x0 === 5 ? 'w' : 'w'); }
    }
    if (who === 'W' && F !== 'blink' && F !== 'closed') { set(4, ey, 'k'); set(11, ey, 'k'); }
    set(8, 9, 'S'); // nose
    if (F === 'smile') { set(6, 10, 'm'); set(7, 11, 'm'); set(8, 11, 'm'); set(9, 10, 'm'); } else if (F === 'talk') { set(7, 10, 'k'); set(8, 10, 'k'); } else { set(7, 10, 'm'); set(8, 10, 'm'); }
    set(4, 8, 'S'); set(11, 8, 'S');
  } else {
    const ey = F === 'up' ? 6 : 7;
    if (F === 'blink' || F === 'closed') { set(10, ey + 1, 'k'); set(11, ey + 1, 'k'); }
    else if (F === 'down') { set(10, ey + 1, 'e'); set(11, ey + 1, 'e'); }
    else { set(10, ey, 'e'); set(11, ey, 'e'); set(10, ey + 1, 'e'); set(11, ey + 1, 'w'); set(10, ey - 1, 'b'); set(11, ey - 1, 'b'); }
    if (who === 'W' && F !== 'blink' && F !== 'closed') set(12, ey, 'k');
    set(12, 9, 'S'); set(12, 10, F === 'talk' ? 'k' : 'm'); if (F === 'smile') set(11, 10, 'm');
  }
  return rowsOf(g);
}

// ------------------------------------------------------------- torsos (16×15)
function torsoMask(who, view) {
  return Array.from({ length: 15 }, (_, y) => Array.from({ length: 16 }, (_, x) => {
    if (view === 'side') return y === 0 ? x >= 6 && x <= 9 : y < 11 ? x >= 4 && x <= 11 : x >= (who === 'W' ? 3 : 4) && x <= (who === 'W' ? 12 : 11);
    if (y === 0) return x >= 6 && x <= 9;
    if (y === 1) return x >= 3 && x <= 12;
    if (who === 'W' && y >= 10) return x >= 1 && x <= 14; // the loose top widens at the hem
    return x >= 2 && x <= 13;
  }));
}
function buildTorso(who, view) {
  const g = outlined(torsoMask(who, view), 't');
  const set = (x, y, c) => { if (inside(g, x, y)) put(g, x, y, c); };
  if (view === 'front') {
    if (who === 'W') {
      set(7, 0, 'c'); set(8, 0, 'c'); set(7, 1, 'c'); set(8, 1, 'c'); set(6, 1, 'c'); set(9, 1, 'c'); // neckline
      for (const x of [5, 10]) for (let y = 4; y <= 13; y++) if ((y + x) % 3) set(x, y, 'T'); // folds of the loose top
      for (let y = 2; y <= 13; y++) set(13, y, 'T'); for (let x = 2; x <= 13; x++) set(x, 13, 'T');
      set(3, 2, 'l'); set(4, 2, 'l'); set(11, 2, 'l');
    } else {
      for (let y = 0; y <= 3; y++) { set(7, y, 'c'); set(8, y, 'c'); } set(6, 1, 'c'); set(9, 1, 'c'); // shirt collar
      for (let y = 4; y <= 13; y++) set(8, y, 'U'); // zip line
      for (let y = 2; y <= 13; y++) { set(13, y, 'T'); set(2, y, 'T'); } for (let x = 2; x <= 13; x++) set(x, 13, 'T');
      set(4, 9, 'U'); set(5, 9, 'U'); set(10, 9, 'U'); set(11, 9, 'U'); // pockets
      set(5, 2, 'l'); set(10, 2, 'l');
    }
  } else if (view === 'back') {
    for (let y = 2; y <= 13; y++) set(13, y, 'T'); for (let x = 2; x <= 13; x++) set(x, 13, 'T');
    if (who === 'M') for (let x = 3; x <= 12; x++) set(x, 3, 'T');
    else for (const x of [6, 10]) for (let y = 5; y <= 12; y++) if (y % 3) set(x, y, 'T');
  } else {
    if (who === 'M') { set(10, 1, 'c'); set(11, 1, 'c'); set(10, 2, 'c'); for (let y = 3; y <= 12; y++) set(10, y, 'U'); }
    else { set(10, 0, 'c'); set(11, 1, 'c'); for (let y = 4; y <= 12; y++) if (y % 3) set(7, y, 'T'); }
    for (let y = 2; y <= 13; y++) set(5, y, 'T'); for (let x = 4; x <= 11; x++) set(x, 13, 'T');
  }
  return rowsOf(g);
}
function initSprites() {
  for (const who of ['W', 'M']) {
    const keys = { ...KEYS.common, ...KEYS[who] };
    for (const view of ['front', 'back', 'side']) {
      for (const f of ['', 'blink', 'down', 'up', 'smile', 'closed', 'talk']) { if (view === 'back' && f) continue; sprite(`${who}_head_${view}${f ? '_' + f : ''}`, buildHead(who, view, f), keys); }
      sprite(`${who}_torso_${view}`, buildTorso(who, view), keys);
    }
  }
  initProps();
}

// ------------------------------------------------------------- limbs
function limb(x, pts, fill, dark, w = 3) {
  const seg = (ax, ay, bx, by, fn) => { const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay))); for (let k = 0; k <= n; k++) fn(ri(ax + (bx - ax) * k / n), ri(ay + (by - ay) * k / n)); };
  for (let i = 0; i < pts.length - 1; i++) seg(...pts[i], ...pts[i + 1], (px, py) => rect(x, px - 1, py - 1, w + 2, w + 2, P.ink));
  for (let i = 0; i < pts.length - 1; i++) seg(...pts[i], ...pts[i + 1], (px, py) => { rect(x, px, py, w, w, fill); pset(x, px + w - 1, py + w - 1, dark); });
}
function handAt(x, hx, hy, o = {}) {
  rect(x, hx - 1, hy - 1, 5, 5, P.ink); rect(x, hx, hy, 3, 3, P.skin0); pset(x, hx + 2, hy + 2, P.skin1);
  if (o.open) { rect(x, hx + 3, hy - 1, 3, 3, P.ink); pset(x, hx + 4, hy, P.skin0); }
}
function arm(x, who, s, e, h, o = {}) {
  const L = LOOK[who];
  limb(x, [s, e, h], o.far ? L.sleeveDark : L.sleeve, L.sleeveDark);
  rect(x, h[0] - 1, h[1], 2, 3, L.cuff);
  handAt(x, h[0], h[1], o);
}
const STRIDE = [[[2, 8], [4, 17]], [[1, 8], [2, 17]], [[0, 8], [0, 17]], [[-1, 8], [-3, 17]], [[-2, 7], [-5, 15]], [[2, 6], [1, 14]]];
function legSide(x, who, hx, hy, pose, near) {
  const L = LOOK[who], [kn, an] = pose, knee = [hx + kn[0], hy + kn[1]], ank = [hx + an[0], hy + an[1]];
  limb(x, [[hx, hy], knee, ank], near ? L.leg : L.legDark, L.legDark, who === 'W' ? 4 : 3);
  rect(x, ank[0] - 2, ank[1], 8, 3, P.ink); rect(x, ank[0] - 1, ank[1], 6, 1, near ? L.shoe : L.shoeDark); rect(x, ank[0] - 1, ank[1] + 1, 6, 1, L.sole);
}
/*
 * Arm poses (side view, facing right): [elbow, hand] offsets from the shoulder for the
 * near and far arm. A pose can be given as { near:[e,h], far:[e,h] } directly for
 * one-off reaches. Seated poses assume a table top about 8 px below the shoulder.
 */
const POSES = {
  down: { near: [[0, 7], [1, 14]], far: [[0, 7], [0, 14]] },
  table: { near: [[4, 6], [11, 1]], far: [[4, 6], [10, 2]] },          // forearms on the table top
  lap: { near: [[2, 7], [6, 10]], far: [[2, 7], [6, 11]] },             // hands in the lap
  cup: { near: [[5, 5], [13, 0]], far: [[5, 5], [13, 1]] },
  cupUp: { near: [[4, 5], [9, -3]], far: [[4, 5], [10, -2]] },
  photo: { near: [[4, 4], [10, -4]], far: [[4, 4], [10, -3]] },
  reach: { near: [[6, 3], [15, 0]], far: [[4, 6], [10, 2]], open: true },
  reachStop: { near: [[5, 4], [10, 1]], far: [[4, 6], [10, 2]], open: true },
  chin: { near: [[5, 4], [7, -5]], far: [[4, 6], [10, 2]] },
  write: { near: [[4, 6], [11, 2]], far: [[4, 6], [10, 1]] },
  give: { near: [[5, 5], [12, 5]], far: [[0, 7], [1, 14]] },
  hold: { near: [[3, 7], [7, 10]], far: [[3, 7], [6, 11]] },
  wipe: { near: [[4, 7], [12, 10]], far: [[0, 7], [1, 14]] },
  hook: { near: [[3, -4], [6, -11]], far: [[0, 7], [1, 14]] },
  key: { near: [[3, 7], [7, 13]], far: [[0, 7], [0, 14]] },
  sleep: { near: [[5, 3], [12, 2]], far: [[5, 4], [12, 3]] },
  pocket: { near: [[1, 7], [2, 12]], far: [[1, 7], [2, 12]] },
  wash: { near: [[4, 5], [10, 9]], far: [[4, 6], [9, 10]] },
  collar: { near: [[5, 3], [10, -2]], far: [[4, 5], [9, -1]] },
  menu: { near: [[4, 6], [9, 4]], far: [[4, 6], [10, 6]] },
};
const FPOSES = {
  down: [[[-1, 7], [-1, 14]], [[1, 7], [1, 14]]],
  table: [[[0, 7], [3, 11]], [[0, 7], [-3, 11]]],
  cup: [[[0, 7], [4, 9]], [[0, 7], [-4, 9]]],
  photo: [[[1, 6], [4, 5]], [[-1, 6], [-4, 5]]],
  pocket: [[[0, 7], [1, 11]], [[0, 7], [-1, 11]]],
  hold: [[[0, 7], [3, 10]], [[0, 7], [-3, 10]]],
};
/*
 * Draws a person with feet at (fx, fy).
 *   dir: front|back|left|right · walk: phase or null · sit: bool · face · pose · lean (px forward)
 *   head: 'turn' → side head on a front body (looking aside) · still: no breathing/blinks
 */
function drawPerson(x, who, fx, fy, o = {}) {
  const dir = o.dir || 'front', side = dir === 'left' || dir === 'right', flip = dir === 'left';
  const view = side ? 'side' : dir, t = o.t || 0, L = LOOK[who];
  const walking = o.walk !== undefined && o.walk !== null;
  const wf = walking ? Math.floor(mod(o.walk, 1) * 6) : 0;
  const breathe = !walking && !o.still && mod(t + (who === 'M' ? 1.4 : 0), 4.2) > 2.1 ? 1 : 0;
  const bob = walking && (wf === 2 || wf === 5) ? -1 : 0;
  const blink = !o.still && mod(t + (o.seed || 0) + (who === 'M' ? 2.1 : 0), 4.6) < 0.12;
  const sitDrop = o.sit ? 5 : 0; // the hips land on a seat 12 px high
  const X = ri(fx) - 8, Y = ri(fy) - BODY.h + sitDrop + bob, lean = ri(o.lean || 0);
  x.save(); if (flip) { x.translate(ri(fx) * 2, 0); x.scale(-1, 1); }
  const hip = [X + 8, Y + BODY.hipY];
  // legs
  if (side) {
    if (o.sit) {
      const knee = [hip[0] + 9, hip[1] + 1], ank = [hip[0] + 9 + (o.legOut || 0), hip[1] + 10];
      limb(x, [[hip[0] - 1, hip[1]], [knee[0] - 1, knee[1]], [ank[0] - 2, ank[1]]], L.legDark, L.legDark, who === 'W' ? 4 : 3);
      limb(x, [hip, knee, ank], L.leg, L.legDark, who === 'W' ? 4 : 3);
      rect(x, ank[0] - 2, ank[1] + 1, 8, 3, P.ink); rect(x, ank[0] - 1, ank[1] + 1, 6, 1, L.shoe); rect(x, ank[0] - 1, ank[1] + 2, 6, 1, L.sole);
    } else {
      const pn = walking ? STRIDE[wf] : [[0, 8], [0, 17]], pf = walking ? STRIDE[(wf + 3) % 6] : [[0, 8], [-1, 17]];
      legSide(x, who, hip[0] - 1, hip[1], pf, false); legSide(x, who, hip[0], hip[1], pn, true);
    }
  } else if (!o.sit) {
    const lift = walking ? [0, 1, 2, 0, 0, 0][wf] : 0, liftR = walking ? [0, 0, 0, 0, 1, 2][wf] : 0, wide = who === 'W' ? 5 : 4;
    for (const [lx, lf] of [[X + 5, lift], [X + 10, liftR]]) {
      const top = Y + BODY.hipY - 1, bot = Y + BODY.h - 3 - lf;
      rect(x, lx - 2, top, wide + 1, bot - top + 1, P.ink); rect(x, lx - 1, top, wide - 1, bot - top, L.leg); vline(x, lx + wide - 3, top, bot - 1, L.legDark);
      rect(x, lx - 2, bot, 6, 3, P.ink); rect(x, lx - 1, bot, 4, 1, L.shoe); rect(x, lx - 1, bot + 1, 4, 1, L.sole);
    }
  } else if (dir === 'front') {
    for (const lx of [X + 5, X + 10]) { rect(x, lx - 2, Y + BODY.hipY, 6, 11, P.ink); rect(x, lx - 1, Y + BODY.hipY, 4, 9, L.leg); rect(x, lx - 2, Y + BODY.hipY + 9, 6, 3, P.ink); rect(x, lx - 1, Y + BODY.hipY + 9, 4, 1, L.shoe); }
  }
  // arms behind, torso, head, arms in front
  const pose = typeof o.pose === 'object' ? o.pose : POSES[o.pose || 'down'] || POSES.down;
  const swing = walking ? [1, 1, 0, -1, -1, 0][wf] : 0;
  const sh = [X + 8 + lean, Y + BODY.torsoY + 3];
  if (side && pose.far) { const [e, h] = pose.far; arm(x, who, [sh[0] - 1, sh[1]], [sh[0] - 1 + e[0] - swing, sh[1] + e[1]], [sh[0] - 1 + h[0] - swing * 2, sh[1] + h[1]], { far: true }); }
  blit(x, `${who}_torso_${view}`, X + lean, Y + BODY.torsoY);
  if (side && o.holding && o.holdBehind) { const s = SPR.get(o.holding); const [e, h] = pose.near; blit(x, o.holding, sh[0] + h[0] - (s.w >> 1), sh[1] + h[1] - s.h + 1); }
  const face = o.face && o.face !== 'auto' ? o.face : (blink ? 'blink' : '');
  // the head can turn on its own: headView 'side' on a front/back body, headFlip to look the other way
  const hv = o.headView || (o.head === 'turn' && !side ? 'side' : view), hflip = !!(o.headFlip || (o.head === 'turn' && o.turnLeft));
  const hx = X + lean + (o.headLean || 0), hy = Y - breathe - 1 + (o.nod ? 1 : 0) + (o.slump || 0);
  if (hflip) blit(x, `${who}_head_${hv}${face && hv !== 'back' ? '_' + face : ''}`, hx, hy, { flip: true });
  else blit(x, `${who}_head_${hv}${face && hv !== 'back' ? '_' + face : ''}`, hx, hy);
  if (side) {
    const [e, h] = pose.near;
    arm(x, who, sh, [sh[0] + e[0] + swing, sh[1] + e[1]], [sh[0] + h[0] + swing * 2, sh[1] + h[1]], { open: pose.open });
    if (o.holding && !o.holdBehind) { const s = SPR.get(o.holding); blit(x, o.holding, sh[0] + h[0] + swing * 2 - (s.w >> 1) + 1, sh[1] + h[1] - s.h + 2); }
  } else {
    const fp = (o.pose && typeof o.pose === 'object' && o.pose.front) ? o.pose.front : FPOSES[o.pose] || FPOSES.down, sy = Y + BODY.torsoY + 3, ls = [X + 3 + lean, sy], rs = [X + 12 + lean, sy];
    arm(x, who, ls, [ls[0] + fp[0][0][0] - swing, ls[1] + fp[0][0][1]], [ls[0] + fp[0][1][0] - swing, ls[1] + fp[0][1][1]]);
    arm(x, who, rs, [rs[0] + fp[1][0][0] + swing, rs[1] + fp[1][0][1]], [rs[0] + fp[1][1][0] + swing, rs[1] + fp[1][1][1]]);
    if (o.holding) { const s = SPR.get(o.holding); blit(x, o.holding, X + 8 - (s.w >> 1) + lean, sy + 11 - s.h); }
  }
  x.restore();
}
function shadowAt(x, fx, fy, w = 10, a = 0.22) { x.save(); x.globalAlpha = a; ellipse(x, fx, fy, w, 1, P.ink); x.globalAlpha = a * 0.6; ellipse(x, fx, fy, w - 4, 1, P.ink); x.restore(); }

// ------------------------------------------------------------- props (small, for full-figure shots)
function initProps() {
  const K = { k: P.ink, w: P.white, c: P.cream0, C: P.cream1, n: P.cream2, g: P.glass, G: P.glass2, b: P.wood2, B: P.wood1, r: P.red0, R: P.red1, s: P.slate3, S: P.slate4, o: P.olive1, h: P.honey1, y: P.honey0, t: P.brick1 };
  sprite('cup', ['.kkkkk..', 'kwwwwwk.', 'kwccwwkk', 'kwwwwwk.', '.kkkkk..'], K);
  sprite('cup2', ['.kkkkk..', 'khhhhhk.', 'khyhhhkk', 'khhhhhk.', '.kkkkk..'], K);           // his: the honey-glazed one
  sprite('photo', ['kkkkkkkk', 'kwwwwwwk', 'kwhhbhwk', 'kwbhhhwk', 'kwwwwwwk', 'kkkkkkkk'], K);
  sprite('key', ['.kk...', 'khhkkk', 'khhkhk', '.kk...'], K);
  sprite('coat', ['..kkkk..', '.koooook', 'kooookok', 'koookook', 'kooo.ook', 'kooo.ook', 'kooo.ook', 'kkkk.kkk'], K);
  sprite('menu', ['kkkkkkk', 'kcccrck', 'kcnncck', 'kcnncck', 'kcncnck', 'kkkkkkk'], K);
  sprite('napkin', ['kkkkkk', 'krrrrk', 'krRrrk', 'kkkkkk'], K);
  sprite('bowl', ['kkkkkkkk', 'kwwwwwwk', '.kwwwwk.', '..kkkk..'], K);
  sprite('bag', ['..kkkk..', '.kb..bk.', 'kkkkkkkk', 'kbbbbbbk', 'kbBbbbbk', 'kbbbbbbk', 'kkkkkkkk'], K);
}
