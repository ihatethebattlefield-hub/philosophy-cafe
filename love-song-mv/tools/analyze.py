"""Measures the recording: tempo, beat grid, loudness and spectral sections.

  python3 tools/analyze.py audio/song.mp3 data/analysis.json

- onset strength = positive spectral flux (log-magnitude STFT, 23 ms hop)
- tempo = strongest autocorrelation lag of the onset curve in 70–170 BPM
  (half/double candidates are reported, not silently chosen)
- beat phase = offset that maximises onset energy on the grid
- loudness = RMS per beat; sections = novelty peaks of a beat-synchronous
  chroma self-similarity matrix (Foote checkerboard kernel)
Nothing here assumes a BPM or a song form.
"""
import json, subprocess, sys
import numpy as np
src, out = sys.argv[1], sys.argv[2]
SR, HOP, N = 22050, 512, 2048
pcm = subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'], capture_output=True, check=True).stdout
y = np.frombuffer(pcm, np.int16).astype(np.float32) / 32768
dur = len(y) / SR
win = np.hanning(N)
frames = np.lib.stride_tricks.sliding_window_view(np.pad(y, (N // 2, N // 2)), N)[::HOP]
S = np.abs(np.fft.rfft(frames * win, axis=1))
fps = SR / HOP
logS = np.log1p(100 * S)
flux = np.maximum(0, np.diff(logS, axis=0, prepend=logS[:1])).sum(1)
flux = (flux - flux.mean()) / (flux.std() + 1e-9)
# tempo by autocorrelation
ac = np.correlate(flux, flux, 'full')[len(flux) - 1:]
lags = np.arange(len(ac)); bpm = 60 * fps / np.maximum(lags, 1)
mask = (bpm > 70) & (bpm < 170)
cands = sorted([(ac[l], 60 * fps / l) for l in lags[mask]], reverse=True)
best = cands[0][1]
# refine around best with parabolic interpolation
l0 = int(round(60 * fps / best)); a, b, c = ac[l0 - 1], ac[l0], ac[l0 + 1]
lag = l0 + 0.5 * (a - c) / (a - 2 * b + c + 1e-9); tempo = 60 * fps / lag
period = lag / fps
phases = np.linspace(0, period, 200, endpoint=False)
score = [np.interp(np.arange(ph, dur, period) * fps, np.arange(len(flux)), flux).sum() for ph in phases]
phase = phases[int(np.argmax(score))]
beats = np.arange(phase, dur, period)
# beat-synchronous RMS and chroma
rms = np.sqrt((frames ** 2).mean(1))
freqs = np.fft.rfftfreq(N, 1 / SR)
pc = np.full(len(freqs), -1); ok = (freqs > 60) & (freqs < 4000)
pc[ok] = np.round(12 * np.log2(freqs[ok] / 440)).astype(int) % 12
chroma = np.stack([S[:, pc == k].sum(1) for k in range(12)], 1)
bi = (beats * fps).astype(int)
B = len(bi) - 1
bc = np.stack([chroma[bi[i]:bi[i + 1]].mean(0) for i in range(B)])
bc = bc / (np.linalg.norm(bc, axis=1, keepdims=True) + 1e-9)
br = np.array([rms[bi[i]:bi[i + 1]].mean() for i in range(B)])
ssm = bc @ bc.T
K = 16; g = np.outer(np.r_[-np.ones(K), np.ones(K)], np.r_[-np.ones(K), np.ones(K)]) * -1
g *= np.outer(np.hanning(2 * K), np.hanning(2 * K))
pad = np.pad(ssm, K, mode='edge')
nov = np.array([(pad[i:i + 2 * K, i:i + 2 * K] * g).sum() for i in range(B)])
nov = np.maximum(0, nov); nov /= nov.max() + 1e-9
peaks = [i for i in range(2, B - 2) if nov[i] == nov[max(0, i - 8):i + 9].max() and nov[i] > 0.25]
json.dump({'duration': dur, 'tempo': tempo, 'tempoCandidates': [round(c[1], 2) for c in cands[:8]], 'period': period, 'phase': phase,
           'beats': [round(float(b), 3) for b in beats], 'beatRms': [round(float(r), 4) for r in br],
           'boundaries': [{'beat': i, 't': round(float(beats[i]), 2), 'novelty': round(float(nov[i]), 2)} for i in peaks]}, open(out, 'w'), indent=1)
print(f'duration {dur:.2f}s tempo {tempo:.2f} BPM (candidates {[round(c[1],1) for c in cands[:6]]}) phase {phase:.3f}s beats {len(beats)}')
print('section boundaries (t, novelty):', [(round(float(beats[i]), 1), round(float(nov[i]), 2)) for i in peaks])
# loudness per 8 beats
for i in range(0, B, 8): print(f'{beats[i]:6.1f}s', '#' * int(60 * br[i:i + 8].mean() / br.max()))
