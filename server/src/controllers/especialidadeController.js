const Especialidade = require('../models/Especialidade')
const Medico = require('../models/Medico')
const ErroHttp = require('../utils/ErroHttp')

async function listar(req, res) {
  const especialidades = await Especialidade.find().sort({ nome: 1 }).collation({ locale: 'pt' })
  res.json(especialidades)
}

async function criar(req, res) {
  const especialidade = await Especialidade.create(req.body)
  res.status(201).json(especialidade)
}

async function atualizar(req, res) {
  const especialidade = await Especialidade.findByIdAndUpdate(req.params.id, req.body, {
    returnDocument: 'after',
    runValidators: true
  })
  if (!especialidade) {
    throw new ErroHttp(404, 'Especialidade não encontrada')
  }
  res.json(especialidade)
}

async function excluir(req, res) {
  if (await Medico.exists({ especialidade: req.params.id })) {
    throw new ErroHttp(409, 'Essa especialidade ainda tem médicos')
  }

  const especialidade = await Especialidade.findByIdAndDelete(req.params.id)
  if (!especialidade) {
    throw new ErroHttp(404, 'Especialidade não encontrada')
  }
  res.status(204).end()
}

module.exports = { listar, criar, atualizar, excluir }
