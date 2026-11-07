'use strict';
/*
 * The flat and the remembered places, 180×320 art pixels each, seen from a gently
 * raised angle and framed at 2× (3× for closer mediums). True scale: people 16×44,
 * 1 m ≈ 26 px, table top 19 px above the floor.
 *
 * Every set takes a `period`:
 *   'now'   — overcast afternoon, lamp off: grey blue-green, old wood, soft off-white;
 *             diffuse light, shadows without clear edges.
 *   'early' — the first months: honey sun, brick red, yellow-green; a plant in leaf.
 *   'late'  — the same rooms later: flat, even light; the same things, more space between people.
 * What is on the table is passed in (`st.items`), so objects only move when the story moves them.
 */
const SET_W = 180, SET_H = 320;
const LOOKS = {
  now: { wall: '#9aa59f', wall2: '#909b96', trim: P.wood2, floor: P.wood2, floor2: '#5e4a3a', seam: P.wood1, sky: ['#9aa3a5', '#aab1b1', '#b8bdbb', '#c3c6c2'], tint: P.slate1, tintA: 0.28, sun: 0, glow: P.mist1 },
  early: { wall: '#e3cfa6', wall2: '#d9c397', trim: P.wood3, floor: P.wood3, floor2: '#7c6249', seam: P.wood2, sky: ['#9ec3d9', '#b9d3df', '#dcdcc6', '#f0d9a6'], tint: P.honey1, tintA: 0.06, sun: 1, glow: P.honey0 },
  late: { wall: '#c3bca9', wall2: '#b8b19d', trim: P.wood2, floor: P.wood2, floor2: '#6a5642', seam: P.wood1, sky: ['#b6bcbc', '#c2c5c1', '#cccbc4', '#d4d0c6'], tint: P.slate3, tintA: 0.12, sun: 0.25, glow: P.cream1 },
};

// ------------------------------------------------------------- shared furniture
function planksFloor(x, px, py, w, h, base, alt, seam, seed) {
  rect(x, px, py, w, h, base);
  for (let y = 0, row = 0; y < h; y += 8, row++) {
    let sx = -Math.floor(hash2(row, seed) * 40);
    while (sx < w) {
      const len = 30 + Math.floor(hash3(row, sx, seed) * 30);
      if (hash3(sx, row, seed + 1) < 0.3) rect(x, px + Math.max(0, sx), py + y + 1, Math.min(len, w - Math.max(0, sx)), 7, alt);
      vline(x, px + sx + len, py + y + 1, py + y + 7, seam);
      sx += len + 1;
    }
    hline(x, px, px + w - 1, py + y, seam);
  }
}
function tableSquare(x, px, py, w, d, h, top, side, hi) { // a square table from a raised angle: top d deep, apron, legs h long
  rect(x, px, py, w, d, P.ink); rect(x, px + 1, py + 1, w - 2, d - 2, top); hline(x, px + 1, px + w - 2, py + 1, hi);
  for (let k = 4; k < w - 4; k += 9) if (hash(k + px) < 0.5) hline(x, px + k, px + k + 5, py + 3 + (k % 5) * 3, mixHex(top, side, 0.4)); // grain
  rect(x, px, py + d - 1, w, 5, P.ink); rect(x, px + 1, py + d - 1, w - 2, 4, side);
  for (const lx of [px + 2, px + w - 6]) { rect(x, lx, py + d + 3, 4, h - 4, P.ink); rect(x, lx + 1, py + d + 3, 2, h - 5, side); }
}
function chair(x, cx, fy, facing, wood, seat) { // side view, seat 12 px up, back on the far side
  const s = facing === 'right' ? -1 : 1, top = fy - 12;
  rect(x, cx - 7, top - 1, 15, 4, P.ink); rect(x, cx - 6, top, 13, 2, seat);
  rect(x, cx - 7, top + 3, 2, 10, P.ink); rect(x, cx + 6, top + 3, 2, 10, P.ink);
  const bx = cx + s * 6; rect(x, bx - 1, top - 20, 3, 21, P.ink); rect(x, bx, top - 19, 1, 19, wood);
  rect(x, bx - (s > 0 ? 7 : 0) + (s > 0 ? 0 : 0), top - 20, 8, 3, P.ink); rect(x, bx - (s > 0 ? 6 : 0) + (s > 0 ? 0 : 1), top - 19, 6, 1, wood);
}
// Table things, drawn small at set scale. All positions are table-top coordinates.
function cupSmall(x, px, py, kind, t, steam) { blit(x, kind === 'his' ? 'cup2' : 'cup', px - 4, py - 4); if (steam > 0) for (let k = 0; k < 2; k++) { const ph = mod(t * 0.5 + k / 2, 1); if (ph < steam) pset(x, px - 1 + k * 2 + ri(Math.sin(t * 2 + k)), py - 6 - ri(ph * 10), P.white); } }
function photoSmall(x, px, py, rot) { rect(x, px - 1, py - 1, 10, 8, P.ink); rect(x, px, py, 8, 6, P.white); rect(x, px + 1, py + 1, 6, 4, P.honey1); pset(x, px + 2, py + 2, P.ink); pset(x, px + 5, py + 2, P.ink); }
function receiptSmall(x, px, py) { rect(x, px - 1, py - 1, 8, 6, P.ink); rect(x, px, py, 6, 4, P.cream0); hline(x, px + 1, px + 4, py + 1, P.slate3); pset(x, px + 5, py, P.cream2); }
function ashtray(x, px, py, t, smoke) {
  ellipse(x, px, py, 5, 2, P.ink); ellipse(x, px, py, 4, 1, P.glass2); pset(x, px - 2, py, P.slate3); pset(x, px + 1, py, P.slate2);
  if (smoke > 0) for (let k = 0; k < 6; k++) { const v = k / 6; if (v > smoke) break; pset(x, px + 1 + ri(Math.sin(t * 1.3 + k * 0.9) * (1 + v * 3)), py - 2 - k * 2, P.smoke); }
}
function penSmall(x, px, py) { line(x, px, py, px + 6, py - 2, P.ink); pset(x, px + 6, py - 2, P.slate4); }
function curtain(x, px, py, w, h, cols, breathe) {
  const b = ri(breathe * 2);
  for (let y = 0; y < h; y++) { const bulge = ri(Math.sin(y / h * Math.PI) * b); rect(x, px, py + y, w + bulge, 1, cols[0]); }
  for (let k = 0; k < Math.floor(w / 3); k++) for (let y = 2; y < h; y++) { const bulge = ri(Math.sin(y / h * Math.PI) * b * (k + 1) / 3); if ((y + k) % 5) pset(x, px + 1 + k * 3 + bulge, py + y, cols[1]); }
  hline(x, px, px + w + b, py + h, cols[1]);
}
function cloudsSky(x, px, py, w, h, L, t) {
  const bh = Math.ceil(h / 4); L.sky.forEach((c, i) => rect(x, px, py + i * bh, w, bh + 1, c));
  for (let k = 0; k < 6; k++) { const cx = px + mod(k * 31 + t * 1.2, w + 40) - 20, cy = py + 6 + (k % 3) * 7; ellipse(x, cx, cy, 14, 4, mixHex(L.sky[1], P.white, L === LOOKS.early ? 0.6 : 0.15)); ellipse(x, cx + 6, cy - 2, 8, 3, mixHex(L.sky[0], P.white, L === LOOKS.early ? 0.7 : 0.1)); }
}

