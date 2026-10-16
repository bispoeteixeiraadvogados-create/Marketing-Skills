# Processo de produção

Ordem que funcionou no Reel "Pensão aos 18". Cada etapa termina com algo que o usuário
pode ver ou ouvir antes da seguinte.

## 1. Roteiro

- Uma ideia por frase. Uma frase vira uma cena ou um passo dentro da cena.
- Linguagem de quem não é advogado. Troque número de súmula, artigo e jargão por quem
  decidiu e o que muda na vida da pessoa.
- Confira cada afirmação na fonte oficial (Planalto, STJ, STF) e registre o link. Exemplo
  conferido: CPC, art. 528, §3º e §7º (prisão por dívida de alimentos).
- Os advogados aprovam o texto antes de gerar a voz. Mudar a voz depois custa créditos e
  retrabalho de tempo.

## 2. Narração (ElevenLabs)

- `creative_generate_speech`, voz `3ULAAai0IVN00DTWA6vF` (Henrique), modelo `eleven_v4`,
  `generations_count: 1`, uma frase por linha, `context` descrevendo a peça.
- Use um flow próprio do projeto e reaproveite o mesmo `flow_id` nas regravações.
- Se a chamada falhar por erro de proxy ou plano, confira o estado antes de repetir.
- Baixe o WAV para `assets/audio/` com nome de take (`..._takeA.wav`, `takeB`...).

## 3. Tempo por palavra

Transcrever localmente com faster-whisper e gravar `{"t","s","e"}` por palavra.
Passe o áudio como array (a leitura direta pelo PyAV falhou neste ambiente):

```python
import soundfile as sf, numpy as np
from faster_whisper import WhisperModel
a, sr = sf.read(wav, dtype="float32")  # mono 16 kHz; reamostre se preciso
m = WhisperModel("small", compute_type="int8")
segs, _ = m.transcribe(a, language="pt", word_timestamps=True)
```

Corrija a grafia das palavras pelo roteiro aprovado (o whisper erra nomes e números).

## 4. Roteiro visual

Tabela cena a cena: frase, tempo, fundo (claro/escuro), protagonista, para onde vai a
bolinha, o que é desenhado ou sublinhado. Um protagonista e no máximo dois apoios por
cena. Decida aqui se haverá momento de impacto (no máximo um).

## 5. Composição

- Parta de `modelo/tools/index.template.html`: fontes, tokens, curvas, funções
  `title/card/word/draw/dissolveIn`, bolinha, rastro, legendas e assinatura já prontos.
- Cenas como `<section class="scene clip">` com `data-start`, `data-duration` e
  `data-track-index` alternando 1 e 2; fundo no `.scene-inner`.
- Escreva os tempos direto na locução final sempre que possível.
- Se a narração mudar depois de a animação estar pronta, use a camada de tempo: âncoras
  `[tempo antigo, tempo novo]` em `timing.json` (exemplo em `timing.exemplo.json`),
  função `T()` interpolando trecho a trecho e `RAW` para o que já está no tempo novo.
  `build.py` aplica isso aos clipes, injeta as âncoras e gera legendas e SRT. Ele é
  específico do Reel de exemplo (lista de cortes e cenas escuras): ajuste `OLD_CUTS`,
  `DARK` e os nomes de arquivo.
- Legendas: blocos definidos em `timing.json` (`"blocks"`, linhas separadas por `|`),
  uma palavra acende quando é falada, bloco termina 0,5 s depois da última palavra ou
  antes do próximo, nunca atravessa troca de cena.

## 6. Verificação

```bash
npx hyperframes lint
npx hyperframes check
npx hyperframes snapshot   # quadros-chave em imagem
```

Depois, medir a bolinha quadro a quadro (Playwright 1.55 com o Chromium do ambiente) e
olhar as imagens de cada troca de cena e do momento de impacto.

## 7. Render e áudio

`modelo/tools/render.sh <pasta> <nome>` renderiza a versão normal e a reduzida em
qualidade alta a 30 fps, normaliza para -16 LUFS e -1,5 dBTP em duas passagens e mostra
as medidas.

## 8. Entrega

- `renders/BT_<tema>_9x16_ptBR_vNNN.mp4`, `..._reduced.mp4` e `.srt`.
- Guardar o template de cada versão entregue (`index.template.vNNN.html`) para poder
  voltar.
- Relatório curto ao usuário: o que mudou, medidas, pontos a conferir.

## Como trabalhar com o usuário

- Mostrar opções lado a lado (quadro comparativo) quando a decisão é visual, como foi na
  escolha das fontes.
- Uma versão por rodada de pedidos, numerada. "O resto tá perfeito" significa não mexer
  no resto.
- Ser franco quando um pedido tem risco (exagero visual, afirmação jurídica, gasto de
  créditos) e deixar a decisão com o escritório.
