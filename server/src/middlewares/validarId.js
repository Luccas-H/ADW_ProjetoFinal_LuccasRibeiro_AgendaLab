const ErroHttp = require('../utils/ErroHttp')

function validarId(req, res, next) {
  if (!/^[0-9a-f]{24}$/i.test(req.params.id)) {
    throw new ErroHttp(400, 'ID inválido')
  }
  next()
}

module.exports = validarId
