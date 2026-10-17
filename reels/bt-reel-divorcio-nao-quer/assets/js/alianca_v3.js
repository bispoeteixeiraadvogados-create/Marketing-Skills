// Aliança 3D do Reel BT "Seu cônjuge diz NÃO ao divórcio?", versão V3 (segunda revisão).
// Cena Three.js determinística: nada de relógio, nada de requestAnimationFrame, nada de
// Math.random. Toda a queda é pré-calculada a passo fixo e guardada em curvas; cada quadro só lê
// as curvas no instante pedido pelo HyperFrames (evento hf-seek).
// O que vem da V2: a malha procedural (secção amostrada, dois cortes irregulares em cerca de 1 h e
// 7 h, faces de fratura rugosas), as rachaduras em fita e a ideia da câmera que acompanha a queda.
// O que muda na V3: secção abaulada com chanfro suave (aliança de conforto), metal acetinado PBR
// com ambiente de estúdio procedural fixo no mundo, luz principal quente, preenchimento azul e luz
// de recorte, tensão de 6 quadros antes da ruptura, queda com gravidade, toque por uma quina,
// assentamento com recuperação pequena, sombra de contato que endurece perto do chão, desfoque de
// movimento por subquadros e o piso Sand que entra no quadro com a descida (a passagem do azul
// para o areia é provocada pela queda).
import * as THREE from "three";

const D = window.BT_DADOS;
const AL = D.alianca;
const CUT = D.cortes;
const vars = (window.__hyperframes && window.__hyperframes.getVariables && window.__hyperframes.getVariables()) || {};
const RM = vars.reducedMotion === true;

// ---------------------------------------------------------------- tempos (presos à fala)
const T_NAO1 = AL.T_NAO1; // a fissura salta no primeiro "não"
const T_BRK = AL.T_BRK; // ruptura, no início de "divórcio"
const T_TENS = T_BRK - 0.2; // tensão: 6 quadros de vibração e fissura completa
const T_HIT = AL.T_HIT; // primeiro toque (metade A), junto do "NÃO" da resposta
const T_HIT_B = T_HIT + 0.1; // a metade B toca 3 quadros depois
const T_TOP = CUT.c23 + 0.25; // a câmera termina de subir para a vista de cima
const T_END = CUT.c34 + 0.06; // fim da cena 3D (corte para a fotografia)

// ---------------------------------------------------------------- utilidades
const W = 1080;
const H = 1920;
const SS = 2; // supersampling 2x
const DEG = Math.PI / 180;
const FOV = 35;
const FPX = H / 2 / Math.tan((FOV / 2) * DEG); // distância focal em pixels do quadro 1080 x 1920
let seed = 17102026;
const rnd = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const smooth = (x) => {
  x = clamp(x, 0, 1);
  return x * x * (3 - 2 * x);
};
function bezier(x1, y1, x2, y2) {
  const bx = (s) => 3 * x1 * s * (1 - s) ** 2 + 3 * x2 * s * s * (1 - s) + s ** 3;
  const by = (s) => 3 * y1 * s * (1 - s) ** 2 + 3 * y2 * s * s * (1 - s) + s ** 3;
  return (x) => {
    x = clamp(x, 0, 1);
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 30; i++) {
      const m = (lo + hi) / 2;
      if (bx(m) < x) lo = m;
      else hi = m;
    }
    return by((lo + hi) / 2);
  };
}
const easeInOut = bezier(0.45, 0, 0.25, 1); // curva BT inOut
const easeOut = bezier(0.16, 1, 0.3, 1); // curva BT enter
const easeIn = bezier(0.5, 0, 0.9, 0.4);
const seg = (t, a, b, f) => (f || easeInOut)((t - a) / (b - a));
const V3 = THREE.Vector3;
const Q = THREE.Quaternion;
const AXX = new V3(1, 0, 0);
const AXY = new V3(0, 1, 0);
const AXZ = new V3(0, 0, 1);
const qAxis = (ax, a) => new Q().setFromAxisAngle(ax, a);

// ---------------------------------------------------------------- renderizador (fora da tela)
// o WebGL desenha em 2160 x 3840; o canvas visível (2D, 1080 x 1920) recebe a média dos subquadros
const glCanvas = document.createElement("canvas");
glCanvas.width = W * SS;
glCanvas.height = H * SS;
const renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: false, alpha: false, preserveDrawingBuffer: true, powerPreference: "high-performance" });
renderer.setPixelRatio(1);
renderer.setSize(W * SS, H * SS, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.VSMShadowMap;
const outCanvas = document.getElementById("ring-out");
const ctx = outCanvas.getContext("2d");
ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = "high";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(FOV, W / H, 0.1, 400);

// ---------------------------------------------------------------- paleta (sRGB do Design System)
const SRGB = {
  midnight: [8, 26, 53],
  navy: [11, 31, 75],
  sand: [244, 237, 226],
};
const v3c = (c) => new V3(c[0] / 255, c[1] / 255, c[2] / 255);

// ---------------------------------------------------------------- secção da aliança (perfil)
// aliança de conforto: face externa abaulada (raio 1,000 no meio, 0,965 nas bordas), face interna
// também abaulada para dentro (0,835 no meio, 0,855 nas bordas), largura 0,44 e chanfro suave
// (suavização gaussiana de cerca de 0,02 ao longo do contorno). Raio externo = 1 unidade.
const HW = 0.22;
const NP = 160; // pontos da secção
const NA = 120; // passos angulares por metade
const PROF = (() => {
  const poly = [];
  const roE = 0.965;
  const riE = 0.855;
  const N1 = 24;
  const N2 = 72;
  for (let i = 0; i < N1; i++) poly.push([riE + ((roE - riE) * i) / N1, HW]);
  for (let i = 0; i < N2; i++) {
    const z = HW - (2 * HW * i) / N2;
    poly.push([roE + (1.0 - roE) * (1 - (z / HW) ** 2), z]);
  }
  for (let i = 0; i < N1; i++) poly.push([roE - ((roE - riE) * i) / N1, -HW]);
  for (let i = 0; i < N2; i++) {
    const z = -HW + (2 * HW * i) / N2;
    poly.push([riE - (riE - 0.835) * (1 - (z / HW) ** 2), z]);
  }
  // reamostra por comprimento de arco
  const resample = (pts, n) => {
    const L = [0];
    for (let i = 1; i <= pts.length; i++) {
      const a = pts[i - 1];
      const b = pts[i % pts.length];
      L.push(L[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1]));
    }
    const tot = L[pts.length];
    const out = [];
    let k = 0;
    for (let j = 0; j < n; j++) {
      const s = (tot * j) / n;
      while (L[k + 1] < s) k++;
      const f = (s - L[k]) / (L[k + 1] - L[k] || 1);
      const a = pts[k];
      const b = pts[(k + 1) % pts.length];
      out.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]);
    }
    return { out, tot };
  };
  const { out: dense, tot } = resample(poly, 720);
  const ds = tot / dense.length;
  const SIG = 0.02;
  const R = Math.ceil((3 * SIG) / ds);
  const sm = dense.map((_, i) => {
    let sr = 0;
    let sz = 0;
    let sw = 0;
    for (let k = -R; k <= R; k++) {
      const p = dense[(i + k + dense.length) % dense.length];
      const w = Math.exp(-0.5 * ((k * ds) / SIG) ** 2);
      sr += p[0] * w;
      sz += p[1] * w;
      sw += w;
    }
    return [sr / sw, sz / sw];
  });
  const { out: pts } = resample(sm, NP);
  return pts.map((p, j) => {
    const a = pts[(j - 1 + NP) % NP];
    const b = pts[(j + 1) % NP];
    let tr = b[0] - a[0];
    let tz = b[1] - a[1];
    const l = Math.hypot(tr, tz);
    tr /= l;
    tz /= l;
    return { r: p[0], z: p[1], nr: -tz, nz: tr, u: j / NP };
  });
})();
function profileAt(u) {
  const f = (((u % 1) + 1) % 1) * NP;
  const i = Math.floor(f);
  const a = f - i;
  const p = PROF[i % NP];
  const q = PROF[(i + 1) % NP];
  const nr = p.nr + (q.nr - p.nr) * a;
  const nz = p.nz + (q.nz - p.nz) * a;
  const l = Math.hypot(nr, nz);
  return { r: p.r + (q.r - p.r) * a, z: p.z + (q.z - p.z) * a, nr: nr / l, nz: nz / l };
}
const CEN = { r: 0.918, z: 0 };

