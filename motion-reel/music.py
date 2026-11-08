"""Original score + sound design for the MOTION reel, synthesised from scratch with numpy.

No samples, no external audio: every drum, bass, pad, pluck and effect below is
built from sine/saw/noise generators, envelopes and FFT filters.

120 BPM, 4/4, one bar (2 s) per visual segment. Key: A minor.
Chords per bar: Am F C G | Am F C G | Am F C G | E  → silence → Am9 hit.
Sound effects are scheduled from the same constants as reel.js, so the ball
landings, letter ticks, easing glides, ripples and cuts line up with the frames.

    python3 music.py out/music.wav
"""
import sys
import wave
import numpy as np

SR = 48000
DUR = 30.0
N = int(SR * DUR)
BEAT = 0.5
BAR = 2.0
RNG = np.random.default_rng(2026)


# ------------------------------------------------------------------ basics
def tvec(n):
    return np.arange(n) / SR


def ns(sec):
    return int(round(sec * SR))


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


class Bus:
    def __init__(self):
        self.x = np.zeros((2, N))

    def add(self, sig, t, gain=1.0, pan=0.0):
        """Mix a mono (n,) or stereo (2, n) signal in at time t (seconds)."""
        i = ns(t)
        if sig.ndim == 1:
            a = (pan + 1) * np.pi / 4
            sig = np.vstack([sig * np.cos(a), sig * np.sin(a)]) * np.sqrt(2)
        if i < 0:
            sig, i = sig[:, -i:], 0
        n = min(sig.shape[1], N - i)
        if n > 0:
            self.x[:, i:i + n] += sig[:, :n] * gain


def fft_filter(x, lo=None, hi=None, order=2):
    n = len(x)
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(n, 1 / SR)
    Hf = np.ones_like(f)
    if hi:
        Hf /= np.sqrt(1 + (f / hi) ** (2 * order))
    if lo:
        Hf /= np.sqrt(1 + (lo / np.maximum(f, 1e-3)) ** (2 * order))
    return np.fft.irfft(X * Hf, n)


def noise(n):
    return RNG.standard_normal(n)


def env_ad(n, a, d):
    t = tvec(n)
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) / d)


def fade(sig, a=0.002, r=0.01):
    n = len(sig)
    e = np.ones(n)
    na, nr = min(n, ns(a)), min(n, ns(r))
    if na:
        e[:na] = np.linspace(0, 1, na)
    if nr:
        e[-nr:] *= np.linspace(1, 0, nr)
    return sig * e


def band_sweep(dur, f0, f1, q=0.6, shape=None):
    """Noise through a band-pass whose centre glides f0 → f1 (STFT overlap-add)."""
    n = ns(dur)
    win, hop = 1024, 256
    src = noise(n + win)
    w = np.hanning(win)
    out = np.zeros(n + win)
    freqs = np.maximum(np.fft.rfftfreq(win, 1 / SR), 1)
    for s in range(0, n, hop):
        u = s / max(n - 1, 1)
        fc = f0 * (f1 / f0) ** (shape(u) if shape else u)
        Hf = np.exp(-0.5 * (np.log2(freqs / fc) / q) ** 2)
        out[s:s + win] += np.fft.irfft(np.fft.rfft(src[s:s + win] * w) * Hf, win) * w
    out = out[:n]
    return out / (np.max(np.abs(out)) + 1e-9)


def saw(freq, n, fc, odd=False, kmax=60, phase=0.0):
    """Band-limited additive saw (or square with odd=True) with a 24 dB/oct
    low-pass at fc (scalar or per-sample array)."""
    t = tvec(n)
    fc = np.broadcast_to(np.asarray(fc, dtype=float), (n,))
    out = np.zeros(n)
    top = int(min(kmax, SR * 0.45 / freq))
    for k in range(1, top + 1):
        if odd and k % 2 == 0:
            continue
        a = (1 / k) / np.sqrt(1 + (k * freq / fc) ** 4)
        if a.max() < 2e-4:
            break
        out += a * np.sin(2 * np.pi * k * freq * t + phase * k)
    return out


def glide_sine(f, amp=None):
    """Sine with per-sample frequency array f."""
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph)
    return s * amp if amp is not None else s


# ------------------------------------------------------------- instruments
def kick(dur=0.42, f0=160, f1=46, pd=0.032, decay=0.2, drive=1.6, click=0.35):
    n = ns(dur)
    t = tvec(n)
    f = f1 + (f0 - f1) * np.exp(-t / pd)
    s = glide_sine(f) * np.exp(-t / decay)
    c = fft_filter(noise(n), lo=2500) * np.exp(-t / 0.004) * click
    return fade(np.tanh((s + c) * drive) / np.tanh(drive), 0.0005, 0.03)


