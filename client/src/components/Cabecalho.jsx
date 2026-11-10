import { useState } from 'react'
import { Link } from 'react-router-dom'
import Logo from './Logo'

function Cabecalho() {
  const [menuAberto, setMenuAberto] = useState(false)

  return (
    <header className="cabecalho">
      <div className="faixa-manchester" />
      <div className="container cabecalho-barra">
        <Logo />

        <button
          type="button"
          className="menu-botao"
          aria-expanded={menuAberto}
          aria-controls="menu-principal"
          aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
          onClick={() => setMenuAberto(!menuAberto)}
        >
          {menuAberto ? '✕' : '☰'}
        </button>

        <nav
          id="menu-principal"
          className={menuAberto ? 'menu aberto' : 'menu'}
          onClick={() => setMenuAberto(false)}
        >
          <Link to="/#especialidades" className="menu-link">
            Especialidades
          </Link>
          <Link to="/login" className="botao">
            Entrar
          </Link>
        </nav>
      </div>
    </header>
  )
}

export default Cabecalho
