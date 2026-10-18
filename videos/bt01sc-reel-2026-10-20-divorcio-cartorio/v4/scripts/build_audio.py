#!/usr/bin/env python3
"""V4 audio: voice levelling, functional sound design and the final mix.

Inputs:  assets/audio/voz_v4.wav (from build_voice.py), assets/audio/timing_v4.json
Outputs (assets/audio/, 48 kHz, 24-bit):
  voz_v4_nivelada.wav  levelled voice stem (stereo)
  sfx_v4.wav           sound design stem (stereo), synthesized here, so no third-party license
  mix_v4.wav           the track the composition plays: -16 LUFS integrated, true peak below -2 dBTP
                       (margin for the AAC encode, so the MP4 stays under the -1.5 dBTP ceiling)

No music, as the BT manual asks. Every effect answers a visible action: the hook accent, documents
landing, the paper sliding away, the single low stamp impact, the deed touching the desk, the pen.
Deterministic: fixed seed.

Usage: python3 scripts/build_audio.py
"""
import json
import subprocess
import tempfile
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy import ndimage, signal

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets/audio"
SR = 48000
SC = json.loads((ROOT / "assets/audio/scenes_v4.json").read_text())
TOTAL = SC["total"]
N = int(TOTAL * SR)
TARGET_LUFS = -16.0
TP_CEILING = -2.0
rng = np.random.default_rng(20261020)
WORDS = json.loads((OUT / "timing_v4.json").read_text())["words"]


def w(token, n=0):
    k = 0
    for x in WORDS:
        if x["w"].lower().strip(".,?!") == token:
            if k == n:
                return x["s"]
            k += 1
    raise KeyError(token)


def band_noise(dur, lo, hi):
    sos = signal.butter(2, [lo, hi], "bandpass", fs=SR, output="sos")
    return signal.sosfilt(sos, rng.standard_normal(int(dur * SR)))


def tt(dur):
    return np.arange(int(dur * SR)) / SR


def hook_accent(level=0.10):
    """Short, low and soft: the first frame gets weight without a whoosh."""
    t = tt(0.32)
    body = np.sin(2 * np.pi * (96 - 30 * t) * t) * np.exp(-t / 0.07)
    air = band_noise(0.32, 2500, 8000) * np.exp(-t / 0.03) * 0.25
    return (body + air) * np.clip(t / 0.004, 0, 1) * level


def paper_contact(level=0.09):
    t = tt(0.14)
    x = band_noise(0.14, 1800, 9000) * np.exp(-t / 0.018)
    thump = np.sin(2 * np.pi * 140 * t) * np.exp(-t / 0.02) * 0.6
    return (x + thump) * level


def paper_slide(dur, level=0.05, lo=1200, hi=7000):
    x = band_noise(dur, lo, hi)
    t = np.arange(len(x)) / SR
    env = np.clip(t / 0.05, 0, 1) * np.clip((dur - t) / (dur * 0.55), 0, 1) ** 1.3
    return x * env * level


def stamp_impact(level=0.34):
    """Single low, controlled hit: descending 72 Hz body, rubber/paper contact, short wood knock."""
    t = tt(0.6)
    body = np.sin(2 * np.pi * (72 * t - 22 * t * t)) * np.exp(-t / 0.11)
    knock = np.sin(2 * np.pi * 230 * t) * np.exp(-t / 0.025) * 0.35
    contact = band_noise(0.6, 900, 4500) * np.exp(-t / 0.012) * 0.45
    x = (body + knock + contact) * np.clip(t / 0.002, 0, 1)
    return x * level


def deed_contact(level=0.16):
    """A stack of paper landing: air, soft low body, then a short slide."""
    t = tt(0.5)
    air = band_noise(0.5, 300, 2400) * np.exp(-t / 0.05) * 0.6
    body = np.sin(2 * np.pi * 120 * t) * np.exp(-t / 0.05) * 0.7
    slide = band_noise(0.5, 1500, 6000) * np.clip((t - 0.04) / 0.05, 0, 1) * np.exp(-np.clip(t - 0.04, 0, None) / 0.18) * 0.22
    return (air + body + slide) * level


def pen_scratch(dur, level=0.045):
    """Ballpoint on paper: band-limited noise in short strokes."""
    x = band_noise(dur, 2200, 7500)
    t = np.arange(len(x)) / SR
    strokes = np.zeros_like(t)
    s = 0.0
    while s < dur:
        ln = rng.uniform(0.07, 0.16)
        strokes += np.clip(np.sin(np.pi * np.clip((t - s) / ln, 0, 1)), 0, 1) ** 0.8
        s += ln + rng.uniform(0.02, 0.06)
    env = np.clip(t / 0.03, 0, 1) * np.clip((dur - t) / 0.08, 0, 1)
    return x * strokes * env * level


