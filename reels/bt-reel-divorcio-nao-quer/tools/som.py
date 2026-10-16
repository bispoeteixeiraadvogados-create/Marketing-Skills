"""Efeitos sintetizados da sequência da aliança (seção 11) e mixagem final.

Nada de banco de sons: tudo é gerado com NumPy e SciPy, com semente fixa.
Níveis em relação ao pico da voz: R1 -18 dB, R2 -14 dB, R3 -10 dB, partida -6 dB, impacto -8 dB.
A versão de movimento reduzido abaixa em 6 dB os efeitos mais fortes (R3, partida e impacto).

Saídas em assets/audio: sfx_*.wav, mix_v1_normal.wav, mix_v1_reduzido.wav (já em -16 LUFS,
pico de no máximo -1,5 dBTP, medidos com o loudnorm do FFmpeg em duas passagens).

Uso: python3 tools/som.py
"""

import json
import subprocess
import unicodedata
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt

ROOT = Path(__file__).resolve().parent.parent
AUD = ROOT / "assets/audio"
SR = 48000
rng = np.random.default_rng(19102026)
dados_js = (ROOT / "assets/data/dados.js").read_text(encoding="utf-8")
D = json.loads(dados_js[dados_js.index("{") : dados_js.rindex("}") + 1])
K = D["const"]


def norm(s):
    s = unicodedata.normalize("NFD", s.lower())
    return "".join(c for c in s if c.isalnum() and not unicodedata.combining(c))


def word(txt, k=1):
    n = 0
    for w in D["palavras"]:
        if norm(w["texto"]) == norm(txt):
            n += 1
            if n == k:
                return w
    raise KeyError(txt)


T_R1 = word("discordância")["ini"]
T_R2 = word("por")["ini"]
T_R3 = word("não", 4)["ini"]
T0 = word("impede")["ini"]
T_A = T0 + K["QUEDA"]
T_B = T_A + K["TOQUE_B"]


def tt(d):
    return np.arange(int(d * SR)) / SR


def band(x, lo, hi, order=4):
    return sosfilt(butter(order, [lo, hi], btype="band", fs=SR, output="sos"), x)


def hp(x, f):
    return sosfilt(butter(4, f, btype="high", fs=SR, output="sos"), x)


def env(t, attack, decay):
    return np.minimum(1, t / max(attack, 1e-4)) * np.exp(-t / decay)


def crack(dur, body=700.0, body_amp=0.6):
    """estalo seco: ruído filtrado entre 1,8 e 4 kHz e um corpo ressonante perto de 700 Hz"""
    t = tt(dur + 0.08)
    n = band(rng.standard_normal(len(t)), 1800, 4000)
    n = n / np.abs(n).max() * env(t, 0.0008, dur / 4)
    b = np.sin(2 * np.pi * body * t) * env(t, 0.001, 0.035) * body_amp
    return n + b


def r3():
    t = tt(0.42)
    c = crack(0.14)
    c = np.pad(c, (0, len(t) - len(c)))
    # ranger grave que desce de 180 para 90 Hz em 200 ms
    f = 180 - 90 * np.clip(t / 0.2, 0, 1)
    ph = 2 * np.pi * np.cumsum(f) / SR
    creak = (np.sin(ph) + 0.35 * np.sin(2 * ph) + 0.2 * np.sin(3 * ph)) * env(t, 0.01, 0.12)
    creak *= 1 + 0.3 * np.sign(np.sin(2 * np.pi * 38 * t))
    return c + 0.7 * creak


def partida():
    t = tt(0.6)
    tr = hp(rng.standard_normal(len(t)), 2500) * env(t, 0.0003, 0.004)  # transiente de 12 ms
    tr[int(0.012 * SR) :] = 0
    bn = band(rng.standard_normal(len(t)), 900, 1600) * env(t, 0.002, 0.06)  # banda em 1,2 kHz
    bn[int(0.18 * SR) :] *= np.exp(-np.arange(len(t) - int(0.18 * SR)) / SR / 0.01)
    f = 70 - 15 * np.clip(t / 0.08, 0, 1)
    thump = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(t, 0.003, 0.11)  # golpe grave em 55 Hz
    thump[int(0.35 * SR) :] *= np.exp(-np.arange(len(t) - int(0.35 * SR)) / SR / 0.02)
    return 0.9 * tr / np.abs(tr).max() + 0.45 * bn / np.abs(bn).max() + 1.0 * thump


def knock(t, amp):
    return amp * (np.sin(2 * np.pi * 2400 * t) + 0.7 * np.sin(2 * np.pi * 3900 * t)) * env(t, 0.0005, 0.22 / 4)


