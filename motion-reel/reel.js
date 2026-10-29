'use strict';
/*
 * MOTION — a 30 s motion-design reel.
 *
 * Contract: renderFrame(t) paints the whole frame from the time t alone.
 * There is no simulation state carried between frames; everything random is
 * hashed from indices or drawn from a seeded PRNG once at start-up, so any
 * frame can be rendered in any order, by any number of workers.
 *
 * Timeline (120 BPM → 1 beat = 0.5 s, 1 bar = 2 s = one segment):
 *   0–24 s   12 technique segments, one bar each
 *   24–25.5  supercut (cuts on 8ths → 16ths → sextuplets)
 *   25.5–26  one beat of silence: the opening ball falls again
 *   26–30    hit → logo; the ball lands as the full stop
 */

const W = 1920, H = 1080, FPS = 30, BEAT = 0.5, SEG = 2, DURATION = 30;
const TAU = Math.PI * 2;
const COL = {
  ink: '#0b0b0f', ink2: '#15151c', paper: '#f1ede4', accent: '#ff4b2b',
  yellow: '#ffc53d', blue: '#3d6bff', mint: '#35e0b0', pink: '#ff3d8b', red: '#e8321e',
};
const SANS = 'Inter, "Liberation Sans", sans-serif';
const MONO = '"JetBrains Mono", "DejaVu Sans Mono", monospace';
const SERIF = '"Liberation Serif", serif';
const CJK = '"WenQuanYi Zen Hei", sans-serif';
const font = (w, s, f = SANS) => `${w} ${s}px ${f}`;

// ---------------------------------------------------------------- helpers
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const inv = (a, b, v) => clamp((v - a) / (b - a));
const mod = (a, n) => ((a % n) + n) % n;
const E = {
  inQuad: x => x * x,
  outQuad: x => 1 - (1 - x) * (1 - x),
  inCubic: x => x * x * x,
  outCubic: x => 1 - Math.pow(1 - x, 3),
  inOutCubic: x => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2,
  outQuart: x => 1 - Math.pow(1 - x, 4),
  inOutQuart: x => x < 0.5 ? 8 * x ** 4 : 1 - Math.pow(-2 * x + 2, 4) / 2,
  inExpo: x => x <= 0 ? 0 : Math.pow(2, 10 * x - 10),
  outExpo: x => x >= 1 ? 1 : 1 - Math.pow(2, -10 * x),
  inOutSine: x => -(Math.cos(Math.PI * x) - 1) / 2,
  outBack: (x, s = 1.70158) => 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2),
  outElastic: x => x <= 0 ? 0 : x >= 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * TAU / 3) + 1,
};
function hash(n) {
  n = Math.imul((n | 0) ^ 0x27d4eb2d, 0x9e3779b1);
  n ^= n >>> 15; n = Math.imul(n, 0x85ebca77);
  n ^= n >>> 13; n = Math.imul(n, 0xc2b2ae3d);
  n ^= n >>> 16;
  return (n >>> 0) / 4294967296;
}
const hash2 = (a, b) => hash(Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263));
const hash3 = (a, b, c) => hash(Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) + Math.imul(c | 0, 2147483647));
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
function noise1(x, seed = 0) {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return lerp(hash2(i, seed), hash2(i + 1, seed), u);
}
function hexToRgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
function mixHex(a, b, t) {
  const A = hexToRgb(a), B = hexToRgb(b);
  return `rgb(${Math.round(lerp(A[0], B[0], t))},${Math.round(lerp(A[1], B[1], t))},${Math.round(lerp(A[2], B[2], t))})`;
}
function buf(w = W, h = H) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return { c, x: c.getContext('2d') };
}
function bg(x, color) { x.fillStyle = color; x.fillRect(0, 0, W, H); }
function dotGrid(x, step, r, color) {
  x.fillStyle = color;
  x.beginPath();
  for (let y = step / 2; y < H; y += step) for (let xx = step / 2; xx < W; xx += step) x.rect(xx - r, y - r, r * 2, r * 2);
  x.fill();
}
function roundRect(x, px, py, w, h, r) { x.beginPath(); x.roundRect(px, py, w, h, r); }

const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
const bufA = buf(), bufB = buf(), bufT = buf(), bufR = buf();

// ======================================================= 01 bouncing ball
const BALL = { R: 70, floor: 830, x0: 470, x1: 1450, h: 470, c: 0.04 };
function ballState(lt) {
  const { R, floor, h, c } = BALL;
  const rest = floor - R, vx = (BALL.x1 - BALL.x0) / SEG;
  lt = Math.max(0, lt);
  const x = BALL.x0 + vx * lt;
  const ti = Math.max(0.5, Math.round(lt / BEAT) * BEAT), d = lt - ti;
  let y, vy, sq = 0;
  if (Math.abs(d) < c) { // floor contact: volume-preserving squash
    sq = 0.48 * (1 - (d / c) ** 2);
    y = floor - R * (1 - sq); vy = 0;
  } else if (lt < 0.5 - c) { // the drop-in
    const T = 0.5 - c, u = lt / T, y0 = -2.5 * R;
    y = y0 + (rest - y0) * u * u; vy = 2 * (rest - y0) * u / T;
  } else {
    const k = Math.floor((lt - 0.5) / BEAT), t0 = 0.5 + k * BEAT + c, T = BEAT - 2 * c;
    const u = (lt - t0) / T;
    y = rest - h * 4 * u * (1 - u); vy = -h * 4 * (1 - 2 * u) / T;
  }
  return { x, y, vx, vy, sq };
}
// Ellipse axes for a ball state: squash on contact, stretch along velocity.
function ballAxes(s, R, vmax = 4200) {
  if (s.sq > 0) return { a: R * (1 + s.sq * 0.85), b: R * (1 - s.sq), ang: 0 };
  const st = clamp(Math.hypot(s.vx, s.vy) / vmax) * 0.34;
  return { a: R * (1 + st), b: R / (1 + st), ang: Math.atan2(s.vy, s.vx) };
}
function drawBall(x, s, R, color, alpha = 1) {
  const { a, b, ang } = ballAxes(s, R);
  x.save();
  x.globalAlpha = alpha;
  x.translate(s.x, s.y);
  const g = x.createRadialGradient(-R * 0.35, -R * 0.4, R * 0.1, 0, 0, R * 1.2);
  g.addColorStop(0, mixHex(color, '#ffffff', 0.35));
  g.addColorStop(0.55, color);
  g.addColorStop(1, mixHex(color, '#000000', 0.25));
  x.rotate(ang);
  x.beginPath(); x.ellipse(0, 0, a, b, 0, 0, TAU);
  x.fillStyle = g; x.fill();
  x.restore();
}
function sBall(x, lt) {
  bg(x, COL.ink);
  x.font = font(900, 380); x.textAlign = 'center'; x.textBaseline = 'alphabetic';
  x.strokeStyle = 'rgba(241,237,228,0.05)'; x.lineWidth = 2;
  x.strokeText('BOUNCE', W / 2, 640);
  x.fillStyle = 'rgba(241,237,228,0.14)'; x.fillRect(0, BALL.floor, W, 2);
  // spacing chart: one dot per frame drawn so far
  const fNow = Math.floor(lt * FPS + 1e-6);
  x.fillStyle = 'rgba(241,237,228,0.28)';
  x.beginPath();
  for (let f = 0; f <= fNow; f++) { const s = ballState(f / FPS); x.rect(s.x - 2, s.y - 2, 4, 4); }
  x.fill();
  const s = ballState(lt), R = BALL.R;
  // contact shadow
  const hgt = clamp((BALL.floor - R - s.y) / 600);
  x.fillStyle = `rgba(0,0,0,${0.55 - hgt * 0.4})`;
  x.beginPath(); x.ellipse(s.x, BALL.floor + 6, R * (1.1 - hgt * 0.5) * (1 + s.sq), 12 * (1 - hgt * 0.6), 0, 0, TAU); x.fill();
  // onion skin
  for (let j = 5; j >= 1; j--) {
    const g = ballState(lt - j / FPS), ax = ballAxes(g, R);
    x.save(); x.translate(g.x, g.y); x.rotate(ax.ang);
    x.strokeStyle = `rgba(255,75,43,${0.32 * (1 - j / 6)})`; x.lineWidth = 2;
    x.beginPath(); x.ellipse(0, 0, ax.a, ax.b, 0, 0, TAU); x.stroke();
    x.restore();
  }
  drawBall(x, s, R, COL.accent);
  // live read-out
  const ax = ballAxes(s, R);
  const sx = s.sq > 0 ? ax.a / R : ax.b / R, sy = s.sq > 0 ? ax.b / R : ax.a / R;
  const lx = s.x + 120, ly = s.y - 110;
  x.strokeStyle = 'rgba(241,237,228,0.5)'; x.lineWidth = 1.5;
  x.beginPath(); x.moveTo(s.x + R * 0.7, s.y - R * 0.7); x.lineTo(lx - 8, ly + 8); x.lineTo(lx + 230, ly + 8); x.stroke();
  x.font = font(600, 22, MONO); x.textAlign = 'left';
  x.fillStyle = s.sq > 0.05 ? COL.accent : COL.paper;
  x.fillText(s.sq > 0.05 ? 'SQUASH' : 'STRETCH', lx, ly - 22);
  x.fillStyle = 'rgba(241,237,228,0.7)'; x.font = font(400, 20, MONO);
  x.fillText(`sx ${sx.toFixed(2)}  sy ${sy.toFixed(2)}`, lx, ly);
  x.font = font(400, 20, MONO); x.fillStyle = 'rgba(241,237,228,0.45)'; x.textAlign = 'center';
  x.fillText('area(sx · sy) = const   ·   contact = 3 frames   ·   every landing on the beat', W / 2, BALL.floor + 90);
}

