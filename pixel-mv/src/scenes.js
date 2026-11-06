'use strict';
/*
 * Locations, drawn on the 270×480 logical canvas from a small state object —
 * never from previous frames. R = { x, y, w, h } is the screen region; scale is
 * the characters' (28 px ≈ 1.65 m, so 1 m ≈ 17 px): doors ≈ 38 px, desks ≈ 12 px
 * high, bench seats ≈ 8 px, a train car ≈ 60 px tall.
 *
 *   room(x, who, R, st, t)      阿屿's room (cold night) / 小晴's room (warm), mirrored; 270×186
 *   street(x, R, st, t)         side view: shop, flats, vending machine, bus stop, lamp, rain, traffic
 *   platform(x, R, st, t)       station: canopy, sign, benches, a train that brakes and departs
 *   pier(x, R, st, t)           the ferry pier at night
 *   trainInterior(x, R, st, t)  bench seats, windows, parallax landscape, moving light
 *   worldMap(x, R, st, t)       the two cities, the strait, the mountain line, fog
 *   hand(...)                   close-ups: same pixel size, more pixels — never upscaled
 */
const WORLD = {
  // Fictional settings; see docs/03-story-bible.md. All on-screen numbers follow these.
  A: { name: '阿屿', city: '雾港', tz: 8 },
  B: { name: '小晴', city: '晴川', tz: 3 },
  km: 2180,
};
// Screen layout: HUD band, picture, lyric band.
const HUD_H = 40;
const PIC = { x: 0, y: 40, w: 270, h: 376 };
const TOPR = { x: 0, y: 40, w: 270, h: 186 }, BOTR = { x: 0, y: 230, w: 270, h: 186 };

const pad2 = n => String(n).padStart(2, '0');
function clockText(minutes) { const m = mod(Math.round(minutes), 1440); return `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`; }
function clip(x, R, fn) { x.save(); x.beginPath(); x.rect(R.x, R.y, R.w, R.h); x.clip(); fn(); x.restore(); }
function poly(x, pts, col) { x.fillStyle = col; x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(ri(p[0]), ri(p[1])) : x.moveTo(ri(p[0]), ri(p[1]))); x.closePath(); x.fill(); }
// A rect with a 1-px ink outline and an optional top highlight.
function block(x, px, py, w, h, fill, hi) { rect(x, px, py, w, h, P.ink); rect(x, px + 1, py + 1, w - 2, h - 2, fill); if (hi) hline(x, px + 1, px + w - 2, py + 1, hi); }

// ------------------------------------------------------------- sky
const SKY = {
  night: [P.night0, P.night1, P.night1, P.night2],
  dusk: [P.dusk0, P.dusk1, P.dusk2, P.dusk3, P.dusk4],
  dawn: [P.night2, P.night3, '#8a6a8c', P.dusk3],
  day: ['#5f86c4', '#7aa0d8', P.blue3, '#a9c6ec', '#cfe0f0'],
  rain: ['#262443', '#2f2c50', '#3a3760', '#45426c'],
};
function skyBands(x, px, py, w, h, kind) {
  const c = SKY[kind] || SKY.night, bh = Math.ceil(h / c.length);
  c.forEach((col, i) => rect(x, px, py + i * bh, w, bh + 1, col));
}
function stars(x, px, py, w, h, t, n = 24, seed = 3) {
  for (let k = 0; k < n; k++) {
    const sx = px + hash(k * 7 + seed) * w, sy = py + hash(k * 11 + seed) * h, tw = mod(t * 0.5 + hash(k + seed), 1);
    pset(x, sx, sy, tw < 0.85 ? P.night5 : P.cream0);
    if (k % 6 === 0 && tw > 0.5) { pset(x, sx - 1, sy, P.night4); pset(x, sx + 1, sy, P.night4); }
  }
}
function cloud(x, cx, cy, w, col, hi) {
  ellipse(x, cx, cy, ri(w / 2), 4, col); ellipse(x, cx - ri(w / 5), cy - 3, ri(w / 4), 4, col); ellipse(x, cx + ri(w / 6), cy - 4, ri(w / 5), 4, col);
  if (hi) hline(x, cx - ri(w / 4), cx + ri(w / 6), cy - 7, hi);
}
// City seen through a window: skyline with lit windows that switch now and then.
function windowView(x, px, py, w, h, st, t) {
  const kind = st.view || 'night';
  skyBands(x, px, py, w, h, st.rain && kind === 'night' ? 'rain' : kind);
  if (kind === 'night' && !st.rain) { stars(x, px, py, w, h * 0.4, t, 8, 9); disc(x, px + w * 0.78, py + 7, 3, P.cream1); pset(x, px + w * 0.78 + 1, py + 6, P.cream0); }
  if (kind === 'dusk') { ellipse(x, px + w * 0.3, py + h * 0.72, 6, 6, P.amber2); hline(x, px, px + w, py + ri(h * 0.55), P.dusk4); }
  if (kind === 'day' || kind === 'dawn') { ellipse(x, px + w * 0.72, py + h * 0.25, 4, 4, P.amber3); cloud(x, px + w * 0.3, py + 9, 18, P.white); }
  const r = rng(st.seed || 9), dark = kind === 'night' ? P.night0 : kind === 'dawn' ? P.night1 : kind === 'dusk' ? P.dusk0 : '#6f7fa6';
  let bx = px - 2;
  while (bx < px + w) {
    const bw = 6 + Math.floor(r() * 8), bh = 6 + Math.floor(r() * h * 0.45);
    rect(x, bx, py + h - bh, bw, bh, dark);
    if (r() < 0.3) vline(x, bx + 2, py + h - bh - 3, py + h - bh, dark);
    for (let wy = py + h - bh + 2; wy < py + h - 1; wy += 3) for (let wx = bx + 1; wx < bx + bw - 1; wx += 2) {
      const on = hash3(wx, wy, st.seed || 9) < (kind === 'day' ? 0.03 : 0.38), flick = hash3(wx, wy, Math.floor(t * 0.4)) < 0.02;
      if (on !== flick) pset(x, wx, wy, kind === 'dusk' ? P.amber2 : P.amber1);
    }
    bx += bw + 1;
  }
  if (st.rain > 0) for (let k = 0; k < 22 * st.rain; k++) {
    const rx = px + mod(hash(k) * w + t * 10, w), ry = py + mod(hash(k + 99) * h + t * 110, h);
    vline(x, ri(rx), ri(ry), ri(ry) + 2, P.rain);
  }
}
// Rain on the glass itself: drops cling, then slide down with a short trail.
function glassRain(x, px, py, w, h, t, amount) {
  for (let k = 0; k < 12 * amount; k++) {
    const speed = 3 + hash(k + 5) * 12, dx = px + 2 + hash(k + 1) * (w - 4), dy = py + mod(hash(k + 2) * h + t * speed, h);
    pset(x, dx, dy, P.screen); pset(x, dx, dy + 1, P.glass);
    if (speed > 9) { pset(x, dx, dy - 1, P.night4); pset(x, dx, dy - 2, P.night4); }
  }
}

