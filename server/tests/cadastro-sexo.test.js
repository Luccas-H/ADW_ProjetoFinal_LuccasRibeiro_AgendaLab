// Em arquivo separado porque o cadastro tem limite de 10 por hora para o mesmo IP
const request = require('supertest')
const ajuda = require('./ajuda')
const app = require('../src/app')
const Usuario = require('../src/models/Usuario')

const { DADOS_PACIENTE } = ajuda

beforeAll(ajuda.iniciarBanco)
afterEach(ajuda.limparBanco)
afterAll(ajuda.pararBanco)

function cadastrar(dados) {
  return request(app).post('/api/auth/cadastro').send(dados)
}

test('salva o sexo escolhido', async () => {
  const res = await cadastrar({ ...DADOS_PACIENTE, sexo: 'Masculino' })

  expect(res.status).toBe(201)
  const salvo = await Usuario.findOne({ usuario: DADOS_PACIENTE.usuario })
  expect(salvo.sexo).toBe('Masculino')
})

test('sexo "Outro" exige a descrição', async () => {
  const res = await cadastrar({ ...DADOS_PACIENTE, sexo: 'Outro' })

  expect(res.status).toBe(400)
  expect(res.body.campos.sexoDescricao).toBe('Campo obrigatório')
})

test('sexo "Outro" com descrição é salvo', async () => {
  const res = await cadastrar({ ...DADOS_PACIENTE, sexo: 'Outro', sexoDescricao: 'Não binário' })

  expect(res.status).toBe(201)
  const salvo = await Usuario.findOne({ usuario: DADOS_PACIENTE.usuario })
  expect(salvo.sexo).toBe('Outro')
  expect(salvo.sexoDescricao).toBe('Não binário')
})

test('a descrição é descartada quando o sexo não é "Outro"', async () => {
  const res = await cadastrar({ ...DADOS_PACIENTE, sexo: 'Feminino', sexoDescricao: 'qualquer coisa' })

  expect(res.status).toBe(201)
  const salvo = await Usuario.findOne({ usuario: DADOS_PACIENTE.usuario })
  expect(salvo.sexoDescricao).toBeUndefined()
})

test('recusa sexo fora da lista e cadastro sem sexo', async () => {
  const foraDaLista = await cadastrar({ ...DADOS_PACIENTE, sexo: 'X' })
  const semSexo = await cadastrar({ ...DADOS_PACIENTE, sexo: undefined })

  expect(foraDaLista.status).toBe(400)
  expect(foraDaLista.body.campos.sexo).toBe('Escolha uma opção da lista')
  expect(semSexo.status).toBe(400)
  expect(semSexo.body.campos.sexo).toBe('Campo obrigatório')
})
