'use strict';
/*
 * Locations. Each draws a complete, lived-in place into a region of the
 * logical canvas from a small state object — never from previous frames.
 *
 *   room(x, who, R, st)      A's room (cold night) / B's room (warm dusk)
 *   street(x, R, st)         side-view street: wall, shop, bus stop, lamps
 *   platform(x, R, st)       station platform with passing trains
 *   worldMap(x, R, st)       the two cities, sea, mountains, railway, fog
 *   hands / props close-ups  drawn at the same pixel density, just bigger
 *
 * R = { x, y, w, h } is the screen region; content is clipped to it.
 */
const WORLD = {
  // Fictional settings; see docs/03-story-bible.md. Keep every on-screen number consistent with these.
  A: { name: '阿屿', city: '雾港', tz: 8 },
  B: { name: '小晴', city: '晴川', tz: 3 },
  km: 2180,
};
const pad2 = n => String(n).padStart(2, '0');
function clockText(minutes) { const m = mod(Math.round(minutes), 1440); return `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`; }

function clip(x, R, fn) { x.save(); x.beginPath(); x.rect(R.x, R.y, R.w, R.h); x.clip(); fn(); x.restore(); }

// ------------------------------------------------------------- shared furniture
function bookshelf(x, px, py, w, h, seed, dark) {
  box(x, px, py, w, h, dark ? P.wood1 : P.wood2, P.ink);
  const r = rng(seed), shelves = Math.floor((h - 4) / 13);
  for (let s = 0; s < shelves; s++) {
    const sy = py + 2 + s * 13;
    rect(x, px + 2, sy + 11, w - 4, 2, dark ? P.wood0 : P.wood1);
    let bx = px + 3;
    while (bx < px + w - 5) {
      const bw = 2 + Math.floor(r() * 3), bh = 7 + Math.floor(r() * 4);
      const cols = dark ? [P.night3, P.blue2, P.coral2, P.stone1, P.green0, P.wood3] : [P.coral1, P.blue1, P.amber0, P.green1, P.cream2, P.brick2];
      const c = cols[Math.floor(r() * cols.length)];
      if (r() < 0.1) { bx += 3; continue; }
      rect(x, bx, sy + 11 - bh, bw, bh, c);
      pset(x, bx, sy + 11 - bh, P.ink);
      if (bw > 2) pset(x, bx + 1, sy + 13 - bh, dark ? P.night4 : P.cream0);
      bx += bw + (r() < 0.2 ? 1 : 0);
    }
  }
}
function planks(x, px, py, w, h, c0, c1, c2, seed) {
  rect(x, px, py, w, h, c0);
  const r = rng(seed);
  for (let y = py; y < py + h; y += 6) {
    hline(x, px, px + w - 1, y, c2);
    let sx = px + Math.floor(r() * 30);
    while (sx < px + w) { vline(x, sx, y + 1, y + 5, c2); sx += 26 + Math.floor(r() * 24); }
    for (let k = 0; k < w / 18; k++) { const gx = px + Math.floor(r() * w), gy = y + 2 + Math.floor(r() * 3); hline(x, gx, gx + 2 + Math.floor(r() * 4), gy, c1); }
  }
}
function rug(x, px, py, w, h, a, b, c) {
  box(x, px, py, w, h, a, P.ink);
  rect(x, px + 3, py + 3, w - 6, h - 6, b);
  for (let k = 0; k < w - 10; k += 6) { pset(x, px + 5 + k, py + 5, c); pset(x, px + 5 + k, py + h - 6, c); }
  for (let k = 0; k < h - 10; k += 6) { pset(x, px + 5, py + 5 + k, c); pset(x, px + w - 6, py + 5 + k, c); }
  // diamond in the middle
  const cx = px + w / 2, cy = py + h / 2;
  for (let d = 0; d < 8; d++) { pset(x, cx - d, cy - 8 + d, c); pset(x, cx + d, cy - 8 + d, c); pset(x, cx - d, cy + 8 - d, c); pset(x, cx + d, cy + 8 - d, c); }
}
function steam(x, px, py, t, strength = 1) {
  if (strength <= 0) return;
  for (let k = 0; k < 3; k++) {
    const ph = mod(t * 0.8 + k / 3, 1);
    if (ph > strength) continue;
    const sx = px + ri(Math.sin((t + k) * 2.1) * 1.5) + k - 1, sy = py - ri(ph * 10);
    pset(x, sx, sy, P.stone4);
    if (ph < 0.5) pset(x, sx, sy - 1, P.stone3);
  }
}

