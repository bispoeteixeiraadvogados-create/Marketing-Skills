"""Transcrição por palavra da locução e alinhamento ao roteiro fechado.

Uso: python3 -I tools/transcrever.py <audio.wav 16 kHz mono> <saida.json>
Grava, para cada palavra do roteiro, a frase, o texto e os instantes de início e fim.
O texto vem sempre do roteiro; o Whisper só fornece os tempos.
"""
import difflib
import json
import re
import sys
import unicodedata

import soundfile as sf
from faster_whisper import WhisperModel

ROTEIRO = [
    "Seis dias de trabalho. Um de folga.",
    "Essa é a rotina da escala seis por um. E ela está perto do fim.",
    "Em maio, a Câmara aprovou a proposta. Quatrocentos e sessenta e um votos a dezenove.",
    "Em outubro, o Senado confirmou. Setenta e cinco a um.",
    "Por ser uma emenda à Constituição, ela não vai para sanção do presidente. Quem promulga é o próprio Congresso.",
    "Sessenta dias depois, a jornada máxima cai de quarenta e quatro para quarenta e duas horas por semana.",
    "E o descanso passa a ser de dois dias.",
    "Doze meses depois, o limite chega a quarenta horas. Sem redução de salário.",
    "Escalas especiais, como a doze por trinta e seis, e alguns setores terão regras próprias.",
    "Para quem contrata, é hora de rever escalas e contratos. Para quem trabalha, de conhecer os novos limites.",
    "Ficou com dúvida sobre a nova jornada? Busque orientação jurídica.",
    "Bispo e Teixeira Advogados.",
]

NUMEROS = {
    "1": "um", "2": "dois", "6": "seis", "12": "doze", "19": "dezenove", "36": "trinta e seis",
    "40": "quarenta", "42": "quarenta e duas", "44": "quarenta e quatro", "60": "sessenta",
    "75": "setenta e cinco", "461": "quatrocentos e sessenta e um",
}


def norm(w):
    w = unicodedata.normalize("NFD", w.lower())
    w = "".join(c for c in w if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]", "", w)


def expandir(token):
    """Converte algarismos que o Whisper escreve (461, 6x1, 12x36) em palavras do roteiro."""
    t = token.lower().replace("×", "x")
    partes = re.split(r"(x)", t) if re.fullmatch(r"\d+x\d+", t) else [t]
    saida = []
    for p in partes:
        if p == "x":
            saida.append("por")
        elif norm(p) in NUMEROS:
            saida.extend(NUMEROS[norm(p)].split())
        else:
            saida.append(p)
    return [norm(s) for s in saida if norm(s)]


def main(wav, saida):
    audio, sr = sf.read(wav, dtype="float32")
    assert sr == 16000, sr
    modelo = WhisperModel("small", device="cpu", compute_type="int8")
    segmentos, _ = modelo.transcribe(audio, language="pt", word_timestamps=True, beam_size=5,
                                     initial_prompt=" ".join(ROTEIRO))
    ouvidas = []
    for seg in segmentos:
        for w in seg.words:
            sub = expandir(w.word.strip())
            n = max(1, len(sub))
            for k, s in enumerate(sub):
                a = w.start + (w.end - w.start) * k / n
                b = w.start + (w.end - w.start) * (k + 1) / n
                ouvidas.append((s, a, b))

    roteiro = []
    for i, frase in enumerate(ROTEIRO):
        for w in frase.split():
            roteiro.append({"frase": i + 1, "texto": w, "chave": norm(w)})

    sm = difflib.SequenceMatcher(a=[r["chave"] for r in roteiro], b=[o[0] for o in ouvidas], autojunk=False)
    for bloco in sm.get_matching_blocks():
        for k in range(bloco.size):
            r = roteiro[bloco.a + k]
            o = ouvidas[bloco.b + k]
            r["inicio"], r["fim"] = round(o[1], 3), round(o[2], 3)

    # Palavras sem correspondência recebem tempos interpolados entre as vizinhas.
    sem = [i for i, r in enumerate(roteiro) if "inicio" not in r]
    for i in sem:
        ant = next((roteiro[j] for j in range(i - 1, -1, -1) if "inicio" in roteiro[j]), None)
        pro = next((roteiro[j] for j in range(i + 1, len(roteiro)) if "inicio" in roteiro[j]), None)
        a = ant["fim"] if ant else 0.0
        b = pro["inicio"] if pro else a + 0.3
        roteiro[i]["inicio"], roteiro[i]["fim"], roteiro[i]["interpolada"] = round(a, 3), round(b, 3), True

    json.dump({"palavras": roteiro, "sem_correspondencia": len(sem)}, open(saida, "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    print("palavras", len(roteiro), "interpoladas", len(sem))
    for i in range(1, len(ROTEIRO) + 1):
        ws = [r for r in roteiro if r["frase"] == i]
        print(f"frase {i:2d}: {ws[0]['inicio']:6.2f} a {ws[-1]['fim']:6.2f}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
