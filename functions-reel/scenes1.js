'use strict';
/* Scenes 00:00–00:30 — line → basic functions → transformations → inverse →
 * reciprocal → derivative → integral. Each scene is draw(x, t) with absolute t. */
const M = String.raw;

// ------------------------------------------------------------------ helpers
function viewWorld(c) { return { x0: -c.ox / c.s, x1: (W - c.ox) / c.s, y0: (c.oy - H) / c.sy, y1: c.oy / c.sy }; }
function arrow(x, x0, y0, x1, y1, color, w = 2, o = {}) {
  line(x, x0, y0, x1, y1, color, w, o);
  const ang = Math.atan2(y1 - y0, x1 - x0), L = o.head ?? 12;
  x.save(); x.globalAlpha = o.alpha ?? 1; x.fillStyle = color; x.translate(x1, y1); x.rotate(ang);
  x.beginPath(); x.moveTo(0, 0); x.lineTo(-L, -L * 0.42); x.lineTo(-L, L * 0.42); x.closePath(); x.fill(); x.restore();
}
function bracketH(x, xa, xb, y, color, a = 1) {
  if (a <= 0) return;
  const p = new Path2D();
  p.moveTo(xa, y - 9); p.lineTo(xa, y); p.lineTo(xb, y); p.lineTo(xb, y - 9);
  stroke(x, p, color, 2, { alpha: a, cap: 'butt' });
}
function bracketV(x, xs, ya, yb, color, a = 1) {
  if (a <= 0) return;
  const p = new Path2D();
  p.moveTo(xs - 9, ya); p.lineTo(xs, ya); p.lineTo(xs, yb); p.lineTo(xs - 9, yb);
  stroke(x, p, color, 2, { alpha: a, cap: 'butt' });
}
// Smooth keyframed scalar with a soft ease that never fully stops.
const softEase = u => 0.65 * E.inOutSine(u) + 0.35 * u;
const slopeColor = m => m >= 0 ? mix(C.yellow, C.blue, clamp(m / 0.7)) : mix(C.yellow, C.coral, clamp(-m / 0.7));
const FORMULA_X = 150;

