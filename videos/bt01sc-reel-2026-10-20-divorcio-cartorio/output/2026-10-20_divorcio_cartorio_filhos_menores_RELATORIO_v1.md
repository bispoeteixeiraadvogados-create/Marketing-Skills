# Relatório técnico: Reel V1 BT.01.SC | Bispo & Teixeira Advogados | 20/10/2026

**Status:** V1 renderizada, medida e pronta para **revisão humana**. Não é versão aprovada para publicação. Ficam pendentes a audição humana da mixagem, a conferência da licença de uso comercial da voz no plano ElevenLabs e o teste em celular real com a interface atual do Instagram (seção 10).

## 1. Stack encontrada e decisão

- **Ambiente:** container Linux em nuvem com três repositórios (`Marketing-Skills`, `hyperframes`, `headroom`). Nenhum projeto audiovisual anterior do BT.01.SC foi encontrado. `Marketing-Skills` contém apenas skills de carrossel (`instagram-carousel*`), sem tokens BT, sem logo e sem vídeo.
- **Baseline:** não existia versão anterior para preservar. O trabalho está isolado na branch `claude/video-use-setup-ym4hwq`, numa pasta nova (`videos/bt01sc-reel-2026-10-20-divorcio-cartorio/`), e nada pré-existente foi alterado.
- **Stack escolhida:** HyperFrames 0.8.171 (HTML + GSAP, captura determinística quadro a quadro via Chrome headless e FFmpeg). Motivos: já estava instalado e é o framework do repositório da sessão. Além disso, permite timeline editável por keyframes, câmera virtual 2.5D, legendas como dados e render reprodutível. After Effects, Blender e Remotion não estavam disponíveis no ambiente.
- **Estrutura:** a mesa das cenas 01 a 06 é **uma única sub-composição** (`compositions/mesa.html`), com um só espaço físico e uma só câmera, para garantir continuidade de lado, escala, luz e sombra. Tipografia das cenas 04 a 06, assinatura e legendas são sub-composições sobrepostas. `index.html` só monta as peças e as três faixas de áudio.

## 2. Inventário MANTER / AJUSTAR / REMOVER / ADICIONAR

O prompt pedia este inventário antes da execução. Como não havia projeto-base, ele foi aplicado diretamente e fica registrado aqui.

| Ação | Item |
| --- | --- |
| MANTER | Roteiro, falas e textos de tela literais; ordem das 7 cenas; duração total de 42 s; paleta BT.01.SC; Cormorant Garamond + Montserrat; logo PNG do escritório sem alteração |
| AJUSTAR | Fronteiras entre cenas 01/02/03 (microdeslocamento de até 0,5 s, seção 5); quebras de linha das legendas do `.srt` guia; tempos do `.srt` (agora derivados do áudio real) |
| REMOVER | Nada pré-existente foi removido. Não usados: fotos Pexels opcionais, `images.jpg` (inexistentes no ambiente), aliança 3D e qualquer cenografia jurídica genérica |
| ADICIONAR | Projeto HyperFrames editável; narração ElevenLabs; trilha e efeitos originais sintetizados; texturas procedurais; scripts reprodutíveis de áudio, legendas, texturas e QA |

## 3. Caminhos reais

Raiz do projeto: `Marketing-Skills/videos/bt01sc-reel-2026-10-20-divorcio-cartorio/`

