// Aliança 3D do Reel BT "Seu cônjuge não quer se divorciar", versão v2.
// Cena Three.js determinística: nada de relógio, nada de requestAnimationFrame, nada de
// Math.random. A física da queda é pré-calculada a passo fixo de 1/120 s e guardada em curvas;
// cada quadro só lê as curvas no instante pedido pelo HyperFrames (evento hf-seek).
// Mudanças do v2: a aliança aparece também no gancho (segundo canvas, fundo transparente), gira
// devagar antes de partir, as rachaduras são mais grossas, e a queda é tocada com rampa de
// velocidade (a simulação é a mesma do v1; o tempo do vídeo é remapeado pela tabela de
// dados_v2.js). Tempos com prefixo B_ estão no relógio da simulação; os demais, no do vídeo.
import * as THREE from "three";

const D = window.BT_DADOS;
const C = D.const;
const norm = (s) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
function word(txt, k = 1) {
  let n = 0;
  for (const w of D.palavras) {
    if (norm(w.texto) === norm(txt) && ++n === k) return w;
  }
  throw new Error("palavra não encontrada: " + txt + " " + k);
}
const t = (txt, k) => word(txt, k).ini;

const vars = (window.__hyperframes && window.__hyperframes.getVariables && window.__hyperframes.getVariables()) || {};
const RM = vars.reducedMotion === true;

// ---------------------------------------------------------------- tempos (âncoras reais da fala)
const T_REV = D.cortes.c34; // revelação circular: a aliança já está em cena
const T_R1 = t("discordância");
const T_R2 = t("por");
const T_R3 = t("não", 4);
const T0 = t("impede"); // partida (igual nos dois relógios)
// relógio da simulação
const T_A = T0 + C.QUEDA; // primeiro toque
const T_B = T_A + C.TOQUE_B; // segundo toque
const H0 = T_A + 0.55; // metades em repouso, câmera parada
const TILT0 = H0 + C.PERMANENCIA;
const TILT1 = TILT0 + C.INCLINACAO;
// relógio do vídeo
const QV = D.queda_video;
const T_END = D.cortes.c56 + 0.3; // fim do fundo de C5 (sai no chicote vertical)
const T_HOOK_END = D.cortes.c12 + 0.05; // fim do gancho
const T_AGORA = t("agora");
// rampa de velocidade: tempo do vídeo depois da partida -> tempo da simulação depois da partida
const RAMPA = D.rampa;
const U_MAX = (RAMPA.b.length - 1) * RAMPA.dt;
function bakeTime(time) {
  if (time <= T0) return time;
  const u = time - T0;
  if (u >= U_MAX) return T0 + RAMPA.b[RAMPA.b.length - 1] + (u - U_MAX);
  const f = u / RAMPA.dt;
  const i = Math.floor(f);
  const a = f - i;
  return T0 + RAMPA.b[i] * (1 - a) + RAMPA.b[Math.min(RAMPA.b.length - 1, i + 1)] * a;
}
// giro lento da aliança antes de partir: de -14 graus na revelação até 0 na partida
const SPIN0 = (-14 * Math.PI) / 180;
function spinAt(time) {
  if (RM || time >= T0 || time < T_REV) return 0;
  return SPIN0 * (1 - (time - T_REV) / (T0 - T_REV));
}

// ---------------------------------------------------------------- utilidades
const W = 1080;
const H = 1920;
const SS = 2; // supersampling 2x
const DEG = Math.PI / 180;
const FOV = 35;
const FPX = H / 2 / Math.tan((FOV / 2) * DEG); // distância focal em pixels do quadro 1080 x 1920
let seed = 19102026;
const rnd = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const smooth = (x) => {
  x = clamp(x, 0, 1);
  return x * x * (3 - 2 * x);
};
// curva BT inOut (cubic-bezier 0.45, 0, 0.25, 1), resolvida por bisseção
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
const easeInOut = bezier(0.45, 0, 0.25, 1);
const easeEnter = bezier(0.16, 1, 0.3, 1);

// ---------------------------------------------------------------- renderizador
const canvas = document.getElementById("ring-canvas");
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: false,
  alpha: false,
  preserveDrawingBuffer: true,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(1);
