# A bolinha condutora

É o "cursor" do vídeo: um ponto que leva o olho até o que a voz está dizendo.

## Aparência

```css
#dot { position: absolute; inset: 0; pointer-events: none; }
#dot-b { position: absolute; left: 0; top: 0; width: 30px; height: 30px; border-radius: 15px;
         background: var(--brand-sky); border: 3px solid var(--brand-primary); opacity: 0; }
.ghost { position: absolute; left: 0; top: 0; border-radius: 50%; background: var(--brand-sky); opacity: 0; }
```
```html
<div id="dot" class="clip" data-start="0" data-duration="..." data-track-index="9">
  <i class="ghost" id="g0"></i> ... <i class="ghost" id="g7"></i>
  <div id="dot-b"></div>
</div>
```

Sempre círculo. A borda Navy garante leitura sobre fundo claro e escuro.

## Comportamento

- Aparece cedo (0,2 s), parte de fora da coluna e vai ao primeiro alvo.
- Só se move quando a fala muda de assunto ou aponta algo. Parada no resto do tempo.
- Para no lado direito do alvo, a 30 px (`beside`), ou sobre a linha que está sendo
  desenhada, acompanhando o traço.
- Nas trocas de cena faz um arco amplo passando por um ponto afastado (`swoop`).
- Pode "entrar" em um elemento e sumir (escala 0 em 0,18 s) quando ele vira protagonista,
  e renascer no centro da cena seguinte.
- Some no fim do conteúdo, antes da assinatura.
- Não existe na versão de movimento reduzido.

## Regra de ouro: um movimento de cada vez

Cada movimento começa quando o anterior termina. Sobreposição de tweens fez a bolinha
saltar 237 px em um quadro e "voltar sozinha" na v004. x e y com curvas diferentes
desenham arcos naturais.

```js
let busy = 0;
const move = (t, p, d) => {
  const s0 = Math.max(t, busy);
  RAW.to("#dot-b", { x: p.x, duration: d, ease: "sine.inOut" }, s0);
  RAW.to("#dot-b", { y: p.y, duration: d, ease: "power2.inOut" }, s0);
  busy = s0 + d;
};
const swoop = (t, via, p, d) => { move(t, via, d * 0.45); move(busy, p, d * 0.55); };
const beside = (b, gap) => ({ x: b.x + b.w / 2 + (gap || 30), y: b.y });

RAW.set("#dot-b", { xPercent: -50, yPercent: -50, x: 1000, y: 1180, opacity: 0, scale: 1 }, 0);
RAW.to("#dot-b", { opacity: 1, duration: 0.3, ease: E.inOut }, 0.2);
```

Depois de um `set` que teleporta a bolinha (reaparecer em outra cena), atualize `busy`.

Alvos são medidos no DOM antes de qualquer tween (funções `pt` e `box` do template), em
pixels do quadro 1080 × 1920.

Durações de referência: 0,4 a 0,9 s para deslocamentos curtos, 1,0 a 1,1 s para arcos
de troca de cena, 0,5 s para disparar até uma palavra.

## Rastro

Oito bolinhas que seguem o mesmo caminho com atraso. O caminho é amostrado a 60 fps
depois de montado, e um tween de relógio desenha o rastro.

| Fantasma k | Tamanho | Atraso | Opacidade máxima |
|---|---|---|---|
| 0 a 7 | 22 − 2k px | 0,03 × (k+1) s | 0,42 − 0,045k |

O rastro só aparece quando a bolinha está em movimento:
`opacidade = máxima × min(1, distância entre bolinha e fantasma / 24) × opacidade da bolinha`.
Código completo no fim de `build()` em `modelo/tools/index.template.html`.

## Como conferir

Abrir a composição no Chromium com Playwright, percorrer a timeline quadro a quadro e
medir a posição de `#dot-b`. Critérios usados na v005: pico de 130 px por quadro nos
arcos, nenhum salto isolado, zero inversões bruscas de direção.
