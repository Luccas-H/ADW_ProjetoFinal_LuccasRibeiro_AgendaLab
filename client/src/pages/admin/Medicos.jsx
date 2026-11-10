import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/api'
import Alerta from '../../components/Alerta'
import Campo from '../../components/Campo'
import Spinner from '../../components/Spinner'
import { validarNome } from '../../utils/validacao'
import { camposErro, mensagemErro } from '../../utils/erros'

const FORM_VAZIO = { nome: '', crm: '', especialidade: '' }

function Medicos() {
  const [medicos, setMedicos] = useState([])
  const [especialidades, setEspecialidades] = useState([])
  const [filtro, setFiltro] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [versao, setVersao] = useState(0)
  const [form, setForm] = useState(FORM_VAZIO)
  const [editandoId, setEditandoId] = useState(null)
  const [erros, setErros] = useState({})
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  useEffect(() => {
    api
      .get('/especialidades')
      .then((resposta) => setEspecialidades(resposta.data))
      .catch((falha) => setErro(mensagemErro(falha)))
  }, [])

  useEffect(() => {
    let ativo = true
    const params = filtro ? { especialidade: filtro } : {}
    api
      .get('/medicos', { params })
      .then((resposta) => ativo && setMedicos(resposta.data))
      .catch((falha) => ativo && setErro(mensagemErro(falha)))
      .finally(() => ativo && setCarregando(false))
    return () => {
      ativo = false
    }
  }, [filtro, versao])

  function recarregar() {
    setVersao((atual) => atual + 1)
  }

  function limparFormulario() {
    setForm(FORM_VAZIO)
    setEditandoId(null)
    setErros({})
  }

  function editar(medico) {
    setEditandoId(medico._id)
    setForm({ nome: medico.nome, crm: medico.crm, especialidade: medico.especialidade._id })
    setErros({})
    setErro('')
    setSucesso('')
    window.scrollTo(0, 0)
  }

  async function salvar(evento) {
    evento.preventDefault()
    setErro('')
    setSucesso('')

    const encontrados = {}
    // Médico pode ter "Dr." ou "Dra." no nome, então o ponto é aceito
    const nomeSemPonto = form.nome.replaceAll('.', '')
    const erroNome = validarNome(nomeSemPonto)
    if (erroNome) encontrados.nome = erroNome
    if (!/^[0-9A-Z/-]{1,20}$/i.test(form.crm.trim())) {
      encontrados.crm = 'Use apenas números, letras, / e -'
    }
    if (!form.especialidade) encontrados.especialidade = 'Escolha uma opção da lista'

    setErros(encontrados)
    if (Object.keys(encontrados).length > 0) return

    setEnviando(true)
    try {
      if (editandoId) {
        await api.put(`/medicos/${editandoId}`, form)
        setSucesso('Médico atualizado.')
      } else {
        await api.post('/medicos', form)
        setSucesso('Médico cadastrado.')
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

  async function excluir(medico) {
    if (!window.confirm(`Excluir ${medico.nome}? Os horários livres dele também serão apagados.`)) {
      return
    }

    setErro('')
    setSucesso('')
    try {
      await api.delete(`/medicos/${medico._id}`)
      setSucesso('Médico excluído.')
      if (editandoId === medico._id) limparFormulario()
      recarregar()
    } catch (falha) {
      setErro(mensagemErro(falha))
    }
  }

  const semEspecialidades = especialidades.length === 0

  return (
    <div className="container pagina">
      <h1>Médicos</h1>
      <p className="texto-suave">Cada médico atende uma especialidade.</p>

      {erro && <Alerta>{erro}</Alerta>}
      {sucesso && <Alerta tipo="sucesso">{sucesso}</Alerta>}

      <form className="cartao bloco-formulario" onSubmit={salvar} noValidate>
        <h2>{editandoId ? 'Editar médico' : 'Novo médico'}</h2>

        {semEspecialidades && (
          <p className="texto-suave">
            Cadastre uma <Link to="/admin/especialidades">especialidade</Link> antes de cadastrar
            médicos.
          </p>
        )}

        <div className="form-grade">
          <Campo
            id="nome"
            rotulo="Nome"
            className="largo"
            placeholder="Ex.: Dra. Helena Prado"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            erro={erros.nome}
          />
          <Campo
            id="crm"
            rotulo="CRM"
            placeholder="Ex.: 1234/RR"
            value={form.crm}
            onChange={(e) => setForm({ ...form, crm: e.target.value })}
            erro={erros.crm}
          />
          <Campo id="especialidade" rotulo="Especialidade" erro={erros.especialidade}>
            <select
              id="especialidade"
              value={form.especialidade}
              onChange={(e) => setForm({ ...form, especialidade: e.target.value })}
            >
              <option value="">Escolha</option>
              {especialidades.map((especialidade) => (
                <option key={especialidade._id} value={especialidade._id}>
                  {especialidade.nome}
                </option>
              ))}
            </select>
          </Campo>
        </div>
        <div className="acoes-form">
          <button type="submit" className="botao" disabled={enviando || semEspecialidades}>
            {enviando && <span className="spinner" aria-hidden="true" />}
            {editandoId ? 'Salvar alterações' : 'Cadastrar médico'}
          </button>
          {editandoId && (
            <button type="button" className="botao botao-contorno" onClick={limparFormulario}>
              Cancelar edição
            </button>
          )}
        </div>
      </form>

      <div className="filtros">
        <Campo id="filtro" rotulo="Mostrar médicos de">
          <select id="filtro" value={filtro} onChange={(e) => setFiltro(e.target.value)}>
            <option value="">Todas as especialidades</option>
            {especialidades.map((especialidade) => (
              <option key={especialidade._id} value={especialidade._id}>
                {especialidade.nome}
              </option>
            ))}
          </select>
        </Campo>
      </div>

      {carregando && <Spinner texto="Carregando médicos..." />}

      {!carregando && medicos.length === 0 && (
        <p className="texto-suave">Nenhum médico encontrado.</p>
      )}

      {medicos.length > 0 && (
        <table className="tabela">
          <thead>
            <tr>
              <th>Nome</th>
              <th>CRM</th>
              <th>Especialidade</th>
              <th>
                <span className="somente-leitor">Ações</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {medicos.map((medico) => (
              <tr key={medico._id}>
                <td data-label="Nome">{medico.nome}</td>
                <td data-label="CRM">{medico.crm}</td>
                <td data-label="Especialidade">{medico.especialidade?.nome}</td>
                <td data-label="Ações">
                  <div className="acoes">
                    <button
                      type="button"
                      className="botao botao-contorno botao-pequeno"
                      onClick={() => editar(medico)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="botao botao-perigo botao-pequeno"
                      onClick={() => excluir(medico)}
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

export default Medicos
