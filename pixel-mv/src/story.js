'use strict';
/*
 * The film, shot by shot. Shot start times come from data/storyboard.js anchors
 * resolved against the aligned lyric times (data/lyrics.js), so actions land on
 * the sung phrases. Inside a shot, beats are placed at L('L05', frac) — a moment
 * inside a sung line — or at the shot's local time u.
 *
 * Every shot is draw(x, u, d, t): u = seconds into the shot, d = its length,
 * t = song time (ambient loops: rain, blinks, flicker). Characters move by
 * position functions of time (walk speed ≈ 26 px/s, one stride per 16 px),
 * trains and buses brake and pull away with constant (de)celeration.
 */
const ITEMS = {
  song: { icon: 'headphones', name: '一首歌', note: '他说下雨天适合听这首。', from: '阿屿 · 雾港 23:44' },
  bookmark: { icon: 'bookmark', name: '珊瑚色书签', note: '夹在第 117 页，同一句话下面。', from: '阿屿寄来的书里' },
  photo: { icon: 'photo', name: '晴天小铺的照片', note: '傍晚六点，门口的灯刚亮。', from: '小晴拍下，发给阿屿' },
  ticket: { icon: 'ticket', name: '渡轮船票', note: '雾港北站 → 风见站 · 22:15', from: '阿屿在雾港北站买下', used: '渡轮停航 · 已作废', void: true },
  ticket2: { icon: 'ticket', name: '改签车票', note: '雾港北站 → 风见站 · 山线', from: '再次连接之后改签' },
};

// ------------------------------------------------------------- time helpers
function lyricLine(id) { return (window.LYRICS.lines || []).find(l => l.id === id); }
function L(id, f = 0) { const l = lyricLine(id); return l ? l.start + (l.end - l.start) * f : 0; }
function Lend(id) { const l = lyricLine(id); return l ? l.end : 0; }
let SHOTS = null;
function buildShots() {
  const intro = L('L01');
  SHOTS = window.BOARD.shots.map(s => {
    const a = s.at;
    const start = typeof a === 'number' ? a : a.intro !== undefined ? intro * a.intro : a.lineEnd ? Lend(a.lineEnd) + (a.off || 0) : L(a.line) + (a.off || 0);
    return { ...s, start };
  });
  SHOTS.forEach((s, i) => { s.end = i + 1 < SHOTS.length ? SHOTS[i + 1].start : SONG.duration; });
}
function shotAt(t) { for (let i = SHOTS.length - 1; i >= 0; i--) if (t >= SHOTS[i].start) return SHOTS[i]; return SHOTS[0]; }
const beat = (t, a, b) => clamp((t - a) / (b - a));
// Walking from x0 to x1 between t0 and t1: position, whether moving, stride phase.
function walk(t, t0, t1, x0, x1) {
  const u = beat(t, t0, t1), px = lerp(x0, x1, u), moving = t > t0 && t < t1;
  return { x: px, moving, phase: moving ? Math.abs(px - x0) / 16 : null, dir: x1 >= x0 ? 'right' : 'left' };
}
// In B's mirrored room, A-coordinates that grow move left on screen.
const roomDir = (who, d) => who === 'A' ? d : d === 'right' ? 'left' : d === 'left' ? 'right' : d;

// ------------------------------------------------------------- buffers and framing
const BUF = {};
function buf(name, w, h) { const k = name + w + 'x' + h; if (!BUF[k]) BUF[k] = canvas(w, h); return BUF[k]; }
// Medium shot: draw a location into a buffer at 1×, show a window of it at 2× (whole pixels).
function zoom2(x, R, bw, bh, sx, sy, draw) {
  const b = buf('z', bw, bh); b.x.setTransform(1, 0, 0, 1, 0, 0); b.x.globalAlpha = 1; rect(b.x, 0, 0, bw, bh, P.void);
  draw(b.x, { x: 0, y: 0, w: bw, h: bh });
  clip(x, R, () => { x.imageSmoothingEnabled = false; x.drawImage(b.c, ri(sx), ri(sy), R.w / 2, R.h / 2, R.x, R.y, R.w, R.h); });
}
function seam(x, y = 226, h = 4) { rect(x, 0, y, LW, h, P.void); for (let k = 2; k < LW; k += 6) rect(x, k, y + 1, 3, 1, P.night3); }
function split(x, top, bot) { clip(x, TOPR, () => top(TOPR)); clip(x, BOTR, () => bot(BOTR)); seam(x); }
function flash(x, u, at, R = PIC, col = P.white) { const k = u - at; if (k >= 0 && k < 1 / FPS) rect(x, R.x, R.y, R.w, R.h, col); else if (k >= 1 / FPS && k < 3 / FPS) shade(x, R.x, R.y, R.w, R.h, col, 0.4); }
// Pixel dissolve from black at the start of a shot (Bayer order, 2-px cells).
function dissolveIn(x, u, dur = 0.3, R = PIC) {
  const k = 1 - clamp(u / dur); if (k <= 0) return;
  x.fillStyle = P.void;
  for (let y = R.y; y < R.y + R.h; y += 2) for (let px = R.x; px < R.x + R.w; px += 2) if (BAYER[((y >> 1) & 3) * 4 + ((px >> 1) & 3)] < k) x.fillRect(px, y, 2, 2);
}
// A speech bubble above someone (screen coords of their head top).
function speech(x, px, py, s, u, f = FONT.small) {
  if (u < 0) return;
  const k = Math.min(1, u / 0.12), w = textWidth(s, f) + 10, h = f.size + 7, bx = ri(px - w / 2), by = ri(py - h - 6 + (1 - k) * 3);
  rect(x, bx, by, w, h, P.ink); rect(x, bx + 1, by + 1, w - 2, h - 2, P.cream0);
  rect(x, px - 2, by + h - 1, 5, 2, P.ink); rect(x, px - 1, by + h - 1, 3, 1, P.cream0); pset(x, px, by + h + 1, P.ink);
  text(x, s, bx + 5, by + 3, P.brown0, f);
}
// A warm, see-through memory of someone (every other pixel kept).
function memoryOf(x, who, fx, fy, o, t, a = 1) {
  const m = buf('mem', 26, 34); m.x.clearRect(0, 0, 26, 34);
  drawChar(m.x, who, 13, 32, { ...o, t });
  const img = m.x.getImageData(0, 0, 26, 34), D = img.data;
  for (let i = 0; i < D.length; i += 4) {
    const px = (i / 4) % 26, py = Math.floor(i / 4 / 26);
    if (D[i + 3] && BAYER[(py & 3) * 4 + (px & 3)] < a * 0.6) { D[i] = (D[i] + 255) / 2; D[i + 1] = (D[i + 1] + 200) / 2; D[i + 2] = (D[i + 2] + 130) / 2; } else D[i + 3] = 0;
  }
  m.x.putImageData(img, 0, 0);
  blit(x, m, fx - 13, fy - 32);
}
function headphonesOn(x, fx, fy, sit) { // over a back-view head
  const ox = ri(fx) - 7, hy = ri(fy) - 28 + (sit ? 6 : 0);
  hline(x, ox + 2, ox + 11, hy - 1, P.ink); hline(x, ox + 3, ox + 10, hy - 2, P.ink); hline(x, ox + 4, ox + 9, hy - 1, P.coral1);
  for (const cx of [ox - 1, ox + 13]) { rect(x, cx, hy + 5, 3, 6, P.ink); rect(x, cx + (cx < ox ? 1 : 0), hy + 6, 2, 4, P.coral0); }
}
function bokeh(x, R, t, warm) {
  skyBands(x, R.x, R.y, R.w, R.h, warm ? 'dusk' : 'night');
  for (let k = 0; k < 14; k++) { const cx = R.x + hash(k + 3) * R.w, cy = R.y + hash(k + 9) * R.h * 0.8, r = 6 + ri(hash(k + 1) * 10); x.save(); x.globalAlpha = 0.18 + 0.1 * Math.sin(t + k); ellipse(x, cx, cy, r, r, [P.amber2, P.coral3, P.amber3][k % 3]); x.restore(); }
}
function markerAlong(path, prog) { // a point along a MAP_NODES path, prog in segments
  const i = Math.min(path.length - 2, Math.floor(prog)), f = clamp(prog - i), A = MAP_NODES[path[i]], B = MAP_NODES[path[i + 1]];
  return { x: lerp(A.x, B.x, f), y: lerp(A.y, B.y, f) };
}

