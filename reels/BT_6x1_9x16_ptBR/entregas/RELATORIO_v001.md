# Relatório de entrega, Reel "Fim da escala 6x1", v001

Bispo e Teixeira Advogados, 9:16, português do Brasil. Data: 16/10/2026.

## 1. Arquivos entregues

| Arquivo | Conteúdo |
| --- | --- |
| `BT_6x1_9x16_ptBR_v001.mp4` | Versão principal, 1080 x 1920, 30 fps, H.264, AAC 48 kHz |
| `BT_6x1_9x16_ptBR_v001_reduced.mp4` | Versão de movimento reduzido: sem bolinha, sem deslocamento, giro, escala ou desfoque; mesmo texto, mesma voz e mesmo tempo |
| `BT_6x1_9x16_ptBR_v001.srt` | Legenda completa, 22 blocos, inclusive CTA e assinatura |
| `BT_6x1_capa_ptBR_v001.png` | Capa 1080 x 1920, conteúdo essencial entre y 300 e 1600 (área que o feed mostra em 3:4) |

Projeto-fonte organizado em `reels/BT_6x1_9x16_ptBR/` na branch `claude/video-use-setup-ut7hr6` do repositório Marketing-Skills.

## 2. Medidas (conferidas nos arquivos finais)

MEDIDAS

## 3. O que foi aplicado da Direção Visual BT

A base usada foi o modelo v005 da pasta `bt-reels-direcao-visual` (branch `ccr-3f2a1194-6op9j2`), lido por inteiro: regras, receitas de movimento, bolinha, processo e lições aprendidas.

- Paleta: Paper e Sand nas cenas claras; gradiente de 135 graus de Midnight para Navy nas cenas escuras; Navy liso na assinatura; Blue, Sky, Gold e Ink nos papéis definidos. Gold em pouca área (sublinhados, fio, legenda no escuro).
- Bolinha condutora: círculo Sky de 30 px com borda Navy de 3 px, um movimento por vez, x em sine.inOut e y em power2.inOut, sem mola; arco amplo de cerca de 1 s nas trocas de cena; some dentro da palavra protagonista e renasce na cena seguinte; rastro de 8 pontos de 22 a 8 px, com atraso de 0,03 s, visível só em movimento, amostrado do caminho real.
- Legenda editorial: coluna x 96 a 904, faixa y 1240 a 1460, fio de 56 x 4 px (Navy no claro, Gold no escuro), palavra falada acende em Blue ou Gold, até duas linhas, nunca atravessa a troca de cena.
- Movimento: entradas de 0,55 s, saídas de texto de 0,30 s subindo 16 px, linhas longas de 0,80 s; dissolve de 0,55 s centrado no corte, com a cena que sai mantida +0,3 s; desfoque de 18 px na saída para a assinatura.
- Assinatura: manchas Blue e Midnight derivando, logo original de 520 px entrando desfocada e assentando nítida, "Fale com a gente", telefone (38) 9 9129-6401, Instagram @bispoeteixeiraadvogados com o glifo, fio dourado, nota e fonte.
- Verificação do modelo: lint e check sem erros; bolinha medida quadro a quadro; luminância de todos os 1800 quadros conferida para quadro em branco ou preto nas trocas; quadros-chave conferidos em imagem.

## 4. Pedidos desta rodada

- Fontes Cormorant Garamond (títulos e números) e Montserrat (texto, legenda e rótulos), por escolha expressa do escritório.
- Fotos com cantos arredondados de 40 px, sombra suave e tratamento mais leve (intensidade do tom reduzida de 0,78 para 0,55, vinheta e granulação menores).
- Vídeo mais claro: de quatro cenas escuras para duas (Câmara e Senado).
- Palavras importantes com realce (cresce até cerca de 13%, brilha e assenta) e estalo sonoro sintetizado: "Um" de folga, "fim", quórum, 461, 19, 75, 1, aprovado nas duas Casas, sanção, promulga, 60 dias, 42 horas, 2 dias, 12 meses, 40 horas, 12x36, regras próprias, rever, limites, "Busque orientação jurídica". "Sem redução de salário" tem um destaque grave próprio.
- Instagram e telefone na assinatura.

