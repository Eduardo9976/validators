# Exemplo Vue 3 — Composition API

## Setup com `<script setup>`

```html
<!-- RegisterForm.vue -->
<template>
  <form @submit.prevent="onSubmit">
    <div>
      <label>Nome</label>
      <input v-model="form.name" @blur="validateField('name')" />
      <span v-if="errors.name" class="error">{{ errors.name }}</span>
    </div>

    <div>
      <label>E-mail</label>
      <input v-model="form.email" @blur="validateField('email')" />
      <span v-if="errors.email" class="error">{{ errors.email }}</span>
    </div>

    <button type="submit">Cadastrar</button>
  </form>
</template>

<script setup>
import { reactive } from 'vue'
import { validate, setLocale } from 'validators'

setLocale('pt-BR')

const schemas = {
  name:  { type: 'string', rules: [{ type: 'minLength', value: 2 }] },
  email: { type: 'string', rules: [{ type: 'email' }] },
}

const form = reactive({ name: '', email: '' })
const errors = reactive({ name: null, email: null })

function validateField(field) {
  const result = validate(schemas[field], form[field])
  errors[field] = result.valid ? null : result.errors[0].message
}

function onSubmit() {
  let valid = true
  for (const field of Object.keys(schemas)) {
    validateField(field)
    if (errors[field]) valid = false
  }
  if (!valid) return
  console.log('Enviando:', form)
}
</script>
```

---

## Composable reutilizável `useValidator`

```js
// composables/useValidator.js
import { reactive } from 'vue'
import { validate } from 'validators'

export function useValidator(schemas) {
  const errors = reactive(
    Object.fromEntries(Object.keys(schemas).map((k) => [k, null]))
  )

  function validateField(field, value) {
    const result = validate(schemas[field], value)
    errors[field] = result.valid ? null : result.errors[0].message
    return result.valid
  }

  function validateAll(data) {
    return Object.keys(schemas).every((field) => validateField(field, data[field]))
  }

  const isValid = Object.values(errors).every((e) => e === null)

  return { errors, validateField, validateAll, isValid }
}
```

```html
<!-- Usando o composable -->
<script setup>
import { reactive } from 'vue'
import { useValidator } from '@/composables/useValidator'

const form = reactive({ name: '', email: '' })

const { errors, validateField, validateAll } = useValidator({
  name:  { type: 'string', rules: [{ type: 'minLength', value: 2 }] },
  email: { type: 'string', rules: [{ type: 'email' }] },
})

function onSubmit() {
  if (!validateAll(form)) return
  console.log('Enviando:', form)
}
</script>
```

---

## Validação com schema dinâmico (da API)

```js
// Simula fetch de schema da API
const apiSchema = await fetch('/api/form-schema').then((r) => r.json())

// Usa diretamente — é só um objeto JS
const result = validate(apiSchema, formData)
```
