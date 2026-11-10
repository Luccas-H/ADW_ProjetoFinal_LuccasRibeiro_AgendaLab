process.env.JWT_SECRET ??= 'segredo-de-teste'
process.env.TZ = 'America/Boa_Vista'

const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')
const { conectar } = require('../src/config/db')
const Usuario = require('../src/models/Usuario')
const { gerarToken } = require('../src/utils/token')

const CPFS_VALIDOS = ['52998224725', '11144477735', '93541134780', '28625587887']

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

let contadorUsuarios = 0
let contadorPacientes = 0

// Cria o usuário direto no banco, sem passar pela rota de cadastro (que tem limite por hora)
async function criarUsuario(perfil = 'paciente', extra = {}) {
  contadorUsuarios++
  const nomePerfil = perfil[0].toUpperCase() + perfil.slice(1)

  const dados = {
    nome: `${nomePerfil} ${contadorUsuarios}`,
    usuario: `${perfil}${contadorUsuarios}`,
    email: `${perfil}${contadorUsuarios}@teste.com`,
    senha: 'senha1234',
    perfil
  }

  if (perfil === 'paciente') {
    contadorPacientes++
    Object.assign(dados, {
      dataNascimento: new Date('1990-05-20'),
      cpf: CPFS_VALIDOS[contadorPacientes % CPFS_VALIDOS.length],
      telefone: '95991234567',
      tipoSanguineo: 'O+',
      convenio: 'Unimed',
      filiacao: 'Ana da Silva',
      endereco: {
        cep: '69301000',
        rua: 'Rua A',
        numero: '100',
        bairro: 'Centro',
        cidade: 'Boa Vista',
        estado: 'RR'
      }
    })
  }

  return Usuario.create({ ...dados, ...extra })
}

function tokenPara(usuario) {
  return gerarToken(usuario)
}

module.exports = {
  iniciarBanco,
  limparBanco,
  pararBanco,
  criarUsuario,
  tokenPara,
  DADOS_PACIENTE,
  CPFS_VALIDOS
}
