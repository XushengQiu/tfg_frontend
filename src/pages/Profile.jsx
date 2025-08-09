// ───────────────────────────────────────────────────────────────
// src/pages/Profile.jsx
// ───────────────────────────────────────────────────────────────
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth-context";

import {
    getProfile,
    updateUser,
    deleteAccount as deleteAPI,
} from "../services/api";

import Modal from "../components/Modal";
import TermsContent from "../components/TermsContent";
import DataPolicyContent from "../components/DataPolicyContent";

import "../index.css";

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

export default function Profile() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // datos del perfil
    const [profile, setProfile] = useState(null);

    // diálogos/modales
    const [confirm, setConfirm] = useState(false);
    const [error, setError] = useState("");
    const [timer, setTimer] = useState(10);

    const [editOpen, setEditOpen] = useState(false);
    const [form, setForm] = useState({ nombre: "", apellidos: "" });

    // modales legales en Profile
    const [legalOpen, setLegalOpen] = useState(null); // 'terms' | 'data' | null

    // cargar perfil una vez
    useEffect(() => {
        (async () => {
            try {
                const { data } = await getProfile();
                setProfile(data);
            } catch (err) {
                setError(apiError(err, "No se pudieron cargar los datos del perfil."));
            }
        })();
    }, []);

    // cuenta atrás del diálogo de eliminar cuenta
    useEffect(() => {
        if (!confirm) { setTimer(10); return; }
        if (timer === 0) return;
        const id = setTimeout(() => setTimer((t) => t - 1), 1000);
        return () => clearTimeout(id);
    }, [confirm, timer]);

    // abrir modal de edición
    const openEdit = () => {
        setForm({
            nombre: profile?.nombre || "",
            apellidos: profile?.apellidos || "",
        });
        setEditOpen(true);
    };

    // guardar cambios (apellidos opcional: puede ser "")
    const handleSave = async (e) => {
        e.preventDefault();

        const body = {};
        if (form.nombre.trim() && form.nombre !== profile.nombre) {
            body.nombre = form.nombre.trim();
        }
        if (form.apellidos !== profile.apellidos) {
            body.apellidos = (form.apellidos ?? "").trim(); // "" válido
        }

        if (Object.keys(body).length === 0) {
            setEditOpen(false);
            return;
        }

        try {
            const { data } = await updateUser(body);
            setProfile(data);
            setEditOpen(false);
        } catch (err) {
            setError(apiError(err, "No se pudo actualizar el perfil."));
            setEditOpen(false);
        }
    };

    // eliminar cuenta
    const handleDelete = async () => {
        try {
            await deleteAPI();
            navigate("/login", { replace: true });
        } catch (err) {
            setError(apiError(err, "No se pudo eliminar la cuenta."));
            setConfirm(false);
        }
    };

    return (
        <div className="profile-wrapper">
            {/* header */}
            <header className="profile-header">
                <h2>Mis datos</h2>
                <button
                    className="back-btn"
                    onClick={() =>
                        navigate("/dashboard", {
                            state: { dashboardCache: location.state?.dashboardCache ?? null },
                        })
                    }
                >
                    Volver
                </button>
            </header>

            {/* datos */}
            <main className="profile-card">
                <p><strong>Nombre:</strong> {profile?.nombre}</p>
                <p><strong>Apellidos:</strong> {profile?.apellidos || "—"}</p>
                <p><strong>Email:</strong> {user?.email}</p>
            </main>

            {/* acciones */}
            <footer className="profile-footer">
                <button className="logout-btn" onClick={logout}>Cerrar sesión</button>
                <button className="edit-btn" onClick={openEdit}>Editar datos</button>
                <button className="delete-btn" onClick={() => setConfirm(true)}>Eliminar cuenta</button>
            </footer>

            {/* Botones flotantes legales */}
            <div className="legal-fabs" aria-label="Accesos legales">
                <button
                    type="button"
                    className="legal-fab"
                    onClick={() => setLegalOpen("terms")}
                    aria-label="Abrir Términos y condiciones"
                >
                    Términos y condiciones
                </button>
                <button
                    type="button"
                    className="legal-fab"
                    onClick={() => setLegalOpen("data")}
                    aria-label="Abrir Tratamiento de datos"
                >
                    Tratamiento de datos
                </button>
            </div>

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
                                    required
                                />
                            </label>

                            <label>
                                Apellidos (opcional):
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

            {/* Modales legales informativos */}
            <Modal
                open={legalOpen === "terms"}
                title="Términos y condiciones"
                onClose={() => setLegalOpen(null)}
                showDenyButton={false}
                showCloseIcon={true}
            >
                <TermsContent />
            </Modal>

            <Modal
                open={legalOpen === "data"}
                title="Tratamiento de datos"
                onClose={() => setLegalOpen(null)}
                showDenyButton={false}
                showCloseIcon={true}
            >
                <DataPolicyContent />
            </Modal>
        </div>
    );
}
