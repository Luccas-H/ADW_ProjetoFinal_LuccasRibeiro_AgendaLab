const ErroHttp = require('../utils/ErroHttp')
const mensagens = require('../validators/mensagens')

// stripUnknown descarta campos que não estão no schema (ex.: "perfil" no cadastro)
const opcoes = { abortEarly: false, stripUnknown: true, messages: mensagens }

function validarDados(schema, dados) {
  const { error, value } = schema.validate(dados ?? {}, opcoes)

  if (error) {
    const campos = {}
    for (const detalhe of error.details) {
      const caminho = detalhe.path.join('.')
      if (!campos[caminho]) {
        campos[caminho] = detalhe.message
      }
    }
    throw new ErroHttp(400, 'Dados inválidos', campos)
  }

  return value
}

function validar(schema, origem = 'body') {
  return (req, res, next) => {
    const valor = validarDados(schema, req[origem])

    // No Express 5 o req.query não pode ser substituído, então a query validada vai para req.filtros
    if (origem === 'query') {
      req.filtros = valor
    } else {
      req.body = valor
    }
    next()
  }
}

module.exports = { validar, validarDados }
