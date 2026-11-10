import { useEffect, useState } from 'react'
import api, { CHAVE_TOKEN } from '../api/api'
import { desconectarSocket } from '../api/socket'
import { AuthContext } from './AuthContext'

// Guarda quem está logado e o perfil, para o resto do app saber o que mostrar
function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [carregando, setCarregando] = useState(() => Boolean(localStorage.getItem(CHAVE_TOKEN)))

  // Ao abrir o site com um token salvo, confere com a API se ele ainda vale
  useEffect(() => {
    if (!localStorage.getItem(CHAVE_TOKEN)) {
      return
    }
    api
      .get('/auth/me')
      .then((resposta) => setUsuario(resposta.data.usuario))
      .catch(() => localStorage.removeItem(CHAVE_TOKEN))
      .finally(() => setCarregando(false))
  }, [])

  async function entrar(nomeUsuario, senha) {
    const resposta = await api.post('/auth/login', { usuario: nomeUsuario, senha })
    localStorage.setItem(CHAVE_TOKEN, resposta.data.token)
    setUsuario(resposta.data.usuario)
    return resposta.data.usuario
  }

  function sair() {
    localStorage.removeItem(CHAVE_TOKEN)
    desconectarSocket()
    setUsuario(null)
  }

  return (
    <AuthContext.Provider value={{ usuario, carregando, entrar, sair }}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider
