'use strict'

const TYPE_CHECKERS = {
  string: (v) => typeof v === 'string',
  number: (v) => typeof v === 'number' && !isNaN(v),
  boolean: (v) => typeof v === 'boolean',
  array: (v) => Array.isArray(v),
  object: (v) => v !== null && typeof v === 'object' && !Array.isArray(v),
  function: (v) => typeof v === 'function',
}

/**
 * required — value must not be null, undefined or empty string.
 * @param {*} value
 * @returns {true|{code,params}}
 */
function required(value) {
  if (value === null || value === undefined || value === '') {
    return { code: 'required', params: {} }
  }
  return true
}

/**
 * type — value must match the expected JS type.
 * @param {*} value
 * @param {{ value: string }} params - params.value is the expected type name
 */
function type(value, params) {
  const expected = params.value || params.expected
  if (!expected) return true
  const checker = TYPE_CHECKERS[expected]
  if (!checker) return true // unknown type → skip
  if (!checker(value)) {
    const actual = Array.isArray(value) ? 'array' : typeof value
    return { code: 'type', params: { expected, actual } }
  }
  return true
}

/**
 * oneOf — value must be one of the listed values (strict equality).
 * @param {*} value
 * @param {{ value: Array }} params
 */
function oneOf(value, params) {
  const values = Array.isArray(params.value)
    ? params.value
    : Array.isArray(params.values)
    ? params.values
    : []
  if (!values.includes(value)) {
    return { code: 'oneOf', params: { values: values.join(', ') } }
  }
  return true
}

/**
 * custom — inline validation function provided in the rule definition.
 * params.fn(value, params) must return:
 *   true / undefined → pass
 *   false            → fail with generic code
 *   string           → fail with that string as message
 *   { code, params } → fail with explicit error
 *
 * @param {*} value
 * @param {{ fn: Function, errorParams?: object }} params
 */
function custom(value, params) {
  if (typeof params.fn !== 'function') return true
  const result = params.fn(value, params)
  if (result === true || result === undefined || result === null) return true
  if (result === false) return { code: 'custom', params: params.errorParams || {} }
  if (typeof result === 'string') return { code: 'custom', params: {}, message: result }
  return result
}

module.exports = { required, type, oneOf, custom }