// ------------------------------------------------------------- small furniture
function planks(x, px, py, w, h, base, alt, seam, seed) {
  rect(x, px, py, w, h, base);
  for (let y = 0, row = 0; y < h; y += 6, row++) {
    let sx = -Math.floor(hash2(row, seed) * 40);
    while (sx < w) {
      const len = 30 + Math.floor(hash3(row, sx, seed) * 28);
      if (hash3(sx, row, seed + 1) < 0.35) rect(x, px + Math.max(0, sx), py + y + 1, Math.min(len, w - Math.max(0, sx)), 5, alt);
      vline(x, px + sx + len, py + y + 1, py + y + 5, seam);
      sx += len + 1;
    }
    hline(x, px, px + w - 1, py + y, seam);
  }
}
function rug(x, px, py, w, h, a, b, c) {
  rect(x, px, py, w, h, P.ink); rect(x, px + 1, py + 1, w - 2, h - 2, a); rect(x, px + 4, py + 3, w - 8, h - 6, b);
  for (let k = 6; k < w - 6; k += 4) { pset(x, px + k, py + 1, c); pset(x, px + k, py + h - 2, c); }
  const cx = ri(px + w / 2), cy = ri(py + h / 2);
  for (let d = 0; d < 6; d++) { pset(x, cx - d * 2, cy - 5 + d, c); pset(x, cx + d * 2, cy - 5 + d, c); pset(x, cx - d * 2, cy + 5 - d, c); pset(x, cx + d * 2, cy + 5 - d, c); }
  for (let k = 0; k < w; k += 3) { pset(x, px + k, py - 1, a); pset(x, px + k + 1, py + h, a); }
}
function steam(x, px, py, t, strength = 1) {
  if (strength <= 0.02) return;
  for (let k = 0; k < 3; k++) {
    const ph = mod(t * 0.6 + k / 3, 1);
    if (ph > strength) continue;
    pset(x, px + ri(Math.sin((t + k) * 2.1) * 1.2), py - ri(ph * 10), ph < 0.5 ? P.stone4 : P.stone3);
  }
}
function analogClock(x, cx, cy, r, minutes, face) {
  ellipse(x, cx, cy, r + 1, r + 1, P.ink); ellipse(x, cx, cy, r, r, face);
  for (let k = 0; k < 12; k += 3) { const a = k / 12 * TAU; pset(x, cx + Math.sin(a) * (r - 1), cy - Math.cos(a) * (r - 1), P.stone2); }
  const mm = mod(minutes, 1440), ha = (mm / 60 % 12) / 12 * TAU, ma = (mm % 60) / 60 * TAU;
  line(x, cx, cy, cx + Math.sin(ha) * (r - 3), cy - Math.cos(ha) * (r - 3), P.ink);
  line(x, cx, cy, cx + Math.sin(ma) * (r - 1.5), cy - Math.cos(ma) * (r - 1.5), P.ink);
  pset(x, cx, cy, P.coral1);
}
function deskLamp(x, px, py, on) { // px,py = base left; ~14 px tall
  rect(x, px, py - 2, 8, 2, P.ink); rect(x, px + 1, py - 3, 6, 1, P.stone2);
  line(x, px + 4, py - 3, px + 2, py - 9, P.stone0); line(x, px + 2, py - 9, px + 6, py - 13, P.stone0);
  poly(x, [[px + 3, py - 15], [px + 11, py - 16], [px + 13, py - 10], [px + 5, py - 9]], P.ink);
  poly(x, [[px + 4, py - 14], [px + 10, py - 15], [px + 12, py - 11], [px + 6, py - 10]], on ? P.amber1 : P.stone2);
  if (on) hline(x, px + 7, px + 12, py - 10, P.amber3);
}
function radioSmall(x, px, py) { // base at py
  block(x, px, py - 9, 16, 9, P.stone1); rect(x, px + 2, py - 7, 6, 5, P.stone0);
  for (let k = 0; k < 3; k++) for (let j = 0; j < 2; j++) pset(x, px + 3 + k * 2, py - 6 + j * 2, P.stone2);
  rect(x, px + 9, py - 7, 5, 3, P.night1); pset(x, px + 10, py - 6, P.cream1); pset(x, px + 13, py - 3, P.green2);
  line(x, px + 13, py - 9, px + 17, py - 14, P.stone3);
}
function mugSmall(x, px, py, col, t, heat) { // base at py
  block(x, px, py - 6, 6, 6, col); pset(x, px + 1, py - 5, P.white);
  pset(x, px + 6, py - 4, P.ink); pset(x, px + 6, py - 3, P.ink); steam(x, px + 3, py - 7, t, heat);
}
function phoneFlat(x, px, py, lit) { rect(x, px, py - 2, 7, 3, P.ink); rect(x, px + 1, py - 2, 5, 2, lit ? P.screen : P.night2); if (lit) pset(x, px + 1, py - 2, P.white); }
function bookFlat(x, px, py, col) { rect(x, px, py - 3, 12, 4, P.ink); rect(x, px + 1, py - 3, 10, 2, col); hline(x, px + 1, px + 10, py - 1, P.cream0); }
function cat(x, px, py, t) { // curled up asleep; breathes
  const b = Math.floor(t * 0.8) % 2;
  ellipse(x, px, py - 3 - b, 8, 4 + b, P.ink); ellipse(x, px, py - 3 - b, 7, 3 + b, P.stone3);
  ellipse(x, px - 6, py - 5, 4, 3, P.ink); ellipse(x, px - 6, py - 5, 3, 2, P.stone3);
  pset(x, px - 9, py - 8, P.ink); pset(x, px - 4, py - 8, P.ink); hline(x, px - 7, px - 6, py - 5, P.ink);
  hline(x, px - 3, px + 7, py, P.stone2); pset(x, px + 8, py - 2, P.ink);
}
function plantPot(x, px, py, t) { // floor plant, base at py
  block(x, px, py - 9, 11, 9, P.brick2, P.brick3);
  const sw = Math.floor(t * 0.7) % 2;
  for (const [dx, h, c] of [[2, 16, P.green0], [5, 22, P.green1], [8, 15, P.green0], [4, 12, P.green2]]) {
    vline(x, px + dx, py - 9 - h, py - 9, c);
    ellipse(x, px + dx + (dx < 5 ? -2 : 2) + (dx === 5 ? sw : 0), py - 9 - h + 2, 3, 2, c);
  }
}

