const Joi = require('joi')

const especialidadeSchema = Joi.object({
  nome: Joi.string().trim().min(3).max(60).required(),
  descricao: Joi.string().trim().max(300).allow('')
})

module.exports = { especialidadeSchema }
