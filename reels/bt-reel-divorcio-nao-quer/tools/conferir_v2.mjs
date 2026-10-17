// Conferência automática do v2: bolinha quadro a quadro (posição na tela, já com a câmera global),
// legenda dentro da faixa, texto dentro das margens seguras. Abre o index.html num Chromium e
// percorre a linha do tempo. Texto com opacidade abaixo de 0,25 (contexto apagado) não conta.
// Uso: node tools/conferir_v2.mjs   (com um servidor estático servindo a pasta do projeto na porta 8765)
import { chromium } from "/opt/node-tools/node_modules/playwright/index.mjs";

const URL = process.env.URL || "http://127.0.0.1:8765/index.html";
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined, args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await page.addInitScript(() => {
  window.__timelines = {};
});
await page.goto(URL);
await page.waitForFunction(() => !!(window.__timelines && window.__timelines.main), null, { timeout: 400000, polling: 1000 });

const res = await page.evaluate(() => {
  const tl = window.__timelines.main;
  const D = window.BT_DADOS;
  const out = { bolinha: {}, legenda: [], margens: [] };
  // 1. bolinha: deslocamento por quadro a 30 fps e inversões bruscas
  const FPS = 30;
  const dur = parseFloat(document.getElementById("dot").dataset.start) + parseFloat(document.getElementById("dot").dataset.duration);
  let prev = null;
  let prevV = null;
  let maxStep = 0;
  let maxAt = 0;
  const saltos = [];
  const inversoes = [];
  for (let f = 0; f <= dur * FPS; f++) {
    tl.seek(f / FPS, false);
    const rb = document.getElementById("dot-b").getBoundingClientRect();
    const x = rb.left + rb.width / 2;
    const y = rb.top + rb.height / 2;
    const o = gsap.getProperty("#dot-b", "opacity");
    if (prev && o > 0.05 && prev.o > 0.05) {
      const dx = x - prev.x;
      const dy = y - prev.y;
      const step = Math.hypot(dx, dy);
      if (step > maxStep) {
        maxStep = step;
        maxAt = f / FPS;
      }
      if (step > 140) saltos.push({ t: +(f / FPS).toFixed(3), step: +step.toFixed(1) });
      if (prevV && step > 6 && Math.hypot(prevV.dx, prevV.dy) > 6) {
        const cos = (dx * prevV.dx + dy * prevV.dy) / (step * Math.hypot(prevV.dx, prevV.dy));
        if (cos < -0.5) inversoes.push({ t: +(f / FPS).toFixed(3), cos: +cos.toFixed(2) });
      }
      prevV = { dx, dy };
    } else prevV = null;
    prev = { x, y, o };
  }
  out.bolinha = { maxPassoPx: +maxStep.toFixed(1), em: +maxAt.toFixed(3), saltosAcimaDe140px: saltos, inversoesBruscas: inversoes };
  // 2. legenda: cada bloco no meio do seu tempo, todas as linhas dentro da faixa e da coluna
  const r0 = document.getElementById("root").getBoundingClientRect();
  D.legendas.forEach((b, k) => {
    tl.seek((b.ini + b.fim) / 2, false);
    const lines = document.querySelectorAll("#ct-" + k + " .ln");
    let x0 = 1e9;
    let x1 = -1e9;
    let y0 = 1e9;
    let y1 = -1e9;
    lines.forEach((ln) => {
      const rg = document.createRange();
      rg.selectNodeContents(ln);
      const r = rg.getBoundingClientRect();
      x0 = Math.min(x0, r.left - r0.left);
      x1 = Math.max(x1, r.right - r0.left);
      y0 = Math.min(y0, r.top - r0.top);
      y1 = Math.max(y1, r.bottom - r0.top);
    });
    const ok = x0 >= 96 - 0.5 && x1 <= 904 + 0.5 && y0 >= 1240 && y1 <= 1460;
    out.legenda.push({ bloco: k + 1, x0: Math.round(x0), x1: Math.round(x1), y0: Math.round(y0), y1: Math.round(y1), ok });
  });
  // 3. margens seguras: nenhum texto visível fora de 60 / 250 / 300 px, amostrado a cada 0,25 s
  const vis = (el) => {
    let e = el;
    while (e && e !== document.body) {
      const cs = getComputedStyle(e);
      if (cs.visibility === "hidden" || cs.display === "none" || parseFloat(cs.opacity) < 0.25) return false;
      e = e.parentElement;
    }
    return true;
  };
  const textos = Array.from(document.querySelectorAll(".category, .title .l, .way-name, .way-sup, .item-name, .proc-label, #s2-word, .co-label, #s7-sup, #s7-sup2, #s8-center p, #s8-ig-handle, .cap-text .ln"));
  const falhas = new Map();
  for (let tt = 0; tt <= D.duracao - 0.05; tt += 0.25) {
    tl.seek(tt, false);
    for (const el of textos) {
      if (el.closest("#s4-world") && tt > D.palavras.find((w) => w.texto === "impede").ini) continue; // ancorado no mundo durante a queda (ajuste A4)
      if (el.closest("#s4-inner, #s5-inner, #s6-inner") && Math.abs(tt - D.cortes.c56) < 0.25) continue; // chicote vertical
      const clip = el.closest(".clip");
      if (clip) {
        const s = parseFloat(clip.dataset.start);
        const d = parseFloat(clip.dataset.duration);
        if (tt < s || tt > s + d) continue;
      }
      if (!vis(el)) continue;
      // linha de título com todas as palavras ainda invisíveis (entram palavra a palavra)
      const ws = el.querySelectorAll(".w");
      if (ws.length && Array.from(ws).every((w) => parseFloat(getComputedStyle(w).opacity) < 0.25)) continue;
      const rg = document.createRange();
      rg.selectNodeContents(el);
      const r = rg.getBoundingClientRect();
      if (!r.width) continue;
      const L = r.left - r0.left;
      const R = r.right - r0.left;
      const T = r.top - r0.top;
      const B = r.bottom - r0.top;
      if (L < 60 || R > 1020 || T < 250 || B > 1620) {
        const key = (el.id || el.className) + ":" + el.textContent.slice(0, 30);
        if (!falhas.has(key)) falhas.set(key, { t: tt, L: Math.round(L), R: Math.round(R), T: Math.round(T), B: Math.round(B) });
      }
    }
  }
  out.margens = Array.from(falhas.entries()).map(([k, v]) => ({ elemento: k, ...v }));
  return out;
});
console.log(JSON.stringify(res, null, 1));
await browser.close();
