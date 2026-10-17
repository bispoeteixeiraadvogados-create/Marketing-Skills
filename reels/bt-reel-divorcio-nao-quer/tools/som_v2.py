"""Som do v2: trilha sintetizada com arco emocional, ducking sob a voz e efeitos nas viradas.

Tudo é gerado aqui com NumPy e SciPy, com semente fixa (nada de banco de sons, nada de rede).

Trilha (ré menor, resolvendo em fá maior):
  gancho e "Dois caminhos"   drone grave em ré e pulso de cordas dedilhadas (Karplus-Strong)
  pergunta                   a trilha some 0,4 s antes de "Mas e se" (silêncio estratégico)
  regra e aliança            drone e riser que cresce até a partida e corta seco nela
  queda                      só efeitos (vento da queda e impacto)
  "O que vem junto" ao fim   pad quente (Dm, Bb, F, C...) com dedilhado leve, abre na virada
                             "Cada caso" e resolve em fá maior na assinatura
Ducking: a trilha desce até 7 dB quando a voz fala (envelope da voz, ataque 25 ms, soltura
280 ms) e tem um vale fixo de 3 dB na faixa de 1 a 3,5 kHz, onde a voz precisa de espaço.
Efeitos: impacto no quadro 0, em "agora", no corte seco, em "não?" e em "advogado"; whoosh no
chicote para o bloco 2, na queda e no chicote para "Mais tempo"; tique nos rótulos, na lista e
em cada passo pela metade; os estalos da aliança são os mesmos do v1 (tools/som.py).
Versão reduzida: efeitos fortes 6 dB abaixo.

Saídas: assets/audio/mix_v2_normal.wav e mix_v2_reduzido.wav (estéreo, 48 kHz, -16 LUFS,
pico de no máximo -1,5 dBTP), assets/audio/trilha_v2.wav, assets/data/som_v2.json

Uso: python3 tools/som_v2.py
"""

import json
import subprocess
import unicodedata
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import butter, fftconvolve, sosfilt

ROOT = Path(__file__).resolve().parent.parent
AUD = ROOT / "assets/audio"
SR = 48000
rng = np.random.default_rng(19102026)
dados_js = (ROOT / "assets/data/dados_v2.js").read_text(encoding="utf-8")
D = json.loads(dados_js[dados_js.index("{") : dados_js.rindex("}") + 1])
K = D["const"]
CUT = D["cortes"]
QV = D["queda_video"]
DUR = D["duracao"]
N = int(round(DUR * SR))


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


ini = lambda s, k=1: word(s, k)["ini"]
fim = lambda s, k=1: word(s, k)["fim"]
T_R1, T_R2, T_R3, T0 = ini("discordância"), ini("por"), ini("não", 4), ini("impede")


def tt(d):
    return np.arange(int(d * SR)) / SR


def band(x, lo, hi, order=4):
    return sosfilt(butter(order, [lo, hi], btype="band", fs=SR, output="sos"), x)


def hp(x, f, order=4):
    return sosfilt(butter(order, f, btype="high", fs=SR, output="sos"), x)


def lp(x, f, order=4):
    return sosfilt(butter(order, f, btype="low", fs=SR, output="sos"), x)


def env(t, attack, decay):
    return np.minimum(1, t / max(attack, 1e-4)) * np.exp(-t / decay)


def unit(x):
    m = np.abs(x).max()
    return x / m if m else x


# ------------------------------------------------------------------ efeitos (mono)
def crack(dur, body=700.0, body_amp=0.6):
    t = tt(dur + 0.08)
    n = band(rng.standard_normal(len(t)), 1800, 4000)
    n = n / np.abs(n).max() * env(t, 0.0008, dur / 4)
    return n + np.sin(2 * np.pi * body * t) * env(t, 0.001, 0.035) * body_amp


def r3():
    t = tt(0.42)
    c = np.pad(crack(0.14), (0, 0))
    c = np.pad(c, (0, len(t) - len(c)))
    f = 180 - 90 * np.clip(t / 0.2, 0, 1)
    ph = 2 * np.pi * np.cumsum(f) / SR
    creak = (np.sin(ph) + 0.35 * np.sin(2 * ph) + 0.2 * np.sin(3 * ph)) * env(t, 0.01, 0.12)
    creak *= 1 + 0.3 * np.sign(np.sin(2 * np.pi * 38 * t))
    return c + 0.7 * creak


