import { useEffect, useState } from 'react'
import api from '../api/api'
import useAgora from '../hooks/useAgora'
import Alerta from './Alerta'
import Campo from './Campo'
import Spinner from './Spinner'
import TabelaConsultas from './TabelaConsultas'
import { mensagemErro } from '../utils/erros'

// Aba "Por médico": cada médico abre uma sanfona com as consultas dele
function ConsultasPorMedico({ versao, onDetalhes }) {
  const agora = useAgora()
  const [medicos, setMedicos] = useState(null)
  const [filtro, setFiltro] = useState('')
  const [abertos, setAbertos] = useState([])
  const [consultasPorMedico, setConsultasPorMedico] = useState({})
  const [erro, setErro] = useState('')

  useEffect(() => {
    api
      .get('/medicos')
      .then((resposta) => setMedicos(resposta.data))
      .catch((falha) => setErro(mensagemErro(falha)))
  }, [])

  // Carrega (ou recarrega) as consultas dos médicos que estão abertos
  useEffect(() => {
    if (abertos.length === 0) return

    let ativo = true
    Promise.all(
      abertos.map((id) =>
        api.get('/horarios/busca', { params: { medico: id } }).then((resposta) => [id, resposta.data])
      )
    )
      .then((pares) => ativo && setConsultasPorMedico(Object.fromEntries(pares)))
      .catch((falha) => ativo && setErro(mensagemErro(falha)))
    return () => {
      ativo = false
    }
  }, [abertos, versao])

  function alternar(id) {
    setAbertos((atuais) =>
      atuais.includes(id) ? atuais.filter((aberto) => aberto !== id) : [...atuais, id]
    )
  }

  // Próximas primeiro (em ordem), depois as que já passaram (da mais recente para a mais antiga)
  function ordenar(consultas) {
    const proximas = consultas.filter((consulta) => new Date(consulta.dataHora) > agora)
    const passadas = consultas.filter((consulta) => new Date(consulta.dataHora) <= agora).reverse()
    return [...proximas, ...passadas]
  }

  const termo = filtro.trim().toLowerCase()
  const visiveis = (medicos || []).filter(
    (medico) =>
      medico.nome.toLowerCase().includes(termo) ||
      medico.especialidade?.nome.toLowerCase().includes(termo)
  )

  return (
    <>
      {erro && <Alerta>{erro}</Alerta>}

      <div className="filtros">
        <Campo
          id="filtro-medico"
          rotulo="Filtrar por nome do médico ou especialidade"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          autoComplete="off"
        />
      </div>

      {!medicos && !erro && <Spinner texto="Carregando médicos..." />}

      {medicos && visiveis.length === 0 && (
        <p className="texto-suave">Nenhum médico encontrado.</p>
      )}

      <ul className="medicos-lista">
        {visiveis.map((medico) => {
          const aberto = abertos.includes(medico._id)
          const consultas = consultasPorMedico[medico._id]
          return (
            <li key={medico._id} className="medico-item">
              <div className="medico-topo">
                <div>
                  <strong>{medico.nome}</strong>
                  <span className="texto-suave">{medico.especialidade?.nome}</span>
                </div>
                <button
                  type="button"
                  className="botao botao-contorno botao-pequeno"
                  aria-expanded={aberto}
                  aria-controls={`consultas-${medico._id}`}
                  onClick={() => alternar(medico._id)}
                >
                  {aberto ? 'Esconder consultas' : 'Ver consultas'}
                </button>
              </div>

              {aberto && (
                <div id={`consultas-${medico._id}`} className="medico-consultas">
                  {!consultas && <Spinner texto="Carregando consultas..." />}
                  {consultas && consultas.length === 0 && (
                    <p className="texto-suave">Nenhuma consulta marcada com este médico.</p>
                  )}
                  {consultas && consultas.length > 0 && (
                    <TabelaConsultas
                      consultas={ordenar(consultas)}
                      agora={agora}
                      onDetalhes={onDetalhes}
                      mostrarMedico={false}
                    />
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </>
  )
}

export default ConsultasPorMedico
