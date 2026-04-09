'use strict'

const {
  registerRule,
  registerAdapter,
  setAdapter,
  getActiveAdapterName,
  getAdapter,
  getRule,
  hasRule,
  getRuleNames,
  _reset,
} = require('../../../src/core/registry')

beforeEach(() => _reset())

describe('registerRule()', () => {
  test('registers and retrieves a custom rule', () => {
    registerRule('myRule', () => true)
    expect(hasRule('myRule')).toBe(true)
    expect(typeof getRule('myRule')).toBe('function')
  })

  test('overrides an existing rule', () => {
    const fn = () => true
    registerRule('myRule', fn)
    registerRule('myRule', fn)
    expect(getRule('myRule')).toBe(fn)
  })

  test('throws on empty name', () => {
    expect(() => registerRule('', () => true)).toThrow()
  })

  test('throws when fn is not a function', () => {
    expect(() => registerRule('bad', 'not-a-fn')).toThrow()
  })
})

describe('hasRule() / getRule()', () => {
  test('built-in rules are present after reset', () => {
    const names = getRuleNames()
    expect(names).toContain('required')
    expect(names).toContain('minLength')
    expect(names).toContain('email')
    expect(names).toContain('min')
    expect(names).toContain('minItems')
  })

  test('returns null for unknown rule', () => {
    expect(getRule('nonExistent')).toBeNull()
  })
})

describe('registerAdapter() / setAdapter()', () => {
  test('registers and activates a custom adapter', () => {
    const adapter = { validate: () => [] }
    registerAdapter('myAdapter', adapter)
    setAdapter('myAdapter')
    expect(getActiveAdapterName()).toBe('myAdapter')
    expect(getAdapter('myAdapter')).toBe(adapter)
  })

  test('setAdapter("default") always succeeds', () => {
    expect(() => setAdapter('default')).not.toThrow()
    expect(getActiveAdapterName()).toBe('default')
  })

  test('setAdapter throws for unregistered adapter', () => {
    expect(() => setAdapter('nope')).toThrow()
  })

  test('registerAdapter throws when validate is missing', () => {
    expect(() => registerAdapter('bad', {})).toThrow()
  })

  test('registerAdapter throws on empty name', () => {
    expect(() => registerAdapter('', { validate: () => [] })).toThrow()
  })
})
