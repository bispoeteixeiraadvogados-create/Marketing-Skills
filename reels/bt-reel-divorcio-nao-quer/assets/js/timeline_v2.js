// Linha do tempo GSAP do Reel BT "Seu cônjuge não quer se divorciar", versão v2 (edição de ritmo).
// Todo instante de cena vem da fala real (assets/data/dados_v2.js, gerado de words_v2.json) pela
// função t("palavra", ocorrência). Números soltos aqui são durações de movimento.
// Novidades do v2: câmera global (punch-in, aproximação, chicote vertical), gancho escuro com a
// aliança no primeiro quadro, rótulos com fio nas rachaduras, passos pela metade em "Mais tempo"
// (dicotomia de Zenão), legenda com palavra-chave marcada, vinheta e grão.
(function () {
  gsap.registerPlugin(CustomEase);
  const E = {
    standard: CustomEase.create("bt-standard", "M0,0 C0.4,0 0.2,1 1,1"),
    enter: CustomEase.create("bt-enter", "M0,0 C0.16,1 0.3,1 1,1"),
    exit: CustomEase.create("bt-exit", "M0,0 C0.4,0 1,1 1,1"),
    emphasized: CustomEase.create("bt-emphasized", "M0,0 C0.22,1 0.36,1 1,1"),
    inOut: CustomEase.create("bt-inout", "M0,0 C0.45,0 0.25,1 1,1"),
  };
  const vars = (window.__hyperframes && window.__hyperframes.getVariables && window.__hyperframes.getVariables()) || {};
  const R = vars.reducedMotion === true;
  const BASE = 0.55;
  const FAST = 0.3;
  const SLOW = 0.8;
  const WORD = 0.4;
  const TT = R ? 0 : 36;
  const TC = R ? 0 : 20;
  const root = document.getElementById("root");
  const D = window.BT_DADOS;
  const PAL = D.palavras;
  const CUT = D.cortes;
  const DUR = D.duracao;
  const norm = (s) =>
    s
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
  function idx(txt, k) {
    let n = 0;
    for (let i = 0; i < PAL.length; i++) if (norm(PAL[i].texto) === norm(txt) && ++n === (k || 1)) return i;
    throw new Error("palavra não encontrada: " + txt + " " + k);
  }
  const t = (txt, k) => PAL[idx(txt, k)].ini;
  const tf = (txt, k) => PAL[idx(txt, k)].fim;
  const tw = (i) => PAL[i].ini;

  function box(sel) {
    const r0 = root.getBoundingClientRect();
    const sc = r0.width / 1080;
    const r = document.querySelector(sel).getBoundingClientRect();
    return {
      x: (r.left - r0.left) / sc + r.width / sc / 2,
      y: (r.top - r0.top) / sc + r.height / sc / 2,
      l: (r.left - r0.left) / sc,
      r: (r.right - r0.left) / sc,
      t: (r.top - r0.top) / sc,
      b: (r.bottom - r0.top) / sc,
      w: r.width / sc,
      h: r.height / sc,
    };
  }
  function textBox(sel) {
    const rg = document.createRange();
    rg.selectNodeContents(document.querySelector(sel));
    const r = rg.getBoundingClientRect();
    const r0 = root.getBoundingClientRect();
    const sc = r0.width / 1080;
    return {
      x: (r.left + r.width / 2 - r0.left) / sc,
      y: (r.top + r.height / 2 - r0.top) / sc,
      l: (r.left - r0.left) / sc,
      r: (r.right - r0.left) / sc,
      t: (r.top - r0.top) / sc,
      b: (r.bottom - r0.top) / sc,
    };
  }
  function onPath(sel, f) {
    const el = document.querySelector(sel);
    const svg = el.ownerSVGElement;
    const L = el.getTotalLength();
    const p = el.getPointAtLength(L * f);
    const sb = box("#" + svg.id);
    const vb = svg.viewBox.baseVal;
    return { x: sb.l + ((p.x - vb.x) * sb.w) / vb.width, y: sb.t + ((p.y - vb.y) * sb.h) / vb.height };
  }
  function lastLineEnd(sel) {
    const rg = document.createRange();
    rg.selectNodeContents(document.querySelector(sel));
    const rs = rg.getClientRects();
    const last = rs[rs.length - 1];
    const r0 = root.getBoundingClientRect();
    const sc = r0.width / 1080;
    return { x: (last.right - r0.left) / sc, y: (last.top + last.height / 2 - r0.top) / sc };
  }

  function build(AL) {
    const tl = gsap.timeline({ paused: true });

    // ------------------------------------------------ medidas (layout natural, antes de qualquer tween)
    const P = {
      c1cat: textBox("#s1-cat"),
      c1l: [box("#s1-l1"), box("#s1-l2"), box("#s1-l3"), box("#s1-l4")],
      two: box("#s2-two"),
      fk0: onPath("#fk-stem", 0),
      b1name: box("#b1-name"),
      b2name: box("#b2-name"),
      b1: box("#b1"),
      b2: box("#b2"),
      d1top0: onPath("#d1-top", 0),
      d2left0: onPath("#d2-left", 0),
      d2bar: onPath("#d2-bar", 0.5),
      c3l1: box("#s3-l1"),
      c3nao: box("#c3w6"),
      co1: textBox("#co1-label"),
      co2: textBox("#co2-label"),
      c5l2: box("#s5-l2"),
      it: [box("#it1-name"), box("#it2-name"), box("#it3-name")],
      s6l2: box("#s6-l2"),
      z0: onPath("#s6-line", 0),
      z1: onPath("#s6-line", 1),
      c7l3: box("#s7-l3"),
      c7supEnd: lastLineEnd("#s7-sup"),
      c7m3: box("#s7-m3"),
      logo: box("#s8-logo"),
    };
    // pontos dos traços que a bolinha percorre, medidos aqui (antes da câmera inicial do gancho,
    // que muda a medida da tela); 12 trechos com a curva BT inOut
    const RIDE = {};
    for (const sel of ["#fk-stem", "#fk-up", "#d1-top", "#d1-one", "#d2-left"]) {
      RIDE[sel] = [];
      for (let k = 1; k <= 12; k++) RIDE[sel].push(onPath(sel, E.inOut(k / 12)));
    }

    // ------------------------------------------------ receitas
    function title(sel, at) {
      tl.fromTo(sel, { opacity: 0, y: TT }, { opacity: 1, y: 0, duration: BASE, ease: E.emphasized, immediateRender: false }, at);
    }
    function card(sel, at) {
      tl.fromTo(sel, { opacity: 0, y: TC }, { opacity: 1, y: 0, duration: BASE, ease: E.enter, immediateRender: false }, at);
    }
    function fadeIn(sel, at, d) {
      tl.fromTo(sel, { opacity: 0 }, { opacity: 1, duration: d || BASE, ease: E.inOut, immediateRender: false }, at);
    }
    function word(sel, at) {
      tl.fromTo(sel, { opacity: 0, y: R ? 0 : 36 }, { opacity: 1, y: 0, duration: WORD, ease: E.enter, immediateRender: false }, at);
    }
    // gancho: a palavra cai no lugar, mais rápida e com um leve encolher (tipografia cinética)
    function slam(sel, at) {
      if (R) return fadeIn(sel, at, 0.2);
      tl.fromTo(sel, { opacity: 0, y: 30, scale: 1.16 }, { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: E.enter, immediateRender: false }, at);
    }
    function draw(sel, at, d) {
      if (R) {
        tl.set(sel, { strokeDashoffset: 0, opacity: 0 }, at);
        tl.to(sel, { opacity: 1, duration: 0.3, ease: E.inOut }, at);
      } else {
        tl.fromTo(sel, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: d || BASE, ease: E.inOut, immediateRender: false }, at);
      }
    }
    function rule(sel, at, d) {
      if (R) fadeIn(sel, at, 0.3);
      else tl.fromTo(sel, { opacity: 1, scaleX: 0 }, { opacity: 1, scaleX: 1, duration: d || BASE, ease: E.inOut, immediateRender: false }, at);
    }
    function textOut(sel, at) {
      tl.to(sel, { opacity: 0, y: R ? 0 : -24, duration: FAST, ease: E.exit }, at);
    }
    function dissolveIn(sel, cut) {
      tl.fromTo(sel, { opacity: 0 }, { opacity: 1, duration: BASE, ease: E.inOut, immediateRender: false }, cut - BASE / 2);
    }
    // filtro de desfoque vertical do chicote: sobe e desce em d segundos
    function vblur(targets, at, d, amount) {
      tl.set(targets, { filter: "url(#vblur)" }, at);
      tl.fromTo("#vblur-f", { attr: { stdDeviation: "0 0" } }, { attr: { stdDeviation: "0 " + amount }, duration: d / 2, ease: "power2.in", immediateRender: false }, at);
      tl.to("#vblur-f", { attr: { stdDeviation: "0 0" }, duration: d / 2, ease: "power2.out" }, at + d / 2);
      tl.set(targets, { filter: "none" }, at + d);
    }

    // ------------------------------------------------ câmera global
    // estado {s, x, y}: ponto do layout p vai para p * s + (x, y) na tela. A mesma transformação vai
    // para a .cam de todas as cenas e da bolinha, então a bolinha acompanha o conteúdo sem correção.
    const ID = { s: 1, x: 0, y: 0 };
    const camEv = [];
    let camBusy = 0;
    let camCur = ID;
    function camTo(at, d, st, ease) {
      if (R) return;
      const t0 = Math.max(at, camBusy);
      tl.to(".cam", { scale: st.s, x: st.x, y: st.y, duration: d, ease: ease || E.inOut }, t0);
      camEv.push({ t0, d, from: camCur, to: st, ease: ease || E.inOut });
      camCur = st;
      camBusy = t0 + d;
    }
    function camAt(time) {
      let st = ID;
      for (const ev of camEv) {
        if (time < ev.t0) break;
        if (time >= ev.t0 + ev.d) st = ev.to;
        else {
          const k = ev.ease((time - ev.t0) / ev.d);
          st = { s: ev.from.s + (ev.to.s - ev.from.s) * k, x: ev.from.x + (ev.to.x - ev.from.x) * k, y: ev.from.y + (ev.to.y - ev.from.y) * k };
        }
      }
      return st;
    }
    const scr = (st, p) => ({ x: p.x * st.s + st.x, y: p.y * st.s + st.y });
    // aproximação de k vezes em torno de um ponto do layout, a partir do estado atual
    function punch(st, k, p) {
      const f = scr(st, p);
      return { s: st.s * k, x: (st.x - f.x) * k + f.x, y: (st.y - f.y) * k + f.y };
    }
    // enquadra o ponto c do layout no ponto o da tela, com escala s
    const frame = (s, c, o) => ({ s, x: o.x - c.x * s, y: o.y - c.y * s });
    const O = { x: 540, y: 745 };

    // ------------------------------------------------ estados iniciais
    // aplicados já (gsap.set) e também no tempo 0 da linha do tempo: um set de duração zero no
    // tempo 0 não é desenhado enquanto a agulha está exatamente em 0, e o quadro 0 sairia errado
    const init = (targets, v) => {
      gsap.set(targets, v);
      tl.set(targets, v, 0);
    };
    // quadro 0 do gancho: a câmera começa 7% mais perto e "pousa" (só na versão normal)
    const CAM0 = R ? ID : { s: 1.07, x: 540 * -0.07, y: 760 * -0.07 };
    init(".cam", { transformOrigin: "0 0", x: CAM0.x, y: CAM0.y, scale: CAM0.s });
    init(
      [
        "#s1-title .w",
        "#s2-two",
        "#s2-word",
        "#b1-rule",
        "#b1-num",
        "#b1-name",
        "#b1-sup",
        "#b2-rule",
        "#b2-num",
        "#b2-name",
        "#b2-sup",
        "#d2-label",
        "#s3-cat",
        "#s3-title .w",
        "#s4-cat",
        "#s4-nao",
        "#s4-impede",
        "#co1-label",
        "#co2-label",
        "#s5-cat",
        "#s5-l1",
        "#s5-l2",
        "#it1 .item-num",
        "#it1 .item-name",
        "#it2 .item-num",
        "#it2 .item-name",
        "#it3 .item-num",
        "#it3 .item-name",
        "#it1 .item-rule",
        "#it2 .item-rule",
        "#it3 .item-rule",
        "#s6-cat",
        "#s6-l1",
        "#s6-l2",
        "#lb-ped",
        "#lb-dec",
        "#s6-tick-a",
        "#s6-tick-b",
        ".zt",
        "#s7-cat",
        "#s7-l1",
        "#s7-l2",
        "#s7-l3",
        "#s7-sup",
        "#s7-cat2",
        "#s7-m1",
        "#s7-m2",
        "#s7-m3",
        "#s7-sup2",
        "#s8-logo",
        "#s8-tel-label",
        "#s8-tel",
        "#s8-ig-label",
        "#s8-ig",
        "#s8-rule",
        "#s8-note",
        "#s8-source",
      ],
      { opacity: 0 },
    );
    if (!R) init("#s6-inner", { y: 1920 });

    // ================================================ C1 Gancho (escuro, aliança no quadro 0)
    // quadro 0: categoria, aliança e a primeira rachadura com impacto sonoro; a câmera "pousa"
    if (!R) {
      camCur = CAM0;
      camEv.push({ t0: -1, d: 0, from: CAM0, to: CAM0, ease: E.enter });
      camTo(0, 0.45, ID, E.enter);
    }
    for (let i = 0; i <= 7; i++) slam("#c1w" + i, Math.max(0, tw(i) - 0.06));
    camTo(t("agora") - 0.05, 0.3, punch(ID, 1.06, { x: P.c1l[3].x, y: P.c1l[3].y }), E.emphasized);

    // ================================================ C2 Os dois caminhos (corte seco)
    const C12 = CUT.c12;
    if (!R) {
      tl.set(".cam", { scale: 1, x: 0, y: 0 }, C12);
      camEv.push({ t0: C12, d: 0, from: ID, to: ID, ease: E.inOut });
      camCur = ID;
      camBusy = C12;
      tl.fromTo("#s2-two", { opacity: 1, scale: 1.12, transformOrigin: "30% 60%" }, { opacity: 1, scale: 1, duration: 0.4, ease: E.enter, immediateRender: false }, C12);
    } else fadeIn("#s2-two", C12, 0.2);
    tl.set("#s2-cat", { opacity: 1 }, C12);
    title("#s2-word", t("caminhos") - 0.08);
    draw("#fk-stem", t("dois", 1), 0.3);
    draw("#fk-up", t("caminhos"), 0.45);
    draw("#fk-dn", t("caminhos"), 0.45);
    // Ken Burns lento sobre o número
    camTo(C12 + 0.02, CUT.b1 - C12 - 0.04, punch(ID, 1.04, { x: P.two.x, y: P.two.y }), E.standard);
    // aproximação do bloco 1 enquanto o número sai
    // sai rápido e sobe mais, para não cruzar com o bloco 1 que entra
    tl.to(["#s2-two", "#s2-word", "#s2-fork"], { opacity: 0, y: R ? 0 : -60, duration: 0.22, ease: E.exit }, CUT.b1 - 0.2);
    const camB1 = frame(1.15, { x: 490, y: P.b1.t + 171 }, O);
    camTo(CUT.b1, 0.5, camB1, E.inOut);
    const tB1 = t("no", 1) - 0.05;
    rule("#b1-rule", tB1 - 0.1);
    card("#b1-num", tB1);
    title("#b1-name", tB1);
    const tConc = t("os", 1);
    card("#b1-sup", tConc - 0.05);
    draw("#d1-top", tConc, 0.7);
    draw("#d1-bot", tConc, 0.7);
    draw("#d1-one", t("concordam"), BASE);
    // chicote vertical para o bloco 2
    const camB2 = frame(1.15, { x: 490, y: P.b2.t + 171 }, O);
    camTo(CUT.b2, 0.36, camB2, E.inOut);
    if (!R) vblur("#s2-inner", CUT.b2, 0.36, 16);
    // o bloco 1 fica de contexto, apagado, enquanto a câmera está no bloco 2 (e não disputa leitura
    // na faixa de cima, que a interface do Instagram cobre)
    tl.to("#b1", { opacity: 0.18, duration: 0.3, ease: E.inOut }, CUT.b2);
    tl.to("#s2-cat", { opacity: 0, duration: 0.15, ease: E.inOut }, CUT.b2);
    const tB2 = t("no", 2) - 0.05;
    rule("#b2-rule", tB2 - 0.1);
    card("#b2-num", tB2);
    title("#b2-name", tB2);
    card("#b2-sup", t("não", 2) - 0.05);
    const tQuem = t("quem");
    draw("#d2-left", tQuem, BASE);
    draw("#d2-right", tQuem, BASE);
    draw("#d2-bar", t("juiz") - 0.05, 0.35);
    fadeIn("#d2-label", t("juiz"), 0.3);
    camTo(t("juiz") - 0.02, 0.25, punch(camB2, 1.04, P.d2bar), E.emphasized);
    // saída e silêncio antes da pergunta
    textOut(["#s2-cat", "#b1", "#b2"], CUT.c23);
    camTo(CUT.c23, 0.4, ID, E.inOut);

    // ================================================ C3 A pergunta
    card("#s3-cat", t("mas") - 0.1);
    const i0c3 = idx("mas");
    for (let k = 0; k < 7; k++) word("#c3w" + k, tw(i0c3 + k));
    const tNao3 = t("não", 3);
    camTo(tNao3 - 0.04, 0.28, punch(ID, 1.07, { x: P.c3nao.x, y: P.c3nao.y }), E.emphasized);

    // ================================================ Revelação circular C3 para C4 (0,62 s)
    const REV = CUT.c34;
    const nao = { x: P.c3nao.r + 30, y: P.c3nao.y };
    const naoScr = scr(camAt(REV), nao);
    if (R) {
      dissolveIn("#s4-inner", REV + BASE / 2);
    } else {
      tl.fromTo(
        "#s4-inner",
        { clipPath: "circle(0px at " + naoScr.x.toFixed(1) + "px " + naoScr.y.toFixed(1) + "px)" },
        { clipPath: "circle(2300px at " + naoScr.x.toFixed(1) + "px " + naoScr.y.toFixed(1) + "px)", duration: 0.62, ease: E.inOut, immediateRender: false },
        REV,
      );
      tl.set("#s4-inner", { clipPath: "none" }, REV + 0.64);
    }
    camTo(REV + 0.1, Math.max(0.3, AL.T_R1 - REV - 0.1), ID, E.inOut);

    // ================================================ C4 A regra e a aliança
    card("#s4-cat", REV + 0.28);
    const rc = AL.ringCenter;
    // punch-in em degraus a cada rachadura, em torno do centro da aliança
    let camR = ID;
    camR = punch(camR, 1.025, rc);
    camTo(AL.T_R1, 0.3, camR, E.emphasized);
    camR = punch(camR, 1.025, rc);
    camTo(AL.T_R2, 0.3, camR, E.emphasized);
    camR = punch(camR, 1.02, rc);
    camTo(AL.T_R3, 0.25, camR, E.emphasized);
    camTo(AL.T0 + 0.05, 0.6, ID, E.inOut);
    // rótulos com fio: nascem da rachadura e vão até o rótulo, com a fala
    {
      const A1 = { x: P.co1.l - 14, y: P.co1.y };
      const A2 = { x: P.co2.r + 14, y: P.co2.y };
      const t1 = AL.T_R1;
      const t2 = AL.T_R2;
      const tOff = AL.T_R3 - 0.05;
      const FPS = 60;
      const ta = t1 - 0.1;
      const tb = tOff + 0.35;
      const p1 = [];
      const p2 = [];
      for (let f = 0; f <= (tb - ta) * FPS + 1; f++) {
        p1.push(AL.crackScreen(ta + f / FPS, 1));
        p2.push(AL.crackScreen(ta + f / FPS, 2));
      }
      const at = (arr, tt) => arr[Math.max(0, Math.min(arr.length - 1, Math.round((tt - ta) * FPS)))];
      const grow = (tt, t0) => (R ? (tt >= t0 ? 1 : 0) : E.inOut(Math.min(1, Math.max(0, (tt - t0) / 0.32))));
      const clock = { t: ta };
      tl.fromTo(
        clock,
        { t: ta },
        {
          t: tb,
          duration: tb - ta,
          ease: "none",
          immediateRender: false,
          onUpdate: () => {
            const now = clock.t;
            for (const [k, pts, A, t0] of [
              [1, p1, A1, t1],
              [2, p2, A2, t2],
            ]) {
              const p = at(pts, now);
              const g = grow(now, t0);
              gsap.set("#co" + k + "-line", { attr: { x1: p.x, y1: p.y, x2: p.x + (A.x - p.x) * g, y2: p.y + (A.y - p.y) * g } });
              gsap.set("#co" + k + "-pt", { attr: { cx: p.x, cy: p.y } });
            }
          },
        },
        ta,
      );
      for (const [k, t0] of [
        [1, t1],
        [2, t2],
      ]) {
        tl.fromTo(["#co" + k + "-line", "#co" + k + "-pt"], { opacity: 0 }, { opacity: 1, duration: 0.15, ease: "none", immediateRender: false }, t0);
        card("#co" + k + "-label", t0 + 0.12);
        tl.to(["#co" + k + "-line", "#co" + k + "-pt", "#co" + k + "-label"], { opacity: 0, duration: 0.25, ease: E.inOut }, tOff);
      }
    }
    word("#s4-nao", t("não", 4));
    word("#s4-impede", t("impede"));
    if (R) tl.to(["#s4-cat", "#s4-nao", "#s4-impede"], { opacity: 0, duration: 0.25, ease: E.inOut }, AL.T_A);

    // ================================================ C5 O que vem junto (chão Paper)
    card("#s5-cat", AL.TILT1 - 0.05);
    title("#s5-l1", tw(idx("vem") - 2));
    title("#s5-l2", t("junto") - 0.05);
    const tI = [tw(idx("guarda") - 1), tw(idx("pensão") - 1), tw(idx("divisão") - 1)];
    tI.forEach((ti, k) => {
      rule("#it" + (k + 1) + " .item-rule", ti - 0.08, 0.4);
      card("#it" + (k + 1) + " .item-num", ti);
      card("#it" + (k + 1) + " .item-name", ti + 0.04);
    });
    // aproximação lenta durante a lista
    const W0 = CUT.c56 - 0.2;
    camTo(AL.TILT1 + 0.05, W0 - 0.02 - AL.TILT1 - 0.05, punch(ID, 1.035, { x: 500, y: 820 }), E.standard);

    // ================================================ chicote vertical C5 para C6
    if (R) {
      dissolveIn("#s6-inner", CUT.c56);
    } else {
      tl.to(["#s4-inner", "#s5-inner"], { y: -1920, duration: 0.42, ease: E.inOut }, W0);
      tl.fromTo("#s6-inner", { y: 1920 }, { y: 0, duration: 0.42, ease: E.inOut, immediateRender: false }, W0);
      vblur(["#s4-inner", "#s5-inner", "#s6-inner"], W0, 0.42, 26);
    }
    camTo(W0, 0.42, ID, E.inOut);

    // ================================================ C6 Mais tempo: passos pela metade até a decisão
    card("#s6-cat", CUT.c56 + 0.15);
    const tE6 = tw(idx("quando") - 1);
    fadeIn(["#lb-ped", "#s6-tick-a"], tE6, 0.3);
    draw("#s6-line", tE6 + 0.1, 0.6);
    fadeIn(["#lb-dec", "#s6-tick-b"], tE6 + 0.55, 0.3);
    title("#s6-l1", t("pode", 2) - 0.05);
    title("#s6-l2", t("mais") - 0.05);
    tl.fromTo("#s6-hl", { backgroundSize: "0% 5px" }, { backgroundSize: "100% 5px", duration: R ? 0.01 : SLOW, ease: E.inOut, immediateRender: false }, t("mais") + 0.12);
    const HOPS = [
      [t("processo"), 0.3],
      [t("pode", 2), 0.22],
      [t("levar"), 0.22],
      [t("mais"), 0.22],
      [t("tempo"), 0.2],
      [t("tempo") + 0.24, 0.2],
    ];
    HOPS.slice(0, 5).forEach(([h0, hd], k) => fadeIn("#zt" + (k + 1), h0 + hd - 0.02, 0.12));
    camTo(t("mais") - 0.05, 0.3, punch(ID, 1.05, { x: P.s6l2.x, y: P.s6l2.y }), E.emphasized);
    camTo(CUT.c67 - 0.3, 0.6, ID, E.inOut);
    dissolveIn("#s7-inner", CUT.c67);

    // ================================================ C7 Cada caso e o chamado (gradiente)
    card("#s7-cat", CUT.c67 + 0.15);
    title("#s7-l1", t("cada", 1) - 0.05);
    title("#s7-l2", t("tem") - 0.05);
    title("#s7-l3", t("realidade") - 0.05);
    camTo(t("realidade") - 0.05, 0.3, punch(ID, 1.05, { x: P.c7l3.x, y: P.c7l3.y }), E.emphasized);
    card("#s7-sup", tw(idx("orientação") - 1) - 0.05);
    // as duas palavras-chave do apoio ficam douradas quando são faladas
    tl.fromTo("#s7-k1", { color: "rgba(250, 248, 244, 0.88)" }, { color: "#D4AF7C", duration: 0.2, ease: "none", immediateRender: false }, t("documentos"));
    tl.fromTo("#s7-k2", { color: "rgba(250, 248, 244, 0.88)" }, { color: "#D4AF7C", duration: 0.2, ease: "none", immediateRender: false }, t("situação"));
    const P7 = CUT.p7;
    textOut(["#s7-cat", "#s7-title", "#s7-sup"], P7);
    camTo(P7, 0.35, ID, E.inOut);
    card("#s7-cat2", P7 + 0.2);
    title("#s7-m1", t("converse") - 0.05);
    title("#s7-m2", tw(idx("converse") + 1) - 0.05);
    title("#s7-m3", t("advogado") - 0.05);
    card("#s7-sup2", t("antes") - 0.05);
    camTo(t("advogado") - 0.03, 0.3, punch(ID, 1.06, { x: P.c7m3.x, y: P.c7m3.y }), E.emphasized);

    // ================================================ C8 Assinatura (Navy liso)
    const B8 = CUT.c78;
    camTo(B8, 0.5, ID, E.inOut);
    if (R) {
      dissolveIn("#s8-inner", B8 + 0.25);
    } else {
      tl.to("#s7-inner", { filter: "blur(18px)", duration: 0.5, ease: E.inOut }, B8);
      dissolveIn("#s8-inner", B8 + 0.25);
      tl.fromTo("#s8-blob-a", { x: 0, y: 0 }, { x: 200, y: 140, duration: DUR - B8, ease: "sine.inOut", immediateRender: false }, B8 + 0.1);
      tl.fromTo("#s8-blob-b", { x: 0, y: 0 }, { x: -240, y: -200, duration: DUR - B8, ease: "sine.inOut", immediateRender: false }, B8 + 0.1);
    }
    if (R) fadeIn("#s8-logo", B8 + 0.3, 0.6);
    else
      tl.fromTo(
        "#s8-logo",
        { opacity: 0, scale: 1.06, filter: "blur(28px)" },
        { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.8, ease: E.inOut, immediateRender: false },
        B8 + 0.3,
      );
    card("#s8-tel-label", B8 + 0.75);
    card("#s8-tel", B8 + 0.8);
    card("#s8-ig-label", B8 + 1.0);
    card("#s8-ig", B8 + 1.05);
    rule("#s8-rule", B8 + 1.3);
    card("#s8-note", B8 + 1.45);
    card("#s8-source", B8 + 1.6);

    // ================================================ legenda: palavra falada acende, palavra-chave fica marcada
    D.legendas.forEach((b, k) => {
      const on = b.escuro ? "#D4AF7C" : "#214D8C";
      const base = b.escuro ? "#FAF8F4" : "#202631";
      const mk = b.escuro ? ["0% 4px", "100% 4px"] : ["0% 42%", "100% 42%"];
      tl.fromTo("#ct-" + k, { opacity: 0, y: R ? 0 : 12 }, { opacity: 1, y: 0, duration: 0.18, ease: E.enter, immediateRender: false }, b.ini);
      if (!R) tl.fromTo("#cap-" + k + " .cap-rule", { scaleX: 0 }, { scaleX: 1, duration: 0.25, ease: E.enter, immediateRender: false }, b.ini);
      const ids = b.linhas.flat();
      ids.forEach((j, n) => {
        const key = b.chaves.indexOf(j) >= 0;
        const off = n + 1 < ids.length ? tw(ids[n + 1]) : b.fim;
        tl.set("#cw-" + j, { color: on }, tw(j));
        if (!R) {
          tl.to("#cw-" + j, { y: -6, duration: 0.08, ease: "power1.out" }, tw(j));
          tl.to("#cw-" + j, { y: 0, duration: 0.16, ease: "power1.inOut" }, tw(j) + 0.08);
        }
        if (key) tl.fromTo("#cw-" + j, { backgroundSize: mk[0] }, { backgroundSize: mk[1], duration: R ? 0.01 : 0.22, ease: E.inOut, immediateRender: false }, tw(j) + 0.02);
        else if (off < b.fim - 0.01) tl.set("#cw-" + j, { color: base }, off);
      });
    });

    // ================================================ vinheta (cenas escuras) e grão
    const vig = (a, b, v) => tl.to("#vignette", { opacity: v, duration: b, ease: "none" }, a);
    init("#vignette", { opacity: 1 });
    tl.set("#vignette", { opacity: 0 }, C12);
    vig(REV, 0.6, 1);
    vig(AL.T_A, 0.6, 0);
    vig(CUT.c67 - 0.275, BASE, 1);
    if (!R) {
      init("#grain", { opacity: 0.075 });
      const g = { t: 0 };
      tl.fromTo(
        g,
        { t: 0 },
        {
          t: DUR,
          duration: DUR,
          ease: "none",
          immediateRender: false,
          onUpdate: () => {
            const fr = Math.floor(g.t * 30 + 1e-6);
            let s = (fr * 2654435761) % 4294967296;
            s = (s * 1664525 + 1013904223) % 4294967296;
            const ox = s % 2048;
            s = (s * 1664525 + 1013904223) % 4294967296;
            const oy = s % 512;
            gsap.set("#grain", { backgroundPosition: -ox + "px " + -oy + "px" });
          },
        },
        0,
      );
    }

    // ================================================ bolinha condutora (só na versão normal)
    if (!R) {
      let busy = 0;
      const move = (at, p, d) => {
        const s0 = Math.max(at, busy);
        tl.to("#dot-b", { x: p.x, duration: d, ease: "sine.inOut" }, s0);
        tl.to("#dot-b", { y: p.y, duration: d, ease: "power2.inOut" }, s0);
        busy = s0 + d;
      };
      const ride = (at, sel, d) => {
        const s0 = Math.max(at, busy);
        const pts = RIDE[sel];
        const N = pts.length;
        pts.forEach((p, k) => tl.to("#dot-b", { x: p.x, y: p.y, duration: d / N, ease: "none" }, s0 + (d * k) / N));
        busy = s0 + d;
      };
      const swoop = (at, via, p, d) => {
        move(at, via, d * 0.45);
        move(busy, p, d * 0.55);
      };
      // pulo em arco sobre a linha do processo (um movimento por vez, sem mola)
      const hop = (at, p, d, h) => {
        const s0 = Math.max(at, busy);
        tl.to("#dot-b", { x: p.x, duration: d, ease: "sine.inOut" }, s0);
        tl.to("#dot-b", { y: p.y - h, duration: d * 0.5, ease: "power2.out" }, s0);
        tl.to("#dot-b", { y: p.y, duration: d * 0.5, ease: "power2.in" }, s0 + d * 0.5);
        busy = s0 + d;
      };
      const beside = (b, gap) => ({ x: b.r + (gap || 30) + 15, y: b.y });
      // C1: nasce ao lado da categoria no quadro 0 e acompanha cada linha falada
      const cat = { x: P.c1cat.r + 45, y: P.c1cat.y };
      init("#dot-b", { xPercent: -50, yPercent: -50, x: cat.x, y: cat.y, opacity: 1, scale: 1 });
      move(tw(1) + 0.06, beside(P.c1l[0]), 0.4);
      move(tw(4) + 0.04, beside(P.c1l[1]), 0.4);
      move(tw(5) + 0.2, beside(P.c1l[2]), 0.4);
      move(tw(7) + 0.04, beside(P.c1l[3]), 0.4);
      // C2: vai ao tronco da bifurcação e sobe pelo caminho de cima; depois os dois blocos
      move(C12, P.fk0, 0.45);
      ride(t("dois", 1), "#fk-stem", 0.3);
      ride(t("caminhos"), "#fk-up", 0.45);
      move(CUT.b1, beside(P.b1name), 0.5);
      move(tConc - 0.55, P.d1top0, 0.45);
      ride(tConc, "#d1-top", 0.7);
      ride(t("concordam"), "#d1-one", BASE);
      swoop(CUT.b2, { x: 960, y: (P.b1name.y + P.b2name.y) / 2 }, beside(P.b2name), 0.6);
      move(tQuem - 0.5, P.d2left0, 0.4);
      ride(tQuem, "#d2-left", BASE);
      move(t("juiz") - 0.05, { x: P.d2bar.x, y: P.d2bar.y }, 0.35);
      // C3: termina ao lado de "não" e espera ali
      swoop(CUT.c23 + 0.02, { x: 980, y: 700 }, beside(P.c3l1), 0.8);
      move(Math.min(tNao3 - 0.06, REV - 0.42), nao, 0.4);
      // atravessa o corte em arco, entra no centro da aliança e some
      swoop(REV + 0.02, { x: (nao.x + rc.x) / 2 + 150, y: (nao.y + rc.y) / 2 + 80 }, rc, 0.5);
      tl.to("#dot-b", { scale: 0, opacity: 0, duration: 0.18, ease: E.inOut }, busy);
      // C5: renasce no vão de uma das metades e vai para o título e a lista
      const g2 = AL.gap;
      tl.set("#dot-b", { x: g2.x, y: g2.y, scale: 1 }, AL.TILT1);
      tl.to("#dot-b", { opacity: 1, duration: 0.3, ease: E.inOut }, AL.TILT1 + 0.02);
      busy = AL.TILT1 + 0.32;
      move(Math.max(busy, t("junto") - 0.05), beside(P.c5l2), 0.8);
      move(tI[0] + 0.05, beside(P.it[0]), 0.45);
      move(tI[1] + 0.05, beside(P.it[1]), 0.45);
      move(tI[2] + 0.05, beside(P.it[2]), 0.45);
      // C6: atravessa o chicote até o "PEDIDO" e anda sempre metade do que falta
      swoop(W0, { x: 140, y: 1150 }, P.z0, 0.8);
      const L6 = P.z1.x - P.z0.x;
      const FR = [0.5, 0.75, 0.875, 0.9375, 0.96875, 1];
      const HH = [64, 44, 30, 20, 14, 12];
      HOPS.forEach(([h0, hd], k) => hop(h0, { x: P.z0.x + L6 * FR[k], y: P.z0.y }, hd, HH[k]));
      // C7: "realidade", fim do apoio, "advogado"; arco amplo entre as partes
      swoop(CUT.c67 + 0.05, { x: 980, y: 600 }, beside(P.c7l3), 1.0);
      move(t("pessoa") - 0.3, { x: P.c7supEnd.x + 45, y: P.c7supEnd.y }, 0.5);
      swoop(t("pessoa") + 0.25, { x: 980, y: 380 }, beside(P.c7m3), 1.3);
      // C8: atravessa o corte e se apaga no centro da logo
      move(B8 + 0.05, { x: P.logo.x, y: P.logo.y }, 0.6);
      tl.to("#dot-b", { scale: 0.4, opacity: 0, duration: 0.3, ease: E.inOut }, busy - 0.05);

      // rastro: amostra o caminho montado e desenha 8 bolinhas que seguem com atraso
      const dotEl = document.getElementById("dot");
      const dur = parseFloat(dotEl.getAttribute("data-start")) + parseFloat(dotEl.getAttribute("data-duration"));
      const FPS = 60;
      const xs = [];
      const ys = [];
      const os = [];
      for (let f = 0; f <= dur * FPS; f++) {
        tl.seek(f / FPS, true);
        xs.push(gsap.getProperty("#dot-b", "x"));
        ys.push(gsap.getProperty("#dot-b", "y"));
        os.push(gsap.getProperty("#dot-b", "opacity") * gsap.getProperty("#dot-b", "scale"));
      }
      tl.seek(0, true);
      const at = (arr, tt) => arr[Math.max(0, Math.min(arr.length - 1, Math.round(tt * FPS)))];
      const ghosts = [];
      for (let k = 0; k < 8; k++) {
        const el = document.getElementById("g" + k);
        const size = 22 - k * 2;
        gsap.set(el, { width: size, height: size, xPercent: -50, yPercent: -50 });
        ghosts.push({ el, lag: (k + 1) * 0.03, a: 0.42 - k * 0.045 });
      }
      const clock = { t: 0 };
      tl.fromTo(
        clock,
        { t: 0 },
        {
          t: dur,
          duration: dur,
          ease: "none",
          onUpdate: () => {
            const now = clock.t;
            const cx = at(xs, now);
            const cy = at(ys, now);
            for (const gh of ghosts) {
              const tt = now - gh.lag;
              const gx = at(xs, tt);
              const gy = at(ys, tt);
              const moving = Math.min(1, Math.hypot(cx - gx, cy - gy) / 24);
              gsap.set(gh.el, { x: gx, y: gy, opacity: gh.a * moving * at(os, tt) });
            }
          },
        },
        0,
      );
      window.__BT_DOT = { xs, ys, os, FPS };
    }
    window.__BT_CAM = { camAt, events: camEv.map((e) => ({ t0: e.t0, d: e.d, to: e.to })) };
    window.__timelines["main"] = tl;
  }

  const faces = [
    '800 120px "Fira Sans Condensed"',
    '500 54px "Fira Sans Condensed"',
    '400 44px "Piazzolla"',
    '600 44px "Piazzolla"',
    '500 46px "Funnel Sans"',
    '600 46px "Funnel Sans"',
    '500 30px "IBM Plex Mono"',
  ];
  Promise.all([Promise.all(faces.map((f) => document.fonts.load(f))).then(() => document.fonts.ready), window.__ALIANCA_PROMISE]).then(
    ([, info]) => build(info),
  );
})();
