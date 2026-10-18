// LegalDocument: folha de papel abstrata em HTML, com barras no lugar do texto.
// Nenhuma frase legível, nenhum brasão, nenhum número de processo: o documento é ilustrativo
// e não pode parecer um documento real de cliente ou uma decisão judicial verdadeira.
(function () {
  const BT = (window.BT = window.BT || {});
  BT.LegalDocument = {
    // opts: { seed, label, heading (HTML), rows, signatures: [rótulo, rótulo], headingSize }
    render(sel, opts) {
      const el = document.querySelector(sel);
      el.classList.add("doc");
      const r = BT.rng(opts.seed || 1);
      let html = "";
      if (opts.label) html += `<div class="doc-label">${opts.label}</div>`;
      if (opts.heading) html += `<div class="doc-heading" style="font-size:${opts.headingSize || 84}px">${opts.heading}</div>`;
      html += '<div class="doc-lines">';
      for (let i = 0; i < (opts.rows || 12); i++) {
        const end = i % 5 === 4;
        const w = end ? 38 + r() * 30 : 88 + r() * 12;
        html += `<i style="width:${w.toFixed(1)}%${end ? ";margin-bottom:30px" : ""}"></i>`;
      }
      html += "</div>";
      if (opts.signatures) {
        html += '<div class="doc-sign">';
        opts.signatures.forEach((s) => (html += `<div><i></i><span>${s}</span></div>`));
        html += "</div>";
      }
      el.innerHTML = html;
    },
  };
})();
