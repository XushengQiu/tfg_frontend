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
import appLogo from "../assets/icons/logo.svg";

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

    // Carga: 1) snapshot del Dashboard, 2) contexto, 3) GET si falta
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

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ctxProfile]);

    // Cuenta atrás en confirmación de borrado
    useEffect(() => {
        if (!confirm) {
            setTimer(10);
            return;
        }
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
        if ((form.apellidos ?? "") !== (profile.apellidos ?? "")) body.apellidos = (form.apellidos ?? "").trim();

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
                <p>
                    <strong>Nombre:</strong> {profile?.nombre}
                </p>
                <p>
                    <strong>Apellidos:</strong> {profile?.apellidos || "—"}
                </p>
                <p>
                    <strong>Email:</strong> {user?.email}
                </p>
            </main>

            <footer className="profile-footer">
                <button className="logout-btn" onClick={logout}>
                    Cerrar sesión
                </button>
                <button className="edit-btn" onClick={openEdit}>
                    Editar datos
                </button>
                <button className="delete-btn" onClick={() => setConfirm(true)}>
                    Eliminar cuenta
                </button>
            </footer>

            {/* Accesos legales */}
            <div className="legal-fabs" aria-label="Accesos legales">
                <button type="button" className="legal-fab" onClick={() => setLegalOpen("terms")}>
                    Términos y condiciones
                </button>
                <button type="button" className="legal-fab" onClick={() => setLegalOpen("data")}>
                    Tratamiento de datos
                </button>
            </div>

            {/* Logo fijo en esquina inferior izquierda */}
            <img src={appLogo} alt="GoLife logo" className="corner-logo" />

            {/* Modal: Editar datos (estilo bonito pedido) */}
            {editOpen && (
                <div className="modal-overlay" onClick={() => setEditOpen(false)}>
                    <div
                        className="modal"
                        onClick={(e) => e.stopPropagation()}
                        style={{ borderRadius: 14, padding: "20px 24px", minWidth: 520 }}
                    >
                        <h3 style={{ textAlign: "center", marginTop: 4, marginBottom: 14 }}>Editar datos</h3>

                        <form onSubmit={handleSave}>
                            <div style={{ display: "grid", gap: 12 }}>
                                <label style={{ display: "grid", gap: 6 }}>
                                    <span>Nombre:</span>
                                    <input
                                        value={form.nombre}
                                        onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                                        minLength={2}
                                        maxLength={50}
                                        required
                                        style={{
                                            borderRadius: 10,
                                            border: "1px solid #E0E0E0",
                                            padding: "10px 12px",
                                            outline: "none",
                                        }}
                                    />
                                </label>

                                <label style={{ display: "grid", gap: 6 }}>
                                    <span>Apellidos (opcional):</span>
                                    <input
                                        value={form.apellidos}
                                        onChange={(e) => setForm((f) => ({ ...f, apellidos: e.target.value }))}
                                        maxLength={50}
                                        style={{
                                            borderRadius: 10,
                                            border: "1px solid #E0E0E0",
                                            padding: "10px 12px",
                                            outline: "none",
                                        }}
                                    />
                                </label>
                            </div>

                            <div
                                style={{
                                    marginTop: 18,
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    gap: 12,
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={() => setEditOpen(false)}
                                    style={{
                                        padding: "8px 14px",
                                        borderRadius: 999,
                                        background: "#c4374c",
                                        border: "1px solid #9f2c3e",
                                        color: "white",
                                        boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
                                    }}
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    style={{
                                        padding: "8px 14px",
                                        borderRadius: 999,
                                        background: "#379e53",
                                        border: "1px solid #2d7f44",
                                        color: "white",
                                        boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
                                    }}
                                >
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Confirmación de borrado (igual que tenías) */}
            {confirm && (
                <div className="modal-overlay">
                    <div className="modal">
                        <p className="confirm-text">
                            ¿Estás seguro de querer <strong>ELIMINAR</strong> esta cuenta?
                            <br />
                            Esta acción es irreversible y se borrará todos sus datos.
                        </p>
                        <div className="modal-actions">
                            <button className="delete-btn" disabled={timer > 0} onClick={handleDelete}>
                                {timer > 0 ? `Eliminar cuenta (${timer})` : "Eliminar cuenta"}
                            </button>
                            <button className="back-btn" onClick={() => setConfirm(false)}>
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Legales (usa tu <Modal/> existente) */}
            {legalOpen === "terms" && (
                <Modal open onClose={() => setLegalOpen(null)} title="Términos y condiciones">
                    <TermsContent />
                </Modal>
            )}
            {legalOpen === "data" && (
                <Modal open onClose={() => setLegalOpen(null)} title="Tratamiento de datos">
                    <DataPolicyContent />
                </Modal>
            )}

            {error ? <p role="alert" style={{ color: "#c4374c" }}>{error}</p> : null}
        </div>
    );
}
