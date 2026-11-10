const mongoose = require('mongoose')
const Medico = require('../models/Medico')
const Especialidade = require('../models/Especialidade')
const Horario = require('../models/Horario')
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

  // Os horários guardam a especialidade do médico, então acompanham a troca
  await Horario.updateMany({ medico: medico._id }, { especialidade: medico.especialidade })

  res.json(medico)
}

async function excluir(req, res) {
  const temConsultaFutura = await Horario.exists({
    medico: req.params.id,
    paciente: mongoose.trusted({ $ne: null }),
    dataHora: mongoose.trusted({ $gt: new Date() })
  })
  if (temConsultaFutura) {
    throw new ErroHttp(409, 'Esse médico tem consultas futuras marcadas')
  }

  const medico = await Medico.findByIdAndDelete(req.params.id)
  if (!medico) {
    throw new ErroHttp(404, 'Médico não encontrado')
  }

  await Horario.deleteMany({ medico: medico._id })
  res.status(204).end()
}

module.exports = { listar, criar, atualizar, excluir }
