"""Fotos de apoio da V3: ampliação, recorte em duas camadas e fundo reconstruído, para paralaxe real.

Fontes (anexos do escritório, 17/10/2026, copiados sem alteração para assets/img/v3/fonte/):
  anel.jpg        612 x 408   mãos tirando a aliança   (classe C, contexto humano; também A, referência)
  assinatura.jpg  547 x 365   mão assinando documento  (classe D, documento e gesto humano)
  chaves.jpg      414 x 739   chaves com chaveiro casa (classe D, still life de bens)

Passos, por foto:
1. Ampliação 4x com Real-ESRGAN x4plus (ONNX da Qualcomm AI Hub, licença BSD-3-Clause), em blocos
   de 128 px com 16 px de sobreposição. Depois, redução Lanczos para o tamanho de uso. Os arquivos
   originais têm de 414 a 612 px de largura e seriam exibidos a 1,8x a 2,6x; a ampliação tira os
   blocos de JPEG e devolve nitidez sem inventar objetos.
2. Recorte do primeiro plano com rembg 2.0.85 (modelo isnet-general-use) sobre o original; a máscara
   é ampliada para o tamanho de uso e suavizada em 1,5 px.
3. Fundo: a região do primeiro plano (dilatada) é reconstruída com OpenCV inpaint (Telea), só para
   que o deslocamento de paralaxe de poucos pixels não revele um buraco.

Saídas em assets/img/v3/: <nome>_fundo.webp (sem o primeiro plano), <nome>_frente.webp (RGBA) e
<nome>_inteira.webp (foto inteira ampliada, usada no movimento reduzido).

Uso: python3 tools/preparar_fotos_v3.py <pasta do modelo ONNX do Real-ESRGAN>
(o modelo não vai para o repositório: 64 MB; download no README de qualcomm/Real-ESRGAN-x4plus)
"""

import glob
import sys
from pathlib import Path

import cv2
import numpy as np
import onnxruntime as ort
from PIL import Image, ImageFilter
from rembg import new_session, remove

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets/img/v3/fonte"
OUT = ROOT / "assets/img/v3"

# largura de uso (px) de cada foto
USO = {"anel": 1600, "assinatura": 1420, "chaves": 1080}

modelo = glob.glob(str(Path(sys.argv[1]) / "**/*.onnx"), recursive=True)[0]
sr_sess = ort.InferenceSession(modelo, providers=["CPUExecutionProvider"])
T, O = 128, 16
ST = T - 2 * O


def amplia4(img):
    a = np.asarray(img.convert("RGB"), dtype=np.float32) / 255.0
    h, w, _ = a.shape
    pad = np.pad(a, ((O, O + T), (O, O + T), (0, 0)), mode="reflect")
    out = np.zeros((h * 4, w * 4, 3), np.float32)
    for y in range(0, h, ST):
        for x in range(0, w, ST):
            tile = pad[y : y + T, x : x + T].transpose(2, 0, 1)[None]
            r = sr_sess.run(None, {"image": tile})[0][0].transpose(1, 2, 0)
            core = r[O * 4 : (O + ST) * 4, O * 4 : (O + ST) * 4]
            hh = min(ST, h - y) * 4
            ww = min(ST, w - x) * 4
            out[y * 4 : y * 4 + hh, x * 4 : x * 4 + ww] = core[:hh, :ww]
    return Image.fromarray((np.clip(out, 0, 1) * 255 + 0.5).astype(np.uint8))


seg = new_session("isnet-general-use")
for nome, largura in USO.items():
    orig = Image.open(SRC / f"{nome}.jpg").convert("RGB")
    big = amplia4(orig)
    alto = round(orig.height * largura / orig.width)
    foto = big.resize((largura, alto), Image.LANCZOS)
    rec = remove(orig, session=seg, post_process_mask=True)
    mask = rec.split()[3].resize((largura, alto), Image.BICUBIC).filter(ImageFilter.GaussianBlur(1.5))
    frente = foto.copy()
    frente.putalpha(mask)
    m = (np.asarray(mask) > 24).astype(np.uint8) * 255
    m = cv2.dilate(m, np.ones((15, 15), np.uint8))
    fundo = cv2.inpaint(cv2.cvtColor(np.asarray(foto), cv2.COLOR_RGB2BGR), m, 9, cv2.INPAINT_TELEA)
    fundo = Image.fromarray(cv2.cvtColor(fundo, cv2.COLOR_BGR2RGB))
    foto.save(OUT / f"{nome}_inteira.webp", quality=90, method=6)
    fundo.save(OUT / f"{nome}_fundo.webp", quality=88, method=6)
    frente.save(OUT / f"{nome}_frente.webp", quality=92, method=6)
    print(nome, orig.size, "->", foto.size)
