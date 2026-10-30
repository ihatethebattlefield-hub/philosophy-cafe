"""numpy-only synthesis toolkit shared by the score: oscillators, drums,
filters, reverb. No samples — every sound starts as a sine, saw or noise."""
import numpy as np

SR = 48000
DUR = 60.0
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


def bloop(f0, f1, dur=0.12):
    n = ns(dur)
    tt = tvec(n)
    f = f0 * (f1 / f0) ** np.clip(tt / (dur * 0.35), 0, 1)
    return fade(glide_sine(f) * np.exp(-tt / (dur * 0.35)))


def sidechain(x, times, depth=0.6, tau=0.13):
    """Duck x after every time in `times` (kick hits)."""
    g = np.ones(x.shape[-1])
    L = ns(0.4)
    tt = tvec(L)
    curve = 1 - depth * np.exp(-tt / tau) * np.minimum(1, tt / 0.004 + 0.3)
    for tk in times:
        i = ns(tk)
        n = min(L, len(g) - i)
        if n > 0:
            g[i:i + n] = np.minimum(g[i:i + n], curve[:n])
    return x * g