| Artefato | Caminho |
| --- | --- |
| Vídeo final | `output/2026-10-20_divorcio_cartorio_filhos_menores_REEL_v1.mp4` |
| Legendas (nome do prompt) | `output/2026-10-20_divorcio_cartorio_filhos_menores_LEGENDAS_v1.srt` |
| Legendas (nome do pacote ZIP) | `output/REEL_20-10-2026_LEGENDA_FINAL.srt` (conteúdo idêntico) |
| Quadros críticos e contact sheets | `output/2026-10-20_divorcio_cartorio_filhos_menores_FRAMES_v1/` (+ `safe_zone_overlay/`) |
| Medições brutas | `output/qa_medicoes_v1.json` |
| Áudio isolado (stems) | `assets/audio/voz_narracao_v1.wav`, `trilha_original_v1.wav`, `sfx_papel_v1.wav` |
| Tomadas originais ElevenLabs | `assets/audio/source/` |
| Mapa de tempos (palavra a palavra) | `assets/audio/timing_v1.json` |
| Projeto-fonte | `index.html`, `compositions/*.html`, `BRIEF.md`, `STORYBOARD.md` |
| Scripts | `scripts/build_audio.py`, `build_captions.py`, `build_textures.py`, `qa_render.py` |
| Licenças e origem dos assets | `MANIFESTO_ASSETS.md`, `assets/fonts/OFL_*.txt` |
| Briefing recebido | `briefing/` |

## 4. Reprodução

```bash
cd videos/bt01sc-reel-2026-10-20-divorcio-cartorio
python3 scripts/build_textures.py        # texturas (seed fixa)
python3 scripts/build_audio.py           # stems de voz, trilha e efeitos + timing_v1.json + medição
python3 scripts/build_captions.py        # .srt final + dados das legendas em compositions/legendas.html
npx hyperframes check                    # lint, runtime, layout, motion, contraste
npx hyperframes render -o output/2026-10-20_divorcio_cartorio_filhos_menores_REEL_v1.mp4 --fps 30 --quality delivery
python3 scripts/qa_render.py output/2026-10-20_divorcio_cartorio_filhos_menores_REEL_v1.mp4
# versão sem legendas queimadas: acrescentar --variables '{"legendas":false}' ao render
```

As palavras da tomada foram alinhadas com `faster-whisper` (modelo `medium`). O arquivo de palavras já está salvo em `assets/audio/source/*.words.json`, e o script `build_audio.py` o reutiliza.

**Versões:** HyperFrames 0.8.171 · GSAP 3.14.2 · Node 22.22.0 · FFmpeg 6.1.1 · Python 3.13 · numpy 2.5.3 · scipy 1.18.1 · Pillow 12.3.0 · faster-whisper 1.2.1 · ElevenLabs `eleven_v4`.

## 5. Timecodes finais e diferenças para o storyboard

| Cena | Storyboard | Final | Delta | Fala real (início-fim) |
| --- | --- | --- | --- | --- |
| 01 O questionamento | 0-3 | 0,0-3,5 | +0,5 s | 0,10-3,28 |
| 02 A revelação | 3-6 | 3,5-6,2 | início +0,5, fim +0,2 | 3,62-5,54 |
| 03 A condição jurídica | 6-15 | 6,2-15,0 | início +0,2 | 6,35-14,21 |
| 04 O cuidado necessário | 15-22 | 15,0-22,0 | 0 | 15,20-21,64 |
| 05 O divórcio em cartório | 22-31 | 22,0-31,0 | 0 | 22,25-29,33 |
| 06 A síntese visual | 31-39 | 31,0-39,0 | 0 | 31,15-37,83 |
| 07 Assinatura | 39-42 | 39,0-42,0 (luz baixa desde 38,5) | 0 | 39,25-41,41 |

**Justificativa do delta da cena 01:** a pergunta inicial tem 10 palavras e duas interrogações. Na leitura natural da voz escolhida, ela dura 3,18 s. Para não acelerar a voz nem sobrepor falas, a cena 01 ganhou 0,5 s, compensados na cena 02, dentro da tolerância de cerca de 1 s prevista no prompt. O total permanece em 42 s.

**Sincronia de texto e fala:** "GUARDA", "CONVIVÊNCIA" e "ALIMENTOS" pousam junto com as palavras (9,72 / 10,32 / 11,12 s). A faixa "RESOLVIDOS NA JUSTIÇA" entra em "resolvidos" (12,94 s). "ESCRITURA PÚBLICA" chega em "escritura" (25,27 s). "JUSTIÇA" entra em "questões dos filhos" e "CARTÓRIO" em "O divórcio pode ser formalizado".

