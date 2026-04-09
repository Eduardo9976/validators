# validators

> Biblioteca de validação enterprise-ready, agnóstica de framework e engine.  
> Funciona em Vue 2, Vue 3, Node.js e qualquer JavaScript.

---

## O que é

`validators` é uma biblioteca de validação que define regras como **dados JSON puros** — sem acoplamento a frameworks, sem mensagens hardcoded, sem TypeScript obrigatório.

### Problema que resolve

Em projetos que escalam para múltiplos produtos, a validação costuma:
- Estar presa a uma engine específica (Yup, Zod, Vuelidate)
- Repetir lógica entre frontend e backend
- Ter mensagens hardcoded impossíveis de traduzir
- Receber schemas apenas em código, não em dados da API

Esta biblioteca resolve todos esses problemas.

### Quando usar

✅ Validar formulários em Vue 2 ou Vue 3  
✅ Validar requests em Node.js/Express  
✅ Receber schemas dinâmicos da API  
✅ Projetos multi-idioma  
✅ Times que precisam trocar de engine de validação sem refatorar tudo  

### Quando NÃO usar

❌ Se você precisa de validação de tipos em TypeScript (use Zod diretamente)  
❌ Se já está 100% comprometido com uma engine e não planeja mudar  

---

## Instalação

```bash
npm install validators

# Opcional: se quiser usar o adapter Zod v4
npm install zod
```

## Importação

```js
// CommonJS (Vue 2, Node.js)
const { validate, setLocale } = require('validators')

// ESM (Vue 3 com bundler)
import { validate, setLocale } from 'validators'
```

---

## Conceitos fundamentais

### Schema definition

Uma **definição de schema** é um objeto JavaScript simples (JSON-serializável) que descreve como um valor deve ser:

```js
{
  type: 'string',          // tipo esperado
  rules: [                 // lista de regras
    { type: 'minLength', value: 5 },
    { type: 'email' }
  ],
  nullable: false,         // aceita null?
  optional: false,         // aceita undefined?
  label: 'E-mail',         // rótulo (para uso futuro)
}
```

**Tipos disponíveis:** `string`, `number`, `boolean`, `array`, `object`, `any`

### Rule

Uma **rule** é um par `{ type, value? }` que especifica uma constraint:

```js
{ type: 'minLength', value: 5 }   // length >= 5
{ type: 'email' }                 // formato de e-mail
{ type: 'min', value: 0 }         // número >= 0
{ type: 'custom', fn: (v) => v !== 'admin' || 'Nome reservado' }
```

### Adapter

Um **adapter** é quem executa a validação. A biblioteca vem com:
- `default` — engine própria, zero dependências
- `zod` — usa Zod v4 internamente (requer `npm install zod`)

### Resultado de validação

```js
// Sucesso
{ valid: true, errors: [] }

// Falha
{
  valid: false,
  errors: [
    {
      field: 'email',     // caminho do campo (dot notation para objetos)
      code: 'email',      // código do erro (para i18n)
      params: {},         // parâmetros do erro (para interpolação)
      message: 'Must be a valid email address',  // mensagem traduzida
    }
  ]
}
```

---

## Uso básico

