'use strict'

const VALID_TYPES = ['string', 'number', 'boolean', 'array', 'object', 'any']
const _cache = new Map()
const _CACHE_MAX = 1000 // bound cache to prevent unbounded growth with dynamic schemas

/**
 * Walk a value and reject anything JSON.stringify would silently lose or coerce
 * (functions, RegExp, Date, Symbol, BigInt, undefined). Without this guard, two
 * semantically different schemas (e.g. different RegExps) would collide on a
 * lossy fingerprint and serve a wrong cached schema.
 */
function _isCacheable(v) {
  if (v === null) return true
  const t = typeof v
  if (t === 'undefined' || t === 'function' || t === 'symbol' || t === 'bigint') return false
  if (t !== 'object') return true
  if (v instanceof RegExp || v instanceof Date) return false
  if (Array.isArray(v)) {
    for (const item of v) if (!_isCacheable(item)) return false
    return true
  }
  for (const k of Object.keys(v)) if (!_isCacheable(v[k])) return false
  return true
}

/**
 * Produce a stable cache key for a plain-object definition.
 * Returns null when the definition holds non-JSON-pure values — those entries
 * bypass the cache entirely, guaranteeing correctness over speed.
 */
function _cacheKey(definition) {
  if (!_isCacheable(definition)) return null
  try {
    return JSON.stringify(definition)
  } catch (_) {
    return null // circular refs etc.
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

  if (key) {
    // Deep-clone before caching so subsequent mutation of the caller's
    // definition cannot poison the cached schema. The _isCacheable guard
    // above ensures every value is JSON-round-trippable.
    const cached = JSON.parse(JSON.stringify(schema))
    if (_cache.size >= _CACHE_MAX) {
      // FIFO eviction: drop oldest entry (Maps preserve insertion order)
      const oldest = _cache.keys().next().value
      if (oldest !== undefined) _cache.delete(oldest)
    }
    _cache.set(key, cached)
    return cached
  }
  return schema
}

/** Clear the internal schema cache (useful in tests or after hot-reloading schemas). */
function clearCache() {
  _cache.clear()
}

module.exports = { buildSchema, clearCache }
