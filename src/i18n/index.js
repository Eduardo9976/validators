'use strict'

const { getLocaleMessages, registerLocale, hasLocale, _resetLocales } = require('./register')

let _currentLocale = 'en'

/** @param {string} locale */
function setLocale(locale) {
  if (typeof locale !== 'string' || !locale) {
    throw new Error('[validators] setLocale: "locale" must be a non-empty string')
  }
  _currentLocale = locale
}

/** @returns {string} */
function getLocale() {
  return _currentLocale
}

/**
 * Translate an error code to a human-readable message.
 * Fallback chain: requested locale → "en" → raw code
 *
 * @param {string} code      - Error code, e.g. "minLength"
 * @param {object} [params]  - Interpolation params, e.g. { min: 5, actual: 3 }
 * @param {string} [locale]  - Override locale for this call
 * @returns {string}
 */
function translate(code, params, locale) {
  const target = locale || _currentLocale
  const messages =
    getLocaleMessages(target) || getLocaleMessages('en') || {}

  const template = messages[code]
  if (!template) return code

  if (!params || typeof params !== 'object') return template

  return template.replace(/\{(\w+)\}/g, (_match, key) => {
    const val = params[key]
    return val !== undefined ? String(val) : `{${key}}`
  })
}

/** Reset global state (used in tests). */
function _reset() {
  _currentLocale = 'en'
  _resetLocales()
}

module.exports = { setLocale, getLocale, translate, registerLocale, hasLocale, _reset }
