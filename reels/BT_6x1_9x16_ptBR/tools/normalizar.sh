#!/bin/bash
# Normaliza o áudio de um MP4 para -16 LUFS e -1,5 dBTP em duas passagens (receita do render.sh do modelo v005).
# uso: tools/normalizar.sh <entrada.mp4> <saida.mp4>
set -e
J=$(ffmpeg -hide_banner -i "$1" -af loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
M=$(echo "$J" | python3 -I -c "import json,sys;d=json.load(sys.stdin);print(f\"measured_I={d['input_i']}:measured_TP={d['input_tp']}:measured_LRA={d['input_lra']}:measured_thresh={d['input_thresh']}:offset={d['target_offset']}\")")
ffmpeg -hide_banner -loglevel error -y -i "$1" -c:v copy -af "loudnorm=I=-16:TP=-1.5:LRA=11:$M:linear=true" -ar 48000 -c:a aac -b:a 192k -movflags +faststart "$2"
ffprobe -v error -show_entries stream=codec_name,width,height,nb_frames,sample_rate -show_entries format=duration -of compact "$2"
ffmpeg -hide_banner -nostats -i "$2" -af ebur128=peak=true -f null - 2>&1 | grep -A14 Summary | grep -E "I:|Peak:"
