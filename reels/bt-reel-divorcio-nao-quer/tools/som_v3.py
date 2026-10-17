"""Som da V3: trilha curta e discreta, tensão no gancho, impacto grave moderado na ruptura, contato
metálico no toque das metades e sopros pequenos nas trocas de cena. Tudo sintetizado aqui com NumPy
e SciPy, com semente fixa (nada de banco de sons, nada de rede). As receitas de síntese são as da
V2 (tools/som_v2.py), mais o contato metálico (síntese modal de um aro pequeno).

Trilha (ré menor, resolvendo em fá maior):
  gancho (0 a 1,72 s)       drone grave em ré e tensão crescente (ruído filtrado que sobe)
  ruptura e queda           a trilha corta seco na ruptura; só efeitos até o toque
  do toque à conclusão      pulso dedilhado em colcheias (100 bpm) com o primeiro tempo no toque;
                            os acordes trocam nos cortes de cena (Dm, Bb, F, C, Dm, Bb)
  assinatura                fá maior aberto, some no último segundo
Ducking: 7 dB quando a voz fala (ataque 25 ms, soltura 280 ms) e vale fixo de 3 dB entre 1 e
3,5 kHz. Nível: RMS da trilha 13 dB abaixo do RMS da voz falando (a V2 usava 11 dB).
Versão reduzida: efeitos fortes 6 dB abaixo.

Saídas: assets/audio/mix_v3_normal.wav e mix_v3_reduzido.wav (estéreo, 48 kHz, -16 LUFS,
pico de no máximo -1,5 dBTP), assets/audio/trilha_v3.wav, assets/data/som_v3.json

Uso: python3 tools/som_v3.py
"""

import json
import subprocess
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import butter, fftconvolve, resample_poly, sosfilt

ROOT = Path(__file__).resolve().parent.parent
AUD = ROOT / "assets/audio"
SR = 48000
rng = np.random.default_rng(17102026)
dados_js = (ROOT / "assets/data/dados_v3.js").read_text(encoding="utf-8")
D = json.loads(dados_js[dados_js.index("{") : dados_js.rindex("}") + 1])
CUT = D["cortes"]
AL = D["alianca"]
P = D["palavras"]
DUR = D["duracao"]
N = int(round(DUR * SR))
ti = lambda i: P[i]["ini"]  # noqa: E731
tf = lambda i: P[i]["fim"]  # noqa: E731

T_NAO1, T_BRK, T_HIT = AL["T_NAO1"], AL["T_BRK"], AL["T_HIT"]
T_TENS = T_BRK - 0.2
# toques medidos na simulação da cena 3D (alianca_v3.js, info.eventos): quina, deitada, rebote
TOQUES = json.loads((ROOT / "assets/data/toques_v3.json").read_text(encoding="utf-8"))


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


def tensao_metal(d):
    """rangido curto do metal sob tensão (os 6 quadros antes da ruptura)"""
    t = tt(d + 0.1)
    f = 160 + 120 * np.clip(t / d, 0, 1)
    ph = 2 * np.pi * np.cumsum(f) / SR
    creak = (np.sin(ph) + 0.35 * np.sin(2 * ph) + 0.2 * np.sin(3 * ph)) * np.minimum(1, t / 0.03) * np.exp(-np.clip(t - d, 0, None) / 0.03)
    creak *= 1 + 0.35 * np.sign(np.sin(2 * np.pi * 29 * t))
    c = unit(crack(0.1))
    return unit(creak + 0.5 * np.pad(c, (0, max(0, len(creak) - len(c))))[: len(creak)])


def partida():
    """ruptura: estalo, corpo médio e baque grave moderado"""
    t = tt(0.7)
    tr = hp(rng.standard_normal(len(t)), 2500) * env(t, 0.0003, 0.004)
    tr[int(0.012 * SR) :] = 0
    bn = band(rng.standard_normal(len(t)), 900, 1600) * env(t, 0.002, 0.06)
    f = 68 - 16 * np.clip(t / 0.09, 0, 1)
    thump = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(t, 0.003, 0.13)
    thump[int(0.4 * SR) :] *= np.exp(-np.arange(len(t) - int(0.4 * SR)) / SR / 0.02)
    return 0.9 * unit(tr) + 0.45 * unit(bn) + thump


