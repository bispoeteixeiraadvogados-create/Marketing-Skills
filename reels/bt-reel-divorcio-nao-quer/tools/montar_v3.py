"""Monta index.html da V3 a partir de tools/index_v3.template.html.

Os tempos dos clipes saem dos cortes e das palavras de assets/data/dados_v3.js (gerado por
gerar_dados_v3.py a partir da fala real); a linha do tempo (assets/js/timeline_v3.js) vai embutida.

Uso: python3 tools/gerar_dados_v3.py && python3 tools/montar_v3.py
"""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
dados_js = (ROOT / "assets/data/dados_v3.js").read_text(encoding="utf-8")
D = json.loads(dados_js[dados_js.index("{") : dados_js.rindex("}") + 1])
C = D["cortes"]
P = D["palavras"]
DUR = D["duracao"]
ti = lambda i: P[i]["ini"]  # noqa: E731

C5D = round(ti(26) - 0.15, 3)  # empurrão lateral para o complemento
CLIPS = {
    "s3d": (0.0, C["c34"] + 0.06),
    "s4": (C["c34"], C["c45"] + 0.02),
    "s5a": (C["c45"], ti(24) - 0.1),
    "s5b": (ti(24) - 0.1, ti(25) - 0.1),
    "s5c": (ti(25) - 0.1, C5D + 0.4),
    "s5d": (C5D, C["c56"] + 0.15),
    "s6": (C["c56"] - 0.1, C["c67"] + 0.45),
    "s7": (C["c67"] - 0.15, DUR),
    "root": (0.0, DUR),
    "ground": (0.0, DUR),
    "vo": (0.0, DUR),
    "vignette": (0.0, DUR),
}

html = (ROOT / "tools/index_v3.template.html").read_text(encoding="utf-8")
for cid, (a, b) in CLIPS.items():
    pat = re.compile(r'(<(?:section|div|audio) id="' + cid + r'"[^>]*?)data-start="[0-9.]+" data-duration="[0-9.]+"')
    html, n = pat.subn(lambda m: f'{m.group(1)}data-start="{a:.3f}" data-duration="{b - a:.3f}"', html)
    assert n == 1, cid
tl_js = (ROOT / "assets/js/timeline_v3.js").read_text(encoding="utf-8")
tag = '<script src="assets/js/timeline_v3.js"></script>'
assert tag in html
html = html.replace(tag, "<script>\n" + tl_js + "\n    </script>")
(ROOT / "index.html").write_text(html, encoding="utf-8")
for cid, (a, b) in CLIPS.items():
    print(f"{cid:8} {a:7.3f} -> {b:7.3f}")
