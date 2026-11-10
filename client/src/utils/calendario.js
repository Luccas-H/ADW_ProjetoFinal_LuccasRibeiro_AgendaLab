import { chaveDia } from './formatar'

export function inicioDoMes(data) {
  return new Date(data.getFullYear(), data.getMonth(), 1)
}

export function fimDoMes(data) {
  return new Date(data.getFullYear(), data.getMonth() + 1, 0, 23, 59, 59, 999)
}

export function horariosDoDia(horarios, chave) {
  return horarios.filter((horario) => chaveDia(new Date(horario.dataHora)) === chave)
}

// Para o calendário: "livre" se o dia tem algum horário livre no futuro,
// "lotado" se tem horários mas nenhum livre. Dias que já passaram ficam sem marca.
export function marcarDias(horarios, agora) {
  const hoje = chaveDia(agora)
  const dias = {}

  for (const horario of horarios) {
    const data = new Date(horario.dataHora)
    const chave = chaveDia(data)
    if (chave < hoje) continue

    if (horario.livre && data > agora) {
      dias[chave] = 'livre'
    } else if (!dias[chave]) {
      dias[chave] = 'lotado'
    }
  }

  return dias
}
