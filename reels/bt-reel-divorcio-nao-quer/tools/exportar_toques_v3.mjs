// Exporta os instantes de toque das metades (simulação da cena 3D) para o som:
// node tools/exportar_toques_v3.mjs   (servidor estático na porta 8765) -> assets/data/toques_v3.json
import { chromium } from "/opt/node-tools/node_modules/playwright/index.mjs";
import { writeFileSync } from "node:fs";
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await page.goto("http://127.0.0.1:8765/tools/teste_alianca_v3.html");
await page.waitForFunction(() => !!window.__ALIANCA, null, { timeout: 300000, polling: 500 });
const ev = await page.evaluate(() => window.__ALIANCA.info.eventos);
const out = {};
for (const k of ["A", "B"]) {
  out[k] = {};
  for (const e of ev[k]) if (!(e.k in out[k])) out[k][e.k] = Math.round(e.t * 1000) / 1000;
}
writeFileSync("assets/data/toques_v3.json", JSON.stringify(out, null, 1) + "\n");
console.log(JSON.stringify(out));
await browser.close();
