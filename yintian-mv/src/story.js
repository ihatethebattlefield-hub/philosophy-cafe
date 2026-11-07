'use strict';
/*
 * 阴天 — the film, shot by shot. Shot starts come from data/storyboard.js anchors
 * resolved against the aligned lyrics; inside a shot, beats use the shot's local
 * time u (seconds). Every shot is draw(x, u, d, t, s).
 *
 * Contact rules used throughout: a hand reaches the cup handle before the cup
 * moves and leaves only after it is set down; a person leans forward before
 * standing and lands on the seat when sitting; heads turn before bodies; a
 * door opens before anyone passes it. Ambient motion stays small: the curtain,
 * clouds, a passing car's reflection, breathing, steam that thins and stops.
 */
function lyricLine(id) { return (window.LYRICS.lines || []).find(l => l.id === id); }
function L(id, f = 0) { const l = lyricLine(id); return l ? l.start + (l.end - l.start) * f : 0; }
function Lend(id) { const l = lyricLine(id); return l ? l.end : 0; }
let SHOTS = null;
function buildShots() {
  SHOTS = window.BOARD.shots.map(s => { const a = s.at; return { ...s, start: typeof a === 'number' ? a : a.lineEnd ? Lend(a.lineEnd) + (a.off || 0) : L(a.line) + (a.off || 0) }; });
  SHOTS.forEach((s, i) => { s.end = i + 1 < SHOTS.length ? SHOTS[i + 1].start : SONG.duration; });
}
function shotAt(t) { for (let i = SHOTS.length - 1; i >= 0; i--) if (t >= SHOTS[i].start) return SHOTS[i]; return SHOTS[0]; }
const beat = (t, a, b) => clamp((t - a) / (b - a));
const ease = (t, a, b) => E.inOut(beat(t, a, b));
function walk(t, t0, t1, a, b) { // a, b: [x, y]; eased start and stop, stride per 18 px
  const u = beat(t, t0, t1), e = u < 0.1 ? u * u / 0.2 : u > 0.9 ? 1 - (1 - u) * (1 - u) / 0.2 : u - 0.05, k = clamp(e / 0.9);
  const px = lerp(a[0], b[0], k), py = lerp(a[1], b[1], k), moving = t > t0 && t < t1;
  return { x: px, y: py, moving, phase: moving ? Math.hypot(px - a[0], py - a[1]) / 18 : null, dir: Math.abs(b[0] - a[0]) > Math.abs(b[1] - a[1]) ? (b[0] > a[0] ? 'right' : 'left') : (b[1] < a[1] ? 'back' : 'front') };
}

// ------------------------------------------------------------- framing
const FULL = { x: 0, y: 0, w: LW, h: LH };
// 2× shows a whole set; 3× is the natural medium (a third of the set's width, people at a readable size).
const CAM = { room: [3, 0, 0], roomWide: [2, 0, 0], roomRight: [3, 60, 40], kitchen: [2, 0, 0], sink: [3, 0, 0], entry: [3, 60, 10], rest: [3, 18, 86], wedding: [2, 0, 0], wedTable: [3, 30, 106], bus: [2, 0, 0], corridor: [3, 30, 0], reverse: [3, 30, 60], reverseDoor: [3, 60, 20], window: [3, 0, 0] };
const STAND = 152, DOOR_IN = [188, 164], WINDOW_AT = [12, 104]; // beside her chair; the way in from the hall; at the window
const BUFS = {};
function buf(name, w = SET_W, h = SET_H) { const k = name + w; if (!BUFS[k]) BUFS[k] = canvas(w, h); const b = BUFS[k]; b.x.setTransform(1, 0, 0, 1, 0, 0); b.x.globalAlpha = 1; rect(b.x, 0, 0, w, h, P.void); return b; }
function shoot(x, cam, draw) { const [z, sx, sy] = cam, b = buf('set'); draw(b.x, { x: 0, y: 0, w: SET_W, h: SET_H }); x.imageSmoothingEnabled = false; x.drawImage(b.c, sx, sy, LW / z, LH / z, 0, 0, LW, LH); }
function fadeIn(x, u, dur) { const k = 1 - clamp(u / dur); if (k <= 0) return; x.fillStyle = P.void; for (let y = 0; y < LH; y += 3) for (let px = 0; px < LW; px += 3) if (BAYER[((y / 3) & 3) * 4 + ((px / 3) & 3)] < k) x.fillRect(px, y, 3, 3); }
function dissolveTo(x, u, a, b, drawB) { // pixel dissolve between two pictures over [a, b]
  const k = beat(u, a, b); if (k <= 0) return; const B = canvas(LW, LH); drawB(B.x);
  for (let y = 0; y < LH; y += 3) for (let px = 0; px < LW; px += 3) if (BAYER[((y / 3) & 3) * 4 + ((px / 3) & 3)] < k) x.drawImage(B.c, px, y, 3, 3, px, y, 3, 3);
}

