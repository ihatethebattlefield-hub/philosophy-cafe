'use strict';
/*
 * The film, shot by shot. Shot start times come from data/storyboard.js anchors
 * resolved against the aligned lyric times (data/lyrics.js), so actions land on
 * the sung phrases. Inside a shot, beats are placed with ln('L05', frac) — a
 * moment within a given sung line — or with the shot's local time u.
 *
 * Every shot function is draw(x, u, d, t): u = seconds into the shot, d = its
 * length, t = absolute song time (for ambient loops: rain, blinks, flicker).
 */
const SCENE = { x: 0, y: 0, w: LW, h: 560 };              // picture area; the lyric bar lives below it
const TOP = { x: 0, y: 0, w: LW, h: 266 }, BOT = { x: 0, y: 304, w: LW, h: 256 }, SEAM_Y = 266;
const ITEMS = {
  song: { icon: 'headphones', name: '一首歌', note: '他说下雨天适合听这首。', from: '阿屿按下播放的那一刻' },
  bookmark: { icon: 'bookmark', name: '珊瑚色书签', note: '夹在第 117 页，同一句话下面。', from: '阿屿留在书里' },
  photo: { icon: 'photo', name: '晴天小铺的照片', note: '傍晚六点，门口的灯刚亮。', from: '小晴拍下，寄给阿屿' },
  ticket: { icon: 'ticket', name: '车票', note: '雾港北站 → 风见站 · 夜间渡轮', from: '阿屿在雾港北站买下', used: '渡轮停航，已作废' },
  ticket2: { icon: 'ticket', name: '改签车票', note: '雾港北站 → 风见站 · 山线', from: '再次连接之后改签' },
};

// ------------------------------------------------------------- time helpers
function lyricLine(id) { return (window.LYRICS.lines || []).find(l => l.id === id); }
function ln(id, f = 0) { const l = lyricLine(id); return l ? l.start + (l.end - l.start) * f : 0; }
function lnEnd(id) { const l = lyricLine(id); return l ? l.end : 0; }
let SHOTS = null;
function buildShots() {
  const intro = ln('L01');
  SHOTS = window.BOARD.shots.map(s => {
    const a = s.at;
    const start = typeof a === 'number' ? a : a.intro !== undefined ? intro * a.intro : a.lineEnd ? lnEnd(a.lineEnd) + (a.off || 0) : ln(a.line) + (a.off || 0);
    return { ...s, start };
  });
  SHOTS.forEach((s, i) => { s.end = i + 1 < SHOTS.length ? SHOTS[i + 1].start : SONG.duration; });
}
function shotAt(t) { for (let i = SHOTS.length - 1; i >= 0; i--) if (t >= SHOTS[i].start) return SHOTS[i]; return SHOTS[0]; }
// progress of an action placed at absolute times [a, b]
const prog = (t, a, b) => clamp((t - a) / (b - a));

// ------------------------------------------------------------- offscreen buffers
const BUF = {};
function buf(name, w = LW, h = 560) { if (!BUF[name]) BUF[name] = canvas(w, h); return BUF[name]; }
// Medium shots: draw a location into a buffer, then show a region of it at 2× (whole pixels).
function zoom2(x, src, sx, sy, R = SCENE) {
  x.save(); x.beginPath(); x.rect(R.x, R.y, R.w, R.h); x.clip();
  x.imageSmoothingEnabled = false;
  x.drawImage(src.c, ri(sx), ri(sy), R.w / 2, R.h / 2, R.x, R.y, R.w, R.h);
  x.restore();
}
function seam(x, st, t, h = 38) {
  rect(x, 0, SEAM_Y, LW, h, P.void);
  statusBar(x, SEAM_Y + 4, st, t);
}
function flashFrame(x, u, at, col = P.white) { if (u >= at && u < at + 1 / FPS) rect(x, 0, 0, LW, 560, col); }
// a translucent memory: every other pixel of a character, warm-tinted
function memoryOf(x, who, fx, fy, o, t, a = 1) {
  const m = buf('mem', 24, 26);
  m.x.clearRect(0, 0, 24, 26);
  drawChar(m.x, who, 12, 24, { ...o, t });
  const img = m.x.getImageData(0, 0, 24, 26), D = img.data;
  for (let i = 0; i < D.length; i += 4) {
    const px = (i / 4) % 24, py = Math.floor(i / 4 / 24);
    if (D[i + 3] && BAYER[(py & 3) * 4 + (px & 3)] < a * 0.55) { D[i] = (D[i] + 255) / 2; D[i + 1] = (D[i + 1] + 190) / 2; D[i + 2] = (D[i + 2] + 120) / 2; }
    else D[i + 3] = 0;
  }
  m.x.putImageData(img, 0, 0);
  blit(x, m, fx - 12, fy - 24);
}

