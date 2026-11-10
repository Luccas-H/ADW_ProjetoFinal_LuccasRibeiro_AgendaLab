import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import api from '../../api/api'
import useAuth from '../../hooks/useAuth'
import Spinner from '../../components/Spinner'
import Alerta from '../../components/Alerta'
import { areaInicial } from '../../utils/rotas'

function Home() {
  const { usuario } = useAuth()
  const [especialidades, setEspecialidades] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const location = useLocation()

  useEffect(() => {
    api
      .get('/especialidades')
      .then((resposta) => setEspecialidades(resposta.data))
      .catch(() => setErro('Não foi possível carregar as especialidades. Tente de novo em instantes.'))
      .finally(() => setCarregando(false))
  }, [])

  // O link "Especialidades" do menu leva para /#especialidades
  useEffect(() => {
    if (location.hash === '#especialidades' && !carregando) {
      document.getElementById('especialidades')?.scrollIntoView()
    }
  }, [location.hash, carregando])

  return (
    <>
      <section className="hero">
        <div className="container hero-conteudo">
          <div>
            <h1>Marque sua consulta sem pegar fila.</h1>
            <p className="hero-subtitulo">
              Escolha a especialidade, veja os horários livres e confirme em poucos cliques.
            </p>
            <div className="hero-acoes">
              {/* Quem já está logado vai direto para a própria área */}
              <Link to={usuario ? areaInicial(usuario.perfil) : '/login'} className="botao">
                {usuario && usuario.perfil !== 'paciente' ? 'Abrir o painel' : 'Agendar consulta'}
              </Link>
              {!usuario && (
                <Link to="/cadastro" className="botao botao-contorno">
                  Criar conta
                </Link>
              )}
            </div>
            <p className="aviso-emergencia">
              Em caso de emergência, ligue 192 (SAMU) ou vá direto ao pronto-socorro. O AgendaLab
              serve apenas para consultas marcadas.
            </p>
          </div>

          <div>
            <h2>Como funciona</h2>
            <ol className="passos">
              <li>
                <div>
                  <strong>Crie sua conta</strong>
                  <p>Leva poucos minutos e você só faz uma vez.</p>
                </div>
              </li>
              <li>
                <div>
                  <strong>Escolha especialidade e horário</strong>
                  <p>Os horários livres aparecem no calendário.</p>
                </div>
              </li>
              <li>
                <div>
                  <strong>Compareça no dia</strong>
                  <p>Suas consultas ficam em Minhas consultas, e dá para desmarcar se precisar.</p>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </section>

      <section id="especialidades" className="container secao">
        <h2>Especialidades atendidas</h2>

        {carregando && <Spinner texto="Carregando especialidades..." />}
        {erro && <Alerta>{erro}</Alerta>}
        {!carregando && !erro && especialidades.length === 0 && (
          <p className="texto-suave">Nenhuma especialidade cadastrada ainda.</p>
        )}

        {especialidades.length > 0 && (
          <ul className="lista-especialidades">
            {especialidades.map((especialidade) => (
              <li key={especialidade._id}>
                <strong>{especialidade.nome}</strong>
                {especialidade.descricao && <p>{especialidade.descricao}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}

export default Home