def partida():
    t = tt(0.6)
    tr = hp(rng.standard_normal(len(t)), 2500) * env(t, 0.0003, 0.004)
    tr[int(0.012 * SR) :] = 0
    bn = band(rng.standard_normal(len(t)), 900, 1600) * env(t, 0.002, 0.06)
    bn[int(0.18 * SR) :] *= np.exp(-np.arange(len(t) - int(0.18 * SR)) / SR / 0.01)
    f = 70 - 15 * np.clip(t / 0.08, 0, 1)
    thump = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(t, 0.003, 0.11)
    thump[int(0.35 * SR) :] *= np.exp(-np.arange(len(t) - int(0.35 * SR)) / SR / 0.02)
    return 0.9 * unit(tr) + 0.45 * unit(bn) + thump


def knock(t, amp):
    return amp * (np.sin(2 * np.pi * 2400 * t) + 0.7 * np.sin(2 * np.pi * 3900 * t)) * env(t, 0.0005, 0.055)


def impacto(delay_b):
    t = tt(0.9)
    f = 75 - 15 * np.clip(t / 0.08, 0, 1)
    thump = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(t, 0.003, 0.14)
    thump[int(0.45 * SR) :] *= np.exp(-np.arange(len(t) - int(0.45 * SR)) / SR / 0.02)
    k2 = np.zeros_like(t)
    th2 = np.zeros_like(t)
    i = int(delay_b * SR)
    k2[i:] = knock(t[: len(t) - i], 0.28)
    th2[i:] = 0.45 * thump[: len(t) - i]
    return thump + th2 + knock(t, 0.55) + k2


def kick(f0=120.0, f1=45.0, dec=0.32):
    """batida grave de virada: seno com queda de afinação e um clique curto"""
    t = tt(0.7)
    f = f1 + (f0 - f1) * np.exp(-t / 0.035)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(t, 0.002, dec)
    click = hp(rng.standard_normal(len(t)), 3000) * env(t, 0.0002, 0.003)
    return unit(body + 0.25 * unit(click))


def whoosh(d, f_ini, f_pico, f_fim, pico=0.5):
    """sopro: ruído em banda que varre a frequência, com envelope em sino"""
    t = tt(d)
    x = rng.standard_normal(len(t))
    k = t / d
    fc = np.where(k < pico, f_ini * (f_pico / f_ini) ** (k / pico), f_pico * (f_fim / f_pico) ** ((k - pico) / (1 - pico)))
    # filtro passa-banda variável em blocos de 10 ms
    y = np.zeros_like(x)
    blk = int(0.01 * SR)
    zi = None
    for a in range(0, len(x), blk):
        c = fc[a]
        sos = butter(2, [max(60, c / 1.8), min(SR / 2 - 100, c * 1.8)], btype="band", fs=SR, output="sos")
        if zi is None or zi.shape[0] != sos.shape[0]:
            zi = np.zeros((sos.shape[0], 2))
        y[a : a + blk], zi = sosfilt(sos, x[a : a + blk], zi=zi)
    e = np.where(k < pico, (k / pico) ** 2, ((1 - k) / (1 - pico)) ** 1.6)
    return unit(y * e)


def tick(f=2600.0, d=0.06):
    t = tt(d)
    return unit(np.sin(2 * np.pi * f * t) * env(t, 0.0005, 0.012) + 0.3 * hp(rng.standard_normal(len(t)), 4000) * env(t, 0.0002, 0.002))


def sino(f=1046.5):
    t = tt(0.9)
    return unit((np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2 * f * t) + 0.12 * np.sin(2 * np.pi * 3.01 * f * t)) * env(t, 0.002, 0.28))


def riser(d):
    t = tt(d)
    k = t / d
    x = rng.standard_normal(len(t))
    y = np.zeros_like(x)
    blk = int(0.01 * SR)
    zi = None
    for a in range(0, len(x), blk):
        c = 300 * (3200 / 300) ** k[a]
        sos = butter(2, [c / 1.5, min(SR / 2 - 100, c * 1.5)], btype="band", fs=SR, output="sos")
        if zi is None:
            zi = np.zeros((sos.shape[0], 2))
        y[a : a + blk], zi = sosfilt(sos, x[a : a + blk], zi=zi)
    f = 110 * 2 ** (2 * k)
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.35
    return unit((unit(y) + tone) * (0.02 + 0.98 * k**2.2))


# ------------------------------------------------------------------ trilha (estéreo)
NOTE = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "Bb": 10, "B": 11}


def hz(n, octv):
    return 440.0 * 2 ** ((NOTE[n] + 12 * (octv + 1) - 69) / 12)


CHORDS = {
    "Dm": ["D", "F", "A"],
    "Bb": ["Bb", "D", "F"],
    "F": ["F", "A", "C"],
    "C": ["C", "E", "G"],
}


