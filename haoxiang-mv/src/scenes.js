'use strict';
/*
 * Places, drawn front-on (elevation) at the size the shot needs. The picture area is
 * 360×568; the band below (568–640) is the subtitle area. Coordinates are logical pixels.
 * Each scene takes a state object `st` and time t; people are passed in and drawn at the
 * right depth (behind foreground props).
 */
const SH = 568; // scene height: everything below is the lyric band
function wallPlaster(x, x0, y0, w, h, base, seed) { plaster(x, { x: x0, y: y0, w, h }, base, mixHex(base, P.ink, 0.05), mixHex(base, P.white, 0.25), seed); }
function memoryGrade(x, k = 1, R = { x: 0, y: 0, w: LW, h: SH }) { // the look of remembering: warm, lifted, a dithered soft border
  if (k <= 0) return;
  x.save(); x.globalAlpha = 0.22 * k; rect(x, R.x, R.y, R.w, R.h, P.lt1); x.globalAlpha = 0.1 * k; rect(x, R.x, R.y, R.w, R.h, P.co0); x.restore();
  const B = 16; x.fillStyle = P.cr0;
  for (let y = R.y; y < R.y + R.h; y++) { const edgeRow = y - R.y < B || R.y + R.h - 1 - y < B, xs = edgeRow ? [[R.x, R.x + R.w]] : [[R.x, R.x + B], [R.x + R.w - B, R.x + R.w]];
    for (const [a0, a1] of xs) for (let xx = a0; xx < a1; xx++) { const d = Math.min(xx - R.x, R.x + R.w - 1 - xx, y - R.y, R.y + R.h - 1 - y); if (BAYER[(y & 3) * 4 + (xx & 3)] * B * k > d) x.fillRect(xx, y, 1, 1); } }
}

