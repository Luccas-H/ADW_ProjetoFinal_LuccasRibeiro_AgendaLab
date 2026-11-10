import { apenasDigitos } from './formatar'

// Mesmas regras do backend. Aqui servem só para avisar antes de enviar;
// quem garante os dados é a API.

export function cpfValido(cpf) {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) {
    return false
  }

  const digito = (tamanho) => {
    let soma = 0
    for (let i = 0; i < tamanho; i++) {
      soma += Number(cpf[i]) * (tamanho + 1 - i)
    }
    const resto = (soma * 10) % 11
    return resto === 10 ? 0 : resto
  }

  return digito(9) === Number(cpf[9]) && digito(10) === Number(cpf[10])
}

const NOME = /^[\p{L} '-]+$/u
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const USUARIO = /^[a-z0-9._]{3,20}$/i

export function validarNome(valor) {
  const texto = valor.trim()
  if (!texto) return 'Campo obrigatório'
  if (texto.length < 3) return 'Use pelo menos 3 caracteres'
  if (!NOME.test(texto)) return 'Use apenas letras'
  return null
}

export function validarSenha(senha) {
  if (!senha) return 'Campo obrigatório'
  if (senha.length < 8 || senha.length > 64 || !/[a-z]/i.test(senha) || !/\d/.test(senha)) {
    return 'A senha precisa ter de 8 a 64 caracteres, com pelo menos uma letra e um número'
  }
  return null
}

export function validarEmail(email) {
  if (!email.trim()) return 'Campo obrigatório'
  if (!EMAIL.test(email.trim())) return 'E-mail inválido'
  return null
}

export function validarUsuario(usuario) {
  if (!usuario.trim()) return 'Campo obrigatório'
  if (!USUARIO.test(usuario.trim())) {
    return 'Use de 3 a 20 caracteres: letras, números, ponto ou sublinhado'
  }
  return null
}

// Devolve { campo: mensagem } só com os campos que têm problema
export function validarPaciente(dados, modo) {
  const erros = {}
  const anotar = (campo, mensagem) => {
    if (mensagem) erros[campo] = mensagem
  }

  if (modo === 'cadastro') {
    anotar('usuario', validarUsuario(dados.usuario))
    anotar('senha', validarSenha(dados.senha))
    if (dados.senha !== dados.confirmarSenha) {
      anotar('confirmarSenha', 'As senhas não conferem')
    }
    const cpf = apenasDigitos(dados.cpf)
    if (!cpf) {
      anotar('cpf', 'Campo obrigatório')
    } else if (!cpfValido(cpf)) {
      anotar('cpf', 'CPF inválido')
    }
  }

  anotar('email', validarEmail(dados.email))
  anotar('nome', validarNome(dados.nome))
  anotar('filiacao', validarNome(dados.filiacao))

  if (!dados.dataNascimento) {
    anotar('dataNascimento', 'Campo obrigatório')
  } else if (new Date(dados.dataNascimento) > new Date()) {
    anotar('dataNascimento', 'A data de nascimento não pode ser no futuro')
  }

  const telefone = apenasDigitos(dados.telefone)
  if (telefone.length < 10 || telefone.length > 11) {
    anotar('telefone', 'Informe o DDD e o número')
  }

  if (!dados.tipoSanguineo) anotar('tipoSanguineo', 'Escolha uma opção da lista')
  if (!dados.convenio) anotar('convenio', 'Escolha uma opção da lista')

  const { endereco } = dados
  if (apenasDigitos(endereco.cep).length !== 8) anotar('endereco.cep', 'CEP inválido')
  for (const campo of ['rua', 'numero', 'bairro', 'cidade']) {
    if (!endereco[campo].trim()) anotar(`endereco.${campo}`, 'Campo obrigatório')
  }
  if (!endereco.estado) anotar('endereco.estado', 'Escolha uma opção da lista')

  return erros
}
