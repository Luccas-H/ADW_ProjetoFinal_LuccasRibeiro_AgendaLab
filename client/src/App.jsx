import { Routes, Route } from 'react-router-dom'
import Cabecalho from './components/Cabecalho'
import Home from './pages/publico/Home'
import NaoEncontrada from './pages/publico/NaoEncontrada'

function App() {
  return (
    <>
      <Cabecalho />

      <main className="conteudo">
        <Routes>
          <Route path="/" element={<Home />} />
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
