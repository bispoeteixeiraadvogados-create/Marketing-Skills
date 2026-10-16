// Kit BT para as cenas: pictogramas geométricos, ciclo de caminhada, realce de palavras e contadores.
// Tudo é seek-safe: só tweens e sets com estados explícitos, nenhum relógio e nenhum sorteio sem semente.
(function () {
  const NAVY = "#0b1f4b";

  // Pictograma geométrico: cabeça circular, corpo em cápsula, sem rosto, gênero, etnia ou idade.
  // Variedade só por silhueta: mochila, marmita, capacete, avental, cracha ou nenhum.
  function picto(id, cor, acessorio, opcoes) {
    const o = opcoes || {};
    const fundo = o.fundo || "#faf8f4";
    const extraTras = acessorio === "mochila" ? `<rect x="22" y="46" width="20" height="36" rx="7" fill="${cor}"/>` : "";
    const extraFrente =
      acessorio === "avental" ? `<path d="M34 60 H66 L71 112 H29 Z" fill="${cor}"/>` :
      acessorio === "cracha" ? `<rect x="53" y="60" width="10" height="14" rx="2" fill="${fundo}"/>` : "";
    const capacete = acessorio === "capacete" ? `<path d="M33 19 A17 17 0 0 1 67 19 L71 21 H29 Z" fill="${cor}"/>` : "";
    const marmita = acessorio === "marmita" ? `<rect x="42" y="92" width="18" height="13" rx="3" fill="${cor}"/>` : "";
    return `<svg id="${id}" viewBox="0 0 100 172" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="overflow:visible">
      <g fill="none" stroke="${cor}" stroke-linecap="round">
        <g id="${id}-bt"><line x1="50" y1="48" x2="50" y2="94" stroke-width="11"/></g>
        <g id="${id}-pt"><line x1="50" y1="98" x2="50" y2="166" stroke-width="13"/></g>
        ${extraTras}
        <line x1="50" y1="40" x2="50" y2="96" stroke-width="26"/>
        ${extraFrente}
        <g id="${id}-pf"><line x1="50" y1="98" x2="50" y2="166" stroke-width="13"/></g>
        <g id="${id}-bf"><line x1="50" y1="48" x2="50" y2="94" stroke-width="11"/>${marmita}</g>
      </g>
      <circle cx="50" cy="20" r="14" fill="${cor}"/>${capacete}
    </svg>`;
  }

  // Ciclo de caminhada de 12 quadros a 30 fps (0,4 s por passo), repetido um número finito de vezes.
  function andar(tl, id, t0, duracao, periodo) {
    const p = periodo || 0.4;
    const meio = p / 2;
    const rep = Math.max(0, Math.floor(duracao / meio) - 1);
    const pernas = [[`#${id}-pf`, 24], [`#${id}-pt`, -24]];
    const bracos = [[`#${id}-bf`, -22], [`#${id}-bt`, 22]];
    pernas.forEach(([sel, a]) => tl.fromTo(sel, { rotation: -a }, { rotation: a, svgOrigin: "50 98", duration: meio, ease: "sine.inOut", yoyo: true, repeat: rep }, t0));
    bracos.forEach(([sel, a]) => tl.fromTo(sel, { rotation: -a }, { rotation: a, svgOrigin: "50 48", duration: meio, ease: "sine.inOut", yoyo: true, repeat: rep }, t0));
    tl.fromTo(`#${id}`, { y: 0 }, { y: -3, duration: meio / 2, ease: "sine.inOut", yoyo: true, repeat: Math.max(0, Math.floor(duracao / (meio / 2)) - 1) }, t0);
  }

  // Realce de palavra importante: cresce, brilha e assenta. O estalo sonoro está na mixagem.
  // A pedido do escritório, o realce ficou mais visível: escala 1,6 vez maior e brilho mais aberto.
  function realce(tl, sel, t, cor, escala) {
    const e = 1 + ((escala || 1.08) - 1) * 1.6;
    const brilho = cor || "rgba(143, 197, 239, 0.75)";
    tl.fromTo(sel, { scale: 1 }, { scale: e, duration: 0.16, ease: "bt-overshoot", immediateRender: false }, t);
    tl.to(sel, { scale: 1, duration: 0.4, ease: "bt-standard" }, t + 0.16);
    tl.fromTo(sel, { filter: `drop-shadow(0 0 0px ${brilho})` }, { filter: `drop-shadow(0 0 30px ${brilho})`, duration: 0.16, ease: "power2.out", immediateRender: false }, t);
    tl.to(sel, { filter: `drop-shadow(0 0 8px ${brilho})`, duration: 0.7, ease: "bt-standard" }, t + 0.16);
  }

  // Contador por degraus pré-calculados na curva expo out: cada valor é um set no instante exato.
  function contar(tl, sel, t0, de, ate, duracao) {
    const passos = Math.abs(ate - de);
    for (let i = 1; i <= passos; i++) {
      const p = i / passos;
      const x = p >= 1 ? 1 : -Math.log2(1 - p * (1 - Math.pow(2, -10))) / 10;
      tl.set(sel, { textContent: String(de + Math.sign(ate - de) * i) }, t0 + duracao * x);
    }
  }

  // Traço desenhado (Trim Paths) num path ou linha SVG de comprimento conhecido.
  function tracar(tl, sel, comprimento, t, duracao, ease) {
    tl.fromTo(sel, { strokeDasharray: comprimento, strokeDashoffset: comprimento }, { strokeDashoffset: 0, duration: duracao || 0.55, ease: ease || "bt-standard" }, t);
  }

  // Movimento reduzido (variável reducedMotion): sem deslocamento, giro, escala ou desfoque; só opacidade,
  // cor e traços. Escala que nasce do zero ou vai a zero vira opacidade. Os sets de layout ficam intactos.
  const reduzido = () => {
    const v = (window.__hyperframes && window.__hyperframes.getVariables && window.__hyperframes.getVariables()) || {};
    return v.reducedMotion === true;
  };
  // Num fromTo, x e y ficam parados no valor de destino (o elemento já está onde a animação o deixaria).
  const MOVE = ["x", "y", "rotation", "rotate", "scale", "skewX", "skewY", "filter", "motionPath"];
  const limpa = (de, para) => {
    const a = de ? Object.assign({}, de) : null;
    const b = para ? Object.assign({}, para) : null;
    const fixos = {};
    if (a && b) for (const k of ["x", "y"]) if (k in a && k in b && typeof b[k] === "number") fixos[k] = b[k];
    if (a && typeof a.scale === "number" && a.scale < 0.5 && a.opacity === undefined) {
      a.opacity = 0;
      if (b && b.opacity === undefined) b.opacity = 1;
    }
    if (b && typeof b.scale === "number" && b.scale < 0.5 && b.opacity === undefined) b.opacity = 0;
    for (const k of MOVE) {
      if (a) delete a[k];
      if (b) delete b[k];
    }
    Object.assign(a || {}, fixos);
    Object.assign(b || {}, fixos);
    return [a, b];
  };
  const timelineOriginal = gsap.timeline.bind(gsap);
  gsap.timeline = function (opts) {
    const tl = timelineOriginal(opts);
    if (!reduzido()) return tl;
    const to = tl.to.bind(tl), from = tl.from.bind(tl), fromTo = tl.fromTo.bind(tl);
    tl.to = (alvo, vars, pos) => {
      // Contadores que rolam (trilhos de números) trocam de valor por corte seco, sem deslizar.
      if (typeof alvo === "string" && alvo.indexOf("trilho") >= 0 && vars && typeof vars.y === "number") tl.set(alvo, { y: vars.y }, pos);
      return to(alvo, limpa(null, vars)[1], pos);
    };
    tl.from = (alvo, vars, pos) => from(alvo, limpa(vars, null)[0], pos);
    tl.fromTo = (alvo, de, para, pos) => {
      const [a, b] = limpa(de, para);
      return fromTo(alvo, a, b, pos);
    };
    return tl;
  };

  window.BT = { picto, andar, realce, contar, tracar, NAVY, reduzido };
})();
