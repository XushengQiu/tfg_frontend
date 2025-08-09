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
        // empieza siempre mostrando Términos
        setShowTerms(true);
    };

    // --- Términos ---
    const acceptTerms = () => {
        setShowTerms(false);
        setShowData(true);
    };
    const denyTerms = () => {
        setShowTerms(false); // vuelve al formulario con los datos intactos
    };

    // --- Tratamiento de datos ---
    const acceptData = async () => {
        setShowData(false);
        setLoading(true);
        try {
            // apellidos opcional: si viene vacío, mandamos ""
            const payload = {
                nombre: name.trim(),
                apellidos: (surname || '').trim(), // "" si no hay apellidos
            };

            await createUser(payload);
            navigate('/dashboard', { replace: true });
        } catch (err) {
            alert(apiError(err, "No se pudo crear el usuario."));
            navigate('/login', { replace: true }); // se mantiene tu flujo actual
        } finally {
            setLoading(false);
        }
    };
    const denyData = () => {
        setShowData(false); // vuelve al formulario
    };

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
                    />
                </label>

                &nbsp;&nbsp;

                <label>
                    Apellidos (opcional):&nbsp;
                    <input
                        value={surname}
                        onChange={(e) => setSurname(e.target.value)}
                        placeholder="(opcional)"
                    />
                </label>

                &nbsp;&nbsp;

                <button type="submit" disabled={loading}>
                    {loading ? 'Creando…' : 'Crear'}
                </button>
            </form>

            {/* Modal 1: Términos (requiere scroll para habilitar Aceptar) */}
            <Modal
                open={showTerms}
                title="Términos y condiciones"
                onClose={denyTerms}
                onAccept={acceptTerms}
                acceptText="Aceptar"
                denyText="Denegar"
                requireScroll
                showCloseIcon={false}   // en Onboarding no mostramos la X
            >
                <TermsContent />
            </Modal>

            {/* Modal 2: Tratamiento de datos (requiere scroll para habilitar Aceptar) */}
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
