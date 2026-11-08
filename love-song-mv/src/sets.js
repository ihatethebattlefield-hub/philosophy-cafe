'use strict';
/*
 * Interior sets, 180×320 art pixels each, seen from a gently raised angle.
 * They are drawn at true scale (16×34 people, 1 m ≈ 20 px, a table 15 px high)
 * into a buffer and framed at 2× as medium shots. Every set carries signs of
 * use: a cup someone drank from, folded paper corners, a crooked poster, a
 * forgotten sock, worn chair edges. st.T is the light of the moment (world.js).
 */
const SET_W = 180, SET_H = 320;

// ------------------------------------------------------------- shared furniture
function planksFloor(x, px, py, w, h, base, alt, seam, seed) {
  rect(x, px, py, w, h, base);
  for (let y = 0, row = 0; y < h; y += 7, row++) {
    let sx = -Math.floor(hash2(row, seed) * 40);
    while (sx < w) {
      const len = 26 + Math.floor(hash3(row, sx, seed) * 26);
      if (hash3(sx, row, seed + 1) < 0.33) rect(x, px + Math.max(0, sx), py + y + 1, Math.min(len, w - Math.max(0, sx)), 6, alt);
      vline(x, px + sx + len, py + y + 1, py + y + 6, seam);
      if (hash3(sx, row, seed + 3) < 0.25) pset(x, px + sx + 6, py + y + 3, seam); // knots
      sx += len + 1;
    }
    hline(x, px, px + w - 1, py + y, seam);
  }
}
function tiles(x, px, py, w, h, a, b, s = 10) { for (let y = 0; y < h; y += s) for (let k = 0; k < w; k += s) rect(x, px + k, py + y, s, s, ((k + y) / s) % 2 ? a : b); }
function steamUp(x, px, py, t, strength = 1) {
  for (let k = 0; k < 3; k++) { const ph = mod(t * 0.55 + k / 3, 1); if (ph > strength) continue; pset(x, px + ri(Math.sin((t + k) * 2.2) * 1.3), py - ri(ph * 11), ph < 0.5 ? P.cream0 : P.stone5); }
}
// A cup seen from slightly above: rim ellipse, coffee, the handle on one side.
function cupTop(x, cx, cy, handle, t, o = {}) {
  const side = handle === 'left' ? -1 : 1;
  rect(x, cx + side * 4 - (side < 0 ? 2 : 0), cy - 1, 3, 4, P.ink); rect(x, cx + side * 4 - (side < 0 ? 1 : 0) + (side < 0 ? 0 : 0), cy, 1, 2, P.cream1);
  rect(x, cx - 4, cy - 2, 9, 7, P.ink); rect(x, cx - 3, cy - 1, 7, 5, P.cream0); hline(x, cx - 3, cx + 3, cy + 3, P.cream2);
  rect(x, cx - 2, cy - 1, 5, 2, o.empty ? P.cream2 : P.wood1); if (!o.empty) pset(x, cx - 1, cy - 1, P.wood3);
  if (o.ring) { pset(x, cx - 3, cy - 2, P.white); pset(x, cx + 3, cy - 2, P.white); }
  if (o.saucer) { hline(x, cx - 6, cx + 6, cy + 5, P.ink); hline(x, cx - 5, cx + 5, cy + 4, P.cream1); }
  if (o.steam) steamUp(x, cx, cy - 3, t, o.steam);
}
function chairSide(x, cx, fy, facing, wood, seat, o = {}) { // seat 9 px up, back on the far side
  const s = facing === 'right' ? -1 : 1, top = fy - 9;
  rect(x, cx - 6, top - 1, 13, 3, P.ink); rect(x, cx - 5, top, 11, 1, seat); if (o.worn) { pset(x, cx + 4, top, P.cream2); pset(x, cx + 5, top, P.cream2); }
  rect(x, cx - 6, top + 2, 2, 8, P.ink); rect(x, cx + 5, top + 2, 2, 8, P.ink);
  const bx = cx + s * 5; rect(x, bx - 1, top - 16, 3, 17, P.ink); rect(x, bx, top - 15, 1, 15, wood);
  rect(x, bx - (s > 0 ? 6 : 0), top - 15, 7, 2, P.ink); rect(x, bx - (s > 0 ? 5 : 0) + (s > 0 ? 0 : 1), top - 15, 5, 1, wood);
}
function tableTop(x, px, py, w, d, h, wood, top) { // a table seen from above-front: top surface d deep, apron, legs h tall
  rect(x, px, py, w, d, P.ink); rect(x, px + 1, py + 1, w - 2, d - 2, top); hline(x, px + 1, px + w - 2, py + 1, mixHex(top, P.white, 0.25));
  rect(x, px, py + d - 1, w, 4, P.ink); rect(x, px + 1, py + d - 1, w - 2, 3, wood);
  for (const lx of [px + 2, px + w - 5]) { rect(x, lx, py + d + 2, 3, h - 3, P.ink); rect(x, lx + 1, py + d + 2, 1, h - 4, wood); }
}
function paperSheet(x, px, py, w, h, o = {}) { // writing paper with ruled lines and a folded corner
  rect(x, px, py, w, h, P.ink); rect(x, px + 1, py + 1, w - 2, h - 2, P.cream0);
  for (let y = py + 3; y < py + h - 2; y += 3) hline(x, px + 2, px + w - 3, y, P.cream2);
  if (o.scribble) for (let k = 0; k < o.scribble; k++) { const ly = py + 3 + (k % Math.max(1, Math.floor((h - 4) / 3))) * 3; hline(x, px + 2 + (k * 3) % 5, px + 2 + (k * 3) % 5 + 3 + (k * 7) % (w - 8), ly - 1, P.ink2); }
  if (o.fold !== false) { rect(x, px + w - 3, py, 3, 3, P.ink); pset(x, px + w - 3, py + 1, P.cream2); pset(x, px + w - 2, py + 2, P.cream2); pset(x, px + w - 3, py + 2, P.cream3); }
}
function crumpled(x, px, py, s) { ellipse(x, px, py, 3, 2, P.ink); ellipse(x, px, py, 2, 1, P.cream1); pset(x, px - 1, py, P.cream3); pset(x, px + 1, py - 1, P.white); }
function plantPot(x, px, py, t, kind = 0) {
  block(x, px, py - 7, 9, 7, kind ? P.brick2 : P.cream2, kind ? P.brick1 : P.cream1);
  const sw = mod(t * 0.6, 2) < 1 ? 0 : 1;
  if (kind === 2) { for (let k = 0; k < 6; k++) { const a = -Math.PI / 2 + (k - 2.5) * 0.45; line(x, px + 4, py - 7, px + 4 + Math.cos(a) * 7, py - 7 + Math.sin(a) * 9, k % 2 ? P.sage3 : P.sage2); } return; }
  for (const [dx, hgt, c] of [[2, 9, P.sage3], [4, 13, P.sage2], [7, 8, P.sage3], [5, 6, P.sage1]]) { vline(x, px + dx, py - 7 - hgt, py - 7, c); ellipse(x, px + dx + (dx < 4 ? -1 : 1) + (dx === 4 ? sw : 0), py - 7 - hgt + 2, 2, 2, c); }
}
function trailing(x, px, py, len, t) { for (let k = 0; k < len; k++) { const sx = px + ri(Math.sin(k * 0.6 + t * 0.4) * 1.5); pset(x, sx, py + k, k % 3 ? P.sage2 : P.sage3); if (k % 4 === 2) { pset(x, sx - 1, py + k, P.sage1); pset(x, sx + 1, py + k + 1, P.sage2); } } }
function curtain(x, px, py, w, h, cols, breathe) { // linen panel; `breathe` (0..1) bellies it out by whole pixels
  const b = ri(breathe * 3);
  for (let y = 0; y < h; y++) { const bulge = ri(Math.sin(y / h * Math.PI) * b); rect(x, px - (bulge > 0 ? 0 : 0), py + y, w + bulge, 1, cols[0]); }
  for (let k = 0; k < 3; k++) for (let y = 2; y < h; y++) { const bulge = ri(Math.sin(y / h * Math.PI) * b * (k + 1) / 3); pset(x, px + 2 + k * 3 + bulge, py + y, cols[1]); }
  hline(x, px, px + w + b, py + h, P.ink);
}

