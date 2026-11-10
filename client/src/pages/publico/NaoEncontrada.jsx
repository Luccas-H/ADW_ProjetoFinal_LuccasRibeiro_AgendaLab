import { Link } from 'react-router-dom'

function NaoEncontrada() {
  return (
    <div className="container pagina">
      <h1>Página não encontrada</h1>
      <p className="texto-suave">O endereço que você abriu não existe no AgendaLab.</p>
      <Link to="/" className="botao">
        Voltar para o início
      </Link>
    </div>
  )
}

export default NaoEncontrada
