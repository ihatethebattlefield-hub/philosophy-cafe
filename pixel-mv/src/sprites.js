'use strict';
/*
 * Characters and props, drawn as ASCII pixel maps.
 *
 * Both leads share one 12×20 body plan (head 9–10 rows, torso 6, legs 5) so
 * they stand at the same scale. Heads, torsos and legs are separate maps per
 * view; arms are drawn per pose from shoulder → elbow → hand, which keeps the
 * hand positions believable for reaching, giving, holding a phone or hugging.
 *
 *   A 阿屿  dark short hair · blue jacket · amber star pin (accessory)
 *   B 小晴  brown shoulder-length hair · cream sweater · coral scarf
 */
const KEY_COMMON = { k: P.ink, s: P.skin0, S: P.skin1, e: P.ink, w: P.white, o: P.white, O: P.stone3 };
const KEY_A = { ...KEY_COMMON, h: P.hairA0, H: P.hairA1, b: P.blue0, B: P.blue1, D: P.blue2, y: P.amber2, p: P.stone0, P: P.stone1 };
const KEY_B = { ...KEY_COMMON, h: P.hairB0, H: P.hairB1, J: P.hairB2, c: P.coral0, C: P.coral1, r: P.coral2, m: P.cream0, M: P.cream1, n: P.cream2, p: P.night2, P: P.night3 };

const CHAR = {
  A: {
    key: KEY_A, sleeve: P.blue0, sleeveDark: P.blue2, cuff: P.blue1,
    head: {
      front: ['...kkkkkk...', '..khhhhhhk..', '.khhHHHhhhk.', '.khhhhhhhhk.', '.khsshhsshk.', '.kssessesSk.', '.ksssssssSk.', '..kssssSSk..', '...kkkkkk...'],
      back: ['...kkkkkk...', '..khhhhhhk..', '.khhHHHhhhk.', '.khhhhhhhhk.', '.khhhhhhhhk.', '.khhhHhhhhk.', '.khhhhhhhhk.', '..khhhhhhk..', '...kkkkkk...'],
      side: ['...kkkkk....', '..khhhhhk...', '.khhHHhhhk..', '.khhhhhhhhk.', '.khhhhhsssk.', '.khhhhsssek.', '.khhhsssssk.', '..khhssSSk..', '...kkkkkk...'],
    },
    torso: {
      front: ['..kkbwwbkk..', '.kbbbwwbybk.', '.kbbbbbbbBk.', '.kbbbbbbbBk.', '.kBbbbbbbBk.', '..kDDDDDDk..'],
      back: ['..kkbbbbkk..', '.kbbbbbbbbk.', '.kbbbBbbbbk.', '.kbbbbbbbbk.', '.kBbbbbbbBk.', '..kDDDDDDk..'],
      side: ['...kbbbk....', '..kbbbybk...', '..kbbbbbBk..', '..kbbbbbBk..', '..kBbbbbBk..', '...kDDDDk...'],
    },
  },
  B: {
    key: KEY_B, sleeve: P.cream0, sleeveDark: P.cream2, cuff: P.cream1,
    head: {
      front: ['...kkkkkk...', '..kJhhhhhk..', '.khJHHhhhhk.', '.khhhhhhhhk.', 'khhsshhsshhk', 'khssessesShk', 'khsssssssShk', 'khhsssSSShhk', 'khhkkkkkkhhk', '.kh......hk.'],
      back: ['...kkkkkk...', '..khhhhhhk..', '.khhHHhhhhk.', '.khhhhJhhhk.', 'khhhhhhhhhhk', 'khhhhHhhhhhk', 'khhhhhhhhhhk', 'khhhhhhhhhhk', 'khhhhhhhhhhk', '.khhhhhhhhk.'],
      side: ['...kkkkk....', '..khhhhhk...', '.khhHHhhhk..', 'khhhhhhhhhk.', 'khhhhhhsssk.', 'khhhhhssesk.', 'khhhhsssssk.', 'khhhhssSSk..', 'khhhkkkkk...', '.khk........'],
    },
    torso: {
      front: ['..kcccccck..', '.kmcccCcmmk.', '.kmmmrcmmnk.', '.kmmmcmmmnk.', '.knmmmmmmnk.', '..knnnnnnk..'],
      back: ['..kcccccck..', '.kmccccccmk.', '.kmmmmmmmnk.', '.kmmmmmmmnk.', '.knmmmmmmnk.', '..knnnnnnk..'],
      side: ['...kccck....', '..kccccck...', '..kmmcmmnk..', '..kmmmmmnk..', '..knmmmmnk..', '...knnnnk...'],
    },
  },
};
const LEGS = {
  stand: ['...kpppPk...', '...kppkPk...', '...kppkPk...', '...kookook..', '...kkk.kkk..'],
  walkF1: ['...kpppPk...', '...kppkPk...', '...kookPk...', '...kkkkook..', '.......kkk..'],
  sideStand: ['....kppk....', '....kppk....', '....kppk....', '....kooook..', '....kkkkk...'],
  sideA: ['....kppk....', '...kpkkPk...', '..kpk..kPk..', '.kook..kook.', '.kkk....kkk.'],
  sideB: ['....kppk....', '....kppk....', '....kpPkk...', '....kookok..', '....kkkkk...'],
  sit: ['....kppppk..', '....kpppppk.', '........kpk.', '........kook', '........kkk.'],
};
function initSprites() {
  for (const who of ['A', 'B']) {
    const ch = CHAR[who];
    for (const v of ['front', 'back', 'side']) {
      sprite(`${who}_head_${v}`, ch.head[v], ch.key);
      // blink: eyes become skin for one frame
      sprite(`${who}_head_${v}_blink`, ch.head[v].map(r => r.replace(/e/g, 's')), ch.key);
      sprite(`${who}_torso_${v}`, ch.torso[v], ch.key);
    }
    for (const [n, rows] of Object.entries(LEGS)) sprite(`${who}_legs_${n}`, rows, ch.key);
  }
  initProps();
}