// ------------------------------------------------------------- A's room
// Table in the middle, his chair on the left, the empty chair on the right;
// window behind with the street outside; a keyboard, a guitar, records, a bed.
const ROOM = { table: { x: 50, y: 176, w: 84, d: 22, h: 15 }, chairA: 42, chairB: 142, chairY: 214, win: { x: 98, y: 20, w: 62, h: 60 }, sill: 82 };
function roomSet(x, R, st, t) {
  const T = st.T, ox = R.x, oy = R.y, lamp = st.lamp ?? T.lights;
  const X = v => ox + v, Y = v => oy + v;
  // wall: cream plaster, a faded rectangle where a frame used to hang, the skirting
  rect(x, ox, oy, SET_W, 96, '#e9dcc0'); for (let k = 0; k < SET_W; k += 2) if (hash2(k, 3) < 0.3) vline(x, X(k), Y(2), Y(90), '#e2d3b4');
  rect(x, X(24), Y(30), 18, 22, '#efe4cb'); // pale patch
  rect(x, ox, oy, SET_W, 4, P.cream3); hline(x, ox, ox + SET_W, Y(4), P.cream4);
  rect(x, ox, Y(90), SET_W, 6, P.wood2); hline(x, ox, ox + SET_W, Y(90), P.wood3); hline(x, ox, ox + SET_W, Y(96), P.ink);
  planksFloor(x, ox, Y(97), SET_W, R.h - 97, P.wood3, '#946640', P.wood2, 7);
  // window with the street outside (opposite building, a lamp, passers-by on bikes)
  const w = ROOM.win, wx = X(w.x), wy = Y(w.y);
  rect(x, wx - 3, wy - 3, w.w + 6, w.h + 6, P.ink); rect(x, wx - 2, wy - 2, w.w + 4, w.h + 4, P.cream1);
  clip(x, { x: wx, y: wy, w: w.w, h: w.h }, () => {
    skyGrad(x, wx, wy, w.w, w.h, T);
    rect(x, wx, wy + 12, w.w, w.h, '#b06a52'); for (let y = wy + 14; y < wy + w.h; y += 3) hline(x, wx, wx + w.w, y, '#9a5946');
    for (let k = 0; k < 3; k++) { const bx = wx + 6 + k * 20; block(x, bx, wy + 18, 12, 14, T.lights > 0.5 && (k !== 1) ? P.honey1 : '#5d6a84'); vline(x, bx + 6, wy + 19, wy + 30, P.ink); }
    rect(x, wx, wy + 44, w.w, w.h, P.stone2); hline(x, wx, wx + w.w, wy + 44, P.stone3);
    if (st.cyclist !== undefined && st.cyclist > 0 && st.cyclist < 1) { const cx = wx - 20 + st.cyclist * (w.w + 40); bike(x, cx, wy + 56, st.cyclistWho, t); }
    if (st.passer) passerSil(x, wx + mod(t * 9, w.w + 30) - 15, wy + 58, t);
    shade(x, wx, wy, w.w, w.h, T.tint, T.a * 1.4);
  });
  vline(x, wx + w.w / 2, wy, wy + w.h - 1, P.cream1); hline(x, wx, wx + w.w - 1, wy + 28, P.cream1);
  if (!st.open) { pset(x, wx + 3, wy + 3, P.white); line(x, wx + 5, wy + 3, wx + 10, wy + 8, P.glass2); }
  // the sill: a trailing plant, a small cactus, a cup nobody washed
  rect(x, wx - 6, Y(ROOM.sill), w.w + 12, 4, P.ink); rect(x, wx - 5, Y(ROOM.sill), w.w + 10, 2, P.cream0); hline(x, wx - 5, wx + w.w + 4, Y(ROOM.sill + 2), P.cream3);
  plantPot(x, wx + 2, Y(ROOM.sill), t, 0); trailing(x, wx + 6, Y(ROOM.sill + 3), 14, t);
  plantPot(x, wx + w.w - 10, Y(ROOM.sill), t, 2);
  curtain(x, wx - 12, wy - 6, 8, w.h + 12, ['#d9c9a4', '#c8b48a'], st.breathe || 0);
  curtain(x, wx + w.w + 4, wy - 6, 8, w.h + 12, ['#d9c9a4', '#c8b48a'], st.breathe || 0);
  rect(x, wx - 14, wy - 8, w.w + 28, 2, P.wood1);
  // left wall: a shelf with records and a little speaker, the poster a little crooked
  rect(x, X(6), Y(20), 66, 3, P.ink); rect(x, X(7), Y(20), 64, 2, P.wood3);
  for (let k = 0; k < 9; k++) { const c = [P.brick1, P.ink2, P.honey2, P.sage3, P.cream2, P.ink3, P.brick2, P.sage2, P.stone3][k]; rect(x, X(9 + k * 3), Y(9), 2, 11, c); hline(x, X(9 + k * 3), X(10 + k * 3), Y(9), P.ink); }
  block(x, X(40), Y(12), 10, 8, P.stone1); disc(x, X(45), Y(16), 2, P.stone0); plantPot(x, X(56), Y(20), t, 1);
  // poster: drawn as rows offset by one pixel every 8 rows — a frame hung slightly off level
  for (let y = 0; y < 30; y++) { const off = Math.floor(y / 10); rect(x, X(14 + off), Y(28 + y), 22, 1, y === 0 || y === 29 ? P.ink : '#7d9bb8'); pset(x, X(14 + off), Y(28 + y), P.ink); pset(x, X(35 + off), Y(28 + y), P.ink); }
  for (let y = 3; y < 12; y++) hline(x, X(19 + Math.floor(y / 10)), X(30), Y(28 + y + 10), P.honey1); ellipse(x, X(25), Y(36), 3, 3, P.cream0);
  // guitar leaning on the wall, a keyboard on its stand
  ellipse(x, X(74), Y(82), 6, 7, P.ink); ellipse(x, X(74), Y(82), 5, 6, P.honey3); ellipse(x, X(74), Y(72), 4, 5, P.ink); ellipse(x, X(74), Y(72), 3, 4, P.honey3); ellipse(x, X(74), Y(80), 1, 1, P.ink);
  rect(x, X(73), Y(46), 2, 24, P.ink); rect(x, X(72), Y(43), 4, 4, P.wood1);
  rect(x, X(4), Y(120), 40, 8, P.ink); rect(x, X(5), Y(121), 38, 6, P.stone1); for (let k = 0; k < 18; k++) rect(x, X(6 + k * 2), Y(124), 1, 3, k % 7 === 2 || k % 7 === 5 ? P.ink : P.white);
  line(x, X(10), Y(128), X(16), Y(146), P.ink); line(x, X(38), Y(128), X(32), Y(146), P.ink);
  // bed corner (bottom right), quilt a little crumpled, a laundry basket with one sock hanging out
  rect(x, X(116), Y(258), 64, 62, P.ink); rect(x, X(117), Y(259), 63, 61, P.cream0); rect(x, X(117), Y(272), 63, 48, P.sage2);
  for (let k = 0; k < 5; k++) line(x, X(120 + k * 12), Y(276), X(126 + k * 12), Y(318), P.sage3);
  block(x, X(10), Y(262), 22, 16, P.cream2); for (let k = 0; k < 5; k++) vline(x, X(13 + k * 4), Y(264), Y(276), P.cream3); blit(x, 'sock', X(24), Y(256));
  // rug under the table; crumpled practice sheets on the floor
  rect(x, X(30), Y(198), 122, 48, P.ink); rect(x, X(31), Y(199), 120, 46, P.sage3); rect(x, X(35), Y(202), 112, 40, P.sage2);
  for (let k = 36; k < 146; k += 4) { pset(x, X(k), Y(200), P.cream1); pset(x, X(k + 2), Y(244), P.cream1); }
  for (const [cx, cy] of [[24, 186], [158, 204], [146, 248], [62, 254]]) crumpled(x, X(cx), Y(cy), 1);
  // floor lamp by the window
  rect(x, X(170), Y(108), 2, 78, P.ink); block(x, X(164), Y(100), 14, 9, lamp > 0.5 ? P.honey0 : P.cream2); block(x, X(166), Y(184), 10, 3, P.stone1);
  // the table and both chairs
  const tb = ROOM.table;
  chairSide(x, X(ROOM.chairB), Y(ROOM.chairY), 'left', P.wood2, P.wood3, { worn: true });
  tableTop(x, X(tb.x), Y(tb.y), tb.w, tb.d, tb.h, P.wood2, P.wood4);
  if (st.chairA !== false) chairSide(x, X(ROOM.chairA), Y(ROOM.chairY), 'right', P.wood2, P.wood3);
  // what's on the table
  const pp = st.paper || { x: 74, y: 181 };
  if (pp.x !== undefined) paperSheet(x, X(pp.x), Y(pp.y), 18, 12, { scribble: st.scribble ?? 5, fold: true });
  if (st.pencil !== false) { const px = X(st.pencilX ?? 94), py = Y(185); line(x, px, py, px + 8, py - 2, P.ink); line(x, px + 1, py, px + 7, py - 2, P.honey1); pset(x, px + 8, py - 2, P.cream3); }
  cupTop(x, X(st.cupX ?? 116), Y(184), st.cupHandle || 'right', t, { steam: st.steam ?? 0.6, ring: st.cupRing });
  if (st.second) { paperSheet(x, X(124), Y(179), 14, 10, { scribble: 0, fold: false }); }
  if (st.people) for (const p of st.people) { if (!p.sit) charShadow(x, X(p.x), Y(p.y)); drawChar(x, p.who, X(p.x), Y(p.y), { ...p, t }); }
  // light: sun patch from the window (moves with the hour), then the lamp at night
  if (T.sunA > 0) { x.save(); x.globalAlpha = 0.16 * T.sunA; const sx = lerp(10, 50, T.k); poly(x, [[wx, Y(96)], [wx + w.w, Y(96)], [wx + w.w - sx, Y(160)], [wx - sx, Y(160)]], T.sun); x.restore(); }
  grade(x, R, T);
  if (lamp > 0) { pool(x, X(171), Y(170), 56, 26, P.honey0, 0.45 * lamp); pool(x, X(171), Y(104), 14, 8, P.amber2, 0.55 * lamp); }
  if (st.pendant) pool(x, X(92), Y(186), 60, 22, P.honey0, 0.4 * st.pendant);
}
function bike(x, cx, gy, who, t) {
  const spin = Math.floor(t * 10) % 2;
  for (const wx of [cx - 7, cx + 7]) { ellipse(x, wx, gy - 4, 4, 4, P.ink); ellipse(x, wx, gy - 4, 3, 3, P.stone3); pset(x, wx + spin, gy - 4, P.ink); }
  line(x, cx - 7, gy - 4, cx, gy - 9, P.brick1); line(x, cx, gy - 9, cx + 7, gy - 4, P.brick1); line(x, cx - 2, gy - 9, cx + 5, gy - 9, P.brick1);
  if (who) { rect(x, cx - 3, gy - 20, 6, 10, who === 'B' ? P.sage2 : P.ink2); disc(x, cx, gy - 23, 3, P.hairB1); if (who === 'B') rect(x, cx - 3, gy - 27, 7, 2, P.brick1); line(x, cx + 2, gy - 16, cx + 5, gy - 10, P.skin0); }
}
function passerSil(x, cx, fy, t) { rect(x, cx - 3, fy - 16, 6, 10, P.ink2); disc(x, cx, fy - 19, 3, P.ink1); const s = Math.floor(t * 6) % 2; rect(x, cx - 2 + s, fy - 6, 2, 6, P.ink1); rect(x, cx + 1 - s, fy - 6, 2, 6, P.ink1); }

