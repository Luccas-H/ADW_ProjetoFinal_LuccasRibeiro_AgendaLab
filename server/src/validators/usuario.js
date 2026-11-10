const Joi = require('joi')
const campos = require('./campos')
const { TIPOS_SANGUINEOS, CONVENIOS, ESTADOS } = require('./listas')

const hoje = new Date()
const idadeMaxima = new Date(hoje.getFullYear() - 130, hoje.getMonth(), hoje.getDate())

const endereco = Joi.object({
  cep: campos.cep.required(),
  rua: Joi.string().trim().max(100).required(),
  numero: Joi.string().trim().max(10).required(),
  complemento: Joi.string().trim().max(60).allow(''),
  bairro: Joi.string().trim().max(100).required(),
  cidade: Joi.string().trim().max(60).required(),
  estado: Joi.string().valid(...ESTADOS).required()
})

const dadosPaciente = {
  nome: campos.nome.required(),
  email: campos.email.required(),
  dataNascimento: Joi.date()
    .max('now')
    .min(idadeMaxima)
    .required()
    .messages({ 'date.max': 'A data de nascimento não pode ser no futuro' }),
  telefone: campos.telefone.required(),
  tipoSanguineo: Joi.string().valid(...TIPOS_SANGUINEOS).required(),
  convenio: Joi.string().valid(...CONVENIOS).required(),
  filiacao: campos.nome.required(),
  endereco: endereco.required()
}

const dadosPacienteSchema = Joi.object(dadosPaciente)

const cadastroSchema = Joi.object({
  ...dadosPaciente,
  usuario: campos.usuario.required(),
  senha: campos.senha.required(),
  cpf: campos.cpf.required()
})

const loginSchema = Joi.object({
  usuario: Joi.string().trim().lowercase().max(20).required(),
  senha: Joi.string().max(64).required()
})

const recepcionistaSchema = Joi.object({
  nome: campos.nome.required(),
  usuario: campos.usuario.required(),
  email: campos.email.required(),
  senha: campos.senha.required()
})

const dadosEquipeSchema = Joi.object({
  nome: campos.nome.required(),
  email: campos.email.required()
})

const filtroUsuariosSchema = Joi.object({
  perfil: Joi.string().valid('paciente', 'recepcionista', 'admin'),
  busca: Joi.string().trim().max(60).allow('')
})

const buscaPacienteSchema = Joi.object({
  q: Joi.string().trim().min(2).max(60).required()
})

module.exports = {
  dadosPacienteSchema,
  cadastroSchema,
  loginSchema,
  recepcionistaSchema,
  dadosEquipeSchema,
  filtroUsuariosSchema,
  buscaPacienteSchema
}
