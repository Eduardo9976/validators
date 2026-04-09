# 🔧 Extensão da biblioteca

## 1. Criar uma regra customizada

Regras são funções puras: recebem `(value, params)` e retornam `true` (passou) ou `{ code, params }` (falhou).

```js
const { registerRule } = require('validators')

// Regra simples: CPF não pode começar com zeros
registerRule('noCpfPrefix', (value, params) => {
  if (typeof value !== 'string') return true
  const prefix = params.value || '000'
  if (value.startsWith(prefix)) {
    return { code: 'noCpfPrefix', params: { prefix } }
  }
  return true
})

// Registrar a mensagem
const { registerLocale } = require('validators')
registerLocale('pt-BR', {
  noCpfPrefix: 'CPF não pode começar com "{prefix}"',
})

// Usar na schema
validate(
  { type: 'string', rules: [{ type: 'noCpfPrefix', value: '000' }] },
  '000.123.456-07'
)
// → { valid: false, errors: [{ code: 'noCpfPrefix', message: 'CPF não pode começar com "000"' }] }
```

---

## 2. Regra inline (custom)

Para validações únicas sem precisar registrar:

```js
validate(
  {
    type: 'string',
    rules: [
      {
        type: 'custom',
        fn: (value) => {
          if (value.includes('badword')) return 'Palavra proibida detectada'
          return true
        },
      },
    ],
  },
  'this is a badword'
)
```

A função `fn` pode retornar:
- `true` ou `undefined` → passa
- `false` → falha com código `custom`
- `string` → falha com essa string como mensagem
- `{ code, params }` → falha com código e params customizados

---

## 3. Criar um adapter customizado

Um adapter deve expor um método `validate(schema, value, options)` que retorna um array de erros brutos.

```js
const { registerAdapter, setAdapter } = require('validators')

const myAdapter = {
  validate(schema, value, options) {
    const errors = []

    // Sua lógica de validação aqui
    if (schema.type === 'string' && typeof value !== 'string') {
      errors.push({
        field: options.field || '',
        code: 'type',
        params: { expected: 'string', actual: typeof value },
      })
    }

    // Retornar array de { field, code, params }
    // A biblioteca cuida da tradução e formatação
    return errors
  },
}

registerAdapter('myAdapter', myAdapter)
setAdapter('myAdapter') // ativa globalmente

// Ou por chamada:
validate(schema, value, { adapter: 'myAdapter' })
```

---

## 4. Integrar o Zod adapter

```js
const { registerAdapter, setAdapter } = require('validators')
const zodAdapter = require('validators/src/adapters/zod')

registerAdapter('zod', zodAdapter)

// Ativar globalmente:
setAdapter('zod')

// Ou por chamada específica:
validate(schema, value, { adapter: 'zod' })
```

**Requisito:** `zod` instalado como dependência (`npm i zod`).

---

## 5. Adicionar um novo idioma

```js
const { registerLocale, setLocale } = require('validators')

registerLocale('fr', {
  required: 'Ce champ est requis',
  email: 'Doit être un e-mail valide',
  minLength: 'Longueur minimale : {min} caractères',
  // ... outros códigos
})

setLocale('fr')
```

---

## 6. Sobrescrever mensagens de erros existentes

```js
registerLocale('en', {
  email: 'We need a real email address, please',
  required: 'This field cannot be left blank',
})
```

---

## 7. Adicionar um tipo de schema customizado

O `buildSchema` aceita apenas os tipos: `string`, `number`, `boolean`, `array`, `object`, `any`.  
Para tipos customizados, use `type: 'any'` e valide com uma regra `custom` ou crie seu próprio adapter que trate o tipo.

```js
// Schema "cpf" usando type: 'any' + regra custom
const cpfSchema = {
  type: 'any',
  rules: [
    {
      type: 'custom',
      fn: (value) => {
        if (typeof value !== 'string' || !/^\d{11}$/.test(value.replace(/\D/g, ''))) {
          return { code: 'invalidCpf', params: {} }
        }
        return true
      },
    },
  ],
}
```
