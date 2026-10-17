// Quadros de teste da cena 3D da V3, sem a composição: node tools/teste_alianca_v3.mjs <saída> t1 t2 ...
import { chromium } from "/opt/node-tools/node_modules/playwright/index.mjs";
const [out, ...ts] = process.argv.slice(2);
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
page.on("pageerror", (e) => console.log("pageerror: " + e.message));
page.on("console", (m) => { if (m.type() === "error") console.log("console: " + m.text()); });
await page.addInitScript((rm) => { window.__hyperframes = { getVariables: () => ({ reducedMotion: rm }) }; }, process.env.RM === "1");
await page.goto("http://127.0.0.1:8765/tools/teste_alianca_v3.html");
await page.waitForFunction(() => !!window.__ALIANCA, null, { timeout: 300000, polling: 500 });
console.log(JSON.stringify(await page.evaluate(() => { const i = { ...window.__ALIANCA.info }; return i; }), null, 0));
for (const tt of ts) {
  const t = parseFloat(tt);
  const t0 = Date.now();
  await page.evaluate((t) => { window.__ALIANCA.renderAt(t); window.__ALIANCA.anchorText(t); }, t);
  await page.screenshot({ path: `${out}/a_${t.toFixed(2).padStart(6, "0")}.png` });
  console.log("t", t, "ms", Date.now() - t0);
}
await browser.close();
