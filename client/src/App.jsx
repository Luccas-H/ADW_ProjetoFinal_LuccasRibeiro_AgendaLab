import { Routes, Route } from 'react-router-dom'
import useAuth from './hooks/useAuth'
import Cabecalho from './components/Cabecalho'
import AvisoConsulta from './components/AvisoConsulta'
import RotaProtegida from './components/RotaProtegida'
import Home from './pages/publico/Home'
import Login from './pages/publico/Login'
import Cadastro from './pages/publico/Cadastro'
import NaoEncontrada from './pages/publico/NaoEncontrada'
import MeusDados from './pages/paciente/MeusDados'
import Painel from './pages/equipe/Painel'
import Agenda from './pages/equipe/Agenda'
import Especialidades from './pages/admin/Especialidades'
import Medicos from './pages/admin/Medicos'
import Usuarios from './pages/admin/Usuarios'

function App() {
  const { usuario } = useAuth()
  const ehEquipe = usuario && usuario.perfil !== 'paciente'

  return (
    <>
      <Cabecalho />
      {ehEquipe && <AvisoConsulta />}

      <main className="conteudo">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />

          <Route element={<RotaProtegida perfis={['paciente']} />}>
            <Route path="/paciente/dados" element={<MeusDados />} />
          </Route>

          <Route element={<RotaProtegida perfis={['recepcionista', 'admin']} />}>
            <Route path="/equipe/painel" element={<Painel />} />
            <Route path="/equipe/agenda" element={<Agenda />} />
          </Route>

          <Route element={<RotaProtegida perfis={['admin']} />}>
            <Route path="/admin/especialidades" element={<Especialidades />} />
            <Route path="/admin/medicos" element={<Medicos />} />
            <Route path="/admin/usuarios" element={<Usuarios />} />
          </Route>

          <Route path="*" element={<NaoEncontrada />} />
        </Routes>
      </main>

      <footer className="rodape">
        <div className="container">AgendaLab, sistema de agendamento de consultas</div>
      </footer>
    </>
  )
}

export default App
