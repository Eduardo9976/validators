'use strict'

const { validate, _reset } = require('../../src/index')

beforeEach(() => _reset())

/**
 * Simulates receiving a schema from an API (plain JSON).
 * The schema is just a JS object — no special class or constructor.
 */
describe('Dynamic schema from API', () => {
  test('validates a string schema fetched as JSON', () => {
    // Simulate JSON.parse(response.body)
    const apiSchema = JSON.parse(
      JSON.stringify({
        type: 'string',
        rules: [{ type: 'minLength', value: 5 }, { type: 'email' }],
      })
    )
    expect(validate(apiSchema, 'user@example.com').valid).toBe(true)
    expect(validate(apiSchema, 'bad').valid).toBe(false)
  })

  test('validates an object schema fetched as JSON', () => {
    const apiSchema = JSON.parse(
      JSON.stringify({
        type: 'object',
        shape: {
          username: { type: 'string', rules: [{ type: 'minLength', value: 3 }] },
          age:      { type: 'number', rules: [{ type: 'min', value: 18 }] },
        },
      })
    )
    const valid = validate(apiSchema, { username: 'alice', age: 25 })
    expect(valid.valid).toBe(true)

    const invalid = validate(apiSchema, { username: 'al', age: 16 })
    expect(invalid.valid).toBe(false)
    expect(invalid.errors).toHaveLength(2)
  })

  test('handles an array schema from API', () => {
    const apiSchema = JSON.parse(
      JSON.stringify({
        type: 'array',
        rules: [{ type: 'minItems', value: 1 }, { type: 'maxItems', value: 5 }],
        items: { type: 'string' },
      })
    )
    expect(validate(apiSchema, ['a', 'b']).valid).toBe(true)
    expect(validate(apiSchema, []).valid).toBe(false)
    expect(validate(apiSchema, [1, 2, 3, 4, 5, 6]).valid).toBe(false)
  })

  test('same schema object can be reused across multiple calls (cache)', () => {
    const schema = { type: 'string', rules: [{ type: 'email' }] }
    const r1 = validate(schema, 'a@b.com')
    const r2 = validate(schema, 'bad')
    expect(r1.valid).toBe(true)
    expect(r2.valid).toBe(false)
  })
})
