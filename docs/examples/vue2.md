# Exemplo Vue 2 — Formulário de Cadastro

## Sem TypeScript, sem Composition API

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

    <div>
      <label>Idade</label>
      <input v-model.number="form.age" @blur="validateField('age')" type="number" />
      <span v-if="errors.age" class="error">{{ errors.age }}</span>
    </div>

    <button type="submit" :disabled="!isFormValid">Cadastrar</button>
  </form>
</template>

<script>
var validators = require('validators')

var schemas = {
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
  age: {
    type: 'number',
    rules: [
      { type: 'min', value: 18 },
      { type: 'max', value: 120 },
      { type: 'integer' },
    ],
  },
}

module.exports = {
  data: function () {
    return {
      form: { name: '', email: '', age: null },
      errors: { name: null, email: null, age: null },
    }
  },
  computed: {
    isFormValid: function () {
      return !Object.values(this.errors).some(Boolean)
    },
  },
  methods: {
    validateField: function (field) {
      var result = validators.validate(schemas[field], this.form[field])
      this.errors[field] = result.valid ? null : result.errors[0].message
    },
    validateAll: function () {
      var self = this
      var valid = true
      Object.keys(schemas).forEach(function (field) {
        self.validateField(field)
        if (self.errors[field]) valid = false
      })
      return valid
    },
    onSubmit: function () {
      if (!this.validateAll()) return
      // Enviar dados...
      console.log('Formulário válido!', this.form)
    },
  },
}
</script>
```

## Validação do objeto inteiro em Vue 2

```js
var validators = require('validators')

var formSchema = {
  type: 'object',
  shape: {
    name:  { type: 'string', rules: [{ type: 'minLength', value: 2 }] },
    email: { type: 'string', rules: [{ type: 'email' }] },
    age:   { type: 'number', rules: [{ type: 'min', value: 18 }, { type: 'integer' }] },
  },
}

var result = validators.validate(formSchema, {
  name: 'Alice',
  email: 'alice@example.com',
  age: 25,
})

console.log(result)
// { valid: true, errors: [] }
```

## Com i18n em pt-BR

```js
var validators = require('validators')
validators.setLocale('pt-BR')

var result = validators.validate(
  { type: 'string', rules: [{ type: 'email' }] },
  'email-invalido'
)

console.log(result.errors[0].message)
// "Deve ser um endereço de e-mail válido"
```
