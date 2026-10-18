#!/usr/bin/env python3
"""Build the final SRT and the burned-in caption data from the approved script + real word timings.

Text always comes from the approved script (briefing/01_Narracao_Integral_ElevenLabs_PTBR.txt), never
from the recognizer, so punctuation and capitalization stay literal. Timing comes from
assets/audio/timing_v1.json (faster-whisper word times mapped onto the 42 s timeline).
"""
import json
import re
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCRIPT = ROOT / "briefing/01_Narracao_Integral_ElevenLabs_PTBR.txt"
TIMING = ROOT / "assets/audio/timing_v1.json"
TARGET = ROOT / "compositions/legendas.html"
OUT_DIR = ROOT / "output"
SRT_NAMES = [
    "2026-10-20_divorcio_cartorio_filhos_menores_LEGENDAS_v1.srt",
    "REEL_20-10-2026_LEGENDA_FINAL.srt",
]

# (first word, end word exclusive, [indices where a new line starts]) over the 89 script words.
GROUPS = [
    (0, 3, []), (3, 10, [8]), (10, 14, []), (14, 21, [18]), (21, 25, []), (25, 30, [28]),
    (30, 35, []), (35, 40, []), (40, 45, [43]), (45, 55, [50]), (55, 58, []), (58, 65, [62]),
    (65, 69, []), (69, 77, [73]), (77, 84, [82]), (84, 89, []),
]
LEAD = 0.05
TAIL = 0.35
END = 41.9


def norm(w):
    w = unicodedata.normalize("NFC", w).lower()
    return re.sub(r"[^\wà-ü]", "", w)


def ts(t):
    ms = int(round(t * 1000))
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def main():
    tokens = SCRIPT.read_text(encoding="utf-8").split()
    words = json.loads(TIMING.read_text())["words"]
    if len(tokens) != len(words):
        sys.exit(f"script has {len(tokens)} words, timing has {len(words)}")
    for i, (a, b) in enumerate(zip(tokens, words)):
        if norm(a) != norm(b["w"]):
            sys.exit(f"word {i} mismatch: script '{a}' vs audio '{b['w']}'")
    if GROUPS[-1][1] != len(tokens) or any(GROUPS[k][1] != GROUPS[k + 1][0] for k in range(len(GROUPS) - 1)):
        sys.exit("caption groups must cover every word exactly once")

    caps = []
    for a, b, breaks in GROUPS:
        lines, cur = [], []
        for i in range(a, b):
            if i in breaks and cur:
                lines.append(" ".join(cur))
                cur = []
            cur.append(tokens[i])
        lines.append(" ".join(cur))
        caps.append({"start": words[a]["s"] - LEAD, "last_end": words[b - 1]["e"], "lines": lines})
    for k, c in enumerate(caps):
        nxt = caps[k + 1]["start"] if k + 1 < len(caps) else END + 0.06
        c["start"] = round(max(c["start"], 0.0), 2)
        c["end"] = round(min(nxt - 0.06, c["last_end"] + TAIL) if k + 1 < len(caps) else END, 2)
        if c["end"] <= c["start"]:
            sys.exit(f"caption {k + 1} has no duration")

    srt = "\n".join(f"{k + 1}\n{ts(c['start'])} --> {ts(c['end'])}\n" + "\n".join(c["lines"]) + "\n" for k, c in enumerate(caps))
    OUT_DIR.mkdir(exist_ok=True)
    for name in SRT_NAMES:
        (OUT_DIR / name).write_text(srt, encoding="utf-8")

    data = json.dumps([{"start": c["start"], "end": c["end"], "lines": c["lines"]} for c in caps], ensure_ascii=False)
    page = TARGET.read_text(encoding="utf-8")
    begin = page.index("// CAPTIONS:BEGIN")
    begin = page.index("\n", begin) + 1
    end = page.index("            // CAPTIONS:END")
    TARGET.write_text(page[:begin] + f"            const CAPTIONS = {data};\n" + page[end:], encoding="utf-8")
    for k, c in enumerate(caps):
        print(f"{k + 1:2d} {c['start']:6.2f} -> {c['end']:6.2f}  {' / '.join(c['lines'])}")


if __name__ == "__main__":
    main()
