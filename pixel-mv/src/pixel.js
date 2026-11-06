'use strict';
/*
 * 双人存档 — pixel core.
 * Everything is drawn on a 270×480 logical canvas with integer coordinates and
 * scaled ×4 (nearest neighbour) to 1080×1920 at the very end. ×4 matters: the
 * 4×4 blocks line up with H.264's 2×2 colour sampling (yuv420p), so pixel edges
 * stay clean after encoding. Light is drawn as a few hard-edged translucent
 * steps, not dither noise. Every function here is pure of time except where t is passed.
 */
const LW = 270, LH = 480, SCALE = 4, FPS = 30;

// ------------------------------------------------------------- palette
// Low-saturation blue-violet nights, warm amber interiors, coral accents.
const P = {
  void: '#0e0c18', night0: '#17142a', night1: '#211d3b', night2: '#2d2850', night3: '#3d3768', night4: '#55508a', night5: '#7a76ad',
  dusk0: '#3a2338', dusk1: '#6a3a4c', dusk2: '#a3555a', dusk3: '#d9845e', dusk4: '#f2b874',
  wood0: '#2e1c15', wood1: '#4a2e1f', wood2: '#6b4429', wood3: '#8c5c36', wood4: '#b07a46',
  amber0: '#c7853e', amber1: '#e7a94f', amber2: '#f6cf7a', amber3: '#fff0b8',
  brick0: '#3b2026', brick1: '#5c2f30', brick2: '#7e4038', brick3: '#9b5745',
  stone0: '#2a2836', stone1: '#43414f', stone2: '#5f5c6b', stone3: '#8a8796', stone4: '#b9b5c1',
  cream0: '#f6ead0', cream1: '#e9d6ae', cream2: '#cdb184', brown0: '#2f1c12', brown1: '#4e3020', brown2: '#7a4e30',
  coral0: '#ff7a63', coral1: '#d8503f', coral2: '#a0342e', coral3: '#ffb19b',
  blue0: '#4c7fd6', blue1: '#33589f', blue2: '#243e73', blue3: '#7fa8ec',
  skin0: '#f6cfa8', skin1: '#dca07a', skin2: '#a96e55',
  hairA0: '#1b1a2c', hairA1: '#2f2d4a', hairB0: '#5a3320', hairB1: '#83502f', hairB2: '#a8713f',
  green0: '#2f4c3a', green1: '#457254', green2: '#6aa06a',
  white: '#fbf6ea', ink: '#140f1c', glass: '#9fb7d8', rain: '#8fa6cf', screen: '#bfe3f0',
};

// ------------------------------------------------------------- helpers
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const inv = (a, b, v) => clamp((v - a) / (b - a));
const mod = (a, n) => ((a % n) + n) % n;
const ri = Math.round;
const TAU = Math.PI * 2;
const E = {
  inOut: x => x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2,
  out: x => 1 - (1 - x) * (1 - x),
  in: x => x * x,
  outBack: (x, s = 1.6) => 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2),
  step: (x, n) => Math.floor(x * n) / n, // quantised easing for UI that should tick
};
function hash(n) {
  n = Math.imul((n | 0) ^ 0x27d4eb2d, 0x9e3779b1);
  n ^= n >>> 15; n = Math.imul(n, 0x85ebca77);
  n ^= n >>> 13; n = Math.imul(n, 0xc2b2ae3d);
  n ^= n >>> 16;
  return (n >>> 0) / 4294967296;
}
const hash2 = (a, b) => hash(Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263));
const hash3 = (a, b, c) => hash(Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) + Math.imul(c | 0, 1274126177));
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
function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d');
  x.imageSmoothingEnabled = false;
  return { c, x, w, h };
}

