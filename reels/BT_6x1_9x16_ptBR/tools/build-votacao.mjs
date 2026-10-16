// Gera as cenas de votação: compositions/c03-camara.html e compositions/c04-senado.html.
// Foto em cartão arredondado com tom da paleta, hemiciclo gerado por código, quórum, placar com realce
// e, no Senado, as duas Casas lado a lado com o selo. Uso: node tools/build-votacao.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { distribuirVotos, indiceDoQuorum, instantesVarredura, layoutHemiciclo, raioInternoEquilibrado } from "./hemiciclo.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const TEMPOS = JSON.parse(readFileSync(join(RAIZ, "tools/tempos.json"), "utf8"));
const cena = (id) => TEMPOS.cenas.find((c) => c.id === id);
const COR = { midnight: "#081a35", primary: "#0b1f4b", blue: "#214d8c", sky: "#8fc5ef", gold: "#d4af7c", paper: "#faf8f4", ink: "#202631" };
const CURVA = [0.4, 0, 0.2, 1];
// Tom em três cores da paleta (Navy, Sky, Paper) pelo tratamento canônico do HyperFrames.
const GRADING = JSON.stringify({
  intensity: 0.55,
  adjust: { saturation: -1, contrast: 0.05, exposure: 0.08 },
  curves: { red: [[0, 0.043], [0.55, 0.561], [1, 0.98]], green: [[0, 0.122], [0.55, 0.773], [1, 0.973]], blue: [[0, 0.294], [0.55, 0.937], [1, 0.957]] },
  details: { vignette: 0.12, vignetteFeather: 0.8, grain: 0.12, grainSize: 0.3 },
});
const r1 = (v) => Math.round(v * 10) / 10;
const r3 = (v) => Math.round(v * 1000) / 1000;

function mulberry32(s) {
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), s | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Cadeiras de um hemiciclo como círculos SVG; `cheio` desenha o estado final (miniaturas).
function cadeirasSvg(prefixo, casa, cx, cy, cheio) {
  const L = layoutHemiciclo(casa);
  const status = distribuirVotos(casa.total, casa);
  const raio = (0.78 * Math.min(...L.passoArco, L.passoFileira)) / 2;
  let svg = "";
  L.cadeiras.forEach((c, j) => {
    const x = r1(cx + c.x);
    const y = r1(cy + c.y);
    if (cheio) {
      const f = status[j] === "sim" ? COR.sky : status[j] === "nao" ? COR.paper : "none";
      svg += `<circle cx="${x}" cy="${y}" r="${r1(raio)}" fill="${f}" stroke="${COR.sky}" stroke-opacity="${f === "none" ? 0.3 : 0}" stroke-width="1.5"/>`;
    } else {
      svg += `<circle id="${prefixo}-s${j}" cx="${x}" cy="${y}" r="${r1(raio)}" fill="none" stroke="${COR.sky}" stroke-opacity="0.3" stroke-width="2"/>`;
    }
  });
  return { svg, L, status };
}

