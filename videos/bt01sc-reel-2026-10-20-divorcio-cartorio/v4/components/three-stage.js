// Momentos 3D da V4 (Three.js r169, local em assets/vendor):
//   JudicialStamp, cena 06: carimbo documental simbólico (sem brasão), Navy fosco, sobre papel Paper,
//     luz lateral suave, câmera macro em três quartos; desce, toca, comprime pouco, assenta e sobe.
//   PublicDeed, cena 07 (depois do match cut): escritura com espessura, folhas, textura, sombra e câmera macro.
// Determinismo: a cena é função pura do tempo recebido no evento hf-seek; nada de relógio nem
// requestAnimationFrame. Texturas desenhadas em canvas com semente fixa; nenhum texto legível no papel.
import * as THREE from "../assets/vendor/three.module.js";

const D = window.BT_DATA;
const vars = (window.__hyperframes && window.__hyperframes.getVariables && window.__hyperframes.getVariables()) || {};
const R = vars.reducedMotion === true;
const W = 1080;
const H = 1920;
const COL = {
  midnight: 0x081a35,
  navy: 0x0b1f4b,
  blue: 0x214d8c,
  sky: 0x8fc5ef,
  paper: 0xfaf8f4,
  sand: 0xf4ede2,
  ink: 0x202631,
};
const scene = (id) => D.scenes.find((s) => s.id === id);
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const easeOut3 = (x) => 1 - Math.pow(1 - clamp01(x), 3);
const easeIn2 = (x) => clamp01(x) * clamp01(x);
const easeInOut = (x) => {
  const t = clamp01(x);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
const lerp = (a, b, t) => a + (b - a) * t;
const lerpV = (a, b, t) => new THREE.Vector3(lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t));

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const loader = new THREE.TextureLoader();
function tex(path, repeat) {
  const t = loader.load(path);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  return t;
}
const fiber = tex("assets/textures/paper_fibra.png", 2);
const grain = tex("assets/textures/mesa_grao.png", 6);

function makeRenderer(canvasId) {
  const canvas = document.getElementById(canvasId);
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, preserveDrawingBuffer: true });
  r.setPixelRatio(1);
  r.setSize(W, H, false);
  r.shadowMap.enabled = true;
  r.shadowMap.type = THREE.PCFSoftShadowMap;
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.toneMapping = THREE.ACESFilmicToneMapping;
  r.toneMappingExposure = 1.0;
  return r;
}

// caixa de cantos arredondados, extrudada na vertical (base em y = 0)
function roundedSlab(w, d, h, r, bevel) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -d / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + d - r);
  s.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
  s.lineTo(x + r, y + d);
  s.quadraticCurveTo(x, y + d, x, y + d - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  const g = new THREE.ExtrudeGeometry(s, {
    depth: h - 2 * bevel,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 4,
    curveSegments: 10,
  });
  g.rotateX(-Math.PI / 2);
  g.translate(0, bevel, 0);
  return g;
}

function desk(sc, color) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 40),
    new THREE.MeshStandardMaterial({ color, roughness: 0.92, roughnessMap: grain, bumpMap: grain, bumpScale: 0.6 }),
  );
  m.rotation.x = -Math.PI / 2;
  m.receiveShadow = true;
  sc.add(m);
  return m;
}

