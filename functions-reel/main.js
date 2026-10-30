'use strict';
/* Composer: which scene draws a given t, the four transitions that need two
 * rendered images, time-supersampled motion blur, and the entry points. */
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
const bufA = buf(), bufB = buf(), bufR = buf(), bufM = buf(), bufAcc = buf();

// ------------------------------------------- 09.75–10.25  diagonal fold
// The upper-left half of the transform scene turns over the line y = x like a
// page; its back carries the inverse scene. Crease = the mirror line that follows.
function tFold(x, t, A, B) {
  const [f0, f1] = TL.fold, phi = Math.PI * E.inOutCubic(inv(f0, f1, t));
  const O = [CAMI.ox, CAMI.oy], s = Math.SQRT1_2, d = [s, -s], n = [-s, -s], th = -Math.PI / 4;
  const half = (sign) => { // half-plane polygon on the n side (sign = 1) or the opposite side
    const p = new Path2D(), L = 3000;
    p.moveTo(O[0] + d[0] * L, O[1] + d[1] * L); p.lineTo(O[0] - d[0] * L, O[1] - d[1] * L);
    p.lineTo(O[0] - d[0] * L + sign * n[0] * L, O[1] - d[1] * L + sign * n[1] * L); p.lineTo(O[0] + d[0] * L + sign * n[0] * L, O[1] + d[1] * L + sign * n[1] * L);
    p.closePath(); return p;
  };
  const a = A(), b = B();
  bg(x, '#07080b');
  x.save(); x.clip(half(1)); x.drawImage(b, 0, 0); x.restore();
  x.save(); x.clip(half(-1)); x.drawImage(a, 0, 0); x.restore();
  const k = Math.cos(phi), front = phi < Math.PI / 2;
  x.save();
  x.translate(O[0], O[1]); x.rotate(th); x.scale(1, front ? k : -k); x.rotate(-th); x.translate(-O[0], -O[1]);
  const flap = half(front ? 1 : -1);
  x.clip(flap);
  x.drawImage(front ? a : b, 0, 0);
  x.fillStyle = `rgba(0,0,0,${0.55 * Math.sin(phi)})`; x.fill(flap);
  x.restore();
  line(x, O[0] - d[0] * 1400, O[1] - d[1] * 1400, O[0] + d[0] * 1400, O[1] + d[1] * 1400, C.yellow, 2.5, { glow: 1.2 * Math.sin(phi) + 0.3 });
}

const SCENES = [
  { r0: 0, r1: 6, draw: sWorld },
  { r0: 6, r1: 10, draw: sTransform },
  { r0: 10, r1: 14, draw: sInverse },
  { r0: 14, r1: 18, draw: sRecip },
  { r0: 18, r1: 24, draw: sDeriv },
  { r0: 24, r1: 29.75, draw: sIntegral },
  { r0: 29.75, r1: 34, draw: sFTC },
  { r0: 34, r1: 40, draw: sComp },
  { r0: 40, r1: 44.4, draw: sTrig },
  { r0: 44.4, r1: 47.6, draw: sPolar },
  { r0: 47.6, r1: 52, draw: sHeart },
  { r0: 52, r1: 55.75, draw: sMorph },
  { r0: 55.75, r1: 57.5, draw: sRecap },
  { r0: 57.5, r1: 58, draw: sSilence },
  { r0: 58, r1: 61, draw: sLogo },
];
// Transitions that composite two scenes: [a, b) window, A = outgoing, B = incoming.
const CUTS = [
  { a: TL.fold[0], b: TL.fold[1], f: tFold, A: sTransform, B: sInverse },
  { a: TL.sweep[0], b: TL.sweep[1], f: tSweep, A: sDeriv, B: sIntegral },
  { a: TL.modules[0], b: TL.modules[1], f: tModules, A: sFTC, B: sComp },
  { a: TL.orbit[0], b: TL.orbit[1], f: tOrbit, A: sComp, B: sTrig },
];
function drawScene(x, fn, t) {
  x.save();
  x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.filter = 'none';
  fn(x, t);
  x.restore();
}
// The picture at time t without HUD, grain or motion blur.
function content(x, t) {
  const cut = CUTS.find(c => t >= c.a && t < c.b);
  if (cut) {
    const A = () => { drawScene(bufA.x, cut.A, t); return bufA.c; };
    const B = () => { drawScene(bufB.x, cut.B, t); return bufB.c; };
    x.save(); x.setTransform(1, 0, 0, 1, 0, 0); cut.f(x, t, A, B); x.restore();
    return;
  }
  const s = SCENES.find(sc => t >= sc.r0 && t < sc.r1) || SCENES[SCENES.length - 1];
  drawScene(x, s.draw, t);
}
// Motion blur: frames with fast motion are averaged over a 180° shutter
// (half a frame) from K sub-samples. Static elements — formulas, labels —
// are identical in every sub-sample, so they stay perfectly sharp.
const MB = [[0.25, 1.05, 5], [1.6, 1.75, 6], [1.75, 2.25, 10], [2.25, 2.45, 6], [17.7, 17.85, 6], [17.85, 18.15, 12], [18.15, 18.35, 6], [23.85, 24.25, 10], [39.6, 40.4, 4], [43.6, 44.1, 6],
  [44.5, 46.0, 3], [47.0, 48.0, 5], [48.0, 49.5, 4], [57.75, 58.05, 5], [58.05, 58.6, 3]];
function mbSamples(t) { const w = MB.find(([a, b]) => t >= a && t < b); return w ? w[2] : 1; }
function renderFrame(t) {
  const K = mbSamples(t);
  if (K === 1) content(ctx, t);
  else {
    // running mean: sample i blends in at 1/(i+1). Unlike summing K images at
    // alpha 1/K, this doesn't truncate each 8-bit channel K times (no colour cast).
    const shutter = 0.5 / FPS, ax = bufAcc.x;
    ax.globalCompositeOperation = 'source-over';
    for (let i = 0; i < K; i++) {
      content(bufM.x, t + (i / (K - 1) - 0.5) * shutter);
      ax.globalAlpha = 1 / (i + 1);
      ax.drawImage(bufM.c, 0, 0);
    }
    ax.globalAlpha = 1;
    ctx.drawImage(bufAcc.c, 0, 0);
  }
  drawHUD(ctx, t);
  drawGrain(ctx, t);
}

async function init() {
  const fonts = [font(800, 100), font(600, 22), font(400, 15, MONO), `italic 40px ${SERIF}`, `40px ${SERIF}`, `400 20px ${CJK}`];
  await Promise.all(fonts.map(f => document.fonts.load(f).catch(() => null)));
  initGrain(); initRegion(); initPolar(); initHeart(); initShapes(); initLattice();
  window.__ready = true;
  if (location.search.includes('play')) {
    document.body.classList.add('preview');
    const audio = new Audio('out/score.wav');
    const t0 = performance.now();
    audio.play().catch(() => null);
    const loop = () => {
      const t = audio.currentTime > 0 ? audio.currentTime : (performance.now() - t0) / 1000;
      renderFrame(Math.min(DURATION - 1 / FPS, t));
      if (t < DURATION) requestAnimationFrame(loop);
    };
    loop();
  } else {
    const m = location.search.match(/t=([\d.]+)/);
    renderFrame(m ? parseFloat(m[1]) : 0);
  }
}
window.renderFrame = renderFrame;
init();
