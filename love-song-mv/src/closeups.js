'use strict';
/*
 * Close-ups. Same pixel size as everything else, just more pixels: hands, paper,
 * the cup, the washer window, the tram wheel, the napkin, the sketchbook. Sleeves
 * and cuffs match the full-figure sprites (his deep green jacket with a cream tee
 * cuff showing; her sage knit with a cream cuff).
 *
 * The motif: his rhythm is four taps (front half) that her three taps answer
 * (back half). Positions are in beats of the measured beat grid (data/phrases.js).
 */
const MOTIF = { front: [0, 1, 1.5, 2], back: [0, 0.5, 1] };
const BEAT = () => (window.PHRASES ? PHRASES.beat : 60 / 115.7);
// Is a tap of the motif "down" at time t, for a motif half starting at t0? (each tap holds ~0.14 s)
function tapDown(t, t0, half) { const b = BEAT(); return MOTIF[half].some(p => t >= t0 + p * b && t < t0 + p * b + 0.14); }
function tapIndex(t, t0, half) { const b = BEAT(); return MOTIF[half].findIndex(p => t >= t0 + p * b && t < t0 + p * b + 0.14); }

// ------------------------------------------------------------- the big hand (palm down, fingers to the right)
// lift: per finger 0..1 (index, middle, ring, little); a lifted finger is drawn a
// unit shorter with its shadow left behind on the surface, and two small tap marks.
function bigHand(x, who, cx, cy, o = {}) {
  const k = o.k || 4, facing = o.facing || 1, kind = o.kind || 'rest';
  const X = ri(cx), Y = ri(cy), q = v => ri(v * k);
  x.save(); if (facing < 0) { x.translate(X * 2, 0); x.scale(-1, 1); }
  const lift = o.lift || [0, 0, 0, 0];
  const fingers = kind === 'point' ? [[12, -6, 11, 3.2], [11, -2.6, 5, 3.2], [10, 0.6, 4.5, 3], [9.5, 3.4, 4, 2.6]]
    : kind === 'pinch' ? [[12, -6, 6, 3.2], [12, -2.6, 5.5, 3.2], [11, 0.6, 5, 3], [10, 3.4, 4.5, 2.6]]
      : [[12, -6, 9.5, 3.2], [12, -2.6, 10.5, 3.2], [12, 0.8, 9.5, 3], [11.5, 3.9, 7.5, 2.6]];
  const thumb = kind === 'pinch' ? [9, -10, 7, 3.6] : [4.5, -10.2, 6.5, 4];
  const skin = P.skin0, sh = P.skin1, deep = P.skin2;
  // shadows on the surface first (offset down-right), so lifted fingers leave theirs behind
  if (o.shadow !== false) { x.save(); x.globalAlpha = 0.22; rect(x, X + q(1), Y - q(5), q(13), q(13), P.ink); fingers.forEach(([a, b, w, h], i) => rect(x, X + q(a + 1), Y + q(b + 1.4), q(w), q(h), P.ink)); x.restore(); }
  const rr = (px, py, w, h, col, r = 1) => { rect(x, px + r, py, w - 2 * r, h, col); rect(x, px, py + r, w, h - 2 * r, col); if (r > 1) rect(x, px + 1, py + 1, w - 2, h - 2, col); };
  const parts = [[0, -6.5, 12.5, 13], thumb, ...fingers.map(([a, b, w, h], i) => [a, b - lift[i] * 1.1, w - lift[i] * 1.0, h])];
  for (const [a, b, w, h] of parts) rr(X + q(a) - 1, Y + q(b) - 1, q(w) + 2, q(h) + 2, P.ink, 2);
  for (const [a, b, w, h] of parts) rr(X + q(a), Y + q(b), q(w), q(h), skin, 2);
  // fingers: shading, separations, nails, knuckle creases
  parts.slice(2).forEach(([a, b, w, h], i) => {
    const fx = X + q(a), fy = Y + q(b), fw = q(w), fh = q(h);
    hline(x, fx, fx + fw - 2, fy + fh - 1, sh); hline(x, fx + 2, fx + fw - q(3), fy + 1, '#fde3cb');
    if (i < 3) hline(x, fx + q(0.5), fx + Math.min(fw, q(parts[i + 3][2])) - 2, fy + fh, P.ink);
    rect(x, fx + fw - q(2.2), fy + 2, q(1.7), Math.max(1, fh - 4), '#fbe2d0'); vline(x, fx + fw - q(2.2), fy + 2, fy + fh - 3, sh); // nail
    pset(x, fx + fw - 1, fy, P.ink); pset(x, fx + fw - 1, fy + fh - 1, P.ink);
    for (const j of [3.2, 6.4]) if (q(j) < fw - q(2.5)) { pset(x, fx + q(j), fy + (fh >> 1), sh); pset(x, fx + q(j), fy + (fh >> 1) + 1, sh); }
    if (lift[i] > 0.5) { pset(x, fx + fw + 3, fy - 3, P.ink); pset(x, fx + fw + 5, fy - 2, P.ink); pset(x, fx + fw + 3, fy + fh + 2, P.ink); } // tap marks
  });
  { const [a, b, w, h] = thumb; hline(x, X + q(a), X + q(a) + q(w) - 2, Y + q(b) + q(h) - 1, sh); rect(x, X + q(a) + q(w) - q(2), Y + q(b) + 2, q(1.5), q(h) - 4, '#fbe2d0'); }
  // back of the hand: tendon lines and the knuckle row
  for (let j = 0; j < 4; j++) { pset(x, X + q(11.2), Y + q(-5 + j * 3.3), deep); line(x, X + q(4), Y + q(-3 + j * 2.4), X + q(10), Y + q(-4.6 + j * 3.2), sh); }
  rect(x, X, Y + q(4), q(12), q(2.5), sh);
  // sleeve
  const S = who === 'A' ? { a: '#3b5b54', b: '#2b433f', c: '#56796e', cuff: P.cream1 } : { a: P.sage2, b: P.sage3, c: P.sage1, cuff: P.cream0 };
  const sw = q(24), shh = q(17);
  rect(x, X - sw - 1, Y - q(8.5) - 1, sw + 2, shh + 2, P.ink);
  rect(x, X - sw, Y - q(8.5), sw, shh, S.a); rect(x, X - sw, Y + q(4.5), sw, q(4), S.b); hline(x, X - sw, X - 2, Y - q(8.5), S.c);
  if (who === 'B') for (let yy = Y - q(8) ; yy < Y + q(8); yy += 3) for (let xx = X - sw + 2; xx < X - q(4); xx += 4) pset(x, xx + ((yy / 3) % 2) * 2, yy, S.c); // knit
  else for (let j = 1; j < 4; j++) line(x, X - sw + q(j * 6), Y - q(7), X - sw + q(j * 6) + q(2), Y + q(3), S.b); // creases
  rect(x, X - q(3.5), Y - q(8.5), q(3), shh, S.cuff); vline(x, X - q(0.5), Y - q(8.5), Y + q(8.5) - 1, P.ink); // the cuff
  if (who === 'A') rect(x, X - q(14), Y - q(5), q(1.5), q(1.5), P.honey1); // the button
  if (o.pencil) { line(x, X + q(10), Y - q(9), X + q(22), Y - q(14), P.ink); line(x, X + q(10), Y - q(8), X + q(22), Y - q(13), P.honey1); line(x, X + q(11), Y - q(8), X + q(21), Y - q(12), P.honey2); pset(x, X + q(22), Y - q(14), P.cream3); }
  x.restore();
}
function woodTable(x, R, warm = 0, seed = 3, T) {
  rect(x, R.x, R.y, R.w, R.h, mixHex(P.wood3, P.honey3, warm));
  for (let y = 0; y < R.h; y += 3) { const off = ri(Math.sin(y * 0.05 + seed) * 8); for (let k = -10; k < R.w; k += 26) if (hash2(k + seed, y) < 0.5) hline(x, R.x + k + off, R.x + k + off + 10 + ri(hash2(y, k) * 12), R.y + y, mixHex(P.wood2, P.honey3, warm * 0.6)); }
  for (let k = 0; k < 3; k++) { const kx = R.x + 40 + hash(seed + k) * (R.w - 80), ky = R.y + 30 + hash(seed + k + 9) * (R.h - 60); ellipse(x, kx, ky, 6, 3, P.wood2); ellipse(x, kx, ky, 3, 1, P.wood1); }
  for (let y = 0; y < R.h; y += 70) hline(x, R.x, R.x + R.w, R.y + y + 64, P.wood1);
  if (T && T.sunA > 0) { x.save(); x.globalAlpha = 0.16 * T.sunA; poly(x, [[R.x + 60, R.y], [R.x + 210, R.y], [R.x + 130, R.y + R.h], [R.x - 20, R.y + R.h]], T.sun); x.restore(); }
}

