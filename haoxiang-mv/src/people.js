'use strict';
/*
 * The two of them, full body. One procedural body drawn at the size each shot needs
 * (s = 1 → 58 px tall for street wides, s = 2 → 116 px for interiors), never an
 * enlarged sprite: at s = 2 the same shapes gain folds, buttons, lashes and highlights.
 * Proportions ≈ 3 heads: head 18, torso 16, legs 21 (units × s, feet at y = 0).
 *
 * drawFig(x, who, px, py, o)
 *   who: 'her' | 'him'          view: 'front' | 'back' | 'left' | 'right'
 *   s: scale                     outfit: 'home' | 'coat'   (her)   cuffs: ['long'|'folded', 'long'|'folded'] (coat)
 *   walk: phase 0..1 or null     sit: seat height in units (side/front), or false
 *   handL / handR: hand target relative to the shoulder, in units ([dx, dy]); presets: 'down'
 *   head: { turn: -1..1 (front view, which way the face turns), look: ''|'down'|'up' }
 *   eyes: ''|'closed'|'smile'    mouth: ''|'smile'|'open'|'o'
 *   hold: { R: 'phone'|'keys'|'coat'|'bag'|'cup', L: … }
 *   t: time (blinks, breathing)
 */
const SK = { base: P.sk0, shade: P.sk1, dark: P.sk2, edge: P.sk3 };
const LOOKS2 = {
  her: { hair: [P.hw0, P.hw1, P.hw2], top: [P.cr1, P.cr2, P.cr3], bottom: [P.sg2, P.sg3, P.sg4], legs: P.sk1, shoe: [P.wd2, P.wd3] },
  him: { hair: [P.hm0, P.hm1, P.hm2], top: [P.gb1, P.gb2, P.gb3], bottom: [P.gb4, P.gb5, P.gb5], tee: P.cr0, shoe: [P.wd3, P.wd4] },
  coat: [P.cb1, P.cb2, P.cb3, P.cb0],
  p1: { hair: [P.wd2, P.wd3, P.wd4], top: [P.sg2, P.sg3, P.sg4], bottom: [P.wd3, P.wd4, P.wd4], tee: P.sg1, shoe: [P.ink2, P.ink] }, // a stranger
  p2: { hair: [P.cr3, P.cr4, P.wd3], top: [P.co1, P.co2, P.co3], bottom: [P.gb3, P.gb4, P.gb5], tee: P.co0, shoe: [P.wd3, P.wd4] },
};
function ik(sh, tg, L1, L2, bend) { // two-bone: shoulder → elbow → hand; bend +1/-1 picks the elbow side
  const dx = tg[0] - sh[0], dy = tg[1] - sh[1], d = Math.min(Math.hypot(dx, dy), L1 + L2 - 0.01), a = Math.atan2(dy, dx);
  const c = clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1), e = a + bend * Math.acos(c);
  const el = [sh[0] + Math.cos(e) * L1, sh[1] + Math.sin(e) * L1], h = [sh[0] + Math.cos(a) * d, sh[1] + Math.sin(a) * d];
  return [el, h];
}
function limbBand(x, pts, w, fill, shadeC, o = {}) { band(x, pts, w, fill, { shade: shadeC, shadeDir: o.shadeDir || [1, 0], shadeW: o.shadeW || 1, outline: o.outline }); }
function blinkAt(t, seed) { const k = mod(t * 0.37 + seed * 0.61, 4.1); return k < 0.12; }

