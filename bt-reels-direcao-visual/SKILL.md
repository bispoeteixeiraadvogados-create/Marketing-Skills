---
name: bt-reels-direcao-visual
description: >
  Direção visual geral dos Reels e vídeos animados do Bispo & Teixeira Advogados
  (9:16, 1080 × 1920), válida para qualquer tema. Use sempre que o pedido for criar,
  animar, narrar, legendar ou renderizar um vídeo, Reel, Story animado ou motion do
  escritório, mesmo que o usuário não cite esta skill. Define cores, fontes, grade,
  composições, bolinha condutora com rastro, motion fluido, transições, momento de
  ênfase, regras contra "cara de IA", legendas, assinatura final, voz, som e processo.
  É uma direção visual: o prompt de cada vídeo define conteúdo e pode ajustá-la.
  Para peças estáticas (feed, carrossel) continue usando o Design_System_BT_Claude.
---

# Direção visual BT para vídeos

## Como esta direção se aplica

Ela define a identidade visual, não o conteúdo. O prompt de cada vídeo traz tema,
roteiro e formato, e pode mudar pontos desta direção. Precedência:

1. O que o usuário pedir na conversa.
2. O prompt escrito enviado com o vídeo.
3. Esta direção.
4. O Design System do escritório, para o que esta direção não cobrir.

Leia também:

- `references/movimento.md`: curvas, tempos, transições e receitas de código.
- `references/bolinha.md`: a bolinha condutora e o rastro.
- `references/sem-cara-de-ia.md`: o que evitar e o que fazer no lugar.
- `references/processo.md`: do roteiro ao arquivo final.
- `references/licoes.md`: problemas já resolvidos e decisões do escritório.
- `modelo/`: um projeto completo de exemplo (template, scripts, fontes, logo, GSAP local,
  som de ênfase). Reaproveite a estrutura e as funções, nunca o conteúdo.

## Princípios

1. **Editorial.** Parece uma página bem diagramada que ganhou movimento, não um anúncio.
2. **Guiado pela fala.** Nada aparece antes da voz mencionar; nada se mexe depois que a
   voz terminou de explicar.
3. **Um protagonista por cena.** Uma ideia dominante e até dois apoios. Se não cabe,
   vira outra cena, não fonte menor.
4. **Calmo e fluido.** Movimentos contínuos, curvas suaves, um de cada vez.
5. **Humano, não genérico.** Linguagem simples, marca real, detalhe concreto do tema.

## Formato e grade

| Item | Valor |
|---|---|
| Quadro | 1080 × 1920, 30 fps |
| Coluna | x de 96 a 904, alinhada à esquerda |
| Título | começa entre y 400 e 560; categoria em mono cerca de 20 px acima |
| Legenda | faixa de y 1240 a 1460 |
| Área livre de interface | 250 px no topo, 300 na base, 60 nas laterais |
| Cantos | retos; sem cards arredondados com sombra |
| Centralizado | só o momento de ênfase e a assinatura final |
| Entregas | MP4 normal, MP4 de movimento reduzido, SRT |
| Nome | `BT_<tema>_9x16_ptBR_v001.mp4`, versão sempre incrementada |

Composições de base (combine e varie): título protagonista; número protagonista; lista
de até três itens com fio Navy acima de cada um; linha ou processo desenhado com a fala;
trecho de lei ou decisão com sublinhado dourado; assinatura final.

## Cores

| Token | HEX | Papel |
|---|---|---|
| Paper | `#FAF8F4` | Fundo claro principal; texto sobre escuro |
| Sand | `#F4EDE2` | Fundo claro alternativo |
| Midnight | `#081A35` | Início do gradiente escuro (135°, até Navy) |
| Navy | `#0B1F4B` | Títulos no claro; fundo da assinatura; contorno da bolinha |
| Blue | `#214D8C` | Categoria, palavra-chave, palavra falada na legenda clara |
| Sky | `#8FC5EF` | Bolinha, rastro, rótulos no escuro |
| Gold | `#D4AF7C` | Sublinhado, fio, palavra falada na legenda escura. Pouca área (5% a 10%) |
| Ink | `#202631` | Texto corrido e legenda no claro |
| Clay | `#A66E52` | Apoio humano eventual |
| Olive | `#66725C` | Campo e território |
| Vermelho alerta | `#B43A35` | Só risco, erro e consequência grave. Fora dos tokens oficiais |

Alterne cenas claras e escuras pela narrativa; use o escuro para os momentos de peso e
feche sempre em Navy liso. Proibido: Gold em texto fino no claro, gradiente colorido,
brilho, metal, neon, paleta gerada a partir de uma cor, logo recolorida.

## Tipografia

| Papel | Família | Uso no quadro 1080 |
|---|---|---|
| Título e palavra protagonista | Fira Sans Condensed 800 | 96 a 160 px, entrelinha 1, tracking -0,01em |
| Legenda | Fira Sans Condensed 500 | 54 px, entrelinha 1,14 |
| Texto de apoio | Piazzolla 400 e 600 | 40 a 50 px, entrelinha 1,35 |
| Motion e interface | Funnel Sans 500 e 600 | 46 a 76 px |
| Categoria, número, fonte | IBM Plex Mono 500 | 28 a 32 px, maiúsculas, tracking 0,06em |

