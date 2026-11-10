process.env.JWT_SECRET ??= 'segredo-de-teste'
process.env.TZ = 'America/Boa_Vista'

const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')
const { conectar } = require('../src/config/db')

const DADOS_PACIENTE = {
  nome: 'Maria da Silva',
  usuario: 'maria.silva',
  email: 'maria@email.com',
  senha: 'senha1234',
  dataNascimento: '1990-05-20',
  cpf: '529.982.247-25',
  telefone: '(95) 99123-4567',
  tipoSanguineo: 'O+',
  convenio: 'Unimed',
  filiacao: 'Ana da Silva',
  endereco: {
    cep: '69301-000',
    rua: 'Rua A',
    numero: '100',
    complemento: '',
    bairro: 'Centro',
    cidade: 'Boa Vista',
    estado: 'RR'
  }
}

let servidorMongo

async function iniciarBanco() {
  servidorMongo = await MongoMemoryServer.create()
  // O driver do MongoDB carrega o módulo "os" com import(), que não funciona dentro do Jest.
  // Passando o módulo direto, a conexão funciona igual à do servidor de verdade.
  await conectar(servidorMongo.getUri(), { runtimeAdapters: { os: require('os') } })
  // Espera os índices únicos ficarem prontos, senão os testes de duplicado podem passar sem 409
  await Promise.all(Object.values(mongoose.models).map((modelo) => modelo.init()))
}

async function limparBanco() {
  const colecoes = await mongoose.connection.db.collections()
  for (const colecao of colecoes) {
    await colecao.deleteMany({})
  }
}

async function pararBanco() {
  await mongoose.disconnect()
  await servidorMongo.stop()
}

module.exports = { iniciarBanco, limparBanco, pararBanco, DADOS_PACIENTE }