// ------------------------------------------------------------- the room's state
const HER = (o = {}) => ({ who: 'W', x: ROOM.chairL, y: ROOM.chairY, dir: 'right', sit: true, pose: 'table', ...o });
const HIM = (o = {}) => ({ who: 'M', x: ROOM.chairR, y: ROOM.chairY, dir: 'left', sit: true, pose: 'table', ...o });
// The present table: cup, photo (a corner under the receipt), the receipt, the ashtray, the pen.
function nowItems(o = {}) {
  return [{ k: 'receipt', x: 32, y: 18 }, { k: 'photo', x: o.photoX ?? 24, y: o.photoY ?? 14 }, { k: 'receipt', x: 34, y: 18 }, { k: 'cup', x: o.cupX ?? 22, y: o.cupY ?? 9, steam: o.steam || 0 }, { k: 'ash', x: 46, y: 8, smoke: o.smoke || 0 }, { k: 'pen', x: 6, y: 18 }];
}
const curtainAt = t => (Math.sin(t * 0.7) + 1) / 2 * 0.8 + (Math.sin(t * 1.9) > 0.9 ? 0.4 : 0);
// A passing car's reflection sliding across the back wall (a soft pale band).
function carReflect(x, X, Y, k) { if (k <= 0 || k >= 1) return; x.save(); x.globalAlpha = 0.16 * Math.sin(k * Math.PI); const rx = lerp(-20, 200, k); poly(x, [[X(rx), Y(4)], [X(rx + 14), Y(4)], [X(rx + 4), Y(88)], [X(rx - 10), Y(88)]], P.mist2); x.restore(); }

