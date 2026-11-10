const Usuario = require('../models/Usuario')
const { escaparRegex } = require('../utils/regex')

// Busca usada pela recepção para marcar consulta para alguém.
// Devolve só o necessário: nome, telefone e convênio.
async function buscar(req, res) {
  const { q } = req.filtros
  const filtro = { perfil: 'paciente' }

  // CPF só funciona completo (11 dígitos), para ninguém descobrir pacientes digitando pedaços
  const digitos = q.replace(/[.\-\s]/g, '')
  if (/^\d{11}$/.test(digitos)) {
    filtro.cpf = digitos
  } else {
    filtro.nome = new RegExp(escaparRegex(q), 'i')
  }

  const pacientes = await Usuario.find(filtro)
    .select('nome telefone convenio')
    .sort({ nome: 1 })
    .collation({ locale: 'pt' })
    .limit(10)
  res.json(pacientes)
}

module.exports = { buscar }
