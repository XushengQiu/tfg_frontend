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

    // Botones flotantes: SOLO informativos
    const [showTermsInfo, setShowTermsInfo] = useState(false);
    const [showDataInfo, setShowDataInfo] = useState(false);

    // Flujo de creación: obligatorio aceptar con scroll
    const [showTermsFlow, setShowTermsFlow] = useState(false);
    const [showDataFlow, setShowDataFlow] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        // Al crear: lanzar FLUJO obligatorio empezando por Términos
        setShowTermsFlow(true);
    };

    // --- Flujo obligatorio: Términos ---
    const acceptTermsFlow = () => {
        setShowTermsFlow(false);
        setShowDataFlow(true);
    };
    const denyTermsFlow = () => setShowTermsFlow(false);

    // --- Flujo obligatorio: Tratamiento de datos ---
    const acceptDataFlow = async () => {
        setShowDataFlow(false);
        setLoading(true);
        try {
            const payload = {
                nombre: name.trim(),
                apellidos: surname.trim() || null,
            };
            await createUser(payload);
            navigate('/dashboard', { replace: true, state: { firstVisit: true } });
        } catch (err) {
            alert(apiError(err, 'No se pudo crear el usuario'));
        } finally {
            setLoading(false);
        }
    };
    const denyDataFlow = () => setShowDataFlow(false);

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

            {/* Botones flotantes: solo informativos */}
            <div className="legal-fabs" aria-label="Accesos legales">
                <button
                    type="button"
                    className="legal-fab"
                    onClick={() => setShowTermsInfo(true)}
                >
                    Términos y condiciones
                </button>

                <button
                    type="button"
                    className="legal-fab"
                    onClick={() => setShowDataInfo(true)}
                >
                    Tratamiento de datos
                </button>
            </div>

            {/* -------- Modales informativos (sin aceptar/denegar) -------- */}
            <Modal
                open={showTermsInfo}
                title="Términos y condiciones"
                onClose={() => setShowTermsInfo(false)}
            >
                <TermsContent />
            </Modal>

            <Modal
                open={showDataInfo}
                title="Tratamiento de datos"
                onClose={() => setShowDataInfo(false)}
            >
                <DataPolicyContent />
            </Modal>

            {/* -------- Flujo OBLIGATORIO al crear cuenta -------- */}
            {/* 1) Términos */}
            <Modal
                open={showTermsFlow}
                title="Términos y condiciones"
                onClose={denyTermsFlow}
                onAccept={acceptTermsFlow}
                acceptText="Aceptar"
                denyText="Denegar"
                requireScroll
                showCloseIcon={false}
            >
                <TermsContent />
            </Modal>

            {/* 2) Tratamiento de datos */}
            <Modal
                open={showDataFlow}
                title="Tratamiento de datos"
                onClose={denyDataFlow}
                onAccept={acceptDataFlow}
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