// ------------------------------------------------------------- rooms
// Layout given for A (window left); B's room is the mirror image (x → 270 − x − w).
// Wall 0–60, floor below. Things against the wall stand on the line y ≈ 60–70.
// st: { view, rain, lamp (0..1), clock, mugHeat, phoneLit, phoneHeld, door (0..1), person, inBed, night }
const ROOM = {
  win: { x: 18, y: 10, w: 56, h: 34 }, desk: { x: 90, w: 78 }, chair: 128, shelf: { x: 176, w: 38 }, door: { x: 222, w: 38 },
  bed: { x: 150, y: 112, w: 112, h: 40 }, rug: { x: 18, y: 94, w: 112, h: 44 },
  spots: { window: [46, 78], desk: [128, 79], door: [241, 70], centre: [100, 120], bedside: [150, 150] },
};
function roomX(who, px, w = 0) { return who === 'A' ? px : LW - px - w; }
function room(x, who, R, st, t) {
  const A = who === 'A', W = LW;
  const X = (px, w = 0) => R.x + roomX(who, px, w), Y = py => R.y + py;
  const cozy = A ? { wall: P.night2, wall2: P.night3, trim: P.wood1, floor: P.wood1, floorAlt: '#523422', seam: P.wood0 }
    : { wall: P.dusk1, wall2: '#7a4656', trim: P.wood2, floor: P.wood3, floorAlt: '#94633a', seam: P.wood2 };
  clip(x, R, () => {
    // wall: A has vertical paper stripes, B a small diamond print
    rect(x, R.x, R.y, W, 60, cozy.wall);
    if (A) for (let k = 3; k < W; k += 8) vline(x, R.x + k, R.y + 3, R.y + 55, cozy.wall2);
    else for (let k = 6; k < W; k += 14) for (let y = 8; y < 54; y += 12) { const o = (Math.floor(k / 14) % 2) * 6; pset(x, R.x + k, R.y + y + o, cozy.wall2); pset(x, R.x + k - 1, R.y + y + o + 1, cozy.wall2); pset(x, R.x + k + 1, R.y + y + o + 1, cozy.wall2); pset(x, R.x + k, R.y + y + o + 2, cozy.wall2); }
    rect(x, R.x, R.y, W, 2, P.ink); rect(x, R.x, R.y + 2, W, 1, cozy.trim);
    rect(x, R.x, R.y + 56, W, 4, cozy.trim); hline(x, R.x, R.x + W, R.y + 56, A ? P.wood2 : P.wood3); hline(x, R.x, R.x + W, R.y + 60, P.ink);
    planks(x, R.x, R.y + 61, W, R.h - 61, cozy.floor, cozy.floorAlt, cozy.seam, A ? 11 : 12);
    // window with curtains
    const w = ROOM.win, wx = X(w.x, w.w), wy = Y(w.y);
    rect(x, wx - 3, wy - 3, w.w + 6, w.h + 6, P.ink); rect(x, wx - 2, wy - 2, w.w + 4, w.h + 4, A ? P.wood2 : P.cream1);
    clip(x, { x: wx, y: wy, w: w.w, h: w.h }, () => { windowView(x, wx, wy, w.w, w.h, st, t); if (st.rain) glassRain(x, wx, wy, w.w, w.h, t, st.rain); });
    vline(x, wx + w.w / 2, wy, wy + w.h - 1, A ? P.wood2 : P.cream1); hline(x, wx, wx + w.w - 1, wy + 16, A ? P.wood2 : P.cream1);
    pset(x, wx + 2, wy + 2, P.white); pset(x, wx + 3, wy + 3, P.white);
    rect(x, wx - 5, wy + w.h + 2, w.w + 10, 3, A ? P.wood2 : P.cream1); hline(x, wx - 5, wx + w.w + 4, wy + w.h + 5, P.ink);
    const cur = A ? [P.night4, P.night3, P.amber0] : [P.coral1, P.coral2, P.cream1], sway = st.draft ? Math.floor(t * 1.3) % 2 : 0;
    for (const cxo of [-11, w.w + 2]) {
      const cx = wx + cxo;
      rect(x, cx, wy - 6, 9, w.h + 14, P.ink); rect(x, cx + 1, wy - 6, 7, w.h + 13, cur[0]);
      for (let k = 0; k < 2; k++) vline(x, cx + 3 + k * 3 + sway, wy - 5, wy + w.h + 6, cur[1]);
      rect(x, cx + 1, wy + 20, 7, 2, cur[2]);
    }
    rect(x, wx - 14, wy - 8, w.w + 28, 2, P.stone1); hline(x, wx - 14, wx + w.w + 13, wy - 6, P.ink);
    if (!A) for (let k = 0; k < 11; k++) { const lx = wx - 10 + k * 7, ly = wy - 10 + ri(Math.sin(k * 0.9) * 1.5); pset(x, lx, ly, mod(t * 1.4 + k * 0.37, 1) < 0.8 ? P.amber2 : P.amber0); pset(x, lx, ly - 1, P.ink); }
    // wall decor: clock, calendar, poster
    analogClock(x, X(100) + (A ? 0 : 0), Y(18), 6, st.clock ?? 0, A ? P.cream1 : P.cream0);
    const cal = X(114, 14); block(x, cal, Y(10), 14, 16, P.white); rect(x, cal + 1, Y(11), 12, 4, P.coral1);
    for (let k = 0; k < 9; k++) pset(x, cal + 3 + (k % 3) * 4, Y(17 + Math.floor(k / 3) * 3), k === 7 ? P.coral1 : P.stone3);
    const pst = X(136, 26); block(x, pst, Y(7), 26, 32, A ? P.blue2 : P.cream0);
    if (A) { ellipse(x, pst + 13, Y(18), 4, 4, P.amber1); poly(x, [[pst + 1, Y(38)], [pst + 9, Y(25)], [pst + 15, Y(31)], [pst + 19, Y(27)], [pst + 25, Y(38)]], P.night0); }
    else { for (let k = 0; k < 4; k++) rect(x, pst + 4 + k * 5, Y(14 + k * 2), 3, 18 - k * 2, [P.coral0, P.amber1, P.green1, P.blue0][k]); }
    // bookshelf
    const sh = X(ROOM.shelf.x, ROOM.shelf.w); block(x, sh, Y(6), ROOM.shelf.w, 56, A ? P.wood1 : P.wood2);
    const r = rng(A ? 21 : 22);
    for (let s = 0; s < 3; s++) {
      const sy = Y(8 + s * 17);
      rect(x, sh + 2, sy + 14, ROOM.shelf.w - 4, 2, A ? P.wood0 : P.wood1);
      let bx = sh + 3;
      while (bx < sh + ROOM.shelf.w - 5) {
        if (r() < 0.12) { ellipse(x, bx + 3, sy + 11, 2, 2, s === 1 ? P.cream0 : P.green1); bx += 7; continue; }
        const bw = 2 + Math.floor(r() * 2), bh = 8 + Math.floor(r() * 5);
        const cols = A ? [P.night4, P.blue1, P.coral2, P.stone2, P.green0, P.wood3] : [P.coral1, P.blue1, P.amber0, P.green1, P.cream2, P.brick2];
        rect(x, bx, sy + 14 - bh, bw, bh, cols[Math.floor(r() * cols.length)]); hline(x, bx, bx + bw - 1, sy + 14 - bh, P.ink);
        bx += bw;
      }
    }
    // door (opens inward, so it swings into darkness)
    const dr = X(ROOM.door.x, ROOM.door.w), open = st.door || 0;
    block(x, dr - 2, Y(4), ROOM.door.w + 4, 57, A ? P.wood0 : P.wood1);
    rect(x, dr, Y(6), ROOM.door.w, 54, P.ink);
    if (open < 1) {
      const dw = ri(ROOM.door.w * (1 - open)), dx = A ? dr + ROOM.door.w - dw : dr;
      rect(x, dx, Y(6), dw, 54, A ? P.wood2 : P.wood3);
      if (dw > 8) { rect(x, dx + 4, Y(10), dw - 8, 18, A ? P.wood1 : P.wood2); rect(x, dx + 4, Y(32), dw - 8, 22, A ? P.wood1 : P.wood2); pset(x, A ? dx + 4 : dx + dw - 5, Y(36), P.amber2); }
    }
    if (open > 0) glow(x, dr + ROOM.door.w / 2, Y(64), 18, 4, A ? P.amber1 : P.amber2, 0.5 * open);
    // plant in the corner
    plantPot(x, X(2, 11), Y(64), t);
    // desk + things on it
    const dk = X(ROOM.desk.x, ROOM.desk.w), dw = ROOM.desk.w;
    rect(x, dk, Y(44), dw, 10, P.ink); rect(x, dk + 1, Y(45), dw - 2, 8, A ? P.wood3 : P.wood4); hline(x, dk + 1, dk + dw - 2, Y(45), A ? P.wood4 : P.cream2);
    rect(x, dk, Y(54), dw, 13, P.ink); rect(x, dk + 1, Y(54), dw - 2, 12, A ? P.wood2 : P.wood3);
    const drw = A ? dk + dw - 30 : dk + 4; block(x, drw, Y(56), 26, 8, A ? P.wood2 : P.wood3); hline(x, drw + 10, drw + 15, Y(60), P.amber0);
    rect(x, dk + 2, Y(67), 3, 4, P.ink); rect(x, dk + dw - 5, Y(67), 3, 4, P.ink);
    const on = (st.lamp ?? 1), lampX = X(152, 14), base = Y(51);
    radioSmall(x, X(94, 16), base); bookFlat(x, X(113, 12), base, A ? P.blue1 : P.coral1);
    if (!st.phoneHeld) phoneFlat(x, X(140, 7), base, st.phoneLit);
    mugSmall(x, X(128, 7), base, A ? P.blue0 : P.coral0, t, st.mugHeat ?? 0.8);
    if (!A) { block(x, X(104, 8), base - 10, 8, 10, P.cream0); rect(x, X(104, 8) + 2, base - 8, 4, 5, P.dusk3); }
    deskLamp(x, lampX, base, on > 0.5);
    // bed along the floor, head at the far side, with the quilt
    const b = ROOM.bed, bx = X(b.x, b.w), by = Y(b.y);
    rect(x, bx, by, b.w, b.h + 8, P.ink); rect(x, bx + 1, by + b.h, b.w - 2, 7, A ? P.wood1 : P.wood2);
    rect(x, bx + 1, by + 1, b.w - 2, b.h - 1, P.white);
    const headX = A ? bx + b.w - 10 : bx + 1;
    rect(x, headX - (A ? 0 : 0), by - 14, 9, b.h + 21, P.ink); rect(x, headX + 1, by - 13, 7, b.h + 19, A ? P.wood2 : P.wood3);
    const pil = A ? bx + b.w - 34 : bx + 12; block(x, pil, by + 4, 22, 14, P.cream0); hline(x, pil + 2, pil + 19, by + 15, P.cream2);
    const qx = A ? bx + 1 : bx + 36, qw = b.w - 37;
    rect(x, qx, by + 1, qw, b.h - 1, A ? P.blue1 : P.coral1); rect(x, qx, by + b.h - 6, qw, 5, A ? P.blue2 : P.coral2);
    for (let k = 1; k < 4; k++) vline(x, qx + k * qw / 4, by + 2, by + b.h - 7, A ? P.blue2 : P.coral2);
    vline(x, A ? qx + qw - 1 : qx, by + 1, by + b.h - 1, P.cream0);
    if (st.inBed) { // a head on the pillow, the quilt pulled up; arms holding the phone
      const hx = A ? pil + 4 : pil + 4;
      blit(x, `${who}_head_front${st.inBed.face ? '_' + st.inBed.face : ''}`, hx, by + 2);
      rect(x, A ? qx + qw - 6 : qx, by + 1, 6, b.h - 1, A ? P.blue1 : P.coral1);
      if (st.inBed.phone) { const px = A ? hx - 4 : hx + 14; rect(x, px - 1, by + 4, 6, 9, P.ink); rect(x, px, by + 5, 4, 7, P.screen); rect(x, px + (A ? 4 : -3), by + 10, 4, 3, P.skin0); glow(x, px + 2, by + 8, 14, 10, P.screen, 0.35); }
    } else if (!A && st.cat !== false) cat(x, qx + 30, by + 22, t);
    // rug, slippers, backpack
    const rg = ROOM.rug; rug(x, X(rg.x, rg.w), Y(rg.y), rg.w, rg.h, A ? P.night3 : P.coral2, A ? P.night2 : P.dusk1, A ? P.night5 : P.dusk3);
    for (const k of [0, 6]) { rect(x, X(136 + k, 5), Y(158), 5, 7, P.ink); rect(x, X(136 + k, 5) + 1, Y(159), 3, 5, A ? P.stone3 : P.coral3); }
    if (A) { const bg = X(170, 12); block(x, bg, Y(62), 12, 13, P.green0); rect(x, bg + 3, Y(66), 6, 4, P.green1); }
    // grade, light from the window, then the lamp
    if (A) shade(x, R.x, R.y, W, R.h, P.night0, st.view === 'day' ? 0 : 0.24);
    else shade(x, R.x, R.y, W, R.h, P.dusk0, st.view === 'night' ? 0.26 : 0.06);
    if (st.view === 'night' && on < 0.5) { x.save(); x.globalAlpha = 0.14; poly(x, [[wx, Y(66)], [wx + w.w, Y(66)], [wx + w.w + 30, Y(150)], [wx + 30, Y(150)]], P.night5); x.restore(); }
    if (st.view === 'dusk' || st.view === 'day') { x.save(); x.globalAlpha = st.view === 'day' ? 0.2 : 0.16; poly(x, [[wx, Y(66)], [wx + w.w, Y(66)], [wx + w.w - 26, Y(150)], [wx - 26, Y(150)]], st.view === 'day' ? P.amber3 : P.dusk4); x.restore(); }
    if (on > 0) { glow(x, lampX + 9, Y(56), 52, 22, P.amber2, 0.5 * on); glow(x, lampX + 9, Y(42), 16, 10, P.amber3, 0.4 * on); }
    // the person (seated at the desk by default)
    const p = st.person;
    const chairX = X(ROOM.chair);
    if (p) {
      const px = p.x !== undefined ? X(p.x) : chairX, py = p.y !== undefined ? Y(p.y) : Y(ROOM.spots.desk[1]);
      if (!p.sit) charShadow(x, px, py);
      drawChar(x, who, px, py, { dir: p.dir || 'back', t, pose: p.pose, holding: p.holding, lookUp: p.lookUp, lookDown: p.lookDown, walk: p.walk, sit: p.sit, face: p.face, wind: p.wind, seed: A ? 0 : 1 });
    }
    const seated = p && p.sit && p.x === undefined;
    // chair back in front of a seated person; otherwise the empty chair
    rect(x, chairX - 7, Y(68), 14, 3, P.ink); rect(x, chairX - 6, Y(69), 12, 1, A ? P.wood2 : P.wood3);
    rect(x, chairX - 7, Y(71), 2, seated ? 8 : 10, P.ink); rect(x, chairX + 5, Y(71), 2, seated ? 8 : 10, P.ink);
    if (!seated) { rect(x, chairX - 7, Y(76), 14, 3, P.ink); rect(x, chairX - 6, Y(76), 12, 2, A ? P.wood2 : P.wood3); if (A && st.jacket !== false) { rect(x, chairX - 6, Y(67), 12, 7, P.blue1); hline(x, chairX - 6, chairX + 5, Y(67), P.ink); } }
  });
}

