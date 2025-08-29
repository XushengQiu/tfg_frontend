import { useEffect, useState } from "react";
import "../index.css";

// helpers
const getTodayISO = () => new Date().toISOString().substring(0, 10);
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");

// fecha creación de la meta como YYYY-MM-DD (soporta string o array)
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

    // al abrir: fecha = max(hoy, fechaCreaciónMeta)
    useEffect(() => {
        if (open && goal) {
            const min = getGoalCreationISO(goal) || getTodayISO();
            const today = getTodayISO();
            const start = today >= min ? today : min;
            setData((d) => ({ ...d, fecha: start }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, goal?._id]);

    if (!open || !goal) return null;

    const minDate = getGoalCreationISO(goal) || getTodayISO();

    const submit = (e) => {
        e.preventDefault();
        onSave(data);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal entry-modal" onClick={(e) => e.stopPropagation()}>
                {/* Cabecera con más espacio bajo el título */}
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: ".9rem" }}>
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
                            ¿Has completado tu objetivo?
                            <div style={{ display: "flex", gap: "1rem", marginTop: ".4rem" }}>
                                <label>
                                    <input
                                        type="radio"
                                        checked={data.valorBool === true}
                                        onChange={() => setData({ ...data, valorBool: true })}
                                    />{" "}
                                    Sí
                                </label>
                                <label>
                                    <input
                                        type="radio"
                                        checked={data.valorBool === false}
                                        onChange={() => setData({ ...data, valorBool: false })}
                                    />{" "}
                                    No
                                </label>
                            </div>
                        </label>
                    ) : (
                        <label style={{ display: "block", marginBottom: "1rem" }}>
                            Valor*:
                            <div style={{ display: "flex", alignItems: "center", gap: ".4rem", marginTop: ".4rem" }}>
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    step="0.01"
                                    min="0.01"
                                    max="9999999999999.99"
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
                            min={minDate}
                            onChange={(e) => setData({ ...data, fecha: e.target.value })}
                        />
                    </label>

                    {/* Botones en los extremos, con colores suaves */}
                    <div className="modal-actions" style={{ justifyContent: "space-between" }}>
                        <button type="button" className="btn-soft-danger" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-soft-success">
                            Guardar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
