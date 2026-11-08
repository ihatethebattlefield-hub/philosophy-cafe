'use strict';
/*
 * The film, shot by shot. Shot starts come from data/storyboard.js anchors
 * resolved against the aligned lyric times; inside a shot, beats are placed with
 * L('L05', f) (a moment inside a sung line), bt(n) (the n-th beat of the
 * measured grid) or the shot's local time u. Every shot is draw(x, u, d, t, s):
 * u = seconds into the shot, d = its length, t = song time, s.T = the light.
 *
 * Movement: people walk ≈ 24 px/s (art pixels), a stride per 16 px, with an
 * anticipation pause before they start and a settle after they stop; doors and
 * trams accelerate and brake; objects joining the music move off the beat as
 * often as on it, never all together.
 */
function lyricLine(id) { return (window.LYRICS.lines || []).find(l => l.id === id); }
function L(id, f = 0) { const l = lyricLine(id); return l ? l.start + (l.end - l.start) * f : 0; }
function Lend(id) { const l = lyricLine(id); return l ? l.end : 0; }
const bt = n => PHRASES.phase + n * PHRASES.beat;
const beatNo = t => (t - PHRASES.phase) / PHRASES.beat;
const nextBeat = t => bt(Math.ceil(beatNo(t)));
let SHOTS = null;
function buildShots() {
  const intro = L('L01');
  SHOTS = window.BOARD.shots.map(s => {
    const a = s.at;
    const start = typeof a === 'number' ? a : a.lineEnd ? Lend(a.lineEnd) + (a.off || 0) : L(a.line) + (a.off || 0);
    return { ...s, start };
  });
  SHOTS.forEach((s, i) => { s.end = i + 1 < SHOTS.length ? SHOTS[i + 1].start : SONG.duration; s.k1 = i + 1 < SHOTS.length ? SHOTS[i + 1].k : s.k; });
}
function shotAt(t) { for (let i = SHOTS.length - 1; i >= 0; i--) if (t >= SHOTS[i].start) return SHOTS[i]; return SHOTS[0]; }
const beat = (t, a, b) => clamp((t - a) / (b - a));
const ease = (t, a, b) => E.inOut(beat(t, a, b));
// Walking from x0 to x1 between t0 and t1 (eased at both ends: a weight shift, a settle).
function walk(t, t0, t1, x0, x1) {
  const u = beat(t, t0, t1), e = u < 0.08 ? u * u / 0.16 : u > 0.92 ? 1 - (1 - u) * (1 - u) / 0.16 : u - 0.04;
  const px = lerp(x0, x1, clamp(e / 0.92)), moving = t > t0 && t < t1;
  return { x: px, moving, phase: moving ? Math.abs(px - x0) / 16 : null, dir: x1 >= x0 ? 'right' : 'left' };
}
const along = (pts, u) => { u = clamp(u) * (pts.length - 1); const i = Math.min(pts.length - 2, Math.floor(u)), f = u - i; return [lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f)]; };
// A hop between two points with an arc (the note's way of moving).
function hop(a, b, u, h = 10) { const e = E.inOut(clamp(u)); return [lerp(a[0], b[0], e), lerp(a[1], b[1], e) - Math.sin(clamp(u) * Math.PI) * h]; }

// ------------------------------------------------------------- framing
const FULL = { x: 0, y: 0, w: LW, h: LH };
const BUFS = {};
function buf(name, w = SET_W, h = SET_H) { const k = name + w + 'x' + h; if (!BUFS[k]) BUFS[k] = canvas(w, h); const b = BUFS[k]; b.x.setTransform(1, 0, 0, 1, 0, 0); b.x.globalAlpha = 1; rect(b.x, 0, 0, w, h, P.void); return b; }
// Draw a 180×320 set into a buffer, then show it at 2× (or a tighter window at 3×).
function setShot(x, draw, z = 2, sx = 0, sy = 0) {
  const b = buf('set'); draw(b.x, { x: 0, y: 0, w: SET_W, h: SET_H });
  x.imageSmoothingEnabled = false; x.drawImage(b.c, ri(sx), ri(sy), LW / z, LH / z, 0, 0, LW, LH);
  return { toScreen: (px, py) => [(px - sx) * z, (py - sy) * z] };
}
function dissolve(x, u, dur = 0.35, col = P.void) {
  const k = 1 - clamp(u / dur); if (k <= 0) return;
  x.fillStyle = col;
  for (let y = 0; y < LH; y += 3) for (let px = 0; px < LW; px += 3) if (BAYER[((y / 3) & 3) * 4 + ((px / 3) & 3)] < k) x.fillRect(px, y, 3, 3);
}
function memoryTint(x) { shade(x, 0, 0, LW, LH, P.honey0, 0.16); shade(x, 0, 0, LW, LH, P.cream1, 0.1); for (let y = 0; y < LH; y += 3) if (y < 26 || y > LH - 26) shade(x, 0, y, LW, 3, P.void, 0.5); }

