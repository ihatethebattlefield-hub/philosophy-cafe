# LOVE SONG · 一座城市的秘密排练

为方大同《Love Song》制作的原创像素叙事歌词 MV。一个不太会表达的人写下一段旋律，旋律却先于他走出房间，穿过整座城市，去寻找那个他想唱给她听的人。最后他发现，她早就记得他的节奏。

| 交付物 | 说明 |
| --- | --- |
| `out/mv-1080x1920.mp4` | 成片：1080×1920 · 30 fps · H.264 · yuv420p · 原曲音轨（AAC 48 kHz）· 长度等于音频 4:29.32 |
| `out/preview-360x640.mp4` | 全曲逻辑分辨率预览 |
| `assets/sprite-atlas.png` | 精灵图集：两位主角的四个方向、6 帧走路、坐、手臂姿势、七种表情；两个路人；道具；手部近景；调色板 |
| `assets/style-*.png` | 三张风格样片：房间、街道、手部近景 |
| `assets/fonts/` | Fusion Pixel 像素字体子集（SIL OFL 1.1，许可证见 `OFL.txt`） |
| `data/storyboard.js` | 镜头时间线：42 个镜头，每个锚定在一句歌词上 |
| `data/phrases.js` | 实测的速度、拍点网格和人声乐句时间（不含歌词文字） |
| `docs/` | 参考取舍、美术规范、故事设定、镜头表（含每个镜头的实际起止时间） |

`out/`、`audio/` 和歌词文件（`data/lyrics.*`）不进 git：原曲和歌词是受版权保护的作品，成片里也包含它们，所以只在本地交付，不上传到公开仓库。

## 运行

```bash
# 依赖：Node + Playwright（Chromium）、Python 3（numpy、pypinyin、faster-whisper）、ffmpeg
cp 你的音频.mp3 audio/song.mp3
cp 你的歌词.txt data/lyrics.txt                                          # 一行一句；中英混排可以
python3 tools/analyze.py audio/song.mp3 data/analysis.json              # 速度、拍点、响度段落
python3 tools/asr.py audio/song.mp3 data/asr-medium.json                # 人声乐句时间（第二遍识别）
python3 tools/phrases.py data/asr-medium.json data/analysis.json data/phrases.js
python3 tools/align.py audio/song.mp3 data/lyrics.txt data/lyrics.lrc --extra data/asr-medium.json   # 歌词逐字对齐
node tools/lyrics.js data/lyrics.lrc                                    # LRC → data/lyrics.js
node tools/board.js                                                     # 镜头表 docs/04-storyboard.md
tools/build.sh preview                                                  # 全曲 360×640 预览（约 1 分钟）
tools/build.sh final                                                    # 1080×1920 成片
node tools/shot.js "t=150" frame.png                                    # 任意时刻的单帧
node tools/shot.js "atlas" assets/sprite-atlas.png                      # 精灵图集
```

也可以直接提供带时间的 LRC（含 `<mm:ss.xx>` 逐字标签更好）或 SRT，跳过识别：`node tools/lyrics.js 歌词.lrc`。

## 工作原理

- **逐帧确定：** `renderFrame(t)` 只由时间 t、场景数据和固定随机种子决定，每一帧都从空白开始画。帧 f 对应歌曲的 f/30 秒，画面和声音不会因为渲染速度而漂移。
- **像素：**
  - 画面画在 360×640 的逻辑画布上，最近邻放大 ×3。
  - 室内和人物中景先在 180×320 的场景缓冲里按真实比例画好，再整数放大 2×。
  - 近景用更多像素去画，而不是放大像素。
  - 字幕在自己的 270×480 层上画，放大 ×4：48 像素高的点阵字，与画面网格互不干扰。
- **光线：** 故事从下午走到夜里。天空、环境色、太阳光斑、窗灯和路灯都由同一个时间值决定，不是一层固定的橙色滤镜。
- **节奏：**
  - 拍点来自实测（约 115.7 BPM，每拍 0.519 秒），不预设 BPM，也不改原曲速度。
  - 敲桌的前半句（四下）和后半句（三下）都落在拍点网格上。
  - 跟着音乐动的物件各自错开拍点，不是所有东西一起在正拍上跳。
- **字幕：**
  - 只从你提供的歌词文本和对齐结果读取，绘图代码里没有写死歌词。
  - 一次一行，过长时在空格处断开。
  - 已唱的字是满色奶油白，还没唱到的暗一档。
  - 只有两处关键词进入画面：咖啡馆黑板上的 Love Song，纸背面写下的 Melody。主字幕始终完整。
- **剪辑：** 每个镜头锚定在一句歌词上；动作落在乐句内的具体位置，例如她在副歌 2 的 L43 起敲出后半句，L62 时两段节奏第一次接上。

## 对齐的可靠程度

- 68 句、527 个计时单位（汉字和英文单词）中 519 个对上了识别结果。61 句 100% 匹配，其余 7 句 80–93%。见 `data/lyrics.align-report.txt`。
- 用了两遍识别：带歌词提示的一遍，加上一遍不同解码设置的（`tools/asr.py`）。每句取匹配更多的那一遍。最终副歌后段只有第二遍听清了。
- 识别模型有时把几个字合成一个词，只给出整词的时间。这些字在词的时长内均分，报告里的 `split` 列写明每句有多少字是这样处理的。所以逐字高亮在这些地方是“词级”精度，不是“字级”。

## 版权

- 歌曲《Love Song》：演唱 方大同，2007。词曲与录音的版权归各自权利人所有。
- 音频与歌词由使用者提供。本项目只包含原创的画面、角色、程序与工具，不包含也不分发音频和歌词文本。公开发布前请自行取得或确认相应授权。
- 字体 Fusion Pixel © TakWolf，SIL Open Font License 1.1。