// ---------------------------------------------------------------- cortes (iguais aos da V2)
function makeCut(theta, knots, center) {
  return { theta: theta * DEG, knots, center: center * DEG };
}
const CUT1 = makeCut(28, [[0, 0], [0.09, 1.7], [0.21, -0.8], [0.34, 1.4], [0.49, -1.5], [0.63, 0.9], [0.8, -1.2], [1, 0]], 0.4);
const CUT2 = makeCut(212, [[0, 0], [0.12, -1.3], [0.27, 1.1], [0.4, -0.7], [0.58, 1.6], [0.74, -1.0], [0.88, 0.8], [1, 0]], -0.3);
function delta(cut, u) {
  u = ((u % 1) + 1) % 1;
  const k = cut.knots;
  for (let i = 1; i < k.length; i++) {
    if (u <= k[i][0]) {
      const f = (u - k[i - 1][0]) / (k[i][0] - k[i - 1][0]);
      return (k[i - 1][1] + (k[i][1] - k[i - 1][1]) * f) * DEG;
    }
  }
  return 0;
}
const LEVELS = [0, 0.3, 0.58, 0.82];
function rugTable() {
  const tb = [];
  for (let l = 0; l < LEVELS.length; l++) {
    const row = [];
    for (let j = 0; j < NP; j++) row.push(l === 0 ? 0 : (rnd() - 0.5) * 1.3 * DEG);
    tb.push(row);
  }
  return tb;
}
CUT1.rug = rugTable();
CUT2.rug = rugTable();
const P3 = (r, z, th) => new V3(r * Math.sin(th), r * Math.cos(th), z);