## 5. Pontos em que o pedido contraria o modelo v005 (para decisão do escritório)

Registro estes pontos com franqueza, porque o próprio documento diz que foram decisões tomadas em versões anteriores:

1. Fontes. O modelo registra que Cormorant Garamond e Montserrat foram trocadas na v001 por parecerem "cara de IA" em movimento. Mantive a escolha atual do escritório, mas vale comparar com a combinação do modelo antes de padronizar.
2. Cantos arredondados. O modelo diz "sem cards arredondados". Arredondei as fotos e os cartões por pedido expresso desta rodada.
3. Efeitos sonoros. O modelo prevê som só no momento de impacto. Esta versão tem estalos curtos nas palavras importantes, também por pedido expresso. Não usei o momento de impacto em vermelho: não há consequência grave a mostrar, e o vermelho poderia ser lido como cor partidária.
4. Ritmo. O modelo recusou a versão acelerada (v003). Não acelerei: os efeitos novos acontecem junto com a fala e a tela continua parada enquanto a voz explica.

## 6. Pendências e cuidados antes de publicar

- Crédito das fotos 6 e 8: aparece "Foto: [CRÉDITO]" nas cenas 3 e 4. Não inventei autoria. É preciso informar o crédito correto (ou trocar a foto) antes de publicar. Você deve verificar isto.
- Promulgação: a sessão estava marcada para 16/10/2026, às 9h de Brasília. Às 07h21 de Brasília ainda não tinha ocorrido. A frase 5 ("Quem promulga é o próprio Congresso") continua correta em qualquer caso, mas a nota da assinatura diz "Informações de 15/10/2026". Há uma conferência agendada para hoje, às 10h30 de Brasília, só para registrar o resultado.
- "60 dias": as fontes oficiais falam em "dois meses". A redação foi escolha do escritório e está registrada.
- Exceção omitida: a frase 9 não menciona a exceção dos diplomados com salário acima de 2,5 vezes o teto da Previdência, por decisão do escritório.
- Provimento 205/2021 do CFOAB: um único CTA ("Busque orientação jurídica"), sem promessa de resultado, sem preço, sem urgência e sem captação direta. Telefone e Instagram aparecem só na assinatura, como identificação. Recomendo a revisão final dos advogados, como pede o modelo.
- Neutralidade: nenhuma sigla, cor ou rosto partidário; nenhum uso de "vitória", "derrota" ou "conquista".
- Logo: o PNG de 520 px é ampliado a partir do original de 391 px; no celular fica aceitável, mas o modelo recomenda pedir o vetor.
- Período eleitoral: a data de publicação continua sendo decisão do escritório.

## 7. Correções técnicas desta rodada

- Três cenas tinham um elemento interno com o mesmo id da própria cena (calendário, barra de salário e CTA). A animação desse elemento escondia a cena inteira até a palavra-chave. Corrigido.
- O tempo interno de cada cena contava a partir do corte, mas a cena começa 0,275 s antes, no início do dissolve; as animações vinham adiantadas em relação à voz. Corrigido no gerador de tempos.
- O bloco de legenda da frase 5 atravessava a troca da cena 4 para a 5 com estilo escuro sobre fundo claro. Agora o bloco começa na cena nova.
- A bolinha tinha pico de 157 px por quadro na abertura e chegadas atrasadas nas cenas 1 e 4. Agora o pico é de 129 px por quadro, sem inversões e sem atraso.
- Na versão reduzida, a variável não chegava às subcomposições. A leitura passou a ser feita por um ponto único, e os contadores trocam de número por corte seco.
