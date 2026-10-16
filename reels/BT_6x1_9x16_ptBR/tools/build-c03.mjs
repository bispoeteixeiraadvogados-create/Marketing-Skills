// Gera compositions/c03-camara.html: foto da Câmara tratada, hemiciclo de 513 cadeiras, quórum e placar.
// Uso: node tools/build-c03.mjs
// Tempos locais da cena (segundos). Na etapa (c) eles passam a vir da transcrição da voz.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { distribuirVotos, indiceDoQuorum, instantesVarredura, layoutHemiciclo } from "./hemiciclo.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const T = JSON.parse(readFileSync(join(RAIZ, "tools/tempos-c03.json"), "utf8"));
const COR = { midnight: "#081a35", primary: "#0b1f4b", blue: "#214d8c", sky: "#8fc5ef", gold: "#d4af7c", paper: "#faf8f4", ink: "#202631" };
const CURVA_STANDARD = [0.4, 0, 0.2, 1];

// Grading canônico do HyperFrames (validado com `hyperframes media-treatment --dry-run`).
const GRADING = readFileSync(join(RAIZ, "tools/grading-duotone.json"), "utf8").trim();

const camara = { total: 513, fileiras: 10, raioInterno: 219, raioExterno: 390, sim: 461, nao: 19, quorum: 308 };
const [CX, CY] = [498, 800];
const r1 = (v) => Math.round(v * 10) / 10;
const r3 = (v) => Math.round(v * 1000) / 1000;

const L = layoutHemiciclo(camara);
const status = distribuirVotos(camara.total, camara);
const tempos = instantesVarredura(camara.total, T.varreduraInicio, T.varreduraDuracao, CURVA_STANDARD);
const q = indiceDoQuorum(status, camara.quorum);
const raioCadeira = (0.78 * Math.min(...L.passoArco, L.passoFileira)) / 2;
const thetaQ = (L.cadeiras[q].theta + L.cadeiras[q + 1].theta) / 2;
const polar = (r) => [r1(CX + r * Math.cos(thetaQ)), r1(CY - r * Math.sin(thetaQ))];
const [qx1, qy1] = polar(camara.raioInterno - 22);
const [qx2, qy2] = polar(camara.raioExterno + 50);
const tQuorum = r3(tempos[q]);
const tFim = r3(tempos[tempos.length - 1]);

let cadeiras = "";
let sets = "";
let nSim = 0;
let nNao = 0;
L.cadeiras.forEach((c, j) => {
  cadeiras += `<circle id="c03-s${j}" cx="${r1(CX + c.x)}" cy="${r1(CY + c.y)}" r="${r1(raioCadeira)}" fill="none" stroke="${COR.sky}" stroke-opacity="0.22" stroke-width="2"/>`;
  const t = r3(tempos[j]);
  if (status[j] === "sim") {
    nSim += 1;
    sets += `tl.set("#c03-s${j}",{attr:{fill:"${COR.sky}","stroke-opacity":0}},${t});tl.set("#c03-n-sim",{textContent:"${nSim}"},${t});`;
  } else if (status[j] === "nao") {
    nNao += 1;
    sets += `tl.set("#c03-s${j}",{attr:{fill:"${COR.paper}","stroke-opacity":0}},${t});tl.set("#c03-n-nao",{textContent:"${nNao}"},${t});`;
  }
});

// Poeira de luz: até 40 partículas, semente fixa, opacidade de no máximo 15%.
function mulberry32(s) {
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), s | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(308);
let poeira = "";
for (let i = 0; i < 32; i++) {
  const x = r1(40 + rnd() * 1000);
  const y = r1(390 + rnd() * 700);
  const r = r1(1.5 + rnd() * 2.5);
  const o = r1(0.05 + rnd() * 0.1);
  poeira += `<circle class="c03-pz" cx="${x}" cy="${y}" r="${r}" fill="${COR.paper}" opacity="${o}"/>`;
}

// Legenda em linhas definidas (até 2 linhas de cerca de 30 caracteres); a caixa abraça a linha mais longa.
const legenda = (id, linhas) => {
  let n = 0;
  const html = linhas.map((ws) => `<span class="ln">${ws.map((w) => `<span id="${id}-w${n++}">${w}</span>`).join(" ")}</span>`).join("");
  return `<div id="${id}" class="legenda escura">${html}</div>`;
};
const leg1 = [["Em", "maio,", "a", "Câmara"], ["aprovou", "a", "proposta."]];
const leg2 = [["461", "votos", "a", "19."]];
const destaque = (id, n, tempos) =>
  tempos.map((t, i) => `tl.set("#${id}-w${i}",{color:"${COR.blue}"},${t});` + (i < n - 1 ? `tl.set("#${id}-w${i}",{color:"${COR.ink}"},${tempos[i + 1]});` : "")).join("");

