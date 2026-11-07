'use strict';
/*
 * The remembered places: the small restaurant (the photo), a friend's wedding banquet,
 * the bus stop at dusk. Each is 180×320 and filled edge to edge so any 2× or 3× framing is full.
 */
function mirrorText(x, s, cx, py, col, f) { x.save(); x.translate(2 * ri(cx), 0); x.scale(-1, 1); text(x, s, ri(cx), py, col, f, { align: 'center' }); x.restore(); }
function bottle(x, px, py, body, label, h = 14) { // a beer bottle standing on py
  rect(x, px - 2, py - h, 5, h, P.ink); rect(x, px - 1, py - h + 1, 3, h - 2, body); rect(x, px - 1, py - h - 4, 3, 5, P.ink); pset(x, px, py - h - 3, body); pset(x, px, py - h - 5, P.honey1);
  rect(x, px - 1, py - h + 5, 3, 4, label); pset(x, px - 1, py - h + 2, mixHex(body, P.white, 0.4));
}
function stoolTop(x, cx, cy, top, side) { contactShadow(x, cx, cy + 14, 8, 1, 0.3); for (const lx of [-5, 4]) rect(x, cx + lx, cy + 2, 2, 12, P.ink); hline(x, cx - 4, cx + 4, cy + 9, P.ink); ellipse(x, cx, cy, 7, 3, P.ink); ellipse(x, cx, cy, 6, 2, top); hline(x, cx - 5, cx + 5, cy + 2, side); }

