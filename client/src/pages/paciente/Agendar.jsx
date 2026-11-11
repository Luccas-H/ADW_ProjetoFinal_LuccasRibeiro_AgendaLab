import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../api/api'
import useAgora from '../../hooks/useAgora'
import useEvento from '../../hooks/useEvento'
import Alerta from '../../components/Alerta'
import Calendario from '../../components/Calendario'
import Spinner from '../../components/Spinner'
import { formatarData, formatarHora } from '../../utils/formatar'
import { fimDoMes, horariosDoDia, inicioDoMes, marcarDias } from '../../utils/calendario'
import { mensagemErro } from '../../utils/erros'

const PASSOS = ['Especialidade', 'Dia', 'Horário', 'Confirmação']
const DIAS_PARA_PROCURAR = 30
const UM_DIA = 24 * 60 * 60 * 1000

// "qui, 12/11 às 08:00"
function formatarProximo(iso) {
  const data = new Date(iso)
  const diaDaSemana = data.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')
  const dia = data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  return `${diaDaSemana}, ${dia} às ${formatarHora(iso)}`
}

function Passos({ atual }) {
  return (
    <ol className="passos" aria-label="Etapas do agendamento">
      {PASSOS.map((nome, indice) => {
        let classe = ''
        if (indice < atual) classe = 'feito'
        if (indice === atual) classe = 'atual'
        return (
          <li key={nome} className={classe} aria-current={indice === atual ? 'step' : undefined}>
            {nome}
          </li>
        )
      })}
    </ol>
  )
}

