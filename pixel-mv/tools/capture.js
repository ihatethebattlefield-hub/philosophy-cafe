// Renders frames with headless Chromium: frame f is t = f / 30 of the song.
//   node tools/capture.js --out out/frames [--scale 4] [--workers 4] [--from 0 --to N | --frames 10,20]
// Frames are independent (every frame is a function of t), so workers split them freely.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };
global.window = {};
require(path.join(__dirname, '..', 'data', 'song.js'));
const FPS = 30, TOTAL = Math.round(window.SONG.duration * FPS);
const outDir = path.resolve(opt('out', path.join(__dirname, '..', 'out', 'frames')));
const scale = opt('scale', '4'), workers = parseInt(opt('workers', '4'), 10);
const frames = opt('frames') ? opt('frames').split(',').map(Number)
  : Array.from({ length: (+opt('to', TOTAL)) - (+opt('from', 0)) }, (_, i) => i + (+opt('from', 0)));

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  const url = 'file://' + path.join(__dirname, '..', 'index.html') + `?scale=${scale}`;
  let done = 0;
  const t0 = Date.now();
  await Promise.all(Array.from({ length: Math.min(workers, frames.length) }, async (_, w) => {
    const page = await browser.newPage({ viewport: { width: 270 * scale, height: 480 * scale } });
    page.on('pageerror', e => { console.error('page error:', e.message); process.exitCode = 1; });
    await page.goto(url);
    await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
    for (let k = w; k < frames.length; k += workers) {
      const f = frames[k];
      const b64 = await page.evaluate(t => { window.renderFrame(t); return document.getElementById('out').toDataURL('image/png').split(',')[1]; }, f / FPS);
      fs.writeFileSync(path.join(outDir, String(f).padStart(5, '0') + '.png'), Buffer.from(b64, 'base64'));
      if (++done % 150 === 0) process.stdout.write(`\r${done}/${frames.length}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    }
    await page.close();
  }));
  process.stdout.write(`\r${done}/${frames.length}  ${((Date.now() - t0) / 1000).toFixed(0)}s\n`);
  await browser.close();
})();