// ------------------------------------------------------------- primitives
// All coordinates are rounded to whole logical pixels before they touch the canvas.
function rect(x, px, py, w, h, col) { x.fillStyle = col; x.fillRect(ri(px), ri(py), ri(w), ri(h)); }
function pset(x, px, py, col) { x.fillStyle = col; x.fillRect(ri(px), ri(py), 1, 1); }
function hline(x, x0, x1, y, col) { rect(x, Math.min(x0, x1), y, Math.abs(x1 - x0) + 1, 1, col); }
function vline(x, xx, y0, y1, col) { rect(x, xx, Math.min(y0, y1), 1, Math.abs(y1 - y0) + 1, col); }
function line(x, x0, y0, x1, y1, col) { // Bresenham, 1-px
  x0 = ri(x0); y0 = ri(y0); x1 = ri(x1); y1 = ri(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  x.fillStyle = col;
  for (let n = 0; n < 2000; n++) {
    x.fillRect(x0, y0, 1, 1);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}
function box(x, px, py, w, h, fill, edge) { rect(x, px, py, w, h, edge); rect(x, px + 1, py + 1, w - 2, h - 2, fill); }
function disc(x, cx, cy, r, col) { // pixel circle
  x.fillStyle = col;
  for (let y = -r; y <= r; y++) {
    const w = Math.floor(Math.sqrt(r * r - y * y + r * 0.8));
    x.fillRect(ri(cx - w), ri(cy + y), 2 * w + 1, 1);
  }
}
// 4×4 Bayer ordered dither: fills the pixels of a rect whose threshold is below `level` (0..1).
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16);
function dither(x, px, py, w, h, col, level) {
  if (level <= 0) return;
  if (level >= 1) { rect(x, px, py, w, h, col); return; }
  x.fillStyle = col;
  px = ri(px); py = ri(py);
  for (let y = 0; y < h; y++) for (let xx = 0; xx < w; xx++) if (BAYER[((py + y) & 3) * 4 + ((px + xx) & 3)] < level) x.fillRect(px + xx, py + y, 1, 1);
}
// Pixel ellipse filled row by row (no anti-aliasing).
function ellipse(x, cx, cy, rx, ry, col) {
  x.fillStyle = col;
  for (let y = -ry; y <= ry; y++) {
    const w = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry + 0.0001))) + 0.3);
    if (w >= 0) x.fillRect(ri(cx - w), ri(cy + y), 2 * w + 1, 1);
  }
}
// Light pool: three nested hard-edged ellipses of translucent light, the way
// lamplight is usually painted in pixel art — clean bands instead of noise.
function glow(x, cx, cy, rx, ry, col, strength = 0.5) {
  if (strength <= 0) return;
  x.save();
  for (const [k, a] of [[1, 0.28], [0.68, 0.32], [0.4, 0.4]]) {
    x.globalAlpha = a * strength;
    ellipse(x, cx, cy, Math.max(1, ri(rx * k)), Math.max(1, ri(ry * k)), col);
  }
  x.restore();
}
// Translucent flat overlay (time-of-day grading, shadows) — whole pixels, one alpha.
function shade(x, px, py, w, h, col, a) { if (a <= 0) return; x.save(); x.globalAlpha = a; rect(x, px, py, w, h, col); x.restore(); }

// ------------------------------------------------------------- sprites
// A sprite is an ASCII pixel map plus a key → colour table. Maps are parsed once
// into tiny canvases and blitted at integer positions (optionally mirrored).
const SPR = new Map();
function sprite(name, rows, keys) {
  const h = rows.length, w = Math.max(...rows.map(r => r.length));
  const s = canvas(w, h);
  for (let y = 0; y < h; y++) for (let xx = 0; xx < rows[y].length; xx++) {
    const k = rows[y][xx];
    if (k === '.' || k === ' ') continue;
    const col = keys[k];
    if (!col) throw new Error(`sprite ${name}: no colour for '${k}'`);
    s.x.fillStyle = col; s.x.fillRect(xx, y, 1, 1);
  }
  SPR.set(name, s);
  return s;
}
function blit(x, name, px, py, o = {}) {
  const s = typeof name === 'string' ? SPR.get(name) : name;
  if (!s) throw new Error('missing sprite ' + name);
  const sc = o.scale || 1;
  x.save();
  if (o.alpha !== undefined) x.globalAlpha = o.alpha;
  if (o.flip) { x.translate(ri(px) + s.w * sc, ri(py)); x.scale(-1, 1); x.drawImage(s.c, 0, 0, s.w * sc, s.h * sc); }
  else x.drawImage(s.c, ri(px), ri(py), s.w * sc, s.h * sc);
  x.restore();
}
// Recolour a sprite (for night/day palette shifts) — cached per (sprite, map).
const TINT = new Map();
function tinted(name, map) {
  const key = name + '|' + JSON.stringify(map);
  if (TINT.has(key)) return TINT.get(key);
  const s = SPR.get(name), d = canvas(s.w, s.h);
  d.x.drawImage(s.c, 0, 0);
  const img = d.x.getImageData(0, 0, s.w, s.h), D = img.data;
  const hexes = Object.entries(map).map(([a, b]) => [hexRgb(a), hexRgb(b)]);
  for (let i = 0; i < D.length; i += 4) for (const [a, b] of hexes) if (D[i] === a[0] && D[i + 1] === a[1] && D[i + 2] === a[2]) { D[i] = b[0]; D[i + 1] = b[1]; D[i + 2] = b[2]; break; }
  d.x.putImageData(img, 0, 0);
  TINT.set(key, d);
  return d;
}
function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }

// ------------------------------------------------------------- pixel text
// Chinese text uses Fusion Pixel (OFL), a true bitmap font with 8/10/12 px
// designs; glyphs are rendered at their design size (or an exact integer
// multiple for titles) and thresholded, so every glyph is whole, crisp pixels.
const FONT = {
  tiny: { family: 'FP8', size: 8 },
  small: { family: 'FP10', size: 10 },
  ui: { family: 'FP12', size: 12 },
  big: { family: 'FP10', size: 20 },    // the 10 px design at exactly 2×
  title: { family: 'FP12', size: 24 },  // the 12 px design at exactly 2×
};
const GLYPH = new Map();
const MEAS = canvas(64, 32);
function glyph(ch, f) {
  const k = f.family + f.size + ch;
  let g = GLYPH.get(k);
  if (g) return g;
  MEAS.x.font = `${f.size}px ${f.family}`;
  const w = Math.max(1, Math.ceil(MEAS.x.measureText(ch).width));
  const c = canvas(w + 2, f.size + 4);
  c.x.font = `${f.size}px ${f.family}`; c.x.fillStyle = '#000'; c.x.textBaseline = 'top';
  c.x.fillText(ch, 1, 1);
  const img = c.x.getImageData(0, 0, c.w, c.h), D = img.data;
  for (let i = 0; i < D.length; i += 4) { const on = D[i + 3] >= 110; D[i] = D[i + 1] = D[i + 2] = 255; D[i + 3] = on ? 255 : 0; }
  c.x.putImageData(img, 0, 0);
  g = { c, w };
  GLYPH.set(k, g);
  return g;
}
const COLORED = new Map();
function glyphColored(ch, f, col) {
  const k = f.family + f.size + ch + col;
  let c = COLORED.get(k);
  if (c) return c;
  const g = glyph(ch, f), d = canvas(g.c.w, g.c.h);
  d.x.drawImage(g.c.c, 0, 0);
  d.x.globalCompositeOperation = 'source-in'; d.x.fillStyle = col; d.x.fillRect(0, 0, d.w, d.h);
  COLORED.set(k, d);
  return d;
}
function textWidth(s, f = FONT.ui, spacing = 0) { let w = 0; for (const ch of s) w += glyph(ch, f).w + spacing; return w - (s.length ? spacing : 0); }
// Draws text; returns the x positions of each character (for per-character highlight).
function text(x, s, px, py, col, f = FONT.ui, o = {}) {
  const sp = o.spacing ?? 0;
  let cx = o.align === 'center' ? ri(px - textWidth(s, f, sp) / 2) : o.align === 'right' ? ri(px - textWidth(s, f, sp)) : ri(px);
  const xs = [];
  let i = 0;
  for (const ch of s) {
    const g = glyph(ch, f), c = o.colors ? o.colors[i] : col;
    if (o.shadow) x.drawImage(glyphColored(ch, f, o.shadow).c, cx - 1, ri(py) - 1 + 1);
    if (c) x.drawImage(glyphColored(ch, f, c).c, cx - 1, ri(py) - 1);
    xs.push(cx); cx += g.w + sp; i++;
  }
  return xs;
}
