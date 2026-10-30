'use strict';
/* Scenes 00:30–01:00 — accumulation ↔ rate → composition → trig → polar →
 * parametric heart → contour morph → recap → silence → logo. */

// ===================================================== 30–34  F(x) and F′
const FT = TL.ftc;
const CAMFT = cam(760, 520, 150), CAMFB = cam(760, 880, 150);
// Particles sampled uniformly (by area) inside the integral region of x² − 1 on [0, 2].
let REGION = null;
function initRegion() {
  const r = rng(31), P = [];
  while (P.length < 1600) {
    const v = r() * 2, y = -1 + r() * 4, f = fI(v);
    if ((y >= 0 && y <= f) || (y < 0 && y >= f)) P.push({ x: v, y, d: r() * 0.12, lift: 180 + r() * 200 });
  }
  REGION = P;
}
function ftcX(t) {
  if (t < FT.scan[0]) return lerp(2, 0, E.inOutCubic(inv(FT.intro[0], FT.scan[0], t))); // the scanner rolls back to 0
  if (t < FT.tangent[0]) return lerp(0, 2, E.inOutSine(inv(FT.scan[0], FT.scan[1], t)));
  return lerp(2, 0.45, E.inOutSine(inv(FT.tangent[0], FT.tangent[1], t)));
}
function sFTC(x, t) {
  bg(x);
  const [i0, i1] = FT.intro;
  const ce = E.inOutCubic(inv(i0, i0 + 0.55, t));
  const ct = camLerp(CAMI2, CAMFT, ce), cb = CAMFB;
  x.save(); x.globalAlpha = 1;
  grid(x, ct, -0.5, 2.5, -1, 3, 0.5, 0.06);
  axes(x, ct, -0.5, 2.6, -1.3, 3.3, { xs: 0.5, ys: 1, xn: 't', yn: 'f(t)' });
  const ba = inv(i0 + 0.15, i0 + 0.55, t);
  x.globalAlpha = ba;
  axes(x, cb, -0.5, 2.6, -1, 1, { xs: 0.5, ys: 0.5, yn: 'F(x)' });
  x.restore();
  stroke(x, plotPath(ct, fI, -0.45, 2.15), C.line, 3.5, { glow: 0.6 });
  // T6: the area leaves as particles that rise, then settle on F(x) at the same x
  const leave = t < i1 + 0.2;
  if (leave) {
    let gone = 0;
    const paths = [new Path2D(), new Path2D()];
    for (const p of REGION) {
      const q = E.inOutCubic(clamp((t - i0 - 0.05 - p.d - 0.12 * p.x) / 0.5));
      gone += q;
      const sx0 = SX(ct, p.x), sy0 = SY(ct, p.y), sx1 = SX(cb, p.x), sy1 = SY(cb, FI(p.x));
      const u = q, w = 1 - u;
      const bx = w * w * w * sx0 + 3 * w * w * u * sx0 + 3 * w * u * u * sx1 + u * u * u * sx1;
      const by = w * w * w * sy0 + 3 * w * w * u * (sy0 - p.lift) + 3 * w * u * u * (sy1 - p.lift * 1.2) + u * u * u * sy1;
      paths[p.y >= 0 ? 0 : 1].rect(bx - 1.5, by - 1.5, 3, 3);
    }
    fillRegion(x, ct, 0, 2, 1 - gone / REGION.length);
    x.save(); x.globalAlpha = 1 - inv(i1 - 0.1, i1 + 0.2, t);
    x.fillStyle = C.blue; x.fill(paths[0]); x.fillStyle = C.coral; x.fill(paths[1]);
    x.restore();
  }
  // F(x): faint whole curve once the particles have landed, bright trace as x moves
  const fr = 2 * inv(i0 + 0.35, i1, t);
  if (fr > 0) stroke(x, plotPath(cb, FI, 0, fr), C.line, 2, { alpha: 0.35 });
  const xs = ftcX(t), stage2 = t >= FT.tangent[0];
  if (t >= FT.scan[0]) {
    fillRegion(x, ct, 0, xs, 1);
    stroke(x, plotPath(cb, FI, 0, stage2 ? 2 : xs), C.line, 3.5, { glow: 0.7 });
    const X = SX(ct, xs);
    line(x, X, SY(ct, 0), X, SY(ct, fI(xs)), C.yellow, 3, { glow: 0.5 });
    line(x, X, SY(ct, 0), SX(cb, xs), SY(cb, FI(xs)), rgba(C.line, 0.22), 1.2, { dash: [4, 6] });
    ball(x, X, SY(ct, 0), 13);
    dot(x, SX(cb, xs), SY(cb, FI(xs)), 7, C.line);
  }
  if (t < FT.scan[0]) ball(x, SX(ct, xs), SY(ct, 0), 13);
  if (t < 30.1) { // the integral's result and signs hand over as the area leaves
    const a = 1 - inv(i0, 30.1, t);
    mtex(x, M`\int_{0}^{2}(x^{2} - 1)\,dx = \frac{2}{3}`, 1360, 360, 52, { alpha: a });
    mtex(x, '+', SX(ct, 1.72), SY(ct, 0.9), 64, { align: 'center', color: C.blue, alpha: a });
    mtex(x, '−', SX(ct, 0.5), SY(ct, -0.38), 64, { align: 'center', color: C.coral, alpha: a });
  }
  if (stage2) { // tangent of F at x, with a run of 1 whose rise is exactly f(x)
    const ta = inv(FT.tangent[0], FT.tangent[0] + 0.3, t), m = fI(xs), X = SX(cb, xs), Y = SY(cb, FI(xs));
    stroke(x, plotPath(cb, v => FI(xs) + m * (v - xs), xs - 0.7, xs + 1.25), slopeColor(m), 2.5, { alpha: ta, glow: 0.6 });
    line(x, X, Y, SX(cb, xs + 1), Y, rgba(C.line, 0.6), 1.5, { dash: [5, 5], alpha: ta });
    line(x, SX(cb, xs + 1), Y, SX(cb, xs + 1), SY(cb, FI(xs) + m), C.yellow, 3, { alpha: ta, glow: 0.5 });
    tag(x, '1', (X + SX(cb, xs + 1)) / 2, Y + (m >= 0 ? 22 : -10), { align: 'center', mono: true, size: 16, alpha: ta });
    tag(x, `f(x) = ${fmt(m)}`, SX(cb, xs + 1) + 12, (Y + SY(cb, FI(xs) + m)) / 2 + 6, { mono: true, size: 16, color: C.yellow, alpha: ta });
  }
  // formulas
  const RX = 1180;
  mshow(x, t, 'f(t) = t^{2} - 1', 110, 220, 50, i0 + 0.3, Infinity);
  mshow(x, t, M`F(x) = \int_{0}^{x}(t^{2} - 1)\,dt`, RX, 240, 50, FT.scan[0]);
  mshow(x, t, M`= \frac{x^{3}}{3} - x`, RX + 120, 330, 48, FT.scan[0] + 0.4);
  if (t >= FT.scan[0]) {
    const a = inv(FT.scan[0], FT.scan[0] + 0.3, t) * (1 - inv(33.6, 33.9, t));
    tag(x, `x = ${fmt(xs)}    F(x) = ${fmt(FI(xs), 3)}`, RX, 410, { mono: true, size: 20, alpha: a, color: rgba(C.line, 0.85) });
  }
  mshow(x, t, M`F'(x) = x^{2} - 1 = f(x)`, RX, 510, 50, FT.fprime, Infinity, { color: C.yellow });
  const na = inv(FT.fprime + 0.2, FT.fprime + 0.5, t);
  if (na > 0) {
    cnTag(x, '积累函数在 x 处的变化率', RX, 580, { alpha: na, size: 23, color: rgba(C.line, 0.92) });
    cnTag(x, '= 原函数在 x 处的高度', RX, 616, { alpha: na, size: 23, color: rgba(C.line, 0.92) });
    cnTag(x, '下限固定为 0，F 已完全确定，不加常数 C', RX, 664, { alpha: na * 0.7, size: 18 });
  }
  const sa = vis(t, FT.scan[0] + 0.3, FT.tangent[0], 0.3, 0.2);
  if (sa > 0) cnTag(x, '上方面积每多一块，下方 F(x) 就同步变化', RX, 580, { alpha: sa, size: 22 });
}

// ============================================= 33.6–34.4  graphs → modules
const MODS = { g: { col: C.blue, rule: 'x - 1', fn: v => v - 1 }, f: { col: C.yellow, rule: 'x^{2}', fn: v => v * v } };
const MOD_W = 290, MOD_H = 160, PIPE_Y = 300;
function drawModule(x, name, cx, cy, s = 1, a = 1, glow = 0, text = null) {
  if (a <= 0 || s <= 0.01) return;
  const m = MODS[name], w = MOD_W * s, h = MOD_H * s;
  x.save(); x.globalAlpha = a;
  if (glow > 0) {
    x.save(); x.globalCompositeOperation = 'lighter'; x.globalAlpha = a * glow * 0.5;
    x.fillStyle = rgba(m.col, 0.35); x.beginPath(); x.roundRect(cx - w / 2 - 14, cy - h / 2 - 14, w + 28, h + 28, 30 * s); x.fill(); x.restore();
  }
  x.beginPath(); x.roundRect(cx - w / 2, cy - h / 2, w, h, 22 * s);
  x.fillStyle = C.panel; x.fill();
  x.strokeStyle = m.col; x.lineWidth = 2 + 2 * glow; x.stroke();
  if (s > 0.35) {
    mtex(x, `${name}(x) = ${m.rule}`, cx, cy - 8 * s, 40 * s, { align: 'center', color: C.line });
    if (text) mtex(x, text, cx, cy + 46 * s, 30 * s, { align: 'center', color: m.col });
  }
  x.restore();
}
function tModules(x, t, A, B) {
  const [m0, m1] = TL.modules, e = E.inOutCubic(inv(m0, m0 + 0.6, t));
  bg(x);
  x.save(); x.globalAlpha = inv(m0 + 0.35, m1, t); x.drawImage(B(), 0, 0); x.restore();
  const a = A(), crops = [[[580, 40, 560, 650], [760, PIPE_Y]], [[580, 715, 560, 300], [1240, PIPE_Y]]];
  const ca = 1 - inv(m0 + 0.35, m0 + 0.6, t); // hands over to the real modules underneath
  for (const [[sx, sy, sw, sh], [tx, ty]] of crops) {
    const w = lerp(sw, MOD_W, e), h = lerp(sh, MOD_H, e), cx = lerp(sx + sw / 2, tx, e), cy = lerp(sy + sh / 2, ty, e);
    x.save(); x.globalAlpha = ca;
    x.beginPath(); x.roundRect(cx - w / 2, cy - h / 2, w, h, lerp(4, 22, e)); x.clip();
    x.fillStyle = C.bg; x.fill();
    x.globalAlpha = ca * (1 - inv(m0 + 0.25, m0 + 0.55, t));
    const k = Math.min(w / sw, h / sh);
    x.drawImage(a, sx, sy, sw, sh, cx - sw * k / 2, cy - sh * k / 2, sw * k, sh * k);
    x.restore();
    x.save(); x.globalAlpha = ca * e; x.strokeStyle = rgba(C.line, 0.6); x.lineWidth = 2;
    x.beginPath(); x.roundRect(cx - w / 2, cy - h / 2, w, h, lerp(4, 22, e)); x.stroke(); x.restore();
  }
}

// =================================================== 34–40  composition
const CP = TL.composition;
const PIN = 300, POUT = 1660;
const CAMC = cam(960, 930, 100);
function modulePos(t) {
  const e = E.inOutCubic(inv(CP.swap[0], CP.swap[1], t));
  const g = [lerp(760, 1240, e), PIPE_Y - Math.sin(Math.PI * e) * 120], f = [lerp(1240, 760, e), PIPE_Y + Math.sin(Math.PI * e) * 120];
  return { g, f };
}
// The input value travels along the pipe; returns position and current value.
function pipeBall(t) {
  const second = t >= CP.swap[0];
  const ev = second ? CP.pass2 : CP.pass1;
  const order = second ? ['f', 'g'] : ['g', 'f'];
  const mp = modulePos(t);
  const stops = { in: [PIN, PIPE_Y], out: [POUT, PIPE_Y], g: mp.g, f: mp.f };
  if (t < ev[0][0]) return null;
  let val = 3, k = 0;
  while (k + 1 < ev.length && t >= ev[k + 1][0]) k++;
  for (let i = 1; i <= k; i++) if (ev[i][1] !== 'out') val = MODS[ev[i][1]].fn(val);
  if (k + 1 >= ev.length) return { x: POUT, y: PIPE_Y, val, order, k };
  const a = stops[ev[k][1]], b = stops[ev[k + 1][1]], u = E.inOutCubic(inv(ev[k][0] + 0.05, ev[k + 1][0], t));
  return { x: lerp(a[0], b[0], u), y: lerp(a[1], b[1], u), val, order, k };
}
function sComp(x, t) {
  bg(x);
  const fadeAll = 1 - inv(TL.orbit[0], TL.orbit[0] + 0.3, t);
  x.save(); x.globalAlpha = fadeAll;
  // pipe
  const mp = modulePos(t);
  line(x, PIN + 50, PIPE_Y, POUT - 50, PIPE_Y, rgba(C.line, 0.25), 2);
  for (const ax of [520, 1000, 1450]) arrow(x, ax - 20, PIPE_Y, ax + 6, PIPE_Y, rgba(C.line, 0.45), 2, { head: 10 });
  for (const [px, lab] of [[PIN, 'input'], [POUT, 'output']]) {
    x.save(); x.strokeStyle = rgba(C.line, 0.55); x.lineWidth = 2; x.setLineDash([5, 6]);
    x.beginPath(); x.arc(px, PIPE_Y, 50, 0, TAU); x.stroke(); x.restore();
    tag(x, lab.toUpperCase(), px, PIPE_Y + 84, { align: 'center', size: 13, ls: '3px', color: rgba(C.line, 0.5) });
  }
  // modules (hidden once they start orbiting in the next transition)
  if (t < TL.orbit[0]) {
    const flash = name => { let g = 0; for (const [te, n] of [...CP.pass1, ...CP.pass2]) if (n === name) g = Math.max(g, Math.exp(-Math.abs(t - te) * 9) * (t > te - 0.15 ? 1 : 0)); return g; };
    const proc = name => {
      for (const [te, n, v] of [[CP.pass1[1][0], 'g', '3 - 1 = 2'], [CP.pass1[2][0], 'f', '2^{2} = 4'], [CP.pass2[1][0], 'f', '3^{2} = 9'], [CP.pass2[2][0], 'g', '9 - 1 = 8']])
        if (n === name && t >= te && t < te + 0.45) return v;
      return null;
    };
    drawModule(x, 'g', mp.g[0], mp.g[1], 1, 1, flash('g'), proc('g'));
    drawModule(x, 'f', mp.f[0], mp.f[1], 1, 1, flash('f'), proc('f'));
    const pb = pipeBall(t);
    if (pb) { // inside a module the value is being processed: the ball sinks in, its label waits
      const inside = Math.min(...[mp.g, mp.f].map(m => Math.max(Math.abs(pb.x - m[0]) / (MOD_W / 2 + 30), Math.abs(pb.y - m[1]) / (MOD_H / 2 + 30))));
      const vis1 = clamp((inside - 0.75) / 0.25);
      ball(x, pb.x, pb.y, lerp(7, 15, vis1), { alpha: lerp(0.25, 1, vis1) });
      mtex(x, String(pb.val), pb.x, pb.y - 34, 34, { align: 'center', color: C.line, alpha: vis1 });
    }
  }
  // chain of values, then of expressions
  const chain1 = [[CP.pass1[0][0], '3'], [CP.pass1[1][0], M`3 \to 2`], [CP.pass1[2][0], M`3 \to 2 \to 4`]];
  for (let i = 0; i < chain1.length; i++) {
    const t1 = i + 1 < chain1.length ? chain1[i + 1][0] : CP.symbolic;
    if (t >= chain1[i][0] && t < t1) mtex(x, chain1[i][1], 960, 480, 46, { align: 'center' });
  }
  mshow(x, t, M`x \to \c{blue}{x - 1} \to \c{yellow}{(x - 1)^{2}}`, 960, 480, 46, CP.symbolic, CP.swap[0], { align: 'center' });
  const chain2 = [[CP.pass2[0][0], '3'], [CP.pass2[1][0], M`3 \to 9`], [CP.pass2[2][0], M`3 \to 9 \to 8`]];
  for (let i = 0; i < chain2.length; i++) {
    const t1 = i + 1 < chain2.length ? chain2[i + 1][0] : CP.formula2 + 0.25;
    if (t >= chain2[i][0] && t < t1) mtex(x, chain2[i][1], 960, 480, 46, { align: 'center' });
  }
  mshow(x, t, M`x \to \c{yellow}{x^{2}} \to \c{blue}{x^{2} - 1}`, 960, 480, 46, CP.formula2 + 0.25, Infinity, { align: 'center' });
  // formulas with explicit order of operation
  mshow(x, t, M`(f\circ g)(x) = f(g(x)) = (x - 1)^{2}`, 110, 590, 44, CP.formula, Infinity, { color: C.coral });
  mshow(x, t, M`(g\circ f)(x) = g(f(x)) = x^{2} - 1`, 1810, 590, 44, CP.formula2, Infinity, { color: C.blue, align: 'right' });
  const sa = vis(t, CP.formula + 0.2, CP.swap[0], 0.3, 0.2);
  if (sa > 0) cnTag(x, '先 g 后 f：先减 1，再平方', 110, 640, { alpha: sa, size: 21 });
  const sb = inv(CP.formula2 + 0.2, CP.formula2 + 0.5, t);
  if (sb > 0) cnTag(x, '先 f 后 g：先平方，再减 1', 1810, 640, { alpha: sb, size: 21, align: 'right' });
  // graphs
  const ga = inv(CP.formula, CP.formula + 0.3, t);
  if (ga > 0) {
    x.save(); x.globalAlpha *= ga;
    x.beginPath(); x.rect(0, 560, W, H - 560); x.clip();
    axes(x, CAMC, -4.4, 4.4, -1.25, 3.3, { xs: 1, ys: 1 });
    stroke(x, plotPath(CAMC, v => v * v, -4.4, 4.4), C.line, 2, { alpha: 0.3 });
    const s1 = E.inOutCubic(inv(CP.shift[0], CP.shift[1], t));
    stroke(x, plotPath(CAMC, v => (v - s1) ** 2, -4.4, 4.4), C.coral, 3.5, { glow: 0.6 });
    if (s1 > 0.02) arrow(x, SX(CAMC, 0), SY(CAMC, 0) + 22, SX(CAMC, s1), SY(CAMC, 0) + 22, C.coral, 2, { alpha: 1 - inv(CP.swap[0], CP.swap[0] + 0.3, t) });
    mshow(x, t, 'y = (x - 1)^{2}', SX(CAMC, 2.75) + 14, SY(CAMC, 2.9), 30, CP.shift[1], Infinity, { color: C.coral });
    if (t >= CP.formula2) {
      const s2 = E.inOutCubic(inv(CP.formula2, CP.formula2 + 0.35, t));
      stroke(x, plotPath(CAMC, v => v * v - s2, -4.4, 4.4), C.blue, 3.5, { glow: 0.6 });
      mshow(x, t, 'y = x^{2} - 1', SX(CAMC, -2.1) - 14, SY(CAMC, 3.1), 30, CP.formula2 + 0.35, Infinity, { color: C.blue, align: 'right' });
    }
    x.restore();
  }
  const cmp = inv(CP.compare, CP.compare + 0.25, t);
  if (cmp > 0) { mtex(x, M`f\circ g \ne g\circ f`, 960, 590, 46, { align: 'center', alpha: cmp, color: C.yellow }); cnTag(x, '顺序不同，结果不同', 960, 640, { alpha: cmp, size: 22, align: 'center' }); }
  x.restore();
}

// ============================================== 39.6–40.4  orbit → circle
const UC = [430, 540], UR = 170;
function tOrbit(x, t, A, B) {
  const [o0, o1] = TL.orbit, e = inv(o0, o1, t);
  x.drawImage(A(), 0, 0);
  x.save(); x.globalAlpha = inv(o0 + 0.35, o1, t); x.drawImage(B(), 0, 0); x.restore();
  const ce = E.inOutCubic(inv(o0, o0 + 0.6, t));
  const cx = lerp(1000, UC[0], ce), cy = lerp(PIPE_Y + 60, UC[1], ce), rad = lerp(260, UR, ce);
  const spin = TAU * 1.25 * E.inOutCubic(e);
  const s = 1 - E.inCubic(clamp(e * 1.25));
  // orbit trail becoming the unit circle
  x.save(); x.strokeStyle = C.line; x.lineWidth = 2.5; x.globalAlpha = 0.85;
  x.beginPath(); x.arc(cx, cy, rad, Math.PI, Math.PI + Math.min(TAU, spin * 1.05), false); x.stroke(); x.restore();
  const mp = modulePos(o0);
  for (const [name, a0] of [['f', Math.PI], ['g', 0]]) {
    const ang = a0 + spin, px = cx + Math.cos(ang) * rad, py = cy + Math.sin(ang) * rad;
    const start = mp[name], k = E.inOutCubic(inv(o0, o0 + 0.3, t));
    drawModule(x, name, lerp(start[0], px, k), lerp(start[1], py, k), s, 1 - inv(o1 - 0.25, o1, t), 0.6);
  }
  // the ball leaves the output and settles on the circle at angle 0
  const be = E.inOutCubic(inv(o0 + 0.1, o1, t));
  const bx = lerp(POUT, UC[0] + UR, be), by = lerp(PIPE_Y, UC[1], be) - Math.sin(Math.PI * be) * 140;
  ball(x, bx, by, lerp(15, 13, be));
}

// ========================================================= 40–44  trig
const TG = TL.trig;
const GX0 = 760;
function trigState(t) {
  const th = TAU * E.inOutSine(inv(TG.turn[0], TG.turn[1], t));
  const ph = (Math.PI / 2) * E.inOutCubic(inv(TG.phase[0], TG.phase[1], t));
  const ae = E.inOutCubic(inv(TG.amp[0], TG.amp[1], t));
  return { th, ph, A: lerp(1, 1.3, ae), w: lerp(1, 1.5, ae), ae };
}
function polarGrid(x, a) {
  if (a <= 0) return;
  x.save(); x.globalAlpha = a; x.strokeStyle = rgba(C.line, 0.1); x.lineWidth = 1;
  for (let r = 0.25; r <= 1.5; r += 0.25) { x.beginPath(); x.arc(960, 540, r * 300, 0, TAU); x.stroke(); }
  for (let k = 0; k < 12; k++) { const g = k * Math.PI / 6; x.beginPath(); x.moveTo(960, 540); x.lineTo(960 + Math.cos(g) * 470, 540 - Math.sin(g) * 470); x.stroke(); }
  x.fillStyle = rgba(C.line, 0.4); x.font = font(400, 14, MONO); x.textAlign = 'center'; x.textBaseline = 'middle';
  ['0', 'π/6', 'π/3', 'π/2', '2π/3', '5π/6', 'π', '7π/6', '4π/3', '3π/2', '5π/3', '11π/6'].forEach((s, k) => {
    const g = k * Math.PI / 6; x.fillText(s, 960 + Math.cos(g) * 500, 540 - Math.sin(g) * 500);
  });
  x.restore();
}
function sTrig(x, t) {
  bg(x);
  const S = trigState(t), CU = TL.curl;
  const curl = E.inOutCubic(inv(CU[0], CU[0] + 0.5, t)), keep = 1 - inv(CU[0], CU[0] + 0.3, t);
  // background dot grid, lifted by the wave once A and ω start to move
  const wa = S.ae * keep;
  x.save(); x.fillStyle = rgba(C.line, 0.12);
  x.beginPath();
  for (let gy = 60; gy < H; gy += 48) for (let gx = 24; gx < W; gx += 48) {
    const dy = wa * 16 * Math.sin(S.w * (gx - GX0) / UR + Math.PI / 2 - (t - TG.amp[0]) * 5);
    x.rect(gx - 1.5, gy + dy - 1.5, 3, 3);
  }
  x.fill(); x.restore();
  x.save(); x.globalAlpha = keep;
  // unit circle (radius scales with A so the projection stays exact)
  const R = UR * S.A;
  line(x, UC[0] - 230, UC[1], UC[0] + 230, UC[1], rgba(C.line, 0.4), 1.2);
  line(x, UC[0], UC[1] - 230, UC[0], UC[1] + 230, rgba(C.line, 0.4), 1.2);
  x.strokeStyle = C.line; x.lineWidth = 2.5; x.beginPath(); x.arc(UC[0], UC[1], R, 0, TAU); x.stroke();
  // wave axes
  const ax = new Path2D(); ax.moveTo(GX0, UC[1]); ax.lineTo(GX0 + TAU * UR + 50, UC[1]); ax.moveTo(GX0, UC[1] - 260); ax.lineTo(GX0, UC[1] + 260);
  stroke(x, ax, rgba(C.line, 0.45), 1.3);
  x.font = font(400, 15, MONO); x.fillStyle = rgba(C.line, 0.5); x.textAlign = 'center';
  ['π/2', 'π', '3π/2', '2π'].forEach((s, k) => { const px = GX0 + (k + 1) * Math.PI / 2 * UR; x.fillText(s, px, UC[1] + 28); x.fillRect(px - 0.75, UC[1] - 5, 1.5, 10); });
  x.restore();
  // the wave
  const ang = t < TG.phase[0] ? S.th : S.ph;
  const xr = t < TG.phase[0] ? S.th : TAU;
  const yf = v => S.A * Math.sin(S.w * v + (t < TG.phase[0] ? 0 : S.ph));
  if (t >= TG.phase[0]) stroke(x, plotPath(cam(GX0, UC[1], UR), Math.sin, 0, TAU), C.line, 2, { alpha: 0.28 * keep });
  if (xr > 0.001) {
    const pts = [];
    for (let i = 0; i <= 600; i++) {
      const v = xr * i / 600, yv = yf(v);
      const pc = [GX0 + v * UR, UC[1] - yv * UR];
      const rr = 300 * (0.8 + 0.18 * yv / S.A), pp = [960 + Math.cos(v) * rr, 540 - Math.sin(v) * rr];
      pts.push([lerp(pc[0], pp[0], curl), lerp(pc[1], pp[1], curl)]);
    }
    stroke(x, polyPath(pts), C.line, 3.5, { glow: 0.8, alpha: 1 - inv(CU[0] + 0.45, CU[1], t) });
  }
  polarGrid(x, inv(CU[0] + 0.3, CU[1], t));
  x.save(); x.globalAlpha = keep;
  if (t >= TG.turn[0] - 0.3) {
    const bx = UC[0] + Math.cos(ang) * R, by = UC[1] - Math.sin(ang) * R;
    line(x, UC[0], UC[1], bx, by, rgba(C.line, 0.6), 1.5);
    line(x, bx, UC[1], bx, by, C.yellow, 3, { glow: 0.5 });
    const gxp = GX0 + (t < TG.phase[0] ? S.th : 0) * UR, gyp = UC[1] - yf(t < TG.phase[0] ? S.th : 0) * UR;
    line(x, bx, by, gxp, gyp, rgba(C.line, 0.4), 1.2, { dash: [5, 6] });
    dot(x, gxp, gyp, 6, C.line);
    x.strokeStyle = rgba(C.yellow, 0.7); x.lineWidth = 1.5; x.beginPath(); x.arc(UC[0], UC[1], 34, 0, -ang, true); x.stroke();
    tag(x, `θ = ${(ang * 180 / Math.PI).toFixed(0)}°`, UC[0] - 200, UC[1] + 250, { mono: true, size: 18, color: rgba(C.line, 0.75) });
    tag(x, `sin θ = ${fmt(Math.sin(ang))}`, UC[0] - 60, UC[1] + 250, { mono: true, size: 18, color: C.yellow });
  }
  x.restore();
  const bx = UC[0] + Math.cos(ang) * R, by = UC[1] - Math.sin(ang) * R;
  const tb = E.inOutCubic(inv(CU[0], CU[0] + 0.6, t));
  ball(x, lerp(bx, 1260, tb), lerp(by, 540, tb), 13);
  mshow(x, t, M`y = \sin x`, GX0, 220, 58, 40.75, TG.phase[0]);
  mshow(x, t, M`\cos x = \sin(x + \frac{\pi}{2})`, GX0, 220, 58, TG.phase[1], TG.amp[0]);
  if (t >= TG.amp[0]) {
    const a = inv(TG.amp[0], TG.amp[0] + 0.3, t) * keep;
    mtex(x, M`y = A\sin(\omega x + \frac{\pi}{2})`, GX0, 220, 58, { alpha: a });
    tag(x, `A = ${S.A.toFixed(2)}    ω = ${S.w.toFixed(2)}`, GX0, 290, { mono: true, size: 20, color: C.yellow, alpha: a });
  }
  const pa = vis(t, TG.phase[0], TG.amp[0], 0.2, 0.2);
  if (pa > 0) {
    arrow(x, GX0 + Math.PI / 2 * UR, UC[1] - UR - 26, GX0 + 6, UC[1] - UR - 26, C.yellow, 2, { alpha: pa });
    cnTag(x, '向左平移 π/2', GX0 + 30, UC[1] - UR - 46, { alpha: pa, size: 20, color: C.yellow });
  }
}

// ==================================================== 44.4–47.6  polar
const PL = TL.polar;
const rose = th => { const r = Math.cos(3 * th); return [r * Math.cos(th), r * Math.sin(th)]; };
const infin = s => [Math.cos(s), Math.sin(2 * s)];
// Resample a closed curve given as dense points to n points equally spaced by arc length.
function resampleClosed(pts, n) {
  const L = [0];
  for (let i = 1; i <= pts.length; i++) { const a = pts[i - 1], b = pts[i % pts.length]; L.push(L[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1])); }
  const total = L[L.length - 1], out = [];
  let j = 0;
  for (let k = 0; k < n; k++) {
    const d = total * k / n;
    while (L[j + 1] < d) j++;
    const a = pts[j], b = pts[(j + 1) % pts.length], u = (d - L[j]) / (L[j + 1] - L[j] || 1);
    out.push([lerp(a[0], b[0], u), lerp(a[1], b[1], u)]);
  }
  return out;
}
let ROSE_N = null, INF_N = null;
function initPolar() {
  const dense = (f, a, b) => Array.from({ length: 3000 }, (_, i) => f(lerp(a, b, i / 3000)));
  ROSE_N = resampleClosed(dense(rose, 0, Math.PI), 480);
  INF_N = resampleClosed(dense(infin, 0, TAU), 480);
}
const PS = 300, PC = [960, 540];
const pscr = p => [PC[0] + p[0] * PS, PC[1] - p[1] * PS];
function sPolar(x, t) {
  bg(x);
  polarGrid(x, 1);
  const th = Math.PI * inv(PL.rose[0], PL.rose[1], t);
  const mo = E.inOutCubic(inv(PL.morph[0], PL.morph[1], t));
  let bp;
  if (t < PL.morph[0]) {
    const pts = [];
    for (let i = 0; i <= 900; i++) pts.push(pscr(rose(th * i / 900)));
    stroke(x, polyPath(pts), C.line, 3.5, { glow: 0.9 });
    // symmetry: a copy turns by 120° and lands on itself
    const sa = vis(t, PL.sym[0], PL.morph[0], 0.15, 0.15);
    if (sa > 0) {
      const rot = (TAU / 3) * E.inOutCubic(inv(PL.sym[0], PL.sym[1], t));
      x.save(); x.translate(PC[0], PC[1]); x.rotate(-rot); x.translate(-PC[0], -PC[1]);
      stroke(x, polyPath(ROSE_N.map(pscr), true), C.yellow, 2, { alpha: sa * 0.8, dash: [6, 6] });
      x.restore();
      for (const g of [0, TAU / 3, 2 * TAU / 3]) line(x, PC[0], PC[1], PC[0] + Math.cos(g) * 340, PC[1] - Math.sin(g) * 340, rgba(C.yellow, 0.5), 1.2, { alpha: sa, dash: [3, 5] });
      cnTag(x, '旋转 120° 后与自身重合', 1330, 880, { alpha: sa, size: 22, color: C.yellow });
    }
    const r = Math.cos(3 * th);
    bp = pscr(rose(th));
    if (t >= PL.rose[0] - 0.2 && t < PL.sym[0] + 0.3) {
      const ra = 1 - inv(PL.sym[0], PL.sym[0] + 0.3, t);
      line(x, PC[0], PC[1], PC[0] + Math.cos(th) * 400, PC[1] - Math.sin(th) * 400, rgba(C.line, 0.35), 1.2, { dash: [4, 6], alpha: ra });
      line(x, PC[0], PC[1], bp[0], bp[1], r >= 0 ? C.yellow : C.coral, 2.5, { alpha: ra });
      tag(x, `θ = ${(th * 180 / Math.PI).toFixed(0)}°`, 1330, 830, { mono: true, size: 20, alpha: ra });
      tag(x, `r = cos 3θ = ${fmt(r)}`, 1330, 866, { mono: true, size: 20, alpha: ra, color: r >= 0 ? C.yellow : C.coral });
      if (r < 0) cnTag(x, 'r < 0：点落在 θ 的反方向', 1330, 908, { alpha: ra, size: 19, color: C.coral });
    }
  } else {
    const pts = ROSE_N.map((p, i) => pscr([lerp(p[0], INF_N[i][0], mo), lerp(p[1], INF_N[i][1], mo)]));
    stroke(x, polyPath(pts, true), C.line, 3.5, { glow: 0.9 });
    const s = TAU * E.inOutSine(inv(PL.inf[0], PL.inf[1], t));
    bp = t < PL.inf[0] ? pts[0] : pscr(infin(s));
    if (t >= PL.inf[0]) {
      const tr = [];
      for (let i = 0; i <= 300; i++) tr.push(pscr(infin(Math.max(0, s - 1.2) + Math.min(s, 1.2) * i / 300)));
      stroke(x, polyPath(tr), C.coral, 3, { glow: 1.2, alpha: 0.9 });
    }
    const ma = vis(t, PL.morph[0], PL.inf[0], 0.05, 0.15);
    if (ma > 0) chip(x, 'VISUAL MORPH · 视觉形变', 960, 960, C.line, ma * 0.8, { align: 'center' });
  }
  ball(x, bp[0], bp[1], 13);
  mshow(x, t, M`r = \cos(3\theta)`, FORMULA_X, 240, 72, PL.rose[0], PL.morph[0] - 0.1);
  const ra = vis(t, PL.rose[0] + 0.2, PL.morph[0] - 0.1, 0.3, 0.2);
  if (ra > 0) cnTag(x, '三瓣玫瑰线 · θ ∈ [0, π]', FORMULA_X + 4, 300, { alpha: ra, size: 22 });
  mshow(x, t, M`x = \cos t,\quad y = \sin(2t)`, FORMULA_X, 240, 60, PL.inf[0]);
  const ia = inv(PL.inf[0] + 0.15, PL.inf[0] + 0.45, t);
  if (ia > 0) { mtex(x, M`t \in [0, 2\pi]`, FORMULA_X, 310, 40, { alpha: ia, color: rgba(C.line, 0.7) }); cnTag(x, '参数曲线（横向的 ∞）', FORMULA_X + 4, 370, { alpha: ia, size: 22 }); }
}

// ==================================================== 47.6–52  the heart
const HT = TL.heart;
const heartXY = s => [16 * Math.sin(s) ** 3, 13 * Math.cos(s) - 5 * Math.cos(2 * s) - 2 * Math.cos(3 * s) - Math.cos(4 * s)];
const HC0 = { x: 960, y: 640, s: 20 }; // cusp (0, 5) lands on the ∞ crossing at the centre
let HEART = null;
function initHeart() {
  const r = rng(77);
  const outline = Array.from({ length: 4000 }, (_, i) => heartXY(TAU * i / 4000));
  const ring = resampleClosed(outline, 2500);
  // interior: rasterise the curve and keep inside pixels
  const b = buf(400, 400), sc = 10;
  b.x.beginPath(); outline.forEach((p, i) => i ? b.x.lineTo(200 + p[0] * sc, 230 - p[1] * sc) : b.x.moveTo(200 + p[0] * sc, 230 - p[1] * sc));
  b.x.closePath(); b.x.fillStyle = '#fff'; b.x.fill();
  const d = b.x.getImageData(0, 0, 400, 400).data, inside = [];
  for (let y = 0; y < 400; y++) for (let xx = 0; xx < 400; xx++) if (d[(y * 400 + xx) * 4 + 3] > 200) inside.push([(xx - 200) / sc, (230 - y) / sc]);
  const P = [];
  for (let i = 0; i < 9000; i++) {
    const onRing = i < 2500;
    const p = onRing ? ring[i] : inside[Math.floor(r() * inside.length)];
    const tx = onRing ? p[0] : p[0] + (r() - 0.5) * 0.1, ty = onRing ? p[1] : p[1] + (r() - 0.5) * 0.1;
    const rad = Math.hypot(tx, ty + 2.5), ang = Math.atan2(ty + 2.5, tx);
    P.push({ tx, ty, onRing, rad, ang, sr: 38 + r() * 26, sa: ang + 1.5 + r() * 0.8, d: r() * 0.3 * (1 - rad / 18) + 0.02, c: Math.floor(r() * 4), k: i % 360 });
  }
  HEART = { P, ring };
}
const HCOLS = ['#ff6b4a', '#ff8a5c', '#ffb36b', '#ffd23f'];
function heartFrame(t) { // heart → morph-scene frame during the hand-over to the contour points
  const e = E.inOutCubic(inv(HT.contour[0], HT.contour[0] + 0.3, t));
  return { x: 960, y: lerp(640, 540, e), s: lerp(20, 260 / 16.5, e), yo: lerp(0, 2.5, e) };
}
function sHeart(x, t) {
  bg(x);
  const [u0, u1] = TL.unfold;
  // T10: the ∞ loops spread outwards and dissolve; the ball rides to the crossing
  if (t < u1) {
    const ue = E.inOutCubic(inv(u0, u1, t));
    const pts = INF_N.map(p => { const k = 1 + 1.3 * ue * Math.abs(p[0]); return pscr([p[0] * k, p[1] * (1 + 0.25 * ue)]); });
    stroke(x, polyPath(pts, true), C.line, 3.5 * (1 - ue) + 0.5, { glow: 0.9, alpha: 1 - ue });
    polarGrid(x, 1 - E.outCubic(inv(u0, u0 + 0.4, t)));
  }
  const F = heartFrame(t), pulse = 1 + 0.065 * (E.outQuad(inv(HT.pulse, HT.pulse + 0.12, t)) - E.inOutSine(inv(HT.pulse + 0.12, HT.pulse + 0.55, t)));
  const hs = (px, py) => [F.x + px * F.s * pulse, F.y - (py + F.yo) * F.s * pulse];
  const sTr = TAU * E.inOutSine(inv(HT.trace[0], HT.trace[1], t));
  const conv = inv(HT.converge[0], HT.converge[1], t);
  // traced outline
  if (t >= HT.trace[0]) {
    const pts = [];
    for (let i = 0; i <= 900; i++) { const p = heartXY(sTr * i / 900); pts.push(hs(p[0], p[1])); }
    const glow = 1 + 0.8 * Math.exp(-Math.abs(t - HT.pulse - 0.1) * 6);
    stroke(x, polyPath(pts), C.coral, 3, { glow, alpha: 1 - inv(HT.contour[0], HT.contour[0] + 0.25, t) });
  }
  // 9 000 particles spiral inward onto the outline and the interior
  if (t >= HT.converge[0]) {
    const paths = HCOLS.map(() => new Path2D()), white = new Path2D();
    const ce = E.inOutCubic(inv(HT.contour[0], HT.contour[0] + 0.3, t));
    // the contour points then relax from the heart into the circle the morph scene opens with
    const toCircle = E.inOutCubic(inv(51.65, 52.0, t));
    const contourPts = SHAPES.heart.map((p, j) => [lerp(p[0], SHAPES.circle[j][0], toCircle), lerp(p[1], SHAPES.circle[j][1], toCircle)]);
    for (const p of HEART.P) {
      const q = clamp((t - HT.converge[0] - p.d) / 0.7);
      const eq = E.inOutCubic(q), er = E.outCubic(q);
      const rr = lerp(p.sr, p.rad, er), aa = lerp(p.sa, p.ang, eq);
      let px = rr * Math.cos(aa), py = rr * Math.sin(aa) - 2.5;
      let [sx, sy] = hs(px, py);
      if (ce > 0) { const cp = contourPts[p.k]; sx = lerp(sx, 960 + cp[0] * 260, ce); sy = lerp(sy, 540 - cp[1] * 260, ce); }
      (p.onRing ? white : paths[p.c]).rect(sx - 1.1, sy - 1.1, 2.2, 2.2);
    }
    x.save(); x.globalAlpha = conv > 0 ? 1 : 0;
    paths.forEach((p, i) => { x.fillStyle = HCOLS[i]; x.fill(p); });
    x.fillStyle = C.line; x.fill(white);
    x.restore();
  }
  // the ball draws the curve, starting from the ∞ crossing
  let bp;
  if (t < HT.trace[0]) { const s = Math.PI / 2 * E.inOutSine(inv(u0, HT.trace[0], t)); bp = pscr(infin(s)); }
  else { const p = heartXY(sTr); bp = hs(p[0], p[1]); }
  ball(x, bp[0], bp[1], 13, { alpha: 1 - inv(HT.converge[1], HT.converge[1] + 0.3, t) });
  // formulas sit in the empty upper-left while drawing, then leave
  const fa = 1 - inv(50.25, 50.75, t);
  if (fa > 0) {
    mshow(x, t, M`x(t) = 16\sin^{3} t`, 110, 200, 40, 48.25, Infinity, { alpha: fa });
    mshow(x, t, M`y(t) = 13\cos t - 5\cos(2t) - 2\cos(3t) - \cos(4t)`, 110, 262, 40, 48.4, Infinity, { alpha: fa });
    mshow(x, t, M`t \in [0, 2\pi]`, 110, 324, 32, 48.55, Infinity, { alpha: fa * 0.75 });
  }
  const pa = vis(t, HT.converge[1], HT.contour[0], 0.3, 0.2);
  if (pa > 0) tag(x, '9 000 PARTICLES', 960, 1000, { align: 'center', size: 14, ls: '4px', alpha: pa * 0.7 });
}

// =================================================== 52–55.75  contour morph
const MO = TL.morph;
let SHAPES = null;
function initShapes() {
  const N = 360, dense = f => Array.from({ length: 4000 }, (_, i) => f(TAU * i / 4000));
  const raw = {
    circle: dense(s => [Math.cos(s), Math.sin(s)]),
    ellipse: dense(s => [1.35 * Math.cos(s), 0.72 * Math.sin(s)]),
    superellipse: dense(s => [0.92 * Math.sign(Math.cos(s)) * Math.abs(Math.cos(s)) ** 0.5, 0.92 * Math.sign(Math.sin(s)) * Math.abs(Math.sin(s)) ** 0.5]),
    petal: dense(s => { const r = 0.85 * (1 + 0.28 * Math.sin(5 * s)); return [r * Math.cos(s), r * Math.sin(s)]; }),
    heart: dense(s => { const p = heartXY(s); return [p[0] / 16.5, (p[1] + 2.5) / 16.5]; }),
  };
  const out = {};
  for (const k in raw) {
    let pts = raw[k];
    let area = 0; // enforce counter-clockwise orientation
    for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; area += a[0] * b[1] - b[0] * a[1]; }
    if (area < 0) pts = pts.slice().reverse();
    let s = resampleClosed(pts, N);
    // start at the point straight above the centroid
    let best = 0, bd = Infinity;
    s.forEach((p, i) => { const d = Math.abs(Math.atan2(p[1], p[0]) - Math.PI / 2) + (p[1] < 0 ? 9 : 0); if (d < bd) { bd = d; best = i; } });
    out[k] = s.slice(best).concat(s.slice(0, best));
  }
  // fine-tune each correspondence with the cyclic shift of least squared distance
  const order = ['circle', 'ellipse', 'superellipse', 'petal', 'heart'];
  for (let i = 1; i < order.length; i++) {
    const A = out[order[i - 1]], B = out[order[i]];
    let bs = 0, bd = Infinity;
    for (let sh = -20; sh <= 20; sh++) {
      let d = 0;
      for (let j = 0; j < N; j += 3) { const q = B[mod(j + sh, N)]; d += (A[j][0] - q[0]) ** 2 + (A[j][1] - q[1]) ** 2; }
      if (d < bd) { bd = d; bs = sh; }
    }
    out[order[i]] = B.map((_, j) => B[mod(j + bs, N)]);
  }
  SHAPES = { order, ...out };
}
// Continuous shape index 0..4 (circle … heart) → interpolated contour.
function shapeAt(s) {
  const i = clamp(Math.floor(s), 0, 3), u = clamp(s - i);
  const A = SHAPES[SHAPES.order[i]], B = SHAPES[SHAPES.order[Math.min(4, i + 1)]];
  return A.map((p, j) => [lerp(p[0], B[j][0], u), lerp(p[1], B[j][1], u)]);
}
function morphIndex(t) {
  const K = MO.shapes, m = MO.dur;
  let s = 0;
  for (let i = 1; i < K.length; i++) s += E.inOutCubic(inv(K[i][0] - (i === 4 ? 1.5 : m), K[i][0], t));
  return s;
}
const SHAPE_TEX = {
  circle: 'x^{2} + y^{2} = 1',
  ellipse: M`\frac{x^{2}}{a^{2}} + \frac{y^{2}}{b^{2}} = 1`,
  superellipse: '|x|^{4} + |y|^{4} = a^{4}',
  petal: M`r = R(1 + 0.28\sin 5\theta)`,
  heart: M`x = 16\sin^{3} t,\quad y = 13\cos t - 5\cos 2t - 2\cos 3t - \cos 4t`,
};
const SHAPE_NAME = { circle: '圆', ellipse: '椭圆', superellipse: '超椭圆 · 圆角方形', petal: '花瓣 · 径向周期函数', heart: '爱心 · 参数方程' };
const LAYERS = 25;
const LCOLS = Array.from({ length: LAYERS }, (_, j) => j < 12 ? mix(C.blue, C.line, j / 12) : mix(C.line, C.coral, (j - 12) / 12));
function sMorph(x, t) {
  bg(x);
  const [c0, c1] = MO.cloud;
  const spread = E.inOutCubic(inv(c0, c0 + 0.5, t)) - E.inOutCubic(inv(c1 - 0.5, c1, t));
  const sc = morphIndex(t), S = 260;
  if (spread <= 0.001) {
    const pts = shapeAt(sc).map(p => [960 + p[0] * S, 540 - p[1] * S]);
    stroke(x, polyPath(pts, true), C.line, 3.5, { glow: 0.9 });
    x.save(); x.fillStyle = C.coral;
    x.beginPath(); pts.forEach((p, i) => { if (i % 6 === 0) x.rect(p[0] - 2, p[1] - 2, 4, 4); }); x.fill(); x.restore();
  } else {
    const yaw = TAU * E.inOutSine(inv(c0, c1, t)), pitch = 1.0 * spread;
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch), D = 4.2;
    const proj = (px, py, pz) => {
      const x1 = px * cy + pz * sy, z1 = -px * sy + pz * cy;
      const y2 = py * cp - z1 * sp, z2 = py * sp + z1 * cp;
      const k = D / (D + z2);
      return [960 + x1 * S * k, 540 - y2 * S * k, k];
    };
    x.save(); x.globalCompositeOperation = 'lighter';
    for (let j = 0; j < LAYERS; j++) {
      const u = j / (LAYERS - 1), sj = lerp(sc, 4 * u, spread), z = (u - 0.5) * 1.8 * spread;
      const pts = shapeAt(sj).map(p => proj(p[0], p[1], z));
      x.globalAlpha = 0.22; stroke(x, polyPath(pts, true), LCOLS[j], 1.2);
      x.globalAlpha = 0.9; x.fillStyle = LCOLS[j];
      x.beginPath(); for (const p of pts) { const r = 1.1 * p[2] + 0.3; x.rect(p[0] - r, p[1] - r, 2 * r, 2 * r); } x.fill();
    }
    x.restore();
    const ca = vis(t, c0 + 0.2, c1 - 0.4, 0.3, 0.3);
    if (ca > 0) { tag(x, `${(LAYERS * 360).toLocaleString('en-US')} POINTS · ONE CONTOUR PER LAYER`, 960, 1000, { align: 'center', size: 14, ls: '3px', alpha: ca * 0.7 }); }
  }
  // labels when each shape has landed
  for (let i = 0; i < MO.shapes.length; i++) {
    const [ta, name] = MO.shapes[i], tb = i + 1 < MO.shapes.length ? MO.shapes[i + 1][0] - (i + 1 === 4 ? 1.6 : MO.dur) : TL.lattice[0];
    const a = vis(t, ta, tb, 0.15, 0.12);
    if (a <= 0) continue;
    mtex(x, SHAPE_TEX[name], 960, 930, name === 'heart' ? 30 : 44, { align: 'center', alpha: a });
    cnTag(x, SHAPE_NAME[name], 960, 875, { align: 'center', alpha: a * 0.8, size: 22 });
  }
  chip(x, 'CONTOUR MORPH', FORMULA_X, 230, C.line, inv(52.0, 52.3, t) * (1 - inv(TL.lattice[0], TL.lattice[0] + 0.2, t)));
  const na = inv(52.1, 52.4, t) * (1 - inv(TL.lattice[0], TL.lattice[0] + 0.2, t));
  cnTag(x, '轮廓之间的视觉形变 —— 它们都不是 y = f(x)', FORMULA_X, 285, { alpha: na, size: 21 });
  tag(x, '360 POINTS · ARC-LENGTH MATCHED', FORMULA_X, 320, { alpha: na * 0.55, size: 13, ls: '2px' });
}

// ================================================ 55.75–57.5  city + recap
const RP = TL.recap;
const ISO = { u: 44, cx: 960, cy: 560 };
const isoP = (X, Y, Z = 0) => [ISO.cx + (X - Y) * ISO.u * 0.866, ISO.cy + (X + Y) * ISO.u * 0.5 - Z * ISO.u];
const LAT = [];
for (let j = 0; j < 20; j++) for (let i = 0; i < 18; i++) LAT.push([i - 8.5, j - 9.5]);
let LAT_MAP = null;
function initLattice() { // contour point k → lattice point, matched by angle to avoid crossings
  const H = SHAPES.heart.map((p, k) => ({ k, a: Math.atan2(p[1], p[0]) })).sort((a, b) => a.a - b.a);
  const L = LAT.map((p, k) => { const s = isoP(p[0], p[1]); return { k, a: Math.atan2(-(s[1] - 540), s[0] - 960) }; }).sort((a, b) => a.a - b.a);
  LAT_MAP = new Array(360);
  H.forEach((h, i) => { LAT_MAP[h.k] = L[i].k; });
}
function isoBox(x, X, Y, w, d, h, col, a = 1) {
  const top = [isoP(X, Y, h), isoP(X + w, Y, h), isoP(X + w, Y + d, h), isoP(X, Y + d, h)];
  const fl = [isoP(X, Y + d, 0), isoP(X + w, Y + d, 0), isoP(X + w, Y + d, h), isoP(X, Y + d, h)];
  const fr = [isoP(X + w, Y, 0), isoP(X + w, Y + d, 0), isoP(X + w, Y + d, h), isoP(X + w, Y, h)];
  x.save(); x.globalAlpha = a;
  for (const [q, s] of [[fl, 0.55], [fr, 0.35], [top, 0.9]]) {
    x.beginPath(); q.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath();
    x.fillStyle = mix(C.bg, col, s); x.fill(); x.strokeStyle = rgba(col, 0.9); x.lineWidth = 1; x.stroke();
  }
  x.restore();
}
function sCity(x, t) {
  bg(x);
  const [l0, l1] = TL.lattice, le = E.inOutCubic(inv(l0, l1, t));
  // contour points fly to the lattice
  x.save(); x.fillStyle = C.line; x.beginPath();
  SHAPES.heart.forEach((p, k) => {
    const from = [960 + p[0] * 260, 540 - p[1] * 260], L = LAT[LAT_MAP[k]], to = isoP(L[0], L[1]);
    const px = lerp(from[0], to[0], le), py = lerp(from[1], to[1], le);
    x.rect(px - 1.8, py - 1.8, 3.6, 3.6);
  });
  x.fill(); x.restore();
  const ga = inv(l1 - 0.2, l1 + 0.1, t);
  if (ga > 0) {
    const p = new Path2D();
    for (let i = 0; i < 18; i++) { const a = isoP(i - 8.5, -9.5), b = isoP(i - 8.5, 9.5); p.moveTo(a[0], a[1]); p.lineTo(b[0], b[1]); }
    for (let j = 0; j < 20; j++) { const a = isoP(-8.5, j - 9.5), b = isoP(8.5, j - 9.5); p.moveTo(a[0], a[1]); p.lineTo(b[0], b[1]); }
    stroke(x, p, rgba(C.line, 0.14), 1, { alpha: ga });
  }
  const rise = k => E.outBack(clamp((t - RP.city[0] - 0.05 * k) / 0.3), 1.3);
  // integral bars (signed)
  for (let i = 0; i < 8; i++) {
    const v = (i + 0.5) / 4, h = fI(v) * 1.1 * rise(0);
    if (Math.abs(h) < 0.02) continue;
    if (h >= 0) isoBox(x, -7 + i * 0.9, -6, 0.8, 0.8, h, C.blue); else isoBox(x, -7 + i * 0.9, -6, 0.8, 0.8, h, C.coral);
  }
  // the cubic as a standing ribbon, with its tangent
  const rw = rise(1);
  if (rw > 0.01) {
    const pts = [], base = [];
    for (let i = 0; i <= 120; i++) { const v = lerp(-1.9, 1.9, i / 120), X = -7 + (v + 1.9) * 2.6; pts.push(isoP(X, 6, (2.4 + fD(v)) * rw)); base.push(isoP(X, 6, 0)); }
    x.save(); x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); for (let i = base.length - 1; i >= 0; i--) x.lineTo(base[i][0], base[i][1]);
    x.closePath(); x.fillStyle = rgba(C.line, 0.06); x.fill(); x.restore();
    stroke(x, polyPath(pts), C.line, 2.5, { glow: 0.6 });
    const v0 = 0.5, X0 = -7 + (v0 + 1.9) * 2.6, m = fpD(v0) / 2.6;
    const a = isoP(X0 - 1.6, 6, (2.4 + fD(v0) - m * 1.6) * rw), b = isoP(X0 + 1.6, 6, (2.4 + fD(v0) + m * 1.6) * rw);
    line(x, a[0], a[1], b[0], b[1], C.coral, 2.5, { glow: 0.8 });
  }
  // the two modules
  const rm = rise(2);
  if (rm > 0.01) {
    isoBox(x, 4, -7, 1.6, 1.6, 1.4 * rm, C.blue);
    isoBox(x, 6.4, -7, 1.6, 1.6, 1.4 * rm, C.yellow);
    const pg = isoP(4.8, -6.2, 1.4 * rm), pf = isoP(7.2, -6.2, 1.4 * rm);
    mtex(x, 'g', pg[0], pg[1] + 10, 28, { align: 'center', alpha: rm }); mtex(x, 'f', pf[0], pf[1] + 10, 28, { align: 'center', alpha: rm });
  }
  // rose on the floor, heart standing above it
  const rr = rise(3);
  if (rr > 0.01) {
    const rp = ROSE_N.map(p => isoP(3 + p[0] * 2.6 * rr, 1 + p[1] * 2.6 * rr, 0.02));
    stroke(x, polyPath(rp, true), C.line, 2, { glow: 1 });
    const hp = SHAPES.heart.map(p => isoP(3 + p[0] * 2.2, 1, 3.4 + p[1] * 2.2 * rr));
    stroke(x, polyPath(hp, true), C.coral, 2.5, { glow: 1.2, alpha: rr });
  }
  const bp = isoP(-1, 1, 0.3);
  ball(x, bp[0], bp[1] - 4, 13, { alpha: inv(RP.city[0], RP.city[0] + 0.2, t) });
  tag(x, 'ONE WORLD OF FUNCTIONS', 960, 1000, { align: 'center', size: 14, ls: '4px', alpha: inv(56.1, 56.3, t) * 0.7 });
}
function sRecap(x, t) {
  const C0 = RP.cuts[0][0];
  if (t < C0) { sCity(x, t); return; }
  let k = 0;
  while (k + 1 < RP.cuts.length && t >= RP.cuts[k + 1][0] - 1e-9) k++;
  const [tc, , key] = RP.cuts[k];
  content(bufR.x, key + (t - tc));
  const p = clamp((t - tc) / 0.125), s = 1.06 - 0.06 * E.outCubic(p);
  bg(x);
  x.save(); x.translate(W / 2, H / 2); x.scale(s, s); x.drawImage(bufR.c, -W / 2, -H / 2); x.restore();
  // a controlled glitch accent on the first frame of a cut: two thin slices, kept off the formula columns
  if (t - tc < 1 / FPS - 1e-6) {
    for (let i = 0; i < 2; i++) {
      const y = 620 + hash2(k, i) * 300, h = 6 + hash2(k, i + 7) * 10, dx = (hash2(k, i + 3) - 0.5) * 70;
      x.drawImage(x.canvas, 0, y, W, h, dx, y, W, h);
    }
  }
  x.save(); x.strokeStyle = rgba(C.line, 0.5); x.lineWidth = 2; x.strokeRect(24, 24, W - 48, H - 48); x.restore();
  tag(x, String(k + 1).padStart(2, '0') + ' / 08', W - 64, H - 92, { align: 'right', mono: true, size: 16, color: C.coral });
}

// ================================================ 57.5–60  silence + logo
const LG = TL.logo;
const LOGO = { size: 190, R: 24, gap: 14, base: 600 };
function logoLayout() {
  MM.font = font(800, LOGO.size);
  const tw = MM.measureText('FUNCTIONS').width, total = tw + LOGO.gap + 2 * LOGO.R, left = W / 2 - total / 2;
  return { left, tw, bx: left + tw + LOGO.gap + LOGO.R };
}
function logoBall(t, L) {
  const R = LOGO.R, rest = LOGO.base - R, c = 0.04;
  for (const [th, amt] of LG.bounce) { const d = t - th; if (Math.abs(d) < c) { const sq = amt * (1 - (d / c) ** 2); return { y: LOGO.base - R * (1 - sq), sq }; } }
  if (t < LG.hit - c) { // hover, a small anticipation lift, then the drop
    const g = 7600, td = 0.22;
    if (t < LG.hit - td) { const hov = rest - 170 + 5 * Math.sin((t - 57.5) * 9) - 14 * E.outQuad(inv(LG.hit - td - 0.12, LG.hit - td, t)); return { y: hov, sq: 0 }; }
    const y0 = rest - 184, u = (t - (LG.hit - td)) / (td - c);
    return { y: lerp(y0, rest, u * u), sq: 0, st: 0.3 * u * u, vel: Math.PI / 2 };
  }
  const [b1, b2] = LG.bounce;
  if (t > b1[0] + c && t < b2[0] - c) { const u = (t - b1[0] - c) / (b2[0] - b1[0] - 2 * c); return { y: rest - 46 * 4 * u * (1 - u), sq: 0 }; }
  return { y: rest, sq: 0 };
}
function sSilence(x, t) {
  bg(x);
  const L = logoLayout(), ce = inv(57.5, 57.6, t);
  if (ce < 1) { // the last image collapses into the line
    content(bufR.x, 45.6 + (t - 57.5));
    x.save(); x.globalAlpha = 1 - ce; x.translate(0, LOGO.base); x.scale(1, 1 - E.inCubic(ce)); x.translate(0, -LOGO.base); x.drawImage(bufR.c, 0, 0); x.restore();
  }
  line(x, 260, LOGO.base, W - 260, LOGO.base, rgba(C.line, 0.8), 1.5);
  const b = logoBall(t, L), near = clamp(1 - (LOGO.base - LOGO.R - b.y) / 220);
  x.save(); x.fillStyle = `rgba(0,0,0,${0.5 * near})`; x.beginPath(); x.ellipse(L.bx, LOGO.base + 3, LOGO.R * (0.6 + 0.6 * near), 5, 0, 0, TAU); x.fill(); x.restore();
  ball(x, L.bx, b.y, LOGO.R, b);
}
function sLogo(x, t) {
  bg(x);
  const L = logoLayout(), lt = t - LG.hit;
  // the line retracts into the point the ball lands on
  const r = E.inOutCubic(inv(0, 0.45, lt));
  if (r < 1) line(x, lerp(260, L.bx, r), LOGO.base, lerp(W - 260, L.bx, r), LOGO.base, rgba(C.line, 0.8 + 0.2 * Math.exp(-lt * 10)), 1.5 + 2 * Math.exp(-lt * 10));
  const ring = clamp(lt / 0.7);
  if (ring < 1) { x.save(); x.strokeStyle = C.line; x.globalAlpha = 0.5 * (1 - ring); x.lineWidth = 2; x.beginPath(); x.arc(L.bx, LOGO.base, 30 + 900 * E.outCubic(ring), 0, TAU); x.stroke(); x.restore(); }
  const sl = 1 + 0.06 * (1 - E.outExpo(clamp(lt / 0.3)));
  x.save();
  x.globalAlpha = clamp(lt * FPS / 2 + 0.5);
  x.translate(L.left + L.tw / 2, LOGO.base); x.scale(sl, sl);
  x.font = font(800, LOGO.size); x.textAlign = 'center'; x.textBaseline = 'alphabetic'; x.fillStyle = C.line;
  x.fillText('FUNCTIONS', 0, 0);
  x.restore();
  const b = logoBall(t, L);
  ball(x, L.bx, b.y, LOGO.R, b);
  const sp = E.outCubic(inv(LG.subtitle[0], LG.subtitle[1], t));
  if (sp > 0) {
    x.save(); x.globalAlpha = sp; x.font = `italic 46px ${SERIF}`; x.textAlign = 'center'; x.fillStyle = C.line;
    x.letterSpacing = `${lerp(14, 1, sp)}px`; x.fillText('Every curve tells a story.', W / 2, LOGO.base + 110); x.restore();
    cnTag(x, 'FUNCTIONS IN MOTION ｜ 从一条线，到无限可能', W / 2, LOGO.base + 172, { align: 'center', size: 22, alpha: sp * 0.55 });
  }
  const fl = Math.exp(-lt * 14) * 0.35;
  if (fl > 0.01) { x.fillStyle = `rgba(255,255,255,${fl})`; x.fillRect(0, 0, W, H); }
  const fo = inv(LG.fade[0], LG.fade[1], t);
  if (fo > 0) { x.fillStyle = rgba(C.bg, fo); x.fillRect(0, 0, W, H); }
}