// ------------------------------------------------------------- window views
// What a window looks out on. kind: 'nightCity' | 'dusk' | 'dawn' | 'day' ; rain: 0..1
function windowView(x, px, py, w, h, st, t) {
  const kind = st.view;
  const skies = {
    nightCity: [P.night0, P.night1, P.night2],
    dusk: [P.dusk1, P.dusk2, P.dusk3, P.dusk4],
    dawn: [P.night3, P.night4, P.dusk2, P.dusk4],
    day: [P.blue3, P.glass, P.screen],
  }[kind];
  const band = Math.ceil(h / skies.length);
  skies.forEach((c, i) => rect(x, px, py + i * band, w, band + 1, c));
  for (let i = 1; i < skies.length; i++) dither(x, px, py + i * band - 2, w, 3, skies[i], 0.5);
  if (kind === 'dusk') disc(x, px + w * 0.7, py + h * 0.72, 7, P.amber2);
  if (kind === 'nightCity') {
    for (let k = 0; k < 6; k++) pset(x, px + 4 + hash(k * 7 + 3) * (w - 8), py + 2 + hash(k * 11 + 1) * h * 0.3, P.night5);
    disc(x, px + w * 0.8, py + 8, 3, P.cream1); disc(x, px + w * 0.8 + 2, py + 7, 3, P.night0);
  }
  // skyline with lit windows
  const r = rng(st.seed || 9), dark = kind === 'nightCity' || kind === 'dawn' ? P.night0 : kind === 'dusk' ? P.dusk0 : P.stone2;
  let bx = px - 2;
  while (bx < px + w) {
    const bw = 8 + Math.floor(r() * 10), bh = 10 + Math.floor(r() * (h * 0.5));
    rect(x, bx, py + h - bh, bw, bh, dark);
    for (let wy = py + h - bh + 3; wy < py + h - 2; wy += 4) for (let wx = bx + 2; wx < bx + bw - 2; wx += 3) {
      const on = hash3(wx, wy, st.seed || 9) < (kind === 'day' ? 0.05 : 0.45);
      const flick = hash3(wx, wy, Math.floor(t * 0.5)) < 0.03;
      if (on !== flick) pset(x, wx, wy, kind === 'dusk' ? P.amber2 : P.amber1);
    }
    bx += bw + 1;
  }
  if (st.rain > 0) {
    for (let k = 0; k < 40 * st.rain; k++) {
      const rx = px + mod(hash(k) * w + t * 20, w), ry = py + mod(hash(k + 99) * h + t * 140, h);
      vline(x, ri(rx), ri(ry), ri(ry) + 2, P.rain);
    }
  }
}
function windowFrame(x, px, py, w, h, st, t, frameCol, curtain, curtainDark) {
  box(x, px - 3, py - 3, w + 6, h + 6, frameCol, P.ink);
  clip(x, { x: px, y: py, w, h }, () => windowView(x, px, py, w, h, st, t));
  vline(x, px + Math.floor(w / 2), py, py + h - 1, frameCol);
  hline(x, px, px + w - 1, py + Math.floor(h / 2), frameCol);
  // glass glint
  pset(x, px + 3, py + 3, P.white); pset(x, px + 4, py + 4, P.glass);
  // sill
  rect(x, px - 5, py + h + 2, w + 10, 3, frameCol); hline(x, px - 5, px + w + 4, py + h + 5, P.ink);
  // curtains with a slow 1-px breathing sway (only when the window is open/drafty)
  const sway = st.draft ? (Math.floor(t * 1.2) % 2) : 0;
  for (const side of [-1, 1]) {
    const cx = side < 0 ? px - 10 : px + w + 3;
    rect(x, cx, py - 6, 8, h + 14, curtain);
    for (let k = 0; k < 4; k++) vline(x, cx + 1 + k * 2 + (side > 0 ? sway : 0), py - 5, py + h + 6, curtainDark);
    hline(x, cx, cx + 7, py + h + 7, P.ink);
  }
  hline(x, px - 14, px + w + 13, py - 7, P.ink);
}

