'use strict'

/**
 * validators — public API
 *
 * import/require only what you need:
 *
 *   const { validate } = require('validators')
 *   const { validate, setLocale, registerLocale } = require('validators')
 */

const { validate } = require('./core/validator')
const {
  registerRule,
  registerAdapter,
  setAdapter,
  getActiveAdapterName,
  getRuleNames,
  _reset: _resetRegistry,
} = require('./core/registry')
const { buildSchema, clearCache } = require('./core/schema-builder')
const {
  setLocale,
  getLocale,
  translate,
  registerLocale,
  hasLocale,
  _reset: _resetI18n,
} = require('./i18n/index')

/** Full reset for testing — resets registry, i18n state and schema cache. */
function _reset() {
  _resetRegistry()
  _resetI18n()
  clearCache()
}

module.exports = {
  // Core
  validate,

  // Registry
  registerRule,
  registerAdapter,
  setAdapter,
  getActiveAdapterName,
  getRuleNames,

  // Schema
  buildSchema,
  clearCache,

  // i18n
  setLocale,
  getLocale,
  translate,
  registerLocale,
  hasLocale,

  // Testing utilities
  _reset,
}