def ks(f, d, bright=0.5):
    """corda dedilhada (Karplus-Strong), suave"""
    n = int(d * SR)
    p = int(SR / f)
    buf = lp(rng.standard_normal(p + 1), 2000 + 4000 * bright, order=2)
    y = np.zeros(n)
    y[: p + 1] = buf
    dec = 0.996
    for i in range(p + 1, n):
        y[i] = dec * 0.5 * (y[i - p] + y[i - p - 1])
    return y * env(np.arange(n) / SR, 0.002, d / 2.5)


def saw(f, t):
    ph = (f * t) % 1.0
    return 2 * ph - 1


def pad_voice(f, d):
    t = tt(d)
    s = sum(saw(f * 2 ** (c / 1200), t + 0.13 * i) for i, c in enumerate([-7, 0, 7]))
    s = lp(s, 900, order=2)
    a = np.minimum(1, t / 0.7) * np.minimum(1, (d - t) / 1.1).clip(0, 1)
    return s * a


def reverb_ir(rt=2.4):
    t = tt(rt)
    L = lp(rng.standard_normal(len(t)), 5000) * np.exp(-6.9 * t / rt)
    R = lp(rng.standard_normal(len(t)), 5000) * np.exp(-6.9 * t / rt)
    return unit(L) * 0.25, unit(R) * 0.25


def put(dst, sig, at, gain=1.0):
    i = int(round(at * SR))
    if i >= len(dst):
        return
    if i < 0:
        sig = sig[-i:]
        i = 0
    n = min(len(sig), len(dst) - i)
    dst[i : i + n] += gain * sig[:n]


def trilha():
    L = np.zeros(N)
    R = np.zeros(N)
    t_all = np.arange(N) / SR
    # drone em ré (gancho até a partida), com respiro grave
    d_end = T0
    drone = (np.sin(2 * np.pi * hz("D", 2) * t_all) + 0.5 * np.sin(2 * np.pi * hz("A", 2) * t_all) + 0.25 * np.sin(2 * np.pi * hz("D", 3) * t_all * 1.002)) / 1.75
    drone *= 0.8 + 0.2 * np.sin(2 * np.pi * 0.23 * t_all)
    g = np.clip(t_all / 0.03, 0, 1) * (t_all < d_end)
    drone *= g
    L += 0.5 * drone
    R += 0.5 * drone
    # pulso dedilhado em ré menor, colcheias a 100 bpm, do gancho ao fim de "Dois caminhos"
    step = 0.3
    seq = ["D", "A", "F", "A", "D", "A", "E", "A"]
    tt0 = 0.0
    k = 0
    while tt0 < CUT["c23"] - 0.4:
        n = seq[k % len(seq)]
        o = 3 if n != "D" or k % 4 else 3
        s = ks(hz(n, o), 0.9, bright=0.35 + 0.1 * (k % 2))
        pan = 0.35 if k % 2 else -0.35
        put(L, s, tt0, 0.22 * (1 - pan))
        put(R, s, tt0, 0.22 * (1 + pan))
        tt0 += step
        k += 1
    # pad e dedilhado leve da catarse
    prog = [
        (21.6, "Dm"),
        (24.2, "Bb"),
        (CUT["c56"], "F"),
        (29.4, "C"),
        (CUT["c67"], "Dm"),
        (33.6, "Bb"),
        (35.9, "F"),
        (ini("converse") - 0.1, "C"),
        (CUT["c78"], "F"),
    ]
    for j, (a, ch) in enumerate(prog):
        b = prog[j + 1][0] if j + 1 < len(prog) else DUR
        d = b - a + 1.2
        if j == len(prog) - 1:
            d = DUR - a
        for i, n in enumerate(CHORDS[ch]):
            v = pad_voice(hz(n, 3 if i else 2) * (1 if i else 2), d)
            pan = [-0.4, 0.4, 0.0][i]
            put(L, v, a, 0.13 * (1 - pan))
            put(R, v, a, 0.13 * (1 + pan))
        sub = np.sin(2 * np.pi * hz(CHORDS[ch][0], 1) * 2 * tt(d)) * np.minimum(1, tt(d) / 0.8) * np.minimum(1, (d - tt(d)) / 1.0).clip(0, 1)
        put(L, sub, a, 0.18)
        put(R, sub, a, 0.18)
        # dedilhado em semínimas (só depois de "Mais tempo", para empurrar até o chamado)
        if a >= CUT["c56"] - 0.1 and j < len(prog) - 1:
            q = 0.6
            x = a
            m = 0
            while x < b - 0.05:
                n = CHORDS[ch][m % 3]
                s = ks(hz(n, 4), 1.2, bright=0.25)
                pan = 0.3 if m % 2 else -0.3
                put(L, s, x, 0.12 * (1 - pan))
                put(R, s, x, 0.12 * (1 + pan))
                x += q
                m += 1
    # acorde final em fá maior, mais aberto, com uma nota alta
    s = ks(hz("A", 4), 3.5, bright=0.3)
    put(L, s, CUT["c78"] + 0.3, 0.16)
    put(R, s, CUT["c78"] + 0.3, 0.16)
    # silêncio estratégico antes da pergunta e corte seco na partida
    mute = np.ones(N)
    a, b = int((ini("mas") - 0.4) * SR), int(ini("mas") * SR)
    mute[a:b] = np.linspace(1, 0, b - a) ** 2
    mute[b : int((ini("mas") + 0.25) * SR)] = 0
    c = int((ini("mas") + 0.25) * SR)
    mute[c : int((ini("mas") + 0.9) * SR)] = np.linspace(0, 1, int((ini("mas") + 0.9) * SR) - c)
    L *= mute
    R *= mute
    # reverberação
    irL, irR = reverb_ir()
    wetL = fftconvolve(L, irL)[:N]
    wetR = fftconvolve(R, irR)[:N]
    L = L + 0.55 * wetL
    R = R + 0.55 * wetR
    # nada de trilha entre a partida e o primeiro toque, volta macia depois
    gate = np.ones(N)
    a = int(T0 * SR)
    b = int((QV["T_A"] + 0.3) * SR)
    gate[a:b] = 0
    c = int((QV["T_A"] + 0.3) * SR)
    e = int(21.6 * SR)
    if e > c:
        gate[c:e] = np.linspace(0, 1, e - c) ** 2
    L *= gate
    R *= gate
    # fim: some nos últimos 1,2 s
    f0 = int((DUR - 1.2) * SR)
    fade = np.linspace(1, 0, N - f0) ** 1.5
    L[f0:] *= fade
    R[f0:] *= fade
    # vale fixo na faixa da voz
    L = L - 0.3 * band(L, 1000, 3500, order=2)
    R = R - 0.3 * band(R, 1000, 3500, order=2)
    return L, R