function orient(g, tri, ref) {
  const p = g.attributes.position;
  const ix = g.index.array;
  const a = new V3().fromBufferAttribute(p, ix[tri * 3]);
  const b = new V3().fromBufferAttribute(p, ix[tri * 3 + 1]);
  const c = new V3().fromBufferAttribute(p, ix[tri * 3 + 2]);
  const n = b.sub(a).cross(c.sub(a));
  if (n.dot(ref) < 0) {
    for (let k = 0; k < ix.length; k += 3) {
      const tmp = ix[k + 1];
      ix[k + 1] = ix[k + 2];
      ix[k + 2] = tmp;
    }
  }
}
function bandGeometry(cA, cB, wrap) {
  const pos = [];
  const nor = [];
  const uv = [];
  const idx = [];
  for (let j = 0; j < NP; j++) {
    const p = PROF[j];
    const a = cA.theta + delta(cA, p.u);
    const b = cB.theta + delta(cB, p.u) + (wrap ? 2 * Math.PI : 0);
    for (let i = 0; i <= NA; i++) {
      const th = a + ((b - a) * i) / NA;
      const v = P3(p.r, p.z, th);
      pos.push(v.x, v.y, v.z);
      nor.push(p.nr * Math.sin(th), p.nr * Math.cos(th), p.nz);
      uv.push((th / (2 * Math.PI)) * 6.0, p.u);
    }
  }
  const id = (j, i) => (j % NP) * (NA + 1) + i;
  for (let j = 0; j < NP; j++) {
    for (let i = 0; i < NA; i++) {
      idx.push(id(j, i), id(j + 1, i), id(j, i + 1));
      idx.push(id(j + 1, i), id(j + 1, i + 1), id(j, i + 1));
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  orient(g, 0, new V3(nor[0], nor[1], nor[2]));
  return g;
}
function capPoint(cut, j, l, wrap) {
  const p = PROF[j % NP];
  const s = LEVELS[l];
  const r = CEN.r + (p.r - CEN.r) * (1 - s);
  const z = CEN.z + (p.z - CEN.z) * (1 - s);
  const th = cut.theta + delta(cut, p.u) * (1 - s) + cut.center * s + cut.rug[l][j % NP] + (wrap ? 2 * Math.PI : 0);
  return P3(r, z, th);
}
function capGeometry(cut, outwardSign, wrap) {
  const pos = [];
  const idx = [];
  for (let l = 0; l < LEVELS.length; l++) {
    for (let j = 0; j < NP; j++) {
      const v = capPoint(cut, j, l, wrap);
      pos.push(v.x, v.y, v.z);
    }
  }
  const cv = P3(CEN.r, CEN.z, cut.theta + cut.center + (wrap ? 2 * Math.PI : 0));
  pos.push(cv.x, cv.y, cv.z);
  const ci = LEVELS.length * NP;
  const id = (l, j) => l * NP + (j % NP);
  for (let l = 0; l < LEVELS.length - 1; l++) {
    for (let j = 0; j < NP; j++) {
      idx.push(id(l, j), id(l + 1, j), id(l, j + 1));
      idx.push(id(l + 1, j), id(l + 1, j + 1), id(l, j + 1));
    }
  }
  for (let j = 0; j < NP; j++) idx.push(id(LEVELS.length - 1, j), ci, id(LEVELS.length - 1, j + 1));
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  const tangent = new V3(Math.cos(cut.theta), -Math.sin(cut.theta), 0).multiplyScalar(outwardSign);
  orient(g, 0, tangent);
  g.computeVertexNormals();
  return g;
}

// ---------------------------------------------------------------- material: metal acetinado
// Gold do Design System como cor base do metal, rugosidade 0,36 (acetinado: brilho largo e macio,
// sem espelho e sem glitter). A face da fratura é mais escura e áspera.
const goldMat = new THREE.MeshPhysicalMaterial({
  color: new THREE.Color("#D8B27C"),
  metalness: 1,
  roughness: 0.36,
  anisotropy: 0.35,
  anisotropyRotation: Math.PI / 2,
  envMapIntensity: 1.0,
});
const capMat = new THREE.MeshStandardMaterial({ color: new THREE.Color("#9A7A55"), metalness: 1, roughness: 0.8, flatShading: true, envMapIntensity: 0.7 });

function makeHalf(cA, cB, wrap) {
  const band = bandGeometry(cA, cB, wrap);
  const capA = capGeometry(cA, -1, false);
  const capB = capGeometry(cB, +1, wrap);
  const p = band.attributes.position;
  const cen = new V3();
  for (let i = 0; i < p.count; i++) cen.add(new V3().fromBufferAttribute(p, i));
  cen.divideScalar(p.count);
  for (const g of [band, capA, capB]) g.translate(-cen.x, -cen.y, -cen.z);
  const grp = new THREE.Group();
  for (const [g, m] of [
    [band, goldMat],
    [capA, capMat],
    [capB, capMat],
  ]) {
    const mesh = new THREE.Mesh(g, m);
    mesh.castShadow = true;
    grp.add(mesh);
  }
  scene.add(grp);
  const sample = [];
  for (let i = 0; i < p.count; i += 2) sample.push(new V3().fromBufferAttribute(p, i));
  return { grp, cen, sample };
}
const HALF_A = makeHalf(CUT1, CUT2, false); // metade direita (de 1 h a 7 h)
const HALF_B = makeHalf(CUT2, CUT1, true); // metade esquerda (de 7 h a 1 h)
function lowest(half, q, pos) {
  let m = Infinity;
  let arg = null;
  const v = new V3();
  for (const s of half.sample) {
    v.copy(s).applyQuaternion(q);
    if (v.y < m) {
      m = v.y;
      arg = s;
    }
  }
  return { y: m + (pos ? pos.y : 0), local: arg };
}

// ---------------------------------------------------------------- ambiente de estúdio (reflexos)
// cena procedural fixa no mundo, convertida em mapa de ambiente: fundo escuro azulado, caixa de
// luz quente grande à esquerda (luz principal), faixa fria estreita atrás à direita (recorte),
// painel suave no alto e o rebatimento quente do piso. Os reflexos não mudam de um quadro para o
// outro porque o ambiente não se move.
{
  const env = new THREE.Scene();
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(40, 48, 24),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      vertexShader: "varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }",
      fragmentShader: `varying vec3 vP;
        void main(){
          float y = normalize(vP).y;
          vec3 top = vec3(0.035,0.045,0.075);
          vec3 hor = vec3(0.11,0.12,0.16);
          vec3 bot = vec3(0.42,0.36,0.27);
          vec3 c = y > 0.0 ? mix(hor, top, smoothstep(0.0,0.7,y)) : mix(hor, bot, smoothstep(0.0,-0.5,y));
          gl_FragColor = vec4(c,1.0);
        }`,
    }),
  );
  env.add(dome);
  const panel = (w, h, pos, col, k) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(col[0] * k, col[1] * k, col[2] * k), side: THREE.DoubleSide }));
    m.position.set(pos[0], pos[1], pos[2]);
    m.lookAt(0, 0, 0);
    env.add(m);
  };
  panel(16, 11, [-20, 13, 12], [1.0, 0.86, 0.7], 5.2); // principal, quente
  panel(3.2, 20, [17, 7, -15], [0.82, 0.9, 1.0], 4.2); // recorte, frio
  panel(22, 22, [0, 26, 2], [0.62, 0.64, 0.72], 1.15); // alto, suave
  panel(9, 7, [15, 3, 15], [0.45, 0.6, 0.95], 0.75); // preenchimento azul
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(env, 0.0).texture;
  pm.dispose();
}

// ---------------------------------------------------------------- luzes
const KEY_DIR = new V3(-0.62, 0.74, 0.32).normalize();
const key = new THREE.DirectionalLight(new THREE.Color("#FFE3C2"), 2.0);
key.position.copy(KEY_DIR).multiplyScalar(30);
key.target.position.set(0, 0, 0.8);
key.castShadow = true;
key.shadow.mapSize.set(1024, 1024);
key.shadow.radius = 5;
key.shadow.blurSamples = 8;
key.shadow.bias = -0.0005;
const shc = key.shadow.camera;
shc.left = -6;
shc.right = 6;
shc.top = 6;
shc.bottom = -6;
shc.near = 5;
shc.far = 60;
scene.add(key, key.target);
const rim = new THREE.DirectionalLight(new THREE.Color("#DCE7FF"), 1.4);
rim.position.copy(new V3(0.7, 0.35, -0.62).normalize().multiplyScalar(30));
scene.add(rim);
scene.add(new THREE.HemisphereLight(new THREE.Color("#8FB4E0"), new THREE.Color("#0B1F4B"), 0.18));

// ---------------------------------------------------------------- aliança inteira no gancho
const Y0 = 4.4; // altura do centro da aliança sobre o piso
const RING0 = new V3(0, Y0, 0);
const TILT0 = -12 * DEG;
function yawAt(time) {
  if (RM) return -32 * DEG;
  return lerp(-38, -29, easeOut(clamp(time / T_BRK, 0, 1))) * DEG;
}
// giro da aliança em torno do próprio eixo: leva a fissura 1 (cerca de 1 h no modelo) para cerca de
// 2 h 40 no quadro, onde a face externa está de frente para a câmera e a fissura se lê no celular
const ROLL0 = -52 * DEG;
function qRing(time) {
  return qAxis(AXY, yawAt(Math.min(time, T_BRK))).multiply(qAxis(AXX, TILT0)).multiply(qAxis(AXZ, ROLL0));
}
// direção para fora de cada metade, no plano da aliança (para a abertura e a separação)
function outLocal(half) {
  const v = half.cen.clone();
  v.z = 0;
  return v.normalize();
}
const OUT_A = outLocal(HALF_A);
const OUT_B = outLocal(HALF_B);
const OPEN = 0.008; // a fissura 1 abre cerca de 2,5 px na tensão
function openAt(time) {
  return RM ? 0 : OPEN * smooth((time - T_TENS) / (T_BRK - T_TENS));
}
function vibAt(time) {
  if (RM || time < T_TENS || time >= T_BRK) return new V3();
  const k = smooth((time - T_TENS) / 0.08);
  const a = 0.0062 * k;
  return new V3(a * Math.sin(2 * Math.PI * 27 * time), a * Math.sin(2 * Math.PI * 31 * time + 1.3), 0);
}
function staticPose(half, out, time) {
  const q = qRing(time);
  const off = half.cen.clone().addScaledVector(out, openAt(time)).applyQuaternion(q);
  return { p: RING0.clone().add(off).add(vibAt(time)), q };
}

