"""Faixa de voz da V3: narração nova (texto do prompt de segunda revisão), voz Henrique, eleven_v4,
uma única geração (342 créditos). Bruto: assets/audio/narracao_bruta_v3_henrique_v4.mp3, 25,97 s.

As 11 frases são recortadas do bruto pelas bordas de energia (perfil de 10 ms, limiar de -60 dB;
o ruído de fundo do arquivo fica em -76 dB) e recolocadas com respiros mais curtos. As pausas
internas da lista "Filhos, alimentos, bens" ficam como vieram. As amostras não mudam.

Tempos de palavra: transcrição local com faster-whisper medium (int8, pt, timestamps por palavra),
gravada em assets/data/transcricao_bruta_v3.json. Grafia trocada pela do roteiro (52 palavras, mesma
ordem). Bordas de palavra ajustadas aos silêncios reais medidos no sinal.

Saídas: assets/audio/narracao_final_v3.wav, assets/data/words_v3.json,
        assets/data/montagem_faixa_v3.json

Uso: python3 tools/montar_faixa_v3.py
"""

import json
import subprocess
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
AUD = ROOT / "assets/audio"
DAT = ROOT / "assets/data"

ROTEIRO = (
    "Seu cônjuge diz não ao divórcio? Isso não impede o divórcio. Com acordo, consensual. "
    "Sem acordo, litigioso. A outra pessoa não precisa concordar. Filhos. Alimentos. Bens. "
    "Essas questões podem exigir análise própria. A recusa não é um veto ao divórcio. "
    "Cada situação exige análise individual. Bispo e Teixeira Advogados. Salve esta informação."
)

# frases: bordas de energia no bruto (s) e silêncio antes de cada uma na faixa final (s)
FRASES = [
    ("Seu cônjuge diz não ao divórcio?", 0.02, 2.17, 0.06),
    ("Isso não impede o divórcio.", 2.52, 4.18, 0.22),
    ("Com acordo, consensual.", 4.55, 6.23, 0.22),
    ("Sem acordo, litigioso.", 6.50, 8.39, 0.18),
    ("A outra pessoa não precisa concordar.", 8.66, 10.92, 0.20),
    ("Filhos. Alimentos. Bens.", 11.27, 13.72, 0.20),
    ("Essas questões podem exigir análise própria.", 13.98, 16.47, 0.18),
    ("A recusa não é um veto ao divórcio.", 16.76, 19.08, 0.20),
    ("Cada situação exige análise individual.", 19.33, 21.99, 0.20),
    ("Bispo e Teixeira Advogados.", 22.38, 24.17, 0.26),
    ("Salve esta informação.", 24.47, 25.79, 0.22),
]
CAUDA = 1.1  # assinatura parada depois da última palavra
FOLGA = 0.03  # dentro do silêncio (-76 dB), não corta ataque nem cauda

bruto_mp3 = AUD / "narracao_bruta_v3_henrique_v4.mp3"
tmp = ROOT / "renders/_bruta_v3.wav"
tmp.parent.mkdir(exist_ok=True)
subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(bruto_mp3), "-ar", "44100", "-ac", "1", str(tmp)], check=True)
voz, sr = sf.read(tmp, dtype="float64")

tr = json.loads((DAT / "transcricao_bruta_v3.json").read_text(encoding="utf-8"))
ws = tr["palavras"]
tokens = ROTEIRO.split()
assert len(tokens) == len(ws), (len(tokens), len(ws))

# bordas de palavra presas aos silêncios medidos (corrige o atraso típico do whisper no ataque)
for a, b in tr["silencios"]:
    nxt = min(range(len(ws)), key=lambda k: abs(ws[k]["ini"] - b))
    if abs(ws[nxt]["ini"] - b) < 0.3:
        ws[nxt]["ini"] = b
        if nxt > 0:
            ws[nxt - 1]["fim"] = min(ws[nxt - 1]["fim"], a)

segs = []
t = 0.0
for i, (txt, a, b, sil) in enumerate(FRASES):
    ini = t + sil
    segs.append({"i": i, "texto": txt, "bruto": [a, b], "silencio_antes": sil, "final_ini": round(ini, 3), "final_fim": round(ini + b - a, 3), "desloc": round(ini - a, 3)})
    t = ini + b - a
total = round(t + CAUDA, 3)

out = np.zeros(int(round(total * sr)) + 1)
for s in segs:
    a = int(round((s["bruto"][0] - FOLGA) * sr))
    b = int(round((s["bruto"][1] + FOLGA) * sr))
    a = max(0, a)
    d = int(round(s["desloc"] * sr))
    out[a + d : b + d] += voz[a:b]

words = []
for k, (w, tok) in enumerate(zip(ws, tokens)):
    s = next(s for s in segs if s["bruto"][0] - 0.12 <= w["ini"] <= s["bruto"][1] + 0.05)
    ini = w["ini"]
    # a primeira palavra de cada frase começa na borda de energia da frase
    if not words or words[-1]["frase"] != s["i"]:
        ini = s["bruto"][0]
    fim = min(w["fim"], s["bruto"][1])
    words.append({"texto": tok, "ini": round(ini + s["desloc"], 3), "fim": round(fim + s["desloc"], 3), "frase": s["i"], "p": w["p"]})

sf.write(AUD / "narracao_final_v3.wav", out.astype(np.float32), sr, subtype="PCM_24")
(DAT / "words_v3.json").write_text(json.dumps({"palavras": words}, ensure_ascii=False, indent=1), encoding="utf-8")
(DAT / "montagem_faixa_v3.json").write_text(
    json.dumps(
        {
            "fonte": "narracao_bruta_v3_henrique_v4.mp3 (ElevenLabs, voz Henrique 3ULAAai0IVN00DTWA6vF, eleven_v4, 1 geração, 342 créditos, 17/10/2026)",
            "duracao_bruta": 25.966,
            "duracao_total": total,
            "cauda_final": CAUDA,
            "segmentos": segs,
        },
        ensure_ascii=False,
        indent=1,
    ),
    encoding="utf-8",
)
tmp.unlink()
print("duração V3:", total, "s (bruto: 25,97 s; v2: 44,1 s)")
for s in segs:
    print(f'{s["i"]:2} {s["final_ini"]:7.3f} {s["final_fim"]:7.3f}  desloc {s["desloc"]:+.3f}  {s["texto"]}')
for w in words:
    print(f'   {w["ini"]:7.3f} {w["fim"]:7.3f}  {w["texto"]}')
