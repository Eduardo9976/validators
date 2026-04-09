'use strict'

const { buildSchema } = require('./schema-builder')
const { getAdapter, getActiveAdapterName } = require('./registry')
const { normalizeErrors } = require('../error/normalizer')
const { formatResult } = require('../error/format')
const { getLocale } = require('../i18n/index')
const defaultAdapter = require('../adapters/default')

/**
 * Validate a value against a schema definition.
 *
 * This is the single public entry point for all validations.
 * It NEVER throws — any internal error is surfaced as a validation failure.
 *
 * @param {object} definition - JSON-serialisable schema definition
 * @param {*}      value      - The value to validate
 * @param {object} [options]
 * @param {string} [options.locale]  - Override the active locale for this call
 * @param {string} [options.adapter] - Override the active adapter for this call
 * @param {string} [options.field]   - Root field name used in error paths
 *
 * @returns {{ valid: boolean, errors: Array<{ field, code, params, message }> }}
 */
function validate(definition, value, options) {
  const opts = options || {}
  try {
    const schema = buildSchema(definition)
    const locale = opts.locale || getLocale()
    const adapterName = opts.adapter || getActiveAdapterName()

    let rawErrors
    if (adapterName === 'default') {
      rawErrors = defaultAdapter.validate(schema, value, opts)
    } else {
      const adapter = getAdapter(adapterName)
      if (!adapter) {
        throw new Error(`[validators] Adapter "${adapterName}" is not registered`)
      }
      rawErrors = adapter.validate(schema, value, opts)
    }

    const normalized = normalizeErrors(rawErrors, locale)
    return formatResult(normalized)
  } catch (err) {
    // Surface internal errors as a safe, consistent result object
    return {
      valid: false,
      errors: [
        {
          field: opts.field || '',
          code: 'custom',
          params: {},
          message: (err && err.message) || 'An unexpected validation error occurred',
        },
      ],
    }
  }
}

module.exports = { validate }
