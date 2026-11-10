const Joi = require('joi')
const campos = require('./campos')

const criarHorarioSchema = Joi.object({
  medico: campos.objectId.required(),
  dataHora: Joi.date()
    .greater('now')
    .required()
    .messages({ 'date.greater': 'Não é possível abrir horário no passado' })
})

const filtroHorariosSchema = Joi.object({
  especialidade: campos.objectId,
  medico: campos.objectId,
  inicio: Joi.date().required(),
  fim: Joi.date()
    .greater(Joi.ref('inicio'))
    .required()
    .messages({ 'date.greater': 'A data final precisa ser depois da inicial' })
})

const agendarSchema = Joi.object({
  pacienteId: campos.objectId
})

module.exports = { criarHorarioSchema, filtroHorariosSchema, agendarSchema }