// ------------------------------------------------------------- the entry hall (front elevation)
// Transom over the door, the door, a rail of hooks (the blue coat, a tote, a scarf), a shoe
// cabinet with the key bowl, a small plant and the framed photo of the two of them; a print,
// a clock, a high shelf; sage wainscot; the floor edge; a big plant in the foreground.
const HALL = { floor: 548, rail: { x: 64, y: 352, w: 128 }, coatHook: 96, door: { x: 232, y: 258, w: 104 }, cab: { x: 18, y: 452, w: 124 } };
function hallScene(x, st, t) {
  const F = HALL.floor, warm = st.memory ? 1 : 0;
  // ceiling beam and upper wall
  rect(x, 0, 0, LW, 22, P.wd3); hline(x, 0, LW - 1, 21, P.wd4); hline(x, 0, LW - 1, 1, P.wd2);
  wallPlaster(x, 0, 22, LW, 410, P.cr1, 3);
  rect(x, 0, 22, LW, 4, P.cr2); hline(x, 0, LW - 1, 26, P.cr3);
  // a high shelf with storage boxes and a trailing plant
  rect(x, 18, 92, 150, 5, P.ink); rect(x, 19, 92, 148, 3, P.wd1); hline(x, 19, 166, 92, P.wd0);
  for (const [bx, w, c] of [[24, 34, P.cr2], [62, 30, P.gb1], [96, 28, P.sg1]]) { shape(x, [[bx, 62], [bx + w, 62], [bx + w, 92], [bx, 92]], c, { shade: mixHex(c, P.ink, 0.2), shadeDir: [1, 1], shadeW: 2, hi: mixHex(c, P.white, 0.3), hiDir: [0, -1] }); rect(x, bx + w / 2 - 4, 72, 8, 4, mixHex(c, P.ink, 0.3)); }
  shape(x, [[132, 74], [152, 74], [150, 92], [134, 92]], P.co2, { shade: P.co3, shadeDir: [1, 0], shadeW: 3, hi: P.co1, hiDir: [-1, 0] });
  for (let k = 0; k < 9; k++) { const vx = 136 + k * 2 + ri(Math.sin(k * 1.3 + t * 0.5) * 1.5), vy = 76 + k * 7; ellipse(x, vx, vy, 3, 2, P.ink); ellipse(x, vx, vy, 2, 1, k % 2 ? P.sg2 : P.sg1); } // trailing pothos
  for (const [lx, ly] of [[140, 68], [146, 64], [150, 70]]) { ellipse(x, lx, ly, 4, 3, P.ink); ellipse(x, lx, ly, 3, 2, P.sg2); pset(x, lx - 1, ly - 1, P.sg0); }
  // a print and a clock
  shape(x, [[30, 140], [104, 140], [104, 214], [30, 214]], P.wd2, { shade: P.wd3, shadeDir: [1, 1], shadeW: 2 }); rect(x, 36, 146, 62, 62, P.cr0);
  rect(x, 42, 152, 50, 50, P.gb0); for (let k = 0; k < 50; k++) pset(x, 42 + k, 186 + ri(Math.sin(k * 0.2) * 3), P.gb2); rect(x, 42, 190, 50, 12, P.gb1); ellipse(x, 76, 166, 6, 6, P.co1); pset(x, 54, 172, P.ink); pset(x, 58, 170, P.ink);
  { const cx = 160, cy = 168; disc(x, cx, cy, 15, P.ink); disc(x, cx, cy, 14, P.wd1); disc(x, cx, cy, 12, P.cr0); for (let k = 0; k < 12; k++) pset(x, cx + ri(Math.cos(k * TAU / 12) * 10), cy + ri(Math.sin(k * TAU / 12) * 10), P.cr4); const a = t * 0.02 - 1.2, bb = t * 0.24 + 0.5; line(x, cx, cy, cx + ri(Math.cos(a) * 6), cy + ri(Math.sin(a) * 6), P.ink); line(x, cx, cy, cx + ri(Math.cos(bb) * 9), cy + ri(Math.sin(bb) * 9), P.ink); pset(x, cx, cy, P.co2); }
  // the door with its transom
  const D = HALL.door, op = st.door || 0;
  rect(x, D.x - 8, 186, D.w + 16, F - 186, P.ink); rect(x, D.x - 7, 187, D.w + 14, F - 187, P.cr2); vline(x, D.x + D.w + 6, 187, F, P.cr3);
  rect(x, D.x - 1, 194, D.w + 2, 58, P.ink); rect(x, D.x, 195, D.w, 56, mixHex(P.gb0, P.lt0, 0.3)); for (let k = 1; k < 4; k++) vline(x, D.x + k * D.w / 4, 195, 250, P.cr2); hline(x, D.x, D.x + D.w - 1, 222, P.cr2);
  x.save(); x.globalAlpha = 0.4; poly(x, [[D.x + 12, 195], [D.x + 22, 195], [D.x + 10, 250], [D.x, 250]], P.white); x.restore();
  rect(x, D.x - 8, 252, D.w + 16, 6, P.cr3);
  if (op > 0) { // the stairwell light beyond
    rect(x, D.x, D.y, D.w, F - D.y, mixHex(P.lt0, P.cr1, 0.4)); rect(x, D.x, F - 40, D.w, 40, mixHex(P.cr3, P.gb1, 0.4)); for (let k = 0; k < 5; k++) hline(x, D.x, D.x + D.w - 1, F - 40 + k * 8, mixHex(P.cr4, P.gb2, 0.4));
    rect(x, D.x + 60, D.y + 30, 30, 200, mixHex(P.wd2, P.gb2, 0.4)); // the rail of the stairs
    const dw = Math.max(4, ri(D.w * (1 - op))); shape(x, [[D.x, D.y], [D.x + dw, D.y - 6], [D.x + dw, F + 4], [D.x, F]], P.wd1, { shade: P.wd2, shadeDir: [1, 0], shadeW: Math.min(6, dw) });
  } else {
    shape(x, [[D.x, D.y], [D.x + D.w, D.y], [D.x + D.w, F], [D.x, F]], P.wd1, { shade: P.wd2, shadeDir: [1, 0], shadeW: 3, hi: P.wd0, hiDir: [-1, 0] });
    for (const [py, ph] of [[16, 110], [140, 132]]) { rect(x, D.x + 12, D.y + py, D.w - 24, ph, P.wd2); rect(x, D.x + 13, D.y + py + 1, D.w - 26, ph - 2, P.wd1); hline(x, D.x + 13, D.x + D.w - 14, D.y + py + 1, P.wd0); vline(x, D.x + 13, D.y + py + 1, D.y + py + ph - 2, P.wd0); }
    shape(x, [[D.x + 8, D.y + 140], [D.x + 22, D.y + 140], [D.x + 22, D.y + 146], [D.x + 8, D.y + 146]], P.lt2, { shade: P.wd3, shadeDir: [0, 1], shadeW: 1, hi: P.lt0, hiDir: [0, -1] }); // lever handle
    rect(x, D.x + 10, D.y + 124, 4, 8, P.wd4); pset(x, D.x + 11, D.y + 125, P.lt2); // lock
    disc(x, D.x + D.w / 2, D.y + 70, 2, P.ink); pset(x, D.x + D.w / 2, D.y + 70, P.gb0); // peephole
  }
  // light switch and the wainscot
  block(x, 206, 400, 12, 18, P.cr0); rect(x, 210, 405, 4, 8, P.cr2);
  rect(x, 0, 432, D.x - 8, F - 432, P.sg1); rect(x, D.x + D.w + 8, 432, LW - D.x - D.w - 8, F - 432, P.sg1); hline(x, 0, D.x - 9, 432, P.ink); hline(x, D.x + D.w + 8, LW - 1, 432, P.ink); hline(x, 0, D.x - 9, 433, P.sg0); hline(x, D.x + D.w + 8, LW - 1, 433, P.sg0);
  for (let k = 8; k < D.x - 20; k += 52) { rect(x, k, 446, 42, 86, P.sg2); rect(x, k + 1, 447, 40, 84, P.sg1); hline(x, k + 1, k + 40, 447, P.sg0); }
  rect(x, 0, F - 8, LW, 8, P.wd2); hline(x, 0, LW - 1, F - 8, P.wd1);
  // the rail of hooks, the coat (until she takes it), the tote and scarf
  const R = HALL.rail; rect(x, R.x, R.y, R.w, 7, P.ink); rect(x, R.x + 1, R.y + 1, R.w - 2, 5, P.wd1); hline(x, R.x + 1, R.x + R.w - 2, R.y + 1, P.wd0);
  for (const hx of [R.x + 32, R.x + 72, R.x + 108]) { rect(x, hx - 1, R.y + 6, 3, 5, P.lt2); pset(x, hx, R.y + 10, P.wd3); rect(x, hx - 1, R.y + 10, 5, 2, P.lt2); }
  if (st.coatOnHook !== false) { const hx = R.x + 32, C = LOOKS2.coat; shape(x, [[hx - 10, R.y + 10], [hx + 10, R.y + 10], [hx + 24, R.y + 40], [hx + 30, R.y + 140], [hx - 30, R.y + 140], [hx - 24, R.y + 40]], C[0], { shade: C[1], shadeDir: [1, 0], shadeW: 5, hi: C[3], hiDir: [-1, 0] });
    shape(x, [[hx - 24, R.y + 40], [hx - 32, R.y + 46], [hx - 36, R.y + 128], [hx - 26, R.y + 130]], C[1], { shade: C[2], shadeDir: [-1, 0], shadeW: 2 }); shape(x, [[hx + 24, R.y + 40], [hx + 32, R.y + 46], [hx + 36, R.y + 128], [hx + 26, R.y + 130]], C[1], { shade: C[2], shadeDir: [1, 0], shadeW: 2 });
    line(x, hx, R.y + 22, hx + 2, R.y + 138, C[2]); for (const k of [50, 80, 110]) { rect(x, hx + 4, R.y + k, 3, 3, P.cr1); } line(x, hx - 8, R.y + 12, hx, R.y + 30, C[2]); line(x, hx + 8, R.y + 12, hx, R.y + 30, C[2]); rect(x, hx - 20, R.y + 96, 14, 2, C[2]); rect(x, hx + 8, R.y + 96, 14, 2, C[2]); }
  { const hx = R.x + 72; shape(x, [[hx - 14, R.y + 34], [hx + 14, R.y + 34], [hx + 16, R.y + 80], [hx - 16, R.y + 80]], P.cr2, { shade: P.cr3, shadeDir: [1, 1], shadeW: 3, hi: P.cr1, hiDir: [0, -1] }); line(x, hx - 10, R.y + 34, hx, R.y + 10, P.wd3); line(x, hx + 10, R.y + 34, hx, R.y + 10, P.wd3); rect(x, hx - 6, R.y + 50, 12, 10, P.sg1); }
  { const hx = R.x + 108; shape(x, [[hx - 4, R.y + 10], [hx + 4, R.y + 10], [hx + 8, R.y + 96], [hx, R.y + 100], [hx - 6, R.y + 70]], P.co1, { shade: P.co2, shadeDir: [1, 0], shadeW: 2 }); for (let k = 0; k < 4; k++) pset(x, hx + 2 + (k % 2), R.y + 100 + k, P.co2); }
  // umbrella stand
  rect(x, 196, 500, 22, 48, P.ink); rect(x, 197, 501, 20, 46, P.gb2); hline(x, 197, 216, 506, P.gb1); line(x, 202, 500, 198, 440, P.ink); line(x, 203, 500, 199, 440, P.co2); line(x, 212, 500, 216, 452, P.ink);
  // ---- people behind the cabinet? no: the cabinet stands against the wall, people in front of it
  // the shoe cabinet with the key bowl, the framed photo, a little plant, a candle
  const Cb = HALL.cab;
  shape(x, [[Cb.x, Cb.y], [Cb.x + Cb.w, Cb.y], [Cb.x + Cb.w, F - 2], [Cb.x, F - 2]], P.wd1, { shade: P.wd2, shadeDir: [0, 1], shadeW: 3 });
  rect(x, Cb.x - 3, Cb.y - 4, Cb.w + 6, 6, P.ink); rect(x, Cb.x - 2, Cb.y - 3, Cb.w + 4, 4, P.wd0); hline(x, Cb.x - 2, Cb.x + Cb.w + 1, Cb.y - 3, mixHex(P.wd0, P.white, 0.3));
  for (let k = 0; k < 2; k++) { const dx = Cb.x + 6 + k * 58; rect(x, dx, Cb.y + 8, 54, F - Cb.y - 18, P.wd2); rect(x, dx + 1, Cb.y + 9, 52, F - Cb.y - 20, P.wd1); for (let s2 = 0; s2 < 6; s2++) hline(x, dx + 4, dx + 49, Cb.y + 16 + s2 * 12, P.wd2); rect(x, dx + (k ? 4 : 46), Cb.y + 40, 3, 10, P.lt2); }
  if (st.keys !== false) { /* the key bowl */ }
  ellipse(x, Cb.x + 26, Cb.y - 8, 13, 5, P.ink); ellipse(x, Cb.x + 26, Cb.y - 9, 12, 4, P.co1); ellipse(x, Cb.x + 26, Cb.y - 10, 9, 2, P.co2);
  if (st.keys !== false) { line(x, Cb.x + 20, Cb.y - 12, Cb.x + 30, Cb.y - 10, P.lt2); disc(x, Cb.x + 18, Cb.y - 12, 2, P.lt1); pset(x, Cb.x + 18, Cb.y - 12, P.co1); rect(x, Cb.x + 28, Cb.y - 13, 6, 3, P.sg2); }
  // the framed photo of the two of them
  shape(x, [[Cb.x + 52, Cb.y - 40], [Cb.x + 84, Cb.y - 40], [Cb.x + 84, Cb.y - 6], [Cb.x + 52, Cb.y - 6]], P.wd3, { shade: P.wd4, shadeDir: [1, 1], shadeW: 1 }); rect(x, Cb.x + 55, Cb.y - 37, 26, 28, P.cr0); photoPair(x, Cb.x + 57, Cb.y - 35, 22, 22, 'past', t);
  // little plant and a candle
  shape(x, [[Cb.x + 96, Cb.y - 16], [Cb.x + 110, Cb.y - 16], [Cb.x + 108, Cb.y - 4], [Cb.x + 98, Cb.y - 4]], P.cr0, { shade: P.cr2, shadeDir: [1, 0], shadeW: 2 }); for (const [a, l] of [[-2.0, 12], [-1.6, 16], [-1.2, 13], [-2.4, 9]]) { const ex = Cb.x + 103 + Math.cos(a) * l, ey = Cb.y - 16 + Math.sin(a) * l; line(x, Cb.x + 103, Cb.y - 16, ex, ey, P.sg3); ellipse(x, ri(ex), ri(ey), 3, 2, P.ink); ellipse(x, ri(ex), ri(ey), 2, 1, P.sg1); }
  rect(x, Cb.x + 116, Cb.y - 14, 6, 10, P.ink); rect(x, Cb.x + 117, Cb.y - 13, 4, 9, P.cr0);
  // the floor edge and the mat at the door
  rect(x, 0, F, LW, SH - F, P.wd2); for (let k = 0; k < LW; k += 40) vline(x, k + (k % 80 ? 10 : 0), F + 1, SH - 1, P.wd3); hline(x, 0, LW - 1, F, P.wd0);
  rect(x, D.x - 4, F + 2, D.w + 8, 8, P.ink); rect(x, D.x - 3, F + 3, D.w + 6, 6, P.co2); for (let k = 0; k < D.w + 4; k += 4) pset(x, D.x - 2 + k, F + 5, P.co1);
  // window light from the left across the wall
  lightSteps(x, [[0, 60], [120, 60], [200, 548], [0, 548]], P.lt0, [[[0, 0], 0.1], [[-20, 0], 0.07]]);
  // people
  if (st.people) for (const p of st.people) { contactShadow(x, ri(p.x), F + 1, ri(9 * (p.s || 4)), 3, 0.25); drawFig(x, p.who, p.x, F, { t, ...p }); }
  if (st.after) st.after();
  // a big plant in the foreground, cut by the frame
  { const px = 10, py = SH; shape(x, [[px - 26, py - 66], [px + 30, py - 66], [px + 24, py], [px - 20, py]], P.co2, { shade: P.co3, shadeDir: [1, 0], shadeW: 6, hi: P.co1, hiDir: [-1, 0] });
    for (const [a, l, c] of [[-2.0, 70, 0], [-1.7, 96, 1], [-1.35, 104, 0], [-1.05, 82, 1], [-0.75, 60, 0], [-2.3, 50, 1]]) bigLeaf(x, px, py - 70, l, a + Math.sin(t * 0.7 + a * 3) * 0.02, c ? P.sg2 : P.sg3, c ? P.sg1 : P.sg2); }
  if (warm) memoryGrade(x, warm);
}
function bigLeaf(x, cx, cy, len, ang, col, hi) {
  const ca = Math.cos(ang), sa = Math.sin(ang), w = len * 0.28, tip = [cx + ca * len, cy + sa * len], m = [cx + ca * len * 0.5, cy + sa * len * 0.5];
  shape(x, [[cx, cy], [m[0] - sa * w, m[1] + ca * w], tip, [m[0] + sa * w, m[1] - ca * w]], col, { shade: mixHex(col, P.ink, 0.25), shadeDir: [0, 1], shadeW: 2, hi, hiDir: [0, -1] });
  line(x, cx, cy, ri(cx + ca * len * 0.9), ri(cy + sa * len * 0.9), hi);
}
// The photo of the two of them (shared by every shot it appears in): him on the left, her on the
// right in his blue coat, a bench and a bus-stop sign behind. `mode`: 'past' (as printed) or
// 'live' (drawn at a size where its tiny people can move, given `act`).
function photoPair(x, px, py, w, h, mode, t, act) {
  clip(x, { x: px, y: py, w, h }, () => {
    rect(x, px, py, w, h, P.gb0); rect(x, px, py + ri(h * 0.62), w, h, P.cr2); rect(x, px, py + ri(h * 0.6), w, 1, P.cr3);
    rect(x, px + ri(w * 0.08), py + ri(h * 0.12), Math.max(1, ri(w * 0.06)), ri(h * 0.5), P.gb3); rect(x, px + ri(w * 0.02), py + ri(h * 0.1), ri(w * 0.18), ri(h * 0.12), P.sg2); // stop sign
    rect(x, px + ri(w * 0.3), py + ri(h * 0.62), ri(w * 0.6), Math.max(1, ri(h * 0.05)), P.wd2); // bench
    if (w < 40) { // tiny: two simple figures
      const f = (fx, top, hair) => { rect(x, px + ri(w * fx) - 2, py + ri(h * 0.42), 5, ri(h * 0.3), top); disc(x, px + ri(w * fx), py + ri(h * 0.34), Math.max(1, ri(w * 0.08)), P.sk1); rect(x, px + ri(w * fx) - 2, py + ri(h * 0.26), 5, 2, hair); };
      f(0.4, P.gb2, P.hm1); f(0.66, P.cb1, P.hw1);
    } else {
      const s = w / 120; // drawn people inside the print
      drawFig(x, 'him', px + w * 0.4, py + h * 0.9, { s: s * 2.2, view: 'front', t, head: { turn: act === 'turn' ? 0.8 : 0.3 }, mouth: 'smile', handR: [-3, 9], eyes: act === 'blink' ? 'closed' : '' });
      drawFig(x, 'her', px + w * 0.64, py + h * 0.9, { s: s * 2.2, view: 'front', outfit: 'coat', cuffs: ['long', 'folded'], t, head: { turn: -0.4 }, mouth: 'smile', eyes: 'smile', handL: [3, 9] });
    }
    x.save(); x.globalAlpha = 0.14; rect(x, px, py, w, h, P.lt1); x.restore();
  });
}

