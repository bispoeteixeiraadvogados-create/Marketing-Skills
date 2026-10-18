# PROMPT TÉCNICO DE EXECUÇÃO PARA CLAUDE CODE
## BT.01.SC MOTION | BISPO & TEIXEIRA ADVOGADOS | REEL 20/10/2026 | V1

**Instrução de uso:** este é o briefing de execução do Reel aprovado pelo escritório. Execute-o no projeto real disponível. A aprovação do conceito e do roteiro já ocorreu. Não reabra a etapa criativa, não substitua o roteiro e não produza carrossel, Stories ou outras peças derivadas. Não afirme que executou algo sem arquivo renderizado e evidência técnica.

## 1. MISSÃO, PAPEL E PRIORIDADES

Você atuará como engenheiro audiovisual, motion designer sênior e diretor técnico de pós-produção. Sua tarefa é localizar o projeto audiovisual existente do escritório (quando houver), compreender sua stack e produzir um **Reel vertical realmente animado**, com edição e áudio, preservando o Design System BT.01.SC e o storyboard literal aprovado.

Prioridades, nesta ordem:
1. Precisão jurídica, integridade da marca e fidelidade ao roteiro.
2. Clareza narrativa, legibilidade mobile e inteligibilidade da locução.
3. Movimento real, continuidade física, ritmo editorial e acabamento profissional.
4. Reaproveitamento do projeto e facilidade de revisão incremental.
5. Exportação verificável em MP4 com projeto-fonte editável e relatório.

Não transforme este trabalho em slideshow de imagens estáticas com zoom automático. O movimento deve ser construído com transformações de camadas, iluminação, profundidade, câmera, interações entre documentos e transições motivadas. Não crie animação gratuita.

## 2. CONTEXTO DE CAMPANHA, FIXADO

- Escritório: Bispo & Teixeira Advogados.
- Sistema: BT.01.SC, Social Native de Conversão, linguagem Clean + Human + Editorial, cinematográfica e social native.
- Publicação pretendida: terça-feira, 20 de outubro de 2026.
- Tema: quem tem filhos menores pode se divorciar em cartório?
- Enquadramento: divórcio extrajudicial consensual quando guarda, convivência e alimentos dos filhos comuns menores ou incapazes já estiverem resolvidos judicialmente.
- Público: pessoas casadas em processo de separação ou considerando divórcio, especialmente pais de filhos menores.
- Objetivo principal: esclarecer uma dúvida real, transmitir autoridade com linguagem acessível e favorecer contato informativo espontâneo, sem publicidade agressiva.
- Tese: ter filhos menores não impede necessariamente o divórcio em cartório, mas exige consenso e comprovação da prévia resolução judicial das questões dos filhos.
- Conceito aprovado: **“Dois caminhos. Uma possibilidade.”**
- Motivo visual protagonista: documentos editoriais de papel e uma pasta, materialidade convincente, uma etapa judicial referente aos filhos e outra etapa notarial referente ao divórcio.
- Proibido reutilizar a aliança 3D do projeto anterior de divórcio litigioso. Não inserir martelo, balança, colunas, tribunal em 3D, selos oficiais inventados ou cenografia jurídica genérica.
- Idioma: português brasileiro.
- Locução: voz feminina, serena, natural e segura, sem teatralização comercial.
- Duração pretendida: **00:42**, com sete cenas e intervalos inicialmente fixados abaixo.
- Formato: **1080 x 1920, 9:16, 30 fps como valor de referência**, respeitando fps e pipeline comprovadamente existentes quando tecnicamente justificável.
- Entrega: MP4 H.264, pixel format yuv420p, áudio AAC, projeto-fonte, legendas sincronizadas e relatório técnico.

**Status do escopo:** produzir exclusivamente o Reel V1 e respectivos artefatos técnicos de QA. Não gerar carrossel, Stories, textos de campanha, anúncios, artes de feed ou publicações.

## 3. INTEGRIDADE JURÍDICA, TEXTO E FONTES

