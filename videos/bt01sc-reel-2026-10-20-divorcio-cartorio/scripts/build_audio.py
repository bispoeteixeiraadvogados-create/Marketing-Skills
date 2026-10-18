#!/usr/bin/env python3
"""BT.01.SC Reel 2026-10-20: build the three audio stems and the timing map.

Usage: python3 scripts/build_audio.py [v1|v2]   (default v2)

Reproducible and deterministic (seeded RNG). Inputs per version (CONFIGS below):
  v1: assets/audio/source/narracao_elevenlabs_take3_clarice.mp3  (ElevenLabs, Clarice Rodrigues, eleven_v4)
  v2: assets/audio/source/narracao_elevenlabs_v2_henrique.mp3     (ElevenLabs, Henrique, eleven_v4)
  plus <take>.words.json (faster-whisper word timestamps)
Outputs (assets/audio/), suffixed with the version:
  voz_narracao_vN.wav, trilha_original_vN.wav, sfx_papel_vN.wav  (48 kHz, stereo, 24-bit)
  mix_referencia_vN.wav  (sum of the three stems, for QA only)
  timing_vN.json         (segment placement + every word in global time)

The voice is never time-stretched: each paragraph of the single take is cut inside a natural pause
and placed at its scene. Music and paper sound design are synthesized here, so they carry no
third-party license.
"""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy import ndimage, signal

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets/audio"
SR = 48000
DUR = 42.0
N = int(SR * DUR)
TARGET_LUFS = -16.0
TP_CEILING = -1.5
rng = np.random.default_rng(20261020)

# Paragraph cuts inside the take's own pauses (source seconds) and the speech onset inside each
# segment. A segment may join several pieces of the take (only to shorten a pause; never inside a
# word). `place` is where the segment starts on the 42 s timeline.
CONFIGS = {
    "v1": {
        "src": "narracao_elevenlabs_take3_clarice.mp3",
        "snap_to_pauses": False,
        "voice_comp": False,
        "segments": [
            # id, [(src_in, src_out), ...], onset_in_segment, target_onset
            ("P1", [(0.000, 3.260)], 0.000, 0.10),
            ("P2", [(3.260, 5.430)], 0.079, 3.62),
            ("P3", [(5.430, 13.540)], 0.161, 6.35),
            ("P4", [(13.540, 20.540)], 0.347, 15.20),
            ("P5", [(20.540, 28.000)], 0.206, 22.25),
            ("P6", [(28.000, 35.020)], 0.167, 31.15),
            ("P7", [(35.020, 37.564)], 0.179, 39.25),
        ],
    },
    "v2": {
        "src": "narracao_elevenlabs_v2_henrique.mp3",
        "snap_to_pauses": True,
        "voice_comp": True,  # Henrique has a higher crest factor: gentle 2.5:1 leveling before the mix
        "segments": [
            # P1: the 1.05 s pause between the two questions is shortened to ~0.35 s
            ("P1", [(0.000, 1.150), (1.850, 3.950)], 0.000, 0.10),
            ("P2", [(4.500, 6.700)], 0.160, 3.62),
            ("P3", [(6.850, 14.950)], 0.313, 6.35),
            ("P4", [(15.050, 21.400)], 0.230, 15.20),
            ("P5", [(21.600, 27.980)], 0.286, 22.25),
            ("P6", [(28.050, 34.300)], 0.153, 31.15),
            ("P7", [(34.550, 37.146)], 0.220, 39.25),
        ],
    },
}

# Scene windows on the final timeline (storyboard 3/3/9/7/9/8/3 with the S1/S2/S3 micro-shift).
SCENES = [
    ("S1", 0.0, 3.5), ("S2", 3.5, 6.2), ("S3", 6.2, 15.0), ("S4", 15.0, 22.0),
    ("S5", 22.0, 31.0), ("S6", 31.0, 39.0), ("S7", 39.0, 42.0),
]


def load_voice(src):
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(src), "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
        capture_output=True, check=True,
    ).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)


