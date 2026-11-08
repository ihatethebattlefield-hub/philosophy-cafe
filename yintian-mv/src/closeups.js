'use strict';
/*
 * Close-ups. Each is drawn on a 180×320 buffer and shown at 2×, the same pixel size as
 * the sets, so there is one pixel grid through the whole film. The thing in close-up is
 * simply drawn bigger and with more pixels: the photo, its back, the receipt, the ashtray,
 * the key dish, the drying rack, the table from above. Hands are built from outlined
 * shapes: sleeve and cuff, the back of the hand, four fingers with nails, the thumb.
 * Every close-up function keeps the 360×640 coordinates the story passes in and halves them.
 */
const CW = 180, CH = 320, CB = canvas(CW, CH);
function closeBegin() { const c = CB.x; c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; rect(c, 0, 0, CW, CH, P.void); return c; }
function closeEnd(x, R) { x.imageSmoothingEnabled = false; x.drawImage(CB.c, 0, 0, CW, CH, R.x, R.y, R.w, R.h); }
const SLEEVE = { W: [P.blue1, P.blue2, P.blue0, P.blue3], M: [P.olive1, P.olive2, P.olive0, P.olive3] };
const SKIN = { base: P.skin0, shade: P.skin1, dark: P.skin2, edge: mixHex(P.skin2, P.ink, 0.45), nail: mixHex(P.skin0, P.white, 0.45), hi: mixHex(P.skin0, P.white, 0.25) };

// ------------------------------------------------------------- hands from above
// A hand seen from above (back of the hand up). (wx, wy) is the wrist, `ang` the direction the
// fingers point, `left` mirrors it into a left hand. kind: 'flat' | 'pinch' | 'cup' | 'hold' | 'drop'.
// part: 'all' | 'back' (sleeve, palm, fingers) | 'thumb' (only the thumb, to lie over a thing held).
function handTop(c, wx, wy, ang, kind = 'flat', o = {}) {
  const s = o.s || 2, who = o.who || 'W', part = o.part || 'all', S = SLEEVE[who];
  const d = [Math.cos(ang), Math.sin(ang)], m = o.left ? -1 : 1, p = [-d[1] * m, d[0] * m];
  const W = (u, v) => [wx + (d[0] * v + p[0] * u) * s, wy + (d[1] * v + p[1] * u) * s];
  const sk = { outline: SKIN.edge };
  if (part !== 'thumb') {
    // sleeve with its cuff ribbing
    const sl = o.sleeve ?? 30;
    shape(c, [W(-7.5, -sl), W(7.5, -sl), W(7.2, -0.5), W(-7.2, -0.5)], S[0], { shade: S[1], shadeDir: [p[0] * -m, p[1] * -m].map(Math.round), shadeW: 2 * s, hi: S[2], hiDir: [Math.round(p[0] * m), Math.round(p[1] * m)] });
    for (let k = -7; k <= 7; k += 1.5) { const [a0, a1] = W(k, -4.2), [b0, b1] = W(k, -0.8); line(c, a0, a1, b0, b1, S[1]); }
    { const [a0, a1] = W(-7, -4.6), [b0, b1] = W(7, -4.6); line(c, a0, a1, b0, b1, S[3]); }
    for (let k = 0; k < 3; k++) { const [a0, a1] = W(-5 + k * 4, -sl * 0.8), [b0, b1] = W(-3 + k * 4, -8); line(c, a0, a1, b0, b1, S[1]); } // folds of the knit
    // the back of the hand
    const fing = kind === 'cup' ? [4, 4.5, 4.2, 3.6] : kind === 'pinch' ? [8.5, 4.5, 4, 3.4] : kind === 'hold' ? [3, 3, 2.8, 2.4] : kind === 'drop' ? [8, 8.6, 8.2, 7] : [8.2, 9, 8.6, 7.2];
    const spread = kind === 'flat' ? 0.025 : kind === 'drop' ? 0.12 : 0.03;
    for (let i = 3; i >= 0; i--) { // fingers, little finger first so the index lies on top
      const u0 = -3.9 + i * 2.6, a = (i - 1.5) * spread, L = fing[i], w = i === 3 ? 1.1 : 1.3;
      const tipU = u0 + Math.sin(a) * L, tipV = 10.5 + Math.cos(a) * L;
      shape(c, [W(u0 - w, 9.5), W(u0 + w, 9.5), W(tipU + w * 0.9, tipV - 0.6), W(tipU, tipV + 0.4), W(tipU - w * 0.9, tipV - 0.6)], SKIN.base, { ...sk, shade: SKIN.shade, shadeDir: [Math.round(p[0] * -m), Math.round(p[1] * -m)], shadeW: 1 });
      if (L > 5) { const [n0, n1] = W(tipU, tipV - 1.2); pset(c, n0, n1, SKIN.nail); const [k0, k1] = W(u0 + Math.sin(a) * L * 0.55, 10.5 + Math.cos(a) * L * 0.55); pset(c, k0, k1, SKIN.shade); }
    }
    shape(c, [W(-5.4, 0), W(5.2, 0), W(6.2, 6), W(5.4, 10.6), W(-5.2, 10.8), W(-6, 5)], SKIN.base, { ...sk, shade: SKIN.shade, shadeDir: [Math.round(p[0] * -m), Math.round(p[1] * -m)], shadeW: 2, hi: SKIN.hi, hiDir: [Math.round(d[0]), Math.round(d[1])] });
    for (let i = 0; i < 4; i++) { const [k0, k1] = W(-3.9 + i * 2.6, 9.6); pset(c, k0, k1, SKIN.dark); const [t0, t1] = W(-3.4 + i * 2.4, 5); pset(c, t0, t1, SKIN.shade); } // knuckles, tendons
    { const [a0, a1] = W(-4, 1.5), [b0, b1] = W(4, 1.5); line(c, a0, a1, b0, b1, mixHex(SKIN.base, SKIN.shade, 0.5)); } // the wrist crease
  }
  if (part !== 'back') { // the thumb, from the side of the hand
    const tk = kind === 'pinch' ? [[-5.6, 3], [-8, 8], [-5.4, 14.6]] : kind === 'cup' ? [[-5.6, 3], [-8.6, 7], [-8, 11]] : kind === 'hold' ? [[-5.6, 4], [-6.5, 10], [-4 + (o.thumb || 0), 16]] : [[-5.6, 3], [-9, 7], [-10.4, 11.5]];
    const th = 1.5, pts = [];
    for (let i = 0; i < tk.length; i++) { const [u, v] = tk[i], [nu, nv] = tk[Math.min(i + 1, tk.length - 1)], [pu, pv] = tk[Math.max(i - 1, 0)], du = nu - pu, dv = nv - pv, n = Math.hypot(du, dv) || 1; pts.push([u - dv / n * th, v + du / n * th]); }
    const back = []; for (let i = tk.length - 1; i >= 0; i--) { const [u, v] = tk[i], [nu, nv] = tk[Math.min(i + 1, tk.length - 1)], [pu, pv] = tk[Math.max(i - 1, 0)], du = nu - pu, dv = nv - pv, n = Math.hypot(du, dv) || 1; back.push([u + dv / n * th, v - du / n * th]); }
    const last = tk[tk.length - 1], prev = tk[tk.length - 2], dl = Math.hypot(last[0] - prev[0], last[1] - prev[1]) || 1;
    const tip = [last[0] + (last[0] - prev[0]) / dl * 1.2, last[1] + (last[1] - prev[1]) / dl * 1.2];
    shape(c, [...pts, tip, ...back].map(([u, v]) => W(u, v)), SKIN.base, { ...sk, shade: SKIN.shade, shadeDir: [Math.round(p[0] * -m), Math.round(p[1] * -m)], shadeW: 1, hi: SKIN.hi, hiDir: [Math.round(p[0] * m), Math.round(p[1] * m)] });
    const [n0, n1] = W(last[0] + (last[0] - prev[0]) / dl * 0.1, last[1] + (last[1] - prev[1]) / dl * 0.1); pset(c, n0, n1, SKIN.nail); pset(c, n0 + Math.round(p[0]), n1 + Math.round(p[1]), SKIN.nail);
    const [j0, j1] = W(tk[1][0] + 0.6, tk[1][1]); pset(c, j0, j1, SKIN.shade);
  }
}

