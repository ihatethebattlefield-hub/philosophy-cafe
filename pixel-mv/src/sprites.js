'use strict';
/*
 * Characters and props, drawn as ASCII pixel maps.
 *
 * Both leads share one 14×28 body plan, 1 m ≈ 17 px: head 13 rows, torso 9,
 * legs 8 (rows overlap by one outline). Heads, torsos and legs are separate
 * maps per view. Arms are drawn per pose from shoulder → elbow → hand, with
 * an ink outline, so reaching, giving, holding a phone or hugging keep
 * believable hand positions.
 *
 *   A 阿屿  dark short hair · blue jacket over a white tee · amber star pin
 *   B 小晴  brown shoulder-length hair with a coral clip · cream sweater · coral scarf · navy skirt
 */
const KEY_COMMON = { k: P.ink, s: P.skin0, S: P.skin1, e: P.ink, w: P.white, q: '#f2a48e', m: '#b5523f' };
const KEY_A = { ...KEY_COMMON, h: P.hairA0, H: P.hairA1, b: P.blue0, B: P.blue1, D: P.blue2, t: P.white, y: P.amber2, p: P.stone1, P: P.stone0, o: P.white, O: P.stone3 };
const KEY_B = { ...KEY_COMMON, h: P.hairB0, H: P.hairB1, J: P.hairB2, c: P.coral0, C: P.coral1, r: P.coral2, n: P.cream0, N: P.cream1, M: P.cream2, p: P.blue2, P: P.night1, T: P.night1, o: P.wood2, O: P.wood1 };

