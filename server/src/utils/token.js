const jwt = require('jsonwebtoken')

function gerarToken(usuario) {
  return jwt.sign(
    { id: String(usuario._id), perfil: usuario.perfil },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  )
}

module.exports = { gerarToken }
