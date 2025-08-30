// src/components/EditGoalModal.jsx
import { useEffect, useState } from "react";
import "../index.css";

// Helper para oscurecer un color hexadecimal (JS puro)
const darken = (hex, f = 0.18) => {
    const n = hex.replace("#", "");
    const to = (i) =>
        Math.max(0, Math.min(255, Math.floor(parseInt(n.slice(i, i + 2), 16) * (1 - f))));
    return `rgb(${to(0)}, ${to(2)}, ${to(4)})`;
};


export default function EditGoalModal({ open, goal, onClose, onSave }) {
    const [form, setForm] = useState({
        nombre: "",
        descripcion: "",
        periodoIndef: false,
        periodoNum: "",
        periodoUnit: "dias",
        objetivoNum: "",
        objetivoUnidad: "",
    });

    useEffect(() => {
        if (open && goal) {
            setForm({
                nombre: goal.nombre || "",
                descripcion: goal.descripcion ?? "",
                periodoIndef: goal.duracionUnidad === "Indefinido",
                periodoNum: goal.duracionUnidad === "Indefinido" ? "" : (goal.duracionValor ?? ""),
                periodoUnit:
                    goal.duracionUnidad === "Indefinido"
                        ? "dias"
                        : String(goal.duracionUnidad || "dias").toLowerCase(),
                objetivoNum: goal.tipo === "Num" ? (goal.valorObjetivo ?? "") : "",
                objetivoUnidad: goal.tipo === "Num" ? (goal.unidad ?? "") : "",
            });
        }
    }, [open, goal]);

    if (!open || !goal) return null;

    const submit = (e) => {
        e.preventDefault();
        onSave(form);
    };

    /* Estilo compacto + inputs “como antes” */
    const INPUT = {
        borderRadius: 6,
        border: "1px solid #E0E0E0",
        padding: "8px 10px",
        outline: "none",
    };
    const ROW = {
        display: "grid",
        gridTemplateColumns: "auto 1fr",
        gap: ".6rem",
        alignItems: "center",
    };
    const INLINE = { display: "flex", gap: ".5rem", alignItems: "center" };

    const GREEN = "#5FA868";
    const RED = "#c4374c";

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal"
                onClick={(e) => e.stopPropagation()}
                style={{ width: "min(620px, 92vw)", maxWidth: 620, padding: "18px 20px 14px", borderRadius: 14 }}
            >
                <h3 style={{ textAlign: "center", marginTop: 0, marginBottom: "10px" }}>
                    Editar meta ({goal.tipo})
                </h3>

                <form onSubmit={submit} style={{ display: "grid", gap: ".6rem" }}>
                    {/* Nombre (con espacio entre label y campo) */}
                    <label style={ROW}>
                        <span>Nombre:</span>
                        <input
                            style={INPUT}
                            value={form.nombre}
                            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                            minLength={1}
                            maxLength={50}
                            required
                        />
                    </label>

                    {/* Descripción */}
                    <label style={ROW}>
                        <span>Descripción:</span>
                        <textarea
                            rows={3}
                            style={INPUT}
                            value={form.descripcion}
                            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                            maxLength={300}
                        />
                    </label>

                    {/* Duración (misma línea) */}
                    <label style={ROW}>
                        <span>Duración:</span>
                        <div style={{ ...INLINE, opacity: form.periodoIndef ? 0.55 : 1 }}>
                            <input
                                type="number"
                                disabled={form.periodoIndef}
                                required={!form.periodoIndef}
                                value={form.periodoNum}
                                onChange={(e) => setForm({ ...form, periodoNum: e.target.value })}
                                min="1"
                                max="10000"
                                step="1"
                                style={{ ...INPUT, width: 110 }}
                            />
                            <select
                                disabled={form.periodoIndef}
                                value={form.periodoUnit}
                                onChange={(e) => setForm({ ...form, periodoUnit: e.target.value })}
                                style={INPUT}
                            >
                                <option value="dias">Días</option>
                                <option value="semanas">Semanas</option>
                                <option value="meses">Meses</option>
                                <option value="años">Años</option>
                            </select>

                            <label style={{ display: "flex", gap: ".35rem", alignItems: "center", marginLeft: ".25rem" }}>
                                <input
                                    type="checkbox"
                                    checked={form.periodoIndef}
                                    onChange={(e) => setForm({ ...form, periodoIndef: e.target.checked })}
                                />
                                Indefinido
                            </label>
                        </div>
                    </label>

                    {/* Objetivo (solo si es Num) */}
                    {goal.tipo === "Num" && (
                        <label style={ROW}>
                            <span>Objetivo:</span>
                            <div style={INLINE}>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={form.objetivoNum}
                                    onChange={(e) => setForm({ ...form, objetivoNum: e.target.value })}
                                    style={{ ...INPUT, width: 140 }}
                                />
                                <input
                                    value={form.objetivoUnidad}
                                    onChange={(e) => setForm({ ...form, objetivoUnidad: e.target.value })}
                                    placeholder="unidad"
                                    style={{ ...INPUT, width: 140 }}
                                />
                            </div>
                        </label>
                    )}

                    {/* Acciones en extremos */}
                    <div className="modal-actions" style={{ justifyContent: "space-between", marginTop: ".4rem" }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                background: RED,
                                border: `1px solid ${darken(RED)}`,
                                color: "#fff",
                                borderRadius: 999,
                                padding: "8px 14px",
                                boxShadow: "0 2px 6px rgba(0,0,0,.08)",
                            }}
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            style={{
                                background: GREEN,
                                border: `1px solid ${darken(GREEN)}`,
                                color: "#fff",
                                borderRadius: 999,
                                padding: "8px 14px",
                                boxShadow: "0 2px 6px rgba(0,0,0,.08)",
                            }}
                        >
                            Guardar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