// ---------------------------------------------------------------- rachaduras
const crackMat = new THREE.MeshBasicMaterial({ color: new THREE.Color("#081A35"), transparent: true, opacity: 0.92, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, toneMapped: false });
const crackShadeMat = new THREE.MeshBasicMaterial({ color: new THREE.Color("#081A35"), transparent: true, opacity: 0.22, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1, toneMapped: false });
const ringGroup = new THREE.Group();
scene.add(ringGroup);
// fita que nasce em u0 (meio da face externa) e cresce para os dois lados pelo caminho do corte
function crackRibbon(cut, width, mat, u0, dir) {
  const N = 240;
  const pts = [];
  for (let k = 0; k <= N; k++) {
    const u = u0 + (dir * 0.5 * k) / N;
    const p = profileAt(u);
    const th = cut.theta + delta(cut, u);
    pts.push({ pos: P3(p.r, p.z, th), n: new V3(p.nr * Math.sin(th), p.nr * Math.cos(th), p.nz).normalize() });
  }
  const pos = [];
  const idx = [];
  for (let k = 0; k <= N; k++) {
    const a = pts[Math.max(0, k - 1)].pos;
    const b = pts[Math.min(N, k + 1)].pos;
    const tg = b.clone().sub(a).normalize();
    const taper = Math.min(1, k / 8 + 0.35) * (1 - 0.35 * (k / N));
    const side = new V3().crossVectors(pts[k].n, tg).normalize().multiplyScalar((width / 2) * taper);
    const base = pts[k].pos.clone().addScaledVector(pts[k].n, 0.002);
    const l = base.clone().add(side);
    const r = base.clone().sub(side);
    pos.push(l.x, l.y, l.z, r.x, r.y, r.z);
    if (k < N) idx.push(2 * k, 2 * k + 1, 2 * k + 2, 2 * k + 1, 2 * k + 3, 2 * k + 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.setDrawRange(0, 0);
  const m = new THREE.Mesh(g, mat);
  m.renderOrder = 2;
  ringGroup.add(m);
  return { m, N };
}
const U_OUT = 0.3; // meio da face externa, na secção
const W_CRACK = 0.0125; // cerca de 4 px no quadro do gancho
const CRACKS = {
  c1: [crackRibbon(CUT1, W_CRACK, crackMat, U_OUT, 1), crackRibbon(CUT1, W_CRACK, crackMat, U_OUT, -1), crackRibbon(CUT1, W_CRACK * 3.4, crackShadeMat, U_OUT, 1), crackRibbon(CUT1, W_CRACK * 3.4, crackShadeMat, U_OUT, -1)],
  c2: [crackRibbon(CUT2, W_CRACK, crackMat, U_OUT, 1), crackRibbon(CUT2, W_CRACK, crackMat, U_OUT, -1), crackRibbon(CUT2, W_CRACK * 3.4, crackShadeMat, U_OUT, 1), crackRibbon(CUT2, W_CRACK * 3.4, crackShadeMat, U_OUT, -1)],
};
function setCrack(cr, prog) {
  for (const c of cr) c.m.geometry.setDrawRange(0, Math.round(clamp(prog, 0, 1) * c.N) * 6);
}
function crackProgress(time) {
  if (RM) return time < T_NAO1 ? [0.35, 0] : [1, 1];
  // já visível no quadro 0 (fio curto na face externa), salto no primeiro "não", completa na tensão
  let p1 = 0.24 + 0.1 * seg(time, 0, 0.5, easeOut);
  p1 += 0.34 * seg(time, T_NAO1 - 0.02, T_NAO1 + 0.18, easeOut);
  p1 += 0.32 * seg(time, T_TENS - 0.06, T_BRK - 0.02, easeIn);
  const p2 = seg(time, T_TENS - 0.04, T_BRK - 0.01, easeIn);
  return [p1, p2];
}

// ---------------------------------------------------------------- queda pré-calculada
// Cinemática por metade: voo balístico (gravidade única, velocidade inicial resolvida para o toque
// cair no tempo de projeto) com rotação de velocidade angular constante até a pose de toque; no
// toque, a metade encosta por uma quina inclinada e tomba sobre ela (gira em torno do ponto de
// contato com a gravidade), bate deitada, recupera pouco (restituição 0,12) e assenta; o atrito
// leva o deslize curto até parar. Passo fixo de 1/480 s.
const DT = 1 / 480;
const NB = Math.ceil((T_END + 0.2 - T_BRK) / DT) + 1;
const G = 8.4; // gravidade estilizada (unidades/s²; raio externo = 1)
// deitada: eixo da aliança na vertical e o corte na vertical da tela (vista de cima), "(  )"
const flat = (yaw) => qAxis(AXY, yaw).multiply(qAxis(AXX, -Math.PI / 2)).multiply(qAxis(AXZ, 28 * DEG));
// arranjo final, de cima: "(  )" com um vão, centro do arranjo perto de (0, 0,7)
const FALL = {
  A: { half: HALF_A, out: OUT_A, tc: T_HIT, yawF: -9 * DEG, ring: new V3(0.3, 0, 0.78), tiltAx: new V3(0, 1, 0.25).normalize(), tilt: 15 * DEG, slide: new V3(0.11, 0, 0.03), spin: -5 * DEG },
  B: { half: HALF_B, out: OUT_B, tc: T_HIT_B, yawF: 7 * DEG, ring: new V3(-0.3, 0, 0.6), tiltAx: new V3(0, -1, 0.2).normalize(), tilt: 12 * DEG, slide: new V3(-0.1, 0, -0.02), spin: 4 * DEG },
};
const bake = {};
function runBake() {
  for (const key2 of ["A", "B"]) {
    const f = FALL[key2];
    const half = f.half;
    // pose deitada final (antes do deslize): centro da aliança em f.ring, metade apoiada no piso
    const qF = flat(f.yawF);
    const cF = f.ring.clone().add(half.cen.clone().applyQuaternion(qF));
    cF.y = -lowest(half, qF).y;
    // pose de toque: a deitada girada em torno de um eixo horizontal; o ponto que toca primeiro é
    // o vértice mais baixo dessa pose
    const axW = f.tiltAx.clone().applyQuaternion(qF);
    axW.y = 0;
    axW.normalize();
    const qC = qAxis(axW, f.tilt).multiply(qF);
    const lowC = lowest(half, qC);
    // o pivô fica onde o vértice de toque estaria se a peça deitasse girando sobre ele
    const pivLocal = lowC.local.clone();
    const pivFlat = pivLocal.clone().applyQuaternion(qF).add(cF);
    pivFlat.y = 0;
    const posOf = (theta, piv) => {
      const R = qAxis(axW, theta);
      const q = R.clone().multiply(qF);
      // centro = pivô + R·(cF - pivô_flat), com pivô no chão
      const cc = piv.clone().add(cF.clone().sub(pivFlat).applyQuaternion(R));
      return { q, c: cc };
    };
    const contact = posOf(f.tilt, pivFlat);
    // voo
    const s0 = staticPose(half, f.out, T_BRK);
    const T = f.tc - T_BRK;
    const vy0 = (contact.c.y - s0.p.y + 0.5 * G * T * T) / T;
    const vh = new V3((contact.c.x - s0.p.x) / T, 0, (contact.c.z - s0.p.z) / T);
    const qRel = s0.q.clone().invert().multiply(contact.q);
    const qRelAx = new V3(qRel.x, qRel.y, qRel.z);
    const sinH = qRelAx.length();
    const ang = 2 * Math.atan2(sinH, qRel.w);
    if (sinH > 1e-9) qRelAx.divideScalar(sinH);
    const pos = new Float32Array(NB * 3);
    const quat = new Float32Array(NB * 4);
    // contato
    let theta = f.tilt;
    let omega = 0;
    let phase = 0; // 0 voo, 1 tombando, 2 deitada
    let slideK = 0;
    let slideV = 0;
    const L = Math.hypot(cF.x - pivFlat.x, cF.z - pivFlat.z);
    const ALPHA = (G * L) / (L * L + 0.18); // aceleração angular do tombo (raio de giração estimado)
    const vC = vy0 - G * T; // velocidade vertical no toque
    const events = [];
    for (let k = 0; k < NB; k++) {
      const tau = k * DT;
      const time = T_BRK + tau;
      let q;
      let c;
      if (time < f.tc) {
        const s = tau / T;
        q = s0.q.clone().multiply(qAxis(qRelAx, ang * s));
        c = new V3(s0.p.x + vh.x * tau, s0.p.y + vy0 * tau - 0.5 * G * tau * tau, s0.p.z + vh.z * tau);
        // sem atravessar o piso nos últimos subpassos
        const lw = lowest(half, q, c);
        if (lw.y < 0) c.y -= lw.y;
      } else {
        if (phase === 0) {
          phase = 1;
          omega = (vC * L) / (L * L + 0.18); // impulso no pivô: a queda vira giro
          slideV = Math.hypot(vh.x, vh.z) * 0.22;
          events.push({ k: "quina", t: time });
        }
        // tombo e recuperação
        omega += -ALPHA * Math.cos(theta) * DT;
        theta += omega * DT;
        if (theta <= 0 && omega < 0) {
          theta = 0;
          if (Math.abs(omega) > 0.35) {
            events.push({ k: phase === 1 ? "deita" : "rebote", t: time, w: omega });
            omega = -0.12 * omega;
            phase = 2;
          } else omega = 0;
        }
        // deslize com atrito
        if (slideV > 0) {
          slideK += slideV * DT;
          slideV = Math.max(0, slideV - 2.2 * DT);
        }
        const dirS = f.slide.clone().normalize();
        const piv = pivFlat.clone().addScaledVector(dirS, Math.min(slideK, f.slide.length()));
        const r = posOf(theta, piv);
        const sp = f.spin * easeOut(clamp((time - f.tc) / 0.35, 0, 1));
        const qs = qAxis(AXY, sp);
        q = qs.clone().multiply(r.q);
        c = r.c.clone().sub(piv).applyQuaternion(qs).add(piv);
        const lw = lowest(half, q, c);
        if (lw.y < 0) c.y -= lw.y;
      }
      pos[k * 3] = c.x;
      pos[k * 3 + 1] = c.y;
      pos[k * 3 + 2] = c.z;
      quat[k * 4] = q.x;
      quat[k * 4 + 1] = q.y;
      quat[k * 4 + 2] = q.z;
      quat[k * 4 + 3] = q.w;
    }
    bake[key2] = { pos, quat, vy0, vh: vh.length(), vC, events };
  }
}
runBake();
function sampleHalf(key2, time, outP, outQ) {
  const b = bake[key2];
  const fr = clamp((time - T_BRK) / DT, 0, NB - 1);
  const i = Math.floor(fr);
  const j = Math.min(NB - 1, i + 1);
  const a = fr - i;
  outP.set(b.pos[i * 3] * (1 - a) + b.pos[j * 3] * a, b.pos[i * 3 + 1] * (1 - a) + b.pos[j * 3 + 1] * a, b.pos[i * 3 + 2] * (1 - a) + b.pos[j * 3 + 2] * a);
  const qa = new Q().fromArray(b.quat, i * 4);
  const qb = new Q().fromArray(b.quat, j * 4);
  outQ.copy(qa).slerp(qb, a);
}

// ---------------------------------------------------------------- estúdio: parede e piso
// O fundo é o gradiente Midnight para Navy a 135 graus, preso ao enquadramento do gancho e
// projetado no mundo (parede e piso distante usam a mesma conta: o horizonte não aparece). O piso
// é Sand dentro de uma poça de luz e escurece para o gradiente fora dela; quando a câmera desce
// com as metades, a poça entra no quadro e vira o fundo da cena seguinte.
const POOL = { c: new THREE.Vector2(0, 0.9) };
function poolR(time) {
  // a poça é pequena no gancho (o piso não pode aparecer atrás da aliança) e se abre depois do
  // toque, junto com a subida da câmera
  const k = RM ? (time >= T_BRK ? 1 : 0) : seg(time, T_BRK + 0.45, T_TOP - 0.3);
  return [lerp(3.4, 9.5, k), lerp(5.9, 13, k)];
}
const camAt0 = { position: new V3(), quaternion: new Q() };
const gradUniforms = {
  vp0: { value: new THREE.Matrix4() },
  cA: { value: v3c(SRGB.midnight) },
  cB: { value: v3c(SRGB.navy) },
};
const GRAD_GLSL = `
  uniform mat4 vp0; uniform vec3 cA; uniform vec3 cB;
  vec3 grad(vec3 w){
    vec4 c = vp0 * vec4(w,1.0);
    vec2 n = c.xy / max(c.w, 1e-4);
    vec2 px = vec2((n.x*0.5+0.5)*1080.0, (0.5-n.y*0.5)*1920.0);
    float s = ((px.x-540.0)*0.70710678 + (px.y-960.0)*0.70710678) / 2121.32 + 0.5;
    return mix(cA, cB, clamp(s,0.0,1.0));
  }`;
const wallMat = new THREE.ShaderMaterial({
  uniforms: gradUniforms,
  vertexShader: "varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }",
  fragmentShader: GRAD_GLSL + "varying vec3 vW; void main(){ gl_FragColor = vec4(grad(vW),1.0); }",
});
const wall = new THREE.Mesh(new THREE.PlaneGeometry(600, 300), wallMat);
wall.position.set(0, 150, -60);
scene.add(wall);

// sombra de contato: as metades vistas de baixo, escuras perto do chão, desfocadas
const CS = { size: 10, res: 512, h: 1.1, cx: 0, cz: 0.8 };
const csRT = new THREE.WebGLRenderTarget(CS.res, CS.res);
const csRT2 = new THREE.WebGLRenderTarget(CS.res, CS.res);
csRT.texture.generateMipmaps = false;
csRT2.texture.generateMipmaps = false;
const csCam = new THREE.OrthographicCamera(-CS.size / 2, CS.size / 2, CS.size / 2, -CS.size / 2, 0, CS.h);
csCam.position.set(CS.cx, 0, CS.cz);
csCam.rotation.x = Math.PI / 2;
csCam.updateMatrixWorld();
const csDepthMat = new THREE.ShaderMaterial({
  uniforms: { hMax: { value: CS.h } },
  side: THREE.DoubleSide,
  vertexShader: "varying float vH; void main(){ vec4 w = modelMatrix*vec4(position,1.0); vH = w.y; gl_Position = projectionMatrix*viewMatrix*w; }",
  fragmentShader: "uniform float hMax; varying float vH; void main(){ float a = 1.0 - clamp(vH/hMax,0.0,1.0); gl_FragColor = vec4(0.0,0.0,0.0,a*a*a); }",
});
const blurMat = new THREE.ShaderMaterial({
  uniforms: { tex: { value: null }, dir: { value: new THREE.Vector2(1, 0) }, px: { value: 1 / CS.res }, rad: { value: 2.0 } },
  vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy,0.0,1.0); }",
  fragmentShader: `uniform sampler2D tex; uniform vec2 dir; uniform float px; uniform float rad; varying vec2 vUv;
    void main(){
      float w[5]; w[0]=0.2270270270; w[1]=0.1945945946; w[2]=0.1216216216; w[3]=0.0540540541; w[4]=0.0162162162;
      float a = texture2D(tex, vUv).a * w[0];
      for (int i=1;i<5;i++){ vec2 o = dir*px*rad*float(i); a += texture2D(tex, vUv+o).a*w[i] + texture2D(tex, vUv-o).a*w[i]; }
      gl_FragColor = vec4(0.0,0.0,0.0,a);
    }`,
  depthTest: false,
  depthWrite: false,
});
const blurScene = new THREE.Scene();
const blurQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), blurMat);
blurScene.add(blurQuad);
const blurCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

