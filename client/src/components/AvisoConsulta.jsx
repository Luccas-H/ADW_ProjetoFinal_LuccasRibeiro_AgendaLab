import { useState } from 'react'
import useEvento from '../hooks/useEvento'
import { formatarData, formatarHora } from '../utils/formatar'

// Aviso no canto da tela quando alguém marca uma consulta (Socket.io).
// Aparece só para recepcionista e admin.
function AvisoConsulta() {
  const [avisos, setAvisos] = useState([])

  useEvento('consulta:marcada', (consulta) => {
    const id = `${Date.now()}-${Math.random()}`
    setAvisos((atuais) => [...atuais, { id, ...consulta }])
    setTimeout(() => {
      setAvisos((atuais) => atuais.filter((aviso) => aviso.id !== id))
    }, 6000)
  })

  return (
    <div className="avisos" aria-live="polite">
      {avisos.map((aviso) => (
        <div key={aviso.id} className="aviso">
          <strong>Nova consulta marcada</strong>
          <span>
            {aviso.paciente}, {aviso.especialidade}
          </span>
          <span className="texto-suave">
            {formatarData(aviso.dataHora)} às {formatarHora(aviso.dataHora)} com {aviso.medico}
          </span>
        </div>
      ))}
    </div>
  )
}

export default AvisoConsulta
