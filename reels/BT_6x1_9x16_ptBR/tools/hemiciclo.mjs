// Hemiciclo gerado por código: posições das cadeiras, distribuição dos votos e instantes da varredura.
// Tudo é determinístico: a mesma entrada produz sempre a mesma saída (nenhum Math.random sem semente).

/** Cadeiras por fileira proporcionais ao comprimento do arco (pi * r), fechando o total pelo método dos maiores restos. */
export function cadeirasPorFileira(total, raios) {
  const soma = raios.reduce((a, r) => a + r, 0);
  const ideal = raios.map((r) => (total * r) / soma);
  const base = ideal.map(Math.floor);
  const faltam = total - base.reduce((a, b) => a + b, 0);
  ideal
    .map((v, i) => ({ resto: v - Math.floor(v), i }))
    .sort((a, b) => b.resto - a.resto || b.i - a.i)
    .slice(0, faltam)
    .forEach(({ i }) => {
      base[i] += 1;
    });
  return base;
}

/**
 * Posições em coordenadas locais (origem no centro da base do arco, y para cima negativo).
 * Cada fileira distribui suas cadeiras com passo angular uniforme entre 180 e 0 graus.
 * A lista volta ordenada pela varredura: da esquerda para a direita pelo ângulo, e de dentro para fora no empate.
 */
export function layoutHemiciclo({ total, fileiras, raioInterno, raioExterno }) {
  const raios = Array.from(
    { length: fileiras },
    (_, i) => raioInterno + ((raioExterno - raioInterno) * i) / (fileiras - 1),
  );
  const porFileira = cadeirasPorFileira(total, raios);
  const cadeiras = [];
  raios.forEach((r, fileira) => {
    const n = porFileira[fileira];
    for (let k = 0; k < n; k++) {
      const theta = Math.PI * (1 - k / (n - 1));
      cadeiras.push({ fileira, theta, x: r * Math.cos(theta), y: -r * Math.sin(theta) });
    }
  });
  cadeiras.sort((a, b) => b.theta - a.theta || a.fileira - b.fileira);
  const passoArco = raios.map((r, i) => (Math.PI * r) / (porFileira[i] - 1));
  const passoFileira = (raioExterno - raioInterno) / (fileiras - 1);
  return { raios, porFileira, cadeiras, passoArco, passoFileira };
}

/** Raio interno que iguala o passo médio ao longo do arco ao passo entre fileiras (cadeiras com espaçamento uniforme). */
export function raioInternoEquilibrado({ total, fileiras, raioExterno }) {
  let melhor = { r: 0, erro: Infinity };
  for (let r = Math.round(raioExterno * 0.3); r < raioExterno * 0.85; r += 1) {
    const { passoArco, passoFileira } = layoutHemiciclo({ total, fileiras, raioInterno: r, raioExterno });
    const medio = passoArco.reduce((a, b) => a + b, 0) / passoArco.length;
    const erro = Math.abs(medio - passoFileira);
    if (erro < melhor.erro) melhor = { r, erro };
  }
  return melhor.r;
}

function mulberry32(semente) {
  let s = semente >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Espalha "não" e as cadeiras neutras de forma uniforme ao longo da varredura, por amostragem estratificada
 * com semente fixa. Nenhum lado do arco concentra votos contrários ou ausências, o que evitaria leitura
 * de esquerda e direita política. Grupos de até duas cadeiras ficam no centro de cada estrato, sem sorteio,
 * para que um voto isolado caia no meio do arco e não num dos lados. O restante é "sim".
 */
export function distribuirVotos(total, { sim, nao }, semente = 221) {
  const rand = mulberry32(semente);
  const status = new Array(total).fill(null);
  const espalhar = (qtd, rotulo) => {
    for (let s = 0; s < qtd; s++) {
      const ini = (s * total) / qtd;
      const fim = ((s + 1) * total) / qtd;
      const desvio = qtd <= 2 ? 0 : (rand() - 0.5) * 0.7;
      let pos = Math.floor(ini + (0.5 + desvio) * (fim - ini));
      while (status[pos] !== null) pos = (pos + 1) % total;
      status[pos] = rotulo;
    }
  };
  espalhar(nao, "nao");
  espalhar(total - sim - nao, "neutra");
  return status.map((v) => v ?? "sim");
}

function bezier(t, a, c) {
  const u = 1 - t;
  return 3 * u * u * t * a + 3 * u * t * t * c + t * t * t;
}

/** Fração de tempo em que uma curva cubic-bezier atinge o progresso p (inversa da easing, por bisseção). */
export function tempoParaProgresso(p, [x1, y1, x2, y2]) {
  if (p <= 0) return 0;
  if (p >= 1) return 1;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 40; i++) {
    const t = (lo + hi) / 2;
    if (bezier(t, y1, y2) < p) lo = t;
    else hi = t;
  }
  return bezier((lo + hi) / 2, x1, x2);
}

/**
 * Instante em que cada cadeira acende, na ordem da varredura. A mesma curva comanda as cadeiras,
 * o contador e a linha do quórum, então os três ficam sincronizados por construção.
 */
export function instantesVarredura(n, inicio, duracao, curva = [0.4, 0, 0.2, 1]) {
  return Array.from({ length: n }, (_, j) => inicio + duracao * tempoParaProgresso((j + 1) / n, curva));
}

/** Índice, na ordem da varredura, da cadeira "sim" de número `quorum` (a que atinge o mínimo constitucional). */
export function indiceDoQuorum(status, quorum) {
  let contagem = 0;
  for (let j = 0; j < status.length; j++) {
    if (status[j] === "sim") contagem += 1;
    if (contagem === quorum) return j;
  }
  return -1;
}