// Arm: shoulder → elbow → hand, 2 px thick sleeve, 2×2 hand with outline.
function arm(x, who, sx, sy, ex, ey, hx, hy) {
  const ch = CHAR[who];
  for (const [ax, ay, bx, by] of [[sx, sy, ex, ey], [ex, ey, hx, hy]]) {
    line(x, ax, ay, bx, by, ch.sleeveDark);
    line(x, ax + 1, ay, bx + 1, by, ch.sleeve);
  }
  rect(x, hx - 1, hy - 1, 4, 4, P.ink);
  rect(x, hx, hy, 2, 2, P.skin0);
}
// Hand targets for each pose, relative to the shoulder (facing right; mirrored for left).
const POSES = {
  down: { near: [0, 4, 0, 7], far: [0, 4, 0, 7] },
  phone: { near: [1, 3, 3, 3], far: [1, 3, 3, 4] },
  reach: { near: [3, 1, 7, 0], far: [0, 4, 0, 7] },
  give: { near: [3, 2, 6, 2], far: [2, 3, 5, 3] },
  press: { near: [3, 3, 6, 5], far: [0, 4, 0, 7] },
  raise: { near: [2, -3, 3, -7], far: [0, 4, 0, 7] },
  shade: { near: [2, -2, 3, -5], far: [0, 4, 0, 7] },
  hug: { near: [4, 1, 7, 2], far: [4, 2, 7, 3] },
  book: { near: [2, 3, 4, 2], far: [2, 3, 4, 3] },
};
/*
 * Draws a lead with feet at (fx, fy) (bottom centre).
 *   dir: 'front' | 'back' | 'left' | 'right'
 *   pose: key of POSES; walk: phase in [0, 1) or null; sit: bool
 *   t: absolute time for breathing and blinks; seed: per-shot blink offset
 */
