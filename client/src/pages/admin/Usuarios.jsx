import { useEffect, useState } from 'react'
import api from '../../api/api'
import useAuth from '../../hooks/useAuth'
import Alerta from '../../components/Alerta'
import Campo from '../../components/Campo'
import Modal from '../../components/Modal'
import Spinner from '../../components/Spinner'
import FichaPaciente from '../../components/FichaPaciente'
import FormularioEquipe from '../../components/FormularioEquipe'
import FormularioPaciente from '../../components/FormularioPaciente'
import { NOMES_PERFIL } from '../../utils/rotas'
import { camposErro, mensagemErro } from '../../utils/erros'

function Usuarios() {
  const { usuario: usuarioLogado } = useAuth()
  const [usuarios, setUsuarios] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [filtros, setFiltros] = useState({ perfil: '', busca: '' })
  const [textoBusca, setTextoBusca] = useState('')
  const [versao, setVersao] = useState(0)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  // Janela aberta: { tipo: 'nova' | 'ficha' | 'editar', usuario, dados }
  const [janela, setJanela] = useState(null)
  const [carregandoJanela, setCarregandoJanela] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erroJanela, setErroJanela] = useState('')
  const [errosApi, setErrosApi] = useState({})

  useEffect(() => {
    let ativo = true
    const params = {}
    if (filtros.perfil) params.perfil = filtros.perfil
    if (filtros.busca) params.busca = filtros.busca

    api
      .get('/usuarios', { params })
      .then((resposta) => ativo && setUsuarios(resposta.data))
      .catch((falha) => ativo && setErro(mensagemErro(falha)))
      .finally(() => ativo && setCarregando(false))
    return () => {
      ativo = false
    }
  }, [filtros, versao])

  function recarregar() {
    setVersao((atual) => atual + 1)
  }

  function buscar(evento) {
    evento.preventDefault()
    setFiltros({ ...filtros, busca: textoBusca.trim() })
  }

  function fecharJanela() {
    setJanela(null)
    setErroJanela('')
    setErrosApi({})
  }

  // A ficha e a edição de paciente precisam dos dados completos, que só vêm pelo /usuarios/:id
  async function abrirJanela(tipo, usuario) {
    setJanela({ tipo, usuario })
    setErroJanela('')
    setErrosApi({})

    if (tipo === 'editar' && usuario.perfil !== 'paciente') return

    setCarregandoJanela(true)
    try {
      const resposta = await api.get(`/usuarios/${usuario._id}`)
      setJanela((atual) =>
        atual?.usuario?._id === usuario._id ? { ...atual, dados: resposta.data } : atual
      )
    } catch (falha) {
      setErroJanela(mensagemErro(falha))
    } finally {
      setCarregandoJanela(false)
    }
  }

  async function salvarJanela(dados) {
    setEnviando(true)
    setErroJanela('')
    setErrosApi({})
    try {
      if (janela.tipo === 'nova') {
        await api.post('/usuarios', dados)
        setSucesso('Recepcionista cadastrada.')
      } else {
        await api.put(`/usuarios/${janela.usuario._id}`, dados)
        setSucesso('Usuário atualizado.')
      }
      setErro('')
      fecharJanela()
      recarregar()
    } catch (falha) {
      setErroJanela(mensagemErro(falha))
      setErrosApi(camposErro(falha))
    } finally {
      setEnviando(false)
    }
  }

  async function excluir(usuario) {
    const aviso = usuario.perfil === 'paciente' ? ' As consultas futuras serão desmarcadas.' : ''
    if (!window.confirm(`Excluir a conta de ${usuario.nome}?${aviso}`)) return

    setErro('')
    setSucesso('')
    try {
      await api.delete(`/usuarios/${usuario._id}`)
      setSucesso('Usuário excluído.')
      recarregar()
    } catch (falha) {
      setErro(mensagemErro(falha))
    }
  }

  function conteudoDaJanela() {
    if (erroJanela && !janela.dados && janela.tipo !== 'nova') {
      return <Alerta>{erroJanela}</Alerta>
    }

    if (janela.tipo === 'nova') {
      return (
        <>
          {erroJanela && <Alerta>{erroJanela}</Alerta>}
          <FormularioEquipe
            modo="nova"
            enviando={enviando}
            errosApi={errosApi}
            textoBotao="Cadastrar recepcionista"
            onEnviar={salvarJanela}
          />
        </>
      )
    }

    if (janela.tipo === 'editar' && janela.usuario.perfil !== 'paciente') {
      return (
        <>
          {erroJanela && <Alerta>{erroJanela}</Alerta>}
          <FormularioEquipe
            modo="edicao"
            inicial={janela.usuario}
            enviando={enviando}
            errosApi={errosApi}
            textoBotao="Salvar alterações"
            onEnviar={salvarJanela}
          />
        </>
      )
    }

    if (carregandoJanela || !janela.dados) {
      return <Spinner texto="Carregando dados do paciente..." />
    }

    if (janela.tipo === 'ficha') {
      return <FichaPaciente paciente={janela.dados} />
    }

    return (
      <>
        {erroJanela && <Alerta>{erroJanela}</Alerta>}
        <FormularioPaciente
          modo="edicao"
          inicial={janela.dados}
          enviando={enviando}
          errosApi={errosApi}
          textoBotao="Salvar alterações"
          onEnviar={salvarJanela}
        />
      </>
    )
  }

  const titulos = {
    nova: 'Nova recepcionista',
    ficha: `Ficha de ${janela?.usuario?.nome}`,
    editar: `Editar ${janela?.usuario?.nome}`
  }

  return (
    <div className="container pagina">
      <div className="cabecalho-pagina">
        <h1>Usuários</h1>
        <button type="button" className="botao" onClick={() => abrirJanela('nova', null)}>
          Nova recepcionista
        </button>
      </div>
      <p className="texto-suave">
        A ficha completa dos pacientes, com CPF e endereço, só aparece aqui para o Admin.
      </p>

      {erro && <Alerta>{erro}</Alerta>}
      {sucesso && <Alerta tipo="sucesso">{sucesso}</Alerta>}

      <form className="filtros" onSubmit={buscar}>
        <Campo id="perfil" rotulo="Perfil">
          <select
            id="perfil"
            value={filtros.perfil}
            onChange={(e) => setFiltros({ ...filtros, perfil: e.target.value })}
          >
            <option value="">Todos</option>
            <option value="paciente">Pacientes</option>
            <option value="recepcionista">Recepcionistas</option>
            <option value="admin">Admins</option>
          </select>
        </Campo>
        <Campo
          id="busca"
          rotulo="Nome"
          value={textoBusca}
          onChange={(e) => setTextoBusca(e.target.value)}
        />
        <button type="submit" className="botao botao-contorno">
          Buscar
        </button>
      </form>

      {carregando && <Spinner texto="Carregando usuários..." />}

      {!carregando && usuarios.length === 0 && (
        <p className="texto-suave">Nenhum usuário encontrado.</p>
      )}

      {usuarios.length > 0 && (
        <table className="tabela">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Usuário</th>
              <th>Perfil</th>
              <th>
                <span className="somente-leitor">Ações</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((usuario) => (
              <tr key={usuario._id}>
                <td data-label="Nome">{usuario.nome}</td>
                <td data-label="Usuário">{usuario.usuario}</td>
                <td data-label="Perfil">{NOMES_PERFIL[usuario.perfil]}</td>
                <td data-label="Ações">
                  <div className="acoes">
                    {usuario.perfil === 'paciente' && (
                      <button
                        type="button"
                        className="botao botao-contorno botao-pequeno"
                        onClick={() => abrirJanela('ficha', usuario)}
                      >
                        Ficha
                      </button>
                    )}
                    <button
                      type="button"
                      className="botao botao-contorno botao-pequeno"
                      onClick={() => abrirJanela('editar', usuario)}
                    >
                      Editar
                    </button>
                    {usuario._id !== usuarioLogado._id && (
                      <button
                        type="button"
                        className="botao botao-perigo botao-pequeno"
                        onClick={() => excluir(usuario)}
                      >
                        Excluir
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {janela && (
        <Modal
          titulo={titulos[janela.tipo]}
          largo={janela.tipo === 'editar' && janela.usuario.perfil === 'paciente'}
          onFechar={fecharJanela}
        >
          {conteudoDaJanela()}
        </Modal>
      )}
    </div>
  )
}

export default Usuarios
