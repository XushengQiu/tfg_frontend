// ───────────────────────────────────────────────────────────────
// src/pages/Onboarding.jsx
// ───────────────────────────────────────────────────────────────
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUser } from '../services/api';
import Modal from '../components/Modal';
import TermsContent from '../components/TermsContent';
import DataPolicyContent from '../components/DataPolicyContent';
import appLogo from '../assets/icons/logo.svg';

/* Helper para mostrar "Error <status>: <mensaje>" desde el backend */
const apiError = (err, fallback) => {
    const res = err?.response;
    const status = res?.status;
    const data = res?.data;
    let msg =
        (typeof data === 'string' && data) ||
        (data?.message || data?.error) ||
        fallback ||
        'Error inesperado';
    if (status) msg = `Error ${status}: ${msg}`;
    return msg;
};

export default function Onboarding() {
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [surname, setSurname] = useState('');
    const [loading, setLoading] = useState(false);

    const [showTerms, setShowTerms] = useState(false);
    const [showData, setShowData] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setShowTerms(true); // primero términos
    };

    // --- Términos ---
    const acceptTerms = () => {
        setShowTerms(false);
        setShowData(true);
    };
    const denyTerms = () => setShowTerms(false);

    // --- Tratamiento de datos ---
    const acceptData = async () => {
        setShowData(false);
        setLoading(true);
        try {
            const payload = {
                nombre: name.trim(),
                apellidos: surname.trim() || null,
            };
            await createUser(payload);
            navigate('/dashboard', { replace: true });
        } catch (err) {
            alert(apiError(err, 'No se pudo crear el usuario'));
        } finally {
            setLoading(false);
        }
    };
    const denyData = () => setShowData(false);

    return (
        <>
            <main className="onboarding-page">
                <form className="onboarding-card" onSubmit={handleSubmit}>
                    <h1 className="onboarding-title">Datos del usuario</h1>

                    <div className="onboarding-fields">
                        <label className="onboarding-field">
                            <span>Nombre</span>
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                minLength={2}
                                maxLength={50}
                            />
                        </label>

                        <label className="onboarding-field">
                            <span>Apellidos (opcional)</span>
                            <input
                                value={surname}
                                onChange={(e) => setSurname(e.target.value)}
                                placeholder="(opcional)"
                                maxLength={50}
                            />
                        </label>
                    </div>

                    <button type="submit" className="onboarding-submit" disabled={loading}>
                        {loading ? 'Creando…' : 'Crear'}
                    </button>
                </form>
            </main>

            <img src={appLogo} alt="GoLife logo" className="corner-logo" />

            <div className="legal-fabs" aria-label="Accesos legales">
                <button
                    type="button"
                    className="legal-fab"
                    onClick={() => setShowTerms(true)}
                >
                    Términos y condiciones
                </button>

                <button
                    type="button"
                    className="legal-fab"
                    onClick={() => setShowData(true)}
                >
                    Tratamiento de datos
                </button>
            </div>

            {/* Modal 1: Términos */}
            <Modal
                open={showTerms}
                title="Términos y condiciones"
                onClose={denyTerms}
                onAccept={acceptTerms}
                acceptText="Aceptar"
                denyText="Denegar"
                requireScroll
                showCloseIcon={false}
            >
                <TermsContent />
            </Modal>

            {/* Modal 2: Tratamiento de datos */}
            <Modal
                open={showData}
                title="Tratamiento de datos"
                onClose={denyData}
                onAccept={acceptData}
                acceptText="Aceptar"
                denyText="Denegar"
                requireScroll
                showCloseIcon={false}
            >
                <DataPolicyContent />
            </Modal>
        </>
    );
}
