import { useEffect, useRef } from 'react'
import { obterSocket } from '../api/socket'

// Escuta um evento do Socket.io enquanto o componente estiver na tela
function useEvento(nome, callback) {
  const callbackAtual = useRef(callback)

  useEffect(() => {
    callbackAtual.current = callback
  })

  useEffect(() => {
    const socket = obterSocket()
    const ouvinte = (dados) => callbackAtual.current(dados)
    socket.on(nome, ouvinte)
    return () => socket.off(nome, ouvinte)
  }, [nome])
}

export default useEvento
