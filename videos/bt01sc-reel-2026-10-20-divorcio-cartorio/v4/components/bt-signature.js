// BTSignature: assinatura final do manual. A cena anterior desfoca 18 px; Navy com duas manchas
// Blue derivando; a logo original entra desfocada e assenta; telefone e Instagram conferidos;
// fio dourado; nota informativa e fonte em texto pequeno. Reduzido: só opacidades, sem desfoque.
(function () {
  const BT = (window.BT = window.BT || {});
  BT.BTSignature = {
    animate(prevInnerSel, t0) {
      const tl = BT.tl;
      if (!BT.R) tl.to(prevInnerSel, { filter: "blur(18px)", duration: 0.5, ease: BT.E.inOut }, t0 - 0.3);
      tl.fromTo("#s11 .scene-inner", { opacity: 0 }, { opacity: 1, duration: BT.BASE, ease: BT.E.inOut, immediateRender: false }, t0 - 0.2);
      if (!BT.R) {
        tl.fromTo("#s11-blob-a", { x: 0, y: 0 }, { x: 220, y: 160, duration: 3.0, ease: "sine.inOut", immediateRender: false }, t0);
        tl.fromTo("#s11-blob-b", { x: 0, y: 0 }, { x: -260, y: -220, duration: 3.0, ease: "sine.inOut", immediateRender: false }, t0);
        tl.fromTo(
          "#s11-logo",
          { opacity: 0, scale: 1.06, filter: "blur(28px)" },
          { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.7, ease: BT.E.inOut, immediateRender: false },
          t0 - 0.05,
        );
      } else {
        BT.fadeIn("#s11-logo", t0 - 0.05);
      }
      BT.card("#s11-tel-label", t0 + 0.32);
      BT.card("#s11-tel", t0 + 0.36);
      BT.card("#s11-ig-label", t0 + 0.52);
      BT.card("#s11-ig", t0 + 0.56);
      BT.ruleIn("#s11-rule", t0 + 0.75, BT.BASE, "50% 50%");
      BT.fadeIn("#s11-note", t0 + 0.85);
      BT.fadeIn("#s11-source", t0 + 0.95);
    },
  };
})();
