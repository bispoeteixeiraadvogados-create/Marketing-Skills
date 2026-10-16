"""Tempos do vídeo a partir da transcrição da voz, legendas (.srt) e mixagem final.

Uso: python3 -I tools/tempos.py
Entradas: tools/palavras-voz-original.json, assets/audio/voz-original.mp3
Saídas: tools/tempos.json, assets/data/tempos.js, index.html,
        entregas/BT_6x1_9x16_ptBR_v001.srt, assets/audio/mix-final.wav
"""
import json
import os
import subprocess
import sys

import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
J = lambda *p: os.path.join(RAIZ, *p)

ABERTURA = 0.3      # silêncio antes da primeira palavra
PAUSA_RESPIRO = 2.0  # pausa inserida entre as frases 10 e 11 (cena 11, sem fala)
CAUDA = 2.5          # depois da última palavra
ANTECIPA = 0.25      # a cena entra um pouco antes da primeira palavra da frase
DISSOLVE = 0.55     # dissolve centrado no corte (Direção Visual BT)
SOBRA = 0.3         # a cena que sai fica 0,3 s a mais
SR = 48000

palavras = json.load(open(J("tools/palavras-voz-original.json"), encoding="utf-8"))["palavras"]
fim10 = max(w["fim"] for w in palavras if w["frase"] == 10)
ini11 = min(w["inicio"] for w in palavras if w["frase"] == 11)
corte_pausa = round((fim10 + ini11) / 2, 3)


def desloca(t):
    return round(t + ABERTURA + (PAUSA_RESPIRO if t >= corte_pausa else 0.0), 3)


for w in palavras:
    w["t0"], w["t1"] = desloca(w["inicio"]), desloca(w["fim"])

frase_ini = {f: min(w["t0"] for w in palavras if w["frase"] == f) for f in range(1, 13)}
frase_fim = {f: max(w["t1"] for w in palavras if w["frase"] == f) for f in range(1, 13)}
DURACAO = round(frase_fim[12] + CAUDA, 2)

# Cortes: cena n acompanha a frase n; a cena 11 é o respiro entre as frases 10 e 11; 12 e 13 seguem 11 e 12.
cortes = [0.0]
for f in range(2, 11):
    # A cena 5 entra na palavra "emenda": a cena 4 precisa de tempo para o selo das duas Casas.
    cortes.append(round(frase_ini[f] + (0.65 if f == 5 else -ANTECIPA), 3))
cortes.append(round(frase_fim[10] + 0.35, 3))          # início da cena 11 (respiro)
cortes.append(round(frase_ini[11] - ANTECIPA, 3))      # cena 12
cortes.append(round(frase_ini[12] - ANTECIPA, 3))      # cena 13
cortes.append(DURACAO)
CENAS = ["c01-gancho", "c02-rotina", "c03-camara", "c04-senado", "c05-rito", "c06-horas", "c07-calendario",
         "c08-salario", "c09-excecoes", "c10-dois-lados", "c11-respiro", "c12-cta", "c13-assinatura"]
cenas = []
for i, nome in enumerate(CENAS):
    a, b = cortes[i], cortes[i + 1]
    cenas.append({"id": nome, "inicio": a, "fim": b})


def palavra(frase, texto, ocorrencia=1):
    n = 0
    for w in palavras:
        if w["frase"] == frase and w["texto"].strip(".,?").lower() == texto.lower():
            n += 1
            if n == ocorrencia:
                return w
    raise SystemExit(f"palavra não encontrada: {frase} {texto} {ocorrencia}")


