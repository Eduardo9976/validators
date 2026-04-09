# Exemplos JavaScript Puros

## String simples

```js
const { validate } = require('validators')

// ✅ válido
validate({ type: 'string', rules: [{ type: 'minLength', value: 5 }] }, 'hello')
// → { valid: true, errors: [] }

// ❌ inválido
validate({ type: 'string', rules: [{ type: 'minLength', value: 5 }] }, 'hi')
// → { valid: false, errors: [{ field: '', code: 'minLength', params: { min: 5, actual: 2 }, message: '...' }] }
```

## E-mail

```js
validate({ type: 'string', rules: [{ type: 'email' }] }, 'user@example.com')
// → { valid: true, errors: [] }

validate({ type: 'string', rules: [{ type: 'email' }] }, 'not-an-email')
// → { valid: false, errors: [{ code: 'email', message: 'Must be a valid email address' }] }
```

## Número

```js
validate(
  { type: 'number', rules: [{ type: 'min', value: 0 }, { type: 'max', value: 100 }, { type: 'integer' }] },
  42
)
// → { valid: true, errors: [] }

validate({ type: 'number', rules: [{ type: 'positive' }] }, -5)
// → { valid: false, errors: [{ code: 'positive', message: 'Value must be a positive number' }] }
```

## Array

```js
validate(
  {
    type: 'array',
    rules: [{ type: 'minItems', value: 2 }, { type: 'unique' }],
    items: { type: 'string' },
  },
  ['apple', 'banana']
)
// → { valid: true, errors: [] }

validate(
  { type: 'array', rules: [{ type: 'unique' }] },
  [1, 2, 1]
)
// → { valid: false, errors: [{ code: 'unique', message: 'Array items must be unique' }] }
```

## Objeto com shape

```js
const schema = {
  type: 'object',
  shape: {
    name:  { type: 'string', rules: [{ type: 'minLength', value: 2 }] },
    email: { type: 'string', rules: [{ type: 'email' }] },
    age:   { type: 'number', rules: [{ type: 'min', value: 0 }], optional: true },
  },
}

validate(schema, { name: 'Alice', email: 'alice@acme.com', age: 30 })
// → { valid: true, errors: [] }

validate(schema, { name: 'A', email: 'bad', age: -1 })
// → { valid: false, errors: [
//     { field: 'name',  code: 'minLength', ... },
//     { field: 'email', code: 'email',     ... },
//     { field: 'age',   code: 'min',       ... },
//   ] }
```

## Objeto aninhado

```js
const schema = {
  type: 'object',
  shape: {
    address: {
      type: 'object',
      shape: {
        street: { type: 'string', rules: [{ type: 'minLength', value: 5 }] },
        zip:    { type: 'string', rules: [{ type: 'pattern', value: /^\d{5}$/ }] },
      },
    },
  },
}

validate(schema, { address: { street: 'Elm Street', zip: '12345' } })
// → { valid: true, errors: [] }

validate(schema, { address: { street: 'Elm', zip: 'ABCDE' } })
// → { valid: false, errors: [
//     { field: 'address.street', code: 'minLength', ... },
//     { field: 'address.zip',    code: 'pattern',   ... },
//   ] }
```

## Validação nullable / optional

```js
// Campo opcional — undefined é aceito
validate({ type: 'string', optional: true, rules: [{ type: 'email' }] }, undefined)
// → { valid: true, errors: [] }

// Campo anulável — null é aceito e regras não são executadas
validate({ type: 'string', nullable: true, rules: [{ type: 'email' }] }, null)
// → { valid: true, errors: [] }

// Quando tem valor, as regras são executadas normalmente
validate({ type: 'string', nullable: true, rules: [{ type: 'email' }] }, 'bad')
// → { valid: false, errors: [{ code: 'email', ... }] }
```

## Validação customizada inline

```js
validate(
  {
    type: 'string',
    rules: [
      {
        type: 'custom',
        fn: (value) => {
          if (!value.startsWith('BR')) return 'Must start with BR'
          return true
        },
      },
    ],
  },
  'US-123'
)
// → { valid: false, errors: [{ code: 'custom', message: 'Must start with BR' }] }
```

## oneOf — valor enumerado

```js
validate(
  { type: 'string', rules: [{ type: 'oneOf', value: ['active', 'inactive', 'pending'] }] },
  'active'
)
// → { valid: true, errors: [] }

validate(
  { type: 'string', rules: [{ type: 'oneOf', value: ['active', 'inactive', 'pending'] }] },
  'deleted'
)
// → { valid: false, errors: [{ code: 'oneOf', params: { values: 'active, inactive, pending' }, ... }] }
```

## Schema da API (dinâmico)

```js
// Simula recebimento via fetch
const schema = await fetch('/api/form/schema').then((r) => r.json())

const result = validate(schema, userInput)
if (!result.valid) {
  console.error(result.errors)
}
```

## Edge cases — nunca vai quebrar

```js
validate(null, 'x')       // { valid: false, errors: [{ message: '...' }] }
validate({ type: 'string' }, null)      // → required error
validate({ type: 'string' }, undefined) // → required error
validate({ type: 'number' }, NaN)       // → type error
```