// ------------------------------------------------------------- big props for close-ups
function bigRadio(x, cx, cy, t, pressed, playing) {
  const w = 200, h = 108, X = ri(cx - w / 2), Y = ri(cy - h / 2);
  box(x, X, Y, w, h, P.stone1, P.ink);
  rect(x, X + 2, Y + 2, w - 4, 6, P.stone2);
  // speaker grille
  for (let gy = 0; gy < 70; gy += 4) for (let gx = 0; gx < 70; gx += 4) if (Math.hypot(gx - 34, gy - 34) < 34) rect(x, X + 14 + gx, Y + 20 + gy, 2, 2, P.stone0);
  // tape window
  box(x, X + 98, Y + 22, 88, 40, P.night1, P.ink);
  for (const k of [0, 1]) { const rx = X + 120 + k * 44, ry = Y + 42, a = playing ? t * 6 : 0; disc(x, rx, ry, 9, P.cream1); disc(x, rx, ry, 3, P.ink); for (let s = 0; s < 3; s++) { const an = a + s * 2.09; pset(x, rx + Math.cos(an) * 6, ry + Math.sin(an) * 6, P.ink); } }
  rect(x, X + 110, Y + 52, 64, 6, P.wood2);
  // buttons: ◀◀  ▶  ■
  const bx = X + 100, by = Y + 70;
  for (let k = 0; k < 3; k++) {
    const down = k === 1 && pressed ? 2 : 0;
    box(x, bx + k * 30, by + down, 26, 20 - down, k === 1 ? P.cream0 : P.stone3, P.ink);
    if (k === 1) for (let j = 0; j < 7; j++) vline(x, bx + k * 30 + 10 + j, by + 4 + down + j * 0.5, by + 15 + down - j * 0.5, P.coral1);
    if (k === 0) { for (let j = 0; j < 5; j++) vline(x, bx + 6 + j, by + 7 + j * 0.6, by + 13 - j * 0.6, P.ink); for (let j = 0; j < 5; j++) vline(x, bx + 12 + j, by + 7 + j * 0.6, by + 13 - j * 0.6, P.ink); }
    if (k === 2) rect(x, bx + 70, by + 6, 7, 7, P.ink);
  }
  rect(x, X + 186, Y + 74, 4, 4, playing ? P.green2 : P.stone0); // power light
  // antenna
  line(x, X + w - 20, Y, X + w + 10, Y - 40, P.stone3);
}
function bookSpread(x, cx, cy, warm, pageL, pageR, under) {
  const w = 300, h = 190, X = ri(cx - w / 2), Y = ri(cy - h / 2);
  box(x, X - 4, Y + 4, w + 8, h, warm ? P.coral2 : P.blue2, P.ink);              // cover
  const paper = warm ? P.cream0 : P.cream1, lineC = warm ? P.cream2 : P.stone4;
  box(x, X, Y, w / 2, h, paper, P.ink); box(x, X + w / 2, Y, w / 2, h, paper, P.ink);
  dither(x, X + w / 2 - 10, Y + 1, 10, h - 2, P.cream2, 0.5);
  dither(x, X + w / 2, Y + 1, 8, h - 2, P.cream2, 0.35);
  for (const side of [0, 1]) for (let r = 0; r < 12; r++) {
    const lx = X + 14 + side * (w / 2), ly = Y + 18 + r * 13, lw = (r === 11 ? 60 : 118) - ((r * 7 + side * 3) % 13);
    for (let k = 0; k < lw; k += 4) if (hash3(r, k, side) > 0.18) rect(x, lx + k, ly, 3, 2, lineC);
  }
  text(x, String(pageL), X + 14, Y + h - 16, P.stone2, FONT.small);
  text(x, String(pageR), X + w - 14, Y + h - 16, P.stone2, FONT.small, { align: 'right' });
  if (under) hline(x, X + w / 2 + 14, X + w / 2 + 110, Y + 18 + under * 13 + 4, P.coral1);
  return { X, Y, w, h };
}
function departureBoard(x, cx, cy, t, cancelled) {
  const w = 300, h = 120, X = ri(cx - w / 2), Y = ri(cy - h / 2);
  box(x, X, Y, w, h, P.ink, P.stone2);
  text(x, '出发 DEPARTURES', X + 12, Y + 8, P.amber2);
  const rows = [['21:40', '雾港北 → 渡口', '准点'], ['22:15', '渡轮 → 风见站', cancelled ? '停航' : '准点'], ['23:05', '雾港北 → 山线', '准点']];
  rows.forEach((r, i) => {
    const y = Y + 30 + i * 26, bad = r[2] === '停航';
    text(x, r[0], X + 12, y, P.amber1);
    text(x, r[1], X + 70, y, P.amber1);
    if (!bad || mod(t, 0.7) < 0.45) text(x, r[2], X + w - 12, y, bad ? P.coral0 : P.green2, FONT.ui, { align: 'right' });
  });
}
function trainWindow(x, R, t, side) { // inside a train: window frame with landscape passing
  clip(x, R, () => {
    rect(x, R.x, R.y, R.w, R.h, P.wood1);
    const wx = R.x + 30, wy = R.y + 30, ww = R.w - 60, wh = R.h - 90;
    box(x, wx - 4, wy - 4, ww + 8, wh + 8, P.stone2, P.ink);
    clip(x, { x: wx, y: wy, w: ww, h: wh }, () => {
      const sky = side === 'A' ? [P.night1, P.night2, P.night3] : [P.dusk1, P.dusk2, P.dusk3];
      sky.forEach((c, i) => rect(x, wx, wy + i * wh / 3, ww, wh / 3 + 1, c));
      for (let k = 0; k < ww + 40; k++) { const gx = k + mod(t * 60, 40); const hh = 14 + Math.sin(gx * 0.07 + 2) * 6; vline(x, wx + k, wy + wh - hh - 10, wy + wh, side === 'A' ? P.night0 : P.dusk0); }
      for (let k = 0; k < 6; k++) { const px = wx + mod(k * 70 - t * 180, ww + 60) - 30; vline(x, px, wy + 10, wy + wh, P.stone0); vline(x, px + 1, wy + 10, wy + wh, P.stone1); }
    });
    rect(x, R.x, R.y + R.h - 50, R.w, 50, P.wood2);
    hline(x, R.x, R.x + R.w, R.y + R.h - 50, P.ink);
  });
}
function smallMapChip(x, label, t, py = 14) {
  const w = textWidth(label) + 40, px = LW - w - 10;
  panel(x, px, py, w, 24);
  box(x, px + 8, py + 7, 10, 10, P.amber2, P.brown1);
  pset(x, px + 13, py + 11, P.coral1);
  text(x, label, px + 24, py + 6, P.brown0);
}
function bubble(x, px, py, col) { box(x, px - 9, py - 6, 18, 12, col, P.ink); pset(x, px - 3, py + 6, P.ink); pset(x, px - 4, py + 7, P.ink); for (let k = 0; k < 3; k++) rect(x, px - 5 + k * 4, py - 1, 2, 2, P.white); }

// ------------------------------------------------------------- shots
const SHOT = {};

// S01 — a cursor in the dark, then the save screen
SHOT.S01 = (x, u, d, t) => {
  rect(x, 0, 0, LW, 560, P.void);
  if (u < 0.9) { cursor(x, LW / 2 - 2, 280, t, P.cream0); return; }
  const col = d - 0.9;                                     // collapse during the last 0.9 s
  const open = clamp((u - 0.9) / 0.35), close = clamp((u - col) / 0.9);
  const ph = ri(lerp(200, 2, E.inOut(close))), py = ri(lerp(lerp(560, 180, E.out(open)), SEAM_Y + 18 - ph / 2, E.inOut(close))), pw = ri(lerp(296, LW + 8, E.inOut(close)));
  if (close > 0) { panel(x, (LW - pw) / 2, py, pw, Math.max(6, ph)); return; }
  panel(x, (LW - pw) / 2, py, pw, ph, { title: '双人存档' });
  const px = (LW - pw) / 2;
  for (const [k, who] of [[0, 'A'], [1, 'B']]) {
    const on = u > 1.5 + k * 0.5, y = py + 22 + k * 44;
    box(x, px + 14, y, 36, 36, on ? (who === 'A' ? P.blue1 : P.coral2) : P.stone1, P.ink);
    if (on) { const c = buf('av', 16, 22); c.x.clearRect(0, 0, 16, 22); drawChar(c.x, who, 8, 21, { dir: 'front', t }); blit(x, c, px + 16, y + 2, { scale: 2 }); }
    text(x, on ? WORLD[who].name : '？？？', px + 60, y + 4, P.brown0, FONT.big);
    text(x, on ? `${WORLD[who].city} · 在线` : '……', px + 60, y + 22, on ? P.brown2 : P.stone3, FONT.small);
  }
  hline(x, px + 14, px + pw - 14, py + 116, P.cream2);
  text(x, '相识 第 214 天 · 上次存档：两座城市', px + 14, py + 122, P.brown2, FONT.small);
  const sel = u > 3.2 ? 1 : 0;
  ['新的旅程', '继续双人存档'].forEach((s, i) => {
    text(x, s, px + 40, py + 144 + i * 18, i === sel ? P.coral1 : i === 0 ? P.stone3 : P.brown0);
    if (i === sel && !(u > d - 1.4 && mod(u, 0.15) < 0.075)) cursor(x, px + 26, py + 147 + i * 18, t);
  });
};

