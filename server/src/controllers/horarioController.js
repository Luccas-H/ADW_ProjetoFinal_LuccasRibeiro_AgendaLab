const mongoose = require('mongoose')
const Horario = require('../models/Horario')
const Medico = require('../models/Medico')
const Usuario = require('../models/Usuario')
const Notificacao = require('../models/Notificacao')
const ErroHttp = require('../utils/ErroHttp')
const { formatarDiaHora } = require('../utils/datas')
const { escaparRegex } = require('../utils/regex')
const {
  notificarConsultaMarcada,
  notificarHorariosMudaram,
  notificarUsuario
} = require('../socket')

const UM_DIA = 24 * 60 * 60 * 1000

// Avisa o paciente (sino) quando a recepção ou o admin mexe na consulta dele.
// Se foi o próprio paciente, não precisa avisar.
async function avisarPaciente(req, pacienteId, mensagem) {
  if (req.usuario.perfil === 'paciente') return
  const notificacao = await Notificacao.create({ usuario: pacienteId, mensagem })
  notificarUsuario(pacienteId, notificacao)
}

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

// Busca da recepção. Filtros (pode combinar): texto, convênio e médico.
// Texto: nome (ou parte), telefone (ou parte) ou CPF completo. CPF pela metade não é aceito,
// para ninguém descobrir pacientes.
async function buscarConsultas(req, res) {
  const { q, convenio, medico } = req.filtros
  const filtroHorario = { paciente: mongoose.trusted({ $ne: null }) }

  if (medico) {
    filtroHorario.medico = medico
  }

  if (q || convenio) {
    const filtroPaciente = { perfil: 'paciente' }
    if (convenio) filtroPaciente.convenio = convenio

    if (q && /^[\d.\-\s()]+$/.test(q)) {
      const digitos = q.replace(/\D/g, '')
      if (digitos.length < 4) {
        throw new ErroHttp(400, 'Digite pelo menos 4 números do telefone ou o CPF completo')
      }
      // 11 números pode ser CPF ou celular
      filtroPaciente.$or =
        digitos.length === 11
          ? [{ cpf: digitos }, { telefone: new RegExp(digitos) }]
          : [{ telefone: new RegExp(digitos) }]
    } else if (q) {
      filtroPaciente.nome = new RegExp(escaparRegex(q), 'i')
    }

    const pacientes = await Usuario.find(mongoose.trusted(filtroPaciente)).select('_id').limit(200)
    filtroHorario.paciente = mongoose.trusted({ $in: pacientes.map((paciente) => paciente._id) })
  }

  res.json(await buscarHorarios(filtroHorario, req.usuario))
}

// Troca a consulta de horário. Primeiro reserva o novo horário (numa operação só,
// para dois remarcando juntos não pegarem o mesmo) e só depois libera o antigo.
async function remarcar(req, res) {
  const origem = await buscarHorario(req.params.id)
  const agora = new Date()

  if (!origem.paciente) {
    throw new ErroHttp(409, 'Esse horário não tem consulta marcada')
  }
  if (origem.dataHora <= agora) {
    throw new ErroHttp(409, 'Não é possível remarcar uma consulta que já passou')
  }

  const destino = await Horario.findById(req.body.novoHorarioId)
  if (!destino) {
    throw new ErroHttp(404, 'Novo horário não encontrado')
  }
  if (destino._id.equals(origem._id)) {
    throw new ErroHttp(400, 'Escolha um horário diferente do atual')
  }
  if (!destino.especialidade.equals(origem.especialidade)) {
    throw new ErroHttp(400, 'O novo horário precisa ser da mesma especialidade')
  }

  const conflito = await Horario.findOne({
    paciente: origem.paciente,
    dataHora: destino.dataHora,
    _id: mongoose.trusted({ $ne: origem._id })
  })
    .populate('paciente', 'nome')
    .populate('medico', 'nome')
    .populate('especialidade', 'nome')
  if (conflito) {
    throw new ErroHttp(
      409,
      `${conflito.paciente.nome} já tem uma consulta de ${conflito.especialidade.nome} com ` +
        `${conflito.medico.nome} nesse mesmo horário (${formatarDiaHora(conflito.dataHora)}).`
    )
  }

  const reservado = await Horario.findOneAndUpdate(
    { _id: destino._id, paciente: null, dataHora: mongoose.trusted({ $gt: agora }) },
    { paciente: origem.paciente },
    { returnDocument: 'after' }
  )
  if (!reservado) {
    throw new ErroHttp(409, 'Esse horário não está mais disponível. Escolha outro.')
  }

  await Horario.updateOne({ _id: origem._id, paciente: origem.paciente }, { paciente: null })
  notificarHorariosMudaram(origem.especialidade)

  const [resposta] = await buscarHorarios({ _id: reservado._id }, req.usuario)
  const medicoAntigo = await Medico.findById(origem.medico).select('nome')
  await avisarPaciente(
    req,
    origem.paciente,
    `Sua consulta de ${resposta.especialidade.nome} com ${medicoAntigo.nome} em ` +
      `${formatarDiaHora(origem.dataHora)} foi remarcada para ${formatarDiaHora(reservado.dataHora)} ` +
      `com ${resposta.medico.nome}.`
  )

  res.json(resposta)
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

  notificarHorariosMudaram(horario.especialidade)
  res.status(201).json(horario)
}