// ===================================================== 02 kinetic typography
const TYPO = [
  { text: 'EVERY FRAME', y: 330, t0: 0.0, stagger: 0.025, mode: 'drop' },
  { text: 'IS A', y: 500, t0: 0.5, stagger: 0.05, mode: 'pop' },
  { text: 'FUNCTION', y: 680, t0: 1.0, stagger: 0.03, mode: 'weight' },
  { text: 'OF', y: 900, t0: 1.5, stagger: 0.06, mode: 'type' },
];
function letterLayout(x, text, cx) {
  const total = x.measureText(text).width, out = [];
  for (let i = 0; i < text.length; i++) {
    const pre = x.measureText(text.slice(0, i)).width, w = x.measureText(text[i]).width;
    out.push({ ch: text[i], x: cx - total / 2 + pre + w / 2, w });
  }
  return out;
}
function sTypo(x, lt) {
  bg(x, COL.ink);
  dotGrid(x, 60, 1.2, 'rgba(241,237,228,0.07)');
  const zoom = 1 + clamp(lt, 0, 2.5) * 0.025;
  x.save();
  x.translate(W / 2, 600); x.scale(zoom, zoom); x.translate(-W / 2, -600);
  x.textAlign = 'center'; x.textBaseline = 'alphabetic';
  for (let li = 0; li < TYPO.length; li++) {
    const L = TYPO[li];
    if (lt < L.t0) continue;
    x.font = font(900, 160);
    const ofT = L.mode === 'type';
    const lay = letterLayout(x, L.text, ofT ? W / 2 - 160 : W / 2);
    let n = 0;
    for (let i = 0; i < lay.length; i++) {
      const g = lay[i];
      if (g.ch === ' ') continue;
      const p = clamp((lt - L.t0 - n * L.stagger) / (L.mode === 'pop' ? 0.5 : 0.32));
      n++;
      if (p <= 0) continue;
      x.save();
      x.translate(g.x, L.y);
      x.fillStyle = COL.paper;
      if (L.mode === 'drop') {
        const e = E.outBack(p, 2.2);
        x.translate(0, -300 * (1 - e));
        x.rotate((hash(i + 3) - 0.5) * 1.2 * (1 - E.outCubic(p)));
        x.globalAlpha = clamp(p * 4);
      } else if (L.mode === 'pop') {
        const e = E.outElastic(p);
        x.translate(0, -50); x.scale(e, e); x.translate(0, 50);
        x.fillStyle = COL.yellow;
      } else if (L.mode === 'weight') {
        const e = E.outExpo(p);
        x.translate(420 * (1 - e), 0);
        x.transform(1, 0, -0.35 * (1 - e), 1, 0, 0);
        const wv = 0.5 + 0.5 * Math.sin(lt * 9 - i * 0.8);
        const wt = Math.round(lerp(1, lerp(1, 9, wv), e)) * 100;
        x.font = font(wt, 160);
        x.fillStyle = COL.accent;
      } else {
        x.font = font(900, 160);
      }
      x.fillText(g.ch, 0, 0);
      x.restore();
    }
    if (ofT) { // "OF t" — t set as a math variable
      const tt = L.t0 + 0.16, p = clamp((lt - tt) / 0.35);
      const ex = lay[lay.length - 1].x + lay[lay.length - 1].w / 2 + 70;
      if (p > 0) {
        x.save();
        x.translate(ex + 90, L.y);
        const e = E.outBack(p, 3);
        x.scale(e, e);
        x.font = `italic 700 330px ${SERIF}`; x.fillStyle = COL.accent;
        x.fillText('t', 0, 0);
        x.restore();
      }
      if (Math.floor(lt * 4) % 2 === 0 || lt < tt) {
        x.fillStyle = COL.paper;
        x.fillRect(ex + (p > 0 ? 210 : 0), L.y - 130, 18, 150);
      }
    }
  }
  x.restore();
  x.font = font(400, 20, MONO); x.fillStyle = 'rgba(241,237,228,0.45)'; x.textAlign = 'center';
  x.fillText('per-glyph stagger · overshoot · live weight 100→900', W / 2, 1000);
}