CHAVES = {
    "c01-gancho": [("trabalho", 1, "trabalho"), ("um", 1, "Um")],
    "c02-rotina": [("rotina", 2, "rotina"), ("escala", 2, "escala"), ("perto", 2, "perto"), ("fim", 2, "fim")],
    "c03-camara": [("camara", 3, "Câmara"), ("aprovou", 3, "aprovou"), ("quatrocentos", 3, "Quatrocentos"), ("dezenove", 3, "dezenove")],
    "c04-senado": [("senado", 4, "Senado"), ("confirmou", 4, "confirmou"), ("setenta", 4, "Setenta"), ("um", 4, "um")],
    "c05-rito": [("emenda", 5, "emenda"), ("sancao", 5, "sanção"), ("presidente", 5, "presidente"), ("promulga", 5, "promulga"), ("congresso", 5, "Congresso")],
    "c06-horas": [("sessenta", 6, "Sessenta"), ("depois", 6, "depois"), ("quarenta", 6, "quarenta"), ("duas", 6, "duas"), ("semana", 6, "semana")],
    "c07-calendario": [("descanso", 7, "descanso"), ("dois", 7, "dois")],
    "c08-salario": [("doze", 8, "Doze"), ("quarenta", 8, "quarenta"), ("sem", 8, "Sem"), ("salario", 8, "salário")],
    "c09-excecoes": [("escalas", 9, "Escalas"), ("doze", 9, "doze"), ("setores", 9, "setores"), ("regras", 9, "regras")],
    "c10-dois-lados": [("contrata", 10, "contrata"), ("rever", 10, "rever"), ("trabalha", 10, "trabalha"), ("conhecer", 10, "conhecer"), ("limites", 10, "limites")],
    "c11-respiro": [],
    "c12-cta": [("ficou", 11, "Ficou"), ("busque", 11, "Busque")],
    "c13-assinatura": [("bispo", 12, "Bispo")],
}
for c in cenas:
    c["dur"] = round(c["fim"] - c["inicio"], 3)
    c["k"] = {nome: round(palavra(f, txt)["t0"] - c["inicio"], 3) for nome, f, txt in CHAVES[c["id"]]}

# Legendas: tokens de exibição (algarismos) com o número de palavras faladas que cada um cobre.
L = lambda *linhas: [[(t, n) for t, n in linha] for linha in linhas]
CUES = [
    (1, L([("6", 1), ("dias", 1), ("de", 1), ("trabalho.", 1), ("1", 1), ("de", 1), ("folga.", 1)])),
    (2, L([("Essa", 1), ("é", 1), ("a", 1), ("rotina", 1)], [("da", 1), ("escala", 1), ("6x1.", 3)])),
    (2, L([("E", 1), ("ela", 1), ("está", 1), ("perto", 1), ("do", 1), ("fim.", 1)])),
    (3, L([("Em", 1), ("maio,", 1), ("a", 1), ("Câmara", 1)], [("aprovou", 1), ("a", 1), ("proposta.", 1)])),
    (3, L([("461", 5), ("votos", 1), ("a", 1), ("19.", 1)])),
    (4, L([("Em", 1), ("outubro,", 1), ("o", 1), ("Senado", 1)], [("confirmou.", 1)])),
    (4, L([("75", 3), ("a", 1), ("1.", 1)])),
    (5, L([("Por", 1), ("ser", 1), ("uma", 1), ("emenda", 1)], [("à", 1), ("Constituição,", 1)])),
    (5, L([("ela", 1), ("não", 1), ("vai", 1), ("para", 1), ("sanção", 1)], [("do", 1), ("presidente.", 1)])),
    (5, L([("Quem", 1), ("promulga", 1), ("é", 1)], [("o", 1), ("próprio", 1), ("Congresso.", 1)])),
    (6, L([("60", 1), ("dias", 1), ("depois,", 1)], [("a", 1), ("jornada", 1), ("máxima", 1), ("cai", 1)])),
    (6, L([("de", 1), ("44", 3), ("para", 1), ("42", 3), ("horas", 1)], [("por", 1), ("semana.", 1)])),
    (7, L([("E", 1), ("o", 1), ("descanso", 1), ("passa", 1)], [("a", 1), ("ser", 1), ("de", 1), ("2", 1), ("dias.", 1)])),
    (8, L([("12", 1), ("meses", 1), ("depois,", 1)], [("o", 1), ("limite", 1), ("chega", 1), ("a", 1), ("40", 1), ("horas.", 1)])),
    (8, L([("Sem", 1), ("redução", 1), ("de", 1), ("salário.", 1)])),
    (9, L([("Escalas", 1), ("especiais,", 1)], [("como", 1), ("a", 1), ("12x36,", 5)])),
    (9, L([("e", 1), ("alguns", 1), ("setores", 1)], [("terão", 1), ("regras", 1), ("próprias.", 1)])),
    (10, L([("Para", 1), ("quem", 1), ("contrata,", 1), ("é", 1), ("hora", 1)], [("de", 1), ("rever", 1), ("escalas", 1), ("e", 1), ("contratos.", 1)])),
    (10, L([("Para", 1), ("quem", 1), ("trabalha,", 1)], [("de", 1), ("conhecer", 1), ("os", 1), ("novos", 1), ("limites.", 1)])),
    (11, L([("Ficou", 1), ("com", 1), ("dúvida", 1)], [("sobre", 1), ("a", 1), ("nova", 1), ("jornada?", 1)])),
    (11, L([("Busque", 1), ("orientação", 1), ("jurídica.", 1)])),
    (12, L([("Bispo", 1), ("e", 1), ("Teixeira", 1), ("Advogados.", 1)])),
]
# Cenas de fundo escuro usam caixa Paper; nas demais, caixa Primary. Frases 11 e 12 só no .srt.
ESCURAS = {"c03-camara", "c04-senado"}
SO_SRT = {11, 12}