// ------------------------------------------------------------- the paper (top-down)
// Five-line staves in pencil, a few notes, crossings-out; a folded corner. Variants:
// st.crowd 0..1 — rewrites pile up until the lines choke the page;
// st.back — the reverse side: blank except the short motif.
function paperClose(x, R, st, t) {
  const pw = 250, ph = 330, px = ri(R.x + (R.w - pw) / 2 + (st.dx || 0)), py = ri(R.y + (R.h - ph) / 2 + (st.dy || 0));
  x.save(); x.globalAlpha = 0.25; rect(x, px + 6, py + 8, pw, ph, P.ink); x.restore();
  rect(x, px - 1, py - 1, pw + 2, ph + 2, P.ink); rect(x, px, py, pw, ph, P.cream0);
  for (let k = 0; k < 40; k++) pset(x, px + hash(k) * pw, py + hash(k + 3) * ph, P.cream1); // paper tooth
  const fold = 22; poly(x, [[px + pw - fold, py], [px + pw, py], [px + pw, py + fold]], P.wood3); poly(x, [[px + pw - fold, py], [px + pw - fold, py + fold], [px + pw, py + fold]], P.cream2); line(x, px + pw - fold, py, px + pw, py + fold, P.ink); line(x, px + pw - fold, py + fold, px + pw, py + fold, P.cream3);
  if (st.back) {
    motifInk(x, px + 70, py + 150, 1.6, P.ink1);
    if (st.melody) text(x, 'Melody', px + 80, py + 210, P.ink2, FONT.ui);
    if (st.bird) birdDoodle(x, px + 140, py + 120, P.ink1, 3);
    if (st.dot) { disc(x, st.dot.x + px, st.dot.y + py, 2, P.ink); }
    return { px, py, pw, ph };
  }
  // staves
  for (let s = 0; s < 6; s++) { const sy = py + 34 + s * 48; for (let l = 0; l < 5; l++) hline(x, px + 16, px + pw - 16, sy + l * 4, P.ink4); }
  // the original motif, top left
  motifInk(x, px + 26, py + 34, 1, P.ink1);
  // later attempts: notes and crossings-out; st.scrib how many lines have been tried
  const n = st.scrib ?? 3;
  for (let s = 1; s < 6; s++) for (let j = 0; j < 6; j++) {
    if (s * 6 + j > n * 6 + 4) continue;
    const nx = px + 30 + j * 34, ny = py + 34 + s * 48 + 4 + ((j * 5 + s * 3) % 4) * 2;
    ellipse(x, nx, ny, 2, 1, P.ink1); vline(x, nx + 2, ny - 10, ny, P.ink1);
    if ((j + s) % 3 === 0) { line(x, nx - 6, ny - 8, nx + 10, ny + 4, P.brick2); line(x, nx - 6, ny - 6, nx + 10, ny + 6, P.brick2); }
  }
  if (st.crowd > 0) { // the page chokes: dense pixel lines grow over the staves, the first motif squeezed into its corner
    const c = st.crowd, r = rng(7);
    for (let k = 0; k < 700 * c; k++) {
      const a = r() * TAU, cx = px + 40 + r() * (pw - 60), cy = py + 70 + r() * (ph - 100), len = 6 + r() * 26, swirl = st.swirl || 0;
      const ang = a + swirl * Math.sin(cx * 0.05 + cy * 0.04 + t * 0.6);
      line(x, cx, cy, cx + Math.cos(ang) * len, cy + Math.sin(ang) * len, [P.ink1, P.ink2, P.ink3, P.brick2, P.ink0][k % 5]);
    }
    rect(x, px + 18, py + 22, 70, 30, P.cream0); motifInk(x, px + 26, py + 34, 1, P.ink1);
  }
  if (st.emerge !== undefined) { // ink gathering into the amber note
    const e = st.emerge, cx = px + 52, cy = py + 30;
    if (e > 0 && e < 0.5) { const wob = ri(Math.sin(t * 18) * 2 * (1 - e)); ellipse(x, cx + wob, cy, 3 + ri(e * 6), 2 + ri(e * 4), P.ink1); ellipse(x, cx + wob, cy, 1 + ri(e * 4), 1 + ri(e * 2), mixHex(P.ink1, P.amber, e * 2)); }
  }
  return { px, py, pw, ph };
}
// The motif in ink: four notes (front half) and a rest where the answer belongs.
function motifInk(x, px, py, s, col) {
  const q = v => ri(v * s);
  for (let l = 0; l < 5; l++) hline(x, px - q(6), px + q(60), py + q(l * 4), col === P.ink1 ? P.ink4 : col);
  [[0, 12], [14, 8], [22, 8], [30, 4]].forEach(([dx, dy]) => { ellipse(x, px + q(dx), py + q(dy), q(2.4), q(1.6), col); vline(x, px + q(dx + 2.4), py + q(dy) - q(12), py + q(dy), col); });
  hline(x, px + q(16.4), px + q(24.4), py - q(4), col); hline(x, px + q(16.4), px + q(24.4), py - q(3), col);
  for (let k = 0; k < 3; k++) { pset(x, px + q(42 + k * 6), py + q(8), col); pset(x, px + q(42 + k * 6), py + q(9), col); } // three dots where the rest of it should go
}