// ------------------------------------------------------------- street (side view)
// st: { time: 'night'|'dusk'|'day', rain, wet, camX, shopOpen, cars:[{x, kind, col}], walkers:[{x, dir, phase, col}] }
const STREET_BLOCK = 300;
function streetGround(R) { return R.y + R.h - 46; }
function street(x, R, st, t) {
  const night = st.time === 'night', dusk = st.time === 'dusk';
  clip(x, R, () => {
    const ox = R.x, cam = st.camX || 0, ground = streetGround(R);
    skyBands(x, ox, R.y, R.w, ground - R.y, st.rain && night ? 'rain' : night ? 'night' : dusk ? 'dusk' : 'day');
    if (night && !st.rain) stars(x, ox, R.y, R.w, (ground - R.y) * 0.4, t, 30);
    if (!night) for (let k = 0; k < 4; k++) cloud(x, ox + mod(k * 90 - cam * 0.1 + t * 2, R.w + 60) - 30, R.y + 14 + k * 9, 30, dusk ? P.dusk3 : P.white, dusk ? P.dusk4 : null);
    // far skyline (parallax 0.3)
    for (let k = -1; k < 14; k++) {
      const i = k + Math.floor(cam * 0.3 / 30), px = ox + i * 30 - ri(cam * 0.3), h = 40 + hash(i * 3) * 60, w = 26;
      rect(x, px, ground - 120 - h, w, h + 120, night ? P.night1 : dusk ? P.dusk0 : '#8f9cc0');
      for (let wy = 5; wy < h + 60; wy += 5) for (let wx = 3; wx < w - 3; wx += 4) if (hash3(i, wx, wy) < (night ? 0.3 : 0.06)) pset(x, px + wx, ground - 120 - h + wy, night ? P.amber1 : P.amber2);
    }
    for (let b = Math.floor(cam / STREET_BLOCK) - 1; b <= Math.floor((cam + R.w) / STREET_BLOCK) + 1; b++) streetBlock(x, ox + ri(b * STREET_BLOCK - cam), ground, b, st, t, R);
    // pavement, kerb, road
    rect(x, ox, ground, R.w, 14, P.stone2); hline(x, ox, ox + R.w, ground, P.stone3);
    for (let k = -mod(ri(cam), 16); k < R.w; k += 16) vline(x, ox + k, ground + 1, ground + 13, P.stone1);
    rect(x, ox, ground + 14, R.w, 3, P.stone3); hline(x, ox, ox + R.w, ground + 17, P.ink);
    rect(x, ox, ground + 18, R.w, R.y + R.h - ground - 18, night ? P.night1 : dusk ? P.dusk0 : P.stone1);
    for (let k = -mod(ri(cam), 30); k < R.w; k += 30) rect(x, ox + k, ground + 31, 14, 2, P.cream2);
    if (st.crosswalk !== undefined) { const cx = ox + ri(st.crosswalk - cam); for (let k = 0; k < 6; k++) rect(x, cx + k * 8, ground + 18, 5, 28, P.cream1); }
    // wet road: reflections and puddles with ripples
    if (st.rain > 0 || st.wet) {
      for (let b = Math.floor(cam / STREET_BLOCK) - 1; b <= Math.floor((cam + R.w) / STREET_BLOCK) + 1; b++) {
        const lx = ox + ri(b * STREET_BLOCK - cam) + 284;
        if (night || dusk) { x.save(); x.globalAlpha = 0.45; for (let y = 0; y < 22; y += 2) rect(x, lx - 2 + ri(Math.sin(t * 3 + y) * 1), ground + 19 + y, 5, 1, P.amber2); x.restore(); }
        x.save(); x.globalAlpha = 0.2; rect(x, ox + ri(b * STREET_BLOCK - cam) + 16, ground + 19, 70, 8, P.amber1); x.restore();
      }
      for (let k = 0; k < 5; k++) {
        const pxp = ox + mod(hash(k) * 600 - cam, 600) - 60, pw = 14 + hash(k + 3) * 16;
        rect(x, pxp, ground + 6, pw, 2, night ? P.night3 : P.glass); pset(x, pxp + 2, ground + 6, P.white);
        if (st.rain > 0) { const ph = mod(t * 1.3 + hash(k + 7), 1); const rr = ri(1 + ph * 5); if (ph < 0.8) { pset(x, pxp + pw / 2 - rr, ground + 6, P.rain); pset(x, pxp + pw / 2 + rr, ground + 6, P.rain); } }
      }
    }
    for (const wk of [...(st.walkers || [])].sort((a, b) => (a.dy || 0) - (b.dy || 0))) passerby(x, ox + ri(wk.x - cam), ground + 10 + (wk.dy || 0), wk, t, night);
    if (st.under) st.under(); // people on the pavement: behind the traffic
    for (const c of [...(st.cars || [])].sort((a, b) => (a.dir || 1) - (b.dir || 1))) car(x, ox + ri(c.x - cam), ground + ((c.dir || 1) < 0 ? 34 : 44), c, t);
    if (st.rain > 0) rainLayer(x, R, t, st.rain, ground + 14);
  });
}
function streetBlock(x, bx, ground, b, st, t, R) {
  const night = st.time === 'night', dusk = st.time === 'dusk', top = R.y;
  // brick building with flats upstairs
  const floors = clamp(Math.floor((ground - top - 70) / 44), 2, 3);
  const wallTop = ground - 56 - floors * 44;
  const fac = [[P.brick1, P.brick0], ['#6a5a4e', '#574a40'], ['#3f4e6a', '#34415a']][Math.floor(hash(b * 13 + 5) * 3)];
  rect(x, bx, wallTop, STREET_BLOCK, ground - wallTop, fac[0]);
  for (let y = 0; y < ground - wallTop; y += 4) { hline(x, bx, bx + STREET_BLOCK, wallTop + y, fac[1]); for (let k = (y / 4) % 2 ? 0 : 4; k < STREET_BLOCK; k += 8) pset(x, bx + k, wallTop + y + 2, fac[1]); }
  // rooftop clutter: water tank, antenna, a sign
  rect(x, bx + 40, wallTop - 18, 18, 14, P.stone0); rect(x, bx + 38, wallTop - 20, 22, 3, P.stone1); vline(x, bx + 200, wallTop - 30, wallTop - 4, P.stone0); hline(x, bx + 194, bx + 206, wallTop - 26, P.stone0);
  rect(x, bx - 1, wallTop - 4, STREET_BLOCK + 2, 4, P.stone1); hline(x, bx, bx + STREET_BLOCK, wallTop - 4, P.ink);
  vline(x, bx, wallTop, ground, P.ink);
  for (let f = 0; f < floors; f++) for (let k = 0; k < 4; k++) {
    const wx = bx + 18 + k * 72, wy = ground - 98 - f * 44, seed = hash3(b, k, f), lit = night ? seed < 0.6 : dusk ? seed < 0.35 : false;
    block(x, wx, wy, 24, 22, lit ? P.amber1 : night ? P.night2 : P.night3);
    if (lit) { rect(x, wx + 1, wy + 1, 22, 4, P.amber2); rect(x, wx + 1, wy + 1, 5, 20, seed < 0.3 ? P.coral2 : P.blue1); if (seed < 0.15) { rect(x, wx + 12, wy + 12, 4, 9, P.ink); rect(x, wx + 11, wy + 9, 6, 4, P.ink); } }
    else if (!night && !dusk) { pset(x, wx + 3, wy + 3, P.white); pset(x, wx + 4, wy + 4, P.white); }
    vline(x, wx + 12, wy + 1, wy + 20, P.ink); rect(x, wx - 2, wy + 22, 28, 2, P.stone2);
    if (hash3(b, k, f + 9) < 0.35) { block(x, wx + 26, wy + 10, 11, 8, P.stone3); for (let j = 0; j < 3; j++) pset(x, wx + 28 + j * 3, wy + 13, P.stone1); }
    if (hash3(b, k, f + 4) < 0.3) { for (let j = 0; j < 4; j++) ellipse(x, wx + 4 + j * 5, wy + 20, 2, 2, j % 2 ? P.green1 : P.green2); }
  }
  // shop: 晴天小铺
  const sx = bx + 12, open = st.shopOpen !== false;
  block(x, sx, ground - 54, 118, 54, P.stone1);
  for (let k = 0; k < 118; k += 8) { rect(x, sx + k, ground - 62, 8, 9, (k / 8) % 2 ? P.cream0 : P.coral1); pset(x, sx + k + 3, ground - 53, (k / 8) % 2 ? P.cream1 : P.coral2); pset(x, sx + k + 4, ground - 53, (k / 8) % 2 ? P.cream1 : P.coral2); }
  hline(x, sx, sx + 117, ground - 63, P.ink);
  block(x, sx + 30, ground - 78, 58, 15, P.cream0);
  text(x, st.shop || '晴天小铺', sx + 59, ground - 76, P.brown0, FONT.small, { align: 'center' });
  block(x, sx + 5, ground - 48, 72, 38, open ? P.amber2 : P.night3);
  if (open) for (let k = 0; k < 3; k++) { rect(x, sx + 7, ground - 38 + k * 10, 68, 1, P.wood2); for (let j = 0; j < 13; j++) rect(x, sx + 8 + j * 5, ground - 43 + k * 10, 3, 5, [P.coral0, P.blue0, P.green1, P.cream0, P.amber0][(j * 3 + k + b) % 5]); }
  else for (let k = 0; k < 38; k += 3) hline(x, sx + 6, sx + 75, ground - 47 + k, P.stone1);
  block(x, sx + 84, ground - 40, 26, 40, open ? P.amber1 : P.night2); block(x, sx + 87, ground - 37, 20, 18, open ? P.amber3 : P.night3); pset(x, sx + 104, ground - 18, P.ink);
  if (open && (night || dusk)) glow(x, sx + 50, ground + 6, 64, 9, P.amber2, 0.5);
  // apartment entrance with a little canopy and number plate
  const en = bx + 140; block(x, en, ground - 40, 24, 40, P.wood1); rect(x, en + 3, ground - 37, 18, 34, P.night1); rect(x, en - 3, ground - 44, 30, 4, P.stone2); block(x, en + 26, ground - 32, 8, 6, P.blue1);
  if (night) glow(x, en + 12, ground - 40, 10, 6, P.amber2, 0.4);
  // vending machine and a bicycle
  const vm = bx + 176;
  block(x, vm, ground - 32, 18, 32, P.coral1); rect(x, vm + 2, ground - 29, 14, 14, P.screen);
  for (let j = 0; j < 6; j++) rect(x, vm + 3 + (j % 3) * 4, ground - 28 + Math.floor(j / 3) * 6, 2, 4, [P.blue0, P.coral0, P.green1][j % 3]);
  rect(x, vm + 5, ground - 10, 8, 3, P.ink);
  if (night) glow(x, vm + 9, ground - 14, 16, 18, P.screen, 0.35);
  const bk = bx + 202;
  for (const wx of [0, 16]) { ellipse(x, bk + wx, ground - 6, 6, 6, P.ink); ellipse(x, bk + wx, ground - 6, 5, 5, night ? P.night1 : P.stone1); pset(x, bk + wx, ground - 6, P.ink); }
  line(x, bk, ground - 6, bk + 7, ground - 13, P.blue1); line(x, bk + 7, ground - 13, bk + 16, ground - 6, P.blue1); line(x, bk + 7, ground - 13, bk + 14, ground - 13, P.blue1); hline(x, bk + 5, bk + 8, ground - 15, P.ink); line(x, bk + 14, ground - 13, bk + 15, ground - 16, P.stone3);
  // bus stop: shelter, bench at knee height, route sign 17
  const bs = bx + 230;
  rect(x, bs, ground - 42, 2, 42, P.stone2); rect(x, bs + 46, ground - 42, 2, 42, P.stone2);
  block(x, bs - 3, ground - 46, 54, 5, P.stone3);
  block(x, bs + 4, ground - 36, 40, 22, night ? P.night3 : P.glass); if (!night) { line(x, bs + 8, ground - 33, bs + 14, ground - 27, P.white); }
  block(x, bs + 6, ground - 10, 36, 3, P.wood3); rect(x, bs + 8, ground - 7, 2, 7, P.ink); rect(x, bs + 38, ground - 7, 2, 7, P.ink);
  block(x, bs + 54, ground - 52, 12, 12, P.blue1); text(x, '17', bs + 60, ground - 51, P.white, FONT.small, { align: 'center' }); vline(x, bs + 60, ground - 40, ground, P.stone2);
  // utility pole with wires and a street lamp
  const pole = bx + 296;
  rect(x, pole, ground - 120, 3, 120, P.stone0); hline(x, pole - 8, pole + 10, ground - 112, P.stone0);
  for (const dy of [-110, -105]) for (let k = 0; k < STREET_BLOCK; k += 1) { const sag = Math.sin(k / STREET_BLOCK * Math.PI) * 8; pset(x, pole - k, ground + dy + sag, P.ink); }
  rect(x, pole - 14, ground - 84, 16, 2, P.stone0); rect(x, pole - 17, ground - 83, 8, 3, night || dusk ? P.amber3 : P.stone3);
  if (night || dusk) { x.save(); x.globalAlpha = 0.08; poly(x, [[pole - 15, ground - 80], [pole - 11, ground - 80], [pole + 12, ground + 4], [pole - 38, ground + 4]], P.amber2); x.restore(); glow(x, pole - 13, ground + 5, 26, 5, P.amber2, 0.6); }
}
function car(x, cx, gy, c, t) { // side view, facing right, wheels at gy
  const col = c.col || P.coral1, w = c.kind === 'bus' ? 150 : 58, h = c.kind === 'bus' ? 52 : 20;
  x.save(); if (c.dir < 0) { x.translate(ri(cx) * 2, 0); x.scale(-1, 1); }
  if (c.kind === 'bus') {
    block(x, cx - w, gy - h - 6, w, h, P.cream0); rect(x, cx - w + 1, gy - 22, w - 2, 9, col);
    for (let k = 0; k < 6; k++) block(x, cx - w + 8 + k * 22, gy - h, 18, 16, k === 5 ? P.screen : P.night3);
    const d = c.door || 0; block(x, cx - 28, gy - h - 2, 18, 42, P.night2); if (d < 1) { rect(x, cx - 27, gy - h - 1, ri(8 * (1 - d)), 40, P.stone3); rect(x, cx - 11 - ri(8 * (1 - d)), gy - h - 1, ri(8 * (1 - d)), 40, P.stone3); }
    block(x, cx - w + 4, gy - h - 12, 40, 7, P.ink); text(x, '17 路', cx - w + 24, gy - h - 12, P.amber2, FONT.tiny, { align: 'center' });
    rect(x, cx - 3, gy - 20, 3, 4, P.amber3);
  } else {
    block(x, cx - w, gy - h - 6, w, h - 4, col); poly(x, [[cx - w + 14, gy - h - 6], [cx - w + 20, gy - h - 16], [cx - 20, gy - h - 16], [cx - 12, gy - h - 6]], P.ink);
    poly(x, [[cx - w + 16, gy - h - 7], [cx - w + 21, gy - h - 14], [cx - 21, gy - h - 14], [cx - 15, gy - h - 7]], P.night3);
    vline(x, cx - w / 2 - 3, gy - h - 14, gy - h - 7, P.ink);
    if (c.kind === 'taxi') { block(x, cx - w / 2 - 8, gy - h - 21, 12, 5, P.amber2); }
    rect(x, cx - 3, gy - h + 1, 3, 3, P.amber3); rect(x, cx - w, gy - h + 1, 2, 3, P.coral0);
  }
  const spin = Math.floor(t * 12) % 2;
  for (const wx of c.kind === 'bus' ? [cx - w + 22, cx - 30] : [cx - w + 12, cx - 12]) { ellipse(x, wx, gy - 5, 5, 5, P.ink); ellipse(x, wx, gy - 5, 3, 3, P.stone3); pset(x, wx + spin, gy - 5, P.ink); }
  x.restore();
}
// A passer-by: the shared body plan as a flat silhouette, with an umbrella in rain.
const SIL = {};
function passerby(x, fx, fy, o, t, night) {
  const key = (o.who || 'A') + (o.dir || 'right') + Math.floor(mod(o.phase, 1) * 4) + (o.col || '');
  let s = SIL[key];
  if (!s) {
    s = canvas(24, 34);
    drawChar(s.x, o.who || 'A', 12, 32, { dir: o.dir || 'right', walk: o.phase, still: true });
    s.x.globalCompositeOperation = 'source-in'; s.x.fillStyle = o.col || (night ? P.night0 : P.stone1); s.x.fillRect(0, 0, 24, 34);
    SIL[key] = s;
  }
  blit(x, s, fx - 12, fy - 32);
  if (o.umbrella) { rect(x, fx - 9, fy - 35, 19, 3, o.umbrella); rect(x, fx - 6, fy - 37, 13, 2, o.umbrella); vline(x, fx, fy - 32, fy - 22, P.ink); }
}
// Rain: streaks fall at slightly different speeds; drops that reach the ground splash.
function rainLayer(x, R, t, amount, ground) {
  const n = Math.floor(80 * amount);
  for (let k = 0; k < n; k++) {
    const sp = 220 + hash(k) * 70, rx = R.x + mod(hash(k + 7) * (R.w + 30) - t * 24, R.w + 30) - 15;
    const ry = R.y + mod(hash(k + 13) * R.h + t * sp, R.h);
    pset(x, rx, ry, P.rain); pset(x, rx, ry + 1, P.rain); pset(x, rx - 1, ry + 3, P.night5);
  }
  if (ground !== undefined) for (let k = 0; k < 12 * amount; k++) {
    const cyc = t * 2.2 + hash(k + 40), ph = mod(cyc, 1), sx = R.x + hash3(k, Math.floor(cyc), 3) * R.w;
    if (ph < 0.3) { const h = ri(ph * 8); pset(x, sx - 1 - h / 2, ground - h, P.rain); pset(x, sx + 1 + h / 2, ground - h, P.rain); }
  }
}

