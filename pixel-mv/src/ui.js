'use strict';
/*
 * Game interface. One visual language for every panel: cream board, dark-brown
 * pixel border with notched corners, small icons, a blinking cursor.
 * Panels are opened by story beats in story.js; each returns nothing and keeps
 * no state — what they show is passed in.
 */
function panel(x, px, py, w, h, o = {}) {
  px = ri(px); py = ri(py); w = ri(w); h = ri(h);
  const fill = o.fill || P.cream0, edge = o.edge || P.brown1;
  rect(x, px + 2, py, w - 4, h, P.ink); rect(x, px, py + 2, w, h - 4, P.ink); rect(x, px + 1, py + 1, w - 2, h - 2, P.ink);
  rect(x, px + 2, py + 1, w - 4, h - 2, edge); rect(x, px + 1, py + 2, w - 2, h - 4, edge);
  rect(x, px + 3, py + 3, w - 6, h - 6, fill);
  hline(x, px + 3, px + w - 4, py + 3, P.white);
  hline(x, px + 3, px + w - 4, py + h - 4, o.shade || P.cream1);
  if (o.title) {
    const tw = textWidth(o.title) + 14;
    rect(x, px + 8, py - 7, tw, 14, P.ink); rect(x, px + 9, py - 6, tw - 2, 12, P.brown1);
    text(x, o.title, px + 15, py - 6, P.cream0);
  }
}
// Open/close animation: panels drop in by whole pixels, never scale smoothly.
function panelOpen(u, d0 = 0.18) { return clamp(u / d0); }
function cursor(x, px, py, t, col = P.coral1) {
  if (mod(t, 0.8) > 0.55) return;
  for (let k = 0; k < 4; k++) vline(x, px + k, py + k, py + 6 - k, col);
}
function icon(x, name, px, py, scale = 2) { blit(x, name, px, py, { scale }); }

// ------------------------------------------------------------- lyric bar
// Fixed retro dialogue box at the bottom. Lines come from data/lyrics.js only.
// If the line carries per-character times, sung characters are highlighted
// coral exactly at their timestamps; with line-level timing the whole line is
// shown and only the ♪ marker pulses — no faked per-character progress.
const LYRIC_BAR = { x: 12, y: 566, w: 336, h: 46 };
function lyricBar(x, t, open = 1) {
  if (open <= 0) return;
  const B = LYRIC_BAR, yOff = ri((1 - E.out(open)) * 60);
  panel(x, B.x, B.y + yOff, B.w, B.h, { fill: P.cream0 });
  const L = (window.LYRICS && window.LYRICS.lines) || [];
  const ln = L.find(l => t >= l.start - 0.12 && t < l.end + 0.25);
  if (!ln) return;
  const placeholder = window.LYRICS.placeholder;
  const lines = wrapLyric(ln.text, 24);
  const fade = clamp((t - ln.start + 0.12) / 0.12) * clamp((ln.end + 0.25 - t) / 0.12);
  if (fade < 0.5) return; // lines cut cleanly between phrases (no translucency on pixel text)
  const baseY = B.y + yOff + (lines.length === 1 ? 16 : 8);
  // ♪ marker
  const pulse = ln.words ? 0 : (mod(t - ln.start, 0.5) < 0.25 ? 1 : 0);
  text(x, '♪', B.x + 12, baseY + (lines.length === 1 ? 0 : 7) - pulse, P.coral1, FONT.ui);
  let idx = 0;
  lines.forEach((s, li) => {
    const colors = [...s].map((ch, k) => {
      const w = ln.words && ln.words[idx + k];
      if (placeholder) return P.stone2;
      if (!w) return P.brown0;
      return t >= w.t ? P.coral1 : P.brown0;
    });
    text(x, s, B.x + B.w / 2 + 6, baseY + li * 15, null, FONT.ui, { align: 'center', colors });
    idx += [...s].length;
  });
}
// Semantic wrap: break at a space or punctuation nearest the middle; never mid-word.
function wrapLyric(s, max) {
  const chars = [...s];
  if (chars.length <= max) return [s];
  const mid = chars.length / 2;
  let best = -1, bd = 1e9;
  chars.forEach((c, i) => { if (' ，,、。！？…'.includes(c)) { const d = Math.abs(i - mid); if (d < bd) { bd = d; best = i; } } });
  if (best < 0) best = Math.floor(mid);
  const a = chars.slice(0, best + (chars[best] === ' ' ? 0 : 1)).join('').trim(), b = chars.slice(best + 1).join('').trim();
  return [a, b];
}

// ------------------------------------------------------------- status bar (two players)
// Shows who is online, where they are and their local time. The gap between the
// two halves is the distance between them; it closes only when they meet.
function statusBar(x, py, st, t) {
  const gap = ri(st.gap ?? 16), w = (LW - 16 - gap) / 2;
  for (const [who, px] of [['A', 8], ['B', 8 + w + gap]]) {
    const s = st[who];
    panel(x, px, py, w, 30, { fill: P.cream0 });
    // avatar
    box(x, px + 6, py + 6, 18, 18, who === 'A' ? P.blue1 : P.coral2, P.ink);
    blit(x, `${who}_head_front`, px + 9, py + 7);
    dot(x, px + 21, py + 21, s.online ? P.green2 : P.stone3);
    text(x, `${WORLD[who].name} · ${s.place}`, px + 28, py + 5, P.brown0, FONT.small);
    text(x, s.clock, px + 28, py + 16, who === 'A' ? P.blue1 : P.coral1, FONT.small);
    if (s.icon) blit(x, s.icon, px + w - 16, py + 10, { alpha: s.iconOn ? 1 : 0.35 });
  }
  if (st.km !== undefined) text(x, `相距 ${st.km} km`, LW / 2, py + 33, P.cream1, FONT.small, { align: 'center' });
}
function dot(x, px, py, col) { rect(x, px - 1, py - 1, 4, 4, P.ink); rect(x, px, py, 2, 2, col); }

