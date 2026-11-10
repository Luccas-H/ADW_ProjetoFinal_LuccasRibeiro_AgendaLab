import { useEffect, useState } from 'react'
import api from '../../api/api'
import useEvento from '../../hooks/useEvento'
import useAgora from '../../hooks/useAgora'
import Alerta from '../../components/Alerta'
import Campo from '../../components/Campo'
import Calendario from '../../components/Calendario'
import MarcarParaPaciente from '../../components/MarcarParaPaciente'
import Spinner from '../../components/Spinner'
import { chaveDia, formatarData, formatarHora, mascaraTelefone } from '../../utils/formatar'
import { fimDoMes, horariosDoDia, inicioDoMes, marcarDias } from '../../utils/calendario'
import { mensagemErro } from '../../utils/erros'

// Junta os horários do dia por médico, na ordem em que aparecem
function agruparPorMedico(horarios) {
  const grupos = []
  for (const horario of horarios) {
    let grupo = grupos.find((g) => g.medico._id === horario.medico._id)
    if (!grupo) {
      grupo = { medico: horario.medico, especialidade: horario.especialidade, horarios: [] }
      grupos.push(grupo)
    }
    grupo.horarios.push(horario)
  }
  return grupos
}

function Agenda() {
  const agora = useAgora()
  const hoje = chaveDia(agora)
  const [mes, setMes] = useState(() => inicioDoMes(new Date()))
  const [selecionado, setSelecionado] = useState(hoje)
  const [filtros, setFiltros] = useState({ especialidade: '', medico: '' })
  const [especialidades, setEspecialidades] = useState([])
  const [medicos, setMedicos] = useState([])
  const [horarios, setHorarios] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [versao, setVersao] = useState(0)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [form, setForm] = useState({ medico: '', data: hoje, hora: '08:00' })
  const [errosForm, setErrosForm] = useState({})
  const [enviando, setEnviando] = useState(false)
  const [horarioParaMarcar, setHorarioParaMarcar] = useState(null)

  useEffect(() => {
    Promise.all([api.get('/especialidades'), api.get('/medicos')])
      .then(([respEspecialidades, respMedicos]) => {
        setEspecialidades(respEspecialidades.data)
        setMedicos(respMedicos.data)
      })
      .catch((falha) => setErro(mensagemErro(falha)))
  }, [])

  useEffect(() => {
    let ativo = true
    const params = { inicio: mes.toISOString(), fim: fimDoMes(mes).toISOString() }
    if (filtros.especialidade) params.especialidade = filtros.especialidade
    if (filtros.medico) params.medico = filtros.medico

    api
      .get('/horarios', { params })
      .then((resposta) => ativo && setHorarios(resposta.data))
      .catch((falha) => ativo && setErro(mensagemErro(falha)))
      .finally(() => ativo && setCarregando(false))
    return () => {
      ativo = false
    }
  }, [mes, filtros, versao])

  function recarregar() {
    setVersao((atual) => atual + 1)
  }

  // Outra pessoa marcou, desmarcou ou abriu horário: atualiza a agenda
  useEvento('horarios:mudou', recarregar)

  function limparAvisos() {
    setErro('')
    setSucesso('')
  }

  function selecionarDia(chave) {
    setSelecionado(chave)
    setForm((atual) => ({ ...atual, data: chave }))
  }

  async function abrirHorario(evento) {
    evento.preventDefault()
    limparAvisos()

    const encontrados = {}
    if (!form.medico) encontrados.medico = 'Escolha o médico'
    if (!form.data) encontrados.data = 'Campo obrigatório'
    if (!form.hora) encontrados.hora = 'Campo obrigatório'

    // "2026-11-18T08:00" sem fuso é lido como horário local
    const dataHora = new Date(`${form.data}T${form.hora}`)
    if (form.data && form.hora && dataHora <= new Date()) {
      encontrados.hora = 'Escolha um horário no futuro'
    }

    setErrosForm(encontrados)
    if (Object.keys(encontrados).length > 0) return

    setEnviando(true)
    try {
      await api.post('/horarios', { medico: form.medico, dataHora: dataHora.toISOString() })
      setSucesso(`Horário aberto: ${formatarData(dataHora)} às ${form.hora}.`)
      setSelecionado(form.data)
      if (inicioDoMes(dataHora).getTime() !== mes.getTime()) {
        setMes(inicioDoMes(dataHora))
      }
      recarregar()
    } catch (falha) {
      setErro(mensagemErro(falha))
    } finally {
      setEnviando(false)
    }
  }

  async function desmarcar(horario) {
    if (!window.confirm(`Desmarcar a consulta de ${horario.paciente.nome}?`)) return

    limparAvisos()
    try {
      await api.patch(`/horarios/${horario._id}/cancelar`)
      setSucesso('Consulta desmarcada. O horário ficou livre de novo.')
      recarregar()
    } catch (falha) {
      setErro(mensagemErro(falha))
    }
  }

  async function excluir(horario) {
    if (!window.confirm(`Excluir o horário das ${formatarHora(horario.dataHora)}?`)) return

    limparAvisos()
    try {
      await api.delete(`/horarios/${horario._id}`)
      setSucesso('Horário excluído.')
      recarregar()
    } catch (falha) {
      setErro(mensagemErro(falha))
    }
  }

  function consultaMarcada(nomePaciente) {
    setHorarioParaMarcar(null)
    limparAvisos()
    setSucesso(`Consulta marcada para ${nomePaciente}.`)
    recarregar()
  }

  const medicosDoFiltro = filtros.especialidade
    ? medicos.filter((medico) => medico.especialidade?._id === filtros.especialidade)
    : medicos
  const grupos = agruparPorMedico(horariosDoDia(horarios, selecionado))
  const [ano, mesNumero, dia] = selecionado.split('-')
  const tituloDoDia = new Date(ano, mesNumero - 1, dia).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  })

  return (
    <div className="container pagina">
      <h1>Agenda</h1>

      {erro && <Alerta>{erro}</Alerta>}
      {sucesso && <Alerta tipo="sucesso">{sucesso}</Alerta>}

      <div className="filtros">
        <Campo id="filtro-especialidade" rotulo="Especialidade">
          <select
            id="filtro-especialidade"
            value={filtros.especialidade}
            onChange={(e) => setFiltros({ especialidade: e.target.value, medico: '' })}
          >
            <option value="">Todas</option>
            {especialidades.map((especialidade) => (
              <option key={especialidade._id} value={especialidade._id}>
                {especialidade.nome}
              </option>
            ))}
          </select>
        </Campo>
        <Campo id="filtro-medico" rotulo="Médico">
          <select
            id="filtro-medico"
            value={filtros.medico}
            onChange={(e) => setFiltros({ ...filtros, medico: e.target.value })}
          >
            <option value="">Todos</option>
            {medicosDoFiltro.map((medico) => (
              <option key={medico._id} value={medico._id}>
                {medico.nome}
              </option>
            ))}
          </select>
        </Campo>
      </div>

      <div className="agenda">
        <div className="agenda-lateral">
          <Calendario
            mes={mes}
            marcacoes={marcarDias(horarios, agora)}
            selecionado={selecionado}
            permitirTodos
            onSelecionar={selecionarDia}
            onMudarMes={setMes}
          />

          <form className="cartao" onSubmit={abrirHorario} noValidate>
            <h2 className="titulo-cartao">Abrir horário</h2>
            <Campo id="novo-medico" rotulo="Médico" erro={errosForm.medico}>
              <select
                id="novo-medico"
                value={form.medico}
                onChange={(e) => setForm({ ...form, medico: e.target.value })}
              >
                <option value="">Escolha</option>
                {medicos.map((medico) => (
                  <option key={medico._id} value={medico._id}>
                    {medico.nome} ({medico.especialidade?.nome})
                  </option>
                ))}
              </select>
            </Campo>
            <div className="form-grade">
              <Campo
                id="novo-data"
                rotulo="Data"
                type="date"
                value={form.data}
                min={hoje}
                onChange={(e) => setForm({ ...form, data: e.target.value })}
                erro={errosForm.data}
              />
              <Campo
                id="novo-hora"
                rotulo="Hora"
                type="time"
                step="900"
                value={form.hora}
                onChange={(e) => setForm({ ...form, hora: e.target.value })}
                erro={errosForm.hora}
              />
            </div>
            <button type="submit" className="botao botao-largo" disabled={enviando}>
              {enviando && <span className="spinner" aria-hidden="true" />}
              {enviando ? 'Abrindo...' : 'Abrir horário'}
            </button>
          </form>
        </div>

        <section className="dia-detalhe" aria-live="polite">
          <h2 className="titulo-dia">{tituloDoDia}</h2>

          {carregando && <Spinner texto="Carregando horários..." />}

          {!carregando && grupos.length === 0 && (
            <p className="texto-suave">
              Nenhum horário aberto neste dia. Use o formulário "Abrir horário".
            </p>
          )}

          {grupos.map((grupo) => (
            <div key={grupo.medico._id} className="grupo-medico">
              <div className="grupo-medico-topo">
                <h3>{grupo.medico.nome}</h3>
                <span className="texto-suave">{grupo.especialidade.nome}</span>
              </div>

              {grupo.horarios.map((horario) => {
                const passou = new Date(horario.dataHora) <= agora
                return (
                  <div key={horario._id} className="linha-horario">
                    <span className="hora">{formatarHora(horario.dataHora)}</span>

                    <div className="situacao">
                      {horario.livre ? (
                        <span className={passou ? 'etiqueta etiqueta-passou' : 'etiqueta etiqueta-livre'}>
                          {passou ? 'Livre, já passou' : 'Livre'}
                        </span>
                      ) : (
                        <>
                          <strong>{horario.paciente?.nome}</strong>
                          <span className="texto-suave">
                            {mascaraTelefone(horario.paciente?.telefone)}, {horario.paciente?.convenio}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="acoes">
                      {horario.livre && !passou && (
                        <button
                          type="button"
                          className="botao botao-pequeno"
                          onClick={() => setHorarioParaMarcar(horario)}
                        >
                          Marcar para paciente
                        </button>
                      )}
                      {horario.livre && (
                        <button
                          type="button"
                          className="botao botao-perigo botao-pequeno"
                          onClick={() => excluir(horario)}
                        >
                          Excluir
                        </button>
                      )}
                      {!horario.livre && !passou && (
                        <button
                          type="button"
                          className="botao botao-perigo botao-pequeno"
                          onClick={() => desmarcar(horario)}
                        >
                          Desmarcar
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </section>
      </div>

      {horarioParaMarcar && (
        <MarcarParaPaciente
          horario={horarioParaMarcar}
          onFechar={() => setHorarioParaMarcar(null)}
          onMarcado={consultaMarcada}
        />
      )}
    </div>
  )
}

export default Agenda