// S02 — two rooms, one seam; a message leaves A's window
SHOT.S02 = (x, u, d, t) => {
  rect(x, 0, 0, LW, 560, P.void);
  const reveal = E.out(clamp(u / 0.8));
  const send = d * 0.6;
  clip(x, { x: 0, y: SEAM_Y - ri(SEAM_Y * reveal), w: LW, h: ri(SEAM_Y * reveal) }, () =>
    room(x, 'A', TOP, { view: 'nightCity', rain: 0.6, lamp: 1, clock: 23 * 60 + 40, mug: 0.8, phoneOnDesk: u < d * 0.35, person: { dir: 'back', lookDown: u > d * 0.35 && u < send + 0.4, pose: u > d * 0.35 && u < send + 0.4 ? 'phone' : 'down' } }, t));
  clip(x, { x: 0, y: BOT.y, w: LW, h: ri(BOT.h * reveal) }, () =>
    room(x, 'B', BOT, { view: 'dusk', lamp: 0.0, clock: 18 * 60 + 40, mug: 1, book: true, person: { dir: 'back' } }, t));
  seam(x, { A: { place: '雾港', clock: '23:40', online: true }, B: { place: '晴川', clock: '18:40', online: true }, km: WORLD.km }, t);
  if (u > send) { // the envelope slips out through A's window
    const k = clamp((u - send) / (d - send));
    const ex = lerp(34 + 40, 20, k), ey = lerp(20 + 30, -10, E.in(k));
    blit(x, 'envelope', ex + ri(Math.sin(u * 8) * 1), ey);
  }
};

// S03 — the message crosses the sky between the cities
SHOT.S03 = (x, u, d, t) => {
  const k = u / d, cam = ri(k * 520);
  // sky: night on the left of the world, dusk on the right; dithered seam travels by
  const W0 = 900;
  for (let y = 0; y < 560; y += 2) {
    const nightC = y < 180 ? P.night0 : y < 360 ? P.night1 : P.night2;
    const duskC = y < 180 ? P.dusk1 : y < 360 ? P.dusk2 : P.dusk3;
    rect(x, 0, y, LW, 2, nightC);
    for (let xs = 0; xs < LW; xs += 2) { const wx = xs + cam, f = clamp((wx - 300) / 400); if (f > 0) dither(x, xs, y, 2, 2, duskC, f); }
  }
  if (cam > 300) disc(x, 600 - cam + 300, 420, 14, P.amber2);
  // clouds
  for (let c = 0; c < 8; c++) { const cx = mod(c * 160 - cam * 0.6, W0) - 80, cy = 80 + (c % 3) * 90; for (let j = 0; j < 5; j++) disc(x, cx + j * 10, cy + (j % 2) * 3, 8, c * 160 > 400 ? P.dusk3 : P.night3); }
  // rooftops with lit windows
  for (let b = 0; b < 14; b++) {
    const bx = b * 70 - cam * 1.0, bh = 60 + hash(b) * 80, dusk = b * 70 > 420;
    if (bx > LW || bx + 66 < 0) continue;
    rect(x, bx, 560 - bh, 66, bh, dusk ? P.dusk0 : P.night0);
    for (let wy = 0; wy < bh - 10; wy += 12) for (let wx = 6; wx < 60; wx += 12) if (hash3(b, wx, wy) < 0.5) rect(x, bx + wx, 560 - bh + 8 + wy, 4, 5, dusk ? P.amber2 : P.amber1);
  }
  if (k < 0.35) for (let r = 0; r < 60; r++) { const rx = mod(hash(r) * 400 - u * 40, 400), ry = mod(hash(r + 9) * 560 + u * 300, 560); vline(x, rx, ry, ry + 3, P.rain); }
  // envelope path, then B's window opens around it
  const ex = lerp(60, 200, k), ey = 300 + Math.sin(k * Math.PI * 2) * 60 - k * 40;
  const win = clamp((k - 0.72) / 0.28);
  if (win > 0) {
    const ww = ri(lerp(40, 330, E.inOut(win))), wh = ri(ww * 0.68), wx = ri(200 - ww / 2), wy = ri(ey - wh / 2);
    box(x, wx - 4, wy - 4, ww + 8, wh + 8, P.wood3, P.ink);
    clip(x, { x: wx, y: wy, w: ww, h: wh }, () => room(x, 'B', { x: wx - (360 - ww) / 2, y: wy - 120 * win, w: 360, h: 300 }, { view: 'dusk', lamp: 0, clock: 18 * 60 + 41, mug: 1, book: true, person: { dir: 'back' } }, t));
  }
  blit(x, 'envelope', ex, ey);
};

// S04 — 想听你听过的音乐: A presses play; B's headphones light
SHOT.S04 = (x, u, d, t) => {
  const press = ln('L01', 0.12), cut = ln('L01', 0.5);
  if (t < cut) {
    planks(x, 0, 0, LW, 560, P.wood2, P.wood3, P.wood1, 77);
    glow(x, 260, 120, 160, 120, P.amber2, 0.35);
    const pressed = t >= press && t < press + 0.25, playing = t >= press;
    bigRadio(x, 180, 300, t, pressed, playing);
    // the hand comes in, hovers, presses
    const hk = prog(t, press - 0.9, press);
    const hx = lerp(LW + 80, 248, E.out(hk)), hy = lerp(420, 384 + (pressed ? 2 : 0), E.out(hk));
    hand(x, 'A', hx, hy, 'press', -1, 3);
    if (playing) for (let k = 0; k < 4; k++) { const ph = mod(t * 0.6 + k / 4, 1); text(x, '♪', 90 + k * 20 + ri(Math.sin((t + k) * 3) * 4), 240 - ph * 120, k % 2 ? P.amber2 : P.cream0, FONT.big); }
    blit(x, 'mug', 30, 470, { scale: 3 });
    return;
  }
  // B, 2× medium: the headphone icon lights, she puts them on and tilts her head
  const b = buf('roomB'); room(b.x, 'B', { x: 0, y: 0, w: LW, h: 300 }, { view: 'dusk', lamp: 0.4, clock: 18 * 60 + 43, mug: 0.9, book: true, person: { dir: 'right', pose: t < cut + 0.7 ? 'raise' : 'down', lookDown: t > cut + 1.2 } }, t);
  zoom2(x, b, 180, 30);
  if (t >= cut + 0.6) { // headphones on her head (the same coral as her scarf)
    const hx = (LW - 22 - 124 + 62 + 8 - 180) * 2, hy = (138 - 20 - 30) * 2;
    for (const s of [-1, 1]) { rect(x, hx + s * 13 - 3, hy + 6, 6, 9, P.ink); rect(x, hx + s * 13 - 2, hy + 7, 4, 7, P.coral0); }
    for (let k = -12; k <= 12; k++) pset(x, hx + k, hy - 2 + Math.abs(k) * 0.3 * 0, P.ink);
  }
  statusBar(x, 8, { A: { place: '雾港', clock: '23:44', online: true }, B: { place: '晴川', clock: '18:44', online: true, icon: 'headphones', iconOn: true }, gap: 16 }, t);
  toast(x, t - (cut + 0.4), lnEnd('L01') - cut + 0.3, ITEMS.song, 480);
};

