import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/api'
import useAgora from '../../hooks/useAgora'
import useEvento from '../../hooks/useEvento'
import Alerta from '../../components/Alerta'
import Calendario from '../../components/Calendario'
import Campo from '../../components/Campo'
import Spinner from '../../components/Spinner'
import { formatarData, formatarHora } from '../../utils/formatar'
import { fimDoMes, horariosDoDia, inicioDoMes, marcarDias } from '../../utils/calendario'
import { mensagemErro } from '../../utils/erros'

function Agendar() {
  const agora = useAgora()
  const [especialidades, setEspecialidades] = useState([])
  const [especialidade, setEspecialidade] = useState('')
  const [mes, setMes] = useState(() => inicioDoMes(new Date()))
  const [horarios, setHorarios] = useState([])
  const [carregando, setCarregando] = useState(false)
  const [versao, setVersao] = useState(0)
  const [selecionado, setSelecionado] = useState(null)
  const [escolhido, setEscolhido] = useState(null)
  const [confirmando, setConfirmando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  useEffect(() => {
    api
      .get('/especialidades')
      .then((resposta) => setEspecialidades(resposta.data))
      .catch((falha) => setErro(mensagemErro(falha)))
  }, [])

  useEffect(() => {
    if (!especialidade) return

    let ativo = true
    const params = { especialidade, inicio: mes.toISOString(), fim: fimDoMes(mes).toISOString() }
    api
      .get('/horarios', { params })
      .then((resposta) => ativo && setHorarios(resposta.data))
      .catch((falha) => ativo && setErro(mensagemErro(falha)))
      .finally(() => ativo && setCarregando(false))
    return () => {
      ativo = false
    }
  }, [especialidade, mes, versao])

  // Se alguém marcar ou desmarcar nessa especialidade, a tela atualiza sozinha
  useEvento('horarios:mudou', (dados) => {
    if (dados.especialidade === especialidade) {
      setVersao((atual) => atual + 1)
    }
  })

  function escolherEspecialidade(id) {
    setEspecialidade(id)
    setCarregando(Boolean(id))
    setHorarios([])
    setSelecionado(null)
    setEscolhido(null)
    setErro('')
    setSucesso('')
  }

  function mudarMes(novoMes) {
    setMes(novoMes)
    setCarregando(true)
    setSelecionado(null)
    setEscolhido(null)
  }

  function escolherDia(chave) {
    setSelecionado(chave)
    setEscolhido(null)
    setSucesso('')
  }

  async function confirmar() {
    setConfirmando(true)
    setErro('')
    try {
      await api.patch(`/horarios/${escolhido._id}/agendar`)
      setSucesso(
        `Consulta marcada: ${escolhido.especialidade.nome} com ${escolhido.medico.nome}, ` +
          `${formatarData(escolhido.dataHora)} às ${formatarHora(escolhido.dataHora)}.`
      )
      setEscolhido(null)
    } catch (falha) {
      setErro(mensagemErro(falha))
      setEscolhido(null)
    } finally {
      setConfirmando(false)
      setVersao((atual) => atual + 1)
    }
  }

  const doDia = selecionado ? horariosDoDia(horarios, selecionado) : []
  // O horário escolhido pode ter sido ocupado por outra pessoa enquanto a tela estava aberta
  const escolhidoAtual = escolhido && horarios.find((horario) => horario._id === escolhido._id)
  const escolhidoOcupado = escolhido && escolhidoAtual && !escolhidoAtual.livre

  return (
    <div className="container pagina">
      <h1>Agendar consulta</h1>

      {erro && <Alerta>{erro}</Alerta>}
      {sucesso && (
        <Alerta tipo="sucesso">
          {sucesso} <Link to="/paciente/consultas">Ver minhas consultas</Link>
        </Alerta>
      )}

      <div className="filtros">
        <Campo id="especialidade" rotulo="Especialidade">
          <select
            id="especialidade"
            value={especialidade}
            onChange={(e) => escolherEspecialidade(e.target.value)}
          >
            <option value="">Escolha a especialidade</option>
            {especialidades.map((item) => (
              <option key={item._id} value={item._id}>
                {item.nome}
              </option>
            ))}
          </select>
        </Campo>
      </div>

      {!especialidade && (
        <p className="texto-suave">Escolha a especialidade para ver os dias com horário livre.</p>
      )}

      {especialidade && (
        <div className="agenda">
          <div className="agenda-lateral">
            <Calendario
              mes={mes}
              marcacoes={marcarDias(horarios, agora)}
              selecionado={selecionado}
              onSelecionar={escolherDia}
              onMudarMes={mudarMes}
            />
          </div>

          <section aria-live="polite">
            {carregando && <Spinner texto="Carregando horários..." />}

            {!carregando && !selecionado && (
              <p className="texto-suave">
                {horarios.length > 0
                  ? 'Escolha no calendário um dia marcado com o ponto verde.'
                  : 'Não há horários abertos neste mês. Veja o próximo mês ou outra especialidade.'}
              </p>
            )}

            {selecionado && (
              <>
                <h2 className="titulo-dia">
                  {new Date(`${selecionado}T12:00`).toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long'
                  })}
                </h2>

                <div className="horarios">
                  {doDia.map((horario) => {
                    const passou = new Date(horario.dataHora) <= agora
                    if (horario.meu) {
                      return (
                        <span key={horario._id} className="horario-meu">
                          {formatarHora(horario.dataHora)}
                          <small>Sua consulta</small>
                        </span>
                      )
                    }
                    if (!horario.livre || passou) {
                      return (
                        <button key={horario._id} type="button" className="horario-ocupado" disabled>
                          {formatarHora(horario.dataHora)}
                          <small>{passou ? 'Já passou' : 'Ocupado'}</small>
                        </button>
                      )
                    }
                    return (
                      <button
                        key={horario._id}
                        type="button"
                        className="horario-livre"
                        aria-pressed={escolhido?._id === horario._id}
                        onClick={() => {
                          setEscolhido(horario)
                          setErro('')
                          setSucesso('')
                        }}
                      >
                        {formatarHora(horario.dataHora)}
                        <small>{horario.medico.nome}</small>
                      </button>
                    )
                  })}
                </div>

                {escolhidoOcupado && (
                  <Alerta>Esse horário acabou de ser ocupado por outra pessoa. Escolha outro.</Alerta>
                )}

                {escolhido && !escolhidoOcupado && (
                  <div className="confirmacao">
                    <p>
                      Confirmar consulta de <strong>{escolhido.especialidade.nome}</strong> com{' '}
                      <strong>{escolhido.medico.nome}</strong> em{' '}
                      <strong>{formatarData(escolhido.dataHora)}</strong> às{' '}
                      <strong>{formatarHora(escolhido.dataHora)}</strong>?
                    </p>
                    <div className="acoes-form">
                      <button
                        type="button"
                        className="botao"
                        disabled={confirmando}
                        onClick={confirmar}
                      >
                        {confirmando && <span className="spinner" aria-hidden="true" />}
                        {confirmando ? 'Marcando...' : 'Confirmar consulta'}
                      </button>
                      <button
                        type="button"
                        className="botao botao-contorno"
                        onClick={() => setEscolhido(null)}
                      >
                        Escolher outro horário
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

export default Agendar