// textura de documento abstrato: barras cinza no lugar do texto (nenhuma palavra legível)
function docCanvas(opts) {
  const cw = 1024;
  const ch = Math.round(cw * opts.aspect);
  const c = document.createElement("canvas");
  c.width = cw;
  c.height = ch;
  const g = c.getContext("2d");
  g.fillStyle = "#FAF8F4";
  g.fillRect(0, 0, cw, ch);
  const r = rng(opts.seed);
  const line = (x, y, w, h, col) => {
    g.fillStyle = col;
    g.fillRect(x, y, w, h);
  };
  const mx = 96;
  let y = 110;
  if (opts.deed) {
    // escritura: margem dupla à esquerda, cabeçalho centralizado, parágrafos justificados, assinaturas
    line(70, 60, 3, ch - 120, "#C9C1B2");
    line(78, 60, 1.5, ch - 120, "#C9C1B2");
    line(cw / 2 - 210, y, 420, 26, "#3A4660");
    y += 52;
    line(cw / 2 - 150, y, 300, 14, "#8C8E94");
    y += 46;
    line(mx + 40, y, cw - 2 * mx - 80, 2, "#B9B1A2");
    y += 44;
    for (let p = 0; p < 6; p++) {
      const n = 4 + Math.floor(r() * 4);
      for (let i = 0; i < n; i++) {
        const last = i === n - 1;
        const w = last ? (0.35 + r() * 0.45) * (cw - 2 * mx) : cw - 2 * mx - (i === 0 ? 40 : 0);
        line(mx + (i === 0 ? 40 : 0), y, w, 11, "#B3AEA6");
        y += 27;
      }
      y += 22;
    }
    y = ch - 230;
    line(mx + 20, y, 330, 2, "#5D6275");
    line(cw - mx - 350, y, 330, 2, "#5D6275");
    line(mx + 90, y + 18, 190, 9, "#B3AEA6");
    line(cw - mx - 280, y + 18, 190, 9, "#B3AEA6");
  } else {
    line(mx, y, 360, 24, "#9DA1AA");
    y += 70;
    for (let i = 0; i < opts.rows; i++) {
      const w = (i % 6 === 5 ? 0.4 + r() * 0.3 : 0.86 + r() * 0.14) * (cw - 2 * mx);
      line(mx, y, w, 11, "#C4BFB6");
      y += 30;
      if (i % 6 === 5) y += 20;
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

// marca do carimbo: moldura dupla e sinal de conferido, tinta Navy com falhas (semente fixa)
function imprintCanvas() {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 636;
  const g = c.getContext("2d");
  g.strokeStyle = "#0B1F4B";
  g.lineJoin = "round";
  g.lineCap = "round";
  const rr = (x, y, w, h, r, lw) => {
    g.lineWidth = lw;
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
    g.stroke();
  };
  rr(40, 40, 944, 556, 34, 30);
  rr(92, 92, 840, 452, 18, 9);
  g.lineWidth = 44;
  g.beginPath();
  g.moveTo(372, 330);
  g.lineTo(470, 428);
  g.lineTo(664, 222);
  g.stroke();
  // desgaste da tinta
  const r = rng(571);
  g.globalCompositeOperation = "destination-out";
  for (let i = 0; i < 2600; i++) {
    const x = r() * 1024;
    const y = r() * 636;
    const s = 0.6 + r() * 2.6;
    g.globalAlpha = 0.25 + r() * 0.7;
    g.beginPath();
    g.arc(x, y, s, 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 1;
  g.globalCompositeOperation = "source-over";
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function shadowBlobTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d");
  const grd = g.createRadialGradient(128, 128, 10, 128, 128, 128);
  grd.addColorStop(0, "rgba(8,26,53,0.85)");
  grd.addColorStop(0.55, "rgba(8,26,53,0.35)");
  grd.addColorStop(1, "rgba(8,26,53,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

function lights(sc, keyPos, keyTarget, keyInt) {
  const key = new THREE.SpotLight(0xfff3e4, keyInt, 0, 0.62, 0.75, 1.2);
  key.position.set(...keyPos);
  key.target.position.set(...keyTarget);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.02;
  key.shadow.radius = 6;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 30;
  sc.add(key, key.target);
  sc.add(new THREE.HemisphereLight(0xcfe3f5, COL.midnight, 0.55));
  const rim = new THREE.DirectionalLight(COL.sky, 0.35);
  rim.position.set(3, 2.5, -4);
  sc.add(rim);
  return key;
}

// ===================== JudicialStamp (cena 06)
function JudicialStamp() {
  const S = scene("s06");
  const renderer = makeRenderer("stamp-canvas");
  const sc = new THREE.Scene();
  sc.background = new THREE.Color(COL.midnight);
  sc.fog = new THREE.Fog(COL.midnight, 7, 16);
  desk(sc, 0x10264d);
  const camera = new THREE.PerspectiveCamera(30, W / H, 0.05, 60);

  // papel: folha com espessura
  const paperTex = docCanvas({ aspect: 1.414, seed: 35, rows: 14 });
  const paper = new THREE.Mesh(
    new THREE.BoxGeometry(2.1, 0.012, 2.97),
    [
      new THREE.MeshStandardMaterial({ color: 0xe8e2d6, roughness: 0.9 }),
      new THREE.MeshStandardMaterial({ color: 0xe8e2d6, roughness: 0.9 }),
      new THREE.MeshStandardMaterial({ map: paperTex, roughness: 0.88, bumpMap: fiber, bumpScale: 0.25 }),
      new THREE.MeshStandardMaterial({ color: 0xe8e2d6, roughness: 0.9 }),
      new THREE.MeshStandardMaterial({ color: 0xe8e2d6, roughness: 0.9 }),
      new THREE.MeshStandardMaterial({ color: 0xe8e2d6, roughness: 0.9 }),
    ],
  );
  paper.position.set(0, 0.006, 0);
  paper.rotation.y = -0.08;
  paper.receiveShadow = true;
  paper.castShadow = true;
  sc.add(paper);

  const P = new THREE.Vector3(0.12, 0.0121, 0.5); // ponto de contato sobre o papel
  const imprint = new THREE.Mesh(
    new THREE.PlaneGeometry(1.0, 0.62),
    new THREE.MeshStandardMaterial({ map: imprintCanvas(), transparent: true, roughness: 0.7, opacity: 0, depthWrite: false }),
  );
  imprint.rotation.x = -Math.PI / 2;
  imprint.rotation.z = 0.1;
  imprint.position.copy(P).add(new THREE.Vector3(0, 0.0004, 0));
  imprint.receiveShadow = true;
  sc.add(imprint);

  const blob = new THREE.Mesh(
    new THREE.PlaneGeometry(1.5, 1.1),
    new THREE.MeshBasicMaterial({ map: shadowBlobTexture(), transparent: true, depthWrite: false }),
  );
  blob.rotation.x = -Math.PI / 2;
  blob.rotation.z = 0.1;
  blob.position.copy(P).add(new THREE.Vector3(0, 0.0008, 0));
  sc.add(blob);

  // carimbo: almofada de borracha, base, tampo, pescoço, faixa Sky e pegador torneado
  const navy = new THREE.MeshStandardMaterial({ color: COL.navy, roughness: 0.62, metalness: 0.0, bumpMap: fiber, bumpScale: 0.08 });
  const stamp = new THREE.Group();
  const padGroup = new THREE.Group();
  const pad = new THREE.Mesh(roundedSlab(1.0, 0.62, 0.05, 0.05, 0.008), new THREE.MeshStandardMaterial({ color: COL.ink, roughness: 0.95 }));
  padGroup.add(pad);
  stamp.add(padGroup);
  const body = new THREE.Group();
  const base = new THREE.Mesh(roundedSlab(1.08, 0.7, 0.2, 0.08, 0.03), navy);
  base.position.y = 0;
  const top = new THREE.Mesh(roundedSlab(0.82, 0.46, 0.05, 0.08, 0.02), navy);
  top.position.y = 0.2;
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 0.3, 48), navy);
  neck.position.y = 0.4;
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.101, 0.101, 0.035, 48), new THREE.MeshStandardMaterial({ color: COL.sky, roughness: 0.7 }));
  band.position.y = 0.47;
  const prof = [];
  for (let i = 0; i <= 24; i++) {
    const a = (i / 24) * Math.PI;
    prof.push(new THREE.Vector2(Math.max(0.0001, Math.sin(a) * 0.25 + (i < 4 ? 0.07 * (1 - i / 4) : 0)), -Math.cos(a) * 0.19));
  }
  const knob = new THREE.Mesh(new THREE.LatheGeometry(prof, 64), navy);
  knob.position.y = 0.74;
  [base, top, neck, band, knob].forEach((m) => body.add(m));
  body.position.y = 0.05;
  stamp.add(body);
  stamp.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  stamp.rotation.y = 0.1;
  sc.add(stamp);

  const key = lights(sc, [-5.5, 4.2, 1.8], [0.1, 0, 0.4], 62);

  // tempos (s, linha do tempo global)
  const T0 = S.start;
  const D0 = T0 + 0.1; // começa a descer
  const HIT = window.BT_DATA.words.find((w) => w.w === "comprovar").s + 0.1; // toca o papel em "comprovar"
  const LIFT = HIT + 0.78;
  const LIFT_END = LIFT + 0.42;
  const Y0 = 3.2;

  function stampY(t) {
    if (t < D0) return Y0;
    if (t < HIT) return Y0 * (1 - easeIn2((t - D0) / (HIT - D0))); // gravidade: acelera até o contato
    if (t < LIFT) return 0;
    return Y0 * 1.05 * easeIn2((t - LIFT) / (LIFT_END - LIFT));
  }
  function render(t) {
    const local = t - T0;
    let y = stampY(t);
    let squash = 1;
    let sink = 0;
    let dip = 0;
    if (!R && t >= HIT && t < LIFT) {
      const k = t - HIT;
      // compressão mínima da borracha: 0,05 s para comprimir, 0,15 s para voltar
      squash = k < 0.05 ? 1 - 0.18 * (k / 0.05) : 1 - 0.18 * (1 - easeOut3((k - 0.05) / 0.15));
      sink = (1 - squash) * 0.05;
      dip = k < 0.12 ? 0.01 * Math.sin((k / 0.12) * Math.PI) : 0;
    }
    if (R) y = 0; // reduzido: carimbo já pousado; some por corte, sem queda nem subida
    padGroup.scale.y = squash;
    body.position.y = 0.05 * squash;
    stamp.position.set(P.x, P.y + y - sink, P.z);
    stamp.rotation.z = !R && t < HIT ? 0.05 * (y / Y0) : 0;
    stamp.visible = R ? t < LIFT : y < Y0 * 1.04;
    // marca aparece no contato (escondida sob o carimbo) e fica
    const inkOn = t >= HIT ? 1 : 0;
    imprint.material.opacity = inkOn;
    imprint.scale.set(1, 1, 1);
    // sombra de contato: mais escura e menor quanto mais perto
    const h = clamp01(y / Y0);
    blob.material.opacity = stamp.visible ? lerp(0.85, 0.12, Math.sqrt(h)) : 0;
    const bs = lerp(1.0, 1.8, Math.sqrt(h));
    blob.scale.set(bs, bs, 1);
    // câmera macro em três quartos: aproxima durante a cena; depois da subida, olha a marca
    const p = R ? 0.5 : easeInOut(local / (S.end - S.start));
    const pos = lerpV([3.3, 4.6, 6.0], [2.3, 3.4, 4.4], p);
    const tgt = lerpV([0.05, 0.62, 0.15], [0.12, 0.3, 0.3], p);
    camera.position.copy(pos);
    camera.position.y -= dip;
    camera.lookAt(tgt);
    // a luz principal acompanha discretamente a câmera para manter o carimbo modelado
    key.intensity = 62;
    renderer.render(sc, camera);
  }
  return { render, start: S.start, end: S.end };
}

// ===================== PublicDeed (cena 07, depois do match cut)
function PublicDeed() {
  const S = scene("s07");
  const T0 = D.match; // match cut: o documento da ilustração vira a escritura
  const renderer = makeRenderer("deed-canvas");
  const sc = new THREE.Scene();
  sc.background = new THREE.Color(COL.midnight);
  sc.fog = new THREE.Fog(COL.midnight, 24, 40);
  desk(sc, 0x10264d);
  const camera = new THREE.PerspectiveCamera(30, W / H, 0.05, 80);

  const deed = new THREE.Group();
  const edge = new THREE.MeshStandardMaterial({ color: 0xe6dfd2, roughness: 0.92 });
  const r = rng(733);
  for (let i = 0; i < 6; i++) {
    const sheet = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.007, 2.97), edge);
    sheet.position.set((r() - 0.5) * 0.03, 0.0035 + i * 0.0075, (r() - 0.5) * 0.03);
    sheet.rotation.y = (r() - 0.5) * 0.025;
    sheet.castShadow = true;
    sheet.receiveShadow = true;
    deed.add(sheet);
  }
  // folha de cima com leve ondulação no canto (vértices deslocados, função fixa)
  const g = new THREE.PlaneGeometry(2.1, 2.97, 42, 60);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const yv = pos.getY(i);
    const cx = Math.max(0, x - 0.55) / 0.5;
    const cy = Math.max(0, -yv - 0.95) / 0.53;
    pos.setZ(i, 0.05 * cx * cx * cy * cy + 0.004 * Math.sin(x * 2.1) * Math.cos(yv * 1.3));
  }
  g.computeVertexNormals();
  const topSheet = new THREE.Mesh(
    g,
    new THREE.MeshStandardMaterial({
      map: docCanvas({ aspect: 1.414, seed: 2007, deed: true }),
      roughness: 0.86,
      bumpMap: fiber,
      bumpScale: 0.25,
      side: THREE.DoubleSide,
    }),
  );
  topSheet.rotation.x = -Math.PI / 2;
  topSheet.position.y = 0.0035 + 6 * 0.0075 + 0.001;
  topSheet.castShadow = true;
  topSheet.receiveShadow = true;
  deed.add(topSheet);
  deed.rotation.y = 0.12;
  sc.add(deed);

  const blob = new THREE.Mesh(
    new THREE.PlaneGeometry(3.2, 4.1),
    new THREE.MeshBasicMaterial({ map: shadowBlobTexture(), transparent: true, depthWrite: false }),
  );
  blob.rotation.x = -Math.PI / 2;
  blob.rotation.z = 0.12;
  blob.position.y = 0.001;
  sc.add(blob);

  lights(sc, [-5, 5.2, 2.6], [0, 0, 0.2], 70);

  const LAND = T0 + 0.12;
  function render(t) {
    const k = clamp01((t - T0) / (LAND - T0));
    // no match cut a escritura ainda assenta 4 cm sobre a mesa (pouso curto, como papel)
    const yy = R ? 0 : 0.04 * (1 - easeInOut(k));
    const slide = R ? 0 : 0.05 * (1 - easeOut3((t - LAND) / 0.35)) * (t > LAND ? 1 : 0);
    deed.position.set(slide, yy, -slide * 0.5);
    deed.rotation.x = R ? 0 : -0.02 * (1 - easeOut3(k));
    blob.material.opacity = lerp(0.6, 0.3, clamp01(yy / 0.04));
    // câmera: abre no mesmo lugar e tamanho do documento da ilustração (match cut) e se aproxima
    // até um plano macro em três quartos, rente ao papel
    const p = R ? 0 : easeInOut((t - T0) / (S.end - T0));
    const cpos = lerpV([0.0, 5.7, 14.3], [1.7, 1.55, 3.0], p);
    const tgt = lerpV([0.0, -0.12, -0.51], [0.15, 0.0, 0.35], p);
    camera.position.copy(cpos);
    camera.lookAt(tgt);
    renderer.render(sc, camera);
  }
  return { render, start: T0, end: S.end };
}

const stages = [JudicialStamp(), PublicDeed()];
function renderAt(t) {
  for (const s of stages) {
    if (t >= s.start - 0.04 && t <= s.end + 0.04) s.render(t);
  }
}
window.addEventListener("hf-seek", (e) => renderAt(e.detail.time));
// primeiro desenho de cada palco, para nenhum canvas ficar vazio
stages.forEach((s) => s.render(s.start + 0.001));
renderAt(window.__hfThreeTime || 0);
