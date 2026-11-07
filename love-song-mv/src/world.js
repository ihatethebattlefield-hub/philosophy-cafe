'use strict';
/*
 * Light and time of day. The story runs from mid-afternoon to a warm night; the
 * grade is a function of song time, so every shot at a given moment shares the
 * same sun. Keys: afternoon → golden hour → sunset → blue hour → night.
 */
const TOD_KEYS = [
  // k, sky top → horizon (4 bands), ambient tint, tint alpha, sunlight colour, lights-on (0..1)
  { k: 0.00, sky: ['#8bb8d8', '#a8cbe2', '#c8dfe9', '#e6eee9'], tint: P.honey0, a: 0.00, sun: '#fff1c9', lights: 0.0 },
  { k: 0.32, sky: ['#9dbdd8', '#c4d4dc', '#ecdcbc', '#f6d29a'], tint: P.honey1, a: 0.06, sun: '#ffe2a0', lights: 0.0 },
  { k: 0.52, sky: ['#8a8fb8', '#c99a9c', '#eeae84', '#f6c886'], tint: P.brick0, a: 0.09, sun: '#ffc27a', lights: 0.25 },
  { k: 0.70, sky: ['#36406e', '#56598a', '#8f7a9c', '#c99a95'], tint: P.ink2, a: 0.20, sun: '#e9a98a', lights: 0.75 },
  { k: 1.00, sky: ['#171b36', '#1f2647', '#2b3459', '#3c4670'], tint: P.ink0, a: 0.32, sun: '#000000', lights: 1.0 },
];
function mixHex(a, b, f) {
  const A = hexRgb(a), B = hexRgb(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * f).toString(16).padStart(2, '0')).join('');
}
// Story-time key k (0..1) for a song time t — set per section in data/storyboard.js.
function todAt(k) {
  k = clamp(k);
  let i = 0; while (i < TOD_KEYS.length - 2 && TOD_KEYS[i + 1].k < k) i++;
  const A = TOD_KEYS[i], B = TOD_KEYS[i + 1], f = clamp((k - A.k) / (B.k - A.k));
  return { k, sky: A.sky.map((c, j) => mixHex(c, B.sky[j], f)), tint: mixHex(A.tint, B.tint, f), a: lerp(A.a, B.a, f), sun: mixHex(A.sun, B.sun, f), lights: lerp(A.lights, B.lights, f), sunA: clamp(1 - k / 0.72) };
}
function skyGrad(x, px, py, w, h, T) { const bh = Math.ceil(h / 4); T.sky.forEach((c, i) => rect(x, px, py + i * bh, w, bh + 1, c)); }
function grade(x, R, T) { shade(x, R.x, R.y, R.w, R.h, T.tint, T.a); }
function starsAt(x, px, py, w, h, t, n, seed, T) {
  const a = clamp((T.k - 0.72) / 0.2); if (a <= 0) return;
  for (let k = 0; k < n * a; k++) { const sx = px + hash(k * 7 + seed) * w, sy = py + hash(k * 13 + seed) * h, tw = mod(t * 0.4 + hash(k + seed), 1); pset(x, sx, sy, tw < 0.9 ? P.ink4 : P.cream0); }
}
// A soft-edged light pool: three nested translucent ellipses.
function pool(x, cx, cy, rx, ry, col, s) { glow(x, cx, cy, rx, ry, col, s); }