const CHAR = {
  A: {
    key: KEY_A, sleeve: P.blue0, sleeveDark: P.blue1,
    head: {
      front: ['....kkkkkk....', '..kkhhhhhhkk..', '.khhhHHHhhhhk.', 'khhHHhhhhhhhhk', 'khhhhhhhhhhhhk', 'khhhhhhhhhhhhk', 'khhsshhhsshhhk',
        'khsewssssewshk', 'kssseesssseesk', 'ksqqssssssqqSk', '.kssssmmsssSk.', '..kkssssSSkk..', '....kkkkkk....'],
      back: ['....kkkkkk....', '..kkhhhhhhkk..', '.khhhHHHhhhhk.', 'khhHHhhhhhhhhk', 'khhhhhhhhhhhhk', 'khhhhhHhhhhhhk', 'khhhhhhhhhhhhk',
        'khhhhhhhhhhhhk', 'khhhhhhhhhhhhk', 'kShhhhhhhhhhSk', '.khhhhhhhhhhk.', '..kkSssssSkk..', '....kkkkkk....'],
      side: ['...kkkkkk.....', '.kkhhhhhhkk...', 'khhhHHHhhhhk..', 'khhHHhhhhhhhk.', 'khhhhhhhhhhhhk', 'khhhhhhhhhhhhk', 'khhhhhhhhshhsk',
        'khhhhhhsssewsk', 'khhhhhSssseesk', 'khhhhssssqsssk', '.khhhsssssmsk.', '..khksssssSk..', '...kkkkkkkk...'],
    },
    torso: {
      front: ['....kkttkk....', '..kkbbttbbkk..', '.kbbbbttbbbbk.', '.kbbbbttbbybk.', '.kbbbbttbbbBk.', '.kbbbbbtbbbBk.', '.kBbbbbbbbbBk.', '.kDDDDDDDDDDk.', '..kkkkkkkkkk..'],
      back: ['....kkkkkk....', '..kkbbbbbbkk..', '.kbbbbbbbbbbk.', '.kbbbbBbbbbbk.', '.kbbbbbbbbbBk.', '.kbbbbbbbbbBk.', '.kBbbbbbbbbBk.', '.kDDDDDDDDDDk.', '..kkkkkkkkkk..'],
      side: ['.....kkkk.....', '....kbbtbk....', '...kbbbbtbk...', '...kbbbbbyk...', '...kbbbbbbk...', '...kbbbbbBk...', '...kBbbbbBk...', '...kDDDDDDk...', '....kkkkkk....'],
    },
    legs: {
      stand: ['...kppppppk...', '...kpppppPk...', '...kppkkpPk...', '...kppkkpPk...', '...kppkkpPk...', '...kppkkpPk...', '..kooOkkooOk..', '..kkkkkkkkkk..'],
      walkF: ['...kppppppk...', '...kpppppPk...', '...kppkkpPk...', '...kppkkpPk...', '..kooOkkpPk...', '..kkkkkkpPk...', '.......kooOk..', '.......kkkkk..'],
      sideStand: ['.....kpppk....', '.....kppPk....', '.....kppPk....', '.....kppPk....', '.....kppPk....', '.....kppPk....', '.....kooooOk..', '.....kkkkkkk..'],
      sideA: ['.....kpppk....', '....kppkpPk...', '....kpk.kpPk..', '...kpk...kpPk.', '...kpk....kPk.', '..kpk.....kPk.', '.kooOk....kooOk', '.kkkkk....kkkkk'],
      sideB: ['.....kpppk....', '.....kppPk....', '.....kppPk....', '....kppkPk....', '....kpk.kPk...', '....kpk.kPk...', '...kooOkkooOk.', '...kkkkk.kkkk.'],
      sitF: ['...kppppppk...', '..kpppppppPk..', '..kppPkkppPk..', '..kooOk.kooOk.', '..kkkkk.kkkkk.'],
      sit: ['....kpppppppk.', '....kppppppPPk', '.....kkkkkkpPk', '..........kpPk', '..........kpPk', '..........kpPk', '..........kooOk', '..........kkkkk'],
    },
  },
  B: {
    key: KEY_B, sleeve: P.cream0, sleeveDark: P.cream2,
    head: {
      front: ['....kkkkkk....', '..kkhhhhhhkk..', '.khhhHHHhhcck.', 'khhHHhhhhhcchk', 'khhhhhhhhhhhhk', 'khhhhhhhhhhhhk', 'khhsshhhhsshhk',
        'khsewssssewshk', 'khseessssseehk', 'khsqssssssqshk', 'khhsssmmsssShk', 'khhhkssssSkhhk', 'khhhhkkkkkhhhk', 'khhhk....khhhk', '.khhk....khhk.', '..kk......kk..'],
      back: ['....kkkkkk....', '..kkhhhhhhkk..', '.khhhHHHhhcck.', 'khhHHhhhhhcchk', 'khhhhhhhhhhhhk', 'khhhhhHhhhhhhk', 'khhhhhhhhhhhhk',
        'khhhhhhhhhhhhk', 'khhhhhhhJhhhhk', 'khhhhhhhhhhhhk', 'khhhhhhhhhhhhk', 'khhhhhhhhhhhhk', 'khhhhhhhhhhhhk', 'khhhhhhhhhhhhk', '.khhhhhhhhhhk.', '..kkkkkkkkkk..'],
      side: ['...kkkkkk.....', '.kkhhhhhhkk...', 'khhhHHHhhhhk..', 'khhHHhhhhhhhk.', 'khcchhhhhhhhhk', 'khcchhhhhhhhhk', 'khhhhhhhhhsshk',
        'khhhhhhhssewsk', 'khhhhhhssseesk', 'khhhhhhsssqssk', 'khhhhhhssssmk.', 'khhhhhkssssSk.', 'khhhhhkkkkkk..', 'khhhhk........', '.khhk.........', '..kk..........'],
    },
    torso: {
      front: ['....kkkkkk....', '..kccccccccck.', '.knnccCccccnk.', '.knnnnrcnnnNk.', '.knnnnrcnnnNk.', '.knnnnnnnnnNk.', '.kNnnnnnnnnNk.', '.kMMMMMMMMMMk.', '..kkkkkkkkkk..'],
      back: ['....kkkkkk....', '..kccccccccck.', '.knccccccccnk.', '.knnnnnnnnnNk.', '.knnnnnnnnnNk.', '.knnnnnnnnnNk.', '.kNnnnnnnnnNk.', '.kMMMMMMMMMMk.', '..kkkkkkkkkk..'],
      side: ['.....kkkk.....', '....kcccck....', '...kcnnCcck...', '...knnnnrck...', '...knnnnnrk...', '...knnnnnNk...', '...kNnnnnNk...', '...kMMMMMMk...', '....kkkkkk....'],
    },
    legs: {
      stand: ['..kppppppppk..', '..kppppppPPk..', '..kPPPPPPPPk..', '...kkkkkkkk...', '....kTk.kTk...', '....kTk.kTk...', '...kooOkkooOk.', '...kkkkk.kkkk.'],
      walkF: ['..kppppppppk..', '..kppppppPPk..', '..kPPPPPPPPk..', '...kkkkkkkk...', '...kooOk.kTk..', '...kkkkk.kTk..', '........kooOk.', '........kkkkk.'],
      sideStand: ['....kppppk....', '...kpppppPk...', '...kPPPPPPk...', '....kkkkkk....', '.....kTTk.....', '.....kTTk.....', '.....kooooOk..', '.....kkkkkkk..'],
      sideA: ['....kppppk....', '...kpppppPk...', '..kPPPPPPPPk..', '...kTkkkkTk...', '...kTk...kTk..', '..kTk.....kTk.', '.kooOk....kooOk', '.kkkkk....kkkkk'],
      sideB: ['....kppppk....', '...kpppppPk...', '...kPPPPPPk...', '....kkkkkk....', '....kTk.kTk...', '....kTk.kTk...', '...kooOkkooOk.', '...kkkkk.kkkk.'],
      sitF: ['..kppppppppk..', '..kPPPPPPPPk..', '...kTk..kTk...', '..kooOk.kooOk.', '..kkkkk.kkkkk.'],
      sit: ['....kppppppppk', '....kpppppPPPk', '.....kkkkkkkTk', '..........kTTk', '..........kTTk', '..........kTTk', '..........kooOk', '..........kkkkk'],
    },
  },
};
const BODY = { torsoY: 12, legsY: 20, h: 28 };

