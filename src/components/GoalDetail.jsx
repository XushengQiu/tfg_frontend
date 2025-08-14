// src/components/GoalDetail.jsx
import React from "react";
import "../index.css";

function fmtFechaDateThenWeekday(iso) {
    const d = new Date(iso);
    const fecha = d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
    const dow   = d.toLocaleDateString("es-ES", { weekday: "long" });
    return `${fecha}, ${dow}`;
}

export default function GoalDetail({ goal, fmtFecha, onDeleteRecord }) {
    if (!goal) {
        return (
            <div className="goal-detail">
                <div className="goal-registros">
                    <h3>Registros</h3>
                    <div className="registros-placeholder">
                        Seleccione una meta para ver sus registros.
                    </div>
                </div>
                <div className="goal-descripcion">
                    <h3>Meta</h3>
                    <p>—</p>

                    <h3>Descripción</h3>
                    <p>—</p>
                </div>
            </div>
        );
    }

    const canDelete = !goal.finalizado;

    return (
        <div className="goal-detail">
            {/* Registros */}
            <div className="goal-registros">
                <h3>Registros</h3>

                {goal.registros?.length ? (
                    <div style={{ maxHeight: "220px", overflowY: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                            <tr>
                                <th style={{ width: "55%" }}>Fecha</th>
                                <th style={{ width: "25%" }}>
                                    Valor {goal.tipo === "Num" && `(${goal.unidad})`}
                                </th>
                                <th style={{ width: "20%" }} />
                            </tr>
                            </thead>
                            <tbody>
                            {goal.registros
                                .slice()
                                .sort((a, b) => b.fecha.localeCompare(a.fecha))
                                .map((r) => (
                                    <tr key={r.fecha}>
                                        <td>{fmtFechaDateThenWeekday(r.fecha)}</td>
                                        <td style={{ textAlign: "center" }}>
                                            {goal.tipo === "Bool" ? (r.valorBool ? "✅" : "❌") : r.valorNum}
                                        </td>
                                        <td style={{ textAlign: "center" }}>
                                            {canDelete ? (
                                                <button
                                                    className="btn btn--danger btn--xs"
                                                    onClick={() => onDeleteRecord(goal._id, r.fecha)}
                                                >
                                                    Eliminar
                                                </button>
                                            ) : null}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="registros-placeholder">Sin registros.</div>
                )}
            </div>

            {/* Meta + Descripción */}
            <div className="goal-descripcion">
                <h3>Meta</h3>
                <p>{goal.nombre}</p>

                <h3>Descripción</h3>
                <p>{goal.descripcion || "Sin descripción."}</p>
            </div>
        </div>
    );
}