// ------------------------------------------------------------- station platform
// st: { time, sign, signX, camX, train: { x, doorsOpen, col }, benches:[x], board, rain }
function platformGround(R) { return R.y + R.h - 58; }
function platform(x, R, st, t) {
  clip(x, R, () => {
    const ox = R.x, cam = st.camX || 0, gy = platformGround(R), kind = st.time || 'night';
    skyBands(x, ox, R.y, R.w, gy - R.y, st.rain ? 'rain' : kind);
    if (kind === 'night' && !st.rain) stars(x, ox, R.y, R.w, (gy - R.y) * 0.5, t, 26, 5);
    if (kind === 'day' || kind === 'dusk') for (let k = 0; k < 3; k++) cloud(x, ox + mod(k * 100 + t * 3 - cam * 0.05, R.w + 60) - 30, R.y + 20 + k * 12, 34, kind === 'dusk' ? P.dusk3 : P.white, kind === 'dusk' ? P.dusk4 : null);
    if (st.rainbow > 0) rainbow(x, ox + R.w / 2, gy - 20, 150, st.rainbow);
    for (let k = 0; k < R.w; k++) { const wx = k + cam * 0.2, h = 10 + Math.sin(wx * 0.05) * 6 + Math.sin(wx * 0.013 + 1) * 8; vline(x, ox + k, gy - 50 - h, gy - 40, kind === 'night' ? P.night1 : kind === 'day' ? '#7d93bf' : P.dusk0); }
    for (let k = 0; k < 20; k++) { const px = ox + mod(k * 31 - cam * 0.4, R.w + 40) - 20; if (hash(k) < 0.6) { const hh = 12 + hash(k + 1) * 16; rect(x, px, gy - 40 - hh, 7, hh, kind === 'night' ? P.night0 : kind === 'day' ? '#6c7ea8' : P.dusk0); if (kind !== 'day') pset(x, px + 2, gy - 34 - hh / 2, P.amber1); } }
    // tall frames: a distant city and the station footbridge (天桥) above the roof
    if (gy - 104 - R.y > 50) {
      const dark = kind === 'night' ? P.night1 : kind === 'day' ? '#7387b2' : '#5a3446', lit = kind === 'day' ? 0.03 : kind === 'night' ? 0.4 : 0.2;
      for (let k = -1; k < 12; k++) {
        const i = k + Math.floor(cam * 0.25 / 26), px = ox + i * 26 - ri(cam * 0.25), h = 50 + hash(i * 5 + 1) * 120;
        rect(x, px, gy - 50 - h, 22, h, dark); if (hash(i + 3) < 0.4) rect(x, px + 8, gy - 56 - h, 2, 6, dark);
        for (let wy = 4; wy < h - 4; wy += 5) for (let wx = 3; wx < 20; wx += 4) if (hash3(i, wx, wy) < lit) pset(x, px + wx, gy - 50 - h + wy, kind === 'dusk' ? P.amber2 : P.amber1);
      }
      const fb = gy - 104 - 44, fx0 = ox + ri(150 - cam * 0.9);
      rect(x, ox, fb, R.w, 9, P.stone2); hline(x, ox, ox + R.w, fb, P.ink); hline(x, ox, ox + R.w, fb + 9, P.ink); hline(x, ox, ox + R.w, fb + 1, P.stone3);
      for (let k = -mod(ri(cam * 0.9), 6); k < R.w; k += 6) vline(x, ox + k, fb - 8, fb, P.stone1); hline(x, ox, ox + R.w, fb - 8, P.stone1);
      for (const tx of [fx0 - 140, fx0 + 120]) { rect(x, tx, fb - 30, 26, 39, P.ink); rect(x, tx + 1, fb - 29, 24, 37, P.stone1); rect(x, tx + 4, fb - 24, 18, 10, kind === 'day' ? P.glass : P.amber1); }
      if (kind !== 'day') glow(x, ox + R.w / 2, fb + 4, 80, 6, P.amber2, 0.2);
    }
    // fence, tracks with ballast and sleepers
    for (let k = -mod(ri(cam * 0.8), 10); k < R.w; k += 10) vline(x, ox + k, gy - 30, gy - 22, P.stone1); hline(x, ox, ox + R.w, gy - 29, P.stone1);
    rect(x, ox, gy - 22, R.w, 22, P.stone0);
    for (let k = -mod(ri(cam), 8); k < R.w; k += 8) rect(x, ox + k, gy - 14, 5, 2, P.wood1);
    hline(x, ox, ox + R.w, gy - 16, P.stone4); hline(x, ox, ox + R.w, gy - 9, P.stone4);
    hline(x, ox, ox + R.w, gy - 92, P.ink);
    if (st.train) trainSide(x, ox + ri(st.train.x - cam), gy - 6, st.train, t, R);
    // platform surface with the yellow tactile line at the edge
    rect(x, ox, gy - 2, R.w, R.y + R.h - gy + 2, P.stone2); rect(x, ox, gy - 2, R.w, 2, P.stone3);
    rect(x, ox, gy + 2, R.w, 3, P.amber1); for (let k = -mod(ri(cam), 4); k < R.w; k += 4) pset(x, ox + k + 1, gy + 3, P.amber0);
    for (let k = -mod(ri(cam), 24); k < R.w; k += 24) vline(x, ox + k, gy + 6, R.y + R.h, P.stone1);
    for (let k = 0; k < 4; k++) hline(x, ox, ox + R.w, gy + 14 + k * 12, P.stone1);
    if (st.wet) { x.save(); x.globalAlpha = 0.25; for (let k = 0; k < 5; k++) rect(x, ox + mod(k * 67 - cam, R.w + 40) - 20, gy + 20 + k * 7, 26, 2, P.glass); x.restore(); }
    // canopy: a roof band with eaves (the sky stays open above it), beams, columns, hanging lamps
    const roofY = gy - 104;
    rect(x, ox, roofY - 10, R.w, 18, P.stone1); hline(x, ox, ox + R.w, roofY - 10, P.ink); hline(x, ox, ox + R.w, roofY - 9, P.stone3);
    for (let k = -mod(ri(cam), 12); k < R.w; k += 12) vline(x, ox + k, roofY - 8, roofY - 1, P.stone0);
    rect(x, ox, roofY, R.w, 8, P.stone2); hline(x, ox, ox + R.w, roofY + 8, P.ink); hline(x, ox, ox + R.w, roofY, P.stone3);
    for (let k = -mod(ri(cam), 40); k < R.w; k += 40) rect(x, ox + k, roofY + 8, 2, 3, P.stone0);
    for (let k = -mod(ri(cam), 120) + 30; k < R.w + 10; k += 120) { rect(x, ox + k, roofY + 8, 4, gy - roofY - 6, P.stone1); vline(x, ox + k, roofY + 8, gy, P.ink); rect(x, ox + k - 2, gy - 2, 8, 3, P.stone0); }
    for (let k = -mod(ri(cam), 120) + 90; k < R.w + 10; k += 120) { vline(x, ox + k, roofY + 8, roofY + 14, P.ink); block(x, ox + k - 4, roofY + 14, 9, 4, P.amber3); glow(x, ox + k, gy + 18, 30, 8, P.amber2, kind === 'night' ? 0.55 : 0.25); }
    if (st.sign) {
      const sx = ox + ri((st.signX ?? R.w / 2) - cam) - 36;
      vline(x, sx + 20, roofY + 8, roofY + 16, P.ink); vline(x, sx + 52, roofY + 8, roofY + 16, P.ink);
      block(x, sx, roofY + 16, 72, 18, P.cream0); hline(x, sx + 1, sx + 70, roofY + 31, P.coral1);
      text(x, st.sign, sx + 36, roofY + 18, P.brown0, FONT.ui, { align: 'center' });
    }
    if (st.board !== false) { const tb = ox + ri(200 - cam); block(x, tb, gy - 40, 24, 22, P.night1); for (let j = 0; j < 4; j++) hline(x, tb + 3, tb + 3 + (j % 2 ? 12 : 17), gy - 36 + j * 4, j === 1 && st.boardAlert && mod(t, 0.8) < 0.5 ? P.coral0 : P.amber1); vline(x, tb + 11, gy - 18, gy, P.ink); vline(x, tb + 12, gy - 18, gy, P.ink); }
    for (const bx of st.benches || []) { const b = ox + ri(bx - cam); block(x, b, gy + 26, 40, 3, P.wood3); block(x, b, gy + 18, 40, 4, P.wood2); rect(x, b + 3, gy + 29, 2, 6, P.ink); rect(x, b + 35, gy + 29, 2, 6, P.ink); }
    if (st.rain) rainLayer(x, { x: ox, y: roofY + 10, w: R.w, h: gy - roofY - 14 }, t, st.rain * 0.6);
    if (kind === 'dusk') shade(x, ox, R.y, R.w, R.h, P.dusk2, 0.08);
  });
}
function trainSide(x, frontX, railY, tr, t, R) { // frontX = screen x of the nose; cars trail to the left
  const door = tr.doorsOpen || 0, body = tr.col || P.stone3, stripe = tr.stripe || P.coral1;
  for (let c = 0; c < 6; c++) {
    const cx = frontX - c * 122;
    if (cx < R.x - 10 || cx - 122 > R.x + R.w) continue;
    block(x, cx - 120, railY - 60, 120, 56, body); hline(x, cx - 119, cx - 2, railY - 59, P.white);
    rect(x, cx - 119, railY - 24, 118, 4, stripe); rect(x, cx - 119, railY - 56, 118, 2, stripe);
    for (let w = 0; w < 5; w++) {
      const wx = cx - 112 + w * 22;
      if (w === 2) { // a pair of sliding doors
        const o = ri(door * 6);
        rect(x, wx - 2, railY - 50, 20, 44, P.ink); rect(x, wx - 1, railY - 49, 18, 42, P.amber2);
        rect(x, wx - 1 - o, railY - 49, 9, 42, P.stone2); rect(x, wx + 8 + o, railY - 49, 9, 42, P.stone2);
        block(x, wx + 1 - o, railY - 45, 5, 12, P.night3); block(x, wx + 11 + o, railY - 45, 5, 12, P.night3);
        continue;
      }
      block(x, wx, railY - 50, 16, 16, P.amber2); rect(x, wx + 1, railY - 41, 14, 6, P.amber0);
      if (hash3(c, w, 7) < 0.45) { ellipse(x, wx + 8, railY - 40, 3, 3, P.night1); rect(x, wx + 4, railY - 37, 8, 3, P.night1); }
    }
    if (c === 0) { rect(x, cx - 7, railY - 50, 6, 14, P.screen); rect(x, cx - 4, railY - 14, 3, 3, P.amber3); }
    rect(x, cx - 112, railY - 6, 14, 5, P.ink); rect(x, cx - 26, railY - 6, 14, 5, P.ink);
    rect(x, cx - 121, railY - 40, 2, 20, P.ink);
  }
}
// A train braking into the station: constant deceleration to a stop at `stopX` after `dur` s.
function trainArrival(t, t0, stopX, dur = 3.4, dist = 560) { const u = clamp((t - t0) / dur); return stopX - dist * (1 - u) * (1 - u); }
// …and pulling away: constant acceleration from rest.
function trainDeparture(t, t0, startX, accel = 26) { const s = Math.max(0, t - t0); return startX + 0.5 * accel * s * s; }
function rainbow(x, cx, cy, r, a) {
  x.save(); x.globalAlpha = 0.45 * clamp(a);
  [P.coral0, P.amber1, P.amber3, P.green2, P.blue3, P.night5].forEach((c, i) => {
    const rr = r - i * 3;
    for (let k = 0; k <= 180; k++) { const an = Math.PI * k / 180; rect(x, cx - Math.cos(an) * rr, cy - Math.sin(an) * rr * 0.55, 2, 3, c); }
  });
  x.restore();
}