function initSprites() {
  for (const who of ['A', 'B']) {
    const ch = CHAR[who];
    for (const v of ['front', 'back', 'side']) {
      sprite(`${who}_head_${v}`, ch.head[v], ch.key);
      sprite(`${who}_head_${v}_blink`, ch.head[v].map((r, i) => (i === 7 ? r.replace(/ew/g, 'ss').replace(/we/g, 'ss') : i === 8 ? r.replace(/ee/g, 'kk') : r)), ch.key);
      sprite(`${who}_head_${v}_smile`, ch.head[v].map((r, i) => (i === 7 ? r.replace(/ew/g, 'ss').replace(/we/g, 'ss') : i === 8 ? r.replace(/ee/g, 'kk') : i === 10 ? r.replace(/mm/g, 'kk').replace(/m/g, 'k') : r)), ch.key);
      sprite(`${who}_head_${v}_down`, ch.head[v].map((r, i) => (i === 7 ? r.replace(/ew/g, 'ss').replace(/we/g, 'ss') : r)), ch.key);
      sprite(`${who}_torso_${v}`, ch.torso[v], ch.key);
    }
    for (const [n, rows] of Object.entries(ch.legs)) sprite(`${who}_legs_${n}`, rows, ch.key);
  }
  initProps();
}

// Arm: shoulder → elbow → hand. Ink outline first, then a 2-px sleeve, then the hand.
function arm(x, who, sx, sy, ex, ey, hx, hy) {
  const ch = CHAR[who];
  const seg = (ax, ay, bx, by, fn) => { const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay))); for (let k = 0; k <= n; k++) fn(ri(ax + (bx - ax) * k / n), ri(ay + (by - ay) * k / n)); };
  for (const [ax, ay, bx, by] of [[sx, sy, ex, ey], [ex, ey, hx, hy]]) seg(ax, ay, bx, by, (px, py) => rect(x, px - 1, py - 1, 4, 4, P.ink));
  rect(x, hx - 1, hy - 1, 4, 4, P.ink);
  for (const [ax, ay, bx, by] of [[sx, sy, ex, ey], [ex, ey, hx, hy]]) seg(ax, ay, bx, by, (px, py) => { rect(x, px, py, 2, 2, ch.sleeve); pset(x, px + 1, py + 1, ch.sleeveDark); });
  rect(x, hx, hy, 2, 2, P.skin0); pset(x, hx + 1, hy + 1, P.skin1);
}
// Elbow and hand offsets from the shoulder, facing right (side views).
const POSES = {
  down: { near: [0, 4, 0, 8], far: [0, 4, 0, 8] },
  phone: { near: [1, 5, 4, 4], far: [1, 5, 4, 5] },
  reach: { near: [4, 1, 9, 0], far: [0, 4, 0, 8] },
  give: { near: [3, 4, 7, 3], far: [2, 4, 6, 4] },
  press: { near: [3, 4, 7, 6], far: [0, 4, 0, 8] },
  raise: { near: [2, -4, 3, -9], far: [0, 4, 0, 8] },
  shade: { near: [3, -2, 5, -6], far: [0, 4, 0, 8] },
  hug: { near: [5, 2, 9, 2], far: [5, 3, 9, 4] },
  book: { near: [2, 5, 5, 4], far: [2, 5, 5, 5] },
  umbrella: { near: [2, 3, 4, -2], far: [0, 4, 0, 8] },
  bag: { near: [0, 4, 1, 8], far: [0, 4, 0, 8] },
};
/*
 * Draws a lead with feet at (fx, fy) (bottom centre).
 *   dir: 'front' | 'back' | 'left' | 'right'
 *   pose: key of POSES; walk: phase in [0, 1) or null; sit: bool
 *   face: 'blink' | 'smile' | 'down' (fixed expression); t: time for breathing and blinks
 */
