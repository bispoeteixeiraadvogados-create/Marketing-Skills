"""Monta index.html do v2 a partir de tools/index_v2.template.html.

Os tempos dos clipes saem dos cortes calculados por gerar_dados_v2.py a partir da fala real e da
rampa de velocidade da queda; as legendas vêm de tools/legendas_v2.html; a linha do tempo
(assets/js/timeline_v2.js) vai embutida no index.html.

Uso: python3 tools/gerar_dados_v2.py && python3 tools/montar_v2.py
"""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
dados_js = (ROOT / "assets/data/dados_v2.js").read_text(encoding="utf-8")
D = json.loads(dados_js[dados_js.index("{") : dados_js.rindex("}") + 1])
C = D["cortes"]
QV = D["queda_video"]
DUR = D["duracao"]

CLIPS = {
    "s1": (0.0, C["c12"] + 0.05),
    "s2": (C["c12"], C["c23"] + 0.3),
    "s3": (C["c23"] + 0.1, C["c34"] + 0.65),
    "s4": (C["c34"], C["c56"] + 0.3),
    "s5": (QV["TILT1"] - 0.15, C["c56"] + 0.3),
    "s6": (C["c56"] - 0.22, C["c67"] + 0.3),
    "s7": (C["c67"] - 0.275, C["c78"] + 0.55),
    "s8": (C["c78"] - 0.025, DUR),
    "dot": (0.0, C["c78"] + 0.97),
    "root": (0.0, DUR),
    "ground": (0.0, DUR),
    "vo": (0.0, DUR),
    "vignette": (0.0, DUR),
    "grain": (0.0, DUR),
}

html = (ROOT / "tools/index_v2.template.html").read_text(encoding="utf-8")
for cid, (a, b) in CLIPS.items():
    pat = re.compile(r'(<(?:section|div|audio) id="' + cid + r'"[^>]*?)data-start="[0-9.]+" data-duration="[0-9.]+"')
    html, n = pat.subn(lambda m: f'{m.group(1)}data-start="{a:.3f}" data-duration="{b - a:.3f}"', html)
    assert n == 1, cid
html = html.replace("<!--LEGENDAS-->", (ROOT / "tools/legendas_v2.html").read_text(encoding="utf-8"))
tl_js = (ROOT / "assets/js/timeline_v2.js").read_text(encoding="utf-8")
tag = '<script src="assets/js/timeline_v2.js"></script>'
assert tag in html
html = html.replace(tag, "<script>\n" + tl_js + "\n    </script>")
(ROOT / "index.html").write_text(html, encoding="utf-8")
for cid, (a, b) in CLIPS.items():
    print(f"{cid:8} {a:7.3f} -> {b:7.3f}")
