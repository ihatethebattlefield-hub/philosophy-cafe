'use strict';
/*
 * Three test pieces made before the whole song, to prove the shots differ in kind while
 * sharing one pixel system:
 *   A  side view in the hall (the coat) → her own hands folding the cuff → the memory of him folding it
 *   B  the street front-on → the camera's frame → the old photo lined up inside it
 *   C  the late-night stall, the two of them → bowls and chopsticks → the same table now, on a call
 */
const beat = (t, a, b) => clamp((t - a) / (b - a));
const ease = (t, a, b) => E.inOut(beat(t, a, b));
function walk(t, t0, t1, a, b) { const u = beat(t, t0, t1), e = u < 0.1 ? u * u / 0.2 : u > 0.9 ? 1 - (1 - u) * (1 - u) / 0.2 : u - 0.05, k = clamp(e / 0.9); const px = lerp(a[0], b[0], k), moving = t > t0 && t < t1; return { x: px, moving, phase: moving ? mod(Math.abs(px - a[0]) / 64, 1) : null }; }
function fadeBlack(x, k) { if (k <= 0) return; x.fillStyle = P.void; for (let y = 0; y < LH; y++) for (let xx = 0; xx < LW; xx++) if (BAYER[(y & 3) * 4 + (xx & 3)] < k) x.fillRect(xx, y, 1, 1); }
function lyricBand(x, label) { rect(x, 0, SH, LW, LH - SH, P.ink); hline(x, 0, LW - 1, SH, P.ink2); if (label) text(x, label, LW / 2, SH + 30, P.cr3, FONT.small, { align: 'center' }); }

