const request = require('supertest')
const ajuda = require('./ajuda')
const app = require('../src/app')
const Horario = require('../src/models/Horario')

const { criarUsuario, tokenPara, criarMedico, criarHorario, amanha } = ajuda

beforeAll(ajuda.iniciarBanco)
afterEach(ajuda.limparBanco)
afterAll(ajuda.pararBanco)

function autorizacao(token) {
  return { Authorization: `Bearer ${token}` }
}

async function tokenDe(perfil) {
  return tokenPara(await criarUsuario(perfil))
}

// Período de hoje 00:00 até daqui a 7 dias
function periodo() {
  const inicio = new Date()
  inicio.setHours(0, 0, 0, 0)
  const fim = new Date(inicio)
  fim.setDate(fim.getDate() + 7)
  return `inicio=${inicio.toISOString()}&fim=${fim.toISOString()}`
}

function abrirHorario(token, dados) {
  return request(app).post('/api/horarios').set(autorizacao(token)).send(dados)
}

test('recepcionista abre horário e ele herda a especialidade do médico', async () => {
  const medico = await criarMedico()
  const recepcionista = await tokenDe('recepcionista')

  const res = await abrirHorario(recepcionista, { medico: medico._id, dataHora: amanha(8) })

  expect(res.status).toBe(201)
  expect(res.body.especialidade).toBe(String(medico.especialidade))
  expect(res.body.paciente).toBeNull()
})

test('não abre horário no passado', async () => {
  const medico = await criarMedico()
  const recepcionista = await tokenDe('recepcionista')

  const res = await abrirHorario(recepcionista, {
    medico: medico._id,
    dataHora: new Date(Date.now() - 60 * 60 * 1000)
  })

  expect(res.status).toBe(400)
  expect(res.body.campos.dataHora).toBe('Não é possível abrir horário no passado')
})

test('não abre dois horários iguais para o mesmo médico', async () => {
  const medico = await criarMedico()
  const recepcionista = await tokenDe('recepcionista')
  await abrirHorario(recepcionista, { medico: medico._id, dataHora: amanha(8) })

  const res = await abrirHorario(recepcionista, { medico: medico._id, dataHora: amanha(8) })

  expect(res.status).toBe(409)
  expect(res.body.erro).toBe('Esse médico já tem um horário nesse dia e hora')
})

test('paciente não abre horário (403)', async () => {
  const medico = await criarMedico()
  const paciente = await tokenDe('paciente')

  const res = await abrirHorario(paciente, { medico: medico._id, dataHora: amanha(8) })

  expect(res.status).toBe(403)
})

test('médico inexistente dá 404', async () => {
  const admin = await tokenDe('admin')

  const res = await abrirHorario(admin, { medico: '6650f0c2a1b2c3d4e5f60718', dataHora: amanha(8) })

  expect(res.status).toBe(404)
  expect(res.body.erro).toBe('Médico não encontrado')
})

test('paciente vê livre ou ocupado sem dados de outro paciente', async () => {
  const medico = await criarMedico()
  const pacienteA = await criarUsuario()
  const pacienteB = await criarUsuario()
  await criarHorario(medico, amanha(9), pacienteA)
  await criarHorario(medico, amanha(10))

  const res = await request(app)
    .get(`/api/horarios?${periodo()}`)
    .set(autorizacao(tokenPara(pacienteB)))

  expect(res.status).toBe(200)
  expect(res.body).toHaveLength(2)

  const [ocupado, livre] = res.body
  expect(ocupado.livre).toBe(false)
  expect(ocupado.meu).toBe(false)
  expect(ocupado.paciente).toBeUndefined()
  expect(ocupado.medico.nome).toBe(medico.nome)
  expect(ocupado.especialidade.nome).toBe('Cardiologia')
  expect(livre.livre).toBe(true)
})

