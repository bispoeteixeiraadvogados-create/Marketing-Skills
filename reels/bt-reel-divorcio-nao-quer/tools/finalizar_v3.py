"""Finaliza as entregas da V3 a partir dos renders brutos do HyperFrames.

1. Junta o vídeo de cada render com a mixagem da versão (normal ou reduzida), em AAC 48 kHz.
2. Confere -16 LUFS integrados e pico de no máximo -1,5 dBTP; se precisar, corrige com loudnorm em
   duas passagens e mede de novo.
3. Extrai os três quadros de conferência pedidos (gancho, ruptura, tela final) e os quadros-chave
   de cada cena em quadros-chave-v3/.
4. Simula a interface do Reels (cabeçalho, coluna de botões à direita, nome, legenda e barra de
   áudio embaixo) sobre os quadros-chave, para conferir que nada essencial fica por baixo dela.
5. Procura quadros em branco (branco puro ou quadro chapado) nas duas versões.

Uso: python3 tools/finalizar_v3.py
"""

import json
import re
import subprocess
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
R = ROOT / "renders"
NOME = "bt-reel-divorcio-nao-quer_v3"
dados_js = (ROOT / "assets/data/dados_v3.js").read_text(encoding="utf-8")
D = json.loads(dados_js[dados_js.index("{") : dados_js.rindex("}") + 1])
P = D["palavras"]
C = D["cortes"]
AL = D["alianca"]
DUR = D["duracao"]
ti = lambda i: P[i]["ini"]  # noqa: E731
tf = lambda i: P[i]["fim"]  # noqa: E731


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
for versao in ["normal", "reduzido"]:
    bruto = R / f"_bruto_v3_{versao}.mp4"
    if not bruto.exists():
        print("faltando", bruto)
        continue
    dst = ROOT / f"{NOME}_{versao}.mp4"
    juntar(bruto, ROOT / f"assets/audio/mix_v3_{versao}.wav", dst)
    i, tp = medir(dst)
    passos = [(i, tp)]
    for _ in range(2):
        if abs(i + 16) <= 0.5 and tp <= -1.5:
            break
        corrigir(dst)
        i, tp = medir(dst)
        passos.append((i, tp))
    pr = json.loads(run(["ffprobe", "-v", "error", "-show_entries", "stream=codec_name,profile,pix_fmt,width,height,r_frame_rate,nb_frames,sample_rate,bit_rate", "-show_entries", "format=duration,size", "-of", "json", str(dst)]).stdout)
    relatorio[versao] = {"arquivo": dst.name, "loudness_LUFS": i, "pico_dBTP": tp, "medicoes": passos, "ffprobe": pr}
    print(versao, i, tp, passos)

# cronograma real das cenas
CENAS = [
    ("C1 gancho", 0.0, AL["T_BRK"]),
    ("C2 ruptura e resposta", AL["T_BRK"], C["c23"]),
    ("C3 concordância", C["c23"], C["c34"]),
    ("C4 direito ao divórcio", C["c34"], C["c45"]),
    ("C5 questões relacionadas", C["c45"], C["c56"]),
    ("C6 conclusão", C["c56"], C["c67"]),
    ("C7 assinatura", C["c67"], DUR),
]
relatorio["cronograma"] = [{"cena": n, "inicio": round(a, 3), "fim": round(b, 3), "duracao": round(b - a, 3)} for n, a, b in CENAS]

# quadros de conferência (F) e quadros-chave por cena
CONFERENCIA = [
    ("F1_gancho_inicial", round(ti(5) - 0.05, 3)),  # a pergunta inteira na tela, com o NÃO
    ("F2_instante_da_ruptura", round(AL["T_BRK"] + 2 / 30, 3)),
    ("F3_tela_final", round(DUR - 0.2, 3)),
]
QUADROS = CONFERENCIA + [
    ("01_quadro_0", 0.0),
    ("02_tensao", round(AL["T_BRK"] - 0.1, 3)),
    ("03_queda", round((AL["T_BRK"] + AL["T_HIT"]) / 2, 3)),
    ("04_toque_e_NAO", round(AL["T_HIT"] + 0.05, 3)),
    ("05_resposta_completa", round(tf(10) + 0.05, 3)),
    ("06_comparacao", round(tf(16) + 0.03, 3)),
    ("07_foto_anel", round(ti(19) + 0.1, 3)),
    ("08_foto_assinatura", round(tf(22), 3)),
    ("09_filhos", round(tf(23), 3)),
    ("10_alimentos", round(tf(24), 3)),
    ("11_bens", round(tf(25), 3)),
    ("12_complemento", round(tf(31) + 0.03, 3)),
    ("13_mascara_circular", round(C["c56"] + 0.06, 3)),
    ("14_veto", round(tf(39) + 0.03, 3)),
    ("15_conclusao_completa", round(tf(44) + 0.03, 3)),
    ("16_assinatura_logo", round(tf(48), 3)),
]
QC = ROOT / "quadros-chave-v3"
QC.mkdir(exist_ok=True)
normal = ROOT / f"{NOME}_normal.mp4"
saidas = []
for nome, t in QUADROS:
    f = QC / f"{nome}_{t:.2f}s.png"
    run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-ss", f"{t:.3f}", "-i", str(normal), "-frames:v", "1", str(f)])
    saidas.append(f)
reduz = ROOT / f"{NOME}_reduzido.mp4"
if reduz.exists():
    for nome, t in [("R1_alianca_rachada", 1.0), ("R2_metades_no_ar", AL["T_BRK"] + 0.6), ("R3_metades_no_chao", AL["T_HIT"] + 0.8), ("R4_vista_de_cima", 6.0)]:
        run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-ss", f"{t:.3f}", "-i", str(reduz), "-frames:v", "1", str(QC / f"reduzido_{nome}_{t:.2f}s.png")])


# interface do Reels simulada (áreas aproximadas de um iPhone/Android em 1080 x 1920)
def interface(img):
    o = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(o)
    red = (220, 40, 40, 90)
    d.rectangle([0, 0, 1080, 210], fill=red)  # status, "Reels" e câmera
    for k in range(5):  # curtir, comentar, enviar, mais, capa do áudio
        cy = 1150 + k * 122
        d.ellipse([968, cy - 40, 1048, cy + 40], fill=red)
    d.rectangle([0, 1610, 940, 1830], fill=red)  # perfil, legenda e áudio
    d.rectangle([0, 1830, 1080, 1920], fill=red)  # barra de navegação
    d.rectangle([60, 250, 1020, 1620], outline=(40, 200, 90, 200), width=4)  # margens da Direção BT
    return Image.alpha_composite(img.convert("RGBA"), o).convert("RGB")


grade = []
for f in saidas:
    if f.exists():
        im = interface(Image.open(f))
        im.save(QC / ("interface_" + f.name))
        grade.append(im.resize((270, 480)))
if grade:
    cols = 7
    rows = (len(grade) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * 274, rows * 484), (255, 255, 255))
    for k, im in enumerate(grade):
        sheet.paste(im, ((k % cols) * 274, (k // cols) * 484))
    sheet.save(QC / "interface_reels_folha.png")
    # ficam a folha e os três quadros de conferência com a interface; as outras cópias saem
    for f in QC.glob("interface_[0-9]*.png"):
        f.unlink()


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
relatorio["quadros"] = {n: t for n, t in QUADROS}
(ROOT / "tools/relatorio_final_v3.json").write_text(json.dumps(relatorio, ensure_ascii=False, indent=1), encoding="utf-8")
