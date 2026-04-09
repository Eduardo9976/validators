'use strict'

const { min, max, integer, positive, negative } = require('../../../src/rules/number')

describe('min()', () => {
  test('passes when value >= min', () => expect(min(10, { value: 5 })).toBe(true))
  test('passes at exact boundary', () => expect(min(5, { value: 5 })).toBe(true))
  test('fails when value < min', () => {
    const r = min(3, { value: 5 })
    expect(r.code).toBe('min')
    expect(r.params.min).toBe(5)
  })
  test('skips non-numbers', () => expect(min('abc', { value: 5 })).toBe(true))
  test('accepts params.min alias', () => expect(min(2, { min: 5 }).code).toBe('min'))
})

describe('max()', () => {
  test('passes when value <= max', () => expect(max(4, { value: 10 })).toBe(true))
  test('fails when value > max', () => {
    const r = max(20, { value: 10 })
    expect(r.code).toBe('max')
    expect(r.params.max).toBe(10)
  })
  test('skips non-numbers', () => expect(max('abc', { value: 10 })).toBe(true))
})

describe('integer()', () => {
  test('passes integers', () => expect(integer(5)).toBe(true))
  test('passes zero', () => expect(integer(0)).toBe(true))
  test('passes negative integer', () => expect(integer(-3)).toBe(true))
  test('fails float', () => expect(integer(3.14).code).toBe('integer'))
  test('skips non-numbers', () => expect(integer('5')).toBe(true))
})

describe('positive()', () => {
  test('passes positive number', () => expect(positive(1)).toBe(true))
  test('fails zero', () => expect(positive(0).code).toBe('positive'))
  test('fails negative number', () => expect(positive(-1).code).toBe('positive'))
  test('skips non-numbers', () => expect(positive('abc')).toBe(true))
})

describe('negative()', () => {
  test('passes negative number', () => expect(negative(-1)).toBe(true))
  test('fails zero', () => expect(negative(0).code).toBe('negative'))
  test('fails positive number', () => expect(negative(1).code).toBe('negative'))
  test('skips non-numbers', () => expect(negative('abc')).toBe(true))
})
