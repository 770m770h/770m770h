# -*- coding: utf-8 -*-
"""KESHER — the score, written to picture. Deterministic, seeded, 60.000s."""
import numpy as np, wave, struct

SR = 44100
DUR = 60.0
N = int(SR * DUR)
t = np.arange(N) / float(SR)
L = np.zeros(N); R = np.zeros(N)
rng = np.random.default_rng(1789)

def idx(a, b):
    return int(a * SR), min(N, int(b * SR))

def env_ar(n, a, r, curve=2.0):
    e = np.ones(n)
    na, nr = min(int(a * SR), n), min(int(r * SR), n)
    if na: e[:na] = np.linspace(0, 1, na) ** curve
    if nr: e[n - nr:] *= (np.linspace(1, 0, nr) ** curve)
    return e

def add(buf_l, buf_r, sig, t0, pan=0.0):
    i0 = int(t0 * SR); i1 = min(N, i0 + len(sig))
    if i0 >= N: return
    s = sig[:i1 - i0]
    buf_l[i0:i1] += s * (1.0 - max(0.0, pan)) 
    buf_r[i0:i1] += s * (1.0 + min(0.0, pan))

def pad(f, dur, amp, partials=(1, 2, 3, 4, 5), gains=(1, .42, .20, .10, .05),
        atk=1.6, rel=2.2, drift=0.16):
    n = int(dur * SR); lt = np.arange(n) / float(SR)
    out = np.zeros(n)
    for k, g in zip(partials, gains):
        det = 1.0 + drift * 0.001 * k * np.sin(2 * np.pi * (0.07 + 0.013 * k) * lt)
        out += g * np.sin(2 * np.pi * f * k * lt * det)
    lfo = 0.86 + 0.14 * np.sin(2 * np.pi * 0.09 * lt + f)
    return out * env_ar(n, atk, rel) * lfo * amp

def bell(f, amp, decay=2.6, inharm=1.0035):
    n = int(min(decay * 3.2, 6.0) * SR); lt = np.arange(n) / float(SR)
    out = np.zeros(n)
    for k, g, d in ((1, 1.0, 1.0), (2.01, .48, .72), (3.02, .26, .52),
                    (4.06, .13, .38), (5.4, .07, .28), (6.8, .04, .22)):
        out += g * np.sin(2 * np.pi * f * k * inharm * lt) * np.exp(-lt / (decay * d))
    out *= (1 - np.exp(-lt / 0.004))
    return out * amp

def strings(f, dur, amp, atk=1.9, rel=2.4):
    """A bowed stack: three slightly detuned saw-ish voices."""
    n = int(dur * SR); lt = np.arange(n) / float(SR)
    out = np.zeros(n)
    for cents in (-7, 0, 6):
        fr = f * (2 ** (cents / 1200.0))
        for k in range(1, 11):
            out += (1.0 / k ** 1.35) * np.sin(2 * np.pi * fr * k * lt +
                                              0.6 * np.sin(2 * np.pi * 0.11 * lt * k))
    vib = 1 + 0.0022 * np.sin(2 * np.pi * 4.2 * lt)
    return out * env_ar(n, atk, rel, 1.6) * vib * amp / 9.0

def sub(f, dur, amp, atk=0.5, rel=1.4):
    n = int(dur * SR); lt = np.arange(n) / float(SR)
    return np.sin(2 * np.pi * f * lt) * env_ar(n, atk, rel) * amp

def air(dur, amp, cutoff=0.06, atk=0.9, rel=1.2):
    n = int(dur * SR)
    x = rng.standard_normal(n)
    b = np.zeros(n); acc = 0.0
    # one-pole lowpass, vectorised via cumulative smoothing
    k = cutoff
    for _ in range(3):
        x = np.convolve(x, np.ones(64) / 64.0, mode="same")
    return x * env_ar(n, atk, rel) * amp * 6.0

def drag(dur, amp):
    n = int(dur * SR)
    x = rng.standard_normal(n)
    x = np.convolve(x, np.ones(220) / 220.0, mode="same")
    lt = np.arange(n) / float(SR)
    return x * np.exp(-lt / (dur * 0.32)) * amp * 26.0