// ------------------------------------------------------------- the main room
// A 3/4 view filled edge to edge. Back wall: the old window (thin curtain half drawn,
// a heavier one at the side, a radiator under the sill), a tall bookcase, the frame
// (or the pale mark it left), a calendar, a clock, the floor lamp. Floor: the square
// table by the window with a chair each side (left = hers, right = his), a patterned
// rug, the sofa against the right wall with a coffee table, a big plant, a floor
// cushion, a blanket basket, and the top of a low bookcase along the near edge.
const ROOM = { win: { x: 10, y: 12, w: 50, h: 52 }, table: { x: 30, y: 98, w: 54, d: 24, h: 18 }, chairL: 22, chairR: 92, chairY: 148, sofa: { x: 104, y: 60 }, frame: { x: 100, y: 16 } };
function roomSet(x, R, st, t) {
  const per = st.period || 'now', L = LOOKS[per], early = per === 'early', ox = R.x, oy = R.y, X = v => ox + v, Y = v => oy + v;
  const wood = early ? P.wood3 : P.wood2, woodD = early ? P.wood2 : P.wood1, woodL = early ? P.wood4 : P.wood3;
  // ---- back wall
  plaster(x, { x: ox, y: oy, w: SET_W, h: 90 }, L.wall, L.wall2, mixHex(L.wall, P.white, 0.1), 3);
  rect(x, ox, oy, SET_W, 3, mixHex(L.wall, P.ink, 0.25)); // the ceiling's edge in shadow
  rect(x, ox, Y(84), SET_W, 6, L.trim); hline(x, ox, ox + SET_W, Y(84), mixHex(L.trim, P.white, 0.25)); hline(x, ox, ox + SET_W, Y(90), P.ink);
  // ---- floor: planks running away from us
  woodPlanks(x, { x: ox, y: Y(91), w: SET_W, h: R.h - 91 }, L.floor, L.floor2, L.seam, mixHex(L.floor, P.white, 0.12), 5, false);
  // ---- window
  const w = ROOM.win, wx = X(w.x), wy = Y(w.y), fr = mixHex(P.cream1, L.wall, 0.3), frD = mixHex(P.cream3, L.wall, 0.3);
  rect(x, wx - 3, wy - 3, w.w + 6, w.h + 6, P.ink); rect(x, wx - 2, wy - 2, w.w + 4, w.h + 4, fr); vline(x, wx + w.w + 1, wy - 2, wy + w.h + 1, frD);
  clip(x, { x: wx, y: wy, w: w.w, h: w.h }, () => {
    cloudsSky(x, wx, wy, w.w, w.h, L, t);
    for (let k = 0; k < 5; k++) { const bx = wx - 3 + k * 12, bh = 16 + hash(k + 2) * 20, col = mixHex(L.sky[3], P.slate2, early ? 0.25 : 0.5); rect(x, bx, wy + w.h - bh, 11, bh, col); for (let r = 0; r < 4; r++) for (let c = 0; c < 2; c++) pset(x, bx + 3 + c * 4, wy + w.h - bh + 4 + r * 5, per === 'late' && hash3(k, r, c) < 0.2 ? P.honey1 : mixHex(col, P.ink, 0.3)); }
    if (st.car !== undefined && st.car > 0 && st.car < 1) { const cx = wx - 14 + st.car * (w.w + 28); rect(x, cx, wy + w.h - 5, 10, 4, P.slate1); rect(x, cx + 2, wy + w.h - 7, 6, 2, P.slate2); pset(x, cx + 9, wy + w.h - 4, P.mist2); }
    if (st.reflect) st.reflect(wx, wy, w.w, w.h);
    x.save(); x.globalAlpha = 0.12; poly(x, [[wx + 6, wy], [wx + 14, wy], [wx + 4, wy + w.h], [wx - 4, wy + w.h]], P.white); x.restore();
  });
  vline(x, wx + w.w / 2, wy, wy + w.h - 1, fr); hline(x, wx, wx + w.w - 1, wy + 24, fr);
  rect(x, wx - 5, wy + w.h + 2, w.w + 10, 4, P.ink); rect(x, wx - 4, wy + w.h + 2, w.w + 8, 2, mixHex(P.cream0, L.wall, 0.2));
  plantPot(x, wx + 34, wy + w.h + 2, t, 2); // a small cactus on the sill
  // radiator under the window
  rect(x, wx + 2, Y(70), w.w - 4, 13, P.ink); rect(x, wx + 3, Y(71), w.w - 6, 11, mixHex(P.mist1, L.wall, 0.35)); for (let k = 0; k < 11; k++) vline(x, wx + 5 + k * 4, Y(72), Y(81), mixHex(P.slate4, L.wall, 0.35));
  // curtains
  const cs = st.curtain ?? 0;
  curtain(x, wx - 6, wy - 6, 22 - ri(cs * 10), w.h + 10, [mixHex(P.cream0, L.wall, 0.2), mixHex(P.cream2, L.wall, 0.25)], st.breathe || 0);
  shape(x, [[wx + w.w + 2, wy - 6], [wx + w.w + 10, wy - 6], [wx + w.w + 11, wy + w.h + 6], [wx + w.w + 1, wy + w.h + 6]], mixHex(P.slate4, L.wall, 0.2), { shade: mixHex(P.slate3, L.wall, 0.2), shadeDir: [-1, 0], shadeW: 2 });
  rect(x, wx - 8, wy - 8, w.w + 20, 2, P.wood1);
  // tall bookcase, full: books leaning, a radio, a jar, a framed postcard
  const bc = X(64);
  shape(x, [[bc, Y(4)], [bc + 30, Y(4)], [bc + 30, Y(88)], [bc, Y(88)]], wood, { shade: woodD, shadeDir: [1, 0], shadeW: 2 });
  for (let r = 0; r < 4; r++) {
    const sy = Y(8 + r * 20); rect(x, bc + 2, sy + 17, 26, 2, woodD);
    let bx = bc + 3; const rr = rng(40 + r);
    while (bx < bc + 27) {
      if (rr() < 0.12) { block(x, bx, sy + 9, 6, 8, rr() < 0.5 ? P.mist0 : P.brick1); bx += 7; continue; }
      const bw = 2 + Math.floor(rr() * 2), bh = 9 + Math.floor(rr() * 6), c = [P.brick1, P.slate3, P.honey2, P.cream2, P.blue2, P.leaf2, P.wood3, P.red1][Math.floor(rr() * 8)];
      rect(x, bx, sy + 17 - bh, bw, bh, mixHex(c, L.wall, per === 'now' ? 0.3 : 0.1)); hline(x, bx, bx + bw - 1, sy + 17 - bh, P.ink); bx += bw;
    }
  }
  plantPot(x, bc + 18, Y(4), t, early ? 0 : 2);
  // the frame (early/late) or the pale mark it left (now); calendar; clock; switch
  const fx = X(ROOM.frame.x), fy = Y(ROOM.frame.y);
  if (per === 'now') { rect(x, fx, fy, 20, 24, mixHex(L.wall, P.white, 0.2)); pset(x, fx + 10, fy - 3, P.slate1); pset(x, fx + 10, fy - 2, P.slate2); }
  else { shape(x, [[fx, fy], [fx + 20, fy], [fx + 20, fy + 24], [fx, fy + 24]], P.wood1, { shade: P.wood0, shadeDir: [1, 1], shadeW: 1 }); rect(x, fx + 2, fy + 2, 16, 20, P.cream0); ellipse(x, fx + 10, fy + 11, 5, 5, early ? P.brick0 : P.slate4); hline(x, fx + 3, fx + 16, fy + 17, P.leaf2); hline(x, fx + 3, fx + 16, fy + 18, P.leaf3); }
  block(x, X(124), Y(14), 12, 16, P.white); rect(x, X(125), Y(15), 10, 4, early ? P.brick1 : P.slate3); for (let k = 0; k < 9; k++) pset(x, X(126 + (k % 3) * 3), Y(21 + Math.floor(k / 3) * 3), P.slate4);
  ellipse(x, X(150), Y(22), 6, 6, P.ink); ellipse(x, X(150), Y(22), 5, 5, P.cream0); line(x, X(150), Y(22), X(150), Y(18), P.ink); line(x, X(150), Y(22), X(153), Y(23), P.ink);
  block(x, X(165), Y(46), 5, 6, P.mist2);
  // floor lamp
  rect(x, X(97), Y(34), 2, 56, P.ink); shape(x, [[X(91), Y(28)], [X(105), Y(28)], [X(102), Y(20)], [X(94), Y(20)]], st.lamp ? P.honey0 : mixHex(P.cream1, L.wall, 0.35), { shade: st.lamp ? P.honey1 : mixHex(P.cream2, L.wall, 0.35), shadeDir: [1, 0], shadeW: 2 }); ellipse(x, X(98), Y(90), 5, 2, P.ink);
  // ---- the patterned rug under table, armchair and coffee table: border band, a field of small motifs
  const rg = { x: 4, y: 102, w: 172, h: 150 }, rc = early ? [P.brick1, P.brick2, P.honey1, P.cream1, P.brick3] : per === 'late' ? [mixHex(P.brick2, P.cream3, 0.45), mixHex(P.brick3, P.cream3, 0.4), mixHex(P.honey2, P.cream3, 0.5), mixHex(P.cream2, P.slate4, 0.3), mixHex(P.brick3, P.slate1, 0.5)] : [mixHex(P.brick2, P.slate2, 0.4), mixHex(P.brick3, P.slate1, 0.4), mixHex(P.honey2, P.slate3, 0.4), mixHex(P.cream2, P.slate4, 0.3), mixHex(P.brick3, P.slate0, 0.5)];
  rect(x, X(rg.x), Y(rg.y), rg.w, rg.h, P.ink); rect(x, X(rg.x + 1), Y(rg.y + 1), rg.w - 2, rg.h - 2, rc[1]);
  rect(x, X(rg.x + 4), Y(rg.y + 4), rg.w - 8, rg.h - 8, rc[0]); rect(x, X(rg.x + 11), Y(rg.y + 11), rg.w - 22, rg.h - 22, rc[1]); rect(x, X(rg.x + 12), Y(rg.y + 12), rg.w - 24, rg.h - 24, rc[0]);
  for (let k = 8; k < rg.w - 8; k += 6) { const cx = X(rg.x + k), t1 = Y(rg.y + 7), b1 = Y(rg.y + rg.h - 8); for (const cy of [t1, b1]) { pset(x, cx, cy, rc[2]); pset(x, cx - 1, cy, rc[3]); pset(x, cx + 1, cy, rc[3]); pset(x, cx, cy - 1, rc[4]); pset(x, cx, cy + 1, rc[4]); } }
  for (let j = 10; j < rg.h - 10; j += 6) { const cy = Y(rg.y + j); for (const cx of [X(rg.x + 7), X(rg.x + rg.w - 8)]) { pset(x, cx, cy, rc[2]); pset(x, cx, cy - 1, rc[3]); pset(x, cx, cy + 1, rc[3]); } }
  for (let k = 0; k < rg.w - 30; k += 10) for (let j = 0; j < rg.h - 30; j += 10) { const cx = X(rg.x + 20 + k + ((j / 10) % 2) * 5), cy = Y(rg.y + 20 + j); pset(x, cx, cy, rc[2]); pset(x, cx - 1, cy + 1, rc[4]); pset(x, cx + 1, cy + 1, rc[4]); pset(x, cx, cy + 2, rc[2]); pset(x, cx, cy + 1, rc[3]); }
  for (let k = 0; k < rg.w; k += 2) { pset(x, X(rg.x + k), Y(rg.y - 1), rc[3]); pset(x, X(rg.x + k + 1), Y(rg.y + rg.h), rc[3]); if (hash(k + 3) < 0.4) pset(x, X(rg.x + k + 1), Y(rg.y + rg.h + 1), rc[3]); } // fringe
  // wear: a paler path from the doorway to the table
  x.save(); x.globalAlpha = 0.08; poly(x, [[X(176), Y(150)], [X(176), Y(172)], [X(90), Y(166)], [X(90), Y(148)]], P.white); x.restore();
  // ---- against the wall on the right: a long low sideboard with the record player, a radio, a vase, books
  const sb = { x: 104, y: 64, w: 74 };
  contactShadow(x, X(sb.x + sb.w / 2), Y(102), sb.w / 2 + 2, 2, 0.3);
  for (const lx of [sb.x + 3, sb.x + sb.w - 6]) { rect(x, X(lx), Y(96), 3, 6, P.ink); pset(x, X(lx + 1), Y(97), woodL); }
  shape(x, [[X(sb.x), Y(sb.y)], [X(sb.x + sb.w), Y(sb.y)], [X(sb.x + sb.w), Y(sb.y + 34)], [X(sb.x), Y(sb.y + 34)]], wood, { shade: woodD, shadeDir: [0, 1], shadeW: 2 });
  rect(x, X(sb.x + 1), Y(sb.y + 1), sb.w - 2, 5, woodL); hline(x, X(sb.x + 1), X(sb.x + sb.w - 2), Y(sb.y + 1), mixHex(woodL, P.white, 0.25)); hline(x, X(sb.x), X(sb.x + sb.w), Y(sb.y + 6), P.ink);
  for (let k = 0; k < 3; k++) { const dx = X(sb.x + 3 + k * 23.5); rect(x, dx, Y(sb.y + 9), 21, 22, P.ink); rect(x, dx + 1, Y(sb.y + 10), 19, 20, k === 1 ? woodD : wood); hline(x, dx + 1, dx + 19, Y(sb.y + 10), woodL); rect(x, dx + (k === 2 ? 3 : 16), Y(sb.y + 18), 1, 4, P.honey2); }
  for (let k = 0; k < 5; k++) hline(x, X(sb.x + 28), X(sb.x + 45), Y(sb.y + 13 + k * 4), mixHex(woodD, P.ink, 0.25)); // a slatted middle door
  // record player
  shape(x, [[X(sb.x + 4), Y(sb.y - 8)], [X(sb.x + 26), Y(sb.y - 8)], [X(sb.x + 26), Y(sb.y + 2)], [X(sb.x + 4), Y(sb.y + 2)]], early ? P.brick1 : P.wood1, { shade: early ? P.brick2 : P.wood0, shadeDir: [0, 1], shadeW: 3 });
  ellipse(x, X(sb.x + 13), Y(sb.y - 4), 7, 3, P.ink); ellipse(x, X(sb.x + 13), Y(sb.y - 4), 6, 2, P.dark0); pset(x, X(sb.x + 13), Y(sb.y - 4), early ? P.red0 : P.honey2); pset(x, X(sb.x + 11), Y(sb.y - 5), P.slate2);
  line(x, X(sb.x + 23), Y(sb.y - 7), X(sb.x + 19), Y(sb.y - 3), P.slate4); pset(x, X(sb.x + 23), Y(sb.y - 7), P.slate5);
  // radio
  shape(x, [[X(sb.x + 30), Y(sb.y - 12)], [X(sb.x + 46), Y(sb.y - 12)], [X(sb.x + 46), Y(sb.y + 1)], [X(sb.x + 30), Y(sb.y + 1)]], early ? P.cream1 : P.mist0, { shade: early ? P.cream2 : P.slate4, shadeDir: [1, 1], shadeW: 1, hi: P.white, hiDir: [0, -1] });
  rect(x, X(sb.x + 32), Y(sb.y - 9), 8, 7, P.wood1); for (let k = 0; k < 3; k++) hline(x, X(sb.x + 32), X(sb.x + 39), Y(sb.y - 8 + k * 2), P.wood2);
  pset(x, X(sb.x + 43), Y(sb.y - 8), P.ink); pset(x, X(sb.x + 43), Y(sb.y - 4), P.ink); line(x, X(sb.x + 44), Y(sb.y - 12), X(sb.x + 50), Y(sb.y - 26), P.slate3);
  // a vase with dried branches, then a stack of books with a little clock on top
  shape(x, [[X(sb.x + 52), Y(sb.y - 10)], [X(sb.x + 56), Y(sb.y - 10)], [X(sb.x + 58), Y(sb.y + 1)], [X(sb.x + 50), Y(sb.y + 1)]], early ? P.leaf1 : P.slate3, { shade: early ? P.leaf2 : P.slate2, shadeDir: [1, 0], shadeW: 2 });
  for (const [dx, dy] of [[-6, -26], [0, -30], [5, -24], [-3, -20]]) { line(x, X(sb.x + 54), Y(sb.y - 10), X(sb.x + 54 + dx), Y(sb.y - 10 + dy), P.wood1); pset(x, X(sb.x + 54 + dx), Y(sb.y - 10 + dy), early ? P.honey1 : P.cream3); pset(x, X(sb.x + 54 + dx * 0.6), Y(sb.y - 10 + dy * 0.6), early ? P.honey0 : P.cream2); }
  for (let k = 0; k < 3; k++) { const c = [P.slate2, P.brick1, P.cream1][k]; rect(x, X(sb.x + 61 - k), Y(sb.y - 3 - k * 3), 13, 4, P.ink); rect(x, X(sb.x + 62 - k), Y(sb.y - 2 - k * 3), 11, 2, early ? mixHex(c, P.honey0, 0.2) : c); }
  // ---- the armchair (its back to us, turned to the record player) and a reading lamp beside it
  const ac = early ? [P.honey1, P.honey2, P.honey3, P.honey0] : per === 'late' ? [P.beige1, P.beige2, P.wood3, P.beige0] : [P.mist0, P.slate4, P.slate3, P.mist1];
  x.save(); x.translate(0, -40);
  contactShadow(x, X(150), Y(206), 26, 3, 0.3);
  for (const lx of [131, 167]) { rect(x, X(lx), Y(198), 3, 7, P.ink); pset(x, X(lx + 1), Y(199), woodL); }
  shape(x, [[X(128), Y(176)], [X(136), Y(172)], [X(138), Y(200)], [X(128), Y(200)]], ac[1], { shade: ac[2], shadeDir: [0, 1], shadeW: 3, hi: ac[0], hiDir: [0, -1] });
  shape(x, [[X(164), Y(172)], [X(172), Y(176)], [X(172), Y(200)], [X(162), Y(200)]], ac[1], { shade: ac[2], shadeDir: [0, 1], shadeW: 3, hi: ac[0], hiDir: [0, -1] });
  shape(x, [[X(134), Y(160)], [X(140), Y(155)], [X(160), Y(155)], [X(166), Y(160)], [X(166), Y(200)], [X(134), Y(200)]], ac[0], { shade: ac[2], shadeDir: [0, 1], shadeW: 4, hi: ac[3], hiDir: [0, -1] });
  for (let k = 0; k < 4; k++) vline(x, X(141 + k * 6), Y(162), Y(194), mixHex(ac[0], ac[1], 0.6));
  for (let k = 0; k < 4; k++) pset(x, X(141 + k * 6), Y(166 + (k % 2) * 10), ac[2]);
  if (per !== 'late') { shape(x, [[X(150), Y(154)], [X(168), Y(158)], [X(170), Y(186)], [X(160), Y(190)], [X(154), Y(170)]], early ? P.leaf1 : P.beige1, { shade: early ? P.leaf2 : P.beige2, shadeDir: [1, 1], shadeW: 2, hi: early ? P.leaf0 : P.beige0, hiDir: [-1, 0] }); for (let k = 0; k < 4; k++) pset(x, X(161 + (k % 2)), Y(189 + k), early ? P.leaf2 : P.beige2); }
  x.restore();
  // her tote bag slumped by her chair; his slippers by the armchair (not any more, now)
  x.save(); x.translate(0, -58);
  shape(x, [[X(4), Y(206)], [X(14), Y(204)], [X(16), Y(218)], [X(4), Y(220)]], early ? P.cream1 : P.cream2, { shade: early ? P.cream2 : P.cream3, shadeDir: [1, 1], shadeW: 2, hi: P.cream0, hiDir: [0, -1] });
  for (let k = 0; k < 6; k++) pset(x, X(6 + ri(Math.sin(k / 5 * Math.PI) * 4)), Y(204 - ri(Math.sin(k / 5 * Math.PI) * 5)), P.wood1);
  x.restore();
  if (per !== 'now') for (const [sx, sy] of [[124, 164], [132, 166]]) { shape(x, [[X(sx), Y(sy)], [X(sx + 6), Y(sy)], [X(sx + 6), Y(sy + 9)], [X(sx), Y(sy + 9)]], early ? P.olive0 : P.dark0, { shade: early ? P.olive1 : P.dark1, shadeDir: [0, 1], shadeW: 2 }); hline(x, X(sx + 1), X(sx + 4), Y(sy + 2), early ? P.olive2 : P.slate2); }
  // ---- the table, the chairs and what is on the table
  const tb = ROOM.table;
  if (st.chairR !== false) chair(x, X(st.chairRX ?? ROOM.chairR), Y(ROOM.chairY), st.chairRFace || 'left', woodD, early ? P.brick1 : wood);
  contactShadow(x, X(tb.x + tb.w / 2), Y(tb.y + tb.d + tb.h), tb.w / 2 + 4, 3, 0.3);
  tableSquare(x, X(tb.x), Y(tb.y), tb.w, tb.d, tb.h, early ? P.wood4 : P.wood3, P.wood1, mixHex(P.wood4, P.white, 0.25));
  if (st.chairL !== false) chair(x, X(st.chairLX ?? ROOM.chairL), Y(ROOM.chairY), st.chairLFace || 'right', woodD, early ? P.brick1 : wood);
  for (const it of st.items || []) tableItem(x, X(tb.x + it.x), Y(tb.y + it.y), it, t);
  // ---- people
  if (st.people) for (const p of st.people) { if (!p.sit) shadowAt(x, X(p.x), Y(p.y)); drawPerson(x, p.who, X(p.x), Y(p.y), { ...p, t }); }
  if (st.after) st.after(X, Y);
  // a low stool by the wall with folded laundry and a newspaper; a standing fan beside it
  { const sx = 8, sy = 168; contactShadow(x, X(sx + 12), Y(sy + 20), 14, 2, 0.3); for (const lx of [sx + 1, sx + 20]) { rect(x, X(lx), Y(sy + 6), 3, 13, P.ink); pset(x, X(lx + 1), Y(sy + 7), woodL); }
    shape(x, [[X(sx - 1), Y(sy)], [X(sx + 25), Y(sy)], [X(sx + 25), Y(sy + 7)], [X(sx - 1), Y(sy + 7)]], woodL, { shade: wood, shadeDir: [0, 1], shadeW: 2, hi: mixHex(woodL, P.white, 0.25), hiDir: [0, -1] });
    const fc = early ? [P.leaf1, P.cream1, P.honey1] : [P.blue1, P.cream1, P.beige1];
    for (let k = 0; k < 3; k++) shape(x, [[X(sx + 2 + k), Y(sy - 4 - k * 4)], [X(sx + 18 - k), Y(sy - 4 - k * 4)], [X(sx + 18 - k), Y(sy - k * 4)], [X(sx + 2 + k), Y(sy - k * 4)]], fc[k], { shade: mixHex(fc[k], P.ink, 0.2), shadeDir: [0, 1], shadeW: 1 });
    shape(x, [[X(sx + 12), Y(sy - 2)], [X(sx + 24), Y(sy - 3)], [X(sx + 25), Y(sy + 1)], [X(sx + 13), Y(sy + 2)]], P.cream2, { shade: P.cream3, shadeDir: [0, 1], shadeW: 1 }); hline(x, X(sx + 15), X(sx + 21), Y(sy - 1), P.slate3); }
  // ---- nearer: the coffee table, then the sofa with its back to us (it faces the window)
  const ct = { x: 64, y: 168 };
  contactShadow(x, X(ct.x + 27), Y(ct.y + 27), 30, 2, 0.3);
  for (const lx of [ct.x + 2, ct.x + 49]) { rect(x, X(lx), Y(ct.y + 18), 3, 8, P.ink); pset(x, X(lx + 1), Y(ct.y + 19), wood); }
  shape(x, [[X(ct.x), Y(ct.y)], [X(ct.x + 54), Y(ct.y)], [X(ct.x + 54), Y(ct.y + 18)], [X(ct.x), Y(ct.y + 18)]], woodL, { shade: wood, shadeDir: [0, 1], shadeW: 4, hi: mixHex(woodL, P.white, 0.2), hiDir: [0, -1] });
  block(x, X(ct.x + 5), Y(ct.y + 3), 14, 9, early ? P.cream1 : P.blue2); block(x, X(ct.x + 7), Y(ct.y + 1), 12, 9, early ? P.brick0 : P.mist0); hline(x, X(ct.x + 9), X(ct.x + 16), Y(ct.y + 4), P.slate3);
  if (early) blit(x, 'cup2', X(ct.x + 26), Y(ct.y + 3));
  rect(x, X(ct.x + 24), Y(ct.y + 11), 8, 3, P.ink); rect(x, X(ct.x + 25), Y(ct.y + 11), 6, 2, P.slate1); pset(x, X(ct.x + 26), Y(ct.y + 11), P.red0);
  plantPot(x, X(ct.x + 44), Y(ct.y + 12), t, early ? 0 : 1);
  const sf = { x: 22, y: 198, w: 128 }, sc = early ? [P.brick1, P.brick2, P.brick3, P.brick0] : per === 'late' ? [P.slate3, P.slate2, P.slate1, P.slate4] : [P.slate2, P.slate1, P.slate0, P.slate3];
  // cushions showing over the back
  shape(x, [[X(sf.x + 14), Y(sf.y - 9)], [X(sf.x + 34), Y(sf.y - 11)], [X(sf.x + 36), Y(sf.y + 2)], [X(sf.x + 14), Y(sf.y + 2)]], early ? P.honey1 : P.mist0, { shade: early ? P.honey2 : P.slate4, shadeDir: [1, 0], shadeW: 2, hi: early ? P.honey0 : P.mist1, hiDir: [0, -1] });
  shape(x, [[X(sf.x + 90), Y(sf.y - 10)], [X(sf.x + 110), Y(sf.y - 8)], [X(sf.x + 110), Y(sf.y + 2)], [X(sf.x + 88), Y(sf.y + 2)]], early ? P.leaf1 : P.beige1, { shade: early ? P.leaf2 : P.beige2, shadeDir: [1, 0], shadeW: 2, hi: early ? P.leaf0 : P.beige0, hiDir: [0, -1] });
  contactShadow(x, X(sf.x + sf.w / 2), Y(sf.y + 44), sf.w / 2 + 4, 3, 0.35);
  for (const ax of [sf.x - 4, sf.x + sf.w - 6]) shape(x, [[X(ax), Y(sf.y - 2)], [X(ax + 10), Y(sf.y - 2)], [X(ax + 10), Y(sf.y + 40)], [X(ax), Y(sf.y + 40)]], sc[1], { shade: sc[2], shadeDir: [0, 1], shadeW: 3, hi: sc[0], hiDir: [0, -1] });
  shape(x, [[X(sf.x + 4), Y(sf.y)], [X(sf.x + sf.w - 6), Y(sf.y)], [X(sf.x + sf.w - 6), Y(sf.y + 40)], [X(sf.x + 4), Y(sf.y + 40)]], sc[0], { shade: sc[2], shadeDir: [0, 1], shadeW: 6, hi: sc[3], hiDir: [0, -1] });
  hline(x, X(sf.x + 5), X(sf.x + sf.w - 7), Y(sf.y + 4), mixHex(sc[0], sc[1], 0.5)); // the back's top roll
  for (let k = 1; k < 4; k++) vline(x, X(sf.x + 4 + k * (sf.w - 10) / 4), Y(sf.y + 6), Y(sf.y + 33), mixHex(sc[0], sc[1], 0.6)); // panel seams
  for (let k = 0; k < 24; k++) pset(x, X(sf.x + 8 + hash(k * 5) * (sf.w - 18)), Y(sf.y + 8 + hash(k * 7) * 24), mixHex(sc[0], sc[1], 0.35)); // the weave
  if (per !== 'late' || st.blanket) { shape(x, [[X(sf.x + 60), Y(sf.y - 2)], [X(sf.x + 84), Y(sf.y - 3)], [X(sf.x + 86), Y(sf.y + 26)], [X(sf.x + 76), Y(sf.y + 30)], [X(sf.x + 62), Y(sf.y + 22)]], early ? P.cream1 : P.beige1, { shade: early ? P.cream2 : P.beige2, shadeDir: [1, 1], shadeW: 2, hi: early ? P.cream0 : P.beige0, hiDir: [0, -1] }); for (let k = 0; k < 5; k++) pset(x, X(sf.x + 64 + k * 4), Y(sf.y + 24 + (k % 2) + ri(k * 1.3)), early ? P.cream3 : P.beige2); } // a throw over the back
  for (const lx of [sf.x, sf.x + sf.w - 6]) rect(x, X(lx), Y(sf.y + 40), 3, 4, P.ink);
  // ---- the near floor: the big plant, a record crate, a blanket basket, a pouf, magazines
  const pl = { x: 14, y: 296 };
  contactShadow(x, X(pl.x), Y(pl.y + 1), 14, 2, 0.35);
  for (const [a, l, c] of [[-2.5, 22, 0], [-2.1, 34, 1], [-1.75, 40, 0], [-1.45, 36, 1], [-1.15, 30, 0], [-0.8, 24, 1], [-2.85, 16, 1], [-1.6, 24, 0]]) leafShape(x, X(pl.x), Y(pl.y - 18), l, a + Math.sin(t * 0.6 + a * 3) * 0.015, c ? (early ? P.leaf1 : P.leaf2) : (early ? P.leaf2 : P.leaf3), c ? (early ? P.leaf0 : P.leaf1) : (early ? P.leaf1 : P.leaf2));
  shape(x, [[X(pl.x - 11), Y(pl.y - 20)], [X(pl.x + 11), Y(pl.y - 20)], [X(pl.x + 9), Y(pl.y)], [X(pl.x - 9), Y(pl.y)]], P.brick1, { shade: P.brick2, shadeDir: [1, 0], shadeW: 4, hi: P.brick0, hiDir: [-1, 0] });
  rect(x, X(pl.x - 11), Y(pl.y - 20), 22, 3, P.ink); rect(x, X(pl.x - 10), Y(pl.y - 19), 20, 1, P.brick0); hline(x, X(pl.x - 9), X(pl.x + 6), Y(pl.y - 12), P.brick2);
  x.save(); x.translate(-56, 0);
  shape(x, [[X(92), Y(268)], [X(118), Y(268)], [X(118), Y(292)], [X(92), Y(292)]], woodD, { shade: P.wood0, shadeDir: [1, 0], shadeW: 3, hi: wood, hiDir: [0, -1] });
  for (let k = 0; k < 9; k++) { const c = [P.slate1, P.brick1, P.cream1, P.honey2, P.blue2, P.dark0, P.leaf2, P.red1, P.cream2][k]; rect(x, X(94 + k * 2.6), Y(260 + (k % 3)), 3, 10, P.ink); rect(x, X(95 + k * 2.6), Y(261 + (k % 3)), 1, 8, c); }
  hline(x, X(94), X(116), Y(279), P.wood0);
  x.restore();
  x.save(); x.translate(-50, 2);
  shape(x, [[X(126), Y(262)], [X(152), Y(262)], [X(150), Y(290)], [X(128), Y(290)]], P.cream3, { shade: P.wood2, shadeDir: [1, 0], shadeW: 3 }); for (let k = 0; k < 6; k++) vline(x, X(129 + k * 4), Y(264), Y(288), P.wood3); for (let k = 0; k < 4; k++) hline(x, X(128), X(150), Y(268 + k * 6), mixHex(P.cream3, P.wood3, 0.5));
  shape(x, [[X(125), Y(258)], [X(150), Y(254)], [X(155), Y(264)], [X(122), Y(266)]], early ? P.brick0 : P.slate3, { shade: early ? P.brick1 : P.slate2, shadeDir: [0, 1], shadeW: 2, hi: early ? P.cream1 : P.slate4, hiDir: [0, -1] });
  x.restore();
  contactShadow(x, X(89), Y(294), 14, 2, 0.3); contactShadow(x, X(49), Y(294), 14, 2, 0.3);
  { const pc = early ? [P.leaf1, P.leaf0, P.leaf2] : per === 'late' ? [P.beige2, P.beige1, P.wood3] : [P.slate3, P.slate4, P.slate2]; contactShadow(x, X(128), Y(292), 14, 2, 0.3); ellipse(x, X(128), Y(282), 13, 9, P.ink); ellipse(x, X(128), Y(282), 12, 8, pc[0]); ellipse(x, X(128), Y(278), 12, 5, P.ink); ellipse(x, X(128), Y(278), 11, 4, pc[1]); for (let k = -9; k <= 9; k += 3) vline(x, X(128 + k), Y(283), Y(288 - Math.abs(k) / 3), pc[2]); } // a knitted pouf
  for (let k = 0; k < 4; k++) { const c = [P.cream1, P.slate4, P.honey0, P.brick0][k]; shape(x, [[X(152 + k), Y(290 - k * 4)], [X(172 + k), Y(289 - k * 4)], [X(172 + k), Y(293 - k * 4)], [X(152 + k), Y(294 - k * 4)]], c, { shade: mixHex(c, P.ink, 0.25), shadeDir: [0, 1], shadeW: 1 }); }
  // ---- the nearest strip of floor falls into shadow (the subtitle sits here)
  x.save(); x.globalAlpha = 0.18; rect(x, ox, Y(300), SET_W, R.h - 300, P.ink); x.globalAlpha = 0.12; rect(x, ox, Y(294), SET_W, 6, P.ink); x.restore();
  // ---- light: the window's light on the floor, the grade of the period, the lamp
  if (early) lightSteps(x, [[wx + 2, Y(92)], [wx + w.w, Y(92)], [wx + w.w + 30, Y(190)], [wx + 30, Y(190)]], P.honey0, [[[0, 0], 0.1], [[6, 6], 0.08]]);
  else lightSteps(x, [[wx + 2, Y(92)], [wx + w.w, Y(92)], [wx + w.w + 26, Y(200)], [wx + 26, Y(200)]], per === 'now' ? P.mist2 : P.cream0, [[[0, 0], 0.045], [[5, 5], 0.035]]);
  shade(x, ox, oy, SET_W, R.h, L.tint, L.tintA);
  if (st.lamp) { glow(x, X(98), Y(26), 30, 24, P.honey0, 0.45 * st.lamp); glow(x, X(98), Y(100), 60, 26, P.honey0, 0.25 * st.lamp); }
  if (st.flash) shade(x, ox, oy, SET_W, R.h, P.white, st.flash);
}
// A small potted plant standing on py (pot bottom). kind 0: leafy pothos, 1: small fern, 2: cactus.
function plantPot(x, px, py, t, kind) {
  px = ri(px); py = ri(py);
  if (kind === 2) {
    shape(x, [[px - 3, py - 12], [px + 3, py - 12], [px + 3, py - 5], [px - 3, py - 5]], P.leaf2, { shade: P.leaf3, shadeDir: [1, 0], shadeW: 1, hi: P.leaf1, hiDir: [-1, 0] });
    shape(x, [[px + 2, py - 10], [px + 6, py - 10], [px + 6, py - 7], [px + 2, py - 7]], P.leaf2, { shade: P.leaf3, shadeDir: [0, 1], shadeW: 1 });
    pset(x, px - 1, py - 9, P.leaf0); pset(x, px + 1, py - 7, P.leaf0);
  } else {
    const n = kind === 0 ? 5 : 4;
    for (let k = 0; k < n; k++) { const a = -Math.PI / 2 + (k - (n - 1) / 2) * 0.55 + Math.sin(t * 0.7 + k) * 0.03; leafShape(x, px, py - 5, kind === 0 ? 8 + (k % 2) * 3 : 7, a, kind === 0 ? P.leaf1 : P.leaf2, kind === 0 ? P.leaf2 : P.leaf3); }
  }
  shape(x, [[px - 4, py - 6], [px + 4, py - 6], [px + 3, py], [px - 3, py]], P.brick1, { shade: P.brick2, shadeDir: [1, 0], shadeW: 2, hi: P.brick0, hiDir: [0, -1] });
}
function leafShape(x, cx, cy, len, ang, col, rib) {
  const ca = Math.cos(ang), sa = Math.sin(ang), w = len * 0.3, tip = [cx + ca * len, cy + sa * len], mid = [cx + ca * len * 0.45, cy + sa * len * 0.45];
  shape(x, [[cx, cy], [mid[0] - sa * w, mid[1] + ca * w], tip, [mid[0] + sa * w, mid[1] - ca * w]], col, { shade: mixHex(col, P.ink, 0.25), shadeDir: [0, 1], shadeW: 1 });
  line(x, cx, cy, ri(cx + ca * len * 0.85), ri(cy + sa * len * 0.85), rib);
}
function tableItem(x, px, py, it, t) {
  if (it.k === 'cup') cupSmall(x, px, py, it.kind, t, it.steam || 0);
  else if (it.k === 'photo') photoSmall(x, px, py);
  else if (it.k === 'receipt') receiptSmall(x, px, py);
  else if (it.k === 'ash') ashtray(x, px, py, t, it.smoke || 0);
  else if (it.k === 'pen') penSmall(x, px, py);
  else if (it.k === 'paper') { rect(x, px - 1, py - 1, 14, 10, P.ink); rect(x, px, py, 12, 8, P.cream0); for (let k = 0; k < 3; k++) hline(x, px + 2, px + 9 - k * 2, py + 2 + k * 2, P.slate3); }
  else if (it.k === 'bowl') { blit(x, 'bowl', px - 4, py - 2); if (it.steam) for (let k = 0; k < 2; k++) { const ph = mod(t * 0.6 + k / 2, 1); pset(x, px - 1 + k * 3, py - 4 - ri(ph * 8), P.white); } }
  else if (it.k === 'box') { rect(x, px - 1, py - 1, 12, 8, P.ink); rect(x, px, py, 10, 6, P.cream1); rect(x, px + 3, py, 4, 6, P.brick1); }
  else if (it.k === 'plate') { // a plate of food: eggplant (dark, glossy), egg (yellow-red), greens
    ellipse(x, px, py, 8, 3, P.ink); ellipse(x, px, py, 7, 2, P.white); hline(x, px - 5, px + 5, py + 2, P.cream2);
    const c = it.dish === 'egg' ? [P.honey0, P.red0, P.honey1] : it.dish === 'greens' ? [P.leaf1, P.leaf2, P.leaf3] : [P.brick2, P.brick3, P.honey2];
    const eaten = it.eaten || 0; for (let k = 0; k < 9 - ri(eaten * 6); k++) { const a = k * 2.3, r = (k % 3) * 1.6; pset(x, px + ri(Math.cos(a) * r * 1.8), py + ri(Math.sin(a) * r * 0.5) - 1, c[k % 3]); pset(x, px + ri(Math.cos(a) * r * 1.8) + 1, py + ri(Math.sin(a) * r * 0.5) - 1, c[(k + 1) % 3]); }
    if (it.steam) for (let k = 0; k < 2; k++) { const ph = mod(t * 0.6 + k / 2, 1); pset(x, px - 2 + k * 4 + ri(Math.sin(t * 2 + k)), py - 4 - ri(ph * 8), P.white); } }
  else if (it.k === 'rice') { ellipse(x, px, py, 4, 2, P.ink); rect(x, px - 3, py - 2, 7, 3, P.white); ellipse(x, px, py - 2, 3, 1, P.white); pset(x, px - 1, py - 3, P.cream1); hline(x, px - 3, px + 3, py + 1, P.slate4); line(x, px + 4, py - 4, px + 9, py - 1, P.wood3); line(x, px + 5, py - 5, px + 10, py - 2, P.wood3); }
  else if (it.k === 'beer') bottle(x, px, py, P.leaf3, it.label || P.cream1, 13);
  else if (it.k === 'glass') { rect(x, px - 2, py - 7, 5, 8, P.ink); rect(x, px - 1, py - 6, 3, 6, P.glass2); rect(x, px - 1, py - 6 + ri((1 - (it.fill ?? 0.6)) * 6), 3, ri((it.fill ?? 0.6) * 6), P.honey1); pset(x, px - 1, py - 6 + ri((1 - (it.fill ?? 0.6)) * 6), P.white); }
  else if (it.k === 'lamp') { rect(x, px, py - 10, 2, 10, P.ink); block(x, px - 4, py - 15, 10, 6, it.on ? P.honey0 : P.cream2); if (it.on) glow(x, px + 1, py - 4, 22, 10, P.honey0, 0.45 * it.on); }
}

// ------------------------------------------------------------- remembered places
