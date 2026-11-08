// Renders one page state to PNG: node tools/shot.js "<query>" out.png [w h]
// e.g. node tools/shot.js "sheet" sheet.png 1080 1920
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const [q, out, w = '1080', h = '1920'] = process.argv.slice(2);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
  p.on('pageerror', e => { console.error('page error:', e.message); process.exitCode = 1; });
  p.on('console', m => { if (m.type() === 'error') console.error('console:', m.text()); });
  await p.goto('file://' + path.join(__dirname, '..', 'index.html') + '?' + q);
  await p.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
  const b64 = await p.evaluate(() => document.getElementById('out').toDataURL('image/png').split(',')[1]);
  require('fs').writeFileSync(out, Buffer.from(b64, 'base64'));
  await b.close();
})();