HIT = w("comprovar") + 0.1  # same instant as components/three-stage.js
EVENTS = [
    (0.0, lambda: hook_accent(0.10)),
    (w("guarda") - 0.04 + 0.12, lambda: paper_contact(0.075)),  # documento da guarda pousa
    (w("alimentos") - 0.04 + 0.12, lambda: paper_contact(0.07)),  # documento dos alimentos pousa
    (w("sozinho") + 0.02, lambda: paper_slide(0.55, 0.035)),  # o acordo particular se afasta
    (HIT - 0.004, lambda: stamp_impact(0.34)),  # impacto do carimbo, uma única vez
    (SC["match"] + 0.10, lambda: deed_contact(0.12)),  # escritura assenta na mesa depois do match cut
    (20.68, lambda: pen_scratch(0.84, 0.05)),  # caneta no papel, plano A da filmagem
]


def build_sfx():
    out = np.zeros((N, 2))
    for t0, gen in EVENTS:
        x = gen()
        i = int(t0 * SR)
        pan = 0.5 + 0.1 * np.sin(t0 * 3.1)
        n = min(len(x), N - i)
        out[i:i + n, 0] += x[:n] * (1 - pan) * 1.4
        out[i:i + n, 1] += x[:n] * pan * 1.4
    return out


def measure(x):
    with tempfile.NamedTemporaryFile(suffix=".wav") as tmp:
        sf.write(tmp.name, x, SR, subtype="FLOAT")
        err = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", tmp.name, "-af", "ebur128=peak=true",
                              "-f", "null", "-"], capture_output=True, text=True).stderr
    s = err[err.rfind("Summary:"):]
    return float(s.split("I:")[1].split("LUFS")[0]), float(s.split("Peak:")[1].split("dBFS")[0])


def soft_limit(x, ceiling_db, look_ms=3.0):
    ceiling = 10 ** (ceiling_db / 20)
    peak = np.max(np.abs(x), axis=1)
    need = np.minimum(1.0, ceiling / np.maximum(peak, 1e-12))
    L = int(look_ms / 1000 * SR)
    g = ndimage.uniform_filter1d(ndimage.minimum_filter1d(need, size=2 * L + 1), size=L)
    return x * g[:, None]


def level_voice(x, threshold_db=-26.0, ratio=2.5):
    rms = np.sqrt(ndimage.uniform_filter1d(x ** 2, size=int(0.02 * SR)) + 1e-12)
    over = np.maximum(0.0, 20 * np.log10(rms) - threshold_db)
    gain_db = ndimage.uniform_filter1d(-over * (1 - 1 / ratio), size=int(0.03 * SR))
    return x * 10 ** (gain_db / 20)


def main():
    v, sr = sf.read(OUT / "voz_v4.wav", dtype="float64")
    assert sr == SR
    v = level_voice(v)
    voice = np.zeros((N, 2))
    voice[: len(v)] = np.stack([v, v], axis=1)[:N]
    sfx = build_sfx()
    v_i, _ = measure(voice)
    s_i, _ = measure(sfx)
    sfx *= 10 ** (((v_i - 21.0) - s_i) / 20)  # efeitos bem abaixo da voz
    # ganho até -16 LUFS; se o pico verdadeiro passar do teto, limita a soma e repete o ganho
    for _ in range(6):
        mix = voice + sfx
        integ, tp = measure(mix)
        g = 10 ** ((TARGET_LUFS - integ) / 20)
        voice, sfx = voice * g, sfx * g
        mix = voice + sfx
        integ, tp = measure(mix)
        if tp <= TP_CEILING and abs(integ - TARGET_LUFS) <= 0.1:
            break
        if tp > TP_CEILING:
            voice = soft_limit(voice + sfx, TP_CEILING - 0.5) - sfx
    sf.write(OUT / "voz_v4_nivelada.wav", voice, SR, subtype="PCM_24")
    sf.write(OUT / "sfx_v4.wav", sfx, SR, subtype="PCM_24")
    sf.write(OUT / "mix_v4.wav", mix, SR, subtype="PCM_24")
    print(f"stems pre-balance: voice {v_i:.1f} LUFS, sfx {s_i:.1f} LUFS; mix {integ:.2f} LUFS, TP {tp:.2f} dBTP")
    print("events:", ", ".join(f"{t:.2f}" for t, _ in EVENTS))


if __name__ == "__main__":
    main()
