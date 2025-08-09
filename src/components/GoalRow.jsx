// src/components/GoalRow.jsx
import React from "react";
import { capitalize } from "../utils/format";
import "../index.css";

export default function GoalRow({
                                    goal,
                                    createdLabel,   // ← NUEVO: (goal) => string
                                    objectiveLabel, // ya existente
                                    onSelect,
                                    onEntry,
                                    onFinalize,
                                    onEdit,
                                    onDelete,
                                }) {
    return (
        <tr
            className={`goal-row ${goal.finalizado ? "goal-row-finalizada" : ""}`}
            onClick={() => onSelect(goal)}
        >
            <td className="goal-cell">{goal.nombre}</td>

            {/* NUEVA COLUMNA: Fecha de creación */}
            <td className="goal-cell">{createdLabel(goal)}</td>

            <td className="goal-cell">
                {goal.duracionUnidad === "Indefinido"
                    ? "Indefinido"
                    : `${goal.duracionValor} ${capitalize(goal.duracionUnidad)}`}
            </td>

            <td className="goal-cell">{objectiveLabel(goal)}</td>

            <td className="goal-cell" style={{ display: "flex", gap: ".4rem" }}>
                {!goal.finalizado && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onEntry(goal);
                        }}
                    >
                        Entrada
                    </button>
                )}

                {goal.finalizado ? (
                    <>
                        <span style={{ color: "green", fontWeight: 600 }}>COMPLETADA</span>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(goal._id);
                            }}
                        >
                            Eliminar
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onFinalize(goal._id);
                            }}
                        >
                            Finalizar
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(goal);
                            }}
                        >
                            Editar
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(goal._id);
                            }}
                        >
                            Eliminar
                        </button>
                    </>
                )}
            </td>
        </tr>
    );
}
