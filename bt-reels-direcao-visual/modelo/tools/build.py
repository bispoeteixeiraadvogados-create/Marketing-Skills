"""Monta index.html da v004 a partir do template e de tools/timing.json.

1. Converte os tempos dos clipes (cenas, bolinha, duração total) da locução de referência
   para a locução final, pelas âncoras de timing.json.
2. Injeta as mesmas âncoras na animação (função T do template).
3. Gera as legendas queimadas e o .srt a partir dos tempos por palavra da locução final.
"""

import json
import re
from pathlib import Path

ROOT = Path(__file__).parent.parent
CFG = json.loads((ROOT / "tools" / "timing.json").read_text(encoding="utf-8"))
ANCH = CFG["anchors"]


def T(t):
    for i in range(1, len(ANCH)):
        a, b = ANCH[i - 1], ANCH[i]
        if t <= b[0] or i == len(ANCH) - 1:
            return a[1] + (t - a[0]) * (b[1] - a[1]) / ((b[0] - a[0]) or 1)
    return t


# ---------- legendas
W = json.loads(Path(CFG["words"]).read_text(encoding="utf-8"))
for w in W:
    for a, b in CFG["silences"]:
        if a <= w["s"] < b:
            w["s"] = b
        elif w["s"] < a and w["e"] > b:
            if (w["e"] - b) >= (a - w["s"]):
                w["s"] = b
            else:
                w["e"] = a
        if a < w["e"] <= b:
            w["e"] = a

caps = []
i = 0
for blk in CFG["blocks"]:
    words = []
    for li, line in enumerate(blk.split("|")):
        for tok in line.split():
            ww = W[i]
            i += 1
            words.append({"t": tok, "s": round(ww["s"], 3), "e": round(ww["e"], 3), "line": li})
    caps.append({"words": words, "s": words[0]["s"], "e": words[-1]["e"]})
assert i == len(W), (i, len(W))

OLD_CUTS = [0.0, 3.36, 4.3, 8.2, 22.8, 26.75, 30.6, 34.25, 38.6]
CUTS = [round(T(c), 3) for c in OLD_CUTS]
DARK = [False, False, False, True, False, False, True, True]


def scene_at(t):
    for k in range(len(CUTS) - 1):
        if CUTS[k] <= t < CUTS[k + 1]:
            return k
    return len(CUTS) - 2


markup, tweens, srt = [], [], []


def ts(x):
    ms = int(round(x * 1000))
    return f"{ms // 3600000:02}:{ms // 60000 % 60:02}:{ms // 1000 % 60:02},{ms % 1000:03}"


for k, b in enumerate(caps):
    nxt = caps[k + 1]["s"] if k + 1 < len(caps) else CUTS[-1]
    end = min(nxt - 0.04, b["e"] + 0.5) if k + 1 < len(caps) else b["e"] + 0.36
    sc = scene_at(b["s"])
    end = min(end, CUTS[sc + 1] - 0.02) if k + 1 < len(caps) else end
    b["end"] = round(end, 3)
    dark = DARK[sc]
    on, base = ("#D4AF7C", "#FAF8F4") if dark else ("#214D8C", "#202631")
    lines = {}
    for j, w in enumerate(b["words"]):
        lines.setdefault(w["line"], []).append(f'<span id="cw-{k}-{j}">{w["t"]}</span>')
    inner = "".join(f'<span class="ln">{" ".join(v)}</span>' for _, v in sorted(lines.items()))
    markup.append(
        f'<div id="cap-{k}" class="cap clip {"cap-dark" if dark else "cap-light"}" '
        f'data-start="{b["s"]:.3f}" data-duration="{end - b["s"]:.3f}" data-track-index="10">'
        f'<span class="cap-rule"></span><div id="ct-{k}" class="cap-text">{inner}</div></div>'
    )
    tweens.append(f'RAW.fromTo("#ct-{k}", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.15, ease: "none" }}, {b["s"]:.3f});')
    for j, w in enumerate(b["words"]):
        off = b["words"][j + 1]["s"] if j + 1 < len(b["words"]) else end
        tweens.append(f'RAW.set("#cw-{k}-{j}", {{ color: "{on}" }}, {w["s"]:.3f});')
        if off < end - 0.01:
            tweens.append(f'RAW.set("#cw-{k}-{j}", {{ color: "{base}" }}, {off:.3f});')
    txt = "\n".join(
        " ".join(w["t"] for w in b["words"] if w["line"] == li) for li in sorted({w["line"] for w in b["words"]})
    )
    srt.append(f"{k + 1}\n{ts(b['s'])} --> {ts(end)}\n{txt}\n")

# ---------- template
html = (ROOT / "tools" / "index.template.html").read_text(encoding="utf-8")
TOTAL = round(T(38.6), 3)


def remap_clip(m):
    start, dur = float(m.group(2)), float(m.group(3))
    s2 = T(start)
    # a cena que sai fica 0,3 s a mais, até a seguinte terminar o dissolve
    e2 = min(T(start + dur) + (0.3 if m.group(0).find('id="dot"') < 0 else 0), T(38.6))
    return f'{m.group(1)}data-start="{s2:.3f}" data-duration="{e2 - s2:.3f}"'


html = re.sub(
    r'(<(?:section|div) id="(?:s[1-8]|dot)"[^>]*?)data-start="([0-9.]+)" data-duration="([0-9.]+)"', remap_clip, html
)
html = html.replace('data-duration="38.6"', f'data-duration="{TOTAL}"')
html = re.sub(
    r'src="assets/audio/BT_pensao18_locucao_takeB.wav"(\s+)data-start="0"(\s+)data-duration="[0-9.]+"',
    lambda m: f'src="{CFG["audio"]}"{m.group(1)}data-start="0"{m.group(2)}data-duration="{CFG["audio_duration"]}"',
    html,
)
assert "takeB" not in html
html = html.replace("/*TIMING*/ [[0, 0], [38.6, 38.6]]", json.dumps(ANCH))
html = html.replace("<!--CAPTIONS-->", "\n      ".join(markup)).replace("//CAPTION_TWEENS", "\n          ".join(tweens))
(ROOT / "index.html").write_text(html, encoding="utf-8")
(ROOT / "captions.json").write_text(json.dumps(caps, ensure_ascii=False, indent=1), encoding="utf-8")
(ROOT / CFG["srt"]).write_text("\n".join(srt), encoding="utf-8")
print(f"{len(caps)} blocos, total {TOTAL}s, cortes {CUTS}")