async function excluir(req, res) {
  const horario = await buscarHorario(req.params.id)

  if (horario.paciente) {
    throw new ErroHttp(409, 'Desmarque a consulta antes de excluir o horário')
  }

  await horario.deleteOne()

  notificarHorariosMudaram(horario.especialidade)
  res.status(204).end()
}

// O paciente sempre marca para si mesmo. A equipe precisa dizer para qual paciente.
async function escolherPaciente(req) {
  if (req.usuario.perfil === 'paciente') {
    return req.usuario
  }

  if (!req.body.pacienteId) {
    throw new ErroHttp(400, 'Dados inválidos', { pacienteId: 'Escolha o paciente' })
  }

  const paciente = await Usuario.findOne({ _id: req.body.pacienteId, perfil: 'paciente' })
  if (!paciente) {
    throw new ErroHttp(400, 'Paciente não encontrado')
  }
  return paciente
}

async function agendar(req, res) {
  const paciente = await escolherPaciente(req)
  const horario = await buscarHorario(req.params.id)
  const agora = new Date()

  // As mensagens dizem qual consulta já existe, para quem está marcando saber o que fazer
  const quem = req.usuario.perfil === 'paciente' ? 'Você' : paciente.nome

  // A regra da especialidade vem primeiro, porque é a que tem a ver com o que está sendo marcado
  const naEspecialidade = await Horario.findOne({
    paciente: paciente._id,
    especialidade: horario.especialidade,
    dataHora: mongoose.trusted({ $gt: agora })
  })
    .populate('medico', 'nome')
    .populate('especialidade', 'nome')
  if (naEspecialidade) {
    throw new ErroHttp(
      409,
      `${quem} já tem uma consulta de ${naEspecialidade.especialidade.nome} marcada com ` +
        `${naEspecialidade.medico.nome} em ${formatarDiaHora(naEspecialidade.dataHora)}. ` +
        'Para trocar, desmarque essa consulta primeiro.'
    )
  }

  const noMesmoHorario = await Horario.findOne({ paciente: paciente._id, dataHora: horario.dataHora })
    .populate('medico', 'nome')
    .populate('especialidade', 'nome')
  if (noMesmoHorario) {
    throw new ErroHttp(
      409,
      `${quem} já tem uma consulta de ${noMesmoHorario.especialidade.nome} com ` +
        `${noMesmoHorario.medico.nome} nesse mesmo horário (${formatarDiaHora(noMesmoHorario.dataHora)}).`
    )
  }

  // Só marca se o horário ainda estiver livre e no futuro, numa operação só.
  // Assim dois pacientes clicando juntos não ficam com o mesmo horário.
  const marcado = await Horario.findOneAndUpdate(
    { _id: horario._id, paciente: null, dataHora: mongoose.trusted({ $gt: agora }) },
    { paciente: paciente._id },
    { returnDocument: 'after' }
  )
  if (!marcado) {
    throw new ErroHttp(409, 'Esse horário não está mais disponível')
  }

  const [resposta] = await buscarHorarios({ _id: marcado._id }, req.usuario)

  notificarConsultaMarcada({
    paciente: paciente.nome,
    especialidade: resposta.especialidade.nome,
    medico: resposta.medico.nome,
    dataHora: resposta.dataHora
  })
  notificarHorariosMudaram(marcado.especialidade)
  await avisarPaciente(
    req,
    paciente._id,
    `A recepção marcou uma consulta de ${resposta.especialidade.nome} para você com ` +
      `${resposta.medico.nome} em ${formatarDiaHora(marcado.dataHora)}.`
  )

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

  const pacienteId = horario.paciente
  horario.paciente = null
  await horario.save()
  notificarHorariosMudaram(horario.especialidade)

  const [resposta] = await buscarHorarios({ _id: horario._id }, req.usuario)
  await avisarPaciente(
    req,
    pacienteId,
    `Sua consulta de ${resposta.especialidade.nome} com ${resposta.medico.nome} em ` +
      `${formatarDiaHora(horario.dataHora)} foi desmarcada pela recepção.`
  )

  res.json(resposta)
}

module.exports = {
  listar,
  meus,
  buscarConsultas,
  criar,
  excluir,
  agendar,
  cancelar,
  remarcar,
  buscarHorarios
}