A mensagem se fundamenta na Resolução CNJ nº 35/2007, especialmente art. 34, §§ 1º a 3º, com redação dada pela Resolução CNJ nº 571/2024, bem como art. 35 da mesma resolução. A Resolução CNJ nº 695/2026 alterou o art. 15 da Resolução nº 35/2007, sem alterar o art. 34, § 2º.

Fontes oficiais de conferência, extraídas do repositório normativo do CNJ:
- Resolução CNJ nº 35/2007, texto consolidado: https://atos.cnj.jus.br/atos/detalhar/179
- Resolução CNJ nº 571/2024: https://atos.cnj.jus.br/atos/detalhar/5705
- Resolução CNJ nº 695/2026: https://atos.cnj.jus.br/atos/detalhar/7010

O art. 34, § 2º, exige comprovação da prévia resolução judicial de todas as questões de guarda, visitação ou convivência e alimentos referentes aos filhos comuns menores ou incapazes. Exige-se divórcio consensual e assistência de advogado ou defensor público. Não anunciar que a alteração ocorreu em 2026, não sugerir que o divórcio extrajudicial é automático, nem que o cartório resolve sozinho guarda e alimentos. Não afirmar que todo caso é mais rápido ou mais barato. Não incluir citações jurisprudenciais, números de processos ou dados pessoais fictícios.

**Controle de texto:** falas e textos principais das cenas a seguir estão TRAVADOS. Reproduzi-los exatamente, inclusive sentido, pontuação e ordem. Se detectar um problema jurídico ou de legibilidade, registrar a objeção e solicitar autorização antes de mudar o conteúdo. Só são permitidas quebras de linha, divisão de legendas e microajustes de posicionamento sem mudar palavras. Textos ilustrativos de documentos devem ser genéricos e não simular documentos judiciais autênticos.

## 4. INSPEÇÃO DO AMBIENTE, OBRIGATÓRIA ANTES DE CODIFICAR

1. Identifique a pasta do projeto em que o Claude Code foi iniciado. Liste arquivos relevantes, stack audiovisual, dependências, script de render, proporção e taxa de quadros em uso, bibliotecas gráficas, fontes, imagens, sons e projetos de referência.
2. Procure o projeto aprovado ou anterior do BT.01.SC e identifique componentes que podem ser reaproveitados. Não suponha Remotion, React, After Effects, Blender, Three.js, FFmpeg ou outra stack antes de inspecionar. Se não houver projeto-base, crie uma estrutura editável adequada, escolhendo a implementação viável para o ambiente, e justifique em relatório.
3. Identifique o arquivo oficial do logotipo, preferencialmente SVG ou PNG em alta resolução e fundo transparente, disponibilizado pelo escritório. Os arquivos `images.jpg` e `images(1).jpg`, caso sejam disponibilizados no ambiente, são referências rasterizadas da marca com 447 x 447 px e fundo incorporado. Não os apresente como vetores ou transparências. Não reconstrua, reestilize, refaça tipografia nem redesenhe o monograma BT. Se não houver ativo adequado, informe e deixe o espaço reservado no preview, em vez de criar logo falsa.
4. Verifique que os arquivos de fontes necessários estejam legalmente acessíveis. Não invente nem distribua arquivos de fontes.
5. Verifique o direito de uso de locução, trilha, efeitos, fotografias e demais assets. Nunca introduza informações pessoais de clientes ou simule peça judicial verdadeira com dados identificáveis.
6. Conserve a versão existente. Se houver Git, crie branch ou commit identificável de baseline; se não houver, faça cópia datada dos arquivos alterados. Nunca sobrescreva renders aprovados de ciclos anteriores.
7. Apresente um inventário sucinto **MANTER / AJUSTAR / REMOVER / ADICIONAR** antes da execução, sem pedir nova aprovação criativa desnecessária.

## 5. DIREÇÃO VISUAL, PALETA E IDENTIDADE

Aplicar a identidade do BT.01.SC, sem usar um único layout congelado durante o vídeo:

| Token | Valor | Papel |
| --- | --- | --- |
| BT Midnight | `#081A35` | Fundo cinematográfico e transições |
| BT Navy | `#0B1F4B` | Cor institucional estruturante |
| BT Sand | `#F4EDE2` | Papel, superfícies, documentos e cards |
| BT Paper | `#FAF8F4` | Respiro e informação sobre claro |
| BT Gold | `#D4AF7C` | Acento restrito, linhas e microdetalhes |
| BT Blue | `#214D8C` | Apoio cromático moderado |
| BT Sky | `#8FC5EF` | Microdestaques informativos quando necessários |

- Cormorant Garamond: títulos expressivos e editoriais. Usar Lora apenas se houver necessidade fundamentada ou configuração do projeto.
- Montserrat: legenda, subtítulo, etiqueta, explicação e microtexto.
- O vídeo deve parecer produção audiovisual editorial real, não uma apresentação de slides, template jurídico ou anúncio de banco.
- Materiais de papel com fibra discreta e rugosidade coerente, sombra suave e iluminação lateral natural. Papel não deve parecer plástico nem flutuar fisicamente sem justificativa.
- Composição assimétrica, espaço negativo, alternância de enquadramento aberto e close, profundidade e variação tonal entre cenas. Não deixar todo o vídeo monocromático.
- No máximo um protagonista dominante por momento: pergunta, pasta com três documentos, ressalva, escritura, comparação final ou logo.
- Utilizar marca como assinatura intacta, apenas na cena 07, salvo componentes discretos preexistentes que não prejudiquem o roteiro.
- Gold nunca como revestimento metálico, partículas, reflexos luxuosos ou logo 3D.

## 6. STORYBOARD APROVADO, TEXTOS LITERAIS E INSTRUÇÕES POR CENA

A duração total pretendida é 42 segundos. As janelas abaixo são a referência inicial de montagem. Não altere conteúdo e ordem das cenas. Testar sincronização real de fala antes de fechar timecodes. Se um ajuste pequeno de até aproximadamente um segundo entre cenas adjacentes for essencial à compreensão, preservar os 42 segundos totais e declarar o delta no relatório; não acelerar voz artificialmente. Mudanças substanciais exigem autorização.

### CENA 01 | 00:00 a 00:03 | O questionamento

**LOCUÇÃO LITERAL:**
“Tem filhos menores? O divórcio pode ser feito em cartório?”

**TEXTO LITERAL NA TELA:**
“FILHOS MENORES?”
“DIVÓRCIO EM CARTÓRIO?”

**VISUAL:** começar imediatamente, sem vinheta ou logo inicial. Uma superfície BT Midnight com iluminação lateral ocupa o quadro. Um documento realista em papel Sand desliza pelo enquadramento e revela a primeira pergunta. O segundo bloco tipográfico entra com movimento motivado pelo papel, em hierarquia grande e legível. O papel deve apresentar espessura, sombra e atrito visual realistas, com movimento limpo e profissional.

**CÂMERA E TRANSIÇÃO:** close inicial, pequeno movimento de acompanhamento com mudança de foco; a borda do documento ajuda a abrir o próximo plano. Evitar giro excessivo, bounce e zoom automático genérico.

**SOM:** primeiro contato sutil de papel sobre mesa, primeiro pulso da trilha, voz já no início. Prioridade para nitidez do gancho. Atenção especial: duas perguntas em 3 segundos podem exigir dicção rápida; medir em áudio real antes de encerrar. Não omitir palavras.

### CENA 02 | 00:03 a 00:06 | A revelação

**LOCUÇÃO LITERAL:**
“Sim, em determinadas situações.”

**TEXTO LITERAL NA TELA:**
“SIM, EM ALGUNS CASOS.”

**VISUAL:** documento no centro, leve push-in de câmera. Dar destaque à palavra “SIM”, seguida de “EM ALGUNS CASOS”, evitando que a primeira palavra isolada permaneça tempo demais e dê impressão de regra sem condições. O elemento editorial continua pertencendo ao mesmo espaço físico do plano anterior.

