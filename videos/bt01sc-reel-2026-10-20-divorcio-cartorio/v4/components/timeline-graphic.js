// TimelineGraphic: processo em etapas desenhado com a fala (cena 09).
// Etapa 1 e etapa 2 ligadas por uma linha Navy; o rótulo da ligação deixa claro que a segunda
// etapa só vem depois da primeira (a escritura não é automática).
(function () {
  const BT = (window.BT = window.BT || {});
  BT.TimelineGraphic = {
    // schedule: { step1, line, step2, ref } em segundos
    animate(prefix, schedule) {
      const s = schedule;
      BT.card(`#${prefix}-step1`, s.step1);
      BT.tl.fromTo(`#${prefix}-node1`, { scale: 0 }, { scale: 1, duration: 0.3, ease: BT.E.enter, immediateRender: false }, s.step1);
      BT.tl.fromTo(
        `#${prefix}-line`,
        { scaleY: 0, transformOrigin: "50% 0%" },
        { scaleY: 1, duration: s.lineDur, ease: BT.E.inOut, immediateRender: false },
        s.line,
      );
      BT.fadeIn(`#${prefix}-gate`, s.line + 0.15, 0.4);
      BT.tl.fromTo(`#${prefix}-node2`, { scale: 0 }, { scale: 1, duration: 0.3, ease: BT.E.enter, immediateRender: false }, s.line + s.lineDur - 0.08);
      BT.card(`#${prefix}-step2`, s.step2);
      BT.card(`#${prefix}-ref`, s.ref);
      BT.WordHighlight.underline(`#${prefix}-ref-title`, s.ref + 0.25, 0.6);
    },
  };
})();
