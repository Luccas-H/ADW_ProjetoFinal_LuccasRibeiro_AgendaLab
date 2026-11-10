import { Navigate, Outlet } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import Spinner from './Spinner'
import { areaInicial } from '../utils/rotas'

// Só deixa abrir a tela quem está logado com um dos perfis permitidos.
// É só para a navegação: quem protege os dados de verdade é a API.
function RotaProtegida({ perfis }) {
  const { usuario, carregando } = useAuth()

  if (carregando) {
    return (
      <div className="container pagina">
        <Spinner />
      </div>
    )
  }

  if (!usuario) {
    return <Navigate to="/login" replace />
  }

  if (!perfis.includes(usuario.perfil)) {
    return <Navigate to={areaInicial(usuario.perfil)} replace />
  }

  return <Outlet />
}

export default RotaProtegida