// ------------------------------------------------------------- the small restaurant
// Back wall: the street window (painted name read backwards), the menu board, a lantern, an
// old TV in the corner. The booth with its tufted red vinyl, the formica table with what they
// ordered, condiments, a napkin box. A partition, crates of beer with a fan on top. Nearer: an
// empty table with stools and somebody's leftovers.
function restaurantSet(x, R, st, t) {
  const ox = R.x, oy = R.y, X = v => ox + v, Y = v => oy + v;
  const wall = '#d9b98a', wall2 = '#cfae7e', wain = P.wood3;
  plaster(x, { x: ox, y: oy, w: SET_W, h: 92 }, wall, wall2, mixHex(wall, P.white, 0.15), 21);
  rect(x, ox, oy, SET_W, 3, mixHex(wall, P.ink, 0.3));
  rect(x, ox, Y(90), SET_W, 30, wain); for (let k = 0; k < SET_W; k += 6) { vline(x, X(k), Y(92), Y(119), P.wood2); pset(x, X(k + 3), Y(96 + (k % 5)), P.wood2); }
  rect(x, ox, Y(88), SET_W, 4, P.wood2); hline(x, ox, X(179), Y(88), P.wood4); hline(x, ox, X(179), Y(92), P.ink); hline(x, ox, X(179), Y(120), P.ink);
  // the street window
  const wx = X(10), wy = Y(10), ww = 100, wh = 70;
  rect(x, wx - 3, wy - 3, ww + 6, wh + 6, P.ink); rect(x, wx - 2, wy - 2, ww + 4, wh + 4, P.wood2);
  clip(x, { x: wx, y: wy, w: ww, h: wh }, () => {
    const sky = ['#9ec3d9', '#c6d3d6', '#efd7a8', '#f3c98e']; sky.forEach((c, i) => rect(x, wx, wy + i * 8, ww, 9, c));
    for (let k = 0; k < 5; k++) { const bx = wx + k * 22 - 4, bh = 40 + (k % 3) * 8, col = ['#b7765c', '#c9a079', '#a8836a', '#c48a6a', '#b99a7a'][k]; rect(x, bx, wy + wh - bh, 21, bh, col); hline(x, bx, bx + 20, wy + wh - bh, mixHex(col, P.ink, 0.3)); for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) rect(x, bx + 3 + c * 6, wy + wh - bh + 5 + r * 8, 3, 4, hash3(k, r, c) < 0.4 ? P.honey0 : mixHex(col, P.ink, 0.35)); }
    rect(x, wx, wy + 48, ww, 8, P.red1); for (let k = 0; k < ww; k += 8) rect(x, wx + k, wy + 48, 4, 8, P.cream1); // a striped awning across the street
    rect(x, wx, wy + 56, ww, 14, P.slate3); hline(x, wx, wx + ww, wy + 56, P.slate4); for (let k = 0; k < ww; k += 14) rect(x, wx + k, wy + 63, 6, 1, P.cream2);
    for (let k = 0; k < 12; k++) pset(x, wx + 4 + k * 8, wy + 30 + ri(Math.sin(k * 0.8) * 2), mod(t * 1.3 + k * 0.4, 1) < 0.8 ? P.honey0 : P.honey2); // a string of bulbs
    if (st.passer) { const px = wx + mod(t * 9, ww + 20) - 10; rect(x, px - 2, wy + 47, 5, 12, P.ink); rect(x, px - 1, wy + 48, 3, 6, P.blue2); rect(x, px - 1, wy + 54, 3, 4, P.dark0); disc(x, px, wy + 45, 2, P.skin1); }
    { const bx = wx + 66; line(x, bx, wy + 62, bx + 12, wy + 62, P.ink); disc(x, bx, wy + 65, 3, P.ink); disc(x, bx + 12, wy + 65, 3, P.ink); pset(x, bx, wy + 65, P.slate3); pset(x, bx + 12, wy + 65, P.slate3); line(x, bx + 2, wy + 58, bx + 6, wy + 62, P.ink); } // a parked bicycle
    x.save(); x.globalAlpha = 0.18; poly(x, [[wx + 10, wy], [wx + 22, wy], [wx + 8, wy + wh], [wx - 4, wy + wh]], P.white); poly(x, [[wx + 60, wy], [wx + 66, wy], [wx + 52, wy + wh], [wx + 46, wy + wh]], P.white); x.restore();
  });
  vline(x, wx + ww / 2, wy, wy + wh - 1, P.wood2); vline(x, wx + ww / 2 + 1, wy, wy + wh - 1, P.ink);
  mirrorText(x, '家常小炒', wx + ww / 4 + 1, wy + 6, P.red0, FONT.small); mirrorText(x, '面 饭 酒', wx + ww * 3 / 4, wy + 8, P.red0, FONT.tiny);
  rect(x, wx - 5, wy + wh + 2, ww + 10, 4, P.ink); rect(x, wx - 4, wy + wh + 2, ww + 8, 2, P.wood4);
  // a lucky cat and a jar of chopsticks on the sill
  block(x, wx + 84, wy + wh - 6, 7, 8, P.white); pset(x, wx + 86, wy + wh - 4, P.ink); pset(x, wx + 88, wy + wh - 4, P.ink); rect(x, wx + 85, wy + wh - 2, 5, 1, P.red0); rect(x, wx + 90, wy + wh - 10, 2, 4, P.white);
  // the menu board with prices, the lantern, an old TV in the corner, a calendar
  const mb = { x: 116, y: 34 };
  shape(x, [[X(mb.x), Y(mb.y)], [X(mb.x + 46), Y(mb.y)], [X(mb.x + 46), Y(mb.y + 52)], [X(mb.x), Y(mb.y + 52)]], P.wood1, { shade: P.wood0, shadeDir: [1, 1], shadeW: 1 });
  const dishes = [['红烧茄子', '28'], ['番茄炒蛋', '22'], ['回锅肉', '32'], ['青菜', '16'], ['米饭', '2'], ['冰啤酒', '8']];
  dishes.forEach(([n, p], k) => { text(x, n, X(mb.x + 3), Y(mb.y + 2 + k * 8), k === 0 ? P.honey0 : P.cream1, FONT.tiny); text(x, p, X(mb.x + 44), Y(mb.y + 2 + k * 8), P.cream2, FONT.tiny, { align: 'right' }); });
  rect(x, X(mb.x + 6), Y(mb.y - 6), 1, 6, P.ink); rect(x, X(mb.x + 39), Y(mb.y - 6), 1, 6, P.ink);
  hline(x, X(116), X(179), Y(8), P.ink); line(x, X(130), Y(8), X(130), Y(16), P.ink);
  ellipse(x, X(130), Y(22), 6, 7, P.ink); ellipse(x, X(130), Y(22), 5, 6, P.red0); hline(x, X(125), X(135), Y(19), P.red1); hline(x, X(125), X(135), Y(25), P.red1); rect(x, X(128), Y(15), 5, 2, P.honey2); rect(x, X(128), Y(28), 5, 2, P.honey2); vline(x, X(130), Y(30), Y(34), P.honey1);
  rect(x, X(150), Y(4), 28, 2, P.ink); rect(x, X(162), Y(6), 2, 4, P.ink);
  shape(x, [[X(150), Y(10)], [X(176), Y(10)], [X(176), Y(28)], [X(150), Y(28)]], P.slate1, { shade: P.slate0, shadeDir: [1, 1], shadeW: 2 });
  rect(x, X(152), Y(12), 18, 13, mixHex(P.slate2, P.leaf1, 0.4)); const fl = mod(Math.floor(t * 4), 3); rect(x, X(154), Y(16), 6, 6, [P.honey0, P.brick0, P.leaf1][fl]); rect(x, X(161), Y(14 + fl), 7, 4, P.cream1); hline(x, X(152), X(169), Y(12 + mod(Math.floor(t * 12), 13)), mixHex(P.slate2, P.white, 0.3));
  pset(x, X(173), Y(14), P.red0); pset(x, X(173), Y(18), P.slate4);
  block(x, X(166), Y(40), 12, 16, P.white); rect(x, X(167), Y(41), 10, 4, P.red0); text(x, '17', X(172), Y(46), P.red1, FONT.tiny, { align: 'center' });
  // ---- floor: small two-tone terrazzo tiles
  rect(x, ox, Y(121), SET_W, R.h - 121, '#c9b18c');
  for (let y = 121; y < R.h; y += 7) for (let k = 0; k < SET_W; k += 7) { if (((k + y) / 7) % 2 < 1) rect(x, X(k), Y(y), 7, 7, '#bda37f'); if (hash2(k, y) < 0.4) pset(x, X(k + 2 + ri(hash2(y, k) * 3)), Y(y + 3), '#a78e6c'); if (hash2(y + 1, k) < 0.3) pset(x, X(k + 4), Y(y + 1), '#d8c3a0'); }
  // ---- the booth: tufted vinyl back with a wood cap
  const bt = { x: 20, y: 122, w: 112 };
  shape(x, [[X(bt.x), Y(bt.y)], [X(bt.x + bt.w), Y(bt.y)], [X(bt.x + bt.w), Y(bt.y + 40)], [X(bt.x), Y(bt.y + 40)]], P.brick1, { shade: P.brick2, shadeDir: [0, 1], shadeW: 4, hi: P.brick0, hiDir: [0, -1] });
  rect(x, X(bt.x - 2), Y(bt.y - 4), bt.w + 4, 5, P.ink); rect(x, X(bt.x - 1), Y(bt.y - 3), bt.w + 2, 3, P.wood3); hline(x, X(bt.x - 1), X(bt.x + bt.w), Y(bt.y - 3), P.wood4);
  for (let r = 0; r < 3; r++) for (let k = 0; k < 9; k++) { const cx = X(bt.x + 7 + k * 12 + (r % 2) * 6), cy = Y(bt.y + 8 + r * 10); if (cx > X(bt.x + bt.w - 4)) continue; pset(x, cx, cy, P.brick3); pset(x, cx - 1, cy - 1, P.brick0); line(x, cx + 1, cy + 1, cx + 5, cy + 5, P.brick2); line(x, cx - 1, cy + 1, cx - 5, cy + 5, P.brick2); }
  if (st.people) for (const p of st.people.filter(p => p.behind)) drawPerson(x, p.who, X(p.x), Y(p.y), { ...p, t });
  // the partition with a coat hook and a pothos trailing from the top
  shape(x, [[X(134), Y(100)], [X(140), Y(100)], [X(140), Y(200)], [X(134), Y(200)]], P.wood2, { shade: P.wood1, shadeDir: [1, 0], shadeW: 2, hi: P.wood3, hiDir: [-1, 0] });
  plantPot(x, X(137), Y(100), t, 0); for (let k = 0; k < 8; k++) { const vx = X(139 + ri(Math.sin(k * 0.9) * 2)), vy = Y(102 + k * 5); pset(x, vx, vy, P.leaf2); pset(x, vx + 1, vy + 1, P.leaf1); }
  rect(x, X(131), Y(140), 3, 2, P.slate3); shape(x, [[X(125), Y(142)], [X(134), Y(142)], [X(133), Y(162)], [X(126), Y(162)]], P.olive1, { shade: P.olive2, shadeDir: [1, 0], shadeW: 2 }); // his jacket on the hook
  // beer crates with a fan on top
  for (let r = 0; r < 3; r++) { const cy = Y(196 - r * 16); shape(x, [[X(146), cy - 15], [X(176), cy - 15], [X(176), cy], [X(146), cy]], P.honey1, { shade: P.honey2, shadeDir: [0, 1], shadeW: 3, hi: P.honey0, hiDir: [0, -1] }); rect(x, X(150), cy - 11, 22, 3, P.honey3); if (r === 2) for (let k = 0; k < 6; k++) { rect(x, X(149 + k * 4), cy - 22, 3, 8, P.ink); pset(x, X(150 + k * 4), cy - 21, P.leaf3); } }
  contactShadow(x, X(161), Y(198), 18, 2, 0.35);
  const fan = { x: 161, y: 132 }; rect(x, X(fan.x - 1), Y(fan.y - 26), 2, 26, P.ink); ellipse(x, X(fan.x), Y(fan.y - 34), 9, 9, P.ink); ellipse(x, X(fan.x), Y(fan.y - 34), 8, 8, P.leaf0);
  for (let k = 0; k < 3; k++) { const a = t * 14 + k * TAU / 3; line(x, X(fan.x), Y(fan.y - 34), X(fan.x + Math.cos(a) * 6), Y(fan.y - 34 + Math.sin(a) * 6), P.leaf2); } disc(x, X(fan.x), Y(fan.y - 34), 1, P.slate1); for (let k = -8; k <= 8; k += 4) vline(x, X(fan.x + k), Y(fan.y - 42 + Math.abs(k) / 2), Y(fan.y - 26 - Math.abs(k) / 2), P.slate3);
  // ---- the table and what is on it
  const tb = { x: 26, y: 170, w: 100, d: 28, h: 19 };
  contactShadow(x, X(tb.x + tb.w / 2), Y(tb.y + tb.d + tb.h + 1), tb.w / 2 + 4, 3, 0.3);
  tableSquare(x, X(tb.x), Y(tb.y), tb.w, tb.d, tb.h, P.cream1, P.wood2, P.white);
  for (let k = 0; k < 30; k++) pset(x, X(tb.x + 2 + hash(k * 3) * (tb.w - 4)), Y(tb.y + 2 + hash(k * 7) * (tb.d - 4)), P.cream2); // formica flecks
  // condiments at the wall end: soy, vinegar, chili jar, toothpicks, chopstick tube, napkin box
  bottle(x, X(tb.x + 92), Y(tb.y + 9), P.dark0, P.red0, 9); bottle(x, X(tb.x + 87), Y(tb.y + 9), P.wood1, P.cream1, 8);
  rect(x, X(tb.x + 80), Y(tb.y + 2), 5, 7, P.ink); rect(x, X(tb.x + 81), Y(tb.y + 3), 3, 5, P.red0); pset(x, X(tb.x + 82), Y(tb.y + 4), P.red1);
  rect(x, X(tb.x + 4), Y(tb.y - 4), 6, 12, P.ink); rect(x, X(tb.x + 5), Y(tb.y - 3), 4, 10, P.glass2); for (let k = 0; k < 4; k++) vline(x, X(tb.x + 5 + k), Y(tb.y - 7 + (k % 2)), Y(tb.y - 3), P.wood3);
  block(x, X(tb.x + 82), Y(tb.y + 12), 12, 8, P.white); rect(x, X(tb.x + 85), Y(tb.y + 10), 6, 3, P.white); hline(x, X(tb.x + 83), X(tb.x + 92), Y(tb.y + 16), P.red0); // napkin box
  // a teapot and two tea cups, chopsticks in paper sleeves at each place, a little dish of peanuts
  { const tx = X(tb.x + 58), ty = Y(tb.y + 8); shape(x, [[tx - 6, ty - 7], [tx + 6, ty - 7], [tx + 7, ty + 1], [tx - 7, ty + 1]], P.cream0, { shade: P.cream2, shadeDir: [1, 0], shadeW: 2, hi: P.white, hiDir: [-1, 0] }); rect(x, tx - 2, ty - 10, 5, 3, P.ink); pset(x, tx - 1, ty - 9, P.cream1); line(x, tx + 7, ty - 4, tx + 10, ty - 8, P.ink); hline(x, tx - 5, tx + 5, ty - 3, P.leaf2); }
  for (const cx of [tb.x + 40, tb.x + 72]) { rect(x, X(cx - 2), Y(tb.y + 4), 5, 4, P.ink); rect(x, X(cx - 1), Y(tb.y + 5), 3, 2, P.white); pset(x, X(cx), Y(tb.y + 5), P.honey1); }
  for (const cx of [tb.x + 30, tb.x + 58]) { line(x, X(cx), Y(tb.y + 23), X(cx + 14), Y(tb.y + 21), P.ink); line(x, X(cx), Y(tb.y + 22), X(cx + 14), Y(tb.y + 20), P.red0); pset(x, X(cx + 3), Y(tb.y + 22), P.white); }
  ellipse(x, X(tb.x + 50), Y(tb.y + 14), 4, 2, P.ink); ellipse(x, X(tb.x + 50), Y(tb.y + 14), 3, 1, P.white); for (let k = 0; k < 4; k++) pset(x, X(tb.x + 48 + k), Y(tb.y + 13 + (k % 2)), P.honey2);
  for (const it of st.items || []) tableItem(x, X(tb.x + it.x), Y(tb.y + it.y), it, t);
  if (st.people) for (const p of st.people.filter(p => !p.behind)) drawPerson(x, p.who, X(p.x), Y(p.y), { ...p, t });
  if (st.after) st.after(X, Y);
  // ---- nearer: an empty table with stools and leftovers; a dropped napkin
  const nt = { x: 18, y: 246, w: 70, d: 26, h: 18 };
  stoolTop(x, X(34), Y(nt.y - 6), P.red0, P.red1); stoolTop(x, X(72), Y(nt.y - 6), P.red0, P.red1);
  contactShadow(x, X(nt.x + nt.w / 2), Y(nt.y + nt.d + nt.h + 1), nt.w / 2 + 4, 3, 0.3);
  tableSquare(x, X(nt.x), Y(nt.y), nt.w, nt.d, nt.h, P.cream1, P.wood2, P.white);
  for (const [dx, dy] of [[14, 10], [34, 8]]) { ellipse(x, X(nt.x + dx), Y(nt.y + dy), 7, 3, P.ink); ellipse(x, X(nt.x + dx), Y(nt.y + dy), 6, 2, P.white); pset(x, X(nt.x + dx - 2), Y(nt.y + dy), P.brick1); pset(x, X(nt.x + dx + 1), Y(nt.y + dy - 1), P.leaf2); }
  line(x, X(nt.x + 44), Y(nt.y + 16), X(nt.x + 58), Y(nt.y + 12), P.wood4); line(x, X(nt.x + 44), Y(nt.y + 18), X(nt.x + 58), Y(nt.y + 14), P.wood4);
  bottle(x, X(nt.x + 60), Y(nt.y + 10), P.leaf3, P.cream1, 12);
  stoolTop(x, X(42), Y(nt.y + nt.d + 18), P.red0, P.red1); stoolTop(x, X(4), Y(nt.y + 4), P.red0, P.red1);
  shape(x, [[X(96), Y(300)], [X(104), Y(298)], [X(106), Y(304)], [X(97), Y(305)]], P.white, { shade: P.cream2, shadeDir: [0, 1], shadeW: 1 });
  // a waiter's trolley with a tub of dishes at the right
  const wt = { x: 112, y: 254 };
  contactShadow(x, X(wt.x + 18), Y(wt.y + 34), 20, 2, 0.35);
  for (const lx of [wt.x + 1, wt.x + 34]) rect(x, X(lx), Y(wt.y + 4), 2, 28, P.ink); for (const wx2 of [wt.x + 2, wt.x + 35]) { disc(x, X(wx2), Y(wt.y + 32), 2, P.ink); }
  for (const sy of [wt.y, wt.y + 20]) { rect(x, X(wt.x - 1), Y(sy), 38, 5, P.ink); rect(x, X(wt.x), Y(sy + 1), 36, 3, P.slate4); hline(x, X(wt.x), X(wt.x + 35), Y(sy + 1), P.slate5); }
  shape(x, [[X(wt.x + 4), Y(wt.y - 10)], [X(wt.x + 32), Y(wt.y - 10)], [X(wt.x + 30), Y(wt.y + 1)], [X(wt.x + 6), Y(wt.y + 1)]], P.slate2, { shade: P.slate1, shadeDir: [0, 1], shadeW: 2, hi: P.slate3, hiDir: [0, -1] });
  for (let k = 0; k < 4; k++) { ellipse(x, X(wt.x + 10 + k * 5), Y(wt.y - 11 + (k % 2)), 4, 1, P.ink); ellipse(x, X(wt.x + 10 + k * 5), Y(wt.y - 11 + (k % 2)), 3, 0, P.white); }
  for (let k = 0; k < 3; k++) bottle(x, X(wt.x + 8 + k * 7), Y(wt.y + 20), P.leaf3, P.cream1, 10);
  // ---- light: warm, the window spilling across the booth
  lightSteps(x, [[wx, Y(122)], [wx + ww, Y(122)], [wx + ww + 24, Y(240)], [wx + 18, Y(240)]], P.honey0, [[[0, 0], 0.08], [[6, 6], 0.06]]);
  shade(x, ox, oy, SET_W, R.h, P.honey1, 0.06); glow(x, X(130), Y(22), 26, 20, P.honey0, 0.3);
  if (st.flash) shade(x, ox, oy, SET_W, R.h, P.white, st.flash);
}