Regras: categoria acima, título dominante, apoio abaixo; texto longo se edita ou divide,
nunca se diminui; palavra-chave só por cor (Blue no claro, Gold no escuro), sem sombra,
contorno ou degradê; maiúsculas só na mono. Fontes locais em `modelo/assets/fonts`
(OFL); montar a animação só depois de carregá-las.

O manual estático usa Cormorant Garamond e Montserrat. Esta combinação vale para vídeo;
unificar é decisão do escritório.

## Elementos de assinatura

1. **Bolinha condutora**: círculo Sky de 30 px, contorno Navy de 3 px, rastro curto.
   Sempre círculo, um movimento por vez, sem mola. Ver `references/bolinha.md`.
2. **Legenda editorial**: à esquerda, fio de 56 × 4 px acima (Navy no claro, Gold no
   escuro), palavra falada acende. Até duas linhas, sem atravessar troca de cena.
3. **Sublinhado dourado**: fio Gold de 4 px desenhado sob o trecho falado.
4. **Categoria em mono** acima de todo título.
5. **Assinatura final**: a última cena desfoca 18 px; Navy com duas manchas Blue
   derivando; logo original grande entra desfocada e assenta; "TELEFONE" e o número em
   Fira 800; "INSTAGRAM", ícone branco de contorno e o perfil; fio dourado; nota
   informativa e fontes em texto pequeno. Dados atuais: (38) 9 9129-6401 e
   @bispoeteixeiraadvogados. Conferir a cada vídeo.

## Motion

- Entra com a fala, para enquanto explica, um gesto por vez, entrada e saída na mesma
  direção, distâncias curtas (texto 20 a 36 px), nenhum efeito sem motivo.
- Tempos: base 0,55 s; saída 0,30 s; linhas 0,80 s; palavra 0,40 s.
- Curvas: emphasized, enter, exit, inOut, standard (valores em `references/movimento.md`).
- Transições: dissolve centrado no corte (padrão), revelação circular a partir de um
  objeto, desfoque para a assinatura, continuidade pela bolinha. Proibidas: glitch, giro
  3D, cubo, página virando, zoom brusco, flash branco, "whoosh" em toda troca.
- Ritmo calmo. Versões aceleradas foram recusadas.

## Momento de ênfase

No máximo um por vídeo, para a palavra que carrega o risco principal. Versão leve: a
palavra cresce e assenta com sublinhado. Versão forte: sai do título, cresce no centro em
vermelho, a cena escurece, bate com som grave, racha em fragmentos e solta partículas.
Só com consequência real, conferida na lei e aprovada pelos advogados (Provimento
205/2021 do CFOAB pede sobriedade na publicidade).

## Sem cara de IA

Regra mais importante. Resumo (lista completa em `references/sem-cara-de-ia.md`): nada
de gradiente roxo, neon, brilho, cards de vidro arredondados, tudo centralizado, fontes
genéricas, texto com degradê ou contorno, emojis, ícones 3D, martelo e balança,
partículas flutuando, elementos que pulsam à toa, texto digitando, zoom infinito,
legenda amarela gigante, pessoas geradas por IA, frases de impacto vazias, voz robótica,
trilha épica. Teste: se um quadro pausado pudesse ser de qualquer escritório, refaça.

## Voz e som

- ElevenLabs "Henrique", `voice_id` `3ULAAai0IVN00DTWA6vF`, modelo `eleven_v4`,
  português do Brasil, tom calmo e próximo, uma frase por linha.
- `generations_count: 1`; texto aprovado antes de gerar; nunca repetir a chamada para
  "tentar de novo" sem confirmar a falha.
- Final em -16 LUFS integrado, pico -1,5 dBTP (`modelo/tools/render.sh`).
- Sem trilha por padrão. Efeito sonoro só no momento de ênfase.

## Acessibilidade

Toda composição tem a variável `reducedMotion`. Na versão reduzida: sem bolinha, rastro,
deslocamentos, partículas ou desfoque; mesmo conteúdo, voz e legenda. Sempre entregar
as duas versões.

## Conteúdo jurídico

Não inventar telefone, perfil, nome, lei, súmula, prazo ou resultado. Toda afirmação da
narração conferida na fonte oficial (Planalto, STJ, STF) e aprovada pelos advogados.
Português do Brasil, linguagem simples, nunca travessão longo.

## Checklist

- [ ] Roteiro aprovado; afirmações conferidas; nenhum dado inventado.
- [ ] Só cores da paleta, Gold em pouca área; só as quatro fontes, cada uma no papel.
- [ ] Coluna à esquerda; um protagonista por cena; listas até três itens.
- [ ] Nada antes da fala, nada se mexendo à toa; bolinha sem saltos e sem mola.
- [ ] No máximo um momento de ênfase; passou no teste "sem cara de IA".
- [ ] `npx hyperframes lint` e `npx hyperframes check` sem erros; nenhum quadro em branco.
- [ ] Legenda sincronizada dentro da faixa, com SRT.
- [ ] Assinatura com logo original, telefone e Instagram conferidos.
- [ ] Render normal e reduzido em 1080 × 1920; -16 LUFS, pico até -1,5 dBTP.
