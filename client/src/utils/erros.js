export function mensagemErro(erro) {
  return (
    erro.response?.data?.erro ||
    'Não foi possível falar com o servidor. Verifique sua conexão e tente de novo.'
  )
}

// Erros por campo devolvidos pela API (ex.: { cpf: 'CPF inválido' })
export function camposErro(erro) {
  return erro.response?.data?.campos || {}
}
