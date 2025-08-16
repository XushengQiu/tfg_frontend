// ───────────────────────────────────────────────────────────────
// src/pages/Onboarding.jsx
// ───────────────────────────────────────────────────────────────
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUser } from '../services/api';
import Modal from '../components/Modal';
import TermsContent from '../components/TermsContent';
import DataPolicyContent from '../components/DataPolicyContent';

/* Helper para mostrar "Error <status>: <mensaje>" desde el backend */
const apiError = (err, fallback) => {
    const res = err?.response;
    const status = res?.status;
    const data = res?.data;

    let msg =
        (typeof data === "string" && data) ||
        data?.message ||
        data?.error ||
        (Array.isArray(data?.errors) &&
            (typeof data.errors[0] === "string"
                ? data.errors[0]
                : data.errors[0]?.msg || data.errors[0]?.message)) ||
        res?.statusText ||
        err?.message ||
        fallback;

    return status
        ? `Error ${status}: ${msg || fallback || "Solicitud fallida"}`
        : msg || fallback || "Se produjo un error.";
};

export default function Onboarding() {
    const [name, setName] = useState('');
    const [surname, setSurname] = useState(''); // opcional
    const [loading, setLoading] = useState(false);

    // cadena de modales
    const [showTerms, setShowTerms] = useState(false);
    const [showData, setShowData] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        setShowTerms(true);
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
                apellidos: (surname || '').trim(),
            };
            await createUser(payload);
            navigate('/dashboard', { replace: true });
        } catch (err) {
            alert(apiError(err, "No se pudo crear el usuario."));
            navigate('/login', { replace: true });
        } finally {
            setLoading(false);
        }
    };
    const denyData = () => setShowData(false);

    return (
        <>
            <form onSubmit={handleSubmit} style={{ margin: '2rem' }}>
                <h2>Datos del usuario</h2>

                <label>
                    Nombre:&nbsp;
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        minLength={2}
                        maxLength={50}
                    />
                </label>

                &nbsp;&nbsp;

                <label>
                    Apellidos (opcional):&nbsp;
                    <input
                        value={surname}
                        onChange={(e) => setSurname(e.target.value)}
                        placeholder="(opcional)"
                        maxLength={50}
                    />
                </label>

                &nbsp;&nbsp;

                <button type="submit" disabled={loading}>
                    {loading ? 'Creando…' : 'Crear'}
                </button>
            </form>

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
