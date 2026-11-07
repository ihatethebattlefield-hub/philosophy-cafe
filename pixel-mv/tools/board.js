// Writes the storyboard table: every shot with its resolved start/end in the song,
// the lyric lines it covers, and its beats.
//   node tools/board.js            → docs/04-storyboard.md (lyric IDs and times only; safe to commit)
//   node tools/board.js --lyrics   → out/04-storyboard-with-lyrics.md (also quotes the lyric text; stays local)
const fs = require('fs');
const path = require('path');
global.window = {};
for (const f of ['song.js', 'lyrics.js', 'storyboard.js']) require(path.join(__dirname, '..', 'data', f));
const { SONG, LYRICS, BOARD } = window;
const WITH_TEXT = process.argv.includes('--lyrics');
const L = LYRICS.lines, byId = id => L.find(l => l.id === id);
const intro = byId('L01').start;
const shots = BOARD.shots.map(s => {
  const a = s.at;
  const start = typeof a === 'number' ? a : a.intro !== undefined ? intro * a.intro : a.lineEnd ? byId(a.lineEnd).end + (a.off || 0) : byId(a.line).start + (a.off || 0);
  return { ...s, start };
});
shots.forEach((s, i) => { s.end = i + 1 < shots.length ? shots[i + 1].start : SONG.duration; });
const mmss = t => `${String(Math.floor(t / 60)).padStart(2, '0')}:${(t % 60).toFixed(2).padStart(5, '0')}`;
const esc = s => String(s || '—').replace(/\|/g, '｜');
let md = `# 分镜表（由 data/storyboard.js + data/lyrics.lrc 生成）\n\n`;
md += `歌曲：${SONG.artist}《${SONG.title}》 · ${SONG.version} · 时长 ${mmss(SONG.duration)}\n\n`;
md += `歌词时间来自 tools/align.py：用 Whisper 识别音频，再与提供的歌词文本做拼音对齐，逐句匹配率见 data/lyrics.align-report.txt。每个镜头的起点锚定在某一句歌词上（或前奏的比例位置），所以剪辑点跟着真实的演唱走。\n\n`;
md += `| 镜头 | 起止 | 段落 | 歌词 | 场景 | 人物动作 / 反应 | 镜头 | 界面事件 | 转出 |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- |\n`;
for (const s of shots) {
  const lines = L.filter(l => l.start >= s.start - 0.01 && l.start < s.end - 0.01);
  const lyr = lines.length ? lines.map(l => WITH_TEXT ? `${l.id}「${l.text}」` : `${l.id} ${mmss(l.start)}`).join('<br>') : '（器乐）';
  md += `| ${s.id} | ${mmss(s.start)}–${mmss(s.end)} | ${esc(s.section)} | ${lyr} | ${esc(s.place)} | ${esc(s.action)} | ${esc(s.camera)} | ${esc(s.ui)} | ${esc(s.out)} |\n`;
}
md += `\n## 重复段落如何推进\n\n`;
md += `| 歌词重复 | 第一次 | 再次出现 |\n| --- | --- | --- |\n`;
md += `| 副歌（L13–L20 / L29–L36 / L40–L47） | 副歌 1（S10–S14）：约定在风见站见面，各自出发；渡轮停航，路线断在海峡 | 副歌 2（S20–S23）：两人同时发出「我想去见你」，改签山线，两条路线在风见站汇合；最终副歌（S26–S31）：同一个站台，走近、牵手、拥抱 |\n`;
md += `| 每段副歌的最后两句（L19–L20 / L35–L36 / L46–L47） | 副歌 1 末：渡轮航线打叉，他离开渡口，她在列车上低头，距离回升到 2180 km | 副歌 2 末：两部手机上同一段「我到了」；最终副歌末：列车从两人身后开过，然后天黑，两人坐在长椅上 |\n`;
md += `| L07–L08 / L23–L24 | 主歌 1（S07）：两人各自把手贴在窗上，中间隔着一道缝 | 主歌 2（S17）：他的早晨、她的深夜，两人朝同一个方向一直走 |\n`;
md += `| 两个房间 | 开场（S02）：只有阿屿发出消息 | 间奏（S15）：一盏灯熄、一盏灯亮；副歌 2（S20）：两人同时发出，两个气泡在缝里相遇，然后一起出门 |\n`;
md += `| 地图 | 副歌 1（S10、S13）：2180 km，雾，渡轮停航 | 副歌 2（S22）：雾散，路线汇合；尾奏（S32）：两个小头像并排在风见站 |\n`;
const out = WITH_TEXT ? path.join(__dirname, '..', 'out', '04-storyboard-with-lyrics.md') : path.join(__dirname, '..', 'docs', '04-storyboard.md');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, md);
console.log(`${shots.length} shots → ${path.relative(process.cwd(), out)}`);
for (const s of shots) console.log(s.id.padEnd(5), mmss(s.start), '–', mmss(s.end), (s.end - s.start).toFixed(1).padStart(5) + 's', s.section);