// ------------------------------------------------------------- rooms
// st: { time:'night'|'dusk'|'dawn'|'day', lamp:0..1, rain, view, sitting, person:{...}, mug:0..1, desk items }
function room(x, who, R, st, t) {
  const A = who === 'A';
  const wall0 = A ? P.night2 : P.dusk1, wall1 = A ? P.night3 : P.dusk2, base = A ? P.night1 : P.wood1;
  clip(x, R, () => {
    const ox = R.x, oy = R.y, W = R.w;
    // back wall with stripes
    rect(x, ox, oy, W, 112, wall0);
    for (let k = 0; k < W; k += 10) vline(x, ox + k, oy, oy + 111, wall1);
    if (!A) for (let k = 0; k < W; k += 10) for (let y = 6; y < 110; y += 12) pset(x, ox + k + 5, oy + y + (k / 10 % 2) * 6, P.dusk3);
    rect(x, ox, oy + 108, W, 4, base); hline(x, ox, ox + W, oy + 112, P.ink);
    // floor
    planks(x, ox, oy + 113, W, R.h - 113, A ? P.wood1 : P.wood3, A ? P.wood2 : P.wood4, A ? P.wood0 : P.wood2, A ? 11 : 12);
    // window: A's on the left, B's on the right — mirrored rooms
    const wx = A ? ox + 34 : ox + W - 34 - 96;
    windowFrame(x, wx, oy + 20, 96, 64, st, t, A ? P.wood1 : P.wood3, A ? P.night4 : P.coral1, A ? P.night3 : P.coral2);
    // wall details
    const cal = A ? ox + 168 : ox + 98;
    box(x, cal, oy + 26, 22, 26, P.white, P.ink); rect(x, cal + 1, oy + 27, 20, 6, P.coral1);
    for (let k = 0; k < 12; k++) pset(x, cal + 3 + (k % 4) * 5, oy + 37 + Math.floor(k / 4) * 4, k === (st.dayMark ?? 7) ? P.coral1 : P.stone3);
    // wall clock: local time, digital
    const clockX = A ? ox + 200 : ox + 54;
    box(x, clockX, oy + 30, 30, 13, P.ink, P.stone1);
    text(x, clockText(st.clock ?? 0), clockX + 15, oy + 31, A ? P.screen : P.amber2, FONT.small, { align: 'center' });
    bookshelf(x, A ? ox + W - 90 : ox + 10, oy + 14, 76, 96, A ? 21 : 22, A);
    // desk under the window
    const dx = A ? ox + 22 : ox + W - 22 - 124;
    rect(x, dx, oy + 104, 124, 4, A ? P.wood2 : P.wood3);
    box(x, dx, oy + 106, 124, 22, A ? P.wood2 : P.wood4, P.ink);
    rect(x, dx + 2, oy + 124, 120, 2, A ? P.wood0 : P.wood2);
    vline(x, dx + 4, oy + 128, oy + 140, P.ink); vline(x, dx + 119, oy + 128, oy + 140, P.ink);
    // lamp + its light pool
    const lx = A ? dx + 100 : dx + 10, lampOn = st.lamp ?? 1;
    if (lampOn > 0) {
      glow(x, lx + 4, oy + 108, 60, 34, P.amber2, 0.55 * lampOn);
      glow(x, lx + 4, oy + 92, 26, 16, P.amber3, 0.5 * lampOn);
    }
    blit(x, lampOn > 0.5 ? 'lamp' : 'lamp_off', lx, oy + 92);
    // desk things
    if (st.radio !== false) blit(x, 'radio', A ? dx + 8 : dx + 96, oy + 99);
    if (st.book) blit(x, 'book', A ? dx + 30 : dx + 70, oy + 101);
    if (st.mug !== undefined) { const mx = A ? dx + 70 : dx + 40; blit(x, 'mug', mx, oy + 100); steam(x, mx + 3, oy + 99, t, st.mug); }
    if (st.phoneOnDesk) blit(x, st.phoneLit ? 'phone' : 'phone_off', A ? dx + 56 : dx + 58, oy + 102);
    // chair
    const chx = A ? dx + 50 : dx + 62;
    box(x, chx, oy + 128, 16, 12, A ? P.wood1 : P.wood2, P.ink);
    // bed and rug
    const bx = A ? ox + W - 130 : ox + 14;
    box(x, bx, oy + 160, 112, 70, A ? P.blue2 : P.coral2, P.ink);
    rect(x, bx + 2, oy + 162, 108, 18, P.white); rect(x, bx + 6, oy + 165, 30, 12, P.cream1);
    for (let k = 0; k < 108; k += 8) for (let y = 184; y < 228; y += 8) pset(x, bx + 4 + k, oy + y, A ? P.blue1 : P.coral1);
    rug(x, A ? ox + 30 : ox + W - 170, oy + 200, 140, 64, A ? P.night3 : P.coral2, A ? P.night2 : P.dusk1, A ? P.night5 : P.dusk3);
    blit(x, 'plant', A ? ox + 6 : ox + W - 14, oy + 104);
    // night cold / dusk warm grade at the room edges
    if (A) dither(x, ox, oy, W, R.h, P.night0, 0.16); else dither(x, ox, oy, W, R.h, P.dusk0, 0.08);
    // the person at the desk (back view, sitting, facing the window)
    if (st.person) {
      const pp = st.person;
      drawChar(x, who, chx + 8, oy + 138, { dir: pp.dir || 'back', t, sit: false, pose: pp.pose, holding: pp.holding, lookUp: pp.lookUp, lookDown: pp.lookDown, seed: A ? 0 : 1 });
    }
  });
}

