'use strict'

const { buildSchema } = require('../core/schema-builder')

// Lazy lookup avoids the registry ↔ default-adapter circular import.
// Node caches the module after the first require, so cost is negligible.
function getRule(name) {
  return require('../core/registry').getRule(name)
}

/**
 * Recursively validate a value against a normalised schema using built-in rules.
 * Returns an array of raw error objects (not yet translated).
 *
 * @param {object} schema   - Output of buildSchema()
 * @param {*}      value    - Value under validation
 * @param {object} [opts]   - { field: string }
 * @returns {Array<{ field: string, code: string, params: object }>}
 */
function validate(schema, value, opts) {
  const field = (opts && opts.field) || ''
  const errors = []

  // ── null / undefined handling ──────────────────────────────────────────────
  if (value === null) {
    if (!schema.nullable) errors.push({ field, code: 'required', params: {} })
    return errors // nothing more to validate once null accepted/rejected
  }
  if (value === undefined) {
    if (!schema.optional) errors.push({ field, code: 'required', params: {} })
    return errors
  }

  // ── type check (skipped for "any") ─────────────────────────────────────────
  if (schema.type !== 'any') {
    const typeRule = getRule('type')
    if (typeRule) {
      const result = typeRule(value, { value: schema.type })
      if (result !== true) {
        errors.push(Object.assign({ field }, result))
        return errors // stop — further rules are meaningless on wrong type
      }
    }
  }

  // ── explicit rules list ────────────────────────────────────────────────────
  for (const ruleDef of schema.rules) {
    const ruleFn = getRule(ruleDef.type)
    if (!ruleFn) continue // unknown rule → skip silently (extensible)
    const result = ruleFn(value, ruleDef)
    if (result !== true) {
      errors.push(Object.assign({ field }, result))
    }
  }

  // ── object shape (recursive per-field validation) ─────────────────────────
  if (schema.type === 'object' && schema.shape && value !== null && typeof value === 'object') {
    for (const [key, fieldDef] of Object.entries(schema.shape)) {
      const fieldPath = field ? `${field}.${key}` : key
      const fieldSchema = buildSchema(fieldDef)
      const subErrors = validate(fieldSchema, value[key], { field: fieldPath })
      for (const e of subErrors) errors.push(e)
    }
  }

  // ── array items (recursive per-item validation) ───────────────────────────
  if (schema.type === 'array' && schema.items && Array.isArray(value)) {
    const itemSchema = buildSchema(schema.items)
    for (let i = 0; i < value.length; i++) {
      const itemPath = field ? `${field}[${i}]` : `[${i}]`
      const subErrors = validate(itemSchema, value[i], { field: itemPath })
      for (const e of subErrors) errors.push(e)
    }
  }

  return errors
}

module.exports = { validate }
