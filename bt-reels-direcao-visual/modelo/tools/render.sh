#!/bin/bash
# uso: render.sh <dir do projeto> <nome base>
set -e
cd "$1"; mkdir -p renders
npx hyperframes render --quality high --fps 30 --output renders/$2.mp4 2>&1 | tail -3
npx hyperframes render --quality high --fps 30 --variables '{"reducedMotion":true}' --output renders/$2_reduced.mp4 2>&1 | tail -3
cd renders
for f in $2 $2_reduced; do
  J=$(ffmpeg -hide_banner -i $f.mp4 -af loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
  M=$(echo "$J"|python3 -c "import json,sys;d=json.load(sys.stdin);print(f\"measured_I={d['input_i']}:measured_TP={d['input_tp']}:measured_LRA={d['input_lra']}:measured_thresh={d['input_thresh']}:offset={d['target_offset']}\")")
  ffmpeg -hide_banner -loglevel error -y -i $f.mp4 -c:v copy -af "loudnorm=I=-16:TP=-1.5:LRA=11:$M:linear=true" -ar 48000 -c:a aac -b:a 192k -movflags +faststart $f.fixed.mp4 && mv $f.fixed.mp4 $f.mp4
  echo "== $f"; ffprobe -v error -show_entries stream=codec_name,width,height,nb_frames -show_entries format=duration -of compact $f.mp4
  ffmpeg -hide_banner -i $f.mp4 -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|Peak):"
done