test('equipe vê nome, telefone e convênio do paciente, mas não o CPF', async () => {
  const medico = await criarMedico()
  const paciente = await criarUsuario()
  await criarHorario(medico, amanha(9), paciente)

  const res = await request(app)
    .get(`/api/horarios?${periodo()}`)
    .set(autorizacao(await tokenDe('recepcionista')))

  const item = res.body[0]
  expect(item.paciente.nome).toBe(paciente.nome)
  expect(item.paciente.telefone).toBe(paciente.telefone)
  expect(item.paciente.convenio).toBe('Unimed')
  expect(item.paciente.cpf).toBeUndefined()
})

test('filtra horários por especialidade', async () => {
  const cardiologista = await criarMedico('Cardiologia')
  const pediatra = await criarMedico('Pediatria')
  await criarHorario(cardiologista)
  await criarHorario(pediatra)

  const res = await request(app)
    .get(`/api/horarios?${periodo()}&especialidade=${pediatra.especialidade}`)
    .set(autorizacao(await tokenDe('paciente')))

  expect(res.body).toHaveLength(1)
  expect(res.body[0].especialidade.nome).toBe('Pediatria')
})

test('filtro sem datas dá 400', async () => {
  const res = await request(app)
    .get('/api/horarios')
    .set(autorizacao(await tokenDe('paciente')))

  expect(res.status).toBe(400)
  expect(res.body.campos.inicio).toBeDefined()
})

test('período maior que 62 dias dá 400', async () => {
  const inicio = new Date()
  const fim = new Date(inicio.getTime() + 70 * 24 * 60 * 60 * 1000)

  const res = await request(app)
    .get(`/api/horarios?inicio=${inicio.toISOString()}&fim=${fim.toISOString()}`)
    .set(autorizacao(await tokenDe('paciente')))

  expect(res.status).toBe(400)
  expect(res.body.erro).toBe('O período máximo é de 62 dias')
})

test('exclui horário livre e não exclui horário marcado', async () => {
  const medico = await criarMedico()
  const livre = await criarHorario(medico, amanha(9))
  const marcado = await criarHorario(medico, amanha(10), await criarUsuario())
  const recepcionista = await tokenDe('recepcionista')

  const resLivre = await request(app)
    .delete(`/api/horarios/${livre._id}`)
    .set(autorizacao(recepcionista))
  const resMarcado = await request(app)
    .delete(`/api/horarios/${marcado._id}`)
    .set(autorizacao(recepcionista))

  expect(resLivre.status).toBe(204)
  expect(resMarcado.status).toBe(409)
  expect(resMarcado.body.erro).toBe('Desmarque a consulta antes de excluir o horário')
})

test('não exclui médico com consulta futura e apaga os horários livres junto', async () => {
  const medico = await criarMedico()
  const marcado = await criarHorario(medico, amanha(9), await criarUsuario())
  await criarHorario(medico, amanha(10))
  const admin = await tokenDe('admin')

  const bloqueado = await request(app).delete(`/api/medicos/${medico._id}`).set(autorizacao(admin))
  expect(bloqueado.status).toBe(409)
  expect(bloqueado.body.erro).toBe('Esse médico tem consultas futuras marcadas')

  await Horario.updateOne({ _id: marcado._id }, { paciente: null })

  const excluido = await request(app).delete(`/api/medicos/${medico._id}`).set(autorizacao(admin))
  expect(excluido.status).toBe(204)
  expect(await Horario.countDocuments({ medico: medico._id })).toBe(0)
})

test('trocar a especialidade do médico atualiza os horários dele', async () => {
  const cardiologista = await criarMedico('Cardiologia')
  const pediatra = await criarMedico('Pediatria')
  const horario = await criarHorario(cardiologista)

  await request(app)
    .put(`/api/medicos/${cardiologista._id}`)
    .set(autorizacao(await tokenDe('admin')))
    .send({ nome: cardiologista.nome, crm: cardiologista.crm, especialidade: pediatra.especialidade })

  const atualizado = await Horario.findById(horario._id)
  expect(String(atualizado.especialidade)).toBe(String(pediatra.especialidade))
})
