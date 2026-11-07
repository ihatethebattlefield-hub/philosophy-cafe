'use strict';
/*
 * Subtitles: a narrow off-white strip with a thin brown border, low in the frame,
 * on its own 270×480 layer scaled ×4 onto the 1080×1920 frame (48-px glyphs, whole
 * pixels). Text comes only from data/lyrics.js. Characters already sung turn dark
 * red at their aligned times; the rest wait in brown. One line; a long line breaks
 * at a space into two.
 */
const SUB = { w: 270, h: 480, y: 438, maxW: 226 };
const SUBC = canvas(270, 480);
function lyricAt(t) { const L = (window.LYRICS && LYRICS.lines) || []; return L.find(l => t >= l.start - 0.12 && t < l.end + 0.25) || null; }
function subtitles(x, t, o = {}) {
  if (o.hide) return;
  const ln = lyricAt(t); if (!ln) return;
  const f = FONT.ui, chars = [...ln.text];
  let wi = 0; const times = chars.map(c => (c.trim() ? (ln.words && ln.words[wi++] ? ln.words[wi - 1].t : null) : null));
  const cols = chars.map((c, i) => (times[i] === null ? P.red1 : t >= times[i] ? P.red1 : P.wood1));
  let rows = [[0, chars.length]];
  if (textWidth(ln.text, f, 1) > SUB.maxW) { let best = -1, bd = 1e9; chars.forEach((c, i) => { if (c === ' ' && Math.abs(i - chars.length / 2) < bd) { bd = Math.abs(i - chars.length / 2); best = i; } }); if (best < 0) best = Math.floor(chars.length / 2); rows = [[0, best], [best + 1, chars.length]]; }
  const w = Math.max(...rows.map(([a, b]) => textWidth(chars.slice(a, b).join(''), f, 1))) + 22, h = rows.length * 15 + 6;
  const px = ri(SUB.w / 2 - w / 2), py = (o.y ?? SUB.y) - (rows.length - 1) * 15;
  rect(x, px - 1, py - 1, w + 2, h + 2, P.wood1); rect(x, px, py, w, h, P.cream0); hline(x, px + 1, px + w - 2, py + h - 2, P.cream2); hline(x, px + 1, px + w - 2, py + 1, P.white);
  rows.forEach(([a, b], r) => { const s = chars.slice(a, b).join(''), tw = textWidth(s, f, 1); text(x, s, ri(SUB.w / 2 - tw / 2), py + 4 + r * 15, null, f, { colors: cols.slice(a, b), spacing: 1 }); });
}
