// Writes the shot table: every shot with its resolved start/end in the song, the
// lyric lines it covers, shot size, action, environment motion, transition, echo.
//   node tools/board.js            → docs/04-storyboard.md (lyric IDs and times only; safe to commit)
//   node tools/board.js --lyrics   → out/04-storyboard-with-lyrics.md (also quotes the lyric text; stays local)
const fs = require('fs');
const path = require('path');
global.window = {};
for (const f of ['song.js', 'phrases.js', 'lyrics.js', 'storyboard.js']) require(path.join(__dirname, '..', 'data', f));
const { SONG, LYRICS, BOARD, PHRASES } = window;
const WITH_TEXT = process.argv.includes('--lyrics');
const L = LYRICS.lines, byId = id => L.find(l => l.id === id);
const shots = BOARD.shots.map(s => {
  const a = s.at;
  const start = typeof a === 'number' ? a : a.lineEnd ? byId(a.lineEnd).end + (a.off || 0) : byId(a.line).start + (a.off || 0);
  return { ...s, start };
});
shots.forEach((s, i) => { s.end = i + 1 < shots.length ? shots[i + 1].start : SONG.duration; });
const mmss = t => `${String(Math.floor(t / 60)).padStart(2, '0')}:${(t % 60).toFixed(2).padStart(5, '0')}`;
const esc = s => String(s || '—').replace(/\|/g, '｜');
let md = `# 镜头表（由 data/storyboard.js + data/lyrics.lrc 生成）\n\n`;
md += `歌曲：${SONG.artist}《${SONG.title}》 · ${SONG.version} · 时长 ${mmss(SONG.duration)} · 实测速度约 ${PHRASES.tempo} BPM（每拍 ${PHRASES.beat.toFixed(3)} 秒）\n\n`;
md += `歌词时间来自 tools/align.py：识别音频后与提供的歌词文本做拼音（中文）与拼写（英文）对齐，逐句匹配率见 data/lyrics.align-report.txt。每个镜头的起点锚定在某一句歌词上，剪辑点跟着真实的演唱走。\n\n`;
md += `## 全曲分段（实测）\n\n| 段落 | 时间 | 歌词 |\n| --- | --- | --- |\n`;
const seg = (name, a, b, ids) => { md += `| ${name} | ${mmss(a)}–${mmss(b)} | ${ids} |\n`; };
seg('前奏', 0, byId('L01').start, '（器乐）'); seg('主歌 1', byId('L01').start, byId('L10').end, 'L01–L10'); seg('预副歌', byId('L11').start, byId('L12').end, 'L11–L12');
seg('副歌 1', byId('L13').start, byId('L25').end, 'L13–L25'); seg('主歌 2', byId('L26').start, byId('L32').end, 'L26–L32'); seg('预副歌', byId('L33').start, byId('L33').end, 'L33');
seg('副歌 2', byId('L34').start, byId('L46').end, 'L34–L46'); seg('桥段', byId('L47').start, byId('L57').end, 'L47–L57'); seg('间奏 + 一句', byId('L57').end, byId('L58').end, 'L58');
seg('最终副歌', byId('L59').start, byId('L68').end, 'L59–L68'); seg('尾奏', byId('L68').end, SONG.duration, '（器乐）');
md += `\n## 镜头\n\n| 镜头 | 起止 | 段落 | 歌词 | 景别 | 场景 | 人物动作 | 环境运动 | 转场 | 前后呼应 |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |\n`;
for (const s of shots) {
  const lines = L.filter(l => l.start >= s.start - 0.15 && l.start < s.end - 0.15);
  const lyr = lines.length ? lines.map(l => WITH_TEXT ? `${l.id}「${l.text}」` : `${l.id} ${mmss(l.start)}`).join('<br>') : '（器乐）';
  md += `| ${s.id} | ${mmss(s.start)}–${mmss(s.end)} | ${esc(s.section)} | ${lyr} | ${esc(s.size)} | ${esc(s.place)} | ${esc(s.action)} | ${esc(s.env)} | ${esc(s.cut)} | ${esc(s.echo)} |\n`;
}
md += `\n## 重复的副歌怎样推进\n\n| | 副歌 1（L13–L25） | 副歌 2（L34–L46） | 最终副歌（L59–L68） |\n| --- | --- | --- | --- |\n`;
md += `| 谁在主导 | 音符带着他走；城市开始伴奏 | 他自己选方向，音符跟在后面；她主动去认那些节奏 | 不再需要带路：他敲前半句，她补后半句 |\n`;
md += `| 路灯 | 还没亮 | 他经过时依次亮起；她敲后半句时整条街一盏接一盏亮 | 全亮，照常 |\n`;
md += `| 两人的距离 | 同一条街两侧，构图靠近但谁也没看见谁 | 同一个车站两侧，被电车挡住，视线错开 | 面对面 |\n`;
md += `\n## 反复使用的几个细节\n\n| 细节 | 第一次 | 之后 |\n| --- | --- | --- |\n`;
md += `| 敲桌的节奏（前半句四下 / 后半句三下） | S01 他一个人敲前半句 | S10 她的杯子里出现同样四下；S11 他紧张时也敲；S19 回忆里她边画边敲；S27 她在路灯杆上敲出后半句；S37 两段第一次接上；S42 她敲一下、他接一下 |\n`;
md += `| 杯柄的方向 | S09 店员放下时朝右；S10 她转向左边（习惯） | S18 空桌上她的杯柄朝左；S21 他把自己的杯柄也转向左边 |\n`;
md += `| 折起的纸角 | S01–S03 他的纸右上角折着 | S19 回忆里他记下节奏后折起纸角；S21 他把餐巾纸夹进纸里折好 |\n`;
md += `| 线上的小鸟 | S09 她的速写本 | S20 餐巾纸；S22 速写本里排成音符的一排小鸟；S41 她在纸的背面画下 |\n`;
md += `| 空椅子 | S02 他对着空椅子排练 | S41 同一构图，她坐在那把椅子上 |\n`;
const out = WITH_TEXT ? path.join(__dirname, '..', 'out', '04-storyboard-with-lyrics.md') : path.join(__dirname, '..', 'docs', '04-storyboard.md');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, md);
console.log(`${shots.length} shots → ${path.relative(process.cwd(), out)}`);
for (const s of shots) console.log(s.id.padEnd(5), mmss(s.start), '–', mmss(s.end), (s.end - s.start).toFixed(1).padStart(5) + 's', s.section);
