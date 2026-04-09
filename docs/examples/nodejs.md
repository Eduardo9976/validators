# Exemplo Node.js — Validação Backend

## Middleware Express simples

```js
const express = require('express')
const { validate, setLocale } = require('validators')

setLocale('pt-BR')

const app = express()
app.use(express.json())

// Schema para criação de usuário
const createUserSchema = {
  type: 'object',
  shape: {
    name: {
      type: 'string',
      rules: [
        { type: 'minLength', value: 2 },
        { type: 'maxLength', value: 100 },
      ],
    },
    email: {
      type: 'string',
      rules: [{ type: 'email' }],
    },
    password: {
      type: 'string',
      rules: [
        { type: 'minLength', value: 8 },
        { type: 'pattern', value: /[A-Z]/ }, // ao menos uma maiúscula
      ],
    },
    age: {
      type: 'number',
      optional: true,
      rules: [{ type: 'min', value: 18 }, { type: 'integer' }],
    },
  },
}

app.post('/users', (req, res) => {
  const result = validate(createUserSchema, req.body)

  if (!result.valid) {
    return res.status(422).json({
      error: 'Validation failed',
      details: result.errors.map((e) => ({
        field: e.field,
        message: e.message,
      })),
    })
  }

  // Prosseguir com a criação do usuário...
  res.status(201).json({ success: true })
})
```

---

## Middleware de validação genérico

```js
// middleware/validate.js
const { validate } = require('validators')

function validateBody(schema) {
  return (req, res, next) => {
    const result = validate(schema, req.body)
    if (!result.valid) {
      return res.status(422).json({ errors: result.errors })
    }
    next()
  }
}

module.exports = { validateBody }
```

```js
// routes/users.js
const { validateBody } = require('../middleware/validate')

const schema = {
  type: 'object',
  shape: {
    email: { type: 'string', rules: [{ type: 'email' }] },
    name:  { type: 'string', rules: [{ type: 'minLength', value: 2 }] },
  },
}

router.post('/users', validateBody(schema), createUserHandler)
```

---

## Schema dinâmico da API/banco de dados

```js
const { validate } = require('validators')

// Schema pode vir do banco, de uma API ou arquivo
async function getSchema(entityType) {
  const row = await db.query('SELECT schema_json FROM schemas WHERE type = ?', [entityType])
  return JSON.parse(row.schema_json)
}

app.post('/entity/:type', async (req, res) => {
  const schema = await getSchema(req.params.type)
  const result = validate(schema, req.body)

  if (!result.valid) {
    return res.status(422).json({ errors: result.errors })
  }

  res.json({ ok: true })
})
```

---

## Validação de variáveis de ambiente

```js
const { validate } = require('validators')

const envSchema = {
  type: 'object',
  shape: {
    DATABASE_URL: { type: 'string', rules: [{ type: 'url' }] },
    PORT:         { type: 'string', rules: [{ type: 'pattern', value: /^\d+$/ }] },
    JWT_SECRET:   { type: 'string', rules: [{ type: 'minLength', value: 32 }] },
  },
}

const result = validate(envSchema, process.env)
if (!result.valid) {
  console.error('Invalid environment variables:')
  result.errors.forEach((e) => console.error(`  ${e.field}: ${e.message}`))
  process.exit(1)
}
```
