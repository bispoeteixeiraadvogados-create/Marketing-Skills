#!/bin/bash
# Prepares the S08 footage (Mixkit #241, Stock Video Free License) for the V4 reel:
# 3.0 s from 2.2 s of the 4K source, two 9:16 crops (pen hand, then the hand holding the document),
# defocus of the paper (the source is an English-language contract; its text must not be legible)
# and a BT grade (lower saturation, Navy-leaning shadows). Output: assets/footage/assinatura_241_9x16_v4.mp4
set -e
cd "$(dirname "$0")/.."
SRC=assets/footage/source/mixkit-241-signing-a-contract-2160.mp4
[ -f "$SRC" ] || curl -sS -o "$SRC" https://assets.mixkit.co/videos/241/241-2160.mp4
ffmpeg -v error -y -ss 2.2 -t 3.0 -i assets/footage/source/mixkit-241-signing-a-contract-2160.mp4 -filter_complex "[0:v]fps=30,split=2[a][b];[a]crop=1215:2160:'43+t*95':0,scale=1080:1920:flags=lanczos,format=yuv444p,split=3[sA][bA][mA];[bA]gblur=sigma=11[blA];[mA]format=gray,gblur=sigma=6,lut=y='if(gt(val\,142)\,255\,0)',split[lA][gA];[gA]geq=lum='if(gt(X\,600)*gt(Y\,860)*lt(Y\,1280)\,255\,0)'[qA];[lA][qA]blend=all_mode=lighten,gblur=sigma=10[mkA];[sA][blA][mkA]maskedmerge,eq=saturation=0.74:contrast=1.05:brightness=-0.015,colorbalance=rs=-0.035:gs=-0.005:bs=0.05:rm=-0.015:bm=0.02:rh=0.015:bh=-0.02,vignette=angle=0.55[ca];[b]crop=1004:1785:'1520+t*80':0,scale=1080:1920:flags=lanczos,format=yuv444p,split=3[sB][bB][mB];[bB]gblur=sigma=11[blB];[mB]format=gray,gblur=sigma=6,lut=y='if(gt(val\,142)\,255\,0)',split[lB][gB];[gB]geq=lum='0'[qB];[lB][qB]blend=all_mode=lighten,gblur=sigma=10[mkB];[sB][blB][mkB]maskedmerge,eq=saturation=0.74:contrast=1.05:brightness=-0.015,colorbalance=rs=-0.035:gs=-0.005:bs=0.05:rm=-0.015:bm=0.02:rh=0.015:bh=-0.02,vignette=angle=0.55[cb];[ca][cb]overlay=enable='gte(t,0.92)',format=yuv420p[o]" -map "[o]" -an -c:v libx264 -preset slow -crf 14 -pix_fmt yuv420p -movflags +faststart assets/footage/assinatura_241_9x16_v4.mp4
