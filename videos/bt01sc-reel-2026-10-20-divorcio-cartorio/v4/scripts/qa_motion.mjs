// Mede o movimento quadro a quadro na timeline GSAP (30 fps): bolinha condutora e câmeras 2.5D.
// Critérios do manual (references/bolinha.md): nenhum salto isolado, sem inversão brusca de direção.
// Uso: NODE_PATH=<pasta com playwright-core> node scripts/qa_motion.mjs [chromium]
// Escreve output/qa_motion_v4.json.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright-core");
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const exe = process.argv[2] || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".woff2": "font/woff2", ".png": "image/png", ".wav": "audio/wav", ".mp4": "video/mp4", ".json": "application/json" };

const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split("?")[0]));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) {
    res.writeHead(404);
    return res.end();
  }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(p)] || "application/octet-stream" });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;

const browser = await chromium.launch({ executablePath: exe, args: ["--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
page.on("pageerror", (e) => console.log("[pageerror]", e.message));
await page.goto(`http://localhost:${port}/index.html`);
await page.waitForFunction(() => !!(window.__timelines && window.__timelines.main), null, { timeout: 120000, polling: 500 });

const result = await page.evaluate(() => {
  const tl = window.__timelines.main;
  const D = window.BT_DATA;
  const cuts = D.scenes.map((s) => s.start).concat([18.2]);
  const FPS = 30;
  const track = (sel, from, to, props) => {
    const out = [];
    for (let f = Math.round(from * FPS); f <= Math.round(to * FPS); f++) {
      tl.seek(f / FPS, false);
      const o = { t: +(f / FPS).toFixed(3) };
      props.forEach((p) => (o[p] = gsap.getProperty(sel, p)));
      out.push(o);
    }
    return out;
  };
  const nearCut = (t) => cuts.some((c) => Math.abs(t - c) < 0.05);
  // bolinha: deslocamento por quadro, saltos e inversões
  const dot = track("#dot-b", 23.4, 29.9, ["x", "y", "opacity"]);
  let maxStep = 0;
  let maxAt = 0;
  let reversals = 0;
  const jumps = [];
  for (let i = 1; i < dot.length; i++) {
    const a = dot[i - 1];
    const b = dot[i];
    if (a.opacity < 0.05 && b.opacity < 0.05) continue;
    const d = Math.hypot(b.x - a.x, b.y - a.y);
    if (b.opacity > 0.05 && a.opacity > 0.05 && d > maxStep) {
      maxStep = d;
      maxAt = b.t;
    }
    if (i > 1) {
      const p = dot[i - 2];
      const v1 = [a.x - p.x, a.y - p.y];
      const v2 = [b.x - a.x, b.y - a.y];
      const m1 = Math.hypot(...v1);
      const m2 = Math.hypot(...v2);
      if (m1 > 4 && m2 > 4 && (v1[0] * v2[0] + v1[1] * v2[1]) / (m1 * m2) < -0.5) reversals++;
      // salto isolado: um quadro muito maior que os vizinhos
      if (m2 > 40 && m2 > 3 * Math.max(m1, 1)) jumps.push({ t: b.t, step: +m2.toFixed(1) });
    }
  }
  // câmeras 2.5D: variação por quadro fora dos cortes
  const cams = {};
  [
    ["#s04-world", 5.98, 10.6],
    ["#s05-world", 10.63, 13.66],
    ["#s07-world", 16.33, 18.18],
  ].forEach(([sel, a, b]) => {
    const tr = track(sel, a, b, ["x", "y", "scale"]);
    let worst = { step: 0, t: 0 };
    const cutJumps = [];
    for (let i = 1; i < tr.length; i++) {
      const d = Math.hypot(tr[i].x - tr[i - 1].x, tr[i].y - tr[i - 1].y) + 1000 * Math.abs(tr[i].scale - tr[i - 1].scale);
      if (nearCut(tr[i].t) || Math.abs(tr[i].t - 17.28) < 0.05) {
        if (d > 60) cutJumps.push({ t: tr[i].t, step: +d.toFixed(1) });
        continue;
      }
      if (d > worst.step) worst = { step: +d.toFixed(1), t: tr[i].t };
    }
    cams[sel] = { maxStepOutsideCuts: worst, intendedCuts: cutJumps };
  });
  return { dot: { frames: dot.length, maxStepPx: +maxStep.toFixed(1), maxAt, reversals, isolatedJumps: jumps }, cameras: cams };
});

fs.writeFileSync(path.join(ROOT, "output/qa_motion_v4.json"), JSON.stringify(result, null, 1));
console.log(JSON.stringify(result, null, 1));
await browser.close();
server.close();