// ================================================== 00–06  origin + basics
const OR = TL.origin, BA = TL.basic;
const CAM0 = cam(760, 640, 110), CAMB = cam(1060, 640, 120);
// The push: the view travels out along y = x and zooms in, then settles into
// the function world with the origin as anchor.
function worldCam(t) {
  const [p0, p1] = OR.push, mid = 2.0;
  if (t <= p0) return CAM0;
  if (t < mid) { const e = E.inCubic(inv(p0, mid, t)), f = 2.2 * e; return camFocus(f, f, lerp(760, 960, e), lerp(640, 540, e), 110 * Math.pow(3, e)); }
  if (t < p1) { const e = E.outCubic(inv(mid, p1, t)), f = 2.2 * (1 - e); return camFocus(f, f, lerp(960, 1060, e), lerp(540, 640, e), 330 * Math.pow(120 / 330, e)); }
  return CAMB;
}
const CW = 0.045; // contact half-width (s): ~3 frames of squash
function contactAt(t) {
  for (const [ti, amt] of OR.impacts) { const d = t - ti; if (Math.abs(d) < CW) return amt * (1 - (d / CW) ** 2); }
  return 0;
}
// Damped travelling wave from each impact; positive = downward on screen.
function lineWave(xs, t, X0) {
  let d = 0;
  for (const [ti, amp] of OR.impacts) {
    const tau = t - ti;
    if (tau <= 0) continue;
    const r = Math.abs(xs - X0), front = 950 * tau;
    if (r > front + 40) continue;
    d += amp * 64 * Math.exp(-tau * 3.4) * Math.exp(-r / 1100) * smooth(clamp((front + 40 - r) / 80)) * Math.sin(tau * TAU * 5 - r * TAU / 170);
  }
  const sq = contactAt(t);
  if (sq > 0) d += 16 * (sq / 0.45) * Math.exp(-(((xs - X0) / 70) ** 2));
  return d;
}
function originBall(t, c) {
  const R = 28 * Math.sqrt(c.s / 110), X0 = SX(c, 0), Y0 = SY(c, 0);
  const sq = contactAt(t);
  if (sq > 0) return { x: X0, y: Y0 + 16 * sq / 0.45 - R * (1 - sq), R, sq, nrm: -Math.PI / 2 };
  if (t < 0.5 - CW) {
    const u = Math.max(0, t) / (0.5 - CW);
    return { x: X0, y: lerp(-90, Y0 - R, u * u), R, st: 0.36 * u * u, vel: Math.PI / 2 };
  }
  if (t < 1.0 - CW) {
    const u = (t - 0.5 - CW) / (0.5 - 2 * CW);
    return { x: X0, y: Y0 - R - 150 * 4 * u * (1 - u), R, st: 0.2 * (1 - 2 * u) ** 2, vel: u < 0.5 ? -Math.PI / 2 : Math.PI / 2 };
  }
  const u = 2.2 * E.inQuad(inv(OR.roll[0], OR.roll[1], t));
  const n = lerp(-Math.PI / 2, -3 * Math.PI / 4, E.inOutCubic(inv(1.5, 1.62, t)));
  return { x: SX(c, u) + Math.cos(n) * R, y: SY(c, u) + Math.sin(n) * R, R, roll: u * Math.SQRT2 * c.s / R };
}
const BFN = { x: v => v, x2: v => v * v, x3: v => v * v * v, abs: Math.abs, sqrt: v => v >= 0 ? Math.sqrt(v) : NaN };
const BTEX = { x: 'y = x', x2: 'y = x^{2}', x3: 'y = x^{3}', abs: 'y = |x|', sqrt: M`y = \sqrt{x}` };
const BNAME = { x: ['LINEAR', '一次函数'], x2: ['QUADRATIC', '二次函数'], x3: ['CUBIC', '三次函数'], abs: ['ABSOLUTE VALUE', '绝对值函数'], sqrt: ['SQUARE ROOT', '定义域 x ≥ 0'] };
// Visual morph between two graphs (unlabelled while in flight). Where the
// target is undefined (√x for x < 0) that branch retracts instead of bending.
function morphFn(fa, fb, e, xmin, toSqrt, fromSqrt) {
  return v => {
    if (toSqrt && v < 0) return v >= lerp(xmin, 0, E.inCubic(e)) ? fa(v) : NaN;
    if (fromSqrt && v < 0) return v >= lerp(0, xmin, E.outCubic(e)) ? fb(v) : NaN;
    return lerp(fa(v), fb(v), e);
  };
}
function basicState(t, xmin) {
  const A = BA.arrive, m = BA.morph;
  let i = 0;
  while (i + 1 < A.length && t >= A[i + 1][0] - m) i++;
  const to = A[i][1];
  if (i === 0 || t >= A[i][0]) return { f: BFN[to], key: to, i, e: 1 };
  const from = A[i - 1][1], e = E.inOutCubic(inv(A[i][0] - m, A[i][0], t));
  return { f: morphFn(BFN[from], BFN[to], e, xmin, to === 'sqrt', false), key: null, i, e };
}
const BALL_KEYS = [[2.0, 2.2], [2.5, 1.0], [3.15, -1.2], [3.5, -1.2], [4.15, 1.3], [4.5, 1.3], [5.15, 1.0], [5.5, 1.0], [6.0, 0.0]];
function sWorld(x, t) {
  bg(x);
  const c = worldCam(t), V = viewWorld(c), X0 = SX(c, 0), Y0 = SY(c, 0);
  grid(x, c, Math.floor(V.x0), Math.ceil(V.x1), Math.floor(V.y0), Math.ceil(V.y1), 1, 0.075 * inv(1.9, 2.4, t));
  // the first line — later the x-axis — carrying the impact wave
  const L = 1500 * E.outCubic(inv(OR.line[0], OR.line[1], t));
  const lp = new Path2D(), n = Math.ceil(2 * L / 4);
  for (let i = 0; i <= n; i++) { const xs = X0 - L + 4 * i, y = Y0 + lineWave(xs, t, X0); i ? lp.lineTo(xs, y) : lp.moveTo(xs, y); }
  stroke(x, lp, t < 1.0 ? C.line : rgba(C.line, lerp(1, 0.75, inv(1.0, 1.5, t))), lerp(2.4, 1.5, inv(1.0, 1.5, t)), { glow: 1 - inv(1.0, 2.0, t) });
  // y-axis and ticks grow out of the impact point
  const ay = E.outCubic(inv(OR.axes[0], OR.axes[0] + 0.45, t));
  if (ay > 0) line(x, X0, Y0 - 1300 * ay, X0, Y0 + 1300 * ay, rgba(C.line, 0.75), 1.5);
  x.save();
  x.font = font(400, 15, MONO); x.fillStyle = rgba(C.line, 0.5);
  const tp = new Path2D();
  for (let k = -16; k <= 16; k++) {
    if (!k) continue;
    const ta = OR.axes[0] + 0.1 + 0.025 * Math.abs(k), a = inv(ta, ta + 0.15, t);
    if (a <= 0) continue;
    const px = SX(c, k), py = SY(c, k);
    x.globalAlpha = a;
    if (px > -20 && px < W + 20) { tp.moveTo(px, Y0 - 5 * a); tp.lineTo(px, Y0 + 5 * a); if (c.s > 60) { x.textAlign = 'center'; x.textBaseline = 'top'; x.fillText(fmtTick(k), px, Y0 + 10); } }
    if (py > -20 && py < H + 20) { tp.moveTo(X0 - 5 * a, py); tp.lineTo(X0 + 5 * a, py); if (c.s > 60) { x.textAlign = 'right'; x.textBaseline = 'middle'; x.fillText(fmtTick(k), X0 - 10, py); } }
  }
  x.globalAlpha = 1; x.strokeStyle = rgba(C.line, 0.75); x.lineWidth = 1.5; x.stroke(tp);
  x.restore();
  // curves
  let bpos;
  if (t >= OR.roll[0] && t < 2.0) {
    const u = 2.2 * E.inQuad(inv(OR.roll[0], OR.roll[1], t));
    line(x, X0, Y0, SX(c, u), SY(c, u), C.line, 4, { glow: 0.8 });
  } else if (t >= 2.0) {
    const g = E.outCubic(inv(2.0, 2.35, t));
    const xa = lerp(0, V.x0 - 0.5, g), xb = lerp(2.2, V.x1 + 0.5, g);
    // ghosts of earlier graphs
    for (let k = 1; k < BA.arrive.length; k++) {
      const ms = BA.arrive[k][0] - BA.morph;
      if (t < ms) break;
      const a = 0.22 * Math.exp(-(t - ms) * 1.1);
      if (a > 0.01) stroke(x, plotPath(c, BFN[BA.arrive[k - 1][1]], V.x0, V.x1), C.line, 2, { alpha: a });
    }
    const st = basicState(t, V.x0 - 0.5);
    stroke(x, plotPath(c, st.f, xa, xb), C.line, 4, { glow: 0.8 });
    const xv = kf(t, BALL_KEYS, E.inOutSine), yv = st.f(xv);
    const e = E.outCubic(inv(2.0, 2.4, t)), R0 = 28 * Math.sqrt(3);
    const R = lerp(R0, 13, e), n = -3 * Math.PI / 4;
    bpos = { x: SX(c, xv) + Math.cos(n) * R * (1 - e), y: SY(c, yv) + Math.sin(n) * R * (1 - e), R };
  }
  const b = bpos || originBall(t, c);
  ball(x, b.x, b.y, b.R, b);
  // labels: only once a graph has landed
  const labels = [['x', 1.75, 2.15], ['x2', 2.5, 3.15], ['x3', 3.5, 4.15], ['abs', 4.5, 5.15], ['sqrt', 5.5, 6.0]];
  for (const [k, a, z] of labels) {
    mshow(x, t, BTEX[k], FORMULA_X, 240, 76, a, z);
    const al = vis(t, a + 0.1, z, 0.3, 0.2);
    if (al > 0) { chip(x, BNAME[k][0], FORMULA_X, 300, C.line, al); cnTag(x, BNAME[k][1], FORMULA_X + 6, 350, { alpha: al * 0.8 }); }
  }
  mshow(x, t, M`y = \g{a}{a}\cdot f(\g{b}{b}(x - \g{h}{h})) + \g{k}{k}`, 1290, 230, 54, BA.general, Infinity, { dur: 0.5 });
}

