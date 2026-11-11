const Joi = require('joi')
const campos = require('./campos')
const { CONVENIOS } = require('./listas')

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

const remarcarSchema = Joi.object({
  novoHorarioId: campos.objectId.required()
})

// Pelo menos um filtro: texto (nome, telefone ou CPF), convênio ou médico
const buscaConsultasSchema = Joi.object({
  q: Joi.string().trim().min(2).max(60),
  convenio: Joi.string().valid(...CONVENIOS),
  medico: campos.objectId
})
  .or('q', 'convenio', 'medico')
  .messages({ 'object.missing': 'Digite um nome, telefone ou CPF, ou escolha um convênio ou médico' })

module.exports = {
  criarHorarioSchema,
  filtroHorariosSchema,
  agendarSchema,
  remarcarSchema,
  buscaConsultasSchema
}
