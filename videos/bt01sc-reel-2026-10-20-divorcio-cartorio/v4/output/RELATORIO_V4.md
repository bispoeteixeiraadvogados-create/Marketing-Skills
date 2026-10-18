# Relatório de produção: Reel V4 BT | Divórcio em cartório com filhos menores

**Status:** V4 renderizada nas duas versões (normal e movimento reduzido), medida e revisada quadro a quadro. Falta a audição humana e a aprovação dos advogados antes de publicar. V1, V2 e V3 continuam intactas em `../output/`.

## 1. Arquivos entregues

| Arquivo | Conteúdo |
| --- | --- |
| `output/BT_Divorcio_Cartorio_Reel_V4.mp4` | Versão principal |
| `output/BT_Divorcio_Cartorio_Reel_V4_ReducedMotion.mp4` | Versão acessível: sem câmera em movimento, sem queda do carimbo, sem bolinha, sem desfoque; mesma voz, texto e legenda |
| `output/BT_Divorcio_Cartorio_Reel_V4.srt` | Legendas (14 blocos, até duas linhas, tempos da locução real) |
| `output/QA_V4/` e `output/QA_V4_ReducedMotion/` | 30 quadros de inspeção por versão, sobreposição de área segura e contact sheets |
| `output/qa_medicoes_V4.json`, `output/qa_medicoes_V4_ReducedMotion.json`, `output/qa_motion_v4.json` | Medições automáticas |
| Projeto | `v4/` com `README.md` (reprodução), `MANIFESTO_ASSETS.md` (origem e licença de cada asset), componentes, scripts e assets |

## 2. Medições (ffprobe, ffmpeg, scripts de QA)

| Item | Normal | Movimento reduzido |
| --- | --- | --- |
| Duração | 33,000 s | 33,000 s |
| Quadros | 990 a 30 fps | 990 a 30 fps |
| Vídeo | H.264 High, 1080 x 1920, 9:16, yuv420p | igual |
| Áudio | AAC LC, 48 kHz, estéreo | igual |
| Loudness / pico verdadeiro / LRA | -16,1 LUFS / -2,1 dBTP / 3,1 LU | igual |
| Quadros pretos | nenhum | nenhum |
| Quadros congelados (freezedetect, 1,2 s) | nenhum | trechos parados esperados (é a versão sem movimento) |
| Erros de decodificação | nenhum | nenhum |
| Sincronia do áudio do MP4 com a mixagem | 0,0 ms | 0,0 ms |
| Tamanho | 13.395.455 bytes | 7.435.022 bytes |

`hyperframes lint`: 0 erros. `hyperframes check`: 0 erros de runtime, layout e movimento; contraste 36/36 WCAG AA.

**Bolinha condutora**, medida quadro a quadro na timeline: deslocamento máximo de 101 px por quadro (o manual aceita até 130 px), nenhum salto isolado e nenhuma inversão brusca.

## 3. Roteiro e locução

- Voz Henrique (`3ULAAai0IVN00DTWA6vF`), `eleven_v4`, uma única geração: `B28C5YYYTnm12YQWPqeB`, 437 créditos.
- A primeira chamada deu erro 429 antes de gerar e não cobrou créditos.
- As 66 palavras do roteiro foram conferidas na transcrição (faster-whisper `medium`), na ordem.
- **Edição:** duração natural de 31,3 s. Só as pausas entre frases foram encurtadas, com cortes dentro do silêncio, para 0,34 a 0,80 s. Não houve aceleração nem time-stretch. A fala vai de 0,05 s a 28,3 s.

### Cenas