// ================================================= 06–10  transformations
const TR = TL.transform;
const CAMT = cam(700, 700, 90);
function tparams(t) {
  const P = { a: 1, b: 1, h: 0, k: 0 };
  let active = null;
  for (const [n, ts, v0, v1] of TR.steps) {
    if (t >= ts) { P[n] = lerp(v0, v1, E.outBack(clamp((t - ts) / TR.dur), 1.3)); active = n; }
  }
  return { P, active };
}
const TNOTE = {
  h: ['h > 0 → 图像向右平移 h', 'shift right by h'],
  k: ['k > 0 → 图像向上平移 k', 'shift up by k'],
  a: ['|a| > 1 → 竖直拉伸', 'vertical stretch'],
  a2: ['a < 0 → 关于 y = k 上下反射', 'reflect in y = k'],
  b: ['|b| 越大 → 水平方向越压缩', 'larger |b| compresses'],
  b2: ['|b| < 1 → 水平方向拉伸', 'smaller |b| stretches'],
};
function sTransform(x, t) {
  bg(x);
  const c = camLerp(CAMB, CAMT, E.inOutCubic(inv(6.0, 6.45, t))), V = viewWorld(c);
  const { P, active } = tparams(t);
  const { a, b, h, k } = P;
  grid(x, c, Math.floor(V.x0), Math.ceil(V.x1), Math.floor(V.y0), Math.ceil(V.y1), 1, 0.075);
  axes(x, c, V.x0 + 0.2, V.x1 - 0.2, V.y0 + 0.2, V.y1 - 0.4, { arrows: false, names: false });
  // the grid carried by the transformation: (u, v) ↦ (h + u/b, k + a·v)
  const ga = 0.16 * inv(6.5, 6.8, t);
  if (ga > 0) {
    const p = new Path2D();
    for (let u = -14; u <= 14; u++) { const xs = SX(c, h + u / b); if (xs > -5 && xs < W + 5) { p.moveTo(xs, 0); p.lineTo(xs, H); } }
    for (let v = -8; v <= 10; v++) { const ys = SY(c, k + a * v); if (ys > -5 && ys < H + 5) { p.moveTo(0, ys); p.lineTo(W, ys); } }
    stroke(x, p, C.blue, 1, { alpha: ga });
  }
  // parent graph stays as a low-alpha reference
  const morph = E.inOutCubic(inv(6.0, 6.35, t));
  if (morph >= 1) stroke(x, plotPath(c, v => v * v, V.x0, V.x1), C.line, 2, { alpha: 0.25 });
  const f = morph < 1 ? morphFn(BFN.sqrt, BFN.x2, morph, V.x0 - 0.5, false, true) : v => a * (b * (v - h)) ** 2 + k;
  stroke(x, plotPath(c, f, V.x0 - 0.5, V.x1 + 0.5), C.line, 4, { glow: 0.8 });
  // annotations — only the parameter that is moving
  const vx = SX(c, h), vy = SY(c, k), O0 = [SX(c, 0), SY(c, 0)];
  const ah = vis(t, 6.5, 7.45, 0.2, 0.3), ak = vis(t, 7.0, 7.45, 0.2, 0.3);
  if (ah > 0 && Math.abs(h) > 0.05) { arrow(x, O0[0], O0[1] + 26, vx, O0[1] + 26, C.yellow, 2.5, { alpha: ah }); mtex(x, 'h', (O0[0] + vx) / 2, O0[1] + 64 - 10 * (1 - spring(t - 6.5)), 34, { align: 'center', alpha: ah, color: C.yellow }); }
  if (ak > 0 && Math.abs(k) > 0.05) { arrow(x, vx + 30, O0[1], vx + 30, vy, C.yellow, 2.5, { alpha: ak }); mtex(x, 'k', vx + 48 + 10 * (1 - spring(t - 7.0)), (O0[1] + vy) / 2 + 10, 34, { alpha: ak, color: C.yellow }); }
  const aa = vis(t, 7.5, 8.45, 0.2, 0.3);
  if (aa > 0) {
    const bx = SX(c, h + 1 / b) + 26, y0 = SY(c, k), y1 = SY(c, k + a);
    bracketV(x, bx + 12, y0, y1, C.yellow, aa);
    line(x, vx, y0, bx + 12, y0, rgba(C.yellow, 0.5), 1, { alpha: aa, dash: [4, 5] });
    mtex(x, M`a = ${fmt(a)}`, bx + 26, (y0 + y1) / 2 + 12, 30, { alpha: aa, color: C.yellow });
  }
  const ab = vis(t, 8.5, 9.75, 0.2, 0.25);
  if (ab > 0) {
    // measured where b(x − h) = ±1, i.e. on the line y = k + a; drawn on the open side of the curve
    const yb = SY(c, k + a), x0 = SX(c, h - 1 / b), x1 = SX(c, h + 1 / b), dn = a < 0 ? 1 : -1;
    bracketH(x, x0, x1, yb + dn * 30, C.yellow, ab);
    line(x, x0, yb, x1, yb, rgba(C.yellow, 0.4), 1, { dash: [4, 5], alpha: ab });
    dot(x, x0, yb, 5, C.yellow, ab); dot(x, x1, yb, 5, C.yellow, ab);
    mtex(x, M`\frac{2}{|b|} = ${fmt(2 / Math.abs(b))}`, (x0 + x1) / 2, yb + dn * 30 + (a < 0 ? 52 : -18), 30, { align: 'center', alpha: ab, color: C.yellow });
  }
  // the ball is the vertex handle; the "h" glyph flies out of the formula into it
  const [f0, f1] = TR.handle, fl = inv(f0 + 0.1, f1, t);
  ball(x, vx, vy, 13, { ring: E.outBack(inv(f1 - 0.1, f1 + 0.2, t)), ringPulse: Math.exp(-mod(t, BEAT) * 8) });
  // formulas (right column)
  const tint = {};
  for (const n of ['a', 'b', 'h', 'k']) tint[n] = n === active ? C.yellow : rgba(C.line, 0.55);
  const hide = fl > 0 && fl < 1 ? new Set(['h']) : null;
  const G = mtex(x, M`y = \g{a}{a}\cdot f(\g{b}{b}(x - \g{h}{h})) + \g{k}{k}`, 1290, 230, 54, { tint: t > f1 ? tint : null, hide });
  if (fl > 0 && fl < 1) {
    const bx0 = G.boxes.h.cx, by0 = G.boxes.h.cy, e = E.inOutCubic(fl);
    const px = lerp(bx0, vx, e), py = lerp(by0, vy, e) - Math.sin(Math.PI * e) * 160;
    const sc = lerp(1, 0.3, E.inCubic(fl)) + Math.sin(Math.PI * Math.min(1, fl * 1.4)) * 1.8;
    mtex(x, 'h', px, py + 18 * sc, 54 * sc, { align: 'center', color: C.yellow, alpha: 1 - inv(0.85, 1, fl) });
  }
  mshow(x, t, M`y = \sqrt{x}`, FORMULA_X, 240, 76, 5.5, 6.0);
  mshow(x, t, 'f(x) = x^{2}', 1290, 300, 40, 6.35);
  const subs = M`y = \c{${active === 'a' ? 'yellow' : 'w'}}{${fmt(a)}}\cdot(\c{${active === 'b' ? 'yellow' : 'w'}}{${fmt(b)}}(x - \c{${active === 'h' ? 'yellow' : 'w'}}{${fmt(h)}}))^{2} + \c{${active === 'k' ? 'yellow' : 'w'}}{${fmt(k)}}`;
  mtex(x, subs, 1290, 372, 34, { alpha: inv(6.4, 6.7, t) * 0.9 });
  // parameter panel
  const pa = E.outCubic(inv(6.2, 6.6, t));
  if (pa > 0) {
    x.save(); x.globalAlpha = pa; x.translate((1 - pa) * 120, 0);
    const rows = [['a', a], ['b', b], ['h', h], ['k', k]];
    rows.forEach(([n, v], r) => {
      const y = 480 + r * 86, on = n === active, T0 = 1360, T1 = 1700;
      mtex(x, n, 1298, y + 12, 36, { color: on ? C.yellow : rgba(C.line, 0.6) });
      x.fillStyle = rgba(C.line, 0.15); x.fillRect(T0, y - 1, T1 - T0, 2);
      x.fillStyle = rgba(C.line, 0.35); x.fillRect((T0 + T1) / 2 - 1, y - 7, 2, 14);
      const kx = lerp(T0, T1, (clamp(v, -2.5, 2.5) + 2.5) / 5);
      x.fillStyle = on ? C.yellow : rgba(C.line, 0.3); x.fillRect(Math.min(kx, (T0 + T1) / 2), y - 2, Math.abs(kx - (T0 + T1) / 2), 4);
      dot(x, kx, y, on ? 11 : 8, on ? C.yellow : rgba(C.line, 0.75));
      tag(x, fmt(v), 1730, y + 6, { mono: true, size: 18, color: on ? C.yellow : rgba(C.line, 0.55) });
    });
    x.restore();
  }
  let note = null, noteT = 0;
  for (const [n, ts, , v1] of TR.steps) {
    if (t >= ts) { note = n === 'a' && v1 < 0 ? 'a2' : n === 'b' && v1 < 1 ? 'b2' : n; noteT = ts; }
  }
  if (note) {
    const al = inv(noteT, noteT + 0.2, t) * (1 - inv(9.6, 9.75, t));
    cnTag(x, TNOTE[note][0], 1298, 860, { alpha: al, size: 24, color: rgba(C.line, 0.9) });
    tag(x, TNOTE[note][1].toUpperCase(), 1298, 896, { alpha: al * 0.6, size: 13, ls: '2px' });
  }
}

