'use strict';
/* Entry point: build the film from data and expose renderFrame(t) for capture. */
const OUT = document.getElementById('out');
const OX = OUT.getContext('2d');
const LOGICAL = canvas(LW, LH);
let OUT_SCALE = SCALE;

// The whole frame is a function of t: no state carries from one frame to the next.
function renderFrame(t) {
  const s = drawFilm(LOGICAL.x, t);
  OX.imageSmoothingEnabled = false;
  OX.drawImage(LOGICAL.c, 0, 0, LW * OUT_SCALE, LH * OUT_SCALE);
  // subtitles: their own 270×480 layer at ×4 (in the 1080×1920 delivery)
  SUBC.x.clearRect(0, 0, SUB.w, SUB.h);
  subtitles(SUBC.x, t, SUBSTYLE[s.id] || {});
  OX.drawImage(SUBC.c, 0, 0, LW * OUT_SCALE, LH * OUT_SCALE);
}
// Sprite atlas: both leads (all views, walk cycle, sitting, arm poses, faces), the passers-by, props.
function drawAtlas() {
  const x = LOGICAL.x; rect(x, 0, 0, LW, LH, P.cream2);
  text(x, '精灵图集 · LOVE SONG', 8, 6, P.ink, FONT.ui);
  const poses = ['down', 'table', 'write', 'reach', 'give', 'hold', 'book', 'cuff', 'raise', 'point'];
  let row = 0;
  for (const who of ['A', 'B']) for (const dir of ['front', 'back', 'right', 'left']) {
    const y = 60 + row * 40;
    for (let k = 0; k < 6; k++) drawChar(x, who, 12 + k * 18, y, { dir, walk: k / 6, still: true });
    drawChar(x, who, 124, y, { dir, still: true }); drawChar(x, who, 144, y, { dir, sit: true, still: true });
    poses.forEach((p, i) => drawChar(x, who, 166 + i * 19, y, { dir, pose: p, still: true }));
    row++;
  }
  ['', 'blink', 'smile', 'up', 'down', 'shy', 'talk'].forEach((f, i) => { drawChar(x, 'A', 14 + i * 20, 400, { face: f, still: true }); drawChar(x, 'B', 164 + i * 20, 400, { face: f, still: true }); });
  drawChar(x, 'C', 320, 400, { still: true }); drawChar(x, 'D', 344, 400, { dir: 'back', still: true });
  text(x, '走路 6 帧 · 坐 · 手臂姿势 · 七种表情 · 两个路人', 8, 410, P.ink2, FONT.small);
  let px = 10; for (const n of ['pencil', 'paper', 'sketchbook', 'cup', 'cupL', 'tote', 'sock', 'note']) { blit(x, n, px, 432, { scale: 2 }); px += SPR.get(n).w * 2 + 8; }
  birdDoodle(x, 300, 440, P.ink1, 2);
  bigHand(x, 'A', 90, 540, { k: 3, lift: [1, 0, 0, 0] }); bigHand(x, 'B', 270, 540, { k: 3, facing: -1, kind: 'pinch' });
  Object.values(P).forEach((c, i) => box(x, 6 + (i % 29) * 12, 600 + Math.floor(i / 29) * 12, 11, 11, c, P.ink));
  OX.imageSmoothingEnabled = false; OX.drawImage(LOGICAL.c, 0, 0, LW * OUT_SCALE, LH * OUT_SCALE);
}
(async function init() {
  const q = new URLSearchParams(location.search);
  OUT_SCALE = parseInt(q.get('scale') || SCALE, 10);
  OUT.width = LW * OUT_SCALE; OUT.height = LH * OUT_SCALE;
  await Promise.all(['8px FP8', '10px FP10', '12px FP12', '20px FP10', '24px FP12'].map(f => document.fonts.load(f, '情歌').catch(() => null)));
  initSprites();
  buildShots();
  window.renderFrame = renderFrame;
  window.SHOTS_RESOLVED = SHOTS.map(s => ({ id: s.id, start: +s.start.toFixed(3), end: +s.end.toFixed(3) }));
  if (q.has('atlas')) { drawAtlas(); window.__ready = true; return; }
  if (q.has('play')) { const audio = new Audio(SONG.audio); audio.play().catch(() => null); const loop = () => { renderFrame(audio.currentTime); if (!audio.ended) requestAnimationFrame(loop); }; loop(); }
  else renderFrame(parseFloat(q.get('t') || '0'));
  window.__ready = true;
})();