const floorMat = new THREE.ShaderMaterial({
  uniforms: {
    ...gradUniforms,
    sand: { value: v3c(SRGB.sand) },
    shade: { value: v3c([150, 152, 160]) },
    poolC: { value: POOL.c },
    r0: { value: 3.4 },
    r1: { value: 5.9 },
    csTex: { value: csRT.texture },
    csBox: { value: new THREE.Vector4(CS.cx - CS.size / 2, CS.cz - CS.size / 2, CS.size, CS.size) },
    csK: { value: 0.62 },
  },
  vertexShader: "varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }",
  fragmentShader:
    GRAD_GLSL +
    `uniform vec3 sand; uniform vec3 shade; uniform vec2 poolC; uniform float r0; uniform float r1;
    uniform sampler2D csTex; uniform vec4 csBox; uniform float csK; varying vec3 vW;
    void main(){
      float d = distance(vW.xz, poolC);
      float k = smoothstep(r0, r1, d);
      vec3 col = mix(sand, grad(vW), k);
      vec2 uv = (vW.xz - csBox.xy) / csBox.zw;
      float c = 0.0;
      if (uv.x > 0.0 && uv.x < 1.0 && uv.y > 0.0 && uv.y < 1.0) c = texture2D(csTex, uv).a;
      col = mix(col, shade * col, clamp(c * csK, 0.0, 1.0) * (1.0 - k));
      gl_FragColor = vec4(col, 1.0);
    }`,
});
const floor = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), floorMat);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);
// sombra projetada da luz principal (suave longe do chão, mais nítida no contato)
const catcher = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.ShadowMaterial({ color: new THREE.Color("#0B1F4B"), opacity: 0.3, depthWrite: false }));
catcher.rotation.x = -Math.PI / 2;
catcher.position.set(0, 0.002, 0.8);
catcher.receiveShadow = true;
scene.add(catcher);

