import { startTransition, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import Logo from './Logo'
import SinoNotificacoes from './SinoNotificacoes'
import useAuth from '../hooks/useAuth'
import { NOMES_PERFIL } from '../utils/rotas'
import { MENUS } from '../utils/menus'

function classeDoLink({ isActive }) {
  return isActive ? 'menu-link ativo' : 'menu-link'
}

function Cabecalho() {
  const { usuario, sair } = useAuth()
  const navigate = useNavigate()
  const [menuAberto, setMenuAberto] = useState(false)

  function encerrarSessao() {
    navigate('/')
    // O React Router troca de rota numa transição. A saída vai junto, na mesma transição,
    // senão a tela protegida percebe o usuário vazio antes e redireciona para o login.
    startTransition(() => sair())
  }

  return (
    <header className="cabecalho">
      <div className="faixa-manchester" />
      <div className="container cabecalho-barra">
        <Logo />

        {usuario?.perfil === 'paciente' && <SinoNotificacoes />}

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
          {usuario ? (
            <>
              {MENUS[usuario.perfil].map(([rota, texto]) => (
                <NavLink key={rota} to={rota} className={classeDoLink}>
                  {texto}
                </NavLink>
              ))}
              <span className="menu-usuario">
                <strong>{usuario.nome.split(' ')[0]}</strong>
                <small>{NOMES_PERFIL[usuario.perfil]}</small>
              </span>
              <button
                type="button"
                className="botao botao-contorno botao-pequeno"
                onClick={encerrarSessao}
              >
                Sair
              </button>
            </>
          ) : (
            <>
              <Link to="/#como-funciona" className="menu-link">
                Como funciona
              </Link>
              <Link to="/#recursos" className="menu-link">
                Recursos
              </Link>
              <Link to="/#duvidas" className="menu-link">
                Dúvidas
              </Link>
              <Link to="/#contato" className="menu-link">
                Contato
              </Link>
              <Link to="/login" className="botao">
                Entrar
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}

export default Cabecalho
