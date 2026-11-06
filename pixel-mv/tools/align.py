"""Align the lyric text to the recording and write a timed LRC.

    python3 tools/align.py audio/song.mp3 data/lyrics.txt data/lyrics.lrc [--model medium]

1. Speech recognition (faster-whisper, run locally) gives recognised characters
   with timestamps. Singing makes recognition imperfect, so its *text* is not trusted.
2. Both the recognised text and the supplied lyrics are converted to pinyin and
   globally aligned (Needleman–Wunsch): exact character, same syllable and
   similar syllable all count as matches, which tolerates homophone errors.
3. Each lyric character takes the time of the recognised character it matched;
   unmatched characters are interpolated between matched neighbours.
4. A per-line report gives the match rate; low-confidence lines are flagged
   for checking by ear rather than silently trusted.

Whisper reports times per recognised token. A token of several characters is
split evenly across its duration — the report says how many characters were
timed that way, so per-character highlight is never claimed as more precise
than the data behind it.
"""
import json
import os
import sys

from pypinyin import lazy_pinyin, Style

audio, lyr_path, out_lrc = sys.argv[1:4]
model_name = sys.argv[sys.argv.index('--model') + 1] if '--model' in sys.argv else 'medium'
cache = os.path.splitext(out_lrc)[0] + f'.asr-{model_name}.json'

lyrics = [l.strip().rstrip('。') for l in open(lyr_path, encoding='utf-8') if l.strip()]

# ---------------------------------------------------------------- 1. recognise
if os.path.exists(cache):
    chars = json.load(open(cache, encoding='utf-8'))
    if not any('junk' in c for c in chars):  # cache from before the filter: mark the intro title read-out
        for c in chars:
            c['junk'] = c['s'] < 13.0 and c['c'] in '想听你听过的音乐制作人李宗盛'
else:
    import subprocess
    import numpy as np
    from faster_whisper import WhisperModel
    # decode with ffmpeg ourselves (16 kHz mono float), independent of the PyAV version
    pcm = subprocess.run(['ffmpeg', '-v', 'error', '-i', audio, '-ac', '1', '-ar', '16000', '-f', 's16le', '-'], capture_output=True, check=True).stdout
    wave_ = np.frombuffer(pcm, dtype='<i2').astype(np.float32) / 32768
    model = WhisperModel(model_name, device='cpu', compute_type='int8', cpu_threads=os.cpu_count())
    prompt = '，'.join(lyrics[:6])  # biases vocabulary toward the song; timing still comes from the audio
    segs, info = model.transcribe(wave_, language='zh', word_timestamps=True, beam_size=5, initial_prompt=prompt,
                                  vad_filter=False, condition_on_previous_text=False)
    chars = []
    for s in segs:
        # Whisper "reads" titles and credits into instrumental intros (《…》, 制作人 …): not singing.
        junk = '《' in s.text or any(k in s.text for k in ('制作人', '作词', '作曲', '编曲', '字幕'))
        for w in s.words or []:
            cs = [c for c in w.word if '一' <= c <= '鿿']
            if not cs:
                continue
            d = (w.end - w.start) / len(cs)
            for k, c in enumerate(cs):
                chars.append({'c': c, 's': round(w.start + k * d, 3), 'e': round(w.start + (k + 1) * d, 3), 'split': len(cs) > 1, 'p': round(w.probability, 3), 'junk': junk})
        print(f'  [{s.start:6.2f}–{s.end:6.2f}] {s.text}', flush=True)
    json.dump(chars, open(cache, 'w', encoding='utf-8'), ensure_ascii=False)

# ---------------------------------------------------------------- 2. align
def py(c):
    return lazy_pinyin(c, style=Style.NORMAL, errors='ignore')[0] if c else ''

