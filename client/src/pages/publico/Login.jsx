import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import Alerta from '../../components/Alerta'
import Campo from '../../components/Campo'
import { areaInicial } from '../../utils/rotas'
import { mensagemErro } from '../../utils/erros'

function Login() {
  const { usuario, entrar } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ usuario: '', senha: '' })
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (usuario) {
    return <Navigate to={areaInicial(usuario.perfil)} replace />
  }

  async function enviar(evento) {
    evento.preventDefault()
    setErro('')

    if (!form.usuario.trim() || !form.senha) {
      setErro('Preencha o usuário e a senha.')
      return
    }

    setEnviando(true)
    try {
      const logado = await entrar(form.usuario.trim(), form.senha)
      navigate(areaInicial(logado.perfil), { replace: true })
    } catch (falha) {
      setErro(mensagemErro(falha))
      setEnviando(false)
    }
  }

  return (
    <div className="container pagina">
      <div className="caixa-login cartao">
        <h1>Entrar</h1>

        {location.state?.mensagem && !erro && (
          <Alerta tipo="sucesso">{location.state.mensagem}</Alerta>
        )}
        {erro && <Alerta>{erro}</Alerta>}

        <form onSubmit={enviar} noValidate>
          <Campo
            id="usuario"
            rotulo="Nome de usuário"
            value={form.usuario}
            onChange={(e) => setForm({ ...form, usuario: e.target.value })}
            autoComplete="username"
          />
          <Campo
            id="senha"
            rotulo="Senha"
            type="password"
            value={form.senha}
            onChange={(e) => setForm({ ...form, senha: e.target.value })}
            autoComplete="current-password"
          />

          <button type="submit" className="botao botao-largo" disabled={enviando}>
            {enviando && <span className="spinner" aria-hidden="true" />}
            {enviando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="texto-suave rodape-caixa">
          Ainda não tem conta? <Link to="/cadastro">Crie sua conta</Link>
        </p>
      </div>
    </div>
  )
}

export default Login
