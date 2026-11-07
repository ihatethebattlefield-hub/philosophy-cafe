'use strict';
/* Entry point: build the film from data and expose renderFrame(t) for capture. */
const OUT = document.getElementById('out');
const OX = OUT.getContext('2d');
const LOGICAL = canvas(LW, LH);
let OUT_SCALE = SCALE, NOSUBS = false;

// The whole frame is a function of t: no state carries from one frame to the next.
function renderFrame(t) {
  const s = drawFilm(LOGICAL.x, t);
  OX.imageSmoothingEnabled = false;
  OX.drawImage(LOGICAL.c, 0, 0, LW * OUT_SCALE, LH * OUT_SCALE);
  // subtitles: their own 270×480 layer at ×4 (in the 1080×1920 delivery)
  SUBC.x.clearRect(0, 0, SUB.w, SUB.h);
  if (!NOSUBS) subtitles(SUBC.x, t, SUBSTYLE[s.id] || {});
  OX.drawImage(SUBC.c, 0, 0, LW * OUT_SCALE, LH * OUT_SCALE);
}
// Sprite atlas: both people (views, walk cycle, sitting, arm poses, faces), props, hands, palette.
function drawAtlas() {
  const x = LOGICAL.x; rect(x, 0, 0, LW, LH, P.cream1);
  text(x, '精灵图集 · 阴天', 8, 6, P.ink, FONT.ui);
  const poses = ['down', 'table', 'cup', 'photo', 'reach', 'chin', 'write', 'hook', 'key', 'hold'];
  let row = 0;
  for (const who of ['W', 'M']) for (const dir of ['front', 'back', 'right', 'left']) {
    const y = 70 + row * 50;
    for (let k = 0; k < 6; k++) drawPerson(x, who, 6 + k * 18, y, { dir, walk: k / 6, still: true });
    drawPerson(x, who, 116, y, { dir, still: true }); drawPerson(x, who, 136, y, { dir, sit: true, still: true });
    poses.forEach((p, i) => { if (dir === 'front' || dir === 'back') { if (i < 6) drawPerson(x, who, 158 + i * 19, y, { dir, pose: ['down', 'table', 'cup', 'photo', 'pocket', 'hold'][i], still: true }); } else drawPerson(x, who, 158 + i * 19, y, { dir, pose: p, still: true }); });
    row++;
  }
  ['', 'blink', 'smile', 'up', 'down', 'closed', 'talk'].forEach((f, i) => { drawPerson(x, 'W', 8 + i * 20, 470, { face: f, still: true }); drawPerson(x, 'M', 158 + i * 20, 470, { face: f, still: true }); });
  text(x, '走路 6 帧 · 坐 · 手臂姿势 · 七种表情', 8, 478, P.wood1, FONT.small);
  let px = 10; for (const n of ['cup', 'cup2', 'photo', 'key', 'coat', 'menu', 'napkin', 'bowl', 'bag']) { if (SPR.get(n)) { blit(x, n, px, 500, { scale: 2 }); px += SPR.get(n).w * 2 + 8; } }
  const H = canvas(90, 60); rect(H.x, 0, 0, 90, 60, P.wood3); handTop(H.x, 18, 56, -1.2, 'flat', {}); handTop(H.x, 46, 56, -1.3, 'pinch', {}); handTop(H.x, 74, 56, -1.4, 'cup', { left: true });
  x.imageSmoothingEnabled = false; x.drawImage(H.c, 0, 0, 90, 60, 180, 494, 180, 120);
  Object.values(P).forEach((c, i) => box(x, 6 + (i % 14) * 12, 560 + Math.floor(i / 14) * 12, 11, 11, c, P.ink));
  OX.imageSmoothingEnabled = false; OX.drawImage(LOGICAL.c, 0, 0, LW * OUT_SCALE, LH * OUT_SCALE);
}
(async function init() {
  const q = new URLSearchParams(location.search);
  OUT_SCALE = parseInt(q.get('scale') || SCALE, 10); NOSUBS = q.has('nosubs'); // style frames for the repository carry no lyric text
  OUT.width = LW * OUT_SCALE; OUT.height = LH * OUT_SCALE;
  await Promise.all(['8px FP8', '10px FP10', '12px FP12', '20px FP10', '24px FP12'].map(f => document.fonts.load(f, '阴天').catch(() => null)));
  initSprites();
  buildShots();
  window.renderFrame = renderFrame;
  window.SHOTS_RESOLVED = SHOTS.map(s => ({ id: s.id, start: +s.start.toFixed(3), end: +s.end.toFixed(3) }));
  if (q.has('atlas')) { drawAtlas(); window.__ready = true; return; }
  if (q.has('play')) { const audio = new Audio(SONG.audio); audio.play().catch(() => null); const loop = () => { renderFrame(audio.currentTime); if (!audio.ended) requestAnimationFrame(loop); }; loop(); }
  else renderFrame(parseFloat(q.get('t') || '0'));
  window.__ready = true;
})();
