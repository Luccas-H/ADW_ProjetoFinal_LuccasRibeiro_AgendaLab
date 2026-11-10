const Joi = require('joi')
const { limparCpf, cpfValido } = require('../utils/cpf')

const nome = Joi.string()
  .trim()
  .min(3)
  .max(100)
  .pattern(/^[\p{L} '-]+$/u)
  .messages({ 'string.pattern.base': 'Use apenas letras' })

const usuario = Joi.string()
  .trim()
  .lowercase()
  .min(3)
  .max(20)
  .pattern(/^[a-z0-9._]+$/i)
  .messages({ 'string.pattern.base': 'Use apenas letras, números, ponto e sublinhado' })

const email = Joi.string().trim().lowercase().max(100).email()

const senha = Joi.string()
  .min(8)
  .max(64)
  .pattern(/[a-z]/i)
  .pattern(/\d/)
  .messages({ 'string.pattern.base': 'A senha precisa ter pelo menos uma letra e um número' })

const cpf = Joi.string()
  .custom((valor, helpers) => {
    const limpo = limparCpf(valor)
    return cpfValido(limpo) ? limpo : helpers.error('cpf.invalido')
  })
  .messages({ 'cpf.invalido': 'CPF inválido' })

const telefone = Joi.string()
  .custom((valor, helpers) => {
    const limpo = valor.replace(/\D/g, '')
    return /^\d{10,11}$/.test(limpo) ? limpo : helpers.error('telefone.invalido')
  })
  .messages({ 'telefone.invalido': 'Informe o DDD e o número' })

const cep = Joi.string()
  .custom((valor, helpers) => {
    const limpo = valor.replace(/\D/g, '')
    return /^\d{8}$/.test(limpo) ? limpo : helpers.error('cep.invalido')
  })
  .messages({ 'cep.invalido': 'CEP inválido' })

const objectId = Joi.string()
  .hex()
  .length(24)
  .messages({ 'string.hex': 'ID inválido', 'string.length': 'ID inválido' })

module.exports = { nome, usuario, email, senha, cpf, telefone, cep, objectId }