// ------------------------------------------------------------- the table top seen from above
function tableTop(c, per = 'now', o = {}) {
  const early = per === 'early', base = early ? P.wood4 : P.wood3, dark = early ? P.wood3 : P.wood2, seam = P.wood1, hi = mixHex(base, P.white, 0.18);
  rect(c, 0, 0, CW, CH, base);
  for (let y = 0, r = 0; y < CH; y += 26, r++) {
    for (let k = 0; k < 16; k++) { const gy = y + 3 + ri(hash2(k, r) * 20), gx = ri(hash2(r, k + 9) * CW) - 20, len = 24 + ri(hash2(k + 4, r) * 60); for (let j = 0; j < len; j++) pset(c, gx + j, gy + ri(Math.sin((gx + j) * 0.07 + k) * 1.2), k % 3 ? mixHex(base, dark, 0.45) : dark); }
    if (hash(r + 5) < 0.25) { const kx = ri(hash(r * 3 + 1) * (CW - 30)) + 15, ky = y + 9 + ri(hash(r + 2) * 8); ellipse(c, kx, ky, 6, 2, dark); ellipse(c, kx, ky, 3, 1, seam); for (let j = -14; j <= 14; j++) if (Math.abs(j) > 6) pset(c, kx + j, ky + ri(Math.sign(j) * 0) - (Math.abs(j) < 10 ? 3 : 2), mixHex(base, dark, 0.5)); }
    hline(c, 0, CW - 1, y, seam); hline(c, 0, CW - 1, y + 1, hi);
    const sx = ri(hash(r * 7 + 3) * CW); vline(c, sx, y + 1, y + 25, seam); pset(c, sx + 1, y + 2, hi);
  }
  for (let k = 0; k < 14; k++) { const x0 = ri(hash(k * 13) * CW), y0 = ri(hash(k * 17) * CH); line(c, x0, y0, x0 + 4 + ri(hash(k) * 8), y0 + ri(hash(k + 3) * 3) - 1, mixHex(base, P.white, 0.25)); } // fine scratches
  if (o.ring !== false) { const rx = o.ringX ?? 132, ry = o.ringY ?? 92; for (let a = 0; a < 40; a++) { if (a % 9 > 6) continue; const ang = a / 40 * TAU; pset(c, rx + ri(Math.cos(ang) * 12), ry + ri(Math.sin(ang) * 12), mixHex(base, dark, 0.7)); } } // an old cup ring
  for (let k = 0; k < 40; k++) pset(c, ri(hash(k * 29) * CW), ri(hash(k * 31) * CH), mixHex(base, P.white, 0.4)); // dust
}
function tableLight(c, per = 'now') { // the window's light across the top, the grade of the period, a vignette
  const early = per === 'early';
  const lc = early ? P.honey0 : P.mist2, pane = [[-10, -10], [120, -10], [70, 150], [-60, 150]];
  lightSteps(c, pane, lc, [[[0, 0], early ? 0.1 : 0.08]]);
  c.save(); c.globalAlpha = 0.07; poly(c, [[50, -10], [56, -10], [6, 150], [0, 150]], P.ink); poly(c, [[-40, 66], [96, 66], [94, 72], [-42, 72]], P.ink); c.restore(); // the window bars' shadow
  shade(c, 0, 0, CW, CH, LOOKS[per].tint, LOOKS[per].tintA * 0.45);
  c.save(); c.globalAlpha = 0.1; rect(c, CW - 14, 0, 14, CH, P.ink); rect(c, 0, CH - 12, CW, 12, P.ink); c.globalAlpha = 0.06; rect(c, CW - 26, 0, 12, CH, P.ink); c.restore();
}
// things on the table, from above
function cupTop(c, cx, cy, o = {}) {
  cx = ri(cx); cy = ri(cy); const r = o.r || 11, his = o.his;
  contactShadow(c, cx + 3, cy + 3, r + 1, r - 1, 0.25);
  // handle on the left
  { const ha = o.handle ?? Math.PI, hd = [Math.cos(ha), Math.sin(ha)], hp = [-hd[1], hd[0]], Hh = (a, b) => [cx + hd[0] * a + hp[0] * b, cy + hd[1] * a + hp[1] * b];
    shape(c, [Hh(r - 2, -4), Hh(r + 7, -3.5), Hh(r + 8, 0), Hh(r + 7, 3.5), Hh(r - 2, 4)], his ? P.honey1 : P.white, { shade: his ? P.honey2 : P.cream2, shadeDir: [0, 1], shadeW: 1 });
    const [i0, i1] = Hh(r + 3, 0); rect(c, i0 - 1, i1 - 1, 3, 2, his ? P.honey3 : P.cream3); }
  disc(c, cx, cy, r + 1, P.ink); disc(c, cx, cy, r, his ? P.honey1 : P.white); disc(c, cx, cy, r - 2, his ? P.honey2 : P.cream1);
  const lv = o.level ?? 0.7;
  if (lv > 0) { disc(c, cx, cy, r - 3, o.cold ? '#8a6a4a' : '#9a6e3e'); disc(c, cx + 1, cy + 1, r - 5, o.cold ? '#7a5c40' : '#865a30'); pset(c, cx - 3, cy - 4, '#c9a070'); pset(c, cx - 2, cy - 4, '#c9a070'); }
  else { disc(c, cx, cy, r - 3, his ? P.honey2 : P.cream2); for (let k = 0; k < 5; k++) pset(c, cx - 2 + k, cy + 3 + (k % 2), '#b89a76'); } // a dry stain at the bottom
  for (let a = -2.6; a < -1.2; a += 0.15) pset(c, cx + ri(Math.cos(a) * (r - 1)), cy + ri(Math.sin(a) * (r - 1)), P.white); // glaze highlight
  if (o.steam) for (let k = 0; k < 3; k++) { const ph = mod((o.t || 0) * 0.45 + k / 3, 1); for (let j = 0; j < 5; j++) { const yy = cy - 4 - ri(ph * 26) - j * 2; if (yy > cy - 34) { c.save(); c.globalAlpha = 0.5 * (1 - ph); pset(c, cx - 4 + k * 4 + ri(Math.sin((o.t || 0) * 1.6 + k + j * 0.6) * 2), yy, P.white); c.restore(); } } }
}
function penTop(c, x0, y0, x1, y1) {
  const n = Math.hypot(x1 - x0, y1 - y0), px = -(y1 - y0) / n, py = (x1 - x0) / n;
  shape(c, [[x0 + px * 1.6, y0 + py * 1.6], [x1 + px * 1.6, y1 + py * 1.6], [x1 - px * 1.6, y1 - py * 1.6], [x0 - px * 1.6, y0 - py * 1.6]], P.blue2, { shade: P.blue3, shadeDir: [0, 1], shadeW: 1, hi: P.blue0, hiDir: [0, -1] });
  const ex = x1 + (x1 - x0) / n * 4, ey = y1 + (y1 - y0) / n * 4; line(c, x1, y1, ex, ey, P.slate4); pset(c, ex, ey, P.ink);
  line(c, x0 + (x1 - x0) * 0.12 + px * 2, y0 + (y1 - y0) * 0.12 + py * 2, x0 + (x1 - x0) * 0.35 + px * 2, y0 + (y1 - y0) * 0.35 + py * 2, P.slate4); // the clip
}
function ashtrayTop(c, cx, cy, o = {}) {
  cx = ri(cx); cy = ri(cy); const t = o.t || 0, r = o.r || 18;
  contactShadow(c, cx + 3, cy + 4, r + 2, r - 2, 0.3);
  disc(c, cx, cy, r + 1, P.ink); disc(c, cx, cy, r, mixHex(P.glass, P.slate4, 0.25)); disc(c, cx, cy, r - 3, mixHex(P.glass2, P.glass, 0.4)); disc(c, cx, cy, r - 5, mixHex(P.glass, P.slate3, 0.3));
  for (const a of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) { const nx = cx + ri(Math.cos(a) * (r - 1)), ny = cy + ri(Math.sin(a) * (r - 1)); rect(c, nx - 1, ny - 1, 3, 3, mixHex(P.slate4, P.slate3, 0.5)); } // rests
  for (let a = -2.8; a < -1.4; a += 0.12) pset(c, cx + ri(Math.cos(a) * (r - 1)), cy + ri(Math.sin(a) * (r - 1)), P.white);
  for (let k = 0; k < 18; k++) { const a = hash(k * 3) * TAU, rr2 = hash(k * 5) * (r - 7); pset(c, cx + ri(Math.cos(a) * rr2), cy + ri(Math.sin(a) * rr2), k % 3 ? P.slate4 : P.slate3); } // ash
  // two stubs and the one still lit, resting on the right notch
  for (const [dx, dy] of [[-6, 3], [-2, 6]]) { rect(c, cx + dx - 2, cy + dy - 1, 5, 3, P.ink); rect(c, cx + dx - 1, cy + dy, 3, 1, P.honey1); }
  const lit = o.cig !== false; if (lit) {
    const x0 = cx + r - 1, y0 = cy - 1, x1 = cx + 4, y1 = cy - 3;
    rect(c, x0, y0 - 1, 9, 4, P.ink); rect(c, x0, y0, 8, 2, P.honey1); // the filter over the rim
    rect(c, x1 - 1, y1 - 1, x0 - x1 + 1, 4, P.ink); rect(c, x1, y1, x0 - x1, 2, P.white); hline(c, x1, x0 - 1, y1 + 1, P.cream1);
    rect(c, x1 - 4, y1 - 1, 4, 4, P.ink); rect(c, x1 - 3, y1, 3, 2, P.slate4); pset(c, x1 - 2, y1, P.cream2); // the ash
    if (o.ember) { const fl = Math.floor(t * 6) % 3; pset(c, x1 - 4, y1, fl ? P.red0 : P.honey1); pset(c, x1 - 4, y1 + 1, P.red1); if (fl === 2) pset(c, x1 - 5, y1, P.honey0); }
    const sm = o.smoke || 0; if (sm > 0) for (let k = 0; k < 46; k++) { const v = k / 46; if (v > sm) break; const ph = t * 0.9; const sx = x1 - 4 + ri(Math.sin(ph + k * 0.22) * (1 + v * 9) + Math.sin(ph * 0.6 + k * 0.07) * v * 6), sy = y1 - 1 - k * 2; c.save(); c.globalAlpha = 0.55 * (1 - v) * Math.min(1, (sm - v) * 6); pset(c, sx, sy, P.smoke); if (v > 0.3) pset(c, sx + 1, sy, P.smoke); c.restore(); }
  }
}
function receiptTop(c, px, py, o = {}) { // a folded receipt seen from above (small)
  px = ri(px); py = ri(py); const w = o.w || 30, h = o.h || 44;
  contactShadow(c, px + w / 2 + 2, py + h / 2 + 2, w / 2, h / 2 - 2, 0.2);
  shape(c, [[px, py], [px + w, py + 1], [px + w - 1, py + h], [px + 1, py + h - 1]], P.cream0, { shade: P.cream2, shadeDir: [1, 1], shadeW: 1, hi: P.white, hiDir: [0, -1] });
  hline(c, px + 2, px + w - 2, py + 16, P.cream2); // the fold
  for (let k = 0; k < 7; k++) hline(c, px + 4, px + 4 + ri(hash(k + 7) * (w - 12)) + 4, py + 4 + k * 5 + (k > 2 ? 3 : 0), mixHex(P.slate3, P.cream0, 0.3));
  for (let k = 0; k < w; k += 2) pset(c, px + k, py + h - 1 + (k % 4 ? 0 : 1), P.cream1); // torn edge
}

function bookTop(c, px, py) { // a paperback lying open, face down
  shape(c, [[px, py], [px + 34, py - 2], [px + 70, py + 2], [px + 70, py + 44], [px + 34, py + 42], [px, py + 46]], P.brick1, { shade: P.brick2, shadeDir: [0, 1], shadeW: 3, hi: P.brick0, hiDir: [0, -1] });
  rect(c, px + 33, py - 1, 2, 44, P.brick3); for (let k = 0; k < 3; k++) hline(c, px + 6, px + 26 - k * 4, py + 10 + k * 5, P.cream1); text(c, '夏', px + 52, py + 14, P.cream0, FONT.small, { align: 'center' });
  for (let k = 0; k < 4; k++) hline(c, px + 2, px + 68, py + 46 + k, k % 2 ? P.cream1 : P.cream2);
}
function phoneTop(c, px, py) { shape(c, [[px, py], [px + 20, py], [px + 20, py + 38], [px, py + 38]], P.dark1, { shade: P.ink, shadeDir: [1, 1], shadeW: 1, hi: P.slate2, hiDir: [-1, 0] }); disc(c, px + 5, py + 5, 2, P.ink); pset(c, px + 5, py + 5, P.slate3); }
// ------------------------------------------------------------- the photograph
// The two of them in the booth at the little restaurant: him laughing with his eyes shut, her
// smiling at him; the window gold behind; dishes; the framing a little crooked (he said so).
// Drawn by shapes in photo-space (0..1), so it reads at any size.
function photoImage(c, px, py, w, h, t, o = {}) {
  const tilt = -0.05, cx0 = px + w / 2, cy0 = py + h / 2;
  const T = (u, v) => { const X = (u - 0.5) * w, Y2 = (v - 0.5) * h; return [cx0 + X * Math.cos(tilt) - Y2 * Math.sin(tilt), cy0 + X * Math.sin(tilt) + Y2 * Math.cos(tilt)]; };
  const Q = (pts, col, oo = {}) => shape(c, pts.map(([u, v]) => T(u, v)), col, { outline: false, ...oo });
  const ell = (u, v, ru, rv, col, oo) => { const pts = []; for (let k = 0; k < 18; k++) { const a = k / 18 * TAU; pts.push([u + Math.cos(a) * ru, v + Math.sin(a) * rv]); } Q(pts, col, oo); };
  const big = w >= 90;
  clip(c, { x: px, y: py, w, h }, () => {
    Q([[-0.2, -0.2], [1.2, -0.2], [1.2, 0.6], [-0.2, 0.6]], '#d8b07a'); // the wall
    Q([[-0.2, -0.2], [0.42, -0.2], [0.42, 0.34], [-0.2, 0.34]], '#f2d49a'); Q([[0.02, -0.2], [0.38, -0.2], [0.38, 0.3], [0.02, 0.3]], '#f8e2b4'); Q([[0.19, -0.2], [0.21, -0.2], [0.21, 0.3], [0.19, 0.3]], '#c49a64'); // window light
    Q([[0.6, 0.02], [0.92, 0.02], [0.92, 0.3], [0.6, 0.3]], '#6a4e36'); for (let k = 0; k < 4; k++) Q([[0.63, 0.06 + k * 0.06], [0.85 - (k % 2) * 0.06, 0.06 + k * 0.06], [0.85 - (k % 2) * 0.06, 0.08 + k * 0.06], [0.63, 0.08 + k * 0.06]], '#e8d6b0'); // menu board
    ell(0.52, 0.08, 0.035, 0.05, P.red0); // lantern
    Q([[-0.2, 0.38], [1.2, 0.38], [1.2, 0.7], [-0.2, 0.7]], '#b9614b'); Q([[-0.2, 0.36], [1.2, 0.36], [1.2, 0.39], [-0.2, 0.39]], '#7a4a34'); // the booth back
    if (big) for (let k = 0; k < 8; k++) ell(0.06 + k * 0.13, 0.48 + (k % 2) * 0.08, 0.008, 0.01, '#8a4636');
    // him: olive jacket, laughing, eyes shut
    Q([[0.18, 0.58], [0.46, 0.58], [0.5, 0.95], [0.14, 0.95]], '#6a6640'); Q([[0.29, 0.58], [0.35, 0.58], [0.34, 0.68], [0.3, 0.68]], P.cream0); Q([[0.42, 0.62], [0.48, 0.6], [0.5, 0.9], [0.44, 0.92]], '#545032');
    ell(0.32, 0.43, 0.095, 0.15, '#e6bb98'); Q([[0.22, 0.34], [0.42, 0.33], [0.43, 0.4], [0.38, 0.36], [0.26, 0.37], [0.22, 0.44]], '#2a2420'); ell(0.32, 0.31, 0.1, 0.06, '#2a2420');
    if (big) { Q([[0.26, 0.44], [0.3, 0.43], [0.3, 0.445], [0.26, 0.455]], '#3a2c26'); Q([[0.34, 0.43], [0.38, 0.44], [0.38, 0.455], [0.34, 0.445]], '#3a2c26'); Q([[0.28, 0.5], [0.37, 0.5], [0.355, 0.54], [0.295, 0.54]], '#8a3a32'); Q([[0.29, 0.5], [0.36, 0.5], [0.355, 0.512], [0.295, 0.512]], P.white); ell(0.25, 0.48, 0.02, 0.015, '#e09a86'); ell(0.39, 0.48, 0.02, 0.015, '#e09a86'); }
    // her: grey-blue top, head tilted toward him, smiling
    Q([[0.54, 0.6], [0.8, 0.6], [0.84, 0.95], [0.5, 0.95]], '#6e8298'); Q([[0.62, 0.6], [0.7, 0.6], [0.68, 0.65], [0.64, 0.65]], '#e6bb98');
    Q([[0.55, 0.3], [0.77, 0.32], [0.8, 0.66], [0.52, 0.64]], '#221c1c'); // her hair, to the shoulders
    ell(0.655, 0.46, 0.085, 0.14, '#efcdb0'); Q([[0.56, 0.36], [0.74, 0.34], [0.76, 0.42], [0.64, 0.37], [0.58, 0.42]], '#221c1c');
    if (big) { Q([[0.6, 0.47], [0.635, 0.465], [0.635, 0.478], [0.6, 0.483]], '#3a2c26'); Q([[0.67, 0.465], [0.705, 0.47], [0.705, 0.483], [0.67, 0.478]], '#3a2c26'); Q([[0.62, 0.53], [0.69, 0.53], [0.675, 0.552], [0.635, 0.552]], '#b46e64'); ell(0.6, 0.51, 0.018, 0.014, '#ebaa98'); ell(0.71, 0.51, 0.018, 0.014, '#ebaa98'); }
    // the table edge, dishes, a beer bottle, two glasses
    Q([[-0.2, 0.8], [1.2, 0.8], [1.2, 1.2], [-0.2, 1.2]], '#ece2cc'); Q([[-0.2, 0.78], [1.2, 0.78], [1.2, 0.81], [-0.2, 0.81]], P.white);
    ell(0.3, 0.9, 0.12, 0.05, P.white); ell(0.3, 0.89, 0.08, 0.03, '#6a3a40'); ell(0.62, 0.92, 0.11, 0.045, P.white); ell(0.62, 0.91, 0.07, 0.025, '#e8b24a'); if (big) ell(0.6, 0.905, 0.025, 0.012, '#c0463e');
    Q([[0.87, 0.6], [0.91, 0.6], [0.91, 0.88], [0.87, 0.88]], '#3e5a34'); Q([[0.882, 0.5], [0.898, 0.5], [0.898, 0.6], [0.882, 0.6]], '#3e5a34'); Q([[0.87, 0.7], [0.91, 0.7], [0.91, 0.76], [0.87, 0.76]], P.cream0);
    Q([[0.08, 0.72], [0.13, 0.72], [0.13, 0.86], [0.08, 0.86]], '#e8c06a'); Q([[0.08, 0.7], [0.13, 0.7], [0.13, 0.74], [0.08, 0.74]], P.white);
    // print: faded warm, the light leak at the corner, the date stamp
    c.save(); c.globalAlpha = 0.12; rect(c, px, py, w, h, P.honey0); c.globalAlpha = 0.18; const [lx, ly] = T(1.0, 0.0); ellipse(c, lx, ly, ri(w * 0.18), ri(h * 0.22), '#f0a060'); c.restore();
    if (big) { const [dx, dy] = T(0.8, 0.9); text(c, "16 4 17", dx, dy - 2, '#f08a3a', FONT.tiny, { align: 'center' }); }
  });
}
function photoFront(c, px, py, w, h, t, o = {}) { // the print with its white border, wear and a crease
  const b = Math.max(2, ri(w * 0.05));
  contactShadow(c, px + w / 2 + 3, py + h / 2 + 4, w / 2, h / 2, 0.25);
  rect(c, px - 1, py - 1, w + 2, h + 2, mixHex(P.cream3, P.ink, 0.3)); rect(c, px, py, w, h, P.white); hline(c, px, px + w - 1, py + h - 1, P.cream1); vline(c, px + w - 1, py, py + h - 1, P.cream1);
  photoImage(c, px + b, py + b, w - b * 2, h - b * 2 - ri(b * 0.6), t);
  pset(c, px, py, P.cream2); pset(c, px + w - 1, py, P.cream2); pset(c, px + w - 1, py + h - 1, P.cream3); pset(c, px + 1, py + h - 1, P.cream2); // worn corners
  if (w > 80) { c.save(); c.globalAlpha = 0.18; line(c, px + w * 0.72, py, px + w * 0.66, py + h, P.white); c.restore(); line(c, px + w * 0.72 + 1, py + 1, px + w * 0.72, py + 5, P.cream2); } // an old crease
  const dust = o.dust ?? 0; if (o.dusty !== false && dust < 1) { c.save(); c.globalAlpha = 0.7 * (1 - dust); for (let k = 0; k < 26; k++) pset(c, px + 2 + ri(hash(k * 7) * (w - 4)), py + 2 + ri(hash(k * 11) * (h - 4)), P.cream1); c.restore(); }
}
function photoBack(c, px, py, w, h) {
  contactShadow(c, px + w / 2 + 3, py + h / 2 + 4, w / 2, h / 2, 0.25);
  rect(c, px - 1, py - 1, w + 2, h + 2, mixHex(P.cream3, P.ink, 0.3)); rect(c, px, py, w, h, '#f1ead9');
  for (let k = 0; k < 6; k++) hline(c, px + 6, px + w - 7, py + 10 + k * 9, mixHex('#f1ead9', P.slate4, 0.12)); // faint print lines of the lab paper
  for (let k = 0; k < w; k += 9) text(c, '·', px + k, py + h - 10, mixHex('#f1ead9', P.slate4, 0.25), FONT.tiny);
  text(c, '小馆子 · 四月', px + 10, py + 14, P.blue3, FONT.small); text(c, '他说这张拍歪了', px + 10, py + 32, P.blue3, FONT.small);
  line(c, px + 10, py + 46, px + 50, py + 45, mixHex(P.blue3, '#f1ead9', 0.4)); // a pen stroke under it
  c.save(); c.globalAlpha = 0.25; for (let a = 0; a < 60; a++) { const ang = a / 60 * TAU; if (a % 11 > 8) continue; pset(c, px + w - 26 + ri(Math.cos(ang) * 12), py + h - 26 + ri(Math.sin(ang) * 11), P.honey3); } c.restore(); // a tea ring
}

// ------------------------------------------------------------- close-ups (360×640 interface)
const FULLC = { x: 0, y: 0, w: CW, h: CH };
function woodTop(x, R, per) { const c = closeBegin(); tableTop(c, per); tableLight(c, per); closeEnd(x, R); }
// The photo held up over the table. st: back, dust, hands(true), thumbL, thumbR, gap, dx, dy (360-space)
function photoClose(x, R, st, t) {
  const c = closeBegin(), per = st.period || 'now';
  tableTop(c, per, { ringX: 140, ringY: 270 });
  cupTop(c, 156, 34, { level: 0.6, cold: true }); receiptTop(c, 6, 250, {}); penTop(c, 120, 300, 160, 286); ashtrayTop(c, 20, 30, { t, cig: false });
  const w = 136, h = 100, px = ri(22 + (st.dx || 0) / 2), py = ri(104 + (st.dy || 0) / 2), mid = py + h / 2;
  const hands = st.hands !== false;
  if (hands) { handTop(c, px + 2, mid + 64, -1.3, 'hold', { part: 'back', left: false, sleeve: 34, s: 3 }); handTop(c, px + w - 2, mid + 64, -1.84, 'hold', { part: 'back', left: true, sleeve: 34, s: 3 }); }
  if (st.back) photoBack(c, px, py, w, h); else photoFront(c, px, py, w, h, t, { dust: st.dust ?? 0 });
  if (hands) {
    handTop(c, px + 2, mid + 64, -1.3, 'hold', { part: 'thumb', left: false, s: 3, thumb: (st.thumbL || 0) / 6 });
    handTop(c, px + w - 2, mid + 64, -1.84, 'hold', { part: 'thumb', left: true, s: 3, thumb: (st.thumbR || 0) / 6 });
  }
  if (st.gap && !st.back) { c.save(); c.globalAlpha = 0.12 + 0.06 * Math.sin(t * 3); rect(c, px + w / 2 - 6, py + 20, 12, h - 40, P.white); c.restore(); }
  tableLight(c, per); closeEnd(x, R);
}
function ashClose(x, R, st, t) {
  const c = closeBegin();
  tableTop(c, 'now', { ringX: 46, ringY: 250 });
  receiptTop(c, 122, 236, { w: 44, h: 64 }); penTop(c, 16, 296, 74, 274); photoFront(c, -36, 218, 84, 62, t, { dusty: false }); cupTop(c, 150, 26, { r: 22, level: 0.5, cold: true, handle: 2.6 });
  bookTop(c, 8, 20);
  ashtrayTop(c, 92, 172, { t, r: 40, ember: st.ember, smoke: st.smoke });
  tableLight(c, 'now'); closeEnd(x, R);
}
// The receipt opened on the table, her hand flat on its corner, the pen. st: open 0..1, hand
function receiptClose(x, R, st, t) {
  const c = closeBegin();
  tableTop(c, 'now', { ringX: 150, ringY: 60 });
  cupTop(c, 158, 60, { level: 0.6, cold: true }); ashtrayTop(c, 26, 40, { t, cig: false, r: 16 });
  const op = st.open ?? 1, w = 92, full = 196, px = 44, py = 54, top = ri(full * 0.38), shown = ri(top * op) + (full - top);
  const y0 = py + (full - shown);
  contactShadow(c, px + w / 2 + 3, y0 + shown / 2 + 4, w / 2, shown / 2, 0.22);
  shape(c, [[px, y0], [px + w, y0 + 1], [px + w - 1, py + full], [px + 1, py + full - 1]], P.cream0, { shade: P.cream2, shadeDir: [1, 0], shadeW: 2, hi: P.white, hiDir: [-1, 0], outline: mixHex(P.cream3, P.ink, 0.25) });
  for (let k = 0; k < w; k += 3) pset(c, px + k, py + full - (k % 6 ? 0 : 1), P.cream2);
  const fold = y0 + ri(top * op); hline(c, px + 2, px + w - 3, fold, P.cream2); hline(c, px + 2, px + w - 3, fold + 1, P.white);
  clip(c, { x: px + 1, y: y0 + 1, w: w - 2, h: shown - 2 }, () => {
    const L = (s, yy, col, f = FONT.tiny, al) => { const ty = py + yy - (full - shown) * (yy < top ? 1 : 0) * 0; const sc = yy < top ? op : 1; const yy2 = yy < top ? y0 + ri(yy * sc) : py + yy; if (sc > 0.4 || yy >= top) text(c, s, al === 'r' ? px + w - 6 : al === 'c' ? px + w / 2 : px + 6, yy2, col, f, al ? { align: al === 'r' ? 'right' : 'center' } : {}); };
    L('小馆子', 8, P.ink, FONT.small, 'c'); L('家常小炒', 22, P.slate2, FONT.tiny, 'c'); L('四月十七  19:42', 36, P.slate1, FONT.tiny, 'c'); L('桌 3     2人', 48, P.slate2, FONT.tiny, 'c');
    for (let k = 6; k < w - 6; k += 3) pset(c, px + k, py + 62, P.slate4);
    const items = [['红烧茄子', '28'], ['番茄炒蛋', '22'], ['米饭 ×2', '4'], ['冰啤酒 ×2', '16']];
    items.forEach(([n, p2], k) => { text(c, n, px + 6, py + 70 + k * 14, P.slate0, FONT.tiny); text(c, p2, px + w - 6, py + 70 + k * 14, P.slate0, FONT.tiny, { align: 'right' }); });
    for (let k = 6; k < w - 6; k += 3) pset(c, px + k, py + 128, P.slate4);
    text(c, '合计', px + 6, py + 134, P.ink, FONT.small); text(c, '70', px + w - 6, py + 134, P.ink, FONT.small, { align: 'right' });
    text(c, '谢谢光临', px + w / 2, py + 160, P.slate2, FONT.tiny, { align: 'center' });
    // the eggplant circled in pen, a little loop that doesn't close
    for (let a = 0.3; a < TAU + 0.1; a += 0.05) pset(c, px + 24 + ri(Math.cos(a) * 22), py + 75 + ri(Math.sin(a) * 8), P.blue3);
  });
  penTop(c, 150, 250, 112, 214);
  if (st.hand) handTop(c, 36, 282, -1.1, 'flat', { left: false, sleeve: 50, s: 2.4 });
  tableLight(c, 'now'); closeEnd(x, R);
}
// The key dish on the shoe cabinet; his hand lets one key drop in. st: key 0..1, hand, coins
function keyDishClose(x, R, st, t) {
  const c = closeBegin();
  tableTop(c, 'late', { ring: false });
  shade(c, 0, 0, CW, CH, P.wood1, 0.25);
  // a folded parking slip and a hair tie beside the dish, the edge of the mirror's frame at the top
  rect(c, 0, 0, CW, 18, P.ink); rect(c, 0, 0, CW, 16, P.wood2); hline(c, 0, CW - 1, 15, P.wood3);
  receiptTop(c, 130, 236, { w: 34, h: 26 });
  for (let a = 0; a < TAU; a += 0.12) { pset(c, 34 + ri(Math.cos(a) * 9), 250 + ri(Math.sin(a) * 5), P.red1); pset(c, 34 + ri(Math.cos(a) * 8), 250 + ri(Math.sin(a) * 4), P.red0); } // a hair tie
  shape(c, [[16, 40], [60, 36], [62, 64], [18, 68]], P.leaf2, { shade: P.leaf3, shadeDir: [0, 1], shadeW: 2, hi: P.leaf1, hiDir: [0, -1] }); text(c, '公交', 38, 44, P.white, FONT.tiny, { align: 'center' }); rect(c, 22, 56, 14, 6, P.honey1); // her bus card
  shape(c, [[130, 44], [138, 44], [138, 70], [130, 70]], P.cream1, { shade: P.cream3, shadeDir: [1, 0], shadeW: 2 }); rect(c, 130, 40, 8, 5, P.red0); // lip balm
  plantPot(c, 160, 110, t, 2); contactShadow(c, 160, 111, 6, 1, 0.3);
  rect(c, 0, 298, CW, 3, P.ink); rect(c, 0, 301, CW, CH - 301, mixHex(P.wood1, P.ink, 0.4)); // the cabinet's front edge
  const dx = 90, dy = 176, rx = 60, ry = 42;
  contactShadow(c, dx + 4, dy + 6, rx, ry, 0.35);
  ellipse(c, dx, dy, rx + 1, ry + 1, P.ink); ellipse(c, dx, dy, rx, ry, P.cream1); ellipse(c, dx, dy, rx - 4, ry - 4, P.brick0); ellipse(c, dx, dy + 1, rx - 7, ry - 7, P.brick1);
  for (let a = -2.6; a < -1.0; a += 0.08) pset(c, dx + ri(Math.cos(a) * (rx - 2)), dy + ri(Math.sin(a) * (ry - 2)), P.white);
  if (st.coins) for (const [cx, cy, col] of [[-18, 10, P.slate5], [-10, 16, P.honey1], [14, 12, P.slate5], [-22, -4, P.honey2]]) { disc(c, dx + cx, dy + cy, 4, P.ink); disc(c, dx + cx, dy + cy, 3, col); pset(c, dx + cx - 1, dy + cy - 1, P.white); }
  // the key: falls from his fingers, lands, settles
  const k = st.key ?? 0, kx = dx + 6, ky = k < 1 ? lerp(dy - 120, dy - 2, E.in(k)) : dy - 2 + (k < 1 ? 0 : 0);
  if (k > 0) bigKey(c, kx, ky, k < 1 ? 0.5 + k * 0.4 : 0.9);
  if (st.hand) handTop(c, 178, 20, 2.3, k > 0.05 ? 'drop' : 'pinch', { who: 'M', left: true, sleeve: 40 });
  shade(c, 0, 0, CW, CH, LOOKS.late.tint, 0.12); c.save(); c.globalAlpha = 0.12; rect(c, 0, CH - 14, CW, 14, P.ink); c.restore();
  closeEnd(x, R);
}
function bigKey(c, kx, ky, ang) {
  const d = [Math.cos(ang), Math.sin(ang)], p = [-d[1], d[0]], K = (u, v) => [kx + d[0] * u + p[0] * v, ky + d[1] * u + p[1] * v];
  shape(c, [K(-14, -5), K(-4, -5), K(-4, 5), K(-14, 5)], P.honey1, { shade: P.honey2, shadeDir: [0, 1], shadeW: 1, hi: P.honey0, hiDir: [0, -1] });
  const [h0, h1] = K(-9, 0); disc(c, h0, h1, 2, P.ink); pset(c, h0, h1, mixHex(P.brick1, P.wood2, 0.5));
  shape(c, [K(-4, -2), K(16, -2), K(16, 2), K(-4, 2)], P.honey1, { shade: P.honey2, shadeDir: [0, 1], shadeW: 1 });
  for (const [u, v] of [[8, 2], [11, 3], [13, 2]]) { const [a, b] = K(u, v); pset(c, a, b, P.ink); }
  const [r0, r1] = K(-18, 0); for (let a = 0; a < TAU; a += 0.3) pset(c, r0 + ri(Math.cos(a) * 4), r1 + ri(Math.sin(a) * 4), P.slate4);
}
// The drying rack, side on: tiles behind, plates in their slots, her cup going back on its peg.
// st: cups [mine|null, his|null], hand 0..1.4 (in, place at 0.55, out)
function rackClose(x, R, st, t) {
  const c = closeBegin(), tile = mixHex(P.mist1, LOOKS.now.wall, 0.35), grout = mixHex(P.mist0, LOOKS.now.wall, 0.55);
  rect(c, 0, 0, CW, CH, tile);
  for (let y = 0; y < 220; y += 22) hline(c, 0, CW - 1, y, grout); for (let y = 0, r = 0; y < 220; y += 22, r++) for (let k = (r % 2) * 16; k < CW; k += 32) vline(c, k, y, y + 21, grout);
  for (let k = 0; k < 20; k++) { const y0 = ri(hash(k) * 10) * 22 + 3, x0 = ri(hash(k + 3) * 6) * 32 + 4; hline(c, x0, x0 + 6, y0, mixHex(tile, P.white, 0.4)); }
  // the window's light on the tiles, the tap at the left edge with a drop
  lightSteps(c, [[0, 0], [70, 0], [30, 220], [0, 220]], P.mist2, [[[0, 0], 0.12]]);
  shape(c, [[-4, 120], [16, 120], [16, 128], [-4, 128]], P.slate4, { shade: P.slate3, shadeDir: [0, 1], shadeW: 2, hi: P.slate5, hiDir: [0, -1] }); shape(c, [[10, 128], [16, 128], [16, 140], [10, 140]], P.slate4, { shade: P.slate3, shadeDir: [1, 0], shadeW: 2 });
  const drop = mod(t * 0.7, 1); if (drop < 0.8) { const dy2 = 142 + ri(E.in(drop) * 70); rect(c, 12, dy2, 2, 3, P.glass2); pset(c, 12, dy2, P.white); }
  // the window over the sink (left), a wall shelf with jars, a rail of utensils
  rect(c, -2, 8, 74, 84, P.ink); rect(c, 0, 10, 70, 80, mixHex(P.cream1, LOOKS.now.wall, 0.2)); clip(c, { x: 3, y: 13, w: 64, h: 74 }, () => { cloudsSky(c, 3, 13, 64, 74, LOOKS.now, t); rect(c, 3, 50, 30, 40, mixHex(LOOKS.now.sky[3], P.slate2, 0.55)); rect(c, 36, 40, 30, 50, mixHex(LOOKS.now.sky[3], P.slate2, 0.62)); for (let r = 0; r < 4; r++) { rect(c, 8, 56 + r * 8, 4, 4, mixHex(LOOKS.now.sky[3], P.ink, 0.3)); rect(c, 44, 46 + r * 9, 5, 4, r === 2 ? P.honey1 : mixHex(LOOKS.now.sky[3], P.ink, 0.3)); } });
  vline(c, 35, 13, 86, mixHex(P.cream1, LOOKS.now.wall, 0.2)); for (let y = 0; y < 28; y++) for (let k = 0; k < 64; k++) pset(c, 3 + k, 60 + y, ((k >> 3) + (y >> 3)) % 2 ? mixHex(P.cream0, LOOKS.now.wall, 0.2) : mixHex(P.slate4, LOOKS.now.wall, 0.2)); hline(c, 3, 66, 59, P.wood1);
  rect(c, -4, 90, 80, 5, P.ink); rect(c, -3, 90, 78, 3, P.cream1); plantPot(c, 20, 90, t, 1);
  rect(c, 84, 66, 96, 4, P.ink); rect(c, 84, 66, 96, 2, P.wood3);
  for (let k = 0; k < 6; k++) { const jx = 88 + k * 15, jh = 14 + (k % 3) * 4; shape(c, [[jx, 66 - jh], [jx + 11, 66 - jh], [jx + 11, 66], [jx, 66]], P.glass2, { shade: P.glass, shadeDir: [1, 0], shadeW: 2, hi: P.white, hiDir: [-1, 0] }); rect(c, jx + 1, 66 - jh + 6, 9, jh - 7, [P.honey1, P.brick0, P.cream1, P.leaf1, P.wood3, P.red0][k]); rect(c, jx, 66 - jh - 3, 11, 3, P.wood1); }
  rect(c, 84, 96, 96, 2, P.slate2); for (const [ux, len, col] of [[94, 22, P.slate1], [110, 18, P.wood1], [126, 24, P.slate1], [142, 16, P.wood2], [158, 20, P.slate1]]) { vline(c, ux, 98, 98 + len, P.ink); vline(c, ux + 1, 98, 98 + len, col); ellipse(c, ux, 100 + len, 3, 2, P.ink); ellipse(c, ux, 100 + len, 2, 1, col); }
  // the counter
  rect(c, 0, 218, CW, 4, P.ink); rect(c, 0, 222, CW, 10, mixHex(P.cream0, P.slate4, 0.3)); hline(c, 0, CW - 1, 222, P.white); rect(c, 0, 232, CW, 2, P.ink); rect(c, 0, 234, CW, CH - 234, P.wood2); for (let k = 0; k < CW; k += 44) { rect(c, k + 2, 240, 40, 80, P.ink); rect(c, k + 3, 241, 38, 79, P.wood3); hline(c, k + 3, k + 40, 241, P.wood4); }
  // the rack: tray, frame, plate slots
  const rx = 44, rw = 128, rt = 120, rb = 214;
  rect(c, rx, rb, rw, 5, P.ink); rect(c, rx + 1, rb + 1, rw - 2, 3, P.slate4); hline(c, rx + 1, rx + rw - 2, rb + 1, P.slate5);
  for (const fx of [rx + 2, rx + rw - 4]) { rect(c, fx, rt, 2, rb - rt, P.ink); vline(c, fx + 1, rt + 1, rb - 1, P.slate5); }
  rect(c, rx + 2, rt, rw - 4, 2, P.ink); hline(c, rx + 2, rx + rw - 4, rt + 1, P.slate5);
  for (let k = 0; k < 6; k++) { const px = rx + 8 + k * 10, top = rt + 10 + (k % 3) * 3; shape(c, [[px, top + 4], [px + 2, top], [px + 5, top], [px + 7, top + 4], [px + 7, rb - 3], [px + 5, rb - 1], [px + 2, rb - 1], [px, rb - 3]], k % 2 ? P.white : P.mist2, { shade: P.mist0, shadeDir: [1, 0], shadeW: 2, hi: P.white, hiDir: [-1, 0] }); vline(c, px + 3, top + 3, rb - 4, k % 2 ? P.blue0 : P.mist0); } // plates on edge
  shape(c, [[4, 204], [30, 204], [28, 216], [6, 216]], P.leaf1, { shade: P.leaf2, shadeDir: [0, 1], shadeW: 2, hi: P.leaf0, hiDir: [0, -1] }); rect(c, 6, 210, 22, 6, P.honey1); // a sponge
  shape(c, [[30, 186], [40, 186], [41, 216], [29, 216]], P.mist0, { shade: P.slate4, shadeDir: [1, 0], shadeW: 2, hi: P.white, hiDir: [-1, 0] }); rect(c, 32, 180, 6, 6, P.ink); rect(c, 33, 196, 6, 10, P.leaf1); // dish soap
  for (let k = 0; k < 12; k++) vline(c, rx + 6 + k * 10, rb - 14, rb - 1, P.slate4);
  // the pegs for cups, and the cups on them
  const pegs = [rx + 82, rx + 110];
  for (const pg of pegs) { line(c, pg, rb - 2, pg - 6, rb - 40, P.ink); line(c, pg + 1, rb - 2, pg - 5, rb - 40, P.slate5); }
  const cupSide = (cx, cy, his, tilt) => { // a cup upside down on its peg, seen from the side
    shape(c, [[cx - 10, cy - 18], [cx + 10, cy - 18], [cx + 8, cy + 6], [cx - 8, cy + 6]], his ? P.honey1 : P.white, { shade: his ? P.honey2 : P.mist0, shadeDir: [1, 0], shadeW: 3, hi: his ? P.honey0 : P.white, hiDir: [-1, 0] });
    shape(c, [[cx + 9, cy - 12], [cx + 16, cy - 10], [cx + 16, cy - 2], [cx + 8, cy]], his ? P.honey1 : P.white, { shade: his ? P.honey2 : P.mist0, shadeDir: [1, 0], shadeW: 2 }); rect(c, cx + 10, cy - 8, 4, 5, tile);
    hline(c, cx - 9, cx + 9, cy + 5, his ? P.honey3 : P.cream3); if (!his) { hline(c, cx - 8, cx + 7, cy - 10, P.blue0); } pset(c, cx - 6, cy - 14, P.white);
  };
  const cups = st.cups || [null, null];
  if (cups[1]) cupSide(pegs[1] - 6, rb - 28, true);
  if (cups[0]) cupSide(pegs[0] - 6, rb - 28, false);
  // her hand: in from the lower right holding the cup by its handle, places it, goes
  const h = st.hand ?? 0;
  if (h > 0) {
    const inK = Math.min(1, h / 0.55), outK = Math.max(0, (h - 0.55) / 0.85), hx = lerp(210, pegs[0] + 14, E.out(inK)) + E.in(outK) * 120, hy = lerp(300, rb - 16, E.out(inK)) + E.in(outK) * 90;
    if (!cups[0]) cupSide(hx - 20, hy - 12, false);
    handSideHold(c, hx - 2, hy - 18);
  }
  shade(c, 0, 0, CW, CH, LOOKS.now.tint, LOOKS.now.tintA * 0.8);
  closeEnd(x, R);
}
function handSideHold(c, hx, hy) { // her right hand from the side, fingers through a cup handle, wrist and sleeve going off to the lower right
  shape(c, [[hx + 10, hy + 2], [hx + 60, hy + 40], [hx + 60, hy + 70], [hx + 2, hy + 22]], P.blue1, { shade: P.blue2, shadeDir: [0, 1], shadeW: 4, hi: P.blue0, hiDir: [0, -1] });
  for (let k = 0; k < 4; k++) line(c, hx + 6 + k * 2, hy + 18 - k * 3, hx + 14 + k * 2, hy + 6 - k * 3 + 6, P.blue3);
  shape(c, [[hx - 6, hy - 4], [hx + 8, hy - 8], [hx + 14, hy + 4], [hx + 10, hy + 18], [hx - 4, hy + 16], [hx - 10, hy + 6]], SKIN.base, { outline: SKIN.edge, shade: SKIN.shade, shadeDir: [0, 1], shadeW: 2, hi: SKIN.hi, hiDir: [0, -1] });
  for (let k = 0; k < 3; k++) shape(c, [[hx - 12, hy - 2 + k * 5], [hx - 4, hy - 3 + k * 5], [hx - 4, hy + 2 + k * 5], [hx - 12, hy + 2 + k * 5]], SKIN.base, { outline: SKIN.edge, shade: SKIN.shade, shadeDir: [0, 1], shadeW: 1 });
  shape(c, [[hx - 8, hy - 10], [hx + 2, hy - 9], [hx + 4, hy - 4], [hx - 8, hy - 6]], SKIN.base, { outline: SKIN.edge, hi: SKIN.hi, hiDir: [0, -1] }); pset(c, hx - 7, hy - 8, SKIN.nail);
  for (let k = 0; k < 3; k++) pset(c, hx - 4, hy + k * 5, SKIN.dark);
}
function cupClose(x, R, st, t) { const c = closeBegin(); tableTop(c, st.period || 'now'); cupTop(c, 90, 160, { r: 26, level: st.level ?? 0.6, steam: st.steam, t }); tableLight(c, st.period || 'now'); closeEnd(x, R); }

