'use strict'

const _locales = new Map()

// Load built-in locales eagerly
_locales.set('en', require('./locales/en'))
_locales.set('pt-BR', require('./locales/pt-BR'))

/**
 * Register (or merge into) a locale at runtime.
 * @param {string} locale  - BCP-47 locale string, e.g. "en", "pt-BR", "fr"
 * @param {object} messages - Map of code → message template
 */
function registerLocale(locale, messages) {
  if (typeof locale !== 'string' || !locale) {
    throw new Error('[validators] registerLocale: "locale" must be a non-empty string')
  }
  if (!messages || typeof messages !== 'object' || Array.isArray(messages)) {
    throw new Error('[validators] registerLocale: "messages" must be a plain object')
  }
  const existing = _locales.get(locale) || {}
  _locales.set(locale, Object.assign({}, existing, messages))
}

/** @param {string} locale */
function getLocaleMessages(locale) {
  return _locales.get(locale) || null
}

/** @param {string} locale */
function hasLocale(locale) {
  return _locales.has(locale)
}

/** Reset to built-in locales only (used in tests). */
function _resetLocales() {
  _locales.clear()
  _locales.set('en', require('./locales/en'))
  _locales.set('pt-BR', require('./locales/pt-BR'))
}

module.exports = { registerLocale, getLocaleMessages, hasLocale, _resetLocales }
