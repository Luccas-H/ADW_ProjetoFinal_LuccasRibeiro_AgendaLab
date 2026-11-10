import { useEffect, useState } from 'react'

// Data e hora atuais, atualizadas a cada minuto.
// Assim um horário que acabou de passar muda de "Livre" para "já passou" sem recarregar a página.
function useAgora() {
  const [agora, setAgora] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setAgora(new Date()), 60 * 1000)
    return () => clearInterval(id)
  }, [])

  return agora
}

export default useAgora
