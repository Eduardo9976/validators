'use strict'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const URL_RE = /^(https?:\/\/)([\w-]+(\.[\w-]+)+)(:\d+)?(\/[\w\-.~:/?#[\]@!$&'()*+,;=%]*)?$/i

/**
 * minLength — string must have at least `params.value` characters.
 */
function minLength(value, params) {
  if (typeof value !== 'string') return true
  const min = params.value != null ? params.value : params.min
  if (value.length < min) {
    return { code: 'minLength', params: { min, actual: value.length } }
  }
  return true
}

/**
 * maxLength — string must have at most `params.value` characters.
 */
function maxLength(value, params) {
  if (typeof value !== 'string') return true
  const max = params.value != null ? params.value : params.max
  if (value.length > max) {
    return { code: 'maxLength', params: { max, actual: value.length } }
  }
  return true
}

/**
 * pattern — string must match the given RegExp or pattern string.
 */
function pattern(value, params) {
  if (typeof value !== 'string') return true
  const re =
    params.value instanceof RegExp
      ? params.value
      : new RegExp(params.value)
  if (!re.test(value)) {
    return { code: 'pattern', params: { pattern: String(params.value) } }
  }
  return true
}

/**
 * email — string must be a valid e-mail address.
 */
function email(value) {
  if (typeof value !== 'string') return true
  if (!EMAIL_RE.test(value)) {
    return { code: 'email', params: {} }
  }
  return true
}

/**
 * url — string must be a valid HTTP/HTTPS URL.
 */
function url(value) {
  if (typeof value !== 'string') return true
  if (!URL_RE.test(value)) {
    return { code: 'url', params: {} }
  }
  return true
}

/**
 * notEmpty — string must not be blank (trimmed length > 0).
 */
function notEmpty(value) {
  if (typeof value !== 'string') return true
  if (value.trim().length === 0) {
    return { code: 'notEmpty', params: {} }
  }
  return true
}

module.exports = { minLength, maxLength, pattern, email, url, notEmpty }
