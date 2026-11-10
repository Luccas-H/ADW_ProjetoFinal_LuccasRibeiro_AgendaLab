const request = require('supertest')
const { iniciarBanco, limparBanco, pararBanco, criarUsuario, tokenPara } = require('./ajuda')
const app = require('../src/app')
const Usuario = require('../src/models/Usuario')

beforeAll(iniciarBanco)
afterEach(limparBanco)
afterAll(pararBanco)

function login(usuario, senha) {
  return request(app).post('/api/auth/login').send({ usuario, senha })
}

function buscarMe(token) {
  return request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`)
}

test('login certo devolve token e perfil', async () => {
  const paciente = await criarUsuario()

  const res = await login(paciente.usuario, 'senha1234')

  expect(res.status).toBe(200)
  expect(typeof res.body.token).toBe('string')
  expect(res.body.usuario.perfil).toBe('paciente')
  expect(res.body.usuario.senha).toBeUndefined()
})

test('senha errada e usuário inexistente têm a mesma mensagem', async () => {
  const paciente = await criarUsuario()

  const senhaErrada = await login(paciente.usuario, 'outrasenha1')
  const inexistente = await login('ninguem', 'senha1234')

  expect(senhaErrada.status).toBe(401)
  expect(inexistente.status).toBe(401)
  expect(senhaErrada.body.erro).toBe('Usuário ou senha incorretos')
  expect(inexistente.body.erro).toBe('Usuário ou senha incorretos')
})

test('aceita usuário digitado com maiúsculas', async () => {
  const paciente = await criarUsuario()

  const res = await login(paciente.usuario.toUpperCase(), 'senha1234')

  expect(res.status).toBe(200)
})

test('recusa operador do Mongo no lugar do usuário', async () => {
  await criarUsuario()

  const res = await request(app)
    .post('/api/auth/login')
    .send({ usuario: { $ne: null }, senha: 'x' })

  expect(res.status).toBe(400)
})

test('GET /auth/me sem token responde 401', async () => {
  const res = await request(app).get('/api/auth/me')

  expect(res.status).toBe(401)
  expect(res.body.erro).toBe('Faça login para continuar')
})

test('GET /auth/me com token adulterado responde 401', async () => {
  const paciente = await criarUsuario()

  const res = await buscarMe(tokenPara(paciente) + 'x')

  expect(res.status).toBe(401)
})

test('GET /auth/me com token de usuário excluído responde 401', async () => {
  const paciente = await criarUsuario()
  const token = tokenPara(paciente)
  await Usuario.deleteOne({ _id: paciente._id })

  const res = await buscarMe(token)

  expect(res.status).toBe(401)
})

test('GET /auth/me devolve os dados do usuário do token', async () => {
  const paciente = await criarUsuario()

  const res = await buscarMe(tokenPara(paciente))

  expect(res.status).toBe(200)
  expect(res.body.usuario.usuario).toBe(paciente.usuario)
  expect(res.body.usuario.perfil).toBe('paciente')
  expect(res.body.usuario.senha).toBeUndefined()
})
