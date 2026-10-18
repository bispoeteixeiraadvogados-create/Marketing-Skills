// Montagem da V4: cada cena entra com a fala (tempos de components/timing.js).
// Transições: corte seco entre cenas, match cut do documento ilustrado para a escritura 3D
// e desfoque para a assinatura. Um protagonista por cena; nada se move depois de explicar.
(function () {
  function build() {
    BT.setup();
    const tl = BT.tl;
    const R = BT.R;
    const E = BT.E;
    const w = BT.w;
    const cam = BT.SceneLayout.camera;

    // conteúdo gerado pelos componentes antes de qualquer medida
    BT.LegalDocument.render("#s01-doc", { seed: 7, rows: 26, label: "", heading: "" });
    BT.LegalDocument.render("#s05-doc", {
      seed: 35,
      label: "Instrumento particular",
      heading: "ACORDO<br />PARTICULAR",
      headingSize: 112,
      rows: 15,
      signatures: ["PARTE A", "PARTE B"],
    });
    BT.BTSubtitle.build("#captions");

    // ---------------- Cena 01: gancho. O quadro 0 já mostra a pergunta.
    if (!R) {
      tl.fromTo("#s01-world", { scale: 1, y: 0, transformOrigin: "620px 1250px" }, { scale: 1.17, y: -40, duration: 1.52, ease: E.camera }, 0);
      tl.fromTo("#s01-title", { scale: 1.035, transformOrigin: "0% 50%" }, { scale: 1, duration: 0.7, ease: E.emphasized }, 0);
    }

    // ---------------- Cena 02: SIM
    const s02 = BT.scene("s02").start;
    BT.fadeIn("#s02-cat", s02 + 0.12, 0.4);
    BT.word("#s02-q1", w("no") - 0.06);
    BT.word("#s02-q2", w("cartório") - 0.06);
    const SIM = 3.28; // início real de "Sim" (fim do silêncio anterior)
    tl.to("#s02-q", { opacity: 0.38, duration: 0.25, ease: E.inOut }, SIM);
    BT.punch("#s02-sim", SIM, 1.22);
    BT.ruleIn("#s02-ul", SIM + 0.18, 0.45);
    BT.card("#s02-pos", SIM + 0.3);

    // ---------------- Cena 03: existe uma condição
    const s03 = BT.scene("s03");
    BT.fadeIn("#s03-cat", w("mas") - 0.02, 0.4);
    BT.ruleIn("#s03-rule", w("mas"), 0.5);
    BT.word("#s03-t1", w("há") - 0.05);
    BT.punch("#s03-t2", w("condição") - 0.04, 1.12);
    BT.card("#s03-sup", w("importante"));
    if (!R) tl.fromTo("#s03-world", { scale: 1, transformOrigin: "96px 600px" }, { scale: 1.03, duration: s03.end - s03.start, ease: "sine.inOut" }, s03.start);

    // ---------------- Cena 04: guarda, convivência, alimentos, e a convergência
    const s04 = BT.scene("s04");
    ["#s04-r1", "#s04-r2", "#s04-r3"].forEach((r) => gsap.set([r + " .icon", r + " .word", r + " .fio"], { opacity: 0 }));
    gsap.set(["#s04-cat", "#s04-cat2", "#s04-frame", "#s04-stripe"], { opacity: 0 });
    const rowIn = (r, t) => {
      tl.set(r + " .fio", { opacity: 1 }, t);
      BT.ruleIn(r + " .fio", t, 0.5);
      tl.fromTo(
        r + " .icon",
        { opacity: 0, y: R ? 0 : -46, rotation: R ? 0 : -5 },
        { opacity: 1, y: 0, rotation: 0, duration: 0.45, ease: E.enter, immediateRender: false },
        t,
      );
      BT.word(r + " .word", t + 0.06);
    };
    rowIn("#s04-r1", w("guarda") - 0.04);
    rowIn("#s04-r2", w("convivência") - 0.04);
    tl.fromTo("#s04-cal circle", { scale: 0, transformOrigin: "50% 50%" }, { scale: 1, duration: 0.25, stagger: 0.06, ease: E.enter, immediateRender: false }, w("convivência") + 0.15);
    rowIn("#s04-r3", w("alimentos") - 0.04);
    const pull = w("precisam") + 0.08;
    cam("#s04-world", [
      { t: s04.start, cx: 450, cy: 505, s: 1.5 },
      { t: w("convivência") - 0.12, d: 0.45, cx: 528, cy: 775, s: 1.14 },
      { t: w("alimentos") - 0.1, d: 0.42, cx: 500, cy: 1045, s: 1.3 },
      { t: pull, d: 0.95, cx: 540, cy: 960, s: 1 },
    ]);
    BT.fadeIn("#s04-cat", pull + 0.35, 0.4);
    tl.fromTo(
      "#s04-frame",
      { opacity: 1, clipPath: "inset(0% 100% 0% 0%)" },
      { opacity: 1, clipPath: "inset(0% 0% 0% 0%)", duration: 0.7, ease: E.inOut, immediateRender: false },
      w("resolvidos") + 0.1,
    );
    BT.fadeOut("#s04-r1 .fio", w("resolvidos") + 0.1, 0.3);
    tl.fromTo("#s04-stripe", { opacity: 1, scaleY: 0, transformOrigin: "50% 0%" }, { scaleY: 1, duration: 0.6, ease: E.inOut, immediateRender: false }, w("resolvidos") + 0.1);
    BT.textOut("#s04-cat", w("justiça") - 0.12);
    BT.card("#s04-cat2", w("justiça") + 0.05);
    BT.WordHighlight.underline("#s04-cat2-hl", w("justiça") + 0.3, 0.5);

    // ---------------- Cena 05: o acordo particular, sozinho, não basta
    const s05 = BT.scene("s05");
    gsap.set("#s05-dark", { opacity: 0 });
    gsap.set(["#s05-t", "#s05-sup"], { opacity: 0 });
    const back = w("sozinho");
    cam("#s05-world", [
      { t: s05.start, cx: 450, cy: 560, s: 1.72 },
      { t: s05.start + 0.02, d: back - s05.start - 0.04, cx: 440, cy: 545, s: 1.86, ease: "sine.inOut", push: true },
      { t: back - 0.06, d: 0.82, cx: 1167, cy: 1919, s: 0.42 },
    ]);
    tl.to("#s05-doc", { opacity: 0.5, filter: R ? "none" : "blur(1.5px)", duration: 0.5, ease: E.inOut }, back + 0.15);
    tl.to("#s05-dark", { opacity: 1, duration: 0.24, ease: E.inOut }, 12.46);
    tl.to("#s05-scrim", { opacity: 0, duration: 0.24, ease: E.inOut }, 12.46);
    BT.punch("#s05-t", w("não") - 0.03, 1.14);
    BT.card("#s05-sup", w("basta") + 0.12);

    // ---------------- Cena 06: resolução judicial (carimbo 3D em components/three-stage.js)
    const s06 = BT.scene("s06");
    BT.fadeIn("#s06-cat", s06.start + 0.05, 0.4);
    BT.word("#s06-w1", w("resolução") - 0.05);
    BT.word("#s06-w2", w("judicial") - 0.05);

    // ---------------- Cena 07: consenso (ilustração) e match cut para a escritura 3D
    const s07 = BT.scene("s07");
    const MATCH = 18.2;
    gsap.set("#s07b", { autoAlpha: 0 });
    BT.fadeIn("#s07-cat", s07.start + 0.06, 0.4);
    BT.word("#s07-t", w("consenso") - 0.05);
    cam("#s07-world", [
      { t: s07.start, cx: 540, cy: 960, s: 1 },
      { t: w("casal") - 0.02, cut: true, cx: 538, cy: 1110, s: 1.6 },
      { t: w("casal"), d: MATCH - w("casal"), cx: 536, cy: 1112, s: 2.25, ease: "sine.inOut", push: true },
    ]);
    if (!R) {
      // gestos discretos: quem fala move a mão, quem escuta acena com a cabeça
      tl.fromTo("#pr-arm", { rotation: 0, svgOrigin: "786 420" }, { rotation: -9, duration: 0.35, ease: "sine.inOut", yoyo: true, repeat: 1 }, s07.start + 0.1);
      tl.fromTo("#pl-head", { rotation: 0, svgOrigin: "248 340" }, { rotation: 6, duration: 0.3, ease: "sine.inOut", yoyo: true, repeat: 1 }, w("consenso"));
      tl.fromTo("#pr-head", { rotation: 0, svgOrigin: "832 340" }, { rotation: -6, duration: 0.3, ease: "sine.inOut", yoyo: true, repeat: 1 }, w("do") + 0.05);
    }
    gsap.set("#s07-scrim", { opacity: 0 });
    tl.set("#s07-scrim", { opacity: 1 }, w("casal") - 0.02);
    tl.set("#s07a", { autoAlpha: 0 }, MATCH);
    tl.set("#s07b", { autoAlpha: 1 }, MATCH);
    BT.fadeIn("#s07b-cat", MATCH + 0.06, 0.4);
    BT.word("#s07b-w1", w("escritura") - 0.05);
    BT.word("#s07b-w2", w("pública") - 0.05);

    // ---------------- Cena 08: assistência jurídica (filmagem real)
    const s08 = BT.scene("s08");
    gsap.set("#s08-label", { opacity: 0 });
    BT.word("#s08-w1", w("assistência") - 0.05);
    BT.word("#s08-w2", w("assistência") + 0.2);
    BT.card("#s08-label", s08.start + 0.92);
    if (!R) tl.fromTo("#s08-video", { scale: 1, transformOrigin: "50% 45%" }, { scale: 1.06, duration: s08.end - s08.start, ease: "sine.inOut" }, s08.start);

    // ---------------- Cena 09: a regra do CNJ
    const s09 = BT.scene("s09");
    gsap.set(["#s09-step1", "#s09-step2", "#s09-ref", "#s09-gate"], { opacity: 0 });
    gsap.set(["#s09-node1", "#s09-node2"], { scale: 0 });
    gsap.set("#s09-line", { scaleY: 0, transformOrigin: "50% 0%" });
    BT.fadeIn("#s09-cat", s09.start + 0.02, 0.35);
    const LINE = w("regra") - 0.02;
    BT.TimelineGraphic.animate("s09", { step1: w("essa") - 0.02, line: LINE, lineDur: 0.55, step2: w("prevista") + 0.05, ref: w("cnj") - 0.05 });

    // ---------------- Cena 10: salve esta informação
    const s10 = BT.scene("s10");
    BT.fadeIn("#s10-cat", s10.start + 0.05, 0.4);
    BT.word("#s10-w1", w("salve") - 0.05);
    BT.word("#s10-w2", w("esta") - 0.05);
    BT.word("#s10-w3", w("informação") - 0.05);
    BT.WordHighlight.underline("#s10-w3", w("informação") + 0.3, 0.7);
    if (!R) tl.fromTo("#s10-t", { scale: 1, transformOrigin: "0% 50%" }, { scale: 1.035, duration: s10.end - w("salve"), ease: "sine.inOut" }, w("salve"));

    // ---------------- Cena 11: assinatura
    BT.BTSignature.animate("#s10 .scene-inner", BT.scene("s11").start);

    // ---------------- Bolinha condutora (cenas 09 e 10); não existe no movimento reduzido
    if (R) {
      gsap.set("#dot", { display: "none" });
    } else {
      const dot = BT.BTGuidingDot;
      const n1 = BT.box("#s09-node1");
      const n2 = BT.box("#s09-node2");
      const ref = BT.box("#s09-ref-title");
      dot.start(n1.x, n1.y, s09.start + 0.05);
      dot.move(LINE - 0.3, { x: n1.x, y: n1.y + 30 }, 0.45);
      dot.move(LINE + 0.25, { x: n2.x, y: n2.y - 30 }, 0.5);
      dot.move(w("cnj") + 0.1, dot.beside(ref, 34), 0.5);
      dot.hide(s09.end - 0.35);
      const t3 = BT.box("#s10-w3");
      dot.place(1010, 360, s10.start + 0.08);
      dot.swoop(w("informação") - 0.05, { x: 980, y: 560 }, dot.beside(t3, 52), 0.8);
      dot.hide(28.75);
      dot.trail(s09.start, 29.15);
    }

    BT.BTSubtitle.animate();
    window.BT_register(tl);
  }

  const faces = [
    '800 120px "Fira Sans Condensed"',
    '500 54px "Fira Sans Condensed"',
    '400 46px "Piazzolla"',
    '600 46px "Piazzolla"',
    '500 46px "Funnel Sans"',
    '600 54px "Funnel Sans"',
    '500 32px "IBM Plex Mono"',
  ];
  Promise.all(faces.map((f) => document.fonts.load(f)))
    .then(() => document.fonts.ready)
    .then(build);
})();