// ---------------------------------------------------------------- lascas na ruptura (só três)
const chips = [];
for (let i = 0; i < 3; i++) {
  const m = new THREE.Mesh(new THREE.TetrahedronGeometry(0.014 + 0.006 * i), new THREE.MeshStandardMaterial({ color: new THREE.Color("#8F6F4A"), metalness: 1, roughness: 0.6, flatShading: true }));
  m.visible = false;
  scene.add(m);
  const cut = i === 1 ? CUT2 : CUT1;
  const p0 = P3(1.0, HW * 0.6, cut.theta).applyQuaternion(qRing(T_BRK)).add(RING0);
  chips.push({ m, p0, v: new V3((rnd() - 0.5) * 0.9, 0.4 + rnd() * 0.5, 0.3 + rnd() * 0.4), spin: new V3(11, 7, 9), life: 0.75 });
}
function updateChips(time) {
  for (const s of chips) {
    const a = time - T_BRK;
    if (RM || a < 0 || a > s.life) {
      s.m.visible = false;
      continue;
    }
    s.m.visible = true;
    s.m.position.copy(s.p0).addScaledVector(s.v, a);
    s.m.position.y -= 0.5 * G * a * a;
    s.m.rotation.set(s.spin.x * a, s.spin.y * a, s.spin.z * a);
  }
}