renderer.setSize(W * SS, H * SS, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.VSMShadowMap;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(FOV, W / H, 0.1, 400);

// ---------------------------------------------------------------- paleta
const COL = {
  paper: new THREE.Color("#FAF8F4"),
  sand: new THREE.Color("#F4EDE2"),
  midnight: new THREE.Color("#081A35"),
  navy: new THREE.Color("#0B1F4B"),
  gold: new THREE.Color("#D4AF7C"),
  clay: new THREE.Color("#A66E52"),
  sky: new THREE.Color("#8FC5EF"),
  // tom interno da fratura: entre Gold e Clay, mais escuro
  fratura: new THREE.Color("#A57A57"),
};

// ---------------------------------------------------------------- câmera inicial
// aliança com centro em (540, 640) no quadro e diâmetro externo de cerca de 380 px
let Y0 = 12.0; // altura do centro da aliança (recalculada abaixo)
let RING0 = new THREE.Vector3(0, Y0, 0);
const PITCH0 = -8 * DEG;
const DEPTH0 = FPX / 190; // 190 px por unidade no plano da aliança
const camQ0 = new THREE.Quaternion().setFromEuler(new THREE.Euler(PITCH0, 0, 0, "YXZ"));
let CAM0 = new THREE.Vector3();
function setupY(y) {
  Y0 = y;
  RING0 = new THREE.Vector3(0, y, 0);
  const yNdc = (H / 2 - 640) / (H / 2);
  const dirCam = new THREE.Vector3(0, yNdc * Math.tan((FOV / 2) * DEG), -1);
  const dist = DEPTH0 * dirCam.length();
  dirCam.normalize().applyQuaternion(camQ0);
  CAM0 = RING0.clone().addScaledVector(dirCam, -dist);
}
setupY(12);

// ---------------------------------------------------------------- luz
const LIGHT_DIR = new THREE.Vector3(-Math.cos(40 * DEG) * 0.72, Math.sin(40 * DEG), Math.cos(40 * DEG) * 0.69).normalize();
const key = new THREE.DirectionalLight(0xffffff, 2.35);
key.position.copy(LIGHT_DIR).multiplyScalar(40);
key.target.position.set(0, 0, 0);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.radius = 12;
key.shadow.blurSamples = 28;
key.shadow.bias = -0.0004;
const sc = key.shadow.camera;
sc.left = -7;
sc.right = 7;
sc.top = 7;
sc.bottom = -7;
sc.near = 1;
sc.far = 90;
scene.add(key, key.target);
scene.add(new THREE.AmbientLight(0xffffff, 0.35));
// preenchimento fraco para o lado de sombra não virar recorte preto
const fill = new THREE.HemisphereLight(0xffffff, 0x0b1f4b, 0.35);
scene.add(fill);

// ---------------------------------------------------------------- modelo: aliança de faixa larga
const RO = 1.0; // raio externo
const RI = 0.82; // raio interno
const HW = 0.42 / 2; // meia largura da faixa
const CH = 0.03; // chanfro arredondado
const NP = 112; // pontos da secção
const NA = 104; // passos angulares por metade (mais de 128 no anel inteiro)

// secção: retângulo de cantos arredondados, amostrado por comprimento de arco
// ordem: face da frente (de dentro para fora), canto, face externa (de cima para baixo da
// largura), canto, face de trás, canto, face interna, canto
const segs = [];
{
  const line = (r0, z0, r1, z1, nr, nz) => segs.push({ k: "l", r0, z0, r1, z1, nr, nz, len: Math.hypot(r1 - r0, z1 - z0) });
  const arc = (cr, cz, a0, a1) => segs.push({ k: "a", cr, cz, a0, a1, len: Math.abs(a1 - a0) * CH });
  line(RI + CH, HW, RO - CH, HW, 0, 1);
  arc(RO - CH, HW - CH, Math.PI / 2, 0);
  line(RO, HW - CH, RO, -HW + CH, 1, 0);
  arc(RO - CH, -HW + CH, 0, -Math.PI / 2);
  line(RO - CH, -HW, RI + CH, -HW, 0, -1);
  arc(RI + CH, -HW + CH, -Math.PI / 2, -Math.PI);
  line(RI, -HW + CH, RI, HW - CH, -1, 0);
  arc(RI + CH, HW - CH, Math.PI, Math.PI / 2);
}
const PROF_LEN = segs.reduce((a, s) => a + s.len, 0);
function profileAt(u) {
  let L = (((u % 1) + 1) % 1) * PROF_LEN;
  for (const s of segs) {
    if (L <= s.len + 1e-9) {
      const f = s.len ? L / s.len : 0;
      if (s.k === "l") return { r: s.r0 + (s.r1 - s.r0) * f, z: s.z0 + (s.z1 - s.z0) * f, nr: s.nr, nz: s.nz };
      const a = s.a0 + (s.a1 - s.a0) * f;
      return { r: s.cr + CH * Math.cos(a), z: s.cz + CH * Math.sin(a), nr: Math.cos(a), nz: Math.sin(a) };
    }
    L -= s.len;
  }
  return profileAt(0);
}
const PROF = [];
for (let j = 0; j < NP; j++) PROF.push({ ...profileAt(j / NP), u: j / NP });
const CEN = { r: (RO + RI) / 2, z: 0 };

// linhas de fratura: cerca de 1 hora e cerca de 7 horas, irregulares, de 5 a 7 facetas
// (ângulo medido no sentido horário a partir das 12 horas; as metades não são espelhadas)
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
// rugosidade da face de fratura, fixa por corte (as duas peças encaixam)
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

const P3 = (r, z, th) => new THREE.Vector3(r * Math.sin(th), r * Math.cos(th), z);

function bandGeometry(cA, cB, wrap) {
  const pos = [];
  const nor = [];
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
  g.setIndex(idx);
  orient(g, 0, new THREE.Vector3(nor[0], nor[1], nor[2]));
  return g;
}
// garante a ordem dos vértices coerente com a normal de referência do primeiro triângulo
function orient(g, tri, ref) {
  const p = g.attributes.position;
  const ix = g.index.array;
  const a = new THREE.Vector3().fromBufferAttribute(p, ix[tri * 3]);
  const b = new THREE.Vector3().fromBufferAttribute(p, ix[tri * 3 + 1]);
  const c = new THREE.Vector3().fromBufferAttribute(p, ix[tri * 3 + 2]);
  const n = b.sub(a).cross(c.sub(a));
  if (n.dot(ref) < 0) {
    for (let k = 0; k < ix.length; k += 3) {
      const tmp = ix[k + 1];
      ix[k + 1] = ix[k + 2];
      ix[k + 2] = tmp;
    }
  }
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
  const th = cut.theta;
  const tangent = new THREE.Vector3(Math.cos(th), -Math.sin(th), 0).multiplyScalar(outwardSign);
  orient(g, 0, tangent);
  g.computeVertexNormals();
  return g;
}

const bandMat = new THREE.MeshStandardMaterial({ color: COL.gold, roughness: 0.8, metalness: 0 });
const capMat = new THREE.MeshStandardMaterial({ color: COL.fratura, roughness: 1, metalness: 0, flatShading: true });

function makeHalf(cA, cB, wrap) {
  const band = bandGeometry(cA, cB, wrap);
  const capA = capGeometry(cA, -1, false);
  const capB = capGeometry(cB, +1, wrap);
  // centro de massa aproximado: média dos vértices da faixa
  const p = band.attributes.position;
  const cen = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) cen.add(new THREE.Vector3().fromBufferAttribute(p, i));
  cen.divideScalar(p.count);
  for (const g of [band, capA, capB]) g.translate(-cen.x, -cen.y, -cen.z);
  const grp = new THREE.Group();
  const m1 = new THREE.Mesh(band, bandMat);
  const m2 = new THREE.Mesh(capA, capMat);
  const m3 = new THREE.Mesh(capB, capMat);
  for (const m of [m1, m2, m3]) {
    m.castShadow = true;
    grp.add(m);
  }
  scene.add(grp);
  // amostra de vértices para achar o ponto mais baixo (contato com o chão)
  const sample = [];
  for (let i = 0; i < p.count; i += 3) sample.push(new THREE.Vector3().fromBufferAttribute(p, i));
  return { grp, cen, sample };
}
const HALF_A = makeHalf(CUT1, CUT2, false); // lado direito, um pouco maior (184 graus)
const HALF_B = makeHalf(CUT2, CUT1, true); // lado esquerdo (176 graus)