const html = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
  </head>
  <body>
    <!-- Gerado por tools/build-c03.mjs. Edite o gerador, não este arquivo. -->
    <template>
      <style>
        @font-face { font-family: "Cormorant Garamond"; font-weight: 600; src: url("assets/fonts/cormorant-garamond-latin-600-normal.woff2") format("woff2"); }
        @font-face { font-family: "Montserrat"; font-weight: 500; src: url("assets/fonts/montserrat-latin-500-normal.woff2") format("woff2"); }
        @font-face { font-family: "Montserrat"; font-weight: 600; src: url("assets/fonts/montserrat-latin-600-normal.woff2") format("woff2"); }
        #root { position: absolute; inset: 0; overflow: hidden; background: ${COR.midnight}; font-family: "Montserrat", Arial, sans-serif; color: ${COR.paper}; }
        #c03-brilho { position: absolute; inset: 0; background: radial-gradient(circle at ${CX}px ${CY - 120}px, rgba(33, 77, 140, 0.42) 0%, rgba(33, 77, 140, 0) 58%); }
        #c03-rotulo { position: absolute; left: 96px; top: 276px; width: 804px; font-size: 36px; font-weight: 600; line-height: 1.2; letter-spacing: 0.12em; color: ${COR.sky}; }
        #c03-foto-bloco { position: absolute; left: 0; top: 380px; width: 1080px; height: 762px; overflow: hidden;
          -webkit-mask-image: linear-gradient(to bottom, transparent 0, #000 72px, #000 690px, transparent 762px);
          mask-image: linear-gradient(to bottom, transparent 0, #000 72px, #000 690px, transparent 762px); }
        #c03-foto-kb { position: absolute; inset: 0; transform-origin: 50% 46%; }
        #c03-foto { position: absolute; left: 0; top: 0; display: block; width: 1080px; height: 762px; object-fit: cover; }
        #c03-poeira { position: absolute; left: 0; top: 0; width: 1080px; height: 1920px; }
        #c03-credito { position: absolute; left: 96px; top: 1462px; width: 804px; font-size: 36px; font-weight: 600; line-height: 1; letter-spacing: 0.04em; color: rgba(250, 248, 244, 0.6); }
        #c03-arco { position: absolute; left: 0; top: 0; width: 1080px; height: 1920px; overflow: visible; }
        #c03-cadeiras { filter: drop-shadow(0 0 9px rgba(143, 197, 239, 0.25)); }
        #c03-placar { position: absolute; left: 96px; top: 812px; width: 804px; }
        #c03-placar .rot { font-size: 36px; font-weight: 600; line-height: 1.2; letter-spacing: 0.04em; }
        #c03-placar .linha { display: flex; }
        #c03-placar .numeros { align-items: baseline; }
        #c03-placar .rotulos { margin-top: 40px; }
        #c03-placar .col1 { width: 470px; }
        #c03-n-sim { display: block; font-family: "Cormorant Garamond", Georgia, serif; font-weight: 600; font-size: 280px; line-height: 1; letter-spacing: -0.01em; color: ${COR.sky}; font-variant-numeric: lining-nums tabular-nums; font-feature-settings: "lnum" 1, "tnum" 1; text-shadow: 0 0 28px rgba(143, 197, 239, 0.25); }
        #c03-n-nao { display: block; font-family: "Cormorant Garamond", Georgia, serif; font-weight: 600; font-size: 160px; line-height: 1; color: ${COR.paper}; font-variant-numeric: lining-nums tabular-nums; font-feature-settings: "lnum" 1, "tnum" 1; }
        #c03-nota { margin-top: 14px; font-size: 36px; font-weight: 600; line-height: 1.2; letter-spacing: 0.04em; color: rgba(250, 248, 244, 0.78); }
        #c03-varredura { position: absolute; left: 60px; top: 840px; width: 880px; height: 340px; overflow: hidden; pointer-events: none; }
        #c03-varredura div { position: absolute; top: -40%; left: 0; width: 180px; height: 180%; background: linear-gradient(90deg, rgba(250, 248, 244, 0) 0%, rgba(250, 248, 244, 0.16) 50%, rgba(250, 248, 244, 0) 100%); transform: rotate(18deg); }
        .legenda { position: absolute; left: 96px; top: 1262px; max-width: 804px; padding: 20px 30px 22px; border-radius: 12px; font-family: "Montserrat", Arial, sans-serif; font-weight: 500; font-size: 48px; line-height: 1.2; width: fit-content; }
        .legenda .ln { display: block; white-space: nowrap; }
        .legenda.escura { background: ${COR.paper}; color: ${COR.ink}; }
      </style>

      <div id="root" data-composition-id="c03-camara" data-width="1080" data-height="1920">
        <div id="c03-brilho"></div>
        <div id="c03-foto-bloco">
          <div id="c03-foto-kb">
            <img id="c03-foto" class="clip" data-start="0" data-duration="${r3(T.fotoFim + 0.5)}" data-track-index="1" src="assets/fotos/foto-06-camara.jpg" alt="Plenário da Câmara dos Deputados" data-color-grading='${GRADING}' />
          </div>
        </div>
        <svg id="c03-poeira" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">${poeira}</svg>
        <div id="c03-credito">Foto: [CRÉDITO]</div>

        <svg id="c03-arco" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
          <g id="c03-cadeiras">${cadeiras}</g>
          <line id="c03-quorum" x1="${qx1}" y1="${qy1}" x2="${qx2}" y2="${qy2}" stroke="${COR.gold}" stroke-width="4" stroke-dasharray="10 9" stroke-linecap="round" opacity="0.45" />
          <text id="c03-quorum-rot" x="900" y="398" text-anchor="end" font-family="Montserrat, Arial, sans-serif" font-size="36" font-weight="600" letter-spacing="1.4" fill="${COR.gold}" opacity="0.6">Mínimo: 308</text>
        </svg>

        <div id="c03-placar">
          <div class="linha numeros">
            <div class="col1"><span id="c03-n-sim">0</span></div>
            <div><span id="c03-n-nao">0</span></div>
          </div>
          <div class="linha rotulos">
            <div class="col1 rot" style="color: ${COR.sky}">SIM</div>
            <div class="rot" style="color: ${COR.paper}">NÃO</div>
          </div>
          <div id="c03-nota">2º turno, 27/05/2026</div>
        </div>
        <div id="c03-varredura" data-layout-ignore aria-hidden="true"><div id="c03-varredura-luz" data-layout-allow-overflow></div></div>

        <div id="c03-rotulo">CÂMARA DOS DEPUTADOS</div>
        ${legenda("c03-l1", leg1)}
        ${legenda("c03-l2", leg2)}
      </div>

      <script>
        (function () {
          const tl = gsap.timeline({ paused: true });
          // Parte A, foto: Ken Burns de 104% a 100%, poeira lenta, rótulo e crédito.
          tl.fromTo("#c03-foto-kb", { scale: 1.04 }, { scale: 1.0, duration: 3.5, ease: "none" }, 0);
          tl.fromTo("#c03-foto-bloco", { opacity: 0 }, { opacity: 1, duration: 0.4, ease: "bt-standard" }, 0);
          tl.fromTo("#c03-poeira", { opacity: 0, y: 0 }, { opacity: 1, y: -28, duration: ${T.fotoFim}, ease: "none" }, 0);
          tl.fromTo("#c03-rotulo", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, ease: "bt-enter" }, 0.1);
          tl.fromTo("#c03-credito", { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0.1);
          // Troca para o infográfico: a foto escurece e sai, o arco acende o contorno.
          tl.to("#c03-foto-bloco", { opacity: 0, duration: 0.4, ease: "bt-standard" }, ${T.fotoFim});
          tl.to(["#c03-poeira", "#c03-credito"], { opacity: 0, duration: 0.3 }, ${T.fotoFim});
          tl.fromTo("#c03-arco", { opacity: 0 }, { opacity: 1, duration: 0.4, ease: "bt-standard" }, ${r3(T.fotoFim + 0.1)});
          tl.fromTo("#c03-placar", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.4, ease: "bt-enter" }, ${r3(T.fotoFim + 0.2)});
          // Varredura: cada cadeira acende no instante pré-calculado, junto com os contadores.
          ${sets}
          // Quórum: a linha acende no quadro em que a contagem passa de 308.
          tl.to("#c03-quorum", { opacity: 1, strokeWidth: 7, duration: 0.15, ease: "power2.out" }, ${tQuorum});
          tl.to("#c03-quorum", { strokeWidth: 4, duration: 0.45, ease: "bt-standard" }, ${r3(tQuorum + 0.15)});
          tl.to("#c03-quorum-rot", { opacity: 1, duration: 0.2 }, ${tQuorum});
          // Varredura de luz única sobre o placar quando a contagem termina.
          tl.fromTo("#c03-varredura-luz", { x: -260 }, { x: 980, duration: 0.6, ease: "bt-standard" }, ${r3(tFim + 0.05)});
          // Legendas de amostra (na etapa c vêm da transcrição).
          tl.fromTo("#c03-l1", { opacity: 0 }, { opacity: 1, duration: 0.15 }, 0);
          ${destaque("c03-l1", leg1.flat().length, T.legenda1)}
          tl.set("#c03-l1", { opacity: 0 }, ${T.legenda2Inicio});
          tl.fromTo("#c03-l2", { opacity: 0 }, { opacity: 1, duration: 0.15 }, ${T.legenda2Inicio});
          ${destaque("c03-l2", leg2.flat().length, T.legenda2)}
          window.__timelines["c03-camara"] = tl;
        })();
      </script>
    </template>
  </body>
</html>
`;

writeFileSync(join(RAIZ, "compositions/c03-camara.html"), html);
console.log(JSON.stringify({ quorum: { posicao: q + 1, instante: tQuorum, angulo: r1((thetaQ * 180) / Math.PI) }, fimVarredura: tFim, sim: nSim, nao: nNao }));
