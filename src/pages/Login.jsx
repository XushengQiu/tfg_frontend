import { useState } from 'react';
import { useAuth } from '../auth-context';
import Modal from '../components/Modal';
import TermsContent from '../components/TermsContent';
import DataPolicyContent from '../components/DataPolicyContent';

export default function Login() {
    const { login, loginEmail, registerEmail } = useAuth();
    const [openModal, setOpenModal] = useState(null); // 'terms' | 'data' | null

    // email/password
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [busy, setBusy] = useState(false);

    const doEmailLogin = async (e) => {
        e?.preventDefault();
        if (!email || !password) return;
        setBusy(true);
        try {
            await loginEmail(email.trim(), password);
        } catch (err) {
            alert(err?.message || 'No se pudo iniciar sesión.');
        } finally {
            setBusy(false);
        }
    };

    const doRegister = async (e) => {
        e?.preventDefault();
        if (!email || !password) return;
        if (password.length < 6) {
            alert('La contraseña debe tener al menos 6 caracteres (requisito de Firebase).');
            return;
        }
        setBusy(true);
        try {
            await registerEmail(email.trim(), password);
            // → navega a /onboarding donde harás el POST /api/usuarios
        } catch (err) {
            alert(err?.message || 'No se pudo crear la cuenta.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <main style={{ minHeight: '100vh', display:'flex', flexDirection:'column', alignItems:'center' }}>
            <div style={{ marginTop:'4rem', width:'min(92vw, 420px)' }}>
                <h1 style={{ textAlign:'center' }}>Bienvenido a GoLife</h1>

                {/* Google */}
                <div style={{ display:'flex', justifyContent:'center', marginTop:'1rem' }}>
                    <button onClick={login} style={{ padding:'0.6rem 1.2rem' }}>
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

                    <div style={{ display:'flex', gap:'.5rem', justifyContent:'space-between', marginTop:'.3rem' }}>
                        <button
                            type="submit"
                            disabled={busy}
                            style={{ flex:1, padding:'.55rem 1rem' }}
                            title="Entrar con email/contraseña"
                        >
                            Login
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
        </main>
    );
}
