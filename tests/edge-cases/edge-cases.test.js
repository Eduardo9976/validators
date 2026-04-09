'use strict'

const { validate, _reset } = require('../../src/index')

beforeEach(() => _reset())

describe('Edge cases', () => {
  describe('null and undefined inputs', () => {
    test('null fails non-nullable schema', () => {
      expect(validate({ type: 'string' }, null).valid).toBe(false)
    })
    test('undefined fails non-optional schema', () => {
      expect(validate({ type: 'string' }, undefined).valid).toBe(false)
    })
    test('null passes nullable schema without running further rules', () => {
      const r = validate({ type: 'string', nullable: true, rules: [{ type: 'email' }] }, null)
      expect(r.valid).toBe(true)
    })
    test('undefined passes optional schema without running further rules', () => {
      const r = validate({ type: 'string', optional: true, rules: [{ type: 'email' }] }, undefined)
      expect(r.valid).toBe(true)
    })
  })

  describe('wrong types', () => {
    test('number given where string expected', () => {
      const r = validate({ type: 'string' }, 42)
      expect(r.valid).toBe(false)
      expect(r.errors[0].code).toBe('type')
    })
    test('string given where number expected', () => {
      const r = validate({ type: 'number' }, 'abc')
      expect(r.valid).toBe(false)
      expect(r.errors[0].code).toBe('type')
    })
    test('array given where object expected', () => {
      const r = validate({ type: 'object' }, [])
      expect(r.valid).toBe(false)
      expect(r.errors[0].code).toBe('type')
    })
    test('NaN fails number type check', () => {
      const r = validate({ type: 'number' }, NaN)
      expect(r.valid).toBe(false)
    })
  })

  describe('empty collections', () => {
    test('empty string passes type check, fails notEmpty', () => {
      const r = validate({ type: 'string', rules: [{ type: 'notEmpty' }] }, '')
      expect(r.valid).toBe(false)
    })
    test('empty array passes type check', () => {
      const r = validate({ type: 'array' }, [])
      expect(r.valid).toBe(true)
    })
    test('empty object passes type check', () => {
      const r = validate({ type: 'object' }, {})
      expect(r.valid).toBe(true)
    })
  })

  describe('deeply nested objects', () => {
    test('reports dot-path for deeply nested failures', () => {
      const schema = {
        type: 'object',
        shape: {
          address: {
            type: 'object',
            shape: {
              zip: { type: 'string', rules: [{ type: 'pattern', value: '^\\d{5}$' }] },
            },
          },
        },
      }
      const r = validate(schema, { address: { zip: 'ABCDE' } })
      expect(r.valid).toBe(false)
      expect(r.errors[0].field).toBe('address.zip')
    })
  })

  describe('invalid schema definitions', () => {
    test('null definition returns safe error result', () => {
      const r = validate(null, 'x')
      expect(r.valid).toBe(false)
      expect(r.errors.length).toBeGreaterThan(0)
    })
    test('definition with invalid type returns safe error', () => {
      const r = validate({ type: 'badtype' }, 'x')
      expect(r.valid).toBe(false)
    })
    test('definition without rules array is tolerated', () => {
      const r = validate({ type: 'string' }, 'hello')
      expect(r.valid).toBe(true)
    })
  })

  describe('oneOf edge cases', () => {
    test('strict equality — "1" != 1', () => {
      const r = validate({ type: 'string', rules: [{ type: 'oneOf', value: [1, 2] }] }, '1')
      expect(r.valid).toBe(false)
    })
    test('passes matching value', () => {
      const r = validate({ type: 'string', rules: [{ type: 'oneOf', value: ['a', 'b'] }] }, 'a')
      expect(r.valid).toBe(true)
    })
  })

  describe('unknown rules', () => {
    test('unknown rule type is silently skipped', () => {
      const r = validate({ type: 'string', rules: [{ type: 'nonExistent' }] }, 'hello')
      expect(r.valid).toBe(true)
    })
  })
})