def fade(x, ms=8):
    n = min(len(x) // 2, int(SR * ms / 1000))
    if n:
        ramp = np.sin(np.linspace(0, np.pi / 2, n)) ** 2
        x[:n] *= ramp
        x[-n:] *= ramp[::-1]
    return x


def build_voice(src, segments):
    out = np.zeros(N)
    placed = []
    for sid, pieces, onset, target in segments:
        seg = np.concatenate([fade(src[int(a * SR):int(b * SR)].copy()) for a, b in pieces])
        place = target - onset
        i = int(round(place * SR))
        out[i:i + len(seg)] += seg[: max(0, N - i)]
        length = sum(b - a for a, b in pieces)
        placed.append({"id": sid, "pieces": pieces, "place": round(place, 3),
                       "end": round(place + length, 3), "speech_onset": target})
    # Gentle voice chain: 70 Hz high-pass and a light presence lift at 3 kHz.
    sos = signal.butter(2, 70, "highpass", fs=SR, output="sos")
    out = signal.sosfilt(sos, out)
    b, a = peaking(3000, 2.0, 0.9)
    out = signal.lfilter(b, a, out)
    return out, placed


def peaking(f0, gain_db, q):
    A = 10 ** (gain_db / 40)
    w0 = 2 * np.pi * f0 / SR
    alpha = np.sin(w0) / (2 * q)
    b = np.array([1 + alpha * A, -2 * np.cos(w0), 1 - alpha * A])
    a = np.array([1 + alpha / A, -2 * np.cos(w0), 1 - alpha / A])
    return b / a[0], a / a[0]


def pauses(src_path):
    """Silences of the take (-45 dB, >= 0.1 s), used to move recognizer word starts out of pauses."""
    err = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(src_path), "-af",
                          "silencedetect=noise=-45dB:d=0.1", "-f", "null", "-"], capture_output=True, text=True).stderr
    starts = [float(x.split("silence_start: ")[1].split()[0]) for x in err.splitlines() if "silence_start" in x]
    ends = [float(x.split("silence_end: ")[1].split()[0]) for x in err.splitlines() if "silence_end" in x]
    return list(zip(starts, ends))


def words_global(placed, words_path, snap):
    words = json.loads(words_path.read_text())
    gaps = pauses(Path(str(words_path)[: -len(".words.json")])) if snap else []
    res = []
    for w in words:
        s, e = w["s"], w["e"]
        for g0, g1 in gaps:  # a start the recognizer placed inside (or 0.1 s before) a pause
            if g0 - 0.1 <= s < g1 and g1 < e:
                s = g1
        for p in placed:
            offset = p["place"]
            for a, b in p["pieces"]:
                if a <= s < b:
                    res.append({"w": w["w"], "s": round(s - a + offset, 3), "e": round(min(e, b) - a + offset, 3), "seg": p["id"]})
                    break
                offset += b - a
            else:
                continue
            break
    return res


# ---------------------------------------------------------------- music (original, synthesized)
def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


CHORDS = {  # MIDI notes, voiced low to high
    "Dmaj9": [50, 57, 61, 64, 66], "Bm7": [47, 54, 57, 62, 66], "Gmaj7": [43, 50, 54, 59, 62],
    "Em9": [40, 47, 50, 55, 59, 66], "Gmaj9": [43, 50, 54, 57, 59], "Asus4": [45, 52, 57, 62, 64],
    "A": [45, 52, 57, 61, 64], "Dmaj7": [50, 57, 61, 62, 66],
}
BAR = 3.0  # 80 BPM, 4/4
PROG = ["Dmaj9", "Bm7", "Gmaj7", "Em9", "Gmaj7", "Bm7", "Gmaj9", "Asus4",
        "Dmaj7", "Gmaj7", "Bm7", "Gmaj9", "Asus4", "Dmaj9"]