**TRANSIÇÃO E SOM:** usar a borda do papel como máscara para revelar o cenário seguinte. Trilha contínua e contida, com uma breve pausa visual para compreender a condição.

### CENA 03 | 00:06 a 00:15 | A condição jurídica

**LOCUÇÃO LITERAL:**
“Quando há filhos comuns menores ou incapazes, guarda, convivência e alimentos devem estar previamente resolvidos judicialmente.”

**TEXTOS LITERAIS NA TELA:**
“GUARDA”
“CONVIVÊNCIA”
“ALIMENTOS”
“RESOLVIDOS NA JUSTIÇA”

**VISUAL:** três folhas diferentes e coerentes entram uma após a outra. Cada folha simboliza somente um tema. A câmera acompanha um deslocamento lateral discreto. As três folhas se alinham dentro de uma pasta de papel. A faixa “RESOLVIDOS NA JUSTIÇA” aparece quando as três estão juntas. Sem selos, assinaturas, número de processo, brasões, carimbos ou decisões falsas.

**MOVIMENTO E TRANSIÇÃO:** animação de folhas com ancoragem física, espessura, perspectiva, sombra de contato e pequenos intervalos de repouso, sem efeito de gravidade fantástico. A pasta fecha parcialmente e sua superfície funciona como máscara editorial para a próxima cena.

**SOM:** três contatos leves de papel, sincronizados, sem competir com as palavras “guarda”, “convivência” e “alimentos”.

### CENA 04 | 00:15 a 00:22 | O cuidado necessário

**LOCUÇÃO LITERAL:**
“Não basta um acordo particular. É preciso comprovar ao cartório a resolução judicial dessas questões.”

**TEXTOS LITERAIS NA TELA:**
“ACORDO PARTICULAR NÃO BASTA.”
“É necessária a comprovação da resolução judicial.”

**VISUAL:** um documento conceitual identificado como acordo particular é afastado do foco. Em seu lugar, surge uma composição editorial clara e minimalista, com tipografia que representa a resolução judicial já existente. O sistema não deve construir imagem que pareça falsificação de sentença nem implicar que um novo documento visual fictício seja prova suficiente.

**MOVIMENTO E TRANSIÇÃO:** match cut de enquadramento ou substituição por máscara, com pausa de leitura. Um gesto de afastamento do papel pode conduzir a câmera até a escritura da próxima cena.

**SOM:** pequena redução da trilha durante a ressalva, apenas textura de papel quando pertinente, voz central.

### CENA 05 | 00:22 a 00:31 | O divórcio em cartório

**LOCUÇÃO LITERAL:**
“Com o consenso do casal, o divórcio pode ser feito por escritura pública, com assistência de advogado ou defensor público.”

**TEXTOS LITERAIS NA TELA:**
“CONSENSO DO CASAL”
“ESCRITURA PÚBLICA”
“Assistência de advogado ou defensor público.”

**VISUAL:** o conjunto de documentos da etapa anterior se fecha e permanece organizado à esquerda. Um segundo documento, de aparência diferente e limpa, entra pela direita com o título “ESCRITURA PÚBLICA”. A câmera passa de close a plano médio mais aberto. A documentação anterior permanece sugerida no enquadramento para preservar continuidade narrativa.

**MOVIMENTO E TRANSIÇÃO:** um segundo pico visual forte, motivado pela abertura do campo de visão e pela chegada da escritura, sem brilho, fogo, partículas ou símbolo cartorial inventado. Transição de foco de uma etapa para a outra.

**SOM:** movimento de pasta, toque suave de papel e pulso musical levemente mais amplo, mantendo inteligibilidade da locução.

### CENA 06 | 00:31 a 00:39 | A síntese visual

**LOCUÇÃO LITERAL:**
“A diferença é esta: as questões dos filhos são tratadas na Justiça. O divórcio pode ser formalizado no cartório.”

**TEXTOS LITERAIS NA TELA:**
“JUSTIÇA”
“Questões dos filhos.”
“CARTÓRIO”
“Divórcio consensual.”

