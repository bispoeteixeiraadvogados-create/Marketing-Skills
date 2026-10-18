#!/usr/bin/env python3
"""Builds the V4 timing data from the edited narration.

Reads assets/audio/timing_v4.json (word times on the final timeline) and writes:
- components/timing.js: scene cuts, word times and caption blocks for the composition (window.BT_DATA);
- output/BT_Divorcio_Cartorio_Reel_V4.srt.

Caption blocks never cross a scene cut (checked here), lines split with "|".

Usage: python3 scripts/build_timing.py
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
T = json.loads((ROOT / "assets/audio/timing_v4.json").read_text())
WORDS = T["words"]
FPS = 30


def fr(x):
    """Arredonda para o quadro mais próximo (30 fps)."""
    return round(round(x * FPS) / FPS, 3)


def word(token, n=0):
    k = 0
    for w in WORDS:
        if w["w"].lower().strip(".,?!") == token:
            if k == n:
                return w
            k += 1
    raise KeyError(token)


def cut_before(token, n=0):
    """Corte seco logo antes da palavra que abre a cena, dentro da pausa."""
    i = WORDS.index(word(token, n))
    return fr(max(WORDS[i]["s"] - 0.04, WORDS[i - 1]["e"] + 0.1))


# cenas: (id, palavra que abre a cena, ocorrência, fundo escuro)
OPENERS = [("s02", "pode", 0, True), ("s03", "mas", 0, False), ("s04", "guarda", 0, False), ("s05", "um", 0, False),
           ("s06", "é", 0, True), ("s07", "com", 0, False), ("s08", "com", 1, True), ("s09", "essa", 0, False),
           ("s10", "salve", 0, True)]
starts = [("s01", 0.0, True)] + [(sid, cut_before(tok, n), dark) for sid, tok, n, dark in OPENERS]
S11 = fr(WORDS[-1]["e"] + 1.27)  # o CTA fica cerca de 1,3 s na tela depois da fala
TOTAL = fr(S11 + 3.55)  # assinatura com cerca de 3,5 s de leitura
starts.append(("s11", S11, True))
SCENES = [(sid, a, starts[i + 1][1] if i + 1 < len(starts) else TOTAL, dark) for i, (sid, a, dark) in enumerate(starts)]
MATCH = fr(word("o", 1)["s"] - 0.06)  # match cut da ilustração para a escritura 3D
# momentos dentro de uma cena em que o fundo vira escuro (a cor da legenda acompanha a imagem)
DARK_FROM = {"s05": fr((word("sozinho")["e"] + word("não")["s"]) / 2), "s07": MATCH}
SIM = round(word("sim")["s"] - 0.07, 3)  # punch do "SIM." no início audível da palavra

BLOCKS = [
    "Tem filhos menores?",
    "Pode divorciar|no cartório?",
    "Sim.",
    "Mas há uma condição|importante.",
    "Guarda, convivência|e alimentos",
    "precisam estar resolvidos|na Justiça.",
    "Um acordo particular,|sozinho,",
    "não basta.",
    "É preciso comprovar a|resolução judicial.",
    "Com o consenso|do casal,",
    "o divórcio pode seguir|por escritura pública.",
    "Com assistência de advogado|ou defensor público.",
    "Essa é a regra|prevista pelo CNJ.",
    "Salve esta informação|para consultar depois.",
]


def scene_of(t):
    for sid, a, b, dark in SCENES:
        if a <= t < b:
            return sid, a, b, dark
    return SCENES[-1]


def is_dark(t):
    sid, a, b, dark = scene_of(t)
    if sid in DARK_FROM:
        return t >= DARK_FROM[sid]
    return dark


def ts(x):
    ms = int(round(x * 1000))
    return f"{ms // 3600000:02}:{ms // 60000 % 60:02}:{ms // 1000 % 60:02},{ms % 1000:03}"


def patch_html():
    """Grava os tempos de cada clipe no index.html (data-start e data-duration)."""
    p = ROOT / "index.html"
    html = p.read_text(encoding="utf-8")
    sc = {sid: (a, b) for sid, a, b, _ in SCENES}

    def setclip(el_id, start, dur):
        nonlocal html
        pat = re.compile(r'(id="' + el_id + r'"[^>]*?data-start=")[0-9.]+("\s+data-duration=")[0-9.]+(")', re.S)
        html, n = pat.subn(lambda m: f"{m.group(1)}{start:g}{m.group(2)}{round(dur, 3):g}{m.group(3)}", html)
        assert n == 1, el_id

    setclip("root", 0, TOTAL)
    setclip("mix", 0, TOTAL)
    for sid in ["s01", "s02", "s03", "s04", "s05", "s06", "s07", "s08", "s09"]:
        a, b = sc[sid]
        setclip(sid, a, b - a)
    setclip("s08-video", *[sc["s08"][0], sc["s08"][1] - sc["s08"][0]])
    a, b = sc["s10"]
    setclip("s10", a, b + 0.3 - a)  # fica 0,3 s sob o desfoque da assinatura
    setclip("s11", round(S11 - 0.2, 3), TOTAL - (S11 - 0.2))
    setclip("dot", sc["s09"][0], (S11 - 0.3) - sc["s09"][0])
    setclip("captions", 0, sc["s10"][1])
    p.write_text(html, encoding="utf-8")


def main():
    caps, i = [], 0
    for blk in BLOCKS:
        words = []
        for li, line in enumerate(blk.split("|")):
            for tok in line.split():
                w = WORDS[i]
                assert w["w"] == tok, (w["w"], tok)
                words.append({"t": tok, "s": w["s"], "e": w["e"], "line": li})
                i += 1
        caps.append({"words": words, "s": words[0]["s"], "e": words[-1]["e"]})
    assert i == len(WORDS), (i, len(WORDS))

    srt, prev_end = [], 0.0
    for k, c in enumerate(caps):
        sid, a, b, _ = scene_of(c["s"])
        nxt = caps[k + 1]["s"] if k + 1 < len(caps) else TOTAL
        # visible from slightly before the first word, until 0.45 s after the last one,
        # never past the next block or the scene cut (or the background flip inside a scene)
        start = min(c["s"], max(a, c["s"] - 0.08, prev_end + 0.02))
        end = min(c["e"] + 0.45, nxt - 0.06, b - 0.02)
        flip = DARK_FROM.get(sid)
        if flip and start < flip < end and c["s"] < flip:
            end = flip - 0.02
        assert c["e"] <= end + 0.07 or k == len(caps) - 1, (k, c, end)
        assert end > start
        c["start"], c["end"] = round(start, 3), round(end, 3)
        prev_end = end
        c["dark"] = is_dark(c["s"])
        c["scene"] = sid
        lines = {}
        for w in c["words"]:
            lines.setdefault(w["line"], []).append(w["t"])
        txt = "\n".join(" ".join(v) for _, v in sorted(lines.items()))
        srt.append(f"{k + 1}\n{ts(start)} --> {ts(end)}\n{txt}\n")

    data = {
        "total": TOTAL,
        "match": MATCH,
        "sim": SIM,
        "voiceDuration": T["duration"],
        "scenes": [{"id": s, "start": a, "end": b, "dark": d} for s, a, b, d in SCENES],
        "darkFrom": DARK_FROM,
        "words": WORDS,
        "captions": caps,
    }
    (ROOT / "components/timing.js").write_text(
        "// Generated by scripts/build_timing.py from assets/audio/timing_v4.json. Do not edit by hand.\n"
        f"window.BT_DATA = {json.dumps(data, ensure_ascii=False)};\n"
    )
    (ROOT / "assets/audio/scenes_v4.json").write_text(json.dumps({k: data[k] for k in ["total", "match", "sim", "scenes",
                                                                                       "darkFrom"]}, indent=1))
    patch_html()
    (ROOT / "output").mkdir(exist_ok=True)
    (ROOT / "output/BT_Divorcio_Cartorio_Reel_V4.srt").write_text("\n".join(srt), encoding="utf-8")
    for c in caps:
        print(f"{c['start']:6.2f}-{c['end']:6.2f} {c['scene']} {'D' if c['dark'] else 'L'} "
              + " ".join(w["t"] for w in c["words"]))


if __name__ == "__main__":
    main()
