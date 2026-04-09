'use strict'

/**
 * minItems — array must have at least `params.value` elements.
 */
function minItems(value, params) {
  if (!Array.isArray(value)) return true
  const min = params.value != null ? params.value : params.min
  if (value.length < min) {
    return { code: 'minItems', params: { min, actual: value.length } }
  }
  return true
}

/**
 * maxItems — array must have at most `params.value` elements.
 */
function maxItems(value, params) {
  if (!Array.isArray(value)) return true
  const max = params.value != null ? params.value : params.max
  if (value.length > max) {
    return { code: 'maxItems', params: { max, actual: value.length } }
  }
  return true
}

/**
 * noEmpty — array must have at least one element.
 */
function noEmpty(value) {
  if (!Array.isArray(value)) return true
  if (value.length === 0) {
    return { code: 'noEmpty', params: {} }
  }
  return true
}

/**
 * unique — all array elements must be distinct (deep equality via JSON).
 */
function unique(value) {
  if (!Array.isArray(value)) return true
  const seen = new Set()
  for (const item of value) {
    const key = JSON.stringify(item)
    if (seen.has(key)) {
      return { code: 'unique', params: {} }
    }
    seen.add(key)
  }
  return true
}

module.exports = { minItems, maxItems, noEmpty, unique }