// ------------------------------------------------------------- the wedding banquet (a friend's)
// A guest, seated (or standing): front view faces us (drawn before their table), back view is
// the near side of a table (drawn after it). Acts: clap, toast, phone, eat, talk.
function guest(x, px, py, o) {
  const t = o.t || 0, sd = o.seed || 0, view = o.view || 'front', top = o.top || P.slate2, skin = o.skin || P.skin1, hair = o.hair || P.hairM0;
  const ph = mod(t * 0.8 + sd * 0.37, 3), stand = o.stand, by = stand ? py - 14 : py; // body base
  const hy = by - 31 + (o.act === 'talk' && Math.floor(t * 3 + sd) % 2 ? 1 : 0);
  if (stand) { // legs / skirt
    if (o.dress) shape(x, [[px - 5, by - 12], [px + 5, by - 12], [px + 8, py], [px - 8, py]], o.dress, { shade: mixHex(o.dress, P.ink, 0.15), shadeDir: [1, 0], shadeW: 2, hi: P.white, hiDir: [-1, 0] });
    else { rect(x, px - 4, by - 12, 4, 26, P.ink); rect(x, px + 1, by - 12, 4, 26, P.ink); rect(x, px - 3, by - 11, 2, 24, o.legs || P.dark0); rect(x, px + 2, by - 11, 2, 24, o.legs || P.dark0); rect(x, px - 5, py - 1, 5, 2, P.ink); rect(x, px + 1, py - 1, 5, 2, P.ink); }
  }
  shape(x, [[px - 5, by - 25], [px + 5, by - 25], [px + 6, by - 10], [px - 6, by - 10]], top, { shade: mixHex(top, P.ink, 0.25), shadeDir: view === 'back' ? [0, -1] : [1, 0], shadeW: 2, hi: mixHex(top, P.white, 0.2), hiDir: [-1, 0] });
  if (view === 'front') { rect(x, px - 1, by - 26, 3, 2, skin); if (o.tie) { vline(x, px, by - 24, by - 18, o.tie); } else pset(x, px, by - 24, mixHex(top, P.white, 0.4)); }
  disc(x, px, hy, 4, P.ink); disc(x, px, hy, 3, skin);
  if (view === 'back') { disc(x, px, hy, 3, hair); if (o.long) rect(x, px - 3, hy, 7, 6, hair); if (o.bun) disc(x, px, hy - 4, 1, hair); }
  else {
    rect(x, px - 3, hy - 3, 7, 2, hair); pset(x, px - 3, hy - 1, hair); pset(x, px + 3, hy - 1, hair); if (o.long) { rect(x, px - 4, hy - 2, 1, 7, hair); rect(x, px + 4, hy - 2, 1, 7, hair); } if (o.bun) disc(x, px, hy - 5, 1, hair);
    const blink = mod(t * 0.7 + sd * 0.53, 4) < 0.08; if (!blink) { pset(x, px - 1, hy, P.ink); pset(x, px + 1, hy, P.ink); }
    if (o.act === 'clap' || o.act === 'toast' || o.mood === 'smile') pset(x, px, hy + 2, P.lip);
  }
  const hand = (hx, hy2) => { pset(x, hx, hy2, P.ink); pset(x, hx, hy2 - 1, skin); };
  const sl = mixHex(top, P.ink, 0.15), arm = (x0, y0, x1, y1) => { line(x, x0, y0, x1, y1, P.ink); line(x, x0 + (x1 > x0 ? 0 : 0), y0 + 1, x1, y1 + 1, sl); };
  if (view === 'back') return;
  if (o.act === 'clap' && ph < 1.4) { const c = Math.floor(t * 7 + sd) % 2; arm(px - 5, by - 22, px - 1 + c, by - 17); arm(px + 5, by - 22, px + 1 - c, by - 17); hand(px - 1 + c, by - 17); hand(px + 1 - c, by - 17); }
  else if (o.act === 'toast' && ph < 1.8) { arm(px + 5, by - 22, px + 8, by - 30); rect(x, px + 7, by - 35, 3, 5, P.ink); rect(x, px + 8, by - 34, 1, 3, P.honey1); hand(px + 8, by - 30); }
  else if (o.act === 'phone') { arm(px + 5, by - 22, px + 8, by - 27); arm(px - 5, by - 22, px + 4, by - 25); rect(x, px + 5, by - 33, 6, 8, P.ink); rect(x, px + 6, by - 32, 4, 6, P.slate4); if (mod(t * 2 + sd, 3) < 0.15) shade(x, px + 3, by - 36, 10, 12, P.white, 0.7); }
  else if (o.act === 'mic') { arm(px + 5, by - 22, px + 4, by - 28); rect(x, px + 3, by - 31, 2, 4, P.ink); pset(x, px + 3, by - 32, P.slate4); arm(px - 5, by - 22, px - 8, by - 15 + (Math.floor(t * 2) % 2)); }
  else if (o.act === 'eat' && ph > 2) { arm(px + 5, by - 22, px + 1, by - 27); hand(px + 1, by - 27); }
  else { arm(px - 5, by - 22, px - 5, by - 13); arm(px + 5, by - 22, px + 5, by - 13); }
}
const GUESTS = [ // top colour, hair, long, skin, tie
  [P.slate2, P.hairM0, 0, P.skin1, P.red1], [P.brick1, P.hairW1, 1, P.skin0], [P.olive1, P.hairM1, 0, P.skin2, P.dark1], [P.blue2, P.hairW0, 1, P.skin1],
  [P.honey2, P.hairW2, 1, P.skin0], [P.dark0, P.hairM0, 0, P.skin1, P.red0], [P.leaf2, P.hairW1, 1, P.skin2], [P.cream2, P.hairM1, 0, P.skin0, P.slate1], [P.red1, P.hairW0, 1, P.skin1],
];
function roundTable(x, cx, cy, rx, ry, t, seed, o = {}) { // cloth, skirt, lazy susan, dishes, glasses, centrepiece, guests round it
  const n = o.n ?? 8, cheer = o.cheer, skip = o.skip || [];
  const seat = k => { const a = (k + 0.5) / n * TAU - Math.PI / 2, g = GUESTS[(k * 3 + seed) % GUESTS.length]; return { a, gx: cx + Math.cos(a) * (rx + 2), gy: cy + Math.sin(a) * (ry + 2), g }; };
  const actOf = k => cheer ? ['clap', 'toast', 'clap', 'phone', 'talk', 'clap', 'toast', 'talk'][(k + seed) % 8] : ['talk', 'eat', '', 'eat', 'talk', ''][(k + seed) % 6];
  for (let k = 0; k < n; k++) { const s = seat(k); if (Math.sin(s.a) < 0 && !skip.includes(k)) guest(x, ri(s.gx), ri(s.gy + 12), { t, seed: seed * 7 + k, top: s.g[0], hair: s.g[1], long: s.g[2], skin: s.g[3], tie: s.g[4], act: actOf(k) }); }
  contactShadow(x, cx, cy + ry + 8, rx + 2, 3, 0.35);
  ellipse(x, cx, cy + 6, rx + 1, ry + 1, P.ink); rect(x, cx - rx, cy, rx * 2 + 1, 6, P.ink); ellipse(x, cx, cy + 5, rx, ry, mixHex(P.cream1, P.cream2, 0.5));
  for (let k = -rx + 4; k < rx - 2; k += 5) vline(x, cx + k, cy + Math.round(ry * Math.sqrt(Math.max(0, 1 - (k * k) / (rx * rx)))), cy + 5 + Math.round(ry * Math.sqrt(Math.max(0, 1 - (k * k) / (rx * rx)))), P.cream2); // skirt folds
  ellipse(x, cx, cy, rx + 1, ry + 1, P.ink); ellipse(x, cx, cy, rx, ry, P.cream0); hline(x, cx - rx + 3, cx + rx - 3, cy - ry + 1, P.white);
  ellipse(x, cx, cy, ri(rx * 0.45), ri(ry * 0.45), P.ink); ellipse(x, cx, cy, ri(rx * 0.45) - 1, ri(ry * 0.45) - 1, P.glass2); // lazy susan
  for (let k = 0; k < 5; k++) { const a = k / 5 * TAU + seed, dx = ri(Math.cos(a) * rx * 0.3), dy = ri(Math.sin(a) * ry * 0.3); ellipse(x, cx + dx, cy + dy, 4, 1, P.ink); ellipse(x, cx + dx, cy + dy, 3, 0, [P.brick0, P.leaf1, P.honey1, P.red0, P.cream2][(k + seed) % 5]); }
  rect(x, cx - 1, cy - 9, 3, 8, P.ink); pset(x, cx, cy - 8, P.glass2); for (const [dx, dy, c] of [[-2, -11, P.red0], [1, -12, P.white], [0, -10, P.brick0], [3, -10, P.red1], [-1, -13, P.leaf1]]) pset(x, cx + dx, cy + dy, c); // flowers
  for (let k = 0; k < n; k++) { const a = (k + 0.5) / n * TAU - Math.PI / 2, gx = ri(cx + Math.cos(a) * rx * 0.78), gy = ri(cy + Math.sin(a) * ry * 0.72); rect(x, gx - 1, gy - 2, 3, 2, P.red0); pset(x, gx + 2, gy - 3, P.glass2); pset(x, gx + 2, gy - 2, P.honey1); }
  if (o.card) { block(x, cx + ri(rx * 0.5), cy - 3, 6, 4, P.white); pset(x, cx + ri(rx * 0.5) + 2, cy - 2, P.red0); }
  for (let k = 0; k < n; k++) { const s = seat(k); if (Math.sin(s.a) >= 0 && !skip.includes(k)) guest(x, ri(s.gx), ri(s.gy + 20), { t, seed: seed * 7 + k, view: 'back', top: s.g[0], hair: s.g[1], long: s.g[2], skin: s.g[3] }); }
}
function weddingSet(x, R, st, t) {
  const ox = R.x, oy = R.y, X = v => ox + v, Y = v => oy + v;
  // ---- hall wall with draped fabric
  rect(x, ox, oy, SET_W, 110, '#e8d9bb'); for (let k = 0; k < SET_W; k += 8) { vline(x, X(k), oy, Y(108), '#dccaa6'); vline(x, X(k + 4), oy, Y(108), '#efe2c8'); }
  for (let k = 0; k < SET_W; k += 30) for (let j = 0; j < 30; j++) pset(x, X(k + j), Y(4 + ri(Math.sin(j / 30 * Math.PI) * 6)), P.honey2); // swags
  // ---- the stage backdrop: red with a gold border, 囍, a flower arch, string lights, balloons
  const bd = { x: 22, y: 10, w: 136, h: 80 };
  rect(x, X(bd.x - 2), Y(bd.y - 2), bd.w + 4, bd.h + 2, P.ink); rect(x, X(bd.x - 1), Y(bd.y - 1), bd.w + 2, bd.h, P.honey1); rect(x, X(bd.x + 2), Y(bd.y + 2), bd.w - 4, bd.h - 4, P.red1);
  for (let k = bd.x + 4; k < bd.x + bd.w - 4; k += 5) vline(x, X(k), Y(bd.y + 3), Y(bd.y + bd.h - 3), P.red2);
  for (let k = 0; k < 30; k++) { const a = Math.PI + k / 29 * Math.PI, cx = X(90 + Math.cos(a) * 46), cy = Y(88 + Math.sin(a) * 62); disc(x, cx, cy, 2, [P.white, P.brick0, P.cream0, P.red0][k % 4]); pset(x, cx, cy, P.honey1); if (k % 3 === 0) { pset(x, cx + 2, cy + 2, P.leaf1); pset(x, cx - 2, cy + 1, P.leaf2); } }
  block(x, X(76), Y(22), 28, 28, P.red0, P.brick0); text(x, '囍', X(90), Y(24), P.honey0, FONT.title, { align: 'center' });
  for (let k = 0; k < 26; k++) { const lx = X(bd.x + 2 + k * 5.2), ly = Y(bd.y + 2 + ri(Math.sin(k / 25 * Math.PI) * 6)); pset(x, lx, ly, mod(t * 1.5 + k * 0.3, 1) < 0.8 ? P.honey0 : P.honey2); }
  for (const [bx, by] of [[14, 30], [166, 30]]) for (let k = 0; k < 5; k++) { const cx = X(bx + [-4, 3, -1, 4, -3][k]), cy = Y(by + [0, -3, 6, 7, 12][k] + ri(Math.sin(t * 1.2 + k) * 1)); ellipse(x, cx, cy, 4, 5, P.ink); ellipse(x, cx, cy, 3, 4, [P.red0, P.white, P.honey0, P.red1, P.cream0][k]); pset(x, cx - 1, cy - 2, P.white); line(x, cx, cy + 5, X(bx), Y(by + 26), P.slate4); }
  // the stage platform and the couple, a host
  rect(x, X(12), Y(90), 156, 4, P.ink); rect(x, X(12), Y(94), 156, 14, P.ink); rect(x, X(13), Y(91), 154, 3, P.wood4); rect(x, X(13), Y(94), 154, 13, P.red2); for (let k = 16; k < 166; k += 10) vline(x, X(k), Y(95), Y(106), P.red1);
  if (st.couple) { guest(x, X(82), Y(92), { t, seed: 2, stand: true, top: P.dark0, legs: P.dark1, hair: P.hairM0, skin: P.skin1, tie: P.red0, mood: 'smile' }); guest(x, X(97), Y(92), { t, seed: 5, stand: true, top: P.white, dress: P.white, hair: P.hairW0, long: 1, bun: 1, skin: P.skin0, mood: 'smile' }); rect(x, X(100), Y(66), 4, 4, P.ink); pset(x, X(101), Y(67), P.red0); pset(x, X(102), Y(66), P.white); }
  guest(x, X(132), Y(92), { t, seed: 8, stand: true, top: P.slate1, legs: P.dark0, hair: P.hairM1, act: 'mic', tie: P.honey1 });
  // flower stands on either side of the stage
  for (const fx of [8, 172]) { rect(x, X(fx - 1), Y(80), 3, 32, P.ink); pset(x, X(fx), Y(81), P.honey1); for (let k = 0; k < 9; k++) disc(x, X(fx + [-4, 0, 4, -2, 2, -5, 5, 0, -3][k]), Y(74 + [0, -3, 0, 3, 3, 4, 4, 6, -2][k]), 2, [P.white, P.red0, P.cream0, P.brick0][k % 4]); ellipse(x, X(fx), Y(112), 5, 1, P.ink); }
  // ---- banquet carpet
  rect(x, ox, Y(108), SET_W, R.h - 108, '#a8432f');
  for (let y = 112; y < R.h; y += 12) for (let k = (y / 12 % 2) * 8; k < SET_W; k += 16) { const cx = X(k), cy = Y(y); pset(x, cx, cy, '#c45a40'); pset(x, cx - 1, cy + 1, '#8f3626'); pset(x, cx + 1, cy + 1, '#8f3626'); pset(x, cx, cy + 2, '#c45a40'); }
  for (let k = 0; k < 40; k++) { const px = X(70 + hash(k * 3) * 40), py = Y(112 + hash(k * 5) * 70); pset(x, px, py, k % 2 ? P.white : P.brick0); } // petals near the stage
  // ---- rows of round tables, back to front
  roundTable(x, X(28), Y(136), 22, 7, t, 1, { n: 8, cheer: st.cheer });
  roundTable(x, X(152), Y(136), 22, 7, t, 4, { n: 8, cheer: st.cheer });
  roundTable(x, X(90), Y(158), 22, 7, t, 5, { n: 8, cheer: st.cheer, card: true });
  roundTable(x, X(10), Y(188), 24, 8, t, 6, { n: 8, cheer: st.cheer, skip: [5, 6] });
  roundTable(x, X(170), Y(188), 24, 8, t, 3, { n: 8, cheer: st.cheer, skip: [1, 2] });
  // a photographer moving between the rows
  if (st.photographer) { const ph = st.photographer; guest(x, X(ph.x), Y(ph.y), { t, seed: 3, stand: true, top: P.dark1, legs: P.dark0, hair: P.hairM0, act: ph.raise ? 'phone' : '' }); }
  // ---- their table: other friends behind, the two of them, the table, friends with their backs to us
  const tc = { x: 90, y: 222 };
  for (const [gx, k] of [[56, 0], [124, 5]]) { const g = GUESTS[k]; guest(x, X(gx), Y(tc.y + 4), { t, seed: k + 11, top: g[0], hair: g[1], long: g[2], skin: g[3], tie: g[4], act: st.cheer ? ['clap', 'toast'][k % 2] : 'talk' }); }
  for (const [gx, k] of [[66, 6], [114, 2]]) { const g = GUESTS[k]; guest(x, X(gx), Y(tc.y - 2), { t, seed: k + 13, top: g[0], hair: g[1], long: g[2], skin: g[3], tie: g[4], act: st.cheer ? 'clap' : 'eat' }); }
  if (st.people) for (const p of st.people) drawPerson(x, p.who, X(p.x), Y(p.y), { ...p, t });
  { const rx = 46, ry = 14, cx = X(tc.x), cy = Y(tc.y);
    contactShadow(x, cx, cy + ry + 10, rx + 2, 3, 0.35);
    ellipse(x, cx, cy + 7, rx + 1, ry + 1, P.ink); rect(x, cx - rx, cy, rx * 2 + 1, 7, P.ink); ellipse(x, cx, cy + 6, rx, ry, mixHex(P.cream1, P.cream2, 0.5));
    for (let k = -rx + 4; k < rx - 2; k += 5) { const e = ri(ry * Math.sqrt(Math.max(0, 1 - (k * k) / (rx * rx)))); vline(x, cx + k, cy + e, cy + 6 + e, P.cream2); }
    ellipse(x, cx, cy, rx + 1, ry + 1, P.ink); ellipse(x, cx, cy, rx, ry, P.cream0); hline(x, cx - rx + 4, cx + rx - 4, cy - ry + 1, P.white);
    ellipse(x, cx, cy + 1, 20, 6, P.ink); ellipse(x, cx, cy + 1, 19, 5, P.glass2); hline(x, cx - 16, cx + 16, cy - 3, P.white);
    for (const [dx, dy, c] of [[-12, 0, P.brick0], [0, -3, P.leaf1], [12, 0, P.honey1], [-6, 4, P.red0], [7, 4, P.cream2]]) { ellipse(x, cx + dx, cy + 1 + dy, 5, 1, P.ink); ellipse(x, cx + dx, cy + 1 + dy, 4, 0, P.white); hline(x, cx + dx - 2, cx + dx + 2, cy + 1 + dy, c); pset(x, cx + dx, cy + dy, c); }
    rect(x, cx - 1, cy - 10, 3, 9, P.ink); pset(x, cx, cy - 9, P.glass2); for (const [dx, dy, c] of [[-2, -12, P.red0], [1, -13, P.white], [0, -11, P.brick0], [3, -11, P.red1], [-1, -14, P.leaf1], [2, -15, P.white]]) pset(x, cx + dx, cy + dy, c);
    for (const [dx, dy] of [[-34, -6], [-24, -9], [-10, -11], [10, -11], [24, -9], [34, -6], [-38, 4], [38, 4], [-24, 10], [24, 10], [0, 12]]) { rect(x, cx + dx - 2, cy + dy - 1, 4, 2, P.red0); rect(x, cx + dx + 3, cy + dy - 5, 2, 5, P.ink); pset(x, cx + dx + 3, cy + dy - 4, P.glass2); pset(x, cx + dx + 3, cy + dy - 3, P.honey1); }
    block(x, cx + 26, cy - 2, 7, 5, P.white); pset(x, cx + 28, cy - 1, P.red0); text(x, '7', cx + 30, cy - 3, P.red1, FONT.tiny, { align: 'center' });
    rect(x, cx - 30, cy + 4, 6, 4, P.red0); pset(x, cx - 28, cy + 5, P.honey0); // a red envelope
  }
  for (const [gx, k] of [[60, 3], [90, 7], [120, 1]]) { const g = GUESTS[k]; guest(x, X(gx), Y(tc.y + 36), { t, seed: k + 17, view: 'back', top: g[0], hair: g[1], long: g[2], skin: g[3] }); }
  if (st.after) st.after(X, Y);
  // ---- nearest: two more tables, cut by the frame, and a waiter with a tray between them
  roundTable(x, X(28), Y(292), 30, 10, t, 7, { n: 9, cheer: st.cheer, skip: [7, 8, 0] });
  roundTable(x, X(160), Y(296), 30, 10, t, 2, { n: 9, cheer: st.cheer, skip: [3, 4] });
  { const wx = 96 + ri(Math.sin(t * 0.3) * 4); guest(x, X(wx), Y(300), { t, seed: 9, stand: true, top: P.white, legs: P.dark1, hair: P.hairM0, tie: P.dark0 }); rect(x, X(wx + 4), Y(272), 14, 2, P.ink); rect(x, X(wx + 5), Y(271), 12, 1, P.slate5); for (let k = 0; k < 3; k++) { rect(x, X(wx + 6 + k * 4), Y(265), 2, 6, P.ink); pset(x, X(wx + 6 + k * 4), Y(266), P.honey1); } line(x, X(wx + 5), Y(276), X(wx + 9), Y(273), P.ink); }
  // ---- light
  glow(x, X(90), Y(50), 80, 46, P.honey0, 0.22); shade(x, ox, oy, SET_W, R.h, P.honey1, 0.05);
  if (st.flash) shade(x, ox, oy, SET_W, R.h, P.white, st.flash);
}

