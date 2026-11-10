// Rótulo + campo + mensagem de erro embaixo.
// Para select, passe o <select> como filho.
function Campo({ id, rotulo, erro, className = '', children, ...props }) {
  const classes = ['campo', erro ? 'campo-invalido' : '', className].filter(Boolean).join(' ')

  return (
    <div className={classes}>
      <label htmlFor={id}>{rotulo}</label>
      {children || (
        <input
          id={id}
          aria-invalid={Boolean(erro)}
          aria-describedby={erro ? `${id}-erro` : undefined}
          {...props}
        />
      )}
      {erro && (
        <p id={`${id}-erro`} className="erro-campo">
          {erro}
        </p>
      )}
    </div>
  )
}

export default Campo
