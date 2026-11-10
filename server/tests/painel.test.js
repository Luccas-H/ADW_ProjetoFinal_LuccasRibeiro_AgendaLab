const request = require('supertest')
const ajuda = require('./ajuda')
const app = require('../src/app')

const { criarUsuario, tokenPara, criarMedico, criarHorario, amanha } = ajuda

beforeAll(ajuda.iniciarBanco)
afterEach(ajuda.limparBanco)
afterAll(ajuda.pararBanco)

// Os testes rodam com TZ=America/Boa_Vista (definido em ajuda.js)
function hojeAs(hora, minuto = 0) {
  const data = new Date()
  data.setHours(hora, minuto, 0, 0)
  return data
}

function painel(usuario) {
  return request(app).get('/api/painel').set('Authorization', `Bearer ${tokenPara(usuario)}`)
}

test('conta consultas de hoje, livres dos próximos 7 dias e pacientes', async () => {
  const medico = await criarMedico()
  const pacienteA = await criarUsuario()
  const pacienteB = await criarUsuario()
  const recepcionista = await criarUsuario('recepcionista')

  await criarHorario(medico, hojeAs(0, 30), pacienteA)
  await criarHorario(medico, amanha(9))
  await criarHorario(medico, amanha(10))
  await criarHorario(medico, amanha(11), pacienteB)
  const daquiDezDias = amanha(9)
  daquiDezDias.setDate(daquiDezDias.getDate() + 9)
  await criarHorario(medico, daquiDezDias)

  const res = await painel(recepcionista)

  expect(res.status).toBe(200)
  expect(res.body.consultasHoje).toBe(1)
  expect(res.body.livresProximos7Dias).toBe(2)
  expect(res.body.pacientes).toBe(2)
  expect(res.body.hoje).toHaveLength(1)
  expect(res.body.hoje[0].paciente.nome).toBe(pacienteA.nome)
  expect(res.body.hoje[0].medico.nome).toBe(medico.nome)
  expect(res.body.hoje[0].especialidade.nome).toBe('Cardiologia')
})

test('consulta de hoje às 23:30 em Boa Vista conta como hoje', async () => {
  const medico = await criarMedico()
  const paciente = await criarUsuario()
  await criarHorario(medico, hojeAs(23, 30), paciente)
  await criarHorario(medico, amanha(0, 30), await criarUsuario())

  const res = await painel(await criarUsuario('admin'))

  expect(res.body.consultasHoje).toBe(1)
  expect(res.body.hoje[0].paciente.nome).toBe(paciente.nome)
})

test('paciente não vê o painel (403)', async () => {
  const res = await painel(await criarUsuario())

  expect(res.status).toBe(403)
})