function drawFig(x, who, px, py, o = {}) {
  if (o.view === 'left') { x.save(); x.translate(ri(px) * 2 + 1, 0); x.scale(-1, 1); drawFig(x, who, ri(px), py, { ...o, view: 'right', _m: true }); x.restore(); return; }
  const s = o.s || 1, t = o.t || 0, view = o.view || 'front', Lk = LOOKS2[who], coat = who === 'her' && o.outfit === 'coat';
  const w = o.walk, walking = w !== null && w !== undefined && w !== false;
  const ph = walking ? w * TAU : 0, bob = walking ? -Math.abs(Math.sin(ph)) * 0.8 : (Math.sin(t * 1.4 + (who === 'him' ? 1 : 0)) > 0.92 ? -0.5 : 0);
  const sit = o.sit || 0, lift = sit ? (21 - sit) : 0; // sitting lowers the hips to the seat
  const Y0 = bob + lift;
  const sh = (arr, fill, o2 = {}) => shape(x, arr.map(([a, b]) => [px + a * s, py + (b + (o2.fixed ? 0 : Y0)) * s]), fill, o2.o || {});
  const pts = (arr, fixed) => arr.map(([a, b]) => [px + a * s, py + (b + (fixed ? 0 : Y0)) * s]);
  const isSide = view === 'right', isBack = view === 'back';
  // ---------------- legs and feet
  const legW = 4.8, shoe = Lk.shoe;
  const legCol = who === 'him' ? Lk.bottom : [Lk.legs, P.sk2, P.sk3];
  if (sit && isSide) { // thighs forward on the seat, shins down
    for (const far of [true, false]) { const dx = far ? 1 : 0, c = far ? legCol[1] : legCol[0], hipP = [0 + dx, -sit], knee = [9 + dx, -sit], foot = [9 + dx, 0];
      band(x, pts([hipP, knee], true), legW * s, c, { shade: legCol[2], shadeDir: [0, 1], shadeW: 1 }); band(x, pts([knee, [foot[0], foot[1] - 1.5]], true), legW * s, c, { shade: legCol[2], shadeDir: [1, 0], shadeW: 1 });
      shape(x, pts([[foot[0] - 2, -2], [foot[0] + 4, -2], [foot[0] + 4.5, 0], [foot[0] - 2, 0]], true), far ? shoe[1] : shoe[0]); }
  } else if (isSide) {
    const swing = walking ? Math.sin(ph) * 0.42 : 0, hip = [0, -21];
    for (const k of [0, 1]) { const far = k === 0, a = far ? -swing : swing, bendBack = Math.max(0, (far ? Math.sin(ph) : -Math.sin(ph))) * 0.5;
      const knee = [hip[0] + Math.sin(a) * 10.5, hip[1] + Math.cos(a) * 10.5], a2 = a - bendBack, foot = [knee[0] + Math.sin(a2) * 9.5, knee[1] + Math.cos(a2) * 9.5];
      const c = far ? legCol[1] : legCol[0];
      band(x, pts([hip, knee, foot]), legW * s, c, { shade: legCol[2], shadeDir: [1, 0], shadeW: 1 });
      const fy = foot[1]; shape(x, pts([[foot[0] - 2.2, fy - 2], [foot[0] + 3.6, fy - 2], [foot[0] + 4.2, fy + 0.3], [foot[0] - 2.2, fy + 0.3]]), far ? shoe[1] : shoe[0], { hi: mixHex(shoe[0], P.white, 0.25), hiDir: [0, -1] });
    }
  } else {
    for (const k of [-1, 1]) { const lf = walking ? Math.max(0, Math.sin(ph) * k) * 2.2 : 0, kx = k * 2.8, sitK = sit ? 6 : 0;
      band(x, pts([[kx, -21], [kx, -1.5 - lf - sitK]]), legW * s, legCol[0], { shade: legCol[1], shadeDir: [k, 0], shadeW: 1 });
      shape(x, pts([[kx - 2.6, -2.4 - lf - sitK], [kx + 2.6, -2.4 - lf - sitK], [kx + 2.8, 0 - lf - sitK], [kx - 2.8, 0 - lf - sitK]]), shoe[0], { hi: mixHex(shoe[0], P.white, 0.25), hiDir: [0, -1] }); }
  }
  // ---------------- arms behind the body (side view: the far arm)
  const shY = -35.5, shX = isSide ? 0 : 7, L1 = 7.6, L2 = 7.4;
  const sleeve = coat ? LOOKS2.coat : Lk.top;
  const preset = (side) => { const v = o[side === 'L' ? 'handL' : 'handR']; if (v && v !== 'down') return v; const sw = walking ? Math.sin(ph + (side === 'L' ? 0 : Math.PI)) * (isSide ? 4 : 1) : 0; return isSide ? [sw * 0.9, 14.6] : [side === 'L' ? -1.6 : 1.6, 14.4 + 0 * sw]; };
  const armPts = (side) => { const sx = isSide ? (side === 'L' ? 0.6 : -0.6) : (side === 'L' ? -shX : shX), shp = [sx, shY], tg = preset(side), target = [sx + tg[0], shY + tg[1]];
    const bend = isSide ? -1 : (side === 'L' ? 1 : -1); const [el, h] = ik(shp, target, L1, L2, bend); return { shp, el, h }; };
  const drawArm = (side, far) => {
    const { shp, el, h } = armPts(side), cuff = coat ? ((o.cuffs || ['long', 'long'])[side === 'L' ? 0 : 1]) : null;
    const c0 = far ? sleeve[1] : sleeve[0], c1 = far ? sleeve[2] : sleeve[1];
    let hand = h;
    if (coat && cuff === 'long') { const dx = h[0] - el[0], dy = h[1] - el[1], n = Math.hypot(dx, dy) || 1; hand = [h[0] + dx / n * 1.6, h[1] + dy / n * 1.6]; }
    band(x, pts([shp, el, hand]), (coat ? 4.8 : 4.2) * s, c0, { shade: c1, shadeDir: [0, 1], shadeW: 1 });
    if (coat && cuff === 'folded') { const dx = h[0] - el[0], dy = h[1] - el[1], n = Math.hypot(dx, dy) || 1, c = [h[0] - dx / n * 1.4, h[1] - dy / n * 1.4]; band(x, pts([[c[0] - dx / n * 1.2, c[1] - dy / n * 1.2], c]), 5 * s, LOOKS2.coat[3], { shade: LOOKS2.coat[0], shadeDir: [0, 1], shadeW: 1 }); }
    if (!(coat && cuff === 'long')) { const [hx, hy] = pts([h])[0]; if (s >= 2) { disc(x, hx, hy, ri(1.9 * s), SK.edge); disc(x, hx, hy, ri(1.9 * s) - 1, far ? SK.shade : SK.base); pset(x, ri(hx) - 1, ri(hy) - 1, SK.base); } else { rect(x, ri(hx) - 1, ri(hy) - 1, 2, 2, far ? SK.shade : SK.base); pset(x, ri(hx), ri(hy), SK.dark); } }
    const it = o.hold && o.hold[side]; if (it) heldItem(x, it, pts([h])[0], s, view, far);
  };
  if (isSide) drawArm('L', true);
  if (isBack) { drawArm('L', false); drawArm('R', false); }
  // ---------------- body
  if (who === 'her' && !coat) { // sweater and skirt
    if (isSide) sh([[-5, -23], [5, -23], [7.5, -8.5], [-6, -8.5]], Lk.bottom[0], { o: { shade: Lk.bottom[1], shadeDir: [1, 0], shadeW: 2, hi: P.sg1, hiDir: [-1, 0] } });
    else { sh([[-6.6, -23], [6.6, -23], [9.4, -8.5], [-9.4, -8.5]], Lk.bottom[0], { o: { shade: Lk.bottom[1], shadeDir: [1, 0], shadeW: 2, hi: P.sg1, hiDir: [-1, 0] } }); if (s >= 2) for (const k of [-4, 0, 4]) line(x, ...pts([[k * 0.7, -21]])[0], ...pts([[k * 1.1, -10]])[0], Lk.bottom[1]); }
    if (isSide) sh([[-4.6, -37.5], [3.6, -37.5], [5.4, -30], [4.6, -22], [-4.6, -22], [-5.4, -30]], Lk.top[0], { o: { shade: Lk.top[1], shadeDir: [-1, 0], shadeW: 2, hi: P.cr0, hiDir: [1, 0] } });
    else sh([[-7, -37.5], [7, -37.5], [7.8, -28], [7, -22], [-7, -22], [-7.8, -28]], Lk.top[0], { o: { shade: Lk.top[1], shadeDir: [1, 0], shadeW: 2, hi: P.cr0, hiDir: [-1, 0] } });
    if (s >= 2 && !isBack) { const [a, b] = pts([[isSide ? 1 : -6, -23.5]])[0]; for (let k = 0; k < (isSide ? 8 : 13) * s / 2; k += 2) pset(x, a + k, b, Lk.top[2]); } // ribbed hem
  } else if (who === 'her' && coat) {
    const C = LOOKS2.coat;
    if (isSide) sh([[-6, -38.5], [4.5, -38.5], [7.6, -11], [-7.4, -11]], C[0], { o: { shade: C[1], shadeDir: [-1, 0], shadeW: 2, hi: C[3], hiDir: [1, 0] } });
    else { sh([[-8.2, -38.5], [8.2, -38.5], [10.2, -11], [-10.2, -11]], C[0], { o: { shade: C[1], shadeDir: [1, 0], shadeW: 2, hi: C[3], hiDir: [-1, 0] } });
      if (!isBack) { line(x, ...pts([[0, -36]])[0], ...pts([[0.5, -11.5]])[0], C[2]); for (const k of [-31, -25, -19]) { const [a, b] = pts([[1.8, k]])[0]; pset(x, a, b, P.cr1); } const [n0, n1] = pts([[-3, -38]])[0], [m0, m1] = pts([[0, -33]])[0], [q0, q1] = pts([[3, -38]])[0]; line(x, n0, n1, m0, m1, C[2]); line(x, q0, q1, m0, m1, C[2]); }
      if (s >= 2) { const [p0, p1] = pts([[-7.5, -24]])[0]; rect(x, p0, p1, ri(4 * s), 1, C[2]); const [r0, r1] = pts([[3.5, -24]])[0]; rect(x, r0, r1, ri(4 * s), 1, C[2]); } } // pockets
  } else { // him: shirt open over a tee, trousers
    if (isSide) { sh([[-4.6, -37.5], [4, -37.5], [5.4, -29], [5, -20], [-4.8, -20], [-5.2, -29]], Lk.top[0], { o: { shade: Lk.top[1], shadeDir: [-1, 0], shadeW: 2, hi: P.gb0, hiDir: [1, 0] } }); }
    else { sh([[-7.4, -37.5], [7.4, -37.5], [8, -28], [7.6, -20], [-7.6, -20], [-8, -28]], Lk.top[0], { o: { shade: Lk.top[1], shadeDir: [1, 0], shadeW: 2, hi: P.gb0, hiDir: [-1, 0] } });
      if (!isBack) { sh([[-2.6, -37.5], [2.6, -37.5], [2.2, -20.5], [-2.2, -20.5]], Lk.tee, { o: { shade: P.cr2, shadeDir: [1, 0], shadeW: 1, outline: false } }); line(x, ...pts([[-2.6, -37]])[0], ...pts([[-2.4, -20.5]])[0], Lk.top[2]); line(x, ...pts([[2.6, -37]])[0], ...pts([[2.4, -20.5]])[0], Lk.top[2]); } }
  }
  // neck
  { const [nx, ny] = pts([[isSide ? 0.5 : 0, -39.5]])[0]; rect(x, nx - ri(1.6 * s), ny, ri(3.2 * s), ri(2.4 * s), SK.shade); }
  // ---------------- head
  drawHeadFull(x, who, px, py, s, view, Y0, o, t);
  // ---------------- arms in front
  if (!isBack) { if (isSide) drawArm('R', false); else { drawArm('L', false); drawArm('R', false); } }
}
function drawHeadFull(x, who, px, py, s, view, Y0, o, t) {
  const hd = o.head || {}, look = hd.look || '', turn = view === 'front' ? (hd.turn || 0) : 0, k = 0.31 * s;
  const hx = px + (view === 'right' ? 1.2 : turn * 1.2) * s, hy = py + (-48.6 + Y0 + (look === 'down' ? 0.8 : look === 'up' ? -0.6 : 0)) * s;
  if (view === 'back') { backHead(x, who, hx, hy, k); return; }
  headDraw(x, who, hx, hy, k, view === 'right', { ...o, blush: s >= 1.5 ? (o.blush ?? 0.6) : 0 }, t);
}
function backHead(x, who, hx, hy, b) {
  const H = LOOKS2[who].hair, R = (u, v) => [hx + u * b, hy + v * b];
  const pts = []; for (let k = 0; k < 32; k++) { const a = k / 32 * TAU; pts.push(R(Math.cos(a) * 32, Math.sin(a) * 31)); }
  shape(x, pts, H[0], { shade: H[1], shadeDir: [1, 1], shadeW: Math.max(1, ri(4 * b)), hi: mixHex(H[0], P.white, 0.15), hiDir: [0, -1] });
  if (who === 'her') { shape(x, [R(-35, -4), R(35, -4), R(36, 24), R(14, 30), R(-14, 30), R(-36, 24)], H[0], { shade: H[1], shadeDir: [0, 1], shadeW: Math.max(1, ri(4 * b)) }); if (b >= 0.6) for (const u of [-20, -6, 8, 22]) line(x, ...R(u, 0), ...R(u * 1.05, 26), H[1]); shape(x, [R(14, -22), R(28, -24), R(29, -18), R(15, -16)], P.co1, { shade: P.co2, shadeDir: [0, 1], shadeW: 1 }); }
  else for (let u = -24; u <= 24; u += 8) pset(x, ...R(u, 26), H[1]);
}
function eyesAt(x, list, s, o, t, who) {
  const closed = o.eyes === 'closed' || (o.eyes !== 'open' && blinkAt(t, who === 'her' ? 1 : 2.3)), smile = o.eyes === 'smile';
  for (const [ex, ey] of list) {
    const X = ri(ex), Y = ri(ey);
    if (closed || smile) { const w = Math.max(1, ri(1.4 * s)); hline(x, X - w + 1, X + w - 1, Y + (smile ? 0 : 1), P.ink); if (smile && s >= 2) { pset(x, X - w, Y + 1, P.ink); pset(x, X + w, Y + 1, P.ink); } }
    else { const h = Math.max(2, ri(1.6 * s)), w = Math.max(1, ri(0.7 * s)); rect(x, X - (w > 1 ? 1 : 0), Y - h + 1, w, h, P.ink); if (s >= 2) pset(x, X - 1, Y - h + 1, P.white); }
  }
}
function mouthAt(x, [mx, my], s, m, side) {
  const X = ri(mx), Y = ri(my);
  if (m === 'smile') { if (s >= 2) { pset(x, X - 1, Y, P.co3); pset(x, X, Y + 1, P.co3); pset(x, X + 1, Y, P.co3); } else pset(x, X, Y, P.co3); }
  else if (m === 'open' || m === 'o') { rect(x, X - (s >= 2 ? 1 : 0), Y, s >= 2 ? 2 : 1, s >= 2 ? 2 : 1, P.co3); }
  else if (s >= 2) hline(x, X - 1, X, Y, P.sk3);
}
function heldItem(x, it, [hx, hy], s, view, far) {
  hx = ri(hx); hy = ri(hy);
  if (it === 'phone') { const w = ri(3 * s), h = ri(5 * s); rect(x, hx - ri(w / 2), hy - h + 1, w, h, P.ink); rect(x, hx - ri(w / 2) + 1, hy - h + 2, w - 2, h - 2, P.gb2); if (s >= 2) pset(x, hx - ri(w / 2) + 1, hy - h + 2, P.gb0); }
  else if (it === 'keys') { pset(x, hx, hy + 1, P.lt2); pset(x, hx + 1, hy + 2, P.lt2); if (s >= 2) { pset(x, hx + 1, hy + 3, P.lt1); pset(x, hx - 1, hy + 2, P.co1); } }
  else if (it === 'bag') { const w = ri(6 * s), h = ri(7 * s); shape(x, [[hx - w / 2, hy + 1 * s], [hx + w / 2, hy + 1 * s], [hx + w / 2 + 1, hy + h], [hx - w / 2 - 1, hy + h]], P.cr2, { shade: P.cr3, shadeDir: [1, 1], shadeW: 1 }); line(x, hx - 2, hy + s, hx, hy - 1, P.wd3); line(x, hx + 2, hy + s, hx, hy - 1, P.wd3); }
  else if (it === 'cup') { rect(x, hx - ri(2 * s), hy - ri(3 * s), ri(4 * s), ri(4 * s), P.ink); rect(x, hx - ri(2 * s) + 1, hy - ri(3 * s) + 1, ri(4 * s) - 2, ri(4 * s) - 2, P.cr0); }
  else if (it === 'coat') { const C = LOOKS2.coat; shape(x, [[hx - 3 * s, hy - 1 * s], [hx + 3 * s, hy - 1 * s], [hx + 5 * s, hy + 16 * s], [hx - 4 * s, hy + 16 * s]], C[0], { shade: C[1], shadeDir: [1, 0], shadeW: ri(2 * s), hi: C[3], hiDir: [-1, 0] }); line(x, hx, hy, hx + s, hy + 15 * s, C[2]); }
}