// S05 — 想看你看过的小说: a bookmark at page 117; the same page in her copy
SHOT.S05 = (x, u, d, t) => {
  rect(x, 0, 0, LW, 560, P.wood1);
  planks(x, 0, 0, LW, 560, P.wood1, P.wood2, P.wood0, 31);
  const turn0 = ln('L02', 0.45), turn1 = turn0 + 0.5;
  const warm = t >= turn1;
  if (warm) glow(x, 180, 280, 220, 200, P.amber2, 0.3);
  const B = bookSpread(x, 180, 280, warm, 116, 117, warm && t > turn1 + 0.6 ? 5 : 0);
  if (!warm) { // the bookmark slides into the gutter
    const k = E.out(prog(t, ln('L02', 0.0), ln('L02', 0.3)));
    const by = lerp(-120, B.Y - 12, k);
    rect(x, B.X + B.w / 2 - 3, by, 7, 110, P.ink); rect(x, B.X + B.w / 2 - 2, by + 1, 5, 108, P.coral0); rect(x, B.X + B.w / 2 - 2, by + 1, 2, 108, P.coral3);
    hand(x, 'A', B.X + B.w / 2 + 12, by + 70, 'hold', -1, 3);
  } else {
    rect(x, B.X + B.w / 2 - 3, B.Y - 12, 7, 110, P.ink); rect(x, B.X + B.w / 2 - 2, B.Y - 11, 5, 108, P.coral0);
    if (t > turn1 + 0.3) hand(x, 'B', B.X + B.w / 2 + 70, B.Y + 18 + 5 * 13 + 30, 'point', -1, 3);
  }
  if (t >= turn0 && t < turn1) { // page turn: the right page folds over the gutter
    const k = prog(t, turn0, turn1), pw = ri(Math.abs(Math.cos(k * Math.PI)) * B.w / 2);
    const left = k > 0.5;
    box(x, left ? B.X + B.w / 2 - pw : B.X + B.w / 2, B.Y - 2, Math.max(2, pw), B.h + 4, left ? P.cream0 : P.cream1, P.ink);
    dither(x, left ? B.X + B.w / 2 - pw : B.X + B.w / 2, B.Y - 1, Math.max(1, pw), B.h + 2, P.cream2, 0.3);
  }
  toast(x, t - (turn1 + 0.2), lnEnd('L02') - turn1 + 0.2, ITEMS.bookmark, 470);
};

// S06 — 我想收集每一刻 / 我想看到你眼里的世界: the photo becomes the street
SHOT.S06 = (x, u, d, t) => {
  const shutter = ln('L03', 0.35), grow0 = ln('L04', 0.0), grow1 = ln('L04', 0.6);
  const g = E.inOut(prog(t, grow0, grow1));
  const pr = { w: ri(lerp(200, LW, g)), h: ri(lerp(150, 560, g)) };
  pr.x = ri((LW - pr.w) / 2); pr.y = ri(lerp(150, 0, g));
  if (g < 1) { // her hands and the photo
    rect(x, 0, 0, LW, 560, P.dusk0);
    for (let k = 0; k < 10; k++) dither(x, 0, k * 56, LW, 56, P.dusk1, 0.1 * k);
    box(x, pr.x - 8, pr.y - 8, pr.w + 16, pr.h + 34, P.white, P.ink);
  }
  const developed = t > shutter + 0.4;
  clip(x, pr, () => {
    street(x, { x: pr.x, y: pr.y, w: pr.w, h: pr.h }, { time: 'dusk', camX: lerp(10, 0, g), shopOpen: true }, t);
    if (!developed) dither(x, pr.x, pr.y, pr.w, pr.h, P.white, t < shutter ? 1 : 1 - prog(t, shutter, shutter + 0.4));
  });
  if (g < 1) {
    hand(x, 'B', pr.x - 6, pr.y + pr.h + 10, 'hold', 1, 3);
    hand(x, 'B', pr.x + pr.w + 6, pr.y + pr.h + 10, 'hold', -1, 3);
    text(x, '18:00', pr.x + pr.w - 4, pr.y + pr.h + 8, P.stone3, FONT.small, { align: 'right' });
  }
  flashFrame(x, t - shutter, 0);
  toast(x, t - (shutter + 0.6), grow0 - shutter - 0.5, ITEMS.photo, 470);
};

// S07 — 想到你到过的地方 / 和你曾度过的时光: he walks into her photo, at night
SHOT.S07 = (x, u, d, t) => {
  const stopShop = ln('L05', 0.55), walk2 = ln('L05', 0.95), stopBus = ln('L06', 0.25), lampOff = d - 0.25;
  // camera: follow A along the block; A's world-x drives both (no foot sliding)
  let ax;
  if (t < stopShop) ax = lerp(-20, 100, prog(t, ln('L05', -0.3), stopShop));
  else if (t < walk2) ax = 100;
  else ax = lerp(100, 268, prog(t, walk2, stopBus));
  const walking = (t < stopShop && t > ln('L05', -0.3)) || (t > walk2 && t < stopBus);
  const cam = ri(clamp(ax - 120, 0, 200));
  const lamp = u > lampOff ? 0 : 1;
  street(x, SCENE, { time: 'night', rain: 0.55, wet: true, camX: cam, shopOpen: true }, t);
  const ground = 560 - 46;
  if (t > stopBus - 0.3 && t < stopBus + 1.6) memoryOf(x, 'B', 230 + 36 - cam + 34, ground, { dir: 'left' }, t, 1 - prog(t, stopBus + 0.9, stopBus + 1.6));
  drawChar(x, 'A', ri(ax) - cam + 26, ground, { dir: walking ? 'right' : t > walk2 ? 'right' : 'back', walk: walking ? t * 2 : null, t, lookUp: !walking && t < walk2 });
  if (t > stopShop) smallMapChip(x, '地图 · 晴天小铺 已点亮', t);
  if (t > stopBus) smallMapChip(x, '地图 · 17 路公交站 已点亮', t, 44);
  if (!lamp) rect(x, 0, 0, LW, 560, P.void);
};

// S08 — 不想错过每一刻 / 多希望我一直在你身旁: hands on two panes of glass
SHOT.S08 = (x, u, d, t) => {
  const hands = ln('L08', 0.0);
  rect(x, 0, 0, LW, 560, P.void);
  if (t < hands) {
    room(x, 'A', TOP, { view: 'nightCity', rain: 0.5, lamp: E.out(clamp(u / 0.4)), clock: 23 * 60 + 58, mug: 0.4, person: { dir: 'back', pose: 'reach' } }, t);
    room(x, 'B', BOT, { view: 'dusk', lamp: E.out(clamp(u / 0.4)), clock: 18 * 60 + 58, mug: 0.6, book: true, person: { dir: 'back', pose: 'reach' } }, t);
  } else { // two palms against two windows, aligned across the seam
    clip(x, TOP, () => { windowView(x, 0, 0, LW, TOP.h, { view: 'nightCity', rain: 0.8, seed: 3 }, t); dither(x, 0, 0, LW, TOP.h, P.glass, 0.12); });
    clip(x, BOT, () => { windowView(x, 0, BOT.y, LW, BOT.h, { view: 'dusk', seed: 4 }, t); dither(x, 0, BOT.y, LW, BOT.h, P.glass, 0.1); });
    const k = E.out(prog(t, hands, hands + 0.8));
    hand(x, 'A', 150, lerp(-40, 190, k), 'open', 1, 4);
    hand(x, 'B', 150, lerp(600, 380, k), 'open', 1, 4);
  }
  seam(x, { A: { place: '雾港', clock: '23:58', online: true }, B: { place: '晴川', clock: '18:58', online: true }, km: WORLD.km }, t);
};

