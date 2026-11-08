'use strict';
/*
 * Half-body (waist-up) figures for medium shots and close two-shots: their own drawing,
 * not an enlarged full figure. Head ≈ 60 px wide at b = 1, eyes with a highlight and lid,
 * brows, blush, a mouth that can smile, open, or talk; shoulders and arms that reach to
 * real hands (palm, thumb, fingers). Origin (cx, by) = middle of the bottom edge of the
 * body; y grows upward as negative units.
 *
 * drawBust(x, who, cx, by, o)
 *   view: 'front' | 'right' | 'left'     b: scale            outfit: 'home' | 'coat'
 *   armL / armR: { to: [u, v] hand position in units, kind: 'open'|'hold'|'point'|'fist'|'flat', behind }
 *   cuffs: ['long'|'folded', …] (coat)  head: { tilt (rad), look: ''|'down'|'up'|'side'|'away', turn }
 *   eyes: ''|'closed'|'smile'|'wide'    mouth: ''|'smile'|'open'|'talk'|'grin'      blush: 0..1
 *   hold: { R|L: 'phone'|'chopsticks'|'cup'|'keys' }   t
 */
const BU = { headR: 30, shY: -112, shX: 50, L1: 44, L2: 42 };
function drawBust(x, who, cx, by, o = {}) {
  if (o.view === 'left') { x.save(); x.translate(ri(cx) * 2 + 1, 0); x.scale(-1, 1); drawBust(x, who, ri(cx), by, { ...o, view: 'right', _mirror: true }); x.restore(); return; }
  const b = o.b || 1, t = o.t || 0, side = o.view === 'right', Lk = LOOKS2[who], coat = who === 'her' && o.outfit === 'coat';
  const breathe = Math.round(Math.sin(t * 1.6 + (who === 'him' ? 2 : 0)) * 0.6 + 0.4) * 0.5; // a pixel at most
  const U = (u, v) => [cx + u * b, by + (v - (v < -100 ? breathe : 0)) * b];
  const S = (arr, fill, oo = {}) => shape(x, arr.map(([u, v]) => U(u, v)), fill, oo);
  const cloth = coat ? LOOKS2.coat : Lk.top;
  // ---------------- the far arm (profile) or arms marked behind
  const armDraw = (key, far) => { const a = o[key]; if (!a) return; drawBustArm(x, who, cx, by, b, key === 'armL' ? 'L' : 'R', a, { side, far, coat, cuffs: o.cuffs, cloth, hold: o.hold, t, breathe }); };
  if (side) armDraw('armL', true);
  if (!side) { if (o.armL && o.armL.behind) armDraw('armL', false); if (o.armR && o.armR.behind) armDraw('armR', false); }
  // ---------------- torso
  if (side) {
    S([[-30, -114], [8, -116], [24, -104], [30, -80], [28, -40], [30, 0], [-30, 0], [-34, -50], [-36, -96]], cloth[0], { shade: cloth[1], shadeDir: [-1, 0], shadeW: ri(6 * b), hi: cloth[3] || mixHex(cloth[0], P.white, 0.3), hiDir: [1, 0] });
    if (coat) { S([[6, -116], [22, -106], [12, -82], [2, -100]], LOOKS2.coat[1], { shade: LOOKS2.coat[2], shadeDir: [0, 1], shadeW: 2 }); for (const v of [-70, -42, -16]) { const [a, c] = U(22, v); rect(x, a, c, ri(2 * b), ri(2 * b), P.cr1); } }
    else if (who === 'him') { S([[10, -114], [24, -104], [26, -60], [18, -60], [16, -100]], Lk.tee, { shade: P.cr2, shadeDir: [-1, 0], shadeW: 2 }); }
    else { for (let k = 0; k < 12; k++) { const [a, c] = U(-26 + k * 4.6, -6); vline(x, a, c, c + ri(5 * b), Lk.top[2]); } } // ribbed hem of the sweater
  } else {
    const w0 = coat ? 56 : 50;
    S([[-16, -120], [16, -120], [w0 - 14, -116], [w0 - 4, -108], [w0, -96], [w0 + 1, -70], [w0 - 4, -30], [w0 - 2, 0], [-w0 + 2, 0], [-w0 + 4, -30], [-w0 - 1, -70], [-w0, -96], [-w0 + 4, -108], [-w0 + 14, -116]], cloth[0], { shade: cloth[1], shadeDir: [1, 0], shadeW: ri(7 * b), hi: cloth[3] || mixHex(cloth[0], P.white, 0.3), hiDir: [-1, 0] });
    if (coat) { const C = LOOKS2.coat; S([[-18, -118], [0, -86], [-6, -40], [-14, -96]], C[1], { shade: C[2], shadeDir: [1, 0], shadeW: 2 }); S([[18, -118], [0, -86], [6, -40], [14, -96]], C[1], { shade: C[2], shadeDir: [1, 0], shadeW: 2 }); S([[-10, -118], [10, -118], [0, -88]], LOOKS2.her.top[0], { shade: LOOKS2.her.top[1], shadeDir: [0, 1], shadeW: 2 }); for (const v of [-60, -34, -8]) { const [a, c] = U(-4, v); rect(x, a, c, ri(3 * b), ri(3 * b), P.cr1); pset(x, a, c, P.cr0); } }
    else if (who === 'him') { S([[-14, -118], [14, -118], [12, 0], [-12, 0]], Lk.tee, { shade: P.cr2, shadeDir: [1, 0], shadeW: 2 }); for (const sgn of [-1, 1]) S([[sgn * 14, -118], [sgn * 26, -112], [sgn * 18, -84], [sgn * 13, -100]], Lk.top[1], { shade: Lk.top[2], shadeDir: [0, 1], shadeW: 2 }); for (let k = -50; k < -4; k += 18) { const [a, c] = U(16, k); pset(x, a, c, P.gb0); } }
    else { S([[-14, -118], [14, -118], [8, -108], [-8, -108]], P.sk1, { outline: false }); { const [a0, a1] = U(-14, -118), [b0] = U(14, -118); hline(x, a0, b0, a1, Lk.top[2]); } for (let k = 0; k < 20; k++) { const [a, c] = U(-46 + k * 4.8, -6); vline(x, a, c, c + ri(5 * b), Lk.top[2]); } for (let k = 0; k < 7; k++) { const [a, c] = U(-30 + k * 10, -90 + (k % 2) * 14); pset(x, a, c, Lk.top[2]); } } // collar, ribbed hem, knit texture
  }
  // neck
  { const [nx, ny] = U(side ? 2 : 0, -130); rect(x, nx - ri(8 * b), ny, ri(16 * b), ri(14 * b), SK.shade); rect(x, nx - ri(8 * b), ny, ri(16 * b), ri(4 * b), SK.dark); }
  // ---------------- head
  bustHead(x, who, cx, by, b, side, o, t, breathe);
  // ---------------- arms in front
  if (side) armDraw('armR', false);
  else { if (o.armL && !o.armL.behind) armDraw('armL', false); if (o.armR && !o.armR.behind) armDraw('armR', false); }
}
function bustHead(x, who, cx, by, b, side, o, t, breathe) {
  const hd = o.head || {}, look = hd.look || '', nod = look === 'down' ? 4 : look === 'up' ? -3 : 0;
  headDraw(x, who, cx + (side ? 4 : (hd.turn || 0) * 4) * b, by + (-158 + nod - breathe) * b, b, side, o, t);
}
// One head design for every size: b = 1 at bust scale (≈ 62 px wide); the full figure uses b = 0.31 × s.
function headDraw(x, who, hx, hy, b, side, o, t) {
  const hd = o.head || {}, look = hd.look || '', Lk = LOOKS2[who], H = Lk.hair, tilt = hd.tilt || 0, fine = b >= 0.6;
  const rot = (u, v) => { const c = Math.cos(tilt), s = Math.sin(tilt); return [hx + (u * c - v * s) * b, hy + (u * s + v * c) * b]; };
  const S = (arr, fill, oo = {}) => shape(x, arr.map(([u, v]) => rot(u, v)), fill, oo);
  const face = []; for (let k = 0; k < 40; k++) { const a = k / 40 * TAU, c = Math.cos(a), s = Math.sin(a); face.push([c * 31 * (s > 0 ? 0.92 - s * 0.06 : 1), s * 29 * (s > 0 ? 1.06 : 1)]); }
  if (side) {
    S([[-30, 2], [-26, -18], [-10, -30], [10, -30], [24, -22], [28, -10], [29, -4], [34, 3], [30, 6], [30, 9], [28, 11], [29, 14], [26, 20], [16, 27], [4, 30], [-10, 28], [-24, 20]], SK.base, { outline: SK.edge, shade: SK.shade, shadeDir: [-1, 0], shadeW: ri(4 * b) });
    if (who === 'her') { S([[10, -33], [22, -28], [29, -17], [24, -11], [17, -14], [11, -9], [5, -12], [3, -5], [1, 4], [-1, 14], [5, 25], [-6, 29], [-22, 27], [-33, 13], [-33, -8], [-25, -25], [-10, -34]], H[0], { shade: H[1], shadeDir: [-1, 1], shadeW: ri(4 * b), hi: mixHex(H[0], P.white, 0.2), hiDir: [0, -1] }); S([[6, -27], [18, -28], [18, -23], [6, -22]], P.co1, { shade: P.co2, shadeDir: [0, 1], shadeW: 1, hi: P.co0, hiDir: [0, -1] }); if (fine) for (let k = 0; k < 4; k++) line(x, ...rot(-6 + k * 2, 6 + k), ...rot(-2 + k * 2, 24), H[1]); }
    else { S([[10, -34], [24, -27], [31, -16], [26, -12], [18, -16], [9, -13], [3, -12], [-1, -4], [-4, 2], [-10, 9], [-24, 14], [-32, 4], [-31, -12], [-23, -27], [-6, -35]], H[0], { shade: H[1], shadeDir: [-1, 1], shadeW: ri(4 * b), hi: mixHex(H[0], P.white, 0.15), hiDir: [0, -1] }); S([[-6, -2], [0, -4], [2, 5], [-3, 9], [-8, 4]], SK.shade, { outline: SK.edge }); pset(x, ...rot(-3, 2), SK.dark); }
    if (fine) for (let k = 0; k < 5; k++) line(x, ...rot(-20 + k * 9, -28), ...rot(-24 + k * 8, -10), H[1]);
    bustEye(x, rot(18, 0 + (look === 'down' ? 2 : look === 'up' ? -2 : 0)), b, o, t, who, true);
    if (b >= 0.45) { const [bx, byy] = rot(20, -10); hline(x, bx - ri(3 * b), bx + ri(4 * b), byy + (look === 'up' ? -1 : 0), H[1]); }
    if (o.blush !== 0) { x.save(); x.globalAlpha = 0.55 * (o.blush ?? 0.6); ellipse(x, ...rot(18, 10), ri(5 * b), ri(2 * b), P.blush); x.restore(); }
    bustMouth(x, rot(28, 12), b * 0.6, o.mouth, t, true);
    return;
  }
  const turn = hd.turn || 0, lookX = look === 'side' ? 3 : look === 'away' ? -3 : 0, lookY = look === 'down' ? 3 : look === 'up' ? -3 : 0;
  // back hair (her bob reaches the jaw), face, front hair with bangs
  if (who === 'her') S([[-35, -6], [-30, -26], [-14, -34], [14, -34], [30, -26], [35, -6], [36, 22], [26, 28], [-26, 28], [-36, 22]], H[1], { shade: H[2], shadeDir: [0, 1], shadeW: ri(3 * b) });
  S(face, SK.base, { outline: SK.edge, shade: SK.shade, shadeDir: [turn > 0 ? -1 : 1, 1], shadeW: ri(3 * b) });
  if (who === 'her') {
    S([[-36, 2], [-34, -18], [-22, -32], [0, -36], [22, -32], [34, -18], [36, 2], [36, 24], [28, 26], [26, -2], [22, -12 + turn * 2], [14, -6], [8, -14], [2, -6], [-6, -12], [-14, -4], [-22, -10], [-26, -2], [-28, 26], [-36, 24]], H[0], { shade: H[1], shadeDir: [0, 1], shadeW: ri(3 * b), hi: mixHex(H[0], P.white, 0.2), hiDir: [0, -1] });
    if (fine) for (const u of [-24, -14, -4, 8, 18, 26]) line(x, ...rot(u, -30), ...rot(u * 0.92, -12), H[1]);
    if (fine) for (let k = 0; k < 6; k++) pset(x, ...rot(-16 + k * 3, -30 + Math.abs(k - 2.5) * 0.6), mixHex(H[0], P.white, 0.35)); // a band of shine
    S([[16, -24], [28, -26], [29, -21], [17, -19]], P.co1, { shade: P.co2, shadeDir: [0, 1], shadeW: 1, hi: P.co0, hiDir: [0, -1] }); // the clip
  } else {
    S([[-33, 4], [-32, -18], [-20, -33], [0, -37], [20, -33], [32, -18], [33, 4], [28, 2], [27, -8], [20, -14], [12, -8], [6, -16], [-2, -10], [-10, -16], [-18, -8], [-26, -10], [-28, 2]], H[0], { shade: H[1], shadeDir: [0, 1], shadeW: ri(3 * b), hi: mixHex(H[0], P.white, 0.15), hiDir: [0, -1] });
    if (fine) for (const u of [-20, -9, 2, 13, 22]) line(x, ...rot(u, -32), ...rot(u + 3, -14), H[1]);
    if (fine) for (let k = 0; k < 5; k++) pset(x, ...rot(-10 + k * 3, -32), mixHex(H[0], P.white, 0.25));
  }
  // ears (him; her ears are under the bob)
  if (who === 'him') for (const sg of [-1, 1]) { const [ex, ey] = rot(sg * 31, 2); disc(x, ex, ey, ri(4 * b), SK.edge); disc(x, ex, ey, ri(4 * b) - 1, SK.shade); }
  // brows, eyes, nose, blush, mouth
  if (b >= 0.45) for (const sg of [-1, 1]) { const [a, c] = rot(sg * 12 + turn * 3 + lookX * 0.3, -14 + (look === 'up' ? -2 : 0)); hline(x, a - ri(4 * b), a + ri(4 * b), c, H[1]); pset(x, a + sg * ri(4 * b), c + 1, H[1]); }
  bustEye(x, rot(-12 + turn * 3 + lookX, 0 + lookY), b, o, t, who, false);
  bustEye(x, rot(12 + turn * 3 + lookX, 0 + lookY), b, o, t, who, false);
  if (b >= 0.45) { const [nx, ny] = rot(turn * 4, 9); pset(x, nx, ny, SK.dark); pset(x, nx + 1, ny + 1, SK.shade); }
  if (o.blush !== 0) { x.save(); x.globalAlpha = 0.55 * (o.blush ?? 0.6); for (const sg of [-1, 1]) ellipse(x, ...rot(sg * 19 + turn * 3, 12), ri(5 * b), ri(2.4 * b), P.blush); x.restore(); }
  bustMouth(x, rot(turn * 4, 18), b, o.mouth, t, false);
}
function bustEye(x, [ex, ey], b, o, t, who, side) {
  ex = ri(ex); ey = ri(ey);
  const blink = o.eyes !== 'open' && o.eyes !== 'wide' && blinkAt(t, who === 'her' ? 1.3 : 2.9);
  const w = Math.max(1, ri(5 * b)), h = Math.max(2, ri((o.eyes === 'wide' ? 9 : 8) * b));
  if (b < 0.45 && !(o.eyes === 'closed' || blink || o.eyes === 'smile')) { rect(x, ex, ey - h + 1, w > 1 ? 2 : 1, h, P.ink); if (b >= 0.38) pset(x, ex, ey - h + 1, P.white); return; }
  if (o.eyes === 'closed' || blink) { hline(x, ex - ri(w / 2) - 1, ex + ri(w / 2), ey + ri(h / 4), P.ink); pset(x, ex - ri(w / 2) - 1, ey + ri(h / 4) - 1, P.ink); return; }
  if (o.eyes === 'smile') { for (let k = -2; k <= 2; k++) pset(x, ex + ri(k * w / 4), ey + ri(h / 4) - (2 - Math.abs(k)) * ri(b), P.ink); for (let k = -1; k <= 1; k++) pset(x, ex + ri(k * w / 4), ey + ri(h / 4) - (2 - Math.abs(k)) * ri(b) + 1, P.ink); return; }
  rect(x, ex - ri(w / 2), ey - ri(h / 2), w, h, P.ink); rect(x, ex - ri(w / 2) + 1, ey - ri(h / 2) + ri(h / 2), w - 2, ri(h / 2) - 1, mixHex(P.ink, P.gb3, 0.5)); // iris lighter at the bottom
  rect(x, ex - ri(w / 2) + 1, ey - ri(h / 2) + 1, ri(2 * b), ri(2 * b), P.white); pset(x, ex + ri(w / 2) - 2, ey + ri(h / 2) - 2, P.white); // highlights
  hline(x, ex - ri(w / 2) - 1, ex + ri(w / 2) + (side ? 1 : 0), ey - ri(h / 2) - 1, P.ink); // lid
  if (who === 'her') pset(x, ex + ri(w / 2) + 1, ey - ri(h / 2) - 2, P.ink); // a lash flick
}
function bustMouth(x, [mx, my], b, m, t, side) {
  mx = ri(mx); my = ri(my); const w = ri(6 * b);
  const talk = m === 'talk' ? (Math.floor(t * 7) % 3) : -1;
  if (m === 'smile') { hline(x, mx - ri(w / 2) + 1, mx + ri(w / 2) - 1, my + 1, P.co3); pset(x, mx - ri(w / 2), my, P.co3); pset(x, mx + ri(w / 2), my, P.co3); }
  else if (m === 'grin') { rect(x, mx - ri(w / 2), my, w, ri(3 * b), P.co3); hline(x, mx - ri(w / 2) + 1, mx + ri(w / 2) - 2, my, P.white); rect(x, mx - ri(w / 4), my + ri(2 * b), ri(w / 2), 1, P.co1); }
  else if (m === 'open' || talk === 1) { rect(x, mx - ri(w / 4), my - 1, ri(w / 2), ri(4 * b), P.co3); rect(x, mx - ri(w / 4) + 1, my + ri(2 * b), ri(w / 2) - 2, ri(b), P.co1); }
  else if (talk === 2) { rect(x, mx - ri(w / 3), my, ri(w * 2 / 3), ri(2 * b), P.co3); }
  else { hline(x, mx - ri(w / 3), mx + ri(w / 3) - 1, my + 1, P.sk3); }
}
// An arm of the bust: shoulder → elbow → hand, sleeve with cuff, and a hand shaped by `kind`.
function drawBustArm(x, who, cx, by, b, sideKey, a, o) {
  const side = o.side, far = o.far, cloth = o.cloth, coat = o.coat;
  const shp = side ? [sideKey === 'L' ? -4 : 2, -104] : [sideKey === 'L' ? -BU.shX + 8 : BU.shX - 8, -100];
  const tg = a.to || [shp[0] * 1.05, 20], bend = side ? (a.bend ?? -1) : (sideKey === 'L' ? 1 : -1) * (a.bend ?? 1);
  const [el, h] = ik(shp, tg, BU.L1, BU.L2, bend);
  const U = (p) => [cx + p[0] * b, by + p[1] * b];
  const c0 = far ? cloth[1] : cloth[0], c1 = far ? cloth[2] : cloth[1];
  const cuff = coat ? ((o.cuffs || ['long', 'long'])[sideKey === 'L' ? 0 : 1]) : null;
  const dir = [h[0] - el[0], h[1] - el[1]], n = Math.hypot(...dir) || 1, d = [dir[0] / n, dir[1] / n];
  const wrist = [h[0] - d[0] * 8, h[1] - d[1] * 8];
  let sleeveEnd = cuff === 'long' ? [h[0] + d[0] * 4, h[1] + d[1] * 4] : wrist;
  band(x, [U(shp), U(el), U(sleeveEnd)], (coat ? 24 : 20) * b, c0, { shade: c1, shadeDir: [0, 1], shadeW: ri(4 * b), hi: cloth[3] || mixHex(cloth[0], P.white, 0.25), hiDir: [0, -1] });
  if (s_folds(b)) { const m = [(el[0] + sleeveEnd[0]) / 2, (el[1] + sleeveEnd[1]) / 2]; line(x, ...U([m[0] - d[1] * 6, m[1] + d[0] * 6]), ...U([m[0] + d[0] * 5, m[1] + d[1] * 5]), c1); }
  if (cuff !== 'long') {
    if (cuff === 'folded') band(x, [U([wrist[0] - d[0] * 7, wrist[1] - d[1] * 7]), U(wrist)], 27 * b, LOOKS2.coat[3], { shade: LOOKS2.coat[0], shadeDir: [0, 1], shadeW: 2 });
    else if (!coat) band(x, [U([wrist[0] - d[0] * 4, wrist[1] - d[1] * 4]), U(wrist)], 21 * b, cloth[1], { shade: cloth[2], shadeDir: [0, 1], shadeW: 1 });
    bustHand(x, U(h), Math.atan2(d[1], d[0]), b, a.kind || 'open', { far, mirror: (sideKey === 'L') !== !!a.flip });
  } else { const [ex, ey] = U(sleeveEnd); for (let k = -3; k <= 3; k++) pset(x, ri(ex - d[1] * k * 3 * b), ri(ey + d[0] * k * 3 * b), LOOKS2.coat[2]); if (a.peek) bustHand(x, U([h[0] + d[0] * 4, h[1] + d[1] * 4]), Math.atan2(d[1], d[0]), b * 0.9, 'tips', { far }); }
  const it = o.hold && o.hold[sideKey]; if (it) bustItem(x, it, U(h), b, Math.atan2(d[1], d[0]), o.t);
}
function s_folds(b) { return b >= 0.8; }
// A hand at bust scale, pointing along `ang`: palm, four fingers, thumb (kind changes the fingers).
function bustHand(x, [hx, hy], ang, b, kind, o = {}) {
  const c = Math.cos(ang), s = Math.sin(ang), m = o.mirror ? -1 : 1;
  const W = (u, v) => [hx + (u * c - v * m * s) * b, hy + (u * s + v * m * c) * b]; // u along the hand, v across
  const sk = { outline: SK.edge, shade: SK.shade, shadeDir: [Math.round(-s * m) || 0, Math.round(c * m) || 1], shadeW: ri(2 * b) };
  if (kind === 'tips') { for (let k = 0; k < 4; k++) shape(x, [W(-2, -5 + k * 3.2), W(3, -5 + k * 3.2), W(3, -3 + k * 3.2), W(-2, -3 + k * 3.2)], SK.base, sk); return; }
  const fl = kind === 'fist' ? 2 : kind === 'hold' ? 4.5 : kind === 'point' ? 3 : 8; // finger length beyond the knuckles
  const th = kind === 'hold' || kind === 'fist' ? [[-5, -6], [-1, -9.5], [3, -9]] : kind === 'flat' ? [[-5, -6], [-2, -10.5], [2.5, -12]] : [[-5, -6], [-1, -10], [3, -11]];
  band(x, th.map(([u, v]) => W(u, v)), 4.2 * b, o.far ? SK.shade : SK.base, { outline: SK.edge, shade: SK.shade, shadeDir: [0, 1], shadeW: 1 }); // the thumb, behind the palm's edge
  shape(x, [W(-8, -7), W(1, -7.5), W(1 + fl, -7), W(2.5 + fl, -4), W(2.5 + fl, 3), W(1.5 + fl, 6.5), W(0, 7), W(-8, 7)], o.far ? SK.shade : SK.base, sk); // palm and the fingers together
  for (const v of [-3.4, 0, 3.4]) line(x, ...W(1.5, v), ...W(1.5 + fl * 0.85, v), SK.shade); // gaps between fingers
  for (const v of [-5, -1.6, 1.8, 5]) pset(x, ...W(1, v), SK.dark); // knuckles
  if (kind === 'point') shape(x, [W(1, -7.5), W(12, -7), W(12.5, -4.5), W(1, -4)], SK.base, sk);
  if (b >= 2 && fl >= 4) { const nail = mixHex(SK.base, P.white, 0.5); for (const v of [-5.2, -1.7, 1.7, 5.0]) { const [a, c] = W(1.2 + fl, v); rect(x, a - ri(b / 2), c - ri(b / 2), Math.max(2, ri(b)), Math.max(2, ri(b)), nail); } for (const v of [-5, -1.6, 1.8, 5]) { const [a, c] = W(1 + fl * 0.45, v); pset(x, a, c, SK.shade); } }

}
function bustItem(x, it, [hx, hy], b, ang, t) {
  hx = ri(hx); hy = ri(hy);
  if (it === 'phone') { const w = ri(16 * b), h = ri(28 * b); shape(x, [[hx - w / 2, hy - h + 6 * b], [hx + w / 2, hy - h + 6 * b], [hx + w / 2, hy + 6 * b], [hx - w / 2, hy + 6 * b]], P.gb4, { shade: P.gb5, shadeDir: [1, 0], shadeW: 1, hi: P.gb2, hiDir: [-1, 0] }); rect(x, hx - ri(w / 2) + 2, hy - h + ri(8 * b), w - 4, h - ri(6 * b), P.co0); }
  else if (it === 'chopsticks') { line(x, hx - ri(4 * b), hy - ri(4 * b), hx + ri(26 * b), hy + ri(6 * b), P.wd1); line(x, hx - ri(4 * b), hy - ri(1 * b), hx + ri(26 * b), hy + ri(10 * b), P.wd1); }
  else if (it === 'cup') { const w = ri(16 * b), h = ri(18 * b); shape(x, [[hx - w / 2, hy - h], [hx + w / 2, hy - h], [hx + w / 2 - 1, hy + 2], [hx - w / 2 + 1, hy + 2]], P.cr0, { shade: P.cr2, shadeDir: [1, 0], shadeW: 3 }); }
}
