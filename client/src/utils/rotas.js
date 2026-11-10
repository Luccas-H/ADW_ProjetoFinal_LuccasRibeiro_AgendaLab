// Tela que cada perfil vê logo depois do login
export function areaInicial(perfil) {
  return perfil === 'paciente' ? '/paciente/agendar' : '/equipe/painel'
}

export const NOMES_PERFIL = {
  paciente: 'Paciente',
  recepcionista: 'Recepcionista',
  admin: 'Admin'
}
