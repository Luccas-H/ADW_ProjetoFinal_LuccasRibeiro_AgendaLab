import { Link } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import Logo from './Logo'
import { MENUS } from '../utils/menus'

const ANO = new Date().getFullYear()

// Visitante: navegação do site e acesso. Logado: as telas do próprio perfil.
function Rodape() {
  const { usuario } = useAuth()

  return (
    <footer className="rodape">
      <div className="container rodape-grade">
        <div className="rodape-sobre">
          <Logo />
          <p>Agendamento de consultas para hospitais e consultórios.</p>
        </div>

        {usuario ? (
          <nav aria-label="Sua área">
            <h2>Sua área</h2>
            <ul>
              {MENUS[usuario.perfil].map(([rota, texto]) => (
                <li key={rota}>
                  <Link to={rota}>{texto}</Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : (
          <>
            <nav aria-label="Navegação do site">
              <h2>Navegação</h2>
              <ul>
                <li>
                  <Link to="/#como-funciona">Como funciona</Link>
                </li>
                <li>
                  <Link to="/#recursos">Recursos</Link>
                </li>
                <li>
                  <Link to="/#especialidades">Especialidades</Link>
                </li>
                <li>
                  <Link to="/#duvidas">Dúvidas</Link>
                </li>
              </ul>
            </nav>
            <div>
              <h2>Acesso</h2>
              <ul>
                <li>
                  <Link to="/login">Entrar</Link>
                </li>
                <li>
                  <Link to="/cadastro">Criar conta</Link>
                </li>
              </ul>
            </div>
          </>
        )}

        <div>
          <h2>Contato</h2>
          <ul>
            <li>
              <a href="mailto:contato@agendalab.com">contato@agendalab.com</a>
            </li>
          </ul>
        </div>
      </div>

      <div className="container rodape-final">
        © {ANO} AgendaLab. Desenvolvido por Luccas Henrique.
      </div>
    </footer>
  )
}

export default Rodape
