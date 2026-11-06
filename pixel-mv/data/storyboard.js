// Storyboard: shot order, story beats and how each shot is anchored to the song.
//
// Every shot starts at an anchor: a lyric line ID from data/lyrics.lrc (start of
// that sung line, plus an offset in seconds), or an absolute time for the intro.
// A shot ends where the next one starts. So the edit follows the real vocal
// phrasing of the recording; nothing here is a guessed duration.
//
// Lyric structure (from the supplied lyric text):
//   verse 1 L01–L08 · pre-chorus L09–L12 · chorus 1 L13–L20 · verse 2 L21–L28
//   chorus 2 L29–L36 · bridge L37–L39 · final chorus L40–L47 · outro L48–L49
window.BOARD = {
  shots: [
    { id: 'S01', at: 0, section: '前奏', place: '黑屏 → 存档界面',
      action: '黑暗中亮起光标；「双人存档」面板落下，两个头像依次点亮，光标确认「继续双人存档」。',
      camera: '固定', ui: '存档：相识第 214 天', out: '面板收成一条横线，横线成为上下两个房间之间的缝隙' },
    { id: 'S02', at: { intro: 0.38 }, section: '前奏', place: '阿屿的房间（雾港 23:40，小雨）｜小晴的房间（晴川 18:40，傍晚）',
      action: '上下分屏：两人各自坐在桌前望着自己的窗。阿屿低头看手机，按下发送，一封小信从他的窗口飞出。',
      camera: '两个房间全景；中间的状态栏就是两人之间的距离', ui: '双人状态：城市、当地时间、相距 2180 km', out: '镜头跟随信封出窗' },
    { id: 'S03', at: { intro: 0.72 }, section: '前奏', place: '两座城市之间的夜空',
      action: '信封飞过屋顶，天色从雨夜蓝紫过渡到傍晚琥珀，落进小晴的窗。',
      camera: '横向跟拍', ui: '—', out: '窗框衔接' },
    { id: 'S04', at: { line: 'L01', off: -0.4 }, section: '主歌 1', lyrics: 'L01', place: '阿屿桌面特写 → 小晴房间中景',
      action: '「音乐」：阿屿的手按下收音机播放键；小晴状态栏的耳机图标同时亮起，她戴上耳机，侧头听。',
      camera: '手部特写 → 2× 中景', ui: '收到 · 一首歌', out: '音符散开成书页' },
    { id: 'S05', at: { line: 'L02', off: -0.3 }, section: '主歌 1', lyrics: 'L02', place: '两本同样的书（特写）',
      action: '「小说」：阿屿把珊瑚色书签夹在第 117 页；翻页后，小晴在自己那本里翻到同一页，手指停在同一句话下面。',
      camera: '道具特写', ui: '收到 · 珊瑚色书签', out: '翻页揭开一张照片' },
    { id: 'S06', at: { line: 'L03', off: -0.3 }, section: '主歌 1', lyrics: 'L03–L04', place: '小晴手里的照片 → 晴天小铺（傍晚）',
      action: '「收集每一刻」：小晴拍下店门口的灯刚亮；「你眼里的世界」：照片放大成真实的街景。',
      camera: '手部特写 → 照片推进成全景', ui: '收到 · 晴天小铺的照片', out: '同一街角换成雨夜' },
    { id: 'S07', at: { line: 'L05', off: -0.3 }, section: '主歌 1', lyrics: 'L05–L06', place: '同一条街（雨夜）',
      action: '「你到过的地方」：阿屿走进照片里的街角，沿着小晴走过的路经过砖墙和 17 路公交站；「你曾度过的时光」：站台上短暂浮现小晴傍晚等车的轮廓，随即散去。',
      camera: '侧视跟拍 → 站台中景', ui: '地图：晴天小铺、17 路公交站 依次点亮', out: '路灯熄灭——房间的台灯亮起' },
    { id: 'S08', at: { line: 'L07', off: -0.3 }, section: '主歌 1', lyrics: 'L07–L08', place: '两个房间（分屏）',
      action: '「不想错过每一刻」：两人在各自的窗前，手贴在玻璃上；「多希望我一直在你身旁」：两只手在分屏两侧对齐，中间仍隔着状态栏的缝隙。',
      camera: '分屏中景 → 手与玻璃特写', ui: '双人状态：相距 2180 km', out: '缝隙拉宽成两种生活' },
    { id: 'S09', at: { line: 'L09', off: -0.3 }, section: '预副歌', lyrics: 'L09–L12', place: '热闹的路口（雾港）｜安静的房间（晴川）',
      action: '阿屿在路口停下看手机；小晴伏在桌上，杯里的热气慢慢没了。手机亮起，她过了一会儿才抬头；「你快乐我也就没关系」时她打字、停顿；「你爱自由我却更爱你」时按下发送。',
      camera: '分屏中景', ui: '正在输入… → 已发送', out: '镜头拉远成地图' },
    { id: 'S10', at: { line: 'L13', off: -0.4 }, section: '副歌 1', lyrics: 'L13–L20', place: '两城地图',
      action: '「远距离」：两座城市出现在同一张地图上，中间是海峡、山和未探索的雾。两人从各自的起点出发：走路、乘车、到站；阿屿在雾港北站买下车票。路线停在两个车站，没有接上。',
      camera: '地图俯视', ui: '主线任务「去见你」开启；进度按实际抵达的站点推进；收到 · 车票', out: '地图路线延伸成清晨' },
    { id: 'S10b', at: { lineEnd: 'L20', off: 0.3 }, section: '间奏（器乐，约 8 秒）', place: '两个房间，夜深',
      action: '没有歌词的一段。雾港已经凌晨，阿屿关掉台灯；同一刻晴川才入夜，小晴的台灯亮起，她把书翻到夹着书签的那一页。缝隙里的地图路线仍停在两个车站之间。',
      camera: '分屏全景', ui: '双人状态：01:30 ／ 20:30；歌词栏收起', out: '关灯 → 另一盏灯亮起' },
    { id: 'S11', at: { line: 'L21', off: -0.4 }, section: '主歌 2', lyrics: 'L21–L24', place: '雾港清晨 06:10（晴）｜晴川深夜 01:10（雨）',
      action: '上下分屏：阿屿推开窗，抬手挡太阳；小晴在雨里的公交站撑伞。「用思念让我们一直前进」时，一把伞越过分屏缝隙伸向阿屿（想象），然后回到视频通话。',
      camera: '分屏全景 → 通话界面', ui: '视频通话', out: '通话画面冻结' },
    { id: 'S12', at: { line: 'L25', off: -0.3 }, section: '主歌 2', lyrics: 'L25–L28', place: '通话 → 车站告示 → 小晴的房间 → 背包',
      action: '通话卡住，「正在输入」消失；「失约的旅行」：车站屏幕上，原定的那班渡轮显示停航，车票作废，地图路线停在雾里。小晴打开背包，一件件看过收到的东西；「如果我有留下你的勇气」时，她自己选择「再次连接」。',
      camera: '界面 → 告示特写 → 房间中景 → 物品检查', ui: '背包；选项：继续等待 / 再次连接', out: '光标确认，两部手机同时亮起' },
    { id: 'S13', at: { line: 'L29', off: -0.4 }, section: '副歌 2', lyrics: 'L29–L36', place: '两个房间 → 地图 → 手机屏幕',
      action: '这次两人同时发出消息，两个气泡在缝隙里相遇；改签后的路线经由渡轮和山线一起抵达中转站「风见站」；书签和新车票被带在身上；两只手隔着屏幕对齐。',
      camera: '分屏 → 地图 → 手部特写', ui: '任务：两人都抵达风见站；携带物品', out: '屏幕的边缘化作站台的地平线' },
    { id: 'S14', at: { line: 'L37', off: -0.5 }, section: '桥段', lyrics: 'L37–L39', place: '风见站站台（上下两半）',
      action: '「阳光」「彩虹」：两个站台画面的天色一边雨后放晴、一边夕阳，地平线和屋檐慢慢对齐；「你能不能不离开呢」时，缝隙开始变窄。',
      camera: '分屏全景，两半逐渐对齐', ui: '状态栏两半向中间靠拢', out: '缝隙消失' },
    { id: 'S15', at: { line: 'L40', off: -0.4 }, section: '最终副歌', lyrics: 'L40–L47', place: '风见站站台（同一时间、同一束光）',
      action: '两边的光第一次一样。阿屿走出画面，镜头跟随；小晴转头；两人看见彼此，停下、确认、走近。手部近景：两只手第一次在同一个空间里碰到。拥抱。',
      camera: '跟拍 → 手部特写 → 全景', ui: '状态栏合成一条：同一时间', out: '画面停在两人并肩' },
    { id: 'S16', at: { line: 'L48', off: -0.5 }, section: '尾奏', lyrics: 'L48–L49', place: '风见站长椅，一扇共同的窗',
      action: '两人并排坐在长椅上，头顶是一扇大窗，回应开场的两扇窗。「双人存档已更新」；背包里的书签、照片、车票、那首歌各有来源。远处列车经过，围巾轻动，直到歌曲结束。',
      camera: '全景，静止', ui: '存档：第 216 天 · 风见站；背包', out: '安静画面持续到最后一帧' },
  ],
};