// ------------------------------------------------------------- the bench at the bus stop, close (for two busts)
// Evening sky, the shelter's glass and frame, the stop sign, leaves at the top, the bench back.
function benchClose(x, st, t) {
  const sky = st.night ? [P.nt0, P.nt1, P.nt2, P.nt3] : [P.gb0, mixHex(P.gb0, P.lt0, 0.5), P.lt0, mixHex(P.lt0, P.co0, 0.5)];
  sky.forEach((c, i) => rect(x, 0, i * 70, LW, 71, c));
  for (let k = 0; k < 4; k++) { const bx = -20 + k * 100, bh = 120 + (k % 2) * 60; rect(x, bx, 300 - bh, 86, bh + 60, mixHex(sky[2], P.gb2, 0.45)); for (let r = 0; r < 6; r++) for (let c = 0; c < 3; c++) rect(x, bx + 10 + c * 24, 300 - bh + 12 + r * 22, 10, 12, hash3(k, r, c) < 0.3 ? P.lt1 : mixHex(sky[2], P.gb3, 0.5)); }
  // shelter: frame and glass, the route sign
  rect(x, 0, 150, LW, 10, P.gb3); hline(x, 0, LW - 1, 150, P.gb2);
  for (const fx of [40, 320]) { rect(x, fx, 160, 8, 420, P.ink); rect(x, fx + 1, 160, 6, 420, P.gb2); }
  x.save(); x.globalAlpha = 0.25; rect(x, 48, 160, 272, 330, P.glass2); x.restore(); for (const gx of [80, 200]) { x.save(); x.globalAlpha = 0.3; poly(x, [[gx, 160], [gx + 16, 160], [gx - 30, 490], [gx - 46, 490]], P.white); x.restore(); }
  block(x, 300, 40, 50, 50, P.sg2); text(x, '17', 325, 50, P.white, FONT.ui, { align: 'center' }); rect(x, 322, 90, 6, 60, P.ink);
  // the bench back behind them
  rect(x, 0, 470, LW, 98, P.wd3); for (let k = 0; k < 3; k++) { rect(x, 0, 476 + k * 22, LW, 16, P.wd1); hline(x, 0, LW - 1, 476 + k * 22, P.wd0); hline(x, 0, LW - 1, 491 + k * 22, P.wd2); }
  // leaves at the top
  for (let k = 0; k < 12; k++) { const lx = (k * 37) % LW, ly = 6 + (k % 3) * 14 + ri(Math.sin(t * 0.8 + k) * 1.5); ellipse(x, lx, ly, 12, 7, P.ink); ellipse(x, lx, ly, 11, 6, k % 2 ? P.sg2 : P.sg3); pset(x, lx - 3, ly - 2, P.sg1); }
  if (st.people) for (const p of st.people) drawBust(x, p.who, p.x, SH, { t, ...p });
  if (st.memory) memoryGrade(x, 1);
}

