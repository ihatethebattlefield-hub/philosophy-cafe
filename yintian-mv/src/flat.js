'use strict';
/* The corridor outside the flat, and the main room seen the other way (from the window). */

// ------------------------------------------------------------- the corridor outside the flat
// Back wall: their door (502), the neighbour's door with a shoe rack, the meter box, a notice
// board, the strip light, the exit sign, the window at the end. Floor: worn tiles. Nearer: the
// stairwell's railing, and the stairs going down to the next landing.
function corridorSet(x, R, st, t) {
  const ox = R.x, oy = R.y, X = v => ox + v, Y = v => oy + v, L = LOOKS[st.period || 'late'];
  const wall = mixHex(P.mist0, L.wall, 0.5), wall2 = mixHex(P.mist1, L.wall, 0.4), dado = mixHex(P.leaf2, P.slate3, 0.6);
  plaster(x, { x: ox, y: oy, w: SET_W, h: 112 }, wall, mixHex(wall, P.ink, 0.06), wall2, 31);
  rect(x, ox, Y(70), SET_W, 42, dado); hline(x, ox, X(179), Y(70), mixHex(dado, P.white, 0.25)); for (let k = 0; k < 40; k++) pset(x, X(hash(k * 3) * 180), Y(72 + hash(k * 9) * 38), mixHex(dado, P.ink, 0.15)); // painted dado, scuffed
  rect(x, ox, oy, SET_W, 3, mixHex(wall, P.ink, 0.35)); rect(x, ox, Y(108), SET_W, 4, P.slate3); hline(x, ox, X(179), Y(112), P.ink);
  // the strip light, the exit sign
  rect(x, X(56), Y(6), 30, 4, P.ink); rect(x, X(57), Y(7), 28, 2, st.light ? P.white : P.mist1);
  block(x, X(150), Y(4), 16, 7, P.leaf2); rect(x, X(153), Y(6), 3, 3, P.white); rect(x, X(158), Y(7), 5, 1, P.white);
  // their door: 502, a fu character, a little bag of deliveries hanging on the handle
  const door = (dx, num, col, colD) => { rect(x, X(dx - 3), Y(22), 38, 90, P.ink); rect(x, X(dx - 2), Y(23), 36, 89, P.slate4); shape(x, [[X(dx), Y(25)], [X(dx + 32), Y(25)], [X(dx + 32), Y(112)], [X(dx), Y(112)]], col, { shade: colD, shadeDir: [1, 0], shadeW: 2, hi: mixHex(col, P.white, 0.2), hiDir: [-1, 0] }); for (const [py, ph] of [[31, 32], [70, 36]]) { rect(x, X(dx + 4), Y(py), 24, ph, colD); rect(x, X(dx + 5), Y(py + 1), 22, ph - 2, col); } rect(x, X(dx + 25), Y(66), 5, 2, P.slate5); pset(x, X(dx + 16), Y(40), P.ink); block(x, X(dx + 8), Y(10), 17, 11, P.cream1); text(x, num, X(dx + 16), Y(12), P.slate1, FONT.tiny, { align: 'center' }); };
  door(20, '502', P.wood2, P.wood1); door(108, '503', P.brick2, P.brick3);
  shape(x, [[X(29), Y(38)], [X(36), Y(33)], [X(43), Y(38)], [X(36), Y(45)]], P.red0, { shade: P.red1, shadeDir: [1, 1], shadeW: 1 }); text(x, '福', X(36), Y(34), P.honey0, FONT.tiny, { align: 'center' });
  block(x, X(47), Y(18), 2, 2, P.slate3); // a doorbell
  // meter box, notice board with flyers
  block(x, X(64), Y(28), 26, 34, P.slate4, P.mist0); for (let k = 0; k < 3; k++) { rect(x, X(67 + k * 8), Y(34), 6, 8, P.ink); rect(x, X(68 + k * 8), Y(35), 4, 3, P.mist2); } hline(x, X(66), X(87), Y(48), P.slate3); text(x, '电', X(77), Y(50), P.slate2, FONT.tiny, { align: 'center' });
  shape(x, [[X(92), Y(30)], [X(104), Y(30)], [X(104), Y(64)], [X(92), Y(64)]], P.wood3, { shade: P.wood2, shadeDir: [1, 1], shadeW: 1 });
  for (const [fx, fy, w, h, c] of [[93, 32, 6, 8, P.white], [99, 33, 4, 9, P.honey0], [94, 42, 9, 6, P.cream1], [93, 50, 5, 10, P.brick0], [98, 51, 5, 8, P.white]]) { rect(x, X(fx), Y(fy), w, h, c); pset(x, X(fx + 1), Y(fy), P.red0); hline(x, X(fx + 1), X(fx + w - 2), Y(fy + 3), P.slate3); }
  // the neighbour's shoe rack, an umbrella, a stroller folded
  const sr = { x: 144, y: 88 }; rect(x, X(sr.x), Y(sr.y), 2, 24, P.ink); rect(x, X(sr.x + 22), Y(sr.y), 2, 24, P.ink); for (const sy of [0, 11, 22]) rect(x, X(sr.x), Y(sr.y + sy), 24, 2, P.slate2);
  for (const [k, sy, c] of [[0, 0, P.red0], [8, 0, P.dark0], [15, 0, P.cream2], [2, 11, P.blue1], [12, 11, P.wood1], [4, 22, P.leaf2]]) rect(x, X(sr.x + 2 + k), Y(sr.y + sy - 3), 6, 3, c);
  // the window at the end, the radiator pipe
  rect(x, X(150), Y(18), 28, 46, P.ink); clip(x, { x: X(151), y: Y(19), w: 26, h: 44 }, () => { cloudsSky(x, X(151), Y(19), 26, 44, L, t); rect(x, X(151), Y(40), 12, 23, mixHex(L.sky[3], P.slate2, 0.5)); rect(x, X(165), Y(34), 12, 29, mixHex(L.sky[3], P.slate2, 0.6)); }); vline(x, X(164), Y(19), Y(62), P.ink); hline(x, X(151), X(176), Y(40), P.ink);
  vline(x, X(6), Y(3), Y(108), P.slate2); vline(x, X(7), Y(3), Y(108), P.slate4);
  // ---- floor: worn square tiles
  rect(x, ox, Y(113), SET_W, 66, mixHex(P.slate4, L.floor, 0.25));
  for (let y = 113; y < 179; y += 9) for (let k = ((y - 113) / 9 % 2) * 9; k < SET_W; k += 18) rect(x, X(k), Y(y), 9, 9, mixHex(P.slate3, L.floor, 0.25));
  for (let y = 113; y < 179; y += 9) hline(x, ox, X(179), Y(y), mixHex(P.slate2, L.floor, 0.3));
  for (let k = 0; k < 30; k++) pset(x, X(hash(k * 5) * 180), Y(114 + hash(k * 3) * 64), mixHex(P.slate5, L.floor, 0.25));
  shape(x, [[X(18), Y(114)], [X(56), Y(114)], [X(58), Y(124)], [X(16), Y(124)]], mixHex(P.brick2, P.slate2, 0.4), { shade: mixHex(P.brick3, P.slate1, 0.4), shadeDir: [0, 1], shadeW: 2 }); text(x, '出入平安', X(37), Y(115), mixHex(P.honey1, P.slate2, 0.3), FONT.tiny, { align: 'center' }); // their doormat
  shape(x, [[X(86), Y(122)], [X(98), Y(122)], [X(98), Y(132)], [X(86), Y(132)]], P.honey2, { shade: P.honey3, shadeDir: [0, 1], shadeW: 2 }); hline(x, X(86), X(97), Y(126), P.cream1); // a parcel left out
  plantPot(x, X(140), Y(116), t, 1); contactShadow(x, X(140), Y(117), 5, 1, 0.3);
  // bicycle leaning on the wall
  { const bx = X(66), by = Y(126); disc(x, bx, by, 6, P.ink); disc(x, bx, by, 5, mixHex(P.slate4, L.floor, 0.25)); disc(x, bx + 22, by, 6, P.ink); disc(x, bx + 22, by, 5, mixHex(P.slate4, L.floor, 0.25)); pset(x, bx, by, P.slate2); pset(x, bx + 22, by, P.slate2); line(x, bx, by, bx + 10, by - 9, P.blue2); line(x, bx + 10, by - 9, bx + 22, by, P.blue2); line(x, bx + 5, by - 9, bx + 17, by - 9, P.blue2); line(x, bx + 20, by - 13, bx + 22, by, P.ink); rect(x, bx + 3, by - 11, 6, 2, P.ink); rect(x, bx + 18, by - 14, 6, 1, P.ink); }
  // ---- people
  if (st.people) for (const p of st.people) { shadowAt(x, X(p.x), Y(p.y)); drawPerson(x, p.who, X(p.x), Y(p.y), { ...p, t }); }
  if (st.after) st.after(X, Y);
  // ---- the stairwell: railing, then the stairs going down to the next landing
  rect(x, ox, Y(179), SET_W, 6, P.ink); rect(x, ox, Y(180), SET_W, 3, P.wood2); hline(x, ox, X(179), Y(180), P.wood3);
  for (let k = 3; k < SET_W; k += 8) { rect(x, X(k), Y(185), 2, 26, P.ink); pset(x, X(k + 1), Y(186), P.slate3); }
  for (let s = 0; s < 12; s++) { const sy = Y(186 + s * 9), c = mixHex(P.slate4, P.ink, 0.12 + s * 0.035); rect(x, ox, sy, SET_W, 9, c); hline(x, ox, X(179), sy, mixHex(P.slate5, P.ink, 0.1 + s * 0.035)); hline(x, ox, X(179), sy + 8, mixHex(P.slate2, P.ink, 0.2 + s * 0.035)); rect(x, X(4), sy + 1, 8, 7, mixHex(P.slate2, P.ink, 0.2 + s * 0.03)); } // anti-slip strips at the edge
  rect(x, ox, Y(211), SET_W, 3, P.ink); // the lower rail
  rect(x, X(120), Y(260), 40, 30, mixHex(P.mist1, P.ink, 0.35)); clip(x, { x: X(121), y: Y(261), w: 38, h: 28 }, () => rect(x, X(121), Y(276), 38, 13, mixHex(L.sky[2], P.ink, 0.4))); vline(x, X(140), Y(261), Y(289), P.ink); // the landing window below
  // ---- light
  if (st.light) { glow(x, X(70), Y(14), 40, 8, P.white, 0.3); glow(x, X(70), Y(140), 70, 20, P.cream0, 0.18); }
  shade(x, ox, oy, SET_W, R.h, L.tint, L.tintA * 1.2);
  x.save(); x.globalAlpha = 0.25; rect(x, ox, Y(214), SET_W, R.h - 214, P.ink); x.restore();
}

