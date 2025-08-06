import { useState } from 'react';
import { useAuth } from '../auth-context';
import Modal from '../components/Modal';
import TermsContent from '../components/TermsContent';
import DataPolicyContent from '../components/DataPolicyContent';

export default function Login() {
    const { login } = useAuth();
    const [openModal, setOpenModal] = useState(null); // 'terms' | 'data' | null

    return (
        <main style={{ minHeight: '100vh', display:'flex', flexDirection:'column', alignItems:'center' }}>
            <div style={{ marginTop:'4rem' }}>
                <h1>Bienvenido a GoLife</h1>
                <button onClick={login} style={{ padding:'0.6rem 1.2rem', marginTop:'1rem' }}>
                    Iniciar sesión con Google
                </button>
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
