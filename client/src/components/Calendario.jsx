import useAgora from '../hooks/useAgora'
import { chaveDia } from '../utils/formatar'

const DIAS_DA_SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

// Calendário do mês. "marcacoes" diz quais dias têm horário livre ou estão lotados.
// Sem "permitirTodos", só os dias com marcação podem ser clicados.
function Calendario({ mes, marcacoes = {}, selecionado, permitirTodos = false, onSelecionar, onMudarMes }) {
  const ano = mes.getFullYear()
  const indiceMes = mes.getMonth()
  const totalDias = new Date(ano, indiceMes + 1, 0).getDate()
  // getDay() começa no domingo; aqui a semana começa na segunda
  const diasAntes = (new Date(ano, indiceMes, 1).getDay() + 6) % 7
  const hoje = chaveDia(useAgora())

  const dias = []
  for (let dia = 1; dia <= totalDias; dia++) {
    dias.push(new Date(ano, indiceMes, dia))
  }

  const nomeDoMes = mes.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <div className="calendario">
      <div className="calendario-topo">
        <button
          type="button"
          className="calendario-seta"
          aria-label="Mês anterior"
          onClick={() => onMudarMes(new Date(ano, indiceMes - 1, 1))}
        >
          ‹
        </button>
        <strong className="calendario-titulo">{nomeDoMes}</strong>
        <button
          type="button"
          className="calendario-seta"
          aria-label="Próximo mês"
          onClick={() => onMudarMes(new Date(ano, indiceMes + 1, 1))}
        >
          ›
        </button>
      </div>

      <div className="calendario-grade">
        {DIAS_DA_SEMANA.map((nome) => (
          <div key={nome} className="calendario-semana" aria-hidden="true">
            {nome}
          </div>
        ))}

        {diasAntes > 0 && <div style={{ gridColumn: `span ${diasAntes}` }} />}

        {dias.map((data) => {
          const chave = chaveDia(data)
          const marcacao = marcacoes[chave]
          const classes = ['calendario-dia']
          if (chave === hoje) classes.push('hoje')
          if (chave === selecionado) classes.push('selecionado')

          let descricao = data.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })
          if (marcacao === 'livre') descricao += ', tem horário livre'
          if (marcacao === 'lotado') descricao += ', sem horário livre'

          return (
            <button
              key={chave}
              type="button"
              className={classes.join(' ')}
              disabled={!permitirTodos && !marcacao}
              aria-pressed={chave === selecionado}
              aria-label={descricao}
              onClick={() => onSelecionar(chave)}
            >
              {data.getDate()}
              {marcacao && <span className={marcacao === 'livre' ? 'ponto-livre' : 'ponto-lotado'} />}
            </button>
          )
        })}
      </div>

      <div className="calendario-legenda">
        <span>
          <i className="ponto-livre" /> tem horário livre
        </span>
        <span>
          <i className="ponto-lotado" /> sem horário livre
        </span>
      </div>
    </div>
  )
}

export default Calendario