def snare(dur=0.3, tone=190, bright=1.0):
    n = ns(dur)
    t = tvec(n)
    body = (np.sin(2 * np.pi * tone * t) + 0.5 * np.sin(2 * np.pi * tone * 1.7 * t)) * np.exp(-t / 0.05)
    nz = fft_filter(noise(n), lo=1200, hi=9000 * bright) * np.exp(-t / 0.11)
    return fade(0.55 * body + 0.9 * nz / (np.abs(nz).max() + 1e-9), 0.0005, 0.02)


def clap(dur=0.4):
    n = ns(dur)
    t = tvec(n)
    nz = fft_filter(noise(n), lo=900, hi=5000)
    nz /= np.abs(nz).max()
    e = np.zeros(n)
    for k, off in enumerate([0, 0.011, 0.022]):
        e += (t >= off) * np.exp(-np.maximum(0, t - off) / 0.007) * (0.8 + 0.1 * k)
    e += (t >= 0.033) * np.exp(-np.maximum(0, t - 0.033) / 0.14)
    return fade(nz * e, 0.0005, 0.03)


def hat(dur=0.06, decay=0.018, lo=7500):
    n = ns(dur)
    t = tvec(n)
    # 808-style metallic: six detuned squares + noise
    m = sum(np.sign(np.sin(2 * np.pi * f * t)) for f in [205.3, 304.4, 369.6, 522.7, 540.0, 800.0])
    s = fft_filter(0.6 * m + noise(n), lo=lo, hi=16000)
    s /= np.abs(s).max() + 1e-9
    return fade(s * np.exp(-t / decay), 0.0005, 0.005)


def crash(dur=3.0):
    n = ns(dur)
    t = tvec(n)
    s = fft_filter(noise(n), lo=3500, hi=15000)
    s /= np.abs(s).max()
    return s * (np.exp(-t / 0.9) * 0.8 + np.exp(-t / 0.08) * 0.6)


def marimba(m, dur=0.6, bright=1.0):
    n = ns(dur)
    t = tvec(n)
    f = mtof(m)
    s = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.28)
    s += 0.35 * bright * np.sin(2 * np.pi * f * 3.93 * t) * np.exp(-t / 0.035)
    s += 0.15 * bright * np.sin(2 * np.pi * f * 9.2 * t) * np.exp(-t / 0.012)
    return fade(s, 0.001, 0.02)


def bell(m, dur=1.2, index=2.5):
    """2-operator FM bell."""
    n = ns(dur)
    t = tvec(n)
    f = mtof(m)
    mod = index * np.exp(-t / 0.35) * np.sin(2 * np.pi * f * 3.5 * t)
    return fade(np.sin(2 * np.pi * f * t + mod) * np.exp(-t / 0.5), 0.001, 0.05)


def pluck(m, dur=0.22, cutoff=3500, decay=0.09):
    n = ns(dur)
    t = tvec(n)
    fc = 300 + cutoff * np.exp(-t / 0.05)
    s = saw(mtof(m), n, fc, odd=True, kmax=30)
    return fade(s * np.exp(-t / decay), 0.001, 0.02)


def bass_note(m, dur=0.22, cut=1600):
    n = ns(dur)
    t = tvec(n)
    fc = 160 + cut * np.exp(-t / 0.06)
    s = saw(mtof(m), n, fc) * 0.8 + 0.6 * np.sin(2 * np.pi * mtof(m) * t)
    return fade(np.tanh(s * 1.4) * env_ad(n, 0.003, 0.35), 0.002, 0.03)


def pad_chord(notes, dur, cutoff=1400, attack=0.25, release=0.4):
    n = ns(dur + release)
    t = tvec(n)
    L = np.zeros(n)
    R = np.zeros(n)
    for m in notes:
        for det, pan in [(-0.08, -0.7), (0.0, 0.0), (0.08, 0.7)]:
            v = saw(mtof(m + det), n, cutoff, kmax=24, phase=RNG.uniform(0, 6.28))
            L += v * (1 - pan) / 2
            R += v * (1 + pan) / 2
    e = np.minimum(1, t / attack) * np.where(t > dur, np.exp(-(t - dur) / (release / 3)), 1)
    st = np.vstack([L, R]) * e / (len(notes) * 1.5)
    return st


def chirp_drop(f0, f1, dur, decay):
    n = ns(dur)
    t = tvec(n)
    f = f1 + (f0 - f1) * np.exp(-t / (dur / 5))
    return fade(glide_sine(f) * np.exp(-t / decay), 0.001, 0.01)


