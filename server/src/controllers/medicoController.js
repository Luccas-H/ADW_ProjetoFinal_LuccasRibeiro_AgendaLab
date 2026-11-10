const Medico = require('../models/Medico')
const Especialidade = require('../models/Especialidade')
const ErroHttp = require('../utils/ErroHttp')

async function verificarEspecialidade(id) {
  if (!(await Especialidade.exists({ _id: id }))) {
    throw new ErroHttp(404, 'Especialidade não encontrada')
  }
}

async function listar(req, res) {
  const filtro = {}
  if (req.filtros.especialidade) {
    filtro.especialidade = req.filtros.especialidade
  }

  const medicos = await Medico.find(filtro)
    .populate('especialidade', 'nome')
    .sort({ nome: 1 })
    .collation({ locale: 'pt' })
  res.json(medicos)
}

async function criar(req, res) {
  await verificarEspecialidade(req.body.especialidade)
  const medico = await Medico.create(req.body)
  res.status(201).json(medico)
}

async function atualizar(req, res) {
  await verificarEspecialidade(req.body.especialidade)

  const medico = await Medico.findByIdAndUpdate(req.params.id, req.body, {
    returnDocument: 'after',
    runValidators: true
  })
  if (!medico) {
    throw new ErroHttp(404, 'Médico não encontrado')
  }
  res.json(medico)
}

async function excluir(req, res) {
  const medico = await Medico.findByIdAndDelete(req.params.id)
  if (!medico) {
    throw new ErroHttp(404, 'Médico não encontrado')
  }
  res.status(204).end()
}

module.exports = { listar, criar, atualizar, excluir }