// ------------------------------------------------------------- HUD state through the story
// Local times: 雾港 is 5 hours ahead of 晴川 until they stand in the same place.
const H = (A, B, km, extra = {}) => ({ A, B, km, quest: '再见一面', ...extra });
const clockAt = (base, u, rate = 1 / 20) => clockText(base + u * rate * 60);

// ------------------------------------------------------------- the shots
const FX = {
  // Title, then the save menu. Two lit windows far apart on the dark ground line.
  S01(x, u, d, t) {
    rect(x, 0, 0, LW, LH, P.void);
    stars(x, 0, 0, LW, 300, t, 46, 2);
    const gy = 330;
    for (const [hx, col, who] of [[34, P.amber1, 'A'], [214, P.amber2, 'B']]) {
      block(x, hx, gy - 26, 26, 26, P.night1); poly(x, [[hx - 3, gy - 26], [hx + 13, gy - 38], [hx + 29, gy - 26]], P.night1);
      block(x, hx + 8, gy - 18, 10, 9, mod(t * 0.5 + (who === 'B' ? 0.5 : 0), 1) < 0.92 ? col : P.night3);
    }
    hline(x, 0, LW, gy, P.night2);
    for (let k = 62; k < 212; k += 6) if (mod(k - t * 10, 12) < 6) pset(x, k, gy - 14, P.night4);
    const a = beat(u, 0.5, 1.4);
    if (u < 2.8) { if (a > 0) titleCard(x, a, t); dissolveIn(x, u - 0.4, 0.8, { x: 0, y: 100, w: LW, h: 120 }); }
    else {
      const sel = u < 3.5 ? 0 : u < 4.1 ? 1 : 2;
      saveMenu(x, 14, 150 - ri((1 - opening(u - 2.8, 0.25)) * 20), sel, t, u > 4.55);
      if (u > 4.6) dissolveIn(x, 1 - (u - 4.6) / 0.4, 1, { x: 0, y: 0, w: LW, h: LH });
    }
  },

  // Two rooms at once: he types and sends; across the seam her phone lights up.
  S02(x, u, d, t) {
    const sendAt = 4.4, arrive = 5.7;
    split(x, R => {
      room(x, 'A', R, { view: 'night', rain: 0.6, lamp: 1, clock: 1420 + u / 6, mugHeat: 0.6, phoneHeld: true, person: { sit: true, dir: 'back', pose: 'phone', holding: 'phone' } }, t);
    }, R => {
      const wk = walk(u, 6.4, 7.8, ROOM.spots.window[0], ROOM.chair), seated = u >= 7.9;
      const person = seated ? { sit: true, dir: 'back', pose: 'phone', holding: 'phone' }
        : u < 6.3 ? { x: ROOM.spots.window[0], y: 78, dir: u > 5.9 ? roomDir('B', 'right') : 'back' }
          : { x: wk.x, y: lerp(78, 79, beat(u, 6.4, 7.8)), dir: roomDir('B', wk.dir), walk: wk.phase };
      const buzz = u > arrive && u < arrive + 1.2 && mod(t * 14, 1) < 0.5;
      room(x, 'B', R, { view: 'dusk', lamp: 1, clock: 1120 + u / 6, mugHeat: 0.9, phoneLit: u > arrive, phoneHeld: seated, person }, t);
      if (buzz) { pset(x, R.x + roomX('B', 140, 7) - 2, R.y + 47, P.cream0); pset(x, R.x + roomX('B', 140, 7) + 8, R.y + 47, P.cream0); }
    });
    flyingBubble(x, roomX('A', 128) + 6, TOPR.y + 56, roomX('B', 140, 7) + 3, BOTR.y + 46, beat(u, sendAt, arrive), 'A');
    if (u > sendAt - 0.6 && u < sendAt + 1.2) speech(x, roomX('A', 128), TOPR.y + 54, '晚安，下雨了', u - (sendAt - 0.6));
    dissolveIn(x, u, 0.35);
  },

  // L01 — she puts the song on.
  S03(x, u, d, t) {
    const cx = roomX('B', ROOM.chair);
    zoom2(x, TOPR, LW, 188, cx - 67, 20, (b, R) => {
      room(b, 'B', R, { view: 'dusk', lamp: 1, clock: 1124, phoneHeld: true, person: { sit: true, dir: 'back', pose: 'phone', holding: 'phone', lookDown: true } }, t);
      if (u > 0.5) headphonesOn(b, cx, 79, true);
      for (let k = 0; k < 3; k++) { const ph = mod(t * 0.45 + k / 3, 1); if (u > 0.8) text(b, '♪', cx + 8 + ri(Math.sin(ph * 6 + k) * 3), 54 - ri(ph * 26), ph < 0.7 ? P.cream0 : P.coral3, FONT.tiny); }
    });
    seam(x);
    const R = BOTR;
    rect(x, R.x, R.y, R.w, R.h, P.night0);
    for (let k = 0; k < 40; k++) pset(x, R.x + hash(k) * R.w, R.y + hash(k + 5) * R.h, P.night2);
    musicCard(x, 20, R.y + 40, 230, clamp((u + 2) / 30), u > 0.4, t);
    toast(x, u - 0.6, 2.6, ITEMS.song, R.y + 120);
  },

  // L02 — the bookmark at page 117, the same line underlined.
  S04(x, u, d, t) {
    const R = PIC;
    planks(x, R.x, R.y, R.w, R.h, P.wood3, '#94633a', P.wood2, 5);
    glow(x, 200, R.y + 60, 120, 70, P.amber2, 0.45);
    const bk = bookSpread(x, 135, R.y + 200, true, 116, 117, u > 1.6 ? 3 : undefined, beat(u, 1.6, 2.7));
    // the bookmark slides into the gutter, its tassel swinging
    const by = lerp(R.y + 40, bk.Y - 8, E.out(beat(u, 0.2, 1.1)));
    rect(x, bk.X + bk.w / 2 - 4, by, 8, 46, P.ink); rect(x, bk.X + bk.w / 2 - 3, by + 1, 6, 44, P.coral1); rect(x, bk.X + bk.w / 2 - 3, by + 1, 6, 3, P.coral0);
    const sw = ri(Math.sin(t * 3) * 2); line(x, bk.X + bk.w / 2, by + 46, bk.X + bk.w / 2 + sw, by + 56, P.coral2);
    // her hand: carries the bookmark in, then follows the line with a finger
    const hx = u < 1.2 ? lerp(300, bk.X + bk.w / 2 + 22, E.out(beat(u, 0, 1.0))) : lerp(bk.X + bk.w / 2 + 34, bk.X + bk.w / 2 + 112, beat(u, 1.6, 2.7));
    const hy = u < 1.2 ? by + 30 : bk.Y + 14 + 3 * 11 + 18;
    hand(x, 'B', hx, hy, u < 1.2 ? 'hold' : 'point', -1, 2);
    toast(x, u - 0.4, 2.7, ITEMS.bookmark, R.y + 8);
  },

  // L03 / L04 — she photographs the shop and sends it.
  S05(x, u, d, t) {
    const R = PIC, gy = streetGround(R), cam = lerp(0, 24, beat(u, 0, d));
    const wk = walk(u, 0, 1.9, 4, 72);
    street(x, R, { time: 'dusk', camX: cam, walkers: [{ x: 230 - u * 20, dir: 'left', phase: u * 1.6, who: 'A' }] }, t);
    const bx = wk.x - cam, shooting = u > 1.9 && u < 3.0;
    charShadow(x, bx, gy + 10);
    drawChar(x, 'B', bx, gy + 10, { dir: 'right', walk: wk.phase, t, pose: shooting ? 'phone' : u > 3 ? 'phone' : 'down', holding: shooting || u > 3 ? 'phone' : null, face: u > 2.6 && u < 3.6 ? 'smile' : '' });
    // viewfinder brackets on the shop, then the shutter
    const vf = { x: 30 - cam, y: gy - 84, w: 112, h: 84 };
    if (u > 1.9 && u < 2.55) for (const [cx, cy, sx, sy] of [[vf.x, vf.y, 1, 1], [vf.x + vf.w, vf.y, -1, 1], [vf.x, vf.y + vf.h, 1, -1], [vf.x + vf.w, vf.y + vf.h, -1, -1]]) { hline(x, cx, cx + sx * 8, cy, P.white); vline(x, cx, cy, cy + sy * 8, P.white); }
    flash(x, u, 2.55, R);
    if (u > 3.0) {
      const k = E.out(beat(u, 3.0, 3.5)), px = lerp(LW + 60, 196, k);
      polaroid(x, px, R.y + 108, beat(u, 3.4, 5.2), t);
      if (u > 5.6) { const s = '发送给 阿屿', w = textWidth(s, FONT.small) + 10; darkPanel(x, px - w / 2 - 4, R.y + 166, w + 8, 20); text(x, u > 6.3 ? '已发送 ✓' : s, px, R.y + 171, u > 6.3 ? P.green2 : P.cream0, FONT.small, { align: 'center' }); }
    }
  },

  // L05 / L06 — rain in his city; at a bus stop he sees her as she was.
  S06(x, u, d, t) {
    const R = PIC, gy = streetGround(R);
    const wk = walk(u, 0, 3.1, 120, 196), ax = wk.x, cam = ax - 110;
    street(x, R, { time: 'night', rain: 0.75, wet: true, camX: cam, shop: '深夜书店', walkers: [{ x: 360 - u * 24, dir: 'left', phase: u * 1.5, umbrella: P.night3, who: 'B' }, { x: 60 + u * 30, dir: 'right', phase: u * 1.8, umbrella: P.stone1 }] }, t);
    const memA = beat(u, 3.0, 3.8) * (1 - beat(u, 5.2, 6.0));
    if (memA > 0) memoryOf(x, 'B', 254 - cam, gy + 4, { dir: 'front', sit: true, pose: 'phone', holding: 'phone' }, t, memA);
    const sx = ax - cam, turned = u > 3.3;
    charShadow(x, sx, gy + 10);
    drawChar(x, 'A', sx, gy + 10, { dir: turned ? 'back' : 'right', walk: wk.phase, t, pose: 'umbrella' });
    blit(x, 'umbrella_open', sx - 8 + (turned ? 0 : 2), gy - 26);
    if (u > 4.0 && u < 5.6) speech(x, sx, gy - 30, '她也在这样的车站等过车吧', u - 4.0);
  },

  // L07 / L08 — two windows, then two hands on two panes.
  S07(x, u, d, t) {
    const cut = 3.6;
    if (u < cut) {
      split(x, R => {
        const wk = walk(u, 0, 1.0, 80, ROOM.spots.window[0]);
        room(x, 'A', R, { view: 'night', rain: 0.6, lamp: 0, clock: 40, person: { x: wk.x, y: 78, dir: u < 1.0 ? 'left' : 'back', walk: wk.phase, pose: u > 1.3 ? 'raise' : 'down' } }, t);
      }, R => {
        const wk = walk(u, 0.2, 1.2, 80, ROOM.spots.window[0]);
        room(x, 'B', R, { view: 'dusk', lamp: 0, clock: 1180, person: { x: wk.x, y: 78, dir: u < 1.2 ? 'right' : 'back', walk: wk.phase, pose: u > 1.5 ? 'raise' : 'down' } }, t);
      });
      dissolveIn(x, u, 0.25);
      return;
    }
    const v = u - cut, gap = ri(lerp(14, 6, E.inOut(beat(v, 1.5, 4.4))));
    const Lr = { x: 0, y: PIC.y, w: LW / 2 - 2, h: PIC.h }, Rr = { x: LW / 2 + 2, y: PIC.y, w: LW / 2 - 2, h: PIC.h };
    clip(x, Lr, () => { windowView(x, Lr.x, Lr.y, Lr.w, Lr.h, { view: 'night', rain: 0.7, seed: 4 }, t); glassRain(x, Lr.x, Lr.y, Lr.w, Lr.h, t, 3); shade(x, Lr.x, Lr.y, Lr.w, Lr.h, P.night0, 0.2); hand(x, 'A', LW / 2 - gap - 66, PIC.y + 196, 'open', 1, 3); });
    clip(x, Rr, () => { windowView(x, Rr.x, Rr.y, Rr.w, Rr.h, { view: 'dusk', seed: 7 }, t); glow(x, Rr.x + 70, Rr.y + 240, 90, 60, P.dusk4, 0.3); hand(x, 'B', LW / 2 + gap + 66, PIC.y + 196, 'open', -1, 3); });
    rect(x, LW / 2 - 2, PIC.y, 4, PIC.h, P.void);
    text(x, '雾港 00:42', 8, PIC.y + 8, P.cream1, FONT.small); text(x, '晴川 19:42', LW - 8, PIC.y + 8, P.cream1, FONT.small, { align: 'right' });
    dissolveIn(x, v, 0.2);
  },

  // L09 / L10 — a busy crossing; her message makes him smile.
  S08(x, u, d, t) {
    const R = PIC, gy = streetGround(R), cam = 60;
    const cars = [
      { x: -40 + mod(u * 150, 520), kind: 'taxi', col: P.amber1, dir: 1 },
      { x: 520 - mod(u * 120 + 200, 560), kind: 'car', col: P.blue1, dir: -1 },
      { x: -200 + mod(u * 110 + 260, 640), kind: 'car', col: P.coral1, dir: 1 },
    ];
    const walkers = [];
    for (let k = 0; k < 5; k++) walkers.push({ x: mod(k * 97 + u * (k % 2 ? 22 : -26), 420) - 30 + cam, dir: k % 2 ? 'right' : 'left', phase: u * 1.6 + k * 0.3, who: k % 3 ? 'A' : 'B', col: k % 2 ? P.night0 : P.stone0, dy: k % 2 ? -4 : 0 });
    const ax = 150 - cam;
    street(x, R, { time: 'night', wet: true, camX: cam, cars, walkers, crosswalk: 200, under: () => {
      charShadow(x, ax, gy + 12);
      drawChar(x, 'A', ax, gy + 12, { dir: 'front', t, pose: 'phone', holding: 'phone', face: u > 3.3 ? 'smile' : '', lookDown: u < 3.3 });
    } }, t);
    // pedestrian light
    const lx = 196 - cam; rect(x, lx, gy - 60, 3, 60, P.stone0); block(x, lx - 4, gy - 76, 11, 18, P.ink);
    const green = u > 4.4; rect(x, lx - 2, gy - 74, 7, 6, green ? P.night2 : P.coral0); rect(x, lx - 2, gy - 66, 7, 6, green ? P.green2 : P.night2);
    if (u > 2.6) { const k = u - 2.6; if (k < 0.5 && Math.floor(k * 16) % 2) { pset(x, ax - 6, gy - 14, P.cream0); pset(x, ax + 6, gy - 14, P.cream0); } }
    if (u > 2.9) speech(x, ax, gy - 22, '小晴：今天很开心！你呢？', u - 2.9);
  },

  // L11 / L12 — her tea goes cold; she writes, deletes, sends.
  S09(x, u, d, t) {
    const sendAt = L('L12', 0.62) - shotAt(t).start;
    clip(x, TOPR, () => room(x, 'B', TOPR, { view: 'night', lamp: 1, clock: 1330 + u / 4, mugHeat: lerp(0.8, 0.05, beat(u, 0, 4)), phoneHeld: true, person: { sit: true, dir: 'back', pose: 'phone', holding: 'phone', lookDown: true } }, t));
    seam(x);
    const R = BOTR; rect(x, R.x, R.y, R.w, R.h, P.night0); glow(x, 135, R.y + 100, 110, 70, P.coral2, 0.25);
    let draft = '';
    const s1 = '我想你', s2 = '想你了';
    if (u < 1.8) draft = typed(s1, u, 0.4, 5);
    else if (u < 2.6) draft = [...s1].slice(0, Math.max(0, 3 - Math.floor((u - 1.8) * 6))).join('');
    else if (u < sendAt) draft = typed(s2, u, 3.0, 4);
    const msgs = [{ from: 'A', text: '雾港又下雨了' }, { from: 'A', text: '你那边呢？' }, { from: 'B', text: '晴天。我拍了小铺' }];
    if (u >= sendAt) msgs.push({ from: 'B', text: s2, at: shotAt(t).start + sendAt });
    phoneScreen(x, 60, R.y + 24, 150, 150, { who: 'B', msgs, draft: u < sendAt ? draft : '', pressSend: u > sendAt - 0.12 && u < sendAt + 0.1, status: '离线 · 雾港 03:10' }, t);
    hand(x, 'B', 196, R.y + 170, 'press', -1, 2);
  },

  // L13 / L14 — the map: 2180 km, a meeting point between them.
  S10(x, u, d, t) {
    const fog = 1;
    worldMap(x, PIC, { fog, reached: ['A_home', 'B_home'], pulse: u > 1.6 ? 'hub' : null, markers: [{ x: 214, y: 54, who: 'A' }, { x: 54, y: 334, who: 'B' }] }, t);
    const a = MAP_NODES.A_home, b = MAP_NODES.B_home, n = 80;
    for (let k = 0; k <= n * clamp(u / 1.4); k++) if (mod(k - ri(t * 6), 4) < 2) rect(x, lerp(a.x, b.x, k / n), PIC.y + lerp(a.y, b.y, k / n), 2, 2, P.coral1);
    if (u > 1.2) { const s = '2180 km', w = textWidth(s, FONT.ui) + 10; darkPanel(x, 134 - w / 2, PIC.y + 180, w + 4, 22); text(x, s, 136, PIC.y + 185, P.amber2, FONT.ui, { align: 'center' }); }
    questNotice(x, u - 2.0, 4.8, '周六，在风见站见面', '中间点', false);
    if (u > 3.4) statBar(x, 12, PIC.y + PIC.h - 34, 150, '想见你', lerp(0.62, 0.92, beat(u, 3.4, 7.5)), P.coral0, t);
    dissolveIn(x, u, 0.4);
  },

  // L15 / L16 — he buys a ticket; the night train brakes in; he boards.
  S11(x, u, d, t) {
    const R = PIC, gy = platformGround(R);
    const fx = trainArrival(u, 0.6, 214, 3.4), doors = beat(u, 4.2, 4.6) * (1 - beat(u, 6.2, 6.6));
    platform(x, R, { time: 'night', sign: '雾港北站', signX: 70, train: { x: fx, doorsOpen: doors }, benches: [16], board: true }, t);
    passerby(x, 40, gy + 30, { dir: 'front', phase: null, col: P.night0 }, t, true);
    const wk = walk(u, 4.7, 5.7, 120, 154), inside = u > 5.75;
    if (!inside) { const y = lerp(gy + 24, gy + 6, beat(u, 4.7, 5.7)); charShadow(x, wk.x, y); drawChar(x, 'A', wk.x, y, { dir: u > 4.6 ? 'right' : 'front', walk: wk.phase, t, pose: u < 2.6 ? 'give' : 'down', holding: u < 2.6 ? 'ticket' : null }); }
    toast(x, u - 0.3, 2.6, ITEMS.ticket);
  },

  // L17 / L18 — her bus pulls in at the 17 stop, and away.
  S12(x, u, d, t) {
    const R = PIC, gy = streetGround(R), cam = 128;
    const busX = u < 6.0 ? trainArrival(u, 1.4, 286, 3.2, 360) : trainDeparture(u, 6.0, 286, 40);
    const door = beat(u, 4.6, 4.9) * (1 - beat(u, 5.7, 6.0));
    const sitting = u < 4.7, bx = 256 - cam;
    street(x, R, { time: 'dusk', camX: cam, cars: [{ x: busX, kind: 'bus', col: P.blue1, door }], under: () => {
      // she sits on the shelter bench, stands as the doors open, steps on (the bus is nearer the camera)
      if (u < 5.2) drawChar(x, 'B', u < 4.7 ? bx : lerp(bx, bx + 6, beat(u, 4.7, 5.2)), sitting ? gy - 3 : gy + 6, { dir: sitting ? 'front' : 'right', sit: sitting, t, pose: sitting ? 'phone' : 'down', holding: sitting ? 'phone' : null, walk: sitting ? null : u * 2 });
    } }, t);
    const s = '17 路 · 往 晴川站'; if (u < 1.6) { darkPanel(x, 8, R.y + 8, textWidth(s, FONT.small) + 14, 20); text(x, s, 15, R.y + 13, P.cream0, FONT.small); }
  },

  // L19 — both set out on the map; then the ferry is cancelled.
  S13(x, u, d, t) {
    const pa = lerp(0, 2, beat(u, 0, 2.6)), pb = lerp(0, 1.55, beat(u, 0, 4.2)), cut = u > 2.9;
    const pathA = ['A_home', 'A_st', 'port'], pathB = ['B_home', 'B_st', 'hub'];
    const ma = markerAlong(pathA, pa), mb = markerAlong(pathB, pb);
    worldMap(x, PIC, { fog: 0.9, ferryCut: cut, reached: ['A_home', 'B_home', ...(pa > 1 ? ['A_st'] : []), ...(pa >= 2 ? ['port'] : []), ...(pb > 1 ? ['B_st'] : [])], routes: [{ path: pathA, prog: pa, col: P.blue0 }, { path: pathB, prog: pb, col: P.coral0 }], markers: [{ ...ma, who: 'A' }, { ...mb, who: 'B' }], pulse: cut ? 'port' : null }, t);
    if (cut) { const k = u - 2.9; if (k < 2.4) { if (k > 0.2 || Math.floor(k * 30) % 2) { darkPanel(x, 40, PIC.y + 160, 190, 40, { edge: P.coral1 }); chip(x, '公告', 48, PIC.y + 166, P.coral1, P.white, FONT.tiny); text(x, '渡轮停航 · 海峡大雾', 135, PIC.y + 180, P.coral3, FONT.ui, { align: 'center' }); } } }
  },

  // L20 — he at the dark pier; she on her train, reading his message.
  S14(x, u, d, t) {
    split(x, R => {
      pier(x, R, { sign: '停航', rain: 0.6 }, t);
      const gy = R.y + R.h - 44, leave = u > 6.2, wk = walk(u, 6.2, 9.8, 120, 40);
      const px = leave ? wk.x : 120;
      drawChar(x, 'A', px, gy + 14, { dir: leave ? 'left' : u > 3.2 && u < 5.6 ? 'front' : 'right', walk: wk.phase, t, pose: u > 3.2 && u < 5.6 ? 'phone' : 'umbrella', holding: u > 3.2 && u < 5.6 ? 'phone' : null, lookDown: u > 3.2 });
      if (!(u > 3.2 && u < 5.6)) blit(x, 'umbrella_open', px - 8, gy - 22);
    }, R => {
      const sp = lerp(1, 0.15, beat(u, 5.0, 9.0));
      trainInterior(x, R, { time: u < 5 ? 'dusk' : 'night', speed: sp }, t);
      const bx = 150, by = R.y + 120 + (mod(t * 1.7, 1) < 0.08 ? 1 : 0);
      drawChar(x, 'B', bx, by, { dir: 'front', sit: true, t, pose: 'phone', holding: 'phone', lookDown: u > 4.2, face: u > 4.6 ? 'down' : '' });
      passerby(x, 60, R.y + 120, { dir: 'front', phase: null, col: P.stone1 }, t, false);
      if (u > 4.2 && u < 7.6) speech(x, bx, by - 30, '阿屿：渡轮停航了，对不起', u - 4.2);
    });
  },

  // Interlude (no singing): his lamp is already out; hers comes on.
  S15(x, u, d, t) {
    split(x, R => {
      room(x, 'A', R, { view: 'night', rain: 0.3, lamp: 0, clock: 90 + u / 6, inBed: { phone: u < 4.2, face: u > 4.6 ? 'blink' : '' } }, t);
    }, R => {
      const door = beat(u, 0.1, 0.6) * (1 - beat(u, 2.0, 2.6));
      const wk = walk(u, 0.6, 2.8, ROOM.spots.door[0], ROOM.chair), sat = u > 2.9;
      const person = sat ? { sit: true, dir: 'back', pose: 'book', holding: 'book' } : { x: wk.x, y: lerp(70, 79, beat(u, 0.6, 2.8)), dir: roomDir('B', wk.dir), walk: wk.phase };
      room(x, 'B', R, { view: 'night', lamp: u > 3.3 ? 1 : 0, clock: 1230 + u / 6, door, person, cat: true }, t);
    });
  },

  // L21 / L22 — a video call; he lies in the dark, watching her.
  S16(x, u, d, t) {
    rect(x, TOPR.x, TOPR.y, TOPR.w, TOPR.h, P.night0);
    callScreen(x, 30, TOPR.y + 6, 210, 172, 'B', { view: 'dusk', label: '小晴 · 晴川 18:12', timer: `${pad2(Math.floor((761 + u) / 60))}:${pad2(Math.floor(761 + u) % 60)}`, face: u > L('L22', 0.4) - shotAt(t).start ? 'smile' : '' }, t);
    seam(x);
    clip(x, BOTR, () => room(x, 'A', BOTR, { view: 'night', lamp: 0, clock: 1392, inBed: { phone: true, face: u > 3.6 ? 'smile' : '' } }, t));
  },

  // L23 / L24 — his morning, her midnight; both keep walking.
  S17(x, u, d, t) {
    split(x, R => {
      const ax = 40 + u * 24, cam = ax - 100, gy = streetGround(R);
      street(x, R, { time: 'day', camX: cam, shop: '雾港书店' }, t);
      charShadow(x, ax - cam, gy + 10); drawChar(x, 'A', ax - cam, gy + 10, { dir: 'right', walk: u * 1.5, t, pose: 'bag' });
      if (u > 0.8 && u < 3.0) speech(x, ax - cam, gy - 22, '早安', u - 0.8);
    }, R => {
      const bx = 20 + u * 22, cam = bx - 100, gy = streetGround(R);
      street(x, R, { time: 'night', rain: 0.7, wet: true, camX: cam }, t);
      charShadow(x, bx - cam, gy + 10); drawChar(x, 'B', bx - cam, gy + 10, { dir: 'right', walk: u * 1.4, t, pose: 'umbrella' });
      blit(x, 'umbrella_open', bx - cam - 6, gy - 26);
      if (u > 1.3 && u < 3.4) speech(x, bx - cam, gy - 30, '晚安', u - 1.3);
    });
  },

  // L25 / L26 — the call freezes; the board still says 停航.
  S18(x, u, d, t) {
    const cut = 2.9;
    if (u < cut) {
      rect(x, PIC.x, PIC.y, PIC.w, PIC.h, P.night0);
      const frozen = u > 0.7 ? t - (u - 0.7) : 0;
      callScreen(x, 24, PIC.y + 20, 222, 250, 'A', { view: 'day', label: '阿屿 · 雾港 07:20', timer: u > 0.7 ? '' : '24:06', frozen, glitch: beat(u, 0.7, 2.4), frozenLabel: '连接中断' }, t);
      if (u > 1.2) speech(x, 135, PIC.y + 330, '喂？听得到吗？', u - 1.2, FONT.ui);
      return;
    }
    const v = u - cut;
    rect(x, PIC.x, PIC.y, PIC.w, PIC.h, P.night0);
    for (let k = 0; k < 6; k++) glow(x, 30 + k * 46, PIC.y + 40, 20, 8, P.amber1, 0.2);
    departureBoard(x, 135, PIC.y + 130, t, true);
    if (v > 1.0) { const it = ITEMS.ticket; panel(x, 40, PIC.y + 240, 190, 50); blit(x, 'ticket', 52, PIC.y + 255, { scale: 2 }); line(x, 52, PIC.y + 255, 70, PIC.y + 264, P.coral1); text(x, it.name, 82, PIC.y + 250, P.brown0, FONT.ui); text(x, it.used, 82, PIC.y + 266, P.coral1, FONT.small); }
    dissolveIn(x, v, 0.2);
  },

  // L27 / L28 — she goes through what he gave her, and chooses.
  S19(x, u, d, t) {
    const confirm = L('L28', 0.78) - shotAt(t).start;
    clip(x, TOPR, () => room(x, 'B', TOPR, { view: 'night', lamp: 1, clock: 1400 + u / 6, phoneHeld: true, person: { x: 96, y: 128, dir: 'front', pose: 'phone', holding: 'phone', lookDown: u < confirm, face: u > confirm + 0.3 ? 'smile' : '' } }, t));
    seam(x);
    rect(x, BOTR.x, BOTR.y, BOTR.w, BOTR.h, P.night0);
    const sel = u < 0.9 ? 0 : u < 1.8 ? 1 : u < 2.7 ? 2 : 3;
    inventory(x, 12, BOTR.y + 14, 246, [ITEMS.song, ITEMS.bookmark, ITEMS.photo, ITEMS.ticket], sel, t, { h: 112 });
    if (u > 3.2) {
      const s = u < confirm - 1.0 ? 0 : 1;
      choice(x, 72, BOTR.y + 134, ['继续等待', '再次连接'], s, t, { w: 126 });
      if (u > confirm && u < confirm + 0.12) rect(x, 72, BOTR.y + 134, 126, 46, P.amber3);
    }
    if (u > confirm + 0.2) { const k = u - confirm - 0.2; text(x, '勇气 +1', 200, TOPR.y + 100 - ri(Math.min(k, 1) * 10), P.amber2, FONT.ui); }
  },

  // L29 — this time both send at once; then both leave.
  S20(x, u, d, t) {
    const send = 1.8;
    split(x, R => {
      const wk = walk(u, 3.8, 5.6, ROOM.chair, ROOM.spots.door[0]), door = beat(u, 5.3, 5.7);
      const person = u < 3.6 ? { sit: true, dir: 'back', pose: 'phone', holding: 'phone' } : u > 5.9 ? null : { x: wk.x, y: lerp(79, 70, beat(u, 3.8, 5.6)), dir: u > 5.5 ? 'back' : 'right', walk: wk.phase, pose: 'bag' };
      room(x, 'A', R, { view: 'day', lamp: 0, clock: 420 + u / 6, phoneHeld: u < 3.6, person, door }, t);
    }, R => {
      const wk = walk(u, 4.1, 5.9, ROOM.chair, ROOM.spots.door[0]), door = beat(u, 5.6, 6.0);
      const person = u < 3.9 ? { sit: true, dir: 'back', pose: 'phone', holding: 'phone' } : u > 6.2 ? null : { x: wk.x, y: lerp(79, 70, beat(u, 4.1, 5.9)), dir: u > 5.8 ? 'back' : roomDir('B', 'right'), walk: wk.phase, pose: 'bag' };
      room(x, 'B', R, { view: 'night', lamp: 1, clock: 120 + u / 6, phoneHeld: u < 3.9, person, door }, t);
    });
    const k = beat(u, send, send + 1.0);
    flyingBubble(x, roomX('A', 128) + 6, TOPR.y + 56, 135, 226, k, 'A');
    flyingBubble(x, roomX('B', 128) - 6, BOTR.y + 56, 135, 230, k, 'B');
    if (u > send + 1.0 && u < send + 2.6) { const s = 2 + (u < send + 1.1 ? 1 : 0); blit(x, 'heart', 135 - 7 * s / 2, 228 - 6 * s / 2, { scale: s }); chip(x, '同时发送', 112, 238, P.coral1, P.white, FONT.tiny); }
    if (u > 0.4 && u < send) { speech(x, roomX('A', 128), TOPR.y + 54, '我想去见你', u - 0.4); speech(x, roomX('B', 128), BOTR.y + 54, '我想去见你', u - 0.6); }
  },

  // L31 / L32 — two trains, the mountain line and hers.
  S21(x, u, d, t) {
    split(x, R => {
      trainInterior(x, R, { time: 'day', speed: 1.2 }, t);
      const by = R.y + 120 + (mod(t * 1.7, 1) < 0.08 ? 1 : 0);
      drawChar(x, 'A', 110, by, { dir: 'front', sit: true, t, pose: u < 2.6 ? 'give' : 'down', holding: u < 2.6 ? 'ticket' : null });
      blit(x, 'bag', 128, by - 8);
      text(x, '山线 · 往 风见站', 8, R.y + 172, P.cream0, FONT.small);
    }, R => {
      trainInterior(x, R, { time: 'dusk', speed: 1 }, t);
      const by = R.y + 120 + (mod(t * 1.9 + 0.3, 1) < 0.08 ? 1 : 0);
      drawChar(x, 'B', 168, by, { dir: 'front', sit: true, t, face: u > 3.5 ? 'smile' : '' });
      text(x, '晴川站 → 风见站', LW - 8, R.y + 172, P.cream0, FONT.small, { align: 'right' });
    });
    toast(x, u - 0.3, 2.6, ITEMS.ticket2, TOPR.y + 6);
  },

  // L33 / L34 — the routes meet at 风见站; the fog lifts.
  S22(x, u, d, t) {
    const pa = lerp(1, 3, E.inOut(beat(u, 0, 5.4))), pb = lerp(1, 2, E.inOut(beat(u, 0.4, 5.6)));
    const pathA = ['A_home', 'A_st', 'tunnel', 'hub'], pathB = ['B_home', 'B_st', 'hub'];
    const ma = markerAlong(pathA, pa), mb = markerAlong(pathB, pb), there = u > 5.6;
    worldMap(x, PIC, { fog: 1 - beat(u, 0, 5), ferryCut: true, showTunnel: true, reached: ['A_home', 'B_home', 'A_st', 'B_st', ...(pa > 2 ? ['tunnel'] : []), ...(there ? ['hub'] : [])], routes: [{ path: pathA, prog: pa, col: P.blue0 }, { path: pathB, prog: pb, col: P.coral0 }], markers: [{ x: ma.x - (there ? 6 : 0), y: ma.y, who: 'A' }, { x: mb.x + (there ? 6 : 0), y: mb.y, who: 'B' }], pulse: there ? 'hub' : null }, t);
    questNotice(x, u - 5.6, 1.6, '两人都抵达风见站', '', true);
  },

  // L35 / L36 — two phones, the same conversation.
  S23(x, u, d, t) {
    rect(x, PIC.x, PIC.y, PIC.w, PIC.h, P.dusk0); bokeh(x, PIC, t, true);
    const s0 = shotAt(t).start, at = [0.6, 1.8, 3.6, 4.6, 6.0, 7.2].map(v => s0 + v);
    const msgs = [{ from: 'A', text: '我到了', at: at[0] }, { from: 'B', text: '我也到了！', at: at[1] }, { from: 'A', text: '你在哪？', at: at[2] }, { from: 'B', text: '2 号站台', at: at[3] }, { from: 'A', text: '我在 1 号', at: at[4], read: true }, { from: 'B', text: '我看见天桥了', at: at[5] }];
    phoneScreen(x, 12, PIC.y + 40, 114, 230, { who: 'A', msgs, typingOther: u > 1.2 && u < 1.8 }, t);
    phoneScreen(x, 144, PIC.y + 40, 114, 230, { who: 'B', msgs, typingOther: u > 0.1 && u < 0.6 }, t);
    hand(x, 'A', 46, PIC.y + 300, 'hold', 1, 2); hand(x, 'B', 224, PIC.y + 300, 'hold', -1, 2);
  },

  // L37 / L38 — two platforms of one station; the rain stops, a rainbow.
  S24(x, u, d, t) {
    const rain = lerp(0.5, 0, beat(u, 0, 2.2)), bow = beat(u, 2.6, 4.6);
    split(x, R => {
      const gy = platformGround(R), wk = walk(u, 0, 3.4, 40, 120);
      platform(x, R, { time: 'dusk', sign: '风见站 1', signX: 200, rain, wet: true, rainbow: bow, benches: [210] }, t);
      charShadow(x, wk.x, gy + 24); drawChar(x, 'A', wk.x, gy + 24, { dir: u > 3.6 ? 'front' : 'right', walk: wk.phase, t, pose: 'bag', lookUp: u > 4.2 });
    }, R => {
      const gy = platformGround(R), wk = walk(u, 0.4, 3.8, 240, 160);
      platform(x, R, { time: 'dusk', sign: '风见站 2', signX: 70, rain, wet: true, rainbow: bow, benches: [20] }, t);
      charShadow(x, wk.x, gy + 24); drawChar(x, 'B', wk.x, gy + 24, { dir: u > 4.0 ? 'front' : 'left', walk: wk.phase, t, lookUp: u > 4.4 });
    });
  },

  // L39 — the two halves close into one picture: the same platform.
  S25(x, u, d, t) {
    const k = E.inOut(beat(u, 0.2, 2.4)), R = PIC, gy = platformGround(R);
    const b = buf('one', LW, LH); b.x.setTransform(1, 0, 0, 1, 0, 0);
    platform(b.x, R, { time: 'dusk', sign: '风见站', signX: 135, wet: true, rainbow: 1 - beat(u, 3, 6), benches: [120] }, t);
    const ax = 44, bx = lerp(226, 238, beat(u, 3.0, 5.0));
    charShadow(b.x, ax, gy + 24); drawChar(b.x, 'A', ax, gy + 24, { dir: u > 4.6 ? 'right' : 'front', t, pose: u > 5.2 ? 'raise' : 'bag' });
    charShadow(b.x, bx, gy + 24); drawChar(b.x, 'B', bx, gy + 24, { dir: u > 3.0 ? 'right' : 'front', walk: u > 3.0 && u < 5.0 ? u * 1.4 : null, t });
    const gap = ri((1 - k) * 60), mid = PIC.y + PIC.h / 2;
    x.imageSmoothingEnabled = false;
    x.drawImage(b.c, 0, PIC.y, LW, PIC.h / 2, 0, PIC.y - gap, LW, PIC.h / 2);
    x.drawImage(b.c, 0, mid, LW, PIC.h / 2, 0, mid + gap, LW, PIC.h / 2);
    if (gap > 0) { rect(x, 0, mid - gap, LW, gap * 2, P.void); seam(x, mid - 2); }
    if (u > 5.2 && u < 6.6) speech(x, ax, gy - 6, '小晴！', u - 5.2, FONT.ui);
  },

  // L40 / L41 — he walks toward her; she turns around.
  S26(x, u, d, t) {
    const R = PIC, gy = platformGround(R), wk = walk(u, 0.3, 4.8, 44, 150), turn = L('L41', 0.1) - shotAt(t).start;
    platform(x, R, { time: 'dusk', sign: '风见站', signX: 135, wet: true, benches: [120] }, t);
    const bx = 238;
    charShadow(x, wk.x, gy + 24); drawChar(x, 'A', wk.x, gy + 24, { dir: 'right', walk: wk.phase, t, pose: 'bag' });
    charShadow(x, bx, gy + 24); drawChar(x, 'B', bx, gy + 24, { dir: u > turn ? 'left' : 'right', t, face: u > turn + 0.6 ? 'smile' : '' });
    distanceTag(x, wk.x + 8, bx - 8, gy + 36, `${((bx - wk.x) / 17).toFixed(1)} m`, t);
  },

  // L42 / L43 — closer: two steps each, a look, a smile.
  S27(x, u, d, t) {
    const R = PIC, gy = platformGround(R);
    const wa = walk(u, 0.4, 2.6, 150, 196), wb = walk(u, 1.0, 2.8, 238, 214);
    zoom2(x, R, LW, LH, 134, gy - 140, (b, Rb) => {
      platform(b, R, { time: 'dusk', sign: '风见站', signX: 135, wet: true, benches: [120] }, t);
      charShadow(b, wa.x, gy + 24); drawChar(b, 'A', wa.x, gy + 24, { dir: 'right', walk: wa.phase, t, pose: 'bag', face: u > 4.2 ? 'smile' : '' });
      charShadow(b, wb.x, gy + 24); drawChar(b, 'B', wb.x, gy + 24, { dir: 'left', walk: wb.phase, t, face: u > 3.6 ? 'smile' : '' });
    });
    const sx = v => (v - 134) * 2, sy = v => PIC.y + (v - (gy - 140)) * 2;
    if (u < 3.4) distanceTag(x, sx(wa.x + 8), sx(wb.x - 8), sy(gy + 30), `${((wb.x - wa.x) / 17).toFixed(1)} m`, t);
    if (u > 4.6) { const k = u - 4.6; blit(x, 'heart', sx(205) - 7, sy(gy - 14) - ri(Math.min(k, 1) * 8), { scale: 2 }); }
  },

  // L44 — two hands, the same light.
  S28(x, u, d, t) {
    bokeh(x, PIC, t, true);
    const k = E.out(beat(u, 0, 1.5)), y = PIC.y + 190;
    hand(x, 'A', lerp(-40, 68, k), y, 'open', 1, 3);
    hand(x, 'B', lerp(310, 202, k), y + 2, 'open', -1, 3);
    if (u > 1.5) { const s = u - 1.5; for (let j = 0; j < 6; j++) { const a = j / 6 * TAU + s, r = 10 + s * 18; if (s < 1.2) pset(x, 135 + Math.cos(a) * r, y + Math.sin(a) * r * 0.7, P.amber3); } }
  },

  // L45 — the hug.
  S29(x, u, d, t) {
    const R = PIC, gy = platformGround(R);
    zoom2(x, R, LW, LH, 134, gy - 140, (b) => {
      platform(b, R, { time: 'dusk', sign: '风见站', signX: 135, wet: true, benches: [120] }, t);
      charShadow(b, 206, gy + 24, 12);
      drawChar(b, 'B', 212, gy + 24, { dir: 'left', t, pose: 'hug', face: 'smile', wind: true });
      drawChar(b, 'A', 201, gy + 24, { dir: 'right', t, pose: 'hug', face: 'smile' });
    });
    const sx = v => (v - 134) * 2, sy = v => PIC.y + (v - (gy - 140)) * 2;
    blit(x, 'heart', sx(206) - 7, sy(gy - 20) - ri(Math.sin(t * 3) * 2), { scale: 2 });
    questNotice(x, u - 0.4, 2.8, '再见一面', '', true);
  },

  // L46 — together; a train rushes past behind them.
  S30(x, u, d, t) {
    const R = PIC, gy = platformGround(R), fx = -140 + u * 190;
    platform(x, R, { time: 'dusk', sign: '风见站', signX: 135, train: { x: fx, col: P.cream1, stripe: P.blue1 }, wet: true, benches: [120] }, t);
    const wind = fx > 60 && fx < 900;
    charShadow(x, 200, gy + 24); charShadow(x, 214, gy + 24);
    drawChar(x, 'A', 200, gy + 24, { dir: 'front', t, face: u > 2 ? 'smile' : '' });
    drawChar(x, 'B', 214, gy + 24, { dir: 'front', t, wind, face: 'smile' });
    rect(x, 205, gy + 9, 4, 3, P.ink); rect(x, 206, gy + 10, 2, 1, P.skin0); // hands held between them
  },

  // L47 — the lamps come on; they sit on the bench, her head on his shoulder.
  S31(x, u, d, t) {
    const R = PIC, gy = platformGround(R);
    platform(x, R, { time: u < 3 ? 'dusk' : 'night', sign: '风见站', signX: 135, wet: true, benches: [120] }, t);
    if (u < 3) shade(x, R.x, R.y, R.w, R.h, P.night0, beat(u, 0, 3) * 0.3);
    const wa = walk(u, 0.6, 2.8, 200, 134), wb = walk(u, 0.8, 3.0, 214, 148), sat = u > 3.2;
    if (sat) {
      drawChar(x, 'A', 134, gy + 32, { dir: 'front', sit: true, t, face: 'smile' });
      drawChar(x, 'B', 147, gy + 32 + (u > 4.6 ? 1 : 0), { dir: 'front', sit: true, t, face: u > 4.6 ? 'blink' : 'smile' });
    } else {
      charShadow(x, wa.x, gy + 24); drawChar(x, 'A', wa.x, gy + 24, { dir: wa.moving ? 'left' : 'front', walk: wa.phase, t });
      charShadow(x, wb.x, gy + 24); drawChar(x, 'B', wb.x, gy + 24, { dir: wb.moving ? 'left' : 'front', walk: wb.phase, t });
    }
  },

  // L48 / L49 — the map again: two routes, one place.
  S32(x, u, d, t) {
    worldMap(x, PIC, { fog: 0, ferryCut: false, showTunnel: true, reached: Object.keys(MAP_NODES), routes: [{ path: ['A_home', 'A_st', 'tunnel', 'hub'], prog: 3, col: P.blue0 }, { path: ['B_home', 'B_st', 'hub'], prog: 2, col: P.coral0 }], markers: [{ x: 134, y: 246, who: 'A' }, { x: 146, y: 246, who: 'B' }], pulse: 'hub' }, t);
    blit(x, 'heart', 133, PIC.y + 214 - ri(Math.sin(t * 2.4) * 2));
    if (u > 1.0) { const s = '双人存档已更新', w = textWidth(s, FONT.ui) + 16; darkPanel(x, 8, PIC.y + 160, w, 26); text(x, s, 8 + w / 2, PIC.y + 167, P.amber2, FONT.ui, { align: 'center' }); }
    dissolveIn(x, u, 0.4);
  },

  // Results, then the last frame holds.
  S33(x, u, d, t) {
    rect(x, 0, 0, LW, LH, P.void); stars(x, 0, 0, LW, LH, t, 50, 6);
    const rows = [['距离', '2180 km → 0.0 m', P.coral3], ['时差', '5 小时 → 0'], ['发出的消息', '9,214 条'], ['说过的晚安', '214 次'], ['一起走过的站', '风见站'], ['存档', '第 216 天']];
    resultsCard(x, 120, rows, beat(u, 0.2, 1.6), t, u > 2.2 ? u - 2.2 : 0);
    if (u > 3.2) text(x, '多远都要在一起', LW / 2, 352, P.cream1, FONT.ui, { align: 'center' });
    dissolveIn(x, u, 0.4, { x: 0, y: 0, w: LW, h: LH });
  },
};