INITIALS = ('zh', 'ch', 'sh', 'b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'j', 'q', 'x', 'r', 'z', 'c', 's', 'y', 'w')
def split_py(p):
    for i in INITIALS:
        if p.startswith(i):
            return i, p[len(i):]
    return '', p

def score(a, b):
    if a == b:
        return 3
    pa, pb = py(a), py(b)
    if pa == pb:
        return 2.5
    ia, fa = split_py(pa); ib, fb = split_py(pb)
    if fa == fb or (ia == ib and fa[:1] == fb[:1]):
        return 1
    return -1.5

L = [(li, c) for li, line in enumerate(lyrics) for c in line if '一' <= c <= '鿿']
R = [c for c in chars if not c['junk']]
n, m = len(L), len(R)
GAP = -1.0
S = [[0.0] * (m + 1) for _ in range(n + 1)]
T = [[0] * (m + 1) for _ in range(n + 1)]
for i in range(1, n + 1):
    S[i][0] = S[i - 1][0] + GAP; T[i][0] = 1
for j in range(1, m + 1):
    S[0][j] = S[0][j - 1] + GAP * 0.3; T[0][j] = 2   # skipping recognised junk is cheap
pys_L = [py(c) for _, c in L]
for i in range(1, n + 1):
    li, ci = L[i - 1]
    for j in range(1, m + 1):
        d = S[i - 1][j - 1] + score(ci, R[j - 1]['c'])
        u = S[i - 1][j] + GAP
        l = S[i][j - 1] + GAP * 0.3
        if d >= u and d >= l:
            S[i][j] = d; T[i][j] = 0
        elif u >= l:
            S[i][j] = u; T[i][j] = 1
        else:
            S[i][j] = l; T[i][j] = 2
match = [None] * n
i, j = n, m
while i > 0 and j > 0:
    if T[i][j] == 0:
        if score(L[i - 1][1], R[j - 1]['c']) > 0:
            match[i - 1] = j - 1
        i -= 1; j -= 1
    elif T[i][j] == 1:
        i -= 1
    else:
        j -= 1

# ---------------------------------------------------------------- 3. times
times = [None] * n
for k, mj in enumerate(match):
    if mj is not None:
        times[k] = (R[mj]['s'], R[mj]['e'], R[mj]['split'])
# interpolate unmatched characters between matched neighbours
known = [k for k in range(n) if times[k]]
for k in range(n):
    if times[k]:
        continue
    prev = max((q for q in known if q < k), default=None)
    nxt = min((q for q in known if q > k), default=None)
    if prev is not None and nxt is not None:
        a, b = times[prev][1], times[nxt][0]
        f = (k - prev) / (nxt - prev)
        s = a + (b - a) * f
        times[k] = (s, s + 0.15, 'interp')
    elif prev is not None:
        times[k] = (times[prev][1] + 0.2 * (k - prev), times[prev][1] + 0.2 * (k - prev) + 0.15, 'interp')
    else:
        times[k] = (times[nxt][0] - 0.2 * (nxt - k), times[nxt][0] - 0.2 * (nxt - k) + 0.15, 'interp')

# ---------------------------------------------------------------- 4. write
def stamp(t):
    m_, s_ = divmod(max(0.0, t), 60)
    return f'{int(m_):02d}:{s_:05.2f}'

out, report = ['[ti:多远都要在一起]', '[ar:邓紫棋]', '[al:新的心跳]', '[by:tools/align.py (faster-whisper ' + model_name + ' + pinyin alignment)]'], []
k = 0
for li, line in enumerate(lyrics):
    idx = [q for q in range(n) if L[q][0] == li]
    ts = [times[q] for q in idx]
    matched = sum(1 for q in idx if match[q] is not None)
    split = sum(1 for q in idx if match[q] is not None and times[q][2] is True)
    rate = matched / max(1, len(idx))
    start = ts[0][0]
    body = ''.join(f'<{stamp(t[0])}>{L[q][1]}' for q, t in zip(idx, ts))
    out.append(f'[{stamp(start)}]{body}')
    nxt = [q for q in range(n) if L[q][0] == li + 1]
    gap = (times[nxt[0]][0] if nxt else 1e9) - ts[-1][1]
    if gap > 1.0:
        out.append(f'[{stamp(ts[-1][1] + 0.35)}]')   # end of the sung phrase
    flag = '  ← CHECK' if rate < 0.6 else ''
    report.append(f'L{li + 1:02d} {stamp(start)}–{stamp(ts[-1][1])}  match {rate:4.0%}  split {split:2d}/{len(idx):2d}  {line}{flag}')
open(out_lrc, 'w', encoding='utf-8').write('\n'.join(out) + '\n')
rep = os.path.splitext(out_lrc)[0] + '.align-report.txt'
open(rep, 'w', encoding='utf-8').write('\n'.join(report) + '\n')
print('\n'.join(report))
print(f'\n{len(R)} recognised characters, {sum(1 for x in match if x is not None)}/{n} lyric characters matched → {out_lrc}')
