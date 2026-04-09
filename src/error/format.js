'use strict'

/**
 * Build the final validation result object.
 *
 * @param {Array} errors - Already normalized error objects
 * @returns {{ valid: boolean, errors: Array }}
 */
function formatResult(errors) {
  if (!Array.isArray(errors) || errors.length === 0) {
    return { valid: true, errors: [] }
  }
  return { valid: false, errors }
}

module.exports = { formatResult }
