'use strict'

const { validate, _reset } = require('../../../src/index')

beforeEach(() => _reset())

describe('validate() — string schema', () => {
  test('passes a valid string', () => {
    const result = validate({ type: 'string', rules: [{ type: 'minLength', value: 3 }] }, 'hello')
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  test('fails when string is too short', () => {
    const result = validate({ type: 'string', rules: [{ type: 'minLength', value: 5 }] }, 'hi')
    expect(result.valid).toBe(false)
    expect(result.errors[0].code).toBe('minLength')
    expect(result.errors[0].params).toMatchObject({ min: 5, actual: 2 })
    expect(result.errors[0].message).toContain('5')
  })

  test('fails when value is null on non-nullable schema', () => {
    const result = validate({ type: 'string' }, null)
    expect(result.valid).toBe(false)
    expect(result.errors[0].code).toBe('required')
  })

  test('passes when value is null on nullable schema', () => {
    const result = validate({ type: 'string', nullable: true }, null)
    expect(result.valid).toBe(true)
  })

  test('fails when value is undefined on non-optional schema', () => {
    const result = validate({ type: 'string' }, undefined)
    expect(result.valid).toBe(false)
    expect(result.errors[0].code).toBe('required')
  })

  test('passes when value is undefined on optional schema', () => {
    const result = validate({ type: 'string', optional: true }, undefined)
    expect(result.valid).toBe(true)
  })

  test('fails with wrong type', () => {
    const result = validate({ type: 'string' }, 42)
    expect(result.valid).toBe(false)
    expect(result.errors[0].code).toBe('type')
  })

  test('locale override on error message', () => {
    const result = validate(
      { type: 'string', rules: [{ type: 'minLength', value: 10 }] },
      'abc',
      { locale: 'pt-BR' }
    )
    expect(result.valid).toBe(false)
    expect(result.errors[0].message).toContain('mínimo')
  })

  test('multiple rules — collects all failures', () => {
    const result = validate(
      {
        type: 'string',
        rules: [{ type: 'minLength', value: 10 }, { type: 'email' }],
      },
      'abc'
    )
    expect(result.valid).toBe(false)
    expect(result.errors).toHaveLength(2)
  })

  test('never throws on invalid definition', () => {
    expect(() => validate(null, 'x')).not.toThrow()
    const result = validate(null, 'x')
    expect(result.valid).toBe(false)
  })

  test('field option is propagated to errors', () => {
    const result = validate(
      { type: 'string', rules: [{ type: 'email' }] },
      'not-an-email',
      { field: 'user.email' }
    )
    expect(result.errors[0].field).toBe('user.email')
  })
})
