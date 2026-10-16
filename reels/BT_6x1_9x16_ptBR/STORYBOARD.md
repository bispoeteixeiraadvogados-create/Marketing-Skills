---
format: 1080x1920
duration: 62s
message: "A PEC 221/2019 foi aprovada nas duas Casas e reduz a jornada máxima em etapas, sem redução de salário"
arc: Gancho → Rotina → Votação na Câmara → Votação no Senado → Rito → Etapas da jornada → Exceções → Dois lados → Respiro → CTA → Assinatura
audience: trabalhadores e empregadores
mode: collaborative
---

Tempos estimados; serão recalculados pela transcrição por palavra da voz final. Técnicas citadas pelos nomes de `hyperframes-animation/rules-index.md`.

## Frame 1, Gancho

- status: built
- src: compositions/c01-gancho.html
- duration: 3.2s
- transition_in: cut
- poster: 1.62
- scene: Tira de 7 dias em cartões, 6 de trabalho e 1 de folga, pictograma correndo por cima, marca d'água 6x1
- voiceover: "Seis dias de trabalho. Um de folga."
- rules: waterfall-entry (cascata dos cartões, 40 ms), svg-path-draw (colchetes), motion blur do registro no pictograma

Cartões entram em cascata, ganham Primary e Sky na fala, o cartão de folga pulsa 4% na palavra "um". Saída: a tira se comprime em um bloco (match cut para a cena 2).

## Frame 2, Rotina

- status: built
- src: compositions/c02-rotina.html
- duration: 4s
- transition_in: cut
- scene: Rua em 3 camadas de parallax, sol em arco, fluxo de pictogramas até o prédio TRABALHO, contador Dia 1 a Dia 6
- voiceover: "Essa é a rotina da escala seis por um. E ela está perto do fim."
- rules: vertical-spring-ticker (contador de dias, sem mola), svg-path-draw (traço sobre o 6), viewport-change (parallax)

## Frame 3, Câmara dos Deputados

- status: built
- src: compositions/c03-camara.html
- duration: 6.4s
- transition_in: crossfade
- poster: 2.45
- scene: Foto 6 em duotone por 1,2 s, depois hemiciclo de 513 cadeiras com varredura, linha do quórum 308 e placar 461 a 19
- voiceover: "Em maio, a Câmara aprovou a proposta. Quatrocentos e sessenta e um votos a dezenove."
- rules: counting-dynamic-scale (placar sincronizado às cadeiras), svg-path-draw (quórum), media treatment canônico (curvas por canal, grão, vinheta), nudge-curve (saída para a cena 4)

## Frame 4, Senado Federal

- status: built
- src: compositions/c04-senado.html
- duration: 4s
- transition_in: cut
- scene: Foto 8 em duotone por 1 s, hemiciclo de 81 cadeiras, quórum 49, placar 75 a 1, as duas Casas lado a lado com o selo APROVADO NAS DUAS CASAS
- voiceover: "Em outubro, o Senado confirmou. Setenta e cinco a um."
- rules: counting-dynamic-scale, svg-path-draw, viewport-change (miniaturas lado a lado)

## Frame 5, Rito

- status: built
- src: compositions/c05-rito.html
- duration: 6s
- transition_in: crossfade
- scene: Trilha Câmara, Senado, Promulgação, Diário Oficial; caneta da sanção riscada e desfeita; promulgação conforme a pesquisa da frase 5
- voiceover: "Por ser uma emenda à Constituição, ela não vai para sanção do presidente. Quem promulga é o próprio Congresso."
- rules: svg-path-draw (trilha e risco), discrete-text-sequence (estados dos marcadores)

## Frame 6, Horas

- status: built
- src: compositions/c06-horas.html
- duration: 7s
- transition_in: crossfade
- scene: Relógio de jornada com arco de progresso, 44 rola para 42, linha do tempo Promulgação a +60 dias, pilha de 44 blocos perde 2
- voiceover: "Sessenta dias depois, a jornada máxima cai de quarenta e quatro para quarenta e duas horas por semana."
- rules: stat-bars-and-fills (anel de progresso), vertical-spring-ticker (contador mecânico, sem mola)

## Frame 7, Calendário

- status: built
- src: compositions/c07-calendario.html
- duration: 3.4s
- transition_in: cut
- poster: 1.2
- scene: Calendário de mesa sem nomes de dias, tesoura recorta o quarto cartão, que vira folga; 6 x 1 rola para 5 x 2
- voiceover: "E o descanso passa a ser de dois dias."
- rules: svg-path-draw (linha de corte), vertical-spring-ticker (troca 6 x 1 para 5 x 2, sem rotação de texto)

## Frame 8, 40 horas e salário

- status: built
- src: compositions/c08-salario.html
- duration: 6s
- transition_in: crossfade
- scene: Relógio de 42 para 40 com +12 meses; barras HORAS em dois degraus e SALÁRIO estável com linha de referência; título Sem redução de salário.
- voiceover: "Doze meses depois, o limite chega a quarenta horas. Sem redução de salário."
- rules: stat-bars-and-fills (barras), vertical-spring-ticker

## Frame 9, Exceções

- status: built
- src: compositions/c09-excecoes.html
- duration: 5s
- transition_in: crossfade
- scene: Dois cartões Sand, Escala 12x36 e Regras por setor, título Há regras próprias.
- voiceover: "Escalas especiais, como a doze por trinta e seis, e alguns setores terão regras próprias."
- rules: waterfall-entry (cartões com 24 px)

## Frame 10, Dois lados

- status: built
- src: compositions/c10-dois-lados.html
- duration: 6s
- transition_in: crossfade
- scene: Tela dividida por linha Gold, QUEM CONTRATA em Primary e QUEM TRABALHA em Sand, animação espelhada
- voiceover: "Para quem contrata, é hora de rever escalas e contratos. Para quem trabalha, de conhecer os novos limites."
- rules: svg-path-draw (linha central), split em espelho com o mesmo tempo dos dois lados

## Frame 11, Respiro

- status: built
- src: compositions/c11-respiro.html
- duration: 2s
- transition_in: crossfade
- scene: Luz de fim de tarde, pictograma desliga o despertador, dois cartões de folga, planta ganha uma folha
- voiceover: ""
- rules: svg-icon-enrichment (despertador), overshoot de até 4% só no despertador

## Frame 12, CTA

- status: built
- src: compositions/c12-cta.html
- duration: 4s
- transition_in: crossfade
- poster: 3
- scene: Gradiente editorial com grade de 8 px a 4%, linha Gold, título e CTA
- voiceover: "Ficou com dúvida sobre a nova jornada? Busque orientação jurídica."
- rules: svg-path-draw (linha Gold)

Legenda omitida nesta cena por recomendação: o título é a própria fala. O .srt continua completo.

## Frame 13, Assinatura

- status: built
- src: compositions/c13-assinatura.html
- duration: 3.5s
- transition_in: crossfade
- scene: Fundo Primary, logo só com fade de 400 ms, nota, data e fontes, canal oficial
- voiceover: "Bispo e Teixeira Advogados."
- rules: fade de 400 ms, sem outro movimento no logo
