'use strict'

const {
  setLocale,
  getLocale,
  translate,
  registerLocale,
  hasLocale,
  _reset,
} = require('../../../src/i18n/index')

beforeEach(() => _reset())

describe('setLocale() / getLocale()', () => {
  test('defaults to "en"', () => expect(getLocale()).toBe('en'))
  test('changes current locale', () => {
    setLocale('pt-BR')
    expect(getLocale()).toBe('pt-BR')
  })
  test('throws on empty string', () => expect(() => setLocale('')).toThrow())
  test('throws on non-string', () => expect(() => setLocale(null)).toThrow())
})

describe('translate()', () => {
  test('translates a known code in English', () => {
    const msg = translate('required', {})
    expect(msg).toMatch(/required/i)
  })

  test('interpolates params', () => {
    const msg = translate('minLength', { min: 8, actual: 3 })
    expect(msg).toContain('8')
    expect(msg).toContain('3')
  })

  test('translates in pt-BR when locale is set', () => {
    setLocale('pt-BR')
    expect(translate('required', {})).toContain('obrigatório')
  })

  test('locale override parameter takes precedence', () => {
    setLocale('en')
    const msg = translate('required', {}, 'pt-BR')
    expect(msg).toContain('obrigatório')
  })

  test('falls back to "en" for unknown locale', () => {
    const msg = translate('required', {}, 'fr')
    expect(msg).toMatch(/required/i)
  })

  test('returns code itself when code is unknown', () => {
    const msg = translate('nonExistentCode', {})
    expect(msg).toBe('nonExistentCode')
  })

  test('handles missing params gracefully (no crash)', () => {
    const msg = translate('minLength', null)
    expect(typeof msg).toBe('string')
  })

  test('keeps placeholder when param is missing', () => {
    const msg = translate('minLength', {}) // missing min and actual
    expect(msg).toContain('{min}')
  })
})

describe('registerLocale()', () => {
  test('registers and uses a new locale', () => {
    registerLocale('fr', { required: 'Ce champ est requis' })
    const msg = translate('required', {}, 'fr')
    expect(msg).toBe('Ce champ est requis')
  })

  test('merges into existing locale', () => {
    registerLocale('en', { customCode: 'Custom English Message' })
    expect(translate('customCode', {})).toBe('Custom English Message')
    // existing keys still work
    expect(translate('required', {})).toMatch(/required/i)
  })

  test('throws on invalid locale argument', () => {
    expect(() => registerLocale(null, {})).toThrow()
    expect(() => registerLocale('', {})).toThrow()
  })

  test('throws on invalid messages argument', () => {
    expect(() => registerLocale('fr', 'bad')).toThrow()
    expect(() => registerLocale('fr', null)).toThrow()
  })
})

describe('hasLocale()', () => {
  test('returns true for built-in locales', () => {
    expect(hasLocale('en')).toBe(true)
    expect(hasLocale('pt-BR')).toBe(true)
  })
  test('returns false for unknown locale', () => {
    expect(hasLocale('de')).toBe(false)
  })
  test('returns true after registerLocale', () => {
    registerLocale('es', { required: 'Requerido' })
    expect(hasLocale('es')).toBe(true)
  })
})
