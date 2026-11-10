const jwt = require('jsonwebtoken')
const Usuario = require('../models/Usuario')
const ErroHttp = require('../utils/ErroHttp')

async function autenticar(req, res, next) {
  const [tipo, token] = (req.headers.authorization || '').split(' ')
  if (tipo !== 'Bearer' || !token) {
    throw new ErroHttp(401, 'Faça login para continuar')
  }

  let dados
  try {
    dados = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] })
  } catch {
    throw new ErroHttp(401, 'Faça login para continuar')
  }

  // Busca no banco para recusar o token de quem foi excluído depois do login
  const usuario = await Usuario.findById(dados.id)
  if (!usuario) {
    throw new ErroHttp(401, 'Faça login para continuar')
  }

  req.usuario = usuario
  next()
}

module.exports = autenticar
