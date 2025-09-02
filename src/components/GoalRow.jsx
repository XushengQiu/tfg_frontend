// src/components/GoalRow.jsx
import React from "react";
import { capitalize } from "../utils/format";
import "../index.css";

export default function GoalRow({
                                    goal,
                                    selected = false,        // ← marcar fila activa (se pinta en gris)
                                    createdLabel,
                                    objectiveLabel,
                                    onSelect,
                                    onEntry,
                                    onFinalize,
                                    onEdit,
                                    onDelete,
                                }) {
    return (
        <tr
            className={`goal-row ${selected ? "selected" : ""}`}
            onClick={() => onSelect(goal)}
        >
            <td className="goal-cell">{goal.nombre}</td>

            <td className="goal-cell">{createdLabel(goal)}</td>

            <td className="goal-cell">
                {goal.duracionUnidad === "Indefinido"
                    ? "Indefinido"
                    : `${goal.duracionValor} ${capitalize(goal.duracionUnidad)}`}
            </td>

            <td className="goal-cell">{objectiveLabel(goal)}</td>

            {/* Acciones: sin flex en el <td>; lo movemos a un contenedor interno */}
            <td className="goal-cell">
                <div className="goal-actions">
                    {!goal.finalizado && (
                        <button
                            id={`tour-row-entry-${goal._id}`}
                            className="btn btn--primary btn--sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                onEntry(goal);
                            }}
                        >
                            Registro
                        </button>
                    )}

                    {goal.finalizado ? (
                        <>
              <span style={{ color: "green", fontWeight: 600 }}>
                COMPLETADA
              </span>
                            <button
                                className="btn btn--danger btn--sm"
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
                                id={`tour-row-finalize-${goal._id}`}
                                className="btn btn--warn btn--sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onFinalize(goal._id);
                                }}
                            >
                                Finalizar
                            </button>
                            <button
                                id={`tour-row-edit-${goal._id}`}
                                className="btn btn--muted btn--sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(goal);
                                }}
                            >
                                Editar
                            </button>
                            <button
                                id={`tour-row-delete-${goal._id}`}
                                className="btn btn--danger btn--sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(goal._id);
                                }}
                            >
                            Eliminar
                            </button>
                        </>
                    )}
                </div>
            </td>
        </tr>
    );
}
