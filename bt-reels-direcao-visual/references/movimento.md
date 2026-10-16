# Movimento

Tudo roda em uma única timeline GSAP pausada, registrada em `window.__timelines["main"]`.
Nada de `Date.now()` nem `Math.random()` sem semente. O template completo está em
`modelo/tools/index.template.html`.

## Curvas (CustomEase)

```js
const E = {
  standard:   CustomEase.create("bt-standard",   "M0,0 C0.4,0 0.2,1 1,1"),
  enter:      CustomEase.create("bt-enter",      "M0,0 C0.16,1 0.3,1 1,1"),
  exit:       CustomEase.create("bt-exit",       "M0,0 C0.4,0 1,1 1,1"),
  emphasized: CustomEase.create("bt-emphasized", "M0,0 C0.22,1 0.36,1 1,1"),
  inOut:      CustomEase.create("bt-inout",      "M0,0 C0.45,0 0.25,1 1,1"),
};
```

| Curva | Quando usar |
|---|---|
| emphasized | Títulos, palavras do gancho, marca "FALSO" |
| enter | Cards, rótulos, itens de lista que chegam |
| exit | Texto que sai (sobe 16 px e some) |
| inOut | Dissolves, linhas desenhadas, sublinhados, opacidades |
| standard | Carimbo e assentamentos discretos |

Não usar mola (overshoot) na bolinha: passar do alvo e voltar foi lido como "travada".

## Tempos

| Constante | Valor | Uso |
|---|---|---|
| BASE | 0,55 s | Duração padrão de entrada, dissolve e desenho |
| FAST | 0,30 s | Saída de texto |
| SLOW | 0,80 s | Linhas longas, sublinhado de seção |
| Palavra | 0,40 s, 20 px | Entrada palavra a palavra |
| TT | 36 px | Deslocamento vertical de título |
| TC | 20 px | Deslocamento vertical de card |
| Sobreposição de cena | +0,30 s | A cena que sai continua visível até o dissolve terminar |

Ritmo: a versão acelerada (v003) foi recusada. Deixe o elemento chegar antes ou junto
da fala, nunca atrasado, e deixe-o parado enquanto a voz explica.

## Receitas

```js
function title(sel, t) { tl.fromTo(sel, { opacity: 0, y: TT }, { opacity: 1, y: 0, duration: BASE, ease: E.emphasized }, t); }
function card(sel, t)  { tl.fromTo(sel, { opacity: 0, y: TC }, { opacity: 1, y: 0, duration: BASE, ease: E.enter }, t); }
function fadeIn(sel, t, d) { tl.fromTo(sel, { opacity: 0 }, { opacity: 1, duration: d || BASE, ease: E.inOut }, t); }
function draw(sel, t, d) { tl.fromTo(sel, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: d || BASE, ease: E.inOut }, t); }
function textOut(sel, t) { tl.to(sel, { opacity: 0, y: R ? 0 : -16, duration: FAST, ease: E.exit }, t); }
function word(sel, t) { tl.fromTo(sel, { opacity: 0, y: R ? 0 : 20 }, { opacity: 1, y: 0, duration: 0.4, ease: E.emphasized }, t); }
// dissolve centrado no corte
function dissolveIn(sel, cut) { RAW.fromTo(sel, { opacity: 0 }, { opacity: 1, duration: BASE, ease: E.inOut }, T(cut) - BASE / 2); }
```

`R` é `true` na versão de movimento reduzido: os deslocamentos viram zero.

### Sublinhado dourado que acompanha a fala

```css
.hl { background-image: linear-gradient(var(--brand-gold), var(--brand-gold));
      background-repeat: no-repeat; background-position: 0 94%; background-size: 0% 4px; font-weight: 600; }
```
```js
tl.to("#trecho", { backgroundSize: "100% 4px", duration: BASE, ease: E.inOut }, tempoDaFala);
```

### Gancho (cena 1)

- O quadro 0 já tem o título visível (o feed mostra o primeiro quadro).
- Cada palavra seguinte entra com a fala (`word`), a palavra-chave em Blue com escala 1,12 → 1.
- Número que conta (15 → 18 em 0,45 s) quando o tema tem um número.
- A pergunta é riscada em vermelho (`scaleX` 0 → 1, 0,35 s) antes da resposta.