// ---------------------------------------------------------------- câmera
// Parâmetros: alvo L (mundo), ponto da tela onde L aparece, inclinação (positiva = olhando para
// baixo), giro e profundidade (distância ao alvo ao longo do eixo óptico).
function camFrom(L, sx, sy, pitch, yaw, zd, out) {
  const q = new Q().setFromEuler(new THREE.Euler(-pitch, yaw, 0, "YXZ"));
  const off = new V3((sx - 540) / FPX, -(sy - 960) / FPX, -1).multiplyScalar(zd).applyQuaternion(q);
  out.position.copy(L).sub(off);
  out.quaternion.copy(q);
}
const tmpPA = new V3();
const tmpPB = new V3();
const tmpQA = new Q();
const tmpQB = new Q();
function midAt(time) {
  if (time <= T_BRK) return RING0.clone();
  sampleHalf("A", time, tmpPA, tmpQA);
  sampleHalf("B", time, tmpPB, tmpQB);
  return tmpPA.clone().add(tmpPB).multiplyScalar(0.5);
}
const REST = (() => {
  const m = midAt(T_END);
  return m;
})();
const Z_HOOK0 = FPX / 268; // diâmetro da aliança de cerca de 536 px no quadro 0
const Z_HOOK1 = FPX / 318; // cerca de 636 px na ruptura (aproximação rápida no começo)
const Z_HIT = FPX / 250;
const Z_TOP = FPX / 182;
const S_HOOK = { x: 552, y: 1168 };
const P_HIT = 57; // inclinação no toque (graus): o piso Sand já ocupa quase todo o quadro
const SY_HIT = 1300;
function camState(time) {
  // gancho: aproximação rápida que desacelera (sem giro), aliança grande desde o quadro 0
  const kPush = RM ? 1 : easeOut(clamp(time / T_BRK, 0, 1));
  let L = RING0.clone();
  let sx = S_HOOK.x;
  let sy = S_HOOK.y;
  let pitch = -3 * DEG;
  let yaw = 0;
  let zd = lerp(Z_HOOK0, Z_HOOK1, kPush);
  if (time > T_BRK) {
    // queda: o alvo acompanha o ponto médio das metades com atraso curto; a câmera sobe e inclina
    const lag = 0.07;
    const m = midAt(Math.max(T_BRK, time - lag));
    const wF = smooth((time - T_BRK) / 0.3);
    L = RING0.clone().lerp(m, wF);
    const kF = seg(time, T_BRK + 0.06, T_HIT + 0.12);
    pitch = lerp(-3, P_HIT, kF) * DEG;
    zd = lerp(Z_HOOK1, Z_HIT, kF);
    sy = lerp(S_HOOK.y, SY_HIT, kF);
    sx = lerp(S_HOOK.x, 540, kF);
  }
  if (time > T_HIT) {
    // depois do toque: assenta e sobe até a vista de cima, onde as metades viram a ponte da
    // comparação (faixa do meio do quadro)
    const kS = seg(time, T_HIT + 0.18, T_TOP);
    pitch = lerp(P_HIT, 89.6, kS) * DEG;
    zd = lerp(Z_HIT, Z_TOP, kS);
    const kY = seg(time, CUT.c23 - 0.05, T_TOP + 0.2);
    sy = lerp(SY_HIT, 884, kY);
    L = midAt(time).lerp(REST, smooth((time - T_HIT) / 0.6));
    // tremor curto do impacto (2 quadros, cerca de 3 px)
    const a = time - T_HIT;
    if (!RM && a < 0.16) sy += 3.2 * Math.exp(-a / 0.05) * Math.sin(2 * Math.PI * 22 * a);
  }
  if (time > T_TOP) {
    // comparação: travelling lateral lento (paralaxe entre o texto e o piso)
    const kT = seg(time, T_TOP, T_END, (x) => x);
    L = REST.clone().add(new V3(-0.32 * kT, 0, 0));
    yaw = 2.4 * kT * DEG;
    zd = lerp(Z_TOP, Z_TOP * 0.95, kT);
  }
  return { L, sx, sy, pitch, yaw, zd };
}
function cameraAt(time, out) {
  const s = camState(time);
  camFrom(s.L, s.sx, s.sy, s.pitch, s.yaw, s.zd, out);
}
// gradiente preso ao enquadramento do quadro 0
cameraAt(0, camera);
camera.updateMatrixWorld();
camera.updateProjectionMatrix();
gradUniforms.vp0.value.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);

// ---------------------------------------------------------------- estado num instante
function setState(time) {
  for (const key2 of ["A", "B"]) {
    const f = FALL[key2];
    const grp = f.half.grp;
    if (time < T_BRK) {
      const s = staticPose(f.half, f.out, time);
      grp.position.copy(s.p);
      grp.quaternion.copy(s.q);
    } else sampleHalf(key2, time, grp.position, grp.quaternion);
  }
  const [p1, p2] = time < T_BRK ? crackProgress(time) : [0, 0];
  setCrack(CRACKS.c1, p1);
  setCrack(CRACKS.c2, p2);
  ringGroup.quaternion.copy(qRing(time));
  ringGroup.position.copy(RING0).add(vibAt(time));
  ringGroup.visible = time < T_BRK;
  updateChips(time);
  const [r0, r1] = poolR(time);
  floorMat.uniforms.r0.value = r0;
  floorMat.uniforms.r1.value = r1;
  // sombra da luz principal: mais nítida quanto mais perto do chão
  const hMin = time < T_BRK ? Y0 : Math.min(...["A", "B"].map((k) => FALL[k].half.grp.position.y));
  key.shadow.radius = lerp(1.6, 7, smooth(hMin / 3));
  cameraAt(time, camera);
  camera.updateMatrixWorld();
}
function renderContactShadow() {
  const hidden = [floor, wall, catcher, ringGroup, ...chips.map((c) => c.m)];
  const vis = hidden.map((o) => o.visible);
  for (const o of hidden) o.visible = false;
  const bg = scene.background;
  const env = scene.environment;
  scene.overrideMaterial = csDepthMat;
  scene.environment = null;
  renderer.setRenderTarget(csRT);
  renderer.setClearColor(0x000000, 0);
  renderer.clear();
  renderer.render(scene, csCam);
  scene.overrideMaterial = null;
  scene.environment = env;
  scene.background = bg;
  hidden.forEach((o, i) => (o.visible = vis[i]));
  // desfoque em dois passes
  blurMat.uniforms.tex.value = csRT.texture;
  blurMat.uniforms.dir.value.set(1, 0);
  renderer.setRenderTarget(csRT2);
  renderer.clear();
  renderer.render(blurScene, blurCam);
  blurMat.uniforms.tex.value = csRT2.texture;
  blurMat.uniforms.dir.value.set(0, 1);
  renderer.setRenderTarget(csRT);
  renderer.clear();
  renderer.render(blurScene, blurCam);
  renderer.setRenderTarget(null);
  renderer.setClearColor(0x000000, 1);
}
function renderOnce(time) {
  setState(time);
  if (time >= T_BRK) renderContactShadow();
  else {
    renderer.setRenderTarget(csRT);
    renderer.setClearColor(0x000000, 0);
    renderer.clear();
    renderer.setRenderTarget(null);
  }
  renderer.render(scene, camera);
}

