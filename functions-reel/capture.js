// Renders reel frames with headless Chromium.
//   node capture.js                      all 900 frames → out/frames/00000.png …
//   node capture.js --frames 15,60,61    only these frame numbers
//   node capture.js --workers 4 --out dir
// Because every frame is a pure function of t, frames are split round-robin
// across independent pages and can be rendered in any order.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const FPS = 30, DURATION = 60, TOTAL = FPS * DURATION;
const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : def; };
const outDir = path.resolve(opt('out', path.join(__dirname, 'out', 'frames')));
const workers = parseInt(opt('workers', '4'), 10);
const frames = opt('frames', null)
  ? opt('frames').split(',').map(Number)
  : Array.from({ length: TOTAL }, (_, i) => i);

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ args: ['--disable-web-security'] });
  const url = 'file://' + path.join(__dirname, 'index.html');
  let done = 0;
  const started = Date.now();
  const work = async (w) => {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
    page.on('pageerror', e => { console.error('page error:', e.message); process.exitCode = 1; });
    await page.goto(url);
    await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
    for (let k = w; k < frames.length; k += workers) {
      const f = frames[k];
      const b64 = await page.evaluate((t) => {
        window.renderFrame(t);
        return document.getElementById('c').toDataURL('image/png').split(',')[1];
      }, f / FPS);
      fs.writeFileSync(path.join(outDir, String(f).padStart(5, '0') + '.png'), Buffer.from(b64, 'base64'));
      done++;
      if (done % 30 === 0 || done === frames.length) {
        const s = (Date.now() - started) / 1000;
        process.stdout.write(`\r${done}/${frames.length} frames  ${s.toFixed(0)}s  (${(done / s).toFixed(1)} fps)`);
      }
    }
    await page.close();
  };
  await Promise.all(Array.from({ length: Math.min(workers, frames.length) }, (_, w) => work(w)));
  process.stdout.write('\n');
  await browser.close();
})();
