// Capa: como a prévia, mas sem legenda, sem bolinha e sem grão (imagem limpa para a capa do Reel).
// Uso: node tools/capa.mjs <pasta-de-saída> t1 t2 ...   (servidor estático na porta 8765)
// Variável RM=1 abre a versão de movimento reduzido.
import { chromium } from "/opt/node-tools/node_modules/playwright/index.mjs";

const [out, ...ts] = process.argv.slice(2);
const URL = process.env.URL || "http://127.0.0.1:8765/index.html";
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
const erros = [];
page.on("console", (m) => {
  if (m.type() === "error" || m.type() === "warning") erros.push(m.type() + ": " + m.text());
});
page.on("pageerror", (e) => {
  erros.push("pageerror: " + e.message);
  console.log("pageerror: " + e.message);
});
await page.addInitScript((rm) => {
  window.__timelines = {};
  window.__hyperframes = { getVariables: () => ({ reducedMotion: rm }) };
}, process.env.RM === "1");
await page.goto(URL);
await page.waitForFunction(() => !!(window.__timelines && window.__timelines.main), null, { timeout: 400000, polling: 1000 });
for (const tt of ts) {
  const t = parseFloat(tt);
  await page.evaluate((t) => {
    // clipes: mostra só os que estão no ar no instante (como o HyperFrames faz)
    document.querySelectorAll(".clip").forEach((el) => {
      const s = parseFloat(el.dataset.start);
      const d = parseFloat(el.dataset.duration);
      el.style.visibility = t >= s && t < s + d ? "visible" : "hidden";
    });
    window.__timelines.main.seek(t, false);
    window.dispatchEvent(new CustomEvent("hf-seek", { detail: { time: t } }));
  }, t);
  await page.evaluate(() => document.querySelectorAll(".cap, #dot, #grain").forEach((el) => (el.style.visibility = "hidden")));
  await page.screenshot({ path: `${out}/capa_${t.toFixed(2).padStart(6, "0")}.png` });
}
console.log(JSON.stringify({ erros: erros.slice(0, 20) }, null, 1));
await browser.close();
