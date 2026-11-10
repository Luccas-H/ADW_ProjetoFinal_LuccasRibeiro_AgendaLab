import { Link } from 'react-router-dom'

// Cinco barras com as cores do protocolo de Manchester, da mais urgente para a menos urgente
const BARRAS = [
  { cor: 'var(--manchester-vermelho)', altura: 22 },
  { cor: 'var(--manchester-laranja)', altura: 18 },
  { cor: 'var(--manchester-amarelo)', altura: 14 },
  { cor: 'var(--manchester-verde)', altura: 10 },
  { cor: 'var(--manchester-azul)', altura: 6 }
]

function Logo() {
  return (
    <Link to="/" className="logo">
      <span className="logo-barras" aria-hidden="true">
        {BARRAS.map((barra) => (
          <span key={barra.cor} style={{ background: barra.cor, height: barra.altura }} />
        ))}
      </span>
      AgendaLab
    </Link>
  )
}

export default Logo
