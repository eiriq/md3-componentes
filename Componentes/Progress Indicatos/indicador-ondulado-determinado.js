const DIAMETRO = 48;
const TRACO = 4;
const AMPLITUDE = 1.6;
const COMPRIMENTO_ONDA = 15;

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

class IndicadorOnduladoDeterminado extends HTMLElement {
  static get observedAttributes() {
    return ["valor"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.idMascara = `mascara-${Math.random().toString(36).substr(2, 9)}`;
    this.valorAtual = 0;
    this.renderizarEstatico();
  }

  attributeChangedCallback(nome, valorAntigo, novoValor) {
    if (nome === "valor") {
      this.valorAtual = parseFloat(novoValor) || 0;
      this.atualizarCaminhos();
    }
  }

  renderizarEstatico() {
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
        .onda {
          animation: girar-reverso 8s linear infinite;
          transform-origin: 50% 50%;
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
        .conteudo {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
          color: var(--cor-primaria, #6750A4);
          z-index: 1;
        }
        @keyframes girar-reverso {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
      </style>
      <svg class="progresso" aria-hidden="true">
        <defs>
          <mask id="${this.idMascara}">
            <path id="caminho-mascara" fill="none" stroke="white" stroke-linecap="round" />
          </mask>
        </defs>
        <g id="grupo-ativo" class="trilha-ativa">
          <path id="caminho-ativo" />
        </g>
        <path id="caminho-trilha" class="trilha" />
      </svg>
      <div class="conteudo"><span class="texto">0%</span></div>`;
      
    this.elSvg = this.shadowRoot.querySelector(".progresso");
    this.elTexto = this.shadowRoot.querySelector(".texto");
    this.elCaminhoMascara = this.shadowRoot.querySelector("#caminho-mascara");
    this.elGrupoAtivo = this.shadowRoot.querySelector("#grupo-ativo");
    this.elCaminhoAtivo = this.shadowRoot.querySelector("#caminho-ativo");
    this.elCaminhoTrilha = this.shadowRoot.querySelector("#caminho-trilha");
    this.atualizarCaminhos();
  }

  atualizarCaminhos() {
    const valor = this.valorAtual;
    this.elTexto.textContent = `${Math.round(valor)}%`;

    const grausMin = tamanhoParaGraus(TRACO * 2, AMPLITUDE);
    let graus = (valor / 100) * 360;
    if (graus > 0) {
      graus = Math.max(0, grausMin, graus);
    }

    const amplitude = (graus <= grausMin + grausMin / 2 || graus === 360) ? 0 : AMPLITUDE;
    const arcoAtivo = desenharArco({ espacamento: graus < 360 ? TRACO : 0, anguloFinal: graus, preenchimento: AMPLITUDE });
    const ativo = amplitude === 0 ? arcoAtivo : desenharArcoOndulado({ anguloFinal: 360, amplitude, preenchimento: AMPLITUDE });
    const inativo = desenharArco({ espacamento: graus > 0 ? TRACO : 0, anguloInicial: graus, anguloFinal: 360, preenchimento: AMPLITUDE });
    const preenchimento = amplitude > 0 ? amplitude + TRACO / 2 : TRACO;

    this.elSvg.setAttribute("viewBox", inativo.caixaVisao);

    if (graus > 0) {
      this.elGrupoAtivo.style.display = '';
      this.elCaminhoAtivo.setAttribute("d", ativo.caminho);

      if (amplitude > 0) {
        this.elGrupoAtivo.setAttribute("mask", `url(#${this.idMascara})`);
        this.elCaminhoAtivo.classList.add("onda");
        this.elCaminhoMascara.setAttribute("d", arcoAtivo.caminho);
        this.elCaminhoMascara.setAttribute("stroke-width", TRACO + preenchimento);
      } else {
        this.elGrupoAtivo.removeAttribute("mask");
        this.elCaminhoAtivo.classList.remove("onda");
      }
    } else {
      this.elGrupoAtivo.style.display = 'none';
    }

    if (360 - graus >= grausMin) {
      this.elCaminhoTrilha.style.display = '';
      this.elCaminhoTrilha.setAttribute("d", inativo.caminho);
    } else {
      this.elCaminhoTrilha.style.display = 'none';
    }
  }
}

customElements.define("indicador-ondulado-determinado", IndicadorOnduladoDeterminado);