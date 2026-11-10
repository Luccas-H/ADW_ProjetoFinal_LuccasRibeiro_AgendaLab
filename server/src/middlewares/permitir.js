const ErroHttp = require('../utils/ErroHttp')

function permitir(...perfis) {
  return (req, res, next) => {
    if (!perfis.includes(req.usuario.perfil)) {
      throw new ErroHttp(403, 'Acesso negado')
    }
    next()
  }
}

module.exports = permitir
