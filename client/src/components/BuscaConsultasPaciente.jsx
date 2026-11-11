import { useEffect, useState } from 'react'
import api from '../api/api'
import useAgora from '../hooks/useAgora'
import Alerta from './Alerta'
import Campo from './Campo'
import TabelaConsultas from './TabelaConsultas'
import { CONVENIOS } from '../utils/listas'
import { apenasDigitos } from '../utils/formatar'
import { mensagemErro } from '../utils/erros'

// Só números, pontos, traços e parênteses: a pessoa está digitando telefone ou CPF
function pareceNumero(texto) {
  return /^[\d.\-\s()]+$/.test(texto)
}

// Nome com 2 letras ou mais; telefone/CPF com 4 números ou mais
function textoValido(texto) {
  if (pareceNumero(texto)) return apenasDigitos(texto).length >= 4
  return texto.length >= 2
}

// Aba "Por paciente": nome, telefone ou CPF, com filtro de convênio
function BuscaConsultasPaciente({ versao, onDetalhes }) {
  const agora = useAgora()
  const [busca, setBusca] = useState('')
  const [convenio, setConvenio] = useState('')
  const [resultados, setResultados] = useState(null)
  const [buscando, setBuscando] = useState(false)
  const [erro, setErro] = useState('')

  const texto = busca.trim()
  const usarTexto = textoValido(texto)
  const temFiltro = usarTexto || Boolean(convenio)

  useEffect(() => {
    if (!temFiltro) return

    let ativo = true
    // Espera a pessoa parar de digitar um instante antes de buscar
    const espera = setTimeout(async () => {
      try {
        const params = {}
        if (usarTexto) params.q = texto
        if (convenio) params.convenio = convenio
        const resposta = await api.get('/horarios/busca', { params })
        if (ativo) setResultados(resposta.data)
      } catch (falha) {
        if (ativo) setErro(mensagemErro(falha))
      } finally {
        if (ativo) setBuscando(false)
      }
    }, 300)

    return () => {
      ativo = false
      clearTimeout(espera)
    }
  }, [texto, usarTexto, convenio, temFiltro, versao])

  function mudarFiltros(novoTexto, novoConvenio) {
    setBusca(novoTexto)
    setConvenio(novoConvenio)
    setErro('')
    if (textoValido(novoTexto.trim()) || novoConvenio) {
      setBuscando(true)
    } else {
      setBuscando(false)
      setResultados(null)
    }
  }

  let dica = 'Digite o nome, o telefone (pelo menos 4 números) ou o CPF completo, ou escolha um convênio.'
  if (texto && pareceNumero(texto) && apenasDigitos(texto).length < 4) {
    dica = 'Continue digitando: use pelo menos 4 números do telefone.'
  } else if (buscando) {
    dica = 'Procurando...'
  }

  const lista = resultados || []
  const proximas = lista.filter((consulta) => new Date(consulta.dataHora) > agora)
  const anteriores = lista.filter((consulta) => new Date(consulta.dataHora) <= agora).reverse()

  return (
    <>
      {erro && <Alerta>{erro}</Alerta>}

      <div className="filtros filtros-consultas">
        <Campo
          id="busca-consulta"
          rotulo="Nome, telefone ou CPF do paciente"
          value={busca}
          onChange={(e) => mudarFiltros(e.target.value, convenio)}
          autoComplete="off"
          autoFocus
        />
        <Campo id="filtro-convenio" rotulo="Convênio">
          <select
            id="filtro-convenio"
            value={convenio}
            onChange={(e) => mudarFiltros(busca, e.target.value)}
          >
            <option value="">Todos</option>
            {CONVENIOS.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </Campo>
      </div>
      <p className="dica" aria-live="polite">
        {dica}
      </p>

      {resultados && !buscando && lista.length === 0 && (
        <p className="texto-suave">Nenhuma consulta encontrada para essa busca.</p>
      )}

      {proximas.length > 0 && (
        <>
          <h2>Próximas</h2>
          <TabelaConsultas consultas={proximas} agora={agora} onDetalhes={onDetalhes} />
        </>
      )}

      {anteriores.length > 0 && (
        <>
          <h2 className="titulo-anteriores">Anteriores</h2>
          <TabelaConsultas consultas={anteriores} agora={agora} onDetalhes={onDetalhes} />
        </>
      )}
    </>
  )
}

export default BuscaConsultasPaciente
