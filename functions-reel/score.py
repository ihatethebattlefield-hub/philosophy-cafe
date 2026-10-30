"""FUNCTIONS IN MOTION — original score and sound design, numpy only.

Every event time is read from timeline.js (the renderer's own timeline), and the
sounds follow the mathematics on screen:
  ball contact      → short pitched knock
  graph stretching  → continuous pitch glides (b compresses x ↔ raises frequency)
  inverse           → a motif, then its mirror image with left/right swapped
  1/x               → a tone that climbs toward the asymptote
  derivative        → two tones converge as h → 0 (their beating slows to nothing),
                      then a lead whose pitch is the slope f′(x)
  integral          → one note per rectangle; each halving of Δx doubles the notes
  composition       → input / process / output, three linked sounds
  particles         → granular cloud whose pitch spread narrows as they converge
  heart             → warm chord and a soft double pulse
  logo              → sub-bass hit plus a bright transient

    python3 score.py out/score.wav
"""
import json
import os
import sys
import wave

import numpy as np

from synth import (SR, N, Bus, ns, tvec, mtof, noise, fade, env_ad, fft_filter, band_sweep, saw, glide_sine,
                   kick, snare, clap, hat, crash, marimba, bell, pluck, bass_note, pad_chord, chirp_drop,
                   bitcrush, reverb_ir, convolve, bloop, sidechain)

HERE = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(HERE, 'timeline.js'), encoding='utf-8').read()
TL = json.loads(src[src.index('{'):src.rindex('}') + 1])
RNG = np.random.default_rng(60)
BEAT, BAR = 0.5, 2.0


# ------------------------------------------------------- easing (as core.js)
def clamp(v, a=0.0, b=1.0):
    return np.minimum(b, np.maximum(a, v))


def inv(a, b, v):
    return clamp((np.asarray(v, float) - a) / (b - a))


def in_out_cubic(x):
    x = np.asarray(x, float)
    return np.where(x < 0.5, 4 * x ** 3, 1 - (-2 * x + 2) ** 3 / 2)


def in_out_sine(x):
    return -(np.cos(np.pi * np.asarray(x, float)) - 1) / 2


def out_cubic(x):
    return 1 - (1 - np.asarray(x, float)) ** 3


def in_cubic(x):
    return np.asarray(x, float) ** 3


def soft_ease(u):
    return 0.65 * in_out_sine(u) + 0.35 * np.asarray(u, float)


def kf(t, keys, ease=in_out_cubic):
    t = np.asarray(t, float)
    out = np.full(t.shape, float(keys[0][1]))
    for (t0, v0), (t1, v1) in zip(keys[:-1], keys[1:]):
        m = (t > t0) & (t <= t1)
        out[m] = v0 + (v1 - v0) * ease((t[m] - t0) / (t1 - t0))
    out[t > keys[-1][0]] = keys[-1][1]
    return out


def seg(t0, t1):
    """Absolute time vector for [t0, t1)."""
    return t0 + tvec(ns(t1 - t0))


def glide_saw(f, nh=10, bright=1.0):
    """Band-limited saw with a per-sample frequency array."""
    ph = 2 * np.pi * np.cumsum(f) / SR
    out = np.zeros_like(f)
    for k in range(1, nh + 1):
        a = (1 / k) * (bright ** (k - 1)) * (k * f < SR * 0.45)
        out += a * np.sin(k * ph)
    return out


# ---------------------------------------------------------------- harmony
D, F_, G_, A_, Bb, C_ = 38, 41, 43, 45, 46, 48
CH = {
    'Dm': (38, [50, 53, 57, 62]), 'Bb': (34, [50, 53, 58, 62]), 'F': (41, [48, 53, 57, 60]), 'C': (36, [48, 52, 55, 60]),
    'Gm': (43, [50, 55, 58, 62]), 'A': (45, [49, 52, 57, 61]), 'Bbmaj7': (34, [46, 50, 53, 57]), 'C6': (36, [48, 52, 55, 57]),
    'Dm9': (38, [50, 53, 57, 64]),
}
BARS = ['Dm', 'Dm', 'Bb', 'F', 'C', 'Dm', 'Bb', 'F', 'C', 'Dm', 'Bb', 'Gm', 'Dm', 'Bb', 'C',
        'F', 'C', 'Dm', 'Bb', 'C', 'Dm', 'Bb', 'F', 'C', 'Bbmaj7', 'C6', 'Dm9', 'Bbmaj7', 'A', 'A']
assert len(BARS) == 30