// ============================================================ 03 shape morph
const MORPH_N = 240;
function polyShape(verts) {
  const segs = [];
  let total = 0;
  for (let i = 0; i < verts.length; i++) {
    const a = verts[i], b = verts[(i + 1) % verts.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    segs.push([a, b, l]); total += l;
  }
  const out = [];
  for (let k = 0; k < MORPH_N; k++) {
    let d = (k / MORPH_N) * total;
    for (const [a, b, l] of segs) {
      if (d <= l) { out.push([lerp(a[0], b[0], d / l), lerp(a[1], b[1], d / l)]); break; }
      d -= l;
    }
  }
  return out;
}
const SHAPES = (() => {
  const circle = [];
  for (let k = 0; k < MORPH_N; k++) { const a = -Math.PI / 2 + TAU * k / MORPH_N; circle.push([Math.cos(a), Math.sin(a)]); }
  const tri = [-90, 30, 150].map(d => [Math.cos(d * Math.PI / 180) * 1.25, Math.sin(d * Math.PI / 180) * 1.25 + 0.15]);
  const a = 0.86, sq = [[0, -a], [a, -a], [a, a], [-a, a], [-a, -a]];
  const star = [];
  for (let k = 0; k < 10; k++) { const r = k % 2 ? 0.48 : 1.15, an = -Math.PI / 2 + k * Math.PI / 5; star.push([Math.cos(an) * r, Math.sin(an) * r + 0.05]); }
  return [circle, polyShape(tri), polyShape(sq), polyShape(star)];
})();
const SHAPE_COL = [COL.accent, COL.yellow, COL.blue, COL.mint];
const SHAPE_NAME = ['circle', 'triangle', 'square', 'star'];
function morphAt(lt) {
  const k = clamp(Math.floor(lt / BEAT), 0, 3), pk = lt - k * BEAT;
  const p = clamp(pk / 0.34), e = E.outBack(p, 2.4);
  const from = k === 0 ? null : SHAPES[k - 1], to = SHAPES[k];
  const appear = k === 0 ? E.outBack(clamp(lt / 0.3), 2) : 1;
  const pts = to.map((q, i) => from ? [lerp(from[i][0], q[0], e), lerp(from[i][1], q[1], e)] : [q[0] * appear, q[1] * appear]);
  const color = k === 0 ? SHAPE_COL[0] : mixHex(SHAPE_COL[k - 1], SHAPE_COL[k], E.outCubic(p));
  return { pts, color, k, pk, rot: Math.sin(lt * Math.PI) * 0.12, pulse: 1 + 0.1 * Math.exp(-pk * 9) };
}
function tracePts(x, pts, s) {
  x.beginPath();
  pts.forEach((p, i) => i ? x.lineTo(p[0] * s, p[1] * s) : x.moveTo(p[0] * s, p[1] * s));
  x.closePath();
}
function sMorph(x, lt) {
  bg(x, COL.ink);
  dotGrid(x, 48, 1.1, 'rgba(241,237,228,0.06)');
  const R = 270;
  x.save(); x.translate(W / 2, 520);
  for (let j = 7; j >= 1; j--) { // lagged echoes
    const m = morphAt(lt - j * 0.045);
    x.save(); x.rotate(m.rot); x.scale(1 + j * 0.07, 1 + j * 0.07);
    tracePts(x, m.pts, R * m.pulse);
    x.strokeStyle = m.color; x.globalAlpha = 0.45 * (1 - j / 8); x.lineWidth = 2.5; x.stroke();
    x.restore();
  }
  const m = morphAt(lt);
  x.rotate(m.rot);
  tracePts(x, m.pts, R * m.pulse);
  x.fillStyle = m.color; x.fill();
  x.fillStyle = COL.ink;
  for (let i = 0; i < MORPH_N; i += 12) { // vertex markers
    x.beginPath(); x.arc(m.pts[i][0] * R * m.pulse, m.pts[i][1] * R * m.pulse, 4, 0, TAU); x.fill();
  }
  x.restore();
  x.font = font(500, 28, MONO); x.textAlign = 'center'; x.fillStyle = COL.paper;
  const from = m.k === 0 ? '∅' : SHAPE_NAME[m.k - 1];
  x.fillText(`${from}  →  ${SHAPE_NAME[m.k]}`, W / 2, 920);
  x.font = font(400, 20, MONO); x.fillStyle = 'rgba(241,237,228,0.45)';
  x.fillText(`${MORPH_N} resampled vertices · arc-length matched · lerp × outBack(2.4)`, W / 2, 960);
}

// ========================================================= 04 easing editor
const EASE_PRESETS = [
  { name: 'ease-in-out', b: [0.65, 0, 0.35, 1] },
  { name: 'back-out', b: [0.34, 1.56, 0.64, 1] },
  { name: 'expo-in', b: [0.7, 0, 0.84, 0] },
  { name: 'anticipate', b: [0.68, -0.6, 0.32, 1.6] },
];
const LINEAR = [0.33, 0.33, 0.67, 0.67];
const bez = (a, b, s) => { const u = 1 - s; return 3 * u * u * s * a + 3 * u * s * s * b + s * s * s; };
function bezSolve(x1, x2, xv) {
  let lo = 0, hi = 1;
  for (let i = 0; i < 32; i++) { const m = (lo + hi) / 2; if (bez(x1, x2, m) < xv) lo = m; else hi = m; }
  return (lo + hi) / 2;
}
function easingState(lt) {
  const k = clamp(Math.floor(lt / BEAT), 0, 3), pk = lt - k * BEAT;
  const from = k === 0 ? LINEAR : EASE_PRESETS[k - 1].b, to = EASE_PRESETS[k].b;
  const m = E.outCubic(clamp(pk / 0.18));
  const h = from.map((v, i) => lerp(v, to[i], m));
  const px = clamp((pk - 0.06) / 0.38);
  const s = bezSolve(h[0], h[2], px);
  return { k, pk, h, px, py: bez(h[1], h[3], s), s };
}
function sEasing(x, lt) {
  bg(x, COL.ink);
  const st = easingState(lt), h = st.h;
  const gx = v => 360 + v * 380, gy = v => 730 - v * 380;
  roundRect(x, 170, 100, 760, 890, 28); x.fillStyle = COL.ink2; x.fill();
  x.strokeStyle = 'rgba(241,237,228,0.12)'; x.lineWidth = 2; x.stroke();
  x.font = font(500, 18, MONO); x.fillStyle = 'rgba(241,237,228,0.5)'; x.textAlign = 'left';
  x.fillText('curve.bezier', 206, 144);
  x.fillStyle = COL.accent; x.beginPath(); x.arc(880, 138, 6, 0, TAU); x.fill();
  x.save(); roundRect(x, 170, 100, 760, 890, 28); x.clip();
  x.strokeStyle = 'rgba(241,237,228,0.06)'; x.lineWidth = 1;
  x.beginPath();
  for (let i = -6; i <= 16; i++) { const v = i / 10; x.moveTo(gx(0), gy(v)); x.lineTo(gx(1), gy(v)); }
  for (let i = 0; i <= 10; i++) { const v = i / 10; x.moveTo(gx(v), gy(-0.6)); x.lineTo(gx(v), gy(1.6)); }
  x.stroke();
  x.strokeStyle = 'rgba(241,237,228,0.25)'; x.strokeRect(gx(0), gy(1), 380, 380);
  x.setLineDash([6, 8]);
  x.beginPath(); x.moveTo(gx(0), gy(0)); x.lineTo(gx(1), gy(1)); x.stroke();
  x.setLineDash([]);
  // curve: dim full + solid traversed part
  const curve = (s0, s1) => {
    x.beginPath();
    for (let i = 0; i <= 100; i++) {
      const s = lerp(s0, s1, i / 100), px = gx(bez(h[0], h[2], s)), py = gy(bez(h[1], h[3], s));
      i ? x.lineTo(px, py) : x.moveTo(px, py);
    }
  };
  x.lineCap = 'round';
  curve(0, 1); x.strokeStyle = 'rgba(255,75,43,0.3)'; x.lineWidth = 6; x.stroke();
  curve(0, st.s); x.strokeStyle = COL.accent; x.stroke();
  // handles
  x.strokeStyle = 'rgba(241,237,228,0.8)'; x.lineWidth = 2;
  x.beginPath(); x.moveTo(gx(0), gy(0)); x.lineTo(gx(h[0]), gy(h[1])); x.moveTo(gx(1), gy(1)); x.lineTo(gx(h[2]), gy(h[3])); x.stroke();
  for (const [hx, hy] of [[h[0], h[1]], [h[2], h[3]]]) {
    x.beginPath(); x.arc(gx(hx), gy(hy), 13, 0, TAU); x.fillStyle = COL.paper; x.fill();
    x.lineWidth = 4; x.strokeStyle = COL.accent; x.stroke();
  }
  x.fillStyle = COL.paper; x.fillRect(gx(0) - 7, gy(0) - 7, 14, 14); x.fillRect(gx(1) - 7, gy(1) - 7, 14, 14);
  // playhead
  x.setLineDash([4, 6]); x.strokeStyle = 'rgba(255,197,61,0.6)'; x.lineWidth = 1.5;
  x.beginPath(); x.moveTo(gx(st.px), gy(-0.6)); x.lineTo(gx(st.px), gy(st.py)); x.lineTo(gx(0), gy(st.py)); x.stroke();
  x.setLineDash([]);
  x.restore();
  x.beginPath(); x.arc(gx(st.px), gy(st.py), 15, 0, TAU); x.fillStyle = COL.yellow; x.fill();
  x.font = font(500, 18, MONO); x.fillStyle = 'rgba(241,237,228,0.5)';
  x.fillText('time →', gx(1) - 70, gy(0) + 40);
  x.fillText('progress ↑', gx(0) - 4, gy(1) - 22);
  // right column
  const prev = st.k === 0 ? 'linear' : EASE_PRESETS[st.k - 1].name;
  const sw = E.outCubic(clamp(st.pk / 0.2));
  x.save(); x.beginPath(); x.rect(1030, 150, 860, 110); x.clip();
  x.font = font(800, 84); x.fillStyle = COL.paper;
  x.globalAlpha = 1 - sw; x.fillText(prev, 1040, 240 - sw * 90);
  x.globalAlpha = sw; x.fillText(EASE_PRESETS[st.k].name, 1040, 240 + (1 - sw) * 90);
  x.restore();
  x.font = font(500, 26, MONO); x.fillStyle = COL.accent;
  x.fillText(`cubic-bezier(${h.map(v => v.toFixed(2)).join(', ')})`, 1040, 310);
  const T0 = 1080, T1 = 1740, ty = 480;
  x.font = font(500, 18, MONO); x.fillStyle = 'rgba(241,237,228,0.5)';
  x.fillText('translateX', T0, ty - 70); x.fillText('rotate', T0, ty + 200); x.fillText('scale', 1460, ty + 200);
  x.fillStyle = 'rgba(241,237,228,0.2)'; x.fillRect(T0, ty, T1 - T0, 2);
  x.fillRect(T0, ty - 14, 2, 30); x.fillRect(T1, ty - 14, 2, 30);
  x.fillStyle = 'rgba(241,237,228,0.35)';
  for (let j = 0; j <= 12; j++) { // spacing chart, equal time steps
    const sj = bezSolve(h[0], h[2], j / 12), v = bez(h[1], h[3], sj);
    x.beginPath(); x.arc(lerp(T0, T1, v), ty + 60, 5, 0, TAU); x.fill();
  }
  roundRect(x, lerp(T0, T1, st.py) - 40, ty - 40, 80, 80, 16); x.fillStyle = COL.accent; x.fill();
  x.save(); x.translate(1220, ty + 300); x.rotate(st.py * Math.PI);
  roundRect(x, -120, -10, 240, 20, 10); x.fillStyle = COL.paper; x.fill(); x.restore();
  x.beginPath(); x.arc(1580, ty + 300, Math.max(2, 20 + 80 * st.py), 0, TAU); x.fillStyle = COL.yellow; x.fill();
}

// ===================================================== 05 9,000 particles
const PN = 9000, PBUCKETS = 6;
let PART = null;
function sampleText(text, fnt, n, seed) {
  const b = buf();
  b.x.fillStyle = '#fff'; b.x.font = fnt; b.x.textAlign = 'center'; b.x.textBaseline = 'middle';
  b.x.fillText(text, W / 2, 540);
  const d = b.x.getImageData(0, 0, W, H).data, pts = [];
  for (let y = 0; y < H; y += 3) for (let xx = 0; xx < W; xx += 3) if (d[(y * W + xx) * 4 + 3] > 128) pts.push([xx, y]);
  const r = rng(seed);
  for (let i = pts.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [pts[i], pts[j]] = [pts[j], pts[i]]; }
  const out = [];
  for (let i = 0; i < n; i++) { const p = pts[i % pts.length]; out.push([p[0] + (r() - 0.5) * 2.5, p[1] + (r() - 0.5) * 2.5]); }
  out.sort((a, b) => (a[0] + a[1] * 0.3) - (b[0] + b[1] * 0.3));
  return out;
}
function initParticles() {
  const A = sampleText('9000', font(900, 600), PN, 11);
  const B = sampleText('粒子', `700 620px ${CJK}`, PN, 12);
  const r = rng(13);
  const P = [];
  for (let i = 0; i < PN; i++) {
    P.push({
      a: A[i], b: B[i],
      gr: 260 + 560 * Math.sqrt(r()), ga: r() * TAU, gs: 0.6 + r() * 1.4,
      dA: (A[i][0] / W) * 0.18 + r() * 0.02, dB: (A[i][0] / W) * 0.14 + r() * 0.02,
      arc: (r() - 0.5) * 260, bucket: clamp(Math.floor((A[i][0] - 300) / (W - 600) * PBUCKETS + r() * 0.8), 0, PBUCKETS - 1),
      ex: r() - 0.5, ey: r() - 0.5,
    });
  }
  PART = P;
}
const PCOLS = ['#ff4b2b', '#ff6a2b', '#ff8a33', '#ffa83a', '#ffc53d', '#ffe39a'];
function sParticles(x, lt) {
  bg(x, COL.ink);
  const paths = PCOLS.map(() => new Path2D());
  for (let i = 0; i < PN; i++) {
    const q = PART[i];
    let px, py;
    const ga = q.ga + lt * q.gs * 1.2;
    const gx = W / 2 + Math.cos(ga) * q.gr * 1.15, gy = 540 + Math.sin(ga) * q.gr * 0.55;
    if (lt < 1.0) {
      const p = E.inOutCubic(clamp((lt - q.dA) / 0.3));
      px = lerp(gx, q.a[0], p) + Math.sin(p * Math.PI) * q.arc * 0.6;
      py = lerp(gy, q.a[1], p) - Math.sin(p * Math.PI) * q.arc * 0.3;
    } else {
      const p = E.inOutCubic(clamp((lt - 1.0 - q.dB) / 0.3));
      px = lerp(q.a[0], q.b[0], p);
      py = lerp(q.a[1], q.b[1], p) - Math.sin(p * Math.PI) * q.arc;
    }
    const sh = Math.sin(lt * 7 + i) * 0.8; // idle shimmer
    px += sh; py += Math.cos(lt * 6 + i * 1.3) * 0.8;
    if (lt > 1.88) { const k = (lt - 1.88) ** 2 * 5200; px += q.ex * k; py += q.ey * k; }
    const sz = 3.2;
    paths[q.bucket].rect(px - sz / 2, py - sz / 2, sz, sz);
  }
  paths.forEach((p, i) => { x.fillStyle = PCOLS[i]; x.fill(p); });
  const cnt = Math.round(PN * clamp(lt / 0.5));
  x.font = font(500, 22, MONO); x.fillStyle = 'rgba(241,237,228,0.6)'; x.textAlign = 'center';
  x.fillText(`n = ${cnt.toLocaleString('en-US')} particles   ·   target = ${lt < 1.0 ? '"9000"' : '"粒子"'}`, W / 2, 1000);
}

// ===================================================== 06 3D point cloud
const PC_G = 84, PC_N = PC_G * PC_G;
let PC = null;
function initPointCloud() {
  const r = rng(77), GA = Math.PI * (3 - Math.sqrt(5));
  const sphere = new Float32Array(PC_N * 3), torus = new Float32Array(PC_N * 3), knot = new Float32Array(PC_N * 3);
  for (let i = 0; i < PC_N; i++) {
    const y = 1 - 2 * (i + 0.5) / PC_N, rad = Math.sqrt(1 - y * y), th = i * GA;
    sphere.set([Math.cos(th) * rad * 1.05, y * 1.05, Math.sin(th) * rad * 1.05], i * 3);
    const u = TAU * i / PC_N, v = TAU * ((i * 0.6180339887) % 1);
    torus.set([(0.85 + 0.36 * Math.cos(v)) * Math.cos(u), 0.36 * Math.sin(v), (0.85 + 0.36 * Math.cos(v)) * Math.sin(u)], i * 3);
    const s = TAU * i / PC_N;
    let fx = r() * 2 - 1, fy = r() * 2 - 1, fz = r() * 2 - 1;
    const fl = Math.hypot(fx, fy, fz) || 1, fr = 0.12 * Math.cbrt(r());
    knot.set([(Math.sin(s) + 2 * Math.sin(2 * s)) * 0.36 + fx / fl * fr, (Math.cos(s) - 2 * Math.cos(2 * s)) * 0.36 + fy / fl * fr, -Math.sin(3 * s) * 0.36 + fz / fl * fr], i * 3);
  }
  PC = { sphere, torus, knot };
}
function pcShape(k, i, lt, out) {
  if (k === 0) { out[0] = PC.sphere[i * 3]; out[1] = PC.sphere[i * 3 + 1]; out[2] = PC.sphere[i * 3 + 2]; }
  else if (k === 1) { out[0] = PC.torus[i * 3]; out[1] = PC.torus[i * 3 + 1]; out[2] = PC.torus[i * 3 + 2]; }
  else if (k === 2) { out[0] = PC.knot[i * 3]; out[1] = PC.knot[i * 3 + 1]; out[2] = PC.knot[i * 3 + 2]; }
  else {
    const u = ((i % PC_G) / (PC_G - 1) - 0.5) * 2.7, v = (Math.floor(i / PC_G) / (PC_G - 1) - 0.5) * 2.7;
    out[0] = u; out[2] = v; out[1] = 0.24 * Math.sin(3.2 * u + lt * 5) * Math.cos(3 * v + lt * 3.5);
  }
}
const PC_NAMES = ['SPHERE', 'TORUS', 'TREFOIL KNOT', 'WAVE FIELD'];
const PC_COLS = ['#2a3f8f', '#3550b8', '#3d6bff', '#5c86ff', '#86a6ff', '#b3c7ff', '#dbe5ff', '#ffffff'];
function sCloud(x, lt) {
  const g = x.createRadialGradient(W / 2, 560, 50, W / 2, 560, 1100);
  g.addColorStop(0, '#111a33'); g.addColorStop(1, '#05060c');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  const k = clamp(Math.floor(lt / BEAT), 0, 3), pk = lt - k * BEAT;
  const yaw = 0.5 + lt * 0.8, pitch = 0.42 + 0.08 * Math.sin(lt * 1.3);
  const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
  const F = 940, D = 3.1, pulse = 1 + 0.07 * Math.exp(-pk * 8);
  const project = (px, py, pz) => {
    const x1 = px * cy + pz * sy, z1 = -px * sy + pz * cy;
    const y2 = py * cp - z1 * sp, z2 = py * sp + z1 * cp;
    const zc = z2 + D;
    return [W / 2 + x1 * F / zc, 505 + y2 * F / zc, zc];
  };
  // floor dots
  x.fillStyle = 'rgba(140,160,255,0.22)';
  x.beginPath();
  for (let a = -7; a <= 7; a++) for (let b = -7; b <= 7; b++) {
    const [sx, sy2] = project(a * 0.22, 1.25, b * 0.22);
    x.rect(sx - 1.5, sy2 - 1.5, 3, 3);
  }
  x.fill();
  const paths = PC_COLS.map(() => new Path2D());
  const A = [0, 0, 0], B = [0, 0, 0];
  for (let i = 0; i < PC_N; i++) {
    let px, py, pz;
    if (k === 0) {
      pcShape(0, i, lt, B);
      const e = E.outBack(clamp((lt - hash(i) * 0.1) / 0.35), 1.6);
      px = B[0] * e; py = B[1] * e; pz = B[2] * e;
    } else {
      pcShape(k - 1, i, lt, A); pcShape(k, i, lt, B);
      const q = E.inOutCubic(clamp((pk - hash(i) * 0.05) / 0.22));
      px = lerp(A[0], B[0], q); py = lerp(A[1], B[1], q); pz = lerp(A[2], B[2], q);
    }
    const [sx, sy2, zc] = project(px * pulse, py * pulse, pz * pulse);
    const d = clamp((zc - (D - 1.3)) / 2.6);
    const b = Math.min(7, Math.floor((1 - d) * 8));
    const sz = 1.4 + 3.2 * (1 - d);
    paths[b].rect(sx - sz / 2, sy2 - sz / 2, sz, sz);
  }
  x.globalCompositeOperation = 'lighter';
  x.globalAlpha = 0.85;
  paths.forEach((p, i) => { x.fillStyle = PC_COLS[i]; x.fill(p); });
  x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
  // axis gizmo
  const o = [170, 880];
  [[1, 0, 0, '#ff5a5a', 'x'], [0, -1, 0, '#5aff9b', 'y'], [0, 0, 1, '#6a8dff', 'z']].forEach(([ax, ay, az, c, n]) => {
    const [ex, ey] = project(ax * 0.4, ay * 0.4, az * 0.4), [ox, oy] = project(0, 0, 0);
    const vx = (ex - ox) * 0.25, vy = (ey - oy) * 0.25;
    x.strokeStyle = c; x.lineWidth = 3;
    x.beginPath(); x.moveTo(o[0], o[1]); x.lineTo(o[0] + vx, o[1] + vy); x.stroke();
    x.font = font(600, 18, MONO); x.fillStyle = c; x.fillText(n, o[0] + vx * 1.25 - 5, o[1] + vy * 1.25 + 6);
  });
  x.font = font(500, 28, MONO); x.textAlign = 'center'; x.fillStyle = COL.paper;
  x.fillText(k === 0 ? PC_NAMES[0] : `${PC_NAMES[k - 1]}  →  ${PC_NAMES[k]}`, W / 2, 955);
  x.font = font(400, 20, MONO); x.fillStyle = 'rgba(241,237,228,0.45)';
  x.fillText(`${PC_N.toLocaleString('en-US')} points · rotation matrices + perspective divide by hand · no WebGL`, W / 2, 995);
  x.textAlign = 'left';
}

// ======================================================= 07 liquid metaballs
const MB_S = 2, MW = W / MB_S, MH = H / MB_S;
let MB = null;
function initMeta() { const b = buf(MW, MH); MB = { b, img: b.x.createImageData(MW, MH), f: new Float32Array(MW * MH), gx: new Float32Array(MW * MH), gy: new Float32Array(MW * MH) }; }
function metaBalls(lt) {
  const cx = 960 + 90 * Math.sin(lt * 1.4), cy = 520 + 50 * Math.cos(lt * 1.9);
  const balls = [[cx, cy, 165]];
  const pump = Math.abs(Math.sin(Math.PI * lt / BEAT)); // merged on every beat
  for (let j = 0; j < 6; j++) {
    const a = j * TAU / 6 + lt * 0.8 + 0.3 * Math.sin(lt * 2 + j);
    const rad = 110 + 310 * Math.pow(pump, 0.8) * (0.8 + 0.4 * hash(j + 3));
    balls.push([cx + Math.cos(a) * rad * 1.25, cy + Math.sin(a) * rad * 0.85, 72 + 26 * hash(j + 11)]);
  }
  for (let j = 0; j < 5; j++) {
    const a = -lt * 1.6 + j * 1.3, rad = 440 + 60 * Math.sin(lt * 3 + j);
    balls.push([cx + Math.cos(a) * rad * 1.3, cy + Math.sin(a) * rad * 0.7, 28 + 10 * hash(j + 40)]);
  }
  return balls;
}
function sMeta(x, lt) {
  const g = x.createRadialGradient(960, 540, 80, 960, 540, 1200);
  g.addColorStop(0, '#2c1342'); g.addColorStop(1, '#0c0614');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  const balls = metaBalls(lt), nb = balls.length;
  let x0 = W, x1 = 0, y0 = H, y1 = 0;
  for (const [bx, by, br] of balls) { x0 = Math.min(x0, bx - br * 2.2); x1 = Math.max(x1, bx + br * 2.2); y0 = Math.min(y0, by - br * 2.2); y1 = Math.max(y1, by + br * 2.2); }
  const ix0 = clamp(Math.floor(x0 / MB_S), 1, MW - 2), ix1 = clamp(Math.ceil(x1 / MB_S), 1, MW - 2);
  const iy0 = clamp(Math.floor(y0 / MB_S), 1, MH - 2), iy1 = clamp(Math.ceil(y1 / MB_S), 1, MH - 2);
  const f = MB.f, gxa = MB.gx, gya = MB.gy, data = MB.img.data;
  data.fill(0);
  const BX = balls.map(b => b[0]), BY = balls.map(b => b[1]), BR = balls.map(b => b[2] * b[2]);
  for (let iy = iy0 - 1; iy <= iy1 + 1; iy++) {
    const py = iy * MB_S + 1;
    for (let ix = ix0 - 1; ix <= ix1 + 1; ix++) {
      const px = ix * MB_S + 1;
      let s = 0, gx = 0, gy = 0;
      for (let k = 0; k < nb; k++) {
        const dx = px - BX[k], dy = py - BY[k], q = 1 / (dx * dx + dy * dy + 1), v = BR[k] * q;
        s += v; gx -= 2 * v * q * dx; gy -= 2 * v * q * dy;
      }
      f[iy * MW + ix] = s; gxa[iy * MW + ix] = gx; gya[iy * MW + ix] = gy;
    }
  }
  let Lx = -0.45, Ly = -0.62, Lz = 0.64; const ll = Math.hypot(Lx, Ly, Lz); Lx /= ll; Ly /= ll; Lz /= ll;
  let Hx = Lx, Hy = Ly, Hz = Lz + 1; const hl = Math.hypot(Hx, Hy, Hz); Hx /= hl; Hy /= hl; Hz /= hl;
  const K = 60;
  for (let iy = iy0; iy <= iy1; iy++) {
    const ty = iy / MH;
    for (let ix = ix0; ix <= ix1; ix++) {
      const idx = iy * MW + ix, v = f[idx];
      if (v < 0.9) continue;
      // height h = 1 − 1/f  →  ∇h = ∇f / f²
      const ff = Math.max(v, 1), dx = gxa[idx] / (ff * ff), dy = gya[idx] / (ff * ff);
      let nx = -dx * K, ny = -dy * K, nz = 1; const nl = Math.hypot(nx, ny, nz); nx /= nl; ny /= nl; nz /= nl;
      const dif = Math.max(0, nx * Lx + ny * Ly + nz * Lz);
      const spec = Math.pow(Math.max(0, nx * Hx + ny * Hy + nz * Hz), 60);
      const rim = Math.pow(1 - nz, 2);
      const core = clamp((v - 1.5) / 4) * 0.35;
      const br = 255, bgc = lerp(75, 61, ty) + core * 120, bb = lerp(43, 150, ty);
      const sh = 0.22 + 0.9 * dif;
      const o = idx * 4;
      data[o] = Math.min(255, br * sh + spec * 255 + rim * 60);
      data[o + 1] = Math.min(255, bgc * sh + spec * 255 + rim * 30);
      data[o + 2] = Math.min(255, bb * sh + spec * 255 + rim * 140);
      data[o + 3] = clamp((v - 1) / 0.06 + 0.5) * 255;
    }
  }
  MB.b.x.putImageData(MB.img, 0, 0);
  x.imageSmoothingEnabled = true;
  x.save(); x.globalAlpha = 0.35; x.filter = 'blur(18px) brightness(0)';
  x.drawImage(MB.b.c, 18, 40, W, H); x.restore();
  x.drawImage(MB.b.c, 0, 0, W, H);
  x.font = font(500, 26, MONO); x.fillStyle = COL.paper; x.textAlign = 'center';
  x.fillText('f(p) = Σ rᵢ² / |p − cᵢ|²   ≥ 1', W / 2, 960);
  x.font = font(400, 20, MONO); x.fillStyle = 'rgba(241,237,228,0.45)';
  x.fillText(`${nb} balls · per-pixel field · normals from ∇f · Blinn-Phong · merge on every beat`, W / 2, 1000);
  x.textAlign = 'left';
}

// ======================================================= 08 swiss grid wave
const SW = { cols: 17, rows: 13, cell: 64, x0: 736, y0: 128 };
const SW_SRC = [[0, 0, 0], [0.5, 16, 12], [1.0, 8, 6], [1.5, 16, 0], [2.0, 0, 12]];
function swissVal(i, j, lt) {
  let v = 0.1;
  for (const [tb, oi, oj] of SW_SRC) {
    if (lt < tb) continue;
    const d = Math.hypot(i - oi, j - oj), age = lt - tb;
    v += Math.exp(-(((d - 22 * age) / 1.8) ** 2)) * Math.exp(-age * 1.1);
  }
  return clamp(v);
}
function sSwiss(x, lt) {
  bg(x, COL.paper);
  const { cols, rows, cell, x0, y0 } = SW;
  x.fillStyle = '#111';
  const red = new Path2D(), blk = new Path2D();
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const v = swissVal(i, j, lt), cxp = x0 + i * cell + cell / 2, cyp = y0 + j * cell + cell / 2;
    const r = 3 + 27 * v;
    const p = v > 0.72 ? red : blk;
    if (v > 0.9) p.rect(cxp - r, cyp - r, r * 2, r * 2);
    else { p.moveTo(cxp + r, cyp); p.arc(cxp, cyp, r, 0, TAU); }
  }
  x.fillStyle = '#111'; x.fill(blk); x.fillStyle = COL.red; x.fill(red);
  // typography column
  const inP = E.outExpo(clamp(lt / 0.4));
  x.fillStyle = '#111'; x.fillRect(96, 128, 544 * inP, 6);
  x.save(); x.beginPath(); x.rect(80, 120, 600, 860); x.clip();
  x.translate(-(1 - inP) * 120, 0);
  x.textAlign = 'left'; x.fillStyle = '#111';
  x.font = font(700, 26); x.fillText('Raster-System', 96, 186);
  x.font = font(400, 20, MONO); x.fillText(`${cols} × ${rows} Module à ${cell} px`, 96, 220);
  x.font = font(900, 230); x.fillText('Grid', 86, 500);
  x.fillStyle = COL.red; x.fillText('Wave', 86, 700);
  x.fillStyle = '#111'; x.font = font(500, 22);
  ['Fünf Wellen, ausgelöst', 'auf jeden Schlag.', 'Interferenz statt Zufall.'].forEach((l, i) => x.fillText(l, 96, 800 + i * 32));
  x.restore();
  const pb = 1 + 0.25 * Math.exp(-mod(lt, BEAT) * 10);
  x.fillStyle = COL.red; x.fillRect(560 - 40 * pb, 912 - 40 * pb, 80 * pb, 80 * pb);
  x.fillStyle = '#111'; x.fillRect(96, 952, 544 * inP, 2);
}

