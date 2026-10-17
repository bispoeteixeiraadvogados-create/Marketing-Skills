"""Dados de tempo do v2, a partir de assets/data/words_v2.json.

Saídas:
  assets/data/dados_v2.js                    palavras, legendas, cortes, rampa de velocidade da queda
  bt-reel-divorcio-nao-quer_v2.srt           legenda final com os tempos reais
  tools/legendas_v2.html                     marcação das legendas (injetada por montar_v2.py)

Uso: python3 tools/gerar_dados_v2.py
"""

import json
import unicodedata
from pathlib import Path

import numpy as np
from scipy.interpolate import PchipInterpolator

ROOT = Path(__file__).resolve().parent.parent
VERSAO = "v2"
W = json.loads((ROOT / "assets/data/words_v2.json").read_text(encoding="utf-8"))["palavras"]
DURACAO = json.loads((ROOT / "assets/data/montagem_faixa_v2.json").read_text(encoding="utf-8"))["duracao_total"]

# mesmos blocos do v1 (molde do SRT provisório); depois de "#" vêm as palavras-chave do bloco,
# que ficam destacadas na legenda depois de faladas
BLOCOS = [
    "Seu cônjuge não quer se divorciar. # não quer",
    "E agora? # agora",
    "Existem dois caminhos. # dois caminhos",
    "No divórcio consensual, os dois|concordam com o fim do casamento. # consensual concordam",
    "No litigioso, os dois não|chegam a um acordo, # litigioso",
    "e quem decide é o juiz. # juiz",
    "Mas e se o outro disser não? # não",
    "A discordância do outro cônjuge,|por si só, não impede o divórcio. # não impede",
    "O que pode gerar discussão|é o que vem junto. # vem junto",
    "A guarda dos filhos, a pensão|e a divisão dos bens. # guarda pensão bens",
    "E, quando há discussão, o processo|pode levar mais tempo. # mais tempo",
    "Cada caso tem a sua realidade. # realidade",
    "A orientação depende|dos documentos # documentos",
    "e da situação|de cada pessoa. # situação",
    "Converse com um advogado|antes de decidir. # advogado",
]

# física da aliança: os mesmos alvos do v1 (a simulação é a mesma); o que muda é a velocidade com
# que ela é tocada (rampa abaixo)
CONST = {
    "FPS": 30,
    "QUEDA": 2.80,
    "TOQUE_B": 0.15,
    "PERMANENCIA": 0.80,
    "INCLINACAO": 1.10,
    "ASSENTA": 0.30,
}

# rampa de velocidade da queda (speed ramp): pares (tempo do vídeo depois da partida, tempo da
# simulação depois da partida). Velocidade normal na partida, até cerca de 3x no meio da queda,
# um pouco abaixo de 1x no impacto (leitura do toque), depois rápida na permanência e na inclinação.
# 5,25 s de simulação viram cerca de 3,1 s de vídeo.
B_TA = CONST["QUEDA"]
B_H0 = B_TA + 0.55
B_TILT0 = B_H0 + CONST["PERMANENCIA"]
B_TILT1 = B_TILT0 + CONST["INCLINACAO"]
RAMPA = [(0.0, 0.0), (0.35, 0.35), (0.7, 0.8), (1.35, 2.55), (1.78, B_TA + 0.15), (2.06, B_H0), (2.38, B_TILT0), (3.1, B_TILT1)]


def norm(s):
    s = unicodedata.normalize("NFD", s.lower())
    return "".join(c for c in s if c.isalnum() and not unicodedata.combining(c))


def word(txt, k=1):
    n = 0
    for w in W:
        if norm(w["texto"]) == norm(txt):
            n += 1
            if n == k:
                return w
    raise KeyError((txt, k))


ini = lambda txt, k=1: word(txt, k)["ini"]
fim = lambda txt, k=1: word(txt, k)["fim"]

# rampa: tabela a 240 amostras por segundo de vídeo
u_pts = np.array([p[0] for p in RAMPA])
b_pts = np.array([p[1] for p in RAMPA])
pchip = PchipInterpolator(u_pts, b_pts)
U_MAX = u_pts[-1]
TAB_DT = 1 / 240
u_tab = np.arange(0, U_MAX + 1e-9, TAB_DT)
b_tab = pchip(u_tab)
assert np.all(np.diff(b_tab) > 0)


def u_de_b(b):
    """tempo de vídeo (depois da partida) em que a simulação chega a b."""
    return float(np.interp(b, b_tab, u_tab)) if b <= b_tab[-1] else float(U_MAX + (b - b_tab[-1]))


T0 = ini("impede")
QUEDA_V = {
    "T_A": round(T0 + u_de_b(B_TA), 4),
    "T_B": round(T0 + u_de_b(B_TA + CONST["TOQUE_B"]), 4),
    "H0": round(T0 + u_de_b(B_H0), 4),
    "TILT0": round(T0 + u_de_b(B_TILT0), 4),
    "TILT1": round(T0 + u_de_b(B_TILT1), 4),
    "VEL_MAX": round(float(np.max(np.diff(b_tab) / TAB_DT)), 3),
}

