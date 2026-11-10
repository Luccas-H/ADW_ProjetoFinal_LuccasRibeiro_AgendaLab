const request = require('supertest')
const ajuda = require('./ajuda')
const app = require('../src/app')
const Horario = require('../src/models/Horario')

const { criarUsuario, tokenPara, criarMedico, criarHorario, amanha } = ajuda

beforeAll(ajuda.iniciarBanco)
afterEach(ajuda.limparBanco)
afterAll(ajuda.pararBanco)

const ONTEM = () => new Date(Date.now() - 24 * 60 * 60 * 1000)

function agendar(horario, usuario, corpo = {}) {
  return request(app)
    .patch(`/api/horarios/${horario._id}/agendar`)
    .set('Authorization', `Bearer ${tokenPara(usuario)}`)
    .send(corpo)
}

function cancelar(horario, usuario) {
  return request(app)
    .patch(`/api/horarios/${horario._id}/cancelar`)
    .set('Authorization', `Bearer ${tokenPara(usuario)}`)
}

async function pacienteDoHorario(horario) {
  const atual = await Horario.findById(horario._id)
  return atual.paciente ? String(atual.paciente) : null
}

test('paciente marca horário livre', async () => {
  const horario = await criarHorario(await criarMedico())
  const paciente = await criarUsuario()

  const res = await agendar(horario, paciente)

  expect(res.status).toBe(200)
  expect(res.body.livre).toBe(false)
  expect(res.body.meu).toBe(true)
  expect(await pacienteDoHorario(horario)).toBe(String(paciente._id))
})

test('horário ocupado dá 409', async () => {
  const horario = await criarHorario(await criarMedico(), amanha(), await criarUsuario())

  const res = await agendar(horario, await criarUsuario())

  expect(res.status).toBe(409)
  expect(res.body.erro).toBe('Esse horário não está mais disponível')
})

test('horário que já passou dá 409', async () => {
  const horario = await criarHorario(await criarMedico(), ONTEM())

  const res = await agendar(horario, await criarUsuario())

  expect(res.status).toBe(409)
  expect(res.body.erro).toBe('Esse horário não está mais disponível')
})

test('pacienteId enviado por paciente é ignorado', async () => {
  const horario = await criarHorario(await criarMedico())
  const pacienteA = await criarUsuario()
  const pacienteB = await criarUsuario()

  const res = await agendar(horario, pacienteA, { pacienteId: String(pacienteB._id) })

  expect(res.status).toBe(200)
  expect(await pacienteDoHorario(horario)).toBe(String(pacienteA._id))
})

test('recepcionista marca para um paciente', async () => {
  const horario = await criarHorario(await criarMedico())
  const paciente = await criarUsuario()
  const recepcionista = await criarUsuario('recepcionista')

  const res = await agendar(horario, recepcionista, { pacienteId: String(paciente._id) })

  expect(res.status).toBe(200)
  expect(res.body.paciente.nome).toBe(paciente.nome)
  expect(await pacienteDoHorario(horario)).toBe(String(paciente._id))
})

test('recepcionista sem pacienteId dá 400', async () => {
  const horario = await criarHorario(await criarMedico())

  const res = await agendar(horario, await criarUsuario('recepcionista'))

  expect(res.status).toBe(400)
  expect(res.body.campos.pacienteId).toBe('Escolha o paciente')
})

test('pacienteId de uma recepcionista dá 400', async () => {
  const horario = await criarHorario(await criarMedico())
  const outraRecepcionista = await criarUsuario('recepcionista')

  const res = await agendar(horario, await criarUsuario('recepcionista'), {
    pacienteId: String(outraRecepcionista._id)
  })

  expect(res.status).toBe(400)
  expect(res.body.erro).toBe('Paciente não encontrado')
})

test('não marca duas consultas na mesma especialidade', async () => {
  const medico = await criarMedico('Cardiologia')
  const primeiro = await criarHorario(medico, amanha(9))
  const segundo = await criarHorario(medico, amanha(10))
  const paciente = await criarUsuario()
  await agendar(primeiro, paciente)

  const res = await agendar(segundo, paciente)

  expect(res.status).toBe(409)
  expect(res.body.erro).toBe('O paciente já tem uma consulta marcada nessa especialidade')
})

test('não marca dois horários no mesmo dia e hora', async () => {
  const cardiologia = await criarHorario(await criarMedico('Cardiologia'), amanha(9))
  const pediatria = await criarHorario(await criarMedico('Pediatria'), amanha(9))
  const paciente = await criarUsuario()
  await agendar(cardiologia, paciente)

  const res = await agendar(pediatria, paciente)

  expect(res.status).toBe(409)
  expect(res.body.erro).toBe('O paciente já tem uma consulta nesse horário')
})

test('dois pacientes ao mesmo tempo: só um consegue', async () => {
  const horario = await criarHorario(await criarMedico())
  const pacienteA = await criarUsuario()
  const pacienteB = await criarUsuario()

  const [r1, r2] = await Promise.all([agendar(horario, pacienteA), agendar(horario, pacienteB)])

  expect([r1.status, r2.status].sort()).toEqual([200, 409])
})

test('paciente desmarca a própria consulta e o horário volta a ficar livre', async () => {
  const paciente = await criarUsuario()
  const horario = await criarHorario(await criarMedico(), amanha(), paciente)

  const res = await cancelar(horario, paciente)

  expect(res.status).toBe(200)
  expect(res.body.livre).toBe(true)
  expect(await pacienteDoHorario(horario)).toBeNull()
})

test('paciente não desmarca consulta de outro (403)', async () => {
  const horario = await criarHorario(await criarMedico(), amanha(), await criarUsuario())

  const res = await cancelar(horario, await criarUsuario())

  expect(res.status).toBe(403)
})

test('recepcionista desmarca qualquer consulta', async () => {
  const horario = await criarHorario(await criarMedico(), amanha(), await criarUsuario())

  const res = await cancelar(horario, await criarUsuario('recepcionista'))

  expect(res.status).toBe(200)
  expect(await pacienteDoHorario(horario)).toBeNull()
})

test('não desmarca consulta que já passou', async () => {
  const paciente = await criarUsuario()
  const horario = await criarHorario(await criarMedico(), ONTEM(), paciente)

  const res = await cancelar(horario, paciente)

  expect(res.status).toBe(409)
  expect(res.body.erro).toBe('Não é possível desmarcar uma consulta que já passou')
})

test('desmarcar horário livre dá 409', async () => {
  const horario = await criarHorario(await criarMedico())

  const res = await cancelar(horario, await criarUsuario('recepcionista'))

  expect(res.status).toBe(409)
  expect(res.body.erro).toBe('Esse horário não tem consulta marcada')
})

test('GET /horarios/meus devolve só as consultas do paciente', async () => {
  const medico = await criarMedico()
  const pacienteA = await criarUsuario()
  const pacienteB = await criarUsuario()
  await criarHorario(medico, amanha(9), pacienteA)
  await criarHorario(medico, amanha(10), pacienteB)

  const res = await request(app)
    .get('/api/horarios/meus')
    .set('Authorization', `Bearer ${tokenPara(pacienteA)}`)

  expect(res.status).toBe(200)
  expect(res.body).toHaveLength(1)
  expect(res.body[0].meu).toBe(true)
})

test('sem token dá 401', async () => {
  const horario = await criarHorario(await criarMedico())

  const res = await request(app).patch(`/api/horarios/${horario._id}/agendar`)

  expect(res.status).toBe(401)
})