// S09 — pre-chorus: a lively crossing | a quiet room; she looks up, types, waits, sends
SHOT.S09 = (x, u, d, t) => {
  const ping = ln('L10', 0.0), look = ln('L10', 0.5), pick = ln('L11', 0.0), type0 = ln('L11', 0.3), sendT = ln('L12', 0.55);
  // top: A stands still while the street moves around him
  const s = buf('street', LW, 300);
  street(s.x, { x: 0, y: 0, w: LW, h: 300 }, { time: 'night', wet: true, camX: 300, shopOpen: true }, t);
  for (let k = 0; k < 7; k++) { // passers-by: anonymous silhouettes walking both ways
    const dir = k % 2 ? 1 : -1, px = mod(hash(k) * 500 + dir * t * (24 + k * 3), 500) - 70;
    const m = buf('pass', 16, 22); m.x.clearRect(0, 0, 16, 22);
    drawChar(m.x, k % 3 ? 'A' : 'B', 8, 21, { dir: dir > 0 ? 'right' : 'left', walk: t * 2 + k * 0.3, t });
    m.x.globalCompositeOperation = 'source-in'; m.x.fillStyle = k % 2 ? P.night0 : P.stone0; m.x.fillRect(0, 0, 16, 22); m.x.globalCompositeOperation = 'source-over';
    blit(s.x, m, px, 300 - 46 - 20);
  }
  drawChar(s.x, 'A', 170, 300 - 46, { dir: 'right', pose: 'phone', holding: 'phone', t, lookDown: true });
  if (t > sendT + 0.3) bubble(s.x, 182, 300 - 80, P.coral0);
  blit(x, s, 0, -34);
  // bottom: B, 2×: head down; the cup cools; the phone lights; a long pause; she sends
  const b = buf('roomB');
  const steamLeft = 1 - prog(t, ln('L09', 0), ln('L11', 0));
  const lifted = t > look, holding = t > pick;
  room(b.x, 'B', { x: 0, y: 0, w: LW, h: 300 }, { view: 'dusk', lamp: 1, clock: 19 * 60 + 12, mug: steamLeft, book: true, phoneOnDesk: !holding, phoneLit: t > ping, person: { dir: 'right', lookDown: !lifted, pose: holding ? 'phone' : 'down', holding: holding ? 'phone' : null } }, t);
  zoom2(x, b, 182, 40, BOT);
  if (holding && t < sendT) { // typing indicator, with a hesitation where it stops
    const hesit = t > ln('L11', 0.9) && t < ln('L12', 0.3);
    panel(x, 220, BOT.y + 40, 72, 22);
    if (!hesit) for (let k = 0; k < 3; k++) if (mod(t * 3 - k * 0.3, 1) < 0.6) rect(x, 240 + k * 10, BOT.y + 49, 4, 4, P.brown1);
  }
  if (t > sendT) { const k = prog(t, sendT, sendT + 0.7); bubble(x, 250, lerp(BOT.y + 60, SEAM_Y - 20, E.in(k)), P.coral0); }
  seam(x, { A: { place: '雾港 · 路口', clock: '00:12', online: true }, B: { place: '晴川', clock: '19:12', online: true }, km: WORLD.km }, t);
};

// S10 — chorus 1: the map; the quest opens; each sets out; the routes stop short
function mapState(t, phase) { return phase; }
SHOT.S10 = (x, u, d, t) => {
  const vA = [ln('L15', 0), ln('L16', 1)], vB = [ln('L17', 0), ln('L17', 1)];
  const inVignetteA = t > vA[0] && t < vA[1], inVignetteB = t > vB[0] && t < vB[1];
  if (t > ln('L19', -0.2) && t < ln('L20', 0.0)) { // two people waiting at two stations; the seam says what is missing
    platformZoom(x, TOP, { time: 'night', sign: '雾港北站', signX: 120, benches: [20] }, t, [{ who: 'A', x: 96, o: { dir: 'back', lookUp: true, holding: 'ticket' } }]);
    platformZoom(x, BOT, { time: 'dusk', sign: '晴川站', signX: 60, benches: [110] }, t, [{ who: 'B', x: 80, o: { dir: 'back', wind: true } }]);
    rect(x, 0, SEAM_Y, LW, 38, P.void);
    text(x, '路线未接通 · 雾港北站 ……… 晴川站', LW / 2, SEAM_Y + 12, P.cream1, FONT.ui, { align: 'center' });
    return;
  }
  if (inVignetteA) { // A at Fog Harbour North, buying the ticket
    platformZoom(x, SCENE, { time: 'night', sign: '雾港北站', signX: 70, benches: [120], train: lerp(-120, 500, prog(t, vA[0] + 1.5, vA[1])) }, t,
      [{ who: 'A', x: 80, o: { dir: 'right', pose: t > vA[0] + 0.8 ? 'phone' : 'down', holding: t > vA[0] + 0.8 ? 'ticket' : null } }]);
    toast(x, t - (vA[0] + 0.9), vA[1] - vA[0] - 1.2, ITEMS.ticket, 470);
    return;
  }
  if (inVignetteB) { // B at Qingchuan station, looking up the line
    platformZoom(x, SCENE, { time: 'dusk', sign: '晴川站', signX: 110, benches: [20] }, t, [{ who: 'B', x: 100, o: { dir: 'right', wind: true, lookUp: true } }]);
    return;
  }
  const A = clamp((t - vA[0]) / (vA[1] - vA[0])), Bp = clamp((t - vB[0]) / (vB[1] - vB[0]));
  const reached = ['A_home', 'B_home'];
  if (A >= 1) reached.push('A_st');
  if (Bp >= 1) reached.push('B_st');
  const fogPulse = t > ln('L19') ? 1 + 0.15 * Math.sin(t * 2) : 1;
  worldMap(x, SCENE, { reached, travel: { A: A >= 1 ? 1 : 0, B: Bp >= 1 ? 1 : 0 }, fog: fogPulse, pulse: t > ln('L18') ? 'hub' : null }, t);
  // the two travellers as markers
  const nd = MAP_NODES;
  const mv = (a, b, k) => ({ x: ri(lerp(a.x, b.x, E.inOut(k))), y: ri(lerp(a.y, b.y, E.inOut(k))) });
  const ma = mv(nd.A_home, nd.A_st, A), mb = mv(nd.B_home, nd.B_st, Bp);
  box(x, ma.x - 4, ma.y - 12, 8, 8, P.blue0, P.ink); box(x, mb.x - 4, mb.y - 12, 8, 8, P.coral0, P.ink);
  if (t > ln('L20')) { const ph = mod(t * 0.8, 1); for (let k = 0; k < 6; k++) if (k / 6 < ph) pset(x, lerp(nd.A_st.x, nd.hub.x, k / 12) , lerp(nd.A_st.y, nd.hub.y, k / 12), P.stone4); }
  const q = { title: '主线任务：去见你', steps: [
    { text: '阿屿 · 抵达雾港北站', done: A >= 1 }, { text: '小晴 · 抵达晴川站', done: Bp >= 1 },
    { text: '抵达风见站（中转）', done: false } ] };
  const qOpen = E.out(prog(t, ln('L14', 0), ln('L14', 0.3)));
  if (t > ln('L14')) questLog(x, 470 - 68, q, t, qOpen);
  const reachedN = (A >= 1) + (Bp >= 1);
  text(x, `已抵达站点 ${reachedN} / 3 · 相距 ${WORLD.km} km`, LW / 2, 16, P.cream0, FONT.ui, { align: 'center' });
};

