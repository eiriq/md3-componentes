# Olá Vocês! :)

> Bem-vindos ao meu cantinho dos componentes MD3 Expressive!

**md3-componentes** · :)

Aqui eu guardo os Web Components que eu vou criando, tudo bem simples e pronto pra usar em qualquer projeto.
Sem trocentas linhas de código, sem instalar um monte de coisa. É só copiar o link e ser feliz!

---

## 🌊 Progress Indicator Wave Circular

Um indicador de progresso giratório com um efeito ondulado muito lindo!

```html
<script src="https://cdn.jsdelivr.net/gh/eiriq/md3-componentes@bd9b058b492c3d4d400b72195f0d03fffad27e0c/md3-expressive-progress-indicator-wave-circular.js"></script>
<md3-expressive-progress-indicator-wave-circular></md3-expressive-progress-indicator-wave-circular>
```

**Customizando do meu jeito:**

```html
<style>
  .minha-cor {
    --cor-primaria: #FF4081;
    --cor-container-secundario: #880E4F;
  }
  .tamanho-gg {
    width: 6rem;
    height: 6rem;
  }
</style>
<md3-expressive-progress-indicator-wave-circular class="minha-cor tamanho-gg"></md3-expressive-progress-indicator-wave-circular>
```

---

## 💫 Loading Indicator

Aquele loading clássico do Material 3 Expressive Morph, com animação de morphing (inclusive, é meu favorito)

```html
<script src="https://cdn.jsdelivr.net/gh/eiriq/md3-componentes@d967f5fd236c7924e263a2fd1620083ea22e5169/md3-expressive-loading-indicator.js"></script>
<md3-expressive-loading-indicator></md3-expressive-loading-indicator>
```

**Variantes e cores:**

```html
<style>
  .teal {
    --m3e-loading-indicator-active-indicator-color: #00897B;
    --m3e-loading-indicator-contained-active-indicator-color: #004D40;
    --m3e-loading-indicator-contained-container-color: #B2DFDB;
  }
  .grande {
    --m3e-loading-indicator-size: 5rem;
    --m3e-loading-indicator-container-size: 6rem;
  }
</style>

<!-- Contido (tem o fundinho atrás) -->
<md3-expressive-loading-indicator class="teal grande" variant="contained"></md3-expressive-loading-indicator>

<!-- Solto (só a animação) -->
<md3-expressive-loading-indicator class="teal"></md3-expressive-loading-indicator>
```

---

## 📝 Tabela de Variáveis CSS

Pra estilizar, é só sobrescrever essas variáveis na classe que você criar!

**Loading Indicator**

| Variável | O que faz | Padrão |
|---|---|---|
| `--m3e-loading-indicator-size` | Tamanho do indicador solto | `2.375rem` |
| `--m3e-loading-indicator-container-size` | Tamanho do indicador contido | `3rem` |
| `--m3e-loading-indicator-active-indicator-color` | Cor da animação (solto) | `#6750A4` |
| `--m3e-loading-indicator-contained-active-indicator-color` | Cor da animação (contido) | `#4F378B` |
| `--m3e-loading-indicator-contained-container-color` | Cor do fundinho (contido) | `#E8DEF8` |

**Progress Indicator Wave**

| Variável | O que faz | Padrão |
|---|---|---|
| `--cor-primaria` | Cor da ondinha principal | `#6750A4` |
| `--cor-container-secundario` | Cor da trilha de fundo | `#E8DEF8` |

---

Feito com carinho por **Kimberly Victória** 💜
