#!/usr/bin/env python3
"""V4 voice edit: shortens the pauses between sentences by cutting inside silences only.

No time-stretch and no speed change: each spoken stretch is copied sample by sample.
Writes assets/audio/voz_v4.wav (48 kHz mono, unlevelled) and assets/audio/timing_v4.json
(word times on the edited timeline, used by the captions and by the composition).

Usage: python3 scripts/build_voice.py
"""
import json
import subprocess
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets/audio/source/narracao_v4_henrique_raw.wav"
WORDS = ROOT / "assets/audio/source/narracao_v4_henrique_raw.words.json"
OUT = ROOT / "assets/audio/voz_v4.wav"
TIMING = ROOT / "assets/audio/timing_v4.json"

LEAD = 0.05  # voice starts almost on frame 0: the hook must be heard immediately
# target length of each pause between sentences, keyed by the raw silence start (s)
GAPS = {
    1.138: 0.34,  # menores? | Pode
    3.067: 0.42,  # cartório? | Sim  (short beat before the answer)
    4.020: 0.42,  # Sim. | Mas
    6.445: 0.44,  # importante. | Guarda
    11.596: 0.40,  # Justiça. | Um acordo
    14.810: 0.42,  # basta. | É preciso
    17.537: 0.55,  # judicial. | Com o consenso (stamp settles)
    22.535: 0.40,  # pública | com assistência
    25.572: 0.40,  # público. | Essa
    28.172: 0.80,  # CNJ. | Salve (time to read the CNJ reference)
}
SCRIPT = (
    "Tem filhos menores? Pode divorciar no cartório? Sim. Mas há uma condição importante. "
    "Guarda, convivência e alimentos precisam estar resolvidos na Justiça. "
    "Um acordo particular, sozinho, não basta. É preciso comprovar a resolução judicial. "
    "Com o consenso do casal, o divórcio pode seguir por escritura pública. "
    "Com assistência de advogado ou defensor público. Essa é a regra prevista pelo CNJ. "
    "Salve esta informação para consultar depois."
).split()


def silences(path, noise="-40dB", dur=0.12):
    err = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(path), "-af", f"silencedetect=n={noise}:d={dur}",
                          "-f", "null", "-"], capture_output=True, text=True).stderr
    st = [float(x.split("silence_start: ")[1].split()[0]) for x in err.splitlines() if "silence_start" in x]
    en = [float(x.split("silence_end: ")[1].split()[0]) for x in err.splitlines() if "silence_end" in x]
    return list(zip(st, en))


def main():
    a, sr = sf.read(SRC, dtype="float32")
    sil = silences(SRC)
    # cut list: (raw_from, raw_to) kept stretches
    cuts = []  # (silence_start, silence_end, new_gap)
    for s0, s1 in sil:
        key = next((k for k in GAPS if abs(k - s0) < 0.02), None)
        if key is not None:
            cuts.append((s0, s1, GAPS[key]))
    assert len(cuts) == len(GAPS), (len(cuts), cuts)
    pieces, t = [], 0.0
    for s0, s1, g in cuts:
        # keep half the new gap after the last word and half before the next one
        pieces.append((t, s0 + g / 2))
        t = s1 - g / 2
    pieces.append((t, len(a) / sr))
    fade = int(0.008 * sr)
    out = [np.zeros(int(LEAD * sr), np.float32)]
    raw_to_new = []  # (raw_start, raw_end, new_start)
    pos = LEAD
    for p0, p1 in pieces:
        seg = a[int(p0 * sr):int(p1 * sr)].copy()
        seg[:fade] *= np.linspace(0, 1, fade)
        seg[-fade:] *= np.linspace(1, 0, fade)
        out.append(seg)
        raw_to_new.append((p0, p1, pos))
        pos += len(seg) / sr
    y = np.concatenate(out)
    sf.write(OUT, y, sr, subtype="PCM_24")

    def m(t):
        for p0, p1, n0 in raw_to_new:
            if p0 - 1e-6 <= t <= p1 + 1e-6:
                return n0 + (t - p0)
        # inside a removed stretch: clamp to the nearest kept edge
        best = min(raw_to_new, key=lambda r: min(abs(t - r[0]), abs(t - r[1])))
        return best[2] if abs(t - best[0]) < abs(t - best[1]) else best[2] + best[1] - best[0]

    words = json.loads(WORDS.read_text())
    assert len(words) == len(SCRIPT), (len(words), len(SCRIPT))
    res = []
    for w, ref in zip(words, SCRIPT):
        s, e = w["s"], w["e"]
        for s0, s1 in sil:  # whisper lets word edges leak into silences
            if s0 - 0.05 <= s < s1 and e > s1:
                s = s1
            if s0 < e <= s1:
                e = s0
        norm = lambda x: x.lower().strip(".,?!")
        assert norm(w["w"]) == norm(ref), (w["w"], ref)
        res.append({"w": ref, "s": round(m(s), 3), "e": round(m(e), 3)})
    TIMING.write_text(json.dumps({"duration": round(len(y) / sr, 3), "lead": LEAD, "pieces": raw_to_new,
                                  "words": res}, ensure_ascii=False, indent=1))
    print(f"voice {len(y) / sr:.3f}s, {len(res)} words, last ends {res[-1]['e']:.3f}")
    print(" ".join(f"{x['w']}@{x['s']:.2f}" for x in res))


if __name__ == "__main__":
    main()
