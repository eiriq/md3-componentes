const DIAMETRO = 48;
const TRACO = 4;
const AMPLITUDE = 1.6;
const COMPRIMENTO_ONDA = 15;
const DURACAO_INDETERMINADA = 1.575;

function grausParaRadianos(graus) {
  return (graus - 90) * (Math.PI / 180);
}

function calcularCirculo(preenchimento) {
  const p = preenchimento + TRACO / 2;
  const r = DIAMETRO / 2;
  const cx = r + p;
  const cy = r + p;
  return { cx, cy, r, preenchimento: p };
}

function polarParaCartesiano(circulo, graus) {
  const rad = grausParaRadianos(graus);
  return {
    x: circulo.cx + circulo.r * Math.cos(rad),
    y: circulo.cy + circulo.r * Math.sin(rad)
  };
}

function tamanhoParaGraus(tamanho, preenchimento = AMPLITUDE) {
  return tamanho * (360 / (2 * Math.PI * calcularCirculo(preenchimento).r));
}

function desenharArco({ anguloInicial = 0, anguloFinal = 360, espacamento = 0, preenchimento = AMPLITUDE } = {}) {
  if (DIAMETRO === 0 || TRACO === 0) return { caminho: "", caixaVisao: "0 0 0 0" };
  const circulo = calcularCirculo(preenchimento);
  if (espacamento > 0) {
    anguloInicial += tamanhoParaGraus(espacamento, preenchimento);
    anguloFinal -= tamanhoParaGraus(espacamento, preenchimento);
  }
  if (anguloFinal - anguloInicial >= 360) anguloFinal = anguloInicial + 359.999;
  const inicio = polarParaCartesiano(circulo, anguloFinal);
  const fim = polarParaCartesiano(circulo, anguloInicial);
  const arcoGrande = anguloFinal - anguloInicial <= 180 ? "0" : "1";
  const caminho = `M ${inicio.x} ${inicio.y} A ${circulo.r} ${circulo.r} 0 ${arcoGrande} 0 ${fim.x} ${fim.y}`;
  const caixaVisao = `0 0 ${DIAMETRO + circulo.preenchimento * 2} ${DIAMETRO + circulo.preenchimento * 2}`;
  return { caminho, caixaVisao };
}

function desenharArcoOndulado({ anguloInicial = 0, anguloFinal = 360, espacamento = 0, preenchimento = AMPLITUDE, amp = AMPLITUDE, passos = 200 } = {}) {
  if (DIAMETRO === 0 || TRACO === 0) return { caminho: "", caixaVisao: "0 0 0 0" };
  const circulo = calcularCirculo(preenchimento);
  if (espacamento > 0) {
    anguloInicial += tamanhoParaGraus(espacamento, preenchimento);
    anguloFinal -= tamanhoParaGraus(espacamento, preenchimento);
  }
  const radInicial = grausParaRadianos(anguloInicial);
  let radFinal = grausParaRadianos(anguloFinal);
  if (anguloInicial === anguloFinal) {
    radFinal = radInicial;
  } else if (radFinal < radInicial) {
    radFinal += Math.PI * 2;
  }
  const anguloTotal = radFinal - radInicial;
  const contagemOndas = (2 * Math.PI * circulo.r) / COMPRIMENTO_ONDA;
  const fase = (Math.PI / 2) * (contagemOndas - 1);
  const pontos = [];
  for (let i = 0; i <= passos; i++) {
    const t = passos === 0 ? 0 : i / passos;
    const angulo = radInicial + t * anguloTotal;
    const onda = Math.sin(angulo * contagemOndas + fase);
    const raio = circulo.r - amp * onda;
    const x = raio * Math.cos(angulo) + circulo.cx;
    const y = raio * Math.sin(angulo) + circulo.cy;
    pontos.push([x, y]);
  }
  const caminho = pontos.length === 1
    ? `M ${pontos[0][0]},${pontos[0][1]}`
    : `M ${pontos[0][0]},${pontos[0][1]} ` + pontos.slice(1).map(([x, y]) => `L ${x},${y}`).join(" ");
  const caixaVisao = `0 0 ${DIAMETRO + circulo.preenchimento * 2} ${DIAMETRO + circulo.preenchimento * 2}`;
  return { caminho, caixaVisao };
}

function calcularVarreduraIndeterminadaOndulada(t) {
  const preenchimentoVarredura = tamanhoParaGraus(TRACO) * 2;
  const varreduraMin = 18 + preenchimentoVarredura;
  const varreduraMax = 280 - preenchimentoVarredura;
  const ciclo = DURACAO_INDETERMINADA * 4;
  const u = t % ciclo;
  if (u < DURACAO_INDETERMINADA) return varreduraMin;
  if (u < DURACAO_INDETERMINADA * 2) {
    const p = (u - DURACAO_INDETERMINADA) / DURACAO_INDETERMINADA;
    return varreduraMin + (varreduraMax - varreduraMin) * (p * p * (3 - 2 * p));
  }
  if (u < DURACAO_INDETERMINADA * 3) return varreduraMax;
  const p = (u - DURACAO_INDETERMINADA * 3) / DURACAO_INDETERMINADA;
  return varreduraMax - (varreduraMax - varreduraMin) * (p * p * (3 - 2 * p));
}

class IndicadorOnduladoIndeterminado extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.tempoInicial = performance.now();
    this.renderizar();
  }

  renderizar() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-flex;
          vertical-align: middle;
          aspect-ratio: 1;
          position: relative;
          align-items: center;
          justify-content: center;
          width: ${DIAMETRO}px;
        }
        svg {
          position: absolute;
          inset: 0;
        }
        .giratorio {
          transform-origin: 50% 50%;
          animation: girar-ondulado ${DURACAO_INDETERMINADA}s linear infinite;
        }
        .trilha-ativa {
          stroke: var(--cor-primaria, #6750A4);
          stroke-width: ${TRACO};
          stroke-linecap: round;
          stroke-linejoin: round;
          fill: none;
        }
        .trilha {
          stroke: var(--cor-trilha, #E8DEF8);
          stroke-width: ${TRACO};
          fill: none;
          stroke-linecap: round;
        }
        @keyframes girar-ondulado {
          0% { transform: rotate(0deg); }
          10% { transform: rotate(90deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
      <svg viewBox="${desenharArcoOndulado({ anguloFinal: 20 }).caixaVisao}">
        <path class="giratorio trilha-ativa" />
        <path class="giratorio trilha" />
      </svg>`;
    this.elTrilhaAtiva = this.shadowRoot.querySelector(".trilha-ativa");
    this.elTrilha = this.shadowRoot.querySelector(".trilha");
    this.ciclo();
  }

  ciclo() {
    const t = (performance.now() - this.tempoInicial) / 1000;
    const varredura = calcularVarreduraIndeterminadaOndulada(t);
    this.elTrilhaAtiva.setAttribute("d", desenharArcoOndulado({ anguloFinal: varredura }).caminho);
    this.elTrilha.setAttribute("d", desenharArco({ espacamento: tamanhoParaGraus(TRACO), anguloInicial: varredura }).caminho);
    this.idQuadro = requestAnimationFrame(() => this.ciclo());
  }

  disconnectedCallback() {
    cancelAnimationFrame(this.idQuadro);
  }
}

customElements.define("indicador-ondulado-indeterminado", IndicadorOnduladoIndeterminado);