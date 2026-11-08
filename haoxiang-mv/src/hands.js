'use strict';
/*
 * First-person hands, drawn big (their own asset, not a scaled figure): her forearms in the
 * blue coat seen from her own eyes, the long cuffs that cover her fingers, folding a cuff;
 * his hands reaching in to fold it for her (memory). Uses bustHand for the hands at b ≈ 3.
 */
// A coat sleeve from `from` (off-frame) to the wrist `w`; `ext` = how far the cuff runs past
// the wrist (long cuff covers the hand), `fold` 0..1 = how much of it is turned back.
function coatSleeve(x, from, w, o = {}) {
  const C = LOOKS2.coat, W = o.width || 98, W0 = o.fromWidth || 170, d = [w[0] - from[0], w[1] - from[1]], n = Math.hypot(...d), u = [d[0] / n, d[1] / n], p = [-u[1], u[0]];
  const ext = (o.ext ?? 26) * (1 - (o.fold || 0)), end = [w[0] + u[0] * ext, w[1] + u[1] * ext], sag = o.sag || 0;
  const P2 = (k, side) => { const q = [from[0] + d[0] * k + u[0] * (k > 1 ? (k - 1) * n : 0), from[1] + d[1] * k]; return q; };
  const half = W / 2, cuffHalf = half * 1.08, h0 = W0 / 2;
  const pts = [[from[0] + p[0] * h0, from[1] + p[1] * h0], [w[0] + p[0] * half * 0.96, w[1] + p[1] * half * 0.96], [end[0] + p[0] * cuffHalf + u[0] * sag, end[1] + p[1] * cuffHalf + u[1] * sag], [end[0] - p[0] * cuffHalf, end[1] - p[1] * cuffHalf], [w[0] - p[0] * half * 0.96, w[1] - p[1] * half * 0.96], [from[0] - p[0] * h0, from[1] - p[1] * h0]];
  shape(x, pts, C[0], { shade: C[1], shadeDir: [Math.round(p[0]) || 0, Math.round(p[1]) || 1], shadeW: 8, hi: C[3], hiDir: [Math.round(-p[0]) || 0, Math.round(-p[1]) || -1] });
  // folds of the fabric, a seam, the hem stitching at the cuff
  for (let k = 0; k < 3; k++) { const a = 0.35 + k * 0.18, q = [from[0] + d[0] * a, from[1] + d[1] * a]; line(x, ri(q[0] + p[0] * half * 0.7), ri(q[1] + p[1] * half * 0.7), ri(q[0] - p[0] * half * 0.1 + u[0] * 14), ri(q[1] - p[1] * half * 0.1 + u[1] * 14), C[1]); }
  { const q0 = [from[0] - p[0] * half * 0.55, from[1] - p[1] * half * 0.55], q1 = [w[0] - p[0] * half * 0.5, w[1] - p[1] * half * 0.5]; line(x, ri(q0[0]), ri(q0[1]), ri(q1[0]), ri(q1[1]), C[2]); }
  for (let k = -cuffHalf + 4; k < cuffHalf - 3; k += 4) pset(x, ri(end[0] + p[0] * k - u[0] * 4), ri(end[1] + p[1] * k - u[1] * 4), C[2]);
  // the turned-back cuff shows the cream lining, in two turns
  const f = o.fold || 0;
  if (f > 0.05) { const bw = 10 * Math.min(1, f * 2), b2 = f > 0.5 ? 10 * Math.min(1, (f - 0.5) * 2) : 0;
    const band2 = (a0, a1, col, sh) => shape(x, [[w[0] + p[0] * cuffHalf * 1.02 - u[0] * a0, w[1] + p[1] * cuffHalf * 1.02 - u[1] * a0], [w[0] + p[0] * cuffHalf * 1.02 - u[0] * a1, w[1] + p[1] * cuffHalf * 1.02 - u[1] * a1], [w[0] - p[0] * cuffHalf * 1.02 - u[0] * a1, w[1] - p[1] * cuffHalf * 1.02 - u[1] * a1], [w[0] - p[0] * cuffHalf * 1.02 - u[0] * a0, w[1] - p[1] * cuffHalf * 1.02 - u[1] * a0]], col, { shade: sh, shadeDir: [Math.round(u[0]) || 0, Math.round(u[1]) || 1], shadeW: 2 });
    band2(-2, bw, P.cr1, P.cr2); if (b2 > 0) band2(bw - 1, bw + b2, C[3], C[0]); }
  return { end, u, p };
}
// her POV, looking down at her forearms in the blue coat over the hall floor
function fpSleeves(x, st, t) {
  if (st.bg === 'pavement') { // the bus stop's paving, in memory
    rect(x, 0, 0, LW, SH, P.cr2); for (let y = 0; y < SH; y += 24) { hline(x, 0, LW - 1, y, P.cr3); for (let k = (y / 24 % 2) * 24; k < LW; k += 48) vline(x, k, y, y + 23, P.cr3); }
    for (let k = 0; k < 60; k++) pset(x, ri(hash(k * 7) * LW), ri(hash(k * 11) * SH), P.cr1);
    shape(x, [[0, 0], [LW, 0], [LW, 60], [0, 60]], P.wd2, { shade: P.wd3, shadeDir: [0, 1], shadeW: 4 }); for (let k = 0; k < LW; k += 60) rect(x, k + 4, 0, 52, 56, P.wd1); // the bench seat's edge
    for (const sx of [96, 214]) { shape(x, [[sx, 520], [sx + 54, 520], [sx + 58, 568], [sx - 4, 568]], P.wd3, { shade: P.wd4, shadeDir: [0, 1], shadeW: 4, hi: P.wd2, hiDir: [0, -1] }); }
  } else fpFloor(x, st, t);
  fpArms(x, st, t);
  if (st.memory) memoryGrade(x, 1);
}
function fpFloor(x, st, t) {
  // the floor below: planks, the mat's edge, the toes of her shoes
  rect(x, 0, 0, LW, SH, P.wd1);
  for (let y = 0; y < SH; y += 34) { hline(x, 0, LW - 1, y, P.wd3); hline(x, 0, LW - 1, y + 1, P.wd0); const off = (y / 34 % 2) * 90; for (let k = -off; k < LW; k += 180) vline(x, k, y + 1, y + 33, P.wd3); for (let k = 0; k < 8; k++) { const gx = ri(hash2(y, k) * LW), gy = y + 6 + ri(hash2(k, y) * 22); hline(x, gx, gx + 12 + ri(hash(k + y) * 20), gy, P.wd2); } }
  shape(x, [[200, 0], [380, 0], [380, 70], [214, 70]], P.co2, { shade: P.co3, shadeDir: [0, 1], shadeW: 3 }); for (let k = 210; k < 380; k += 5) pset(x, k, 66, P.co1); // the door mat, far edge
  for (const sx of [96, 214]) { shape(x, [[sx, 520], [sx + 54, 520], [sx + 58, 568], [sx - 4, 568]], P.wd3, { shade: P.wd4, shadeDir: [0, 1], shadeW: 4, hi: P.wd2, hiDir: [0, -1] }); rect(x, sx + 16, 526, 22, 3, P.wd4); } // her shoes
  x.save(); x.globalAlpha = 0.1; poly(x, [[0, 0], [160, 0], [60, SH], [0, SH]], P.lt0); x.restore();
}
const FP = { lw: [132, 318], rw: [234, 324], lf: [-40, 660], rf: [400, 660], ext: 34 };
function fpCuffEdge(f) { const d = [FP.lw[0] - FP.lf[0], FP.lw[1] - FP.lf[1]], n = Math.hypot(...d); return [FP.lw[0] + d[0] / n * FP.ext * (1 - f), FP.lw[1] + d[1] / n * FP.ext * (1 - f)]; }
function fpArms(x, st, t) {
  // her own coat front between her arms (she is looking down at herself)
  const C = LOOKS2.coat;
  shape(x, [[54, 440], [306, 440], [350, 600], [10, 600]], C[0], { shade: C[1], shadeDir: [0, 1], shadeW: 10, hi: C[3], hiDir: [0, -1] });
  line(x, 180, 441, 184, 568, C[2]); line(x, 181, 441, 185, 568, C[1]); for (const by of [470, 520]) { disc(x, 194, by, 4, P.ink); disc(x, 194, by, 3, P.cr1); pset(x, 193, by - 1, P.cr0); }
  rect(x, 84, 500, 44, 3, C[2]); rect(x, 236, 502, 44, 3, C[2]); // pocket flaps
  const lw = FP.lw, rw = FP.rw;
  const L = coatSleeve(x, FP.lf, lw, { ext: FP.ext, fold: st.foldL || 0, sag: st.slideL || 0 });
  const handL = st.foldL > 0.45;
  if (handL) bustHand(x, [lw[0] + L.u[0] * 30, lw[1] + L.u[1] * 30], Math.atan2(L.u[1], L.u[0]), 3.6, 'open', { mirror: true });
  else if (st.peekL) bustHand(x, L.end, Math.atan2(L.u[1], L.u[0]), 3.2, 'tips', {});
  const rh = st.rHand; // { to: [x, y], k: 0..1, pinch }
  const rwP = rh ? [lerp(rw[0], rh.to[0] + 30, rh.k), lerp(rw[1], rh.to[1] + 34, rh.k)] : rw;
  const R = coatSleeve(x, FP.rf, rwP, { ext: rh && rh.k > 0.3 ? 8 : FP.ext, fold: st.foldR || 0 });
  if (rh && rh.k > 0.05) bustHand(x, [rwP[0] + R.u[0] * 24, rwP[1] + R.u[1] * 24], Math.atan2(R.u[1], R.u[0]), 3.5, rh.pinch ? 'hold' : 'open', {});
  else if (st.foldR > 0.45) bustHand(x, [rw[0] + R.u[0] * 30, rw[1] + R.u[1] * 30], Math.atan2(R.u[1], R.u[0]), 3.6, 'open', {});
  else if (st.peekR) bustHand(x, R.end, Math.atan2(R.u[1], R.u[0]), 3.2, 'tips', {});
  // his hands, reaching in from above to fold her cuff (memory)
  if (st.his) { const k = st.his.k, hx = lw[0] + 20, hy = lerp(20, lw[1] - 64, E.out(Math.min(1, k * 2)));
    for (const [dx, m] of [[-40, false], [40, true]]) { const from = [hx + dx * 4, -60], wr = [hx + dx * 0.6, hy - 20]; band(x, [from, wr], 66, P.gb1, { shade: P.gb2, shadeDir: [m ? -1 : 1, 0], shadeW: 6, hi: P.gb0, hiDir: [m ? 1 : -1, 0] }); band(x, [[wr[0], wr[1] - 10], wr], 70, P.gb2, { shade: P.gb3, shadeDir: [0, 1], shadeW: 2 }); bustHand(x, [wr[0] - (m ? 6 : -6), wr[1] + 26], Math.PI / 2 + (m ? 0.25 : -0.25), 3.0, k > 0.5 ? 'hold' : 'open', { mirror: m }); } }
}