// ------------------------------------------------------------- the ferry pier (night)
function pier(x, R, st, t) {
  clip(x, R, () => {
    const ox = R.x, gy = R.y + R.h - 44;
    skyBands(x, ox, R.y, R.w, R.h, st.rain ? 'rain' : 'night');
    if (!st.rain) stars(x, ox, R.y, R.w, R.h * 0.4, t, 30, 8);
    // sea with moving wave ticks and the far lighthouse beam
    rect(x, ox, R.y + R.h * 0.42, R.w, R.h, P.night1);
    for (let y = ri(R.y + R.h * 0.42) + 4; y < gy; y += 5) for (let k = 0; k < R.w; k += 14) { const s = ri(Math.sin(t * 1.2 + y * 0.3 + k) * 2); hline(x, ox + k + s + (y % 10), ox + k + s + (y % 10) + 3, y, P.night3); }
    const lh = ox + 28, ly = ri(R.y + R.h * 0.42); rect(x, lh, ly - 18, 4, 18, P.cream1); rect(x, lh - 1, ly - 21, 6, 3, P.coral1);
    const beam = mod(t * 0.35, 1); if (beam < 0.5) { x.save(); x.globalAlpha = 0.18 * Math.sin(beam * 2 * Math.PI); poly(x, [[lh + 2, ly - 20], [lh + 90, ly - 34], [lh + 90, ly - 8]], P.amber3); x.restore(); }
    // the ferry, moored, its lights off but one
    const fx = ox + 140, fy = gy - 10;
    poly(x, [[fx - 70, fy - 26], [fx + 80, fy - 26], [fx + 66, fy], [fx - 60, fy]], P.ink); poly(x, [[fx - 68, fy - 25], [fx + 77, fy - 25], [fx + 65, fy - 1], [fx - 59, fy - 1]], P.stone3);
    rect(x, fx - 59, fy - 12, 124, 3, P.coral1);
    block(x, fx - 40, fy - 46, 90, 21, P.cream1); for (let k = 0; k < 7; k++) block(x, fx - 34 + k * 12, fy - 42, 8, 8, k === 5 ? P.amber2 : P.night2);
    block(x, fx - 20, fy - 58, 40, 13, P.cream0); rect(x, fx + 10, fy - 66, 4, 8, P.stone1);
    x.save(); x.globalAlpha = 0.4; for (let y = 0; y < 14; y += 2) rect(x, fx + 26 + ri(Math.sin(t * 2 + y)), fy + 2 + y, 4, 1, P.amber2); x.restore();
    // the pier: planks, posts, rail, a lamp, a sign
    rect(x, ox, gy, R.w, R.y + R.h - gy, P.wood1); for (let k = 0; k < R.w; k += 9) vline(x, ox + k, gy + 1, R.y + R.h, P.wood0); hline(x, ox, ox + R.w, gy, P.wood3);
    for (let k = 6; k < R.w; k += 40) { block(x, ox + k, gy - 14, 4, 14, P.wood2); } hline(x, ox, ox + R.w, gy - 12, P.wood2); hline(x, ox, ox + R.w, gy - 7, P.wood2);
    const lp = ox + 228; rect(x, lp, gy - 74, 3, 74, P.stone0); rect(x, lp - 6, gy - 76, 14, 4, P.ink); rect(x, lp - 5, gy - 74, 12, 2, P.amber3);
    glow(x, lp + 1, gy + 4, 30, 6, P.amber2, 0.6); x.save(); x.globalAlpha = 0.07; poly(x, [[lp - 4, gy - 72], [lp + 6, gy - 72], [lp + 26, gy + 2], [lp - 24, gy + 2]], P.amber2); x.restore();
    if (st.sign) { block(x, ox + 190, gy - 46, 64, 18, P.night0); text(x, st.sign, ox + 222, gy - 44, mod(t, 0.9) < 0.6 ? P.coral0 : P.coral2, FONT.ui, { align: 'center' }); vline(x, ox + 205, gy - 28, gy, P.ink); vline(x, ox + 239, gy - 28, gy, P.ink); }
    if (st.rain) rainLayer(x, R, t, st.rain, gy + 10);
  });
}

