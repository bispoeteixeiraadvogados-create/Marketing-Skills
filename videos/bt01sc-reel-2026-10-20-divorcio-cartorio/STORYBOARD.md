---
message: "Ter filhos menores não impede necessariamente o divórcio em cartório, mas exige consenso e comprovação da prévia resolução judicial das questões dos filhos."
audience: "Pessoas casadas em processo de separação ou considerando divórcio, especialmente pais de filhos menores."
mode: autonomous
canvas: 1080x1920
fps: 30
duration: 42
---

# Storyboard executado: Reel V1 BT.01.SC (20/10/2026)

Fonte travada: `briefing/BT01SC_Claude_Code_Reel_2026-10-20_Prompt_Execucao_v1.md`, seção 6. Falas e textos
de tela reproduzidos literalmente. Tempos de fala reais em `assets/audio/timing_v1.json`.

Câmera: um único espaço físico (mesa BT Midnight) em `compositions/mesa.html`, câmera virtual 2.5D
(regras `viewport-change` e `depth-of-field-blur` de `/hyperframes-animation`). Transições por causa física
(borda do papel, capa da pasta, gesto de afastamento, abertura de campo, luz que se apaga), nunca o mesmo
fade/wipe repetido. Comportamentos de câmera: close de acompanhamento (S1), push-in (S2, S3 para S4),
acompanhamento lateral (S3), recuo e abertura de perspectiva (S5), dolly-out (S6).

## Frame 1
status: built
src: compositions/mesa.html
window: 0.0-3.5 (storyboard 0-3; +0.5 s, ver relatório)
rules: viewport-change, depth-of-field-blur
beat: Folha Sand desliza da direita com atrito e foco que se resolve, "FILHOS MENORES?". Segunda folha Paper sobe e revela "DIVÓRCIO EM CARTÓRIO?". Câmera em close acompanha e desce.

## Frame 2
status: built
src: compositions/mesa.html
window: 3.5-6.2 (storyboard 3-6)
rules: viewport-change
beat: Folha cobre as perguntas vindo da esquerda (borda como cortina), "SIM," e logo em seguida a tira Navy "EM ALGUNS CASOS." Push-in leve. Saída: o conjunto de papéis é erguido e a borda inferior varre o quadro, revelando a pasta.

## Frame 3
status: built
src: compositions/mesa.html
window: 6.2-15.0 (storyboard 6-15)
rules: viewport-change, reactive-displacement
beat: Pasta BT Blue aberta. Três folhas distintas entram em sequência sincronizadas às palavras "guarda", "convivência", "alimentos", com acompanhamento lateral da câmera. As folhas se alinham na pasta; a faixa "RESOLVIDOS NA JUSTIÇA" é pousada sobre as três. A capa fecha parcialmente e vira o quadro seguinte.

## Frame 4
status: built
src: compositions/ressalva.html (sobre a capa da pasta em compositions/mesa.html)
window: 15.0-22.0
rules: depth-of-field-blur, reactive-displacement
beat: Documento conceitual "ACORDO PARTICULAR" chega e é afastado para fora de foco; título "ACORDO PARTICULAR NÃO BASTA." Em seu lugar, cartão tipográfico "É necessária a comprovação da resolução judicial." (tipografia, não simulação de sentença). Gesto de afastamento conduz a câmera.

## Frame 5
status: built
src: compositions/mesa.html + compositions/escritura-textos.html
window: 22.0-31.0
rules: viewport-change, depth-of-field-blur
beat: Recuo de câmera: a pasta fecha e fica organizada à esquerda. "CONSENSO DO CASAL". A escritura (Paper, moldura fina, título "ESCRITURA PÚBLICA") entra pela direita; o campo de visão se abre e a luz muda de etapa. "Assistência de advogado ou defensor público."

## Frame 6
status: built
src: compositions/mesa.html + compositions/sintese-textos.html
window: 31.0-39.0
rules: viewport-change, svg-path-draw (linha como scaleX)
beat: Dolly-out lento termina em 34.2 s. Zonas distintas: "JUSTIÇA / Questões dos filhos." sobre a pasta; "CARTÓRIO / Divórcio consensual." sobre a escritura. Linha Gold fina relaciona as etapas sem fundi-las.

## Frame 7
status: built
src: compositions/assinatura.html
window: 37.5-42.0 na V3 (V1/V2: 38.5-42.0); tela totalmente Midnight a partir de 38.2
rules: ambient (nenhum loop), entrada por opacidade e escala 0.985
beat: A luz da mesa se apaga em Midnight. Logotipo original (arquivo PNG do escritório, sem reconstrução), linha Gold, "Informação jurídica com responsabilidade.", e na V3 o telefone (38) 9 9129-6401 e o Instagram @bispoeteixeiraadvogados com ícone em BT Sky. Hold estável até o último quadro.
