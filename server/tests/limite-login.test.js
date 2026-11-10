// Fica num arquivo separado porque o contador de tentativas vale para o processo inteiro do arquivo
const request = require('supertest')
const { iniciarBanco, pararBanco, criarUsuario } = require('./ajuda')
const app = require('../src/app')

beforeAll(iniciarBanco)
afterAll(pararBanco)

function login(usuario, senha) {
  return request(app).post('/api/auth/login').send({ usuario, senha })
}

test('conta só senhas erradas e bloqueia depois da quinta', async () => {
  const paciente = await criarUsuario()

  for (let i = 0; i < 4; i++) {
    const res = await login(paciente.usuario, 'errada123')
    expect(res.status).toBe(401)
  }

  const certa = await login(paciente.usuario, 'senha1234')
  expect(certa.status).toBe(200)

  const quintaErrada = await login(paciente.usuario, 'errada123')
  expect(quintaErrada.status).toBe(401)

  const bloqueado = await login(paciente.usuario, 'senha1234')
  expect(bloqueado.status).toBe(429)
  expect(bloqueado.body.erro).toBe('Muitas tentativas. Tente novamente em 20 minutos.')
})
