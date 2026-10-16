# Design spec, Fim da escala 6x1

Verdade de marca desta peça. Deriva do design system BT.01.SC com extensão BT.01.M (https://claude.ai/artifact/8b4ZD9Mih5EVsNVhZ1tAD7) e do prompt de produção. Em divergência, cores e tipografia seguem o tokens.json, e as exceções da seção 6 do prompt seguem o prompt.

## Cores (tokens pelo nome)

| Token | Valor | Papel nesta peça |
| --- | --- | --- |
| brand-midnight | #081A35 | Fundo das cenas de dados e votação |
| brand-primary | #0B1F4B | Fundo escuro alternativo, preenchimento sobre claro, texto de marca |
| brand-blue | #214D8C | Apoio sobre claro, destaque de legenda sobre caixa Paper |
| brand-sky | #8FC5EF | Destaque sobre escuro, cadeiras "sim", cartões de folga. Nunca texto sobre claro |
| brand-gold | #D4AF7C | Linha, detalhe, quórum. Texto em Gold só sobre Primary ou Midnight |
| surface-sand | #F4EDE2 | Fundo claro alternativo, cartões |
| surface-paper | #FAF8F4 | Fundo claro principal, texto sobre escuro, cadeiras "não" |
| text-ink | #202631 | Texto sobre claro e na caixa de legenda Paper |
| accent-line | Primary no claro, Gold no escuro | Linha editorial |

Gradiente editorial: linear-gradient(135deg, brand-midnight, brand-primary), com textura de pontilhado fixa para evitar faixas na compressão H.264.

## Tipografia

| Estilo | Família e peso | Tamanho e entrelinha | Uso |
| --- | --- | --- | --- |
| social-title | Cormorant Garamond 600 | 112 px, 1,05, -0,015em | Títulos de impacto |
| social-display | Cormorant Garamond 600 | 160 px, 1,0, -0,02em | Palavra ou número protagonista |
| Números grandes (exceção do prompt) | Cormorant Garamond 600 | 220 a 320 px | Placares, relógio, marca d'água |
| social-body | Montserrat 400 | 48 px, 1,3 | Texto, CTA |
| social-meta | Montserrat 600 | 36 px, 1,2, 0,04em | Rótulos, notas, créditos |
| social-caption | Montserrat 500 | 48 px, 1,2 | Legendas |

Números sempre com algarismos tabulares e alinhados.

## Layout

- Quadro 1080 x 1920, 30 fps. Zona de conteúdo x 96 a 900 e y 250 a 1500. Faixa de legenda y 1240 a 1460.
- Alinhamento editorial à esquerda em x 96. Centro óptico da zona em x 498.
- Raios: 16 px nos cartões de dia (prompt), 12 px na caixa de legenda (prompt), 24 px em objetos maiores como o calendário (radius-social-card).
- Sombra: 0 18px 48px rgba(8, 26, 53, 0.12), Midnight a 12%.
- Grade de 8 px como módulo de posicionamento. Grade visível só onde o prompt pede (cena 12, a 4%).

## Legendas

- Fundo claro: caixa Primary, texto Paper, palavra falada em Gold.
- Fundo escuro: caixa Paper, texto Ink, palavra falada em Blue.
- Até 2 linhas de cerca de 30 caracteres, números falados em algarismos. Infográfico cede espaço à legenda, nunca o contrário.

## Movimento

- Durações: 200, 400, 800 e 1600 ms. Delay de stagger 100 ms, de seção 200 ms.
- Curvas: standard (0.4, 0, 0.2, 1), enter (0.16, 1, 0.3, 1), exit (0.4, 0, 1, 1), emphasized (0.22, 1, 0.36, 1), overshoot (0.34, 1.12, 0.64, 1) só onde autorizado.
- Título entra 48 px com emphasized, cartão 24 px com enter, linhas por desenho de traço, logo só com fade de 400 ms.
- Proibido: aberração cromática, glitch, tremor de câmera, flashes acima de 3 por segundo, transições de catálogo, texto girando.

## Não fazer

- Nenhuma cor, sigla, nome ou rosto de partido ou parlamentar.
- Nenhum dado fora da seção 2 do prompt.
- Nenhum desenho ou reconstrução do logotipo.
- Nenhum travessão longo em texto do vídeo, legenda ou relatório.
