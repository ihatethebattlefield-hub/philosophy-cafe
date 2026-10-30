'use strict';
/*
 * FUNCTIONS IN MOTION — shared library.
 * Everything here is stateless: drawing calls take the time they need as an
 * argument; the only module-level state is caches of pure data (text layouts).
 */
const W = 1920, H = 1080, FPS = 30, BEAT = 0.5, DURATION = 60;
const TAU = Math.PI * 2;
const C = {
  bg: '#0c0d11', panel: '#14161d', line: '#f3ece0', blue: '#3d7bff', coral: '#ff6b4a', yellow: '#ffd23f',
};
const SANS = 'Inter, sans-serif';
const MONO = '"JetBrains Mono", monospace';
const SERIF = 'FreeSerif, serif';
const CJK = '"WenQuanYi Zen Hei", sans-serif';
const font = (w, s, f = SANS) => `${w} ${s}px ${f}`;

// ------------------------------------------------------------------ math utils
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const inv = (a, b, v) => clamp((v - a) / (b - a));
const mod = (a, n) => ((a % n) + n) % n;
const smooth = x => x * x * (3 - 2 * x);
const E = {
  linear: x => x,
  inQuad: x => x * x,
  outQuad: x => 1 - (1 - x) * (1 - x),
  inCubic: x => x * x * x,
  outCubic: x => 1 - Math.pow(1 - x, 3),
  inOutCubic: x => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2,
  inOutQuart: x => x < 0.5 ? 8 * x ** 4 : 1 - Math.pow(-2 * x + 2, 4) / 2,
  outQuart: x => 1 - Math.pow(1 - x, 4),
  outQuint: x => 1 - Math.pow(1 - x, 5),
  inOutSine: x => -(Math.cos(Math.PI * x) - 1) / 2,
  outExpo: x => x >= 1 ? 1 : 1 - Math.pow(2, -10 * x),
  inExpo: x => x <= 0 ? 0 : Math.pow(2, 10 * x - 10),
  outBack: (x, s = 1.70158) => 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2),
  inOutBack: (x, s = 1.70158 * 1.525) => x < 0.5
    ? (Math.pow(2 * x, 2) * ((s + 1) * 2 * x - s)) / 2
    : (Math.pow(2 * x - 2, 2) * ((s + 1) * (x * 2 - 2) + s) + 2) / 2,
  outElastic: x => x <= 0 ? 0 : x >= 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * TAU / 3) + 1,
};
// damped spring settling from 0 to 1 (overshoot then rest) — for labels that follow
const spring = (x, zeta = 0.45, w = 14) => x <= 0 ? 0 : 1 - Math.exp(-zeta * w * x) * Math.cos(w * Math.sqrt(1 - zeta * zeta) * x);

// Piecewise keyframes: keys = [[t, v], ...]; ease applies per segment.
function kf(t, keys, ease = E.inOutCubic) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const [t0, v0] = keys[i - 1], [t1, v1] = keys[i];
      return lerp(v0, v1, ease((t - t0) / (t1 - t0)));
    }
  }
  return keys[keys.length - 1][1];
}
function hash(n) {
  n = Math.imul((n | 0) ^ 0x27d4eb2d, 0x9e3779b1);
  n ^= n >>> 15; n = Math.imul(n, 0x85ebca77);
  n ^= n >>> 13; n = Math.imul(n, 0xc2b2ae3d);
  n ^= n >>> 16;
  return (n >>> 0) / 4294967296;
}
const hash2 = (a, b) => hash(Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263));
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
function rgba(h, a) { const [r, g, b] = hexRgb(h); return `rgba(${r},${g},${b},${a})`; }
function mix(a, b, t) {
  const A = hexRgb(a), B = hexRgb(b);
  const c = A.map((v, i) => Math.round(lerp(v, B[i], clamp(t))));
  return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
}
function buf(w = W, h = H) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return { c, x: c.getContext('2d') };
}
function bg(x, color = C.bg) { x.fillStyle = color; x.fillRect(0, 0, W, H); }
// Visibility of something that fades in over [a, a+fi] and out over [b, b+fo].
const vis = (t, a, b = Infinity, fi = 0.25, fo = 0.25) => Math.min(inv(a, a + fi, t), 1 - inv(b, b + fo, t));