// HUD state per shot, in each person's local time.
const HUDS = {
  S02: u => H({ place: '家', clock: clockAt(1420, u), wx: 'rain', typing: u > 1 && u < 4.4 }, { place: '家', clock: clockAt(1120, u), wx: 'dusk' }, 2180),
  S03: u => H({ place: '家', clock: '23:46', wx: 'rain' }, { place: '家', clock: clockAt(1126, u), wx: 'dusk', note: '♪ 正在听' }, 2180),
  S04: u => H({ place: '家', clock: '23:49', wx: 'rain' }, { place: '家', clock: '18:49', wx: 'dusk' }, 2180),
  S05: u => H({ place: '家', clock: '23:58', wx: 'rain' }, { place: '小铺', clock: '18:58', wx: 'dusk' }, 2180),
  S06: u => H({ place: '街上', clock: '00:24', wx: 'rain' }, { place: '小铺', clock: '19:24', wx: 'dusk' }, 2180),
  S07: u => H({ place: '家', clock: '00:42', wx: 'rain' }, { place: '家', clock: '19:42', wx: 'dusk' }, 2180),
  S08: u => H({ place: '路口', clock: '19:31', wx: 'moon' }, { place: '家', clock: '14:31', wx: 'sun' }, 2180),
  S09: u => H({ place: '家', clock: '03:10', wx: 'moon', note: '睡着了' }, { place: '家', clock: clockAt(1330, u), wx: 'moon', typing: true }, 2180),
  S10: u => H({ place: '家', clock: '21:05', wx: 'moon' }, { place: '家', clock: '16:05', wx: 'sun' }, 2180, { quest: '周六 · 风见站' }),
  S11: u => H({ place: '北站', clock: clockAt(1290, u), wx: 'moon' }, { place: '家', clock: '16:30', wx: 'sun' }, lerp(2180, 2172, beat(u, 4, 6.8)), { quest: '周六 · 风见站' }),
  S12: u => H({ place: '路上', clock: '21:50', wx: 'moon' }, { place: '车站', clock: clockAt(1010, u), wx: 'dusk' }, lerp(2172, 2141, beat(u, 5, 6.9)), { quest: '周六 · 风见站' }),
  S13: u => H({ place: '渡口', clock: '22:10', wx: 'rain' }, { place: '路上', clock: '17:10', wx: 'dusk' }, lerp(2141, 2052, beat(u, 0, 3)), { quest: '周六 · 风见站' }),
  S14: u => H({ place: '渡口', clock: clockAt(1360, u), wx: 'rain', note: '渡轮停航' }, { place: '列车', clock: clockAt(1060, u), wx: 'dusk' }, lerp(2052, 2180, beat(u, 5, 9.8)), { quest: '周六 · 风见站' }),
  S15: u => H({ place: '家', clock: clockAt(90, u), wx: 'rain' }, { place: '家', clock: clockAt(1230, u), wx: 'moon' }, 2180),
  S16: u => H({ place: '家', clock: clockAt(1392, u), wx: 'moon', note: '通话中' }, { place: '家', clock: clockAt(1092, u), wx: 'dusk', note: '通话中' }, 2180),
  S17: u => H({ place: '街上', clock: clockAt(370, u), wx: 'sun' }, { place: '街上', clock: clockAt(70, u), wx: 'rain' }, 2180),
  S18: u => H({ place: '家', clock: '07:20', wx: 'sun', note: u > 0.7 ? '信号弱' : '' }, { place: '家', clock: '02:20', wx: 'rain' }, 2180),
  S19: u => H({ place: '家', clock: '04:20', wx: 'moon' }, { place: '家', clock: clockAt(1400, u), wx: 'moon' }, 2180),
  S20: u => H({ place: '家', clock: clockAt(420, u), wx: 'sun', typing: u < 1.8 }, { place: '家', clock: clockAt(120, u), wx: 'moon', typing: u < 1.8 }, 2180, { quest: '再见一面 · 风见站' }),
  S21: u => H({ place: '山线', clock: clockAt(780, u), wx: 'sun' }, { place: '列车', clock: clockAt(480, u), wx: 'dusk' }, lerp(2180, 960, beat(u, 0, 7)), { quest: '再见一面 · 风见站' }),
  S22: u => H({ place: '隧道', clock: clockAt(1000, u), wx: 'sun' }, { place: '风见站', clock: clockAt(1030, u), wx: 'dusk' }, lerp(960, 0.3, E.inOut(beat(u, 0, 5.6))), { quest: '再见一面 · 风见站' }),
  S23: u => H({ place: '风见站', clock: '17:20', wx: 'dusk' }, { place: '风见站', clock: '17:20', wx: 'dusk' }, 0.3, { quest: '再见一面 · 风见站' }),
  S24: u => H({ place: '1号站台', clock: '17:28', wx: 'rain' }, { place: '2号站台', clock: '17:28', wx: 'rain' }, 0.12, { quest: '再见一面 · 风见站' }),
  S25: u => H({ place: '风见站', clock: '17:30', wx: 'dusk' }, { place: '风见站', clock: '17:30', wx: 'dusk' }, 0.0114, { quest: '再见一面 · 风见站' }),
  S26: (u, t) => { const wk = walk(u, 0.3, 4.8, 44, 150); return H({ place: '风见站', clock: '17:31', wx: 'dusk' }, { place: '风见站', clock: '17:31', wx: 'dusk' }, (238 - wk.x) / 17 / 1000, { quest: '再见一面 · 风见站' }); },
  S27: u => H({ place: '风见站', clock: '17:32', wx: 'dusk' }, { place: '风见站', clock: '17:32', wx: 'dusk' }, (lerp(88, 18, beat(u, 0.4, 2.8)) / 17) / 1000, { quest: '再见一面 · 风见站' }),
  S28: u => H({ place: '风见站', clock: '17:32', wx: 'dusk' }, { place: '风见站', clock: '17:32', wx: 'dusk' }, 0.0003, { quest: '再见一面 · 风见站' }),
  S29: u => H({ place: '风见站', clock: '17:33', wx: 'dusk' }, null, 0, { quest: '再见一面', done: u > 0.4, together: true }),
  S30: u => H({ place: '风见站', clock: '17:34', wx: 'dusk' }, null, 0, { quest: '再见一面', done: true, together: true }),
  S31: u => H({ place: '风见站', clock: clockAt(1060, u, 0.5), wx: 'moon' }, null, 0, { quest: '再见一面', done: true, together: true }),
  S32: u => H({ place: '风见站', clock: '18:12', wx: 'moon' }, null, 0, { quest: '再见一面', done: true, together: true }),
};

function drawFilm(x, t) {
  x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1;
  rect(x, 0, 0, LW, LH, P.void);
  const s = shotAt(t), u = t - s.start, d = s.end - s.start;
  (FX[s.id] || (() => {}))(x, u, d, t, s);
  if (s.id === 'S01' || s.id === 'S33') return;
  const h = HUDS[s.id]; if (h) hud(x, h(u, t), t);
  // the lyric bar folds away in instrumental gaps longer than 4 s
  const Ls = window.LYRICS.lines || [];
  let open = 1;
  const prev = [...Ls].reverse().find(l => l.end <= t), next = Ls.find(l => l.start > t), cur = Ls.find(l => t >= l.start && t < l.end);
  if (!cur) {
    const a = prev ? prev.end : 0, b = next ? next.start : SONG.duration;
    if (b - a > 4) open = 1 - clamp((t - a - 0.4) / 0.3) + clamp((t - (b - 0.7)) / 0.3);
  }
  lyricBand(x, t, clamp(open));
}
