function Spinner({ texto = 'Carregando...' }) {
  return (
    <div className="carregando" role="status">
      <span className="spinner" aria-hidden="true" />
      {texto}
    </div>
  )
}

export default Spinner