// ---------------------------------------------------------------- desfoque de movimento
// obturador de 180 graus (1/60 s) por média de subquadros, só onde há velocidade
function subframes(time) {
  if (RM) return 1;
  if (time >= T_TENS && time < T_BRK) return 2;
  if (time >= T_BRK && time < T_HIT + 0.25) return 5;
  if (time >= T_HIT + 0.25 && time < T_TOP + 0.1) return 2;
  return 1;
}
function draw(time) {
  const n = subframes(time);
  const sh = 1 / 60;
  for (let k = 0; k < n; k++) {
    const tk = n === 1 ? time : time - sh / 2 + (sh * (k + 0.5)) / n;
    renderOnce(tk);
    ctx.globalAlpha = 1 / (k + 1);
    ctx.drawImage(glCanvas, 0, 0, W, H);
  }
  ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------- movimento reduzido
// quatro estados parados, com dissolve curto de 0,25 s: aliança rachada, metades no ar, metades no
// chão (vista alta) e vista de cima
const RM_STATES = [
  { from: -1, t: T_NAO1 + 0.3 },
  { from: T_BRK, t: T_BRK + 0.45 },
  { from: T_HIT, t: T_HIT + 0.9 },
  { from: CUT.c23, t: T_TOP + 0.6 },
];
const rmCanvas = document.createElement("canvas");
rmCanvas.width = W;
rmCanvas.height = H;
const rmCtx = rmCanvas.getContext("2d");
function rmState(i) {
  setState(RM_STATES[i].t);
  if (RM_STATES[i].t >= T_BRK) renderContactShadow();
  renderer.render(scene, camera);
}

// ---------------------------------------------------------------- texto do gancho preso ao mundo
// o título do gancho fica parado enquanto a aliança está inteira e sai por cima quando a câmera
// desce com as metades
const hookText = document.getElementById("s1-world");
const TXT_ANCHOR = RING0.clone().add(new V3(0, 2.3, 0));
const projCam = new THREE.PerspectiveCamera(FOV, W / H, 0.1, 400);
function screenY(v, time) {
  cameraAt(time, projCam);
  projCam.updateMatrixWorld();
  projCam.updateProjectionMatrix();
  const p = v.clone().project(projCam);
  return (0.5 - p.y * 0.5) * H;
}
const Y_TXT0 = screenY(TXT_ANCHOR, T_BRK);
function anchorText(time) {
  if (!hookText) return;
  let dy = 0;
  if (!RM && time > T_BRK) dy = Math.max(-2400, screenY(TXT_ANCHOR, time) - Y_TXT0);
  hookText.style.transform = "translate3d(0," + dy.toFixed(2) + "px,0)";
}

// ---------------------------------------------------------------- render por quadro
let lastKey = null;
function renderAt(time) {
  if (time > T_END + 0.05) return;
  if (RM) {
    let s = 0;
    for (let i = 0; i < RM_STATES.length; i++) if (time >= RM_STATES[i].from) s = i;
    const k = s > 0 ? clamp((time - RM_STATES[s].from) / 0.25, 0, 1) : 1;
    const keyStr = s + ":" + k.toFixed(3);
    if (keyStr === lastKey) return;
    lastKey = keyStr;
    if (k < 1) {
      rmState(s - 1);
      rmCtx.drawImage(glCanvas, 0, 0, W, H);
    }
    rmState(s);
    ctx.globalAlpha = 1;
    if (k < 1) {
      ctx.drawImage(rmCanvas, 0, 0);
      ctx.globalAlpha = k;
    }
    ctx.drawImage(glCanvas, 0, 0, W, H);
    ctx.globalAlpha = 1;
    return;
  }
  const keyStr = time.toFixed(4);
  if (keyStr === lastKey) return;
  lastKey = keyStr;
  draw(time);
}

// projeção de um ponto do mundo para pixels do quadro, num instante
function screenOf(v, time) {
  cameraAt(time, projCam);
  projCam.updateMatrixWorld();
  projCam.updateProjectionMatrix();
  const p = v.clone().project(projCam);
  return { x: (p.x * 0.5 + 0.5) * W, y: (0.5 - p.y * 0.5) * H };
}
function halvesBox(time) {
  const pts = [];
  for (const key2 of ["A", "B"]) {
    const f = FALL[key2];
    const p = new V3();
    const q = new Q();
    if (time < T_BRK) {
      const s = staticPose(f.half, f.out, time);
      p.copy(s.p);
      q.copy(s.q);
    } else sampleHalf(key2, time, p, q);
    for (const s of f.half.sample) pts.push(screenOf(s.clone().applyQuaternion(q).add(p), time));
  }
  return { x0: Math.min(...pts.map((p) => p.x)), x1: Math.max(...pts.map((p) => p.x)), y0: Math.min(...pts.map((p) => p.y)), y1: Math.max(...pts.map((p) => p.y)) };
}

const info = {
  T_NAO1,
  T_BRK,
  T_TENS,
  T_HIT,
  T_HIT_B,
  T_TOP,
  T_END,
  G,
  eventos: { A: bake.A.events, B: bake.B.events },
  vy0: { A: bake.A.vy0, B: bake.B.vy0 },
  vC: { A: bake.A.vC, B: bake.B.vC },
  ringCenter0: screenOf(RING0, 0),
  caixa: {
    gancho0: halvesBox(0),
    ruptura: halvesBox(T_BRK),
    toque: halvesBox(T_HIT + 0.3),
    topo: halvesBox(T_TOP + 0.2),
    fim: halvesBox(T_END),
  },
};
window.addEventListener("hf-seek", (e) => {
  const time = e.detail.time;
  renderAt(time);
  anchorText(time);
});
window.__ALIANCA = { info, renderAt, anchorText, screenOf, halvesBox, camState, poolR };
if (typeof window.__ALIANCA_RESOLVE === "function") window.__ALIANCA_RESOLVE(info);
const t0 = window.__hfThreeTime || 0;
renderAt(t0);
anchorText(t0);