// S10b — instrumental interlude: his lamp goes out at 01:30; hers comes on at 20:30
SHOT.S10b = (x, u, d, t) => {
  const off = d * 0.3, on = d * 0.5;
  room(x, 'A', TOP, { view: 'nightCity', rain: 0.3, lamp: u < off ? 1 : 0, clock: 1 * 60 + 30, mug: 0, person: u < off + 0.6 ? { dir: 'back', lookDown: true } : null }, t);
  if (u >= off) dither(x, 0, 0, LW, TOP.h, P.void, 0.45);
  room(x, 'B', BOT, { view: 'nightCity', lamp: u > on ? 1 : 0, clock: 20 * 60 + 30, mug: 1, book: true, person: { dir: 'back', pose: u > on + 0.8 ? 'book' : 'down', holding: u > on + 0.8 ? 'book' : null } }, t);
  if (u <= on) dither(x, 0, BOT.y, LW, BOT.h, P.void, 0.35);
  seam(x, { A: { place: '雾港', clock: '01:30', online: false }, B: { place: '晴川', clock: '20:30', online: true }, km: WORLD.km }, t);
};

// S11 — verse 2: his morning sun, her midnight rain; an imagined umbrella; the call
SHOT.S11 = (x, u, d, t) => {
  const reach = ln('L24', 0.0), call = ln('L24', 0.7);
  rect(x, 0, 0, LW, 560, P.void);
  if (t < call) {
    room(x, 'A', TOP, { view: 'day', lamp: 0, clock: 6 * 60 + 10, draft: true, mug: 1, person: { dir: 'back', pose: 'shade' } }, t);
    dither(x, 0, 0, LW, TOP.h, P.amber3, 0.12);
    street(x, BOT, { time: 'night', rain: 0.9, wet: true, camX: 210, shopOpen: false }, t);
    drawChar(x, 'B', 120, BOT.y + BOT.h - 46, { dir: 'right', pose: 'raise', t, wind: true });
    blit(x, 'umbrella', 114, BOT.y + BOT.h - 46 - 30);
    if (t > reach) { // the wish: the umbrella crosses the seam, drawn as a dashed outline
      const k = E.inOut(prog(t, reach, call - 0.3));
      const ux = ri(lerp(114, 170, k)), uy = ri(lerp(BOT.y + BOT.h - 76, 70, k));
      for (let yy = 0; yy < 9; yy++) for (let xx = 0; xx < 11; xx++) if ((xx + yy) % 2 === 0) pset(x, ux + xx, uy + yy, P.coral3);
      text(x, '（想象）', ux + 22, uy - 4, P.cream0, FONT.small);
    }
    seam(x, { A: { place: '雾港', clock: '06:10', online: true }, B: { place: '晴川', clock: '01:10', online: true }, km: WORLD.km }, t);
  } else {
    rect(x, 0, 0, LW, 560, P.night0);
    callWindow(x, 20, 40, 320, 220, 'B', { view: { view: 'nightCity', rain: 0.9, seed: 5 }, label: '小晴 · 晴川 01:12' }, t);
    callWindow(x, 20, 290, 320, 220, 'A', { view: { view: 'day', seed: 6 }, label: '阿屿 · 雾港 06:12' }, t);
    text(x, '通话中 00:42', LW / 2, 266, P.cream1, FONT.small, { align: 'center' });
  }
};

// S12 — verse 2b: the call freezes; the trip that didn't happen; she chooses to reconnect
SHOT.S12 = (x, u, d, t) => {
  const freezeT = ln('L25', 0.1), board = ln('L26', 0.0), inv0 = ln('L27', 0.0), choose = ln('L28', 0.0);
  if (t < board) {
    rect(x, 0, 0, LW, 560, P.night0);
    callWindow(x, 20, 40, 320, 220, 'B', { view: { view: 'nightCity', rain: 0.9, seed: 5 }, label: '连接中…', frozen: freezeT, typing: t < freezeT + 0.8 }, t);
    callWindow(x, 20, 290, 320, 220, 'A', { view: { view: 'day', seed: 6 }, label: '阿屿 · 雾港 06:14' }, t);
    return;
  }
  if (t < inv0) { // the cancelled ferry; the ticket voided; the route stalls in the fog
    rect(x, 0, 0, LW, 560, P.night0);
    departureBoard(x, LW / 2, 150, t, true);
    const k = E.out(prog(t, board + 0.6, board + 1.2));
    panel(x, 60, 300, 240, 120);
    blit(x, 'ticket', 90, 330, { scale: 4 });
    if (k > 0) { const sx = 190, sy = 360; box(x, sx - 4, sy - 4, 92, 28, P.cream0, P.coral1); text(x, '已作废', sx + 42, sy + 2, P.coral1, FONT.big, { align: 'center' }); }
    text(x, ITEMS.ticket.note, LW / 2, 434, P.cream1, FONT.small, { align: 'center' });
    return;
  }
  // her room, 2×; the bag; the choice
  const b = buf('roomB');
  room(b.x, 'B', { x: 0, y: 0, w: LW, h: 300 }, { view: 'nightCity', lamp: 1, clock: 1 * 60 + 20, mug: 0, book: true, phoneOnDesk: true, person: { dir: 'right', lookDown: true } }, t);
  zoom2(x, b, 182, 40);
  if (t < choose) {
    const items = [ITEMS.song, ITEMS.bookmark, ITEMS.photo];
    const sel = Math.min(2, Math.floor(prog(t, inv0 + 0.4, choose - 0.2) * 3));
    inventory(x, 330, items, sel, t);
  } else {
    const sel = t > ln('L28', 0.45) ? 1 : 0;
    choice(x, 105, 360, ['继续等待', '再次连接'], sel, t);
    if (t > ln('L28', 0.85) && mod(t, 0.12) < 0.06) rect(x, 105, 360, 150, 54, P.white);
  }
};

