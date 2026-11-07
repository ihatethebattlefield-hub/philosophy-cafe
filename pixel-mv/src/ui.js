'use strict';
/*
 * Game interface. Two visual languages: cream boards with a dark-brown notched
 * border (dialogue, items, menus — the lyric bar is one of these), and dark
 * night-blue panels for the always-on two-player HUD and phone screens.
 * Every function draws what it is given and keeps no state.
 */
function panel(x, px, py, w, h, o = {}) {
  px = ri(px); py = ri(py); w = ri(w); h = ri(h);
  const fill = o.fill || P.cream0, edge = o.edge || P.brown1;
  rect(x, px + 2, py, w - 4, h, P.ink); rect(x, px, py + 2, w, h - 4, P.ink); rect(x, px + 1, py + 1, w - 2, h - 2, P.ink);
  rect(x, px + 2, py + 1, w - 4, h - 2, edge); rect(x, px + 1, py + 2, w - 2, h - 4, edge);
  rect(x, px + 3, py + 3, w - 6, h - 6, fill);
  hline(x, px + 3, px + w - 4, py + 3, o.hi || P.white);
  hline(x, px + 3, px + w - 4, py + h - 4, o.shade || P.cream1);
  if (o.title) {
    const tw = textWidth(o.title, FONT.small) + 12;
    rect(x, px + 8, py - 6, tw, 13, P.ink); rect(x, px + 9, py - 5, tw - 2, 11, o.titleCol || P.brown1);
    text(x, o.title, px + 14, py - 5, P.cream0, FONT.small);
  }
}
function darkPanel(x, px, py, w, h, o = {}) { panel(x, px, py, w, h, { fill: o.fill || P.night1, edge: o.edge || P.night4, hi: P.night3, shade: P.night0, ...o }); }
// Panels open by whole pixels over a few frames, never with a smooth scale.
const opening = (u, d0 = 0.2) => clamp(u / d0);
function cursor(x, px, py, t, col = P.coral1) {
  if (mod(t, 0.8) > 0.55) return;
  for (let k = 0; k < 4; k++) vline(x, px + k, py + k, py + 6 - k, col);
}
function checkbox(x, px, py, done, col = P.coral0) {
  rect(x, px, py, 9, 9, P.ink); rect(x, px + 1, py + 1, 7, 7, done ? col : P.night2);
  if (done) { pset(x, px + 2, py + 4, P.white); pset(x, px + 3, py + 5, P.white); pset(x, px + 4, py + 6, P.white); pset(x, px + 5, py + 5, P.white); pset(x, px + 6, py + 4, P.white); pset(x, px + 7, py + 3, P.white); }
}
function chip(x, label, px, py, bg, fg = P.white, f = FONT.small) {
  const w = textWidth(label, f) + 6; rect(x, px, py, w, f.size + 2, P.ink); rect(x, px + 1, py + 1, w - 2, f.size, bg); text(x, label, px + 3, py + 1, fg, f); return w;
}

