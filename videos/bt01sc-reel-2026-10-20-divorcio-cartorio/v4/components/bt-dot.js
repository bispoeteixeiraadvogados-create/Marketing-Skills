// BTGuidingDot: a bolinha condutora Sky com contorno Navy e rastro de 8 pontos
// (manual, references/bolinha.md). Um movimento de cada vez, sem mola; x e y com curvas
// diferentes desenham arcos. Não existe na versão de movimento reduzido.
(function () {
  const BT = (window.BT = window.BT || {});
  BT.BTGuidingDot = {
    busy: 0,
    start(x, y, t) {
      gsap.set("#dot-b", { xPercent: -50, yPercent: -50, x, y, opacity: 0, scale: 1 });
      BT.tl.to("#dot-b", { opacity: 1, duration: 0.3, ease: BT.E.inOut }, t);
      this.busy = t;
    },
    place(x, y, t) {
      BT.tl.set("#dot-b", { x, y, scale: 1 }, t);
      BT.tl.to("#dot-b", { opacity: 1, duration: 0.25, ease: BT.E.inOut }, t + 0.02);
      this.busy = t + 0.02;
    },
    move(t, p, d) {
      const s0 = Math.max(t, this.busy);
      BT.tl.to("#dot-b", { x: p.x, duration: d, ease: "sine.inOut" }, s0);
      BT.tl.to("#dot-b", { y: p.y, duration: d, ease: "power2.inOut" }, s0);
      this.busy = s0 + d;
    },
    swoop(t, via, p, d) {
      this.move(t, via, d * 0.45);
      this.move(this.busy, p, d * 0.55);
    },
    beside(b, gap) {
      return { x: b.x + b.w / 2 + (gap || 30), y: b.y };
    },
    hide(t) {
      BT.tl.to("#dot-b", { opacity: 0, scale: 0.5, duration: 0.3, ease: BT.E.inOut }, t);
    },
    // rastro: amostra o caminho já montado a 60 fps e desenha 8 bolinhas que seguem com atraso
    trail(from, to) {
      const FPS = 60;
      const xs = [];
      const ys = [];
      const os = [];
      for (let f = Math.floor(from * FPS); f <= Math.ceil(to * FPS); f++) {
        BT.tl.seek(f / FPS, true);
        xs.push(gsap.getProperty("#dot-b", "x"));
        ys.push(gsap.getProperty("#dot-b", "y"));
        os.push(gsap.getProperty("#dot-b", "opacity") * gsap.getProperty("#dot-b", "scale"));
      }
      BT.tl.seek(0, true);
      const f0 = Math.floor(from * FPS);
      const at = (arr, t) => arr[Math.max(0, Math.min(arr.length - 1, Math.round(t * FPS) - f0))];
      const ghosts = [];
      for (let k = 0; k < 8; k++) {
        const el = document.getElementById("g" + k);
        const size = 22 - k * 2;
        gsap.set(el, { width: size, height: size, xPercent: -50, yPercent: -50, opacity: 0 });
        ghosts.push({ el, lag: (k + 1) * 0.03, a: 0.42 - k * 0.045 });
      }
      const clock = { t: from };
      BT.tl.fromTo(
        clock,
        { t: from },
        {
          t: to,
          duration: to - from,
          ease: "none",
          immediateRender: false,
          onUpdate: () => {
            const now = clock.t;
            const cx = at(xs, now);
            const cy = at(ys, now);
            for (const g of ghosts) {
              const tt = now - g.lag;
              const gx = at(xs, tt);
              const gy = at(ys, tt);
              const moving = Math.min(1, Math.hypot(cx - gx, cy - gy) / 24);
              gsap.set(g.el, { x: gx, y: gy, opacity: g.a * moving * at(os, tt) });
            }
          },
        },
        from,
      );
    },
  };
})();