def pad_layer():
    t = np.arange(N) / SR
    out = np.zeros((N, 2))
    for k, name in enumerate(PROG):
        start = k * BAR - 0.6
        end = (k + 1) * BAR + 0.9 if k < len(PROG) - 1 else DUR
        i0, i1 = max(0, int(start * SR)), min(N, int(end * SR))
        tt = t[i0:i1] - start
        length = end - start
        env = np.clip(tt / 0.9, 0, 1) ** 1.5 * np.clip((length - tt) / 1.1, 0, 1) ** 1.2
        for note in CHORDS[name]:
            f = midi(note + 12) if note < 45 else midi(note)
            for ch, det in ((0, -0.0018), (1, 0.0021)):
                ph = rng.uniform(0, 2 * np.pi)
                x = (np.sin(2 * np.pi * f * (1 + det) * tt + ph)
                     + 0.28 * np.sin(2 * np.pi * 2 * f * (1 + det) * tt + ph * 1.3)
                     + 0.08 * np.sin(2 * np.pi * 3 * f * tt + ph * 0.7))
                out[i0:i1, ch] += x * env * 0.05
    sos = signal.butter(2, 1600, "lowpass", fs=SR, output="sos")
    return signal.sosfilt(sos, out, axis=0)


def pluck(f, dur, vel):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    env = (1 - np.exp(-tt / 0.006)) * np.exp(-tt / 0.55)
    x = (np.sin(2 * np.pi * f * tt) + 0.35 * np.sin(2 * np.pi * 2 * f * tt) * np.exp(-tt / 0.25)
         + 0.12 * np.sin(2 * np.pi * 3.01 * f * tt) * np.exp(-tt / 0.12))
    return x * env * vel


def keys_layer():
    """Soft felt-piano arpeggio; density follows the storyboard's sound notes per scene."""
    out = np.zeros((N, 2))
    beat = BAR / 4
    for k, name in enumerate(PROG):
        bar_t = k * BAR
        notes = [n for n in CHORDS[name] if n >= 50] or [n + 12 for n in CHORDS[name]]
        if bar_t < 15:            # S1-S3: quarter-note pulse, contained
            hits = [(0, 0), (1, 1), (2, 2), (3, 1)]
            vel = 0.10
        elif bar_t < 21:          # S4: reduced, half notes
            hits = [(0, 0), (2, 2)]
            vel = 0.07
        elif bar_t < 30:          # S5: slightly broader pulse, eighths in the second half
            hits = [(0, 0), (1, 1), (2, 2), (2.5, 3), (3, 1), (3.5, 2)]
            vel = 0.11
        elif bar_t < 39:          # S6: resolves progressively, thinning
            hits = [(0, 0), (1.5, 1), (3, 2)]
            vel = 0.085
        else:                     # S7: one final chord
            hits = [(0, 0), (0.02, 1), (0.04, 2), (0.06, 3)]
            vel = 0.075
        for pos, idx in hits:
            note = notes[idx % len(notes)]
            t0 = bar_t + pos * beat
            if t0 >= DUR:
                continue
            x = pluck(midi(note), min(4.0, DUR - t0), vel * rng.uniform(0.85, 1.0))
            i = int(t0 * SR)
            pan = 0.5 + 0.18 * np.sin(note)
            out[i:i + len(x), 0] += x[: N - i] * (1 - pan) * 1.4
            out[i:i + len(x), 1] += x[: N - i] * pan * 1.4
    sos = signal.butter(2, 3200, "lowpass", fs=SR, output="sos")
    return signal.sosfilt(sos, out, axis=0)


def sub_pulse():
    out = np.zeros((N, 2))
    times = [0.0, 6.0, 12.0, 22.0, 25.0, 28.0, 31.0, 39.0]
    for t0 in times:
        n = int(1.2 * SR)
        tt = np.arange(n) / SR
        x = np.sin(2 * np.pi * 73.42 * tt) * (1 - np.exp(-tt / 0.01)) * np.exp(-tt / 0.35) * 0.16
        i = int(t0 * SR)
        out[i:i + n, 0] += x[: N - i]
        out[i:i + n, 1] += x[: N - i]
    return out


def reverb(x, seconds=2.4, wet=0.28):
    n = int(seconds * SR)
    tt = np.arange(n) / SR
    ir = np.zeros((n, 2))
    for ch in range(2):
        noise = rng.standard_normal(n)
        sos = signal.butter(1, [300, 5000], "bandpass", fs=SR, output="sos")
        ir[:, ch] = signal.sosfilt(sos, noise) * np.exp(-tt / (seconds / 6.9))
    ir /= np.sqrt(np.sum(ir ** 2, axis=0))
    wetsig = np.stack([signal.fftconvolve(x[:, c], ir[:, c])[:N] for c in range(2)], axis=1)
    return x * (1 - wet) + wetsig * wet * 2.2


