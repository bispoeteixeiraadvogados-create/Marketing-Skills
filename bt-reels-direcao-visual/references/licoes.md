# Lições aprendidas

Primeiro projeto feito com esta direção (Reel "Pensão aos 18"). As decisões abaixo valem para todos os vídeos.

## O que o escritório aprovou e recusou

| Versão | Pedido ou reação | Ficou como regra |
|---|---|---|
| v001 | Fontes Cormorant e Montserrat no vídeo pareceram "cara de IA" | Fira Sans Condensed, Piazzolla, Funnel Sans e IBM Plex Mono |
| v001 | Estilo "Editorial Motion" | Sem cards arredondados, legenda à esquerda, bolinha Sky |
| v002 | "Súmula 358" difícil para o público | Linguagem simples na fala e na tela |
| v002 | Final fraco | Assinatura com logo grande, telefone e transição com desfoque |
| v003 | Versão mais rápida, com notificações e sons | Recusada: manter o ritmo calmo |
| v004 | Bolinha mudando de forma | Recusada: sempre círculo |
| v004 | Movimento demais para quem só assiste | Menos deslocamento, mais tempo parado |
| v005 | Bolinha "travada, mexeu sozinha" | Movimento sequencial, sem mola |
| v005 | Rastro azul e mais movimento só nas trocas | Rastro de 8 pontos; arcos nas trocas de cena |
| v005 | "Prisão" com impacto, som e fragmentos | Momento de impacto, no máximo um por vídeo |

## Problemas técnicos e soluções

| Problema | Causa | Solução |
|---|---|---|
| Bolinha salta e volta sozinha | Tweens sobrepostos depois da conversão de tempo; mola passando do alvo | Trajeto único com `busy`; sem mola |
| Quadro em branco na troca de cena | Fundo na `section` e cena saindo antes do dissolve terminar | Fundo no `.scene-inner`; cena que sai fica +0,3 s; dissolve centrado no corte |
| Partículas e palavra aparecendo antes da hora | `fromTo` renderiza o estado inicial no tempo 0 | `immediateRender: false` e opacidade em `set` separado |
| Palavra invisível durante o voo | Opacidade dentro do mesmo `fromTo` | `RAW.set(opacity: 1)` antes do voo |
| Medidas erradas de posição | Build antes das fontes carregarem | `document.fonts.load` de cada face, depois `build()` |
| Transcrição falhava (PyAV `metadata_errors`) | Incompatibilidade do PyAV | Ler com soundfile e passar o array |
| Playwright não abria o Chromium | Versão diferente da instalada | `playwright@1.55.0` e `executablePath` do Chromium do ambiente |
| ElevenLabs "Free Tier disabled / proxy" | Falha temporária do conector | Esperar e tentar uma vez, com `generations_count: 1` |
| Som de clique baixo demais | Volume do efeito | Medir com `ebur128` após a mixagem |
| Títulos sobrepostos e quebras feias | Texto longo para a coluna | Encurtar o texto antes de diminuir a fonte |

## Princípios que saíram disso

1. Medir em vez de supor: posição da bolinha, loudness, quadros nas trocas.
2. Mudar só o que foi pedido. O usuário diz quando o resto está bom.
3. Simplicidade lê melhor no celular do que efeito.
4. A lei vem antes da estética: afirmação conferida, advogado aprova.