**VISUAL:** a câmera recua e apresenta o conjunto documental dividido em duas zonas coerentes, mas distintas. A esquerda representa a resolução das questões dos filhos na Justiça. A direita representa a escritura de divórcio em cartório. Uma linha fina conecta as etapas para mostrar a relação prática sem confundi-las. Garantir que a composição não sugira que exista autorização automática ou que o cartório possa resolver guarda e alimentos por conta própria.

**MOVIMENTO E TRANSIÇÃO:** dolly-out lento, acomodação dos objetos e uma breve pausa de leitura. O movimento deve terminar antes do encerramento para que a síntese seja percebida.

**SOM:** trilha resolve progressivamente, sem efeito sonoro de vitória ou celebração.

### CENA 07 | 00:39 a 00:42 | A assinatura institucional

**LOCUÇÃO LITERAL:**
“Cada caso exige análise jurídica.”

**TEXTO DE APOIO LITERAL NA TELA:**
“Informação jurídica com responsabilidade.”

**LOGOTIPO:** inserir o arquivo original do símbolo e do nome “BISPO & TEIXEIRA ADVOGADOS”, sem reconstruir esses elementos como texto. O nome faz parte da imagem de marca e deve manter suas proporções e tipografia oficiais.

**VISUAL:** fundo BT Midnight, logotipo centralizado com respiro, pequena linha Gold controlada e texto de apoio em Montserrat. Posição e escala ajustadas para a safe zone real. Nenhum telefone, WhatsApp, formulário, oferta ou CTA adicional.

**MOVIMENTO E SOM:** entrada discreta por opacidade e escala muito pequena, seguida de hold estável até o último frame; a trilha encerra suavemente, sem corte abrupto.

## 7. PRODUÇÃO DE MOVIMENTO REAL E CONTINUIDADE

- A composição inteira precisa funcionar como um espaço visual coerente. Objetos mantêm lado, escala, perspectiva, materiais, iluminação e sombra conforme a câmera se desloca.
- Criar uma timeline animável e editável. Usar keyframes, interpolação e easing consistentes; nenhuma sequência deve depender apenas de trocas de imagens pré-renderizadas.
- Cada troca de cena deve nascer de uma causa visual observável: borda do papel, fechamento de pasta, mudança de foco, deslocamento de documento ou abertura da câmera. Não repetir fade ou wipe idêntico em todas as cenas.
- Dimensionar entradas de texto conforme o tempo de leitura mobile. Evitar texto saltando a cada sílaba.
- Incluir ao menos três comportamentos de câmera distintos, usados com parcimônia: close de impacto, acompanhamento lateral e abertura de perspectiva.
- Se houver objetos ou fotografia com geração assistida por IA, validar coerência visual, ausência de caracteres espúrios e direitos de uso. Não gerar aparência de documento judicial autêntico.
- Não inserir marca d'água nem logos de bibliotecas ou ferramentas de renderização.

## 8. LOCUÇÃO, LEGENDAS, TRILHA E MIXAGEM

**Locução:** feminina, português brasileiro, timbre natural, cadência firme e acolhedora. Sem entonação de anúncio ou voz exageradamente sintética. Utilizar gravação e voz autorizadas. Se houver sintetizador de voz disponível e autorizado, gerar amostra de teste, auditar pronúncia de “extrajudicial”, “convivência”, “escritura pública” e “defensor público” e evitar artefatos. Se não houver áudio licenciado/adequado, preparar sincronização e preview técnico explicitamente incompleto, sem declarar versão final concluída.

**Sincronização:** nunca acelerar artificialmente a voz a ponto de sacrificar naturalidade. A Cena 01 possui dez palavras em três segundos, com duas interrogações. Primeiro faça uma leitura real e confira pausas. Caso seja necessário, permita microcompensação de aproximadamente um segundo entre cenas contíguas, mantidos 42 segundos totais, com registro do ajuste. Não sobrepor falas, omitir palavras ou modificar o roteiro sem autorização.

