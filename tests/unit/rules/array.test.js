'use strict'

const { minItems, maxItems, noEmpty, unique } = require('../../../src/rules/array')

describe('minItems()', () => {
  test('passes when length >= min', () => expect(minItems([1, 2, 3], { value: 2 })).toBe(true))
  test('passes at exact boundary', () => expect(minItems([1], { value: 1 })).toBe(true))
  test('fails when array is too short', () => {
    const r = minItems([], { value: 1 })
    expect(r.code).toBe('minItems')
    expect(r.params).toMatchObject({ min: 1, actual: 0 })
  })
  test('skips non-arrays', () => expect(minItems('abc', { value: 1 })).toBe(true))
  test('accepts params.min alias', () => expect(minItems([], { min: 1 }).code).toBe('minItems'))
})

describe('maxItems()', () => {
  test('passes when length <= max', () => expect(maxItems([1, 2], { value: 5 })).toBe(true))
  test('fails when too many items', () => {
    const r = maxItems([1, 2, 3, 4], { value: 3 })
    expect(r.code).toBe('maxItems')
    expect(r.params).toMatchObject({ max: 3, actual: 4 })
  })
  test('skips non-arrays', () => expect(maxItems('abc', { value: 1 })).toBe(true))
})

describe('noEmpty()', () => {
  test('passes non-empty array', () => expect(noEmpty([1])).toBe(true))
  test('fails empty array', () => expect(noEmpty([]).code).toBe('noEmpty'))
  test('skips non-arrays', () => expect(noEmpty('abc')).toBe(true))
})

describe('unique()', () => {
  test('passes unique primitives', () => expect(unique([1, 2, 3])).toBe(true))
  test('passes unique objects', () => expect(unique([{ a: 1 }, { a: 2 }])).toBe(true))
  test('fails duplicate primitives', () => expect(unique([1, 2, 1]).code).toBe('unique'))
  test('fails duplicate objects (deep)', () => expect(unique([{ a: 1 }, { a: 1 }]).code).toBe('unique'))
  test('passes empty array', () => expect(unique([])).toBe(true))
  test('skips non-arrays', () => expect(unique('abc')).toBe(true))
})
