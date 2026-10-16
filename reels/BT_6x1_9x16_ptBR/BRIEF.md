---
workflow: general-video
flow: companion
storyboard: yes
message: "A PEC 221/2019 foi aprovada nas duas Casas e reduz a jornada máxima em etapas, sem redução de salário"
destination: reels-tiktok
aspect: 1080x1920
language: pt-BR
audience: "trabalhadores e empregadores"
length: 62s
angle: explainer
voice: "ElevenLabs Henrique (3ULAAai0IVN00DTWA6vF)"
---

## Intent

Vídeo de motion graphics para Reels e TikTok sobre a aprovação da PEC 221/2019, que acaba com a escala 6x1. Combina infográficos animados (hemiciclo com votos, contadores, calendário, relógio de horas), fotografias do Congresso tratadas com a identidade da marca, pictogramas de pessoas em movimento e um respiro bem-humorado antes do CTA. Padrão de vídeo explicativo de grande veículo de dados, com rigor jurídico, neutralidade política e acabamento premium. Peça independente, sem relação com outros vídeos do escritório.

Fonte do pedido: prompt de produção "Fim da escala 6x1" enviado pelo escritório em 15/10/2026, que é a referência completa de cenas, dados, roteiro e limites.

## Assets

- assets/fotos/foto-06-camara.jpg, foto 6 do envio (Câmara, plenário com painel), cena 3. Uso confirmado pelo escritório. Crédito pendente.
- assets/fotos/foto-08-senado.jpg, foto 8 do envio (Senado, plenário visto do alto), cena 4. Uso confirmado pelo escritório. Crédito pendente.
- assets/brand/Logo_BT_Original_Transparente.png, PNG branco transparente, 391 x 193 px, do branch ccr-3f2a1194-6op9j2 do Marketing-Skills. Uso na assinatura entendido como aprovado na resposta 6; aguarda confirmação expressa.
- assets/fonts/, Cormorant Garamond 500 e 600 e Montserrat 400, 500 e 600, @fontsource 5.3.0, SIL Open Font License 1.1 (LICENSE ao lado).

## Customizations

- Modo impacto, só onde o prompt autoriza: bloom em Sky sobre fundo escuro nas cenas 3, 4 e 5; varredura de luz de 600 ms nos placares e na linha do quórum; poeira de luz nas fotos das cenas 3 e 4; contadores em expo out; pictogramas até 1,3x na cena 2; overshoot de até 4% só no cartão da cena 1 e no despertador da cena 11; motion blur com obturador de 180 graus.
- Hemiciclo gerado por código (tools/hemiciclo.mjs): Câmara 513 cadeiras em 10 fileiras, Senado 81 em 5, votos contrários e cadeiras neutras espalhados de forma uniforme, linha do quórum na cadeira "sim" de número 308 e 49.
- Variante de movimento reduzido no mesmo projeto, por variável.
- Voz gerada pela ElevenLabs, voz Henrique, depois de fechada a frase 5.

## Notes

Decisões do escritório em 15/10/2026, respostas ao plano técnico:

1. Frase 6 e cena 6 mantêm "Sessenta dias" e "+60 dias". As fontes oficiais falam em "dois meses"; a escolha foi do escritório e fica registrada no relatório.
2. Frase 9 mantida, sem incluir a exceção dos diplomados com salário acima de 2,5 vezes o teto da Previdência.
3. Frase 5 depende de pesquisa sobre a promulgação, marcada para 16/10/2026, às 9h, em sessão solene do Congresso. Até 15/10/2026, 23h35 de Brasília, a sessão ainda não tinha ocorrido. A voz só será gerada depois da confirmação.
4. Voz autorizada: ElevenLabs, voz Henrique, uma variação por geração, conforme o padrão do escritório.
5. Fotos 6 e 8 confirmadas para as cenas 3 e 4.
6. Logotipo e canal: resposta "sim", entendida como aprovação do PNG e do canal da Direção Visual. Aguarda confirmação expressa do canal antes da cena 13.
7. Tipografia do prompt (Cormorant Garamond e Montserrat) e ritmo com movimento secundário discreto confirmados, junto com as demais soluções da seção 5 do plano.
8. Data de publicação: ciente do período eleitoral.

Limites inegociáveis do prompt (seção 11) valem para tudo: Provimento 205/2021 da OAB, neutralidade política, nenhum dado fora da seção 2, nenhum contato ou crédito inventado, nenhuma imagem de IA de pessoas ou lugares reais, nenhum travessão longo em texto do vídeo, legenda ou relatório.

Rodada de 16/10/2026 (pedido do escritório após os quadros de estilo):

- Direção Visual BT aplicada a partir do modelo v005 (pasta bt-reels-direcao-visual, branch ccr-3f2a1194-6op9j2): paleta Paper, Sand, Midnight para Navy, Navy, Blue, Sky, Gold e Ink; bolinha condutora com rastro de 8 pontos, um movimento por vez; legenda editorial à esquerda na faixa y 1240 a 1460; dissolve de 0,55 s centrado no corte com a cena que sai mantida +0,3 s; desfoque de 18 px para a assinatura; assinatura com logo de 520 px, telefone, Instagram, fio dourado, nota e fonte.
- Fontes mantidas por escolha expressa do escritório: Cormorant Garamond e Montserrat (o modelo v005 usa Fira Sans Condensed, Piazzolla, Funnel Sans e IBM Plex Mono).
- Vídeo mais claro: só as cenas 3 e 4 ficam escuras (gradiente 135 graus Midnight para Navy); fotos com cantos arredondados de 40 px e tratamento mais leve.
- Palavras importantes com realce (cresce, brilha e assenta) e estalo sonoro sintetizado; destaque grave em "Sem redução de salário".
- Instagram @bispoeteixeiraadvogados e telefone (38) 9 9129-6401 na assinatura, informados pelo escritório.
