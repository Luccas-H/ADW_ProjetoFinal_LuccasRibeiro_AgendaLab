const mongoose = require('mongoose')
const Horario = require('../models/Horario')
const Usuario = require('../models/Usuario')
const { buscarHorarios } = require('./horarioController')

const UM_DIA = 24 * 60 * 60 * 1000

// "Hoje" usa o fuso do servidor (TZ=America/Boa_Vista)
async function resumo(req, res) {
  const agora = new Date()
  const inicioHoje = new Date(agora)
  inicioHoje.setHours(0, 0, 0, 0)
  const inicioAmanha = new Date(inicioHoje)
  inicioAmanha.setDate(inicioAmanha.getDate() + 1)
  const daquiSeteDias = new Date(agora.getTime() + 7 * UM_DIA)

  const consultasDeHoje = {
    paciente: mongoose.trusted({ $ne: null }),
    dataHora: mongoose.trusted({ $gte: inicioHoje, $lt: inicioAmanha })
  }

  const [consultasHoje, livresProximos7Dias, pacientes, hoje] = await Promise.all([
    Horario.countDocuments(consultasDeHoje),
    Horario.countDocuments({
      paciente: null,
      dataHora: mongoose.trusted({ $gt: agora, $lte: daquiSeteDias })
    }),
    Usuario.countDocuments({ perfil: 'paciente' }),
    buscarHorarios(consultasDeHoje, req.usuario)
  ])

  res.json({ consultasHoje, livresProximos7Dias, pacientes, hoje })
}

module.exports = { resumo }
