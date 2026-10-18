# Manifesto de assets e licenças: Reel V1 BT.01.SC (20/10/2026)

| Asset | Caminho | Origem | Licença / direito de uso | Observação |
| --- | --- | --- | --- | --- |
| Narração (tomada final) | `assets/audio/source/narracao_elevenlabs_take3_clarice.mp3` | ElevenLabs, conta conectada do escritório. Voz de biblioteca "Clarice Rodrigues - voz grave feminina" (`B2J9b1PGBDt65GMZeYtU`), modelo `eleven_v4`, geração `q673tZd5wnWuIvWVLewt`, flow `Ok4WwjrkxboZNOaoZGBk` | Termos do plano ElevenLabs da conta. O uso comercial de vozes da biblioteca depende do plano contratado: **você deve verificar isto** | Texto enviado literalmente; 89 palavras conferidas por reconhecimento de fala |
| Voz (stem montado) | `assets/audio/voz_narracao_v1.wav` | Derivado da tomada final por `scripts/build_audio.py` | Idem | Cortes apenas dentro das pausas naturais; sem time-stretch nem aceleração |
| Tomadas descartadas | `assets/audio/source/narracao_elevenlabs_take1_luciana.mp3`, `..._take2a_christine.mp3` | ElevenLabs (vozes "Luciana Cadar" e "Christine") | Idem | Descartadas por duração natural (50,8 s e 48,0 s) incompatível com 42 s sem acelerar a voz |
| Trilha | `assets/audio/trilha_original_v1.wav` | Sintetizada no projeto (`scripts/build_audio.py`, seed fixa) | Obra original do projeto, sem samples de terceiros | Pad + piano sintético + pulso grave, ducking pela voz |
| Efeitos de papel/pasta | `assets/audio/sfx_papel_v1.wav` | Sintetizados no projeto (`scripts/build_audio.py`) | Obra original do projeto | Sincronizados aos movimentos da composição |
| Logotipo | `assets/brand/logo_bt_branco_transparente_391x193.png` | Fornecido pelo escritório (`03_Logo_BT_Transparente_Referencia.png`, SHA-256 `a039f069…dae487`) | Marca do escritório | Raster 391 x 193, exibido a 440 x 217 (mesma proporção, ampliação de 1,125x); não reconstruído, não recolorido |
| Marca de referência | `briefing/04_Logo_BT_Original_Referencia.jpg` | Fornecida pelo escritório | Marca do escritório | Apenas referência; não usada no vídeo |
| Cormorant Garamond | `assets/fonts/CormorantGaramond-*.woff2` | Google Fonts (subconjunto latin, fonts.gstatic.com) | SIL Open Font License 1.1 (`assets/fonts/OFL_CormorantGaramond.txt`) | Títulos editoriais |
| Montserrat | `assets/fonts/Montserrat-latin.woff2` | Google Fonts (subconjunto latin) | SIL Open Font License 1.1 (`assets/fonts/OFL_Montserrat.txt`) | Etiquetas, legendas, textos de apoio |
| Texturas de papel, cartão e mesa | `assets/textures/*.png` | Procedurais (`scripts/build_textures.py`, seed fixa) | Obra original do projeto | Sem fotografia de terceiros |
| GSAP 3.14.2 | CDN jsDelivr (padrão do HyperFrames) | GreenSock | Licença padrão GSAP (uso gratuito) | Runtime de animação |
| Fotos Pexels sugeridas no pacote | não usadas | n/a | n/a | Opcionais no briefing; os documentos foram construídos como camadas editáveis |

Nenhum dado pessoal, número de processo, selo, brasão, carimbo, assinatura ou texto que simule documento judicial ou notarial autêntico foi usado. Linhas cinzentas nos documentos são marcadores gráficos, não texto.