// ------------------------------------------------------------------- cameras
// A camera maps world (x, y) to screen; sy (optional) gives a separate vertical
// scale, used only where an axis is explicitly labelled with its own ticks.
const cam = (ox, oy, s, sy) => ({ ox, oy, s, sy: sy ?? s });
const SX = (c, x) => c.ox + x * c.s;
const SY = (c, y) => c.oy - y * c.sy;
function camLerp(a, b, e) {
  return { ox: lerp(a.ox, b.ox, e), oy: lerp(a.oy, b.oy, e), s: a.s * Math.pow(b.s / a.s, e), sy: a.sy * Math.pow(b.sy / a.sy, e) };
}
// Camera that puts world point (fx, fy) at screen point (px, py).
const camFocus = (fx, fy, px, py, s) => cam(px - fx * s, py + fy * s, s);

// Graph of y = f(x) on [xa, xb]. The path is broken wherever f is undefined
// (non-finite) and across every x in `breaks` (asymptotes), so no segment ever
// bridges a hole in the domain. Steps are ~1.5 px on screen.
function plotPath(c, f, xa, xb, o = {}) {
  const p = new Path2D();
  const n = Math.max(2, Math.ceil(Math.abs(xb - xa) * c.s / (o.px || 1.5)));
  const breaks = o.breaks || [];
  let pen = false, prev = null;
  for (let i = 0; i <= n; i++) {
    const xv = lerp(xa, xb, i / n), yv = f(xv);
    if (!Number.isFinite(yv)) { pen = false; prev = xv; continue; }
    if (pen && prev !== null && breaks.some(b => (prev - b) * (xv - b) <= 0)) pen = false;
    const sx = SX(c, xv), sy = clamp(SY(c, yv), -600, H + 600);
    if (pen) p.lineTo(sx, sy); else { p.moveTo(sx, sy); pen = true; }
    prev = xv;
  }
  return p;
}
// Polyline through screen points [[x, y], ...]; `close` joins the ends.
function polyPath(pts, close = false, from = 0, to = pts.length) {
  const p = new Path2D();
  for (let i = from; i < to; i++) i === from ? p.moveTo(pts[i][0], pts[i][1]) : p.lineTo(pts[i][0], pts[i][1]);
  if (close) p.closePath();
  return p;
}
// Stroke with an optional additive glow underlay.
function stroke(x, path, color, w = 3, o = {}) {
  const a = (o.alpha ?? 1) * x.globalAlpha;
  if (a <= 0.002) return;
  x.save();
  x.lineCap = o.cap || 'round'; x.lineJoin = 'round';
  if (o.dash) x.setLineDash(o.dash);
  if (o.glow) {
    x.globalCompositeOperation = 'lighter'; x.strokeStyle = color;
    x.globalAlpha = 0.06 * o.glow * a; x.lineWidth = w * 7; x.stroke(path);
    x.globalAlpha = 0.16 * o.glow * a; x.lineWidth = w * 3; x.stroke(path);
    x.globalCompositeOperation = 'source-over';
  }
  x.globalAlpha = a; x.strokeStyle = color; x.lineWidth = w; x.stroke(path);
  x.restore();
}
function line(x, x0, y0, x1, y1, color, w = 1.5, o = {}) {
  const p = new Path2D(); p.moveTo(x0, y0); p.lineTo(x1, y1);
  stroke(x, p, color, w, o);
}
function dot(x, px, py, r, color, a = 1) {
  x.save(); x.globalAlpha *= a; x.fillStyle = color; x.beginPath(); x.arc(px, py, r, 0, TAU); x.fill(); x.restore();
}
function grid(x, c, x0, x1, y0, y1, step = 1, a = 0.07) {
  if (a <= 0) return;
  const p = new Path2D();
  for (let v = Math.ceil(x0 / step) * step; v <= x1 + 1e-9; v += step) { p.moveTo(SX(c, v), SY(c, y0)); p.lineTo(SX(c, v), SY(c, y1)); }
  for (let v = Math.ceil(y0 / step) * step; v <= y1 + 1e-9; v += step) { p.moveTo(SX(c, x0), SY(c, v)); p.lineTo(SX(c, x1), SY(c, v)); }
  x.save(); x.strokeStyle = rgba(C.line, a); x.lineWidth = 1; x.stroke(p); x.restore();
}
// Axes with arrowheads, integer ticks and labels. o.xs / o.ys: tick steps.
function axes(x, c, x0, x1, y0, y1, o = {}) {
  const a = (o.alpha ?? 1) * x.globalAlpha;
  if (a <= 0) return;
  x.save();
  x.globalAlpha = a;
  const col = rgba(C.line, 0.75);
  const ax = clamp(0, x0, x1), ay = clamp(0, y0, y1);
  line(x, SX(c, x0), SY(c, ay), SX(c, x1), SY(c, ay), col, 1.5);
  line(x, SX(c, ax), SY(c, y0), SX(c, ax), SY(c, y1), col, 1.5);
  x.fillStyle = col;
  const arrow = (px, py, ang) => {
    x.save(); x.translate(px, py); x.rotate(ang);
    x.beginPath(); x.moveTo(0, 0); x.lineTo(-11, -5); x.lineTo(-11, 5); x.closePath(); x.fill(); x.restore();
  };
  if (o.arrows !== false) { arrow(SX(c, x1), SY(c, ay), 0); arrow(SX(c, ax), SY(c, y1), -Math.PI / 2); }
  const xs = o.xs ?? 1, ys = o.ys ?? 1;
  x.font = font(400, 15, MONO); x.fillStyle = rgba(C.line, 0.5);
  if (o.ticks !== false) {
    const tp = new Path2D();
    x.textAlign = 'center'; x.textBaseline = 'top';
    for (let v = Math.ceil(x0 / xs) * xs; v <= x1 - xs * 0.3; v += xs) {
      if (Math.abs(v) < 1e-9) continue;
      tp.moveTo(SX(c, v), SY(c, ay) - 5); tp.lineTo(SX(c, v), SY(c, ay) + 5);
      if (o.labels !== false) x.fillText(fmtTick(v), SX(c, v), SY(c, ay) + 9);
    }
    x.textAlign = 'right'; x.textBaseline = 'middle';
    for (let v = Math.ceil(y0 / ys) * ys; v <= y1 - ys * 0.3; v += ys) {
      if (Math.abs(v) < 1e-9) continue;
      tp.moveTo(SX(c, ax) - 5, SY(c, v)); tp.lineTo(SX(c, ax) + 5, SY(c, v));
      if (o.labels !== false) x.fillText(fmtTick(v), SX(c, ax) - 10, SY(c, v));
    }
    x.strokeStyle = col; x.lineWidth = 1.5; x.stroke(tp);
  }
  if (o.names !== false) {
    x.font = `italic 24px ${SERIF}`; x.fillStyle = rgba(C.line, 0.7); x.textBaseline = 'alphabetic';
    x.textAlign = 'right'; x.fillText(o.xn || 'x', SX(c, x1) - 4, SY(c, ay) - 14);
    x.textAlign = 'left'; x.fillText(o.yn || 'y', SX(c, ax) + 14, SY(c, y1) + 18);
  }
  x.restore();
}
const fmtTick = v => Math.abs(v - Math.round(v)) < 1e-6 ? String(Math.round(v)).replace('-', '−') : v.toFixed(1).replace('-', '−');
const fmt = (v, d = 2) => (v < 0 ? '−' : '') + Math.abs(v).toFixed(d);