def kick(f0=120.0, f1=45.0, dec=0.32):
    t = tt(0.7)
    f = f1 + (f0 - f1) * np.exp(-t / 0.035)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(t, 0.002, dec)
    click = hp(rng.standard_normal(len(t)), 3000) * env(t, 0.0002, 0.003)
    return unit(body + 0.25 * unit(click))


def tink(f0=1850.0, brilho=1.0, d=0.6):
    """contato metálico: modos inarmônicos de um aro pequeno, transiente curto, sem estilhaço"""
    t = tt(d)
    modos = [(1.0, 1.0, 0.32), (2.32, 0.55, 0.19), (3.91, 0.32 * brilho, 0.11), (5.6, 0.18 * brilho, 0.07)]
    s = sum(a * np.sin(2 * np.pi * f0 * r * t + r) * env(t, 0.0004, dec) for r, a, dec in modos)
    s += 0.25 * hp(rng.standard_normal(len(t)), 5000) * env(t, 0.0002, 0.0025)
    return unit(s)


def whoosh(d, f_ini, f_pico, f_fim, pico=0.5):
    t = tt(d)
    x = rng.standard_normal(len(t))
    k = t / d
    fc = np.where(k < pico, f_ini * (f_pico / f_ini) ** (k / pico), f_pico * (f_fim / f_pico) ** ((k - pico) / (1 - pico)))
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
    t = tt(1.2)
    return unit((np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2 * f * t) + 0.12 * np.sin(2 * np.pi * 3.01 * f * t)) * env(t, 0.002, 0.36))


def tensao(d):
    """tensão do gancho: ruído em banda que sobe, com um tom que sobe uma quarta"""
    t = tt(d)
    k = t / d
    x = rng.standard_normal(len(t))
    y = np.zeros_like(x)
    blk = int(0.01 * SR)
    zi = None
    for a in range(0, len(x), blk):
        c = 400 * (2600 / 400) ** k[a]
        sos = butter(2, [c / 1.5, min(SR / 2 - 100, c * 1.5)], btype="band", fs=SR, output="sos")
        if zi is None:
            zi = np.zeros((sos.shape[0], 2))
        y[a : a + blk], zi = sosfilt(sos, x[a : a + blk], zi=zi)
    f = 146.8 * 2 ** (5 * k / 12)
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.4
    return unit((unit(y) + tone) * (0.15 + 0.85 * k**1.8))


# ------------------------------------------------------------------ trilha (estéreo)
NOTE = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "Bb": 10, "B": 11}


def hz(n, octv):
    return 440.0 * 2 ** ((NOTE[n] + 12 * (octv + 1) - 69) / 12)


CHORDS = {"Dm": ["D", "F", "A"], "Bb": ["Bb", "D", "F"], "F": ["F", "A", "C"], "C": ["C", "E", "G"]}


def ks(f, d, bright=0.5):
    n = int(d * SR)
    p = int(SR / f)
    buf = lp(rng.standard_normal(p + 1), 2000 + 4000 * bright, order=2)
    y = np.zeros(n)
    y[: p + 1] = buf
    for i in range(p + 1, n):
        y[i] = 0.996 * 0.5 * (y[i - p] + y[i - p - 1])
    return y * env(np.arange(n) / SR, 0.002, d / 2.5)


def saw(f, t):
    return 2 * ((f * t) % 1.0) - 1


def pad_voice(f, d):
    t = tt(d)
    s = sum(saw(f * 2 ** (c / 1200), t + 0.13 * i) for i, c in enumerate([-7, 0, 7]))
    s = lp(s, 900, order=2)
    return s * np.minimum(1, t / 0.5) * np.minimum(1, (d - t) / 0.8).clip(0, 1)


