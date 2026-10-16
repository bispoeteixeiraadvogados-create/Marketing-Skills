"""Gera os dados de tempo do Reel a partir de assets/data/words.json.

Saídas:
  assets/data/dados.js                       palavras, blocos de legenda e constantes (para a composição)
  bt-reel-divorcio-nao-quer_v1.srt           legenda final com os tempos reais
  tools/legendas.html                        marcação das legendas, injetada no index.html por montar.py

Uso: python3 tools/gerar_dados.py
"""

import json
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VERSAO = "v1"
W = json.loads((ROOT / "assets/data/words.json").read_text(encoding="utf-8"))["palavras"]

# Blocos copiados do SRT provisório (molde de blocos e quebras). Linhas separadas por "|".
BLOCOS = [
    "Seu cônjuge não quer se divorciar.",
    "E agora?",
    "Existem dois caminhos.",
    "No divórcio consensual, os dois|concordam com o fim do casamento.",
    "No litigioso, os dois não|chegam a um acordo,",
    "e quem decide é o juiz.",
    "Mas e se o outro disser não?",
    "A discordância do outro cônjuge,|por si só, não impede o divórcio.",
    "O que pode gerar discussão|é o que vem junto.",
    "A guarda dos filhos, a pensão|e a divisão dos bens.",
    "E, quando há discussão, o processo|pode levar mais tempo.",
    "Cada caso tem a sua realidade.",
    "A orientação depende|dos documentos",
    "e da situação|de cada pessoa.",
    "Converse com um advogado|antes de decidir.",
]

# Constantes de projeto (seção 10.6 do prompt). A física usa estes alvos.
CONST = {
    "FPS": 30,
    "QUEDA": 2.80,  # da partida ao primeiro toque no chão (2,6 a 3,0 s)
    "TOQUE_B": 0.15,  # a segunda metade toca 0,12 a 0,18 s depois
    "PERMANENCIA": 0.80,  # câmera parada olhando as metades em repouso
    "INCLINACAO": 1.10,  # câmera sobe e inclina até a vista de cima
    "ASSENTA": 0.30,  # do primeiro toque até as duas metades pararem
}


def norm(s):
    s = unicodedata.normalize("NFD", s.lower())
    return "".join(c for c in s if c.isalnum() and not unicodedata.combining(c))


def t(txt, k=1):
    n = 0
    for w in W:
        if norm(w["texto"]) == norm(txt):
            n += 1
            if n == k:
                return w
    raise KeyError((txt, k))


# Cortes de cena (mesma lógica da composição, para que a legenda nunca atravesse uma troca)
REV = round(t("não", 3)["fim"] + 0.025, 3)  # revelação circular C3 para C4
CORTES = {
    "c12": round(t("existem")["ini"] - 0.215, 3),
    "c23": round(t("juiz")["fim"] + 0.5, 3),
    "c34": REV,
    "fim_legenda_c4": round(t("divórcio", 2)["fim"] + 0.3, 3),
    "c56": round(t("quando")["ini"] - 0.4, 3),
    "c67": round(t("cada", 1)["ini"] - 0.35, 3),
    "c78": round(t("decidir")["fim"] + 0.12, 3),
}
DURACAO = 51.3


def cena_limite(s):
    """próximo corte depois do instante s."""
    lims = sorted(v for v in CORTES.values() if v > s + 0.05)
    return lims[0] if lims else DURACAO


def escuro(s):
    return (CORTES["c34"] <= s < CORTES["fim_legenda_c4"]) or (CORTES["c67"] <= s < CORTES["c78"])


blocos = []
i = 0
for b in BLOCOS:
    linhas = []
    for ln in b.split("|"):
        idx = []
        for tok in ln.split():
            assert norm(tok) == norm(W[i]["texto"]), (tok, W[i])
            idx.append(i)
            i += 1
        linhas.append(idx)
    blocos.append({"linhas": linhas})
assert i == len(W), (i, len(W))

for k, b in enumerate(blocos):
    i0 = b["linhas"][0][0]
    i1 = b["linhas"][-1][-1]
    s = round(W[i0]["ini"] - 0.05, 3)
    nxt = blocos[k + 1] if k + 1 < len(blocos) else None
    nxt_s = W[nxt["linhas"][0][0]]["ini"] - 0.05 if nxt else DURACAO
    e = min(W[i1]["fim"] + 0.5, nxt_s - 0.02, cena_limite(s) - 0.02)
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
        '<span class="ln">' + " ".join(f'<span id="cw-{j}">{W[j]["texto"]}</span>' for j in ln) + "</span>"
        for ln in b["linhas"]
    )
    html.append(
        f'<div id="cap-{k}" class="cap clip {"cap-dark" if b["escuro"] else "cap-light"}" '
        f'data-start="{b["ini"]:.3f}" data-duration="{b["fim"] - b["ini"]:.3f}" data-track-index="10">'
        f'<span class="cap-rule"></span><div id="ct-{k}" class="cap-text">{lns}</div></div>'
    )

(ROOT / f"bt-reel-divorcio-nao-quer_{VERSAO}.srt").write_text("\n".join(srt), encoding="utf-8")
(ROOT / "tools/legendas.html").write_text("\n      ".join(html), encoding="utf-8")
dados = {
    "palavras": W,
    "legendas": blocos,
    "const": CONST,
    "cortes": CORTES,
    "duracao": DURACAO,
}
(ROOT / "assets/data/dados.js").write_text(
    "// gerado por tools/gerar_dados.py a partir de assets/data/words.json. Não editar à mão.\n"
    "window.BT_DADOS = " + json.dumps(dados, ensure_ascii=False) + ";\n",
    encoding="utf-8",
)
print("cortes", CORTES)
for k, b in enumerate(blocos):
    print(k + 1, b["ini"], b["fim"], "escuro" if b["escuro"] else "claro", " / ".join(" ".join(W[j]["texto"] for j in ln) for ln in b["linhas"]))
