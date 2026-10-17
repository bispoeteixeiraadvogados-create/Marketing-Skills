"""Diagnóstico de ritmo e retenção estimada de uma versão do Reel.

Mede no arquivo renderizado:
  - energia de movimento por quadro (diferença média absoluta entre quadros, em cinza, 135 x 240)
  - presença de voz a cada 0,1 s (energia da faixa de voz, limiar relativo ao pico)
  - planos (lista de cortes informada abaixo) e duração média
  - densidade de estímulo por bloco narrativo

E calcula uma curva de retenção ESTIMADA, segundo a segundo, por um modelo heurístico simples.
Não é dado de plataforma: serve só para comparar versões com os mesmos critérios. Premissas:
  perda base 0,8% por segundo dos que ainda assistem;
  gancho: até 30% de perda extra nos 3 primeiros segundos, proporcional ao que falta de
    (voz em até 0,2 s, movimento no 1º segundo, impacto sonoro em até 0,3 s, texto em até 0,5 s);
  plano parado: +0,5% por segundo além de 3,5 s no mesmo plano (até +2,5%);
  pouco estímulo: +1,0% no segundo com movimento abaixo do limiar, +1,5% se também sem voz;
  evento novo (pico de movimento ou corte): -0,3%;
  depois do fim da voz (assinatura): +4% por segundo.

Uso: python3 tools/diagnostico.py v1   (ou v2)
"""

import json
import subprocess
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
V = sys.argv[1] if len(sys.argv) > 1 else "v1"
FPS = 30
W, H = 135, 240

CFG = {
    "v1": {
        "video": ROOT / "bt-reel-divorcio-nao-quer_v1_normal.mp4",
        "voz": ROOT / "assets/audio/narracao_final.wav",
        "mix": ROOT / "assets/audio/mix_v1_normal.wav",
        # trocas de plano: cortes de cena, troca de parte em C7 e fim da inclinação da câmera (C4 para C5)
        "cortes": [4.225, 15.145, 17.5, 26.24, 31.76, 35.69, 42.10, 44.93],
        "blocos": [
            ("Gancho", 0.0, 4.225),
            ("Dois caminhos", 4.225, 15.145),
            ("Pergunta", 15.145, 17.5),
            ("Regra e aliança", 17.5, 26.24),
            ("O que vem junto", 26.24, 31.76),
            ("Mais tempo", 31.76, 35.69),
            ("Cada caso e chamado", 35.69, 44.93),
            ("Assinatura", 44.93, 51.3),
        ],
    },
}
extra = ROOT / f"tools/diagnostico_cfg_{V}.json"
if extra.exists():
    j = json.loads(extra.read_text(encoding="utf-8"))
    CFG[V] = {
        "video": ROOT / j["video"],
        "voz": ROOT / j["voz"],
        "mix": ROOT / j["mix"],
        "cortes": j["cortes"],
        "blocos": [tuple(b) for b in j["blocos"]],
    }
C = CFG[V]


def movimento(path):
    p = subprocess.Popen(
        ["ffmpeg", "-v", "error", "-i", str(path), "-vf", f"scale={W}:{H},format=gray", "-f", "rawvideo", "-"],
        stdout=subprocess.PIPE,
    )
    prev = None
    out = []
    while True:
        b = p.stdout.read(W * H)
        if len(b) < W * H:
            break
        a = np.frombuffer(b, np.uint8).astype(np.float32)
        out.append(0.0 if prev is None else float(np.abs(a - prev).mean()))
        prev = a
    return np.array(out)


def voz_ativa(path, passo=0.1):
    y, sr = sf.read(path, dtype="float64")
    if y.ndim > 1:
        y = y.mean(axis=1)
    n = int(sr * passo)
    k = len(y) // n
    rms = np.sqrt((y[: k * n].reshape(k, n) ** 2).mean(axis=1))
    lim = rms.max() * 10 ** (-32 / 20)
    return rms > lim, passo


def impacto_inicial(path):
    y, sr = sf.read(path, dtype="float64")
    if y.ndim > 1:
        y = y.mean(axis=1)
    pico = np.abs(y).max()
    ini = np.abs(y[: int(0.3 * sr)]).max() if len(y) else 0
    return ini / pico if pico else 0


mad = movimento(C["video"])
dur = len(mad) / FPS
seg = int(np.ceil(dur))
mov_s = np.array([mad[i * FPS : (i + 1) * FPS].mean() if i * FPS < len(mad) else 0 for i in range(seg)])
pico_s = np.array([mad[i * FPS : (i + 1) * FPS].max() if i * FPS < len(mad) else 0 for i in range(seg)])
va, passo = voz_ativa(C["voz"])
voz_s = np.array([va[int(i / passo) : int((i + 1) / passo)].mean() if int(i / passo) < len(va) else 0 for i in range(seg)])

