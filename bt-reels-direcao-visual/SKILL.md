---
name: bt-reels-direcao-visual
description: >
  Direção visual e modo de produção dos Reels e vídeos animados do Bispo & Teixeira
  Advogados (9:16, 1080 × 1920), consolidada a partir do Reel "Mito ou Verdade 01, Pensão
  aos 18" (versão v005 aprovada). Use sempre que o pedido for criar, animar, narrar,
  legendar ou renderizar um vídeo, Reel, Story animado ou motion do escritório, mesmo que
  o usuário não cite esta skill. Define fontes, cores, bolinha condutora com rastro,
  legendas, curvas e tempos de movimento, momento de impacto, assinatura final, voz,
  som, fluxo de trabalho e as lições já aprendidas. Para peças estáticas (feed, carrossel)
  continue usando o Design_System_BT_Claude.
---

# Direção visual dos Reels BT

Esta skill é a base de partida, não uma fôrma. Cada vídeo pode ter ideias novas de
composição. O que se mantém é o vocabulário: as mesmas fontes, as mesmas cores, a mesma
bolinha, as mesmas legendas, o mesmo ritmo e o mesmo jeito de trabalhar.

Leia nesta ordem:

1. Este arquivo (regras e decisões).
2. `references/movimento.md` (curvas, tempos e receitas de código).
3. `references/bolinha.md` (a bolinha condutora e o rastro).
4. `references/processo.md` (do roteiro ao arquivo final, com a camada de tempo).
5. `references/licoes.md` (problemas já resolvidos; evita repetir erros).

O projeto completo de referência está em `modelo/` (template HTML da v005, scripts,
fontes, logo, GSAP local e o som de impacto).

## Princípio

Editorial, calmo e claro. A animação existe para explicar a fala, nunca para enfeitar.
Cada elemento entra no momento em que a voz o menciona. Um único momento de impacto por
vídeo, no máximo. O resto respira.

Público: pessoas comuns, no celular, muitas vezes sem som. Linguagem simples (nada de
"Súmula 358" na narração; diga "segundo o Superior Tribunal de Justiça").

## Formato e grade

| Item | Valor |
|---|---|
| Quadro | 1080 × 1920, 30 fps |
| Coluna de conteúdo | x de 96 a 904 (largura 808), alinhada à esquerda |
| Faixa de legenda | y de 1240 a 1460 |
| Área livre de interface (manual BT) | 250 px no topo, 300 na base, 60 nas laterais |
| Duração típica | 30 a 40 s |
| Entregas | MP4 normal, MP4 de movimento reduzido, SRT |
| Nome | `BT_<tema>_9x16_ptBR_v001.mp4`, versão sempre incrementada |

Sem cards arredondados. Sem tudo centralizado. Centralizar só a assinatura final e o
momento de impacto.

## Cores

São os tokens do manual BT, com um acréscimo para alerta.

| Token | HEX | Papel no vídeo |
|---|---|---|
| Paper | `#FAF8F4` | Fundo claro principal; texto em cena escura |
| Sand | `#F4EDE2` | Fundo claro alternativo (cena de alerta, lista) |
| Midnight → Navy | `#081A35` → `#0B1F4B` | Gradiente tonal 135° das cenas escuras |
| Navy | `#0B1F4B` | Títulos em cena clara; fundo da assinatura; borda da bolinha |
| Blue | `#214D8C` | Categoria em cena clara; palavra falada na legenda clara |
| Sky | `#8FC5EF` | A bolinha e o rastro; categoria em cena escura |
| Gold | `#D4AF7C` | Fio da legenda escura, sublinhado de destaque, palavra falada na legenda escura. Pouca área |
| Ink | `#202631` | Texto corrido e legenda em cena clara |
| Vermelho alerta | `#B43A35` | Somente para "mito", "falso", risco e consequência grave. Fora dos 10 tokens do manual: aprovado no uso deste Reel, mas não é cor de marca |

Alternância de fundo por cena: claro, claro, claro, escuro, claro (Sand), claro, escuro,
Navy liso na assinatura. Alterne conforme a narrativa, sem regra mecânica.

## Tipografia

| Papel | Família | Uso |
|---|---|---|
| Título | Fira Sans Condensed 800 | 120 px, entrelinha 1, tracking -0,01em, Navy (Paper no escuro) |
| Legenda | Fira Sans Condensed 500 | 54 px, entrelinha 1,14 |
| Texto de apoio | Piazzolla 400/600 | Corpo, citação, explicação |
| Texto de motion | Funnel Sans 500/600 | Rótulos animados, telefone auxiliar, UI |
| Metadado | IBM Plex Mono 500 | Categoria (32 px, maiúsculas, tracking 0,06em), números, fonte, "FALSO" |

