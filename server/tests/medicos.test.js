const request = require('supertest')
const { iniciarBanco, limparBanco, pararBanco, criarUsuario, tokenPara } = require('./ajuda')
const app = require('../src/app')

beforeAll(iniciarBanco)
afterEach(limparBanco)
afterAll(pararBanco)

let admin

beforeEach(async () => {
  admin = tokenPara(await criarUsuario('admin'))
})

async function criarEspecialidade(nome) {
  const res = await request(app)
    .post('/api/especialidades')
    .set('Authorization', `Bearer ${admin}`)
    .send({ nome })
  return res.body._id
}

function criarMedico(dados, token = admin) {
  return request(app)
    .post('/api/medicos')
    .set('Authorization', `Bearer ${token}`)
    .send(dados)
}

test('admin cria médico e a lista mostra o nome da especialidade', async () => {
  const cardiologia = await criarEspecialidade('Cardiologia')

  const criado = await criarMedico({ nome: 'Dra. Helena Prado', crm: '1234/rr', especialidade: cardiologia })
  expect(criado.status).toBe(201)
  expect(criado.body.crm).toBe('1234/RR')

  const paciente = tokenPara(await criarUsuario('paciente'))
  const lista = await request(app).get('/api/medicos').set('Authorization', `Bearer ${paciente}`)

  expect(lista.status).toBe(200)
  expect(lista.body[0].nome).toBe('Dra. Helena Prado')
  expect(lista.body[0].especialidade.nome).toBe('Cardiologia')
})

test('filtra por especialidade', async () => {
  const cardiologia = await criarEspecialidade('Cardiologia')
  const pediatria = await criarEspecialidade('Pediatria')
  await criarMedico({ nome: 'Helena Prado', crm: '1234/RR', especialidade: cardiologia })
  await criarMedico({ nome: 'Paulo Sena', crm: '5678/RR', especialidade: pediatria })

  const res = await request(app)
    .get(`/api/medicos?especialidade=${pediatria}`)
    .set('Authorization', `Bearer ${admin}`)

  expect(res.status).toBe(200)
  expect(res.body).toHaveLength(1)
  expect(res.body[0].nome).toBe('Paulo Sena')
})

test('filtro com id inválido dá 400', async () => {
  const res = await request(app)
    .get('/api/medicos?especialidade=abc')
    .set('Authorization', `Bearer ${admin}`)

  expect(res.status).toBe(400)
})

test('sem token não lista médicos (401)', async () => {
  const res = await request(app).get('/api/medicos')

  expect(res.status).toBe(401)
})

test('CRM repetido dá 409', async () => {
  const cardiologia = await criarEspecialidade('Cardiologia')
  await criarMedico({ nome: 'Helena Prado', crm: '1234/RR', especialidade: cardiologia })

  const res = await criarMedico({ nome: 'Outro Médico', crm: '1234/RR', especialidade: cardiologia })

  expect(res.status).toBe(409)
  expect(res.body.erro).toBe('Esse CRM já está cadastrado')
})

test('recepcionista não cria médico (403)', async () => {
  const cardiologia = await criarEspecialidade('Cardiologia')
  const recepcionista = tokenPara(await criarUsuario('recepcionista'))

  const res = await criarMedico(
    { nome: 'Helena Prado', crm: '1234/RR', especialidade: cardiologia },
    recepcionista
  )

  expect(res.status).toBe(403)
})

test('especialidade inexistente dá 404', async () => {
  const res = await criarMedico({
    nome: 'Helena Prado',
    crm: '1234/RR',
    especialidade: '6650f0c2a1b2c3d4e5f60718'
  })

  expect(res.status).toBe(404)
  expect(res.body.erro).toBe('Especialidade não encontrada')
})

test('admin edita e exclui médico', async () => {
  const cardiologia = await criarEspecialidade('Cardiologia')
  const criado = await criarMedico({ nome: 'Helena Prado', crm: '1234/RR', especialidade: cardiologia })

  const editado = await request(app)
    .put(`/api/medicos/${criado.body._id}`)
    .set('Authorization', `Bearer ${admin}`)
    .send({ nome: 'Helena Prado Lima', crm: '1234/RR', especialidade: cardiologia })
  expect(editado.status).toBe(200)
  expect(editado.body.nome).toBe('Helena Prado Lima')

  const excluido = await request(app)
    .delete(`/api/medicos/${criado.body._id}`)
    .set('Authorization', `Bearer ${admin}`)
  expect(excluido.status).toBe(204)
})