// ============================================================ 09 glitch art
let GL = null;
function initGlitch() {
  GL = { c: buf(), r: buf(), g: buf(), b: buf(), out: buf(), scan: buf() };
  const s = GL.scan.x;
  s.fillStyle = 'rgba(0,0,0,0.28)';
  for (let y = 0; y < H; y += 4) s.fillRect(0, y, W, 2);
}
const GL_WORDS = ['GLITCH', 'ERR0R', 'NO SIGNAL', 'GL!TCH'];
function glitchContent(x, lt) {
  bg(x, '#060608');
  const bars = ['#bfbfbf', '#bfbf00', '#00bfbf', '#00bf00', '#bf00bf', '#bf0000', '#0000bf'];
  x.globalAlpha = 0.5;
  bars.forEach((c, k) => { x.fillStyle = c; x.fillRect(k * W / 7, 800, W / 7 + 1, 110); });
  x.globalAlpha = 1;
  x.font = font(500, 16, MONO); x.fillStyle = 'rgba(53,224,176,0.35)'; x.textAlign = 'left';
  for (let r = 0; r < 26; r++) {
    let line = '';
    for (let c = 0; c < 6; c++) line += Math.floor(hash3(r, c, Math.floor(lt * 6)) * 65536).toString(16).padStart(4, '0') + ' ';
    x.fillText(line, 60, 150 + r * 24); x.fillText(line, W - 360, 150 + r * 24);
  }
  const k = clamp(Math.floor(lt / BEAT), 0, 3), word = GL_WORDS[k];
  x.font = font(900, 300);
  const w = x.measureText(word).width, sc = Math.min(1, 1300 / w);
  x.save(); x.translate(W / 2, 560); x.scale(sc, sc);
  x.textAlign = 'center'; x.fillStyle = COL.paper; x.fillText(word, 0, 0);
  x.restore();
  x.textAlign = 'center'; x.font = font(500, 26, MONO); x.fillStyle = COL.accent;
  x.fillText(`ERR 0x${(0x2a + k * 17).toString(16).toUpperCase()}  //  FRAME ${Math.round(lt * FPS)}  //  SIGNAL CORRUPTED`, W / 2, 680);
  x.textAlign = 'left';
}
function channel(dst, src, color) {
  const x = dst.x;
  x.globalCompositeOperation = 'copy'; x.drawImage(src, 0, 0);
  x.globalCompositeOperation = 'multiply'; x.fillStyle = color; x.fillRect(0, 0, W, H);
  x.globalCompositeOperation = 'source-over';
}
function sGlitch(x, lt) {
  glitchContent(GL.c.x, lt);
  const step = Math.floor(lt * 15) + 500;
  const phB = mod(lt, BEAT), phH = mod(lt + 0.25, BEAT);
  const I = clamp(0.15 + 0.85 * Math.exp(-phB * 9) + 0.45 * Math.exp(-phH * 14));
  channel(GL.r, GL.c.c, '#ff0000'); channel(GL.g, GL.c.c, '#00ff00'); channel(GL.b, GL.c.c, '#0000ff');
  const off = 6 + I * 38, offy = (hash(step) - 0.5) * I * 16;
  bg(x, '#000');
  x.globalCompositeOperation = 'lighter';
  x.drawImage(GL.r.c, -off, offy); x.drawImage(GL.g.c, 0, 0); x.drawImage(GL.b.c, off, -offy);
  x.globalCompositeOperation = 'source-over';
  const o = GL.out.x;
  o.globalCompositeOperation = 'copy'; o.drawImage(x.canvas, 0, 0); o.globalCompositeOperation = 'source-over';
  for (let s = 0; s < 14; s++) { // slice displacement
    if (hash2(step, s) > I) continue;
    const sy = hash2(step, s + 50) * H, sh = 6 + hash2(step, s + 99) * 110, dx = (hash2(step, s + 7) - 0.5) * 2 * I * 280;
    x.drawImage(GL.out.c, 0, sy, W, sh, dx, sy, W, sh);
    x.drawImage(GL.out.c, 0, sy, W, sh, dx - Math.sign(dx) * W, sy, W, sh);
  }
  if (I > 0.35) for (let s = 0; s < 7; s++) { // block corruption
    const bw = 60 + hash2(step, s + 200) * 360, bh = 20 + hash2(step, s + 300) * 120;
    const sx = hash2(step, s + 400) * W, sy = hash2(step, s + 500) * H, dx = hash2(step, s + 600) * W, dy = hash2(step, s + 700) * H;
    if (hash2(step, s + 800) < 0.3) { x.fillStyle = hash2(step, s) < 0.5 ? COL.mint : COL.pink; x.globalAlpha = 0.8; x.fillRect(dx, dy, bw, bh * 0.3); x.globalAlpha = 1; }
    else x.drawImage(GL.out.c, sx, sy, bw, bh, dx, dy, bw, bh);
  }
  if (hash(step + 31) < I) { // pixel smear
    const sx = hash(step + 32) * W * 0.8, sw = 80 + hash(step + 33) * 400, sy = 350 + hash(step + 34) * 300;
    x.drawImage(GL.out.c, sx, sy, sw, 1, sx, sy, sw, 260 * I);
  }
  x.drawImage(GL.scan.c, 0, 0);
  x.fillStyle = 'rgba(255,255,255,0.7)';
  for (let s = 0; s < 4; s++) if (hash2(step, s + 900) < I) x.fillRect(0, hash2(step, s + 950) * H, W, 1 + hash2(step, s) * 2);
  const k = Math.floor(lt / BEAT);
  if (phB < 1 / FPS - 1e-6 && k % 2 === 1) { x.globalCompositeOperation = 'difference'; x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); x.globalCompositeOperation = 'source-over'; }
}