// The inspect box: a small cream label with a thin brown border, appearing for a moment (UI, drawn at 1×
// but on the 2× grid so it sits with everything else).
function inspectBox(x, px, py, title, u, d) {
  if (u < 0 || u > d) return;
  const k = Math.min(1, u / 0.18, (d - u) / 0.18); if (k < 1 && Math.floor(u * 30) % 2) return;
  px = px & ~1; py = py & ~1;
  const w = (textWidth(title, FONT.ui) + 34) & ~1, h = 24;
  rect(x, px + 2, py + 2, w, h, mixHex(P.ink, P.wood1, 0.3)); // drop shadow
  rect(x, px - 2, py - 2, w + 4, h + 4, P.wood1); rect(x, px, py, w, h, P.cream0); rect(x, px, py, w, 2, P.white); rect(x, px, py + h - 4, w, 4, P.cream2);
  rect(x, px + 6, py + 6, 10, 10, P.wood1); rect(x, px + 8, py + 8, 6, 6, P.honey1); rect(x, px + 10, py + 10, 2, 2, P.cream0);
  text(x, title, px + 22, py + 5, P.wood0, FONT.ui);
  if (mod(u, 0.8) < 0.55) for (let j = 0; j < 4; j++) vline(x, px + w - 10 + j, py + 7 + j, py + 13 - j, P.red1);
}

