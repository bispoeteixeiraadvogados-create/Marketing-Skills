// Linha do tempo GSAP do Reel BT "Seu cônjuge não quer se divorciar".
// Todo instante de cena vem da fala real (assets/data/dados.js, gerado de words.json) pela
// função t("palavra", ocorrência). Números soltos aqui são só durações de movimento.
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
  const norm = (s) =>
    s
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
  // índice da k-ésima ocorrência de uma palavra na fala
  function idx(txt, k) {
    let n = 0;
    for (let i = 0; i < PAL.length; i++) if (norm(PAL[i].texto) === norm(txt) && ++n === (k || 1)) return i;
    throw new Error("palavra não encontrada: " + txt + " " + k);
  }
  // início da palavra falada (função de apoio pedida no prompt)
  const t = (txt, k) => PAL[idx(txt, k)].ini;
  const tf = (txt, k) => PAL[idx(txt, k)].fim;
  const tw = (i) => PAL[i].ini;
  const CUT = D.cortes;

  function box(sel, pad) {
    const r0 = root.getBoundingClientRect();
    const sc = r0.width / 1080;
    const r = document.querySelector(sel).getBoundingClientRect();
    const p = pad || 0;
    return {
      x: (r.left - r0.left) / sc + r.width / sc / 2,
      y: (r.top - r0.top) / sc + r.height / sc / 2,
      l: (r.left - r0.left) / sc,
      r: (r.right - r0.left) / sc,
      t: (r.top - r0.top) / sc,
      b: (r.bottom - r0.top) / sc,
      w: r.width / sc + p * 2,
      h: r.height / sc + p * 2,
    };
  }
  // caixa só do texto (não da coluna inteira)
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
      w: r.width / sc,
      h: r.height / sc,
    };
  }
  // ponto ao longo de um path SVG, em pixels do quadro
  function onPath(sel, f) {
    const el = document.querySelector(sel);
    const svg = el.ownerSVGElement;
    const L = el.getTotalLength();
    const p = el.getPointAtLength(L * f);
    const sb = box("#" + svg.id);
    const vb = svg.viewBox.baseVal;
    return { x: sb.l + ((p.x - vb.x) * sb.w) / vb.width, y: sb.t + ((p.y - vb.y) * sb.h) / vb.height };
  }

  function build(AL) {
    const tl = gsap.timeline({ paused: true });
    const RAW = tl;

    // ------------------------------------------------ desenhos que dependem da largura real do texto
    {
      const s1 = box("#b1-sup");
      const d1 = document.getElementById("b1-draw");
      d1.style.left = (s1.r - 96 + 40).toFixed(1) + "px";
      const s2 = box("#b2-sup");
      const left2 = s2.r - 96 + 36;
      const w2 = Math.max(170, 808 - left2);
      const d2 = document.getElementById("b2-draw");
      d2.style.left = left2.toFixed(1) + "px";
      d2.setAttribute("width", w2.toFixed(1));
      d2.setAttribute("viewBox", "0 0 " + w2.toFixed(1) + " 60");
      const mid = w2 * 0.46;
      const gap = 34;
      document.getElementById("d2-left").setAttribute("d", "M0 30 H " + (mid - gap).toFixed(1));
      document.getElementById("d2-right").setAttribute("d", "M" + w2.toFixed(1) + " 30 H " + (mid + gap).toFixed(1));
      document.getElementById("d2-bar").setAttribute("d", "M" + mid.toFixed(1) + " 6 V 54");
      const lab = document.getElementById("d2-label");
      lab.setAttribute("x", (mid + 12).toFixed(1));
      lab.setAttribute("y", "-6");
    }

    // ------------------------------------------------ medidas antes de qualquer tween
    const P = {
      c1cat: textBox("#s1-cat"),
      c1l: [box("#s1-l1"), box("#s1-l2"), box("#s1-l3"), box("#s1-l4")],
      c2cat: textBox("#s2-cat"),
      b1name: box("#b1-name"),
      b2name: box("#b2-name"),
      d1top0: onPath("#d1-top", 0),
      d1merge: onPath("#d1-top", 1),
      d2left0: onPath("#d2-left", 0),
      d2left1: onPath("#d2-left", 1),
      d2bar: onPath("#d2-bar", 0.5),
      c3l1: box("#s3-l1"),
      c3nao: box("#c3w6"),
      c5l2: box("#s5-l2"),
      it: [box("#it1-name"), box("#it2-name"), box("#it3-name")],
      s6a0: onPath("#s6-a", 0),
      s6a1: onPath("#s6-a", 1),
      s6b1: onPath("#s6-b", 1),
      c7l3: box("#s7-l3"),
      c7sup: box("#s7-sup"),
      c7m3: box("#s7-m3"),
      logo: box("#s8-logo"),
    };
    // fim da última linha do apoio de C7
    {
      const el = document.getElementById("s7-sup");
      const rg = document.createRange();
      rg.selectNodeContents(el);
      const rs = rg.getClientRects();
      const last = rs[rs.length - 1];
      const r0 = root.getBoundingClientRect();
      const sc = r0.width / 1080;
      P.c7supEnd = { x: (last.right - r0.left) / sc, y: (last.top + last.height / 2 - r0.top) / sc };
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
    function draw(sel, at, d) {
      if (R) {
        tl.set(sel, { strokeDashoffset: 0, opacity: 0 }, at);
        tl.to(sel, { opacity: 1, duration: 0.3, ease: E.inOut }, at);
      } else {
        tl.fromTo(sel, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: d || BASE, ease: E.inOut, immediateRender: false }, at);
      }
    }
    function textOut(sel, at) {
      tl.to(sel, { opacity: 0, y: R ? 0 : -16, duration: FAST, ease: E.exit }, at);
    }
    function dissolveIn(sel, cut) {
      tl.fromTo(sel, { opacity: 0 }, { opacity: 1, duration: BASE, ease: E.inOut, immediateRender: false }, cut - BASE / 2);
    }
    // estados iniciais: tudo que entra com a fala começa invisível
    tl.set(
      [
        "#s1-title .w",
        "#s2-cat",
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
        "#s5-cat",
        "#s5-l1",
        "#s5-l2",
        "#it1",
        "#it2",
        "#it3",
        "#s6-cat",
        "#s6-l1",
        "#s6-l2",
        "#lb-ped",
        "#lb-dec",
        "#s6-tick-a",
        "#s6-tick-b",
        "#s7-cat",
        "#s7-l1",
        "#s7-l2",
        "#s7-l3",
        "#s7-sup",
        "#s7-cat2",
        "#s7-m1",
        "#s7-m2",
        "#s7-m3",
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
      0,
    );

    // ================================================ C1 Gancho (Paper)
    // categoria já está no primeiro quadro; o título entra palavra a palavra com a fala
    for (let i = 0; i <= 7; i++) word("#c1w" + i, tw(i));
    const out1 = Math.max(tf("agora") + 0.35, CUT.c12 - 0.3);
    textOut(["#s1-cat", "#s1-title"], out1);
    dissolveIn("#s2-inner", CUT.c12);

    // ================================================ C2 Os dois caminhos (Sand)
    card("#s2-cat", t("existem") - 0.05);
    // bloco 1: título com "No divórcio consensual", apoio e desenho com "os dois concordam"
    const tB1 = t("no", 1) - 0.05;
    if (R) fadeIn("#b1-rule", tB1 - 0.1, 0.3);
    else tl.fromTo("#b1-rule", { opacity: 1, scaleX: 0 }, { opacity: 1, scaleX: 1, duration: BASE, ease: E.inOut, immediateRender: false }, tB1 - 0.1);
    card("#b1-num", tB1);
    title("#b1-name", tB1);
    const tConc = t("os", 1);
    card("#b1-sup", tConc - 0.05);
    draw("#d1-top", tConc, 0.7);
    draw("#d1-bot", tConc, 0.7);
    draw("#d1-one", tConc + 0.7, BASE);
    // bloco 2: título com "No litigioso", apoio com "não chegam a um acordo", vão e juiz com "quem decide é o juiz"
    const tB2 = t("no", 2) - 0.05;
    if (R) fadeIn("#b2-rule", tB2 - 0.1, 0.3);
    else tl.fromTo("#b2-rule", { opacity: 1, scaleX: 0 }, { opacity: 1, scaleX: 1, duration: BASE, ease: E.inOut, immediateRender: false }, tB2 - 0.1);
    card("#b2-num", tB2);
    title("#b2-name", tB2);
    card("#b2-sup", t("não", 2) - 0.05);
    const tQuem = t("quem");
    draw("#d2-left", tQuem, BASE);
    draw("#d2-right", tQuem, BASE);
    draw("#d2-bar", t("juiz") - 0.05, 0.4);
    fadeIn("#d2-label", t("juiz"), 0.3);
    const out2 = tf("juiz") + 0.25;
    textOut(["#s2-cat", "#b1", "#b2"], out2);

    // ================================================ C3 A pergunta (Sand)
    card("#s3-cat", t("mas") - 0.1);
    const c3 = ["mas", "e", "se", "o", "outro", "disser"];
    const i0c3 = idx("mas");
    for (let k = 0; k < 7; k++) word("#c3w" + k, tw(i0c3 + k));
    void c3;

    // ================================================ Revelação circular C3 para C4 (0,62 s)
    const REV = CUT.c34;
    const nao = { x: P.c3nao.r + 30, y: P.c3nao.y };
    if (R) {
      dissolveIn("#s4-inner", REV + BASE / 2);
    } else {
      tl.fromTo(
        "#s4-inner",
        { clipPath: "circle(0px at " + nao.x.toFixed(1) + "px " + nao.y.toFixed(1) + "px)" },
        { clipPath: "circle(2300px at " + nao.x.toFixed(1) + "px " + nao.y.toFixed(1) + "px)", duration: 0.62, ease: E.inOut, immediateRender: false },
        REV,
      );
      tl.set("#s4-inner", { clipPath: "none" }, REV + 0.64);
    }

    // ================================================ C4 A regra e a aliança
    card("#s4-cat", REV + 0.28);
    // "não impede" só entra quando a voz diz "não"; "impede" entra com a fala e a partida
    word("#s4-nao", t("não", 4));
    word("#s4-impede", t("impede"));
    if (R) {
      // sem câmera, o texto sai antes do quadro das metades no chão
      tl.to(["#s4-cat", "#s4-nao", "#s4-impede"], { opacity: 0, duration: 0.25, ease: E.inOut }, AL.T_A);
    }

    // ================================================ C5 O que vem junto (chão Paper)
    const tCat5 = AL.TILT1 - 0.05;
    card("#s5-cat", tCat5);
    const tJunto = tw(idx("vem") - 2);
    title("#s5-l1", tJunto);
    title("#s5-l2", t("junto") - 0.05);
    const tI1 = tw(idx("guarda") - 1);
    const tI2 = tw(idx("pensão") - 1);
    const tI3 = tw(idx("divisão") - 1);
    card("#it1", tI1);
    card("#it2", tI2);
    card("#it3", tI3);
    const out5 = CUT.c56 - 0.32;
    textOut(["#s5-cat", "#s5-title", "#it1", "#it2", "#it3"], out5);
    dissolveIn("#s6-inner", CUT.c56);

    // ================================================ C6 Mais tempo (Sand)
    card("#s6-cat", CUT.c56 + 0.1);
    const tProc = tw(idx("processo") - 1);
    fadeIn(["#lb-ped", "#s6-tick-a"], tProc - 0.1, 0.3);
    draw("#s6-a", tProc, SLOW);
    draw("#s6-b", tProc + SLOW, SLOW);
    fadeIn(["#lb-dec", "#s6-tick-b"], tProc + 2 * SLOW - 0.05, 0.3);
    title("#s6-l1", t("pode", 2) - 0.05);
    title("#s6-l2", t("mais") - 0.05);
    // único sublinhado dourado do vídeo, desenhado com a fala "mais tempo"
    tl.fromTo("#s6-hl", { backgroundSize: "0% 4px" }, { backgroundSize: "100% 4px", duration: R ? 0.01 : SLOW, ease: E.inOut, immediateRender: false }, t("mais") + 0.12);
    dissolveIn("#s7-inner", CUT.c67);

    // ================================================ C7 Cada caso (gradiente)
    card("#s7-cat", CUT.c67 + 0.15);
    title("#s7-l1", t("cada", 1) - 0.05);
    title("#s7-l2", t("tem") - 0.05);
    title("#s7-l3", t("realidade") - 0.05);
    card("#s7-sup", tw(idx("orientação") - 1) - 0.05);
    const out7 = tf("pessoa") + 0.02;
    textOut(["#s7-cat", "#s7-title", "#s7-sup"], out7);
    card("#s7-cat2", out7 + 0.3);
    title("#s7-m1", t("converse") - 0.05);
    title("#s7-m2", tw(idx("converse") + 1) - 0.05);
    title("#s7-m3", t("advogado") - 0.05);

    // ================================================ C8 Assinatura (Navy liso)
    const B8 = CUT.c78;
    if (R) {
      dissolveIn("#s8-inner", B8 + 0.25);
    } else {
      tl.to("#s7-inner", { filter: "blur(18px)", duration: 0.5, ease: E.inOut }, B8);
      dissolveIn("#s8-inner", B8 + 0.25);
      tl.fromTo("#s8-blob-a", { x: 0, y: 0 }, { x: 260, y: 180, duration: 6.2, ease: "sine.inOut", immediateRender: false }, B8 + 0.1);
      tl.fromTo("#s8-blob-b", { x: 0, y: 0 }, { x: -320, y: -260, duration: 6.2, ease: "sine.inOut", immediateRender: false }, B8 + 0.1);
    }
    if (R) fadeIn("#s8-logo", B8 + 0.3, 0.8);
    else
      tl.fromTo(
        "#s8-logo",
        { opacity: 0, scale: 1.06, filter: "blur(28px)" },
        { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.8, ease: E.inOut, immediateRender: false },
        B8 + 0.3,
      );
    card("#s8-tel-label", B8 + 0.95);
    card("#s8-tel", B8 + 1.0);
    card("#s8-ig-label", B8 + 1.25);
    card("#s8-ig", B8 + 1.3);
    if (R) fadeIn("#s8-rule", B8 + 1.6, 0.3);
    else tl.fromTo("#s8-rule", { opacity: 1, scaleX: 0 }, { opacity: 1, scaleX: 1, duration: BASE, ease: E.inOut, immediateRender: false }, B8 + 1.6);
    card("#s8-note", B8 + 1.85);
    card("#s8-source", B8 + 2.0);

    // ================================================ legenda editorial: a palavra falada acende
    D.legendas.forEach((b, k) => {
      const on = b.escuro ? "#D4AF7C" : "#214D8C";
      const base = b.escuro ? "#FAF8F4" : "#202631";
      tl.fromTo("#ct-" + k, { opacity: 0 }, { opacity: 1, duration: 0.15, ease: "none", immediateRender: false }, b.ini);
      const ids = b.linhas.flat();
      ids.forEach((j, n) => {
        const off = n + 1 < ids.length ? tw(ids[n + 1]) : b.fim;
        tl.set("#cw-" + j, { color: on }, tw(j));
        if (off < b.fim - 0.01) tl.set("#cw-" + j, { color: base }, off);
      });
    });

    // ================================================ bolinha condutora (só na versão normal)
    if (!R) {
      let busy = 0;
      const move = (at, p, d) => {
        const s0 = Math.max(at, busy);
        tl.to("#dot-b", { x: p.x, duration: d, ease: "sine.inOut" }, s0);
        tl.to("#dot-b", { y: p.y, duration: d, ease: "power2.inOut" }, s0);
        busy = s0 + d;
      };
      // percorre um path desenhado, sem atraso em relação ao traço
      const ride = (at, sel, d) => {
        const s0 = Math.max(at, busy);
        const N = 12;
        for (let k = 1; k <= N; k++) {
          const f0 = (k - 1) / N;
          const f1 = k / N;
          const e0 = E.inOut(f0);
          const e1 = E.inOut(f1);
          const p = onPath(sel, e1);
          tl.to("#dot-b", { x: p.x, y: p.y, duration: d / N, ease: "none" }, s0 + (d * f0));
          void e0;
        }
        busy = s0 + d;
      };
      const swoop = (at, via, p, d) => {
        move(at, via, d * 0.45);
        move(busy, p, d * 0.55);
      };
      const beside = (b, gap) => ({ x: b.r + (gap || 30) + 15, y: b.y });
      // C1: nasce ao lado direito da categoria e para ao lado do fim de cada linha falada
      const cat = { x: 0, y: P.c1cat.y };
      const catW = (() => {
        const rg = document.createRange();
        rg.selectNodeContents(document.getElementById("s1-cat"));
        const r = rg.getBoundingClientRect();
        const r0 = root.getBoundingClientRect();
        return (r.right - r0.left) / (r0.width / 1080);
      })();
      cat.x = catW + 45;
      tl.set("#dot-b", { xPercent: -50, yPercent: -50, x: cat.x, y: cat.y, opacity: 0, scale: 1 }, 0);
      tl.to("#dot-b", { opacity: 1, duration: 0.3, ease: E.inOut }, 0.15);
      move(tw(1) + 0.06, beside(P.c1l[0]), 0.5);
      move(tw(4) + 0.04, beside(P.c1l[1]), 0.45);
      move(tw(5) + 0.26, beside(P.c1l[2]), 0.45);
      move(tw(7) + 0.06, beside(P.c1l[3]), 0.45);
      // C2
      swoop(CUT.c12, { x: 960, y: 330 }, beside(P.c2cat), 1.0);
      move(tB1 + 0.1, beside(P.b1name), 0.6);
      move(tConc - 0.3, P.d1top0, 0.3);
      ride(tConc, "#d1-top", 0.7);
      swoop(tB2 + 0.05, { x: 980, y: 900 }, beside(P.b2name), 0.9);
      move(tQuem - 0.25, P.d2left0, 0.25);
      ride(tQuem, "#d2-left", BASE);
      move(t("juiz") - 0.05, { x: P.d2bar.x, y: P.d2bar.y }, 0.4);
      // C3: termina ao lado direito de "não" e espera ali
      swoop(out2 + 0.1, { x: 980, y: 700 }, beside(P.c3l1), 1.0);
      move(Math.min(t("não", 3) - 0.06, REV - 0.42), nao, 0.4);
      // atravessa o corte em arco, entra no centro da aliança e some
      const rc = AL.ringCenter;
      swoop(REV + 0.02, { x: (nao.x + rc.x) / 2 + 150, y: (nao.y + rc.y) / 2 + 80 }, rc, 0.5);
      tl.to("#dot-b", { scale: 0, opacity: 0, duration: 0.18, ease: E.inOut }, busy);
      // C5: renasce saindo do vão de uma das metades e vai para o título
      const g = AL.gap;
      tl.set("#dot-b", { x: g.x, y: g.y, scale: 1 }, AL.TILT1);
      tl.to("#dot-b", { opacity: 1, duration: 0.3, ease: E.inOut }, AL.TILT1 + 0.02);
      busy = AL.TILT1 + 0.32;
      move(Math.max(busy, t("junto") - 0.05), beside(P.c5l2), 0.9);
      move(tI1 + 0.05, beside(P.it[0]), 0.5);
      move(tI2 + 0.05, beside(P.it[1]), 0.5);
      move(tI3 + 0.05, beside(P.it[2]), 0.5);
      // C6: percorre a linha acompanhando o desenho e para sobre "DECISÃO"
      swoop(CUT.c56 - 0.1, { x: 140, y: 1150 }, P.s6a0, 1.0);
      ride(tProc, "#s6-a", SLOW);
      ride(tProc + SLOW, "#s6-b", SLOW);
      // C7: "realidade", fim do apoio, "advogado"; arco amplo entre as partes
      swoop(CUT.c67 + 0.05, { x: 980, y: 600 }, beside(P.c7l3), 1.1);
      move(t("pessoa") - 0.3, { x: P.c7supEnd.x + 45, y: P.c7supEnd.y }, 0.6);
      swoop(out7 + 0.1, { x: 980, y: 380 }, beside(P.c7m3), 1.0);
      // C8: atravessa o corte e se apaga no centro da logo
      move(B8 + 0.05, { x: P.logo.x, y: P.logo.y }, 0.6);
      tl.to("#dot-b", { scale: 0.4, opacity: 0, duration: 0.3, ease: E.inOut }, busy - 0.05);

      // rastro: amostra o caminho montado e desenha 8 bolinhas que seguem com atraso
      const dur = parseFloat(document.getElementById("dot").getAttribute("data-start")) + parseFloat(document.getElementById("dot").getAttribute("data-duration"));
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