// ---------------------------------------------------------------------- ball
// The protagonist. (px, py) is its centre in screen pixels. Squash is applied
// along the contact normal (o.nrm, radians); stretch along o.vel.
function ball(x, px, py, R, o = {}) {
  const a = (o.alpha ?? 1) * x.globalAlpha;
  if (a <= 0 || R <= 0) return;
  x.save();
  x.globalAlpha = a;
  if (o.glow !== 0) {
    const g = x.createRadialGradient(px, py, R * 0.5, px, py, R * 3.2);
    g.addColorStop(0, rgba(C.coral, 0.32 * (o.glow ?? 1))); g.addColorStop(1, rgba(C.coral, 0));
    x.fillStyle = g; x.fillRect(px - R * 3.2, py - R * 3.2, R * 6.4, R * 6.4);
  }
  x.translate(px, py);
  let ra = R, rb = R, ang = 0;
  if (o.sq > 0) { ang = (o.nrm ?? -Math.PI / 2) + Math.PI / 2; ra = R * (1 + 0.85 * o.sq); rb = R * (1 - o.sq); }
  else if (o.st > 0) { ang = o.vel ?? 0; ra = R * (1 + o.st); rb = R / (1 + o.st); }
  const g = x.createRadialGradient(-R * 0.35, -R * 0.4, R * 0.08, 0, 0, R * 1.15);
  g.addColorStop(0, '#ffd2c2'); g.addColorStop(0.45, C.coral); g.addColorStop(1, '#c9452c');
  x.rotate(ang);
  x.beginPath(); x.ellipse(0, 0, ra, rb, 0, 0, TAU);
  x.fillStyle = g; x.fill();
  if (o.roll !== undefined) { // a small mark that shows rotation while rolling
    x.rotate(o.roll - ang);
    x.strokeStyle = 'rgba(255,255,255,0.55)'; x.lineWidth = Math.max(1.5, R * 0.12);
    x.beginPath(); x.arc(0, 0, R * 0.62, -0.5, 0.5); x.stroke();
  }
  x.restore();
  if (o.ring > 0) { // handle ring when the ball acts as a control
    x.save(); x.globalAlpha = a * o.ring;
    x.strokeStyle = C.coral; x.lineWidth = 2;
    x.beginPath(); x.arc(px, py, R + 9 + 3 * (o.ringPulse || 0), 0, TAU); x.stroke();
    x.setLineDash([3, 5]); x.beginPath(); x.arc(px, py, R + 20, 0, TAU); x.stroke();
    x.restore();
  }
}