// ------------------------------------------------------------- the café
// A long window onto the street, a round table by it (B's place), a counter
// with a pastry case, a chalkboard, pendant lamps. Checked floor.
const CAFE = { win: { x: 8, y: 14, w: 164, h: 70 }, table: { cx: 92, y: 176 }, chairB: 66, chairY: 210, door: 150 };
function cafeSet(x, R, st, t) {
  const T = st.T, ox = R.x, oy = R.y, X = v => ox + v, Y = v => oy + v, lights = Math.max(0.35, T.lights);
  rect(x, ox, oy, SET_W, 100, '#c9d3b0'); for (let y = 6; y < 96; y += 6) hline(x, ox, ox + SET_W, Y(y), '#bfcaa5'); // sage panelling
  rect(x, ox, Y(92), SET_W, 8, P.wood2); hline(x, ox, ox + SET_W, Y(92), P.wood3); hline(x, ox, ox + SET_W, Y(100), P.ink);
  tiles(x, ox, Y(101), SET_W, R.h - 101, P.cream1, '#d8ccb0', 10);
  for (let y = 101; y < R.h; y += 10) hline(x, ox, ox + SET_W, Y(y), '#cdbf9f');
  // the window: the street outside, reversed lettering on the glass, plants on the sill
  const w = CAFE.win, wx = X(w.x), wy = Y(w.y);
  rect(x, wx - 3, wy - 3, w.w + 6, w.h + 6, P.ink); rect(x, wx - 2, wy - 2, w.w + 4, w.h + 4, P.wood1);
  clip(x, { x: wx, y: wy, w: w.w, h: w.h }, () => {
    skyGrad(x, wx, wy, w.w, w.h, T);
    for (let k = 0; k < 6; k++) { const bx = wx - 10 + k * 32 - ri(st.outsideX || 0) % 32; rect(x, bx, wy + 10 + (k % 2) * 6, 30, w.h, k % 2 ? '#a7685a' : '#c9a079'); for (let r = 0; r < 3; r++) block(x, bx + 6, wy + 16 + (k % 2) * 6 + r * 14, 8, 9, T.lights > 0.5 ? P.honey1 : '#64708a'); }
    rect(x, wx, wy + 54, w.w, 20, P.stone2); hline(x, wx, wx + w.w, wy + 54, P.stone3); hline(x, wx, wx + w.w, wy + 62, P.stone1);
    if (st.tramOut !== undefined) tramSide(x, wx + st.tramOut, wy + 66, 0.5, T, t, { small: true });
    if (st.noteOut) noteSprite(x, st.noteOut.x + wx, st.noteOut.y + wy, t, 1);
    for (const pz of st.passers || []) passerSil(x, wx + pz, wy + 64, t + pz);
    // reflection: a pale diagonal and the room's lamps
    x.save(); x.globalAlpha = 0.18; poly(x, [[wx + 20, wy], [wx + 34, wy], [wx + 14, wy + w.h], [wx, wy + w.h]], P.white); poly(x, [[wx + 110, wy], [wx + 118, wy], [wx + 98, wy + w.h], [wx + 90, wy + w.h]], P.white); x.restore();
  });
  for (const k of [55, 110]) vline(x, wx + k, wy, wy + w.h - 1, P.wood1);
  text(x, 'ÉFAC', wx + 140, wy + 4, P.cream0, FONT.tiny); // CAFÉ, seen from inside
  rect(x, wx - 5, Y(86), w.w + 10, 5, P.ink); rect(x, wx - 4, Y(86), w.w + 8, 3, P.wood3);
  plantPot(x, wx + 4, Y(86), t, 2); plantPot(x, wx + 70, Y(86), t, 0); plantPot(x, wx + 150, Y(86), t, 1); trailing(x, wx + 74, Y(89), 8, t);
  // pendant lamps
  for (const lx of [40, 92, 144]) { vline(x, X(lx), oy, Y(8), P.ink); poly(x, [[X(lx - 5), Y(14)], [X(lx + 5), Y(14)], [X(lx + 3), Y(9)], [X(lx - 3), Y(9)]], P.ink); hline(x, X(lx - 4), X(lx + 4), Y(13), P.honey1); }
  // chalkboard
  block(x, X(130), Y(30), 38, 46, P.sage5); text(x, '今日', X(134), Y(33), P.cream1, FONT.tiny);
  const board = st.board || ['拿铁', '手冲', '柠檬茶'];
  board.forEach((s, i) => { text(x, s, X(134), Y(44 + i * 10), st.boardHi === i ? P.honey0 : P.cream2, FONT.tiny); });
  // the barista behind the counter (moves with st.barista), shelves of beans and cups
  rect(x, X(120), Y(54), 50, 3, P.ink); rect(x, X(121), Y(54), 48, 2, P.wood3); for (let k = 0; k < 6; k++) { block(x, X(123 + k * 8), Y(46), 6, 8, [P.honey3, P.cream1, P.wood2, P.cream1, P.honey2, P.cream0][k]); }
  if (st.barista !== false) { const b = st.barista || {}; drawChar(x, 'C', X(b.x ?? 155), Y(b.y ?? 122), { dir: b.dir || 'front', pose: b.pose || 'down', holding: b.holding, walk: b.walk, t, face: b.face }); rect(x, X((b.x ?? 155) - 4), Y((b.y ?? 122) - 18), 9, 9, P.cream1); } // apron
  block(x, X(118), Y(118), 62, 30, P.wood2, P.wood3); rect(x, X(118), Y(114), 62, 5, P.ink); rect(x, X(119), Y(115), 60, 3, P.cream1);
  block(x, X(122), Y(102), 24, 13, P.glass2); for (let k = 0; k < 3; k++) ellipse(x, X(127 + k * 7), Y(110), 2, 1, [P.honey2, P.brick1, P.honey1][k]);
  block(x, X(164), Y(98), 14, 17, P.stone2); rect(x, X(167), Y(104), 8, 3, P.stone0); pset(x, X(171), Y(109), P.ink);
  // a second table: a regular reading the paper, a cat asleep on the chair next to him
  tableTop(x, X(20), Y(244), 44, 14, 12, P.wood1, P.wood3);
  drawChar(x, 'C', X(14), Y(276), { dir: 'right', sit: true, pose: 'book', t, face: 'down' }); rect(x, X(16), Y(244), 14, 4, P.cream1); hline(x, X(17), X(28), Y(245), P.stone3);
  cupTop(x, X(46), Y(249), 'right', t, { steam: 0.3 });
  chairSide(x, X(74), Y(276), 'left', P.wood1, P.sage3); ellipse(x, X(74), Y(264), 6, 3, P.ink); ellipse(x, X(74), Y(264), 5, 2, P.honey2); ellipse(x, X(70), Y(263), 2, 2, P.honey2); pset(x, X(69), Y(261), P.ink);
  // a shelf of books and board games on the back wall's lower part
  block(x, X(152), Y(150), 26, 60, P.wood2); for (let r = 0; r < 3; r++) { rect(x, X(154), Y(168 + r * 18), 22, 2, P.wood1); for (let k = 0; k < 5; k++) rect(x, X(155 + k * 4), Y(156 + r * 18), 3, 12, [P.brick1, P.ink3, P.honey2, P.sage3, P.cream2][(k + r) % 5]); }
  // B's round table by the window and its chairs
  const tb = CAFE.table;
  chairSide(x, X(tb.cx + 26), Y(CAFE.chairY), 'left', P.wood1, P.sage3, { worn: true });
  ellipse(x, X(tb.cx), Y(tb.y + 8), 24, 9, P.ink); ellipse(x, X(tb.cx), Y(tb.y + 7), 23, 8, P.cream1); ellipse(x, X(tb.cx), Y(tb.y + 6), 22, 7, P.cream0);
  rect(x, X(tb.cx - 1), Y(tb.y + 16), 3, 14, P.ink); rect(x, X(tb.cx - 6), Y(tb.y + 29), 13, 3, P.ink);
  if (st.chairB !== false) chairSide(x, X(CAFE.chairB), Y(CAFE.chairY), 'right', P.wood1, P.sage3);
  if (st.cup !== false) cupTop(x, X(st.cupX ?? tb.cx + 8), Y(tb.y + 4), st.handle || 'right', t, { saucer: true, steam: st.steam ?? 0.5, empty: st.cupEmpty });
  if (st.napkin) { rect(x, X(tb.cx - 14), Y(tb.y + 1), 11, 8, P.ink); rect(x, X(tb.cx - 13), Y(tb.y + 2), 9, 6, P.white); blitTiny(x, X(tb.cx - 11), Y(tb.y + 3)); }
  if (st.sketchbook) { block(x, X(tb.cx - 14), Y(tb.y), 14, 9, P.cream0); vline(x, X(tb.cx - 7), Y(tb.y + 1), Y(tb.y + 7), P.cream2); }
  // foreground: monstera leaves at the bottom-left corner, a chair back on the right (closer, darker)
  foreground(x, R, T, 'counter', 'chair');
  grade(x, R, T);
  for (const lx of [40, 92, 144]) pool(x, X(lx), Y(40), 26, 24, P.honey0, 0.22 * lights);
  pool(x, X(92), Y(184), 40, 14, P.honey0, 0.25 * lights);
}
// The little bird B keeps drawing: a round body on a line, a dot of an eye, a tail.
function birdDoodle(x, px, py, col = P.ink1, s = 1) { // a pen doodle: round body, head, beak, wing, tail, legs on a wire
  const q = v => ri(v * s), lw = Math.max(1, Math.floor(s / 2.5));
  const ring = (cx, cy, rx, ry) => { for (let a = 0; a < 96; a++) { const an = a / 96 * TAU; rect(x, cx + Math.cos(an) * rx, cy + Math.sin(an) * ry, lw, lw, col); } };
  hline(x, px - q(8), px + q(12), py + q(5), col); if (lw > 1) hline(x, px - q(8), px + q(12), py + q(5) + 1, col); // the wire
  ellipse(x, px, py, q(5), q(4), P.white); ellipse(x, px + q(4), py - q(3), q(3), q(3), P.white);
  ring(px, py, q(5), q(4)); ring(px + q(4), py - q(3), q(3), q(3));
  ellipse(x, px + q(4), py - q(1.5), q(2.5), q(2), P.white); // merge the neck
  for (let k = 0; k < q(3); k++) rect(x, px + q(7) + k, py - q(3) + ri(k / 2), lw, lw, col); for (let k = 0; k < q(3); k++) rect(x, px + q(7) + k, py - q(3) + q(1.2), lw, lw, col); // beak
  rect(x, px + q(4.6), py - q(3.6), Math.max(1, q(0.9)), Math.max(1, q(0.9)), col); // eye
  for (let k = 0; k <= q(4); k++) rect(x, px - q(2) + k, py - q(0.5) + ri(Math.sin(k / q(4) * Math.PI) * q(1.2)), lw, lw, col); // wing
  for (let k = 0; k <= q(3); k++) { rect(x, px - q(5) - k, py - q(0.5) - ri(k * 0.6), lw, lw, col); rect(x, px - q(5) - k, py + q(0.5) + ri(k * 0.2), lw, lw, col); } // tail
  for (const lx of [-1, 1.5]) for (let k = 0; k <= q(1.5); k++) rect(x, px + q(lx), py + q(3.6) + k, lw, lw, col); // legs
}
function blitTiny(x, px, py) { hline(x, px, px + 6, py + 3, P.ink1); rect(x, px + 2, py + 1, 3, 2, P.ink1); pset(x, px + 5, py + 1, P.ink1); pset(x, px + 1, py, P.ink1); }

