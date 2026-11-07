'use strict';
/*
 * The street, side view, one continuous strip (world x 0 → 1400). From back to
 * front: sky, far roofs, the facades with their ground-floor shops, the far
 * pavement, the road with the tram rails, the near pavement and tram platform,
 * and a darker foreground kerb. Order of places along the street:
 *   0   his building (his window on the first floor)
 *   150 洗衣房 laundromat (glass front, three machines)
 *   330 转角咖啡 café (window table, awning, chalkboard)
 *   520 tram stop (shelter on both sides of the rails), newsstand
 *   720 a small square: plane tree, bench, lamp
 *   900 bakery, record shop … the pattern then varies
 * st: { T, camX, gy, tram:{x, dir, door}, lamps(i)→0..1, people:[…], react:{…} }
 */
const ST = { apt: 0, laundry: 150, cafe: 330, stop: 520, square: 720, bakery: 900, len: 1400 };
const STREET_LAMPS = [40, 250, 470, 640, 800, 980, 1160, 1340];
function streetGeom(R, st) { const gy = R.y + (st.gy ?? Math.round(R.h * 0.7)); return { gy, road: gy + 16, rail1: gy + 32, rail2: gy + 44, near: gy + 62, front: gy + 84 }; }
function street(x, R, st, t) {
  const T = st.T, cam = ri(st.camX || 0), G = streetGeom(R, st), ox = R.x; st._ry = R.y;
  const wx = v => ox + ri(v - cam);
  clip(x, R, () => {
    skyGrad(x, ox, R.y, R.w, G.gy - R.y, T);
    starsAt(x, ox, R.y, R.w, (G.gy - R.y) * 0.5, t, 40, 3, T);
    if (T.k > 0.8) { disc(x, ox + 290 - ri(cam * 0.05), R.y + 40, 6, P.cream1); disc(x, ox + 292 - ri(cam * 0.05), R.y + 39, 5, mixHex(T.sky[0], P.cream1, 0.15)); }
    for (let k = 0; k < 4; k++) if (T.k < 0.8) { const cx = ox + mod(k * 120 + t * 2 - cam * 0.08, R.w + 120) - 60, cy = R.y + 24 + k * 13; ellipse(x, cx, cy, 22, 4, mixHex(P.white, T.sky[2], T.k)); ellipse(x, cx - 8, cy - 3, 10, 4, mixHex(P.white, T.sky[2], T.k)); }
    // far roofs (parallax 0.35): chimneys, water tanks, an antenna with a bird or two
    for (let k = -1; k < 14; k++) {
      const i = k + Math.floor(cam * 0.35 / 34), px = ox + i * 34 - ri(cam * 0.35), h = 70 + hash(i * 3 + 1) * 80;
      const col = mixHex('#b3a69a', T.sky[3], 0.45), dark = mixHex(col, P.ink1, T.k * 0.7);
      rect(x, px, G.gy - 150 - h + 60, 32, h, dark);
      if (hash(i + 5) < 0.4) rect(x, px + 20, G.gy - 158 - h + 60, 4, 8, dark);
      for (let wy = 6; wy < h - 6; wy += 9) for (let wxx = 4; wxx < 28; wxx += 8) if (hash3(i, wxx, wy) < 0.35 * T.lights) rect(x, px + wxx, G.gy - 150 - h + 60 + wy, 3, 4, P.honey1);
    }
    // overhead tram wire
    for (let k = 0; k < R.w; k++) pset(x, ox + k, G.gy - 118 + ri(Math.sin((k + cam) / 200 * Math.PI) * 3), P.ink);
    // facades
    for (const [kind, x0, w] of streetBlocks()) if (x0 - cam < R.w + 40 && x0 + w - cam > -40) facade(x, kind, wx(x0), w, G, st, t, T);
    // far pavement with lamps and trees
    rect(x, ox, G.gy, R.w, 16, P.stone3); hline(x, ox, ox + R.w, G.gy, P.stone4);
    for (let k = -mod(cam, 18); k < R.w; k += 18) vline(x, ox + k, G.gy + 1, G.gy + 15, P.stone2);
    rect(x, ox, G.gy + 14, R.w, 2, P.stone2);
    for (const [i, lx] of STREET_LAMPS.entries()) lampPost(x, wx(lx), G.gy + 8, st.lamps ? st.lamps(i) : T.lights, t);
    for (const tx of [120, 420, 740, 1060, 1300]) planeTree(x, wx(tx), G.gy + 10, t, T, st.wind || 0);
    // people on the far pavement
    for (const p of (st.people || []).filter(p => p.layer !== 'near')) person(x, wx(p.x), G.gy + 12 + (p.dy || 0), p, t);
    // road and rails
    rect(x, ox, G.road, R.w, G.near - G.road, mixHex('#6d6871', P.ink0, T.k * 0.6));
    for (let k = -mod(cam, 4); k < R.w; k += 4) if (hash2(k + cam, 9) < 0.2) pset(x, ox + k, G.road + 3 + hash2(k, 2) * 40, mixHex('#7a7580', P.ink1, T.k * 0.6));
    for (const ry of [G.rail1, G.rail2]) { rect(x, ox, ry, R.w, 2, P.stone4); hline(x, ox, ox + R.w, ry + 2, P.stone1); }
    if (st.tram) tramSide(x, wx(st.tram.x), G.rail2 + 2, st.tram.dir || 1, T, t, st.tram);
    // near pavement / platform
    rect(x, ox, G.near, R.w, G.front - G.near, P.stone3); hline(x, ox, ox + R.w, G.near, P.stone5); rect(x, ox, G.near, R.w, 2, P.honey1);
    for (let k = -mod(cam, 6); k < R.w; k += 6) pset(x, ox + k + 2, G.near + 1, P.honey3);
    for (let k = -mod(cam, 22); k < R.w; k += 22) vline(x, ox + k, G.near + 3, G.front, P.stone2);
    nearStop(x, wx(ST.stop), G, T, t);
    for (const p of (st.people || []).filter(p => p.layer === 'near')) person(x, wx(p.x), G.near + 14 + (p.dy || 0), p, t);
    // the foreground kerb: a low wall with a hedge, in shadow (keeps subtitles readable)
    rect(x, ox, G.front, R.w, R.y + R.h - G.front, mixHex(P.sage5, P.ink, 0.3 + T.k * 0.3));
    for (let k = -mod(ri(cam * 1.2), 10); k < R.w; k += 10) { ellipse(x, ox + k, G.front + 2, 6, 4, mixHex(P.sage4, P.ink, T.k * 0.5)); pset(x, ox + k - 2, G.front, mixHex(P.sage3, P.ink, T.k * 0.4)); }
    if (st.bench !== undefined) parkBench(x, wx(st.bench), G.front + 2, T);
    grade(x, R, T);
    for (const [i, lx] of STREET_LAMPS.entries()) { const on = st.lamps ? st.lamps(i) : T.lights; if (on > 0.05) { pool(x, wx(lx) + 2, G.gy + 12, 30, 7, P.honey0, 0.55 * on); x.save(); x.globalAlpha = 0.07 * on; poly(x, [[wx(lx) - 2, G.gy - 84], [wx(lx) + 6, G.gy - 84], [wx(lx) + 26, G.gy + 12], [wx(lx) - 22, G.gy + 12]], P.honey0); x.restore(); } }
    if (st.after) st.after(wx, G);
  });
}
function streetBlocks() {
  return [['apt', 0, 150], ['laundry', 150, 180], ['cafe', 330, 190], ['stop', 520, 200], ['square', 720, 180], ['bakery', 900, 170], ['records', 1070, 170], ['apt2', 1240, 160]];
}
// One building front: floors of windows, then a ground floor that depends on the place.
function facade(x, kind, bx, w, G, st, t, T) {
  const floors = kind === 'square' ? 0 : G.gy - (st._ry || 0) > 330 ? 4 : 3, fh = 46, ground = 64, top = G.gy - ground - floors * fh;
  const cols = { apt: ['#c98f6c', '#b67b5c'], laundry: ['#d9c9a4', '#c8b48a'], cafe: ['#9db382', '#8aa171'], stop: ['#b9a07a', '#a68d68'], bakery: ['#c46a52', '#a8573f'], records: ['#7f96b5', '#6b819f'], apt2: ['#d6b48a', '#c19f77'] }[kind] || ['#c9a079', '#b48c66'];
  if (kind !== 'square') {
    const wall = mixHex(cols[0], P.ink1, T.k * 0.55), wall2 = mixHex(cols[1], P.ink1, T.k * 0.55);
    rect(x, bx, top, w, G.gy - top, wall);
    if (kind === 'apt' || kind === 'bakery') for (let y = top; y < G.gy - ground; y += 4) { hline(x, bx, bx + w, y, wall2); for (let k = (y / 4) % 2 ? 0 : 5; k < w; k += 10) pset(x, bx + k, y + 2, wall2); }
    else for (let y = top + 8; y < G.gy - ground; y += 12) hline(x, bx, bx + w, y, wall2);
    rect(x, bx - 2, top - 5, w + 4, 5, P.ink); rect(x, bx - 1, top - 4, w + 2, 3, mixHex(P.stone3, P.ink1, T.k * 0.5));
    vline(x, bx, top, G.gy, P.ink);
    for (let f = 0; f < floors; f++) {
      const nwin = Math.floor((w - 20) / 40);
      for (let k = 0; k < nwin; k++) {
        const wx0 = bx + 14 + k * ((w - 28) / Math.max(1, nwin - 1 || 1)) - (nwin === 1 ? 0 : 0), wy0 = top + 10 + f * fh, seed = hash3(bx + 9999, k, f);
        const lit = T.lights > 0.15 && seed < 0.25 + 0.5 * T.lights, isHis = st.hisWindow && kind === 'apt' && f === 2 && k === 1;
        win(x, ri(wx0), wy0, 22, 26, lit || (isHis && st.hisWindow.lit), T, seed, isHis ? st.hisWindow : null, t);
        if (seed > 0.7) { rect(x, ri(wx0) - 3, wy0 + 27, 28, 2, P.ink); for (let j = 0; j < 5; j++) ellipse(x, ri(wx0) - 1 + j * 6, wy0 + 25, 2, 2, j % 2 ? P.sage2 : P.sage3); } // window boxes
        if (seed < 0.12 && f > 0) { for (let j = 0; j < 22; j++) pset(x, ri(wx0) + j, wy0 + 32 + ri(Math.sin(j / 22 * Math.PI) * 2), P.ink); for (let j = 0; j < 3; j++) rect(x, ri(wx0) + 3 + j * 7, wy0 + 33, 4, 5, [P.cream0, P.brick0, P.ink3][j]); } // a washing line
      }
    }
  }
  const g0 = G.gy - ground;
  if (kind === 'apt' || kind === 'apt2') {
    block(x, bx + 58, G.gy - 46, 28, 46, P.wood2); rect(x, bx + 61, G.gy - 43, 22, 18, mixHex(P.glass, P.honey1, T.lights * 0.7)); rect(x, bx + 61, G.gy - 22, 22, 20, P.wood1); pset(x, bx + 80, G.gy - 20, P.honey0);
    rect(x, bx + 54, G.gy - 50, 36, 4, P.ink); rect(x, bx + 55, G.gy - 49, 34, 2, P.stone3);
    for (let k = 0; k < 3; k++) block(x, bx + 94 + k * 7, G.gy - 34, 6, 8, P.stone2);
    rect(x, bx + 52, G.gy - 3, 40, 3, P.stone2);
    if (st.aptDoor && kind === 'apt') { const o = st.aptDoor; rect(x, bx + 61, G.gy - 43, ri(22 * o), 41, P.ink0); }
    bikeParked(x, bx + 22, G.gy + 8);
    block(x, bx + 110, G.gy - 52, 30, 40, mixHex(P.glass, P.honey1, T.lights)); vline(x, bx + 125, G.gy - 51, G.gy - 13, P.ink);
  } else if (kind === 'laundry') {
    block(x, bx + 6, g0 - 18, w - 12, 16, P.sage4); text(x, '洗衣房', bx + 12, g0 - 15, P.cream0, FONT.small); text(x, 'LAUNDRY', bx + w - 12, g0 - 13, P.sage0, FONT.tiny, { align: 'right' });
    block(x, bx + 6, g0, w - 40, ground - 2, mixHex(P.glass2, P.honey0, T.lights * 0.5));
    for (let k = 0; k < 3; k++) { const mx = bx + 30 + k * 44; block(x, mx - 15, G.gy - 44, 30, 42, P.white); ellipse(x, mx, G.gy - 24, 10, 10, P.ink); ellipse(x, mx, G.gy - 24, 9, 9, P.ink1); washerClothes(x, mx, G.gy - 24, 7, (st.react?.washer ?? t * 1.4) + k * 1.3, k, t); }
    shade(x, bx + 7, g0 + 1, w - 42, ground - 4, P.white, 0.12); line(x, bx + 20, g0 + 2, bx + 8, g0 + 20, P.white);
    const dx = bx + w - 32, o = st.laundryDoor || 0; // door opens outward toward the street
    block(x, dx, G.gy - 46, 26, 46, P.sage3);
    if (o > 0) { rect(x, dx + 1, G.gy - 45, 24, 45, P.ink1); poly(x, [[dx + 25, G.gy - 46], [dx + 25 + ri(o * 16), G.gy - 50], [dx + 25 + ri(o * 16), G.gy + 4], [dx + 25, G.gy]], P.sage2); }
    else { rect(x, dx + 4, G.gy - 42, 18, 24, mixHex(P.glass2, P.honey0, T.lights * 0.5)); pset(x, dx + 20, G.gy - 16, P.ink); }
  } else if (kind === 'cafe') {
    for (let k = 0; k < w - 10; k += 10) { rect(x, bx + 5 + k, g0 - 10, 10, 10, (k / 10) % 2 ? P.cream0 : P.sage2); pset(x, bx + 9 + k, g0, (k / 10) % 2 ? P.cream1 : P.sage3); }
    hline(x, bx + 5, bx + w - 6, g0 - 11, P.ink);
    block(x, bx + 40, g0 - 26, 100, 15, P.wood1); text(x, '转角咖啡', bx + 90, g0 - 24, P.cream0, FONT.small, { align: 'center' });
    const lit = Math.max(0.3, T.lights);
    block(x, bx + 6, g0 + 6, 120, ground - 10, mixHex('#e8d8b0', P.honey0, lit * 0.6));
    for (let k = 0; k < 3; k++) { vline(x, bx + 6, g0 + 6, G.gy - 4, P.ink); }
    rect(x, bx + 66, g0 + 7, 1, ground - 12, P.wood1);
    for (const lx of [30, 70, 106]) { vline(x, bx + lx, g0 + 7, g0 + 12, P.ink); rect(x, bx + lx - 2, g0 + 12, 5, 2, P.honey0); }
    ellipse(x, bx + 50, G.gy - 14, 10, 3, P.cream0); vline(x, bx + 50, G.gy - 11, G.gy - 4, P.ink); // B's table, seen from outside
    if (st.cafeB) { const s = st.cafeB; drawChar(x, 'B', bx + 34, G.gy - 4, { dir: 'right', sit: true, pose: s.pose || 'write', t, face: s.face }); }
    if (st.napkinOut) { rect(x, bx + 44, G.gy - 17, 6, 2, P.white); }
    block(x, bx + 132, G.gy - 46, 26, 46, P.wood2); rect(x, bx + 136, G.gy - 42, 18, 22, mixHex('#e8d8b0', P.honey0, lit * 0.6));
    if (st.cafeDoor) rect(x, bx + 135, G.gy - 43, ri(20 * st.cafeDoor), 42, P.honey1);
    // chalkboard on the pavement
    poly(x, [[bx + 166, G.gy - 22], [bx + 180, G.gy - 22], [bx + 183, G.gy + 6], [bx + 163, G.gy + 6]], P.ink); rect(x, bx + 166, G.gy - 20, 14, 18, P.sage5); for (let k = 0; k < 3; k++) hline(x, bx + 168, bx + 176 - k * 2, G.gy - 16 + k * 5, P.cream2);
    plantPot(x, bx + 6, G.gy + 6, t, 1); plantPot(x, bx + 118, G.gy + 6, t, 0);
    if (T.lights > 0.3) for (let k = 0; k < 18; k++) { const lx = bx + 4 + k * 10, ly = g0 - 34 + ri(Math.sin(k / 17 * Math.PI) * 6); pset(x, lx, ly, mod(t * 1.2 + k * 0.31, 1) < 0.85 ? P.honey0 : P.honey2); pset(x, lx, ly - 1, P.ink); }
  } else if (kind === 'stop') {
    block(x, bx + 10, g0, 70, ground - 2, mixHex(P.cream1, P.honey0, T.lights * 0.4)); text(x, '报刊', bx + 45, g0 + 4, P.brick2, FONT.small, { align: 'center' });
    for (let k = 0; k < 5; k++) block(x, bx + 14 + k * 13, g0 + 20, 11, 15, [P.brick0, P.ink3, P.honey1, P.sage1, P.cream0][k]);
    farShelter(x, bx + 110, G.gy, T);
    block(x, bx + 92, g0 + 6, 12, ground - 10, P.ink2); text(x, '7', bx + 98, g0 + 8, P.honey0, FONT.small, { align: 'center' });
  } else if (kind === 'square') {
    rect(x, bx, G.gy - 2, w, 2, P.stone2);
    block(x, bx + 30, G.gy - 20, 34, 20, P.stone3); for (let k = 0; k < 4; k++) rect(x, bx + 34 + k * 7, G.gy - 26, 5, 6, [P.brick0, P.honey0, P.cream0, P.brick1][k]); // flower stall
    parkBench(x, bx + 100, G.gy + 6, T);
  } else if (kind === 'bakery' || kind === 'records') {
    for (let k = 0; k < w - 10; k += 12) rect(x, bx + 5 + k, g0 - 8, 12, 8, (k / 12) % 2 ? P.cream0 : (kind === 'bakery' ? P.brick1 : P.ink2));
    block(x, bx + 30, g0 - 24, 90, 14, P.cream0); text(x, kind === 'bakery' ? '面包房' : '唱片行', bx + 75, g0 - 22, P.ink1, FONT.small, { align: 'center' });
    block(x, bx + 8, g0 + 6, 110, ground - 10, mixHex(P.cream1, P.honey0, T.lights * 0.6));
    if (kind === 'bakery') for (let k = 0; k < 8; k++) ellipse(x, bx + 18 + k * 12, G.gy - 20, 4, 2, P.honey2); else for (let k = 0; k < 6; k++) { block(x, bx + 14 + k * 16, G.gy - 34, 12, 12, [P.brick1, P.ink3, P.honey1, P.sage2, P.cream2, P.brick0][k]); disc(x, bx + 20 + k * 16, G.gy - 28, 2, P.ink); }
    block(x, bx + 128, G.gy - 46, 26, 46, P.wood2);
  }
}
function win(x, px, py, w, h, lit, T, seed, his, t) {
  rect(x, px - 1, py - 1, w + 2, h + 2, P.ink);
  if (lit) { rect(x, px, py, w, h, P.honey1); rect(x, px, py, w, 4, P.honey0); rect(x, px, py, 5, h, seed < 0.4 ? P.brick1 : P.sage2); if (seed < 0.08) { rect(x, px + 11, py + 12, 5, 14, P.honey3); disc(x, px + 13, py + 10, 3, P.honey3); } }
  else { rect(x, px, py, w, h, mixHex('#7d8fa8', P.ink0, T.k * 0.7)); pset(x, px + 2, py + 2, mixHex(P.white, P.ink2, T.k)); line(x, px + 4, py + 2, px + 8, py + 6, mixHex(P.glass2, P.ink2, T.k)); }
  if (his) { if (his.note !== undefined) noteSprite(x, px + 6, py + 8, t, his.note); if (his.two) { glow(x, px + w / 2, py + h / 2, 26, 22, P.honey0, 0.35); rect(x, px + 1, py + 17, w - 2, 2, P.wood2); for (const [hx, c] of [[px + 5, P.hairA0], [px + w - 6, P.brick1]]) { disc(x, hx, py + 12, 2, c); rect(x, hx - 2, py + 14, 5, 4, c === P.brick1 ? P.sage2 : '#3b5b54'); } } }
  vline(x, px + w / 2, py, py + h - 1, P.ink); hline(x, px, px + w - 1, py + h / 2, P.ink);
  rect(x, px - 3, py + h + 1, w + 6, 2, P.stone3);
}
function lampPost(x, px, fy, on, t) {
  rect(x, px, fy - 92, 3, 92, P.ink); rect(x, px + 1, fy - 92, 1, 92, P.stone1);
  rect(x, px - 2, fy - 4, 7, 4, P.ink);
  poly(x, [[px - 4, fy - 92], [px + 7, fy - 92], [px + 5, fy - 98], [px - 2, fy - 98]], P.ink);
  rect(x, px - 3, fy - 92, 9, 3, on > 0.5 ? P.honey0 : P.stone3);
  if (on > 0.5) glow(x, px + 1, fy - 90, 9, 6, P.amber2, 0.6 * on);
}
function planeTree(x, px, fy, t, T, wind) {
  rect(x, px - 2, fy - 60, 5, 60, P.ink); rect(x, px - 1, fy - 60, 3, 60, mixHex('#9a8f80', P.ink1, T.k * 0.6)); for (let y = 10; y < 60; y += 9) pset(x, px, fy - y, mixHex('#c2b7a5', P.ink2, T.k * 0.6));
  const sw = ri(Math.sin(t * 1.2 + px * 0.01) * (1 + wind * 2));
  const leaf = [mixHex(P.sage3, P.ink1, T.k * 0.6), mixHex(P.sage2, P.ink1, T.k * 0.6), mixHex(P.sage1, P.ink2, T.k * 0.6)];
  for (const [dx, dy, r] of [[-12, -70, 14], [10, -74, 15], [0, -88, 16], [-18, -84, 10], [18, -88, 10]]) { ellipse(x, px + dx + sw, fy + dy, r + 1, ri(r * 0.8) + 1, P.ink); }
  for (const [dx, dy, r] of [[-12, -70, 14], [10, -74, 15], [0, -88, 16], [-18, -84, 10], [18, -88, 10]]) { ellipse(x, px + dx + sw, fy + dy, r, ri(r * 0.8), leaf[0]); ellipse(x, px + dx + sw - 2, fy + dy - 2, ri(r * 0.7), ri(r * 0.55), leaf[1]); }
  for (let k = 0; k < 10; k++) pset(x, px - 16 + hash(k + px) * 32 + sw, fy - 96 + hash(k + 3 + px) * 30, leaf[2]);
  // dappled shadow on the pavement
  x.save(); x.globalAlpha = 0.18 * (1 - T.k); for (let k = 0; k < 6; k++) ellipse(x, px - 18 + k * 7 + sw, fy + 2 + (k % 2), 3, 1, P.ink); x.restore();
}
function bikeParked(x, px, fy) { for (const wx of [px - 8, px + 8]) { ellipse(x, wx, fy - 5, 5, 5, P.ink); ellipse(x, wx, fy - 5, 4, 4, P.stone3); pset(x, wx, fy - 5, P.ink); } line(x, px - 8, fy - 5, px, fy - 11, P.sage3); line(x, px, fy - 11, px + 8, fy - 5, P.sage3); line(x, px - 2, fy - 11, px + 6, fy - 11, P.sage3); hline(x, px - 4, px - 1, fy - 13, P.ink); block(x, px + 6, fy - 16, 6, 4, P.wood2); }
function parkBench(x, px, fy, T) {
  const w = mixHex(P.wood3, P.ink1, T.k * 0.5);
  rect(x, px, fy - 10, 40, 3, P.ink); rect(x, px + 1, fy - 10, 38, 2, w); rect(x, px, fy - 18, 40, 3, P.ink); rect(x, px + 1, fy - 18, 38, 2, w); rect(x, px, fy - 14, 40, 2, P.ink);
  for (const lx of [px + 3, px + 35]) rect(x, lx, fy - 8, 2, 8, P.ink);
}
function farShelter(x, px, gy, T) {
  rect(x, px, gy - 50, 2, 50, P.ink); rect(x, px + 70, gy - 50, 2, 50, P.ink);
  block(x, px - 4, gy - 54, 80, 5, P.stone2);
  rect(x, px + 4, gy - 44, 60, 30, P.ink); rect(x, px + 5, gy - 43, 58, 28, mixHex(P.glass, P.ink2, T.k * 0.6));
  block(x, px + 10, gy - 40, 16, 22, P.cream0); for (let k = 0; k < 4; k++) hline(x, px + 12, px + 23, gy - 36 + k * 5, P.ink3);
  rect(x, px + 30, gy - 12, 34, 3, P.ink); rect(x, px + 31, gy - 12, 32, 2, P.wood3); rect(x, px + 32, gy - 9, 2, 9, P.ink); rect(x, px + 60, gy - 9, 2, 9, P.ink);
}
function nearStop(x, px, G, T) { // the near-side platform's sign post and a bin
  rect(x, px + 40, G.near - 60, 3, 72, P.ink); block(x, px + 32, G.near - 66, 20, 14, P.ink2); text(x, '7', px + 42, G.near - 64, P.honey0, FONT.small, { align: 'center' });
  block(x, px + 120, G.near + 2, 10, 12, P.stone1);
}
// A person in the street: a lead (A/B), a passer-by on the shared body plan (C/D),
// or a small far figure. p = { who, x, dir, walk, pose, face, holding, dy }
function person(x, px, fy, p, t) {
  if (p.hidden) return;
  if (p.who) { charShadow(x, px, fy); drawChar(x, p.who, px, fy, { dir: p.dir, walk: p.walk, pose: p.pose, face: p.face, holding: p.holding, t, seed: p.seed, sit: p.sit, tapUp: p.tapUp, nod: p.nod }); }
  else passerSil(x, px, fy, t + px);
}
// The tram, side view: two cars, honey and cream with a brick stripe, a pantograph
// reaching the wire, passengers in the windows, wheels that turn with the speed.
function tramSide(x, nx, railY, dir, T, t, o = {}) {
  x.save(); if (dir < 0) { x.translate(ri(nx) * 2, 0); x.scale(-1, 1); }
  const L = o.small ? 70 : 150, H = o.small ? 30 : 62, gap = o.small ? 4 : 8;
  for (let c = 0; c < 2; c++) {
    const cx = nx - c * (L + gap), top = railY - H - 6;
    rect(x, cx - L, top, L, H, P.ink); rect(x, cx - L + 1, top + 1, L - 2, H - 2, P.honey1);
    rect(x, cx - L + 1, top + 1, L - 2, ri(H * 0.42), P.cream0); rect(x, cx - L + 1, top + ri(H * 0.42), L - 2, 3, P.brick1);
    rect(x, cx - L + 1, top + H - 8, L - 2, 3, P.honey3);
    const nw = o.small ? 4 : 6;
    for (let k = 0; k < nw; k++) {
      const wx0 = cx - L + 8 + k * ((L - 16) / nw), ww = ri((L - 16) / nw) - 4;
      if (!o.small && k === 2) { const d = ri((o.door || 0) * 7); rect(x, wx0 - 1, top + 6, ww + 2, H - 12, P.ink); rect(x, wx0 - d, top + 7, ri(ww / 2), H - 14, P.honey2); rect(x, wx0 + ri(ww / 2) + d, top + 7, ri(ww / 2), H - 14, P.honey2); if (d > 0) rect(x, wx0 + ri(ww / 2) - d, top + 7, 2 * d, H - 14, mixHex(P.honey0, P.cream0, 0.5)); continue; }
      rect(x, wx0, top + 5, ww, ri(H * 0.32), P.ink); rect(x, wx0 + 1, top + 6, ww - 2, ri(H * 0.32) - 2, mixHex(P.glass, P.honey0, T.lights * 0.8));
      if (hash3(c, k, 3) < 0.55) { const hx = wx0 + ww / 2; disc(x, hx, top + 6 + ri(H * 0.2), o.small ? 1 : 3, P.ink2); rect(x, hx - (o.small ? 1 : 3), top + 6 + ri(H * 0.26), o.small ? 3 : 7, o.small ? 2 : 5, P.ink2); }
      if (o.passengers && o.passengers[c * 10 + k]) o.passengers[c * 10 + k](x, wx0, top + 5, ww);
    }
    // pantograph
    if (c === 0) { const px = cx - L / 2; line(x, px - 10, top, px, top - (o.small ? 8 : 18), P.ink); line(x, px + 10, top, px, top - (o.small ? 8 : 18), P.ink); hline(x, px - 8, px + 8, top - (o.small ? 8 : 18), P.ink); }
    // wheels
    for (const wx0 of [cx - L + 22, cx - L + 38, cx - 38, cx - 22]) { const r = o.small ? 2 : 5; ellipse(x, wx0, railY - r + 1, r, r, P.ink); if (!o.small) { ellipse(x, wx0, railY - 4, 3, 3, P.stone2); const a = (o.spin ?? t * 8) + wx0; pset(x, wx0 + ri(Math.cos(a) * 2), railY - 4 + ri(Math.sin(a) * 2), P.ink); } }
    if (c === 0) { rect(x, cx - 3, top + 8, 3, 8, T.lights > 0.4 ? P.amber2 : P.cream1); block(x, cx - 24, top + 2, 20, 9, P.ink); text(x, '7', cx - 14, top + 2, P.honey0, FONT.tiny, { align: 'center' }); }
  }
  x.restore();
}