def bitcrush(x, bits=5, hold=6):
    y = np.repeat(x[::hold], hold)[:len(x)]
    q = 2 ** (bits - 1)
    return np.round(y * q) / q


def reverb_ir(dur=2.4, decay=0.55, seed=11):
    r = np.random.default_rng(seed)
    n = ns(dur)
    t = tvec(n)
    ir = r.standard_normal((2, n)) * np.exp(-t / decay)
    ir[0] = fft_filter(ir[0], hi=7000, order=1)
    ir[1] = fft_filter(ir[1], hi=7000, order=1)
    ir[:, :ns(0.012)] = 0  # pre-delay
    return ir / np.sqrt(np.sum(ir ** 2) / 2)


def convolve(x, ir):
    size = 1 << int(np.ceil(np.log2(x.shape[1] + ir.shape[1])))
    out = np.fft.irfft(np.fft.rfft(x, size) * np.fft.rfft(ir, size), size)
    return out[:, :x.shape[1]]


# ------------------------------------------------------------ the timeline
AM, F, C, G, EM = [45, [57, 60, 64]], [41, [53, 57, 60]], [48, [55, 60, 64]], [43, [55, 59, 62]], [40, [52, 56, 59]]
CHORDS = [AM, F, C, G] * 3 + [EM]

drums, bass, music, sfx = Bus(), Bus(), Bus(), Bus()
send = Bus()  # reverb send
kick_times = []


def K(t, g=1.0, **kw):
    drums.add(kick(**kw), t, g)
    kick_times.append(t)


def add_send(sig, t, gain, pan=0.0, amount=0.3):
    sfx.add(sig, t, gain, pan)
    send.add(sig, t, gain * amount, pan)


# --- drums ---------------------------------------------------------------
for b in range(13):
    t0 = b * BAR
    beats = [t0 + k * BEAT for k in range(4)]
    if b == 0:  # the ball carries the rhythm: soft thump on each landing
        for tb in beats[1:]:
            K(tb, 0.45, f0=120, decay=0.12, click=0.1)
    elif b == 8:  # glitch bar: kick crushed, stuttering
        for k, tb in enumerate(beats):
            drums.add(bitcrush(kick(), 4, 8), tb, 0.85)
            kick_times.append(tb)
        for k in range(8):  # 32nd stutter snare into beat 4
            drums.add(bitcrush(snare(0.06), 3, 10), t0 + 1.25 + k * 0.03125, 0.25 + k * 0.05)
        for tb in [t0 + 0.5, t0 + 1.5]:
            drums.add(bitcrush(clap(), 4, 4), tb, 0.6)
    elif b == 11:  # harmonograph: half-time breathing room
        K(beats[0], 0.9)
        drums.add(clap(), beats[2], 0.55)
        send.add(clap(), beats[2], 0.25)
        for k in range(4):
            drums.add(hat(0.12, 0.05), beats[k] + 0.25, 0.14, pan=0.25)
    elif b == 12:  # supercut: kicks on 1-2-3, a snare on every cut, then nothing
        for tb in beats[:3]:
            K(tb, 1.0)
    else:
        for tb in beats:
            K(tb, 1.0)
        if b >= 3:
            for tb in [beats[1], beats[3]]:
                drums.add(clap(), tb, 0.6)
                send.add(clap(), tb, 0.18)
        if b >= 2:
            for k in range(4):
                drums.add(hat(0.12, 0.05), beats[k] + 0.25, 0.22, pan=0.25)
        if b in (5, 6, 7, 9, 10):
            for k in range(16):
                if k % 2 == 0:
                    drums.add(hat(), t0 + k * 0.125, 0.09 + 0.05 * (k % 4 == 2), pan=-0.3)

# supercut snare roll: one hit per cut, rising (mirrors RECAP_CUTS in reel.js)
RECAP_CUTS = [24, 24.25, 24.5, 24.625, 24.75, 24.875] + [25 + i / 12 for i in range(6)]
for i, tc in enumerate(RECAP_CUTS):
    drums.add(snare(0.18, tone=180 + i * 22, bright=1.0), tc, 0.35 + i * 0.04, pan=(-1) ** i * 0.3)
    send.add(snare(0.18, tone=180 + i * 22), tc, 0.12)

