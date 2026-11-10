const mongoose = require('mongoose')

// Operadores como $gt ou $ne vindos da requisição viram comparação simples ($eq).
// As consultas do próprio sistema que usam operadores passam por mongoose.trusted().
mongoose.set('sanitizeFilter', true)

async function conectar(uri) {
  await mongoose.connect(uri)
}

module.exports = { conectar }
