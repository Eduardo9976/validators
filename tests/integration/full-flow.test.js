'use strict'

const { validate, setLocale, registerRule, _reset } = require('../../src/index')

beforeEach(() => _reset())

describe('Full flow — string schema', () => {
  test('valid string passes all rules', () => {
    const result = validate(
      { type: 'string', rules: [{ type: 'minLength', value: 3 }, { type: 'email' }] },
      'user@example.com'
    )
    expect(result.valid).toBe(true)
  })

  test('collects multiple failures in one pass', () => {
    const result = validate(
      { type: 'string', rules: [{ type: 'minLength', value: 20 }, { type: 'email' }] },
      'bad'
    )
    expect(result.valid).toBe(false)
    expect(result.errors).toHaveLength(2)
  })
})

describe('Full flow — number schema', () => {
  test('valid number passes', () => {
    const result = validate(
      { type: 'number', rules: [{ type: 'min', value: 0 }, { type: 'integer' }] },
      42
    )
    expect(result.valid).toBe(true)
  })

  test('float fails integer rule', () => {
    const result = validate({ type: 'number', rules: [{ type: 'integer' }] }, 3.14)
    expect(result.valid).toBe(false)
    expect(result.errors[0].code).toBe('integer')
  })
})

describe('Full flow — object schema with shape', () => {
  const schema = {
    type: 'object',
    shape: {
      name: { type: 'string', rules: [{ type: 'minLength', value: 2 }] },
      age:  { type: 'number', rules: [{ type: 'min', value: 0 }] },
      email: { type: 'string', rules: [{ type: 'email' }] },
    },
  }

  test('valid object passes', () => {
    const result = validate(schema, { name: 'Alice', age: 30, email: 'alice@example.com' })
    expect(result.valid).toBe(true)
  })

  test('reports errors on multiple fields', () => {
    const result = validate(schema, { name: 'A', age: -1, email: 'bad' })
    expect(result.valid).toBe(false)
    const codes = result.errors.map((e) => e.code)
    expect(codes).toContain('minLength')
    expect(codes).toContain('min')
    expect(codes).toContain('email')
  })

  test('nested field paths are dot-separated', () => {
    const result = validate(schema, { name: 'A', age: 0, email: 'ok@x.com' })
    expect(result.errors[0].field).toBe('name')
  })
})

describe('Full flow — array schema with items', () => {
  const schema = {
    type: 'array',
    rules: [{ type: 'minItems', value: 1 }],
    items: { type: 'string', rules: [{ type: 'email' }] },
  }

  test('valid array of emails passes', () => {
    const result = validate(schema, ['a@b.com', 'c@d.com'])
    expect(result.valid).toBe(true)
  })

  test('fails when array is empty (minItems)', () => {
    const result = validate(schema, [])
    expect(result.valid).toBe(false)
    expect(result.errors[0].code).toBe('minItems')
  })

  test('fails and reports index path for invalid items', () => {
    const result = validate(schema, ['ok@x.com', 'bad-email'])
    expect(result.valid).toBe(false)
    expect(result.errors[0].field).toContain('[1]')
  })
})

describe('Full flow — i18n integration', () => {
  test('error messages change with setLocale', () => {
    setLocale('pt-BR')
    const result = validate({ type: 'string', rules: [{ type: 'email' }] }, 'bad')
    expect(result.errors[0].message).toContain('e-mail')
  })

  test('per-call locale override works independently', () => {
    setLocale('en')
    const r1 = validate({ type: 'string' }, null, { locale: 'pt-BR' })
    const r2 = validate({ type: 'string' }, null)
    expect(r1.errors[0].message).toContain('obrigatório')
    expect(r2.errors[0].message).toMatch(/required/i)
  })
})

describe('Full flow — custom rule', () => {
  test('custom rule is applied and fails correctly', () => {
    registerRule('noBadWord', (value) => {
      if (typeof value === 'string' && value.includes('bad')) {
        return { code: 'noBadWord', params: {} }
      }
      return true
    })
    const result = validate(
      { type: 'string', rules: [{ type: 'noBadWord' }] },
      'this is bad'
    )
    expect(result.valid).toBe(false)
    expect(result.errors[0].code).toBe('noBadWord')
  })
})