// ------------------------------------------------------------- the table from above
// The cup, the photo (its corner under the receipt), the ashtray, the pen; her hand.
// st: cup:{x,y}, photo:{x,y}, hand:{x,y,kind,on}, receiptOver, receipt:{x,y}, wobble (all 360-space)
function tableTopClose(x, R, st, t) {
  const c = closeBegin(), per = st.period || 'now', H = v => v / 2;
  tableTop(c, per, { ringX: 40, ringY: 236 });
  // the near edge of the table and her side, at the very bottom
  rect(c, 0, 300, CW, 2, P.ink); rect(c, 0, 302, CW, 4, P.wood1); rect(c, 0, 306, CW, CH - 306, mixHex(LOOKS[per].floor, P.ink, 0.45));
  bookTop(c, 8, 22); phoneTop(c, 96, 30); ashtrayTop(c, 148, 92, { t, cig: false, r: 20 });
  penTop(c, 18, 278, 66, 262);
  const ph = st.photo || { x: 120, y: 330 }, rc = st.receipt || { x: 176, y: 352 };
  const pw = 76, phh = 56, ppx = ri(H(ph.x) - 40), ppy = ri(H(ph.y) - 10);
  const rcp = () => receiptTop(c, H(rc.x), H(rc.y), { w: 36, h: 52 });
  if (st.receiptOver !== false) { photoFront(c, ppx, ppy, pw, phh, t, { dusty: false }); rcp(); } else { rcp(); photoFront(c, ppx, ppy, pw, phh, t, { dusty: false }); }
  const cp = st.cup || { x: 222, y: 300 }, wob = st.wobble ? ri(Math.sin(t * 40)) : 0, ccx = H(cp.x) + 4 + wob, ccy = H(cp.y), cr = 14, ha = 2.2;
  cupTop(c, ccx, ccy, { r: cr, level: 0.6, cold: true, handle: ha });
  const hd = st.hand; if (hd && hd.on !== false) {
    if (hd.kind === 'cup') { const hx = ccx + Math.cos(ha) * (cr + 6), hy = ccy + Math.sin(ha) * (cr + 6), a = -0.95; handTop(c, hx - Math.cos(a) * 36, hy - Math.sin(a) * 36, a, 'cup', { s: 2.4 }); }
    else if (hd.kind === 'pinch') { const tx = ppx + 30 + (H(hd.x) - (H(ph.x) - 4)), ty = ppy + phh + 2, a = -1.35; handTop(c, tx - Math.cos(a) * 46, ty - Math.sin(a) * 46, a, 'pinch', { s: 2.4 }); }
    else { const tx = H(hd.x) + 26, ty = H(hd.y) + 4, a = -1.0; handTop(c, tx - Math.cos(a) * 46, ty - Math.sin(a) * 46, a, 'flat', { s: 2.4 }); }
  }
  tableLight(c, per); closeEnd(x, R);
}
