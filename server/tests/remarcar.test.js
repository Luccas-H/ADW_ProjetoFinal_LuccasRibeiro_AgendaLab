const request = require('supertest')
const ajuda = require('./ajuda')
const app = require('../src/app')
const Horario = require('../src/models/Horario')

const { criarUsuario, tokenPara, criarMedico, criarHorario, amanha } = ajuda

beforeAll(ajuda.iniciarBanco)
afterEach(ajuda.limparBanco)
afterAll(ajuda.pararBanco)

function remarcar(origem, destino, usuario) {
  return request(app)
    .patch(`/api/horarios/${origem._id}/remarcar`)
    .set('Authorization', `Bearer ${tokenPara(usuario)}`)
    .send({ novoHorarioId: String(destino._id) })
}

async function pacienteDe(horario) {
  const atual = await Horario.findById(horario._id)
  return atual.paciente ? String(atual.paciente) : null
}

test('recepcionista remarca para outro médico da mesma especialidade', async () => {
  const helena = await criarMedico('Cardiologia')
  const marcos = await criarMedico('Cardiologia')
  const paciente = await criarUsuario()
  const origem = await criarHorario(helena, amanha(9), paciente)
  const destino = await criarHorario(marcos, amanha(14))

  const res = await remarcar(origem, destino, await criarUsuario('recepcionista'))

  expect(res.status).toBe(200)
  expect(res.body._id).toBe(String(destino._id))
  expect(res.body.medico.nome).toBe(marcos.nome)
  expect(await pacienteDe(destino)).toBe(String(paciente._id))
  expect(await pacienteDe(origem)).toBeNull()
})

test('horário de destino ocupado dá 409 e a consulta continua onde estava', async () => {
  const medico = await criarMedico('Cardiologia')
  const paciente = await criarUsuario()
  const origem = await criarHorario(medico, amanha(9), paciente)
  const ocupado = await criarHorario(medico, amanha(10), await criarUsuario())

  const res = await remarcar(origem, ocupado, await criarUsuario('recepcionista'))

  expect(res.status).toBe(409)
  expect(res.body.erro).toBe('Esse horário não está mais disponível. Escolha outro.')
  expect(await pacienteDe(origem)).toBe(String(paciente._id))
})

test('não remarca para outra especialidade', async () => {
  const paciente = await criarUsuario()
  const origem = await criarHorario(await criarMedico('Cardiologia'), amanha(9), paciente)
  const pediatria = await criarHorario(await criarMedico('Pediatria'), amanha(10))

  const res = await remarcar(origem, pediatria, await criarUsuario('recepcionista'))

  expect(res.status).toBe(400)
  expect(res.body.erro).toBe('O novo horário precisa ser da mesma especialidade')
})

test('não remarca para o mesmo horário', async () => {
  const paciente = await criarUsuario()
  const origem = await criarHorario(await criarMedico('Cardiologia'), amanha(9), paciente)

  const res = await remarcar(origem, origem, await criarUsuario('recepcionista'))

  expect(res.status).toBe(400)
  expect(res.body.erro).toBe('Escolha um horário diferente do atual')
})

test('não remarca consulta que já passou nem horário sem consulta', async () => {
  const medico = await criarMedico('Cardiologia')
  const ontem = amanha(9)
  ontem.setDate(ontem.getDate() - 2)
  const passada = await criarHorario(medico, ontem, await criarUsuario())
  const livre = await criarHorario(medico, amanha(9))
  const destino = await criarHorario(medico, amanha(10))
  const recepcionista = await criarUsuario('recepcionista')

  const resPassada = await remarcar(passada, destino, recepcionista)
  const resLivre = await remarcar(livre, destino, recepcionista)

  expect(resPassada.status).toBe(409)
  expect(resPassada.body.erro).toBe('Não é possível remarcar uma consulta que já passou')
  expect(resLivre.status).toBe(409)
  expect(resLivre.body.erro).toBe('Esse horário não tem consulta marcada')
})

test('não remarca para um horário em que o paciente já tem outra consulta', async () => {
  const cardiologista = await criarMedico('Cardiologia')
  const clinico = await criarMedico('Clínica Geral')
  const paciente = await criarUsuario()
  const origem = await criarHorario(cardiologista, amanha(9), paciente)
  await criarHorario(clinico, amanha(14), paciente)
  const destino = await criarHorario(cardiologista, amanha(14))

  const res = await remarcar(origem, destino, await criarUsuario('recepcionista'))

  expect(res.status).toBe(409)
  expect(res.body.erro).toContain('já tem uma consulta de Clínica Geral')
  expect(await pacienteDe(origem)).toBe(String(paciente._id))
})

test('dois remarcando para o mesmo horário ao mesmo tempo: só um consegue', async () => {
  const medico = await criarMedico('Cardiologia')
  const origemA = await criarHorario(medico, amanha(9), await criarUsuario())
  const origemB = await criarHorario(medico, amanha(10), await criarUsuario())
  const destino = await criarHorario(medico, amanha(15))
  const recepcionista = await criarUsuario('recepcionista')

  const [r1, r2] = await Promise.all([
    remarcar(origemA, destino, recepcionista),
    remarcar(origemB, destino, recepcionista)
  ])

  expect([r1.status, r2.status].sort()).toEqual([200, 409])
})

test('paciente não remarca (403)', async () => {
  const medico = await criarMedico('Cardiologia')
  const paciente = await criarUsuario()
  const origem = await criarHorario(medico, amanha(9), paciente)
  const destino = await criarHorario(medico, amanha(10))

  const res = await remarcar(origem, destino, paciente)

  expect(res.status).toBe(403)
})
