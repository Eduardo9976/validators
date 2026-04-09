'use strict'

const { minLength, maxLength, pattern, email, url, notEmpty } = require('../../../src/rules/string')

describe('minLength()', () => {
  test('passes when length >= min', () => expect(minLength('hello', { value: 3 })).toBe(true))
  test('passes exact length', () => expect(minLength('abc', { value: 3 })).toBe(true))
  test('fails when too short', () => {
    const r = minLength('hi', { value: 5 })
    expect(r.code).toBe('minLength')
    expect(r.params).toMatchObject({ min: 5, actual: 2 })
  })
  test('skips non-strings', () => expect(minLength(123, { value: 5 })).toBe(true))
})

describe('maxLength()', () => {
  test('passes when length <= max', () => expect(maxLength('hi', { value: 5 })).toBe(true))
  test('fails when too long', () => {
    const r = maxLength('toolongstring', { value: 5 })
    expect(r.code).toBe('maxLength')
    expect(r.params).toMatchObject({ max: 5, actual: 13 })
  })
  test('skips non-strings', () => expect(maxLength(99, { value: 5 })).toBe(true))
})

describe('pattern()', () => {
  test('passes matching pattern', () => expect(pattern('abc123', { value: /^[a-z0-9]+$/i })).toBe(true))
  test('fails non-matching pattern', () => {
    const r = pattern('!!!', { value: /^[a-z]+$/ })
    expect(r.code).toBe('pattern')
  })
  test('accepts string pattern', () => expect(pattern('42', { value: '^\\d+$' })).toBe(true))
  test('skips non-strings', () => expect(pattern(42, { value: /\d+/ })).toBe(true))
})

describe('email()', () => {
  test('passes valid e-mail', () => expect(email('user@example.com')).toBe(true))
  test('fails invalid e-mail', () => {
    const r = email('not-an-email')
    expect(r.code).toBe('email')
  })
  test('fails e-mail without domain', () => expect(email('user@').code).toBe('email'))
  test('skips non-strings', () => expect(email(42)).toBe(true))
})

describe('url()', () => {
  test('passes valid URL', () => expect(url('https://example.com')).toBe(true))
  test('passes URL with path', () => expect(url('https://example.com/path/to/page')).toBe(true))
  test('fails invalid URL', () => {
    const r = url('not a url')
    expect(r.code).toBe('url')
  })
  test('skips non-strings', () => expect(url(42)).toBe(true))
})

describe('notEmpty()', () => {
  test('passes non-empty string', () => expect(notEmpty('hello')).toBe(true))
  test('fails empty string', () => expect(notEmpty('').code).toBe('notEmpty'))
  test('fails whitespace-only string', () => expect(notEmpty('   ').code).toBe('notEmpty'))
  test('skips non-strings', () => expect(notEmpty(0)).toBe(true))
})
