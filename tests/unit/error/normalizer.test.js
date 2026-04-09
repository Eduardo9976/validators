'use strict'

const { normalizeError, normalizeErrors } = require('../../../src/error/normalizer')
const { _reset } = require('../../../src/i18n/index')

beforeEach(() => _reset())

describe('normalizeError()', () => {
  test('produces all required fields', () => {
    const r = normalizeError({ field: 'email', code: 'email', params: {} })
    expect(r).toHaveProperty('field', 'email')
    expect(r).toHaveProperty('code', 'email')
    expect(r).toHaveProperty('params')
    expect(r).toHaveProperty('message')
    expect(typeof r.message).toBe('string')
  })

  test('translates code to English message by default', () => {
    const r = normalizeError({ code: 'required', params: {} })
    expect(r.message).toMatch(/required/i)
  })

  test('interpolates params into message', () => {
    const r = normalizeError({ code: 'minLength', params: { min: 5, actual: 2 } })
    expect(r.message).toContain('5')
    expect(r.message).toContain('2')
  })

  test('respects pre-set message override', () => {
    const r = normalizeError({ code: 'required', params: {}, message: 'Custom message' })
    expect(r.message).toBe('Custom message')
  })

  test('defaults field to empty string', () => {
    const r = normalizeError({ code: 'required', params: {} })
    expect(r.field).toBe('')
  })

  test('defaults code to "custom" when missing', () => {
    const r = normalizeError({ params: {} })
    expect(r.code).toBe('custom')
  })

  test('localises to pt-BR when locale specified', () => {
    const r = normalizeError({ code: 'required', params: {} }, 'pt-BR')
    expect(r.message).toContain('obrigatório')
  })
})

describe('normalizeErrors()', () => {
  test('normalises an array of raw errors', () => {
    const result = normalizeErrors([
      { code: 'required', params: {} },
      { code: 'email', params: {} },
    ])
    expect(result).toHaveLength(2)
    expect(result[0].code).toBe('required')
    expect(result[1].code).toBe('email')
  })

  test('returns empty array for non-array input', () => {
    expect(normalizeErrors(null)).toEqual([])
    expect(normalizeErrors(undefined)).toEqual([])
    expect(normalizeErrors('bad')).toEqual([])
  })
})
