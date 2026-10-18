#!/usr/bin/env python3
"""QA of the rendered reel: technical measurements, critical frames, contact sheet, safe-zone overlays.

Usage: python3 scripts/qa_render.py output/2026-10-20_divorcio_cartorio_filhos_menores_REEL_v1.mp4
Writes output/<stem>_FRAMES_v1/ and output/qa_medicoes_v1.json.
"""
import json
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
TIMES = [0.5, 1.5, 4.5, 10.0, 18.0, 25.0, 35.0, 40.0]
SAFE = {"top": 240, "bottom": 400, "side": 90}  # starting points from the brief, not a universal guarantee


def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True, check=True)


def probe(path):
    out = run(["ffprobe", "-v", "error", "-count_frames", "-show_entries",
               "format=duration,bit_rate,size:stream=index,codec_type,codec_name,profile,width,height,pix_fmt,"
               "r_frame_rate,avg_frame_rate,nb_read_frames,sample_rate,channels,channel_layout,bit_rate,display_aspect_ratio",
               "-of", "json", str(path)]).stdout
    return json.loads(out)


def loudness(path):
    err = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(path), "-map", "0:a:0", "-af",
                          "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
    s = err[err.rfind("Summary:"):]
    return {
        "integrated_lufs": float(s.split("I:")[1].split("LUFS")[0]),
        "loudness_range_lu": float(s.split("LRA:")[1].split("LU")[0]),
        "true_peak_dbtp": float(s.split("Peak:")[1].split("dBFS")[0]),
    }


def decode_check(path):
    r = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-f", "null", "-"], capture_output=True, text=True)
    return {"returncode": r.returncode, "errors": r.stderr.strip()[:2000]}


def frames(path, outdir):
    outdir.mkdir(parents=True, exist_ok=True)
    files = []
    for t in TIMES:
        f = outdir / f"frame_{str(t).replace('.', '-')}s.png"
        run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t}", "-i", str(path), "-frames:v", "1", str(f)])
        files.append(f)
    return files


def font(size):
    for p in ["/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"]:
        if Path(p).exists():
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def safe_overlay(src, dst):
    im = Image.open(src).convert("RGBA")
    w, h = im.size
    ov = Image.new("RGBA", im.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    red = (220, 40, 40, 70)
    d.rectangle([0, 0, w, SAFE["top"]], fill=red)
    d.rectangle([0, h - SAFE["bottom"], w, h], fill=red)
    d.rectangle([0, SAFE["top"], SAFE["side"], h - SAFE["bottom"]], fill=red)
    d.rectangle([w - SAFE["side"], SAFE["top"], w, h - SAFE["bottom"]], fill=red)
    d.rectangle([SAFE["side"], SAFE["top"], w - SAFE["side"], h - SAFE["bottom"]], outline=(255, 220, 0, 255), width=4)
    Image.alpha_composite(im, ov).convert("RGB").save(dst)


def contact(files, dst, cols=4, scale=0.3):
    ims = [Image.open(f).convert("RGB") for f in files]
    w, h = int(ims[0].width * scale), int(ims[0].height * scale)
    rows = (len(ims) + cols - 1) // cols
    pad, label = 16, 44
    sheet = Image.new("RGB", (cols * (w + pad) + pad, rows * (h + pad + label) + pad), (20, 22, 28))
    d = ImageDraw.Draw(sheet)
    fnt = font(26)
    for i, (im, f) in enumerate(zip(ims, files)):
        x = pad + (i % cols) * (w + pad)
        y = pad + (i // cols) * (h + pad + label)
        d.text((x, y + 6), f.stem.replace("frame_", "").replace("-", ".") , fill=(240, 240, 240), font=fnt)
        sheet.paste(im.resize((w, h), Image.LANCZOS), (x, y + label))
    sheet.save(dst, quality=90)


def main():
    mp4 = Path(sys.argv[1]).resolve()
    version = mp4.stem.rsplit("_", 1)[-1]  # ..._REEL_v2 -> v2
    stem = mp4.stem.replace(f"_REEL_{version}", "")
    outdir = mp4.parent / f"{stem}_FRAMES_{version}"
    info = probe(mp4)
    loud = loudness(mp4)
    dec = decode_check(mp4)
    files = frames(mp4, outdir)
    safe_dir = outdir / "safe_zone_overlay"
    safe_dir.mkdir(exist_ok=True)
    for f in files:
        safe_overlay(f, safe_dir / f.name)
    contact(files, outdir / f"contact_sheet_{version}.jpg")
    contact([safe_dir / f.name for f in files], outdir / f"contact_sheet_safe_zones_{version}.jpg")
    result = {"file": str(mp4.relative_to(ROOT)), "bytes": mp4.stat().st_size, "probe": info,
              "loudness": loud, "full_decode": dec, "frames": [str(f.relative_to(ROOT)) for f in files]}
    (mp4.parent / f"qa_medicoes_{version}.json").write_text(json.dumps(result, indent=1, ensure_ascii=False))
    print(json.dumps({"loudness": loud, "decode_rc": dec["returncode"], "decode_errors": dec["errors"][:300]}, indent=1))
    for s in info["streams"]:
        print({k: s.get(k) for k in ["codec_type", "codec_name", "profile", "width", "height", "pix_fmt", "r_frame_rate",
                                     "nb_read_frames", "sample_rate", "channels", "display_aspect_ratio"]})
    print("duration", info["format"]["duration"], "size", info["format"]["size"])


if __name__ == "__main__":
    main()