// ---------------------------------------------------------------- orientação
const YAW0 = -26 * DEG; // a aliança vira um pouco, para a faixa ler como volume
const qYaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), YAW0);
const AX = new THREE.Vector3(1, 0, 0);
const AZ = new THREE.Vector3(0, 0, 1);
function poseQ(psi, phi, out) {
  const qx = new THREE.Quaternion().setFromAxisAngle(AX, psi);
  const qz = new THREE.Quaternion().setFromAxisAngle(AZ, phi);
  return out.copy(qYaw).multiply(qx).multiply(qz);
}
function lowest(half, q) {
  let m = Infinity;
  const v = new THREE.Vector3();
  for (const s of half.sample) {
    v.copy(s).applyQuaternion(q);
    if (v.y < m) m = v.y;
  }
  return m;
}

// ---------------------------------------------------------------- rachaduras (antes da partida)
// fio fino Midnight a 85% sobre a superfície, que cresce pelo caminho da fratura
const crackMat = new THREE.MeshBasicMaterial({ color: COL.midnight, transparent: true, opacity: 0.85, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
const crackShadeMat = new THREE.MeshBasicMaterial({ color: COL.midnight, transparent: true, opacity: 0.16, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
const ringGroup = new THREE.Group(); // pai das rachaduras, no lugar da aliança inteira
scene.add(ringGroup);
function crackRibbon(cut, width, mat) {
  const pts = [];
  const N = 360;
  for (let k = 0; k <= N; k++) {
    const u = k / N;
    const p = profileAt(u);
    const th = cut.theta + delta(cut, u);
    const pos = P3(p.r, p.z, th);
    const n = new THREE.Vector3(p.nr * Math.sin(th), p.nr * Math.cos(th), p.nz).normalize();
    pts.push({ pos, n });
  }
  const pos = [];
  const idx = [];
  for (let k = 0; k <= N; k++) {
    const a = pts[Math.max(0, k - 1)].pos;
    const b = pts[Math.min(N, k + 1)].pos;
    const tg = b.clone().sub(a).normalize();
    const side = new THREE.Vector3().crossVectors(pts[k].n, tg).normalize().multiplyScalar(width / 2);
    const base = pts[k].pos.clone().addScaledVector(pts[k].n, 0.0025);
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
const W_CRACK = 3.6 / 190; // v2: cerca de 3,6 px no quadro final (o v1 tinha 2,6 px e mal se via no celular)
const CR1 = [crackRibbon(CUT1, W_CRACK, crackMat), crackRibbon(CUT1, W_CRACK * 3.2, crackShadeMat)];
const CR2 = [crackRibbon(CUT2, W_CRACK, crackMat), crackRibbon(CUT2, W_CRACK * 3.2, crackShadeMat)];
function setCrack(cr, prog) {
  for (const c of cr) c.m.geometry.setDrawRange(0, Math.round(clamp(prog, 0, 1) * c.N) * 6);
}
function crackProgress(time) {
  // R1: nasce perto de 1 hora e cresce até cerca de 35% da secção em 0,5 s
  // R2: a R1 avança; nasce a segunda perto de 7 horas
  // R3: as duas se ligam por dentro e atravessam a secção
  // v2: a primeira rachadura já vem do gancho com 20% do caminho
  const e = (a, d) => easeInOut((time - a) / d);
  let p1 = 0.2 + 0.22 * e(T_R1, 0.5);
  p1 += 0.3 * e(T_R2, 0.5);
  p1 += 0.28 * e(T_R3, 0.3);
  let p2 = 0.42 * e(T_R2, 0.45);
  p2 += 0.58 * e(T_R3, 0.3);
  return [p1, p2];
}

// ---------------------------------------------------------------- física pré-calculada (1/120 s)
const DT = 1 / 120;
const BAKE_T1 = TILT1 + 0.05;
const NB = Math.ceil((BAKE_T1 - T0) / DT) + 1;
const OPEN = 2 / 190; // a aliança se abre um fio na R3 (cerca de 4 px no total)

function openAmount(time) {
  return OPEN * easeInOut((time - T_R3 - 0.08) / 0.15);
}
function outwardDir(half) {
  const v = half.cen.clone().applyQuaternion(qYaw);
  v.z = 0;
  return v.normalize();
}
const OUT_A = outwardDir(HALF_A);
const OUT_B = outwardDir(HALF_B);
const AY = new THREE.Vector3(0, 1, 0);
function staticPose(half, out, time, q, spin) {
  const qs = new THREE.Quaternion().setFromAxisAngle(AY, spin || 0);
  q.copy(qs).multiply(qYaw);
  const off = half.cen.clone().applyQuaternion(qYaw).addScaledVector(out, openAmount(time)).applyQuaternion(qs);
  return new THREE.Vector3().copy(RING0).add(off);
}

// parâmetros de queda de cada metade
const FALL = {
  A: { half: HALF_A, out: OUT_A, vx: 1.5, vz: 0.16, k: 1.3, phiEnd: -40 * DEG, psiFall: -58 * DEG, tTouch: C.QUEDA, bounce: 18 / 190, slide: 0.0 },
  B: { half: HALF_B, out: OUT_B, vx: -1.42, vz: -0.08, k: 1.3, phiEnd: 55 * DEG, psiFall: -51 * DEG, tTouch: C.QUEDA + C.TOQUE_B, bounce: 0, slide: 0.06 },
};
function psiPhi(f, tau) {
  // giro no eixo da tela (em torno do furo) e pequeno giro no eixo horizontal durante a queda;
  // no toque a metade termina de deitar e assenta, com um balanço leve que morre
  const T = f.tTouch;
  let phi = f.phiEnd * clamp(tau / T, 0, 1);
  let psi = f.psiFall * clamp(tau / T, 0, 1);
  if (tau > T) {
    const s = (tau - T) / 0.2;
    phi += f.phiEnd * 0.05 * easeEnter(s);
    psi = f.psiFall + (-90 * DEG - f.psiFall) * (1 - (1 - clamp(s, 0, 1)) ** 2);
    const r = tau - T - 0.2;
    if (r > 0) psi += 2.2 * DEG * Math.exp(-r / 0.07) * Math.sin((2 * Math.PI * r) / 0.17);
  }
  return [psi, phi];
}
const qTmp = new THREE.Quaternion();
let bake = {};
function runBake() {
bake = {};
for (const key2 of ["A", "B"]) {
  const f = FALL[key2];
  const p0 = staticPose(f.half, f.out, T0, qTmp);
  // gravidade estilizada e velocidade vertical inicial resolvidas para o toque no tempo de projeto
  const [psiT, phiT] = psiPhi(f, f.tTouch);
  const lowT = lowest(f.half, poseQ(psiT, phiT, qTmp));
  const T = f.tTouch;
  // A parte do repouso (vy0 = 0) e define a gravidade; B usa a mesma gravidade
  if (key2 === "A") FALL.g = (2 * (p0.y + lowT)) / (T * T);
  const g = FALL.g;
  const vy0 = (0.5 * g * T * T - p0.y - lowT) / T;
  const pos = new Float32Array(NB * 3);
  const quat = new Float32Array(NB * 4);
  let x = p0.x;
  let y = p0.y;
  let z = p0.z;
  let vx = f.vx;
  let vy = vy0;
  let vz = f.vz;
  let phase = "queda";
  let tb = 0;
  let slideDir = 0;
  const gb = g * 4;
  for (let k = 0; k < NB; k++) {
    const tau = k * DT;
    const [psi, phi] = psiPhi(f, tau);
    const q = poseQ(psi, phi, new THREE.Quaternion());
    const low = lowest(f.half, q);
    if (phase === "queda") {
      y = p0.y + vy0 * tau - 0.5 * g * tau * tau;
      if (y + low <= 0 && tau > 0.2) {
        y = -low;
        if (f.bounce > 0) {
          phase = "quique";
          vy = Math.sqrt(2 * gb * f.bounce);
        } else {
          phase = "desliza";
          vy = 0;
          slideDir = Math.sign(vx) || -1;
        }
        tb = tau;
      }
    } else if (phase === "quique") {
      if (y + low <= 0 && vy < 0) {
        y = -low;
        vy = 0;
        phase = "desliza";
        tb = tau;
      }
    } else {
      y = -low;
    }
    pos[k * 3] = x;
    pos[k * 3 + 1] = y;
    pos[k * 3 + 2] = z;
    quat[k * 4] = q.x;
    quat[k * 4 + 1] = q.y;
    quat[k * 4 + 2] = q.z;
    quat[k * 4 + 3] = q.w;
    // integra o próximo passo
    if (phase === "queda") {
      vx -= f.k * vx * DT;
      vz -= f.k * vz * DT;
    } else if (phase === "quique") {
      vx *= 0.9;
      vz *= 0.9;
      vy -= gb * DT;
    } else {
      // atrito: desliza um pouco e para
      const dec = 1 - clamp((tau - tb) / 0.16, 0, 1);
      vx = slideDir * (f.slide / 0.08) * dec;
      vz *= 0.8 * dec;
      vy = 0;
    }
    x += vx * DT;
    if (phase === "quique") y += vy * DT;
    z += vz * DT;
  }
  bake[key2] = { pos, quat, vy0 };
}
FALL.check = {
  g: FALL.g,
  vy0B: bake.B.vy0,
};
}
runBake();

// câmera: acompanha o ponto médio com atraso de 0,35 s e amortecimento crítico
const camPos = new Float32Array(NB * 3);
const camQuat = new Float32Array(NB * 4);
function sampleArr(arr, n, time, out) {
  const f = clamp((time - T0) / DT, 0, NB - 1);
  const i = Math.floor(f);
  const a = f - i;
  const j = Math.min(NB - 1, i + 1);
  for (let c = 0; c < n; c++) out[c] = arr[i * n + c] * (1 - a) + arr[j * n + c] * a;
  return out;
}
function midY(time) {
  if (time <= T0) return Y0;
  const a = sampleArr(bake.A.pos, 3, time, [0, 0, 0]);
  const b = sampleArr(bake.B.pos, 3, time, [0, 0, 0]);
  return (a[1] + b[1]) / 2;
}
// pose final de cima: as duas metades no canto inferior direito, dentro da margem segura
function restBoxWorld() {
  const box = new THREE.Box3();
  for (const key2 of ["A", "B"]) {
    const k = NB - 1;
    const p = new THREE.Vector3(bake[key2].pos[k * 3], bake[key2].pos[k * 3 + 1], bake[key2].pos[k * 3 + 2]);
    const q = new THREE.Quaternion(bake[key2].quat[k * 4], bake[key2].quat[k * 4 + 1], bake[key2].quat[k * 4 + 2], bake[key2].quat[k * 4 + 3]);
    for (const s of FALL[key2].half.sample) box.expandByPoint(s.clone().applyQuaternion(q).add(p));
  }
  return box;
}
const REST = restBoxWorld();
const TARGET = { x0: 652, x1: 972, y0: 1490, y1: 1612 };
const TOP = (() => {
  const sx = (TARGET.x1 - TARGET.x0) / (REST.max.x - REST.min.x);
  const sz = (TARGET.y1 - TARGET.y0) / (REST.max.z - REST.min.z);
  const s = Math.min(sx, sz);
  const hgt = FPX / s + (REST.max.y + REST.min.y) / 2;
  const cxW = (REST.min.x + REST.max.x) / 2;
  const czW = (REST.min.z + REST.max.z) / 2;
  const cxP = (TARGET.x0 + TARGET.x1) / 2;
  const cyP = (TARGET.y0 + TARGET.y1) / 2;
  return {
    pos: new THREE.Vector3(cxW - (cxP - W / 2) / s, hgt, czW - (cyP - H / 2) / s),
    q: new THREE.Quaternion().setFromEuler(new THREE.Euler(-90 * DEG, 0, 0, "YXZ")),
  };
})();
// parede atrás o bastante para a vista de cima não alcançá-la, e aliança alta o bastante
// para o piso não aparecer no enquadramento inicial (ele só entra na aproximação do chão)
const TOP_EDGE_Z = TOP.pos.z - (H / 2) * ((TOP.pos.y - 0.2) / FPX);
const ZW = Math.min(-14, TOP_EDGE_Z - 2.5);
{
  const alpha = -PITCH0 + (FOV / 2) * DEG + 1.5 * DEG;
  const dy = CAM0.y - Y0;
  const need = (CAM0.z - ZW + 1.0) * Math.tan(alpha) - dy;
  setupY(Math.max(12, need));
  runBake();
}
// ---------------------------------------------------------------- estúdio: parede e piso
// parede com o gradiente Midnight para Navy a 135 graus, preso ao enquadramento inicial
// (igual ao gradiente CSS das cenas escuras) e Navy liso abaixo dele
camera.position.copy(CAM0);
camera.quaternion.copy(camQ0);
camera.updateMatrixWorld();
camera.updateProjectionMatrix();
const VP0 = new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
const wallMat = new THREE.ShaderMaterial({
  uniforms: {
    vp0: { value: VP0 },
    cA: { value: new THREE.Vector3(8 / 255, 26 / 255, 53 / 255) },
    cB: { value: new THREE.Vector3(11 / 255, 31 / 255, 75 / 255) },
  },
  vertexShader: `
    varying vec3 vW;
    void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
  fragmentShader: `
    uniform mat4 vp0; uniform vec3 cA; uniform vec3 cB; varying vec3 vW;
    void main(){
      vec4 c = vp0 * vec4(vW,1.0);
      vec2 n = c.xy / c.w;
      vec2 px = vec2((n.x*0.5+0.5)*1080.0, (0.5-n.y*0.5)*1920.0);
      float s = ((px.x-540.0)*0.70710678 + (px.y-960.0)*0.70710678) / 2121.32 + 0.5;
      gl_FragColor = vec4(mix(cA, cB, clamp(s,0.0,1.0)), 1.0);
    }`,
  depthWrite: true,
});
const wall = new THREE.Mesh(new THREE.PlaneGeometry(400, 200), wallMat);
wall.position.set(0, 100, ZW);
scene.add(wall);

const floorMat = new THREE.MeshBasicMaterial({ color: COL.paper });
const floorGeo = new THREE.PlaneGeometry(400, 200);
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI / 2;
floor.position.set(0, 0, ZW + 100);
scene.add(floor);
// sombra suave, Navy a 35% sobre o Paper
const shadowCatcher = new THREE.Mesh(
  new THREE.PlaneGeometry(60, 60),
  new THREE.ShadowMaterial({ color: COL.navy, opacity: 0.35, depthWrite: false }),
);
shadowCatcher.rotation.x = -Math.PI / 2;
shadowCatcher.position.set(0, 0.002, 0);
shadowCatcher.receiveShadow = true;
scene.add(shadowCatcher);

// ---------------------------------------------------------------- linhas de descida (paralaxe)
const descentLines = [];
for (const [x, z, f0, f1] of [
  [-3.6, -7, 0.3, 0.72],
  [3.3, -12, 0.16, 0.6],
  [5.4, -16, 0.42, 0.9],
  // v2: mais três linhas, para a queda acelerada ler como velocidade
  [-4.0, -10, 0.1, 0.45],
  [1.6, -5, 0.5, 0.85],
  [-1.8, -18, 0.25, 0.7],
]) {
  const y0 = f0 * Y0;
  const y1 = f1 * Y0;
  const d = CAM0.z - z;
  const w = (2 * d) / FPX; // 2 px no quadro
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, y1 - y0),
    new THREE.MeshBasicMaterial({ color: COL.sky, transparent: true, opacity: 0, depthWrite: false }),
  );
  m.position.set(x, (y0 + y1) / 2, z);
  scene.add(m);
  descentLines.push(m);
}

{
  let cy = CAM0.y;
  let vcy = 0;
  // mola criticamente amortecida: atraso total de cerca de 0,35 s em relação ao ponto médio
  const OMEGA = 2 / 0.35;
  const D0 = CAM0.y - Y0;
  const offOf = (m) => {
    const near = 1 - clamp(m / 6, 0, 1);
    return D0 + 2.6 * near * near;
  };
  const PARK_Y = 0.21 + offOf(0.21);
  const PARK_PITCH = PITCH0 - 5 * DEG;
  let parked = null;
  for (let k = 0; k < NB; k++) {
    const time = T0 + k * DT;
    const m = midY(time);
    const target = m + offOf(m);
    if (time >= T0 + 0.6) {
      const a = OMEGA * OMEGA * (target - cy) - 2 * OMEGA * vcy;
      vcy += a * DT;
      cy += vcy * DT;
    }
    // perto do chão a câmera começa a se inclinar levemente para baixo
    const nearC = 1 - clamp((cy - PARK_Y) / 6, 0, 1);
    let pitch = PITCH0 - 5 * DEG * smooth(nearC);
    let cyUse = cy;
    // depois do toque a câmera assenta na posição de permanência, sem passar dela
    if (time > T_A) {
      const w = smooth((time - T_A) / (H0 - T_A));
      cyUse = cy + (PARK_Y - cy) * w;
      pitch = pitch + (PARK_PITCH - pitch) * w;
    }
    let p = new THREE.Vector3(CAM0.x, cyUse, CAM0.z);
    let q = new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch, 0, 0, "YXZ"));
    if (time >= H0) {
      if (!parked) {
        const dir = new THREE.Vector3(0, Math.sin(pitch), -Math.cos(pitch));
        const d0 = p.y / -dir.y;
        parked = { p: p.clone(), q: q.clone(), pitch, d0, t0: p.clone().addScaledVector(dir, d0) };
      }
      p = parked.p.clone();
      q = parked.q.clone();
      if (time >= TILT0) {
        const s = easeInOut((time - TILT0) / C.INCLINACAO);
        const tgt = parked.t0.clone().lerp(new THREE.Vector3(TOP.pos.x, 0, TOP.pos.z), s);
        const d = parked.d0 * Math.pow(TOP.pos.y / parked.d0, s);
        const pt = parked.pitch + (-90 * DEG - parked.pitch) * s;
        const dir = new THREE.Vector3(0, Math.sin(pt), -Math.cos(pt));
        p = tgt.addScaledVector(dir, -d);
        q = new THREE.Quaternion().setFromEuler(new THREE.Euler(pt, 0, 0, "YXZ"));
      }
    }
    camPos.set([p.x, p.y, p.z], k * 3);
    camQuat.set([q.x, q.y, q.z, q.w], k * 4);
  }
}

// ---------------------------------------------------------------- partículas (só na partida e no impacto)
function makeShard(color, size) {
  const m = new THREE.Mesh(
    new THREE.TetrahedronGeometry(size),
    new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0, transparent: true, opacity: 1, flatShading: true }),
  );
  m.visible = false;
  scene.add(m);
  return m;
}
function cutPointWorld(cut, time) {
  // ponto da fratura na face da frente, no lugar da aliança antes da queda
  const qs = new THREE.Quaternion().setFromAxisAngle(AY, spinAt(time || T0));
  const v = P3(CEN.r, HW, cut.theta).applyQuaternion(qYaw).applyQuaternion(qs).add(RING0);
  return v;
}
const shardTones = [COL.gold, COL.clay, COL.paper];
const shards = [];
// R2: um fragmento minúsculo se solta e cai
const tinyFrag = { m: makeShard(COL.gold, 0.016), t0: T_R2 + 0.12, p0: cutPointWorld(CUT2, T_R2 + 0.12), v: new THREE.Vector3(-0.25, 0.25, 0.35), spin: new THREE.Vector3(9, 5, 7), life: 2.4 };
shards.push(tinyFrag);
// partida: 12 lascas pequenas em tons Gold, Clay e Paper
for (let i = 0; i < 12; i++) {
  const cut = i % 2 ? CUT2 : CUT1;
  const p0 = cutPointWorld(cut);
  const dirOut = P3(1, 0, cut.theta).applyQuaternion(qYaw).normalize();
  const v = dirOut
    .multiplyScalar(0.6 + rnd() * 0.9)
    .add(new THREE.Vector3((rnd() - 0.5) * 0.5, 0.2 + rnd() * 0.7, 0.2 + rnd() * 0.5));
  shards.push({
    m: makeShard(shardTones[i % 3], 0.012 + rnd() * 0.02),
    t0: T0,
    p0,
    v,
    spin: new THREE.Vector3((rnd() - 0.5) * 18, (rnd() - 0.5) * 18, (rnd() - 0.5) * 18),
    life: 1.0 + rnd() * 0.3,
  });
}
// poeira: pontos suaves
function dotTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d");
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, "rgba(255,255,255,1)");
  gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  const t2 = new THREE.CanvasTexture(c);
  t2.colorSpace = THREE.SRGBColorSpace;
  return t2;
}
const DOT_TEX = dotTexture();
function dustCloud(n, color, size) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(n * 3), 3));
  const m = new THREE.Points(g, new THREE.PointsMaterial({ color, size, map: DOT_TEX, transparent: true, opacity: 0, depthWrite: false, sizeAttenuation: true }));
  m.visible = false;
  scene.add(m);
  return m;
}
const dustBreak = { pts: dustCloud(10, COL.paper, 0.05), t0: T0, life: 0.75, seeds: [] };
for (let i = 0; i < 10; i++) {
  const cut = i % 2 ? CUT2 : CUT1;
  dustBreak.seeds.push({ p0: cutPointWorld(cut), v: new THREE.Vector3((rnd() - 0.5) * 0.5, (rnd() - 0.2) * 0.35, (rnd() - 0.2) * 0.4) });
}
// impacto: poeira curta que sobe pouco e some
function contactPoint(key2, time) {
  const p = sampleArr(bake[key2].pos, 3, time, [0, 0, 0]);
  return new THREE.Vector3(p[0], 0.01, p[2]);
}
const dustImpact = [];
for (const [key2, tt, n] of [
  ["A", T_A, 5],
  ["B", T_B, 4],
]) {
  const cp = contactPoint(key2, tt + 0.01);
  const pts = dustCloud(n, COL.gold, 0.06);
  const seeds = [];
  for (let i = 0; i < n; i++) seeds.push({ p0: cp.clone().add(new THREE.Vector3((rnd() - 0.5) * 0.9, 0, (rnd() - 0.5) * 0.5)), v: new THREE.Vector3((rnd() - 0.5) * 0.5, 0.12 + rnd() * 0.18, (rnd() - 0.5) * 0.3) });
  dustImpact.push({ pts, t0: tt, life: 0.7, seeds });
  for (let i = 0; i < 2; i++) {
    shards.push({ m: makeShard(i ? COL.clay : COL.gold, 0.012), t0: tt, p0: cp.clone().add(new THREE.Vector3((rnd() - 0.5) * 0.6, 0.02, (rnd() - 0.5) * 0.3)), v: new THREE.Vector3((rnd() - 0.5) * 0.7, 0.5 + rnd() * 0.3, (rnd() - 0.5) * 0.4), spin: new THREE.Vector3(8, 6, 4), life: 0.6, floor: true });
  }
}
function updateParticles(time) {
  const g = FALL.g;
  for (const s of shards) {
    const a = time - s.t0;
    if (RM || a < 0 || a > s.life) {
      s.m.visible = false;
      continue;
    }
    s.m.visible = true;
    const p = s.p0.clone().addScaledVector(s.v, a);
    p.y -= 0.5 * g * 1.4 * a * a;
    if (s.floor && p.y < 0.01) p.y = 0.01;
    s.m.position.copy(p);
    s.m.rotation.set(s.spin.x * a, s.spin.y * a, s.spin.z * a);
    s.m.material.opacity = 1 - smooth((a - s.life * 0.65) / (s.life * 0.35));
  }
  for (const d of [dustBreak, ...dustImpact]) {
    const a = time - d.t0;
    if (RM || a < 0 || a > d.life) {
      d.pts.visible = false;
      continue;
    }
    d.pts.visible = true;
    const arr = d.pts.geometry.attributes.position.array;
    d.seeds.forEach((sd, i) => {
      const e = easeEnter(a / d.life);
      arr[i * 3] = sd.p0.x + sd.v.x * e;
      arr[i * 3 + 1] = sd.p0.y + sd.v.y * e;
      arr[i * 3 + 2] = sd.p0.z + sd.v.z * e;
    });
    d.pts.geometry.attributes.position.needsUpdate = true;
    d.pts.material.opacity = 0.75 * (1 - smooth(a / d.life));
  }
}

// ---------------------------------------------------------------- estado em um instante
const tmpA = [0, 0, 0];
const tmpQ = [0, 0, 0, 1];
let spinOverride = null; // usado pelo gancho, que tem o próprio giro
function applyHalf(key2, time) {
  const f = FALL[key2];
  const grp = f.half.grp;
  if (time < T0) {
    const p = staticPose(f.half, f.out, time, grp.quaternion, spinOverride !== null ? spinOverride : spinAt(time));
    grp.position.copy(p);
    return;
  }
  sampleArr(bake[key2].pos, 3, time, tmpA);
  grp.position.set(tmpA[0], tmpA[1], tmpA[2]);
  // interpolação esférica entre amostras vizinhas
  const fr = clamp((time - T0) / DT, 0, NB - 1);
  const i = Math.floor(fr);
  const j = Math.min(NB - 1, i + 1);
  const qa = new THREE.Quaternion().fromArray(bake[key2].quat, i * 4);
  const qb = new THREE.Quaternion().fromArray(bake[key2].quat, j * 4);
  grp.quaternion.copy(qa).slerp(qb, fr - i);
}
function cameraAt(time, out) {
  if (time < T0 + 0.0001) {
    out.position.copy(CAM0);
    out.quaternion.copy(camQ0);
    return;
  }
  sampleArr(camPos, 3, time, tmpA);
  sampleArr(camQuat, 4, time, tmpQ);
  out.position.set(tmpA[0], tmpA[1], tmpA[2]);
  out.quaternion.set(tmpQ[0], tmpQ[1], tmpQ[2], tmpQ[3]).normalize();
}
function setState(time) {
  applyHalf("A", time);
  applyHalf("B", time);
  const [p1, p2] = time < T0 ? crackProgress(time) : [0, 0];
  setCrack(CR1, p1);
  setCrack(CR2, p2);
  ringGroup.quaternion.setFromAxisAngle(AY, spinAt(time)).multiply(qYaw);
  ringGroup.position.copy(RING0);
  ringGroup.visible = time < T0;
  updateParticles(time);
  // linhas de descida: só durante a queda
  const lv = smooth((time - T0 - 0.5) / 0.4) * (1 - smooth((time - T_A + 0.5) / 0.4));
  for (const l of descentLines) {
    l.material.opacity = 0.4 * lv;
    l.visible = lv > 0.001;
  }
  cameraAt(time, camera);
  camera.updateMatrixWorld();
}

// ---------------------------------------------------------------- movimento reduzido: quatro quadros com dissolve curto
// (1) aliança inteira (2) rachaduras completas (3) metades separadas (4) metades no chão
const RM_STATES = [
  { from: -1, pose: () => setStateRM(T_REV, 0.2, 0, false) },
  { from: T_R3, pose: () => setStateRM(T_R3 - 0.01, 1, 1, false) },
  { from: T0, pose: () => setStateRM(T0 + 0.32, 0, 0, true) },
  { from: QV.T_A, pose: () => setStateRM(BAKE_T1, 0, 0, false) },
];
function setStateRM(time, c1, c2, airborneStaticCam) {
  applyHalf("A", time);
  applyHalf("B", time);
  setCrack(CR1, c1);
  setCrack(CR2, c2);
  ringGroup.quaternion.copy(qYaw);
  ringGroup.position.copy(RING0);
  ringGroup.visible = time < T0;
  updateParticles(-100);
  for (const l of descentLines) l.visible = false;
  if (airborneStaticCam) {
    camera.position.copy(CAM0);
    camera.quaternion.copy(camQ0);
  } else cameraAt(time, camera);
  camera.updateMatrixWorld();
}
// o dissolve curto entre os quadros usa um segundo canvas por cima, com opacidade
const canvasB = document.getElementById("ring-canvas-b");
let rendererB = null;
if (RM && canvasB) {
  rendererB = new THREE.WebGLRenderer({ canvas: canvasB, antialias: false, alpha: false, preserveDrawingBuffer: true });
  rendererB.setPixelRatio(1);
  rendererB.setSize(W * SS, H * SS, false);
  rendererB.outputColorSpace = THREE.SRGBColorSpace;
  rendererB.toneMapping = THREE.NoToneMapping;
  rendererB.shadowMap.enabled = true;
  rendererB.shadowMap.type = THREE.VSMShadowMap;
}

// ---------------------------------------------------------------- gancho: a aliança no primeiro quadro
// segundo canvas, de fundo transparente, sobre o gradiente CSS da cena do gancho. A câmera olha
// direto para o centro da aliança (centro do canvas), com lente igual à da cena 4, e se aproxima
// devagar enquanto a aliança gira (Ken Burns e órbita). A primeira rachadura nasce no quadro 0 e
// avança em "agora"; ela continua visível quando a aliança volta na cena 4.
const hookCanvas = document.getElementById("hook-canvas");
const HOOK_PX = 800; // tamanho do canvas no quadro (CSS); 2x de supersampling
let hookRenderer = null;
const hookCam = new THREE.PerspectiveCamera((2 * Math.atan(HOOK_PX / 2 / FPX)) / DEG, 1, 0.1, 400);
if (hookCanvas) {
  hookRenderer = new THREE.WebGLRenderer({ canvas: hookCanvas, antialias: false, alpha: true, premultipliedAlpha: true, preserveDrawingBuffer: true });
  hookRenderer.setPixelRatio(1);
  hookRenderer.setSize(HOOK_PX * SS, HOOK_PX * SS, false);
  hookRenderer.outputColorSpace = THREE.SRGBColorSpace;
  hookRenderer.toneMapping = THREE.NoToneMapping;
  hookRenderer.setClearColor(0x000000, 0);
  hookRenderer.shadowMap.enabled = false;
}
function hookState(time) {
  const k = RM ? 0 : clamp(time / T_HOOK_END, 0, 1);
  const pxu = 150 + 18 * easeInOut(k); // de 300 a cerca de 336 px de diâmetro
  const spin = RM ? 0 : (-10 + 18 * k) * DEG;
  const e = (a, d) => (RM ? (time >= a ? 1 : 0) : easeInOut((time - a) / d));
  const p1 = 0.12 * e(0, 0.22) + 0.08 * e(T_AGORA - 0.02, 0.25);
  return { pxu, spin, p1 };
}
function renderHook(time) {
  if (!hookRenderer) return;
  const h = hookState(time);
  spinOverride = h.spin;
  applyHalf("A", T_REV - 1);
  applyHalf("B", T_REV - 1);
  spinOverride = null;
  setCrack(CR1, h.p1);
  setCrack(CR2, 0);
  ringGroup.quaternion.setFromAxisAngle(AY, h.spin).multiply(qYaw);
  ringGroup.position.copy(RING0);
  ringGroup.visible = true;
  updateParticles(-100);
  const hidden = [wall, floor, shadowCatcher, ...descentLines];
  const vis = hidden.map((o) => o.visible);
  for (const o of hidden) o.visible = false;
  const dir = new THREE.Vector3(0, Math.sin(PITCH0), -Math.cos(PITCH0));
  hookCam.position.copy(RING0).addScaledVector(dir, -FPX / h.pxu);
  hookCam.quaternion.copy(camQ0);
  hookCam.updateMatrixWorld();
  hookCam.updateProjectionMatrix();
  hookRenderer.render(scene, hookCam);
  hidden.forEach((o, i) => (o.visible = vis[i]));
}

// ---------------------------------------------------------------- render por quadro
let lastKey = null;
let lastHookKey = null;
function renderAt(time) {
  if (time <= T_HOOK_END + 0.05) {
    const hk = RM ? String(time >= T_AGORA - 0.02) : time.toFixed(4);
    if (hk !== lastHookKey) {
      lastHookKey = hk;
      lastKey = null;
      renderHook(time);
    }
  }
  if (time < T_REV - 0.05 || time > T_END + 0.05) return;
  if (RM) {
    let s = 0;
    for (let i = 0; i < RM_STATES.length; i++) if (time >= RM_STATES[i].from) s = i;
    const k = s > 0 ? clamp((time - RM_STATES[s].from) / 0.25, 0, 1) : 1;
    const keyStr = s + ":" + k.toFixed(3);
    if (keyStr === lastKey) return;
    lastKey = keyStr;
    if (k >= 1) {
      RM_STATES[s].pose();
      renderer.render(scene, camera);
      if (canvasB) canvasB.style.opacity = "0";
      return;
    }
    RM_STATES[s - 1].pose();
    renderer.render(scene, camera);
    RM_STATES[s].pose();
    rendererB.render(scene, camera);
    canvasB.style.opacity = k.toFixed(4);
    return;
  }
  // trechos parados não precisam ser redesenhados (o canvas guarda o último quadro)
  // a aliança gira até a partida; depois da inclinação a imagem fica parada
  let keyStr;
  if (time > QV.TILT1 + 0.02) keyStr = "depois";
  else keyStr = time.toFixed(4);
  if (keyStr === lastKey) return;
  lastKey = keyStr;
  setState(bakeTime(time));
  renderer.render(scene, camera);
}

// texto da cena ancorado no mundo: sobe e sai do quadro quando a câmera desce
const worldText = document.getElementById("s4-world");
function anchorText(time) {
  if (!worldText) return;
  let dy = 0;
  if (!RM && time > T0) {
    cameraAt(Math.min(bakeTime(time), H0), camera);
    dy = Math.min(2600, (CAM0.y - camera.position.y) * 190);
  }
  worldText.style.transform = "translate3d(0," + (-dy).toFixed(2) + "px,0)";
}

// projeção de um ponto do mundo para pixels do quadro, com a câmera de um instante
function screenOf(v, time) {
  setState(time);
  const p = v.clone().project(camera);
  return { x: (p.x * 0.5 + 0.5) * W, y: (0.5 - p.y * 0.5) * H };
}
// ponto de onde a bolinha renasce: o vão da metade A, na vista de cima
function gapPointRest() {
  setState(BAKE_T1);
  const v = capPoint(CUT1, Math.round(NP * 0.06), LEVELS.length - 1, false).sub(HALF_A.cen);
  v.applyQuaternion(HALF_A.grp.quaternion).add(HALF_A.grp.position);
  const p = v.clone().project(camera);
  return { x: (p.x * 0.5 + 0.5) * W, y: (0.5 - p.y * 0.5) * H };
}

// ponto de uma rachadura na face da frente (onde ela nasce), em pixels do quadro, num instante
// antes da partida; usado pelos rótulos com fio que apontam para as rachaduras
function crackScreen(time, k) {
  const cut = k === 2 ? CUT2 : CUT1;
  const u = 0.1;
  const pr = profileAt(u);
  const v = P3(pr.r, pr.z, cut.theta + delta(cut, u));
  const q = new THREE.Quaternion().setFromAxisAngle(AY, spinAt(time)).multiply(qYaw);
  v.applyQuaternion(q).add(RING0);
  camera.position.copy(CAM0);
  camera.quaternion.copy(camQ0);
  camera.updateMatrixWorld();
  const p = v.project(camera);
  lastKey = null;
  return { x: (p.x * 0.5 + 0.5) * W, y: (0.5 - p.y * 0.5) * H };
}

const info = {
  Y0,
  ZW,
  CAM0: CAM0.toArray(),
  TOP: TOP.pos.toArray(),
  T_REV,
  T_R1,
  T_R2,
  T_R3,
  T0,
  // relógio do vídeo (com a rampa de velocidade)
  T_A: QV.T_A,
  T_B: QV.T_B,
  H0: QV.H0,
  TILT0: QV.TILT0,
  TILT1: QV.TILT1,
  // relógio da simulação
  B_T_A: T_A,
  B_T_B: T_B,
  B_H0: H0,
  B_TILT0: TILT0,
  B_TILT1: TILT1,
  crackScreen,
  T_END,
  g: FALL.g,
  vy0B: FALL.check.vy0B,
  ringCenter: screenOf(RING0.clone(), T_REV),
  gap: gapPointRest(),
  restBox: (() => {
    setState(BAKE_T1);
    const pts = [];
    for (const key2 of ["A", "B"]) {
      const grp = FALL[key2].half.grp;
      for (const s of FALL[key2].half.sample) {
        const p = s.clone().applyQuaternion(grp.quaternion).add(grp.position).project(camera);
        pts.push({ x: (p.x * 0.5 + 0.5) * W, y: (0.5 - p.y * 0.5) * H });
      }
    }
    return {
      x0: Math.min(...pts.map((p) => p.x)),
      x1: Math.max(...pts.map((p) => p.x)),
      y0: Math.min(...pts.map((p) => p.y)),
      y1: Math.max(...pts.map((p) => p.y)),
    };
  })(),
};
lastKey = null;

window.addEventListener("hf-seek", (e) => {
  const time = e.detail.time;
  renderAt(time);
  anchorText(time);
});
window.__ALIANCA = { info, renderAt, anchorText, bake, FALL, crackScreen, bakeTime };
if (typeof window.__ALIANCA_RESOLVE === "function") window.__ALIANCA_RESOLVE(info);
const t0 = window.__hfThreeTime || 0;
renderAt(t0);
anchorText(t0);
