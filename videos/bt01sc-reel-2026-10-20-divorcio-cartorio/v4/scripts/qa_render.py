#!/usr/bin/env python3
"""QA of a rendered V4 MP4: technical measurements, black/frozen frame detection, audio sync,
inspection frames for every scene, safe-zone overlays and contact sheets.

Usage: python3 scripts/qa_render.py output/BT_Divorcio_Cartorio_Reel_V4.mp4 [tag]
Writes output/QA_<tag>/ (frames, overlays, sheets) and output/qa_medicoes_<tag>.json.
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
# dois instantes por cena (início e momento principal) e as trocas sensíveis
TIMES = [0.0, 1.2, 2.7, 3.6, 4.6, 5.8, 6.3, 7.1, 7.9, 9.9, 11.2, 13.3, 14.0, 14.27, 14.6, 15.9, 16.9, 17.6,
         18.17, 18.23, 19.9, 21.2, 22.6, 24.4, 25.8, 27.3, 29.4, 30.1, 31.4, 32.95]
SAFE = {"top": 250, "bottom": 300, "side": 60}  # área livre de interface do manual BT


def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True)


def probe(p):
    out = run(["ffprobe", "-v", "error", "-count_frames", "-show_entries",
               "format=duration,bit_rate,size:stream=codec_type,codec_name,profile,width,height,pix_fmt,r_frame_rate,"
               "nb_read_frames,sample_rate,channels,display_aspect_ratio", "-of", "json", str(p)]).stdout
    return json.loads(out)


def loudness(p):
    err = run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(p), "-map", "0:a:0", "-af", "ebur128=peak=true",
               "-f", "null", "-"]).stderr
    s = err[err.rfind("Summary:"):]
    return {"integrated_lufs": float(s.split("I:")[1].split("LUFS")[0]),
            "lra_lu": float(s.split("LRA:")[1].split("LU")[0]),
            "true_peak_dbtp": float(s.split("Peak:")[1].split("dBFS")[0])}


def black_and_frozen(p):
    err = run(["ffmpeg", "-hide_banner", "-i", str(p), "-vf",
               "blackdetect=d=0.03:pix_th=0.06,freezedetect=n=0.0008:d=1.2", "-an", "-f", "null", "-"]).stderr
    black = [ln.strip() for ln in err.splitlines() if "black_start" in ln]
    frozen = [ln.strip() for ln in err.splitlines() if "freeze_start" in ln or "freeze_duration" in ln]
    return black, frozen


def decode_errors(p):
    r = run(["ffmpeg", "-v", "error", "-i", str(p), "-f", "null", "-"])
    return r.stderr.strip()[:1000]


def sync_offset_ms(p):
    """Cross-correlates the MP4 audio with the mix the composition plays."""
    ref, sr = sf.read(ROOT / "assets/audio/mix_v4.wav", dtype="float32")
    ref = ref.mean(axis=1)
    got = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", str(p), "-ac", "1", "-ar", str(sr), "-f", "f32le",
                                        "-"], capture_output=True).stdout, np.float32)
    n = min(len(ref), len(got), sr * 12)
    a = ref[:n] - ref[:n].mean()
    b = got[:n] - got[:n].mean()
    corr = np.fft.irfft(np.fft.rfft(a, 2 * n) * np.conj(np.fft.rfft(b, 2 * n)))
    lag = int(np.argmax(np.abs(corr)))
    if lag > n:
        lag -= 2 * n
    return round(-lag / sr * 1000, 2)


def font(size):
    for f in ["/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"]:
        if Path(f).exists():
            return ImageFont.truetype(f, size)
    return ImageFont.load_default()


def overlay(src, dst):
    im = Image.open(src).convert("RGBA")
    w, h = im.size
    ov = Image.new("RGBA", im.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    red = (220, 40, 40, 70)
    d.rectangle([0, 0, w, SAFE["top"]], fill=red)
    d.rectangle([0, h - SAFE["bottom"], w, h], fill=red)
    d.rectangle([0, SAFE["top"], SAFE["side"], h - SAFE["bottom"]], fill=red)
    d.rectangle([w - SAFE["side"], SAFE["top"], w, h - SAFE["bottom"]], fill=red)
    d.rectangle([0, 1240, w, 1460], outline=(255, 220, 0, 255), width=3)  # faixa da legenda
    Image.alpha_composite(im, ov).convert("RGB").save(dst)


def sheet(files, dst, cols=6, scale=0.22):
    ims = [Image.open(f).convert("RGB") for f in files]
    w, h = int(ims[0].width * scale), int(ims[0].height * scale)
    rows = (len(ims) + cols - 1) // cols
    pad, lab = 10, 30
    out = Image.new("RGB", (cols * (w + pad) + pad, rows * (h + pad + lab) + pad), (20, 22, 28))
    d = ImageDraw.Draw(out)
    fnt = font(20)
    for i, (im, f) in enumerate(zip(ims, files)):
        x = pad + (i % cols) * (w + pad)
        y = pad + (i // cols) * (h + pad + lab)
        d.text((x, y + 4), f.stem.replace("frame_", "").replace("-", ".") + "s", fill=(240, 240, 240), font=fnt)
        out.paste(im.resize((w, h), Image.LANCZOS), (x, y + lab))
    out.save(dst, quality=88)


def main():
    mp4 = Path(sys.argv[1]).resolve()
    tag = sys.argv[2] if len(sys.argv) > 2 else "V4"
    outdir = mp4.parent / f"QA_{tag}"
    (outdir / "area_segura").mkdir(parents=True, exist_ok=True)
    files = []
    for t in TIMES:
        f = outdir / f"frame_{t:05.2f}".replace(".", "-")
        f = f.with_suffix(".png")
        run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t}", "-i", str(mp4), "-frames:v", "1", str(f)])
        files.append(f)
        overlay(f, outdir / "area_segura" / f.name)
    sheet(files, outdir / f"contact_sheet_{tag}.jpg")
    sheet([outdir / "area_segura" / f.name for f in files], outdir / f"contact_sheet_area_segura_{tag}.jpg")
    black, frozen = black_and_frozen(mp4)
    info = probe(mp4)
    res = {"file": str(mp4.relative_to(ROOT)), "bytes": mp4.stat().st_size, "probe": info, "loudness": loudness(mp4),
           "black_segments": black, "frozen_segments": frozen, "decode_errors": decode_errors(mp4),
           "audio_sync_offset_ms": sync_offset_ms(mp4), "frames": [str(f.relative_to(ROOT)) for f in files]}
    (mp4.parent / f"qa_medicoes_{tag}.json").write_text(json.dumps(res, indent=1, ensure_ascii=False))
    print(json.dumps({k: res[k] for k in ["loudness", "black_segments", "frozen_segments", "decode_errors",
                                          "audio_sync_offset_ms", "bytes"]}, indent=1, ensure_ascii=False))
    for s in info["streams"]:
        print({k: s.get(k) for k in ["codec_type", "codec_name", "profile", "width", "height", "pix_fmt", "r_frame_rate",
                                     "nb_read_frames", "sample_rate", "channels", "display_aspect_ratio"]})
    print("duration", info["format"]["duration"])


if __name__ == "__main__":
    main()
