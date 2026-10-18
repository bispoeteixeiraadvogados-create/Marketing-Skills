#!/usr/bin/env python3
"""Procedural, seeded textures for the BT.01.SC reel (no third-party imagery).

paper_fibra.png  tileable paper fiber + mottling, neutral gray, blended with `multiply` over Sand/Paper
mesa_grao.png    tileable fine grain for the Midnight desk, blended with `overlay` (also dithers gradients)
cartao_fibra.png tileable cardstock fiber for the BT Blue folder
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets/textures"
S = 512
rng = np.random.default_rng(20261020)


def tileable_noise(scale, octaves=4):
    """Band-limited noise built in the frequency domain, so it tiles seamlessly."""
    fx = np.fft.fftfreq(S) * S
    radius = np.sqrt(fx[:, None] ** 2 + fx[None, :] ** 2)
    acc = np.zeros((S, S))
    amp = 1.0
    for o in range(octaves):
        cutoff = scale * 2 ** o
        mask = np.exp(-((radius / cutoff) ** 2))
        img = np.real(np.fft.ifft2(np.fft.fft2(rng.standard_normal((S, S))) * mask))
        acc += (img - img.mean()) / (img.std() + 1e-9) * amp
        amp *= 0.5
    return acc / np.abs(acc).max()


def fibers(count, length, width, alpha):
    im = Image.new("L", (S * 3, S * 3), 0)
    d = ImageDraw.Draw(im)
    for _ in range(count):
        x, y = rng.uniform(S, 2 * S, 2)
        ang = rng.uniform(0, np.pi)
        ln = rng.uniform(length * 0.4, length)
        pts = []
        for k in range(6):
            t = k / 5
            pts.append((x + np.cos(ang) * ln * t + rng.normal(0, 1.2), y + np.sin(ang) * ln * t + rng.normal(0, 1.2)))
        d.line(pts, fill=int(rng.uniform(0.4, 1) * alpha), width=width)
    arr = np.array(im, dtype=float)
    tile = np.zeros((S, S))
    for i in range(3):
        for j in range(3):
            tile += arr[i * S:(i + 1) * S, j * S:(j + 1) * S]
    return tile


def save_gray(arr, name, blur=0.0):
    im = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "L")
    if blur:
        im = im.filter(ImageFilter.GaussianBlur(blur))
    im.save(OUT / name, optimize=True)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    # Paper: base mid-light gray (multiply leaves Sand nearly intact), soft mottling, sparse fibers.
    mott = tileable_noise(4, 4)
    grain = rng.standard_normal((S, S))
    fib = fibers(900, 26, 1, 40)
    paper = 238 + mott * 10 + grain * 3.2 - fib * 0.55
    save_gray(paper, "paper_fibra.png", blur=0.35)

    # Desk: neutral 128 overlay grain (no change on average), with faint long-scale variation.
    desk = 128 + rng.standard_normal((S, S)) * 16 + tileable_noise(3, 3) * 10
    save_gray(desk, "mesa_grao.png", blur=0.45)

    # Cardstock: a little coarser than paper.
    card = 232 + tileable_noise(6, 4) * 12 + rng.standard_normal((S, S)) * 4 - fibers(500, 18, 1, 30) * 0.5
    save_gray(card, "cartao_fibra.png", blur=0.4)
    print("textures written to", OUT)


if __name__ == "__main__":
    main()
