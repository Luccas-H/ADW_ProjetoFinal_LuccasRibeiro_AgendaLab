const mongoose = require('mongoose')
const request = require('supertest')
const ajuda = require('./ajuda')
const app = require('../src/app')
const Usuario = require('../src/models/Usuario')
const Especialidade = require('../src/models/Especialidade')
const Medico = require('../src/models/Medico')
const Horario = require('../src/models/Horario')
const { popular } = require('../scripts/popular')

beforeAll(ajuda.iniciarBanco)
afterAll(ajuda.pararBanco)

test('cria especialidades, médicos, usuários de exemplo, horários e consultas', async () => {
  const resumo = await popular()

  expect(await Especialidade.countDocuments()).toBe(14)
  expect(await Medico.countDocuments()).toBe(16)
  expect(await Usuario.countDocuments({ perfil: 'paciente' })).toBe(3)
  expect(await Usuario.countDocuments({ perfil: 'recepcionista' })).toBe(1)
  expect(await Horario.countDocuments()).toBeGreaterThan(50)
  expect(resumo.consultas).toBeGreaterThanOrEqual(2)
})

test('não cria horários no passado', async () => {
  const passados = await Horario.countDocuments({ dataHora: mongoose.trusted({ $lt: new Date() }) })

  expect(passados).toBe(0)
})

test('rodar de novo não duplica nada', async () => {
  const horariosAntes = await Horario.countDocuments()
  const consultasAntes = await Horario.countDocuments({ paciente: mongoose.trusted({ $ne: null }) })

  await popular()

  expect(await Especialidade.countDocuments()).toBe(14)
  expect(await Medico.countDocuments()).toBe(16)
  expect(await Usuario.countDocuments()).toBe(4)
  expect(await Horario.countDocuments()).toBe(horariosAntes)
  expect(await Horario.countDocuments({ paciente: mongoose.trusted({ $ne: null }) })).toBe(consultasAntes)
})

test('completa a descrição de especialidade que foi criada sem descrição', async () => {
  await Especialidade.updateOne({ nome: 'Cardiologia' }, { descricao: '' })

  await popular()

  const cardiologia = await Especialidade.findOne({ nome: 'Cardiologia' })
  expect(cardiologia.descricao).toBe('Coração e pressão arterial')
})

test('pacientes de exemplo têm sexo preenchido', async () => {
  const semSexo = await Usuario.countDocuments({ perfil: 'paciente', sexo: null })

  expect(semSexo).toBe(0)
})

test('as contas de exemplo entram com as senhas do README', async () => {
  const paciente = await request(app)
    .post('/api/auth/login')
    .send({ usuario: 'maria.silva', senha: 'paciente123' })
  const recepcao = await request(app)
    .post('/api/auth/login')
    .send({ usuario: 'recepcao', senha: 'recepcao123' })

  expect(paciente.status).toBe(200)
  expect(recepcao.status).toBe(200)
  expect(recepcao.body.usuario.perfil).toBe('recepcionista')
})