# ------------------------------------------------------------------ pitches
D2, D3, A3, Bb3, C4, D4, Eb4, F4, G4, A4, Bb4, C5, D5, F5, A5 = (
    73.42, 146.83, 220.0, 233.08, 261.63, 293.66, 311.13, 349.23,
    392.0, 440.0, 466.16, 523.25, 587.33, 698.46, 880.0)

# ================================================================== ACT ONE
add(L, R, pad(D2, 14.5, 0.150, atk=2.4, rel=2.0), 0.0, -0.15)
add(L, R, pad(D3, 14.0, 0.075, atk=3.0, rel=2.0), 0.4, 0.15)
add(L, R, bell(D5, 0.16, 3.4), 0.55, 0.25)
add(L, R, bell(A4, 0.11, 3.0), 2.30, -0.30)
# the rupture
add(L, R, bell(F4, 0.15, 3.6), 4.05, -0.20)
add(L, R, bell(D4, 0.13, 4.0), 5.60, 0.20)
add(L, R, pad(Bb3, 6.0, 0.048, atk=1.6, rel=2.4), 4.6, 0.30)
# alone / the peers
add(L, R, bell(A4, 0.085, 2.6), 8.20, 0.28)
add(L, R, bell(F4, 0.075, 2.6), 9.70, -0.28)
add(L, R, bell(D5, 0.075, 2.4), 11.30, 0.22)
add(L, R, bell(A4, 0.070, 2.4), 12.60, -0.22)

# the false circle: warmth that is real for two and a half seconds
add(L, R, pad(D3, 5.2, 0.145, atk=1.0, rel=1.2), 13.4, -0.2)
add(L, R, pad(A3, 5.0, 0.110, atk=1.2, rel=1.2), 13.7, 0.2)
add(L, R, pad(F4, 4.6, 0.070, atk=1.4, rel=1.2), 14.1, 0.35)
add(L, R, bell(D5, 0.13, 3.0), 14.15, 0.0)
add(L, R, bell(F5, 0.10, 2.8), 15.55, 0.3)
add(L, R, air(3.4, 0.030, atk=1.4, rel=1.4), 14.4, -0.4)

# ================================================================== ACT TWO
# it curdles: a minor second rubbing against the tonic
add(L, R, pad(D2, 12.0, 0.170, atk=1.2, rel=2.0), 18.05, -0.2)
add(L, R, pad(Eb4, 11.0, 0.055, atk=3.4, rel=2.6), 18.6, 0.4)
add(L, R, bell(D4, 0.10, 4.2), 18.35, 0.0)
add(L, R, pad(A3, 8.0, 0.062, atk=2.6, rel=2.0), 20.6, 0.25)
add(L, R, pad(A3, 5.4, 0.075, atk=1.4, rel=1.8), 50.6, 0.3)
add(L, R, bell(Bb4, 0.075, 3.0), 21.5, -0.25)
add(L, R, sub(D2 / 2, 7.0, 0.115, atk=1.6, rel=2.0), 24.4, 0.0)
add(L, R, bell(F4, 0.07, 2.4), 25.4, 0.2)

# the swallowing: one dry drag per thread taken
for k in range(14):
    add(L, R, drag(0.34, 0.020), 28.45 + k * 0.135, (-1) ** k * 0.35)
add(L, R, pad(D2, 9.5, 0.185, atk=0.8, rel=2.2), 28.0, -0.1)
add(L, R, pad(Eb4, 8.0, 0.05, atk=2.0, rel=2.4), 29.0, 0.4)
add(L, R, bell(D4, 0.085, 3.4), 32.3, -0.2)
# the closed loop, firing on itself
for k in range(7):
    add(L, R, bell(A4, 0.028, 0.9), 34.95 + k * 0.21, 0.0)
add(L, R, pad(A3, 4.4, 0.055, atk=1.4, rel=1.4), 36.0, 0.2)
add(L, R, bell(D5, 0.055, 2.4), 36.4, -0.3)

# ---- rock bottom: near silence, one sub, one breath
add(L, R, sub(41.0, 3.6, 0.235, atk=0.9, rel=1.2), 38.95, 0.0)
add(L, R, air(2.8, 0.022, atk=1.1, rel=1.3), 39.4, 0.0)

# ================================================================ ACT THREE
# three catches: two that fail, one that holds
add(L, R, bell(A4, 0.055, 0.55), 43.62, 0.3)
add(L, R, bell(A4, 0.060, 0.60), 44.10, -0.3)
add(L, R, bell(D5, 0.235, 5.0), 44.94, 0.0)
add(L, R, pad(D3, 8.5, 0.155, atk=1.8, rel=2.0), 44.6, -0.15)

