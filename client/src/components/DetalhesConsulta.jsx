import { useEffect, useState } from 'react'
import api from '../api/api'
import useAgora from '../hooks/useAgora'
import useEvento from '../hooks/useEvento'
import Alerta from './Alerta'
import Calendario from './Calendario'
import Modal from './Modal'
import Spinner from './Spinner'
import { formatarData, formatarHora, mascaraTelefone } from '../utils/formatar'
import { fimDoMes, horariosDoDia, inicioDoMes, marcarDias } from '../utils/calendario'
import { mensagemErro } from '../utils/erros'

// Janela com os dados da consulta. Daqui a recepção desmarca ou remarca
// (para qualquer horário livre da mesma especialidade, com qualquer médico).
function DetalhesConsulta({ consulta, onFechar, onAlterada }) {
  const agora = useAgora()
  const [modo, setModo] = useState('detalhes')
  const [mes, setMes] = useState(() => inicioDoMes(new Date(consulta.dataHora)))
  const [horarios, setHorarios] = useState([])
  const [carregando, setCarregando] = useState(false)
  const [versao, setVersao] = useState(0)
  const [selecionado, setSelecionado] = useState(null)
  const [escolhido, setEscolhido] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  const futura = new Date(consulta.dataHora) > agora
  const especialidadeId = consulta.especialidade._id

  // Se outra pessoa ocupar um horário enquanto a janela está aberta, a lista se atualiza
  useEvento('horarios:mudou', () => setVersao((atual) => atual + 1))

  useEffect(() => {
    if (modo !== 'remarcar') return

    let ativo = true
    const params = {
      especialidade: especialidadeId,
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
  }, [modo, mes, versao, especialidadeId])

  function comecarRemarcacao() {
    setModo('remarcar')
    setCarregando(true)
    setErro('')
  }

  function voltarAosDetalhes() {
    setModo('detalhes')
    setSelecionado(null)
    setEscolhido(null)
    setErro('')
  }

  function mudarMes(novoMes) {
    setMes(novoMes)
    setCarregando(true)
    setSelecionado(null)
    setEscolhido(null)
  }

  async function desmarcar() {
    if (!window.confirm(`Desmarcar a consulta de ${consulta.paciente?.nome}?`)) return

    setEnviando(true)
    setErro('')
    try {
      await api.patch(`/horarios/${consulta._id}/cancelar`)
      onAlterada('Consulta desmarcada. O horário ficou livre e o paciente foi avisado.')
    } catch (falha) {
      setErro(mensagemErro(falha))
      setEnviando(false)
    }
  }

  async function confirmarRemarcacao() {
    setEnviando(true)
    setErro('')
    try {
      const resposta = await api.patch(`/horarios/${consulta._id}/remarcar`, {
        novoHorarioId: escolhido._id
      })
      const nova = resposta.data
      onAlterada(
        `Consulta de ${consulta.paciente?.nome} remarcada para ${formatarData(nova.dataHora)} às ` +
          `${formatarHora(nova.dataHora)} com ${nova.medico.nome}. O paciente foi avisado.`
      )
    } catch (falha) {
      // Alguém pode ter ocupado o horário: mostra o erro e recarrega os livres
      setErro(mensagemErro(falha))
      setEscolhido(null)
      setEnviando(false)
      setVersao((atual) => atual + 1)
    }
  }

  const livresDoDia = selecionado
    ? horariosDoDia(horarios, selecionado).filter(
        (horario) => horario.livre && new Date(horario.dataHora) > agora
      )
    : []

  if (modo === 'detalhes') {
    return (
      <Modal titulo="Detalhes da consulta" onFechar={onFechar}>
        {erro && <Alerta>{erro}</Alerta>}
        <dl className="ficha">
          <dt>Paciente</dt>
          <dd>{consulta.paciente?.nome}</dd>
          <dt>Telefone</dt>
          <dd>{mascaraTelefone(consulta.paciente?.telefone)}</dd>
          <dt>Convênio</dt>
          <dd>{consulta.paciente?.convenio}</dd>
          <dt>Especialidade</dt>
          <dd>{consulta.especialidade.nome}</dd>
          <dt>Médico</dt>
          <dd>{consulta.medico.nome}</dd>
          <dt>Data</dt>
          <dd>
            {new Date(consulta.dataHora).toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            })}
          </dd>
          <dt>Hora</dt>
          <dd>{formatarHora(consulta.dataHora)}</dd>
          <dt>Situação</dt>
          <dd>{futura ? 'Marcada' : 'Já aconteceu'}</dd>
        </dl>

        {futura && (
          <div className="acoes-form acoes-detalhes">
            <button type="button" className="botao" onClick={comecarRemarcacao}>
              Remarcar
            </button>
            <button type="button" className="botao botao-perigo" disabled={enviando} onClick={desmarcar}>
              Desmarcar
            </button>
          </div>
        )}
      </Modal>
    )
  }

  return (
    <Modal titulo="Remarcar consulta" largo onFechar={onFechar}>
      <p className="texto-suave">
        Consulta atual: {formatarData(consulta.dataHora)} às {formatarHora(consulta.dataHora)} com{' '}
        {consulta.medico.nome}. Escolha o novo dia e horário. Pode ser com qualquer médico de{' '}
        {consulta.especialidade.nome}.
      </p>

      {erro && <Alerta>{erro}</Alerta>}

      <div className="remarcar-grade">
        <Calendario
          mes={mes}
          marcacoes={marcarDias(horarios, agora)}
          selecionado={selecionado}
          onSelecionar={(chave) => {
            setSelecionado(chave)
            setEscolhido(null)
          }}
          onMudarMes={mudarMes}
        />

        <div>
          {carregando && <Spinner texto="Carregando horários..." />}

          {!carregando && !selecionado && (
            <p className="texto-suave">Escolha no calendário um dia com o ponto verde.</p>
          )}

          {!carregando && selecionado && livresDoDia.length === 0 && (
            <p className="texto-suave">Nenhum horário livre neste dia.</p>
          )}

          {!carregando && livresDoDia.length > 0 && (
            <div className="horarios">
              {livresDoDia.map((horario) => (
                <button
                  key={horario._id}
                  type="button"
                  className="horario-livre"
                  aria-pressed={escolhido?._id === horario._id}
                  onClick={() => setEscolhido(horario)}
                >
                  {formatarHora(horario.dataHora)}
                  <small>{horario.medico.nome}</small>
                </button>
              ))}
            </div>
          )}

          {escolhido && (
            <div className="confirmacao">
              <p>
                Remarcar para <strong>{formatarData(escolhido.dataHora)}</strong> às{' '}
                <strong>{formatarHora(escolhido.dataHora)}</strong> com{' '}
                <strong>{escolhido.medico.nome}</strong>?
              </p>
              <div className="acoes-form">
                <button
                  type="button"
                  className="botao"
                  disabled={enviando}
                  onClick={confirmarRemarcacao}
                >
                  {enviando && <span className="spinner" aria-hidden="true" />}
                  {enviando ? 'Remarcando...' : 'Confirmar remarcação'}
                </button>
                <button
                  type="button"
                  className="botao botao-contorno"
                  onClick={() => setEscolhido(null)}
                >
                  Escolher outro
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <button type="button" className="botao-link voltar-detalhes" onClick={voltarAosDetalhes}>
        Voltar aos detalhes
      </button>
    </Modal>
  )
}

export default DetalhesConsulta
