#!/bin/bash
# Refaz a V4 inteira a partir de uma locução nova do roteiro aprovado (qualquer voz):
#   ./scripts/rebuild_all.sh assets/audio/source/<take>.mp3
# Edita as pausas, recalcula cortes de cena, legendas e SRT, refaz a mixagem, valida,
# renderiza as duas versões e roda o controle de qualidade.
set -e
cd "$(dirname "$0")/.."
python3 scripts/build_voice.py "$1"
python3 scripts/build_timing.py
python3 scripts/build_audio.py
npx --yes hyperframes@0.8.171 lint
npx --yes hyperframes@0.8.171 check
npx --yes hyperframes@0.8.171 render -o output/BT_Divorcio_Cartorio_Reel_V4.mp4 --fps 30 --quality delivery
npx --yes hyperframes@0.8.171 render -o output/BT_Divorcio_Cartorio_Reel_V4_ReducedMotion.mp4 --fps 30 --quality delivery --variables '{"reducedMotion":true}'
python3 scripts/qa_render.py output/BT_Divorcio_Cartorio_Reel_V4.mp4 V4
python3 scripts/qa_render.py output/BT_Divorcio_Cartorio_Reel_V4_ReducedMotion.mp4 V4_ReducedMotion