```js
const { validate } = require('validators')

// String com múltiplas regras
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

---

## API completa

### `validate(definition, value, options?)`

Valida um `value` contra uma definição de schema. **Nunca lança exceções.**

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `definition` | `object` | Definição do schema |
| `value` | `*` | Valor a validar |
| `options.locale` | `string` | Override de locale para esta chamada |
| `options.adapter` | `string` | Override de adapter para esta chamada |
| `options.field` | `string` | Nome do campo raiz para caminhos de erro |

**Retorno:** `{ valid: boolean, errors: Array<{ field, code, params, message }> }`

### `registerRule(name, fn)`

Registra uma regra customizada.

```js
registerRule('noBadWord', (value, params) => {
  if (typeof value === 'string' && value.includes('spam')) {
    return { code: 'noBadWord', params: {} }
  }
  return true
})
```

### `registerAdapter(name, adapter)`

Registra um adapter customizado.

```js
registerAdapter('myEngine', {
  validate(schema, value, options) {
    // ... retornar array de { field, code, params }
    return []
  }
})
```

### `setAdapter(name)`

Define o adapter ativo globalmente.

```js
const zodAdapter = require('validators/src/adapters/zod')
registerAdapter('zod', zodAdapter)
setAdapter('zod')
```

### `buildSchema(definition)`

Valida e normaliza uma definição. Útil para pré-validar schemas:

```js
const schema = buildSchema({ type: 'string', rules: [{ type: 'email' }] })
// Retorna schema normalizado com defaults
```

### `setLocale(locale)` / `getLocale()`

```js
setLocale('pt-BR')
getLocale() // → 'pt-BR'
```

### `registerLocale(locale, messages)`

```js
registerLocale('fr', { required: 'Ce champ est requis' })
```

### `translate(code, params, locale?)`

```js
translate('minLength', { min: 5, actual: 2 })
// → "Minimum length is 5 characters, got 2"
```

---

## Regras disponíveis

### String
| Regra | Parâmetros | Descrição |
|---|---|---|
| `minLength` | `value` | Comprimento mínimo |
| `maxLength` | `value` | Comprimento máximo |
| `email` | — | Formato de e-mail |
| `url` | — | URL HTTP/HTTPS válida |
| `pattern` | `value` (RegExp ou string) | Expressão regular |
| `notEmpty` | — | Não pode ser só espaços |

### Number
| Regra | Parâmetros | Descrição |
|---|---|---|
| `min` | `value` | Valor mínimo (>=) |
| `max` | `value` | Valor máximo (<=) |
| `integer` | — | Deve ser inteiro |
| `positive` | — | Deve ser > 0 |
| `negative` | — | Deve ser < 0 |

### Array
| Regra | Parâmetros | Descrição |
|---|---|---|
| `minItems` | `value` | Mínimo de itens |
| `maxItems` | `value` | Máximo de itens |
| `noEmpty` | — | Array não pode estar vazio |
| `unique` | — | Itens devem ser únicos (deep) |

### Object
| Regra | Parâmetros | Descrição |
|---|---|---|
| `requiredKeys` | `value` (string[]) | Chaves obrigatórias |

### Comuns
| Regra | Parâmetros | Descrição |
|---|---|---|
| `required` | — | Não pode ser null/undefined/"" |
| `type` | `value` | Checagem explícita de tipo |
| `oneOf` | `value` (array) | Valor deve ser um dos listados |
| `custom` | `fn` | Função de validação inline |

---

## i18n

```js
const { setLocale, registerLocale } = require('validators')

// Mudar idioma globalmente
setLocale('pt-BR')

// Adicionar novo idioma
registerLocale('fr', {
  required: 'Ce champ est requis',
  email: 'Doit être un e-mail valide',
})

// Override por chamada
validate(schema, value, { locale: 'es' })
```

Veja [docs/i18n.md](./i18n.md) para documentação completa.

---

## Objeto e array aninhados

```js
// Objeto com shape recursivo
validate(
  {
    type: 'object',
    shape: {
      address: {
        type: 'object',
        shape: {
          zip: { type: 'string', rules: [{ type: 'pattern', value: /^\d{5}$/ }] },
        },
      },
    },
  },
  { address: { zip: 'ABCDE' } }
)
// errors[0].field === 'address.zip'

// Array com validação de itens
validate(
  {
    type: 'array',
    rules: [{ type: 'minItems', value: 1 }],
    items: { type: 'string', rules: [{ type: 'email' }] },
  },
  ['bad-email']
)
// errors[0].field === '[0]'
```

---

## Performance

- Schemas são **cacheados por fingerprint JSON** — múltiplas chamadas com o mesmo objeto são gratuitas após a primeira
- 1.000 validações de string: < 200ms
- 1.000 validações de objeto com 3 campos: < 500ms

```js
const { clearCache } = require('validators')
clearCache() // limpar cache manualmente se necessário
```

---

## Versionamento

Este projeto segue **SemVer**:

- **PATCH** `1.0.x` — correções de bugs (sem breaking changes)
- **MINOR** `1.x.0` — novas regras, novas funcionalidades (retrocompatível)
- **MAJOR** `x.0.0` — breaking changes (mudança de API pública)

---

## Boas práticas

✅ Defina schemas fora das funções (evita rebuild a cada chamada)  
✅ Use `_reset()` em testes para limpar estado global  
✅ Use `clearCache()` em hot-reload/desenvolvimento  
✅ Forneça `field` no options para melhorar os caminhos de erro  
✅ Registre locales e regras na inicialização da aplicação  

❌ Não construa schemas dentro de loops  
❌ Não hardcode mensagens de erro — use `registerLocale`  
❌ Não misture lógica de negócio dentro de regras `custom` (mantenha-as simples)  

---

## Documentação completa

| Documento | Conteúdo |
|---|---|
| [architecture.md](./architecture.md) | Diagrama de camadas e fluxo completo |
| [i18n.md](./i18n.md) | Sistema de internacionalização |
| [extending.md](./extending.md) | Regras, adapters e locales customizados |
| [examples/vue2.md](./examples/vue2.md) | Vue 2 — formulário real |
| [examples/vue3.md](./examples/vue3.md) | Vue 3 — Composition API |
| [examples/nodejs.md](./examples/nodejs.md) | Node.js — backend e middleware |
| [examples/javascript.md](./examples/javascript.md) | JavaScript puro — todos os casos |
| [../llm-docs.json](../llm-docs.json) | Documentação estruturada para IA/MCP |
