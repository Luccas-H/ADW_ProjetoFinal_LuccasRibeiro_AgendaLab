const request = require('supertest')
const { iniciarBanco, limparBanco, pararBanco, DADOS_PACIENTE } = require('./ajuda')
const app = require('../src/app')
const Usuario = require('../src/models/Usuario')

beforeAll(iniciarBanco)
afterEach(limparBanco)
afterAll(pararBanco)

function cadastrar(dados) {
  return request(app).post('/api/auth/cadastro').send(dados)
}

test('cria paciente e não devolve a senha', async () => {
  const res = await cadastrar(DADOS_PACIENTE)

  expect(res.status).toBe(201)
  expect(res.body.usuario.perfil).toBe('paciente')
  expect(res.body.usuario.senha).toBeUndefined()

  const salvo = await Usuario.findOne({ usuario: 'maria.silva' }).select('+senha')
  expect(salvo.senha.startsWith('$2')).toBe(true)
})

test('ignora perfil admin enviado no corpo', async () => {
  const res = await cadastrar({ ...DADOS_PACIENTE, perfil: 'admin' })

  expect(res.status).toBe(201)
  const salvo = await Usuario.findOne({ usuario: 'maria.silva' })
  expect(salvo.perfil).toBe('paciente')
})

test('salva CPF, telefone e CEP só com dígitos e e-mail e usuário em minúsculas', async () => {
  const res = await cadastrar({
    ...DADOS_PACIENTE,
    cpf: '529.982.247-25 ',
    email: 'Maria@Email.com',
    usuario: 'Maria.Silva'
  })

  expect(res.status).toBe(201)
  const salvo = await Usuario.findOne({ usuario: 'maria.silva' })
  expect(salvo.cpf).toBe('52998224725')
  expect(salvo.telefone).toBe('95991234567')
  expect(salvo.endereco.cep).toBe('69301000')
  expect(salvo.email).toBe('maria@email.com')
})

test('recusa CPF inválido', async () => {
  const res = await cadastrar({ ...DADOS_PACIENTE, cpf: '529.982.247-24' })

  expect(res.status).toBe(400)
  expect(res.body.campos.cpf).toBe('CPF inválido')
})

test('recusa senha sem número', async () => {
  const res = await cadastrar({ ...DADOS_PACIENTE, senha: 'somenteletras' })

  expect(res.status).toBe(400)
  expect(res.body.campos.senha).toBe('A senha precisa ter pelo menos uma letra e um número')
})

test('recusa data de nascimento no futuro', async () => {
  const res = await cadastrar({ ...DADOS_PACIENTE, dataNascimento: '2999-01-01' })

  expect(res.status).toBe(400)
  expect(res.body.campos.dataNascimento).toBeDefined()
})

test('recusa CPF repetido com 409', async () => {
  await cadastrar(DADOS_PACIENTE)
  const res = await cadastrar({ ...DADOS_PACIENTE, usuario: 'outra.maria', email: 'outra@email.com' })

  expect(res.status).toBe(409)
  expect(res.body.erro).toBe('Esse CPF já está cadastrado')
})

test('lista os campos que faltam', async () => {
  const res = await cadastrar({})

  expect(res.status).toBe(400)
  expect(res.body.erro).toBe('Dados inválidos')
  for (const campo of ['nome', 'usuario', 'senha', 'cpf', 'endereco']) {
    expect(res.body.campos[campo]).toBe('Campo obrigatório')
  }
})
