'use strict'

module.exports = {
  // Common
  required: 'This field is required',
  type: 'Expected type "{expected}", got "{actual}"',
  oneOf: 'Value must be one of: {values}',
  custom: 'Validation failed',

  // String
  minLength: 'Minimum length is {min} characters, got {actual}',
  maxLength: 'Maximum length is {max} characters, got {actual}',
  pattern: 'Value does not match the required pattern',
  email: 'Must be a valid email address',
  url: 'Must be a valid URL',
  notEmpty: 'Value cannot be empty',

  // Number
  min: 'Value must be at least {min}',
  max: 'Value must be at most {max}',
  integer: 'Value must be an integer',
  positive: 'Value must be a positive number',
  negative: 'Value must be a negative number',

  // Array
  minItems: 'Minimum {min} items required, got {actual}',
  maxItems: 'Maximum {max} items allowed, got {actual}',
  noEmpty: 'Array cannot be empty',
  unique: 'Array items must be unique',

  // Object
  requiredKeys: 'Missing required keys: {keys}',
  shape: 'Object validation failed',
}
