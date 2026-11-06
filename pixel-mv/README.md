# 多远都要在一起 · 双人存档 / TWO CITIES, ONE SAVE

为邓紫棋《多远都要在一起》制作的像素叙事歌词 MV。两个人在两座城市，通过一首歌、一本书、一张照片和一张船票进入彼此的生活。第一次约好的见面因为渡轮停航失约，第二次两人同时出发，走进同一个站台。

| 交付物 | 说明 |
| --- | --- |
| `out/mv-1080x1920.mp4` | 成片：1080×1920 · 30fps · H.264 · yuv420p · 原曲音轨（AAC 48 kHz）· 长度等于音频 3:37.68 |
| `out/preview-270x480.mp4` | 全曲逻辑分辨率预览 |
| `assets/sprite-atlas.png` | 精灵图集：两位主角四个方向、走路帧、坐姿、姿势、表情；道具；手部近景；调色板 |
| `assets/fonts/` | Fusion Pixel 像素字体子集（SIL OFL 1.1，许可证见 `OFL.txt`） |
| `data/storyboard.js` | 时间线：33 个镜头，每个锚定在一句歌词上 |
| `data/lyrics.lrc` | 逐字时间的歌词（由对齐工具生成，可直接用于其它播放器） |
| `data/lyrics.align-report.txt` | 每句的匹配率与逐字时间来源 |
| `docs/` | 参考分析、美术规范、故事设定、分镜表（含每个镜头的实际起止时间） |

`out/`、`audio/` 和歌词文件不进 git。原曲是商业录音，成片里也包含它，所以只在本地交付，不上传到公开仓库。

## 运行

```bash
# 依赖：Node + Playwright（Chromium）、Python 3（numpy、pypinyin、faster-whisper）、ffmpeg
cp 你的音频.mp3 audio/song.mp3
python3 tools/align.py audio/song.mp3 data/lyrics.txt data/lyrics.lrc   # 识别 + 对齐（约 2 分钟，CPU）
node tools/lyrics.js data/lyrics.lrc                                    # LRC → data/lyrics.js
node tools/board.js                                                     # 生成分镜表 docs/04-storyboard.md
tools/build.sh preview                                                  # 全曲 270×480 预览（约 1 分钟）
tools/build.sh final                                                    # 1080×1920 成片
node tools/shot.js "t=150" frame.png                                    # 任意时刻的单帧（1080×1920）
node tools/shot.js "atlas" assets/sprite-atlas.png                      # 精灵图集
```

也可以直接提供带时间的 LRC（含 `<mm:ss.xx>` 逐字标签更好）或 SRT，跳过识别：`node tools/lyrics.js 歌词.lrc`。

## 工作原理

- **逐帧确定：** `renderFrame(t)` 只由时间 t、场景数据和固定随机种子决定，每一帧都从空白开始画。帧 f 对应歌曲的 f/30 秒，所以画面和声音不会因为渲染速度而漂移。
- **像素：**
  - 一切画在 270×480 的逻辑画布上，最后按最近邻放大 ×4。4×4 的像素块和 yuv420p 的色度采样对齐，编码后像素边缘干净。
  - 中景用整数 2× 摄像机；近景用更多像素去画，而不是放大像素。
  - 中文是 Fusion Pixel 点阵字体，按原生 8/10/12 px 渲染并二值化。
- **比例与动作：**
  - 人物 14×28，所有场景按 1 m ≈ 17 px 搭建。
  - 列车和公交匀减速进站、匀加速出站。
  - 走路的步幅和移动速度匹配，人行道上的人被车流挡住。
- **HUD：** 两位玩家的所在地、当地时间、天气，主线任务和两人之间的距离（2180 km → 0.0 m）。
- **歌词：**
  - 只从 `data/lyrics.txt`（你提供的文本）和对齐结果读取，绘图代码里没有写死歌词。
  - 已唱的字在演唱的时刻变成珊瑚色。
  - 超过 4 秒的器乐段（前奏、间奏、尾奏），歌词栏会收起。
- **剪辑：**
  - 每个镜头锚定在某一句歌词上（`data/storyboard.js`），大多数镜头承载一组两句歌词（6–9 秒），只有单个动作（书签、两只手、拥抱）是一句。
  - 镜头内的关键动作落在具体乐句上，例如唱到 L12 时按下发送，唱到 L28 时确认「再次连接」。

## 对齐的可靠程度

- 49 句全部匹配上：36 句 100%，其余 13 句 71–90%。见 `data/lyrics.align-report.txt`。
- 每句的起止时间来自识别结果中对应字的时间。
- 识别模型有时把几个字合成一个词，只给出整词的时间。这些字的时间是在词的时长内均分的，报告里的 `split` 列给出每句有多少字是这样处理的。所以逐字高亮在这些地方的精度是“词级”，不是“字级”。
- 前奏里模型凭空“读出”了歌名和制作人，这一段已被过滤，不参与对齐。

## 版权

- 歌曲《多远都要在一起》：演唱 邓紫棋 G.E.M.，收录于专辑《新的心跳》（2015）。词曲与录音的版权归各自权利人所有。
- 音频与歌词由使用者提供，本项目只包含原创的画面、角色、程序与工具，不包含也不分发音频。公开发布前请自行取得或确认相应授权。
- 字体 Fusion Pixel © TakWolf，SIL Open Font License 1.1。