function drawChar(x, who, fx, fy, o = {}) {
  const dir = o.dir || 'front', side = dir === 'left' || dir === 'right', flip = dir === 'left';
  const view = side ? 'side' : dir;
  const t = o.t || 0;
  const walking = o.walk !== undefined && o.walk !== null;
  const step = walking ? Math.floor(mod(o.walk, 1) * 4) : 0;
  const breathe = !walking && !o.still && mod(t + (who === 'B' ? 1.1 : 0), 3.2) > 1.6 ? 1 : 0;
  const bob = walking && (step === 1 || step === 3) ? -1 : 0;
  const blink = mod(t * 1 + (o.seed || 0) + (who === 'B' ? 1.7 : 0), 3.7) < 0.12;
  const sitDrop = o.sit ? 3 : 0;
  const ox = ri(fx) - 6, oy = ri(fy) - 20 + sitDrop;
  x.save();
  if (flip) { x.translate(ri(fx) * 2, 0); x.scale(-1, 1); }
  // legs
  let legs = side ? (o.sit ? 'sit' : walking ? ['sideA', 'sideB', 'sideA', 'sideB'][step] : 'sideStand') : walking && step % 2 === 0 ? 'walkF1' : 'stand';
  const legFlip = !side && walking && step === 2;
  blit(x, `${who}_legs_${legs}`, ox, oy + 15 + (o.sit && side ? 0 : 0), { flip: legFlip });
  // far arm behind the body (side views)
  const pose = POSES[o.pose || 'down'];
  const swing = walking ? [1, 0, -1, 0][step] : 0;
  const shoulder = side ? [ox + 6, oy + 10 + bob] : [ox + (dir === 'back' ? 9 : 1), oy + 10 + bob];
  if (side) {
    const f = pose.far;
    arm(x, who, shoulder[0], shoulder[1], shoulder[0] + f[0] - swing, shoulder[1] + f[1], shoulder[0] + f[2] - swing * 2, shoulder[1] + f[3]);
  }
  blit(x, `${who}_torso_${view}`, ox, oy + 9 + bob + breathe * 0);
  // scarf tail streams behind B when moving or in wind
  if (who === 'B' && (walking || o.wind)) {
    const fl = Math.floor(t * 6) % 2;
    const sx0 = side ? ox + 3 : ox + 8;
    rect(x, sx0 - 1, oy + 10 + bob, 2, 1, P.coral0);
    rect(x, sx0 - 2 - fl, oy + 11 + bob + fl, 2, 1, P.coral1);
  }
  const hy = oy + bob - breathe;
  blit(x, `${who}_head_${view}${blink && dir !== 'back' ? '_blink' : ''}`, ox + (o.lookUp ? 0 : 0), hy - (o.lookUp ? 1 : 0) + (o.lookDown ? 1 : 0));
  // near arm(s)
  if (side) {
    const n = pose.near;
    arm(x, who, shoulder[0] + 1, shoulder[1], shoulder[0] + 1 + n[0] + swing, shoulder[1] + n[1], shoulder[0] + 1 + n[2] + swing * 2, shoulder[1] + n[3]);
    if (o.holding) blit(x, o.holding, shoulder[0] + n[2] - 1, shoulder[1] + n[3] - 4);
  } else {
    const n = pose.near, lsx = ox + 1, rsx = ox + 10, sy = oy + 10 + bob;
    if (o.pose === 'phone' || o.pose === 'book' || o.pose === 'give') {
      arm(x, who, lsx, sy, lsx + 1, sy + 3, ox + 4, sy + 4);
      arm(x, who, rsx, sy, rsx - 1, sy + 3, ox + 7, sy + 4);
      if (o.holding) blit(x, o.holding, ox + 4, sy + 1);
    } else if (o.pose === 'raise' || o.pose === 'shade' || o.pose === 'reach') {
      arm(x, who, lsx, sy, lsx, sy + 4, lsx, sy + 6 - swing);
      arm(x, who, rsx, sy, rsx + 1, sy - 2, rsx + 1, sy - (o.pose === 'reach' ? 3 : 6));
    } else {
      arm(x, who, lsx, sy, lsx - 1, sy + 3, lsx - 1, sy + 6 + swing);
      arm(x, who, rsx, sy, rsx + 1, sy + 3, rsx + 1, sy + 6 - swing);
    }
  }
  x.restore();
}
// Shadow under a standing character (two-tone dithered oval).
function charShadow(x, fx, fy, col = P.ink, w = 7) {
  dither(x, fx - w, fy - 1, w * 2, 2, col, 0.5);
}

