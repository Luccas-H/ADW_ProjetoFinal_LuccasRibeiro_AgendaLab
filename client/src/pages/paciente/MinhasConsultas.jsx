import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import api from '../../api/api'
import useAgora from '../../hooks/useAgora'
import useEvento from '../../hooks/useEvento'
import Alerta from '../../components/Alerta'
import Spinner from '../../components/Spinner'
import { formatarData, formatarHora } from '../../utils/formatar'
import { mensagemErro } from '../../utils/erros'

function CartaoConsulta({ consulta, passou, onDesmarcar }) {
  const data = new Date(consulta.dataHora)
  const diaDaSemana = data.toLocaleDateString('pt-BR', { weekday: 'long' })

  return (
    <li className={passou ? 'consulta consulta-passada' : 'consulta'}>
      <div className="consulta-data" aria-hidden="true">
        <strong>{data.getDate()}</strong>
        <small>{data.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</small>
      </div>
      <div className="consulta-info">
        <strong>{consulta.especialidade.nome}</strong>
        <span>{consulta.medico.nome}</span>
        <span className="texto-suave">
          {diaDaSemana}, {formatarData(consulta.dataHora)} às {formatarHora(consulta.dataHora)}
        </span>
      </div>
      {!passou && (
        <button
          type="button"
          className="botao botao-perigo botao-pequeno"
          onClick={() => onDesmarcar(consulta)}
        >
          Desmarcar
        </button>
      )}
    </li>
  )
}

function MinhasConsultas() {
  const agora = useAgora()
  const location = useLocation()
  const [consultas, setConsultas] = useState(null)
  const [versao, setVersao] = useState(0)
  const [erro, setErro] = useState('')
  // Mensagem enviada pela tela de agendar depois de marcar a consulta
  const [sucesso, setSucesso] = useState(location.state?.mensagem || '')

  useEffect(() => {
    let ativo = true
    api
      .get('/horarios/meus')
      .then((resposta) => ativo && setConsultas(resposta.data))
      .catch((falha) => ativo && setErro(mensagemErro(falha)))
    return () => {
      ativo = false
    }
  }, [versao])

  function recarregar() {
    setVersao((atual) => atual + 1)
  }

  // Se a recepção desmarcar uma consulta, a lista atualiza sozinha
  useEvento('horarios:mudou', recarregar)

  async function desmarcar(consulta) {
    const quando = `${formatarData(consulta.dataHora)} às ${formatarHora(consulta.dataHora)}`
    if (!window.confirm(`Desmarcar a consulta de ${consulta.especialidade.nome} em ${quando}?`)) {
      return
    }

    setErro('')
    setSucesso('')
    try {
      await api.patch(`/horarios/${consulta._id}/cancelar`)
      setSucesso('Consulta desmarcada.')
      recarregar()
    } catch (falha) {
      setErro(mensagemErro(falha))
    }
  }

  const proximas = (consultas || []).filter((consulta) => new Date(consulta.dataHora) > agora)
  const anteriores = (consultas || [])
    .filter((consulta) => new Date(consulta.dataHora) <= agora)
    .reverse()

  return (
    <div className="container pagina caixa-formulario">
      <div className="cabecalho-pagina">
        <h1>Minhas consultas</h1>
        <Link to="/paciente/agendar" className="botao">
          Agendar consulta
        </Link>
      </div>

      {erro && <Alerta>{erro}</Alerta>}
      {sucesso && <Alerta tipo="sucesso">{sucesso}</Alerta>}
      {!consultas && !erro && <Spinner texto="Carregando suas consultas..." />}

      {consultas && consultas.length === 0 && (
        <p className="texto-suave">
          Você ainda não tem consultas. <Link to="/paciente/agendar">Agende a primeira</Link>.
        </p>
      )}

      {proximas.length > 0 && (
        <>
          <h2>Próximas</h2>
          <ul className="lista-consultas">
            {proximas.map((consulta) => (
              <CartaoConsulta key={consulta._id} consulta={consulta} onDesmarcar={desmarcar} />
            ))}
          </ul>
        </>
      )}

      {anteriores.length > 0 && (
        <>
          <h2>Anteriores</h2>
          <ul className="lista-consultas">
            {anteriores.map((consulta) => (
              <CartaoConsulta key={consulta._id} consulta={consulta} passou />
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

export default MinhasConsultas