# silêncios de voz maiores que 0,5 s
sil = []
run = 0
for k, a in enumerate(list(va) + [True]):
    if not a:
        run += 1
    else:
        if run * passo >= 0.5:
            sil.append({"ini": round((k - run) * passo, 2), "fim": round(k * passo, 2), "dur": round(run * passo, 2)})
        run = 0
fim_voz = max(i for i, a in enumerate(va) if a) * passo + passo
ini_voz = min(i for i, a in enumerate(va) if a) * passo

cortes = [c for c in C["cortes"] if c < dur]
bordas = [0.0] + cortes + [dur]
planos = [round(b - a, 3) for a, b in zip(bordas[:-1], bordas[1:])]

LIM_PARADO = 0.35  # diferença média por quadro abaixo disto = imagem praticamente parada
LIM_EVENTO = 2.5

# modelo heurístico de retenção
texto_ate = 0.5  # nas duas versões o primeiro texto entra com a primeira palavra
score = [
    1.0 if ini_voz <= 0.2 else max(0.0, 1 - (ini_voz - 0.2) / 0.6),
    min(1.0, mov_s[0] / 1.5),
    min(1.0, impacto_inicial(C["mix"]) / 0.5),
    1.0 if ini_voz <= texto_ate else 0.5,
]
perda_gancho = 0.30 * (1 - float(np.mean(score)))
ret = [100.0]
haz = []
for i in range(seg):
    h = 0.8
    if i < 3:
        h += perda_gancho * 100 / 3
    t_mid = i + 0.5
    ultimo = max([b for b in bordas if b <= t_mid] or [0])
    idade = t_mid - ultimo
    if idade > 3.5:
        h += min(2.5, 0.5 * (idade - 3.5))
    if mov_s[i] < LIM_PARADO:
        h += 1.0 + (1.5 if voz_s[i] < 0.4 else 0)
    evento = pico_s[i] > LIM_EVENTO or any(i <= c < i + 1 for c in cortes)
    if evento:
        h -= 0.3
    if i >= fim_voz:
        h += 4.0
    h = max(0.3, h)
    haz.append(round(h, 2))
    ret.append(ret[-1] * (1 - h / 100))

blocos = []
for nome, a, b in C["blocos"]:
    i0, i1 = int(a * FPS), int(min(b, dur) * FPS)
    m = mad[i0:i1]
    nplan = sum(1 for c in cortes if a <= c < b) + 1
    blocos.append(
        {
            "bloco": nome,
            "ini": a,
            "fim": b,
            "dur": round(b - a, 2),
            "movimento_medio": round(float(m.mean()), 3),
            "fracao_quadros_parados": round(float((m < LIM_PARADO).mean()), 3),
            "picos_de_movimento_por_s": round(float((m > LIM_EVENTO).sum()) / max(0.1, b - a), 2),
            "planos": nplan,
        }
    )

rel = {
    "versao": V,
    "modelo": "heurístico, ver docstring de tools/diagnostico.py; não é dado de plataforma",
    "duracao_s": round(dur, 2),
    "voz": {"inicio_s": round(ini_voz, 2), "fim_s": round(fim_voz, 2), "silencios_maiores_que_0_5s": sil, "silencio_total_s": round(sum(s["dur"] for s in sil), 2)},
    "planos": {"n": len(planos), "duracoes_s": planos, "media_s": round(float(np.mean(planos)), 2), "mediana_s": round(float(np.median(planos)), 2), "maior_s": max(planos)},
    "gancho": {"componentes": dict(zip(["voz_ate_0_2s", "movimento_1o_s", "impacto_ate_0_3s", "texto_ate_0_5s"], [round(x, 2) for x in score])), "perda_extra_estimada_pct": round(perda_gancho * 100, 1)},
    "segundos_parados": [i for i in range(seg) if mov_s[i] < LIM_PARADO],
    "segundos_parados_sem_voz": [i for i in range(seg) if mov_s[i] < LIM_PARADO and voz_s[i] < 0.4],
    "por_segundo": [
        {"s": i, "movimento": round(float(mov_s[i]), 3), "voz": round(float(voz_s[i]), 2), "perda_pct": haz[i], "retencao_pct": round(ret[i + 1], 1)}
        for i in range(seg)
    ],
    "retencao_estimada_final_pct": round(ret[-1], 1),
    "retencao_estimada_3s_pct": round(ret[min(3, len(ret) - 1)], 1),
    "blocos": blocos,
}
out = ROOT / f"tools/diagnostico_{V}.json"
out.write_text(json.dumps(rel, ensure_ascii=False, indent=1), encoding="utf-8")
np.save(ROOT / f"tools/_mad_{V}.npy", mad)
print(json.dumps({k: rel[k] for k in ["duracao_s", "voz", "planos", "gancho", "segundos_parados", "segundos_parados_sem_voz", "retencao_estimada_3s_pct", "retencao_estimada_final_pct"]}, ensure_ascii=False, indent=1))
for b in blocos:
    print(b)