// ------------------------------------------------------------- the cup (from slightly above)
// handle: angle of the handle in radians (0 = to the right); ripples: list of start times.
function cupClose(x, R, st, t) {
  const T = st.T, S = st.s || 1.7, q = v => ri(v * S), cx = R.x + R.w / 2 + (st.dx || 0), cy = R.y + R.h / 2 + (st.dy || 0);
  if (st.bg !== false) woodTable(x, R, 0.2, 8, T);
  ellipse(x, cx + q(4), cy + q(30), q(92), q(40), mixHex(P.ink, P.wood1, 0.5));
  ellipse(x, cx, cy + q(22), q(90), q(38), P.ink); ellipse(x, cx, cy + q(21), q(88) - 1, q(36) - 1, P.cream0); ellipse(x, cx, cy + q(19), q(70), q(27), P.cream1); ellipse(x, cx, cy + q(18), q(58), q(22), P.cream0);
  const ha = st.handle ?? 0, hx = cx + Math.cos(ha) * q(64), hy = cy + Math.sin(ha) * q(22) + q(8), back = Math.sin(ha) < -0.2;
  const drawHandle = () => { ellipse(x, hx, hy, q(15), q(11), P.ink); ellipse(x, hx, hy, q(15) - 2, q(11) - 2, P.cream1); ellipse(x, hx, hy, q(8), q(5), P.ink); ellipse(x, hx, hy, q(8) - 1, q(5) - 1, mixHex(P.wood3, P.cream2, 0.4)); hline(x, hx - q(8), hx + q(6), hy - q(8), P.white); };
  if (back) drawHandle();
  ellipse(x, cx, cy + q(14), q(56), q(30), P.ink); ellipse(x, cx, cy + q(12), q(56) - 1, q(28), P.cream1); rect(x, cx - q(56) + 1, cy - q(6), q(112) - 1, q(18), P.cream1); vline(x, cx - q(56), cy - q(6), cy + q(12), P.ink); vline(x, cx + q(56), cy - q(6), cy + q(12), P.ink);
  for (let y = -q(4); y < q(24); y += 2) pset(x, cx + q(40), cy + y, P.cream2); rect(x, cx - q(46), cy, q(6), q(12), P.white);
  if (!back) drawHandle();
  ellipse(x, cx, cy - q(6), q(57), q(22), P.ink); ellipse(x, cx, cy - q(6), q(57) - 1, q(22) - 1, P.cream0); ellipse(x, cx, cy - q(5), q(50), q(18), P.ink);
  const coffee = st.coffee || P.wood1; ellipse(x, cx, cy - q(4), q(50) - 1, q(18) - 1, coffee); ellipse(x, cx - q(6), cy - q(7), q(30), q(9), mixHex(coffee, P.honey3, 0.3));
  if (st.latte) { ellipse(x, cx + q(2), cy - q(4), q(18), q(7), P.cream1); ellipse(x, cx + q(2), cy - q(4), q(12), q(4), mixHex(P.cream1, coffee, 0.5)); ellipse(x, cx + q(2), cy - q(4), q(6), q(2), P.cream1); }
  for (const r0 of st.ripples || []) {
    const u = (t - r0) / 1.6; if (u < 0 || u > 1) continue;
    const rx = q(6 + u * 44), ry = q(2 + u * 15), col = u < 0.5 ? P.cream1 : mixHex(coffee, P.cream1, 1 - u);
    for (let a = 0; a < 96; a++) { if (a % 2) continue; const an = a / 96 * TAU; pset(x, cx + Math.cos(an) * rx, cy - q(4) + Math.sin(an) * ry, col); }
  }
  hline(x, cx - q(36), cx - q(12), cy - q(22), P.white); pset(x, cx + q(30), cy - q(21), P.white);
  if (st.steam) for (let k = 0; k < 5; k++) { const ph = mod(t * 0.35 + k / 5, 1); const sx = cx - q(20) + k * q(10) + ri(Math.sin(t * 1.5 + k) * 4), sy = cy - q(30) - ri(ph * q(70)); x.save(); x.globalAlpha = (1 - ph) * 0.5 * st.steam; rect(x, sx, sy, 3, 6, P.white); x.restore(); }
  return { cx, cy, S };
}