// S13 — chorus 2: both send at once; the rerouted lines reach Kazami; hands at the glass, closer
SHOT.S13 = (x, u, d, t) => {
  const mapT = ln('L31', 0.0), trainT = ln('L33', 0.0), handsT = ln('L35', 0.0);
  if (t < mapT) {
    rect(x, 0, 0, LW, 560, P.void);
    const both = ln('L29', 0.4);
    room(x, 'A', TOP, { view: 'nightCity', lamp: 1, clock: 22 * 60 + 30, mug: 1, person: { dir: 'back', pose: 'phone', lookDown: true } }, t);
    room(x, 'B', BOT, { view: 'dusk', lamp: 1, clock: 17 * 60 + 30, mug: 1, book: true, person: { dir: 'back', pose: 'phone', lookDown: true } }, t);
    seam(x, { A: { place: '雾港', clock: '22:30', online: true }, B: { place: '晴川', clock: '17:30', online: true }, km: WORLD.km }, t);
    if (t > both) { // two bubbles leave at the same moment and meet in the seam
      const k = E.inOut(prog(t, both, both + 0.9));
      bubble(x, 180 - 30 * (1 - k), lerp(120, SEAM_Y + 18, k), P.blue0);
      bubble(x, 180 + 30 * (1 - k), lerp(BOT.y + 120, SEAM_Y + 18, k), P.coral0);
      if (k >= 1 && mod(t, 0.3) < 0.2) text(x, '已连接', LW / 2, SEAM_Y - 14, P.amber2, FONT.ui, { align: 'center' });
    }
    return;
  }
  if (t < trainT) { // the map: the mountain line instead of the ferry; both reach Kazami
    const k = prog(t, mapT, ln('L32', 1));
    worldMap(x, SCENE, { reached: ['A_home', 'A_st', 'B_home', 'B_st', ...(k >= 1 ? ['hub'] : [])], travel: { A: 1 + k * 0, B: 1 + k }, fog: 1 - k * 0.7, mountain: k, pulse: k >= 1 ? 'hub' : null }, t);
    // A's line through the mountains (drawn here: it only exists after the reroute)
    const a0 = MAP_NODES.A_st, hub = MAP_NODES.hub, mid = { x: 250, y: 300 };
    for (let j = 0; j <= 100 * k; j++) { const f = j / 100; const px = f < 0.5 ? lerp(a0.x, mid.x, f * 2) : lerp(mid.x, hub.x, (f - 0.5) * 2), py = f < 0.5 ? lerp(a0.y, mid.y, f * 2) : lerp(mid.y, hub.y, (f - 0.5) * 2); if (j % 2 === 0) pset(x, px, py, P.blue3); }
    const q = { title: '主线任务：去见你', steps: [
      { text: '阿屿 · 改签山线', done: true }, { text: '小晴 · 抵达晴川站', done: true }, { text: '两人抵达风见站', done: k >= 1 } ] };
    questLog(x, 400, q, t);
    const remain = ri(WORLD.km * (1 - k));
    text(x, k >= 1 ? '同在风见站' : `相距 ${remain} km`, LW / 2, 16, P.cream0, FONT.ui, { align: 'center' });
    toast(x, t - mapT, 2.2, ITEMS.ticket2, 330);
    return;
  }
  if (t < handsT) { // on the move, carrying what they were given
    trainWindow(x, TOP, t, 'A'); trainWindow(x, BOT, t, 'B');
    const ca = buf('ca', 16, 22); ca.x.clearRect(0, 0, 16, 22); drawChar(ca.x, 'A', 8, 21, { dir: 'right', t, holding: 'ticket', pose: 'phone' }); blit(x, ca, 60, TOP.h - 100, { scale: 3 });
    const cb = buf('cb', 16, 22); cb.x.clearRect(0, 0, 16, 22); drawChar(cb.x, 'B', 8, 21, { dir: 'left', t, holding: 'bookmark', pose: 'phone' }); blit(x, cb, 250, BOT.y + BOT.h - 100, { scale: 3 });
    seam(x, { A: { place: '山线列车', clock: '06:40', online: true, icon: 'ticket', iconOn: true }, B: { place: '去风见站', clock: '01:40', online: true, icon: 'bookmark', iconOn: true }, km: ri(WORLD.km * 0.18) }, t);
    return;
  }
  // hands on two phone screens — the gap between them is smaller now
  rect(x, 0, 0, LW, 560, P.night0);
  const k = E.out(prog(t, handsT, handsT + 0.8));
  box(x, 30, 40, 300, 220, P.night2, P.ink); dither(x, 31, 41, 298, 218, P.screen, 0.2);
  box(x, 30, 296, 300, 220, P.dusk1, P.ink); dither(x, 31, 297, 298, 218, P.screen, 0.2);
  hand(x, 'A', 140, lerp(-30, 210, k), 'open', 1, 4);
  hand(x, 'B', 140, lerp(600, 350, k), 'open', 1, 4);
  rect(x, 0, 274, LW, 14, P.void);
  text(x, `相距 ${ri(WORLD.km * 0.18)} km`, LW / 2, 275, P.cream1, FONT.small, { align: 'center' });
};

// Platform medium shots: the station is drawn into a half-size buffer and shown at
// exactly 2×, so the leads read at 24×40 px and the whole image keeps one pixel grid.
function platformZoom(x, R, st, t, people, z = 2) {
  const bw = Math.ceil(R.w / z), bh = Math.ceil(R.h / z), b = buf('plat_' + bw + 'x' + bh, bw, bh);
  b.x.clearRect(0, 0, bw, bh);
  platform(b.x, { x: 0, y: 0, w: bw, h: bh }, st, t);
  const feet = bh - 60 + 14;
  for (const p of people) drawChar(b.x, p.who, ri(p.x - (st.camX || 0)), feet, { t, ...p.o });
  x.save(); x.beginPath(); x.rect(R.x, R.y, R.w, R.h); x.clip();
  x.imageSmoothingEnabled = false;
  x.drawImage(b.c, 0, 0, bw, bh, R.x, R.y, bw * z, bh * z);
  x.restore();
}

// S14 — bridge: sun after rain, a rainbow across both halves; the halves draw together
SHOT.S14 = (x, u, d, t) => {
  const close = prog(t, ln('L39', 0.0), ln('L39', 1));
  const gap = ri(lerp(38, 0, E.inOut(close)));
  const h = ri((560 - gap) / 2);
  const topR = { x: 0, y: 0, w: LW, h }, botR = { x: 0, y: h + gap, w: LW, h: 560 - h - gap };
  const clear = prog(t, ln('L37', 0.2), ln('L37', 0.9));
  platformZoom(x, topR, { time: 'dawn', sign: '风见站', signX: 130, benches: [20] }, t, [{ who: 'A', x: 140, o: { dir: 'left', holding: 'ticket', pose: 'phone' } }]);
  if (clear < 1) { dither(x, 0, 0, LW, topR.h, P.night0, 0.4 * (1 - clear)); for (let r = 0; r < 50 * (1 - clear); r++) { const rx = mod(hash(r) * LW - t * 20, LW), ry = mod(hash(r + 3) * topR.h + t * 260, topR.h); vline(x, rx, ry, ry + 4, P.rain); } }
  platformZoom(x, botR, { time: 'dusk', sign: '风见站', signX: 50, benches: [120] }, t, [{ who: 'B', x: 40, o: { dir: 'right', wind: true } }]);
  if (t > ln('L38', 0.0)) { // the rainbow: one arc spanning both halves
    const k = E.out(prog(t, ln('L38', 0.0), ln('L38', 0.8)));
    const cols = [P.coral0, P.amber1, P.amber2, P.green2, P.blue3, P.night5];
    cols.forEach((c, i) => { const r = 210 - i * 4; for (let ang = 0; ang < Math.PI * k; ang += 0.003) pset(x, 180 - Math.cos(ang) * r, 300 - Math.sin(ang) * r * 1.25, c); });
  }
  if (gap > 0) { rect(x, 0, topR.h, LW, gap, P.void); if (gap > 14) text(x, '风见站 · 东站台 ／ 西站台', LW / 2, topR.h + gap / 2 - 6, P.cream1, FONT.small, { align: 'center' }); }
};

