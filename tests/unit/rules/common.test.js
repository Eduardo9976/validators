'use strict'

const { required, type, oneOf, custom } = require('../../../src/rules/common')

describe('required()', () => {
  test('passes non-empty string', () => expect(required('hello')).toBe(true))
  test('passes number 0', () => expect(required(0)).toBe(true))
  test('passes false', () => expect(required(false)).toBe(true))
  test('fails null', () => expect(required(null).code).toBe('required'))
  test('fails undefined', () => expect(required(undefined).code).toBe('required'))
  test('fails empty string', () => expect(required('').code).toBe('required'))
})

describe('type()', () => {
  test('passes string type check', () => expect(type('hello', { value: 'string' })).toBe(true))
  test('passes number type check', () => expect(type(42, { value: 'number' })).toBe(true))
  test('passes boolean type check', () => expect(type(true, { value: 'boolean' })).toBe(true))
  test('passes array type check', () => expect(type([], { value: 'array' })).toBe(true))
  test('passes object type check', () => expect(type({}, { value: 'object' })).toBe(true))
  test('fails string given number', () => {
    const r = type(42, { value: 'string' })
    expect(r.code).toBe('type')
    expect(r.params).toMatchObject({ expected: 'string', actual: 'number' })
  })
  test('fails array given "object"', () => {
    const r = type([], { value: 'object' })
    expect(r.code).toBe('type')
    expect(r.params.actual).toBe('array')
  })
  test('NaN fails number check', () => {
    const r = type(NaN, { value: 'number' })
    expect(r.code).toBe('type')
  })
  test('skips unknown type', () => expect(type('x', { value: 'unknown-type' })).toBe(true))
  test('skips when no type specified', () => expect(type('x', {})).toBe(true))
})

describe('oneOf()', () => {
  test('passes when value is in list', () => expect(oneOf('a', { value: ['a', 'b', 'c'] })).toBe(true))
  test('fails when value is not in list', () => {
    const r = oneOf('x', { value: ['a', 'b'] })
    expect(r.code).toBe('oneOf')
    expect(r.params.values).toContain('a')
  })
  test('accepts params.values alias', () => {
    expect(oneOf(1, { values: [1, 2] })).toBe(true)
  })
  test('uses strict equality', () => {
    expect(oneOf('1', { value: [1, 2] }).code).toBe('oneOf')
  })
})

describe('custom()', () => {
  test('passes when fn returns true', () => {
    expect(custom('x', { fn: () => true })).toBe(true)
  })
  test('passes when fn returns undefined', () => {
    expect(custom('x', { fn: () => undefined })).toBe(true)
  })
  test('fails when fn returns false', () => {
    expect(custom('x', { fn: () => false }).code).toBe('custom')
  })
  test('fails with string message', () => {
    const r = custom('x', { fn: () => 'too short' })
    expect(r.message).toBe('too short')
  })
  test('fails with { code, params }', () => {
    const r = custom('x', { fn: () => ({ code: 'myCode', params: { x: 1 } }) })
    expect(r.code).toBe('myCode')
  })
  test('skips when fn is not a function', () => {
    expect(custom('x', {})).toBe(true)
  })
})
