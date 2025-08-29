// ───────────────────────────────────────────────────────────────
// src/pages/Login.jsx
// ───────────────────────────────────────────────────────────────
import { useState } from 'react';
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
} from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../auth-context';
import Modal from '../components/Modal';
import TermsContent from '../components/TermsContent';
import DataPolicyContent from '../components/DataPolicyContent';

// assets
import googleLogo from '../assets/icons/google_logo.png';      // botón Google
import libraryBG from '../assets/media/library_1536x1760.png'; // fondo mitad izquierda

export default function Login() {
    const { login: loginWithGoogle } = useAuth();
    const navigate = useNavigate();

    const [openModal, setOpenModal] = useState(null); // 'terms' | 'data' | 'reset' | null

    // email/password
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [busy, setBusy] = useState(false);

    // reset password
    const [resetEmail, setResetEmail] = useState('');
    const [resetBusy, setResetBusy] = useState(false);
    const [resetSent, setResetSent] = useState(false);

    // ── Login con email ──────────────────────────────────────────
    const doEmailLogin = async (e) => {
        e?.preventDefault();
        if (!email || !password) return;
        setBusy(true);
        try {
            await signInWithEmailAndPassword(getAuth(), email.trim(), password);
            navigate('/dashboard', { replace: true });
        } catch (err) {
            alert(err?.message || 'No se pudo iniciar sesión.');
        } finally {
            setBusy(false);
        }
    };

    // ── Registro con email ───────────────────────────────────────
    const doRegister = async (e) => {
        e?.preventDefault();
        if (!email || !password) return;
        if (password.length < 6) {
            alert('La contraseña debe tener al menos 6 caracteres (requisito de Firebase).');
            return;
        }
        setBusy(true);
        try {
            await createUserWithEmailAndPassword(getAuth(), email.trim(), password);
            navigate('/onboarding', { replace: true });
        } catch (err) {
            alert(err?.message || 'No se pudo crear la cuenta.');
        } finally {
            setBusy(false);
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
            alert('Introduce un correo válido.');
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
                alert(err?.message || 'No se pudo enviar el correo de restablecimiento.');
            }
        } finally {
            setResetBusy(false);
        }
    };

    // ── Estilos inline ───────────────────────────────────────────
    const S = {
        page: {
            minHeight: '100vh',
            display: 'grid',
            gridTemplateColumns: '40% 60%',
            // Fondo que se verá en el hueco de las esquinas redondeadas del panel derecho:
            background:
                'linear-gradient(to bottom, #002c89 0%, #002c89 50%, #EAF7F1 50%, #EAF7F1 100%)',
        },

        // IZQUIERDA (sin bordes redondeados ahora)
        left: {
            position: 'relative',
            overflow: 'hidden',
        },
        leftBg: {
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${libraryBG})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
        },
        leftContent: {
            position: 'relative',
            zIndex: 1,
            height: '100%',
            display: 'grid',
            gridTemplateRows: '1.15fr auto 1.3fr', // texto centrado verticalmente (ligeramente abajo)
            alignItems: 'center',
            justifyItems: 'center',
            padding: '28px',
        },
        // Texto sin fondo
        midText: {
            gridRow: 2,
            alignSelf: 'center',
            justifySelf: 'center',
            color: '#0b1f3a',
            fontSize: '.85rem',
            lineHeight: 1.4,
            background: 'transparent',
            padding: 0,
            textAlign: 'left',
        },

        // DERECHA (con borde redondeado solo a la izquierda)
        right: {
            position: 'relative',
            display: 'grid',
            gridTemplateRows: 'auto 1fr',
            alignItems: 'start',
            justifyItems: 'center',
            background: '#fff',
            paddingTop: '2.25rem',
            borderTopLeftRadius: 12,
            borderBottomLeftRadius: 12,
            overflow: 'hidden', // por si hay sombras internas, que respeten el radio
        },
        h1: {
            alignSelf: 'start',
            justifySelf: 'center',
            margin: 0,
            marginTop: '2.8rem',
            paddingTop: '.25rem',
            marginBottom: '1.2rem',
            fontSize: 'clamp(2.2rem, 3.2vw, 2.8rem)',
            lineHeight: 1.12,
            color: '#111',
            textAlign: 'center',
        },
        card: {
            alignSelf: 'center',
            justifySelf: 'center',
            width: 'min(86%, 440px)',
            margin: 0,
            transform: 'translateY(-7vh)',
        },

        // Botón Google
        gBtn: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '.55rem',
            padding: '.6rem 1rem',
            background: '#fff',
            border: '1px solid #d9dfe5',
            borderRadius: 12,
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0,0,0,.10)',
        },
        gIcon: { width: 18, height: 18, display: 'block' },

        divider: { textAlign: 'center', margin: '1rem 0', color: '#777' },

        form: { display: 'grid', gap: '.6rem' },
        label: { display: 'block' },
        input: {
            width: '100%',
            padding: '.55rem .75rem',
            marginTop: '.25rem',
            borderRadius: 10,
            border: '1px solid #D7DEE3',
            outline: 'none',
        },
        inputFocus: {
            boxShadow: '0 0 0 3px rgba(79,190,152,.18)',
            borderColor: 'var(--brand)',
        },

        rowBtns: { display: 'flex', gap: '.6rem', justifyContent: 'space-between', marginTop: '.3rem' },
        btn: {
            flex: 1,
            padding: '.6rem 1rem',
            borderRadius: 12,
            cursor: 'pointer',
            border: '1px solid #cfd8dc',
            background: '#eef1f3',
            color: '#111',
            boxShadow: '0 2px 6px rgba(0,0,0,.10)',
        },
        btnPrimary: {
            flex: 1,
            padding: '.6rem 1rem',
            borderRadius: 12,
            cursor: 'pointer',
            border: '1px solid var(--brand-600)',
            background: 'var(--brand)',
            color: '#fff',
            boxShadow: '0 2px 6px rgba(0,0,0,.15)',
        },
        reset: { textAlign: 'right', marginTop: '-.25rem' },

        // Pie legal fijo en la mitad derecha
        legalFooter: {
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            bottom: 18,
            width: 'min(88%, 620px)',
            color: '#666',
            fontSize: '.9rem',
            textAlign: 'center',
        },
    };

    return (
        <main className="login-page" style={S.page}>
            {/* LADO IZQUIERDO */}
            <section style={S.left} aria-label="Fondo biblioteca y créditos">
                <div style={S.leftBg} />
                <div style={S.leftContent}>
                    <div style={S.midText}>
                        <strong style={{ color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,.25)' }}>
                            Proyecto de Fin de Grado realizado por:
                        </strong>
                        <ul style={{ margin: '.4rem 0 0 1rem' }}>
                            <li>Xusheng Qiu Huang</li>
                            <li>Eduardo Segarra Ledesma</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* LADO DERECHO */}
            <section style={S.right}>
                <h1 style={S.h1}>Bienvenido a GoLife</h1>

                <div style={S.card}>
                    {/* Google */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0rem' }}>
                        <button type="button" onClick={loginWithGoogle} style={S.gBtn} title="Iniciar sesión con Google">
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
                        </label>

                        <label style={S.label}>
                            Contraseña
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                style={S.input}
                                onFocus={(e) => Object.assign(e.target.style, S.inputFocus)}
                                onBlur={(e) => {
                                    e.target.style.boxShadow = '';
                                    e.target.style.borderColor = '#D7DEE3';
                                }}
                            />
                        </label>

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

            {/* Modales */}
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
        </main>
    );
}
