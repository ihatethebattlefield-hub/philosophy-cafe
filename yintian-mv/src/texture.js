'use strict';
/* Material textures and light helpers shared by every set. */
// ------------------------------------------------------------- textures and light
function plaster(x, R, base, a, b, seed) {
  rect(x, R.x, R.y, R.w, R.h, base);
  for (let k = 0; k < R.w * R.h / 40; k++) { const px = R.x + ri(hash(k * 3 + seed) * R.w), py = R.y + ri(hash(k * 5 + seed) * R.h); const c = hash(k + seed * 7) < 0.5 ? a : b; pset(x, px, py, c); if (hash(k + 11) < 0.4) pset(x, px + 1, py, c); }
}
function woodPlanks(x, R, top, grain, gap, hi, seed, perspective) {
  rect(x, R.x, R.y, R.w, R.h, top);
  let y = R.y, r = 0;
  while (y < R.y + R.h) {
    const hgt = perspective ? 6 + ri(r * 1.6) : 10;
    for (let k = 0; k < R.w / 9; k++) { const gx = R.x + hash2(r + seed, k) * R.w, len = 8 + hash2(k, r + seed) * 34; hline(x, gx, gx + len, y + 2 + ri(hash2(k + 3, r) * (hgt - 4)), grain); }
    if (hash(r + seed) < 0.5) { const kx = R.x + hash(r + seed + 9) * R.w; ellipse(x, kx, y + hgt / 2, 4, 1, grain); pset(x, kx, y + hgt / 2, gap); }
    hline(x, R.x, R.x + R.w, y, gap); hline(x, R.x, R.x + R.w, y + 1, hi);
    const sx = R.x + hash(r * 7 + seed) * R.w; vline(x, sx, y + 1, y + hgt - 1, gap);
    y += hgt; r++;
  }
}
function lightSteps(x, pts, col, steps) { for (const [k, a] of steps) { x.save(); x.globalAlpha = a; poly(x, pts.map(([px, py]) => [px + k[0], py + k[1]]), col); x.restore(); } }
function contactShadow(x, cx, cy, rx, ry, a = 0.3) { x.save(); x.globalAlpha = a; ellipse(x, cx, cy, rx, ry, P.ink); x.globalAlpha = a * 0.6; ellipse(x, cx, cy, rx + 3, ry + 1, P.ink); x.restore(); }

