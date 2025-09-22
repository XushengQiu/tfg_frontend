// src/pages/Login.jsx
import React, { useEffect, useState, useRef } from 'react';
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
} from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../auth-context';
import Modal from '../components/Modal';
import { getProfile } from '../services/api';
import TermsContent from '../components/TermsContent';
import DataPolicyContent from '../components/DataPolicyContent';

import googleLogo from '../assets/icons/google_logo.png';
import libraryBG from '../assets/media/library_1536x1760.png';
import infoIcon from '../assets/icons/informacion.png';

// Iconos inline (sin dependencias)
const EyeOpenIcon = (props) => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"></path>
        <circle cx="12" cy="12" r="3"></circle>
    </svg>
);

const EyeOffIcon = (props) => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
        <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a20.29 20.29 0 0 1 5.06-5.94"></path>
        <path d="M9.9 4.24A10.94 10.94 0 0 1 12 5c7 0 11 7 11 7a20.87 20.87 0 0 1-3.2 4.2"></path>
        <line x1="1" y1="1" x2="23" y2="23"></line>
    </svg>
);

export default function Login() {
    const { login: loginWithGoogle } = useAuth();
    const navigate = useNavigate();

    const [openModal, setOpenModal] = useState(null); // 'terms' | 'data' | 'reset' | null

    // email/password
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [busy, setBusy] = useState(false);
    const [phase, setPhase] = useState(null); // 'auth' | 'profile' | 'google' | 'register' | null

    // mostrar/ocultar contraseña
    const [showPwd, setShowPwd] = useState(false);
    const pwdInfoRef = useRef(null);
    const infoBtnRef = useRef(null);
    const [showPwdInfo, setShowPwdInfo] = useState(false);

    // reset password
    const [resetEmail, setResetEmail] = useState('');
    const [resetBusy, setResetBusy] = useState(false);
    const [resetSent, setResetSent] = useState(false);

    const [toast, setToast] = useState(null); // { title, text } | null
    const [gPopupMsg, setGPopupMsg] = useState('');

    useEffect(() => {
        const warm = async () => {
            try { await fetch('/api/salud', { method:'HEAD', cache:'no-store' }); } catch {}
        };
        warm();
    }, []);

    useEffect(() => {
        if (!toast) return;
        if (process.env.NODE_ENV === 'test') return;
        const id = setTimeout(() => setToast(null), 5000);
        return () => clearTimeout(id);
    }, [toast]);

    useEffect(() => {
        if (process.env.NODE_ENV === 'test') return;
        const onDocClick = (ev) => {
            if (!pwdInfoRef.current) return;
            if (!pwdInfoRef.current.contains(ev.target)) setShowPwdInfo(false);
        };
        document.addEventListener('mousedown', onDocClick);
        return () => document.removeEventListener('mousedown', onDocClick);
    }, []);

    // ── Login con email ──────────────────────────────────────────
    const doEmailLogin = async (e) => {
        e?.preventDefault();
        if (!email || !password) return;
        setBusy(true);
        setPhase('auth');
        try {
            await signInWithEmailAndPassword(getAuth(), email.trim(), password);
            try {
                setPhase('profile');
                await getProfile();
                navigate('/dashboard', { replace: true });
            } catch {
                navigate('/onboarding', { replace: true });
            }

        } catch (err) {
            const code = err?.code || '';
            const base = { title: 'No se pudo iniciar sesión' };
            if (
                code === 'auth/user-not-found' ||
                code === 'auth/wrong-password' ||
                code === 'auth/invalid-credential' ||
                code === 'auth/invalid-email'
            ) {
                setToast({ ...base, text: 'Las credenciales no son correctas.' });
            } else {
                setToast({ ...base, text: err?.message || 'No se pudo iniciar sesión.' });
            }
        } finally {
            setBusy(false);
            setPhase(null);
        }
    };

    // ── Registro con email ───────────────────────────────────────
    const doRegister = async (e) => {
        e?.preventDefault();
        if (!email || !password) return;

        // 1) Largo mínimo
        if (password.length < 12) {
            setToast({
                title: 'Registro de cuenta',
                text: 'Por seguridad, la contraseña debe tener al menos 12 caracteres.',
            });
            infoBtnRef.current?.click();
            infoBtnRef.current?.focus();
            pwdInfoRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
            return;
        }

        // 2) Requisitos de complejidad (solo si ya mide 12+)
        const missing = [];
        if (!/[A-Z]/.test(password)) missing.push('una mayúscula');
        if (!/[a-z]/.test(password)) missing.push('una minúscula');
        if (!/[0-9]/.test(password)) missing.push('un número');
        if (!/[^A-Za-z0-9]/.test(password)) missing.push('un carácter especial');

        if (missing.length) {
            const list = missing.map((m) => `al menos ${m}`).join(', ');
            setToast({
                title: 'Registro de cuenta',
                text: `Por seguridad, la contraseña debe tener: ${list}.`,
            });
            infoBtnRef.current?.click();
            infoBtnRef.current?.focus();
            pwdInfoRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
            return;
        }

        setBusy(true);
        setPhase('register');
        try {
            await createUserWithEmailAndPassword(getAuth(), email.trim(), password);
            navigate('/onboarding', { replace: true });
        } catch (err) {
            // Mensajes amistosos para códigos comunes
            const code = err?.code || '';
            let text = err?.message || 'No se pudo crear la cuenta.';
            if (code === 'auth/email-already-in-use') text = 'Ese correo ya está registrado.';
            else if (code === 'auth/invalid-email') text = 'El correo no es válido.';
            else if (code === 'auth/operation-not-allowed') text = 'El registro por contraseña no está habilitado.';
            else if (code === 'auth/weak-password') text = 'Tu contraseña no cumple la política. Revisa los requisitos.';

            setToast({ title: 'Registro de cuenta', text });
        } finally {
            setBusy(false);
            setPhase(null);
        }
    };

    // Login con Google con overlay también
    const doGoogleLogin = async () => {
        setBusy(true);
        setPhase('google');
        try {
            // importante: loginWithGoogle debe devolver la promesa de signIn (sin alert internos)
            await loginWithGoogle();
            // el flujo de onAuthStateChanged se encargará de navegar
        } catch (err) {
            const code = err?.code;
            if (code === 'auth/popup-closed-by-user') {
                setGPopupMsg('Cerraste la ventana de Google antes de completar el inicio de sesión.');
                setOpenModal('gpopup');
            } else if (code === 'auth/cancelled-popup-request') {
                setGPopupMsg('Se canceló la ventana anterior de Google. Vuelve a intentarlo.');
                setOpenModal('gpopup');
            } else {
                const text = err?.message || 'No se pudo iniciar sesión.';
                setToast({title: 'Inicio con Google', text});
            }
        } finally {
            // Pase lo que pase, no dejo el overlay colgado
            setBusy(false);
            setPhase(null);
        }
    };


    // ── Reset password ───────────────────────────────────────────
    const openReset = () => {
        setResetEmail(email || '');
        setResetSent(false);
        setOpenModal('reset');
    };

    const doSendReset = async (e) => {
        e?.preventDefault();
        const mail = (resetEmail || '').trim();
        if (!mail) {
            setToast({ title: 'Restablecer contraseña', text: 'Introduce un correo válido.' });
            return;
        }
        setResetBusy(true);
        try {
            await sendPasswordResetEmail(getAuth(), mail, {
                url: window.location.origin + '/login',
                handleCodeInApp: false,
            });
            setResetSent(true);
        } catch (err) {
            if (err?.code === 'auth/user-not-found') {
                setResetSent(true); // respuesta genérica
            } else {
                setToast({
                    title: 'Restablecer contraseña',
                    text: err?.message || 'No se pudo enviar el correo de restablecimiento.',
                });
            }
        } finally {
            setResetBusy(false);
        }
    };

    // ── Estilos inline (solo lo necesario para estos cambios) ────
    const S = {
        page: {
            minHeight: '100vh',
            display: 'grid',
            gridTemplateColumns: '40% 60%',
            background:
                'linear-gradient(to bottom, #00227b 0%, #00227b 50%, #EAF7F1 50%, #EAF7F1 100%)',
        },
        left: { position: 'relative', overflow: 'hidden' },
        leftBg: {
            position: 'absolute', inset: 0,
            backgroundImage: `url(${libraryBG})`,
            backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
        },
        leftContent: {
            position: 'relative', zIndex: 1, height: '100%',
            display: 'grid', gridTemplateRows: '1.15fr auto 1.3fr',
            alignItems: 'center', justifyItems: 'center', padding: '28px',
        },
        midText: {
            gridRow: 2, color: '#0b1f3a', fontSize: '.85rem', lineHeight: 1.4,
            background: 'transparent', padding: 0, textAlign: 'left',
        },

        right: {
            position: 'relative', display: 'grid', gridTemplateRows: 'auto 1fr',
            alignItems: 'start', justifyItems: 'center', background: '#fff',
            paddingTop: '2.25rem', borderTopLeftRadius: 12, borderBottomLeftRadius: 12, overflow: 'hidden',
        },
        h1: {
            alignSelf: 'start', justifySelf: 'center', margin: 0, marginTop: '2.8rem',
            paddingTop: '.25rem', marginBottom: '1.2rem',
            fontSize: 'clamp(2.2rem, 3.2vw, 2.8rem)', lineHeight: 1.12, color: '#111', textAlign: 'center',
        },
        card: { alignSelf: 'center', justifySelf: 'center', width: 'min(86%, 440px)', transform: 'translateY(-7vh)' },

        gBtn: {
            display: 'inline-flex', alignItems: 'center', gap: '.55rem',
            padding: '.6rem 1rem', background: '#fff', border: '1px solid #d9dfe5',
            borderRadius: 12, cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,.10)',
        },
        gIcon: { width: 18, height: 18, display: 'block' },
        divider: { textAlign: 'center', margin: '1rem 0', color: '#777' },

        form: { display: 'grid', gap: '.6rem' },
        label: { display: 'block', width: '100%' },
        inputWrap: { position: 'relative', width: '100%' }, // ← mismos wrappers para ambos campos
        input: {
            width: '100%', padding: '.55rem .75rem', marginTop: '.25rem',
            borderRadius: 10, border: '1px solid #D7DEE3', outline: 'none', boxSizing: 'border-box',
        },
        inputFocus: { boxShadow: '0 0 0 3px rgba(79,190,152,.18)', borderColor: 'var(--brand)' },
        eyeBtn: {
            position: 'absolute', top: '60%', right: 8, transform: 'translateY(-50%)',
            background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, lineHeight: 1,
        },

        pwdRow: { position: 'relative', width: '100%' },
        infoArea: {
            position: 'absolute',
            right: -28,
            top: '50%',
            transform: 'translateY(-45%)',
            display: 'flex',
            alignItems: 'center'
        },

        infoBtnOut: {
            background: 'transparent', border: 'none', cursor: 'pointer',
            padding: 4, lineHeight: 1
        },
        infoIcon: { width: 16, height: 16, display: 'block', opacity: .95, position: 'relative', top: 2 },
        infoPopoverOut: {
            position: 'absolute',
            right: -180,
            bottom: 'calc(100% + 6px)',
            zIndex: 10,
            width: 'min(92vw, 280px)',
            background: '#fff',
            border: '1px solid #e0e0e0',
            borderRadius: 8,
            boxShadow: '0 8px 18px rgba(0,0,0,.10)',
            padding: '.55rem .7rem',
            fontSize: '.88rem',
            lineHeight: 1.3
        },

        rowBtns: { display: 'flex', gap: '.6rem', justifyContent: 'space-between', marginTop: '.3rem' },
        btn: {
            flex: 1, padding: '.6rem 1rem', borderRadius: 12, cursor: 'pointer',
            border: '1px solid #cfd8dc', background: '#eef1f3', color: '#111',
            boxShadow: '0 2px 6px rgba(0,0,0,.10)',
        },
        btnPrimary: {
            flex: 1, padding: '.6rem 1rem', borderRadius: 12, cursor: 'pointer',
            border: '1px solid var(--brand-600)', background: 'var(--brand)', color: '#fff',
            boxShadow: '0 2px 6px rgba(0,0,0,.15)',
        },
        reset: { textAlign: 'right', marginTop: '-.25rem' },

        legalFooter: {
            position: 'absolute', left: '50%', transform: 'translateX(-50%)',
            bottom: 18, width: 'min(88%, 620px)', color: '#666', fontSize: '.9rem', textAlign: 'center',
        },
    };

    return (
        <main className="login-page" style={S.page}>
            {/* LADO IZQUIERDO */}
            <section style={S.left} aria-label="Fondo biblioteca y créditos">
                <div style={S.leftBg} />
                <div style={S.leftContent}>
                </div>
            </section>

            {/* LADO DERECHO */}
            <section style={S.right}>
                <h1 style={S.h1}>Bienvenido a GoLife</h1>

                <div style={S.card}>
                    {/* Google */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0rem' }}>
                        <button type="button" onClick={doGoogleLogin} style={S.gBtn} title="Iniciar sesión con Google" disabled={busy} aria-disabled={busy}>
                            <img src={googleLogo} alt="" style={S.gIcon} aria-hidden="true" />
                            <span>Iniciar sesión con Google</span>
                        </button>
                    </div>

                    {/* Divider */}
                    <div style={S.divider}>— o —</div>

                    {/* Email / Password */}
                    <form onSubmit={doEmailLogin} style={S.form}>
                        <label style={S.label}>
                            Correo electrónico
                            <div style={S.inputWrap}>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    style={S.input}
                                    onFocus={(e) => Object.assign(e.target.style, S.inputFocus)}
                                    onBlur={(e) => {
                                        e.target.style.boxShadow = '';
                                        e.target.style.borderColor = '#D7DEE3';
                                    }}
                                />
                            </div>
                        </label>

                        <label style={S.label}>Contraseña</label>
                        <div style={S.pwdRow}>
                            <div style={S.inputWrap}>
                                <input
                                    type={showPwd ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    style={{ ...S.input, paddingRight: '2.2rem' }}
                                    onFocus={(e) => Object.assign(e.target.style, S.inputFocus)}
                                    onBlur={(e) => {
                                        e.target.style.boxShadow = '';
                                        e.target.style.borderColor = '#D7DEE3';
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPwd((v) => !v)}
                                    style={S.eyeBtn}
                                    aria-label={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                    title={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                >
                                    {showPwd ? <EyeOpenIcon /> : <EyeOffIcon />}
                                </button>
                            </div>

                            {/* Icono + popover FUERA del campo, a la derecha */}
                            <div ref={pwdInfoRef} style={S.infoArea}>
                                <button
                                    ref={infoBtnRef}
                                    type="button"
                                    onClick={() => setShowPwdInfo(v => !v)}
                                    style={S.infoBtnOut}
                                    aria-label="Requisitos de contraseña"
                                    title="Requisitos de contraseña"
                                >
                                    <img src={infoIcon} alt="" style={S.infoIcon} />
                                </button>

                                {showPwdInfo && (
                                    <div style={S.infoPopoverOut} role="status" aria-live="polite">
                                        <strong style={{ display: 'block', marginBottom: '.2rem', fontSize: '.9rem' }}>
                                            Requisitos de contraseña
                                        </strong>
                                        <ul style={{ margin: 0, paddingLeft: '1rem', color: '#444', fontSize: '.86rem' }}>
                                        <li>Mínimo <strong>12</strong> caracteres.</li>
                                            <li>Al menos <strong>una mayúscula</strong> (A–Z).</li>
                                            <li>Al menos <strong>una minúscula</strong> (a–z).</li>
                                            <li>Al menos <strong>un número</strong> (0–9).</li>
                                            <li>Al menos <strong>un carácter especial</strong> (p. ej. ! @ # $ % & * ?).</li>
                                        </ul>
                                        <div style={{ marginTop: '.35rem', fontSize: '.82rem', color: '#666' }}>
                                            Consejo: usa una frase fácil de recordar y añade símbolos y números.
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Olvidé mi contraseña */}
                        <div style={S.reset}>
                            <button
                                type="button"
                                className="linklike"
                                onClick={openReset}
                                title="Restablecer contraseña por correo"
                            >
                                ¿Has olvidado tu contraseña?
                            </button>
                        </div>

                        <div style={S.rowBtns}>
                            <button
                                type="submit"
                                disabled={busy}
                                style={S.btnPrimary}
                                title="Entrar con email/contraseña"
                            >
                                {busy ? 'Entrando…' : 'Login'}
                            </button>
                            <button
                                type="button"
                                onClick={doRegister}
                                disabled={busy}
                                style={S.btn}
                                title="Crear cuenta con email/contraseña"
                            >
                                Crear cuenta
                            </button>
                        </div>
                    </form>
                </div>

                {/* Pie legal */}
                <footer style={S.legalFooter}>
                    Al usar nuestros servicios aceptas nuestros{' '}
                    <button type="button" className="linklike" onClick={() => setOpenModal('terms')}>
                        Términos y condiciones
                    </button>{' '}
                    y el{' '}
                    <button type="button" className="linklike" onClick={() => setOpenModal('data')}>
                        Tratamiento de datos
                    </button>.
                </footer>
            </section>

            {/* Modales legales informativos */}
            <Modal
                open={openModal === 'terms'}
                title="Términos y condiciones"
                onClose={() => setOpenModal(null)}
                showDenyButton={false}
                showCloseIcon={true}
            >
                <TermsContent />
            </Modal>

            <Modal
                open={openModal === 'data'}
                title="Tratamiento de datos"
                onClose={() => setOpenModal(null)}
                showDenyButton={false}
                showCloseIcon={true}
            >
                <DataPolicyContent />
            </Modal>

            {/* Modal Google cancelado */}
            <Modal
                open={openModal === 'gpopup'}
                title="Inicio con Google"
                onClose={() => setOpenModal(null)}
                showDenyButton={false}
                showCloseIcon={true}
            >
                <p style={{ marginTop: 0 }}>{gPopupMsg || 'La ventana emergente de Google se cerró.'}</p>
                <ul style={{ marginTop: '.25rem', paddingLeft: '1rem', color: '#555', fontSize: '.95rem' }}>
                    <li>Vuelve a pulsar <strong>“Iniciar sesión con Google”</strong>.</li>
                    <li>Si no aparece la ventana, revisa que el navegador no esté bloqueando <strong>pop-ups</strong>.</li>
                </ul>
                <div className="modal-actions">
                    <button className="back-btn" type="button" onClick={() => setOpenModal(null)}>
                        Entendido
                    </button>
                </div>
            </Modal>

            {/* Modal de reset */}
            <Modal
                open={openModal === 'reset'}
                title="Restablecer contraseña"
                onClose={() => setOpenModal(null)}
                showDenyButton={false}
                showCloseIcon={true}
                dialogClassName="modal--reset"
                bodyClassName="modal-body--reset"
            >
                {resetSent ? (
                    <>
                        <p>
                            Si existe una cuenta asociada a <strong>{resetEmail}</strong>, te hemos enviado un correo
                            con instrucciones para restablecer tu contraseña.
                        </p>
                        <p style={{ color: '#666', marginTop: '-.25rem' }}>
                            Revisa también tu carpeta de <strong>SPAM</strong> por si el correo llega allí.
                        </p>
                        <div className="modal-actions">
                            <button className="back-btn" type="button" onClick={() => setOpenModal(null)}>
                                Entendido
                            </button>
                        </div>
                    </>
                ) : (
                    <form onSubmit={doSendReset}>
                        <label className="reset-field">
                            Correo electrónico
                            <input
                                type="email"
                                value={resetEmail}
                                onChange={(e) => setResetEmail(e.target.value)}
                                required
                                style={{ width: '100%', padding: '.5rem', marginTop: '.25rem' }}
                            />
                        </label>
                        <p style={{ color: '#666', marginTop: '-.25rem' }}>
                            Te enviaremos un enlace para crear una nueva contraseña.
                        </p>
                        <p style={{ color: '#666', marginTop: '-.5rem' }}>
                            Revisa también tu carpeta de <strong>SPAM</strong> por si el correo llega allí.
                        </p>
                        <div className="modal-actions">
                            <button className="back-btn" type="submit" disabled={resetBusy}>
                                {resetBusy ? 'Enviando…' : 'Enviar enlace'}
                            </button>
                            <button className="back-btn" type="button" onClick={() => setOpenModal(null)} disabled={resetBusy}>
                                Cancelar
                            </button>
                        </div>
                    </form>
                )}
            </Modal>

            {toast && (
                <div
                    className="toast show"
                    role="alert"
                    aria-live="assertive"
                    style={{ position: 'fixed', right: 28, bottom: 24, top: 'auto', zIndex: 998 }}
                >
                    <div className="toast-icon" aria-hidden="true">⚠️</div>
                    <div className="toast-body">
                        <div className="toast-title">{toast.title}</div>
                        <div className="toast-text">{toast.text}</div>
                    </div>
                    <button
                        className="toast-close"
                        onClick={() => setToast(null)}
                        aria-label="Cerrar notificación"
                    >
                        ×
                    </button>
                </div>
            )}
            {/* Overlay de bloqueo durante login/registro y wake-up del backend */}
            {busy && <LoginBlocker phase={phase} />}
        </main>
    );
}

// ───────────────────────────────
// Overlay reutilizable
// ───────────────────────────────
function LoginBlocker({ phase }) {
    const map = {
        auth: { title: 'Iniciando sesión…', desc: 'Validando credenciales.' },
        profile: { title: 'Preparando tu espacio…', desc: 'Estamos despertando el servidor. Puede tardar un poco la primera vez.' },
        google: { title: 'Conectando con Google…', desc: 'Un momento por favor.' },
        register: { title: 'Creando tu cuenta…', desc: 'Configurando todo para ti.' }
    };
    const { title, desc } = map[phase] || { title: 'Procesando…', desc: 'Un momento por favor.' };
    return (
        <div className="login-blocker" role="alert" aria-live="assertive" aria-busy="true">
            <div className="login-blocker__card">
                <div className="login-blocker__spinner" aria-hidden="true" />
                <div className="login-blocker__title">{title}</div>
                <div className="login-blocker__desc">{desc}</div>
                <div className="login-blocker__hint">No vuelvas a pulsar. La operación sigue en curso.</div>
            </div>
        </div>
    );
}