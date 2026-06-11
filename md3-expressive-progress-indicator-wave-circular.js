class Md3ExpressiveProgressIndicatorWaveCircular extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.idAnimacao = null;
    this.inicioAnimacao = null;
    this.tratarRedimensionamento = this.iniciarAnimacao.bind(this);
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-flex;
          vertical-align: middle;
          aspect-ratio: 1;
          position: relative;
          align-items: center;
          justify-content: center;
          width: 3rem;
          --cor-primaria: #6750A4;
          --cor-container-secundario: #E8DEF8;
        }
        .progresso {
          position: absolute;
          inset: 0;
        }
        .diametro-e-traco,
        .amplitude-e-comprimento {
          visibility: hidden;
          position: absolute;
        }
        .diametro-e-traco {
          width: inherit;
          height: 0.25rem;
        }
        .amplitude-e-comprimento {
          width: 0.1rem;
          height: 0.9375rem;
        }
        .giro-ondulado {
          transform-origin: center center;
          animation: rotacao-ondulada 1.575s linear infinite;
        }
        @keyframes rotacao-ondulada {
          0%   { transform: rotate(0deg);   }
          10%  { transform: rotate(90deg);  }
          100% { transform: rotate(360deg); }
        }
      </style>
      <div class="progresso" id="envoltorio-svg"></div>
      <div class="diametro-e-traco"></div>
      <div class="amplitude-e-comprimento"></div>
    `;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.iniciarAnimacao();
      });
    });

    window.addEventListener('resize', this.tratarRedimensionamento);
  }

  disconnectedCallback() {
    if (this.idAnimacao) cancelAnimationFrame(this.idAnimacao);
    window.removeEventListener('resize', this.tratarRedimensionamento);
  }

  iniciarAnimacao() {
    this.configurarCirculoOnduladoIndeterminado();
  }

  grausParaRadianos(graus) {
    return (graus - 90) * (Math.PI / 180);
  }

  calcularCirculo(diametro, espessuraTraco, preenchimentoAmplitude) {
    const preenchimento = preenchimentoAmplitude + espessuraTraco / 2;
    const r = diametro / 2;
    const cx = r + preenchimento;
    const cy = r + preenchimento;
    return { cx, cy, r, preenchimento };
  }

  tamanhoParaGraus(tamanho, diametro, espessuraTraco, preenchimentoAmplitude) {
    const circulo = this.calcularCirculo(diametro, espessuraTraco, preenchimentoAmplitude);
    return tamanho * (360 / (2 * Math.PI * circulo.r));
  }

  polarParaCartesiano(circulo, graus) {
    const rad = this.grausParaRadianos(graus);
    return {
      x: circulo.cx + circulo.r * Math.cos(rad),
      y: circulo.cy + circulo.r * Math.sin(rad)
    };
  }

  desenharArco({ diametro, espessuraTraco, amplitude, anguloInicial = 0, anguloFinal = 360, espacamento = 0, preenchimento = undefined }) {
    if (preenchimento === undefined) preenchimento = amplitude;
    if (diametro === 0 || espessuraTraco === 0) return { caminho: '', caixaVisao: '0 0 0 0' };

    const circulo = this.calcularCirculo(diametro, espessuraTraco, preenchimento);

    if (espacamento > 0) {
      const d = this.tamanhoParaGraus(espacamento, diametro, espessuraTraco, preenchimento);
      anguloInicial += d;
      anguloFinal -= d;
    }

    if (anguloFinal - anguloInicial >= 360) anguloFinal = anguloInicial + 359.999;

    const inicio = this.polarParaCartesiano(circulo, anguloFinal);
    const fim = this.polarParaCartesiano(circulo, anguloInicial);
    const arcoGrande = (anguloFinal - anguloInicial) <= 180 ? '0' : '1';
    const caminho = `M ${inicio.x} ${inicio.y} A ${circulo.r} ${circulo.r} 0 ${arcoGrande} 0 ${fim.x} ${fim.y}`;
    const tamanhoCaixa = diametro + circulo.preenchimento * 2;
    const caixaVisao = `0 0 ${tamanhoCaixa} ${tamanhoCaixa}`;
    return { caminho, caixaVisao };
  }

  desenharArcoOndulado({ diametro, espessuraTraco, amplitude, comprimentoOnda, anguloInicial = 0, anguloFinal = 360, espacamento = 0, preenchimento = undefined, amp = undefined, passos = 200 }) {
    if (preenchimento === undefined) preenchimento = amplitude;
    if (amp === undefined) amp = amplitude;
    if (diametro === 0 || espessuraTraco === 0) return { caminho: '', caixaVisao: '0 0 0 0' };

    const circulo = this.calcularCirculo(diametro, espessuraTraco, preenchimento);

    if (espacamento > 0) {
      const d = this.tamanhoParaGraus(espacamento, diametro, espessuraTraco, preenchimento);
      anguloInicial += d;
      anguloFinal -= d;
    }

    let radInicial = this.grausParaRadianos(anguloInicial);
    let radFinal = this.grausParaRadianos(anguloFinal);
    
    if (anguloInicial === anguloFinal) {
      radFinal = radInicial;
    } else if (radFinal < radInicial) {
      radFinal += Math.PI * 2;
    }

    const anguloTotal = radFinal - radInicial;
    const contagemOndas = 2 * Math.PI * circulo.r / comprimentoOnda;
    const fase = Math.PI / 2 * (contagemOndas - 1);

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

    const textoCaminho = pontos.length === 1
      ? `M ${pontos[0][0]},${pontos[0][1]}`
      : `M ${pontos[0][0]},${pontos[0][1]} ` + pontos.slice(1).map(([x,y]) => `L ${x},${y}`).join(' ');

    const tamanhoCaixa = diametro + circulo.preenchimento * 2;
    const caixaVisao = `0 0 ${tamanhoCaixa} ${tamanhoCaixa}`;
    return { caminho: textoCaminho, caixaVisao };
  }

  calcularVarreduraIndeterminadaOndulada(t, diametro, espessuraTraco, amplitude) {
    const duracaoIndeterminada = 1.575;
    const preenchimentoVarredura = this.tamanhoParaGraus(espessuraTraco, diametro, espessuraTraco, amplitude) * 2;
    const varreduraMin = 18 + preenchimentoVarredura;
    const varreduraMax = 280 - preenchimentoVarredura;
    const ciclo = duracaoIndeterminada * 4;
    const u = t % ciclo;

    if (u < duracaoIndeterminada) return varreduraMin;
    if (u < duracaoIndeterminada * 2) {
      const p = (u - duracaoIndeterminada) / duracaoIndeterminada;
      return varreduraMin + (varreduraMax - varreduraMin) * (p * p * (3 - 2 * p));
    }
    if (u < duracaoIndeterminada * 3) return varreduraMax;
    const p = (u - duracaoIndeterminada * 3) / duracaoIndeterminada;
    return varreduraMax - (varreduraMax - varreduraMin) * (p * p * (3 - 2 * p));
  }

  obterDimensoesCirculares() {
    const dt = this.shadowRoot.querySelector('.diametro-e-traco');
    const ac = this.shadowRoot.querySelector('.amplitude-e-comprimento');
    return {
      diametro: dt ? dt.clientWidth : this.clientWidth,
      espessuraTraco: dt ? dt.clientHeight : 4,
      amplitude: ac ? ac.clientWidth : 2,
      comprimentoOnda: ac ? ac.clientHeight : 15,
    };
  }

  configurarCirculoOnduladoIndeterminado() {
    if (this.idAnimacao) cancelAnimationFrame(this.idAnimacao);
    this.inicioAnimacao = null;

    const { diametro, espessuraTraco, amplitude, comprimentoOnda } = this.obterDimensoesCirculares();
    if (diametro === 0 || amplitude === 0 || comprimentoOnda === 0) return;

    const arcoEspaco = this.desenharArcoOndulado({ diametro, espessuraTraco, amplitude, comprimentoOnda, anguloFinal: 20 });
    const envoltorio = this.shadowRoot.getElementById('envoltorio-svg');

    envoltorio.innerHTML = `
      <svg class="giro-ondulado" width="${diametro}" height="${diametro}" viewBox="${arcoEspaco.caixaVisao}" style="position:absolute;inset:0;width:100%;height:100%;">
        <path class="trilha-ativa" id="trilha-ativa-ind"
          stroke="var(--cor-primaria)" stroke-width="${espessuraTraco}"
          stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <path class="trilha" id="trilha-ind"
          stroke="var(--cor-container-secundario)" stroke-width="${espessuraTraco}"
          fill="none" stroke-linecap="round"/>
      </svg>`;

    const svgEl = envoltorio.querySelector('svg');
    const ativa = svgEl.querySelector('#trilha-ativa-ind');
    const trilha = svgEl.querySelector('#trilha-ind');

    const quadro = (ts) => {
      if (!this.inicioAnimacao) this.inicioAnimacao = ts;
      const t = (ts - this.inicioAnimacao) / 1000;

      const varredura = this.calcularVarreduraIndeterminadaOndulada(t, diametro, espessuraTraco, amplitude);
      const espacamentoMin = this.tamanhoParaGraus(espessuraTraco, diametro, espessuraTraco, amplitude);

      const caminhoAtivo = this.desenharArcoOndulado({ diametro, espessuraTraco, amplitude, comprimentoOnda, anguloFinal: varredura });
      const caminhoTrilha = this.desenharArco({
        diametro, espessuraTraco, amplitude,
        espacamento: espacamentoMin,
        anguloInicial: varredura
      });

      ativa.setAttribute('d', caminhoAtivo.caminho);
      trilha.setAttribute('d', caminhoTrilha.caminho);

      this.idAnimacao = requestAnimationFrame(quadro);
    };

    this.idAnimacao = requestAnimationFrame(quadro);
  }
}

customElements.define('md3-expressive-progress-indicator-wave-circular', Md3ExpressiveProgressIndicatorWaveCircular);