// S15 — final chorus: one platform, one light. He walks, she turns, they see each other.
SHOT.S15 = (x, u, d, t) => {
  const turnT = ln('L41', 0.3), seeT = ln('L42', 0.0), stepT = ln('L43', 0.0), handsT = ln('L44', 0.0), hugT = ln('L45', 0.0);
  if (t >= handsT && t < hugT) { // two hands, no glass between them
    for (let k = 0; k < 8; k++) rect(x, 0, k * 70, LW, 70, [P.dusk0, P.dusk0, P.dusk1, P.dusk1, P.dusk2, P.dusk2, P.dusk3, P.dusk3][k]);
    glow(x, 180, 280, 160, 120, P.amber2, 0.35);
    const k = E.inOut(prog(t, handsT, handsT + 1.6));
    hand(x, 'A', lerp(LW + 100, 196, k), 290, 'open', -1, 4);
    hand(x, 'B', lerp(-100, 164, k), 290, 'open', 1, 4);
    return;
  }
  // buffer units (2× on screen). B waits; A walks in, sees her, stops; both step closer.
  // 3× camera (buffer 120 px wide): she waits at 40; he walks in, sees her at 86, both close the gap
  const ax = t < seeT ? lerp(200, 86, prog(t, ln('L40', -0.4), seeT)) : t < stepT ? 86 : t < hugT ? lerp(86, 66, prog(t, stepT, stepT + 1.4)) : 64;
  const bx = t < stepT ? 40 : t < hugT ? lerp(40, 56, prog(t, stepT + 0.3, stepT + 1.6)) : 58;
  const cam = ri(clamp(ax - 80, 0, 120));
  const aWalk = t < seeT || (t > stepT && t < stepT + 1.4), bWalk = t > stepT + 0.3 && t < stepT + 1.6, hug = t >= hugT;
  const train = t > ln('L46', 0.3) ? lerp(-120, 500, prog(t, ln('L46', 0.3), ln('L47', 1))) : null;
  platformZoom(x, SCENE, { time: 'dusk', sign: '风见站', signX: 100 - cam, benches: [-30 - cam], camX: cam, train }, t, [
    { who: 'B', x: bx, o: { dir: t > turnT ? 'right' : 'back', walk: bWalk ? t * 2 : null, wind: true, pose: hug ? 'hug' : 'down' } },
    { who: 'A', x: ax, o: { dir: 'left', walk: aWalk ? t * 2 : null, pose: hug ? 'hug' : t > seeT + 0.6 && t < stepT ? 'reach' : 'down' } },
  ], 3);
  // the two halves of the status bar finally become one
  const merge = prog(t, hugT, hugT + 1);
  if (merge < 1) statusBar(x, 8, { A: { place: '风见站', clock: '17:20', online: true }, B: { place: '风见站', clock: '17:20', online: true }, gap: ri(lerp(16, 0, merge)) }, t);
  else { panel(x, 70, 8, 220, 30); text(x, '阿屿 · 小晴 · 风见站 17:20', LW / 2, 16, P.brown0, FONT.ui, { align: 'center' }); }
};

// S16 — outro: one bench, one window; the save is updated; the bag shows where everything came from
SHOT.S16 = (x, u, d, t) => {
  const saveT = ln('L48', 0.2), bagT = ln('L49', 0.0), quietT = lnEnd('L49') + 1.0;
  const bw = 180, bh = 280, b = buf('bench', bw, bh), y = b.x;
  rect(y, 0, 0, bw, bh, P.wood1);
  for (let k = 0; k < bw; k += 9) vline(y, k, 0, 168, P.wood0);
  // the shared window — one frame where the opening had two
  const Wd = { x: 22, y: 18, w: 136, h: 130 };
  box(y, Wd.x - 4, Wd.y - 4, Wd.w + 8, Wd.h + 8, P.wood3, P.ink);
  clip(y, Wd, () => {
    windowView(y, Wd.x, Wd.y, Wd.w, Wd.h, { view: 'dusk', seed: 12 }, t);
    const tx = mod(t * 40, 420) - 200; // a distant train crosses now and then
    rect(y, Wd.x + tx, Wd.y + Wd.h - 22, 110, 6, P.dusk0); for (let k = 0; k < 9; k++) rect(y, Wd.x + tx + 4 + k * 12, Wd.y + Wd.h - 21, 6, 3, P.amber2);
  });
  vline(y, Wd.x + Wd.w / 2, Wd.y, Wd.y + Wd.h - 1, P.wood3); hline(y, Wd.x, Wd.x + Wd.w - 1, Wd.y + Wd.h / 2, P.wood3);
  rect(y, Wd.x - 8, Wd.y + Wd.h + 4, Wd.w + 16, 4, P.wood3);
  rect(y, 0, 168, bw, bh - 168, P.stone1); hline(y, 0, bw, 168, P.ink);
  for (let k = 0; k < bw; k += 16) vline(y, k, 169, bh, P.stone0);
  glow(y, 90, 172, 90, 26, P.amber2, 0.35);
  box(y, 54, 196, 72, 6, P.wood3, P.ink); box(y, 54, 184, 72, 5, P.wood2, P.ink); vline(y, 58, 202, 210, P.ink); vline(y, 121, 202, 210, P.ink);
  drawChar(y, 'A', 80, 200, { dir: 'back', t, sit: true });
  drawChar(y, 'B', 98, 200, { dir: 'back', t, sit: true, wind: true });
  x.imageSmoothingEnabled = false;
  x.drawImage(b.c, 0, 0, bw, bh, 0, 0, bw * 2, bh * 2);
  if (t > saveT && t < bagT) {
    const k = E.out(prog(t, saveT, saveT + 0.3));
    panel(x, 50, 440 - ri((1 - k) * 12), 260, 60, { title: '存档' });
    text(x, '双人存档已更新', 70, 452, P.coral1, FONT.big);
    text(x, '相识 第 216 天 · 风见站 · 同一时间', 70, 474, P.brown2, FONT.small);
  }
  if (t >= bagT && t < quietT) {
    const items = [ITEMS.song, ITEMS.bookmark, ITEMS.photo, ITEMS.ticket2];
    const sel = Math.min(3, Math.floor(prog(t, bagT, quietT - 0.4) * 4));
    inventory(x, 400, items, sel, t, { title: '双人背包' });
  }
};

// ------------------------------------------------------------- frame
function drawFilm(x, t) {
  const s = shotAt(t), u = t - s.start, d = s.end - s.start;
  rect(x, 0, 0, LW, LH, P.void); // every frame starts empty: nothing carries over
  x.save(); SHOT[s.id](x, u, d, t); x.restore();
  rect(x, 0, 560, LW, 80, P.void);
  // the lyric bar folds away in instrumental stretches longer than 4 s (intro, interlude, outro)
  const L = window.LYRICS.lines;
  let barOpen = 0;
  for (let i = 0; i < L.length; i++) {
    const a = i ? L[i - 1].end : -1e9, b = L[i].start;
    if (t >= a && t < b) { barOpen = b - a > 4 ? Math.max(1 - prog(t, a + 0.4, a + 0.8), prog(t, b - 0.9, b - 0.5)) : 1; break; }
    if (t >= L[i].start && t < L[i].end) { barOpen = 1; break; }
  }
  if (t >= L[L.length - 1].end) barOpen = 1 - prog(t, L[L.length - 1].end + 0.4, L[L.length - 1].end + 0.8);
  lyricBar(x, t, barOpen);
}