function gerar(cfg) {
  const C = cena(cfg.id);
  const T = TEMPOS[cfg.chave];
  const p = cfg.prefixo;
  const casa = { total: cfg.total, fileiras: cfg.fileiras, raioExterno: cfg.R, sim: cfg.sim, nao: cfg.nao };
  casa.raioInterno = raioInternoEquilibrado(casa);
  const [CX, CY] = cfg.centro;
  const { svg: cadeiras, L, status } = cadeirasSvg(p, casa, CX, CY, false);
  const tempos = instantesVarredura(casa.total, T.varreduraInicio, T.varreduraDuracao, CURVA);
  const q = indiceDoQuorum(status, cfg.quorum);
  const thetaQ = (L.cadeiras[q].theta + L.cadeiras[q + 1].theta) / 2;
  const polar = (r) => [r1(CX + r * Math.cos(thetaQ)), r1(CY - r * Math.sin(thetaQ))];
  const [qx1, qy1] = polar(casa.raioInterno - 22);
  const [qx2, qy2] = polar(cfg.R + 50);
  const tQ = r3(tempos[q]);
  const tFim = r3(tempos[tempos.length - 1]);

  let sets = "";
  let nSim = 0;
  let nNao = 0;
  L.cadeiras.forEach((_, j) => {
    const t = r3(tempos[j]);
    if (status[j] === "sim") {
      nSim += 1;
      sets += `tl.set("#${p}-s${j}",{attr:{fill:"${COR.sky}","stroke-opacity":0}},${t});tl.set("#${p}-n-sim",{textContent:"${nSim}"},${t});`;
    } else if (status[j] === "nao") {
      nNao += 1;
      sets += `tl.set("#${p}-s${j}",{attr:{fill:"${COR.paper}","stroke-opacity":0}},${t});tl.set("#${p}-n-nao",{textContent:"${nNao}"},${t});`;
    }
  });

  const rnd = mulberry32(cfg.semente);
  let poeira = "";
  for (let i = 0; i < 34; i++) {
    poeira += `<circle cx="${r1(70 + rnd() * 940)}" cy="${r1(cfg.fotoY + rnd() * cfg.fotoH)}" r="${r1(1.5 + rnd() * 2.6)}" fill="${COR.paper}" opacity="${r1(0.05 + rnd() * 0.1)}"/>`;
  }
  const fotoW = 960;

  // Miniaturas das duas Casas (só no Senado).
  let minis = "";
  let minisTl = "";
  if (cfg.minis) {
    const cam = { total: 513, fileiras: 10, raioExterno: 196, sim: 461, nao: 19 };
    cam.raioInterno = raioInternoEquilibrado(cam);
    const sen = { total: 81, fileiras: 5, raioExterno: 150, sim: 75, nao: 1 };
    sen.raioInterno = raioInternoEquilibrado(sen);
    minis = `<div id="${p}-minis" data-layout-allow-overlap>
      <svg viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg" style="position:absolute;left:0;top:0;width:1080px;height:1920px" aria-hidden="true">
        <g style="filter: drop-shadow(0 0 8px rgba(143,197,239,0.35))">${cadeirasSvg("mc", cam, 290, 1000, true).svg}${cadeirasSvg("ms", sen, 760, 1000, true).svg}</g>
      </svg>
      <div class="mini-rot" style="left:94px;width:392px">CÂMARA</div><div class="mini-num" style="left:94px;width:392px">461 a 19</div>
      <div class="mini-rot" style="left:564px;width:392px">SENADO</div><div class="mini-num" style="left:564px;width:392px">75 a 1</div>
      <div id="${p}-selo">APROVADO NAS DUAS CASAS</div>
    </div>`;
    const tm = r3(C.k.um + 0.15);
    minisTl = `
          tl.to(["#${p}-arco", "#${p}-placar"], { opacity: 0, scale: 0.6, transformOrigin: "50% 40%", duration: 0.45, ease: "bt-standard" }, ${tm});
          tl.fromTo("#${p}-minis", { opacity: 0, y: 36 }, { opacity: 1, y: 0, duration: 0.55, ease: "bt-emphasized" }, ${r3(tm + 0.15)});
          tl.fromTo("#${p}-selo", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4, ease: "bt-enter" }, ${r3(tm + 0.45)});
          BT.realce(tl, "#${p}-selo", ${r3(tm + 0.5)}, "rgba(212, 175, 124, 0.85)", 1.05);`;
  }
  const saidaContinuidade = cfg.saida
    ? `tl.to(["#${p}-arco", "#${p}-placar"], { x: -200, scale: 0.62, transformOrigin: "0% 50%", opacity: 0.0, duration: 0.55, ease: "bt-standard" }, ${r3(C.dur - 0.5)});`
    : "";

  const html = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
  </head>
  <body>
    <!-- Gerado por tools/build-votacao.mjs. Edite o gerador, não este arquivo. -->
    <template>
      <style>
        @font-face { font-family: "Cormorant Garamond"; font-weight: 600; src: url("assets/fonts/cormorant-garamond-latin-600-normal.woff2") format("woff2"); }
        @font-face { font-family: "Montserrat"; font-weight: 600; src: url("assets/fonts/montserrat-latin-600-normal.woff2") format("woff2"); }
        #root { position: absolute; inset: 0; overflow: hidden; background: ${COR.midnight}; font-family: "Montserrat", Arial, sans-serif; color: ${COR.paper}; }
        #${p}-fundo { position: absolute; inset: 0; background: radial-gradient(circle at ${CX}px 760px, rgba(33, 77, 140, 0.55) 0%, rgba(33, 77, 140, 0) 52%), linear-gradient(135deg, ${COR.midnight} 0%, ${COR.primary} 100%); }
        #${p}-ruido { position: absolute; inset: 0; background-image: url("assets/texturas/ruido-256.png"); background-size: 256px 256px; opacity: 0.06; mix-blend-mode: overlay; }
        #${p}-grade { position: absolute; inset: 0; background-image: linear-gradient(to right, rgba(250,248,244,0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(250,248,244,0.035) 1px, transparent 1px); background-size: 8px 8px; }
        #${p}-rotulo { position: absolute; left: 96px; top: 300px; width: 804px; font-size: 36px; font-weight: 600; line-height: 1.2; letter-spacing: 0.12em; color: ${COR.sky}; }
        #${p}-foto-card { position: absolute; left: 60px; top: ${cfg.fotoY}px; width: ${fotoW}px; height: ${cfg.fotoH}px; border-radius: 40px; overflow: hidden;
          box-shadow: 0 30px 70px rgba(4, 12, 28, 0.45), 0 0 0 2px rgba(143, 197, 239, 0.18); }
        #${p}-foto-kb { position: absolute; inset: 0; transform-origin: 50% 46%; }
        #${p}-foto { position: absolute; left: 0; top: 0; display: block; width: ${fotoW}px; height: ${cfg.fotoH}px; object-fit: cover; }
        #${p}-poeira { position: absolute; left: 0; top: 0; width: 1080px; height: 1920px; }
        #${p}-credito { position: absolute; left: 96px; top: 1462px; width: 804px; font-size: 36px; font-weight: 600; line-height: 1; letter-spacing: 0.04em; color: rgba(250, 248, 244, 0.6); }
        #${p}-arco { position: absolute; left: 0; top: 0; width: 1080px; height: 1920px; overflow: visible; }
        #${p}-cadeiras { filter: drop-shadow(0 0 9px rgba(143, 197, 239, 0.3)); }
        #${p}-placar { position: absolute; left: 96px; top: ${cfg.placarY}px; width: 804px; }
        #${p}-placar .rot { font-size: 36px; font-weight: 600; line-height: 1.2; letter-spacing: 0.04em; }
        #${p}-placar .linha { display: flex; }
        #${p}-placar .numeros { align-items: baseline; }
        #${p}-placar .rotulos { margin-top: 40px; }
        #${p}-placar .col1 { width: 470px; }
        #${p}-n-sim { display: inline-block; font-family: "Cormorant Garamond", Georgia, serif; font-weight: 600; font-size: 280px; line-height: 1; color: ${COR.sky};
          font-variant-numeric: lining-nums tabular-nums; font-feature-settings: "lnum" 1, "tnum" 1; text-shadow: 0 0 28px rgba(143, 197, 239, 0.3); transform-origin: 0% 70%; }
        #${p}-n-nao { display: inline-block; font-family: "Cormorant Garamond", Georgia, serif; font-weight: 600; font-size: 160px; line-height: 1; color: ${COR.paper};
          font-variant-numeric: lining-nums tabular-nums; font-feature-settings: "lnum" 1, "tnum" 1; transform-origin: 0% 70%; }
        #${p}-nota { margin-top: 14px; font-size: 36px; font-weight: 600; line-height: 1.2; letter-spacing: 0.04em; color: rgba(250, 248, 244, 0.8); }
        #${p}-varredura { position: absolute; left: 60px; top: ${cfg.placarY + 20}px; width: 880px; height: 340px; overflow: hidden; }
        #${p}-varredura div { position: absolute; top: -40%; left: 0; width: 180px; height: 180%; background: linear-gradient(90deg, rgba(250,248,244,0) 0%, rgba(250,248,244,0.18) 50%, rgba(250,248,244,0) 100%); transform: rotate(18deg); }
        #${p}-minis { position: absolute; inset: 0; }
        #${p}-minis .mini-rot { position: absolute; top: 1030px; text-align: center; font-size: 36px; font-weight: 600; letter-spacing: 0.12em; color: ${COR.sky}; }
        #${p}-minis .mini-num { position: absolute; top: 1080px; text-align: center; font-family: "Cormorant Garamond", Georgia, serif; font-weight: 600; font-size: 72px; line-height: 1;
          color: ${COR.paper}; font-variant-numeric: lining-nums; font-feature-settings: "lnum" 1; }
        #${p}-selo { position: absolute; left: 190px; top: 640px; width: 700px; padding: 18px 0; border: 3px solid ${COR.gold}; border-radius: 12px; text-align: center;
          font-size: 36px; font-weight: 600; letter-spacing: 0.1em; color: ${COR.gold}; }
      </style>

      <div id="root" data-composition-id="${cfg.id}" data-width="1080" data-height="1920">
        <div id="${p}-fundo"></div>
        <div id="${p}-ruido" data-layout-ignore></div>
        <div id="${p}-grade" data-layout-ignore></div>
        <div id="${p}-foto-card">
          <div id="${p}-foto-kb">
            <img id="${p}-foto" class="clip" data-start="0" data-duration="${r3(T.fotoFim + 0.6)}" data-track-index="1" src="assets/fotos/${cfg.foto}" alt="${cfg.alt}" data-color-grading='${GRADING}' />
          </div>
        </div>
        <svg id="${p}-poeira" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" data-layout-ignore>${poeira}</svg>
        <div id="${p}-credito">Foto: [CRÉDITO]</div>

        <svg id="${p}-arco" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <g id="${p}-cadeiras">${cadeiras}</g>
          <line id="${p}-quorum" x1="${qx1}" y1="${qy1}" x2="${qx2}" y2="${qy2}" stroke="${COR.gold}" stroke-width="4" stroke-dasharray="10 9" stroke-linecap="round" opacity="0.5" />
          <text id="${p}-quorum-rot" x="900" y="${cfg.quorumRotY}" text-anchor="end" font-family="Montserrat, Arial, sans-serif" font-size="36" font-weight="600" letter-spacing="1.4" fill="${COR.gold}" opacity="0.65">Mínimo: ${cfg.quorum}</text>
        </svg>

        <div id="${p}-placar">
          <div class="linha numeros"><div class="col1"><span id="${p}-n-sim">0</span></div><div><span id="${p}-n-nao">0</span></div></div>
          <div class="linha rotulos"><div class="col1 rot" style="color: ${COR.sky}">SIM</div><div class="rot" style="color: ${COR.paper}">NÃO</div></div>
          <div id="${p}-nota">${cfg.nota}</div>
        </div>
        <div id="${p}-varredura" data-layout-ignore aria-hidden="true"><div id="${p}-varredura-luz" data-layout-allow-overflow></div></div>
        ${minis}
        <div id="${p}-rotulo">${cfg.rotulo}</div>
      </div>

      <script>
        (function () {
          const tl = gsap.timeline({ paused: true });
          // Foto em cartão arredondado: entra, Ken Burns de 104% a 100%, poeira de luz, sai encolhendo.
          tl.fromTo("#${p}-foto-card", { opacity: 0, y: 36, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: "bt-emphasized" }, 0);
          tl.fromTo("#${p}-foto-kb", { scale: 1.04 }, { scale: 1.0, duration: 3.5, ease: "none" }, 0);
          tl.fromTo("#${p}-poeira", { opacity: 0, y: 0 }, { opacity: 1, y: -30, duration: ${r3(T.fotoFim)}, ease: "none" }, 0);
          tl.fromTo("#${p}-rotulo", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4, ease: "bt-enter" }, 0.05);
          tl.fromTo("#${p}-credito", { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0.1);
          tl.to("#${p}-foto-card", { opacity: 0, scale: 0.94, duration: 0.45, ease: "bt-standard" }, ${T.fotoFim});
          tl.to(["#${p}-poeira", "#${p}-credito"], { opacity: 0, duration: 0.3 }, ${T.fotoFim});
          tl.fromTo("#${p}-arco", { opacity: 0, scale: 0.96, transformOrigin: "50% 42%" }, { opacity: 1, scale: 1, duration: 0.55, ease: "bt-emphasized" }, ${r3(T.fotoFim + 0.05)});
          tl.fromTo("#${p}-placar", { opacity: 0, y: 36 }, { opacity: 1, y: 0, duration: 0.55, ease: "bt-emphasized" }, ${r3(T.fotoFim + 0.2)});
          ${sets}
          // Quórum: a linha acende no quadro em que a contagem passa do mínimo.
          tl.to("#${p}-quorum", { opacity: 1, strokeWidth: 7, duration: 0.15, ease: "power2.out" }, ${tQ});
          tl.to("#${p}-quorum", { strokeWidth: 4, duration: 0.45, ease: "bt-standard" }, ${r3(tQ + 0.15)});
          tl.to("#${p}-quorum-rot", { opacity: 1, duration: 0.2 }, ${tQ});
          tl.fromTo("#${p}-quorum", { filter: "drop-shadow(0 0 0px rgba(212,175,124,0.9))" }, { filter: "drop-shadow(0 0 16px rgba(212,175,124,0.9))", duration: 0.2, yoyo: true, repeat: 1 }, ${tQ});
          // Fim da contagem: varredura de luz única e realce dos números quando a voz os diz.
          tl.fromTo("#${p}-varredura-luz", { x: -260 }, { x: 980, duration: 0.6, ease: "bt-standard" }, ${r3(tFim + 0.05)});
          BT.realce(tl, "#${p}-n-sim", ${r3(Math.max(tFim + 0.1, C.k[cfg.chaveSim]))}, "rgba(143, 197, 239, 0.95)", 1.08);
          BT.realce(tl, "#${p}-n-nao", ${r3(Math.max(tFim + 0.2, C.k[cfg.chaveNao]))}, "rgba(250, 248, 244, 0.8)", 1.08);
          ${saidaContinuidade}
          ${minisTl}
          window.__timelines["${cfg.id}"] = tl;
        })();
      </script>
    </template>
  </body>
