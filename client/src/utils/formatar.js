export function apenasDigitos(valor = '') {
  return String(valor).replace(/\D/g, '')
}

export function mascaraCpf(valor) {
  return apenasDigitos(valor)
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export function mascaraTelefone(valor) {
  const digitos = apenasDigitos(valor).slice(0, 11)
  if (digitos.length <= 2) {
    return digitos.length ? `(${digitos}` : ''
  }

  const ddd = digitos.slice(0, 2)
  const numero = digitos.slice(2)
  // Celular tem 9 dígitos depois do DDD, fixo tem 8
  const tamanhoInicio = numero.length > 8 ? 5 : 4

  if (numero.length <= tamanhoInicio) {
    return `(${ddd}) ${numero}`
  }
  return `(${ddd}) ${numero.slice(0, tamanhoInicio)}-${numero.slice(tamanhoInicio)}`
}

export function mascaraCep(valor) {
  const digitos = apenasDigitos(valor).slice(0, 8)
  return digitos.length > 5 ? `${digitos.slice(0, 5)}-${digitos.slice(5)}` : digitos
}

// Data digitada como dd/mm/aaaa
export function mascaraData(valor) {
  const digitos = apenasDigitos(valor).slice(0, 8)
  if (digitos.length <= 2) return digitos
  if (digitos.length <= 4) return `${digitos.slice(0, 2)}/${digitos.slice(2)}`
  return `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}/${digitos.slice(4)}`
}

// "20/05/1990" vira "1990-05-20", que é o formato da API. Data que não existe vira ''.
export function dataParaIso(texto) {
  const partes = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto)
  if (!partes) return ''
  const [, dia, mes, ano] = partes
  const data = new Date(Date.UTC(ano, mes - 1, dia))
  if (data.getUTCDate() !== Number(dia) || data.getUTCMonth() !== Number(mes) - 1) return ''
  return `${ano}-${mes}-${dia}`
}

// "1990-05-20T00:00:00.000Z" vira "20/05/1990"
export function isoParaData(iso) {
  if (!iso) return ''
  const [ano, mes, dia] = iso.slice(0, 10).split('-')
  return `${dia}/${mes}/${ano}`
}

// Datas de consulta: mostradas no horário local
export function formatarData(iso) {
  return new Date(iso).toLocaleDateString('pt-BR')
}

export function formatarHora(iso) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

// Data de nascimento é salva como meia-noite UTC; sem o timeZone ela apareceria um dia antes
export function formatarDataNascimento(iso) {
  return new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
}

// "2026-11-18" no horário local, usado como chave dos dias do calendário
export function chaveDia(data) {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}