### Transições entre cenas

- Padrão: dissolve de 0,55 s centrado no corte, com a cena anterior estendida 0,3 s.
- Revelação circular a partir de um objeto da cena (a chama da vela virou um anel de luz):
  `clipPath: circle(0px at x y)` → `circle(2300px at x y)`, 0,62 s, inOut.
- Saída para a assinatura: `filter: blur(18px)` na cena que sai, 0,5 s.
- Cor de fundo sempre no `.scene-inner`, nunca só na `section`, para não aparecer quadro
  em branco no corte.

### Momento de impacto (palavra que racha)

Tempos: `PZ` início da palavra na fala, `HIT` = PZ + 0,28 s, `OUT` cerca de 0,7 s depois.

1. Esconde a palavra original e escurece o resto da cena para 0,12 em 0,35 s.
2. Uma cópia grande (Fira 800, 220 px, `#B43A35`) voa da posição da palavra até o centro
   (540, 760), escala da altura original para 1, `power3.in`, de PZ até HIT.
3. No HIT: clarão radial vermelho (0 → 1 em 0,06 s, depois 0,35), tremor em x
   `[-14, 10, -6, 0]` em 0,2 s.
4. A palavra é composta por 5 camadas recortadas com `clip-path` (fragmentos). Elas se
   afastam 12 px e giram até 3° (0,18 s), e no OUT caem 220 px ou mais e somem (0,42 s).
5. 28 partículas quadradas de 6 a 16 px saem em leque (raio 200 a 530 px), 0,75 a 1,05 s.
6. Semente fixa no gerador (`seed = 358`, LCG 1664525 / 1013904223) para sair sempre igual.
7. Use `immediateRender: false` nos `fromTo` que começam depois do zero, e a opacidade
   em `set` separado; sem isso a palavra e as partículas aparecem antes da hora.
8. Reduzido: a palavra aparece e some por opacidade, com o som, sem voo nem partículas.

### Som de impacto (ffmpeg, sem banco de áudio)

```bash
ffmpeg -y \
 -f lavfi -i "aevalsrc='min(1,t*400)*0.9*sin(2*PI*(78*t-40*t*t))*exp(-9*t)':s=48000:d=1.1" \
 -f lavfi -i "anoisesrc=d=1.1:c=white:r=48000:a=0.9:seed=358" \
 -f lavfi -i "anoisesrc=d=1.1:c=pink:r=48000:a=0.6:seed=528" \
 -filter_complex "[1]highpass=f=1800,volume='exp(-28*t)':eval=frame[crack];[2]bandpass=f=3200:w=1500,volume='0.5*(exp(-30*abs(t-0.14))+exp(-30*abs(t-0.27))+0.7*exp(-30*abs(t-0.41)))':eval=frame[deb];[0][crack][deb]amix=inputs=3:normalize=0,alimiter=limit=0.89" \
 -ac 1 sfx_impact.wav
```

Batida grave descendente (78 Hz), estalo de rachadura e três estalinhos de fragmentos.
Coloque o `<audio>` cerca de 0,04 s antes do HIT, `data-volume="0.8"`.

### Assinatura final

```js
tl.to("#cena-anterior .scene-inner", { filter: "blur(18px)", duration: 0.5, ease: E.inOut }, t0);
dissolveIn("#s8 .scene-inner", t0 + 0.25);
tl.fromTo("#mancha-a", { x: 0, y: 0 }, { x: 260, y: 180, duration: 4.4, ease: "sine.inOut" }, t0 + 0.1);
tl.fromTo("#mancha-b", { x: 0, y: 0 }, { x: -320, y: -260, duration: 4.4, ease: "sine.inOut" }, t0 + 0.1);
tl.fromTo("#logo", { opacity: 0, scale: 1.06, filter: "blur(28px)" },
                   { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.9, ease: E.inOut }, t0 + 0.3);
card("#tel-rotulo", t0 + 0.9); card("#tel", t0 + 0.95);
tl.fromTo("#fio", { scaleX: 0 }, { scaleX: 1, duration: BASE, ease: E.inOut }, t0 + 1.3);
```

Manchas: Blue com opacidade 0,55, grandes e desfocadas, sobre Navy.