def chord_at(t):
    return CH[BARS[min(29, int(t // BAR))]]


def scale_note(t, degree, octave=5):
    """A chord tone (cycling upward) for melodic lines that follow the harmony."""
    _, tones = chord_at(t)
    pcs = sorted(set(m % 12 for m in tones))
    k = int(np.floor(degree))
    return 12 * (octave + k // len(pcs)) + pcs[k % len(pcs)]


drums, bass, music, sfx, send = Bus(), Bus(), Bus(), Bus(), Bus()
kicks = []


def K(t, g=1.0, **kw):
    drums.add(kick(**kw), t, g)
    kicks.append(t)


def S(sig, t, gain, pan=0.0, rev=0.25):
    sfx.add(sig, t, gain, pan)
    if rev:
        send.add(sig, t, gain * rev, pan)


# ================================================================ drums
for b in range(29):
    t0 = b * BAR
    beats = [t0 + k * BEAT for k in range(4)]
    if b == 0:
        continue
    if b in (1, 2):                                  # basic functions: half-time, sparse
        K(beats[0], 0.8); K(beats[2], 0.7)
        for k in range(4):
            drums.add(hat(0.08, 0.03), beats[k] + 0.25, 0.1, pan=0.3)
    elif b in (20, 21):                              # trig: light, rim clicks
        K(beats[0], 0.8); K(beats[2], 0.75)
        for k in range(4):
            drums.add(hat(0.05, 0.012, lo=3000), beats[k] + 0.25, 0.12, pan=-0.3)
    elif b in (24, 25):                              # the heart: a slow heartbeat
        for tb in (beats[0], beats[2]):
            K(tb, 0.75, f0=110, decay=0.18); K(tb + 0.17, 0.45, f0=95, decay=0.15)
        for k in range(8):
            drums.add(hat(0.05, 0.015), t0 + k * 0.25 + 0.125, 0.05, pan=0.4)
    elif b == 28:                                    # recap: kicks on the first three beats
        for tb in beats[:3]:
            K(tb, 1.0)
    else:
        for tb in beats:
            K(tb, 0.95)
        if b >= 4:
            for tb in (beats[1], beats[3]):
                drums.add(clap(), tb, 0.42); send.add(clap(), tb, 0.12)
        for k in range(4):
            drums.add(hat(0.1, 0.04), beats[k] + 0.25, 0.14, pan=0.25)
        if b in range(9, 15) or b in range(22, 24) or b in (26, 27):
            for k in range(16):
                if k % 2 == 1:
                    drums.add(hat(), t0 + k * 0.125, 0.05 + 0.03 * (k % 4 == 3), pan=-0.35)
        if b in (26, 27):                            # build into the recap
            for k in range(8 if b == 26 else 16):
                tt = t0 + (k * 0.25 if b == 26 else k * 0.125)
                drums.add(snare(0.12, 200 + 6 * k), tt, 0.06 + 0.012 * k, pan=0.2)

# recap: one snare per cut, glitch stutter on each
for i, (tc, _, _) in enumerate(TL['recap']['cuts']):
    drums.add(snare(0.14, 190 + 18 * i), tc, 0.3 + 0.03 * i, pan=(-1) ** i * 0.3)
    drums.add(bitcrush(snare(0.05), 3, 9), tc + 0.0625, 0.12, pan=-(-1) ** i * 0.4)
K(56.0, 1.0)

# ================================================================= bass
for b in range(1, 28):
    root, _ = CH[BARS[b]]
    t0 = b * BAR
    if b in (1, 2):
        for k in range(4):
            bass.add(bass_note(root, 0.4, cut=700), t0 + k * BEAT, 0.42)
    elif b in (24, 25, 26, 27):                      # heart and morph: long, warm
        n = ns(1.95)
        tt = tvec(n)
        bass.add(fade(np.sin(2 * np.pi * mtof(root + 12) * tt) * np.minimum(1, tt / 0.04) * np.exp(-tt / 3), 0.01, 0.1), t0, 0.5)
        if b >= 26:
            for k in range(8):
                bass.add(bass_note(root + (12 if k % 2 else 0), 0.18, cut=900), t0 + k * 0.25, 0.25)
    elif b in (20, 21):
        for k in range(4):
            bass.add(bass_note(root, 0.3, cut=500), t0 + k * BEAT, 0.4)
    else:
        for k in range(8):
            m = root + (12 if k % 2 else 0) + (7 if (b % 4 == 3 and k == 7) else 0)
            bass.add(bass_note(m, 0.2, cut=1000 + 250 * (k % 2)), t0 + k * 0.25, 0.45)
# FTC: the bass line walks the shape of F(x) (30.5–32.0)
for k in range(12):
    tt = 30.5 + k * 0.125
    xv = 2 * in_out_sine(inv(30.5, 32.0, tt))
    Fv = xv ** 3 / 3 - xv
    bass.add(bass_note(int(round(D + 7 * Fv / 0.667)) + 12, 0.12, cut=1800), tt, 0.25)

# ================================================================= pads
for b in range(29):
    root, tones = CH[BARS[b]]
    dur = 1.5 if b == 28 else BAR
    g = 0.14 if b == 0 else 0.22 if b < 9 else 0.26
    cut = 900 if b < 3 else 1200 + 120 * (b % 3) if b < 24 else 1600
    music.add(pad_chord(tones, dur, cutoff=cut, attack=0.6 if b == 0 else 0.2, release=0.05 if b == 28 else 0.35), b * BAR, g)
    send.add(pad_chord(tones[:3], dur, cutoff=cut, release=0.05 if b == 28 else 0.35), b * BAR, g * 0.45)

# ========================================================= scene sound
# --- 00 origin: the line appears, the ball falls and knocks, the wave rings out
S(band_sweep(0.35, 300, 3000, q=0.9) * np.linspace(0, 1, ns(0.35)) * 0.4, 0.0, 0.18)
n = ns(0.47)
tt = tvec(n)
S(fade(glide_sine(1400 * (330 / 1400) ** ((tt / 0.47) ** 2)) * np.minimum(1, tt / 0.1)), 0.0, 0.09)
for (ti, amt), m in zip(TL['origin']['impacts'], (74, 69)):
    S(marimba(m, 0.6, 1.4), ti, 0.55 * amt / 0.45 + 0.1)
    S(kick(0.3, f0=120, f1=50, decay=0.1, click=0.05), ti, 0.35 * amt / 0.45)
    n = ns(1.2)                                           # the line's damped wave as a tremolo tone
    tt = tvec(n)
    S(np.sin(2 * np.pi * mtof(62) * tt) * np.exp(-tt * 3.4) * (0.6 + 0.4 * np.sin(2 * np.pi * 5 * tt)), ti, 0.12 * amt / 0.45, rev=0.6)
t = seg(1.5, 2.0)                                         # rolling up y = x
S(glide_sine(mtof(62) * 2 ** (2 * in_out_sine(inv(1.5, 2.0, t))), inv(1.5, 1.6, t) * 0.5), 1.5, 0.12)
S(band_sweep(0.45, 400, 7000, q=0.7, shape=lambda u: u ** 2) * np.linspace(0, 1, ns(0.45)) ** 2, 1.58, 0.3, rev=0.1)
S(chirp_drop(160, 45, 0.5, 0.2), 2.0, 0.4)

# --- 02 basic functions: one glide per arrival, shaped like the new graph
SHAPES = {'x2': lambda u: u ** 2, 'x3': lambda u: 4 * (u - 0.5) ** 3 + 0.5, 'abs': lambda u: np.abs(2 * u - 1),
          'sqrt': lambda u: np.sqrt(u)}
for ta, key in TL['basic']['arrive'][1:]:
    t = seg(ta - TL['basic']['morph'], ta + 0.25)
    u = inv(ta - TL['basic']['morph'], ta, t)
    f = mtof(62) * 2 ** (1.0 * SHAPES[key](u))
    S(glide_saw(f, 6, 0.6) * env_ad(len(t), 0.03, 0.25), ta - TL['basic']['morph'], 0.12, pan=0.2)
    S(marimba(scale_note(ta, 2, 5), 0.5, 1.2), ta, 0.35)
S(band_sweep(0.5, 2000, 9000, q=0.8) * np.hanning(ns(0.5)), 5.75, 0.08)   # the general formula types in

# --- 06 transformations: a tone that *is* the parameters
TR = TL['transform']
t = seg(6.4, 9.75)
P = {'a': np.ones_like(t), 'b': np.ones_like(t), 'h': np.zeros_like(t), 'k': np.zeros_like(t)}
for name, ts, v0, v1 in TR['steps']:
    s = 1 + 2.3 * (np.clip((t - ts) / TR['dur'], 0, 1) - 1) ** 3 + 1.3 * (np.clip((t - ts) / TR['dur'], 0, 1) - 1) ** 2
    P[name] = np.where(t >= ts, v0 + (v1 - v0) * s, P[name])
# k lifts the pitch, a stretches it (negative a mirrors it below), b multiplies the frequency
# exactly as it multiplies x; h moves the sound across the stereo field
f = mtof(57) * 2 ** (P['k'] * 0.5) * np.abs(P['b']) * 2 ** (0.35 * (P['a'] - 1))
pan = np.clip(P['h'] / 2.5, -1, 1)
tone = glide_saw(f, 8, 0.55)
env = inv(6.4, 6.6, t) * (1 - inv(9.5, 9.75, t))
sfx.add(np.vstack([tone * env * np.cos((pan + 1) * np.pi / 4), tone * env * np.sin((pan + 1) * np.pi / 4)]) * np.sqrt(2), 6.4, 0.07)
for name, ts, v0, v1 in TR['steps']:
    S(marimba(scale_note(ts, {'h': 0, 'k': 1, 'a': 2, 'b': 3}[name], 5), 0.4), ts, 0.28)
S(band_sweep(0.35, 1500, 8000, q=0.7) * np.hanning(ns(0.35)), 6.1, 0.12)       # the h glyph flies to the handle

# --- 09.75 fold: a page turning across the stereo field
t = seg(9.75, 10.25)
fl = band_sweep(0.5, 600, 4000, q=0.6, shape=lambda u: np.sin(np.pi * u)) * np.hanning(ns(0.5))
ang = np.pi * in_out_cubic(inv(9.75, 10.25, t))
sfx.add(np.vstack([fl * np.cos(ang / 2), fl * np.sin(ang / 2)]) * 0.3, 9.75)

# --- 10 inverse: the motif of 2^x, then its mirror; channels swap with the flip
IV = TL['inverse']
motif = [62, 64, 67, 71, 74]                     # rising like 2^x
for i, m in enumerate(motif):
    S(pluck(m + 12, 0.35, 3000, 0.15), IV['draw'][0] + i * 0.12, 0.2, pan=-0.6)
mirror = [2 * 67 - m for m in motif]             # reflected about the middle note
for i, m in enumerate(mirror):
    S(pluck(m + 12, 0.35, 3000, 0.15), IV['flip'][1] + i * 0.08, 0.2, pan=0.6)
t = seg(IV['flip'][0], IV['flip'][1])
ang = np.pi * in_out_cubic(inv(IV['flip'][0], IV['flip'][1], t))
tn = glide_sine(np.full(len(t), mtof(74))) * np.sin(np.pi * inv(IV['flip'][0], IV['flip'][1], t)) ** 0.5
sfx.add(np.vstack([tn * np.cos(ang / 2), tn * np.sin(ang / 2)]) * 0.12, IV['flip'][0])     # L → R
S(marimba(74, 0.5), IV['draw'][1], 0.45, pan=-0.3)          # ball reaches (1, 2)
S(marimba(69, 0.5), IV['flip'][1], 0.45, pan=0.3)           # lands at (2, 1)
S(marimba(74, 0.4), IV['swap'], 0.3, pan=0.7); S(marimba(69, 0.4), IV['swap'], 0.3, pan=-0.7)
t = seg(13.6, 14.0)
S(glide_sine(2000 * (300 / 2000) ** inv(13.6, 14.0, t), np.hanning(len(t))), 13.6, 0.08)

# --- 14 reciprocal: pitch follows 1/x and climbs toward the asymptote
RC = TL['reciprocal']
S(chirp_drop(900, 300, 0.4, 0.15), RC['drop'][0], 0.18)
t = seg(RC['keys'][0][0], RC['hop'][0])
xv = kf(t, RC['keys'])
f = 330 * np.clip(1 / xv, 0.2, 6) ** 0.85
S(glide_sine(f, inv(14.9, 15.05, t) * (1 - inv(15.9, 16.0, t))), RC['keys'][0][0], 0.14, pan=0.4)
S(bitcrush(noise(ns(0.06)) * np.exp(-tvec(ns(0.06)) / 0.02), 3, 10), 15.97, 0.12)           # 1/0: undefined
S(band_sweep(0.3, 5000, 400, q=0.7) * np.hanning(ns(0.3)), RC['hop'][0], 0.16)              # the leap
t = seg(RC['hop'][1], RC['shoot'][0])
xv = kf(t, RC['neg'])
S(glide_sine(110 * np.clip(-1 / xv, 0.2, 6) ** 0.85, inv(16.3, 16.4, t) * (1 - inv(17.4, 17.6, t))), RC['hop'][1], 0.16, pan=0.4)
S(marimba(69, 0.4), RC['compare'], 0.25, pan=-0.5); S(marimba(65, 0.4), RC['compare'] + 0.12, 0.25, pan=0.5)
S(band_sweep(0.45, 300, 8000, q=0.6, shape=lambda u: u ** 2) * np.linspace(0, 1, ns(0.45)) ** 2, RC['shoot'][0], 0.35, rev=0.1)
S(chirp_drop(200, 45, 0.45, 0.18), 18.0, 0.5)
S(marimba(62, 0.5, 1.5), 18.3, 0.4)                                                          # lands on the curve

# --- 18 derivative: h → 0 heard as two tones whose beating slows to nothing
DV = TL['derivative']
fD = lambda v: v ** 3 - 3 * v
fpD = lambda v: 3 * v ** 2 - 3
S(marimba(69, 0.4), DV['q'], 0.3, pan=0.4)
S(band_sweep(0.3, 800, 3000, q=0.8) * np.hanning(ns(0.3)), DV['secant'], 0.12)
t = seg(DV['q'], DV['fprime'])
h = np.where(t < DV['shrink'][0], 1.0, 2.0 ** (-10 * in_out_sine(inv(DV['shrink'][0], DV['shrink'][1], t))))
base = mtof(62)
tone2 = glide_sine(np.full(len(t), base)) + glide_sine(base * 2 ** (h * 7 / 12))
env = inv(DV['q'], DV['q'] + 0.2, t) * (1 - inv(DV['fprime'] - 0.15, DV['fprime'], t))
S(tone2 * env * 0.5, DV['q'], 0.13, pan=-0.1)
S(bell(74, 1.2, 1.4), DV['lim'], 0.18, rev=0.6)
# tangent stage: a lead whose pitch is the slope and whose brightness its sign
t = seg(DV['fprime'], 23.9)
K0 = DV['trace']
xv = np.where(t < K0[1][0], kf(t, K0[:2]), kf(t, K0[1:], soft_ease))
m = fpD(xv)
f = mtof(64) * 2 ** (m / 7.5)
bright = np.where(m >= 0, 0.75, 0.35)
lead = glide_saw(f, 8, 0.6) * (m >= 0) + glide_saw(f, 8, 0.3) * (m < 0)
S(lead * inv(22.0, 22.1, t) * (1 - inv(23.75, 23.9, t)), DV['fprime'], 0.075, pan=0.15)
for te in (K0[2][0], K0[3][0]):                                                              # slope = 0
    S(bell(81, 0.9, 1.0), te, 0.2, rev=0.6)
S(band_sweep(0.4, 6000, 500, q=0.5) * np.hanning(ns(0.4)), TL['sweep'][0], 0.25)             # the sweep

# --- 24 integral: one note per rectangle; each halving of Δx doubles the notes
IG = TL['integral']
fI = lambda v: v * v - 1
for k, (tn, n) in enumerate(IG['n']):
    t_end = IG['n'][k + 1][0] if k + 1 < len(IG['n']) else IG['fade'][0]
    dur_bar = t_end - tn
    step = dur_bar / n if n > 4 else BEAT
    count = n if n > 4 else int(dur_bar / BEAT)
    for i in range(count):
        xm = ((i % n) + 0.5) * 2 / n
        hgt = fI(xm)
        m = scale_note(tn, 3 + hgt * 2.2, 4 if hgt < 0 else 5)
        g = 0.2 * (0.5 if n >= 32 else 1) * (0.6 if n >= 64 else 1)
        S(pluck(m, 0.25, 2600 if hgt >= 0 else 1400, 0.08), tn + i * step, g, pan=-0.6 + 1.2 * (i % n) / max(1, n - 1), rev=0.3)
    if k > 0:                                                    # each doubling adds a voice to the chord
        _, tones = chord_at(tn)
        S(bell(tones[min(k, len(tones) - 1)] + 12, 1.0, 0.8), tn, 0.08, rev=0.7)
t = seg(IG['scan'][0], IG['result'])                              # accumulation: pitch follows F(x)
xv = 2 * in_out_sine(inv(IG['scan'][0], IG['scan'][1], t))
Fv = xv ** 3 / 3 - xv
S(glide_saw(mtof(62) * 2 ** (Fv * 0.9), 6, 0.5) * inv(28.4, 28.5, t), IG['scan'][0], 0.08, rev=0.4)
for i, m in enumerate([62, 65, 69, 74]):                          # the result resolves
    S(bell(m + 12, 1.6, 1.0), IG['result'] + i * 0.04, 0.1, rev=0.7)

# --- 29.75 particles rise and settle on F(x)
for g in range(220):
    tg = 29.75 + 0.75 * RNG.random() ** 0.8
    u = (tg - 29.75) / 0.75
    nn = ns(0.03)
    gr = np.sin(2 * np.pi * (1500 + 4000 * (1 - u) * RNG.random() + 800 * u) * tvec(nn)) * np.hanning(nn)
    S(gr, tg, 0.02 + 0.02 * (1 - u), pan=RNG.uniform(-0.8, 0.8), rev=0.5)

# --- 30 FTC: the lead follows f(x) while the bass follows F(x)
FT = TL['ftc']
t = seg(FT['scan'][0], FT['tangent'][1])
xv = np.where(t < FT['tangent'][0], 2 * in_out_sine(inv(FT['scan'][0], FT['scan'][1], t)),
              2 - 1.55 * in_out_sine(inv(FT['tangent'][0], FT['tangent'][1], t)))
S(glide_sine(mtof(69) * 2 ** (fI(xv) / 6), inv(30.5, 30.6, t) * (1 - inv(33.3, 33.5, t))), FT['scan'][0], 0.08, pan=-0.2)
S(bell(76, 1.2, 1.0), FT['fprime'], 0.15, rev=0.6)

# --- 33.6 graphs fold into modules
S(chirp_drop(1200, 300, 0.3, 0.1), TL['modules'][0] + 0.3, 0.15, pan=-0.4)
S(chirp_drop(1000, 250, 0.3, 0.1), TL['modules'][0] + 0.35, 0.15, pan=0.4)

# --- 34 composition: input → process → output
CP = TL['composition']
SND = {'in': lambda: marimba(62, 0.4, 1.2),
       'g': lambda: band_sweep(0.25, 3000, 600, q=0.9) * np.hanning(ns(0.25)) * 0.6 + pluck(60, 0.25, 2000),
       'f': lambda: bloop(300, 1200, 0.3) + pluck(72, 0.3, 3000) * 0.8,
       'out': lambda: bell(74, 1.0, 1.2)}
for ev in (CP['pass1'], CP['pass2']):
    for te, name in ev:
        S(SND[name](), te, 0.3, pan={'in': -0.7, 'g': -0.2, 'f': 0.2, 'out': 0.7}[name] * (1 if ev is CP['pass1'] else -1), rev=0.35)
for i, m in enumerate([62, 61, 74]):     # symbolic chain: x → x − 1 → (x − 1)²
    S(pluck(m + 12, 0.3, 2500), CP['symbolic'] + i * 0.12, 0.15)
t = seg(CP['shift'][0], CP['shift'][1])
S(glide_sine(mtof(69) * 2 ** (inv(CP['shift'][0], CP['shift'][1], t) * 2 / 12), np.hanning(len(t))), CP['shift'][0], 0.08)
S(band_sweep(0.35, 500, 3000, q=0.7) * np.hanning(ns(0.35)), CP['swap'][0], 0.18)
S(bell(69, 1.2, 1.4), CP['compare'], 0.12, rev=0.6); S(bell(70, 1.2, 1.4), CP['compare'] + 0.06, 0.1, rev=0.6)

# --- 39.6 orbit: a swirl that circles the stereo field
t = seg(TL['orbit'][0], TL['orbit'][1])
sw = band_sweep(0.8, 800, 3500, q=0.7) * np.hanning(ns(0.8))
ang = 2.5 * np.pi * in_out_cubic(inv(TL['orbit'][0], TL['orbit'][1], t))
sfx.add(np.vstack([sw * (0.5 + 0.5 * np.cos(ang)), sw * (0.5 - 0.5 * np.cos(ang))]) * 0.3, TL['orbit'][0])

# --- 40 trig: the circle's height, sung by a sine
TG = TL['trig']
t = seg(TG['turn'][0], 43.6)
th = 2 * np.pi * in_out_sine(inv(TG['turn'][0], TG['turn'][1], t))
ph = (np.pi / 2) * in_out_cubic(inv(TG['phase'][0], TG['phase'][1], t))
A = 1 + 0.3 * in_out_cubic(inv(TG['amp'][0], TG['amp'][1], t))
y = np.where(t < TG['phase'][0], np.sin(th), A * np.sin(ph))
S(glide_sine(mtof(69) * 2 ** (y * 5 / 12), 0.8 + 0.2 * A), TG['turn'][0], 0.08, pan=0.0, rev=0.5)
for k in range(8):
    S(pluck(scale_note(40 + k * 0.5, k % 4, 5), 0.3, 2500, 0.12), 40.5 + k * 0.4, 0.12, pan=np.sin(k), rev=0.4)
t = seg(TL['curl'][0], TL['curl'][1])
S(band_sweep(0.8, 3000, 500, q=0.8) * np.hanning(ns(0.8)), TL['curl'][0], 0.15)

# --- 44 polar: a pluck for every petal, the ∞ panned in a figure eight
PL = TL['polar']
for i, tb in enumerate([45.0, 45.5, 46.0]):
    S(bell(74 + [0, 3, 7][i], 1.0, 1.4), tb, 0.16, pan=[-0.6, 0.6, 0][i], rev=0.6)
for k in range(12):
    S(pluck(scale_note(44.5 + k * 0.125, k % 5, 5), 0.25, 3000, 0.1), 44.5 + k * 0.125, 0.09, pan=np.cos(3 * k * np.pi / 12))
for k in range(8):
    S(pluck(scale_note(46.0 + k * 0.125, 4 - k % 5, 5), 0.25, 3000, 0.1), 46.0 + k * 0.125, 0.08, pan=-np.cos(k))
t = seg(PL['inf'][0], PL['inf'][1] + 0.4)
s = 2 * np.pi * in_out_sine(inv(PL['inf'][0], PL['inf'][1], t))
inf_tone = glide_sine(np.full(len(t), mtof(81))) * np.hanning(len(t))
p = np.cos(s)                                     # x = cos t drives the pan
sfx.add(np.vstack([inf_tone * (1 - p) / 2, inf_tone * (1 + p) / 2]) * 0.12, PL['inf'][0])
S(band_sweep(0.35, 2000, 600, q=0.8) * np.hanning(ns(0.35)), PL['morph'][0], 0.1)

# --- 48 heart: drawn, then the particles converge, then it beats once
HT = TL['heart']
t = seg(HT['trace'][0], HT['trace'][1])
s = 2 * np.pi * in_out_sine(inv(HT['trace'][0], HT['trace'][1], t))
yh = 13 * np.cos(s) - 5 * np.cos(2 * s) - 2 * np.cos(3 * s) - np.cos(4 * s)
S(glide_sine(mtof(69) * 2 ** (yh / 30), np.hanning(len(t)) ** 0.3), HT['trace'][0], 0.07, rev=0.5)
for g in range(420):                              # converging grains: pitch spread narrows onto chord tones
    tg = HT['converge'][0] + (HT['converge'][1] - HT['converge'][0]) * RNG.random()
    u = (tg - HT['converge'][0]) / (HT['converge'][1] - HT['converge'][0])
    target = mtof(RNG.choice([70, 74, 77, 81]))
    fg = target * 2 ** ((1 - u) * RNG.uniform(-1.5, 1.5))
    nn = ns(0.05)
    gr = np.sin(2 * np.pi * fg * tvec(nn)) * np.hanning(nn)
    S(gr, tg, 0.012 + 0.025 * u, pan=RNG.uniform(-0.9, 0.9) * (1 - 0.6 * u), rev=0.6)
music.add(pad_chord([58, 62, 65, 69, 74], 1.5, cutoff=2200, attack=0.15, release=0.6), HT['converge'][1], 0.3)
for dt, g in ((0, 0.6), (0.18, 0.35)):            # one soft heartbeat
    S(kick(0.35, f0=90, f1=45, decay=0.15, click=0.02), HT['pulse'] + dt, g, rev=0.1)
S(bell(81, 1.4, 0.6), HT['pulse'], 0.08, rev=0.8)
for k in range(10):                               # breaking into contour points
    S(hat(0.03, 0.008, lo=4000), HT['contour'][0] + k * 0.035, 0.08, pan=-0.8 + 0.16 * k)

# --- 52 contour morph: a bell for every shape, the 3D cloud as a shimmering swell
MO = TL['morph']
for i, (ts, name) in enumerate(MO['shapes']):
    S(bell(74 + [0, 2, 5, 7, 12][i], 1.2, 1.2), ts, 0.14, pan=[-0.5, 0.5, -0.2, 0.2, 0][i], rev=0.6)
    if i < 4:
        S(band_sweep(MO['dur'], 900, 2600, q=0.8) * np.hanning(ns(MO['dur'])), ts - MO['dur'], 0.08)
t = seg(MO['cloud'][0], MO['cloud'][1])
swell = sum(glide_sine(np.full(len(t), mtof(m)) * (1 + 0.003 * np.sin(2 * np.pi * 0.7 * t + j)))
            for j, m in enumerate([62, 69, 74, 77, 81]))
S(swell * np.sin(np.pi * inv(MO['cloud'][0], MO['cloud'][1], t)) ** 1.5 / 5, MO['cloud'][0], 0.18, rev=0.6)
for k in range(16):                                # the lattice: points land in quick ticks
    S(np.sin(2 * np.pi * (1200 + 60 * k) * tvec(ns(0.02))) * np.exp(-tvec(ns(0.02)) / 0.004), TL['lattice'][0] + k * 0.028, 0.1,
      pan=-0.8 + 0.1 * k, rev=0.2)
S(crash(1.2), 56.0, 0.12)

# --- 56 recap riser
rs = band_sweep(1.0, 400, 9000, q=0.6, shape=lambda u: u ** 1.5) * np.linspace(0, 1, ns(1.0)) ** 2
S(rs, 56.5, 0.22, rev=0)

# ================================================================= mixdown
bass.x = sidechain(bass.x, kicks, 0.5)
music.x = sidechain(music.x, kicks, 0.35)
mix = drums.x * 0.55 + bass.x * 0.7 + music.x * 1.15 + sfx.x * 1.0
mix += convolve(send.x, reverb_ir(2.4, 0.55)) * 0.32
s0, s1 = ns(57.5), ns(58.0)
mix[:, s0 - ns(0.005):s0] *= np.linspace(1, 0, ns(0.005))
mix[:, s0:] = 0                                   # silence: every tail, every reverb — gone

# ================================================================ 58 the hit
hit, hsend = Bus(), Bus()
n = ns(2.0)
tt = tvec(n)
hit.add(np.tanh(glide_sine(38 + 160 * np.exp(-tt / 0.045)) * np.exp(-tt / 0.7) * 2.0) * 0.9, 58.0, 1.0)
nz = fft_filter(noise(ns(0.04)), lo=4000, hi=14000) * np.exp(-tvec(ns(0.04)) / 0.006)
hit.add(nz / np.abs(nz).max(), 58.0, 0.35)                                                   # the bright transient
hit.add(bell(98, 1.2, 0.7), 58.0, 0.12)
hit.add(crash(2.0), 58.0, 0.14)
hsend.add(crash(2.0), 58.0, 0.12)
for m in [38, 45, 50, 54, 57, 64, 66]:            # D major add9 — the line resolves
    nn = ns(2.0)
    t2 = tvec(nn)
    for det, pn in [(-0.08, -0.6), (0.08, 0.6)]:
        v = saw(mtof(m + det), nn, 500 + 3000 * np.exp(-t2 / 0.5), kmax=24, phase=RNG.uniform(0, 6.28))
        v *= np.exp(-t2 / 0.9) * np.minimum(1, t2 / 0.004)
        hit.add(v / 7, 58.0, 0.5, pn)
        hsend.add(v / 7, 58.0, 0.35, pn)
hit.add(marimba(86, 0.4, 1.4), TL['logo']['bounce'][1][0], 0.25)                           # the full stop settles
hsend.add(marimba(86, 0.4), TL['logo']['bounce'][1][0], 0.1)
for i, m in enumerate([74, 78, 81, 86]):
    hit.add(bell(m, 1.0, 0.8), TL['logo']['subtitle'][0] + i * 0.05, 0.035, pan=-0.3 + 0.2 * i)
outro = hit.x + convolve(hsend.x, reverb_ir(1.6, 0.4, seed=3)) * 0.45
outro[:, :s1] = 0
fo = ns(59.3)
outro[:, fo:] *= np.linspace(1, 0, N - fo) ** 2  # tails decay to nothing by 60 s

# =============================================================== master
mix *= 0.7 / np.percentile(np.abs(mix[:, :s0]), 99.95)
outro *= 1.0 / np.max(np.abs(outro))
mix += outro
mix = fft_filter(mix[0], hi=16000, order=1), fft_filter(mix[1], hi=16000, order=1)
mix = np.vstack(mix)
mix = np.where(np.abs(mix) > 0.75, np.sign(mix) * (0.75 + 0.25 * np.tanh((np.abs(mix) - 0.75) / 0.25)), mix)
mix *= 0.89 / np.max(np.abs(mix))                # peak −1 dBFS
mix[:, s0:s1] = 0

if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'out', 'score.wav')
    pcm = (np.clip(mix.T, -1, 1) * 32767).astype('<i2')
    with wave.open(out, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    rms = lambda a: 20 * np.log10(np.sqrt(np.mean(a ** 2)) + 1e-12)
    print(f'wrote {out}: {N / SR:.0f} s, peak {np.max(np.abs(mix)):.3f}, '
          f'silence 57.5–58 rms {rms(mix[:, s0:s1]):.0f} dBFS')
