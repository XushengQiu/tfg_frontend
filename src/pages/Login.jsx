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
            navigate('/onboarding', { replace: true }); // tu flujo de alta en backend
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
            // Evita enumeración de usuarios: respuesta genérica aunque no exista
            if (err?.code === 'auth/user-not-found') {
                setResetSent(true);
            } else {
                alert(err?.message || 'No se pudo enviar el correo de restablecimiento.');
            }
        } finally {
            setResetBusy(false);
        }
    };

    return (
        <main className="login-page" style={{ minHeight: '100vh', display:'flex', flexDirection:'column', alignItems:'center' }}>
            <div style={{ marginTop:'4rem', width:'min(92vw, 420px)' }}>
                <h1 style={{ textAlign:'center' }}>Bienvenido a GoLife</h1>

                {/* Google */}
                <div style={{ display:'flex', justifyContent:'center', marginTop:'1rem' }}>
                    <button onClick={loginWithGoogle} style={{ padding:'0.6rem 1.2rem' }}>
                        Iniciar sesión con Google
                    </button>
                </div>

                {/* Divider */}
                <div style={{ textAlign:'center', margin:'1rem 0', color:'#777' }}>— o —</div>

                {/* Email / Password */}
                <form onSubmit={doEmailLogin} style={{ display:'grid', gap:'.6rem' }}>
                    <label>
                        Correo electrónico
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={{ width:'100%', padding:'.5rem', marginTop:'.25rem' }}
                        />
                    </label>

                    <label>
                        Contraseña
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            style={{ width:'100%', padding:'.5rem', marginTop:'.25rem' }}
                        />
                    </label>

                    {/* Olvidé mi contraseña */}
                    <div style={{ textAlign:'right', marginTop:'-.25rem' }}>
                        <button
                            type="button"
                            className="linklike"
                            onClick={openReset}
                            title="Restablecer contraseña por correo"
                        >
                            ¿Has olvidado tu contraseña?
                        </button>
                    </div>

                    <div style={{ display:'flex', gap:'.5rem', justifyContent:'space-between', marginTop:'.3rem' }}>
                        <button
                            type="submit"
                            disabled={busy}
                            style={{ flex:1, padding:'.55rem 1rem' }}
                            title="Entrar con email/contraseña"
                        >
                            {busy ? 'Entrando…' : 'Login'}
                        </button>
                        <button
                            type="button"
                            onClick={doRegister}
                            disabled={busy}
                            style={{ flex:1, padding:'.55rem 1rem' }}
                            title="Crear cuenta con email/contraseña"
                        >
                            Crear cuenta
                        </button>
                    </div>
                </form>
            </div>

            {/* Pie legal */}
            <footer className="login-legal">
                Al usar nuestros servicios aceptas nuestros{' '}
                <button type="button" className="linklike" onClick={() => setOpenModal('terms')}>
                    Términos y condiciones
                </button>{' '}
                y el{' '}
                <button type="button" className="linklike" onClick={() => setOpenModal('data')}>
                    Tratamiento de datos
                </button>.
            </footer>

            {/* Modal informativo: Términos */}
            <Modal
                open={openModal === 'terms'}
                title="Términos y condiciones"
                onClose={() => setOpenModal(null)}
                showDenyButton={false}
                showCloseIcon={true}
            >
                <TermsContent />
            </Modal>

            {/* Modal informativo: Datos */}
            <Modal
                open={openModal === 'data'}
                title="Tratamiento de datos"
                onClose={() => setOpenModal(null)}
                showDenyButton={false}
                showCloseIcon={true}
            >
                <DataPolicyContent />
            </Modal>

            {/* Modal: Restablecer contraseña (scoped con .login-page en CSS) */}
            <Modal
                open={openModal === 'reset'}
                title="Restablecer contraseña"
                onClose={() => setOpenModal(null)}
                showDenyButton={false}
                showCloseIcon={true}
                dialogClassName="modal--reset"        // ⬅️ ancho solo aquí
                bodyClassName="modal-body--reset"     // ⬅️ overflow-x solo aquí
            >
                {resetSent ? (
                    <>
                        <p>
                            Si existe una cuenta asociada a <strong>{resetEmail}</strong>, te hemos enviado un
                            correo con instrucciones para restablecer tu contraseña.
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
                                style={{ width:'100%', padding:'.5rem', marginTop:'.25rem' }}
                            />
                        </label>
                        <p style={{ color:'#666', marginTop:'-.25rem' }}>
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