// ------------------------------------------------------------- props
function initProps() {
  const K = { k: P.ink, w: P.white, c: P.coral0, C: P.coral1, r: P.coral2, a: P.amber1, A: P.amber2, b: P.blue0, B: P.blue1, m: P.cream0, M: P.cream1, n: P.cream2,
    d: P.wood2, D: P.wood1, l: P.wood3, g: P.green1, G: P.green2, s: P.stone2, S: P.stone3, x: P.stone1, t: P.screen, v: P.night3, y: P.amber3 };
  sprite('mug', ['.kkkkk.', 'kcccccK', 'kcwcccK', 'kcccccKk', 'kcccccK.', '.kkkkk..'].map(r => r.replace(/K/g, 'k')), K);
  sprite('phone', ['kkkk', 'kttk', 'kttk', 'kttk', 'kkkk'], K);
  sprite('phone_off', ['kkkk', 'kvvk', 'kvvk', 'kvvk', 'kkkk'], K);
  sprite('envelope', ['kkkkkkkk', 'kmmmmmmk', 'kMmmmmMk', 'kmMccMmk', 'kmmccmmk', 'kkkkkkkk'], K);
  sprite('book', ['kkkkkkk', 'kbbbbbk', 'kbAAAbk', 'kbbbbbk', 'kbbbbbk', 'kkkkkkk'], K);
  sprite('bookmark', ['kk', 'ck', 'ck', 'ck', 'ck', 'kk'].map(r => r.replace('ck', 'cc')), K);
  sprite('photo', ['kkkkkkkk', 'kwwwwwwk', 'kwvvAvwk', 'kwvvvvwk', 'kwwwwwwk', 'kkkkkkkk'], K);
  sprite('headphones', ['..kkkk..', '.k....k.', 'k......k', 'kc....ck', 'kc....ck', '.k....k.'], K);
  sprite('ticket', ['kkkkkkkkk', 'kmmmmcmmk', 'kmnnmcmmk', 'kmmmmcmmk', 'kkkkkkkkk'], K);
  sprite('umbrella', ['....kkk....', '..kcccccc..', '.kccCccCcc.', 'kcCcccccCck', 'kkkkkkkkkkk', '.....k.....', '.....k.....', '.....k.....', '.....kk....'], K);
  sprite('plant', ['..g.G..', '.gGgGg.', 'gGgGgGg', '.gGgGg.', '..kkk..', '.kdddk.', '.kdddk.', '..kkk..'], K);
  sprite('radio', ['kkkkkkkkkkkk', 'kxxxxxxxxxxk', 'kxkkkxxsskxk', 'kxkAkxxxxxxk', 'kxkkkxkSkSkk', 'kxxxxxxxxxxk', 'kkkkkkkkkkkk'], K);
  sprite('lamp', ['..kkkkk..', '.kAAAAAk.', 'kAyyyyyAk', 'kkkkkkkkk', '....k....', '....k....', '....k....', '..kkkkk..'], K);
  sprite('lamp_off', ['..kkkkk..', '.kssssk..', 'kssssssk.', 'kkkkkkkkk', '....k....', '....k....', '....k....', '..kkkkk..'], K);
}