// ------------------------------------------------------------- the main room, reversed
// From the window, across the table into the flat: his chair's back in front of us, her across the
// table; behind her the sofa (facing us), the pale frame mark above it, a coat stand, the doorway
// into the kitchen where she can be seen at the tap; the window sill at the bottom edge.
function roomReverse(x, R, st, t) {
  const per = st.period || 'now', L = LOOKS[per], early = per === 'early', ox = R.x, oy = R.y, X = v => ox + v, Y = v => oy + v;
  const wood = early ? P.wood3 : P.wood2, woodD = early ? P.wood2 : P.wood1, woodL = early ? P.wood4 : P.wood3;
  plaster(x, { x: ox, y: oy, w: SET_W, h: 112 }, L.wall, L.wall2, mixHex(L.wall, P.white, 0.1), 5);
  rect(x, ox, oy, SET_W, 3, mixHex(L.wall, P.ink, 0.25)); rect(x, ox, Y(106), SET_W, 6, L.trim); hline(x, ox, X(179), Y(106), mixHex(L.trim, P.white, 0.2)); hline(x, ox, X(179), Y(112), P.ink);
  woodPlanks(x, { x: ox, y: Y(113), w: SET_W, h: R.h - 113 }, L.floor, L.floor2, L.seam, mixHex(L.floor, P.white, 0.12), 6, false);
  // doorway into the kitchen (right)
  rect(x, X(128), Y(26), 42, 86, P.ink); rect(x, X(126), Y(24), 46, 3, mixHex(P.cream1, L.wall, 0.3));
  rect(x, X(130), Y(28), 38, 84, mixHex(P.mist1, L.wall, 0.3)); for (let y = 34; y < 84; y += 6) hline(x, X(130), X(167), Y(y), mixHex(P.mist0, L.wall, 0.45)); for (let y = 34, r = 0; y < 84; y += 6, r++) for (let k = 130 + (r % 2) * 5; k < 168; k += 10) vline(x, X(k), Y(y), Y(y + 5), mixHex(P.mist0, L.wall, 0.45));
  shape(x, [[X(130), Y(70)], [X(168), Y(70)], [X(168), Y(112)], [X(130), Y(112)]], wood, { shade: woodD, shadeDir: [0, 1], shadeW: 2, outline: false }); rect(x, X(130), Y(68), 38, 3, mixHex(P.cream0, P.slate4, 0.3)); for (let k = 0; k < 2; k++) { rect(x, X(132 + k * 18), Y(76), 16, 30, woodD); rect(x, X(133 + k * 18), Y(77), 14, 28, wood); }
  block(x, X(156), Y(32), 12, 80, early ? P.cream0 : P.mist2); rect(x, X(158), Y(50), 2, 10, P.slate2); block(x, X(158), Y(66), 7, 8, early ? P.honey0 : P.cream1); pset(x, X(161), Y(66), P.red0); // fridge and its note
  rect(x, X(138), Y(56), 2, 12, P.ink); rect(x, X(136), Y(56), 7, 2, P.ink); // the tap
  if (st.kitchenPerson) { const p = st.kitchenPerson; drawPerson(x, 'W', X(p.x), Y(p.y), { ...p, t }); if (p.steam) for (let k = 0; k < 3; k++) { const ph = mod(t * 0.5 + k / 3, 1); pset(x, X(p.x + 9) + ri(Math.sin(t * 2 + k)), Y(p.y - 30) - ri(ph * 12), P.white); } }
  shade(x, X(130), Y(28), 38, 84, P.slate1, 0.2);
  // coat stand by the door: her cardigan, a scarf, a tote
  rect(x, X(117), Y(30), 2, 82, P.ink); for (const [dx, dy] of [[-4, 30], [4, 32], [-3, 36]]) line(x, X(118), Y(dy), X(118 + dx), Y(dy - 3), P.ink);
  shape(x, [[X(111), Y(30)], [X(119), Y(30)], [X(121), Y(64)], [X(109), Y(64)]], early ? P.honey1 : P.beige1, { shade: early ? P.honey2 : P.beige2, shadeDir: [1, 0], shadeW: 2, hi: early ? P.honey0 : P.beige0, hiDir: [-1, 0] });
  shape(x, [[X(118), Y(32)], [X(123), Y(32)], [X(124), Y(56)], [X(120), Y(56)]], early ? P.red0 : P.slate3, { shade: early ? P.red1 : P.slate2, shadeDir: [1, 0], shadeW: 1 });
  ellipse(x, X(118), Y(112), 6, 2, P.ink);
  // pale mark where the frame was (now) or the frame (before); a wall clock; a switch
  if (per === 'now') { rect(x, X(36), Y(18), 22, 26, mixHex(L.wall, P.white, 0.2)); pset(x, X(47), Y(15), P.slate1); }
  else { shape(x, [[X(36), Y(18)], [X(58), Y(18)], [X(58), Y(44)], [X(36), Y(44)]], P.wood1, { shade: P.wood0, shadeDir: [1, 1], shadeW: 1 }); rect(x, X(38), Y(20), 18, 22, P.cream0); disc(x, X(44), Y(30), 3, P.skin1); disc(x, X(51), Y(30), 3, P.skin1); rect(x, X(41), Y(34), 6, 6, P.olive1); rect(x, X(49), Y(34), 5, 6, P.blue1); rect(x, X(43), Y(26), 3, 2, P.hairM0); rect(x, X(49), Y(26), 4, 3, P.hairW0); }
  ellipse(x, X(92), Y(22), 7, 7, P.ink); ellipse(x, X(92), Y(22), 6, 6, P.cream0); line(x, X(92), Y(22), X(92), Y(17), P.ink); line(x, X(92), Y(22), X(95), Y(24), P.ink); for (let k = 0; k < 12; k++) pset(x, X(92 + ri(Math.cos(k * TAU / 12) * 5)), Y(22 + ri(Math.sin(k * TAU / 12) * 5)), P.slate3);
  block(x, X(104), Y(54), 5, 7, P.mist2);
  // the sofa, facing us, with its cushions and the throw; a side table with the lamp
  const sc = early ? [P.brick1, P.brick2, P.brick3, P.brick0] : per === 'late' ? [P.slate3, P.slate2, P.slate1, P.slate4] : [P.slate2, P.slate1, P.slate0, P.slate3];
  shape(x, [[X(10), Y(70)], [X(84), Y(70)], [X(84), Y(96)], [X(10), Y(96)]], sc[1], { shade: sc[2], shadeDir: [0, 1], shadeW: 3, hi: sc[3], hiDir: [0, -1] });
  for (const cx of [14, 48]) shape(x, [[X(cx), Y(88)], [X(cx + 32), Y(88)], [X(cx + 32), Y(104)], [X(cx), Y(104)]], sc[0], { shade: sc[2], shadeDir: [0, 1], shadeW: 4, hi: sc[3], hiDir: [0, -1] });
  for (const ax of [4, 80]) shape(x, [[X(ax), Y(78)], [X(ax + 10), Y(78)], [X(ax + 10), Y(108)], [X(ax), Y(108)]], sc[1], { shade: sc[2], shadeDir: [0, 1], shadeW: 3, hi: sc[0], hiDir: [0, -1] });
  shape(x, [[X(16), Y(76)], [X(30), Y(74)], [X(32), Y(88)], [X(18), Y(90)]], early ? P.honey1 : P.mist0, { shade: early ? P.honey2 : P.slate4, shadeDir: [1, 1], shadeW: 1 });
  shape(x, [[X(62), Y(75)], [X(78), Y(76)], [X(76), Y(90)], [X(60), Y(89)]], early ? P.leaf1 : P.beige1, { shade: early ? P.leaf2 : P.beige2, shadeDir: [1, 1], shadeW: 1 });
  if (per !== 'late') shape(x, [[X(50), Y(86)], [X(70), Y(86)], [X(72), Y(110)], [X(52), Y(108)]], early ? P.cream1 : P.beige1, { shade: early ? P.cream2 : P.beige2, shadeDir: [1, 1], shadeW: 2 });
  for (const lx of [6, 86]) rect(x, X(lx), Y(108), 3, 4, P.ink);
  contactShadow(x, X(46), Y(113), 42, 2, 0.3);
  // rug and the coffee table, a record crate and a basket at the right
  rect(x, X(8), Y(118), 110, 44, P.ink); rect(x, X(9), Y(119), 108, 42, early ? P.brick1 : mixHex(P.brick2, P.slate2, 0.4)); rect(x, X(13), Y(123), 100, 34, early ? P.brick2 : mixHex(P.brick3, P.slate1, 0.4));
  for (let k = 0; k < 96; k += 8) for (let j = 0; j < 30; j += 8) pset(x, X(17 + k + (j % 16 ? 4 : 0)), Y(127 + j), early ? P.honey1 : mixHex(P.honey2, P.slate3, 0.4));
  const ct = { x: 22, y: 122 };
  contactShadow(x, X(ct.x + 26), Y(ct.y + 24), 28, 2, 0.3); for (const lx of [ct.x + 2, ct.x + 47]) rect(x, X(lx), Y(ct.y + 14), 3, 8, P.ink);
  shape(x, [[X(ct.x), Y(ct.y)], [X(ct.x + 52), Y(ct.y)], [X(ct.x + 52), Y(ct.y + 15)], [X(ct.x), Y(ct.y + 15)]], woodL, { shade: wood, shadeDir: [0, 1], shadeW: 3, hi: mixHex(woodL, P.white, 0.2), hiDir: [0, -1] });
  block(x, X(ct.x + 6), Y(ct.y + 2), 13, 8, early ? P.cream1 : P.blue2); plantPot(x, X(ct.x + 42), Y(ct.y + 9), t, early ? 0 : 1); rect(x, X(ct.x + 26), Y(ct.y + 8), 8, 3, P.ink);
  shape(x, [[X(146), Y(126)], [X(170), Y(126)], [X(170), Y(146)], [X(146), Y(146)]], woodD, { shade: P.wood0, shadeDir: [1, 0], shadeW: 3, hi: wood, hiDir: [0, -1] }); for (let k = 0; k < 8; k++) { rect(x, X(148 + k * 2.6), Y(119 + (k % 3)), 3, 9, P.ink); rect(x, X(149 + k * 2.6), Y(120 + (k % 3)), 1, 7, [P.slate1, P.brick1, P.cream1, P.honey2, P.blue2, P.dark0, P.leaf2, P.red1][k]); }
  contactShadow(x, X(158), Y(147), 14, 2, 0.3);
  // things on the floor around the table: a laundry basket, her tote, a stack of books, slippers
  shape(x, [[X(14), Y(206)], [X(44), Y(206)], [X(42), Y(228)], [X(16), Y(228)]], P.cream3, { shade: P.wood2, shadeDir: [1, 0], shadeW: 3 }); for (let k = 0; k < 6; k++) vline(x, X(18 + k * 4), Y(208), Y(226), P.wood3); shape(x, [[X(16), Y(200)], [X(36), Y(197)], [X(44), Y(206)], [X(14), Y(208)]], early ? P.cream0 : P.blue0, { shade: early ? P.cream2 : P.blue1, shadeDir: [0, 1], shadeW: 2 }); contactShadow(x, X(29), Y(229), 15, 2, 0.3);
  shape(x, [[X(136), Y(204)], [X(148), Y(202)], [X(150), Y(218)], [X(136), Y(220)]], early ? P.cream1 : P.cream2, { shade: P.cream3, shadeDir: [1, 1], shadeW: 2, hi: P.cream0, hiDir: [0, -1] }); for (let k = 0; k < 6; k++) pset(x, X(139 + ri(Math.sin(k / 5 * Math.PI) * 5)), Y(202 - ri(Math.sin(k / 5 * Math.PI) * 6)), P.wood1); contactShadow(x, X(143), Y(221), 9, 1, 0.3);
  for (let k = 0; k < 4; k++) { const c = [P.slate3, P.brick1, P.cream1, P.honey2][k]; shape(x, [[X(150 + k), Y(246 - k * 4)], [X(170 + k), Y(245 - k * 4)], [X(170 + k), Y(249 - k * 4)], [X(150 + k), Y(250 - k * 4)]], c, { shade: mixHex(c, P.ink, 0.25), shadeDir: [0, 1], shadeW: 1 }); } contactShadow(x, X(161), Y(251), 12, 1, 0.3);
  for (const [sx, sy] of [[22, 250], [30, 252]]) { shape(x, [[X(sx), Y(sy)], [X(sx + 6), Y(sy)], [X(sx + 6), Y(sy + 9)], [X(sx), Y(sy + 9)]], early ? P.brick0 : P.mist1, { shade: early ? P.brick1 : P.slate4, shadeDir: [0, 1], shadeW: 2 }); hline(x, X(sx + 1), X(sx + 4), Y(sy + 2), early ? P.cream1 : P.mist2); }
  // ---- the table, her, and his chair from behind in the foreground
  const ty = 176;
  { const cx = X(st.her?.x ?? 92), cy = Y(186); for (const px of [cx - 9, cx + 7]) { rect(x, px, cy - 46, 3, 30, P.ink); vline(x, px + 1, cy - 45, cy - 17, woodD); } rect(x, cx - 9, cy - 47, 19, 4, P.ink); hline(x, cx - 8, cx + 8, cy - 46, wood); hline(x, cx - 8, cx + 8, cy - 45, woodD); } // her chair's back
  if (st.her) { const h = st.her; drawPerson(x, 'W', X(h.x ?? 92), Y(h.y ?? 186), { dir: 'front', sit: true, t, ...h }); }
  contactShadow(x, X(92), Y(ty + 30 + 22), 40, 3, 0.3);
  tableSquare(x, X(56), Y(ty), 72, 30, 22, early ? P.wood4 : P.wood3, P.wood1, mixHex(P.wood4, P.white, 0.25));
  for (const it of st.items || []) tableItem(x, X(56 + it.x), Y(ty + it.y), it, t);
  if (st.hisChair !== false) { const cx = X(st.hisChairX ?? 92), cy = Y(258); // seen from behind and a little above: back rail, spindles, the seat, legs
    contactShadow(x, cx, cy + 4, 18, 2, 0.35);
    for (const lx of [cx - 14, cx + 11]) { rect(x, lx, cy - 14, 3, 18, P.ink); vline(x, lx + 1, cy - 13, cy + 2, woodD); }
    for (const lx of [cx - 11, cx + 8]) { rect(x, lx, cy - 18, 3, 12, P.ink); vline(x, lx + 1, cy - 17, cy - 8, P.wood0); }
    shape(x, [[cx - 15, cy - 26], [cx + 15, cy - 26], [cx + 17, cy - 14], [cx - 17, cy - 14]], early ? P.brick1 : wood, { shade: woodD, shadeDir: [0, 1], shadeW: 2, hi: woodL, hiDir: [0, -1] });
    for (const px of [cx - 15, cx + 12]) shape(x, [[px, cy - 58], [px + 4, cy - 58], [px + 4, cy - 16], [px, cy - 16]], woodD, { shade: P.wood0, shadeDir: [1, 0], shadeW: 1, hi: wood, hiDir: [-1, 0] });
    for (const sx of [-6, 0, 6]) { rect(x, cx + sx - 1, cy - 50, 3, 26, P.ink); vline(x, cx + sx, cy - 49, cy - 25, woodD); }
    shape(x, [[cx - 17, cy - 62], [cx + 17, cy - 62], [cx + 17, cy - 52], [cx - 17, cy - 52]], woodD, { shade: P.wood0, shadeDir: [0, 1], shadeW: 2, hi: wood, hiDir: [0, -1] });
    hline(x, cx - 14, cx + 14, cy - 60, mixHex(wood, P.white, 0.15));
  }
  if (st.reflect) { x.save(); x.globalAlpha = st.reflect; drawPerson(x, 'M', X(92), Y(258), { dir: 'back', sit: true, t, still: true }); x.restore(); }
  // ---- the window sill along the bottom edge: the cactus, a glass of water, the curtain's hem
  rect(x, ox, Y(296), SET_W, 24, P.ink); rect(x, ox, Y(297), SET_W, 4, mixHex(P.cream0, L.wall, 0.2)); rect(x, ox, Y(301), SET_W, 19, mixHex(P.mist1, P.ink, 0.45)); for (let k = 0; k < SET_W; k += 4) vline(x, X(k + 2), Y(303), Y(319), mixHex(P.slate4, P.ink, 0.45)); // radiator below
  plantPot(x, X(30), Y(297), t, 2); rect(x, X(150), Y(287), 6, 10, P.ink); rect(x, X(151), Y(288), 4, 8, P.glass2); rect(x, X(151), Y(291), 4, 5, P.glass);
  curtain(x, X(0), oy, 12, 296, [mixHex(P.cream0, L.wall, 0.15), mixHex(P.cream2, L.wall, 0.2)], st.breathe || 0);
  shape(x, [[X(170), oy], [X(180), oy], [X(180), Y(296)], [X(168), Y(296)]], mixHex(P.slate4, L.wall, 0.2), { shade: mixHex(P.slate3, L.wall, 0.2), shadeDir: [-1, 0], shadeW: 3, outline: false });
  // ---- light from the window behind us
  shade(x, ox, oy, SET_W, R.h, L.tint, L.tintA);
  lightSteps(x, [[X(30), Y(296)], [X(150), Y(296)], [X(130), Y(170)], [X(56), Y(170)]], early ? P.honey0 : P.mist2, [[[0, 0], early ? 0.1 : 0.07]]);
  if (st.lamp) glow(x, X(99), Y(70), 30, 20, P.honey0, 0.4 * st.lamp);
}