// ------------------------------------------------------------- inside a train
function trainInterior(x, R, st, t) {
  clip(x, R, () => {
    const ox = R.x, oy = R.y, W = R.w, H = R.h, kind = st.time || 'dusk', sp = st.speed ?? 1;
    rect(x, ox, oy, W, H, P.stone3);
    const wy = oy + 22, wh = 66;
    for (let k = 0; k < 3; k++) {
      const wx = ox + 10 + k * 88, ww = 74;
      clip(x, { x: wx, y: wy, w: ww, h: wh }, () => {
        skyBands(x, wx, wy, ww, wh, kind);
        if (kind === 'dusk') ellipse(x, wx + 50 - k * 88 + W * 0.6, wy + 44, 7, 7, P.amber2);
        for (let j = 0; j < ww; j++) { const gx = ox + j + k * 88 + t * 10 * sp, h = 16 + Math.sin(gx * 0.03) * 7 + Math.sin(gx * 0.011) * 9; vline(x, wx + j, wy + wh - h - 14, wy + wh, kind === 'night' ? P.night0 : kind === 'day' ? '#6f88b0' : P.dusk0); }
        for (let j = 0; j < 12; j++) { const px = ox + mod(j * 34 - t * 80 * sp, W + 40) - 20 - k * 88 + 10; if (px < wx - 10 || px > wx + ww + 10) continue; const h = 12 + hash(j) * 8; ellipse(x, px, wy + wh - 14 - h / 2, 5, ri(h / 2), kind === 'night' ? P.night1 : P.green0); vline(x, px, wy + wh - 14, wy + wh - 8, P.wood0); }
        for (let j = 0; j < 3; j++) { const px = ox + mod(j * 130 - t * 260 * sp, W + 140) - 70 - k * 88 + 10; rect(x, px, wy, 2, wh, P.stone0); hline(x, px - 6, px + 7, wy + 6, P.stone0); }
        if (st.rain) glassRain(x, wx, wy, ww, wh, t, st.rain);
        pset(x, wx + 2, wy + 2, P.white); line(x, wx + 4, wy + 2, wx + 10, wy + 8, P.screen);
      });
      rect(x, wx - 2, wy - 2, ww + 4, 2, P.ink); rect(x, wx - 2, wy + wh, ww + 4, 2, P.ink); vline(x, wx - 2, wy, wy + wh, P.ink); vline(x, wx + ww + 1, wy, wy + wh, P.ink);
    }
    // ceiling, rail and straps
    rect(x, ox, oy, W, 12, P.stone2); hline(x, ox, ox + W, oy + 12, P.ink); hline(x, ox, ox + W, oy + 15, P.stone1);
    for (let k = 14; k < W; k += 26) { const sw = ri(Math.sin(t * 2.2 + k) * 1); vline(x, ox + k, oy + 15, oy + 19, P.stone1); rect(x, ox + k - 2 + sw, oy + 19, 5, 4, P.ink); rect(x, ox + k - 1 + sw, oy + 20, 3, 2, P.cream1); }
    // bench seat along the wall: back, seat, front
    rect(x, ox, oy + 92, W, 20, P.ink); rect(x, ox, oy + 93, W, 18, P.blue1); for (let k = 0; k < W; k += 30) vline(x, ox + k, oy + 93, oy + 110, P.blue2);
    rect(x, ox, oy + 112, W, 8, P.ink); rect(x, ox, oy + 113, W, 6, P.blue2); hline(x, ox, ox + W, oy + 113, P.blue0);
    rect(x, ox, oy + 120, W, 10, P.stone1);
    rect(x, ox, oy + 130, W, H - 130, P.stone2); for (let k = 0; k < W; k += 18) hline(x, ox + k, ox + k + 8, oy + 150, P.stone1);
    // sunlight slides along as the train turns
    if (kind !== 'night') { const lx = ox + mod(t * 16 * sp, W + 140) - 70; x.save(); x.globalAlpha = 0.16; poly(x, [[lx, oy + 92], [lx + 46, oy + 92], [lx + 74, oy + H], [lx + 28, oy + H]], P.amber2); x.restore(); }
    // the carriage rocks: a 1-px bounce every so often
    st._bounce = mod(t * 1.7, 1) < 0.08 ? 1 : 0;
  });
}

