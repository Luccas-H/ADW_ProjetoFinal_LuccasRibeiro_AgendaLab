const Usuario = require('../models/Usuario')
const ErroHttp = require('../utils/ErroHttp')
const { gerarToken } = require('../utils/token')

async function cadastro(req, res) {
  const usuario = await Usuario.create({ ...req.body, perfil: 'paciente' })
  res.status(201).json({ usuario })
}

async function login(req, res) {
  const { usuario, senha } = req.body

  const encontrado = await Usuario.findOne({ usuario }).select('+senha')

  // Mesma mensagem para usuário inexistente e senha errada, para não revelar quem tem conta
  if (!encontrado || !(await encontrado.compararSenha(senha))) {
    throw new ErroHttp(401, 'Usuário ou senha incorretos')
  }

  res.json({
    token: gerarToken(encontrado),
    usuario: {
      _id: encontrado._id,
      nome: encontrado.nome,
      usuario: encontrado.usuario,
      perfil: encontrado.perfil
    }
  })
}

function me(req, res) {
  const { _id, nome, usuario, email, perfil } = req.usuario
  res.json({ usuario: { _id, nome, usuario, email, perfil } })
}

module.exports = { cadastro, login, me }