// ---------------------------------------------------------------- math text
// A small TeX-like layout engine so formulas set properly (italic variables,
// upright digits and function names, real super/subscripts, stacked fractions,
// radicals, big integral signs) instead of plain strings.
//   x^{2}  x_{0}  \frac{a}{b}  \sqrt{x}  \int_{0}^{2}  \sin  \log  \lim
//   \c{blue}{...} colour  \g{key}{...} named group  \t{text} upright sans
//   \,  thin space   \  word space   - minus   * centred dot   ' prime
const MCOL = { w: C.line, blue: C.blue, coral: C.coral, yellow: C.yellow, dim: 'rgba(243,236,224,0.45)', mid: 'rgba(243,236,224,0.7)' };
const MFN = new Set(['sin', 'cos', 'tan', 'log', 'ln', 'lim', 'undefined']);
const MSYM = { cdot: '·', to: '→', circ: '∘', ne: '≠', approx: '≈', infty: '∞', theta: 'θ', pi: 'π', Delta: 'Δ', in: '∈',
  mapsto: '↦', ge: '≥', le: '≤', phi: 'φ', omega: 'ω', pm: '±', times: '×', ldots: '…' };
const MREL = new Set(['=', '→', '≈', '≠', '↦', '≥', '≤', '<', '>', '∈', '⇔']);
const MBIN = new Set(['+', '−', '·', '∘', '±', '×']);
function mparse(s) {
  let i = 0;
  const raw = () => {
    if (s[i] === '{') { const j = s.indexOf('}', i); const r = s.slice(i + 1, j); i = j + 1; return r; }
    return s[i++];
  };
  const arg = () => { if (s[i] === '{') { i++; const g = group(); i++; return g; } return atom(); };
  function atom() {
    const ch = s[i];
    if (ch === '\\') {
      let j = i + 1;
      while (j < s.length && /[a-zA-Z]/.test(s[j])) j++;
      if (j === i + 1) { const e = s[i + 1]; i += 2; return [e === ',' ? { k: 'sp', w: 0.17 } : e === ' ' ? { k: 'sp', w: 0.3 } : { k: 'ch', c: e, st: 'rm' }]; }
      const name = s.slice(i + 1, j); i = j;
      if (name === 'frac') { const a = arg(), b = arg(); return [{ k: 'frac', a, b }]; }
      if (name === 'sqrt') return [{ k: 'sqrt', a: arg() }];
      if (name === 'c') { const key = raw(); return [{ k: 'col', key, a: arg() }]; }
      if (name === 'g') { const key = raw(); return [{ k: 'grp', key, a: arg() }]; }
      if (name === 't') return [{ k: 'text', s: raw() }];
      if (name === 'int') return [{ k: 'big', c: '∫' }];
      if (name === 'quad') return [{ k: 'sp', w: 1 }];
      if (MFN.has(name)) return [{ k: 'fn', s: name }];
      if (MSYM[name]) { const c = MSYM[name]; return [{ k: 'ch', c, st: /[θπφω]/.test(c) ? 'it' : 'rm' }]; }
      return [{ k: 'ch', c: name, st: 'rm' }];
    }
    i++;
    if (ch === '^' || ch === '_') return [{ k: ch === '^' ? 'sup' : 'sub', a: arg() }];
    if (ch === ' ') return [];
    if (ch === '-') return [{ k: 'ch', c: '−', st: 'rm' }];
    if (ch === '*') return [{ k: 'ch', c: '·', st: 'rm' }];
    if (ch === "'") return [{ k: 'ch', c: '′', st: 'rm', prime: true }];
    if (/[a-zA-Zθφπαβωδ]/.test(ch)) return [{ k: 'ch', c: ch, st: 'it' }];
    return [{ k: 'ch', c: ch, st: 'rm' }];
  }
  function group() { const out = []; while (i < s.length && s[i] !== '}') out.push(...atom()); return out; }
  return group();
}
const MM = buf(8, 8).x;
function mfont(st, px) {
  if (st === 'it') return `italic ${px}px ${SERIF}`;
  if (st === 'text') return `500 ${px}px ${SANS}`;
  return `${px}px ${SERIF}`;
}
function mwidth(st, px, c) { MM.font = mfont(st, px); return MM.measureText(c).width; }
// Lays out nodes at font size `sz`; returns items relative to the baseline.
function mbox(nodes, sz, color, key) {
  const items = [];
  let xc = 0, asc = sz * 0.72, desc = sz * 0.22;
  let prevKind = 'start', lastBox = null, script = null;
  const push = (it) => { items.push(it); };
  const absorb = (b, dx, dy) => {
    for (const it of b.items) push({ ...it, x: it.x + dx, y: it.y + dy });
    asc = Math.max(asc, b.asc - dy); desc = Math.max(desc, b.desc + dy);
  };
  for (let n = 0; n < nodes.length; n++) {
    const nd = nodes[n];
    if (nd.k === 'sub' && lastBox && lastBox.lim) { // limits set centred under "lim"
      const b = mbox(nd.a, sz * 0.6, color, key), x0 = lastBox.x + (lastBox.w - b.w) / 2;
      absorb(b, x0, sz * 0.36 + b.asc);
      xc = Math.max(xc, x0 + b.w) + sz * 0.12; lastBox = null; prevKind = 'script';
      continue;
    }
    if (nd.k === 'sup' || nd.k === 'sub') {
      const big = lastBox && lastBox.big;
      const b = mbox(nd.a, sz * (big ? 0.6 : 0.66), color, key);
      const dy = nd.k === 'sup' ? (big ? -sz * 0.92 : -sz * 0.4) : (big ? sz * 0.5 : sz * 0.2);
      let x0 = xc + (big ? (nd.k === 'sup' ? sz * 0.16 : -sz * 0.06) : nd.k === 'sub' && lastBox && lastBox.it ? -sz * 0.04 : sz * 0.02);
      const isBig = big || (script && script.big);
      if (script && script.kind !== nd.k) x0 = script.x + (isBig ? (nd.k === 'sup' ? sz * 0.22 : -sz * 0.04) : 0); // stack ^ and _
      absorb(b, x0, dy);
      if (script && script.kind !== nd.k) { xc = Math.max(script.end, x0 + b.w) + (isBig ? sz * 0.16 : 0); script = null; }
      else { script = { kind: nd.k, x: x0, end: x0 + b.w, big }; xc = x0 + b.w + (big ? sz * 0.12 : 0); }
      prevKind = 'script';
      continue;
    }
    script = null;
    if (nd.k === 'sp') { xc += nd.w * sz; prevKind = 'sp'; continue; }
    if (nd.k === 'col') { const b = mbox(nd.a, sz, MCOL[nd.key] || nd.key, key); absorb(b, xc, 0); xc += b.w; lastBox = null; prevKind = 'atom'; continue; }
    if (nd.k === 'grp') { const b = mbox(nd.a, sz, color, nd.key); absorb(b, xc, 0); xc += b.w; lastBox = null; prevKind = 'atom'; continue; }
    if (nd.k === 'frac') {
      const fs = sz * 0.8, a = mbox(nd.a, fs, color, key), b = mbox(nd.b, fs, color, key);
      const w = Math.max(a.w, b.w) + sz * 0.16, axis = sz * 0.27, x0 = xc + sz * 0.06;
      absorb(a, x0 + (w - a.w) / 2, -axis - sz * 0.1 - a.desc);
      absorb(b, x0 + (w - b.w) / 2, -axis + sz * 0.12 + b.asc);
      push({ k: 'rule', x: x0, y: -axis, w, h: Math.max(1.2, sz * 0.05), color, key });
      xc = x0 + w + sz * 0.06; lastBox = null; prevKind = 'atom'; continue;
    }
    if (nd.k === 'sqrt') {
      const b = mbox(nd.a, sz, color, key), x0 = xc, top = -(b.asc + sz * 0.1);
      push({ k: 'path', pts: [[x0, -sz * 0.3], [x0 + sz * 0.1, -sz * 0.36], [x0 + sz * 0.23, sz * 0.12], [x0 + sz * 0.42, top], [x0 + sz * 0.5 + b.w + sz * 0.04, top]], lw: Math.max(1.2, sz * 0.045), color, key });
      absorb(b, x0 + sz * 0.5, 0);
      asc = Math.max(asc, -top + sz * 0.06);
      xc = x0 + sz * 0.5 + b.w + sz * 0.08; lastBox = null; prevKind = 'atom'; continue;
    }
    if (nd.k === 'big') {
      const bs = sz * 1.5, w = mwidth('rm', bs, nd.c);
      push({ k: 'g', c: nd.c, st: 'rm', px: bs, x: xc, y: sz * 0.32, color, key });
      lastBox = { big: true }; xc += w * 0.75; asc = Math.max(asc, sz * 1.0); desc = Math.max(desc, sz * 0.45);
      prevKind = 'atom'; continue;
    }
    if (nd.k === 'text') {
      const ts = sz * 0.62, w = mwidth('text', ts, nd.s);
      push({ k: 'g', c: nd.s, st: 'text', px: ts, x: xc, y: 0, color, key });
      xc += w; lastBox = null; prevKind = 'atom'; continue;
    }
    if (nd.k === 'fn') {
      if (prevKind === 'atom' || prevKind === 'script') xc += sz * 0.12;
      const w = mwidth('rm', sz, nd.s), x0 = xc;
      push({ k: 'g', c: nd.s, st: 'rm', px: sz, x: xc, y: 0, color, key });
      xc += w;
      const nx = nodes[n + 1];
      if (nx && !(nx.k === 'ch' && '(['.includes(nx.c)) && nx.k !== 'sub' && nx.k !== 'sup') xc += sz * 0.14;
      lastBox = nd.s === 'lim' ? { lim: true, x: x0, w } : null; prevKind = 'fn'; continue;
    }
    // single character
    const c = nd.c, rel = MREL.has(c), bin = MBIN.has(c);
    const unary = bin && (prevKind === 'start' || prevKind === 'op' || prevKind === 'open');
    let pad = 0;
    if (rel) pad = sz * 0.26; else if (bin && !unary) pad = sz * 0.2;
    if (c === ',') pad = 0;
    xc += pad;
    if (nd.st === 'it' && (prevKind === 'atom' || prevKind === 'script') && items.length && items[items.length - 1].st === 'rm' && /[)\]|]/.test(items[items.length - 1].c)) xc += sz * 0.03;
    const w = mwidth(nd.st, sz, c);
    push({ k: 'g', c, st: nd.st, px: sz, x: xc, y: 0, color, key });
    xc += w + pad + (nd.st === 'it' ? sz * 0.02 : 0) + (c === ',' ? sz * 0.22 : 0);
    lastBox = { it: nd.st === 'it' };
    prevKind = rel || (bin && !unary) ? 'op' : c === '(' || c === '[' ? 'open' : 'atom';
  }
  return { items, w: xc, asc, desc };
}
const MCACHE = new Map();
function mlayout(src, sz) {
  const k = sz + '|' + src;
  let L = MCACHE.get(k);
  if (!L) {
    if (MCACHE.size > 2000) MCACHE.clear();
    L = mbox(mparse(src), sz, C.line, null);
    MCACHE.set(k, L);
  }
  return L;
}
// Draws a formula. o.reveal (0..1) types it in glyph by glyph; o.alpha fades;
// o.hide (Set of group keys) skips groups; o.scale = {key: s} scales a group
// about its own centre; o.tint = {key: colour}. Returns screen boxes per group.
function mtex(x, src, px, py, sz, o = {}) {
  const L = mlayout(src, sz);
  const ox = o.align === 'center' ? px - L.w / 2 : o.align === 'right' ? px - L.w : px;
  const a = (o.alpha ?? 1) * x.globalAlpha, rv = o.reveal ?? 1, n = L.items.length;
  const boxes = {};
  for (const it of L.items) {
    if (!it.key) continue;
    const w = it.k === 'g' ? mwidth(it.st, it.px, it.c) : it.w || 0;
    const b = boxes[it.key] || (boxes[it.key] = { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity });
    b.x0 = Math.min(b.x0, ox + it.x); b.x1 = Math.max(b.x1, ox + it.x + w);
    b.y0 = Math.min(b.y0, py + it.y - sz * 0.7); b.y1 = Math.max(b.y1, py + it.y + sz * 0.2);
  }
  for (const k in boxes) { const b = boxes[k]; b.cx = (b.x0 + b.x1) / 2; b.cy = (b.y0 + b.y1) / 2; }
  if (a <= 0.002) return { boxes, w: L.w, x0: ox };
  x.save();
  x.textBaseline = 'alphabetic'; x.textAlign = 'left';
  L.items.forEach((it, idx) => {
    if (o.hide && it.key && o.hide.has(it.key)) return;
    const s0 = n > 1 ? 0.55 * idx / (n - 1) : 0, q = rv >= 1 ? 1 : clamp((rv - s0) / 0.45);
    if (q <= 0) return;
    const col = (o.tint && it.key && o.tint[it.key]) || (it.color === C.line && o.color ? o.color : it.color);
    x.globalAlpha = a * q;
    const dy = (1 - E.outCubic(q)) * sz * 0.35;
    x.save();
    let gx = ox + it.x, gy = py + it.y + dy;
    const sc = o.scale && it.key && o.scale[it.key];
    if (sc && sc !== 1) { const b = boxes[it.key]; x.translate(b.cx, b.cy); x.scale(sc, sc); x.translate(-b.cx, -b.cy); }
    if (it.k === 'g') { x.font = mfont(it.st, it.px); x.fillStyle = col; x.fillText(it.c, gx, gy); }
    else if (it.k === 'rule') { x.fillStyle = col; x.fillRect(gx, gy - it.h / 2, it.w, it.h); }
    else if (it.k === 'path') {
      x.strokeStyle = col; x.lineWidth = it.lw; x.lineJoin = 'round'; x.lineCap = 'round'; x.beginPath();
      it.pts.forEach((p, k) => k ? x.lineTo(ox + p[0], py + p[1] + dy) : x.moveTo(ox + p[0], py + p[1] + dy)); x.stroke();
    }
    x.restore();
  });
  x.restore();
  return { boxes, w: L.w, x0: ox };
}
// A formula that types in at t0 and fades out at t1.
function mshow(x, t, src, px, py, sz, t0, t1 = Infinity, o = {}) {
  if (t < t0 || t > t1 + 0.3) return null;
  return mtex(x, src, px, py, sz, { ...o, reveal: E.outCubic(inv(t0, t0 + (o.dur ?? 0.35), t)), alpha: (o.alpha ?? 1) * (1 - inv(t1, t1 + 0.25, t)) });
}
// Small sans caption / tag.
function tag(x, s, px, py, o = {}) {
  x.save();
  x.globalAlpha *= o.alpha ?? 1;
  x.font = font(o.w ?? 600, o.size ?? 16, o.mono ? MONO : SANS);
  if (o.ls) x.letterSpacing = o.ls;
  x.textAlign = o.align || 'left'; x.textBaseline = 'alphabetic';
  x.fillStyle = o.color || rgba(C.line, 0.7);
  x.fillText(s, px, py);
  x.restore();
}
function cnTag(x, s, px, py, o = {}) {
  x.save(); x.globalAlpha *= o.alpha ?? 1; x.font = `400 ${o.size ?? 20}px ${CJK}`;
  x.textAlign = o.align || 'left'; x.fillStyle = o.color || rgba(C.line, 0.6); x.fillText(s, px, py); x.restore();
}
// Pill-shaped label: "RECIPROCAL" style chips.
function chip(x, s, px, py, color, a = 1, o = {}) {
  if (a <= 0) return;
  x.save(); x.globalAlpha *= a;
  x.font = font(700, o.size ?? 15, SANS); x.letterSpacing = '2px';
  const w = x.measureText(s).width + 26;
  const ax = o.align === 'center' ? px - w / 2 : o.align === 'right' ? px - w : px;
  x.beginPath(); x.roundRect(ax, py - 15, w, 30, 15); x.fillStyle = rgba(color, 0.14); x.fill();
  x.strokeStyle = rgba(color, 0.7); x.lineWidth = 1.2; x.stroke();
  x.fillStyle = color; x.textBaseline = 'middle'; x.textAlign = 'left'; x.fillText(s, ax + 13, py + 1);
  x.restore();
  return w;
}