function Agendar() {
  const agora = useAgora()
  const navigate = useNavigate()

  // Primeira etapa: cartões das especialidades
  const [especialidades, setEspecialidades] = useState([])
  const [proximosLivres, setProximosLivres] = useState({})
  const [proximaConsulta, setProximaConsulta] = useState(null)
  const [carregandoInicio, setCarregandoInicio] = useState(true)
  const [versaoInicio, setVersaoInicio] = useState(0)

  // Depois de escolher a especialidade: calendário e horários
  const [especialidade, setEspecialidade] = useState(null)
  const [mes, setMes] = useState(() => inicioDoMes(new Date()))
  const [horarios, setHorarios] = useState([])
  const [carregando, setCarregando] = useState(false)
  const [versao, setVersao] = useState(0)
  const [selecionado, setSelecionado] = useState(null)
  const [escolhido, setEscolhido] = useState(null)
  const [confirmando, setConfirmando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    let ativo = true
    const inicio = new Date()
    const fim = new Date(inicio.getTime() + DIAS_PARA_PROCURAR * UM_DIA)

    Promise.all([
      api.get('/especialidades'),
      api.get('/horarios', { params: { inicio: inicio.toISOString(), fim: fim.toISOString() } }),
      api.get('/horarios/meus')
    ])
      .then(([respEspecialidades, respHorarios, respMinhas]) => {
        if (!ativo) return
        // Os horários vêm em ordem; o primeiro livre de cada especialidade é o próximo
        const proximos = {}
        for (const horario of respHorarios.data) {
          if (horario.livre && !proximos[horario.especialidade._id]) {
            proximos[horario.especialidade._id] = horario.dataHora
          }
        }
        setEspecialidades(respEspecialidades.data)
        setProximosLivres(proximos)
        setProximaConsulta(respMinhas.data.find((consulta) => new Date(consulta.dataHora) > inicio))
      })
      .catch((falha) => ativo && setErro(mensagemErro(falha)))
      .finally(() => ativo && setCarregandoInicio(false))

    return () => {
      ativo = false
    }
  }, [versaoInicio])

  useEffect(() => {
    if (!especialidade) return

    let ativo = true
    const params = {
      especialidade: especialidade._id,
      inicio: mes.toISOString(),
      fim: fimDoMes(mes).toISOString()
    }
    api
      .get('/horarios', { params })
      .then((resposta) => ativo && setHorarios(resposta.data))
      .catch((falha) => ativo && setErro(mensagemErro(falha)))
      .finally(() => ativo && setCarregando(false))
    return () => {
      ativo = false
    }
  }, [especialidade, mes, versao])

  // Se alguém marcar ou desmarcar, a tela atualiza sozinha
  useEvento('horarios:mudou', (dados) => {
    if (!especialidade) {
      setVersaoInicio((atual) => atual + 1)
    } else if (dados.especialidade === especialidade._id) {
      setVersao((atual) => atual + 1)
    }
  })

  function limparAvisos() {
    setErro('')
  }

  // Abre o calendário no mês do próximo horário livre; o dia a pessoa escolhe
  function escolherEspecialidade(item) {
    const proximo = proximosLivres[item._id]
    setEspecialidade(item)
    setCarregando(true)
    setHorarios([])
    setSelecionado(null)
    setEscolhido(null)
    limparAvisos()
    setMes(inicioDoMes(proximo ? new Date(proximo) : new Date()))
  }

  function trocarEspecialidade() {
    setEspecialidade(null)
    setSelecionado(null)
    setEscolhido(null)
    limparAvisos()
    setVersaoInicio((atual) => atual + 1)
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
  }

  // Deu certo: vai para Minhas consultas, que mostra a mensagem de sucesso.
  // Deu errado: continua aqui, com o erro e os horários atualizados.
  async function confirmar() {
    setConfirmando(true)
    setErro('')
    try {
      await api.patch(`/horarios/${escolhido._id}/agendar`)
      const mensagem =
        `Consulta marcada: ${escolhido.especialidade.nome} com ${escolhido.medico.nome}, ` +
        `${formatarData(escolhido.dataHora)} às ${formatarHora(escolhido.dataHora)}.`
      navigate('/paciente/consultas', { state: { mensagem } })
    } catch (falha) {
      setErro(mensagemErro(falha))
      setEscolhido(null)
      setConfirmando(false)
      setVersao((atual) => atual + 1)
    }
  }

  const doDia = selecionado ? horariosDoDia(horarios, selecionado) : []
  const proximoDaEspecialidade = especialidade ? proximosLivres[especialidade._id] : null
  // O horário escolhido pode ter sido ocupado por outra pessoa enquanto a tela estava aberta
  const escolhidoAtual = escolhido && horarios.find((horario) => horario._id === escolhido._id)
  const escolhidoOcupado = escolhido && escolhidoAtual && !escolhidoAtual.livre

  let passoAtual = 0
  if (especialidade) passoAtual = 1
  if (especialidade && selecionado) passoAtual = 2
  if (escolhido && !escolhidoOcupado) passoAtual = 3

  // Especialidades com vaga primeiro; dentro de cada grupo, a ordem alfabética da API
  const ordenadas = [...especialidades].sort(
    (a, b) => Boolean(proximosLivres[b._id]) - Boolean(proximosLivres[a._id])
  )

  return (
    <div className="container pagina">
      <h1>Agendar consulta</h1>
      <p className="texto-suave">
        Escolha a especialidade, depois o dia e o horário. Leva menos de um minuto.
      </p>

      <Passos atual={passoAtual} />

      {erro && <Alerta>{erro}</Alerta>}

      {!especialidade && (
        <>
          {proximaConsulta && (
            <div className="proxima-consulta">
              <span>
                Sua próxima consulta: <strong>{proximaConsulta.especialidade.nome}</strong> com{' '}
                {proximaConsulta.medico.nome}, {formatarProximo(proximaConsulta.dataHora)}.
              </span>
              <Link to="/paciente/consultas">Ver minhas consultas</Link>
            </div>
          )}

          <h2 className="titulo-etapa">Qual especialidade você procura?</h2>

          {carregandoInicio && <Spinner texto="Carregando especialidades..." />}

          {!carregandoInicio && especialidades.length === 0 && (
            <p className="texto-suave">Nenhuma especialidade cadastrada ainda.</p>
          )}

          {!carregandoInicio && especialidades.length > 0 && (
            <div className="cartoes-especialidade">
              {ordenadas.map((item) => {
                const proximo = proximosLivres[item._id]
                return (
                  <button
                    key={item._id}
                    type="button"
                    className="cartao-especialidade"
                    disabled={!proximo}
                    onClick={() => escolherEspecialidade(item)}
                  >
                    <strong>{item.nome}</strong>
                    {item.descricao && <span className="descricao">{item.descricao}</span>}
                    <span className={proximo ? 'proximo-horario' : 'sem-horario'}>
                      {proximo
                        ? `Próximo horário: ${formatarProximo(proximo)}`
                        : 'Sem horários livres por enquanto'}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </>
      )}

      {especialidade && (
        <>
          <div className="especialidade-escolhida">
            <div>
              <span className="texto-suave">Especialidade</span>
              <h2>{especialidade.nome}</h2>
            </div>
            <button
              type="button"
              className="botao botao-contorno botao-pequeno"
              onClick={trocarEspecialidade}
            >
              Trocar especialidade
            </button>
          </div>

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
                  {proximoDaEspecialidade &&
                    `O próximo horário livre é ${formatarProximo(proximoDaEspecialidade)}. `}
                  {horarios.length > 0
                    ? 'Escolha no calendário um dia com o ponto verde.'
                    : 'Não há horários abertos neste mês. Veja o próximo mês.'}
                </p>
              )}

              {!carregando && selecionado && (
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
                            limparAvisos()
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
        </>
      )}
    </div>
  )
}

export default Agendar
