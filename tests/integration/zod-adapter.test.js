'use strict'

const { validate, registerAdapter, setAdapter, _reset } = require('../../src/index')
const zodAdapter = require('../../src/adapters/zod')

beforeEach(() => {
  _reset()
  registerAdapter('zod', zodAdapter)
})

const call = (schema, value) => validate(schema, value, { adapter: 'zod' })

// ─── String ───────────────────────────────────────────────────────────────────

describe('Zod v4 adapter — string', () => {
  test('passes valid string', () => {
    expect(call({ type: 'string', rules: [{ type: 'minLength', value: 3 }] }, 'hello').valid).toBe(true)
  })

  test('fails minLength', () => {
    const r = call({ type: 'string', rules: [{ type: 'minLength', value: 10 }] }, 'short')
    expect(r.valid).toBe(false)
    expect(r.errors[0].code).toBe('minLength')
    expect(r.errors[0]).toHaveProperty('message')
  })

  test('fails maxLength', () => {
    const r = call({ type: 'string', rules: [{ type: 'maxLength', value: 3 }] }, 'toolong')
    expect(r.valid).toBe(false)
    expect(r.errors[0].code).toBe('maxLength')
  })

  test('fails email validation', () => {
    const r = call({ type: 'string', rules: [{ type: 'email' }] }, 'not-an-email')
    expect(r.valid).toBe(false)
    expect(r.errors[0].code).toBe('email')
  })

  test('passes valid email', () => {
    expect(call({ type: 'string', rules: [{ type: 'email' }] }, 'a@b.com').valid).toBe(true)
  })

  test('fails url validation', () => {
    const r = call({ type: 'string', rules: [{ type: 'url' }] }, 'not-a-url')
    expect(r.valid).toBe(false)
    expect(r.errors[0].code).toBe('url')
  })

  test('passes valid url', () => {
    expect(call({ type: 'string', rules: [{ type: 'url' }] }, 'https://example.com').valid).toBe(true)
  })

  test('fails pattern (regex)', () => {
    const r = call({ type: 'string', rules: [{ type: 'pattern', value: /^\d+$/ }] }, 'abc')
    expect(r.valid).toBe(false)
    expect(r.errors[0].code).toBe('pattern')
  })

  test('passes pattern (string)', () => {
    expect(call({ type: 'string', rules: [{ type: 'pattern', value: '^\\d+$' }] }, '123').valid).toBe(true)
  })

  test('wrong type fails', () => {
    const r = call({ type: 'string' }, 42)
    expect(r.valid).toBe(false)
    expect(r.errors[0].code).toBe('type')
  })
})

// ─── Number ───────────────────────────────────────────────────────────────────

describe('Zod v4 adapter — number', () => {
  test('passes valid number', () => {
    expect(call({ type: 'number', rules: [{ type: 'min', value: 0 }] }, 5).valid).toBe(true)
  })

  test('fails min', () => {
    const r = call({ type: 'number', rules: [{ type: 'min', value: 10 }] }, 3)
    expect(r.valid).toBe(false)
    expect(r.errors[0].code).toBe('min')
  })

  test('fails max', () => {
    const r = call({ type: 'number', rules: [{ type: 'max', value: 5 }] }, 10)
    expect(r.valid).toBe(false)
    expect(r.errors[0].code).toBe('max')
  })

  test('fails integer', () => {
    const r = call({ type: 'number', rules: [{ type: 'integer' }] }, 3.14)
    expect(r.valid).toBe(false)
  })

  test('passes positive', () => {
    expect(call({ type: 'number', rules: [{ type: 'positive' }] }, 5).valid).toBe(true)
  })

  test('fails positive when zero', () => {
    const r = call({ type: 'number', rules: [{ type: 'positive' }] }, 0)
    expect(r.valid).toBe(false)
  })

  test('passes negative', () => {
    expect(call({ type: 'number', rules: [{ type: 'negative' }] }, -5).valid).toBe(true)
  })

  test('fails negative when positive number', () => {
    const r = call({ type: 'number', rules: [{ type: 'negative' }] }, 1)
    expect(r.valid).toBe(false)
  })

  test('wrong type fails', () => {
    const r = call({ type: 'number' }, 'abc')
    expect(r.valid).toBe(false)
    expect(r.errors[0].code).toBe('type')
  })
})

// ─── Boolean ──────────────────────────────────────────────────────────────────