# --- bass ----------------------------------------------------------------
for b in range(1, 11):
    root = CHORDS[b][0]
    t0 = b * BAR
    if b == 8:
        for k in range(16):
            if k % 3 != 2:
                bass.add(bitcrush(bass_note(root + (12 if k % 4 == 3 else 0), 0.11), 6, 3), t0 + k * 0.125, 0.55)
        continue
    for k in range(8):
        m = root + (12 if k % 2 else 0)
        bass.add(bass_note(m, 0.2, cut=1200 + 300 * (k % 2)), t0 + k * 0.25, 0.55)
# harmonograph bar: sustained sub, recap: E pedal
for t0, m, d in [(22.0, 31, 1.95), (24.0, 28, 1.45)]:
    n = ns(d)
    tt = tvec(n)
    bass.add(fade(np.sin(2 * np.pi * mtof(m + 12) * tt) * np.minimum(1, tt / 0.05), 0.01, 0.06), t0, 0.5)

# --- pads ----------------------------------------------------------------
for b in range(13):
    root, ch = CHORDS[b]
    dur = 1.5 if b == 12 else BAR
    cutoff = 900 if b == 0 else 1300 + 100 * (b % 4)
    g = 0.22 if b == 0 else 0.3
    music.add(pad_chord(ch + [root + 12], dur, cutoff=cutoff, release=0.05 if b == 12 else 0.3), b * BAR, g)
    send.add(pad_chord(ch, dur, cutoff=cutoff, release=0.05 if b == 12 else 0.3), b * BAR, g * 0.4)

# --- arp -----------------------------------------------------------------
ARP = [0, 1, 2, 1, 0, 2, 1, 2]
for b in [4, 5, 6, 7, 9, 10]:
    root, ch = CHORDS[b]
    tones = [m + 12 for m in ch]
    for k in range(16):
        m = tones[ARP[k % 8]] + (12 if k in (6, 14) else 0)
        p = pluck(m, 0.2, cutoff=2500 + 1500 * (b >= 9))
        pan = 0.45 * np.sin(k * 0.9)
        music.add(p, b * BAR + k * 0.125, 0.16 + 0.04 * (k % 4 == 0), pan)
        send.add(p, b * BAR + k * 0.125, 0.06, pan)

# ------------------------------------------------------- scene sound design
# 01 ball: falling whistle, a marimba note on each landing (A4 C5 E5)
n = ns(0.47)
tt = tvec(n)
sfx.add(fade(glide_sine(1500 * (300 / 1500) ** (tt / 0.47) ** 2) * 0.18 * np.minimum(1, tt / 0.1)), 0.0)
for tl, m in [(0.5, 69), (1.0, 72), (1.5, 76)]:
    add_send(marimba(m), tl, 0.45, pan=-0.4 + tl * 0.4, amount=0.25)
# iris pop at 2.0
add_send(chirp_drop(1400, 180, 0.25, 0.08), 2.0, 0.4)
add_send(marimba(81, bright=1.4), 2.0, 0.35)

# 02 kinetic type: one tick per glyph (stagger constants match TYPO in reel.js)
TYPO = [('EVERY FRAME', 0.0, 0.025), ('IS A', 0.5, 0.05), ('FUNCTION', 1.0, 0.03), ('OF', 1.5, 0.06)]
for text, t0, st in TYPO:
    for i in range(len(text.replace(' ', ''))):
        ttk = 2.0 + t0 + i * st
        if t0 == 0.5:  # elastic pop
            add_send(chirp_drop(500 + 120 * i, 1600 + 200 * i, 0.08, 0.03) * 0.7, ttk, 0.3, pan=-0.3 + 0.3 * i)
        else:
            nn = ns(0.03)
            tk = fft_filter(noise(nn), lo=2500, hi=9000) * np.exp(-tvec(nn) / 0.004)
            tk += 0.3 * np.sin(2 * np.pi * (2500 + 400 * RNG.random()) * tvec(nn)) * np.exp(-tvec(nn) / 0.008)
            sfx.add(tk / 2, ttk, 0.35, pan=-0.6 + 1.2 * i / max(1, len(text) - 1))
# the italic "t" lands with weight
add_send(chirp_drop(300, 55, 0.5, 0.18), 3.66, 0.6, amount=0.2)
add_send(bell(76, 1.0), 3.66, 0.18, amount=0.5)

# 03 shape morph: a boing whose pitch follows outBack(2.4) on every beat
def out_back(x, s=2.4):
    return 1 + (s + 1) * (x - 1) ** 3 + s * (x - 1) ** 2


for k, m in enumerate([57, 60, 64, 67]):
    n = ns(0.45)
    tt = tvec(n)
    e = out_back(np.clip(tt / 0.34, 0, 1))
    f = mtof(m) * 2 ** (e - 1)
    add_send(fade(glide_sine(f) * np.exp(-tt / 0.18)), 4.0 + k * BEAT, 0.32, pan=(-0.5, 0.5, -0.2, 0.2)[k], amount=0.3)