// ======================================================== 10–14  inverse
const INV = TL.inverse;
const CAMI = cam(760, 800, 95);
const exp2 = v => Math.pow(2, v);
function flipPt(px, py, phi) { // rotate (x, y) about the line y = x by phi (orthographic)
  const m = (px + py) / 2, n = (px - py) / 2, c = Math.cos(phi);
  return [m + n * c, m - n * c];
}
function sInverse(x, t) {
  bg(x);
  const c = CAMI, V = viewWorld(c);
  const fade = 1 - inv(INV.collapse[0], INV.collapse[0] + 0.25, t);
  x.save(); x.globalAlpha = fade;
  grid(x, c, Math.floor(V.x0), Math.ceil(V.x1), Math.floor(V.y0), Math.ceil(V.y1), 1, 0.075);
  axes(x, c, V.x0 + 0.2, V.x1 - 0.3, V.y0 + 0.2, V.y1 - 0.4, { arrows: false, names: false });
  x.restore();
  // mirror axis y = x (born from the fold crease); collapses into the split line
  const ce = E.inOutCubic(inv(INV.collapse[0], INV.collapse[1], t));
  const m0 = [SX(c, 2.2), SY(c, 2.2)], ang = lerp(-Math.PI / 4, -Math.PI / 2, ce), len = lerp(1700, 1300, ce);
  const mc = [lerp(m0[0], 960, ce), lerp(m0[1], 540, ce)];
  line(x, mc[0] - Math.cos(ang) * len / 2, mc[1] - Math.sin(ang) * len / 2, mc[0] + Math.cos(ang) * len / 2, mc[1] + Math.sin(ang) * len / 2,
    ce > 0 ? mix(C.yellow, C.line, ce) : C.yellow, lerp(2, 1.5, ce), { dash: ce < 0.5 ? [10, 8] : null, glow: 0.6 * (1 - ce) });
  mshow(x, t, 'y = x', SX(c, 6.1), SY(c, 5.3), 34, 10.1, INV.collapse[0], { color: C.yellow });
  // f(x) = 2^x drawn left to right; the ball rides to (1, 2)
  const [d0, d1] = INV.draw, [p0, p1] = INV.flip;
  // the ball draws the curve up to (1, 2); the rest of the graph follows after it stops
  const bx = kf(t, [[d0, -6], [d1, 1]], E.inOutSine), by = exp2(bx);
  const xr = t < d1 ? bx : lerp(1, 3.2, E.outCubic(inv(d1, d1 + 0.45, t)));
  const phi = Math.PI * E.inOutCubic(inv(p0, p1, t));
  if (t >= d0) {
    const pts = [];
    for (let i = 0; i <= 500; i++) { const v = lerp(-6, xr, i / 500), [fx, fy] = flipPt(v, exp2(v), phi); pts.push([SX(c, fx), SY(c, fy)]); }
    if (phi > 0) stroke(x, plotPath(c, exp2, -6, 3.2), C.line, 2, { alpha: 0.28 * fade });
    stroke(x, polyPath(pts), phi > 0 ? mix(C.line, C.blue, phi / Math.PI) : C.line, lerp(4, 2.5, Math.abs(Math.sin(phi))), { glow: 0.8, alpha: fade });
  }
  const [fbx, fby] = flipPt(bx, by, phi);
  const BX = SX(c, fbx), BY = SY(c, fby);
  // perpendicular link (1,2) — (2,1) through the mirror
  const la = vis(t, p0, INV.collapse[0], 0.2, 0.25);
  if (la > 0) {
    line(x, SX(c, 1), SY(c, 2), SX(c, 2), SY(c, 1), rgba(C.line, 0.6), 1.5, { dash: [5, 6], alpha: la });
    dot(x, SX(c, 1.5), SY(c, 1.5), 5, C.yellow, la);
    dot(x, SX(c, 1), SY(c, 2), 6, rgba(C.line, 0.8), la * inv(p0 + 0.2, p0 + 0.4, t));
  }
  if (t >= d0) {
    const pa = vis(t, d1 - 0.05, INV.collapse[0], 0.15, 0.2);
    if (pa > 0) { // projections
      line(x, BX, BY, BX, SY(c, 0), rgba(C.line, 0.45), 1.2, { dash: [4, 5], alpha: pa });
      line(x, BX, BY, SX(c, 0), BY, rgba(C.line, 0.45), 1.2, { dash: [4, 5], alpha: pa });
    }
    ball(x, BX, BY, 13, { alpha: fade });
    // the coordinate label: the two numbers trade places as the point is reflected
    if (pa > 0) {
      const sw = phi / Math.PI, lx = BX + 26, ly = BY - 26, sz = 34;
      x.save(); x.globalAlpha = pa;
      x.font = `${sz}px ${SERIF}`; x.fillStyle = C.line; x.textBaseline = 'alphabetic';
      const wP = x.measureText('(').width, wD = x.measureText('2').width, wC = x.measureText(', ').width;
      const s1 = lx + wP, s2 = lx + wP + wD + wC;
      x.fillText('(', lx, ly); x.fillText(',', s1 + wD, ly); x.fillText(')', s2 + wD, ly);
      x.fillStyle = C.yellow;
      x.fillText('1', lerp(s1, s2, sw), ly - Math.sin(Math.PI * sw) * 30);
      x.fillStyle = C.blue;
      x.fillText('2', lerp(s2, s1, sw), ly + Math.sin(Math.PI * sw) * 30);
      x.restore();
    }
  }
  // formulas
  mshow(x, t, 'f(x) = 2^{x}', FORMULA_X, 240, 72, d1, INV.collapse[0]);
  mshow(x, t, M`f^{-1}(x) = \log_{2} x`, FORMULA_X, 340, 72, p1, INV.collapse[0], { color: C.blue });
  const da = vis(t, p1 + 0.1, INV.collapse[0], 0.25, 0.2);
  if (da > 0) chip(x, 'DOMAIN  x > 0', FORMULA_X, 400, C.blue, da);
  mshow(x, t, M`f(1) = 2 \quad ⇔ \quad f^{-1}(2) = 1`, FORMULA_X, 480, 40, INV.swap, INV.collapse[0]);
  const sa = vis(t, INV.swap + 0.1, INV.collapse[0], 0.25, 0.2);
  if (sa > 0) { chip(x, 'INVERSE · f⁻¹', FORMULA_X, 540, C.yellow, sa); cnTag(x, '输入与输出交换 · 关于 y = x 对称', FORMULA_X + 150, 547, { alpha: sa, size: 22 }); }
  const fa = vis(t, p0 - 0.05, p1 + 0.2, 0.1, 0.2);
  if (fa > 0) tag(x, 'SAME SCALE ON BOTH AXES · 反射前后比例一致', SX(c, 3.3), SY(c, -1.6), { alpha: fa * 0.6, size: 13, ls: '2px' });
}

