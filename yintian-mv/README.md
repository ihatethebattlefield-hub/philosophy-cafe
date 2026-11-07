# 阴天 · 同一张桌子

为莫文蔚《阴天》制作的原创像素叙事歌词 MV。一个阴天的下午，同一张窗边的桌子，三个时期：现在、最初、后来。不开灯的房间里，一个女人整理桌上的东西。没有重逢：最后她把旧照片从手边挪开，给杯子腾出位置，续上热水，侧身朝着窗户坐下。

| 交付物 | 说明 |
| --- | --- |
| `out/mv-1080x1920.mp4` | 成片：1080×1920 · 30 fps · H.264 · yuv420p · 原曲音轨（AAC 48 kHz）· 长度等于音频 4:02.39 |
| `out/keyframes/` | 四张关键帧（1080×1920） |
| `out/tests/` | 三段测试片段：杯子碰到照片 / 跨时期的同一画面 / 钥匙与离开 |
| `assets/sprite-atlas.png` | 精灵图集：两个人的四个方向、6 帧走路、坐、手臂姿势、七种表情；道具；俯视的手；调色板 |
| `assets/style-*.png` | 场景样张（不带字幕）：房间三个时期、厨房、小馆子、婚宴、车站、楼道、反打、特写、结尾 |
| `assets/fonts/` | Fusion Pixel 像素字体子集（SIL OFL 1.1，许可证见 `OFL.txt`） |
| `data/storyboard.js` | 镜头时间线：46 个镜头，每个锚定在一句歌词的实际演唱时间上 |
| `data/phrases.js` | 实测速度、拍点与人声乐句时间（不含歌词文字） |
| `docs/` | 设计说明、美术规范、故事、镜头表 |

`out/`、`audio/` 和歌词文件（`data/lyrics.*`）以及识别缓存不进 git：原曲和歌词是受版权保护的作品，成片里也包含它们，只在本地交付。

## 运行

```bash
# 依赖：Node + Playwright（Chromium）、Python 3（numpy、pypinyin、faster-whisper）、ffmpeg
cp 你的音频.mp3 audio/song.mp3
cp 你的歌词.txt data/lyrics.txt                                          # 一行一句
python3 tools/analyze.py audio/song.mp3 data/analysis.json              # 速度、拍点、响度段落
python3 tools/asr.py audio/song.mp3 data/asr-medium.json                # 人声乐句时间
python3 tools/phrases.py data/asr-medium.json data/analysis.json data/phrases.js
python3 tools/align.py audio/song.mp3 data/lyrics.txt data/lyrics.lrc --extra data/asr-medium.json   # 歌词逐字对齐
node tools/lyrics.js data/lyrics.lrc                                    # LRC → data/lyrics.js
node tools/board.js                                                     # 镜头表 docs/04-storyboard.md
tools/build.sh preview                                                  # 全曲 360×640 预览
tools/build.sh final                                                    # 1080×1920 成片
node tools/shot.js "t=150" frame.png                                    # 任意时刻的单帧（1080×1920）
node tools/shot.js "atlas" assets/sprite-atlas.png                      # 精灵图集
node tools/shot.js "t=49&nosubs" style.png                              # 不带字幕的样张
```

也可以直接提供带时间的 LRC（含逐字标签更好）或 SRT，跳过识别：`node tools/lyrics.js 歌词.lrc`。时间戳只来自对齐结果或你提供的文件，代码里不写死任何歌词时间。

## 工作原理

- **逐帧确定：** `renderFrame(t)` 只由时间 t、场景数据和固定随机种子决定，每一帧从空白开始画。帧 f 对应歌曲的 f/30 秒，画面和声音不会漂移。
- **一套像素网格：** 每个场景是 180×320 的美术画布，用整数倍取景：2× 是整个场景（全景），3× 是三分之一宽的自然中景。特写也画在 180×320 的画布上、以 2× 显示，所以全片只有同一种像素尺寸（字幕在自己的 270×480 层上 ×4）。
- **形状：** 多边形按扫描线填成整像素（没有抗锯齿），`shape()` 给每个形状加 1 像素描边、一侧的阴影带和受光边；墙面、木地板、桌面纹理和接触阴影各有自己的函数（`src/texture.js`）。
- **没有空白：** 每个场景从墙到前景都放满东西：房间的书架、唱片机、扶手椅、背对镜头的沙发和最近处的植物与篮子；厨房的瓷砖、碗架、冰箱上的便条、玄关的钥匙碟；回忆里的小馆子、婚宴的一桌桌客人、车站对面的店铺和路上的出租车。任何 2× 或 3× 取景都不会落在一片空地上。
- **字幕：** 只来自 `data/lyrics.js`；窄的米白条、细棕边、唱到的字变深红，最多两行。
- **查看框：** 全片只出现三次（合照 / 照片背面 / 收据），由她拿起东西的动作触发；没有好感度、任务之类的界面。

## 文件

```
index.html            页面：画布 + 按顺序加载脚本
src/pixel.js          调色板、整像素绘制、扫描线多边形与描边形状、像素字体
src/sprites.js        两个人：头与身体网格、手臂与腿、走路、坐、姿势、表情；小道具
src/texture.js        墙面、木板、光、接触阴影
src/sets.js           时期调色（LOOKS）、家具、主房间（窗、书架、餐桌、扶手椅、沙发、前景）
src/kitchen.js        厨房与玄关
src/flat.js           楼道；主房间反打
src/memory.js         小馆子、婚宴、车站
src/closeups.js       特写：照片正反面、收据、烟灰缸、钥匙碟、碗架、桌面俯视；俯视的手；查看框
src/subs.js           字幕
src/story.js          46 个镜头的动作与取景
src/main.js           入口：renderFrame(t)、精灵图集
tools/                音频分析、识别、对齐、镜头表、截帧、渲染
```
