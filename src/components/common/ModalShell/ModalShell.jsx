import './ModalShell.css';

function ModalShell({
  className = '',
  overlayClassName = '',
  titleId,
  kicker,
  title,
  onClose,
  closeLabel = 'Close',
  children,
  footer = null,
}) {
  return (
    <div
      className={`modal-shell-overlay ${overlayClassName}`.trim()}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      }}
    >
      <section className={`modal-shell ${className}`.trim()} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className="modal-shell-header">
          <div>
            {kicker && <p className="modal-shell-kicker">{kicker}</p>}
            <h2 id={titleId}>{title}</h2>
          </div>
          <button type="button" className="modal-shell-close-btn" onClick={onClose}>
            {closeLabel}
          </button>
        </header>

        <div className="modal-shell-body">{children}</div>

        {footer && <footer className="modal-shell-footer">{footer}</footer>}
      </section>
    </div>
  );
}

export default ModalShell;