# ------------------------------------------------------------------ voz e ducking
voz, sr = sf.read(AUD / "narracao_final_v2.wav", dtype="float64")
assert sr == SR
if voz.ndim > 1:
    voz = voz.mean(axis=1)
voz = np.pad(voz, (0, max(0, N - len(voz))))[:N]
PICO_VOZ = np.abs(voz).max()


def envelope(x, atk=0.025, rel=0.28):
    a = np.abs(x)
    blk = int(0.005 * SR)
    m = a[: len(a) // blk * blk].reshape(-1, blk).max(axis=1)
    out = np.zeros_like(m)
    ca = np.exp(-0.005 / atk)
    cr = np.exp(-0.005 / rel)
    v = 0.0
    for i, s in enumerate(m):
        c = ca if s > v else cr
        v = c * v + (1 - c) * s
        out[i] = v
    e = np.repeat(out, blk)
    return np.pad(e, (0, len(x) - len(e)), mode="edge")


ev = envelope(voz)
ativo = np.clip((20 * np.log10(ev / PICO_VOZ + 1e-9) + 40) / 15, 0, 1)  # 0 em -40 dB, 1 a partir de -25 dB
DUCK_DB = -7.0
duck = 10 ** (DUCK_DB * ativo / 20)

# ------------------------------------------------------------------ lista de efeitos
HOPS = [(ini("processo"), 0.3), (ini("pode", 2), 0.22), (ini("levar"), 0.22), (ini("mais"), 0.22), (ini("tempo"), 0.2), (ini("tempo") + 0.24, 0.2)]
tI = [D["palavras"][[norm(w["texto"]) for w in D["palavras"]].index("guarda") - 1]["ini"], ini("a", 3), ini("a", 4)]
W0 = CUT["c56"] - 0.2
EFEITOS = [
    # nome, instante, nível dB em relação ao pico da voz, sinal, forte
    ("gancho_kick", 0.0, -7, kick(110, 42, 0.36), True),
    ("gancho_trac", 0.0, -13, crack(0.07, body_amp=0.7), False),
    ("agora_kick", ini("agora") - 0.03, -11, kick(100, 45, 0.3), True),
    ("agora_trac", ini("agora") - 0.02, -19, crack(0.05), False),
    ("corte_kick", CUT["c12"], -9, kick(120, 48, 0.3), True),
    ("whoosh_bloco2", CUT["b2"] - 0.05, -17, whoosh(0.5, 300, 2400, 500, 0.45), True),
    ("juiz", ini("juiz") - 0.02, -17, kick(90, 40, 0.22), False),
    ("nao_kick", ini("não", 3), -9, kick(105, 40, 0.42), True),
    ("riser", CUT["c34"], -15, riser(T0 - CUT["c34"]), False),
    ("rotulo1", T_R1 + 0.12, -24, tick(2200), False),
    ("rotulo2", T_R2 + 0.12, -24, tick(2400), False),
    ("r1", T_R1, -18, crack(0.055), False),
    ("r2", T_R2, -14, crack(0.09, body_amp=0.7), False),
    ("r3", T_R3, -10, r3(), True),
    ("partida", T0, -6, partida(), True),
    ("vento_queda", T0 + 0.2, -13, whoosh(QV["T_A"] - T0 - 0.15, 2600, 1400, 260, 0.35), True),
    ("impacto", QV["T_A"], -8, impacto(QV["T_B"] - QV["T_A"]), True),
    ("lista1", tI[0], -23, tick(2000), False),
    ("lista2", tI[1], -23, tick(2150), False),
    ("lista3", tI[2], -23, tick(2300), False),
    ("whoosh_tempo", W0 - 0.04, -14, whoosh(0.5, 280, 2600, 450, 0.5), True),
]
for k, (h0, hd) in enumerate(HOPS[:5]):
    EFEITOS.append((f"passo{k + 1}", h0 + hd, -19, tick(1800 * 2 ** (k * 2 / 12)), False))
EFEITOS.append(("chegada", HOPS[5][0] + HOPS[5][1], -21, sino(1046.5), False))
EFEITOS.append(("realidade", ini("realidade") - 0.03, -16, kick(80, 38, 0.4), False))
EFEITOS.append(("advogado_kick", ini("advogado") - 0.02, -10, kick(100, 42, 0.42), True))


def mix(reduzido):
    mL, mR = TRILHA
    L = voz.copy()
    R = voz.copy()
    L += mL * duck * MUS_G
    R += mR * duck * MUS_G
    rel = {}
    for nome, at, db, sig, forte in EFEITOS:
        s = unit(sig) * PICO_VOZ * 10 ** (db / 20)
        if reduzido and forte:
            s *= 10 ** (-6 / 20)
        put(L, s, at)
        put(R, s, at)
        rel[nome] = {"t": round(at, 3), "db": db - (6 if reduzido and forte else 0)}
    return np.stack([L, R], axis=1), rel


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
    return [ln.strip() for ln in m.splitlines() if ln.strip().startswith(("I:", "Peak:"))][-2:]


def rms_db(x):
    return 20 * np.log10(np.sqrt((x**2).mean()) + 1e-12)


TRILHA = trilha()
# nível da trilha: no trecho de catarse, RMS da trilha (sem ducking) 11 dB abaixo do RMS da voz falando
a, b = int(21.6 * SR), int(40.0 * SR)
fala = voz[a:b][ativo[a:b] > 0.5]
MUS_G = 10 ** ((rms_db(fala) - 11 - rms_db((TRILHA[0][a:b] + TRILHA[1][a:b]) / 2)) / 20)

# conferência: voz sobre a trilha (com ducking) na faixa da fala, durante a fala
m_band = band((TRILHA[0] + TRILHA[1]) / 2 * duck * MUS_G, 300, 3400)
v_band = band(voz, 300, 3400)
sel = ativo > 0.5
snr = rms_db(v_band[sel]) - rms_db(m_band[sel])
print(f"voz sobre a trilha, banda 300 a 3400 Hz, durante a fala: {snr:.1f} dB")
sf.write(AUD / "trilha_v2.wav", (np.stack(TRILHA, axis=1) * MUS_G).astype(np.float32), SR, subtype="PCM_24")

relatorio = {"voz_sobre_trilha_db": round(snr, 1), "ducking_db": DUCK_DB, "ganho_trilha": round(float(MUS_G), 4)}
for nome, red in [("normal", False), ("reduzido", True)]:
    y, rel = mix(red)
    tmp = AUD / f"_tmp_v2_{nome}.wav"
    sf.write(tmp, y.astype(np.float32), SR, subtype="FLOAT")
    med = loudnorm(tmp, AUD / f"mix_v2_{nome}.wav")
    tmp.unlink()
    relatorio[nome] = {"efeitos": rel, "medicao": med}
    print(nome, med)
(ROOT / "assets/data/som_v2.json").write_text(json.dumps(relatorio, ensure_ascii=False, indent=1), encoding="utf-8")