# 04 easing editor: a sine that *plays* the curve — pitch = progress
EASE = [[0.65, 0, 0.35, 1], [0.34, 1.56, 0.64, 1], [0.7, 0, 0.84, 0], [0.68, -0.6, 0.32, 1.6]]
LINEAR = [0.33, 0.33, 0.67, 0.67]


def bez(a, b, s):
    u = 1 - s
    return 3 * u * u * s * a + 3 * u * s * s * b + s ** 3


def bez_solve(x1, x2, xv):
    lo, hi = np.zeros_like(xv), np.ones_like(xv)
    for _ in range(32):
        m = (lo + hi) / 2
        below = bez(x1, x2, m) < xv
        lo, hi = np.where(below, m, lo), np.where(below, hi, m)
    return (lo + hi) / 2


for k in range(4):
    n = ns(0.5)
    pk = tvec(n)
    frm, to = (LINEAR if k == 0 else EASE[k - 1]), EASE[k]
    mm = 1 - (1 - np.clip(pk / 0.18, 0, 1)) ** 3
    h = [frm[i] + (to[i] - frm[i]) * mm for i in range(4)]
    px = np.clip((pk - 0.06) / 0.38, 0, 1)
    py = bez(h[1], h[3], bez_solve(h[0], h[2], px))
    f = mtof(64) * 2 ** (1.0 * py)
    amp = np.clip((pk - 0.04) / 0.02, 0, 1) * np.clip((0.47 - pk) / 0.03, 0, 1)
    add_send(glide_sine(f, amp) * 0.8 + 0.2 * glide_sine(2 * f, amp), 6.0 + k * BEAT, 0.2, pan=-0.5 + 0.33 * k, amount=0.25)
    sfx.add(hat(0.03, 0.006, lo=4000), 6.0 + k * BEAT, 0.25)

# 05 particles: granular shimmer while they converge / re-form, a bell when they lock
for (a, b_, lock, m) in [(8.0, 8.5, 8.5, 81), (9.0, 9.45, 9.45, 84)]:
    for g in range(160):
        tg = a + (b_ - a) * RNG.random() ** 0.7
        u = (tg - a) / (b_ - a)
        fg = 2000 + 5000 * u + 800 * RNG.random()
        nn = ns(0.03)
        gr = np.sin(2 * np.pi * fg * tvec(nn)) * np.hanning(nn)
        sfx.add(gr, tg, 0.035 + 0.05 * u, pan=RNG.uniform(-0.9, 0.9))
        send.add(gr, tg, 0.03)
    add_send(bell(m, 1.4), lock, 0.22, amount=0.6)
    add_send(bell(m - 5, 1.4), lock, 0.12, amount=0.6)
# scatter at the end of the bar
add_send(band_sweep(0.3, 6000, 800, q=0.8) * np.linspace(0, 1, ns(0.3)), 9.88, 0.25)

# 06 point cloud: an airy swell for each morph
for k in range(1, 4):
    sw = band_sweep(0.32, 300, 2400, q=0.5) * np.hanning(ns(0.32))
    add_send(sw, 10.0 + k * BEAT, 0.25, pan=(-0.4, 0.4, 0)[k - 1], amount=0.5)
    sfx.add(chirp_drop(110, 55, 0.3, 0.12), 10.0 + k * BEAT, 0.3)

# 07 metaballs: water-drop bloops — big on the merge (beat), small in between
def bloop(f0, f1, dur=0.12):
    n = ns(dur)
    tt = tvec(n)
    f = f0 * (f1 / f0) ** np.clip(tt / (dur * 0.35), 0, 1)
    return fade(glide_sine(f) * np.exp(-tt / (dur * 0.35)))


for k in range(4):
    add_send(bloop(180, 900, 0.16), 12.0 + k * BEAT, 0.45, amount=0.35)
    for j in range(3):
        add_send(bloop(400 + 300 * RNG.random(), 1800 + 600 * RNG.random(), 0.07), 12.0 + k * BEAT + 0.12 + j * 0.11, 0.15, pan=RNG.uniform(-0.8, 0.8))

# 08 swiss grid: one woodblock/bell per ripple source (sources from reel.js SW_SRC)
for k, (tb, m) in enumerate([(0.0, 69), (0.5, 76), (1.0, 72), (1.5, 79)]):
    add_send(marimba(m, bright=1.6), 14.0 + tb, 0.4, pan=(-0.6, 0.6, 0, 0.6)[k], amount=0.3)
    add_send(bell(m + 12, 0.8, 1.2), 14.0 + tb, 0.08, amount=0.5)

# 09 glitch: 8-bit bleeps at the visual glitch rate (15 steps/s), gated by the same intensity curve
for st in range(30):
    lt = st / 15
    phb, phh = lt % BEAT, (lt + 0.25) % BEAT
    I = min(1, 0.15 + 0.85 * np.exp(-phb * 9) + 0.45 * np.exp(-phh * 14))
    if RNG.random() < I * 0.9:
        nn = ns(1 / 15)
        tt = tvec(nn)
        f = RNG.choice([220, 330, 440, 660, 880, 1320, 1760]) * (1 + 0.5 * (RNG.random() < 0.3))
        sq = np.sign(np.sin(2 * np.pi * f * tt)) * np.exp(-tt / 0.03)
        if RNG.random() < 0.4:
            sq = bitcrush(noise(nn) * np.exp(-tt / 0.02), 3, 12)
        sfx.add(fade(sq, 0.001, 0.005), 16.0 + lt, 0.12 * I, pan=RNG.uniform(-1, 1))
for k in (1, 3):  # the inverted frames
    sfx.add(bitcrush(chirp_drop(2000, 60, 0.2, 0.08), 4, 6), 16.0 + k * BEAT, 0.35)

# 10 infinite zoom: a Shepard tone — it rises forever and never arrives
n = ns(2.0)
tt = tvec(n)
shep = np.zeros(n)
for o in range(7):
    pos = (o + tt / 2.0 * 1.5) % 7  # octave position, 1.5 octaves over the bar
    fq = 55 * 2 ** pos
    amp = np.exp(-0.5 * ((pos - 3.5) / 1.3) ** 2)
    shep += glide_sine(fq, amp)
shep *= np.minimum(1, tt / 0.1) * np.minimum(1, (2.0 - tt) / 0.05)
music.add(shep / 3, 18.0, 0.25)
send.add(shep / 3, 18.0, 0.1)
for k in range(4):
    add_send(band_sweep(0.32, 400, 5000, q=0.7) * np.hanning(ns(0.32)), 18.0 + k * BEAT, 0.18, amount=0.3)

# 11 isometric city: rising pentatonic blips as the skyline grows, a thoom per pulse
PENTA = [69, 72, 74, 76, 79, 81, 84, 86, 88, 91]
for i, m in enumerate(PENTA):
    add_send(pluck(m - 12, 0.15, cutoff=4000, decay=0.05), 20.0 + i * 0.035, 0.18, pan=-0.7 + 0.15 * i)
for tb in (0.5, 1.0, 1.5):
    sfx.add(chirp_drop(90, 40, 0.5, 0.2), 20.0 + tb, 0.35)

# 12 harmonograph: the figure as sound — left = x(s) partials, right = y(s) partials
# x ∝ sin(2.01s) + sin(3s), y ∝ sin(3s) + sin(2s), base 98 Hz → G3/D4 over the G chord
n = ns(2.0)
tt = tvec(n)
lt = tt
prog = (-(np.cos(np.pi * np.clip(lt / 1.9, 0, 1)) - 1) / 2) * 0.94 + np.clip(lt / 1.9, 0, 1) * 0.06
damp = np.exp(-0.0042 * prog * 300)
env = np.minimum(1, tt / 0.08) * np.minimum(1, (2.0 - tt) / 0.05) * (0.4 + 0.6 * damp)
xs = (np.sin(2 * np.pi * 98 * 2.01 * tt) + 0.53 * np.sin(2 * np.pi * 98 * 3 * tt + 1.6)) * env
ys = (np.sin(2 * np.pi * 98 * 3 * tt + 0.8) + 0.53 * np.sin(2 * np.pi * 98 * 2 * tt)) * env
harm = np.vstack([xs, ys])
music.add(harm, 22.0, 0.2)
send.add(harm, 22.0, 0.12)
for k in range(4):  # pen pulse on each beat
    add_send(bell(79 + (0, 2, 4, 7)[k], 0.6, 1.0), 22.0 + k * BEAT, 0.08, amount=0.6)

# 13 supercut riser
rs = band_sweep(1.5, 300, 9000, q=0.6, shape=lambda u: u ** 1.5) * np.linspace(0, 1, ns(1.5)) ** 2
sfx.add(rs, 24.0, 0.3)
n = ns(1.5)
tt = tvec(n)
sfx.add(glide_sine(110 * 2 ** (tt / 1.5 * 2), np.linspace(0, 1, n) ** 2), 24.0, 0.12)

