const request = require('supertest')
const ajuda = require('./ajuda')
const app = require('../src/app')

const { criarUsuario, tokenPara, criarMedico, criarHorario, amanha } = ajuda

beforeAll(ajuda.iniciarBanco)
afterEach(ajuda.limparBanco)
afterAll(ajuda.pararBanco)

function autorizacao(usuario) {
  return { Authorization: `Bearer ${tokenPara(usuario)}` }
}

function agendar(horario, usuario, corpo = {}) {
  return request(app).patch(`/api/horarios/${horario._id}/agendar`).set(autorizacao(usuario)).send(corpo)
}

function cancelar(horario, usuario) {
  return request(app).patch(`/api/horarios/${horario._id}/cancelar`).set(autorizacao(usuario))
}

function avisosDe(usuario) {
  return request(app).get('/api/notificacoes').set(autorizacao(usuario))
}

// "11/11 às 09:00", como nas mensagens
function quando(data) {
  const dia = data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  const hora = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return `${dia} às ${hora}`
}

test('recepção marca para o paciente e ele recebe um aviso detalhado', async () => {
  const medico = await criarMedico('Cardiologia')
  const horario = await criarHorario(medico, amanha(9))
  const paciente = await criarUsuario()

  await agendar(horario, await criarUsuario('recepcionista'), { pacienteId: String(paciente._id) })
  const res = await avisosDe(paciente)

  expect(res.status).toBe(200)
  expect(res.body.naoLidas).toBe(1)
  expect(res.body.notificacoes[0].lida).toBe(false)
  expect(res.body.notificacoes[0].mensagem).toBe(
    `A recepção marcou uma consulta de Cardiologia para você com ${medico.nome} em ${quando(amanha(9))}.`
  )
})

test('recepção desmarca e o paciente é avisado', async () => {
  const medico = await criarMedico('Cardiologia')
  const paciente = await criarUsuario()
  const horario = await criarHorario(medico, amanha(9), paciente)

  await cancelar(horario, await criarUsuario('recepcionista'))
  const res = await avisosDe(paciente)

  expect(res.body.notificacoes[0].mensagem).toBe(
    `Sua consulta de Cardiologia com ${medico.nome} em ${quando(amanha(9))} foi desmarcada pela recepção.`
  )
})

test('recepção remarca e o aviso traz o horário antigo e o novo', async () => {
  const helena = await criarMedico('Cardiologia')
  const marcos = await criarMedico('Cardiologia')
  const paciente = await criarUsuario()
  const origem = await criarHorario(helena, amanha(9), paciente)
  const destino = await criarHorario(marcos, amanha(14))

  await request(app)
    .patch(`/api/horarios/${origem._id}/remarcar`)
    .set(autorizacao(await criarUsuario('recepcionista')))
    .send({ novoHorarioId: String(destino._id) })
  const res = await avisosDe(paciente)

  expect(res.body.notificacoes[0].mensagem).toBe(
    `Sua consulta de Cardiologia com ${helena.nome} em ${quando(amanha(9))} ` +
      `foi remarcada para ${quando(amanha(14))} com ${marcos.nome}.`
  )
})

test('quando o próprio paciente marca ou desmarca, não há aviso', async () => {
  const horario = await criarHorario(await criarMedico('Cardiologia'), amanha(9))
  const paciente = await criarUsuario()

  await agendar(horario, paciente)
  await cancelar(horario, paciente)
  const res = await avisosDe(paciente)

  expect(res.body.naoLidas).toBe(0)
  expect(res.body.notificacoes).toEqual([])
})

test('cada paciente vê só os próprios avisos', async () => {
  const horario = await criarHorario(await criarMedico('Cardiologia'), amanha(9))
  const pacienteA = await criarUsuario()
  const pacienteB = await criarUsuario()

  await agendar(horario, await criarUsuario('recepcionista'), { pacienteId: String(pacienteA._id) })
  const res = await avisosDe(pacienteB)

  expect(res.body.notificacoes).toEqual([])
})

test('marcar como lidas zera o contador', async () => {
  const horario = await criarHorario(await criarMedico('Cardiologia'), amanha(9))
  const paciente = await criarUsuario()
  await agendar(horario, await criarUsuario('recepcionista'), { pacienteId: String(paciente._id) })

  const marcar = await request(app).patch('/api/notificacoes/lidas').set(autorizacao(paciente))
  const res = await avisosDe(paciente)

  expect(marcar.status).toBe(204)
  expect(res.body.naoLidas).toBe(0)
  expect(res.body.notificacoes[0].lida).toBe(true)
})

test('recepção não tem área de avisos (403)', async () => {
  const res = await avisosDe(await criarUsuario('recepcionista'))

  expect(res.status).toBe(403)
})
