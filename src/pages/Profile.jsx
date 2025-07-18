// src/pages/Profile.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth-context';
import { getProfile, deleteAccount as deleteAPI } from '../services/api';
import '../index.css';

export default function Profile() {
    /* ─── contexto de autenticación ─── */
    const { user, logout } = useAuth();

    /* ─── estado local ─── */
    const [profile, setProfile] = useState(null);
    const [confirm, setConfirm] = useState(false);  // muestra el modal de confirmación
    const [error,   setError]   = useState(false);  // muestra el modal de error
    const [timer,   setTimer]   = useState(10);     // cuenta atrás para confirmar
    const navigate = useNavigate();

    /* ─── carga el perfil de la API ─── */
    useEffect(() => {
        (async () => {
            try {
                const { data } = await getProfile();     // GET /api/perfil
                setProfile(data);
            } catch (err) {
                console.error(err);
            }
        })();
    }, []);

    /* ─── cuenta atrás de 10 s para el botón "Eliminar cuenta" ─── */
    useEffect(() => {
        if (!confirm) { setTimer(10); return; }          // si se cierra el modal, reinicia
        if (timer === 0) return;                         // llega a 0 → se habilita el botón
        const id = setTimeout(() => setTimer(t => t - 1), 1000);
        return () => clearTimeout(id);
    }, [confirm, timer]);

    /* ─── elimina la cuenta ─── */
    const handleDelete = async () => {
        try {
            await deleteAPI();                           // DELETE /api/usuarios
            navigate('/login', { replace: true });
        } catch (err) {
            console.error(err);
            setConfirm(false);
            setError(true);
        }
    };

    return (
        <div className="profile-wrapper">
            {/* ─── cabecera ─── */}
            <header className="profile-header">
                <h2>Mis datos</h2>
                <button
                    className="back-btn"
                    onClick={() => navigate('/dashboard')}
                >
                    Volver
                </button>
            </header>

            {/* ─── datos del usuario ─── */}
            <main className="profile-card">
                <p><strong>Nombre:</strong> {profile?.nombre}</p>
                <p><strong>Apellidos:</strong> {profile?.apellidos}</p>
                <p><strong>Correo electrónico:</strong> {user?.email}</p>
            </main>

            {/* ─── acciones ─── */}
            <footer className="profile-footer">
                <button className="logout-btn" onClick={logout}>
                    Cerrar sesión
                </button>

                <button
                    className="delete-btn"
                    onClick={() => setConfirm(true)}
                >
                    Eliminar cuenta
                </button>
            </footer>

            {/* ─── modal de confirmación ─── */}
            {confirm && (
                <div className="modal-overlay">
                    <div className="modal">
                        <p>
                            ¿Estás seguro de querer eliminar esta cuenta?
                            <br />
                            Esta acción será irreversible.
                        </p>

                        <div className="modal-actions">
                            <button
                                className="delete-btn"
                                disabled={timer > 0}
                                onClick={handleDelete}
                            >
                                {timer > 0
                                    ? `Eliminar cuenta (${timer})`
                                    : 'Eliminar cuenta'}
                            </button>

                            <button
                                className="back-btn"
                                onClick={() => setConfirm(false)}
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── modal de error ─── */}
            {error && (
                <div className="modal-overlay">
                    <div className="modal">
                        <p>Ha ocurrido un error.</p>
                        <button
                            className="back-btn"
                            onClick={() => setError(false)}
                        >
                            Volver
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
