// src/components/GoalDetail.jsx
import React from "react";
import "../index.css";

export default function GoalDetail({ goal, fmtFecha, onDeleteRecord }) {
    if (!goal) return null;

    const canDelete = !goal.finalizado;

    return (
        <div className="goal-detail">
            {/* registros */}
            <div className="goal-registros">
                <h3>Registros</h3>

                {goal.registros?.length ? (
                    <div style={{ maxHeight: "220px", overflowY: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                            <tr>
                                <th style={{ width: "45%" }}>Fecha</th>
                                <th style={{ width: "35%" }}>
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
                                        <td>{fmtFecha(r.fecha)}</td>
                                        <td style={{ textAlign: "center" }}>
                                            {goal.tipo === "Bool" ? (r.valorBool ? "✅" : "❌") : r.valorNum}
                                        </td>
                                        <td style={{ textAlign: "center" }}>
                                            {canDelete ? (
                                                <button
                                                    style={{ background: "#e74c3c", color: "#fff" }}
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

            {/* descripción */}
            <div className="goal-descripcion">
                <h3>Descripción</h3>
                <p>{goal.descripcion || "Sin descripción."}</p>
            </div>
        </div>
    );
}