// ------------------------------------------------------------- the shots
const FX = {
  Y01(x, u, d, t) {
    shoot(x, u < 4.2 ? CAM.roomWide : CAM.room, (b, R) => roomSet(b, R, { period: 'now', items: nowItems({ smoke: 1 - beat(u, 0, 14) }), breathe: curtainAt(t), car: beat(u, 4.4, 6.6), chairL: true, after: (X, Y) => carReflect(b, X, Y, beat(u, 4.6, 6.8)) }, t));
    fadeIn(x, u, 1.4);
  },
  Y02(x, u, d, t) {
    const reach = u > 0.5 && u < 1.3, pull = beat(u, 1.3, 2.6);
    shoot(x, CAM.room, (b, R) => roomSet(b, R, { period: 'now', items: nowItems({ cupX: lerp(22, 17, pull), smoke: 0.4 }), breathe: curtainAt(t), people: [HER({ pose: reach ? 'reach' : u >= 1.3 ? 'cup' : 'lap', face: 'down' })] }, t));
  },
  Y03(x, u, d, t) { // the cup meets the photo; the hand stops, lets go, straightens the photo
    const slide = ease(u, 0.3, 1.2), hit = u > 1.2, fix = ease(u, 2.0, 3.0);
    const photo = { x: 120 + (hit ? lerp(6, 0, fix) : 6), y: 330 + (hit ? lerp(-5, 0, fix) : -5) };
    const cup = { x: lerp(262, 222, slide), y: lerp(292, 300, slide) };
    const hand = u < 1.6 ? { x: cup.x - 60, y: cup.y + 2, kind: 'cup' } : u < 1.9 ? { x: cup.x - 74, y: cup.y + 12, kind: 'flat' } : u < 3.2 ? { x: photo.x - 8, y: photo.y + 30, kind: 'pinch' } : { x: lerp(photo.x - 8, 20, beat(u, 3.2, 3.8)), y: photo.y + 60, kind: 'flat', on: u < 3.8 };
    tableTopClose(x, FULL, { period: 'now', photo, cup, hand, wobble: u > 1.2 && u < 1.5 }, t);
  },
  Y04(x, u, d, t) {
    shoot(x, CAM.room, (b, R) => roomSet(b, R, { period: 'now', items: nowItems({ cupX: 17, smoke: 0.2 * (1 - beat(u, 0, 2)) }), breathe: curtainAt(t), people: [HER({ pose: u < 1.2 ? 'cup' : 'table', face: u > 2.2 ? 'up' : 'down', headView: u > 2.4 ? 'side' : undefined, headFlip: u > 2.4 })] }, t));
  },
  Y05(x, u, d, t) {
    const shift = u > 3.6;
    shoot(x, CAM.room, (b, R) => roomSet(b, R, { period: 'now', items: nowItems({ cupX: 17 }), breathe: curtainAt(t), car: beat(u, 5.0, 6.8),
      people: [HER({ pose: shift ? 'lap' : 'table', face: shift ? 'down' : 'up', headView: shift ? undefined : 'side', headFlip: !shift, lean: shift ? 1 : 0 })],
      after: (X, Y) => carReflect(b, X, Y, beat(u, 5.2, 7.0)) }, t));
  },
  Y06(x, u, d, t) {
    const lift = 1 - ease(u, 0, 0.7);
    photoClose(x, FULL, { period: 'now', dy: lift * 60, thumbL: ri(Math.sin(beat(u, 1.4, 6.0) * Math.PI) * 26) }, t);
    inspectBox(x, 22, 120, '合照', u - 1.0, 2.6);
  },
  Y07(x, u, d, t) { ashClose(x, FULL, { smoke: lerp(0.7, 0, ease(u, 0.6, 2.8)), ember: u < 1.2 }, t); },
  Y08(x, u, d, t) {
    const f1 = beat(u, 0.3, 0.8), f2 = beat(u, 2.6, 3.1), back = f1 >= 0.5 && f2 < 0.5;
    const sq = f1 < 1 ? Math.abs(1 - f1 * 2) : f2 > 0 ? Math.abs(1 - f2 * 2) : 1;
    const B = canvas(LW, LH); photoClose(B.x, FULL, { period: 'now', back }, t);
    woodTop(x, FULL, 'now'); x.imageSmoothingEnabled = false; const w = Math.max(3, ri(LW * sq)); x.drawImage(B.c, 0, 0, LW, LH, ri((LW - w) / 2), 0, w, LH);
    if (back) inspectBox(x, 22, 120, '照片背面', u - 0.9, 1.7);
  },
  Y09(x, u, d, t) { // into the photo: the table in the picture becomes the table at the little restaurant
    photoClose(x, FULL, { period: 'now', hands: u < 0.8, dy: -ease(u, 0, 1.2) * 30 }, t);
    dissolveTo(x, u, 1.0, 2.4, (y) => restShot(y, 0, t, 'photo'));
  },
  Y10(x, u, d, t) { restShot(x, u, t, 'menu'); },
  Y11(x, u, d, t) { restShot(x, u, t, 'napkin'); },
  Y12(x, u, d, t) {
    if (u < 1.35) { restShot(x, u, t, 'collar'); if (u > 1.25) shade(x, 0, 0, LW, LH, P.white, 0.85); return; }
    restShot(x, 1.25, 1.25 + 51, 'collar', true); // the frame holds…
    const k = beat(u, 1.4, 1.9); if (k > 0) { photoClose(x, FULL, { period: 'now', hands: false }, t); fadeIn(x, 1 - k, 1); }
  },
  Y13(x, u, d, t) { // early: he brings two drinks and puts hers where she always keeps it
    const wk = walk(u, 0, 1.4, [150, 160], [ROOM.chairR + 12, STAND + 2]), placed = u > 1.6, sat = u > 2.3;
    shoot(x, CAM.roomWide, (b, R) => roomSet(b, R, { period: 'early', breathe: curtainAt(t) * 0.6,
      items: [{ k: 'paper', x: 18, y: 14 }, ...(placed ? [{ k: 'cup', x: 12, y: 9, steam: 0.9 }, { k: 'cup', kind: 'his', x: 42, y: 9, steam: 0.9 }] : [])],
      people: [HER({ pose: 'write', face: u > 1.8 ? 'smile' : 'down', headView: u > 1.8 && u < 2.8 ? 'side' : undefined }),
        sat ? HIM({ face: 'smile' }) : { who: 'M', x: wk.x, y: wk.y, dir: 'left', walk: wk.phase, pose: placed ? 'down' : 'give', holding: placed ? null : 'cup2' }] }, t));
  },
  Y14(x, u, d, t) { // early, night: he has fallen asleep on the table; she pulls the paper out, dims the lamp
    const pull = ease(u, 0.6, 1.5), dim = lerp(1, 0.4, ease(u, 2.0, 2.5));
    shoot(x, CAM.room, (b, R) => roomSet(b, R, { period: 'early', breathe: 0.2,
      items: [{ k: 'lamp', x: 48, y: 6, on: dim }, { k: 'paper', x: lerp(36, 16, pull), y: 14 }, { k: 'cup', x: 12, y: 9 }, { k: 'cup', kind: 'his', x: 30, y: 6 }],
      people: [HER({ pose: u > 0.5 && u < 1.6 ? 'reach' : u > 1.9 && u < 2.6 ? { near: [[6, 1], [15, -6]], far: [[4, 6], [10, 2]] } : 'table', face: 'down' }), HIM({ pose: 'sleep', slump: 5, lean: -2, face: 'closed' })] }, t));
    shade(x, 0, 0, LW, LH, P.ink, 0.18);
  },
  Y15(x, u, d, t) { // early: takeout, a crowded table; he moves his bowl so she can put her cup down
    const mv = ease(u, 0.4, 1.0), cupDown = u > 1.3;
    shoot(x, CAM.room, (b, R) => roomSet(b, R, { period: 'early', breathe: curtainAt(t) * 0.5,
      items: [{ k: 'box', x: 20, y: 4 }, { k: 'bowl', x: 14, y: 14, steam: 0.8 }, { k: 'bowl', x: lerp(32, 44, mv), y: 15, steam: 0.8 }, ...(cupDown ? [{ k: 'cup', x: 31, y: 11 }] : [])],
      people: [HER({ pose: u > 0.9 && u < 1.5 ? 'reach' : 'table', face: u > 1.5 ? 'smile' : '', holding: u > 0.9 && u < 1.4 ? 'cup' : null }), HIM({ pose: u > 0.3 && u < 1.1 ? 'reachStop' : 'table', face: 'smile' })] }, t));
  },
  Y16(x, u, d, t) { // later: she sets a paper by his hand; he notices only after a while
    const placed = u > 1.2, notice = u > 3.0;
    shoot(x, CAM.room, (b, R) => roomSet(b, R, { period: 'late', breathe: curtainAt(t) * 0.4,
      items: [{ k: 'cup', x: 14, y: 9 }, { k: 'cup', kind: 'his', x: 44, y: 9 }, ...(placed ? [{ k: 'paper', x: 32, y: 14 }] : [])],
      people: [HER({ pose: u > 0.3 && u < 1.3 ? 'reach' : 'lap', face: u > 1.6 ? 'down' : '' }), HIM({ pose: notice ? 'reachStop' : 'table', face: notice ? '' : 'down', headView: u < 3.0 ? undefined : undefined })] }, t));
  },
  Y17(x, u, d, t) { // later: one reads, the other looks out of the window; one cup drunk, one untouched
    shoot(x, CAM.room, (b, R) => roomSet(b, R, { period: 'late', breathe: curtainAt(t) * 0.4,
      items: [{ k: 'paper', x: 16, y: 14 }, { k: 'cup', x: 12, y: 8 }, { k: 'cup', kind: 'his', x: 44, y: 9 }],
      people: [HER({ pose: 'write', face: 'down' }), HIM({ pose: 'lap', headView: 'back', face: '' })] }, t));
  },
  Y18(x, u, d, t) { // the same picture three times: early, later, now
    const p = u < 1.8 ? 'early' : u < 3.6 ? 'late' : 'now';
    const items = p === 'early' ? [{ k: 'cup', x: 14, y: 9, steam: 0.9 }, { k: 'cup', kind: 'his', x: 42, y: 9, steam: 0.9 }] : p === 'late' ? [{ k: 'cup', x: 14, y: 9 }, { k: 'cup', kind: 'his', x: 42, y: 9 }] : nowItems({ cupX: 17 });
    const people = p === 'early' ? [HER({ face: 'smile' }), HIM({ face: 'smile', pose: 'cup' })] : p === 'late' ? [HER({ face: 'down', pose: 'lap' }), HIM({ headView: 'back', pose: 'lap' })] : [HER({ face: 'down', pose: 'lap' })];
    shoot(x, CAM.roomWide, (b, R) => roomSet(b, R, { period: p, items, people, breathe: curtainAt(t) * 0.5 }, t));
  },
  Y19(x, u, d, t) { // the kitchen and the door: he says something; she does not turn round in time
    const water = u < 5.4, doorK = u < 4.0 ? 0 : u < 4.6 ? beat(u, 4.0, 4.6) : u < 5.4 ? 1 : 1 - beat(u, 5.4, 6.0);
    const him = u < 1.4 ? { who: 'M', x: 116, y: 112, dir: 'back', pose: 'key', slump: 3, lean: 1 } : u < 3.6 ? { who: 'M', x: 146, y: 112, dir: u > 2.0 && u < 3.2 ? 'left' : 'back', face: u > 2.1 && u < 2.9 ? 'talk' : '', pose: 'down' } : u < 4.6 ? { who: 'M', x: 158, y: 112, dir: 'back', pose: 'hook' } : u < 5.2 ? { who: 'M', x: 146, y: lerp(112, 100, beat(u, 4.6, 5.2)), dir: 'back', walk: u * 2, pose: 'down' } : null;
    const her = u < 6.6 ? { who: 'W', x: 26, y: 108, dir: 'back', pose: u < 5.4 ? 'wash' : 'hold', face: '' } : (() => { const w = walk(u, 6.8, 8.6, [26, 112], [104, 118]); return { who: 'W', x: w.x, y: w.y, dir: u < 6.8 ? 'right' : w.moving ? 'right' : 'right', walk: w.phase, face: u > 8.6 ? 'down' : '' }; })();
    shoot(x, CAM.kitchen, (b, R) => kitchenSet(b, R, { period: 'late', rack: ['mine', null], water, door: doorK, coat: u < 4.2, hisShoes: u < 1.4, people: [her, ...(him ? [him] : [])] }, t));
  },
  Y20(x, u, d, t) { // outside: he stands a moment, as if he might go back in; then goes on
    const wk = walk(u, 3.2, 6.8, [64, 132], [176, 134]);
    const hes = u > 1.0 && u < 2.2;
    shoot(x, CAM.corridor, (b, R) => corridorSet(b, R, { period: 'late', light: true, people: [{ who: 'M', x: u < 3.2 ? 64 : wk.x, y: u < 3.2 ? 132 : wk.y, dir: u < 2.8 ? 'left' : 'right', walk: wk.phase, pose: hes ? 'reachStop' : 'down', lean: hes ? -1 : 0, face: u < 2.8 ? 'down' : '' }] }, t));
  },
  Y21(x, u, d, t) {
    shoot(x, CAM.sink, (b, R) => kitchenSet(b, R, { period: 'now', rack: [null, null], water: u < 2.4, coat: false, hisShoes: false, slippers: true, people: [{ who: 'W', x: 26, y: 108, dir: 'back', pose: 'wash' }] }, t));
  },
  Y22(x, u, d, t) { // the drying rack: one cup; her hand makes room for a second that isn't coming
    const placed = u > 0.9;
    rackClose(x, FULL, { cups: [placed ? 'mine' : null, null], hand: u < 0.9 ? 0.2 : u < 1.4 ? 0.0 : u < 2.6 ? 0.55 : lerp(0.55, 1.4, beat(u, 2.6, 3.3)) }, t);
  },
  Y23(x, u, d, t) { // back at the table; she lifts her head as if to say something to the chair opposite
    const wk = walk(u, 0, 2.4, [130, 162], [ROOM.chairL + 4, STAND + 4]), sat = u > 2.8;
    const her = sat ? HER({ pose: 'table', face: u > 4.6 && u < 6.0 ? (u > 5.0 && u < 5.4 ? 'talk' : 'up') : 'down', lean: u > 4.6 && u < 6.0 ? 1 : 0 }) : u > 2.4 ? { who: 'W', x: ROOM.chairL + 2, y: STAND, dir: 'right', pose: 'down', lean: 1 } : { who: 'W', x: wk.x, y: wk.y, dir: 'left', walk: wk.phase };
    shoot(x, CAM.room, (b, R) => roomSet(b, R, { period: 'now', items: nowItems({ cupX: 17 }), breathe: curtainAt(t), people: [her] }, t));
  },
  Y24(x, u, d, t) { receiptClose(x, FULL, { open: ease(u, 0.3, 1.4), hand: true }, t); inspectBox(x, 22, 96, '收据', u - 1.0, 2.6); },
  Y25(x, u, d, t) {
    shoot(x, CAM.room, (b, R) => roomSet(b, R, { period: 'now', items: nowItems({ cupX: 17 }), breathe: curtainAt(t), car: beat(u, 2.8, 4.6),
      people: [HER({ pose: u < 1.2 ? 'hold' : u < 2.2 ? 'reachStop' : 'table', face: 'down' })], after: (X, Y) => carReflect(b, X, Y, beat(u, 3.0, 4.8)) }, t));
  },
  Y26(x, u, d, t) { // she leans forward, stands, goes to the window, draws the curtain back a little
    const wk = walk(u, 1.4, 4.4, [ROOM.chairL - 6, STAND], WINDOW_AT);
    const her = u < 0.6 ? HER({ pose: 'table' }) : u < 1.1 ? HER({ pose: 'table', lean: 2, slump: 1 }) : u < 1.4 ? { who: 'W', x: ROOM.chairL - 6, y: STAND, dir: 'right', pose: 'down' } : u < 4.4 ? { who: 'W', x: wk.x, y: wk.y, dir: 'back', walk: wk.phase } : { who: 'W', x: WINDOW_AT[0], y: WINDOW_AT[1], dir: 'back', pose: u > 4.8 && u < 5.8 ? 'hook' : 'down' };
    shoot(x, CAM.room, (b, R) => roomSet(b, R, { period: 'now', items: nowItems({ cupX: 17 }), breathe: curtainAt(t) + (u > 4.8 && u < 5.8 ? 0.6 : 0), curtain: ease(u, 4.9, 5.7) * 0.6, people: [her] }, t));
  },
  Y27(x, u, d, t) { // the bus stop, the first time we see it: he runs up; she has already turned to go
    const run = walk(u, 2.6, 5.8, [-12, 204], [62, 204]), go = walk(u, 4.6, 9.6, [104, 202], [196, 202]);
    shoot(x, CAM.bus, (b, R) => busStopSet(b, R, { period: 'late', clock: '18:55', lampOn: true, people: [
      { who: 'W', x: u < 4.6 ? 104 : go.x, y: 202, dir: u < 4.2 ? 'left' : 'right', walk: go.phase, face: 'down' },
      ...(u > 2.6 ? [{ who: 'M', x: run.x, y: 204, dir: 'right', walk: run.moving ? run.phase * 1.4 : null, face: u > 6 ? 'down' : '' }] : [])] }, t));
  },
  Y28(x, u, d, t) { // later, an evening at home: whenever one looks up, the other has just looked away
    const mLook = u < 2.2 || (u > 4.6 && u < 6.4), wLook = u > 2.4 && u < 4.4;
    shoot(x, CAM.room, (b, R) => roomSet(b, R, { period: 'late', lamp: 1,
      items: [{ k: 'lamp', x: 48, y: 6, on: 1 }, { k: 'cup', x: 14, y: 9 }, { k: 'cup', kind: 'his', x: 40, y: 9 }, { k: 'paper', x: 28, y: 15 }],
      people: [HER({ pose: 'cup', face: wLook ? '' : 'down', headView: !wLook && u < 2.4 ? 'side' : undefined, headFlip: !wLook && u < 2.4 }), HIM({ pose: 'table', face: mLook ? '' : 'down' })] }, t));
    shade(x, 0, 0, LW, LH, P.ink, 0.15);
  },
  Y29(x, u, d, t) {
    const wk = walk(u, 0, 2.6, WINDOW_AT, [ROOM.chairL - 6, STAND]);
    const her = u < 2.6 ? { who: 'W', x: wk.x, y: wk.y, dir: 'front', walk: wk.phase } : u < 3.0 ? { who: 'W', x: ROOM.chairL - 6, y: STAND, dir: 'right', pose: 'down', lean: 1 } : HER({ pose: 'lap', face: 'down' });
    shoot(x, CAM.room, (b, R) => roomSet(b, R, { period: 'now', items: nowItems({ cupX: 17 }), breathe: curtainAt(t), curtain: 0.6, people: [her] }, t));
  },
  Y30(x, u, d, t) {
    shoot(x, CAM.wedding, (b, R) => weddingSet(b, R, { cheer: true, couple: true, people: [{ who: 'M', x: 80, y: 224, dir: 'front', sit: true, pose: 'table', headView: 'side', headFlip: true }, { who: 'W', x: 100, y: 224, dir: 'front', sit: true, pose: 'table', face: 'down' }] }, t));
  },
  Y31(x, u, d, t) { // she looks at him while he watches the stage; he looks at her while she folds her napkin; then the camera
    const wAt = u > 0.3 && u < 1.9, mAt = u > 2.2 && u < 3.5, front = u > 4.0;
    const lean = ri(ease(u, 4.0, 4.6));
    shoot(x, CAM.wedTable, (b, R) => weddingSet(b, R, { cheer: true, couple: true, flash: u > 5.6 && u < 5.75 ? 0.9 : 0, people: [
      { who: 'M', x: 80 + lean, y: 224, dir: 'front', sit: true, pose: 'table', headView: front ? undefined : 'side', headFlip: !mAt && !front, face: front ? (u > 4.6 ? 'smile' : '') : '' },
      { who: 'W', x: 100 - lean, y: 224, dir: 'front', sit: true, pose: mAt ? 'hold' : 'table', headView: wAt ? 'side' : undefined, headFlip: wAt, face: front ? (u > 4.6 ? 'smile' : '') : mAt ? 'down' : '' }] }, t));
  },
  Y32(x, u, d, t) { photoClose(x, FULL, { period: 'now', hands: false }, t); },
  Y33(x, u, d, t) { // he takes one key off his ring and puts it in the dish
    if (u < 1.6) { shoot(x, CAM.entry, (b, R) => kitchenSet(b, R, { period: 'late', coat: true, keyInDish: false, people: [{ who: 'M', x: 112, y: 110, dir: 'back', pose: u > 0.4 ? 'key' : 'hold', face: 'down' }] }, t)); return; }
    keyDishClose(x, FULL, { key: ease(u, 1.8, 2.6), hand: u < 3.2, coins: true }, t);
  },
  Y34(x, u, d, t) {
    shoot(x, CAM.room, (b, R) => roomSet(b, R, { period: 'late', items: [{ k: 'cup', x: 14, y: 9 }, { k: 'paper', x: 22, y: 15 }], people: [HER({ pose: 'write', face: u > 0.3 ? 'up' : 'down', lean: u > 1.0 ? 1 : 0 })] }, t));
  },
  Y35(x, u, d, t) { // the coat comes off the hook; the door; she straightens the mat before she looks at the key
    const doorK = u < 1.4 ? 0 : u < 2.0 ? beat(u, 1.4, 2.0) : u < 3.0 ? 1 : 1 - beat(u, 3.0, 3.5);
    const him = u < 1.2 ? { who: 'M', x: 160, y: 110, dir: 'back', pose: 'hook' } : u < 2.0 ? { who: 'M', x: 150, y: 112, dir: 'back', holding: 'coat', pose: 'hold' } : u < 2.8 ? { who: 'M', x: 146, y: lerp(112, 100, beat(u, 2.0, 2.8)), dir: 'back', walk: u * 2 } : null;
    const wk = walk(u, 3.6, 5.2, [66, 124], [118, 114]);
    const her = u < 3.6 ? null : u < 5.2 ? { who: 'W', x: wk.x, y: wk.y, dir: 'right', walk: wk.phase } : { who: 'W', x: 118, y: 114, dir: u < 6.0 ? 'back' : 'right', pose: u < 5.8 ? 'key' : u < 6.6 ? 'hold' : 'down', slump: u < 5.8 ? 3 : 0, face: 'down', holding: u > 6.2 && u < 6.6 ? 'key' : null };
    shoot(x, CAM.entry, (b, R) => kitchenSet(b, R, { period: 'late', door: doorK, coat: u < 1.0, hookSwing: u > 1.0 && u < 2.6 ? 1 - beat(u, 1.0, 2.6) : 0, keyInDish: !(u > 6.2 && u < 6.6), matSkew: u > 2.6 && u < 5.6 ? 4 : 0, people: [...(him ? [him] : []), ...(her ? [her] : [])] }, t));
  },
  Y36(x, u, d, t) { // the same moment as Y16, a little wider: his other hand was fixing the wobbly table leg on her side
    const placed = u > 0.8;
    shoot(x, CAM.roomWide, (b, R) => roomSet(b, R, { period: 'late', breathe: curtainAt(t) * 0.4,
      items: [{ k: 'cup', x: 14, y: 9 }, { k: 'cup', kind: 'his', x: 44, y: 9 }, ...(placed ? [{ k: 'paper', x: 32, y: 14 }] : [])],
      people: [HER({ pose: u < 0.9 ? 'reach' : 'lap', face: 'down' }), HIM({ pose: { near: [[3, 7], [6, 14]], far: [[3, 7], [5, 15]] }, lean: -3, slump: 3, face: 'down' })],
      after: (X, Y) => { line(b, X(88), Y(132), X(81), Y(137), P.ink); line(b, X(88), Y(131), X(82), Y(136), P.red0); pset(b, X(80), Y(138), P.slate4); } }, t));
  },
  Y37(x, u, d, t) { // the bus stop again, wider: the clock runs on; buses come and go; she waits
    const ck = Math.min(45, Math.floor(beat(u, 0, 2.6) * 45)), clock = `18:${String(10 + ck).padStart(2, '0')}`;
    const bus = u < 1.4 ? lerp(-40, 320, beat(u, 0.1, 1.3)) : lerp(-40, 320, beat(u, 1.5, 2.6));
    const run = walk(u, 2.6, 3.4, [10, 204], [62, 204]);
    shoot(x, CAM.bus, (b, R) => busStopSet(b, R, { period: 'late', clock, lampOn: u > 1.0, bus: u < 2.6 ? bus : undefined, people: [
      { who: 'W', x: 104, y: 202, dir: u < 3.2 ? 'left' : 'right', pose: Math.floor(u * 1.2) % 2 ? 'pocket' : 'down', face: 'down', walk: u > 3.4 ? (u - 3.4) * 1.3 : null },
      ...(u > 2.6 ? [{ who: 'M', x: run.x, y: 204, dir: 'right', walk: run.phase }] : [])] }, t));
  },
  Y38(x, u, d, t) { // his chair, taken — then empty, in the same picture
    const then = u < 2.0;
    shoot(x, CAM.room, (b, R) => roomSet(b, R, { period: then ? 'late' : 'now', items: then ? [{ k: 'cup', x: 14, y: 9 }, { k: 'cup', kind: 'his', x: 42, y: 9 }] : nowItems({ cupX: 17 }), breathe: curtainAt(t) * 0.6,
      people: then ? [HER({ pose: 'lap', face: 'down' }), HIM({ pose: 'lap', headView: 'back' })] : [HER({ pose: u > 5.5 ? 'table' : 'lap', face: u > 7.0 ? 'down' : '', headView: u > 3.2 && u < 5.5 ? 'side' : undefined, headFlip: u > 3.2 && u < 5.5 })] }, t));
  },
  Y39(x, u, d, t) { // the room reversed: his empty chair in front of us, her across the table
    shoot(x, CAM.reverse, (b, R) => roomReverse(b, R, { period: 'now', items: [{ k: 'photo', x: 30, y: 12 }, { k: 'cup', x: 40, y: 10 }, { k: 'ash', x: 14, y: 8 }, { k: 'receipt', x: 32, y: 15 }, { k: 'pen', x: 56, y: 18 }],
      her: { pose: 'table', face: u > 3.0 && u < 5.0 ? 'down' : u > 5.0 ? 'up' : '' } }, t));
  },
  Y40(x, u, d, t) { // the last look: shorter; a thumb wipes the dust, rests on the space between them, lets go
    const lower = ease(u, 5.8, 7.4);
    photoClose(x, FULL, { period: 'now', dy: lower * 80, thumbR: ri(beat(u, 1.0, 2.4) * 40) - 10, dust: beat(u, 1.0, 2.4), gap: u > 3.0 && u < 5.6, hands: u < 7.0 }, t);
  },
  Y41(x, u, d, t) { ashClose(x, FULL, { smoke: 0 }, t); },
  Y42(x, u, d, t) { // she moves the photo from beside the cup to the inner side of the table
    const mv = ease(u, 0.4, 2.0), cupIn = ease(u, 2.4, 3.3);
    const photo = { x: lerp(120, 70, mv), y: lerp(330, 160, mv) };
    const cup = { x: lerp(222, 190, cupIn), y: lerp(300, 360, cupIn) };
    const hand = u < 2.1 ? { x: photo.x - 8, y: photo.y + 34, kind: 'pinch' } : u < 2.4 ? { x: lerp(photo.x - 8, cup.x - 60, beat(u, 2.1, 2.4)), y: lerp(photo.y + 34, cup.y, beat(u, 2.1, 2.4)), kind: 'flat' } : { x: cup.x - 60, y: cup.y + 2, kind: 'cup' };
    tableTopClose(x, FULL, { period: 'now', photo, cup, hand, receiptOver: false, receipt: { x: lerp(182, 140, mv), y: lerp(360, 200, mv) } }, t);
  },
  Y43(x, u, d, t) { // two people in the window glass, then one
    const mFade = 1 - ease(u, 1.6, 4.4);
    shoot(x, CAM.window, (b, R) => roomSet(b, R, { period: 'now', items: nowItems({ photoX: 40, photoY: 4, cupX: 17 }), breathe: curtainAt(t),
      after: (X, Y) => { const w = ROOM.win; clip(b, { x: X(w.x), y: Y(w.y), w: w.w, h: w.h }, () => { b.save(); b.globalAlpha = 0.22; drawPerson(b, 'W', X(w.x + 16), Y(w.y + 54), { dir: 'right', sit: true, pose: 'table', t, still: true }); b.globalAlpha = 0.22 * mFade; drawPerson(b, 'M', X(w.x + 40), Y(w.y + 54), { dir: 'left', sit: true, pose: 'table', t, still: true }); b.restore(); }); } }, t));
  },
  Y44(x, u, d, t) { // the cup is cold; she leans, stands, and goes out to the kitchen
    const lift = u > 0.4 && u < 1.8, wk = walk(u, 3.4, 5.6, [ROOM.chairL + 2, STAND + 4], DOOR_IN);
    const her = u < 2.4 ? HER({ pose: lift ? 'cupUp' : 'cup', holding: lift ? 'cup' : null, face: 'down' }) : u < 3.0 ? HER({ pose: 'table', lean: 2, slump: 1 }) : u < 3.4 ? { who: 'W', x: ROOM.chairL + 2, y: STAND, dir: 'right', pose: 'down' } : { who: 'W', x: wk.x, y: wk.y, dir: 'right', walk: wk.phase, holding: 'cup', pose: 'hold' };
    shoot(x, u < 3.0 ? CAM.room : CAM.roomWide, (b, R) => roomSet(b, R, { period: 'now', items: [{ k: 'photo', x: 40, y: 4 }, { k: 'receipt', x: 44, y: 8 }, ...(lift || u > 3.4 ? [] : [{ k: 'cup', x: 17, y: 9 }]), { k: 'ash', x: 50, y: 14 }, { k: 'pen', x: 6, y: 18 }], breathe: curtainAt(t), people: u < 5.6 ? [her] : [] }, t));
  },
  Y45(x, u, d, t) { // the camera stays: through the kitchen door, she fills the cup again
    shoot(x, CAM.reverseDoor, (b, R) => roomReverse(b, R, { period: 'now', items: [{ k: 'photo', x: 48, y: 6 }, { k: 'ash', x: 14, y: 8 }, { k: 'pen', x: 56, y: 18 }],
      kitchenPerson: { x: 140, y: 108, dir: 'back', pose: 'wash', steam: u > 2.8 } }, t));
  },
  Y46(x, u, d, t) { // she sits again — turned a little toward the window — holding the warm cup in both hands
    const wk = walk(u, 0, 2.4, [130, 162], [ROOM.chairL + 4, STAND + 4]), sat = u > 2.8;
    const her = sat ? { who: 'W', x: ROOM.chairL, y: ROOM.chairY, dir: 'left', sit: true, pose: 'cupUp', holding: 'cup', face: u > 5 ? '' : 'down' } : u > 2.4 ? { who: 'W', x: ROOM.chairL + 2, y: STAND, dir: 'left', pose: 'hold', holding: 'cup', lean: 1 } : { who: 'W', x: wk.x, y: wk.y, dir: 'left', walk: wk.phase, pose: 'hold', holding: 'cup' };
    shoot(x, CAM.room, (b, R) => roomSet(b, R, { period: 'now', chairLFace: 'left', items: [{ k: 'photo', x: 40, y: 4 }, { k: 'receipt', x: 44, y: 8 }, { k: 'ash', x: 50, y: 14 }, { k: 'pen', x: 6, y: 18 }], breathe: curtainAt(t), people: [her],
      after: (X, Y) => { if (sat || u > 0) for (let k = 0; k < 2; k++) { const ph = mod(t * 0.5 + k / 2, 1); const hx = sat ? X(ROOM.chairL - 6) : X(wk.x - 6); pset(b, hx + k * 2 + ri(Math.sin(t * 2 + k)), Y(sat ? ROOM.chairY - 26 : wk.y - 28) - ri(ph * 10), P.white); } } }, t));
  },
};
// The little restaurant, shared by Y09–Y12 so the table, cups and people never jump.
function restShot(x, u, t, beatName, frozen) {
  const M = { who: 'M', x: 64, y: 186, dir: 'front', sit: true, pose: 'table', behind: true }, W = { who: 'W', x: 90, y: 186, dir: 'front', sit: true, pose: 'table', behind: true };
  let items = [{ k: 'cup', x: 16, y: 10 }, { k: 'cup', kind: 'his', x: 74, y: 12 }];
  if (beatName === 'photo') { M.face = 'smile'; W.face = 'smile'; }
  if (beatName === 'menu') {
    const slide = ease(u, 0.3, 1.1), scoot = ease(u, 1.3, 2.2);
    items.push({ k: 'paper', x: lerp(56, 34, slide), y: 8 }); M.x = lerp(64, 70, scoot); M.face = u > 2.2 ? 'smile' : ''; W.face = u > 2.3 ? 'smile' : '';
    W.pose = u > 0.2 && u < 1.2 ? { front: [[[-3, 6], [-8, 10]], [[0, 7], [-3, 11]]] } : 'table';
  }
  if (beatName === 'napkin') {
    items.push({ k: 'bowl', x: 30, y: 6, steam: 0.7 }, { k: 'bowl', x: 52, y: 6, steam: 0.7 });
    const reach = ease(u, 0.6, 1.2) * (1 - ease(u, 2.0, 2.6)); M.x = 70;
    M.pose = { front: [[[-1, 7], [-1, 14]], [[3, 4], [3 + ri(reach * 6), 9 - ri(reach * 2)]]] };
    W.pose = { front: [[[-3, 4], [-3 - ri(reach * 6), 9 - ri(reach * 2)]], [[1, 7], [1, 14]]] };
    const laugh = u > 2.2; M.face = laugh ? 'smile' : (u > 1.2 ? 'up' : ''); W.face = laugh ? 'smile' : (u > 1.2 ? 'up' : ''); M.nod = laugh && Math.floor(t * 4) % 2; W.nod = laugh && Math.floor(t * 4 + 1) % 2;
  }
  if (beatName === 'collar') {
    M.x = 70; W.pose = { front: [[[-4, 1], [-11, -3]], [[1, 7], [1, 14]]] }; W.face = 'down';
    M.headView = u > 0.7 ? 'side' : undefined; M.face = u > 0.7 ? '' : 'smile';
  }
  shoot(x, CAM.rest, (b, R) => restaurantSet(b, R, { items, people: [M, W], passer: true, after: (X, Y) => { if (beatName === 'napkin') { block(b, X(78), Y(172), 10, 7, P.white); rect(b, X(80), Y(169), 6, 4, P.white); } } }, frozen ? 51 : t));
}

const SUBSTYLE = {};
function drawFilm(x, t) {
  x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
  rect(x, 0, 0, LW, LH, P.void);
  const s = shotAt(t), u = t - s.start, d = s.end - s.start;
  (FX[s.id] || (() => {}))(x, u, d, t, s);
  return s;
}
