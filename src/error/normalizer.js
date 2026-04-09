'use strict'

const { translate } = require('../i18n/index')

/**
 * Normalize a single raw error into the standard library error format.
 *
 * @param {{ field?: string, code?: string, params?: object, message?: string }} raw
 * @param {string} [locale] - Override locale for translation
 * @returns {{ field: string, code: string, params: object, message: string }}
 */
function normalizeError(raw, locale) {
  const field = raw.field != null ? String(raw.field) : ''
  const code = raw.code || 'custom'
  const params = raw.params && typeof raw.params === 'object' ? raw.params : {}
  // Allow per-error message override; otherwise translate
  const message = raw.message != null ? raw.message : translate(code, params, locale)
  return { field, code, params, message }
}

/**
 * Normalize an array of raw errors.
 *
 * @param {Array} rawList
 * @param {string} [locale]
 * @returns {Array<{ field: string, code: string, params: object, message: string }>}
 */
function normalizeErrors(rawList, locale) {
  if (!Array.isArray(rawList)) return []
  return rawList.map((raw) => normalizeError(raw, locale))
}

module.exports = { normalizeError, normalizeErrors }