// ------------------------------------------------------------- the laundromat
const LAUNDRY = { machines: [22, 66, 110, 154], bench: { x: 24, y: 176 } };
function laundrySet(x, R, st, t) {
  const T = st.T, ox = R.x, oy = R.y, X = v => ox + v, Y = v => oy + v;
  tiles(x, ox, oy, SET_W, 112, P.cream0, '#efe6d2', 8); for (let y = 0; y < 112; y += 8) hline(x, ox, ox + SET_W, Y(y), P.cream2); for (let k = 0; k < SET_W; k += 8) vline(x, X(k), oy, Y(112), P.cream2);
  rect(x, ox, Y(108), SET_W, 4, P.sage3); hline(x, ox, ox + SET_W, Y(112), P.ink);
  rect(x, ox, Y(113), SET_W, R.h - 113, '#b9c2a0'); for (let k = 0; k < SET_W; k += 12) for (let y = 113; y < R.h; y += 12) pset(x, X(k + (y % 24 ? 6 : 0)), Y(y + 6), '#aab493');
  // shelf of detergent, a clock, the notice board, a radio playing
  rect(x, X(10), Y(16), 80, 3, P.ink); rect(x, X(11), Y(16), 78, 2, P.wood3);
  for (let k = 0; k < 7; k++) { const c = [P.ink3, P.brick1, P.sage2, P.honey1, P.cream2, P.ink2, P.brick0][k]; block(x, X(13 + k * 10), Y(6), 8, 10, c); rect(x, X(15 + k * 10), Y(9), 4, 3, P.white); }
  ellipse(x, X(112), Y(18), 7, 7, P.ink); ellipse(x, X(112), Y(18), 6, 6, P.white); line(x, X(112), Y(18), X(112), Y(14), P.ink); line(x, X(112), Y(18), X(115), Y(19), P.ink);
  block(x, X(128), Y(8), 44, 30, P.wood4); for (const [nx, ny, c] of [[132, 12, P.cream0], [146, 11, P.honey0], [158, 14, P.sage0], [136, 24, P.cream1], [152, 25, P.brick0]]) { block(x, X(nx), Y(ny), 11, 10, c); pset(x, X(nx + 5), Y(ny + 1), P.brick2); }
  // the machines: round glass doors with clothes tumbling
  for (const [i, mx] of LAUNDRY.machines.entries()) {
    block(x, X(mx - 18), Y(52), 36, 58, P.white, P.cream0); rect(x, X(mx - 17), Y(53), 34, 9, P.cream1);
    rect(x, X(mx + 6), Y(56), 8, 3, P.ink); pset(x, X(mx + 8), Y(57), i === st.active ? P.sage1 : P.brick1); pset(x, X(mx - 12), Y(57), P.ink2);
    const cy = Y(84), spin = (st.spin?.[i] ?? 0);
    ellipse(x, X(mx), cy, 13, 13, P.ink); ellipse(x, X(mx), cy, 12, 12, P.stone4); ellipse(x, X(mx), cy, 10, 10, P.ink1);
    washerClothes(x, X(mx), cy, 9, spin, i, t);
    pset(x, X(mx - 5), cy - 6, P.white); pset(x, X(mx - 4), cy - 7, P.white);
    if (i === st.noteOn) noteSprite(x, X(mx) - 3, cy - 18, t, 1);
  }
  // folding table with a stack of folded shirts, a cart, the detergent machine
  tableTop(x, X(124), Y(150), 50, 16, 14, P.stone2, P.stone4);
  rect(x, X(116), Y(214), 36, 22, P.ink); rect(x, X(117), Y(215), 34, 20, P.stone3); for (let k = 0; k < 5; k++) vline(x, X(120 + k * 7), Y(216), Y(234), P.stone2);
  for (const wx of [120, 148]) { ellipse(x, X(wx), Y(240), 3, 3, P.ink); pset(x, X(wx), Y(240), P.stone3); } rect(x, X(150), Y(206), 2, 10, P.ink); hline(x, X(146), X(154), Y(206), P.ink);
  rect(x, X(122), Y(208), 22, 8, P.cream0); rect(x, X(126), Y(206), 8, 4, P.brick0);
  block(x, X(4), Y(120), 18, 44, P.ink3); rect(x, X(7), Y(124), 12, 16, P.glass2); for (let k = 0; k < 6; k++) rect(x, X(8 + (k % 3) * 4), Y(126 + Math.floor(k / 3) * 7), 2, 5, [P.brick0, P.honey1, P.sage1][k % 3]); rect(x, X(9), Y(150), 8, 3, P.ink);
  for (let k = 0; k < 3; k++) block(x, X(130 + k * 13), Y(146 - k), 11, 6, [P.sage1, P.cream0, P.brick0][k]);
  // the bench with someone waiting (and the sock someone left)
  const b = LAUNDRY.bench;
  rect(x, X(b.x), Y(b.y - 10), 70, 3, P.ink); rect(x, X(b.x + 1), Y(b.y - 10), 68, 2, P.wood3); rect(x, X(b.x + 2), Y(b.y - 7), 2, 7, P.ink); rect(x, X(b.x + 66), Y(b.y - 7), 2, 7, P.ink);
  blit(x, 'sock', X(b.x + 52), Y(b.y - 15));
  block(x, X(b.x + 72), Y(b.y - 12), 16, 12, P.cream2); for (let k = 0; k < 4; k++) vline(x, X(b.x + 75 + k * 3), Y(b.y - 10), Y(b.y - 2), P.cream3);
  const w = st.waiter; if (w) waitingPerson(x, X(b.x + 22), Y(b.y), w, t);
  if (st.people) for (const p of st.people) { charShadow(x, X(p.x), Y(p.y)); drawChar(x, p.who, X(p.x), Y(p.y), { ...p, t }); }
  foreground(x, R, T, 'basket', 'plant');
  grade(x, R, T);
  pool(x, X(90), Y(60), 90, 30, P.white, 0.12);
}
function washerClothes(x, cx, cy, r, ang, seed, t) {
  const cols = [[P.brick1, P.sage2, P.cream1], [P.ink3, P.honey1, P.white], [P.sage1, P.brick0, P.ink2], [P.cream0, P.ink3, P.honey2]][seed % 4];
  for (let k = 0; k < 7; k++) {
    const a = ang + k * 0.9 + Math.sin(k * 3.1) * 0.3, rr = r * (0.35 + 0.55 * hash(k + seed * 10));
    const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr + (Math.sin(a) > 0.2 ? 2 : 0); // clothes fall at the bottom of the drum
    rect(x, px - 2, py - 1, 4 + (k % 2), 3, cols[k % 3]);
  }
  x.save(); x.globalAlpha = 0.35; ellipse(x, cx, cy + 5, r - 1, 3, P.glass2); x.restore();
}
function waitingPerson(x, fx, fy, w, t) { // seated passer-by: bored foot-swing, later toe-tapping
  const kick = w.mode === 'swing' ? ri(Math.sin(t * 3) * 2) : 0;
  rect(x, fx - 5, fy - 30, 10, 14, P.honey3); rect(x, fx - 4, fy - 29, 8, 12, P.honey2);
  disc(x, fx, fy - 34, 4, P.ink); disc(x, fx, fy - 34, 3, P.skin1); rect(x, fx - 4, fy - 38, 8, 3, P.ink1);
  rect(x, fx - 4, fy - 17, 9, 4, P.ink2);
  const tap = w.tap ? 1 : 0;
  rect(x, fx + 3, fy - 14, 3, 9 + kick, P.ink2); rect(x, fx + 3 + kick, fy - 5 + kick - tap, 5, 2, P.stone0);
  rect(x, fx - 2, fy - 14, 3, 9, P.ink1); rect(x, fx - 2, fy - 5, 5, 2, P.stone0);
  if (w.headphones) { hline(x, fx - 3, fx + 3, fy - 39, P.ink); rect(x, fx - 5, fy - 35, 2, 3, P.brick1); rect(x, fx + 4, fy - 35, 2, 3, P.brick1); }
}

