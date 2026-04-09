'use strict'

const VALID_TYPES = ['string', 'number', 'boolean', 'array', 'object', 'any']
const _cache = new Map()

/**
 * Produce a stable cache key for a plain-object definition.
 * Returns null if the definition contains non-serialisable values (functions, RegExp, etc.).
 */
function _cacheKey(definition) {
  try {
    return JSON.stringify(definition)
  } catch (_) {
    return null
  }
}

/**
 * Validate and normalise a raw schema definition into the internal schema shape.
 * Results are cached by JSON fingerprint so repeated calls with the same
 * definition object are effectively free.
 *
 * @param {object} definition
 * @returns {{
 *   type: string,
 *   rules: Array,
 *   nullable: boolean,
 *   optional: boolean,
 *   label: string|null,
 *   shape: object|null,
 *   items: object|null
 * }}
 */
function buildSchema(definition) {
  if (!definition || typeof definition !== 'object' || Array.isArray(definition)) {
    throw new Error('[validators] buildSchema: definition must be a plain object')
  }

  const key = _cacheKey(definition)
  if (key && _cache.has(key)) {
    return _cache.get(key)
  }

  const type = definition.type || 'any'
  if (!VALID_TYPES.includes(type)) {
    throw new Error(
      `[validators] buildSchema: invalid type "${type}". Valid: ${VALID_TYPES.join(', ')}`
    )
  }

  const rules = Array.isArray(definition.rules) ? definition.rules : []
  for (const rule of rules) {
    if (!rule || typeof rule !== 'object' || typeof rule.type !== 'string') {
      throw new Error(
        '[validators] buildSchema: every rule must be an object with a "type" string property'
      )
    }
  }

  const schema = {
    type,
    rules,
    nullable: definition.nullable === true,
    optional: definition.optional === true,
    label: definition.label || null,
    shape: definition.shape && typeof definition.shape === 'object' ? definition.shape : null,
    items: definition.items && typeof definition.items === 'object' ? definition.items : null,
  }

  if (key) _cache.set(key, schema)
  return schema
}

/** Clear the internal schema cache (useful in tests or after hot-reloading schemas). */
function clearCache() {
  _cache.clear()
}

module.exports = { buildSchema, clearCache }