def reverb_ir(rt=2.2):
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
    # gancho: drone em ré, corta seco na ruptura
    drone = (np.sin(2 * np.pi * hz("D", 2) * t_all) + 0.5 * np.sin(2 * np.pi * hz("A", 2) * t_all) + 0.25 * np.sin(2 * np.pi * hz("D", 3) * t_all * 1.002)) / 1.75
    drone *= np.clip(t_all / 0.02, 0, 1) * (t_all < T_BRK)
    L += 0.45 * drone
    R += 0.45 * drone
    # acordes nos cortes de cena, do toque ao fim
    prog = [(T_HIT, "Dm"), (CUT["c34"], "Bb"), (CUT["c45"], "F"), (ti(26) - 0.15, "C"), (CUT["c56"], "Dm"), (ti(40) - 0.1, "Bb"), (CUT["c67"], "F")]
    for j, (a, ch) in enumerate(prog):
        b = prog[j + 1][0] if j + 1 < len(prog) else DUR
        d = (b - a + 0.9) if j + 1 < len(prog) else DUR - a
        for i, n in enumerate(CHORDS[ch]):
            v = pad_voice(hz(n, 3 if i else 2) * (1 if i else 2), d)
            pan = [-0.4, 0.4, 0.0][i]
            put(L, v, a, 0.12 * (1 - pan))
            put(R, v, a, 0.12 * (1 + pan))
        sub = np.sin(2 * np.pi * hz(CHORDS[ch][0], 1) * 2 * tt(d)) * np.minimum(1, tt(d) / 0.4) * np.minimum(1, (d - tt(d)) / 0.8).clip(0, 1)
        put(L, sub, a, 0.16)
        put(R, sub, a, 0.16)
    # pulso dedilhado em colcheias (100 bpm): primeiro tempo no toque, para na assinatura
    step = 0.3
    x = T_HIT
    k = 0
    while x < CUT["c67"] - 0.05:
        ch = [c for a, c in prog if a <= x + 1e-6][-1]
        notas = CHORDS[ch]
        n = notas[[0, 2, 1, 2][k % 4]]
        s = ks(hz(n, 3 if k % 4 == 0 else 4), 0.8, bright=0.3 + 0.1 * (k % 2))
        pan = 0.32 if k % 2 else -0.32
        g = 0.2 if k % 4 == 0 else 0.13
        put(L, s, x, g * (1 - pan))
        put(R, s, x, g * (1 + pan))
        x += step
        k += 1
    # nota alta final, aberta
    s = ks(hz("A", 4), 3.0, bright=0.3)
    put(L, s, CUT["c67"] + 0.3, 0.15)
    put(R, s, CUT["c67"] + 0.3, 0.15)
    irL, irR = reverb_ir()
    L = L + 0.5 * fftconvolve(L, irL)[:N]
    R = R + 0.5 * fftconvolve(R, irR)[:N]
    # silêncio entre a ruptura e o toque (a cauda do drone corta seco)
    gate = np.ones(N)
    a = int(T_BRK * SR)
    b = int(T_HIT * SR)
    gate[a:b] = 0
    L *= gate
    R *= gate
    f0 = int((DUR - 1.0) * SR)
    fade = np.linspace(1, 0, N - f0) ** 1.5
    L[f0:] *= fade
    R[f0:] *= fade
    L = L - 0.3 * band(L, 1000, 3500, order=2)
    R = R - 0.3 * band(R, 1000, 3500, order=2)
    return L, R


# ------------------------------------------------------------------ voz e ducking
voz, sr = sf.read(AUD / "narracao_final_v3.wav", dtype="float64")
if voz.ndim > 1:
    voz = voz.mean(axis=1)
