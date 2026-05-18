'use strict'

const stringRules = require('../rules/string')
const numberRules = require('../rules/number')
const arrayRules = require('../rules/array')
const objectRules = require('../rules/object')
const commonRules = require('../rules/common')
const defaultAdapter = require('../adapters/default')

const _rules = new Map()
const _adapters = new Map()
let _activeAdapter = 'default'

function _initBuiltinRules() {
  const builtins = Object.assign(
    {},
    commonRules,
    stringRules,
    numberRules,
    arrayRules,
    objectRules
  )
  for (const [name, fn] of Object.entries(builtins)) {
    _rules.set(name, fn)
  }
}

function _initBuiltinAdapters() {
  _adapters.set('default', defaultAdapter)
}

_initBuiltinRules()
_initBuiltinAdapters()

/**
 * Register a custom validation rule.
 * @param {string} name - Unique rule identifier
 * @param {Function} fn - (value, params) => true | { code, params }
 */
function registerRule(name, fn) {
  if (typeof name !== 'string' || !name) {
    throw new Error('[validators] registerRule: "name" must be a non-empty string')
  }
  if (typeof fn !== 'function') {
    throw new Error('[validators] registerRule: "fn" must be a function')
  }
  _rules.set(name, fn)
}

/**
 * Register a validation adapter.
 * @param {string} name
 * @param {{ validate(schema, value, options): Array }} adapter
 */
function registerAdapter(name, adapter) {
  if (typeof name !== 'string' || !name) {
    throw new Error('[validators] registerAdapter: "name" must be a non-empty string')
  }
  if (!adapter || typeof adapter.validate !== 'function') {
    throw new Error('[validators] registerAdapter: adapter must expose a validate() function')
  }
  _adapters.set(name, adapter)
}

/**
 * Set which adapter is used by default for all validate() calls.
 * @param {string} name - Must match a previously registered adapter
 */
function setAdapter(name) {
  if (!_adapters.has(name)) {
    throw new Error(`[validators] setAdapter: adapter "${name}" is not registered`)
  }
  _activeAdapter = name
}

/** @returns {string} */
function getActiveAdapterName() {
  return _activeAdapter
}

/** @param {string} name @returns {object|null} */
function getAdapter(name) {
  return _adapters.get(name) || null
}

/** @param {string} name @returns {Function|null} */
function getRule(name) {
  return _rules.get(name) || null
}

/** @param {string} name @returns {boolean} */
function hasRule(name) {
  return _rules.has(name)
}

/** @returns {string[]} */
function getRuleNames() {
  return Array.from(_rules.keys())
}

/** Reset all state to built-in defaults (useful between tests). */
function _reset() {
  _rules.clear()
  _adapters.clear()
  _activeAdapter = 'default'
  _initBuiltinRules()
  _initBuiltinAdapters()
}

module.exports = {
  registerRule,
  registerAdapter,
  setAdapter,
  getActiveAdapterName,
  getAdapter,
  getRule,
  hasRule,
  getRuleNames,
  _reset,
}
