import { useEffect, useState } from "react";
import "../index.css";

// helpers estables
const getTodayISO = () => new Date().toISOString().substring(0, 10);
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");

// obtiene la fecha de creación de la meta como YYYY-MM-DD (soporta string o array)
const getGoalCreationISO = (goal) => {
    const raw = Array.isArray(goal?.fecha) ? goal.fecha[0] : goal?.fecha;
    return raw ? String(raw).slice(0, 10) : null;
};

export default function EntryModal({ open, goal, onClose, onSave }) {
    const [data, setData] = useState({
        fecha: getTodayISO(),
        valorBool: null,
        valorNum: "",
    });

    // cuando se abre, inicializa la fecha como max(hoy, fechaCreaciónMeta)
    useEffect(() => {
        if (open && goal) {
            const min = getGoalCreationISO(goal) || getTodayISO();
            const today = getTodayISO();
            const start = today >= min ? today : min;
            setData({ fecha: start, valorBool: null, valorNum: "" });
        }
        if (!open) {
            // al cerrar, deja el estado "limpio"
            setData({ fecha: getTodayISO(), valorBool: null, valorNum: "" });
        }
    }, [open, goal]);

    if (!open || !goal) return null;

    const minDate = getGoalCreationISO(goal) || getTodayISO();

    const submit = (e) => {
        e.preventDefault();
        onSave(data);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <h2 style={{ margin: 0 }}>{goal.nombre}</h2>
                    <span style={{ fontWeight: 600 }}>
            {goal.duracionUnidad === "Indefinido"
                ? "Indefinido"
                : `${goal.duracionValor} ${cap(goal.duracionUnidad)}`}
          </span>
                </div>

                {goal.tipo === "Num" && (
                    <p style={{ textAlign: "center", margin: "0.5rem 0 1rem 0" }}>
                        Objetivo: <strong>{goal.valorObjetivo} {goal.unidad}</strong>
                    </p>
                )}

                <form onSubmit={submit}>
                    {goal.tipo === "Bool" ? (
                        <label style={{ display: "block", marginBottom: "1rem" }}>
                            Valor*:
                            <div style={{ display: "flex", gap: "1rem", marginTop: ".4rem" }}>
                                <label>
                                    <input
                                        type="radio"
                                        checked={data.valorBool === true}
                                        onChange={() => setData({ ...data, valorBool: true })}
                                    />{" "}
                                    True
                                </label>
                                <label>
                                    <input
                                        type="radio"
                                        checked={data.valorBool === false}
                                        onChange={() => setData({ ...data, valorBool: false })}
                                    />{" "}
                                    False
                                </label>
                            </div>
                        </label>
                    ) : (
                        <label style={{ display: "block", marginBottom: "1rem" }}>
                            Valor*:
                            <div style={{ display: "flex", alignItems: "center", gap: ".4rem", marginTop: ".4rem" }}>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    required
                                    className="short"
                                    value={data.valorNum}
                                    onChange={(e) => setData({ ...data, valorNum: e.target.value })}
                                />
                                <span>{goal.unidad}</span>
                            </div>
                        </label>
                    )}

                    <label style={{ display: "block", marginBottom: "1rem" }}>
                        Fecha:
                        <input
                            type="date"
                            className="fecha-input"
                            value={data.fecha}
                            min={minDate}                // ← ¡restricción aquí!
                            onChange={(e) => setData({ ...data, fecha: e.target.value })}
                        />
                    </label>

                    <div style={{ display: "flex", gap: "1rem" }}>
                        <button type="button" onClick={onClose}>Cancelar</button>
                        <button type="submit">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