// ========================================================= 10 infinite zoom
const ZOOM_PAL = [COL.ink, COL.accent, COL.paper, COL.blue, COL.yellow, '#1d1d26'];
function zoomPhase(lt) {
  let P = lt * 0.7;
  for (let tb = 0; tb <= 2.01; tb += BEAT) P += E.inOutCubic(clamp((lt - tb) / 0.32));
  return P;
}
function sZoom(x, lt) {
  const s = 0.78, th = 0.17, base = 1500, P = zoomPhase(lt);
  const cover = side => side >= 2300;
  let k = Math.floor(P) - 20;
  while (cover(base * Math.pow(s, k + 1 - P))) k++;
  bg(x, ZOOM_PAL[mod(k, 6)]);
  x.save(); x.translate(W / 2, H / 2);
  for (; k < Math.floor(P) + 30; k++) {
    const side = base * Math.pow(s, k - P);
    if (side < 1.5) break;
    const c = ZOOM_PAL[mod(k, 6)], c2 = ZOOM_PAL[mod(k + 2, 6)];
    x.save(); x.rotate((k - P) * th + lt * 0.2);
    x.fillStyle = c; x.fillRect(-side / 2, -side / 2, side, side);
    x.fillStyle = c2;
    x.beginPath(); x.arc(-side * 0.4, -side * 0.4, side * 0.035, 0, TAU); x.fill();
    const fs = side * 0.026;
    if (fs > 9 && fs < 140) {
      x.font = font(600, fs, MONO); x.textAlign = 'left';
      x.fillText(`DEPTH ${String(k).padStart(2, '0')}  ×${(1 / s).toFixed(2)}`, -side * 0.45, side * 0.46);
    }
    x.restore();
  }
  x.restore();
  x.font = font(400, 20, MONO); x.fillStyle = 'rgba(241,237,228,0.7)'; x.textAlign = 'center';
  x.globalCompositeOperation = 'difference';
  x.fillText(`zoom = 0.78^−${P.toFixed(2)}   ·   self-similar, no end`, W / 2, 1000);
  x.globalCompositeOperation = 'source-over';
  x.textAlign = 'left';
}

