"""Dados de tempo da V3, a partir de assets/data/words_v3.json.

Na V3 o texto da tela é a própria narração (tipografia animada palavra a palavra), então não há
uma faixa de legenda separada que repita o título. O .srt continua sendo gerado, com uma frase por
bloco, para a publicação (legenda fechada do Instagram) e para conferência.

Saídas:
  assets/data/dados_v3.js                  palavras, frases, cortes de cena e duração
  bt-reel-divorcio-nao-quer_v3.srt         legenda com os tempos reais

Uso: python3 tools/gerar_dados_v3.py
"""

import json
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
W = json.loads((ROOT / "assets/data/words_v3.json").read_text(encoding="utf-8"))["palavras"]
M = json.loads((ROOT / "assets/data/montagem_faixa_v3.json").read_text(encoding="utf-8"))
DURACAO = M["duracao_total"]
FRASES = M["segmentos"]


def norm(s):
    s = unicodedata.normalize("NFD", s)
    return "".join(c for c in s if unicodedata.category(c) != "Mn").lower().strip(".,?!:;")


def word(txt, k=1):
    n = 0
    for w in W:
        if norm(w["texto"]) == norm(txt):
            n += 1
            if n == k:
                return w
    raise KeyError(txt)


def entre(a, b):
    """meio do silêncio entre o fim da frase a e o início da frase b"""
    return round((FRASES[a]["final_fim"] + FRASES[b]["final_ini"]) / 2, 3)


# cortes de cena (no meio dos respiros da fala)
CORTES = {
    "c23": entre(1, 2),  # resposta -> comparação (a cena 3D continua, troca o texto)
    "c34": entre(3, 4),  # comparação -> fotografia (sai a cena 3D)
    "c45": entre(4, 5),  # fotografia -> questões relacionadas
    "c56": entre(6, 7),  # questões -> conclusão no azul
    "c67": entre(8, 9),  # conclusão -> assinatura
}

# instantes da aliança, presos à fala
ALIANCA = {
    "T_NAO1": word("não", 1)["ini"],  # a fissura dá um salto no primeiro "não"
    "T_BRK": round(word("divórcio", 1)["ini"] + 0.04, 3),  # ruptura no início de "divórcio"
    "T_HIT": round(word("não", 2)["ini"] + 0.05, 3),  # primeiro toque no chão, junto do "NÃO" da resposta
}

def ts(x):
    ms = int(round(x * 1000))
    return f"{ms // 3600000:02}:{ms // 60000 % 60:02}:{ms // 1000 % 60:02},{ms % 1000:03}"


srt = []
for k, f in enumerate(FRASES):
    srt.append(f"{k + 1}\n{ts(f['final_ini'])} --> {ts(f['final_fim'])}\n{f['texto']}\n")
(ROOT / "bt-reel-divorcio-nao-quer_v3.srt").write_text("\n".join(srt), encoding="utf-8")

dados = {
    "versao": "v3",
    "palavras": [{"i": i, "texto": w["texto"], "ini": w["ini"], "fim": w["fim"], "frase": w["frase"]} for i, w in enumerate(W)],
    "frases": [{"i": f["i"], "texto": f["texto"], "ini": f["final_ini"], "fim": f["final_fim"]} for f in FRASES],
    "cortes": CORTES,
    "alianca": ALIANCA,
    "duracao": DURACAO,
}
(ROOT / "assets/data/dados_v3.js").write_text(
    "// gerado por tools/gerar_dados_v3.py a partir de assets/data/words_v3.json. Não editar à mão.\n"
    "window.BT_DADOS = " + json.dumps(dados, ensure_ascii=False) + ";\n",
    encoding="utf-8",
)
print("duração", DURACAO, "cortes", CORTES, "aliança", ALIANCA)
