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

// Sprite atlas: every view, walk frame and pose of both leads, the props and the palette.
function drawAtlas() {
  const x = LOGICAL.x;
  rect(x, 0, 0, LW, LH, P.night1);
  text(x, '精灵图集 · 双人存档', 8, 6, P.cream0, FONT.big);
  const poses = ['down', 'phone', 'reach', 'give', 'press', 'raise', 'shade', 'hug', 'book'];
  let row = 0;
  for (const who of ['A', 'B']) {
    text(x, who === 'A' ? '阿屿（A）' : '小晴（B）', 352, 34 + row * 26, P.cream1, FONT.small, { align: 'right' });
    for (const dir of ['front', 'back', 'right', 'left']) {
      const y = 50 + row * 26;
      for (let k = 0; k < 4; k++) drawChar(x, who, 14 + k * 16, y, { dir, walk: k / 4, still: true });
      drawChar(x, who, 86, y, { dir, still: true });
      if (dir === 'right' || dir === 'left') drawChar(x, who, 104, y, { dir, sit: true, still: true });
      poses.forEach((p, i) => drawChar(x, who, 126 + i * 16, y, { dir, pose: p, still: true, holding: p === 'phone' ? 'phone' : null }));
      row++;
    }
    row += 0.6;
  }
  text(x, '走路 4 帧 · 站立 · 坐 · 姿势：' + poses.join(' / '), 8, 268, P.stone4, FONT.small);
  let px = 8;
  for (const n of ['mug', 'phone', 'envelope', 'book', 'bookmark', 'photo', 'headphones', 'ticket', 'umbrella', 'plant', 'radio', 'lamp']) { blit(x, n, px, 290, { scale: 2 }); px += SPR.get(n).w * 2 + 6; }
  hand(x, 'A', 60, 380, 'press', 1, 3); hand(x, 'B', 300, 380, 'open', -1, 3);
  const pal = Object.values(P);
  pal.forEach((c, i) => box(x, 8 + (i % 18) * 19, 430 + Math.floor(i / 18) * 19, 17, 17, c, P.ink));
  panel(x, 8, 520, 344, 40); text(x, '收到 · 珊瑚色书签', 20, 534, P.brown0);
  OX.imageSmoothingEnabled = false;
  OX.drawImage(LOGICAL.c, 0, 0, LW * OUT_SCALE, LH * OUT_SCALE);
}

(async function init() {
  const q = new URLSearchParams(location.search);
  OUT_SCALE = parseInt(q.get('scale') || SCALE, 10);
  OUT.width = LW * OUT_SCALE; OUT.height = LH * OUT_SCALE;
  await Promise.all(['12px "WenQuanYi Zen Hei Sharp"', '10px "WenQuanYi Zen Hei Sharp"', '16px Unifont'].map(f => document.fonts.load(f, '存档').catch(() => null)));
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
