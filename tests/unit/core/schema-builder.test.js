'use strict'

const { buildSchema, clearCache } = require('../../../src/core/schema-builder')

beforeEach(() => clearCache())

describe('buildSchema()', () => {
  test('returns a normalised schema with defaults', () => {
    const schema = buildSchema({ type: 'string' })
    expect(schema.type).toBe('string')
    expect(schema.rules).toEqual([])
    expect(schema.nullable).toBe(false)
    expect(schema.optional).toBe(false)
    expect(schema.label).toBeNull()
    expect(schema.shape).toBeNull()
    expect(schema.items).toBeNull()
  })

  test('preserves all fields', () => {
    const def = {
      type: 'string',
      rules: [{ type: 'email' }],
      nullable: true,
      optional: true,
      label: 'Email',
    }
    const schema = buildSchema(def)
    expect(schema.nullable).toBe(true)
    expect(schema.optional).toBe(true)
    expect(schema.label).toBe('Email')
    expect(schema.rules).toHaveLength(1)
  })

  test('accepts all valid types', () => {
    for (const type of ['string', 'number', 'boolean', 'array', 'object', 'any']) {
      expect(() => buildSchema({ type })).not.toThrow()
    }
  })

  test('throws on invalid type', () => {
    expect(() => buildSchema({ type: 'uuid' })).toThrow()
  })

  test('throws when definition is not an object', () => {
    expect(() => buildSchema(null)).toThrow()
    expect(() => buildSchema('string')).toThrow()
    expect(() => buildSchema([])).toThrow()
  })

  test('throws when a rule has no type property', () => {
    expect(() => buildSchema({ type: 'string', rules: [{ value: 5 }] })).toThrow()
  })

  test('returns cached schema on second call', () => {
    const def = { type: 'number', rules: [{ type: 'min', value: 0 }] }
    const a = buildSchema(def)
    const b = buildSchema(def)
    expect(a).toBe(b) // same reference
  })

  test('clearCache removes cached entry', () => {
    const def = { type: 'boolean' }
    const a = buildSchema(def)
    clearCache()
    const b = buildSchema(def)
    expect(a).not.toBe(b) // different reference after cache clear
  })

  test('defaults type to "any" when omitted', () => {
    const schema = buildSchema({})
    expect(schema.type).toBe('any')
  })

  test('cache is bounded — evicts oldest entry past the cap', () => {
    // Build many distinct schemas to overflow the 1000-entry cap and confirm
    // the first inserted entry no longer maps to the same cached reference.
    const firstDef = { type: 'string', rules: [{ type: 'minLength', value: 0 }] }
    const firstSchema = buildSchema(firstDef)

    for (let i = 1; i < 1001; i++) {
      buildSchema({ type: 'string', rules: [{ type: 'minLength', value: i }] })
    }

    const firstAgain = buildSchema(firstDef)
    expect(firstAgain).not.toBe(firstSchema) // evicted → new object built
  })
})
