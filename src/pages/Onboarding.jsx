import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUser } from '../services/api';

export default function Onboarding() {
    const [name, setName] = useState('');
    const [surname, setSurname] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            /* 1) crear usuario en tu API ---------------------- */
            await createUser({ nombre: name, apellidos: surname });

            /* 2) todo OK → Dashboard -------------------------- */
            navigate('/dashboard', { replace: true });
        } catch (err) {
            console.error(err);

            /* 3) FALLO → simplemente informar al usuario ------ */
            alert('No se pudo crear el usuario. Inténtalo más tarde.');
            navigate('/login', { replace: true });
        } finally {
            setLoading(false);
        }
    };

    return (
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
    );
}