fila = {f: [w for w in palavras if w["frase"] == f] for f in range(1, 13)}
cues = []
for frase, linhas in CUES:
    toks = []
    for li, linha in enumerate(linhas):
        for texto, n in linha:
            ws = [fila[frase].pop(0) for _ in range(n)]
            toks.append({"texto": texto, "linha": li, "t0": ws[0]["t0"], "t1": ws[-1]["t1"]})
    cues.append({"frase": frase, "toks": toks, "t0": toks[0]["t0"]})
assert all(len(v) == 0 for v in fila.values()), "tokens de legenda não cobrem a fala"
for i, c in enumerate(cues):
    prox = cues[i + 1]["t0"] if i + 1 < len(cues) else DURACAO
    fim_frase = frase_fim[c["frase"]]
    c["t1"] = round(min(prox - 0.04, max(c["toks"][-1]["t1"], fim_frase) + 0.35), 3)
    cena = next(s for s in cenas if s["inicio"] <= c["t0"] < s["fim"])
    c["estilo"] = "escura" if cena["id"] in ESCURAS else "clara"
    c["queimar"] = c["frase"] not in SO_SRT


def srt_t(t):
    ms = int(round(t * 1000))
    return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"


os.makedirs(J("entregas"), exist_ok=True)
with open(J("entregas/BT_6x1_9x16_ptBR_v001.srt"), "w", encoding="utf-8") as f:
    for i, c in enumerate(cues, 1):
        linhas = {}
        for t in c["toks"]:
            linhas.setdefault(t["linha"], []).append(t["texto"])
        f.write(f"{i}\n{srt_t(c['t0'])} --> {srt_t(c['t1'])}\n" + "\n".join(" ".join(v) for v in linhas.values()) + "\n\n")

# Legenda queimada nunca atravessa a troca de cena (Direção Visual BT): se um corte cai dentro do bloco,
# o bloco começa no corte (quando a maior parte da fala está na cena nova) ou termina antes dele.
legendas = []
for c in cues:
    if not c["queimar"]:
        continue
    t0, t1 = c["t0"], c["t1"]
    for s in cenas[1:]:
        corte = s["inicio"]
        if t0 + 0.05 < corte < t1:
            if corte - t0 < t1 - corte:
                t0 = corte + 0.05
            else:
                t1 = corte - 0.05
    cena = next(s for s in cenas if s["inicio"] <= t0 < s["fim"])
    legendas.append({"t0": round(t0, 3), "t1": round(t1, 3), "estilo": "escura" if cena["id"] in ESCURAS else "clara",
                     "toks": [{"x": t["texto"], "l": t["linha"], "t": max(t["t0"], t0)} for t in c["toks"]]})

# Efeitos sonoros próprios (sintetizados), em tempo global.
inicio = {c["id"]: c["inicio"] for c in cenas}
k = {c["id"]: c["k"] for c in cenas}
dur = {c["id"]: c["dur"] for c in cenas}
sfx = []
for cid in ["c03-camara", "c05-rito", "c06-horas", "c09-excecoes", "c10-dois-lados", "c11-respiro", "c12-cta"]:
    sfx.append(("whoosh", inicio[cid] - 0.12))
VAR_C03 = {"fotoFim": 1.0, "varreduraInicio": round(max(k["c03-camara"]["aprovou"], 1.4), 3), "varreduraDuracao": 1.6}
VAR_C04 = {"fotoFim": 1.0, "varreduraInicio": round(k["c04-senado"]["setenta"] - 0.05, 3), "varreduraDuracao": 1.0}
for j in range(16):
    sfx.append(("tick", inicio["c03-camara"] + VAR_C03["varreduraInicio"] + j * 0.1))