## 6. Medições do arquivo final (ffprobe/ffmpeg sobre o MP4 entregue)

| Parâmetro | Medido |
| --- | --- |
| Duração | 42,000 s |
| Quadros | 1260 (contagem por decodificação) a 30/1 fps |
| Vídeo | H.264 High, 1080 x 1920, DAR 9:16, yuv420p |
| Áudio | AAC LC, 48 kHz, estéreo |
| Tamanho | 37.139.338 bytes (35,4 MB) |
| Loudness integrado | -16,0 LUFS (EBU R128) |
| True peak | -3,0 dBTP |
| Faixa de loudness (LRA) | 3,6 LU |
| Decodificação integral | sem erros (código 0) |
| Sincronia áudio do MP4 x mix de referência | desvio 0,0 ms (correlação cruzada) |
| `hyperframes check` | lint 0, runtime 0, layout 0 problemas em 9 amostras, motion 0, contraste 22/22 WCAG AA |

## 7. Locução

- **Voz:** ElevenLabs, voz feminina de biblioteca "Clarice Rodrigues", PT-BR, modelo `eleven_v4`, texto enviado literalmente em parágrafo único, sem tags de interpretação.
- **Tomadas:** as vozes "Luciana Cadar" (50,8 s) e "Christine" (48,0 s e 52,7 s) foram geradas e **descartadas**, porque a fala natural delas não cabe em 42 s sem aceleração artificial. A tomada da Clarice tem 37,6 s naturais. Créditos consumidos: cerca de 2.378, sendo 596 x 3 tomadas descartadas + 590 da tomada usada. Outras 3 variações foram recusadas pelo limite de taxa da API, sem cobrança informada.
- **Edição:** a tomada única foi cortada apenas dentro das pausas entre parágrafos, com fades de 8 ms, e cada parágrafo foi posicionado na sua cena. Não houve aceleração, time-stretch ou troca de palavras.
- **Integridade:** o reconhecimento de fala encontrou as **89 palavras, na ordem do roteiro**, e `build_captions.py` aborta se alguma divergir. "Convivência", "escritura pública" e "defensor público" foram reconhecidas corretamente, o que indica boa inteligibilidade. A palavra "extrajudicial", listada para auditoria no prompt, **não consta do roteiro travado**, por isso não foi narrada.

## 8. Trilha, efeitos e mixagem

- **Trilha:** composição instrumental original sintetizada no próprio projeto, com pad, piano suave, pulso grave e progressão em Ré maior que resolve na cena 06. Ela tem redução na cena 04, abertura discreta na cena 05 e fade final de 1,6 s. Não há música de terceiros.
- **Efeitos:** papel deslizando, contato de papel, movimento e fechamento da pasta, todos sintetizados e sincronizados aos movimentos. A cena 03 tem três contatos leves, abaixo das palavras.
- **Mix:** a trilha fica cerca de 17 LU abaixo da voz, com ducking adicional de 7 dB acionado pela própria voz. Os efeitos ficam cerca de 19 LU abaixo da voz. O pico de amostra do mix é -3,0 dBFS, sem clipping.
- **Limitação honesta:** o ambiente não permite audição. A qualidade estética da trilha sintetizada foi verificada só por espectrograma e níveis, não por escuta. Ela pode soar mais simples do que uma trilha de biblioteca profissional. Por isso, a audição humana é obrigatória antes de aprovar.

## 9. QA visual

Inspecionei 22 instantes por snapshot ao longo do desenvolvimento e mais 8 quadros extraídos do MP4 final (0,5 / 1,5 / 4,5 / 10 / 18 / 25 / 35 / 40 s). Problemas encontrados e corrigidos:

