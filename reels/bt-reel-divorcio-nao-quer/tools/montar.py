"""Monta index.html a partir de tools/index.template.html.

Os tempos dos clipes (cenas, bolinha) saem dos cortes calculados por gerar_dados.py a partir da
fala real, e as legendas vêm de tools/legendas.html. Nenhum tempo de cena fica fixo no template.

Uso: python3 tools/gerar_dados.py && python3 tools/montar.py
"""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
dados_js = (ROOT / "assets/data/dados.js").read_text(encoding="utf-8")
D = json.loads(dados_js[dados_js.index("{") : dados_js.rindex("}") + 1])
C = D["cortes"]
K = D["const"]
DUR = D["duracao"]


def ini(txt, k=1):
    import unicodedata

    def norm(s):
        s = unicodedata.normalize("NFD", s.lower())
        return "".join(ch for ch in s if ch.isalnum() and not unicodedata.combining(ch))

    n = 0
    for w in D["palavras"]:
        if norm(w["texto"]) == norm(txt):
            n += 1
            if n == k:
                return w["ini"]
    raise KeyError(txt)


T0 = ini("impede")
TILT1 = T0 + K["QUEDA"] + 0.55 + K["PERMANENCIA"] + K["INCLINACAO"]
CLIPS = {
    "s1": (0.0, C["c12"] + 0.3),
    "s2": (C["c12"] - 0.275, C["c23"] + 0.15),
    "s3": (C["c23"] - 0.145, C["c34"] + 0.65),
    "s4": (C["c34"], C["c56"] + 0.35),
    "s5": (TILT1 - 0.15, C["c56"] + 0.3),
    "s6": (C["c56"] - 0.275, C["c67"] + 0.3),
    "s7": (C["c67"] - 0.275, C["c78"] + 0.55),
    "s8": (C["c78"] - 0.025, DUR),
    "dot": (0.0, C["c78"] + 0.97),
}

html = (ROOT / "tools/index.template.html").read_text(encoding="utf-8")
for cid, (a, b) in CLIPS.items():
    pat = re.compile(r'(<(?:section|div) id="' + cid + r'"[^>]*?)data-start="[0-9.]+" data-duration="[0-9.]+"')
    html, n = pat.subn(lambda m: f'{m.group(1)}data-start="{a:.3f}" data-duration="{b - a:.3f}"', html)
    assert n == 1, cid
html = html.replace("<!--LEGENDAS-->", (ROOT / "tools/legendas.html").read_text(encoding="utf-8"))
# a linha do tempo vai embutida no index.html (o lint do HyperFrames procura o registro ali)
tl_js = (ROOT / "assets/js/timeline.js").read_text(encoding="utf-8")
tag = '<script src="assets/js/timeline.js"></script>'
assert tag in html
html = html.replace(tag, "<script>\n" + tl_js + "\n    </script>")
(ROOT / "index.html").write_text(html, encoding="utf-8")
for cid, (a, b) in CLIPS.items():
    print(f"{cid:4} {a:7.3f} -> {b:7.3f}")
