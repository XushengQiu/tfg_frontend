import { useEffect, useRef, useState } from 'react';

export default function Modal({
                                  open,
                                  title,
                                  children,
                                  onClose,                 // usado para “Cerrar/Cancelar” y overlay
                                  onAccept,
                                  acceptText = 'Aceptar',
                                  denyText = 'Cerrar',
                                  requireScroll = false,
                                  showDenyButton = true,
                                  showCloseIcon = true,
                                  // ⬇️ NUEVO: clases para este modal concreto
                                  dialogClassName = '',
                                  bodyClassName = '',
                              }) {
    const boxRef = useRef(null);
    const [canAccept, setCanAccept] = useState(!requireScroll);

    useEffect(() => {
        setCanAccept(!requireScroll);
    }, [requireScroll, open]);

    if (!open) return null;

    const handleScroll = () => {
        if (!requireScroll) return;
        const el = boxRef.current;
        if (!el) return;
        const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 2;
        if (atBottom) setCanAccept(true);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className={`modal ${dialogClassName}`}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                {showCloseIcon && onClose && (
                    <button
                        type="button"
                        className="modal-close"
                        aria-label="Cerrar"
                        onClick={onClose}
                    >
                        ×
                    </button>
                )}

                {title ? <h2>{title}</h2> : null}

                <div
                    ref={boxRef}
                    className={`modal-body ${bodyClassName}`}
                    onScroll={handleScroll}
                    style={{ maxHeight: '50vh', overflow: 'auto', paddingRight: '.5rem' }}
                >
                    {children}
                </div>

                <div className="modal-actions">
                    {showDenyButton && onClose && (
                        <button className="back-btn" onClick={onClose}>
                            {denyText}
                        </button>
                    )}
                    {typeof onAccept === 'function' && (
                        <button
                            className="delete-btn"
                            onClick={onAccept}
                            disabled={!canAccept}
                            title={!canAccept && requireScroll ? 'Desplázate hasta el final' : undefined}
                        >
                            {acceptText}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
