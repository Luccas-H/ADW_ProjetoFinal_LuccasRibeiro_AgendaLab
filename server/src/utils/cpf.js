function limparCpf(valor) {
  return String(valor).replace(/\D/g, '')
}

function digitoVerificador(cpf, tamanho) {
  let soma = 0
  for (let i = 0; i < tamanho; i++) {
    soma += Number(cpf[i]) * (tamanho + 1 - i)
  }
  const resto = (soma * 10) % 11
  return resto === 10 ? 0 : resto
}

function cpfValido(cpf) {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) {
    return false
  }
  return (
    digitoVerificador(cpf, 9) === Number(cpf[9]) &&
    digitoVerificador(cpf, 10) === Number(cpf[10])
  )
}

module.exports = { limparCpf, cpfValido }
