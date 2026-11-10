import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/api'
import useEvento from '../../hooks/useEvento'
import useAgora from '../../hooks/useAgora'
import Alerta from '../../components/Alerta'
import Spinner from '../../components/Spinner'
import { formatarHora, mascaraTelefone } from '../../utils/formatar'
import { mensagemErro } from '../../utils/erros'

function Painel() {
  const [resumo, setResumo] = useState(null)
  const [versao, setVersao] = useState(0)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const agora = useAgora()

  useEffect(() => {
    let ativo = true
    api
      .get('/painel')
      .then((resposta) => ativo && setResumo(resposta.data))
      .catch((falha) => ativo && setErro(mensagemErro(falha)))
    return () => {
      ativo = false
    }
  }, [versao])

  function recarregar() {
    setVersao((atual) => atual + 1)
  }

  // Atualiza sozinho quando alguém marca, desmarca ou abre horário
  useEvento('horarios:mudou', recarregar)

  async function desmarcar(consulta) {
    if (!window.confirm(`Desmarcar a consulta de ${consulta.paciente.nome}?`)) return

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

  const hoje = agora.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  })

  return (
    <div className="container pagina">
      <div className="cabecalho-pagina">
        <div>
          <h1>Painel</h1>
          <p className="texto-suave subtitulo-data">{hoje}</p>
        </div>
        <Link to="/equipe/agenda" className="botao">
          Abrir horário
        </Link>
      </div>

      {erro && <Alerta>{erro}</Alerta>}
      {sucesso && <Alerta tipo="sucesso">{sucesso}</Alerta>}
      {!resumo && !erro && <Spinner texto="Carregando o painel..." />}

      {resumo && (
        <>
          <div className="numeros">
            <div className="numero">
              <strong>{resumo.consultasHoje}</strong>
              <span>consultas hoje</span>
            </div>
            <div className="numero">
              <strong>{resumo.livresProximos7Dias}</strong>
              <span>horários livres nos próximos 7 dias</span>
            </div>
            <div className="numero">
              <strong>{resumo.pacientes}</strong>
              <span>pacientes cadastrados</span>
            </div>
          </div>

          <h2>Consultas de hoje</h2>

          {resumo.hoje.length === 0 && (
            <p className="texto-suave">
              Nenhuma consulta marcada para hoje. Veja os outros dias na{' '}
              <Link to="/equipe/agenda">agenda</Link>.
            </p>
          )}

          {resumo.hoje.length > 0 && (
            <table className="tabela">
              <thead>
                <tr>
                  <th>Hora</th>
                  <th>Paciente</th>
                  <th>Telefone</th>
                  <th>Convênio</th>
                  <th>Especialidade</th>
                  <th>Médico</th>
                  <th>
                    <span className="somente-leitor">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {resumo.hoje.map((consulta) => {
                  const passou = new Date(consulta.dataHora) <= agora
                  return (
                    <tr key={consulta._id} className={passou ? 'linha-passada' : ''}>
                      <td data-label="Hora">
                        <strong>{formatarHora(consulta.dataHora)}</strong>
                      </td>
                      <td data-label="Paciente">{consulta.paciente?.nome}</td>
                      <td data-label="Telefone">{mascaraTelefone(consulta.paciente?.telefone)}</td>
                      <td data-label="Convênio">{consulta.paciente?.convenio}</td>
                      <td data-label="Especialidade">{consulta.especialidade.nome}</td>
                      <td data-label="Médico">{consulta.medico.nome}</td>
                      <td data-label="Ações">
                        <div className="acoes">
                          {!passou && (
                            <button
                              type="button"
                              className="botao botao-perigo botao-pequeno"
                              onClick={() => desmarcar(consulta)}
                            >
                              Desmarcar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  )
}

export default Painel
