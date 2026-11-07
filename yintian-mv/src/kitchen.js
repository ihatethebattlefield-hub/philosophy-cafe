'use strict';
/*
 * The kitchen and the entry, seen from the living room through the wide opening.
 * Back wall, left: tiles, the small window over the sink, wall cabinets, the counter with
 * the sink and the drying rack, a kettle, the fridge with the old note. Back wall, right:
 * the short hall: shoe cabinet with the key dish and a mirror, the front door, coat hooks,
 * an umbrella stand. Floor: kitchen tiles with a little oilcloth table; the hall runner.
 * Nearest: the top of the dividing wall and the living-room floor in shadow.
 * 180×320, framed at 2× (whole) or 3× (CAM.kitchen / CAM.entry crops).
 */
const KITCHEN = { sink: { x: 12, y: 60 }, rack: { x: 44, y: 60 }, fridge: { x: 86, y: 10 }, door: { x: 132, y: 18 }, hooks: { x: 165, y: 28 }, dish: { x: 118, y: 64 }, mat: { x: 130, y: 102 }, washAt: [26, 108], doorAt: [146, 112], dishAt: [118, 110] };
function kitchenSet(x, R, st, t) {
  const per = st.period || 'now', L = LOOKS[per], early = per === 'early', ox = R.x, oy = R.y, X = v => ox + v, Y = v => oy + v;
  const wood = early ? P.wood3 : P.wood2, woodD = early ? P.wood2 : P.wood1, woodL = early ? P.wood4 : P.wood3;
  const tile = mixHex(P.mist1, L.wall, 0.35), grout = mixHex(P.mist0, L.wall, 0.5), tileHi = mixHex(P.mist2, L.wall, 0.25);
  // ---- walls
  rect(x, ox, oy, 106, 100, tile);
  for (let y = 0; y < 100; y += 7) hline(x, ox, X(105), Y(y), grout);
  for (let y = 0, r = 0; y < 100; y += 7, r++) for (let k = (r % 2) * 5; k < 106; k += 10) { vline(x, X(k), Y(y), Y(y + 6), grout); if (hash2(k, r) < 0.25) pset(x, X(k + 2), Y(y + 2), tileHi); if (hash2(r, k + 3) < 0.12) rect(x, X(k + 1), Y(y + 1), 9, 6, mixHex(tile, P.white, 0.12)); }
  plaster(x, { x: X(106), y: oy, w: 74, h: 100 }, L.wall, L.wall2, mixHex(L.wall, P.white, 0.1), 7);
  rect(x, X(105), oy, 3, 100, mixHex(L.wall, P.ink, 0.35)); vline(x, X(108), oy, Y(99), mixHex(L.wall, P.white, 0.15)); // the corner
  rect(x, ox, oy, SET_W, 3, mixHex(L.wall, P.ink, 0.3));
  rect(x, X(106), Y(94), 74, 6, L.trim); hline(x, X(106), X(179), Y(94), mixHex(L.trim, P.white, 0.2)); hline(x, ox, X(179), Y(100), P.ink);
  // ---- window over the sink with a café curtain
  const wx = X(12), wy = Y(8);
  rect(x, wx - 2, wy - 2, 36, 34, P.ink); rect(x, wx - 1, wy - 1, 34, 32, mixHex(P.cream1, L.wall, 0.2));
  clip(x, { x: wx, y: wy, w: 32, h: 30 }, () => { cloudsSky(x, wx, wy, 32, 30, L, t); for (let k = 0; k < 3; k++) { const bc = mixHex(L.sky[3], P.slate2, early ? 0.3 : 0.55); rect(x, wx + k * 12 - 2, wy + 12 + (k % 2) * 5, 11, 20, bc); for (let r = 0; r < 3; r++) pset(x, wx + k * 12 + 2, wy + 16 + (k % 2) * 5 + r * 4, per === 'late' && r === 1 ? P.honey1 : mixHex(bc, P.ink, 0.3)); } });
  vline(x, wx + 16, wy, wy + 29, mixHex(P.cream1, L.wall, 0.2));
  const cc = early ? [P.cream0, P.brick0] : [mixHex(P.cream0, L.wall, 0.2), mixHex(P.slate4, L.wall, 0.2)];
  for (let y = 0; y < 13; y++) for (let k = 0; k < 32; k++) pset(x, wx + k, wy + 17 + y, ((k >> 2) + (y >> 2)) % 2 ? cc[0] : cc[1]);
  hline(x, wx - 1, wx + 32, wy + 16, P.wood1); for (let k = 0; k < 32; k += 4) pset(x, wx + k, wy + 29, P.ink);
  rect(x, wx - 4, wy + 31, 40, 3, P.ink); rect(x, wx - 3, wy + 31, 38, 2, P.cream1);
  plantPot(x, wx + 6, wy + 31, t, early ? 0 : 1);
  shape(x, [[wx + 24, wy + 23], [wx + 28, wy + 23], [wx + 28, wy + 31], [wx + 24, wy + 31]], early ? P.leaf1 : P.mist0, { shade: early ? P.leaf2 : P.slate4, shadeDir: [1, 0], shadeW: 1 }); pset(x, wx + 26, wy + 22, P.ink); // dish soap
  // ---- wall cabinets, utensil rail, spice shelf
  const cab = early ? [P.cream1, P.cream2, P.cream3] : [mixHex(P.cream1, P.slate4, 0.35), mixHex(P.cream2, P.slate4, 0.35), mixHex(P.cream3, P.slate3, 0.35)];
  shape(x, [[X(50), Y(4)], [X(84), Y(4)], [X(84), Y(30)], [X(50), Y(30)]], cab[0], { shade: cab[2], shadeDir: [0, 1], shadeW: 2 });
  vline(x, X(67), Y(5), Y(28), P.ink); for (const hx of [64, 70]) rect(x, X(hx), Y(20), 1, 5, P.slate2);
  hline(x, X(51), X(83), Y(5), mixHex(cab[0], P.white, 0.3));
  hline(x, X(50), X(84), Y(36), P.slate2);
  for (const [ux, len, kind] of [[54, 12, 'ladle'], [60, 10, 'spat'], [66, 9, 'whisk'], [72, 11, 'spoon']]) { vline(x, X(ux), Y(36), Y(36 + len), P.slate1); if (kind === 'ladle') { ellipse(x, X(ux), Y(37 + len), 2, 1, P.slate1); } else if (kind === 'spat') rect(x, X(ux - 1), Y(34 + len), 3, 4, P.wood1); else if (kind === 'whisk') { ellipse(x, X(ux), Y(34 + len), 2, 3, P.slate3); pset(x, X(ux), Y(34 + len), tile); } else rect(x, X(ux - 1), Y(35 + len), 3, 2, P.wood2); }
  rect(x, X(76), Y(42), 9, 2, P.wood1); for (let k = 0; k < 3; k++) { rect(x, X(77 + k * 3), Y(37), 2, 5, P.ink); pset(x, X(77 + k * 3), Y(38), [P.red0, P.honey1, P.leaf1][k]); }
  // ---- the counter
  const ct = early ? [P.cream0, P.cream2] : [mixHex(P.cream0, P.slate4, 0.3), mixHex(P.cream2, P.slate3, 0.3)];
  shape(x, [[X(2), Y(67)], [X(86), Y(67)], [X(86), Y(100)], [X(2), Y(100)]], wood, { shade: woodD, shadeDir: [0, 1], shadeW: 3 });
  for (let k = 0; k < 4; k++) { const dx = X(4 + k * 20.5); rect(x, dx, Y(74), 19, 21, P.ink); rect(x, dx + 1, Y(75), 17, 19, k % 2 ? wood : mixHex(wood, woodL, 0.3)); hline(x, dx + 1, dx + 17, Y(75), woodL); rect(x, dx + (k % 2 ? 2 : 14), Y(80), 1, 5, P.slate4); }
  hline(x, X(3), X(85), Y(71), P.ink); rect(x, X(3), Y(96), 83, 4, mixHex(woodD, P.ink, 0.4));
  shape(x, [[X(1), Y(58)], [X(87), Y(58)], [X(87), Y(68)], [X(1), Y(68)]], ct[0], { shade: ct[1], shadeDir: [0, 1], shadeW: 2 });
  // sink and tap
  const sk = KITCHEN.sink; rect(x, X(sk.x), Y(sk.y), 28, 6, P.ink); rect(x, X(sk.x + 1), Y(sk.y + 1), 26, 4, P.slate3); hline(x, X(sk.x + 1), X(sk.x + 26), Y(sk.y + 1), P.slate2); pset(x, X(sk.x + 14), Y(sk.y + 3), P.ink);
  line(x, X(sk.x + 14), Y(sk.y), X(sk.x + 14), Y(sk.y - 10), P.ink); line(x, X(sk.x + 14), Y(sk.y - 10), X(sk.x + 18), Y(sk.y - 10), P.ink); line(x, X(sk.x + 15), Y(sk.y), X(sk.x + 15), Y(sk.y - 9), P.slate5); pset(x, X(sk.x + 18), Y(sk.y - 9), P.ink);
  rect(x, X(sk.x + 10), Y(sk.y - 2), 3, 2, P.slate4);
  if (st.water) for (let k = 0; k < 9; k++) pset(x, X(sk.x + 18), Y(sk.y - 8 + k), mod(t * 18 + k, 3) < 2 ? P.glass2 : P.white);
  if (st.water) { for (let k = 0; k < 3; k++) pset(x, X(sk.x + 16 + k * 2 + ri(Math.sin(t * 9 + k))), Y(sk.y + 2), P.glass2); }
  // drying rack with plates and the cups (whatever is left in it)
  const rk = KITCHEN.rack;
  rect(x, X(rk.x), Y(rk.y - 1), 22, 2, P.slate4); rect(x, X(rk.x), Y(rk.y - 14), 1, 14, P.slate4); rect(x, X(rk.x + 21), Y(rk.y - 14), 1, 14, P.slate4); hline(x, X(rk.x), X(rk.x + 21), Y(rk.y - 14), P.slate4);
  for (let k = 0; k < 3; k++) { const px = X(rk.x + 2 + k * 3); rect(x, px, Y(rk.y - 12), 2, 11, P.ink); vline(x, px + 1, Y(rk.y - 11), Y(rk.y - 2), early ? P.cream0 : P.mist1); }
  for (let k = 0; k < 6; k++) vline(x, X(rk.x + 1 + k * 4), Y(rk.y - 6), Y(rk.y - 2), P.slate3);
  if (st.rack) st.rack.forEach((c, i) => { if (c) blit(x, c === 'his' ? 'cup2' : 'cup', X(rk.x + 11 + i * 6), Y(rk.y - 9)); });
  // kettle and cutting board
  shape(x, [[X(68), Y(48)], [X(77), Y(48)], [X(79), Y(58)], [X(66), Y(58)]], early ? P.brick1 : P.slate4, { shade: early ? P.brick2 : P.slate3, shadeDir: [1, 0], shadeW: 2, hi: early ? P.brick0 : P.mist0, hiDir: [-1, 0] });
  rect(x, X(70), Y(45), 5, 2, P.ink); line(x, X(66), Y(51), X(63), Y(48), P.ink); pset(x, X(72), Y(46), P.slate2);
  shape(x, [[X(80), Y(38)], [X(86), Y(37)], [X(87), Y(58)], [X(80), Y(58)]], woodL, { shade: wood, shadeDir: [1, 0], shadeW: 1 }); pset(x, X(83), Y(40), P.ink);
  // ---- the fridge
  const fr = KITCHEN.fridge, fc = early ? [P.cream0, P.cream2, P.cream3] : [P.mist2, P.mist0, P.slate4];
  shape(x, [[X(fr.x), Y(fr.y)], [X(fr.x + 20), Y(fr.y)], [X(fr.x + 20), Y(100)], [X(fr.x), Y(100)]], fc[0], { shade: fc[1], shadeDir: [1, 0], shadeW: 3, hi: P.white, hiDir: [-1, 0] });
  hline(x, X(fr.x + 1), X(fr.x + 19), Y(fr.y + 30), P.ink); hline(x, X(fr.x + 1), X(fr.x + 19), Y(fr.y + 31), fc[2]);
  rect(x, X(fr.x + 3), Y(fr.y + 18), 2, 9, P.slate2); rect(x, X(fr.x + 3), Y(fr.y + 34), 2, 12, P.slate2);
  rect(x, X(fr.x + 1), Y(97), 19, 3, P.ink);
  // magnets: the old note, a photo-booth strip, a takeaway menu, a little calendar
  const note = early ? P.honey0 : P.cream1;
  shape(x, [[X(fr.x + 7), Y(fr.y + 36)], [X(fr.x + 17), Y(fr.y + 35)], [X(fr.x + 18), Y(fr.y + 47)], [X(fr.x + 8), Y(fr.y + 48)]], note, { shade: mixHex(note, P.ink, 0.15), shadeDir: [0, 1], shadeW: 1 });
  rect(x, X(fr.x + 11), Y(fr.y + 34), 3, 3, P.red0); for (let k = 0; k < 4; k++) hline(x, X(fr.x + 9), X(fr.x + 15 - (k % 2) * 2), Y(fr.y + 39 + k * 2), P.slate3);
  rect(x, X(fr.x + 8), Y(fr.y + 6), 5, 14, P.ink); for (let k = 0; k < 3; k++) { rect(x, X(fr.x + 9), Y(fr.y + 7 + k * 4), 3, 3, early ? P.honey1 : P.slate4); pset(x, X(fr.x + 10), Y(fr.y + 8 + k * 4), P.ink); }
  block(x, X(fr.x + 13), Y(fr.y + 10), 6, 9, P.white); hline(x, X(fr.x + 14), X(fr.x + 17), Y(fr.y + 12), P.red1); hline(x, X(fr.x + 14), X(fr.x + 16), Y(fr.y + 14), P.slate3); hline(x, X(fr.x + 14), X(fr.x + 17), Y(fr.y + 16), P.slate3);
  block(x, X(fr.x + 9), Y(fr.y + 54), 9, 9, P.white); rect(x, X(fr.x + 10), Y(fr.y + 55), 7, 2, early ? P.brick1 : P.slate3);
  // a basket with bread on top of the fridge
  shape(x, [[X(fr.x + 2), Y(fr.y - 6)], [X(fr.x + 18), Y(fr.y - 6)], [X(fr.x + 17), Y(fr.y)], [X(fr.x + 3), Y(fr.y)]], P.honey2, { shade: P.honey3, shadeDir: [0, 1], shadeW: 1 }); for (let k = 0; k < 4; k++) pset(x, X(fr.x + 5 + k * 4), Y(fr.y - 3), P.honey3);
  ellipse(x, X(fr.x + 9), Y(fr.y - 7), 5, 2, P.ink); ellipse(x, X(fr.x + 9), Y(fr.y - 7), 4, 1, P.honey1);
  // ---- the hall: mirror over the shoe cabinet, key dish, door, hooks, umbrella stand
  const sc = { x: 108, y: 66 };
  shape(x, [[X(sc.x), Y(sc.y)], [X(sc.x + 22), Y(sc.y)], [X(sc.x + 22), Y(100)], [X(sc.x), Y(100)]], wood, { shade: woodD, shadeDir: [0, 1], shadeW: 2 });
  rect(x, X(sc.x + 1), Y(sc.y + 1), 20, 3, woodL); hline(x, X(sc.x), X(sc.x + 22), Y(sc.y + 4), P.ink);
  for (let k = 0; k < 2; k++) { rect(x, X(sc.x + 2 + k * 10), Y(sc.y + 7), 9, 24, P.ink); rect(x, X(sc.x + 3 + k * 10), Y(sc.y + 8), 7, 22, k ? wood : mixHex(wood, woodL, 0.3)); for (let s = 0; s < 5; s++) hline(x, X(sc.x + 3 + k * 10), X(sc.x + 9 + k * 10), Y(sc.y + 10 + s * 4), woodD); }
  const mr = { x: 110, y: 28 };
  shape(x, [[X(mr.x), Y(mr.y)], [X(mr.x + 18), Y(mr.y)], [X(mr.x + 18), Y(mr.y + 28)], [X(mr.x), Y(mr.y + 28)]], woodL, { shade: wood, shadeDir: [1, 1], shadeW: 1 });
  rect(x, X(mr.x + 2), Y(mr.y + 2), 14, 24, mixHex(P.glass, L.wall, 0.3));
  clip(x, { x: X(mr.x + 2), y: Y(mr.y + 2), w: 14, h: 24 }, () => { rect(x, X(mr.x + 2), Y(mr.y + 16), 14, 10, mixHex(P.glass, L.floor, 0.4)); if (st.mirror) st.mirror(X(mr.x + 2), Y(mr.y + 2)); x.save(); x.globalAlpha = 0.35; poly(x, [[X(mr.x + 5), Y(mr.y + 2)], [X(mr.x + 9), Y(mr.y + 2)], [X(mr.x + 4), Y(mr.y + 26)], [X(mr.x), Y(mr.y + 26)]], P.white); x.restore(); });
  const kd = KITCHEN.dish; ellipse(x, X(kd.x + 4), Y(kd.y - 1), 6, 2, P.ink); ellipse(x, X(kd.x + 4), Y(kd.y - 1), 5, 1, early ? P.brick0 : P.cream1); pset(x, X(kd.x + 1), Y(kd.y - 1), early ? P.brick1 : P.cream3);
  if (st.keyInDish) { rect(x, X(kd.x + 2), Y(kd.y - 2), 5, 1, P.honey2); pset(x, X(kd.x + 2), Y(kd.y - 3), P.honey1); pset(x, X(kd.x + 7), Y(kd.y - 2), P.honey3); }
  if (st.coins !== false) { pset(x, X(kd.x + 6), Y(kd.y - 1), P.slate5); pset(x, X(kd.x + 5), Y(kd.y), P.honey2); }
  plantPot(x, X(sc.x + 18), Y(sc.y), t, 2);
  const d = KITCHEN.door, open = st.door || 0;
  rect(x, X(d.x - 3), Y(d.y - 3), 36, 85, P.ink); rect(x, X(d.x - 2), Y(d.y - 2), 34, 84, mixHex(P.cream2, L.wall, 0.2)); vline(x, X(d.x + 31), Y(d.y - 2), Y(99), mixHex(P.cream3, L.wall, 0.2));
  const dc = early ? [P.brick1, P.brick2, P.brick0] : [P.wood2, P.wood1, P.wood3];
  if (open > 0) { // the corridor's light through the gap
    rect(x, X(d.x), Y(d.y), 30, 80, mixHex(P.mist1, L.wall, 0.2)); rect(x, X(d.x), Y(d.y + 62), 30, 18, mixHex(P.slate4, P.mist1, 0.4)); for (let k = 0; k < 30; k += 6) vline(x, X(d.x + k), Y(d.y + 62), Y(d.y + 79), P.slate3);
    rect(x, X(d.x + 18), Y(d.y + 6), 8, 54, mixHex(P.wood2, P.slate2, 0.4)); // the neighbour's door across
    const dw = Math.max(2, ri(30 * (1 - open)));
    shape(x, [[X(d.x), Y(d.y)], [X(d.x + dw), Y(d.y - 2)], [X(d.x + dw), Y(d.y + 82)], [X(d.x), Y(d.y + 80)]], dc[0], { shade: dc[1], shadeDir: [1, 0], shadeW: Math.min(3, dw) });
  } else {
    shape(x, [[X(d.x), Y(d.y)], [X(d.x + 30), Y(d.y)], [X(d.x + 30), Y(d.y + 80)], [X(d.x), Y(d.y + 80)]], dc[0], { shade: dc[1], shadeDir: [1, 0], shadeW: 2, hi: dc[2], hiDir: [-1, 0] });
    for (const [py, ph] of [[6, 30], [42, 34]]) { rect(x, X(d.x + 4), Y(d.y + py), 22, ph, dc[1]); rect(x, X(d.x + 5), Y(d.y + py + 1), 20, ph - 2, dc[0]); hline(x, X(d.x + 5), X(d.x + 24), Y(d.y + py + 1), dc[2]); }
    rect(x, X(d.x + 23), Y(d.y + 38), 5, 2, P.slate4); pset(x, X(d.x + 23), Y(d.y + 40), P.slate2); rect(x, X(d.x + 24), Y(d.y + 30), 2, 4, P.slate3); // lever and lock
    pset(x, X(d.x + 15), Y(d.y + 14), P.ink); pset(x, X(d.x + 15), Y(d.y + 13), P.slate4); // peephole
    for (let k = 0; k < 4; k++) pset(x, X(d.x + 26 - k), Y(d.y + 26 + k * 2), P.slate4); // the chain
  }
  block(x, X(d.x + 11), Y(d.y - 12), 8, 6, P.cream1); pset(x, X(d.x + 14), Y(d.y - 9), early ? P.honey1 : P.slate4); // little hall light
  // coat hooks: her bag, his coat (until it isn't), an umbrella
  const h = KITCHEN.hooks; rect(x, X(h.x - 1), Y(h.y), 14, 3, P.ink); rect(x, X(h.x), Y(h.y + 1), 12, 1, woodL);
  for (const k of [1, 6, 11]) { rect(x, X(h.x + k), Y(h.y + 3), 1, 3, P.slate3); }
  const sw = st.hookSwing ? ri(Math.sin(t * 9) * st.hookSwing * 2) : 0; pset(x, X(h.x + 6 + sw), Y(h.y + 6), P.slate3);
  if (st.bag !== false) { shape(x, [[X(h.x - 1), Y(h.y + 14)], [X(h.x + 7), Y(h.y + 14)], [X(h.x + 8), Y(h.y + 28)], [X(h.x - 2), Y(h.y + 28)]], early ? P.cream1 : P.cream2, { shade: P.cream3, shadeDir: [1, 1], shadeW: 1 }); line(x, X(h.x), Y(h.y + 14), X(h.x + 1), Y(h.y + 5), P.wood1); line(x, X(h.x + 6), Y(h.y + 14), X(h.x + 1), Y(h.y + 5), P.wood1); }
  if (st.coat) { shape(x, [[X(h.x + 3), Y(h.y + 5)], [X(h.x + 10), Y(h.y + 5)], [X(h.x + 14), Y(h.y + 40)], [X(h.x + 1), Y(h.y + 40)]], P.olive1, { shade: P.olive2, shadeDir: [1, 0], shadeW: 3, hi: P.olive0, hiDir: [-1, 0] }); line(x, X(h.x + 7), Y(h.y + 8), X(h.x + 7), Y(h.y + 38), P.olive3); rect(x, X(h.x + 4), Y(h.y + 5), 6, 3, P.olive2); pset(x, X(h.x + 9), Y(h.y + 18), P.honey2); pset(x, X(h.x + 9), Y(h.y + 26), P.honey2); }
  shape(x, [[X(h.x + 9), Y(h.y + 6)], [X(h.x + 12), Y(h.y + 6)], [X(h.x + 13), Y(h.y + 34)], [X(h.x + 9), Y(h.y + 34)]], early ? P.red0 : P.slate1, { shade: early ? P.red1 : P.slate0, shadeDir: [1, 0], shadeW: 1 }); // folded umbrella
  rect(x, X(166), Y(84), 10, 16, P.ink); rect(x, X(167), Y(85), 8, 14, P.slate3); hline(x, X(167), X(174), Y(88), P.slate4); line(x, X(169), Y(84), X(168), Y(74), P.wood1); line(x, X(173), Y(84), X(175), Y(76), P.ink);
  block(x, X(166), Y(46), 8, 12, P.cream1); rect(x, X(168), Y(48), 4, 3, P.slate2); pset(x, X(170), Y(54), P.leaf1); // intercom
  block(x, X(166), Y(6), 12, 14, P.cream2); hline(x, X(168), X(175), Y(10), P.slate3); hline(x, X(168), X(173), Y(13), P.slate3); // breaker box
  // ---- floors: kitchen tiles, hall wood
  for (let y = 101; y < 250; y += 9) for (let k = 0; k < 106; k += 9) { const odd = ((k + y) / 9) % 2 < 1; rect(x, X(k), Y(y), 9, 9, odd ? mixHex(P.cream1, L.floor, 0.35) : mixHex(P.slate4, L.floor, 0.35)); }
  for (let y = 101; y < 250; y += 9) hline(x, ox, X(105), Y(y), mixHex(P.slate3, L.floor, 0.4));
  for (let k = 0; k < 106; k += 9) vline(x, X(k), Y(101), Y(249), mixHex(P.slate3, L.floor, 0.4));
  woodPlanks(x, { x: X(106), y: Y(101), w: 74, h: 149 }, L.floor, L.floor2, L.seam, mixHex(L.floor, P.white, 0.12), 9, false);
  rect(x, X(105), Y(101), 2, 149, P.ink);
  // a runner in front of the sink, the mat at the door, slippers and shoes
  shape(x, [[X(8), Y(104)], [X(48), Y(104)], [X(48), Y(116)], [X(8), Y(116)]], early ? P.leaf1 : mixHex(P.leaf2, P.slate3, 0.5), { shade: early ? P.leaf2 : P.slate2, shadeDir: [0, 1], shadeW: 2 }); for (let k = 10; k < 47; k += 3) { pset(x, X(k), Y(103), P.cream2); pset(x, X(k + 1), Y(117), P.cream2); }
  const m = KITCHEN.mat, mk = st.matSkew || 0;
  shape(x, [[X(m.x) + mk, Y(m.y)], [X(m.x + 32) + mk, Y(m.y) - ri(mk / 2)], [X(m.x + 33), Y(m.y + 10)], [X(m.x - 1), Y(m.y + 10)]], mixHex(P.brick2, P.slate2, early ? 0.1 : 0.4), { shade: mixHex(P.brick3, P.slate1, 0.4), shadeDir: [0, 1], shadeW: 2 });
  for (let k = 3; k < 30; k += 4) pset(x, X(m.x + k) + ri(mk / 2), Y(m.y + 5), mixHex(P.brick1, P.slate3, 0.4));
  if (st.hisShoes !== false) for (const k of [0, 6]) { shape(x, [[X(112 + k), Y(104)], [X(116 + k), Y(104)], [X(117 + k), Y(113)], [X(112 + k), Y(113)]], P.wood1, { shade: P.wood0, shadeDir: [0, 1], shadeW: 2, hi: P.wood2, hiDir: [0, -1] }); }
  for (const k of [0, 6]) { shape(x, [[X(124 + k), Y(116)], [X(128 + k), Y(116)], [X(128 + k), Y(124)], [X(124 + k), Y(124)]], P.cream2, { shade: P.cream3, shadeDir: [0, 1], shadeW: 2 }); pset(x, X(125 + k), Y(118), early ? P.red0 : P.slate2); }
  if (st.slippers !== false) for (const k of [0, 7]) { shape(x, [[X(146 + k), Y(118)], [X(151 + k), Y(118)], [X(151 + k), Y(127)], [X(146 + k), Y(127)]], early ? P.brick0 : P.slate4, { shade: early ? P.brick1 : P.slate3, shadeDir: [0, 1], shadeW: 2 }); hline(x, X(147 + k), X(150 + k), Y(120), early ? P.cream1 : P.mist1); }
  // the hall runner
  const ru = { x: 116, y: 132, w: 50, h: 78 };
  shape(x, [[X(ru.x), Y(ru.y)], [X(ru.x + ru.w), Y(ru.y)], [X(ru.x + ru.w), Y(ru.y + ru.h)], [X(ru.x), Y(ru.y + ru.h)]], mixHex(P.brick1, L.floor, early ? 0.2 : 0.5), { shade: mixHex(P.brick2, L.floor, 0.5), shadeDir: [0, 1], shadeW: 2 });
  rect(x, X(ru.x + 4), Y(ru.y + 4), ru.w - 8, ru.h - 8, mixHex(P.brick2, L.floor, early ? 0.25 : 0.5));
  for (let j = 0; j < ru.h - 16; j += 8) for (let k = 0; k < ru.w - 16; k += 8) { const cx = X(ru.x + 10 + k + (j % 16 ? 4 : 0)), cy = Y(ru.y + 10 + j); pset(x, cx, cy, mixHex(P.honey1, L.floor, 0.4)); pset(x, cx - 1, cy + 1, mixHex(P.cream2, L.floor, 0.4)); pset(x, cx + 1, cy + 1, mixHex(P.cream2, L.floor, 0.4)); pset(x, cx, cy + 2, mixHex(P.honey1, L.floor, 0.4)); }
  // in the hall: a shoe-changing bench with a folded scarf, a stack of delivery boxes, a mop and bucket in the kitchen corner
  { const bx = 148, by = 216; contactShadow(x, X(bx + 13), Y(by + 14), 15, 2, 0.3); for (const lx of [1, 23]) rect(x, X(bx + lx), Y(by + 4), 2, 10, P.ink); shape(x, [[X(bx - 1), Y(by)], [X(bx + 27), Y(by)], [X(bx + 27), Y(by + 6)], [X(bx - 1), Y(by + 6)]], woodL, { shade: wood, shadeDir: [0, 1], shadeW: 2, hi: mixHex(woodL, P.white, 0.25), hiDir: [0, -1] });
    shape(x, [[X(bx + 4), Y(by - 3)], [X(bx + 16), Y(by - 4)], [X(bx + 17), Y(by + 1)], [X(bx + 4), Y(by + 1)]], early ? P.red0 : P.blue1, { shade: early ? P.red1 : P.blue2, shadeDir: [0, 1], shadeW: 1 }); }
  for (let k = 0; k < 3; k++) { const w2 = 22 - k * 4; shape(x, [[X(116 + k * 2), Y(238 - k * 9)], [X(116 + k * 2 + w2), Y(238 - k * 9)], [X(116 + k * 2 + w2), Y(246 - k * 9)], [X(116 + k * 2), Y(246 - k * 9)]], P.honey2, { shade: P.honey3, shadeDir: [0, 1], shadeW: 2, hi: P.honey1, hiDir: [0, -1] }); hline(x, X(117 + k * 2), X(115 + k * 2 + w2), Y(242 - k * 9), P.honey3); }
  contactShadow(x, X(128), Y(247), 14, 2, 0.3);
  // ---- the little kitchen table with oilcloth, two stools, a thermos, a fruit bowl; a bin by the counter
  shape(x, [[X(78), Y(108)], [X(92), Y(108)], [X(91), Y(132)], [X(79), Y(132)]], early ? P.leaf1 : P.slate3, { shade: early ? P.leaf2 : P.slate2, shadeDir: [1, 0], shadeW: 3, hi: early ? P.leaf0 : P.slate4, hiDir: [-1, 0] }); rect(x, X(77), Y(106), 16, 3, P.ink); rect(x, X(78), Y(107), 14, 1, early ? P.leaf0 : P.slate4); contactShadow(x, X(85), Y(133), 8, 1, 0.35);
  const kt = { x: 14, y: 136, w: 54, d: 22, h: 16 };
  contactShadow(x, X(kt.x + kt.w / 2), Y(kt.y + kt.d + kt.h + 2), kt.w / 2 + 3, 3, 0.3);
  tableSquare(x, X(kt.x), Y(kt.y), kt.w, kt.d, kt.h, P.cream1, P.wood1, P.white);
  for (let y = 1; y < kt.d - 1; y++) for (let k = 1; k < kt.w - 1; k++) if (((k >> 2) + (y >> 2)) % 2) pset(x, X(kt.x + k), Y(kt.y + y), early ? P.brick0 : mixHex(P.slate4, P.cream1, 0.4));
  for (let k = 1; k < kt.w - 1; k++) if ((k >> 2) % 2) pset(x, X(kt.x + k), Y(kt.y + kt.d), early ? P.brick1 : P.slate3); // the oilcloth hangs over the front
  ellipse(x, X(kt.x + 14), Y(kt.y + 10), 8, 4, P.ink); ellipse(x, X(kt.x + 14), Y(kt.y + 9), 7, 3, P.cream0); for (const [fx, fy, c] of [[-3, -1, P.red0], [1, -2, P.honey1], [3, 0, P.leaf1], [-1, 1, P.red1]]) { disc(x, X(kt.x + 14 + fx), Y(kt.y + 8 + fy), 1, c); }
  shape(x, [[X(kt.x + 34), Y(kt.y - 4)], [X(kt.x + 39), Y(kt.y - 4)], [X(kt.x + 39), Y(kt.y + 10)], [X(kt.x + 34), Y(kt.y + 10)]], early ? P.red0 : P.slate2, { shade: early ? P.red1 : P.slate1, shadeDir: [1, 0], shadeW: 2, hi: early ? P.brick0 : P.slate4, hiDir: [-1, 0] }); rect(x, X(kt.x + 34), Y(kt.y - 6), 6, 2, P.ink);
  rect(x, X(kt.x + 42), Y(kt.y + 8), 9, 7, P.ink); rect(x, X(kt.x + 43), Y(kt.y + 9), 7, 5, P.cream0); hline(x, X(kt.x + 44), X(kt.x + 48), Y(kt.y + 11), P.slate3);
  for (const sx of [kt.x - 6, kt.x + kt.w + 6]) { const sy = kt.y + 32; contactShadow(x, X(sx), Y(sy + 12), 7, 1, 0.3); for (const lx of [-5, 3]) rect(x, X(sx + lx), Y(sy + 2), 2, 10, P.ink); ellipse(x, X(sx), Y(sy), 7, 3, P.ink); ellipse(x, X(sx), Y(sy), 6, 2, woodL); hline(x, X(sx - 4), X(sx + 4), Y(sy + 7), P.ink); }
  // a step-stool and a bag of rice by the fridge, a crate of onions
  block(x, X(80), Y(140), 18, 14, early ? P.cream1 : P.cream2); text(x, '米', X(89), Y(141), P.red1, FONT.tiny, { align: 'center' }); contactShadow(x, X(89), Y(155), 10, 1, 0.3);
  shape(x, [[X(78), Y(176)], [X(100), Y(176)], [X(100), Y(190)], [X(78), Y(190)]], P.wood3, { shade: P.wood2, shadeDir: [0, 1], shadeW: 2 }); for (let k = 0; k < 5; k++) disc(x, X(82 + k * 4), Y(175), 2, k % 2 ? P.honey2 : P.brick0); contactShadow(x, X(89), Y(191), 12, 1, 0.3);
  // ---- people
  if (st.people) for (const p of st.people) { if (!p.sit) shadowAt(x, X(p.x), Y(p.y)); drawPerson(x, p.who, X(p.x), Y(p.y), { ...p, t }); }
  if (st.after) st.after(X, Y);
  // ---- the dividing wall's top and the living-room floor in shadow (nearest to us)
  const nw = 250;
  rect(x, ox, Y(nw), 26, 14, P.ink); rect(x, X(1), Y(nw + 1), 24, 3, mixHex(L.wall, P.ink, 0.15)); rect(x, X(1), Y(nw + 4), 24, 9, mixHex(L.wall, P.ink, 0.45));
  rect(x, X(158), Y(nw), 22, 14, P.ink); rect(x, X(159), Y(nw + 1), 21, 3, mixHex(L.wall, P.ink, 0.15)); rect(x, X(159), Y(nw + 4), 21, 9, mixHex(L.wall, P.ink, 0.45));
  rect(x, X(26), Y(nw + 6), 132, 4, mixHex(P.wood2, P.ink, 0.2)); hline(x, X(26), X(157), Y(nw + 6), P.wood3); // the threshold
  woodPlanks(x, { x: ox, y: Y(nw + 14), w: SET_W, h: R.h - nw - 14 }, L.floor, L.floor2, L.seam, mixHex(L.floor, P.white, 0.1), 5, false);
  // near the threshold on the living-room side: a laundry basket, a recycling bag, a tall plant
  shape(x, [[X(8), Y(272)], [X(40), Y(272)], [X(38), Y(296)], [X(10), Y(296)]], P.cream3, { shade: P.wood2, shadeDir: [1, 0], shadeW: 3 }); for (let k = 0; k < 7; k++) vline(x, X(12 + k * 4), Y(274), Y(294), P.wood3); shape(x, [[X(10), Y(266)], [X(30), Y(262)], [X(40), Y(272)], [X(8), Y(274)]], early ? P.cream0 : P.blue0, { shade: early ? P.cream2 : P.blue1, shadeDir: [0, 1], shadeW: 2 });
  shape(x, [[X(52), Y(276)], [X(66), Y(272)], [X(70), Y(296)], [X(50), Y(296)]], P.glass2, { shade: P.glass, shadeDir: [1, 0], shadeW: 3 }); for (let k = 0; k < 3; k++) { rect(x, X(55 + k * 4), Y(278), 2, 6, [P.leaf2, P.honey3, P.leaf2][k]); }
  const pl = { x: 162, y: 298 }; for (const [a, l, c] of [[-2.4, 22, 0], [-2.0, 30, 1], [-1.7, 36, 0], [-1.35, 30, 1], [-1.05, 22, 0], [-2.8, 14, 1]]) leafShape(x, X(pl.x), Y(pl.y - 16), l, a + Math.sin(t * 0.6 + a * 3) * 0.015, c ? (early ? P.leaf1 : P.leaf2) : (early ? P.leaf2 : P.leaf3), c ? (early ? P.leaf0 : P.leaf1) : (early ? P.leaf1 : P.leaf2));
  shape(x, [[X(pl.x - 10), Y(pl.y - 18)], [X(pl.x + 10), Y(pl.y - 18)], [X(pl.x + 8), Y(pl.y)], [X(pl.x - 8), Y(pl.y)]], P.slate3, { shade: P.slate2, shadeDir: [1, 0], shadeW: 4, hi: P.slate4, hiDir: [-1, 0] });
  for (const [cx, rw] of [[24, 16], [60, 12], [162, 12]]) contactShadow(x, X(cx), Y(297), rw, 2, 0.3);
  // ---- light and grade
  x.save(); x.globalAlpha = 0.18; rect(x, ox, Y(nw + 14), SET_W, R.h - nw - 14, P.ink); x.restore();
  if (L.sun > 0) lightSteps(x, [[wx, Y(101)], [wx + 32, Y(101)], [wx + 52, Y(170)], [wx + 18, Y(170)]], P.honey0, [[[0, 0], 0.1 * L.sun], [[4, 4], 0.08 * L.sun]]);
  else lightSteps(x, [[wx, Y(101)], [wx + 32, Y(101)], [wx + 48, Y(160)], [wx + 16, Y(160)]], P.mist2, [[[0, 0], 0.06]]);
  if (open > 0) lightSteps(x, [[X(d.x), Y(101)], [X(d.x + 30), Y(101)], [X(d.x + 44), Y(180)], [X(d.x - 4), Y(180)]], P.mist2, [[[0, 0], 0.1 * open]]);
  shade(x, ox, oy, SET_W, R.h, L.tint, L.tintA);
  if (st.flash) shade(x, ox, oy, SET_W, R.h, P.white, st.flash);
}
