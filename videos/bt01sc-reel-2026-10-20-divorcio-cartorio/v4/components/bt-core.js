// BT Motion Editorial 2.0, núcleo compartilhado pelos componentes.
// Curvas, tempos e receitas de movimento vêm do manual "Direção visual BT para vídeos"
// (references/movimento.md). Tudo é determinístico: nada de relógio nem aleatoriedade sem semente.
(function () {
  const BT = (window.BT = window.BT || {});

  BT.setup = function () {
    gsap.registerPlugin(CustomEase);
    BT.E = {
      standard: CustomEase.create("bt-standard", "M0,0 C0.4,0 0.2,1 1,1"),
      enter: CustomEase.create("bt-enter", "M0,0 C0.16,1 0.3,1 1,1"),
      exit: CustomEase.create("bt-exit", "M0,0 C0.4,0 1,1 1,1"),
      emphasized: CustomEase.create("bt-emphasized", "M0,0 C0.22,1 0.36,1 1,1"),
      inOut: CustomEase.create("bt-inout", "M0,0 C0.45,0 0.25,1 1,1"),
      // câmera: acelera rápido e assenta devagar, sem passar do alvo
      camera: CustomEase.create("bt-camera", "M0,0 C0.3,0 0.12,1 1,1"),
    };
    const vars = (window.__hyperframes && window.__hyperframes.getVariables && window.__hyperframes.getVariables()) || {};
    BT.R = vars.reducedMotion === true;
    BT.BASE = 0.55;
    BT.FAST = 0.3;
    BT.SLOW = 0.8;
    BT.TT = BT.R ? 0 : 36;
    BT.TC = BT.R ? 0 : 20;
    BT.root = document.getElementById("root");
    BT.tl = gsap.timeline({ paused: true });
    BT.D = window.BT_DATA;
    // tempo de início de uma palavra do roteiro (n-ésima ocorrência), em segundos
    BT.w = function (token, n) {
      let k = 0;
      for (const w of BT.D.words) {
        if (w.w.toLowerCase().replace(/[.,?!]/g, "") === token.toLowerCase()) {
          if (k === (n || 0)) return w.s;
          k++;
        }
      }
      throw new Error("palavra não encontrada no roteiro: " + token);
    };
    BT.scene = (id) => BT.D.scenes.find((s) => s.id === id);
  };

  // caixa de um elemento em pixels do quadro 1080 x 1920 (centro e tamanho)
  BT.box = function (sel, pad) {
    const r0 = BT.root.getBoundingClientRect();
    const sc = r0.width / 1080;
    const r = document.querySelector(sel).getBoundingClientRect();
    const p = pad || 0;
    return {
      x: (r.left - r0.left) / sc + r.width / sc / 2,
      y: (r.top - r0.top) / sc + r.height / sc / 2,
      w: r.width / sc + p * 2,
      h: r.height / sc + p * 2,
      l: (r.left - r0.left) / sc,
      t: (r.top - r0.top) / sc,
    };
  };

  // gerador pseudoaleatório com semente fixa (LCG), para texturas e larguras de linha
  BT.rng = function (seed) {
    let s = seed >>> 0;
    return function () {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      return s / 4294967296;
    };
  };

  // ---------- receitas de movimento (manual, references/movimento.md)
  // cada entrada fixa o estado inicial já na montagem: o elemento fica escondido até a sua vez
  function enter(sel, from, to, t) {
    gsap.set(sel, from);
    return BT.tl.fromTo(sel, from, Object.assign({ immediateRender: false }, to), t);
  }
  BT.title = (sel, t) => enter(sel, { opacity: 0, y: BT.TT }, { opacity: 1, y: 0, duration: BT.BASE, ease: BT.E.emphasized }, t);
  BT.card = (sel, t) => enter(sel, { opacity: 0, y: BT.TC }, { opacity: 1, y: 0, duration: BT.BASE, ease: BT.E.enter }, t);
  BT.fadeIn = (sel, t, d) => enter(sel, { opacity: 0 }, { opacity: 1, duration: d || BT.BASE, ease: BT.E.inOut }, t);
  BT.fadeOut = (sel, t, d) => BT.tl.to(sel, { opacity: 0, duration: d || BT.FAST, ease: BT.E.exit }, t);
  BT.textOut = (sel, t) => BT.tl.to(sel, { opacity: 0, y: BT.R ? 0 : -16, duration: BT.FAST, ease: BT.E.exit }, t);
  BT.word = (sel, t) => enter(sel, { opacity: 0, y: BT.R ? 0 : 20 }, { opacity: 1, y: 0, duration: 0.4, ease: BT.E.emphasized }, t);
  BT.draw = (sel, t, d) => enter(sel, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: d || BT.BASE, ease: BT.E.inOut }, t);
  BT.ruleIn = (sel, t, d, origin) =>
    enter(sel, { scaleX: 0, transformOrigin: origin || "0% 50%" }, { scaleX: 1, duration: d || BT.SLOW, ease: BT.E.inOut }, t);
  // resposta forte: a palavra chega um pouco maior e assenta, sem mola (reduzido: só opacidade)
  BT.punch = function (sel, t, from) {
    gsap.set(sel, { opacity: 0 });
    BT.tl.set(sel, { opacity: 1 }, t);
    if (!BT.R) {
      BT.tl.fromTo(sel, { scale: from || 1.2 }, { scale: 1, duration: 0.36, ease: "power3.out", immediateRender: false }, t);
    }
  };

  // ---------- SceneLayout: câmera 2.5D de uma cena (um "mundo" com origem 0 0)
  // cam(cx, cy, s): põe o ponto (cx, cy) do mundo no centro do quadro com escala s
  BT.SceneLayout = {
    cam(cx, cy, s, ox, oy) {
      return { x: (ox || 540) - s * cx, y: (oy || 960) - s * cy, scale: s };
    },
    // sequência contígua de enquadramentos: [{t, d, cx, cy, s}], o primeiro é o estado inicial
    camera(worldSel, shots) {
      gsap.set(worldSel, { transformOrigin: "0 0" });
      const first = shots[0];
      const last = shots[shots.length - 1];
      if (BT.R) {
        // movimento reduzido: um enquadramento fixo por trecho, trocado por corte
        // os empurrões lentos de câmera (push) somem: fica o enquadramento anterior
        shots.filter((sh) => !sh.push).forEach((sh) => BT.tl.set(worldSel, BT.SceneLayout.cam(sh.cx, sh.cy, sh.s), sh.t));
        return last;
      }
      BT.tl.set(worldSel, BT.SceneLayout.cam(first.cx, first.cy, first.s), first.t);
      for (let i = 1; i < shots.length; i++) {
        const a = shots[i - 1];
        const b = shots[i];
        if (b.cut) {
          BT.tl.set(worldSel, BT.SceneLayout.cam(b.cx, b.cy, b.s), b.t);
        } else {
          BT.tl.fromTo(
            worldSel,
            BT.SceneLayout.cam(a.cx, a.cy, a.s),
            Object.assign(BT.SceneLayout.cam(b.cx, b.cy, b.s), { duration: b.d, ease: b.ease || BT.E.camera, immediateRender: false }),
            b.t,
          );
        }
      }
      return last;
    },
  };

  // ---------- EditorialTitle: título protagonista palavra a palavra, no ritmo da fala
  BT.EditorialTitle = {
    // words: [[seletor, tempo]]; mode "word" (padrão) ou "title"
    enter(words, mode) {
      words.forEach(([sel, t]) => (mode === "title" ? BT.title(sel, t) : BT.word(sel, t)));
    },
  };

  // ---------- WordHighlight: sublinhado dourado desenhado sob o trecho falado
  BT.WordHighlight = {
    underline(sel, t, d) {
      enter(sel, { backgroundSize: "0% 6px" }, { backgroundSize: "100% 6px", duration: d || BT.BASE, ease: BT.E.inOut }, t);
    },
  };
})();