// ========================================================= 11 isometric city
const CITY = { n: 13, tw: 104, th: 52, ox: 960, oy: 330 };
let CITY_DATA = null;
function initCity() {
  const { n } = CITY, D = [];
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const road = i % 4 === 0 || j % 4 === 0, park = !road && hash2(i, j) < 0.12;
    const dist = Math.hypot(i - 6, j - 6);
    const h = road ? 0 : park ? 4 : 40 + 330 * Math.pow(clamp(1 - dist / 9), 1.4) * (0.45 + 0.55 * hash2(i + 7, j * 3));
    D.push({ i, j, road, park, dist, h, accent: !road && !park && hash2(i * 5, j + 2) < 0.12, rise: dist * 0.028 + hash2(i, j + 9) * 0.08 });
  }
  CITY_DATA = D;
}
function iso(i, j, z) { return [CITY.ox + (i - j) * CITY.tw / 2, CITY.oy + (i + j) * CITY.th / 2 - z]; }
function poly(x, pts, fill) { x.beginPath(); pts.forEach((p, k) => k ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath(); x.fillStyle = fill; x.fill(); }
function sCity(x, lt) {
  const g = x.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#15112a'); g.addColorStop(0.55, '#3b1f4f'); g.addColorStop(1, '#b8487a');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  const sg = x.createLinearGradient(0, 120, 0, 420);
  sg.addColorStop(0, COL.yellow); sg.addColorStop(1, COL.accent);
  x.fillStyle = sg; x.beginPath(); x.arc(1530, 270, 150, 0, TAU); x.fill();
  x.fillStyle = '#2e1a44';
  for (let k = 0; k < 6; k++) x.fillRect(1370, 290 + k * 22, 320, 4 + k * 1.6);
  x.save();
  const zm = 1 + lt * 0.025;
  x.translate(W / 2, 560); x.scale(zm, zm); x.translate(-W / 2, -560 + 20);
  const n = CITY.n, beatI = Math.floor(lt / BEAT);
  const cars = new Map();
  for (let c = 0; c < 16; c++) {
    const lane = (c % 4) * 4, alongI = c < 8, u = mod(lt * (1.6 + hash(c) * 1.2) + hash(c + 20) * 13, 13);
    const ci = alongI ? u : lane + 0.5, cj = alongI ? lane + 0.5 : u;
    const key = Math.floor(ci) * 100 + Math.floor(cj);
    if (!cars.has(key)) cars.set(key, []);
    cars.get(key).push([ci, cj, c]);
  }
  const pulseAt = d => {
    let p = 0;
    for (const tb of [0.5, 1.0, 1.5, 2.0]) if (lt > tb) p += Math.exp(-(((d - 16 * (lt - tb)) / 1.6) ** 2)) * Math.exp(-(lt - tb) * 1.5);
    return p;
  };
  for (let sum = 0; sum <= 2 * n - 2; sum++) {
    for (let i = Math.max(0, sum - n + 1); i <= Math.min(n - 1, sum); i++) {
      const j = sum - i, T = CITY_DATA[i * n + j];
      const ground = [iso(i, j, 0), iso(i + 1, j, 0), iso(i + 1, j + 1, 0), iso(i, j + 1, 0)];
      poly(x, ground, T.road ? '#241c3a' : T.park ? '#2f6b5a' : '#3a3157');
      if (T.road) {
        x.strokeStyle = 'rgba(255,255,255,0.08)'; x.lineWidth = 1; x.beginPath(); x.moveTo(...ground[0]); x.lineTo(...ground[1]); x.lineTo(...ground[2]); x.lineTo(...ground[3]); x.closePath(); x.stroke();
        for (const [ci, cj, c] of cars.get(i * 100 + j) || []) {
          const [px, py] = iso(ci, cj, 4);
          x.fillStyle = c % 3 === 0 ? COL.accent : '#fff3c4';
          x.beginPath(); x.ellipse(px, py, 7, 4, 0, 0, TAU); x.fill();
          x.globalAlpha = 0.25; x.beginPath(); x.ellipse(px, py, 18, 9, 0, 0, TAU); x.fill(); x.globalAlpha = 1;
        }
        continue;
      }
      if (T.park) {
        for (let t = 0; t < 3; t++) {
          const [px, py] = iso(i + 0.25 + hash2(i + t, j) * 0.5, j + 0.25 + hash2(i, j + t) * 0.5, 14);
          x.fillStyle = '#1f4f43'; x.beginPath(); x.arc(px, py + 6, 11, 0, TAU); x.fill();
          x.fillStyle = '#4fa37f'; x.beginPath(); x.arc(px, py, 11, 0, TAU); x.fill();
        }
        continue;
      }
      const grow = E.outBack(clamp((lt - T.rise) / 0.35), 1.4);
      if (grow <= 0) continue;
      const pu = pulseAt(T.dist);
      const h = Math.max(2, T.h * grow * (1 + 0.22 * pu));
      const e = 0.13;
      const L0 = iso(i + e, j + 1 - e, 0), B0 = iso(i + 1 - e, j + 1 - e, 0), R0 = iso(i + 1 - e, j + e, 0);
      const T0 = iso(i + e, j + e, h), L1 = iso(i + e, j + 1 - e, h), B1 = iso(i + 1 - e, j + 1 - e, h), R1 = iso(i + 1 - e, j + e, h);
      const pal = T.accent ? ['#ff6a4a', '#d93a1f', '#9c2510'] : ['#f3e9dc', '#c9b8d8', '#7d6b9e'];
      poly(x, [L0, B0, B1, L1], pal[1]);
      poly(x, [B0, R0, R1, B1], pal[2]);
      poly(x, [T0, R1, B1, L1], pu > 0.05 ? mixHex(pal[0], '#ffffff', clamp(pu)) : pal[0]);
      // windows
      const lit = new Path2D(), dim = new Path2D();
      const rowsN = Math.floor((h - 16) / 20);
      for (const [A0, A1, side] of [[L0, B0, 0], [B0, R0, 1]]) {
        for (let r = 0; r < rowsN; r++) for (let c = 0; c < 3; c++) {
          const u0 = 0.15 + c * 0.25, u1 = u0 + 0.14, z0 = 12 + r * 20, z1 = z0 + 10;
          const pA = [lerp(A0[0], A1[0], u0), lerp(A0[1], A1[1], u0)], pB = [lerp(A0[0], A1[0], u1), lerp(A0[1], A1[1], u1)];
          const on = mod(hash3(i * 13 + j, r * 7 + c, side) + 0.17 * beatI, 1) < 0.42;
          const p = on ? lit : dim;
          p.moveTo(pA[0], pA[1] - z0); p.lineTo(pB[0], pB[1] - z0); p.lineTo(pB[0], pB[1] - z1); p.lineTo(pA[0], pA[1] - z1); p.closePath();
        }
      }
      x.fillStyle = 'rgba(40,24,60,0.35)'; x.fill(dim);
      x.fillStyle = '#ffd774'; x.fill(lit);
    }
  }
  x.restore();
  x.font = font(400, 20, MONO); x.fillStyle = 'rgba(241,237,228,0.55)'; x.textAlign = 'center';
  x.fillText('(i − j)·w/2 , (i + j)·h/2 − z   ·   painter-sorted   ·   skyline pulses on the beat', W / 2, 1000);
  x.textAlign = 'left';
}

// ========================================================== 12 harmonograph
const HG_N = 9000, HG_S = 300;
function harmo(s, lt, out) {
  const e = Math.exp(-0.0042 * s), ph = 1.6 + lt * 0.45;
  out[0] = (300 * Math.sin(2.01 * s) + 160 * Math.sin(3 * s + ph)) * e;
  out[1] = (300 * Math.sin(3 * s + 0.8) + 160 * Math.sin(2 * s + ph * 0.5)) * e;
}
function sHarmo(x, lt) {
  const g = x.createRadialGradient(W / 2, 540, 50, W / 2, 540, 1100);
  g.addColorStop(0, '#0f1730'); g.addColorStop(1, '#04060e');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.strokeStyle = 'rgba(120,150,255,0.07)'; x.lineWidth = 1;
  for (let r = 100; r < 700; r += 100) { x.beginPath(); x.arc(W / 2, 540, r, 0, TAU); x.stroke(); }
  x.beginPath(); x.moveTo(W / 2 - 700, 540); x.lineTo(W / 2 + 700, 540); x.moveTo(W / 2, 0); x.lineTo(W / 2, H); x.stroke();
  const prog = E.inOutSine(clamp(lt / 1.9)) * 0.94 + clamp(lt / 1.9) * 0.06;
  const count = Math.max(2, Math.floor(HG_N * prog)), chunks = 40, per = Math.ceil(HG_N / chunks);
  const P = [0, 0], pts = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) { harmo(i / HG_N * HG_S, lt, P); pts[i * 2] = P[0]; pts[i * 2 + 1] = P[1]; }
  x.save(); x.translate(W / 2, 540); x.rotate(lt * 0.08);
  x.lineJoin = 'round'; x.lineCap = 'round';
  x.globalCompositeOperation = 'lighter';
  for (const [lw, al] of [[7, 0.07], [1.7, 0.9]]) {
    for (let c = 0; c * per < count - 1; c++) {
      const a = c * per, b = Math.min(count - 1, (c + 1) * per);
      x.beginPath(); x.moveTo(pts[a * 2], pts[a * 2 + 1]);
      for (let i = a + 1; i <= b; i++) x.lineTo(pts[i * 2], pts[i * 2 + 1]);
      x.strokeStyle = `hsla(${165 + 170 * c / chunks}, 90%, 66%, ${al})`; x.lineWidth = lw; x.stroke();
    }
  }
  x.globalCompositeOperation = 'source-over';
  const hx = pts[(count - 1) * 2], hy = pts[(count - 1) * 2 + 1], pk = mod(lt, BEAT);
  x.fillStyle = '#fff'; x.beginPath(); x.arc(hx, hy, 7, 0, TAU); x.fill();
  x.strokeStyle = 'rgba(255,255,255,0.6)'; x.lineWidth = 2;
  x.beginPath(); x.arc(hx, hy, 16 + 26 * (1 - Math.exp(-pk * 6)), 0, TAU); x.globalAlpha = Math.exp(-pk * 5); x.stroke(); x.globalAlpha = 1;
  x.restore();
  x.font = font(500, 22, MONO); x.fillStyle = 'rgba(241,237,228,0.75)'; x.textAlign = 'left';
  x.fillText('x(s) = [300·sin(2.01s) + 160·sin(3s + φ)]·e^(−δs)', 96, 900);
  x.fillText('y(s) = [300·sin(3s + 0.8) + 160·sin(2s + φ/2)]·e^(−δs)', 96, 934);
  x.font = font(400, 20, MONO); x.fillStyle = 'rgba(241,237,228,0.45)';
  x.fillText(`one path · ${count.toLocaleString('en-US')} / ${HG_N.toLocaleString('en-US')} vertices · φ drifts with t`, 96, 980);
}

// ================================================================= 13 recap
const RECAP_CUTS = [24, 24.25, 24.5, 24.625, 24.75, 24.875, 25, 25 + 1 / 12, 25 + 2 / 12, 25 + 3 / 12, 25 + 4 / 12, 25 + 5 / 12];
const RECAP_LT = [1.5, 1.95, 1.62, 1.3, 0.8, 1.15, 1.0, 1.3, 0.52, 1.0, 1.45, 1.9];
function sRecap(x, t) {
  let k = 0;
  while (k < 11 && t >= RECAP_CUTS[k + 1] - 1e-9) k++;
  const t0 = RECAP_CUTS[k], t1 = k < 11 ? RECAP_CUTS[k + 1] : 25.5, p = clamp((t - t0) / (t1 - t0));
  renderSeg(k, bufR.x, 2 * k + RECAP_LT[k] + (t - t0));
  const s = 1.14 - 0.14 * E.outCubic(p), rot = (k % 2 ? 1 : -1) * 0.025 * (1 - p);
  bg(x, COL.ink);
  x.save(); x.translate(W / 2, H / 2); x.rotate(rot); x.scale(s, s);
  x.drawImage(bufR.c, -W / 2, -H / 2); x.restore();
  if (t - t0 < 1 / FPS - 1e-6) { x.fillStyle = 'rgba(255,255,255,0.22)'; x.fillRect(0, 0, W, H); }
  x.save();
  x.font = font(900, 300); x.textAlign = 'right'; x.textBaseline = 'alphabetic';
  x.lineWidth = 4; x.strokeStyle = COL.accent; x.strokeText(String(k + 1).padStart(2, '0'), W - 80, H - 110);
  x.restore();
  for (let i = 0; i < 12; i++) { x.fillStyle = i <= k ? COL.accent : 'rgba(241,237,228,0.25)'; x.fillRect(560 + i * 68, H - 100, 56, 8); }
}