// ------------------------------------------------------------- the street, front on (world 960 px wide)
// Shopfronts face us: a bakery, the convenience store, a vending machine, a flower stall, the bus
// stop with its bench and the 17 sign, a tree; flats above. People cross left–right on the
// pavement; bikes and cars pass in front on the road. camX pans the view.
const STREET = { walk: 496, curb: 512, w: 960, stop: 690, bench: [652, 744], vend: 418 };
function streetScene(x, st, t) {
  const cam = ri(st.camX || 0), W = STREET.walk, X = v => ri(v - cam);
  const sky = st.night ? [P.nt0, P.nt1, P.nt2] : [P.gb0, mixHex(P.gb0, P.cr0, 0.5), P.cr0];
  sky.forEach((c, i) => rect(x, 0, i * 30, LW, 31, c));
  // far rooftops (slower)
  for (let k = 0; k < 12; k++) { const bx = ri(k * 96 - cam * 0.5) % (LW + 120) - 60, bh = 50 + (k % 3) * 18; rect(x, bx, 90 - bh, 84, bh, mixHex(sky[2], P.gb2, 0.35)); }
  // buildings: [x, w, wall, floors] — upper floors with windows, AC units, plants, laundry
  const B = [[0, 150, P.co0], [150, 180, P.cr2], [330, 170, P.sg0], [500, 150, P.gb0], [650, 160, P.cr1], [810, 150, P.co0]];
  for (const [bx, bw, wc] of B) {
    if (X(bx) > LW || X(bx + bw) < 0) continue;
    plaster(x, { x: X(bx), y: 60, w: bw, h: 260 }, wc, mixHex(wc, P.ink, 0.06), mixHex(wc, P.white, 0.3), bx); rect(x, X(bx), 56, bw, 6, mixHex(wc, P.ink, 0.35)); vline(x, X(bx), 56, 320, mixHex(wc, P.ink, 0.25));
    for (let r = 0; r < 3; r++) for (let c = 0; c < Math.floor(bw / 56); c++) { const wx = X(bx + 14 + c * 56), wy = 82 + r * 76; rect(x, wx - 2, wy - 2, 38, 52, P.ink); rect(x, wx - 1, wy - 1, 36, 50, P.cr0); rect(x, wx + 1, wy + 1, 32, 46, st.night && hash3(bx, r, c) < 0.5 ? P.lt1 : mixHex(P.gb1, sky[1], 0.4)); vline(x, wx + 17, wy + 1, wy + 46, P.cr0); hline(x, wx + 1, wx + 32, wy + 20, P.cr0);
      if (hash3(c, r, bx) < 0.35) { rect(x, wx - 4, wy + 50, 44, 4, P.ink); for (let k = 0; k < 5; k++) { ellipse(x, wx + k * 9, wy + 46, 4, 3, P.ink); ellipse(x, wx + k * 9, wy + 46, 3, 2, k % 2 ? P.sg2 : P.co1); } }
      else if (hash3(r, c, bx + 1) < 0.4) { block(x, wx + 38, wy + 20, 14, 12, P.cr0); for (let k = 0; k < 3; k++) hline(x, wx + 40, wx + 49, wy + 23 + k * 3, P.cr3); } }
  }
  // street level: shopfronts
  rect(x, 0, 320, LW, W - 320, P.wd3);
  const shop = (sx, sw, sign, signC, inside, awning) => { if (X(sx) > LW || X(sx + sw) < 0) return;
    rect(x, X(sx), 320, sw, W - 320, P.wd2); block(x, X(sx + 8), 330, sw - 16, 30, signC); text(x, sign, X(sx + sw / 2), 338, P.cr0, FONT.ui, { align: 'center' });
    if (awning) for (let k = 0; k < sw - 8; k += 12) { shape(x, [[X(sx + 4 + k), 364], [X(sx + 16 + k), 364], [X(sx + 16 + k), 380], [X(sx + 10 + k), 384], [X(sx + 4 + k), 380]], (k / 12) % 2 ? P.cr0 : awning, { outline: P.ink }); }
    rect(x, X(sx + 10), 388, sw - 20, W - 396, P.ink); rect(x, X(sx + 11), 389, sw - 22, W - 398, st.night ? P.lt0 : mixHex(P.lt0, P.cr1, 0.4)); inside(X(sx + 11), 389, sw - 22, W - 398);
    x.save(); x.globalAlpha = 0.3; poly(x, [[X(sx + 20), 389], [X(sx + 34), 389], [X(sx + 18), W - 9], [X(sx + 4), W - 9]], P.white); x.restore(); };
  const shelves = (ix, iy, iw, ih) => { for (let r = 0; r < 4; r++) { rect(x, ix + 4, iy + 18 + r * 22, iw - 8, 2, P.wd2); for (let k = 0; k < iw - 12; k += 6) rect(x, ix + 6 + k, iy + 8 + r * 22, 4, 10, [P.co1, P.sg1, P.gb1, P.lt2, P.cr2][(k / 6 + r) % 5]); } };
  shop(0, 150, '面包', P.wd3, (ix, iy, iw, ih) => { for (let r = 0; r < 3; r++) { rect(x, ix + 6, iy + 28 + r * 28, iw - 12, 3, P.wd2); for (let k = 0; k < iw - 20; k += 14) { ellipse(x, ix + 14 + k, iy + 24 + r * 28, 6, 4, P.ink); ellipse(x, ix + 14 + k, iy + 24 + r * 28, 5, 3, P.lt2); pset(x, ix + 12 + k, iy + 22 + r * 28, P.lt0); } } }, P.co2);
  shop(150, 180, '便利店', P.sg3, shelves, null);
  // vending machine and a recycling bin
  { const vx = X(STREET.vend); if (vx > -60 && vx < LW + 10) { shape(x, [[vx, 384], [vx + 46, 384], [vx + 46, W], [vx, W]], P.co2, { shade: P.co3, shadeDir: [1, 0], shadeW: 4, hi: P.co1, hiDir: [-1, 0] }); rect(x, vx + 5, 392, 36, 54, P.ink); rect(x, vx + 6, 393, 34, 52, P.lt0); for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { rect(x, vx + 8 + c * 8, 397 + r * 17, 6, 11, [P.gb1, P.sg2, P.co1, P.lt2][(c + r) % 4]); rect(x, vx + 8 + c * 8, 408 + r * 17, 6, 2, P.ink2); } rect(x, vx + 8, 456, 30, 10, P.ink); rect(x, vx + 34, 470, 6, 8, P.ink); shape(x, [[vx + 54, 456], [vx + 74, 456], [vx + 72, W], [vx + 56, W]], P.gb2, { shade: P.gb3, shadeDir: [1, 0], shadeW: 3 }); } }
  shop(500, 150, '花', P.co3, (ix, iy, iw, ih) => { for (let k = 0; k < iw - 10; k += 16) { rect(x, ix + 6 + k, iy + ih - 30, 12, 24, P.wd2); for (let j = 0; j < 5; j++) disc(x, ix + 10 + k + (j % 3) * 3, iy + ih - 36 - (j * 4), 2, [P.co1, P.cr0, P.lt2, P.co0, P.sg1][j]); } }, P.sg2);
  // the bus stop: shelter, bench, the 17 sign
  { const sx = X(640); if (sx < LW + 40 && sx > -200) { rect(x, sx, 320, 170, W - 320, P.wd3); rect(x, sx, 360, 170, 8, P.gb3); hline(x, sx, sx + 169, 360, P.gb2); for (const fx of [sx + 8, sx + 156]) { rect(x, fx, 368, 6, W - 368, P.ink); rect(x, fx + 1, 368, 4, W - 368, P.gb2); }
      x.save(); x.globalAlpha = 0.3; rect(x, sx + 14, 368, 142, 100, P.glass2); x.restore(); block(x, sx + 20, 376, 40, 60, P.cr0); rect(x, sx + 24, 380, 32, 26, P.gb1); for (let k = 0; k < 3; k++) hline(x, sx + 24, sx + 52, 412 + k * 6, P.cr3);
      const b0 = X(STREET.bench[0]), b1 = X(STREET.bench[1]); rect(x, b0, 468, b1 - b0, 5, P.ink); rect(x, b0 + 1, 468, b1 - b0 - 2, 3, P.wd1); rect(x, b0, 452, b1 - b0, 4, P.ink); rect(x, b0 + 1, 452, b1 - b0 - 2, 2, P.wd1); for (const lx of [b0 + 6, b1 - 9]) rect(x, lx, 473, 3, W - 473, P.ink);
      if (st.benchBag) { shape(x, [[b1 - 34, 452], [b1 - 16, 452], [b1 - 14, 467], [b1 - 36, 467]], P.gb3, { shade: P.gb4, shadeDir: [1, 1], shadeW: 2 }); }
      const px = X(STREET.stop + 40); rect(x, px, 300, 4, W - 300, P.ink); block(x, px - 12, 286, 28, 28, P.sg2); text(x, '17', px + 2, 292, P.white, FONT.ui, { align: 'center' }); } }
  shop(810, 150, '书', P.gb3, shelves, P.gb1);
  // a street tree between the flower stall and the stop
  { const tx = X(620); if (tx > -60 && tx < LW + 60) { rect(x, tx - 3, 330, 7, W - 330, P.ink); rect(x, tx - 2, 330, 5, W - 330, P.wd2); for (let k = 0; k < 16; k++) { const lx = tx + ri(Math.cos(k * 2.4) * (10 + (k % 3) * 12)), ly = 300 + ri(Math.sin(k * 2.4) * (12 + (k % 3) * 8)) + ri(Math.sin(t * 0.9 + k) * 1); ellipse(x, lx, ly, 12, 9, P.ink); ellipse(x, lx, ly, 11, 8, k % 3 ? P.sg2 : P.sg3); pset(x, lx - 3, ly - 3, P.sg1); } } }
  // pavement and road
  rect(x, 0, W, LW, STREET.curb - W, P.cr2); for (let k = -(cam % 24); k < LW; k += 24) vline(x, k, W, STREET.curb, P.cr3); hline(x, 0, LW - 1, W, P.cr3);
  rect(x, 0, STREET.curb, LW, 4, P.cr3); rect(x, 0, STREET.curb + 4, LW, SH - STREET.curb - 4, P.gb3); for (let k = -(cam % 60); k < LW; k += 60) rect(x, k, STREET.curb + 30, 26, 2, P.cr1);
  // people on the pavement
  if (st.people) for (const p of st.people) { const fx = X(p.x); if (fx < -40 || fx > LW + 40) continue; contactShadow(x, fx, W + 1, ri(8 * (p.s || 2)), 2, 0.25); drawFig(x, p.who, fx, W + (p.dy || 0), { t, s: 2, ...p }); }
  if (st.after) st.after(X);
  // passing traffic in front (occludes)
  for (const v of st.traffic || []) { const vx = X(v.x); if (v.kind === 'bike') { const y = SH - 14; disc(x, vx, y, 10, P.ink); disc(x, vx, y, 8, P.gb3); disc(x, vx + 34, y, 10, P.ink); disc(x, vx + 34, y, 8, P.gb3); line(x, vx, y, vx + 16, y - 16, P.co2); line(x, vx + 16, y - 16, vx + 34, y, P.co2); line(x, vx + 10, y - 16, vx + 26, y - 16, P.co2); drawFig(x, 'p1', vx + 14, y + 2, { s: 2, view: 'right', sit: 14, handR: [8, 6], t }); }
    else if (v.kind === 'car') { shape(x, [[vx, SH - 46], [vx + 30, SH - 70], [vx + 110, SH - 70], [vx + 140, SH - 46], [vx + 150, SH - 46], [vx + 150, SH - 10], [vx - 6, SH - 10], [vx - 6, SH - 46]], v.col || P.co1, { shade: mixHex(v.col || P.co1, P.ink, 0.25), shadeDir: [0, 1], shadeW: 8, hi: P.white, hiDir: [0, -1] }); rect(x, vx + 34, SH - 64, 34, 16, P.gb1); rect(x, vx + 74, SH - 64, 34, 16, P.gb1); for (const wx of [vx + 24, vx + 118]) { disc(x, wx, SH - 10, 13, P.ink); disc(x, wx, SH - 10, 7, P.gb2); } } }
  if (st.memory) memoryGrade(x, 1);
}

