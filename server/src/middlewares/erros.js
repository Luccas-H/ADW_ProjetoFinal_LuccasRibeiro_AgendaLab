const ErroHttp = require('../utils/ErroHttp')

const MENSAGENS_DUPLICADO = {
  usuario: 'Esse nome de usuário já está em uso',
  email: 'Esse e-mail já está cadastrado',
  cpf: 'Esse CPF já está cadastrado',
  nome: 'Essa especialidade já está cadastrada',
  crm: 'Esse CRM já está cadastrado',
  medico: 'Esse médico já tem um horário nesse dia e hora'
}

function rotaNaoEncontrada(req, res) {
  res.status(404).json({ erro: 'Rota não encontrada' })
}

// O Express só reconhece o middleware de erro se ele tiver 4 parâmetros
function tratarErros(err, req, res, next) {
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ erro: 'Requisição muito grande' })
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ erro: 'JSON inválido' })
  }

  if (err instanceof ErroHttp) {
    return res.status(err.status).json({ erro: err.message, campos: err.campos })
  }

  if (err.code === 11000) {
    const campo = Object.keys(err.keyPattern || {})[0]
    return res.status(409).json({ erro: MENSAGENS_DUPLICADO[campo] || 'Registro duplicado' })
  }

  if (process.env.NODE_ENV !== 'test') {
    console.error(err)
  }
  res.status(500).json({ erro: 'Erro interno no servidor' })
}

module.exports = { tratarErros, rotaNaoEncontrada }