for j in range(10):
    sfx.append(("tick", inicio["c04-senado"] + VAR_C04["varreduraInicio"] + j * 0.1))
for j in range(6):
    sfx.append(("tick", inicio["c02-rotina"] + k["c02-rotina"]["rotina"] + j * 0.32))
sfx.append(("tick", inicio["c06-horas"] + k["c06-horas"]["duas"]))
sfx.append(("tick", inicio["c06-horas"] + k["c06-horas"]["duas"] + 0.12))
sfx.append(("tick", inicio["c08-salario"] + k["c08-salario"]["quarenta"]))
sfx.append(("tick", inicio["c08-salario"] + k["c08-salario"]["quarenta"] + 0.12))
sfx.append(("clique", inicio["c07-calendario"] + k["c07-calendario"]["dois"]))
sfx.append(("despertador", inicio["c11-respiro"] + 0.15))

# Estalos nos realces das palavras importantes (tempo local da cena + chave).
def kk(cid, chave, d=0.0):
    return inicio[cid] + k[cid][chave] + d
q03 = inicio["c03-camara"] + VAR_C03["varreduraInicio"] + 0.43 * VAR_C03["varreduraDuracao"]
q04 = inicio["c04-senado"] + VAR_C04["varreduraInicio"] + 0.43 * VAR_C04["varreduraDuracao"]
f03 = inicio["c03-camara"] + VAR_C03["varreduraInicio"] + VAR_C03["varreduraDuracao"]
f04 = inicio["c04-senado"] + VAR_C04["varreduraInicio"] + VAR_C04["varreduraDuracao"]
ESTALOS = [kk("c01-gancho", "um"), kk("c02-rotina", "fim"), q03, max(f03 + 0.1, kk("c03-camara", "quatrocentos")),
           max(f03 + 0.2, kk("c03-camara", "dezenove")), q04, max(f04 + 0.1, kk("c04-senado", "setenta")), max(f04 + 0.2, kk("c04-senado", "um")),
           kk("c04-senado", "um", 0.65), kk("c05-rito", "sancao"), kk("c05-rito", "promulga"), kk("c06-horas", "sessenta", 0.15),
           kk("c06-horas", "duas", 0.1), kk("c07-calendario", "dois", 0.3), kk("c08-salario", "doze", 0.15), kk("c08-salario", "quarenta", 0.1),
           kk("c09-excecoes", "doze"), kk("c09-excecoes", "regras"), kk("c10-dois-lados", "rever", 0.8), kk("c10-dois-lados", "limites"),
           kk("c12-cta", "busque", 0.2)]
for t_ in ESTALOS:
    sfx.append(("estalo", t_))
sfx.append(("destaque", kk("c08-salario", "sem", 0.25)))