// ------------------------------------------------------------- the late-night stall (front on), for two seated at its table
// Night sky and lit windows, the stall's coral awning with a string of bulbs, the menu board, the
// pot steaming, stacked bowls and stools, the owner behind the counter; the folding table in front.
function stallScene(x, st, t) {
  rect(x, 0, 0, LW, SH, P.nt0); for (let k = 0; k < 40; k++) pset(x, ri(hash(k * 3) * LW), ri(hash(k * 5) * 60), P.nt3);
  for (let k = 0; k < 5; k++) { const bx = -10 + k * 76, bh = 160 + (k % 2) * 50; rect(x, bx, 220 - bh, 70, bh + 40, P.nt1); for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) rect(x, bx + 8 + c * 20, 230 - bh + r * 28, 10, 14, hash3(k, r, c) < 0.4 ? P.lt1 : P.nt2); }
  // the stall
  rect(x, 0, 240, LW, 230, P.wd3); rect(x, 0, 240, LW, 6, P.wd4);
  for (let k = 0; k < LW; k += 24) shape(x, [[k, 196], [k + 24, 196], [k + 24, 230], [k + 12, 238], [k, 230]], (k / 24) % 2 ? P.cr0 : P.co2, { outline: P.ink });
  rect(x, 0, 190, LW, 8, P.co3); hline(x, 0, LW - 1, 190, P.co1);
  for (let k = 0; k < 15; k++) { const bx = 10 + k * 24, by = 244 + ri(Math.sin(k * 0.8) * 3); vline(x, bx, 238, by, P.ink); disc(x, bx, by + 3, 3, P.ink); disc(x, bx, by + 3, 2, mod(t * 0.7 + k * 0.37, 1) < 0.9 ? P.lt0 : P.lt1); }
  block(x, 20, 262, 110, 76, P.wd4); for (const [k, s2] of [[0, '炒粉'], [1, '馄饨'], [2, '白粥'], [3, '豆浆']]) { text(x, s2, 30, 270 + k * 16, P.cr0, FONT.small); text(x, ['12', '10', '6', '3'][k], 120, 270 + k * 16, P.lt1, FONT.small, { align: 'right' }); }
  // the counter, pot, bowls; the owner
  const own = st.owner || {};
  drawFig(x, 'p1', own.x ?? 230, 420, { s: 2, view: own.view || 'front', handR: own.handR || [-2, 8], handL: own.handL || 'down', t, head: { look: 'down' } });
  rect(x, 150, 380, 210, 60, P.cr3); rect(x, 150, 376, 210, 6, P.wd2); hline(x, 150, 359, 376, P.wd1);
  shape(x, [[290, 340], [340, 340], [336, 378], [294, 378]], P.gb3, { shade: P.gb4, shadeDir: [1, 0], shadeW: 4, hi: P.gb2, hiDir: [-1, 0] }); for (let k = 0; k < 6; k++) { const ph = mod(t * 0.4 + k / 6, 1); x.save(); x.globalAlpha = 0.5 * (1 - ph); ellipse(x, 300 + k * 7 + ri(Math.sin(t + k) * 3), 336 - ri(ph * 70), 4 + ri(ph * 4), 3, P.steam); x.restore(); }
  for (let k = 0; k < (st.bowlsStacked ? 6 : 4); k++) { ellipse(x, 180, 374 - k * 5, 14, 3, P.ink); ellipse(x, 180, 373 - k * 5, 13, 2, P.cr0); }
  // stools stacked by the stall (more of them once the owner starts closing)
  for (let k = 0; k < (st.stoolsStacked ? 4 : 1); k++) { rect(x, 10, 440 - k * 6, 30, 5, P.ink); rect(x, 11, 441 - k * 6, 28, 3, P.co2); }
  // warm light pool from the bulbs
  glow(x, 180, 300, 200, 90, P.lt1, 0.25);
  // the two of them (busts) behind the folding table
  if (st.people) for (const p of st.people) drawBust(x, p.who, p.x, 520, { t, b: 1.05, ...p });
  // the table: top edge, bowls, cups, a napkin holder; the phone; the takeout box
  rect(x, 0, 470, LW, 98, P.ink); rect(x, 0, 471, LW, 14, P.cr2); hline(x, 0, LW - 1, 471, P.cr1); rect(x, 0, 485, LW, 83, P.wd2); for (let k = 0; k < LW; k += 60) vline(x, k + 20, 486, 567, P.wd3);
  for (const it of st.table || []) tableThing(x, it, t);
  if (st.memory) memoryGrade(x, 1);
}
function tableThing(x, it, t) {
  const tx = ri(it.x), ty = 474;
  if (it.k === 'bowl') { shape(x, [[tx - 22, ty - 14], [tx + 22, ty - 14], [tx + 16, ty], [tx - 16, ty]], P.cr0, { shade: P.cr2, shadeDir: [1, 0], shadeW: 4, hi: P.white, hiDir: [-1, 0] }); hline(x, tx - 20, tx + 20, ty - 8, P.gb1); ellipse(x, tx, ty - 14, 21, 3, P.ink); ellipse(x, tx, ty - 14, 20, 2, it.left ? P.lt2 : P.cr1); if (it.left) for (let k = 0; k < 4; k++) pset(x, tx - 6 + k * 4, ty - 15, P.wd1); if (it.sticks) { line(x, tx - 4, ty - 15, tx + 26, ty - 22, P.wd1); line(x, tx - 2, ty - 14, tx + 28, ty - 19, P.wd1); } }
  else if (it.k === 'cup') { rect(x, tx - 7, ty - 18, 14, 18, P.ink); rect(x, tx - 6, ty - 17, 12, 16, P.glass2); rect(x, tx - 6, ty - 10, 12, 9, it.drink || P.lt2); }
  else if (it.k === 'napkins') { block(x, tx - 10, ty - 14, 20, 14, P.cr0); rect(x, tx - 6, ty - 18, 12, 5, P.white); }
  else if (it.k === 'takeout') { shape(x, [[tx - 26, ty - 22], [tx + 26, ty - 22], [tx + 22, ty], [tx - 22, ty]], P.cr1, { shade: P.cr3, shadeDir: [1, 0], shadeW: 4, hi: P.cr0, hiDir: [-1, 0] }); shape(x, [[tx - 28, ty - 30], [tx + 28, ty - 30], [tx + 26, ty - 22], [tx - 26, ty - 22]], P.cr2, { shade: P.cr3, shadeDir: [0, 1], shadeW: 1 }); rect(x, tx - 8, ty - 16, 16, 8, P.co1); text(x, '夜', tx, ty - 17, P.cr0, FONT.tiny, { align: 'center' }); }
  else if (it.k === 'phone') { // propped against the cup, screen toward her: we see its back and the glow on the cup
    shape(x, [[tx - 9, ty - 34], [tx + 7, ty - 36], [tx + 10, ty], [tx - 6, ty]], P.gb4, { shade: P.gb5, shadeDir: [1, 0], shadeW: 2, hi: P.gb2, hiDir: [-1, 0] }); disc(x, tx - 3, ty - 28, 2, P.ink); pset(x, tx - 3, ty - 28, P.gb2);
    glow(x, tx - 18, ty - 18, 22, 16, P.gb0, 0.35 + 0.1 * Math.sin(t * 3)); }
}
// The bowls, close and level with the table: two bowls, her chopsticks, his hand at his bowl.
function tableClose(x, st, t) {
  rect(x, 0, 0, LW, SH, P.wd3); glow(x, 180, 120, 260, 120, P.lt1, 0.3);
  for (let k = 0; k < 8; k++) { disc(x, 20 + k * 46, 40 + (k % 2) * 10, 6, P.lt1); x.save(); x.globalAlpha = 0.3; disc(x, 20 + k * 46, 40 + (k % 2) * 10, 12, P.lt0); x.restore(); } // the bulbs behind, out of reach
  rect(x, 0, 160, LW, 170, P.cr3); rect(x, 0, 156, LW, 6, P.wd2); hline(x, 0, LW - 1, 156, P.wd1); // the counter behind: stacked bowls, the menu, the pot steaming
  for (let s2 = 0; s2 < 2; s2++) for (let k = 0; k < 6; k++) { ellipse(x, 40 + s2 * 70, 150 - k * 9, 26, 5, P.ink); ellipse(x, 40 + s2 * 70, 149 - k * 9, 25, 4, P.cr0); hline(x, 18 + s2 * 70, 62 + s2 * 70, 151 - k * 9, P.gb1); }
  shape(x, [[220, 80], [330, 80], [324, 156], [226, 156]], P.gb3, { shade: P.gb4, shadeDir: [1, 0], shadeW: 8, hi: P.gb2, hiDir: [-1, 0] }); rect(x, 214, 76, 122, 8, P.ink); rect(x, 215, 77, 120, 6, P.gb2);
  for (let k = 0; k < 8; k++) { const ph = mod(t * 0.4 + k / 8, 1); x.save(); x.globalAlpha = 0.45 * (1 - ph); ellipse(x, 236 + k * 11 + ri(Math.sin(t + k) * 4), 70 - ri(ph * 60), 7 + ri(ph * 6), 5, P.steam); x.restore(); }
  block(x, 150, 180, 60, 90, P.wd4); for (let k = 0; k < 4; k++) { text(x, ['炒粉', '馄饨', '白粥', '豆浆'][k], 156, 186 + k * 20, P.cr0, FONT.small); }
  rect(x, 0, 330, LW, 4, P.ink); rect(x, 0, 334, LW, 30, P.cr2); hline(x, 0, LW - 1, 334, P.cr1); rect(x, 0, 364, LW, SH - 364, P.wd2); for (let k = 0; k < LW; k += 70) vline(x, k + 30, 365, SH - 1, P.wd3);
  // the bowls
  const bowl = (cx, by, left) => { shape(x, [[cx - 62, by - 52], [cx + 62, by - 52], [cx + 46, by], [cx - 46, by]], P.cr0, { shade: P.cr2, shadeDir: [1, 0], shadeW: 10, hi: P.white, hiDir: [-1, 0] }); for (let k = -50; k <= 50; k += 25) { hline(x, cx + k - 4, cx + k + 4, by - 30, P.gb1); pset(x, cx + k, by - 31, P.gb2); } ellipse(x, cx, by - 52, 61, 9, P.ink); ellipse(x, cx, by - 52, 60, 8, P.cr1); ellipse(x, cx, by - 50, 52, 5, P.lt2); for (let k = 0; k < 10; k++) pset(x, cx - 30 + k * 6, by - 51 + (k % 2), k % 3 ? P.wd1 : P.sg2); ellipse(x, cx, by + 1, 40, 3, P.ink); };
  bowl(110, 350, true);
  const lift = st.hisStack || 0; x.save(); x.translate(0, -ri(lift * 30)); bowl(262, 350, true); x.restore();
  // her chopsticks from the left: they lift a few noodles, hold, set them down
  const pk = st.herPick || 0, cy = 300 - pk * 50;
  bustHand(x, [56, cy + 60], -0.45, 2.4, 'hold', { mirror: false });
  line(x, 60, cy + 40, 120, cy - 2, P.ink); line(x, 61, cy + 40, 121, cy - 2, P.wd0); line(x, 66, cy + 46, 124, cy + 4, P.ink); line(x, 67, cy + 46, 125, cy + 4, P.wd0);
  if (pk > 0.2) for (let k = 0; k < 4; k++) line(x, 120 + k, cy - 1, 118 + k * 2, cy + 22 + k * 3, P.lt2);
  band(x, [[-40, SH + 40], [40, cy + 80]], 56, P.cr1, { shade: P.cr2, shadeDir: [1, 0], shadeW: 5 }); // her sleeve (the sweater)
  // his hand on the right, at his bowl
  bustHand(x, [318, 280 - lift * 30], Math.PI + 0.3, 2.5, lift > 0.2 ? 'hold' : 'flat', { mirror: true });
  band(x, [[420, SH + 30], [348, 300 - lift * 30]], 58, P.gb1, { shade: P.gb2, shadeDir: [-1, 0], shadeW: 5 });
  if (st.memory) memoryGrade(x, 1);
}