| Cena | Prompt | Real | Conteúdo |
| --- | --- | --- | --- |
| 01 | 0,0-1,6 | 0,00-1,52 | Gancho: "FILHOS MENORES?" já no quadro 0, documento macro e aproximação de câmera |
| 02 | 1,6-3,4 | 1,52-3,99 | "NO CARTÓRIO?", depois "SIM." com punch e "É POSSÍVEL." |
| 03 | 3,4-5,7 | 3,99-5,98 | Fundo Paper, fio Navy, "CONDIÇÃO." em Blue |
| 04 | 5,7-9,6 | 5,98-10,63 | Três microcenas (guarda, convivência, alimentos) com escalas diferentes, convergindo para a moldura "Resolvidas na Justiça" |
| 05 | 9,6-12,6 | 10,63-13,69 | "ACORDO PARTICULAR" em close; o documento recua sem sumir; "NÃO BASTA." e a frase de apoio "O acordo dos pais importa, mas precisa passar pela Justiça." |
| 06 | 12,6-15,4 | 13,69-16,33 | **3D 01:** carimbo simbólico com queda, contato em "comprovar", compressão de 0,05 s, sombra de contato, subida e marca de tinta |
| 07 | 15,4-19,6 | 16,33-20,65 | Ilustração editorial de dois adultos, com troca de enquadramento; **match cut** do documento para a **3D 02**, a escritura com câmera macro |
| 08 | 19,6-23,3 | 20,65-23,40 | Filmagem real (mãos, caneta e documento), dois planos, rótulo em Funnel Sans |
| 09 | 23,3-26,8 | 23,40-26,10 | Infográfico em duas etapas, bolinha no trilho, "RESOLUÇÃO CNJ 571/2024" |
| 10 | 26,8-30,5 | 26,10-29,45 | "SALVE ESTA INFORMAÇÃO." com sublinhado Gold e bolinha |
| 11 | 30,5-33,0 | 29,45-33,00 | Desfoque para a assinatura: logo original, telefone, Instagram, nota e fonte |

Os tempos seguem a locução real, como o prompt autoriza. A assinatura começa 1 s antes do previsto para dar 3,5 s de leitura ao telefone e para não deixar o quadro do CTA parado por 2,4 s depois da fala, que o freezedetect acusou no primeiro render.

## 4. Verificação jurídica