**Legendas:** gerar `.srt` sincronizado e, se a stack suportar, versão de legendas queimadas no vídeo. As legendas devem refletir literalmente a locução, com quebras de linha e tempo de exibição adequados. Limitar a duas linhas simultâneas sempre que possível. Garantir contraste, posição dentro de safe zone e não colisão com títulos ou documentos. O vídeo deve comunicar sua tese central também sem som.

**Trilha e efeitos:** música instrumental discreta e licenciada, com design sonoro de papel, pasta e contato de superfícies. Não utilizar música popular sem autorização. Ducking automático/manual sob a voz. Evitar clipping e picos de volume; como referência de mix, buscar aproximadamente -16 LUFS integrados no master, pico verdadeiro inferior a -1 dBTP, ajustando à cadeia de exportação e sem exagerar na compressão. Inspecionar os resultados efetivos com ferramenta disponível e declarar quando a medição não for possível.

## 9. LEITURA EM CELULAR E SAFE ZONES

- Tela principal: 1080 x 1920. Como zona conservadora inicial para textos críticos, utilizar margens laterais de aproximadamente 90 px, evitar topo inicial de cerca de 240 px e reservar aproximadamente 400 px inferiores para a interface do Instagram. Esses valores são pontos de partida, não garantias universais; validar com mockup de Reel atualizado e observar o posicionamento real das legendas e controles.
- O gancho deve ser compreendido imediatamente no primeiro segundo de reprodução. Texto dominante deve ter tamanho proporcional à tela e legibilidade em smartphone, inclusive em dispositivos menores.
- Distribuir títulos, documentos e legendas para que não disputem o mesmo espaço. Preferir reduzir texto auxiliar ao mínimo previsto, e não encolher todas as fontes.
- Revisar contraste em fundos Midnight, Navy, Sand e Paper, garantindo excelente leitura.
- Composição vertical nativa. Não reaproveitar projeto horizontal com crop agressivo.

## 10. PLANO TÉCNICO DE IMPLEMENTAÇÃO

Executar nesta ordem:

**A. Inventário e baseline.** Descrever rapidamente o que existe, identificar software real, assets, versão prévia, comandos de render e quaisquer lacunas. Proteger os arquivos anteriores.

**B. Animatic e áudio-guia.** Montar estrutura de sete cenas, durations, falas aprovadas e blocos de texto. Verificar leitura, ritmo e pausas antes da composição final. A primeira checagem deve testar o gancho.

**C. Materiais e cena.** Criar papel, pasta, mesa, sombras, iluminação, profundidade e componentes tipográficos reutilizáveis conforme o stack realmente disponível. Se for projeto 2D, construir profundidade 2.5D por camadas coerentes, sem exigir 3D completo.

**D. Animação e câmera.** Implementar movimento causal, enquadramentos e transições individualizadas, de acordo com as instruções por cena. Sincronizar cada entrada de texto com sentido e fala.

**E. Som, legenda e assinatura.** Inserir locução licenciada, trilha e efeitos licenciados, legendas sincronizadas e logotipo original na Cena 07.

**F. Preview, frames e inspeção.** Gerar prévia de boa qualidade, conferir movimento real, interseção entre objetos, timing, texto, recorte e áudios, com screenshots nos instantes críticos.

**G. Correção pontual.** Tratar cortes abruptos, palavras ocultas, papel com física inconsistente, desequilíbrio cromático, voz apressada, legendas sobrepostas, logo comprometida ou baixa legibilidade. Registrar alterações.

**H. Render e prova.** Renderizar MP4 final, testar reprodução integral e reportar parâmetros medidos. Se alguma condição obrigatória não puder ser cumprida, produzir preview técnico identificado como incompleto e informar o bloqueio.

## 11. CRITÉRIOS DE ACEITAÇÃO E AUDITORIA

O Reel V1 estará pronto para revisão humana somente quando:

