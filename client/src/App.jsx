import { Routes, Route } from 'react-router-dom'
import Cabecalho from './components/Cabecalho'
import RotaProtegida from './components/RotaProtegida'
import Home from './pages/publico/Home'
import Login from './pages/publico/Login'
import Cadastro from './pages/publico/Cadastro'
import NaoEncontrada from './pages/publico/NaoEncontrada'
import MeusDados from './pages/paciente/MeusDados'
import Especialidades from './pages/admin/Especialidades'
import Medicos from './pages/admin/Medicos'
import Usuarios from './pages/admin/Usuarios'

function App() {
  return (
    <>
      <Cabecalho />

      <main className="conteudo">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />

          <Route element={<RotaProtegida perfis={['paciente']} />}>
            <Route path="/paciente/dados" element={<MeusDados />} />
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