// ===================================================== silence + logo outro
const LOGO = { size: 250, R: 36, gap: 20, base: 600, g: 9000, c: 0.035, word: 'MOTION' };
function logoLayout(x) {
  x.font = font(900, LOGO.size);
  const tw = x.measureText(LOGO.word).width, total = tw + LOGO.gap + LOGO.R * 2, left = W / 2 - total / 2;
  return { left, tw, bx: left + tw + LOGO.gap + LOGO.R, by: LOGO.base - LOGO.R };
}
const LOGO_HITS = [[0, 0.55], [0.5, 0.3], [0.75, 0.16], [0.875, 0.06]];
function logoBall(lt, L) { // lt relative to the hit at 26 s; lt < 0 is the silent fall
  const { g, c, R } = LOGO, rest = L.by;
  if (lt < -c) { const tt = -lt; return { x: L.bx, y: rest - 0.5 * g * tt * tt, vx: 0, vy: g * tt, sq: 0 }; }
  for (let k = 0; k < LOGO_HITS.length; k++) {
    const [th, amt] = LOGO_HITS[k], d = lt - th;
    if (Math.abs(d) < c) return { x: L.bx, y: LOGO.base - R * (1 - amt * (1 - (d / c) ** 2)), vx: 0, vy: 0, sq: amt * (1 - (d / c) ** 2) };
    const next = LOGO_HITS[k + 1];
    if (next && lt > th + c && lt < next[0] - c) {
      const T = next[0] - th - 2 * c, u = (lt - th - c) / T, hgt = g * T * T / 8;
      return { x: L.bx, y: rest - hgt * 4 * u * (1 - u), vx: 0, vy: -hgt * 4 * (1 - 2 * u) / T, sq: 0 };
    }
  }
  return { x: L.bx, y: rest, vx: 0, vy: 0, sq: 0 };
}
function drawSilence(x, t) {
  bg(x, COL.ink);
  const L = logoLayout(x), lt = t - 26, s = logoBall(lt, L);
  const near = clamp(1 + lt / 0.5);
  x.fillStyle = `rgba(0,0,0,${0.5 * near})`;
  x.beginPath(); x.ellipse(L.bx, LOGO.base + 4, LOGO.R * near, 7 * near, 0, 0, TAU); x.fill();
  drawBall(x, s, LOGO.R, COL.accent);
}
function drawLogo(x, lt) {
  bg(x, COL.ink);
  const L = logoLayout(x);
  const shake = 28 * Math.exp(-lt * 9);
  const dx = (noise1(lt * 45, 1) - 0.5) * 2 * shake, dy = (noise1(lt * 45, 2) - 0.5) * 2 * shake;
  const fade = 1 - inv(3.3, 3.8, lt);
  x.save(); x.translate(dx, dy);
  // shock rings + speed lines
  for (const [delay, col, wmax] of [[0, COL.paper, 16], [0.08, COL.accent, 10]]) {
    const p = clamp((lt - delay) / 0.9);
    if (p <= 0 || p >= 1) continue;
    x.strokeStyle = col; x.globalAlpha = (1 - p) * 0.8; x.lineWidth = wmax * (1 - p) + 1;
    x.beginPath(); x.arc(L.bx, LOGO.base, 40 + 1500 * E.outCubic(p), 0, TAU); x.stroke();
  }
  x.globalAlpha = 1;
  const sp = clamp(lt / 0.35);
  if (sp < 1) {
    x.strokeStyle = `rgba(241,237,228,${0.5 * (1 - sp)})`; x.lineWidth = 3;
    x.beginPath();
    for (let k = 0; k < 28; k++) {
      const a = k / 28 * TAU + hash(k) * 0.2, r0 = 120 + 900 * E.outCubic(sp), r1 = r0 + 80 + 200 * hash(k + 5);
      x.moveTo(L.bx + Math.cos(a) * r0, LOGO.base + Math.sin(a) * r0); x.lineTo(L.bx + Math.cos(a) * r1, LOGO.base + Math.sin(a) * r1);
    }
    x.stroke();
  }
  // wordmark slam with a damped squash
  const sl = 1 + 0.32 * (1 - E.outExpo(clamp(lt / 0.28)));
  const wob = Math.exp(-lt * 9) * Math.cos(lt * 32);
  x.save();
  x.globalAlpha = fade;
  x.translate(L.left + L.tw / 2, LOGO.base);
  x.scale(sl * (1 + 0.1 * wob), sl * (1 - 0.18 * wob));
  x.font = font(900, LOGO.size); x.textAlign = 'center'; x.textBaseline = 'alphabetic'; x.fillStyle = COL.paper;
  x.fillText(LOGO.word, 0, 0);
  x.restore();
  // the ball from shot one, now the full stop
  const s = logoBall(lt, L);
  drawBall(x, s, LOGO.R, COL.accent, 1 - inv(3.62, 3.95, lt));
  // sub lines
  x.globalAlpha = fade;
  const p1 = E.outCubic(clamp((lt - 1.0) / 0.6));
  if (p1 > 0) {
    x.font = font(600, 34); x.textAlign = 'center'; x.fillStyle = COL.paper;
    x.letterSpacing = `${lerp(40, 14, p1)}px`;
    x.globalAlpha = p1 * fade;
    x.fillText('MOTION DESIGN PORTFOLIO — 2026', W / 2, LOGO.base + 100);
    x.letterSpacing = '0px';
  }
  const p2 = E.outCubic(clamp((lt - 1.25) / 0.5));
  if (p2 > 0) {
    x.globalAlpha = p2 * fade * 0.85; x.font = `400 30px ${CJK}`; x.fillStyle = COL.paper; x.letterSpacing = '10px';
    x.fillText('动态设计作品集', W / 2, LOGO.base + 150); x.letterSpacing = '0px';
  }
  const p3 = E.outExpo(clamp((lt - 1.5) / 0.5));
  if (p3 > 0) {
    x.globalAlpha = fade;
    x.fillStyle = COL.accent; x.fillRect(W / 2 - 280 * p3, LOGO.base + 195, 560 * p3, 3);
    x.globalAlpha = p3 * fade; x.font = font(500, 20, MONO); x.fillStyle = COL.paper;
    x.fillText('13 TECHNIQUES · 30 SECONDS · 0 EXTERNAL ASSETS', W / 2, LOGO.base + 245);
    x.globalAlpha = p3 * fade * 0.5;
    x.fillText('Canvas 2D · Playwright · ffmpeg · numpy', W / 2, LOGO.base + 280);
  }
  x.globalAlpha = 1;
  x.restore();
  const fl = lt < 1 / FPS ? 0.92 : 0.92 * Math.exp(-lt * 16);
  if (fl > 0.01) { x.fillStyle = `rgba(255,255,255,${fl})`; x.fillRect(0, 0, W, H); }
}

// ============================================================ transitions
function tIris(x, p, A, B) {
  x.drawImage(A(), 0, 0);
  const cx = BALL.x1, cy = BALL.floor, r = 1800 * E.outCubic(p);
  x.save(); x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.clip(); x.drawImage(B(), 0, 0); x.restore();
  x.strokeStyle = COL.accent; x.lineWidth = 30 * (1 - p) + 2; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.stroke();
}
function tWhip(x, p, A, B) {
  const a = A(), b = B(), n = 7, shutter = 0.5 / (FPS * 0.3);
  for (let i = 0; i < n; i++) {
    const e = E.inOutCubic(clamp(p + (i / (n - 1) - 0.5) * shutter));
    bufT.x.drawImage(a, -W * e, 0); bufT.x.drawImage(b, W * (1 - e), 0);
    x.globalAlpha = 1 / (i + 1); x.drawImage(bufT.c, 0, 0);
  }
  x.globalAlpha = 1;
}
function tBarn(x, p, A, B) {
  x.drawImage(B(), 0, 0);
  const a = A(), e = E.outQuart(p) * (H / 2 + 60);
  x.drawImage(a, 0, 0, W, H / 2, 0, -e, W, H / 2);
  x.drawImage(a, 0, H / 2, W, H / 2, 0, H / 2 + e, W, H / 2);
  x.fillStyle = 'rgba(0,0,0,0.4)'; x.fillRect(0, H / 2 - e, W, 14); x.fillRect(0, H / 2 + e - 14, W, 14);
  if (p < 0.35) { x.fillStyle = `rgba(255,255,255,${1 - p / 0.35})`; x.fillRect(0, H / 2 - e - 3, W, 6); x.fillRect(0, H / 2 + e - 3, W, 6); }
}
let PIX = null;
function tPixel(x, p, A, B) {
  const src = p < 0.5 ? A() : B();
  const q = p < 0.5 ? p / 0.5 : (1 - p) / 0.5;
  const size = Math.max(1, Math.round(Math.pow(2, 6.5 * q)));
  if (size <= 1) { x.drawImage(src, 0, 0); return; }
  if (!PIX) PIX = buf(W, H);
  const sw = Math.ceil(W / size), sh = Math.ceil(H / size);
  PIX.x.imageSmoothingEnabled = true;
  PIX.x.drawImage(src, 0, 0, sw, sh);
  x.imageSmoothingEnabled = false;
  x.drawImage(PIX.c, 0, 0, sw, sh, 0, 0, sw * size, sh * size);
  x.imageSmoothingEnabled = true;
}
function tBlinds(x, p, A, B) {
  x.drawImage(A(), 0, 0);
  const b = B(), n = 12, sw = W / n;
  for (let k = 0; k < n; k++) {
    const e = E.outCubic(clamp((p - k * 0.035) / (1 - (n - 1) * 0.035)));
    if (e <= 0) continue;
    const w = sw * e, x0 = k * sw + (sw - w) / 2;
    x.drawImage(b, x0, 0, w, H, x0, 0, w, H);
    if (e < 1) { x.fillStyle = `rgba(255,255,255,${0.8 * (1 - e)})`; x.fillRect(x0 - 2, 0, 3, H); x.fillRect(x0 + w - 1, 0, 3, H); }
  }
}
function tClock(x, p, A, B) {
  x.drawImage(A(), 0, 0);
  const e = E.inOutCubic(p), a0 = -Math.PI / 2, a1 = a0 + TAU * e;
  x.save(); x.beginPath(); x.moveTo(W / 2, H / 2); x.arc(W / 2, H / 2, 1400, a0, a1); x.closePath(); x.clip();
  x.drawImage(B(), 0, 0); x.restore();
  if (e < 1) { x.strokeStyle = COL.paper; x.lineWidth = 5; x.beginPath(); x.moveTo(W / 2, H / 2); x.lineTo(W / 2 + Math.cos(a1) * 1400, H / 2 + Math.sin(a1) * 1400); x.stroke(); }
}
function tDrip(x, p, A, B) {
  x.drawImage(A(), 0, 0);
  const e = E.inOutCubic(p), base = lerp(-420, H + 40, e);
  const edge = xx => {
    let y = base + 14 * Math.sin(xx * 0.012 + p * 9);
    for (let d = 0; d < 16; d++) {
      const xc = (d + hash(d + 70) * 0.8) * W / 15, w = 40 + 70 * hash(d + 71), L = (120 + 320 * hash(d + 72)) * Math.sin(Math.min(1, e * 1.6) * Math.PI / 2);
      const u = (xx - xc) / w;
      if (Math.abs(u) < 1) y = Math.max(y, base + L * Math.sqrt(1 - u * u));
    }
    return y;
  };
  const path = (dy) => {
    x.beginPath(); x.moveTo(0, -10); x.lineTo(W, -10);
    for (let xx = W; xx >= 0; xx -= 6) x.lineTo(xx, edge(xx) + dy);
    x.closePath();
  };
  path(14); x.fillStyle = 'rgba(0,0,0,0.35)'; x.fill();
  x.save(); path(0); x.clip(); x.drawImage(B(), 0, 0); x.restore();
}
function tTiles(x, p, A, B) {
  bg(x, COL.ink);
  const a = A(), b = B(), cols = 12, rows = 6, tw = W / cols, th = H / rows;
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const q = clamp((p - (i + j) * 0.04) / 0.36), ang = q * Math.PI, src = q < 0.5 ? a : b;
    const sc = Math.abs(Math.cos(ang)), w = tw * sc;
    if (w < 0.5) continue;
    x.drawImage(src, i * tw, j * th, tw, th, i * tw + (tw - w) / 2, j * th, w, th);
    x.fillStyle = `rgba(0,0,0,${0.5 * Math.sin(ang)})`; x.fillRect(i * tw + (tw - w) / 2, j * th, w, th);
  }
}
function tCRT(x, p, A, B, t) {
  bg(x, '#000');
  if (t < 18) {
    const q = clamp((t - 17.8) / 0.2);
    const sy = q < 0.6 ? lerp(1, 0.004, E.inCubic(q / 0.6)) : 0.004, sx = q < 0.6 ? 1 : lerp(1, 0.002, E.inCubic((q - 0.6) / 0.4));
    x.save(); x.translate(W / 2, H / 2); x.scale(sx, sy); x.drawImage(A(), -W / 2, -H / 2);
    x.globalCompositeOperation = 'lighter'; x.fillStyle = `rgba(255,255,255,${q})`; x.fillRect(-W / 2, -H / 2, W, H); x.restore();
    const gw = Math.max(8, W * sx);
    const g = x.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, gw / 2);
    g.addColorStop(0, `rgba(200,230,255,${0.6 * q})`); g.addColorStop(1, 'rgba(200,230,255,0)');
    x.fillStyle = g; x.fillRect(W / 2 - gw / 2, H / 2 - 60, gw, 120);
  } else {
    const q = clamp((t - 18) / 0.17), sy = Math.max(0.004, E.outExpo(q));
    x.save(); x.translate(W / 2, H / 2); x.scale(1, sy); x.drawImage(B(), -W / 2, -H / 2); x.restore();
    x.fillStyle = `rgba(255,255,255,${0.7 * (1 - q)})`; x.fillRect(0, 0, W, H);
  }
}
function rotY(x, src, phi) {
  const f = 2200, n = 48, sw = W / n, c = Math.cos(phi), s = Math.sin(phi);
  const X = x0 => { const z = x0 * s; return [W / 2 + x0 * c * f / (f + z), f / (f + z)]; };
  for (let k = 0; k < n; k++) {
    const x0 = -W / 2 + k * sw, [a] = X(x0), [b] = X(x0 + sw), [, m] = X(x0 + sw / 2);
    if (b - a <= 0) continue;
    const dh = H * m;
    x.drawImage(src, k * sw, 0, sw, H, a, H / 2 - dh / 2, b - a + 0.6, dh);
  }
  const [la, ls] = X(-W / 2), [ra, rs] = X(W / 2);
  x.beginPath(); x.moveTo(la, H / 2 - H * ls / 2); x.lineTo(ra, H / 2 - H * rs / 2); x.lineTo(ra, H / 2 + H * rs / 2); x.lineTo(la, H / 2 + H * ls / 2); x.closePath();
  x.fillStyle = `rgba(0,0,0,${0.6 * Math.abs(s)})`; x.fill();
}
function tFlip(x, p, A, B) {
  bg(x, '#07070a');
  if (p < 0.5) rotY(x, A(), E.inCubic(p / 0.5) * Math.PI / 2 * 0.999);
  else rotY(x, B(), -(1 - E.outCubic((p - 0.5) / 0.5)) * Math.PI / 2 * 0.999);
}
function tLine(x, p, A, B) {
  x.drawImage(A(), 0, 0);
  const ang = -1.15, nx = Math.cos(ang), ny = Math.sin(ang), tx = -ny, ty = nx;
  const d = lerp(-1250, 1250, E.inOutCubic(p)), cx = W / 2 + nx * d, cy = H / 2 + ny * d;
  x.save(); x.beginPath();
  x.moveTo(cx + tx * 3000, cy + ty * 3000); x.lineTo(cx - tx * 3000, cy - ty * 3000);
  x.lineTo(cx - tx * 3000 - nx * 5000, cy - ty * 3000 - ny * 5000); x.lineTo(cx + tx * 3000 - nx * 5000, cy + ty * 3000 - ny * 5000);
  x.closePath(); x.clip(); x.drawImage(B(), 0, 0); x.restore();
  x.strokeStyle = COL.mint; x.lineWidth = 12; x.globalAlpha = 0.3;
  x.beginPath(); x.moveTo(cx + tx * 3000, cy + ty * 3000); x.lineTo(cx - tx * 3000, cy - ty * 3000); x.stroke();
  x.globalAlpha = 1; x.strokeStyle = '#fff'; x.lineWidth = 3; x.stroke();
}
function tSpin(x, p, A) {
  const a = A(), n = 8;
  bg(x, '#000');
  for (let i = 0; i < n; i++) {
    const q = E.inCubic(clamp(p - i * 0.025));
    x.save(); x.translate(W / 2, H / 2); x.rotate(q * 0.9); x.scale(1 + q * 1.8, 1 + q * 1.8);
    x.globalAlpha = 1 / (i + 1); x.drawImage(a, -W / 2, -H / 2); x.restore();
  }
  x.globalAlpha = 1;
  x.fillStyle = `rgba(255,255,255,${0.55 * E.inCubic(p)})`; x.fillRect(0, 0, W, H);
}
// Every transition is anchored on a downbeat c; [a, b] is its window around c.
const TRANS = [
  { c: 2, a: 0, b: 0.3, f: tIris, name: 'iris from impact' },
  { c: 4, a: -0.15, b: 0.15, f: tWhip, name: 'whip pan + motion blur' },
  { c: 6, a: 0, b: 0.3, f: tBarn, name: 'barn doors' },
  { c: 8, a: -0.2, b: 0.2, f: tPixel, name: 'pixelate' },
  { c: 10, a: 0, b: 0.3, f: tBlinds, name: 'venetian blinds' },
  { c: 12, a: 0, b: 0.3, f: tClock, name: 'clock wipe' },
  { c: 14, a: 0, b: 0.36, f: tDrip, name: 'liquid drip' },
  { c: 16, a: 0, b: 0.36, f: tTiles, name: 'tile flip' },
  { c: 18, a: -0.2, b: 0.17, f: tCRT, name: 'CRT power-off' },
  { c: 20, a: -0.15, b: 0.15, f: tFlip, name: '3D card flip' },
  { c: 22, a: 0, b: 0.3, f: tLine, name: 'line wipe' },
  { c: 24, a: -0.25, b: 0, f: tSpin, name: 'spin-zoom blur' },
];

