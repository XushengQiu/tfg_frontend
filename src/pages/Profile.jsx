import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth-context';
import { getProfile, deleteAccount as deleteAPI } from '../services/api';
import '../index.css';

export default function Profile() {
    // <<< NUEVO:
    const { user, logout } = useAuth();

    const [profile, setProfile] = useState(null);
    const [confirm, setConfirm] = useState(false);
    const [error,   setError]   = useState(false);
    const [timer,   setTimer]   = useState(10);
    const navigate = useNavigate();

    /* ─── carga el perfil de la API ─── */
    useEffect(() => {
        (async () => {
            try {
                const { data } = await getProfile();
                setProfile(data);
            } catch (err) {
                console.error(err);
            }
        })();
    }, []);

    /* ─── cuenta atrás de 10 s ─── */
    useEffect(() => {
        if (!confirm) { setTimer(10); return; }
        if (timer === 0) return;
        const id = setTimeout(() => setTimer(t => t - 1), 1000);
        return () => clearTimeout(id);
    }, [confirm, timer]);

    /* ─── elimina cuenta ─── */
    const handleDelete = async () => {
        try {
            await deleteAPI();
            navigate('/login', { replace: true });
        } catch (err) {
            console.error(err);
            setConfirm(false);
            setError(true);
        }
    };

    return (
        <div className="profile-wrapper">
            <header className="profile-header">
                <h2>Mis datos</h2>
                <button className="back-btn" onClick={() => navigate('/dashboard')}>
                    Volver
                </button>
            </header>

            <main className="profile-card">
                <p><strong>Nombre:</strong> {profile?.nombre}</p>
                <p><strong>Apellidos:</strong> {profile?.apellidos}</p>
                <p><strong>Correo electrónico:</strong> {user?.email}</p>
            </main>

            <footer className="profile-footer">
                <button className="logout-btn" onClick={logout}>Cerrar sesión</button>
                <button className="delete-btn" onClick={() => setConfirm(true)}>
                    Eliminar cuenta
                </button>
            </footer>

            {/* …el resto igual… */}
        </div>
    );
}