Fontes locais em `modelo/assets/fonts` (licença OFL, arquivos de licença incluídos). O
build só começa depois de `document.fonts.load` de todas as faces, para medir certo.

Atenção: o manual estático do escritório define Cormorant Garamond e Montserrat. Esta
combinação foi escolhida para vídeo porque a anterior parecia genérica ("cara de IA") na
tela em movimento. Vale para vídeo. Unificar ou não com as peças estáticas é decisão
do escritório.

## Logo

- Usar só `Logo_BT_Original_Transparente.png` (ou a cópia `_520`), sem redesenhar,
  recolorir ou deformar.
- Logo branca sobre Navy. Na assinatura final: 520 px de largura, centralizada.
- O PNG original tem 391 × 193 px. Acima de cerca de 391 px ele é ampliado e perde
  nitidez. A v005 usa 520 px e ficou aceitável no celular, mas peça ao escritório o
  vetor ou uma versão maior para os próximos vídeos.

## Os quatro elementos de assinatura

1. **Bolinha condutora**: círculo Sky de 30 px com borda Navy de 3 px e um rastro curto.
   Ela vai até o que está sendo dito, como o dedo de quem explica. Sempre círculo (a
   versão que mudava de forma foi recusada). Detalhes em `references/bolinha.md`.
2. **Legenda editorial**: alinhada à esquerda na coluna, fio curto acima (56 × 4 px,
   Navy no claro, Gold no escuro), palavra falada acende (Blue no claro, Gold no escuro).
   Blocos de até duas linhas, sem quebra no meio de expressão.
3. **Revelação pela fala**: título palavra a palavra no gancho, sublinhado dourado
   desenhado quando a voz diz o trecho, linhas e conectores desenhados no ritmo.
4. **Assinatura final**: a cena anterior desfoca (18 px), fundo Navy com duas manchas
   Blue derivando devagar, logo grande entra desfocada e assenta nítida, telefone em
   Fira 800 92 px, fio dourado, nota e fonte em texto pequeno.

## Momento de impacto (opcional, no máximo um por vídeo)

Receita da palavra "prisão" (v005): a palavra sai do título, cresce até o centro em
vermelho, a cena escurece para 12%, bate com som grave, treme, racha em 5 fragmentos e
solta 28 partículas, depois os fragmentos caem. Código em `references/movimento.md`.

Use apenas para uma consequência real e verificada na lei. O manual pede "Impact sem
sensacionalismo" e a publicidade da advocacia exige sobriedade (Provimento 205/2021 do
Conselho Federal da OAB). Sempre mostrar aos advogados antes de publicar.

## Voz e som

- Voz ElevenLabs "Henrique", `voice_id` `3ULAAai0IVN00DTWA6vF`, modelo `eleven_v4`,
  português do Brasil, uma frase por linha no texto enviado.
- Gere com `generations_count: 1`. Cada geração gasta créditos. Nunca repita a chamada
  para "tentar de novo" sem confirmar se a anterior falhou de verdade.
- Áudio final normalizado em -16 LUFS integrado, pico real -1,5 dBTP (script em
  `modelo/tools/render.sh`).
- Sem trilha musical por padrão. Efeitos sintetizados localmente com ffmpeg (receita em
  `references/movimento.md`), volume 0,8, só no momento de impacto.

## Movimento reduzido

Toda composição tem a variável `reducedMotion`. Na versão reduzida: sem bolinha, sem
rastro, sem deslocamentos (só opacidade), sem partículas, sem desfoque. O conteúdo e o
tempo da fala são os mesmos. Sempre renderizar e entregar as duas.

## Texto e conteúdo jurídico

- Não inventar telefone, nome, número de lei, súmula, prazo ou resultado.
- Toda afirmação jurídica da narração deve ser conferida na fonte oficial (Planalto,
  STJ, STF) antes da gravação, e aprovada pelos advogados.
- Telefone oficial usado: (38) 9 9129-6401. Confirmar a cada vídeo se continua válido.
- Português do Brasil. Nunca usar travessão longo em textos, legendas ou roteiro.

## Checklist antes de entregar

- [ ] Roteiro aprovado pelos advogados e afirmações conferidas na fonte oficial.
- [ ] `npx hyperframes lint` e `npx hyperframes check` sem erros.
- [ ] Bolinha medida quadro a quadro: sem salto e sem inversão brusca.
- [ ] Nenhum quadro em branco nas trocas de cena.
- [ ] Legenda dentro da faixa, sem palavra cortada, sincronizada com a voz.
- [ ] Render normal e reduzido; -16 LUFS, pico até -1,5 dBTP.
- [ ] Quadros-chave conferidos em imagem (abertura, cada troca, impacto, assinatura).
- [ ] Entrega com MP4, MP4 reduzido e SRT, versão no nome.
