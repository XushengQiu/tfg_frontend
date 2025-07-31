// ───────────────────────────────────────────────────────────────
// src/pages/Profile.jsx
// ───────────────────────────────────────────────────────────────
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth-context";

import {
    getProfile,
    updateUser,          // PATCH /api/usuarios
    deleteAccount as deleteAPI,
} from "../services/api";

import "../index.css";

export default function Profile() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    /* datos */
    const [profile, setProfile] = useState(null);

    /* modales */
    const [confirm, setConfirm] = useState(false);
    const [error,   setError]   = useState("");
    const [timer,   setTimer]   = useState(10);

    /* modal edición */
    const [editOpen, setEditOpen] = useState(false);
    const [form, setForm] = useState({ nombre: "", apellidos: "" });

    /* cargar perfil */
    useEffect(() => {
        (async () => {
            try {
                const { data } = await getProfile();
                setProfile(data);
            } catch (err) { console.error(err); }
        })();
    }, []);

    /* cuenta atrás delete */
    useEffect(() => {
        if (!confirm) { setTimer(10); return; }
        if (timer === 0) return;
        const id = setTimeout(() => setTimer(t => t - 1), 1000);
        return () => clearTimeout(id);
    }, [confirm, timer]);

    const handleDelete = async () => {
        try {
            await deleteAPI();
            navigate("/login", { replace: true });
        } catch (err) {
            console.error(err);
            setError("No se pudo eliminar la cuenta.");
            setConfirm(false);
        }
    };

    /* abrir diálogo editar */
    const openEdit = () => {
        setForm({
            nombre: profile?.nombre || "",
            apellidos: profile?.apellidos || "",
        });
        setEditOpen(true);
    };

    /* guardar cambios (permite apellidos vacíos) */
    const handleSave = async (e) => {
        e.preventDefault();

        const body = {};
        /* nombre: solo si cambia y cumple minLength */
        if (form.nombre.trim() && form.nombre !== profile.nombre) {
            body.nombre = form.nombre.trim();
        }
        /* apellidos: enviar siempre que cambie (puede ser "") */
        if (form.apellidos !== profile.apellidos) {
            body.apellidos = form.apellidos.trim();   // puede quedar ""
        }

        if (Object.keys(body).length === 0) {
            setEditOpen(false);
            return; // nada que actualizar
        }

        try {
            const { data } = await updateUser(body);
            setProfile(data);
            setEditOpen(false);
        } catch (err) {
            console.error(err);
            setError("No se pudo actualizar el perfil.");
            setEditOpen(false);
        }
    };

    return (
        <div className="profile-wrapper">
            {/* header */}
            <header className="profile-header">
                <h2>Mis datos</h2>
                <button className="back-btn" onClick={() => navigate("/dashboard")}>
                    Volver
                </button>
            </header>

            {/* datos */}
            <main className="profile-card">
                <p><strong>Nombre:</strong>     {profile?.nombre}</p>
                <p><strong>Apellidos:</strong>  {profile?.apellidos || "—"}</p>
                <p><strong>Email:</strong>      {user?.email}</p>
            </main>

            {/* acciones */}
            <footer className="profile-footer">
                <button className="logout-btn" onClick={logout}>Cerrar sesión</button>
                <button className="edit-btn"   onClick={openEdit}>Editar datos</button>
                <button className="delete-btn" onClick={() => setConfirm(true)}>Eliminar cuenta</button>
            </footer>

            {/* modal editar */}
            {editOpen && (
                <div className="modal-overlay" onClick={() => setEditOpen(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Editar datos</h3>
                        <form onSubmit={handleSave}>
                            <label>
                                Nombre:
                                <input
                                    value={form.nombre}
                                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                                    minLength={2}
                                    maxLength={50}
                                />
                            </label>

                            <label>
                                Apellidos:
                                <input
                                    value={form.apellidos}
                                    onChange={(e) => setForm({ ...form, apellidos: e.target.value })}
                                    maxLength={50}
                                />
                            </label>

                            <div style={{ marginTop: "1rem", display: "flex", gap: "1rem" }}>
                                <button type="button" onClick={() => setEditOpen(false)}>Cancelar</button>
                                <button type="submit">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* modal confirm delete */}
            {confirm && (
                <div className="modal-overlay">
                    <div className="modal">
                        <p>
                            ¿Estás seguro de querer eliminar esta cuenta?
                            <br />Esta acción es irreversible.
                        </p>
                        <div className="modal-actions">
                            <button
                                className="delete-btn"
                                disabled={timer > 0}
                                onClick={handleDelete}
                            >
                                {timer > 0 ? `Eliminar cuenta (${timer})` : "Eliminar cuenta"}
                            </button>
                            <button className="back-btn" onClick={() => setConfirm(false)}>
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* modal error */}
            {error && (
                <div className="modal-overlay">
                    <div className="modal">
                        <p>{error}</p>
                        <button className="back-btn" onClick={() => setError("")}>
                            Volver
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