describe('Zod v4 adapter — boolean', () => {
  test('passes true', () => expect(call({ type: 'boolean' }, true).valid).toBe(true))
  test('passes false', () => expect(call({ type: 'boolean' }, false).valid).toBe(true))
  test('fails string', () => {
    const r = call({ type: 'boolean' }, 'yes')
    expect(r.valid).toBe(false)
  })
})

// ─── Array ────────────────────────────────────────────────────────────────────

describe('Zod v4 adapter — array', () => {
  test('passes valid array', () => {
    expect(call({ type: 'array', rules: [{ type: 'minItems', value: 1 }] }, ['a']).valid).toBe(true)
  })

  test('fails minItems', () => {
    const r = call({ type: 'array', rules: [{ type: 'minItems', value: 2 }] }, ['a'])
    expect(r.valid).toBe(false)
    expect(r.errors[0].code).toBe('minItems')
  })

  test('fails maxItems', () => {
    const r = call({ type: 'array', rules: [{ type: 'maxItems', value: 2 }] }, [1, 2, 3])
    expect(r.valid).toBe(false)
    expect(r.errors[0].code).toBe('maxItems')
  })

  test('fails noEmpty', () => {
    const r = call({ type: 'array', rules: [{ type: 'noEmpty' }] }, [])
    expect(r.valid).toBe(false)
  })

  test('validates typed items', () => {
    const schema = { type: 'array', items: { type: 'string', rules: [{ type: 'email' }] } }
    expect(call(schema, ['a@b.com']).valid).toBe(true)
    expect(call(schema, ['bad']).valid).toBe(false)
  })

  test('array without item schema (unknown items)', () => {
    expect(call({ type: 'array' }, [1, 'x', true]).valid).toBe(true)
  })
})

// ─── Object ───────────────────────────────────────────────────────────────────

describe('Zod v4 adapter — object', () => {
  test('passes valid object with shape', () => {
    const r = call(
      { type: 'object', shape: { name: { type: 'string', rules: [{ type: 'minLength', value: 2 }] } } },
      { name: 'Alice' }
    )
    expect(r.valid).toBe(true)
  })

  test('fails on nested field violation', () => {
    const r = call(
      { type: 'object', shape: { name: { type: 'string', rules: [{ type: 'minLength', value: 5 }] } } },
      { name: 'A' }
    )
    expect(r.valid).toBe(false)
  })

  test('object without shape (passthrough)', () => {
    expect(call({ type: 'object' }, { anything: true }).valid).toBe(true)
  })
})

// ─── Nullable / Optional ──────────────────────────────────────────────────────

describe('Zod v4 adapter — nullable / optional', () => {
  test('nullable schema accepts null', () => {
    expect(call({ type: 'string', nullable: true }, null).valid).toBe(true)
  })
  test('optional schema accepts undefined', () => {
    expect(call({ type: 'string', optional: true }, undefined).valid).toBe(true)
  })
  test('non-nullable rejects null', () => {
    expect(call({ type: 'string' }, null).valid).toBe(false)
  })
})

// ─── Any type ─────────────────────────────────────────────────────────────────

describe('Zod v4 adapter — any type', () => {
  test('passes all values', () => {
    expect(call({ type: 'any' }, 42).valid).toBe(true)
    expect(call({ type: 'any' }, 'str').valid).toBe(true)
    expect(call({ type: 'any' }, null).valid).toBe(true)
  })
})

// ─── Field error paths ────────────────────────────────────────────────────────

describe('Zod v4 adapter — field paths', () => {
  test('flat field option is used on simple schema', () => {
    const r = validate(
      { type: 'string', rules: [{ type: 'email' }] },
      'bad',
      { adapter: 'zod', field: 'myField' }
    )
    expect(r.errors[0].field).toBe('myField')
  })

  test('field option prefix appears on nested errors', () => {
    const schema = {
      type: 'object',
      shape: { email: { type: 'string', rules: [{ type: 'email' }] } },
    }
    const r = validate(schema, { email: 'bad' }, { adapter: 'zod', field: 'user' })
    expect(r.errors[0].field).toContain('email')
  })
})

// ─── Global default adapter ───────────────────────────────────────────────────

describe('Zod adapter as global default', () => {
  test('setAdapter("zod") is used by default validate()', () => {
    setAdapter('zod')
    const r = validate({ type: 'string', rules: [{ type: 'email' }] }, 'user@x.com')
    expect(r.valid).toBe(true)
  })
})
