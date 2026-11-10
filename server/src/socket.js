const { Server } = require('socket.io')
const jwt = require('jsonwebtoken')
const Usuario = require('./models/Usuario')

let io = null

function iniciarSocket(servidorHttp) {
  io = new Server(servidorHttp, {
    cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173' }
  })

  // Só aceita a conexão de quem manda um token válido, como nas rotas da API
  io.use(async (socket, next) => {
    try {
      const dados = jwt.verify(socket.handshake.auth.token, process.env.JWT_SECRET, {
        algorithms: ['HS256']
      })
      const usuario = await Usuario.findById(dados.id)
      if (!usuario) {
        throw new Error('Usuário não existe mais')
      }
      socket.data.perfil = usuario.perfil
      next()
    } catch {
      next(new Error('Não autorizado'))
    }
  })

  io.on('connection', (socket) => {
    if (['recepcionista', 'admin'].includes(socket.data.perfil)) {
      socket.join('equipe')
    }
  })

  return io
}

// Aviso para a recepção e o admin. Leva só nomes e data, nunca CPF.
function notificarConsultaMarcada({ paciente, especialidade, medico, dataHora }) {
  if (io) {
    io.to('equipe').emit('consulta:marcada', { paciente, especialidade, medico, dataHora })
  }
}

// Avisa todo mundo conectado para recarregar os horários daquela especialidade
function notificarHorariosMudaram(especialidadeId) {
  if (io) {
    io.emit('horarios:mudou', { especialidade: String(especialidadeId) })
  }
}

module.exports = { iniciarSocket, notificarConsultaMarcada, notificarHorariosMudaram }
