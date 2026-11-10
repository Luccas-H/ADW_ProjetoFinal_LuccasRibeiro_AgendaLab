const request = require('supertest')
const { iniciarBanco, limparBanco, pararBanco, criarUsuario, tokenPara } = require('./ajuda')
const app = require('../src/app')

beforeAll(iniciarBanco)
afterEach(limparBanco)
afterAll(pararBanco)

async function tokenDe(perfil) {
  return tokenPara(await criarUsuario(perfil))
}

function criarEspecialidade(token, dados) {
  return request(app)
    .post('/api/especialidades')
    .set('Authorization', `Bearer ${token}`)
    .send(dados)
}

test('qualquer pessoa lista especialidades', async () => {
  const admin = await tokenDe('admin')
  await criarEspecialidade(admin, { nome: 'Cardiologia' })

  const res = await request(app).get('/api/especialidades')

  expect(res.status).toBe(200)
  expect(res.body).toHaveLength(1)
  expect(res.body[0].nome).toBe('Cardiologia')
})

test('sem token não cria (401)', async () => {
  const res = await request(app).post('/api/especialidades').send({ nome: 'Cardiologia' })

  expect(res.status).toBe(401)
})

test('paciente não cria (403)', async () => {
  const paciente = await tokenDe('paciente')

  const res = await criarEspecialidade(paciente, { nome: 'Cardiologia' })

  expect(res.status).toBe(403)
  expect(res.body.erro).toBe('Acesso negado')
})

test('admin cria, edita e exclui', async () => {
  const admin = await tokenDe('admin')

  const criada = await criarEspecialidade(admin, { nome: 'Cardiologia', descricao: 'Coração' })
  expect(criada.status).toBe(201)
  expect(criada.body.nome).toBe('Cardiologia')

  const editada = await request(app)
    .put(`/api/especialidades/${criada.body._id}`)
    .set('Authorization', `Bearer ${admin}`)
    .send({ nome: 'Cardiologia Infantil' })
  expect(editada.status).toBe(200)
  expect(editada.body.nome).toBe('Cardiologia Infantil')

  const excluida = await request(app)
    .delete(`/api/especialidades/${criada.body._id}`)
    .set('Authorization', `Bearer ${admin}`)
  expect(excluida.status).toBe(204)

  const lista = await request(app).get('/api/especialidades')
  expect(lista.body).toHaveLength(0)
})

test('nome repetido dá 409, mesmo com outra combinação de maiúsculas', async () => {
  const admin = await tokenDe('admin')
  await criarEspecialidade(admin, { nome: 'Cardiologia' })

  const res = await criarEspecialidade(admin, { nome: 'cardiologia' })

  expect(res.status).toBe(409)
  expect(res.body.erro).toBe('Essa especialidade já está cadastrada')
})

test('não exclui especialidade com médicos', async () => {
  const admin = await tokenDe('admin')
  const especialidade = await criarEspecialidade(admin, { nome: 'Cardiologia' })
  await request(app)
    .post('/api/medicos')
    .set('Authorization', `Bearer ${admin}`)
    .send({ nome: 'Helena Prado', crm: '1234/RR', especialidade: especialidade.body._id })

  const res = await request(app)
    .delete(`/api/especialidades/${especialidade.body._id}`)
    .set('Authorization', `Bearer ${admin}`)

  expect(res.status).toBe(409)
  expect(res.body.erro).toBe('Essa especialidade ainda tem médicos')
})

test('id inválido dá 400', async () => {
  const admin = await tokenDe('admin')

  const res = await request(app)
    .put('/api/especialidades/abc')
    .set('Authorization', `Bearer ${admin}`)
    .send({ nome: 'Cardiologia' })

  expect(res.status).toBe(400)
  expect(res.body.erro).toBe('ID inválido')
})

test('editar especialidade que não existe dá 404', async () => {
  const admin = await tokenDe('admin')

  const res = await request(app)
    .put('/api/especialidades/6650f0c2a1b2c3d4e5f60718')
    .set('Authorization', `Bearer ${admin}`)
    .send({ nome: 'Cardiologia' })

  expect(res.status).toBe(404)
  expect(res.body.erro).toBe('Especialidade não encontrada')
})