# Bolinha condutora: alvos por cena (tempo local ou chave da fala), em coordenadas do quadro.
B = {
    "c01-gancho": [("trabalho", "move", 428, 1112), ("um", "move", 848, 726)],
    "c02-rotina": [(0.3, "move", 300, 470), ("escala", "move", 430, 872), ("perto", "move", 275, 610), ("fim", "some", 0, 0)],
    "c03-camara": [(0.15, "move", 690, 322), ("aprovou", "move", 112, 770), (q03 - inicio["c03-camara"], "move", 640, 386),
                   ("quatrocentos", "move", 590, 985), ("dezenove", "move", 745, 1000), (5.3, "some", 0, 0)],
    "c04-senado": [(0.15, "move", 560, 322), ("setenta", "move", 160, 780), ("um", "move", 660, 1000), (k["c04-senado"]["um"] + 0.6, "move", 170, 676), (dur["c04-senado"] - 0.2, "some", 0, 0)],
    "c05-rito": [(0.2, "move", 700, 540), ("sancao", "move", 140, 805), ("promulga", "move", 617, 945)],
    "c06-horas": [("sessenta", "move", 470, 340), ("quarenta", "move", 380, 1150), ("duas", "move", 680, 630)],
    "c07-calendario": [("descanso", "move", 812, 690), (k["c07-calendario"]["dois"] - 0.45, "move", 497, 690), (k["c07-calendario"]["dois"] + 0.1, "some", 0, 0)],
    "c08-salario": [("doze", "move", 945, 345), ("quarenta", "move", 380, 1150), ("sem", "move", 800, 385), ("salario", "move", 655, 690),
                    (k["c08-salario"]["salario"] + 0.4, "some", 0, 0)],
    "c09-excecoes": [("escalas", "move", 880, 640), ("setores", "move", 880, 930), ("regras", "move", 560, 500)],
    "c10-dois-lados": [("contrata", "move", 470, 470), ("rever", "move", 355, 665), ("trabalha", "move", 600, 540),
                       ("conhecer", "move", 725, 690), ("limites", "move", 560, 1040)],
    "c11-respiro": [(0.3, "move", 425, 850), (1.5, "move", 800, 915), (1.8, "some", 0, 0)],
    "c12-cta": [("ficou", "move", 330, 712), ("busque", "move", 110, 1262), (dur["c12-cta"] - 0.45, "some", 0, 0)],
}
bolinha = []
for cid in CENAS:
    primeiro = True
    for quando, acao, x, y in B.get(cid, []):
        tl_ = inicio[cid] + (k[cid][quando] if isinstance(quando, str) else quando)
        bolinha.append({"t": round(tl_, 3), "a": acao, "x": x, "y": y, "troca": primeiro and acao == "move" and cid != "c01-gancho"})
        primeiro = False
bolinha.sort(key=lambda p: p["t"])

# Cada cena entra DISSOLVE/2 antes do corte (dissolve centrado), e o tempo 0 da composição é o início do
# dissolve. Os tempos locais exportados (chaves, duração, varredura) são deslocados por esse "off" para que
# cada animação continue presa à palavra falada.
cenas_out = []
for i, c in enumerate(cenas):
    off = DISSOLVE / 2 if i > 0 else 0.0
    cenas_out.append(dict(c, off=round(off, 3), dur=round(c["dur"] + off, 3), k={n: round(v + off, 3) for n, v in c["k"].items()}))
OFF = DISSOLVE / 2
VAR_C03_OUT = {"fotoFim": round(VAR_C03["fotoFim"] + OFF, 3), "varreduraInicio": round(VAR_C03["varreduraInicio"] + OFF, 3), "varreduraDuracao": VAR_C03["varreduraDuracao"]}
VAR_C04_OUT = {"fotoFim": round(VAR_C04["fotoFim"] + OFF, 3), "varreduraInicio": round(VAR_C04["varreduraInicio"] + OFF, 3), "varreduraDuracao": VAR_C04["varreduraDuracao"]}
tempos = {"duracao": DURACAO, "cenas": cenas_out, "c03": VAR_C03_OUT, "c04": VAR_C04_OUT, "legendas": legendas,
          "sfx": [{"tipo": a, "t": round(b, 3)} for a, b in sfx], "bolinha": bolinha, "corte_pausa_original": corte_pausa}
