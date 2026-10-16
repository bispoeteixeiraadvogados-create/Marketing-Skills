"""Finaliza as entregas a partir dos renders brutos do HyperFrames.

1. Junta o vídeo de cada render com a mixagem da versão (normal ou reduzida), em AAC 48 kHz.
2. Confere -16 LUFS integrados e pico de no máximo -1,5 dBTP; se precisar, corrige com loudnorm em
   duas passagens e mede de novo.
3. Extrai os quadros-chave da seção 14 em quadros-chave/.
4. Procura quadros em branco (branco puro ou quadro chapado) nas duas versões.

Uso: python3 tools/finalizar.py
"""

import json
import re
import subprocess
import unicodedata
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
R = ROOT / "renders"
NOME = "bt-reel-divorcio-nao-quer_v1"
dados_js = (ROOT / "assets/data/dados.js").read_text(encoding="utf-8")
D = json.loads(dados_js[dados_js.index("{") : dados_js.rindex("}") + 1])
K = D["const"]


def norm(s):
    s = unicodedata.normalize("NFD", s.lower())
    return "".join(c for c in s if c.isalnum() and not unicodedata.combining(c))


def word(txt, k=1):
    n = 0
    for w in D["palavras"]:
        if norm(w["texto"]) == norm(txt):
            n += 1
            if n == k:
                return w
    raise KeyError(txt)


def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True)


def medir(path):
    out = run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(path), "-af", "ebur128=peak=true:framelog=quiet", "-f", "null", "-"]).stderr
    i = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", out)[-1])
    tp = float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", out)[-1])
    return i, tp


def juntar(video, audio, dst):
    run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(video), "-i", str(audio), "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-shortest", "-movflags", "+faststart", str(dst)])


def corrigir(path):
    out = run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(path), "-af", "loudnorm=I=-16:TP=-1.8:LRA=11:print_format=json", "-f", "null", "-"]).stderr
    j = json.loads(out[out.rindex("{") : out.rindex("}") + 1])
    flt = (
        f"loudnorm=I=-16:TP=-1.8:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:"
        f"measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true"
    )
    tmp = path.with_suffix(".fix.mp4")
    run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(path), "-c:v", "copy", "-af", flt, "-ar", "48000", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", str(tmp)])
    tmp.replace(path)


relatorio = {}
for versao, bruto in [("normal", R / "_bruto_normal.mp4"), ("reduzido", R / "_bruto_reduzido.mp4")]:
    if not bruto.exists():
        print("faltando", bruto)
        continue
    dst = ROOT / f"{NOME}_{versao}.mp4"
    juntar(bruto, ROOT / f"assets/audio/mix_v1_{versao}.wav", dst)
    i, tp = medir(dst)
    passos = [(i, tp)]
    for _ in range(2):
        if abs(i + 16) <= 0.5 and tp <= -1.5:
            break
        corrigir(dst)
        i, tp = medir(dst)
        passos.append((i, tp))
    pr = json.loads(run(["ffprobe", "-v", "error", "-show_entries", "stream=codec_name,width,height,r_frame_rate,nb_frames,sample_rate", "-show_entries", "format=duration,size", "-of", "json", str(dst)]).stdout)
    relatorio[versao] = {"arquivo": dst.name, "loudness_LUFS": i, "pico_dBTP": tp, "medicoes": passos, "ffprobe": pr}
    print(versao, i, tp, passos)

# quadros-chave (seção 14)
T0 = word("impede")["ini"]
T_A = T0 + K["QUEDA"]
tw = lambda i: D["palavras"][i]["ini"]
QUADROS = [
    ("01_C1_titulo_completo", tw(7) + 0.5),
    ("02_C2_dois_desenhos_completos", word("juiz")["fim"] + 0.1),
    ("03_C3_bolinha_ao_lado_de_nao", D["cortes"]["c34"] - 0.02),
    ("04a_C4_R1", word("discordância")["ini"] + 0.55),
    ("04b_C4_R2", word("por")["ini"] + 0.55),
    ("04c_C4_R3", word("não", 4)["ini"] + 0.4),
    ("05_C4_partida", T0 + 0.07),
    ("06_C4_queda_meio", T0 + K["QUEDA"] / 2),
    ("07_C4_impacto", T_A + 0.02),
    ("08_C5_lista_e_metades", D["cortes"]["c56"] - 0.45),
    ("09_C6_linha_e_sublinhado", D["cortes"]["c67"] - 0.3),
    ("10a_C7_parte1", word("pessoa")["fim"] - 0.05),
    ("10b_C7_parte2", word("decidir")["fim"]),
    ("11_C8_assinatura", D["duracao"] - 0.3),
]
QC = ROOT / "quadros-chave"
QC.mkdir(exist_ok=True)
for f in QC.glob("*.png"):
    f.unlink()
normal = ROOT / f"{NOME}_normal.mp4"
for nome, t in QUADROS:
    run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-ss", f"{t:.3f}", "-i", str(normal), "-frames:v", "1", str(QC / f"{nome}_{t:.2f}s.png")])
reduz = ROOT / f"{NOME}_reduzido.mp4"
if reduz.exists():
    for nome, t in [("R1_alianca_inteira", T0 - 1.0), ("R2_rachaduras", T0 - 0.15), ("R3_metades_separadas", T0 + 1.0), ("R4_metades_no_chao", T_A + 1.0)]:
        run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-ss", f"{t:.3f}", "-i", str(reduz), "-frames:v", "1", str(QC / f"reduzido_{nome}_{t:.2f}s.png")])


# quadros em branco: branco puro ou imagem chapada (desvio quase zero)
def varrer(path):
    w, h = 270, 480
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-i", str(path), "-vf", f"scale={w}:{h}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
    ruins = []
    n = 0
    while True:
        b = p.stdout.read(w * h * 3)
        if len(b) < w * h * 3:
            break
        a = np.frombuffer(b, np.uint8).reshape(h, w, 3).astype(np.int16)
        branco = (a.min(axis=2) >= 253).mean()
        if branco > 0.5 or a.std() < 1.0:
            ruins.append({"quadro": n, "t": round(n / 30, 3), "fracao_branco_puro": round(float(branco), 3), "desvio": round(float(a.std()), 2)})
        n += 1
    return {"quadros": n, "suspeitos": ruins}


for versao in ["normal", "reduzido"]:
    f = ROOT / f"{NOME}_{versao}.mp4"
    if f.exists():
        relatorio.setdefault(versao, {})["varredura_quadros_em_branco"] = varrer(f)
        print(versao, "suspeitos:", relatorio[versao]["varredura_quadros_em_branco"]["suspeitos"][:10])
(ROOT / "tools/relatorio_final.json").write_text(json.dumps(relatorio, ensure_ascii=False, indent=1), encoding="utf-8")
