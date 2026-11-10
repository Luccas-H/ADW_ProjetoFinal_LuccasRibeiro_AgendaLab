import { useState } from 'react'
import api from '../api/api'
import Alerta from './Alerta'
import Campo from './Campo'
import Modal from './Modal'
import { formatarData, formatarHora, mascaraTelefone } from '../utils/formatar'
import { mensagemErro } from '../utils/erros'

// Janela em que a recepção procura o paciente (pelo nome ou CPF completo) e marca o horário
function MarcarParaPaciente({ horario, onFechar, onMarcado }) {
  const [busca, setBusca] = useState('')
  const [resultados, setResultados] = useState(null)
  const [buscando, setBuscando] = useState(false)
  const [marcandoId, setMarcandoId] = useState(null)
  const [erro, setErro] = useState('')

  async function buscar(evento) {
    evento.preventDefault()
    setErro('')

    if (busca.trim().length < 2) {
      setErro('Digite pelo menos 2 letras do nome ou o CPF completo.')
      return
    }

    setBuscando(true)
    try {
      const resposta = await api.get('/pacientes/busca', { params: { q: busca.trim() } })
      setResultados(resposta.data)
    } catch (falha) {
      setErro(mensagemErro(falha))
    } finally {
      setBuscando(false)
    }
  }

  async function marcar(paciente) {
    setMarcandoId(paciente._id)
    setErro('')
    try {
      await api.patch(`/horarios/${horario._id}/agendar`, { pacienteId: paciente._id })
      onMarcado(paciente.nome)
    } catch (falha) {
      setErro(mensagemErro(falha))
      setMarcandoId(null)
    }
  }

  return (
    <Modal titulo="Marcar consulta" onFechar={onFechar}>
      <p className="texto-suave">
        {horario.especialidade.nome} com {horario.medico.nome}, {formatarData(horario.dataHora)} às{' '}
        {formatarHora(horario.dataHora)}.
      </p>

      {erro && <Alerta>{erro}</Alerta>}

      <form className="filtros" onSubmit={buscar}>
        <Campo
          id="busca-paciente"
          rotulo="Nome ou CPF do paciente"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          autoFocus
        />
        <button type="submit" className="botao botao-contorno" disabled={buscando}>
          {buscando ? 'Buscando...' : 'Buscar'}
        </button>
      </form>

      {resultados && resultados.length === 0 && (
        <p className="texto-suave">
          Nenhum paciente encontrado. O paciente precisa ter conta no AgendaLab.
        </p>
      )}

      {resultados && resultados.length > 0 && (
        <ul className="lista-pacientes">
          {resultados.map((paciente) => (
            <li key={paciente._id}>
              <div>
                <strong>{paciente.nome}</strong>
                <span className="texto-suave">
                  {mascaraTelefone(paciente.telefone)}, {paciente.convenio}
                </span>
              </div>
              <button
                type="button"
                className="botao botao-pequeno"
                disabled={Boolean(marcandoId)}
                onClick={() => marcar(paciente)}
              >
                {marcandoId === paciente._id ? 'Marcando...' : 'Marcar'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  )
}

export default MarcarParaPaciente
