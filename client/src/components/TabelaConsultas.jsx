import { formatarData, formatarHora, mascaraTelefone } from '../utils/formatar'

// Lista de consultas da equipe. Consultas que já passaram ficam em cinza.
function TabelaConsultas({ consultas, agora, onDetalhes, mostrarMedico = true }) {
  return (
    <table className="tabela">
      <thead>
        <tr>
          <th>Data</th>
          <th>Hora</th>
          <th>Paciente</th>
          <th>Telefone</th>
          <th>Convênio</th>
          {mostrarMedico && <th>Especialidade</th>}
          {mostrarMedico && <th>Médico</th>}
          <th>
            <span className="somente-leitor">Ações</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {consultas.map((consulta) => (
          <tr
            key={consulta._id}
            className={new Date(consulta.dataHora) <= agora ? 'linha-passada' : ''}
          >
            <td data-label="Data">{formatarData(consulta.dataHora)}</td>
            <td data-label="Hora">
              <strong>{formatarHora(consulta.dataHora)}</strong>
            </td>
            <td data-label="Paciente">{consulta.paciente?.nome}</td>
            <td data-label="Telefone">{mascaraTelefone(consulta.paciente?.telefone)}</td>
            <td data-label="Convênio">{consulta.paciente?.convenio}</td>
            {mostrarMedico && <td data-label="Especialidade">{consulta.especialidade.nome}</td>}
            {mostrarMedico && <td data-label="Médico">{consulta.medico.nome}</td>}
            <td data-label="Ações">
              <div className="acoes">
                <button
                  type="button"
                  className="botao botao-contorno botao-pequeno"
                  onClick={() => onDetalhes(consulta)}
                >
                  Detalhes
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default TabelaConsultas
