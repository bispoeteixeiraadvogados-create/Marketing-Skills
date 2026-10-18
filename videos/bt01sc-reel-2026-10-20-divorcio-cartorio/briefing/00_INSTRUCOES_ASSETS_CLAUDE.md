# COMPLEMENTO AO PROMPT TÉCNICO BT.01.SC
## Reel de 20/10/2026 | Narração, legendas e assets

**IMPORTANTE:** seguir integralmente o storyboard e o prompt técnico V1 aprovado. Este complemento acrescenta arquivos de referência; não altera as falas.

## Entrada de arquivos
1. `01_Narracao_Integral_ElevenLabs_PTBR.txt`: roteiro definitivo, apenas as falas. Enviar como texto para síntese de voz em português brasileiro.
2. `02_Legenda_GUIA_tempos_provisorios.srt`: divisão semântica das legendas, com tempos **estimados** pelo storyboard de 42 segundos. Não é a legenda final sincronizada com áudio real.
3. `03_Logo_BT_Transparente_Referencia.png`: logo branco com transparência extraída de material disponibilizado pelo escritório, resolução raster pequena. Não reconstruir nem vetorizar por IA; se houver arquivo oficial SVG/PNG de alta resolução no repositório, priorizá-lo.
4. `04_Logo_BT_Original_Referencia.jpg`: marca de referência original do escritório, em raster de 447 × 447, com fundo incorporado.

## Fotografias externas recomendadas (BAIXAR MANUALMENTE)

Fotos licenciadas no Pexels, selecionar resolução original. Não redesenhar ou refazer pessoas. Os três itens abaixo são opcionais para a animação, pois documentos e composição podem ser construídos como camadas editáveis.

- `05_Foto_Pasta_Documentos.jpg`, imagem da pasta e documentos, de Anete Lusina: https://www.pexels.com/photo/person-choosing-document-in-folder-4792285/
- `06_Textura_Papel_Bege.jpg`, textura de papel, de Resource Boy: https://www.pexels.com/photo/close-up-shot-of-a-craft-paper-13031764/
- `07_Foto_Mesa_Escura.jpg`, mesa escura com folha e caneta, de Iryna Riabchykova: https://www.pexels.com/photo/empty-page-and-pen-on-dark-desk-13196751/

As fotografias devem servir de referência ou fundos discretos e não substituir a animação dos documentos. Não reproduzir textos ou dados reais de papéis fotografados como se fossem documentos do processo.

## Procedimento obrigatório no ElevenLabs
1. Selecionar uma voz **feminina**, português do Brasil, dicção natural e serenidade institucional. Não inventar ID de voz; listar as vozes disponíveis na conta antes de selecionar.
2. Gerar o áudio do roteiro integral, preservando pontuação e palavras. **Não narrar** nomes de cena, timecodes nem textos adicionais exibidos somente na tela.
3. Preferir API de TTS que forneça *timestamps* de caracteres, caso disponível no plano e ambiente: https://elevenlabs.io/docs/api-reference/text-to-speech/convert-with-timestamps
4. Alternativamente, realizar alinhamento forçado da fala gerada e do texto aprovado, para obter os tempos efetivos das palavras: https://elevenlabs.io/docs/pt/api-reference/forced-alignment/create
5. Gerar novo arquivo `REEL_20-10-2026_LEGENDA_FINAL.srt` a partir dos tempos reais. Segmentar em blocos curtos de até duas linhas, sem quebrar termos jurídicos ou ocultar títulos; manter acentos, pontuação e capitalização e conferir manualmente.
6. Exportar o áudio (`MP3` ou `WAV`, de acordo com os recursos da conta) e o `.srt` final. Inserir ambos no projeto de motion. Validar sincronia escutando a voz e comparando com a timeline renderizada.
7. Se a frase inicial exigir duração maior para não soar apressada, considerar uma redistribuição mínima entre as cenas 01 e 02, dentro da tolerância do prompt original, preservando a duração total de 42 s. Não acelerar artificialmente a fala.
8. Não inventar confirmação de acesso ao ElevenLabs ou resultado de renderização; se a integração não estiver disponível, entregar relatório e os arquivos necessários para execução manual.

## Critérios de aceitação
- Áudio realmente gerado por ferramenta autorizada e com acesso, não apenas um arquivo falso.
- Todas as 89 palavras e sete falas do roteiro aprovado intactas.
- `.srt` final derivado do áudio gerado, não dos tempos exemplificativos deste pacote.
- Sem sobreposição de legendas e sem legendas em áreas encobertas pelos controles do Instagram.
- Logo e demais ativos integrados à marca BT.01.SC sem distorção.
- Entrega de MP4, áudio isolado, `.srt` final, projeto-fonte e relatório de conferência.
