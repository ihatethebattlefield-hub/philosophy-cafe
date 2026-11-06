'use strict';
/* Entry point: build the film from data, expose renderFrame(t) for capture. */
const OUT = document.getElementById('out');
const OX = OUT.getContext('2d');
const LOGICAL = canvas(LW, LH);
let OUT_SCALE = SCALE;

// The whole frame is a function of t: no state carries from one frame to the next.
function renderFrame(t) {
  const x = LOGICAL.x;
  x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
  drawFilm(x, t);
  OX.imageSmoothingEnabled = false;
  OX.drawImage(LOGICAL.c, 0, 0, LW * OUT_SCALE, LH * OUT_SCALE);
}

// Sprite atlas: every view, walk frame and pose of both leads, faces, props, palette.
function drawAtlas() {
  const x = LOGICAL.x;
  rect(x, 0, 0, LW, LH, P.night1);
  text(x, '精灵图集 · 双人存档', 8, 6, P.cream0, FONT.ui);
  const poses = ['phone', 'reach', 'give', 'raise', 'hug', 'umbrella'];
  let row = 0;
  for (const who of ['A', 'B']) {
    for (const dir of ['front', 'back', 'right', 'left']) {
      const y = 54 + row * 34;
      for (let k = 0; k < 4; k++) drawChar(x, who, 12 + k * 16, y, { dir, walk: k / 4, still: true });
      drawChar(x, who, 84, y, { dir, still: true });
      drawChar(x, who, 102, y, { dir, sit: true, still: true });
      poses.forEach((p, i) => drawChar(x, who, 124 + i * 19, y, { dir, pose: p, still: true, holding: p === 'phone' ? 'phone' : null }));
      row++;
    }
  }
  ['', 'blink', 'smile', 'down'].forEach((f, i) => { drawChar(x, 'A', 16 + i * 17, 346, { face: f, still: true }); drawChar(x, 'B', 100 + i * 17, 346, { face: f, still: true }); });
  text(x, '走路 4 帧 · 站 · 坐 · 姿势 · 表情', 8, 352, P.stone4, FONT.small);
  let px = 8;
  for (const n of ['mug', 'phone', 'envelope', 'book', 'bookmark', 'photo', 'headphones', 'ticket', 'umbrella', 'bag', 'heart', 'star']) { blit(x, n, px, 366, { scale: 2 }); px += SPR.get(n).w * 2 + 3; }
  hand(x, 'A', 60, 410, 'press', 1, 2); hand(x, 'B', 210, 410, 'open', -1, 2);
  Object.values(P).forEach((c, i) => box(x, 6 + (i % 24) * 11, 440 + Math.floor(i / 24) * 11, 10, 10, c, P.ink));
  OX.imageSmoothingEnabled = false;
  OX.drawImage(LOGICAL.c, 0, 0, LW * OUT_SCALE, LH * OUT_SCALE);
}

(async function init() {
  const q = new URLSearchParams(location.search);
  OUT_SCALE = parseInt(q.get('scale') || SCALE, 10);
  OUT.width = LW * OUT_SCALE; OUT.height = LH * OUT_SCALE;
  await Promise.all(['8px FP8', '10px FP10', '12px FP12', '20px FP10', '24px FP12'].map(f => document.fonts.load(f, '存档').catch(() => null)));
  initSprites();
  buildShots();
  window.renderFrame = renderFrame;
  window.SHOTS_RESOLVED = SHOTS.map(s => ({ id: s.id, start: +s.start.toFixed(3), end: +s.end.toFixed(3) }));
  if (q.has('atlas')) { drawAtlas(); window.__ready = true; return; }
  if (q.has('play')) { // live preview with the song (not used for rendering)
    const audio = new Audio(SONG.audio); audio.play().catch(() => null);
    const loop = () => { renderFrame(audio.currentTime); if (!audio.ended) requestAnimationFrame(loop); };
    loop();
  } else renderFrame(parseFloat(q.get('t') || '0'));
  window.__ready = true;
})();
