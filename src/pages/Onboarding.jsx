import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUser } from '../services/api';
import Modal from '../components/Modal';
import TermsContent from '../components/TermsContent';
import DataPolicyContent from '../components/DataPolicyContent';

export default function Onboarding() {
    const [name, setName] = useState('');
    const [surname, setSurname] = useState('');
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
            // Ajusta el payload a tu API si usa otros nombres de campos
            await createUser({ nombre: name, apellidos: surname });
            navigate('/dashboard', { replace: true });
        } catch (err) {
            console.error(err);
            alert('No se pudo crear el usuario. Inténtalo más tarde.');
            navigate('/login', { replace: true });
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
                    <input value={name} onChange={(e) => setName(e.target.value)} required />
                </label>

                &nbsp;&nbsp;

                <label>
                    Apellidos:&nbsp;
                    <input value={surname} onChange={(e) => setSurname(e.target.value)} required />
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