# the circle: a warm build that resolves, and never becomes a fanfare
add(L, R, strings(D3, 4.8, 0.215, atk=1.4, rel=1.4), 45.9, -0.2)
add(L, R, strings(A3, 4.6, 0.155, atk=1.5, rel=1.4), 46.2, 0.2)
add(L, R, strings(F4, 4.2, 0.105, atk=1.6, rel=1.4), 46.6, 0.35)
# a bright chime on each knot tied
for k in range(6):
    add(L, R, bell(A5, 0.075, 1.6), 47.35 + k * 0.14, (-1) ** k * 0.4)

add(L, R, strings(Bb3, 4.8, 0.300, atk=0.9, rel=1.6), 49.6, -0.2)
add(L, R, strings(F4, 4.6, 0.205, atk=1.0, rel=1.6), 50.0, 0.25)
for k in range(8):
    add(L, R, bell(D5, 0.062, 1.5), 50.5 + k * 0.30, (-1) ** k * 0.35)

add(L, R, strings(F4 / 2, 4.4, 0.360, atk=0.8, rel=1.6), 53.3, -0.15)
add(L, R, strings(C5 / 2, 4.2, 0.260, atk=0.9, rel=1.6), 53.6, 0.2)
add(L, R, bell(D5, 0.170, 3.6), 55.6, 0.0)

# the net, and the last chord
add(L, R, strings(D3, 4.4, 0.420, atk=1.0, rel=2.2), 56.3, -0.15)
add(L, R, strings(A3, 4.2, 0.300, atk=1.2, rel=2.2), 56.5, 0.15)
add(L, R, strings(F4, 3.8, 0.200, atk=1.4, rel=2.2), 56.9, 0.35)
add(L, R, pad(D2, 4.0, 0.300, atk=1.0, rel=2.4), 56.4, 0.0)
add(L, R, bell(D5, 0.230, 4.4), 58.55, 0.0)
add(L, R, bell(A5, 0.105, 3.8), 58.72, 0.3)

# ------------------------------------------------- the half-second drop-out
gate = np.ones(N)
g0, g1 = idx(17.52, 18.06)
gate[g0:g1] = 0.05
gate[g0 - 900:g0] = np.linspace(1, 0.05, 900)
gate[g1:g1 + 2600] = np.linspace(0.05, 1, 2600)
# and the held stillness at rock bottom
s0, s1 = idx(38.95, 42.30)
duck = np.ones(N)
duck[s0:s1] = 0.20
duck[s0 - 5000:s0] = np.linspace(1, 0.20, 5000)
duck[s1:s1 + 9000] = np.linspace(0.20, 1, 9000)
L *= gate * duck; R *= gate * duck

# ---------------------------------------------------------------- reverb
imp_n = int(1.9 * SR)
lt = np.arange(imp_n) / float(SR)
imp = rng.standard_normal(imp_n) * np.exp(-lt / 0.52)
imp[:int(0.012 * SR)] = 0
imp /= np.abs(imp).sum() / 8.0
def conv(x):
    n = len(x) + len(imp) - 1
    m = 1 << (n - 1).bit_length()
    y = np.fft.irfft(np.fft.rfft(x, m) * np.fft.rfft(imp, m), m)[:len(x)]
    return y
L = L * 0.80 + conv(L) * 0.20
R = R * 0.80 + conv(R) * 0.20

# ------------------------------------------------------- master + fades
mix = np.stack([L, R])
peak = np.abs(mix).max()
mix = mix / peak * 0.86
mix *= np.tanh(np.abs(mix) * 1.6) / np.maximum(np.abs(mix) * 1.6, 1e-9)
mix[:, :int(0.35 * SR)] *= np.linspace(0, 1, int(0.35 * SR))
mix[:, -int(0.55 * SR):] *= np.linspace(1, 0, int(0.55 * SR))
mix = np.clip(mix, -1, 1)

pcm = (mix.T * 32767).astype(np.int16)
with wave.open("assets/score.wav", "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print("score.wav  %.3fs  peak %.3f  rms %.4f" % (N / float(SR), np.abs(mix).max(),
                                                 float(np.sqrt((mix ** 2).mean()))))