// ===================================================== 14–18  reciprocal
const RC = TL.reciprocal;
const CAML = cam(480, 600, 80), CAMR = cam(1440, 600, 80);
function recipX(t) {
  if (t < RC.keys[0][0]) return 2;
  if (t < RC.hop[0]) return kf(t, RC.keys, E.inOutCubic);
  if (t < RC.hop[1]) return NaN; // in the air, off the curve
  if (t < RC.shoot[0]) return kf(t, RC.neg, E.inOutCubic);
  return lerp(-1, -9, E.inCubic(inv(RC.shoot[0], RC.shoot[1], t)));
}
const recipWidth = v => 1.6 + 4.2 * Math.exp(-0.5 * Math.log(Math.abs(v)) ** 2);
function recipBranch(x, c, xa, xb, a) { // tapered "liquid" stroke, thinner as it stretches to the asymptotes
  if (xb - xa < 1e-3) return;
  const n = 60;
  for (let i = 0; i < n; i++) {
    const u0 = xa * Math.pow(xb / xa, i / n), u1 = xa * Math.pow(xb / xa, (i + 1) / n);
    const p = plotPath(c, v => 1 / v, u0, u1, { breaks: [0] });
    stroke(x, p, C.coral, recipWidth((u0 + u1) / 2), { alpha: a, glow: 0.5 });
  }
}
function sRecip(x, t) {
  bg(x);
  const whip = 1150 * E.inCubic(inv(17.75, 18.0, t)); // half a screen: something is always in frame
  x.save(); x.translate(whip, 0);
  const op = E.outCubic(inv(RC.open[0], RC.open[1], t));
  const xa = recipX(t);
  for (const [c, side] of [[CAML, -1], [CAMR, 1]]) {
    x.save();
    x.beginPath(); side < 0 ? x.rect(960 - 960 * op, 0, 960 * op, H) : x.rect(960, 0, 960 * op, H); x.clip();
    const V = viewWorld(c);
    const xr = side < 0 ? [V.x0, Math.min(V.x1, (960 - c.ox) / c.s)] : [Math.max(V.x0, (960 - c.ox) / c.s), V.x1];
    grid(x, c, Math.ceil(xr[0]), Math.floor(xr[1]), Math.floor(V.y0), Math.ceil(V.y1), 1, 0.07);
    axes(x, c, xr[0] + 0.3, xr[1] - 0.3, V.y0 + 0.3, V.y1 - 0.5, { arrows: false, names: false });
    x.restore();
  }
  // left: f(x) = x with its point
  x.save(); x.beginPath(); x.rect(960 - 960 * op, 0, 960 * op, H); x.clip();
  stroke(x, plotPath(CAML, v => v, -6, 6), C.line, 3.5, { glow: 0.6 });
  if (Number.isFinite(xa) && t >= RC.drop[0]) {
    const px = SX(CAML, xa), py = SY(CAML, xa);
    line(x, px, SY(CAML, 0), px, py, rgba(C.blue, 0.7), 1.5, { dash: [5, 5] });
    dot(x, px, py, 8, C.line);
  }
  x.restore();
  // right: 1/f(x) = 1/x, built only over the inputs visited so far
  x.save(); x.beginPath(); x.rect(960, 0, 960 * op, H); x.clip();
  const asy = vis(t, 15.8, RC.shoot[0], 0.25, 0.2);
  if (asy > 0) {
    line(x, SX(CAMR, 0), 0, SX(CAMR, 0), H, C.coral, 2, { dash: [8, 8], alpha: asy, glow: 0.5 });
    chip(x, 'x = 0 · UNDEFINED', SX(CAMR, 0) + 16, 150, C.coral, asy);
    cnTag(x, '1/0 无定义', SX(CAMR, 0) + 18, 196, { alpha: asy, size: 20 });
  }
  const ha = vis(t, 16.6, RC.shoot[0], 0.25, 0.2);
  if (ha > 0) {
    line(x, 960, SY(CAMR, 0), W, SY(CAMR, 0), rgba(C.yellow, 0.7), 2, { dash: [8, 8], alpha: ha });
    cnTag(x, 'y → 0，但永不相交', W - 60, SY(CAMR, 0) + 36, { alpha: ha, size: 20, align: 'right' });
  }
  stroke(x, plotPath(CAMR, v => v, -6, 6), C.line, 1.5, { alpha: 0.2 });
  if (t >= RC.keys[0][0]) {
    const lo = t < 15.4 ? 2 : Math.min(2, t < RC.hop[0] ? xa : 0.2), hi = t < 15.4 ? Math.max(2, xa) : 4;
    recipBranch(x, CAMR, lo, hi, 1);
  }
  if (t >= RC.hop[1]) { // negative branch, also only over visited inputs
    const lo = Math.min(-0.2, xa), n = 60;
    for (let i = 0; i < n; i++) {
      const u0 = -0.2 * Math.pow(lo / -0.2, i / n), u1 = -0.2 * Math.pow(lo / -0.2, (i + 1) / n);
      stroke(x, plotPath(CAMR, v => 1 / v, u1, u0, { breaks: [0] }), C.coral, recipWidth((u0 + u1) / 2), { glow: 0.5 });
    }
  }
  let bx, by;
  if (t < RC.drop[0]) { bx = 2; by = 2; }
  else if (t < RC.keys[0][0]) { bx = 2; by = lerp(2, 0.5, E.inOutCubic(inv(RC.drop[0], RC.drop[1], t))); }
  else if (Number.isFinite(xa)) { bx = xa; by = 1 / xa; }
  else { // the hop over x = 0: an explicit leap, not a path along the graph
    const u = E.inOutCubic(inv(RC.hop[0], RC.hop[1], t));
    bx = (1 - u) ** 2 * 0.2 + 2 * u * (1 - u) * -1.6 + u * u * -0.2;
    by = (1 - u) ** 2 * 5 + 2 * u * (1 - u) * 0 + u * u * -5;
  }
  if (t >= RC.drop[0]) {
    const px = SX(CAMR, bx);
    if (Number.isFinite(xa)) line(x, px, SY(CAMR, 0), px, SY(CAMR, by), rgba(C.blue, 0.7), 1.5, { dash: [5, 5] });
    ball(x, px, SY(CAMR, by), 13);
    if (Number.isFinite(xa) && t < RC.shoot[0]) tag(x, `x = ${fmt(bx)}   1/x = ${fmt(by)}`, px + 22, SY(CAMR, by) + (by > 0 ? -18 : 30), { mono: true, size: 15, color: rgba(C.line, 0.8) });
  }
  const hopA = vis(t, RC.hop[0], RC.hop[1] + 0.3, 0.05, 0.2);
  if (hopA > 0) cnTag(x, '跳过 x = 0', SX(CAMR, -1.4), SY(CAMR, 0.6), { alpha: hopA, size: 22, color: C.coral });
  x.restore();
  // divider and formulas
  line(x, 960, 0, 960, H, rgba(C.line, 0.85), 1.5);
  mshow(x, t, 'f(x) = x', 90, 230, 58, RC.open[0] + 0.1);
  mshow(x, t, M`\frac{1}{f(x)} = \frac{1}{x}`, 1050, 236, 58, RC.drop[0], Infinity, { color: C.coral });
  const cp = E.outCubic(inv(RC.compare, RC.compare + 0.35, t));
  if (cp > 0) {
    x.save(); x.globalAlpha = cp; x.translate(0, (1 - cp) * 30);
    chip(x, 'INVERSE', 90, 900, C.yellow, 1);
    mtex(x, 'f^{-1}(x) = x', 220, 912, 40, { color: C.yellow });
    cnTag(x, '反函数：交换输入与输出 —— f(x) = x 的反函数仍是它自己', 90, 966, { size: 20 });
    chip(x, 'RECIPROCAL', 1050, 900, C.coral, 1);
    mtex(x, M`\frac{1}{f(x)} = \frac{1}{x}`, 1220, 914, 40, { color: C.coral });
    cnTag(x, '倒数：把输出变成 1/输出 —— 与反函数是两回事', 1050, 966, { size: 20 });
    x.restore();
  }
  x.restore();
}

