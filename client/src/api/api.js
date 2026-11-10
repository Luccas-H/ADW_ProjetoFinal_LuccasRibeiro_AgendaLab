import axios from 'axios'

export const CHAVE_TOKEN = 'agendalab_token'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(CHAVE_TOKEN)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Se a sessão expirar no meio do uso, volta para o login.
// O login e o /auth/me tratam o 401 do jeito deles.
api.interceptors.response.use(
  (resposta) => resposta,
  (erro) => {
    const rota = erro.config?.url
    if (erro.response?.status === 401 && rota !== '/auth/login' && rota !== '/auth/me') {
      localStorage.removeItem(CHAVE_TOKEN)
      window.location.href = '/login'
    }
    return Promise.reject(erro)
  }
)

export default api