// ------------------------------------------------------------- toasts / item get
// "收到" toast: icon + item name + short original note. Slides in by whole pixels.
function toast(x, u, d, item, py = 96) {
  if (u < 0 || u > d) return;
  const k = Math.min(panelOpen(u, 0.2), panelOpen(d - u, 0.2));
  const w = 250, px = ri((LW - w) / 2), y = ri(py - (1 - k) * 12);
  if (k < 1 && Math.floor(u * 30) % 2) return;
  panel(x, px, y, w, 36);
  box(x, px + 6, y + 6, 24, 24, P.cream1, P.brown1);
  blit(x, item.icon, px + 18 - SPR.get(item.icon).w, y + 18 - SPR.get(item.icon).h, { scale: 2 });
  text(x, `收到 · ${item.name}`, px + 36, y + 6, P.brown0);
  text(x, item.note, px + 36, y + 20, P.brown2, FONT.small);
}

// ------------------------------------------------------------- inventory
// Items are only ever ones the story has actually handed over (see story.js ITEMS).
function inventory(x, py, items, sel, t, o = {}) {
  const w = 300, px = (LW - w) / 2, h = 150;
  panel(x, px, py, w, h, { title: o.title || '背包' });
  for (let k = 0; k < 6; k++) {
    const cx = px + 14 + (k % 6) * 46, cy = py + 16;
    box(x, cx, cy, 38, 38, k === sel ? P.amber3 : P.cream1, k === sel ? P.coral1 : P.brown1);
    const it = items[k];
    if (it) blit(x, it.icon, cx + 19 - SPR.get(it.icon).w, cy + 19 - SPR.get(it.icon).h, { scale: 2 });
  }
  const it = items[sel];
  if (it) {
    text(x, it.name, px + 14, py + 64, P.brown0, FONT.big);
    text(x, it.note, px + 14, py + 86, P.brown2);
    text(x, `来源：${it.from}`, px + 14, py + 104, P.stone2, FONT.small);
    if (it.used) text(x, it.used, px + 14, py + 118, P.coral1, FONT.small);
    cursor(x, px + 4, py + 31, t);
  }
}

// ------------------------------------------------------------- quest log
function questLog(x, py, q, t, open = 1) {
  if (open <= 0) return;
  const w = 300, px = (LW - w) / 2, h = 34 + q.steps.length * 16;
  panel(x, px, py - ri((1 - open) * 14), w, h, { title: '任务日志' });
  text(x, q.title, px + 12, py + 10, P.brown0, FONT.big);
  q.steps.forEach((s, i) => {
    const y = py + 32 + i * 16;
    box(x, px + 12, y + 2, 9, 9, s.done ? P.coral0 : P.cream1, P.brown1);
    if (s.done) { pset(x, px + 14, y + 6, P.white); pset(x, px + 15, y + 7, P.white); pset(x, px + 16, y + 6, P.white); pset(x, px + 17, y + 5, P.white); }
    text(x, s.text, px + 26, y, s.done ? P.brown2 : P.brown0);
  });
}

// ------------------------------------------------------------- choice menu
function choice(x, px, py, opts, sel, t) {
  const w = 150, h = 18 + opts.length * 18;
  panel(x, px, py, w, h);
  opts.forEach((s, i) => {
    text(x, s, px + 24, py + 9 + i * 18, i === sel ? P.coral1 : P.brown0);
    if (i === sel) cursor(x, px + 12, py + 12 + i * 18, t);
  });
}

// ------------------------------------------------------------- call window
// A video call frame: a head-and-shoulders view of the other person.
function callWindow(x, px, py, w, h, who, o, t) {
  panel(x, px, py, w, h, { fill: P.night1, edge: P.brown1, shade: P.night0 });
  clip(x, { x: px + 4, y: py + 4, w: w - 8, h: h - 20 }, () => {
    rect(x, px + 4, py + 4, w - 8, h - 20, o.bg || P.night2);
    if (o.view) windowView(x, px + 4, py + 4, w - 8, h - 36, o.view, t);
    const zoom = canvas(16, 22);
    drawChar(zoom.x, who, 8, 21, { dir: 'front', t: o.frozen ? o.frozen : t, pose: o.pose });
    blit(x, zoom, px + w / 2 - 16, py + h - 60, { scale: 3 });
    if (o.frozen) { for (let y = py + 4; y < py + h - 16; y += 3) dither(x, px + 4, y, w - 8, 1, P.night0, 0.35); }
  });
  text(x, o.label || '', px + 8, py + h - 15, P.cream0, FONT.small);
  if (o.typing) for (let k = 0; k < 3; k++) if (mod(t * 3 - k * 0.3, 1) < 0.6) rect(x, px + w - 26 + k * 6, py + h - 11, 3, 3, P.cream0);
}
