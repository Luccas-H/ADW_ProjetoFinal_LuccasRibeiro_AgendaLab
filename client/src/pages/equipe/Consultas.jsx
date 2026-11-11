import { useState } from 'react'
import useEvento from '../../hooks/useEvento'
import Alerta from '../../components/Alerta'
import BuscaConsultasPaciente from '../../components/BuscaConsultasPaciente'
import ConsultasPorMedico from '../../components/ConsultasPorMedico'
import DetalhesConsulta from '../../components/DetalhesConsulta'

const ABAS = [
  ['paciente', 'Por paciente'],
  ['medico', 'Por médico']
]

function Consultas() {
  const [aba, setAba] = useState('paciente')
  const [versao, setVersao] = useState(0)
  const [consultaAberta, setConsultaAberta] = useState(null)
  const [sucesso, setSucesso] = useState('')

  // Se alguém marcar, remarcar ou desmarcar, as listas atualizam sozinhas
  useEvento('horarios:mudou', () => setVersao((atual) => atual + 1))

  function trocarAba(nova) {
    setAba(nova)
    setSucesso('')
  }

  function consultaAlterada(mensagem) {
    setConsultaAberta(null)
    setSucesso(mensagem)
    setVersao((atual) => atual + 1)
  }

  return (
    <div className="container pagina">
      <h1>Consultas</h1>
      <p className="texto-suave">
        Procure as consultas por paciente ou por médico. Em Detalhes você remarca ou desmarca.
      </p>

      {sucesso && <Alerta tipo="sucesso">{sucesso}</Alerta>}

      <div className="abas" role="tablist" aria-label="Formas de procurar">
        {ABAS.map(([id, texto]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={aba === id}
            className={aba === id ? 'aba ativa' : 'aba'}
            onClick={() => trocarAba(id)}
          >
            {texto}
          </button>
        ))}
      </div>

      {aba === 'paciente' ? (
        <BuscaConsultasPaciente versao={versao} onDetalhes={setConsultaAberta} />
      ) : (
        <ConsultasPorMedico versao={versao} onDetalhes={setConsultaAberta} />
      )}

      {consultaAberta && (
        <DetalhesConsulta
          consulta={consultaAberta}
          onFechar={() => setConsultaAberta(null)}
          onAlterada={consultaAlterada}
        />
      )}
    </div>
  )
}

export default Consultas
