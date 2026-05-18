'use strict'

const {
  validate,
  registerRule,
  registerAdapter,
  setAdapter,
  _reset,
} = require('../../src/index')

beforeEach(() => _reset())

describe('Robustness — failures surface as validation errors, never thrown', () => {
  test('custom rule throwing is caught and surfaced', () => {
    registerRule('boom', () => {
      throw new Error('rule blew up')
    })
    const r = validate({ type: 'string', rules: [{ type: 'boom' }] }, 'x')
    expect(r.valid).toBe(false)
    expect(r.errors[0].code).toBe('custom')
    expect(r.errors[0].message).toMatch(/blew up/)
  })

  test('custom adapter throwing is caught and surfaced', () => {
    registerAdapter('explody', {
      validate() {
        throw new Error('adapter crashed')
      },
    })
    setAdapter('explody')
    const r = validate({ type: 'string' }, 'x')
    expect(r.valid).toBe(false)
    expect(r.errors[0].code).toBe('custom')
    expect(r.errors[0].message).toMatch(/adapter crashed/)
  })

  test('adapter returning non-array is treated as no errors', () => {
    registerAdapter('weird', {
      validate() {
        return 'not an array'
      },
    })
    setAdapter('weird')
    const r = validate({ type: 'string' }, 'x')
    expect(r.valid).toBe(true)
    expect(r.errors).toEqual([])
  })

  test('invalid regex string in pattern rule does not crash whole validation', () => {
    // Unmatched bracket — new RegExp() throws SyntaxError
    const r = validate({ type: 'string', rules: [{ type: 'pattern', value: '[unclosed' }] }, 'abc')
    expect(r.valid).toBe(false) // surfaced as a single custom error
    expect(typeof r.errors[0].message).toBe('string')
  })

  test('unique rule on array containing circular reference does not crash', () => {
    const a = { name: 'x' }
    a.self = a
    const r = validate({ type: 'array', rules: [{ type: 'unique' }] }, [a, a])
    // JSON.stringify(a) throws; library must surface that as a validation error,
    // not propagate the throw to caller.
    expect(r.valid).toBe(false)
    expect(typeof r.errors[0].message).toBe('string')
  })

  test('custom rule returning malformed value is tolerated', () => {
    registerRule('bad', () => 12345) // not true / not { code }
    const r = validate({ type: 'string', rules: [{ type: 'bad' }] }, 'x')
    // Whatever happens, validate() must not throw and must return an object
    expect(r).toHaveProperty('valid')
    expect(r).toHaveProperty('errors')
  })

  test('validate never throws even for grossly invalid inputs', () => {
    expect(() => validate(undefined, undefined)).not.toThrow()
    expect(() => validate(123, 'x')).not.toThrow()
    expect(() => validate('string-not-schema', null)).not.toThrow()
  })
})

describe('Security — prototype pollution attempts are not honored', () => {
  test('shape with __proto__ key does not pollute Object.prototype', () => {
    const polluted = { __proto__: { type: 'string', rules: [{ type: 'minLength', value: 100 }] } }
    const schema = { type: 'object', shape: polluted }
    validate(schema, { a: 1 })
    // After running validation, no global pollution should exist
    expect({}.polluted).toBeUndefined()
    expect(Object.prototype.polluted).toBeUndefined()
  })

  test('object value with __proto__ payload is treated as data, not prototype', () => {
    const evil = JSON.parse('{"__proto__":{"polluted":true},"x":1}')
    const r = validate(
      { type: 'object', shape: { x: { type: 'number' } } },
      evil
    )
    expect(r.valid).toBe(true)
    expect({}.polluted).toBeUndefined()
  })

  test('pathological input does not hang email regex (ReDoS guard)', () => {
    // 10k-char input with no @ — must complete fast
    const longInput = 'a'.repeat(10000)
    const start = Date.now()
    const r = validate({ type: 'string', rules: [{ type: 'email' }] }, longInput)
    const elapsed = Date.now() - start
    expect(r.valid).toBe(false)
    expect(elapsed).toBeLessThan(100)
  })

  test('pathological input does not hang url regex (ReDoS guard)', () => {
    const longInput = 'http://' + 'a'.repeat(10000)
    const start = Date.now()
    validate({ type: 'string', rules: [{ type: 'url' }] }, longInput)
    expect(Date.now() - start).toBeLessThan(100)
  })
})

