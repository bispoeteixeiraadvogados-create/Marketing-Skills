#!/usr/bin/env python3
"""V4 voice edit: shortens the pauses between sentences by cutting inside silences only.

No time-stretch and no speed change: each spoken stretch is copied sample by sample.
Works for any take of the approved script: the pauses are found from the word timestamps,
so changing the voice only needs a new source file.

Usage: python3 scripts/build_voice.py assets/audio/source/<take>.mp3
  1. converts the take to 48 kHz WAV and transcribes it with faster-whisper (cached in <take>.words.json);
  2. checks that the 66 words of the approved script are all there, in order;
  3. writes assets/audio/voz_v4.wav (mono, unlevelled) and assets/audio/timing_v4.json.
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets/audio/voz_v4.wav"
TIMING = ROOT / "assets/audio/timing_v4.json"
SR = 48000
LEAD = 0.05  # a voz começa quase no quadro 0: o gancho precisa ser ouvido de imediato
SCRIPT = (
    "Tem filhos menores? Pode divorciar no cartório? Sim. Mas há uma condição importante. "
    "Guarda, convivência e alimentos precisam estar resolvidos na Justiça. "
    "Um acordo particular, sozinho, não basta. É preciso comprovar a resolução judicial. "
    "Com o consenso do casal, o divórcio pode seguir por escritura pública. "
    "Com assistência de advogado ou defensor público. Essa é a regra prevista pelo CNJ. "
    "Salve esta informação para consultar depois."
).split()
# pausa-alvo antes da palavra de índice k (início de frase); só encurta, nunca alonga
GAPS = {
    3: 0.34,  # menores? | Pode
    7: 0.42,  # cartório? | Sim (respiro curto antes da resposta)
    8: 0.42,  # Sim. | Mas
    13: 0.44,  # importante. | Guarda
    22: 0.40,  # Justiça. | Um acordo
    28: 0.42,  # basta. | É preciso
    34: 0.55,  # judicial. | Com o consenso (o carimbo assenta)
    46: 0.40,  # pública. | Com assistência
    53: 0.40,  # público. | Essa
    60: 0.80,  # CNJ. | Salve (tempo de ler a referência do CNJ)
}
INNER_MAX = 0.48  # pausa máxima dentro de uma frase (vírgulas)


def norm(x):
    return x.lower().strip(".,?!")


def silences(path, noise="-40dB", dur=0.12):
    err = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(path), "-af", f"silencedetect=n={noise}:d={dur}",
                          "-f", "null", "-"], capture_output=True, text=True).stderr
    st = [float(x.split("silence_start: ")[1].split()[0]) for x in err.splitlines() if "silence_start" in x]
    en = [float(x.split("silence_end: ")[1].split()[0]) for x in err.splitlines() if "silence_end" in x]
    return list(zip(st, en))


def transcribe(wav, cache):
    if cache.exists():
        return json.loads(cache.read_text())
    from faster_whisper import WhisperModel

    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(wav), "-ar", "16000", "-ac", "1", "-f", "f32le", "-"],
                         capture_output=True).stdout
    a = np.frombuffer(raw, np.float32)
    segs, _ = WhisperModel("medium", compute_type="int8").transcribe(a, language="pt", word_timestamps=True)
    words = [{"w": w.word.strip(), "s": round(w.start, 3), "e": round(w.end, 3)} for s in segs for w in s.words]
    cache.write_text(json.dumps(words, ensure_ascii=False, indent=0))
    return words


def main():
    src = (ROOT / sys.argv[1]).resolve() if not Path(sys.argv[1]).is_absolute() else Path(sys.argv[1])
    wav = src.with_suffix(".raw.wav")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-ar", str(SR), "-ac", "1", "-c:a", "pcm_s24le",
                    str(wav)], check=True)
    words = transcribe(wav, Path(str(src) + ".words.json"))
    got = [norm(w["w"]) for w in words]
    want = [norm(w) for w in SCRIPT]
    assert got == want, f"transcrição difere do roteiro:\n{got}\n{want}"

    a, sr = sf.read(wav, dtype="float32")
    assert sr == SR
    sil = silences(wav)
    # bordas de palavra que vazam para o silêncio são presas às bordas do silêncio
    for w in words:
        for s0, s1 in sil:
            if s0 - 0.05 <= w["s"] < s1 and w["e"] > s1:
                w["s"] = s1
            if s0 < w["e"] <= s1:
                w["e"] = s0
    # cortes: (início do silêncio, fim do silêncio, pausa-alvo)
    cuts = []
    for k in range(1, len(words)):
        gap_target = GAPS.get(k, INNER_MAX)
        a0, a1 = words[k - 1]["e"], words[k]["s"]
        inside = [(s0, s1) for s0, s1 in sil if s0 >= a0 - 0.06 and s1 <= a1 + 0.06]
        if not inside:
            continue
        s0, s1 = max(inside, key=lambda x: x[1] - x[0])
        if s1 - s0 > gap_target + 0.02:
            cuts.append((s0, s1, gap_target))
    pieces, t = [], 0.0
    for s0, s1, g in cuts:
        pieces.append((t, s0 + g / 2))
        t = s1 - g / 2
    pieces.append((t, len(a) / sr))
    fade = int(0.008 * sr)
    out = [np.zeros(int(LEAD * sr), np.float32)]
    placed, pos = [], LEAD
    for p0, p1 in pieces:
        seg = a[int(p0 * sr):int(p1 * sr)].copy()
        seg[:fade] *= np.linspace(0, 1, fade)
        seg[-fade:] *= np.linspace(1, 0, fade)
        out.append(seg)
        placed.append((p0, p1, pos))
        pos += len(seg) / sr
    y = np.concatenate(out)
    sf.write(OUT, y, sr, subtype="PCM_24")

    def m(t):
        for p0, p1, n0 in placed:
            if p0 - 1e-6 <= t <= p1 + 1e-6:
                return n0 + (t - p0)
        best = min(placed, key=lambda r: min(abs(t - r[0]), abs(t - r[1])))
        return best[2] if abs(t - best[0]) < abs(t - best[1]) else best[2] + best[1] - best[0]

    res = [{"w": ref, "s": round(m(w["s"]), 3), "e": round(m(w["e"]), 3)} for w, ref in zip(words, SCRIPT)]
    TIMING.write_text(json.dumps({"source": str(src.relative_to(ROOT)), "duration": round(len(y) / sr, 3), "lead": LEAD,
                                  "natural_duration": round(len(a) / sr, 3), "pieces": placed, "words": res},
                                 ensure_ascii=False, indent=1))
    print(f"natural {len(a) / sr:.2f}s -> editada {len(y) / sr:.2f}s, {len(cuts)} pausas encurtadas, "
          f"fala termina em {res[-1]['e']:.2f}s")


if __name__ == "__main__":
    main()
