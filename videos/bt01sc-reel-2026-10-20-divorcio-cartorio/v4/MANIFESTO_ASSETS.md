# Manifesto de assets da V4

| Asset | Arquivo | Origem | Licença ou direito | Observação |
| --- | --- | --- | --- | --- |
| Logo | `assets/brand/logo_bt_branco_transparente_391x193.png` | Fornecida pelo escritório; idêntica (SHA-256 `a039f069…dae487`) à do manual BT | Marca do escritório | Exibida a 500 px de largura; não redesenhada, não recolorida |
| Fontes | `assets/fonts/*.woff2` | Manual BT (`bt-reels-direcao-visual/modelo/assets/fonts`) | SIL Open Font License (arquivos `LICENSE-*.txt`) | Fira Sans Condensed, Piazzolla, Funnel Sans, IBM Plex Mono |
| Locução | `assets/audio/source/narracao_v4_henrique_B28C5YYYTnm12YQWPqeB.mp3` | ElevenLabs, voz Henrique `3ULAAai0IVN00DTWA6vF`, `eleven_v4`, geração `B28C5YYYTnm12YQWPqeB`, 437 créditos | Plano ElevenLabs da conta | Uso comercial depende do plano: você deve verificar isto |
| Efeitos sonoros | `assets/audio/sfx_v4.wav` | Sintetizados em `scripts/build_audio.py` (semente fixa) | Sem direitos de terceiros | Papel, contato, carimbo, caneta, acento do gancho |
| Filmagem | `assets/footage/source/mixkit-241-signing-a-contract-2160.mp4` | Mixkit, item 241, "Signing a contract" (https://mixkit.co/free-stock-video/signing-a-contract-241/) | Mixkit Stock Video Free License: uso comercial permitido, sem atribuição obrigatória (conferido em 18/10/2026 na página do item e em https://mixkit.co/license/) | Só mãos, sem rosto. O papel do original é um contrato em inglês: foi desfocado para o texto ficar ilegível |
| Filmagem tratada | `assets/footage/assinatura_241_9x16_v4.mp4` | `scripts/build_footage.sh` | Derivada da anterior | Dois enquadramentos 9:16, desfoque do papel, correção de cor BT |
| Texturas | `assets/textures/*.png` | Procedurais (`scripts/build_textures.py`, herdado da V1) | Sem direitos de terceiros | Fibra de papel e grão de mesa |
| GSAP 3.14.2, CustomEase | `assets/vendor/` | Manual BT | GSAP Standard License (https://gsap.com/standard-license, citada no cabeçalho do arquivo) | Locais, sem CDN no render |
| Three.js r169 | `assets/vendor/three.module.js` | jsDelivr, `three@0.169.0` | MIT | Local, sem CDN no render |

Clipes descartados por licença: a maioria dos clipes de assinatura e reunião do Mixkit está sob a "Stock Video Restricted
License", que proíbe projetos comerciais e posts de empresa. Foram conferidos um a um e não foram usados.
