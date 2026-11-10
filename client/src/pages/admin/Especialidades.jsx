import { useEffect, useState } from 'react'
import api from '../../api/api'
import Alerta from '../../components/Alerta'
import Campo from '../../components/Campo'
import Spinner from '../../components/Spinner'
import { camposErro, mensagemErro } from '../../utils/erros'

const FORM_VAZIO = { nome: '', descricao: '' }

function Especialidades() {
  const [especialidades, setEspecialidades] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [versao, setVersao] = useState(0)
  const [form, setForm] = useState(FORM_VAZIO)
  const [editandoId, setEditandoId] = useState(null)
  const [erros, setErros] = useState({})
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  useEffect(() => {
    let ativo = true
    api
      .get('/especialidades')
      .then((resposta) => ativo && setEspecialidades(resposta.data))
      .catch((falha) => ativo && setErro(mensagemErro(falha)))
      .finally(() => ativo && setCarregando(false))
    return () => {
      ativo = false
    }
  }, [versao])

  function recarregar() {
    setVersao((atual) => atual + 1)
  }

  function limparFormulario() {
    setForm(FORM_VAZIO)
    setEditandoId(null)
    setErros({})
  }

  function editar(especialidade) {
    setEditandoId(especialidade._id)
    setForm({ nome: especialidade.nome, descricao: especialidade.descricao || '' })
    setErros({})
    setErro('')
    setSucesso('')
    window.scrollTo(0, 0)
  }

  async function salvar(evento) {
    evento.preventDefault()
    setErro('')
    setSucesso('')

    if (form.nome.trim().length < 3) {
      setErros({ nome: 'Use pelo menos 3 caracteres' })
      return
    }

    setErros({})
    setEnviando(true)
    try {
      if (editandoId) {
        await api.put(`/especialidades/${editandoId}`, form)
        setSucesso('Especialidade atualizada.')
      } else {
        await api.post('/especialidades', form)
        setSucesso('Especialidade cadastrada.')
      }
      limparFormulario()
      recarregar()
    } catch (falha) {
      setErro(mensagemErro(falha))
      setErros(camposErro(falha))
    } finally {
      setEnviando(false)
    }
  }

  async function excluir(especialidade) {
    if (!window.confirm(`Excluir a especialidade ${especialidade.nome}?`)) return

    setErro('')
    setSucesso('')
    try {
      await api.delete(`/especialidades/${especialidade._id}`)
      setSucesso('Especialidade excluída.')
      if (editandoId === especialidade._id) limparFormulario()
      recarregar()
    } catch (falha) {
      setErro(mensagemErro(falha))
    }
  }

  return (
    <div className="container pagina">
      <h1>Especialidades</h1>
      <p className="texto-suave">
        As especialidades aparecem na homepage e na hora de marcar consulta.
      </p>

      {erro && <Alerta>{erro}</Alerta>}
      {sucesso && <Alerta tipo="sucesso">{sucesso}</Alerta>}

      <form className="cartao bloco-formulario" onSubmit={salvar} noValidate>
        <h2>{editandoId ? 'Editar especialidade' : 'Nova especialidade'}</h2>
        <div className="form-grade">
          <Campo
            id="nome"
            rotulo="Nome"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            erro={erros.nome}
          />
          <Campo
            id="descricao"
            rotulo="Descrição (opcional)"
            value={form.descricao}
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            erro={erros.descricao}
          />
        </div>
        <div className="acoes-form">
          <button type="submit" className="botao" disabled={enviando}>
            {enviando && <span className="spinner" aria-hidden="true" />}
            {editandoId ? 'Salvar alterações' : 'Cadastrar especialidade'}
          </button>
          {editandoId && (
            <button type="button" className="botao botao-contorno" onClick={limparFormulario}>
              Cancelar edição
            </button>
          )}
        </div>
      </form>

      {carregando && <Spinner texto="Carregando especialidades..." />}

      {!carregando && especialidades.length === 0 && (
        <p className="texto-suave">Nenhuma especialidade cadastrada. Use o formulário acima.</p>
      )}

      {especialidades.length > 0 && (
        <table className="tabela">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Descrição</th>
              <th>
                <span className="somente-leitor">Ações</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {especialidades.map((especialidade) => (
              <tr key={especialidade._id}>
                <td data-label="Nome">{especialidade.nome}</td>
                <td data-label="Descrição">{especialidade.descricao || '—'}</td>
                <td data-label="Ações">
                  <div className="acoes">
                    <button
                      type="button"
                      className="botao botao-contorno botao-pequeno"
                      onClick={() => editar(especialidade)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="botao botao-perigo botao-pequeno"
                      onClick={() => excluir(especialidade)}
                    >
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default Especialidades