const A_SHOTS = [
  [0, (x, u, t) => { // the hall, side on: she comes in, reaches up, takes the coat off the hook, turns
    const wk = walk(u, 0, 1.8, [-40], [86]), lift = u > 2.8, up = ease(u, 2.1, 2.7), down = ease(u, 2.9, 3.4);
    const handR = u < 2.1 ? 'down' : !lift ? [lerp(1, 6, up), lerp(14, -13, up)] : [lerp(6, 4, down), lerp(-13, 6, down)];
    const front = u > 3.7;
    hallScene(x, { coatOnHook: !lift, people: [{ who: 'her', x: wk.x, s: 4, view: front ? 'front' : 'right', walk: wk.phase, handR: front ? [-3, 8] : handR, hold: lift ? { R: 'coat' } : null, head: { look: u > 1.9 && u < 3.0 ? 'up' : '' } }] }, t);
  }],
  [4.6, (x, u, t) => { // her hands in his coat: cuffs too long; one hand folds the other cuff, lets go, it slips a little
    const out = ease(u, 1.0, 1.6) * (1 - ease(u, 3.0, 3.6)), f = ease(u, 1.6, 3.0), slide = ease(u, 3.4, 3.8) * 5;
    const edge = fpCuffEdge(f);
    fpSleeves(x, { foldL: f, slideL: slide, peekL: u > 0.4, peekR: u > 0.5 && out < 0.05, rHand: out > 0.01 ? { to: [edge[0] - 26, edge[1] - 26], k: out, pinch: u > 1.5 && u < 3.1 } : null }, t);
  }],
  [9.4, (x, u, t) => { // the same cuff, then: his hands folding it for her
    const k = ease(u, 0, 0.6) * 0.5 + ease(u, 0.6, 1.8) * 0.5;
    fpSleeves(x, { bg: 'pavement', memory: true, foldL: ease(u, 0.6, 1.8), his: { k: k * (1 - ease(u, 1.9, 2.2)) }, peekR: true }, t);
  }],
  [11.6, (x, u, t) => { // the two of them on the bench: she holds up the other sleeve; he folds that one too
    const raise = ease(u, 0.5, 1.1), reach = ease(u, 1.2, 1.8), done = u > 2.6, smile = u > 2.8;
    benchClose(x, { memory: true, people: [
      { who: 'him', x: 104, b: 1.45, view: 'right', armR: { to: [lerp(10, 74, reach), lerp(-30, -74, reach)], kind: reach > 0.8 ? 'hold' : 'open' }, armL: { to: [-6, 10] }, head: { look: u < 1.2 ? 'down' : '' }, eyes: smile ? 'smile' : '', mouth: smile ? 'smile' : '' },
      { who: 'her', x: 262, b: 1.45, view: 'left', outfit: 'coat', cuffs: ['folded', done ? 'folded' : 'long'], armR: { to: [lerp(14, 52, raise), lerp(-20, -72, raise)], kind: 'open' }, armL: { to: [-8, 6] }, eyes: smile ? 'smile' : '', mouth: smile ? 'smile' : u > 0.6 ? 'open' : '', blush: 0.8 }] }, t);
  }],
  [15.4, (x, u, t) => { // now: she folds the other cuff herself, takes the keys, goes out
    const fold = u > 1.1, keys = u > 1.9, wk = walk(u, 2.2, 3.6, [70], [282]), door = ease(u, 3.0, 3.4), gone = u > 3.7;
    const her = { who: 'her', x: wk.x, s: 4, outfit: 'coat', cuffs: ['folded', fold ? 'folded' : 'long'], view: u < 2.2 ? 'front' : 'right', walk: wk.phase,
      handL: u > 0.3 && u < 1.2 ? [9, 2] : u > 1.4 && u < 2.0 ? [2, 10] : 'down', handR: u > 0.3 && u < 1.2 ? [-2, 6] : 'down', hold: keys ? { L: 'keys' } : null, head: { look: u < 2.0 ? 'down' : '' } };
    hallScene(x, { coatOnHook: false, keys: !keys, door: door * (1 - ease(u, 3.9, 4.0) * 0), people: gone ? [] : [her] }, t);
    fadeBlack(x, beat(u, 3.6, 4.0));
  }],
];
const B_SHOTS = [
  [0, (x, u, t) => { // the street front-on; she walks; a bike passes in front; she stops by the bench, lifts the phone
    const wk = walk(u, 0, 4.2, [130], [668]), cam = clamp(wk.x - 150, 0, STREET.w - LW), front = u > 4.4, raise = ease(u, 4.7, 5.3);
    streetScene(x, { camX: cam, people: [{ who: 'her', x: wk.x, view: front ? 'front' : 'right', walk: wk.phase, outfit: 'coat', cuffs: ['folded', 'folded'], handR: front ? [lerp(1.6, -2, raise), lerp(14, -9, raise)] : 'down', hold: front && raise > 0.3 ? { R: 'phone' } : null, head: { look: u > 4.3 && u < 4.7 ? 'down' : front ? 'up' : '' } }, { who: 'p2', x: 300 + u * 22, view: 'right', walk: mod(u * 0.7, 1) }],
      traffic: [{ kind: 'bike', x: cam - 80 + beat(u, 2.4, 4.2) * 520 }, { kind: 'car', x: cam + 420 - beat(u, 0.2, 2.2) * 640, col: P.sg2 }] }, t);
  }],
  [5.6, (x, u, t) => { // the camera: her on one side, the seat beside her empty; the old photo lines up; she slides it; shutter
    const k = ease(u, 0.8, 1.4), align = ease(u, 1.4, 2.6), slideOut = ease(u, 3.0, 3.9), slideBack = ease(u, 4.3, 5.0), split = 1 - slideOut * 0.62 + slideBack * 0.62 * 0, sp = u < 4.3 ? 1 - slideOut * 0.62 : 0.38 + slideBack * 0.62;
    const gone = ease(u, 5.2, 5.6);
    const fx = 40 + 290 * (1 - sp), finger = u > 2.8 && u < 5.1 ? { x: fx + 6, y: 360 } : u > 5.7 && u < 6.3 ? { x: 186, y: 552 } : null;
    viewfinder(x, { live: { smile: u > 5.0 }, photo: gone < 1 ? { k: k * (1 - gone), align, split: sp } : null, finger, press: u > 5.9 && u < 6.1, flash: u > 6.0 && u < 6.15 ? 0.8 : 0, thumb: u > 6.1 ? 'new' : 'old' }, t);
  }],
  [12.4, (x, u, t) => { // her, looking at what she just took; a small smile
    benchClose(x, { people: [{ who: 'her', x: 180, b: 1.6, view: 'front', outfit: 'coat', cuffs: ['folded', 'folded'], head: { look: 'down', tilt: u > 1.6 ? 0.05 : 0 }, eyes: u > 2.0 ? 'smile' : '', mouth: u > 1.8 ? 'smile' : '', blush: 0.7, armR: { to: [18, -40], kind: 'hold' }, armL: { to: [-20, -36], kind: 'hold' }, hold: { R: 'phone' } }] }, t);
    fadeBlack(x, beat(u, 3.2, 3.6));
  }],
];
const C_SHOTS = [
  [0, (x, u, t) => { // then: side by side at the stall, the food nearly gone, neither getting up; the owner starts closing
    const closing = u > 2.6, look = u > 3.8;
    stallScene(x, { memory: true, stoolsStacked: closing, bowlsStacked: closing, owner: { x: closing ? lerp(230, 200, ease(u, 2.6, 3.4)) : 230, handR: closing ? [-8, 4] : [-2, 8] },
      people: [{ who: 'her', x: 118, view: 'front', head: { turn: look ? 0.6 : 0.1, look: look ? '' : 'down' }, eyes: look ? 'smile' : '', mouth: look ? 'smile' : '', armL: { to: [-34, -54], kind: 'flat' }, armR: { to: [22, -60], kind: 'hold' }, hold: { R: 'chopsticks' } },
               { who: 'him', x: 248, view: 'front', head: { turn: look ? -0.6 : -0.1, look: look ? '' : 'down' }, eyes: look ? 'smile' : '', mouth: look ? 'smile' : '', armL: { to: [-26, -54], kind: 'flat' }, armR: { to: [34, -52], kind: 'flat' } }],
      table: [{ k: 'bowl', x: 112, left: true, sticks: true }, { k: 'bowl', x: 244, left: true }, { k: 'cup', x: 170 }, { k: 'cup', x: 196, drink: P.cr1 }, { k: 'napkins', x: 330 }] }, t);
  }],
  [5.0, (x, u, t) => { // the bowls, close: she lifts a little, puts it down again; his hand stops, sets his bowl back
    tableClose(x, { memory: true, herPick: ease(u, 0.3, 1.0) * (1 - ease(u, 1.4, 2.0)), hisStack: ease(u, 1.2, 1.8) * (1 - ease(u, 2.4, 3.1)) }, t);
  }],
  [9.0, (x, u, t) => { // now: the same table and camera; a takeout box; the phone propped on the cup where he sat
    stallScene(x, { owner: { x: 230 }, people: [{ who: 'her', x: 118, view: 'front', head: { turn: 0.5 }, mouth: u > 1.6 ? 'talk' : '', armL: { to: [-34, -54], kind: 'flat' }, armR: { to: [26, -62], kind: 'hold' }, hold: { R: 'chopsticks' } }],
      table: [{ k: 'takeout', x: 112 }, { k: 'cup', x: 214 }, { k: 'phone', x: 232 }, { k: 'napkins', x: 330 }] }, t);
  }],
  [12.0, (x, u, t) => { callScreen(x, { talk: u < 1.6, smile: u > 1.6, herLaugh: u > 1.8, time: '23:41' }, t); }],
  [14.6, (x, u, t) => { // she laughs, and eats
    stallScene(x, { owner: { x: 230 }, people: [{ who: 'her', x: 118, view: 'front', head: { turn: 0.5, tilt: 0.06 }, eyes: 'smile', mouth: 'grin', blush: 0.9, armL: { to: [-34, -54], kind: 'flat' }, armR: { to: [lerp(26, 12, ease(u, 0.6, 1.2)), lerp(-62, -96, ease(u, 0.6, 1.2))], kind: 'hold' }, hold: { R: 'chopsticks' } }],
      table: [{ k: 'takeout', x: 112 }, { k: 'cup', x: 214 }, { k: 'phone', x: 232 }, { k: 'napkins', x: 330 }] }, t);
    fadeBlack(x, beat(u, 1.8, 2.2));
  }],
];
const SAMPLES = { C: { dur: 16.8, label: '样片 C · 夜宵与通话', shots: C_SHOTS }, B: { dur: 16.0, label: '样片 B · 街道与取景框', shots: B_SHOTS }, A: { dur: 19.4, label: '样片 A · 外套与袖口', shots: A_SHOTS } };
function drawSample(x, id, t) {
  const S = SAMPLES[id]; let k = 0; for (let i = 0; i < S.shots.length; i++) if (t >= S.shots[i][0]) k = i;
  x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; rect(x, 0, 0, LW, LH, P.void);
  clip(x, { x: 0, y: 0, w: LW, h: SH }, () => S.shots[k][1](x, t - S.shots[k][0], t));
  lyricBand(x, S.label);
}