REV = round(fim("não", 3) + 0.025, 3)
CORTES = {
    "c12": round(ini("existem") - 0.06, 3),  # corte seco do gancho para "Dois caminhos"
    "b1": round(ini("no", 1) - 0.15, 3),  # aproximação do bloco 1
    "b2": round(ini("no", 2) - 0.22, 3),  # chicote vertical para o bloco 2
    "c23": round(fim("juiz") + 0.15, 3),  # saída de "Dois caminhos", silêncio antes da pergunta
    "c34": REV,
    "fim_legenda_c4": round(fim("divórcio", 2) + 0.05, 3),  # a legenda sai antes de as metades chegarem à faixa dela
    "c56": round(ini("quando") - 0.35, 3),  # chicote vertical para "Mais tempo"
    "c67": round(ini("cada", 1) - 0.3, 3),
    "p7": round(fim("pessoa") + 0.02, 3),  # troca de parte em C7
    "c78": round(fim("decidir") + 0.12, 3),
}


def cena_limite(s):
    lims = sorted(v for k, v in CORTES.items() if k not in ("b1", "b2") and v > s + 0.05)
    return lims[0] if lims else DURACAO


def escuro(s):
    return s < CORTES["c12"] or (CORTES["c34"] <= s < CORTES["fim_legenda_c4"]) or (CORTES["c67"] <= s < CORTES["c78"])


blocos = []
i = 0
for b in BLOCOS:
    txt, kws = b.split(" # ")
    kw = [norm(x) for x in kws.split()]
    linhas = []
    chaves = []
    for ln in txt.split("|"):
        idx = []
        for tok in ln.split():
            assert norm(tok) == norm(W[i]["texto"]), (tok, W[i])
            idx.append(i)
            if norm(tok) in kw:
                chaves.append(i)
                kw.remove(norm(tok))
            i += 1
        linhas.append(idx)
    assert not kw, (b, kw)
    blocos.append({"linhas": linhas, "chaves": chaves})
assert i == len(W)

for k, b in enumerate(blocos):
    i0 = b["linhas"][0][0]
    i1 = b["linhas"][-1][-1]
    s = round(W[i0]["ini"] - 0.06, 3)
    nxt = blocos[k + 1] if k + 1 < len(blocos) else None
    nxt_s = W[nxt["linhas"][0][0]]["ini"] - 0.06 if nxt else DURACAO
    e = min(W[i1]["fim"] + 0.45, nxt_s - 0.02, cena_limite(s) - 0.02)
    b.update({"ini": s, "fim": round(e, 3), "escuro": escuro(s)})


def ts(x):
    ms = int(round(x * 1000))
    return f"{ms // 3600000:02}:{ms // 60000 % 60:02}:{ms // 1000 % 60:02},{ms % 1000:03}"


srt = []
html = []
for k, b in enumerate(blocos):
    txt = "\n".join(" ".join(W[j]["texto"] for j in ln) for ln in b["linhas"])
    srt.append(f"{k + 1}\n{ts(b['ini'])} --> {ts(b['fim'])}\n{txt}\n")
    lns = "".join(
        '<span class="ln">'
        + " ".join(f'<span id="cw-{j}" class="cw{" ck" if j in b["chaves"] else ""}">{W[j]["texto"]}</span>' for j in ln)
        + "</span>"
        for ln in b["linhas"]
    )
    html.append(
        f'<div id="cap-{k}" class="cap clip {"cap-dark" if b["escuro"] else "cap-light"}" '
        f'data-start="{b["ini"]:.3f}" data-duration="{b["fim"] - b["ini"]:.3f}" data-track-index="10">'
        f'<span class="cap-rule"></span><div id="ct-{k}" class="cap-text">{lns}</div></div>'
    )

(ROOT / f"bt-reel-divorcio-nao-quer_{VERSAO}.srt").write_text("\n".join(srt), encoding="utf-8")
(ROOT / "tools/legendas_v2.html").write_text("\n      ".join(html), encoding="utf-8")
dados = {
    "versao": VERSAO,
    "palavras": W,
    "legendas": blocos,
    "const": CONST,
    "cortes": CORTES,
    "queda_video": QUEDA_V,
    "rampa": {"dt": TAB_DT, "b": [round(float(x), 5) for x in b_tab]},
    "duracao": DURACAO,
}
(ROOT / "assets/data/dados_v2.js").write_text(
    "// gerado por tools/gerar_dados_v2.py a partir de assets/data/words_v2.json. Não editar à mão.\n"
    "window.BT_DADOS = " + json.dumps(dados, ensure_ascii=False) + ";\n",
    encoding="utf-8",
)
print("duração", DURACAO)
print("cortes", CORTES)
print("queda (tempo de vídeo)", QUEDA_V, "partida", T0)
for k, b in enumerate(blocos):
    print(k + 1, b["ini"], b["fim"], "escuro" if b["escuro"] else "claro", " / ".join(" ".join(W[j]["texto"] for j in ln) for ln in b["linhas"]), "| chaves:", [W[j]["texto"] for j in b["chaves"]])
