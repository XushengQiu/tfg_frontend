// ───────────────────────────────────────────────────────────────
// src/pages/Profile.jsx
// ───────────────────────────────────────────────────────────────
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth-context";
import { getProfile, updateUser, deleteAccount as deleteAPI } from "../services/api";
import Modal from "../components/Modal";
import TermsContent from "../components/TermsContent";
import DataPolicyContent from "../components/DataPolicyContent";
import "../index.css";

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
    return status ? `Error ${status}: ${msg || fallback || "Solicitud fallida"}` : msg || fallback || "Se produjo un error.";
};

export default function Profile() {
    const { user, logout, profile: ctxProfile } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [profile, setProfile] = useState(null);
    const [confirm, setConfirm] = useState(false);
    const [error, setError] = useState("");
    const [timer, setTimer] = useState(10);

    const [editOpen, setEditOpen] = useState(false);
    const [form, setForm] = useState({ nombre: "", apellidos: "" });

    const [legalOpen, setLegalOpen] = useState(null); // 'terms' | 'data' | null

    // 1º usa snapshot que viene del Dashboard; 2º usa contexto; 3º GET si falta
    useEffect(() => {
        let cancelled = false;
        const snapshot = location.state?.profileSnapshot;

        if (snapshot) {
            setProfile(snapshot);
            return;
        }
        if (ctxProfile) {
            setProfile(ctxProfile);
            return;
        }

        (async () => {
            try {
                const { data } = await getProfile();
                if (!cancelled) setProfile(data);
            } catch (err) {
                if (!cancelled) setError(apiError(err, "No se pudieron cargar los datos del perfil."));
            }
        })();

        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ctxProfile]);

    useEffect(() => {
        if (!confirm) { setTimer(10); return; }
        if (timer === 0) return;
        const id = setTimeout(() => setTimer((t) => t - 1), 1000);
        return () => clearTimeout(id);
    }, [confirm, timer]);

    const openEdit = () => {
        setForm({
            nombre: profile?.nombre || "",
            apellidos: profile?.apellidos || "",
        });
        setEditOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const body = {};
        if (form.nombre.trim() && form.nombre !== profile.nombre) body.nombre = form.nombre.trim();
        if (form.apellidos !== profile.apellidos) body.apellidos = (form.apellidos ?? "").trim();

        if (Object.keys(body).length === 0) { setEditOpen(false); return; }

        try {
            const { data } = await updateUser(body);
            setProfile(data);
            setEditOpen(false);
        } catch (err) {
            setError(apiError(err, "No se pudo actualizar el perfil."));
            setEditOpen(false);
        }
    };

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

            <main className="profile-card">
                <p><strong>Nombre:</strong> {profile?.nombre}</p>
                <p><strong>Apellidos:</strong> {profile?.apellidos || "—"}</p>
                <p><strong>Email:</strong> {user?.email}</p>
            </main>

            <footer className="profile-footer">
                <button className="logout-btn" onClick={logout}>Cerrar sesión</button>
                <button className="edit-btn" onClick={openEdit}>Editar datos</button>
                <button className="delete-btn" onClick={() => setConfirm(true)}>Eliminar cuenta</button>
            </footer>

            <div className="legal-fabs" aria-label="Accesos legales">
                <button type="button" className="legal-fab" onClick={() => setLegalOpen("terms")}>Términos y condiciones</button>
                <button type="button" className="legal-fab" onClick={() => setLegalOpen("data")}>Tratamiento de datos</button>
            </div>

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

            {confirm && (
                <div className="modal-overlay">
                    <div className="modal">
                        <p>¿Estás seguro de querer eliminar esta cuenta?<br />Esta acción es irreversible.</p>
                        <div className="modal-actions">
                            <button className="delete-btn" disabled={timer > 0} onClick={handleDelete}>
                                {timer > 0 ? `Eliminar cuenta (${timer})` : "Eliminar cuenta"}
                            </button>
                            <button className="back-btn" onClick={() => setConfirm(false)}>Cancelar</button>
                        </div>
                    </div>
                </div>
            )}

            {error && (
                <div className="modal-overlay">
                    <div className="modal">
                        <p>{error}</p>
                        <button className="back-btn" onClick={() => setError("")}>Volver</button>
                    </div>
                </div>
            )}

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
