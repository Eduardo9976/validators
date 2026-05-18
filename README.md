# validators

> Biblioteca de validação **enterprise-ready**, agnóstica de framework e engine.
> Funciona em Vue 2, Vue 3, Node.js e qualquer JavaScript.

## Por que usar

- **Schemas como JSON puros** — defina regras como dados, não código
- **Zero acoplamento a framework** — Vue, React, Express, qualquer um
- **i18n nativo** — `en` e `pt-BR` embutidos, qualquer locale registrável
- **Adapters trocáveis** — engine própria (zero deps) ou Zod v4
- **Nunca lança exceções** — sempre retorna `{ valid, errors }`
- **Cache interno** — schemas reutilizados são gratuitos

## Instalação

```bash
npm install validators

# Opcional: Zod adapter
npm install zod
```

## Quickstart

```js
const { validate, setLocale } = require('validators')

setLocale('pt-BR')

const result = validate(
  {
    type: 'string',
    rules: [
      { type: 'minLength', value: 5 },
      { type: 'email' },
    ],
  },
  'user@example.com'
)

console.log(result.valid)   // true
console.log(result.errors)  // []
```

## Documentação completa

| Documento | Conteúdo |
|---|---|
| [docs/README.md](./docs/README.md) | Guia completo, API, regras, exemplos |
| [docs/architecture.md](./docs/architecture.md) | Diagrama de camadas e fluxo |
| [docs/i18n.md](./docs/i18n.md) | Sistema de internacionalização |
| [docs/extending.md](./docs/extending.md) | Regras, adapters e locales customizados |
| [docs/examples/vue2.md](./docs/examples/vue2.md) | Vue 2 — formulário real |
| [docs/examples/vue3.md](./docs/examples/vue3.md) | Vue 3 — Composition API |
| [docs/examples/nodejs.md](./docs/examples/nodejs.md) | Node.js — backend e middleware |
| [docs/examples/javascript.md](./docs/examples/javascript.md) | JavaScript puro |
| [llm-docs.json](./llm-docs.json) | Documentação estruturada para IA/MCP |

## Licença

MIT — veja [LICENSE](./LICENSE).