// ===================================================== 18–24  derivative
const DV = TL.derivative;
const fD = v => v * v * v - 3 * v, fpD = v => 3 * v * v - 3;
const CAMDT = cam(960, 330, 120), CAMDB = cam(960, 900, 120, 30);
function derivX(t) {
  const K = DV.trace;
  if (t < K[0][0]) return DV.x0;
  if (t < K[1][0]) return kf(t, [K[0], K[1]], E.inOutCubic);
  return kf(t, K.slice(1), softEase);
}
function sDeriv(x, t) {
  bg(x);
  const enter = -1000 * (1 - E.outCubic(inv(18.0, 18.32, t)));
  x.save(); x.translate(enter, 0);
  const ct = CAMDT, cb = CAMDB;
  grid(x, ct, -2, 2, -2, 2, 1, 0.07);
  axes(x, ct, -2.3, 2.3, -2.3, 2.3, { xs: 1, ys: 1 });
  const bA = E.outCubic(inv(DV.fprime - 0.1, DV.fprime + 0.25, t));
  if (bA > 0) {
    x.save(); x.globalAlpha = bA;
    axes(x, cb, -2.3, 2.3, -3.6, 8.2, { xs: 1, ys: 3, yn: "f′" });
    x.restore();
  }
  stroke(x, plotPath(ct, fD, -1.95, 1.95), C.line, 4, { glow: 0.7 });
  const x0 = DV.x0, P = [SX(ct, x0), SY(ct, fD(x0))];
  const hh = t < DV.shrink[0] ? 1 : Math.pow(2, -10 * E.inOutSine(inv(DV.shrink[0], DV.shrink[1], t)));
  const secA = vis(t, DV.q, DV.fprime + 0.2, 0.2, 0.3);
  x.save(); x.beginPath(); x.rect(0, 0, W, 640); x.clip(); // lines stay inside the f panel
  if (secA > 0) {
    const Q = [SX(ct, x0 + hh), SY(ct, fD(x0 + hh))], m = (fD(x0 + hh) - fD(x0)) / hh;
    const sg = E.outCubic(inv(DV.secant, DV.secant + 0.35, t)) * 2.2;
    if (sg > 0) {
      const p = plotPath(ct, v => fD(x0) + m * (v - x0), x0 - sg, x0 + sg);
      stroke(x, p, hh < 0.02 ? slopeColor(m) : C.blue, 2.5, { alpha: secA, glow: 0.6 });
    }
    const tri = vis(t, DV.quot, DV.lim, 0.2, 0.3) * secA;
    if (tri > 0) {
      line(x, P[0], P[1], Q[0], P[1], C.yellow, 2, { alpha: tri, dash: [5, 5] });
      line(x, Q[0], P[1], Q[0], Q[1], C.yellow, 2, { alpha: tri, dash: [5, 5] });
      mtex(x, 'h', (P[0] + Q[0]) / 2, P[1] + 34, 30, { align: 'center', alpha: tri, color: C.yellow });
    }
    dot(x, Q[0], Q[1], 8, C.blue, secA * inv(DV.q, DV.q + 0.15, t));
    tag(x, `h = ${hh < 0.01 ? hh.toExponential(1) : fmt(hh)}`, 1330, 300, { mono: true, size: 22, color: C.yellow, alpha: secA * inv(DV.quot, DV.quot + 0.2, t) });
    tag(x, `slope = ${fmt(m, 3)}`, 1330, 340, { mono: true, size: 22, color: hh < 0.02 ? slopeColor(m) : C.blue, alpha: secA * inv(DV.quot, DV.quot + 0.2, t) });
  }
  // stage C: tangent rides the curve; slope becomes the height of f′
  const tc = t >= DV.fprime;
  const xb = tc ? derivX(t) : x0;
  if (tc) {
    const m = fpD(xb), dx = 0.75 / Math.sqrt(1 + m * m);
    stroke(x, plotPath(ct, v => fD(xb) + m * (v - xb), xb - dx, xb + dx), slopeColor(m), 3, { glow: 0.8 });
  }
  x.restore();
  if (tc) {
    const m = fpD(xb), col = slopeColor(m);
    const tr0 = DV.trace[1][0];
    if (t >= tr0) {
      for (const [a, b, cc] of [[-1.8, -1, C.blue], [-1, 1, C.coral], [1, 1.8, C.blue]]) {
        const hi = Math.min(b, xb);
        if (hi > a) stroke(x, plotPath(cb, fpD, a, hi), cc, 3.5, { glow: 0.6 });
      }
      const BX = SX(cb, xb), BY = SY(cb, fpD(xb));
      line(x, SX(ct, xb), SY(ct, fD(xb)), BX, BY, rgba(C.line, 0.25), 1.2, { dash: [4, 6] });
      dot(x, BX, BY, 7, col);
      const nearEx = Math.min(Math.abs(t - DV.trace[2][0]), Math.abs(t - DV.trace[3][0]));
      tag(x, `f′(${fmt(xb)}) = ${fmt(m)}`, BX + 16, BY - 14, { mono: true, size: 15, color: col, alpha: inv(0.12, 0.3, nearEx) });
      for (const ex of [-1, 1]) { // extrema: tangent flat, f′ on the axis
        const te = ex < 0 ? DV.trace[2][0] : DV.trace[3][0], fl = Math.exp(-Math.abs(t - te) * 7);
        if (fl > 0.05 && t > te - 0.3) {
          x.save(); x.globalAlpha = fl; x.strokeStyle = C.yellow; x.lineWidth = 2;
          x.beginPath(); x.arc(SX(ct, ex), SY(ct, fD(ex)), 22 + 10 * (1 - fl), 0, TAU); x.stroke();
          x.beginPath(); x.arc(SX(cb, ex), SY(cb, 0), 18 + 10 * (1 - fl), 0, TAU); x.stroke(); x.restore();
          mtex(x, `f'(${ex < 0 ? '-' : ''}1) = 0`, SX(cb, ex), SY(cb, 0) + 52, 26, { align: 'center', color: C.yellow, alpha: Math.min(1, fl * 1.6) });
        }
      }
    }
  }
  ball(x, SX(ct, xb), SY(ct, fD(xb)), 13, { glow: 1 });
  // formulas
  mshow(x, t, 'f(x) = x^{3} - 3x', 110, 220, 56, 18.2);
  mshow(x, t, M`\frac{f(x+h) - f(x)}{h}`, 110, 340, 52, DV.quot, DV.lim - 0.25);
  mshow(x, t, M`\lim_{h\to 0}\frac{f(x+h) - f(x)}{h} = f'(x)`, 110, 340, 44, DV.lim, Infinity);
  mshow(x, t, `f'(${fmt(x0)}) = ${fmt(fpD(x0))}`, 110, 430, 40, DV.lim + 0.25, DV.fprime + 0.2, { color: slopeColor(fpD(x0)) });
  mshow(x, t, "f'(x) = 3x^{2} - 3", 110, 760, 52, DV.fprime, Infinity, { color: C.line });
  const la = inv(DV.fprime + 0.2, DV.fprime + 0.5, t);
  if (la > 0) {
    chip(x, 'SLOPE > 0', 1330, 700, C.blue, la); chip(x, 'SLOPE = 0', 1330, 745, C.yellow, la); chip(x, 'SLOPE < 0', 1330, 790, C.coral, la);
    cnTag(x, '切线斜率 → 导函数的高度', 1330, 850, { alpha: la, size: 22 });
  }
  const sh = vis(t, DV.secant + 0.2, DV.shrink[0], 0.3, 0.2);
  if (sh > 0) cnTag(x, '割线：两点之间的平均变化率', 1330, 400, { alpha: sh, size: 22 });
  const sh2 = vis(t, DV.shrink[0] + 0.2, DV.fprime, 0.3, 0.2);
  if (sh2 > 0) cnTag(x, 'h → 0：割线趋近切线', 1330, 400, { alpha: sh2, size: 22 });
  x.restore();
}

