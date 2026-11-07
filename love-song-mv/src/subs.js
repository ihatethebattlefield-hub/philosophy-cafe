'use strict';
/*
 * Subtitles: one clear line of pixel text in the bottom safe area, from
 * data/lyrics.js only (aligned to the recording by tools/align.py). Cream text
 * with an ink outline over a soft dark band (or ink on cream over bright shots).
 * Characters already sung are full strength; the rest of the line waits a shade
 * dimmer. Lines appear with a one-pixel lift and leave on the cut — no fades on
 * pixel text. Long lines break at a space, never mid-word.
 */
// Drawn on their own 270×480 layer, scaled ×4 onto the 1080×1920 frame: 48-px glyphs,
// whole pixels, independent of the picture's ×3 grid.
const SUB = { w: 270, h: 480, y: 440, maxW: 240 };
const SUBC = canvas(270, 480);
function lyricAt(t) {
  const L = (window.LYRICS && LYRICS.lines) || [];
  return L.find(l => t >= l.start - 0.1 && t < l.end + 0.2) || null;
}
function outlinedText(x, s, px, py, cols, outline, f = FONT.ui) {
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]]) text(x, s, px + dx, py + dy, outline, f, { spacing: 1 });
  return text(x, s, px, py, null, f, { colors: cols, spacing: 1 });
}
function subtitles(x, t, o = {}) {
  if (o.hide) return;
  const ln = lyricAt(t); if (!ln) return;
  const f = FONT.ui, dark = o.style === 'dark';
  const chars = [...ln.text];
  // per-character timing: words[] holds one entry per non-space character
  let wi = 0; const times = chars.map(c => (c.trim() ? (ln.words && ln.words[wi++] ? ln.words[wi - 1].t : null) : null));
  const sung = dark ? P.ink : P.cream0, wait = dark ? P.ink3 : P.cream3, outline = dark ? P.cream0 : P.ink;
  const cols = chars.map((c, i) => (times[i] === null ? sung : t >= times[i] ? sung : wait));
  // semantic wrap: only if wider than the safe area, break at the space nearest the middle
  let rows = [[0, chars.length]];
  if (textWidth(ln.text, f, 1) > SUB.maxW) {
    let best = -1, bd = 1e9; chars.forEach((c, i) => { if (c === ' ' && Math.abs(i - chars.length / 2) < bd) { bd = Math.abs(i - chars.length / 2); best = i; } });
    if (best < 0) best = Math.floor(chars.length / 2);
    rows = [[0, best], [best + (chars[best] === ' ' ? 1 : 0), chars.length]];
  }
  const y0 = (o.y ?? SUB.y) - (rows.length - 1) * 8, lift = t - ln.start < 0.07 ? 1 : 0;
  rows.forEach(([a, b], r) => {
    const s = chars.slice(a, b).join(''), w = textWidth(s, f, 1), px = ri(SUB.w / 2 - w / 2), py = y0 + r * 16 + lift;
    if (!dark && o.band !== false) { x.save(); x.globalAlpha = 0.38; rect(x, px - 10, py - 3, w + 20, 18, P.void); x.globalAlpha = 0.2; rect(x, px - 14, py - 1, w + 28, 14, P.void); x.restore(); }
    outlinedText(x, s, px, py, cols.slice(a, b), outline, f);
  });
}
