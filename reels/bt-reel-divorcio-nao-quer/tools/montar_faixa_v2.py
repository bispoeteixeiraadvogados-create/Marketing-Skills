"""Faixa de voz do v2: as mesmas 13 frases da geração única (nenhuma voz nova), com silêncios
de edição mais curtos.

Cada frase é recortada da faixa do v1 (assets/audio/narracao_final.wav), com 80 ms de folga antes
e depois (o ataque de algumas consoantes começa até 30 ms antes do início marcado), e recolocada
no novo instante. As amostras não mudam: os tempos de palavra do v1 (words.json) são deslocados
exatamente pelo mesmo valor de cada frase, e uma transcrição nova confere o resultado.

Saídas: assets/audio/narracao_final_v2.wav, assets/data/words_v2.json,
        assets/data/montagem_faixa_v2.json

Uso: python3 tools/montar_faixa_v2.py
"""

import json
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
AUD = ROOT / "assets/audio"
DAT = ROOT / "assets/data"

# silêncio antes de cada frase (s). v1: 0,40 0,35 0,80 0,35 0,35 0,80 0,35 3,60 0,35 0,35 0,80 0,35 0,35
SILENCIOS = [
    0.10,  # gancho: a voz entra no 3º quadro
    0.25,  # "E agora?"
    0.35,  # "Existem dois caminhos." (respiro de cena, mini-gancho)
    0.18,  # consensual
    0.18,  # litigioso
    0.55,  # "Mas e se o outro disser não?" (silêncio estratégico antes da pergunta)
    0.30,  # a regra (revelação circular)
    1.20,  # queda da aliança, acelerada (era 3,60)
    0.18,  # a lista
    0.22,  # mais tempo
    0.45,  # "Cada caso tem a sua realidade." (virada)
    0.18,  # a orientação
    0.35,  # "Converse com um advogado" (silêncio antes do chamado)
]
CAUDA = 4.0  # assinatura (era 6,5)
FOLGA = 0.08

m1 = json.loads((DAT / "montagem_faixa.json").read_text(encoding="utf-8"))
segs = m1["segmentos"]
assert len(segs) == len(SILENCIOS)
voz, sr = sf.read(AUD / "narracao_final.wav", dtype="float64")
w1 = json.loads((DAT / "words.json").read_text(encoding="utf-8"))["palavras"]

novos = []
t = 0.0
for s, sil in zip(segs, SILENCIOS):
    ini = t + sil
    dur = s["final_fim"] - s["final_ini"]
    novos.append({**s, "final_ini_v1": s["final_ini"], "final_fim_v1": s["final_fim"], "final_ini": round(ini, 3), "final_fim": round(ini + dur, 3), "silencio_antes": sil, "desloc": round(ini - s["final_ini"], 3)})
    t = ini + dur
total = round(t + CAUDA, 3)

out = np.zeros(int(round(total * sr)) + 1)
for s in novos:
    a = max(0, int(round((s["final_ini_v1"] - FOLGA) * sr)))
    b = int(round((s["final_fim_v1"] + FOLGA) * sr))
    d = int(round(s["desloc"] * sr))
    a2 = a + d
    if a2 < 0:
        a -= a2
        a2 = 0
    out[a2 : a2 + (b - a)] += voz[a:b]

# palavras: cada uma pertence à frase cujo intervalo (com folga) a contém
w2 = []
for w in w1:
    s = next(s for s in novos if s["final_ini_v1"] - 0.1 <= w["ini"] <= s["final_fim_v1"] + 0.1)
    w2.append({**w, "ini": round(w["ini"] + s["desloc"], 3), "fim": round(w["fim"] + s["desloc"], 3)})

sf.write(AUD / "narracao_final_v2.wav", out.astype(np.float32), sr, subtype="PCM_24")
(DAT / "words_v2.json").write_text(json.dumps({"palavras": w2}, ensure_ascii=False, indent=1), encoding="utf-8")
(DAT / "montagem_faixa_v2.json").write_text(
    json.dumps({"fonte": "narracao_final.wav do v1 (mesma geração única, sem voz nova)", "duracao_total": total, "cauda_final": CAUDA, "segmentos": novos}, ensure_ascii=False, indent=1),
    encoding="utf-8",
)
print("duração v2:", total, "s (v1: 51,31 s)")
for s in novos:
    print(f'{s["i"]:2} {s["final_ini"]:7.3f} {s["final_fim"]:7.3f}  desloc {s["desloc"]:+.3f}  {s["texto"]}')