// ------------------------------------------------------------- inside the tram
function tramInterior(x, R, st, t) {
  const T = st.T, ox = R.x, oy = R.y, X = v => ox + v, Y = v => oy + v, sp = st.speed ?? 1;
  rect(x, ox, oy, SET_W, R.h, P.cream1);
  rect(x, ox, oy, SET_W, 14, P.cream2); hline(x, ox, ox + SET_W, Y(14), P.cream3);
  for (let k = 0; k < SET_W; k += 22) rect(x, X(k + 6), Y(4), 10, 3, T.lights > 0.4 ? P.honey0 : P.cream0);
  // windows with the city sliding past (three depths, each at its own speed)
  for (let i = 0; i < 3; i++) {
    const wx = X(8 + i * 58), wy = Y(30), ww = 48, wh = 50;
    rect(x, wx - 3, wy - 3, ww + 6, wh + 6, P.ink); rect(x, wx - 2, wy - 2, ww + 4, wh + 4, P.honey2);
    clip(x, { x: wx, y: wy, w: ww, h: wh }, () => {
      skyGrad(x, wx, wy, ww, wh, T);
      for (let k = 0; k < 12; k++) { const bx = wx + mod(k * 26 - t * 10 * sp - i * 58, 300) - 40, hgt = 18 + hash(k) * 22; rect(x, bx, wy + wh - hgt - 8, 22, hgt + 8, T.k > 0.7 ? '#2a3150' : '#a6b0bf'); }
      for (let k = 0; k < 10; k++) { const bx = wx + mod(k * 40 - t * 34 * sp - i * 58, 360) - 50, hgt = 24 + hash(k + 9) * 16; rect(x, bx, wy + wh - hgt, 30, hgt, k % 2 ? '#b06a52' : '#c9a079'); for (let r = 0; r < 2; r++) rect(x, bx + 6, wy + wh - hgt + 5 + r * 10, 6, 5, T.lights > 0.5 ? P.honey1 : '#5d6a84'); }
      for (let k = 0; k < 4; k++) { const px = wx + mod(k * 90 - t * 110 * sp - i * 58, 360) - 40; rect(x, px, wy, 2, wh, P.stone1); }
      if (st.noteOut && i === st.noteOut.win) noteSprite(x, wx + st.noteOut.x, wy + st.noteOut.y, t, 1);
      x.save(); x.globalAlpha = 0.16; poly(x, [[wx + 8, wy], [wx + 16, wy], [wx + 6, wy + wh], [wx - 2, wy + wh]], P.white); x.restore();
    });
  }
  // rail and swinging straps
  hline(x, ox, ox + SET_W, Y(18), P.stone2); hline(x, ox, ox + SET_W, Y(19), P.stone3);
  for (let k = 12; k < SET_W; k += 18) { const sw = ri(Math.sin(t * 2.4 + k * 0.1) * (st.sway ?? 1.5)); line(x, X(k), Y(19), X(k + sw), Y(26), P.stone1); ellipse(x, X(k + sw), Y(28), 2, 2, P.ink); pset(x, X(k + sw), Y(28), P.cream1); }
  // the long bench, its edge worn pale where people sit
  rect(x, ox, Y(96), SET_W, 20, P.ink); rect(x, ox, Y(97), SET_W, 18, P.honey3); for (let k = 0; k < SET_W; k += 30) vline(x, X(k), Y(97), Y(114), P.honey4);
  rect(x, ox, Y(116), SET_W, 8, P.ink); rect(x, ox, Y(117), SET_W, 6, P.brick2); hline(x, ox, ox + SET_W, Y(117), P.brick1);
  for (let k = 8; k < SET_W; k += 30) { hline(x, X(k), X(k + 12), Y(117), P.brick0); }
  rect(x, ox, Y(124), SET_W, R.h - 124, P.stone3); for (let k = 0; k < SET_W; k += 6) vline(x, X(k), Y(124), Y(R.h), P.stone2);
  if (st.people) for (const p of st.people) drawChar(x, p.who, X(p.x), Y(p.y), { ...p, t });
  // poles
  for (const px of [48, 132]) { rect(x, X(px), Y(14), 3, R.h, P.ink); rect(x, X(px + 1), Y(14), 1, R.h, P.stone4); }
  // foreground: the backs of the seats on our side, closer and darker
  for (const sx of [0, 64, 128]) { rect(x, X(sx), Y(250), 56, R.h - 250, P.ink); rect(x, X(sx + 2), Y(252), 52, R.h - 252, mixHex(P.honey4, P.ink, 0.35)); hline(x, X(sx + 2), X(sx + 53), Y(252), mixHex(P.honey3, P.ink, 0.3)); rect(x, X(sx + 2), Y(262), 52, 2, mixHex(P.brick3, P.ink, 0.3)); }
  grade(x, R, T);
  if (T.sunA > 0) { const lx = X(mod(t * 20 * sp, SET_W + 80) - 40); x.save(); x.globalAlpha = 0.14 * T.sunA; poly(x, [[lx, Y(96)], [lx + 30, Y(96)], [lx + 50, Y(R.h)], [lx + 20, Y(R.h)]], T.sun); x.restore(); }
}

