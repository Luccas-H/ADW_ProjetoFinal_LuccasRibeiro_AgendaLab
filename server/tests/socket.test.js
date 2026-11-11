const http = require('http')
const request = require('supertest')
const { io: criarCliente } = require('socket.io-client')
const ajuda = require('./ajuda')
const app = require('../src/app')
const { iniciarSocket } = require('../src/socket')

const { criarUsuario, tokenPara, criarMedico, criarHorario, amanha } = ajuda

let servidor
let ioServidor
let url
const clientes = []

beforeAll(async () => {
  await ajuda.iniciarBanco()
  servidor = http.createServer(app)
  ioServidor = iniciarSocket(servidor)
  await new Promise((resolve) => servidor.listen(0, resolve))
  url = `http://localhost:${servidor.address().port}`
})

afterEach(async () => {
  clientes.forEach((cliente) => cliente.disconnect())
  clientes.length = 0
  await ajuda.limparBanco()
})

afterAll(async () => {
  await new Promise((resolve) => ioServidor.close(resolve))
  await ajuda.pararBanco()
})

function conectar(usuario) {
  const cliente = criarCliente(url, {
    auth: usuario ? { token: tokenPara(usuario) } : {},
    transports: ['websocket'],
    forceNew: true
  })
  clientes.push(cliente)
  return cliente
}

function esperar(cliente, evento) {
  return new Promise((resolve) => cliente.once(evento, resolve))
}

// O cliente pode já ter conectado enquanto o teste fazia outro await
function conectado(cliente) {
  return cliente.connected ? Promise.resolve() : esperar(cliente, 'connect')
}

test('recusa conexão sem token', async () => {
  const cliente = conectar(null)

  const erro = await esperar(cliente, 'connect_error')

  expect(erro.message).toBe('Não autorizado')
})

test('só recepcionista e admin entram na sala da equipe', async () => {
  const paciente = conectar(await criarUsuario())
  const recepcionista = conectar(await criarUsuario('recepcionista'))
  await Promise.all([conectado(paciente), conectado(recepcionista)])

  const naSala = await ioServidor.in('equipe').fetchSockets()

  expect(naSala).toHaveLength(1)
})

test('equipe recebe aviso quando paciente marca consulta', async () => {
  const medico = await criarMedico()
  const horario = await criarHorario(medico, amanha(9))
  const paciente = await criarUsuario()
  const recepcionista = conectar(await criarUsuario('recepcionista'))
  await conectado(recepcionista)

  const aviso = esperar(recepcionista, 'consulta:marcada')
  await request(servidor)
    .patch(`/api/horarios/${horario._id}/agendar`)
    .set('Authorization', `Bearer ${tokenPara(paciente)}`)
  const dados = await aviso

  expect(dados.paciente).toBe(paciente.nome)
  expect(dados.especialidade).toBe('Cardiologia')
  expect(dados.medico).toBe(medico.nome)
  expect(new Date(dados.dataHora).getTime()).toBe(horario.dataHora.getTime())
})

test('paciente recebe o aviso na hora quando a recepção marca para ele', async () => {
  const horario = await criarHorario(await criarMedico(), amanha(9))
  const pacienteUsuario = await criarUsuario()
  const paciente = conectar(pacienteUsuario)
  await conectado(paciente)

  const aviso = esperar(paciente, 'notificacao:nova')
  await request(servidor)
    .patch(`/api/horarios/${horario._id}/agendar`)
    .set('Authorization', `Bearer ${tokenPara(await criarUsuario('recepcionista'))}`)
    .send({ pacienteId: String(pacienteUsuario._id) })
  const dados = await aviso

  expect(dados.mensagem).toContain('A recepção marcou uma consulta de Cardiologia para você')
  expect(dados.lida).toBe(false)
})

test('todos recebem horarios:mudou quando a recepcionista desmarca', async () => {
  const medico = await criarMedico()
  const pacienteUsuario = await criarUsuario()
  const horario = await criarHorario(medico, amanha(9), pacienteUsuario)
  const paciente = conectar(pacienteUsuario)
  await conectado(paciente)

  const mudou = esperar(paciente, 'horarios:mudou')
  await request(servidor)
    .patch(`/api/horarios/${horario._id}/cancelar`)
    .set('Authorization', `Bearer ${tokenPara(await criarUsuario('recepcionista'))}`)
  const dados = await mudou

  expect(dados).toEqual({ especialidade: String(medico.especialidade) })
})
