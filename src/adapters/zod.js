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
      break

    case 'number':
      s = z.number()
      for (const rule of schema.rules) s = applyNumberRule(s, rule)
      break

    case 'boolean':
      s = z.boolean()
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
    default:          return s
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
  // Zod v4 uses `origin`, v3 used `type`
  const origin = issue.origin || issue.type
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
    // Zod v3 string code
    case 'invalid_string':
      if (issue.validation === 'email') return 'email'
      if (issue.validation === 'url')   return 'url'
      if (issue.validation === 'regex') return 'pattern'
      return 'pattern'
    // Zod v4 string code
    case 'invalid_format':
      if (issue.format === 'email') return 'email'
      if (issue.format === 'url')   return 'url'
      if (issue.format === 'regex') return 'pattern'
      return 'pattern'
    default:
      return 'custom'
  }
}

function mapIssueParams(issue) {
  const inputLen =
    typeof issue.input === 'string'
      ? issue.input.length
      : Array.isArray(issue.input)
      ? issue.input.length
      : issue.input

  switch (issue.code) {
    case 'too_small':
      // Zod v4 uses `minimum`, v3 also uses `minimum`
      return { min: issue.minimum != null ? issue.minimum : (issue.min != null ? issue.min : undefined), actual: inputLen }
    case 'too_big':
      return { max: issue.maximum != null ? issue.maximum : (issue.max != null ? issue.max : undefined), actual: inputLen }
    case 'invalid_type':
      return { expected: issue.expected, actual: issue.received }
    default:
      return {}
  }
}

function normalizeZodErrors(zodError, field) {
  const prefix = field || ''
  return zodError.issues.map((issue) => {
    const path =
      issue.path.length > 0
        ? prefix
          ? `${prefix}.${issue.path.join('.')}`
          : issue.path.join('.')
        : prefix
    return { field: path, code: mapIssueCode(issue), params: mapIssueParams(issue) }
  })
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