def impacto(delay_b):
    t = tt(0.9)
    f = 75 - 15 * np.clip(t / 0.08, 0, 1)
    thump = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(t, 0.003, 0.14)  # golpe grave em 60 Hz, 450 ms
    thump[int(0.45 * SR) :] *= np.exp(-np.arange(len(t) - int(0.45 * SR)) / SR / 0.02)
    k1 = knock(t, 0.55)
    k2 = np.zeros_like(t)
    i = int(delay_b * SR)
    k2[i:] = knock(t[: len(t) - i], 0.28)  # a segunda batida, mais fraca, no toque da outra metade
    th2 = np.zeros_like(t)
    th2[i:] = 0.45 * thump[: len(t) - i]
    return thump + th2 + k1 + k2


voz, sr = sf.read(AUD / "narracao_final.wav", dtype="float64")
assert sr == SR, sr
if voz.ndim > 1:
    voz = voz.mean(axis=1)
PICO_VOZ = np.abs(voz).max()

EFEITOS = [
    # nome, instante, nível relativo ao pico da voz (dB), sinal, forte
    ("r1", T_R1, -18, crack(0.055), False),
    ("r2", T_R2, -14, crack(0.09, body_amp=0.7), False),
    ("r3", T_R3, -10, r3(), True),
    ("partida", T0, -6, partida(), True),
    ("impacto", T_A, -8, impacto(T_B - T_A), True),
]


def colocar(dst, sig, at):
    i = int(round(at * SR))
    n = min(len(sig), len(dst) - i)
    dst[i : i + n] += sig[:n]


def mix(reduzido):
    y = voz.copy()
    rel = {}
    for nome, at, db, sig, forte in EFEITOS:
        s = sig / np.abs(sig).max() * PICO_VOZ * 10 ** (db / 20)
        if reduzido and forte:
            s *= 10 ** (-6 / 20)
        sf.write(AUD / f"sfx_{nome}.wav", (sig / np.abs(sig).max() * 0.9).astype(np.float32), SR, subtype="PCM_24")
        colocar(y, s, at)
        rel[nome] = db - (6 if reduzido and forte else 0)
    return y, rel


def mascaramento():
    """compara a energia da voz e da partida na banda da fala, durante a palavra 'impede'"""
    w = word("impede")
    a, b = int(w["ini"] * SR), int(w["fim"] * SR)
    s = EFEITOS[3][3]
    s = s / np.abs(s).max() * PICO_VOZ * 10 ** (-6 / 20)
    pad = np.zeros_like(voz)
    colocar(pad, s, T0)
    v = band(voz, 300, 3400)[a:b]
    e = band(pad, 300, 3400)[a:b]
    return 10 * np.log10((v**2).mean() / max((e**2).mean(), 1e-12))


def loudnorm(src, dst):
    cmd = ["ffmpeg", "-hide_banner", "-nostats", "-y", "-i", str(src), "-af", "loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"]
    out = subprocess.run(cmd, capture_output=True, text=True).stderr
    j = json.loads(out[out.rindex("{") : out.rindex("}") + 1])
    flt = (
        f"loudnorm=I=-16:TP=-1.5:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:"
        f"measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true"
    )
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(src), "-af", flt + ",aresample=48000", "-c:a", "pcm_s24le", str(dst)], check=True)
    m = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(dst), "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
    linhas = [ln.strip() for ln in m.splitlines() if ln.strip().startswith(("I:", "Peak:"))]
    return linhas[-2:]


snr = mascaramento()
print(f"voz sobre o efeito da partida, banda 300 a 3400 Hz, durante 'impede': {snr:.1f} dB")
relatorio = {"tempos": {"R1": T_R1, "R2": T_R2, "R3": T_R3, "partida": T0, "impacto_A": T_A, "impacto_B": T_B}, "voz_sobre_partida_db": round(snr, 1)}
for nome, red in [("normal", False), ("reduzido", True)]:
    y, rel = mix(red)
    tmp = AUD / f"_tmp_{nome}.wav"
    sf.write(tmp, y.astype(np.float32), SR, subtype="FLOAT")
    med = loudnorm(tmp, AUD / f"mix_v1_{nome}.wav")
    tmp.unlink()
    relatorio[nome] = {"niveis_db_rel_pico_voz": rel, "medicao": med}
    print(nome, rel, med)
(ROOT / "assets/data/som.json").write_text(json.dumps(relatorio, ensure_ascii=False, indent=1), encoding="utf-8")
