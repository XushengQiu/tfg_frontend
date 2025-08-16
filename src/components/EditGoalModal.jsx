import { useEffect, useState } from "react";
import "../index.css";

export default function EditGoalModal({ open, goal, onClose, onSave }) {
    const [form, setForm] = useState({
        nombre: "",
        descripcion: "",
        periodoIndef: false,
        periodoNum: "",
        periodoUnit: "dias", // dias|semanas|meses|años
        objetivoNum: "",
        objetivoUnidad: "",
    });

    useEffect(() => {
        if (open && goal) {
            setForm({
                nombre: goal.nombre,
                descripcion: goal.descripcion ?? "",
                periodoIndef: goal.duracionUnidad === "Indefinido",
                periodoNum: goal.duracionUnidad === "Indefinido" ? "" : goal.duracionValor,
                periodoUnit:
                    goal.duracionUnidad === "Indefinido" ? "dias" : goal.duracionUnidad.toLowerCase(),
                objetivoNum: goal.tipo === "Num" ? goal.valorObjetivo : "",
                objetivoUnidad: goal.tipo === "Num" ? goal.unidad : "",
            });
        }
    }, [open, goal]);

    if (!open || !goal) return null;

    const submit = (e) => {
        e.preventDefault();
        onSave(form); // el padre hará el diff y llamará a la API
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h3>Editar meta ({goal.tipo})</h3>

                <form onSubmit={submit}>
                    <label>
                        Nombre:
                        <input
                            value={form.nombre}
                            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                            minLength={1}
                            maxLength={50}
                            required
                        />
                    </label>

                    <label>
                        Descripción:
                        <textarea
                            rows={3}
                            value={form.descripcion}
                            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                            maxLength={300}
                        />
                    </label>

                    <label>
                        Duración:
                        <div style={{ display: "flex", gap: ".5rem", alignItems: "center" }}>
                            <input
                                type="number"
                                className="short"
                                disabled={form.periodoIndef}
                                required={!form.periodoIndef}
                                value={form.periodoNum}
                                onChange={(e) => setForm({ ...form, periodoNum: e.target.value })}
                                min="1"
                                max="10000"
                                step="1"
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
                                    onChange={(e) =>
                                        setForm({ ...form, periodoIndef: e.target.checked })
                                    }
                                />
                                Indefinido
                            </label>
                        </div>
                    </label>

                    {goal.tipo === "Num" && (
                        <>
                            <label>
                                Valor objetivo:
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    step="0.01"
                                    min="0.01"
                                    max="9999999999999.99"
                                    value={form.objetivoNum}
                                    onChange={(e) => setForm({ ...form, objetivoNum: e.target.value })}
                                    required
                                />
                            </label>

                            <label>
                                Unidad:
                                <input
                                    value={form.objetivoUnidad}
                                    onChange={(e) => setForm({ ...form, objetivoUnidad: e.target.value })}
                                    minLength={1}
                                    maxLength={20}
                                    required
                                />
                            </label>
                        </>
                    )}

                    <div style={{ marginTop: "1rem", display: "flex", gap: "1rem" }}>
                        <button type="button" onClick={onClose}>Cancelar</button>
                        <button type="submit">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