// ------------------------------------------------------------- street (side view)
// st: { time:'night'|'dusk'|'day', rain:0..1, camX, shopOpen, wet }
function street(x, R, st, t) {
  const night = st.time === 'night', dusk = st.time === 'dusk';
  clip(x, R, () => {
    const ox = R.x, oy = R.y, cam = ri(st.camX || 0);
    const sky = night ? [P.night0, P.night1, P.night2] : dusk ? [P.dusk0, P.dusk1, P.dusk2, P.dusk3] : [P.blue3, P.glass, P.screen];
    rect(x, ox, oy, R.w, R.h, sky[sky.length - 1]);
    const bh = Math.ceil((R.h * 0.55) / sky.length);
    sky.forEach((c, i) => rect(x, ox, oy + i * bh, R.w, bh + 1, c));
    // distant towers (parallax 0.3)
    const r = rng(41);
    let px = ox - mod(cam * 0.3, 40) - 40;
    for (let k = 0; k < 30; k++) {
      const w = 14 + Math.floor(hash(k + Math.floor(cam * 0.3 / 40) * 30) * 16), h = 40 + Math.floor(hash(k * 3 + 1) * 60);
      rect(x, px, oy + R.h * 0.55 - h, w, h, night ? P.night1 : dusk ? P.dusk0 : P.stone3);
      for (let wy = 4; wy < h - 4; wy += 5) for (let wx = 3; wx < w - 2; wx += 4) if (hash3(k, wx, wy) < (night ? 0.4 : 0.12)) pset(x, px + wx, oy + R.h * 0.55 - h + wy, night ? P.amber1 : P.amber2);
      px += w + 2;
      if (px > ox + R.w) break;
    }
    void r;
    // street block (parallax 1): brick buildings, shop, bus stop, lamps
    const ground = oy + R.h - 46;
    const blockW = 420;
    const wallH = clamp(R.h - 46 - 64, 150, 430); // taller frames get more storeys, not more empty sky
    for (let b = Math.floor(cam / blockW) - 1; b <= Math.floor((cam + R.w) / blockW) + 1; b++) {
      const bx = ox + b * blockW - cam;
      // brick wall
      rect(x, bx, ground - wallH, blockW, wallH, P.brick1);
      for (let y = 0; y < wallH; y += 5) {
        hline(x, bx, bx + blockW, ground - wallH + y, P.brick0);
        for (let k = (y / 5) % 2 ? 0 : 6; k < blockW; k += 12) vline(x, bx + k, ground - wallH + 1 + y, ground - wallH + 4 + y, P.brick0);
      }
      for (let k = 0; k < wallH / 4; k++) { const hx = bx + hash2(b, k) * blockW, hy = ground - wallH + hash2(b, k + 50) * wallH; rect(x, hx, hy, 3, 1, P.brick2); }
      hline(x, bx, bx + blockW, ground - wallH - 1, P.ink);
      rect(x, bx, ground - wallH - 6, blockW, 5, P.stone1);
      // windows of the homes upstairs, storey by storey (lit at night)
      for (let row = 0; ground - 138 - row * 52 > ground - wallH + 8; row++) for (let k = 0; k < 4; k++) {
        const wx = bx + 30 + k * 100, wy = ground - 138 - row * 52;
        const lit = night ? hash3(b, k, row) < 0.6 : dusk ? hash3(b, k, row) < 0.35 : false;
        box(x, wx, wy, 34, 26, lit ? P.amber1 : P.night3, P.ink);
        if (lit) { rect(x, wx + 2, wy + 2, 30, 4, P.amber2); dither(x, wx + 2, wy + 6, 30, 18, P.amber0, 0.4); }
        vline(x, wx + 17, wy + 1, wy + 24, P.ink);
        rect(x, wx - 2, wy + 26, 38, 2, P.stone1);
      }
      // the shop (convenience store) at the start of each block
      const sx = bx + 26;
      box(x, sx, ground - 78, 150, 78, P.stone1, P.ink);
      // awning: coral/cream stripes
      for (let k = 0; k < 150; k += 10) rect(x, sx + k, ground - 92, 10, 12, (k / 10) % 2 ? P.cream0 : P.coral1);
      hline(x, sx, sx + 149, ground - 80, P.ink);
      for (let k = 0; k < 150; k += 10) { pset(x, sx + k + 2, ground - 80, P.coral2); }
      // sign
      box(x, sx + 40, ground - 108, 70, 15, P.cream0, P.brown1);
      text(x, '晴天小铺', sx + 75, ground - 106, P.brown0, FONT.ui, { align: 'center' });
      // lit shop window
      box(x, sx + 8, ground - 72, 92, 50, st.shopOpen === false ? P.night3 : P.amber2, P.ink);
      if (st.shopOpen !== false) {
        for (let k = 0; k < 4; k++) { rect(x, sx + 12, ground - 64 + k * 11, 84, 2, P.wood2); for (let j = 0; j < 10; j++) rect(x, sx + 14 + j * 8, ground - 69 + k * 11, 5, 5, [P.coral0, P.blue0, P.green1, P.cream0][(j + k) % 4]); }
        glow(x, sx + 54, ground + 8, 80, 18, P.amber2, 0.5);
      }
      box(x, sx + 108, ground - 70, 34, 70, P.night3, P.ink); // door
      rect(x, sx + 110, ground - 68, 30, 30, st.shopOpen === false ? P.night2 : P.amber1);
      // bus stop shelter
      const bsx = bx + 230;
      rect(x, bsx, ground - 70, 4, 70, P.stone2); rect(x, bsx + 70, ground - 70, 4, 70, P.stone2);
      box(x, bsx - 4, ground - 76, 82, 8, P.stone3, P.ink);
      box(x, bsx + 6, ground - 62, 60, 36, P.glass, P.stone1);
      dither(x, bsx + 7, ground - 61, 58, 34, P.white, 0.15);
      box(x, bsx + 14, ground - 26, 44, 6, P.wood3, P.ink);
      box(x, bsx + 86, ground - 74, 18, 18, P.blue1, P.ink);
      text(x, '17', bsx + 95, ground - 73, P.white, FONT.small, { align: 'center' });
      vline(x, bsx + 94, ground - 56, ground, P.stone2);
      // street lamp with light cone
      const lpx = bx + 340;
      vline(x, lpx, ground - 120, ground, P.stone0); vline(x, lpx + 1, ground - 120, ground, P.stone1);
      hline(x, lpx, lpx + 14, ground - 120, P.stone0);
      rect(x, lpx + 10, ground - 118, 9, 4, night || dusk ? P.amber3 : P.stone3);
      if (night || dusk) {
        for (let y = 0; y < 116; y++) { const w = 4 + y * 0.32; dither(x, lpx + 14 - w, ground - 114 + y, w * 2, 1, P.amber2, 0.18 * (1 - y / 140)); }
        glow(x, lpx + 14, ground + 6, 36, 8, P.amber2, 0.6);
      }
    }
    // sidewalk and road
    rect(x, ox, ground, R.w, 14, P.stone2);
    for (let k = -mod(cam, 24); k < R.w; k += 24) vline(x, ox + k, ground + 1, ground + 13, P.stone1);
    hline(x, ox, ox + R.w, ground, P.stone3);
    rect(x, ox, ground + 14, R.w, 3, P.stone3); hline(x, ox, ox + R.w, ground + 17, P.ink);
    rect(x, ox, ground + 18, R.w, 28, night ? P.night1 : P.stone1);
    for (let k = -mod(cam, 40); k < R.w; k += 40) rect(x, ox + k, ground + 31, 18, 2, P.cream2);
    // wet road: reflections of the lamps and windows
    if (st.wet || st.rain > 0) {
      for (let b = Math.floor(cam / blockW) - 1; b <= Math.floor((cam + R.w) / blockW) + 1; b++) {
        const lpx = ox + b * blockW - cam + 354;
        for (let y = 0; y < 26; y += 2) dither(x, lpx - 4 + ri(Math.sin(t * 3 + y) * 1), ground + 19 + y, 8, 1, P.amber2, 0.5 * (1 - y / 26));
        const sx = ox + b * blockW - cam + 34;
        for (let y = 0; y < 20; y += 2) dither(x, sx, ground + 19 + y, 92, 1, P.amber1, 0.18 * (1 - y / 20));
      }
      // puddles
      for (let k = 0; k < 6; k++) {
        const pxp = ox + mod(hash(k) * 900 - cam, 900) - 100, pw = 18 + hash(k + 3) * 20;
        rect(x, pxp, ground + 6, pw, 3, night ? P.night3 : P.glass);
        pset(x, pxp + 3, ground + 6, P.white);
      }
    }
    // rain: streaks + splashes on the pavement, deterministic in t
    if (st.rain > 0) {
      const n = Math.floor(120 * st.rain);
      for (let k = 0; k < n; k++) {
        const sp = 260 + hash(k) * 80, rx = ox + mod(hash(k + 7) * (R.w + 40) - t * 30, R.w + 40) - 20;
        const ry = oy + mod(hash(k + 13) * R.h + t * sp, R.h);
        line(x, rx, ry, rx - 1, ry + 4, P.rain);
      }
      for (let k = 0; k < 18 * st.rain; k++) {
        const ph = mod(t * 2 + hash(k + 40), 1), sx = ox + hash3(k, Math.floor(t * 2 + hash(k + 40)), 3) * R.w;
        if (ph < 0.35) { pset(x, sx - 1, ground + 4 - ph * 6, P.rain); pset(x, sx + 1, ground + 4 - ph * 6, P.rain); }
      }
    }
  });
}

