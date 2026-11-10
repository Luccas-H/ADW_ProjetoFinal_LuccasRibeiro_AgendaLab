const Joi = require('joi')
const campos = require('./campos')

const medicoSchema = Joi.object({
  // Aceita ponto para nomes como "Dra. Helena Prado"
  nome: Joi.string()
    .trim()
    .min(3)
    .max(100)
    .pattern(/^[\p{L} .'-]+$/u)
    .required()
    .messages({ 'string.pattern.base': 'Use apenas letras' }),
  crm: Joi.string()
    .trim()
    .uppercase()
    .max(20)
    .pattern(/^[0-9A-Z/-]+$/i)
    .required()
    .messages({ 'string.pattern.base': 'Use apenas números, letras, / e -' }),
  especialidade: campos.objectId.required()
})

const filtroMedicosSchema = Joi.object({
  especialidade: campos.objectId
})

module.exports = { medicoSchema, filtroMedicosSchema }
