// Writes the shot table: every shot with its resolved start/end in the song, the lyric
// lines it covers, the period, place, shot size, action, objects and transition.
//   node tools/board.js            → docs/04-storyboard.md (lyric IDs and times only; safe to commit)
//   node tools/board.js --lyrics   → out/04-storyboard-with-lyrics.md (quotes the lyric text; stays local)
const fs = require('fs');
const path = require('path');
global.window = {};
for (const f of ['song.js', 'phrases.js', 'lyrics.js', 'storyboard.js']) require(path.join(__dirname, '..', 'data', f));
const { SONG, LYRICS, BOARD, PHRASES } = window;
const WITH_TEXT = process.argv.includes('--lyrics');
const L = LYRICS.lines, byId = id => L.find(l => l.id === id);
const shots = BOARD.shots.map(s => { const a = s.at; return { ...s, start: typeof a === 'number' ? a : a.lineEnd ? byId(a.lineEnd).end + (a.off || 0) : byId(a.line).start + (a.off || 0) }; });
shots.forEach((s, i) => { s.end = i + 1 < shots.length ? shots[i + 1].start : SONG.duration; });
const mmss = t => `${String(Math.floor(t / 60)).padStart(2, '0')}:${(t % 60).toFixed(2).padStart(5, '0')}`;
const esc = s => String(s || '—').replace(/\|/g, '｜');
const PER = { now: '现在（阴天下午，不开灯）', early: '最初（蜂蜜色）', late: '后来（平光）' };
let md = `# 镜头表（由 data/storyboard.js + data/lyrics.lrc 生成）\n\n`;
md += `歌曲：${SONG.artist}《${SONG.title}》 · ${SONG.version} · 时长 ${mmss(SONG.duration)} · 实测速度约 ${PHRASES.tempo} BPM（每拍 ${PHRASES.beat.toFixed(3)} 秒）\n\n`;
md += `歌词时间来自 tools/align.py：识别音频后与提供的歌词文本按拼音对齐，逐句匹配率见 data/lyrics.align-report.txt（本地文件）。每个镜头的起点锚定在某一句歌词的实际演唱时间上。\n\n`;
md += `## 全曲分段（实测）\n\n| 段落 | 时间 | 歌词 |\n| --- | --- | --- |\n`;
const seg = (name, a, b, ids) => { md += `| ${name} | ${mmss(a)}–${mmss(b)} | ${ids} |\n`; };
seg('前奏', 0, byId('L01').start, '（器乐）'); seg('主歌一', byId('L01').start, byId('L07').end, 'L01–L07'); seg('主歌二', byId('L08').start, byId('L13').end, 'L08–L13');
seg('间奏', byId('L13').end, byId('L14').start, '（器乐）'); seg('副歌', byId('L14').start, byId('L20').end, 'L14–L20'); seg('长间奏', byId('L20').end, byId('L21').start, '（器乐）');
seg('主歌三', byId('L21').start, byId('L28').end, 'L21–L28'); seg('最后一段', byId('L29').start, byId('L36').end, 'L29–L36'); seg('尾奏', byId('L36').end, SONG.duration, '（器乐）');
md += `\n## 镜头\n\n| 镜头 | 起止 | 时期 | 段落 | 歌词 | 景别 | 场景 | 人物动作 | 物件状态 | 转场 |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |\n`;
for (const s of shots) {
  const lines = L.filter(l => l.start >= s.start - 0.15 && l.start < s.end - 0.15);
  const lyr = lines.length ? lines.map(l => WITH_TEXT ? `${l.id}「${l.text}」` : `${l.id} ${mmss(l.start)}`).join('<br>') : '（器乐）';
  md += `| ${s.id} | ${mmss(s.start)}–${mmss(s.end)} | ${esc(PER[s.period] || s.period)} | ${esc(s.section)} | ${lyr} | ${esc(s.size)} | ${esc(s.place)} | ${esc(s.action)} | ${esc(s.objects)} | ${esc(s.cut)} |\n`;
}
const out = WITH_TEXT ? path.join(__dirname, '..', 'out', '04-storyboard-with-lyrics.md') : path.join(__dirname, '..', 'docs', '04-storyboard.md');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, md);
console.log(`${shots.length} shots → ${path.relative(process.cwd(), out)}`);
