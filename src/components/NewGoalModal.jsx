import { useState, useEffect } from "react";
import "../index.css";

// helpers estables fuera del componente
const getTodayISO = () => new Date().toISOString().substring(0, 10);
const getEmpty = () => ({
    nombre: "",
    periodoIndef: false,
    periodoNum: "",
    periodoUnit: "dias", // dias | semanas | meses | años
    tipo: "num",         // 'num' | 'bool'
    objetivoNum: "",
    objetivoUnidad: "",
    descripcion: "",
    fechaInicio: getTodayISO(),
});

export default function NewGoalModal({ open, onClose, onCreate }) {
    const [form, setForm] = useState(getEmpty());

    useEffect(() => {
        if (!open) setForm(getEmpty()); // resetea al cerrar
    }, [open]);

    if (!open) return null;

    const submit = (e) => {
        e.preventDefault();
        onCreate(form);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h2>Nueva meta</h2>

                <form onSubmit={submit}>
                    {/* Nombre */}
                    <label>
                        Nombre*:
                        <input
                            required
                            value={form.nombre}
                            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                        />
                    </label>

                    {/* Periodo */}
                    <label>
                        Periodo*:
                        <div style={{ display: "flex", gap: ".5rem", alignItems: "center" }}>
                            <input
                                type="number"
                                required={!form.periodoIndef}
                                disabled={form.periodoIndef}
                                className="short"
                                value={form.periodoNum}
                                onChange={(e) => setForm({ ...form, periodoNum: e.target.value })}
                            />
                            <select
                                disabled={form.periodoIndef}
                                value={form.periodoUnit}
                                onChange={(e) => setForm({ ...form, periodoUnit: e.target.value })}
                            >
                                <option value="dias">Días</option>
                                <option value="semanas">Semanas</option>
                                <option value="meses">Meses</option>
                                <option value="años">Años</option>
                            </select>
                            <label style={{ display: "flex", gap: ".3rem" }}>
                                <input
                                    type="checkbox"
                                    checked={form.periodoIndef}
                                    onChange={(e) => setForm({ ...form, periodoIndef: e.target.checked })}
                                />
                                Indefinido
                            </label>
                        </div>
                    </label>

                    {/* Objetivo */}
                    <label>
                        Objetivo*:
                        <div style={{ display: "flex", gap: ".5rem", alignItems: "center" }}>
                            <input
                                type="number"
                                required={form.tipo === "num"}
                                disabled={form.tipo !== "num"}
                                className="short"
                                value={form.objetivoNum}
                                onChange={(e) =>
                                    setForm({ ...form, objetivoNum: e.target.value, tipo: "num" })
                                }
                            />
                            <input
                                type="text"
                                required={form.tipo === "num"}
                                disabled={form.tipo !== "num"}
                                className="medium"
                                placeholder="unidad"
                                value={form.objetivoUnidad}
                                onChange={(e) =>
                                    setForm({ ...form, objetivoUnidad: e.target.value, tipo: "num" })
                                }
                            />
                            <label style={{ display: "flex", gap: ".3rem" }}>
                                <input
                                    type="checkbox"
                                    checked={form.tipo === "bool"}
                                    onChange={(e) =>
                                        setForm({ ...form, tipo: e.target.checked ? "bool" : "num" })
                                    }
                                />
                                Boolean
                            </label>
                        </div>
                    </label>

                    {/* Fecha */}
                    <label className="fecha-wrapper">
                        Fecha inicio:
                        <input
                            type="date"
                            className="fecha-input"
                            value={form.fechaInicio}
                            onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })}
                        />
                    </label>

                    {/* Descripción */}
                    <label>
                        Descripción:
                        <textarea
                            rows={3}
                            value={form.descripcion}
                            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                        />
                    </label>

                    {/* Acciones */}
                    <div style={{ marginTop: "1rem", display: "flex", gap: "1rem" }}>
                        <button type="button" onClick={onClose}>Cancelar</button>
                        <button type="submit">Crear</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