// ------------------------------------------------------------- washer window and tram wheel
function washerClose(x, R, st, t) {
  const cx = R.x + R.w / 2, cy = R.y + R.h / 2, r = 130;
  rect(x, R.x, R.y, R.w, R.h, P.white); for (let y = R.y; y < R.y + R.h; y += 2) if (hash2(y, 1) < 0.2) hline(x, R.x, R.x + R.w, y, P.cream0);
  ellipse(x, cx, cy, r + 14, r + 14, P.ink); ellipse(x, cx, cy, r + 12, r + 12, P.stone4); ellipse(x, cx, cy, r + 6, r + 6, P.stone3); ellipse(x, cx, cy, r + 2, r + 2, P.ink);
  ellipse(x, cx, cy, r, r, P.ink1);
  const cols = [P.brick1, P.sage2, P.cream1, P.ink3, P.honey1, P.white, P.brick0, P.sage1];
  const ang = st.spin || 0;
  for (let k = 0; k < 18; k++) {
    const a = ang + k * 0.73 + Math.sin(k * 2.7) * 0.4, rr = r * (0.25 + 0.65 * hash(k + 4));
    const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr + (Math.sin(a) > 0 ? 10 : 0);
    const w = 18 + hash(k) * 16, h = 10 + hash(k + 1) * 8;
    rect(x, px - w / 2 - 1, py - h / 2 - 1, w + 2, h + 2, P.ink); rect(x, px - w / 2, py - h / 2, w, h, cols[k % cols.length]); hline(x, px - w / 2, px + w / 2 - 1, py + h / 2 - 2, mixHex(cols[k % cols.length], P.ink, 0.3));
    if (k === 5) { for (let j = 0; j < 4; j++) pset(x, px - 6 + j * 4, py, P.ink3); } // a stripe on a shirt
  }
  // water at the bottom, then glass reflections
  x.save(); x.globalAlpha = 0.35; ellipse(x, cx, cy + r * 0.6, r * 0.8, r * 0.3, P.glass2); x.restore();
  x.save(); x.globalAlpha = 0.25; poly(x, [[cx - 80, cy - 100], [cx - 40, cy - 115], [cx - 100, cy + 40], [cx - 118, cy]], P.white); x.restore();
  pset(x, cx - 70, cy - 90, P.white);
  if (st.note) noteSprite(x, cx + st.note.x, cy + st.note.y, t, st.note.a ?? 1, 3);
}
function wheelClose(x, R, st, t) {
  const T = st.T, cx = R.x + R.w / 2, cy = R.y + R.h / 2 + 30, r = 110;
  rect(x, R.x, R.y, R.w, R.h, mixHex(P.honey2, P.ink1, T.k * 0.5));
  rect(x, R.x, R.y, R.w, 120, mixHex(P.cream0, P.ink1, T.k * 0.5)); rect(x, R.x, R.y + 120, R.w, 14, P.brick1);
  ellipse(x, cx, cy, r + 4, r + 4, P.ink); ellipse(x, cx, cy, r, r, P.stone1); ellipse(x, cx, cy, r - 12, r - 12, P.stone2); ellipse(x, cx, cy, 22, 22, P.ink); ellipse(x, cx, cy, 18, 18, P.stone3);
  const a0 = st.spin || 0;
  for (let k = 0; k < 8; k++) { const a = a0 + k * TAU / 8; for (let w = -2; w <= 2; w++) line(x, cx + Math.cos(a) * 20 + w * Math.sin(a), cy + Math.sin(a) * 20 - w * Math.cos(a), cx + Math.cos(a) * (r - 14) + w * Math.sin(a), cy + Math.sin(a) * (r - 14) - w * Math.cos(a), w ? P.stone3 : P.stone4); }
  ellipse(x, cx, cy, 10, 10, P.honey1);
  rect(x, R.x, cy + r - 2, R.w, 12, P.stone4); rect(x, R.x, cy + r + 10, R.w, R.y + R.h - cy - r - 10, P.stone0); for (let k = -mod(ri(t * 400), 30); k < R.w; k += 30) rect(x, R.x + k, cy + r + 18, 18, 6, P.wood1);
  if (st.spark) for (let k = 0; k < 4; k++) pset(x, cx + 40 + hash(k + Math.floor(t * 20)) * 30, cy + r - 4 - hash(k + 7 + Math.floor(t * 20)) * 8, P.amber2);
}

