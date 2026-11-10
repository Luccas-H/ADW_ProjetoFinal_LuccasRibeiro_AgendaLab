import { io } from 'socket.io-client'
import api, { CHAVE_TOKEN } from './api'

let socket = null

// Uma conexão só para o app inteiro, aberta na primeira vez que alguma tela precisa
export function obterSocket() {
  if (!socket) {
    socket = io(new URL(api.defaults.baseURL).origin, {
      auth: (enviar) => enviar({ token: localStorage.getItem(CHAVE_TOKEN) })
    })
  }
  return socket
}

export function desconectarSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