// ============================================ 23.85–24.25  tangent sweep
const SW = TL.sweep, SW_MID = SW[0] + 0.12;
// Phase 1: the tangent line lifts off the curve, stands upright and slides to the
// right edge. Phase 2: it sweeps right → left; everything it has passed is the integral scene.
const sweepX = t => lerp(W + 120, -80, E.inOutCubic(inv(SW_MID, SW[1], t)));
function tSweep(x, t, A, B) {
  const xb = derivX(SW[0]), m = fpD(xb), P = [SX(CAMDT, xb), SY(CAMDT, fD(xb))];
  const u = inv(SW[0], SW_MID, t);
  const ang = lerp(Math.atan2(-m * CAMDT.sy, CAMDT.s), -Math.PI / 2, E.outCubic(u));
  let xs, cy, L;
  if (t < SW_MID) {
    x.drawImage(A(), 0, 0);
    xs = lerp(P[0], W + 120, E.inCubic(u)); cy = lerp(P[1], 540, E.outCubic(u)); L = lerp(120, 1600, E.outCubic(u));
  } else {
    xs = sweepX(t); cy = 540; L = 1600;
    x.drawImage(B(), 0, 0);
    x.save(); x.beginPath(); x.rect(0, 0, Math.max(0, xs), H); x.clip(); x.drawImage(A(), 0, 0); x.restore();
  }
  line(x, xs - Math.cos(ang) * L, cy - Math.sin(ang) * L, xs + Math.cos(ang) * L, cy + Math.sin(ang) * L, C.yellow, 3, { glow: 1.2 });
}