// ------------------------------------------------------------- napkin, sketchbook
function napkinClose(x, R, st, t) {
  const T = st.T; rect(x, R.x, R.y, R.w, R.h, P.cream1); for (let k = 0; k < 120; k++) pset(x, R.x + hash(k) * R.w, R.y + hash(k + 50) * R.h, P.cream2); // the café table's marble-ish top
  const cx = R.x + R.w / 2, cy = R.y + R.h / 2;
  x.save(); x.globalAlpha = 0.2; rect(x, cx - 100, cy - 90, 210, 200, P.ink); x.restore();
  rect(x, cx - 106, cy - 96, 212, 196, P.ink); rect(x, cx - 105, cy - 95, 210, 194, P.white);
  for (let k = 0; k < 210; k += 6) { pset(x, cx - 105 + k, cy - 92, P.cream1); pset(x, cx - 105 + k, cy + 95, P.cream1); } // embossed edge
  vline(x, cx, cy - 95, cy + 98, P.cream1);
  // a coffee ring from the cup she moved
  for (let a = 0; a < 80; a++) { const an = a / 80 * TAU; if (a % 7 < 5) pset(x, cx + 50 + Math.cos(an) * 30, cy + 46 + Math.sin(an) * 30, mixHex(P.wood3, P.white, 0.5)); }
  const d = st.draw ?? 1; // how much of the doodle is drawn (0..1)
  clip(x, { x: cx - 100, y: cy - 90, w: ri(200 * Math.min(1, d * 1.2)), h: 190 }, () => { birdDoodle(x, cx - 50, cy - 20, P.ink1, 6); for (let k = 0; k < 3; k++) { ellipse(x, cx + 30 + k * 18, cy - 26 + (k % 2) * 6, 3, 2, P.ink1); vline(x, cx + 33 + k * 18, cy - 38 + (k % 2) * 6, cy - 26 + (k % 2) * 6, P.ink1); } });
  if (st.finger) bigHand(x, 'A', cx - 150 + st.finger * 40, cy + 70, { kind: 'point', k: 3 });
}
function sketchClose(x, R, st, t) {
  rect(x, R.x, R.y, R.w, R.h, P.cream1);
  const cx = R.x + R.w / 2, cy = R.y + R.h / 2 - 20;
  rect(x, cx - 150, cy - 110, 300, 230, P.ink); rect(x, cx - 149, cy - 109, 298, 228, P.sage3); rect(x, cx - 146, cy - 106, 292, 222, P.cream0);
  vline(x, cx, cy - 106, cy + 115, P.cream2); for (let y = cy - 100; y < cy + 112; y += 8) { pset(x, cx - 1, y, P.stone3); pset(x, cx + 1, y, P.stone3); }
  // left page: windows, a cup, a tram — her day in quick lines; right page: birds on a wire
  for (let k = 0; k < 3; k++) { rect(x, cx - 130 + k * 40, cy - 80, 26, 30, P.ink2); rect(x, cx - 129 + k * 40, cy - 79, 24, 28, P.cream0); vline(x, cx - 117 + k * 40, cy - 79, cy - 52, P.ink3); }
  ellipse(x, cx - 90, cy + 20, 16, 6, P.ink2); ellipse(x, cx - 90, cy + 20, 15, 5, P.cream0); line(x, cx - 74, cy + 16, cx - 68, cy + 22, P.ink2);
  rect(x, cx - 136, cy + 60, 110, 22, P.ink2); rect(x, cx - 135, cy + 61, 108, 20, P.cream0); for (let k = 0; k < 5; k++) rect(x, cx - 128 + k * 20, cy + 64, 12, 8, P.ink3);
  const n = st.birds ?? 4;
  for (let l = 0; l < 2; l++) { const wy = cy - 50 + l * 70; for (let k = 0; k < 140; k++) pset(x, cx + 10 + k, wy + ri(Math.sin(k / 140 * Math.PI) * 6), P.ink2); }
  [[30, -64], [62, -60], [86, -62], [118, -58], [40, 6], [74, 10], [104, 8]].slice(0, n).forEach(([bx, by], i) => birdDoodle(x, cx + bx, cy + by, i === n - 1 && st.fresh ? P.ink0 : P.ink1, 2));
  if (st.hand) bigHand(x, 'B', cx + 140 + (st.hx || 0), cy + 20 + (st.hy || 0), { kind: 'pinch', k: 3, facing: -1, pencil: false });
  if (st.hand) { const px = cx + 140 + (st.hx || 0) - 36, py = cy + 20 + (st.hy || 0) - 30; line(x, px, py, px - 30, py + 34, P.ink); line(x, px + 1, py, px - 29, py + 34, P.honey1); pset(x, px - 30, py + 34, P.ink); }
}
