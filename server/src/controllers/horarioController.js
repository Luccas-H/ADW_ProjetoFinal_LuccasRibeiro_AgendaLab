const mongoose = require('mongoose')
const Horario = require('../models/Horario')
const Medico = require('../models/Medico')
const Usuario = require('../models/Usuario')
const ErroHttp = require('../utils/ErroHttp')

const UM_DIA = 24 * 60 * 60 * 1000

// Paciente só sabe se o horário está livre e se é dele.
// A equipe vê também nome, telefone e convênio de quem marcou.
function formatarHorario(horario, usuario) {
  const resposta = {
    _id: horario._id,
    dataHora: horario.dataHora,
    medico: { _id: horario.medico._id, nome: horario.medico.nome },
    especialidade: { _id: horario.especialidade._id, nome: horario.especialidade.nome },
    livre: !horario.paciente
  }

  if (usuario.perfil === 'paciente') {
    resposta.meu = String(horario.paciente) === String(usuario._id)
  } else if (horario.paciente) {
    const { _id, nome, telefone, convenio } = horario.paciente
    resposta.paciente = { _id, nome, telefone, convenio }
  } else {
    resposta.paciente = null
  }

  return resposta
}

async function buscarHorarios(filtro, usuario) {
  let consulta = Horario.find(filtro)
    .sort({ dataHora: 1 })
    .populate('medico', 'nome')
    .populate('especialidade', 'nome')

  if (usuario.perfil !== 'paciente') {
    consulta = consulta.populate('paciente', 'nome telefone convenio')
  }

  const horarios = await consulta
  return horarios.map((horario) => formatarHorario(horario, usuario))
}

async function buscarHorario(id) {
  const horario = await Horario.findById(id)
  if (!horario) {
    throw new ErroHttp(404, 'Horário não encontrado')
  }
  return horario
}

async function listar(req, res) {
  const { especialidade, medico, inicio, fim } = req.filtros

  if (fim - inicio > 62 * UM_DIA) {
    throw new ErroHttp(400, 'O período máximo é de 62 dias')
  }

  const filtro = { dataHora: mongoose.trusted({ $gte: inicio, $lte: fim }) }
  if (especialidade) filtro.especialidade = especialidade
  if (medico) filtro.medico = medico

  res.json(await buscarHorarios(filtro, req.usuario))
}

async function meus(req, res) {
  res.json(await buscarHorarios({ paciente: req.usuario._id }, req.usuario))
}

async function criar(req, res) {
  const medico = await Medico.findById(req.body.medico)
  if (!medico) {
    throw new ErroHttp(404, 'Médico não encontrado')
  }

  const horario = await Horario.create({
    medico: medico._id,
    especialidade: medico.especialidade,
    dataHora: req.body.dataHora
  })
  res.status(201).json(horario)
}

async function excluir(req, res) {
  const horario = await buscarHorario(req.params.id)

  if (horario.paciente) {
    throw new ErroHttp(409, 'Desmarque a consulta antes de excluir o horário')
  }

  await horario.deleteOne()
  res.status(204).end()
}

// O paciente sempre marca para si mesmo. A equipe precisa dizer para qual paciente.
async function escolherPaciente(req) {
  if (req.usuario.perfil === 'paciente') {
    return req.usuario._id
  }

  if (!req.body.pacienteId) {
    throw new ErroHttp(400, 'Dados inválidos', { pacienteId: 'Escolha o paciente' })
  }

  const paciente = await Usuario.exists({ _id: req.body.pacienteId, perfil: 'paciente' })
  if (!paciente) {
    throw new ErroHttp(400, 'Paciente não encontrado')
  }
  return paciente._id
}

async function agendar(req, res) {
  const pacienteId = await escolherPaciente(req)
  const horario = await buscarHorario(req.params.id)
  const agora = new Date()

  if (await Horario.exists({ paciente: pacienteId, dataHora: horario.dataHora })) {
    throw new ErroHttp(409, 'O paciente já tem uma consulta nesse horário')
  }

  const temConsultaNaEspecialidade = await Horario.exists({
    paciente: pacienteId,
    especialidade: horario.especialidade,
    dataHora: mongoose.trusted({ $gt: agora })
  })
  if (temConsultaNaEspecialidade) {
    throw new ErroHttp(409, 'O paciente já tem uma consulta marcada nessa especialidade')
  }

  // Só marca se o horário ainda estiver livre e no futuro, numa operação só.
  // Assim dois pacientes clicando juntos não ficam com o mesmo horário.
  const marcado = await Horario.findOneAndUpdate(
    { _id: horario._id, paciente: null, dataHora: mongoose.trusted({ $gt: agora }) },
    { paciente: pacienteId },
    { returnDocument: 'after' }
  )
  if (!marcado) {
    throw new ErroHttp(409, 'Esse horário não está mais disponível')
  }

  const [resposta] = await buscarHorarios({ _id: marcado._id }, req.usuario)
  res.json(resposta)
}

async function cancelar(req, res) {
  const horario = await buscarHorario(req.params.id)

  if (!horario.paciente) {
    throw new ErroHttp(409, 'Esse horário não tem consulta marcada')
  }
  if (req.usuario.perfil === 'paciente' && !horario.paciente.equals(req.usuario._id)) {
    throw new ErroHttp(403, 'Acesso negado')
  }
  if (horario.dataHora <= new Date()) {
    throw new ErroHttp(409, 'Não é possível desmarcar uma consulta que já passou')
  }

  horario.paciente = null
  await horario.save()

  const [resposta] = await buscarHorarios({ _id: horario._id }, req.usuario)
  res.json(resposta)
}

module.exports = { listar, meus, criar, excluir, agendar, cancelar }