// ------------------------------------------------------------- station platform
function platform(x, R, st, t) {
  clip(x, R, () => {
    const ox = R.x, oy = R.y, ground = oy + R.h - 60;
    const sky = st.time === 'dawn' ? [P.night3, P.night4, P.dusk2, P.dusk3] : st.time === 'dusk' ? [P.dusk0, P.dusk1, P.dusk2, P.dusk3] : [P.night0, P.night1, P.night2];
    const bh = Math.ceil((ground - oy) / sky.length);
    sky.forEach((c, i) => rect(x, ox, oy + i * bh, R.w, bh + 1, c));
    // far hills and a town line
    for (let k = 0; k < R.w; k++) { const h = 10 + Math.sin(k * 0.05) * 6 + Math.sin(k * 0.013 + 1) * 8; vline(x, ox + k, ground - 70 - h, ground - 70, st.time === 'night' ? P.night1 : P.dusk0); }
    // tracks
    rect(x, ox, ground - 30, R.w, 30, P.stone0);
    for (let k = -mod(st.camX || 0, 10); k < R.w; k += 10) rect(x, ox + k, ground - 22, 6, 2, P.wood1);
    hline(x, ox, ox + R.w, ground - 24, P.stone3); hline(x, ox, ox + R.w, ground - 14, P.stone3);
    // a train: cars of lit windows; position given by st.train (px of the front, or null)
    if (st.train !== undefined && st.train !== null) {
      const tx = ox + ri(st.train);
      for (let c = 0; c < 6; c++) {
        const cx = tx - c * 112;
        if (cx < ox - 120 || cx - 108 > ox + R.w) continue;
        box(x, cx - 108, ground - 76, 108, 54, P.stone3, P.ink);
        rect(x, cx - 106, ground - 72, 104, 4, P.coral1);
        for (let w = 0; w < 5; w++) { box(x, cx - 100 + w * 20, ground - 64, 14, 16, P.amber2, P.ink); dither(x, cx - 99 + w * 20, ground - 55, 12, 6, P.amber0, 0.5); }
        rect(x, cx - 106, ground - 36, 104, 6, P.stone1);
      }
    }
    // platform
    rect(x, ox, ground - 4, R.w, 64, P.stone2);
    rect(x, ox, ground - 4, R.w, 4, P.amber1);
    for (let k = -mod(st.camX || 0, 8); k < R.w; k += 8) rect(x, ox + k, ground - 4, 4, 2, P.ink);
    hline(x, ox, ox + R.w, ground, P.ink);
    for (let k = -mod(st.camX || 0, 30); k < R.w; k += 30) vline(x, ox + k, ground + 1, ground + 59, P.stone1);
    // canopy pillars and the station sign
    for (let k = 0; k < 3; k++) { const px = ox + 40 + k * 140 - mod(st.camX || 0, 140); rect(x, px, oy + 20, 5, ground - oy - 24, P.stone1); vline(x, px, oy + 20, ground - 4, P.ink); }
    rect(x, ox, oy + 14, R.w, 8, P.stone1); hline(x, ox, ox + R.w, oy + 22, P.ink);
    if (st.sign) {
      const sx = ox + (st.signX ?? R.w / 2) - 46;
      box(x, sx, oy + 30, 92, 26, P.cream0, P.brown1);
      text(x, st.sign, sx + 46, oy + 32, P.brown0, FONT.big, { align: 'center' });
      rect(x, sx + 44, oy + 22, 3, 8, P.stone0);
    }
    // benches
    for (const bx of st.benches || []) { box(x, ox + bx, ground + 14, 46, 6, P.wood3, P.ink); vline(x, ox + bx + 4, ground + 20, ground + 26, P.ink); vline(x, ox + bx + 41, ground + 20, ground + 26, P.ink); box(x, ox + bx, ground + 2, 46, 5, P.wood2, P.ink); }
    // lamps
    for (let k = 0; k < 3; k++) { const px = ox + 110 + k * 140 - mod(st.camX || 0, 140); glow(x, px, ground + 10, 40, 14, P.amber2, st.time === 'night' ? 0.5 : 0.25); rect(x, px - 3, oy + 24, 7, 3, P.amber3); }
  });
}

