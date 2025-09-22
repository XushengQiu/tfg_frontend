import { useEffect, useRef, useState } from 'react';

export default function Modal({
                                  open,
                                  title,
                                  children,
                                  onClose,                 // overlay, botón “Cerrar/Cancelar” y ❌
                                  onAccept,
                                  acceptText = 'Aceptar',
                                  denyText = 'Cerrar',
                                  requireScroll = false,
                                  showDenyButton = true,
                                  showCloseIcon = true,
                                  // estilos (opcionales)
                                  dialogClassName = '',
                                  bodyClassName = '',
                                  actionsClassName = '',
                                  acceptStyle = 'primary',   // 'primary' | 'accent' | 'danger'
                                  denyStyle = 'muted',       // 'muted' | 'default'
                              }) {
    const boxRef = useRef(null);
    const [canAccept, setCanAccept] = useState(!requireScroll);

    useEffect(() => {
        setCanAccept(!requireScroll);
    }, [requireScroll, open]);

    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = prev; };
    }, [open]);

    const handleOverlay = (e) => {
        if (e.target === e.currentTarget && onClose) onClose();
    };

    const handleScroll = () => {
        if (!requireScroll) return;
        const el = boxRef.current;
        if (!el) return;
        const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 2;
        if (atBottom) setCanAccept(true);
    };

    const derivedAcceptStyle = acceptStyle;
    const acceptClass =
        derivedAcceptStyle === 'danger'
            ? 'btn-modal-danger'
            : derivedAcceptStyle === 'accent'
                ? 'btn-modal-accent'
                : 'btn-modal-primary';

    const denyClass =
        denyStyle === 'muted' ? 'btn-modal-muted' : 'btn-modal-primary';

    if (!open) return null;

    return (
        <div className="modal-overlay" onClick={handleOverlay}>
            <div className={`modal ${dialogClassName}`} role="dialog" aria-modal="true" aria-labelledby="modal-title">
                {showCloseIcon && onClose && (
                    <button className="modal-close" onClick={onClose} aria-label="Cerrar">×</button>
                )}
                {title && <h2 id="modal-title" className="modal-title">{title}</h2>}

                <div
                    ref={boxRef}
                    className={`modal-body ${bodyClassName}`}
                    onScroll={handleScroll}
                    role="document"
                >
                    {children}
                </div>

                <div className={`modal-actions ${actionsClassName}`}>
                    {showDenyButton && onClose && (
                        <button className={denyClass} onClick={onClose}>
                            {denyText || 'Cerrar'}
                        </button>
                    )}

                    {typeof onAccept === 'function' && (
                        <div className="accept-wrap">
                            <button
                                className={acceptClass}
                                onClick={onAccept}
                                disabled={!canAccept}
                                title={!canAccept && requireScroll ? 'Desplázate hasta el final' : undefined}
                            >
                                {acceptText}
                            </button>
                            {requireScroll && !canAccept && (
                                <span
                                    className="accept-blocker"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        const hint = document.querySelector('.modal-scroll-hint');
                                        if (hint) {
                                            hint.classList.add('show');
                                            clearTimeout(window.__hintTimer);
                                            window.__hintTimer = setTimeout(() => hint.classList.remove('show'), 1600);
                                        }
                                    }}
                                    aria-hidden="true"
                                />
                            )}
                        </div>
                    )}
                </div>

                <div className="modal-scroll-hint" aria-live="polite">
                    Desplázate hasta el final para habilitar “Aceptar”.
                </div>
            </div>
        </div>
    );
}