// ------------------------------------------------------------- HUD (always on)
// Two players: where each is and the local time there; the distance between
// them; the main quest. st = { A:{place, clock, wx}, B:{...}, km, quest, done, together }
function weatherIcon(x, px, py, kind) {
  if (kind === 'rain') { cloud(x, px + 5, py + 4, 9, P.stone4); for (let k = 0; k < 3; k++) { pset(x, px + 2 + k * 3, py + 8, P.rain); pset(x, px + 1 + k * 3, py + 9, P.rain); } }
  else if (kind === 'sun') { ellipse(x, px + 4, py + 4, 2, 2, P.amber2); for (const [dx, dy] of [[0, -4], [0, 4], [-4, 0], [4, 0]]) pset(x, px + 4 + dx, py + 4 + dy, P.amber2); }
  else if (kind === 'moon') { ellipse(x, px + 4, py + 4, 3, 3, P.cream1); ellipse(x, px + 6, py + 3, 2, 2, P.night1); }
  else if (kind === 'dusk') { ellipse(x, px + 4, py + 6, 3, 2, P.dusk3); hline(x, px, px + 8, py + 8, P.dusk2); }
}
function hud(x, st, t) {
  rect(x, 0, 0, LW, HUD_H, P.void); hline(x, 0, LW, HUD_H - 1, P.night2);
  if (st.together) {
    darkPanel(x, 3, 3, LW - 6, 24);
    for (const [who, px] of [['A', 8], ['B', 26]]) { rect(x, px - 1, 6, 18, 18, P.ink); rect(x, px, 7, 16, 16, who === 'A' ? P.blue1 : P.coral2); blit(x, `${who}_head_front_smile`, px + 1, 8); }
    text(x, `1P 阿屿 ＆ 2P 小晴 · ${st.A.place}`, 48, 5, P.cream0, FONT.small);
    text(x, `同一时间 ${st.A.clock}`, 48, 15, P.amber2, FONT.small);
    weatherIcon(x, LW - 18, 9, st.A.wx);
  } else for (const who of ['A', 'B']) {
    const px = who === 'A' ? 3 : 137, s = st[who], w = 130;
    darkPanel(x, px, 3, w, 24);
    rect(x, px + 4, 6, 18, 18, P.ink); rect(x, px + 5, 7, 16, 16, who === 'A' ? P.blue1 : P.coral2);
    blit(x, `${who}_head_front`, px + 6, 8);
    chip(x, who === 'A' ? '1P' : '2P', px + 25, 5, who === 'A' ? P.blue0 : P.coral1, P.white, FONT.tiny);
    text(x, `${WORLD[who].name}·${s.place}`, px + 41, 5, P.cream0, FONT.small);
    text(x, s.clock, px + 25, 15, who === 'A' ? P.blue3 : P.coral3, FONT.small);
    weatherIcon(x, px + w - 15, 10, s.wx);
    if (s.typing && mod(t * 3, 1) < 0.7) for (let k = 0; k < 3; k++) if (mod(t * 3 - k * 0.25, 1) < 0.6) rect(x, px + 62 + k * 4, 19, 2, 2, P.cream1);
    if (s.note) text(x, s.note, px + 58, 15, P.stone4, FONT.small);
  }
  // quest + distance row
  checkbox(x, 6, 29, st.done);
  text(x, `主线 · ${st.quest || '再见一面'}`, 18, 28, st.done ? P.amber2 : P.cream1, FONT.small);
  const dist = st.km === undefined ? '' : st.km >= 1 ? `距离 ${Math.round(st.km)} km` : `距离 ${(st.km * 1000).toFixed(1)} m`;
  if (dist) { const w = textWidth(dist, FONT.small); text(x, dist, LW - 6 - w, 28, st.km < 0.001 ? P.coral3 : P.amber2, FONT.small); }
}

// ------------------------------------------------------------- lyric bar
// Fixed cream dialogue box at the bottom. Lines come from data/lyrics.js only.
// With per-character times, sung characters turn coral exactly at their times.
const LYRIC_BAR = { x: 8, y: 424, w: 254, h: 38 };
function lyricBand(x, t, open = 1) {
  rect(x, 0, PIC.y + PIC.h, LW, LH - PIC.y - PIC.h, P.void);
  hline(x, 0, LW, PIC.y + PIC.h, P.night2);
  // song progress, like a save-file playtime bar
  const prog = clamp(t / SONG.duration);
  rect(x, 16, 471, LW - 32, 1, P.night2); rect(x, 16, 471, ri((LW - 32) * prog), 1, P.coral2);
  if (open <= 0) { text(x, '♪', LW / 2, 437, P.night4, FONT.ui, { align: 'center' }); return; }
  const B = LYRIC_BAR, yOff = ri((1 - E.out(open)) * 50);
  panel(x, B.x, B.y + yOff, B.w, B.h, { fill: P.cream0 });
  const L = (window.LYRICS && window.LYRICS.lines) || [];
  const ln = L.find(l => t >= l.start - 0.12 && t < l.end + 0.25);
  if (!ln) return;
  if (t < ln.start - 0.08 || t > ln.end + 0.2) return; // clean cuts between phrases
  const y = B.y + yOff + 13;
  text(x, '♪', B.x + 12, y - (ln.words ? 0 : (mod(t - ln.start, 0.5) < 0.25 ? 1 : 0)), P.coral1, FONT.ui);
  const colors = [...ln.text].map((ch, k) => { const w = ln.words && ln.words[k]; return !w ? P.brown0 : t >= w.t ? P.coral1 : P.brown0; });
  text(x, ln.text, B.x + B.w / 2 + 6, y, null, FONT.ui, { align: 'center', colors, spacing: 1 });
}

