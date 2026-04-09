'use strict'

/**
 * requiredKeys — object must contain all specified keys with non-null/undefined values.
 * @param {*} value
 * @param {{ value: string[] }} params - params.value is the array of required key names
 */
function requiredKeys(value, params) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return true
  const keys = Array.isArray(params.value)
    ? params.value
    : Array.isArray(params.keys)
    ? params.keys
    : []
  const missing = keys.filter(
    (k) => !(k in value) || value[k] === undefined || value[k] === null
  )
  if (missing.length > 0) {
    return { code: 'requiredKeys', params: { keys: missing.join(', ') } }
  }
  return true
}

module.exports = { requiredKeys }
