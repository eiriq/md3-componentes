class ControleDeslizante extends HTMLElement {
  static get observedAttributes() {
    return ['min', 'max', 'passo', 'valor', 'valor-inferior', 'valor-superior', 'discreto', 'rotulado', 'tamanho', 'desativado', 'intervalo'];
  }

  constructor() {
    super();
    this.polegarAtivo = null;
    this.polegaresAlterados = new Set();
  }

  connectedCallback() {
    this._render();
    this._setupListeners();
    requestAnimationFrame(() => this.atualizarDimensoes());
    this._observer = new ResizeObserver(() => this.atualizarDimensoes());
    this._observer.observe(this);
  }

  disconnectedCallback() {
    if (this._observer) this._observer.disconnect();
  }

  attributeChangedCallback(nome, antigo, novo) {
    if (!this.querySelector('.base')) return;
    const estruturais = ['discreto', 'rotulado', 'tamanho', 'desativado', 'intervalo'];
    if (estruturais.includes(nome)) {
      this._render();
      this._setupListeners();
      requestAnimationFrame(() => this.atualizarDimensoes());
    } else if (nome === 'valor' || nome === 'valor-inferior' || nome === 'valor-superior') {
      this.atualizarDimensoes();
    }
  }

  get min() { return parseFloat(this.getAttribute('min') ?? 0); }
  get max() { return parseFloat(this.getAttribute('max') ?? 100); }
  get passo() { return parseFloat(this.getAttribute('passo') ?? 1); }
  get eIntervalo() { return this.hasAttribute('intervalo'); }
  get eDiscreto() { return this.hasAttribute('discreto'); }
  get eRotulado() { return this.hasAttribute('rotulado'); }
  get estaDesativado() { return this.hasAttribute('desativado'); }

  _render() {
    const valor = this.getAttribute('valor') ?? 50;
    const valorInferior = this.getAttribute('valor-inferior') ?? 20;
    const valorSuperior = this.getAttribute('valor-superior') ?? 80;

    this.innerHTML = `
      <style>
        :host {
          display: inline-block;
          vertical-align: middle;
          min-inline-size: var(--controle-deslizante-largura-min, 12.5rem);
          user-select: none;
          -webkit-tap-highlight-color: rgba(0,0,0,0);
          cursor: pointer;
          width: 100%;
          position: relative;
        }
        :host([desativado]) {
          cursor: default;
          pointer-events: none;
        }
        :host([tamanho="extra-small"]),
        :host(:not([tamanho])),
        :host([tamanho="small"]) {
          height: var(--controle-deslizante-altura-pequena, 2.75rem);
        }
        :host([tamanho="medium"]) { height: var(--controle-deslizante-altura-media, 3.25rem); }
        :host([tamanho="large"]) { height: var(--controle-deslizante-altura-grande, 4.25rem); }
        :host([tamanho="extra-large"]) { height: var(--controle-deslizante-altura-extra-grande, 6.75rem); }

        .base {
          display: inline-flex;
          align-items: center;
          position: relative;
          width: 100%;
          height: 100%;
          border-radius: inherit;
          outline: none;
          touch-action: none;
        }

        :host([tamanho="extra-small"]) .base,
        :host(:not([tamanho])) .base,
        :host([tamanho="small"]) .base {
          --_forma-trilha-ativa: var(--controle-deslizante-forma-ativa-pequena, 0.5rem 0 0 0.5rem);
          --_forma-trilha-inativa-inicio: var(--controle-deslizante-forma-inativa-inicio-pequena, 0.5rem 0 0 0.5rem);
          --_forma-trilha-inativa-fim: var(--controle-deslizante-forma-inativa-fim-pequena, 0 0.5rem 0.5rem 0);
        }
        :host([tamanho="medium"]) .base {
          --_forma-trilha-ativa: var(--controle-deslizante-forma-ativa-media, 0.75rem 0 0 0.75rem);
          --_forma-trilha-inativa-inicio: var(--controle-deslizante-forma-inativa-inicio-media, 0.75rem 0 0 0.75rem);
          --_forma-trilha-inativa-fim: var(--controle-deslizante-forma-inativa-fim-media, 0 0.75rem 0.75rem 0);
        }
        :host([tamanho="large"]) .base {
          --_forma-trilha-ativa: var(--controle-deslizante-forma-ativa-grande, 1rem 0 0 1rem);
          --_forma-trilha-inativa-inicio: var(--controle-deslizante-forma-inativa-inicio-grande, 1rem 0 0 1rem);
          --_forma-trilha-inativa-fim: var(--controle-deslizante-forma-inativa-fim-grande, 0 1rem 1rem 0);
        }
        :host([tamanho="extra-large"]) .base {
          --_forma-trilha-ativa: var(--controle-deslizante-forma-ativa-extra-grande, 1.75rem 0 0 1.75rem);
          --_forma-trilha-inativa-inicio: var(--controle-deslizante-forma-inativa-inicio-extra-grande, 1.75rem 0 0 1.75rem);
          --_forma-trilha-inativa-fim: var(--controle-deslizante-forma-inativa-fim-extra-grande, 0 1.75rem 1.75rem 0);
        }

        .trilha {
          position: relative;
          flex: 1 1 auto;
          touch-action: none;
        }
        :host([tamanho="extra-small"]) .trilha,
        :host(:not([tamanho])) .trilha { height: var(--controle-deslizante-altura-trilha-extra-pequena, 1rem); }
        :host([tamanho="small"]) .trilha { height: var(--controle-deslizante-altura-trilha-pequena, 1.5rem); }
        :host([tamanho="medium"]) .trilha { height: var(--controle-deslizante-altura-trilha-media, 2.5rem); }
        :host([tamanho="large"]) .trilha { height: var(--controle-deslizante-altura-trilha-grande, 3.5rem); }
        :host([tamanho="extra-large"]) .trilha { height: var(--controle-deslizante-altura-trilha-extra-grande, 6rem); }

        .trilha-inativa, .trilha-ativa {
          position: absolute;
          height: 100%;
          touch-action: none;
        }
        .trilha-ativa {
          margin-inline-start: var(--_deslocamento-trilha-ativa, 0px);
          width: var(--_tamanho-trilha-ativa, 0px);
          border-radius: var(--_forma-trilha-ativa-meio, var(--_forma-trilha-ativa));
        }
        .trilha-inativa.inicio {
          width: var(--_tamanho-trilha-inativa-antes, 0px);
          border-radius: var(--_forma-trilha-inativa-inicio);
        }
        .trilha-inativa.fim {
          margin-inline-start: var(--_deslocamento-trilha-inativa-depois, 0px);
          width: var(--_tamanho-trilha-inativa-depois, 0px);
          border-radius: var(--_forma-trilha-inativa-fim);
        }

        :host(:not([desativado])) .trilha-inativa { background-color: var(--controle-deslizante-cor-trilha-inativa, var(--md-sys-color-secondary-container, #E8DEF8)); }
        :host(:not([desativado])) .trilha-ativa { background-color: var(--controle-deslizante-cor-trilha-ativa, var(--md-sys-color-primary, #6750A4)); }
        :host([desativado]) .trilha-inativa { background-color: color-mix(in srgb, var(--controle-deslizante-cor-trilha-inativa-desativada, var(--md-sys-color-on-surface, #1D1B20)) var(--controle-deslizante-opacidade-trilha-inativa-desativada, 12%), transparent); }
        :host([desativado]) .trilha-ativa { background-color: color-mix(in srgb, var(--controle-deslizante-cor-trilha-ativa-desativada, var(--md-sys-color-on-surface, #1D1B20)) var(--controle-deslizante-opacidade-trilha-ativa-desativada, 38%), transparent); }

        .marcas {
          position: absolute;
          width: 100%;
          height: var(--controle-deslizante-tamanho-marca, 0.25rem);
          overflow: visible;
          touch-action: none;
        }
        .marca {
          position: absolute;
          top: 0;
          touch-action: none;
          inset-inline-start: calc(var(--controle-deslizante-tamanho-marca, 0.25rem) + calc(var(--controle-deslizante-tamanho-marca, 0.25rem) / 2));
          width: var(--controle-deslizante-tamanho-marca, 0.25rem);
          height: var(--controle-deslizante-tamanho-marca, 0.25rem);
          border-radius: var(--controle-deslizante-forma-marca, 624.9375rem);
        }
        :host(:not([desativado])) .marca.ativa { background-color: var(--controle-deslizante-cor-marca-ativa, var(--md-sys-color-on-primary, #FFFFFF)); }
        :host(:not([desativado])) .marca.inativa { background-color: var(--controle-deslizante-cor-marca-inativa, var(--md-sys-color-on-secondary-container, #4A4458)); }
        :host([desativado]) .marca.ativa { background-color: var(--controle-deslizante-cor-marca-ativa-desativada, var(--md-sys-color-inverse-on-surface, #F5EFF7)); }
        :host([desativado]) .marca.inativa { background-color: var(--controle-deslizante-cor-marca-inativa-desativada, var(--md-sys-color-on-surface, #1D1B20)); }
        :host(:not([discreto])) .marca.ativa { display: none; }

        :host([rotulado]:hover) .base,
        :host([rotulado]:focus-within) .base {
          --_visibilidade-rotulo: visible;
          --_opacidade-rotulo: 1;
          --_transformacao-rotulo: scale(1);
        }

        :host(.animando) .trilha-ativa,
        :host(.animando) .trilha-inativa.inicio,
        :host(.animando) .trilha-inativa.fim {
          transition: margin-inline-start 150ms cubic-bezier(0.31, 0.94, 0.34, 1.00), width 150ms cubic-bezier(0.31, 0.94, 0.34, 1.00);
        }

        .polegar {
          display: block;
          box-sizing: border-box;
          position: absolute;
          outline: none;
          top: 0;
          bottom: 0;
          border-radius: var(--controle-deslizante-forma-polegar, 624.9375rem);
          user-select: none;
          -webkit-tap-highlight-color: rgba(0,0,0,0);
          cursor: inherit;
        }
        .polegar .base {
          box-sizing: border-box;
          vertical-align: middle;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          position: relative;
          width: 100%;
          height: 100%;
          border-radius: inherit;
        }
        .polegar .toque {
          position: absolute;
          height: 3rem;
          left: 0; right: 0;
          touch-action: none;
        }
        .polegar .envoltorio {
          display: inline-flex;
          justify-content: center;
          height: 100%;
          border-radius: inherit;
          width: calc(var(--controle-deslizante-largura-polegar, 0.25rem) + calc(var(--controle-deslizante-preenchimento-polegar, 0.375em) * 2));
        }
        .polegar:focus-visible .anel-foco {
          outline: 3px solid var(--md-sys-color-primary, #6750A4);
          outline-offset: 2px;
          border-radius: 624.9375rem;
          position: absolute;
          top: calc(0px - 3px);
          bottom: calc(0px - 3px);
          left: 3px;
          right: 3px;
          pointer-events: none;
        }
        .polegar .anel-foco { position: absolute; pointer-events: none; }

        .polegar .rotulo {
          user-select: none;
          position: absolute;
          display: flex;
          align-items: center;
          justify-content: center;
          visibility: var(--_visibilidade-rotulo, hidden);
          opacity: var(--_opacidade-rotulo, 0);
          transform: var(--_transformacao-rotulo, scale(0));
          transition: opacity 150ms cubic-bezier(0.2, 0.0, 0, 1.0), transform 150ms cubic-bezier(0.2, 0.0, 0, 1.0), visibility 150ms cubic-bezier(0.2, 0.0, 0, 1.0) allow-discrete;
          width: var(--controle-deslizante-largura-rotulo, 3rem);
          height: var(--_altura-rotulo, 2.75rem);
          top: calc(0px - var(--_altura-rotulo, 2.75rem) - var(--_margem-rotulo, 0.25rem));
          inset-inline-start: calc(0px - 100%);
          border-radius: var(--controle-deslizante-forma-rotulo, 624.9375rem);
          background-color: var(--controle-deslizante-cor-fundo-rotulo, var(--md-sys-color-inverse-surface, #322F35));
          color: var(--controle-deslizante-cor-rotulo, var(--md-sys-color-inverse-on-surface, #F5EFF7));
          font-size: var(--controle-deslizante-tamanho-fonte-rotulo, 0.75rem);
          font-weight: var(--controle-deslizante-peso-fonte-rotulo, 500);
          line-height: var(--controle-deslizante-altura-linha-rotulo, 1rem);
          letter-spacing: var(--controle-deslizante-espacamento-rotulo, 0.03125rem);
        }

        .polegar .cabeca {
          height: 100%;
          width: var(--controle-deslizante-largura-polegar, 0.25rem);
          border-radius: inherit;
          transition: width 100ms cubic-bezier(0.2, 0.0, 0, 1.0);
        }
        .polegar.ativo .cabeca { width: var(--controle-deslizante-largura-polegar-pressionado, 2px); }
        .polegar:not([aria-disabled="true"]) .cabeca { background-color: var(--controle-deslizante-cor-polegar, var(--md-sys-color-primary, #6750A4)); }
        .polegar[aria-disabled="true"] .cabeca {
          opacity: var(--controle-deslizante-opacidade-polegar-desativado, 38%);
          background-color: var(--controle-deslizante-cor-polegar-desativado, var(--md-sys-color-on-surface, #1D1B20));
        }

        @media (prefers-reduced-motion) {
          .polegar .rotulo, .polegar .cabeca { transition: none; }
        }
      </style>
      <div class="base">
        <div class="trilha" aria-hidden="true">
          <div class="trilha-inativa inicio"></div>
          <div class="trilha-ativa"></div>
          <div class="trilha-inativa fim"></div>
        </div>
        <div class="marcas" aria-hidden="true"></div>
        ${this.eIntervalo ? `
        <div class="polegar" tabindex="0" role="slider" aria-label="Valor inferior" aria-valuemin="${this.min}" aria-valuemax="${this.max}" aria-valuenow="${valorInferior}" data-polegar="inferior">
          ${this.eRotulado ? `<div class="rotulo" aria-hidden="true">${valorInferior}</div>` : ''}
          <div class="base"><div class="anel-foco"></div><div class="toque" aria-hidden="true"></div><div class="envoltorio"><div class="cabeca"></div></div></div>
        </div>
        <div class="polegar" tabindex="0" role="slider" aria-label="Valor superior" aria-valuemin="${this.min}" aria-valuemax="${this.max}" aria-valuenow="${valorSuperior}" data-polegar="superior">
          ${this.eRotulado ? `<div class="rotulo" aria-hidden="true">${valorSuperior}</div>` : ''}
          <div class="base"><div class="anel-foco"></div><div class="toque" aria-hidden="true"></div><div class="envoltorio"><div class="cabeca"></div></div></div>
        </div>
        ` : `
        <div class="polegar" tabindex="${this.estaDesativado ? -1 : 0}" role="slider" aria-label="Valor" aria-valuemin="${this.min}" aria-valuemax="${this.max}" aria-valuenow="${valor}" ${this.estaDesativado ? 'aria-disabled="true"' : ''}>
          ${this.eRotulado ? `<div class="rotulo" aria-hidden="true">${valor}</div>` : ''}
          <div class="base"><div class="anel-foco"></div><div class="toque" aria-hidden="true"></div><div class="envoltorio"><div class="cabeca"></div></div></div>
        </div>
        `}
      </div>`;
  }

  _setupListeners() {
    const base = this.querySelector('.base');
    if (!base) return;

    base.addEventListener('pointerdown', e => this._handlePointerDown(e));
    base.addEventListener('pointermove', e => this._handlePointerMove(e));
    base.addEventListener('pointerup', e => this._handlePointerUp(e));

    this.querySelectorAll('.polegar').forEach(polegar => {
      polegar.addEventListener('keydown', e => this._handleKeyDown(e, polegar));
      polegar.addEventListener('keyup', e => this._handleKeyUp(e, polegar));
      polegar.addEventListener('pointerdown', () => polegar.classList.add('ativo'));
      polegar.addEventListener('pointerup', () => polegar.classList.remove('ativo'));
    });
  }

  obterValor(polegar) { return parseFloat(polegar.getAttribute('aria-valuenow') ?? this.min); }
  definirValor(polegar, val) {
    polegar.setAttribute('aria-valuenow', val);
    const rotulo = polegar.querySelector('.rotulo');
    if (rotulo) rotulo.textContent = val;
  }

  pontoDoValor(valor) {
    const larguraSlider = this.clientWidth;
    const larguraPolegar = this.querySelector('.polegar')?.clientWidth ?? 0;
    return (larguraSlider - larguraPolegar) * ((valor - this.min) / (this.max - this.min));
  }

  valorDoPonto(clientX) {
    const rect = this.getBoundingClientRect();
    const pos = clientX - rect.left;
    const s = this.passo === 0 ? 1 : this.passo;
    const numPassos = Math.floor((this.max - this.min) / s);
    const porcentagem = pos / this.clientWidth;
    const porcentagemFixa = Math.round(porcentagem * numPassos) / numPassos;
    const valorImpreciso = porcentagemFixa * (this.max - this.min) + this.min;
    return Math.round(valorImpreciso / s) * s;
  }

  atualizarMarcas(fnAtiva) {
    const marcasEl = this.querySelector('.marcas');
    if (!marcasEl) return;
    marcasEl.innerHTML = '';
    if (!this.eDiscreto) return;

    const marcas = [];
    if (this.passo > 1) {
      for (let i = this.min; i <= this.max; i += this.passo) marcas.push({ valor: i, ativa: fnAtiva(i) });
    } else {
      marcas.push({ valor: this.min, ativa: fnAtiva(this.min) });
      if (this.min < 0 && this.max > 0) marcas.push({ valor: 0, ativa: fnAtiva(0) });
      marcas.push({ valor: this.max, ativa: fnAtiva(this.max) });
    }

    marcas.forEach(m => {
      const el = document.createElement('div');
      el.className = `marca ${m.ativa ? 'ativa' : 'inativa'}`;
      el.style.transform = `translate(${this.pontoDoValor(m.valor)}px, 0)`;
      marcasEl.appendChild(el);
    });
  }

  atualizarDimensoes() {
    const base = this.querySelector('.base');
    const polegares = [...this.querySelectorAll('.polegar')];
    if (!base || polegares.length === 0) return;

    const larguraSlider = this.clientWidth;
    const larguraPolegar = polegares[0].clientWidth;
    const polegarInferior = polegares[0];
    const polegarSuperior = polegares[1] ?? null;
    const valorInferior = this.obterValor(polegarInferior);
    const posInferior = this.pontoDoValor(valorInferior);
    polegarInferior.style.transform = `translate(${posInferior}px, 0)`;

    if (!polegarSuperior) {
      base.classList.remove('intervalo');
      base.style.setProperty('--_tamanho-trilha-ativa', `${posInferior}px`);
      base.style.setProperty('--_deslocamento-trilha-inativa-depois', `${posInferior + larguraPolegar}px`);
      base.style.setProperty('--_tamanho-trilha-inativa-depois', `${larguraSlider - posInferior - larguraPolegar}px`);
      base.style.removeProperty('--_forma-trilha-ativa-meio');
      this.atualizarMarcas(i => i < valorInferior);
    } else {
      const valorSuperior = this.obterValor(polegarSuperior);
      const posSuperior = this.pontoDoValor(valorSuperior);
      polegarSuperior.style.transform = `translate(${posSuperior}px, 0)`;
      base.classList.add('intervalo');
      base.style.setProperty('--_forma-trilha-ativa-meio', '0');
      base.style.setProperty('--_tamanho-trilha-inativa-antes', `${posInferior}px`);
      base.style.setProperty('--_deslocamento-trilha-ativa', `${posInferior + larguraPolegar}px`);
      base.style.setProperty('--_tamanho-trilha-ativa', `${posSuperior - posInferior - larguraPolegar}px`);
      base.style.setProperty('--_deslocamento-trilha-inativa-depois', `${posSuperior + larguraPolegar}px`);
      base.style.setProperty('--_tamanho-trilha-inativa-depois', `${larguraSlider - larguraPolegar - posSuperior}px`);
      this.atualizarMarcas(i => i > valorInferior && i < valorSuperior);
    }
  }

  alterarPolegar(polegar, valor, animar = false) {
    const limitado = Math.min(this.max, Math.max(this.min, valor));
    if (this.obterValor(polegar) === limitado) return;

    if (animar) {
      this.classList.add('animando');
      polegar.style.transition = `transform 150ms cubic-bezier(0.31, 0.94, 0.34, 1.00)`;
      polegar.addEventListener('transitionend', () => {
        polegar.style.transition = '';
        this.classList.remove('animando');
      }, { once: true });
    }

    this.polegaresAlterados.add(polegar);
    this.definirValor(polegar, limitado);
    this.atualizarDimensoes();
    this.dispatchEvent(new Event('input', { bubbles: true }));
  }

  confirmarPolegar(polegar) {
    if (this.polegaresAlterados.has(polegar)) {
      this.dispatchEvent(new Event('change', { bubbles: true }));
      this.polegaresAlterados.delete(polegar);
      if (this.eIntervalo) {
        if (polegar.dataset.polegar === 'inferior') this.setAttribute('valor-inferior', this.obterValor(polegar));
        else this.setAttribute('valor-superior', this.obterValor(polegar));
      } else {
        this.setAttribute('valor', this.obterValor(polegar));
      }
    }
  }

  _handlePointerDown(e) {
    if (e.button > 1 || this.estaDesativado) return;
    e.target.setPointerCapture?.(e.pointerId);
    this.polegaresAlterados.clear();

    const polegarClicado = e.composedPath()?.find(x => x.classList?.contains('polegar')) ?? e.target.closest('.polegar');
    const polegares = [...this.querySelectorAll('.polegar')];
    
    if (polegarClicado && polegares.includes(polegarClicado)) {
      this.polegarAtivo = polegarClicado;
      return;
    }

    const valor = this.valorDoPonto(e.clientX);
    if (!this.eIntervalo) {
      this.polegarAtivo = polegares[0];
      this.alterarPolegar(polegares[0], valor, true);
    } else {
      const vi = this.obterValor(polegares[0]);
      const vs = this.obterValor(polegares[1]);
      if (valor < vi) { this.polegarAtivo = polegares[0]; this.alterarPolegar(polegares[0], valor, true); }
      else if (valor > vs) { this.polegarAtivo = polegares[1]; this.alterarPolegar(polegares[1], valor, true); }
      else { this.polegarAtivo = valor < (vi + vs) / 2 ? polegares[0] : polegares[1]; this.alterarPolegar(this.polegarAtivo, valor, true); }
    }
  }

  _handlePointerMove(e) {
    if (!(e.target instanceof HTMLElement) || !e.target.hasPointerCapture?.(e.pointerId) || !this.polegarAtivo || this.polegarAtivo.getAttribute('aria-disabled') === 'true') return;
    const valor = this.valorDoPonto(e.clientX);
    let lo = this.min, hi = this.max;
    const polegares = [...this.querySelectorAll('.polegar')];
    if (this.eIntervalo) {
      if (this.polegarAtivo === polegares[1]) lo = Math.max(lo, this.obterValor(polegares[0]));
      else if (polegares[1]) hi = Math.min(hi, this.obterValor(polegares[1]));
    }
    this.classList.remove('animando');
    this.polegarAtivo.style.transition = '';
    this.alterarPolegar(this.polegarAtivo, Math.min(hi, Math.max(lo, valor)));
  }

  _handlePointerUp(e) {
    if (e.button > 1) return;
    e.target.releasePointerCapture?.(e.pointerId);
    if (this.polegarAtivo && this.polegarAtivo.getAttribute('aria-disabled') !== 'true') {
      this.confirmarPolegar(this.polegarAtivo);
      this.polegarAtivo.classList.remove('ativo');
      this.polegarAtivo.focus();
    }
    this.polegarAtivo = null;
  }

  _handleKeyDown(e, polegar) {
    if (polegar.getAttribute('aria-disabled') === 'true') return;
    const valor = this.obterValor(polegar);
    let lo = this.min, hi = this.max;
    const polegares = [...this.querySelectorAll('.polegar')];
    if (this.eIntervalo) {
      if (polegar === polegares[1]) lo = Math.max(lo, this.obterValor(polegares[0]));
      else if (polegares[1]) hi = Math.min(hi, this.obterValor(polegares[1]));
    }
    const passoGrande = this.passo > 1 ? this.passo : 10;
    switch (e.key) {
      case 'ArrowRight': case 'ArrowUp': case 'Right': case 'Up': this.alterarPolegar(polegar, Math.min(hi, valor + this.passo)); e.preventDefault(); break;
      case 'ArrowLeft': case 'ArrowDown': case 'Left': case 'Down': this.alterarPolegar(polegar, Math.max(lo, valor - this.passo)); e.preventDefault(); break;
      case 'PageUp': this.alterarPolegar(polegar, Math.min(hi, valor + passoGrande)); e.preventDefault(); break;
      case 'PageDown': this.alterarPolegar(polegar, Math.max(lo, valor - passoGrande)); e.preventDefault(); break;
      case 'Home': this.alterarPolegar(polegar, lo); e.preventDefault(); break;
      case 'End': this.alterarPolegar(polegar, hi); e.preventDefault(); break;
      case ' ': e.preventDefault(); break;
    }
  }

  _handleKeyUp(e, polegar) {
    this.confirmarPolegar(polegar);
  }
}

customElements.define('controle-deslizante', ControleDeslizante);
