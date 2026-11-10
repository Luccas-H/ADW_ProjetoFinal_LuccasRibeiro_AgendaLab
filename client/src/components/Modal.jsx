import { useEffect } from 'react'

// Janela sobre a página. Fecha no X, no Esc ou clicando fora.
function Modal({ titulo, largo = false, onFechar, children }) {
  useEffect(() => {
    function aoTeclar(evento) {
      if (evento.key === 'Escape') onFechar()
    }
    document.addEventListener('keydown', aoTeclar)
    return () => document.removeEventListener('keydown', aoTeclar)
  }, [onFechar])

  return (
    <div className="modal-fundo" onClick={onFechar}>
      <div
        className={largo ? 'modal modal-largo' : 'modal'}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-titulo"
        onClick={(evento) => evento.stopPropagation()}
      >
        <div className="modal-topo">
          <h2 id="modal-titulo">{titulo}</h2>
          <button type="button" className="modal-fechar" aria-label="Fechar" onClick={onFechar}>
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default Modal