describe('Edge values — numbers', () => {
  test('Infinity fails integer rule but passes type number', () => {
    expect(validate({ type: 'number' }, Infinity).valid).toBe(true)
    expect(validate({ type: 'number', rules: [{ type: 'integer' }] }, Infinity).valid).toBe(false)
  })

  test('-Infinity fails integer rule', () => {
    expect(validate({ type: 'number', rules: [{ type: 'integer' }] }, -Infinity).valid).toBe(false)
  })

  test('MAX_SAFE_INTEGER passes integer rule', () => {
    expect(validate({ type: 'number', rules: [{ type: 'integer' }] }, Number.MAX_SAFE_INTEGER).valid).toBe(true)
  })

  test('positive zero fails positive rule (strict > 0)', () => {
    expect(validate({ type: 'number', rules: [{ type: 'positive' }] }, 0).valid).toBe(false)
  })

  test('negative zero fails negative rule (strict < 0)', () => {
    expect(validate({ type: 'number', rules: [{ type: 'negative' }] }, -0).valid).toBe(false)
  })

  test('min rule accepts equal value (>=)', () => {
    expect(validate({ type: 'number', rules: [{ type: 'min', value: 5 }] }, 5).valid).toBe(true)
  })

  test('max rule accepts equal value (<=)', () => {
    expect(validate({ type: 'number', rules: [{ type: 'max', value: 5 }] }, 5).valid).toBe(true)
  })
})

describe('Edge values — strings', () => {
  test('unicode string length counts code units', () => {
    const r = validate({ type: 'string', rules: [{ type: 'minLength', value: 3 }] }, 'café')
    expect(r.valid).toBe(true)
  })

  test('emoji string (surrogate pair) length matches JS length semantics', () => {
    // '😀' === length 2 (surrogate pair)
    const r = validate({ type: 'string', rules: [{ type: 'minLength', value: 2 }] }, '😀')
    expect(r.valid).toBe(true)
  })

  test('whitespace-only string fails notEmpty', () => {
    expect(validate({ type: 'string', rules: [{ type: 'notEmpty' }] }, '\t\n  ').valid).toBe(false)
  })

  test('email accepts plus addressing', () => {
    expect(validate({ type: 'string', rules: [{ type: 'email' }] }, 'user+tag@example.com').valid).toBe(true)
  })

  test('email accepts subdomain', () => {
    expect(validate({ type: 'string', rules: [{ type: 'email' }] }, 'user@mail.example.co.uk').valid).toBe(true)
  })

  test('email rejects missing TLD', () => {
    expect(validate({ type: 'string', rules: [{ type: 'email' }] }, 'user@localhost').valid).toBe(false)
  })

  test('url accepts URL with port', () => {
    expect(validate({ type: 'string', rules: [{ type: 'url' }] }, 'https://example.com:8443/path').valid).toBe(true)
  })

  test('url rejects javascript: scheme', () => {
    expect(validate({ type: 'string', rules: [{ type: 'url' }] }, 'javascript:alert(1)').valid).toBe(false)
  })
})