# ------------------------------------------------------- transition effects
# 2.0 iris pop (above) | 4.0 whoosh
add_send(band_sweep(0.3, 300, 6000, q=0.7, shape=lambda u: np.sin(np.pi * u / 2)) * np.hanning(ns(0.3)), 3.85, 0.4, amount=0.2)
# 6.0 barn doors: two slides, hard L and R
for p in (-0.9, 0.9):
    add_send(band_sweep(0.26, 3000, 400, q=0.8) * env_ad(ns(0.26), 0.01, 0.1), 6.0, 0.3, pan=p, amount=0.2)
# 8.0 pixelate: an 8-bit arpeggio down then up
for i in range(12):
    m = [93, 88, 84, 81, 76, 72, 72, 76, 81, 84, 88, 93][i]
    nn = ns(0.034)
    sq = np.sign(np.sin(2 * np.pi * mtof(m) * tvec(nn))) * 0.5
    sfx.add(fade(bitcrush(sq, 4, 4), 0.001, 0.004), 7.8 + i * 0.4 / 12, 0.1)
# 10.0 blinds: 12 clicks sweeping left → right, one per slat
for k in range(12):
    nn = ns(0.02)
    c = fft_filter(noise(nn), lo=1500, hi=7000) * np.exp(-tvec(nn) / 0.003)
    sfx.add(c, 10.0 + k * 0.035 * 0.3, 0.3, pan=-0.9 + 1.8 * k / 11)
# 12.0 clock wipe: a zip that circles the stereo field
n = ns(0.3)
tt = tvec(n)
z = glide_sine(500 * 2 ** (tt / 0.3 * 2), np.hanning(n))
ang = tt / 0.3 * np.pi * 2
sfx.add(np.vstack([z * (0.5 + 0.5 * np.cos(ang)), z * (0.5 - 0.5 * np.cos(ang))]), 12.0, 0.18)
# 14.0 liquid drip
add_send(bloop(120, 500, 0.3), 14.0, 0.45, amount=0.4)
for j in range(5):
    add_send(bloop(800 + 200 * j, 2500, 0.05), 14.05 + j * 0.05, 0.12, pan=RNG.uniform(-0.8, 0.8))
# 16.0 tile flip cascade (17 diagonals, 0.04 × 0.36 s apart)
for d in range(17):
    nn = ns(0.025)
    c = np.sin(2 * np.pi * (1200 + 80 * d) * tvec(nn)) * np.exp(-tvec(nn) / 0.005)
    sfx.add(c, 16.0 + d * 0.0144, 0.18, pan=-0.8 + 1.6 * d / 16)
# 18.0 CRT: power-off zwoop, then a thump as the next picture opens
n = ns(0.2)
tt = tvec(n)
zw = glide_sine(1800 * (40 / 1800) ** (tt / 0.2)) * (1 + 0.3 * np.sign(np.sin(2 * np.pi * 50 * tt)))
sfx.add(fade(zw * 0.5, 0.005, 0.01), 17.8, 0.3)
add_send(chirp_drop(140, 40, 0.3, 0.1), 18.0, 0.5)
sfx.add(fft_filter(noise(ns(0.17)), lo=3000) * np.linspace(0.5, 0, ns(0.17)), 18.0, 0.12)
# 20.0 card flip: fwip-fwip
for tt0, a, b_ in [(19.86, 800, 4000), (20.0, 4000, 700)]:
    add_send(band_sweep(0.14, a, b_, q=0.6) * np.hanning(ns(0.14)), tt0, 0.35, amount=0.15)
# 22.0 line wipe: laser
add_send(chirp_drop(4000, 300, 0.28, 0.12) * 0.8, 22.0, 0.3, pan=0.3)
# 24.0 spin: reverse cymbal into the downbeat
rc = crash(0.25)[::-1] * np.linspace(0, 1, ns(0.25)) ** 2
sfx.add(rc, 23.75, 0.45)

# ------------------------------------------------------------------- mixdown
def sidechain(x, depth=0.6, tau=0.13):
    g = np.ones(N)
    L = ns(0.4)
    tt = tvec(L)
    curve = 1 - depth * np.exp(-tt / tau) * np.minimum(1, tt / 0.004 + 0.3)
    for tk in kick_times:
        i = ns(tk)
        n = min(L, N - i)
        g[i:i + n] = np.minimum(g[i:i + n], curve[:n])
    return x * g


bass.x = sidechain(bass.x, 0.55)
music.x = sidechain(music.x, 0.45)
send.x = sidechain(send.x, 0.3)