// ------------------------------------------------------------- the bus stop at dusk
// Shopfronts behind (a convenience store, a bakery, a stairwell door, flats above with AC units
// and laundry), the shelter with its bench, arrival board and route sign, a street tree, bikes,
// a bin; the curb, the road and its crossing; nearest, the far railing in shadow.
function busStopSet(x, R, st, t) {
  const ox = R.x, oy = R.y, X = v => ox + v, Y = v => oy + v, early = st.period === 'early';
  const sky = early ? ['#c9b3a6', '#e0b791', '#efc68f', '#f3d39f'] : ['#7f8597', '#999aa3', '#b0a8a6', '#c4b2a3'];
  sky.forEach((c, i) => rect(x, ox, oy + i * 6, SET_W, 7, c));
  // flats above: two buildings, windows (some lit), AC units, balconies with laundry
  const bA = early ? '#c49a7c' : '#9c8a80', bB = early ? '#b98e70' : '#8a7c76';
  rect(x, ox, Y(14), 92, 98, bA); rect(x, X(92), Y(6), 88, 106, bB); vline(x, X(92), Y(6), Y(111), P.ink);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { const wx = X(6 + c * 22), wy = Y(20 + r * 22); const lit = hash3(r, c, 5) < (early ? 0.25 : 0.45); rect(x, wx, wy, 12, 12, P.ink); rect(x, wx + 1, wy + 1, 10, 10, lit ? P.honey0 : mixHex(sky[1], P.slate2, 0.5)); vline(x, wx + 6, wy + 1, wy + 10, P.ink); if (lit) pset(x, wx + 2, wy + 8, P.honey1); if (hash3(c, r, 9) < 0.5) { block(x, wx + 13, wy + 6, 6, 5, P.mist1); pset(x, wx + 15, wy + 8, P.slate3); } }
  for (let r = 0; r < 4; r++) { const by = Y(14 + r * 24); rect(x, X(96), by + 16, 80, 2, P.ink); for (let k = 0; k < 20; k++) vline(x, X(97 + k * 4), by + 8, by + 16, P.slate2); for (let c = 0; c < 3; c++) { const wx = X(100 + c * 26), lit = hash3(r, c, 13) < (early ? 0.3 : 0.5); rect(x, wx, by, 16, 14, P.ink); rect(x, wx + 1, by + 1, 14, 12, lit ? P.honey0 : mixHex(sky[1], P.slate2, 0.55)); if (lit) rect(x, wx + 2, by + 2, 4, 10, P.honey1); }
    if (r % 2) for (let k = 0; k < 5; k++) { const lx = X(104 + k * 13); rect(x, lx, by + 9, 5, 6 + (k % 2) * 2, [P.cream0, P.blue1, P.brick0, P.white, P.leaf1][(k + r) % 5]); } hline(x, X(98), X(174), by + 9, P.slate1); }
  // the shopfronts at street level
  rect(x, ox, Y(110), SET_W, 44, P.slate1); hline(x, ox, X(179), Y(110), P.ink);
  const shop = (sx, w, sign, sc, lit, name) => {
    rect(x, X(sx), Y(112), w, 10, sc); hline(x, X(sx), X(sx + w - 1), Y(112), mixHex(sc, P.white, 0.3)); text(x, name, X(sx + w / 2), Y(113), P.white, FONT.tiny, { align: 'center' });
    rect(x, X(sx + 2), Y(124), w - 4, 30, P.ink); rect(x, X(sx + 3), Y(125), w - 6, 29, lit ? mixHex(P.honey0, P.cream0, 0.4) : P.slate2);
    if (lit) { for (let k = 0; k < (w - 10) / 6; k++) { rect(x, X(sx + 5 + k * 6), Y(130), 4, 20, mixHex(P.cream1, P.slate4, 0.3)); for (let j = 0; j < 4; j++) pset(x, X(sx + 6 + k * 6), Y(132 + j * 5), [P.red0, P.leaf1, P.blue1, P.honey2][(k + j) % 4]); } }
  };
  shop(0, 58, 0, early ? P.leaf2 : P.leaf3, true, '便利店');
  shop(60, 44, 0, P.brick1, !early, '面包');
  rect(x, X(106), Y(114), 18, 40, P.ink); rect(x, X(107), Y(115), 16, 39, P.slate2); rect(x, X(114), Y(115), 2, 39, P.ink); block(x, X(109), Y(106), 12, 7, P.cream1); // stairwell door
  shop(126, 54, 0, P.slate3, true, '药店'); pset(x, X(176), Y(116), P.leaf0); pset(x, X(176), Y(117), P.leaf0); pset(x, X(175), Y(116), P.leaf0); pset(x, X(177), Y(116), P.leaf0);
  // awning over the bakery, a sandwich board
  for (let k = 0; k < 44; k += 4) shape(x, [[X(60 + k), Y(122)], [X(64 + k), Y(122)], [X(64 + k), Y(128)], [X(60 + k), Y(128)]], k % 8 ? P.cream1 : P.brick1, { outline: false });
  hline(x, X(60), X(103), Y(128), P.ink);
  // ---- sidewalk
  rect(x, ox, Y(154), SET_W, 62, early ? '#b9ab98' : '#8f8c88');
  for (let y = 154; y < 216; y += 8) { hline(x, ox, X(179), Y(y), early ? '#a89a87' : '#7e7b78'); for (let k = (y / 8 % 2) * 8; k < SET_W; k += 16) vline(x, X(k), Y(y), Y(y + 7), early ? '#a89a87' : '#7e7b78'); }
  for (let k = 0; k < 60; k++) pset(x, X(hash(k * 3) * 180), Y(156 + hash(k * 7) * 58), early ? '#c9bba6' : '#9d9a95');
  // street tree in a grated planter
  const tr = { x: 18, y: 196 };
  rect(x, X(tr.x - 10), Y(tr.y - 4), 20, 8, P.ink); rect(x, X(tr.x - 9), Y(tr.y - 3), 18, 6, P.slate1); for (let k = -8; k < 9; k += 3) vline(x, X(tr.x + k), Y(tr.y - 3), Y(tr.y + 2), P.slate3);
  rect(x, X(tr.x - 2), Y(tr.y - 70), 4, 68, P.ink); rect(x, X(tr.x - 1), Y(tr.y - 70), 2, 68, P.wood1); line(x, X(tr.x), Y(tr.y - 46), X(tr.x - 10), Y(tr.y - 60), P.wood0); line(x, X(tr.x), Y(tr.y - 52), X(tr.x + 9), Y(tr.y - 64), P.wood0);
  for (let k = 0; k < 14; k++) { const cx = X(tr.x + Math.cos(k * 2.4) * (6 + (k % 3) * 5)), cy = Y(tr.y - 72 + Math.sin(k * 2.4) * (5 + (k % 3) * 3) + ri(Math.sin(t * 0.8 + k) * 0.6)); ellipse(x, cx, cy, 7, 5, P.ink); ellipse(x, cx, cy, 6, 4, early ? [P.leaf1, P.leaf2, P.honey1][k % 3] : [P.leaf2, P.leaf3, P.olive1][k % 3]); pset(x, cx - 2, cy - 2, early ? P.leaf0 : P.leaf1); }
  // the shelter: roof, posts, back glass with an ad, bench, arrival board
  const sh = { x: 44, w: 92, top: 120, gy: 202 };
  rect(x, X(sh.x + 6), Y(sh.top + 10), sh.w - 12, 50, P.ink); rect(x, X(sh.x + 7), Y(sh.top + 11), sh.w - 14, 48, mixHex(P.glass, sky[2], 0.45));
  shape(x, [[X(sh.x + 10), Y(sh.top + 14)], [X(sh.x + 38), Y(sh.top + 14)], [X(sh.x + 38), Y(sh.top + 52)], [X(sh.x + 10), Y(sh.top + 52)]], P.cream0, { shade: P.cream2, shadeDir: [1, 1], shadeW: 1 });
  rect(x, X(sh.x + 13), Y(sh.top + 18), 22, 18, early ? P.honey1 : P.slate4); ellipse(x, X(sh.x + 24), Y(sh.top + 30), 7, 5, early ? P.brick0 : P.slate2); text(x, '夏', X(sh.x + 24), Y(sh.top + 38), P.red1, FONT.tiny, { align: 'center' }); for (let k = 0; k < 2; k++) hline(x, X(sh.x + 13), X(sh.x + 32 - k * 6), Y(sh.top + 47 + k * 2), P.slate3);
  x.save(); x.globalAlpha = 0.25; poly(x, [[X(sh.x + 44), Y(sh.top + 11)], [X(sh.x + 52), Y(sh.top + 11)], [X(sh.x + 42), Y(sh.top + 58)], [X(sh.x + 34), Y(sh.top + 58)]], P.white); x.restore();
  // the arrival board: route and time (st.clock)
  block(x, X(sh.x + 44), Y(sh.top + 14), 36, 22, P.dark1); text(x, '19路', X(sh.x + 47), Y(sh.top + 15), P.honey1, FONT.tiny);
  text(x, st.clock || '--:--', X(sh.x + 62), Y(sh.top + 25), P.honey0, FONT.tiny, { align: 'center' });
  for (const px of [sh.x + 4, sh.x + sh.w - 6]) { rect(x, X(px), Y(sh.top), 3, sh.gy - sh.top, P.ink); vline(x, X(px + 1), Y(sh.top + 1), Y(sh.gy - 1), P.slate3); }
  shape(x, [[X(sh.x - 2), Y(sh.top - 6)], [X(sh.x + sh.w + 2), Y(sh.top - 6)], [X(sh.x + sh.w + 4), Y(sh.top + 2)], [X(sh.x - 4), Y(sh.top + 2)]], P.slate2, { shade: P.slate1, shadeDir: [0, 1], shadeW: 2, hi: P.slate4, hiDir: [0, -1] });
  if (st.lampOn) { rect(x, X(sh.x + 4), Y(sh.top + 3), sh.w - 8, 1, P.honey0); }
  const bn = { x: sh.x + 44, y: sh.gy - 14 }; rect(x, X(bn.x), Y(bn.y), 40, 4, P.ink); rect(x, X(bn.x + 1), Y(bn.y), 38, 2, P.wood3); hline(x, X(bn.x + 1), X(bn.x + 38), Y(bn.y), P.wood4); for (const lx of [bn.x + 3, bn.x + 35]) rect(x, X(lx), Y(bn.y + 4), 2, 10, P.ink);
  contactShadow(x, X(sh.x + sh.w / 2), Y(sh.gy + 1), sh.w / 2, 2, 0.3);
  // route sign pole and the street lamp
  rect(x, X(146), Y(116), 2, 86, P.ink); block(x, X(140), Y(106), 14, 14, P.leaf2); text(x, '19', X(147), Y(108), P.white, FONT.tiny, { align: 'center' }); block(x, X(140), Y(120), 14, 6, P.cream1);
  rect(x, X(166), Y(84), 3, 118, P.ink); line(x, X(167), Y(84), X(160), Y(78), P.ink); shape(x, [[X(152), Y(76)], [X(164), Y(76)], [X(162), Y(80)], [X(154), Y(80)]], st.lampOn ? P.honey0 : P.slate3, { shade: st.lampOn ? P.honey1 : P.slate2, shadeDir: [0, 1], shadeW: 1 });
  // bikes at a rack, a bin, two bollards
  for (let k = 0; k < 2; k++) { const bx = X(150 + k * 2), by = Y(168 + k * 14); disc(x, bx, by, 4, P.ink); disc(x, bx, by, 3, early ? '#b9ab98' : '#8f8c88'); disc(x, bx + 16, by, 4, P.ink); disc(x, bx + 16, by, 3, early ? '#b9ab98' : '#8f8c88'); line(x, bx, by, bx + 8, by - 6, k ? P.red0 : P.blue1); line(x, bx + 8, by - 6, bx + 16, by, k ? P.red0 : P.blue1); line(x, bx + 4, by - 6, bx + 12, by - 6, k ? P.red0 : P.blue1); line(x, bx + 14, by - 9, bx + 16, by, P.ink); rect(x, bx + 3, by - 8, 4, 1, P.ink); }
  shape(x, [[X(32), Y(176)], [X(40), Y(176)], [X(40), Y(196)], [X(32), Y(196)]], P.leaf3, { shade: P.olive3, shadeDir: [1, 0], shadeW: 2, hi: P.leaf2, hiDir: [-1, 0] }); rect(x, X(31), Y(174), 10, 3, P.ink); contactShadow(x, X(36), Y(197), 6, 1, 0.35);
  for (const bx of [8, 172]) { rect(x, X(bx), Y(204), 4, 10, P.ink); rect(x, X(bx + 1), Y(205), 2, 8, P.slate4); pset(x, X(bx + 1), Y(206), P.honey1); }
  // ---- curb, road, crossing
  rect(x, ox, Y(214), SET_W, 5, P.ink); rect(x, ox, Y(214), SET_W, 3, early ? P.cream2 : P.slate4);
  rect(x, ox, Y(219), SET_W, 78, early ? '#5b5a5f' : P.slate1);
  for (let k = 0; k < 90; k++) pset(x, X(hash(k * 11) * 180), Y(220 + hash(k * 13) * 76), early ? '#67666b' : P.slate2);
  for (let k = 0; k < SET_W; k += 26) rect(x, X(k), Y(257), 14, 2, P.cream2);
  for (let k = 0; k < 6; k++) rect(x, X(150 + k * 0), Y(222 + k * 12), 30, 7, mixHex(P.cream1, P.slate1, 0.2)); // the crossing
  rect(x, X(60), Y(232), 10, 4, P.ink); rect(x, X(61), Y(233), 8, 2, P.slate2); // a drain
  { const yl = early ? '#c9a54a' : '#a58d4a'; for (let k = 0; k < SET_W; k += 8) rect(x, X(k), Y(223), 5, 1, yl); text(x, '公交专用', X(96), Y(236), yl, FONT.small, { align: 'center' }); for (const ax of [22, 128]) { rect(x, X(ax), Y(240), 2, 8, P.cream2); pset(x, X(ax - 1), Y(241), P.cream2); pset(x, X(ax + 2), Y(241), P.cream2); pset(x, X(ax), Y(239), P.cream2); pset(x, X(ax + 1), Y(239), P.cream2); } }
  ellipse(x, X(110), Y(276), 6, 2, P.ink); ellipse(x, X(110), Y(276), 5, 1, P.slate2); hline(x, X(107), X(113), Y(276), P.slate0); // a manhole
  { const sx = X(mod(t * 22, 260) - 40), sy = Y(282); disc(x, sx, sy, 3, P.ink); disc(x, sx + 12, sy, 3, P.ink); rect(x, sx - 1, sy - 5, 14, 3, P.ink); rect(x, sx, sy - 4, 12, 1, early ? P.honey1 : P.red1); rect(x, sx + 4, sy - 14, 5, 9, P.ink); rect(x, sx + 5, sy - 13, 3, 7, P.slate2); disc(x, sx + 6, sy - 17, 3, P.ink); disc(x, sx + 6, sy - 17, 2, P.cream1); rect(x, sx + 10, sy - 9, 2, 4, P.ink); if (st.lampOn) pset(x, sx + 13, sy - 4, P.honey0); } // a scooter going by
  { const cx = 158, cy = 262; contactShadow(x, X(cx + 12), Y(cy + 30), 30, 3, 0.4); shape(x, [[X(cx - 16), Y(cy + 6)], [X(cx - 6), Y(cy - 4)], [X(cx + 26), Y(cy - 4)], [X(cx + 36), Y(cy + 6)], [X(cx + 36), Y(cy + 24)], [X(cx - 16), Y(cy + 24)]], early ? P.honey1 : P.leaf1, { shade: early ? P.honey2 : P.leaf2, shadeDir: [0, 1], shadeW: 4, hi: early ? P.honey0 : P.leaf0, hiDir: [0, -1] }); rect(x, X(cx - 4), Y(cy - 2), 26, 8, P.ink); rect(x, X(cx - 3), Y(cy - 1), 11, 6, mixHex(P.glass, P.slate2, 0.4)); rect(x, X(cx + 10), Y(cy - 1), 11, 6, mixHex(P.glass, P.slate2, 0.4)); block(x, X(cx + 4), Y(cy - 8), 10, 5, P.cream1); text(x, 'TAXI', X(cx + 9), Y(cy - 9), P.ink, FONT.tiny, { align: 'center' }); for (const wx of [cx - 6, cx + 26]) { disc(x, X(wx), Y(cy + 25), 4, P.ink); disc(x, X(wx), Y(cy + 25), 2, P.slate3); } pset(x, X(cx - 15), Y(cy + 12), st.lampOn ? P.honey0 : P.cream1); } // a parked taxi
  if (st.lampOn) { glow(x, X(158), Y(208), 30, 8, P.honey0, 0.45); glow(x, X(90), Y(205), 50, 6, P.honey0, 0.25); }
  // ---- people, then the bus in front of them
  if (st.people) for (const p of st.people) { shadowAt(x, X(p.x), Y(p.y)); drawPerson(x, p.who, X(p.x), Y(p.y), { ...p, t }); }
  if (st.bus !== undefined) { const bx = X(st.bus), by = Y(214);
    contactShadow(x, bx - 60, by + 50, 62, 4, 0.4);
    shape(x, [[bx - 124, by - 8], [bx, by - 8], [bx + 2, by + 44], [bx - 124, by + 44]], P.cream1, { shade: P.cream3, shadeDir: [0, 1], shadeW: 4, hi: P.white, hiDir: [0, -1] });
    rect(x, bx - 123, by + 22, 124, 6, P.leaf2); for (let k = 0; k < 6; k++) { rect(x, bx - 118 + k * 19, by - 2, 16, 18, P.ink); rect(x, bx - 117 + k * 19, by - 1, 14, 16, st.lampOn ? mixHex(P.honey0, P.slate3, 0.4) : P.slate3); if (hash(k + 4) < 0.5) disc(x, bx - 110 + k * 19, by + 8, 2, P.slate1); }
    rect(x, bx - 6, by - 4, 6, 10, P.dark1); text(x, '19', bx - 3, by - 4, P.honey0, FONT.tiny, { align: 'center' });
    for (const wx of [bx - 100, bx - 22]) { disc(x, wx, by + 44, 6, P.ink); disc(x, wx, by + 44, 3, P.slate3); } pset(x, bx + 1, by + 34, P.honey0); }
  if (st.after) st.after(X, Y);
  // ---- nearest: the far curb and a railing in shadow, a planting strip
  rect(x, ox, Y(297), SET_W, 23, P.ink); rect(x, ox, Y(298), SET_W, 3, mixHex(P.slate4, P.ink, 0.4)); rect(x, ox, Y(301), SET_W, 19, mixHex(P.leaf3, P.ink, 0.5));
  for (let k = 0; k < SET_W; k += 4) { pset(x, X(k + 1), Y(301), mixHex(P.leaf2, P.ink, 0.4)); pset(x, X(k + 2), Y(300), mixHex(P.leaf1, P.ink, 0.5)); }
  rect(x, ox, Y(286), SET_W, 3, P.ink); for (let k = 4; k < SET_W; k += 22) rect(x, X(k), Y(286), 3, 14, P.ink);
  // ---- grade
  shade(x, ox, oy, SET_W, R.h, early ? P.honey1 : P.slate2, early ? 0.06 : 0.14);
}