// ------------------------------------------------------------- the world map
// Nodes are fictional places; the route is unlocked only by places actually reached.
const MAP_NODES = {
  A_home: { x: 286, y: 98, name: '雾港', who: 'A' },
  A_st: { x: 262, y: 150, name: '雾港北站' },
  port: { x: 226, y: 230, name: '海峡渡口' },
  ferry: { x: 186, y: 270, name: '渡轮' },
  hub: { x: 156, y: 318, name: '风见站' },
  B_st: { x: 112, y: 392, name: '晴川站' },
  B_home: { x: 78, y: 446, name: '晴川', who: 'B' },
};
const MAP_ROUTE_A = ['A_home', 'A_st', 'port', 'ferry', 'hub'];
const MAP_ROUTE_B = ['B_home', 'B_st', 'hub'];
function worldMap(x, R, st, t) {
  clip(x, R, () => {
    const ox = R.x, oy = R.y;
    rect(x, ox, oy, R.w, R.h, P.night2);
    for (let y = 0; y < R.h; y += 8) for (let k = 0; k < R.w; k += 16) if (hash2(k, y) < 0.3) { const ph = mod(t * 0.5 + hash2(k + 1, y), 1) < 0.5 ? 1 : 0; hline(x, ox + k + ph, ox + k + 2 + ph, oy + y, P.night3); }
    // land masses (north-east and south-west), separated by the strait
    const land = (fx) => { for (let y = 0; y < R.h; y++) { const [a, b] = fx(y); if (b > a) rect(x, ox + a, oy + y, b - a, 1, P.cream1); } };
    land(y => y < 250 ? [200 - Math.sin(y * 0.04) * 14 - y * 0.2, R.w] : [R.w, R.w]);
    land(y => y > 290 ? [0, 190 - Math.sin(y * 0.05) * 12 - (y - 290) * 0.3] : [0, 0]);
    // coastline shading
    for (let y = 0; y < R.h; y += 2) { const a = 200 - Math.sin(y * 0.04) * 14 - y * 0.2; if (y < 250) dither(x, ox + a, oy + y, 3, 2, P.cream2, 0.6); }
    // mountains
    for (const [mx, my] of [[300, 190], [318, 176], [60, 330], [80, 318], [40, 360]]) {
      for (let k = 0; k < 9; k++) hline(x, ox + mx - k, ox + mx + k, oy + my + k, k < 3 ? P.white : P.stone3);
      hline(x, ox + mx - 9, ox + mx + 9, oy + my + 9, P.stone1);
    }
    // fog over unexplored areas, dissolving as st.fog → 0
    const fog = st.fog ?? 1;
    if (fog > 0) for (const [fx, fy, fr] of [[170, 250, 70], [120, 330, 50], [240, 170, 50]]) glow(x, ox + fx, oy + fy, fr, fr * 0.7, P.stone4, 0.8 * fog);
    // railway (dotted) and the ferry line (dashed)
    const seg = (a, b, col, dash, prog = 1) => {
      const A = MAP_NODES[a], B = MAP_NODES[b], n = Math.ceil(Math.hypot(B.x - A.x, B.y - A.y));
      for (let k = 0; k <= n * prog; k++) if (k % dash < dash / 2) pset(x, ox + A.x + (B.x - A.x) * k / n, oy + A.y + (B.y - A.y) * k / n, col);
    };
    const pairs = [['A_home', 'A_st'], ['A_st', 'port'], ['port', 'ferry'], ['ferry', 'hub'], ['B_home', 'B_st'], ['B_st', 'hub']];
    for (const [a, b] of pairs) seg(a, b, P.stone3, 4);
    // travelled route: st.travel = { A: progress along MAP_ROUTE_A in segments, B: ... }
    const drawRoute = (route, prog, col) => {
      for (let i = 0; i < route.length - 1; i++) { const p = clamp(prog - i); if (p > 0) { seg(route[i], route[i + 1], col, 2, p); } }
    };
    if (st.travel) { drawRoute(MAP_ROUTE_A, st.travel.A || 0, P.blue3); drawRoute(MAP_ROUTE_B, st.travel.B || 0, P.coral0); }
    // nodes: dark until reached, lit once a traveller has been there
    const reached = new Set(st.reached || []);
    for (const [k, nd] of Object.entries(MAP_NODES)) {
      if (k === 'ferry') continue;
      const lit = reached.has(k);
      box(x, ox + nd.x - 3, oy + nd.y - 3, 7, 7, lit ? (nd.who === 'B' ? P.coral0 : nd.who === 'A' ? P.blue0 : P.amber2) : P.stone2, P.ink);
      if (lit && k === st.pulse) { const ph = mod(t * 2, 1); if (ph < 0.6) { x.strokeStyle = P.amber2; x.lineWidth = 1; x.strokeRect(ox + nd.x - 5 - ri(ph * 4), oy + nd.y - 5 - ri(ph * 4), 11 + ri(ph * 8), 11 + ri(ph * 8)); } }
      text(x, nd.name, ox + nd.x + (nd.x > 180 ? -6 : 6), oy + nd.y - 5, lit ? P.brown0 : P.stone1, FONT.small, { align: nd.x > 180 ? 'right' : 'left' });
    }
    // little ferry boat on its line when travelling
    if (st.boat !== undefined) { const A = MAP_NODES.port, B = MAP_NODES.hub, u = clamp(st.boat); const bx = ox + lerp(A.x, B.x, u), by = oy + lerp(A.y, B.y, u); rect(x, bx - 4, by - 1, 9, 3, P.white); pset(x, bx, by - 3, P.coral0); }
  });
}

