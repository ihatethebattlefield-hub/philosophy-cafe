'use strict';
/*
 * The few screens she operates. Plain pixel UI with no app branding: every control is one she
 * actually uses in the story (a shutter, a thumbnail, a slider, an input box, record/cancel/send).
 */
const OFF = {}; function offscreen(name) { if (!OFF[name]) OFF[name] = canvas(LW, SH); const c = OFF[name]; c.x.setTransform(1, 0, 0, 1, 0, 0); c.x.globalAlpha = 1; rect(c.x, 0, 0, LW, SH, P.void); return c; }
function icon(x, kind, cx, cy, col) {
  cx = ri(cx); cy = ri(cy);
  if (kind === 'flash') { line(x, cx + 2, cy - 5, cx - 2, cy, col); line(x, cx - 2, cy, cx + 2, cy, col); line(x, cx + 2, cy, cx - 2, cy + 5, col); }
  else if (kind === 'timer') { for (let a = 0; a < TAU; a += 0.4) pset(x, cx + ri(Math.cos(a) * 5), cy + ri(Math.sin(a) * 5), col); line(x, cx, cy, cx, cy - 3, col); line(x, cx, cy, cx + 2, cy, col); }
  else if (kind === 'flip') { for (let a = 0.3; a < 2.8; a += 0.3) pset(x, cx + ri(Math.cos(a) * 7), cy + ri(Math.sin(a) * 5), col); for (let a = 3.4; a < 6.0; a += 0.3) pset(x, cx + ri(Math.cos(a) * 7), cy + ri(Math.sin(a) * 5), col); pset(x, cx - 7, cy - 1, col); pset(x, cx + 7, cy + 1, col); }
}
// The camera's frame: live selfie view at the bus stop; the old photo can float in, line up,
// and be compared with a slider; the shutter can fire.
// st: { live: { smile }, photo: { k: 0..1 appear, align: 0..1, split: 0..1 (share of the photo showing the past) },
//       finger: { x, y } | null, flash: 0..1, thumb: 'old' | 'new' }
function viewfinder(x, st, t) {
  const live = offscreen('live');
  benchClose(live.x, { people: [{ who: 'her', x: 112, b: 1.3, view: 'front', outfit: 'coat', cuffs: ['folded', 'folded'], head: { turn: 0.2 }, mouth: st.live && st.live.smile ? 'smile' : '', eyes: st.live && st.live.smile ? 'smile' : '', armR: { to: [56, -40], kind: 'hold' }, armL: { to: [-30, 20] } }] }, t);
  x.drawImage(live.c, 0, 0);
  const ph = st.photo;
  if (ph && ph.k > 0) {
    const past = offscreen('past');
    benchClose(past.x, { memory: true, people: [{ who: 'her', x: 112, b: 1.3, view: 'front', outfit: 'coat', cuffs: ['long', 'folded'], head: { turn: 0.3, tilt: 0.06 }, mouth: 'grin', eyes: 'smile', armR: { to: [40, 10] }, armL: { to: [-30, 20] } }, { who: 'him', x: 252, b: 1.3, view: 'front', head: { turn: -0.3, tilt: -0.05 }, mouth: 'smile', armL: { to: [-40, 8] }, armR: { to: [30, 20] } }] }, t);
    // the photo's rectangle: floats in a little rotated-looking (offset), then lines up with the scene
    const T = { x: 40, y: 150, w: 290, h: 330 }, a = E.inOut(ph.align || 0), off = (1 - a) * 26;
    const R = { x: ri(T.x + off), y: ri(T.y - off * 0.6), w: T.w, h: T.h };
    const split = ph.split ?? 1, sx = R.x + ri(R.w * (1 - split));
    x.save(); x.globalAlpha = Math.min(1, ph.k * (0.55 + 0.45 * a));
    clip(x, { x: sx, y: R.y, w: R.x + R.w - sx, h: R.h }, () => x.drawImage(past.c, R.x - T.x - off * 0, R.y - T.y, LW, SH, 0, 0, LW, SH));
    x.restore();
    // its white border, and the slider's line where present meets past
    rect(x, R.x - 3, R.y - 3, R.w + 6, 3, P.cr0); rect(x, R.x - 3, R.y + R.h, R.w + 6, 3, P.cr0); rect(x, R.x - 3, R.y, 3, R.h, P.cr0); rect(x, R.x + R.w, R.y, 3, R.h, P.cr0);
    if (split < 0.99 && split > 0.01) { rect(x, sx - 1, R.y, 2, R.h, P.cr0); disc(x, sx, R.y + R.h / 2, 7, P.ink); disc(x, sx, R.y + R.h / 2, 6, P.cr0); pset(x, sx - 3, R.y + R.h / 2, P.ink); pset(x, sx + 3, R.y + R.h / 2, P.ink); }
    if (a > 0.95) text(x, '那一年', R.x + 8, R.y + 6, P.cr0, FONT.small, { shadow: P.ink });
  }
  // camera chrome: thirds, corner marks, top bar, bottom bar with thumbnail, shutter, flip
  x.save(); x.globalAlpha = 0.28; for (const k of [1, 2]) { vline(x, ri(LW * k / 3), 40, 478, P.cr0); hline(x, 0, LW - 1, ri(40 + 438 * k / 3), P.cr0); } x.restore();
  for (const [cx, cy, dx, dy] of [[12, 48, 1, 1], [348, 48, -1, 1], [12, 470, 1, -1], [348, 470, -1, -1]]) { hline(x, cx, cx + dx * 14, cy, P.cr0); vline(x, cx, cy, cy + dy * 14, P.cr0); }
  x.save(); x.globalAlpha = 0.55; rect(x, 0, 0, LW, 36, P.ink); rect(x, 0, 484, LW, SH - 484, P.ink); x.restore();
  icon(x, 'flash', 30, 18, P.cr0); icon(x, 'timer', 70, 18, P.cr0); text(x, '1x', 330, 12, P.cr0, FONT.small, { align: 'center' });
  text(x, '拍照', 180, 490, P.lt1, FONT.small, { align: 'center' });
  disc(x, 180, 532, 22, P.cr0); disc(x, 180, 532, 19, P.ink); disc(x, 180, 532, 17, st.press ? P.cr2 : P.cr0);
  rect(x, 42, 514, 36, 36, P.cr0); if (st.thumb === 'new') { const th = offscreen('thumb'); x.drawImage(live.c, 40, 150, 290, 330, 44, 516, 32, 32); } else photoPair(x, 44, 516, 32, 32, 'past', t);
  icon(x, 'flip', 312, 532, P.cr0);
  if (st.finger) bustHand(x, [st.finger.x, st.finger.y], -Math.PI / 2 - 0.15, 2.6, 'point', {});
  if (st.flash) shade(x, 0, 0, LW, SH, P.white, st.flash);
}
// The call on her phone, close (her view of the screen): him at his desk talking, her small in the corner.
function callScreen(x, st, t) {
  rect(x, 0, 0, LW, SH, mixHex(P.wd3, P.nt0, 0.5)); glow(x, 180, 280, 220, 260, P.gb0, 0.2);
  const R = { x: 60, y: 34, w: 240, h: 470 };
  shape(x, [[R.x - 10, R.y - 10], [R.x + R.w + 10, R.y - 10], [R.x + R.w + 10, R.y + R.h + 10], [R.x - 10, R.y + R.h + 10]], P.gb4, { shade: P.gb5, shadeDir: [1, 1], shadeW: 3, hi: P.gb2, hiDir: [-1, -1] });
  clip(x, R, () => { // his side: a desk lamp, a window at night, shelves; him talking
    rect(x, R.x, R.y, R.w, R.h, P.cr2); rect(x, R.x, R.y, R.w, 200, P.gb2); rect(x, R.x + 20, R.y + 30, 90, 120, P.nt1); for (let k = 0; k < 6; k++) rect(x, R.x + 28 + (k % 3) * 28, R.y + 40 + Math.floor(k / 3) * 50, 14, 20, hash(k) < 0.5 ? P.lt1 : P.nt2); vline(x, R.x + 65, R.y + 30, R.y + 150, P.cr0);
    rect(x, R.x + 140, R.y + 60, 90, 4, P.wd2); for (let k = 0; k < 7; k++) rect(x, R.x + 144 + k * 12, R.y + 40, 8, 20, [P.co1, P.sg2, P.gb1, P.lt2][k % 4]);
    glow(x, R.x + 200, R.y + 230, 90, 70, P.lt1, 0.35);
    drawBust(x, 'him', R.x + R.w / 2, R.y + R.h + 10, { b: 1.5, view: 'front', t, mouth: st.talk ? 'talk' : st.smile ? 'smile' : '', eyes: st.smile ? 'smile' : '', head: { tilt: st.smile ? -0.05 : 0 }, armL: { to: [-30, 20] }, armR: { to: [40, 20] } });
    // her in the corner (front camera)
    const pr = { x: R.x + R.w - 74, y: R.y + 12, w: 62, h: 92 }; rect(x, pr.x - 2, pr.y - 2, pr.w + 4, pr.h + 4, P.cr0);
    clip(x, pr, () => { rect(x, pr.x, pr.y, pr.w, pr.h, P.wd3); glow(x, pr.x + 30, pr.y + 20, 40, 30, P.lt1, 0.4); drawBust(x, 'her', pr.x + pr.w / 2, pr.y + pr.h + 6, { b: 0.5, view: 'front', t, mouth: st.herLaugh ? 'grin' : '', eyes: st.herLaugh ? 'smile' : '' }); });
    text(x, st.time || '23:41', R.x + 10, R.y + 8, P.cr0, FONT.small, { shadow: P.ink });
  });
  // call controls: mute, end, camera — plain icons
  for (const [cx, c] of [[R.x + 50, P.gb3], [R.x + R.w / 2, P.co2], [R.x + R.w - 50, P.gb3]]) { disc(x, cx, R.y + R.h - 34, 16, P.ink); disc(x, cx, R.y + R.h - 34, 15, c); }
  line(x, R.x + R.w / 2 - 6, R.y + R.h - 34, R.x + R.w / 2 + 6, R.y + R.h - 34, P.cr0); line(x, R.x + R.w / 2 - 6, R.y + R.h - 33, R.x + R.w / 2 + 6, R.y + R.h - 33, P.cr0);
}