1. O arquivo MP4 existir, abrir e reproduzir 42 segundos, com aproximadamente 1260 frames se 30 fps. Reportar duração e frames efetivos.
2. Resolução 1080 x 1920, proporção 9:16, codificação apropriada e áudio reproduzível forem verificados por ferramenta técnica.
3. Estiverem presentes exatamente as sete cenas, na ordem e com as falas aprovadas, sem cortes de palavras ou inserções jurídicas não autorizadas.
4. O gancho estiver legível desde o começo e inteligível em áudio. Se a fala do primeiro trecho ficar rápida demais, registrar e corrigir microtiming antes do render final.
5. As três questões dos filhos aparecerem separadamente e sejam apresentadas como resolvidas judicialmente, não por acordo particular sozinho.
6. A expressão “ESCRITURA PÚBLICA” aparecer no trecho relativo ao cartório, vinculada a consenso e assistência jurídica.
7. A comparação “JUSTIÇA / CARTÓRIO” estiver clara, com as etapas distintas.
8. A logo oficial mantiver proporções e desenho sem reconstrução, recoloração indevida ou transformação 3D.
9. O resultado mostrar movimento real, câmera com continuidade e transições motivadas, sem parecer slideshow.
10. Não houver tremulação, aliasing excessivo, oclusão de texto, geometria atravessando papel, sombras incompatíveis, falhas de foco, artefatos visuais, caracteres inexistentes ou grafias incorretas.
11. Locução e música estiverem balanceadas, sem clipping, estalos, ruídos irregulares nem cortes sonoros inesperados.
12. Legendas e títulos respeitarem a área segura após inspeção em mockup de interface Instagram, com contraste suficiente.
13. O projeto-fonte permanecer editável, a versão anterior preservada e as licenças/limitações de assets documentadas.
14. A execução não inclua carrossel, Stories ou outras peças derivadas.

## 12. ARTEFATOS, NOMENCLATURA E RELATÓRIO

Usar diretório de saída real existente no projeto, preferencialmente `output/` ou equivalente. Não usar caminhos falsos nem informar links de artefatos inexistentes.

Arquivos pretendidos:

- `output/2026-10-20_divorcio_cartorio_filhos_menores_REEL_v1.mp4`
- `output/2026-10-20_divorcio_cartorio_filhos_menores_LEGENDAS_v1.srt`
- `output/2026-10-20_divorcio_cartorio_filhos_menores_RELATORIO_v1.md`
- `output/2026-10-20_divorcio_cartorio_filhos_menores_FRAMES_v1/`
- projeto-fonte editável, manifesto de assets e dependências/reprodução técnica conforme a stack real.

Incluir nos frames críticos amostras próximas de: 00:00.5, 00:01.5, 00:04.5, 00:10, 00:18, 00:25, 00:35 e 00:40. Produzir, se tecnicamente simples, um contact sheet para revisão rápida, sem considerá-lo peça adicional de publicação.

O relatório deve conter: stack encontrada; caminhos reais; inventário de assets e licenças; comando ou procedimento reprodutível de render; versão de dependências; timecodes finais; diferenças para o storyboard aprovado, se existirem; duração, resolução, fps, codec e formato de áudio medidos; QA visual e sonoro com problemas resolvidos ou pendentes; status dos arquivos; lista de bloqueios com instruções objetivas.

Em iterações futuras, preserve a V1 e produza V2, V3 etc. por alterações incrementais. Não reconstrua o projeto inteiro sem necessidade técnica demonstrável ou nova autorização.

## 13. ORDEM FINAL DE EXECUÇÃO

**Agora inspecione o projeto e execute a V1.** A direção criativa e o texto estão aprovados. Não faça novo brainstorming, não peça autorização para substituir o storyboard e não entregue apenas outro prompt, pseudo-código ou proposta. Entregue vídeo renderizado, quando o ambiente e os assets permitirem, arquivos editáveis e relatório verificável. Se a execução for bloqueada por falta de repo, autorização de voz/música, logo adequado ou ferramenta, trabalhe até o limite possível, informe exatamente o impedimento e solicite somente os insumos indispensáveis. Jamais declare conclusão sem render conferido.
