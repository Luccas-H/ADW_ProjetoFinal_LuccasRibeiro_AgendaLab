const mongoose = require('mongoose')
const Usuario = require('../models/Usuario')
const Horario = require('../models/Horario')
const ErroHttp = require('../utils/ErroHttp')
const { escaparRegex } = require('../utils/regex')
const { validarDados } = require('../middlewares/validar')
const { dadosPacienteSchema, dadosEquipeSchema } = require('../validators/usuario')

async function buscarUsuario(id) {
  const usuario = await Usuario.findById(id)
  if (!usuario) {
    throw new ErroHttp(404, 'Usuário não encontrado')
  }
  return usuario
}

function meusDados(req, res) {
  res.json(req.usuario)
}

async function atualizarMeusDados(req, res) {
  req.usuario.set(req.body)
  await req.usuario.save()
  res.json(req.usuario)
}

async function listar(req, res) {
  const { perfil, busca } = req.filtros

  const filtro = {}
  if (perfil) filtro.perfil = perfil
  if (busca) filtro.nome = new RegExp(escaparRegex(busca), 'i')

  const usuarios = await Usuario.find(filtro)
    .select('nome usuario email perfil createdAt')
    .sort({ nome: 1 })
    .collation({ locale: 'pt' })
  res.json(usuarios)
}

async function buscarPorId(req, res) {
  res.json(await buscarUsuario(req.params.id))
}

async function criarRecepcionista(req, res) {
  const usuario = await Usuario.create({ ...req.body, perfil: 'recepcionista' })
  res.status(201).json(usuario)
}

async function atualizar(req, res) {
  const usuario = await buscarUsuario(req.params.id)

  // Paciente tem os campos do cadastro; recepcionista e admin só nome e e-mail
  const schema = usuario.perfil === 'paciente' ? dadosPacienteSchema : dadosEquipeSchema
  usuario.set(validarDados(schema, req.body))
  await usuario.save()

  res.json(usuario)
}

async function excluir(req, res) {
  if (req.params.id.toLowerCase() === String(req.usuario._id)) {
    throw new ErroHttp(409, 'Você não pode excluir a própria conta')
  }

  const usuario = await buscarUsuario(req.params.id)

  if (usuario.perfil === 'paciente') {
    await Horario.updateMany(
      { paciente: usuario._id, dataHora: mongoose.trusted({ $gt: new Date() }) },
      { paciente: null }
    )
  }

  await usuario.deleteOne()
  res.status(204).end()
}

module.exports = {
  meusDados,
  atualizarMeusDados,
  listar,
  buscarPorId,
  criarRecepcionista,
  atualizar,
  excluir
}