// ------------------------------------------------------------- close-ups
// A hand at close-up scale. k (1–4) is the drawing resolution: parts get k×
// more pixels but the outline stays 1 px, so a big hand is drawn bigger, not
// upscaled. kind: 'point' | 'open' | 'press' | 'hold'; facing: 1 (fingers →) or -1.
function hand(x, who, cx, cy, kind, facing = 1, k = 1) {
  const sleeve = who === 'A' ? [P.blue0, P.blue1, P.blue2] : [P.cream0, P.cream1, P.cream2];
  x.save();
  if (facing < 0) { x.translate(ri(cx) * 2, 0); x.scale(-1, 1); }
  const X = ri(cx), Y = ri(cy);
  const q = v => ri(v * k);
  const parts = [[0, -6, 12, 12]]; // palm
  if (kind === 'point') parts.push([12, -6, 11, 4], [10, -1, 5, 4], [9, 3, 4, 3], [3, -9, 6, 4]);
  else if (kind === 'press') parts.push([12, -5, 9, 4], [12, -1, 8, 3], [12, 2, 7, 3], [4, -9, 6, 4]);
  else if (kind === 'hold') parts.push([12, -6, 6, 4], [12, -2, 6, 4], [12, 2, 5, 4], [6, -10, 8, 4]);
  else parts.push([12, -6, 9, 3], [12, -3, 10, 3], [12, 0, 9, 3], [12, 3, 6, 3], [4, -10, 6, 5]);
  // pixel-rounded parts: outline first, then fill, each with the corner pixels cut
  const rr = (px, py, w, h, col, r) => { rect(x, px + r, py, w - 2 * r, h, col); rect(x, px, py + r, w, h - 2 * r, col); if (r > 1) rect(x, px + 1, py + 1, w - 2, h - 2, col); };
  const rad = k >= 3 ? 2 : 1;
  for (const [a, b, w, h] of parts) rr(X + q(a) - 1, Y + q(b) - 1, q(w) + 2, q(h) + 2, P.ink, rad);
  for (const [a, b, w, h] of parts) rr(X + q(a), Y + q(b), q(w), q(h), P.skin0, rad);
  if (k >= 2) for (const [a, b, w] of parts.slice(1)) hline(x, X + q(a) + 2, X + q(a) + q(w) - 3, Y + q(b) + 1, P.coral3); // light along each finger
  // finger separations, knuckles, nails, palm shade
  for (const [a, b, w, h] of parts.slice(1)) { hline(x, X + q(a), X + q(a) + q(w) - 1, Y + q(b) + q(h) - 1, P.skin1); if (k >= 2) rect(x, X + q(a) + q(w) - q(2), Y + q(b) + 1, q(1.5), Math.max(1, q(h) - 3), P.coral3); }
  rect(x, X, Y + q(3), q(12), q(3), P.skin1);
  if (k >= 2) for (let j = 0; j < 3; j++) pset(x, X + q(11), Y + q(-4 + j * 3), P.skin2);
  // sleeve cuff
  rect(x, X - q(21) - 1, Y - q(9) - 1, q(21) + 1, q(18) + 2, P.ink);
  rect(x, X - q(21), Y - q(9), q(21), q(18), sleeve[0]);
  rect(x, X - q(21), Y + q(4), q(21), q(5), sleeve[1]);
  if (k >= 2) for (let j = 1; j < 4; j++) line(x, X - q(21) + q(j * 5), Y - q(8), X - q(21) + q(j * 5) + q(2), Y + q(3), sleeve[1]); // fabric folds
  rect(x, X - q(5), Y - q(9), q(4), q(18), sleeve[2]);                               // cuff band
  hline(x, X - q(5), X - 2, Y - q(9), sleeve[0]);
  if (who === 'A') { rect(x, X - q(13), Y - q(6), Math.max(1, q(2)), Math.max(1, q(2)), P.amber2); }   // the star pin's amber, echoed on the cuff button
  else { rect(x, X - q(21), Y - q(9), q(21), Math.max(1, q(3)), P.coral0); for (let j = 0; j < q(21); j += 3) pset(x, X - q(21) + j, Y - q(2), P.cream2); }  // coral scarf edge, knit
  x.restore();
}