describe('Edge values — deeply nested schemas (5 levels)', () => {
  const deepSchema = {
    type: 'object',
    shape: {
      l1: {
        type: 'object',
        shape: {
          l2: {
            type: 'object',
            shape: {
              l3: {
                type: 'object',
                shape: {
                  l4: {
                    type: 'object',
                    shape: {
                      l5: { type: 'string', rules: [{ type: 'minLength', value: 3 }] },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  }

  test('valid deeply nested object passes', () => {
    const r = validate(deepSchema, { l1: { l2: { l3: { l4: { l5: 'abc' } } } } })
    expect(r.valid).toBe(true)
  })

  test('deeply nested failure reports full dot-path', () => {
    const r = validate(deepSchema, { l1: { l2: { l3: { l4: { l5: 'a' } } } } })
    expect(r.valid).toBe(false)
    expect(r.errors[0].field).toBe('l1.l2.l3.l4.l5')
  })
})

describe('Edge values — large arrays', () => {
  test('10k-item array validates under 500ms', () => {
    const value = new Array(10000).fill('x')
    const start = Date.now()
    const r = validate(
      { type: 'array', items: { type: 'string' } },
      value
    )
    expect(r.valid).toBe(true)
    expect(Date.now() - start).toBeLessThan(500)
  })

  test('unique on 1k items detects single duplicate', () => {
    const value = []
    for (let i = 0; i < 1000; i++) value.push(`k${i}`)
    value[999] = 'k0' // inject duplicate
    const r = validate({ type: 'array', rules: [{ type: 'unique' }] }, value)
    expect(r.valid).toBe(false)
    expect(r.errors[0].code).toBe('unique')
  })
})

describe('Combinatorial — flags interact correctly', () => {
  test('nullable + optional + rules: null passes, undefined passes, value runs rules', () => {
    const schema = {
      type: 'string',
      nullable: true,
      optional: true,
      rules: [{ type: 'minLength', value: 5 }],
    }
    expect(validate(schema, null).valid).toBe(true)
    expect(validate(schema, undefined).valid).toBe(true)
    expect(validate(schema, 'long-string').valid).toBe(true)
    expect(validate(schema, 'hi').valid).toBe(false)
  })

  test('"any" type still runs explicit rules', () => {
    registerRule('mustBeFive', (v) => (v === 5 ? true : { code: 'mustBeFive', params: {} }))
    expect(validate({ type: 'any', rules: [{ type: 'mustBeFive' }] }, 5).valid).toBe(true)
    expect(validate({ type: 'any', rules: [{ type: 'mustBeFive' }] }, 'no').valid).toBe(false)
  })

  test('shape and requiredKeys run together on same object', () => {
    const schema = {
      type: 'object',
      rules: [{ type: 'requiredKeys', value: ['name', 'age'] }],
      shape: {
        name: { type: 'string', rules: [{ type: 'minLength', value: 2 }] },
        age: { type: 'number' },
      },
    }
    // Missing 'age' → requiredKeys fires AND shape-iteration produces required for age
    const r = validate(schema, { name: 'A' })
    expect(r.valid).toBe(false)
    const codes = r.errors.map((e) => e.code)
    expect(codes).toContain('requiredKeys')
  })

  test('multiple errors on the same field are all reported', () => {
    const r = validate(
      {
        type: 'string',
        rules: [
          { type: 'minLength', value: 10 },
          { type: 'email' },
          { type: 'pattern', value: '^XYZ' },
        ],
      },
      'abc'
    )
    expect(r.errors.length).toBeGreaterThanOrEqual(3)
  })
})

describe('Combinatorial — registry overrides', () => {
  test('registerRule can override a built-in rule', () => {
    registerRule('email', () => ({ code: 'email', params: {} })) // always fails
    const r = validate({ type: 'string', rules: [{ type: 'email' }] }, 'a@b.com')
    expect(r.valid).toBe(false)
  })

  test('registerAdapter can override "default"', () => {
    registerAdapter('default', { validate: () => [] })
    // Default-replacing adapter always reports clean
    const r = validate({ type: 'string', rules: [{ type: 'minLength', value: 100 }] }, 'x')
    expect(r.valid).toBe(true)
  })

  test('switching adapters mid-session works', () => {
    registerAdapter('always-fail', {
      validate: (s, v, o) => [{ field: o.field || '', code: 'custom', params: {} }],
    })
    setAdapter('always-fail')
    expect(validate({ type: 'string' }, 'x').valid).toBe(false)
    setAdapter('default')
    expect(validate({ type: 'string' }, 'x').valid).toBe(true)
  })
})

describe('State mutation — cache and definitions are isolated from caller mutations', () => {
  test('mutating definition after validate does not poison subsequent calls', () => {
    const def = { type: 'string', rules: [{ type: 'minLength', value: 5 }] }
    expect(validate(def, 'hello').valid).toBe(true)
    def.rules[0].value = 100 // mutate AFTER cache populated
    // New fingerprint → new schema entry; old cached schema still uses value:5
    expect(validate(def, 'hello').valid).toBe(false) // now must be >=100
    expect(validate({ type: 'string', rules: [{ type: 'minLength', value: 5 }] }, 'hello').valid).toBe(true)
  })

  test('_reset clears registry, adapters, locale, and cache', () => {
    registerRule('temp', () => ({ code: 'temp', params: {} }))
    registerAdapter('temp', { validate: () => [] })
    setAdapter('temp')

    _reset()

    // After reset: temp rule and adapter are gone; default is back
    const r = validate({ type: 'string', rules: [{ type: 'temp' }] }, 'x')
    // Unknown rule silently skipped, default adapter runs type checks → passes
    expect(r.valid).toBe(true)
  })
})

describe('i18n — robustness', () => {
  const { setLocale, registerLocale, translate } = require('../../src/i18n/index')

  test('placeholder kept literal when param missing', () => {
    const msg = translate('minLength', { min: 5 }) // missing actual
    expect(msg).toContain('5')
    expect(msg).toContain('{actual}')
  })

  test('unicode message survives interpolation', () => {
    registerLocale('jp', { required: 'このフィールドは必須です' })
    setLocale('jp')
    const r = validate({ type: 'string' }, null)
    expect(r.errors[0].message).toBe('このフィールドは必須です')
  })

  test('override built-in message, then reset restores default', () => {
    registerLocale('en', { required: 'CUSTOM' })
    expect(translate('required')).toBe('CUSTOM')
    _reset()
    expect(translate('required')).toMatch(/required/i)
  })
})

describe('Field paths — array and object combinations', () => {
  test('object → array → object reports correct nested path', () => {
    const schema = {
      type: 'object',
      shape: {
        users: {
          type: 'array',
          items: {
            type: 'object',
            shape: { email: { type: 'string', rules: [{ type: 'email' }] } },
          },
        },
      },
    }
    const r = validate(schema, { users: [{ email: 'ok@x.com' }, { email: 'bad' }] })
    expect(r.valid).toBe(false)
    expect(r.errors[0].field).toBe('users[1].email')
  })

  test('field option is prefix for object shape errors', () => {
    const schema = { type: 'object', shape: { name: { type: 'string', rules: [{ type: 'minLength', value: 5 }] } } }
    const r = validate(schema, { name: 'a' }, { field: 'payload' })
    expect(r.errors[0].field).toBe('payload.name')
  })
})