// ================================================================ HUD/grain
const TITLES = [
  ['Squash & Stretch', '弹跳小球 · 挤压拉伸'], ['Kinetic Type', '逐字动态排版'], ['Shape Morph', '形状变形'],
  ['Easing Editor', '缓动曲线编辑器'], ['9,000 Particles', '九千粒子拼字'], ['3D Point Cloud', '纯代码 3D 点云'],
  ['Liquid Metaballs', '液态元球'], ['Swiss Grid Wave', '瑞士网格波'], ['Glitch Art', '故障艺术'],
  ['Infinite Zoom', '无限缩放'], ['Isometric City', '等距城市'], ['Harmonograph', '单线谐波图'], ['Supercut', '加速快切回顾'],
];
const LIGHT = [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0];
function drawHUD(x, t) {
  const seg = Math.min(12, Math.floor(t / SEG)), lt = t - seg * SEG;
  const light = LIGHT[seg] && !(t < 14.2);
  const fg = light ? '17,17,17' : '241,237,228';
  x.save();
  if (!light) { x.shadowColor = 'rgba(0,0,0,0.55)'; x.shadowBlur = 10; }
  x.textBaseline = 'alphabetic'; x.textAlign = 'left';
  const e = E.outCubic(clamp(lt / 0.25));
  x.font = font(600, 20, MONO); x.fillStyle = `rgba(${fg},0.85)`;
  x.fillText(`${String(seg + 1).padStart(2, '0')} / 13`, 64, 74);
  x.fillStyle = COL.accent; x.fillRect(64, 88, 96, 3);
  x.save(); x.beginPath(); x.rect(180, 40, 700, 80); x.clip();
  x.globalAlpha = e; x.translate(0, (1 - e) * 30);
  x.font = font(700, 28); x.fillStyle = `rgba(${fg},0.95)`; x.fillText(TITLES[seg][0], 184, 78);
  const tw = x.measureText(TITLES[seg][0]).width;
  x.font = `400 22px ${CJK}`; x.fillStyle = `rgba(${fg},0.55)`; x.fillText(TITLES[seg][1], 184 + tw + 18, 77);
  x.restore();
  const f = Math.round(t * FPS), ss = Math.floor(f / FPS), ff = f % FPS;
  x.textAlign = 'right'; x.font = font(500, 20, MONO); x.fillStyle = `rgba(${fg},0.7)`;
  x.fillText(`00:00:${String(ss).padStart(2, '0')}:${String(ff).padStart(2, '0')}`, W - 64, 74);
  const beat = Math.floor(t / BEAT) % 4, bp = Math.exp(-mod(t, BEAT) * 8);
  for (let b = 0; b < 4; b++) {
    const on = b === beat, s = on ? 14 + 6 * bp : 12;
    x.fillStyle = on ? COL.accent : `rgba(${fg},0.25)`;
    x.fillRect(W - 64 - (3 - b) * 26 - 14 - (s - 14) / 2, H - 70 - s / 2, s, s);
  }
  x.font = font(500, 18, MONO); x.fillStyle = `rgba(${fg},0.6)`;
  x.fillText('120 BPM', W - 180, H - 63);
  x.textAlign = 'left';
  x.fillText('MOTION — PORTFOLIO 2026', 64, H - 63);
  x.fillStyle = `rgba(${fg},0.12)`; x.fillRect(0, H - 4, W, 4);
  x.fillStyle = COL.accent; x.fillRect(0, H - 4, W * clamp(t / 25.5), 4);
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
  const g = v.x.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 1.05);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.42)');
  v.x.fillStyle = g; v.x.fillRect(0, 0, W, H);
  GRAIN.vig = v.c;
}
function drawGrain(x, t) {
  const f = Math.round(t * FPS);
  x.save();
  x.globalCompositeOperation = 'overlay'; x.globalAlpha = 0.07;
  x.drawImage(GRAIN[f % 4], 0, 0, W, H);
  x.globalCompositeOperation = 'source-over';
  x.globalAlpha = (t >= 14.2 && t < 16) ? 0.25 : 1;
  x.drawImage(GRAIN.vig, 0, 0);
  x.restore();
}

// ================================================================== main
const SCENES = [sBall, sTypo, sMorph, sEasing, sParticles, sCloud, sMeta, sSwiss, sGlitch, sZoom, sCity, sHarmo];
function renderSeg(k, x, t) {
  x.save();
  x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.filter = 'none';
  if (k === 12) sRecap(x, t); else SCENES[k](x, t - k * SEG);
  x.restore();
}
function renderFrame(t) {
  const x = ctx;
  x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
  if (t >= 26) drawLogo(x, t - 26);
  else if (t >= 25.5) drawSilence(x, t);
  else {
    const tr = TRANS.find(r => t >= r.c + r.a - 1e-9 && t < r.c + r.b - 1e-9);
    if (tr) {
      const i = tr.c / SEG;
      const A = () => { renderSeg(i - 1, bufA.x, t); return bufA.c; };
      const B = () => { renderSeg(i, bufB.x, t); return bufB.c; };
      x.save(); tr.f(x, (t - tr.c - tr.a) / (tr.b - tr.a), A, B, t); x.restore();
    } else renderSeg(Math.min(12, Math.floor(t / SEG + 1e-9)), x, t);
    drawHUD(x, t);
  }
  drawGrain(x, t);
}

async function init() {
  await Promise.all([font(900, 100), font(100, 100), font(500, 20, MONO), `700 100px ${CJK}`, `italic 700 100px ${SERIF}`].map(f => document.fonts.load(f).catch(() => null)));
  initParticles(); initPointCloud(); initMeta(); initGlitch(); initCity(); initGrain();
  window.__ready = true;
  if (location.search.includes('play')) {
    document.body.classList.add('preview');
    const audio = new Audio('out/music.wav');
    const t0 = performance.now();
    audio.play().catch(() => null);
    const loop = () => {
      const t = audio.currentTime > 0 ? audio.currentTime : (performance.now() - t0) / 1000;
      renderFrame(Math.min(DURATION - 1 / FPS, t));
      if (t < DURATION) requestAnimationFrame(loop);
    };
    loop();
  } else {
    const m = location.search.match(/t=([\d.]+)/);
    renderFrame(m ? parseFloat(m[1]) : 0);
  }
}
window.renderFrame = renderFrame;
window.TRANS = TRANS;
init();