</html>
`;
  writeFileSync(join(RAIZ, `compositions/${cfg.id}.html`), html);
  return { id: cfg.id, quorum: tQ, fimVarredura: tFim, sim: nSim, nao: nNao };
}

console.log(JSON.stringify([
  gerar({ id: "c03-camara", chave: "c03", prefixo: "c03", foto: "foto-06-camara.jpg", alt: "Plenário da Câmara dos Deputados", fotoY: 400, fotoH: 677,
    rotulo: "CÂMARA DOS DEPUTADOS", total: 513, fileiras: 10, R: 390, sim: 461, nao: 19, quorum: 308, nota: "2º turno, 27/05/2026",
    centro: [498, 800], placarY: 812, quorumRotY: 398, semente: 308, chaveSim: "quatrocentos", chaveNao: "dezenove", saida: true }),
  gerar({ id: "c04-senado", chave: "c04", prefixo: "c04", foto: "foto-08-senado.jpg", alt: "Plenário do Senado Federal", fotoY: 420, fotoH: 575,
    rotulo: "SENADO FEDERAL", total: 81, fileiras: 5, R: 330, sim: 75, nao: 1, quorum: 49, nota: "14/10/2026",
    centro: [498, 790], placarY: 812, quorumRotY: 410, semente: 49, chaveSim: "setenta", chaveNao: "um", minis: true }),
]));