if sr != SR:
    voz = resample_poly(voz, SR // 1000 * 10, sr // 100)
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
ativo = np.clip((20 * np.log10(ev / PICO_VOZ + 1e-9) + 40) / 15, 0, 1)
DUCK_DB = -7.0
duck = 10 ** (DUCK_DB * ativo / 20)

# ------------------------------------------------------------------ lista de efeitos
qA = TOQUES["A"]
qB = TOQUES["B"]
EFEITOS = [
    # nome, instante, nível dB em relação ao pico da voz, sinal, forte
    ("gancho_baque", 0.0, -12, kick(105, 42, 0.34), True),
    ("gancho_fissura", 0.02, -21, crack(0.05), False),
    ("tensao", 0.0, -19, tensao(T_TENS + 0.05), False),
    ("nao_fissura", T_NAO1 - 0.01, -14, crack(0.09, body_amp=0.7), False),
    ("tensao_metal", T_TENS, -13, tensao_metal(T_BRK - T_TENS), False),
    ("ruptura", T_BRK, -9, partida(), True),
    ("queda", T_BRK + 0.12, -18, whoosh(T_HIT - T_BRK - 0.1, 2400, 1500, 300, 0.4), True),
    ("toque_grave", qA["quina"], -9, kick(92, 40, 0.3), True),
    ("toque_A", qA["quina"], -21, tink(1850, 1.0), True),
    ("deita_A", qA["deita"], -25, tink(1630, 0.6, 0.4), False),
    ("toque_B", qB["quina"], -22, tink(2040, 0.9), True),
    ("deita_B", qB["deita"], -26, tink(1720, 0.5, 0.4), False),
    ("rebote_A", qA["rebote"], -27, tink(1850, 0.4, 0.25), False),
    ("rebote_B", qB["rebote"], -28, tink(2040, 0.4, 0.25), False),
    ("sopro_comparacao", CUT["c23"] - 0.2, -24, whoosh(0.45, 260, 1600, 400, 0.5), False),
    ("sopro_foto", CUT["c34"] - 0.12, -19, whoosh(0.4, 300, 2200, 500, 0.45), True),
    ("corte_foto2", ti(20) - 0.04, -26, tick(1900), False),
    ("corte_filhos", CUT["c45"], -21, kick(110, 55, 0.12), False),
    ("corte_alimentos", ti(24) - 0.1, -22, kick(115, 58, 0.12), False),
    ("corte_bens", ti(25) - 0.1, -21, kick(110, 55, 0.12), False),
    ("sopro_lista", ti(26) - 0.2, -20, whoosh(0.42, 320, 2000, 450, 0.45), True),
    ("iris", CUT["c56"] - 0.12, -19, whoosh(0.5, 200, 1200, 260, 0.6), True),
    ("veto", ti(37) - 0.03, -16, kick(85, 38, 0.36), True),
    ("assinatura", ti(45) + 0.25, -22, sino(1046.5), False),
]


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
a, b = int(T_HIT * SR), int(CUT["c67"] * SR)
fala = voz[a:b][ativo[a:b] > 0.5]
MUS_G = 10 ** ((rms_db(fala) - 13 - rms_db((TRILHA[0][a:b] + TRILHA[1][a:b]) / 2)) / 20)
m_band = band((TRILHA[0] + TRILHA[1]) / 2 * duck * MUS_G, 300, 3400)
v_band = band(voz, 300, 3400)
sel = ativo > 0.5
snr = rms_db(v_band[sel]) - rms_db(m_band[sel])
print(f"voz sobre a trilha, banda 300 a 3400 Hz, durante a fala: {snr:.1f} dB")
sf.write(AUD / "trilha_v3.wav", (np.stack(TRILHA, axis=1) * MUS_G).astype(np.float32), SR, subtype="PCM_24")

relatorio = {"voz_sobre_trilha_db": round(snr, 1), "ducking_db": DUCK_DB, "ganho_trilha": round(float(MUS_G), 4), "toques": TOQUES}
for nome, red in [("normal", False), ("reduzido", True)]:
    y, rel = mix(red)
    tmp = AUD / f"_tmp_v3_{nome}.wav"
    sf.write(tmp, y.astype(np.float32), SR, subtype="FLOAT")
    med = loudnorm(tmp, AUD / f"mix_v3_{nome}.wav")
    tmp.unlink()
    relatorio[nome] = {"efeitos": rel, "medicao": med}
    print(nome, med)
(ROOT / "assets/data/som_v3.json").write_text(json.dumps(relatorio, ensure_ascii=False, indent=1), encoding="utf-8")