// ------------------------------------------------------------- the shots
const FX = {
  // His fingers on the table: four taps, a pause, four taps; the pencil waits on the paper.
  S01(x, u, d, t, s) {
    woodTable(x, FULL, 0.15, 3, s.T);
    paperClose(x, { x: 30, y: -150, w: LW, h: LH }, { scrib: 3 }, t);
    for (let k = 0; k < 14; k++) { const ph = mod(t * 0.07 + hash(k), 1); x.save(); x.globalAlpha = 0.5; pset(x, 60 + hash(k + 1) * 240 + Math.sin(t + k) * 6, 600 - ph * 560, P.cream0); x.restore(); } // dust in the light
    const t0 = nextBeat(s.start + 0.6), i1 = tapIndex(t, t0, 'front'), i2 = tapIndex(t, t0 + 4 * PHRASES.beat, 'front');
    const i = i1 >= 0 ? i1 : i2, lift = [0, 0, 0, 0];
    const waiting = (t > t0 - 0.3 && i < 0 && t < t0 + 8 * PHRASES.beat);
    if (waiting) lift[[0, 1, 2, 0][Math.max(0, Math.floor(beatNo(t) * 2) % 4)]] = 0.6;
    if (i >= 0) lift[[0, 1, 2, 0][i]] = 0;
    bigHand(x, 'A', 140, 470, { k: 4, lift });
    const px = 250, py = 300; line(x, px, py, px + 60, py - 14, P.ink); line(x, px, py + 1, px + 60, py - 13, P.honey1); line(x, px + 1, py + 1, px + 59, py - 12, P.honey2); rect(x, px - 3, py - 1, 4, 3, P.cream3); rect(x, px + 58, py - 15, 6, 4, P.brick1);
    dissolve(x, u, 0.9);
  },

  // Rehearsing to the empty chair; a cyclist outside; he sits up, it isn't her.
  S02(x, u, d, t, s) {
    const cyc = beat(u, 3.6, 6.4), sitUp = u > 4.4 && u < 6.0, slump = u >= 6.0;
    setShot(x, (b, R) => {
      roomSet(b, R, { T: s.T, cyclist: cyc, cyclistWho: 'D', breathe: (Math.sin(t * PI2(PHRASES.beat * 8)) + 1) / 2, steam: 0.7, lamp: 0 }, t);
      const face = u < 0.8 ? '' : u < 2.2 ? (u > 1.4 && u < 2.0 ? 'talk' : 'up') : u < 3.6 ? 'down' : sitUp ? 'up' : slump ? 'down' : '';
      const pose = u > 2.2 && u < 3.6 ? 'hold' : 'table';
      drawChar(b, 'A', ROOM.chairA + (slump ? 1 : 0), ROOM.chairY + (sitUp ? -1 : 0), { dir: u > 4.8 && u < 5.8 ? 'back' : 'right', sit: true, pose, face, t, tapUp: u < 0.8 && Math.floor(u * 4) % 2 });
    });
    if (u > 1.2 && u < 2.2) { x.save(); x.globalAlpha = 0.9; text(x, '…', 150, 330, P.ink2, FONT.ui); x.restore(); }
  },

  // The ink gathers into an amber note, which trembles on the page.
  S03(x, u, d, t, s) {
    woodTable(x, FULL, 0.15, 3, s.T);
    const pg = paperClose(x, FULL, { scrib: 4, emerge: beat(u, 0.8, 2.6) }, t);
    if (u > 2.6) { const wob = u < 3.4 ? ri(Math.sin(t * 22) * 2) : 0, lift = u > 3.6 ? -ri(Math.abs(Math.sin((u - 3.6) * 7)) * 6) : 0; noteSprite(x, pg.px + 46 + wob, pg.py + 18 + lift, t, beat(u, 2.6, 2.9), 3); }
  },

  // Off the page, across the cup rim, along the sill and out; his hand arrives a beat late.
  S04(x, u, d, t, s) {
    const way = [[86, 176], [104, 176], [116, 178], [140, 160], [130, 84], [150, 82], [168, 60], [190, 40]];
    const seg = Math.min(way.length - 1.001, u / 0.45), i = Math.floor(seg), p = hop(way[i], way[i + 1], seg - i, i === 2 ? 4 : 8);
    const rimHit = u > 0.9 && u < 1.3;
    setShot(x, (b, R) => {
      roomSet(b, R, { T: s.T, steam: 0.7, cupRing: rimHit, lamp: 0, open: true, breathe: 0.6 }, t);
      const reach = beat(u, 1.6, 2.4), late = u > 2.6;
      drawChar(b, 'A', ROOM.chairA + ri(reach * 4), ROOM.chairY - ri(reach * 2), { dir: 'right', sit: !late || u < 3.4, pose: reach > 0.2 ? 'reach' : 'table', face: late ? 'blink' : 'up', t });
      if (u < 3.6) noteSprite(b, p[0] - 3, p[1] - 6, t, 1);
      if (rimHit) { b.save(); b.globalAlpha = 0.6; ellipse(b, 116, 184, 3 + ri((u - 0.9) * 12), 1 + ri((u - 0.9) * 4), P.cream0); b.restore(); }
    });
  },

  // The note drops from his window to the street and leads the camera along it.
  S05(x, u, d, t, s) {
    const cam = lerp(-10, 380, ease(u, 0.8, d - 0.2)), G = streetGeom(FULL, { gy: 430 });
    const drop = beat(u, 0, 1.2), nx = drop < 1 ? 127 : 127 + (cam + 10) * 1.02 + ri(Math.sin(u * 3) * 6), ny = drop < 1 ? lerp(G.gy - 142, G.gy - 6, E.in(drop)) : G.gy - 6 - Math.abs(Math.sin(u * 4.6)) * 14;
    street(x, FULL, { T: s.T, camX: cam, gy: 430, hisWindow: { lit: false }, people: [
      { x: 160 + u * 12, dir: 'right' }, { x: 520 - u * 18, dir: 'left' }, { who: 'C', x: 330 + u * 6, dir: 'right', walk: u * 0.4 }, { x: 610, layer: 'near' },
    ], tram: { x: 1100 - u * 120, dir: -1 }, after: (wx, G) => { noteSprite(x, wx(nx) - 3, ny - 8, t, 1); } }, t);
    dissolve(x, u, 0.2);
  },

  // Someone's cup at the counter: the note touches the rim; rings spread.
  S06(x, u, d, t, s) {
    const c = cupClose(x, FULL, { T: s.T, handle: 0.4, ripples: [s.start + 0.8, s.start + 0.8 + PHRASES.beat * 2], steam: 0.8, latte: true }, t);
    if (u < 1.0) noteSprite(x, c.cx + 60 - u * 56, c.cy - 40 - Math.abs(Math.sin(u * 6)) * 16, t, 1, 2);
    else if (u < 1.6) noteSprite(x, c.cx + 4 + (u - 1) * 120, c.cy - 40 - (u - 1) * 160, t, 1 - (u - 1) / 0.6, 2);
  },

  // Round window: clothes tumble in time; pull back to the laundromat.
  S07(x, u, d, t, s) {
    const spinA = beatNo(t) * Math.PI / 2; // a quarter turn per beat for the machine that joined in
    if (u < 2.4) { washerClose(x, FULL, { spin: spinA, note: u < 1.2 ? { x: 60 - u * 40, y: -90 + u * 30, a: 1 } : undefined }, t); return; }
    const v = u - 2.4, mode = v < 2.0 ? 'swing' : 'tap', tap = mode === 'tap' && mod(beatNo(t), 1) < 0.3;
    setShot(x, (b, R) => laundrySet(b, R, { T: s.T, spin: [t * 2.1, spinA, t * 1.7 + 2, t * 2.4 + 1], active: 1, noteOn: v < 1.4 ? 1 : -1, waiter: { mode, tap, headphones: false } }, t));
    dissolve(x, v, 0.2, P.white);
  },

  // A tram wheel turning, then inside: the note slips through reflections; straps sway; toes tap.
  S08(x, u, d, t, s) {
    if (u < 2.0) { wheelClose(x, FULL, { T: s.T, spin: t * 5, spark: u > 1.2 }, t); return; }
    const v = u - 2.0, toe = mod(beatNo(t), 1) < 0.25;
    setShot(x, (b, R) => {
      tramInterior(b, R, { T: s.T, speed: 1, sway: 1.5 + (v > 2 ? Math.sin(beatNo(t) * Math.PI) : 0), noteOut: v < 6 ? { win: Math.min(2, Math.floor(v / 2)), x: mod(v * 22, 46), y: 18 + ri(Math.sin(v * 5) * 4) } : null,
        people: [{ who: 'C', x: 40, y: 128, dir: 'front', sit: true, pose: 'book', face: 'down' }, { who: 'D', x: 108, y: 128, dir: 'front', sit: true, face: v > 3 ? 'smile' : '' }, { who: 'A', x: 152, y: 190, dir: 'left', pose: 'raise', face: 'down', seed: 2 }] }, t);
      if (toe && v > 2.5) { pset(b, 104, 129, P.ink); pset(b, 115, 129, P.ink); }
    });
  },

  // Her table by the window: she draws; the cup arrives with its handle to the right.
  S09(x, u, d, t, s) {
    const bw = walk(u, 0.6, 2.0, 155, 112), back = walk(u, 2.6, 3.8, 112, 155), cupDown = u > 2.0;
    setShot(x, (b, R) => {
      cafeSet(b, R, { T: s.T, sketchbook: true, cup: cupDown, handle: 'right', tramOut: 160 - u * 50, barista: u < 0.6 ? { x: 155, y: 122 } : u < 2.6 ? { x: bw.x, y: 150 + (u > 0.6 && u < 2 ? 18 : 18), dir: u < 2.0 ? 'left' : 'front', walk: bw.phase, pose: u < 2.0 ? 'hold' : 'give', holding: u < 2.0 ? 'cup' : null } : { x: back.x, y: 168, dir: 'right', walk: back.phase } }, t);
      drawChar(b, 'B', CAFE.chairB, CAFE.chairY, { dir: 'right', sit: true, pose: 'write', t, face: u > 2.0 && u < 2.6 ? 'up' : 'down' });
    }, 2, 0, 0);
  },

  // Her hand turns the handle to the left, as she always does. Then the coffee answers the rhythm.
  S10(x, u, d, t, s) {
    const turn = ease(u, 0.3, 1.3), ha = lerp(0.35, Math.PI - 0.35, turn);
    const t0 = nextBeat(s.start + 1.6), rip = MOTIF.front.map(p => t0 + p * PHRASES.beat);
    const c = cupClose(x, FULL, { T: s.T, handle: ha, ripples: rip, steam: 0.6 }, t);
    // her fingers on the handle while it turns, then resting and tapping by the saucer
    if (u < 1.5) { const f = Math.cos(ha) > 0 ? -1 : 1, hx = c.cx + Math.cos(ha) * 64 * c.S, hy = c.cy + Math.sin(ha) * 22 * c.S + 14; bigHand(x, 'B', hx - f * 56, hy, { k: 3, kind: 'pinch', facing: f }); }
    else bigHand(x, 'B', 70, 520, { k: 3, lift: tapDown(t, t0, 'front') ? [0.9, 0, 0, 0] : [0, 0, 0, 0] });
  },

  // His hand, nervous, taps the same four.
  S11(x, u, d, t, s) {
    woodTable(x, FULL, 0.2, 3, s.T); paperClose(x, { x: 30, y: -150, w: LW, h: LH }, { scrib: 4 }, t);
    const t0 = nextBeat(s.start + 0.2), i = tapIndex(t, t0, 'front'), lift = [0.6, 0.6, 0.4, 0]; if (i >= 0) lift[[0, 1, 2, 0][i]] = 0;
    bigHand(x, 'A', 140, 470, { k: 4, lift });
  },

  // She looks up: the note crosses the window's reflection. She listens; then she goes.
  S12(x, u, d, t, s) {
    const stand = u > 4.6, wk = walk(u, 5.2, 7.9, CAFE.chairB, 170);
    setShot(x, (b, R) => {
      cafeSet(b, R, { T: s.T, sketchbook: u < 3.6, cup: true, handle: 'left', cupEmpty: true, noteOut: u > 0.8 && u < 3.4 ? { x: 20 + (u - 0.8) * 50, y: 34 + ri(Math.sin(u * 4) * 4) } : null, board: ['Love Song', '手冲', '柠檬茶'], boardHi: u > 0.4 ? 0 : -1, barista: { x: 155, y: 122 }, chairB: true }, t);
      if (!stand) drawChar(b, 'B', CAFE.chairB, CAFE.chairY, { dir: u < 3.0 ? 'right' : 'right', sit: true, pose: u > 3.6 ? 'book' : 'write', face: u > 0.8 && u < 3.6 ? 'up' : 'down', holding: u > 3.6 && u < 4.6 ? 'sketchbook' : null, t });
      else { charShadow(b, wk.x, CAFE.chairY); drawChar(b, 'B', wk.x, CAFE.chairY, { dir: 'right', walk: wk.phase, pose: 'bag', t, face: u < 5.4 ? 'up' : '' }); blit(b, 'tote', wk.x - 9, CAFE.chairY - 18); }
    });
  },

  // The whole street plays along — each thing on its own beat, not all at once.
  S13(x, u, d, t, s) {
    const bn = beatNo(t), cam = lerp(140, 230, ease(u, 0, d));
    street(x, FULL, { T: s.T, camX: cam, gy: 440, react: { washer: bn * Math.PI / 2 }, lamps: i => 0, wind: 0.3,
      people: [{ x: 200 + u * 20, dir: 'right' }, { x: 420 - u * 14, dir: 'left' }, { who: 'C', x: 300, dir: 'front', tapUp: mod(bn, 1) < 0.3 }, { who: 'D', x: 480 + u * 10, dir: 'right', walk: u * 0.6, layer: 'near' }],
      tram: { x: 260 + u * 70, dir: 1 }, after: (wx, G) => {
        // upstairs curtains breathing on the half-bar, a cup's ring in the café window on the off-beat
        for (const [k, cx] of [[0, 352], [1, 412], [2, 470]]) { const br = ri((Math.sin((bn + k) * Math.PI / 2) + 1)); rect(x, wx(cx), G.gy - 140, 3 + br, 22, P.cream0); }
        if (mod(bn + 0.5, 2) < 0.4) { x.save(); x.globalAlpha = 0.6; ellipse(x, wx(380), G.gy - 14, 6, 2, P.cream0); x.restore(); }
      } }, t);
  },

  // Out of his door after the note; the laundromat door swings open; he sidesteps.
  S14(x, u, d, t, s) {
    // out of his door (0.3–0.8), along the street; the laundromat door opens just as he reaches it (5.6);
    // he sidesteps toward the kerb, pauses, nods, and carries on.
    const door = beat(u, 0.3, 0.8) * (1 - beat(u, 1.6, 2.2));
    const w1 = walk(u, 0.9, 5.7, 72, 284), w2 = walk(u, 6.9, d, 284, 380);
    const ax = u < 6.9 ? w1.x : w2.x, dodge = u > 5.7 && u < 6.9, dy = dodge ? ri(4 * Math.sin(beat(u, 5.7, 6.9) * Math.PI)) : 0;
    const ld = beat(u, 5.4, 5.8) * (1 - beat(u, 7.2, 7.8)), cOut = walk(u, 5.9, d, 312, 250);
    const cam = clamp(ax - 80, 0, 400);
    setShot(x, (b, R) => street(b, R, { T: s.T, camX: cam, gy: 230, aptDoor: door, laundryDoor: ld, people: [
      ...(u > 5.8 ? [{ who: 'C', x: cOut.x, dir: 'left', walk: cOut.phase, pose: 'hold', holding: 'tote', dy: 1 }] : []),
      { who: 'A', x: ax, dir: dodge ? 'front' : 'right', walk: u < 5.7 ? w1.phase : u > 6.9 ? w2.phase : null, face: dodge ? (u < 6.3 ? 'up' : 'shy') : '', dy, nod: u > 6.3 && u < 6.6, pose: dodge && u < 6.3 ? 'raise' : 'down' },
    ], after: (wx, G) => { if (u > 1.0) noteSprite(b, wx(ax + 50 + ri(Math.sin(u * 3) * 8)), G.gy - 30 - Math.abs(Math.sin(u * 4)) * 10, t, 1); } }, t), 2, 0, 0);
  },

  // She on the far pavement, he on the near one half a street behind; a tram passes between them.
  S15(x, u, d, t, s) {
    const cam = lerp(380, 520, ease(u, 0, d)), wind = u > L('L20') - s.start ? 1 : 0;
    street(x, FULL, { T: s.T, camX: cam, gy: 420, wind,
      people: [{ who: 'B', x: 470 + u * 22, dir: 'right', walk: u * 1.4, face: u > 3 && u < 5 ? 'up' : '', pose: 'bag' }, { who: 'A', x: 380 + u * 24, dir: 'right', walk: u * 1.5, layer: 'near' }, { x: 640 - u * 16, dir: 'left' }, { x: 560, layer: 'near' }],
      tram: { x: -300 + (u - 2) * 140, dir: 1 }, after: (wx, G) => { if (wind) for (let k = 0; k < 8; k++) { const lx = mod(k * 61 + t * 90, 400) - 20, ly = G.gy - 80 + hash(k) * 60 + Math.sin(t * 3 + k) * 8; pset(x, lx, ly, P.sage2); pset(x, lx + 1, ly, P.sage3); } } }, t);
  },

  // At the laundromat window she notices one drum turning in time; she tilts her head.
  S16(x, u, d, t, s) {
    setShot(x, (b, R) => street(b, R, { T: s.T, camX: 150, gy: 230, react: { washer: beatNo(t) * Math.PI / 2 },
      people: [{ who: 'B', x: 230, dir: u > 1.2 ? 'back' : 'right', face: 'up', pose: 'bag', nod: u > 3 && u < 3.6 }] }, t));
  },

  // At the corner: he opens his mouth, says nothing, taps four times against his leg. The note hops on.
  S17(x, u, d, t, s) {
    const t0 = nextBeat(s.start + 1.6), tap = tapDown(t, t0, 'front');
    setShot(x, (b, R) => street(b, R, { T: s.T, camX: 640, gy: 230, people: [{ who: 'A', x: 720, dir: 'right', face: u > 0.8 && u < 1.6 ? 'talk' : u > 3 ? 'down' : '', pose: 'pocket', tapUp: tap }],
      after: (wx, G) => { const nx = u < 3.6 ? 760 : lerp(760, 820, beat(u, 3.6, 4.4)), ny = G.gy - 24 - (u > 3.6 ? Math.sin(beat(u, 3.6, 4.4) * Math.PI) * 14 : 0); noteSprite(b, wx(nx), ny, t, 1); if (tap) { pset(b, wx(723), G.gy - 6, P.cream0); pset(b, wx(725), G.gy - 8, P.cream0); } } }, t));
  },

  // He comes into the café: her table is empty, her cup's handle to the left, a napkin.
  S18(x, u, d, t, s) {
    const wk = walk(u, 0.4, 3.4, 172, 112);
    setShot(x, (b, R) => {
      cafeSet(b, R, { T: s.T, cup: true, handle: 'left', cupEmpty: true, napkin: true, barista: { x: 155, y: 122, dir: 'left' } }, t);
      charShadow(b, wk.x, 212); drawChar(b, 'A', wk.x, 212, { dir: u < 3.4 ? 'left' : 'back', walk: wk.phase, face: u > 3.4 ? 'down' : '', t });
    });
  },

  // A memory at the same table: she taps while she draws; he writes it down and folds the corner.
  S19(x, u, d, t, s) {
    const t0 = nextBeat(s.start + 0.8), tap = tapDown(t, t0, 'front') || tapDown(t, t0 + 4 * PHRASES.beat, 'front');
    setShot(x, (b, R) => {
      cafeSet(b, R, { T: todAt(0.18), sketchbook: true, cup: true, handle: 'left', barista: { x: 155, y: 122 } }, t);
      drawChar(b, 'B', CAFE.chairB, CAFE.chairY, { dir: 'right', sit: true, pose: 'table', tapUp: tap, face: 'down', t });
      drawChar(b, 'A', 40, 276, { dir: 'right', sit: true, pose: u > 3.2 && u < 5 ? 'write' : u > 5 ? 'hold' : 'table', face: u < 3 ? 'up' : 'down', t });
    });
    memoryTint(x);
  },

  // The napkin: her little bird on a line, three notes. His finger stops beside it.
  S20(x, u, d, t, s) { napkinClose(x, FULL, { T: s.T, draw: 1, finger: ease(u, 1.2, 3.0) }, t); },

  // He sits; turns his own cup's handle to the left — stops — smiles; keeps the napkin with his paper.
  S21(x, u, d, t, s) {
    setShot(x, (b, R) => {
      cafeSet(b, R, { T: s.T, cup: true, handle: u > 1.4 ? 'left' : 'right', napkin: u < 3.4, barista: { x: 155, y: 122 } }, t);
      drawChar(b, 'A', CAFE.chairB, CAFE.chairY, { dir: 'right', sit: true, pose: u > 0.6 && u < 1.6 ? 'give' : u > 3.0 ? 'hold' : 'table', holding: u > 3.0 ? 'paper' : null, face: u > 1.8 && u < 3.0 ? 'smile' : u > 3 ? 'down' : '', t });
    }, 3, 30, 60);
  },

  // Elsewhere she draws birds on a wire — sitting like notes on a staff.
  S22(x, u, d, t, s) { const n = 3 + Math.floor(beat(u, 0.2, 3.2) * 4); sketchClose(x, FULL, { birds: n, fresh: true, hand: true, hx: -n * 6, hy: n % 2 ? -30 : 40 }, t); },

  // Out of the door; he stops and looks both ways.
  S23(x, u, d, t, s) {
    const wk = walk(u, 0.2, 2.2, 470, 500);
    setShot(x, (b, R) => street(b, R, { T: s.T, camX: 400, gy: 230, cafeDoor: beat(u, 0, 0.4) * (1 - beat(u, 2.0, 2.6)), people: [{ who: 'A', x: wk.x, dir: u < 2.2 ? 'right' : u < 3.6 ? 'left' : u < 5 ? 'right' : 'front', walk: wk.phase, face: u > 2.4 ? 'up' : '' }] }, t));
  },

  // This time he picks the way. The note follows him; lamps come on as he passes, in a little rhythm.
  S24(x, u, d, t, s) {
    const ax = lerp(500, 690, beat(u, 0.4, d)), cam = ax - 90;
    setShot(x, (b, R) => street(b, R, { T: s.T, camX: cam, gy: 230, lamps: i => (STREET_LAMPS[i] < ax + 10 ? 1 : 0),
      people: [{ who: 'A', x: ax, dir: 'right', walk: (ax - 500) / 16, face: u > 3 ? 'smile' : '' }],
      after: (wx, G) => noteSprite(b, wx(ax - 18 - ri(Math.sin(u * 2) * 4)), G.gy - 34 - Math.abs(Math.sin(u * 3)) * 6, t, 1) }, t));
  },

  // The near miss at the stop, held in one wide frame so the geography is clear.
  S25(x, u, d, t, s) {
    const tIn = L('L38') - s.start - 0.3;
    const tx = u < tIn ? -300 : trainPass(u, tIn);
    const strangerGone = u > tIn + 1.6, bIn = walk(u, tIn + 0.6, tIn + 2.4, 760, 690);
    const paper = u > tIn + 2.6 && u < tIn + 6.2, aDown = u > tIn + 3.4 && u < tIn + 6.0, bTurn = u > tIn + 4.2;
    const near = u > 0.8 && u < tIn;
    setShot(x, (b, R) => street(b, R, { T: s.T, camX: 540, gy: 206, lamps: () => 1, tram: { x: tx, dir: 1, door: 0 },
      people: [
        ...(strangerGone ? [] : [{ who: 'D', x: 606, dir: 'back', pose: 'bag' }]),
        ...(u > tIn + 0.6 ? [{ who: 'B', x: bIn.x, dir: bIn.moving ? 'left' : bTurn ? 'front' : 'back', walk: bIn.phase, face: bTurn ? 'up' : '', pose: 'bag' }] : []),
        { who: 'A', x: 600, dir: aDown ? 'front' : 'back', layer: 'near', pose: near ? 'raise' : aDown ? 'down' : 'hold', holding: aDown || paper ? null : 'paper', sit: aDown, face: aDown ? 'down' : '' },
      ],
      after: (wx, G) => {
        if (paper) { const v = (u - tIn - 2.6) / 3.6, pxp = wx(606 + v * 50 - v * v * 44), pyp = G.near + 6 - Math.abs(Math.sin(v * Math.PI * 2.5)) * 18 + v * 6; rect(b, pxp, pyp, 7, 5, P.ink); rect(b, pxp + 1, pyp + 1, 5, 3, P.cream0); hline(b, pxp + 1, pxp + 4, pyp + 2, P.ink3); }
        if (u > tIn + 3.0) noteSprite(b, wx(612), G.near - 30 - Math.abs(Math.sin(u * 3)) * 4, t, beat(u, tIn + 3.0, tIn + 3.4));
      } }, t));
  },

  // She connects them: ring of coffee, round window, wheel, lamp — circle into circle.
  S26(x, u, d, t, s) {
    const part = Math.floor(u / (d / 4)), v = u - part * (d / 4);
    if (part === 0) cupClose(x, FULL, { T: s.T, handle: Math.PI - 0.35, ripples: [s.start + 0.3, s.start + 0.8], steam: 0.4 }, t);
    else if (part === 1) washerClose(x, FULL, { spin: beatNo(t) * Math.PI / 2 }, t);
    else if (part === 2) wheelClose(x, FULL, { T: s.T, spin: t * 5 }, t);
    else setShot(x, (b, R) => street(b, R, { T: s.T, camX: 760, gy: 230, lamps: i => (i === 5 ? 1 : 0.2), people: [{ who: 'B', x: 840, dir: 'front', face: 'smile', pose: 'bag' }] }, t));
    dissolve(x, v, 0.15);
  },

  // She answers: three taps on the lamp post; the lamps light one after another down the street.
  S27(x, u, d, t, s) {
    const t0 = nextBeat(s.start + 0.6), tap = tapDown(t, t0, 'back'), lit = Math.max(0, Math.floor((t - t0 - PHRASES.beat * 1.5) / (PHRASES.beat / 2)));
    street(x, FULL, { T: s.T, camX: 640, gy: 430, lamps: i => (i <= 3 ? 1 : i - 3 <= lit ? 1 : 0.05),
      people: [{ who: 'B', x: 790, dir: 'right', pose: tap ? 'reach' : 'down', face: 'smile' }] }, t);
  },

  // Far away, he sees the lamps coming on toward him, one by one; he smiles.
  S28(x, u, d, t, s) {
    setShot(x, (b, R) => street(b, R, { T: s.T, camX: 900, gy: 230, lamps: i => (i < 5 + beat(u, 0, 1.6) * 3 ? 1 : 0.05), people: [{ who: 'A', x: 1000, dir: 'left', face: u > 0.8 ? 'smile' : 'up' }] }, t));
  },

  // The bench under the lamp; he unfolds the much-corrected page.
  S29(x, u, d, t, s) {
    setShot(x, (b, R) => street(b, R, { T: s.T, camX: 760, gy: 230, lamps: () => 1, people: [{ who: 'A', x: 838, dy: -15, dir: 'front', sit: true, pose: u > 1.4 ? 'book' : 'hold', holding: 'paper', face: 'down' }],
      after: (wx, G) => { for (let k = 0; k < 3; k++) { const a = t * 3 + k * 2.1; pset(b, wx(801) + ri(Math.cos(a) * 6), G.gy - 92 + ri(Math.sin(a * 1.3) * 4), P.cream0); } } }, t));
  },

  // The page chokes on its rewrites — lines swarming, swirling like a painting — the first motif squeezed into a corner.
  S30(x, u, d, t, s) { woodTable(x, FULL, 0, 4, s.T); shade(x, 0, 0, LW, LH, P.ink0, 0.35); paperClose(x, FULL, { scrib: 5, crowd: beat(u, 0.2, 4.2), swirl: lerp(0, 2.2, beat(u, 2.6, 6.0)) }, t); },

  // He turns it over: blank but for the short motif.
  S31(x, u, d, t, s) {
    shade(x, 0, 0, LW, LH, P.void, 1); woodTable(x, FULL, 0, 4, s.T); shade(x, 0, 0, LW, LH, P.ink0, 0.3);
    const flip = beat(u, 0.2, 1.0);
    if (flip < 0.5) { x.save(); x.translate(LW / 2, 0); x.scale(1 - flip * 2 || 0.01, 1); x.translate(-LW / 2, 0); paperClose(x, FULL, { scrib: 5, crowd: 1, swirl: 2.2 }, t); x.restore(); }
    else { x.save(); x.translate(LW / 2, 0); x.scale(Math.max(0.01, (flip - 0.5) * 2), 1); x.translate(-LW / 2, 0); paperClose(x, FULL, { back: true }, t); x.restore(); }
  },

  // A word under the motif; the note comes back and settles by his hand.
  S32(x, u, d, t, s) {
    woodTable(x, FULL, 0, 4, s.T); shade(x, 0, 0, LW, LH, P.ink0, 0.3);
    const pg = paperClose(x, FULL, { back: true, melody: u > L('L53', 0.45) - s.start }, t);
    bigHand(x, 'A', 120 + ri(beat(u, 0.6, 2.4) * 40), 480, { k: 3, pencil: u < 3.0 });
    const land = beat(u, 2.4, 3.6), nx = lerp(320, 210, E.out(land)), ny = lerp(140, 440, E.inOut(land)) - Math.sin(land * Math.PI) * 30;
    if (u > 2.4) { glow(x, nx + 8, ny + 10, 60, 50, P.amber2, 0.25 * land); noteSprite(x, nx, ny, t, 1, 3); }
  },

  // He doesn't chase it now: he carries it in his palm and walks on.
  S33(x, u, d, t, s) {
    const up = u > 0.8, wk = walk(u, 1.4, d, 838, 900);
    setShot(x, (b, R) => street(b, R, { T: s.T, camX: 780, gy: 230, lamps: () => 1, people: [up ? { who: 'A', x: wk.x, dir: u < 1.4 ? 'front' : 'right', walk: wk.phase, pose: 'give', face: 'smile' } : { who: 'A', x: 838, dy: -15, dir: 'front', sit: true, pose: 'give', face: 'down' }],
      after: (wx, G) => noteSprite(b, wx((up ? wk.x : 838) + 6) - 3, G.gy + (up ? -12 : -20), t, 1) }, t));
  },

  // The stars are very bright and the moon hangs over the roofs; down to him walking, and to her looking up.
  S34(x, u, d, t, s) {
    const tilt = ease(u, 0.6, 5.0), gy = ri(lerp(900, 430, tilt));
    rect(x, 0, 0, LW, LH, s.T.sky[0]);
    street(x, FULL, { T: s.T, camX: 1000 + u * 6, gy, lamps: () => 1, people: [{ who: 'A', x: 1050 + u * 14, dir: 'right', walk: u * 0.9, pose: 'give' }, { who: 'B', x: 1280, dir: 'back', face: 'up', layer: 'near' }],
      after: (wx, G) => { noteSprite(x, wx(1056 + u * 14), G.gy - 16, t, 1); } }, t);
    // extra stars across the top while the camera is up there (for the 星 of the lyric)
    for (let k = 0; k < 40; k++) { const sx = hash(k * 3) * LW, sy = (hash(k * 5) * 300) - (430 - gy) * 0 + (gy - 430) * 0.5; if (sy < gy - 200) { const tw = mod(t * 0.6 + hash(k), 1) < 0.85; pset(x, sx, sy, tw ? P.cream0 : P.ink4); if (k % 5 === 0 && tw) { pset(x, sx - 1, sy, P.ink5); pset(x, sx + 1, sy, P.ink5); pset(x, sx, sy - 1, P.ink5); pset(x, sx, sy + 1, P.ink5); } } }
  },

  // The little square: from either side, closer.
  S35(x, u, d, t, s) {
    const ax = lerp(250, 360, beat(u, 0, d)), bx = lerp(560, 450, beat(u, 0.3, d));
    street(x, FULL, { T: s.T, camX: 220, gy: 430, lamps: () => 1, people: [{ who: 'A', x: ax, dir: 'right', walk: (ax - 250) / 16 }, { who: 'B', x: bx, dir: 'left', walk: (560 - bx) / 16, pose: 'bag' }] }, t);
  },

  // He stops first; fixes his cuff; taps the first half against the page — and stops.
  S36(x, u, d, t, s) {
    const t0 = nextBeat(s.start + 3.0), tap = tapDown(t, t0, 'front');
    setShot(x, (b, R) => street(b, R, { T: s.T, camX: 300, gy: 230, lamps: () => 1,
      people: [{ who: 'A', x: 380, dir: 'right', pose: u > 1.0 && u < 2.6 ? 'cuff' : u > 2.6 ? 'table' : 'hold', holding: u > 2.6 ? null : 'paper', tapUp: tap, face: u < 2.6 ? 'down' : u > 5.6 ? 'shy' : '' }, { who: 'B', x: 412, dir: 'left', pose: 'bag', face: u > 4.8 ? 'up' : '' }] }, t), 3, 20, 40);
  },

  // Two hands at the window ledge: his four, her three — the line complete. His ripples run into hers.
  S37(x, u, d, t, s) {
    // the café window behind (warm, out of focus), the stone ledge in front
    rect(x, 0, 0, LW, 330, mixHex(P.honey1, P.wood2, 0.35)); for (let k = 0; k < 12; k++) { x.save(); x.globalAlpha = 0.25; const r = 10 + ri(hash(k + 2) * 18); ellipse(x, hash(k) * LW, 40 + hash(k + 5) * 250, r, r, [P.honey0, P.cream0, P.amber2][k % 3]); x.restore(); }
    rect(x, 0, 120, LW, 6, mixHex(P.wood1, P.ink, 0.3)); rect(x, 176, 0, 6, 330, mixHex(P.wood1, P.ink, 0.3));
    rect(x, 0, 330, LW, 10, P.ink); rect(x, 0, 332, LW, LH - 332, P.stone4); hline(x, 0, LW, 333, P.stone5); for (let k = 0; k < 40; k++) pset(x, hash(k) * LW, 340 + hash(k + 9) * 280, P.stone3);
    shade(x, 0, 330, LW, LH - 330, P.ink0, 0.25);
    const t0 = nextBeat(s.start + 0.4), ta = tapIndex(t, t0, 'front'), tb = tapIndex(t, t0 + 3 * PHRASES.beat, 'back');
    const la = [0.5, 0.5, 0.3, 0]; if (ta >= 0) la[[0, 1, 2, 0][ta]] = 0;
    const lb = [0.5, 0.4, 0.3, 0]; if (tb >= 0) lb[[0, 1, 2][tb]] = 0;
    bigHand(x, 'A', 84, 420, { k: 3, lift: la });
    bigHand(x, 'B', 278, 434, { k: 3, lift: lb, facing: -1 });
    // each tap leaves a ring on the stone: his four on the left, her three on the right, then one line of seven
    const taps = [...MOTIF.front.map((p, i) => [t0 + p * PHRASES.beat, 150 + i * 3]), ...MOTIF.back.map((p, i) => [t0 + (3 + p) * PHRASES.beat, 202 + i * 3])];
    taps.forEach(([tt, cx], i) => { const v = (t - tt) / 1.2; if (v < 0 || v > 1) return; const r = 4 + v * 30; for (let a = 0; a < 48; a++) if (a % 2) pset(x, cx + Math.cos(a / 48 * TAU) * r, 452 + Math.sin(a / 48 * TAU) * r * 0.3, i < 4 ? P.cream0 : P.honey0); });
    const joined = beat(t, t0 + 4.2 * PHRASES.beat, t0 + 5.2 * PHRASES.beat);
    if (joined > 0) for (let k = 0; k < 7; k++) { const px = 108 + k * 24, py = 300 - Math.sin(k / 6 * Math.PI) * 26; if (k / 6 <= joined) { glow(x, px, py, 8, 8, k < 4 ? P.cream0 : P.honey0, 0.5); disc(x, px, py, 2, k < 4 ? P.cream0 : P.honey0); } }
  },

  // The note floats down onto the paper and becomes an ordinary dot of ink.
  S38(x, u, d, t, s) {
    woodTable(x, FULL, 0.3, 9, s.T); shade(x, 0, 0, LW, LH, P.ink0, 0.25);
    const pg = paperClose(x, FULL, { back: true, melody: true, bird: false, dot: u > 2.0 ? { x: 172, y: 176 } : null }, t);
    if (u < 2.0) { const v = beat(u, 0, 2.0); noteSprite(x, pg.px + 166 + ri(Math.sin(v * 6) * 10), pg.py + lerp(-60, 160, E.out(v)), t, 1 - beat(u, 1.6, 2.0), lerp(3, 1, v)); }
  },

  // The city goes back to its ordinary motion; the camera leaves it to the two of them.
  S39(x, u, d, t, s) {
    street(x, FULL, { T: s.T, camX: lerp(250, 290, beat(u, 0, d)), gy: 430, lamps: () => 1, tram: { x: 100 + u * 110, dir: 1 },
      people: [{ who: 'A', x: 470, dir: 'right', face: 'shy' }, { who: 'B', x: 486, dir: 'left', face: 'smile', pose: 'bag' }, { x: 300 + u * 15, dir: 'right' }] }, t);
  },

  // Walking side by side, a little gap between them; the wind comes; she holds her beret.
  S40(x, u, d, t, s) {
    const ax = 860 + u * 22, cam = ax - 80;
    setShot(x, (b, R) => street(b, R, { T: s.T, camX: cam, gy: 230, lamps: () => 1, wind: 1,
      people: [{ who: 'B', x: ax + 20, dir: 'right', walk: u * 1.4, pose: u > 2.2 && u < 3.6 ? 'raise' : 'bag', face: u > 1 ? 'smile' : '' }, { who: 'A', x: ax, dir: 'right', walk: u * 1.4, face: u > 3.8 ? 'shy' : '' }] }, t));
  },

  // His room, the same composition as before — but the other chair is taken.
  S41(x, u, d, t, s) {
    const push = beat(u, 1.0, 2.0), flip = beat(u, 3.0, 3.6), draw = beat(u, 4.0, 8.4);
    setShot(x, (b, R) => {
      roomSet(b, R, { T: s.T, lamp: 1, steam: 0.5, paper: { x: lerp(70, 96, push), y: 181 }, scribble: flip > 0.5 ? 0 : 5, second: false }, t);
      drawChar(b, 'B', ROOM.chairB, ROOM.chairY, { dir: 'left', sit: true, pose: u > 3 ? 'write' : 'table', face: u < 3 ? 'smile' : 'down', t });
      drawChar(b, 'A', ROOM.chairA, ROOM.chairY, { dir: 'right', sit: true, pose: u > 0.8 && u < 2.2 ? 'give' : 'table', face: u > 4 ? 'shy' : '', t });
      if (draw > 0) birdDoodle(b, 104, 186, P.ink1, 0.6);
    });
  },

  // They look at the page, look up together, look away. She taps once; he taps once. Back out of the window.
  S42(x, u, d, t, s) {
    const look = u > 1.0 && u < 2.2, away = u >= 2.2;
    const tapB = u > 3.4 && u < 3.6, tapA = u > 3.4 + PHRASES.beat && u < 3.6 + PHRASES.beat;
    const pull = ease(u, 4.6, d - 0.4);
    const draw = (b, R) => {
      roomSet(b, R, { T: s.T, lamp: 1, steam: 0.4, paper: { x: 96, y: 181 }, scribble: 0 }, t);
      birdDoodle(b, 104, 186, P.ink1, 0.6);
      drawChar(b, 'B', ROOM.chairB, ROOM.chairY, { dir: 'left', sit: true, pose: 'table', tapUp: tapB, face: look ? 'up' : away ? 'shy' : 'down', t });
      drawChar(b, 'A', ROOM.chairA, ROOM.chairY, { dir: 'right', sit: true, pose: 'table', tapUp: tapA, face: look ? 'up' : away ? 'shy' : 'down', t });
    };
    if (u < 4.8) { setShot(x, draw); return; }
    // out of the window: his lit window on the building front, two small figures at the table; the street carries on
    const v = u - 4.8, rise = ri(lerp(470, 520, ease(v, 0, d - 4.8)));
    street(x, FULL, { T: s.T, camX: 10, gy: rise, lamps: () => 1, hisWindow: { lit: true, two: true }, tram: { x: -200 + v * 95, dir: 1 }, people: [{ x: 330 - v * 12, dir: 'left' }, { x: 60 + v * 9, dir: 'right' }] }, t);
  },
};
const PI2 = p => TAU / p / 1;
// A tram crossing the frame at speed: accelerating out of the previous stop, past us, away.
function trainPass(u, t0) { const v = u - t0; return -300 + 90 * v + 70 * v * v; }

// Subtitle placement and style per shot (cream on dark by default).
const SUBSTYLE = {};

function drawFilm(x, t) {
  x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
  rect(x, 0, 0, LW, LH, P.void);
  const s = shotAt(t), u = t - s.start, d = s.end - s.start;
  s.T = todAt(lerp(s.k, s.k1, clamp(u / d)));
  (FX[s.id] || (() => {}))(x, u, d, t, s);
  // the very end: hold, then let the last frames sink into night
  if (t > SONG.duration - 2.2) shade(x, 0, 0, LW, LH, P.void, beat(t, SONG.duration - 2.2, SONG.duration) * 0.9);
  return s;
}
