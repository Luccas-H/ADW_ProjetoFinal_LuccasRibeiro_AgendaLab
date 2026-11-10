import { useEffect, useState } from 'react'
import api from '../../api/api'
import Alerta from '../../components/Alerta'
import Spinner from '../../components/Spinner'
import FormularioPaciente from '../../components/FormularioPaciente'
import { camposErro, mensagemErro } from '../../utils/erros'

function MeusDados() {
  const [paciente, setPaciente] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [errosApi, setErrosApi] = useState({})
  const [sucesso, setSucesso] = useState('')

  useEffect(() => {
    api
      .get('/usuarios/me')
      .then((resposta) => setPaciente(resposta.data))
      .catch((falha) => setErro(mensagemErro(falha)))
      .finally(() => setCarregando(false))
  }, [])

  async function salvar(dados) {
    setEnviando(true)
    setErro('')
    setErrosApi({})
    setSucesso('')
    try {
      const resposta = await api.put('/usuarios/me', dados)
      setPaciente(resposta.data)
      setSucesso('Dados atualizados.')
    } catch (falha) {
      setErro(mensagemErro(falha))
      setErrosApi(camposErro(falha))
    } finally {
      setEnviando(false)
      window.scrollTo(0, 0)
    }
  }

  return (
    <div className="container pagina caixa-formulario">
      <h1>Meus dados</h1>
      <p className="texto-suave">
        O nome de usuário e o CPF não podem ser alterados. Se algum deles estiver errado, procure a
        recepção do hospital.
      </p>

      {carregando && <Spinner texto="Carregando seus dados..." />}
      {erro && <Alerta>{erro}</Alerta>}
      {sucesso && <Alerta tipo="sucesso">{sucesso}</Alerta>}

      {paciente && (
        <FormularioPaciente
          modo="edicao"
          inicial={paciente}
          enviando={enviando}
          errosApi={errosApi}
          textoBotao="Salvar alterações"
          onEnviar={salvar}
        />
      )}
    </div>
  )
}

export default MeusDados
