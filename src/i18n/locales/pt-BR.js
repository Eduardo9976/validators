'use strict'

module.exports = {
  // Comuns
  required: 'Este campo é obrigatório',
  type: 'Tipo esperado "{expected}", recebido "{actual}"',
  oneOf: 'O valor deve ser um dos seguintes: {values}',
  custom: 'Validação falhou',

  // String
  minLength: 'O comprimento mínimo é {min} caracteres, recebido {actual}',
  maxLength: 'O comprimento máximo é {max} caracteres, recebido {actual}',
  pattern: 'O valor não corresponde ao padrão exigido',
  email: 'Deve ser um endereço de e-mail válido',
  url: 'Deve ser uma URL válida',
  notEmpty: 'O valor não pode estar vazio',

  // Número
  min: 'O valor deve ser pelo menos {min}',
  max: 'O valor deve ser no máximo {max}',
  integer: 'O valor deve ser um número inteiro',
  positive: 'O valor deve ser um número positivo',
  negative: 'O valor deve ser um número negativo',

  // Array
  minItems: 'Mínimo de {min} itens necessários, recebidos {actual}',
  maxItems: 'Máximo de {max} itens permitidos, recebidos {actual}',
  noEmpty: 'O array não pode estar vazio',
  unique: 'Os itens do array devem ser únicos',

  // Objeto
  requiredKeys: 'Chaves obrigatórias ausentes: {keys}',
  shape: 'Falha na validação do objeto',
}
