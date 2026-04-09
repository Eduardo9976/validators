'use strict'

/**
 * min — number must be >= params.value.
 */
function min(value, params) {
  if (typeof value !== 'number') return true
  const minVal = params.value != null ? params.value : params.min
  if (value < minVal) {
    return { code: 'min', params: { min: minVal } }
  }
  return true
}

/**
 * max — number must be <= params.value.
 */
function max(value, params) {
  if (typeof value !== 'number') return true
  const maxVal = params.value != null ? params.value : params.max
  if (value > maxVal) {
    return { code: 'max', params: { max: maxVal } }
  }
  return true
}

/**
 * integer — number must be a whole number (no decimals).
 */
function integer(value) {
  if (typeof value !== 'number') return true
  if (!Number.isInteger(value)) {
    return { code: 'integer', params: {} }
  }
  return true
}

/**
 * positive — number must be strictly greater than zero.
 */
function positive(value) {
  if (typeof value !== 'number') return true
  if (value <= 0) {
    return { code: 'positive', params: {} }
  }
  return true
}

/**
 * negative — number must be strictly less than zero.
 */
function negative(value) {
  if (typeof value !== 'number') return true
  if (value >= 0) {
    return { code: 'negative', params: {} }
  }
  return true
}

module.exports = { min, max, integer, positive, negative }