mix = drums.x * 0.55 + bass.x * 0.75 + music.x * 1.25 + sfx.x * 1.0
mix += convolve(send.x, reverb_ir()) * 0.35

# one beat of real silence before the drop
s0, s1 = ns(25.5), ns(26.0)
mix[:, s0 - ns(0.004):s0] *= np.linspace(1, 0, ns(0.004))
mix[:, s0:s1] = 0
mix[:, s1:] = 0

# ---------------------------------------------------- 26.0 the hit + outro
hit = Bus()
hsend = Bus()
n = ns(3.5)
tt = tvec(n)
boom = glide_sine(36 + 180 * np.exp(-tt / 0.05)) * np.exp(-tt / 1.1)
hit.add(np.tanh(boom * 2.2) * 0.9, 26.0, 1.0)
hit.add(kick(0.6, f0=220, f1=45, decay=0.3, drive=3), 26.0, 0.6)
hit.add(crash(3.5), 26.0, 0.35)
hsend.add(crash(3.5), 26.0, 0.25)
nz = fft_filter(noise(ns(0.3)), lo=200, hi=6000) * np.exp(-tvec(ns(0.3)) / 0.06)
hit.add(nz / np.abs(nz).max(), 26.0, 0.5)
AM9 = [45, 52, 55, 59, 60, 64, 71]
nn = ns(4.0)
tt = tvec(nn)
for m in AM9:
    for det, pan in [(-0.1, -0.6), (0.1, 0.6)]:
        v = saw(mtof(m + det), nn, 600 + 3500 * np.exp(-tt / 0.6), kmax=30, phase=RNG.uniform(0, 6.28))
        v *= np.exp(-tt / 1.6) * np.minimum(1, tt / 0.005)
        hit.add(v / len(AM9), 26.0, 0.55, pan)
        hsend.add(v / len(AM9), 26.0, 0.4, pan)
hit.add(np.sin(2 * np.pi * mtof(33) * tt) * np.exp(-tt / 1.5) * np.minimum(1, tt / 0.01), 26.0, 0.45)
# the full stop settles: ticks on its little bounces (LOGO_HITS in reel.js)
for th, amt in [(0.5, 0.3), (0.75, 0.16), (0.875, 0.06)]:
    hit.add(marimba(81, 0.5, 1.2), 26.0 + th, 0.6 * amt / 0.3)
    hsend.add(marimba(81, 0.5), 26.0 + th, 0.2 * amt / 0.3)
# subtitle shimmer and rule
for i in range(14):
    hit.add(bell(88 + (0, 3, 7, 10, 12)[i % 5], 0.5, 0.8), 27.0 + i * 0.03, 0.025, pan=-0.7 + 0.1 * i)
hsend.add(bell(76, 2.0, 1.0), 27.5, 0.12)
hit.add(bell(76, 2.0, 1.0), 27.5, 0.08)
hit.add(band_sweep(0.5, 2000, 8000, q=0.8) * np.hanning(ns(0.5)), 27.4, 0.06)
# a quiet bed under the logo
hit.add(pad_chord([57, 64, 67, 71], 3.0, cutoff=900, attack=0.8, release=0.8), 26.4, 0.18)

outro = hit.x + convolve(hsend.x, reverb_ir(3.0, 0.9, seed=3)) * 0.5
outro[:, :s1] = 0
# level the groove to a fixed pre-limiter peak, then let the hit sit ~4 dB hotter
mix *= 0.75 / np.percentile(np.abs(mix[:, :s0]), 99.95)
outro *= 1.2 / np.max(np.abs(outro))
mix += outro

# master: gentle glue, fade the tail, normalise
fo0, fo1 = ns(28.8), N
mix[:, fo0:fo1] *= np.linspace(1, 0, fo1 - fo0) ** 1.5
mix = np.tanh(mix)
mix *= 0.93 / np.max(np.abs(mix))

if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else 'out/music.wav'
    pcm = (np.clip(mix.T, -1, 1) * 32767).astype('<i2')
    with wave.open(out, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    rms = lambda a: 20 * np.log10(np.sqrt(np.mean(a ** 2)) + 1e-12)
    print(f'wrote {out}: {DUR:.0f}s, peak -> 0.93, '
          f'rms {rms(mix):.1f} dBFS, silent beat rms {rms(mix[:, s0:s1]):.1f} dBFS')
    for name, bus in [('drums', drums), ('bass', bass), ('music', music), ('sfx', sfx)]:
        print(f'  {name:6s} rms {rms(bus.x):.1f} dBFS')
