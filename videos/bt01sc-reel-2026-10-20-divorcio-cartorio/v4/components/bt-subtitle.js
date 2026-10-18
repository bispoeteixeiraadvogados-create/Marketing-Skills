// BTSubtitle: legenda editorial sincronizada palavra a palavra.
// Faixa y 1240 a 1460, coluna x 96, fio de 56 x 4 px acima (Navy no claro, Gold no escuro),
// Fira Sans Condensed 500 54 px; a palavra falada acende em Blue (claro) ou Gold (escuro).
// Os blocos vêm de components/timing.js e nunca atravessam troca de cena.
(function () {
  const BT = (window.BT = window.BT || {});
  BT.BTSubtitle = {
    build(containerSel) {
      const host = document.querySelector(containerSel);
      BT.D.captions.forEach((c, k) => {
        const box = document.createElement("div");
        box.className = "cap " + (c.dark ? "cap-dark" : "cap-light");
        box.id = "cap-" + k;
        const rule = document.createElement("span");
        rule.className = "cap-rule";
        const text = document.createElement("div");
        text.className = "cap-text";
        const lines = {};
        c.words.forEach((w, j) => {
          const span = document.createElement("span");
          span.id = "cw-" + k + "-" + j;
          span.textContent = w.t;
          (lines[w.line] = lines[w.line] || []).push(span);
        });
        Object.keys(lines)
          .sort()
          .forEach((li) => {
            const ln = document.createElement("span");
            ln.className = "ln";
            lines[li].forEach((s, i) => {
              if (i) ln.appendChild(document.createTextNode(" "));
              ln.appendChild(s);
            });
            text.appendChild(ln);
          });
        box.appendChild(rule);
        box.appendChild(text);
        host.appendChild(box);
      });
    },
    animate() {
      const tl = BT.tl;
      BT.D.captions.forEach((c, k) => {
        const on = c.dark ? "#D4AF7C" : "#214D8C";
        const base = c.dark ? "#FAF8F4" : "#202631";
        gsap.set("#cap-" + k, { autoAlpha: 0 });
        tl.set("#cap-" + k, { autoAlpha: 1 }, c.start);
        tl.fromTo("#cap-" + k + " .cap-text", { opacity: 0 }, { opacity: 1, duration: 0.15, ease: "none", immediateRender: false }, c.start);
        tl.set("#cap-" + k, { autoAlpha: 0 }, c.end);
        c.words.forEach((w, j) => {
          const off = j + 1 < c.words.length ? c.words[j + 1].s : c.end;
          tl.set("#cw-" + k + "-" + j, { color: on }, Math.max(c.start, w.s));
          if (off < c.end - 0.01) tl.set("#cw-" + k + "-" + j, { color: base }, off);
        });
      });
    },
  };
})();
