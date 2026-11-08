"""Builds assets/fonts/fusion-pixel-{8,10,12}px.woff2: Fusion Pixel Font (OFL-1.1,
https://github.com/TakWolf/fusion-pixel-font), subset to GB2312 + the characters used
in data/ and src/ (the lyrics use a few traditional forms such as 憶 and 著).

  npm i @vp-tw/cjk-web-fonts-fusion-pixel-font   (anywhere; its dist/ holds per-block woff2 slices)
  python3 tools/fonts.py <that package's dist/ directory>
"""
import glob, os, sys
from fontTools.ttLib import TTFont
from fontTools.merge import Merger
from fontTools.subset import Subsetter, Options

dist = sys.argv[1]
root = os.path.join(os.path.dirname(__file__), '..')
chars = set(chr(c) for c in range(0x20, 0x7f))
for hi in range(0xb0, 0xf8):           # GB2312 hanzi + punctuation rows
    for lo in range(0xa1, 0xff):
        try: chars.add(bytes([hi, lo]).decode('gb2312'))
        except UnicodeDecodeError: pass
for hi in range(0xa1, 0xaa):
    for lo in range(0xa1, 0xff):
        try: chars.add(bytes([hi, lo]).decode('gb2312'))
        except UnicodeDecodeError: pass
for pat in ['data/*.txt', 'data/*.js', 'data/*.lrc', 'src/*.js']:
    for f in glob.glob(os.path.join(root, pat)):
        chars |= set(open(f, encoding='utf-8').read())
chars |= set('♪♫★☆♥♡◆◇●○▶◀■□▲▼←→↑↓…·×✓✔—「」『』《》')
cps = {ord(c) for c in chars if ord(c) >= 0x20}

for size in (8, 10, 12):
    parts = []
    for f in sorted(glob.glob(os.path.join(dist, f'{size}px/proportional/zh_hans/*.woff2'))):
        font = TTFont(f)
        have = set(font.getBestCmap()) & cps
        if not have: continue
        opts = Options(); opts.flavor = None; opts.notdef_outline = True; opts.layout_features = []; opts.name_IDs = ['*']
        sub = Subsetter(opts); sub.populate(unicodes=have); sub.subset(font)
        tmp = f'/tmp/fp-{size}-{len(parts)}.otf'; font.flavor = None; font.save(tmp); parts.append(tmp)
    merged = Merger().merge(parts)
    merged.flavor = 'woff2'
    out = os.path.join(root, 'assets', 'fonts', f'fusion-pixel-{size}px.woff2')
    merged.save(out)
    print(size, len(parts), 'slices', len(merged.getBestCmap()), 'glyphs', os.path.getsize(out) // 1024, 'KB')
