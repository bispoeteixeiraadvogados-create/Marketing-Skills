# Relatório técnico: Reel V2 BT.01.SC | Bispo & Teixeira Advogados | 20/10/2026

**Status:** V2 renderizada e medida, pronta para revisão humana. A V2 muda só a locução: imagem, textos de tela, roteiro e trilha continuam os da V1. A V1 está preservada sem alteração (`..._REEL_v1.mp4`, `..._RELATORIO_v1.md` e commit `203134d`).

## 1. Pedido e decisão

Pedido do usuário: trocar a voz pela mesma usada no Reel anterior `bt-reel-divorcio-nao-quer_v3_normal.mp4` e renderizar de novo.

**Identificação da voz:**
- O MP4 enviado não tem metadado de voz. A comparação acústica (embedding de locutor Resemblyzer) contra as 16 vozes femininas em português da conta, a voz local Kokoro e as vozes padrão da ElevenLabs não encontrou correspondência, com no máximo 0,69. A semelhança da referência consigo mesma foi 0,94.
- A origem foi localizada no próprio histórico do escritório, na branch `ccr-65af0509-y3qdix` do repositório Marketing-Skills, em `reels/bt-reel-divorcio-nao-quer/RELATORIO_v3.txt`. Lá consta: "ElevenLabs, Henrique, eleven_v4". O `RELATORIO_v2.txt` registra o ID `3ULAAai0IVN00DTWA6vF`.
- Confirmação acústica: a narração bruta daquele projeto tem 0,87 de semelhança com o vídeo enviado. O MP4 final da V2 tem **0,90** de semelhança com o vídeo enviado.

**Ponto crítico registrado:** "Henrique - Clear and Knowledgeable" é uma voz **masculina**. O prompt técnico aprovado pedia "voz feminina, serena, natural e segura". A troca atende ao seu pedido expresso e fica registrada em `BRIEF.md`. Se o briefing feminino ainda valer para outras peças, ele precisa ser atualizado.

## 2. Locução V2

- **Geração:** ElevenLabs, voz `3ULAAai0IVN00DTWA6vF`, modelo `eleven_v4`, geração `Sbim8lZqzNHRHWkDZcgo`, texto literal do roteiro, 596 créditos. Duração natural: 37,1 s.
- **Integridade:** as **89 palavras estão na ordem do roteiro**, conferidas com faster-whisper `medium`. A primeira transcrição, feita com prompt de contexto, não captou o "e" de "convivência e alimentos". A checagem do trecho isolado com `medium` e `large-v3` mostrou que a palavra está no áudio, curta e coarticulada.
- **Edição:**
  - Cortes apenas dentro das pausas naturais.
  - A pausa entre "Tem filhos menores?" e "O divórcio pode ser feito em cartório?" foi encurtada de 1,05 s para cerca de 0,35 s, para o gancho caber na cena 01. Isso não acelera a voz, só remove silêncio.
  - Nivelamento suave da voz (2,5:1) e limitador de pico, porque o Henrique tem picos mais altos em relação ao volume médio. Sem aceleração nem time-stretch.

| Cena | Janela | Fala V2 |
| --- | --- | --- |
| 01 | 0,0-3,5 | 0,10-3,30 |
| 02 | 3,5-6,2 | 3,70-5,66 |
| 03 | 6,2-15,0 | 6,45-14,03 |
| 04 | 15,0-22,0 | 15,22-21,32 |
| 05 | 22,0-31,0 | 22,25-28,14 |
| 06 | 31,0-39,0 | 31,15-37,07 |
| 07 | 39,0-42,0 | 39,34-41,50 |

As janelas de cena são as mesmas da V1, com o mesmo delta de +0,5 s na cena 01 em relação ao storyboard.

## 3. Ressincronização visual

Os eventos ligados a palavras foram reposicionados no ritmo do Henrique:

| Evento visual | Palavra | Tempo da palavra (s) | Mudança no evento |
| --- | --- | --- | --- |
| Folha "GUARDA" | "guarda" | 9,85 | pousa em 9,88 (V1: 9,72) |
| Folha "ALIMENTOS" | "alimentos" | 10,83 | pousa em 10,85 (V1: 11,12) |
| Alinhamento das folhas | (fim da enumeração) | 11,33 | começa em 11,35 (V1: 11,55) |
| Faixa "RESOLVIDOS NA JUSTIÇA" | "resolvidos" | 12,59 | entra em 12,50 (V1: 12,85) |
| Acordo particular afastado do foco | "particular" | 16,12 | 16,20 (V1: 16,55) |
| Cartão "É necessária..." | "É preciso" | 17,10 | entra em 16,95 (V1: 17,25) |
| Escritura | "escritura" | 24,88 | pousa em 24,95 (V1: 25,30) |
| "Assistência de advogado..." | "com assistência" | 26,16 | 26,10 (V1: 26,45) |
| "JUSTIÇA" | "as questões" | 32,39 | 32,35 (V1: 32,55) |
| "CARTÓRIO" | "O divórcio pode ser formalizado" | 35,11 | 35,05 (V1: 35,45) |
| Linha Gold entre as zonas | (após "CARTÓRIO") | | 35,75 a 36,45 (V1: 36,15 a 36,85) |

Os efeitos de papel foram ressincronizados aos mesmos eventos (`SFX_V2` em `scripts/build_audio.py`). As legendas e o `.srt` foram regenerados a partir dos tempos reais da nova voz.

## 4. Medições do arquivo final

Medido com ffprobe/ffmpeg sobre `output/2026-10-20_divorcio_cartorio_filhos_menores_REEL_v2.mp4`:

| Parâmetro | Medido |
| --- | --- |
| Duração | 42,000 s |
| Quadros | 1260 (contagem por decodificação) a 30/1 fps |
| Vídeo | H.264 High, 1080 x 1920, DAR 9:16, yuv420p |
| Áudio | AAC LC, 48 kHz, estéreo |
| Tamanho | 37.315.679 bytes (35,6 MB) |
| Loudness integrado | -16,1 LUFS |
| True peak | -2,7 dBTP |
| LRA | 4,4 LU |
| Decodificação integral | sem erros |
| Sincronia do áudio do MP4 com o mix de referência | 0,0 ms |
| Voz do MP4 comparada ao Reel anterior enviado | 0,90 (mesma voz) |
| `hyperframes check` | lint 0, runtime 0, layout 0 em 9 amostras, motion 0, contraste 22/22 WCAG AA |

**Quadros e safe zones:** `output/2026-10-20_divorcio_cartorio_filhos_menores_FRAMES_v2/` contém os 8 instantes do prompt, o contact sheet e as sobreposições de safe zone. Todos os textos e legendas ficam dentro da área útil.

## 5. Arquivos da V2

- `output/2026-10-20_divorcio_cartorio_filhos_menores_REEL_v2.mp4`
- `output/2026-10-20_divorcio_cartorio_filhos_menores_LEGENDAS_v2.srt` (cópia idêntica: `output/REEL_20-10-2026_LEGENDA_FINAL_v2.srt`)
- `output/2026-10-20_divorcio_cartorio_filhos_menores_FRAMES_v2/`, `output/qa_medicoes_v2.json`
- `assets/audio/voz_narracao_v2.wav`, `trilha_original_v2.wav`, `sfx_papel_v2.wav`, `timing_v2.json`
- `assets/audio/source/narracao_elevenlabs_v2_henrique.mp3` (+ `.words.json`)

**Reprodução:** `python3 scripts/build_audio.py v2 && python3 scripts/build_captions.py v2`, depois `npx hyperframes render -o output/..._REEL_v2.mp4 --fps 30 --quality delivery` e `python3 scripts/qa_render.py output/..._REEL_v2.mp4`. A V1 é regenerada a partir do commit `203134d`: os scripts atuais aceitam `v1`, mas as composições agora carregam os tempos da V2.

## 6. Custos e pendências

- **Créditos ElevenLabs nesta rodada:** 596 (narração V2) + 4 x 145 (frases de teste para identificar a voz) = 1.176.
- **Pendente:** audição humana; licença de uso comercial da voz no plano da conta (**você deve verificar isto**); teste em celular real. As demais pendências da V1 continuam valendo: logo em alta resolução e trilha sintetizada.