def music_automation(voice):
    """Scene automation + sidechain-style duck driven by the voice envelope."""
    t = np.arange(N) / SR
    db = np.full(N, 0.0)
    db[(t >= 15.0) & (t < 22.0)] -= 3.0              # S4: small reduction during the caveat
    db[(t >= 22.0) & (t < 31.0)] += 1.5              # S5: slightly wider pulse
    fade_in = np.clip(t / 0.08, 0, 1)
    fade_out = np.clip((DUR - t) / 1.6, 0, 1) ** 1.5  # S7: ends softly, no abrupt cut
    win = int(0.03 * SR)
    rms = np.sqrt(np.convolve(voice ** 2, np.ones(win) / win, mode="same"))
    active = (20 * np.log10(rms + 1e-9) > -45).astype(float)
    # attack 80 ms, release 450 ms one-pole smoothing
    env = np.zeros(N)
    a_att, a_rel = np.exp(-1 / (0.08 * SR)), np.exp(-1 / (0.45 * SR))
    prev = 0.0
    for i in range(0, N, 48):
        target = active[i]
        coef = a_att if target > prev else a_rel
        prev = target + (prev - target) * coef ** 48
        env[i:i + 48] = prev
    db -= 7.0 * env
    gain = 10 ** (db / 20) * fade_in * fade_out
    return gain


# ---------------------------------------------------------------- paper sound design
def band_noise(dur, lo, hi):
    n = int(dur * SR)
    sos = signal.butter(2, [lo, hi], "bandpass", fs=SR, output="sos")
    return signal.sosfilt(sos, rng.standard_normal(n))


def paper_slide(dur, level=0.05, lo=1200, hi=7000):
    x = band_noise(dur, lo, hi)
    tt = np.arange(len(x)) / SR
    env = np.clip(tt / 0.05, 0, 1) * np.clip((dur - tt) / (dur * 0.55), 0, 1) ** 1.3
    grain = 1 + 0.35 * signal.sosfilt(signal.butter(1, 30, "lowpass", fs=SR, output="sos"),
                                      rng.standard_normal(len(x))) * 6
    return x * env * np.clip(grain, 0.3, 1.8) * level


def paper_contact(level=0.09):
    dur = 0.12
    x = band_noise(dur, 1800, 9000)
    tt = np.arange(len(x)) / SR
    thump = np.sin(2 * np.pi * 140 * tt) * np.exp(-tt / 0.02) * 0.6
    return (x * np.exp(-tt / 0.018) + thump) * level


def folder_move(dur, level=0.06):
    x = band_noise(dur, 250, 2500)
    tt = np.arange(len(x)) / SR
    env = np.sin(np.pi * np.clip(tt / dur, 0, 1)) ** 1.5
    return x * env * level


def folder_thump(level=0.12):
    dur = 0.25
    tt = np.arange(int(dur * SR)) / SR
    body = np.sin(2 * np.pi * 110 * tt) * np.exp(-tt / 0.045)
    snap = band_noise(dur, 800, 5000) * np.exp(-tt / 0.012)
    return (body * 0.8 + snap * 0.5) * level


