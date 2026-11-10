import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import api from '../../api/api'
import useAuth from '../../hooks/useAuth'
import Alerta from '../../components/Alerta'
import FormularioPaciente from '../../components/FormularioPaciente'
import { areaInicial } from '../../utils/rotas'
import { camposErro, mensagemErro } from '../../utils/erros'

function Cadastro() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [errosApi, setErrosApi] = useState({})

  if (usuario) {
    return <Navigate to={areaInicial(usuario.perfil)} replace />
  }

  async function criarConta(dados) {
    setEnviando(true)
    setErro('')
    setErrosApi({})
    try {
      await api.post('/auth/cadastro', dados)
      navigate('/login', { state: { mensagem: 'Conta criada. Entre com seu usuário e senha.' } })
    } catch (falha) {
      setErro(mensagemErro(falha))
      setErrosApi(camposErro(falha))
      setEnviando(false)
      window.scrollTo(0, 0)
    }
  }

  return (
    <div className="container pagina caixa-formulario">
      <h1>Criar conta</h1>
      <p className="texto-suave">
        Preencha seus dados para marcar consultas pelo AgendaLab. Já tem conta?{' '}
        <Link to="/login">Entre aqui</Link>.
      </p>

      {erro && <Alerta>{erro}</Alerta>}

      <FormularioPaciente
        modo="cadastro"
        enviando={enviando}
        errosApi={errosApi}
        textoBotao="Criar conta"
        onEnviar={criarConta}
      />
    </div>
  )
}

export default Cadastro