1. A capa da pasta girava pelo centro e cobria as folhas da cena 03. Agora ela gira pela lombada (`transform-origin` à esquerda).
2. "DIVÓRCIO EM CARTÓRIO?" quebrava em 3 linhas e colidia com a legenda. A fonte e a folha foram redimensionadas, e o texto agora tem 2 linhas fixas.
3. O enquadramento da cena 03 estava desequilibrado e a base da pasta tocava a legenda. A câmera foi reposicionada.
4. "Assistência de advogado ou defensor público." deixava "público." isolado. A quebra foi fixada em 2 linhas.
5. "CONSENSO DO CASAL" colidia com a pasta durante o recuo de câmera. O recuo ficou mais curto e a entrada do texto foi alinhada à palavra "consenso".
6. Textos fisicamente cobertos por outro papel, como as perguntas sob "SIM," e os rótulos sob a capa, são desligados no instante em que ficam cobertos. Isso não muda nenhum pixel visível e elimina falsos positivos de contraste e oclusão.

**Safe zones:** os quadros com sobreposição das margens do prompt (90 px laterais, 240 px no topo e 400 px na base) estão em `safe_zone_overlay/`. Todos os títulos e legendas ficam dentro da área útil. Só bordas de papel avançam nas margens laterais, o que é intencional. **Isso é uma verificação geométrica, não um mockup real da interface atual do Instagram: você deve verificar isto** em um aparelho.

**Logo:** é o arquivo PNG do escritório (391 x 193, transparente), exibido a 440 x 217, com a mesma proporção e ampliação de 1,125x. Não foi reconstruído, recolorido nem transformado em 3D. A leve perda de nitidez por ser raster pequeno pode ser resolvida com SVG oficial ou PNG em alta resolução.

## 10. Conferência jurídica

O conteúdo jurídico é o do roteiro aprovado, sem alteração. Para a prioridade nº 1 (precisão jurídica), conferi o texto consolidado no repositório oficial do CNJ (https://atos.cnj.jus.br/atos/detalhar/179, acessado em 18/10/2026). Trechos literais:

- Art. 34, § 2º (redação dada pela Resolução n. 571, de 26.8.2024): "Havendo filhos comuns do casal menores ou incapazes, será permitida a lavratura da escritura pública de divórcio, desde que devidamente comprovada a prévia resolução judicial de todas as questões referentes à guarda, visitação e alimentos deles, o que deverá ficar consignado no corpo da escritura."
- Art. 35 (redação da Resolução 571/2024, conferida em https://atos.cnj.jus.br/atos/detalhar/5705): "[...] com recusa de reconciliação e concordância com a regulamentação da guarda, da convivência familiar e dos alimentos dos filhos menores e/ou incapazes realizada em juízo."
- Art. 8º: "É necessária a presença do advogado, dispensada a procuração, ou do defensor público, na lavratura das escrituras aqui referidas, nelas constando seu nome e registro na OAB."

**Observação crítica, sem alteração do roteiro:** o § 2º usa "visitação", enquanto o roteiro usa "convivência". A escolha tem respaldo no art. 35 ("convivência familiar") e na linguagem atual, então não vejo erro. Registro apenas para ciência. Não conferi a Resolução 695/2026 citada no prompt, porque ela não afeta o art. 34, segundo o próprio prompt.

## 11. Pendências e bloqueios

| # | Item | Ação necessária |
| --- | --- | --- |
| 1 | Audição humana da voz e da trilha sintetizada | Ouvir o MP4 em fone e alto-falante de celular. Se a trilha não agradar, fornecer uma faixa licenciada e eu substituo o stem, sem refazer a animação |
| 2 | Licença comercial da voz ElevenLabs | Conferir se o plano da conta permite uso comercial da voz de biblioteca. **Você deve verificar isto** |
| 3 | Logotipo em alta resolução | Se existir SVG ou PNG maior, enviar para a V2 |
| 4 | Teste em celular real com a interface atual do Reels | Conferir sobreposição da UI sobre legendas e títulos |
| 5 | Inventário prévio (seção 4.7 do prompt) | Não foi apresentado antes da execução, porque não havia projeto-base. Está registrado na seção 2 |

Nenhum carrossel, Stories ou peça derivada foi produzido.
