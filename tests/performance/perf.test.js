'use strict'

const { validate, clearCache, _reset } = require('../../src/index')

beforeEach(() => _reset())

describe('Performance', () => {
  test('1000 string validations complete in under 200ms', () => {
    const schema = {
      type: 'string',
      rules: [{ type: 'minLength', value: 3 }, { type: 'email' }],
    }
    const start = Date.now()
    for (let i = 0; i < 1000; i++) {
      validate(schema, 'user@example.com')
    }
    const elapsed = Date.now() - start
    expect(elapsed).toBeLessThan(200)
  })

  test('1000 object validations complete in under 500ms', () => {
    const schema = {
      type: 'object',
      shape: {
        name:  { type: 'string', rules: [{ type: 'minLength', value: 2 }] },
        email: { type: 'string', rules: [{ type: 'email' }] },
        age:   { type: 'number', rules: [{ type: 'min', value: 0 }] },
      },
    }
    const start = Date.now()
    for (let i = 0; i < 1000; i++) {
      validate(schema, { name: 'Alice', email: 'alice@example.com', age: 30 })
    }
    const elapsed = Date.now() - start
    expect(elapsed).toBeLessThan(500)
  })

  test('schema cache: second call is faster than first batch', () => {
    const schema = { type: 'string', rules: [{ type: 'email' }] }

    // warm up (populates cache)
    clearCache()
    const t0 = Date.now()
    for (let i = 0; i < 500; i++) validate(schema, 'a@b.com')
    const coldMs = Date.now() - t0

    // cached run
    const t1 = Date.now()
    for (let i = 0; i < 500; i++) validate(schema, 'a@b.com')
    const warmMs = Date.now() - t1

    // warm should not be dramatically slower (sanity check, not strict)
    expect(warmMs).toBeLessThanOrEqual(coldMs + 50)
  })

  test('100 complex nested validations complete in under 300ms', () => {
    const schema = {
      type: 'object',
      shape: {
        profile: {
          type: 'object',
          shape: {
            username: { type: 'string', rules: [{ type: 'minLength', value: 3 }] },
            tags: {
              type: 'array',
              rules: [{ type: 'maxItems', value: 10 }],
              items: { type: 'string' },
            },
          },
        },
      },
    }
    const value = { profile: { username: 'alice', tags: ['js', 'node'] } }
    const start = Date.now()
    for (let i = 0; i < 100; i++) validate(schema, value)
    expect(Date.now() - start).toBeLessThan(300)
  })
})
