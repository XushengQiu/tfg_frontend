// src/components/ServiceBanner.jsx
import { useEffect, useState, useRef } from 'react';

export default function ServiceBanner() {
    const [state, setState] = useState({ mode: 'ok', retryIn: null, status: null });
    const timerRef = useRef(null);

    useEffect(() => {
        const onOk = () => setState({ mode: 'ok', retryIn: null, status: null });
        const onDegraded = (e) => {
            const { retryIn = null, status = null } = e.detail || {};
            setState({ mode: 'degraded', retryIn, status });
        };
        window.addEventListener('net:ok', onOk);
        window.addEventListener('net:degraded', onDegraded);
        return () => {
            window.removeEventListener('net:ok', onOk);
            window.removeEventListener('net:degraded', onDegraded);
            clearInterval(timerRef.current);
        };
    }, []);

    // cuenta atrás visual
    const [count, setCount] = useState(null);
    useEffect(() => {
        clearInterval(timerRef.current);
        if (state.mode !== 'degraded' || !state.retryIn) { setCount(null); return; }
        let ms = state.retryIn;
        setCount(Math.ceil(ms/1000));
        timerRef.current = setInterval(() => {
            ms -= 1000;
            if (ms <= 0) { clearInterval(timerRef.current); setCount(null); return; }
            setCount(Math.ceil(ms/1000));
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, [state.mode, state.retryIn]);

    if (state.mode !== 'degraded') return null;

    const label =
        state.status === 429
            ? 'Demasiadas peticiones. Regulando el ritmo…'
            : state.status === 503 || state.status === 504
                ? 'Mucho tráfico. El servicio está recuperándose…'
                : 'Conectando con el servicio…';

    const subtitle = count != null ? `Reintentando en ${count}s…` : 'Volveremos a intentarlo.';

    const refresh = () => window.location.reload(); // simple y universal

    return (
        <div className="net-banner" role="status" aria-live="polite">
            <div className="net-banner__content">
                <strong>{label}</strong>
                <span className="net-banner__sub">{subtitle}</span>
            </div>
            <button className="net-banner__btn" onClick={refresh}>Reintentar ahora</button>
        </div>
    );
}