// ------------------------------------------------------------- the amber note
// Drawn as a small ink-and-honey sprite with a light around it; `a` fades it.
function noteSprite(x, px, py, t, a = 1, big = 1) {
  if (a <= 0) return;
  const bob = ri(Math.sin(t * 5) * 1);
  glow(x, px + 3, py + 4 + bob, 9 * big, 9 * big, P.amber2, 0.5 * a);
  x.save(); x.globalAlpha = a; blit(x, 'note', px, py + bob, { scale: big }); x.restore();
}

// Out-of-focus foreground at the bottom of an interior (closer to the lens, so darker and simpler).
function leaf(x, cx, cy, len, ang, col, rib) { // a pointed leaf with a midrib
  const ca = Math.cos(ang), sa = Math.sin(ang), w = len * 0.32, tip = [cx + ca * len, cy + sa * len], mid = [cx + ca * len * 0.45, cy + sa * len * 0.45];
  poly(x, [[cx, cy], [mid[0] - sa * w - 1, mid[1] + ca * w + 1], tip, [mid[0] + sa * w + 1, mid[1] - ca * w - 1]], P.ink);
  poly(x, [[cx, cy], [mid[0] - sa * w, mid[1] + ca * w], tip, [mid[0] + sa * w, mid[1] - ca * w]], col);
  line(x, cx, cy, ri(cx + ca * len * 0.85), ri(cy + sa * len * 0.85), rib);
}
function foreground(x, R, T, left, right) {
  const dark = mixHex(P.sage5, P.ink, 0.25), dark2 = mixHex(P.sage4, P.ink, 0.3);
  const by = R.y + R.h;
  if (left === 'counter') { // the camera sits behind the bar: its edge, a sugar jar, a spoon in a glass
    rect(x, R.x, by - 14, R.w, 14, P.ink); rect(x, R.x, by - 13, R.w, 13, mixHex(P.wood2, P.ink, 0.4)); hline(x, R.x, R.x + R.w, by - 13, mixHex(P.wood4, P.ink, 0.35));
    block(x, R.x + 14, by - 30, 12, 17, mixHex(P.glass2, P.ink, 0.35)); rect(x, R.x + 16, by - 22, 8, 8, mixHex(P.white, P.ink, 0.35)); rect(x, R.x + 13, by - 33, 14, 4, mixHex(P.stone3, P.ink, 0.35));
    block(x, R.x + 40, by - 24, 8, 11, mixHex(P.glass2, P.ink, 0.4)); line(x, R.x + 46, by - 30, R.x + 43, by - 16, mixHex(P.stone4, P.ink, 0.3));
  }
  if (left === 'basket') { rect(x, R.x - 4, by - 34, 46, 40, P.ink); rect(x, R.x - 3, by - 33, 44, 38, mixHex(P.cream3, P.ink, 0.45)); for (let k = 0; k < 8; k++) vline(x, R.x + k * 6, by - 32, by, mixHex(P.cream4, P.ink, 0.5)); rect(x, R.x + 4, by - 40, 22, 8, mixHex(P.sage1, P.ink, 0.45)); rect(x, R.x + 18, by - 42, 14, 6, mixHex(P.brick0, P.ink, 0.45)); }
  if (right === 'chair') { rect(x, R.x + R.w - 26, by - 60, 4, 60, P.ink); rect(x, R.x + R.w - 26, by - 60, 30, 4, P.ink); rect(x, R.x + R.w - 25, by - 59, 28, 2, mixHex(P.wood2, P.ink, 0.45)); rect(x, R.x + R.w - 25, by - 59, 2, 59, mixHex(P.wood2, P.ink, 0.45)); }
  if (right === 'plant') { const cx = R.x + R.w - 14; for (const [a, l] of [[-2.0, 26], [-1.6, 32], [-1.2, 28], [-2.4, 22], [-0.9, 20]]) leaf(x, cx, by - 16, l, a, dark, dark2); block(x, cx - 10, by - 18, 22, 20, mixHex(P.brick2, P.ink, 0.45)); }
}
