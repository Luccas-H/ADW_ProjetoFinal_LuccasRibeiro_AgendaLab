import { useEffect, useState } from 'react'
import api from '../api/api'
import Alerta from './Alerta'
import Campo from './Campo'
import Modal from './Modal'
import { apenasDigitos, formatarData, formatarHora, mascaraTelefone } from '../utils/formatar'
import { mensagemErro } from '../utils/erros'

// Texto só com números, pontos e traço: a pessoa está digitando um CPF
function pareceCpf(texto) {
  return /^[\d.\-\s]+$/.test(texto)
}

// Só busca com 2 letras do nome ou com o CPF completo
function podeBuscar(texto) {
  if (pareceCpf(texto)) return apenasDigitos(texto).length === 11
  return texto.length >= 2
}

// Janela em que a recepção procura o paciente e marca o horário.
// Os resultados aparecem enquanto a pessoa digita.
function MarcarParaPaciente({ horario, onFechar, onMarcado }) {
  const [busca, setBusca] = useState('')
  const [resultados, setResultados] = useState(null)
  const [buscando, setBuscando] = useState(false)
  const [marcandoId, setMarcandoId] = useState(null)
  const [erro, setErro] = useState('')

  useEffect(() => {
    const texto = busca.trim()
    if (!podeBuscar(texto)) return

    let ativo = true
    // Espera a pessoa parar de digitar um instante antes de buscar
    const espera = setTimeout(async () => {
      try {
        const resposta = await api.get('/pacientes/busca', { params: { q: texto } })
        if (ativo) setResultados(resposta.data)
      } catch (falha) {
        if (ativo) setErro(mensagemErro(falha))
      } finally {
        if (ativo) setBuscando(false)
      }
    }, 300)

    return () => {
      ativo = false
      clearTimeout(espera)
    }
  }, [busca])

  function digitar(valor) {
    setBusca(valor)
    setErro('')
    if (podeBuscar(valor.trim())) {
      setBuscando(true)
    } else {
      setBuscando(false)
      setResultados(null)
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

  const texto = busca.trim()
  let dica = 'Digite pelo menos 2 letras do nome ou o CPF completo.'
  if (texto && pareceCpf(texto) && apenasDigitos(texto).length < 11) {
    dica = 'Continue digitando: o CPF precisa ter os 11 números.'
  } else if (buscando) {
    dica = 'Procurando...'
  }

  return (
    <Modal titulo="Marcar consulta" onFechar={onFechar}>
      <p className="texto-suave">
        {horario.especialidade.nome} com {horario.medico.nome}, {formatarData(horario.dataHora)} às{' '}
        {formatarHora(horario.dataHora)}.
      </p>

      {erro && <Alerta>{erro}</Alerta>}

      <Campo
        id="busca-paciente"
        rotulo="Nome ou CPF do paciente"
        value={busca}
        onChange={(e) => digitar(e.target.value)}
        autoComplete="off"
        autoFocus
      />
      <p className="dica" aria-live="polite">
        {dica}
      </p>

      {resultados && !buscando && resultados.length === 0 && (
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
