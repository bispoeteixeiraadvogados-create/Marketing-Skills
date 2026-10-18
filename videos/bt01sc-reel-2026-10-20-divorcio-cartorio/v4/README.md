# Reel V4, Divórcio em cartório com filhos menores (Bispo & Teixeira Advogados)

Reconstrução integral do Reel V3 no sistema visual **BT Motion Editorial 2.0**: 33 s, 1080 x 1920, 30 fps, H.264 e AAC.
As versões V1, V2 e V3 continuam na pasta do projeto anterior (`../output/`), sem alteração.

## Estrutura

| Pasta ou arquivo | Conteúdo |
| --- | --- |
| `index.html` | Composição HyperFrames: 11 cenas, legendas, bolinha condutora e áudio |
| `components/` | Componentes reutilizáveis (ver tabela abaixo) e `timing.js`, gerado pela locução |
| `assets/fonts/` | Fira Sans Condensed 500/800, Piazzolla 400/600, Funnel Sans 500/600, IBM Plex Mono 500 (OFL, licenças ao lado) |
| `assets/brand/` | Logo original do escritório (SHA-256 `a039f069…dae487`, o mesmo arquivo do manual BT) |
| `assets/vendor/` | GSAP, CustomEase e Three.js r169, locais: o render não depende de rede |
| `assets/audio/` | Locução bruta e editada, palavras com tempo, efeitos sintetizados e mixagem final |
| `assets/footage/` | Filmagem Mixkit 241 (fonte 4K e versão 9:16 tratada) |
| `assets/textures/` | Texturas procedurais de papel e mesa (geradas por script, sem imagem de terceiros) |
| `scripts/` | Pipeline reprodutível (ver abaixo) |
| `output/` | MP4 normal, MP4 de movimento reduzido, SRT, relatório e QA |

## Componentes

| Componente | Arquivo | Papel |
| --- | --- | --- |
| `SceneLayout` | `components/bt-core.js` | Câmera 2.5D por cena, enquadramentos contíguos, corte no movimento reduzido |
| `EditorialTitle` | `components/bt-core.js` | Título protagonista palavra a palavra no ritmo da fala |
| `WordHighlight` | `components/bt-core.js` | Sublinhado dourado desenhado sob o trecho falado |
| `BTSubtitle` | `components/bt-subtitle.js` | Legenda palavra a palavra, y 1240 a 1460, sem atravessar cortes |
| `BTGuidingDot` | `components/bt-dot.js` | Bolinha Sky com rastro de 8 pontos, um movimento por vez |
| `LegalDocument` | `components/legal-document.js` | Documento abstrato em HTML (sem texto legível) |
| `TimelineGraphic` | `components/timeline-graphic.js` | Infográfico de etapas da cena 09 |
| `JudicialStamp` | `components/three-stage.js` | Carimbo 3D com queda, contato, compressão e sombra (cena 06) |
| `PublicDeed` | `components/three-stage.js` | Escritura 3D com espessura, textura e câmera macro (cena 07) |
| `BTSignature` | `components/bt-signature.js` | Assinatura final com logo, telefone e Instagram |

Todos os tempos saem de `components/timing.js` (palavras da locução real). Nada usa relógio, `Math.random()` sem semente
ou rede durante o render. A variável `reducedMotion` gera a versão acessível.

## Reprodução

Requisitos: Node 22, Python 3 com `numpy`, `scipy`, `soundfile`, `faster-whisper` e `Pillow`, e `ffmpeg`.

```bash
# 1. locução (já gerada; a regravação gasta créditos ElevenLabs): voz Henrique 3ULAAai0IVN00DTWA6vF, eleven_v4
python3 scripts/build_voice.py      # encurta só as pausas entre frases; sem aceleração
python3 scripts/build_timing.py     # components/timing.js e output/BT_Divorcio_Cartorio_Reel_V4.srt
python3 scripts/build_audio.py      # efeitos sintetizados e mixagem a -16 LUFS
./scripts/build_footage.sh          # filmagem 9:16 tratada (precisa da fonte 4K em assets/footage/source)

# 2. validação e render
npx --yes hyperframes@0.8.171 lint
npx --yes hyperframes@0.8.171 check
npx --yes hyperframes@0.8.171 render -o output/BT_Divorcio_Cartorio_Reel_V4.mp4 --fps 30 --quality delivery
npx --yes hyperframes@0.8.171 render -o output/BT_Divorcio_Cartorio_Reel_V4_ReducedMotion.mp4 --fps 30 --quality delivery --variables '{"reducedMotion":true}'

# 3. controle de qualidade
python3 scripts/qa_render.py output/BT_Divorcio_Cartorio_Reel_V4.mp4 V4
python3 scripts/qa_render.py output/BT_Divorcio_Cartorio_Reel_V4_ReducedMotion.mp4 V4_ReducedMotion
NODE_PATH=<pasta com playwright-core@1.55.0> node scripts/qa_motion.mjs   # bolinha e câmeras quadro a quadro
```

## Por que HyperFrames e não Remotion

O prompt pedia Remotion "preferencialmente". A V4 foi montada em HyperFrames porque:

- o manual BT e o projeto-modelo do escritório já usam HyperFrames;
- as versões V1 a V3 foram renderizadas e validadas neste mesmo pipeline;
- HyperFrames tem licença Apache-2.0. Já a licença do Remotion exige licença paga para empresas acima de um certo
  porte (você deve verificar isto nos termos atuais do Remotion, caso a migração venha a ser considerada).

Os componentes pedidos existem com os mesmos nomes, em JavaScript, e a duração é controlada em segundos derivados da
locução (equivalentes a quadros a 30 fps).