// ====================================================== 24–30  integral
const IG = TL.integral;
const fI = v => v * v - 1, FI = v => v * v * v / 3 - v;
const CAMI2 = cam(700, 720, 200);
// time at which the sweep line passes screen x (bisection on the monotone sweep)
function sweepTime(px) {
  let lo = SW_MID, hi = SW[1];
  for (let i = 0; i < 24; i++) { const mid = (lo + hi) / 2; if (sweepX(mid) > px) lo = mid; else hi = mid; }
  return (lo + hi) / 2;
}
function rectHeights(t) {
  let k = 0;
  while (k + 1 < IG.n.length && t >= IG.n[k + 1][0]) k++;
  const [tn, n] = IG.n[k], dx = 2 / n, out = [];
  const sp = k > 0 ? E.outBack(clamp((t - tn) / 0.22), 1.6) : 1;
  for (let i = 0; i < n; i++) {
    const own = fI((i + 0.5) * dx), parent = k > 0 ? fI((Math.floor(i / 2) + 0.5) * dx * 2) : own;
    out.push([i * dx, (i + 1) * dx, lerp(parent, own, sp)]);
  }
  return { n, dx, rects: out, sum: out.reduce((s, r) => s + fI((r[0] + r[1]) / 2) * dx, 0) };
}
function regionPath(c, a, b) {
  const p = new Path2D();
  p.moveTo(SX(c, a), SY(c, 0));
  const n = Math.max(2, Math.ceil((b - a) * 120));
  for (let i = 0; i <= n; i++) { const v = lerp(a, b, i / n); p.lineTo(SX(c, v), SY(c, fI(v))); }
  p.lineTo(SX(c, b), SY(c, 0)); p.closePath();
  return p;
}
function fillRegion(x, c, a, b, alpha) {
  if (b <= a || alpha <= 0) return;
  x.save(); x.globalAlpha = alpha;
  if (a < 1) { x.fillStyle = rgba(C.coral, 0.55); x.fill(regionPath(c, a, Math.min(1, b))); }
  if (b > 1) { x.fillStyle = rgba(C.blue, 0.55); x.fill(regionPath(c, Math.max(1, a), b)); }
  x.restore();
}
function integralBase(x, c, t, a = 1) {
  x.save(); x.globalAlpha = a;
  grid(x, c, -1, 3, -1, 3, 0.5, 0.06);
  axes(x, c, -0.6, 2.7, -1.4, 3.35, { xs: 0.5, ys: 1 });
  x.restore();
}
function sIntegral(x, t) {
  bg(x);
  const c = CAMI2;
  integralBase(x, c, t);
  const R = rectHeights(t), fade = 1 - inv(IG.fade[0], IG.fade[1], t);
  if (fade > 0) {
    for (const [a, b, hgt] of R.rects) {
      const cx = SX(c, (a + b) / 2), un = t < SW[1] + 0.3 ? E.outBack(clamp((t - sweepTime(cx)) / 0.18), 1.4) : 1;
      if (un <= 0) continue;
      const y0 = SY(c, 0), y1 = SY(c, hgt * un), col = hgt >= 0 ? C.blue : C.coral;
      x.save(); x.globalAlpha = fade;
      x.fillStyle = rgba(col, 0.5); x.fillRect(SX(c, a), Math.min(y0, y1), SX(c, b) - SX(c, a), Math.abs(y1 - y0));
      x.strokeStyle = rgba(C.line, R.n > 16 ? 0.25 : 0.6); x.lineWidth = R.n > 32 ? 0.6 : 1.2;
      x.strokeRect(SX(c, a), Math.min(y0, y1), SX(c, b) - SX(c, a), Math.abs(y1 - y0));
      x.restore();
    }
  }
  // continuous region: faint whole, then accumulated up to the scanning ball
  const fe = inv(IG.fade[0], IG.fade[1], t);
  fillRegion(x, c, 0, 2, 0.28 * fe);
  const xs = lerp(0, 2, E.inOutSine(inv(IG.scan[0], IG.scan[1], t)));
  if (t >= IG.scan[0]) fillRegion(x, c, 0, xs, 1);
  stroke(x, plotPath(c, fI, -0.45, 2.15), C.line, 4, { glow: 0.7 });
  // signs on the two sides of the axis
  const sa = inv(24.4, 24.7, t);
  mtex(x, '+', SX(c, 1.72), SY(c, 0.9), 64, { align: 'center', color: C.blue, alpha: sa });
  mtex(x, '−', SX(c, 0.5), SY(c, -0.38), 64, { align: 'center', color: C.coral, alpha: sa });
  if (t >= IG.scan[0]) {
    const X = SX(c, xs);
    line(x, X, SY(c, 0), X, SY(c, fI(xs)), C.yellow, 2.5, { glow: 0.6 });
    ball(x, X, SY(c, 0), 13);
  }
  // right column
  const RX = 1360;
  mshow(x, t, 'f(x) = x^{2} - 1', RX, 220, 56, 24.15);
  const sa2 = inv(24.3, 24.6, t) * (1 - inv(IG.fade[0], IG.fade[1], t));
  if (sa2 > 0) {
    mtex(x, M`Σ f(x_{i})\,\Delta x`, RX, 330, 48, { alpha: sa2 });
    tag(x, `n = ${R.n}`, RX, 400, { mono: true, size: 22, alpha: sa2, color: C.yellow });
    tag(x, `Δx = ${(2 / R.n).toFixed(R.n > 16 ? 4 : 3)}`, RX + 150, 400, { mono: true, size: 22, alpha: sa2, color: rgba(C.line, 0.8) });
    tag(x, `= ${R.sum.toFixed(4)}`, RX, 460, { mono: true, size: 40, w: 600, alpha: sa2, color: C.line });
    chip(x, '+ ABOVE AXIS', RX, 530, C.blue, sa2); chip(x, '− BELOW AXIS', RX + 175, 530, C.coral, sa2);
    cnTag(x, '矩形越细，和越接近 2/3', RX, 590, { alpha: sa2 * inv(26.1, 26.4, t), size: 22 });
  }
  if (t >= IG.scan[0]) {
    const a = inv(IG.scan[0], IG.scan[0] + 0.2, t) * (1 - inv(IG.result - 0.12, IG.result, t));
    mtex(x, M`\int_{0}^{x}(t^{2} - 1)\,dt = ${FI(xs) < 0 ? '-' : ''}${Math.abs(FI(xs)).toFixed(3)}`, RX, 360, 44, { alpha: a, color: FI(xs) < 0 ? C.coral : C.line });
  }
  mshow(x, t, M`\int_{0}^{2}(x^{2} - 1)\,dx = \frac{2}{3}`, RX, 360, 52, IG.result);
  mshow(x, t, M`= \c{coral}{-\frac{2}{3}} + \c{blue}{\frac{4}{3}}`, RX + 60, 470, 46, IG.result + 0.15);
  const na = inv(IG.result + 0.25, IG.result + 0.45, t);
  if (na > 0) {
    chip(x, 'NET SIGNED AREA', RX, 560, C.yellow, na);
    cnTag(x, '定积分是带符号的净积累', RX, 616, { alpha: na, size: 22, color: rgba(C.line, 0.9) });
    cnTag(x, '几何总面积 = 2/3 + 4/3 = 2，不是积分值', RX, 652, { alpha: na * 0.75, size: 19 });
  }
}