Fonte oficial consultada em 18/10/2026: texto compilado da Resolução CNJ 35/2007 no CNJ (https://atos.cnj.jus.br/atos/detalhar/179).

- **Art. 34, § 2º (redação da Res. CNJ 571/2024):** "Havendo filhos comuns do casal menores ou incapazes, será permitida a lavratura da escritura pública de divórcio, desde que devidamente comprovada a prévia resolução judicial de todas as questões referentes à guarda, visitação e alimentos deles, o que deverá ficar consignado no corpo da escritura."
- **Art. 35 (redação da Res. CNJ 571/2024):** menciona a "regulamentação da guarda, da convivência familiar e dos alimentos dos filhos menores e/ou incapazes realizada em juízo". Isso sustenta o uso de "convivência" na fala.
- **Art. 8º (redação da Res. CNJ 326/2020):** "É necessária a presença do advogado, dispensada a procuração, ou do defensor público". A primeira versão da linha de fonte atribuía esse artigo à Res. 571/2024. O erro foi corrigido antes do render final.
- **Alterações posteriores:** o mesmo texto compilado registra a Resolução CNJ 695, de 26/8/2026, que alterou apenas o art. 15 (inventário e ITCMD). A regra do divórcio não mudou.
- **O que o vídeo evita afirmar:**
  - que o acordo particular substitui a decisão judicial (a cena 05 diz que ele importa, mas precisa passar pela Justiça);
  - que a escritura é automática (a cena 09 traz "SÓ DEPOIS DA DECISÃO");
  - qualquer promessa de resultado, prazo ou custo.
- **Publicidade (Provimento CFOAB 205/2021):**
  - o CTA é informativo ("Salve esta informação para consultar depois");
  - a assinatura traz só telefone e perfil, sem oferta;
  - a conformidade com as regras da OAB é decisão dos advogados do escritório. Você deve verificar isto.

## 5. Decisões e limitações reais

1. **HyperFrames em vez de Remotion.** O prompt preferia Remotion. Mantive HyperFrames porque o manual BT e o projeto-modelo do escritório estão nele, porque V1 a V3 foram validadas nesse pipeline e porque não há custo de licença. Os 10 componentes pedidos existem com os mesmos nomes (ver `README.md`).
2. **Cena 07 em ilustração vetorial, não em vídeo.** O prompt aceita as duas opções. No Mixkit, os clipes de pessoas conversando sobre documentos estão sob licença "Restricted", que proíbe posts de empresa, ou mostram rostos de pessoas reais. Pexels e Pixabay exigem chave de API, que este ambiente não tem.
3. **Filmagem da cena 08.** Mixkit 241, sob a licença "Stock Video Free" (uso comercial, sem atribuição obrigatória). O documento original é um contrato em inglês, e o texto foi desfocado para ficar ilegível. As mãos e a caneta são reais; não há rosto.
4. **3D em Three.js, não em Blender.** O Blender não está instalado no ambiente. Os objetos têm modelagem, luz, sombra e câmera reais em WebGL, e não são ícones genéricos.
5. **Duas instruções do manual BT foram substituídas pelo prompt, que tem precedência:**
   - "ritmo calmo" (o prompt pediu mais dinamismo);
   - "efeito sonoro só no momento de ênfase" (o prompt pediu som de papel, contato, carimbo e caneta).
   Todos os efeitos são sintetizados e ficam bem abaixo da voz.
6. **"Pode divorciar no cartório?"** é coloquial; a forma culta é "divorciar-se". Mantive o roteiro aprovado.
7. **Pendências:**
   - audição humana;
   - teste em celular real;
   - aprovação dos advogados;
   - confirmar a licença comercial da voz no plano ElevenLabs (você deve verificar isto);
   - confirmar que o telefone (38) 9 9129-6401 é o canal atual do escritório (você deve verificar isto).

## 6. Controle de qualidade, item a item

| Item | Como foi verificado | Resultado |
| --- | --- | --- |
| 1. Frames pretos ou vazios | `blackdetect` no MP4 inteiro | Nenhum |
| 2. Cortes acidentais | Quadros dos dois lados de cada corte e do match cut (18,17 e 18,23 s) | Só os cortes planejados |
| 3. Área segura | Sobreposição de 250/300/60 px em 30 quadros | Textos dentro da área |
| 4. Textos sobrepostos | `hyperframes check` (layout) e revisão visual | Única sobreposição: o desfoque S10 para S11, que é intencional |
| 5. Ortografia | Todos os textos de tela extraídos do HTML e revisados | Sem erros |
| 6. Fontes carregadas | `document.fonts.load` antes da montagem; quadros conferidos | As quatro famílias aparecem nos quadros |
| 7. Cores | Somente tokens da paleta no CSS e no 3D | Sem cores fora da paleta |
| 8. Sincronização da locução | Correlação cruzada do MP4 com a mixagem | 0,0 ms |
| 9. Legendas | 14 blocos derivados das palavras; checagem automática de que nenhum bloco atravessa corte ou se sobrepõe | Sim |
| 10. Movimentos sem saltos | `qa_motion.mjs` (bolinha e câmeras, quadro a quadro) | Sem saltos fora dos cortes planejados |
| 11. Colisões 3D | Quadros em 14,00, 14,27 e 14,60 s | Contato em "comprovar", sem atravessar o papel |
| 12. Transições | Quadros de transição | Só três mecanismos: corte seco, match cut e desfoque |
| 13. Volume | `ebur128` | -16,1 LUFS, -2,1 dBTP |
| 14. Logo original | Mesmo arquivo do manual (SHA-256) | Sem recolorir nem deformar |
| 15. Dados institucionais | Manual BT, Reel anterior e V3 | (38) 9 9129-6401 e @bispoeteixeiraadvogados |
| 16. Referências jurídicas | Texto oficial no CNJ | Corrigida a atribuição do art. 8º |
| 17. CTA ético | Revisão do texto | Informativo |
| 18. Legibilidade no celular | Tamanhos (títulos de 96 a 380 px, legenda de 54 px) e contraste AA | Aprovado; o teste em aparelho real fica pendente |
