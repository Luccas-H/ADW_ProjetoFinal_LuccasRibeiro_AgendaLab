// Telas de cada perfil: [rota, texto]. Usado no menu do topo e no rodapé.
export const MENUS = {
  paciente: [
    ['/paciente/agendar', 'Agendar'],
    ['/paciente/consultas', 'Minhas consultas'],
    ['/paciente/dados', 'Meus dados']
  ],
  recepcionista: [
    ['/equipe/painel', 'Painel'],
    ['/equipe/agenda', 'Agenda'],
    ['/equipe/consultas', 'Consultas']
  ],
  admin: [
    ['/equipe/painel', 'Painel'],
    ['/equipe/agenda', 'Agenda'],
    ['/equipe/consultas', 'Consultas'],
    ['/admin/especialidades', 'Especialidades'],
    ['/admin/medicos', 'Médicos'],
    ['/admin/usuarios', 'Usuários']
  ]
}
