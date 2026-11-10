// Cria a primeira conta de Admin. Contas de Admin não podem ser criadas pelo site.
// Uso: npm run criar-admin (lê os dados do arquivo .env)
require('dotenv').config({ quiet: true })

const mongoose = require('mongoose')
const { conectar } = require('../src/config/db')
const Usuario = require('../src/models/Usuario')
const campos = require('../src/validators/campos')

const { MONGODB_URI, ADMIN_USUARIO, ADMIN_EMAIL, ADMIN_SENHA } = process.env

async function criarAdmin() {
  if (!MONGODB_URI || !ADMIN_USUARIO || !ADMIN_EMAIL || !ADMIN_SENHA) {
    throw new Error('Defina MONGODB_URI, ADMIN_USUARIO, ADMIN_EMAIL e ADMIN_SENHA no arquivo .env')
  }

  if (campos.senha.validate(ADMIN_SENHA).error) {
    throw new Error('ADMIN_SENHA precisa ter de 8 a 64 caracteres, com pelo menos uma letra e um número')
  }

  await conectar(MONGODB_URI)

  const existe = await Usuario.exists({ usuario: ADMIN_USUARIO.toLowerCase() })
  if (existe) {
    console.log('Admin já existe')
    return
  }

  await Usuario.create({
    nome: 'Administrador',
    usuario: ADMIN_USUARIO,
    email: ADMIN_EMAIL,
    senha: ADMIN_SENHA,
    perfil: 'admin'
  })
  console.log('Admin criado')
}

criarAdmin()
  .catch((err) => {
    console.error('Erro ao criar o admin:', err.message)
    process.exitCode = 1
  })
  .finally(() => mongoose.disconnect())
