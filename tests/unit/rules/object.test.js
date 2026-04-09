'use strict'

const { requiredKeys } = require('../../../src/rules/object')

describe('requiredKeys()', () => {
  test('passes when all keys are present', () => {
    expect(requiredKeys({ a: 1, b: 2 }, { value: ['a', 'b'] })).toBe(true)
  })

  test('fails when a key is missing', () => {
    const r = requiredKeys({ a: 1 }, { value: ['a', 'b'] })
    expect(r.code).toBe('requiredKeys')
    expect(r.params.keys).toContain('b')
  })

  test('fails when a key exists but is null', () => {
    const r = requiredKeys({ a: null }, { value: ['a'] })
    expect(r.code).toBe('requiredKeys')
  })

  test('fails when a key exists but is undefined', () => {
    const r = requiredKeys({ a: undefined }, { value: ['a'] })
    expect(r.code).toBe('requiredKeys')
  })

  test('passes with empty keys list', () => {
    expect(requiredKeys({}, { value: [] })).toBe(true)
  })

  test('skips non-objects', () => {
    expect(requiredKeys('abc', { value: ['a'] })).toBe(true)
    expect(requiredKeys(null, { value: ['a'] })).toBe(true)
    expect(requiredKeys([], { value: ['a'] })).toBe(true)
  })

  test('accepts params.keys alias', () => {
    const r = requiredKeys({}, { keys: ['x'] })
    expect(r.code).toBe('requiredKeys')
  })
})