// ------------------------------------------------------------- toasts / item get
function toast(x, u, d, item, py = PIC.y + 8) {
  if (u < 0 || u > d) return;
  const k = Math.min(opening(u, 0.2), opening(d - u, 0.2));
  if (k < 1 && Math.floor(u * 30) % 2) return;
  const w = 200, px = ri((LW - w) / 2), y = ri(py - (1 - k) * 10);
  panel(x, px, y, w, 34);
  rect(x, px + 5, y + 5, 24, 24, P.ink); rect(x, px + 6, y + 6, 22, 22, P.cream1);
  const s = SPR.get(item.icon); blit(x, item.icon, px + 17 - s.w, y + 17 - s.h, { scale: 2 });
  text(x, `收到 · ${item.name}`, px + 34, y + 5, P.brown0, FONT.ui);
  text(x, item.note, px + 34, y + 19, P.brown2, FONT.small);
}
// A small quest notice, ref. "任务更新".
function questNotice(x, u, d, title, line, done) {
  if (u < 0 || u > d) return;
  const k = Math.min(opening(u, 0.2), opening(d - u, 0.2));
  if (k < 1 && Math.floor(u * 30) % 2) return;
  const w = 190, px = LW - w - 6, y = PIC.y + 8;
  darkPanel(x, px, y, w, 36, { edge: P.amber0 });
  chip(x, done ? '任务完成' : '任务更新', px + 6, y + 5, done ? P.coral1 : P.amber0, P.white, FONT.tiny);
  text(x, title, px + 6, y + 18, P.cream0, FONT.ui);
  if (line) text(x, line, px + w - 8, y + 6, P.amber2, FONT.small, { align: 'right' });
  checkbox(x, px + w - 16, y + 20, done);
}
function statBar(x, px, py, w, label, v, col, t) { // e.g. 思念 0..1
  darkPanel(x, px, py, w, 24);
  text(x, label, px + 6, py + 6, P.cream0, FONT.small);
  const bx = px + 8 + textWidth(label, FONT.small) + 4, bw = w - (bx - px) - 30;
  rect(x, bx, py + 9, bw, 6, P.ink); rect(x, bx + 1, py + 10, ri((bw - 2) * clamp(v)), 4, col);
  text(x, `${Math.round(v * 100)}%`, px + w - 6, py + 6, col, FONT.small, { align: 'right' });
}
// Dashed line between two people with the distance on it (feet height y).
function distanceTag(x, x1, x2, y, label, t) {
  const a = Math.min(x1, x2), b = Math.max(x1, x2);
  for (let k = a; k <= b; k++) if (mod(k - ri(t * 8), 4) < 2) pset(x, k, y, P.cream0);
  vline(x, a, y - 2, y + 2, P.cream0); vline(x, b, y - 2, y + 2, P.cream0);
  const w = textWidth(label, FONT.small) + 6, cx = ri((a + b) / 2);
  rect(x, cx - w / 2, y - 14, w, 12, P.ink); text(x, label, cx, y - 13, P.cream0, FONT.small, { align: 'center' });
}

// ------------------------------------------------------------- phone & chat
// A phone held in hand (screen coords). msgs: [{from:'A'|'B', text, at}] drawn
// bottom-up; o.draft = text being typed; o.sent = toast; o.who = whose phone.
function phoneScreen(x, px, py, w, h, o, t) {
  const who = o.who;
  rect(x, px - 4, py - 10, w + 8, h + 22, P.ink); rect(x, px - 3, py - 9, w + 6, h + 20, P.stone0);
  rect(x, px + w / 2 - 8, py - 6, 16, 2, P.stone1);
  rect(x, px, py, w, h, P.night1);
  // header with the other person's avatar
  const other = who === 'A' ? 'B' : 'A';
  rect(x, px, py, w, 20, P.night2); rect(x, px + 3, py + 2, 16, 16, other === 'A' ? P.blue1 : P.coral2);
  clip(x, { x: px + 3, y: py + 2, w: 16, h: 16 }, () => blit(x, `${other}_head_front`, px + 4, py + 3));
  text(x, WORLD[other].name, px + 23, py + 1, P.cream0, FONT.small);
  text(x, o.status || (o.typingOther ? '正在输入…' : '在线'), px + 23, py + 10, o.typingOther ? P.amber2 : P.green2, FONT.tiny);
  // messages, newest at the bottom
  const area = { x: px, y: py + 21, w, h: h - 42 };
  clip(x, area, () => {
    let y = area.y + area.h - 4;
    const shown = (o.msgs || []).filter(m => m.at === undefined || t >= m.at).reverse();
    for (const m of shown) {
      const mine = m.from === who, lines = wrapChars(m.text, Math.floor((w - 30) / 10));
      const bw = Math.max(...lines.map(s => textWidth(s, FONT.small))) + 10, bh = lines.length * 11 + 6;
      y -= bh; const bx = mine ? px + w - bw - 4 : px + 4;
      const pop = m.at !== undefined && t - m.at < 0.12 ? 1 : 0;
      rect(x, bx, y + pop, bw, bh, P.ink); rect(x, bx + 1, y + 1 + pop, bw - 2, bh - 2, mine ? (who === 'A' ? P.blue1 : P.coral1) : P.cream0);
      lines.forEach((s, i) => text(x, s, bx + 5, y + 3 + i * 11 + pop, mine ? P.white : P.brown0, FONT.small));
      if (m.read && mine) text(x, '已读', bx - 3, y + bh - 9, P.stone3, FONT.tiny, { align: 'right' });
      y -= 5;
    }
  });
  // input field
  rect(x, px + 3, py + h - 18, w - 30, 15, P.ink); rect(x, px + 4, py + h - 17, w - 32, 13, P.night0);
  if (o.draft) { text(x, o.draft, px + 7, py + h - 16, P.cream0, FONT.small); if (mod(t, 0.8) < 0.5) rect(x, px + 8 + textWidth(o.draft, FONT.small), py + h - 15, 1, 9, P.cream0); }
  else text(x, '发消息…', px + 7, py + h - 16, P.stone2, FONT.small);
  rect(x, px + w - 25, py + h - 18, 22, 15, P.ink); rect(x, px + w - 24, py + h - 17, 20, 13, o.pressSend ? P.amber2 : (who === 'A' ? P.blue0 : P.coral0));
  text(x, '发送', px + w - 14, py + h - 16, P.white, FONT.small, { align: 'center' });
}
function wrapChars(s, n) { const c = [...s], out = []; for (let i = 0; i < c.length; i += n) out.push(c.slice(i, i + n).join('')); return out.length ? out : ['']; }
// The typed-so-far prefix of a string, one character per `cps`-th of a second.
function typed(s, t, t0, cps = 9) { const n = Math.max(0, Math.floor((t - t0) * cps)); return [...s].slice(0, n).join(''); }
// A chat bubble travelling between two points (a message on its way).
function flyingBubble(x, x0, y0, x1, y1, u, who) {
  if (u <= 0 || u >= 1) return;
  const e = E.inOut(u), px = lerp(x0, x1, e), py = lerp(y0, y1, e) - Math.sin(u * Math.PI) * 16;
  rect(x, px - 8, py - 6, 16, 11, P.ink); rect(x, px - 7, py - 5, 14, 9, who === 'A' ? P.blue1 : P.coral1);
  for (let k = 0; k < 3; k++) pset(x, px - 4 + k * 4, py - 1, P.white);
  rect(x, px + (who === 'A' ? 4 : -6), py + 5, 2, 2, P.ink);
  for (let k = 1; k < 4; k++) { const v = u - k * 0.05; if (v > 0) pset(x, lerp(x0, x1, E.inOut(v)), lerp(y0, y1, E.inOut(v)) - Math.sin(v * Math.PI) * 16, P.cream1); }
}

// ------------------------------------------------------------- video call
// The other person's face, shown as their head sprite at 4× on a phone screen
// (a screen inside the picture, so the larger pixels read as a display).
function callScreen(x, px, py, w, h, who, o, t) {
  darkPanel(x, px, py, w, h);
  const vx = px + 5, vy = py + 5, vw = w - 10, vh = h - 26;
  clip(x, { x: vx, y: vy, w: vw, h: vh }, () => {
    const view = o.view || 'dusk';
    skyBands(x, vx, vy, vw, vh, view);
    if (view === 'night') stars(x, vx, vy, vw, vh * 0.5, t, 10, 4);
    const z = canvas(18, 34), blink = !o.frozen && mod(t + 1.3, 3.6) < 0.13;
    drawChar(z.x, who, 9, 32, { dir: 'front', t: o.frozen || t, face: o.face || (blink ? 'blink' : ''), pose: o.pose, still: !!o.frozen });
    const sc = 4, sx = vx + vw / 2 - 9 * sc, sy = vy + vh - 26 * sc + ri(o.frozen ? 0 : (mod(t, 3) < 1.5 ? 0 : 1));
    blit(x, z, sx, sy, { scale: sc });
    if (o.frozen) {
      const g = o.glitch || 0;
      for (let y = vy; y < vy + vh; y += 2) if (hash2(y, Math.floor(t * 12)) < 0.25 * g + 0.08) { const sh = ri((hash2(y, Math.floor(t * 20)) - 0.5) * 16 * g); x.drawImage(x.canvas, vx, y, vw, 1, vx + sh, y, vw, 1); }
      shade(x, vx, vy, vw, vh, P.night0, 0.25 + 0.25 * g);
      if (mod(t, 0.9) < 0.6) { rect(x, vx + vw / 2 - 30, vy + vh / 2 - 8, 60, 16, P.ink); text(x, o.frozenLabel || '连接中断', vx + vw / 2, vy + vh / 2 - 6, P.coral0, FONT.ui, { align: 'center' }); }
    }
  });
  text(x, o.label || '', px + 8, py + h - 18, P.cream0, FONT.small);
  if (o.timer) text(x, o.timer, px + w - 8, py + h - 18, P.green2, FONT.small, { align: 'right' });
}

// ------------------------------------------------------------- inventory, choice
function inventory(x, px, py, w, items, sel, t, o = {}) {
  const h = o.h || 132;
  panel(x, px, py, w, h, { title: o.title || '背包' });
  const n = 5, cell = Math.floor((w - 16) / n);
  for (let k = 0; k < n; k++) {
    const cx = px + 8 + k * cell, cy = py + 12, it = items[k];
    rect(x, cx, cy, cell - 4, cell - 4, P.ink); rect(x, cx + 1, cy + 1, cell - 6, cell - 6, k === sel ? P.amber3 : P.cream1);
    if (k === sel) { rect(x, cx - 1, cy - 1, cell - 2, 1, P.coral1); rect(x, cx - 1, cy + cell - 4, cell - 2, 1, P.coral1); }
    if (it) { const s = SPR.get(it.icon); blit(x, it.icon, cx + (cell - 4) / 2 - s.w, cy + (cell - 4) / 2 - s.h, { scale: 2 }); if (it.void) { line(x, cx + 3, cy + 3, cx + cell - 8, cy + cell - 8, P.coral1); } }
  }
  const it = items[sel];
  if (it) {
    const ty = py + 18 + cell;
    text(x, it.name, px + 10, ty, P.brown0, FONT.ui);
    text(x, it.note, px + 10, ty + 16, P.brown2, FONT.small);
    text(x, `来自：${it.from}`, px + 10, ty + 30, P.stone2, FONT.small);
    if (it.used) text(x, it.used, px + 10, ty + 44, P.coral1, FONT.small);
  }
}
function choice(x, px, py, opts, sel, t, o = {}) {
  const w = o.w || 120, h = 12 + opts.length * 17;
  panel(x, px, py, w, h, { title: o.title });
  opts.forEach((s, i) => {
    text(x, s, px + 22, py + 7 + i * 17, i === sel ? P.coral1 : P.brown0, FONT.ui);
    if (i === sel) cursor(x, px + 10, py + 10 + i * 17, t);
  });
}

// ------------------------------------------------------------- big props for close-ups
function departureBoard(x, cx, cy, t, cancelled) {
  const w = 236, h = 116, X = ri(cx - w / 2), Y = ri(cy - h / 2);
  rect(x, X - 3, Y - 3, w + 6, h + 6, P.stone1); rect(x, X - 2, Y - 2, w + 4, h + 4, P.ink); rect(x, X, Y, w, h, P.void);
  text(x, '出发  DEPARTURES', X + 8, Y + 6, P.amber2, FONT.ui);
  hline(x, X + 6, X + w - 7, Y + 22, P.night3);
  const rows = [['21:40', '雾港北 → 渡口', '准点'], ['22:15', '渡轮 → 风见站', cancelled ? '停航' : '准点'], ['23:05', '雾港北 → 山线', '准点'], ['23:50', '山线 → 风见站', '准点']];
  rows.forEach((r, i) => {
    const y = Y + 28 + i * 21, bad = r[2] === '停航';
    text(x, r[0], X + 8, y, P.amber1, FONT.ui);
    text(x, r[1], X + 52, y, bad ? P.coral3 : P.amber1, FONT.ui);
    if (!bad || mod(t, 0.7) < 0.45) text(x, r[2], X + w - 8, y, bad ? P.coral0 : P.green2, FONT.ui, { align: 'right' });
  });
  for (let y = Y; y < Y + h; y += 2) shade(x, X, y, w, 1, P.void, 0.25);
}
// Two pages of the same novel, with the shared line underlined.
function bookSpread(x, cx, cy, warm, pageL, pageR, under, ulProg = 1) {
  const w = 230, h = 150, X = ri(cx - w / 2), Y = ri(cy - h / 2);
  rect(x, X - 5, Y + 3, w + 10, h + 2, P.ink); rect(x, X - 4, Y + 4, w + 8, h, warm ? P.coral2 : P.blue2);
  const paper = warm ? P.cream0 : P.cream1, lineC = warm ? P.cream2 : P.stone4;
  block(x, X, Y, w / 2, h, paper); block(x, X + w / 2, Y, w / 2, h, paper);
  rect(x, X + w / 2 - 6, Y + 1, 6, h - 2, P.cream1); rect(x, X + w / 2, Y + 1, 4, h - 2, P.cream1); vline(x, X + w / 2, Y + 1, Y + h - 2, P.cream2);
  for (const side of [0, 1]) for (let r = 0; r < 11; r++) {
    const lx = X + 10 + side * (w / 2), ly = Y + 14 + r * 11, lw = (r === 10 ? 50 : 92) - ((r * 7 + side * 3) % 11);
    for (let k = 0; k < lw; k += 3) if (hash3(r, k, side) > 0.2) rect(x, lx + k, ly, 2, 2, lineC);
  }
  text(x, String(pageL), X + 10, Y + h - 13, P.stone2, FONT.tiny);
  text(x, String(pageR), X + w - 10, Y + h - 13, P.stone2, FONT.tiny, { align: 'right' });
  if (under !== undefined) hline(x, X + w / 2 + 10, X + w / 2 + 10 + ri(84 * clamp(ulProg)), Y + 14 + under * 11 + 3, P.coral1);
  return { X, Y, w, h };
}
// A music card on a phone: album art, title, progress.
function musicCard(x, px, py, w, prog, playing, t) {
  darkPanel(x, px, py, w, 64);
  rect(x, px + 6, py + 6, 52, 52, P.ink); skyBands(x, px + 7, py + 7, 50, 50, 'dusk'); ellipse(x, px + 32, py + 40, 8, 8, P.amber2); for (let k = 0; k < 50; k += 2) pset(x, px + 7 + k, py + 47 + ri(Math.sin(k * 0.4) * 2), P.dusk0); rect(x, px + 7, py + 48, 50, 9, P.dusk0);
  text(x, '他分享的歌', px + 66, py + 7, P.cream0, FONT.ui);
  text(x, '来自 阿屿 · 雨天适合听', px + 66, py + 23, P.stone4, FONT.small);
  rect(x, px + 66, py + 44, w - 76, 3, P.night3); rect(x, px + 66, py + 44, ri((w - 76) * prog), 3, P.coral0); rect(x, px + 65 + ri((w - 76) * prog), py + 42, 3, 7, P.cream0);
  if (playing) for (let k = 0; k < 5; k++) { const hh = 2 + ri((Math.sin(t * 9 + k * 1.7) + 1) * 3); rect(x, px + w - 32 + k * 4, py + 36 - hh, 2, hh, P.coral0); }
}
// A polaroid that develops: blank → image over `dev` (0..1).
function polaroid(x, cx, cy, dev, t, rot = 0) {
  const w = 92, h = 108, X = ri(cx - w / 2), Y = ri(cy - h / 2);
  rect(x, X + 3, Y + 3, w, h, P.ink); block(x, X, Y, w, h, P.white);
  const ix = X + 7, iy = Y + 7, iw = w - 14, ih = 78;
  rect(x, ix, iy, iw, ih, P.night2);
  if (dev > 0) {
    x.save(); x.globalAlpha = clamp(dev); clip(x, { x: ix, y: iy, w: iw, h: ih }, () => street(x, { x: ix, y: iy, w: iw, h: ih }, { time: 'dusk', camX: 4 }, 0)); x.restore();
  }
  rect(x, ix, iy, iw, 1, P.ink);
  text(x, '18:02 · 晴天小铺', X + w / 2, Y + h - 20, P.brown1, FONT.tiny, { align: 'center' });
}