json.dump(tempos, open(J("tools/tempos.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
os.makedirs(J("assets/data"), exist_ok=True)
bt = {c["id"].split("-")[0]: {"dur": c["dur"], "k": c["k"], "off": c["off"]} for c in cenas_out}
bt["duracao"] = DURACAO
bt["legendas"] = legendas
bt["bolinha"] = bolinha
with open(J("assets/data/tempos.js"), "w", encoding="utf-8") as f:
    f.write("// Gerado por tools/tempos.py a partir da transcrição da voz. Não editar à mão.\n")
    f.write("window.BT_T = " + json.dumps(bt, ensure_ascii=False) + ";\n")

# index.html: cenas em sequência com dissolve de 0,55 s centrado em cada corte (a cena que sai fica +0,3 s), legendas e áudio por cima.
slots = []
anim = []
for i, c in enumerate(cenas):
    a = c["inicio"] - (DISSOLVE / 2 if i > 0 else 0)
    b = c["fim"] + (DISSOLVE / 2 + SOBRA if i < len(cenas) - 1 else 0)
    slots.append(f'      <div id="{c["id"]}" data-composition-id="{c["id"]}" data-composition-src="compositions/{c["id"]}.html" '
                 f'data-start="{a:.3f}" data-duration="{b - a:.3f}" data-track-index="{i % 2}" data-width="1080" data-height="1920"></div>')
    if i > 0:
        anim.append(f'      tl.fromTo("#{c["id"]}", {{ opacity: 0 }}, {{ opacity: 1, duration: {DISSOLVE}, ease: "bt-inout" }}, {a:.3f});')
        # A cena que sai continua por baixo até o dissolve terminar e só então é ocultada.
        anim.append(f'      tl.set("#{cenas[i - 1]["id"]}", {{ opacity: 0 }}, {a + DISSOLVE + 0.02:.3f});')
index = f"""<!doctype html>
<html lang="pt-BR" data-resolution="portrait" data-composition-variables='[{{"id":"reducedMotion","type":"boolean","label":"Movimento reduzido","default":false}}]'>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <!-- Gerado por tools/tempos.py. Edite o gerador, não este arquivo. -->
    <script src="assets/vendor/gsap.min.js"></script>
    <script src="assets/vendor/CustomEase.min.js"></script>
    <script>
      gsap.registerPlugin(CustomEase);
      // Curvas do motion.md do design system BT, nomeadas pelo token.
      CustomEase.create("bt-standard", "M0,0 C0.4,0 0.2,1 1,1");
      CustomEase.create("bt-enter", "M0,0 C0.16,1 0.3,1 1,1");
      CustomEase.create("bt-exit", "M0,0 C0.4,0 1,1 1,1");
      CustomEase.create("bt-emphasized", "M0,0 C0.22,1 0.36,1 1,1");
      CustomEase.create("bt-overshoot", "M0,0 C0.34,1.12 0.64,1 1,1");
      CustomEase.create("bt-inout", "M0,0 C0.45,0 0.25,1 1,1");
    </script>
    <script src="assets/data/tempos.js"></script>
    <script src="assets/vendor/bt-pictogramas.js"></script>
    <script src="assets/vendor/hf-motion-blur.js"></script>
    <style>
      @font-face {{ font-family: "Cormorant Garamond"; font-weight: 500; src: url("assets/fonts/cormorant-garamond-latin-500-normal.woff2") format("woff2"); }}
      @font-face {{ font-family: "Cormorant Garamond"; font-weight: 600; src: url("assets/fonts/cormorant-garamond-latin-600-normal.woff2") format("woff2"); }}
      @font-face {{ font-family: "Montserrat"; font-weight: 400; src: url("assets/fonts/montserrat-latin-400-normal.woff2") format("woff2"); }}
      @font-face {{ font-family: "Montserrat"; font-weight: 500; src: url("assets/fonts/montserrat-latin-500-normal.woff2") format("woff2"); }}
      @font-face {{ font-family: "Montserrat"; font-weight: 600; src: url("assets/fonts/montserrat-latin-600-normal.woff2") format("woff2"); }}
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ margin: 0; width: 1080px; height: 1920px; overflow: hidden; background: #081a35; }}
      #root {{ position: relative; width: 100%; height: 100%; background: #081a35; font-family: "Montserrat", Arial, sans-serif; }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{DURACAO}" data-width="1080" data-height="1920" data-fps="30">
{chr(10).join(slots)}
      <div id="c00-bolinha" data-composition-id="c00-bolinha" data-composition-src="compositions/c00-bolinha.html" data-start="0" data-duration="{DURACAO}" data-track-index="7" data-width="1080" data-height="1920"></div>
      <div id="c00-legendas" data-composition-id="c00-legendas" data-composition-src="compositions/c00-legendas.html" data-start="0" data-duration="{DURACAO}" data-track-index="8" data-width="1080" data-height="1920"></div>
      <audio id="bt-audio" src="assets/audio/mix-final.wav" data-start="0" data-duration="{DURACAO}" data-track-index="9" data-volume="1"></audio>
    </div>
    <script>
      const tl = gsap.timeline({{ paused: true }});
{chr(10).join(anim)}
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
"""
open(J("index.html"), "w", encoding="utf-8").write(index)

# Áudio: voz editada (abertura e pausa do respiro) + efeitos, normalizada em duas passadas.
tmp = J("assets/audio/voz-48k.wav")
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", J("assets/audio/voz-original.mp3"), "-ac", "1", "-ar", str(SR), tmp], check=True)
voz, _ = sf.read(tmp, dtype="float32")
os.remove(tmp)
cp = int(corte_pausa * SR)
voz = np.concatenate([np.zeros(int(ABERTURA * SR), "float32"), voz[:cp], np.zeros(int(PAUSA_RESPIRO * SR), "float32"), voz[cp:]])
total = int(DURACAO * SR)
mix = np.zeros(total, "float32")
mix[: min(total, len(voz))] += voz[:total] * (0.8 / max(1e-6, np.abs(voz).max()))
rng = np.random.default_rng(221)


def env(n, ataque, queda):
    t = np.arange(n) / SR
    return np.minimum(1.0, t / max(ataque, 1e-4)) * np.exp(-t / queda)


def gerar(tipo):
    if tipo == "tick":
        n = int(0.03 * SR)
        t = np.arange(n) / SR
        return 0.10 * np.sin(2 * np.pi * 2200 * t) * env(n, 0.0008, 0.005)
    if tipo == "clique":
        n = int(0.05 * SR)
        ruido = sosfilt(butter(4, 1800, "highpass", fs=SR, output="sos"), rng.standard_normal(n))
        t = np.arange(n) / SR
        return (0.12 * ruido * env(n, 0.0005, 0.006) + 0.08 * np.sin(2 * np.pi * 900 * t) * env(n, 0.0005, 0.012)).astype("float32")
    if tipo == "whoosh":
        n = int(0.42 * SR)
        ruido = sosfilt(butter(2, [350, 2600], "bandpass", fs=SR, output="sos"), rng.standard_normal(n))
        janela = np.sin(np.linspace(0, np.pi, n)) ** 2
        return (0.055 * ruido * janela).astype("float32")
    if tipo == "estalo":
        n = int(0.09 * SR)
        t = np.arange(n) / SR
        f = 1150 * np.exp(-t / 0.03) + 420
        tom = 0.075 * np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, 0.025)
        ruido = sosfilt(butter(2, 2500, "highpass", fs=SR, output="sos"), rng.standard_normal(n)) * 0.05 * env(n, 0.0005, 0.004)
        return (tom + ruido).astype("float32")
    if tipo == "destaque":
        n = int(0.5 * SR)
        t = np.arange(n) / SR
        grave = 0.12 * np.sin(2 * np.pi * 72 * t) * env(n, 0.004, 0.14)
        brilho = 0.05 * np.sin(2 * np.pi * 1760 * t) * env(n, 0.002, 0.08)
        return (grave + brilho).astype("float32")
    if tipo == "despertador":
        bip = int(0.09 * SR)
        t = np.arange(bip) / SR
        tom = 0.07 * np.sin(2 * np.pi * 1320 * t) * np.minimum(1, t / 0.004) * np.minimum(1, (0.09 - t) / 0.01)
        return np.concatenate([tom, np.zeros(int(0.07 * SR)), tom]).astype("float32")
    raise ValueError(tipo)


for ev in tempos["sfx"]:
    s = gerar(ev["tipo"])
    i0 = int(ev["t"] * SR)
    i1 = min(total, i0 + len(s))
    if i0 >= 0 and i0 < total:
        mix[i0:i1] += s[: i1 - i0]

pre = J("assets/audio/mix-pre.wav")
sf.write(pre, mix, SR, subtype="PCM_24")
alvo = "I=-15:TP=-1.5:LRA=11"
r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", pre, "-af", f"loudnorm={alvo}:print_format=json", "-f", "null", "-"],
                   capture_output=True, text=True)
med = json.loads(r.stderr[r.stderr.rindex("{"):r.stderr.rindex("}") + 1])
filtro = (f"loudnorm={alvo}:measured_I={med['input_i']}:measured_TP={med['input_tp']}:measured_LRA={med['input_lra']}:"
          f"measured_thresh={med['input_thresh']}:offset={med['target_offset']}:linear=true,"
          "volume=1.0dB,alimiter=limit=0.83:attack=2:release=50:level=false")
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", pre, "-af", filtro, "-ar", str(SR), "-c:a", "pcm_s24le",
                J("assets/audio/mix-final.wav")], check=True)
os.remove(pre)
print(json.dumps({"duracao": DURACAO, "cortes": cortes, "legendas": len(legendas), "cues_srt": len(cues),
                  "sfx": len(tempos["sfx"]), "c03": VAR_C03, "c04": VAR_C04}, ensure_ascii=False))
