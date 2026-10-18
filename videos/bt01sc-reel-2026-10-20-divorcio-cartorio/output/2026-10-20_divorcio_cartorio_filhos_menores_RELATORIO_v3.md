# Relatório técnico: Reel V3 BT.01.SC | Bispo & Teixeira Advogados | 20/10/2026

**Status:** V3 renderizada e medida, pronta para revisão humana. Ela parte da V2 (voz Henrique) e muda só a assinatura final. As versões V1 e V2 estão preservadas em `output/`.

## 1. Pedido e mudança

Pedido do usuário: colocar no final o logo do escritório, o telefone e o Instagram, "que já foram enviados".

**Dados usados, conferidos em duas fontes:**
- Quadro final do Reel anterior enviado nesta conversa (`bt-reel-divorcio-nao-quer_v3_normal.mp4`): "(38) 9 9129-6401" e "@bispoeteixeiraadvogados".
- Código-fonte daquele projeto (`reels/bt-reel-divorcio-nao-quer/tools/index_v3.template.html`, branch `ccr-65af0509-y3qdix` do Marketing-Skills), com os mesmos valores.

**Cena 07 da V3:**
- Logo original do escritório, sem reconstrução.
- Linha Gold e o texto travado "Informação jurídica com responsabilidade.".
- Telefone em Montserrat 700, 56 px, cor Paper.
- Instagram com ícone de contorno em BT Sky e o perfil em Montserrat 600, 40 px, o mesmo tratamento do Reel anterior.
- Não incluí "Salve esta informação.", que existia no Reel anterior, porque não foi pedido e não consta do roteiro aprovado.

**Ponto registrado:** o prompt técnico aprovado dizia, para a cena 07, "Nenhum telefone, WhatsApp, formulário, oferta ou CTA adicional". A inclusão atende ao seu pedido expresso e está registrada em `BRIEF.md`.

## 2. Tempo

Um telefone precisa de tempo de leitura. Por isso, o escurecimento da mesa começa em **37,5 s** (V2: 38,5 s), e a tela fica totalmente Midnight a partir de 38,2 s.

| Elemento | Entrada |
| --- | --- |
| Logo | 38,1 s |
| Linha Gold | 38,5 s |
| "Informação jurídica com responsabilidade." | 38,7 s |
| Telefone | 39,1 s |
| Instagram | 39,3 s |

Os contatos ficam cerca de 2,8 s na tela, até o último quadro.

A síntese da cena 06 mantém cerca de 1 s de leitura depois da linha Gold, que termina em 36,45 s. A fala "O divórcio pode ser formalizado no cartório." termina em 37,07 s, antes do escurecimento. O total segue em 42 s. Áudio, trilha, efeitos e legendas são os da V2: o `.srt` da V3 é cópia idêntica do da V2.

## 3. Medições do arquivo final

Medido com ffprobe/ffmpeg sobre `output/2026-10-20_divorcio_cartorio_filhos_menores_REEL_v3.mp4`:

| Parâmetro | Medido |
| --- | --- |
| Duração | 42,000 s |
| Quadros | 1260 a 30/1 fps |
| Vídeo | H.264 High, 1080 x 1920, DAR 9:16, yuv420p |
| Áudio | AAC LC, 48 kHz, estéreo |
| Tamanho | 37.860.471 bytes (36,1 MB) |
| Loudness / true peak / LRA | -16,1 LUFS / -2,7 dBTP / 4,4 LU |
| Decodificação integral | sem erros |
| Sincronia do áudio com o mix de referência | 0,0 ms |
| `hyperframes check` | lint 0, runtime 0, layout 0 em 9 amostras, motion 0, contraste 25/25 WCAG AA |

**Quadros:** `output/2026-10-20_divorcio_cartorio_filhos_menores_FRAMES_v3/`, que inclui `frame_41-9s_assinatura.png`, o quadro final conferido caractere por caractere.

## 4. Arquivos da V3

- `output/2026-10-20_divorcio_cartorio_filhos_menores_REEL_v3.mp4`
- `output/2026-10-20_divorcio_cartorio_filhos_menores_LEGENDAS_v3.srt` e `output/REEL_20-10-2026_LEGENDA_FINAL_v3.srt`
- `output/2026-10-20_divorcio_cartorio_filhos_menores_FRAMES_v3/`, `output/qa_medicoes_v3.json`
- Fonte alterada: `compositions/assinatura.html`, `index.html` (janelas das sub-composições), `compositions/mesa.html` e `compositions/sintese-textos.html` (duração do slot)

## 5. Pendências

- Confirmar se o telefone é o atendido pelo escritório e se tem WhatsApp. O vídeo não promete WhatsApp, só mostra o número. **Você deve verificar isto.**
- Audição humana, licença comercial da voz no plano ElevenLabs e teste em celular real.