// -------------------------------------------------------------- HUD + grain
function chapterAt(t) { return TL.chapters.findIndex(c => t >= c.t0 && t < c.t1); }
function drawHUD(x, t) {
  const ci = chapterAt(t);
  if (ci < 0 || ci >= 14) return;
  const ch = TL.chapters[ci], lt = t - ch.t0;
  const a = ci === 0 ? inv(0.2, 0.6, t) : 1;
  x.save();
  x.globalAlpha = a;
  x.textBaseline = 'alphabetic';
  tag(x, String(ci + 1).padStart(2, '0'), 64, 76, { mono: true, size: 18, w: 600, color: rgba(C.line, 0.9) });
  x.fillStyle = C.coral; x.fillRect(64, 88, 24, 2);
  const e = E.outCubic(inv(0, 0.3, lt));
  x.save(); x.beginPath(); x.rect(100, 40, 900, 60); x.clip();
  x.translate(0, (1 - e) * 26); x.globalAlpha = a * e;
  x.font = font(600, 22); x.fillStyle = rgba(C.line, 0.92); x.textAlign = 'left';
  x.fillText(ch.en, 104, 76);
  const tw = x.measureText(ch.en).width;
  x.font = `400 19px ${CJK}`; x.fillStyle = rgba(C.line, 0.5); x.fillText(ch.cn, 104 + tw + 16, 75);
  x.restore();
  tag(x, 'FUNCTIONS IN MOTION', W - 64, 76, { align: 'right', size: 14, w: 600, ls: '3px', color: rgba(C.line, 0.55) });
  const f = Math.round(t * FPS);
  tag(x, `${String(Math.floor(f / FPS)).padStart(2, '0')}:${String(f % FPS).padStart(2, '0')}`, W - 64, H - 58, { align: 'right', mono: true, size: 15, color: rgba(C.line, 0.45) });
  const beat = Math.floor(t / BEAT + 1e-6) % 4, bp = Math.exp(-mod(t, BEAT) * 9);
  for (let b = 0; b < 4; b++) {
    const on = b === beat;
    x.fillStyle = on ? C.coral : rgba(C.line, 0.22);
    const r = on ? 4 + 2 * bp : 3.5;
    x.beginPath(); x.arc(64 + b * 16, H - 63, r, 0, TAU); x.fill();
  }
  tag(x, '120 BPM', 140, H - 58, { mono: true, size: 13, color: rgba(C.line, 0.4) });
  x.fillStyle = rgba(C.line, 0.08); x.fillRect(0, H - 3, W, 3);
  x.fillStyle = rgba(C.coral, 0.8); x.fillRect(0, H - 3, W * clamp(t / 57.5), 3);
  x.restore();
}
let GRAIN = null;
function initGrain() {
  GRAIN = [];
  const r = rng(5);
  for (let k = 0; k < 4; k++) {
    const b = buf(960, 540), img = b.x.createImageData(960, 540);
    for (let i = 0; i < img.data.length; i += 4) { const v = r() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
    b.x.putImageData(img, 0, 0); GRAIN.push(b.c);
  }
  const v = buf();
  const g = v.x.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, H * 1.05);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.5)');
  v.x.fillStyle = g; v.x.fillRect(0, 0, W, H);
  GRAIN.vig = v.c;
}
function drawGrain(x, t) {
  x.save();
  x.globalCompositeOperation = 'overlay'; x.globalAlpha = 0.045;
  x.drawImage(GRAIN[Math.round(t * FPS) % 4], 0, 0, W, H);
  x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
  x.drawImage(GRAIN.vig, 0, 0);
  x.restore();
}
