import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/api'
import useEvento from '../hooks/useEvento'
import { formatarData, formatarHora } from '../utils/formatar'

// Sino do paciente: avisos de quando a recepção marca, remarca ou desmarca uma consulta dele
function SinoNotificacoes() {
  const [aberto, setAberto] = useState(false)
  const [notificacoes, setNotificacoes] = useState([])
  const [naoLidas, setNaoLidas] = useState(0)
  // Quantos avisos do topo da lista eram novos quando a lista foi aberta
  const [destaque, setDestaque] = useState(0)
  const caixa = useRef(null)

  useEffect(() => {
    api
      .get('/notificacoes')
      .then((resposta) => {
        setNotificacoes(resposta.data.notificacoes)
        setNaoLidas(resposta.data.naoLidas)
      })
      .catch(() => {
        // O sino não é essencial: se falhar, o resto da página segue normal
      })
  }, [])

  useEvento('notificacao:nova', (nova) => {
    setNotificacoes((atuais) => [nova, ...atuais].slice(0, 20))
    if (aberto) {
      setDestaque((atual) => atual + 1)
      api.patch('/notificacoes/lidas').catch(() => {})
    } else {
      setNaoLidas((atual) => atual + 1)
    }
  })

  // Fecha ao clicar fora ou apertar Esc
  useEffect(() => {
    if (!aberto) return

    function cliqueFora(evento) {
      if (!caixa.current.contains(evento.target)) setAberto(false)
    }
    function tecla(evento) {
      if (evento.key === 'Escape') setAberto(false)
    }
    document.addEventListener('mousedown', cliqueFora)
    document.addEventListener('keydown', tecla)
    return () => {
      document.removeEventListener('mousedown', cliqueFora)
      document.removeEventListener('keydown', tecla)
    }
  }, [aberto])

  function alternar() {
    if (aberto) {
      setAberto(false)
      return
    }
    setAberto(true)
    setDestaque(naoLidas)
    if (naoLidas > 0) {
      setNaoLidas(0)
      api.patch('/notificacoes/lidas').catch(() => {})
    }
  }

  let rotulo = 'Avisos'
  if (naoLidas === 1) rotulo = 'Avisos: 1 novo'
  if (naoLidas > 1) rotulo = `Avisos: ${naoLidas} novos`

  return (
    <div className="sino" ref={caixa}>
      <button
        type="button"
        className="sino-botao"
        aria-label={rotulo}
        aria-expanded={aberto}
        aria-controls="lista-avisos"
        onClick={alternar}
      >
        <svg
          viewBox="0 0 24 24"
          width="22"
          height="22"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {naoLidas > 0 && <span className="sino-contador">{naoLidas > 9 ? '9+' : naoLidas}</span>}
      </button>

      {aberto && (
        <div id="lista-avisos" className="sino-lista">
          <strong className="sino-titulo">Avisos</strong>

          {notificacoes.length === 0 ? (
            <p className="sino-vazio">
              Nenhum aviso por enquanto. Quando a recepção mexer em uma consulta sua, aparece aqui.
            </p>
          ) : (
            <ul>
              {notificacoes.map((notificacao, indice) => (
                <li key={notificacao._id} className={indice < destaque ? 'aviso-novo' : ''}>
                  <p>{notificacao.mensagem}</p>
                  <small>
                    {formatarData(notificacao.createdAt)} às {formatarHora(notificacao.createdAt)}
                  </small>
                </li>
              ))}
            </ul>
          )}

          <Link to="/paciente/consultas" className="sino-rodape" onClick={() => setAberto(false)}>
            Ver minhas consultas
          </Link>
        </div>
      )}
    </div>
  )
}

export default SinoNotificacoes