function drawChar(x, who, fx, fy, o = {}) {
  const dir = o.dir || 'front', side = dir === 'left' || dir === 'right', flip = dir === 'left';
  const view = side ? 'side' : dir;
  const t = o.t || 0;
  const walking = o.walk !== undefined && o.walk !== null;
  const step = walking ? Math.floor(mod(o.walk, 1) * 4) : 0;
  const breathe = !walking && !o.still && mod(t + (who === 'B' ? 1.1 : 0), 3.4) > 1.7 ? 1 : 0;
  const bob = walking && (step === 1 || step === 3) ? -1 : 0;
  const blink = !o.still && mod(t + (o.seed || 0) + (who === 'B' ? 1.7 : 0), 3.9) < 0.12;
  const sitDrop = o.sit ? 6 : 0;
  const ox = ri(fx) - 7, oy = ri(fy) - BODY.h + sitDrop;
  x.save();
  if (flip) { x.translate(ri(fx) * 2, 0); x.scale(-1, 1); }
  const pose = POSES[o.pose || 'down'];
  const swing = walking ? [1, 0, -1, 0][step] : 0;
  // legs
  const legs = side ? (o.sit ? 'sit' : walking ? ['sideA', 'sideB', 'sideA', 'sideB'][step] : 'sideStand') : walking && step % 2 === 0 ? 'walkF' : 'stand';
  const legFlip = !side && walking && step === 2;
  if (!o.sit || side) blit(x, `${who}_legs_${legs}`, ox, oy + BODY.legsY - (o.sit ? 2 : 0), { flip: legFlip });
  else if (dir === 'front') blit(x, `${who}_legs_sitF`, ox, oy + BODY.legsY - 1);
  // far arm behind the body (side views)
  const sh = side ? [ox + 7, oy + BODY.torsoY + 2 + bob] : null;
  if (side) { const f = pose.far; arm(x, who, sh[0] - 1, sh[1], sh[0] - 1 + f[0] - swing, sh[1] + f[1], sh[0] - 1 + f[2] - swing * 2, sh[1] + f[3]); }
  blit(x, `${who}_torso_${view}`, ox, oy + BODY.torsoY + bob);
  // scarf tail streams behind B when moving or in wind
  if (who === 'B' && (walking || o.wind) && view !== 'front') {
    const fl = Math.floor(t * 6) % 2, sx0 = side ? ox + 4 : ox + 9, sy0 = oy + BODY.torsoY + 2 + bob;
    rect(x, sx0 - 2, sy0, 3, 2, P.ink); rect(x, sx0 - 1, sy0, 2, 1, P.coral0);
    rect(x, sx0 - 4 - fl, sy0 + 1 + fl, 3, 2, P.ink); rect(x, sx0 - 3 - fl, sy0 + 1 + fl, 2, 1, P.coral1);
  }
  const face = o.face || (blink ? 'blink' : '');
  const hy = oy + bob - breathe + (o.lookDown ? 1 : 0) - (o.lookUp ? 1 : 0);
  blit(x, `${who}_head_${view}${face && dir !== 'back' ? '_' + face : ''}`, ox, hy);
  // near arm(s)
  const sy = oy + BODY.torsoY + 2 + bob;
  if (side) {
    const n = pose.near;
    arm(x, who, sh[0], sh[1], sh[0] + n[0] + swing, sh[1] + n[1], sh[0] + n[2] + swing * 2, sh[1] + n[3]);
    if (o.holding) blit(x, o.holding, sh[0] + n[2] - 1, sh[1] + n[3] - SPR.get(o.holding).h + 1);
  } else {
    const lsx = ox + 1, rsx = ox + 11;
    if (o.pose === 'phone' || o.pose === 'book' || o.pose === 'give') {
      arm(x, who, lsx, sy, lsx, sy + 4, ox + 4, sy + 5);
      arm(x, who, rsx, sy, rsx, sy + 4, ox + 8, sy + 5);
      if (o.holding) blit(x, o.holding, ox + 7 - (SPR.get(o.holding).w >> 1), sy + 6 - SPR.get(o.holding).h);
    } else if (o.pose === 'raise' || o.pose === 'shade' || o.pose === 'reach' || o.pose === 'umbrella') {
      arm(x, who, lsx, sy, lsx - 1, sy + 4, lsx - 1, sy + 8 - swing);
      const up = o.pose === 'reach' ? 3 : o.pose === 'umbrella' ? 1 : o.pose === 'shade' ? 5 : 8;
      arm(x, who, rsx, sy, rsx + 2, sy - 2, rsx + (o.pose === 'shade' ? -2 : 2), sy - up);
    } else {
      arm(x, who, lsx, sy, lsx - 1, sy + 4, lsx - 1, sy + 8 + swing);
      arm(x, who, rsx, sy, rsx + 1, sy + 4, rsx + 1, sy + 8 - swing);
    }
  }
  x.restore();
}
// Soft shadow under a standing character: two flat translucent ovals.
function charShadow(x, fx, fy, w = 8) {
  x.save(); x.globalAlpha = 0.28; ellipse(x, fx, fy, w, 1, P.ink); x.globalAlpha = 0.2; ellipse(x, fx, fy, w - 3, 1, P.ink); x.restore();
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
  sprite('bookmark', ['kk', 'cc', 'cc', 'cc', 'cc', 'kk'], K);
  sprite('photo', ['kkkkkkkk', 'kwwwwwwk', 'kwvvAvwk', 'kwvvvvwk', 'kwwwwwwk', 'kkkkkkkk'], K);
  sprite('headphones', ['..kkkk..', '.k....k.', 'k......k', 'kc....ck', 'kc....ck', '.k....k.'], K);
  sprite('ticket', ['kkkkkkkkk', 'kmmmmcmmk', 'kmnnmcmmk', 'kmmmmcmmk', 'kkkkkkkkk'], K);
  sprite('umbrella', ['....kkk....', '..kcccccc..', '.kccCccCcc.', 'kcCcccccCck', 'kkkkkkkkkkk', '.....k.....', '.....k.....', '.....k.....', '.....kk....'], K);
  sprite('umbrella_open', ['......kkkkk......', '...kkcccccccck...', '..kccCccccCccck..', '.kcCcccccccccCck.', 'kcccccccccccccccck', 'kkCkkkkCkkkkCkkkk', '........k........'], K);
  sprite('plant', ['..g.G..', '.gGgGg.', 'gGgGgGg', '.gGgGg.', '..kkk..', '.kdddk.', '.kdddk.', '..kkk..'], K);
  sprite('radio', ['kkkkkkkkkkkk', 'kxxxxxxxxxxk', 'kxkkkxxsskxk', 'kxkAkxxxxxxk', 'kxkkkxkSkSkk', 'kxxxxxxxxxxk', 'kkkkkkkkkkkk'], K);
  sprite('lamp', ['..kkkkk..', '.kAAAAAk.', 'kAyyyyyAk', 'kkkkkkkkk', '....k....', '....k....', '....k....', '..kkkkk..'], K);
  sprite('lamp_off', ['..kkkkk..', '.kssssk..', 'kssssssk.', 'kkkkkkkkk', '....k....', '....k....', '....k....', '..kkkkk..'], K);
  sprite('bag', ['..kkkk..', '.k....k.', 'kkkkkkkk', 'kbbbbbbk', 'kbBBBBbk', 'kbbbbbbk', 'kbbbbbbk', 'kkkkkkkk'], K);
  sprite('heart', ['.kk.kk.', 'kcckcck', 'kcccCck', '.kcCck.', '..kck..', '...k...'], K);
  sprite('star', ['...k...', '..kAk..', 'kkkAkkk', 'kAAyAAk', '.kAAAk.', '.kAkAk.', 'kk...kk'], K);
}