// ------------------------------------------------------------- title, save menu, results
function titleCard(x, a, t) {
  const y = 150;
  text(x, '多远都要在一起', LW / 2, y, P.cream0, FONT.title, { align: 'center', shadow: P.coral2 });
  text(x, '双人存档 · TWO CITIES, ONE SAVE', LW / 2, y + 34, P.amber2, FONT.small, { align: 'center' });
  if (a > 0.5) text(x, '邓紫棋 G.E.M. · 原创像素叙事 MV', LW / 2, y + 52, P.stone3, FONT.small, { align: 'center' });
}
function saveMenu(x, px, py, sel, t, pressed) {
  darkPanel(x, px, py, LW - 2 * px, 132, { title: '读取存档', titleCol: P.night4 });
  const slots = [['存档 1', 'A', '阿屿的说法「她在很远的地方」', '雾港 · 相识第 214 天'], ['存档 2', 'B', '小晴的说法「他在很远的地方」', '晴川 · 相识第 214 天']];
  slots.forEach((s, i) => {
    const y = py + 14 + i * 40, on = i === sel || sel === 2;
    rect(x, px + 8, y, LW - 2 * px - 16, 36, on ? P.night3 : P.night2);
    if (on && pressed && mod(t, 0.1) < 0.05) rect(x, px + 8, y, LW - 2 * px - 16, 36, P.amber1);
    rect(x, px + 12, y + 4, 28, 28, P.ink); rect(x, px + 13, y + 5, 26, 26, s[1] === 'A' ? P.blue1 : P.coral2); blit(x, `${s[1]}_head_front`, px + 19, y + 10);
    chip(x, s[0], px + 46, y + 3, s[1] === 'A' ? P.blue0 : P.coral1, P.white, FONT.tiny);
    text(x, s[2], px + 46, y + 14, P.cream0, FONT.small);
    text(x, s[3], px + 46, y + 25, P.stone3, FONT.tiny);
  });
  const y = py + 98;
  text(x, '▶ 继续双人存档', px + 20, y + 4, sel === 2 ? P.amber2 : P.stone3, FONT.ui);
  if (sel === 2) cursor(x, px + 12, y + 7, t, P.amber2);
}
function resultsCard(x, py, rows, k, t, stamp) {
  const px = 18, w = LW - 36;
  darkPanel(x, px, py, w, 200, { title: '结算 · 双人存档', titleCol: P.coral2 });
  rows.forEach((r, i) => {
    if (k < i * 0.12) return;
    const y = py + 16 + i * 20;
    text(x, r[0], px + 12, y, P.stone4, FONT.ui);
    text(x, r[1], px + w - 12, y, r[2] || P.cream0, FONT.ui, { align: 'right' });
    for (let j = px + 12 + textWidth(r[0], FONT.ui) + 4; j < px + w - 16 - textWidth(r[1], FONT.ui); j += 3) pset(x, j, y + 9, P.night3);
  });
  if (stamp > 0) { // the stamp lands: drawn big, then at its size (whole-number scales only)
    const sc = stamp < 0.07 ? 3 : stamp < 0.14 ? 2 : 1, g = buf('stamp', 90, 36);
    g.x.clearRect(0, 0, 90, 36); rect(g.x, 0, 0, 90, 36, P.coral1); rect(g.x, 2, 2, 86, 32, P.night1); rect(g.x, 4, 4, 82, 28, P.coral1);
    text(g.x, '在一起', 45, 6, P.night0, FONT.title, { align: 'center' });
    const cx = px + w - 60, cy = py + 160;
    x.imageSmoothingEnabled = false; x.drawImage(g.c, ri(cx - 45 * sc), ri(cy - 18 * sc), 90 * sc, 36 * sc);
  }
}
