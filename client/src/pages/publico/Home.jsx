import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import api from '../../api/api'
import useAuth from '../../hooks/useAuth'
import useAgora from '../../hooks/useAgora'
import Alerta from '../../components/Alerta'
import Calendario from '../../components/Calendario'
import Spinner from '../../components/Spinner'
import { chaveDia } from '../../utils/formatar'
import { inicioDoMes } from '../../utils/calendario'
import { CONVENIOS } from '../../utils/listas'
import { areaInicial } from '../../utils/rotas'

const PERFIS = [
  {
    titulo: 'Paciente',
    texto: 'Cria a conta, escolhe a especialidade e o horário, e desmarca quando precisar.'
  },
  {
    titulo: 'Recepção',
    texto: 'Abre horários, marca consultas por telefone e acompanha as consultas do dia.'
  },
  {
    titulo: 'Administração',
    texto: 'Cadastra especialidades, médicos e a equipe, e vê a ficha completa dos pacientes.'
  }
]

const RECURSOS = [
  ['Calendário com horários livres', 'Os dias com vaga aparecem marcados. É só escolher o horário.'],
  ['Sem horário duplicado', 'Quando alguém marca, o horário fica ocupado na hora para todos.'],
  ['Aviso em tempo real', 'A recepção é avisada assim que uma consulta é marcada.'],
  ['Dados protegidos', 'CPF, endereço e tipo sanguíneo só aparecem para a administração.']
]

const CLASSIFICACAO = [
  { cor: 'var(--manchester-vermelho)', nome: 'Emergência', tempo: 'atendimento imediato' },
  { cor: 'var(--manchester-laranja)', nome: 'Muito urgente', tempo: 'até 10 minutos' },
  { cor: 'var(--manchester-amarelo)', nome: 'Urgente', tempo: 'até 60 minutos' },
  { cor: 'var(--manchester-verde)', nome: 'Pouco urgente', tempo: 'até 120 minutos' },
  { cor: 'var(--manchester-azul)', nome: 'Não urgente', tempo: 'até 240 minutos' }
]

const listaConvenios = new Intl.ListFormat('pt-BR', { type: 'disjunction' }).format(CONVENIOS)

const DUVIDAS = [
  [
    'Posso marcar consulta para outra pessoa?',
    'Cada paciente precisa da própria conta. Se a pessoa não consegue usar o site, a recepção marca por telefone.'
  ],
  [
    'Posso ter duas consultas na mesma especialidade?',
    'Pelo site, uma por vez. O retorno é marcado pela recepção depois da consulta.'
  ],
  [
    'Como desmarco uma consulta?',
    'Entre na sua conta, abra Minhas consultas e clique em Desmarcar. O horário fica livre na hora.'
  ],
  [
    'Quem vê os meus dados?',
    'Você vê todos. A recepção vê só nome, telefone e convênio. O resto, só a administração.'
  ],
  ['Quais convênios posso informar?', `${listaConvenios}.`],
  ['E se for urgência?', 'Não use o agendamento. Ligue 192 (SAMU) ou vá direto ao pronto-socorro.']
]

// Dias de exemplo para a prévia do calendário: dias úteis a partir de amanhã
function marcacoesDeExemplo(agora) {
  const marcacoes = {}
  const dia = new Date(agora)
  let contador = 0
  while (contador < 8) {
    dia.setDate(dia.getDate() + 1)
    if (dia.getDay() === 0 || dia.getDay() === 6) continue
    marcacoes[chaveDia(dia)] = contador % 3 === 2 ? 'lotado' : 'livre'
    contador++
  }
  return marcacoes
}

function Home() {
  const { usuario } = useAuth()
  const agora = useAgora()
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

  // Os links do menu levam para /#secao. Espera a lista carregar para a posição ficar certa.
  useEffect(() => {
    if (location.hash && !carregando) {
      document.getElementById(location.hash.slice(1))?.scrollIntoView()
    }
  }, [location.hash, carregando])

  const marcacoes = marcacoesDeExemplo(agora)
  const diaDeExemplo = Object.keys(marcacoes)[0]

  return (
    <>
      <section className="hero">
        <div className="container hero-conteudo">
          <div>
            <h1>Agendamento de consultas simples para hospitais e consultórios.</h1>
            <p className="hero-subtitulo">
              O paciente marca pela internet, a recepção organiza a agenda e a administração cuida
              dos cadastros.
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
              Em caso de emergência, ligue 192 (SAMU). O agendamento é só para consultas marcadas.
            </p>
          </div>

          {/* Prévia da tela de agendamento, só para mostrar; não dá para clicar */}
          <figure className="previa" aria-hidden="true" inert>
            <Calendario
              mes={inicioDoMes(new Date(`${diaDeExemplo}T12:00`))}
              marcacoes={marcacoes}
              selecionado={diaDeExemplo}
              onSelecionar={() => {}}
              onMudarMes={() => {}}
            />
            <div className="horarios">
              <span className="horario-livre">
                08:00
                <small>Dra. Helena Prado</small>
              </span>
              <span className="horario-ocupado">
                09:00
                <small>Ocupado</small>
              </span>
              <span className="horario-livre">
                10:00
                <small>Dr. Paulo Sena</small>
              </span>
            </div>
          </figure>
        </div>
      </section>

      <section id="como-funciona" className="container secao">
        <h2>Como funciona</h2>
        <p className="secao-intro">Cada pessoa entra com o próprio usuário e vê só o que precisa.</p>
        <div className="perfis">
          {PERFIS.map((perfil) => (
            <div key={perfil.titulo} className="perfil">
              <h3>{perfil.titulo}</h3>
              <p>{perfil.texto}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="recursos" className="faixa-branca">
        <div className="container secao">
          <h2>Recursos</h2>
          <ul className="recursos">
            {RECURSOS.map(([titulo, texto]) => (
              <li key={titulo}>
                <strong>{titulo}</strong>
                <span>{texto}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="especialidades" className="container secao">
        <h2>Especialidades disponíveis</h2>

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

      <section id="pronto-socorro" className="faixa-branca">
        <div className="container secao">
          <h2>Quando ir direto ao pronto-socorro</h2>
          <p className="secao-intro">
            No pronto-socorro, a gravidade é classificada por cores (protocolo de Manchester). Dor no
            peito, falta de ar, desmaio ou sangramento forte não esperam consulta: ligue 192.
          </p>
          <ul className="classificacao">
            {CLASSIFICACAO.map((nivel) => (
              <li key={nivel.nome} style={{ borderTopColor: nivel.cor }}>
                <strong>{nivel.nome}</strong>
                <span>{nivel.tempo}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="duvidas" className="container secao">
        <h2>Dúvidas</h2>
        <div className="duvidas">
          {DUVIDAS.map(([pergunta, resposta]) => (
            <details key={pergunta}>
              <summary>{pergunta}</summary>
              <p>{resposta}</p>
            </details>
          ))}
        </div>
      </section>

      <section id="contato" className="faixa-branca">
        <div className="container secao">
          <h2>Contato</h2>
          <p className="texto-suave">
            Dúvidas sobre o AgendaLab? Escreva para{' '}
            <a href="mailto:contato@agendalab.com">contato@agendalab.com</a>.
          </p>
        </div>
      </section>
    </>
  )
}

export default Home