SFX_V1 = [  # (time, generator) aligned with the V1 composition's motion
    (0.00, lambda: paper_slide(0.58, 0.055)), (0.55, lambda: paper_contact(0.085)),   # S1 q1 lands
    (0.92, lambda: paper_slide(0.48, 0.04)), (1.40, lambda: paper_contact(0.06)),     # S1 q2 lands
    (3.22, lambda: paper_slide(0.54, 0.05)), (3.74, lambda: paper_contact(0.07)),     # S2 sheet
    (4.12, lambda: paper_slide(0.42, 0.035)), (4.52, lambda: paper_contact(0.05)),    # S2 slip
    (5.95, lambda: paper_slide(0.85, 0.045, 900, 6000)),                              # papers lifted away
    (9.20, lambda: paper_slide(0.5, 0.03)), (9.72, lambda: paper_contact(0.045)),      # guarda
    (9.80, lambda: paper_slide(0.5, 0.028)), (10.32, lambda: paper_contact(0.04)),    # convivência
    (10.60, lambda: paper_slide(0.5, 0.028)), (11.12, lambda: paper_contact(0.045)),  # alimentos
    (11.55, lambda: paper_slide(0.75, 0.022)), (12.88, lambda: paper_contact(0.035)), # align + band
    (14.05, lambda: folder_move(0.8, 0.05)),                                          # cover closes partially
    (15.00, lambda: paper_slide(0.5, 0.035)), (15.48, lambda: paper_contact(0.045)),  # acordo particular
    (16.55, lambda: paper_slide(0.9, 0.028)),                                         # pushed out of focus
    (17.25, lambda: paper_slide(0.6, 0.03)), (17.83, lambda: paper_contact(0.04)),    # resolução card
    (21.55, lambda: paper_slide(0.75, 0.03)),                                         # card moved away
    (21.70, lambda: folder_move(0.85, 0.035)), (22.55, lambda: folder_thump(0.07)),   # folder closes
    (24.45, lambda: paper_slide(0.85, 0.045)), (25.27, lambda: paper_contact(0.06)),  # escritura
]


SFX_V2 = [  # (time, generator) aligned with the V2 composition (Henrique word map, timing_v2.json)
    (0.00, lambda: paper_slide(0.58, 0.055)), (0.55, lambda: paper_contact(0.085)),   # S1 q1 lands
    (0.92, lambda: paper_slide(0.48, 0.04)), (1.40, lambda: paper_contact(0.06)),     # S1 q2 lands
    (3.22, lambda: paper_slide(0.54, 0.05)), (3.74, lambda: paper_contact(0.07)),     # S2 sheet
    (4.12, lambda: paper_slide(0.42, 0.035)), (4.52, lambda: paper_contact(0.05)),    # S2 slip
    (5.95, lambda: paper_slide(0.85, 0.045, 900, 6000)),                              # papers lifted away
    (9.36, lambda: paper_slide(0.5, 0.03)), (9.88, lambda: paper_contact(0.045)),      # guarda
    (9.80, lambda: paper_slide(0.5, 0.028)), (10.32, lambda: paper_contact(0.04)),    # convivência
    (10.33, lambda: paper_slide(0.5, 0.028)), (10.85, lambda: paper_contact(0.045)),  # alimentos
    (11.35, lambda: paper_slide(0.75, 0.022)), (12.53, lambda: paper_contact(0.035)), # align + band
    (14.05, lambda: folder_move(0.8, 0.05)),                                          # cover closes partially
    (15.00, lambda: paper_slide(0.5, 0.035)), (15.48, lambda: paper_contact(0.045)),  # acordo particular
    (16.20, lambda: paper_slide(0.9, 0.028)),                                         # pushed out of focus
    (16.95, lambda: paper_slide(0.6, 0.03)), (17.53, lambda: paper_contact(0.04)),    # resolução card
    (21.55, lambda: paper_slide(0.75, 0.03)),                                         # card moved away
    (21.70, lambda: folder_move(0.85, 0.035)), (22.55, lambda: folder_thump(0.07)),   # folder closes
    (24.10, lambda: paper_slide(0.85, 0.045)), (24.92, lambda: paper_contact(0.06)),  # escritura
]

SFX_EVENTS = {"v1": SFX_V1, "v2": SFX_V2}


def build_sfx(events):
    out = np.zeros((N, 2))
    for t0, gen in events:
        x = gen()
        i = int(t0 * SR)
        pan = 0.5 + 0.12 * np.sin(t0 * 3.1)
        out[i:i + len(x), 0] += x[: N - i] * (1 - pan) * 1.4
        out[i:i + len(x), 1] += x[: N - i] * pan * 1.4
    return out


# ---------------------------------------------------------------- measurement
def measure(x):
    with tempfile.NamedTemporaryFile(suffix=".wav") as tmp:
        sf.write(tmp.name, x, SR, subtype="FLOAT")
        err = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", tmp.name, "-af",
                              "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
    summary = err[err.rfind("Summary:"):]
    integ = float(summary.split("I:")[1].split("LUFS")[0])
    tp = float(summary.split("Peak:")[1].split("dBFS")[0])
    return integ, tp


