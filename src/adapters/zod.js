'use strict'

/**
 * Zod v4 Adapter
 *
 * Converts a schema definition → Zod schema, runs safeParse(), then maps
 * Zod issue objects back to the library's standard { field, code, params } format.
 *
 * Zod is an OPTIONAL peer dependency. If it is not installed, calling validate()
 * with this adapter will throw a clear error.
 */

let z = null
try {
  z = require('zod')
} catch (_) {
  // Zod not installed — fail gracefully at call time, not at require time
}

// ─────────────────────────────────────────────────────────────────────────────
// Schema builder
// ─────────────────────────────────────────────────────────────────────────────

function buildZodSchema(schema) {
  if (!z) throw new Error('[validators] Zod adapter requires "zod" to be installed (npm i zod)')

  let s

  switch (schema.type) {
    case 'string':
      s = z.string()
      for (const rule of schema.rules) s = applyStringRule(s, rule)
      for (const rule of schema.rules) s = applyCommonRule(s, rule)
      break

    case 'number':
      s = z.number()
      for (const rule of schema.rules) s = applyNumberRule(s, rule)
      for (const rule of schema.rules) s = applyCommonRule(s, rule)
      break

    case 'boolean':
      s = z.boolean()
      for (const rule of schema.rules) s = applyCommonRule(s, rule)
      break

    case 'array': {
      const itemSchema = schema.items ? buildZodSchema(schema.items) : z.unknown()
      s = z.array(itemSchema)
      for (const rule of schema.rules) s = applyArrayRule(s, rule)
      break
    }

    case 'object': {
      if (schema.shape) {
        const shape = {}
        for (const [key, fieldDef] of Object.entries(schema.shape)) {
          shape[key] = buildZodSchema(fieldDef)
        }
        s = z.object(shape)
      } else {
        s = z.object({}).passthrough()
      }
      break
    }

    default:
      s = z.unknown()
  }

  if (schema.nullable) s = s.nullable()
  if (schema.optional) s = s.optional()

  return s
}

function applyStringRule(s, rule) {
  switch (rule.type) {
    case 'minLength': return s.min(rule.value)
    case 'maxLength': return s.max(rule.value)
    case 'email':     return s.email()
    case 'url':       return s.url()
    case 'pattern':   return s.regex(rule.value instanceof RegExp ? rule.value : new RegExp(rule.value))
    case 'notEmpty':  return s.refine((v) => typeof v === 'string' && v.trim().length > 0, { params: { __code: 'notEmpty' } })
    default:          return s
  }
}

function applyCommonRule(s, rule) {
  switch (rule.type) {
    case 'oneOf': {
      const values = Array.isArray(rule.value) ? rule.value : Array.isArray(rule.values) ? rule.values : []
      return s.refine((v) => values.includes(v), { params: { __code: 'oneOf', values: values.join(', ') } })
    }
    case 'custom': {
      if (typeof rule.fn !== 'function') return s
      return s.refine(
        (v) => {
          const r = rule.fn(v, rule)
          return r === true || r === undefined || r === null
        },
        { params: { __code: 'custom' } }
      )
    }
    default: return s
  }
}

function applyNumberRule(s, rule) {
  switch (rule.type) {
    case 'min':      return s.gte(rule.value)
    case 'max':      return s.lte(rule.value)
    case 'integer':  return s.int()
    case 'positive': return s.gt(0)
    case 'negative': return s.lt(0)
    default:         return s
  }
}

function applyArrayRule(s, rule) {
  switch (rule.type) {
    case 'minItems': return s.min(rule.value)
    case 'maxItems': return s.max(rule.value)
    case 'noEmpty':  return s.min(1)
    default:         return s
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Zod issue → library error format
// ─────────────────────────────────────────────────────────────────────────────

function mapIssueCode(issue) {
  const origin = issue.origin
  switch (issue.code) {
    case 'too_small':
      if (origin === 'string') return 'minLength'
      if (origin === 'array')  return 'minItems'
      return 'min'
    case 'too_big':
      if (origin === 'string') return 'maxLength'
      if (origin === 'array')  return 'maxItems'
      return 'max'
    case 'invalid_type':
      return issue.received === 'undefined' ? 'required' : 'type'
    case 'invalid_format':
      if (issue.format === 'email') return 'email'
      if (issue.format === 'url')   return 'url'
      return 'pattern'
    case 'custom': {
      const code = issue.params && issue.params.__code
      return code || 'custom'
    }
    default:
      return 'custom'
  }
}

function actualSize(input) {
  if (typeof input === 'string') return input.length
  if (Array.isArray(input)) return input.length
  return input
}

function mapIssueParams(issue) {
  const inputLen = actualSize(issue.input)

  switch (issue.code) {
    case 'too_small':
      return { min: issue.minimum, actual: inputLen }
    case 'too_big':
      return { max: issue.maximum, actual: inputLen }
    case 'invalid_type':
      return { expected: issue.expected, actual: issue.received }
    case 'custom': {
      if (issue.params && issue.params.__code === 'oneOf') {
        return { values: issue.params.values }
      }
      return {}
    }
    default:
      return {}
  }
}

function joinPath(prefix, path) {
  if (path.length === 0) return prefix
  const joined = path.join('.')
  if (!prefix) return joined
  return `${prefix}.${joined}`
}

function normalizeZodErrors(zodError, field) {
  const prefix = field || ''
  return zodError.issues.map((issue) => ({
    field: joinPath(prefix, issue.path),
    code: mapIssueCode(issue),
    params: mapIssueParams(issue),
  }))
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API (matches adapter contract)
// ─────────────────────────────────────────────────────────────────────────────

function validate(schema, value, opts) {
  if (!z) throw new Error('[validators] Zod adapter requires "zod" to be installed (npm i zod)')
  const field = (opts && opts.field) || ''
  const zodSchema = buildZodSchema(schema)
  const result = zodSchema.safeParse(value)
  if (result.success) return []
  return normalizeZodErrors(result.error, field)
}

module.exports = { validate, buildZodSchema }
