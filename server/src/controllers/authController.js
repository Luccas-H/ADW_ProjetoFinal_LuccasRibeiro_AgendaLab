const Usuario = require('../models/Usuario')

async function cadastro(req, res) {
  const usuario = await Usuario.create({ ...req.body, perfil: 'paciente' })
  res.status(201).json({ usuario })
}

module.exports = { cadastro }