def soft_limit(x, ceiling_db, look_ms=3.0):
    """Look-ahead peak limiter: a minimum filter over +-look then a moving average no longer than
    the look radius, so the smoothed gain never exceeds what any sample needs."""
    ceiling = 10 ** (ceiling_db / 20)
    peak = np.max(np.abs(x), axis=1) if x.ndim > 1 else np.abs(x)
    need = np.minimum(1.0, ceiling / np.maximum(peak, 1e-12))
    L = int(look_ms / 1000 * SR)
    g = ndimage.uniform_filter1d(ndimage.minimum_filter1d(need, size=2 * L + 1), size=L)
    return x * (g[:, None] if x.ndim > 1 else g)


def level_voice(x, threshold_db=-26.0, ratio=2.5):
    """Gentle leveling on the voice: 20 ms RMS detector, 2.5:1 above the threshold, 30 ms gain smoothing."""
    rms = np.sqrt(ndimage.uniform_filter1d(x ** 2, size=int(0.02 * SR)) + 1e-12)
    over = np.maximum(0.0, 20 * np.log10(rms) - threshold_db)
    gain_db = ndimage.uniform_filter1d(-over * (1 - 1 / ratio), size=int(0.03 * SR))
    return x * 10 ** (gain_db / 20)


def main(version="v2"):
    cfg = CONFIGS[version]
    src_path = ROOT / "assets/audio/source" / cfg["src"]
    src = load_voice(src_path)
    voice_m, placed = build_voice(src, cfg["segments"])
    if cfg["voice_comp"]:
        voice_m = level_voice(voice_m)
    words = words_global(placed, Path(str(src_path) + ".words.json"), cfg["snap_to_pauses"])

    music = reverb(pad_layer() + keys_layer()) + sub_pulse()
    music *= music_automation(voice_m)[:, None]
    sfx = build_sfx(SFX_EVENTS[version])
    voice = np.stack([voice_m, voice_m], axis=1)

    # Relative balance (pre-master): voice reference, music bed and paper well underneath.
    v_i, _ = measure(voice)
    m_i, _ = measure(music)
    s_i, _ = measure(sfx)
    music *= 10 ** (((v_i - 17.0) - m_i) / 20)
    sfx *= 10 ** (((v_i - 19.0) - s_i) / 20)

    mix = voice + music + sfx
    integ, tp = measure(mix)
    gain = 10 ** ((TARGET_LUFS - integ) / 20)
    voice, music, sfx = voice * gain, music * gain, sfx * gain
    mix = voice + music + sfx
    integ, tp = measure(mix)
    for _ in range(3):  # safety: limit the voice stem until the summed master is under the ceiling
        if tp <= TP_CEILING:
            break
        voice = soft_limit(voice, TP_CEILING - 1.0 - (tp - TP_CEILING) * 0.5)
        mix = voice + music + sfx
        integ, tp = measure(mix)
        gain = 10 ** ((TARGET_LUFS - integ) / 20)
        voice, music, sfx = voice * gain, music * gain, sfx * gain
        mix = voice + music + sfx
        integ, tp = measure(mix)
    print(f"stems: voice {v_i:.1f} music {m_i:.1f} sfx {s_i:.1f} LUFS (pre-balance)")
    print(f"master reference: I={integ:.2f} LUFS, true peak={tp:.2f} dBTP")

    OUT.mkdir(parents=True, exist_ok=True)
    sf.write(OUT / f"voz_narracao_{version}.wav", voice, SR, subtype="PCM_24")
    sf.write(OUT / f"trilha_original_{version}.wav", music, SR, subtype="PCM_24")
    sf.write(OUT / f"sfx_papel_{version}.wav", sfx, SR, subtype="PCM_24")
    sf.write(OUT / f"mix_referencia_{version}.wav", mix, SR, subtype="PCM_24")
    (OUT / f"timing_{version}.json").write_text(json.dumps({
        "duration": DUR, "scenes": [{"id": s, "start": a, "end": b} for s, a, b in SCENES],
        "version": version, "source": cfg["src"], "segments": placed, "words": words,
        "master_reference": {"integrated_lufs": integ, "true_peak_dbtp": tp},
    }, ensure_ascii=False, indent=1))
    print(f"{len(words)} words mapped")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else "v2"))
