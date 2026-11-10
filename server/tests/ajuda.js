process.env.JWT_SECRET ??= 'segredo-de-teste'
process.env.TZ = 'America/Boa_Vista'

const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')
const { conectar } = require('../src/config/db')

let servidorMongo

async function iniciarBanco() {
  servidorMongo = await MongoMemoryServer.create()
  await conectar(servidorMongo.getUri())
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

module.exports = { iniciarBanco, limparBanco, pararBanco }