// ------------------------------------------------------------- the world map
// Map-local coordinates (270×376). Sea on the upper left; 雾港 on the north-east
// shore, 晴川 in the south-west; the strait between them, crossed by the ferry.
// The long way round is the mountain line down the east, through the tunnel.
const MAP_NODES = {
  A_home: { x: 214, y: 54, name: '雾港', who: 'A' },
  A_st: { x: 196, y: 94, name: '雾港北站' },
  port: { x: 140, y: 132, name: '渡口' },
  tunnel: { x: 232, y: 182, name: '山线隧道' },
  hub: { x: 140, y: 246, name: '风见站' },
  B_st: { x: 90, y: 292, name: '晴川站' },
  B_home: { x: 54, y: 334, name: '晴川', who: 'B' },
};
const MAP_SEA = [[0, 0], [100, 0], [108, 36], [100, 78], [124, 116], [148, 156], [162, 192], [154, 222], [120, 238], [74, 236], [34, 250], [0, 254]];
const MAP_LINES = [['A_home', 'A_st'], ['A_st', 'port'], ['A_st', 'tunnel'], ['tunnel', 'hub'], ['B_home', 'B_st'], ['B_st', 'hub']];
function worldMap(x, R, st, t) {
  clip(x, R, () => {
    const ox = R.x, oy = R.y, M = (p) => [ox + p[0], oy + p[1]];
    // land with a grid of faint survey lines
    rect(x, ox, oy, R.w, R.h, P.cream1);
    for (let k = 0; k < R.w; k += 30) vline(x, ox + k, oy, oy + R.h, P.cream2); for (let k = 0; k < R.h; k += 30) hline(x, ox, ox + R.w, oy + k, P.cream2);
    poly(x, MAP_SEA.map(M), P.ink); poly(x, MAP_SEA.map(p => M([p[0] - 1, p[1] - 1])), P.blue2);
    for (let y = 6; y < 250; y += 9) for (let k = 4; k < 150; k += 16) { const px = k + ((y / 9) % 2) * 8, s = mod(t * 0.5 + hash2(k, y), 1) < 0.5 ? 1 : 0; if (pointInPoly(px + 2, y, MAP_SEA)) { hline(x, ox + px + s, ox + px + 3 + s, oy + y, P.blue1); } }
    // island and boats
    ellipse(x, ox + 46, oy + 120, 12, 6, P.ink); ellipse(x, ox + 46, oy + 119, 11, 5, P.cream1); ellipse(x, ox + 48, oy + 118, 3, 2, P.green1);
    // mountains along the east and around 晴川
    for (const [mx, my, s] of [[236, 140, 1], [252, 152, 0.8], [218, 154, 0.7], [246, 200, 1], [226, 214, 0.8], [254, 226, 0.7], [30, 280, 0.8], [18, 300, 0.6], [200, 300, 0.7], [226, 290, 0.9]]) {
      const w = ri(10 * s), h = ri(12 * s); poly(x, [[ox + mx - w - 1, oy + my + 1], [ox + mx, oy + my - h - 1], [ox + mx + w + 1, oy + my + 1]], P.ink);
      poly(x, [[ox + mx - w, oy + my], [ox + mx, oy + my - h], [ox + mx + w, oy + my]], P.stone3); poly(x, [[ox + mx - 3, oy + my - h + 4], [ox + mx, oy + my - h], [ox + mx + 3, oy + my - h + 4]], P.white);
    }
    for (let k = 0; k < 34; k++) { const fx = k < 17 ? 170 + hash(k) * 90 : 10 + hash(k) * 110, fy = k < 17 ? 16 + hash(k + 50) * 60 : 280 + hash(k + 50) * 80; if (pointInPoly(fx, fy, MAP_SEA)) continue; ellipse(x, ox + fx, oy + fy, 2, 2, P.green1); pset(x, ox + fx, oy + fy + 3, P.wood1); }
    // rail lines: sleepers on a brown line; the ferry as a dashed lane across the water
    const seg = (a, b, col, dash, prog = 1, w = 1, gap = 2) => {
      const A = MAP_NODES[a], B = MAP_NODES[b], n = Math.ceil(Math.hypot(B.x - A.x, B.y - A.y));
      for (let k = 0; k <= n * prog; k++) if (dash <= 1 || k % dash < dash - gap) rect(x, ox + A.x + (B.x - A.x) * k / n - (w >> 1), oy + A.y + (B.y - A.y) * k / n - (w >> 1), w, w, col);
    };
    for (const [a, b] of MAP_LINES) { if ((a === 'tunnel' || b === 'tunnel') && !st.showTunnel) continue; seg(a, b, P.brown2, 4); }
    seg('port', 'hub', st.ferryCut ? P.coral1 : P.white, 6, 1, 1, 3);
    if (st.ferryCut) { const mx = ox + 141, my = oy + 190; line(x, mx - 5, my - 5, mx + 5, my + 5, P.coral1); line(x, mx + 5, my - 5, mx - 5, my + 5, P.coral1); line(x, mx - 4, my - 5, mx + 6, my + 5, P.coral1); line(x, mx + 6, my - 5, mx - 4, my + 5, P.coral1); }
    // fog over the unexplored middle, thinning as st.fog → 0
    const fog = st.fog ?? 1;
    if (fog > 0) for (const [fx, fy, fr] of [[150, 196, 52], [196, 230, 40], [112, 270, 34], [200, 140, 30]]) { x.save(); x.globalAlpha = 0.55 * fog; ellipse(x, ox + fx + ri(Math.sin(t * 0.4 + fx) * 3), oy + fy, fr, ri(fr * 0.55), P.stone4); x.globalAlpha = 0.4 * fog; ellipse(x, ox + fx + 8 + ri(Math.sin(t * 0.3 + fy) * 2), oy + fy - 4, ri(fr * 0.6), ri(fr * 0.35), P.white); x.restore(); }
    // travelled routes, thick, in each person's colour
    for (const r of st.routes || []) for (let i = 0; i < r.path.length - 1; i++) { const p = clamp(r.prog - i); if (p > 0) seg(r.path[i], r.path[i + 1], r.col, 1, p, 3); }
    const reached = new Set(st.reached || []);
    for (const [k, nd] of Object.entries(MAP_NODES)) {
      if (k === 'tunnel' && !st.showTunnel) continue;
      const lit = reached.has(k), col = lit ? (nd.who === 'B' ? P.coral0 : nd.who === 'A' ? P.blue0 : P.amber1) : P.stone3;
      if (nd.who) { rect(x, ox + nd.x - 7, oy + nd.y - 8, 14, 11, P.ink); for (let j = 0; j < 3; j++) rect(x, ox + nd.x - 6 + j * 4, oy + nd.y - 7 + (j % 2) * 3, 4, 9 - (j % 2) * 3, col); }
      else { rect(x, ox + nd.x - 4, oy + nd.y - 4, 9, 9, P.ink); rect(x, ox + nd.x - 3, oy + nd.y - 3, 7, 7, col); pset(x, ox + nd.x, oy + nd.y, lit ? P.white : P.stone2); }
      if (k === st.pulse) { const ph = mod(t * 1.2, 1), s = ri(5 + ph * 8); x.save(); x.globalAlpha = 1 - ph; x.strokeStyle = P.coral0; x.lineWidth = 1; x.strokeRect(ox + nd.x - s + 0.5, oy + nd.y - s + 0.5, s * 2, s * 2); x.restore(); }
      const right = nd.x < 150, lw = textWidth(nd.name, FONT.small) + 6, lx = right ? ox + nd.x + 9 : ox + nd.x - 9 - lw;
      rect(x, lx, oy + nd.y - 7, lw, 13, P.ink); rect(x, lx + 1, oy + nd.y - 6, lw - 2, 11, lit ? P.cream0 : P.cream2);
      text(x, nd.name, lx + 3, oy + nd.y - 6, lit ? P.brown0 : P.brown2, FONT.small);
    }
    for (const m of st.markers || []) mapMarker(x, ox + m.x, oy + m.y, m.who, t);
    // compass and scale
    const cx = ox + 244, cy = oy + 340; ellipse(x, cx, cy, 11, 11, P.ink); ellipse(x, cx, cy, 10, 10, P.cream0); poly(x, [[cx, cy - 9], [cx - 3, cy], [cx + 3, cy]], P.coral1); poly(x, [[cx, cy + 9], [cx - 3, cy], [cx + 3, cy]], P.stone3); text(x, 'N', cx, cy - 22, P.brown1, FONT.tiny, { align: 'center' });
    rect(x, ox + 180, oy + 362, 40, 3, P.ink); rect(x, ox + 181, oy + 363, 19, 1, P.cream0); text(x, '500 km', ox + 200, oy + 366, P.brown1, FONT.tiny, { align: 'center' });
  });
}
function pointInPoly(px, py, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) inside = !inside; }
  return inside;
}
function mapMarker(x, px, py, who, t) { // a little head on a pin, bobbing
  const b = Math.floor(t * 2) % 2;
  rect(x, px - 1, py - 4, 3, 4, P.ink);
  blit(x, `${who}_head_front`, px - 7, py - 18 - b);
}

// ------------------------------------------------------------- close-ups
// A hand drawn at resolution k (1–4): parts get k× more pixels, the outline stays 1 px.
function hand(x, who, cx, cy, kind, facing = 1, k = 1) {
  const sleeve = who === 'A' ? [P.blue0, P.blue1, P.blue2] : [P.cream0, P.cream1, P.cream2];
  x.save();
  if (facing < 0) { x.translate(ri(cx) * 2, 0); x.scale(-1, 1); }
  const X = ri(cx), Y = ri(cy), q = v => ri(v * k);
  const parts = [[0, -6, 12, 12]];
  if (kind === 'point') parts.push([12, -6, 11, 4], [10, -1, 5, 4], [9, 3, 4, 3], [3, -9, 6, 4]);
  else if (kind === 'press') parts.push([12, -5, 9, 4], [12, -1, 8, 3], [12, 2, 7, 3], [4, -9, 6, 4]);
  else if (kind === 'hold') parts.push([12, -6, 6, 4], [12, -2, 6, 4], [12, 2, 5, 4], [6, -10, 8, 4]);
  else parts.push([12, -6, 9, 3], [12, -3, 10, 3], [12, 0, 9, 3], [12, 3, 6, 3], [4, -10, 6, 5]);
  const rr = (px, py, w, h, col, r) => { rect(x, px + r, py, w - 2 * r, h, col); rect(x, px, py + r, w, h - 2 * r, col); if (r > 1) rect(x, px + 1, py + 1, w - 2, h - 2, col); };
  const rad = k >= 3 ? 2 : 1;
  for (const [a, b, w, h] of parts) rr(X + q(a) - 1, Y + q(b) - 1, q(w) + 2, q(h) + 2, P.ink, rad);
  for (const [a, b, w, h] of parts) rr(X + q(a), Y + q(b), q(w), q(h), P.skin0, rad);
  const fingers = parts.slice(1, -1), thumb = parts[parts.length - 1];
  fingers.forEach(([a, b, w, h], i) => {
    const fx = X + q(a), fy = Y + q(b), fw = q(w), fh = q(h);
    hline(x, fx, fx + fw - 1, fy + fh - 1, P.skin1);
    if (k >= 2) { rect(x, fx + fw - q(2), fy + 1, q(1.5), Math.max(1, fh - 3), '#fbe0cc'); hline(x, fx + 2, fx + fw - q(3), fy + 1, '#fde2c8'); }
    // the gap to the next finger, and a rounded tip
    if (i < fingers.length - 1) hline(x, fx + q(1), fx + Math.min(fw, q(fingers[i + 1][2])) - 1, fy + fh, P.ink);
    pset(x, fx + fw - 1, fy, P.ink); pset(x, fx + fw - 1, fy + fh - 1, P.ink);
    if (k >= 3) { pset(x, fx + fw - 2, fy, P.ink); pset(x, fx + fw - 1, fy + 1, P.ink); }
    if (k >= 2) for (let j = 1; j < 3; j++) pset(x, fx + q(j * 3), fy + (fh >> 1), P.skin1); // knuckle creases
  });
  { const [a, b, w, h] = thumb; hline(x, X + q(a), X + q(a) + q(w) - 1, Y + q(b) + q(h) - 1, P.skin1); pset(x, X + q(a), Y + q(b), P.ink); pset(x, X + q(a) + q(w) - 1, Y + q(b), P.ink); }
  rect(x, X, Y + q(3), q(12), q(3), P.skin1);
  if (k >= 2) for (let j = 0; j < 3; j++) pset(x, X + q(11), Y + q(-4 + j * 3), P.skin2);
  rect(x, X - q(21) - 1, Y - q(9) - 1, q(21) + 1, q(18) + 2, P.ink);
  rect(x, X - q(21), Y - q(9), q(21), q(18), sleeve[0]);
  rect(x, X - q(21), Y + q(4), q(21), q(5), sleeve[1]);
  if (k >= 2) for (let j = 1; j < 4; j++) line(x, X - q(21) + q(j * 5), Y - q(8), X - q(21) + q(j * 5) + q(2), Y + q(3), sleeve[1]);
  rect(x, X - q(5), Y - q(9), q(4), q(18), sleeve[2]); hline(x, X - q(5), X - 2, Y - q(9), sleeve[0]);
  if (who === 'A') rect(x, X - q(13), Y - q(6), Math.max(1, q(2)), Math.max(1, q(2)), P.amber2);
  else { rect(x, X - q(21), Y - q(9), q(21), Math.max(1, q(3)), P.coral0); for (let j = 0; j < q(21); j += 3) pset(x, X - q(21) + j, Y - q(2), P.cream2); }
  x.restore();
}
