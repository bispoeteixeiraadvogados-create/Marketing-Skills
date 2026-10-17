// Linha do tempo GSAP do Reel BT "Seu cônjuge diz NÃO ao divórcio?", versão V3 (segunda revisão).
// O texto da tela é a narração: cada palavra marcada com data-w="i" entra no instante em que é
// falada (assets/data/dados_v3.js, gerado de words_v3.json). Números soltos aqui são durações de
// movimento: palavras de 0,12 a 0,22 s, composições e máscaras de 0,25 a 0,45 s.
(function () {
  gsap.registerPlugin(CustomEase);
  const E = {
    enter: CustomEase.create("bt-enter", "M0,0 C0.16,1 0.3,1 1,1"),
    exit: CustomEase.create("bt-exit", "M0,0 C0.4,0 1,1 1,1"),
    emphasized: CustomEase.create("bt-emphasized", "M0,0 C0.22,1 0.36,1 1,1"),
    inOut: CustomEase.create("bt-inout", "M0,0 C0.45,0 0.25,1 1,1"),
  };
  const vars = (window.__hyperframes && window.__hyperframes.getVariables && window.__hyperframes.getVariables()) || {};
  const R = vars.reducedMotion === true;
  const root = document.getElementById("root");
  const D = window.BT_DADOS;
  const PAL = D.palavras;
  const CUT = D.cortes;
  const DUR = D.duracao;
  const ti = (i) => PAL[i].ini;
  const tf = (i) => PAL[i].fim;
  const WORD = 0.2;

  function box(sel) {
    const r0 = root.getBoundingClientRect();
    const sc = r0.width / 1080;
    const r = document.querySelector(sel).getBoundingClientRect();
    return { l: (r.left - r0.left) / sc, r: (r.right - r0.left) / sc, t: (r.top - r0.top) / sc, b: (r.bottom - r0.top) / sc, w: r.width / sc, h: r.height / sc };
  }

  function build(AL) {
    const tl = gsap.timeline({ paused: true });
    // estados iniciais: aplicados já e também no tempo 0 (um set de duração zero no tempo 0 não é
    // desenhado enquanto a agulha está exatamente em 0)
    const init = (targets, v) => {
      gsap.set(targets, v);
      tl.set(targets, v, 0);
    };
    const W = (i) => document.querySelector('[data-w="' + i + '"]');
    // medidas no layout natural
    const P = { nao2: box("#s2-nao"), veto: box("#s6-veto .w") };

    // ------------------------------------------------ receitas
    // palavra falada: sobe 22 px e aparece em 0,2 s, junto da voz (0,05 s antes)
    function word(i, opt) {
      const o = opt || {};
      const at = ti(i) - (o.lead === undefined ? 0.05 : o.lead);
      const from = { opacity: 0, y: R ? 0 : o.y === undefined ? 22 : o.y, x: R ? 0 : o.x || 0 };
      tl.fromTo(W(i), from, { opacity: o.to || 1, x: 0, y: 0, duration: o.d || WORD, ease: E.enter, immediateRender: false }, at);
    }
    function words(a, b, opt) {
      for (let i = a; i <= b; i++) word(i, opt);
    }
    function fadeIn(sel, at, d) {
      tl.fromTo(sel, { opacity: 0 }, { opacity: 1, duration: d || 0.25, ease: E.inOut, immediateRender: false }, at);
    }
    function out(sel, at, d, y) {
      tl.to(sel, { opacity: 0, y: R ? 0 : y === undefined ? -30 : y, duration: d || 0.22, ease: E.exit }, at);
    }
    function rule(sel, at, d) {
      if (R) fadeIn(sel, at, 0.2);
      else tl.fromTo(sel, { opacity: 1, scaleX: 0 }, { opacity: 1, scaleX: 1, duration: d || 0.35, ease: E.inOut, immediateRender: false }, at);
    }
    // revelação por máscara (da esquerda para a direita, ou de baixo para cima)
    function maskIn(sel, at, d, dir) {
      if (R) return fadeIn(sel, at, 0.12);
      // margens negativas: acentos e descendentes não são cortados pela máscara
      const from = dir === "up" ? "inset(100% -8% -12% -8%)" : "inset(-30% 100% -12% -8%)";
      tl.fromTo(sel, { opacity: 1, clipPath: from }, { clipPath: "inset(-30% -8% -12% -8%)", duration: d || 0.2, ease: E.enter, immediateRender: false }, at);
    }

    // todas as palavras começam escondidas (as da primeira linha do gancho já estão no quadro 0)
    const hidden = [];
    document.querySelectorAll("[data-w]").forEach((el) => {
      if (+el.dataset.w > 2) hidden.push(el);
    });
    init(hidden, { opacity: 0 });

    // ================================================ C1 gancho, 0 a 1,72 s (escuro)
    // a pergunta quase inteira no primeiro meio segundo; a palavra falada acende (0,6 para 1)
    init([W(0), W(1), W(2)], { opacity: 0.62 });
    if (R) {
      tl.set([W(3), W(4), W(5)], { opacity: 0.62 }, 0.12);
    } else {
      tl.fromTo(W(3), { opacity: 0, scale: 1.28, transformOrigin: "0% 70%" }, { opacity: 0.62, scale: 1, duration: 0.24, ease: E.enter, immediateRender: false }, 0.1);
      tl.fromTo([W(4), W(5)], { opacity: 0, y: 26 }, { opacity: 0.62, y: 0, duration: 0.2, ease: E.enter, stagger: 0.07, immediateRender: false }, 0.22);
    }
    for (let i = 0; i <= 5; i++) tl.to(W(i), { opacity: 1, duration: 0.12, ease: "none" }, Math.max(0.01, ti(i) - 0.03));
    // o NÃO pulsa junto do salto da fissura
    if (!R) {
      tl.to("#s1-nao", { scale: 1.07, duration: 0.1, ease: E.enter, transformOrigin: "0% 70%" }, ti(3) - 0.02);
      tl.to("#s1-nao", { scale: 1, duration: 0.22, ease: E.inOut }, ti(3) + 0.08);
    }
    // sai junto da descida da câmera (o deslocamento vem da cena 3D)
    tl.to("#s1-title", { opacity: 0, duration: 0.25, ease: E.exit }, R ? AL.T_BRK + 0.2 : AL.T_HIT - 0.38);

    // ================================================ C2 ruptura e resposta (piso Sand)
    // "Isso" e o NÃO grande entram por máscara no instante do toque
    const HIT = AL.T_HIT - 0.03;
    fadeIn(W(6), HIT, 0.14);
    if (R) fadeIn(W(7), HIT, 0.12);
    else {
      tl.fromTo(W(7), { opacity: 1, clipPath: "inset(100% -8% -12% -8%)", scale: 1.14, transformOrigin: "0% 100%" }, { clipPath: "inset(-40% -8% -12% -8%)", duration: 0.12, ease: E.enter, immediateRender: false }, HIT);
      tl.to(W(7), { scale: 1, duration: 0.3, ease: E.emphasized }, HIT + 0.04);
    }
    init("#s2-rule", { width: P.nao2.w - 14, opacity: 0, scaleX: 0 });
    rule("#s2-rule", ti(8) - 0.05, 0.35);
    words(8, 10);
    out(["#s2-title", "#s2-rule"], CUT.c23 - 0.12, 0.22);

    // ================================================ C3 comparação (vista de cima)
    // o primeiro campo entra pela esquerda e o segundo pela direita: movimento lateral de oposição
    words(11, 12, { x: -40, y: 0, d: 0.22 });
    word(13, { x: -70, y: 0, d: 0.3 });
    words(14, 15, { x: 40, y: 0, d: 0.22 });
    word(16, { x: 70, y: 0, d: 0.3 });

    // ================================================ C4 fotografia documental, 8,16 a 10,62 s
    // o quadro entra da direita (continua o travelling da comparação); dentro dele a frente das
    // fotos anda mais que o fundo (paralaxe real entre as camadas recortadas)
    const C4 = CUT.c34;
    const SW = ti(20) - 0.04; // troca de enquadramento no "não"
    if (R) fadeIn("#s4-plate", C4, 0.15);
    else tl.fromTo("#s4-plate", { x: 70, opacity: 0.2 }, { x: 0, opacity: 1, duration: 0.32, ease: E.enter, immediateRender: false }, C4);
    const pA = { s0: 0.735, s1: 0.755, x0: -48, y0: -16 };
    init(["#s4-a-bg", "#s4-a-fg"], { scale: pA.s0, x: pA.x0, y: pA.y0 });
    init("#s4-b", { opacity: 0 });
    if (!R) {
      tl.to("#s4-a-bg", { scale: pA.s1, x: pA.x0 - 14, y: pA.y0 - 6, duration: SW - C4 + 0.05, ease: "none" }, C4);
      tl.to("#s4-a-fg", { scale: pA.s1 + 0.03, x: pA.x0 - 46, y: pA.y0 - 20, duration: SW - C4 + 0.05, ease: "none" }, C4);
    }
    // segundo enquadramento: mais fechado, na mão que assina
    const pB = { s0: 1.02, x0: -160, y0: -150 };
    init(["#s4-b-bg", "#s4-b-fg"], { scale: pB.s0, x: pB.x0, y: pB.y0 });
    tl.set("#s4-b", { opacity: 1 }, SW);
    tl.set("#s4-a", { opacity: 0 }, SW);
    if (!R) {
      const dB = CUT.c45 - SW + 0.05;
      tl.to("#s4-b-bg", { scale: pB.s0 + 0.015, x: pB.x0 + 10, duration: dB, ease: "none" }, SW);
      tl.to("#s4-b-fg", { scale: pB.s0 + 0.045, x: pB.x0 - 6, y: pB.y0 - 22, duration: dB, ease: "none" }, SW);
    }
    words(17, 22);

    // ================================================ C5 questões relacionadas, 10,62 a 15,94 s
    // três cortes secos, uma palavra por plano, depois o complemento com a lista
    maskIn("#s5a .big .w", ti(23) - 0.07, 0.2);
    maskIn("#s5b .big .w", ti(24) - 0.07, 0.2);
    maskIn("#s5c .big .w", ti(25) - 0.07, 0.2);
    for (const s of ["#s5a", "#s5b"]) {
      const st = parseFloat(document.querySelector(s).dataset.start);
      const du = parseFloat(document.querySelector(s).dataset.duration);
      if (!R) tl.fromTo(s + " .big", { x: 0 }, { x: -18, duration: du, ease: "none", immediateRender: false }, st);
    }
    const C5c = parseFloat(document.querySelector("#s5c").dataset.start);
    const C5d = parseFloat(document.querySelector("#s5d").dataset.start);
    init(["#s5c-bg", "#s5c-fg"], { scale: 1.0, transformOrigin: "50% 62%" });
    if (!R) {
      tl.to("#s5c-bg", { scale: 1.025, duration: C5d - C5c + 0.4, ease: "none" }, C5c);
      tl.to("#s5c-fg", { scale: 1.07, y: -10, duration: C5d - C5c + 0.4, ease: "none" }, C5c);
    }
    // empurrão lateral para o complemento
    if (R) fadeIn("#s5d", C5d, 0.2);
    else {
      tl.fromTo("#s5d", { x: 1080 }, { x: 0, duration: 0.38, ease: E.inOut, immediateRender: false }, C5d);
      tl.to("#s5c", { x: -1080, duration: 0.38, ease: E.inOut }, C5d);
    }
    init(["#it1 .t", "#it2 .t", "#it3 .t"], { opacity: 0 });
    init(["#it1 .item-rule", "#it2 .item-rule", "#it3 .item-rule"], { opacity: 0 });
    ["#it1", "#it2", "#it3"].forEach((s, k) => {
      fadeIn(s + " .t", C5d + 0.18 + k * 0.06, 0.2);
      rule(s + " .item-rule", C5d + 0.14 + k * 0.06, 0.3);
    });
    words(26, 31, { y: 18 });

    // ================================================ C6 conclusão no azul, 15,94 a 21,35 s
    // a cena abre num círculo que nasce da forma da aliança (fio Gold na borda)
    const C6 = parseFloat(document.querySelector("#s6").dataset.start);
    const IRIS = 0.45;
    if (R) {
      fadeIn("#s6-iris", C6, 0.2);
      init("#s6-ring", { opacity: 0 });
    } else {
      tl.fromTo("#s6-iris", { clipPath: "circle(0px at 540px 960px)" }, { clipPath: "circle(1120px at 540px 960px)", duration: IRIS, ease: E.inOut, immediateRender: false }, C6);
      tl.fromTo("#s6-circle", { attr: { r: 0 }, opacity: 1 }, { attr: { r: 1120 }, duration: IRIS, ease: E.inOut, immediateRender: false }, C6);
      tl.to("#s6-circle", { opacity: 0, duration: 0.15, ease: "none" }, C6 + IRIS - 0.15);
      init("#s6-iris", { clipPath: "circle(0px at 540px 960px)" });
      // aproximação lenta do texto (energia sem piscar)
      tl.fromTo("#s6-inner", { scale: 1 }, { scale: 1.035, duration: CUT.c67 - C6, ease: "none", immediateRender: false, transformOrigin: "0% 30%" }, C6);
    }
    words(32, 36);
    word(37, { y: 0, d: 0.28 });
    if (!R) tl.fromTo(W(37), { scale: 0.9, transformOrigin: "0% 80%" }, { scale: 1, duration: 0.32, ease: E.emphasized, immediateRender: false }, ti(37) - 0.05);
    words(38, 39);
    init("#s6-rule", { opacity: 0 });
    rule("#s6-rule", ti(40) - 0.2, 0.3);
    words(40, 44, { y: 16 });

    // ================================================ C7 assinatura, 21,35 a 25,91 s
    // desfoque de saída da conclusão, a logo entra desfocada e assenta (movimento desacelerado)
    const C7 = parseFloat(document.querySelector("#s7").dataset.start);
    if (R) {
      fadeIn("#s7", C7, 0.3);
      out("#s6-inner", C7, 0.3, 0);
      fadeIn("#s7-logo", ti(45) - 0.1, 0.3);
    } else {
      fadeIn("#s7", C7, 0.4);
      tl.to("#s6-inner", { filter: "blur(18px)", opacity: 0, duration: 0.42, ease: E.exit }, C7);
      tl.fromTo("#s7-logo", { opacity: 0, filter: "blur(14px)", scale: 1.05 }, { opacity: 1, filter: "blur(0px)", scale: 1, duration: 0.9, ease: E.enter, immediateRender: false }, ti(45) - 0.12);
    }
    init("#s7-logo", { opacity: 0 });
    init("#s7-rule", { opacity: 0 });
    rule("#s7-rule", tf(48) - 0.3, 0.6);
    words(49, 51, { y: 16 });
    init("#s7-contacts", { opacity: 0 });
    if (R) fadeIn("#s7-contacts", tf(51) - 0.2, 0.3);
    else tl.fromTo("#s7-contacts", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, ease: E.enter, immediateRender: false }, tf(51) - 0.25);

    // ================================================ vinheta nas cenas escuras
    init("#vignette", { opacity: 1 });
    tl.to("#vignette", { opacity: 0, duration: 0.5, ease: "none" }, AL.T_BRK + 0.3);
    tl.set("#vignette", { opacity: 0.8 }, CUT.c34);
    tl.set("#vignette", { opacity: 0 }, CUT.c45);
    tl.to("#vignette", { opacity: 0.8, duration: 0.45, ease: "none" }, C6);

    tl.set({}, {}, DUR);
    window.__timelines["main"] = tl;
  }

  const faces = ['800 120px "Fira Sans Condensed"', '500 46px "Fira Sans Condensed"', '600 86px "Cormorant Garamond"', 'italic 600 86px "Cormorant Garamond"'];
  Promise.all([Promise.all(faces.map((f) => document.fonts.load(f))).then(() => document.fonts.ready), window.__ALIANCA_PROMISE]).then(([, info]) => build(info));
})();
